"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { roleRedirectMap } from "@/lib/role-redirect";
import { useI18n } from "@/locales/client";

export default function DashboardPage() {
    const router = useRouter();
    const t = useI18n();

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
                <p className="text-xl">{t("dashboard.main.loading")}</p>
            </div>
        );
    }

    return null;
}