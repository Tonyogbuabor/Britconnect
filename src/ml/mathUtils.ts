/**
 * BritConnect ML Mathematical & Evaluation Utilities
 * Deterministic PRNG, Stratified K-Fold CV, Bootstrap 95% CIs, and Classification Metrics
 */
import { ConfidenceInterval, CurvePoint, ConfusionMatrix, ModelMetrics } from '../types';

// Seeded pseudo-random number generator (Mulberry32)
export function createRNG(seed = 42) {
  let s = Math.floor(seed);
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sigmoid(z: number): number {
  if (z < -40) return 0;
  if (z > 40) return 1;
  return 1 / (1 + Math.exp(-z));
}

export interface ScalerParams {
  means: number[];
  stds: number[];
}

export function fitStandardScaler(X: number[][]): ScalerParams {
  const nFeatures = X[0]?.length || 0;
  const nSamples = X.length;
  const means = new Array(nFeatures).fill(0);
  const stds = new Array(nFeatures).fill(0);

  if (nSamples === 0 || nFeatures === 0) return { means, stds };

  for (let j = 0; j < nFeatures; j++) {
    let sum = 0;
    for (let i = 0; i < nSamples; i++) {
      sum += X[i][j];
    }
    means[j] = sum / nSamples;

    let varSum = 0;
    for (let i = 0; i < nSamples; i++) {
      const diff = X[i][j] - means[j];
      varSum += diff * diff;
    }
    stds[j] = Math.sqrt(varSum / Math.max(1, nSamples - 1)) || 1.0;
  }

  return { means, stds };
}

export function transformStandardScaler(X: number[][], scaler: ScalerParams): number[][] {
  return X.map((row) =>
    row.map((val, j) => {
      const std = scaler.stds[j] || 1.0;
      return (val - scaler.means[j]) / std;
    })
  );
}

/**
 * Creates stratified K-fold split indices
 */
export function stratifiedKFold(y: number[], k = 5, rng = createRNG(42)): Array<{ train: number[]; test: number[] }> {
  const class0Indices: number[] = [];
  const class1Indices: number[] = [];

  y.forEach((label, idx) => {
    if (label === 1) class1Indices.push(idx);
    else class0Indices.push(idx);
  });

  // Shuffle both
  const shuffle = (arr: number[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };
  shuffle(class0Indices);
  shuffle(class1Indices);

  const folds: Array<{ train: number[]; test: number[] }> = [];

  for (let fold = 0; fold < k; fold++) {
    const testIndices: number[] = [];
    const trainIndices: number[] = [];

    // Class 0 distribution
    class0Indices.forEach((idx, i) => {
      if (i % k === fold) testIndices.push(idx);
      else trainIndices.push(idx);
    });

    // Class 1 distribution
    class1Indices.forEach((idx, i) => {
      if (i % k === fold) testIndices.push(idx);
      else trainIndices.push(idx);
    });

    folds.push({ train: trainIndices, test: testIndices });
  }

  return folds;
}

/**
 * Computes ROC-AUC via trapezoidal integration of ROC points
 */
export function computeRocAuc(yTrue: number[], yScore: number[]): { auc: number; curve: CurvePoint[] } {
  if (yTrue.length === 0) return { auc: 0.5, curve: [] };

  const combined = yTrue.map((yt, i) => ({ yt, score: yScore[i] }));
  combined.sort((a, b) => b.score - a.score);

  const nPos = yTrue.filter((y) => y === 1).length;
  const nNeg = yTrue.length - nPos;

  if (nPos === 0 || nNeg === 0) {
    return { auc: 0.5, curve: [{ x: 0, y: 0 }, { x: 1, y: 1 }] };
  }

  let tp = 0;
  let fp = 0;
  let prevFp = 0;
  let prevTp = 0;
  let auc = 0;
  const curve: CurvePoint[] = [{ x: 0, y: 0, threshold: 1 }];

  for (let i = 0; i < combined.length; i++) {
    if (combined[i].yt === 1) tp++;
    else fp++;

    // When threshold changes or at end
    if (i === combined.length - 1 || combined[i].score !== combined[i + 1].score) {
      const fpr = fp / nNeg;
      const tpr = tp / nPos;
      // Trapezoid area
      auc += ((fpr - prevFp) * (tpr + prevTp)) / 2;
      curve.push({ x: Number(fpr.toFixed(3)), y: Number(tpr.toFixed(3)), threshold: Number(combined[i].score.toFixed(3)) });
      prevFp = fpr;
      prevTp = tpr;
    }
  }

  return { auc: Math.max(0, Math.min(1, auc)), curve };
}

/**
 * Computes PR-AUC (Precision-Recall Area Under Curve)
 */
export function computePrAuc(yTrue: number[], yScore: number[]): { prAuc: number; curve: CurvePoint[] } {
  const combined = yTrue.map((yt, i) => ({ yt, score: yScore[i] }));
  combined.sort((a, b) => b.score - a.score);

  const nPos = yTrue.filter((y) => y === 1).length;
  if (nPos === 0) return { prAuc: 0, curve: [] };

  let tp = 0;
  let totalSelected = 0;
  let prevRecall = 0;
  let prAuc = 0;
  const curve: CurvePoint[] = [{ x: 0, y: 1, threshold: 1 }];

  for (let i = 0; i < combined.length; i++) {
    totalSelected++;
    if (combined[i].yt === 1) tp++;

    if (i === combined.length - 1 || combined[i].score !== combined[i + 1].score) {
      const precision = tp / totalSelected;
      const recall = tp / nPos;
      prAuc += precision * (recall - prevRecall);
      curve.push({ x: Number(recall.toFixed(3)), y: Number(precision.toFixed(3)), threshold: Number(combined[i].score.toFixed(3)) });
      prevRecall = recall;
    }
  }

  return { prAuc: Math.max(0, Math.min(1, prAuc)), curve };
}

/**
 * Calibration curve (binned probabilities vs observed actual rate)
 */
export function computeCalibrationCurve(yTrue: number[], yScore: number[], bins = 5): CurvePoint[] {
  const points: CurvePoint[] = [];
  const binSize = 1 / bins;

  for (let b = 0; b < bins; b++) {
    const low = b * binSize;
    const high = (b + 1) * binSize;

    const inBin = yTrue
      .map((yt, i) => ({ yt, score: yScore[i] }))
      .filter((item) => item.score >= low && (b === bins - 1 ? item.score <= high : item.score < high));

    if (inBin.length > 0) {
      const meanPred = inBin.reduce((acc, v) => acc + v.score, 0) / inBin.length;
      const actualRate = inBin.reduce((acc, v) => acc + v.yt, 0) / inBin.length;
      points.push({
        x: Number(meanPred.toFixed(3)),
        y: Number(actualRate.toFixed(3)),
        threshold: inBin.length, // use threshold slot for sample count n
      });
    } else {
      points.push({
        x: Number(((low + high) / 2).toFixed(3)),
        y: Number(((low + high) / 2).toFixed(3)),
        threshold: 0,
      });
    }
  }

  return points;
}

/**
 * Cumulative Gains & Lift Curves
 */
export function computeGainsAndLift(yTrue: number[], yScore: number[]): {
  gains: CurvePoint[];
  lift: CurvePoint[];
  liftTop10: number;
  liftTop20: number;
} {
  const total = yTrue.length;
  const totalPos = yTrue.filter((y) => y === 1).length;
  const baseRate = totalPos / Math.max(1, total);

  if (total === 0 || totalPos === 0) {
    return { gains: [], lift: [], liftTop10: 1, liftTop20: 1 };
  }

  const combined = yTrue.map((yt, i) => ({ yt, score: yScore[i] }));
  combined.sort((a, b) => b.score - a.score);

  const deciles = 10;
  const gains: CurvePoint[] = [{ x: 0, y: 0 }];
  const lift: CurvePoint[] = [{ x: 0, y: 1 }];

  let liftTop10 = 1;
  let liftTop20 = 1;

  for (let d = 1; d <= deciles; d++) {
    const cutoff = Math.floor((d / deciles) * total);
    const slice = combined.slice(0, cutoff);
    const posInSlice = slice.filter((s) => s.yt === 1).length;
    const cumulativeGain = posInSlice / totalPos;
    const segmentRate = posInSlice / Math.max(1, cutoff);
    const segmentLift = baseRate > 0 ? segmentRate / baseRate : 1;

    const xPct = d * 10;
    gains.push({ x: xPct, y: Number((cumulativeGain * 100).toFixed(1)) });
    lift.push({ x: xPct, y: Number(segmentLift.toFixed(2)) });

    if (d === 1) liftTop10 = Number(segmentLift.toFixed(2));
    if (d === 2) liftTop20 = Number(segmentLift.toFixed(2));
  }

  return { gains, lift, liftTop10, liftTop20 };
}

/**
 * Evaluates full classification metrics given out-of-fold true labels and probabilities
 */
export function evaluatePredictions(
  yTrue: number[],
  yProb: number[],
  threshold = 0.5,
  bootstrapIterations = 100
): {
  metrics: ModelMetrics;
  confusionMatrix: ConfusionMatrix;
  rocCurve: CurvePoint[];
  prCurve: CurvePoint[];
  calibrationCurve: CurvePoint[];
  cumulativeGains: CurvePoint[];
  liftCurve: CurvePoint[];
} {
  const n = yTrue.length;
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  for (let i = 0; i < n; i++) {
    const pred = yProb[i] >= threshold ? 1 : 0;
    const actual = yTrue[i];
    if (pred === 1 && actual === 1) tp++;
    else if (pred === 1 && actual === 0) fp++;
    else if (pred === 0 && actual === 0) tn++;
    else fn++;
  }

  const confusionMatrix: ConfusionMatrix = { tp, fp, tn, fn, total: n, threshold };

  const { auc, curve: rocCurve } = computeRocAuc(yTrue, yProb);
  const { prAuc, curve: prCurve } = computePrAuc(yTrue, yProb);
  const calibrationCurve = computeCalibrationCurve(yTrue, yProb);
  const { gains: cumulativeGains, lift: liftCurve, liftTop10, liftTop20 } = computeGainsAndLift(yTrue, yProb);

  // Kolmogorov-Smirnov (KS) statistic: max distance between TPR and FPR
  let ksStatistic = 0;
  rocCurve.forEach((pt) => {
    const diff = Math.abs(pt.y - pt.x);
    if (diff > ksStatistic) ksStatistic = diff;
  });

  // Metric calculation functions
  const calcAccuracy = (tP: number, tN: number, fP: number, fN: number) => (tP + tN) / Math.max(1, tP + tN + fP + fN);
  const calcPrecision = (tP: number, fP: number) => tP / Math.max(1, tP + fP);
  const calcRecall = (tP: number, fN: number) => tP / Math.max(1, tP + fN);
  const calcSpecificity = (tN: number, fP: number) => tN / Math.max(1, tN + fP);
  const calcF1 = (p: number, r: number) => (p + r > 0 ? (2 * p * r) / (p + r) : 0);
  const calcF2 = (p: number, r: number) => (4 * p + r > 0 ? (5 * p * r) / (4 * p + r) : 0);
  const calcMCC = (tP: number, tN: number, fP: number, fN: number) => {
    const numerator = tP * tN - fP * fN;
    const denom = Math.sqrt((tP + fP) * (tP + fN) * (tN + fP) * (tN + fN));
    return denom === 0 ? 0 : numerator / denom;
  };
  const calcBrier = (yt: number[], yp: number[]) => {
    let sum = 0;
    for (let i = 0; i < yt.length; i++) sum += (yp[i] - yt[i]) ** 2;
    return sum / Math.max(1, yt.length);
  };
  const calcLogLoss = (yt: number[], yp: number[]) => {
    let sum = 0;
    const eps = 1e-15;
    for (let i = 0; i < yt.length; i++) {
      const p = Math.max(eps, Math.min(1 - eps, yp[i]));
      sum += -(yt[i] * Math.log(p) + (1 - yt[i]) * Math.log(1 - p));
    }
    return sum / Math.max(1, yt.length);
  };

  // Bootstrap 95% Confidence Intervals
  const rng = createRNG(42);
  const bootstrapValues: Record<string, number[]> = {
    rocAuc: [],
    prAuc: [],
    accuracy: [],
    balancedAccuracy: [],
    precision: [],
    recall: [],
    f1: [],
    f2: [],
    brier: [],
    logLoss: [],
    mcc: [],
    specificity: [],
  };

  for (let b = 0; b < bootstrapIterations; b++) {
    const sampleYt: number[] = [];
    const sampleYp: number[] = [];

    for (let i = 0; i < n; i++) {
      const randIdx = Math.floor(rng() * n);
      sampleYt.push(yTrue[randIdx]);
      sampleYp.push(yProb[randIdx]);
    }

    let bTp = 0, bFp = 0, bTn = 0, bFn = 0;
    for (let i = 0; i < n; i++) {
      const pred = sampleYp[i] >= threshold ? 1 : 0;
      if (pred === 1 && sampleYt[i] === 1) bTp++;
      else if (pred === 1 && sampleYt[i] === 0) bFp++;
      else if (pred === 0 && sampleYt[i] === 0) bTn++;
      else bFn++;
    }

    const bPrec = calcPrecision(bTp, bFp);
    const bRec = calcRecall(bTp, bFn);
    const bSpec = calcSpecificity(bTn, bFp);

    bootstrapValues.rocAuc.push(computeRocAuc(sampleYt, sampleYp).auc);
    bootstrapValues.prAuc.push(computePrAuc(sampleYt, sampleYp).prAuc);
    bootstrapValues.accuracy.push(calcAccuracy(bTp, bTn, bFp, bFn));
    bootstrapValues.balancedAccuracy.push((bRec + bSpec) / 2);
    bootstrapValues.precision.push(bPrec);
    bootstrapValues.recall.push(bRec);
    bootstrapValues.f1.push(calcF1(bPrec, bRec));
    bootstrapValues.f2.push(calcF2(bPrec, bRec));
    bootstrapValues.brier.push(calcBrier(sampleYt, sampleYp));
    bootstrapValues.logLoss.push(calcLogLoss(sampleYt, sampleYp));
    bootstrapValues.mcc.push(calcMCC(bTp, bTn, bFp, bFn));
    bootstrapValues.specificity.push(bSpec);
  }

  const getCI = (arr: number[]): ConfidenceInterval => {
    const sorted = [...arr].sort((a, b) => a - b);
    const lower = sorted[Math.floor(sorted.length * 0.025)] ?? sorted[0];
    const upper = sorted[Math.floor(sorted.length * 0.975)] ?? sorted[sorted.length - 1];
    const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    return {
      lower: Number(lower.toFixed(3)),
      mean: Number(mean.toFixed(3)),
      upper: Number(upper.toFixed(3)),
    };
  };

  const metrics: ModelMetrics = {
    rocAuc: getCI(bootstrapValues.rocAuc),
    prAuc: getCI(bootstrapValues.prAuc),
    accuracy: getCI(bootstrapValues.accuracy),
    balancedAccuracy: getCI(bootstrapValues.balancedAccuracy),
    precision: getCI(bootstrapValues.precision),
    recall: getCI(bootstrapValues.recall),
    f1: getCI(bootstrapValues.f1),
    f2: getCI(bootstrapValues.f2),
    brierScore: getCI(bootstrapValues.brier),
    logLoss: getCI(bootstrapValues.logLoss),
    matthewsCorr: getCI(bootstrapValues.mcc),
    specificity: getCI(bootstrapValues.specificity),
    liftTop10,
    liftTop20,
    ksStatistic: Number(ksStatistic.toFixed(3)),
  };

  return {
    metrics,
    confusionMatrix,
    rocCurve,
    prCurve,
    calibrationCurve,
    cumulativeGains,
    liftCurve,
  };
}

/**
 * Expected Business Value & Threshold Optimization
 */
export function calculateThresholdEconomics(
  confusionMatrix: ConfusionMatrix,
  avgMonthlyCharge: number,
  costPerOffer: number,
  offerSuccessRate: number,
  avgMarginPercent: number,
  horizonMonths = 12
) {
  const { tp, fp, total } = confusionMatrix;
  const contacted = tp + fp;
  const campaignCost = contacted * costPerOffer;

  // Expected saves among contacted true churners
  const expectedSaves = tp * (offerSuccessRate / 100);
  const revenueSavedAnnual = expectedSaves * avgMonthlyCharge * horizonMonths;
  const grossProfitSaved = revenueSavedAnnual * (avgMarginPercent / 100);
  const netROI = campaignCost > 0 ? ((grossProfitSaved - campaignCost) / campaignCost) * 100 : 0;

  return {
    contacted,
    contactRatePercent: total > 0 ? (contacted / total) * 100 : 0,
    campaignCost,
    expectedSaves: Number(expectedSaves.toFixed(1)),
    revenueSavedAnnual: Number(revenueSavedAnnual.toFixed(2)),
    grossProfitSaved: Number(grossProfitSaved.toFixed(2)),
    netROI: Number(netROI.toFixed(1)),
  };
}
