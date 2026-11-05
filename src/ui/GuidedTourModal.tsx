/**
 * BritConnect 5-Step First-Run Guided Tour
 * Educates retention managers on the end-to-end churn intelligence pipeline
 */
import React from 'react';
import { Database, ShieldCheck, LayoutDashboard, Cpu, Target, ArrowRight, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const TOUR_STEPS = [
  {
    step: 1,
    title: '1. Universal Telecoms Ingestion',
    icon: Database,
    desc: 'Upload customer files in almost any format: CSV, Excel (.xlsx/.xls), JSON/JSONL, or XML. Schema auto-mapping matches column headers to canonical telecom fields with confidence scores.',
    actionLabel: 'Explore Quality Checks',
    viewTarget: 'home' as const,
  },
  {
    step: 2,
    title: '2. Automated Quality & Leakage Sentinel',
    icon: ShieldCheck,
    desc: 'Audits data completeness, valid ranges, and duplicate keys. Crucially, the Leakage Sentinel automatically detects and sequesters post-churn fields (e.g. Churn Reason, Churn Date) to prevent model distortion.',
    actionLabel: 'Go to Executive Dashboard',
    viewTarget: 'quality' as const,
  },
  {
    step: 3,
    title: '3. Executive Dashboard & Cross-Filtering',
    icon: LayoutDashboard,
    desc: '14 deterministic KPIs (computed strictly from code, never invented) with sparklines and 14 interactive charts without cluttering gridlines. Click any segment or bar to filter across the entire portfolio.',
    actionLabel: 'Inspect Model Lab',
    viewTarget: 'dashboard' as const,
  },
  {
    step: 4,
    title: '4. Model Lab & Repeated Cross-Validation',
    icon: Cpu,
    desc: 'Train and compare 4 models (L2 Logistic Regression, Decision Tree, Random Forest, Gradient Boosting) using stratified repeated k-fold CV with 95% bootstrap confidence intervals. Small-sample safeguards warn when data is indicative.',
    actionLabel: 'Review Customer Scoring',
    viewTarget: 'models' as const,
  },
  {
    step: 5,
    title: '5. Customer 360, What-If & Retention Playbook',
    icon: Target,
    desc: 'Score individual accounts with driver waterfalls, run live what-if experiments (e.g. upgrade to 24-month contract, resolve outage credits), and launch commercial retention campaigns with ROI modeling.',
    actionLabel: 'Get Started with Platform',
    viewTarget: 'explorer' as const,
  },
];

export const GuidedTourModal: React.FC = () => {
  const firstRunTourStep = useAppStore((s) => s.firstRunTourStep);
  const setFirstRunTourStep = useAppStore((s) => s.setFirstRunTourStep);
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  if (firstRunTourStep <= 0 || firstRunTourStep > 5) return null;

  const current = TOUR_STEPS[firstRunTourStep - 1];
  const Icon = current.icon;

  const handleNext = () => {
    setCurrentView(current.viewTarget);
    if (firstRunTourStep >= 5) {
      setFirstRunTourStep(0);
    } else {
      setFirstRunTourStep(firstRunTourStep + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setFirstRunTourStep(0)}
          className="absolute top-4 right-4 p-1.5 text-[#7A877F] hover:text-[#0B3D2E] rounded-lg hover:bg-[#FAF6EC]"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <span
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === firstRunTourStep ? 'w-8 bg-[#D4AF37]' : s < firstRunTourStep ? 'w-4 bg-[#14633F]' : 'w-4 bg-[#E6DFC8]'
              }`}
            />
          ))}
          <span className="text-[11px] font-mono text-[#7A877F] ml-2">Step {firstRunTourStep} of 5</span>
        </div>

        {/* Header with Icon */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAF6EC] border border-[#E6DFC8] flex items-center justify-center text-[#14633F] shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-display font-bold text-lg text-[#0B3D2E]">{current.title}</h3>
            <span className="text-xs text-[#B8860B] font-medium">Guided Architecture Tour</span>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-[#2B3A33] leading-relaxed mb-6">
          {current.desc}
        </p>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E6DFC8]">
          <button
            type="button"
            onClick={() => setFirstRunTourStep(0)}
            className="text-xs text-[#7A877F] hover:text-[#0B3D2E] font-medium"
          >
            Skip Tour
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 bg-[#14633F] hover:bg-[#0B3D2E] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>{current.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
