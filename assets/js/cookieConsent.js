/**
 * BarPilot - Cookie Consent Banner & Privacy Manager
 */
(function () {
  const CONSENT_KEY = 'barpilot_cookie_consent';

  function getConsent() {
    try {
      return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
    } catch (_) {
      return null;
    }
  }

  function setConsent(choice) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        choice: choice,
        timestamp: new Date().toISOString()
      }));
    } catch (_) {}
    const banner = document.getElementById('bpCookieConsentBanner');
    if (banner) {
      banner.style.opacity = '0';
      banner.style.transform = 'translate(-50%, 20px)';
      setTimeout(() => banner.remove(), 300);
    }
  }

  window.openBarPilotCookieManager = function () {
    let banner = document.getElementById('bpCookieConsentBanner');
    if (!banner) {
      renderBanner(true);
    } else {
      banner.style.display = 'flex';
      banner.style.opacity = '1';
      banner.style.transform = 'translate(-50%, 0)';
    }
  };

  function renderBanner(forceOpen) {
    if (!forceOpen && getConsent()) return;

    if (document.getElementById('bpCookieConsentBanner')) return;

    const isFr = (localStorage.getItem('barpilot_lang') === 'fr');

    const banner = document.createElement('div');
    banner.id = 'bpCookieConsentBanner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie Consent');
    banner.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translate(-50%, 0);
      width: min(92%, 820px);
      background: rgba(11, 18, 32, 0.98);
      border: 1px solid rgba(255, 138, 36, 0.35);
      box-shadow: 0 16px 36px rgba(0,0,0,0.65);
      border-radius: 16px;
      padding: 18px 22px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      color: #FFFFFF;
      transition: all 0.3s ease;
    `;

    banner.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <div style="display:flex; align-items:center; gap:8px; font-weight:800; font-size:14px; color:#FF8A24;">
          <span>🍪</span>
          <span>${isFr ? 'Gestion des Cookies et Confidentialité' : 'Informativa Cookie e Riservatezza'}</span>
        </div>
      </div>
      <p style="margin:0; font-size:12.5px; line-height:1.55; color:#94A3B8;">
        ${isFr 
          ? 'BarPilot utilise des technologies de stockage local et des cookies techniques nécessaires au bon fonctionnement de l’application, de la sécurité et des commandes. Aucun cookie de profilage publicitaire n’est utilisé.'
          : 'BarPilot utilizza cookie tecnici e archiviazione locale essenziali per il funzionamento dell’applicazione gestionale, la sicurezza delle sessioni e la cassa. Non utilizziamo cookie di profilazione pubblicitaria.'}
        <a href="/cookie-policy" style="color:#FF8A24; text-decoration:underline; font-weight:700; margin-left:4px;">
          ${isFr ? 'En savoir plus' : 'Leggi la Cookie Policy'}
        </a>
      </p>
      <div style="display:flex; align-items:center; justify-content:flex-end; gap:8px; flex-wrap:wrap; margin-top:4px;">
        <button type="button" id="bpBtnEssential" style="background:rgba(255,255,255,0.08); color:#CBD5E1; border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:7px 14px; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit;">
          ${isFr ? 'Seulement Nécessaires' : 'Solo Tecnici Necessari'}
        </button>
        <button type="button" id="bpBtnAccept" style="background:#FF8A24; color:#FFFFFF; border:none; border-radius:8px; padding:7px 16px; font-size:12px; font-weight:800; cursor:pointer; font-family:inherit; box-shadow:0 2px 8px rgba(255,138,36,0.3);">
          ${isFr ? 'Accepter et Continuer' : 'Accetta e Continua'}
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('bpBtnEssential').addEventListener('click', () => setConsent('essential'));
    document.getElementById('bpBtnAccept').addEventListener('click', () => setConsent('all'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderBanner(false));
  } else {
    renderBanner(false);
  }
})();
