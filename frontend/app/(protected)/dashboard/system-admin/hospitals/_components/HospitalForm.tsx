"use client";
import { useForm, Controller } from "react-hook-form";
import dynamic from "next/dynamic";
import { AlertCircle, MapPin, ArrowLeft, Loader2 } from "lucide-react";
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

export interface HospitalFormData {
  name: string;
  accreditation_number: string;
  licence_number: string;
  region: string;
  city: string;
  address: string;
  phone_number: string;
  email: string;
  website?: string;
  partnership_status?: "PENDING" | "ACTIVE" | "INACTIVE" | "REJECTED";
  is_active?: boolean;
  momo_number?: string;
  momo_name?: string;
  orange_number?: string;
  orange_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  bank_name?: string;
  bank_branch?: string;
  lat?: number | null;
  lng?: number | null;
}

interface HospitalFormProps {
  initialData?: HospitalFormData & { id?: string };
  onSubmit: (data: HospitalFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  isEditMode?: boolean;
}

export default function HospitalForm({
  initialData,
  onSubmit,
  isLoading = false,
  error,
  isEditMode = false,
}: HospitalFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm<HospitalFormData>({
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

  const lat = watch("lat");
  const lng = watch("lng");
  const selectedCoords: [number, number] | null =
    lat !== null && lng !== null ? [lat, lng] : null;

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition((position) => {
      setValue("lat", position.coords.latitude);
      setValue("lng", position.coords.longitude);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/system-admin/hospitals"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {isEditMode ? "Edit Hospital" : "Add New Hospital"}
          </h1>
          <p className="text-gray-500 text-sm">
            Fill in the hospital details below
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
          <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="card space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Name *
              </label>
              <input
                {...register("name", {
                  required: "Hospital name is required",
                  minLength: {
                    value: 2,
                    message: "Name must be at least 2 characters",
                  },
                })}
                placeholder="e.g. Central Hospital"
                className={`input-field ${errors.name ? "border-red-300 focus:ring-red-200" : ""}`}
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Region *
              </label>
              <select
                {...register("region", { required: "Region is required" })}
                className={`input-field ${errors.region ? "border-red-300 focus:ring-red-200" : ""}`}
              >
                <option value="">— Select Region —</option>
                {CAMEROON_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {errors.region && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.region.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                City *
              </label>
              <input
                {...register("city", { required: "City is required" })}
                placeholder="e.g. Yaoundé"
                className={`input-field ${errors.city ? "border-red-300 focus:ring-red-200" : ""}`}
              />
              {errors.city && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.city.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Address *
              </label>
              <input
                {...register("address", { required: "Address is required" })}
                placeholder="Street address"
                className={`input-field ${errors.address ? "border-red-300 focus:ring-red-200" : ""}`}
              />
              {errors.address && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.address.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
            Location
          </h2>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700">
                Pick location on map or use GPS
              </label>
              <button
                type="button"
                onClick={handleGeolocation}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Use current location
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Latitude
                </label>
                <input
                  {...register("lat")}
                  type="number"
                  step="any"
                  placeholder="e.g. 3.848"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Longitude
                </label>
                <input
                  {...register("lng")}
                  type="number"
                  step="any"
                  placeholder="e.g. 11.502"
                  className="input-field text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Licensing & Compliance */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
            Licensing & Compliance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Accreditation # *
              </label>
              <input
                {...register("accreditation_number", {
                  required: "Accreditation number is required",
                })}
                placeholder="e.g. ACC-2024-001"
                className={`input-field ${errors.accreditation_number ? "border-red-300 focus:ring-red-200" : ""}`}
              />
              {errors.accreditation_number && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.accreditation_number.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Licence # *
              </label>
              <input
                {...register("licence_number", {
                  required: "Licence number is required",
                })}
                placeholder="e.g. LIC-2024-001"
                className={`input-field ${errors.licence_number ? "border-red-300 focus:ring-red-200" : ""}`}
              />
              {errors.licence_number && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.licence_number.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Phone *
              </label>
              <input
                {...register("phone_number", {
                  required: "Phone number is required",
                  pattern: {
                    value:
                      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/,
                    message: "Invalid phone number",
                  },
                })}
                placeholder="+237 6XX XXX XXX"
                className={`input-field ${errors.phone_number ? "border-red-300 focus:ring-red-200" : ""}`}
              />
              {errors.phone_number && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.phone_number.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Email *
              </label>
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email address",
                  },
                })}
                type="email"
                placeholder="hospital@example.com"
                className={`input-field ${errors.email ? "border-red-300 focus:ring-red-200" : ""}`}
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
              Website
            </label>
            <input
              {...register("website", {
                pattern: {
                  value:
                    /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                  message: "Invalid website URL",
                },
              })}
              placeholder="https://hospital.com"
              className={`input-field ${errors.website ? "border-red-300 focus:ring-red-200" : ""}`}
            />
            {errors.website && (
              <p className="text-xs text-red-600 mt-1">
                {errors.website.message}
              </p>
            )}
          </div>
        </div>

        {/* Payment Details */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
            Payment Details (Optional)
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  MoMo Number
                </label>
                <input
                  {...register("momo_number")}
                  placeholder="+237 6XX XXX XXX"
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  MoMo Name
                </label>
                <input
                  {...register("momo_name")}
                  placeholder="Account holder"
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  Orange Money Number
                </label>
                <input
                  {...register("orange_number")}
                  placeholder="+237 6XX XXX XXX"
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  Orange Money Name
                </label>
                <input
                  {...register("orange_name")}
                  placeholder="Account holder"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Bank Account Number
              </label>
              <input
                {...register("bank_account_number")}
                placeholder="Account number"
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  Bank Account Name
                </label>
                <input
                  {...register("bank_account_name")}
                  placeholder="Account holder"
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  Bank Name
                </label>
                <input
                  {...register("bank_name")}
                  placeholder="e.g. Afriland"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Bank Branch
              </label>
              <input
                {...register("bank_branch")}
                placeholder="Branch location"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Status (Edit Mode Only) */}
        {isEditMode && (
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
              Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  Partnership Status
                </label>
                <select
                  {...register("partnership_status")}
                  className="input-field"
                >
                  {PARTNERSHIP_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                  <input
                    {...register("is_active")}
                    type="checkbox"
                    className="rounded"
                  />
                  Active Hospital
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="border-t border-gray-200 pt-6 flex gap-3 justify-end">
          <Link
            href="/dashboard/system-admin/hospitals"
            className="btn-outline px-6"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="py-2.5 px-6 rounded-xl font-bold text-sm text-white disabled:opacity-60 flex items-center gap-2 transition-colors"
            style={{ background: "#471DDB" }}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isEditMode ? "Update Hospital" : "Create Hospital"}
          </button>
        </div>
      </div>
    </form>
  );
}
