/**
 * BritConnect Settings & Documentation View
 * Complete Metric Formula Documentation, Privacy & Governance Controls,
 * Business Economic Assumptions, and Platform Data Reset
 */
import React from 'react';
import {
  Settings,
  BookOpen,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const FORMULA_DOCS = [
  {
    name: 'Portfolio Churn Rate (%)',
    formula: '(Count of Customers where Churn Flag = 1) / (Total Loaded Customer Accounts) × 100',
    description: 'Percentage of the subscriber portfolio that has left or terminated service during the observed period.',
  },
  {
    name: 'Service Friction Index (0–100)',
    formula: 'min(100, round((Tickets_12M × 8) + (Complaints_12M × 18) + (Outages_12M × 15) + (min(ResolutionHours, 40) × 0.7)))',
    description: 'A standardized composite indicator measuring operational friction and service dissatisfaction experienced by the customer.',
  },
  {
    name: 'Payment Risk Score (0–100)',
    formula: 'min(100, round(LatePayments_12M × 12 + FailedPayments_12M × 25))',
    description: 'Weighted risk index tracking direct debit bouncing, missed billing dates, and collection friction.',
  },
  {
    name: 'Expected Annual Revenue at Risk (£)',
    formula: 'Churn Probability × Monthly Charge (£) × Evaluation Horizon (12 Months)',
    description: 'Expected monetary loss for an account over the next 12 months, weighted by its model-predicted defection probability.',
  },
  {
    name: 'Area Under ROC Curve (ROC-AUC)',
    formula: '∫ TPR d(FPR) over all possible decision threshold cutoffs',
    description: 'Measures model ranking ability: probability that a randomly chosen churned customer has a higher predicted risk than a retained customer. Range: 0.5 (random guess) to 1.0 (perfect).',
  },
  {
    name: 'Brier Calibration Score',
    formula: '(1 / N) ∑ (p_i - y_i)²',
    description: 'Measures accuracy and calibration of probabilistic predictions. Lower values indicate more honest, well-calibrated probabilities. Perfect calibration = 0.',
  },
  {
    name: 'Matthews Correlation Coefficient (MCC)',
    formula: '(TP×TN - FP×FN) / √((TP+FP)(TP+FN)(TN+FP)(TN+FN))',
    description: 'Balanced performance metric robust to class imbalance. Returns a value between -1 (total disagreement) and +1 (perfect prediction).',
  },
  {
    name: 'Cumulative Lift at Decile 1 (Top 10%)',
    formula: '(Churn Rate in Top 10% highest-risk accounts) / (Base Portfolio Churn Rate)',
    description: 'Indicates how much more concentrated churn is within the top 10% scored customer cohort compared to random outreach.',
  },
];

export const SettingsDocsView: React.FC = () => {
  const appSettings = useAppStore((s) => s.appSettings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const clearAllPlatformData = useAppStore((s) => s.clearAllPlatformData);

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear all stored datasets, models, and campaign logs from your browser? This action will reset the platform to its reference state.')) {
      await clearAllPlatformData();
      alert('IndexedDB storage cleared. Reference sample data reloaded.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-6 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#E6DFC8]">
          <div className="w-8 h-8 rounded-lg bg-[#14633F] text-[#F0E2B0] flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif-display font-bold text-lg text-[#0B3D2E]">
              Platform Settings & Mathematical Documentation
            </h2>
            <p className="text-xs text-[#7A877F]">
              Inspect transparent metric formulas, configure economic assumptions, and manage privacy controls.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy & Governance Section */}
      <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E6DFC8]">
          <ShieldCheck className="w-5 h-5 text-[#14633F]" />
          <h3 className="font-serif-display font-bold text-base text-[#0B3D2E]">
            Privacy & Governance Safeguards
          </h3>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3.5 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8]">
            <div className="space-y-0.5">
              <span className="font-semibold text-[#0B3D2E] block">
                Allow AI Narrative (Sends Aggregated Facts Only)
              </span>
              <p className="text-[#7A877F]">
                When enabled, pre-computed summary statistics are sent to Gemini for executive text generation. Individual raw customer records are NEVER sent.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={appSettings.allowAiNarrative}
                onChange={(e) => updateSettings({ allowAiNarrative: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#E6DFC8] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E6DFC8] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#14633F]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8]">
            <div className="space-y-0.5">
              <span className="font-semibold text-[#0B3D2E] block">
                Mask Customer Account IDs in Prompts
              </span>
              <p className="text-[#7A877F]">
                Obfuscates identifiers (e.g. replaces "BCT-000001" with "Customer_#A") in conversational prompts.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={appSettings.maskCustomerIds}
                onChange={(e) => updateSettings({ maskCustomerIds: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#E6DFC8] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E6DFC8] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#14633F]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Formula Glossary */}
      <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E6DFC8]">
          <BookOpen className="w-5 h-5 text-[#14633F]" />
          <h3 className="font-serif-display font-bold text-base text-[#0B3D2E]">
            Metric & Calculation Formula Glossary
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {FORMULA_DOCS.map((doc, idx) => (
            <div key={idx} className="p-4 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8] space-y-1.5">
              <span className="font-bold text-[#0B3D2E] text-xs block">{doc.name}</span>
              <code className="font-mono text-[11px] block bg-white px-2 py-1 rounded border border-[#E6DFC8] text-[#14633F] break-all">
                {doc.formula}
              </code>
              <p className="text-[#7A877F] leading-normal mt-1">{doc.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Persistence & Data Reset */}
      <div className="bg-[#FFFDF7] border border-[#A63D2F]/30 rounded-2xl p-6 shadow-2xs space-y-3">
        <h3 className="font-serif-display font-bold text-base text-[#A63D2F] flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-[#A63D2F]" />
          Reset Platform State & Clear Shared Data
        </h3>
        <p className="text-xs text-[#7A877F] leading-relaxed">
          Erases all custom uploaded datasets from the shared server and local browser storage (IndexedDB), resetting the platform back to the canonical BritConnect reference dataset for all users accessing the URL.
        </p>
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 bg-[#A63D2F] hover:bg-[#852C20] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-xs"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Clear All Platform Data & Reset to Sample</span>
        </button>
      </div>
    </div>
  );
};
