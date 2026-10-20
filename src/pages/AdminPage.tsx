import React, { useState, useEffect } from 'react';
import {
  Lock,
  RefreshCw,
  Plus,
  Copy,
  Check,
  KeyRound,
  ArrowLeft,
  Smartphone,
  CheckCircle2,
  Mail,
  Send,
  Key,
} from 'lucide-react';
import { useBot } from '../context/BotContext';
import {
  adminLogin,
  fetchAdminKeys,
  performAdminAction,
  adminCreateKey,
  resetAdminPassword,
} from '../services/authService';
import { DURATION_OPTIONS, SUPPORT_INFO } from '../services/botData';
import { LicenseRecord } from '../types';

export const AdminPage: React.FC = () => {
  const { navigateTo, setAuthSettingsOpen, setIsAdmin, appConfig } = useBot();

  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [keysList, setKeysList] = useState<LicenseRecord[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'blocked'>('all');
  const [keySettings, setKeySettings] = useState<Record<string, { duration: string; devices: number }>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Password reset state
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('emailwaqas7@gmail.com');
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{
    ok: boolean;
    newPassword?: string;
    emailSentTo?: string;
    message?: string;
  } | null>(null);

  // New key modal / form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({
    custom_key: '',
    full_name: 'VIP User',
    phone: '+966554573612',
    email: 'client@frkings.pro',
    duration: '1 Month',
    max_devices: 1,
    status: 'approved' as 'pending' | 'approved',
  });
  const [isCreating, setIsCreating] = useState(false);

  const loadKeys = async (passToUse = password) => {
    setErrorMsg('');
    try {
      const res = await fetchAdminKeys(passToUse);
      if (res.ok && res.keys) {
        setKeysList(res.keys);
        setIsAuthenticated(true);
        setIsAdmin(true);
        sessionStorage.setItem('frk_admin', passToUse);
      } else {
        setErrorMsg(res.error || 'Wrong admin password.');
        setIsAuthenticated(false);
        setIsAdmin(false);
        sessionStorage.removeItem('frk_admin');
      }
    } catch {
      setErrorMsg('Failed to connect to backend server.');
      setIsAuthenticated(false);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('frk_admin');
    if (saved) {
      setPassword(saved);
      loadKeys(saved);
    }
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Please enter admin password.');
      return;
    }
    const check = await adminLogin(password.trim());
    if (check.ok) {
      loadKeys(password.trim());
    } else {
      setErrorMsg(check.error || 'Invalid password.');
    }
  };

  const handleRemoveDevice = async (licenseId: string, deviceIdToRemove: string) => {
    setErrorMsg('');
    setActionFeedback(null);
    const passToUse = password || sessionStorage.getItem('frk_admin') || '';
    if (!passToUse) {
      setErrorMsg('Admin session expired. Please log in again.');
      setIsAuthenticated(false);
      return;
    }

    // Optimistically update keysList in UI immediately
    setKeysList((prev) =>
      prev.map((k) => {
        if (k.id === licenseId || k.license_key === licenseId) {
          return {
            ...k,
            license_devices: (k.license_devices || []).filter(
              (d) => String(d).trim().toLowerCase() !== String(deviceIdToRemove).trim().toLowerCase()
            ),
          };
        }
        return k;
      })
    );

    try {
      const res = await performAdminAction(
        passToUse,
        licenseId,
        'remove_device',
        undefined,
        undefined,
        deviceIdToRemove
      );
      if (res.ok) {
        setActionFeedback(`Device "${deviceIdToRemove}" deleted successfully.`);
        setTimeout(() => setActionFeedback(null), 3000);
        await loadKeys(passToUse);
      } else {
        setErrorMsg(res.error || 'Failed to remove device.');
        await loadKeys(passToUse);
      }
    } catch {
      setErrorMsg('Network error removing device.');
      await loadKeys(passToUse);
    }
  };

  const handleAction = async (
    id: string,
    action: 'approve' | 'reset_devices' | 'block' | 'delete'
  ) => {
    setErrorMsg('');
    setActionFeedback(null);
    setConfirmDeleteId(null);
    const passToUse = password || sessionStorage.getItem('frk_admin') || '';
    if (!passToUse) {
      setErrorMsg('Admin session expired. Please log in again.');
      setIsAuthenticated(false);
      return;
    }

    const currentSetting = keySettings[id] ?? { duration: '1 Day', devices: 1 };

    // Optimistically update keysList for instant UI response
    if (action === 'reset_devices') {
      setKeysList((prev) =>
        prev.map((k) => (k.id === id || k.license_key === id ? { ...k, license_devices: [] } : k))
      );
    } else if (action === 'delete') {
      setKeysList((prev) => prev.filter((k) => k.id !== id && k.license_key !== id));
    } else if (action === 'block') {
      setKeysList((prev) =>
        prev.map((k) => (k.id === id || k.license_key === id ? { ...k, status: 'blocked' } : k))
      );
    }

    try {
      const res = await performAdminAction(
        passToUse,
        id,
        action,
        currentSetting.duration,
        currentSetting.devices
      );
      if (res.ok) {
        if (action === 'delete') {
          setActionFeedback('License key deleted successfully.');
        } else if (action === 'reset_devices') {
          setActionFeedback('All bound devices reset successfully for this key.');
        } else if (action === 'block') {
          setActionFeedback('License blocked successfully.');
        } else if (action === 'approve') {
          setActionFeedback('License approved/updated successfully.');
        }
        setTimeout(() => setActionFeedback(null), 3000);
        await loadKeys(passToUse);
      } else {
        setErrorMsg(res.error || 'Action failed.');
        await loadKeys(passToUse);
      }
    } catch {
      setErrorMsg('Network error executing admin action.');
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setErrorMsg('');

    try {
      const res = await adminCreateKey(password, newKeyForm);
      if (res.ok) {
        setShowCreateModal(false);
        await loadKeys(password);
      } else {
        setErrorMsg(res.error || 'Failed to create key.');
      }
    } catch {
      setErrorMsg('Network error creating key.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    setErrorMsg('');
    setResetResult(null);

    try {
      const res = await resetAdminPassword(resetEmail);
      if (res.ok) {
        setResetResult(res);
        if (res.newPassword) {
          setPassword(res.newPassword);
        }
      } else {
        setErrorMsg(res.error || 'Failed to reset password.');
      }
    } catch {
      setErrorMsg('Network error requesting password reset.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopy = (keyText: string, id: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // If not logged in:
  if (!isAuthenticated) {
    return (
      <main className="bot-page">
        <div className="license-shell">
          <div className="w-full flex items-center justify-between mb-4">
            <button
              onClick={() => navigateTo('/')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
            >
              <ArrowLeft size={14} />
              <span>Back to App</span>
            </button>
            <button
              onClick={() => setAuthSettingsOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-400 text-xs"
            >
              <KeyRound size={12} />
              <span>API Settings</span>
            </button>
          </div>

          {isResetMode ? (
            <div className="license-card max-w-sm">
              <h2>
                <Mail size={18} className="text-cyan-400" />
                Reset Admin Password
              </h2>
              <p className="text-muted-foreground text-xs mt-1">
                A new secure admin password will be generated and dispatched to:
                <span className="block font-mono text-cyan-300 mt-1 font-bold">emailwaqas7@gmail.com</span>
              </p>

              {resetResult?.ok ? (
                <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-left space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs">
                    <CheckCircle2 size={16} />
                    <span>Password Reset Successfully!</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Dispatched to: <strong className="text-white font-mono">{resetResult.emailSentTo}</strong>
                  </p>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-700">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">New Password</div>
                    <div className="text-base font-bold font-mono text-cyan-300 tracking-wider break-all mt-0.5">
                      {resetResult.newPassword}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (resetResult.newPassword) handleCopy(resetResult.newPassword, 'reset-pass');
                      }}
                      className="bot-button bot-button-outline flex-1 text-[11px] py-1.5 flex items-center justify-center gap-1"
                    >
                      {copiedId === 'reset-pass' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedId === 'reset-pass' ? 'Copied!' : 'Copy Password'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(false);
                      }}
                      className="bot-button bot-button-neon flex-1 text-[11px] py-1.5 flex items-center justify-center gap-1"
                    >
                      <Lock size={12} />
                      <span>Login Now</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="mt-3">
                  <label className="text-[10px] text-slate-400 block text-left mb-1 uppercase font-semibold">
                    Recovery Email Address
                  </label>
                  <input
                    className="license-input text-center text-xs tracking-wide font-mono"
                    type="email"
                    placeholder="emailwaqas7@gmail.com"
                    aria-label="Recovery email"
                    value={resetEmail}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      setErrorMsg('');
                    }}
                    required
                  />

                  {errorMsg && <p className="text-danger text-xs font-bold mb-2">{errorMsg}</p>}

                  <button
                    type="submit"
                    disabled={isResetting}
                    className="bot-button bot-button-neon generate-button flex items-center justify-center gap-2"
                  >
                    <Send size={15} />
                    <span>{isResetting ? 'RESETTING & SENDING...' : 'RESET & SEND TO EMAIL'}</span>
                  </button>

                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(false);
                        setErrorMsg('');
                      }}
                      className="text-[11px] text-slate-400 hover:text-white underline inline-flex items-center gap-1"
                    >
                      <ArrowLeft size={12} />
                      <span>Back to Login</span>
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
                Email Delivery to {resetEmail}
              </div>
            </div>
          ) : (
            <div className="license-card max-w-sm">
              <h2>
                <Lock size={18} className="text-amber-400" />
                Admin Login
              </h2>
              <p className="text-muted-foreground text-xs mt-1">
                Protected terminal management and license issuance.
              </p>

              <form onSubmit={handleLogin} className="mt-2">
                <input
                  className="license-input text-center tracking-wider"
                  type="password"
                  placeholder="ADMIN PASSWORD"
                  aria-label="Admin password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                />

                {errorMsg && <p className="text-danger text-xs font-bold mb-2">{errorMsg}</p>}

                <button
                  type="submit"
                  className="bot-button bot-button-neon generate-button flex items-center justify-center gap-2"
                >
                  <Lock size={15} />
                  <span>LOGIN</span>
                </button>

                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      setErrorMsg('');
                      setResetResult(null);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1.5 font-semibold"
                  >
                    <Mail size={12} />
                    <span>Reset Password (Send to email)</span>
                  </button>
                </div>
              </form>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
                Recovery Email: <span className="text-slate-300 font-mono">emailwaqas7@gmail.com</span>
              </div>
            </div>
          )}

          <p className="dev-credit">Developer {SUPPORT_INFO.developer}</p>
        </div>
      </main>
    );
  }

  const filteredKeys = keysList.filter((k) => {
    if (activeFilter === 'all') return true;
    return k.status === activeFilter;
  });

  return (
    <main className="bot-page">
      <div className="admin-shell">
        {/* Top bar */}
        <div className="admin-top">
          <div>
            <h1 className="terminal-heading text-left">
              ADMIN <span>PANEL</span>
            </h1>
            <p className="text-xs text-slate-400">Manage user licenses, bindings, and API authorizations</p>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bot-button bot-button-neon flex items-center gap-1.5 text-xs py-1.5"
            >
              <Plus size={14} />
              <span>New Key</span>
            </button>
            <button
              onClick={() => setAuthSettingsOpen(true)}
              className="bot-button bot-button-outline flex items-center gap-1.5 text-xs py-1.5"
            >
              <KeyRound size={14} />
              <span>API Config</span>
            </button>
            <button
              onClick={() => loadKeys(password)}
              className="bot-button bot-button-outline flex items-center gap-1.5 text-xs py-1.5"
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem('frk_admin');
                setIsAuthenticated(false);
                setIsAdmin(false);
                setPassword('');
              }}
              className="bot-button bot-button-ghost text-xs py-1.5 text-rose-400 hover:text-rose-300"
            >
              Logout
            </button>
            <button
              onClick={() => navigateTo('/dashboard')}
              className="bot-button bot-button-outline text-xs py-1.5 text-slate-300"
            >
              Back
            </button>
          </div>
        </div>

        {/* Admin Quick Test Keys (Private to Admin) */}
        <div className="p-3.5 mb-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-cyan-400 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
              <KeyRound size={13} />
              Admin Quick Test Keys (Private Reference)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Hidden from normal users</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleCopy('FRK-KING-7860-PRO1', 'vip-test')}
              className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-[11px] flex items-center gap-1.5"
              title="Copy VIP Key"
            >
              <span>VIP Key: FRK-KING-7860-PRO1</span>
              {copiedId === 'vip-test' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            </button>
            <button
              onClick={() => handleCopy('FRK-DEMO-VIP8-2026', 'demo-test')}
              className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-[11px] flex items-center gap-1.5"
              title="Copy Demo Key"
            >
              <span>Demo Key: FRK-DEMO-VIP8-2026</span>
              {copiedId === 'demo-test' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            </button>
            {appConfig?.apiKey && (
              <button
                onClick={() => handleCopy(appConfig.apiKey, 'master-test')}
                className="px-2.5 py-1 rounded bg-cyan-950/70 border border-cyan-500/50 hover:bg-cyan-900 text-cyan-200 font-mono text-[11px] flex items-center gap-1.5"
                title="Copy Master API Key"
              >
                <span>Master API Key: {appConfig.apiKey}</span>
                {copiedId === 'master-test' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="admin-filters">
          {(['all', 'pending', 'approved', 'blocked'] as const).map((filter) => {
            const count =
              filter === 'all'
                ? keysList.length
                : keysList.filter((k) => k.status === filter).length;
            return (
              <button
                key={filter}
                data-active={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              >
                {filter.toUpperCase()} ({count})
              </button>
            );
          })}
        </div>

        {actionFeedback && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{actionFeedback}</span>
          </div>
        )}

        {errorMsg && <p className="text-danger text-xs font-bold mb-3">{errorMsg}</p>}

        {filteredKeys.length === 0 && (
          <div className="empty-state">
            <p>No license keys found in this category.</p>
          </div>
        )}

        {/* License cards */}
        <div className="admin-list">
          {filteredKeys.map((item) => {
            const currentSetting = keySettings[item.id] ?? {
              duration: item.duration_label || '1 Day',
              devices: item.max_devices || 1,
            };

            const updateCurrentSetting = (patch: Partial<typeof currentSetting>) => {
              setKeySettings({
                ...keySettings,
                [item.id]: { ...currentSetting, ...patch },
              });
            };

            const isExpired =
              !item.lifetime && item.expires_at && new Date(item.expires_at) < new Date();

            return (
              <div key={item.id} className="admin-card">
                <div className="admin-row">
                  <div className="flex items-center gap-2">
                    <strong className="new-key small font-mono">{item.license_key}</strong>
                    <button
                      onClick={() => handleCopy(item.license_key, item.id)}
                      className="p-1 text-slate-400 hover:text-cyan-400"
                      title="Copy Key"
                    >
                      {copiedId === item.id ? (
                        <Check size={13} className="text-emerald-400" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                  <span className={`status-pill ${isExpired ? 'blocked' : item.status}`}>
                    {isExpired ? 'EXPIRED' : item.status.toUpperCase()}
                  </span>
                </div>

                <dl>
                  <dt>Name</dt>
                  <dd className="font-semibold text-white">{item.full_name}</dd>
                  <dt>Number</dt>
                  <dd className="font-mono text-cyan-300">{item.phone}</dd>
                  <dt>Gmail</dt>
                  <dd className="text-slate-300">{item.email}</dd>
                  <dt>TXID</dt>
                  <dd className="font-mono text-xs text-amber-300">{item.txid}</dd>
                  <dt>Paid</dt>
                  <dd className="font-bold text-emerald-400">{item.amount}</dd>
                  <dt>Registered</dt>
                  <dd className="text-slate-400 text-xs">
                    {new Date(item.created_at).toLocaleString()}
                  </dd>
                  <dt>Plan</dt>
                  <dd className="text-xs">
                    {item.status === 'approved'
                      ? item.lifetime
                        ? 'Lifetime'
                        : `${item.duration_label} · expires ${
                            item.expires_at ? new Date(item.expires_at).toLocaleDateString() : '-'
                          }`
                      : '-'}
                  </dd>
                  <dt>Devices</dt>
                  <dd className="text-xs">
                    <div className="font-mono text-cyan-300 font-bold mb-1">
                      {item.license_devices ? item.license_devices.length : 0} / {item.max_devices} bound
                    </div>
                    {item.license_devices && item.license_devices.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {item.license_devices.map((dev) => (
                          <span
                            key={dev}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-[10px] text-slate-300 font-mono"
                          >
                            <Smartphone size={10} className="text-cyan-400 shrink-0" />
                            <span title={dev}>{dev.length > 14 ? `${dev.substring(0, 11)}...` : dev}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveDevice(item.id, dev);
                              }}
                              className="text-rose-400 hover:text-white hover:bg-rose-600 rounded px-1.5 py-0.5 text-xs font-bold transition-colors cursor-pointer"
                              title={`Delete this device (${dev})`}
                              aria-label={`Delete device ${dev}`}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[10px] italic">No devices bound</span>
                    )}
                  </dd>
                </dl>

                {/* Actions */}
                <div className="admin-actions">
                  <select
                    value={currentSetting.duration}
                    onChange={(e) => updateCurrentSetting({ duration: e.target.value })}
                    aria-label="Duration"
                  >
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  <select
                    value={currentSetting.devices}
                    onChange={(e) => updateCurrentSetting({ devices: Number(e.target.value) })}
                    aria-label="Devices"
                  >
                    {[1, 2, 3, 4, 5, 10].map((d) => (
                      <option key={d} value={d}>
                        {d} device{d > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    className="bot-button bot-button-neon"
                    onClick={() => handleAction(item.id, 'approve')}
                  >
                    {item.status === 'approved' ? 'Update' : 'Approve'}
                  </button>

                  <button
                    type="button"
                    className="bot-button bot-button-outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(item.id, 'reset_devices');
                    }}
                    title="Clear all bound devices for this key"
                  >
                    Reset devices
                  </button>

                  <button
                    className="bot-button bot-button-outline"
                    onClick={() => handleAction(item.id, 'block')}
                  >
                    Block
                  </button>

                  {confirmDeleteId === item.id ? (
                    <div className="inline-flex items-center gap-1.5 p-1 rounded-lg bg-rose-950/90 border border-rose-500/50">
                      <button
                        className="bot-button bg-rose-600 hover:bg-rose-500 text-white text-[11px] px-2.5 py-1"
                        onClick={() => handleAction(item.id, 'delete')}
                      >
                        Confirm Delete
                      </button>
                      <button
                        className="bot-button bot-button-ghost text-slate-300 text-[11px] px-1.5 py-1"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="bot-button bot-button-ghost text-rose-400 hover:text-rose-300"
                      onClick={() => setConfirmDeleteId(item.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal to Create New Key */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-md bg-[#131722] border border-cyan-500/50 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-base font-bold text-white mb-2 font-mono flex items-center gap-2">
                <Plus size={16} className="text-cyan-400" />
                Mint New License Key
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Generate an immediate pre-approved license key for a customer.
              </p>

              <form onSubmit={handleCreateKey} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400">CUSTOM KEY (OPTIONAL - AUTO-GENERATED IF EMPTY)</label>
                  <input
                    type="text"
                    value={newKeyForm.custom_key}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, custom_key: e.target.value })}
                    placeholder="e.g. FRK-VIP8-8888-2026"
                    className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">CUSTOMER FULL NAME</label>
                  <input
                    type="text"
                    value={newKeyForm.full_name}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, full_name: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">CUSTOMER PHONE</label>
                  <input
                    type="tel"
                    value={newKeyForm.phone}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, phone: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">CUSTOMER EMAIL</label>
                  <input
                    type="email"
                    value={newKeyForm.email}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, email: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">PLAN DURATION</label>
                    <select
                      value={newKeyForm.duration}
                      onChange={(e) => setNewKeyForm({ ...newKeyForm, duration: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    >
                      {DURATION_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400">MAX DEVICES</label>
                    <select
                      value={newKeyForm.max_devices}
                      onChange={(e) =>
                        setNewKeyForm({ ...newKeyForm, max_devices: Number(e.target.value) })
                      }
                      className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    >
                      {[1, 2, 3, 4, 5, 10].map((d) => (
                        <option key={d} value={d}>
                          {d} device{d > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="bot-button bot-button-neon px-4 py-1.5"
                  >
                    {isCreating ? 'Minting...' : 'Mint & Approve Key'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <p className="dev-credit">Developer {SUPPORT_INFO.developer}</p>
      </div>
    </main>
  );
};
