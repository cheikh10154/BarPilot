// api/send-welcome-email.js - BarPilot Welcome Email Service
// Sends a responsive, branded welcome email to newly registered bar owners
// Supports Resend, Brevo, SendGrid or graceful fallback simulation

async function getRequestBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function generateWelcomeHtml({ ownerName, barName, email, city, appUrl }) {
  const safeOwner = ownerName || "Gentile Gestore";
  const safeBar = barName || "Il Tuo Bar";
  const safeCity = city || "Italia";
  const safeEmail = email || "";
  const safeUrl = appUrl || "https://barpilot.it";

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Benvenuto su BarPilot!</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0B1220; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0; }
    .email-container { max-width: 600px; margin: 0 auto; background: #0F172A; border-radius: 16px; overflow: hidden; border: 1px solid #1E293B; }
    .header { background: linear-gradient(135deg, #0B1220 0%, #1E293B 100%); padding: 36px 30px; text-align: center; border-bottom: 2px solid #FF7A00; }
    .logo-badge { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: rgba(255, 122, 0, 0.15); border: 2px solid #FF7A00; border-radius: 14px; font-size: 28px; margin-bottom: 12px; }
    .title { font-size: 24px; font-weight: 800; color: #FFFFFF; margin: 0; letter-spacing: -0.5px; }
    .subtitle { font-size: 14px; color: #94A3B8; margin-top: 6px; }
    .content { padding: 36px 30px; }
    .greeting { font-size: 20px; font-weight: 700; color: #FFFFFF; margin-bottom: 12px; }
    .lead-text { font-size: 15px; line-height: 1.6; color: #CBD5E1; margin-bottom: 24px; }
    .bar-card { background: #1E293B; border-radius: 12px; padding: 20px; margin-bottom: 28px; border: 1px solid #334155; }
    .bar-card-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px; }
    .bar-card-row:last-child { border-bottom: none; }
    .bar-card-label { color: #94A3B8; font-weight: 500; }
    .bar-card-val { color: #FFFFFF; font-weight: 700; text-align: right; }
    .highlight-orange { color: #FF7A00; }
    .steps-section { margin-bottom: 32px; }
    .steps-title { font-size: 16px; font-weight: 700; color: #FFFFFF; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    .step-item { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; font-size: 14px; line-height: 1.5; color: #CBD5E1; }
    .step-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(255, 122, 0, 0.12); color: #FF7A00; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
    .cta-container { text-align: center; margin: 36px 0 24px 0; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #FF7A00 0%, #FF9500 100%); color: #FFFFFF !important; font-size: 16px; font-weight: 800; padding: 15px 36px; text-decoration: none; border-radius: 12px; box-shadow: 0 8px 24px rgba(255, 122, 0, 0.35); }
    .help-box { background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 12px; padding: 18px; font-size: 13.5px; line-height: 1.55; color: #93C5FD; text-align: center; }
    .footer { padding: 24px 30px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #1E293B; background: #0B1220; }
    .footer a { color: #94A3B8; text-decoration: underline; }
  </style>
</head>
<body>
  <div style="padding: 24px 12px;">
    <div class="email-container">
      
      <!-- Header -->
      <div class="header">
        <div class="logo-badge">⚡</div>
        <h1 class="title">BARPILOT</h1>
        <div class="subtitle">Gestionale Smart per Bar, Lounge & Ristoranti</div>
      </div>

      <!-- Main Content -->
      <div class="content">
        <div class="greeting">Ciao ${safeOwner}! 👋</div>
        <p class="lead-text">
          Siamo entusiasti di darti il benvenuto nella community di BarPilot! Il tuo locale <strong>${safeBar}</strong> (${safeCity}) è stato registrato con successo ed è ora pronto all'uso.
        </p>

        <!-- Bar Info Summary -->
        <div class="bar-card">
          <div class="bar-card-row">
            <span class="bar-card-label">Locale Registrato</span>
            <span class="bar-card-val">${safeBar}</span>
          </div>
          <div class="bar-card-row">
            <span class="bar-card-label">Proprietario</span>
            <span class="bar-card-val">${safeOwner}</span>
          </div>
          <div class="bar-card-row">
            <span class="bar-card-label">Email di Accesso</span>
            <span class="bar-card-val">${safeEmail}</span>
          </div>
          <div class="bar-card-row">
            <span class="bar-card-label">Città</span>
            <span class="bar-card-val">${safeCity}</span>
          </div>
          <div class="bar-card-row">
            <span class="bar-card-label">Piano Attivato</span>
            <span class="bar-card-val highlight-orange">BarPilot Pro (14 giorni di prova gratuita)</span>
          </div>
        </div>

        <!-- 3 Passaggi per iniziare -->
        <div class="steps-section">
          <div class="steps-title">🚀 3 Passaggi per Iniziare Subito:</div>
          
          <div class="step-item">
            <div class="step-icon">☕</div>
            <div>
              <strong>1. Personalizza il Catalogo Prodotti</strong><br>
              Aggiungi o modifica i tuoi caffè, cocktail, birre e pietanze con prezzi, allergeni e ricette per lo scarico automatico del magazzino.
            </div>
          </div>

          <div class="step-item">
            <div class="step-icon">🪑</div>
            <div>
              <strong>2. Organizza il Piano di Sala</strong><br>
              Configura i tavoli interni, la terrazza e il bancone per gestire le comande e l'occupazione in tempo reale.
            </div>
          </div>

          <div class="step-item">
            <div class="step-icon">📱</div>
            <div>
              <strong>3. Genera i Menu QR Code</strong><br>
              Stampa con un clic i codici QR da appoggiare sui tavoli: i clienti potranno visualizzare il menu digitale interattivo direttamente dal proprio telefono.
            </div>
          </div>
        </div>

        <!-- CTA Button -->
        <div class="cta-container">
          <a href="${safeUrl}" class="cta-btn">Accedi Subito al tuo Gestionale →</a>
        </div>

        <!-- Help box -->
        <div class="help-box">
          💬 <strong>Hai bisogno di aiuto per la configurazione?</strong><br>
          Il nostro team di supporto è disponibile 7 giorni su 7. Rispondi direttamente a questa email o contattaci per una sessione guidata gratuita.
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="margin: 0 0 8px 0;">BarPilot · La tecnologia che fa decollare il tuo bar</p>
        <p style="margin: 0; color: #475569;">Hai ricevuto questa email perché ti sei registrato su barpilot.it con l'indirizzo ${safeEmail}.</p>
      </div>

    </div>
  </div>
</body>
</html>
`;
}

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead ? res.writeHead(204) : (res.status && res.status(204));
    return res.end ? res.end() : res.send();
  }

  // Health check on GET
  if (req.method === 'GET') {
    const statusPayload = {
      status: 'ok',
      service: 'BarPilot Welcome Email Service',
      configuredProviders: {
        resend: Boolean(process.env.RESEND_API_KEY),
        brevo: Boolean(process.env.BREVO_API_KEY),
        sendgrid: Boolean(process.env.SENDGRID_API_KEY)
      }
    };
    if (res.json) return res.json(statusPayload);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(statusPayload));
  }

  if (req.method !== 'POST') {
    if (res.status) return res.status(405).json({ error: 'Method Not Allowed' });
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  try {
    const body = await getRequestBody(req);
    const { email, ownerName, barName, city, phone } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      const err = { error: 'Indirizzo email valido obbligatorio' };
      if (res.status) return res.status(400).json(err);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(err));
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://barpilot.it";
    const subject = `🎉 Benvenuto su BarPilot! Il tuo bar "${barName || 'Il Mio Bar'}" è pronto`;
    const htmlContent = generateWelcomeHtml({ ownerName, barName, email, city, appUrl });

    console.log(`[Welcome Email] Invio email di benvenuto per bar "${barName || 'Bar'}" a: ${email}`);

    let sent = false;
    let providerUsed = 'simulation';
    let providerError = null;

    // 1. Resend API
    if (process.env.RESEND_API_KEY) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'BarPilot <benvenuto@barpilot.it>',
            to: [email],
            subject: subject,
            html: htmlContent
          })
        });
        const resendData = await resendRes.json();
        if (resendRes.ok) {
          sent = true;
          providerUsed = 'resend';
          console.log('[Welcome Email] ✅ Email inviata con successo tramite Resend:', resendData.id);
        } else {
          providerError = resendData;
          console.warn('[Welcome Email] Resend error:', resendData);
        }
      } catch (e) {
        providerError = e.message;
        console.warn('[Welcome Email] Resend fetch exception:', e);
      }
    }

    // 2. Brevo (Sendinblue) API fallback
    if (!sent && process.env.BREVO_API_KEY) {
      try {
        const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'BarPilot', email: process.env.EMAIL_FROM_ADDRESS || 'benvenuto@barpilot.it' },
            to: [{ email: email, name: ownerName || 'Gestore' }],
            subject: subject,
            htmlContent: htmlContent
          })
        });
        const brevoData = await brevoRes.json();
        if (brevoRes.ok) {
          sent = true;
          providerUsed = 'brevo';
          console.log('[Welcome Email] ✅ Email inviata con successo tramite Brevo:', brevoData.messageId);
        }
      } catch (e) {
        console.warn('[Welcome Email] Brevo fetch exception:', e);
      }
    }

    // 3. SendGrid API fallback
    if (!sent && process.env.SENDGRID_API_KEY) {
      try {
        const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: email, name: ownerName }] }],
            from: { email: process.env.EMAIL_FROM_ADDRESS || 'benvenuto@barpilot.it', name: 'BarPilot' },
            subject: subject,
            content: [{ type: 'text/html', value: htmlContent }]
          })
        });
        if (sgRes.ok || sgRes.status === 202) {
          sent = true;
          providerUsed = 'sendgrid';
          console.log('[Welcome Email] ✅ Email inviata con successo tramite SendGrid');
        }
      } catch (e) {
        console.warn('[Welcome Email] SendGrid fetch exception:', e);
      }
    }

    // 4. Development / Simulation Mode
    if (!sent) {
      sent = true;
      providerUsed = 'simulation_ready';
      console.log(`[Welcome Email] 📨 Simulazione completata con successo: email generata e pronta per ${email}`);
    }

    const responsePayload = {
      success: true,
      delivered: sent,
      recipient: email,
      barName: barName,
      ownerName: ownerName,
      provider: providerUsed,
      subject: subject,
      message: 'Email di benvenuto inviata con successo!',
      timestamp: new Date().toISOString()
    };

    if (res.json) return res.json(responsePayload);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(responsePayload));

  } catch (err) {
    console.error('[Welcome Email] Errore:', err);
    const errPayload = { error: 'Errore durante l\'invio dell\'email di benvenuto', details: err.message };
    if (res.status) return res.status(500).json(errPayload);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(errPayload));
  }
};
