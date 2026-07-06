"use client";

import Link from "next/link";
import { Tag, Settings, Award } from "lucide-react";
import { formatXAF } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  DRAFT: "bg-gray-100 text-gray-600",
  FUNDED: "bg-blue-50 text-blue-700",
  CLOSED: "bg-red-50 text-red-700",
  INACTIVE: "bg-orange-50 text-orange-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export default function CampaignDashboardCard({ campaign }: { campaign: any }) {
  const progress = campaign.progress_percentage || 0;
  const statusClass = statusStyles[campaign.status as string] || "bg-gray-100 text-gray-600";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-[#E2E8F0] transition-all hover:ring-[#1DB1DB]/30">
      <div className="flex flex-1 flex-col p-5">
        {/* Status + Event type */}
        <div className="mb-4 flex items-center justify-between">
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusClass}`}>
            {campaign.status}
          </span>
          <div className="flex items-center gap-2">
            {campaign.certificate_generated && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                <Award className="size-3" /> Certificate
              </span>
            )}
            <Tag className="size-3.5 text-[#94A3B8]" />
            <span className="text-[11px] font-medium text-[#64748B]">
              {campaign.event_type}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-5 min-h-10 font-heading font-semibold leading-snug text-[#0F172A] line-clamp-2">
          {campaign.title}
        </h3>

        {/* Raised / Goal */}
        <div className="mb-5 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">Raised</p>
              <p className="font-heading text-sm font-bold text-[#1DB1DB]">
                {formatXAF(Number(campaign.total_net_raised))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">Goal</p>
              <p className="text-sm font-semibold text-[#475569]">
                {formatXAF(Number(campaign.goal_amount))}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
            <div
              className="h-full rounded-full bg-[#1DB1DB] transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-right text-[10px] font-semibold text-[#94A3B8]">
            {progress.toFixed(2)}% Complete
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4">
        <Link
          href={`/dashboard/donor/campaigns/${campaign.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-[#0F172A] ring-1 ring-[#E2E8F0] transition-all hover:bg-[#F1F5F9]"
        >
          <Settings className="size-3.5" />
          Manage Campaign
        </Link>
      </div>
    </div>
  );
}
