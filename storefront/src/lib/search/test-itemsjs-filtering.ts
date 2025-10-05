import * as itemsjs from 'itemsjs'

// Test ItemsJS filtering directly
const searchIndex = require('../../../search-index.json')

console.log('Testing ItemsJS filtering...')

// Sample data structure for testing
const sampleItems = searchIndex.items.slice(0, 10)
console.log('Sample items:', sampleItems.map(item => ({
  id: item.id,
  title: item.title,
  colors: item.colors,
  tags: item.tags,
  outlet: item.outlet
})))

const config = {
  searchableFields: ['title', 'description', 'tags', 'colors', 'sizes'],
  aggregations: {
    tags: {
      title: 'Tags',
      size: 50,
      conjunction: false
    },
    colors: {
      title: 'Colors', 
      size: 50,
      conjunction: false
    },
    sizes: {
      title: 'Sizes',
      size: 20,
      conjunction: false
    },
    outlet: {
      title: 'Outlet',
      size: 2,
      conjunction: false
    }
  }
}

const items = itemsjs.default(searchIndex.items, config)

// Test 1: Search without filters
console.log('\n=== TEST 1: No filters ===')
const result1 = items.search({ query: '', per_page: 5 })
console.log('Items found:', result1.data.items.length)
console.log('Total:', result1.pagination.total)
console.log('Colors aggregation sample:', Object.keys(result1.data.aggregations.colors.buckets || {}).slice(0, 5))

// Test 2: Filter by specific color
console.log('\n=== TEST 2: Filter by WHITE color ===')
const result2 = items.search({ 
  query: '', 
  per_page: 5,
  filters: {
    colors: ['WHITE']
  }
})
console.log('Items found:', result2.data.items.length)
console.log('First item colors:', result2.data.items[0]?.colors)

// Test 3: Filter by tag
console.log('\n=== TEST 3: Filter by T-Shirt tag ===')
const result3 = items.search({
  query: '',
  per_page: 5,
  filters: {
    tags: ['T-Shirt Uomo Unisex']
  }
})
console.log('Items found:', result3.data.items.length)
console.log('First item tags:', result3.data.items[0]?.tags)

// Test 4: Multiple filters
console.log('\n=== TEST 4: Multiple filters ===')
const result4 = items.search({
  query: '',
  per_page: 5,
  filters: {
    colors: ['WHITE'],
    outlet: [false]
  }
})
console.log('Items found:', result4.data.items.length)

export { }
