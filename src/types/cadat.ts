export type TestId = 'test1' | 'test2' | 'test3' | 'test4' | 'test5';

export interface TestInfo {
  id: TestId;
  number: number;
  name: string;
  shortName: string;
  description: string;
  keysUsed: string[];
  instructionPhotoRef: string;
  rules: string[];
}

export interface TestResult {
  testId: TestId;
  testName: string;
  timestamp: number;
  durationSeconds: number;
  totalTrials: number;
  correctTrials: number;
  errorTrials: number;
  omissionTrials?: number;
  averageReactionTimeMs?: number; // absent for self-paced tests, which have no reaction time
  accuracyPercentage: number;
  rawScore: number;
  tScore: number; // RDSO T-Score
  isQualified: boolean; // T-Score >= 42
  metrics: Record<string, string | number>;
}

export interface BatteryResult {
  id: string;
  timestamp: number;
  candidateName?: string;
  testResults: Record<TestId, TestResult>;
  overallQualified: boolean;
  averageTScore: number;
}
