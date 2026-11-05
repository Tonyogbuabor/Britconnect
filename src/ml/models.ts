/**
 * BritConnect Pure-TypeScript Machine Learning Models
 * Logistic Regression (L2), Decision Tree (Depth <= 4), Random Forest, and Gradient Boosted Trees
 */
import { sigmoid, fitStandardScaler, transformStandardScaler, ScalerParams, createRNG } from './mathUtils';

// Common ML Interface
export interface ClassifierModel {
  fit(X: number[][], y: number[]): void;
  predictProba(X: number[][]): number[];
  getFeatureImportance(featureNames: string[]): Array<{ name: string; importance: number }>;
}

/**
 * 1. L2-Regularised Logistic Regression with Balanced Class Weights
 */
export class LogisticRegressionModel implements ClassifierModel {
  public weights: number[] = [];
  public intercept = 0;
  public scaler: ScalerParams | null = null;
  public l2Lambda: number;
  public learningRate: number;
  public maxIter: number;
  public rng: () => number;

  constructor(l2Lambda = 0.1, learningRate = 0.05, maxIter = 400, seed = 42) {
    this.l2Lambda = l2Lambda;
    this.learningRate = learningRate;
    this.maxIter = maxIter;
    this.rng = createRNG(seed);
  }

  fit(X: number[][], y: number[]) {
    const nSamples = X.length;
    const nFeatures = X[0]?.length || 0;
    if (nSamples === 0 || nFeatures === 0) return;

    // 1. Fit & transform with standard scaler
    this.scaler = fitStandardScaler(X);
    const XNorm = transformStandardScaler(X, this.scaler);

    // 2. Class weights for balance
    const nPos = y.filter((val) => val === 1).length;
    const nNeg = nSamples - nPos;
    const wPos = nSamples / (2 * Math.max(1, nPos));
    const wNeg = nSamples / (2 * Math.max(1, nNeg));

    // 3. Initialize weights small random
    this.weights = new Array(nFeatures).fill(0).map(() => (this.rng() - 0.5) * 0.05);
    this.intercept = Math.log(Math.max(0.01, nPos / Math.max(1, nNeg))); // log-odds initialization

    // 4. Gradient descent
    for (let iter = 0; iter < this.maxIter; iter++) {
      const gradW = new Array(nFeatures).fill(0);
      let gradB = 0;

      for (let i = 0; i < nSamples; i++) {
        let linear = this.intercept;
        for (let j = 0; j < nFeatures; j++) {
          linear += this.weights[j] * XNorm[i][j];
        }
        const pred = sigmoid(linear);
        const error = pred - y[i];
        const sampleWeight = y[i] === 1 ? wPos : wNeg;

        for (let j = 0; j < nFeatures; j++) {
          gradW[j] += error * XNorm[i][j] * sampleWeight;
        }
        gradB += error * sampleWeight;
      }

      // Update with L2 regularization
      for (let j = 0; j < nFeatures; j++) {
        gradW[j] = gradW[j] / nSamples + this.l2Lambda * this.weights[j];
        this.weights[j] -= this.learningRate * gradW[j];
      }
      this.intercept -= this.learningRate * (gradB / nSamples);
    }
  }

  predictProba(X: number[][]): number[] {
    if (!this.scaler) return X.map(() => 0.5);
    const XNorm = transformStandardScaler(X, this.scaler);
    return XNorm.map((row) => {
      let linear = this.intercept;
      for (let j = 0; j < row.length; j++) {
        linear += (this.weights[j] || 0) * row[j];
      }
      return sigmoid(linear);
    });
  }

  getFeatureImportance(featureNames: string[]): Array<{ name: string; importance: number }> {
    return featureNames.map((name, idx) => ({
      name,
      importance: Number(Math.abs(this.weights[idx] || 0).toFixed(4)),
    })).sort((a, b) => b.importance - a.importance);
  }
}

/**
 * 2. Decision Tree Classifier (Max Depth <= 4 for Honest Interpretability)
 */
interface TreeNode {
  isLeaf: boolean;
  prediction?: number;
  featureIndex?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  gain?: number;
}

export class DecisionTreeModel implements ClassifierModel {
  public root: TreeNode | null = null;
  public maxDepth: number;
  public minSamplesSplit: number;
  public featureImportances: number[] = [];

  constructor(maxDepth = 3, minSamplesSplit = 4) {
    this.maxDepth = Math.min(4, maxDepth); // strict ceiling of 4 for explainability
    this.minSamplesSplit = minSamplesSplit;
  }

  fit(X: number[][], y: number[]) {
    const nFeatures = X[0]?.length || 0;
    this.featureImportances = new Array(nFeatures).fill(0);
    this.root = this.buildTree(X, y, 0);

    // Normalize feature importance sum to 1
    const totalGain = this.featureImportances.reduce((a, b) => a + b, 0);
    if (totalGain > 0) {
      this.featureImportances = this.featureImportances.map((g) => g / totalGain);
    }
  }

  private gini(y: number[]): number {
    if (y.length === 0) return 0;
    const p1 = y.filter((val) => val === 1).length / y.length;
    return 1 - (p1 * p1 + (1 - p1) * (1 - p1));
  }

  private buildTree(X: number[][], y: number[], depth: number): TreeNode {
    const nSamples = y.length;
    const nFeatures = X[0]?.length || 0;
    const nPos = y.filter((val) => val === 1).length;
    const meanProb = nSamples > 0 ? nPos / nSamples : 0;

    // Stopping conditions
    if (depth >= this.maxDepth || nSamples < this.minSamplesSplit || nPos === 0 || nPos === nSamples) {
      return { isLeaf: true, prediction: meanProb };
    }

    let bestGain = -1;
    let bestFeature = -1;
    let bestThreshold = 0;
    const currentGini = this.gini(y);

    for (let f = 0; f < nFeatures; f++) {
      const values = X.map((r) => r[f]);
      // Distinct candidate thresholds
      const sortedVals = Array.from(new Set(values)).sort((a, b) => a - b);
      for (let i = 0; i < sortedVals.length - 1; i++) {
        const threshold = (sortedVals[i] + sortedVals[i + 1]) / 2;
        const leftY: number[] = [];
        const rightY: number[] = [];

        for (let r = 0; r < nSamples; r++) {
          if (X[r][f] <= threshold) leftY.push(y[r]);
          else rightY.push(y[r]);
        }

        if (leftY.length === 0 || rightY.length === 0) continue;

        const pLeft = leftY.length / nSamples;
        const pRight = rightY.length / nSamples;
        const splitGini = pLeft * this.gini(leftY) + pRight * this.gini(rightY);
        const gain = currentGini - splitGini;

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = f;
          bestThreshold = threshold;
        }
      }
    }

    if (bestGain <= 0.0001 || bestFeature === -1) {
      return { isLeaf: true, prediction: meanProb };
    }

    this.featureImportances[bestFeature] += bestGain * nSamples;

    const leftX: number[][] = [];
    const leftY: number[] = [];
    const rightX: number[][] = [];
    const rightY: number[] = [];

    for (let i = 0; i < nSamples; i++) {
      if (X[i][bestFeature] <= bestThreshold) {
        leftX.push(X[i]);
        leftY.push(y[i]);
      } else {
        rightX.push(X[i]);
        rightY.push(y[i]);
      }
    }

    return {
      isLeaf: false,
      featureIndex: bestFeature,
      threshold: bestThreshold,
      gain: bestGain,
      left: this.buildTree(leftX, leftY, depth + 1),
      right: this.buildTree(rightX, rightY, depth + 1),
    };
  }

  private predictRow(node: TreeNode, row: number[]): number {
    if (node.isLeaf || node.prediction !== undefined) {
      return node.prediction ?? 0.5;
    }
    if (node.featureIndex !== undefined && node.threshold !== undefined) {
      if (row[node.featureIndex] <= node.threshold) {
        return node.left ? this.predictRow(node.left, row) : (node.prediction ?? 0.5);
      } else {
        return node.right ? this.predictRow(node.right, row) : (node.prediction ?? 0.5);
      }
    }
    return 0.5;
  }

  predictProba(X: number[][]): number[] {
    if (!this.root) return X.map(() => 0.5);
    return X.map((row) => this.predictRow(this.root!, row));
  }

  getFeatureImportance(featureNames: string[]): Array<{ name: string; importance: number }> {
    return featureNames.map((name, idx) => ({
      name,
      importance: Number((this.featureImportances[idx] || 0).toFixed(4)),
    })).sort((a, b) => b.importance - a.importance);
  }
}

/**
 * 3. Random Forest (Ensemble of Subsampled Trees)
 */
export class RandomForestModel implements ClassifierModel {
  public trees: DecisionTreeModel[] = [];
  public nTrees: number;
  public maxDepth: number;
  public rng: () => number;
  public featureImportances: number[] = [];

  constructor(nTrees = 16, maxDepth = 3, seed = 42) {
    this.nTrees = nTrees;
    this.maxDepth = maxDepth;
    this.rng = createRNG(seed);
  }

  fit(X: number[][], y: number[]) {
    const nSamples = X.length;
    const nFeatures = X[0]?.length || 0;
    this.trees = [];
    this.featureImportances = new Array(nFeatures).fill(0);

    for (let t = 0; t < this.nTrees; t++) {
      // Bootstrap sampling (bagging with replacement)
      const bootX: number[][] = [];
      const bootY: number[] = [];
      for (let i = 0; i < nSamples; i++) {
        const idx = Math.floor(this.rng() * nSamples);
        bootX.push(X[idx]);
        bootY.push(y[idx]);
      }

      const tree = new DecisionTreeModel(this.maxDepth, 3);
      tree.fit(bootX, bootY);
      this.trees.push(tree);

      tree.featureImportances.forEach((imp, f) => {
        this.featureImportances[f] += imp / this.nTrees;
      });
    }
  }

  predictProba(X: number[][]): number[] {
    if (this.trees.length === 0) return X.map(() => 0.5);
    const nSamples = X.length;
    const avgProbs = new Array(nSamples).fill(0);

    this.trees.forEach((tree) => {
      const preds = tree.predictProba(X);
      preds.forEach((p, i) => {
        avgProbs[i] += p / this.trees.length;
      });
    });

    return avgProbs;
  }

  getFeatureImportance(featureNames: string[]): Array<{ name: string; importance: number }> {
    return featureNames.map((name, idx) => ({
      name,
      importance: Number((this.featureImportances[idx] || 0).toFixed(4)),
    })).sort((a, b) => b.importance - a.importance);
  }
}

/**
 * 4. Gradient Boosted Trees (Sequential Residual Shrinkage)
 */
export class GradientBoostingModel implements ClassifierModel {
  public baseLogOdds = 0;
  public trees: DecisionTreeModel[] = [];
  public learningRate: number;
  public nEstimators: number;
  public maxDepth: number;

  constructor(nEstimators = 12, learningRate = 0.1, maxDepth = 2) {
    this.nEstimators = nEstimators;
    this.learningRate = learningRate;
    this.maxDepth = maxDepth;
  }

  fit(X: number[][], y: number[]) {
    const nSamples = X.length;
    const nPos = y.filter((val) => val === 1).length;
    const p0 = Math.max(0.01, Math.min(0.99, nPos / Math.max(1, nSamples)));
    this.baseLogOdds = Math.log(p0 / (1 - p0));

    let fValues = new Array(nSamples).fill(this.baseLogOdds);
    this.trees = [];

    for (let m = 0; m < this.nEstimators; m++) {
      // Calculate pseudo-residuals: r_i = y_i - p_i
      const residuals: number[] = [];
      for (let i = 0; i < nSamples; i++) {
        const prob = sigmoid(fValues[i]);
        residuals.push(y[i] - prob);
      }

      // Convert residual sign to pseudo-target for shallow tree fit
      const pseudoLabels = residuals.map((r) => (r > 0 ? 1 : 0));
      const tree = new DecisionTreeModel(this.maxDepth, 3);
      tree.fit(X, pseudoLabels);
      this.trees.push(tree);

      // Update fValues with shrinkage
      const treePreds = tree.predictProba(X);
      for (let i = 0; i < nSamples; i++) {
        fValues[i] += this.learningRate * (treePreds[i] - 0.5) * 2;
      }
    }
  }

  predictProba(X: number[][]): number[] {
    const nSamples = X.length;
    const fValues = new Array(nSamples).fill(this.baseLogOdds);

    this.trees.forEach((tree) => {
      const preds = tree.predictProba(X);
      for (let i = 0; i < nSamples; i++) {
        fValues[i] += this.learningRate * (preds[i] - 0.5) * 2;
      }
    });

    return fValues.map((f) => sigmoid(f));
  }

  getFeatureImportance(featureNames: string[]): Array<{ name: string; importance: number }> {
    const nFeatures = featureNames.length;
    const totalImps = new Array(nFeatures).fill(0);

    this.trees.forEach((tree) => {
      tree.featureImportances.forEach((imp, f) => {
        totalImps[f] += imp;
      });
    });

    const sum = totalImps.reduce((a, b) => a + b, 0);
    return featureNames.map((name, idx) => ({
      name,
      importance: Number((sum > 0 ? totalImps[idx] / sum : 0).toFixed(4)),
    })).sort((a, b) => b.importance - a.importance);
  }
}
