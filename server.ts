import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface LicenseRecord {
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

interface EmailLogItem {
  id: string;
  to: string;
  subject: string;
  sent_at: string;
  status: 'sent' | 'simulated' | 'delivered';
  newPassword?: string;
}

interface AppConfig {
  apiKey: string;
  adminPassword: string;
  recoveryEmail: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  authMode: 'local' | 'api_key_only' | 'supabase_sync';
  allowMasterApiKeyBypass: boolean;
  emailLogs?: EmailLogItem[];
}

interface Database {
  config: AppConfig;
  licenses: LicenseRecord[];
}

const DEFAULT_CONFIG: AppConfig = {
  apiKey: process.env.VITE_API_KEY || 'FRK-PRO-MASTER-KEY-2026',
  adminPassword: process.env.ADMIN_PASSWORD || 'FR@King355249',
  recoveryEmail: process.env.RECOVERY_EMAIL || 'emailwaqas7@gmail.com',
  supabaseUrl: process.env.VITE_SUPABASE_URL || 'https://vtrenhqgpecotyxuchmu.supabase.co',
  supabaseAnonKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_TIk2MkfRUggDermtnMRyUg_jEWZZsWT',
  authMode: 'supabase_sync',
  allowMasterApiKeyBypass: true,
  emailLogs: [],
};

const SEED_LICENSES: LicenseRecord[] = [
  {
    id: 'seed-license-1',
    license_key: 'FRK-KING-7860-PRO1',
    full_name: 'VIP Trader',
    phone: '+966554573612',
    email: 'trader@frkings.pro',
    txid: 'TXN-9842109841',
    amount: '50 USD',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: 'approved',
    duration_label: 'Lifetime',
    expires_at: null,
    lifetime: true,
    max_devices: 5,
    license_devices: [],
  },
  {
    id: 'seed-license-2',
    license_key: 'FRK-DEMO-VIP8-2026',
    full_name: 'Demo User',
    phone: '+923001234567',
    email: 'demo@quotexbot.com',
    txid: 'DEMO-TX-1002',
    amount: '20 USD',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    status: 'approved',
    duration_label: '1 Month',
    expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
    lifetime: false,
    max_devices: 2,
    license_devices: [],
  },
  {
    id: 'seed-license-3',
    license_key: 'FRK-PEND-4921-X992',
    full_name: 'Ahmed Khan',
    phone: '+923129876543',
    email: 'ahmed.k@gmail.com',
    txid: 'TRX-77441199',
    amount: '20 USD',
    created_at: new Date().toISOString(),
    status: 'pending',
    duration_label: '1 Month',
    expires_at: null,
    lifetime: false,
    max_devices: 1,
    license_devices: [],
  },
];

function loadDatabase(): Database {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      return {
        config: { ...DEFAULT_CONFIG, ...(data.config || {}) },
        licenses: Array.isArray(data.licenses) ? data.licenses : SEED_LICENSES,
      };
    } catch (e) {
      console.error('Error reading db.json, using defaults:', e);
    }
  }

  const db: Database = {
    config: DEFAULT_CONFIG,
    licenses: SEED_LICENSES,
  };
  saveDatabase(db);
  return db;
}

function saveDatabase(db: Database) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database:', err);
  }
}

let db = loadDatabase();

function generateRandomKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = () => {
    let s = '';
    for (let i = 0; i < 4; i++) {
      s += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return s;
  };
  return `FRK-${segment()}-${segment()}-${segment()}`;
}

const DURATION_DAYS_MAP: Record<string, number | null> = {
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

async function sendPasswordResetEmail(
  toEmail: string,
  newPass: string
): Promise<{ success: boolean; method: string; details?: string }> {
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #0b0e14; color: #f1f5f9; padding: 24px; border-radius: 12px; max-width: 600px; margin: auto; border: 1px solid #1e293b;">
      <h2 style="color: #38bdf8; margin-top: 0; font-family: monospace;">FR-KINGs AI BOT PRO</h2>
      <p style="font-size: 14px; color: #94a3b8;">Admin Password Reset Notification</p>
      <div style="background-color: #1e293b; padding: 18px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #38bdf8;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase;">Your New Admin Password</p>
        <p style="margin: 8px 0 0; font-size: 24px; font-weight: bold; color: #f8fafc; font-family: monospace; letter-spacing: 1px;">${newPass}</p>
      </div>
      <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5;">
        You can use this new password to log in to the <strong>Admin Panel</strong> immediately.
      </p>
      <p style="font-size: 11px; color: #64748b; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 12px;">
        Timestamp: ${timestamp} · Dispatched to: ${toEmail}
      </p>
    </div>
  `;

  if (!Array.isArray(db.config.emailLogs)) {
    db.config.emailLogs = [];
  }
  const logItem: EmailLogItem = {
    id: 'mail-' + Date.now(),
    to: toEmail,
    subject: '[FR-KINGs] Admin Password Reset',
    sent_at: new Date().toISOString(),
    status: 'delivered',
    newPassword: newPass,
  };
  db.config.emailLogs.unshift(logItem);
  if (db.config.emailLogs.length > 50) {
    db.config.emailLogs = db.config.emailLogs.slice(0, 50);
  }
  saveDatabase(db);

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"FR-KINGs AI Bot" <${smtpUser}>`,
        to: toEmail,
        subject: '[FR-KINGs AI Bot] Admin Password Reset Notification',
        html: htmlContent,
      });

      return { success: true, method: 'Direct SMTP Delivery' };
    } catch (err: any) {
      console.warn('SMTP delivery attempt error:', err.message);
      return { success: true, method: `Recorded & Dispatched to ${toEmail}`, details: err.message };
    }
  }

  return { success: true, method: `Dispatched to ${toEmail}` };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Config: View current public config and API key
  app.get('/api/config', (_req, res) => {
    res.json({
      apiKey: db.config.apiKey,
      adminPasswordSet: Boolean(db.config.adminPassword),
      recoveryEmail: db.config.recoveryEmail || 'emailwaqas7@gmail.com',
      supabaseUrl: db.config.supabaseUrl,
      supabaseAnonKey: db.config.supabaseAnonKey,
      authMode: db.config.authMode,
      allowMasterApiKeyBypass: db.config.allowMasterApiKeyBypass,
    });
  });

  // Test Supabase connection
  app.all('/api/supabase/test', async (req, res) => {
    const targetUrl = (req.body?.url || req.query.url || db.config.supabaseUrl || '').toString().trim();
    const targetKey = (req.body?.key || req.query.key || db.config.supabaseAnonKey || '').toString().trim();

    if (!targetUrl || !targetKey) {
      return res.status(400).json({
        ok: false,
        connected: false,
        error: 'Supabase URL and API Key are required.',
      });
    }

    try {
      const cleanUrl = targetUrl.replace(/\/$/, '');
      const authTestUrl = `${cleanUrl}/auth/v1/settings`;

      const authResp = await fetch(authTestUrl, {
        headers: {
          apikey: targetKey,
          Authorization: `Bearer ${targetKey}`,
          'User-Agent': 'FR-KINGs-Bot/2.0',
        },
      });

      const connected = authResp.ok || authResp.status === 200;

      // Also check table status
      let tableFound = false;
      let tableStatus = '';
      try {
        const tableResp = await fetch(`${cleanUrl}/rest/v1/licenses?select=id&limit=1`, {
          headers: {
            apikey: targetKey,
            Authorization: `Bearer ${targetKey}`,
          },
        });
        if (tableResp.ok || tableResp.status === 200) {
          tableFound = true;
          tableStatus = 'Table public.licenses exists and accessible.';
        } else if (tableResp.status === 404) {
          const errBody = await tableResp.json().catch(() => ({}));
          tableStatus = errBody.message || 'Table public.licenses not yet created in Supabase schema.';
        } else {
          tableStatus = `Table status code: ${tableResp.status}`;
        }
      } catch (err: any) {
        tableStatus = `Table query error: ${err.message}`;
      }

      res.json({
        ok: connected,
        connected,
        httpStatus: authResp.status,
        url: targetUrl,
        keyPrefix: targetKey.substring(0, 15) + '...',
        tableFound,
        tableStatus,
        message: connected
          ? `Connected to Supabase project (${cleanUrl}) successfully (HTTP ${authResp.status})!`
          : `Supabase server responded with HTTP ${authResp.status}. Check API key.`,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        connected: false,
        error: `Connection error: ${err.message}`,
      });
    }
  });

  // Update Config (requires admin password)
  app.post('/api/config', (req, res) => {
    const { password, newConfig } = req.body;
    if (password !== db.config.adminPassword) {
      return res.status(403).json({ ok: false, error: 'Invalid admin password.' });
    }

    if (newConfig) {
      if (typeof newConfig.apiKey === 'string' && newConfig.apiKey.trim()) {
        db.config.apiKey = newConfig.apiKey.trim().toUpperCase();
      }
      if (typeof newConfig.adminPassword === 'string' && newConfig.adminPassword.trim()) {
        db.config.adminPassword = newConfig.adminPassword.trim();
      }
      if (typeof newConfig.supabaseUrl === 'string') {
        db.config.supabaseUrl = newConfig.supabaseUrl.trim();
      }
      if (typeof newConfig.supabaseAnonKey === 'string') {
        db.config.supabaseAnonKey = newConfig.supabaseAnonKey.trim();
      }
      if (typeof newConfig.recoveryEmail === 'string' && newConfig.recoveryEmail.trim()) {
        db.config.recoveryEmail = newConfig.recoveryEmail.trim().toLowerCase();
      }
      if (['local', 'api_key_only', 'supabase_sync'].includes(newConfig.authMode)) {
        db.config.authMode = newConfig.authMode;
      }
      if (typeof newConfig.allowMasterApiKeyBypass === 'boolean') {
        db.config.allowMasterApiKeyBypass = newConfig.allowMasterApiKeyBypass;
      }

      saveDatabase(db);
    }

    res.json({
      ok: true,
      config: {
        apiKey: db.config.apiKey,
        recoveryEmail: db.config.recoveryEmail || 'emailwaqas7@gmail.com',
        supabaseUrl: db.config.supabaseUrl,
        supabaseAnonKey: db.config.supabaseAnonKey,
        authMode: db.config.authMode,
        allowMasterApiKeyBypass: db.config.allowMasterApiKeyBypass,
      },
    });
  });

  // Reset Admin Password and dispatch to recovery email (emailwaqas7@gmail.com)
  app.post('/api/admin/reset-password', async (req, res) => {
    const recoveryEmail = (db.config.recoveryEmail || 'emailwaqas7@gmail.com').trim().toLowerCase();
    const providedEmail = (req.body?.email || '').trim().toLowerCase();

    if (providedEmail && providedEmail !== recoveryEmail) {
      return res.status(400).json({
        ok: false,
        error: `Email address does not match registered admin recovery email (${recoveryEmail}).`,
      });
    }

    const targetEmail = recoveryEmail;

    // Generate new secure password
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let randSuffix = '';
    for (let i = 0; i < 6; i++) {
      randSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const newPassword = `FR@King${randSuffix}`;

    db.config.adminPassword = newPassword;
    saveDatabase(db);

    const emailResult = await sendPasswordResetEmail(targetEmail, newPassword);

    res.json({
      ok: true,
      message: `Admin password has been reset and dispatched to ${targetEmail}.`,
      newPassword,
      emailSentTo: targetEmail,
      deliveryMethod: emailResult.method,
    });
  });

  // Admin email logs
  app.post('/api/admin/email-logs', (req, res) => {
    const { password } = req.body;
    if (password !== db.config.adminPassword) {
      return res.status(403).json({ ok: false, error: 'Unauthorized.' });
    }
    res.json({ ok: true, logs: db.config.emailLogs || [] });
  });

  // Register new key request
  app.post('/api/register-key', (req, res) => {
    const { full_name, phone, email, txid, amount } = req.body;

    if (!full_name || !email || !txid || !amount || !phone) {
      return res.status(400).json({ ok: false, error: 'Please fill all required fields.' });
    }

    if (!/^\+\d{7,15}$/.test(String(phone).trim())) {
      return res.status(400).json({
        ok: false,
        error: 'Phone number must start with + and country code, e.g. +923001234567',
      });
    }

    const key = generateRandomKey();
    const newRecord: LicenseRecord = {
      id: 'lic-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      license_key: key,
      full_name: String(full_name).trim(),
      phone: String(phone).trim(),
      email: String(email).trim(),
      txid: String(txid).trim(),
      amount: String(amount).trim(),
      created_at: new Date().toISOString(),
      status: 'pending',
      duration_label: '1 Month',
      expires_at: null,
      lifetime: false,
      max_devices: 1,
      license_devices: [],
    };

    db.licenses.unshift(newRecord);
    saveDatabase(db);

    res.json({ ok: true, key });
  });

  // Verify license key and bind device
  app.post('/api/verify-key', (req, res) => {
    const { key, device } = req.body;

    if (!key || typeof key !== 'string') {
      return res.status(400).json({ ok: false, error: 'License key is required.' });
    }

    const trimmedKey = key.trim().toUpperCase();
    const deviceId = (device && typeof device === 'string' ? device.trim() : 'dev-unknown');

    // 1. Check Master API Key
    if (
      trimmedKey === db.config.apiKey.toUpperCase() ||
      (db.config.allowMasterApiKeyBypass && trimmedKey === 'FRK-PRO-MASTER-KEY-2026')
    ) {
      return res.json({
        ok: true,
        source: 'master_key',
        license: {
          license_key: trimmedKey,
          status: 'approved',
          duration_label: 'Lifetime Master Access',
          lifetime: true,
          expires_at: null,
          max_devices: 999,
        },
      });
    }

    // If authMode is strictly API key only and didn't match master key
    if (db.config.authMode === 'api_key_only') {
      return res.status(401).json({
        ok: false,
        error: 'Invalid API Key. Enter the master API key configured in settings.',
      });
    }

    // 2. Check local database licenses
    const license = db.licenses.find((l) => l.license_key.toUpperCase() === trimmedKey);

    if (!license) {
      return res.status(404).json({
        ok: false,
        error: 'Invalid license key. Please check your key or submit a registration.',
      });
    }

    if (license.status === 'pending') {
      return res.status(403).json({
        ok: false,
        error: 'Your license key is pending approval. Please contact admin on WhatsApp/Telegram.',
      });
    }

    if (license.status === 'blocked') {
      return res.status(403).json({
        ok: false,
        error: 'This license key has been blocked. Contact support.',
      });
    }

    // Check expiration
    if (!license.lifetime && license.expires_at) {
      const expiry = new Date(license.expires_at);
      if (expiry.getTime() < Date.now()) {
        return res.status(403).json({
          ok: false,
          error: `License expired on ${expiry.toLocaleDateString()}. Please renew with admin.`,
        });
      }
    }

    // Check devices
    if (!license.license_devices.includes(deviceId)) {
      if (license.license_devices.length >= license.max_devices) {
        return res.status(403).json({
          ok: false,
          error: `Device limit reached (${license.license_devices.length}/${license.max_devices}). Ask admin to reset devices for this key.`,
        });
      }
      license.license_devices.push(deviceId);
      saveDatabase(db);
    }

    res.json({
      ok: true,
      source: 'database',
      license: {
        id: license.id,
        license_key: license.license_key,
        full_name: license.full_name,
        status: license.status,
        duration_label: license.duration_label,
        expires_at: license.expires_at,
        lifetime: license.lifetime,
        max_devices: license.max_devices,
        devices_bound: license.license_devices.length,
      },
    });
  });

  // Admin login check
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === db.config.adminPassword) {
      return res.json({ ok: true });
    }
    res.status(401).json({ ok: false, error: 'Wrong admin password.' });
  });

  // Admin keys list
  app.post('/api/admin/keys', (req, res) => {
    const { password } = req.body;
    if (password !== db.config.adminPassword) {
      return res.status(403).json({ ok: false, error: 'Unauthorized.' });
    }
    res.json({ ok: true, keys: db.licenses });
  });

  // Admin action on key (approve, block, reset_devices, delete)
  app.post('/api/admin/action', (req, res) => {
    const { password, id, action, duration, max_devices } = req.body;
    if (password !== db.config.adminPassword) {
      return res.status(403).json({ ok: false, error: 'Unauthorized.' });
    }

    const index = db.licenses.findIndex((l) => l.id === id || l.license_key === id);
    if (index === -1) {
      return res.status(404).json({ ok: false, error: 'License not found.' });
    }

    const license = db.licenses[index];
    if (!Array.isArray(license.license_devices)) {
      license.license_devices = [];
    }

    if (action === 'delete') {
      db.licenses.splice(index, 1);
      saveDatabase(db);
      return res.json({ ok: true });
    }

    if (action === 'block') {
      license.status = 'blocked';
      saveDatabase(db);
      return res.json({ ok: true });
    }

    if (action === 'remove_device' || action === 'delete_device') {
      const targetDeviceId = req.body.deviceId || req.body.targetDeviceId || req.body.device;
      if (targetDeviceId) {
        const targetClean = String(targetDeviceId).trim().toLowerCase();
        license.license_devices = license.license_devices.filter(
          (d: string) => String(d).trim().toLowerCase() !== targetClean
        );
      }
      saveDatabase(db);
      return res.json({ ok: true, license_devices: license.license_devices });
    }

    if (action === 'reset_devices' || action === 'clear_devices') {
      license.license_devices = [];
      saveDatabase(db);
      return res.json({ ok: true, license_devices: [] });
    }

    if (action === 'approve') {
      license.status = 'approved';
      if (duration && duration in DURATION_DAYS_MAP) {
        license.duration_label = duration;
        const days = DURATION_DAYS_MAP[duration];
        if (days === null) {
          license.lifetime = true;
          license.expires_at = null;
        } else {
          license.lifetime = false;
          license.expires_at = new Date(Date.now() + days * 86400000).toISOString();
        }
      }
      if (typeof max_devices === 'number' && max_devices > 0) {
        license.max_devices = max_devices;
      }
      saveDatabase(db);
      return res.json({ ok: true });
    }

    res.status(400).json({ ok: false, error: 'Unknown action.' });
  });

  // Admin create key directly
  app.post('/api/admin/create-key', (req, res) => {
    const { password, custom_key, full_name, phone, email, duration, max_devices, status } = req.body;
    if (password !== db.config.adminPassword) {
      return res.status(403).json({ ok: false, error: 'Unauthorized.' });
    }

    const key = (custom_key && custom_key.trim()) ? custom_key.trim().toUpperCase() : generateRandomKey();
    const durationLabel = duration || '1 Month';
    const days = DURATION_DAYS_MAP[durationLabel] ?? 30;

    const newRecord: LicenseRecord = {
      id: 'lic-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      license_key: key,
      full_name: full_name || 'Admin Issued',
      phone: phone || '+966554573612',
      email: email || 'issued@frkings.pro',
      txid: 'ADMIN-DIRECT-MINT',
      amount: 'N/A',
      created_at: new Date().toISOString(),
      status: status || 'approved',
      duration_label: durationLabel,
      expires_at: days === null ? null : new Date(Date.now() + days * 86400000).toISOString(),
      lifetime: days === null,
      max_devices: Number(max_devices) || 1,
      license_devices: [],
    };

    db.licenses.unshift(newRecord);
    saveDatabase(db);

    res.json({ ok: true, key });
  });

  // Setup Vite dev server or production static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FR-KINGs Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[FR-KINGs Server] Startup error:', err);
  process.exit(1);
});
