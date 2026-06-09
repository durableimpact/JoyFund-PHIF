"use client";

import { useSession } from "next-auth/react";

function attributeRow(label: string, value: React.ReactNode) {
  return (
    <div className="flex justify-between gap-4 py-3 border-b border-gray-200 last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right">{value}</span>
    </div>
  );
}

export default function UserProfile() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const userInfo = user?.userInfo as UnifiedUser | undefined;

  if (status === "loading") {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      </div>
    );
  }

  if (!user || !userInfo) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">No profile data is available right now.</p>
      </div>
    );
  }

  const fullName = [userInfo.first_name, userInfo.last_name].filter(Boolean).join(" ") || user.name || "User";
  const email = userInfo.email || user.email || "—";
  const phone = userInfo.phone_number || "—";
  const role = user.role || userInfo.role || "—";
  const verified = userInfo.is_verified ? "Verified" : "Unverified";
  const joined = userInfo.created_at ? new Date(userInfo.created_at).toLocaleDateString() : "—";
  const profileId = (userInfo.profile as { id?: string } | undefined)?.id || userInfo.id || user.id || "—";
  const hospitalName = (userInfo as any)?.hospital?.name || (userInfo as any)?.hospital || null;
  const socialWorkerProfile = (userInfo as any)?.profile as SocialWorkerProfile | undefined;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">My profile</p>
            <h1 className="mt-2 text-2xl font-bold text-foreground">{fullName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">A summary of your account and profile details.</p>
          </div>
          <div className="rounded-3xl bg-primary px-4 py-3 text-right text-primary-foreground shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/80">Role</p>
            <p className="mt-1 text-base font-semibold">{role}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            {attributeRow("Full name", fullName)}
            {attributeRow("Email", email)}
            {attributeRow("Phone", phone)}
            {attributeRow("Verified", verified)}
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

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Account status</p>
              <p className="mt-2 text-sm text-muted-foreground">Keep your profile updated to stay connected with JoyFund.</p>
            </div>
            <div className="rounded-3xl bg-primary/10 p-4">
              <p className="text-sm text-muted-foreground">Your current role</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{role}</p>
            </div>
            <div className="rounded-3xl bg-secondary/10 p-4">
              <p className="text-sm text-muted-foreground">Profile identifier</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{profileId}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
