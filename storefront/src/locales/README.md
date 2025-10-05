# i18n Locales Structure

Questo directory contiene i file di localizzazione per il progetto storefront.

## Convenzioni
- Namespace minimale iniziale: `common.json` per testi di navigazione, banner e CTA.
- Chiavi in dot-notation per raggruppare: `nav.login`, `banner.loginRequired`.
- Aggiungere nuovi namespace (es. `product.json`, `search.json`) quando un dominio funzionale cresce oltre ~20 chiavi.

## Aggiungere una nuova lingua
1. Creare cartella `src/locales/<codice>` (es. `fr`).
2. Copiare `common.json` e tradurre i valori.
3. Aggiungere il codice lingua alla lista supportata nel provider i18n (quando implementato in `layout`).
4. Aggiornare l'eventuale script di build/CI se necessario.

## Best Practice
- Evitare concatenazioni dinamiche di stringhe -> usare placeholder.
- Se una chiave manca in una lingua, fallback alla lingua default (IT).
- Mantenere l'ordine alfabetico delle chiavi per ridurre i conflitti di merge.

## TODO
- Introdurre provider `next-intl`.
- Estrarre stringhe hardcoded aggiuntive in `common.json` o nuovi namespace.
- Aggiungere script di lint per rilevare stringhe italiane residue.
