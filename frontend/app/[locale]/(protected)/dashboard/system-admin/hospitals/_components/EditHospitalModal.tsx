'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, AlertCircle, MapPin } from 'lucide-react';
import { updateHospital } from '@/actions/hospital';

const LocationPickerMap = dynamic(() => import('@/components/shared/LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-xl bg-gray-100 animate-pulse flex items-center justify-center" style={{ height: 280 }}>
      <MapPin size={24} className="text-gray-300" />
    </div>
  ),
});

const CAMEROON_REGIONS = ['Adamawa','Centre','East','Far North','Littoral','North','North West','South','South West','West'];
const PARTNERSHIP_STATUSES = ['PENDING','ACTIVE','INACTIVE','REJECTED'] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  hospital: Hospital;
}

export default function EditHospitalModal({ open, onClose, hospital }: Props) {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState('');
  const [accreditationNumber, setAccreditationNumber] = useState('');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [partnershipStatus, setPartnershipStatus] = useState<PartnershipStatus>('PENDING');
  const [isActive, setIsActive] = useState(true);
  const [momoNumber, setMomoNumber] = useState('');
  const [momoName, setMomoName] = useState('');
  const [orangeNumber, setOrangeNumber] = useState('');
  const [orangeName, setOrangeName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Seed form from hospital prop
  useEffect(() => {
    if (hospital) {
      setName(hospital.name || '');
      setAccreditationNumber(hospital.accreditation_number || '');
      setLicenceNumber(hospital.licence_number || '');
      setRegion(hospital.region || '');
      setCity(hospital.city || '');
      setAddress(hospital.address || '');
      setPhoneNumber(hospital.phone_number || '');
      setEmail(hospital.email || '');
      setWebsite(hospital.website || '');
      setPartnershipStatus(hospital.partnership_status || 'PENDING');
      setIsActive(hospital.is_active ?? true);
      setMomoNumber(hospital.momo_number || '');
      setMomoName(hospital.momo_name || '');
      setOrangeNumber(hospital.orange_number || '');
      setOrangeName(hospital.orange_name || '');
      setBankAccountNumber(hospital.bank_account_number || '');
      setBankAccountName(hospital.bank_account_name || '');
      setBankName(hospital.bank_name || '');
      setBankBranch(hospital.bank_branch || '');
      setLat(hospital.lat ?? null);
      setLng(hospital.lng ?? null);
    }
  }, [hospital]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateHospital(hospital.id, token, {
        name,
        accreditation_number: accreditationNumber,
        licence_number: licenceNumber,
        region,
        city,
        address,
        phone_number: phoneNumber,
        email,
        website: website || undefined,
        partnership_status: partnershipStatus,
        is_active: isActive,
        momo_number: momoNumber || undefined,
        momo_name: momoName || undefined,
        orange_number: orangeNumber || undefined,
        orange_name: orangeName || undefined,
        bank_account_number: bankAccountNumber || undefined,
        bank_account_name: bankAccountName || undefined,
        bank_name: bankName || undefined,
        bank_branch: bankBranch || undefined,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital', hospital.id, token] });
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      setSaved(true);
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to update hospital';
      try {
        const parsed = JSON.parse(err?.toString?.() || '{}');
        setError(parsed.detail || parsed.name?.[0] || msg);
      } catch {
        setError(msg);
      }
    },
  });

  const handleSubmit = () => {
    if (!name || !accreditationNumber || !licenceNumber || !region || !city || !address || !phoneNumber || !email) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    updateMutation.mutate();
  };

  if (!open) return null;

  const selectedCoords: [number, number] | null = lat !== null && lng !== null ? [lat, lng] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-auto">
        {saved ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">Hospital Updated</h3>
            <p className="text-sm text-gray-500 mb-5">{name} has been updated successfully.</p>
            <button className="btn-admin w-full text-sm py-2.5" style={{ background: '#471DDB' }} onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">Edit Hospital</h2>
              <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-start">
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Name *</label>
                  <input className="input-field" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Region *</label>
                  <select className="input-field" value={region} onChange={e => setRegion(e.target.value)}>
                    <option value="">— Select —</option>
                    {CAMEROON_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">City *</label>
                  <input className="input-field" value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Status *</label>
                  <select className="input-field" value={partnershipStatus} onChange={e => setPartnershipStatus(e.target.value as PartnershipStatus)}>
                    {PARTNERSHIP_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Address *</label>
                <input className="input-field" value={address} onChange={e => setAddress(e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Location (click map to set)</label>
                <LocationPickerMap value={selectedCoords} onChange={(newLat, newLng) => { setLat(newLat); setLng(newLng); }} />
                {selectedCoords && (
                  <p className="text-[10px] text-gray-400 mt-1 font-mono">
                    {selectedCoords[0].toFixed(6)}, {selectedCoords[1].toFixed(6)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Accreditation # *</label>
                  <input className="input-field" value={accreditationNumber} onChange={e => setAccreditationNumber(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Licence # *</label>
                  <input className="input-field" value={licenceNumber} onChange={e => setLicenceNumber(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Phone *</label>
                  <input className="input-field" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Email *</label>
                  <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Website</label>
                <input className="input-field" value={website} onChange={e => setWebsite(e.target.value)} />
              </div>

              <div className="flex items-center gap-3 py-1">
                <label className="text-xs font-semibold text-gray-500">Active</label>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>

              <div className="border-t border-gray-100 pt-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Payment Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">MoMo Number</label>
                    <input className="input-field" value={momoNumber} onChange={e => setMomoNumber(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">MoMo Name</label>
                    <input className="input-field" value={momoName} onChange={e => setMomoName(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Orange Number</label>
                    <input className="input-field" value={orangeNumber} onChange={e => setOrangeNumber(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Orange Name</label>
                    <input className="input-field" value={orangeName} onChange={e => setOrangeName(e.target.value)} />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Bank Account #</label>
                  <input className="input-field" value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Bank Account Name</label>
                    <input className="input-field" value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Bank Name</label>
                    <input className="input-field" value={bankName} onChange={e => setBankName(e.target.value)} />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Bank Branch</label>
                  <input className="input-field" value={bankBranch} onChange={e => setBankBranch(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button className="btn-outline flex-1" onClick={onClose}>Cancel</button>
              <button
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                style={{ background: '#471DDB' }}
                onClick={handleSubmit}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
