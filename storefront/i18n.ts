// Bridge per il plugin next-intl (App Router)
// https://next-intl.dev/docs/getting-started/app-router
import { getRequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE, loadMessages, resolveLocale, SUPPORTED_LOCALES } from './src/i18n/config';

export default getRequestConfig(async ({locale}) => {
  const loc = resolveLocale(locale);
  const messages = await loadMessages(loc);
  return {
    messages,
    // (Non strettamente necessario perché già definito altrove, ma reso esplicito)
    locales: SUPPORTED_LOCALES as unknown as string[],
    defaultLocale: DEFAULT_LOCALE
  };
});
