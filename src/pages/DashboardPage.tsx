import React, { useState, useEffect } from 'react';
import {
  Zap,
  Globe,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Copy,
  Check,
  RefreshCw,
  TrendingUp,
  Brain,
  List,
  Clock,
  Activity,
  Layers,
} from 'lucide-react';
import { useBot } from '../context/BotContext';
import { BotShell } from '../components/BotShell';
import {
  LIVE_PAIRS,
  OTC_PAIRS,
  LIVE_TIMERS,
  FUTURE_TIMERS,
  generateSignal,
  formatTime,
} from '../services/botData';
import { SignalRecord } from '../types';

export const DashboardPage: React.FC = () => {
  const { addSignal, navigateTo } = useBot();

  const [market, setMarket] = useState<'OTC Markets' | 'Live Markets'>('OTC Markets');
  const [selectedPair, setSelectedPair] = useState<string>(OTC_PAIRS[0]);
  const [selectedTimer, setSelectedTimer] = useState<string>(LIVE_TIMERS[0]);
  const [signalMode, setSignalMode] = useState<'live' | 'future'>('live');
  const [futureEntryTime, setFutureEntryTime] = useState<string>('');

  const [state, setState] = useState<'idle' | 'loading' | 'result'>('idle');
  const [activeSignal, setActiveSignal] = useState<SignalRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [progressStep, setProgressStep] = useState(0);
  const [hasCopied, setHasCopied] = useState(false);

  const currentPairs = market === 'Live Markets' ? LIVE_PAIRS : OTC_PAIRS;
  const currentTimers = signalMode === 'live' ? LIVE_TIMERS : FUTURE_TIMERS;

  // Handle market switch
  const handleMarketChange = (newMarket: 'OTC Markets' | 'Live Markets') => {
    setMarket(newMarket);
    const newPairs = newMarket === 'Live Markets' ? LIVE_PAIRS : OTC_PAIRS;
    setSelectedPair(newPairs[0]);
  };

  // Handle mode switch
  const handleModeChange = (mode: 'live' | 'future') => {
    setSignalMode(mode);
    const newTimers = mode === 'live' ? LIVE_TIMERS : FUTURE_TIMERS;
    setSelectedTimer(newTimers[0]);
    if (mode === 'future' && !futureEntryTime) {
      const ahead = new Date(Date.now() + 5 * 60000);
      setFutureEntryTime(ahead.toISOString().slice(0, 16));
    }
  };

  // Analysis animation
  useEffect(() => {
    if (state !== 'loading') return;

    const interval = window.setInterval(() => {
      setProgressStep((prev) => Math.min(5, prev + 1));
    }, 800);

    const timer = window.setTimeout(() => {
      const sig = generateSignal(
        selectedPair,
        market,
        selectedTimer,
        signalMode,
        signalMode === 'future' ? futureEntryTime : undefined
      );
      setActiveSignal(sig);
      addSignal(sig);
      setState('result');
    }, 5000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timer);
    };
  }, [state, selectedPair, market, selectedTimer, signalMode, futureEntryTime]);

  const handleStartGeneration = () => {
    if (signalMode === 'future') {
      if (!futureEntryTime || new Date(futureEntryTime).getTime() <= Date.now()) {
        setErrorMessage('Select a valid future entry time.');
        return;
      }
    }
    setErrorMessage('');
    setHasCopied(false);
    setProgressStep(0);
    setState('loading');
  };

  const handleCopySignal = async () => {
    if (!activeSignal) return;
    const text = `${activeSignal.pair} ${activeSignal.direction} ${formatTime(activeSignal.entry)} ${activeSignal.timer}`;
    try {
      await navigator.clipboard.writeText(text);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      setErrorMessage('Could not copy signal to clipboard.');
    }
  };

  const analysisSteps = [
    'Scanning Market Data',
    'Analyzing Price Action',
    'Checking Market Trends',
    'Detecting Patterns',
    'Calculating Accuracy',
    'Finalizing Signal',
  ];

  return (
    <BotShell showDashboardHeader={true}>
      <section className="terminal">
        {state === 'idle' && (
          <>
            <h2 className="terminal-heading">
              GENERATE <span>SIGNALS</span>
            </h2>
            <p className="terminal-subtitle">AI Analyzed High Accuracy Trading Signals</p>

            {/* Mode buttons */}
            <div className="signal-modes">
              <button
                className="bot-button bot-button-outline"
                data-active={signalMode === 'live'}
                onClick={() => handleModeChange('live')}
              >
                <Zap size={14} />
                LIVE SIGNAL
              </button>
              <button
                className="bot-button bot-button-outline"
                data-active={signalMode === 'future'}
                onClick={() => handleModeChange('future')}
              >
                <Clock size={14} />
                FUTURE SIGNAL
              </button>
            </div>

            {/* Broker row */}
            <div className="selector-row">
              <span className="selector-icon">
                <img
                  src="/quotex-logo.png"
                  alt="Quotex"
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </span>
              <div className="selector-main">
                <label>BROKER</label>
                <select value="Quotex" disabled className="cursor-default">
                  <option value="Quotex">Quotex</option>
                </select>
              </div>
              <ChevronDown size={16} className="selector-chevron" />
            </div>

            {/* Market row */}
            <div className="selector-row">
              <span className="selector-icon">
                <Globe size={22} />
              </span>
              <div className="selector-main">
                <label>MARKET</label>
                <select
                  value={market}
                  onChange={(e) => handleMarketChange(e.target.value as 'OTC Markets' | 'Live Markets')}
                >
                  <option value="OTC Markets">OTC Markets</option>
                  <option value="Live Markets">Live Markets</option>
                </select>
              </div>
              <ChevronDown size={16} className="selector-chevron" />
            </div>

            {/* Pair row */}
            <div className="selector-row">
              <span className="selector-icon text-lg">💱</span>
              <div className="selector-main">
                <label>PAIR</label>
                <select value={selectedPair} onChange={(e) => setSelectedPair(e.target.value)}>
                  {currentPairs.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <ChevronDown size={16} className="selector-chevron" />
            </div>

            {/* Timer row */}
            <div className="selector-row">
              <span className="selector-icon">
                <Clock size={20} />
              </span>
              <div className="selector-main">
                <label>TIMER</label>
                <select value={selectedTimer} onChange={(e) => setSelectedTimer(e.target.value)}>
                  {currentTimers.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <ChevronDown size={16} className="selector-chevron" />
            </div>

            {/* Future datetime picker */}
            {signalMode === 'future' && (
              <div className="selector-row">
                <span className="selector-icon">
                  <Clock size={20} />
                </span>
                <div className="selector-main">
                  <label htmlFor="future-entry">ENTRY TIME</label>
                  <input
                    id="future-entry"
                    type="datetime-local"
                    value={futureEntryTime}
                    onChange={(e) => setFutureEntryTime(e.target.value)}
                    className="text-sm font-mono text-cyan-300"
                  />
                </div>
              </div>
            )}

            {errorMessage && (
              <p role="alert" className="text-danger text-xs font-bold mt-2">
                {errorMessage}
              </p>
            )}

            <button
              className="bot-button bot-button-neon generate-button flex items-center justify-center gap-2"
              onClick={handleStartGeneration}
            >
              <Zap size={17} />
              GENERATE {signalMode === 'future' ? 'FUTURE ' : ''}SIGNAL
            </button>

            {/* Metrics */}
            <div className="metrics">
              <div className="metric">
                <Brain />
                <small>AI ACCURACY</small>
                <strong>98.6%</strong>
              </div>
              <div className="metric">
                <TrendingUp />
                <small>SIGNAL STR.</small>
                <strong>98.7%</strong>
              </div>
              <div className="metric">
                <Clock />
                <small>AVG TIME</small>
                <strong>00:45</strong>
              </div>
              <div className="metric">
                <Activity />
                <small>TODAY</small>
                <strong>32</strong>
              </div>
            </div>
          </>
        )}

        {state === 'loading' && (
          <div className="loading-stage" role="status">
            <h2 className="terminal-heading">
              GENERATING <span>SIGNALS</span>
            </h2>
            <p className="terminal-subtitle">
              Please wait while our AI analyzes the market and finds the best opportunity...
            </p>

            <div className="analysis-ring">
              <Brain />
            </div>

            <strong className="tracking-widest uppercase">ANALYZING MARKET</strong>
            <p className="text-muted-foreground text-xs mt-2 font-mono">
              {analysisSteps[progressStep]}
            </p>

            <div className="progress-track">
              <div className="progress-fill" />
            </div>

            <p className="text-muted-foreground text-xs font-mono">Please wait...</p>
          </div>
        )}

        {state === 'result' && activeSignal && (
          <div>
            <div className="result-stage">
              <div className="result-side">
                <div>
                  <small>PAIR</small>
                  <strong>{activeSignal.pair}</strong>
                </div>
                <div>
                  <small>BROKER</small>
                  <strong>Quotex</strong>
                </div>
                <div>
                  <small>TIMER</small>
                  <strong>{activeSignal.timer}</strong>
                </div>
              </div>

              <div
                className={`direction-ring ${
                  activeSignal.direction === 'BUY' ? 'direction-buy' : 'direction-sell'
                }`}
              >
                {activeSignal.direction === 'BUY' ? (
                  <ArrowUp strokeWidth={4} />
                ) : (
                  <ArrowDown strokeWidth={4} />
                )}
                <strong>{activeSignal.direction === 'BUY' ? 'UP' : 'DOWN'}</strong>
                <small>STRONG {activeSignal.direction} SIGNAL</small>
              </div>

              <div className="result-side">
                <div>
                  <small>SIGNAL ID</small>
                  <strong>{activeSignal.id}</strong>
                </div>
                <div>
                  <small>ACCURACY</small>
                  <strong>98.6%</strong>
                </div>
                <div>
                  <small>EXECUTION</small>
                  <strong>{activeSignal.mode === 'future' ? 'FUTURE' : 'INSTANT'}</strong>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="result-details">
              <div>
                <small>ENTRY TIME</small>
                <strong>{formatTime(activeSignal.entry)}</strong>
              </div>
              <div>
                <small>EXPIRY TIME</small>
                <strong>{formatTime(activeSignal.expiry)}</strong>
              </div>
              <div>
                <small>SIGNAL STRENGTH</small>
                <strong>98.7%</strong>
              </div>
              <div>
                <small>AI CONFIDENCE</small>
                <strong>HIGH</strong>
              </div>
            </div>

            {/* Actions */}
            <div className="result-actions">
              <p>
                <Brain size={16} className="text-cyan-400" />
                <span>
                  AI Analysis Completed <span className="online" />
                </span>
              </p>

              <button
                className="bot-button bot-button-neon flex items-center gap-1.5"
                onClick={() => setState('idle')}
              >
                <RefreshCw size={14} />
                <span>NEW SIGNAL</span>
              </button>

              <button
                className="bot-button bot-button-ghost p-2 text-slate-300 hover:text-white"
                title="Copy signal"
                aria-label="Copy signal"
                onClick={handleCopySignal}
              >
                {hasCopied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Win rate panel */}
      {state === 'idle' && (
        <>
          <section className="win-panel">
            <h3>
              <Layers size={16} className="text-amber-400" />
              Win Rate
            </h3>
            <div className="win-grid">
              <div className="win-stat">
                <small>TODAY</small>
                <strong>92%</strong>
              </div>
              <div className="win-stat">
                <small>WEEK</small>
                <strong>89%</strong>
              </div>
              <div className="win-stat">
                <small>MONTH</small>
                <strong>87%</strong>
              </div>
            </div>
          </section>

          <button
            onClick={() => navigateTo('/future-signals')}
            className="link-row mt-3 w-full rounded-2xl bg-slate-900/60 border border-slate-800 p-3.5 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2.5">
              <List size={18} className="text-cyan-400" />
              <span className="font-bold text-xs uppercase tracking-wide">FUTURE SIGNAL LIST</span>
            </div>
            <ChevronDown size={16} className="text-slate-500 rotate-[-90deg]" />
          </button>
        </>
      )}

      <p className="signal-note">Simulated signals · Original bot display values · Not financial advice</p>
    </BotShell>
  );
};
