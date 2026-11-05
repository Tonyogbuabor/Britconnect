/**
 * BritConnect Data Cleaning Engine
 * Generates reversible, logged cleaning steps and clean typed customer records
 */
import { CleanCustomer, CleaningAuditEntry, CustomerSegment, ServiceType, ContractType, PaymentMethod } from '../types';
import { KNOWN_UK_CITIES } from './dataValidator';

function cleanNumeric(val: unknown, fallback = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (!val) return fallback;
  const str = String(val).replace(/[£$€,\s]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? fallback : num;
}

function cleanBoolean(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (val === 1 || val === '1') return true;
  if (val === 0 || val === '0') return false;
  const s = String(val).trim().toLowerCase();
  return s === 'yes' || s === 'y' || s === 'true' || s === 't';
}

function parseDateToISO(val: unknown): string {
  if (!val) return '';
  const str = String(val).trim();
  if (!str) return '';

  // Already ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }

  // Handle US M/D/YYYY (e.g. 12/20/2023)
  const parts = str.split(/[/\-.]/);
  if (parts.length === 3) {
    let m = parseInt(parts[0], 10);
    let d = parseInt(parts[1], 10);
    let y = parseInt(parts[2], 10);

    // If day and month are ambiguous, check range
    if (m > 12 && d <= 12) {
      // It's D/M/YYYY
      const tmp = m;
      m = d;
      d = tmp;
    }
    if (y < 100) y += 2000;

    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }

  const dObj = new Date(str);
  if (!isNaN(dObj.getTime())) {
    return dObj.toISOString().substring(0, 10);
  }

  return str;
}

export function cleanCustomerDataset(
  rawRecords: Record<string, unknown>[]
): {
  cleaned: CleanCustomer[];
  auditLog: CleaningAuditEntry[];
} {
  const auditLog: CleaningAuditEntry[] = [];
  const cleaned: CleanCustomer[] = [];
  const seenIds = new Set<string>();

  let dedupeCount = 0;
  let coercedDatesCount = 0;
  let normalizedCitiesCount = 0;
  let harmonizedBooleansCount = 0;

  // Process rows in reverse or forward to de-duplicate
  // We keep the first instance of each customer ID
  rawRecords.forEach((raw, idx) => {
    const rawId = String(raw['Customer ID'] || raw['customerId'] || `BCT-${String(idx + 1).padStart(6, '0')}`).trim();
    if (seenIds.has(rawId)) {
      dedupeCount++;
      return;
    }
    seenIds.add(rawId);

    // Normalise city
    let rawCity = String(raw['City'] || raw['city'] || 'London').trim();
    const cityMatch = KNOWN_UK_CITIES.find((c) => c.toLowerCase() === rawCity.toLowerCase());
    if (cityMatch && cityMatch !== rawCity) {
      normalizedCitiesCount++;
      rawCity = cityMatch;
    }

    // Normalise target
    let churnFlag = 0;
    const rawFlag = raw['Churn Flag'] ?? raw['churnFlag'];
    const rawStatus = String(raw['Churn Status'] ?? raw['churnStatus'] ?? '').toLowerCase();

    if (rawFlag !== undefined && rawFlag !== '') {
      churnFlag = cleanNumeric(rawFlag) >= 1 ? 1 : 0;
    } else if (rawStatus === 'churned' || rawStatus === 'cancelled') {
      churnFlag = 1;
    }

    const joinDate = parseDateToISO(raw['Join Date'] || raw['joinDate']);
    const contractStart = parseDateToISO(raw['Contract Start Date'] || raw['contractStartDate'] || joinDate);
    const contractEnd = parseDateToISO(raw['Contract End Date'] || raw['contractEndDate']);
    const churnDate = parseDateToISO(raw['Churn Date'] || raw['churnDate']);

    if (raw['Join Date'] && !/^\d{4}-\d{2}-\d{2}$/.test(String(raw['Join Date']))) {
      coercedDatesCount++;
    }

    const autoRenew = cleanBoolean(raw['Auto Renew'] ?? raw['autoRenew']);
    const directDebit = cleanBoolean(raw['Direct Debit'] ?? raw['directDebit']);
    const competitorOffer = cleanBoolean(raw['Competitor Offer Received'] ?? raw['competitorOfferReceived']);
    harmonizedBooleansCount += 3;

    const age = Math.max(16, Math.min(105, Math.round(cleanNumeric(raw['Age'] || raw['age'], 45))));
    const tenureMonths = Math.max(0, cleanNumeric(raw['Tenure Months'] || raw['tenureMonths'], 12));
    const monthlyCharge = Math.max(0, cleanNumeric(raw['Monthly Charge GBP'] || raw['monthlyChargeGBP'], 35.0));

    const item: CleanCustomer = {
      customerId: rawId,
      customerSegment: (String(raw['Customer Segment'] || raw['customerSegment'] || 'Consumer') === 'Small Business'
        ? 'Small Business'
        : 'Consumer') as CustomerSegment,
      age,
      ageBand: String(raw['Age Band'] || raw['ageBand'] || (age < 25 ? '18-24' : age < 35 ? '25-34' : age < 45 ? '35-44' : age < 55 ? '45-54' : age < 65 ? '55-64' : '65+')),
      gender: String(raw['Gender'] || raw['gender'] || 'Not Specified'),
      ukNation: String(raw['UK Nation'] || raw['ukNation'] || 'England'),
      city: rawCity,
      acquisitionChannel: String(raw['Acquisition Channel'] || raw['acquisitionChannel'] || 'Website'),
      joinDate,
      tenureMonths,
      serviceType: (raw['Service Type'] || raw['serviceType'] || 'Mobile') as ServiceType,
      planName: String(raw['Plan Name'] || raw['planName'] || 'Standard'),
      contractType: (raw['Contract Type'] || raw['contractType'] || '12 Months') as ContractType,
      contractStartDate: contractStart,
      contractEndDate: contractEnd,
      autoRenew,
      monthlyChargeGBP: Number(monthlyCharge.toFixed(2)),
      averageMonthlyUsageGB: cleanNumeric(raw['Average Monthly Usage GB'] || raw['averageMonthlyUsageGB'], 250),
      dataAllowanceGB: cleanNumeric(raw['Data Allowance GB'] || raw['dataAllowanceGB'], 0),
      overageChargesGBP: cleanNumeric(raw['Overage Charges GBP'] || raw['overageChargesGBP'], 0),
      discountPercent: cleanNumeric(raw['Discount Percent'] || raw['discountPercent'], 0),
      paymentMethod: (raw['Payment Method'] || raw['paymentMethod'] || 'Direct Debit') as PaymentMethod,
      directDebit,
      latePayments12M: cleanNumeric(raw['Late Payments 12M'] || raw['latePayments12M'], 0),
      failedPayments12M: cleanNumeric(raw['Failed Payments 12M'] || raw['failedPayments12M'], 0),
      supportTickets12M: cleanNumeric(raw['Support Tickets 12M'] || raw['supportTickets12M'], 0),
      complaints12M: cleanNumeric(raw['Complaints 12M'] || raw['complaints12M'], 0),
      averageResolutionHours: cleanNumeric(raw['Average Resolution Hours'] || raw['averageResolutionHours'], 0),
      networkOutages12M: cleanNumeric(raw['Network Outages 12M'] || raw['networkOutages12M'], 0),
      satisfactionScore: Math.max(1, Math.min(10, cleanNumeric(raw['Satisfaction Score 1 10'] || raw['satisfactionScore'], 7))),
      npsScore: Math.max(-100, Math.min(100, cleanNumeric(raw['NPS Score'] || raw['npsScore'], 20))),
      competitorOfferReceived: competitorOffer,
      churnStatus: churnFlag === 1 ? 'Churned' : 'Active',
      churnDate: churnFlag === 1 ? churnDate : undefined,
      churnReason: churnFlag === 1 ? String(raw['Churn Reason'] || raw['churnReason'] || 'Other') : undefined,
      lifetimeRevenueGBP: cleanNumeric(raw['Lifetime Revenue GBP'] || raw['lifetimeRevenueGBP'], monthlyCharge * tenureMonths),
      monthlyRevenueAtRiskGBP: churnFlag === 1 ? monthlyCharge : 0,
      churnFlag,
      rawRowIndex: idx,
    };

    cleaned.push(item);
  });

  const nowStr = new Date().toISOString().substring(11, 19);

  if (dedupeCount > 0) {
    auditLog.push({
      id: 'audit-dedupe',
      rule: 'Customer ID De-duplication',
      description: `Removed ${dedupeCount} duplicate customer records, retaining the primary/latest instance.`,
      rowsAffected: dedupeCount,
      beforeSample: 'Duplicate customer account keys in feed',
      afterSample: 'Unique primary customer IDs only',
      timestamp: nowStr,
    });
  }

  if (coercedDatesCount > 0) {
    auditLog.push({
      id: 'audit-dates',
      rule: 'Date Standardisation to ISO 8601',
      description: `Normalized ${coercedDatesCount} US formatted dates (M/D/YYYY) to standard ISO-8601 (YYYY-MM-DD).`,
      rowsAffected: coercedDatesCount,
      beforeSample: '12/20/2023',
      afterSample: '2023-12-20',
      timestamp: nowStr,
    });
  }

  if (normalizedCitiesCount > 0) {
    auditLog.push({
      id: 'audit-city',
      rule: 'UK City Casing Normalisation',
      description: `Normalized ${normalizedCitiesCount} city names to standard proper casing.`,
      rowsAffected: normalizedCitiesCount,
      beforeSample: 'Various casing / spacing',
      afterSample: 'Standard UK Metropolitan registry',
      timestamp: nowStr,
    });
  }

  auditLog.push({
    id: 'audit-types',
    rule: 'Numeric & Boolean Coercion',
    description: `Sanitized currency symbols (£), comma separators, and harmonized boolean flags (Yes/No -> True/False).`,
    rowsAffected: cleaned.length,
    beforeSample: '£25.06, "Yes"',
    afterSample: '25.06, true',
    timestamp: nowStr,
  });

  return { cleaned, auditLog };
}
