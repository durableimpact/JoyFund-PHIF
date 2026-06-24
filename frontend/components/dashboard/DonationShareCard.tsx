import { forwardRef } from "react";
import { Heart, TrendingUp, Users, Target } from "lucide-react";
import { formatXAF } from "@/lib/utils";

interface DonationShareCardProps {
  donorName: string;
  totalDonations: number;
  totalAmount: number;
  averageDonation: number;
  campaignCount: number;
}

const DonationShareCard = forwardRef<HTMLDivElement, DonationShareCardProps>(
  ({ donorName, totalDonations, totalAmount, averageDonation, campaignCount }, ref) => {
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
            background: "linear-gradient(135deg, #0B78A0 0%, #065a78 50%, #1D38DB 100%)",
            display: "flex",
            flexDirection: "column",
            padding: 64,
            boxSizing: "border-box",
            color: "#fff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative circles */}
          <div
            style={{
              position: "absolute",
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              top: -100,
              right: -80,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 250,
              height: 250,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
              bottom: 60,
              left: -60,
            }}
          />

          {/* Header: Logo + URL */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Heart size={30} fill="currentColor" />
              </div>
              <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: -0.5 }}>
                JoyFund
              </span>
            </div>
            <span style={{ fontSize: 22, opacity: 0.7, fontWeight: 600 }}>
              joy-fund.com
            </span>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 24, opacity: 0.7, margin: "0 0 8px 0", fontWeight: 600 }}>
              {donorName}&apos;s Generosity
            </p>
            <p style={{ fontSize: 56, fontWeight: 800, margin: 0, lineHeight: 1.15, letterSpacing: -1 }}>
              Making a real{"\n"}difference
            </p>
          </div>

          {/* Stats Grid */}
          <div style={{ display: "flex", gap: 24, marginBottom: 48 }}>
            <StatBox
              icon={<Users size={28} />}
              value={campaignCount.toLocaleString()}
              label="Total Campaigns"
            />
            <StatBox
              icon={<TrendingUp size={28} />}
              value={formatXAF(totalAmount)}
              label="Total Donated"
            />
            <StatBox
              icon={<Target size={28} />}
              value={formatXAF(averageDonation)}
              label="Average Donation"
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
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.95)",
                borderRadius: 60,
                padding: "20px 48px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Heart size={24} fill="#0B78A0" color="#0B78A0" />
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#0B78A0",
                }}
              >
                Make your impact today
              </span>
            </div>
            <span style={{ fontSize: 20, opacity: 0.5, fontWeight: 600 }}>
              Donate now →
            </span>
          </div>
        </div>
      </div>
    );
  },
);

DonationShareCard.displayName = "DonationShareCard";

function StatBox({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: "rgba(255,255,255,0.1)",
        borderRadius: 24,
        padding: "32px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ opacity: 0.7 }}>{icon}</div>
      <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 18, opacity: 0.6, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

export default DonationShareCard;
