import { BatteryResult, TestId, TestResult } from '../types/cadat';
import { fetchHistory, pushBatteryResult, pushTestResult } from '../lib/cloud';

const STORAGE_KEY_TESTS = 'cadat_recent_tests_v1';
const STORAGE_KEY_BATTERIES = 'cadat_batteries_v1';

const MAX_TESTS = 50;
const MAX_BATTERIES = 20;

function readJson<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to persist locally', err);
  }
}

function testKey(r: TestResult): string {
  return `${r.testId}:${r.timestamp}`;
}

function mergeBy<T>(primary: T[], secondary: T[], keyOf: (item: T) => string, limit: number): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of [...primary, ...secondary]) {
    const key = keyOf(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

export function saveTestResult(result: TestResult, userId?: string | null): void {
  const merged = mergeBy([result], getStoredTestResults(), testKey, MAX_TESTS);
  writeJson(STORAGE_KEY_TESTS, merged);
  if (userId) void pushTestResult(userId, result);
}

export function getStoredTestResults(): TestResult[] {
  return readJson<TestResult>(STORAGE_KEY_TESTS);
}

export function getBestResultForTest(testId: TestId): TestResult | null {
  const results = getStoredTestResults().filter((r) => r.testId === testId);
  if (results.length === 0) return null;
  // Best score is highest T-score
  return results.reduce((best, curr) => (curr.tScore > best.tScore ? curr : best), results[0]);
}

export function saveBatteryResult(battery: BatteryResult, userId?: string | null): void {
  const merged = mergeBy([battery], getStoredBatteries(), (b) => b.id, MAX_BATTERIES);
  writeJson(STORAGE_KEY_BATTERIES, merged);
  if (userId) void pushBatteryResult(userId, battery);
}

export function getStoredBatteries(): BatteryResult[] {
  return readJson<BatteryResult>(STORAGE_KEY_BATTERIES);
}

/**
 * Pull this account's attempts from Postgres so a candidate who practised on a
 * phone sees the same history when they open the site on a laptop.
 */
export async function syncFromCloud(userId: string): Promise<void> {
  const { tests, batteries } = await fetchHistory(userId);

  if (tests.length) {
    writeJson(STORAGE_KEY_TESTS, mergeBy(tests, getStoredTestResults(), testKey, MAX_TESTS));
  }
  if (batteries.length) {
    writeJson(STORAGE_KEY_BATTERIES, mergeBy(batteries, getStoredBatteries(), (b) => b.id, MAX_BATTERIES));
  }
}

export function clearAllHistory(): void {
  localStorage.removeItem(STORAGE_KEY_TESTS);
  localStorage.removeItem(STORAGE_KEY_BATTERIES);
}
