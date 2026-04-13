'use client';
import { useRouter } from 'next/navigation';
import { useStore, UserRole } from '@/store/useStore';
import { Heart, Shield, Building2, Settings, Hospital, Stethoscope, Users } from 'lucide-react';

const roles = [
  { role: 'donor' as UserRole, label: 'Donor', sublabel: 'Create & manage milestone campaigns', icon: <Heart size={20} />, color: '#1DB1DB', href: '/dashboard', name: 'Jean-Pierre Mbarga', id: 'donor-001' },
  { role: 'contributor' as UserRole, label: 'Contributor', sublabel: 'Donate to existing campaigns', icon: <Users size={20} />, color: '#1D75DB', href: '/explore', name: 'Marie Nguemo', id: 'cont-001' },
  { role: 'social_worker' as UserRole, label: 'Social Worker', sublabel: 'Enroll & manage beneficiaries', icon: <Shield size={20} />, color: '#1D38DB', href: '/social-worker/dashboard', name: 'Alphonse Kamga', id: 'sw-001' },
  { role: 'receptionist' as UserRole, label: 'Receptionist', sublabel: 'Validate vouchers at hospital', icon: <Building2 size={20} />, color: '#1CDBC9', href: '/hospital/receptionist', name: 'Brigitte Talla', id: 'staff-001' },
  { role: 'nurse' as UserRole, label: 'Nurse', sublabel: 'Confirm PIN & release payments', icon: <Stethoscope size={20} />, color: '#1CDBC9', href: '/hospital/nurse', name: 'Nurse Emmanuel Manga', id: 'staff-002' },
  { role: 'hospital_admin' as UserRole, label: 'Hospital Admin', sublabel: 'Manage hospital operations & staff', icon: <Hospital size={20} />, color: '#471DDB', href: '/hospital-admin/dashboard', name: 'Dr. Mireille Ondoa', id: 'staff-003' },
  { role: 'admin' as UserRole, label: 'System Admin', sublabel: 'Full platform oversight & control', icon: <Settings size={20} />, color: '#471DDB', href: '/admin/dashboard', name: 'Admin JoyFund', id: 'admin-001' },
];

export default function LoginPage() {
  const router = useRouter();
  const { setRole, showToast } = useStore();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4" style={{ background: 'var(--primary)' }}>J</div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">JoyFund Portal Access</h1>
          <p className="text-gray-500 text-sm mt-2">Select your role to enter the correct portal</p>
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-amber-50 rounded-full text-amber-700 text-xs font-medium">
            ⚡ Demo Mode — no real authentication required
          </div>
        </div>

        <div className="space-y-2">
          {roles.map(r => (
            <button
              key={r.role}
              onClick={() => {
                setRole(r.role, { name: r.name, id: r.id });
                showToast(`Welcome, ${r.name}! ✅`, 'success');
                router.push(r.href);
              }}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 transition-transform duration-200 group-hover:scale-110" style={{ backgroundColor: r.color }}>
                {r.icon}
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#1A1A2E] text-sm">{r.label}</p>
                <p className="text-xs text-gray-500">{r.sublabel}</p>
              </div>
              <span className="text-gray-300 group-hover:text-gray-500 text-lg transition-colors">›</span>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          JoyFund v1.0 · Solidarity Health Bridge · Cameroon 🇨🇲
        </p>
      </div>
    </div>
  );
}
