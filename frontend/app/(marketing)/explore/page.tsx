'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import CampaignCard from '@/components/shared/CampaignCard';
import { listCampaigns } from '@/actions/campaigns';

const EVENT_TYPES = ['All', 'birthday', 'wedding', 'graduation', 'promotion', 'other'];

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch campaigns with React Query
  const { data: campaignsResponse, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => await listCampaigns(),
  });

  // Extract campaigns from paginated response
  const campaignList = campaignsResponse?.results || [];

  const filtered = campaignList.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchType = filter === 'All' || c.event_type === filter;
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="section-title text-3xl">Explore JoyFunds</h1>
            <p className="section-sub">Discover campaigns and give a gift that truly matters</p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input-field pl-10"
                placeholder="Search campaigns or donors..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input-field w-auto min-w-37.5"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Type pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
            {EVENT_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === t ? 'text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}
                style={filter === t ? { background: 'var(--primary)' } : {}}
              >
                {t === 'All' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="card p-8 text-center">Loading campaigns…</div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-5">{filtered.length} campaign{filtered.length !== 1 ? 's' : ''} found</p>
              {filtered.length === 0 ? (
                <div className="card p-16 text-center">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="font-bold text-lg text-[#1A1A2E] mb-2">No campaigns found</h3>
                  <p className="text-gray-500 text-sm">Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map(c => <CampaignCard key={c.id} campaign={c} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
