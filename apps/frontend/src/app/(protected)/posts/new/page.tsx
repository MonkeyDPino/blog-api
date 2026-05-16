import type { ICategory } from '@blog/types';
import { PostForm } from '@/components/posts/PostForm';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://blog-api.pinodev.app';

export default async function NewPostPage() {
  let categories: ICategory[] = [];
  try {
    const res = await fetch(`${API_BASE}/categories`, { cache: 'no-store' });
    if (res.ok) categories = await res.json();
  } catch {
    // proceed with empty categories
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">New post</h1>
        <p className="mt-1 text-sm text-muted">
          Write and save as draft, then publish when ready
        </p>
      </div>
      <PostForm categories={categories} />
    </div>
  );
}
