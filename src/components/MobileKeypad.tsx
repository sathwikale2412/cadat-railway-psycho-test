import React from 'react';
import { TestId } from '../types/cadat';
import { sound } from '../utils/sound';

interface MobileKeypadProps {
  testId: TestId;
  onKeyPress: (key: string) => void;
  activeState?: {
    isWaitingForL?: boolean;
    isArmed?: boolean;
    currentColor?: string | null;
  };
}

export const MobileKeypad: React.FC<MobileKeypadProps> = ({
  testId,
  onKeyPress,
  activeState,
}) => {
  const triggerKey = (key: string) => {
    sound.playKeyClick();
    onKeyPress(key);
  };

  return (
    <div className="w-full bg-slate-900/95 border-t border-slate-800 p-2 sm:p-3 pb-safe select-none shadow-2xl backdrop-blur-md">
      {/* Test 1 Layout: Reaction Time (L key + Yellow, Red, Green) */}
      {testId === 'test1' && (
        <div className="flex items-stretch justify-between gap-2 max-w-lg mx-auto">
          {/* L Key Trigger */}
          <button
            type="button"
            onClick={() => triggerKey('l')}
            className={`flex-1 h-20 sm:h-24 rounded-2xl font-bold flex flex-col items-center justify-center border-2 transition-all active:scale-95 ${
              activeState?.isWaitingForL
                ? 'bg-indigo-600 text-white border-indigo-300 ring-4 ring-indigo-500/50 animate-pulse'
                : 'bg-slate-800 text-indigo-300 border-indigo-700/60 active:bg-indigo-900'
            }`}
          >
            <span className="text-2xl sm:text-3xl font-mono">L</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200 mt-1">
              {activeState?.isWaitingForL ? 'TAP L NOW!' : 'ARM / STOP (L)'}
            </span>
          </button>

          {/* Color Keys */}
          <div className="flex-1 grid grid-cols-3 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => triggerKey('y')}
              className="h-20 sm:h-24 rounded-2xl font-bold bg-amber-400 active:bg-amber-300 text-slate-950 border-2 border-amber-300 flex flex-col items-center justify-center shadow-lg active:scale-95"
            >
              <div className="w-5 h-5 rounded-full bg-amber-300 border border-black/20 mb-1" />
              <span className="text-lg font-mono">Y</span>
              <span className="text-[10px] uppercase font-bold">Yellow</span>
            </button>

            <button
              type="button"
              onClick={() => triggerKey('r')}
              className="h-20 sm:h-24 rounded-2xl font-bold bg-red-600 active:bg-red-500 text-white border-2 border-red-400 flex flex-col items-center justify-center shadow-lg active:scale-95"
            >
              <div className="w-5 h-5 rounded-full bg-red-400 border border-white/40 mb-1" />
              <span className="text-lg font-mono">R</span>
              <span className="text-[10px] uppercase font-bold">Red</span>
            </button>

            <button
              type="button"
              onClick={() => triggerKey('g')}
              className="h-20 sm:h-24 rounded-2xl font-bold bg-emerald-600 active:bg-emerald-500 text-white border-2 border-emerald-400 flex flex-col items-center justify-center shadow-lg active:scale-95"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-400 border border-white/40 mb-1" />
              <span className="text-lg font-mono">G</span>
              <span className="text-[10px] uppercase font-bold">Green</span>
            </button>
          </div>
        </div>
      )}

      {/* Test 2 Layout: Numbers 1 to 5 */}
      {testId === 'test2' && (
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 max-w-lg mx-auto">
          {['1', '2', '3', '4', '5'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => triggerKey(num)}
              className="flex-1 h-18 sm:h-20 py-2 rounded-2xl font-bold font-mono text-xl sm:text-2xl bg-slate-800 text-cyan-300 border-2 border-cyan-600/50 hover:border-cyan-400 active:bg-cyan-600 active:text-white transition-all active:scale-95 shadow-md flex flex-col items-center justify-center"
            >
              <span className="text-[10px] text-slate-400 leading-none">FIG</span>
              <span>{num}</span>
            </button>
          ))}
        </div>
      )}

      {/* Test 3 Layout: Concentration 4-Dots D-Pad */}
      {testId === 'test3' && (
        <div className="flex items-center justify-around gap-2 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => triggerKey('arrowleft')}
            className="flex-1 h-16 sm:h-20 rounded-2xl font-bold bg-slate-800 text-slate-200 border-2 border-slate-700 active:bg-slate-700 active:scale-95 flex flex-col items-center justify-center"
          >
            <span className="text-2xl">←</span>
            <span className="text-[10px] text-slate-400">PREV</span>
          </button>

          <button
            type="button"
            onClick={() => triggerKey('arrowup')}
            className="flex-[1.4] h-18 sm:h-22 rounded-2xl font-bold bg-rose-600 text-white border-2 border-rose-400 active:bg-rose-500 active:scale-95 shadow-lg shadow-rose-900/30 flex flex-col items-center justify-center"
          >
            <span className="text-2xl sm:text-3xl">↑</span>
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">MARK 4 DOTS</span>
          </button>

          <button
            type="button"
            onClick={() => triggerKey('arrowdown')}
            className="flex-1 h-16 sm:h-20 rounded-2xl font-bold bg-slate-800 text-slate-300 border-2 border-slate-700 active:bg-slate-700 active:scale-95 flex flex-col items-center justify-center"
          >
            <span className="text-2xl">↓</span>
            <span className="text-[10px] text-slate-400">UNMARK</span>
          </button>

          <button
            type="button"
            onClick={() => triggerKey('arrowright')}
            className="flex-1 h-16 sm:h-20 rounded-2xl font-bold bg-cyan-600 text-white border-2 border-cyan-400 active:bg-cyan-500 active:scale-95 shadow-md flex flex-col items-center justify-center"
          >
            <span className="text-2xl">→</span>
            <span className="text-[10px] text-cyan-200">NEXT</span>
          </button>
        </div>
      )}

      {/* Test 4 Layout: Speed Perception (H = Start, L = Stop) */}
      {testId === 'test4' && (
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => triggerKey('h')}
            className="flex-1 h-20 sm:h-24 rounded-2xl font-bold bg-purple-700 text-white border-2 border-purple-400 active:bg-purple-600 active:scale-95 shadow-lg flex flex-col items-center justify-center"
          >
            <span className="text-2xl sm:text-3xl font-mono">H</span>
            <span className="text-xs uppercase font-extrabold tracking-wide mt-1">START LOCO</span>
            <span className="text-[10px] text-purple-200">Press H</span>
          </button>

          <button
            type="button"
            onClick={() => triggerKey('l')}
            className="flex-1 h-20 sm:h-24 rounded-2xl font-bold bg-emerald-600 text-white border-2 border-emerald-300 active:bg-emerald-500 active:scale-95 shadow-lg flex flex-col items-center justify-center"
          >
            <span className="text-2xl sm:text-3xl font-mono">L</span>
            <span className="text-xs uppercase font-extrabold tracking-wide mt-1">STOP AT EXIT</span>
            <span className="text-[10px] text-emerald-200">Press L</span>
          </button>
        </div>
      )}

      {/* Test 5 Layout: Same Color & Sequence (H = Seq Y-R-G, L = 5 Same) */}
      {testId === 'test5' && (
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => triggerKey('h')}
            className="flex-1 h-20 sm:h-24 rounded-2xl font-bold bg-amber-500 text-slate-950 border-2 border-amber-300 active:bg-amber-400 active:scale-95 shadow-lg flex flex-col items-center justify-center"
          >
            <div className="flex items-center gap-1 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 border border-black/40"></span>
              <span className="text-xs font-bold">→</span>
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-black/40"></span>
              <span className="text-xs font-bold">→</span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-black/40"></span>
            </div>
            <span className="text-xl sm:text-2xl font-mono">H</span>
            <span className="text-[11px] font-bold uppercase tracking-tight">SEQUENCE MATCH</span>
          </button>

          <button
            type="button"
            onClick={() => triggerKey('l')}
            className="flex-1 h-20 sm:h-24 rounded-2xl font-bold bg-indigo-600 text-white border-2 border-indigo-300 active:bg-indigo-500 active:scale-95 shadow-lg flex flex-col items-center justify-center"
          >
            <div className="flex items-center gap-0.5 mb-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="w-2.5 h-2.5 rounded-full bg-white/90"></span>
              ))}
            </div>
            <span className="text-xl sm:text-2xl font-mono">L</span>
            <span className="text-[11px] font-bold uppercase tracking-tight">5 SAME COLOUR</span>
          </button>
        </div>
      )}
    </div>
  );
};
