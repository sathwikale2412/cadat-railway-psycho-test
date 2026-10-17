import { TestId, TestResult } from '../types/cadat';

// RDSO Psycho Test Norms (Estimated means and SD based on Indian Railways CADAT benchmarks)
interface TestNorm {
  mean: number;
  sd: number;
  lowerIsBetter: boolean;
}

const RDSO_NORMS: Record<TestId, TestNorm> = {
  // Test 1: Complex Reaction Time (Target ~ 380ms)
  test1: {
    mean: 380,
    sd: 60,
    lowerIsBetter: true,
  },
  // Test 2: Form Perception (Accuracy % / Speed score)
  test2: {
    mean: 82,
    sd: 12,
    lowerIsBetter: false,
  },
  // Test 3: Concentration 4-Dots (Net correct items scanned)
  test3: {
    mean: 65,
    sd: 15,
    lowerIsBetter: false,
  },
  // Test 4: Speed Perception (Absolute deviation in milliseconds, target < 120ms)
  test4: {
    mean: 140,
    sd: 45,
    lowerIsBetter: true,
  },
  // Test 5: Same Colour & Sequence (Net correct response score %)
  test5: {
    mean: 78,
    sd: 14,
    lowerIsBetter: false,
  },
};

export const RDSO_CUTOFF_T_SCORE = 42;

export function calculateTScore(testId: TestId, rawScore: number): number {
  const norm = RDSO_NORMS[testId];
  if (!norm) return 50;

  let tScore: number;
  if (norm.lowerIsBetter) {
    // For RT and Error, lower raw score gives higher T-score
    tScore = 50 + ((norm.mean - rawScore) / norm.sd) * 10;
  } else {
    // For accuracy and hits, higher is better
    tScore = 50 + ((rawScore - norm.mean) / norm.sd) * 10;
  }

  // Clamp within reasonable standard test bounds [20, 80]
  const clamped = Math.max(20, Math.min(80, Math.round(tScore * 10) / 10));
  return clamped;
}

export function isQualified(tScore: number): boolean {
  return tScore >= RDSO_CUTOFF_T_SCORE;
}

export function generateTestResult(
  testId: TestId,
  testName: string,
  durationSeconds: number,
  totalTrials: number,
  correctTrials: number,
  errorTrials: number,
  averageReactionTimeMs: number,
  rawScoreMetric: number,
  additionalMetrics: Record<string, string | number> = {},
  omissionTrials?: number
): TestResult {
  const accuracyPercentage = totalTrials > 0 ? Math.round((correctTrials / totalTrials) * 100) : 0;
  const tScore = calculateTScore(testId, rawScoreMetric);

  return {
    testId,
    testName,
    timestamp: Date.now(),
    durationSeconds,
    totalTrials,
    correctTrials,
    errorTrials,
    omissionTrials,
    averageReactionTimeMs: Math.round(averageReactionTimeMs),
    accuracyPercentage,
    rawScore: Math.round(rawScoreMetric * 10) / 10,
    tScore,
    isQualified: isQualified(tScore),
    metrics: additionalMetrics,
  };
}
