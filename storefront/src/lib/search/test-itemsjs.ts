import { itemsJSSearch } from '@/lib/search/itemsjs-search'

// Esempio di utilizzo dell'implementazione ItemsJS

console.log('=== Test ItemsJS Search Implementation ===')

// Test di ricerca semplice
console.log('\n1. Test ricerca semplice "euro":')
const simpleSearch = itemsJSSearch.search({
  query: 'euro',
  per_page: 5
})
console.log(`Trovati ${simpleSearch.data.pagination.total} risultati`)
console.log('Primi 5 prodotti:', simpleSearch.data.items.map(p => p.title))

// Test di ricerca con filtri
console.log('\n2. Test ricerca con filtri colore "WHITE":')
const filteredSearch = itemsJSSearch.search({
  query: 'euro',
  filters: {
    colors: ['WHITE']
  },
  per_page: 5
})
console.log(`Trovati ${filteredSearch.data.pagination.total} risultati con filtro colore`)
console.log('Prodotti bianchi:', filteredSearch.data.items.map(p => p.title))

// Test di ricerca con filtri tag
console.log('\n3. Test ricerca con filtri tag "T-Shirt":')
const tagFilteredSearch = itemsJSSearch.search({
  query: '',
  filters: {
    tags: ['T-Shirt Uomo Unisex']
  },
  per_page: 10
})
console.log(`Trovati ${tagFilteredSearch.data.pagination.total} risultati con tag T-Shirt`)

// Test aggregazioni (filtri disponibili)
console.log('\n4. Test aggregazioni - primi colori disponibili:')
const allColors = itemsJSSearch.getFieldValues('colors')
console.log('Primi 10 colori:', allColors.slice(0, 10))

console.log('\n5. Test aggregazioni - taglie disponibili:')
const allSizes = itemsJSSearch.getFieldValues('sizes')
console.log('Taglie:', allSizes)

// Test getSuggestions
console.log('\n6. Test suggestions per "shirt":')
const suggestions = itemsJSSearch.getSuggestions('shirt', 5)
console.log('Suggerimenti:', suggestions.map(p => p.title))

// Test getProductByHandle
console.log('\n7. Test ricerca per handle:')
const productByHandle = itemsJSSearch.getProductByHandle('euro')
console.log('Prodotto trovato per handle "euro":', productByHandle?.title)

console.log('\n=== Fine test ===')