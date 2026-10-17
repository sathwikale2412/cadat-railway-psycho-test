import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TestResult } from '../../types/cadat';
import { generateTestResult } from '../../utils/scoring';
import { sound } from '../../utils/sound';
import { MobileKeypad } from '../MobileKeypad';
import { ArrowLeft, Play, Eye, CheckCircle2, XCircle } from 'lucide-react';

interface Test2Props {
  onComplete: (result: TestResult) => void;
  onExit: () => void;
  totalTrials?: number;
}

type ShapeType = 'ARROW' | 'NOTCH_BOX' | 'TRIANGLE_DOT' | 'SLANTED_LINE' | 'T_BAR';

interface QuestionItem {
  id: number;
  shapeType: ShapeType;
  baseVariation: number;
  differentIndex: number; // 0 to 4 (corresponding to keys 1 to 5)
  differentVariation: number;
}

export const Test2FormPerception: React.FC<Test2Props> = ({
  onComplete,
  onExit,
  totalTrials = 20,
}) => {
  const [phase, setPhase] = useState<'INSTRUCTIONS' | 'DISPLAY' | 'ANSWER_WINDOW' | 'FEEDBACK' | 'FINISHED'>('INSTRUCTIONS');
  const [currentTrial, setCurrentTrial] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem | null>(null);
  const [flashDurationMs, setFlashDurationMs] = useState<number>(450); // Fraction of second (350ms - 500ms)
  const [roundFeedback, setRoundFeedback] = useState<{
    success: boolean;
    chosen: number;
    correct: number;
    rtMs: number;
  } | null>(null);

  const [results, setResults] = useState<{
    trial: number;
    correct: boolean;
    reactionTimeMs: number;
    chosen: number;
    expected: number;
  }[]>([]);

  const trialStartTimeRef = useRef<number>(0);
  const flashTimeoutRef = useRef<number | null>(null);
  const testStartTimeRef = useRef<number>(Date.now());

  // Generate randomized question
  const generateQuestion = useCallback((trialNum: number): QuestionItem => {
    const shapeTypes: ShapeType[] = ['ARROW', 'NOTCH_BOX', 'TRIANGLE_DOT', 'SLANTED_LINE', 'T_BAR'];
    const chosenType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    const diffIndex = Math.floor(Math.random() * 5); // 0, 1, 2, 3, 4

    let baseVar = 0;
    let diffVar = 1;

    if (chosenType === 'ARROW') {
      // 0 = UP, 1 = DOWN, 2 = LEFT, 3 = RIGHT
      baseVar = Math.floor(Math.random() * 4);
      do {
        diffVar = Math.floor(Math.random() * 4);
      } while (diffVar === baseVar);
    } else if (chosenType === 'NOTCH_BOX') {
      // Notch on 0=Top, 1=Bottom, 2=Left, 3=Right
      baseVar = Math.floor(Math.random() * 4);
      diffVar = (baseVar + 2) % 4;
    } else if (chosenType === 'TRIANGLE_DOT') {
      // Dot in 0=Apex, 1=Bottom Left, 2=Bottom Right
      baseVar = Math.floor(Math.random() * 3);
      diffVar = (baseVar + 1) % 3;
    } else {
      baseVar = 0;
      diffVar = 1;
    }

    return {
      id: trialNum,
      shapeType: chosenType,
      baseVariation: baseVar,
      differentIndex: diffIndex,
      differentVariation: diffVar,
    };
  }, []);

  const startTrial = useCallback(
    (trialNum: number) => {
      const q = generateQuestion(trialNum);
      setCurrentQuestion(q);
      setRoundFeedback(null);
      setPhase('DISPLAY');
      trialStartTimeRef.current = performance.now();
      sound.playSignalCue(520);

      // Flash disappearance after fraction of second
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = window.setTimeout(() => {
        setPhase('ANSWER_WINDOW');
      }, flashDurationMs);
    },
    [generateQuestion, flashDurationMs]
  );

  const handleStart = () => {
    testStartTimeRef.current = Date.now();
    setCurrentTrial(1);
    setResults([]);
    startTrial(1);
  };

  const handleAnswer = useCallback(
    (keyInput: string) => {
      if (phase !== 'DISPLAY' && phase !== 'ANSWER_WINDOW') return;

      const num = parseInt(keyInput, 10);
      if (isNaN(num) || num < 1 || num > 5) return;

      const rt = Math.round(performance.now() - trialStartTimeRef.current);
      const chosenIndex = num - 1;
      const expectedIndex = currentQuestion?.differentIndex ?? 0;
      const isCorrect = chosenIndex === expectedIndex;

      if (isCorrect) {
        sound.playSuccess();
      } else {
        sound.playError();
      }

      setRoundFeedback({
        success: isCorrect,
        chosen: num,
        correct: expectedIndex + 1,
        rtMs: rt,
      });

      setResults((prev) => [
        ...prev,
        {
          trial: currentTrial,
          correct: isCorrect,
          reactionTimeMs: rt,
          chosen: num,
          expected: expectedIndex + 1,
        },
      ]);

      setPhase('FEEDBACK');

      setTimeout(() => {
        if (currentTrial >= totalTrials) {
          setPhase('FINISHED');
        } else {
          setCurrentTrial((c) => c + 1);
          startTrial(currentTrial + 1);
        }
      }, 1000);
    },
    [phase, currentQuestion, currentTrial, totalTrials, startTrial]
  );

  // Global keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        handleAnswer(e.key);
      } else if (phase === 'INSTRUCTIONS' && (e.key === ' ' || e.key === 'Enter')) {
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleAnswer]);

  // Finish test
  useEffect(() => {
    if (phase === 'FINISHED' && results.length > 0) {
      const correctCount = results.filter((r) => r.correct).length;
      const errorCount = results.length - correctCount;
      const avgRT = Math.round(results.reduce((acc, r) => acc + r.reactionTimeMs, 0) / results.length);
      const durationSec = Math.max(1, Math.round((Date.now() - testStartTimeRef.current) / 1000));
      const accuracyPct = Math.round((correctCount / results.length) * 100);

      const finalResult = generateTestResult(
        'test2',
        'Form Perception Test',
        durationSec,
        results.length,
        correctCount,
        errorCount,
        avgRT,
        accuracyPct, // Raw score is accuracy percentage
        {
          'Accuracy Rate': `${accuracyPct}%`,
          'Average Response Speed': `${avgRT} ms`,
          'Exposure Flash Time': `${flashDurationMs} ms`,
        }
      );

      onComplete(finalResult);
    }
  }, [phase, results, flashDurationMs, onComplete]);

  // Render SVG Shape helper
  const renderShape = (shapeType: ShapeType, variation: number) => {
    if (shapeType === 'ARROW') {
      // 0=UP, 1=DOWN, 2=LEFT, 3=RIGHT
      const rotation = variation === 0 ? 0 : variation === 1 ? 180 : variation === 2 ? 270 : 90;
      return (
        <svg
          viewBox="0 0 100 140"
          className="w-10 h-16 sm:w-14 sm:h-20 transition-transform duration-100"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <path
            d="M50 15 L85 65 L62 65 L62 125 L38 125 L38 65 L15 65 Z"
            fill="none"
            stroke="#f8fafc"
            strokeWidth="7"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    if (shapeType === 'NOTCH_BOX') {
      // 0=Top, 1=Bottom, 2=Left, 3=Right
      return (
        <svg viewBox="0 0 100 100" className="w-12 h-12 sm:w-16 sm:h-16">
          <rect x="15" y="15" width="70" height="70" fill="none" stroke="#f8fafc" strokeWidth="6" rx="4" />
          {variation === 0 && <path d="M40 15 L50 28 L60 15" fill="#0f172a" stroke="#38bdf8" strokeWidth="6" />}
          {variation === 1 && <path d="M40 85 L50 72 L60 85" fill="#0f172a" stroke="#38bdf8" strokeWidth="6" />}
          {variation === 2 && <path d="M15 40 L28 50 L15 60" fill="#0f172a" stroke="#38bdf8" strokeWidth="6" />}
          {variation === 3 && <path d="M85 40 L72 50 L85 60" fill="#0f172a" stroke="#38bdf8" strokeWidth="6" />}
        </svg>
      );
    }

    if (shapeType === 'TRIANGLE_DOT') {
      return (
        <svg viewBox="0 0 100 100" className="w-12 h-12 sm:w-16 sm:h-16">
          <polygon points="50,15 88,85 12,85" fill="none" stroke="#f8fafc" strokeWidth="6" strokeLinejoin="round" />
          {variation === 0 && <circle cx="50" cy="40" r="7" fill="#38bdf8" />}
          {variation === 1 && <circle cx="34" cy="72" r="7" fill="#38bdf8" />}
          {variation === 2 && <circle cx="66" cy="72" r="7" fill="#38bdf8" />}
        </svg>
      );
    }

    if (shapeType === 'SLANTED_LINE') {
      return (
        <svg viewBox="0 0 100 100" className="w-12 h-12 sm:w-16 sm:h-16">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#f8fafc" strokeWidth="5" />
          {variation === 0 ? (
            <line x1="28" y1="28" x2="72" y2="72" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" />
          ) : (
            <line x1="28" y1="72" x2="72" y2="28" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" />
          )}
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 100 100" className="w-12 h-12 sm:w-16 sm:h-16">
        <rect x="20" y="20" width="60" height="60" fill="none" stroke="#f8fafc" strokeWidth="6" />
        {variation === 0 ? (
          <line x1="20" y1="20" x2="80" y2="80" stroke="#38bdf8" strokeWidth="6" />
        ) : (
          <line x1="20" y1="80" x2="80" y2="20" stroke="#38bdf8" strokeWidth="6" />
        )}
      </svg>
    );
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
          <h2 className="text-sm sm:text-base font-bold text-cyan-400">Test 2: Form Perception</h2>
          <span className="text-[11px] text-slate-400">Identify The Different Figure</span>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/30">
            {Math.min(currentTrial, totalTrials)} / {totalTrials}
          </span>
        </div>
      </div>

      {/* Main Form Display Area */}
      <div className="flex-1 flex flex-col items-center justify-center py-3 sm:py-6 max-w-2xl mx-auto w-full">
        {phase === 'INSTRUCTIONS' && (
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl text-center max-w-md w-full">
            <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-cyan-400">
              <Eye className="w-8 h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Form Perception Test</h3>
            <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
              As tested in Indian Railways CADAT examination:
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 mb-5 text-left text-xs sm:text-sm space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>5 figures</strong> will appear for a fraction of a second.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>Four figures are identical; <strong>ONE figure is different</strong>.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>Identify the different figure number and immediately press <strong>1, 2, 3, 4, or 5</strong> on keyboard/keypad.</span>
              </p>
            </div>

            {/* Flash Speed Option */}
            <div className="mb-5 text-left">
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Flash Duration: {flashDurationMs} ms ({flashDurationMs < 400 ? 'Challenging' : 'Standard'})
              </label>
              <input
                type="range"
                min="250"
                max="800"
                step="50"
                value={flashDurationMs}
                onChange={(e) => setFlashDurationMs(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <button
              onClick={handleStart}
              className="w-full py-3.5 px-6 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 active:scale-95 transition-all text-white shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 text-base"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Begin Test (20 Questions)</span>
            </button>
          </div>
        )}

        {(phase === 'DISPLAY' || phase === 'ANSWER_WINDOW') && currentQuestion && (
          <div className="w-full max-w-xl mx-auto flex flex-col items-center">
            <div className="text-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {phase === 'DISPLAY' ? 'Observe Carefully!' : 'Select Different Figure (1 - 5)'}
              </span>
            </div>

            {/* 5 Figure Boxes Frame matching the photo */}
            <div className="w-full bg-slate-900 border-2 border-slate-600 rounded-2xl p-3 sm:p-5 shadow-2xl grid grid-cols-5 gap-2 sm:gap-3">
              {[0, 1, 2, 3, 4].map((index) => {
                const isDifferent = index === currentQuestion.differentIndex;
                const variation = isDifferent
                  ? currentQuestion.differentVariation
                  : currentQuestion.baseVariation;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleAnswer(String(index + 1))}
                    className="flex flex-col items-center justify-between p-2 sm:p-3 rounded-xl bg-slate-950 border border-slate-700/80 hover:border-cyan-400 active:scale-95 transition-all group min-h-[110px] sm:min-h-[140px]"
                  >
                    <div className="flex-1 flex items-center justify-center">
                      {phase === 'DISPLAY' ? (
                        renderShape(currentQuestion.shapeType, variation)
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-600 text-xs font-mono">
                          ?
                        </div>
                      )}
                    </div>
                    {/* Circle with number (1) (2) (3) (4) (5) */}
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-slate-500 bg-slate-900 text-slate-200 group-hover:border-cyan-400 group-hover:text-cyan-300 font-bold font-mono text-xs sm:text-sm flex items-center justify-center mt-2 shadow-sm">
                      {index + 1}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-400 text-center mt-3">
              Tap figure box or press key <span className="text-cyan-400 font-mono font-bold">1, 2, 3, 4, 5</span>
            </p>
          </div>
        )}

        {phase === 'FEEDBACK' && roundFeedback && (
          <div className="text-center animate-fade-in max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex justify-center mb-3">
              {roundFeedback.success ? (
                <div className="w-14 h-14 rounded-full bg-emerald-950/60 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-red-950/60 border-2 border-red-500 text-red-400 flex items-center justify-center">
                  <XCircle className="w-8 h-8" />
                </div>
              )}
            </div>

            <h4
              className={`text-lg font-bold mb-1 ${
                roundFeedback.success ? 'text-emerald-300' : 'text-red-400'
              }`}
            >
              {roundFeedback.success ? 'Correct Identification!' : 'Incorrect Choice'}
            </h4>

            <p className="text-xs text-slate-300">
              Odd figure was: <span className="font-bold text-cyan-400">Figure #{roundFeedback.correct}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Response Time: <span className="font-mono text-slate-200">{roundFeedback.rtMs} ms</span>
            </p>
          </div>
        )}
      </div>

      {/* Bottom Keypad Controller */}
      <div className="max-w-xl mx-auto w-full">
        <MobileKeypad testId="test2" onKeyPress={handleAnswer} />
      </div>
    </div>
  );
};
