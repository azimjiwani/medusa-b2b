"use client"

import { Text } from "@medusajs/ui"
import { useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"

export default function Footer() {
  const t = useTranslations()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-ui-border-base w-full bg-white">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col lg:flex-row justify-between items-start py-10 md:py-14 gap-8">
          {/* Company Info */}
            <div className="max-w-xl">
              <Link href="/" className="hover:opacity-80 transition-opacity duration-200 inline-block mb-4">
                <h2 className="font-bold text-lg md:text-xl text-ui-fg-base tracking-tight">{t("footer.companyName")}</h2>
              </Link>
              <div className="flex items-start gap-4">
                <Image
                  src="/logo.png"
                  alt="More Europe Logo"
                  width={80}
                  height={80}
                  className="flex-shrink-0"
                />
                <p className="text-ui-fg-subtle text-sm md:text-base leading-relaxed">
                  {t("footer.tagline")}
                </p>
              </div>
            </div>

          {/* Navigation Links */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-12">
            <div>
              <h3 className="font-semibold text-base text-ui-fg-base mb-4">{t("footer.navigationTitle")}</h3>
              <nav className="flex flex-col space-y-3">
                <Link
                  href="/store"
                  className="text-ui-fg-subtle hover:text-ui-fg-base transition-colors duration-200 text-sm md:text-base"
                >
                  {t("footer.links.store")}
                </Link>
                <Link
                  href="/azienda"
                  className="text-ui-fg-subtle hover:text-ui-fg-base transition-colors duration-200 text-sm md:text-base"
                >
                  {t("footer.links.company")}
                </Link>
                <Link
                  href="/contatti"
                  className="text-ui-fg-subtle hover:text-ui-fg-base transition-colors duration-200 text-sm md:text-base"
                >
                  {t("footer.links.contact")}
                </Link>
                <Link
                  href="/account/register"
                  className="text-ui-fg-subtle hover:text-ui-fg-base transition-colors duration-200 text-sm md:text-base"
                >
                  {t("footer.links.register")}
                </Link>
              </nav>
            </div>

            <div>
              <h3 className="font-semibold text-base text-ui-fg-base mb-4">{t("footer.legalTitle")}</h3>
              <nav className="flex flex-col space-y-3">
                <Link
                  href="/condizioni-generali"
                  className="text-ui-fg-subtle hover:text-ui-fg-base transition-colors duration-200 text-sm md:text-base"
                >
                  {t("footer.links.conditions")}
                </Link>
                <Link
                  href="/terms-of-sale"
                  className="text-ui-fg-subtle hover:text-ui-fg-base transition-colors duration-200 text-sm md:text-base"
                >
                  {t("footer.links.terms")}
                </Link>
                <Link
                  href="/privacy-policy"
                  className="text-ui-fg-subtle hover:text-ui-fg-base transition-colors duration-200 text-sm md:text-base"
                >
                  {t("footer.links.privacy")}
                </Link>
                <Link
                  href="/cookie-policy"
                  className="text-ui-fg-subtle hover:text-ui-fg-base transition-colors duration-200 text-sm md:text-base"
                >
                  {t("footer.links.cookies")}
                </Link>
              </nav>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-semibold text-base text-ui-fg-base mb-4">{t("footer.contactTitle")}</h3>
              <div className="space-y-2">
                <p className="text-ui-fg-subtle text-sm md:text-base">{t("footer.address.line1")}</p>
                <p className="text-ui-fg-subtle text-sm md:text-base">{t("footer.address.line2")}</p>
                <p className="text-ui-fg-subtle text-sm md:text-base">
                  <a href="mailto:info@moreeurope.com" className="hover:text-ui-fg-base transition-colors duration-200">
                    info@moreeurope.com
                  </a>
                </p>
                <p className="text-ui-fg-subtle text-sm md:text-base">
                  <a href="tel:+390574722003" className="hover:text-ui-fg-base transition-colors duration-200">
                    +39 0574 722 003
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="flex flex-col sm:flex-row w-full mb-4 justify-between items-center text-ui-fg-muted border-t border-ui-border-base pt-6 gap-4">
          <Text className="txt-compact-small text-center sm:text-left">
            {t("footer.copyright", { year })}
          </Text>
          <div className="flex gap-4 text-xs">
            <span>{t("footer.vat")}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
