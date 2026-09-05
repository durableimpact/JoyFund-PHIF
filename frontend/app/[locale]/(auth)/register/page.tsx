"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { createDonorAccount } from "@/actions/accounts";
import { getErrorMessage } from "@/lib/errors";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { InputPhone } from "@/components/ui/input-phone";
import { useI18n } from "@/locales/client";

type RegisterInput = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  website?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const t = useI18n();

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors },
    reset,
    control,
  } = useForm<RegisterInput>({
    mode: "onBlur",
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      website: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string>("");

  const onSubmit = async (data: RegisterInput) => {
    setGeneralError("");
    // client-side password checks
    if (data.password !== data.confirmPassword) {
      setGeneralError(t("auth.register.passwordMismatch"));
      setFieldError("confirmPassword", {
        type: "manual",
        message: t("auth.register.passwordMismatch"),
      });
      return;
    }
    if (data.password.length < 8) {
      setGeneralError(t("auth.register.passwordMin"));
      setFieldError("password", {
        type: "manual",
        message: t("auth.register.passwordMin"),
      });
      return;
    }

    setLoading(true);

    try {
      const account = await createDonorAccount({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone_number: data.phone,
        password: data.password,
        website: data.website,
      });

      if (!account) {
        const message = t("auth.register.accountFailed");
        setGeneralError(message);
        toast.error(message);
        setLoading(false);
        return;
      }

      // Account created successfully - now automatically sign in the user
      toast.success(t("auth.register.success"));

      try {
        const signInResult = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
          callbackUrl: "/dashboard/donor",
        });

        if (signInResult?.error) {
          // Sign-in failed, but account was created
          console.warn(
            "[register] Account created but auto-login failed:",
            signInResult.error,
          );
          toast.info(t("auth.register.accountCreated"));
          router.push("/login");
        } else if (signInResult?.ok) {
          // Successfully signed in
          toast.success(t("auth.register.welcomeSignedIn"));
          router.push("/dashboard/donor");
        } else {
          // Unexpected response
          console.warn("[register] Unexpected sign-in response:", signInResult);
          toast.info(t("auth.register.accountCreated"));
          router.push("/login");
        }
      } catch (signInError: unknown) {
        console.error("[register] Auto-login error:", signInError);
        toast.info(t("auth.register.accountCreated"));
        router.push("/login");
      }
      reset();
    } catch (err) {
      const errorMessage = getErrorMessage(
        err,
        t("auth.register.registrationError"),
      );

      setGeneralError(errorMessage);
      toast.error(errorMessage);
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
            {t("auth.register.title")}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {t("auth.register.subtitle")}
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="relative bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-5"
        >
          {generalError && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
              {generalError}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">
              {t("auth.register.firstName")}
            </label>
            <Input
              {...register("first_name", {
                required: t("auth.register.firstNameRequired"),
              })}
              type="text"
              placeholder="e.g. Jean-Pierre"
              className=" rounded-xl py-5 px-4"
            />
            {errors.first_name && (
              <div className="text-sm text-red-600 mt-1">
                {errors.first_name.message}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">
              {t("auth.register.lastName")}
            </label>
            <Input
              {...register("last_name", { required: t("auth.register.lastNameRequired") })}
              type="text"
              placeholder="e.g. Mbarga"
              className=" rounded-xl py-5 px-4"
            />
            {errors.last_name && (
              <div className="text-sm text-red-600 mt-1">
                {errors.last_name.message}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">
              {t("auth.register.email")}
            </label>
            <Input
              {...register("email", { required: t("auth.register.emailRequired") })}
              type="email"
              placeholder="you@example.com"
              className=" rounded-xl py-5 px-4"
            />
            {errors.email && (
              <div className="text-sm text-red-600 mt-1">
                {errors.email.message}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">
              {t("auth.register.phone")}
            </label>
            <Controller
              name="phone"
              control={control}
              rules={{ required: t("auth.register.phoneRequired") }}
              render={({ field }) => (
                <InputPhone
                  {...field}
                  // placeholder=""
                  defaultCountry="CM"
                  className=""
                />
              )}
            />
            {errors.phone && (
              <div className="text-sm text-red-600 mt-1">
                {errors.phone.message}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">
              {t("auth.register.password")}
            </label>
            <div className="relative">
              <Input
                {...register("password", { required: t("auth.register.passwordRequired") })}
                type={showPassword ? "text" : "password"}
                placeholder={t("auth.register.passwordPlaceholder")}
                className="pr-12 rounded-xl py-5 px-4"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <div className="text-sm text-red-600 mt-1">
                {errors.password.message}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">
              {t("auth.register.confirmPassword")}
            </label>
            <Input
              {...register("confirmPassword", {
                required: t("auth.register.confirmRequired"),
              })}
              type="password"
              placeholder={t("auth.register.confirmPlaceholder")}
              className="rounded-xl py-5 px-4"
            />
            {errors.confirmPassword && (
              <div className="text-sm text-red-600 mt-1">
                {errors.confirmPassword.message}
              </div>
            )}
          </div>

          <div
            aria-hidden="true"
            className="absolute -left-2500 top-auto w-px h-px overflow-hidden"
          >
            <label htmlFor="website">Website</label>
            <input
              {...register("website")}
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
            style={{ background: "var(--primary)" }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {t("auth.register.loading")}
              </>
            ) : (
              t("auth.register.button")
            )}
          </button>

          <p className="text-center text-sm text-gray-500">
            {t("auth.register.haveAccount")}{" "}
            <Link
              href="/login"
              className="text-[#1DB1DB] font-semibold hover:underline"
            >
              {t("auth.register.signIn")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
