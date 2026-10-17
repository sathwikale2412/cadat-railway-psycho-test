import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TestResult } from '../../types/cadat';
import { generateTestResult } from '../../utils/scoring';
import { sound } from '../../utils/sound';
import { MobileKeypad } from '../MobileKeypad';
import { ArrowLeft, RefreshCw, Zap, Award, AlertCircle } from 'lucide-react';

interface Test1Props {
  onComplete: (result: TestResult) => void;
  onExit: () => void;
  totalRounds?: number;
}

type Phase = 'INSTRUCTIONS' | 'WAITING_FOR_L_ARM' | 'ARMED_WAITING_SIGNAL' | 'SIGNAL_DISPLAYED' | 'WAITING_FINAL_L' | 'FEEDBACK' | 'FINISHED';
type SignalColor = 'yellow' | 'red' | 'green';

export const Test1ReactionTime: React.FC<Test1Props> = ({
  onComplete,
  onExit,
  totalRounds = 15,
}) => {
  const [phase, setPhase] = useState<Phase>('INSTRUCTIONS');
  const [currentRound, setCurrentRound] = useState(1);
  const [activeSignalColor, setActiveSignalColor] = useState<SignalColor | null>(null);
  const [roundFeedback, setRoundFeedback] = useState<{
    success: boolean;
    reactionTimeMs?: number;
    message: string;
  } | null>(null);

  // Stats
  const [results, setResults] = useState<{
    round: number;
    signalColor: SignalColor;
    reactionTimeMs: number;
    movementTimeMs: number;
    success: boolean;
    errorType?: string;
  }[]>([]);

  const stimulusTimeRef = useRef<number>(0);
  const colorPressedTimeRef = useRef<number>(0);
  const timerTimeoutRef = useRef<number | null>(null);
  const testStartTimeRef = useRef<number>(Date.now());

  // Clean timeouts on unmount
  useEffect(() => {
    return () => {
      if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
    };
  }, []);

  const startNextRound = useCallback(() => {
    if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
    setRoundFeedback(null);
    setActiveSignalColor(null);
    setPhase('WAITING_FOR_L_ARM');
  }, []);

  const handleStartTest = () => {
    testStartTimeRef.current = Date.now();
    setCurrentRound(1);
    setResults([]);
    startNextRound();
  };

  // Keyboard and Keypad input dispatcher
  const handleInput = useCallback(
    (keyInput: string) => {
      const key = keyInput.toLowerCase();

      if (phase === 'INSTRUCTIONS') {
        if (key === 'l' || key === 'enter' || key === ' ') {
          handleStartTest();
        }
        return;
      }

      if (phase === 'WAITING_FOR_L_ARM') {
        if (key === 'l') {
          sound.playKeyClick();
          setPhase('ARMED_WAITING_SIGNAL');

          // Schedule random appearance between 1.2s and 3.2s
          const randomDelay = Math.floor(Math.random() * 2000) + 1200;
          const colors: SignalColor[] = ['yellow', 'red', 'green'];
          const chosen = colors[Math.floor(Math.random() * colors.length)];

          timerTimeoutRef.current = window.setTimeout(() => {
            stimulusTimeRef.current = performance.now();
            setActiveSignalColor(chosen);
            setPhase('SIGNAL_DISPLAYED');
            sound.playSignalCue(chosen === 'yellow' ? 580 : chosen === 'red' ? 440 : 660);
          }, randomDelay);
        }
        return;
      }

      if (phase === 'ARMED_WAITING_SIGNAL') {
        // Pressed premature key! False start
        if (['l', 'y', 'r', 'g', 'b'].includes(key)) {
          if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
          sound.playError();
          setRoundFeedback({
            success: false,
            message: 'Too Early! Do not press before the color appears.',
          });
          setResults((prev) => [
            ...prev,
            {
              round: currentRound,
              signalColor: 'red',
              reactionTimeMs: 1000,
              movementTimeMs: 0,
              success: false,
              errorType: 'Premature Press',
            },
          ]);
          setPhase('FEEDBACK');
          setTimeout(() => {
            if (currentRound >= totalRounds) {
              finishTest();
            } else {
              setCurrentRound((c) => c + 1);
              startNextRound();
            }
          }, 1400);
        }
        return;
      }

      if (phase === 'SIGNAL_DISPLAYED') {
        const now = performance.now();
        const reactionTime = Math.round(now - stimulusTimeRef.current);
        colorPressedTimeRef.current = now;

        const expectedKey = activeSignalColor === 'yellow' ? 'y' : activeSignalColor === 'red' ? 'r' : 'g';

        if (key === expectedKey) {
          sound.playKeyClick();
          // Step 1 correct: Now candidate must press L again immediately
          setPhase('WAITING_FINAL_L');
        } else if (['y', 'r', 'g'].includes(key)) {
          // Wrong color pressed!
          sound.playError();
          setRoundFeedback({
            success: false,
            reactionTimeMs: reactionTime,
            message: `Wrong key! Expected ${activeSignalColor?.toUpperCase()}, pressed ${key.toUpperCase()}`,
          });
          setResults((prev) => [
            ...prev,
            {
              round: currentRound,
              signalColor: activeSignalColor!,
              reactionTimeMs: reactionTime,
              movementTimeMs: 0,
              success: false,
              errorType: 'Wrong Color',
            },
          ]);
          setPhase('FEEDBACK');
          setTimeout(() => {
            if (currentRound >= totalRounds) {
              finishTest();
            } else {
              setCurrentRound((c) => c + 1);
              startNextRound();
            }
          }, 1500);
        }
        return;
      }

      if (phase === 'WAITING_FINAL_L') {
        if (key === 'l') {
          const now = performance.now();
          const totalRT = Math.round(now - stimulusTimeRef.current);
          const movementRT = Math.round(now - colorPressedTimeRef.current);

          sound.playSuccess();
          setRoundFeedback({
            success: true,
            reactionTimeMs: totalRT,
            message: `⚡ ${totalRT} ms (${totalRT < 380 ? 'Excellent Speed!' : 'Good Response'})`,
          });

          setResults((prev) => [
            ...prev,
            {
              round: currentRound,
              signalColor: activeSignalColor!,
              reactionTimeMs: totalRT,
              movementTimeMs: movementRT,
              success: true,
            },
          ]);

          setPhase('FEEDBACK');
          setTimeout(() => {
            if (currentRound >= totalRounds) {
              finishTest();
            } else {
              setCurrentRound((c) => c + 1);
              startNextRound();
            }
          }, 1100);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase, activeSignalColor, currentRound, totalRounds]
  );

  const finishTest = useCallback(() => {
    setPhase('FINISHED');
  }, []);

  // When finished, compute score
  useEffect(() => {
    if (phase === 'FINISHED' && results.length > 0) {
      const correctResults = results.filter((r) => r.success);
      const correctCount = correctResults.length;
      const errorCount = results.length - correctCount;

      const avgRT =
        correctResults.length > 0
          ? Math.round(correctResults.reduce((acc, r) => acc + r.reactionTimeMs, 0) / correctResults.length)
          : 999;

      const durationSec = Math.max(1, Math.round((Date.now() - testStartTimeRef.current) / 1000));

      const finalResult = generateTestResult(
        'test1',
        'Complex Reaction Time Test',
        durationSec,
        results.length,
        correctCount,
        errorCount,
        avgRT,
        avgRT, // Raw metric is average reaction time ms
        {
          'Fastest Reaction': correctResults.length > 0 ? `${Math.min(...correctResults.map((r) => r.reactionTimeMs))} ms` : 'N/A',
          'Slowest Reaction': correctResults.length > 0 ? `${Math.max(...correctResults.map((r) => r.reactionTimeMs))} ms` : 'N/A',
          'Accuracy Rate': `${Math.round((correctCount / results.length) * 100)}%`,
        }
      );

      onComplete(finalResult);
    }
  }, [phase, results, onComplete]);

  // Global physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrows and space
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      handleInput(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput]);

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
          <h2 className="text-sm sm:text-base font-bold text-cyan-400">Test 1: Complex Reaction Time</h2>
          <span className="text-[11px] text-slate-400">RDSO CADAT Battery</span>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/30">
            Round {Math.min(currentRound, totalRounds)} / {totalRounds}
          </span>
        </div>
      </div>

      {/* Main Signal Display Area */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 sm:py-8 max-w-xl mx-auto w-full">
        {phase === 'INSTRUCTIONS' && (
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl text-center max-w-md w-full">
            <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-cyan-400">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Complex Reaction Time Test</h3>
            <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
              Based on official CADAT RDSO instructions:
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 mb-5 text-left text-xs sm:text-sm space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">1.</span>
                <span>Press <strong className="text-indigo-400">L</strong> key to arm the test.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">2.</span>
                <span>A colored light will flash: <strong className="text-yellow-400">Yellow (Y)</strong>, <strong className="text-red-400">Red (R)</strong>, or <strong className="text-emerald-400">Green (G)</strong>.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">3.</span>
                <span>Immediately press that matching coloured key, then press <strong className="text-indigo-400">L again</strong>!</span>
              </p>
            </div>
            <button
              onClick={handleStartTest}
              className="w-full py-3.5 px-6 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 active:scale-95 transition-all text-white shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 text-base"
            >
              <Zap className="w-5 h-5" />
              <span>Start Practice Test</span>
            </button>
          </div>
        )}

        {phase === 'WAITING_FOR_L_ARM' && (
          <div className="text-center animate-fade-in">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-dashed border-indigo-500/50 flex flex-col items-center justify-center mx-auto mb-5 bg-indigo-950/20 shadow-inner">
              <span className="text-4xl sm:text-5xl font-mono font-black text-indigo-400">L</span>
              <span className="text-xs text-indigo-300 font-medium mt-1">Press L Key</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-200 mb-1">Press 'L' to Arm Test</h4>
            <p className="text-xs text-slate-400">Keep fingers ready on Y, R, G, and L keys</p>
          </div>
        )}

        {phase === 'ARMED_WAITING_SIGNAL' && (
          <div className="text-center animate-pulse">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-slate-700 bg-slate-900/60 flex flex-col items-center justify-center mx-auto mb-5 shadow-2xl">
              <div className="w-6 h-6 rounded-full bg-slate-700 animate-ping mb-2" />
              <span className="text-xs text-slate-400 font-mono tracking-widest uppercase">READY...</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-amber-300 mb-1">Watch Screen Carefully!</h4>
            <p className="text-xs text-slate-400">Signal will appear any millisecond...</p>
          </div>
        )}

        {phase === 'SIGNAL_DISPLAYED' && activeSignalColor && (
          <div className="text-center animate-bounce-short">
            <div
              className={`w-40 h-40 sm:w-52 sm:h-52 rounded-full border-8 flex flex-col items-center justify-center mx-auto mb-4 shadow-2xl transition-all ${
                activeSignalColor === 'yellow'
                  ? 'bg-amber-400 border-amber-200 shadow-amber-500/80 ring-8 ring-amber-400/30'
                  : activeSignalColor === 'red'
                  ? 'bg-red-600 border-red-300 shadow-red-600/80 ring-8 ring-red-600/30'
                  : 'bg-emerald-500 border-emerald-200 shadow-emerald-500/80 ring-8 ring-emerald-500/30'
              }`}
            >
              <span
                className={`text-3xl sm:text-4xl font-black font-mono tracking-wider ${
                  activeSignalColor === 'yellow' ? 'text-black' : 'text-white'
                }`}
              >
                {activeSignalColor.toUpperCase()}
              </span>
              <span
                className={`text-xs uppercase font-extrabold mt-1 tracking-widest ${
                  activeSignalColor === 'yellow' ? 'text-black/80' : 'text-white/90'
                }`}
              >
                Press Key: {activeSignalColor === 'yellow' ? 'Y' : activeSignalColor === 'red' ? 'R' : 'G'}
              </span>
            </div>
            <p className="text-sm font-bold text-white uppercase tracking-wider animate-pulse">
              Press Color Key Immediately!
            </p>
          </div>
        )}

        {phase === 'WAITING_FINAL_L' && (
          <div className="text-center animate-fade-in">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-indigo-400 bg-indigo-600/30 flex flex-col items-center justify-center mx-auto mb-4 shadow-2xl ring-8 ring-indigo-500/40 animate-pulse">
              <span className="text-4xl sm:text-5xl font-mono font-black text-white">L</span>
              <span className="text-xs text-indigo-200 font-bold uppercase mt-1">Press L Now!</span>
            </div>
            <h4 className="text-base sm:text-lg font-extrabold text-indigo-300 mb-1">Now Hit 'L' Key!</h4>
            <p className="text-xs text-slate-300">Complete the reaction cycle</p>
          </div>
        )}

        {phase === 'FEEDBACK' && roundFeedback && (
          <div className="text-center animate-fade-in">
            <div
              className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 flex flex-col items-center justify-center mx-auto mb-4 shadow-xl ${
                roundFeedback.success
                  ? 'bg-emerald-950/40 border-emerald-400 text-emerald-400'
                  : 'bg-red-950/40 border-red-500 text-red-400'
              }`}
            >
              {roundFeedback.success ? (
                <>
                  <Award className="w-10 h-10 mb-1" />
                  <span className="text-2xl font-mono font-bold">{roundFeedback.reactionTimeMs} ms</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-10 h-10 mb-1" />
                  <span className="text-sm font-bold">ERROR</span>
                </>
              )}
            </div>
            <p
              className={`text-sm sm:text-base font-bold ${
                roundFeedback.success ? 'text-emerald-300' : 'text-red-400'
              }`}
            >
              {roundFeedback.message}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Mobile Keypad Controller */}
      <div className="max-w-xl mx-auto w-full">
        <MobileKeypad
          testId="test1"
          onKeyPress={handleInput}
          activeState={{
            isWaitingForL: phase === 'WAITING_FOR_L_ARM' || phase === 'WAITING_FINAL_L',
            isArmed: phase === 'ARMED_WAITING_SIGNAL',
            currentColor: activeSignalColor,
          }}
        />
      </div>
    </div>
  );
};
