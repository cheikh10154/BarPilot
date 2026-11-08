export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-pin, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  return res.status(200).json({ ok: true, version: '1.0' });
}
