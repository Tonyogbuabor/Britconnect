/**
 * BritConnect Multi-Format File Ingestor & Schema Matcher
 * Supports CSV, TSV, TXT, XLSX, XLS, XLSM, ODS, JSON, JSONL, XML
 */
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ColumnMapping {
  uploadedColumn: string;
  canonicalColumn: string;
  confidence: number; // 0 to 1
  sampleValues: string[];
  isTarget?: boolean;
}

export const CANONICAL_COLUMNS: Array<{ key: string; required: boolean; aliases: string[] }> = [
  { key: 'Customer ID', required: true, aliases: ['customer_id', 'cust_id', 'account_id', 'id', 'customer', 'customer reference'] },
  { key: 'Churn Flag', required: true, aliases: ['churn_flag', 'churn', 'churned', 'attrition', 'left', 'status_binary', 'is_churn', 'cancelled'] },
  { key: 'Customer Segment', required: false, aliases: ['segment', 'customer_segment', 'account_type', 'client_type', 'tier'] },
  { key: 'Age', required: false, aliases: ['customer_age', 'age_years', 'age'] },
  { key: 'Age Band', required: false, aliases: ['age_group', 'age_bracket', 'age_band'] },
  { key: 'Gender', required: false, aliases: ['sex', 'customer_gender'] },
  { key: 'UK Nation', required: false, aliases: ['nation', 'country', 'region', 'uk_nation', 'territory'] },
  { key: 'City', required: false, aliases: ['town', 'location', 'city_name'] },
  { key: 'Acquisition Channel', required: false, aliases: ['channel', 'source', 'acquisition_source', 'how_joined'] },
  { key: 'Join Date', required: false, aliases: ['signup_date', 'joined_date', 'start_date', 'created_at'] },
  { key: 'Tenure Months', required: false, aliases: ['tenure', 'tenure_m', 'months_active', 'customer_tenure'] },
  { key: 'Service Type', required: false, aliases: ['product_type', 'service', 'line_of_business', 'service_category'] },
  { key: 'Plan Name', required: false, aliases: ['plan', 'tariff', 'package', 'package_name', 'tariff_name'] },
  { key: 'Contract Type', required: false, aliases: ['contract', 'term_type', 'agreement_type', 'contract_term'] },
  { key: 'Contract Start Date', required: false, aliases: ['contract_start', 'agreement_start'] },
  { key: 'Contract End Date', required: false, aliases: ['contract_end', 'agreement_end', 'expiry_date', 'renewal_date'] },
  { key: 'Auto Renew', required: false, aliases: ['auto_renewal', 'autorenew', 'rolling_renewal'] },
  { key: 'Monthly Charge GBP', required: false, aliases: ['monthly_charge', 'monthly_cost', 'monthly_fee', 'arpu', 'monthly charge (£)', 'monthly_bill'] },
  { key: 'Average Monthly Usage GB', required: false, aliases: ['monthly_usage', 'data_usage_gb', 'usage_gb', 'data_used'] },
  { key: 'Data Allowance GB', required: false, aliases: ['allowance_gb', 'data_cap', 'data_limit', 'package_allowance'] },
  { key: 'Overage Charges GBP', required: false, aliases: ['overage', 'overage_fee', 'extra_charges'] },
  { key: 'Discount Percent', required: false, aliases: ['discount', 'discount_rate', 'promotion_percent', 'promo_discount'] },
  { key: 'Payment Method', required: false, aliases: ['payment_type', 'billing_method', 'pay_method'] },
  { key: 'Direct Debit', required: false, aliases: ['is_direct_debit', 'dd_active', 'direct_debit_flag'] },
  { key: 'Late Payments 12M', required: false, aliases: ['late_payments', 'missed_payments', 'late_count'] },
  { key: 'Failed Payments 12M', required: false, aliases: ['failed_payments', 'bounced_payments', 'payment_failures'] },
  { key: 'Support Tickets 12M', required: false, aliases: ['tickets', 'support_calls', 'tickets_12m', 'service_requests'] },
  { key: 'Complaints 12M', required: false, aliases: ['complaints', 'escalations', 'disputes', 'complaints_count'] },
  { key: 'Average Resolution Hours', required: false, aliases: ['resolution_hours', 'avg_resolution_time', 'time_to_resolve_hours'] },
  { key: 'Network Outages 12M', required: false, aliases: ['outages', 'faults', 'service_interruptions', 'network_faults'] },
  { key: 'Satisfaction Score 1 10', required: false, aliases: ['csat', 'satisfaction', 'satisfaction_score', 'rating'] },
  { key: 'NPS Score', required: false, aliases: ['nps', 'net_promoter_score'] },
  { key: 'Competitor Offer Received', required: false, aliases: ['competitor_offer', 'poached_flag', 'retention_risk_offer'] },
  { key: 'Churn Status', required: false, aliases: ['status', 'customer_status', 'account_status'] },
  { key: 'Churn Date', required: false, aliases: ['cancellation_date', 'left_date', 'termination_date'] },
  { key: 'Churn Reason', required: false, aliases: ['cancellation_reason', 'reason_for_leaving', 'exit_reason'] },
  { key: 'Lifetime Revenue GBP', required: false, aliases: ['lifetime_revenue', 'total_revenue', 'clv', 'ltv'] },
  { key: 'Monthly Revenue At Risk GBP', required: false, aliases: ['revenue_at_risk', 'at_risk_revenue', 'monthly_at_risk'] },
];

function normalizeColName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[£$€()_.\-/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fuzzy matches an uploaded column header to BritConnect canonical schema
 */
export function matchColumnToCanonical(uploadedHeader: string): { canonicalKey: string; confidence: number } {
  const normUploaded = normalizeColName(uploadedHeader);

  // Exact canonical match
  for (const col of CANONICAL_COLUMNS) {
    if (normalizeColName(col.key) === normUploaded) {
      return { canonicalKey: col.key, confidence: 1.0 };
    }
  }

  // Exact alias match
  for (const col of CANONICAL_COLUMNS) {
    for (const alias of col.aliases) {
      if (normalizeColName(alias) === normUploaded) {
        return { canonicalKey: col.key, confidence: 0.95 };
      }
    }
  }

  // Substring match
  for (const col of CANONICAL_COLUMNS) {
    const normKey = normalizeColName(col.key);
    if (normUploaded.includes(normKey) || normKey.includes(normUploaded)) {
      return { canonicalKey: col.key, confidence: 0.85 };
    }
    for (const alias of col.aliases) {
      const normAlias = normalizeColName(alias);
      if (normUploaded.includes(normAlias) || normAlias.includes(normUploaded)) {
        return { canonicalKey: col.key, confidence: 0.8 };
      }
    }
  }

  return { canonicalKey: '', confidence: 0 };
}

/**
 * Generates initial mapping suggestions for an array of uploaded headers
 */
export function generateSchemaMappings(headers: string[], sampleRows: Record<string, unknown>[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const assignedCanonical = new Set<string>();

  for (const header of headers) {
    const { canonicalKey, confidence } = matchColumnToCanonical(header);
    const sampleVals = sampleRows
      .slice(0, 3)
      .map((r) => String(r[header] ?? ''))
      .filter(Boolean);

    if (canonicalKey && !assignedCanonical.has(canonicalKey) && confidence >= 0.75) {
      assignedCanonical.add(canonicalKey);
      mappings.push({
        uploadedColumn: header,
        canonicalColumn: canonicalKey,
        confidence,
        sampleValues: sampleVals,
        isTarget: canonicalKey === 'Churn Flag',
      });
    } else {
      mappings.push({
        uploadedColumn: header,
        canonicalColumn: '',
        confidence: 0,
        sampleValues: sampleVals,
        isTarget: false,
      });
    }
  }

  return mappings;
}

/**
 * Parses raw text or file buffer into tabular records
 */
export async function parseFileToRecords(file: File): Promise<{
  records: Record<string, unknown>[];
  headers: string[];
  sheetNames?: string[];
  format: string;
}> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
    const text = await file.text();
    return parseDelimitedText(text);
  }

  if (['xlsx', 'xls', 'xlsm', 'ods'].includes(ext)) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheetNames = workbook.SheetNames;
    const firstSheetName = sheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
    const headers = records.length > 0 ? Object.keys(records[0]) : [];

    return {
      records,
      headers,
      sheetNames,
      format: ext.toUpperCase(),
    };
  }

  if (ext === 'json' || ext === 'jsonl' || ext === 'ndjson') {
    const text = await file.text();
    return parseJsonData(text, ext);
  }

  if (ext === 'xml') {
    const text = await file.text();
    return parseXmlData(text);
  }

  // Fallback to text parsing
  const text = await file.text();
  return parseDelimitedText(text);
}

export function parseDelimitedText(text: string): {
  records: Record<string, unknown>[];
  headers: string[];
  format: string;
} {
  // Strip BOM if present
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.substring(1);
  }

  const parsed = Papa.parse<Record<string, unknown>>(cleanText, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
  });

  const records = parsed.data || [];
  const headers = parsed.meta.fields || (records.length > 0 ? Object.keys(records[0]) : []);

  return {
    records,
    headers,
    format: parsed.meta.delimiter === '\t' ? 'TSV' : 'CSV',
  };
}

function parseJsonData(text: string, ext: string): {
  records: Record<string, unknown>[];
  headers: string[];
  format: string;
} {
  try {
    if (ext === 'jsonl' || ext === 'ndjson' || text.trim().startsWith('{') && text.includes('\n{')) {
      const lines = text.trim().split('\n');
      const records = lines.map((l) => JSON.parse(l.trim())).filter(Boolean);
      const headers = records.length > 0 ? Object.keys(records[0]) : [];
      return { records, headers, format: 'JSONL' };
    }

    const parsed = JSON.parse(text);
    let arr: Record<string, unknown>[] = [];
    if (Array.isArray(parsed)) {
      arr = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.data)) arr = parsed.data;
      else if (Array.isArray(parsed.customers)) arr = parsed.customers;
      else if (Array.isArray(parsed.records)) arr = parsed.records;
      else arr = [parsed];
    }

    // Flatten simple nested objects
    const flattened = arr.map((item) => {
      const flat: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(item)) {
        if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
          for (const [subK, subV] of Object.entries(v as Record<string, unknown>)) {
            flat[`${k}_${subK}`] = subV;
          }
        } else {
          flat[k] = v;
        }
      }
      return flat;
    });

    const headers = flattened.length > 0 ? Object.keys(flattened[0]) : [];
    return { records: flattened, headers, format: 'JSON' };
  } catch (err) {
    throw new Error('Invalid JSON format: ' + (err as Error).message);
  }
}

function parseXmlData(text: string): {
  records: Record<string, unknown>[];
  headers: string[];
  format: string;
} {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');
  const rows = xmlDoc.querySelectorAll('customer, row, record');

  if (rows.length === 0) {
    throw new Error('No <customer>, <row>, or <record> elements detected in XML');
  }

  const records: Record<string, unknown>[] = [];
  const headerSet = new Set<string>();

  rows.forEach((node) => {
    const item: Record<string, unknown> = {};
    Array.from(node.children).forEach((child) => {
      const tag = child.tagName;
      headerSet.add(tag);
      item[tag] = child.textContent?.trim() ?? '';
    });
    records.push(item);
  });

  return {
    records,
    headers: Array.from(headerSet),
    format: 'XML',
  };
}

/**
 * Apply mapped schema to transform uploaded raw records into BritConnect canonical records
 */
export function applySchemaMappings(
  records: Record<string, unknown>[],
  mappings: ColumnMapping[]
): Record<string, unknown>[] {
  const mapDict = new Map<string, string>();
  mappings.forEach((m) => {
    if (m.canonicalColumn) {
      mapDict.set(m.uploadedColumn, m.canonicalColumn);
    }
  });

  return records.map((r) => {
    const canonicalRecord: Record<string, unknown> = {};
    for (const [origKey, val] of Object.entries(r)) {
      const canonicalKey = mapDict.get(origKey) || origKey;
      canonicalRecord[canonicalKey] = val;
    }
    return canonicalRecord;
  });
}
