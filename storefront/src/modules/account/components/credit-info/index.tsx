"use client"

import { sdk } from "@/lib/config"
import { getAuthHeaders } from "@/lib/data/cookies"
import { convertToLocale } from "@/lib/util/money"
import { Text } from "@medusajs/ui"
import { useEffect, useState } from "react"

type CreditInfoProps = {
  customerId?: string
}

const CreditInfo = ({ customerId }: CreditInfoProps) => {
  const [creditLimit, setCreditLimit] = useState<number>(0)
  const [creditUsed, setCreditUsed] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCreditInfo = async () => {
      try {
        const headers = await getAuthHeaders()
        const response = await sdk.client.fetch(`/store/customers/me/credit`, {
          method: "GET",
          credentials: "include",
          headers
        })

        if (response.credit_limit !== undefined && response.credit_used !== undefined) {
          setCreditLimit(response.credit_limit)
          setCreditUsed(response.credit_used)
        }
      } catch (error) {
        console.error('Failed to fetch credit info:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCreditInfo()
  }, [customerId])

  if (isLoading) {
    return (
      <div className="text-sm text-ui-fg-subtle">
        <Text>Loading credit information...</Text>
      </div>
    )
  }

  // Don't show if no credit limit is set
  if (creditLimit === 0) {
    return null
  }

  return (
    <div className="text-sm text-ui-fg-subtle space-y-1">
      <div className="flex items-center gap-x-2">
        <Text className="font-medium text-ui-fg-base">Credit Limit:</Text>
        <Text>
          {convertToLocale({
            amount: creditLimit / 100,
            currency_code: "cad",
          })}
        </Text>
      </div>
      <div className="flex items-center gap-x-2">
        <Text className="font-medium text-ui-fg-base">Credit Used:</Text>
        <Text className={creditUsed > creditLimit ? 'text-red-600 font-semibold' : ''}>
          {convertToLocale({
            amount: creditUsed / 100,
            currency_code: "cad",
          })}
        </Text>
      </div>
      <div className="mt-2">
        <Text className="text-xs text-ui-fg-muted italic">
          Goods will not be shipped if your outstanding balance exceeds your credit limit.
        </Text>
      </div>
    </div>
  )
}

export default CreditInfo
