import Link from 'next/link';
import type { IPost } from '@blog/types';
import { PostList } from '@/components/posts/PostList';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://blog-api.pinodev.app';

export default async function PostsPage() {
  let posts: IPost[] = [];
  try {
    const res = await fetch(`${API_BASE}/posts`, { cache: 'no-store' });
    if (res.ok) {
      posts = await res.json();
    }
  } catch {
    // Network error — render empty list
  }

  const publicPosts = posts.filter((p) => !p.isDraft);

  return (
    <div>
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">Latest Posts</h1>
          <p className="mt-1 text-sm text-muted">
            {publicPosts.length}{' '}
            {publicPosts.length === 1 ? 'article' : 'articles'} published
          </p>
        </div>
        <Link
          href="/posts/search"
          className="text-sm text-muted hover:text-primary transition-colors"
        >
          Search →
        </Link>
      </div>
      <PostList posts={publicPosts} />
    </div>
  );
}
