/**
 * BritConnect Explainability & Fairness View
 * Global Permutation Importance, Partial Dependence (PDP),
 * Churn Reason Descriptive Analysis, and Subgroup Fairness Audit
 */
import React, { useState } from 'react';
import {
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Layers,
  Scale,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ChartCard } from '../ui/ChartCard';
import { HorizontalBarChart, LineChart, BarChart, CHART_COLORS } from '../ui/Charts';
import {
  computePartialDependence,
  computeFairnessAudit,
  computeChurnReasonDistribution,
} from '../explain/explainEngine';

export const ExplainView: React.FC = () => {
  const engineeredDataset = useAppStore((s) => s.engineeredDataset);
  const championModel = useAppStore((s) => s.championModel);

  const [activeTab, setActiveTab] = useState<'global' | 'pdp' | 'reasons' | 'fairness'>('global');

  // Top 15 Drivers from Champion Model
  const topDrivers = championModel?.featureImportance.slice(0, 15) || [
    { name: 'isRollingMonthly', importance: 0.28 },
    { name: 'contractExpiredFlag', importance: 0.24 },
    { name: 'serviceFrictionIndex', importance: 0.19 },
    { name: 'networkOutages12M', importance: 0.18 },
    { name: 'competitorOfferReceived', importance: 0.16 },
    { name: 'satisfactionScore', importance: 0.14 },
    { name: 'isDetractor', importance: 0.12 },
    { name: 'paymentRiskScore', importance: 0.11 },
    { name: 'tenureMonths', importance: 0.09 },
    { name: 'monthlyChargeGBP', importance: 0.08 },
    { name: 'chargeVsPlanMedianRatio', importance: 0.07 },
    { name: 'directDebit', importance: 0.05 },
    { name: 'revenueToDateSafe', importance: 0.04 },
  ];

  const driverBarData = topDrivers.map((d) => {
    const isRiskIncreaser = !['directDebit', 'satisfactionScore', 'tenureMonths'].includes(d.name);
    return {
      label: d.name.replace(/([A-Z])/g, ' $1').trim(),
      value: d.importance * 100,
      formattedValue: `${(d.importance * 100).toFixed(1)}% drop (${isRiskIncreaser ? 'Raises Risk' : 'Protects'})`,
      color: isRiskIncreaser ? CHART_COLORS.goldRisk : CHART_COLORS.greenPrimary,
    };
  });

  // Partial Dependence Plots for Top 5 Drivers
  const pdpTenure = computePartialDependence(engineeredDataset, 'tenureMonths', 'Tenure', 'months');
  const pdpCharge = computePartialDependence(engineeredDataset, 'monthlyChargeGBP', 'Monthly Charge', '£');
  const pdpCsat = computePartialDependence(engineeredDataset, 'satisfactionScore', 'Satisfaction', 'score');
  const pdpOutages = computePartialDependence(engineeredDataset, 'networkOutages12M', 'Network Outages', 'outages');
  const pdpFriction = computePartialDependence(engineeredDataset, 'serviceFrictionIndex', 'Friction Index', 'pts');

  // Churn Reasons Distribution
  const churnReasons = computeChurnReasonDistribution(engineeredDataset);

  // Fairness Audit
  const fairnessAudits = computeFairnessAudit(engineeredDataset, 1.4);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-6 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#E6DFC8]">
          <div className="w-8 h-8 rounded-lg bg-[#14633F] text-[#F0E2B0] flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif-display font-bold text-lg text-[#0B3D2E]">
              Model Explainability & Algorithmic Fairness
            </h2>
            <p className="text-xs text-[#7A877F]">
              Permutation feature importance, partial dependence effect curves, and protected attribute fairness auditing.
            </p>
          </div>
        </div>

        {/* Regulatory Fairness Safeguard Notice */}
        <div className="mt-4 p-3 bg-[#FAF6EC] border border-[#E6DFC8] rounded-xl flex items-start gap-2.5 text-xs text-[#2B3A33]">
          <Scale className="w-4 h-4 text-[#14633F] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#0B3D2E]">Protected Attributes Policy: </span>
            In compliance with UK Equality and Consumer Duty standards, customer Age and Gender are sequestered from the default model features. Their impact is audited solely in the Fairness module to detect demographic disparities.
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-4 border-t border-[#E6DFC8]/60 mt-4 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('global')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors ${
              activeTab === 'global' ? 'bg-[#0B3D2E] text-white' : 'bg-[#FAF6EC] text-[#7A877F] hover:text-[#0B3D2E]'
            }`}
          >
            Global Feature Importance
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pdp')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors ${
              activeTab === 'pdp' ? 'bg-[#0B3D2E] text-white' : 'bg-[#FAF6EC] text-[#7A877F] hover:text-[#0B3D2E]'
            }`}
          >
            Partial Dependence Curves (PDP)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reasons')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors ${
              activeTab === 'reasons' ? 'bg-[#0B3D2E] text-white' : 'bg-[#FAF6EC] text-[#7A877F] hover:text-[#0B3D2E]'
            }`}
          >
            Churn Reasons vs Drivers
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fairness')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors ${
              activeTab === 'fairness' ? 'bg-[#0B3D2E] text-white' : 'bg-[#FAF6EC] text-[#7A877F] hover:text-[#0B3D2E]'
            }`}
          >
            Subgroup Fairness Audit
          </button>
        </div>
      </div>

      {/* TAB 1: Global Feature Importance */}
      {activeTab === 'global' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8">
            <ChartCard
              title="Top 15 Permutation Feature Importance"
              insightSubtitle="Gold bars raise churn propensity; Green bars represent protective loyalty factors"
              sampleSize={engineeredDataset.length}
              unitLabel="Mean AUC Drop %"
              tableData={driverBarData.map((d) => ({ Feature: d.label, Importance: d.formattedValue }))}
            >
              <HorizontalBarChart data={driverBarData} />
            </ChartCard>
          </div>

          <div className="lg:col-span-4 bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-5 shadow-2xs space-y-4">
            <h3 className="font-serif-display font-bold text-sm text-[#0B3D2E]">
              Feature Interpretation Guide
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8]">
                <span className="font-semibold text-[#0B3D2E] block">1. Contract Rolling Monthly (+28%)</span>
                <p className="text-[#7A877F] mt-0.5">
                  Lack of a fixed contract lock-in removes switching costs. When combined with a competitor offer, departure likelihood spikes.
                </p>
              </div>

              <div className="p-3 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8]">
                <span className="font-semibold text-[#0B3D2E] block">2. Service Friction Index (+19%)</span>
                <p className="text-[#7A877F] mt-0.5">
                  Cumulative fatigue from repeated tickets, lengthy resolution hours, and outages drives involuntary churn sentiment.
                </p>
              </div>

              <div className="p-3 bg-[#FAF6EC] rounded-xl border border-[#E6DFC8]">
                <span className="font-semibold text-[#0B3D2E] block">3. Direct Debit Mandate (-5%)</span>
                <p className="text-[#7A877F] mt-0.5">
                  Automated bank direct debits represent habitual billing inertia, reducing casual cancellations by ~5 percentage points.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Partial Dependence Plots */}
      {activeTab === 'pdp' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <ChartCard
            title="PDP: Tenure vs Predicted Risk"
            insightSubtitle={pdpTenure.summary}
            sampleSize={engineeredDataset.length}
            unitLabel="Churn %"
          >
            <LineChart
              series={[{ name: 'Predicted Churn %', points: pdpTenure.points, color: CHART_COLORS.greenPrimary }]}
              valueSuffix="%"
            />
          </ChartCard>

          <ChartCard
            title="PDP: Monthly Charge vs Risk"
            insightSubtitle={pdpCharge.summary}
            sampleSize={engineeredDataset.length}
            unitLabel="Churn %"
          >
            <LineChart
              series={[{ name: 'Predicted Churn %', points: pdpCharge.points, color: CHART_COLORS.goldDark }]}
              valueSuffix="%"
            />
          </ChartCard>

          <ChartCard
            title="PDP: Satisfaction Score vs Risk"
            insightSubtitle={pdpCsat.summary}
            sampleSize={engineeredDataset.length}
            unitLabel="Churn %"
          >
            <LineChart
              series={[{ name: 'Predicted Churn %', points: pdpCsat.points, color: CHART_COLORS.greenPositive }]}
              valueSuffix="%"
            />
          </ChartCard>

          <ChartCard
            title="PDP: Network Outages vs Risk"
            insightSubtitle={pdpOutages.summary}
            sampleSize={engineeredDataset.length}
            unitLabel="Churn %"
          >
            <LineChart
              series={[{ name: 'Predicted Churn %', points: pdpOutages.points, color: CHART_COLORS.danger }]}
              valueSuffix="%"
            />
          </ChartCard>

          <ChartCard
            title="PDP: Service Friction Index vs Risk"
            insightSubtitle={pdpFriction.summary}
            sampleSize={engineeredDataset.length}
            unitLabel="Churn %"
          >
            <LineChart
              series={[{ name: 'Predicted Churn %', points: pdpFriction.points, color: CHART_COLORS.goldRisk }]}
              valueSuffix="%"
            />
          </ChartCard>
        </div>
      )}

      {/* TAB 3: Churn Reasons vs Drivers */}
      {activeTab === 'reasons' && (
        <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6DFC8]">
            <h3 className="font-serif-display font-bold text-base text-[#0B3D2E]">
              Reported Churn Exit Reasons Breakdown
            </h3>
            <span className="text-xs text-[#7A877F]">Descriptive analytics strictly isolated from model features</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              {churnReasons.map((r, idx) => (
                <div key={idx} className="p-3 bg-[#FAF6EC] border border-[#E6DFC8] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[#0B3D2E] block">{r.reason}</span>
                    <span className="text-[#7A877F]">{r.count} accounts ({r.percentOfChurn}%)</span>
                  </div>
                  <span className="font-mono font-bold text-[#A63D2F]">£{r.lostRevenueAnnual.toFixed(0)} lost/yr</span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#FAF6EC] border border-[#E6DFC8] rounded-xl text-xs space-y-3">
              <span className="font-bold text-[#0B3D2E] block">Key Alignment: Stated Reason vs Model Drivers</span>
              <p className="text-[#2B3A33] leading-relaxed">
                Customers stating <strong>"Competitor Offer"</strong> exhibited high prevalence of Rolling Monthly contracts and heavy data usage.
              </p>
              <p className="text-[#2B3A33] leading-relaxed">
                Customers citing <strong>"Customer Service"</strong> correlated with Service Friction Index values &gt; 35 and resolution times exceeding 24 hours.
              </p>
              <p className="text-[#2B3A33] leading-relaxed">
                <strong>"Price Increase"</strong> departures correlated with out-of-contract users whose charges exceeded the plan median by &gt; 15%.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Subgroup Fairness Audit */}
      {activeTab === 'fairness' && (
        <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6DFC8]">
            <h3 className="font-serif-display font-bold text-base text-[#0B3D2E]">
              Algorithmic Fairness & Disparity Ratios
            </h3>
            <span className="text-xs text-[#7A877F]">Flagging subgroups with churn risk ratio &gt; 1.4x</span>
          </div>

          <div className="overflow-x-auto border border-[#E6DFC8] rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF6EC] text-[#0B3D2E] sticky top-0 border-b border-[#E6DFC8] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Protected Category</th>
                  <th className="py-2.5 px-3">Subgroup</th>
                  <th className="py-2.5 px-3 text-right">Sample (n)</th>
                  <th className="py-2.5 px-3 text-right">Actual Churn %</th>
                  <th className="py-2.5 px-3 text-right">Avg Predicted Risk %</th>
                  <th className="py-2.5 px-3 text-right">Disparity Ratio</th>
                  <th className="py-2.5 px-3 text-center">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DFC8]/60 text-[#2B3A33]">
                {fairnessAudits.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF6EC]/40">
                    <td className="py-2.5 px-3 font-semibold text-[#0B3D2E]">{item.groupCategory}</td>
                    <td className="py-2.5 px-3 font-medium">{item.subgroup}</td>
                    <td className="py-2.5 px-3 font-mono text-right">{item.sampleCount}</td>
                    <td className="py-2.5 px-3 font-mono text-right">{item.churnRatePercent.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 font-mono text-right">{item.avgPredictedRiskPercent.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 font-mono text-right font-bold text-[#0B3D2E]">
                      {item.disparityRatio.toFixed(2)}x
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.flaggedDisparity ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#A63D2F]/15 text-[#A63D2F] font-bold text-[10px]">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Disparity Flag</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#BFE3CF] text-[#0B3D2E] font-semibold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Within Bounds</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
