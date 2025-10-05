"use client"

import { useState } from "react"

type FormState = {
  success?: boolean
  error?: string
}

export function ContactForm() {
  const [state, setState] = useState<FormState>({})

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const payload = Object.fromEntries(data.entries())
    console.log("Contact form submit", payload)
    setState({ success: true })
    form.reset()
  }

  return (
    <div>
      {state.success && (
        <div className="mb-6 rounded-md border border-green-300 bg-green-50 text-green-800 px-4 py-3 text-sm">
          Messaggio inviato! Ti ricontatteremo a breve.
        </div>
      )}
      {state.error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 text-red-800 px-4 py-3 text-sm">
          Errore durante l'invio: {state.error}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="nome" className="text-sm font-medium text-neutral-800">Il tuo nome *</label>
            <input id="nome" name="nome" required placeholder="Mario Rossi" className="rounded-md border px-3 py-2 text-sm bg-white border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="telefono" className="text-sm font-medium text-neutral-800">Numero di telefono *</label>
            <input id="telefono" name="telefono" required placeholder="+39 333 1234567" pattern="[+0-9 ()-]{6,}" className="rounded-md border px-3 py-2 text-sm bg-white border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-neutral-800">E-mail *</label>
            <input id="email" name="email" type="email" required placeholder="nome@azienda.it" className="rounded-md border px-3 py-2 text-sm bg-white border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="azienda" className="text-sm font-medium text-neutral-800">La tua azienda *</label>
              <input id="azienda" name="azienda" required placeholder="Nome Azienda S.r.l." className="rounded-md border px-3 py-2 text-sm bg-white border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label htmlFor="oggetto" className="text-sm font-medium text-neutral-800">Oggetto *</label>
              <select id="oggetto" name="oggetto" required className="rounded-md border px-3 py-2 text-sm bg-white border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue="">
                <option value="" disabled>Seleziona un'opzione</option>
                <option>Informazioni sui prodotti</option>
                <option>Supporto tecnico</option>
                <option>Fatturazione e pagamenti</option>
                <option>Collaborazioni e partnership</option>
                <option>Produzioni personalizzate</option>
                <option>Altro</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label htmlFor="richiesta" className="text-sm font-medium text-neutral-800">La tua richiesta *</label>
              <textarea id="richiesta" name="richiesta" required rows={6} placeholder="Inserisci i dettagli della tua richiesta..." className="rounded-md border px-3 py-2 text-sm bg-white border-neutral-300 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button type="submit" className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-white text-sm font-medium px-5 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Invia richiesta</button>
            <p className="text-xs text-neutral-500">Tutti i campi sono obbligatori.</p>
          </div>
        </form>
    </div>
  )
}
