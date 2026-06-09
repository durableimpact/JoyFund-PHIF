import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { getSession } from "@/lib/auth-server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: "JoyFund",
  },
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}
