import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TestResult } from '../../types/cadat';
import { generateTestResult } from '../../utils/scoring';
import { sound } from '../../utils/sound';
import { MobileKeypad } from '../MobileKeypad';
import { ArrowLeft, Play, Train, Target, Award } from 'lucide-react';

interface Test4Props {
  onComplete: (result: TestResult) => void;
  onExit: () => void;
  totalTrials?: number;
}

type TrialPhase = 'READY_TO_START' | 'LOCO_RUNNING' | 'EVALUATION' | 'FINISHED';

interface TrialResultItem {
  trial: number;
  speedPxPerSec: number;
  timeErrorMs: number; // positive = late, negative = early
  absoluteErrorMs: number;
  success: boolean; // within acceptable tolerance (< 150ms)
}

export const Test4SpeedPerception: React.FC<Test4Props> = ({
  onComplete,
  onExit,
  totalTrials = 12,
}) => {
  const [phase, setPhase] = useState<'INSTRUCTIONS' | 'TRIAL'>('INSTRUCTIONS');
  const [trialPhase, setTrialPhase] = useState<TrialPhase>('READY_TO_START');
  const [currentTrial, setCurrentTrial] = useState(1);
  const [results, setResults] = useState<TrialResultItem[]>([]);

  // Simulation state
  const [locoX, setLocoX] = useState<number>(0); // position along track (px)
  const [lastTrialFeedback, setLastTrialFeedback] = useState<TrialResultItem | null>(null);

  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const tunnelEntryTimeRef = useRef<number>(0);
  const targetExitTimeRef = useRef<number>(0);
  const currentSpeedRef = useRef<number>(200); // px per second
  const testStartTimeRef = useRef<number>(Date.now());

  // Track Layout Constants (proportional percentage or virtual coordinates 0 to 1000)
  const TRACK_TOTAL_WIDTH = 800;
  const LOCO_WIDTH = 70;
  const START_X = 720; // Loco starts at right
  const TUNNEL_START_X = 220; // Tunnel starts at 220px (from left)
  const TUNNEL_END_X = 60; // Tunnel exit is at 60px (from left)
  const TUNNEL_LENGTH = TUNNEL_START_X - TUNNEL_END_X; // 160px of darkness
  const OPEN_TRACK_DISTANCE = START_X - TUNNEL_START_X; // 500px visible run

  // Setup trial
  const setupTrial = useCallback(() => {
    // Randomize speed between 170 and 340 px/s
    const randomizedSpeed = Math.floor(Math.random() * 160) + 180;
    currentSpeedRef.current = randomizedSpeed;
    setLocoX(START_X);
    setTrialPhase('READY_TO_START');
    setLastTrialFeedback(null);
  }, [START_X]);

  const handleStartTest = () => {
    testStartTimeRef.current = Date.now();
    setCurrentTrial(1);
    setResults([]);
    setPhase('TRIAL');
    setupTrial();
  };

  // Start Loco on 'H' press
  const handleStartLoco = useCallback(() => {
    if (trialPhase !== 'READY_TO_START') return;

    sound.playLocoWhistle();
    setTrialPhase('LOCO_RUNNING');
    startTimeRef.current = performance.now();

    const speed = currentSpeedRef.current;
    const timeToTunnelMs = (OPEN_TRACK_DISTANCE / speed) * 1000;
    const timeThroughTunnelMs = (TUNNEL_LENGTH / speed) * 1000;

    tunnelEntryTimeRef.current = startTimeRef.current + timeToTunnelMs;
    targetExitTimeRef.current = tunnelEntryTimeRef.current + timeThroughTunnelMs;

    const animate = (timestamp: number) => {
      const elapsedSec = (timestamp - startTimeRef.current) / 1000;
      const currentX = START_X - elapsedSec * currentSpeedRef.current;

      setLocoX(currentX);

      // If loco travels way past tunnel exit without stopping (e.g. 2.5s past)
      if (currentX < TUNNEL_END_X - 250) {
        handleStopLoco(timestamp);
        return;
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
  }, [trialPhase, START_X, OPEN_TRACK_DISTANCE, TUNNEL_LENGTH, TUNNEL_END_X]);

  // Stop Loco at Tunnel Exit on 'L' press
  const handleStopLoco = useCallback(
    (stopTimestamp?: number) => {
      if (trialPhase !== 'LOCO_RUNNING') return;

      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }

      const now = stopTimestamp || performance.now();
      const timeError = Math.round(now - targetExitTimeRef.current); // negative = early, positive = late
      const absError = Math.abs(timeError);
      const isAccurate = absError <= 120; // within 120ms is great

      if (isAccurate) {
        sound.playSuccess();
      } else {
        sound.playError();
      }

      const trialResult: TrialResultItem = {
        trial: currentTrial,
        speedPxPerSec: currentSpeedRef.current,
        timeErrorMs: timeError,
        absoluteErrorMs: absError,
        success: isAccurate,
      };

      setLastTrialFeedback(trialResult);
      setResults((prev) => [...prev, trialResult]);
      setTrialPhase('EVALUATION');

      setTimeout(() => {
        if (currentTrial >= totalTrials) {
          setTrialPhase('FINISHED');
        } else {
          setCurrentTrial((c) => c + 1);
          setupTrial();
        }
      }, 2000);
    },
    [trialPhase, currentTrial, totalTrials, setupTrial]
  );

  // Compute final score
  useEffect(() => {
    if (trialPhase === 'FINISHED' && results.length > 0) {
      const avgAbsError = Math.round(
        results.reduce((acc, r) => acc + r.absoluteErrorMs, 0) / results.length
      );
      const accurateCount = results.filter((r) => r.success).length;
      const errorCount = results.length - accurateCount;
      const durationSec = Math.max(1, Math.round((Date.now() - testStartTimeRef.current) / 1000));
      const accuracyPct = Math.round((accurateCount / results.length) * 100);

      // Average bias (positive = generally stops late, negative = stops early)
      const avgBias = Math.round(results.reduce((acc, r) => acc + r.timeErrorMs, 0) / results.length);

      const finalResult = generateTestResult(
        'test4',
        'Speed Perception Test',
        durationSec,
        results.length,
        accurateCount,
        errorCount,
        avgAbsError,
        avgAbsError, // Raw score is average deviation ms (lower is better)
        {
          'Mean Absolute Error': `${avgAbsError} ms`,
          'Timing Accuracy (±120ms)': `${accuracyPct}%`,
          'Estimation Bias': `${avgBias > 0 ? `+${avgBias}ms (Late)` : `${avgBias}ms (Early)`}`,
          'Best Precision': `${Math.min(...results.map((r) => r.absoluteErrorMs))} ms`,
        }
      );

      onComplete(finalResult);
    }
  }, [trialPhase, results, onComplete]);

  // Input router for keys
  const handleKeyInput = useCallback(
    (keyInput: string) => {
      const key = keyInput.toLowerCase();
      if (phase === 'INSTRUCTIONS') {
        if (key === 'h' || key === 'enter' || key === ' ') {
          handleStartTest();
        }
        return;
      }

      if (key === 'h') {
        handleStartLoco();
      } else if (key === 'l') {
        handleStopLoco();
      }
    },
    [phase, handleStartLoco, handleStopLoco]
  );

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h' || e.key.toLowerCase() === 'l' || e.key === ' ') {
        e.preventDefault();
        handleKeyInput(e.key.toLowerCase());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [handleKeyInput]);

  // Check if loco is currently inside tunnel
  const isInTunnel = locoX < TUNNEL_START_X && locoX > TUNNEL_END_X - LOCO_WIDTH;

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] justify-between bg-slate-950 text-slate-100 p-2 sm:p-4">
      {/* Top Header */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between border-b border-slate-800 pb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Test</span>
        </button>

        <div className="text-center">
          <h2 className="text-sm sm:text-base font-bold text-cyan-400">Test 4: Speed Perception Test</h2>
          <span className="text-[11px] text-slate-400">Stop Loco at Tunnel Exit</span>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/30">
            Run {Math.min(currentTrial, totalTrials)} / {totalTrials}
          </span>
        </div>
      </div>

      {/* Main Track Simulation Area */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 sm:py-8 max-w-2xl mx-auto w-full">
        {phase === 'INSTRUCTIONS' && (
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl text-center max-w-md w-full">
            <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-cyan-400">
              <Train className="w-8 h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Speed Perception Test</h3>
            <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
              Standard Indian Railways Loco & Tunnel Simulation:
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 mb-5 text-left text-xs sm:text-sm space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span>Press <strong>H</strong> to start the Locomotive.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>Observe the speed</strong> of the loco as it approaches the tunnel.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>The loco enters the dark tunnel and disappears.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Press <strong>L</strong> to stop the loco exactly when its front reaches the <strong>end of the tunnel</strong>!</span>
              </p>
            </div>
            <button
              onClick={handleStartTest}
              className="w-full py-3.5 px-6 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 active:scale-95 transition-all text-white shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 text-base"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Begin Simulation</span>
            </button>
          </div>
        )}

        {phase === 'TRIAL' && (
          <div className="w-full flex flex-col items-center">
            {/* Visual Instruction Banner */}
            <div className="mb-3 text-center">
              {trialPhase === 'READY_TO_START' && (
                <div className="inline-flex items-center gap-2 bg-purple-950/60 border border-purple-500/40 px-3.5 py-1.5 rounded-full text-purple-300 text-xs sm:text-sm font-semibold animate-pulse">
                  <span>Press <strong className="text-white">H Key</strong> or Tap Below to Start Loco</span>
                </div>
              )}
              {trialPhase === 'LOCO_RUNNING' && (
                <div className="inline-flex items-center gap-2 bg-amber-950/60 border border-amber-500/40 px-3.5 py-1.5 rounded-full text-amber-300 text-xs sm:text-sm font-semibold">
                  <span>Press <strong className="text-white">L Key</strong> to Stop Loco at Tunnel Exit!</span>
                </div>
              )}
              {trialPhase === 'EVALUATION' && lastTrialFeedback && (
                <div
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border ${
                    lastTrialFeedback.success
                      ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300'
                      : 'bg-red-950/60 border-red-400 text-red-300'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>
                    {lastTrialFeedback.timeErrorMs > 0
                      ? `+${lastTrialFeedback.timeErrorMs} ms (Late)`
                      : `${lastTrialFeedback.timeErrorMs} ms (Early)`}{' '}
                    — {lastTrialFeedback.success ? 'Accurate!' : 'Off Target'}
                  </span>
                </div>
              )}
            </div>

            {/* Canvas/SVG Track Scene */}
            <div className="w-full max-w-xl bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
              <svg viewBox="0 0 800 240" className="w-full h-auto select-none">
                {/* Background Sky / Station Wall */}
                <rect width="800" height="240" fill="#090d16" />

                {/* Track Ballast Bed */}
                <rect x="0" y="165" width="800" height="40" fill="#1e293b" />

                {/* Railway Sleepers / Ties */}
                {[...Array(32)].map((_, i) => (
                  <rect key={i} x={i * 25 + 5} y="168" width="14" height="28" fill="#334155" rx="2" />
                ))}

                {/* Steel Rails */}
                <line x1="0" y1="172" x2="800" y2="172" stroke="#94a3b8" strokeWidth="4" />
                <line x1="0" y1="192" x2="800" y2="192" stroke="#64748b" strokeWidth="4" />

                {/* Tunnel Exit Goal Line */}
                <line
                  x1={TUNNEL_END_X}
                  y1="50"
                  x2={TUNNEL_END_X}
                  y2="215"
                  stroke="#22c55e"
                  strokeWidth="3"
                  strokeDasharray="6,4"
                />
                <text x={TUNNEL_END_X - 45} y="40" fill="#22c55e" fontSize="12" fontWeight="bold">
                  EXIT
                </text>

                {/* Locomotive (Moving Right to Left) */}
                <g
                  transform={`translate(${locoX}, 105)`}
                  opacity={isInTunnel && trialPhase === 'LOCO_RUNNING' ? 0 : 1}
                  className="transition-opacity duration-75"
                >
                  {/* Locomotive Body (Modern Indian Railways Engine) */}
                  <rect x="0" y="20" width="70" height="48" rx="6" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
                  {/* Cab & Windows */}
                  <rect x="5" y="26" width="22" height="18" rx="2" fill="#0f172a" />
                  <rect x="32" y="26" width="30" height="14" rx="2" fill="#0f172a" />
                  {/* Headlight on Front (Left) */}
                  <circle cx="2" cy="45" r="5" fill="#facc15" />
                  <polygon points="0,45 -35,32 -35,58" fill="rgba(250, 204, 21, 0.15)" />
                  {/* Wheels */}
                  <circle cx="16" cy="68" r="8" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
                  <circle cx="36" cy="68" r="8" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
                  <circle cx="56" cy="68" r="8" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
                  {/* Roof pantograph / horn */}
                  <path d="M12 20 L25 8 L38 20" stroke="#f8fafc" strokeWidth="2" fill="none" />
                </g>

                {/* Black Tunnel Block (As seen in the user's reference photo) */}
                <rect
                  x={TUNNEL_END_X}
                  y="65"
                  width={TUNNEL_LENGTH}
                  height="115"
                  fill="#000000"
                  stroke="#334155"
                  strokeWidth="3"
                  rx="6"
                  opacity={trialPhase === 'EVALUATION' ? 0.35 : 1}
                />
                <text
                  x={TUNNEL_END_X + TUNNEL_LENGTH / 2 - 25}
                  y="125"
                  fill={trialPhase === 'EVALUATION' ? '#94a3b8' : '#334155'}
                  fontSize="13"
                  fontWeight="bold"
                >
                  TUNNEL
                </text>

                {/* Tunnel Portal Entry Arch */}
                <path
                  d={`M ${TUNNEL_START_X} 65 Q ${TUNNEL_START_X + 15} 122 ${TUNNEL_START_X} 180`}
                  stroke="#475569"
                  strokeWidth="5"
                  fill="none"
                />

                {/* Evaluation Marker */}
                {trialPhase === 'EVALUATION' && (
                  <g>
                    {/* True loco front pointer */}
                    <line x1={locoX} y1="70" x2={locoX} y2="200" stroke="#f59e0b" strokeWidth="3" />
                    <circle cx={locoX} cy="70" r="5" fill="#f59e0b" />
                    <text x={locoX - 25} y="60" fill="#f59e0b" fontSize="11" fontWeight="bold">
                      YOU STOPPED
                    </text>
                  </g>
                )}
              </svg>
            </div>

            <p className="text-xs text-slate-400 mt-3 text-center">
              Watch speed approaching tunnel → Mentally calculate transit time → Press <strong className="text-emerald-400">L</strong> at exit!
            </p>
          </div>
        )}
      </div>

      {/* Bottom Keypad Controller */}
      <div className="max-w-xl mx-auto w-full">
        <MobileKeypad testId="test4" onKeyPress={handleKeyInput} />
      </div>
    </div>
  );
};
