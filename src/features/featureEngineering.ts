/**
 * BritConnect Automated Feature Engineering Engine
 * Computes strictly pre-churn, leakage-safe features and produces a Feature Catalogue
 */
import { CleanCustomer, EngineeredCustomer, DataAllowanceType } from '../types';

export interface FeatureCatalogueItem {
  id: string;
  name: string;
  category: 'Tenure' | 'Contract' | 'Pricing' | 'Usage' | 'Payment' | 'Service' | 'Sentiment' | 'Market' | 'Demographic' | 'Value';
  definition: string;
  type: 'numeric' | 'binary' | 'categorical';
  univariateLift: number; // Churn rate when high vs low / present vs absent
  includedInModel: boolean;
}

export function engineerCustomerFeatures(customers: CleanCustomer[]): {
  engineered: EngineeredCustomer[];
  catalogue: FeatureCatalogueItem[];
} {
  if (customers.length === 0) {
    return { engineered: [], catalogue: [] };
  }

  // 1. Calculate medians by Plan and Service Type
  const planCharges: Record<string, number[]> = {};
  const serviceCharges: Record<string, number[]> = {};
  const serviceUsages: Record<string, number[]> = {};

  customers.forEach((c) => {
    if (!planCharges[c.planName]) planCharges[c.planName] = [];
    planCharges[c.planName].push(c.monthlyChargeGBP);

    if (!serviceCharges[c.serviceType]) serviceCharges[c.serviceType] = [];
    serviceCharges[c.serviceType].push(c.monthlyChargeGBP);

    if (!serviceUsages[c.serviceType]) serviceUsages[c.serviceType] = [];
    serviceUsages[c.serviceType].push(c.averageMonthlyUsageGB);
  });

  const getMedian = (arr: number[]) => {
    if (!arr.length) return 30;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const planMedians: Record<string, number> = {};
  for (const [p, vals] of Object.entries(planCharges)) {
    planMedians[p] = getMedian(vals);
  }

  const serviceMedians: Record<string, number> = {};
  for (const [s, vals] of Object.entries(serviceCharges)) {
    serviceMedians[s] = getMedian(vals);
  }

  // Value tier percentiles (80th and 40th percentile of monthly charges)
  const allCharges = customers.map((c) => c.monthlyChargeGBP).sort((a, b) => a - b);
  const p80 = allCharges[Math.floor(allCharges.length * 0.8)] ?? 60;
  const p40 = allCharges[Math.floor(allCharges.length * 0.4)] ?? 30;

  const MAJOR_UK_CITIES = ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Edinburgh', 'Glasgow', 'Belfast', 'Cardiff'];

  // Current snapshot date assumed to be around mid-2026 based on data
  const snapshotDate = new Date('2026-09-01');

  const engineered: EngineeredCustomer[] = customers.map((c) => {
    // Tenure
    const tenureBucket = c.tenureMonths <= 6 ? '0-6' : c.tenureMonths <= 12 ? '7-12' : c.tenureMonths <= 24 ? '13-24' : '25+';
    const isNewCustomer = c.tenureMonths <= 6;

    // Contract
    const isRollingMonthly = c.contractType === 'Rolling Monthly';
    let contractTermMonths = 12;
    if (c.contractType === '24 Months') contractTermMonths = 24;
    else if (c.contractType === 'Rolling Monthly') contractTermMonths = 1;

    let contractExpiredFlag = false;
    let monthsPastContractEnd = 0;
    let monthsUntilContractEnd = 0;

    if (c.contractEndDate) {
      const endD = new Date(c.contractEndDate);
      if (!isNaN(endD.getTime())) {
        const diffMonths = (snapshotDate.getTime() - endD.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
        if (diffMonths > 0) {
          contractExpiredFlag = true;
          monthsPastContractEnd = Math.max(0, Math.round(diffMonths));
          monthsUntilContractEnd = -monthsPastContractEnd;
        } else {
          monthsUntilContractEnd = Math.max(0, Math.round(-diffMonths));
        }
      }
    }

    if (isRollingMonthly) {
      contractExpiredFlag = true;
      monthsPastContractEnd = Math.max(monthsPastContractEnd, 1);
    }

    // Pricing
    const planMed = planMedians[c.planName] || 35;
    const servMed = serviceMedians[c.serviceType] || 35;
    const chargeVsPlanMedianRatio = Number((c.monthlyChargeGBP / (planMed || 1)).toFixed(2));
    const chargeVsServiceMedianRatio = Number((c.monthlyChargeGBP / (servMed || 1)).toFixed(2));
    const hasDiscount = c.discountPercent > 0;
    const discountAdjustedCharge = Number((c.monthlyChargeGBP * (1 - c.discountPercent / 100)).toFixed(2));

    // Usage & Allowance
    let allowanceType: DataAllowanceType = 'Capped';
    if (c.dataAllowanceGB === 0) {
      allowanceType = 'None';
    } else if (c.dataAllowanceGB >= 999) {
      allowanceType = 'Unlimited';
    }

    let usageToAllowanceRatio = 0;
    let chargePerGB = 0;
    if (allowanceType === 'Capped' && c.dataAllowanceGB > 0) {
      usageToAllowanceRatio = Number((c.averageMonthlyUsageGB / c.dataAllowanceGB).toFixed(2));
      chargePerGB = Number((c.monthlyChargeGBP / c.dataAllowanceGB).toFixed(2));
    }

    // Usage percentile in service type
    const sUsages = serviceUsages[c.serviceType] || [];
    const countBelow = sUsages.filter((u) => u < c.averageMonthlyUsageGB).length;
    const usagePercentile = sUsages.length > 0 ? Math.round((countBelow / sUsages.length) * 100) : 50;
    const lowUsageFlag = usagePercentile <= 25;
    const hasOverage = c.overageChargesGBP > 0;

    // Payment Behaviour
    const paymentRiskScore = Math.min(100, (c.latePayments12M * 12 + c.failedPayments12M * 25));
    const anyFailedPayment = c.failedPayments12M > 0;

    // Service Experience
    const hasTickets = c.supportTickets12M > 0;
    const complaintRate = Number((c.complaints12M / Math.max(1, c.supportTickets12M)).toFixed(2));

    let resolutionTimeBucket: 'None' | 'Fast (0-12h)' | 'Moderate (12-24h)' | 'Slow (>24h)' = 'None';
    if (hasTickets) {
      if (c.averageResolutionHours <= 12) resolutionTimeBucket = 'Fast (0-12h)';
      else if (c.averageResolutionHours <= 24) resolutionTimeBucket = 'Moderate (12-24h)';
      else resolutionTimeBucket = 'Slow (>24h)';
    }

    // Service friction index (0-100)
    const frictionRaw = (c.supportTickets12M * 8) + (c.complaints12M * 18) + (c.networkOutages12M * 15) + (Math.min(c.averageResolutionHours, 40) * 0.7);
    const serviceFrictionIndex = Math.min(100, Math.round(frictionRaw));

    // Sentiment
    let npsCategory: 'Promoter' | 'Passive' | 'Detractor' = 'Passive';
    if (c.npsScore >= 50) npsCategory = 'Promoter';
    else if (c.npsScore < 0) npsCategory = 'Detractor';
    const isDetractor = npsCategory === 'Detractor';

    const satisfactionOutageInteraction = Number(((11 - c.satisfactionScore) * (c.networkOutages12M + 1)).toFixed(1));

    // Market Pressure
    const competitorOfferRollingInteraction = c.competitorOfferReceived && isRollingMonthly;

    // Demographics
    const cityTier = MAJOR_UK_CITIES.includes(c.city) ? 'Major City' : 'Regional';

    // Value
    const annualisedRevenue = Number((c.monthlyChargeGBP * 12).toFixed(2));
    let customerValueTier: 'Top 20%' | 'Middle 40%' | 'Bottom 40%' = 'Middle 40%';
    if (c.monthlyChargeGBP >= p80) customerValueTier = 'Top 20%';
    else if (c.monthlyChargeGBP <= p40) customerValueTier = 'Bottom 40%';

    const revenueToDateSafe = Number((c.monthlyChargeGBP * c.tenureMonths).toFixed(2));

    return {
      ...c,
      tenureBucket,
      isNewCustomer,
      contractExpiredFlag,
      monthsPastContractEnd,
      monthsUntilContractEnd,
      isRollingMonthly,
      contractTermMonths,
      chargeVsPlanMedianRatio,
      chargeVsServiceMedianRatio,
      discountAdjustedCharge,
      hasDiscount,
      chargePerGB,
      allowanceType,
      usageToAllowanceRatio,
      usagePercentile,
      lowUsageFlag,
      hasOverage,
      paymentRiskScore,
      anyFailedPayment,
      complaintRate,
      hasTickets,
      resolutionTimeBucket,
      serviceFrictionIndex,
      npsCategory,
      isDetractor,
      satisfactionOutageInteraction,
      competitorOfferRollingInteraction,
      cityTier,
      annualisedRevenue,
      customerValueTier,
      revenueToDateSafe,
    };
  });

  // Calculate univariate lift for feature catalogue
  const baseChurnRate = customers.filter((c) => c.churnFlag === 1).length / customers.length;

  const calculateLift = (predicate: (c: EngineeredCustomer) => boolean): number => {
    const subset = engineered.filter(predicate);
    if (subset.length < 3) return 1.0;
    const subsetChurnRate = subset.filter((c) => c.churnFlag === 1).length / subset.length;
    return Number((baseChurnRate > 0 ? subsetChurnRate / baseChurnRate : 1.0).toFixed(2));
  };

  const catalogue: FeatureCatalogueItem[] = [
    {
      id: 'isRollingMonthly',
      name: 'Contract: Rolling Monthly',
      category: 'Contract',
      definition: 'Subscribers not bound by fixed 12/24 month terms.',
      type: 'binary',
      univariateLift: calculateLift((c) => c.isRollingMonthly),
      includedInModel: true,
    },
    {
      id: 'contractExpiredFlag',
      name: 'Contract: Expired / Rolling Over',
      category: 'Contract',
      definition: 'Agreement end date has lapsed without renewal.',
      type: 'binary',
      univariateLift: calculateLift((c) => c.contractExpiredFlag),
      includedInModel: true,
    },
    {
      id: 'serviceFrictionIndex',
      name: 'Service Friction Index',
      category: 'Service',
      definition: 'Standardized composite of support calls, disputes, resolution time, and network outages.',
      type: 'numeric',
      univariateLift: calculateLift((c) => c.serviceFrictionIndex >= 30),
      includedInModel: true,
    },
    {
      id: 'networkOutages12M',
      name: 'Network Outages (12M)',
      category: 'Service',
      definition: 'Count of service interruptions experienced in the last 12 months.',
      type: 'numeric',
      univariateLift: calculateLift((c) => c.networkOutages12M >= 2),
      includedInModel: true,
    },
    {
      id: 'competitorOfferReceived',
      name: 'Competitor Offer Exposure',
      category: 'Market',
      definition: 'Customer reported receiving an active poaching promotion from another ISP/telco.',
      type: 'binary',
      univariateLift: calculateLift((c) => c.competitorOfferReceived),
      includedInModel: true,
    },
    {
      id: 'isDetractor',
      name: 'NPS Detractor Flag',
      category: 'Sentiment',
      definition: 'NPS score is negative (<0) or CSAT score <= 5.',
      type: 'binary',
      univariateLift: calculateLift((c) => c.isDetractor),
      includedInModel: true,
    },
    {
      id: 'satisfactionScore',
      name: 'Satisfaction Score (1-10)',
      category: 'Sentiment',
      definition: 'Overall reported satisfaction rating.',
      type: 'numeric',
      univariateLift: calculateLift((c) => c.satisfactionScore <= 5),
      includedInModel: true,
    },
    {
      id: 'tenureMonths',
      name: 'Tenure (Months)',
      category: 'Tenure',
      definition: 'Number of continuous months subscribed with BritConnect.',
      type: 'numeric',
      univariateLift: calculateLift((c) => c.tenureMonths <= 12),
      includedInModel: true,
    },
    {
      id: 'monthlyChargeGBP',
      name: 'Monthly Charge (£)',
      category: 'Pricing',
      definition: 'Baseline recurring monthly fee.',
      type: 'numeric',
      univariateLift: calculateLift((c) => c.monthlyChargeGBP >= 50),
      includedInModel: true,
    },
    {
      id: 'paymentRiskScore',
      name: 'Payment Risk Score',
      category: 'Payment',
      definition: 'Weighted index of late and failed direct debit transactions.',
      type: 'numeric',
      univariateLift: calculateLift((c) => c.paymentRiskScore > 20),
      includedInModel: true,
    },
    {
      id: 'directDebit',
      name: 'Direct Debit Active',
      category: 'Payment',
      definition: 'Automated direct debit bank mandate active.',
      type: 'binary',
      univariateLift: calculateLift((c) => !c.directDebit),
      includedInModel: true,
    },
    {
      id: 'chargeVsPlanMedianRatio',
      name: 'Charge vs Plan Median Ratio',
      category: 'Pricing',
      definition: 'Ratio of customer price to median price across peers on the same tariff.',
      type: 'numeric',
      univariateLift: calculateLift((c) => c.chargeVsPlanMedianRatio > 1.1),
      includedInModel: true,
    },
    {
      id: 'revenueToDateSafe',
      name: 'Leakage-Safe Revenue to Date',
      category: 'Value',
      definition: 'Derived pre-churn spend (Monthly Charge x Tenure) replacing raw Lifetime Revenue.',
      type: 'numeric',
      univariateLift: calculateLift((c) => c.revenueToDateSafe < 400),
      includedInModel: true,
    },
  ];

  return { engineered, catalogue };
}
