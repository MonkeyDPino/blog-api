'use client';

import type { ICategory } from '@blog/types';
import { cn } from '@/lib/utils/cn';

interface CategoryChipsProps {
  categories: ICategory[];
  value: number[];
  onChange: (ids: number[]) => void;
  suggested?: string[];
}

export function CategoryChips({
  categories,
  value,
  onChange,
  suggested = [],
}: CategoryChipsProps) {
  const suggestedLower = suggested.map((s) => s.toLowerCase());

  const toggle = (id: number) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const isSelected = value.includes(cat.id);
        const isSuggested =
          !isSelected && suggestedLower.includes(cat.name.toLowerCase());

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => toggle(cat.id)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
              isSelected
                ? 'border-primary bg-primary/20 text-primary'
                : isSuggested
                  ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
                  : 'border-border bg-transparent text-muted hover:border-primary/40 hover:text-ink',
            )}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
