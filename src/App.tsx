/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BotProvider, useBot } from './context/BotContext';
import { LicenseActivationPage } from './pages/LicenseActivationPage';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { PerformancePage } from './pages/PerformancePage';
import { SupportPage } from './pages/SupportPage';
import { MorePage } from './pages/MorePage';
import { FutureSignalsPage } from './pages/FutureSignalsPage';
import { AdminPage } from './pages/AdminPage';
import { AuthSettingsModal } from './components/AuthSettingsModal';

const AppContent: React.FC = () => {
  const { currentRoute, isVerifying } = useBot();

  if (isVerifying) {
    return (
      <main className="bot-page flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-bold font-mono tracking-wider text-cyan-300">
            FR-KINGs AI BOT PRO
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">Verifying security signature...</p>
        </div>
      </main>
    );
  }

  const renderRoute = () => {
    switch (currentRoute) {
      case '/dashboard':
        return <DashboardPage />;
      case '/history':
        return <HistoryPage />;
      case '/performance':
        return <PerformancePage />;
      case '/support':
        return <SupportPage />;
      case '/more':
        return <MorePage />;
      case '/future-signals':
        return <FutureSignalsPage />;
      case '/admin':
        return <AdminPage />;
      case '/':
      default:
        return <LicenseActivationPage />;
    }
  };

  return (
    <>
      {renderRoute()}
      <AuthSettingsModal />
    </>
  );
};

export default function App() {
  return (
    <BotProvider>
      <AppContent />
    </BotProvider>
  );
}
