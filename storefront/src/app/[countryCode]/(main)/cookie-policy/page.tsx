import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cookie Policy e GDPR",
  description: "Informazioni sui cookie e conformità GDPR di More Europe S.r.l.",
}

export default function CookiePolicy() {
  return (
    <div className="content-container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Cookie Policy e GDPR</h1>

        <div className="prose prose-neutral max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Informazioni sui Cookie</h2>
            <p>
              I cookie sono piccoli file di testo che vengono memorizzati sul dispositivo dell'utente quando visita 
              un sito web. MORE EUROPE S.R.L., con sede legale in Viale Montegrappa n.306, 59100 Prato (PO), 
              P.IVA 02148650977, utilizza i cookie per migliorare l'esperienza di navigazione e fornire servizi 
              personalizzati.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Tipologie di Cookie Utilizzati</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">Cookie Tecnici</h3>
            <p>
              Questi cookie sono essenziali per il corretto funzionamento del sito web e non possono essere disabilitati. 
              Includono:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Cookie di autenticazione:</strong> per mantenere l'utente collegato durante la sessione</li>
              <li><strong>Cookie di sicurezza:</strong> per proteggere dalle frodi e garantire la sicurezza</li>
              <li><strong>Cookie di navigazione:</strong> per ricordare le preferenze di navigazione</li>
              <li><strong>Cookie del carrello:</strong> per mantenere i prodotti selezionati nel carrello</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Cookie Analitici</h3>
            <p>
              Utilizziamo cookie analitici per comprendere come i visitatori interagiscono con il nostro sito web. 
              Questi dati ci aiutano a migliorare i nostri servizi:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Analisi del traffico e delle pagine più visitate</li>
              <li>Tempo di permanenza sul sito</li>
              <li>Percorsi di navigazione degli utenti</li>
              <li>Dispositivi e browser utilizzati</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Cookie di Funzionalità</h3>
            <p>
              Questi cookie permettono al sito di ricordare le scelte effettuate dall'utente per fornire 
              funzionalità avanzate e personalizzate:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Preferenze linguistiche</li>
              <li>Impostazioni di visualizzazione</li>
              <li>Prodotti preferiti o liste desideri</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Cookie di Terze Parti</h2>
            <p>
              Il nostro sito può utilizzare servizi di terze parti che installano i propri cookie:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Google Analytics:</strong> per l'analisi del traffico web</li>
              <li><strong>Servizi di pagamento:</strong> per elaborare transazioni sicure</li>
              <li><strong>Servizi di spedizione:</strong> per il tracciamento degli ordini</li>
            </ul>
            <p className="mt-4">
              Questi servizi hanno le proprie policy sui cookie. Vi invitiamo a consultare le rispettive 
              informative privacy per maggiori dettagli.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Gestione dei Cookie</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">Come Disabilitare i Cookie</h3>
            <p>
              È possibile gestire le preferenze sui cookie attraverso le impostazioni del browser. 
              Ecco le guide per i principali browser:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Chrome:</strong> Impostazioni → Privacy e sicurezza → Cookie e altri dati dei siti</li>
              <li><strong>Firefox:</strong> Impostazioni → Privacy e sicurezza → Cookie e dati dei siti web</li>
              <li><strong>Safari:</strong> Preferenze → Privacy → Gestisci dati siti web</li>
              <li><strong>Edge:</strong> Impostazioni → Privacy, ricerca e servizi → Cookie</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Conseguenze della Disabilitazione</h3>
            <p>
              La disabilitazione dei cookie potrebbe limitare alcune funzionalità del sito, come:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Impossibilità di mantenere il login</li>
              <li>Perdita dei prodotti nel carrello</li>
              <li>Ripristino delle preferenze ad ogni visita</li>
              <li>Funzionalità ridotte nell'area clienti B2B</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Conformità GDPR</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">Base Giuridica del Trattamento</h3>
            <p>
              Il trattamento dei dati attraverso i cookie avviene sulla base delle seguenti basi giuridiche 
              previste dal GDPR (Regolamento UE 2016/679):
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Consenso (Art. 6, paragrafo 1, lettera a):</strong> per cookie analitici e di marketing</li>
              <li><strong>Interesse legittimo (Art. 6, paragrafo 1, lettera f):</strong> per cookie tecnici e di sicurezza</li>
              <li><strong>Esecuzione di un contratto (Art. 6, paragrafo 1, lettera b):</strong> per cookie necessari alle transazioni B2B</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Diritti dell'Interessato</h3>
            <p>
              In conformità al GDPR, l'utente ha diritto a:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Accesso:</strong> ottenere informazioni sui dati trattati</li>
              <li><strong>Rettifica:</strong> correggere dati inesatti o incompleti</li>
              <li><strong>Cancellazione:</strong> richiedere la rimozione dei dati</li>
              <li><strong>Limitazione:</strong> limitare il trattamento in specifici casi</li>
              <li><strong>Portabilità:</strong> ricevere i dati in formato strutturato</li>
              <li><strong>Opposizione:</strong> opporsi al trattamento per motivi legittimi</li>
              <li><strong>Revoca del consenso:</strong> ritirare il consenso precedentemente dato</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Data Protection Officer (DPO)</h3>
            <p>
              Per esercitare i propri diritti o per qualsiasi questione relativa al trattamento dei dati, 
              è possibile contattare il nostro Responsabile della Protezione dei Dati:
            </p>
            <div className="bg-gray-50 p-4 rounded-md mt-4">
              <p><strong>Francesco Benelli</strong></p>
              <p>Via Circonvallazione Sinistra 95, Montemurlo (PO)</p>
              <p>Email: info@moreeurope.com</p>
              <p>PEC: moreeurope@legalemail.it</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Trasferimenti Internazionali</h2>
            <p>
              Alcuni dei servizi utilizzati potrebbero trasferire dati al di fuori dell'Unione Europea. 
              In tali casi, MORE EUROPE S.R.L. garantisce che:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>I trasferimenti avvengono verso paesi con decisione di adeguatezza della Commissione Europea</li>
              <li>Sono implementate garanzie appropriate come Standard Contractual Clauses (SCC)</li>
              <li>Sono rispettate tutte le prescrizioni del GDPR per i trasferimenti internazionali</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Conservazione dei Dati</h2>
            <p>
              I dati raccolti attraverso i cookie sono conservati per i seguenti periodi:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Cookie di sessione:</strong> eliminati alla chiusura del browser</li>
              <li><strong>Cookie persistenti:</strong> fino a 24 mesi o revoca del consenso</li>
              <li><strong>Dati analitici:</strong> massimo 26 mesi come previsto da Google Analytics</li>
              <li><strong>Cookie tecnici:</strong> per la durata strettamente necessaria al servizio</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Sicurezza dei Dati</h2>
            <p>
              MORE EUROPE S.R.L. implementa misure tecniche e organizzative appropriate per proteggere 
              i dati personali raccolti attraverso i cookie:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Crittografia dei dati sensibili</li>
              <li>Accesso limitato ai dati su base "need-to-know"</li>
              <li>Monitoraggio costante degli accessi</li>
              <li>Backup regolari e piani di disaster recovery</li>
              <li>Formazione continua del personale sulla protezione dati</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Aggiornamenti della Policy</h2>
            <p>
              La presente Cookie Policy può essere aggiornata periodicamente per riflettere cambiamenti 
              nei nostri servizi o nella normativa applicabile. Vi invitiamo a consultare regolarmente 
              questa pagina per rimanere informati sulle nostre pratiche relative ai cookie.
            </p>
            <p className="mt-4">
              <strong>Ultimo aggiornamento:</strong> 5 ottobre 2025
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Contatti</h2>
            <p>
              Per qualsiasi domanda o chiarimento relativo alla presente Cookie Policy, è possibile contattarci:
            </p>
            <div className="bg-gray-50 p-4 rounded-md mt-4">
              <p><strong>MORE EUROPE S.R.L.</strong></p>
              <p>Sede Legale: Viale Montegrappa n.306, 59100 Prato (PO)</p>
              <p>P.IVA: 02148650977</p>
              <p>Email: info@moreeurope.com</p>
              <p>PEC: moreeurope@legalemail.it</p>
              <p>Telefono: +39 0574 722 003</p>
              <p>Sito web: www.moreeurope.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Autorità di Controllo</h2>
            <p>
              In caso di violazione dei diritti relativi alla protezione dei dati personali, è possibile 
              presentare reclamo al Garante per la Protezione dei Dati Personali:
            </p>
            <div className="bg-gray-50 p-4 rounded-md mt-4">
              <p><strong>Garante per la Protezione dei Dati Personali</strong></p>
              <p>Piazza Venezia, 11 - 00187 Roma</p>
              <p>Telefono: +39 06 69677 1</p>
              <p>Fax: +39 06 69677 3785</p>
              <p>Email: garante@gpdp.it</p>
              <p>PEC: protocollo@pec.gpdp.it</p>
              <p>Sito web: www.garanteprivacy.it</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}