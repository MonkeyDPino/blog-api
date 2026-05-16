import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-bold text-ink">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted">Sign in to your account</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
          <Suspense
            fallback={
              <div className="h-48 animate-pulse rounded-lg bg-surface" />
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
