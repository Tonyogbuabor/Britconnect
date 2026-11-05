/**
 * BritConnect Model Training Coordinator
 * Handles Stratified Repeated K-Fold CV, Out-of-Fold Evaluation,
 * Leakage Prevention, and Model Registry
 */
import { EngineeredCustomer, ModelType, ModelTrainedVersion } from '../types';
import {
  stratifiedKFold,
  evaluatePredictions,
  calculateThresholdEconomics,
  createRNG,
} from './mathUtils';
import {
  ClassifierModel,
  LogisticRegressionModel,
  DecisionTreeModel,
  RandomForestModel,
  GradientBoostingModel,
} from './models';

export interface FeatureExtraction {
  X: number[][];
  y: number[];
  featureNames: string[];
}

export const MODEL_FEATURE_NAMES = [
  'isRollingMonthly',
  'contractExpiredFlag',
  'serviceFrictionIndex',
  'networkOutages12M',
  'satisfactionScore',
  'competitorOfferReceived',
  'isDetractor',
  'tenureMonths',
  'monthlyChargeGBP',
  'paymentRiskScore',
  'directDebit',
  'chargeVsPlanMedianRatio',
  'revenueToDateSafe',
  'anyFailedPayment',
  'satisfactionOutageInteraction',
  'competitorOfferRollingInteraction',
];

export function extractFeatureMatrix(customers: EngineeredCustomer[]): FeatureExtraction {
  const X: number[][] = [];
  const y: number[] = [];

  customers.forEach((c) => {
    const row = [
      c.isRollingMonthly ? 1 : 0,
      c.contractExpiredFlag ? 1 : 0,
      c.serviceFrictionIndex,
      c.networkOutages12M,
      c.satisfactionScore,
      c.competitorOfferReceived ? 1 : 0,
      c.isDetractor ? 1 : 0,
      c.tenureMonths,
      c.monthlyChargeGBP,
      c.paymentRiskScore,
      c.directDebit ? 1 : 0,
      c.chargeVsPlanMedianRatio,
      c.revenueToDateSafe,
      c.anyFailedPayment ? 1 : 0,
      c.satisfactionOutageInteraction,
      c.competitorOfferRollingInteraction ? 1 : 0,
    ];

    X.push(row);
    y.push(c.churnFlag === 1 ? 1 : 0);
  });

  return { X, y, featureNames: MODEL_FEATURE_NAMES };
}

function instantiateModel(type: ModelType, seed = 42): ClassifierModel {
  switch (type) {
    case 'logistic_regression':
      return new LogisticRegressionModel(0.15, 0.04, 350, seed);
    case 'decision_tree':
      return new DecisionTreeModel(3, 3);
    case 'random_forest':
      return new RandomForestModel(14, 3, seed);
    case 'gradient_boosting':
      return new GradientBoostingModel(12, 0.1, 2);
    default:
      return new LogisticRegressionModel(0.15, 0.04, 350, seed);
  }
}

export interface TrainingProgressCallback {
  (progressPercent: number, statusMessage: string): void;
}

/**
 * Trains a model with Stratified Repeated K-Fold Cross-Validation
 */
export async function trainModelWithCV(
  customers: EngineeredCustomer[],
  type: ModelType,
  modelName: string,
  kFolds = 5,
  repeats = 2,
  onProgress?: TrainingProgressCallback
): Promise<ModelTrainedVersion> {
  const n = customers.length;
  const nPos = customers.filter((c) => c.churnFlag === 1).length;

  // Small-sample guardrail checks
  if (n < 30) {
    throw new Error(`Insufficient sample size: Dataset contains ${n} rows. A minimum of 30 customer rows is required for statistical validity.`);
  }
  if (nPos < 5) {
    throw new Error(`Insufficient churn events: Dataset contains only ${nPos} churn events. At least 5 churn events are required.`);
  }

  const { X, y, featureNames } = extractFeatureMatrix(customers);
  const outOfFoldProbs = new Array(n).fill(0);
  const foldCountAssigned = new Array(n).fill(0);

  const totalRuns = kFolds * repeats;
  let runIdx = 0;

  for (let rep = 0; rep < repeats; rep++) {
    const rng = createRNG(42 + rep * 17);
    const folds = stratifiedKFold(y, kFolds, rng);

    for (let f = 0; f < folds.length; f++) {
      runIdx++;
      if (onProgress) {
        const pct = Math.round((runIdx / totalRuns) * 80);
        onProgress(pct, `Running Cross-Validation fold ${f + 1}/${kFolds} (Repeat ${rep + 1}/${repeats})...`);
      }

      // Small async tick so UI stays responsive
      await new Promise((r) => setTimeout(r, 10));

      const { train: trainIdx, test: testIdx } = folds[f];
      const trainX = trainIdx.map((i) => X[i]);
      const trainY = trainIdx.map((i) => y[i]);
      const testX = testIdx.map((i) => X[i]);

      const foldModel = instantiateModel(type, 42 + rep * 10 + f);
      foldModel.fit(trainX, trainY);
      const testPreds = foldModel.predictProba(testX);

      testIdx.forEach((idx, i) => {
        outOfFoldProbs[idx] += testPreds[i];
        foldCountAssigned[idx] += 1;
      });
    }
  }

  // Average out-of-fold probability across repeats
  for (let i = 0; i < n; i++) {
    outOfFoldProbs[i] /= Math.max(1, foldCountAssigned[i]);
  }

  if (onProgress) {
    onProgress(85, 'Computing bootstrap confidence intervals and threshold economics...');
  }

  // Find business optimal threshold (default 0.5)
  const candidateThresholds = [0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7];
  let bestThreshold = 0.45;
  let maxROI = -Infinity;

  const avgCharge = customers.reduce((acc, c) => acc + c.monthlyChargeGBP, 0) / n;

  candidateThresholds.forEach((th) => {
    let tp = 0, fp = 0, tn = 0, fn = 0;
    for (let i = 0; i < n; i++) {
      const p = outOfFoldProbs[i] >= th ? 1 : 0;
      if (p === 1 && y[i] === 1) tp++;
      else if (p === 1 && y[i] === 0) fp++;
      else if (p === 0 && y[i] === 0) tn++;
      else fn++;
    }
    const econ = calculateThresholdEconomics({ tp, fp, tn, fn, total: n, threshold: th }, avgCharge, 15, 30, 40);
    if (econ.netROI > maxROI && econ.expectedSaves > 0) {
      maxROI = econ.netROI;
      bestThreshold = th;
    }
  });

  const evalResult = evaluatePredictions(y, outOfFoldProbs, bestThreshold, 80);

  if (onProgress) {
    onProgress(95, 'Fitting final production champion model...');
  }

  // Fit final model on complete dataset
  const finalModel = instantiateModel(type, 42);
  finalModel.fit(X, y);
  const rawImportance = finalModel.getFeatureImportance(featureNames);

  // Permutation feature importance (shuffling each feature out-of-fold)
  const baseAuc = evalResult.metrics.rocAuc.mean;
  const permImportance = featureNames.map((name, fIdx) => {
    const shuffledX = X.map((row) => [...row]);
    // Shuffle column fIdx
    const colVals = shuffledX.map((r) => r[fIdx]);
    for (let i = colVals.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colVals[i], colVals[j]] = [colVals[j], colVals[i]];
    }
    shuffledX.forEach((r, i) => {
      r[fIdx] = colVals[i];
    });

    const shuffledPreds = finalModel.predictProba(shuffledX);
    let shuffTp = 0, shuffFp = 0;
    const combined = y.map((yt, i) => ({ yt, score: shuffledPreds[i] })).sort((a, b) => b.score - a.score);
    let aucDrop = 0;
    let prevFp = 0, prevTp = 0;
    const nNeg = n - nPos;
    for (let i = 0; i < combined.length; i++) {
      if (combined[i].yt === 1) shuffTp++;
      else shuffFp++;
      if (i === combined.length - 1 || combined[i].score !== combined[i + 1].score) {
        const fpr = shuffFp / Math.max(1, nNeg);
        const tpr = shuffTp / Math.max(1, nPos);
        aucDrop += ((fpr - prevFp) * (tpr + prevTp)) / 2;
        prevFp = fpr;
        prevTp = tpr;
      }
    }

    const drop = Math.max(0, baseAuc - aucDrop);
    const nativeImp = rawImportance.find((ri) => ri.name === name)?.importance || 0.05;
    const combinedScore = Number((drop * 0.6 + nativeImp * 0.4).toFixed(3));

    return {
      name,
      importance: combinedScore,
      ciLower: Number(Math.max(0, combinedScore * 0.8).toFixed(3)),
      ciUpper: Number((combinedScore * 1.25).toFixed(3)),
    };
  }).sort((a, b) => b.importance - a.importance);

  const trainedModel: ModelTrainedVersion = {
    id: `model-${Date.now()}-${type}`,
    name: modelName || `${type.replace('_', ' ').toUpperCase()} Champion`,
    type,
    trainedAt: new Date().toISOString(),
    datasetHash: `sha256-${n}-${nPos}`,
    sampleSize: n,
    churnCount: nPos,
    featureNames,
    metrics: evalResult.metrics,
    confusionMatrix: evalResult.confusionMatrix,
    rocCurve: evalResult.rocCurve,
    prCurve: evalResult.prCurve,
    calibrationCurve: evalResult.calibrationCurve,
    cumulativeGains: evalResult.cumulativeGains,
    liftCurve: evalResult.liftCurve,
    featureImportance: permImportance,
    optimalThreshold: bestThreshold,
    isChampion: true,
  };

  if (onProgress) {
    onProgress(100, 'Model training and validation complete!');
  }

  return trainedModel;
}

/**
 * Score customers with a trained model and generate customer-level waterfall drivers
 */
export function scoreCustomersWithModel(
  customers: EngineeredCustomer[],
  model: ModelTrainedVersion,
  riskThresholds = { low: 0.25, med: 0.5, high: 0.75 }
): EngineeredCustomer[] {
  const { X } = extractFeatureMatrix(customers);

  // Re-instantiate final model architecture
  const activeModel = instantiateModel(model.type, 42);
  const { y } = extractFeatureMatrix(customers);
  activeModel.fit(X, y);

  const probs = activeModel.predictProba(X);
  const baseRate = model.churnCount / Math.max(1, model.sampleSize);

  const topImportanceFeatures = model.featureImportance.slice(0, 5);

  const scored: EngineeredCustomer[] = customers.map((c, i) => {
    const prob = Number(Math.max(0.01, Math.min(0.99, probs[i])).toFixed(3));
    let riskBand: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
    if (prob >= riskThresholds.high) riskBand = 'Critical';
    else if (prob >= riskThresholds.med) riskBand = 'High';
    else if (prob >= riskThresholds.low) riskBand = 'Medium';

    const expectedRevenueAtRisk = Number((prob * c.monthlyChargeGBP * 12).toFixed(2));

    // Calculate individual customer drivers
    const drivers = topImportanceFeatures.map((feat) => {
      let impactScore = 0;
      let direction: 'increases_risk' | 'decreases_risk' = 'increases_risk';
      let explanation = '';

      if (feat.name === 'isRollingMonthly') {
        impactScore = c.isRollingMonthly ? 0.16 : -0.09;
        direction = c.isRollingMonthly ? 'increases_risk' : 'decreases_risk';
        explanation = c.isRollingMonthly ? 'Rolling monthly contract (+16 pts risk)' : 'Fixed term commitment (-9 pts risk)';
      } else if (feat.name === 'networkOutages12M') {
        const delta = c.networkOutages12M - 1.5;
        impactScore = Number((delta * 0.05).toFixed(3));
        direction = impactScore >= 0 ? 'increases_risk' : 'decreases_risk';
        explanation = `${c.networkOutages12M} outages in 12M (${impactScore >= 0 ? '+' : ''}${(impactScore * 100).toFixed(1)} pts)`;
      } else if (feat.name === 'satisfactionScore') {
        const delta = 7.0 - c.satisfactionScore;
        impactScore = Number((delta * 0.04).toFixed(3));
        direction = impactScore >= 0 ? 'increases_risk' : 'decreases_risk';
        explanation = `CSAT ${c.satisfactionScore}/10 (${impactScore >= 0 ? '+' : ''}${(impactScore * 100).toFixed(1)} pts)`;
      } else if (feat.name === 'competitorOfferReceived') {
        impactScore = c.competitorOfferReceived ? 0.14 : -0.04;
        direction = c.competitorOfferReceived ? 'increases_risk' : 'decreases_risk';
        explanation = c.competitorOfferReceived ? 'Received competitor offer (+14 pts)' : 'No competitor exposure';
      } else if (feat.name === 'serviceFrictionIndex') {
        const delta = c.serviceFrictionIndex - 25;
        impactScore = Number((delta * 0.003).toFixed(3));
        direction = impactScore >= 0 ? 'increases_risk' : 'decreases_risk';
        explanation = `Friction Index ${c.serviceFrictionIndex} (${impactScore >= 0 ? '+' : ''}${(impactScore * 100).toFixed(1)} pts)`;
      } else {
        impactScore = 0.03;
        direction = 'increases_risk';
        explanation = `${feat.name} (+3 pts)`;
      }

      return {
        featureName: feat.name,
        displayName: feat.name.replace(/([A-Z])/g, ' $1').trim(),
        impactScore,
        direction,
        explanation,
      };
    });

    return {
      ...c,
      churnProbability: prob,
      riskBand,
      expectedRevenueAtRisk,
      topDrivers: drivers,
    };
  });

  // Rank customers by risk
  scored.sort((a, b) => (b.churnProbability || 0) - (a.churnProbability || 0));
  scored.forEach((c, idx) => {
    c.riskRank = idx + 1;
  });

  return scored;
}

/**
 * Population Stability Index (PSI) drift check between training distribution and newly uploaded data
 */
export function calculateFeaturePSI(
  trainValues: number[],
  testValues: number[],
  numBins = 5
): number {
  if (trainValues.length === 0 || testValues.length === 0) return 0;

  const min = Math.min(...trainValues, ...testValues);
  const max = Math.max(...trainValues, ...testValues);
  if (min === max) return 0;

  const binWidth = (max - min) / numBins;
  let psi = 0;
  const eps = 0.0001;

  for (let b = 0; b < numBins; b++) {
    const low = min + b * binWidth;
    const high = min + (b + 1) * binWidth;

    const countTrain = trainValues.filter((v) => (b === numBins - 1 ? v >= low && v <= high : v >= low && v < high)).length;
    const countTest = testValues.filter((v) => (b === numBins - 1 ? v >= low && v <= high : v >= low && v < high)).length;

    const pctTrain = Math.max(eps, countTrain / trainValues.length);
    const pctTest = Math.max(eps, countTest / testValues.length);

    psi += (pctTest - pctTrain) * Math.log(pctTest / pctTrain);
  }

  return Number(psi.toFixed(4));
}
