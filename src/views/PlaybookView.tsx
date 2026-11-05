/**
 * BritConnect Retention Playbook View
 * Evidence-based UK telecoms retention packages, 3-tier intervention hierarchy,
 * commercial ROI calculator, and one-click campaign launch
 */
import React, { useState } from 'react';
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Send,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { TELECOM_PLAYBOOK_TACTICS, RetentionTactic, computeCampaignProjection } from '../recommend/playbookEngine';
import { createNewCampaign } from '../campaigns/campaignManager';

export const PlaybookView: React.FC = () => {
  const engineeredDataset = useAppStore((s) => s.engineeredDataset);
  const addCampaignAction = useAppStore((s) => s.addCampaignAction);
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  const [selectedTactic, setSelectedTactic] = useState<RetentionTactic>(TELECOM_PLAYBOOK_TACTICS[0]);
  const [targetRiskOnly, setTargetRiskOnly] = useState(true);

  // Audience matching the selected tactic
  const matchingAudience = React.useMemo(() => {
    return engineeredDataset.filter((c) => {
      if (c.churnFlag === 1) return false;
      if (targetRiskOnly && c.riskBand !== 'High' && c.riskBand !== 'Critical') return false;
      return true;
    });
  }, [engineeredDataset, targetRiskOnly]);

  const projection = computeCampaignProjection(matchingAudience, selectedTactic, 40, 12);

  const handleLaunchCampaign = async () => {
    const campaign = createNewCampaign(
      `${selectedTactic.title} (Live)`,
      selectedTactic.tier,
      ['High', 'Critical'],
      selectedTactic.offerSummary,
      selectedTactic.costPerSubscriberGBP,
      selectedTactic.expectedAcceptRate,
      projection.totalCampaignCost,
      matchingAudience
    );
    await addCampaignAction(campaign);
    alert(`Campaign "${campaign.name}" created and launched in Campaign Tracker!`);
    setCurrentView('campaigns');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-6 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#E6DFC8]">
          <div className="w-8 h-8 rounded-lg bg-[#14633F] text-[#F0E2B0] flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif-display font-bold text-lg text-[#0B3D2E]">
              Retention Playbook & Commercial ROI Engine
            </h2>
            <p className="text-xs text-[#7A877F]">
              Pre-configured, evidence-based UK telecoms save packages tailored to account risk triggers.
            </p>
          </div>
        </div>

        <p className="text-xs text-[#2B3A33] mt-3">
          Every intervention couples an operational trigger with a calibrated financial concession (e.g. 15% discount for 6 months, Wi-Fi 6 hardware upgrade, or automatic billing credit) to maximize net retention profit.
        </p>
      </div>

      {/* Main 2-Column Split: Tactics List on Left, Active Plan & ROI Simulator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 4 Tactic Cards (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <span className="font-bold text-xs text-[#0B3D2E] uppercase tracking-wider block">
            Select Retention Strategy
          </span>

          {TELECOM_PLAYBOOK_TACTICS.map((tactic, idx) => {
            const isSelected = selectedTactic.title === tactic.title;

            return (
              <div
                key={idx}
                onClick={() => setSelectedTactic(tactic)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFFDF7] border-[#14633F] shadow-sm'
                    : 'bg-[#FFFDF7] border-[#E6DFC8] hover:border-[#D4AF37]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#FAF6EC] border border-[#E6DFC8] text-[#B8860B]">
                      {tactic.tier}
                    </span>
                    <h3 className="font-serif-display font-bold text-sm text-[#0B3D2E]">
                      {tactic.title}
                    </h3>
                  </div>

                  <span className="font-mono font-bold text-xs text-[#14633F] shrink-0">
                    +{(tactic.expectedAcceptRate * 100).toFixed(0)}% Accept Rate
                  </span>
                </div>

                <p className="text-xs text-[#7A877F] mt-2 mb-3 leading-normal">
                  {tactic.offerSummary}
                </p>

                <div className="flex flex-wrap items-center justify-between text-[11px] pt-2 border-t border-[#E6DFC8]/60 text-[#7A877F]">
                  <span>Trigger: {tactic.targetTrigger}</span>
                  <span className="font-mono text-[#0B3D2E]">Cost: £{tactic.costPerSubscriberGBP.toFixed(2)}/cust</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Campaign Projection & Launch Panel (6 cols) */}
        <div className="lg:col-span-6 bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="pb-3 border-b border-[#E6DFC8]">
            <span className="text-[10px] font-mono font-bold text-[#B8860B] uppercase tracking-wider block">
              Active Strategy Execution
            </span>
            <h3 className="font-serif-display font-bold text-base text-[#0B3D2E] mt-0.5">
              {selectedTactic.title}
            </h3>
            <p className="text-xs text-[#7A877F] mt-1">{selectedTactic.offerSummary}</p>
          </div>

          {/* Delivery Channels & Products */}
          <div className="space-y-2 text-xs">
            <span className="font-semibold text-[#0B3D2E] block">Engagement Channels:</span>
            <div className="flex flex-wrap gap-1.5">
              {selectedTactic.channels.map((ch, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md bg-[#FAF6EC] border border-[#E6DFC8] text-[#0B3D2E] font-medium"
                >
                  {ch}
                </span>
              ))}
            </div>
          </div>

          {/* Commercial Projection Metrics */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#0B3D2E] uppercase tracking-wider">
                Financial ROI Modeling
              </span>
              <label className="flex items-center gap-1.5 text-xs text-[#2B3A33] cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetRiskOnly}
                  onChange={(e) => setTargetRiskOnly(e.target.checked)}
                  className="accent-[#14633F]"
                />
                <span>Target High/Critical Risk Only</span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8]">
                <span className="text-[#7A877F] block">Target Audience:</span>
                <span className="font-mono font-bold text-base text-[#0B3D2E] mt-0.5 block">
                  {projection.targetCount} Accounts
                </span>
              </div>

              <div className="p-3 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8]">
                <span className="text-[#7A877F] block">Total Campaign Cost:</span>
                <span className="font-mono font-bold text-base text-[#0B3D2E] mt-0.5 block">
                  £{projection.totalCampaignCost.toFixed(0)}
                </span>
              </div>

              <div className="p-3 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8]">
                <span className="text-[#7A877F] block">Expected Saves:</span>
                <span className="font-mono font-bold text-base text-[#2E9E6B] mt-0.5 block">
                  ~{projection.expectedSaves} Accounts
                </span>
              </div>

              <div className="p-3 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8]">
                <span className="text-[#7A877F] block">Preserved Revenue:</span>
                <span className="font-mono font-bold text-base text-[#0B3D2E] mt-0.5 block">
                  £{projection.annualRevenueSaved.toFixed(0)}/yr
                </span>
              </div>

              <div className="p-3 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8]">
                <span className="text-[#7A877F] block">Gross Profit Saved:</span>
                <span className="font-mono font-bold text-base text-[#14633F] mt-0.5 block">
                  £{projection.grossProfitSaved.toFixed(0)}
                </span>
              </div>

              <div className="p-3 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8]">
                <span className="text-[#7A877F] block">Net Projected ROI:</span>
                <span className="font-mono font-bold text-base text-[#B8860B] mt-0.5 block">
                  +{projection.netROIPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Launch Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleLaunchCampaign}
              className="w-full py-2.5 bg-[#14633F] hover:bg-[#0B3D2E] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Send className="w-4 h-4 text-[#F0E2B0]" />
              <span>Deploy Campaign to Tracker ({projection.targetCount} Accounts)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
