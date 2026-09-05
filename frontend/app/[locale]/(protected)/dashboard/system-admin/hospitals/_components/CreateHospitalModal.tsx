'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, AlertCircle, MapPin } from 'lucide-react';
import { createHospital } from '@/actions/hospital';
import { getErrorMessage } from '@/lib/errors';

const LocationPickerMap = dynamic(() => import('@/components/shared/LocationPickerMap'), {
  ssr: false,
  loading: () => <div className="w-full rounded-xl bg-gray-100 animate-pulse flex items-center justify-center" style={{ height: 280 }}>
    <MapPin size={24} className="text-gray-300" />
  </div>,
});

const CAMEROON_REGIONS = ['Adamawa','Centre','East','Far North','Littoral','North','North West','South','South West','West'];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateHospitalModal({ open, onClose }: Props) {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [accreditationNumber, setAccreditationNumber] = useState('');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
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

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
      },
      () => {
        setError('Unable to retrieve your location');
      }
    );
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createHospital(token, {
        name,
        accreditation_number: accreditationNumber,
        licence_number: licenceNumber,
        region,
        city,
        address,
        phone_number: phoneNumber,
        email,
        website: website || undefined,
        momo_number: momoNumber || undefined,
        momo_name: momoName || undefined,
        orange_number: orangeNumber || undefined,
        orange_name: orangeName || undefined,
        bank_account_number: bankAccountNumber || undefined,
        bank_account_name: bankAccountName || undefined,
        bank_name: bankName || undefined,
        bank_branch: bankBranch || undefined,
        lat: lat || undefined,
        lng: lng || undefined,
        partnership_status: 'PENDING',
        is_active: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      resetForm();
      onClose();
    },
    onError: (err: any) => {
      setError(getErrorMessage(err, 'Failed to create hospital'));
    },
  });

  const resetForm = () => {
    setName(''); setAccreditationNumber(''); setLicenceNumber('');
    setRegion(''); setCity(''); setAddress('');
    setPhoneNumber(''); setEmail(''); setWebsite('');
    setMomoNumber(''); setMomoName(''); setOrangeNumber(''); setOrangeName('');
    setBankAccountNumber(''); setBankAccountName(''); setBankName(''); setBankBranch('');
    setLat(null); setLng(null);
    setError('');
  };

  const handleSubmit = () => {
    if (!name || !accreditationNumber || !licenceNumber || !region || !city || !address || !phoneNumber || !email) {
      setError('Please fill in all required fields (Name, Accreditation, Licence, Region, City, Address, Phone, Email)');
      return;
    }
    setError('');
    createMutation.mutate();
  };

  if (!open) return null;

  const selectedCoords: [number, number] | null = lat !== null && lng !== null ? [lat, lng] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">Add Hospital</h2>
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
              <input className="input-field" placeholder="e.g. Central Hospital" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Region *</label>
              <select className="input-field" value={region} onChange={e => setRegion(e.target.value)}>
                <option value="">— Select —</option>
                {CAMEROON_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">City *</label>
            <input className="input-field" placeholder="e.g. Yaoundé" value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Address *</label>
            <input className="input-field" placeholder="Street address" value={address} onChange={e => setAddress(e.target.value)} />
          </div>

          {/* Location picker */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-500">Location (click map or use GPS)</label>
              <button 
                type="button"
                onClick={handleGeolocation}
                className="text-[10px] text-blue-600 hover:underline"
              >
                Use current location
              </button>
            </div>
            <LocationPickerMap value={selectedCoords} onChange={(newLat, newLng) => { setLat(newLat); setLng(newLng); }} />
            
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 mb-0.5 block">Latitude</label>
                <input 
                  className="input-field text-[10px]" 
                  type="number"
                  step="any"
                  placeholder="e.g. 3.848" 
                  value={lat ?? ''} 
                  onChange={e => setLat(e.target.value ? parseFloat(e.target.value) : null)} 
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 mb-0.5 block">Longitude</label>
                <input 
                  className="input-field text-[10px]" 
                  type="number"
                  step="any"
                  placeholder="e.g. 11.502" 
                  value={lng ?? ''} 
                  onChange={e => setLng(e.target.value ? parseFloat(e.target.value) : null)} 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Accreditation # *</label>
              <input className="input-field" placeholder="e.g. ACC-2024-001" value={accreditationNumber} onChange={e => setAccreditationNumber(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Licence # *</label>
              <input className="input-field" placeholder="e.g. LIC-2024-001" value={licenceNumber} onChange={e => setLicenceNumber(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Phone *</label>
              <input className="input-field" placeholder="+237 6XX XXX XXX" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Email *</label>
              <input className="input-field" type="email" placeholder="hospital@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Website</label>
            <input className="input-field" placeholder="https://hospital.com" value={website} onChange={e => setWebsite(e.target.value)} />
          </div>

          <div className="border-t border-gray-100 pt-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Payment Details (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">MoMo Number</label>
                <input className="input-field" placeholder="+237 6XX XXX XXX" value={momoNumber} onChange={e => setMomoNumber(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">MoMo Name</label>
                <input className="input-field" placeholder="Account holder" value={momoName} onChange={e => setMomoName(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Orange Number</label>
                <input className="input-field" placeholder="+237 6XX XXX XXX" value={orangeNumber} onChange={e => setOrangeNumber(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Orange Name</label>
                <input className="input-field" placeholder="Account holder" value={orangeName} onChange={e => setOrangeName(e.target.value)} />
              </div>
            </div>
            <div className="mt-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Bank Account #</label>
              <input className="input-field" placeholder="Account number" value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Bank Account Name</label>
                <input className="input-field" placeholder="Account holder" value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Bank Name</label>
                <input className="input-field" placeholder="e.g. Afriland" value={bankName} onChange={e => setBankName(e.target.value)} />
              </div>
            </div>
            <div className="mt-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Bank Branch</label>
              <input className="input-field" placeholder="Branch location" value={bankBranch} onChange={e => setBankBranch(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button className="btn-outline flex-1" onClick={onClose}>Cancel</button>
          <button
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60"
            style={{ background: '#471DDB' }}
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating…' : 'Create Hospital'}
          </button>
        </div>
      </div>
    </div>
  );
}
