import React, { useEffect } from 'react';
import { BatteryResult, TestId } from '../types/cadat';
import { RDSO_CUTOFF_T_SCORE } from '../utils/scoring';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, XCircle, RotateCcw, Home, Download, AlertTriangle } from 'lucide-react';

interface BatteryReportModalProps {
  battery: BatteryResult;
  onRetake: () => void;
  onHome: () => void;
}

const TEST_NAMES: Record<TestId, string> = {
  test1: '1. Complex Reaction Time',
  test2: '2. Form Perception',
  test3: '3. Concentration (4-Dots)',
  test4: '4. Speed Perception (Tunnel)',
  test5: '5. Same Colour & Sequence',
};

export const BatteryReportModal: React.FC<BatteryReportModalProps> = ({
  battery,
  onRetake,
  onHome,
}) => {
  const isOverallQualified = battery.overallQualified;

  useEffect(() => {
    if (isOverallQualified) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch {
        // Fallback
      }
    }
  }, [isOverallQualified]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl animate-fade-in text-slate-100 my-auto">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center mb-2">
            {isOverallQualified ? (
              <div className="w-16 h-16 rounded-full bg-emerald-950/60 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-900/40">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-amber-950/60 border-2 border-amber-500 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-900/40">
                <AlertTriangle className="w-10 h-10" />
              </div>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">RDSO CADAT Score Card</h2>
          <span className="text-xs text-slate-400">Indian Railways Driver Aptitude Test Battery</span>

          <div className="mt-3">
            <span
              className={`inline-block px-4 py-1.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider ${
                isOverallQualified
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'bg-red-500/20 text-red-300 border border-red-500/50'
              }`}
            >
              {isOverallQualified
                ? '🏆 OVERALL QUALIFIED (All Subtests ≥ 42)'
                : '⚠️ NOT QUALIFIED (Subtest Below 42 Benchmark)'}
            </span>
          </div>
        </div>

        {/* Average Score Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 mb-4 flex items-center justify-between text-center">
          <div className="flex-1 border-r border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Average T-Score</span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-400 mt-0.5">
              {battery.averageTScore}
            </div>
          </div>
          <div className="flex-1">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Statutory Cutoff</span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-300 mt-0.5">
              42.0
            </div>
          </div>
        </div>

        {/* 5 Battery Results Table */}
        <div className="space-y-2 mb-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block px-1">
            Battery Sub-test Breakdown
          </span>

          {(['test1', 'test2', 'test3', 'test4', 'test5'] as TestId[]).map((tId) => {
            const res = battery.testResults[tId];
            if (!res) return null;
            const subQual = res.tScore >= RDSO_CUTOFF_T_SCORE;

            return (
              <div
                key={tId}
                className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between transition-all ${
                  subQual
                    ? 'bg-slate-950/70 border-slate-800 text-slate-200'
                    : 'bg-red-950/20 border-red-500/40 text-red-200'
                }`}
              >
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">{TEST_NAMES[tId]}</h4>
                  <span className="text-[11px] text-slate-400">
                    Accuracy: {res.accuracyPercentage}% | RT: {res.averageReactionTimeMs}ms
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block leading-none">T-SCORE</span>
                    <span
                      className={`text-base sm:text-lg font-black font-mono ${
                        subQual ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {res.tScore}
                    </span>
                  </div>

                  {subQual ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onRetake}
            className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Full Mock</span>
          </button>

          <button
            onClick={onHome}
            className="flex-1 py-3 px-4 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
