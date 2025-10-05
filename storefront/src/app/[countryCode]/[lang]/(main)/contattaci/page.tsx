import { ContactForm } from "@/modules/contact/components/contact-form"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contattaci",
  description: "Mettiti in contatto con il nostro team.",
}

export default function ContattaciPage() {
  return (
    <div className="bg-neutral-100">
      <div className="content-container py-10 max-w-4xl">
        <h1 className="text-3xl font-semibold mb-4 tracking-tight">Contattaci</h1>
        <p className="text-sm text-neutral-700 max-w-prose mb-2">
          Contattaci per qualsiasi domanda che riguarda l'azienda o i servizi che offriamo.
        </p>
        <p className="text-sm text-neutral-700 max-w-prose mb-8">
          Faremo del nostro meglio per rispondere il prima possibile.
        </p>
        <ContactForm />
      </div>
    </div>
  )
}
