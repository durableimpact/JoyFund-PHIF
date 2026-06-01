'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useStore, ROLE_HOME } from '@/store/useStore';

type HospitalRole = 'receptionist' | 'hospital_admin';

const ROLE_OPTIONS: { value: HospitalRole; label: string; desc: string }[] = [
  { value: 'hospital_admin', label: 'Hospital Admin',  desc: 'Manage hospital portal' },
  { value: 'receptionist',   label: 'Receptionist',    desc: 'Validate vouchers' },
];

export default function HospitalLoginPage() {
  const router = useRouter();
  const { login, showToast } = useStore();
  const [role, setRole]         = useState<HospitalRole>('receptionist');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Enter email and password'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invalid credentials'); return; }

      login(data); // { access, refresh, user }
      showToast(`Welcome, ${data.user.name}!`, 'success');
      router.push(ROLE_HOME[data.user.role as keyof typeof ROLE_HOME] || '/hospital/receptionist');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white" style={{ background: '#1D75DB' }}>
            <Building2 size={28} />
          </div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">Hospital Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to access your hospital dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="card p-8 space-y-5">

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Role selector */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Select Your Role</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${role === r.value ? 'text-white' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  style={role === r.value ? { background: '#1D75DB', borderColor: '#1D75DB' } : {}}
                >
                  <div className={`font-bold text-sm ${role === r.value ? 'text-white' : 'text-gray-900'}`}>{r.label}</div>
                  <div className={`text-xs mt-0.5 ${role === r.value ? 'text-white/75' : 'text-gray-500'}`}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-[#1A1A2E] mb-1.5 block">Email address</label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="you@hospital.cm"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#1A1A2E] mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                className="input-field pr-11"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
            style={{ background: '#1D75DB' }}
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : 'Sign In to Hospital Portal'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Not hospital staff?{' '}
            <a href="/login" className="font-semibold" style={{ color: '#1D75DB' }}>Main login</a>
          </p>
        </form>

      </div>
    </div>
  );
}
