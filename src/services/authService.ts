import { AppConfig, LicenseRecord } from '../types';

export interface VerifyKeyResult {
  ok: boolean;
  error?: string;
  license?: Partial<LicenseRecord>;
  source?: 'master_key' | 'database' | 'supabase';
}

export interface RegisterKeyResult {
  ok: boolean;
  key?: string;
  error?: string;
}

export async function fetchAppConfig(): Promise<AppConfig> {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('Failed to fetch config');
    return await res.json();
  } catch (err) {
    console.error('fetchAppConfig error:', err);
    return {
      apiKey: 'FRK-PRO-MASTER-KEY-2026',
      adminPassword: 'admin',
      recoveryEmail: 'emailwaqas7@gmail.com',
      supabaseUrl: '',
      supabaseAnonKey: '',
      authMode: 'local',
      allowMasterApiKeyBypass: true,
    };
  }
}

export async function updateAppConfig(
  password: string,
  newConfig: Partial<AppConfig>
): Promise<{ ok: boolean; error?: string; config?: AppConfig }> {
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, newConfig }),
    });
    return await res.json();
  } catch {
    return { ok: false, error: 'Network error updating configuration.' };
  }
}

export async function verifyLicenseKey(key: string, device: string): Promise<VerifyKeyResult> {
  try {
    const res = await fetch('/api/verify-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, device }),
    });
    const data = await res.json();
    return data;
  } catch {
    return { ok: false, error: 'Connection failed. Please check your internet.' };
  }
}

export async function registerLicenseKey(data: {
  full_name: string;
  phone: string;
  email: string;
  txid: string;
  amount: string;
}): Promise<RegisterKeyResult> {
  try {
    const res = await fetch('/api/register-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    return result;
  } catch {
    return { ok: false, error: 'Registration failed. Check connection.' };
  }
}

export async function adminLogin(password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return await res.json();
  } catch {
    return { ok: false, error: 'Admin login request failed.' };
  }
}

export async function resetAdminPassword(
  email?: string
): Promise<{ ok: boolean; newPassword?: string; emailSentTo?: string; deliveryMethod?: string; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch {
    return { ok: false, error: 'Password reset request failed. Check network.' };
  }
}

export async function fetchAdminKeys(password: string): Promise<{ ok: boolean; keys?: LicenseRecord[]; error?: string }> {
  try {
    const res = await fetch('/api/admin/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return await res.json();
  } catch {
    return { ok: false, error: 'Failed to fetch licenses from backend.' };
  }
}

export async function performAdminAction(
  password: string,
  id: string,
  action: 'approve' | 'reset_devices' | 'remove_device' | 'block' | 'delete',
  duration?: string,
  max_devices?: number,
  deviceId?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, id, action, duration, max_devices, deviceId }),
    });
    return await res.json();
  } catch {
    return { ok: false, error: 'Admin action request failed.' };
  }
}

export async function adminCreateKey(
  password: string,
  data: {
    custom_key?: string;
    full_name: string;
    phone: string;
    email: string;
    duration: string;
    max_devices: number;
    status: 'pending' | 'approved';
  }
): Promise<{ ok: boolean; key?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/create-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, ...data }),
    });
    return await res.json();
  } catch {
    return { ok: false, error: 'Failed to create key.' };
  }
}
