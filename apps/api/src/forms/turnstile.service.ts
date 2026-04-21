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

    if (!secret) {
      this.logger.warn('TURNSTILE_SECRET_KEY not set — skipping verification');
      return true;
    }

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
      // Fail open on network error — Cloudflare unreachable should not block submissions
      this.logger.error({ err }, 'Turnstile verification request failed');
      return true;
    }
  }
}
