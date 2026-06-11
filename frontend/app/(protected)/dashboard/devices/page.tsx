"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

const DEVICE_PATHS: Record<string, string> = {
  SYSTEM_ADMIN: "/dashboard/system-admin/devices",
  HOSPITAL_ADMIN: "/dashboard/hospital-admin/devices",
  RECEPTIONIST: "/dashboard/receptionist/devices",
  SOCIAL_WORKER: "/dashboard/social-worker/devices",
  DONOR: "/dashboard/donor/devices",
};

export default function DevicesRedirect() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    const role = session?.user?.role as string;
    const target = DEVICE_PATHS[role];
    router.replace(target || "/dashboard");
  }, [status, session, router]);

  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={22} className="animate-spin text-gray-300" />
    </div>
  );
}
