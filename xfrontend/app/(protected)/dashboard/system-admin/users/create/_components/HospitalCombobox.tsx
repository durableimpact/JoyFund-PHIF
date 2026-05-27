"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { listHospitals } from "@/actions/hospital";

interface HospitalComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function HospitalCombobox({ value, onChange, placeholder = "— Select Hospital —" }: HospitalComboboxProps) {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const { data: hospitals = [], isLoading } = useQuery<Hospital[]>({
    queryKey: ["hospitals", token],
    queryFn: () => listHospitals(token),
    enabled: !!token,
  });

  const selectedHospital = hospitals.find((h) => h.id === value);

  const filtered = inputValue
    ? hospitals.filter(
        (h) =>
          h.name.toLowerCase().includes(inputValue.toLowerCase()) ||
          h.city.toLowerCase().includes(inputValue.toLowerCase())
      )
    : hospitals;

  return (
    <Combobox
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) setInputValue("");
      }}
      value={value}
      onValueChange={(val) => onChange(val)}
    >
      <ComboboxInput
        placeholder={selectedHospital ? `${selectedHospital.name} · ${selectedHospital.city}` : placeholder}
        showTrigger
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
      />
      <ComboboxContent>
        <ComboboxList>
          {isLoading ? (
            <ComboboxItem value="" disabled>
              Loading hospitals…
            </ComboboxItem>
          ) : filtered.length === 0 ? (
            <ComboboxEmpty>No hospitals found</ComboboxEmpty>
          ) : (
            filtered.map((h) => (
              <ComboboxItem key={h.id} value={h.id}>
                {h.name}
                <span className="ml-auto text-xs text-muted-foreground">{h.city}</span>
              </ComboboxItem>
            ))
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
