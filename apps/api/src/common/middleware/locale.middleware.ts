import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const SUPPORTED_LOCALES = ['tr', 'en'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

declare module 'express' {
  interface Request {
    locale: SupportedLocale;
  }
}

@Injectable()
export class LocaleMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const queryLang = req.query['lang'] as string | undefined;
    const headerLang = req.headers['accept-language']
      ?.split(',')[0]
      ?.split('-')[0];

    const raw = queryLang ?? headerLang ?? 'tr';
    req.locale = (SUPPORTED_LOCALES as readonly string[]).includes(raw)
      ? (raw as SupportedLocale)
      : 'tr';

    next();
  }
}
