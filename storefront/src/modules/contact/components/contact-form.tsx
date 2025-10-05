"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

type FormState = {
  success?: boolean
  error?: string
}

export function ContactForm() {
  const [state, setState] = useState<FormState>({})
  const [oggetto, setOggetto] = useState<string>("")
  const [ordineRef, setOrdineRef] = useState<string>("")
  const t = useTranslations()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    // Se la textarea è nascosta (catalog request) rimuoviamo eventuale chiave "richiesta"
    if (oggetto === t("form.contact.subject.catalog")) {
      data.delete("richiesta")
    }
    // Se non è billing rimuoviamo riferimento ordine
    if (oggetto !== t("form.contact.subject.billing")) {
      data.delete("riferimento_ordine")
    }
    const payload = Object.fromEntries(data.entries())
    console.log("Contact form submit", payload)
    setState({ success: true })
    form.reset()
    setOggetto("")
    setOrdineRef("")
  }

  return (
    <div>
      {state.success && (
        <div className="mb-6 rounded-md border border-green-300 bg-green-50 text-green-800 px-4 py-3 text-sm">
          {t("form.contact.success")}
        </div>
      )}
      {state.error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 text-red-800 px-4 py-3 text-sm">
          {t("form.contact.error")}: {state.error}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="nome" className="text-sm font-medium text-neutral-800">{t("form.contact.nameLabel")} *</label>
            <input id="nome" name="nome" required placeholder={t("form.contact.namePlaceholder")!} className="rounded-md border px-3 py-2 text-sm bg-white border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="telefono" className="text-sm font-medium text-neutral-800">{t("form.contact.phoneLabel")} *</label>
            <input id="telefono" name="telefono" required placeholder={t("form.contact.phonePlaceholder")!} pattern="[+0-9 ()-]{6,}" className="rounded-md border px-3 py-2 text-sm bg-white border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-neutral-800">{t("form.contact.emailLabel")} *</label>
            <input id="email" name="email" type="email" required placeholder={t("form.contact.emailPlaceholder")!} className="rounded-md border px-3 py-2 text-sm bg-white border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="azienda" className="text-sm font-medium text-neutral-800">{t("form.contact.companyLabel")} *</label>
              <input id="azienda" name="azienda" required placeholder={t("form.contact.companyPlaceholder")!} className="rounded-md border px-3 py-2 text-sm bg-white border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label htmlFor="oggetto" className="text-sm font-medium text-neutral-800">{t("form.contact.subjectLabel")} *</label>
              <select
                id="oggetto"
                name="oggetto"
                required
                value={oggetto}
                onChange={(e) => setOggetto(e.target.value)}
                className="rounded-md border px-3 py-2 text-sm bg-white border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>{t("form.contact.selectPlaceholder")}</option>
                <option value={t("form.contact.subject.catalog")!}>{t("form.contact.subject.catalog")}</option>
                <option value={t("form.contact.subject.billing")!}>{t("form.contact.subject.billing")}</option>
                <option value={t("form.contact.subject.partnership")!}>{t("form.contact.subject.partnership")}</option>
                <option value={t("form.contact.subject.special")!}>{t("form.contact.subject.special")}</option>
                <option value={t("form.contact.subject.other")!}>{t("form.contact.subject.other")}</option>
              </select>
            </div>
            {oggetto === t("form.contact.subject.billing") && (
              <div className="flex flex-col gap-1 md:col-span-2">
                <label htmlFor="riferimento_ordine" className="text-sm font-medium text-neutral-800">{t("form.contact.orderRefLabel")}</label>
                <input
                  id="riferimento_ordine"
                  name="riferimento_ordine"
                  placeholder="Es. ORD-12345"
                  value={ordineRef}
                  onChange={(e) => setOrdineRef(e.target.value)}
                  className="rounded-md border px-3 py-2 text-sm bg-white border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            {oggetto !== t("form.contact.subject.catalog") && (
              <div className="flex flex-col gap-1 md:col-span-2">
                <label htmlFor="richiesta" className="text-sm font-medium text-neutral-800">{t("form.contact.messageLabel")} *</label>
                <textarea
                  id="richiesta"
                  name="richiesta"
                  required
                  rows={6}
                  placeholder={t("form.contact.messagePlaceholder")!}
                  className="rounded-md border px-3 py-2 text-sm bg-white border-neutral-300 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button type="submit" className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-white text-sm font-medium px-5 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t("form.contact.submit")}</button>
            <p className="text-xs text-neutral-500">{t("form.contact.requiredNote")}</p>
          </div>
        </form>
    </div>
  )
}
