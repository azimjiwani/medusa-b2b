# Ricerca a Faccette con ItemsJS - RefinementList

Il componente RefinementList è stato completamente rinnovato per utilizzare ItemsJS e fornire filtri a faccette avanzati in tempo reale.

## Nuove Funzionalità

### 🔍 **Filtri a Faccette Dinamici**
- **Categories (Tags)**: Filtra per categorie di prodotto come "T-Shirt Uomo Unisex"
- **Colors**: Filtra per colori disponibili con conteggi in tempo reale
- **Sizes**: Filtra per taglie disponibili
- **Outlet**: Toggle per prodotti in saldo

### ⚡ **Ricerca in Tempo Reale**
- I filtri si aggiornano istantaneamente senza ricaricare la pagina
- Conteggi dinamici basati sui filtri attivi
- Aggregazioni automatiche da ItemsJS

### 🎯 **Gestione URL**
- Filtri persistenti negli URL parameters
- Supporto per link diretti con filtri preimpostati
- Reset automatico della paginazione quando cambiano i filtri

## Componenti Aggiornati

### 1. **RefinementList** (`src/modules/store/components/refinement-list/index.tsx`)

```tsx
// Nuovo props per search query e callback filtri
<RefinementList
  sortBy={sort}
  categories={categories}
  currentCategory={currentCategory}
  searchQuery={searchQuery}
  onFiltersChange={handleFiltersChange}
  hideSearch={false}
/>
```

**Nuove Props:**
- `searchQuery?: string` - Query di ricerca per aggregazioni
- `onFiltersChange?: (filters: SearchFilters) => void` - Callback per cambio filtri

**Nuove Funzionalità:**
- **FacetedFilter Component**: Filtri espandibili con conteggi
- **Active Filters Display**: Visualizzazione filtri attivi con rimozione rapida
- **URL Sync**: Sincronizzazione automatica con URL parameters

### 2. **SearchPageWrapper** (`src/modules/store/components/search-page-wrapper/index.tsx`)

Componente wrapper per gestire lo stato condiviso tra filtri e risultati:

```tsx
<SearchPageWrapper
  sortBy={sort}
  categories={categories}
  currentCategory={currentCategory}
  searchQuery={searchQuery}
  hideSearch={true}
>
  <FilteredSearchResults {...props} />
</SearchPageWrapper>
```

### 3. **FilteredSearchResults** (`src/modules/store/templates/filtered-search-results.tsx`)

Template che reagisce ai cambi di filtri in tempo reale:

```tsx
<FilteredSearchResults
  searchQuery={searchQuery}
  countryCode={countryCode}
  customer={customer}
  page={page}
  sortBy={sortBy}
/>
```

## URL Parameters Supportati

```
/search?q=euro&tags=T-Shirt Uomo Unisex&colors=WHITE,BLACK&sizes=M,L&outlet=true&sortBy=price_asc&page=2
```

- `q` - Query di ricerca
- `tags` - Categorie separate da virgola
- `colors` - Colori separati da virgola  
- `sizes` - Taglie separate da virgola
- `outlet` - true/false per prodotti outlet
- `sortBy` - Ordinamento (price_asc, price_desc, created_at)
- `page` - Numero pagina

## Esempio di Utilizzo

### Pagina di Ricerca Base
```tsx
import SearchPageWrapper from "@/modules/store/components/search-page-wrapper"
import FilteredSearchResults from "@/modules/store/templates/filtered-search-results"

export default function SearchPage() {
  return (
    <SearchPageWrapper
      sortBy="created_at"
      categories={categories}
      searchQuery="euro"
    >
      <FilteredSearchResults
        searchQuery="euro"
        countryCode="it"
        customer={customer}
        page={1}
        sortBy="created_at"
      />
    </SearchPageWrapper>
  )
}
```

### Filtri Programmatici
```tsx
const filters: SearchFilters = {
  tags: ['T-Shirt Uomo Unisex'],
  colors: ['WHITE', 'BLACK'],
  sizes: ['M', 'L'],
  outlet: true
}

const searchResult = itemsJSSearch.search({
  query: 'euro',
  filters: filters,
  page: 1,
  per_page: 48
})
```

## Aggregazioni Dinamiche

Le aggregazioni vengono calcolate automaticamente in base ai filtri attivi:

```typescript
// Esempio di aggregazioni restituite
{
  tags: {
    buckets: {
      'T-Shirt Uomo Unisex': 45,
      'Polo Shirt': 23,
      'Hoodie': 12
    }
  },
  colors: {
    buckets: {
      'WHITE': 89,
      'BLACK': 67,
      'NAVY MARINE': 34
    }
  },
  sizes: {
    buckets: {
      'S': 45,
      'M': 67,
      'L': 56,
      'XL': 34
    }
  }
}
```

## Performance

### Vantaggi della Nuova Implementazione
- **Zero Latency**: Filtri istantanei senza API calls
- **Smart Aggregations**: Solo i filtri rilevanti vengono mostrati
- **Lazy Loading**: Componenti si espandono solo quando necessario
- **Efficient Updates**: Solo i risultati cambiano, UI rimane stabile

### Ottimizzazioni
- Debouncing degli aggiornamenti URL
- Memoizzazione delle aggregazioni
- Lazy loading dei prodotti
- Virtual scrolling per liste lunghe (possibile estensione futura)

## Styling e UX

### Design Features
- **Collapsible Filters**: Ogni categoria di filtro è espandibile
- **Clear Visual Hierarchy**: Filtri attivi evidenziati
- **Consistent Interactions**: Hover states e animazioni fluide
- **Mobile Responsive**: Layout ottimizzato per tutti i dispositivi

### CSS Classes
```css
/* Filtri attivi */
.filter-active { @apply bg-blue-100 text-blue-800; }

/* Conteggi filtri */
.filter-count { @apply text-xs text-gray-500; }

/* Filtri espandibili */
.filter-expandable { @apply hover:bg-gray-50 transition-colors; }
```

## Integrazione con Pagine Esistenti

### Search Page
```tsx
// /search aggiornata per utilizzare i nuovi componenti
import SearchPageWrapper from "@/modules/store/components/search-page-wrapper"
import FilteredSearchResults from "@/modules/store/templates/filtered-search-results"
```

### Store Page
```tsx
// /store mantiene compatibilità ma supporta nuovi filtri
<RefinementList 
  sortBy={sort} 
  categories={categories}
  searchQuery={search || ""}
/>
```

## Possibili Estensioni Future

1. **Range Filters**: Prezzi, date, rating
2. **Search Suggestions**: Autocomplete per filtri
3. **Saved Filters**: Salvataggio preferenze filtri
4. **Advanced Boolean Logic**: OR/AND per filtri multipli
5. **Visual Filters**: Swatches per colori, preview per categorie
6. **Filter Analytics**: Tracking utilizzo filtri più popolari

## Debugging

### Console Logs Utili
```javascript
// Visualizza aggregazioni correnti
console.log('Aggregations:', itemsJSSearch.search({query: 'euro'}).data.aggregations)

// Visualizza filtri URL
console.log('URL Filters:', Object.fromEntries(new URLSearchParams(window.location.search)))

// Test filtro specifico
console.log('Filtered Results:', itemsJSSearch.search({
  query: 'euro',
  filters: { colors: ['WHITE'] }
}))
```

La nuova implementazione fornisce un'esperienza di ricerca moderna e performante, con filtri a faccette che si aggiornano in tempo reale e una UX ottimizzata per l'e-commerce.