// Centralized path builder for dual-segment routing (countryCode/lang)
// Avoid hardcoding string templates across pages.

export interface RoutingSegments {
  countryCode: string
  lang: string
}

export function accountPath({ countryCode, lang }: RoutingSegments, subpath: string = "") {
  const clean = subpath.replace(/^\/+/, "")
  return `/${countryCode}/${lang}/account${clean ? `/${clean}` : ""}`
}

export function storePath({ countryCode, lang }: RoutingSegments, subpath: string = "") {
  const clean = subpath.replace(/^\/+/, "")
  return `/${countryCode}/${lang}${clean ? `/${clean}` : ""}`
}

export function withSegments({ countryCode, lang }: RoutingSegments, raw: string) {
  const pref = raw.startsWith('/') ? raw : `/${raw}`
  return `/${countryCode}/${lang}${pref}`
}
