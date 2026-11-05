/**
 * BritConnect Data Quality Validator & Leakage Detector
 * Comprehensive rule-based validation engine with severity and auto-fix capabilities
 */
import { DataQualityReport, ValidationIssue } from '../types';

export const KNOWN_UK_CITIES = [
  'London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds',
  'Sheffield', 'Bristol', 'Newcastle', 'Nottingham', 'Southampton',
  'Edinburgh', 'Glasgow', 'Cardiff', 'Swansea', 'Newport', 'Belfast'
];

export const VALID_UK_NATIONS = ['England', 'Scotland', 'Wales', 'Northern Ireland'];

export const LEAKAGE_COLUMN_CANDIDATES = [
  'Churn Status',
  'Churn Date',
  'Churn Reason',
  'Monthly Revenue At Risk GBP',
  'Lifetime Revenue GBP',
  'revenue_at_risk',
  'cancellation_reason'
];

/**
 * Validates raw or semi-mapped customer records
 */
export function validateCustomerDataset(records: Record<string, unknown>[]): DataQualityReport {
  const issues: ValidationIssue[] = [];
  const totalRows = records.length;
  const columns = totalRows > 0 ? Object.keys(records[0]) : [];

  if (totalRows === 0) {
    return {
      overallScore: 0,
      completeness: 0,
      validity: 0,
      uniqueness: 0,
      consistency: 0,
      totalRows: 0,
      totalColumns: 0,
      issues: [],
      leakageColumns: [],
    };
  }

  // 1. Uniqueness: Check for duplicate Customer IDs
  const seenIds = new Map<string, number>();
  const duplicateIds: string[] = [];

  records.forEach((r, idx) => {
    const id = String(r['Customer ID'] || r['customerId'] || `ROW_${idx}`).trim();
    if (seenIds.has(id)) {
      duplicateIds.push(id);
    } else {
      seenIds.set(id, idx);
    }
  });

  if (duplicateIds.length > 0) {
    issues.push({
      id: 'rule-dup-id',
      severity: 'Error',
      rule: 'Unique Customer ID Constraint',
      column: 'Customer ID',
      count: duplicateIds.length,
      sampleRows: duplicateIds.slice(0, 5),
      message: `Found ${duplicateIds.length} duplicate Customer IDs. Records should be uniquely identified.`,
      autoFixAvailable: true,
      autoFixDescription: 'Keep latest record per customer ID and discard earlier duplicates.',
    });
  }

  // 2. Target Check: Missing or invalid Churn Flag
  let missingTargetCount = 0;
  const missingTargetSamples: string[] = [];

  records.forEach((r, idx) => {
    const targetVal = r['Churn Flag'] ?? r['churnFlag'] ?? r['churn_flag'];
    if (targetVal === undefined || targetVal === null || targetVal === '') {
      missingTargetCount++;
      if (missingTargetSamples.length < 5) {
        missingTargetSamples.push(String(r['Customer ID'] || `Row ${idx + 1}`));
      }
    }
  });

  if (missingTargetCount > 0) {
    issues.push({
      id: 'rule-missing-target',
      severity: 'Error',
      rule: 'Target Variable Presence',
      column: 'Churn Flag',
      count: missingTargetCount,
      sampleRows: missingTargetSamples,
      message: `${missingTargetCount} rows have missing Churn Flag target. Model training requires complete labels.`,
      autoFixAvailable: true,
      autoFixDescription: 'Infer from Churn Status if available, otherwise exclude from training fold.',
    });
  }

  // 3. Target Inconsistency: Churn Flag vs Churn Status
  let targetMismatchCount = 0;
  const targetMismatchSamples: string[] = [];

  records.forEach((r, idx) => {
    const flag = Number(r['Churn Flag'] ?? r['churnFlag'] ?? 0);
    const status = String(r['Churn Status'] ?? r['churnStatus'] ?? '').toLowerCase();
    if (status && ((flag === 1 && status === 'active') || (flag === 0 && status === 'churned'))) {
      targetMismatchCount++;
      if (targetMismatchSamples.length < 5) {
        targetMismatchSamples.push(String(r['Customer ID'] || `Row ${idx + 1}`));
      }
    }
  });

  if (targetMismatchCount > 0) {
    issues.push({
      id: 'rule-target-mismatch',
      severity: 'Error',
      rule: 'Label & Status Consistency',
      column: 'Churn Flag',
      count: targetMismatchCount,
      sampleRows: targetMismatchSamples,
      message: `${targetMismatchCount} rows have contradicting Churn Flag and Churn Status values.`,
      autoFixAvailable: true,
      autoFixDescription: 'Harmonize Churn Flag with Churn Status (Status is canonical).',
    });
  }

  // 4. Value Validity: Negative charges, abnormal age, satisfaction out of range
  let invalidChargeCount = 0;
  let invalidAgeCount = 0;
  let invalidSatisfactionCount = 0;
  let invalidNpsCount = 0;

  records.forEach((r) => {
    const charge = parseFloat(String(r['Monthly Charge GBP'] ?? r['monthlyChargeGBP'] ?? 0));
    if (isNaN(charge) || charge < 0) invalidChargeCount++;

    const age = parseInt(String(r['Age'] ?? r['age'] ?? 40), 10);
    if (!isNaN(age) && (age < 16 || age > 115)) invalidAgeCount++;

    const csat = parseFloat(String(r['Satisfaction Score 1 10'] ?? r['satisfactionScore'] ?? 7));
    if (!isNaN(csat) && (csat < 1 || csat > 10)) invalidSatisfactionCount++;

    const nps = parseFloat(String(r['NPS Score'] ?? r['npsScore'] ?? 0));
    if (!isNaN(nps) && (nps < -100 || nps > 100)) invalidNpsCount++;
  });

  if (invalidChargeCount > 0) {
    issues.push({
      id: 'rule-negative-charge',
      severity: 'Error',
      rule: 'Non-Negative Monthly Charge',
      column: 'Monthly Charge GBP',
      count: invalidChargeCount,
      sampleRows: [],
      message: `${invalidChargeCount} rows contain negative or NaN monthly charges.`,
      autoFixAvailable: true,
      autoFixDescription: 'Take absolute value or replace with plan median.',
    });
  }

  if (invalidAgeCount > 0) {
    issues.push({
      id: 'rule-age-range',
      severity: 'Warning',
      rule: 'Realistic Age Range (16-115)',
      column: 'Age',
      count: invalidAgeCount,
      sampleRows: [],
      message: `${invalidAgeCount} customers have ages outside standard 16–115 bounds.`,
      autoFixAvailable: true,
      autoFixDescription: 'Impute with customer segment median age.',
    });
  }

  if (invalidSatisfactionCount > 0) {
    issues.push({
      id: 'rule-csat-range',
      severity: 'Warning',
      rule: 'CSAT Score Bound [1, 10]',
      column: 'Satisfaction Score 1 10',
      count: invalidSatisfactionCount,
      sampleRows: [],
      message: `${invalidSatisfactionCount} rows have satisfaction ratings outside 1–10.`,
      autoFixAvailable: true,
      autoFixDescription: 'Clamp values to the [1, 10] interval.',
    });
  }

  if (invalidNpsCount > 0) {
    issues.push({
      id: 'rule-nps-range',
      severity: 'Warning',
      rule: 'NPS Bound [-100, 100]',
      column: 'NPS Score',
      count: invalidNpsCount,
      sampleRows: [],
      message: `${invalidNpsCount} rows have NPS scores outside [-100, 100].`,
      autoFixAvailable: true,
      autoFixDescription: 'Clamp values to [-100, 100].',
    });
  }

  // 5. Categorical check: City typos or unmatched UK cities
  let cityTypoCount = 0;
  const cityTypoSamples: string[] = [];

  records.forEach((r) => {
    const city = String(r['City'] ?? r['city'] ?? '').trim();
    if (city && !KNOWN_UK_CITIES.includes(city)) {
      // Check for simple casing or minor typo
      const match = KNOWN_UK_CITIES.find(
        (c) => c.toLowerCase() === city.toLowerCase()
      );
      if (match) {
        cityTypoCount++;
        if (cityTypoSamples.length < 5) cityTypoSamples.push(`${city} -> ${match}`);
      }
    }
  });

  if (cityTypoCount > 0) {
    issues.push({
      id: 'rule-city-typo',
      severity: 'Info',
      rule: 'UK City Normalization',
      column: 'City',
      count: cityTypoCount,
      sampleRows: cityTypoSamples,
      message: `${cityTypoCount} city entries have casing or minor typographic variations.`,
      autoFixAvailable: true,
      autoFixDescription: 'Normalize to standard UK city name title case.',
    });
  }

  // 6. Currency/Formatting: Clean stringified currency symbols (£, $, ,)
  let currencyStringCount = 0;
  records.forEach((r) => {
    const val = String(r['Monthly Charge GBP'] ?? '');
    if (val.includes('£') || val.includes('$') || val.includes(',')) {
      currencyStringCount++;
    }
  });

  if (currencyStringCount > 0) {
    issues.push({
      id: 'rule-currency-format',
      severity: 'Info',
      rule: 'Numeric Cleanliness (Currency Symbols & Commas)',
      column: 'Monthly Charge GBP',
      count: currencyStringCount,
      sampleRows: [],
      message: `${currencyStringCount} numeric fields contain currency symbols (£) or thousands commas.`,
      autoFixAvailable: true,
      autoFixDescription: 'Strip non-numeric characters and cast to clean floating point.',
    });
  }

  // 7. Target Leakage Detection
  const leakageColumns: string[] = [];
  columns.forEach((col) => {
    const colLower = col.toLowerCase();
    if (LEAKAGE_COLUMN_CANDIDATES.some((cand) => cand.toLowerCase() === colLower)) {
      leakageColumns.push(col);
    }
  });

  if (leakageColumns.length > 0) {
    issues.push({
      id: 'rule-target-leakage',
      severity: 'Warning',
      rule: 'Target Leakage Sentinel',
      count: leakageColumns.length,
      sampleRows: leakageColumns,
      message: `Detected ${leakageColumns.length} potential target leakage column(s): ${leakageColumns.join(', ')}. These fields capture post-churn status or outcome revenues and MUST be sequestered from model training features.`,
      autoFixAvailable: true,
      autoFixDescription: 'Automatically exclude from ML feature set while retaining for descriptive analytics.',
    });
  }

  // Sub-scores calculation
  const totalChecks = totalRows * 6;
  const errorCount = issues.filter((i) => i.severity === 'Error').reduce((acc, i) => acc + i.count, 0);
  const warnCount = issues.filter((i) => i.severity === 'Warning').reduce((acc, i) => acc + i.count, 0);

  const validity = Math.max(0, Math.min(100, Math.round(100 - (errorCount * 12 + warnCount * 4) / Math.max(1, totalRows / 2))));
  const completeness = Math.max(0, Math.min(100, Math.round(100 - (missingTargetCount * 30) / Math.max(1, totalRows))));
  const uniqueness = duplicateIds.length === 0 ? 100 : Math.max(0, Math.round(100 - (duplicateIds.length / totalRows) * 100));
  const consistency = targetMismatchCount === 0 ? 100 : Math.max(0, Math.round(100 - (targetMismatchCount / totalRows) * 100));

  const overallScore = Math.round(validity * 0.35 + completeness * 0.25 + uniqueness * 0.2 + consistency * 0.2);

  return {
    overallScore,
    completeness,
    validity,
    uniqueness,
    consistency,
    totalRows,
    totalColumns: columns.length,
    issues,
    leakageColumns,
  };
}
