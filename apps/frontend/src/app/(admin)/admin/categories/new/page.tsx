import { CategoryForm } from '@/components/admin/CategoryForm';

export default function NewCategoryPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">New category</h1>
      </div>
      <CategoryForm />
    </div>
  );
}
