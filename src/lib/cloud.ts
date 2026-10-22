import { supabase } from './supabase';
import type { BatteryResult, TestResult } from '../types/cadat';

export interface LoginRecord {
  email: string;
  logged_at: string;
}

export async function pushTestResult(userId: string, result: TestResult): Promise<boolean> {
  if (!supabase) return true;
  const { error } = await supabase.from('cadat_results').insert({
    user_id: userId,
    test_id: result.testId,
    test_name: result.testName,
    t_score: result.tScore,
    is_qualified: result.isQualified,
    completed_at: new Date(result.timestamp).toISOString(),
    payload: result,
  });
  if (error) console.error('Failed to sync test result', error.message);
  return !error;
}

export async function pushBatteryResult(userId: string, battery: BatteryResult): Promise<boolean> {
  if (!supabase) return true;
  const { error } = await supabase.from('cadat_batteries').insert({
    user_id: userId,
    battery_id: battery.id,
    average_t_score: battery.averageTScore,
    overall_qualified: battery.overallQualified,
    completed_at: new Date(battery.timestamp).toISOString(),
    payload: battery,
  });
  if (error) console.error('Failed to sync battery result', error.message);
  return !error;
}

export async function fetchHistory(userId: string): Promise<{ tests: TestResult[]; batteries: BatteryResult[] }> {
  if (!supabase) return { tests: [], batteries: [] };

  const [testsRes, batteriesRes] = await Promise.all([
    supabase.from('cadat_results').select('payload').eq('user_id', userId).order('completed_at', { ascending: false }).limit(100),
    supabase.from('cadat_batteries').select('payload').eq('user_id', userId).order('completed_at', { ascending: false }).limit(40),
  ]);

  if (testsRes.error) console.error('Failed to load cloud history', testsRes.error.message);
  if (batteriesRes.error) console.error('Failed to load battery history', batteriesRes.error.message);

  return {
    tests: (testsRes.data ?? []).map((row) => row.payload as TestResult),
    batteries: (batteriesRes.data ?? []).map((row) => row.payload as BatteryResult),
  };
}

export async function fetchLoginHistory(userId: string): Promise<LoginRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('cadat_logins')
    .select('email, logged_at')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(25);

  if (error) {
    console.error('Failed to load login history', error.message);
    return [];
  }
  return data ?? [];
}

export async function recordLogin(userId: string, email: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('cadat_logins').insert({ user_id: userId, email });
  if (error) console.error('Failed to record login', error.message);
}
