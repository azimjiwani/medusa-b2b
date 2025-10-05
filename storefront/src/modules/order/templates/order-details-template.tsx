"use client"

import { ArrowUturnLeft, ShoppingBag } from "@medusajs/icons"
import Image from "next/image"
import React, { useEffect, useState } from "react"

import { sdk } from "@/lib/config"
import { addToCartEventBus } from "@/lib/data/cart-event-bus"
import { getAuthHeaders } from "@/lib/data/cookies"
import Button from "@/modules/common/components/button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import BillingDetails from "@/modules/order/components/billing-details"
import Item from "@/modules/order/components/item"
import OrderDetails from "@/modules/order/components/order-details"
import OrderSummary from "@/modules/order/components/order-summary"
import PaymentSummary from "@/modules/order/components/payment-summary"
import ShippingDetails from "@/modules/order/components/shipping-details"
import { HttpTypes } from "@medusajs/types"
import { Container, Table } from "@medusajs/ui"
import { useTranslations } from "next-intl"

type OrderDetailsTemplateProps = {
  order: HttpTypes.StoreOrder
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({
  order,
}) => {
  const [isAddingAll, setIsAddingAll] = useState(false)
  const [invoiceData, setInvoiceData] = useState<Record<string, { invoice_url: string; generated_at: string }>>({})
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)
  const [trackingData, setTrackingData] = useState<Record<string, string[]>>({})
  const [isLoadingTracking, setIsLoadingTracking] = useState(false)
  const t = useTranslations("account")

  // Fetch invoice data for each fulfillment
  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!order.fulfillments || order.fulfillments.length === 0) return
      
      setIsLoadingInvoices(true)
      try {
        const invoicePromises = order.fulfillments.map(async (fulfillment) => {
          try {
            const headers = await getAuthHeaders()
            const data: any = await sdk.client.fetch(`/store/invoice?order_id=${order.id}&fulfillment_id=${fulfillment.id}`, {
              method: "GET",
              credentials: "include",
              headers
            })
            if (data && typeof data === 'object' && 'invoice_url' in data && 'generated_at' in data) {
              return { fulfillmentId: fulfillment.id, invoiceData: data as { invoice_url: string; generated_at: string } }
            }
          } catch (error) {
            // No invoice found for this fulfillment
          }
          return { fulfillmentId: fulfillment.id, invoiceData: null }
        })
        
        const results = await Promise.all(invoicePromises)
        const invoiceMap: Record<string, { invoice_url: string; generated_at: string }> = {}
        
        results.forEach(({ fulfillmentId, invoiceData: inv }) => {
          if (inv) {
            invoiceMap[fulfillmentId] = inv
          }
        })
        
        setInvoiceData(invoiceMap)
      } catch (error) {
        console.error('Failed to fetch invoice data:', error)
      } finally {
        setIsLoadingInvoices(false)
      }
    }

    fetchInvoiceData()
  }, [order.id, order.fulfillments])

  // Fetch tracking numbers for each fulfillment
  useEffect(() => {
    const fetchTrackingData = async () => {
      if (!order.fulfillments || order.fulfillments.length === 0) return
      
      setIsLoadingTracking(true)
      try {
        const trackingPromises = order.fulfillments.map(async (fulfillment) => {
          try {
            const headers = await getAuthHeaders()
            const data: any = await sdk.client.fetch(`/store/fulfillment-tracking?fulfillment_id=${fulfillment.id}`, {
              method: "GET",
              credentials: "include",
              headers
            })
            return { fulfillmentId: fulfillment.id, trackingNumbers: Array.isArray(data?.tracking_numbers) ? data.tracking_numbers : [] }
          } catch (error) {
            // No tracking numbers found for this fulfillment
          }
          return { fulfillmentId: fulfillment.id, trackingNumbers: [] }
        })
        
        const results = await Promise.all(trackingPromises)
        const trackingMap: Record<string, string[]> = {}
        
        results.forEach(({ fulfillmentId, trackingNumbers }) => {
          trackingMap[fulfillmentId] = trackingNumbers
        })
        
        setTrackingData(trackingMap)
      } catch (error) {
        console.error('Failed to fetch tracking data:', error)
      } finally {
        setIsLoadingTracking(false)
      }
    }

    fetchTrackingData()
  }, [order.id, order.fulfillments])

  const handleAddAllToCart = async () => {
    if (!order.items || order.items.length === 0) return

    setIsAddingAll(true)
    
    try {
      const lineItems = order.items
        .filter(item => item.variant && item.product)
        .map(item => ({
          productVariant: {
            ...item.variant!,
            product: item.product!,
          },
          quantity: item.quantity,
        }))

      if (lineItems.length > 0) {
        addToCartEventBus.emitCartAdd({
          lineItems,
          regionId: order.region_id || "",
        })
      }
    } catch (error) {
      console.error("Error adding all items to cart:", error)
    } finally {
      setIsAddingAll(false)
    }
  }

  return (
    <div className="flex flex-col justify-center gap-y-2">
      <div className="flex gap-2 justify-between items-center mb-2">
        <LocalizedClientLink
          href="/account/orders"
          className="flex gap-2 items-center text-ui-fg-subtle hover:text-ui-fg-base"
          data-testid="back-to-overview-button"
        >
          <Button variant="secondary">
            <ArrowUturnLeft /> {t("orders.back")}
          </Button>
        </LocalizedClientLink>
      </div>

      <div className="small:grid small:grid-cols-6 gap-4 flex flex-col-reverse">
        <div className="small:col-span-4 flex flex-col gap-y-2">
          <h2 className="text-lg font-semibold mb-4">{t("orders.orderDetails")}</h2>
          <Container>
            <Table>
              <Table.Body>
                {order.items?.map((item) => (
                  <Item key={item.id} item={item} order={order} />
                ))}
              </Table.Body>
            </Table>
          </Container>

          {/* Add All to Cart Button */}
          {order.items && order.items.length > 0 && (
            <div className="flex justify-center p-4">
              <Button
                variant="primary"
                onClick={handleAddAllToCart}
                disabled={isAddingAll}
                isLoading={isAddingAll}
                className="flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                {t("orders.addAllToCart")}
              </Button>
            </div>
          )}

          {/* Fulfillment Sections */}
          {order.fulfillments && order.fulfillments.length > 0 && (
            <div className="flex flex-col gap-y-4">
        {order.fulfillments.map((fulfillment: any, index) => (
          <Container key={fulfillment.id}>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">
                        {t("orders.fulfillment")} #{index + 1}
                      </h3>
                      <div className="text-sm">
                        {isLoadingInvoices ? (
                          <span className="text-gray-500">{t("orders.loadingInvoice")}</span>
                        ) : invoiceData[fulfillment.id] ? (
                          <a
                            href={invoiceData[fulfillment.id].invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline font-medium"
                          >
                            {t("orders.viewInvoice")}
                          </a>
                        ) : (
                          <span className="text-gray-500">{t("orders.invoiceNotAvailable")}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>{t("orders.trackingNumbers")}</strong> {isLoadingTracking 
                        ? t("orders.loading") 
                        : trackingData[fulfillment.id] && trackingData[fulfillment.id].length > 0 
                          ? trackingData[fulfillment.id].join(', ') 
                          : t("orders.trackingNotAvailable")}
                    </div>
                  </div>
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell>{t("orders.tableProduct")}</Table.HeaderCell>
                        <Table.HeaderCell>{t("orders.tableSKU")}</Table.HeaderCell>
                        <Table.HeaderCell>{t("orders.tableQuantity")}</Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {Array.isArray(fulfillment?.items) && fulfillment.items.length > 0 ? (
                        fulfillment.items.map((fulfillmentItem: any) => {
                          // Find the corresponding order item
                          const orderItem = order.items?.find((item) => 
                            item.id === fulfillmentItem.item_id || 
                            item.id === fulfillmentItem.line_item_id
                          );
                          
                          return (
                            <Table.Row key={fulfillmentItem.id} className="py-4">
                              <Table.Cell>
                                <div className="flex items-center gap-3">
                                  {orderItem?.thumbnail && (
                                    <Image
                                      src={orderItem.thumbnail}
                                      alt={orderItem.title || 'Product image'}
                                      width={48}
                                      height={48}
                                      className="w-12 h-12 object-contain rounded"
                                    />
                                  )}
                                  <span className="font-medium">
                                    {orderItem?.title || 
                                     orderItem?.product_title || 
                                     t("orders.unknownProduct")}
                                  </span>
                                </div>
                              </Table.Cell>
                              <Table.Cell>
                                <span className="text-sm text-gray-500">
                                  {orderItem?.variant?.sku || 
                                   orderItem?.variant_sku || 
                                   t("orders.na")}
                                </span>
                              </Table.Cell>
                              <Table.Cell>
                                <span className="font-medium">{fulfillmentItem.quantity}</span>
                              </Table.Cell>
                            </Table.Row>
                          );
                        })
                      ) : (
                        <Table.Row>
                          <Table.Cell className="text-center text-gray-500 py-4" style={{width: '100%', gridColumn: '1 / span 3'}}>
                            {t("orders.noItemsInFulfillment")}
                          </Table.Cell>
                        </Table.Row>
                      )}
                    </Table.Body>
                  </Table>
                  </Container>
              ))}
            </div>
          )}

          <Container>
            <OrderSummary order={order} />
          </Container>
        </div>

        <div className="small:col-span-2 flex flex-col gap-y-2">
          <Container>
            <OrderDetails order={order} />
          </Container>

          {(!!order.shipping_address || !!order.shipping_methods?.length) && (
            <Container>
              <ShippingDetails order={order} />
            </Container>
          )}
          {!!order.billing_address && (
            <Container>
              <BillingDetails order={order} />
            </Container>
          )}

          <Container>
            <PaymentSummary order={order} />
          </Container>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsTemplate
