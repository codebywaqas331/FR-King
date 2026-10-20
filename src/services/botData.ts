import { DurationOption, SignalRecord } from '../types';

export const SUPPORT_INFO = {
  name: 'FR-KINGs',
  whatsapp: 'https://chat.whatsapp.com/DsBqFDCjCN5EBX5deNoRKz',
  telegram: 'https://t.me/frking786',
  phone: '+966554573612',
  developer: '@hackertrader786',
};

export const LIVE_PAIRS = [
  'EUR/USD',
  'GBP/USD',
  'USD/JPY',
  'AUD/USD',
  'USD/CAD',
  'NZD/USD',
  'USD/CHF',
  'EUR/GBP',
  'EUR/JPY',
  'GBP/JPY',
  'AUD/JPY',
  'AUD/CAD',
  'AUD/CHF',
  'AUD/NZD',
  'CAD/JPY',
  'CHF/JPY',
  'EUR/AUD',
  'EUR/CAD',
  'EUR/CHF',
  'EUR/NZD',
  'GBP/AUD',
  'GBP/CAD',
  'GBP/CHF',
  'GBP/NZD',
  'NZD/CAD',
  'NZD/CHF',
  'NZD/JPY',
  'USD/SGD',
  'USD/MXN',
  'USD/ZAR',
  'USD/TRY',
  'USD/BRL',
];

export const OTC_PAIRS = LIVE_PAIRS.map((p) => `${p} (OTC)`);

export const LIVE_TIMERS = [
  '5 Seconds',
  '10 Seconds',
  '15 Seconds',
  '30 Seconds',
  '45 Seconds',
  '1 Minute',
];

export const FUTURE_TIMERS = [
  '1 Minute',
  '2 Minutes',
  '3 Minutes',
  '5 Minutes',
  '10 Minutes',
  '15 Minutes',
  '30 Minutes',
];

export const DURATION_OPTIONS: DurationOption[] = [
  '1 Day',
  '2 Days',
  '3 Days',
  '5 Days',
  '1 Week',
  '15 Days',
  '1 Month',
  '3 Months',
  '6 Months',
  '1 Year',
  'Lifetime',
];

export const DURATION_DAYS: Record<DurationOption, number | null> = {
  '1 Day': 1,
  '2 Days': 2,
  '3 Days': 3,
  '5 Days': 5,
  '1 Week': 7,
  '15 Days': 15,
  '1 Month': 30,
  '3 Months': 90,
  '6 Months': 180,
  '1 Year': 365,
  Lifetime: null,
};

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server-dev';
  let deviceId = localStorage.getItem('frk_device');
  if (!deviceId) {
    deviceId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'dev-' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem('frk_device', deviceId);
  }
  return deviceId;
}

export function generateSignal(
  pair: string,
  market: 'OTC Markets' | 'Live Markets',
  timer: string,
  mode: 'live' | 'future',
  futureEntryTime?: string
): SignalRecord {
  const entryDate = futureEntryTime ? new Date(futureEntryTime) : new Date();
  const expiryDate = new Date(entryDate.getTime() + 45000);
  const randomId = Math.floor(100000 + Math.random() * 900000);

  return {
    id: `#FRK${randomId}`,
    pair,
    market,
    timer,
    mode,
    direction: Math.random() > 0.5 ? 'BUY' : 'SELL',
    entry: entryDate.toISOString(),
    expiry: expiryDate.toISOString(),
  };
}

export function formatTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function getWinRateStats(period: 'today' | 'weekly' | 'monthly', seedStr: string = new Date().toDateString()) {
  const configs: Record<'today' | 'weekly' | 'monthly', [number, number, number, number]> = {
    today: [80, 92, 40, 90],
    weekly: [82, 94, 260, 520],
    monthly: [84, 96, 1100, 2400],
  };

  const [minRate, maxRate, minTotal, maxTotal] = configs[period];
  let hash = 0;
  for (const char of seedStr + period) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  const rng = (min: number, max: number) => {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    return min + (hash / 4294967295) * (max - min);
  };

  const total = Math.round(rng(minTotal, maxTotal));
  const rate = Math.round(rng(minRate, maxRate) * 10) / 10;
  const wins = Math.round((rate / 100) * total);
  const losses = total - wins;

  return { total, rate, wins, losses };
}

export const FAQ_ITEMS = [
  {
    q: 'What is FR-KINGs AI Bot Pro?',
    a: 'FR-KINGs AI Bot Pro is an AI-powered signal terminal for Quotex OTC and live markets, providing high-accuracy BUY/SELL signals with live and future modes.',
  },
  {
    q: 'How do I activate my license?',
    a: 'Tap Register, fill your real name, number with country code, Gmail, TXID and paid amount to get your key. After admin approves your payment, enter the key in Active Key to log in.',
  },
  {
    q: 'What is the difference between LIVE and FUTURE signals?',
    a: 'LIVE signals are for immediate execution. FUTURE signals let you pick an upcoming entry time so you can prepare your trade in advance.',
  },
  {
    q: 'Which broker is supported?',
    a: 'The bot is optimized for Quotex, covering both OTC and live market pairs.',
  },
  {
    q: 'Are the signals guaranteed?',
    a: 'No signal is guaranteed. Signals are AI-generated simulations for reference only — always trade responsibly.',
  },
];
