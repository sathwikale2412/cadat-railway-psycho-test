import React, { useState, useEffect } from 'react';
import { CADAT_TESTS } from './data/testsData';
import { BatteryResult, TestId, TestResult } from './types/cadat';
import { RDSO_CUTOFF_T_SCORE } from './utils/scoring';
import { sound } from './utils/sound';
import {
  getStoredTestResults,
  getBestResultForTest,
  saveTestResult,
  saveBatteryResult,
  getStoredBatteries,
  clearAllHistory,
} from './utils/storage';

// Test Components
import { Test1ReactionTime } from './components/tests/Test1ReactionTime';
import { Test2FormPerception } from './components/tests/Test2FormPerception';
import { Test3Concentration } from './components/tests/Test3Concentration';
import { Test4SpeedPerception } from './components/tests/Test4SpeedPerception';
import { Test5SameColourSequence } from './components/tests/Test5SameColourSequence';

// Modals & UI Components
import { TestResultModal } from './components/TestResultModal';
import { BatteryReportModal } from './components/BatteryReportModal';
import { TestRulesModal } from './components/TestRulesModal';
import { VirtualKeyboard } from './components/VirtualKeyboard';

// Icons
import {
  Train,
  Zap,
  Target,
  Eye,
  Sliders,
  Volume2,
  VolumeX,
  Vibrate,
  Maximize2,
  Minimize2,
  BookOpen,
  Award,
  History,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Keyboard,
} from 'lucide-react';

export const App: React.FC = () => {
  // Navigation State
  const [activeTest, setActiveTest] = useState<TestId | null>(null);
  const [isBatteryMode, setIsBatteryMode] = useState<boolean>(false);
  const [batteryStepIndex, setBatteryStepIndex] = useState<number>(0);
  const [batteryResultsCollector, setBatteryResultsCollector] = useState<Record<TestId, TestResult>>({} as Record<TestId, TestResult>);

  // Modals
  const [currentResultModal, setCurrentResultModal] = useState<TestResult | null>(null);
  const [batteryReportModal, setBatteryReportModal] = useState<BatteryResult | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [rulesInitialTestId, setRulesInitialTestId] = useState<TestId>('test1');
  const [showKeyboardReplica, setShowKeyboardReplica] = useState<boolean>(false);

  // Settings
  const [soundOn, setSoundOn] = useState<boolean>(sound.isSoundEnabled());
  const [hapticsOn, setHapticsOn] = useState<boolean>(sound.isHapticsEnabled());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // History state
  const [recentTests, setRecentTests] = useState<TestResult[]>([]);
  const [recentBatteries, setRecentBatteries] = useState<BatteryResult[]>([]);

  // Refresh history
  const reloadHistory = () => {
    setRecentTests(getStoredTestResults());
    setRecentBatteries(getStoredBatteries());
  };

  useEffect(() => {
    reloadHistory();
  }, []);

  // Sound toggle
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    sound.setSoundEnabled(next);
    if (next) sound.playKeyClick();
  };

  // Haptics toggle
  const toggleHaptics = () => {
    const next = !hapticsOn;
    setHapticsOn(next);
    sound.setHapticsEnabled(next);
    if (next) sound.vibrate(50);
  };

  // Fullscreen toggle (very helpful on mobile browsers)
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Start single test drill
  const handleStartDrill = (testId: TestId) => {
    sound.playKeyClick();
    setIsBatteryMode(false);
    setActiveTest(testId);
  };

  // Start full CADAT mock battery
  const handleStartFullBattery = () => {
    sound.playKeyClick();
    setIsBatteryMode(true);
    setBatteryStepIndex(0);
    setBatteryResultsCollector({} as Record<TestId, TestResult>);
    setActiveTest('test1');
  };

  const handleTestComplete = (result: TestResult) => {
    saveTestResult(result);
    reloadHistory();

    if (isBatteryMode) {
      const updatedCollector = {
        ...batteryResultsCollector,
        [result.testId]: result,
      };
      setBatteryResultsCollector(updatedCollector);

      const batterySequence: TestId[] = ['test1', 'test2', 'test3', 'test4', 'test5'];
      const nextIndex = batteryStepIndex + 1;

      if (nextIndex < batterySequence.length) {
        // Show result for current test, with "Next Battery Test" button
        setCurrentResultModal(result);
      } else {
        // Battery completed! Compute overall battery score
        const allResults = Object.values(updatedCollector);
        const overallQualified = allResults.every((r) => r.tScore >= RDSO_CUTOFF_T_SCORE);
        const avgTScore = Math.round((allResults.reduce((sum, r) => sum + r.tScore, 0) / allResults.length) * 10) / 10;

        const batteryRecord: BatteryResult = {
          id: `cadat_mock_${Date.now()}`,
          timestamp: Date.now(),
          testResults: updatedCollector,
          overallQualified,
          averageTScore: avgTScore,
        };

        saveBatteryResult(batteryRecord);
        reloadHistory();
        setActiveTest(null);
        setCurrentResultModal(null);
        setBatteryReportModal(batteryRecord);
      }
    } else {
      // Single drill finished
      setCurrentResultModal(result);
    }
  };

  const handleNextBatteryStep = () => {
    const batterySequence: TestId[] = ['test1', 'test2', 'test3', 'test4', 'test5'];
    const nextIdx = batteryStepIndex + 1;
    setBatteryStepIndex(nextIdx);
    setCurrentResultModal(null);
    setActiveTest(batterySequence[nextIdx]);
  };

  const openRules = (testId: TestId = 'test1') => {
    setRulesInitialTestId(testId);
    setIsRulesModalOpen(true);
  };

  const handleExitCurrentTest = () => {
    sound.playKeyClick();
    setActiveTest(null);
    setIsBatteryMode(false);
  };

  // If a test is currently running, render that test screen
  if (activeTest) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
        {activeTest === 'test1' && (
          <Test1ReactionTime
            onComplete={handleTestComplete}
            onExit={handleExitCurrentTest}
            totalRounds={isBatteryMode ? 20 : 15}
          />
        )}
        {activeTest === 'test2' && (
          <Test2FormPerception
            onComplete={handleTestComplete}
            onExit={handleExitCurrentTest}
            totalTrials={isBatteryMode ? 25 : 20}
          />
        )}
        {activeTest === 'test3' && (
          <Test3Concentration
            onComplete={handleTestComplete}
            onExit={handleExitCurrentTest}
            durationSeconds={isBatteryMode ? 300 : 180}
          />
        )}
        {activeTest === 'test4' && (
          <Test4SpeedPerception
            onComplete={handleTestComplete}
            onExit={handleExitCurrentTest}
            totalTrials={isBatteryMode ? 15 : 12}
          />
        )}
        {activeTest === 'test5' && (
          <Test5SameColourSequence
            onComplete={handleTestComplete}
            onExit={handleExitCurrentTest}
            durationSeconds={isBatteryMode ? 120 : 90}
          />
        )}

        {/* Test Result Dialog */}
        {currentResultModal && (
          <TestResultModal
            result={currentResultModal}
            isBatteryMode={isBatteryMode}
            onRetry={() => {
              setCurrentResultModal(null);
              // Restart same test
            }}
            onHome={() => {
              setCurrentResultModal(null);
              setActiveTest(null);
              setIsBatteryMode(false);
            }}
            onNextTest={handleNextBatteryStep}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-600/30">
            <Train className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white">CADAT SIMULATOR</h1>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                RDSO ALP
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400">Railway Psycho Speed Test Practice</p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Rules Guide */}
          <button
            onClick={() => openRules('test1')}
            title="Official RDSO Rules"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Test Rules</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundOn ? 'Mute Audio' : 'Enable Audio'}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition-all"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Haptics Toggle (Mobile) */}
          <button
            onClick={toggleHaptics}
            title={hapticsOn ? 'Disable Vibration' : 'Enable Vibration'}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition-all"
          >
            <Vibrate className={`w-4 h-4 ${hapticsOn ? 'text-amber-400' : 'text-slate-500'}`} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-3 sm:p-6 space-y-6">
        {/* Hero Section: Full Battery Mock Test */}
        <section className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border-2 border-cyan-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-full opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full Exam Simulation</span>
            </div>

            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight mb-2">
              Indian Railways CADAT Battery Mock Test
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
              Simulate the complete 5-test psychotechnical battery for Assistant Loco Pilot (ALP), Station Master, and Train Operators. Complete all 5 sub-tests to verify your RDSO T-Scores (Benchmark cutoff ≥ 42.0).
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleStartFullBattery}
                className="py-3 px-6 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-2 text-sm sm:text-base"
              >
                <Zap className="w-5 h-5 fill-current" />
                <span>Launch Full 5-Test Mock Battery</span>
              </button>

              <button
                onClick={() => setShowKeyboardReplica(!showKeyboardReplica)}
                className="py-3 px-4 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition-all flex items-center gap-2 text-xs sm:text-sm"
              >
                <Keyboard className="w-4 h-4 text-cyan-400" />
                <span>{showKeyboardReplica ? 'Hide Hardware Layout' : 'View CADAT Keyboard'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Hardware Keyboard Layout Drawer (if toggled) */}
        {showKeyboardReplica && (
          <section className="animate-fade-in">
            <VirtualKeyboard onKeyPress={(k) => sound.playKeyClick()} />
          </section>
        )}

        {/* Mobile Practice Notice Banner */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Practicing on Smartphone or Tablet?</h4>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Every test features ergonomic thumb touch controls tailored for mobile screens, plus haptic vibration!
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 shrink-0">
            MOBILE READY
          </span>
        </section>

        {/* Individual Test Cards Section */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Individual Practice Drills</h3>
              <p className="text-xs text-slate-400">Drill specific CADAT tests to sharpen reaction speed and accuracy</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {CADAT_TESTS.map((test) => {
              const bestResult = getBestResultForTest(test.id);
              const isBestQual = bestResult && bestResult.tScore >= RDSO_CUTOFF_T_SCORE;

              return (
                <div
                  key={test.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all group"
                >
                  <div>
                    {/* Top Row: Number badge & Best Score */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-7 h-7 rounded-lg bg-cyan-600/20 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center border border-cyan-500/30">
                        {test.number}
                      </span>

                      {bestResult ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">Best T-Score:</span>
                          <span
                            className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                              isBestQual
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                                : 'bg-red-950/80 text-red-300 border-red-500/50'
                            }`}
                          >
                            {bestResult.tScore}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Not attempted</span>
                      )}
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-400 transition-colors mb-1.5">
                      {test.name}
                    </h4>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                      {test.description}
                    </p>

                    {/* Keys Used */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {test.keysUsed.map((k) => (
                        <span
                          key={k}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-slate-800"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => openRules(test.id)}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all text-xs"
                      title="View Rules"
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleStartDrill(test.id)}
                      className="flex-1 py-2.5 px-3 rounded-xl font-bold bg-cyan-600/90 hover:bg-cyan-500 text-white shadow-md active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5"
                    >
                      <span>Start Practice</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Attempts History */}
        {recentTests.length > 0 && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs sm:text-sm font-bold text-white">Recent Practice Attempts</h4>
              </div>
              <button
                onClick={() => {
                  if (confirm('Clear practice history?')) {
                    clearAllHistory();
                    reloadHistory();
                  }
                }}
                className="text-[11px] text-slate-400 hover:text-red-400 transition-colors"
              >
                Clear History
              </button>
            </div>

            <div className="divide-y divide-slate-800/80 overflow-hidden">
              {recentTests.slice(0, 6).map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-semibold text-white">{item.testName}</h5>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      Accuracy: {item.accuracyPercentage}% • RT: {item.averageReactionTimeMs}ms
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full border ${
                        item.tScore >= RDSO_CUTOFF_T_SCORE
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : 'bg-red-950/80 text-red-300 border-red-500/40'
                      }`}
                    >
                      T-Score: {item.tScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950/90 py-5 px-3 sm:px-6 text-center text-xs text-slate-400">
        <p className="font-medium text-slate-300">
          Indian Railways CADAT & RDSO Psycho Aptitude Simulator • Built for Assistant Loco Pilot (ALP), Station Master & Train Operators
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Designed for speed practice on smartphones, tablets, and laptops from anywhere with internet.
        </p>
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs">
          <span className="text-slate-400">Designed & Built by</span>
          <span className="font-bold text-cyan-400 px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-800/50">
            Ale Sathwik
          </span>
          <span className="text-slate-400">• CSE Student, Vignana Bharathi Institute of Technology (VBIT)</span>
        </div>
      </footer>

      {/* Test Rules Modal */}
      <TestRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        initialTestId={rulesInitialTestId}
      />

      {/* Full Battery Report Card Modal */}
      {batteryReportModal && (
        <BatteryReportModal
          battery={batteryReportModal}
          onRetake={handleStartFullBattery}
          onHome={() => setBatteryReportModal(null)}
        />
      )}
    </div>
  );
};

export default App;
