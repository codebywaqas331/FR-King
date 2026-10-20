import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppConfig, LicenseRecord, SignalRecord } from '../types';
import { fetchAppConfig, verifyLicenseKey } from '../services/authService';
import { getDeviceId } from '../services/botData';

export type RoutePath =
  | '/'
  | '/dashboard'
  | '/history'
  | '/performance'
  | '/support'
  | '/more'
  | '/future-signals'
  | '/admin';

interface BotContextType {
  currentRoute: RoutePath;
  navigateTo: (route: RoutePath) => void;
  activeLicense: string | null;
  licenseDetails: Partial<LicenseRecord> | null;
  deviceId: string;
  signals: SignalRecord[];
  addSignal: (signal: SignalRecord) => void;
  clearSignals: () => void;
  activateKey: (key: string, details?: Partial<LicenseRecord>) => void;
  deactivateKey: () => void;
  appConfig: AppConfig | null;
  refreshConfig: () => Promise<void>;
  isAuthSettingsOpen: boolean;
  setAuthSettingsOpen: (open: boolean) => void;
  isVerifying: boolean;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
}

const BotContext = createContext<BotContextType | null>(null);

export const BotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<RoutePath>('/');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return Boolean(sessionStorage.getItem('frk_admin'));
    }
    return false;
  });
  const [activeLicense, setActiveLicense] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('frk_license');
    }
    return null;
  });
  const [licenseDetails, setLicenseDetails] = useState<Partial<LicenseRecord> | null>(null);
  const [deviceId] = useState<string>(() => getDeviceId());
  const [signals, setSignals] = useState<SignalRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('frk_signals');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [isAuthSettingsOpen, setAuthSettingsOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return Boolean(localStorage.getItem('frk_license'));
    }
    return false;
  });

  const refreshConfig = async () => {
    try {
      const cfg = await fetchAppConfig();
      setAppConfig(cfg);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshConfig();
  }, []);

  // On initial load or when activeLicense changes, verify against backend
  useEffect(() => {
    const key = typeof window !== 'undefined' ? localStorage.getItem('frk_license') : null;
    if (!key) {
      setIsVerifying(false);
      return;
    }

    setIsVerifying(true);
    verifyLicenseKey(key, deviceId)
      .then((res) => {
        if (res.ok) {
          setActiveLicense(key);
          if (res.license) {
            setLicenseDetails(res.license);
          }
          if (currentRoute === '/') {
            navigateTo('/dashboard');
          }
        } else {
          // Key no longer valid or blocked
          localStorage.removeItem('frk_license');
          setActiveLicense(null);
          setLicenseDetails(null);
          if (currentRoute !== '/' && currentRoute !== '/admin') {
            navigateTo('/');
          }
        }
      })
      .catch(() => {
        // network issue: keep active if previously stored
        setActiveLicense(key);
      })
      .finally(() => {
        setIsVerifying(false);
      });
  }, [deviceId]);

  const navigateTo = (route: RoutePath) => {
    queueMicrotask(() => {
      setCurrentRoute(route);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  const activateKey = (key: string, details?: Partial<LicenseRecord>) => {
    const cleanKey = key.trim().toUpperCase();
    localStorage.setItem('frk_license', cleanKey);
    setActiveLicense(cleanKey);
    if (details) setLicenseDetails(details);
    navigateTo('/dashboard');
  };

  const deactivateKey = () => {
    localStorage.removeItem('frk_license');
    setActiveLicense(null);
    setLicenseDetails(null);
    navigateTo('/');
  };

  const addSignal = (sig: SignalRecord) => {
    setSignals((prev) => {
      const updated = [sig, ...prev].slice(0, 50);
      try {
        localStorage.setItem('frk_signals', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const clearSignals = () => {
    setSignals([]);
    localStorage.removeItem('frk_signals');
  };

  return (
    <BotContext.Provider
      value={{
        currentRoute,
        navigateTo,
        activeLicense,
        licenseDetails,
        deviceId,
        signals,
        addSignal,
        clearSignals,
        activateKey,
        deactivateKey,
        appConfig,
        refreshConfig,
        isAuthSettingsOpen,
        setAuthSettingsOpen,
        isVerifying,
        isAdmin,
        setIsAdmin,
      }}
    >
      {children}
    </BotContext.Provider>
  );
};

export function useBot() {
  const context = useContext(BotContext);
  if (!context) {
    throw new Error('useBot must be used within BotProvider');
  }
  return context;
}
