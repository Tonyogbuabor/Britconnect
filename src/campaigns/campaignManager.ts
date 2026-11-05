/**
 * BritConnect Retention Campaign Manager
 * Creates, tracks, and evaluates multi-channel churn prevention campaigns
 */
import { RetentionCampaign, RiskBand, EngineeredCustomer } from '../types';

export const INITIAL_DEMO_CAMPAIGNS: RetentionCampaign[] = [
  {
    id: 'camp-q3-rolling',
    name: 'Q3 Rolling Contract Rollover Blitz',
    targetSegment: 'Rolling Contract Defectors',
    targetRiskBands: ['High', 'Critical'],
    offerType: '15% Off for 6M + 12M Fixed Term',
    offerCostGBP: 15.0,
    expectedAcceptRate: 0.35,
    budgetGBP: 350,
    status: 'Active',
    targetCustomersCount: 14,
    contactedCount: 11,
    savedCustomersCount: 4,
    savedRevenueAnnualGBP: 1980.0,
    netROIPercent: 380.0,
    startDate: '2026-08-01',
    endDate: '2026-09-30',
  },
  {
    id: 'camp-outage-care',
    name: 'Outage Resolution & CSAT Recovery',
    targetSegment: 'Network Friction & Dissatisfied',
    targetRiskBands: ['Medium', 'High', 'Critical'],
    offerType: '£20 Bill Credit + Wi-Fi 6 Router Upgrade',
    offerCostGBP: 25.0,
    expectedAcceptRate: 0.42,
    budgetGBP: 400,
    status: 'Active',
    targetCustomersCount: 9,
    contactedCount: 7,
    savedCustomersCount: 3,
    savedRevenueAnnualGBP: 1440.0,
    netROIPercent: 228.0,
    startDate: '2026-08-15',
  },
];

export function createNewCampaign(
  name: string,
  targetSegment: string,
  targetRiskBands: RiskBand[],
  offerType: string,
  offerCostGBP: number,
  expectedAcceptRate: number,
  budgetGBP: number,
  matchingCustomers: EngineeredCustomer[]
): RetentionCampaign {
  const targetCustomersCount = matchingCustomers.length;
  const avgCharge = targetCustomersCount > 0
    ? matchingCustomers.reduce((acc, c) => acc + c.monthlyChargeGBP, 0) / targetCustomersCount
    : 38.0;

  const expectedSaves = Math.round(targetCustomersCount * expectedAcceptRate);
  const savedRevenueAnnual = expectedSaves * avgCharge * 12;
  const totalCost = targetCustomersCount * offerCostGBP;
  const netROI = totalCost > 0 ? ((savedRevenueAnnual * 0.4 - totalCost) / totalCost) * 100 : 0;

  return {
    id: `camp-${Date.now()}`,
    name,
    targetSegment,
    targetRiskBands,
    offerType,
    offerCostGBP,
    expectedAcceptRate,
    budgetGBP,
    status: 'Active',
    targetCustomersCount,
    contactedCount: 0,
    savedCustomersCount: 0,
    savedRevenueAnnualGBP: Number(savedRevenueAnnual.toFixed(2)),
    netROIPercent: Number(netROI.toFixed(1)),
    startDate: new Date().toISOString().substring(0, 10),
  };
}
