import { retrieveCompany } from "@/lib/data/companies"
import { retrieveCustomer } from "@/lib/data/customer"
import { listRegions } from "@/lib/data/regions"
import CompanyCard from "@/modules/account/components/company-card"
import { Heading } from "@medusajs/ui"
import { notFound } from "next/navigation"

export default async function Company({ params }: { params: { countryCode: string, lang: string } }) {
  const customer = await retrieveCustomer().catch(() => null)
  const regions = await listRegions().catch(() => null)

  if (!customer || !customer?.employee?.company || !regions) return notFound()

  const company = await retrieveCompany(customer.employee.company.id).catch(() => null)
  if (!company) return notFound()

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col gap-y-4">
        <Heading level="h2" className="text-lg text-neutral-950">
          Company Details
        </Heading>
        <CompanyCard company={company} regions={regions} />
      </div>
      {/* Futuro: approvals / employees / invites */}
    </div>
  )
}
