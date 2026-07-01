"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/actions/api";

const SOURCE_MAP: Record<string, CampaignViewSource> = {
  push: "push",
  fb: "social",
  facebook: "social",
  tw: "social",
  twitter: "social",
  ig: "social",
  instagram: "social",
  linkedin: "social",
  whatsapp: "social",
  google: "google",
  email: "email",
};

export function useCampaignViewTracker(campaignId: string | undefined) {
  const searchParams = useSearchParams();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!campaignId || hasTracked.current) return;
    hasTracked.current = true;

    const src = searchParams.get("src") || "";
    const source: CampaignViewSource = SOURCE_MAP[src.toLowerCase()] || "direct";

    api
      .post(`/api/campaigns/${campaignId}/track-view/`, {
        source,
        referrer: document.referrer || "",
      })
      .catch(() => {});
  }, [campaignId, searchParams]);
}
