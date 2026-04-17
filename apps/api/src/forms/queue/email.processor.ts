import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Worker } from 'bullmq';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST ?? 'redis',
  port: Number(process.env.REDIS_PORT ?? 6379),
};

@Injectable()
export class EmailProcessor implements OnApplicationShutdown {
  private readonly worker: Worker;

  constructor(
    @InjectPinoLogger(EmailProcessor.name)
    private readonly logger: PinoLogger,
  ) {
    this.worker = new Worker(
      'email',
      async (job) => {
        const { to, formName, submissionId, data } = job.data as {
          to: string;
          formName: string;
          submissionId: string;
          data: unknown;
        };

        // In production this would use nodemailer / SES / etc.
        // For now we log the notification — wire up transport to env vars.
        this.logger.info({ to, formName, submissionId, data }, 'Email notification queued');
      },
      { connection: REDIS_CONNECTION },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error({ jobId: job?.id, err }, 'Email job failed');
    });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.worker.close();
  }
}
