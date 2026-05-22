'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { DJANGO_API_URL, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET } from '@/lib/apiClient';

type HospitalRole = 'receptionist' | 'nurse' | 'hospital_admin';

const ROLE_OPTIONS: { value: HospitalRole; label: string; route: string }[] = [
  { value: 'hospital_admin', label: 'Hospital Admin', route: '/hospital-admin/dashboard' },
  { value: 'receptionist', label: 'Receptionist', route: '/hospital/receptionist' },
  { value: 'nurse', label: 'Nurse / Midwife', route: '/hospital/nurse' },
];

export default function HospitalLoginPage() {
  const router = useRouter();
  const { setCurrentUser, setAccessToken, setRefreshToken, showToast } = useStore();
  const [role, setRole] = useState<HospitalRole>('receptionist');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { showToast('Enter email and password', 'error'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${DJANGO_API_URL}/auth/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'password',
          username: email,
          password,
          client_id: OAUTH_CLIENT_ID,
          client_secret: OAUTH_CLIENT_SECRET,
        }).toString(),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error_description || 'Invalid credentials'); }
      const data = await res.json();
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setCurrentUser({ id: data.user_id || '', name: data.username || email, email, role });
      showToast('Welcome back!', 'success');
      router.push(ROLE_OPTIONS.find(r => r.value === role)?.route || '/hospital/receptionist');
    } catch (e: any) {
      showToast(e?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white" style={{ background: '#1D75DB' }}>
            <Building2 size={28} />
          </div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">Hospital Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to access your hospital dashboard</p>
        </div>

        <div className="card p-6 space-y-5">
          {/* Role selector */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Your Role</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_OPTIONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all ${role === r.value ? 'text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  style={role === r.value ? { background: '#1D75DB', borderColor: '#1D75DB' } : {}}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="you@hospital.cm"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Password</label>
            <div className="relative">
              <input
                className="input-field pr-10"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-opacity"
            style={{ background: '#1D75DB' }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In to Hospital Portal'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Not a hospital staff member?{' '}
          <a href="/login" className="font-semibold" style={{ color: '#1D75DB' }}>Go to main login</a>
        </p>
      </div>
    </div>
  );
}
