/**
 * BritConnect SVG Chart Primitives
 * Conforms 100% to Section 2 Chart Standards:
 * - ZERO gridlines
 * - Direct value labels on bars and lines
 * - Palette: green-700 (#14633F), gold-400 (#D4AF37), green-500 (#2E9E6B), gold-600 (#B8860B), danger (#A63D2F)
 * - Rounded bar corners, 2.5px line strokes, 12px axis labels
 * - Interactive hover tooltips
 */
import React, { useState } from 'react';

// Common Palette Tokens
export const CHART_COLORS = {
  greenDark: '#0B3D2E',
  greenPrimary: '#14633F',
  greenPositive: '#2E9E6B',
  greenSoft: '#BFE3CF',
  goldDark: '#B8860B',
  goldRisk: '#D4AF37',
  goldSoft: '#F0E2B0',
  inkDark: '#2B3A33',
  inkMuted: '#7A877F',
  border: '#E6DFC8',
  danger: '#A63D2F',
};

// 1. VERTICAL BAR CHART
export interface BarDatum {
  label: string;
  value: number; // primary value (e.g. churn rate %)
  secondaryVal?: number; // count n
  color?: string;
  tooltipExtra?: string;
}

export interface BarChartProps {
  data: BarDatum[];
  valuePrefix?: string;
  valueSuffix?: string;
  height?: number;
  onBarClick?: (item: BarDatum) => void;
  selectedLabel?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  valuePrefix = '',
  valueSuffix = '%',
  height = 200,
  onBarClick,
  selectedLabel,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="text-xs text-[#7A877F] italic py-8">No bar data to display</div>;
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = height - 50; // leave room for labels
  const barWidth = Math.min(48, Math.max(22, 380 / (data.length * 1.6)));
  const gap = (400 - data.length * barWidth) / (data.length + 1);

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      <svg viewBox="0 0 420 220" className="w-full h-auto max-h-[220px] overflow-visible">
        {/* Baseline Axis (NO gridlines) */}
        <line x1="20" y1="175" x2="400" y2="175" stroke="#E6DFC8" strokeWidth="1.5" />

        {data.map((item, idx) => {
          const barHeight = Math.max(4, (item.value / maxVal) * 125);
          const x = 30 + idx * (barWidth + gap);
          const y = 175 - barHeight;
          const isSelected = selectedLabel === item.label;
          const isHovered = hoveredIdx === idx;
          const barColor = item.color || (item.value > 25 ? CHART_COLORS.goldRisk : CHART_COLORS.greenPrimary);

          return (
            <g
              key={idx}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onBarClick?.(item)}
            >
              {/* Rounded Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                fill={barColor}
                opacity={isHovered ? 1 : isSelected ? 1 : hoveredIdx !== null ? 0.45 : 0.9}
                stroke={isSelected ? '#0B3D2E' : 'none'}
                strokeWidth={isSelected ? 2 : 0}
                className="transition-all duration-200"
              />

              {/* Direct Value Label on Top of Bar */}
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill={barColor}
                className="font-mono"
              >
                {valuePrefix}{item.value.toFixed(1)}{valueSuffix}
              </text>

              {/* Category Label below Baseline */}
              <text
                x={x + barWidth / 2}
                y={192}
                textAnchor="middle"
                fontSize="11"
                fill="#7A877F"
                className="font-sans"
              >
                {item.label}
              </text>

              {/* Sample Size n sub-label */}
              {item.secondaryVal !== undefined && (
                <text
                  x={x + barWidth / 2}
                  y={206}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill="#7A877F"
                  className="font-mono opacity-80"
                >
                  n={item.secondaryVal}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredIdx !== null && (
        <div className="absolute top-2 right-4 bg-[#0B3D2E] text-white px-3 py-1.5 rounded-lg text-xs shadow-lg pointer-events-none z-10 animate-fadeIn">
          <p className="font-semibold text-[#F0E2B0]">{data[hoveredIdx].label}</p>
          <p className="tabular-nums">
            Value: {valuePrefix}{data[hoveredIdx].value.toFixed(1)}{valueSuffix}
            {data[hoveredIdx].secondaryVal !== undefined && ` (n = ${data[hoveredIdx].secondaryVal})`}
          </p>
          {data[hoveredIdx].tooltipExtra && <p className="text-[11px] text-[#BFE3CF]">{data[hoveredIdx].tooltipExtra}</p>}
        </div>
      )}
    </div>
  );
};

// 2. HORIZONTAL BAR CHART
export interface HorizontalBarDatum {
  label: string;
  value: number;
  formattedValue: string;
  color?: string;
  subtext?: string;
}

export const HorizontalBarChart: React.FC<{
  data: HorizontalBarDatum[];
  onBarClick?: (item: HorizontalBarDatum) => void;
}> = ({ data, onBarClick }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="text-xs text-[#7A877F] italic py-8">No data to display</div>;
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full flex flex-col gap-2.5 py-1">
      {data.map((item, idx) => {
        const pctWidth = Math.max(3, (item.value / maxVal) * 100);
        const barColor = item.color || CHART_COLORS.greenPrimary;
        const isHovered = hoveredIdx === idx;

        return (
          <div
            key={idx}
            className="group cursor-pointer text-xs"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={() => onBarClick?.(item)}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-[#2B3A33] group-hover:text-[#0B3D2E] truncate max-w-[210px]">
                {item.label}
              </span>
              <span className="font-semibold font-mono text-[#0B3D2E] shrink-0 ml-2">
                {item.formattedValue}
              </span>
            </div>

            <div className="w-full bg-[#FAF6EC] h-4 rounded-md overflow-hidden relative border border-[#E6DFC8]/60">
              <div
                className="h-full rounded-md transition-all duration-300"
                style={{
                  width: `${pctWidth}%`,
                  backgroundColor: barColor,
                  opacity: isHovered ? 1 : 0.88,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 3. MULTI-SERIES OR SINGLE-SERIES LINE CHART (NO GRIDLINES)
export interface LinePoint {
  x: number | string;
  y: number;
  label?: string;
}

export interface LineSeries {
  name: string;
  points: LinePoint[];
  color: string;
  dashed?: boolean;
}

export const LineChart: React.FC<{
  series: LineSeries[];
  xLabel?: string;
  yLabel?: string;
  height?: number;
  valueSuffix?: string;
}> = ({ series, xLabel, yLabel, height = 210, valueSuffix = '' }) => {
  if (!series || series.length === 0 || series[0].points.length === 0) {
    return <div className="text-xs text-[#7A877F] italic py-8">No curve points to display</div>;
  }

  const allY = series.flatMap((s) => s.points.map((p) => p.y));
  const minY = Math.min(...allY, 0);
  const maxY = Math.max(...allY, 1);

  const nPoints = series[0].points.length;
  const svgWidth = 400;
  const svgHeight = height;
  const padLeft = 35;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 35;

  const getX = (idx: number) => padLeft + (idx / Math.max(1, nPoints - 1)) * (svgWidth - padLeft - padRight);
  const getY = (val: number) => svgHeight - padBottom - ((val - minY) / Math.max(0.001, maxY - minY)) * (svgHeight - padTop - padBottom);

  return (
    <div className="relative w-full flex flex-col items-center">
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none">
        {/* Subtle baseline axis only (NO gridlines) */}
        <line
          x1={padLeft}
          y1={svgHeight - padBottom}
          x2={svgWidth - padRight + 15}
          y2={svgHeight - padBottom}
          stroke="#E6DFC8"
          strokeWidth="1.5"
        />

        {/* Series Paths */}
        {series.map((s, sIdx) => {
          const pathD = s.points
            .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(p.y).toFixed(1)}`)
            .join(' ');

          const lastPt = s.points[s.points.length - 1];
          const lastX = getX(s.points.length - 1);
          const lastY = getY(lastPt.y);

          return (
            <g key={sIdx}>
              {/* 2.5px Line Stroke as specified */}
              <path
                d={pathD}
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                strokeDasharray={s.dashed ? '4 3' : 'none'}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Points */}
              {s.points.map((p, pIdx) => (
                <circle
                  key={pIdx}
                  cx={getX(pIdx)}
                  cy={getY(p.y)}
                  r={pIdx === s.points.length - 1 ? 4 : 3}
                  fill={s.color}
                  stroke="#FFFDF7"
                  strokeWidth="1.5"
                />
              ))}

              {/* Direct label on endpoint */}
              <text
                x={lastX + 6}
                y={lastY + 3}
                fontSize="10"
                fontWeight="600"
                fill={s.color}
                className="font-mono"
              >
                {lastPt.y.toFixed(1)}{valueSuffix}
              </text>
            </g>
          );
        })}

        {/* X-axis endpoint ticks and labels */}
        {series[0].points.map((p, pIdx) => {
          // Label first, mid, and last
          if (pIdx === 0 || pIdx === Math.floor(nPoints / 2) || pIdx === nPoints - 1) {
            return (
              <text
                key={pIdx}
                x={getX(pIdx)}
                y={svgHeight - 14}
                textAnchor="middle"
                fontSize="10"
                fill="#7A877F"
                className="font-sans"
              >
                {String(p.label ?? p.x)}
              </text>
            );
          }
          return null;
        })}
      </svg>

      {/* Legend if multiple series */}
      {series.length > 1 && (
        <div className="flex items-center gap-4 mt-2 text-xs text-[#2B3A33]">
          {series.map((s, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="font-medium text-[#7A877F]">{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 4. DONUT CHART (MAX 4-5 SLICES WITH DIRECT LABELS)
export interface DonutSlice {
  label: string;
  value: number;
  color: string;
  secondaryLabel?: string;
}

export const DonutChart: React.FC<{
  slices: DonutSlice[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
}> = ({ slices, centerLabel, centerValue, size = 180 }) => {
  const total = slices.reduce((acc, s) => acc + s.value, 0);
  if (total === 0) {
    return <div className="text-xs text-[#7A877F] italic py-8">No donut data</div>;
  }

  let cumulativeAngle = 0;
  const radius = 68;
  const innerRadius = 45;
  const center = size / 2;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible select-none">
        {slices.map((slice, idx) => {
          const sliceAngle = (slice.value / total) * 360;
          const startAngle = cumulativeAngle;
          const endAngle = cumulativeAngle + sliceAngle;
          cumulativeAngle += sliceAngle;

          const startRad = ((startAngle - 90) * Math.PI) / 180;
          const endRad = ((endAngle - 90) * Math.PI) / 180;

          const x1 = center + radius * Math.cos(startRad);
          const y1 = center + radius * Math.sin(startRad);
          const x2 = center + radius * Math.cos(endRad);
          const y2 = center + radius * Math.sin(endRad);

          const ix1 = center + innerRadius * Math.cos(endRad);
          const iy1 = center + innerRadius * Math.sin(endRad);
          const ix2 = center + innerRadius * Math.cos(startRad);
          const iy2 = center + innerRadius * Math.sin(startRad);

          const largeArc = sliceAngle > 180 ? 1 : 0;

          const pathD = `
            M ${x1} ${y1}
            A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
            L ${ix1} ${iy1}
            A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}
            Z
          `;

          return (
            <path
              key={idx}
              d={pathD}
              fill={slice.color}
              className="hover:opacity-85 transition-opacity cursor-pointer"
            />
          );
        })}

        {/* Center Labels */}
        {centerValue && (
          <text
            x={center}
            y={center - 2}
            textAnchor="middle"
            fontSize="16"
            fontWeight="700"
            fill="#0B3D2E"
            className="font-mono"
          >
            {centerValue}
          </text>
        )}
        {centerLabel && (
          <text
            x={center}
            y={center + 14}
            textAnchor="middle"
            fontSize="10"
            fill="#7A877F"
            className="font-sans"
          >
            {centerLabel}
          </text>
        )}
      </svg>

      {/* Direct Slice Labels and Share List */}
      <div className="flex flex-col gap-2 text-xs">
        {slices.map((slice, idx) => {
          const pct = ((slice.value / total) * 100).toFixed(1);
          return (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs shrink-0" style={{ backgroundColor: slice.color }} />
              <span className="text-[#2B3A33] font-medium">{slice.label}:</span>
              <span className="font-mono font-semibold text-[#0B3D2E]">{pct}%</span>
              {slice.secondaryLabel && <span className="text-[#7A877F] text-[11px]">({slice.secondaryLabel})</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 5. VALUE TIER X RISK BAND HEAT MATRIX
export const HeatMatrix: React.FC<{
  data: Array<{ valueTier: string; riskBand: string; count: number; totalRevenueMonthly: number }>;
}> = ({ data }) => {
  const valueTiers = ['Top 20%', 'Middle 40%', 'Bottom 40%'];
  const riskBands = ['Low', 'Medium', 'High', 'Critical'];

  const maxVal = Math.max(...data.map((d) => d.count), 1);

  const getCellColor = (count: number, risk: string) => {
    if (count === 0) return '#FAF6EC';
    const intensity = Math.min(1, count / maxVal);
    if (risk === 'Critical') return `rgba(166, 61, 47, ${0.2 + intensity * 0.75})`;
    if (risk === 'High') return `rgba(212, 175, 55, ${0.25 + intensity * 0.7})`;
    if (risk === 'Medium') return `rgba(240, 226, 176, ${0.3 + intensity * 0.6})`;
    return `rgba(46, 158, 107, ${0.2 + intensity * 0.65})`;
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[320px]">
        {/* Header row */}
        <div className="grid grid-cols-5 text-center text-xs font-semibold text-[#0B3D2E] pb-2 border-b border-[#E6DFC8]">
          <div className="text-left font-normal text-[#7A877F]">Value Tier</div>
          {riskBands.map((rb) => (
            <div key={rb}>{rb} Risk</div>
          ))}
        </div>

        {/* Data rows */}
        {valueTiers.map((tier) => (
          <div key={tier} className="grid grid-cols-5 items-center py-2 border-b border-[#E6DFC8]/60 text-xs">
            <div className="font-medium text-[#2B3A33]">{tier}</div>
            {riskBands.map((rb) => {
              const item = data.find((d) => d.valueTier === tier && d.riskBand === rb);
              const count = item ? item.count : 0;
              const rev = item ? item.totalRevenueMonthly : 0;
              const bg = getCellColor(count, rb);

              return (
                <div
                  key={rb}
                  className="mx-1 py-2 px-1 rounded-md text-center transition-all duration-200 border border-[#E6DFC8]/50"
                  style={{ backgroundColor: bg }}
                >
                  <div className="font-mono font-bold text-[#0B3D2E] text-sm">{count}</div>
                  {rev > 0 && <div className="text-[10px] text-[#2B3A33]/80 font-mono">£{rev.toFixed(0)}/mo</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
