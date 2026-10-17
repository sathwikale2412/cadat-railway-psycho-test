import React, { useState } from 'react';
import { CADAT_TESTS } from '../data/testsData';
import { TestId } from '../types/cadat';
import { X, BookOpen, Key, CheckCircle, Info } from 'lucide-react';

interface TestRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTestId?: TestId;
}

export const TestRulesModal: React.FC<TestRulesModalProps> = ({
  isOpen,
  onClose,
  initialTestId = 'test1',
}) => {
  const [selectedTestId, setSelectedTestId] = useState<TestId>(initialTestId);

  if (!isOpen) return null;

  const currentTest = CADAT_TESTS.find((t) => t.id === selectedTestId) || CADAT_TESTS[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl animate-fade-in text-slate-100 my-auto flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">CADAT Test Manual & Official Rules</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons for the 5 tests */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {CADAT_TESTS.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTestId(t.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all border ${
                selectedTestId === t.id
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              Test {t.number}: {t.shortName}
            </button>
          ))}
        </div>

        {/* Test Details Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs sm:text-sm">
          {/* Title & Description */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center font-mono text-xs">
                {currentTest.number}
              </span>
              <h4 className="text-base font-bold text-white">{currentTest.name}</h4>
            </div>
            <p className="text-slate-300 text-xs mt-1 leading-relaxed">{currentTest.description}</p>
          </div>

          {/* Keys Used */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
              <Key className="w-4 h-4" />
              <span>Keyboard / Keypad Inputs:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentTest.keysUsed.map((keyName) => (
                <span
                  key={keyName}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-indigo-700/50 text-indigo-200 font-mono text-xs font-semibold"
                >
                  {keyName}
                </span>
              ))}
            </div>
          </div>

          {/* Official RDSO Rules matching uploaded images */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-cyan-400 font-bold mb-2">
              <Info className="w-4 h-4" />
              <span>Official Test Instructions ({currentTest.instructionPhotoRef}):</span>
            </div>
            <ul className="space-y-2">
              {currentTest.rules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-300 text-xs sm:text-sm">
                  <CheckCircle className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cutoff Guidance */}
          <div className="bg-cyan-950/20 border border-cyan-800/40 rounded-xl p-3 text-xs text-cyan-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Indian Railways RDSO Qualifying Criteria:</strong>
              Candidate must score a standardized T-Score of at least <strong>42.0</strong> in every subtest to be declared psychotechnically fit for Assistant Loco Pilot (ALP), Station Master, or Train Operator.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 mt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all text-xs sm:text-sm"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
