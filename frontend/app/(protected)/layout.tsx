import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  console.log("Session : ",session)

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
