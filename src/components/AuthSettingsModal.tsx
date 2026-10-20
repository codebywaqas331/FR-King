import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Database,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Save,
  RefreshCw,
  Sliders,
  Mail,
  Send,
} from 'lucide-react';
import { useBot } from '../context/BotContext';
import { updateAppConfig, resetAdminPassword } from '../services/authService';

export const AuthSettingsModal: React.FC = () => {
  const { isAuthSettingsOpen, setAuthSettingsOpen, appConfig, refreshConfig, activateKey } = useBot();

  const [apiKey, setApiKey] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('emailwaqas7@gmail.com');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [authMode, setAuthMode] = useState<'local' | 'api_key_only' | 'supabase_sync'>('local');
  const [allowBypass, setAllowBypass] = useState(true);

  const [verifyAdminPass, setVerifyAdminPass] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (appConfig) {
      setApiKey(appConfig.apiKey || '');
      setRecoveryEmail(appConfig.recoveryEmail || 'emailwaqas7@gmail.com');
      setSupabaseUrl(appConfig.supabaseUrl || '');
      setSupabaseAnonKey(appConfig.supabaseAnonKey || '');
      setAuthMode(appConfig.authMode || 'local');
      setAllowBypass(appConfig.allowMasterApiKeyBypass ?? true);
      const stored = sessionStorage.getItem('frk_admin');
      if (stored) setVerifyAdminPass(stored);
      else setVerifyAdminPass('FR@King355249');
    }
  }, [appConfig, isAuthSettingsOpen]);

  if (!isAuthSettingsOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyAdminPass) {
      setStatusMessage({ type: 'error', text: 'Enter your Admin Password to authorize changes.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const res = await updateAppConfig(verifyAdminPass, {
      apiKey,
      adminPassword: adminPassword.trim() ? adminPassword.trim() : undefined,
      supabaseUrl,
      supabaseAnonKey,
      authMode,
      allowMasterApiKeyBypass: allowBypass,
    });

    setIsSaving(false);

    if (res.ok) {
      setStatusMessage({ type: 'success', text: 'API Key & Authentication logic updated successfully!' });
      if (adminPassword.trim()) {
        sessionStorage.setItem('frk_admin', adminPassword.trim());
      }
      await refreshConfig();
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to update settings. Check password.' });
    }
  };

  const handleTestSupabase = async () => {
    if (!supabaseUrl) {
      setSupabaseTestResult('Please enter a Supabase URL first.');
      return;
    }
    setIsTestingSupabase(true);
    setSupabaseTestResult(null);

    try {
      const res = await fetch('/api/supabase/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: supabaseUrl, key: supabaseAnonKey }),
      });
      const data = await res.json();
      if (data.ok) {
        setSupabaseTestResult(
          `✅ ${data.message} ${data.tableStatus ? `(${data.tableStatus})` : ''}`
        );
      } else {
        setSupabaseTestResult(`❌ ${data.error || data.message || 'Connection failed'}`);
      }
    } catch {
      setSupabaseTestResult('Connection failed. Verify network reachability.');
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleUseApiKeyAsLicense = () => {
    if (apiKey.trim()) {
      activateKey(apiKey.trim(), {
        license_key: apiKey.trim(),
        duration_label: 'Master API Key',
        lifetime: true,
      });
      setAuthSettingsOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#121620] border border-cyan-500/40 rounded-2xl shadow-2xl p-6 text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                API Key & Auth Configuration
              </h2>
              <p className="text-xs text-slate-400">Customize API keys, Supabase, and authentication logic</p>
            </div>
          </div>
          <button
            onClick={() => setAuthSettingsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
          {/* Master API Key section */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wide">
                <KeyRound size={13} />
                Master API Key
              </label>
              <button
                type="button"
                onClick={handleUseApiKeyAsLicense}
                className="text-[11px] text-cyan-300 underline hover:text-cyan-200"
              >
                Use as Active License
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Any user entering this API key on the activation page receives instant unlocked access.
            </p>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="e.g. FRK-PRO-MASTER-KEY-2026"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-400 tracking-wider"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="bypassCheck"
                checked={allowBypass}
                onChange={(e) => setAllowBypass(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <label htmlFor="bypassCheck" className="text-[11px] text-slate-300 cursor-pointer">
                Allow default demo bypass key (<span className="font-mono text-cyan-400">FRK-PRO-MASTER-KEY-2026</span>)
              </label>
            </div>
          </div>

          {/* Authentication Logic Selector */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
            <label className="font-semibold text-white flex items-center gap-1.5 uppercase tracking-wide mb-1.5">
              <Sliders size={13} className="text-cyan-400" />
              Authentication Logic Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setAuthMode('local')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  authMode === 'local'
                    ? 'border-cyan-500 bg-cyan-950/60 text-white font-bold shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] font-bold">Local Device-Locked</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Admin approval + device binding</div>
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('api_key_only')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  authMode === 'api_key_only'
                    ? 'border-cyan-500 bg-cyan-950/60 text-white font-bold shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] font-bold">API Key Only</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Direct API key verification</div>
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('supabase_sync')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  authMode === 'supabase_sync'
                    ? 'border-cyan-500 bg-cyan-950/60 text-white font-bold shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] font-bold">Supabase Cloud</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Sync with external Supabase</div>
              </button>
            </div>
          </div>

          {/* Supabase settings */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-white flex items-center gap-1.5 uppercase tracking-wide">
                <Database size={13} className="text-cyan-400" />
                Supabase Credentials (Optional)
              </label>
              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={isTestingSupabase}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-cyan-400 hover:bg-slate-700 text-[11px]"
              >
                <RefreshCw size={10} className={isTestingSupabase ? 'animate-spin' : ''} />
                <span>Test Connection</span>
              </button>
            </div>

            <div>
              <label className="text-[10px] text-slate-400">SUPABASE URL</label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full mt-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400">SUPABASE PUBLISHABLE / ANON API KEY</label>
              <input
                type="text"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                placeholder="sb_publishable_... or eyJhbGciOi..."
                className="w-full mt-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            {supabaseTestResult && (
              <p className="text-[11px] text-amber-300 font-mono mt-1">{supabaseTestResult}</p>
            )}
          </div>

          {/* Admin authorization */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold uppercase tracking-wide">
              <Lock size={13} />
              Admin Authorization
            </div>
            <p className="text-[11px] text-slate-400">
              Enter current admin password to apply changes.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">CURRENT ADMIN PASSWORD</label>
                <input
                  type="password"
                  value={verifyAdminPass}
                  onChange={(e) => setVerifyAdminPass(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">NEW PASSWORD (OPTIONAL)</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Leave empty to keep current"
                  className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAuthSettingsOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bot-button bot-button-neon flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold"
            >
              <Save size={14} />
              <span>{isSaving ? 'Saving...' : 'Save & Update Auth Logic'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
