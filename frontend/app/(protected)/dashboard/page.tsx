"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { roleRedirectMap } from "@/lib/role-redirect";

export default function DashboardPage() {
    const router = useRouter();

    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "loading") return;

        if (status === "unauthenticated") {
            router.replace("/login");
            return;
        }

        if (status === "authenticated") {
            const role = session?.user?.role;
            if (role && roleRedirectMap[role]) {
                router.replace(roleRedirectMap[role]);
            } else {
                console.warn("[DashboardPage] No role found in session, redirecting to login", { session });
                router.replace("/login");
            }
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