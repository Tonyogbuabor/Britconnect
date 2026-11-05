/**
 * BritConnect Standardized <ChartCard> Component
 * Adheres strictly to Section 2 Chart Standards:
 * - NO gridlines (clean baseline only)
 * - Computed insight subtitle
 * - Footnote showing sample size n and date scope
 * - Action menu: Download SVG, Download Data (CSV), View as Table toggle, Expand modal
 */
import React, { useState, useRef } from 'react';
import { Download, Table as TableIcon, Maximize2, Minimize2, BarChart2, Info } from 'lucide-react';

export interface ChartCardProps {
  title: string;
  insightSubtitle: string;
  sampleSize: number;
  dateRangeText?: string;
  unitLabel?: string;
  children: React.ReactNode;
  tableData?: Array<Record<string, unknown>>;
  tableColumns?: Array<{ key: string; label: string; format?: (val: unknown) => string }>;
  aiInsightBullet?: string;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  insightSubtitle,
  sampleSize,
  dateRangeText = 'All cohorts',
  unitLabel,
  children,
  tableData,
  tableColumns,
  aiInsightBullet,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAiInsight, setShowAiInsight] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const downloadCSV = () => {
    if (!tableData || tableData.length === 0) return;
    const headers = tableColumns ? tableColumns.map((c) => c.label) : Object.keys(tableData[0]);
    const keys = tableColumns ? tableColumns.map((c) => c.key) : Object.keys(tableData[0]);

    const csvRows = [headers.join(',')];
    tableData.forEach((row) => {
      const vals = keys.map((k) => {
        const v = row[k];
        return typeof v === 'string' && v.includes(',') ? `"${v}"` : String(v ?? '');
      });
      csvRows.push(vals.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSVG = () => {
    if (!chartContainerRef.current) return;
    const svgElem = chartContainerRef.current.querySelector('svg');
    if (!svgElem) {
      alert('SVG export is only available in chart visualization mode.');
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svgElem);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}.svg`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div
        className={`bg-[#FFFDF7] border border-[#E6DFC8] rounded-[14px] p-5 shadow-[0_2px_12px_rgba(11,61,46,0.04)] flex flex-col justify-between transition-all duration-200 ${className}`}
      >
        {/* Header Zone */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="font-semibold text-base text-[#0B3D2E] leading-snug tracking-tight">
              {title}
            </h3>

            {/* Chart Toolbar Controls */}
            <div className="flex items-center gap-1 shrink-0 bg-[#FAF6EC] border border-[#E6DFC8] rounded-lg p-0.5">
              {aiInsightBullet && (
                <button
                  type="button"
                  onClick={() => setShowAiInsight(!showAiInsight)}
                  title="Computed Analyst Insight"
                  className={`p-1.5 rounded-md text-xs transition-colors flex items-center gap-1 ${
                    showAiInsight ? 'bg-[#14633F] text-white' : 'text-[#7A877F] hover:text-[#0B3D2E]'
                  }`}
                >
                  <Info className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline font-medium text-[11px]">Insight</span>
                </button>
              )}

              {tableData && tableData.length > 0 && (
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
                  title={viewMode === 'chart' ? 'View as Data Table' : 'View as Chart'}
                  className={`p-1.5 rounded-md text-xs transition-colors ${
                    viewMode === 'table' ? 'bg-[#14633F] text-white' : 'text-[#7A877F] hover:text-[#0B3D2E]'
                  }`}
                >
                  {viewMode === 'chart' ? <TableIcon className="w-3.5 h-3.5" /> : <BarChart2 className="w-3.5 h-3.5" />}
                </button>
              )}

              <button
                type="button"
                onClick={downloadSVG}
                title="Download SVG vector"
                className="p-1.5 rounded-md text-[#7A877F] hover:text-[#0B3D2E] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                title="Expand chart view"
                className="p-1.5 rounded-md text-[#7A877F] hover:text-[#0B3D2E] transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Computed Insight Subtitle */}
          <p className="text-xs font-medium text-[#B8860B] mb-3 leading-normal">
            {insightSubtitle}
          </p>

          {/* Conditional AI Insight Drawer */}
          {showAiInsight && aiInsightBullet && (
            <div className="mb-3 p-3 bg-[#FAF6EC] border border-[#F0E2B0] rounded-lg text-xs text-[#2B3A33] animate-fadeIn">
              <span className="font-semibold text-[#0B3D2E]">Analyst Finding: </span>
              {aiInsightBullet}
            </div>
          )}
        </div>

        {/* Chart / Table Viewport */}
        <div ref={chartContainerRef} className="my-2 min-h-[220px] flex items-center justify-center w-full overflow-hidden">
          {viewMode === 'chart' ? (
            children
          ) : tableData && tableData.length > 0 ? (
            <div className="w-full max-h-[260px] overflow-auto border border-[#E6DFC8] rounded-lg bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF6EC] text-[#0B3D2E] sticky top-0 border-b border-[#E6DFC8] font-semibold">
                  <tr>
                    {tableColumns
                      ? tableColumns.map((col) => (
                          <th key={col.key} className="py-2 px-3 whitespace-nowrap">
                            {col.label}
                          </th>
                        ))
                      : Object.keys(tableData[0]).map((k) => (
                          <th key={k} className="py-2 px-3 whitespace-nowrap">
                            {k}
                          </th>
                        ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DFC8]/60 text-[#2B3A33]">
                  {tableData.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-[#FAF6EC]/50 transition-colors">
                      {tableColumns
                        ? tableColumns.map((col) => (
                            <td key={col.key} className="py-1.5 px-3 whitespace-nowrap tabular-nums">
                              {col.format ? col.format(row[col.key]) : String(row[col.key] ?? '')}
                            </td>
                          ))
                        : Object.entries(row).map(([k, val]) => (
                            <td key={k} className="py-1.5 px-3 whitespace-nowrap tabular-nums">
                              {String(val ?? '')}
                            </td>
                          ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-xs text-[#7A877F]">No tabular data available</div>
          )}
        </div>

        {/* Footnote Zone */}
        <div className="pt-2 mt-2 border-t border-[#E6DFC8]/60 flex items-center justify-between text-[11px] text-[#7A877F]">
          <span>
            n = <strong className="font-mono text-[#0B3D2E]">{sampleSize.toLocaleString()}</strong> subscribers · {dateRangeText}
          </span>
          {unitLabel && <span className="font-medium text-[#7A877F]">{unitLabel}</span>}
        </div>
      </div>

      {/* Expanded Modal View */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-8 animate-fadeIn">
          <div className="bg-[#FFFDF7] border border-[#E6DFC8] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col p-6 shadow-2xl">
            <div className="flex items-start justify-between pb-4 border-b border-[#E6DFC8]">
              <div>
                <h2 className="text-lg font-serif-display font-bold text-[#0B3D2E]">{title}</h2>
                <p className="text-xs font-medium text-[#B8860B] mt-1">{insightSubtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadCSV}
                  className="px-3 py-1.5 text-xs font-medium text-[#0B3D2E] bg-[#FAF6EC] hover:bg-[#BFE3CF]/40 border border-[#E6DFC8] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 text-[#7A877F] hover:text-[#0B3D2E] rounded-lg bg-[#FAF6EC] border border-[#E6DFC8]"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 my-6 overflow-auto min-h-[350px] flex items-center justify-center">
              {children}
            </div>

            <div className="pt-3 border-t border-[#E6DFC8] flex items-center justify-between text-xs text-[#7A877F]">
              <span>Sample size: n = {sampleSize} | {dateRangeText}</span>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="px-4 py-1.5 bg-[#14633F] text-white text-xs font-medium rounded-lg hover:bg-[#0B3D2E] transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
