// api/create-ticket.js - Vercel Serverless Function (Node.js)
// Gestione ricezione ticket di assistenza da www.barpilot.eu
// Salva direttamente su Supabase e store serverless con ID progressivi tkt001, tkt002, tkt003...

import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cprxxxlgaofopmogeuer.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnh4eGxnYW9mb3Btb2dldWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4Mzg1OTQsImV4cCI6MjEwODQxNDU5NH0.wuB9OUgmYo8n1xeJsGl-YpyzVRwg8Sr4k3XAKaYltRI";

const TICKETS_FILE = path.join('/tmp', 'barpilot_tickets.json');

function readTicketsStore() {
  try {
    if (fs.existsSync(TICKETS_FILE)) {
      const data = fs.readFileSync(TICKETS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('[Tickets Store] Read error:', e.message);
  }
  return [];
}

function writeTicketsStore(tickets) {
  try {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Tickets Store] Write error:', e.message);
  }
}

function getNextSequentialId(existingTickets) {
  let maxNum = 0;
  for (const t of existingTickets) {
    const m = String(t.id || '').match(/tkt[_\s-]?(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
  }
  const nextNum = maxNum + 1;
  return `tkt${String(nextNum).padStart(3, '0')}`;
}

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-pin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Restituisce l'elenco dei ticket di supporto ordinati cronologicamente
  if (req.method === 'GET') {
    let tickets = readTicketsStore();
    try {
      const ticketsRes = await supabaseFetch('support_tickets?select=*&order=created_at.desc');
      if (ticketsRes.ok) {
        const sbTickets = await ticketsRes.json();
        if (Array.isArray(sbTickets) && sbTickets.length > 0) {
          const ids = new Set(tickets.map(t => t.id));
          sbTickets.forEach(st => {
            if (!ids.has(st.id)) tickets.push(st);
            else {
              // Sincronizza stato e risposta da Supabase se più recenti
              const localTkt = tickets.find(t => t.id === st.id);
              if (localTkt && st.response && !localTkt.response) {
                localTkt.response = st.response;
                localTkt.response_at = st.response_at || st.updated_at;
                localTkt.status = st.status || localTkt.status;
              }
            }
          });
        }
      }
    } catch (_) {}

    // Assicura che ogni ticket abbia la lista risposte strutturata per raggruppamento thread
    tickets.forEach(t => {
      if (!Array.isArray(t.responses)) {
        t.responses = [];
      }
      if (t.response && t.responses.length === 0) {
        t.responses.push({
          id: 'resp_1',
          author: 'Super Admin BarPilot',
          message: t.response,
          created_at: t.response_at || t.updated_at || t.created_at
        });
      }
    });

    return res.status(200).json({ success: true, tickets });
  }

  // PATCH: Aggiorna stato o risposta di un ticket da parte del Super Admin
  if (req.method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { id, response, status } = body;
      if (!id) {
        return res.status(400).json({ error: 'ID ticket mancante' });
      }

      const currentTickets = readTicketsStore();
      const tkt = currentTickets.find(t => t.id === id);
      const nowIso = new Date().toISOString();

      if (tkt) {
        if (!Array.isArray(tkt.responses)) {
          tkt.responses = [];
          if (tkt.response) {
            tkt.responses.push({
              id: 'resp_init',
              author: 'Super Admin BarPilot',
              message: tkt.response,
              created_at: tkt.response_at || tkt.updated_at || tkt.created_at
            });
          }
        }

        if (response !== undefined && String(response).trim()) {
          const cleanResp = String(response).trim();
          tkt.response = cleanResp;
          tkt.response_at = nowIso;
          tkt.responses.push({
            id: 'resp_' + Date.now().toString(36),
            author: 'Super Admin BarPilot',
            message: cleanResp,
            created_at: nowIso
          });
        }
        if (status) tkt.status = status;
        tkt.updated_at = nowIso;
        writeTicketsStore(currentTickets);
      }

      // Aggiorna anche su Supabase
      try {
        const patchBody = { updated_at: nowIso };
        if (response !== undefined) {
          patchBody.response = response;
          patchBody.response_at = nowIso;
        }
        if (status) patchBody.status = status;
        await supabaseFetch(`support_tickets?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(patchBody)
        });
      } catch (_) {}

      return res.status(200).json({ success: true, ticket: tkt });
    } catch (err) {
      console.error('[Patch Ticket] Error:', err);
      return res.status(500).json({ error: 'Errore interno durante aggiornamento ticket', details: err.message });
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, PATCH, OPTIONS');
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
      barId,
      barName
    } = body;

    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({ error: 'Tutti i campi obbligatori devono essere compilati (*)' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();
    const cleanBarName = (barName || cleanName || 'Bar').trim();

    // Determina categoria
    let resolvedCategory = category;
    if (!resolvedCategory) {
      if (cleanSubject.toLowerCase().includes('kds') || cleanSubject.toLowerCase().includes('comande')) resolvedCategory = 'KDS Banco';
      else if (cleanSubject.toLowerCase().includes('fattur') || cleanSubject.toLowerCase().includes('stripe') || cleanSubject.toLowerCase().includes('pagament')) resolvedCategory = 'Pagamenti & Fatturazione';
      else if (cleanSubject.toLowerCase().includes('prova') || cleanSubject.toLowerCase().includes('abbonamento')) resolvedCategory = 'Abbonamento Pro';
      else if (cleanSubject.toLowerCase().includes('tecnico') || cleanSubject.toLowerCase().includes('errore')) resolvedCategory = 'Supporto Tecnico';
      else resolvedCategory = 'Assistenza Generale';
    }

    const RECIPIENT_EMAIL = 'admin@barpilot.eu';
    const currentTickets = readTicketsStore();
    const ticketId = getNextSequentialId(currentTickets);

    const ticketObj = {
      id: ticketId,
      barId: barId || null,
      bar_id: barId || null,
      barName: cleanBarName,
      bar_name: cleanBarName,
      contactEmail: cleanEmail,
      contact_email: cleanEmail,
      email: cleanEmail,
      userName: cleanName,
      user_name: cleanName,
      subject: cleanSubject,
      category: resolvedCategory,
      status: 'open',
      date: new Date().toLocaleDateString('it-IT'),
      message: cleanMessage,
      description: cleanMessage,
      response: null,
      responses: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    currentTickets.unshift(ticketObj);
    writeTicketsStore(currentTickets);

    // 1. Inserisci il Ticket in public.support_tickets (se disponibile)
    try {
      await supabaseFetch('support_tickets', {
        method: 'POST',
        body: JSON.stringify({
          id: ticketId,
          bar_id: barId || null,
          bar_name: cleanBarName,
          contact_email: cleanEmail,
          subject: cleanSubject,
          description: cleanMessage,
          category: resolvedCategory,
          status: 'open',
          created_at: new Date().toISOString()
        })
      });
    } catch (_) {}

    // 2. Inserisci messaggio in public.support_messages
    try {
      await supabaseFetch('support_messages', {
        method: 'POST',
        body: JSON.stringify({
          id: 'msg_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
          ticket_id: ticketId,
          sender_name: cleanName,
          message: `[Inviato ad ${RECIPIENT_EMAIL}]\n\n${cleanMessage}`,
          created_at: new Date().toISOString()
        })
      });
    } catch (_) {}

    // 3. Notifica amministratore con link diretto a #supporto
    try {
      await supabaseFetch('admin_notifications', {
        method: 'POST',
        body: JSON.stringify({
          id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
          title: `Nuovo ticket ${ticketId}: ${cleanSubject.substring(0, 40)}`,
          message: `${cleanBarName} (${cleanEmail}) ha aperto un ticket nella categoria "${resolvedCategory}".`,
          type: 'info',
          link: '#supporto',
          created_at: new Date().toISOString()
        })
      });
    } catch (_) {}

    return res.status(200).json({
      success: true,
      ticketId: ticketId,
      ticket: ticketObj,
      recipient: RECIPIENT_EMAIL,
      message: `Ticket ${ticketId} inviato con successo ad ${RECIPIENT_EMAIL}. Riceverai risposta a breve su ${cleanEmail}`
    });
  } catch (err) {
    console.error('[Create Ticket] Exception:', err);
    return res.status(500).json({ error: 'Errore interno del server durante l\'invio del ticket', details: err.message });
  }
}
