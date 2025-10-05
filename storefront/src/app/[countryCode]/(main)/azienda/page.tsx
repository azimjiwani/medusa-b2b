import { Metadata } from "next"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Azienda",
  description: "Informazioni sulla nostra azienda.",
}

export default function AziendaPage() {
  return (
    <div className="bg-neutral-100">
      <div className="content-container py-10 flex flex-col gap-10">
        <header>
          <h1 className="text-3xl font-semibold mb-4 tracking-tight">Azienda</h1>
          <p className="text-neutral-700 max-w-3xl leading-relaxed text-sm">
            MORE EUROPE S.r.l è nata nel 2009 dall'intuizione dei tre soci fondatori ed in breve tempo è diventata una importante realtà nel settore dell'abbigliamento promozionale e da lavoro.
          </p>
        </header>

        <section className="grid gap-10 lg:grid-cols-[1fr_380px] items-start">
          <div className="flex flex-col gap-6 max-w-prose text-sm leading-relaxed text-neutral-700">
            <p>
              Il marchio <strong>MORE</strong> si contraddistingue sul mercato nazionale per il prezzo decisamente concorrenziale del prodotto e per un ottimo rapporto <strong>QUALITA’ / PREZZO</strong>. Avendo le proprie linee produttive in Bangladesh, localizzate nelle città di Gazipur e Narangonji, il marchio MORE è in grado di garantire un elevato standard di produzione.
            </p>
            <p>
              Grazie alle proprie tintorie computerizzate MORE è in grado di mantenere inalterata la tonalità dei colori dei propri prodotti, evitando i problemi della diversità dei bagni di colore.
            </p>
            <p>
              Con le proprie macchine di finissaggio, garzatura e smerigliatura, acquistate da note aziende di meccanotessile del distretto di Prato, MORE è in grado di rientrare senza nessuna difficoltà in tutti i parametri e in tutte le restrizioni necessarie a poter disporre delle <strong>CERTIFICAZIONI OEKOTEX STANDARD 100</strong> e <strong>WRAP</strong>.
            </p>

            <figure className="rounded-md overflow-hidden border border-neutral-200 bg-white">
              <Image
                src="https://www.moreeurope.com/ckeditor_assets/pictures/1/content_azienda_1.png"
                alt="Stabilimento produttivo More Europe"
                width={1200}
                height={650}
                className="w-full h-auto object-cover"
                sizes="(max-width: 768px) 100vw, 720px"
                priority
              />
            </figure>

            <p>
              MORE non produce solo abbigliamento promozionale e da lavoro (uomo, donna, bambino), ma anche articoli personalizzati (stampati o ricamati) direttamente all'origine.
            </p>
            <p>
              MORE EUROPE attraverso le sue divisioni interne propone al cliente i seguenti vantaggi:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>costi contenuti</li>
              <li>massima velocità di produzione</li>
              <li>ampio magazzino per garantire sempre la massima disponibilità degli articoli</li>
              <li>esperienza e professionalità maturata nel tempo</li>
            </ul>
            <p className="font-medium text-neutral-800">Contattateci per un preventivo.</p>

            <figure className="rounded-md overflow-hidden border border-neutral-200 bg-white">
              <Image
                src="https://www.moreeurope.com/ckeditor_assets/pictures/3/content_magazzinomore.jpg"
                alt="Magazzino More Europe"
                width={1200}
                height={650}
                className="w-full h-auto object-cover"
                sizes="(max-width: 768px) 100vw, 720px"
              />
            </figure>
          </div>
          <aside className="flex flex-col gap-6 text-sm text-neutral-700">
            <div className="p-5 rounded-lg border bg-white border-neutral-200 shadow-sm">
              <h2 className="text-base font-semibold mb-3 tracking-tight">Perché scegliere MORE</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Produzione interna certificata</li>
                <li>Controllo qualità costante</li>
                <li>Personalizzazioni all'origine</li>
                <li>Logistica efficiente</li>
              </ul>
            </div>
            <div className="p-5 rounded-lg border bg-white border-neutral-200 shadow-sm">
              <h2 className="text-base font-semibold mb-3 tracking-tight">Certificazioni</h2>
              <p className="leading-relaxed">OEKOTEX STANDARD 100 e WRAP garantiscono sicurezza, sostenibilità e responsabilità sociale lungo tutta la filiera produttiva.</p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
