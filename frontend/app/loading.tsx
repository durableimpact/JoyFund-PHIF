import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-[#1DB1DB]/20 border-t-[#1DB1DB] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
             <HeartIcon className="h-6 w-6 text-[#1DB1DB] animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-lg font-black tracking-tight text-[#1A1A2E]">
            JoyFund
          </p>
          <p className="text-xs font-medium text-gray-500 animate-pulse">
            Loading your experience...
          </p>
        </div>
      </div>
    </div>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
    >
      <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001Z" />
    </svg>
  );
}
