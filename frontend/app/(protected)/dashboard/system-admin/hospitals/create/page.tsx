"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { createHospital } from "@/actions/hospital";
import HospitalForm, { HospitalFormData } from "../_components/HospitalForm";

export default function CreateHospitalPage() {
  const { data: session } = useSession();
  const token =
    session?.accessToken ||
    (session?.user as { accessToken?: string })?.accessToken;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: HospitalFormData): Promise<void> => {
    try {
      setIsLoading(true);

      await createHospital(token as string, {
        name: data.name,
        accreditation_number: data.accreditation_number,
        licence_number: data.licence_number,
        region: data.region,
        city: data.city,
        address: data.address,
        phone_number: data.phone_number,
        email: data.email,
        website: data.website || undefined,
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
        partnership_status: "PENDING",
        is_active: true,
      });

      toast.success("Hospital created successfully");
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      router.push("/dashboard/system-admin/hospitals");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create hospital";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <HospitalForm
      onSubmit={handleSubmit}
      isLoading={isLoading}
      isEditMode={false}
    />
  );
}
