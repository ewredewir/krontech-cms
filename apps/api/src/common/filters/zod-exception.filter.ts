import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { Response } from 'express';

@Catch(ZodValidationException)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodValidationException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const zodError = exception.getZodError();
    const errors: Record<string, string> = {};
    for (const issue of zodError.issues) {
      const field = issue.path.join('.');
      if (!errors[field]) {
        errors[field] = issue.message;
      }
    }

    response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'Validation failed',
      errors, // flat: { "email": "Invalid email", "slug.tr": "Required" }
    });
  }
}
