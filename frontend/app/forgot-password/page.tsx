'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Heart, Loader2, ArrowLeft, Mail } from 'lucide-react';

type Step = 'form' | 'sent';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Django returns 200 even if email doesn't exist (security best practice)
      // so we always move to the "sent" step
      if (res.ok || res.status === 400) {
        setStep('sent');
      } else {
        const data = await res.json();
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
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
            {step === 'form' ? 'Forgot your password?' : 'Check your inbox'}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {step === 'form'
              ? "Enter your email and we'll send you a reset code."
              : `We sent a 6-digit code to ${email}`}
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
                  Email address
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
                  ? <><Loader2 size={16} className="animate-spin" /> Sending...</>
                  : 'Send Reset Code'}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
              >
                <ArrowLeft size={14} /> Back to Sign In
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
                If an account exists for{' '}
                <span className="font-semibold text-[#1A1A2E]">{email}</span>,
                you will receive a 6-digit code shortly. Check your spam folder
                if it doesn't arrive within a few minutes.
              </p>

              <Link
                href={`/reset-password?email=${encodeURIComponent(email)}`}
                className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center transition"
                style={{ background: 'var(--primary)' }}
              >
                Enter Reset Code
              </Link>

              <button
                onClick={() => { setStep('form'); setError(''); }}
                className="text-sm text-gray-500 hover:text-gray-700 transition underline underline-offset-2"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          JoyFund v1.0 · Solidarity Health Bridge · Cameroon 🇨🇲
        </p>
      </div>
    </div>
  );
}