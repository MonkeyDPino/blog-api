'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
    if (!isLoading && user && user.role !== 'admin')
      router.replace('/dashboard');
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div>
      <div className="border-b border-border px-4 py-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          Admin Panel
        </p>
      </div>
      <div className="container mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
