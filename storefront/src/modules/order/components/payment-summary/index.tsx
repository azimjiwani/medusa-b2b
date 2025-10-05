"use client"

import { sdk } from "@/lib/config"
import { getAuthHeaders } from "@/lib/data/cookies"
import { convertToLocale } from "@/lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

type PaymentSummaryProps = {
  order: HttpTypes.StoreOrder
}

const PaymentSummary = ({ order }: PaymentSummaryProps) => {
  const [totalPaid, setTotalPaid] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPaymentCaptures = async () => {
      if (!order.payment_collections || order.payment_collections.length === 0) {
        setIsLoading(false)
        return
      }

      try {
        let totalCaptured = 0
        
        // Get all payments from all payment collections
        const payments = order.payment_collections.flatMap(pc => pc.payments || [])
        
        for (const payment of payments) {
          try {
            const headers = await getAuthHeaders()
            const captures: any = await sdk.client.fetch(`/store/payments/${payment.id}/partial-capture`, {
              method: "GET",
              credentials: "include",
              headers
            })
            
            if (captures && Array.isArray(captures.captures)) {
              const paymentTotal = captures.captures.reduce((sum: number, capture: any) => {
                return sum + (Number(capture.amount) || 0)
              }, 0)
              totalCaptured += paymentTotal
            }
          } catch (error) {
            console.error(`Error fetching captures for payment ${payment.id}:`, error)
          }
        }
        
        setTotalPaid(totalCaptured)
      } catch (error) {
        console.error('Failed to fetch payment captures:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPaymentCaptures()
  }, [order.id, order.payment_collections])

  const orderTotal = Number(order.total) || 0
  const outstandingAmount = Math.max(orderTotal - totalPaid, 0)

  const t = useTranslations("account")
  if (isLoading) {
    return (
      <>
        <Heading level="h3" className="mb-2">
          {t("orders.paymentSummary")}
        </Heading>
        <div className="text-sm text-ui-fg-subtle">
          <Text>{t("orders.loadingPayment")}</Text>
        </div>
      </>
    )
  }

  return (
    <>
      <Heading level="h3" className="mb-2">
        {t("orders.paymentSummary")}
      </Heading>

      <div className="text-sm text-ui-fg-subtle space-y-2">
        <div className="flex justify-between">
          <Text>{t("orders.total")}</Text>
          <Text className="font-medium">
            {convertToLocale({
              amount: orderTotal,
              currency_code: order.currency_code,
            })}
          </Text>
        </div>

        <div className="flex justify-between">
          <Text>{t("orders.totalPaid")}</Text>
          <Text className="font-medium text-green-600">
            {convertToLocale({
              amount: totalPaid,
              currency_code: order.currency_code,
            })}
          </Text>
        </div>

        <div className="flex justify-between border-t pt-2">
          <Text className="font-medium">{t("orders.outstandingBalance")}</Text>
          <Text className={`font-semibold ${outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {convertToLocale({
              amount: outstandingAmount,
              currency_code: order.currency_code,
            })}
          </Text>
        </div>
      </div>
    </>
  )
}

export default PaymentSummary
