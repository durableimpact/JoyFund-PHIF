"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { X, Mail, Loader2 } from "lucide-react";
import { resendVerificationEmail } from "@/actions/accounts";
import { toast } from "sonner";
import { useI18n } from "@/locales/client";

export default function VerificationBanner() {
  const t = useI18n();
  const { data: session } = useSession();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);

  const isVerified = (session?.user as any)?.userInfo?.is_verified;

  if (isVerified || dismissed) return null;

  const email = session?.user?.email;

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await resendVerificationEmail(email);
      toast.success(t("dashboard.verification.codeSent"));
      sessionStorage.setItem("temp_email", email);
      router.push("/verify-email");
    } catch {
      toast.error(t("dashboard.verification.failedSend"));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
      <Mail size={18} className="text-amber-600 shrink-0" />
      <p className="text-sm text-amber-800 flex-1">
        {t("dashboard.verification.subtitle")}
      </p>
      <button
        onClick={handleResend}
        disabled={resending}
        className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors disabled:opacity-60 flex items-center gap-1.5"
      >
        {resending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : null}
        {t("dashboard.verification.sendCode")}
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-amber-400 hover:text-amber-600 transition-colors p-1"
      >
        <X size={14} />
      </button>
    </div>
  );
}
