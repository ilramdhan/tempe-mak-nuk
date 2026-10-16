import { Grid } from "@/components/site/primitives";
import type { PostSummary } from "@/features/posts/queries";

import { PostCard } from "./post-card";

export function PostGrid({ posts }: { posts: PostSummary[] }) {
  return (
    <Grid cols={3} gap="lg">
      {posts.map((p, i) => (
        <PostCard key={p.id} post={p} priority={i < 3} />
      ))}
    </Grid>
  );
}
