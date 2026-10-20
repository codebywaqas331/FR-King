import React, { useState } from 'react';
import {
  ChevronDown,
  HelpCircle,
  LogOut,
  Send,
  MessageSquare,
  ShieldCheck,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { useBot } from '../context/BotContext';
import { BotShell } from '../components/BotShell';
import { SUPPORT_INFO, FAQ_ITEMS } from '../services/botData';

export const MorePage: React.FC = () => {
  const { deactivateKey, navigateTo, setAuthSettingsOpen, activeLicense, licenseDetails, isAdmin } = useBot();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <BotShell>
      <section className="terminal">
        <h2 className="terminal-heading">
          MORE <span>OPTIONS</span>
        </h2>
        <p className="terminal-subtitle">Settings, FAQ, and account management</p>

        <div className="support-list">
          {/* License info row */}
          <div className="link-row">
            <ShieldCheck className="text-emerald-400" />
            <div>
              <strong>License Active</strong>
              <small className="font-mono text-cyan-300">
                {activeLicense || 'PRO MAX'} · {licenseDetails?.duration_label || 'Approved'}
              </small>
            </div>
          </div>

          {/* Admin shortcuts (Visible ONLY if Admin is logged in) */}
          {isAdmin && (
            <>
              <button
                onClick={() => setAuthSettingsOpen(true)}
                className="link-row w-full text-left bg-transparent border-0 border-b border-border cursor-pointer hover:bg-slate-900/40"
              >
                <KeyRound className="text-cyan-400" />
                <div>
                  <strong>API Key & Auth Settings</strong>
                  <small>Configure custom API key, Supabase, or auth mode</small>
                </div>
              </button>

              <button
                onClick={() => navigateTo('/admin')}
                className="link-row w-full text-left bg-transparent border-0 border-b border-border cursor-pointer hover:bg-slate-900/40"
              >
                <ShieldAlert className="text-amber-400" />
                <div>
                  <strong>Admin Panel</strong>
                  <small>Manage and approve licenses, reset devices</small>
                </div>
              </button>
            </>
          )}

          <a
            className="link-row"
            href={SUPPORT_INFO.whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            <MessageSquare className="text-emerald-400" />
            <div>
              <strong>WhatsApp Group</strong>
              <small>Join our community</small>
            </div>
          </a>

          <a
            className="link-row"
            href={SUPPORT_INFO.telegram}
            target="_blank"
            rel="noreferrer"
          >
            <Send className="text-cyan-400" />
            <div>
              <strong>Telegram Channel</strong>
              <small>@frking786</small>
            </div>
          </a>
        </div>

        {/* FAQ Section */}
        <h3 className="faq-heading">
          <HelpCircle size={16} className="text-cyan-400" />
          Frequently Asked Questions
        </h3>

        <div className="faq-list">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={item.q} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={15} data-open={isOpen} />
                </button>
                {isOpen && <p className="faq-answer">{item.a}</p>}
              </div>
            );
          })}
        </div>

        {/* Deactivate button */}
        <button className="logout-button" onClick={deactivateKey}>
          <LogOut size={15} />
          <span>Deactivate License</span>
        </button>
      </section>
    </BotShell>
  );
};
