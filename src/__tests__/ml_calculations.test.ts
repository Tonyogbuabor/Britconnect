import { describe, it, expect } from 'vitest';
import { sigmoid, computeRocAuc, computePrAuc, calculateThresholdEconomics } from '../ml/mathUtils';
import { cleanCustomerDataset } from '../clean/dataCleaner';
import { engineerCustomerFeatures } from '../features/featureEngineering';

describe('BritConnect Deterministic Calculations', () => {
  it('sigmoid function produces expected values', () => {
    expect(sigmoid(0)).toBeCloseTo(0.5);
    expect(sigmoid(100)).toBe(1);
    expect(sigmoid(-100)).toBe(0);
  });

  it('computes exact ROC-AUC for perfect ranking', () => {
    const yTrue = [1, 1, 0, 0];
    const yScore = [0.9, 0.8, 0.2, 0.1];
    const { auc } = computeRocAuc(yTrue, yScore);
    expect(auc).toBe(1.0);
  });

  it('computes exact PR-AUC for baseline', () => {
    const yTrue = [1, 0, 1, 0];
    const yScore = [0.8, 0.7, 0.6, 0.5];
    const { prAuc } = computePrAuc(yTrue, yScore);
    expect(prAuc).toBeGreaterThan(0.5);
    expect(prAuc).toBeLessThanOrEqual(1.0);
  });

  it('calculates threshold business economics deterministically', () => {
    const matrix = { tp: 8, fp: 6, tn: 33, fn: 3, total: 50, threshold: 0.45 };
    const econ = calculateThresholdEconomics(matrix, 40.0, 15.0, 30.0, 40.0, 12);

    expect(econ.contacted).toBe(14);
    expect(econ.campaignCost).toBe(210); // 14 * 15
    expect(econ.expectedSaves).toBeCloseTo(2.4); // 8 * 0.3
    expect(econ.revenueSavedAnnual).toBeCloseTo(1152.0); // 2.4 * 40 * 12
    expect(econ.grossProfitSaved).toBeCloseTo(460.8); // 1152 * 0.4
    expect(econ.netROI).toBeGreaterThan(0);
  });

  it('cleans dates and avoids post-churn leakage in feature engineering', () => {
    const raw = [
      {
        'Customer ID': 'BCT-TEST',
        'Customer Segment': 'Consumer',
        'Age': '45',
        'Monthly Charge GBP': '£35.50',
        'Tenure Months': '12',
        'Service Type': 'Mobile',
        'Plan Name': 'Mobile Plus',
        'Contract Type': 'Rolling Monthly',
        'Join Date': '12/20/2023',
        'Churn Flag': '1',
        'Churn Status': 'Churned',
        'Churn Reason': 'Competitor Offer',
        'Monthly Revenue At Risk GBP': '35.50',
        'Lifetime Revenue GBP': '426.00',
      },
    ];

    const { cleaned } = cleanCustomerDataset(raw);
    expect(cleaned[0].monthlyChargeGBP).toBe(35.5);
    expect(cleaned[0].joinDate).toBe('2023-12-20');

    const { engineered } = engineerCustomerFeatures(cleaned);
    expect(engineered[0].isRollingMonthly).toBe(true);
    expect(engineered[0].revenueToDateSafe).toBeCloseTo(426.0); // Monthly charge * tenure
  });
});
