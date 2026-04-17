import { Module } from '@nestjs/common';

// BullMQ workers are instantiated directly inside FormsModule processors.
// This module is a placeholder for future shared queue utilities (e.g. Bull Board dashboard).
@Module({})
export class QueueModule {}
