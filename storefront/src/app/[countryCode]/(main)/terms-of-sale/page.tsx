import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Sale",
  description: "Terms and conditions for wholesale transactions",
}

export default function TermsOfSale() {
  return (
    <div className="content-container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Terms of Sale</h1>

        <div className="prose prose-neutral max-w-none space-y-6">
          <p>
            These Terms of Sale (&quot;Terms&quot;) govern all wholesale transactions conducted through BNT Wholesale (&quot;Seller,&quot; &quot;we,&quot; or &quot;us&quot;). By placing an order, the purchaser (&quot;Buyer,&quot; &quot;you&quot;) agrees to be bound by these Terms.
          </p>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. All Sales Final</h2>
            <p>
              All wholesale sales are final. No returns, cancellations, or refunds will be accepted once an order has been placed, except as required by applicable law or at the discretion of the Seller&apos;s team.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Manufacturer&apos;s Warranty</h2>
            <p>
              Products may be covered by the original manufacturer&apos;s warranty, if applicable. The Seller makes no additional warranties, expressed or implied, including merchantability or fitness for a particular purpose. All warranty claims must be directed to the manufacturer in accordance with their policies and procedures.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Inspection and Discrepancies</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Buyer must inspect all goods upon receipt.</li>
              <li>Any discrepancies, shortages, or damaged goods must be reported in writing to Seller within 48 hours of receiving the invoice.</li>
              <li>Failure to notify Seller within this period constitutes acceptance of the goods as delivered.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Pricing and Payment</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Prices are subject to change without notice, unless otherwise agreed in writing.</li>
              <li>Payment terms are as stated on the invoice. Late payments may incur additional fees, interest, or collection costs.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Shipping and Risk of Loss</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Title and risk of loss pass to Buyer upon shipment of goods.</li>
              <li>Delivery dates are estimates only, and Seller shall not be liable for delays caused by carriers, customs, or other circumstances beyond our control.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Seller&apos;s liability shall be limited to the purchase price of the goods in question. Seller shall not be liable for indirect, incidental, or consequential damages.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Ontario, Canada. Any disputes shall be resolved exclusively in the courts located in Ontario, Canada.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
