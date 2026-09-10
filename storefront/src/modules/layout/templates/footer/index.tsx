import Image from "next/image"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

const footerLinkClass =
  "inline-flex min-h-11 items-center rounded-md text-sm text-[#6e6e73] transition-colors hover:text-[#0066cc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc]"

export default function Footer() {
  return (
    <footer className="border-t border-[#e8e8ed] bg-[#f5f5f7] text-[#1d1d1f]">
      <div className="mx-auto max-w-[1344px] px-6 small:px-8">
        <div className="grid gap-10 py-12 min-[768px]:grid-cols-[minmax(0,1fr)_auto] small:gap-16 small:py-16">
          <div>
            <LocalizedClientLink
              href="/"
              aria-label="Batteries N’ Things home"
              className="inline-flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066cc]"
            >
              <Image src="/logo.png" alt="" width={32} height={32} />
              <span className="text-xl font-semibold tracking-[-0.035em]">
                Batteries N&apos; Things
              </span>
            </LocalizedClientLink>
            <p className="mt-4 max-w-[290px] text-[15px] leading-relaxed text-[#6e6e73]">
              Thoughtfully selected technology for your business. Every day, all
              in one place.
            </p>
            <LocalizedClientLink
              href="/account"
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-[#1d1d1f] shadow-[0_2px_12px_rgba(0,0,0,0.025)] transition-colors hover:bg-[#e8e8ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc]"
            >
              Your wholesale account <span aria-hidden="true">↗</span>
            </LocalizedClientLink>
          </div>

          <div>
            <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#86868b]">
              Let’s talk
            </h2>
            <address className="text-sm not-italic leading-relaxed text-[#6e6e73]">
              <p>
                2800 John Street, Unit 5<br />
                Markham, Ontario L3R 0E2
                <br />
                Canada
              </p>
              <div className="mt-3 flex flex-col items-start">
                <a href="mailto:info@bntbng.com" className={footerLinkClass}>
                  info@bntbng.com{" "}
                  <span className="ml-2" aria-hidden="true">
                    ↗
                  </span>
                </a>
                <a href="tel:+14163680023" className={footerLinkClass}>
                  416-368-0023
                </a>
              </div>
            </address>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#dedee3] py-6 text-xs text-[#86868b] small:flex-row small:items-center small:justify-between">
          <p>
            © {new Date().getFullYear()} Batteries N&apos; Things. All rights
            reserved.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6">
            <LocalizedClientLink
              href="/privacy-policy"
              className={`${footerLinkClass} text-xs`}
            >
              Privacy policy
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/terms-of-sale"
              className={`${footerLinkClass} text-xs`}
            >
              Terms of sale
            </LocalizedClientLink>
          </nav>
        </div>
      </div>
    </footer>
  )
}
