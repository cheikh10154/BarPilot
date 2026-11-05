// api/generate-invoice.js - Vercel Serverless Function (Node.js)
// Generazione dinamica fatture fiscali B2B dal database Supabase
// Fornitore: BarPilot · Gestionale per Bar & Ristoranti (P.IVA 02799820036 · admin@barpilot.eu)
// Supporta entrambe le varianti:
// 1. "post_trial": Prima fattura dopo la scadenza dei 14 giorni di prova gratuita
// 2. "recurring": Fattura mensile ricorrente (default)

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cprxxxlgaofopmogeuer.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnh4eGxnYW9mb3Btb2dldWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4Mzg1OTQsImV4cCI6MjEwODQxNDU5NH0.wuB9OUgmYo8n1xeJsGl-YpyzVRwg8Sr4k3XAKaYltRI";

async function supabaseFetch(endpoint) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };
  return fetch(url, { headers });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { id, number, bar_id, variant = 'recurring', format = 'html' } = req.query;

    // 1. Recupera impostazioni aziendali da admin_settings
    let compName = "BarPilot · Gestionale per Bar & Ristoranti";
    let compPiva = "02799820036";
    let compEmail = "admin@barpilot.eu";
    let compWebsite = "www.barpilot.eu";

    try {
      const setRes = await supabaseFetch('admin_settings?select=*');
      if (setRes.ok) {
        const settings = await setRes.json();
        if (Array.isArray(settings)) {
          settings.forEach(s => {
            if (s.setting_key === 'company_name') compName = s.setting_value;
            if (s.setting_key === 'company_piva') compPiva = s.setting_value;
            if (s.setting_key === 'billing_email') compEmail = s.setting_value;
            if (s.setting_key === 'company_website') compWebsite = s.setting_value;
          });
        }
      }
    } catch (e) {
      console.warn('[Invoice] Settings fallback:', e);
    }

    // 2. Trova la fattura su Supabase
    let invoice = null;
    if (id) {
      const invRes = await supabaseFetch(`invoices?id=eq.${encodeURIComponent(id)}&select=*`);
      if (invRes.ok) {
        const rows = await invRes.json();
        if (rows.length > 0) invoice = rows[0];
      }
    } else if (number) {
      const invRes = await supabaseFetch(`invoices?invoice_number=eq.${encodeURIComponent(number)}&select=*`);
      if (invRes.ok) {
        const rows = await invRes.json();
        if (rows.length > 0) invoice = rows[0];
      }
    } else if (bar_id) {
      const invRes = await supabaseFetch(`invoices?bar_id=eq.${encodeURIComponent(bar_id)}&order=created_at.desc&limit=1&select=*`);
      if (invRes.ok) {
        const rows = await invRes.json();
        if (rows.length > 0) invoice = rows[0];
      }
    }

    // 3. Trova i dati del Bar su Supabase
    let bar = null;
    const targetBarId = invoice?.bar_id || bar_id;
    if (targetBarId) {
      const barRes = await supabaseFetch(`bars?id=eq.${encodeURIComponent(targetBarId)}&select=*`);
      if (barRes.ok) {
        const rows = await barRes.json();
        if (rows.length > 0) bar = rows[0];
      }
    }

    // 4. Trova i dati abbonamento
    let sub = null;
    if (targetBarId) {
      const subRes = await supabaseFetch(`subscriptions?bar_id=eq.${encodeURIComponent(targetBarId)}&order=created_at.desc&limit=1&select=*`);
      if (subRes.ok) {
        const rows = await subRes.json();
        if (rows.length > 0) sub = rows[0];
      }
    }

    // Dati di fallback per anteprima istantanea se non presente
    const invNumber = invoice?.invoice_number || number || (variant === 'post_trial' ? '#2026-0004' : '#2026-0001');
    const invDate = invoice?.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('it-IT') : new Date().toLocaleDateString('it-IT');
    const dueDate = invoice?.due_date ? new Date(invoice.due_date).toLocaleDateString('it-IT') : invDate;
    const subtotal = Number(invoice?.amount_subtotal || 48.36);
    const tax = Number(invoice?.amount_tax || 10.64);
    const total = Number(invoice?.amount_total || 59.00);
    const status = invoice?.status || 'paid';

    const businessName = bar?.business_name || bar?.name || 'Bar Centrale S.r.l.';
    const barName = bar?.name || 'Bar Centrale';
    const ownerName = bar?.owner || 'Marco Bianchi';
    const piva = bar?.vat_number || bar?.tax_code || '09876543210';
    const taxCode = bar?.tax_code || '';
    const address = bar?.address || 'Via del Corso 142';
    const city = bar?.city || 'Roma';
    const postalCode = bar?.postal_code || '00186';
    const email = bar?.email || 'admin@barpilot.eu';
    const sdiCode = bar?.sdi_code || '0000000';

    const isPostTrial = variant === 'post_trial' || invoice?.is_trial_end || false;
    const trialPeriod = sub?.trial_start && sub?.trial_end
      ? `${new Date(sub.trial_start).toLocaleDateString('it-IT')} - ${new Date(sub.trial_end).toLocaleDateString('it-IT')} (14 giorni)`
      : '05/11/2026 - 19/11/2026 (14 giorni)';
    const period = sub?.current_period_start && sub?.current_period_end
      ? `${new Date(sub.current_period_start).toLocaleDateString('it-IT')} - ${new Date(sub.current_period_end).toLocaleDateString('it-IT')}`
      : (isPostTrial ? '19/11/2026 - 18/12/2026' : '15/10/2026 - 14/11/2026');

    if (format === 'json') {
      return res.status(200).json({
        company: { name: compName, piva: compPiva, email: compEmail, website: compWebsite },
        customer: { businessName, barName, ownerName, piva, taxCode, sdiCode, address, city, postalCode, email },
        invoice: { number: invNumber, date: invDate, dueDate, subtotal, tax, total, status, variant: isPostTrial ? 'post_trial' : 'recurring', period, trialPeriod }
      });
    }

    // Render HTML A4 Printable
    const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Fattura ${invNumber} - BarPilot</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 30px 40px;
      color: #0B1220;
      background: #fff;
      line-height: 1.45;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #FF8A24;
      padding-bottom: 20px;
      margin-bottom: 25px;
    }
    .logo {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0B1220;
    }
    .logo span { color: #FF8A24; }
    .parties-box {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      background: #f8fafc;
      padding: 16px 20px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      gap: 20px;
    }
    .party-col { flex: 1; }
    .party-title {
      font-size: 10.5px;
      text-transform: uppercase;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0 20px;
    }
    .table th {
      background: #f1f5f9;
      padding: 10px 12px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      color: #475569;
      font-weight: 800;
      border-bottom: 2px solid #cbd5e1;
    }
    .table td {
      padding: 14px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12.5px;
      vertical-align: top;
    }
    .totals-wrap {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 10px;
    }
    .legal-note {
      max-width: 420px;
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
      background: #f8fafc;
      padding: 12px 14px;
      border-radius: 6px;
      border-left: 3px solid #FF8A24;
    }
    .total-box {
      width: 280px;
      padding: 14px 16px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      font-size: 13px;
      color: #334155;
    }
    .total-row.final {
      font-size: 17px;
      font-weight: 900;
      color: #0B1220;
      border-top: 2px solid #cbd5e1;
      margin-top: 6px;
      padding-top: 8px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 800;
    }
    .sub-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      margin: 2px 0 6px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      font-size: 10.5px;
      color: #94a3b8;
      text-align: center;
      line-height: 1.5;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">BAR<span>PILOT</span></div>
      <div style="font-size:12.5px; font-weight:700; color:#0B1220; margin-top:4px;">${compName}</div>
      <div style="font-size:11px; color:#64748b; margin-top:2px; line-height:1.4;">
        Partita IVA: <strong>${compPiva}</strong> · Email: <strong>${compEmail}</strong><br>
        Portale: <strong>${compWebsite}</strong> · Sede Operativa: Italia
      </div>
    </div>
    <div style="text-align:right;">
      <h2 style="margin:0; font-size:20px; font-weight:900; color:#0B1220;">FATTURA FISCALE</h2>
      <div style="font-size:16px; font-weight:800; color:#FF8A24; margin:3px 0;">${invNumber}</div>
      <div>
        <span class="sub-badge" style="background:${isPostTrial ? '#fef3c7' : '#e0f2fe'}; color:${isPostTrial ? '#b45309' : '#0369a1'};">
          ${isPostTrial ? 'PRIMA FATTURA (ATTIVAZIONE POST-TRIAL 14 GG)' : 'RINNOVO MENSILE RICORRENTE'}
        </span>
      </div>
      <div style="font-size:12px; color:#64748b;">Data emissione: <strong style="color:#1e293b;">${invDate}</strong></div>
      <div style="font-size:12px; color:#64748b;">Data scadenza: <strong style="color:#1e293b;">${dueDate}</strong></div>
    </div>
  </div>

  <div class="parties-box">
    <div class="party-col">
      <div class="party-title">Destinatario / Cliente (Database Supabase):</div>
      <div style="font-size:14.5px; font-weight:800; color:#0B1220;">${businessName}</div>
      <div style="font-size:12.5px; color:#334155; margin-top:2px;">Insegna: <strong>${barName}</strong></div>
      <div style="font-size:12px; color:#475569; margin-top:2px;">C/O Titolare: ${ownerName}</div>
      <div style="font-size:12px; color:#475569; margin-top:2px;">Sede: ${address}${postalCode ? ', ' + postalCode : ''} ${city} (IT)</div>
      <div style="font-size:12px; color:#475569; margin-top:2px;">P.IVA / CF: <strong>${piva}</strong> ${taxCode ? '· ' + taxCode : ''} · SDI: <strong>${sdiCode}</strong></div>
      <div style="font-size:12px; color:#475569; margin-top:2px;">Email: ${email}</div>
    </div>
    <div class="party-col" style="text-align:right;">
      <div class="party-title">Stato Pagamento:</div>
      <div style="margin-top:2px;">
        <span class="badge" style="background:${status === 'paid' ? '#10B981' : '#F59E0B'}; color:#fff;">
          ${status === 'paid' ? 'PAGATA (Stripe Billing)' : 'IN ATTESA DI PAGAMENTO'}
        </span>
      </div>
      <div style="font-size:11.5px; color:#475569; margin-top:6px;">Metodo: <strong>Stripe Billing (Carta / Wallet)</strong></div>
      <div style="font-size:11px; color:#10B981; font-weight:700; margin-top:2px;">Transazione confermata</div>
    </div>
  </div>

  <table class="table">
    <thead>
      <tr>
        <th>Descrizione Servizio</th>
        <th style="width:140px;">Competenza</th>
        <th style="width:70px; text-align:center;">Aliquota</th>
        <th style="width:110px; text-align:right;">Imponibile</th>
      </tr>
    </thead>
    <tbody>
      ${isPostTrial ? `
        <tr>
          <td>
            <strong style="font-size:13px; color:#0B1220;">Abbonamento BarPilot Pro — Primo canone post-periodo di prova gratuita (14 giorni inclusi)</strong>
            <div style="font-size:11.5px; color:#64748b; margin-top:4px; line-height:1.4;">
              Periodo di prova di 14 giorni completato con successo (dal ${trialPeriod} a 0,00 €). Attivazione del primo canone mensile effettivo con licenza software cloud, comande cassa banco, modulo KDS cucina in tempo reale, backup continuo e supporto prioritario.
            </div>
          </td>
          <td style="font-size:12px; color:#334155;">${period}</td>
          <td style="text-align:center; font-size:12px; color:#334155;">22%</td>
          <td style="text-align:right; font-weight:700; font-size:13px; color:#0B1220;">${subtotal.toFixed(2)} €</td>
        </tr>
      ` : `
        <tr>
          <td>
            <strong style="font-size:13px; color:#0B1220;">Abbonamento BarPilot Pro — Canone mensile ricorrente</strong>
            <div style="font-size:11.5px; color:#64748b; margin-top:4px; line-height:1.4;">
              Rinnovo mensile del servizio SaaS gestionale BarPilot: accesso illimitato alle funzionalità gestionali, postazione comande banco/cameriere, display cucina KDS, archiviazione scontrini e reportistica vendite.
            </div>
          </td>
          <td style="font-size:12px; color:#334155;">${period}</td>
          <td style="text-align:center; font-size:12px; color:#334155;">22%</td>
          <td style="text-align:right; font-weight:700; font-size:13px; color:#0B1220;">${subtotal.toFixed(2)} €</td>
        </tr>
      `}
    </tbody>
  </table>

  <div class="totals-wrap">
    <div class="legal-note">
      ${isPostTrial ? `
        <strong>Nota Contrattuale & Fiscale:</strong> Il presente documento attesta il primo addebito effettivo dell'abbonamento BarPilot Pro a seguito del completamento del periodo di prova gratuita di 14 giorni. Il canone si rinnoverà tacitamente ogni mese su Stripe Billing salvo disdetta da parte del gestore.<br>
        Metodo di pagamento: <strong>Stripe Billing</strong>. Corrispettivo riscosso.
      ` : `
        <strong>Nota Contrattuale & Fiscale:</strong> Addebito mensile ricorrente autorizzato ed eseguito tramite Stripe Billing. Documento conforme ai requisiti di deducibilità fiscale per servizi software SaaS.<br>
        Nessun ulteriore pagamento dovuto per il periodo di competenza indicato.
      `}
    </div>

    <div class="total-box">
      <div class="total-row"><span>Imponibile Netto:</span><strong>${subtotal.toFixed(2)} €</strong></div>
      <div class="total-row"><span>IVA (22%):</span><strong>${tax.toFixed(2)} €</strong></div>
      <div class="total-row final"><span>Totale Fattura:</span><span style="color:#FF8A24;">${total.toFixed(2)} €</span></div>
      <div class="total-row" style="font-size:12px; color:#10B981; margin-top:4px; border-top:1px dashed #cbd5e1; padding-top:4px;">
        <span>Totale Pagato:</span><strong>${total.toFixed(2)} €</strong>
      </div>
      <div class="total-row" style="font-size:11px; color:#64748b;">
        <span>Saldo a Pagare:</span><strong>0,00 €</strong>
      </div>
    </div>
  </div>

  <div class="footer">
    Documento generato automaticamente dalla piattaforma BarPilot · Conforme ai requisiti di fatturazione SaaS europea.<br>
    Fornitore: <strong>${compName}</strong> · Partita IVA: <strong>${compPiva}</strong> · Email: <strong>${compEmail}</strong> · <strong>${compWebsite}</strong>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    console.error('[Generate Invoice] Error:', err);
    return res.status(500).json({ error: 'Errore durante la generazione della fattura', details: err.message });
  }
}
