# CLAUDE.md — Forms: Complete Implementation

## Context and scope

This session completes the forms feature across all three apps. Every gap identified
in the current state report must be closed. The plan is unambiguous on all four
questions — answers are derived directly from the spec, not from preference.

**Do NOT modify:** docker-compose.yml, nginx/nginx.conf, any Prisma migration files
already committed. Do NOT add new Prisma models — the schema is complete.

---

## Committed deviations that affect this session

- `REDIS_CLIENT` token (not `@InjectRedis()`) for Redis DI
- `@Global()` on CacheModule and AuditModule — do NOT import them in FormsModule
- AWS SDK v3 command pattern (`s3.send(new Command(...))`)
- BullMQ retry config at `queue.add()` level, not Worker constructor
- `AdminThrottlerGuard` is the global APP_GUARD — forms submit endpoint uses
  `@SkipThrottle({ default: true, auth: true, public: true })` with only the
  `form` throttler active (5/10min per IP)
- `EmailProcessor` was a stub — this session wires it fully
- `FormFieldSchema` type enum: `'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox'`

---

## Change 1 — `apps/api`: fix `findAllForms()` to include submission count

**File:** `apps/api/src/forms/forms.service.ts`

In `findAllForms()`, add `_count: { select: { submissions: true } }` to the
Prisma query include/select block so the admin list page can display the
submission count per form without a separate request.

```typescript
async findAllForms() {
  return this.prisma.formDefinition.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { submissions: true } },
    },
  });
}
```

---

## Change 2 — `apps/api`: wire Turnstile server-side verification

**Background:** The plan requires Cloudflare Turnstile on every public form.
`turnstileToken` is already in `SubmitFormSchema` and collected from the frontend.
The server currently ignores it. This must be verified.

**Add env var to `.env.example`** (if not already present):
```bash
# Cloudflare Turnstile secret key.
# Dev/test value (always passes): 1x0000000000000000000000000000000AA
# Never use test keys in production.
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

**Create `apps/api/src/forms/turnstile.service.ts`:**
```typescript
import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class TurnstileService {
  constructor(
    @InjectPinoLogger(TurnstileService.name)
    private readonly logger: PinoLogger,
  ) {}

  async verify(token: string | undefined, ip: string): Promise<boolean> {
    const secret = process.env.TURNSTILE_SECRET_KEY;

    // If no secret configured, skip verification (allows local dev without Turnstile)
    if (!secret) {
      this.logger.warn('TURNSTILE_SECRET_KEY not set — skipping verification');
      return true;
    }

    // Empty token with a configured secret is a hard rejection
    if (!token) return false;

    try {
      const res = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ secret, response: token, remoteip: ip }),
          signal: AbortSignal.timeout(5000),
        },
      );
      const body = await res.json() as { success: boolean };
      return body.success === true;
    } catch (err) {
      // Network failure to Cloudflare — log and fail open (do not block submissions
      // because Cloudflare is unreachable; this is consistent with Turnstile's own
      // recommendation for server-side failures)
      this.logger.error({ err }, 'Turnstile verification request failed');
      return true;
    }
  }
}
```

**Register `TurnstileService` in `FormsModule` providers.**

**Update `FormsService.submit()` to call verification:**
```typescript
async submit(slug: string, dto: SubmitFormDto, ip: string, userAgent: string) {
  // ... existing FormDefinition lookup ...

  // Honeypot check (existing)
  if (dto._honeypot) {
    return { success: true }; // silent reject — return 200
  }

  // Turnstile verification (NEW)
  const turnstileValid = await this.turnstileService.verify(dto.turnstileToken, ip);
  if (!turnstileValid) {
    // Return 422 so the frontend can show a "Please complete the CAPTCHA" message
    throw new UnprocessableEntityException('Captcha verification failed');
  }

  // consentGiven check (existing)
  // ... rest of submission logic ...
}
```

---

## Change 3 — `apps/api`: wire `EmailProcessor` via nodemailer + MailHog

**Background:** The plan requires email notification via MailHog in dev.
`EmailProcessor` currently only logs. Wire it fully.

**Add deps to `apps/api/package.json`:**
```json
"nodemailer": "^6.9.0",
"@types/nodemailer": "^6.4.0"
```

**Add env vars to `.env.example`:**
```bash
# SMTP configuration (MailHog in dev)
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_FROM=noreply@krontech.com
# Leave SMTP_USER and SMTP_PASS blank for MailHog (no auth)
SMTP_USER=
SMTP_PASS=
```

**Add to `docker-compose.yml` web service environment block** — actually these go
to the `api` service environment:
```yaml
api:
  environment:
    # ... existing vars ...
    SMTP_HOST: ${SMTP_HOST}
    SMTP_PORT: ${SMTP_PORT}
    SMTP_FROM: ${SMTP_FROM}
    SMTP_USER: ${SMTP_USER}
    SMTP_PASS: ${SMTP_PASS}
```

**Implement `EmailProcessor`:**
```typescript
// apps/api/src/forms/queue/email.processor.ts
import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

interface EmailJobPayload {
  to: string;
  subject: string;
  formName: string;
  submissionData: Record<string, unknown>;
  submittedAt: string;
}

@Injectable()
export class EmailProcessor implements OnApplicationShutdown {
  private readonly worker: Worker;
  private readonly transporter: nodemailer.Transporter;

  constructor(
    @InjectPinoLogger(EmailProcessor.name)
    private readonly logger: PinoLogger,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'mailhog',
      port: parseInt(process.env.SMTP_PORT ?? '1025', 10),
      secure: false,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });

    this.worker = new Worker(
      'email',
      async (job: Job<EmailJobPayload>) => {
        const { to, subject, formName, submissionData, submittedAt } = job.data;

        const textBody = [
          `New submission for: ${formName}`,
          `Submitted at: ${submittedAt}`,
          '',
          'Fields:',
          ...Object.entries(submissionData).map(([k, v]) => `  ${k}: ${String(v)}`),
        ].join('\n');

        await this.transporter.sendMail({
          from: process.env.SMTP_FROM ?? 'noreply@krontech.com',
          to,
          subject,
          text: textBody,
        });

        this.logger.info({ to, formName }, 'Email notification sent');
      },
      {
        connection: {
          host: process.env.REDIS_HOST ?? 'redis',
          port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        },
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        { jobId: job?.id, attempt: job?.attemptsMade, err },
        'Email job failed',
      );
    });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.worker.close();
  }
}
```

**Update `FormsService.submit()` email job dispatch** to include the payload
fields the worker expects:
```typescript
if (form.notifyEmail) {
  await this.emailQueue.add(
    'notify',
    {
      to: form.notifyEmail,
      subject: `New submission: ${form.name}`,
      formName: form.name,
      submissionData: dto.data as Record<string, unknown>,
      submittedAt: new Date().toISOString(),
    } satisfies EmailJobPayload,
    { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
  );
}
```

---

## Change 4 — `apps/api`: add CSV export endpoint

**Background:** Plan requires `GET /api/v1/forms/:id/submissions/export` → CSV download.

**Add to `FormsController`:**
```typescript
@Get(':id/submissions/export')
@Header('Content-Type', 'text/csv')
@Header('Content-Disposition', 'attachment; filename="submissions.csv"')
async exportSubmissions(
  @Param('id') id: string,
): Promise<StreamableFile> {
  const csv = await this.formsService.exportSubmissionsCsv(id);
  return new StreamableFile(Buffer.from(csv, 'utf-8'));
}
```

**Add `exportSubmissionsCsv(formId)` to `FormsService`:**
```typescript
async exportSubmissionsCsv(formId: string): Promise<string> {
  const form = await this.prisma.formDefinition.findUniqueOrThrow({
    where: { id: formId },
    include: { submissions: { orderBy: { createdAt: 'desc' } } },
  });

  const fields = (form.fields as FormField[]).map(f => f.name);
  const headers = ['id', 'submittedAt', 'ip', 'consentGiven', ...fields];

  const rows = form.submissions.map(s => {
    const data = s.data as Record<string, unknown>;
    const values = fields.map(f => JSON.stringify(data[f] ?? ''));
    return [
      s.id,
      s.createdAt.toISOString(),
      s.ip,
      String(s.consentGiven),
      ...values,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
```

---

## Change 5 — `apps/admin`: form management CRUD

**Background:** Plan requires "create new form (define fields, validation, consent)".
Currently only list and view-submissions exist.

### 5a — Form list page

Update `apps/admin/src/app/forms/page.tsx` to show submission count from
`_count.submissions` (now returned by the API after Change 1).

### 5b — Form create/edit page

Create `apps/admin/src/app/forms/create/page.tsx` (and `[id]/edit/page.tsx`
sharing the same `FormEditor` component).

**`FormEditor` component — field builder UI:**

The field builder renders a list of field rows. Each row has:
- **Type** selector: `text | email | phone | select | textarea | checkbox`
- **Name** input: the programmatic field name (e.g. `firstName`, `kvkk`)
- **Label TR** input: bilingual label for Turkish
- **Label EN** input: bilingual label for English
- **Required** toggle
- **Options** (shown only when type = `select`): add/remove option rows,
  each with a value and bilingual label
- **Max length** (shown only for `text` and `textarea`): optional number input
- **Remove field** button (×)

Below the field list: **"Add field" button** that appends a new row with defaults.

**KVKK and GDPR consent field pattern (required for evaluators):**

When creating a form, the builder must include a dedicated "Add consent field"
button that pre-fills a `checkbox` type field with:
```
name: "kvkk"
type: "checkbox"
label: { tr: "KVKK kapsamında kişisel verilerimin işlenmesine onay veriyorum.", en: "I consent to the processing of my personal data under KVKK." }
required: true
```

And a second button "Add GDPR field" that pre-fills:
```
name: "gdpr"
type: "checkbox"
label: { tr: "GDPR kapsamında kişisel verilerimin işlenmesine onay veriyorum.", en: "I consent to the processing of my personal data under GDPR." }
required: true
```

These are shortcuts, not a separate system — they add a regular `checkbox` field
to the fields array with the appropriate pre-filled values. The user can edit them
after adding.

**Full `FormEditor` component structure:**
```typescript
// apps/admin/src/components/forms/FormEditor.tsx
'use client';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateFormSchema } from '@krontech/types';
import type { z } from 'zod';

type FormValues = z.infer<typeof CreateFormSchema>;

interface FormEditorProps {
  initialData?: Partial<FormValues>;
  onSubmit: (data: FormValues) => Promise<void>;
  submitLabel: string;
}

export function FormEditor({ initialData, onSubmit, submitLabel }: FormEditorProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(CreateFormSchema),
    defaultValues: initialData ?? {
      name: '',
      slug: '',
      fields: [],
      webhookUrl: null,
      notifyEmail: null,
      isActive: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'fields',
  });

  const addConsentField = (type: 'kvkk' | 'gdpr') => {
    const presets = {
      kvkk: {
        name: 'kvkk',
        type: 'checkbox' as const,
        label: {
          tr: 'KVKK kapsamında kişisel verilerimin işlenmesine onay veriyorum.',
          en: 'I consent to the processing of my personal data under KVKK.',
        },
        required: true,
      },
      gdpr: {
        name: 'gdpr',
        type: 'checkbox' as const,
        label: {
          tr: 'GDPR kapsamında kişisel verilerimin işlenmesine onay veriyorum.',
          en: 'I consent to the processing of my personal data under GDPR.',
        },
        required: true,
      },
    };
    append(presets[type]);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form metadata: name, slug, webhookUrl, notifyEmail, isActive toggle */}

      {/* Field builder */}
      <div>
        <h3>Fields</h3>
        {fields.map((field, index) => (
          <FieldRow
            key={field.id}
            index={index}
            form={form}
            onRemove={() => remove(index)}
          />
        ))}

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => append({
              name: '', type: 'text', label: { tr: '', en: '' }, required: false,
            })}
          >
            + Add field
          </button>
          <button type="button" onClick={() => addConsentField('kvkk')}>
            + KVKK consent
          </button>
          <button type="button" onClick={() => addConsentField('gdpr')}>
            + GDPR consent
          </button>
        </div>
      </div>

      <button type="submit">{submitLabel}</button>
    </form>
  );
}
```

**`FieldRow` sub-component** handles the per-field UI. When `type === 'select'`,
show a nested `useFieldArray` for options. When `type === 'text'` or `textarea`,
show the optional maxLength input.

### 5c — Delete confirmation

Add a delete button on the form list page. On click, show a simple confirmation
(`window.confirm` is acceptable here — this is an admin action not visible to end users).
Call `DELETE /api/v1/forms/:id`. After deletion, refetch the list.

---

## Change 6 — `apps/web`: dynamic form rendering from FormDefinition

**Background:** Plan states "Consent text is stored in the FormDefinition, not hardcoded
in the frontend." This is not optional — it is a spec requirement.

### 6a — Create a generic `DynamicForm` component

**File:** `apps/web/src/components/shared/DynamicForm.tsx`

This component fetches `GET /api/v1/public/forms/:slug` to get the form definition,
then renders each field based on its `type`. It handles submission to
`POST /api/v1/public/forms/:slug/submit`.

```typescript
'use client';
import { useForm } from 'react-hook-form';

interface DynamicFormProps {
  slug: string;           // 'contact' or 'demo'
  locale: 'tr' | 'en';
  className?: string;
}

export function DynamicForm({ slug, locale, className }: DynamicFormProps) {
  const [formDef, setFormDef] = useState<FormDefinition | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/public/forms/${slug}`)
      .then(r => r.json())
      .then(setFormDef)
      .catch(() => setFormDef(null));
  }, [slug]);

  const onSubmit = async (data: Record<string, unknown>) => {
    // Extract all checkbox fields as potential consent fields
    // consentGiven = true only if ALL required checkbox fields are checked
    const requiredCheckboxes = formDef?.fields
      .filter(f => f.type === 'checkbox' && f.required)
      .map(f => f.name) ?? [];

    const allConsentGiven = requiredCheckboxes.every(name => data[name] === true);
    if (!allConsentGiven) {
      form.setError('root', { message: 'Please accept all required consents.' });
      return;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/public/forms/${slug}/submit`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          consentGiven: true,   // server validates this based on schema
          _honeypot: '',
          // turnstileToken: provided by Turnstile widget (see below)
        }),
      },
    );

    if (res.ok) {
      setSuccess(true);
    } else if (res.status === 422) {
      const body = await res.json() as { errors?: Record<string, string> };
      if (body.errors) {
        Object.entries(body.errors).forEach(([field, message]) => {
          form.setError(field, { message });
        });
      }
    } else {
      setSubmitError('Submission failed. Please try again.');
    }
  };

  if (!formDef) return <div>Loading...</div>;
  if (success) return <div>Thank you! Your submission has been received.</div>;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={className}>
      {formDef.fields.map(field => (
        <FieldRenderer key={field.name} field={field} locale={locale} form={form} />
      ))}
      {form.formState.errors.root && (
        <p className="text-error">{form.formState.errors.root.message}</p>
      )}
      {submitError && <p className="text-error">{submitError}</p>}
      <button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Sending...' : (locale === 'tr' ? 'Gönder' : 'Submit')}
      </button>
    </form>
  );
}
```

**`FieldRenderer` sub-component** renders the correct HTML element per field type:
- `text`, `email`, `phone` → `<input type={field.type}>`
- `textarea` → `<textarea>`
- `select` → `<select>` with `<option>` per item in `field.options`
- `checkbox` → `<input type="checkbox">` — renders the bilingual consent text
  as a `<label>` using `field.label[locale]`

All fields render with `<label htmlFor={field.name}>` using `field.label[locale]`.
Required fields render inline error messages via `form.formState.errors[field.name]`.

### 6b — Replace hardcoded ContactForm with DynamicForm

**File:** `apps/web/src/components/shared/ContactForm.tsx`

Replace the hardcoded form implementation with:
```typescript
import { DynamicForm } from './DynamicForm';

export function ContactForm({ locale }: { locale: Locale }) {
  return <DynamicForm slug="contact" locale={locale} className="dark-form" />;
}
```

Keep the dark-form CSS class and existing visual styling. Only the data source changes.

### 6c — Replace DemoRequestForm with DynamicForm

**File:** `apps/web/src/components/shared/DemoRequestForm.tsx`

```typescript
import { DynamicForm } from './DynamicForm';

export function DemoRequestForm({ locale }: { locale: Locale }) {
  return <DynamicForm slug="demo" locale={locale} />;
}
```

The product interest select field is now defined in the `demo` FormDefinition's
`fields` array (seeded with options from the 6 products). This removes the fixture
import entirely (Q3 answer: yes, fix this by defining the options in the seed).

### 6d — Update seed to include product interest options

**File:** `apps/api/prisma/seed.ts`

Update the `demo` FormDefinition upsert to include a `select` field for product interest
with the 6 seeded products as options:

```typescript
await prisma.formDefinition.upsert({
  where: { slug: 'demo' },
  update: {},
  create: {
    name: 'Demo Request',
    slug: 'demo',
    fields: [
      {
        name: 'company',
        type: 'text',
        label: { tr: 'Şirket Adı', en: 'Company Name' },
        required: true,
        maxLength: 100,
      },
      {
        name: 'name',
        type: 'text',
        label: { tr: 'Ad Soyad', en: 'Full Name' },
        required: true,
        maxLength: 100,
      },
      {
        name: 'email',
        type: 'email',
        label: { tr: 'E-posta', en: 'Email' },
        required: true,
      },
      {
        name: 'phone',
        type: 'phone',
        label: { tr: 'Telefon', en: 'Phone' },
        required: false,
      },
      {
        name: 'productInterest',
        type: 'select',
        label: { tr: 'İlgilendiğiniz Ürün', en: 'Product of Interest' },
        required: false,
        options: [
          { value: 'pam', label: { tr: 'PAM', en: 'PAM' } },
          { value: 'dam', label: { tr: 'DAM', en: 'DAM' } },
          { value: 'ddm', label: { tr: 'DDM', en: 'DDM' } },
          { value: 'qa',  label: { tr: 'QA', en: 'QA' } },
          { value: 'aaa', label: { tr: 'AAA', en: 'AAA' } },
          { value: 'tlmp',label: { tr: 'TLMP', en: 'TLMP' } },
        ],
      },
      {
        name: 'message',
        type: 'textarea',
        label: { tr: 'Mesaj', en: 'Message' },
        required: false,
        maxLength: 1000,
      },
      {
        name: 'kvkk',
        type: 'checkbox',
        label: {
          tr: 'KVKK kapsamında kişisel verilerimin işlenmesine onay veriyorum.',
          en: 'I consent to the processing of my personal data under KVKK.',
        },
        required: true,
      },
    ],
    isActive: true,
  },
});
```

Update the `contact` FormDefinition similarly to include a `kvkk` checkbox field
and the correct contact-specific fields (firstName, lastName, email, subject,
message, kvkk).

---

## Change 7 — Turnstile widget on public forms

**Background:** Plan requires Cloudflare Turnstile (invisible) on every public form.

Add the Turnstile widget to `DynamicForm`. Use the invisible widget mode — it
triggers automatically on form submit without user interaction.

**Add env var to `apps/web/.env.example`:**
```bash
# BUILD-TIME — baked into JS bundle
# Dev/test site key (always passes): 1x00000000000000000000AA
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

**Add to `apps/web/Dockerfile` build args** and `docker-compose.yml` web service
build args:
```yaml
args:
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: ${NEXT_PUBLIC_TURNSTILE_SITE_KEY}
```

**In `DynamicForm`**, add the Turnstile widget using the `@marsidev/react-turnstile`
package (or load the script manually with a ref):

```typescript
import Turnstile from '@marsidev/react-turnstile';

// Inside the component, add state:
const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined);

// In onSubmit, include turnstileToken:
body: JSON.stringify({
  data,
  consentGiven: true,
  _honeypot: '',
  turnstileToken,
}),

// In JSX, render before the submit button:
<Turnstile
  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''}
  onSuccess={setTurnstileToken}
  onExpire={() => setTurnstileToken(undefined)}
  options={{ appearance: 'interaction-only' }}
/>
```

`interaction-only` mode shows the widget only if Cloudflare suspects the user is
a bot — otherwise invisible. The test site key `1x00000000000000000000AA` always
passes silently.

---

## Change 8 — Admin: submissions export button

In the form submissions view page (`apps/admin/src/app/forms/[id]/submissions/page.tsx`),
add an "Export CSV" button that calls `GET /api/v1/forms/:id/submissions/export` and
triggers a browser download:

```typescript
const handleExport = () => {
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/v1/forms/${formId}/submissions/export`;
};

<button onClick={handleExport}>Export CSV</button>
```

This uses `window.location.href` rather than `fetch` because the browser handles
the `Content-Disposition: attachment` header natively and triggers the file download.

---

## Verification checklist

After all changes:

```bash
# 1. Reseed (FormDefinition records updated with new field definitions)
docker compose exec api sh -c "cd /app/apps/api && FORCE_SEED=1 npx prisma db seed"

# 2. Restart to pick up SMTP env vars (if added to compose)
docker compose restart api

# 3. TypeScript gate
pnpm turbo run typecheck
# Zero errors

# 4. Verify form endpoints
curl http://localhost/api/v1/public/forms/contact         # 200, returns FormDefinition with fields
curl http://localhost/api/v1/public/forms/demo            # 200, includes productInterest select options

# 5. Submit contact form — must create a FormSubmission record
curl -X POST http://localhost/api/v1/public/forms/contact/submit \
  -H "Content-Type: application/json" \
  -d '{"data":{"firstName":"Test","email":"test@test.com","message":"Hello"},"consentGiven":true,"_honeypot":"","turnstileToken":""}'
# Expected: { "success": true }

# 6. Verify submission saved
# Login to admin → Forms → Contact → Submissions → test submission must appear

# 7. Test honeypot rejection (silently returns 200 but does NOT save)
curl -X POST http://localhost/api/v1/public/forms/contact/submit \
  -H "Content-Type: application/json" \
  -d '{"data":{"firstName":"Bot"},"consentGiven":true,"_honeypot":"filled by bot","turnstileToken":""}'
# Expected: { "success": true } (but NO record in DB)

# 8. Test consent rejection
curl -X POST http://localhost/api/v1/public/forms/contact/submit \
  -H "Content-Type: application/json" \
  -d '{"data":{"firstName":"Test"},"consentGiven":false,"_honeypot":""}'
# Expected: 422 Unprocessable Entity

# 9. Test CSV export
curl -o test.csv http://localhost/api/v1/forms/<FORM_ID>/submissions/export \
  -H "Authorization: Bearer <TOKEN>"
# Expected: CSV file with headers matching form fields

# 10. MailHog — submit with notifyEmail set on the form definition
# Check http://localhost:8025 — email must appear in MailHog inbox

# 11. Admin form builder
# Navigate to http://localhost:3002/forms/create
# Create a new form with: 2 text fields + KVKK consent + GDPR consent
# Save it, then submit from the public site — verify submission appears in admin

# 12. Admin form list
# Submission count column must show correct number for each form

# 13. Web forms load dynamically
# Open http://localhost/tr/iletisim
# The contact form fields must match FormDefinition.fields from DB
# Edit the FormDefinition name in admin → refresh page → label must change
```

---

## Summary of files changed

```
apps/api/src/forms/forms.service.ts         (findAllForms, exportSubmissionsCsv, submit with Turnstile)
apps/api/src/forms/forms.controller.ts      (export endpoint)
apps/api/src/forms/turnstile.service.ts     (NEW)
apps/api/src/forms/forms.module.ts          (register TurnstileService)
apps/api/src/forms/queue/email.processor.ts (wire nodemailer)
apps/api/prisma/seed.ts                     (update contact + demo FormDefinition fields)
apps/admin/src/app/forms/page.tsx           (submission count column)
apps/admin/src/app/forms/create/page.tsx    (NEW)
apps/admin/src/app/forms/[id]/edit/page.tsx (NEW)
apps/admin/src/app/forms/[id]/submissions/page.tsx (export button)
apps/admin/src/components/forms/FormEditor.tsx     (NEW — field builder with KVKK/GDPR shortcuts)
apps/admin/src/components/forms/FieldRow.tsx       (NEW — per-field row component)
apps/web/src/components/shared/DynamicForm.tsx     (NEW — API-driven form renderer)
apps/web/src/components/shared/FieldRenderer.tsx   (NEW — renders one field by type)
apps/web/src/components/shared/ContactForm.tsx     (replace hardcoded with DynamicForm)
apps/web/src/components/shared/DemoRequestForm.tsx (replace hardcoded with DynamicForm)
docker-compose.yml                                 (SMTP env vars to api, Turnstile build arg to web)
.env.example                                       (SMTP vars, Turnstile keys)
apps/web/.env.local                                (NEXT_PUBLIC_TURNSTILE_SITE_KEY dev value)
```