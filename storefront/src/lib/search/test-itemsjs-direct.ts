import * as itemsjs from 'itemsjs'

// Test diretto di ItemsJS
const testData = [
  { id: '1', title: 'Test 1', color: 'red', size: 'M', category: 'shirt' },
  { id: '2', title: 'Test 2', color: 'blue', size: 'L', category: 'shirt' },
  { id: '3', title: 'Test 3', color: 'red', size: 'S', category: 'pants' },
]

const config = {
  searchableFields: ['title'],
  aggregations: {
    color: {
      title: 'Color',
      size: 10
    },
    size: {
      title: 'Size', 
      size: 10
    },
    category: {
      title: 'Category',
      size: 10
    }
  }
}

const testItemsJS = () => {
  console.log('=== Test ItemsJS Diretto ===')
  
  const search = itemsjs.default(testData, config)
  const result = search.search({
    query: '',
    per_page: 10
  })
  
  console.log('Test result:', result)
  console.log('Test aggregations:', result.data.aggregations)
  
  return result
}

export { testItemsJS }
