import type { OrderCatalog } from "@/features/orders/catalog";
import type { OrderFormValues } from "@/features/orders/schema";
import type {
  AvailabilityInput,
  OrderRules,
} from "@/features/slots/availability";

export const rules: OrderRules = {
  leadDays: 4,
  cutoffTime: "15:00",
  closedWeekdays: [0],
  slotsPerDay: 8,
  nearlyFullThreshold: 2,
};

/** Instant from a WIB wall-clock string. */
export const wib = (s: string) => new Date(`${s}+07:00`);

// Calendar (Oct 2026): Fri 16, Sat 17, Sun 18, Mon 19, Tue 20, Wed 21, Thu 22, Fri 23, Sat 24, Sun 25.

export const catalog: OrderCatalog = {
  products: [
    {
      id: "p-klasik",
      slug: "tempe-klasik",
      name: "Tempe Klasik",
      short: null,
      priceFrom: 5000,
      shapeIds: ["s-balok", "s-lembar"],
      sizes: [
        { sizeId: "z-sedang", price: null },
        { sizeId: "z-besar", price: 9000 },
      ],
    },
    {
      id: "p-original",
      slug: "tempe-original-tanpa-kulit",
      name: "Tempe Original Tanpa Kulit",
      short: null,
      priceFrom: 7000,
      shapeIds: [],
      sizes: [],
    },
  ],
  shapes: [
    {
      id: "s-balok",
      slug: "balok-klasik",
      name: "Balok klasik",
      description: null,
    },
    {
      id: "s-lembar",
      slug: "lembaran-tipis",
      name: "Lembaran tipis (mendoan)",
      description: null,
    },
    { id: "s-dadu", slug: "mini-dadu", name: "Mini/dadu", description: null },
  ],
  sizes: [
    {
      id: "z-sedang",
      name: "Sedang",
      weightGrams: 250,
      dims: "±250 g",
      price: 7000,
    },
    {
      id: "z-besar",
      name: "Besar",
      weightGrams: 500,
      dims: "±500 g",
      price: 12000,
    },
    {
      id: "z-custom",
      name: "Custom dimensi",
      weightGrams: null,
      dims: null,
      price: null,
    },
  ],
};

export const availability = (
  now: Date,
  extra: Partial<AvailabilityInput> = {},
): AvailabilityInput => ({ rules, holidays: [], overrides: [], now, ...extra });

export const validOrder: OrderFormValues = {
  productId: "p-original",
  shapeId: "s-lembar",
  sizeId: "z-sedang",
  quantity: 40,
  useDate: "2026-10-20",
  delivery: "Ambil di tempat (gratis)",
  purpose: "Katering",
  purposeOther: "",
  note: "Tolong dibungkus daun.",
  name: "Budi",
  area: "Klaten",
};

export const deliveryOptions = [
  "Ambil di tempat (gratis)",
  "Klaten kota (antar, ongkir flat)",
];
