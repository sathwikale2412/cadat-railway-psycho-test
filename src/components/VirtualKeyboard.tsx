import React from 'react';
import { sound } from '../utils/sound';

interface VirtualKeyboardProps {
  activeKeys?: string[];
  pressedKey?: string | null;
  onKeyPress: (key: string) => void;
  highlightKeys?: string[];
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  activeKeys = ['1', '2', '3', '4', '5', 'y', 'r', 'g', 'b', 'h', 'l', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'],
  pressedKey,
  onKeyPress,
  highlightKeys = [],
}) => {
  const isKeyActive = (key: string) => activeKeys.includes(key.toLowerCase());
  const isKeyHighlighted = (key: string) => highlightKeys.includes(key.toLowerCase());
  const isKeyPressed = (key: string) => pressedKey?.toLowerCase() === key.toLowerCase();

  const handleKeyClick = (key: string) => {
    sound.playKeyClick();
    onKeyPress(key);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2.5 sm:p-4 shadow-xl backdrop-blur-md max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-2 px-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <span>CADAT Railway Hardware Layout</span>
        <span className="text-cyan-400 font-mono">RDSO Standard</span>
      </div>

      {/* Row 1: Numbers */}
      <div className="flex justify-center gap-1.5 sm:gap-2 mb-2">
        {['1', '2', '3', '4', '5'].map((num) => {
          const active = isKeyActive(num);
          const highlighted = isKeyHighlighted(num);
          const pressed = isKeyPressed(num);

          return (
            <button
              key={num}
              type="button"
              disabled={!active}
              onClick={() => handleKeyClick(num)}
              className={`h-11 sm:h-14 flex-1 max-w-[70px] rounded-lg sm:rounded-xl font-bold font-mono text-base sm:text-xl flex flex-col items-center justify-center transition-all select-none border-2 ${
                pressed
                  ? 'bg-blue-500 text-white border-white scale-95 shadow-inner'
                  : highlighted
                  ? 'bg-blue-600/30 text-blue-200 border-blue-400 hover:bg-blue-600/40 animate-pulse'
                  : active
                  ? 'bg-slate-800 text-blue-300 border-blue-500/50 hover:border-blue-400 active:bg-blue-700 active:text-white'
                  : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-40'
              }`}
            >
              <span className="text-[10px] text-blue-400/80 leading-none">KEY</span>
              <span>{num}</span>
            </button>
          );
        })}
      </div>

      {/* Row 2: Color Keys (R, Y, G, B) & Functions */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2 mb-2">
        {/* Red Key */}
        <button
          type="button"
          disabled={!isKeyActive('r')}
          onClick={() => handleKeyClick('r')}
          className={`h-11 sm:h-14 rounded-lg sm:rounded-xl font-bold flex flex-col items-center justify-center transition-all border-2 ${
            isKeyPressed('r')
              ? 'bg-red-500 text-white border-white scale-95 shadow-inner'
              : isKeyHighlighted('r')
              ? 'bg-red-600 text-white border-red-300 ring-2 ring-red-400/50'
              : isKeyActive('r')
              ? 'bg-red-600/90 hover:bg-red-500 text-white border-red-400'
              : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-40'
          }`}
        >
          <span className="text-[9px] uppercase tracking-wider opacity-80">RED</span>
          <span className="text-base sm:text-lg font-mono">R</span>
        </button>

        {/* Yellow Key */}
        <button
          type="button"
          disabled={!isKeyActive('y')}
          onClick={() => handleKeyClick('y')}
          className={`h-11 sm:h-14 rounded-lg sm:rounded-xl font-bold flex flex-col items-center justify-center transition-all border-2 ${
            isKeyPressed('y')
              ? 'bg-yellow-400 text-black border-white scale-95 shadow-inner'
              : isKeyHighlighted('y')
              ? 'bg-yellow-400 text-black border-yellow-200 ring-2 ring-yellow-400/50'
              : isKeyActive('y')
              ? 'bg-yellow-400/90 hover:bg-yellow-300 text-black border-yellow-300'
              : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-40'
          }`}
        >
          <span className="text-[9px] uppercase tracking-wider opacity-80">YELLOW</span>
          <span className="text-base sm:text-lg font-mono">Y</span>
        </button>

        {/* Green Key */}
        <button
          type="button"
          disabled={!isKeyActive('g')}
          onClick={() => handleKeyClick('g')}
          className={`h-11 sm:h-14 rounded-lg sm:rounded-xl font-bold flex flex-col items-center justify-center transition-all border-2 ${
            isKeyPressed('g')
              ? 'bg-emerald-500 text-white border-white scale-95 shadow-inner'
              : isKeyHighlighted('g')
              ? 'bg-emerald-600 text-white border-emerald-300 ring-2 ring-emerald-400/50'
              : isKeyActive('g')
              ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-400'
              : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-40'
          }`}
        >
          <span className="text-[9px] uppercase tracking-wider opacity-80">GREEN</span>
          <span className="text-base sm:text-lg font-mono">G</span>
        </button>

        {/* Blue Key */}
        <button
          type="button"
          disabled={!isKeyActive('b')}
          onClick={() => handleKeyClick('b')}
          className={`h-11 sm:h-14 rounded-lg sm:rounded-xl font-bold flex flex-col items-center justify-center transition-all border-2 ${
            isKeyPressed('b')
              ? 'bg-blue-500 text-white border-white scale-95 shadow-inner'
              : isKeyHighlighted('b')
              ? 'bg-blue-600 text-white border-blue-300 ring-2 ring-blue-400/50'
              : isKeyActive('b')
              ? 'bg-blue-600/90 hover:bg-blue-500 text-white border-blue-400'
              : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-40'
          }`}
        >
          <span className="text-[9px] uppercase tracking-wider opacity-80">BLUE</span>
          <span className="text-base sm:text-lg font-mono">B</span>
        </button>

        {/* H Key */}
        <button
          type="button"
          disabled={!isKeyActive('h')}
          onClick={() => handleKeyClick('h')}
          className={`h-11 sm:h-14 rounded-lg sm:rounded-xl font-bold flex flex-col items-center justify-center transition-all border-2 ${
            isKeyPressed('h')
              ? 'bg-purple-600 text-white border-white scale-95 shadow-inner'
              : isKeyHighlighted('h')
              ? 'bg-purple-600 text-white border-purple-300 ring-2 ring-purple-400/50'
              : isKeyActive('h')
              ? 'bg-purple-800/90 hover:bg-purple-700 text-purple-100 border-purple-500'
              : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-40'
          }`}
        >
          <span className="text-[9px] uppercase tracking-wider opacity-80">START / SEQ</span>
          <span className="text-base sm:text-lg font-mono">H</span>
        </button>

        {/* L Key */}
        <button
          type="button"
          disabled={!isKeyActive('l')}
          onClick={() => handleKeyClick('l')}
          className={`h-11 sm:h-14 rounded-lg sm:rounded-xl font-bold flex flex-col items-center justify-center transition-all border-2 ${
            isKeyPressed('l')
              ? 'bg-indigo-600 text-white border-white scale-95 shadow-inner'
              : isKeyHighlighted('l')
              ? 'bg-indigo-600 text-white border-indigo-300 ring-2 ring-indigo-400/50'
              : isKeyActive('l')
              ? 'bg-indigo-800/90 hover:bg-indigo-700 text-indigo-100 border-indigo-500'
              : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-40'
          }`}
        >
          <span className="text-[9px] uppercase tracking-wider opacity-80">STOP / RESET</span>
          <span className="text-base sm:text-lg font-mono">L</span>
        </button>
      </div>

      {/* Row 3: Directional Arrow D-Pad */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        <button
          type="button"
          disabled={!isKeyActive('arrowleft')}
          onClick={() => handleKeyClick('arrowleft')}
          className={`h-10 sm:h-12 px-3 sm:px-5 rounded-lg sm:rounded-xl font-bold flex items-center justify-center gap-1 transition-all border-2 ${
            isKeyPressed('arrowleft')
              ? 'bg-cyan-500 text-white border-white scale-95 shadow-inner'
              : isKeyActive('arrowleft')
              ? 'bg-slate-800 text-slate-200 border-slate-600 hover:border-cyan-400'
              : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-40'
          }`}
        >
          <span className="text-lg">←</span>
          <span className="text-[10px] hidden sm:inline">PREV</span>
        </button>

        <div className="flex flex-col gap-1">
          <button
            type="button"
            disabled={!isKeyActive('arrowup')}
            onClick={() => handleKeyClick('arrowup')}
            className={`h-10 sm:h-12 px-3 sm:px-5 rounded-lg sm:rounded-xl font-bold flex items-center justify-center gap-1 transition-all border-2 ${
              isKeyPressed('arrowup')
                ? 'bg-red-500 text-white border-white scale-95 shadow-inner'
                : isKeyActive('arrowup')
                ? 'bg-slate-800 text-red-400 border-red-500/50 hover:border-red-400'
                : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-40'
            }`}
          >
            <span className="text-lg">↑</span>
            <span className="text-[10px] font-mono hidden sm:inline">MARK 4</span>
          </button>
          <button
            type="button"
            disabled={!isKeyActive('arrowdown')}
            onClick={() => handleKeyClick('arrowdown')}
            className={`h-10 sm:h-12 px-3 sm:px-5 rounded-lg sm:rounded-xl font-bold flex items-center justify-center gap-1 transition-all border-2 ${
              isKeyPressed('arrowdown')
                ? 'bg-slate-600 text-white border-white scale-95 shadow-inner'
                : isKeyActive('arrowdown')
                ? 'bg-slate-800 text-slate-400 border-slate-600 hover:border-slate-400'
                : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-40'
            }`}
          >
            <span className="text-lg">↓</span>
            <span className="text-[10px] hidden sm:inline">UNMARK</span>
          </button>
        </div>

        <button
          type="button"
          disabled={!isKeyActive('arrowright')}
          onClick={() => handleKeyClick('arrowright')}
          className={`h-10 sm:h-12 px-3 sm:px-5 rounded-lg sm:rounded-xl font-bold flex items-center justify-center gap-1 transition-all border-2 ${
            isKeyPressed('arrowright')
              ? 'bg-cyan-500 text-white border-white scale-95 shadow-inner'
              : isKeyActive('arrowright')
              ? 'bg-slate-800 text-slate-200 border-slate-600 hover:border-cyan-400'
              : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-40'
          }`}
        >
          <span className="text-lg">→</span>
          <span className="text-[10px] hidden sm:inline">NEXT</span>
        </button>
      </div>
    </div>
  );
};
