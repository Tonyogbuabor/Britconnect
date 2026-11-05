/**
 * BritConnect Retention Playbook Engine
 * Evidence-based UK telecoms retention packages with commercial ROI modeling
 */
import { EngineeredCustomer, RiskBand } from '../types';

export interface RetentionTactic {
  tier: 'Tier 1: Immediate Save (Days 1–7)' | 'Tier 2: 30-Day Nurture (Days 8–30)' | 'Tier 3: 90-Day Loyalty (Days 31–90)';
  title: string;
  targetTrigger: string;
  channels: string[];
  offerSummary: string;
  costPerSubscriberGBP: number;
  expectedAcceptRate: number; // e.g. 0.35 = 35%
  retentionLiftPct: number; // e.g. +28 pts retention
  telecomProducts: string[];
}

export const TELECOM_PLAYBOOK_TACTICS: RetentionTactic[] = [
  {
    tier: 'Tier 1: Immediate Save (Days 1–7)',
    title: 'Rolling Contract Lock-In Incentive',
    targetTrigger: 'Active on Rolling Monthly or Expired 12/24M contract term',
    channels: ['SMS Direct Link', 'Telesales Priority Call', 'MyBritConnect App Banner'],
    offerSummary: 'Offer 15% discount for 6 months upon locking in a 12-month or 24-month contract, plus a guaranteed price freeze.',
    costPerSubscriberGBP: 18.0,
    expectedAcceptRate: 0.38,
    retentionLiftPct: 34,
    telecomProducts: ['Mobile Plus', 'Home 40', 'Fibre 100', 'Full Fibre 1G'],
  },
  {
    tier: 'Tier 1: Immediate Save (Days 1–7)',
    title: 'Service Outage VIP Care & Credit',
    targetTrigger: 'Customers experiencing 2+ network interruptions in 12M',
    channels: ['Proactive Care Call', 'Executive Email Notification'],
    offerSummary: 'Automatic £20 goodwill bill credit applied, direct priority line to UK senior technical care, and complimentary 4G/5G backup dongle.',
    costPerSubscriberGBP: 25.0,
    expectedAcceptRate: 0.45,
    retentionLiftPct: 40,
    telecomProducts: ['Home Broadband', 'Fibre Broadband', 'Connect Duo'],
  },
  {
    tier: 'Tier 2: 30-Day Nurture (Days 8–30)',
    title: 'Speed Boost & Bundle Convergence',
    targetTrigger: 'Single-play mobile or broadband customers receiving competitor offers',
    channels: ['Interactive WhatsApp Offer', 'Account Dashboard Promotion'],
    offerSummary: 'Complimentary upgrade to "Family Connect" or Fibre 500 for the price of standard tier for 12 months with £0 setup fee.',
    costPerSubscriberGBP: 22.0,
    expectedAcceptRate: 0.32,
    retentionLiftPct: 30,
    telecomProducts: ['Family Connect Bundle', 'Fibre 500', 'Premium Bundle'],
  },
  {
    tier: 'Tier 3: 90-Day Loyalty (Days 31–90)',
    title: 'Milestone Loyalty & Perk Pass',
    targetTrigger: 'Tenure > 18 months in Middle/Top value tiers approaching renewal window',
    channels: ['Postal Loyalty Gift Pack', 'Email Digest'],
    offerSummary: '£30 high-street reward voucher (Marks & Spencer or Amazon UK) upon renewing agreement, with free router upgrade to Wi-Fi 6 Hub.',
    costPerSubscriberGBP: 35.0,
    expectedAcceptRate: 0.52,
    retentionLiftPct: 46,
    telecomProducts: ['All BritConnect Services'],
  },
];

export function computeCampaignProjection(
  targetCustomers: EngineeredCustomer[],
  tactic: RetentionTactic,
  marginPercent = 40,
  horizonMonths = 12
) {
  const targetCount = targetCustomers.length;
  const avgMonthlyCharge =
    targetCount > 0
      ? targetCustomers.reduce((acc, c) => acc + c.monthlyChargeGBP, 0) / targetCount
      : 38.0;

  const totalCampaignCost = targetCount * tactic.costPerSubscriberGBP;
  const expectedSaves = Math.round(targetCount * tactic.expectedAcceptRate);
  const annualRevenueSaved = expectedSaves * avgMonthlyCharge * horizonMonths;
  const grossProfitSaved = annualRevenueSaved * (marginPercent / 100);
  const netROI = totalCampaignCost > 0 ? ((grossProfitSaved - totalCampaignCost) / totalCampaignCost) * 100 : 0;

  return {
    targetCount,
    avgMonthlyCharge: Number(avgMonthlyCharge.toFixed(2)),
    totalCampaignCost: Number(totalCampaignCost.toFixed(2)),
    expectedSaves,
    annualRevenueSaved: Number(annualRevenueSaved.toFixed(2)),
    grossProfitSaved: Number(grossProfitSaved.toFixed(2)),
    netROIPercent: Number(netROI.toFixed(1)),
  };
}
