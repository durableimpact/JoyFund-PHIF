'use client';
import Image from 'next/image';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const ROLE_HOME: Record<string, string> = {
  DONOR: '/dashboard/donor',
  SYSTEM_ADMIN: '/dashboard/admin',
  HOSPITAL_ADMIN: '/dashboard/hospital-admin',
  RECEPTIONIST: '/dashboard/receptionist',
  SOCIAL_WORKER: '/dashboard/social-worker',
};

function getRedirectPath(role: string | undefined) {
  return ROLE_HOME[role as keyof typeof ROLE_HOME] ?? '/dashboard';
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get('redirect') || undefined;

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('[login] Attempting to sign in with:', { email: form.email });
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      console.log('[login] SignIn result:', result);

      if (!result?.ok) {
        const errorMsg = result?.error || 'Invalid email or password.';
        console.error('[login] Sign in failed:', errorMsg);
        setError(errorMsg);
        return;
      }

      console.log('[login] Sign in successful, redirecting...');

      // If a redirect query param is present, prefer it. Otherwise use role-based home.
      if (redirectParam) {
        try {
          const dest = decodeURIComponent(redirectParam);
          router.push(dest);
        } catch {
          router.push('/dashboard');
        }
      } else {
        router.push('/dashboard');
      }

    } catch (error) {
      console.error('[login] Unexpected error:', error);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white mx-auto mb-4 flex items-center justify-center">
            <Image
              src="/assets/favicon_io/joyfund-android-chrome-192x192.png"
              alt="JoyFund logo"
              width={56}
              height={56}
              className="object-cover"
            />
          </div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">Sign in to JoyFund</h1>
          <p className="text-gray-500 text-sm mt-2">Enter your credentials to access your portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-5">

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">Email address</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB1DB] focus:border-transparent transition"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-semibold text-[#1A1A2E]">Password</label>
              <Link href="/forgot-password" className="text-xs text-[#1DB1DB] hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB1DB] focus:border-transparent transition pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
            style={{ background: 'var(--primary)' }}
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
          </button>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500">
            New donor?{' '}
            <Link href="/register" className="text-[#1DB1DB] font-semibold hover:underline">
              Create a JoyFund account
            </Link>
          </p>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          JoyFund v1.0 · Solidarity Health Bridge · Cameroon 🇨🇲
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#1DB1DB] border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
