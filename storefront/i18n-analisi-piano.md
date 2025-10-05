# Piano di Introduzione Multilingua (i18n) – medusa-b2b/storefront

## 1. Stato Attuale
- **Routing**: usa App Router con segmento dinamico `[countryCode]` che oggi riflette la regione (pricing / availability), non la lingua.
- **Testi UI**: stringhe hardcoded (prevalentemente italiano) sparse nei componenti (`product-info`, template prodotto, banner login, tabelle varianti, form contatto, ecc.).
- **Dati prodotti**: campi `title`, `description`, `metadata` monolingua.
- **Ricerca**: un solo indice (`search-index.json`) per `itemsjs`.
- **SEO**: nessun setup di localizzazione (hreflang, alternate, ecc.).

## 2. Strategie Possibili
### A. Built‑in i18n di Next.js
Configurare `i18n` in `next.config.js`. Pro: semplice. Contro: conflitto semantico se `[countryCode]` deve restare distinto dalla lingua.

### B. Aggiungere segmento `[locale]` prima di `[countryCode]`
`/it/it/products/...` (locale + regione) o `/en/it/products/...`. Pro: separazione chiara lingua vs regione. Contro: refactor routing maggiore.

### C. Riutilizzare `[countryCode]` come lingua
Funziona solo se ogni paese ha una sola lingua (non gestisce multi‑lingua per stessa regione). Limitante.

**Raccomandazione**: se prevedi più lingue per la stessa regione (es. IT + EN su region Italia) → Opzione B. Altrimenti iniziare con C e poi migrare.

## 3. Libreria i18n Consigliata
`next-intl` (ottimo per App Router). Alternative: `next-i18next` (più legacy), oppure solo `Intl` + mapping manuale (più lavoro). 

## 4. Struttura File di Traduzione
```
src/locales/
  it/
    common.json
    product.json
    search.json
    auth.json
  en/
    common.json
    product.json
    search.json
    auth.json
```
Linee guida:
- Namespace per dominio funzionale.
- Chiavi descrittive: `product.colors`, `product.noColors`, `cta.loginRequiredTitle`.
- Placeholder per variabili: `"selectedCount": "Hai selezionato {count} varianti"`.

## 5. Localizzazione Dati Prodotto
I testi provenienti da Medusa non sono multi‑lingua. Opzioni:
1. Aggiungere in `metadata` suffissi per lingua: `title_en`, `description_en`.
2. Delegare a un CMS headless (es. Strapi / Contentful) e arricchire i prodotti via pipeline.
3. Tenere fallback IT se lingua secondaria mancante.

Helper suggerito:
```ts
function localizedField(product, field, locale) {
  return product.metadata?.[`${field}_${locale}`] || product[field] || ''
}
```

## 6. Ricerca Multilingua
Attuale: `search-index.json` monolingua.

Per i18n:
- **Approccio consigliato**: un indice per lingua: `search-index.it.json`, `search-index.en.json`.
- Caricamento dinamico (import o fetch) in base al `locale` corrente.
- Pipeline di generazione aggiornata per estrarre campi localizzati.

Alternativa: indice unico con campi duplicati (`title_en`, `title_it`) e filtri dinamici dei campi `searchableFields` → più complesso.

## 7. SEO
- Aggiungere `alternates.languages` in `generateMetadata`.
- Hreflang & canonical per ogni lingua.
- Redirect 301 da vecchi permalink monolingua a nuova struttura (se modifichi routing).

## 8. Componenti Prioritari da Internazionalizzare
- `product-info` (Caratteristiche, Colori, Taglie, fallback “Nessuna taglia”).
- `products/templates/index.tsx` (titoli, CTA, “Disponibilità varianti”, banner login / pricing accesso).
- `product-variants-matrix` (etichette celle, “In arrivo”, “Svuota”, messaggi stock / log-in hidden se spostati).
- `product-facts` (stock indicators).
- Componenti preview & search (OUTLET, Login required, Click for details).
- Form contatto (label, placeholder, messaggi successo/errore).
- Bottoni generici (Aggiungi al carrello, Seleziona quantitativi).

## 9. Fasi di Rollout
| Fase | Descrizione                                  | Output                                          |
| ---- | -------------------------------------------- | ----------------------------------------------- |
| 0    | Decisione strategia routing & lingue         | Documento / consenso team                       |
| 1    | Setup infrastruttura (`next-intl`, provider) | Provider + cartella `locales/`                  |
| 2    | Estrazione stringhe UI statiche              | JSON per IT + EN (vuoti)                        |
| 3    | Localizzazione dati prodotto (metadata)      | Pipeline / script aggiornato                    |
| 4    | Indici ricerca separati                      | `search-index.it.json` / `search-index.en.json` |
| 5    | SEO integrazione                             | hreflang, alternate, canonical                  |
| 6    | QA + fallback test                           | Playwright / manuale                            |
| 7    | Monitoraggio                                 | Logging chiavi mancanti                         |

## 10. Effort Stimato (Indicativo)
- Infrastruttura + provider: 0.5–1 g.
- Estrazione ~60–120 stringhe: 1–2 g.
- Indici ricerca multi-lingua: 0.5–1 g.
- Metadata prodotto localizzati: variabile (dipende da sorgente).
- SEO + QA: 0.5–1 g.

## 11. Rischi & Mitigazioni
| Rischio                       | Mitigazione                                         |
| ----------------------------- | --------------------------------------------------- |
| URL break (routing refactor)  | Redirect 301 + mapping test                         |
| Stringhe dimenticate          | Script lint + fallback log                          |
| Indice ricerca non aggiornato | Hook CI rigenera indici per lingua                  |
| Fallback confusion            | Regola: sempre mostra lingua default IT se mancante |
| Aumento bundle                | Caricamento lazy solo namespace necessari           |

## 12. Checklist Operativa
- [ ] Conferma elenco lingue (es. it, en)
- [ ] Scelta strategia routing (A/B/C)
- [ ] Aggiunta dipendenza `next-intl`
- [ ] Creazione provider nel root layout
- [ ] Definizione convenzione naming chiavi i18n
- [ ] Script estrazione / sostituzione stringhe (facoltativo)
- [ ] Generazione indici ricerca per lingua
- [ ] Aggiornamento pipeline prodotto (metadata multilingua)
- [ ] Implementazione fallback UI
- [ ] SEO (hreflang + alternate)
- [ ] Test E2E in entrambe le lingue

## 13. Esempio Chiavi (Estratto)
`product.json` (IT):
```json
{
  "characteristics": "Caratteristiche",
  "colors": "Colori",
  "sizes": "Taglie",
  "noColors": "Nessun colore",
  "noSizes": "Nessuna taglia",
  "related": "Prodotti correlati",
  "variantAvailability": "Disponibilità varianti"
}
```
`cta.json` (IT):
```json
{
  "loginRequiredTitle": "Accedi per vedere disponibilità e prezzi",
  "loginRequiredBody": "Per consultare le disponibilità delle varianti e procedere con l'ordine è necessario avere un account attivo.",
  "goToAccount": "Vai all'area riservata"
}
```

## 14. Helper d'Esempio
```ts
import { getTranslations } from 'next-intl/server'

export async function getProductLabels(locale: string) {
  const t = await getTranslations({ locale, namespace: 'product' })
  return {
    colorsLabel: t('colors'),
    sizesLabel: t('sizes')
  }
}
```

## 15. Prossimi Passi Suggeriti
1. Decidere se introdurre subito `[locale]` nel routing.
2. Installare e cablare `next-intl` con due namespace minimi (`common`, `product`).
3. Migrare gradualmente le sezioni più visibili (header prodotto, CTA login) per validare flusso.
4. Implementare fallback logging (console o Sentry) per chiavi mancanti.
5. Solo dopo validazione UI: estendere a ricerca e metadata.

---
**Nota**: questo documento è pensato come base operativa. Aggiornalo man mano che definisci naming standard e decidete se i dati prodotto saranno gestiti via metadata o tramite un CMS esterno.
