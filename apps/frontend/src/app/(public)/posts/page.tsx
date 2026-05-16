'use client';

import { useState, useEffect, useRef } from 'react';
import type { IPaginated, IPost } from '@blog/types';
import { postsApi } from '@/lib/api/posts';
import { PostList } from '@/components/posts/PostList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const LIMIT = 12;

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-10 flex items-center justify-center gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        ← Prev
      </Button>

      {getPageNumbers(page, totalPages).map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted select-none">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(p as number)}
          >
            {p}
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next →
      </Button>
    </div>
  );
}

export default function PostsPage() {
  const [result, setResult] = useState<IPaginated<IPost> | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevQuery = useRef('');

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = query.trim();
    const queryChanged = q !== prevQuery.current;
    prevQuery.current = q;
    const delay = queryChanged ? 400 : 0;

    timerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = q
          ? await postsApi.search(q, page, LIMIT)
          : await postsApi.getAll(page, LIMIT);
        setResult(data);
      } catch {
        setResult(null);
      } finally {
        setIsLoading(false);
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, page]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPage(1);
    setQuery(e.target.value);
  };

  const posts = result?.data ?? [];
  const q = query.trim();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink">Latest Posts</h1>
        {!isLoading && result && (
          <p className="mt-1 text-sm text-muted">
            {q
              ? `${result.total} result${result.total !== 1 ? 's' : ''} for "${query}"`
              : `${result.total} ${result.total !== 1 ? 'articles' : 'article'} published`}
          </p>
        )}
      </div>

      <Input
        type="search"
        placeholder="Search articles…"
        value={query}
        onChange={handleQueryChange}
        className="mb-8 max-w-xl text-base"
      />

      {isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : posts.length === 0 ? (
        <p className="text-muted">
          {q ? `No results for "${query}"` : 'No posts yet.'}
        </p>
      ) : (
        <>
          <PostList posts={posts} />
          {result && (
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
