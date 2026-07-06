"use client";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Globe, Loader2, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { listGateways, createGateway, updateGateway, deleteGateway } from "@/actions/payments";
import { Skeleton } from "@/components/ui/skeleton";

export default function GatewaysPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", is_active: true });
  const [error, setError] = useState("");

  const { data: gatewaysRes, isLoading } = useQuery({
    queryKey: ["gateways", token],
    queryFn: async () => await listGateways(token),
    enabled: !!token,
  });
  const gateways = gatewaysRes?.results ?? [];

  const createMut = useMutation({
    mutationFn: async () => await createGateway(token, form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["gateways", token] }); setShowCreate(false); resetForm(); },
    onError: (e: any) => setError(e?.message || "Failed to create gateway"),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => await updateGateway(id, token, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["gateways", token] }); setEditingId(null); resetForm(); },
    onError: (e: any) => setError(e?.message || "Failed to update gateway"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => await deleteGateway(id, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gateways", token] }),
    onError: (e: any) => setError(e?.message || "Failed to delete gateway"),
  });

  function resetForm() { setForm({ name: "", description: "", is_active: true }); setError(""); }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Payment Gateways</h1>
          <p className="text-gray-500 text-sm">Manage payment gateway integrations</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-admin text-sm flex items-center gap-2" style={{ background: '#471DDB' }}>
          <Plus size={15} /> Add Gateway
        </button>
      </div>

      {/* Create / Edit Form */}
      {(showCreate || editingId !== null) && (
        <div className="card p-4 md:p-5 mb-6 border border-[#471DDB]/20">
          <h3 className="font-bold text-gray-900 mb-4">{editingId ? "Edit Gateway" : "New Gateway"}</h3>
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
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
        ) : !gateways.length ? (
          <p className="text-gray-400 text-sm text-center py-12">No gateways configured yet</p>
        ) : (
          <>
            {/* Mobile: card layout */}
            <div className="md:hidden space-y-3">
              {gateways.map((g) => (
                <div key={g.id} className="border border-gray-100 rounded-xl p-4 space-y-2 cursor-pointer hover:border-[#471DDB]/30 transition-colors" onClick={() => window.location.href = `/dashboard/system-admin/gateways/${g.id}`}>
                  <div className="flex justify-between text-sm"><span className="text-gray-500 font-medium">Name</span><span className="font-semibold text-gray-900">{g.name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Description</span><span className="text-gray-600 truncate max-w-[180px]">{g.description || "—"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${g.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{g.is_active ? "Active" : "Inactive"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Created</span><span className="text-gray-400 text-xs">{formatDate(g.created_at)}</span></div>
                  <div className="flex justify-end gap-2 pt-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditingId(g.id); setForm({ name: g.name, description: g.description, is_active: g.is_active }); setShowCreate(false); }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">Edit</button>
                    <button onClick={() => deleteMut.mutate(g.id)}
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
                    {["ID", "Name", "Description", "Status", "Created", "Actions"].map(h => (
                      <th key={h} className="text-left pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gateways.map((g) => (
                    <tr key={g.id} className="border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => window.location.href = `/dashboard/system-admin/gateways/${g.id}`}>
                      <td className="py-3 text-gray-400 font-mono text-xs">{g.id}</td>
                      <td className="py-3 font-semibold text-gray-900">{g.name}</td>
                      <td className="py-3 text-gray-600 max-w-[200px] truncate">{g.description}</td>
                      <td className="py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${g.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {g.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400 text-xs">{formatDate(g.created_at)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => { setEditingId(g.id); setForm({ name: g.name, description: g.description, is_active: g.is_active }); setShowCreate(false); }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => deleteMut.mutate(g.id)}
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
