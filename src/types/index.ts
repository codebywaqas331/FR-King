export interface LicenseRecord {
  id: string;
  license_key: string;
  full_name: string;
  phone: string;
  email: string;
  txid: string;
  amount: string;
  created_at: string;
  status: 'pending' | 'approved' | 'blocked';
  duration_label: string;
  expires_at: string | null;
  lifetime: boolean;
  max_devices: number;
  license_devices: string[];
}

export interface SignalRecord {
  id: string;
  pair: string;
  market: 'OTC Markets' | 'Live Markets';
  timer: string;
  mode: 'live' | 'future';
  direction: 'BUY' | 'SELL';
  entry: string;
  expiry: string;
}

export interface AppConfig {
  apiKey: string;
  adminPassword: string;
  recoveryEmail: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  authMode: 'local' | 'api_key_only' | 'supabase_sync';
  allowMasterApiKeyBypass: boolean;
  emailLogs?: EmailLogItem[];
}

export interface EmailLogItem {
  id: string;
  to: string;
  subject: string;
  sent_at: string;
  status: 'sent' | 'simulated' | 'delivered';
  newPassword?: string;
}

export interface ResetPasswordResult {
  ok: boolean;
  newPassword?: string;
  emailSentTo?: string;
  deliveryMethod?: string;
  error?: string;
  message?: string;
}

export type DurationOption =
  | '1 Day'
  | '2 Days'
  | '3 Days'
  | '5 Days'
  | '1 Week'
  | '15 Days'
  | '1 Month'
  | '3 Months'
  | '6 Months'
  | '1 Year'
  | 'Lifetime';
