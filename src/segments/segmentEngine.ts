/**
 * BritConnect Customer Segmentation Engine
 * Telecom-domain behavioral, value, and risk segment profiles with sample size safeguards
 */
import { EngineeredCustomer, RiskBand } from '../types';

export interface SegmentProfile {
  id: string;
  name: string;
  description: string;
  count: number;
  activeCount: number;
  churnCount: number;
  churnRatePercent: number;
  avgMonthlyCharge: number;
  monthlyRevenueAtRisk: number;
  avgSatisfaction: number;
  topRiskDriver: string;
  recommendedAction: string;
  isInsufficientData: boolean; // n < 5 safeguard
}

export function computeCustomerSegments(customers: EngineeredCustomer[]): SegmentProfile[] {
  const total = customers.length;
  if (total === 0) return [];

  const definitions: Array<{
    id: string;
    name: string;
    description: string;
    filter: (c: EngineeredCustomer) => boolean;
    recommendedAction: string;
  }> = [
    {
      id: 'seg-high-spender-risk',
      name: 'High-Spender At Risk',
      description: 'Premium revenue subscribers (£60+/mo) evaluated in High or Critical risk bands.',
      filter: (c) => c.monthlyChargeGBP >= 55 && (c.riskBand === 'High' || c.riskBand === 'Critical'),
      recommendedAction: 'Executive VIP concierge outreach, personalized bundle rate guarantee, proactive service check.',
    },
    {
      id: 'seg-rolling-defectors',
      name: 'Rolling Contract Defectors',
      description: 'Subscribers on rolling monthly terms or expired contracts without renewal commitments.',
      filter: (c) => c.isRollingMonthly || c.contractExpiredFlag,
      recommendedAction: 'Deploy 12/24-month fixed lock-in incentive with 15% discount for 6 months or device upgrade.',
    },
    {
      id: 'seg-network-friction',
      name: 'Network Friction & Dissatisfied',
      description: 'Customers afflicted by 2+ network outages, escalations, or low CSAT ratings (<=5).',
      filter: (c) => c.networkOutages12M >= 2 || c.complaints12M >= 1 || c.satisfactionScore <= 5,
      recommendedAction: 'Proactive billing credit (£25 goodwill voucher), priority engineer line test, customer care call.',
    },
    {
      id: 'seg-competitor-poached',
      name: 'Competitor Poached Targets',
      description: 'Subscribers exposed to rival promotions (e.g. Openreach altnets, Virgin Media, EE).',
      filter: (c) => c.competitorOfferReceived,
      recommendedAction: 'Price match guarantee, free speed upgrade to Fibre 500/1G, complimentary streaming bundle.',
    },
    {
      id: 'seg-digital-heavy-usage',
      name: 'Digital Youth High-Usage',
      description: 'Ages 18-34 generating heavy data consumption (>400GB/mo).',
      filter: (c) => c.age <= 34 && c.averageMonthlyUsageGB >= 400,
      recommendedAction: 'Uncapped 5G / Full Fibre gaming bundle with low-ping guarantee and digital self-service perks.',
    },
    {
      id: 'seg-loyal-champions',
      name: 'Loyal Fixed-Term Champions',
      description: 'Long-standing accounts (18+ months tenure) on 24-month contracts with high satisfaction (CSAT 8-10).',
      filter: (c) => c.tenureMonths >= 18 && c.contractType === '24 Months' && c.satisfactionScore >= 8,
      recommendedAction: 'Surprise loyalty reward (cafe voucher), referral invitation with dual account credits.',
    },
  ];

  return definitions.map((def) => {
    const matched = customers.filter(def.filter);
    const count = matched.length;
    const isInsufficientData = count < 5;

    const activeCount = matched.filter((c) => c.churnFlag === 0).length;
    const churnCount = matched.filter((c) => c.churnFlag === 1).length;
    const churnRatePercent = count > 0 ? Number(((churnCount / count) * 100).toFixed(1)) : 0;
    const avgMonthlyCharge = count > 0 ? Number((matched.reduce((acc, c) => acc + c.monthlyChargeGBP, 0) / count).toFixed(2)) : 0;
    const monthlyRevenueAtRisk = matched
      .filter((c) => c.churnFlag === 0 && (c.riskBand === 'High' || c.riskBand === 'Critical'))
      .reduce((acc, c) => acc + c.monthlyChargeGBP, 0);
    const avgSatisfaction = count > 0 ? Number((matched.reduce((acc, c) => acc + c.satisfactionScore, 0) / count).toFixed(1)) : 7.0;

    // Determine top driver in this segment
    let topDriver = 'Contract Flexibility';
    if (matched.filter((c) => c.networkOutages12M >= 2).length > count * 0.4) topDriver = 'Network Outages';
    else if (matched.filter((c) => c.competitorOfferReceived).length > count * 0.4) topDriver = 'Competitor Offer';
    else if (matched.filter((c) => c.isRollingMonthly).length > count * 0.5) topDriver = 'Rolling Contract';

    return {
      id: def.id,
      name: def.name,
      description: def.description,
      count,
      activeCount,
      churnCount,
      churnRatePercent,
      avgMonthlyCharge,
      monthlyRevenueAtRisk: Number(monthlyRevenueAtRisk.toFixed(2)),
      avgSatisfaction,
      topRiskDriver: topDriver,
      recommendedAction: def.recommendedAction,
      isInsufficientData,
    };
  });
}

/**
 * Value Tier x Risk Band Matrix
 */
export function computeValueRiskMatrix(customers: EngineeredCustomer[]) {
  const valueTiers: Array<'Top 20%' | 'Middle 40%' | 'Bottom 40%'> = ['Top 20%', 'Middle 40%', 'Bottom 40%'];
  const riskBands: RiskBand[] = ['Low', 'Medium', 'High', 'Critical'];

  const matrix: Array<{
    valueTier: string;
    riskBand: RiskBand;
    count: number;
    totalRevenueMonthly: number;
    avgProbability: number;
  }> = [];

  valueTiers.forEach((vt) => {
    riskBands.forEach((rb) => {
      const cellCustomers = customers.filter(
        (c) => c.customerValueTier === vt && (c.riskBand === rb || (!c.riskBand && rb === 'Low'))
      );
      const count = cellCustomers.length;
      const totalRevenueMonthly = cellCustomers.reduce((acc, c) => acc + c.monthlyChargeGBP, 0);
      const avgProb = count > 0 ? cellCustomers.reduce((acc, c) => acc + (c.churnProbability || 0.2), 0) / count : 0;

      matrix.push({
        valueTier: vt,
        riskBand: rb,
        count,
        totalRevenueMonthly: Number(totalRevenueMonthly.toFixed(2)),
        avgProbability: Number(avgProb.toFixed(3)),
      });
    });
  });

  return matrix;
}
