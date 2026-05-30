"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { roleRedirectMap } from "@/lib/role-redirect";

export default function DashboardPage() {
    const router = useRouter();

    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "authenticated" && session?.user?.role) {
            router.replace(roleRedirectMap[session.user.role]);
        }
    }, [status, session, router]);

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-xl">Loading...</p>
            </div>
        );
    }

    return null;
}