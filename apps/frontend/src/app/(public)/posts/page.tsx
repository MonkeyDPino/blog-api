'use client';

import { useState, useEffect, useRef } from 'react';
import type { IPost } from '@blog/types';
import { postsApi } from '@/lib/api/posts';
import { PostList } from '@/components/posts/PostList';
import { Input } from '@/components/ui/input';

export default function PostsPage() {
  const [allPosts, setAllPosts] = useState<IPost[]>([]);
  const [results, setResults] = useState<IPost[] | null>(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    postsApi
      .getAll()
      .then((posts) => {
        setAllPosts(posts.filter((p) => !p.isDraft));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = query.trim();

    if (!q) {
      setResults(null);
      return;
    }

    timerRef.current = setTimeout(async () => {
      try {
        const found = await postsApi.search(q);
        setResults(found.filter((p) => !p.isDraft));
      } catch {
        setResults([]);
      }
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const displayed = results ?? allPosts;
  const q = query.trim();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink">Latest Posts</h1>
        {!isLoading && (
          <p className="mt-1 text-sm text-muted">
            {q && results !== null
              ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`
              : `${allPosts.length} ${allPosts.length === 1 ? 'article' : 'articles'} published`}
          </p>
        )}
      </div>

      <Input
        type="search"
        placeholder="Search articles…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-8 max-w-xl text-base"
      />

      {isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : q && results !== null && results.length === 0 ? (
        <p className="text-muted">
          No results for &quot;{query}&quot;
        </p>
      ) : (
        <PostList posts={displayed} />
      )}
    </div>
  );
}
