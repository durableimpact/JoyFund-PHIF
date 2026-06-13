import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl">
          <Image
            src="/assets/joyfund-logo-half-removebg-preview.webp"
            alt="JoyFund logo"
            width={72}
            height={72}
            priority
            className="object-contain"
          />
        </div>

        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <Loader2 size={16} className="animate-spin text-[#1DB1DB]" />
          <span>Loading...</span>
        </div>
      </div>
    </div>
  );
}
