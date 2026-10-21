import "server-only";

import { getPostForAdmin } from "@/features/posts/queries.admin";
import type { TiptapDoc } from "@/lib/rich-text/schema";

import type { PostEditorOptions } from "../_components/post-editor";
import { loadCategoryOptions, loadTagOptions } from "../_shared/lib/load";
import { visibilityOf } from "../_shared/lib/publish";
import { postDraftFromRecord, type PostDraft } from "./post-draft";

export async function loadPostOptions(): Promise<PostEditorOptions> {
  const [categories, tags] = await Promise.all([
    loadCategoryOptions("post"),
    loadTagOptions(),
  ]);
  return { categories, tags };
}

export async function loadPostDraft(
  id: string,
): Promise<{ draft: PostDraft; liveSlug: string | null } | null> {
  const post = await getPostForAdmin(id);
  if (!post) return null;
  return {
    draft: postDraftFromRecord({
      ...post,
      content: (post.content ?? null) as TiptapDoc | null,
    }),
    liveSlug:
      visibilityOf(post.status, post.publishedAt) === "live" ? post.slug : null,
  };
}
