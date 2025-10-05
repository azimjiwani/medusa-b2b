import { itemsJSSearch } from '@/lib/search/itemsjs-search'

// Test per debug delle aggregazioni
const testAggregations = () => {
  console.log('=== Debug Aggregazioni ItemsJS ===')
  
  const result = itemsJSSearch.search({
    query: '',
    per_page: 0 // Solo aggregazioni
  })
  
  console.log('Aggregazioni complete:', result.data.aggregations)
  console.log('Aggregazioni tags:', result.data.aggregations?.tags)
  console.log('Aggregazioni colors:', result.data.aggregations?.colors)
  
  // Test specifico
  if (result.data.aggregations?.colors) {
    console.log('Struttura colors:')
    console.log('Type:', typeof result.data.aggregations.colors)
    console.log('Keys:', Object.keys(result.data.aggregations.colors))
    
    if (result.data.aggregations.colors.buckets) {
      console.log('Buckets type:', typeof result.data.aggregations.colors.buckets)
      console.log('Buckets:', result.data.aggregations.colors.buckets)
    }
  }
}

export { testAggregations }
