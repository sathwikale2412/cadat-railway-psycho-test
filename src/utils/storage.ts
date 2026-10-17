import { BatteryResult, TestId, TestResult } from '../types/cadat';

const STORAGE_KEY_TESTS = 'cadat_recent_tests_v1';
const STORAGE_KEY_BATTERIES = 'cadat_batteries_v1';

export function saveTestResult(result: TestResult): void {
  try {
    const existing = getStoredTestResults();
    existing.unshift(result);
    // Keep last 50 attempts
    const trimmed = existing.slice(0, 50);
    localStorage.setItem(STORAGE_KEY_TESTS, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed to save test result', err);
  }
}

export function getStoredTestResults(): TestResult[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_TESTS);
    if (!data) return [];
    return JSON.parse(data) as TestResult[];
  } catch {
    return [];
  }
}

export function getBestResultForTest(testId: TestId): TestResult | null {
  const results = getStoredTestResults().filter((r) => r.testId === testId);
  if (results.length === 0) return null;
  // Best score is highest T-score
  return results.reduce((best, curr) => (curr.tScore > best.tScore ? curr : best), results[0]);
}

export function saveBatteryResult(battery: BatteryResult): void {
  try {
    const existing = getStoredBatteries();
    existing.unshift(battery);
    localStorage.setItem(STORAGE_KEY_BATTERIES, JSON.stringify(existing.slice(0, 20)));
  } catch (err) {
    console.error('Failed to save battery result', err);
  }
}

export function getStoredBatteries(): BatteryResult[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_BATTERIES);
    if (!data) return [];
    return JSON.parse(data) as BatteryResult[];
  } catch {
    return [];
  }
}

export function clearAllHistory(): void {
  localStorage.removeItem(STORAGE_KEY_TESTS);
  localStorage.removeItem(STORAGE_KEY_BATTERIES);
}
