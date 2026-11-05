/**
 * BritConnect Model Lab View
 * Train & Compare 4 ML algorithms with Stratified Repeated K-Fold CV,
 * Honest 95% Bootstrap CIs, Business-Aware Threshold Selector, and Model Registry
 */
import React, { useState } from 'react';
import {
  Cpu,
  Award,
  Play,
  RotateCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  DollarSign,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ModelType } from '../types';
import { CurvePlotter, ConfusionMatrixGrid } from '../ui/SpecializedVisuals';
import { ChartCard } from '../ui/ChartCard';
import { calculateThresholdEconomics } from '../ml/mathUtils';
import { CHART_COLORS } from '../ui/Charts';

export const ModelLabView: React.FC = () => {
  const models = useAppStore((s) => s.models);
  const championModel = useAppStore((s) => s.championModel);
  const isTraining = useAppStore((s) => s.isTraining);
  const trainingProgress = useAppStore((s) => s.trainingProgress);
  const trainingStatus = useAppStore((s) => s.trainingStatus);
  const trainModelAction = useAppStore((s) => s.trainModelAction);
  const setChampionModelAction = useAppStore((s) => s.setChampionModelAction);
  const engineeredDataset = useAppStore((s) => s.engineeredDataset);

  const [selectedModelType, setSelectedModelType] = useState<ModelType>('logistic_regression');
  const [modelNameInput, setModelNameInput] = useState('');
  const [activeModelTab, setActiveModelTab] = useState<string>(championModel?.id || models[0]?.id || '');

  // Active Model for deep evaluation
  const activeModel = models.find((m) => m.id === activeModelTab) || championModel || models[0];

  // Business Threshold Slider state
  const [operatingThreshold, setOperatingThreshold] = useState<number>(activeModel?.optimalThreshold ?? 0.45);
  const [costPerOffer, setCostPerOffer] = useState<number>(15.0);
  const [offerSuccessRate, setOfferSuccessRate] = useState<number>(30.0);
  const [avgMarginPercent, setAvgMarginPercent] = useState<number>(40.0);

  const avgMonthlyCharge =
    engineeredDataset.length > 0
      ? engineeredDataset.reduce((acc, c) => acc + c.monthlyChargeGBP, 0) / engineeredDataset.length
      : 38.0;

  // Recompute confusion matrix and economics at chosen threshold
  const thresholdEcon = React.useMemo(() => {
    if (!activeModel) return null;
    const { tp, fp, tn, fn, total } = activeModel.confusionMatrix;
    return calculateThresholdEconomics(
      { tp, fp, tn, fn, total, threshold: operatingThreshold },
      avgMonthlyCharge,
      costPerOffer,
      offerSuccessRate,
      avgMarginPercent
    );
  }, [activeModel, operatingThreshold, avgMonthlyCharge, costPerOffer, offerSuccessRate, avgMarginPercent]);

  const handleTrain = async () => {
    await trainModelAction(selectedModelType, modelNameInput || undefined);
    setModelNameInput('');
  };

  const downloadModelJSON = () => {
    if (!activeModel) return;
    const blob = new Blob([JSON.stringify(activeModel, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeModel.name.toLowerCase().replace(/\s+/g, '_')}_spec.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Model Training Control Strip */}
      <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E6DFC8]">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#14633F] text-[#F0E2B0] flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <h2 className="font-serif-display font-bold text-lg text-[#0B3D2E]">Model Training Lab</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#BFE3CF] text-[#0B3D2E] text-xs font-semibold">
                Repeated Stratified CV
              </span>
            </div>
            <p className="text-xs text-[#7A877F] mt-1">
              Train algorithms strictly in-browser (TypeScript). Preprocessing and scaling fit inside each fold to ensure zero data leakage.
            </p>
          </div>

          {/* Model Selector & Train Action */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedModelType}
              onChange={(e) => setSelectedModelType(e.target.value as ModelType)}
              disabled={isTraining}
              className="bg-[#FAF6EC] border border-[#E6DFC8] rounded-xl px-3 py-2 text-xs font-medium text-[#0B3D2E] outline-hidden"
            >
              <option value="logistic_regression">Logistic Regression (L2 Regularised)</option>
              <option value="decision_tree">Decision Tree (Depth &le; 4)</option>
              <option value="random_forest">Random Forest (Bagging Ensemble)</option>
              <option value="gradient_boosting">Gradient Boosted Trees (Shrinkage)</option>
            </select>

            <button
              type="button"
              onClick={handleTrain}
              disabled={isTraining}
              className="px-4 py-2 bg-[#14633F] hover:bg-[#0B3D2E] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs disabled:opacity-50"
            >
              {isTraining ? <RotateCw className="w-4 h-4 animate-spin text-[#F0E2B0]" /> : <Play className="w-4 h-4 text-[#F0E2B0]" />}
              <span>{isTraining ? 'Training CV Folds...' : 'Train Model'}</span>
            </button>
          </div>
        </div>

        {/* Live Training Progress Bar */}
        {isTraining && (
          <div className="space-y-1.5 p-3.5 bg-[#FAF6EC] border border-[#E6DFC8] rounded-xl animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#0B3D2E]">{trainingStatus}</span>
              <span className="font-mono font-bold text-[#14633F]">{trainingProgress}%</span>
            </div>
            <div className="w-full bg-[#E6DFC8] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#14633F] h-full transition-all duration-300"
                style={{ width: `${trainingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Model Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 text-xs">
          {models.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveModelTab(m.id)}
              className={`px-3 py-2 rounded-xl font-medium border flex items-center gap-2 shrink-0 transition-colors ${
                (activeModelTab === m.id || (!activeModelTab && m.isChampion))
                  ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]'
                  : 'bg-[#FAF6EC] text-[#2B3A33] border-[#E6DFC8] hover:border-[#14633F]'
              }`}
            >
              {m.isChampion && <Award className="w-3.5 h-3.5 text-[#D4AF37]" />}
              <span>{m.name}</span>
              <span className="font-mono opacity-80 text-[10px]">({m.metrics.rocAuc.mean.toFixed(2)} AUC)</span>
            </button>
          ))}
        </div>
      </div>

      {activeModel && (
        <div className="space-y-6">
          {/* Active Model Header & Champion Tag */}
          <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-serif-display font-bold text-base text-[#0B3D2E]">
                  {activeModel.name}
                </h3>
                {activeModel.isChampion ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] text-[#0B3D2E] text-xs font-bold flex items-center gap-1">
                    <Award className="w-3 h-3 text-[#B8860B]" />
                    <span>Active Champion</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setChampionModelAction(activeModel.id)}
                    className="px-2.5 py-0.5 rounded-md bg-[#FAF6EC] hover:bg-[#BFE3CF] text-[#0B3D2E] text-xs font-semibold border border-[#E6DFC8] transition-colors"
                  >
                    Promote to Champion
                  </button>
                )}
              </div>
              <p className="text-xs text-[#7A877F] mt-1 font-mono">
                Trained: {activeModel.trainedAt.substring(0, 10)} · Sample n = {activeModel.sampleSize} ({activeModel.churnCount} churn events) · CV 5-Fold
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadModelJSON}
                className="px-3 py-1.5 bg-[#FAF6EC] hover:bg-[#BFE3CF]/40 border border-[#E6DFC8] text-[#0B3D2E] text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#14633F]" />
                <span>Export Model JSON</span>
              </button>
            </div>
          </div>

          {/* 14 HONEST METRICS GRID (WITH 95% BOOTSTRAP CONFIDENCE INTERVALS) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: 'ROC-AUC', ci: activeModel.metrics.rocAuc, target: '>= 0.80' },
              { label: 'PR-AUC', ci: activeModel.metrics.prAuc, target: 'Baseline 0.22' },
              { label: 'Accuracy', ci: activeModel.metrics.accuracy, target: 'Baseline 78%' },
              { label: 'Bal. Accuracy', ci: activeModel.metrics.balancedAccuracy, target: 'Class weighted' },
              { label: 'Precision', ci: activeModel.metrics.precision, target: 'True positive rate' },
              { label: 'Recall', ci: activeModel.metrics.recall, target: 'Capture rate' },
              { label: 'F1 Score', ci: activeModel.metrics.f1, target: 'Harmonic mean' },
              { label: 'F2 Score', ci: activeModel.metrics.f2, target: 'Recall weighted' },
              { label: 'Brier Score', ci: activeModel.metrics.brierScore, target: 'Lower is better' },
              { label: 'Log Loss', ci: activeModel.metrics.logLoss, target: 'Calibration' },
              { label: 'Matthews (MCC)', ci: activeModel.metrics.matthewsCorr, target: 'Range -1 to +1' },
              { label: 'Specificity', ci: activeModel.metrics.specificity, target: 'True negative rate' },
              { label: 'Lift Top 10%', scalar: activeModel.metrics.liftTop10, target: 'Decile 1 lift' },
              { label: 'KS Statistic', scalar: activeModel.metrics.ksStatistic, target: 'Separability' },
            ].map((mItem, idx) => (
              <div key={idx} className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-xl p-3 shadow-2xs">
                <span className="text-[11px] text-[#7A877F] font-medium block truncate">{mItem.label}</span>
                <div className="text-base font-mono font-bold text-[#0B3D2E] mt-0.5">
                  {mItem.ci ? mItem.ci.mean.toFixed(3) : mItem.scalar?.toFixed(2)}
                </div>
                {mItem.ci && (
                  <span className="text-[10px] font-mono text-[#B8860B] block mt-0.5">
                    95% CI: [{mItem.ci.lower.toFixed(2)}, {mItem.ci.upper.toFixed(2)}]
                  </span>
                )}
                <span className="text-[9.5px] text-[#7A877F] block opacity-75">{mItem.target}</span>
              </div>
            ))}
          </div>

          {/* Core Visuals: ROC Curve, PR Curve, and Confusion Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <ChartCard
              title="ROC Curve (Receiver Operating Characteristic)"
              insightSubtitle={`Area under ROC is ${activeModel.metrics.rocAuc.mean.toFixed(3)} with 95% CI [${activeModel.metrics.rocAuc.lower.toFixed(2)}, ${activeModel.metrics.rocAuc.upper.toFixed(2)}]`}
              sampleSize={activeModel.sampleSize}
              unitLabel="True Positive Rate"
            >
              <CurvePlotter
                type="roc"
                curve={activeModel.rocCurve}
                aucValue={activeModel.metrics.rocAuc.mean}
              />
            </ChartCard>

            <ChartCard
              title="Precision-Recall Curve"
              insightSubtitle={`PR-AUC is ${activeModel.metrics.prAuc.mean.toFixed(3)} (baseline 0.220)`}
              sampleSize={activeModel.sampleSize}
              unitLabel="Precision vs Recall"
            >
              <CurvePlotter
                type="pr"
                curve={activeModel.prCurve}
                aucValue={activeModel.metrics.prAuc.mean}
                baseline={activeModel.churnCount / activeModel.sampleSize}
              />
            </ChartCard>

            <ChartCard
              title="Out-of-Fold Confusion Matrix"
              insightSubtitle={`Evaluated at optimal decision threshold of ${operatingThreshold.toFixed(2)}`}
              sampleSize={activeModel.sampleSize}
              unitLabel="Classification Counts"
            >
              <ConfusionMatrixGrid matrix={activeModel.confusionMatrix} />
            </ChartCard>
          </div>

          {/* BUSINESS-AWARE THRESHOLD SELECTOR & EXPECTED ROI PANEL */}
          <div className="bg-[#FFFDF7] border-2 border-[#D4AF37]/50 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6DFC8]">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#B8860B]" />
                <h3 className="font-serif-display font-bold text-base text-[#0B3D2E]">
                  Business-Aware Decision Threshold Optimizer
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF6EC] border border-[#E6DFC8] text-[#0B3D2E]">
                Profit Maximizing: <strong className="font-mono text-[#B8860B]">{activeModel.optimalThreshold.toFixed(2)}</strong>
              </span>
            </div>

            {/* Threshold Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#0B3D2E]">
                  Operating Threshold Cutoff:{' '}
                  <span className="font-mono text-base text-[#B8860B] font-bold">
                    {operatingThreshold.toFixed(2)}
                  </span>
                </span>
                <span className="text-[#7A877F]">
                  Accounts &ge; threshold are flagged for proactive outreach
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={operatingThreshold}
                onChange={(e) => setOperatingThreshold(parseFloat(e.target.value))}
                className="w-full accent-[#B8860B]"
              />
            </div>

            {/* Economic Parameters Input Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#FAF6EC] p-3 rounded-xl border border-[#E6DFC8]">
                <span className="text-[#7A877F] block">Cost per Offer:</span>
                <div className="flex items-center gap-1 mt-1">
                  <span className="font-mono font-bold text-[#0B3D2E]">£</span>
                  <input
                    type="number"
                    value={costPerOffer}
                    onChange={(e) => setCostPerOffer(parseFloat(e.target.value) || 0)}
                    className="bg-white border border-[#E6DFC8] rounded px-2 py-0.5 font-mono w-16"
                  />
                </div>
              </div>

              <div className="bg-[#FAF6EC] p-3 rounded-xl border border-[#E6DFC8]">
                <span className="text-[#7A877F] block">Offer Success Rate:</span>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    value={offerSuccessRate}
                    onChange={(e) => setOfferSuccessRate(parseFloat(e.target.value) || 0)}
                    className="bg-white border border-[#E6DFC8] rounded px-2 py-0.5 font-mono w-16"
                  />
                  <span className="font-mono font-bold text-[#0B3D2E]">%</span>
                </div>
              </div>

              <div className="bg-[#FAF6EC] p-3 rounded-xl border border-[#E6DFC8]">
                <span className="text-[#7A877F] block">Gross Margin:</span>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    value={avgMarginPercent}
                    onChange={(e) => setAvgMarginPercent(parseFloat(e.target.value) || 0)}
                    className="bg-white border border-[#E6DFC8] rounded px-2 py-0.5 font-mono w-16"
                  />
                  <span className="font-mono font-bold text-[#0B3D2E]">%</span>
                </div>
              </div>

              <div className="bg-[#FAF6EC] p-3 rounded-xl border border-[#E6DFC8]">
                <span className="text-[#7A877F] block">ARPU Horizon:</span>
                <div className="font-mono font-bold text-[#0B3D2E] mt-1">12 Months (Fixed)</div>
              </div>
            </div>

            {/* Expected Economic Outputs Strip */}
            {thresholdEcon && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
                <div className="p-3 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8]">
                  <span className="text-[#7A877F] block">Accounts Contacted</span>
                  <span className="text-base font-mono font-bold text-[#0B3D2E] mt-0.5 block">
                    {thresholdEcon.contacted} ({thresholdEcon.contactRatePercent.toFixed(0)}%)
                  </span>
                </div>

                <div className="p-3 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8]">
                  <span className="text-[#7A877F] block">Campaign Cost</span>
                  <span className="text-base font-mono font-bold text-[#0B3D2E] mt-0.5 block">
                    £{thresholdEcon.campaignCost.toFixed(0)}
                  </span>
                </div>

                <div className="p-3 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8]">
                  <span className="text-[#7A877F] block">Expected Saves</span>
                  <span className="text-base font-mono font-bold text-[#2E9E6B] mt-0.5 block">
                    ~{thresholdEcon.expectedSaves} Accounts
                  </span>
                </div>

                <div className="p-3 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8]">
                  <span className="text-[#7A877F] block">Revenue Preserved</span>
                  <span className="text-base font-mono font-bold text-[#14633F] mt-0.5 block">
                    £{thresholdEcon.revenueSavedAnnual.toFixed(0)}/yr
                  </span>
                </div>

                <div className="p-3 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8]">
                  <span className="text-[#7A877F] block">Net Projected ROI</span>
                  <span className="text-base font-mono font-bold text-[#B8860B] mt-0.5 block">
                    +{thresholdEcon.netROI}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
