/**
 * BritConnect AI Customer Churn Intelligence Platform
 * TypeScript Data Models and Types
 */

export type CustomerSegment = 'Consumer' | 'Small Business';

export type ServiceType =
  | 'Mobile'
  | 'Home Broadband'
  | 'Fibre Broadband'
  | 'Mobile + Broadband Bundle';

export type ContractType = 'Rolling Monthly' | '12 Months' | '24 Months';

export type PaymentMethod =
  | 'Direct Debit'
  | 'Credit Card'
  | 'Debit Card'
  | 'Bank Transfer';

export type RiskBand = 'Low' | 'Medium' | 'High' | 'Critical';

export type DataAllowanceType = 'None' | 'Capped' | 'Unlimited';

export interface RawCustomerRecord {
  'Customer ID': string;
  'Customer Segment': string;
  'Age': string | number;
  'Age Band'?: string;
  'Gender'?: string;
  'UK Nation'?: string;
  'City'?: string;
  'Acquisition Channel'?: string;
  'Join Date'?: string;
  'Tenure Months': string | number;
  'Service Type': string;
  'Plan Name'?: string;
  'Contract Type': string;
  'Contract Start Date'?: string;
  'Contract End Date'?: string;
  'Auto Renew'?: string | boolean;
  'Monthly Charge GBP': string | number;
  'Average Monthly Usage GB'?: string | number;
  'Data Allowance GB'?: string | number;
  'Overage Charges GBP'?: string | number;
  'Discount Percent'?: string | number;
  'Payment Method'?: string;
  'Direct Debit'?: string | boolean;
  'Late Payments 12M'?: string | number;
  'Failed Payments 12M'?: string | number;
  'Support Tickets 12M'?: string | number;
  'Complaints 12M'?: string | number;
  'Average Resolution Hours'?: string | number;
  'Network Outages 12M'?: string | number;
  'Satisfaction Score 1 10'?: string | number;
  'NPS Score'?: string | number;
  'Competitor Offer Received'?: string | boolean;
  'Churn Status'?: string;
  'Churn Date'?: string;
  'Churn Reason'?: string;
  'Lifetime Revenue GBP'?: string | number;
  'Monthly Revenue At Risk GBP'?: string | number;
  'Churn Flag': string | number;
  [key: string]: unknown;
}

export interface CleanCustomer {
  customerId: string;
  customerSegment: CustomerSegment;
  age: number;
  ageBand: string;
  gender: string;
  ukNation: string;
  city: string;
  acquisitionChannel: string;
  joinDate: string; // ISO
  tenureMonths: number;
  serviceType: ServiceType;
  planName: string;
  contractType: ContractType;
  contractStartDate: string; // ISO
  contractEndDate: string; // ISO
  autoRenew: boolean;
  monthlyChargeGBP: number;
  averageMonthlyUsageGB: number;
  dataAllowanceGB: number;
  overageChargesGBP: number;
  discountPercent: number;
  paymentMethod: PaymentMethod;
  directDebit: boolean;
  latePayments12M: number;
  failedPayments12M: number;
  supportTickets12M: number;
  complaints12M: number;
  averageResolutionHours: number;
  networkOutages12M: number;
  satisfactionScore: number; // 1-10
  npsScore: number; // -100 to 100
  competitorOfferReceived: boolean;
  churnStatus: 'Active' | 'Churned';
  churnDate?: string;
  churnReason?: string;
  lifetimeRevenueGBP: number;
  monthlyRevenueAtRiskGBP: number;
  churnFlag: number; // 0 or 1
  rawRowIndex?: number;
}

export interface EngineeredCustomer extends CleanCustomer {
  // Engineered features
  tenureBucket: '0-6' | '7-12' | '13-24' | '25+';
  isNewCustomer: boolean;
  contractExpiredFlag: boolean;
  monthsPastContractEnd: number;
  monthsUntilContractEnd: number;
  isRollingMonthly: boolean;
  contractTermMonths: number;
  chargeVsPlanMedianRatio: number;
  chargeVsServiceMedianRatio: number;
  discountAdjustedCharge: number;
  hasDiscount: boolean;
  chargePerGB: number;
  allowanceType: DataAllowanceType;
  usageToAllowanceRatio: number;
  usagePercentile: number;
  lowUsageFlag: boolean;
  hasOverage: boolean;
  paymentRiskScore: number; // 0-100
  anyFailedPayment: boolean;
  complaintRate: number;
  hasTickets: boolean;
  resolutionTimeBucket: 'None' | 'Fast (0-12h)' | 'Moderate (12-24h)' | 'Slow (>24h)';
  serviceFrictionIndex: number; // 0-100
  npsCategory: 'Promoter' | 'Passive' | 'Detractor';
  isDetractor: boolean;
  satisfactionOutageInteraction: number;
  competitorOfferRollingInteraction: boolean;
  cityTier: 'Major City' | 'Regional';
  annualisedRevenue: number;
  customerValueTier: 'Top 20%' | 'Middle 40%' | 'Bottom 40%';
  revenueToDateSafe: number; // monthlyCharge * tenureMonths

  // Scoring outputs (populated after inference)
  churnProbability?: number; // 0 to 1
  riskBand?: RiskBand;
  riskRank?: number;
  expectedRevenueAtRisk?: number;
  topDrivers?: CustomerDriver[];
}

export interface CustomerDriver {
  featureName: string;
  displayName: string;
  impactScore: number; // SHAP or coef * norm
  direction: 'increases_risk' | 'decreases_risk';
  explanation: string;
}

export interface ValidationIssue {
  id: string;
  severity: 'Error' | 'Warning' | 'Info';
  rule: string;
  column?: string;
  count: number;
  sampleRows: string[];
  message: string;
  autoFixAvailable: boolean;
  autoFixDescription?: string;
  applied?: boolean;
}

export interface DataQualityReport {
  overallScore: number; // 0-100
  completeness: number; // 0-100
  validity: number; // 0-100
  uniqueness: number; // 0-100
  consistency: number; // 0-100
  totalRows: number;
  totalColumns: number;
  issues: ValidationIssue[];
  leakageColumns: string[];
}

export interface CleaningAuditEntry {
  id: string;
  rule: string;
  description: string;
  rowsAffected: number;
  beforeSample: string;
  afterSample: string;
  timestamp: string;
}

export type ModelType =
  | 'logistic_regression'
  | 'decision_tree'
  | 'random_forest'
  | 'gradient_boosting';

export interface ConfidenceInterval {
  lower: number;
  mean: number;
  upper: number;
}

export interface ModelMetrics {
  rocAuc: ConfidenceInterval;
  prAuc: ConfidenceInterval;
  accuracy: ConfidenceInterval;
  balancedAccuracy: ConfidenceInterval;
  precision: ConfidenceInterval;
  recall: ConfidenceInterval;
  f1: ConfidenceInterval;
  f2: ConfidenceInterval;
  brierScore: ConfidenceInterval;
  logLoss: ConfidenceInterval;
  matthewsCorr: ConfidenceInterval;
  specificity: ConfidenceInterval;
  liftTop10: number;
  liftTop20: number;
  ksStatistic: number;
}

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  total: number;
  threshold: number;
}

export interface CurvePoint {
  x: number;
  y: number;
  threshold?: number;
}

export interface ModelTrainedVersion {
  id: string;
  name: string;
  type: ModelType;
  trainedAt: string;
  datasetHash: string;
  sampleSize: number;
  churnCount: number;
  featureNames: string[];
  metrics: ModelMetrics;
  confusionMatrix: ConfusionMatrix;
  rocCurve: CurvePoint[];
  prCurve: CurvePoint[];
  calibrationCurve: CurvePoint[];
  cumulativeGains: CurvePoint[];
  liftCurve: CurvePoint[];
  featureImportance: Array<{ name: string; importance: number; ciLower?: number; ciUpper?: number }>;
  coefficients?: Record<string, number>;
  optimalThreshold: number;
  isChampion: boolean;
  weights?: number[];
  intercept?: number;
  treeModel?: unknown;
}

export interface RetentionCampaign {
  id: string;
  name: string;
  targetSegment: string;
  targetRiskBands: RiskBand[];
  offerType: string;
  offerCostGBP: number;
  expectedAcceptRate: number; // 0.1 to 1.0
  budgetGBP: number;
  status: 'Draft' | 'Active' | 'Paused' | 'Completed';
  targetCustomersCount: number;
  contactedCount: number;
  savedCustomersCount: number;
  savedRevenueAnnualGBP: number;
  netROIPercent: number;
  startDate: string;
  endDate?: string;
}

export interface GlobalFilters {
  dateRange: 'all' | '30d' | '90d' | '12m' | '24m';
  customerSegment: 'all' | CustomerSegment;
  serviceType: 'all' | ServiceType;
  ukNation: 'all' | string;
  city: 'all' | string;
  contractType: 'all' | ContractType;
  acquisitionChannel: 'all' | string;
  riskBand: 'all' | RiskBand;
  search: string;
}

export interface AppSettings {
  allowAiNarrative: boolean;
  maskCustomerIds: boolean;
  decisionThreshold: number;
  costPerRetentionOffer: number;
  offerSuccessRate: number;
  averageMarginPercent: number;
  evaluationHorizonMonths: number;
  randomSeed: number;
  cvFolds: number;
  cvRepeats: number;
}
