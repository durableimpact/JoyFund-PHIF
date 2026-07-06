'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Pencil, Search, Trash2 } from 'lucide-react';
import { listServices, createService, updateService, deleteService } from '@/actions/hospital';
import { useI18n } from '@/locales/client';

const CATEGORIES: ServiceCategory[] = [
  'GENERAL', 'MATERNITY', 'PEDIATRIC', 'LAB', 'IMAGING',
  'PHARMACY', 'SURGERY', 'EMERGENCY', 'CHRONIC',
  'VACCINATION', 'DENTAL', 'OTHER',
];

const categoryColors: Record<string, string> = {
  GENERAL: 'bg-gray-100 text-gray-700',
  MATERNITY: 'bg-pink-100 text-pink-700',
  PEDIATRIC: 'bg-blue-100 text-blue-700',
  LAB: 'bg-amber-100 text-amber-700',
  IMAGING: 'bg-indigo-100 text-indigo-700',
  PHARMACY: 'bg-green-100 text-green-700',
  SURGERY: 'bg-red-100 text-red-700',
  EMERGENCY: 'bg-orange-100 text-orange-700',
  CHRONIC: 'bg-purple-100 text-purple-700',
  VACCINATION: 'bg-teal-100 text-teal-700',
  DENTAL: 'bg-cyan-100 text-cyan-700',
  OTHER: 'bg-gray-100 text-gray-600',
};

const emptyForm: { name: string; category: ServiceCategory; price: string; is_available: boolean; description: string } = {
  name: '', category: 'GENERAL', price: '', is_available: true, description: '',
};

export default function HospitalServices() {
  const t = useI18n();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const currentUser = (session?.user as any)?.userInfo;
  const hospitalId = currentUser?.hospital?.id;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['ha-services', hospitalId, token],
    queryFn: async () => {
      const res = await listServices(hospitalId!, token);
      return res || [];
    },
    enabled: !!token && !!hospitalId,
  });

  const services: Service[] = Array.isArray(servicesData) ? servicesData : servicesData?.results ?? [];

  const filtered = services.filter(
    s => s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (svc: Service) => {
    setEditingId(svc.id);
    setForm({
      name: svc.name,
      category: svc.category,
      price: String(svc.price),
      is_available: svc.is_available,
      description: svc.description || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      return createService(hospitalId!, token, {
        name: form.name,
        category: form.category,
        price: parseFloat(form.price) || 0,
        is_available: form.is_available,
        description: form.description || undefined,
      });
    },
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['ha-services'] });
      queryClient.invalidateQueries({ queryKey: ['rec-services'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      return updateService(hospitalId!, editingId!, token, {
        name: form.name,
        category: form.category,
        price: parseFloat(form.price) || 0,
        is_available: form.is_available,
        description: form.description || undefined,
      });
    },
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['ha-services'] });
      queryClient.invalidateQueries({ queryKey: ['rec-services'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteService(hospitalId!, id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ha-services'] });
      queryClient.invalidateQueries({ queryKey: ['rec-services'] });
    },
  });

  const handleSubmit = () => {
    if (!form.name || !form.price) return;
    setSubmitting(true);
    const mutation = editingId ? updateMutation : createMutation;
    mutation.mutate(undefined, { onSettled: () => setSubmitting(false) });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{t('hospitalAdmin.services.title')}</h1>
          <p className="text-gray-500 text-sm">{t('hospitalAdmin.services.count', { count: services.length })}</p>
        </div>
        <button onClick={openAdd} className="btn-admin text-sm flex items-center gap-2" style={{ background: '#1D75DB' }}>
          <Plus size={16} /> {t('hospitalAdmin.services.addButton')}
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-field pl-9"
              placeholder={t('hospitalAdmin.services.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {[t('hospitalAdmin.services.colService'), t('hospitalAdmin.services.colCategory'), t('hospitalAdmin.services.colPrice'), t('hospitalAdmin.services.colStatus'), t('hospitalAdmin.services.colActions')].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(5)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-gray-400 text-sm">
                  {services.length === 0 ? t('hospitalAdmin.services.noServices') : t('hospitalAdmin.services.noSearchResults')}
                </td></tr>
              ) : filtered.map(svc => (
                <tr key={svc.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4">
                    <div>
                      <span className="font-semibold text-gray-900">{svc.name}</span>
                      {svc.description && (
                        <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{svc.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`badge text-xs ${categoryColors[svc.category] || 'bg-gray-100 text-gray-600'}`}>
                      {svc.category}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-gray-900">
                    {Number(svc.price).toLocaleString()} XAF
                  </td>
                  <td className="p-4">
                    {svc.is_available ? (
                      <span className="badge bg-green-100 text-green-700 text-xs">{t('hospitalAdmin.services.available')}</span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-500 text-xs">{t('hospitalAdmin.services.unavailable')}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(svc)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors" title={t('hospitalAdmin.services.edit')}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => { if (confirm(t('hospitalAdmin.services.confirmDelete'))) deleteMutation.mutate(svc.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title={t('hospitalAdmin.services.delete')}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 my-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">{editingId ? t('hospitalAdmin.services.editTitle') : t('hospitalAdmin.services.addTitle')}</h2>
              <button onClick={closeModal}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('hospitalAdmin.services.serviceNameLabel')}</label>
                <input className="input-field" placeholder={t('hospitalAdmin.services.serviceNamePlaceholder')} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('hospitalAdmin.services.categoryLabel')}</label>
                <select className="input-field" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as ServiceCategory }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('hospitalAdmin.services.priceLabel')}</label>
                <input className="input-field" type="number" min="0" step="100" placeholder={t('hospitalAdmin.services.pricePlaceholder')} value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('hospitalAdmin.services.descriptionLabel')}</label>
                <textarea className="input-field" rows={3} placeholder={t('hospitalAdmin.services.descriptionPlaceholder')} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="available" className="rounded border-gray-300" checked={form.is_available} onChange={e => setForm(p => ({ ...p, is_available: e.target.checked }))} />
                <label htmlFor="available" className="text-sm text-gray-700">{t('hospitalAdmin.services.availableForBooking')}</label>
              </div>
            </div>
            {(createMutation.isError || updateMutation.isError) && (
              <p className="text-red-500 text-xs mt-3">{(createMutation.error || updateMutation.error as any)?.message || t('hospitalAdmin.services.failedToSave')}</p>
            )}
            <div className="flex gap-3 mt-5">
              <button className="btn-outline flex-1" onClick={closeModal}>{t('hospitalAdmin.services.cancel')}</button>
              <button className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60" style={{ background: '#1D75DB' }} onClick={handleSubmit} disabled={submitting || !form.name || !form.price}>
                {submitting ? t('hospitalAdmin.services.saving') : editingId ? t('hospitalAdmin.services.updateButton') : t('hospitalAdmin.services.addButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
