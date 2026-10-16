import { serializeJsonLd } from "@/components/site/layout";
import { faqAnswerPlainText, queryFaqs } from "@/features/faqs/queries";
import type { Settings } from "@/features/settings/schema";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * Beranda JSON-LD (docs/seo.md `/`): FoodEstablishment (LocalBusiness) + FAQPage (home FAQs).
 * Organization/WebSite are global (layout / P6.1). All values from settings.
 */
export async function HomeJsonLd({ settings }: { settings: Settings }) {
  const siteUrl = settings["site.url"];
  if (!siteUrl) return null;
  const faqs = await queryFaqs({ source: "home" });
  const sameAs = [
    settings["social.instagram"],
    settings["social.tiktok"],
    settings["social.facebook"],
    settings["social.youtube"],
    settings["social.googleBusiness"],
  ].filter(Boolean);
  const hours = settings.hours.days ?? [];

  const business = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    "@id": new URL("/#business", siteUrl).toString(),
    name: settings["business.name"],
    url: siteUrl,
    description: settings["seo.defaultDescription"] || undefined,
    foundingDate: String(settings["business.foundedYear"]),
    telephone:
      settings["contact.whatsappDisplay"] ||
      settings["contact.phone"] ||
      undefined,
    email: settings["contact.email"] || undefined,
    address: settings["address.street"]
      ? {
          "@type": "PostalAddress",
          streetAddress: [
            settings["address.street"],
            settings["address.village"],
          ]
            .filter(Boolean)
            .join(", "),
          addressLocality:
            settings["address.district"] || settings["address.city"],
          addressRegion: settings["address.province"],
          postalCode: settings["address.postalCode"],
          addressCountry: settings["address.country"],
        }
      : undefined,
    geo:
      settings["geo.lat"] || settings["geo.lng"]
        ? {
            "@type": "GeoCoordinates",
            latitude: settings["geo.lat"],
            longitude: settings["geo.lng"],
          }
        : undefined,
    hasMap: settings["maps.url"] || undefined,
    openingHoursSpecification: hours.length
      ? hours.map((d) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: `https://schema.org/${DAY_NAMES[d.day]}`,
          opens: d.open,
          closes: d.close,
        }))
      : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };

  const faqPage = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faqAnswerPlainText(f.answer),
          },
        })),
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(business) }}
      />
      {faqPage ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqPage) }}
        />
      ) : null}
    </>
  );
}
