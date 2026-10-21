"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FormProvider,
  useForm,
  useWatch,
  type Resolver,
} from "react-hook-form";

import { WaLink } from "@/components/site/layout/wa-link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type {
  DayAvailability,
  HolidayInput,
  OrderRules,
  SlotOverrideInput,
} from "@/features/slots/availability";
import { cn } from "@/lib/utils";

import { findProduct, productIdFromSlug, type OrderCatalog } from "../catalog";
import { checkUseDate } from "../date-rules";
import { loadDraft, saveDraft } from "../draft";
import {
  buildOrderMessageText,
  buildOrderWaLink,
  summarizeOrder,
} from "../message";
import {
  createOrderSchema,
  EMPTY_ORDER,
  ORDER_STEPS,
  type OrderContext,
  type OrderFormValues,
} from "../schema";
import { OrderMessagePreview, OrderSummaryList } from "./order-summary";
import { isStickyBarHidden } from "./sticky-bar";
import { StepCustomer } from "./step-customer";
import { StepDate } from "./step-date";
import { StepProduct } from "./step-product";

export type OrderBuilderProps = {
  catalog: OrderCatalog;
  rules: OrderRules;
  slotData: { holidays: HolidayInput[]; overrides: SlotOverrideInput[] };
  /** Precomputed days for the calendar window (server `getAvailability`). */
  days: DayAvailability[];
  /** Server "now" (ISO) used for the first render; refreshed every minute on the client. */
  now: string;
  waNumber: string;
  deliveryOptions: string[];
  showPrice: boolean;
  /** `?produk=<slug>` from the URL — preselects the variant when it exists. */
  initialProductSlug?: string | null;
};

const MINUTE = 60_000;
/** Below Tailwind `md` (48rem) the action bar is fixed to the viewport bottom. */
const MOBILE_QUERY = "(max-width: 47.999rem)";

export function OrderBuilder({
  catalog,
  rules,
  slotData,
  days,
  now: serverNow,
  waNumber,
  deliveryOptions,
  showPrice,
  initialProductSlug,
}: OrderBuilderProps) {
  const [now, setNow] = useState(() => new Date(serverNow));
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), MINUTE);
    return () => window.clearInterval(t);
  }, []);

  const ctx: OrderContext = useMemo(
    () => ({
      catalog,
      deliveryOptions,
      availability: {
        rules,
        holidays: slotData.holidays,
        overrides: slotData.overrides,
        now,
      },
    }),
    [catalog, deliveryOptions, rules, slotData, now],
  );
  // Resolver reads the latest context (cutoff moves with the clock).
  const ctxRef = useRef(ctx);
  useEffect(() => {
    ctxRef.current = ctx;
  }, [ctx]);
  const resolver = useCallback<Resolver<OrderFormValues>>(
    (values, context, options) => {
      const c = ctxRef.current;
      const schema = createOrderSchema({
        ...c,
        availability: { ...c.availability, now: new Date() },
      });
      return (zodResolver(schema) as Resolver<OrderFormValues>)(
        values,
        context,
        options,
      );
    },
    [],
  );

  const presetProductId = productIdFromSlug(catalog, initialProductSlug);
  const form = useForm<OrderFormValues>({
    resolver,
    mode: "onTouched",
    defaultValues: {
      ...EMPTY_ORDER,
      productId:
        presetProductId ??
        (catalog.products.length === 1 ? catalog.products[0]!.id : ""),
      delivery: deliveryOptions.length === 1 ? deliveryOptions[0]! : "",
    },
  });
  const { reset, getValues, trigger, control } = form;

  // Restore draft once (client only). URL preset wins over the draft's variant.
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const draft = loadDraft();
    if (!draft) return;
    const merged: OrderFormValues = { ...getValues(), ...draft };
    if (presetProductId && presetProductId !== draft.productId) {
      merged.productId = presetProductId;
      merged.shapeId = "";
      merged.sizeId = "";
    }
    if (!findProduct(catalog, merged.productId)) merged.productId = "";
    if (
      merged.useDate &&
      !checkUseDate(merged.useDate, ctxRef.current.availability).ok
    )
      merged.useDate = "";
    if (deliveryOptions.length && !deliveryOptions.includes(merged.delivery))
      merged.delivery = "";
    reset(merged, { keepDefaultValues: true });
  }, [catalog, deliveryOptions, getValues, presetProductId, reset]);

  // Persist draft on change.
  useEffect(() => {
    const sub = form.subscribe({
      formState: { values: true },
      callback: ({ values }) => saveDraft(values as OrderFormValues),
    });
    return sub;
  }, [form]);

  const [step, setStep] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const stepRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  // Mobile: the fixed "Lanjut" bar only appears once the builder is on screen, so it
  // never covers the hero. Desktop renders the bar inline (always shown).
  const formRef = useRef<HTMLFormElement>(null);
  const [builderInView, setBuilderInView] = useState(false);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const mq = window.matchMedia(MOBILE_QUERY);
    const syncMq = () => setMobile(mq.matches);
    syncMq();
    mq.addEventListener("change", syncMq);
    // Builder counts as "in view" once its top clears the bottom fifth of the viewport.
    const io = new IntersectionObserver(
      ([entry]) => setBuilderInView(Boolean(entry?.isIntersecting)),
      { rootMargin: "0px 0px -20% 0px" },
    );
    io.observe(form);
    return () => {
      io.disconnect();
      mq.removeEventListener("change", syncMq);
    };
  }, []);
  const barHidden = isStickyBarHidden({ mobile, builderInView });

  const current = ORDER_STEPS[step]!;
  const isLast = step === ORDER_STEPS.length - 1;

  const next = async () => {
    const ok = await trigger([...current.fields]);
    if (!ok) {
      requestAnimationFrame(() => {
        stepRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });
      return;
    }
    setStep((s) => Math.min(s + 1, ORDER_STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const values = useWatch({ control }) as OrderFormValues;
  const summary = summarizeOrder(values, catalog);
  const valid = useMemo(
    () => createOrderSchema(ctx).safeParse(values).success,
    [ctx, values],
  );
  const waHref = valid ? buildOrderWaLink(waNumber, values, catalog) : null;
  const messageText = buildOrderMessageText(values, catalog);
  const variantSlug = findProduct(catalog, values.productId)?.slug ?? null;

  if (!catalog.products.length) {
    return (
      <Alert>
        <AlertTitle>Daftar produk belum tersedia.</AlertTitle>
        <AlertDescription>
          Silakan chat kami langsung via WhatsApp untuk memesan.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <FormProvider {...form}>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <form
          ref={formRef}
          noValidate
          aria-labelledby="order-step-heading"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isLast) void next();
          }}
          // Mobile: reserve the fixed bar's height so the last field is never under it.
          className="flex flex-col gap-6 max-md:pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:col-span-8"
        >
          <ol
            className="flex flex-wrap gap-2 text-sm"
            aria-label="Langkah pemesanan"
          >
            {ORDER_STEPS.map((s, i) => (
              <li
                key={s.id}
                aria-current={i === step ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1",
                  i === step
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground",
                  i < step && "text-foreground",
                )}
              >
                <span className="tabular-nums" aria-hidden>
                  {i + 1}
                </span>
                <span>{s.title}</span>
                {i < step ? <span className="sr-only">(selesai)</span> : null}
              </li>
            ))}
          </ol>

          <h2
            id="order-step-heading"
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-h3 outline-none"
          >
            <span className="sr-only">
              Langkah {step + 1} dari {ORDER_STEPS.length}:{" "}
            </span>
            {current.title}
          </h2>

          <div ref={stepRef}>
            {current.id === "produk" ? (
              <StepProduct catalog={catalog} showPrice={showPrice} />
            ) : null}
            {current.id === "tanggal" ? (
              <StepDate
                days={days}
                availability={ctx.availability}
                deliveryOptions={deliveryOptions}
              />
            ) : null}
            {current.id === "pemesan" ? <StepCustomer /> : null}
            {current.id === "ringkasan" ? (
              <div className="flex flex-col gap-6">
                <OrderSummaryList summary={summary} />
                <OrderMessagePreview text={messageText} />
                {!valid ? (
                  <Alert variant="destructive">
                    <AlertTitle>Ada yang perlu dicek lagi.</AlertTitle>
                    <AlertDescription>
                      Pilihan Anda berubah atau tanggalnya sudah lewat batas
                      pesan. Kembali ke langkah sebelumnya untuk memperbaikinya.
                    </AlertDescription>
                  </Alert>
                ) : !waHref ? (
                  <Alert variant="destructive">
                    <AlertTitle>Nomor WhatsApp belum diatur.</AlertTitle>
                    <AlertDescription>
                      Mohon hubungi kami lewat halaman Kontak.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Tombol di bawah membuka WhatsApp dengan pesan di atas. Belum
                    ada pembayaran; Mak Nuk akan mengonfirmasi slot dan harga
                    via chat.
                  </p>
                )}
              </div>
            ) : null}
          </div>

          {/* Fixed on mobile once the builder is in view (hidden = invisible + inert, so not
              focusable), inline on desktop. */}
          <div
            inert={barHidden}
            data-hidden={barHidden || !mobile ? "" : undefined}
            className={cn(
              "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-gutter pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur",
              "transition-[translate,opacity,visibility] duration-200 motion-reduce:transition-none",
              // Before hydration (`mobile` unknown) and while hidden: off-screen + invisible on mobile.
              "max-md:data-hidden:invisible max-md:data-hidden:translate-y-full max-md:data-hidden:opacity-0",
              "md:static md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none",
            )}
          >
            <div className="mx-auto flex w-full max-w-content items-center justify-between gap-3 md:max-w-none md:justify-start">
              {step > 0 ? (
                <Button type="button" variant="secondary" onClick={back}>
                  <ArrowLeftIcon aria-hidden />
                  Kembali
                </Button>
              ) : (
                <span className="md:hidden" />
              )}
              {isLast ? (
                waHref ? (
                  <Button asChild size="lg" className="flex-1 md:flex-none">
                    <WaLink
                      href={waHref}
                      source="custom-order:submit"
                      kind="order"
                      variant={variantSlug}
                    >
                      Kirim pesanan ke WhatsApp
                    </WaLink>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    disabled
                    className="flex-1 md:flex-none"
                  >
                    Kirim pesanan ke WhatsApp
                  </Button>
                )
              ) : (
                <Button type="submit" size="lg" className="flex-1 md:flex-none">
                  Lanjut
                  <ArrowRightIcon aria-hidden />
                </Button>
              )}
            </div>
          </div>
        </form>

        <aside
          aria-label="Ringkasan pesanan"
          className="hidden lg:col-span-4 lg:block"
        >
          <div className="sticky top-24 flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
            <p className="font-display text-h4">Pesanan Anda</p>
            <OrderSummaryList summary={summary} compact={!isLast} />
            <p className="text-sm text-muted-foreground">
              Konfirmasi akhir slot dan harga via WhatsApp.
            </p>
          </div>
        </aside>
      </div>
    </FormProvider>
  );
}
