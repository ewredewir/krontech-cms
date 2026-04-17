import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FormDefinition, FormSubmission, Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormDto, UpdateFormDto, SubmitFormDto } from '@krontech/types';

const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST ?? 'redis',
  port: Number(process.env.REDIS_PORT ?? 6379),
};

@Injectable()
export class FormsService {
  private readonly emailQueue: Queue;
  private readonly webhookQueue: Queue;

  constructor(private readonly prisma: PrismaService) {
    this.emailQueue = new Queue('email', { connection: REDIS_CONNECTION });
    this.webhookQueue = new Queue('webhook', { connection: REDIS_CONNECTION });
  }

  async createForm(dto: CreateFormDto): Promise<FormDefinition> {
    return this.prisma.formDefinition.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        fields: dto.fields as Prisma.InputJsonValue,
        webhookUrl: dto.webhookUrl,
        notifyEmail: dto.notifyEmail,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAllForms(): Promise<FormDefinition[]> {
    return this.prisma.formDefinition.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOneForm(id: string): Promise<FormDefinition> {
    const form = await this.prisma.formDefinition.findUnique({ where: { id } });
    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  async findFormBySlug(slug: string): Promise<FormDefinition> {
    const form = await this.prisma.formDefinition.findUnique({ where: { slug } });
    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  async updateForm(id: string, dto: UpdateFormDto): Promise<FormDefinition> {
    await this.findOneForm(id);
    return this.prisma.formDefinition.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.fields && { fields: dto.fields as Prisma.InputJsonValue }),
        ...(dto.webhookUrl !== undefined && { webhookUrl: dto.webhookUrl }),
        ...(dto.notifyEmail !== undefined && { notifyEmail: dto.notifyEmail }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteForm(id: string): Promise<void> {
    await this.findOneForm(id);
    await this.prisma.formDefinition.delete({ where: { id } });
  }

  async submit(
    slug: string,
    dto: SubmitFormDto,
    ip: string,
    userAgent: string,
  ): Promise<FormSubmission> {
    const form = await this.findFormBySlug(slug);

    if (!form.isActive) {
      throw new BadRequestException('This form is not accepting submissions');
    }

    const submission = await this.prisma.formSubmission.create({
      data: {
        formId: form.id,
        data: dto.data as Prisma.InputJsonValue,
        ip,
        userAgent,
        consentGiven: dto.consentGiven,
      },
    });

    const jobOptions = { attempts: 3, backoff: { type: 'exponential', delay: 1000 } };

    if (form.notifyEmail) {
      await this.emailQueue.add(
        'notify',
        { to: form.notifyEmail, formName: form.name, submissionId: submission.id, data: dto.data },
        jobOptions,
      );
    }

    if (form.webhookUrl) {
      await this.webhookQueue.add(
        'deliver',
        { webhookUrl: form.webhookUrl, data: { formSlug: slug, submissionId: submission.id, fields: dto.data } },
        jobOptions,
      );
    }

    return submission;
  }

  async getSubmissions(
    formId: string,
    params: { page: number; limit: number },
  ): Promise<{ data: FormSubmission[]; total: number }> {
    await this.findOneForm(formId);
    const [data, total] = await Promise.all([
      this.prisma.formSubmission.findMany({
        where: { formId },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.formSubmission.count({ where: { formId } }),
    ]);
    return { data, total };
  }
}
