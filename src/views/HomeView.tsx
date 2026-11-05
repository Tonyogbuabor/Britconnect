/**
 * BritConnect Data Hub & Ingestion View
 * Universal file upload (CSV, TSV, XLSX, JSON, XML), sample data loader,
 * and fuzzy schema auto-mapping table
 */
import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Database,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { parseFileToRecords, generateSchemaMappings, applySchemaMappings, ColumnMapping } from '../ingest/fileParser';

export const HomeView: React.FC = () => {
  const datasetName = useAppStore((s) => s.datasetName);
  const engineeredDataset = useAppStore((s) => s.engineeredDataset);
  const loadSampleDataset = useAppStore((s) => s.loadSampleDataset);
  const loadCustomRecords = useAppStore((s) => s.loadCustomRecords);
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const setFirstRunTourStep = useAppStore((s) => s.setFirstRunTourStep);

  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [pendingFile, setPendingFile] = useState<{
    records: Record<string, unknown>[];
    headers: string[];
    name: string;
    mappings: ColumnMapping[];
  } | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const parsed = await parseFileToRecords(file);
      const mappings = generateSchemaMappings(parsed.headers, parsed.records);
      setPendingFile({
        records: parsed.records,
        headers: parsed.headers,
        name: file.name,
        mappings,
      });
    } catch (err) {
      alert(`Error parsing file: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmMappingAndLoad = async () => {
    if (!pendingFile) return;
    setIsLoading(true);
    try {
      const mappedRecords = applySchemaMappings(pendingFile.records, pendingFile.mappings);
      await loadCustomRecords(mappedRecords, pendingFile.name);
      setPendingFile(null);
      setCurrentView('quality');
    } catch (err) {
      alert(`Error processing dataset: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = async () => {
    setIsLoading(true);
    await loadSampleDataset();
    setIsLoading(false);
    setCurrentView('dashboard');
  };

  const uploadedAt = useAppStore((s) => s.uploadedAt);
  const isRefreshing = useAppStore((s) => s.isRefreshing);
  const refreshFromServer = useAppStore((s) => s.refreshFromServer);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  const handleManualRefresh = async () => {
    const success = await refreshFromServer();
    setRefreshNotice(success ? 'Synced latest dataset from server!' : 'Already up to date.');
    setTimeout(() => setRefreshNotice(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero Welcome Card */}
      <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(11,61,46,0.04)] relative overflow-hidden">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF6EC] border border-[#E6DFC8] rounded-full text-xs font-semibold text-[#0B3D2E] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />
            <span>Enterprise Customer Churn Intelligence</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif-display font-bold text-[#0B3D2E] tracking-tight mb-2">
            BritConnect Intelligence Engine
          </h2>

          <p className="text-sm text-[#2B3A33] leading-relaxed mb-6">
            Production-grade churn prediction, automated cleaning, explainable ML models, and evidence-based retention workflows designed specifically for UK telecommunications providers.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleLoadSample}
              disabled={isLoading}
              className="px-4 py-2.5 bg-[#14633F] hover:bg-[#0B3D2E] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#F0E2B0]" />
              ) : (
                <Database className="w-4 h-4 text-[#F0E2B0]" />
              )}
              <span>Load Reference Telecoms Dataset (50 Customers)</span>
            </button>

            <button
              type="button"
              onClick={() => setFirstRunTourStep(1)}
              className="px-4 py-2.5 bg-[#FAF6EC] hover:bg-[#BFE3CF]/40 border border-[#E6DFC8] text-[#0B3D2E] text-xs font-semibold rounded-xl flex items-center gap-2 transition-all"
            >
              <span>5-Step Guided Tour</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Current Active Dataset Summary Pill & Server Sync Notice */}
        <div className="mt-6 pt-6 border-t border-[#E6DFC8]/60 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[#7A877F]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E9E6B] ring-2 ring-[#BFE3CF]" />
              <span className="font-semibold text-[#0B3D2E]">Shared Live Dataset:</span>
              <strong className="text-[#0B3D2E] font-medium bg-[#FAF6EC] px-2 py-0.5 rounded border border-[#E6DFC8]">
                {datasetName}
              </strong>
              <span className="font-mono text-[#0B3D2E]">({engineeredDataset.length} rows loaded)</span>
              {uploadedAt && (
                <span className="text-[11px] text-[#7A877F]">
                  • Updated {new Date(uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                  {new Date(uploadedAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="px-3 py-1.5 bg-[#FAF6EC] hover:bg-[#BFE3CF]/40 border border-[#E6DFC8] text-[#0B3D2E] rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#14633F] ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Checking Server...' : 'Refresh from Server'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                className="text-[#14633F] hover:underline font-semibold flex items-center gap-1 ml-2"
              >
                <span>View Dashboard</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Sync Information Banner */}
          <div className="bg-[#FAF6EC] border border-[#E6DFC8] rounded-xl px-3.5 py-2.5 flex items-center justify-between text-[11px] text-[#2B3A33]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B8860B]" />
              <span>
                <strong>Persistent URL Sharing Active:</strong> Any dataset you upload is retained on the server. Anyone opening this link will see your uploaded data until a fresh dataset is uploaded. The Refresh button fetches the latest version at any time.
              </span>
            </div>
            {refreshNotice && (
              <span className="font-semibold text-[#14633F] bg-[#BFE3CF] px-2 py-0.5 rounded ml-2 shrink-0 animate-fadeIn">
                {refreshNotice}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`bg-[#FFFDF7] border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
          dragActive ? 'border-[#14633F] bg-[#FAF6EC]' : 'border-[#E6DFC8] hover:border-[#B8860B]'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-[#FAF6EC] border border-[#E6DFC8] flex items-center justify-center text-[#14633F] mx-auto mb-4">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="font-serif-display font-bold text-lg text-[#0B3D2E] mb-1">
          Drag & Drop Customer Files Here
        </h3>

        <p className="text-xs text-[#7A877F] max-w-md mx-auto mb-5 leading-normal">
          Upload any billing extract or CRM export (.csv, .xlsx, .json, .xml). Column names will be automatically matched to the canonical BritConnect schema.
        </p>

        <label className="inline-flex items-center justify-center px-5 py-2.5 bg-[#FAF6EC] hover:bg-[#BFE3CF]/50 text-[#0B3D2E] border border-[#E6DFC8] rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
          <span>Choose File from Device</span>
          <input
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls,.xlsm,.ods,.json,.jsonl,.xml"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />
        </label>
      </div>

      {/* Schema Mapping Modal / Panel when file is uploaded */}
      {pendingFile && (
        <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl p-6 shadow-xl animate-fadeIn space-y-4">
          <div className="flex items-start justify-between pb-3 border-b border-[#E6DFC8]">
            <div>
              <h3 className="font-serif-display font-bold text-base text-[#0B3D2E]">
                Schema Auto-Mapping Review: {pendingFile.name}
              </h3>
              <p className="text-xs text-[#7A877F]">
                Fuzzy-matched uploaded headers to BritConnect canonical telecom fields. Verify or adjust mappings before proceeding.
              </p>
            </div>
            <button
              type="button"
              onClick={handleConfirmMappingAndLoad}
              className="px-4 py-2 bg-[#14633F] hover:bg-[#0B3D2E] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <span>Confirm & Process ({pendingFile.records.length} Rows)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-[350px] border border-[#E6DFC8] rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF6EC] text-[#0B3D2E] sticky top-0 border-b border-[#E6DFC8] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Uploaded Header</th>
                  <th className="py-2.5 px-3">Canonical Schema Field</th>
                  <th className="py-2.5 px-3">Match Confidence</th>
                  <th className="py-2.5 px-3">Sample Values</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DFC8]/60 text-[#2B3A33]">
                {pendingFile.mappings.map((m, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF6EC]/40">
                    <td className="py-2 px-3 font-mono font-medium text-[#0B3D2E]">{m.uploadedColumn}</td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={m.canonicalColumn}
                        onChange={(e) => {
                          const updated = [...pendingFile.mappings];
                          updated[idx].canonicalColumn = e.target.value;
                          setPendingFile({ ...pendingFile, mappings: updated });
                        }}
                        className="bg-white border border-[#E6DFC8] rounded px-2 py-1 text-xs w-full max-w-[220px]"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`font-mono font-semibold ${
                          m.confidence >= 0.9
                            ? 'text-[#2E9E6B]'
                            : m.confidence >= 0.7
                            ? 'text-[#B8860B]'
                            : 'text-[#7A877F]'
                        }`}
                      >
                        {m.confidence > 0 ? `${(m.confidence * 100).toFixed(0)}%` : 'Manual'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[#7A877F] font-mono text-[11px] truncate max-w-xs">
                      {m.sampleValues.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Feature Architecture Checklist Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-[#2E9E6B]" />
            <h4 className="font-semibold text-xs text-[#0B3D2E]">No Target Leakage</h4>
          </div>
          <p className="text-xs text-[#7A877F] leading-normal">
            Post-churn indicators (Churn Date, Churn Reason, Revenue At Risk) are strictly isolated from predictive features.
          </p>
        </div>

        <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-[#2E9E6B]" />
            <h4 className="font-semibold text-xs text-[#0B3D2E]">100% Deterministic Metrics</h4>
          </div>
          <p className="text-xs text-[#7A877F] leading-normal">
            Every KPI, confusion matrix entry, and ROI calculation is computed by deterministic math code, never fabricated.
          </p>
        </div>

        <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-[#2E9E6B]" />
            <h4 className="font-semibold text-xs text-[#0B3D2E]">Repeated Cross-Validation</h4>
          </div>
          <p className="text-xs text-[#7A877F] leading-normal">
            Stratified 5-fold CV with bootstrap 95% confidence intervals ensures complete statistical honesty for executive teams.
          </p>
        </div>
      </div>
    </div>
  );
};
