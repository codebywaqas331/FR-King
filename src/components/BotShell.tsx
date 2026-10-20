import React from 'react';
import {
  Brain,
  ChartNoAxesColumn,
  Crown,
  Ellipsis,
  Headphones,
  History,
  House,
  ShieldCheck,
  Users,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { useBot, RoutePath } from '../context/BotContext';
import { SUPPORT_INFO } from '../services/botData';

interface BotShellProps {
  children: React.ReactNode;
  showDashboardHeader?: boolean;
}

export const BotShell: React.FC<BotShellProps> = ({ children, showDashboardHeader = false }) => {
  const { currentRoute, navigateTo, setAuthSettingsOpen, activeLicense, isAdmin } = useBot();
  const logoClicksRef = React.useRef(0);
  const logoTimerRef = React.useRef<any>(null);

  const handleSecretTrigger = () => {
    logoClicksRef.current += 1;
    if (logoTimerRef.current) clearTimeout(logoTimerRef.current);
    logoTimerRef.current = setTimeout(() => {
      logoClicksRef.current = 0;
    }, 2500);

    if (logoClicksRef.current >= 5) {
      logoClicksRef.current = 0;
      navigateTo('/admin');
    }
  };

  const navItems: { route: RoutePath; label: string; icon: React.FC<{ size?: number }> }[] = [
    { route: '/dashboard', label: 'Dashboard', icon: House },
    { route: '/history', label: 'History', icon: History },
    { route: '/performance', label: 'Performance', icon: ChartNoAxesColumn },
    { route: '/support', label: 'Support', icon: Headphones },
    { route: '/more', label: 'More', icon: Ellipsis },
  ];

  return (
    <main className="bot-page">
      <div className="bot-shell">
        {/* Top utility bar */}
        <div className="flex items-center justify-between mb-3 px-1 text-xs">
          <div
            onClick={handleSecretTrigger}
            className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] select-none cursor-pointer"
            title="FR-KINGs Terminal"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>FR-KINGs TERMINAL</span>
          </div>

          {/* Admin shortcuts (Visible ONLY when admin is logged in) */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuthSettingsOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/60 transition-colors text-[11px] font-semibold"
                title="Change API Key & Auth Logic"
              >
                <KeyRound size={12} />
                <span>API Key & Auth</span>
              </button>
              <button
                onClick={() => navigateTo('/admin')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors text-[11px]"
                title="Admin Panel"
              >
                <ShieldAlert size={12} />
                <span>Admin</span>
              </button>
            </div>
          )}
        </div>

        {showDashboardHeader && (
          <>
            <header className="bot-header">
              <img
                className="bot-logo"
                src="/fr-kings-logo.jpg"
                alt="FR-KINGs logo"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <h1>FR-KINGs</h1>
                <div className="brand-subtitle">
                  AI BOT{' '}
                  <span className="tier-badge">
                    <Crown size={11} />
                    PRO MAX
                  </span>
                </div>
              </div>
            </header>

            {/* Status strip */}
            <div className="status-strip">
              <div className="status-item">
                <div className="status-icon">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <small>LICENSE STATUS</small>
                  <strong className="online">ACTIVE</strong>
                </div>
              </div>

              <div className="status-item">
                <div className="status-icon">
                  <Brain size={20} />
                </div>
                <div>
                  <small>AI ENGINE STATUS</small>
                  <strong className="online">ONLINE</strong>
                </div>
              </div>

              <div className="status-item">
                <div className="status-icon">
                  <Users size={20} />
                </div>
                <div>
                  <small>ACTIVE USERS</small>
                  <strong>1M+</strong>
                </div>
              </div>
            </div>

            {/* Unlocked banner */}
            <div className="unlocked">
              <Crown size={17} />
              PRO MAX UNLOCKED ✅
            </div>
          </>
        )}

        {children}

        <p className="dev-credit">Developer {SUPPORT_INFO.developer}</p>
      </div>

      {/* Fixed bottom navigation */}
      {activeLicense && (
        <nav className="bottom-nav" aria-label="Main navigation">
          {navItems.map(({ route, label, icon: Icon }) => {
            const isActive = currentRoute === route;
            return (
              <button
                key={route}
                onClick={() => navigateTo(route)}
                data-active={isActive}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </main>
  );
};
