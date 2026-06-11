import Link from 'next/link';
import { Users } from 'lucide-react';

export default function CampaignCard({ campaign }: { campaign: CampaignList }) {
  const raisedXAF = Number(campaign.total_net_raised) || 0;
  const goalXAF = Number(campaign.goal) || 100000;
  const pct = campaign.progress_percentage || 0;
  const coverImage = campaign.cover_image;
  const story = campaign.description;
  const contributors = campaign.total_number_of_successfull_donations ?? 0;

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
        <div className="h-2 w-full" style={{ backgroundColor: '#1DB1DB' }} />
      )}

      <div className="p-5">

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
              {/* {formatXAF(raisedXAF)} */} {raisedXAF.toLocaleString()} XAF
            </span>
            <span className="text-xs text-gray-400">{pct.toFixed(2)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-400">Goal: {/* {formatXAF(goalXAF)} */} {goalXAF.toLocaleString()} XAF</span>
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
