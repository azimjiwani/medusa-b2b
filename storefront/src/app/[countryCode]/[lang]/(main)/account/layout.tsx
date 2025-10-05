import { retrieveCustomer } from "@/lib/data/customer"
import AccountLayout from "@/modules/account/templates/account-layout"

export default async function AccountPageLayout({
  dashboard,
  login,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
}) {
  try {
    const customer = await retrieveCustomer().catch(() => null)
    const content = customer ? dashboard : login
    // AccountLayout renderizza la sidebar solo se customer esiste, altrimenti
    // funge da semplice contenitore (uniformando padding/background).
    return <AccountLayout customer={customer}>{content}</AccountLayout>
  } catch (error) {
    console.error("Error in account layout:", error)
    return <AccountLayout customer={null}>{login}</AccountLayout>
  }
}
export const dynamic = "force-dynamic"
