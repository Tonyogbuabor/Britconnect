/**
 * BritConnect Specialized ML Visuals
 * Semicircular Probability Gauge, Waterfall Driver Chart, Confusion Matrix Visualizer,
 * and ROC / PR Curve Plotter
 */
import React from 'react';
import { CustomerDriver, ConfusionMatrix, CurvePoint } from '../types';
import { CHART_COLORS } from './Charts';

// 1. Semicircular Probability Gauge
export const ProbabilityGauge: React.FC<{
  probability: number; // 0 to 1
  riskBand?: 'Low' | 'Medium' | 'High' | 'Critical';
  size?: number;
}> = ({ probability, riskBand, size = 180 }) => {
  const pct = Math.max(0, Math.min(100, Math.round(probability * 100)));
  const angle = (pct / 100) * 180; // 0 to 180 degrees

  const radius = 64;
  const strokeWidth = 14;
  const center = size / 2;

  // Arc path generator
  const getArc = (startAngle: number, endAngle: number) => {
    const sRad = ((startAngle - 180) * Math.PI) / 180;
    const eRad = ((endAngle - 180) * Math.PI) / 180;
    const x1 = center + radius * Math.cos(sRad);
    const y1 = center + radius * Math.sin(sRad);
    const x2 = center + radius * Math.cos(eRad);
    const y2 = center + radius * Math.sin(eRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const needleRad = ((angle - 180) * Math.PI) / 180;
  const needleLen = radius - 8;
  const nx = center + needleLen * Math.cos(needleRad);
  const ny = center + needleLen * Math.sin(needleRad);

  const getBandColor = () => {
    if (pct >= 75) return CHART_COLORS.danger;
    if (pct >= 50) return CHART_COLORS.goldRisk;
    if (pct >= 25) return CHART_COLORS.goldDark;
    return CHART_COLORS.greenPrimary;
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`} className="overflow-visible select-none">
        {/* Background track arc */}
        <path d={getArc(0, 180)} fill="none" stroke="#E6DFC8" strokeWidth={strokeWidth} strokeLinecap="round" />

        {/* 4 Color zones: Low (0-45deg), Med (45-90deg), High (90-135deg), Crit (135-180deg) */}
        <path d={getArc(0, 45)} fill="none" stroke={CHART_COLORS.greenPrimary} strokeWidth={strokeWidth} strokeOpacity="0.8" />
        <path d={getArc(45, 90)} fill="none" stroke={CHART_COLORS.goldDark} strokeWidth={strokeWidth} strokeOpacity="0.8" />
        <path d={getArc(90, 135)} fill="none" stroke={CHART_COLORS.goldRisk} strokeWidth={strokeWidth} strokeOpacity="0.8" />
        <path d={getArc(135, 180)} fill="none" stroke={CHART_COLORS.danger} strokeWidth={strokeWidth} strokeOpacity="0.8" />

        {/* Needle */}
        <line x1={center} y1={center} x2={nx} y2={ny} stroke="#0B3D2E" strokeWidth="3" strokeLinecap="round" />
        <circle cx={center} cy={center} r="6" fill="#0B3D2E" />

        {/* Value Display */}
        <text
          x={center}
          y={center + 24}
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill={getBandColor()}
          className="font-mono"
        >
          {pct}%
        </text>
      </svg>

      <div className="text-center mt-1">
        <span
          className="font-bold text-xs uppercase tracking-wider px-2 py-0.5 rounded-md"
          style={{
            backgroundColor: `${getBandColor()}20`,
            color: getBandColor(),
          }}
        >
          {riskBand || (pct >= 75 ? 'Critical' : pct >= 50 ? 'High' : pct >= 25 ? 'Medium' : 'Low')} Risk
        </span>
      </div>
    </div>
  );
};

// 2. Local Waterfall Driver Chart
export const WaterfallDriverChart: React.FC<{
  baseRate?: number;
  finalProb: number;
  drivers: CustomerDriver[];
}> = ({ baseRate = 0.22, finalProb, drivers }) => {
  let running = baseRate;

  return (
    <div className="w-full flex flex-col gap-2.5 text-xs py-2">
      {/* Base Rate */}
      <div className="flex items-center justify-between py-1.5 px-3 bg-[#FAF6EC] rounded-lg border border-[#E6DFC8]">
        <span className="font-semibold text-[#0B3D2E]">Portfolio Baseline Churn Propensity</span>
        <span className="font-mono font-bold text-[#0B3D2E]">{(baseRate * 100).toFixed(1)}%</span>
      </div>

      {/* Driver Deltas */}
      {drivers.map((d, idx) => {
        const isIncrease = d.direction === 'increases_risk';
        const delta = Math.abs(d.impactScore) * 100;
        running += d.impactScore;

        return (
          <div
            key={idx}
            className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E6DFC8]/60 hover:border-[#D4AF37] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isIncrease ? 'bg-[#D4AF37]' : 'bg-[#2E9E6B]'
                }`}
              />
              <span className="text-[#2B3A33] font-medium">{d.explanation || d.displayName}</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`font-mono font-semibold ${
                  isIncrease ? 'text-[#B8860B]' : 'text-[#2E9E6B]'
                }`}
              >
                {isIncrease ? '+' : '-'}{delta.toFixed(1)} pts
              </span>
            </div>
          </div>
        );
      })}

      {/* Final Probability Result */}
      <div className="flex items-center justify-between py-2 px-3 bg-[#0B3D2E] text-white rounded-lg shadow-sm mt-1">
        <span className="font-semibold">Final Assessed Churn Probability</span>
        <span className="font-mono font-bold text-base text-[#F0E2B0]">
          {(finalProb * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

// 3. Confusion Matrix Visualizer
export const ConfusionMatrixGrid: React.FC<{
  matrix: ConfusionMatrix;
}> = ({ matrix }) => {
  const { tp, fp, tn, fn, total, threshold } = matrix;
  const tpPct = ((tp / Math.max(1, total)) * 100).toFixed(1);
  const fpPct = ((fp / Math.max(1, total)) * 100).toFixed(1);
  const fnPct = ((fn / Math.max(1, total)) * 100).toFixed(1);
  const tnPct = ((tn / Math.max(1, total)) * 100).toFixed(1);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="grid grid-cols-3 gap-2 w-full max-w-sm text-center text-xs">
        {/* Top left empty */}
        <div className="p-2"></div>
        <div className="p-2 font-semibold text-[#0B3D2E] border-b border-[#E6DFC8]">Actual Churned (1)</div>
        <div className="p-2 font-semibold text-[#0B3D2E] border-b border-[#E6DFC8]">Actual Retained (0)</div>

        {/* Row 1: Predicted Churned */}
        <div className="p-2 font-semibold text-[#0B3D2E] flex items-center justify-center border-r border-[#E6DFC8]">
          Predicted Churned
        </div>
        <div className="p-3 bg-[#BFE3CF]/40 border border-[#2E9E6B] rounded-lg">
          <div className="text-[10px] uppercase font-bold text-[#14633F]">True Positive (TP)</div>
          <div className="text-lg font-mono font-bold text-[#0B3D2E] my-0.5">{tp}</div>
          <div className="text-[11px] font-mono text-[#7A877F]">{tpPct}%</div>
        </div>
        <div className="p-3 bg-[#FAF6EC] border border-[#E6DFC8] rounded-lg">
          <div className="text-[10px] uppercase font-bold text-[#B8860B]">False Positive (FP)</div>
          <div className="text-lg font-mono font-bold text-[#0B3D2E] my-0.5">{fp}</div>
          <div className="text-[11px] font-mono text-[#7A877F]">{fpPct}%</div>
        </div>

        {/* Row 2: Predicted Retained */}
        <div className="p-2 font-semibold text-[#0B3D2E] flex items-center justify-center border-r border-[#E6DFC8]">
          Predicted Retained
        </div>
        <div className="p-3 bg-[#FAF6EC] border border-[#E6DFC8] rounded-lg">
          <div className="text-[10px] uppercase font-bold text-[#A63D2F]">False Negative (FN)</div>
          <div className="text-lg font-mono font-bold text-[#0B3D2E] my-0.5">{fn}</div>
          <div className="text-[11px] font-mono text-[#7A877F]">{fnPct}%</div>
        </div>
        <div className="p-3 bg-[#BFE3CF]/40 border border-[#2E9E6B] rounded-lg">
          <div className="text-[10px] uppercase font-bold text-[#14633F]">True Negative (TN)</div>
          <div className="text-lg font-mono font-bold text-[#0B3D2E] my-0.5">{tn}</div>
          <div className="text-[11px] font-mono text-[#7A877F]">{tnPct}%</div>
        </div>
      </div>

      <div className="mt-3 text-xs text-[#7A877F]">
        Operating at decision threshold <span className="font-mono font-semibold text-[#0B3D2E]">{threshold.toFixed(2)}</span> · Total n = {total}
      </div>
    </div>
  );
};

// 4. ROC Curve & Precision-Recall Curve Plotter
export const CurvePlotter: React.FC<{
  curve: CurvePoint[];
  type: 'roc' | 'pr';
  aucValue: number;
  baseline?: number;
}> = ({ curve, type, aucValue, baseline }) => {
  if (!curve || curve.length === 0) {
    return <div className="text-xs text-[#7A877F] italic py-8">Curve data unavailable</div>;
  }

  const width = 360;
  const height = 200;
  const pad = 30;

  const getX = (val: number) => pad + val * (width - pad * 2);
  const getY = (val: number) => height - pad - val * (height - pad * 2);

  const pathD = curve
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(pt.x).toFixed(1)} ${getY(pt.y).toFixed(1)}`)
    .join(' ');

  return (
    <div className="w-full flex flex-col items-center">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[200px] overflow-visible select-none">
        {/* Baseline Axis (NO gridlines) */}
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#E6DFC8" strokeWidth="1.5" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#E6DFC8" strokeWidth="1.5" />

        {/* Diagonal random chance baseline for ROC */}
        {type === 'roc' && (
          <line
            x1={pad}
            y1={height - pad}
            x2={width - pad}
            y2={pad}
            stroke="#7A877F"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        )}

        {/* Horizontal base rate baseline for PR */}
        {type === 'pr' && baseline !== undefined && (
          <line
            x1={pad}
            y1={getY(baseline)}
            x2={width - pad}
            y2={getY(baseline)}
            stroke="#7A877F"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        )}

        {/* Model Curve (2.5px stroke as per specs) */}
        <path
          d={pathD}
          fill="none"
          stroke={type === 'roc' ? CHART_COLORS.greenPrimary : CHART_COLORS.goldRisk}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Direct Metric Label */}
        <text
          x={width - pad - 10}
          y={pad + 20}
          textAnchor="end"
          fontSize="13"
          fontWeight="700"
          fill="#0B3D2E"
          className="font-mono"
        >
          {type === 'roc' ? 'ROC-AUC' : 'PR-AUC'}: {aucValue.toFixed(3)}
        </text>

        {/* Axis Ticks */}
        <text x={pad} y={height - 12} fontSize="10" fill="#7A877F" textAnchor="middle">0.0</text>
        <text x={width - pad} y={height - 12} fontSize="10" fill="#7A877F" textAnchor="middle">1.0</text>
        <text x={pad - 12} y={height - pad + 3} fontSize="10" fill="#7A877F" textAnchor="end">0.0</text>
        <text x={pad - 12} y={pad + 4} fontSize="10" fill="#7A877F" textAnchor="end">1.0</text>

        {/* Axis Labels */}
        <text x={width / 2} y={height - 4} fontSize="10" fill="#7A877F" textAnchor="middle">
          {type === 'roc' ? 'False Positive Rate (1 - Specificity)' : 'Recall'}
        </text>
      </svg>
    </div>
  );
};
