"use client";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { getHospital, updateHospital } from "@/actions/hospital";
import HospitalForm, { HospitalFormData } from "../../_components/HospitalForm";

export default function EditHospitalPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const token =
    session?.accessToken ||
    (session?.user as { accessToken?: string })?.accessToken;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch hospital data
  const { data: hospital, isLoading: isLoadingHospital } = useQuery<Hospital>({
    queryKey: ["hospital", id, token],
    queryFn: () => getHospital(id, token),
    enabled: !!token && !!id,
  });

  const handleSubmit = async (data: HospitalFormData): Promise<void> => {
    if (!hospital) return;

    try {
      setIsLoading(true);
      setError("");

      await updateHospital(hospital.id, token, {
        name: data.name,
        accreditation_number: data.accreditation_number,
        licence_number: data.licence_number,
        region: data.region,
        city: data.city,
        address: data.address,
        phone_number: data.phone_number,
        email: data.email,
        website: data.website || undefined,
        partnership_status: data.partnership_status || "PENDING",
        is_active: data.is_active ?? true,
        momo_number: data.momo_number || undefined,
        momo_name: data.momo_name || undefined,
        orange_number: data.orange_number || undefined,
        orange_name: data.orange_name || undefined,
        bank_account_number: data.bank_account_number || undefined,
        bank_account_name: data.bank_account_name || undefined,
        bank_name: data.bank_name || undefined,
        bank_branch: data.bank_branch || undefined,
        lat: data.lat || undefined,
        lng: data.lng || undefined,
      });

      // Invalidate hospitals queries to refresh
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      queryClient.invalidateQueries({ queryKey: ["hospital", id] });

      // Redirect back to hospital detail page
      router.push(`/dashboard/system-admin/hospitals/${id}`);
    } catch (err) {
      try {
        const errorString = err instanceof Error ? err.message : String(err);
        const parsed = JSON.parse(errorString || "{}");
        setError(
          (parsed?.detail as string) ||
            (parsed?.name?.[0] as string) ||
            "Failed to update hospital",
        );
      } catch {
        setError("Failed to update hospital. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingHospital) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <Loader2 size={32} className="animate-spin mx-auto text-gray-400" />
          <p className="text-gray-500">Loading hospital details...</p>
        </div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">Hospital not found</p>
        </div>
      </div>
    );
  }

  const initialData: HospitalFormData & { id?: string } = {
    id: hospital.id,
    name: hospital.name || "",
    accreditation_number: hospital.accreditation_number || "",
    licence_number: hospital.licence_number || "",
    region: hospital.region || "",
    city: hospital.city || "",
    address: hospital.address || "",
    phone_number: hospital.phone_number || "",
    email: hospital.email || "",
    website: hospital.website || "",
    partnership_status: hospital.partnership_status || "PENDING",
    is_active: hospital.is_active ?? true,
    momo_number: hospital.momo_number || "",
    momo_name: hospital.momo_name || "",
    orange_number: hospital.orange_number || "",
    orange_name: hospital.orange_name || "",
    bank_account_number: hospital.bank_account_number || "",
    bank_account_name: hospital.bank_account_name || "",
    bank_name: hospital.bank_name || "",
    bank_branch: hospital.bank_branch || "",
    lat: hospital.lat ?? null,
    lng: hospital.lng ?? null,
  };

  return (
    <HospitalForm
      initialData={initialData}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
      isEditMode={true}
    />
  );
}
