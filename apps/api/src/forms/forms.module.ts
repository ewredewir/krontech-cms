import { Module } from '@nestjs/common';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { EmailProcessor } from './queue/email.processor';
import { WebhookProcessor } from './queue/webhook.processor';
import { TurnstileService } from './turnstile.service';

@Module({
  controllers: [FormsController],
  providers: [FormsService, EmailProcessor, WebhookProcessor, TurnstileService],
})
export class FormsModule {}
