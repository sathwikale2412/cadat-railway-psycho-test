import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TestResult } from '../../types/cadat';
import { generateTestResult } from '../../utils/scoring';
import { sound } from '../../utils/sound';
import { MobileKeypad } from '../MobileKeypad';
import { ArrowLeft, Play, Timer, CheckCircle, Target } from 'lucide-react';

interface Test3Props {
  onComplete: (result: TestResult) => void;
  onExit: () => void;
  durationSeconds?: number;
}

interface DotCell {
  id: number;
  row: number;
  col: number;
  dotCount: 3 | 4 | 5;
  patternVariant: number; // For varied geometric dot layouts
  isMarked: boolean;
}

const GRID_COLS = 10;
const GRID_ROWS = 8;
const TOTAL_CELLS = GRID_COLS * GRID_ROWS; // 80 cells per page

export const Test3Concentration: React.FC<Test3Props> = ({
  onComplete,
  onExit,
  durationSeconds = 180, // Default 3 minutes for mobile practice (or 300 for full mock)
}) => {
  const [phase, setPhase] = useState<'INSTRUCTIONS' | 'RUNNING' | 'FINISHED'>('INSTRUCTIONS');
  const [cells, setCells] = useState<DotCell[]>([]);
  const [activeCursor, setActiveCursor] = useState<number>(0); // 0 to TOTAL_CELLS - 1
  const [timeLeft, setTimeLeft] = useState<number>(durationSeconds);

  const timerIntervalRef = useRef<number | null>(null);
  const testStartTimeRef = useRef<number>(Date.now());

  // Generate dot grid with ~35-40% 4-dot boxes, ~30% 3-dot, ~30% 5-dot
  const generateGrid = useCallback(() => {
    const newCells: DotCell[] = [];
    for (let i = 0; i < TOTAL_CELLS; i++) {
      const rand = Math.random();
      let dotCount: 3 | 4 | 5 = 4;
      if (rand < 0.32) {
        dotCount = 3;
      } else if (rand < 0.70) {
        dotCount = 4; // 38% target rate
      } else {
        dotCount = 5;
      }

      newCells.push({
        id: i,
        row: Math.floor(i / GRID_COLS),
        col: i % GRID_COLS,
        dotCount,
        patternVariant: Math.floor(Math.random() * 4),
        isMarked: false,
      });
    }
    return newCells;
  }, []);

  const handleStart = () => {
    const grid = generateGrid();
    setCells(grid);
    setActiveCursor(0);
    setTimeLeft(durationSeconds);
    testStartTimeRef.current = Date.now();
    setPhase('RUNNING');
    sound.playSignalCue(520);
  };

  // Timer countdown
  useEffect(() => {
    if (phase !== 'RUNNING') return;

    timerIntervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [phase]);

  const finishTest = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setPhase('FINISHED');
  }, []);

  // Compute final score
  useEffect(() => {
    if (phase === 'FINISHED' && cells.length > 0) {
      let correctMarks = 0;
      let wrongMarks = 0; // marked 3 or 5 dots
      let totalFourDots = 0;

      cells.forEach((cell) => {
        if (cell.dotCount === 4) {
          totalFourDots++;
          if (cell.isMarked) {
            correctMarks++;
          }
        } else {
          if (cell.isMarked) {
            wrongMarks++;
          }
        }
      });

      const missedFourDots = totalFourDots - correctMarks;
      // RDSO formula: Net Score = Correct - (Wrong / 2)
      const rawNetScore = Math.max(0, Math.round((correctMarks - wrongMarks * 0.5) * 10) / 10);
      const totalAttempted = correctMarks + wrongMarks;
      const accuracyPct = totalAttempted > 0 ? Math.round((correctMarks / totalAttempted) * 100) : 0;
      const durationSec = durationSeconds - timeLeft;

      const finalResult = generateTestResult(
        'test3',
        'Test of Concentration (4-Dots)',
        durationSec,
        totalFourDots, // denominator is the target groups, not every cell on the page
        correctMarks,
        wrongMarks,
        null, // self-paced scanning has no reaction time
        rawNetScore,
        {
          'Total 4-Dot Groups': totalFourDots,
          'Correctly Marked': correctMarks,
          'Missed 4-Dots': missedFourDots,
          'Wrong Markings (3/5 dots)': wrongMarks,
          'Scanning Accuracy': `${accuracyPct}%`,
          'Cells Scanned': activeCursor + 1,
        },
        missedFourDots
      );

      onComplete(finalResult);
    }
  }, [phase, cells, durationSeconds, timeLeft, activeCursor, onComplete]);

  // Handle D-pad and Arrow inputs
  const handleKeyAction = useCallback(
    (actionKey: string) => {
      if (phase !== 'RUNNING') return;
      const key = actionKey.toLowerCase();

      if (key === 'arrowright') {
        sound.playKeyClick();
        setActiveCursor((prev) => (prev < TOTAL_CELLS - 1 ? prev + 1 : prev));
      } else if (key === 'arrowleft') {
        sound.playKeyClick();
        setActiveCursor((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (key === 'arrowup') {
        // Mark 4 dots
        sound.playKeyClick();
        setCells((prev) => {
          const updated = [...prev];
          updated[activeCursor] = { ...updated[activeCursor], isMarked: true };
          return updated;
        });
        // Auto-advance cursor forward like experienced railway candidates do
        setActiveCursor((prev) => (prev < TOTAL_CELLS - 1 ? prev + 1 : prev));
      } else if (key === 'arrowdown') {
        // Unmark
        sound.playKeyClick();
        setCells((prev) => {
          const updated = [...prev];
          updated[activeCursor] = { ...updated[activeCursor], isMarked: false };
          return updated;
        });
      }
    },
    [phase, activeCursor]
  );

  // Direct cell tap for touch screens
  const handleCellClick = (index: number) => {
    if (phase !== 'RUNNING') return;
    setActiveCursor(index);
    sound.playKeyClick();
    setCells((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isMarked: !updated[index].isMarked };
      return updated;
    });
  };

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        handleKeyAction(e.key.toLowerCase());
      } else if (phase === 'INSTRUCTIONS' && (e.key === ' ' || e.key === 'Enter')) {
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleKeyAction]);

  // Render dots in authentic RDSO patterns
  const renderDotCluster = (dotCount: 3 | 4 | 5, variant: number) => {
    if (dotCount === 3) {
      // 3 dots configurations
      return (
        <svg viewBox="0 0 40 40" className="w-6 h-6 sm:w-8 sm:h-8">
          {variant % 2 === 0 ? (
            <>
              <circle cx="20" cy="10" r="3.2" fill="#94a3b8" />
              <circle cx="10" cy="28" r="3.2" fill="#94a3b8" />
              <circle cx="30" cy="28" r="3.2" fill="#94a3b8" />
            </>
          ) : (
            <>
              <circle cx="10" cy="12" r="3.2" fill="#94a3b8" />
              <circle cx="20" cy="20" r="3.2" fill="#94a3b8" />
              <circle cx="30" cy="28" r="3.2" fill="#94a3b8" />
            </>
          )}
        </svg>
      );
    }

    if (dotCount === 4) {
      // 4 dots target configurations (square, diamond, kite, line)
      return (
        <svg viewBox="0 0 40 40" className="w-6 h-6 sm:w-8 sm:h-8">
          {variant === 0 ? (
            // Square (dice 4)
            <>
              <circle cx="11" cy="11" r="3.2" fill="#f8fafc" />
              <circle cx="29" cy="11" r="3.2" fill="#f8fafc" />
              <circle cx="11" cy="29" r="3.2" fill="#f8fafc" />
              <circle cx="29" cy="29" r="3.2" fill="#f8fafc" />
            </>
          ) : variant === 1 ? (
            // Diamond
            <>
              <circle cx="20" cy="8" r="3.2" fill="#f8fafc" />
              <circle cx="8" cy="20" r="3.2" fill="#f8fafc" />
              <circle cx="32" cy="20" r="3.2" fill="#f8fafc" />
              <circle cx="20" cy="32" r="3.2" fill="#f8fafc" />
            </>
          ) : variant === 2 ? (
            // Trapezoid / Slanted
            <>
              <circle cx="12" cy="10" r="3.2" fill="#f8fafc" />
              <circle cx="28" cy="10" r="3.2" fill="#f8fafc" />
              <circle cx="8" cy="30" r="3.2" fill="#f8fafc" />
              <circle cx="24" cy="30" r="3.2" fill="#f8fafc" />
            </>
          ) : (
            // Asymmetric 4
            <>
              <circle cx="10" cy="14" r="3.2" fill="#f8fafc" />
              <circle cx="28" cy="14" r="3.2" fill="#f8fafc" />
              <circle cx="19" cy="24" r="3.2" fill="#f8fafc" />
              <circle cx="28" cy="32" r="3.2" fill="#f8fafc" />
            </>
          )}
        </svg>
      );
    }

    // 5 dots configurations (dice 5, cross, star)
    return (
      <svg viewBox="0 0 40 40" className="w-6 h-6 sm:w-8 sm:h-8">
        <circle cx="10" cy="10" r="3.2" fill="#64748b" />
        <circle cx="30" cy="10" r="3.2" fill="#64748b" />
        <circle cx="20" cy="20" r="3.2" fill="#64748b" />
        <circle cx="10" cy="30" r="3.2" fill="#64748b" />
        <circle cx="30" cy="30" r="3.2" fill="#64748b" />
      </svg>
    );
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] justify-between bg-slate-950 text-slate-100 p-2 sm:p-4">
      {/* Top Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-slate-800 pb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Test</span>
        </button>

        <div className="text-center">
          <h2 className="text-sm sm:text-base font-bold text-cyan-400">Test 3: Concentration (4-Dots)</h2>
          <span className="text-[11px] text-slate-400">Mark Only 4-Dot Groups</span>
        </div>

        <div className="flex items-center gap-2">
          {phase === 'RUNNING' && (
            <div className="flex items-center gap-1.5 bg-red-950/40 text-red-400 border border-red-500/40 px-3 py-1 rounded-full font-mono font-bold text-xs sm:text-sm">
              <Timer className="w-3.5 h-3.5 animate-pulse" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          )}
          {phase === 'RUNNING' && (
            <button
              onClick={finishTest}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700"
            >
              Submit
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="flex-1 flex flex-col items-center justify-center py-2 sm:py-4 max-w-4xl mx-auto w-full overflow-hidden">
        {phase === 'INSTRUCTIONS' && (
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl text-center max-w-md w-full">
            <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-cyan-400">
              <Target className="w-8 h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Test of Concentration (4-Dots)</h3>
            <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
              Standard RDSO concentration scanning test:
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 mb-5 text-left text-xs sm:text-sm space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>Boxes contain <strong>3, 4, or 5 dots</strong> in various arrangements.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">↑</span>
                <span>Press <strong>UP Arrow (↑)</strong> to mark <strong>4-dots group</strong> (red slash).</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">→</span>
                <span>Press <strong>RIGHT Arrow (→)</strong> to move to next group.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-slate-400 font-bold">↓</span>
                <span>Press <strong>DOWN Arrow (↓)</strong> to unmark.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">📱</span>
                <span>On phones, you can also <strong>tap directly on any box</strong> to mark/unmark!</span>
              </p>
            </div>
            <button
              onClick={handleStart}
              className="w-full py-3.5 px-6 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 active:scale-95 transition-all text-white shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 text-base"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Concentration Test</span>
            </button>
          </div>
        )}

        {phase === 'RUNNING' && (
          <div className="w-full flex flex-col items-center">
            {/* The Concentration Matrix */}
            <div className="w-full max-w-xl bg-slate-900 border-2 border-slate-700 rounded-2xl p-2 sm:p-4 shadow-2xl overflow-x-auto">
              <div
                className="grid gap-1 sm:gap-1.5 mx-auto"
                style={{
                  gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
                }}
              >
                {cells.map((cell) => {
                  const isActive = cell.id === activeCursor;
                  return (
                    <button
                      key={cell.id}
                      type="button"
                      onClick={() => handleCellClick(cell.id)}
                      className={`relative aspect-square rounded-md sm:rounded-lg border flex items-center justify-center transition-all select-none p-0.5 ${
                        isActive
                          ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-400/80 scale-105 z-10'
                          : 'border-slate-800 bg-slate-950/80 hover:border-slate-600'
                      }`}
                    >
                      {/* Dots */}
                      {renderDotCluster(cell.dotCount, cell.patternVariant)}

                      {/* Red diagonal slash mark when marked (matching photo reference) */}
                      {cell.isMarked && (
                        <svg
                          viewBox="0 0 100 100"
                          className="absolute inset-0 w-full h-full pointer-events-none"
                        >
                          <line
                            x1="15"
                            y1="85"
                            x2="85"
                            y2="15"
                            stroke="#ef4444"
                            strokeWidth="14"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between w-full max-w-xl px-2 mt-2 text-[11px] text-slate-400">
              <span>Cell {activeCursor + 1} of {TOTAL_CELLS}</span>
              <span>Marked: <strong className="text-rose-400 font-mono">{cells.filter(c => c.isMarked).length}</strong></span>
              <span className="text-cyan-400 font-mono">Use ↑ or Tap to Mark</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Keypad Controller */}
      <div className="max-w-xl mx-auto w-full">
        <MobileKeypad testId="test3" onKeyPress={handleKeyAction} />
      </div>
    </div>
  );
};
