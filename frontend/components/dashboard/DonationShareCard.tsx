"use client";

import { forwardRef } from "react";
import { formatXAF } from "@/lib/utils";
import { useI18n } from "@/locales/client";

interface DonationShareCardProps {
  donorName: string;
  totalDonations: number;
  totalAmount: number;
  averageDonation: number;
  campaignCount: number;
}

const DonationShareCard = forwardRef<HTMLDivElement, DonationShareCardProps>(
  ({ donorName, totalDonations, totalAmount, averageDonation, campaignCount }, ref) => {
    const t = useI18n();
    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1080,
          position: "fixed",
          left: -9999,
          top: 0,
          fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(160deg, #0F172A 0%, #1E293B 50%, #0D8EBA 150%)",
            display: "flex",
            flexDirection: "column",
            padding: 64,
            boxSizing: "border-box",
            color: "#fff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative circle */}
          <div
            style={{
              position: "absolute",
              width: 500,
              height: 500,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(29,177,219,0.12) 0%, transparent 70%)",
              top: -200,
              right: -150,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 350,
              height: 350,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(128,176,52,0.08) 0%, transparent 70%)",
              bottom: -100,
              left: -100,
            }}
          />

          {/* Header: Logo + URL */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 48, position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <img
                src="/web-app-manifest-192x192.png"
                alt="JoyFund"
                width={56}
                height={56}
                style={{ borderRadius: 14, objectFit: "contain" }}
              />
              <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: -0.5 }}>
                <span style={{ color: "#80B034" }}>Joy</span>
                <span style={{ color: "#3D77B9" }}>Fund</span>
              </span>
            </div>
            <span style={{ fontSize: 22, opacity: 0.5, fontWeight: 600 }}>
              joy-fund.com
            </span>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 48, position: "relative", zIndex: 1 }}>
            <p style={{ fontSize: 24, opacity: 0.6, margin: "0 0 8px 0", fontWeight: 600 }}>
              {t("dashboard.donor.shareCardGenerosity", { name: donorName })}
            </p>
            <p style={{ fontSize: 56, fontWeight: 800, margin: 0, lineHeight: 1.15, letterSpacing: -1 }}>
              {t("dashboard.donor.shareCardHeadline")}
            </p>
          </div>

          {/* Stats Grid */}
          <div style={{ display: "flex", gap: 24, marginBottom: 48, position: "relative", zIndex: 1 }}>
            <StatBox
              value={campaignCount.toLocaleString()}
              label={t("dashboard.donor.shareCardTotalCampaigns")}
              accent="#1DB1DB"
            />
            <StatBox
              value={formatXAF(totalAmount)}
              label={t("dashboard.donor.shareCardTotalDonated")}
              accent="#80B034"
            />
            <StatBox
              value={formatXAF(averageDonation)}
              label={t("dashboard.donor.shareCardAverageDonation")}
              accent="#3D77B9"
            />
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* CTA */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.08)",
                borderRadius: 60,
                padding: "18px 44px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <span style={{ fontSize: 26, fontWeight: 800 }}>
                {t("dashboard.donor.shareCardCTA")}
              </span>
            </div>
            <span style={{ fontSize: 20, opacity: 0.4, fontWeight: 600 }}>
              {t("dashboard.donor.shareCardDonationsGiven", { count: totalDonations })}
            </span>
          </div>
        </div>
      </div>
    );
  },
);

DonationShareCard.displayName = "DonationShareCard";

function StatBox({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: "rgba(255,255,255,0.06)",
        borderRadius: 24,
        padding: "32px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.1, color: accent }}>
        {value}
      </div>
      <div style={{ fontSize: 18, opacity: 0.6, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

export default DonationShareCard;
