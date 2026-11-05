// api/create-ticket.js - Vercel Serverless Function (Node.js)
// Gestione ricezione ticket di assistenza da www.barpilot.eu
// Salva direttamente su Supabase nelle tabelle support_tickets, support_messages e admin_audit_logs

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cprxxxlgaofopmogeuer.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnh4eGxnYW9mb3Btb2dldWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4Mzg1OTQsImV4cCI6MjEwODQxNDU5NH0.wuB9OUgmYo8n1xeJsGl-YpyzVRwg8Sr4k3XAKaYltRI";

async function supabaseFetch(endpoint, options = {}) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=representation',
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const {
      fullName,
      email,
      subject,
      message,
      category,
      priority = 'medium',
      barId
    } = body;

    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({ error: 'Tutti i campi obbligatori devono essere compilati (*)' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    // Determina categoria
    let resolvedCategory = category;
    if (!resolvedCategory) {
      if (cleanSubject.toLowerCase().includes('kds') || cleanSubject.toLowerCase().includes('comande')) resolvedCategory = 'KDS Banco';
      else if (cleanSubject.toLowerCase().includes('fattur') || cleanSubject.toLowerCase().includes('stripe') || cleanSubject.toLowerCase().includes('pagament')) resolvedCategory = 'Pagamenti & Fatturazione';
      else if (cleanSubject.toLowerCase().includes('prova') || cleanSubject.toLowerCase().includes('abbonamento')) resolvedCategory = 'Abbonamento Pro';
      else if (cleanSubject.toLowerCase().includes('tecnico') || cleanSubject.toLowerCase().includes('errore')) resolvedCategory = 'Supporto Tecnico';
      else resolvedCategory = 'Assistenza Generale';
    }

    const ticketId = 'tkt_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

    // 1. Inserisci il Ticket in public.support_tickets
    const ticketPayload = {
      id: ticketId,
      bar_id: barId || null,
      subject: cleanSubject,
      description: `Mittente: ${cleanName} (${cleanEmail})\n\nMessaggio:\n${cleanMessage}`,
      category: resolvedCategory,
      priority: priority,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const ticketRes = await supabaseFetch('support_tickets', {
      method: 'POST',
      body: JSON.stringify(ticketPayload)
    });

    if (!ticketRes.ok) {
      console.warn('[Create Ticket] Warning on support_tickets insert:', await ticketRes.text());
    }

    // 2. Inserisci il primo messaggio in public.support_messages
    const messagePayload = {
      id: 'msg_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
      ticket_id: ticketId,
      sender_name: cleanName,
      message: cleanMessage,
      created_at: new Date().toISOString()
    };

    await supabaseFetch('support_messages', {
      method: 'POST',
      body: JSON.stringify(messagePayload)
    });

    // 3. Registra log su public.admin_audit_logs
    await supabaseFetch('admin_audit_logs', {
      method: 'POST',
      body: JSON.stringify({
        id: 'log_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
        admin_id: 'system_contact_form',
        action: 'support_ticket_opened',
        entity_type: 'ticket',
        entity_id: ticketId,
        new_values: {
          fullName: cleanName,
          email: cleanEmail,
          subject: cleanSubject,
          category: resolvedCategory,
          priority: priority
        },
        created_at: new Date().toISOString()
      })
    });

    return res.status(200).json({
      success: true,
      ticketId: ticketId,
      message: 'Ticket aperto con successo. Riceverai risposta a breve su ' + cleanEmail
    });
  } catch (err) {
    console.error('[Create Ticket] Exception:', err);
    return res.status(500).json({ error: 'Errore interno del server durante l\'invio del ticket', details: err.message });
  }
}
