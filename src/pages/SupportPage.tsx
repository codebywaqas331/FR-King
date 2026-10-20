import React from 'react';
import { Send, Phone, MessageSquare, Clock } from 'lucide-react';
import { BotShell } from '../components/BotShell';
import { SUPPORT_INFO } from '../services/botData';

export const SupportPage: React.FC = () => {
  return (
    <BotShell>
      <section className="terminal">
        <h2 className="terminal-heading">
          SUPPORT <span>CENTER</span>
        </h2>
        <p className="terminal-subtitle">Our team is available 24/7 to help you</p>

        <div className="support-list">
          <a
            className="link-row"
            href={SUPPORT_INFO.whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            <MessageSquare className="text-emerald-400" />
            <div>
              <strong>WhatsApp Group</strong>
              <small>Join the FR-KINGs community & updates</small>
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
              <small>@frking786 — live updates & market alerts</small>
            </div>
          </a>

          <a className="link-row" href={`tel:${SUPPORT_INFO.phone}`}>
            <Phone className="text-amber-400" />
            <div>
              <strong>Contact Number</strong>
              <small>{SUPPORT_INFO.phone}</small>
            </div>
          </a>
        </div>

        <p className="signal-note flex items-center justify-center gap-1.5 mt-4">
          <Clock size={12} className="text-cyan-400" />
          <span>Average response time: under 5 minutes</span>
        </p>
      </section>
    </BotShell>
  );
};
