import React, { useState, useEffect } from 'react';
import { KeyRound, UserPlus, Zap, Copy, ShieldAlert, Sparkles } from 'lucide-react';
import { useBot } from '../context/BotContext';
import { verifyLicenseKey, registerLicenseKey } from '../services/authService';
import { SUPPORT_INFO } from '../services/botData';

export const LicenseActivationPage: React.FC = () => {
  const { activateKey, deviceId, navigateTo, setAuthSettingsOpen, appConfig, isAdmin } = useBot();

  const [activeTab, setActiveTab] = useState<'activate' | 'register'>('activate');
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const logoClicksRef = React.useRef(0);
  const logoTimerRef = React.useRef<any>(null);

  const handleLogoClick = () => {
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

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    txid: '',
    amount: '',
  });
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState('');

  // Handle Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && activeTab === 'activate' && licenseKeyInput.trim()) {
        handleActivate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, licenseKeyInput]);

  const handleActivate = async () => {
    if (!licenseKeyInput.trim()) {
      setErrorMessage('Please enter your license key.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await verifyLicenseKey(licenseKeyInput.trim(), deviceId);
      if (res.ok) {
        activateKey(licenseKeyInput.trim(), res.license);
      } else {
        setErrorMessage(res.error || 'Activation failed. Invalid license key.');
      }
    } catch {
      setErrorMessage('Network connection error. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    setErrorMessage('');
    const { full_name, phone, email, txid, amount } = registerForm;

    if (!full_name.trim() || !phone.trim() || !email.trim() || !txid.trim() || !amount.trim()) {
      setErrorMessage('Please fill all fields.');
      return;
    }

    if (!/^\+\d{7,15}$/.test(phone.trim())) {
      setErrorMessage('Phone number must start with + and country code, e.g. +923001234567');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerLicenseKey(registerForm);
      if (res.ok && res.key) {
        setNewlyGeneratedKey(res.key);
      } else {
        setErrorMessage(res.error || 'Registration failed. Please check your details.');
      }
    } catch {
      setErrorMessage('Please check your details (valid Gmail, number with country code).');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <main className="bot-page">
      <div className="license-shell">
        {/* Admin Bar (Only visible if admin is logged in) */}
        {isAdmin && (
          <div className="w-full flex items-center justify-between mb-4">
            <button
              onClick={() => setAuthSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-400 text-xs font-mono hover:bg-cyan-900 transition-colors"
            >
              <KeyRound size={12} />
              <span>API Key & Auth Settings</span>
            </button>
            <button
              onClick={() => navigateTo('/admin')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs hover:text-white transition-colors"
            >
              <ShieldAlert size={12} />
              <span>Admin Panel</span>
            </button>
          </div>
        )}

        {/* Brand Logo & Title */}
        <img
          className="bot-logo license-logo cursor-pointer select-none"
          src="/fr-kings-logo.jpg"
          alt="FR-KINGs logo"
          onClick={handleLogoClick}
          title="FR-KINGs AI Bot Pro"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <h1 className="license-title">FR-KINGs</h1>
        <p className="brand-subtitle">
          AI BOT{' '}
          <span className="tier-badge">
            <Sparkles size={11} />
            PRO MAX
          </span>
        </p>

        {/* Tabs */}
        <div className="license-tabs">
          <button
            data-active={activeTab === 'activate'}
            onClick={() => {
              setActiveTab('activate');
              setErrorMessage('');
            }}
          >
            <KeyRound size={15} />
            Active Key
          </button>
          <button
            data-active={activeTab === 'register'}
            onClick={() => {
              setActiveTab('register');
              setErrorMessage('');
            }}
          >
            <UserPlus size={15} />
            Register
          </button>
        </div>

        {/* Card Content */}
        <div className="license-card">
          {activeTab === 'activate' ? (
            <>
              <h2>
                <KeyRound size={18} className="text-cyan-400" />
                License Activation
              </h2>
              <p className="text-muted-foreground text-xs mt-1">
                Enter your approved license key to unlock the signal terminal.
              </p>

              <input
                className="license-input uppercase font-mono tracking-wider"
                value={licenseKeyInput}
                onChange={(e) => {
                  setLicenseKeyInput(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="FRK-XXXX-XXXX-XXXX"
                aria-label="License key"
                autoComplete="off"
                spellCheck={false}
              />

              {errorMessage && (
                <p role="alert" className="text-danger text-xs font-bold mt-2">
                  {errorMessage}
                </p>
              )}

              <button
                className="bot-button bot-button-neon generate-button flex items-center justify-center gap-2"
                onClick={handleActivate}
                disabled={isSubmitting}
              >
                <Zap size={16} />
                {isSubmitting ? 'CHECKING...' : 'ACTIVATE LICENSE'}
              </button>

              {/* Quick test keys (Visible ONLY to authenticated Admin) */}
              {isAdmin && (
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <span className="block mb-1.5 font-semibold text-slate-300">Quick Test Keys (Admin Only):</span>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLicenseKeyInput('FRK-KING-7860-PRO1')}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-[10px]"
                    >
                      VIP Key: FRK-KING-7860-PRO1
                    </button>
                    <button
                      type="button"
                      onClick={() => setLicenseKeyInput('FRK-DEMO-VIP8-2026')}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 font-mono text-[10px]"
                    >
                      Demo Key: FRK-DEMO-VIP8-2026
                    </button>
                    {appConfig?.apiKey && (
                      <button
                        type="button"
                        onClick={() => setLicenseKeyInput(appConfig.apiKey)}
                        className="px-2 py-1 rounded bg-cyan-950/70 border border-cyan-500/50 hover:bg-cyan-900 text-cyan-200 font-mono text-[10px]"
                      >
                        Master API Key
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : newlyGeneratedKey ? (
            <>
              <h2>
                <Zap size={18} className="text-emerald-400" />
                Key Generated
              </h2>
              <p className="text-muted-foreground text-xs mt-1">
                Save your key. It will activate once admin approves your payment in the Admin panel.
              </p>
              <div className="new-key font-mono">{newlyGeneratedKey}</div>

              <div className="flex flex-col gap-2 mt-2">
                <button
                  className="bot-button bot-button-outline w-full flex items-center justify-center gap-2"
                  onClick={() => handleCopy(newlyGeneratedKey)}
                >
                  <Copy size={15} />
                  {copiedKey ? 'COPIED TO CLIPBOARD!' : 'COPY KEY'}
                </button>
                <button
                  className="bot-button bot-button-neon generate-button flex items-center justify-center gap-2"
                  onClick={() => {
                    setLicenseKeyInput(newlyGeneratedKey);
                    setActiveTab('activate');
                    setNewlyGeneratedKey('');
                  }}
                >
                  <KeyRound size={16} />
                  GO TO ACTIVATE
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>
                <UserPlus size={18} className="text-cyan-400" />
                Register & Get Key
              </h2>
              <p className="text-muted-foreground text-xs mt-1">
                Fill your real details and payment transaction info.
              </p>

              <input
                className="license-input reg-input"
                placeholder="Real Full Name"
                value={registerForm.full_name}
                onChange={(e) => {
                  setRegisterForm({ ...registerForm, full_name: e.target.value });
                  setErrorMessage('');
                }}
              />
              <input
                className="license-input reg-input"
                placeholder="Number with country code (+92...)"
                type="tel"
                value={registerForm.phone}
                onChange={(e) => {
                  setRegisterForm({ ...registerForm, phone: e.target.value });
                  setErrorMessage('');
                }}
              />
              <input
                className="license-input reg-input"
                placeholder="Gmail address"
                type="email"
                value={registerForm.email}
                onChange={(e) => {
                  setRegisterForm({ ...registerForm, email: e.target.value });
                  setErrorMessage('');
                }}
              />
              <input
                className="license-input reg-input font-mono"
                placeholder="Payment TXID / Reference"
                value={registerForm.txid}
                onChange={(e) => {
                  setRegisterForm({ ...registerForm, txid: e.target.value });
                  setErrorMessage('');
                }}
              />
              <input
                className="license-input reg-input"
                placeholder="Amount paid (e.g. 20 USD)"
                value={registerForm.amount}
                onChange={(e) => {
                  setRegisterForm({ ...registerForm, amount: e.target.value });
                  setErrorMessage('');
                }}
              />

              {errorMessage && (
                <p role="alert" className="text-danger text-xs font-bold mt-2">
                  {errorMessage}
                </p>
              )}

              <button
                className="bot-button bot-button-neon generate-button flex items-center justify-center gap-2 mt-2"
                onClick={handleRegister}
                disabled={isSubmitting}
              >
                <Zap size={16} />
                {isSubmitting ? 'SUBMITTING...' : 'GENERATE KEY'}
              </button>
            </>
          )}

          <p className="license-hint">
            <KeyRound size={13} />
            Device-locked license · Secured activation
          </p>
        </div>

        <p className="dev-credit">Developer {SUPPORT_INFO.developer}</p>
      </div>
    </main>
  );
};
