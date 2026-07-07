"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Pencil, X, Check, Eye, EyeOff, KeyRound, Mail, CheckCircle2, AlertCircle, Shield, User, Phone, Calendar } from "lucide-react";
import { toast } from "sonner";
import { updateProfile, changePassword, sendVerificationCode, verifyEmailCode } from "@/actions/profile";
import { useI18n } from "@/locales/client";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function UserProfile() {
  const { data: session, status, update } = useSession();
  const t = useI18n();
  const user = session?.user;
  const userInfo = user?.userInfo as UnifiedUser | undefined;

  const roleDisplay: Record<string, string> = {
    DONOR: t("dashboard.donor.roleDonor"),
    SYSTEM_ADMIN: t("dashboard.donor.roleSystemAdmin"),
    HOSPITAL_ADMIN: t("dashboard.donor.roleHospitalAdmin"),
    RECEPTIONIST: t("dashboard.donor.roleReceptionist"),
    SOCIAL_WORKER: t("dashboard.donor.roleSocialWorker"),
  };

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [verificationStep, setVerificationStep] = useState<"closed" | "confirm" | "code">("closed");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [isVerified, setIsVerified] = useState(userInfo?.is_verified || false);

  if (status === "loading") {
    return (
      <div className="py-20 text-center">
        <Loader2 size={24} className="animate-spin text-gray-300 mx-auto" />
      </div>
    );
  }

  if (!user || !userInfo) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-gray-400">{t("dashboard.donor.noProfileData")}</p>
      </div>
    );
  }

  const info = userInfo;
  const fullName = [info.first_name, info.last_name].filter(Boolean).join(" ") || user.name || t("general.user");
  const email = info.email || user.email || "—";
  const phoneNumber = info.phone_number || "—";
  const role = user.role || info.role || "—";
  const joined = info.created_at
    ? new Date(info.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const hospitalName = (info as any)?.hospital?.name || null;
  const socialWorkerProfile = (info as any)?.profile as SocialWorkerProfile | undefined;

  function startEditing() {
    setFirstName(info.first_name || "");
    setLastName(info.last_name || "");
    setPhone(info.phone_number || "");
    setEditing(true);
  }

  async function handleSave() {
    const profile = info.profile as { id?: string } | undefined;
    if (!profile?.id || !info.role) return;
    setSaving(true);
    try {
      const data: { first_name?: string; last_name?: string; phone_number?: string } = {};
      if (firstName !== (info.first_name || "")) data.first_name = firstName;
      if (lastName !== (info.last_name || "")) data.last_name = lastName;
      if (phone !== (info.phone_number || "")) data.phone_number = phone;
      if (Object.keys(data).length === 0) { setEditing(false); return; }
      await updateProfile(info.role, profile.id, data);
      await update({});
      toast.success(t("dashboard.donor.profileUpdated"));
      setEditing(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("dashboard.donor.failedUpdateProfile"));
    } finally { setSaving(false); }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error(t("dashboard.donor.passwordsMismatch")); return; }
    if (newPassword.length < 8) { toast.error(t("dashboard.donor.passwordMin")); return; }
    setChangingPassword(true);
    try {
      await changePassword({ old_password: oldPassword, new_password: newPassword, confirm_password: confirmPassword });
      toast.success(t("dashboard.donor.passwordChanged"));
      setShowPasswordForm(false);
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("dashboard.donor.failedChangePassword"));
    } finally { setChangingPassword(false); }
  }

  async function handleSendVerificationCode() {
    setVerificationError("");
    setVerificationLoading(true);
    try {
      await sendVerificationCode(email);
      setVerificationStep("code");
      toast.success(t("dashboard.donor.verificationCodeSent"));
    } catch (e) {
      const errorData = typeof e === "string" ? JSON.parse(e) : e;
      const msg = errorData?.detail || errorData?.error || t("dashboard.donor.failedSendVerificationCode");
      setVerificationError(msg);
      toast.error(msg);
    } finally { setVerificationLoading(false); }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setVerificationError("");
    if (verificationCode.length !== 6) { setVerificationError(t("dashboard.donor.invalidCode")); return; }
    setVerificationLoading(true);
    try {
      await verifyEmailCode(email, verificationCode);
      setIsVerified(true);
      toast.success(t("dashboard.donor.emailVerified"));
      setVerificationStep("closed");
      setVerificationCode("");
      await update({});
    } catch (e) {
      const errorData = typeof e === "string" ? JSON.parse(e) : e;
      const msg = errorData?.detail || errorData?.error || t("dashboard.donor.invalidVerificationCode");
      setVerificationError(msg);
      toast.error(msg);
      setVerificationCode("");
    } finally { setVerificationLoading(false); }
  }

  return (
    <div className="max-w-5xl py-4 px-4 sm:px-6 lg:px-1">
      {/* ── Page header ── */}
      <header className="mb-8 sm:mb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--primary)" }}>
          {t("dashboard.sidebar.profile")}
        </p>
        <h1 className="text-2xl sm:text-3xl font-black text-[#1A1A2E]">{t("dashboard.donor.profileSettings")}</h1>
      </header>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6 lg:gap-8 items-start">
        {/* ── Left: Identity card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:text-center">
          <div className="flex items-center gap-4 lg:flex-col lg:mb-0 mb-0">
            <div
              className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center text-white text-xl lg:text-2xl font-bold shrink-0"
              style={{ background: "var(--primary)" }}
            >
              {getInitials(fullName)}
            </div>
            <div className="lg:text-center">
              <h2 className="text-lg font-bold text-[#1A1A2E] mb-0.5">{fullName}</h2>
              <p className="text-sm text-gray-400 mb-3 lg:mb-4">{roleDisplay[role] || role}</p>
              {isVerified ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                  <CheckCircle2 size={13} /> {t("dashboard.donor.verified")}
                </span>
              ) : (
                <button
                  onClick={() => setVerificationStep("confirm")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors"
                >
                  <AlertCircle size={13} /> {t("dashboard.donor.unverified")}
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100 space-y-3 text-left">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={14} className="text-gray-300 shrink-0" />
              <span className="text-gray-600 truncate">{email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone size={14} className="text-gray-300 shrink-0" />
              <span className="text-gray-600">{phoneNumber}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={14} className="text-gray-300 shrink-0" />
              <span className="text-gray-600">{t("dashboard.donor.joinedDate", { date: joined })}</span>
            </div>
          </div>
        </div>

        {/* ── Right: Forms ── */}
        <div className="space-y-8">
          {/* Personal information */}
          <section className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--primary)" + "15" }}>
                  <User size={16} style={{ color: "var(--primary)" }} />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">{t("dashboard.donor.sectionPersonalInfo")}</h2>
              </div>
              {!editing && (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Pencil size={13} /> {t("general.edit")}
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">{t("dashboard.donor.firstName")}</label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={t("dashboard.donor.firstName")}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">{t("dashboard.donor.lastName")}</label>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={t("dashboard.donor.lastName")}
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">{t("dashboard.donor.phone")}</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("dashboard.donor.phone")}
                    className="input-field max-w-sm"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
                    style={{ background: "var(--primary)" }}
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {t("dashboard.donor.saveChanges")}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    {t("general.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {[
                  { label: t("dashboard.donor.firstName"), value: info.first_name || "—" },
                  { label: t("dashboard.donor.lastName"), value: info.last_name || "—" },
                  { label: t("dashboard.donor.email"), value: email },
                  { label: t("dashboard.donor.phone"), value: phoneNumber },
                  { label: t("dashboard.donor.memberSince"), value: joined },
                  ...(hospitalName ? [{ label: t("dashboard.donor.hospital"), value: hospitalName }] : []),
                  ...(role === "SOCIAL_WORKER" && socialWorkerProfile
                    ? [
                        { label: t("dashboard.donor.organization"), value: socialWorkerProfile.organization },
                        { label: t("dashboard.donor.region"), value: socialWorkerProfile.region_assigned },
                      ]
                    : []),
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-3.5 border-t border-gray-100 first:border-0">
                    <span className="text-sm text-gray-400">{row.label}</span>
                    <span className="text-sm font-medium text-[#1A1A2E]">{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Security */}
          <section className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--primary)" + "15" }}>
                <Shield size={16} style={{ color: "var(--primary)" }} />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">{t("dashboard.donor.sectionSecurity")}</h2>
            </div>

            {showPasswordForm ? (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-[#1A1A2E]">{t("dashboard.donor.changePassword")}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setOldPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {t("general.cancel")}
                  </button>
                </div>

                {[
                  {
                    val: oldPassword,
                    set: setOldPassword,
                    show: showOld,
                    setShow: setShowOld,
                    placeholder: t("dashboard.donor.currentPassword"),
                    minLength: undefined,
                  },
                  {
                    val: newPassword,
                    set: setNewPassword,
                    show: showNew,
                    setShow: setShowNew,
                    placeholder: t("dashboard.donor.newPasswordPlaceholder"),
                    minLength: 8,
                  },
                  {
                    val: confirmPassword,
                    set: setConfirmPassword,
                    show: showConfirm,
                    setShow: setShowConfirm,
                    placeholder: t("dashboard.donor.confirmNewPassword"),
                    minLength: 8,
                  },
                ].map((field, i) => (
                  <div key={i}>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">{field.placeholder}</label>
                    <div className="relative">
                      <input
                        type={field.show ? "text" : "password"}
                        value={field.val}
                        onChange={(e) => field.set(e.target.value)}
                        placeholder={field.placeholder}
                        required
                        minLength={field.minLength}
                        className="input-field !pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => field.setShow(!field.show)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {field.show ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full py-3 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                  style={{ background: "var(--primary)" }}
                >
                  {changingPassword ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <KeyRound size={16} />
                  )}
                  {t("dashboard.donor.changePassword")}
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="flex items-center gap-3 w-full text-left py-3 border-t border-gray-100 hover:text-[#1A1A2E] transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 group-hover:bg-gray-100 transition-colors">
                  <KeyRound size={16} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">{t("dashboard.donor.changePassword")}</p>
                  <p className="text-xs text-gray-400">{t("dashboard.donor.updatePasswordDesc")}</p>
                </div>
              </button>
            )}
          </section>
        </div>
      </div>

      {/* ── Email Verification Modal ── */}
      {verificationStep !== "closed" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            {verificationStep === "confirm" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#1A1A2E]">{t("dashboard.donor.verifyEmail")}</h3>
                  <button
                    onClick={() => {
                      setVerificationStep("closed");
                      setVerificationError("");
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="text-sm text-gray-500">{t("dashboard.donor.verificationCodeWillBeSent")}</p>
                <p className="text-sm font-bold text-[#1A1A2E]">{email}</p>
                <button
                  onClick={handleSendVerificationCode}
                  disabled={verificationLoading}
                  className="w-full py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                  style={{ background: "var(--primary)" }}
                >
                  {verificationLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> {t("dashboard.donor.sending")}
                    </>
                  ) : (
                    <>
                      <Mail size={16} /> {t("dashboard.donor.sendCode")}
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setVerificationStep("closed");
                    setVerificationError("");
                  }}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {t("general.cancel")}
                </button>
              </div>
            )}

            {verificationStep === "code" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#1A1A2E]">{t("dashboard.donor.enterCode")}</h3>
                  <button
                    onClick={() => {
                      setVerificationStep("closed");
                      setVerificationCode("");
                      setVerificationError("");
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  {t("dashboard.donor.codeSentTo", { email })}
                </p>
                {verificationError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                    <AlertCircle size={14} className="shrink-0" />
                    {verificationError}
                  </div>
                )}
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setVerificationError("");
                    }}
                    placeholder="000000"
                    maxLength={6}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-center text-2xl font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                  <button
                    type="submit"
                    disabled={verificationLoading || verificationCode.length !== 6}
                    className="w-full py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                    style={{ background: "var(--primary)" }}
                  >
                    {verificationLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> {t("dashboard.donor.verifying")}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} /> {t("dashboard.donor.verify")}
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
