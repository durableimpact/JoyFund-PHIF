'use client';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

export default function HospitalLogin() {
  const router = useRouter();
  const { setRole, showToast } = useStore();
  const login = (role: 'receptionist' | 'nurse') => {
    const names = { receptionist: 'Brigitte Talla', nurse: 'Nurse Emmanuel Manga' };
    const ids = { receptionist: 'staff-001', nurse: 'staff-002' };
    setRole(role, { name: names[role], id: ids[role] });
    showToast(`Signed in as ${names[role]}`, 'success');
    router.push(`/hospital/${role}`);
  };
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl" style={{ background: 'var(--secondary)' }}>🏥</div>
          <h1 className="text-xl font-black text-gray-900">Hospital Staff Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Centre Hospitalier d&apos;Essos</p>
        </div>
        <div className="card p-6 space-y-4">
          <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Staff ID</label><input className="input-field" defaultValue="REC-001" /></div>
          <div><label className="text-xs font-semibold text-gray-500 mb-1 block">PIN</label><input className="input-field" type="password" defaultValue="1234" /></div>
          <p className="text-xs text-gray-400 text-center">Select your role (demo)</p>
          <button className="btn-primary w-full" onClick={() => login('receptionist')}>Sign In as Receptionist</button>
          <button className="btn-secondary w-full" onClick={() => login('nurse')}>Sign In as Nurse</button>
        </div>
      </div>
    </div>
  );
}
