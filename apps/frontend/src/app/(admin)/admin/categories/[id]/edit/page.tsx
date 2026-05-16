import { notFound } from 'next/navigation';
import type { ICategory } from '@blog/types';
import { CategoryForm } from '@/components/admin/CategoryForm';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://blog-api.pinodev.app';

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const { id } = await params;
  const categoryId = parseInt(id, 10);

  if (isNaN(categoryId)) notFound();

  let category: ICategory | null = null;
  try {
    const res = await fetch(`${API_BASE}/categories/${categoryId}`, {
      cache: 'no-store',
    });
    if (res.status === 404) notFound();
    if (res.ok) category = await res.json();
  } catch {
    notFound();
  }

  if (!category) notFound();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">Edit category</h1>
      </div>
      <CategoryForm categoryId={categoryId} initialData={category} />
    </div>
  );
}
