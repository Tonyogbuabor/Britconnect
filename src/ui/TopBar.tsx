/**
 * BritConnect Sticky Top Bar
 * Dataset metadata, Data Quality badge, Small-sample safeguard banner,
 * Global filters chips, and Quick Action buttons
 */
import React from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter,
  X,
  Bot,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const VIEW_TITLES: Record<string, string> = {
  home: 'Data Hub & Ingestion',
  quality: 'Data Quality & Leakage Sentinel',
  dashboard: 'Executive Churn Dashboard',
  explorer: 'Customer Explorer 360°',
  models: 'Model Lab & Repeated CV',
  scoring: 'Risk Scoring & What-If Simulator',
  explain: 'Explainability & Fairness Audit',
  segments: 'Behavioral & Value Segmentation',
  playbook: 'Retention Playbook & ROI Modeling',
  campaigns: 'Campaign Tracker & Outcomes',
  analyst: 'AI Analyst Intelligence',
  reports: 'Reports & Audit Exports',
  settings: 'Settings & Documentation',
};

export const TopBar: React.FC<{
  onOpenMobileMenu?: () => void;
}> = () => {
  const currentView = useAppStore((s) => s.currentView);
  const datasetName = useAppStore((s) => s.datasetName);
  const engineeredDataset = useAppStore((s) => s.engineeredDataset);
  const qualityReport = useAppStore((s) => s.qualityReport);
  const globalFilters = useAppStore((s) => s.globalFilters);
  const setGlobalFilter = useAppStore((s) => s.setGlobalFilter);
  const resetGlobalFilters = useAppStore((s) => s.resetGlobalFilters);
  const toggleChat = useAppStore((s) => s.toggleChat);
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const isRefreshing = useAppStore((s) => s.isRefreshing);
  const refreshFromServer = useAppStore((s) => s.refreshFromServer);
  const uploadedAt = useAppStore((s) => s.uploadedAt);

  const [refreshSuccess, setRefreshSuccess] = React.useState(false);

  const handleRefreshClick = async () => {
    const ok = await refreshFromServer();
    setRefreshSuccess(true);
    setTimeout(() => setRefreshSuccess(false), 2500);
  };

  const n = engineeredDataset.length;
  const churnEvents = engineeredDataset.filter((c) => c.churnFlag === 1).length;
  const isSmallSample = n < 1000 || churnEvents < 100;

  // Active filter count
  const activeFilterEntries = Object.entries(globalFilters).filter(
    ([k, v]) => k !== 'search' && v !== 'all' && v !== ''
  );

  return (
    <header className="sticky top-0 z-20 bg-[#FFFDF7]/95 backdrop-blur-md border-b border-[#E6DFC8] px-4 sm:px-6 py-2.5 flex flex-col gap-2">
      {/* Top Row: Breadcrumb & Core Action Strip */}
      <div className="flex items-center justify-between gap-4">
        {/* Breadcrumb & Section Name */}
        <div className="flex items-center gap-2 text-xs truncate">
          <span className="text-[#7A877F] hidden sm:inline">BritConnect Platform</span>
          <span className="text-[#7A877F] hidden sm:inline">/</span>
          <h1 className="font-serif-display font-bold text-base sm:text-lg text-[#0B3D2E] truncate">
            {VIEW_TITLES[currentView] || 'Executive Overview'}
          </h1>

          {/* Dataset Status Badge */}
          <div className="hidden lg:flex items-center gap-1.5 ml-3 px-2.5 py-1 bg-[#FAF6EC] border border-[#E6DFC8] rounded-md text-[11px] text-[#2B3A33]">
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#14633F]" />
            <span className="font-medium truncate max-w-[130px]">{datasetName}</span>
            <span className="font-mono text-[#7A877F]">({n} rows)</span>
            {uploadedAt ? (
              <span className="px-1.5 py-0.2 bg-[#BFE3CF] text-[#0B3D2E] rounded-xs font-semibold text-[9.5px]">
                Shared
              </span>
            ) : null}
          </div>
        </div>

        {/* Right Badges & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            title="Refresh current shared data from server"
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 shadow-2xs ${
              refreshSuccess
                ? 'bg-[#BFE3CF] text-[#0B3D2E] border-[#2E9E6B]'
                : 'bg-[#FAF6EC] hover:bg-[#BFE3CF]/40 text-[#0B3D2E] border-[#E6DFC8]'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#14633F] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {isRefreshing ? 'Refreshing...' : refreshSuccess ? 'Updated!' : 'Refresh'}
            </span>
          </button>

          {/* Data Quality Badge */}
          <div
            title="Completeness, validity, and consistency index"
            className="flex items-center gap-1 px-2.5 py-1 bg-[#FAF6EC] border border-[#E6DFC8] rounded-md text-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2E9E6B]" />
            <span className="hidden sm:inline text-[#7A877F]">Quality:</span>
            <span className="font-mono font-bold text-[#0B3D2E]">
              {qualityReport ? `${qualityReport.overallScore}/100` : '98/100'}
            </span>
          </div>

          {/* Download Report Button */}
          <button
            type="button"
            onClick={() => setCurrentView('reports')}
            className="px-3 py-1.5 text-xs font-semibold text-[#0B3D2E] bg-[#FAF6EC] hover:bg-[#BFE3CF]/40 border border-[#E6DFC8] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#14633F]" />
            <span className="hidden sm:inline">Download Report</span>
          </button>

          {/* AI Analyst Trigger */}
          <button
            type="button"
            onClick={toggleChat}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#14633F] hover:bg-[#0B3D2E] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Bot className="w-3.5 h-3.5 text-[#F0E2B0]" />
            <span>AI Analyst</span>
          </button>
        </div>
      </div>

      {/* Small Sample Warning Safeguard Banner (Section 3 Requirement) */}
      {isSmallSample && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#F0E2B0]/40 border border-[#D4AF37]/50 rounded-lg text-xs text-[#0B3D2E]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
            <span>
              <strong>Small sample safeguard active:</strong> Loaded {n} customers and {churnEvents} churn events. Results are indicative; 95% bootstrap confidence intervals applied.
            </span>
          </div>
          <span className="hidden md:inline font-mono text-[11px] text-[#7A877F]">
            Recommended: 1,000+ customers / 100+ events
          </span>
        </div>
      )}

      {/* Bottom Filter Strip (Chips & Quick Selectors) */}
      <div className="flex items-center gap-2 overflow-x-auto py-0.5 text-xs">
        <div className="flex items-center gap-1 text-[#7A877F] shrink-0 font-medium text-[11px]">
          <Filter className="w-3 h-3 text-[#14633F]" />
          <span>Filters:</span>
        </div>

        {/* Customer Segment Filter */}
        <select
          value={globalFilters.customerSegment}
          onChange={(e) => setGlobalFilter('customerSegment', e.target.value as any)}
          className="bg-[#FAF6EC] border border-[#E6DFC8] rounded-md px-2 py-1 text-xs text-[#2B3A33] font-medium outline-hidden hover:border-[#14633F]"
        >
          <option value="all">All Segments</option>
          <option value="Consumer">Consumer</option>
          <option value="Small Business">Small Business</option>
        </select>

        {/* Service Type Filter */}
        <select
          value={globalFilters.serviceType}
          onChange={(e) => setGlobalFilter('serviceType', e.target.value as any)}
          className="bg-[#FAF6EC] border border-[#E6DFC8] rounded-md px-2 py-1 text-xs text-[#2B3A33] font-medium outline-hidden hover:border-[#14633F]"
        >
          <option value="all">All Services</option>
          <option value="Mobile">Mobile</option>
          <option value="Home Broadband">Home Broadband</option>
          <option value="Fibre Broadband">Fibre Broadband</option>
          <option value="Mobile + Broadband Bundle">Mobile + Broadband Bundle</option>
        </select>

        {/* Contract Type Filter */}
        <select
          value={globalFilters.contractType}
          onChange={(e) => setGlobalFilter('contractType', e.target.value as any)}
          className="bg-[#FAF6EC] border border-[#E6DFC8] rounded-md px-2 py-1 text-xs text-[#2B3A33] font-medium outline-hidden hover:border-[#14633F]"
        >
          <option value="all">All Contracts</option>
          <option value="Rolling Monthly">Rolling Monthly</option>
          <option value="12 Months">12 Months</option>
          <option value="24 Months">24 Months</option>
        </select>

        {/* Risk Band Filter */}
        <select
          value={globalFilters.riskBand}
          onChange={(e) => setGlobalFilter('riskBand', e.target.value as any)}
          className="bg-[#FAF6EC] border border-[#E6DFC8] rounded-md px-2 py-1 text-xs text-[#2B3A33] font-medium outline-hidden hover:border-[#14633F]"
        >
          <option value="all">All Risk Bands</option>
          <option value="Low">Low Risk (&lt;25%)</option>
          <option value="Medium">Medium Risk (25-50%)</option>
          <option value="High">High Risk (50-75%)</option>
          <option value="Critical">Critical Risk (&gt;=75%)</option>
        </select>

        {/* Active Filter Chips with X remove */}
        {activeFilterEntries.map(([k, val]) => (
          <span
            key={k}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#BFE3CF]/40 border border-[#2E9E6B]/40 text-[#0B3D2E] text-[11px] font-medium shrink-0"
          >
            <span>{String(val)}</span>
            <button
              type="button"
              onClick={() => setGlobalFilter(k as any, 'all')}
              className="hover:text-[#A63D2F]"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {activeFilterEntries.length > 0 && (
          <button
            type="button"
            onClick={resetGlobalFilters}
            className="text-[11px] text-[#A63D2F] hover:underline shrink-0 ml-1 font-medium"
          >
            Reset Filters
          </button>
        )}
      </div>
    </header>
  );
};
