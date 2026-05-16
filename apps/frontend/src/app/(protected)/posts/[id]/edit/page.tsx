import { notFound } from 'next/navigation';
import type { IPost, ICategory } from '@blog/types';
import { PostForm } from '@/components/posts/PostForm';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://blog-api.pinodev.app';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;

  let post: IPost | null = null;
  let categories: ICategory[] = [];

  try {
    const [postRes, catsRes] = await Promise.all([
      fetch(`${API_BASE}/posts/${id}`, { cache: 'no-store' }),
      fetch(`${API_BASE}/categories`, { cache: 'no-store' }),
    ]);

    if (postRes.status === 404) return notFound();
    if (postRes.ok) post = await postRes.json();
    if (catsRes.ok) categories = await catsRes.json();
  } catch {
    return notFound();
  }

  if (!post) return notFound();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">Edit post</h1>
        <p className="mt-1 text-sm text-muted">
          Make changes and publish when ready
        </p>
      </div>
      <PostForm
        postId={post.id}
        initialValues={{
          title: post.title,
          content: post.content ?? undefined,
          coverImage: post.coverImage ?? undefined,
          categoryIds: post.categories.map((c) => c.id),
        }}
        categories={categories}
      />
    </div>
  );
}
