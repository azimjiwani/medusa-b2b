import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Condizioni di Vendita",
  description: "Termini e condizioni per le transazioni commerciali con More Europe S.r.l.",
}

export default function TermsOfSale() {
  return (
    <div className="content-container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Condizioni Generali di Vendita</h1>

        <div className="prose prose-neutral max-w-none space-y-6">
          <p>
            Le presenti Condizioni Generali di Vendita (&quot;Condizioni&quot;) disciplinano tutte le transazioni commerciali 
            condotte da MORE EUROPE S.R.L. (&quot;Venditore&quot;, &quot;noi&quot; o &quot;società&quot;) con sede legale in 
            Viale Montegrappa n.306, 59100 Prato (PO), P.IVA 02148650977. Effettuando un ordine, l'acquirente 
            (&quot;Compratore&quot;, &quot;voi&quot; o &quot;cliente&quot;) accetta di essere vincolato dalle presenti Condizioni.
          </p>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Oggetto e Campo di Applicazione</h2>
            <p>
              Le presenti condizioni si applicano a tutte le vendite di tessuti, prodotti ausiliari tessili, articoli di 
              abbigliamento e relativi accessori, nonché materiali e scarti di lavorazione in ferro ed acciaio effettuate 
              da MORE EUROPE S.R.L. I nostri prodotti sono destinati esclusivamente ad operatori professionali del settore.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Formazione del Contratto</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Gli ordini si considerano accettati solo a seguito di conferma scritta da parte di MORE EUROPE S.R.L.</li>
              <li>Le offerte e i preventivi hanno validità di 30 giorni salvo diversa indicazione scritta.</li>
              <li>Eventuali modifiche alle presenti condizioni devono essere concordate per iscritto.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Prezzi e Condizioni di Pagamento</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>I prezzi si intendono al netto di IVA, trasporto e imballaggio, salvo diversa indicazione.</li>
              <li>I prezzi possono essere modificati senza preavviso, ma si applicano quelli vigenti al momento della conferma d'ordine.</li>
              <li>Il pagamento deve essere effettuato secondo le modalità e i termini indicati in fattura.</li>
              <li>In caso di ritardo nei pagamenti, saranno applicati interessi di mora nella misura del tasso ufficiale 
                di riferimento maggiorato di 8 punti percentuali, oltre al risarcimento dei danni.</li>
              <li>In caso di mancato pagamento, MORE EUROPE S.R.L. si riserva il diritto di sospendere le forniture.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Consegna e Trasferimento del Rischio</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Le consegne si intendono rese &quot;Franco Fabbrica&quot; (EXW) presso i nostri magazzini, salvo diversi accordi.</li>
              <li>I termini di consegna sono indicativi e non vincolanti. MORE EUROPE S.R.L. non è responsabile per ritardi 
                dovuti a cause di forza maggiore.</li>
              <li>Il rischio di perimento e deterioramento della merce si trasferisce al compratore al momento della consegna 
                al vettore o al ritiro presso i nostri magazzini.</li>
              <li>Il compratore è tenuto a verificare lo stato della merce al momento del ricevimento e a segnalare eventuali 
                difetti o mancanze entro 8 giorni dalla consegna.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Garanzia e Responsabilità</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>MORE EUROPE S.R.L. garantisce la conformità dei prodotti alle specifiche tecniche comunicate.</li>
              <li>La garanzia è limitata alla sostituzione o riparazione dei prodotti difettosi, escluso ogni altro risarcimento.</li>
              <li>Sono esclusi dalla garanzia i difetti derivanti da uso improprio, normale usura, negligenza o modifiche 
                apportate dal compratore.</li>
              <li>La responsabilità di MORE EUROPE S.R.L. è limitata al valore della merce oggetto del contratto.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Diritto di Recesso e Resi</h2>
            <p>
              Data la natura commerciale B2B delle nostre transazioni, il diritto di recesso previsto dal Codice del Consumo 
              non si applica. I resi sono accettati solo in caso di merce difettosa o non conforme, previa autorizzazione 
              scritta di MORE EUROPE S.R.L. e entro i termini di garanzia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Riserva di Proprietà</h2>
            <p>
              La merce rimane di proprietà di MORE EUROPE S.R.L. fino al completo pagamento del prezzo. Il compratore 
              si impegna a custodire la merce con la diligenza del buon padre di famiglia e a non vincolarla a favore di terzi.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Risoluzione per Inadempimento</h2>
            <p>
              In caso di inadempimento grave del compratore, MORE EUROPE S.R.L. si riserva il diritto di risolvere il contratto 
              di diritto, trattenere eventuali acconti versati e richiedere il risarcimento dei danni subiti.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Forza Maggiore</h2>
            <p>
              MORE EUROPE S.R.L. non è responsabile per ritardi o inadempimenti dovuti a eventi di forza maggiore, inclusi 
              ma non limitati a: calamità naturali, scioperi, blocchi dei trasporti, provvedimenti delle autorità, pandemie 
              o altre circostanze eccezionali non prevedibili e non dipendenti dalla volontà della società.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Trattamento dei Dati Personali</h2>
            <p>
              Il trattamento dei dati personali avviene nel rispetto del Regolamento UE 2016/679 (GDPR) e della normativa 
              italiana sulla privacy. Per maggiori informazioni, consultare la nostra Informativa sulla Privacy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Legge Applicabile e Foro Competente</h2>
            <p>
              Le presenti condizioni sono disciplinate dalla legge italiana. Per qualsiasi controversia relativa 
              all'interpretazione, esecuzione e risoluzione del contratto, è competente esclusivamente il Foro di Prato. 
              Per i rapporti con consumatori, resta ferma la competenza del foro del consumatore per le azioni da questi 
              promosse.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Disposizioni Finali</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Le presenti condizioni sostituiscono ogni altro accordo precedente tra le parti.</li>
              <li>Eventuali modifiche devono essere concordate per iscritto.</li>
              <li>L'invalidità di una o più clausole non comporta l'invalidità dell'intero contratto.</li>
              <li>Le presenti condizioni sono efficaci dalla data di pubblicazione sul sito web aziendale.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Contatti</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <p><strong>MORE EUROPE S.R.L.</strong></p>
              <p>Sede Legale: Viale Montegrappa n.306, 59100 Prato (PO)</p>
              <p>P.IVA: 02148650977</p>
              <p>Email: info@moreeurope.com</p>
              <p>PEC: moreeurope@legalemail.it</p>
              <p>Sito web: www.moreeurope.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
