"use client";
import { useI18n } from '@/locales/client';
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getHospital, updateHospital } from "@/actions/hospital";
import HospitalForm, { HospitalFormData } from "../../_components/HospitalForm";
import { DetailPageSkeleton } from "@/components/shared/PageSkeletons";

export default function EditHospitalPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const token =
    session?.accessToken ||
    (session?.user as { accessToken?: string })?.accessToken;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const { data: hospital, isLoading: isLoadingHospital } = useQuery<Hospital>({
    queryKey: ["hospital", id, token],
    queryFn: () => getHospital(id, token),
    enabled: !!token && !!id,
  });

  const handleSubmit = async (data: HospitalFormData): Promise<void> => {
    if (!hospital) return;

    try {
      setIsLoading(true);

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
        lat: data.lat ? Math.round(data.lat * 1e6) / 1e6 : undefined,
        lng: data.lng ? Math.round(data.lng * 1e6) / 1e6 : undefined,
      });

      toast.success("Hospital updated successfully");
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      queryClient.invalidateQueries({ queryKey: ["hospital", id] });
      router.push(`/dashboard/system-admin/hospitals/${id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update hospital";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingHospital) {
    return <DetailPageSkeleton />;
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
      isEditMode={true}
    />
  );
}
