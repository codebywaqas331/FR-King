import React from 'react';
import { Trophy, TrendingUp, Award, BarChart3, Layers } from 'lucide-react';
import { BotShell } from '../components/BotShell';
import { getWinRateStats } from '../services/botData';

export const PerformancePage: React.FC = () => {
  const todayStr = new Date().toDateString();
  const weekly = getWinRateStats('weekly', todayStr);
  const monthly = getWinRateStats('monthly', todayStr);

  return (
    <BotShell>
      <section className="terminal">
        <h2 className="terminal-heading">
          BOT <span>PERFORMANCE</span>
        </h2>
        <p className="terminal-subtitle">AI engine accuracy across all markets</p>

        <div className="grid grid-cols-2 gap-2.5 my-2">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <Trophy size={18} className="mx-auto text-amber-400 mb-1" />
            <small className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wide">
              WEEKLY WINS
            </small>
            <strong className="text-xl font-bold font-mono text-white mt-0.5 block">
              {weekly.wins}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <TrendingUp size={18} className="mx-auto text-cyan-400 mb-1" />
            <small className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wide">
              WEEKLY RATE
            </small>
            <strong className="text-xl font-bold font-mono text-cyan-300 mt-0.5 block">
              {weekly.rate}%
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <Award size={18} className="mx-auto text-emerald-400 mb-1" />
            <small className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wide">
              MONTHLY WINS
            </small>
            <strong className="text-xl font-bold font-mono text-white mt-0.5 block">
              {monthly.wins}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <BarChart3 size={18} className="mx-auto text-indigo-400 mb-1" />
            <small className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wide">
              MONTHLY RATE
            </small>
            <strong className="text-xl font-bold font-mono text-indigo-300 mt-0.5 block">
              {monthly.rate}%
            </strong>
          </div>
        </div>
      </section>

      {/* Win rate summary panel */}
      <section className="win-panel mt-3">
        <h3>
          <Layers size={16} className="text-amber-400" />
          Market Win Rates
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

      <p className="signal-note">Simulated statistics · Original bot display values · Not financial advice</p>
    </BotShell>
  );
};
