"use client";
import Image from "next/image";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useI18n } from "@/locales/client";

const ROLE_HOME: Record<string, string> = {
  DONOR: "/dashboard/donor",
  SYSTEM_ADMIN: "/dashboard/admin",
  HOSPITAL_ADMIN: "/dashboard/hospital-admin",
  RECEPTIONIST: "/dashboard/receptionist",
  SOCIAL_WORKER: "/dashboard/social-worker",
};

function getRedirectPath(role: string | undefined) {
  return ROLE_HOME[role as keyof typeof ROLE_HOME] ?? "/dashboard";
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const redirectParam = searchParams?.get("redirect") || undefined;
  const t = useI18n();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("[login] Attempting to sign in with:", { email: form.email });
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        userAgent: navigator.userAgent,
        redirect: false,
        callbackUrl: redirectParam || "/dashboard",
      });

      console.log("[login] SignIn result:", result);

      // Prefer explicit error checking — some providers may return 200
      // even when authentication failed. Check `error` first.
      if (result?.error) {
        let errorMsg = "Invalid email or password.";

        if (typeof result.error === "string") {
          // Try to parse JSON errors returned from the backend
          try {
            const parsed = JSON.parse(result.error);
            if (parsed.error_description) errorMsg = parsed.error_description;
            else if (parsed.detail) errorMsg = parsed.detail;
            else if (parsed.message) errorMsg = parsed.message;
            else if (parsed.error) errorMsg = String(parsed.error);
          } catch (_) {
            // Not JSON — map common NextAuth error codes to user-friendly messages
            switch (result.error) {
              case "CredentialsSignin":
                errorMsg =
                  "Invalid email or password. Please check your credentials and try again.";
                break;
              case "OAuthAccountNotLinked":
                errorMsg =
                  "An account with that email already exists. Please sign in using the original provider.";
                break;
              case "SessionRequired":
                errorMsg = "Your session has expired. Please sign in again.";
                break;
              default:
                // Fallback to the raw string but make it presentable
                errorMsg = result.error.replace(/([A-Z])/g, " $1").trim();
            }
          }
        }

        console.error("[login] Sign in failed:", result.error, result);
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // Fallback: check `ok` / `status` to ensure a successful response
      if (!result?.ok || (result?.status && result.status >= 400)) {
        const errorMsg = result?.status
          ? `Sign in failed (status ${result.status}).`
          : "Invalid email or password.";
        console.error("[login] Sign in failed:", errorMsg, result);
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // Success
      toast.success("Signed in successfully.");
      console.log("[login] Sign in successful, redirecting...");

      const destination = result?.url
        ? result.url
        : redirectParam
          ? decodeURIComponent(redirectParam)
          : "/dashboard";

      queryClient.clear();

      // Force a full document navigation so the authenticated session cookie is
      // available before the dashboard route initializes.
      window.location.replace(destination);
    } catch (error) {
      console.error("[login] Unexpected error:", error);
      const message = "Connection error. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="py-12 flex items-center justify-center px-4"
      style={{ background: "var(--background)" }}
    >
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white mx-auto mb-4 flex items-center justify-center">
            <Image
              src="/assets/favicon_io/joyfund-android-chrome-192x192.png"
              alt="JoyFund logo"
              width={56}
              height={56}
              className="object-cover"
            />
          </div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">
            {t("auth.login.title")}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {t("auth.login.subtitle")}
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-5"
        >
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">
              {t("auth.login.email")}
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB1DB] focus:border-transparent transition"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-semibold text-[#1A1A2E]">
                {t("auth.login.password")}
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#1DB1DB] hover:underline"
              >
                {t("auth.login.forgotPassword")}
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={t("auth.login.passwordPlaceholder")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB1DB] focus:border-transparent transition pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
            style={{ background: "var(--primary)" }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {t("auth.login.loading")}
              </>
            ) : (
              t("auth.login.button")
            )}
          </button>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500">
            {t("auth.login.newDonor")}{" "}
            <Link
              href="/register"
              className="text-[#1DB1DB] font-semibold hover:underline"
            >
              {t("auth.login.createAccountLink")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#1DB1DB] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
