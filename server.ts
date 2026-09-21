import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

const PAYMENT_API_BASE = 'https://payment-api-real.onrender.com';
const PAYMENT_API_KEY = process.env.PAYMENT_API_KEY || 'chhotu';

// Basic middleware
app.use(express.json());

// CORS headers for all API requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 1. CREATE PAYMENT RELAY
// GET /api/create-payment?amount={amount}&uniqueid={uniqueid}&baseUrl={baseUrl}
app.get('/api/create-payment', async (req, res) => {
  const { amount, uniqueid, baseUrl } = req.query;

  if (!amount || !uniqueid) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters: amount and uniqueid are required',
    });
  }

  const rawBase = String(baseUrl || PAYMENT_API_BASE).trim().replace(/\/+$/, '');
  let baseWithProtocol = rawBase;
  if (!baseWithProtocol.startsWith('http://') && !baseWithProtocol.startsWith('https://')) {
    baseWithProtocol = `https://${baseWithProtocol}`;
  }

  const targetUrl = `${baseWithProtocol}/create_payment?amount=${encodeURIComponent(
    String(amount)
  )}&uniqueid=${encodeURIComponent(String(uniqueid))}&key=${encodeURIComponent(PAYMENT_API_KEY)}`;

  // 75-second timeout window specifically to accommodate Render free-tier cold starts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 75000);

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BattlePro-Relay/1.0',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await upstreamRes.json();
    return res.status(upstreamRes.status).json(data);
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error('Relay error (/api/create-payment):', err.message);

    if (err.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        message: 'Payment gateway timed out while waking up. Please try again.',
      });
    }

    return res.status(502).json({
      success: false,
      message: 'Payment gateway connection error: ' + (err.message || 'Unknown network error'),
    });
  }
});

// 2. CHECK PAYMENT STATUS RELAY
// GET /api/check-status?uniqueid={uniqueid}&baseUrl={baseUrl}
app.get('/api/check-status', async (req, res) => {
  const { uniqueid, baseUrl } = req.query;

  if (!uniqueid) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameter: uniqueid is required',
    });
  }

  const rawBase = String(baseUrl || PAYMENT_API_BASE).trim().replace(/\/+$/, '');
  let baseWithProtocol = rawBase;
  if (!baseWithProtocol.startsWith('http://') && !baseWithProtocol.startsWith('https://')) {
    baseWithProtocol = `https://${baseWithProtocol}`;
  }

  const targetUrl = `${baseWithProtocol}/check_status?uniqueid=${encodeURIComponent(
    String(uniqueid)
  )}&key=${encodeURIComponent(PAYMENT_API_KEY)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 75000);

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BattlePro-Relay/1.0',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await upstreamRes.json();
    return res.status(upstreamRes.status).json(data);
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error('Relay error (/api/check-status):', err.message);

    if (err.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        message: 'Payment gateway status check timed out.',
      });
    }

    return res.status(502).json({
      success: false,
      message: 'Payment gateway status check error: ' + (err.message || 'Unknown network error'),
    });
  }
});

// 3. SEND OTP RELAY (Proxies requests to the admin-configured OTP API Base URL)
// GET /api/send-otp?email={email}&baseUrl={baseUrl}
app.get('/api/send-otp', async (req, res) => {
  const { email, baseUrl } = req.query;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameter: email is required',
    });
  }

  const rawBase = String(baseUrl || 'http://battlepro.infinityfree.io/').trim();
  let baseWithProtocol = rawBase;
  if (!baseWithProtocol.startsWith('http://') && !baseWithProtocol.startsWith('https://')) {
    baseWithProtocol = `http://${baseWithProtocol}`;
  }

  let targetUrl: string;
  try {
    const parsed = new URL(baseWithProtocol);
    parsed.searchParams.set('email', String(email).trim());
    targetUrl = parsed.toString();
  } catch {
    const sep = baseWithProtocol.includes('?') ? '&' : '?';
    targetUrl = `${baseWithProtocol}${sep}email=${encodeURIComponent(String(email).trim())}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Connection: 'keep-alive',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await upstreamRes.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        try {
          data = JSON.parse(text.slice(startIdx, endIdx + 1));
        } catch {}
      }
    }

    if (!data) {
      return res.status(502).json({
        success: false,
        message: 'The OTP gateway returned a non-JSON response. Please verify the OTP API URL in Admin Settings.',
        raw: text.slice(0, 200),
      });
    }

    return res.status(upstreamRes.status).json(data);
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error('Relay error (/api/send-otp):', err.message);

    if (err.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        message: 'OTP gateway timed out. Please try again.',
      });
    }

    return res.status(502).json({
      success: false,
      message: 'OTP service error: ' + (err.message || 'Unknown network error'),
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Development mode: Vite dev server as middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Rewrite /admin to /admin.html for Vite dev server
    app.use((req, _res, next) => {
      if (req.url) {
        const [pathname, search] = req.url.split('?');
        if (pathname === '/admin' || pathname === '/admin/') {
          req.url = '/admin.html' + (search ? `?${search}` : '');
        }
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    // Production mode: Static file serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    app.get('/admin', (_req, res) => {
      res.sendFile(path.join(distPath, 'admin.html'));
    });
    app.get('/admin.html', (_req, res) => {
      res.sendFile(path.join(distPath, 'admin.html'));
    });
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BattlePro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
