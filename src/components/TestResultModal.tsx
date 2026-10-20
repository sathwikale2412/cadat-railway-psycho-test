import React, { useEffect } from 'react';
import { TestResult } from '../types/cadat';
import { RDSO_CUTOFF_T_SCORE } from '../utils/scoring';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, RotateCcw, Home, ArrowRight, Zap, Target, Gauge } from 'lucide-react';

interface TestResultModalProps {
  result: TestResult;
  onRetry: () => void;
  onHome: () => void;
  onNextTest?: () => void;
  isBatteryMode?: boolean;
}

export const TestResultModal: React.FC<TestResultModalProps> = ({
  result,
  onRetry,
  onHome,
  onNextTest,
  isBatteryMode = false,
}) => {
  const isQualified = result.tScore >= RDSO_CUTOFF_T_SCORE;

  useEffect(() => {
    if (isQualified) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [isQualified]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl animate-fade-in text-slate-100 my-auto">
        {/* Header Badge */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center mb-2">
            {isQualified ? (
              <div className="w-16 h-16 rounded-full bg-emerald-950/60 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-900/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-red-950/60 border-2 border-red-500 text-red-400 flex items-center justify-center shadow-lg shadow-red-900/30">
                <XCircle className="w-10 h-10" />
              </div>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white">{result.testName}</h3>
          <span className="text-xs text-slate-400">Indian Railways CADAT Assessment</span>

          <div className="mt-3">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                isQualified
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-red-500/20 text-red-300 border border-red-500/40'
              }`}
            >
              {isQualified ? 'QUALIFIED (RDSO Benchmark Met)' : 'NEEDS PRACTICE (Below 42 Cutoff)'}
            </span>
          </div>
        </div>

        {/* T-Score Highlight Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4 grid grid-cols-2 gap-3 text-center">
          <div className="border-r border-slate-800 pr-2">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">RDSO T-Score</span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Gauge className={`w-5 h-5 ${isQualified ? 'text-emerald-400' : 'text-red-400'}`} />
              <span className={`text-3xl font-black font-mono ${isQualified ? 'text-emerald-400' : 'text-red-400'}`}>
                {result.tScore}
              </span>
            </div>
            <span className="text-[10px] text-slate-500">Cutoff: 42.0</span>
          </div>

          <div className="pl-2">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Accuracy</span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Zap className="w-5 h-5 text-cyan-400" />
              <span className="text-3xl font-black font-mono text-cyan-400">
                {result.accuracyPercentage}%
              </span>
            </div>
            {typeof result.averageReactionTimeMs === 'number' && (
              <span className="text-[10px] text-slate-500">{result.averageReactionTimeMs} ms avg</span>
            )}
          </div>
        </div>

        {/* Key Performance Metrics List */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 mb-5 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-300 py-1 border-b border-slate-800/60">
            <span>Duration:</span>
            <span className="font-mono text-white">{result.durationSeconds} seconds</span>
          </div>
          <div className="flex justify-between text-slate-300 py-1 border-b border-slate-800/60">
            <span>Correct Responses:</span>
            <span className="font-mono text-emerald-400 font-bold">{result.correctTrials}</span>
          </div>
          <div className="flex justify-between text-slate-300 py-1 border-b border-slate-800/60">
            <span>Errors / Mistargets:</span>
            <span className="font-mono text-red-400 font-bold">{result.errorTrials}</span>
          </div>
          {result.omissionTrials !== undefined && (
            <div className="flex justify-between text-slate-300 py-1 border-b border-slate-800/60">
              <span>Omissions (Missed Targets):</span>
              <span className="font-mono text-amber-400">{result.omissionTrials}</span>
            </div>
          )}

          {/* Dynamic Extra Metrics */}
          {Object.entries(result.metrics).map(([key, val]) => (
            <div key={key} className="flex justify-between text-slate-300 py-1 border-b border-slate-800/40 last:border-0">
              <span>{key}:</span>
              <span className="font-mono text-cyan-300 font-semibold">{val}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={onRetry}
            className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Practice Again</span>
          </button>

          {isBatteryMode && onNextTest ? (
            <button
              onClick={onNextTest}
              className="flex-1 py-3 px-4 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <span>Next Battery Test</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onHome}
              className="flex-1 py-3 px-4 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <Home className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
