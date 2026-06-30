"use client";

import { TicketForm } from "@/components/support";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function HospitalAdminNewTicketPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/hospital-admin/support">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Support Ticket</h1>
          <p className="text-muted-foreground">
            Describe your issue or request and we'll help you
          </p>
        </div>
      </div>

      <TicketForm basePath="/dashboard/hospital-admin" />
    </div>
  );
}
