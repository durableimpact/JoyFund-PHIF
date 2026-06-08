'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {createDonorAccount} from "@/actions/accounts"
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

export default function RegisterPage() {
  const router = useRouter();
  type RegisterInput = {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    website?: string;
  };

  const { register, handleSubmit, setError: setFieldError, formState: { errors }, reset } = useForm<RegisterInput>({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      website: '',
    }
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const onSubmit = async (data: RegisterInput) => {
    setGeneralError('');
    // client-side password checks
    if (data.password !== data.confirmPassword) {
      setGeneralError('Passwords do not match.');
      setFieldError('confirmPassword' as any, { type: 'manual', message: 'Passwords do not match.' });
      return;
    }
    if (data.password.length < 8) {
      setGeneralError('Password must be at least 8 characters.');
      setFieldError('password' as any, { type: 'manual', message: 'Password must be at least 8 characters.' });
      return;
    }

    setLoading(true);

    try {
      const account = await createDonorAccount({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone_number: data.phone,
        password: data.password,
        website: data.website,
      });

      if (!account) {
        const message = 'Account creation failed. Please try again.';
        setGeneralError(message);
        toast.error(message);
        setLoading(false);
        return;
      }

      sessionStorage.setItem('temp_email', data.email);
      sessionStorage.setItem('temp_password', data.password);
      toast.success('Account created. Please verify your email.');
      router.push('/verify-email');
      reset();
      } catch (err) {
      let errorData: any = err;
      try {
        if (typeof err === 'string') errorData = JSON.parse(err);
      } catch (_) {}

      console.error('[register error]', errorData);

      if (errorData && typeof errorData === 'object') {
        for (const key of Object.keys(errorData)) {
          const val = errorData[key];
          const message = Array.isArray(val) ? val.join(' ') : String(val);
          // Map backend keys to form field names (phone_number -> phone)
          if (key === 'phone_number') {
            setFieldError('phone' as any, { type: 'server', message });
          } else if (key === 'non_field_errors' || key === 'detail') {
            setGeneralError(message);
          } else if (key in ({} as RegisterInput)) {
            setFieldError(key as any, { type: 'server', message });
          } else {
            // unknown key -> show general banner
            setGeneralError(message);
          }
        }
      } else {
        setGeneralError('Registration failed. Please try again.');
      }

      const banner =
        (errorData && (errorData.message || (Array.isArray(errorData) && errorData[0]))) ||
        'Registration failed. Please try again.';
      toast.error(banner);
    } finally {
      setLoading(false);
    }
  };


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

        <form onSubmit={handleSubmit(onSubmit)} className="relative bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-5">

          {generalError && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
              {generalError}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">First name</label>
            <input {...register('first_name', { required: 'First name is required' })} type="text"
              placeholder="e.g. Jean-Pierre"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB1DB] transition" />
            {errors.first_name && (
              <div className="text-sm text-red-600 mt-1">{errors.first_name.message}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">Last name</label>
            <input {...register('last_name', { required: 'Last name is required' })} type="text"
              placeholder="e.g. Mbarga"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB1DB] transition" />
            {errors.last_name && (
              <div className="text-sm text-red-600 mt-1">{errors.last_name.message}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">Email address</label>
            <input {...register('email', { required: 'Email is required' })} type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB1DB] transition" />
            {errors.email && (
              <div className="text-sm text-red-600 mt-1">{errors.email.message}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">Phone (MTN / Orange)</label>
            <input {...register('phone', { required: 'Phone number is required' })} type="tel"
              placeholder="e.g. +237 677 000 000"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB1DB] transition" />
            {errors.phone && (
              <div className="text-sm text-red-600 mt-1">{errors.phone.message}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">Password</label>
            <div className="relative">
              <input {...register('password', { required: 'Password is required' })} type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB1DB] transition pr-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <div className="text-sm text-red-600 mt-1">{errors.password.message}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">Confirm password</label>
            <input {...register('confirmPassword', { required: 'Please confirm your password' })} type="password"
              placeholder="Repeat your password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB1DB] transition" />
            {errors.confirmPassword && (
              <div className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</div>
            )}
          </div>

          <div aria-hidden="true" className="absolute -left-[10000px] top-auto w-px h-px overflow-hidden">
            <label htmlFor="website">Website</label>
            <input {...register('website')} id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
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