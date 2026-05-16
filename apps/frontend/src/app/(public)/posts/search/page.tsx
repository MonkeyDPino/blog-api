'use client';

import { useState, useEffect, useRef } from 'react';
import type { IPost } from '@blog/types';
import { postsApi } from '@/lib/api/posts';
import { PostList } from '@/components/posts/PostList';
import { Input } from '@/components/ui/input';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const posts = await postsApi.search(query.trim());
        setResults(posts.filter((p) => !p.isDraft));
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">Search</h1>
        <p className="mt-1 text-sm text-muted">Find articles by keyword</p>
      </div>

      <Input
        type="search"
        placeholder="Type to search…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-8 max-w-xl text-base"
        autoFocus
      />

      {isLoading ? (
        <p className="text-muted">Searching…</p>
      ) : query.trim() && results.length === 0 ? (
        <p className="text-muted">No results for &quot;{query}&quot;</p>
      ) : (
        <PostList posts={results} />
      )}
    </div>
  );
}
