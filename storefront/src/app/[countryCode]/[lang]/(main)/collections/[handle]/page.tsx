import { getCollectionByHandle, listCollections } from "@/lib/data/collections"
import { retrieveCustomer } from "@/lib/data/customer"
import { listRegions } from "@/lib/data/regions"
import CollectionTemplate from "@/modules/collections/templates"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import { MinimalCustomerInfo } from "@/types"
import { StoreCollection, StoreRegion } from "@medusajs/types"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const dynamicParams = true

type Props = {
  params: Promise<{ handle: string; countryCode: string; lang: string }>
  searchParams: Promise<{
    page?: string
    sortBy?: SortOptions
  }>
}

export const PRODUCT_LIMIT = 12

export async function generateStaticParams() {
  const { collections } = await listCollections({ offset: "0", limit: "100" })
  if (!collections) { return [] }

  const countryCodes = await listRegions().then(
    (regions: StoreRegion[]) =>
      regions
        ?.map((r) => r.countries?.map((c) => c.iso_2))
        .flat()
        .filter(Boolean) as string[]
  )

  const collectionHandles = collections.map((collection: StoreCollection) => collection.handle)

  return countryCodes
    ?.map((countryCode: string) =>
      collectionHandles.map((handle: string | undefined) => ({ countryCode, handle }))
    )
    .flat()
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const collection = await getCollectionByHandle(params.handle)
  if (!collection) { notFound() }
  return { title: `${collection.title} | Medusa Store`, description: `${collection.title} collection` }
}

export default async function CollectionPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams
  const collection = await getCollectionByHandle(params.handle)
  const customer = await retrieveCustomer()
  const minimalCustomerInfo: MinimalCustomerInfo = { isLoggedIn: !!customer, isApproved: !!customer?.metadata?.approved }
  if (!collection) { notFound() }
  return (
    <CollectionTemplate
      collection={collection}
      page={page}
      sortBy={sortBy}
      countryCode={params.countryCode}
      customer={minimalCustomerInfo}
    />
  )
}
export const dynamic = "force-dynamic"
