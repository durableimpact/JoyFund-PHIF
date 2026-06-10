"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  const [error, setError] = useState("");

  const handleSubmit = async (data: HospitalFormData): Promise<void> => {
    try {
      setIsLoading(true);
      setError("");

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
        lat: data.lat || undefined,
        lng: data.lng || undefined,
        partnership_status: "PENDING",
        is_active: true,
      });

      // Invalidate hospitals query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });

      // Redirect back to hospitals list
      router.push("/dashboard/system-admin/hospitals");
    } catch (err) {
      try {
        const errorString = err instanceof Error ? err.message : String(err);
        const parsed = JSON.parse(errorString || "{}");
        setError(
          (parsed?.detail as string) ||
            (parsed?.name?.[0] as string) ||
            "Failed to create hospital",
        );
      } catch {
        setError("Failed to create hospital. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <HospitalForm
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
      isEditMode={false}
    />
  );
}
