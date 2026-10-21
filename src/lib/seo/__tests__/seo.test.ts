import { describe, expect, it } from "vitest";

import {
  articleJsonLd,
  breadcrumbListJsonLd,
  faqPageJsonLd,
  foodEstablishmentJsonLd,
  howToJsonLd,
  isoDuration,
  organizationJsonLd,
  productJsonLd,
  recipeJsonLd,
  webSiteJsonLd,
  type BusinessInfo,
} from "../json-ld-builders";
import { buildMetadata } from "../metadata";
import { serializeJsonLd } from "../serialize";
import { absoluteUrl, siteBaseUrl } from "../url";

type J = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const BASE = "https://example.test";
const biz: BusinessInfo = {
  name: "Tempe X",
  foundedYear: 2001,
  telephone: "0812",
  address: { street: "Jl A", locality: "Pedan", region: "Jateng", country: "ID" },
  geo: { lat: -7.7, lng: 110.6 },
  hours: [{ day: 1, open: "07:00", close: "15:00" }],
  sameAs: ["https://ig.test/x", ""],
  halal: { number: "H1", issuer: "BPJPH" },
};

describe("url", () => {
  it("siteBaseUrl strips trailing slash and falls back", () => {
    const prev = process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(siteBaseUrl("https://a.test///")).toBe("https://a.test");
    expect(siteBaseUrl("")).toBe("http://localhost:3000");
    process.env.NEXT_PUBLIC_SITE_URL = "https://env.test/";
    expect(siteBaseUrl("https://a.test")).toBe("https://env.test");
    if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prev;
  });
  it("absoluteUrl", () => {
    expect(absoluteUrl("/", BASE)).toBe(BASE);
    expect(absoluteUrl("/a", BASE + "/")).toBe(`${BASE}/a`);
    expect(absoluteUrl("https://x.test/a", BASE)).toBe("https://x.test/a");
  });
});

describe("isoDuration", () => {
  it("formats", () => {
    expect(isoDuration(30)).toBe("PT30M");
    expect(isoDuration(60)).toBe("PT1H");
    expect(isoDuration(90)).toBe("PT1H30M");
    expect(isoDuration(0)).toBeUndefined();
    expect(isoDuration(null)).toBeUndefined();
  });
});

describe("buildMetadata", () => {
  it("fills canonical, og, twitter, default global og image", () => {
    const m = buildMetadata({ title: "T", description: "D", path: "/produk", siteName: "S" });
    expect(m.alternates?.canonical).toBe("/produk");
    expect(m.openGraph).toMatchObject({ siteName: "S", locale: "id_ID", type: "website", url: "/produk" });
    expect((m.openGraph as Record<string, unknown>).images).toEqual([
      { url: "/og-default.png", width: 1200, height: 630, alt: undefined },
    ]);
    expect(m.twitter).toMatchObject({ card: "summary_large_image" });
    expect(m.robots).toBeUndefined();
  });
  it("no fallback image when the route has its own opengraph-image file", () => {
    const m = buildMetadata({ title: "T", path: "/produk/x", siteName: "S", ogImageFile: true });
    expect((m.openGraph as Record<string, unknown>).images).toBeUndefined();
  });
  it("seo overrides, noindex and explicit og image", () => {
    const m = buildMetadata({
      title: "T", path: "/x", siteName: "S", type: "article",
      publishedTime: new Date("2026-01-01T00:00:00Z"),
      seo: { title: "Seo", noindex: true, ogImage: { url: "https://i.test/a.jpg", width: 10, height: 5 } },
    });
    expect(m.title).toBe("Seo");
    expect(m.robots).toEqual({ index: false, follow: false });
    expect(m.openGraph).toMatchObject({ type: "article", publishedTime: "2026-01-01T00:00:00.000Z" });
    expect((m.openGraph as { images: unknown[] }).images).toHaveLength(1);
  });
  it("titleAbsolute", () => {
    expect(buildMetadata({ title: "T", path: "/", siteName: "S", titleAbsolute: true }).title).toEqual({ absolute: "T" });
  });
});

describe("json-ld builders", () => {
  it("organization / food establishment from business info", () => {
    const o = organizationJsonLd(biz, BASE);
    expect(o["@type"]).toBe("Organization");
    expect(o.sameAs).toEqual(["https://ig.test/x"]);
    expect(o.hasCredential).toMatchObject({ identifier: "H1" });
    const f = foodEstablishmentJsonLd(biz, BASE) as Record<string, unknown>;
    expect(f["@type"]).toBe("FoodEstablishment");
    expect(f.geo).toMatchObject({ latitude: -7.7 });
    expect(f.openingHoursSpecification).toEqual([
      { "@type": "OpeningHoursSpecification", dayOfWeek: "https://schema.org/Monday", opens: "07:00", closes: "15:00" },
    ]);
    expect(f.url).toBe(BASE);
  });
  it("drops empty optional fields", () => {
    const f = foodEstablishmentJsonLd({ name: "N" }, BASE);
    expect(Object.keys(f).sort()).toEqual(["@context", "@id", "@type", "name", "url"]);
  });
  it("website", () => {
    expect(webSiteJsonLd({ name: "N" }, BASE)).toMatchObject({ "@type": "WebSite", url: BASE });
  });
  it("breadcrumb absolute urls, last without item", () => {
    const b = breadcrumbListJsonLd([{ label: "Home", href: "/" }, { label: "Produk", href: "/produk" }, { label: "X" }], BASE)!;
    const items = b.itemListElement as Record<string, unknown>[];
    expect(items[0].item).toBe(BASE);
    expect(items[1].item).toBe(`${BASE}/produk`);
    expect("item" in items[2]).toBe(false);
    expect(breadcrumbListJsonLd([], BASE)).toBeNull();
  });
  it("product: offer only with price, no rating", () => {
    const p = productJsonLd({ name: "P", path: "/produk/p", brand: "B", images: ["/a.jpg"] }, BASE);
    expect(p.offers).toBeUndefined();
    expect(p.image).toEqual([`${BASE}/a.jpg`]);
    const q = productJsonLd({ name: "P", path: "/produk/p", brand: "B", price: 10000 }, BASE) as J;
    expect(q.offers).toMatchObject({ price: 10000, priceCurrency: "IDR", url: `${BASE}/produk/p` });
    expect(JSON.stringify(q)).not.toMatch(/aggregateRating|review/);
  });
  it("article", () => {
    const a = articleJsonLd(
      { type: "BlogPosting", headline: "H", path: "/jurnal/h", publisherName: "N", publishedAt: new Date("2026-01-01T00:00:00Z"), keywords: ["a", "b"] },
      BASE,
    ) as J;
    expect(a["@type"]).toBe("BlogPosting");
    expect(a.url).toBe(`${BASE}/jurnal/h`);
    expect(a.datePublished).toBe("2026-01-01T00:00:00.000Z");
    expect(a.keywords).toBe("a, b");
    expect(a.author).toEqual({ "@type": "Organization", name: "N" });
    expect(a.image).toBeUndefined();
  });
  it("recipe durations, yield, steps", () => {
    const r = recipeJsonLd(
      { name: "R", path: "/resep/r", authorName: "A", prepMinutes: 15, cookMinutes: 45, servings: 4, ingredients: ["1 tempe"], steps: [{ text: "s1" }, { text: "s2", image: "/i.jpg" }] },
      BASE,
    ) as J;
    expect(r.prepTime).toBe("PT15M");
    expect(r.cookTime).toBe("PT45M");
    expect(r.totalTime).toBe("PT1H");
    expect(r.recipeYield).toBe("4 porsi");
    expect(r.recipeInstructions[1]).toMatchObject({ position: 2, image: `${BASE}/i.jpg` });
    const e = recipeJsonLd({ name: "R", path: "/r", authorName: "A", ingredients: [], steps: [] }, BASE);
    expect(e.prepTime).toBeUndefined();
    expect(e.totalTime).toBeUndefined();
  });
  it("faq / howto null when empty", () => {
    expect(faqPageJsonLd([])).toBeNull();
    expect(howToJsonLd({ name: "H", steps: [] }, BASE)).toBeNull();
    const f = faqPageJsonLd([{ question: "Q", answer: "A" }]) as J;
    expect(f.mainEntity[0].acceptedAnswer.text).toBe("A");
    const h = howToJsonLd({ name: "H", totalMinutes: 120, steps: [{ name: "n", text: "t" }] }, BASE) as J;
    expect(h.totalTime).toBe("PT2H");
    expect(h.step[0]).toMatchObject({ position: 1, name: "n", text: "t" });
  });
  it("serializeJsonLd escapes <", () => {
    const s = serializeJsonLd({ a: "</script>" });
    expect(s).not.toContain("</script>");
    expect(JSON.parse(s)).toEqual({ a: "</script>" });
  });
});
