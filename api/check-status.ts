// Vercel Serverless Function & Express Relay: /api/check-status
const DEFAULT_PAYMENT_API_BASE = 'https://payment-api-real.onrender.com';
const PAYMENT_API_KEY = process.env.PAYMENT_API_KEY || 'chhotu';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { uniqueid, baseUrl } = req.query || {};

  if (!uniqueid) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameter: uniqueid is required',
    });
  }

  const rawBase = String(baseUrl || DEFAULT_PAYMENT_API_BASE).trim().replace(/\/+$/, '');
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
}
