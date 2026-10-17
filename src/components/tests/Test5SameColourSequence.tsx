import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TestResult } from '../../types/cadat';
import { generateTestResult } from '../../utils/scoring';
import { sound } from '../../utils/sound';
import { MobileKeypad } from '../MobileKeypad';
import { ArrowLeft, Play, Timer, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';

interface Test5Props {
  onComplete: (result: TestResult) => void;
  onExit: () => void;
  durationSeconds?: number;
}

type LightColor = 'red' | 'green' | 'yellow' | 'blue' | 'white';

interface BoardLight {
  id: number;
  x: number; // percentage 10 to 90
  y: number; // percentage 10 to 90
  color: LightColor;
  isBlinker: boolean;
}

export const Test5SameColourSequence: React.FC<Test5Props> = ({
  onComplete,
  onExit,
  durationSeconds = 90, // 90 seconds standard practice
}) => {
  const [phase, setPhase] = useState<'INSTRUCTIONS' | 'RUNNING' | 'FINISHED'>('INSTRUCTIONS');
  const [lights, setLights] = useState<BoardLight[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(durationSeconds);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Scoring
  const [fiveSameHits, setFiveSameHits] = useState(0);
  const [fiveSameMisses, setFiveSameMisses] = useState(0);
  const [fiveSameFalseAlarms, setFiveSameFalseAlarms] = useState(0);

  const [sequenceHits, setSequenceHits] = useState(0);
  const [sequenceMisses, setSequenceMisses] = useState(0);
  const [sequenceFalseAlarms, setSequenceFalseAlarms] = useState(0);

  // Tracking state refs
  const hasFiveSameRef = useRef<boolean>(false);
  const fiveSameActiveTargetColor = useRef<LightColor | null>(null);
  const fiveSameRespondedRef = useRef<boolean>(false);

  const blinkerHistoryRef = useRef<LightColor[]>([]);
  const sequenceActiveTargetRef = useRef<boolean>(false);
  const sequenceRespondedRef = useRef<boolean>(false);

  const timerIntervalRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<number | null>(null);
  const testStartTimeRef = useRef<number>(Date.now());

  // Fixed light positions on board
  const LIGHT_POSITIONS = [
    { x: 18, y: 16 },
    { x: 50, y: 14 },
    { x: 82, y: 18 },
    { x: 30, y: 38 },
    { x: 70, y: 36 },
    { x: 18, y: 62 },
    { x: 82, y: 65 },
    { x: 42, y: 72 },
    { x: 62, y: 84 },
    { x: 86, y: 86 },
    { x: 26, y: 88 },
  ];

  // Generate new board cycle
  const tickBoard = useCallback(() => {
    // Check if previous 5-same was missed
    if (hasFiveSameRef.current && !fiveSameRespondedRef.current) {
      setFiveSameMisses((m) => m + 1);
    }
    // Check if previous sequence was missed
    if (sequenceActiveTargetRef.current && !sequenceRespondedRef.current) {
      setSequenceMisses((m) => m + 1);
    }

    fiveSameRespondedRef.current = false;
    sequenceRespondedRef.current = false;

    // Decide if this frame will have 5 lights of the same color (~30% probability)
    const shouldSpawnFiveSame = Math.random() < 0.32;
    const colors: LightColor[] = ['red', 'green', 'yellow', 'blue', 'white'];
    const chosenSameColor: LightColor = ['red', 'green', 'yellow', 'blue'][Math.floor(Math.random() * 4)] as LightColor;

    hasFiveSameRef.current = shouldSpawnFiveSame;
    fiveSameActiveTargetColor.current = shouldSpawnFiveSame ? chosenSameColor : null;

    // Randomize which light is the designated Blinker
    const blinkerIndex = Math.floor(Math.random() * LIGHT_POSITIONS.length);

    // Blinker color sequence generation
    // Sequence rule: YELLOW -> RED -> GREEN
    const history = blinkerHistoryRef.current;
    let nextBlinkerColor: LightColor;

    const randSeq = Math.random();
    if (history.length >= 2 && history[history.length - 2] === 'yellow' && history[history.length - 1] === 'red') {
      // 50% chance to complete the target sequence with GREEN
      if (randSeq < 0.55) {
        nextBlinkerColor = 'green';
        sequenceActiveTargetRef.current = true;
      } else {
        nextBlinkerColor = 'blue';
        sequenceActiveTargetRef.current = false;
      }
    } else if (history.length >= 1 && history[history.length - 1] === 'yellow') {
      // 45% chance to transition into RED
      if (randSeq < 0.45) {
        nextBlinkerColor = 'red';
      } else {
        nextBlinkerColor = ['green', 'blue', 'white'][Math.floor(Math.random() * 3)] as LightColor;
      }
      sequenceActiveTargetRef.current = false;
    } else {
      // Randomly inject Yellow sometimes to start the sequence
      if (randSeq < 0.35) {
        nextBlinkerColor = 'yellow';
      } else {
        nextBlinkerColor = colors[Math.floor(Math.random() * colors.length)];
      }
      sequenceActiveTargetRef.current = false;
    }

    history.push(nextBlinkerColor);
    if (history.length > 5) history.shift();

    // Assign colors to all lights
    const newLights: BoardLight[] = LIGHT_POSITIONS.map((pos, idx) => {
      if (idx === blinkerIndex) {
        return {
          id: idx,
          x: pos.x,
          y: pos.y,
          color: nextBlinkerColor,
          isBlinker: true,
        };
      }
      return {
        id: idx,
        x: pos.x,
        y: pos.y,
        color: 'white',
        isBlinker: false,
      };
    });

    if (shouldSpawnFiveSame) {
      // Pick 5 distinct non-blinker indices to set to chosenSameColor
      const nonBlinkerIndices = newLights
        .map((_, i) => i)
        .filter((i) => i !== blinkerIndex)
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);

      nonBlinkerIndices.forEach((idx) => {
        newLights[idx].color = chosenSameColor;
      });

      // Fill remaining with other colors
      newLights.forEach((light, i) => {
        if (i !== blinkerIndex && !nonBlinkerIndices.includes(i)) {
          const otherColors = colors.filter((c) => c !== chosenSameColor);
          light.color = otherColors[Math.floor(Math.random() * otherColors.length)];
        }
      });
    } else {
      // Normal distribution where no color exceeds 4
      newLights.forEach((light, i) => {
        if (i !== blinkerIndex) {
          light.color = colors[Math.floor(Math.random() * colors.length)];
        }
      });
    }

    setLights(newLights);
  }, []);

  const handleStart = () => {
    blinkerHistoryRef.current = [];
    hasFiveSameRef.current = false;
    sequenceActiveTargetRef.current = false;
    setFiveSameHits(0);
    setFiveSameMisses(0);
    setFiveSameFalseAlarms(0);
    setSequenceHits(0);
    setSequenceMisses(0);
    setSequenceFalseAlarms(0);
    setTimeLeft(durationSeconds);
    testStartTimeRef.current = Date.now();
    setPhase('RUNNING');
    sound.playSignalCue(580);
    tickBoard();

    // Update board state every 1.8 seconds
    if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    updateIntervalRef.current = window.setInterval(tickBoard, 1900);
  };

  // Timer countdown
  useEffect(() => {
    if (phase !== 'RUNNING') return;

    timerIntervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
          finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    };
  }, [phase]);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 900);
  };

  // Handle Key Actions: 'L' for 5-Same, 'H' for Y-R-G Sequence
  const handleKeyAction = useCallback(
    (keyInput: string) => {
      if (phase !== 'RUNNING') return;
      const key = keyInput.toLowerCase();

      if (key === 'l') {
        // Checking for 5 lights of same color
        if (hasFiveSameRef.current && !fiveSameRespondedRef.current) {
          fiveSameRespondedRef.current = true;
          sound.playSuccess();
          setFiveSameHits((h) => h + 1);
          showToast('🎯 HIT: 5 Same Color Detected! (+1)', 'success');
        } else if (fiveSameRespondedRef.current) {
          // Already responded for this cycle
        } else {
          // False alarm!
          sound.playError();
          setFiveSameFalseAlarms((fa) => fa + 1);
          showToast('❌ False Alarm: No 5 same lights (-0.5)', 'error');
        }
      } else if (key === 'h') {
        // Checking for Yellow -> Red -> Green sequence
        if (sequenceActiveTargetRef.current && !sequenceRespondedRef.current) {
          sequenceRespondedRef.current = true;
          sound.playSuccess();
          setSequenceHits((h) => h + 1);
          showToast('⚡ HIT: Y → R → G Sequence Matched! (+1)', 'success');
        } else if (sequenceRespondedRef.current) {
          // Already responded
        } else {
          sound.playError();
          setSequenceFalseAlarms((fa) => fa + 1);
          showToast('❌ False Alarm: Incorrect Sequence (-0.5)', 'error');
        }
      }
    },
    [phase]
  );

  const finishTest = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    setPhase('FINISHED');
  }, []);

  // Compute final score
  useEffect(() => {
    if (phase === 'FINISHED') {
      const totalHits = fiveSameHits + sequenceHits;
      const totalFalseAlarms = fiveSameFalseAlarms + sequenceFalseAlarms;
      const totalMisses = fiveSameMisses + sequenceMisses;
      const totalTargetEvents = totalHits + totalMisses;

      // Net score calculation
      const rawNetScore = Math.max(0, Math.round((totalHits - totalFalseAlarms * 0.5) * 10) / 10);
      const accuracyPct = totalTargetEvents > 0 ? Math.round((totalHits / totalTargetEvents) * 100) : 0;
      const durationSec = durationSeconds - timeLeft;

      const finalResult = generateTestResult(
        'test5',
        'Same Colour & Sequence Test',
        durationSec,
        totalTargetEvents,
        totalHits,
        totalFalseAlarms,
        1400, // Avg scan period
        accuracyPct, // Raw score metric is vigilance accuracy %
        {
          '5-Same Hits': fiveSameHits,
          'Sequence (Y-R-G) Hits': sequenceHits,
          'Missed Events': totalMisses,
          'False Alarms': totalFalseAlarms,
          'Vigilance Accuracy': `${accuracyPct}%`,
          'Net Vigilance Score': rawNetScore,
        },
        totalMisses
      );

      onComplete(finalResult);
    }
  }, [
    phase,
    fiveSameHits,
    sequenceHits,
    fiveSameFalseAlarms,
    sequenceFalseAlarms,
    fiveSameMisses,
    sequenceMisses,
    durationSeconds,
    timeLeft,
    onComplete,
  ]);

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h' || e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handleKeyAction(e.key.toLowerCase());
      } else if (phase === 'INSTRUCTIONS' && (e.key === ' ' || e.key === 'Enter')) {
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleKeyAction]);

  const getColorHex = (color: LightColor) => {
    switch (color) {
      case 'red':
        return '#ef4444';
      case 'green':
        return '#22c55e';
      case 'yellow':
        return '#eab308';
      case 'blue':
        return '#3b82f6';
      case 'white':
        return '#f8fafc';
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

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
          <h2 className="text-sm sm:text-base font-bold text-cyan-400">Test 5: Same Colour & Sequence</h2>
          <span className="text-[11px] text-slate-400">Divided Attention Monitoring</span>
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
              Finish
            </button>
          )}
        </div>
      </div>

      {/* Main Signal Display Area */}
      <div className="flex-1 flex flex-col items-center justify-center py-2 sm:py-4 max-w-xl mx-auto w-full">
        {phase === 'INSTRUCTIONS' && (
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl text-center max-w-md w-full">
            <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-cyan-400">
              <Eye className="w-8 h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Same Colour & Sequence Test</h3>
            <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
              Based on official CADAT RDSO Photo instructions:
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 mb-5 text-left text-xs sm:text-sm space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">1.</span>
                <div>
                  <strong className="text-indigo-400">Five Lights of Same Colour:</strong>
                  <p className="text-slate-300 text-xs">If any 5 lights on screen have the same colour, immediately press <strong className="text-indigo-400">L</strong>.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">2.</span>
                <div>
                  <strong className="text-amber-400">Blinking Light Sequence:</strong>
                  <p className="text-slate-300 text-xs">Observe the blinking light. If it cycles in the order <strong className="text-yellow-400">Yellow</strong> → <strong className="text-red-400">Red</strong> → <strong className="text-emerald-400">Green</strong>, immediately press <strong className="text-amber-400">H</strong>!</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleStart}
              className="w-full py-3.5 px-6 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 active:scale-95 transition-all text-white shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 text-base"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Test (90s Practice)</span>
            </button>
          </div>
        )}

        {phase === 'RUNNING' && (
          <div className="w-full flex flex-col items-center">
            {/* Realtime Toast Feedback */}
            <div className="h-7 mb-2 flex items-center justify-center">
              {toastMessage && (
                <div
                  className={`text-xs font-bold px-3 py-1 rounded-full border animate-fade-in ${
                    toastMessage.type === 'success'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500'
                      : 'bg-red-950/80 text-red-300 border-red-500'
                  }`}
                >
                  {toastMessage.text}
                </div>
              )}
            </div>

            {/* The Light Board Frame matching the reference photo */}
            <div className="w-full aspect-square max-w-[340px] sm:max-w-[400px] bg-slate-900 border-4 border-slate-600 rounded-2xl shadow-2xl relative p-4 overflow-hidden">
              {/* Grid / Circuit lines backdrop */}
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]" />

              {/* Scattered colored lights */}
              {lights.map((light) => {
                const isBlinker = light.isBlinker;
                const hex = getColorHex(light.color);

                return (
                  <div
                    key={light.id}
                    className={`absolute rounded-full transition-all duration-300 flex items-center justify-center ${
                      isBlinker ? 'ring-4 ring-white/60 animate-pulse z-10' : ''
                    }`}
                    style={{
                      left: `${light.x}%`,
                      top: `${light.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: isBlinker ? '28px' : '24px',
                      height: isBlinker ? '28px' : '24px',
                      backgroundColor: hex,
                      boxShadow: `0 0 12px ${hex}80, inset 0 2px 4px rgba(255,255,255,0.4)`,
                      border: '2px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    {isBlinker && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Helper Reminders */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-[360px] mt-3">
              <div className="bg-slate-900/80 border border-indigo-700/50 rounded-xl p-2 text-center text-[11px]">
                <span className="text-indigo-300 font-bold block">Press L</span>
                <span className="text-slate-400">If 5 lights of same color</span>
              </div>
              <div className="bg-slate-900/80 border border-amber-600/50 rounded-xl p-2 text-center text-[11px]">
                <span className="text-amber-300 font-bold block">Press H</span>
                <span className="text-slate-400">If sequence: Y → R → G</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Keypad Controller */}
      <div className="max-w-xl mx-auto w-full">
        <MobileKeypad testId="test5" onKeyPress={handleKeyAction} />
      </div>
    </div>
  );
};
