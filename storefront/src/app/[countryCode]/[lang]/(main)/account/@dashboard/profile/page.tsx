import { retrieveCustomer } from "@/lib/data/customer"
import { listRegions } from "@/lib/data/regions"
import ProfileCard from "@/modules/account/components/profile-card"
import { Heading } from "@medusajs/ui"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Profile",
  description: "View and edit your Medusa Store profile.",
}

export default async function Profile({ params }: { params: { countryCode: string, lang: string } }) {
  const customer = await retrieveCustomer().catch(() => null)
  const regions = await listRegions().catch(() => null)

  if (!customer || !regions) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="profile-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <Heading level="h2" className="text-lg text-neutral-950">
          Details
        </Heading>
        <ProfileCard customer={customer} />
      </div>
      {/* <div className="mb-8 flex flex-col gap-y-4">
        <Heading level="h2" className="text-lg text-neutral-950">
          Security
        </Heading>
        <SecurityCard customer={customer} />
      </div> */}
    </div>
  )
}
