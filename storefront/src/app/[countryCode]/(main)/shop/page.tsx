import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shop",
  description: "Esplora il nostro catalogo di prodotti.",
}

export default function ShopPlaceholder() {
  return (
    <div className="bg-neutral-100">
      <div className="content-container py-10">
        <h1 className="text-2xl font-semibold mb-4">Shop</h1>
        <p className="text-sm text-neutral-700 max-w-prose">
          Questa è una pagina placeholder per la sezione Shop. Qui potrai inserire contenuti, categorie o vetrine di prodotti personalizzate.
        </p>
      </div>
    </div>
  )
}
