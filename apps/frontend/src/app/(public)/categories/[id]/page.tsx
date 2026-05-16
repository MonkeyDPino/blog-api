import { notFound } from 'next/navigation';
import type { ICategory, IPost } from '@blog/types';
import { PostList } from '@/components/posts/PostList';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://blog-api.pinodev.app';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { id } = await params;

  let category: ICategory | null = null;
  let posts: IPost[] = [];

  try {
    const [catRes, postsRes] = await Promise.all([
      fetch(`${API_BASE}/categories/${id}`, { cache: 'no-store' }),
      fetch(`${API_BASE}/categories/${id}/posts`, { cache: 'no-store' }),
    ]);

    if (catRes.status === 404) return notFound();
    if (catRes.ok) category = await catRes.json();
    if (postsRes.ok) posts = await postsRes.json();
  } catch {
    return notFound();
  }

  if (!category) return notFound();

  const publicPosts = posts.filter((p) => !p.isDraft);

  return (
    <div>
      {category.coverImage && (
        <div className="mb-8 aspect-[3/1] overflow-hidden rounded-xl">
          <img
            src={category.coverImage}
            alt={category.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-sm text-muted">{category.description}</p>
        )}
        <p className="mt-1 text-sm text-muted">
          {publicPosts.length}{' '}
          {publicPosts.length === 1 ? 'article' : 'articles'}
        </p>
      </div>

      <PostList posts={publicPosts} />
    </div>
  );
}
