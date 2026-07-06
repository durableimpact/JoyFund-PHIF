"use client";
import { cn } from "@/lib/utils";
import { useChangeLocale, useCurrentLocale } from "@/locales/client";
import { Languages } from "lucide-react";

export function LocaleSwitcher({
  dark = false,
  className,
}: {
  dark?: boolean;
  className?: string;
}) {
  const changeLocale = useChangeLocale();
  const currentLocale = useCurrentLocale();

  const toggleLocale = () => {
    changeLocale(currentLocale === "en" ? "fr" : "en");
  };

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={cn(
        `flex items-center gap-1.5 cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition-colors`,
        dark
          ? "text-white/80 hover:bg-white/10 hover:text-white"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      )}
      aria-label={`Switch language to ${currentLocale === "en" ? "French" : "English"}`}
    >
      <Languages size={16} />
      <span>{currentLocale === "en" ? "FR" : "EN"}</span>
    </button>
  );
}
