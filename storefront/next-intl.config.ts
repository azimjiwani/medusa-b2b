// Configurazione richiesta da next-intl per l'App Router
// Vedi: https://next-intl.dev/docs/getting-started/app-router

const locales = ['it', 'en'] as const;

export default {
  locales,
  defaultLocale: 'it'
} as const;
