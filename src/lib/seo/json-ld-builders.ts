import { absoluteUrl } from "./url";

export type JsonLdNode = Record<string, unknown>;
const CTX = "https://schema.org";

/** Drop undefined / null / "" / empty arrays / empty objects (shallow-recursive). */
export function compact<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(compact).filter((v) => !isEmpty(v)) as T;
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const c = compact(v);
      if (!isEmpty(c)) out[k] = c;
    }
    return out as T;
  }
  return value;
}
function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null || v === "") return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object" && !(v instanceof Date))
    return Object.keys(v as object).length === 0;
  return false;
}

/** Minutes → ISO 8601 duration ("PT90M" → "PT1H30M"). Null for empty/invalid. */
export function isoDuration(
  minutes: number | null | undefined,
): string | undefined {
  if (!minutes || !Number.isFinite(minutes) || minutes <= 0) return undefined;
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}`;
}

/** Merge optional `image` (string|string[]) and `images` into unique absolute URLs. */
function imageList(
  image: string | string[] | undefined,
  images: string[] | undefined,
  base: string,
): string[] {
  const all = [
    ...(image === undefined ? [] : Array.isArray(image) ? image : [image]),
    ...(images ?? []),
  ].filter(Boolean);
  return [...new Set(all.map((i) => absoluteUrl(i, base)))];
}

const iso = (d?: Date | string | null) =>
  d ? (d instanceof Date ? d.toISOString() : d) : undefined;

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type BusinessInfo = {
  name: string;
  legalName?: string;
  foundedYear?: number;
  description?: string;
  telephone?: string;
  email?: string;
  address?: {
    street?: string;
    locality?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
  geo?: { lat: number; lng: number } | null;
  mapUrl?: string;
  hours?: { day: number; open: string; close: string }[];
  sameAs?: string[];
  halal?: { number: string; issuer?: string } | null;
  logoUrl?: string;
};

const businessId = (base: string) => absoluteUrl("/#business", base);
const websiteId = (base: string) => absoluteUrl("/#website", base);

/** Organization-level fields shared by Organization / FoodEstablishment. */
function businessFields(b: BusinessInfo, base: string): JsonLdNode {
  const a = b.address;
  return {
    "@id": businessId(base),
    name: b.name,
    legalName: b.legalName,
    url: absoluteUrl("/", base),
    description: b.description,
    logo: b.logoUrl,
    foundingDate: b.foundedYear ? String(b.foundedYear) : undefined,
    telephone: b.telephone,
    email: b.email,
    address:
      a && (a.street || a.locality || a.region)
        ? {
            "@type": "PostalAddress",
            streetAddress: a.street,
            addressLocality: a.locality,
            addressRegion: a.region,
            postalCode: a.postalCode,
            addressCountry: a.country,
          }
        : undefined,
    sameAs: (b.sameAs ?? []).filter(Boolean),
  };
}

export function organizationJsonLd(b: BusinessInfo, base: string): JsonLdNode {
  const credential = b.halal?.number
    ? {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "Sertifikat Halal",
        identifier: b.halal.number,
        recognizedBy: b.halal.issuer
          ? { "@type": "Organization", name: b.halal.issuer }
          : undefined,
      }
    : undefined;
  return compact({
    "@context": CTX,
    "@type": "Organization",
    ...businessFields(b, base),
    "@id": absoluteUrl("/#organization", base),
    hasCredential: credential,
  });
}

/** LocalBusiness subtype for a food producer; geo, hours and map included when present. */
export function foodEstablishmentJsonLd(
  b: BusinessInfo,
  base: string,
): JsonLdNode {
  return compact({
    "@context": CTX,
    "@type": "FoodEstablishment",
    ...businessFields(b, base),
    geo: b.geo
      ? { "@type": "GeoCoordinates", latitude: b.geo.lat, longitude: b.geo.lng }
      : undefined,
    hasMap: b.mapUrl,
    openingHoursSpecification: (b.hours ?? []).map((d) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${DAY_NAMES[d.day]}`,
      opens: d.open,
      closes: d.close,
    })),
  });
}

export function webSiteJsonLd(
  b: Pick<BusinessInfo, "name" | "description">,
  base: string,
  lang = "id-ID",
): JsonLdNode {
  return compact({
    "@context": CTX,
    "@type": "WebSite",
    "@id": websiteId(base),
    url: absoluteUrl("/", base),
    name: b.name,
    description: b.description,
    inLanguage: lang,
    publisher: { "@id": businessId(base) },
  });
}

export type Crumb = { label: string; href?: string };

/** Crumbs without `href` (current page) are emitted without `item`. */
export function breadcrumbListJsonLd(
  crumbs: Crumb[],
  base: string,
): JsonLdNode | null {
  if (!crumbs.length) return null;
  return {
    "@context": CTX,
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: absoluteUrl(c.href, base) } : {}),
    })),
  };
}

export type ProductJsonLdInput = {
  name: string;
  path: string;
  description?: string | null;
  images?: string[];
  /** Single image or list; merged with `images`. */
  image?: string | string[];
  brand: string;
  /** Pass only when the price is public (settings pricing.show) and known. */
  price?: number | null;
  currency?: string;
  availability?: "InStock" | "PreOrder" | "OutOfStock";
};

/** Product + Offer (only if price). Never emits rating/review. */
export function productJsonLd(p: ProductJsonLdInput, base: string): JsonLdNode {
  const url = absoluteUrl(p.path, base);
  return compact({
    "@context": CTX,
    "@type": "Product",
    name: p.name,
    description: p.description,
    url,
    image: imageList(p.image, p.images, base),
    brand: { "@type": "Brand", name: p.brand },
    offers:
      p.price != null && p.price > 0
        ? {
            "@type": "Offer",
            priceCurrency: p.currency ?? "IDR",
            price: p.price,
            availability: `https://schema.org/${p.availability ?? "PreOrder"}`,
            url,
          }
        : undefined,
  });
}

export type ArticleJsonLdInput = {
  type?: "Article" | "BlogPosting";
  headline: string;
  path: string;
  description?: string | null;
  images?: string[];
  /** Single image or list; merged with `images`. */
  image?: string | string[];
  publishedAt?: Date | string | null;
  modifiedAt?: Date | string | null;
  authorName?: string | null;
  publisherName: string;
  wordCount?: number;
  section?: string | null;
  keywords?: string[];
  lang?: string;
};

export function articleJsonLd(a: ArticleJsonLdInput, base: string): JsonLdNode {
  const url = absoluteUrl(a.path, base);
  return compact({
    "@context": CTX,
    "@type": a.type ?? "Article",
    headline: a.headline,
    description: a.description,
    url,
    mainEntityOfPage: url,
    inLanguage: a.lang ?? "id-ID",
    image: imageList(a.image, a.images, base),
    datePublished: iso(a.publishedAt),
    dateModified: iso(a.modifiedAt),
    wordCount: a.wordCount || undefined,
    articleSection: a.section,
    keywords: a.keywords?.length ? a.keywords.join(", ") : undefined,
    author: a.authorName
      ? { "@type": "Person", name: a.authorName }
      : { "@type": "Organization", name: a.publisherName },
    publisher: { "@id": businessId(base) },
  });
}

export type RecipeJsonLdInput = {
  name: string;
  path: string;
  description?: string | null;
  images?: string[];
  /** Single image or list; merged with `images`. */
  image?: string | string[];
  publishedAt?: Date | string | null;
  modifiedAt?: Date | string | null;
  authorName: string;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  totalMinutes?: number | null;
  servings?: number | null;
  category?: string | null;
  cuisine?: string;
  keywords?: string[];
  ingredients: string[];
  steps: { text: string; image?: string | null }[];
  lang?: string;
};

export function recipeJsonLd(r: RecipeJsonLdInput, base: string): JsonLdNode {
  const url = absoluteUrl(r.path, base);
  const total =
    r.totalMinutes ?? ((r.prepMinutes ?? 0) + (r.cookMinutes ?? 0) || null);
  return compact({
    "@context": CTX,
    "@type": "Recipe",
    name: r.name,
    description: r.description,
    url,
    mainEntityOfPage: url,
    inLanguage: r.lang ?? "id-ID",
    image: imageList(r.image, r.images, base),
    datePublished: iso(r.publishedAt),
    dateModified: iso(r.modifiedAt),
    author: { "@type": "Organization", name: r.authorName },
    prepTime: isoDuration(r.prepMinutes),
    cookTime: isoDuration(r.cookMinutes),
    totalTime: isoDuration(total),
    recipeYield: r.servings ? `${r.servings} porsi` : undefined,
    recipeCategory: r.category,
    recipeCuisine: r.cuisine ?? "Indonesia",
    keywords: r.keywords?.length ? r.keywords.join(", ") : undefined,
    recipeIngredient: r.ingredients,
    recipeInstructions: r.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text: s.text,
      image: s.image ? absoluteUrl(s.image, base) : undefined,
    })),
  });
}

export type FaqItem = { question: string; answer: string };

/** `answer` must be plain text. Null when there are no items. */
export function faqPageJsonLd(
  items: FaqItem[],
  opts?: { path?: string; base?: string; lang?: string },
): JsonLdNode | null {
  if (!items.length) return null;
  return compact({
    "@context": CTX,
    "@type": "FAQPage",
    url:
      opts?.path && opts.base ? absoluteUrl(opts.path, opts.base) : undefined,
    inLanguage: opts?.lang,
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  });
}

export type HowToJsonLdInput = {
  name: string;
  description?: string | null;
  path?: string;
  totalMinutes?: number | null;
  steps: { name?: string | null; text?: string | null }[];
};

export function howToJsonLd(
  h: HowToJsonLdInput,
  base: string,
): JsonLdNode | null {
  if (!h.steps.length) return null;
  return compact({
    "@context": CTX,
    "@type": "HowTo",
    name: h.name,
    description: h.description,
    url: h.path ? absoluteUrl(h.path, base) : undefined,
    totalTime: isoDuration(h.totalMinutes),
    step: h.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name || s.text,
      text: s.text || s.name,
    })),
  });
}

export type WebPageType =
  "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage";

export function webPageJsonLd(
  p: {
    type?: WebPageType;
    name: string;
    path: string;
    description?: string | null;
    lang?: string;
  },
  base: string,
): JsonLdNode {
  const url = absoluteUrl(p.path, base);
  return compact({
    "@context": CTX,
    "@type": p.type ?? "WebPage",
    "@id": url,
    url,
    name: p.name,
    description: p.description,
    inLanguage: p.lang ?? "id-ID",
    isPartOf: { "@id": websiteId(base) },
  });
}

export function itemListJsonLd(
  items: { name: string; path: string }[],
  base: string,
): JsonLdNode | null {
  if (!items.length) return null;
  return {
    "@type": "ItemList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: absoluteUrl(it.path, base),
    })),
  };
}
