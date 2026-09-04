import { getCollectionByHandle, listCollections } from "@/lib/data/collections"
import { listRegions } from "@/lib/data/regions"
import { retrieveCustomer } from "@/lib/data/customer"
import CollectionTemplate from "@/modules/collections/templates"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import { MinimalCustomerInfo } from "@/types"
import { StoreCollection, StoreRegion } from "@medusajs/types"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listBngProductOptions } from "@/lib/data/products"
import { parseProductOptionFilters } from "@/lib/util/product-option-filters"

export const dynamicParams = true

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
  searchParams: Promise<{
    page?: string
    sortBy?: SortOptions
    option?: string | string[]
  }>
}

export const PRODUCT_LIMIT = 12

export async function generateStaticParams() {
  const { collections } = await listCollections({
    offset: "0",
    limit: "100",
  })

  if (!collections) {
    return []
  }

  const countryCodes = await listRegions().then(
    (regions: StoreRegion[]) =>
      regions
        ?.map((r) => r.countries?.map((c) => c.iso_2))
        .flat()
        .filter(Boolean) as string[]
  )

  const collectionHandles = collections.map(
    (collection: StoreCollection) => collection.handle
  )

  const staticParams = countryCodes
    ?.map((countryCode: string) =>
      collectionHandles.map((handle: string | undefined) => ({
        countryCode,
        handle,
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const collection = await getCollectionByHandle(params.handle)

  if (!collection) {
    notFound()
  }

  const metadata = {
    title: `${collection.title} | Medusa Store`,
    description: `${collection.title} collection`,
  } as Metadata

  return metadata
}

export default async function CollectionPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page, option } = searchParams

  const collection = await getCollectionByHandle(params.handle)
  const customer = await retrieveCustomer()
  const productOptions = await listBngProductOptions()
  const minimalCustomerInfo: MinimalCustomerInfo = {
    isLoggedIn: !!customer,
    isApproved: !!customer?.metadata?.approved,
  }

  if (!collection) {
    notFound()
  }

  return (
    <CollectionTemplate
      collection={collection}
      page={page}
      sortBy={sortBy}
      countryCode={params.countryCode}
      customer={minimalCustomerInfo}
      optionFilters={parseProductOptionFilters(option)}
      productOptions={productOptions}
    />
  )
}
export const dynamic = "force-dynamic"
