import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TestResult } from '../../types/cadat';
import { generateTestResult } from '../../utils/scoring';
import { sound } from '../../utils/sound';
import { MobileKeypad } from '../MobileKeypad';
import { ArrowLeft, Play, Train, Award, RefreshCw } from 'lucide-react';

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
  const [locoX, setLocoX] = useState<number>(680); // position along track (px)
  const [lastTrialFeedback, setLastTrialFeedback] = useState<TrialResultItem | null>(null);

  // Animation and physics refs
  const locoGroupRef = useRef<SVGGElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const tunnelEntryTimeRef = useRef<number>(0);
  const targetExitTimeRef = useRef<number>(0);
  const currentSpeedRef = useRef<number>(200); // px per second
  const trialPhaseRef = useRef<TrialPhase>('READY_TO_START');
  const testStartTimeRef = useRef<number>(Date.now());
  const currentLocoXRef = useRef<number>(680);

  // Track Layout Constants (matching 800px width SVG scene)
  const LOCO_WIDTH = 75;
  const START_X = 680; // Loco starts at right (680px)
  const TUNNEL_START_X = 260; // Tunnel entrance at 260px (from left)
  const TUNNEL_END_X = 70; // Tunnel exit at 70px (from left)
  const TUNNEL_LENGTH = TUNNEL_START_X - TUNNEL_END_X; // 190px of darkness
  const OPEN_TRACK_DISTANCE = START_X - TUNNEL_START_X; // 420px of visible running

  // Keep trialPhaseRef synchronized with trialPhase state
  useEffect(() => {
    trialPhaseRef.current = trialPhase;
  }, [trialPhase]);

  // Clean animation frame on component unmount ONLY
  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Setup / Reset single trial
  const setupTrial = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    // Randomize speed between 175 and 320 px/s
    const randomizedSpeed = Math.floor(Math.random() * 145) + 175;
    currentSpeedRef.current = randomizedSpeed;
    currentLocoXRef.current = START_X;
    setLocoX(START_X);
    setTrialPhase('READY_TO_START');
    trialPhaseRef.current = 'READY_TO_START';
    setLastTrialFeedback(null);

    // Reset direct DOM transform if attached
    if (locoGroupRef.current) {
      locoGroupRef.current.setAttribute('transform', `translate(${START_X}, 100)`);
      locoGroupRef.current.style.opacity = '1';
    }
  }, [START_X]);

  const handleStartTest = () => {
    testStartTimeRef.current = Date.now();
    setCurrentTrial(1);
    setResults([]);
    setPhase('TRIAL');
    setupTrial();
  };

  // Stop Loco at Tunnel Exit on 'L' press
  const handleStopLoco = useCallback(
    (stopTimestamp?: number) => {
      if (trialPhaseRef.current !== 'LOCO_RUNNING') return;

      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }

      setTrialPhase('EVALUATION');
      trialPhaseRef.current = 'EVALUATION';

      const now = stopTimestamp || performance.now();
      const timeError = Math.round(now - targetExitTimeRef.current); // negative = early, positive = late
      const absError = Math.abs(timeError);
      const isAccurate = absError <= 125; // within 125ms is accurate

      if (isAccurate) {
        sound.playSuccess();
      } else {
        sound.playError();
      }

      const stoppedX = currentLocoXRef.current;
      setLocoX(stoppedX);

      // Make loco visible in evaluation
      if (locoGroupRef.current) {
        locoGroupRef.current.style.opacity = '1';
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

      setTimeout(() => {
        if (currentTrial >= totalTrials) {
          setTrialPhase('FINISHED');
          trialPhaseRef.current = 'FINISHED';
        } else {
          setCurrentTrial((c) => c + 1);
          setupTrial();
        }
      }, 2200);
    },
    [currentTrial, totalTrials, setupTrial]
  );

  // Start Loco on 'H' press
  const handleStartLoco = useCallback(() => {
    if (trialPhaseRef.current !== 'READY_TO_START') return;

    sound.playLocoWhistle();
    setTrialPhase('LOCO_RUNNING');
    trialPhaseRef.current = 'LOCO_RUNNING';
    startTimeRef.current = performance.now();

    const speed = currentSpeedRef.current;
    const timeToTunnelMs = (OPEN_TRACK_DISTANCE / speed) * 1000;
    const timeThroughTunnelMs = (TUNNEL_LENGTH / speed) * 1000;

    tunnelEntryTimeRef.current = startTimeRef.current + timeToTunnelMs;
    targetExitTimeRef.current = tunnelEntryTimeRef.current + timeThroughTunnelMs;

    const animate = (timestamp: number) => {
      if (trialPhaseRef.current !== 'LOCO_RUNNING') return;

      const elapsedSec = (timestamp - startTimeRef.current) / 1000;
      const currentX = START_X - elapsedSec * currentSpeedRef.current;
      currentLocoXRef.current = currentX;

      // Update state for React re-render
      setLocoX(currentX);

      // Also directly update SVG transform for butter-smooth 60/120fps motion
      if (locoGroupRef.current) {
        locoGroupRef.current.setAttribute('transform', `translate(${currentX}, 100)`);
        // Disappear when completely inside tunnel (between entrance and exit)
        const inTunnel = currentX < TUNNEL_START_X && currentX + LOCO_WIDTH > TUNNEL_END_X;
        locoGroupRef.current.style.opacity = inTunnel ? '0' : '1';
      }

      // If loco travels way past tunnel exit without stopping (e.g. 2s past)
      if (currentX < TUNNEL_END_X - 220) {
        handleStopLoco(timestamp);
        return;
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
  }, [START_X, OPEN_TRACK_DISTANCE, TUNNEL_LENGTH, TUNNEL_END_X, LOCO_WIDTH, handleStopLoco]);

  // Compute final score when finished
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
          'Timing Accuracy (±125ms)': `${accuracyPct}%`,
          'Estimation Bias': `${avgBias > 0 ? `+${avgBias}ms (Late)` : `${avgBias}ms (Early)`}`,
          'Best Precision': `${Math.min(...results.map((r) => r.absoluteErrorMs))} ms`,
        }
      );

      onComplete(finalResult);
    }
  }, [trialPhase, results, onComplete]);

  // Key action dispatcher
  const handleKeyAction = useCallback(
    (keyInput: string) => {
      const key = keyInput.toLowerCase();
      if (phase === 'INSTRUCTIONS') {
        if (key === 'h' || key === 'enter' || key === ' ') {
          handleStartTest();
        }
        return;
      }

      if (key === 'h') {
        if (trialPhaseRef.current === 'READY_TO_START') {
          handleStartLoco();
        }
      } else if (key === 'l') {
        if (trialPhaseRef.current === 'LOCO_RUNNING') {
          handleStopLoco();
        }
      }
    },
    [phase, handleStartLoco, handleStopLoco]
  );

  // Global physical keyboard listener (Clean — never touches requestRef!)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'h' || key === 'l' || key === ' ') {
        e.preventDefault();
        handleKeyAction(key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyAction]);

  // Is loco currently inside tunnel?
  const isInTunnel = locoX < TUNNEL_START_X && locoX + LOCO_WIDTH > TUNNEL_END_X;

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] justify-between bg-slate-950 text-slate-100 p-2 sm:p-4 select-none">
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
          <span className="text-[11px] text-slate-400">Loco & Tunnel Simulation</span>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/30">
            Run {Math.min(currentTrial, totalTrials)} / {totalTrials}
          </span>
        </div>
      </div>

      {/* Main Track Simulation Area */}
      <div className="flex-1 flex flex-col items-center justify-center py-3 sm:py-6 max-w-2xl mx-auto w-full">
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
                <span>Press <strong>H</strong> (or tap purple button) to start the Locomotive.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>Observe the speed</strong> of the loco as it rolls along the track.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>The loco enters the dark tunnel and becomes invisible.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Press <strong>L</strong> (or tap green button) at the exact moment the front of the loco emerges at the <strong>end of the tunnel</strong>!</span>
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
            {/* Status Instruction Bar */}
            <div className="mb-3 text-center min-h-[36px] flex items-center justify-center">
              {trialPhase === 'READY_TO_START' && (
                <div className="inline-flex items-center gap-2 bg-purple-950/70 border border-purple-500/50 px-4 py-1.5 rounded-full text-purple-200 text-xs sm:text-sm font-bold animate-pulse">
                  <span>Press <strong className="text-white underline">H Key</strong> or Tap Below to Start Loco</span>
                </div>
              )}
              {trialPhase === 'LOCO_RUNNING' && (
                <div
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold border ${
                    isInTunnel
                      ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 animate-pulse'
                      : 'bg-amber-950/70 border-amber-500/50 text-amber-200'
                  }`}
                >
                  <span>
                    {isInTunnel
                      ? '🚂 Inside Tunnel! Anticipate Exit & Press L!'
                      : '👀 Observing Speed... Approaching Tunnel'}
                  </span>
                </div>
              )}
              {trialPhase === 'EVALUATION' && lastTrialFeedback && (
                <div
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold border ${
                    lastTrialFeedback.success
                      ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300'
                      : 'bg-red-950/70 border-red-400 text-red-300'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>
                    {lastTrialFeedback.timeErrorMs > 0
                      ? `+${lastTrialFeedback.timeErrorMs} ms (Stopped Late)`
                      : `${lastTrialFeedback.timeErrorMs} ms (Stopped Early)`}{' '}
                    — {lastTrialFeedback.success ? '🎯 Accurate!' : '⚠️ Off Target'}
                  </span>
                </div>
              )}
            </div>

            {/* SVG Track & Locomotive Visual Scene */}
            <div className="w-full max-w-xl bg-slate-900 border-2 border-slate-700 rounded-2xl p-3 sm:p-5 shadow-2xl relative overflow-hidden">
              <svg viewBox="0 0 800 240" className="w-full h-auto select-none">
                {/* Background Sky / Cockpit */}
                <rect width="800" height="240" fill="#090d16" rx="8" />

                {/* Track Ballast Bed */}
                <rect x="0" y="165" width="800" height="42" fill="#1e293b" />

                {/* Railway Sleepers / Ties */}
                {[...Array(34)].map((_, i) => (
                  <rect key={i} x={i * 24 + 4} y="168" width="13" height="28" fill="#334155" rx="2" />
                ))}

                {/* Steel Rails */}
                <line x1="0" y1="172" x2="800" y2="172" stroke="#94a3b8" strokeWidth="4" />
                <line x1="0" y1="192" x2="800" y2="192" stroke="#64748b" strokeWidth="4" />

                {/* Tunnel Exit Goal Line (Exit Marker) */}
                <line
                  x1={TUNNEL_END_X}
                  y1="40"
                  x2={TUNNEL_END_X}
                  y2="215"
                  stroke="#22c55e"
                  strokeWidth="3.5"
                  strokeDasharray="6,4"
                />
                <rect x={TUNNEL_END_X - 52} y="25" width="48" height="22" rx="4" fill="#14532d" stroke="#22c55e" strokeWidth="1.5" />
                <text x={TUNNEL_END_X - 44} y="40" fill="#86efac" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  EXIT
                </text>

                {/* Locomotive (Facing Left, moving Right to Left) */}
                <g
                  ref={locoGroupRef}
                  transform={`translate(${locoX}, 100)`}
                  style={{ opacity: isInTunnel && trialPhase === 'LOCO_RUNNING' ? 0 : 1 }}
                >
                  {/* Locomotive Body (Modern Indian Railways Engine) */}
                  <rect x="0" y="20" width="75" height="48" rx="6" fill="#0284c7" stroke="#38bdf8" strokeWidth="2.5" />
                  {/* Red Boiler Stripe */}
                  <rect x="0" y="44" width="75" height="8" fill="#ef4444" />
                  {/* Driver Cab & Windows */}
                  <rect x="5" y="25" width="22" height="18" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                  <rect x="32" y="25" width="34" height="15" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                  {/* Glowing Yellow Headlight (Pointing Left towards Tunnel) */}
                  <circle cx="1" cy="48" r="6" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" />
                  <polygon points="0,48 -40,30 -40,66" fill="rgba(250, 204, 21, 0.2)" />
                  {/* Steam / Pantograph on Top */}
                  <path d="M15 20 L25 6 L35 20" stroke="#f8fafc" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
                  {/* Wheels (3 rotating axles) */}
                  <circle cx="16" cy="68" r="9" fill="#334155" stroke="#94a3b8" strokeWidth="2.5" />
                  <circle cx="16" cy="68" r="3" fill="#94a3b8" />
                  <circle cx="38" cy="68" r="9" fill="#334155" stroke="#94a3b8" strokeWidth="2.5" />
                  <circle cx="38" cy="68" r="3" fill="#94a3b8" />
                  <circle cx="60" cy="68" r="9" fill="#334155" stroke="#94a3b8" strokeWidth="2.5" />
                  <circle cx="60" cy="68" r="3" fill="#94a3b8" />
                </g>

                {/* Dark Tunnel (Black Box matching reference photo) */}
                <rect
                  x={TUNNEL_END_X}
                  y="60"
                  width={TUNNEL_LENGTH}
                  height="125"
                  fill="#000000"
                  stroke="#475569"
                  strokeWidth="3.5"
                  rx="6"
                  opacity={trialPhase === 'EVALUATION' ? 0.35 : 1}
                />
                <text
                  x={TUNNEL_END_X + TUNNEL_LENGTH / 2 - 32}
                  y="126"
                  fill={trialPhase === 'EVALUATION' ? '#94a3b8' : '#475569'}
                  fontSize="14"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  TUNNEL
                </text>

                {/* Tunnel Entrance Arch */}
                <path
                  d={`M ${TUNNEL_START_X} 60 Q ${TUNNEL_START_X + 16} 122 ${TUNNEL_START_X} 185`}
                  stroke="#64748b"
                  strokeWidth="6"
                  fill="none"
                />

                {/* Evaluation Stopping Marker */}
                {trialPhase === 'EVALUATION' && (
                  <g>
                    <line x1={locoX} y1="50" x2={locoX} y2="210" stroke="#f59e0b" strokeWidth="3.5" />
                    <circle cx={locoX} cy="50" r="6" fill="#f59e0b" />
                    <rect x={locoX - 44} y="26" width="88" height="20" rx="4" fill="#78350f" stroke="#f59e0b" strokeWidth="1.5" />
                    <text x={locoX - 38} y="40" fill="#fef08a" fontSize="10" fontWeight="bold">
                      YOU STOPPED
                    </text>
                  </g>
                )}
              </svg>
            </div>

            <p className="text-xs text-slate-400 mt-3 text-center">
              Press <strong className="text-purple-400 font-mono">H</strong> to dispatch Loco → Gauge velocity → Press <strong className="text-emerald-400 font-mono">L</strong> at tunnel exit!
            </p>
          </div>
        )}
      </div>

      {/* Bottom Keypad Controller */}
      <div className="max-w-xl mx-auto w-full">
        <MobileKeypad testId="test4" onKeyPress={handleKeyAction} />
      </div>
    </div>
  );
};
