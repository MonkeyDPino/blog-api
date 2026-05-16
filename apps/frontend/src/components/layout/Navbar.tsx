'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function Navbar() {
  const { user, isLoading, logout } = useAuth();

  const fullName = user?.profile
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : (user?.email ?? '');

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
      <nav className="container mx-auto flex max-w-6xl items-center justify-between px-4 h-14">
        <Link
          href="/"
          className="font-semibold text-ink hover:text-primary transition-colors"
        >
          Pino Blog
        </Link>

        <div className="flex items-center gap-1">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </>
          ) : user ? (
            <>
              <span className="hidden sm:block text-sm text-muted mr-2 px-2">
                {fullName}
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              {user.role === 'admin' && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/categories">Admin</Link>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
