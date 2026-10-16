"use client";

/** One form per block type (17). Fields write into the block's `data` by path. */
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";
import type { ComponentType } from "react";

import { Button } from "@/components/ui/button";
import {
  FieldDescription,
  FieldError,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ICON_NAMES, type BlockType } from "@/features/pages/blocks";

import {
  addCompareColumn,
  moveCompareColumn,
  padValues,
  removeCompareColumn,
  type CompareRow,
  type Path,
} from "../_lib/path";
import {
  CtaField,
  ImageField,
  ListField,
  NumberField,
  PickListField,
  RichTextField,
  SelectField,
  SwitchField,
  TextAreaField,
  TextField,
  useBlockForm,
  type Choice,
} from "./fields";

const ICONS: Choice[] = ICON_NAMES.map((n) => ({ value: n, label: n }));
const TONES: Choice[] = [
  { value: "default", label: "Default (krem)" },
  { value: "surface", label: "Permukaan (lebih gelap sedikit)" },
  { value: "primary", label: "Hijau (primary)" },
  { value: "inverse", label: "Gelap (inverse)" },
];
const COLS: Choice[] = [
  { value: "2", label: "2 kolom" },
  { value: "3", label: "3 kolom" },
  { value: "4", label: "4 kolom" },
];

type Item = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : "");
// List items may be malformed in legacy data; read fields defensively.

// ── Shared groups ────────────────────────────────────────────────────────
function HeadingFields({ headingRequired }: { headingRequired?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField
        path={["eyebrow"]}
        label="Eyebrow (label kecil)"
        maxLength={80}
      />
      <TextField
        path={["heading"]}
        label="Judul section"
        required={headingRequired}
        maxLength={160}
      />
      <TextAreaField
        path={["intro"]}
        label="Pengantar"
        className="sm:col-span-2"
        maxLength={600}
      />
    </div>
  );
}

/** Anchor + tone, shown in every form under "Tampilan". */
export function FrameFields() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField
        path={["anchor"]}
        label="Anchor (opsional)"
        placeholder="mis. cara-pesan"
        description="ID untuk tautan #anchor: huruf kecil, angka, tanda hubung."
        maxLength={41}
      />
      <SelectField
        path={["tone"]}
        label="Warna latar"
        choices={TONES}
        noneLabel="Default"
      />
    </div>
  );
}

// ── Per-type forms ───────────────────────────────────────────────────────
function HeroForm() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField path={["eyebrow"]} label="Eyebrow" maxLength={80} />
        <SelectField
          path={["layout"]}
          label="Tata letak"
          choices={[
            { value: "split", label: "Teks kiri, gambar kanan" },
            { value: "center", label: "Teks tengah (tanpa gambar)" },
          ]}
        />
        <TextField
          path={["headline"]}
          label="Judul utama"
          required
          className="sm:col-span-2"
          maxLength={160}
        />
        <TextAreaField
          path={["subheadline"]}
          label="Subjudul"
          className="sm:col-span-2"
          maxLength={400}
        />
      </div>
      <CtaField path={["primaryCta"]} label="Tombol utama" />
      <CtaField path={["secondaryCta"]} label="Tombol kedua" />
      <ImageField path={["image"]} label="Gambar" />
    </>
  );
}

function RichTextForm() {
  return (
    <>
      <HeadingFields />
      <RichTextField path={["content"]} label="Isi teks" />
      <SelectField
        path={["width"]}
        label="Lebar"
        choices={[
          { value: "prose", label: "Sempit (nyaman dibaca)" },
          { value: "default", label: "Lebar konten" },
        ]}
      />
    </>
  );
}

function FeatureGridForm() {
  return (
    <>
      <HeadingFields />
      <SelectField
        path={["columns"]}
        label="Kolom"
        choices={COLS}
        noneLabel="Otomatis"
        numeric
      />
      <ListField<Item>
        path={["items"]}
        label="Poin keunggulan"
        min={1}
        max={12}
        itemLabel={(it) => str(it.title)}
        newItem={() => ({ icon: "check", title: "", body: null })}
      >
        {(p) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                path={[...p, "icon"]}
                label="Ikon"
                choices={ICONS}
                noneLabel="Tanpa ikon"
              />
              <TextField
                path={[...p, "title"]}
                label="Judul"
                required
                maxLength={100}
              />
            </div>
            <TextAreaField
              path={[...p, "body"]}
              label="Penjelasan"
              maxLength={500}
            />
          </>
        )}
      </ListField>
    </>
  );
}

function CompareTable() {
  const { data, set, errors } = useBlockForm();
  const columns = (Array.isArray(data.columns) ? data.columns : []) as string[];
  const rows = (Array.isArray(data.rows) ? data.rows : []) as CompareRow[];
  const apply = (next: { columns: string[]; rows: CompareRow[] }) => {
    set(["columns"], next.columns);
    set(["rows"], next.rows);
  };
  const rowErrors = Object.entries(errors).filter(([k]) =>
    /^rows\.\d+\.values$/.test(k),
  );
  return (
    <>
      <FieldSet className="rounded-lg border border-input p-4">
        <FieldLegend variant="label">Kolom (1–6)</FieldLegend>
        {errors.columns ? <FieldError>{errors.columns}</FieldError> : null}
        <ol className="flex flex-col gap-2">
          {columns.map((c, i) => (
            <li key={i} className="flex items-center gap-2">
              <Input
                aria-label={`Nama kolom ${i + 1}`}
                value={c}
                maxLength={80}
                aria-invalid={errors[`columns.${i}`] ? true : undefined}
                onChange={(e) => set(["columns", i], e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Geser kolom ${i + 1} ke kiri`}
                disabled={i === 0}
                onClick={() =>
                  apply(moveCompareColumn(columns, rows, i, i - 1))
                }
              >
                <ArrowLeft />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Geser kolom ${i + 1} ke kanan`}
                disabled={i === columns.length - 1}
                onClick={() =>
                  apply(moveCompareColumn(columns, rows, i, i + 1))
                }
              >
                <ArrowRight />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Hapus kolom ${i + 1}`}
                disabled={columns.length <= 1}
                onClick={() => apply(removeCompareColumn(columns, rows, i))}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ol>
        {Object.entries(errors)
          .filter(([k]) => /^columns\.\d+$/.test(k))
          .map(([k, v]) => (
            <FieldError key={k}>
              Kolom {Number(k.split(".")[1]) + 1}: {v}
            </FieldError>
          ))}
        <div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={columns.length >= 6}
            onClick={() => apply(addCompareColumn(columns, rows, ""))}
          >
            <Plus /> Tambah kolom
          </Button>
        </div>
      </FieldSet>
      <ListField<CompareRow>
        path={["rows"]}
        label="Baris"
        description="Setiap baris punya satu nilai per kolom."
        min={1}
        max={40}
        itemLabel={(r) => r.label}
        newItem={() => ({ label: "", values: padValues([], columns.length) })}
      >
        {(p, i) => (
          <>
            <TextField
              path={[...p, "label"]}
              label="Label baris"
              required
              maxLength={120}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {columns.map((c, ci) => (
                <TextField
                  key={ci}
                  path={[...p, "values", ci]}
                  label={c || `Kolom ${ci + 1}`}
                  nullable={false}
                  maxLength={300}
                />
              ))}
            </div>
            {rowErrors
              .filter(([k]) => k === `rows.${i}.values`)
              .map(([k, v]) => (
                <FieldError key={k}>{v}</FieldError>
              ))}
          </>
        )}
      </ListField>
    </>
  );
}

function CompareForm() {
  return (
    <>
      <HeadingFields />
      <CompareTable />
      <TextAreaField
        path={["note"]}
        label="Catatan di bawah tabel"
        maxLength={400}
      />
    </>
  );
}

function StepsForm() {
  return (
    <>
      <HeadingFields />
      <ListField<Item>
        path={["items"]}
        label="Langkah"
        min={1}
        max={12}
        itemLabel={(it) => str(it.title)}
        newItem={() => ({ title: "", body: null, icon: null })}
      >
        {(p) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                path={[...p, "title"]}
                label="Judul"
                required
                maxLength={120}
              />
              <SelectField
                path={[...p, "icon"]}
                label="Ikon"
                choices={ICONS}
                noneLabel="Nomor saja"
              />
            </div>
            <TextAreaField
              path={[...p, "body"]}
              label="Penjelasan"
              maxLength={600}
            />
          </>
        )}
      </ListField>
      <CtaField path={["cta"]} label="Tombol di bawah" />
    </>
  );
}

function StatsForm() {
  return (
    <>
      <HeadingFields />
      <ListField<Item>
        path={["items"]}
        label="Angka"
        min={1}
        max={12}
        itemLabel={(it) => `${str(it.value)} ${str(it.label)}`.trim()}
        newItem={() => ({ value: "", unit: null, label: "" })}
      >
        {(p) => (
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              path={[...p, "value"]}
              label="Angka"
              required
              maxLength={20}
            />
            <TextField path={[...p, "unit"]} label="Satuan" maxLength={20} />
            <TextField
              path={[...p, "label"]}
              label="Label"
              required
              maxLength={80}
            />
          </div>
        )}
      </ListField>
      <TextField
        path={["source"]}
        label="Sumber data"
        description="Wajib untuk klaim gizi (mis. TKPI Kemenkes 2017)."
        maxLength={300}
      />
    </>
  );
}

function CtaForm() {
  return (
    <>
      <div className="grid gap-4">
        <TextField path={["eyebrow"]} label="Eyebrow" maxLength={80} />
        <TextField path={["headline"]} label="Judul" required maxLength={160} />
        <TextAreaField path={["body"]} label="Teks" maxLength={500} />
      </div>
      <CtaField path={["primary"]} label="Tombol utama" />
      <CtaField path={["secondary"]} label="Tombol kedua" />
    </>
  );
}

function FaqListForm() {
  const { options } = useBlockForm();
  return (
    <>
      <HeadingFields />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          path={["source"]}
          label="Sumber FAQ"
          noneLabel="Otomatis (beranda)"
          choices={[
            { value: "home", label: "Pilihan beranda" },
            { value: "all", label: "Semua FAQ (per kategori)" },
          ]}
        />
        <SelectField
          path={["category"]}
          label="Kategori"
          description="Jika dipilih, mengalahkan sumber."
          noneLabel="Semua kategori"
          choices={options.faqCategories}
        />
        <NumberField path={["limit"]} label="Batas jumlah" min={1} max={100} />
        <SwitchField path={["searchable"]} label="Tampilkan kotak cari" />
      </div>
      <PickListField
        path={["ids"]}
        label="FAQ pilihan (opsional)"
        description="Jika diisi, hanya FAQ ini yang tampil, sesuai urutan."
        choices={options.faqs}
        max={50}
      />
      <CtaField path={["cta"]} label="Tombol di bawah" />
    </>
  );
}

function TestimonialListForm() {
  const { options } = useBlockForm();
  return (
    <>
      <HeadingFields />
      <NumberField
        path={["limit"]}
        label="Jumlah ditampilkan"
        min={1}
        max={30}
        nullable={false}
      />
      <PickListField
        path={["ids"]}
        label="Testimoni pilihan (opsional)"
        description="Kosong = testimoni tampil teratas."
        choices={options.testimonials}
        max={30}
      />
      <CtaField path={["cta"]} label="Tombol di bawah" />
    </>
  );
}

function GalleryForm() {
  return (
    <>
      <HeadingFields />
      <SelectField path={["columns"]} label="Kolom" choices={COLS} numeric />
      <ListField<Item>
        path={["items"]}
        label="Foto"
        max={40}
        itemLabel={(it) => str(it?.caption) || str(it?.alt)}
        newItem={() => ({ mediaId: "", alt: null, caption: null })}
      >
        {(p) => <GalleryItem path={p} />}
      </ListField>
      <TextField
        path={["note"]}
        label="Catatan saat galeri kosong"
        maxLength={300}
      />
    </>
  );
}

function GalleryItem({ path }: { path: Path }) {
  // Gallery items are flat { mediaId, alt, caption }: reuse ImageField on the item itself.
  return <ImageField path={path} label="Foto" withCaption required />;
}

function ProductTeaserForm() {
  const { options } = useBlockForm();
  return (
    <>
      <HeadingFields />
      <PickListField
        path={["productSlugs"]}
        label="Produk pilihan"
        description="Kosong = semua produk aktif sesuai urutan."
        choices={options.products}
      />
      <TextField
        path={["ctaLabel"]}
        label="Teks tautan kartu"
        placeholder="Lihat detail"
        maxLength={60}
      />
      <CtaField path={["cta"]} label="Tombol di bawah" />
    </>
  );
}

function SlotCalendarForm() {
  return (
    <>
      <HeadingFields />
      <NumberField
        path={["days"]}
        label="Jumlah hari ditampilkan"
        min={7}
        max={60}
        nullable={false}
      />
      <CtaField path={["cta"]} label="Tombol di bawah" />
    </>
  );
}

function RecipeTeaserForm() {
  const { options } = useBlockForm();
  return (
    <>
      <HeadingFields />
      <NumberField
        path={["limit"]}
        label="Jumlah"
        min={1}
        max={12}
        nullable={false}
      />
      <PickListField
        path={["slugs"]}
        label="Resep pilihan"
        description="Kosong = resep terbaru."
        choices={options.recipes}
      />
      <CtaField path={["cta"]} label="Tombol di bawah" />
    </>
  );
}

function PostTeaserForm() {
  const { options } = useBlockForm();
  return (
    <>
      <HeadingFields />
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          path={["limit"]}
          label="Jumlah"
          min={1}
          max={12}
          nullable={false}
        />
        <SelectField
          path={["category"]}
          label="Kategori"
          noneLabel="Semua kategori"
          choices={options.postCategories}
        />
      </div>
      <PickListField
        path={["slugs"]}
        label="Artikel pilihan"
        description="Kosong = artikel terbaru."
        choices={options.posts}
      />
      <CtaField path={["cta"]} label="Tombol di bawah" />
    </>
  );
}

function TrustStripForm() {
  return (
    <ListField<Item>
      path={["items"]}
      label="Poin kepercayaan"
      min={1}
      max={8}
      itemLabel={(it) => str(it.label)}
      newItem={() => ({ icon: "check", label: "" })}
    >
      {(p) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            path={[...p, "icon"]}
            label="Ikon"
            choices={ICONS}
            noneLabel="Tanpa ikon"
          />
          <TextField
            path={[...p, "label"]}
            label="Teks"
            required
            maxLength={80}
          />
        </div>
      )}
    </ListField>
  );
}

function LogoStripForm() {
  const { options } = useBlockForm();
  const media: Choice[] = options.media.map((m) => ({
    value: m.id,
    label: m.alt || m.id.slice(0, 8),
  }));
  return (
    <>
      <HeadingFields />
      <ListField<Item>
        path={["items"]}
        label="Logo / nama"
        min={1}
        max={16}
        itemLabel={(it) => str(it.label)}
        newItem={() => ({ mediaId: null, label: "", href: null })}
      >
        {(p) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              path={[...p, "label"]}
              label="Nama"
              required
              maxLength={80}
            />
            <TextField
              path={[...p, "href"]}
              label="Tautan (opsional)"
              placeholder="https://"
            />
            <SelectField
              path={[...p, "mediaId"]}
              label="Logo dari Media"
              noneLabel="Tanpa logo (teks saja)"
              choices={media}
              className="sm:col-span-2"
            />
          </div>
        )}
      </ListField>
    </>
  );
}

function SplitForm() {
  const { options } = useBlockForm();
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField path={["eyebrow"]} label="Eyebrow" maxLength={80} />
        <TextField path={["heading"]} label="Judul" maxLength={160} />
      </div>
      <TextAreaField
        path={["body"]}
        label="Teks singkat"
        rows={4}
        maxLength={2000}
      />
      <RichTextField
        path={["content"]}
        label="Teks kaya (opsional)"
        description="Jika diisi, menggantikan teks singkat."
        nullable
      />
      <ListField<Item>
        path={["facts"]}
        label="Data dari Pengaturan"
        description="Nilai diambil langsung dari menu Pengaturan (mis. nomor halal, alamat)."
        max={12}
        itemLabel={(it) => str(it.label)}
        newItem={() => ({
          label: "",
          settingKey: options.settingKeys[0]?.value ?? "business.name",
        })}
      >
        {(p) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              path={[...p, "label"]}
              label="Label"
              required
              maxLength={60}
            />
            <SelectField
              path={[...p, "settingKey"]}
              label="Kunci pengaturan"
              choices={options.settingKeys}
            />
          </div>
        )}
      </ListField>
      <CtaField path={["cta"]} label="Tombol" />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          path={["imagePosition"]}
          label="Posisi gambar"
          choices={[
            { value: "right", label: "Kanan" },
            { value: "left", label: "Kiri" },
          ]}
        />
        <SwitchField
          path={["map"]}
          label="Tampilkan peta Google"
          description="Menggantikan gambar (URL peta dari Pengaturan)."
        />
      </div>
      <ImageField path={["image"]} label="Gambar" />
    </>
  );
}

export const BLOCK_FORMS: Record<BlockType, ComponentType> = {
  hero: HeroForm,
  richText: RichTextForm,
  featureGrid: FeatureGridForm,
  compare: CompareForm,
  steps: StepsForm,
  stats: StatsForm,
  cta: CtaForm,
  faqList: FaqListForm,
  testimonialList: TestimonialListForm,
  gallery: GalleryForm,
  productTeaser: ProductTeaserForm,
  slotCalendarPreview: SlotCalendarForm,
  recipeTeaser: RecipeTeaserForm,
  postTeaser: PostTeaserForm,
  trustStrip: TrustStripForm,
  logoStrip: LogoStripForm,
  split: SplitForm,
};

/** Errors at the block root (e.g. superRefine) that no field shows. */
export function FormLevelErrors() {
  const { errors } = useBlockForm();
  return errors._form ? (
    <FieldDescription className="text-destructive">
      {errors._form}
    </FieldDescription>
  ) : null;
}
