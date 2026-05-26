'use client';

import Link from 'next/link';
import { Tag, Calendar, Settings } from 'lucide-react';
import { formatXAF } from '@/lib/utils';

export default function CampaignDashboardCard({ campaign }: { campaign: any }) {
  const progress = campaign.progress_percentage || 0;
  const statusColor = {
    ACTIVE: 'text-green-600 bg-green-50',
    DRAFT: 'text-gray-600 bg-gray-50',
    FUNDED: 'text-blue-600 bg-blue-50',
    CLOSED: 'text-red-600 bg-red-50',
    INACTIVE: 'text-orange-600 bg-orange-50',
    CANCELLED: 'text-red-600 bg-red-50',
  }[campaign.status as string] || 'text-gray-600 bg-gray-50';

  return (
    <div className="card overflow-hidden flex flex-col h-full border border-gray-100 hover:shadow-md transition-shadow">
      <div className="p-5 flex-1">
        <div className="flex items-center justify-between mb-4">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColor}`}>
            {campaign.status}
          </span>
          <div className="flex items-center gap-1.5 text-gray-400">
             <Tag size={12} />
             <span className="text-[11px] font-medium">{campaign.event_type}</span>
          </div>
        </div>
        
        <h3 className="font-bold text-[#1A1A2E] mb-4 line-clamp-2 min-h-[2.5rem]">
          {campaign.title}
        </h3>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Raised</p>
              <p className="text-sm font-black text-[#1DB1DB]">
                {formatXAF(Number(campaign.total_net_raised))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Goal</p>
              <p className="text-sm font-bold text-gray-700">
                {formatXAF(Number(campaign.goal_amount))}
              </p>
            </div>
          </div>
          
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#1DB1DB] h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-right text-gray-400 font-bold">{progress.toFixed(2)}% Complete</p>
        </div>

        <div className="flex items-center gap-2 text-gray-500">
          <Calendar size={14} />
          <span className="text-xs">Ends {new Date(campaign.end_date).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-100 mt-auto">
        <Link 
          href={`/dashboard/donor/campaigns/${campaign.id}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-[#1A1A2E] hover:bg-gray-100 transition-colors shadow-sm"
        >
          <Settings size={14} /> Manage Campaign
        </Link>
      </div>
    </div>
  );
}
