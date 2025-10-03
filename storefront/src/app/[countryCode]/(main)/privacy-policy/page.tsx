import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How we collect, use, and protect your personal information",
}

export default function PrivacyPolicy() {
  return (
    <div className="content-container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-neutral max-w-none space-y-6">
          <p>
            BNT Wholesale ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard information you provide to us when using our website or services.
          </p>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Personal Information:</strong> such as your name, company name, email address, phone number, billing/shipping address, and payment details.</li>
              <li><strong>Account Information:</strong> if you register for an account, we may store login credentials and related preferences.</li>
              <li><strong>Usage Data:</strong> such as your IP address, browser type, device information, and how you interact with our website.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
            <p>We use the information we collect for purposes including:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Processing and fulfilling orders.</li>
              <li>Communicating with you about your purchases or inquiries.</li>
              <li>Improving our website, products, and customer service.</li>
              <li>Complying with legal and regulatory requirements.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Sharing Your Information</h2>
            <p>We do not sell or rent your personal information. We may share information only in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Service Providers:</strong> with third-party vendors who help us operate our website, process payments, or deliver orders.</li>
              <li><strong>Legal Requirements:</strong> when required by law, regulation, or legal process.</li>
              <li><strong>Business Transfers:</strong> if our company is merged, acquired, or sold.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Security</h2>
            <p>
              We implement reasonable technical and organizational measures to protect your personal information. However, no system is completely secure, and we cannot guarantee absolute security of your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Your Choices</h2>
            <p>You may:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Opt out of receiving promotional emails by following the unsubscribe link in our communications.</li>
              <li>Request access, correction, or deletion of your personal data by contacting us at info@bntbng.com.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Cookies and Tracking</h2>
            <p>
              Our website may use cookies or similar technologies to improve user experience, analyze traffic, and personalize content. You can disable cookies in your browser settings, but some features of the site may not function properly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Children's Privacy</h2>
            <p>
              Our website and services are intended for business use and are not directed toward children under 13. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with the updated effective date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Contact Us</h2>
            <p>If you have any questions or concerns about this Privacy Policy, please contact us at:</p>
            <div className="mt-2">
              <p>info@bntbng.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
