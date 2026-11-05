/**
 * BritConnect Explainability & Fairness Engine
 * Global Permutation Importance, Partial Dependence (PDP), Local Waterfall, Churn Reason Analysis, and Fairness Audit
 */
import { EngineeredCustomer, ModelTrainedVersion, CurvePoint } from '../types';

export interface PartialDependencePlot {
  featureName: string;
  displayName: string;
  unit: string;
  points: CurvePoint[];
  rugPoints: number[];
  summary: string;
}

export interface FairnessSubgroupAudit {
  groupCategory: 'Age Band' | 'Gender' | 'UK Nation';
  subgroup: string;
  sampleCount: number;
  churnRatePercent: number;
  avgPredictedRiskPercent: number;
  disparityRatio: number;
  flaggedDisparity: boolean;
}

export function computePartialDependence(
  customers: EngineeredCustomer[],
  featureName: keyof EngineeredCustomer,
  displayName: string,
  unit: string,
  bins = 6
): PartialDependencePlot {
  const numericValues = customers
    .map((c) => Number(c[featureName]))
    .filter((v) => !isNaN(v));

  if (numericValues.length === 0) {
    return {
      featureName: String(featureName),
      displayName,
      unit,
      points: [],
      rugPoints: [],
      summary: 'No data available',
    };
  }

  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  const step = (max - min) / Math.max(1, bins);

  const points: CurvePoint[] = [];

  for (let i = 0; i < bins; i++) {
    const binLow = min + i * step;
    const binHigh = min + (i + 1) * step;
    const mid = (binLow + binHigh) / 2;

    const matching = customers.filter((c) => {
      const v = Number(c[featureName]);
      return i === bins - 1 ? v >= binLow && v <= binHigh : v >= binLow && v < binHigh;
    });

    const meanRisk =
      matching.length > 0
        ? matching.reduce((acc, c) => acc + (c.churnProbability || 0.2), 0) / matching.length
        : 0.2;

    points.push({
      x: Number(mid.toFixed(1)),
      y: Number((meanRisk * 100).toFixed(1)),
      threshold: matching.length, // sample size n in bin
    });
  }

  // Rug points (sample of 25 values for visual density)
  const rugPoints = numericValues.slice(0, 25);

  const firstVal = points[0]?.y || 20;
  const lastVal = points[points.length - 1]?.y || 20;
  const direction = lastVal > firstVal ? 'increases' : 'decreases';
  const summary = `As ${displayName.toLowerCase()} rises from ${min.toFixed(0)} to ${max.toFixed(0)} ${unit}, average churn risk ${direction} by ${Math.abs(lastVal - firstVal).toFixed(1)} percentage points.`;

  return {
    featureName: String(featureName),
    displayName,
    unit,
    points,
    rugPoints,
    summary,
  };
}

export function computeFairnessAudit(
  customers: EngineeredCustomer[],
  disparityThreshold = 1.35
): FairnessSubgroupAudit[] {
  const total = customers.length;
  if (total === 0) return [];

  const baseChurnRate = (customers.filter((c) => c.churnFlag === 1).length / total) * 100;
  const audits: FairnessSubgroupAudit[] = [];

  const auditCategory = (
    catName: 'Age Band' | 'Gender' | 'UK Nation',
    accessor: (c: EngineeredCustomer) => string
  ) => {
    const groups = new Map<string, EngineeredCustomer[]>();
    customers.forEach((c) => {
      const val = accessor(c) || 'Other';
      if (!groups.has(val)) groups.set(val, []);
      groups.get(val)!.push(c);
    });

    groups.forEach((groupCustomers, groupName) => {
      const count = groupCustomers.length;
      const churnRate = count > 0 ? (groupCustomers.filter((c) => c.churnFlag === 1).length / count) * 100 : 0;
      const avgPred = count > 0 ? (groupCustomers.reduce((acc, c) => acc + (c.churnProbability || 0.2), 0) / count) * 100 : 0;
      const ratio = baseChurnRate > 0 ? churnRate / baseChurnRate : 1.0;
      const flagged = count >= 4 && (ratio >= disparityThreshold || ratio <= 1 / disparityThreshold);

      audits.push({
        groupCategory: catName,
        subgroup: groupName,
        sampleCount: count,
        churnRatePercent: Number(churnRate.toFixed(1)),
        avgPredictedRiskPercent: Number(avgPred.toFixed(1)),
        disparityRatio: Number(ratio.toFixed(2)),
        flaggedDisparity: flagged,
      });
    });
  };

  auditCategory('Age Band', (c) => c.ageBand);
  auditCategory('Gender', (c) => c.gender);
  auditCategory('UK Nation', (c) => c.ukNation);

  return audits;
}

export function computeChurnReasonDistribution(customers: EngineeredCustomer[]) {
  const churned = customers.filter((c) => c.churnFlag === 1);
  const reasonCounts: Record<string, { count: number; lostRevenue: number }> = {};

  churned.forEach((c) => {
    const reason = c.churnReason || 'Unknown';
    if (!reasonCounts[reason]) {
      reasonCounts[reason] = { count: 0, lostRevenue: 0 };
    }
    reasonCounts[reason].count++;
    reasonCounts[reason].lostRevenue += c.monthlyChargeGBP * 12;
  });

  return Object.entries(reasonCounts)
    .map(([reason, data]) => ({
      reason,
      count: data.count,
      percentOfChurn: Number(((data.count / Math.max(1, churned.length)) * 100).toFixed(1)),
      lostRevenueAnnual: Number(data.lostRevenue.toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count);
}
