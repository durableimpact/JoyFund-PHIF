'use client';
import { confirmPasswordReset } from '@/actions/accounts';
import { getErrorMessage } from '@/lib/errors';
import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Loader2, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/locales/client';

type Step = 'code' | 'password' | 'done';

function ResetPasswordPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const emailFromQuery = params.get('email') ?? '';
  const t = useI18n();

  const [step, setStep] = useState<Step>('code');
  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // One ref per digit input
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // ── Code input helpers ───────────────────────────────────────────

  const handleCodeChange = useCallback(
    (index: number, value: string) => {
      // Allow paste of full 6-digit code
      if (value.length === 6 && /^\d{6}$/.test(value)) {
        const digits = value.split('');
        setCode(digits);
        inputRefs.current[5]?.focus();
        return;
      }

      // Single digit entry
      if (!/^\d*$/.test(value)) return;
      const next = [...code];
      next[index] = value.slice(-1); // keep only last char
      setCode(next);

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [code]
  );

  const handleCodeKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [code]
  );

  const fullCode = code.join('');
  const codeComplete = fullCode.length === 6 && code.every((d) => d !== '');

  // ── Step 1: Verify code ──────────────────────────────────────────

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeComplete) return;
    setError('');
    setLoading(true);

    try {
      // Code verification will happen when user submits password
      // For now, just move to password step
      setStep('password');
      toast.success(t('auth.resetPassword.codeConfirmed'));
    } catch (err) {
      const errorMessage =
        getErrorMessage(err) || 'Invalid code. Please try again.';

      setError(errorMessage);
      toast.error(errorMessage);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Set new password ─────────────────────────────────────

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      const message = 'Passwords do not match.';
      setError(message);
      toast.error(message);
      return;
    }
    if (password.length < 8) {
      const message = 'Password must be at least 8 characters.';
      setError(message);
      toast.error(message);
      return;
    }

    setLoading(true);

    try {
      // Call the action to confirm password reset
      await confirmPasswordReset({
        code: fullCode,
        new_password: password,
        confirm_password: confirmPassword,
      });

      // Move to success step
      setStep('done');
      toast.success('Password reset successfully.');
    } catch (err) {
      const errorMessage =
        getErrorMessage(err) || 'Could not reset password. Please request a new code.';

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────

  const titles: Record<Step, string> = {
    code:     t('auth.resetPassword.titleCode'),
    password: t('auth.resetPassword.titlePassword'),
    done:     t('auth.resetPassword.titleDone'),
  };
  const subtitles: Record<Step, string> = {
    code:     t('auth.resetPassword.subtitleCode', { email: email || 'your email' }),
    password: t('auth.resetPassword.subtitlePassword'),
    done:     t('auth.resetPassword.subtitleDone'),
  };

  return (
    <div
      className="py-12 flex items-center justify-center px-4"
      style={{ background: 'var(--background)' }}
    >
      <div className="w-full max-w-xl">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4"
            style={{ background: 'var(--primary)' }}
          >
            <Heart size={28} />
          </div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">{titles[step]}</h1>
          <p className="text-gray-500 text-sm mt-2">{subtitles[step]}</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">

          {/* ── Step 1: 6-digit code ── */}
          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {/* Email field — editable in case they arrived directly */}
              {!emailFromQuery && (
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">
                    {t('auth.resetPassword.email')}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB1DB] transition"
                  />
                </div>
              )}

              {/* 6-box code input */}
              <div>
                <label className="block text-sm font-semibold text-[#1A1A2E] mb-3 text-center">
                  {t('auth.resetPassword.codeLabel')}
                </label>
                <div className="flex gap-2 justify-center">
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      onFocus={(e) => e.target.select()}
                      className="w-11 h-14 text-center text-xl font-black rounded-xl border-2 border-gray-200 focus:outline-none focus:border-[#1DB1DB] focus:ring-2 focus:ring-[#1DB1DB]/20 transition caret-transparent"
                      style={digit ? { borderColor: 'var(--primary)', background: '#f0fafb' } : {}}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !codeComplete}
                className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
                style={{ background: 'var(--primary)' }}
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> {t('auth.resetPassword.verifying')}</>
                  : t('auth.resetPassword.verifyCode')}
              </button>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <Link href="/login" className="flex items-center gap-1.5 hover:text-gray-700 transition">
                  <ArrowLeft size={14} /> {t('auth.resetPassword.back')}
                </Link>
                <Link href="/forgot-password" className="text-[#1DB1DB] hover:underline">
                  {t('auth.resetPassword.resendCode')}
                </Link>
              </div>
            </form>
          )}

          {/* ── Step 2: New password ── */}
          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {/* Code badge — shows confirmed code */}
              <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
                <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                <span className="text-sm text-green-700">
                  {t('auth.resetPassword.codeVerified', { code: fullCode })}
                </span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">
                  {t('auth.resetPassword.newPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.register.passwordPlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB1DB] transition pr-12"
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

              <div>
                <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">
                  {t('auth.resetPassword.confirmPassword')}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.resetPassword.confirmPlaceholder')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB1DB] transition"
                />
              </div>

              {/* Strength hint */}
              {password.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[8, 10, 12].map((threshold) => (
                      <div
                        key={threshold}
                        className="h-1 flex-1 rounded-full transition-colors duration-300"
                        style={{
                          background:
                            password.length >= threshold
                              ? threshold === 8 ? '#f59e0b'
                                : threshold === 10 ? '#1DB1DB'
                                : '#22c55e'
                              : '#e5e7eb',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    {password.length < 8  && 'Too short'}
                    {password.length >= 8  && password.length < 10 && 'Acceptable — try making it longer'}
                    {password.length >= 10 && password.length < 12 && 'Good password'}
                    {password.length >= 12 && 'Strong password ✓'}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                style={{ background: 'var(--primary)' }}
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> {t('auth.resetPassword.saving')}</>
                  : t('auth.resetPassword.setPassword')}
              </button>
            </form>
          )}

          {/* ── Step 3: Done ── */}
          {step === 'done' && (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>

              <p className="text-sm text-gray-500 leading-relaxed">
                {t('auth.resetPassword.doneMessage')}
              </p>

              <button
                onClick={() => router.push('/login')}
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition"
                style={{ background: 'var(--primary)' }}
              >
                {t('auth.resetPassword.goToLogin')}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#1DB1DB] border-t-transparent rounded-full animate-spin" /></div>}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
