import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Worker } from 'bullmq';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST ?? 'redis',
  port: Number(process.env.REDIS_PORT ?? 6379),
};

@Injectable()
export class WebhookProcessor implements OnApplicationShutdown {
  private readonly worker: Worker;

  constructor(
    @InjectPinoLogger(WebhookProcessor.name)
    private readonly logger: PinoLogger,
  ) {
    this.worker = new Worker(
      'webhook',
      async (job) => {
        const { webhookUrl, data } = job.data as { webhookUrl: string; data: unknown };
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);
        try {
          const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
        } finally {
          clearTimeout(timeout);
        }
      },
      { connection: REDIS_CONNECTION },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error({ jobId: job?.id, err }, 'Webhook job failed');
    });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.worker.close();
  }
}
