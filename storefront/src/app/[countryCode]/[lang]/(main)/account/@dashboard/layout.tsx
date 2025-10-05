import Image from "next/image"
import React from "react"

// Layout secondario per il ramo autenticato (@dashboard)
// Responsabilità: decorazione visuale (hero/banner, padding) senza rilanciare logica auth
// Il controllo su customer avviene nel layout superiore `account/layout.tsx`.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="relative w-full h-44 overflow-hidden rounded-md bg-neutral-100">
        <Image
          src="/account-block.jpg"
            // Nota: l'immagine esiste in `public/account-block.jpg`. Se in futuro servirà i18n/AB-test
            // si potrà estrarre in un componente parametrico.
          alt="Account banner"
          className="object-cover w-full h-full select-none"
          width={2000}
          height={176}
          priority
        />
      </div>
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  )
}
