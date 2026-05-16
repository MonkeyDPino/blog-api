import Link from 'next/link';
import type { ICategory } from '@blog/types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://blog-api.pinodev.app';

export default async function CategoriesPage() {
  let categories: ICategory[] = [];
  try {
    const res = await fetch(`${API_BASE}/categories`, { cache: 'no-store' });
    if (res.ok) {
      categories = await res.json();
    }
  } catch {
    // Network error
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">Categories</h1>
        <p className="mt-1 text-sm text-muted">Browse posts by topic</p>
      </div>

      {categories.length === 0 ? (
        <p className="text-muted">No categories yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.id}`}
              className="group rounded-xl border border-border bg-surface overflow-hidden hover:border-primary/40 transition-colors duration-200"
            >
              {cat.coverImage && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={cat.coverImage}
                    alt={cat.name}
                    className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-5">
                <h2 className="font-semibold text-ink group-hover:text-primary transition-colors">
                  {cat.name}
                </h2>
                {cat.description && (
                  <p className="mt-1.5 text-sm text-muted line-clamp-2">
                    {cat.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
