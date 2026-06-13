"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Pencil, X, Check, Eye, EyeOff, KeyRound, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { updateProfile, changePassword, sendVerificationCode, verifyEmailCode } from "@/actions/profile";

function attributeRow(label: string, value: React.ReactNode) {
  return (
    <div className="flex justify-between gap-4 py-3 border-b border-gray-200 last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right">{value}</span>
    </div>
  );
}

export default function UserProfile() {
  const { data: session, status, update } = useSession();
  const user = session?.user;
  const userInfo = user?.userInfo as UnifiedUser | undefined;

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

  // Email verification state
  const [verificationStep, setVerificationStep] = useState<"closed" | "confirm" | "code">("closed");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [isVerified, setIsVerified] = useState(userInfo?.is_verified || false);

  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-400">Loading profile…</p>
      </div>
    );
  }

  if (!user || !userInfo) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-400">No profile data is available right now.</p>
      </div>
    );
  }

  const info = userInfo;
  const fullName = [info.first_name, info.last_name].filter(Boolean).join(" ") || user.name || "User";
  const email = info.email || user.email || "—";
  const phoneNumber = info.phone_number || "—";
  const role = user.role || info.role || "—";
  const verified = info.is_verified ? "Verified" : "Unverified";
  const joined = info.created_at ? new Date(info.created_at).toLocaleDateString() : "—";
  const profileId = (info.profile as { id?: string } | undefined)?.id || info.id || user.id || "—";
  const hospitalName = (info as any)?.hospital?.name || (info as any)?.hospital || null;
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

      if (Object.keys(data).length === 0) {
        setEditing(false);
        return;
      }

      await updateProfile(info.role, profile.id, data);
      toast.success("Profile updated");
      setEditing(false);
      await update();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  function cancelEditing() {
    setEditing(false);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success("Password changed successfully");
      setShowPasswordForm(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  }

  // ── Email Verification Handlers ──

  async function handleSendVerificationCode() {
    setVerificationError("");
    setVerificationLoading(true);

    try {
      await sendVerificationCode(email);
      setVerificationStep("code");
      toast.success("Verification code sent to your email");
    } catch (e) {
      const errorData = typeof e === "string" ? JSON.parse(e) : e;
      const errorMessage =
        errorData?.detail ||
        errorData?.error ||
        "Failed to send verification code. Please try again.";
      setVerificationError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setVerificationLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setVerificationError("");

    if (verificationCode.length !== 6) {
      setVerificationError("Please enter a 6-digit code");
      toast.error("Please enter a 6-digit code");
      return;
    }

    setVerificationLoading(true);

    try {
      await verifyEmailCode(email, verificationCode);
      setIsVerified(true);
      toast.success("Email verified successfully!");
      
      // Reset verification state
      setVerificationStep("closed");
      setVerificationCode("");
      
      // Update session
      await update();
      
      // Auto-close after success
      setTimeout(() => {
        setVerificationStep("closed");
      }, 2000);
    } catch (e) {
      const errorData = typeof e === "string" ? JSON.parse(e) : e;
      const errorMessage =
        errorData?.detail ||
        errorData?.error ||
        "Invalid verification code. Please try again.";
      setVerificationError(errorMessage);
      toast.error(errorMessage);
      setVerificationCode("");
    } finally {
      setVerificationLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">My profile</p>
            {editing ? (
              <div className="mt-3 flex items-center gap-3">
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200 w-36"
                />
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200 w-36"
                />
              </div>
            ) : (
              <h1 className="mt-2 text-xl font-bold text-gray-900">{fullName}</h1>
            )}
            <p className="mt-1 text-sm text-gray-400">A summary of your account and profile details.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-gray-900 px-4 py-2.5 text-right text-white shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/70">Role</p>
              <p className="text-xs font-semibold">{role}</p>
            </div>
            {editing ? (
              <div className="flex gap-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                  title="Save"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                </button>
                <button
                  onClick={cancelEditing}
                  className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={startEditing}
                className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
                title="Edit profile"
              >
                <Pencil size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile details */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {attributeRow("Full name", fullName)}
            {attributeRow("Email", email)}
            {editing ? (
              <div className="flex justify-between gap-4 py-3 border-b border-gray-200">
                <span className="text-sm text-gray-500">Phone</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-900 text-right focus:outline-none focus:ring-2 focus:ring-blue-200 w-44"
                />
              </div>
            ) : (
              attributeRow("Phone", phoneNumber)
            )}
            <div className="flex justify-between items-center gap-4 py-3 border-b border-gray-200">
              <span className="text-sm text-gray-500">Verified</span>
              <div className="flex items-center gap-3">
                {isVerified ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                      <CheckCircle2 size={16} /> Verified
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">Unverified</span>
                    <button
                      onClick={() => setVerificationStep("confirm")}
                      className="px-3 py-1.5 rounded-lg border-2 border-dotted border-green-500 text-green-600 font-semibold text-xs hover:bg-green-50 transition"
                    >
                      Verify Now
                    </button>
                  </div>
                )}
              </div>
            </div>
            {attributeRow("Member since", joined)}
            {attributeRow("Profile ID", profileId)}
            {hospitalName ? attributeRow("Hospital", hospitalName) : null}
            {socialWorkerProfile ? (
              <>
                {attributeRow("Organization", socialWorkerProfile.organization)}
                {attributeRow("Region", socialWorkerProfile.region_assigned)}
              </>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Account status</p>
                <p className="mt-1 text-xs text-gray-400">Keep your profile updated to stay connected with JoyFund.</p>
              </div>
              <div className="rounded-xl bg-blue-50/50 p-4">
                <p className="text-xs text-gray-400">Your current role</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{role}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-400">Profile identifier</p>
                <p className="mt-1 text-sm font-semibold text-gray-900 font-mono">{profileId.slice(0, 8)}…</p>
              </div>
            </div>
          </div>

          {/* Password change */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            {showPasswordForm ? (
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Change password</p>
                  <button
                    type="button"
                    onClick={() => { setShowPasswordForm(false); setOldPassword(""); setNewPassword(""); setConfirmPassword(""); }}
                    className="text-xs text-gray-400 hover:text-gray-600 transition"
                  >
                    Cancel
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showOld ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Current password"
                    required
                    className="w-full px-3 py-2 pr-9 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    required
                    minLength={8}
                    className="w-full px-3 py-2 pr-9 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                    className="w-full px-3 py-2 pr-9 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {changingPassword ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  Change password
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
              >
                <KeyRound size={16} />
                Change password
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Email Verification Modal */}
      {verificationStep !== "closed" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
            {/* Confirmation Step */}
            {verificationStep === "confirm" && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Verify Your Email</h3>
                  <button
                    onClick={() => {
                      setVerificationStep("closed");
                      setVerificationError("");
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl text-center">
                  <p className="text-sm text-gray-700">
                    A verification code will be sent to:
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-2 break-all">{email}</p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleSendVerificationCode}
                    disabled={verificationLoading}
                    className="w-full py-2.5 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {verificationLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <Mail size={16} /> Proceed
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setVerificationStep("closed");
                      setVerificationError("");
                    }}
                    className="w-full py-2.5 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Code Input Step */}
            {verificationStep === "code" && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Enter Verification Code</h3>
                  <button
                    onClick={() => {
                      setVerificationStep("closed");
                      setVerificationCode("");
                      setVerificationError("");
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <p className="text-sm text-gray-600">
                  We've sent a 6-digit code to <span className="font-semibold">{email}</span>
                </p>

                {verificationError && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-3 py-2 flex gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{verificationError}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setVerificationCode(value);
                        setVerificationError("");
                      }}
                      placeholder="000000"
                      maxLength={6}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-center text-2xl font-semibold tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={verificationLoading || verificationCode.length !== 6}
                    className="w-full py-2.5 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {verificationLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} /> Verify Email
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
