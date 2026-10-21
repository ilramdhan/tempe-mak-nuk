import { serializeJsonLd } from "./serialize";

export { serializeJsonLd };

/** Server component: one `<script type="application/ld+json">` per node. Renders nothing for null/empty. */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[] | null | undefined;
}) {
  if (!data) return null;
  const nodes = Array.isArray(data) ? data : [data];
  return (
    <>
      {nodes.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(node) }}
        />
      ))}
    </>
  );
}
