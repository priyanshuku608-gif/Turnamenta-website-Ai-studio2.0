// Vercel Serverless Function & Express Relay: /api/send-otp
export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { email, baseUrl } = req.query || {};

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameter: email is required',
    });
  }

  const cleanEmail = String(email).trim();
  const rawBase = String(baseUrl || 'http://battlepro.infinityfree.io/').trim();
  let baseWithProtocol = rawBase;
  if (!baseWithProtocol.startsWith('http://') && !baseWithProtocol.startsWith('https://')) {
    baseWithProtocol = `http://${baseWithProtocol}`;
  }

  let targetUrl: string;
  try {
    const parsed = new URL(baseWithProtocol);
    parsed.searchParams.set('email', cleanEmail);
    targetUrl = parsed.toString();
  } catch {
    const sep = baseWithProtocol.includes('?') ? '&' : '?';
    targetUrl = `${baseWithProtocol}${sep}email=${encodeURIComponent(cleanEmail)}`;
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
      // Sometimes upstream hosts prepend or append HTML/whitespace/BOM
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        try {
          data = JSON.parse(text.slice(startIdx, endIdx + 1));
        } catch {
          // parse failed
        }
      }
    }

    if (!data) {
      console.error('OTP Gateway non-JSON body:', text.slice(0, 300));
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
        message: 'OTP gateway timed out. Please try again in a few moments.',
      });
    }

    return res.status(502).json({
      success: false,
      message: 'OTP service connection error: ' + (err.message || 'Unknown network error'),
    });
  }
}
