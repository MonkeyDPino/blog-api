'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'At least one uppercase letter')
    .regex(/\d/, 'At least one number')
    .regex(/[^A-Za-z0-9]/, 'At least one special character'),
});

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        profile: { firstName: data.firstName, lastName: data.lastName },
      });
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('root', {
          message: 'An account with this email already exists',
        });
      } else {
        setError('root', {
          message: 'Something went wrong. Please try again.',
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" placeholder="John" {...register('firstName')} />
          {errors.firstName && (
            <p className="text-xs text-red-400">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" placeholder="Doe" {...register('lastName')} />
          {errors.lastName && (
            <p className="text-xs text-red-400">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Min 8 chars, uppercase, number, symbol"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-xs text-red-400">{errors.password.message}</p>
        )}
      </div>

      {errors.root && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {errors.root.message}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-primary hover:underline font-medium"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
