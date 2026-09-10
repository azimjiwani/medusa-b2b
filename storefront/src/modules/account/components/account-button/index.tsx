import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import User from "@/modules/common/icons/user"
import { B2BCustomer } from "@/types/global"

export default async function AccountButton({
  customer,
}: {
  customer: B2BCustomer | null
}) {
  return (
    <LocalizedClientLink
      className="flex h-11 min-w-11 items-center justify-center rounded-full text-[13px] font-medium text-[#515154] transition-colors hover:bg-[#f5f5f7] hover:text-[#1d1d1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc]"
      aria-label={customer ? "My account" : "Log in"}
      href="/account"
    >
      <span className="flex items-center gap-1.5 small:px-2">
        <User />
        <span className="hidden max-w-24 truncate small:inline-block">
          {customer ? customer.first_name : "Log in"}
        </span>
      </span>
    </LocalizedClientLink>
  )
}
