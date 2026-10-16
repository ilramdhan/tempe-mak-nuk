import Image from "next/image";
import Link from "next/link";

import { ImagePlaceholder } from "@/components/brand/textures";
import { Badge } from "@/components/ui/badge";
import type { PostSummary } from "@/features/posts/queries";
import { formatDate } from "@/lib/dates";

export function PostMeta({
  post,
  className,
}: {
  post: Pick<PostSummary, "publishedAt" | "readingMinutes">;
  className?: string;
}) {
  return (
    <p
      className={`flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground ${className ?? ""}`}
    >
      {post.publishedAt ? (
        <time dateTime={post.publishedAt.toISOString()}>
          {formatDate(post.publishedAt)}
        </time>
      ) : null}
      {post.readingMinutes ? (
        <span>{post.readingMinutes} menit baca</span>
      ) : null}
    </p>
  );
}

export function PostCard({
  post,
  priority = false,
}: {
  post: PostSummary;
  priority?: boolean;
}) {
  const cover = post.cover;
  return (
    <article className="group relative flex flex-col gap-3">
      {cover ? (
        <div
          className="relative w-full overflow-hidden rounded-lg border border-border bg-surface"
          style={{ aspectRatio: "16 / 10" }}
        >
          <Image
            src={cover.url}
            alt={cover.alt ?? post.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            {...(cover.blurDataUrl
              ? { placeholder: "blur" as const, blurDataURL: cover.blurDataUrl }
              : {})}
          />
        </div>
      ) : (
        <ImagePlaceholder caption={post.title} aspect="16 / 10" texture="soy" />
      )}
      <div className="flex flex-col gap-2">
        {post.category ? (
          <Badge variant="secondary" className="w-fit">
            {post.category.name}
          </Badge>
        ) : null}
        <h2 className="font-display text-h4 text-balance">
          <Link
            href={`/jurnal/${post.slug}`}
            className="underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline"
          >
            {post.title}
          </Link>
        </h2>
        {post.excerpt ? (
          <p className="line-clamp-3 text-muted-foreground">{post.excerpt}</p>
        ) : null}
        <PostMeta post={post} />
      </div>
    </article>
  );
}
