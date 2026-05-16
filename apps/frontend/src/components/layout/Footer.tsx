import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <span className="font-serif text-lg font-bold text-ink">
              Pino Blog
            </span>
            <p className="text-xs text-muted">Ideas worth reading.</p>
          </div>

          <nav className="flex items-center gap-6 text-sm text-muted">
            <Link href="/" className="hover:text-ink transition-colors">
              Home
            </Link>
            <Link href="/posts" className="hover:text-ink transition-colors">
              Posts
            </Link>
            <Link href="/admin" className="hover:text-ink transition-colors">
              Dashboard
            </Link>
          </nav>
        </div>

        <div className="mt-6 border-t border-border pt-6 text-center text-xs text-muted">
          © {year} Pino Blog. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
