"use client";
import { useI18n } from '@/locales/client';
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Percent, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { listFeePolicies, createFeePolicy, updateFeePolicy, deleteFeePolicy } from "@/actions/payments";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeePoliciesPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", platform_fee_percentage: 0, escrow_fee_percentage: 0, is_active: true });
  const [error, setError] = useState("");

  const { data: policiesRes, isLoading } = useQuery({
    queryKey: ["fee-policies", token],
    queryFn: async () => await listFeePolicies(token),
    enabled: !!token,
  });
  const policies = policiesRes?.results ?? [];

  const createMut = useMutation({
    mutationFn: async () => await createFeePolicy(token, form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["fee-policies", token] }); setShowCreate(false); resetForm(); },
    onError: (e: any) => setError(e?.message || "Failed to create fee policy"),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => await updateFeePolicy(id, token, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["fee-policies", token] }); setEditingId(null); resetForm(); },
    onError: (e: any) => setError(e?.message || "Failed to update fee policy"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => await deleteFeePolicy(id, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fee-policies", token] }),
    onError: (e: any) => setError(e?.message || "Failed to delete fee policy"),
  });

  function resetForm() { setForm({ name: "", description: "", platform_fee_percentage: 0, escrow_fee_percentage: 0, is_active: true }); setError(""); }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Fee Policies</h1>
          <p className="text-gray-500 text-sm">Manage platform and escrow fee percentages</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-admin text-sm flex items-center gap-2" style={{ background: '#471DDB' }}>
          <Plus size={15} /> Add Policy
        </button>
      </div>

      {(showCreate || editingId !== null) && (
        <div className="card p-4 md:p-5 mb-6 border border-[#471DDB]/20">
          <h3 className="font-bold text-gray-900 mb-4">{editingId ? "Edit Fee Policy" : "New Fee Policy"}</h3>
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#471DDB]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#471DDB]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Platform Fee %</label>
              <input type="number" step="0.01" value={form.platform_fee_percentage} onChange={e => setForm(f => ({ ...f, platform_fee_percentage: parseFloat(e.target.value) || 0 }))}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#471DDB]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Escrow Fee %</label>
              <input type="number" step="0.01" value={form.escrow_fee_percentage} onChange={e => setForm(f => ({ ...f, escrow_fee_percentage: parseFloat(e.target.value) || 0 }))}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#471DDB]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active</label>
              <select value={String(form.is_active)} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === "true" }))}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#471DDB] bg-white">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => editingId ? updateMut.mutate({ id: editingId, data: form }) : createMut.mutate()}
              className="btn-admin text-sm px-4 py-2" style={{ background: '#471DDB' }}>
              {editingId ? "Update" : "Create"}
            </button>
            <button onClick={() => { setShowCreate(false); setEditingId(null); resetForm(); }}
              className="btn-admin text-sm px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
          </div>
        </div>
      )}

      <div className="card p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Skeleton className="h-6 w-6 rounded" /></div>
        ) : !policies.length ? (
          <p className="text-gray-400 text-sm text-center py-12">No fee policies configured yet</p>
        ) : (
          <>
            {/* Mobile: card layout */}
            <div className="md:hidden space-y-3">
              {policies.map((p) => (
                <div key={p.id} className="border border-gray-100 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500 font-medium">Name</span><span className="font-semibold text-gray-900">{p.name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Description</span><span className="text-gray-600 truncate max-w-[200px]">{p.description || "—"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Platform Fee</span><span className="font-semibold text-[#471DDB]">{p.platform_fee_percentage}%</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Escrow Fee</span><span className="font-semibold text-[#1DB1DB]">{p.escrow_fee_percentage}%</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.is_active ? "Active" : "Inactive"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Created</span><span className="text-gray-400 text-xs">{formatDate(p.created_at)}</span></div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => { setEditingId(p.id); setForm({ name: p.name, description: p.description, platform_fee_percentage: p.platform_fee_percentage, escrow_fee_percentage: p.escrow_fee_percentage, is_active: p.is_active }); setShowCreate(false); }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">Edit</button>
                    <button onClick={() => deleteMut.mutate(p.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">Delete</button>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["ID", "Name", "Description", "Platform Fee", "Escrow Fee", "Status", "Created", "Actions"].map(h => (
                      <th key={h} className="text-left pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {policies.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50">
                      <td className="py-3 text-gray-400 font-mono text-xs">{p.id}</td>
                      <td className="py-3 font-semibold text-gray-900">{p.name}</td>
                      <td className="py-3 text-gray-600 max-w-[180px] truncate">{p.description || "—"}</td>
                      <td className="py-3 font-semibold text-[#471DDB]">{p.platform_fee_percentage}%</td>
                      <td className="py-3 font-semibold text-[#1DB1DB]">{p.escrow_fee_percentage}%</td>
                      <td className="py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400 text-xs">{formatDate(p.created_at)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditingId(p.id); setForm({ name: p.name, description: p.description, platform_fee_percentage: p.platform_fee_percentage, escrow_fee_percentage: p.escrow_fee_percentage, is_active: p.is_active }); setShowCreate(false); }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => deleteMut.mutate(p.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
