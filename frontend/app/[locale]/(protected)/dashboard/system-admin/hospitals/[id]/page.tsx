"use client";
import { useI18n } from '@/locales/client';
import { ArrowLeft, CreditCard, Pencil, Users, Stethoscope } from "lucide-react";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import {
  getHospital,
  getHospitalStaff,
  getHospitalReceptionists,
  updateHospital,
} from "@/actions/hospital";
import { statusColor, formatDate, formatXAF } from "@/lib/utils";

type StaffTab = "admins" | "receptionists" | "all";

const PARTNERSHIP_STATUSES = ["PENDING", "ACTIVE", "INACTIVE", "REJECTED"] as const;

export default function HospitalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const token =
    session?.accessToken ||
    (session?.user as { accessToken?: string })?.accessToken;
  const [staffTab, setStaffTab] = useState<StaffTab>("all");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const queryClient = useQueryClient();

  const { data: hospital, isLoading } = useQuery<Hospital>({
    queryKey: ["hospital", id, token],
    queryFn: () => getHospital(id, token),
    enabled: !!token && !!id,
  });

  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ["hospital-staff", id, token],
    queryFn: () => getHospitalStaff(id, token),
    enabled: !!token && !!id,
  });

  useQuery({
    queryKey: ["hospital-receptionists", id, token],
    queryFn: () => getHospitalReceptionists(id, token),
    enabled: !!token && !!id,
  });

  const staff: StaffMember[] =
    (staffData as { results?: StaffMember[] })?.results ||
    (Array.isArray(staffData) ? staffData : []);

  if (isLoading) {
    return (
      <>
        <div className="space-y-4">
          <div className="h-8 bg-gray-100 rounded w-48 animate-pulse" />
          <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
        </div>
      </>
    );
  }

  if (!hospital) {
    return (
      <div className="text-center py-16 text-gray-400">Hospital not found.</div>
    );
  }

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === hospital.partnership_status || !token) return;
    setUpdatingStatus(true);
    try {
      await updateHospital(hospital.id, token, { partnership_status: newStatus as any });
      queryClient.invalidateQueries({ queryKey: ["hospital", id] });
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      toast.success(`Status changed to ${newStatus.replace(/_/g, " ").toLowerCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleActiveToggle = async () => {
    if (!token) return;
    const newActive = !hospital.is_active;
    setUpdatingStatus(true);
    try {
      await updateHospital(hospital.id, token, { is_active: newActive });
      queryClient.invalidateQueries({ queryKey: ["hospital", id] });
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      toast.success(`Hospital ${newActive ? "activated" : "deactivated"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const displayStaff =
    staffTab === "all"
      ? staff
      : staffTab === "admins"
        ? staff.filter(
            (s) =>
              (s as StaffMember & { role?: string }).role === "hospital_admin",
          )
        : staff.filter(
            (s) =>
              (s as StaffMember & { role?: string }).role === "receptionist",
          );

  return (
    <div className="pb-12">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm font-semibold"
      >
        <ArrowLeft size={16} /> Back to Hospitals
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            {hospital.name}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {hospital.city}, {hospital.region}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/system-admin/hospitals/${id}/edit`}
            className="btn-admin text-sm flex items-center gap-2"
            style={{ background: "#471DDB" }}
          >
            <Pencil size={16} /> Edit Hospital
          </Link>
        </div>
      </div>

      {/* Status Management Bar */}
      <div className="card p-4 mb-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Partnership</span>
          <select
            value={hospital.partnership_status || "PENDING"}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updatingStatus}
            className="text-xs font-bold px-3 py-2 rounded-xl border cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
            style={{
              background: hospital.partnership_status === "ACTIVE" ? "#dcfce7" : hospital.partnership_status === "PENDING" ? "#fef9c3" : hospital.partnership_status === "REJECTED" ? "#fee2e2" : "#f3f4f6",
              color: hospital.partnership_status === "ACTIVE" ? "#166534" : hospital.partnership_status === "PENDING" ? "#854d0e" : hospital.partnership_status === "REJECTED" ? "#991b1b" : "#6b7280",
              borderColor: hospital.partnership_status === "ACTIVE" ? "#bbf7d0" : hospital.partnership_status === "PENDING" ? "#fef08a" : hospital.partnership_status === "REJECTED" ? "#fecaca" : "#e5e7eb",
            }}
          >
            {PARTNERSHIP_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        <div className="h-4 w-px bg-gray-200 hidden sm:block" />
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Active</span>
          <button
            type="button"
            role="switch"
            aria-checked={hospital.is_active}
            onClick={handleActiveToggle}
            disabled={updatingStatus}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${
              hospital.is_active ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                hospital.is_active ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-xs font-semibold text-gray-600">
            {hospital.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Hospital info */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
              Hospital Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Detail label="Name" value={hospital.name} />
              <Detail
                label="Status"
                value={
                  <span
                    className={`badge ${statusColor(hospital.partnership_status)}`}
                  >
                    {hospital.partnership_status?.replace(/_/g, " ")}
                  </span>
                }
              />
              <Detail
                label="Accreditation #"
                value={hospital.accreditation_number}
                mono
              />
              <Detail label="Licence #" value={hospital.licence_number} mono />
              <Detail label="Region" value={hospital.region} />
              <Detail label="City" value={hospital.city} />
              <Detail label="Phone" value={hospital.phone_number} />
              <Detail label="Email" value={hospital.email} />
              {hospital.website && (
                <Detail
                  label="Website"
                  value={hospital.website}
                  className="col-span-2"
                />
              )}
              <Detail
                label="Address"
                value={hospital.address}
                className="col-span-2"
              />
              <Detail label="Created" value={formatDate(hospital.created_at)} />
              <Detail label="Updated" value={formatDate(hospital.updated_at)} />
            </div>
          </div>

          {/* Payment Details */}
          <div className="card p-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <CreditCard size={14} /> Payment Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {hospital.momo_number && (
                <>
                  <Detail
                    label="MoMo Number"
                    value={hospital.momo_number}
                    mono
                  />
                  <Detail label="MoMo Name" value={hospital.momo_name || "—"} />
                </>
              )}
              {hospital.orange_number && (
                <>
                  <Detail
                    label="Orange Number"
                    value={hospital.orange_number}
                    mono
                  />
                  <Detail
                    label="Orange Name"
                    value={hospital.orange_name || "—"}
                  />
                </>
              )}
              {hospital.bank_account_number && (
                <>
                  <Detail
                    label="Bank Account #"
                    value={hospital.bank_account_number}
                    mono
                  />
                  <Detail
                    label="Bank Account Name"
                    value={hospital.bank_account_name || "—"}
                  />
                  <Detail label="Bank Name" value={hospital.bank_name || "—"} />
                  <Detail
                    label="Bank Branch"
                    value={hospital.bank_branch || "—"}
                  />
                </>
              )}
              {!hospital.momo_number &&
                !hospital.orange_number &&
                !hospital.bank_account_number && (
                  <p className="text-xs text-gray-400 col-span-2">
                    No payment details configured
                  </p>
                )}
            </div>
          </div>

          {/* Services */}
          {hospital.services && hospital.services.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Stethoscope size={14} /> Services ({hospital.services.length})
                </h2>
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Name", "Category", "Price", "Status"].map(h => (
                        <th key={h} className="text-left pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hospital.services.map((svc) => (
                      <tr key={svc.id} className="border-b border-gray-50">
                        <td className="py-3 font-semibold text-gray-900">{svc.name}</td>
                        <td className="py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                            {svc.category}
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-gray-900">{formatXAF(svc.price)}</td>
                        <td className="py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${svc.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {svc.is_available ? "Available" : "Unavailable"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-3">
                {hospital.services.map((svc) => (
                  <div key={svc.id} className="border border-gray-100 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Name</span><span className="font-semibold text-gray-900">{svc.name}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Category</span><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{svc.category}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Price</span><span className="font-semibold text-gray-900">{formatXAF(svc.price)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${svc.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{svc.is_available ? "Available" : "Unavailable"}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admins */}
          {hospital.admins && hospital.admins.length > 0 && (
            <div className="card p-6">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
                Hospital Administrators
              </h2>
              <div className="space-y-2">
                {hospital.admins.map((admin: HospitalManager) => (
                  <Link
                    key={admin.id}
                    href={`/dashboard/system-admin/users/${admin.user_id}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                      style={{ background: "#471DDB" }}
                    >
                      {(admin as HospitalManager).first_name?.charAt(0)}
                      {(admin as HospitalManager).last_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {(admin as HospitalManager).first_name}{" "}
                        {(admin as HospitalManager).last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(admin as HospitalManager).email}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {(admin as HospitalManager).phone_number}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Staff */}
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Users size={14} /> Staff ({staff.length})
            </h2>

            {/* Staff tabs */}
            <div className="flex gap-1 mb-4">
              {(
                [
                  { key: "all", label: "All" },
                  { key: "admins", label: "Admins" },
                  { key: "receptionists", label: "Receptionists" },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setStaffTab(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    staffTab === t.key
                      ? "text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  style={staffTab === t.key ? { background: "#471DDB" } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {staffLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : displayStaff.length === 0 ? (
              <p className="text-xs text-gray-400">No staff found.</p>
            ) : (
              <div className="space-y-2">
                {displayStaff.map((s) => (
                  <Link
                    key={s.id}
                    href={`/dashboard/system-admin/users/${s.user_id}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0"
                      style={{
                        background:
                          (s as StaffMember & { role?: string }).role ===
                          "hospital_admin"
                            ? "#471DDB"
                            : "#1DB1DB",
                      }}
                    >
                      {s.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {s.name}
                      </p>
                      <p className="text-xs text-gray-500">{s.email}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`badge text-[10px] ${(s as StaffMember & { role?: string }).role === "hospital_admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {(s as StaffMember & { role?: string }).role ===
                        "hospital_admin"
                          ? "Admin"
                          : "Receptionist"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
        {label}
      </dt>
      <dd
        className={`text-sm font-semibold text-gray-800 ${mono ? "font-mono text-xs" : ""}`}
      >
        {value || "—"}
      </dd>
    </div>
  );
}
