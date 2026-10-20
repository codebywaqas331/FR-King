import React from 'react';
import { ArrowUp, ArrowDown, Clock, Zap, List } from 'lucide-react';
import { useBot } from '../context/BotContext';
import { BotShell } from '../components/BotShell';
import { formatTime } from '../services/botData';

export const FutureSignalsPage: React.FC = () => {
  const { signals, navigateTo } = useBot();

  const futureSignals = signals.filter((s) => s.mode === 'future');

  return (
    <BotShell>
      <section className="terminal">
        <h2 className="terminal-heading">
          FUTURE SIGNAL <span>LIST</span>
        </h2>
        <p className="terminal-subtitle">All your scheduled future signals in one place</p>

        {futureSignals.length === 0 ? (
          <div className="empty-state">
            <List size={28} className="mx-auto mb-2 text-slate-500" />
            <p className="text-muted-foreground text-xs">
              No future signals yet. Generate one from the dashboard.
            </p>
            <button
              onClick={() => navigateTo('/dashboard')}
              className="bot-button bot-button-neon flex items-center justify-center gap-2 mt-4 mx-auto"
            >
              <Zap size={15} />
              <span>Generate Future Signal</span>
            </button>
          </div>
        ) : (
          <ul className="history-list">
            {futureSignals.map((sig) => (
              <li key={sig.id} className="history-item">
                <span className={`direction-dot ${sig.direction === 'BUY' ? 'buy' : 'sell'}`}>
                  {sig.direction === 'BUY' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                </span>
                <div>
                  <strong>{sig.pair}</strong>
                  <small>
                    {sig.id} · {sig.timer}
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
    </BotShell>
  );
};
