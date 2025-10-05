"use client"

import { itemsJSSearch } from "@/lib/search/itemsjs-search"
import { useEffect, useState } from "react"

export default function ItemsJSDebugger() {
  const [debugData, setDebugData] = useState<any>(null)

  useEffect(() => {
    // Test basic search
    const result = itemsJSSearch.search({
      query: '',
      per_page: 5
    })

    setDebugData({
      totalItems: result.data.pagination.total,
      sampleItems: result.data.items.slice(0, 3),
      aggregations: result.data.aggregations,
      aggregationsKeys: Object.keys(result.data.aggregations || {}),
      colorsAgg: result.data.aggregations?.colors,
      tagsAgg: result.data.aggregations?.tags,
      sizesAgg: result.data.aggregations?.sizes
    })
  }, [])

  if (!debugData) return <div>Loading debug data...</div>

  return (
    <div className="p-4 bg-gray-100 text-xs">
      <h3 className="font-bold mb-2">ItemsJS Debug Data</h3>
      
      <div className="mb-4">
        <h4 className="font-semibold">Basic Info:</h4>
        <p>Total Items: {debugData.totalItems}</p>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold">Sample Items:</h4>
        {debugData.sampleItems.map((item: any, index: number) => (
          <div key={index} className="ml-2">
            <p>ID: {item.id}</p>
            <p>Title: {item.title}</p>
            <p>Colors: {JSON.stringify(item.colors)}</p>
            <p>Tags: {JSON.stringify(item.tags)}</p>
            <hr className="my-1"/>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <h4 className="font-semibold">Aggregations:</h4>
        <p>Available keys: {JSON.stringify(debugData.aggregationsKeys)}</p>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold">Colors Aggregation:</h4>
        <pre className="bg-white p-2 overflow-auto text-xs">
          {JSON.stringify(debugData.colorsAgg, null, 2)}
        </pre>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold">Tags Aggregation:</h4>
        <pre className="bg-white p-2 overflow-auto text-xs">
          {JSON.stringify(debugData.tagsAgg, null, 2)}
        </pre>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold">Full Aggregations:</h4>
        <pre className="bg-white p-2 overflow-auto text-xs max-h-40">
          {JSON.stringify(debugData.aggregations, null, 2)}
        </pre>
      </div>
    </div>
  )
}