/**
 * BritConnect Segmentation View
 * 6 Telecom-domain behavioral segments with sample size safeguards (n < 5 suppressed)
 * and Value Tier x Risk Band 4x4 matrix
 */
import React from 'react';
import { PieChart, AlertCircle, ArrowRight, ShieldCheck, DollarSign, Users } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { computeCustomerSegments, computeValueRiskMatrix } from '../segments/segmentEngine';
import { HeatMatrix } from '../ui/Charts';

export const SegmentsView: React.FC = () => {
  const engineeredDataset = useAppStore((s) => s.engineeredDataset);
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const setGlobalFilter = useAppStore((s) => s.setGlobalFilter);

  const segments = computeCustomerSegments(engineeredDataset);
  const matrix = computeValueRiskMatrix(engineeredDataset);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-6 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#E6DFC8]">
          <div className="w-8 h-8 rounded-lg bg-[#14633F] text-[#F0E2B0] flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif-display font-bold text-lg text-[#0B3D2E]">
              Behavioral & Commercial Segmentation
            </h2>
            <p className="text-xs text-[#7A877F]">
              Strategic groupings combining contract dynamics, service friction, usage intensity, and revenue exposure.
            </p>
          </div>
        </div>

        {/* Small sample notice */}
        <p className="text-[11px] text-[#7A877F] mt-3">
          Safeguard rule active: Segment conclusions with sample size n &lt; 5 are suppressed and flagged as "Insufficient Data" to prevent non-statistically sound business decisions.
        </p>
      </div>

      {/* 6 Telecom Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {segments.map((seg) => (
          <div
            key={seg.id}
            className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-[#14633F] transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#E6DFC8]/60">
                <h3 className="font-serif-display font-bold text-base text-[#0B3D2E]">
                  {seg.name}
                </h3>
                {seg.isInsufficientData ? (
                  <span className="px-2 py-0.5 rounded-md bg-[#F0E2B0] text-[#0B3D2E] text-[10px] font-mono font-bold">
                    n &lt; 5 (Insufficient)
                  </span>
                ) : (
                  <span className="font-mono text-xs font-bold text-[#0B3D2E]">
                    n = {seg.count}
                  </span>
                )}
              </div>

              <p className="text-xs text-[#7A877F] mt-2 mb-4 leading-normal">
                {seg.description}
              </p>

              {/* Segment Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF6EC] p-3 rounded-xl border border-[#E6DFC8]/60 mb-4">
                <div>
                  <span className="text-[10px] text-[#7A877F] block">Churn Rate:</span>
                  <span className="font-mono font-bold text-[#0B3D2E] text-sm">
                    {seg.isInsufficientData ? '—' : `${seg.churnRatePercent}%`}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[#7A877F] block">Avg Monthly Charge:</span>
                  <span className="font-mono font-bold text-[#0B3D2E] text-sm">
                    £{seg.avgMonthlyCharge.toFixed(2)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[#7A877F] block">Revenue at Risk:</span>
                  <span className="font-mono font-bold text-[#B8860B] text-sm">
                    £{seg.monthlyRevenueAtRisk.toFixed(0)}/mo
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[#7A877F] block">Top Risk Factor:</span>
                  <span className="font-medium text-[#0B3D2E] truncate block text-[11px]">
                    {seg.topRiskDriver}
                  </span>
                </div>
              </div>

              {/* Recommended Action */}
              <div className="text-xs">
                <span className="font-bold text-[#0B3D2E] text-[11px] uppercase tracking-wider block mb-1">
                  Targeted Playbook Action
                </span>
                <p className="text-[#2B3A33] text-[11px] leading-relaxed">
                  {seg.recommendedAction}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#E6DFC8]/60 flex items-center justify-between">
              <span className="text-[11px] text-[#7A877F]">
                {seg.activeCount} active · {seg.churnCount} churned
              </span>
              <button
                type="button"
                onClick={() => setCurrentView('playbook')}
                className="text-xs text-[#14633F] hover:underline font-semibold flex items-center gap-1"
              >
                <span>Deploy Playbook</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Value Tier x Risk Band Matrix Card */}
      <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6DFC8]">
          <div>
            <h3 className="font-serif-display font-bold text-base text-[#0B3D2E]">
              Customer Value Tier × Risk Band Matrix
            </h3>
            <p className="text-xs text-[#7A877F]">
              Concentration of recurring portfolio revenue across customer spend tiers and predicted risk quadrants.
            </p>
          </div>
        </div>

        <HeatMatrix data={matrix} />
      </div>
    </div>
  );
};
