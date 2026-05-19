import Link from 'next/link';
import { Users, Calendar } from 'lucide-react';
type Campaign = {
  id: string;
  coverColor: string;
  raisedXAF: number;
  goalXAF: number;
  donorAvatar?: string;
  donorName?: string;
  status?: string;
  title: string;
  story?: string;
  eventType?: string;
  goalDeliveries?: number;
  contributors?: number;
};
import { formatXAF, getProgressPercent, eventTypeLabel, statusColor, statusLabel } from '@/lib/utils';

export default function CampaignCard({ campaign }: { campaign: Campaign }) {
  const pct = getProgressPercent(campaign.raisedXAF, campaign.goalXAF);

  return (
    <Link href={`/campaign/${campaign.id}`} className="card block hover:shadow-md transition-shadow duration-200 overflow-hidden group">
      {/* Color bar */}
      <div className="h-2 w-full" style={{ backgroundColor: campaign.coverColor }} />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: campaign.coverColor }}
            >
              {campaign.donorAvatar}
            </div>
            <div>
              <p className="text-xs text-gray-500">{eventTypeLabel(campaign.eventType)}</p>
              <p className="text-xs font-medium text-gray-700">{campaign.donorName}</p>
            </div>
          </div>
          <span className={`badge ${statusColor(campaign.status)}`}>
            {statusLabel(campaign.status)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-[#1A1A2E] text-sm mb-2 group-hover:text-[#1DB1DB] transition-colors line-clamp-2">
          {campaign.title}
        </h3>

        {/* Story excerpt */}
        <p className="text-xs text-gray-500 mb-4 line-clamp-2">{campaign.story}</p>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
              {formatXAF(campaign.raisedXAF)}
            </span>
            <span className="text-xs text-gray-400">{pct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-400">Goal: {formatXAF(campaign.goalXAF)}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--secondary)' }}>
              {campaign.goalDeliveries} deliveries
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users size={12} />
            <span>{campaign.contributors} contributors</span>
          </div>
          <span className="text-xs font-semibold text-white px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--primary)' }}>
            Give a Gift →
          </span>
        </div>
      </div>
    </Link>
  );
}
