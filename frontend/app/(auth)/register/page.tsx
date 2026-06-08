'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {createDonorAccount} from "@/actions/accounts"
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    website: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      // Create donor account
      const account = await createDonorAccount({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone_number: form.phone,
        password: form.password,
        website: form.website,
      });

      // Only proceed with login if account was successfully created
      if (!account) {
        const message = 'Account creation failed. Please try again.';
        setError(message);
        toast.error(message);
        setLoading(false);
        return;
      }

      // Store credentials temporarily for verification flow
      sessionStorage.setItem('temp_email', form.email);
      sessionStorage.setItem('temp_password', form.password);
      toast.success('Account created. Please verify your email.');

      // Navigate to email verification page
      router.push('/verify-email');

    } catch (err) {
      const errorData = typeof err === 'string' ? JSON.parse(err) : err;
      console.error('[register error]', errorData);

      const errorMessage = 
        errorData?.email?.[0] ||
        errorData?.message ||
        'Registration failed. Please try again.';

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="py-12 flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-xl">

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
          <h1 className="text-2xl font-black text-[#1A1A2E]">Create your JoyFund account</h1>
          <p className="text-gray-500 text-sm mt-2">Start creating campaigns for people you love</p>
        </div>

        <form onSubmit={handleSubmit} className="relative bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-5">

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">First name</label>
            <input type="text" required value={form.first_name} onChange={set('first_name')}
              placeholder="e.g. Jean-Pierre"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB1DB] transition" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">Last name</label>
            <input type="text" required value={form.last_name} onChange={set('last_name')}
              placeholder="e.g. Mbarga"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB1DB] transition" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">Email address</label>
            <input type="email" required value={form.email} onChange={set('email')}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB1DB] transition" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">Phone (MTN / Orange)</label>
            <input type="tel" required value={form.phone} onChange={set('phone')}
              placeholder="e.g. +237 677 000 000"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB1DB] transition" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} required value={form.password} onChange={set('password')}
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB1DB] transition pr-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">Confirm password</label>
            <input type="password" required value={form.confirmPassword} onChange={set('confirmPassword')}
              placeholder="Repeat your password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB1DB] transition" />
          </div>

          <div aria-hidden="true" className="absolute -left-[10000px] top-auto w-px h-px overflow-hidden">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={set('website')}
            />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
            style={{ background: 'var(--primary)' }}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : 'Create Account'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-[#1DB1DB] font-semibold hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}