"use client";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { formatDate, formatXAF } from "@/lib/utils";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Check,
  CheckCircle,
  Clock,
  FileText,
  HandHeart,
  Heart,
  Shield,
  Smartphone,
  Ticket,
  TrendingUp,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { getAdminUserDetail } from "@/actions/accounts";

const ROLE_LABELS: Record<string, string> = {
  SYSTEM_ADMIN: "System Admin",
  HOSPITAL_ADMIN: "Hospital Admin",
  SOCIAL_WORKER: "Social Worker",
  RECEPTIONIST: "Receptionist",
  DONOR: "Donor",
};

const ROLE_COLORS: Record<string, string> = {
  SYSTEM_ADMIN: "bg-purple-100 text-purple-700",
  HOSPITAL_ADMIN: "bg-blue-100 text-blue-700",
  SOCIAL_WORKER: "bg-emerald-100 text-emerald-700",
  RECEPTIONIST: "bg-amber-100 text-amber-700",
  DONOR: "bg-gray-100 text-gray-700",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  DRAFT: "bg-gray-100 text-gray-500",
  INACTIVE: "bg-gray-100 text-gray-500",
  FUNDED: "bg-blue-100 text-blue-700",
  CLOSED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-600",
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-600",
  SUCCESS: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-600",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  REPORTED: "bg-amber-100 text-amber-700",
  VALIDATED: "bg-blue-100 text-blue-700",
  ASSIGNED: "bg-purple-100 text-purple-700",
  IN_TREATMENT: "bg-blue-100 text-blue-700",
  LOW: "bg-gray-100 text-gray-500",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-600",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`badge text-[10px] font-semibold ${STATUS_COLORS[status] || "bg-gray-100 text-gray-500"}`}
    >
      {status.replace(/_/g, " ")}
    </span>
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
        {value || "\u2014"}
      </dd>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-gray-50 text-center">
      <Icon size={16} className="mx-auto mb-1" style={{ color }} />
      <div className="text-lg font-black" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get("role") || "";

  const { data: session } = useSession();
  const token =
    (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const { data, isLoading } = useQuery<AdminUserDetail>({
    queryKey: ["admin-user-detail", id, token],
    queryFn: async () => await getAdminUserDetail(id, token),
    enabled: !!token && !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
            <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
          </div>
          <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-gray-400">User not found.</div>
    );
  }

  const { user: u, profile, devices } = data;
  const userRole = u.role;

  return (
    <>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm font-semibold"
      >
        <ArrowLeft size={16} /> Back to Users
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div className="flex items-center gap-4">
          {u.profile_picture ? (
            <img
              src={u.profile_picture}
              alt={u.first_name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <User size={20} className="text-gray-400" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              {u.first_name} {u.last_name}
              <span
                className={`badge text-xs ${ROLE_COLORS[userRole] || "bg-gray-100 text-gray-700"}`}
              >
                {ROLE_LABELS[userRole] || userRole}
              </span>
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">{u.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Profile Card */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <User size={14} /> Profile
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Detail label="First Name" value={u.first_name} />
              <Detail label="Last Name" value={u.last_name} />
              <Detail label="Email" value={u.email} className="col-span-2" />
              <Detail label="Phone" value={u.phone_number} />
              <Detail
                label="Role"
                value={
                  <span className={`badge ${ROLE_COLORS[userRole]}`}>
                    {ROLE_LABELS[userRole]}
                  </span>
                }
              />
              <Detail
                label="Verified"
                value={
                  u.is_verified ? (
                    <span className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                      <Check size={14} /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-400 text-sm">
                      <X size={14} /> Pending
                    </span>
                  )
                }
              />
              <Detail
                label="Active"
                value={
                  u.is_active ? (
                    <span className="text-emerald-600 text-sm font-semibold">
                      Active
                    </span>
                  ) : (
                    <span className="text-red-500 text-sm font-semibold">
                      Inactive
                    </span>
                  )
                }
              />
              <Detail label="Joined" value={formatDate(u.created_at)} />
              <Detail label="Last Updated" value={formatDate(u.updated_at)} />
            </div>
          </div>

          {/* Role-specific identification */}
          {(userRole === "HOSPITAL_ADMIN" ||
            userRole === "SOCIAL_WORKER" ||
            userRole === "RECEPTIONIST") &&
            profile?.national_id_number && (
              <div className="card p-5">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Shield size={14} /> Identification
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <Detail
                    label="National ID #"
                    value={profile.national_id_number}
                    mono
                  />
                  {profile.front_national_id_image && (
                    <Detail
                      label="Front of ID"
                      value={
                        <a
                          href={profile.front_national_id_image}
                          target="_blank"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          View Image
                        </a>
                      }
                    />
                  )}
                  {profile.back_national_id_image && (
                    <Detail
                      label="Back of ID"
                      value={
                        <a
                          href={profile.back_national_id_image}
                          target="_blank"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          View Image
                        </a>
                      }
                    />
                  )}
                </div>
              </div>
            )}

          {/* Assignment card */}
          {userRole === "SOCIAL_WORKER" && profile && (
            <div className="card p-5">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Briefcase size={14} /> Assignment
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Detail label="Organization" value={profile.organization} />
                <Detail
                  label="Region Assigned"
                  value={profile.region_assigned}
                />
                <Detail
                  label="Approved"
                  value={
                    profile.is_approved ? (
                      <span className="text-emerald-600 text-sm font-semibold">
                        Approved
                      </span>
                    ) : (
                      <span className="text-amber-600 text-sm font-semibold">
                        Pending
                      </span>
                    )
                  }
                />
              </div>
            </div>
          )}

          {(userRole === "HOSPITAL_ADMIN" || userRole === "RECEPTIONIST") &&
            data.hospital_info && (
              <div className="card p-5">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Building2 size={14} /> Hospital Assignment
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <Detail
                    label="Hospital"
                    value={data.hospital_info.name}
                  />
                  <Detail label="City" value={data.hospital_info.city} />
                  <Detail
                    label="Status"
                    value={
                      <StatusBadge
                        status={data.hospital_info.partnership_status}
                      />
                    }
                  />
                </div>
              </div>
            )}

          {userRole === "SYSTEM_ADMIN" && (
            <div className="card p-5">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Shield size={14} /> System Admin
              </h2>
              <p className="text-xs text-gray-500">
                Full platform access with all permissions.
              </p>
            </div>
          )}

          {/* ── DONOR: Campaigns + Donations ── */}
          {userRole === "DONOR" && data.donor_stats && (
            <>
              <div className="card p-5">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <TrendingUp size={14} /> Donor Stats
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard
                    label="Total Raised"
                    value={formatXAF(data.donor_stats.total_raised)}
                    icon={TrendingUp}
                    color="#471DDB"
                  />
                  <StatCard
                    label="Campaigns"
                    value={data.donor_stats.my_campaigns}
                    icon={FileText}
                    color="#1DB1DB"
                  />
                  <StatCard
                    label="Contributors"
                    value={data.donor_stats.contributors}
                    icon={Users}
                    color="#1CDBC9"
                  />
                  <StatCard
                    label="Lives Impacted"
                    value={data.donor_stats.lives_impacted}
                    icon={Heart}
                    color="#ef4444"
                  />
                </div>
              </div>

              {data.campaigns.length > 0 && (
                <div className="card p-5">
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <FileText size={14} /> Campaigns
                  </h2>
                  <div className="space-y-3">
                    {data.campaigns.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl border border-gray-100"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {c.title}
                          </span>
                          <StatusBadge status={c.status} />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          <span>
                            {formatXAF(c.current_amount)} /{" "}
                            {formatXAF(c.goal_amount)}
                          </span>
                          <span>{c.progress_percentage.toFixed(0)}%</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(100, c.progress_percentage)}%`,
                              background: "#471DDB",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.recent_donations.length > 0 && (
                <div className="card p-5">
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <HandHeart size={14} /> Recent Donations
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 border-b border-gray-100">
                          <th className="text-left py-2 font-medium">
                            Campaign
                          </th>
                          <th className="text-left py-2 font-medium">
                            Donor
                          </th>
                          <th className="text-right py-2 font-medium">
                            Amount
                          </th>
                          <th className="text-center py-2 font-medium">
                            Status
                          </th>
                          <th className="text-right py-2 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recent_donations.map((d) => (
                          <tr
                            key={d.id}
                            className="border-b border-gray-50 last:border-0"
                          >
                            <td className="py-2 text-gray-900 font-medium">
                              {d.campaign_title}
                            </td>
                            <td className="py-2 text-gray-500">
                              {d.donor_name}
                            </td>
                            <td className="py-2 text-right font-semibold">
                              {formatXAF(d.amount)}
                            </td>
                            <td className="py-2 text-center">
                              <StatusBadge status={d.status} />
                            </td>
                            <td className="py-2 text-right text-gray-400 text-xs">
                              {formatDate(d.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── HOSPITAL_ADMIN: Hospital stats + Receptionists ── */}
          {userRole === "HOSPITAL_ADMIN" && data.hospital_stats && (
            <>
              <div className="card p-5">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Building2 size={14} /> Hospital Stats
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <StatCard
                    label="Vouchers Redeemed"
                    value={data.hospital_stats.redeemed_vouchers}
                    icon={CheckCircle}
                    color="#1CDBC9"
                  />
                  <StatCard
                    label="Vouchers Issued"
                    value={data.hospital_stats.issued_vouchers}
                    icon={Ticket}
                    color="#471DDB"
                  />
                  <StatCard
                    label="Total Claims"
                    value={data.hospital_stats.total_claims}
                    icon={FileText}
                    color="#1DB1DB"
                  />
                  <StatCard
                    label="Pending Claims"
                    value={data.hospital_stats.pending_claims}
                    icon={Clock}
                    color="#f59e0b"
                  />
                  <StatCard
                    label="Staff"
                    value={data.hospital_stats.number_of_staff}
                    icon={Users}
                    color="#8b5cf6"
                  />
                </div>
              </div>

              {data.hospital_receptionists.length > 0 && (
                <div className="card p-5">
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Users size={14} /> Enrolled Receptionists
                  </h2>
                  <div className="space-y-2">
                    {data.hospital_receptionists.map((rec) => (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {rec.first_name} {rec.last_name}
                          </p>
                          <p className="text-xs text-gray-400">{rec.email}</p>
                        </div>
                        <span
                          className={`badge text-[10px] ${rec.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                        >
                          {rec.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── SOCIAL_WORKER: Stats + Beneficiaries + Health Issues ── */}
          {userRole === "SOCIAL_WORKER" && data.social_worker_stats && (
            <>
              <div className="card p-5">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Heart size={14} /> Social Worker Stats
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard
                    label="Enrolled"
                    value={data.social_worker_stats.enrolled}
                    icon={Users}
                    color="#471DDB"
                  />
                  <StatCard
                    label="Awaiting Match"
                    value={data.social_worker_stats.awaiting_match}
                    icon={Clock}
                    color="#f59e0b"
                  />
                  <StatCard
                    label="Vouchers Issued"
                    value={data.social_worker_stats.voucher_issued}
                    icon={Ticket}
                    color="#1CDBC9"
                  />
                  <StatCard
                    label="Care Received"
                    value={data.social_worker_stats.care_received}
                    icon={CheckCircle}
                    color="#10b981"
                  />
                </div>
              </div>

              {data.beneficiaries.length > 0 && (
                <div className="card p-5">
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Users size={14} /> Enrolled Beneficiaries
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 border-b border-gray-100">
                          <th className="text-left py-2 font-medium">Name</th>
                          <th className="text-left py-2 font-medium">ID</th>
                          <th className="text-left py-2 font-medium">
                            Category
                          </th>
                          <th className="text-left py-2 font-medium">
                            Region
                          </th>
                          <th className="text-center py-2 font-medium">
                            Verified
                          </th>
                          <th className="text-right py-2 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.beneficiaries.map((b) => (
                          <tr
                            key={b.id}
                            className="border-b border-gray-50 last:border-0"
                          >
                            <td className="py-2 text-gray-900 font-medium">
                              {b.full_name}
                            </td>
                            <td className="py-2 text-gray-500 font-mono text-xs">
                              {b.digital_health_id}
                            </td>
                            <td className="py-2">
                              <StatusBadge status={b.category} />
                            </td>
                            <td className="py-2 text-gray-500">{b.region}</td>
                            <td className="py-2 text-center">
                              {b.is_verified ? (
                                <Check
                                  size={14}
                                  className="text-emerald-500 mx-auto"
                                />
                              ) : (
                                <X
                                  size={14}
                                  className="text-gray-300 mx-auto"
                                />
                              )}
                            </td>
                            <td className="py-2 text-right text-gray-400 text-xs">
                              {formatDate(b.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {data.health_issues.length > 0 && (
                <div className="card p-5">
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Heart size={14} /> Reported Health Issues
                  </h2>
                  <div className="space-y-2">
                    {data.health_issues.map((hi) => (
                      <div
                        key={hi.id}
                        className="p-3 rounded-xl border border-gray-100"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {hi.beneficiary_name}
                          </span>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={hi.severity} />
                            <StatusBadge status={hi.status} />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {hi.description}
                        </p>
                        <div className="text-[10px] text-gray-400 mt-1">
                          {hi.category.replace(/_/g, " ")} &middot;{" "}
                          {formatDate(hi.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── RECEPTIONIST: Stats + Claims ── */}
          {userRole === "RECEPTIONIST" && data.receptionist_stats && (
            <>
              <div className="card p-5">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <FileText size={14} /> Receptionist Stats
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatCard
                    label="Vouchers Redeemed"
                    value={data.receptionist_stats.redeemed_vouchers}
                    icon={CheckCircle}
                    color="#1CDBC9"
                  />
                  <StatCard
                    label="Total Claims"
                    value={data.receptionist_stats.total_medical_claims}
                    icon={FileText}
                    color="#471DDB"
                  />
                  <StatCard
                    label="Pending"
                    value={data.receptionist_stats.pending_claims}
                    icon={Clock}
                    color="#f59e0b"
                  />
                  <StatCard
                    label="Approved"
                    value={data.receptionist_stats.approved_claims}
                    icon={Check}
                    color="#10b981"
                  />
                  <StatCard
                    label="Rejected"
                    value={data.receptionist_stats.rejected_claims}
                    icon={XCircle}
                    color="#ef4444"
                  />
                  <StatCard
                    label="Proofs Uploaded"
                    value={data.receptionist_stats.uploaded_proofs}
                    icon={FileText}
                    color="#8b5cf6"
                  />
                </div>
              </div>

              {data.submitted_claims.length > 0 && (
                <div className="card p-5">
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <FileText size={14} /> Submitted Claims
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 border-b border-gray-100">
                          <th className="text-left py-2 font-medium">
                            Voucher
                          </th>
                          <th className="text-left py-2 font-medium">
                            Hospital
                          </th>
                          <th className="text-right py-2 font-medium">
                            Cost
                          </th>
                          <th className="text-center py-2 font-medium">
                            Status
                          </th>
                          <th className="text-right py-2 font-medium">
                            Submitted
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.submitted_claims.map((mc) => (
                          <tr
                            key={mc.id}
                            className="border-b border-gray-50 last:border-0"
                          >
                            <td className="py-2 font-mono text-xs text-gray-900">
                              {mc.voucher_code}
                            </td>
                            <td className="py-2 text-gray-500">
                              {mc.hospital_name}
                            </td>
                            <td className="py-2 text-right font-semibold">
                              {formatXAF(mc.total_cost)}
                            </td>
                            <td className="py-2 text-center">
                              <StatusBadge status={mc.claim_status} />
                            </td>
                            <td className="py-2 text-right text-gray-400 text-xs">
                              {formatDate(mc.submitted_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── SYSTEM_ADMIN: Stats ── */}
          {userRole === "SYSTEM_ADMIN" && data.system_admin_stats && (
            <div className="card p-5">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Shield size={14} /> Admin Activity
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="Enrolled Admins"
                  value={data.system_admin_stats.enrolled_admins}
                  icon={Building2}
                  color="#471DDB"
                />
                <StatCard
                  label="Enrolled SWs"
                  value={data.system_admin_stats.enrolled_social_workers}
                  icon={Users}
                  color="#1CDBC9"
                />
                <StatCard
                  label="Validated Issues"
                  value={data.system_admin_stats.validated_health_issues}
                  icon={Heart}
                  color="#f59e0b"
                />
                <StatCard
                  label="Reviewed Claims"
                  value={data.system_admin_stats.reviewed_claims}
                  icon={FileText}
                  color="#1DB1DB"
                />
              </div>
            </div>
          )}

          {/* Devices */}
          {devices.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Smartphone size={14} /> Devices & Sessions
              </h2>
              <div className="space-y-2">
                {devices.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone size={14} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {d.device_name || d.browser || "Unknown Device"}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {d.os} &middot; {d.browser} &middot; {d.ip_address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {d.is_trusted && (
                        <span className="badge bg-emerald-100 text-emerald-700 text-[10px]">
                          Trusted
                        </span>
                      )}
                      {d.is_blocked && (
                        <span className="badge bg-red-100 text-red-600 text-[10px]">
                          Blocked
                        </span>
                      )}
                      {d.last_active && (
                        <span className="text-[10px] text-gray-400">
                          {formatDate(d.last_active)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
              Account Status
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Verified</span>
                {u.is_verified ? (
                  <span className="badge bg-emerald-100 text-emerald-700 text-[10px]">
                    Yes
                  </span>
                ) : (
                  <span className="badge bg-gray-100 text-gray-500 text-[10px]">
                    No
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Active</span>
                {u.is_active ? (
                  <span className="badge bg-emerald-100 text-emerald-700 text-[10px]">
                    Yes
                  </span>
                ) : (
                  <span className="badge bg-red-100 text-red-600 text-[10px]">
                    No
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Role</span>
                <span className={`badge text-[10px] ${ROLE_COLORS[userRole]}`}>
                  {ROLE_LABELS[userRole]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Joined</span>
                <span className="text-xs text-gray-700">
                  {formatDate(u.created_at)}
                </span>
              </div>
              {devices.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Devices</span>
                  <span className="text-xs text-gray-700">
                    {devices.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
