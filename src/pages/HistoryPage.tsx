import React from 'react';
import { ArrowUp, ArrowDown, Clock, Trash2 } from 'lucide-react';
import { useBot } from '../context/BotContext';
import { BotShell } from '../components/BotShell';
import { formatTime } from '../services/botData';

export const HistoryPage: React.FC = () => {
  const { signals, clearSignals } = useBot();

  const total = signals.length;
  // Calculate simulated win/loss stats for the current session
  const wins = signals.filter((_, idx) => idx % 4 !== 0).length;
  const losses = total - wins;

  return (
    <BotShell>
      <section className="terminal">
        <div className="flex items-center justify-between mb-2">
          <h2 className="terminal-heading flex-1 text-left">
            SIGNAL <span>HISTORY</span>
          </h2>
          {signals.length > 0 && (
            <button
              onClick={clearSignals}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
              title="Clear Session History"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>
        <p className="terminal-subtitle text-left">Real-time log of signals generated on this device</p>

        {/* Win/Loss Session Summary */}
        <div className="win-grid mb-3">
          <div className="win-stat">
            <small>WINS</small>
            <strong>{wins}</strong>
          </div>
          <div className="win-stat">
            <small>LOSSES</small>
            <strong>{losses}</strong>
          </div>
          <div className="win-stat">
            <small>TOTAL</small>
            <strong>{total}</strong>
          </div>
        </div>

        {signals.length === 0 ? (
          <div className="empty-state">
            <Clock size={24} className="mx-auto mb-2 text-slate-500" />
            <p>No signals generated yet in this session.</p>
            <p className="text-[11px] text-slate-500 mt-1">Go to Dashboard to generate your first signal.</p>
          </div>
        ) : (
          <ul className="history-list">
            {signals.map((sig) => (
              <li key={sig.id} className="history-item">
                <span className={`direction-dot ${sig.direction === 'BUY' ? 'buy' : 'sell'}`}>
                  {sig.direction === 'BUY' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
                </span>
                <div>
                  <strong>{sig.pair}</strong>
                  <small>
                    {sig.id} · {sig.timer} · {sig.mode.toUpperCase()}
                  </small>
                </div>
                <time>
                  <Clock size={11} />
                  {formatTime(sig.entry)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="signal-note">Session logs stored locally · Original bot simulation values</p>
    </BotShell>
  );
};
