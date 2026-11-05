/**
 * BritConnect Risk Scoring View
 * Batch portfolio scoring, Risk Bands (Low, Medium, High, Critical),
 * and Individual Customer Scoring with Live Probability Gauge and Waterfall Drivers
 */
import React, { useState } from 'react';
import {
  Target,
  Search,
  Download,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ProbabilityGauge, WaterfallDriverChart } from '../ui/SpecializedVisuals';
import { DonutChart, CHART_COLORS } from '../ui/Charts';

export const ScoringView: React.FC = () => {
  const engineeredDataset = useAppStore((s) => s.engineeredDataset);
  const selectedCustomerId = useAppStore((s) => s.selectedCustomerId);
  const setSelectedCustomerId = useAppStore((s) => s.setSelectedCustomerId);
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  const [searchId, setSearchId] = useState('');

  const activeCustomers = engineeredDataset.filter((c) => c.churnFlag === 0);
  const selectedCustomer =
    activeCustomers.find((c) => c.customerId === (searchId.trim() || selectedCustomerId)) ||
    activeCustomers[0];

  const lowRisk = activeCustomers.filter((c) => c.riskBand === 'Low' || !c.riskBand);
  const medRisk = activeCustomers.filter((c) => c.riskBand === 'Medium');
  const highRisk = activeCustomers.filter((c) => c.riskBand === 'High');
  const critRisk = activeCustomers.filter((c) => c.riskBand === 'Critical');

  const totalAtRiskRev = [...highRisk, ...critRisk].reduce(
    (acc, c) => acc + (c.churnProbability || 0.5) * c.monthlyChargeGBP,
    0
  );

  const riskBandDonut = [
    { label: 'Low (<25%)', value: lowRisk.length, color: CHART_COLORS.greenPrimary },
    { label: 'Medium (25-50%)', value: medRisk.length, color: CHART_COLORS.goldSoft },
    { label: 'High (50-75%)', value: highRisk.length, color: CHART_COLORS.goldRisk },
    { label: 'Critical (>=75%)', value: critRisk.length, color: CHART_COLORS.danger },
  ];

  const exportScoredCSV = () => {
    if (activeCustomers.length === 0) return;
    const headers = [
      'Customer ID',
      'Segment',
      'City',
      'Plan',
      'Contract Type',
      'Monthly Charge GBP',
      'Churn Probability',
      'Risk Band',
      'Expected Revenue At Risk GBP',
    ];
    const rows = [headers.join(',')];

    activeCustomers.forEach((c) => {
      rows.push([
        c.customerId,
        c.customerSegment,
        c.city,
        c.planName,
        c.contractType,
        c.monthlyChargeGBP,
        c.churnProbability,
        c.riskBand,
        c.expectedRevenueAtRisk,
      ].join(','));
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'BritConnect_Scored_Customers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Portfolio Batch Scoring Header */}
      <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E6DFC8]">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#14633F] text-[#F0E2B0] flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <h2 className="font-serif-display font-bold text-lg text-[#0B3D2E]">
                Active Customer Risk Scoring
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#BFE3CF] text-[#0B3D2E] text-xs font-semibold">
                Batch Inference Complete
              </span>
            </div>
            <p className="text-xs text-[#7A877F] mt-1">
              Scored {activeCustomers.length} active subscriber accounts using Champion model inference.
            </p>
          </div>

          <button
            type="button"
            onClick={exportScoredCSV}
            className="px-4 py-2 bg-[#FAF6EC] hover:bg-[#BFE3CF]/40 border border-[#E6DFC8] text-[#0B3D2E] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#14633F]" />
            <span>Export Scored Accounts (CSV)</span>
          </button>
        </div>

        {/* 4 Risk Bands Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="p-4 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8] border-l-4 border-l-[#2E9E6B]">
            <span className="text-xs text-[#7A877F] font-medium block">Low Risk (&lt;25%)</span>
            <div className="text-2xl font-mono font-bold text-[#0B3D2E] mt-1">{lowRisk.length}</div>
            <span className="text-[11px] text-[#2E9E6B] font-medium">Safe accounts</span>
          </div>

          <div className="p-4 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8] border-l-4 border-l-[#D4AF37]">
            <span className="text-xs text-[#7A877F] font-medium block">Medium Risk (25-50%)</span>
            <div className="text-2xl font-mono font-bold text-[#0B3D2E] mt-1">{medRisk.length}</div>
            <span className="text-[11px] text-[#B8860B] font-medium">Monitor cohorts</span>
          </div>

          <div className="p-4 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8] border-l-4 border-l-[#B8860B]">
            <span className="text-xs text-[#7A877F] font-medium block">High Risk (50-75%)</span>
            <div className="text-2xl font-mono font-bold text-[#B8860B] mt-1">{highRisk.length}</div>
            <span className="text-[11px] text-[#B8860B] font-medium">Targeted outreach</span>
          </div>

          <div className="p-4 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8] border-l-4 border-l-[#A63D2F]">
            <span className="text-xs text-[#7A877F] font-medium block">Critical Risk (&ge;75%)</span>
            <div className="text-2xl font-mono font-bold text-[#A63D2F] mt-1">{critRisk.length}</div>
            <span className="text-[11px] text-[#A63D2F] font-medium">Immediate save required</span>
          </div>
        </div>
      </div>

      {/* Main Scoring Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Search & Top Risk Queue (7 cols) */}
        <div className="lg:col-span-7 bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6DFC8]">
            <h3 className="font-serif-display font-bold text-sm text-[#0B3D2E]">
              Priority Intervention Queue
            </h3>
            <span className="text-xs text-[#7A877F]">Ordered by expected revenue at risk</span>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#7A877F] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Search by Customer ID (e.g. BCT-000005)..."
              className="w-full bg-[#FAF6EC] border border-[#E6DFC8] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#2B3A33] outline-hidden focus:border-[#14633F]"
            />
          </div>

          {/* Scored List */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {activeCustomers.map((c) => {
              const isSelected = selectedCustomer?.customerId === c.customerId;
              const prob = c.churnProbability || 0.2;
              const band = c.riskBand || 'Low';

              return (
                <div
                  key={c.customerId}
                  onClick={() => {
                    setSelectedCustomerId(c.customerId);
                    setSearchId('');
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#FAF6EC] border-[#14633F] shadow-xs'
                      : 'bg-white border-[#E6DFC8]/70 hover:border-[#D4AF37]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#0B3D2E]">{c.customerId}</span>
                      <span
                        className={`text-[9.5px] px-1.5 py-0.2 rounded-xs font-mono font-bold ${
                          band === 'Critical'
                            ? 'bg-[#A63D2F]/15 text-[#A63D2F]'
                            : band === 'High'
                            ? 'bg-[#D4AF37]/25 text-[#B8860B]'
                            : band === 'Medium'
                            ? 'bg-[#F0E2B0] text-[#0B3D2E]'
                            : 'bg-[#BFE3CF]/40 text-[#14633F]'
                        }`}
                      >
                        {band}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#7A877F] block">
                      {c.serviceType} · {c.city} · {c.contractType}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-[#0B3D2E]">
                      £{c.monthlyChargeGBP.toFixed(2)}/mo
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-[#B8860B]">
                      {(prob * 100).toFixed(1)}% Churn Risk
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Individual Customer Scoring & Waterfall (5 cols) */}
        {selectedCustomer ? (
          <div className="lg:col-span-5 bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#E6DFC8]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#7A877F] tracking-wider block">
                  Account Deep Dive
                </span>
                <h3 className="font-serif-display font-bold text-base text-[#0B3D2E]">
                  {selectedCustomer.customerId}
                </h3>
                <span className="text-xs text-[#7A877F]">
                  {selectedCustomer.customerSegment} · {selectedCustomer.city}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCustomerId(selectedCustomer.customerId);
                  setCurrentView('explorer');
                }}
                className="text-xs text-[#14633F] hover:underline font-semibold flex items-center gap-1"
              >
                <span>360 Profile</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Gauge */}
            <div className="flex justify-center py-2">
              <ProbabilityGauge
                probability={selectedCustomer.churnProbability || 0.22}
                riskBand={selectedCustomer.riskBand}
                size={170}
              />
            </div>

            {/* Financial Exposure Stat */}
            <div className="p-3 bg-[#FAF6EC] border border-[#E6DFC8] rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-[#7A877F] block">Expected Annual Revenue at Risk:</span>
                <span className="font-mono font-bold text-base text-[#A63D2F]">
                  £{selectedCustomer.expectedRevenueAtRisk?.toFixed(2) || (selectedCustomer.monthlyChargeGBP * 12).toFixed(2)}
                </span>
              </div>
              <span className="font-mono text-xs text-[#7A877F]">Horizon: 12M</span>
            </div>

            {/* Top 3 Drivers Waterfall */}
            {selectedCustomer.topDrivers && selectedCustomer.topDrivers.length > 0 && (
              <div>
                <h4 className="font-semibold text-xs text-[#0B3D2E] mb-2">Key Probability Drivers</h4>
                <WaterfallDriverChart
                  baseRate={0.22}
                  finalProb={selectedCustomer.churnProbability || 0.22}
                  drivers={selectedCustomer.topDrivers}
                />
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
