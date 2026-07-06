"use client";
import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Navigation,
  Building2,
  FileCheck,
  Phone,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

const LocationPickerMap = dynamic(
  () => import("@/components/shared/LocationPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full rounded-xl bg-gray-100 animate-pulse flex items-center justify-center"
        style={{ height: 280 }}
      >
        <MapPin size={24} className="text-gray-300" />
      </div>
    ),
  },
);

const CAMEROON_REGIONS = [
  "Adamawa",
  "Centre",
  "East",
  "Far North",
  "Littoral",
  "North",
  "North West",
  "South",
  "South West",
  "West",
];
const PARTNERSHIP_STATUSES = [
  "PENDING",
  "ACTIVE",
  "INACTIVE",
  "REJECTED",
] as const;

const hospitalSchema = z.object({
  name: z.string().min(2, "Hospital name is required"),
  region: z.string().min(1, "Region is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  accreditation_number: z.string().min(1, "Accreditation number is required"),
  licence_number: z.string().min(1, "Licence number is required"),
  phone_number: z
    .string()
    .min(6, "Phone number is required")
    .regex(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/,
      "Invalid phone number",
    ),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  website: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(v),
      "Invalid website URL",
    ),
  momo_number: z.string().optional(),
  momo_name: z.string().optional(),
  orange_number: z.string().optional(),
  orange_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_account_name: z.string().optional(),
  bank_name: z.string().optional(),
  bank_branch: z.string().optional(),
  partnership_status: z.enum(["PENDING", "ACTIVE", "INACTIVE", "REJECTED"]).optional(),
  is_active: z.boolean().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

export type HospitalFormData = z.infer<typeof hospitalSchema>;

const basicFields = ["name", "region", "city", "address"] as const;
const locationFields = ["lat", "lng"] as const;
const licensingFields = ["accreditation_number", "licence_number"] as const;
const contactFields = ["phone_number", "email", "website"] as const;
const paymentFields = [
  "momo_number",
  "momo_name",
  "orange_number",
  "orange_name",
  "bank_account_number",
  "bank_account_name",
  "bank_name",
  "bank_branch",
] as const;

const STEPS = [
  {
    key: "basic",
    label: "Basic Info",
    num: 1,
    icon: Building2,
    fields: basicFields,
  },
  {
    key: "location",
    label: "Location",
    num: 2,
    icon: MapPin,
    fields: locationFields,
  },
  {
    key: "licensing",
    label: "Licensing",
    num: 3,
    icon: FileCheck,
    fields: licensingFields,
  },
  {
    key: "contact",
    label: "Contact",
    num: 4,
    icon: Phone,
    fields: contactFields,
  },
  {
    key: "payment",
    label: "Payment",
    num: 5,
    icon: CreditCard,
    fields: paymentFields,
  },
] as const;

type Step = (typeof STEPS)[number];

interface HospitalFormProps {
  initialData?: HospitalFormData & { id?: string };
  onSubmit: (data: HospitalFormData) => Promise<void>;
  isLoading?: boolean;
  isEditMode?: boolean;
}

export default function HospitalForm({
  initialData,
  onSubmit,
  isLoading = false,
  isEditMode = false,
}: HospitalFormProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [geoLoading, setGeoLoading] = useState(false);

  const form = useForm<HospitalFormData>({
    resolver: zodResolver(hospitalSchema),
    mode: "onChange",
    defaultValues: initialData || {
      name: "",
      accreditation_number: "",
      licence_number: "",
      region: "",
      city: "",
      address: "",
      phone_number: "",
      email: "",
      website: "",
      partnership_status: "PENDING",
      is_active: true,
      momo_number: "",
      momo_name: "",
      orange_number: "",
      orange_name: "",
      bank_account_number: "",
      bank_account_name: "",
      bank_name: "",
      bank_branch: "",
      lat: null,
      lng: null,
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = form;

  const lat = watch("lat");
  const lng = watch("lng");
  const selectedCoords: [number, number] | null =
    lat != null && lng != null ? [lat, lng] : null;

  const currentStep = STEPS[stepIdx];

  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 1e6) / 1e6;
        const lng = Math.round(pos.coords.longitude * 1e6) / 1e6;
        setValue("lat", lat, { shouldValidate: true });
        setValue("lng", lng, { shouldValidate: true });
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [setValue]);

  const validateCurrentStep = async (): Promise<boolean> => {
    const fieldNames = currentStep.fields as readonly string[];
    if (fieldNames.length === 0) return true;
    const valid = await trigger(fieldNames as any);
    return valid;
  };

  const next = async () => {
    const ok = await validateCurrentStep();
    if (!ok) return;
    setStepIdx((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const prev = () => setStepIdx((prev) => Math.max(prev - 1, 0));

  const goToStep = async (target: number) => {
    if (target < stepIdx) {
      setStepIdx(target);
      return;
    }
    for (let i = stepIdx; i < target; i++) {
      const s = STEPS[i];
      const fieldNames = s.fields as readonly string[];
      if (fieldNames.length > 0) {
        const ok = await trigger(fieldNames as any);
        if (!ok) return;
      }
    }
    setStepIdx(target);
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard/system-admin/hospitals"
            className="p-2.5 hover:bg-white rounded-xl transition-colors border border-gray-200 bg-white/50 backdrop-blur-sm"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              {isEditMode ? "Edit Hospital" : "Add New Hospital"}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Step {stepIdx + 1} of {STEPS.length} &mdash; {currentStep.label}
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-8 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => {
              const done = i < stepIdx;
              const active = i === stepIdx;
              const Icon = s.icon;
              return (
                <div key={s.key} className="flex items-center gap-1 flex-1">
                  <button
                    type="button"
                    onClick={() => goToStep(i)}
                    className={`flex items-center justify-center gap-2 flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      done
                        ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-150"
                        : active
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                          : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                    }`}
                  >
                    {done ? (
                      <Check size={14} strokeWidth={2.5} />
                    ) : (
                      <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                    )}
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`w-3 h-px shrink-0 ${
                        i < stepIdx ? "bg-indigo-300" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8">
              {/* Step 1: Basic Info */}
              {stepIdx === 0 && (
                <section className="space-y-5">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      Hospital Information
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Enter the basic details of the hospital
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <Field
                        label="Hospital Name *"
                        error={errors.name?.message}
                      >
                        <input
                          {...register("name")}
                          placeholder="e.g. Central Hospital Yaoundé"
                          className="input-field"
                        />
                      </Field>
                    </div>
                    <Field label="Region *" error={errors.region?.message}>
                      <Controller
                        name="region"
                        control={control}
                        render={({ field }) => (
                          <select
                            className="input-field"
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(e.target.value || undefined)
                            }
                          >
                            <option value="">— Select Region —</option>
                            {CAMEROON_REGIONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                    </Field>
                    <Field label="City *" error={errors.city?.message}>
                      <input
                        {...register("city")}
                        placeholder="e.g. Yaoundé"
                        className="input-field"
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field
                        label="Address *"
                        error={errors.address?.message}
                      >
                        <input
                          {...register("address")}
                          placeholder="Street address, quarter..."
                          className="input-field"
                        />
                      </Field>
                    </div>
                  </div>
                </section>
              )}

              {/* Step 2: Location */}
              {stepIdx === 1 && (
                <section className="space-y-5">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <MapPin size={18} className="text-indigo-500" />
                      Pick Location
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Click on the map to place a pin or use your current
                      location
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Map
                      </label>
                      <button
                        type="button"
                        onClick={handleGeolocation}
                        disabled={geoLoading}
                        className="text-xs font-semibold flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        <Navigation
                          size={13}
                          className={geoLoading ? "animate-pulse" : ""}
                        />
                        {geoLoading ? "Locating..." : "Use my location"}
                      </button>
                    </div>
                    <Controller
                      name="lat"
                      control={control}
                      render={({ field: latField }) => (
                        <Controller
                          name="lng"
                          control={control}
                          render={({ field: lngField }) => (
                            <LocationPickerMap
                              value={selectedCoords}
                              onChange={(newLat, newLng) => {
                                latField.onChange(newLat);
                                lngField.onChange(newLng);
                              }}
                            />
                          )}
                        />
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <Field label="Latitude">
                        <input
                          {...register("lat", { valueAsNumber: true })}
                          type="number"
                          step="any"
                          placeholder="e.g. 3.848"
                          className="input-field text-sm"
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value);
                            if (!isNaN(v)) setValue("lat", Math.round(v * 1e6) / 1e6, { shouldValidate: true });
                          }}
                        />
                      </Field>
                      <Field label="Longitude">
                        <input
                          {...register("lng", { valueAsNumber: true })}
                          type="number"
                          step="any"
                          placeholder="e.g. 11.502"
                          className="input-field text-sm"
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value);
                            if (!isNaN(v)) setValue("lng", Math.round(v * 1e6) / 1e6, { shouldValidate: true });
                          }}
                        />
                      </Field>
                    </div>
                  </div>
                </section>
              )}

              {/* Step 3: Licensing */}
              {stepIdx === 2 && (
                <section className="space-y-5">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <FileCheck size={18} className="text-indigo-500" />
                      Licensing & Compliance
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Official accreditation and licence details
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field
                      label="Accreditation Number *"
                      error={errors.accreditation_number?.message}
                    >
                      <input
                        {...register("accreditation_number")}
                        placeholder="e.g. ACC-2024-001"
                        className="input-field"
                      />
                    </Field>
                    <Field
                      label="Licence Number *"
                      error={errors.licence_number?.message}
                    >
                      <input
                        {...register("licence_number")}
                        placeholder="e.g. LIC-2024-001"
                        className="input-field"
                      />
                    </Field>
                  </div>
                </section>
              )}

              {/* Step 4: Contact */}
              {stepIdx === 3 && (
                <section className="space-y-5">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Phone size={18} className="text-indigo-500" />
                      Contact Information
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      How to reach the hospital
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field
                      label="Phone Number *"
                      error={errors.phone_number?.message}
                    >
                      <input
                        {...register("phone_number")}
                        type="tel"
                        placeholder="+237 6XX XXX XXX"
                        className="input-field"
                      />
                    </Field>
                    <Field label="Email *" error={errors.email?.message}>
                      <input
                        {...register("email")}
                        type="email"
                        placeholder="hospital@example.com"
                        className="input-field"
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field
                        label="Website"
                        error={errors.website?.message}
                      >
                        <input
                          {...register("website")}
                          placeholder="https://hospital.com"
                          className="input-field"
                        />
                      </Field>
                    </div>
                  </div>
                </section>
              )}

              {/* Step 5: Payment */}
              {stepIdx === 4 && (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <CreditCard size={18} className="text-indigo-500" />
                      Payment Details
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Optional — add payment accounts for the hospital
                    </p>
                  </div>

                  {/* Mobile Money */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Mobile Money
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Field label="MoMo Number">
                        <input
                          {...register("momo_number")}
                          placeholder="+237 6XX XXX XXX"
                          className="input-field"
                        />
                      </Field>
                      <Field label="MoMo Name">
                        <input
                          {...register("momo_name")}
                          placeholder="Account holder name"
                          className="input-field"
                        />
                      </Field>
                      <Field label="Orange Money Number">
                        <input
                          {...register("orange_number")}
                          placeholder="+237 6XX XXX XXX"
                          className="input-field"
                        />
                      </Field>
                      <Field label="Orange Money Name">
                        <input
                          {...register("orange_name")}
                          placeholder="Account holder name"
                          className="input-field"
                        />
                      </Field>
                    </div>
                  </div>

                  {/* Bank */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Bank Account
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2">
                        <Field label="Account Number">
                          <input
                            {...register("bank_account_number")}
                            placeholder="Account number"
                            className="input-field"
                          />
                        </Field>
                      </div>
                      <Field label="Account Name">
                        <input
                          {...register("bank_account_name")}
                          placeholder="Account holder name"
                          className="input-field"
                        />
                      </Field>
                      <Field label="Bank Name">
                        <input
                          {...register("bank_name")}
                          placeholder="e.g. Afriland First Bank"
                          className="input-field"
                        />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Branch">
                          <input
                            {...register("bank_branch")}
                            placeholder="Branch location"
                            className="input-field"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>

                  {/* Status (Edit Mode) */}
                  {isEditMode && (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Status
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field label="Partnership Status">
                          <Controller
                            name="partnership_status"
                            control={control}
                            render={({ field }) => (
                              <select
                                className="input-field"
                                value={field.value || "PENDING"}
                                onChange={(e) => field.onChange(e.target.value)}
                              >
                                {PARTNERSHIP_STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {status.charAt(0) +
                                      status.slice(1).toLowerCase()}
                                  </option>
                                ))}
                              </select>
                            )}
                          />
                        </Field>
                        <Field label="Active Status">
                          <label className="flex items-center gap-3 cursor-pointer py-2.5">
                            <Controller
                              name="is_active"
                              control={control}
                              render={({ field }) => (
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={field.value ?? true}
                                  onClick={() =>
                                    field.onChange(field.value ?? true ? false : true)
                                  }
                                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                    field.value ?? true
                                      ? "bg-indigo-600"
                                      : "bg-gray-200"
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                      (field.value ?? true)
                                        ? "translate-x-5"
                                        : "translate-x-0"
                                    }`}
                                  />
                                </button>
                              )}
                            />
                            <span className="text-sm text-gray-700 font-medium">
                              {watch("is_active") ?? true
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </label>
                        </Field>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Navigation Footer */}
            <div className="px-6 sm:px-8 py-5 bg-gray-50/80 border-t border-gray-100 flex gap-3 justify-between items-center">
              <div>
                {stepIdx > 0 ? (
                  <button
                    type="button"
                    onClick={prev}
                    className="btn-outline flex items-center gap-1.5"
                  >
                    <ChevronLeft size={14} />
                    Back
                  </button>
                ) : (
                  <Link
                    href="/dashboard/system-admin/hospitals"
                    className="btn-outline flex items-center gap-1.5"
                  >
                    <ChevronLeft size={14} />
                    Cancel
                  </Link>
                )}
              </div>

              {stepIdx < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  className="py-2.5 px-6 rounded-xl font-bold text-sm text-white flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Continue
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-2.5 px-6 rounded-xl font-bold text-sm text-white disabled:opacity-60 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  {isEditMode ? "Update Hospital" : "Create Hospital"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-1 font-medium">{error}</p>}
    </div>
  );
}
