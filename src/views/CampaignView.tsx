/**
 * BritConnect Campaign Tracker View
 * Tracks active and completed retention campaigns, conversion rates,
 * preserved customer accounts, and campaign ROI
 */
import React, { useState } from 'react';
import {
  Send,
  Plus,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  Play,
  Pause,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const CampaignView: React.FC = () => {
  const campaigns = useAppStore((s) => s.campaigns);
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  const totalBudget = campaigns.reduce((acc, c) => acc + c.budgetGBP, 0);
  const totalSavedAccounts = campaigns.reduce((acc, c) => acc + c.savedCustomersCount, 0);
  const totalSavedRevenue = campaigns.reduce((acc, c) => acc + c.savedRevenueAnnualGBP, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFC8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#14633F] text-[#F0E2B0] flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif-display font-bold text-lg text-[#0B3D2E]">
                Retention Campaign Tracker
              </h2>
              <p className="text-xs text-[#7A877F]">
                Monitor real-time contact status, customer response rates, and financial revenue preserved.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentView('playbook')}
            className="px-4 py-2 bg-[#14633F] hover:bg-[#0B3D2E] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#F0E2B0]" />
            <span>Launch New Campaign</span>
          </button>
        </div>

        {/* Global Campaign Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div className="p-3 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8]">
            <span className="text-[#7A877F] block">Active Campaigns:</span>
            <span className="font-mono font-bold text-lg text-[#0B3D2E] mt-0.5 block">
              {campaigns.filter((c) => c.status === 'Active').length} Live
            </span>
          </div>

          <div className="p-3 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8]">
            <span className="text-[#7A877F] block">Saved Subscribers:</span>
            <span className="font-mono font-bold text-lg text-[#2E9E6B] mt-0.5 block">
              {totalSavedAccounts} Accounts
            </span>
          </div>

          <div className="p-3 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8]">
            <span className="text-[#7A877F] block">Annual Revenue Saved:</span>
            <span className="font-mono font-bold text-lg text-[#14633F] mt-0.5 block">
              £{totalSavedRevenue.toLocaleString()}
            </span>
          </div>

          <div className="p-3 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8]">
            <span className="text-[#7A877F] block">Total Campaign Budget:</span>
            <span className="font-mono font-bold text-lg text-[#0B3D2E] mt-0.5 block">
              £{totalBudget.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-5 shadow-2xs space-y-4">
        <h3 className="font-serif-display font-bold text-base text-[#0B3D2E]">Campaign Register</h3>

        <div className="overflow-x-auto border border-[#E6DFC8] rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF6EC] text-[#0B3D2E] sticky top-0 border-b border-[#E6DFC8] font-semibold">
              <tr>
                <th className="py-2.5 px-3">Campaign Name</th>
                <th className="py-2.5 px-3">Target Segment</th>
                <th className="py-2.5 px-3">Offer Type</th>
                <th className="py-2.5 px-3 text-right">Target (n)</th>
                <th className="py-2.5 px-3 text-right">Contacted</th>
                <th className="py-2.5 px-3 text-right">Saved</th>
                <th className="py-2.5 px-3 text-right">Saved Rev (£/yr)</th>
                <th className="py-2.5 px-3 text-right">Net ROI</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DFC8]/60 text-[#2B3A33]">
              {campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-[#FAF6EC]/50">
                  <td className="py-3 px-3 font-semibold text-[#0B3D2E]">{camp.name}</td>
                  <td className="py-3 px-3">{camp.targetSegment}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-[#7A877F] max-w-[180px] truncate">
                    {camp.offerType}
                  </td>
                  <td className="py-3 px-3 font-mono text-right">{camp.targetCustomersCount}</td>
                  <td className="py-3 px-3 font-mono text-right">{camp.contactedCount}</td>
                  <td className="py-3 px-3 font-mono text-right font-bold text-[#2E9E6B]">
                    {camp.savedCustomersCount}
                  </td>
                  <td className="py-3 px-3 font-mono text-right font-bold text-[#0B3D2E]">
                    £{camp.savedRevenueAnnualGBP.toFixed(0)}
                  </td>
                  <td className="py-3 px-3 font-mono text-right font-bold text-[#B8860B]">
                    +{camp.netROIPercent}%
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-[#BFE3CF] text-[#0B3D2E] text-[10px] font-bold">
                      {camp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
