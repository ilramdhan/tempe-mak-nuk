import { faqAnswerPlainText, queryFaqs } from "@/features/faqs/queries";
import type { Settings } from "@/features/settings/schema";
import {
  businessFromSettings,
  faqPageJsonLd,
  foodEstablishmentJsonLd,
  JsonLd,
  organizationJsonLd,
  siteBaseUrl,
  webSiteJsonLd,
} from "@/lib/seo";

/**
 * Beranda JSON-LD (docs/seo.md `/`): Organization + WebSite + FoodEstablishment (LocalBusiness)
 * + FAQPage (home FAQs). All values from settings.
 */
export async function HomeJsonLd({ settings }: { settings: Settings }) {
  const base = siteBaseUrl(settings["site.url"]);
  const business = businessFromSettings(settings);
  const faqs = await queryFaqs({ source: "home" });
  return (
    <JsonLd
      data={[
        organizationJsonLd(business, base),
        webSiteJsonLd(business, base, settings["site.locale"]),
        foodEstablishmentJsonLd(business, base),
        faqPageJsonLd(
          faqs.map((f) => ({
            question: f.question,
            answer: faqAnswerPlainText(f.answer),
          })),
        ),
      ].filter((n): n is Record<string, unknown> => n !== null)}
    />
  );
}
