/**
 * BritConnect Customer Explorer View
 * Searchable, sortable, filterable customer table with sticky column,
 * Customer 360 Profile drawer, Driver Waterfall, and Live What-If Simulator
 */
import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Sliders,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  User,
  Activity,
  CreditCard,
  Wifi,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { EngineeredCustomer } from '../types';
import { ProbabilityGauge, WaterfallDriverChart } from '../ui/SpecializedVisuals';
import { CHART_COLORS } from '../ui/Charts';

export const ExplorerView: React.FC = () => {
  const engineeredDataset = useAppStore((s) => s.engineeredDataset);
  const selectedCustomerId = useAppStore((s) => s.selectedCustomerId);
  const setSelectedCustomerId = useAppStore((s) => s.setSelectedCustomerId);
  const championModel = useAppStore((s) => s.championModel);

  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'Low' | 'Medium' | 'High' | 'Critical'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Selected Customer for 360 Profile
  const selectedCustomer = useMemo(() => {
    return (
      engineeredDataset.find((c) => c.customerId === selectedCustomerId) ||
      engineeredDataset[0] ||
      null
    );
  }, [engineeredDataset, selectedCustomerId]);

  // What-If Simulator State
  const [simContractType, setSimContractType] = useState<string>(selectedCustomer?.contractType || 'Rolling Monthly');
  const [simOutages, setSimOutages] = useState<number>(selectedCustomer?.networkOutages12M ?? 2);
  const [simDiscount, setSimDiscount] = useState<number>(selectedCustomer?.discountPercent ?? 0);
  const [simHasComplaint, setSimHasComplaint] = useState<boolean>((selectedCustomer?.complaints12M ?? 0) > 0);

  // Re-sync simulator state when customer changes
  React.useEffect(() => {
    if (selectedCustomer) {
      setSimContractType(selectedCustomer.contractType);
      setSimOutages(selectedCustomer.networkOutages12M);
      setSimDiscount(selectedCustomer.discountPercent);
      setSimHasComplaint(selectedCustomer.complaints12M > 0);
    }
  }, [selectedCustomer?.customerId]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return engineeredDataset.filter((c) => {
      if (riskFilter !== 'all' && c.riskBand !== riskFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = c.customerId.toLowerCase().includes(q);
        const matchCity = c.city.toLowerCase().includes(q);
        const matchPlan = c.planName.toLowerCase().includes(q);
        const matchService = c.serviceType.toLowerCase().includes(q);
        if (!matchId && !matchCity && !matchPlan && !matchService) return false;
      }
      return true;
    });
  }, [engineeredDataset, searchQuery, riskFilter]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Compute What-If Simulation Delta
  const simulatedRisk = useMemo(() => {
    if (!selectedCustomer) return 0.2;
    let base = selectedCustomer.churnProbability || 0.22;

    // Contract delta
    if (simContractType === '24 Months' && selectedCustomer.contractType === 'Rolling Monthly') {
      base -= 0.18;
    } else if (simContractType === '12 Months' && selectedCustomer.contractType === 'Rolling Monthly') {
      base -= 0.11;
    } else if (simContractType === 'Rolling Monthly' && selectedCustomer.contractType !== 'Rolling Monthly') {
      base += 0.16;
    }

    // Outages delta
    const outageDelta = simOutages - selectedCustomer.networkOutages12M;
    base += outageDelta * 0.05;

    // Discount delta
    const discountDelta = simDiscount - selectedCustomer.discountPercent;
    base -= (discountDelta / 10) * 0.03;

    // Complaint resolution delta
    if (!simHasComplaint && selectedCustomer.complaints12M > 0) {
      base -= 0.08;
    }

    return Math.max(0.02, Math.min(0.98, Number(base.toFixed(3))));
  }, [selectedCustomer, simContractType, simOutages, simDiscount, simHasComplaint]);

  const riskDelta = selectedCustomer ? simulatedRisk - (selectedCustomer.churnProbability || 0.22) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#7A877F] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Customer ID (BCT-...), city, plan, or service..."
              className="w-full bg-[#FAF6EC] border border-[#E6DFC8] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#2B3A33] outline-hidden focus:border-[#14633F]"
            />
          </div>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as any)}
            className="bg-[#FAF6EC] border border-[#E6DFC8] rounded-xl px-3 py-1.5 text-xs text-[#2B3A33] font-medium outline-hidden"
          >
            <option value="all">All Risk Bands</option>
            <option value="Low">Low Risk (&lt;25%)</option>
            <option value="Medium">Medium Risk (25-50%)</option>
            <option value="High">High Risk (50-75%)</option>
            <option value="Critical">Critical Risk (&gt;=75%)</option>
          </select>
        </div>

        <div className="text-xs text-[#7A877F]">
          Showing <strong className="font-mono text-[#0B3D2E]">{filteredCustomers.length}</strong> accounts
        </div>
      </div>

      {/* Main 2-Column Split: Table on Left, Customer 360 & What-If on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customer Table (7 cols) */}
        <div className="lg:col-span-7 bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6DFC8]">
            <h3 className="font-serif-display font-bold text-sm text-[#0B3D2E]">Customer Accounts Registry</h3>
            <span className="text-[11px] text-[#7A877F]">Select account to inspect 360 profile</span>
          </div>

          <div className="overflow-x-auto max-h-[520px] border border-[#E6DFC8] rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF6EC] text-[#0B3D2E] sticky top-0 border-b border-[#E6DFC8] font-semibold">
                <tr>
                  <th className="py-2.5 px-3 sticky left-0 bg-[#FAF6EC] z-10">Account ID</th>
                  <th className="py-2.5 px-3">Service & Plan</th>
                  <th className="py-2.5 px-3">Contract</th>
                  <th className="py-2.5 px-3 text-right">Monthly (£)</th>
                  <th className="py-2.5 px-3 text-center">Risk Band</th>
                  <th className="py-2.5 px-3 text-right">Probability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DFC8]/60 text-[#2B3A33]">
                {paginatedCustomers.map((c) => {
                  const isSelected = selectedCustomer?.customerId === c.customerId;
                  const prob = c.churnProbability || 0.2;
                  const band = c.riskBand || 'Low';

                  return (
                    <tr
                      key={c.customerId}
                      onClick={() => setSelectedCustomerId(c.customerId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#FAF6EC] font-medium' : 'hover:bg-[#FAF6EC]/50'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-[#0B3D2E] sticky left-0 bg-white">
                        {c.customerId}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="block truncate max-w-[130px]">{c.planName}</span>
                        <span className="text-[10px] text-[#7A877F]">{c.city}</span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{c.contractType}</td>
                      <td className="py-2.5 px-3 font-mono text-right font-medium">
                        £{c.monthlyChargeGBP.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md font-mono ${
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
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right font-bold text-[#0B3D2E]">
                        {(prob * 100).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-[#7A877F]">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 bg-[#FAF6EC] border border-[#E6DFC8] rounded-md disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 bg-[#FAF6EC] border border-[#E6DFC8] rounded-md disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Customer 360 Profile & What-If Simulator (5 cols) */}
        {selectedCustomer ? (
          <div className="lg:col-span-5 space-y-4">
            {/* Customer 360 Card */}
            <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-[#E6DFC8]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif-display font-bold text-lg text-[#0B3D2E]">
                      {selectedCustomer.customerId}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-[#FAF6EC] border border-[#E6DFC8] rounded-md font-mono text-[#7A877F]">
                      Rank #{selectedCustomer.riskRank ?? 1}
                    </span>
                  </div>
                  <span className="text-xs text-[#7A877F]">
                    {selectedCustomer.customerSegment} · {selectedCustomer.city}, {selectedCustomer.ukNation}
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-[#0B3D2E]">
                    £{selectedCustomer.monthlyChargeGBP.toFixed(2)}/mo
                  </div>
                  <span className="text-[11px] text-[#7A877F]">ARPU</span>
                </div>
              </div>

              {/* Gauge & Key Drivers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-[#FAF6EC] p-3 rounded-xl border border-[#E6DFC8]/60">
                <div className="flex justify-center">
                  <ProbabilityGauge
                    probability={selectedCustomer.churnProbability || 0.22}
                    riskBand={selectedCustomer.riskBand}
                    size={150}
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-[#0B3D2E] text-[11px] uppercase tracking-wider block">
                    Account Overview
                  </span>
                  <div>
                    <span className="text-[#7A877F]">Plan:</span>{' '}
                    <strong className="text-[#0B3D2E]">{selectedCustomer.planName}</strong>
                  </div>
                  <div>
                    <span className="text-[#7A877F]">Contract:</span>{' '}
                    <strong className="text-[#0B3D2E]">{selectedCustomer.contractType}</strong>
                  </div>
                  <div>
                    <span className="text-[#7A877F]">Tenure:</span>{' '}
                    <strong className="text-[#0B3D2E]">{selectedCustomer.tenureMonths} Months</strong>
                  </div>
                  <div>
                    <span className="text-[#7A877F]">CSAT / NPS:</span>{' '}
                    <strong className="text-[#0B3D2E]">{selectedCustomer.satisfactionScore}/10 ({selectedCustomer.npsScore})</strong>
                  </div>
                </div>
              </div>

              {/* Local Waterfall Driver */}
              {selectedCustomer.topDrivers && selectedCustomer.topDrivers.length > 0 && (
                <div>
                  <h4 className="font-semibold text-xs text-[#0B3D2E] mb-1.5">Local Feature Waterfall</h4>
                  <WaterfallDriverChart
                    baseRate={0.22}
                    finalProb={selectedCustomer.churnProbability || 0.22}
                    drivers={selectedCustomer.topDrivers}
                  />
                </div>
              )}
            </div>

            {/* LIVE WHAT-IF SIMULATOR */}
            <div className="bg-[#FFFDF7] border-2 border-[#D4AF37]/50 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E6DFC8]">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#B8860B]" />
                  <h3 className="font-serif-display font-bold text-sm text-[#0B3D2E]">
                    Live What-If Retention Simulator
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#FAF6EC] border border-[#E6DFC8] rounded-md text-[#B8860B] font-bold">
                  Interactive
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* 1. Contract Upgrade */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-[#2B3A33]">Agreement Commitment:</span>
                    <span className="font-mono font-bold text-[#0B3D2E]">{simContractType}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['Rolling Monthly', '12 Months', '24 Months'].map((cType) => (
                      <button
                        key={cType}
                        type="button"
                        onClick={() => setSimContractType(cType)}
                        className={`py-1 px-2 rounded-md font-medium text-[11px] transition-colors ${
                          simContractType === cType
                            ? 'bg-[#14633F] text-white'
                            : 'bg-[#FAF6EC] text-[#2B3A33] border border-[#E6DFC8]'
                        }`}
                      >
                        {cType.replace(' Months', 'M')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Resolve Outages */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-[#2B3A33]">Network Outages (12M):</span>
                    <span className="font-mono font-bold text-[#0B3D2E]">{simOutages} Outages</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={simOutages}
                    onChange={(e) => setSimOutages(parseInt(e.target.value, 10))}
                    className="w-full accent-[#14633F]"
                  />
                </div>

                {/* 3. Loyalty Discount */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-[#2B3A33]">Retention Discount Applied:</span>
                    <span className="font-mono font-bold text-[#0B3D2E]">{simDiscount}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="5"
                    value={simDiscount}
                    onChange={(e) => setSimDiscount(parseInt(e.target.value, 10))}
                    className="w-full accent-[#14633F]"
                  />
                </div>

                {/* 4. Resolve Complaint Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-medium text-[#2B3A33]">Active Support Complaint:</span>
                  <button
                    type="button"
                    onClick={() => setSimHasComplaint(!simHasComplaint)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      simHasComplaint
                        ? 'bg-[#A63D2F]/20 text-[#A63D2F] border border-[#A63D2F]/40'
                        : 'bg-[#BFE3CF] text-[#0B3D2E]'
                    }`}
                  >
                    {simHasComplaint ? 'Unresolved Escalation' : 'Resolved / Goodwill Credit'}
                  </button>
                </div>
              </div>

              {/* Simulation Outcome Banner */}
              <div className="p-3 bg-[#FAF6EC] border border-[#E6DFC8] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#7A877F] block">Simulated Churn Probability:</span>
                  <span className="font-mono font-bold text-lg text-[#0B3D2E]">
                    {(simulatedRisk * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-[#7A877F] block">Delta Impact:</span>
                  <span
                    className={`font-mono font-bold text-base flex items-center justify-end gap-1 ${
                      riskDelta <= 0 ? 'text-[#2E9E6B]' : 'text-[#A63D2F]'
                    }`}
                  >
                    {riskDelta <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    {riskDelta <= 0 ? '' : '+'}{(riskDelta * 100).toFixed(1)} pts
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-5 bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-8 text-center text-xs text-[#7A877F]">
            Select an account to view Customer 360 profile
          </div>
        )}
      </div>
    </div>
  );
};
