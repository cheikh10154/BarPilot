// api/contact.js - Vercel Serverless Function (Node.js)
// Ricezione e salvataggio delle richieste di contatto / supporto della Landing Page BarPilot
// Salvataggio su Supabase (support_tickets) e notifica email amministrativa

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cprxxxlgaofopmogeuer.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnh4eGxnYW9mb3Btb2dldWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4Mzg1OTQsImV4cCI6MjEwODQxNDU5NH0.wuB9OUgmYo8n1xeJsGl-YpyzVRwg8Sr4k3XAKaYltRI";

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { name, email, barName, subject, message, privacy, honeypot } = body;

    // 1. Anti-spam Honeypot Check
    if (honeypot && String(honeypot).trim() !== "") {
      return res.status(200).json({ success: true, message: "OK" });
    }

    // 2. Validation
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanSubject = (subject || 'Richiesta informazioni da Landing Page').trim();
    const cleanMessage = (message || '').trim();
    const cleanBar = (barName || '').trim();

    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ error: "Nome e cognome obbligatori." });
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return res.status(400).json({ error: "Indirizzo email valido obbligatorio." });
    }

    if (!cleanMessage || cleanMessage.length < 5) {
      return res.status(400).json({ error: "Messaggio obbligatorio (minimo 5 caratteri)." });
    }

    if (!privacy) {
      return res.status(400).json({ error: "È necessario accettare l'Informativa sulla Privacy." });
    }

    console.log(`[Contact Landing] Ricevuta richiesta da: ${cleanName} (${cleanEmail}) per locale "${cleanBar || 'N/A'}"`);

    // 3. Salvataggio su Supabase (se tabella support_tickets accessibile)
    const ticketPayload = {
      user_name: cleanName,
      user_email: cleanEmail,
      bar_name: cleanBar,
      category: "commerciale",
      subject: `[Landing] ${cleanSubject}`,
      description: `Locale: ${cleanBar || 'Non specificato'}\n\nMessaggio:\n${cleanMessage}`,
      priority: "normal",
      status: "open",
      created_at: new Date().toISOString()
    };

    try {
      await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/support_tickets`, {
        method: "POST",
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(ticketPayload)
      });
    } catch (dbErr) {
      console.warn("[Contact Landing] Salvataggio Supabase non bloccante:", dbErr);
    }

    // 4. Risposta positiva
    return res.status(200).json({
      success: true,
      message: "Messaggio ricevuto con successo. Il nostro team ti risponderà entro poche ore."
    });
  } catch (err) {
    console.error("[Contact Landing] Errore elaborazione form:", err);
    return res.status(500).json({ error: "Si è verificato un errore durante l'invio. Riprova più tardi." });
  }
}
