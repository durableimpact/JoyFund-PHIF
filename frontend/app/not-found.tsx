import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <div className="relative mb-8">
        <div className="text-[120px] font-black leading-none text-[#1DB1DB]/10 select-none md:text-[180px]">
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-24 w-24 rounded-3xl bg-[#1DB1DB]/10 flex items-center justify-center rotate-12 md:h-32 md:w-32">
            <Search size={48} className="text-[#1DB1DB] -rotate-12 md:size-64" />
          </div>
        </div>
      </div>

      <h1 className="mb-4 text-3xl font-black text-[#1A1A2E] md:text-4xl">
        Page Not Found
      </h1>

      <p className="mb-10 max-w-md text-gray-500 leading-relaxed">
        The page you are looking for does not exist or has been moved.
        Let&apos;s get you back on track.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#1DB1DB] px-8 py-4 font-bold text-white shadow-lg shadow-[#1DB1DB]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Home size={20} />
          Back to Home
        </Link>

        <Link
          href="/explore"
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-gray-100 bg-white px-8 py-4 font-bold text-gray-600 transition-all hover:bg-gray-50 hover:border-gray-200"
        >
          Explore Campaigns
        </Link>
      </div>
    </div>
  );
}
