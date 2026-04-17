import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  PageComponentDataSchema,
  FormFieldsSchema,
  ProductFeaturesSchema,
  LocaleMapSchema,
} from '@krontech/types';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

// Suppress unused import warnings — these are kept for future service-layer usage
void FormFieldsSchema;
void ProductFeaturesSchema;
void LocaleMapSchema;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    @InjectPinoLogger(PrismaService.name)
    private readonly logger: PinoLogger,
  ) {
    super();
    // Placeholder middleware — full JSONB validation happens in validateComponentData
    this.$use(async (params, next) => {
      return next(params);
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  validateComponentData(data: unknown, componentType: string) {
    const withType = { ...(data as object), __type: componentType };
    const result = PageComponentDataSchema.safeParse(withType);
    if (!result.success) {
      this.logger.error(
        { componentType, errors: result.error.issues },
        'Malformed JSONB component data',
      );
    }
    return result;
  }
}
