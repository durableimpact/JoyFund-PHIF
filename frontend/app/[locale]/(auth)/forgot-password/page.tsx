'use client';
import { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/actions/accounts';
import { getErrorMessage } from '@/lib/errors';
import { Heart, Loader2, ArrowLeft, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useI18n } from '@/locales/client';

type Step = 'form' | 'sent';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const t = useI18n();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call the action to request password reset
      await requestPasswordReset(email);
      
      // Move to next step and prepare to navigate after delay
      setStep('sent');
      toast.success(t('auth.forgotPassword.codeSent'));
      
      // Auto-navigate to reset password page after 3 seconds
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 3000);
    } catch (err) {
      const errorMessage =
        getErrorMessage(err) || 'Connection error. Please try again.';

      setError(errorMessage);
      toast.error(errorMessage);
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="py-12 flex items-center justify-center px-4"
      style={{ background: 'var(--background)' }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4"
            style={{ background: 'var(--primary)' }}
          >
            <Heart size={28} />
          </div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">
            {step === 'form' ? t('auth.forgotPassword.title') : t('auth.forgotPassword.sentTitle')}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {step === 'form'
              ? t('auth.forgotPassword.subtitle')
              : `${t('auth.forgotPassword.sentSubtitle')} ${email}`}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">

          {/* ── Step 1: Email form ── */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">
                  {t('auth.forgotPassword.email')}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB1DB] focus:border-transparent transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                style={{ background: 'var(--primary)' }}
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> {t('auth.forgotPassword.loading')}</>
                  : t('auth.forgotPassword.button')}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
              >
                <ArrowLeft size={14} /> {t('auth.forgotPassword.back')}
              </Link>
            </form>
          )}

          {/* ── Step 2: Confirmation ── */}
          {step === 'sent' && (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-[#1DB1DB]/10 flex items-center justify-center mx-auto">
                <Mail size={28} className="text-[#1DB1DB]" />
              </div>

              <p className="text-sm text-gray-500 leading-relaxed">
                {t('auth.forgotPassword.sentNote', { email })}
              </p>

              <button
                onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
                className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center transition"
                style={{ background: 'var(--primary)' }}
              >
                {t('auth.forgotPassword.enterCode')}
              </button>

              <button
                onClick={() => { setStep('form'); setError(''); }}
                className="text-sm text-gray-500 hover:text-gray-700 transition underline underline-offset-2"
              >
                {t('auth.forgotPassword.useDifferent')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}