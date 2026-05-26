import Link from 'next/link';
import { Users } from 'lucide-react';
import { formatXAF } from '@/lib/utils';

export default function CampaignCard({ campaign }: { campaign: Campaign }) {
  const raisedXAF = Number(campaign.total_net_raised) || 0;
  const goalXAF = Number(campaign.goal_amount) || 100000;
  const pct = campaign.progress_percentage || 0;
  const color = (campaign as any).coverColor || '#1DB1DB';
  const donorName = (campaign as any).donor_name || 'JoyFund Donor';
  const avatar = donorName.charAt(0).toUpperCase();
  const coverImage = campaign.cover_image;
  const story = campaign.description;
  const contributors = (campaign as any).contributors ?? 0;

  return (
    <Link href={`/campaign/${campaign.id}`} className="card block hover:shadow-md transition-shadow duration-200 overflow-hidden group">
      {/* Cover Image or Color Bar */}
      {coverImage ? (
        <img
          src={coverImage}
          alt="Campaign cover"
          className="h-32 w-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
      ) : (
        <div className="h-2 w-full" style={{ backgroundColor: color }} />
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
              style={{ backgroundColor: color }}
            >
              {avatar}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-700">{donorName}</p>
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-[#1A1A2E] text-sm mb-2 group-hover:text-[#1DB1DB] transition-colors line-clamp-2">
          {campaign.title}
        </h3>

        {/* Story excerpt */}
        {story && (
          <p className="text-xs text-gray-500 mb-4 line-clamp-2">{story}</p>
        )}

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
              {formatXAF(raisedXAF)}
            </span>
            <span className="text-xs text-gray-400">{pct.toFixed(2)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-400">Goal: {formatXAF(goalXAF)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users size={12} />
            <span>{contributors} contributors</span>
          </div>
          <span className="text-xs font-semibold text-white px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--primary)' }}>
            Give a Gift →
          </span>
        </div>
      </div>
    </Link>
  );
}
