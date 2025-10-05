"use client"

import { ItemsJSSearchService } from '@/lib/search/itemsjs-search'
import { useEffect, useState } from 'react'

export function DebugAggregations() {
  const [searchService] = useState(() => new ItemsJSSearchService())
  const [aggregationsData, setAggregationsData] = useState<any>(null)

  useEffect(() => {
    // Test search with empty query to get all aggregations
    const result = searchService.search({})
    console.log('Debug - Full search result:', result)
    console.log('Debug - Aggregations structure:', result.data.aggregations)
    setAggregationsData(result.data.aggregations)
  }, [searchService])

  if (!aggregationsData) {
    return <div>Loading aggregations...</div>
  }

  return (
    <div className="p-4 bg-gray-100 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Debug: ItemsJS Aggregations Structure</h3>
      
      {Object.entries(aggregationsData).map(([key, agg]: [string, any]) => (
        <div key={key} className="mb-4 p-3 bg-white border rounded">
          <h4 className="font-medium text-blue-600">{key}</h4>
          <div className="mt-2">
            <strong>Type:</strong> {typeof agg}<br/>
            <strong>Is Array:</strong> {Array.isArray(agg) ? 'Yes' : 'No'}<br/>
            <strong>Has buckets:</strong> {agg?.buckets ? 'Yes' : 'No'}<br/>
            {agg?.buckets && (
              <>
                <strong>Buckets type:</strong> {typeof agg.buckets}<br/>
                <strong>Buckets is array:</strong> {Array.isArray(agg.buckets) ? 'Yes' : 'No'}<br/>
              </>
            )}
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-gray-600">Show raw data</summary>
            <pre className="mt-2 p-2 bg-gray-50 text-xs overflow-auto max-h-32">
              {JSON.stringify(agg, null, 2)}
            </pre>
          </details>
        </div>
      ))}
    </div>
  )
}