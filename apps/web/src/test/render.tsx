import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import trMessages from '../../messages/tr.json';
import type { ReactElement } from 'react';

export function renderWithIntl(ui: ReactElement, locale = 'tr') {
  const messages = locale === 'tr' ? trMessages : trMessages;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}
