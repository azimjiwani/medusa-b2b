import InteractiveLink from "@/modules/common/components/interactive-link";

export default function NotFound({ params }: { params: { countryCode: string; lang: string } }) {
  const { countryCode, lang } = params
  const homeHref = `/${countryCode}/${lang}`
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl-semi text-ui-fg-base">Page not found</h1>
      <p className="text-small-regular text-ui-fg-base">
        The page you tried to access does not exist.
      </p>
      <InteractiveLink href={homeHref}>Go to frontpage</InteractiveLink>
    </div>
  )
}
