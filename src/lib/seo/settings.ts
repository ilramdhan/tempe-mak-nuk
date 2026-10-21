import type { Settings } from "@/features/settings/schema";

import type { BusinessInfo } from "./json-ld-builders";

/** Map site settings → business facts for JSON-LD. Nothing hard-coded. */
export function businessFromSettings(s: Settings): BusinessInfo {
  return {
    name: s["business.name"],
    legalName: s["business.legalName"],
    foundedYear: s["business.foundedYear"],
    description: s["seo.defaultDescription"],
    telephone: s["contact.whatsappDisplay"] || s["contact.phone"],
    email: s["contact.email"],
    address: {
      street: [s["address.street"], s["address.village"]]
        .filter(Boolean)
        .join(", "),
      locality: s["address.district"] || s["address.city"],
      region: s["address.province"],
      postalCode: s["address.postalCode"],
      country: s["address.country"],
    },
    geo:
      s["geo.lat"] || s["geo.lng"]
        ? { lat: s["geo.lat"], lng: s["geo.lng"] }
        : null,
    mapUrl: s["maps.url"],
    hours: s.hours.days ?? [],
    sameAs: [
      s["social.instagram"],
      s["social.tiktok"],
      s["social.facebook"],
      s["social.youtube"],
      s["social.googleBusiness"],
    ],
    halal: s["halal.number"]
      ? { number: s["halal.number"], issuer: s["halal.issuer"] }
      : null,
  };
}
