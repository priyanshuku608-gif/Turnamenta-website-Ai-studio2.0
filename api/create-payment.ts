// Vercel Serverless Function & Express Relay: /api/create-payment
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

  const { amount, uniqueid, baseUrl } = req.query || {};

  if (!amount || !uniqueid) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters: amount and uniqueid are required',
    });
  }

  const rawBase = String(baseUrl || DEFAULT_PAYMENT_API_BASE).trim().replace(/\/+$/, '');
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
}
