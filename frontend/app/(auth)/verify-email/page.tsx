'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { resendVerificationEmail, verifyEmail } from '@/actions/accounts';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { CheckCircle2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Get stored email and password from session storage
  useEffect(() => {
    const storedEmail = sessionStorage.getItem('temp_email');
    if (!storedEmail) {
      setError('Email not found. Please register again.');
      return;
    }
    setEmail(storedEmail);
  }, []);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    setResendError('');
    setResendSuccess(false);
    setResendLoading(true);

    try {
      await resendVerificationEmail(email);
      setResendSuccess(true);
      setResendCooldown(60); // 60 second cooldown

      // Clear success message after 3 seconds
      setTimeout(() => {
        setResendSuccess(false);
      }, 3000);
    } catch (err) {
      const errorData = typeof err === 'string' ? JSON.parse(err) : err;
      console.error('[resend verification error]', errorData);

      const errorMessage =
        errorData?.detail ||
        errorData?.message ||
        'Failed to resend verification code. Please try again.';

      setResendError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);

    try {
      // Verify the email with the code
      await verifyEmail({
        code: code,
        email: email,
      });

      setSuccess(true);

      // Get stored credentials
      const storedPassword = sessionStorage.getItem('temp_password');

      if (!storedPassword) {
        setError('Password not found. Please log in manually.');
        setTimeout(() => {
          sessionStorage.removeItem('temp_email');
          router.push('/login');
        }, 2000);
        return;
      }

      // Auto-login after verification
      const result = await signIn('credentials', {
        email: email,
        password: storedPassword,
        redirect: false,
      });

      if (result?.ok) {
        // Clear temporary storage
        sessionStorage.removeItem('temp_email');
        sessionStorage.removeItem('temp_password');
        
        // Redirect to dashboard
        router.push('/dashboard/donor');
      } else {
        setError('Login failed. Please try logging in manually.');
        setTimeout(() => {
          sessionStorage.removeItem('temp_email');
          sessionStorage.removeItem('temp_password');
          router.push('/login');
        }, 2000);
      }

    } catch (err) {
      const errorData = typeof err === 'string' ? JSON.parse(err) : err;
      console.error('[verify email error]', errorData);
      
      const errorMessage = 
        errorData?.detail ||
        errorData?.message ||
        'Verification failed. Please check your code and try again.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4" style={{ background: 'var(--primary)' }}>
            ✓
          </div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">Verify your email</h1>
          <p className="text-gray-500 text-sm mt-2">
            We've sent a 6-digit code to<br/>
            <span className="font-semibold text-gray-700">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 flex gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-100 text-green-600 text-sm rounded-xl px-4 py-3 flex gap-2">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <span>Email verified! Logging you in...</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-4">Enter verification code</label>
            <InputOTP 
              maxLength={6} 
              value={code} 
              onChange={setCode}
              disabled={loading}
              containerClassName="justify-center gap-3"
            >
              <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {resendError && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 flex gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{resendError}</span>
            </div>
          )}

          {resendSuccess && (
            <div className="bg-green-50 border border-green-100 text-green-600 text-sm rounded-xl px-4 py-3 flex gap-2">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <span>Verification code sent! Check your email.</span>
            </div>
          )}

          <div className="flex gap-2">
            <button 
              type="submit" 
              disabled={loading || code.length !== 6}
              className="flex-1 py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
              style={{ background: 'var(--primary)' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> 
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>

            <button 
              type="button"
              onClick={handleResend}
              disabled={resendLoading || resendCooldown > 0 || loading}
              className="px-4 py-3 rounded-xl font-semibold text-sm border border-gray-200 flex items-center justify-center gap-2 transition-colors hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              title={resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            >
              {resendLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <RefreshCw size={16} />
                  {resendCooldown > 0 ? `${resendCooldown}s` : 'Resend'}
                </>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Didn't receive a code? Click the Resend button above or check your spam folder.
          </p>
        </form>

      </div>
    </div>
  );
}