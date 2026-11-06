/**
 * BarPilot Landing Page - Main JavaScript Controller
 * High-performance, vanilla ES6+, zero external runtime dependencies.
 * Handles: i18n (IT/FR), Dark/Light theme, Glassmorphic sticky navbar,
 * Mobile navigation drawer, Interactive KDS simulator, Testimonial carousel,
 * FAQ accordion, Scroll animations, and Contact form submission.
 */

(function () {
  'use strict';

  // State
  const state = {
    lang: 'it',
    theme: 'dark',
    translations: {},
    carouselIndex: 0,
    carouselTimer: null,
    kdsOrders: [
      { id: '104', table: 'Tavolo 4', time: '12:42', items: ['2x Aperol Spritz', '1x Tagliere Misto', '1x Chips Artigianali'], status: 'prep' },
      { id: '105', table: 'Banco 2', time: '12:45', items: ['1x Espresso Doppio', '1x Cornetto Pistacchio'], status: 'ready' },
      { id: '106', table: 'Dehors 7', time: '12:48', items: ['2x Gin Tonic Mare', '1x Pinsa Romana'], status: 'new' },
      { id: '107', table: 'Tavolo 12', time: '12:50', items: ['1x Negroni Sbagliato', '1x Calice Franciacorta'], status: 'served' }
    ]
  };

  const STATUS_CYCLE = ['new', 'prep', 'ready', 'served'];
  const STATUS_LABELS = {
    it: { new: 'Nuova comanda', prep: 'In preparazione', ready: 'Pronta al banco', served: 'Servita al tavolo' },
    fr: { new: 'Nouvelle com.', prep: 'En préparation', ready: 'Prête au comptoir', served: 'Servie à table' }
  };
  const STATUS_ACTIONS = {
    it: { new: 'Avvia preparazione →', prep: 'Segna come pronta →', ready: 'Segna come servita →', served: 'Archivia comanda ✓' },
    fr: { new: 'Lancer préparation →', prep: 'Marquer comme prête →', ready: 'Marquer comme servie →', served: 'Archiver commande ✓' }
  };

  /* ==========================================================================
     1. THEME CONTROLLER (Dark / Light)
     ========================================================================== */
  function initTheme() {
    const savedTheme = localStorage.getItem('barpilot_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      state.theme = savedTheme;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      state.theme = 'light';
    } else {
      state.theme = 'dark';
    }
    applyTheme(state.theme);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('barpilot_theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });

    document.querySelectorAll('[data-action="toggle-theme"]').forEach((btn) => {
      btn.addEventListener('click', toggleTheme);
    });
  }

  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('light-theme', theme === 'light');
    document.body.classList.toggle('dark-theme', theme === 'dark');

    document.querySelectorAll('[data-action="toggle-theme"]').forEach((btn) => {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Passa alla modalità chiara' : 'Passa alla modalità scura');
      const icon = btn.querySelector('.theme-icon');
      if (icon) {
        icon.innerHTML = theme === 'dark'
          ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
          : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      }
    });
  }

  function toggleTheme() {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('barpilot_theme', newTheme);
    applyTheme(newTheme);
  }

  /* ==========================================================================
     2. I18N / TRANSLATIONS (IT / FR)
     ========================================================================== */
  function detectInitialLanguage() {
    const path = window.location.pathname.toLowerCase();
    if (path.startsWith('/fr')) return 'fr';
    if (path.startsWith('/it')) return 'it';

    const saved = localStorage.getItem('barpilot_lang');
    if (saved === 'it' || saved === 'fr') return saved;

    const navLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (navLang.startsWith('fr')) return 'fr';

    return 'it';
  }

  async function loadTranslations(lang) {
    if (state.translations[lang]) return state.translations[lang];
    try {
      const res = await fetch(`/locales/${lang}.json?v=1.1.0`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.translations[lang] = data;
      return data;
    } catch (err) {
      console.warn(`Could not fetch /locales/${lang}.json:`, err);
      return null;
    }
  }

  function getTranslation(path, obj) {
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), obj);
  }

  async function setLanguage(lang, updateUrl = true) {
    if (lang !== 'it' && lang !== 'fr') lang = 'it';
    state.lang = lang;
    localStorage.setItem('barpilot_lang', lang);
    document.documentElement.setAttribute('lang', lang);

    const langCodeEl = document.getElementById('current-lang-code');
    if (langCodeEl) langCodeEl.textContent = lang.toUpperCase();

    const dict = await loadTranslations(lang);
    if (dict) applyTranslations(dict);

    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      const targetLang = btn.getAttribute('data-lang-btn');
      btn.classList.toggle('active', targetLang === lang);
    });

    renderKdsCards();

    if (updateUrl && window.history && window.history.replaceState) {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/fr') || currentPath.startsWith('/it')) {
        const rest = currentPath.replace(/^\/(fr|it)/, '') || '/';
        const newPath = `/${lang}${rest === '/' ? '' : rest}`;
        window.history.replaceState(null, '', newPath + window.location.search + window.location.hash);
      }
    }
  }

  function applyTranslations(dict) {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = getTranslation(key, dict);
      if (val !== null) {
        if (typeof val === 'string' && val.includes('<') && val.includes('>')) {
          el.innerHTML = val;
        } else {
          el.textContent = val;
        }
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = getTranslation(key, dict);
      if (val !== null) el.setAttribute('placeholder', val);
    });

    if (dict.meta) {
      if (dict.meta.title) document.title = dict.meta.title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && dict.meta.desc) metaDesc.setAttribute('content', dict.meta.desc);
    }
  }

  function initLanguage() {
    const lang = detectInitialLanguage();
    setLanguage(lang, false);

    // Language dropdown toggle
    const langMenuBtn = document.querySelector('[data-action="toggle-lang-menu"]');
    const langDropdown = document.getElementById('lang-dropdown');

    langMenuBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      langDropdown?.classList.toggle('open');
    });

    document.addEventListener('click', () => {
      langDropdown?.classList.remove('open');
    });

    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const selected = btn.getAttribute('data-lang-btn');
        if (selected && selected !== state.lang) {
          setLanguage(selected, true);
        }
        langDropdown?.classList.remove('open');
      });
    });
  }

  /* ==========================================================================
     3. STICKY NAVBAR & MOBILE DRAWER
     ========================================================================= */
  function initNavigation() {
    const navbar = document.querySelector('.site-header');
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const mobileDrawer = document.querySelector('.mobile-drawer');
    const backdrop = document.querySelector('.drawer-backdrop');
    const closeBtn = document.querySelector('[data-action="close-drawer"]');

    function onScroll() {
      if (window.scrollY > 20) {
        navbar?.classList.add('scrolled');
      } else {
        navbar?.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function openDrawer() {
      mobileDrawer?.classList.add('open');
      backdrop?.classList.add('open');
      hamburgerBtn?.setAttribute('aria-expanded', 'true');
    }

    function closeDrawer() {
      mobileDrawer?.classList.remove('open');
      backdrop?.classList.remove('open');
      hamburgerBtn?.setAttribute('aria-expanded', 'false');
    }

    hamburgerBtn?.addEventListener('click', openDrawer);
    closeBtn?.addEventListener('click', closeDrawer);
    backdrop?.addEventListener('click', closeDrawer);

    mobileDrawer?.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeDrawer);
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const navHeight = navbar ? navbar.offsetHeight : 72;
          const targetPos = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 10;
          window.scrollTo({
            top: targetPos,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  /* ==========================================================================
     4. INTERACTIVE KDS SIMULATION
     ========================================================================== */
  function initKdsSimulation() {
    renderKdsCards();

    const resetBtn = document.querySelector('[data-action="reset-kds"]');
    resetBtn?.addEventListener('click', () => {
      state.kdsOrders = [
        { id: '104', table: 'Tavolo 4', time: '12:42', items: ['2x Aperol Spritz', '1x Tagliere Misto', '1x Chips Artigianali'], status: 'prep' },
        { id: '105', table: 'Banco 2', time: '12:45', items: ['1x Espresso Doppio', '1x Cornetto Pistacchio'], status: 'ready' },
        { id: '106', table: 'Dehors 7', time: '12:48', items: ['2x Gin Tonic Mare', '1x Pinsa Romana'], status: 'new' },
        { id: '107', table: 'Tavolo 12', time: '12:50', items: ['1x Negroni Sbagliato', '1x Calice Franciacorta'], status: 'served' }
      ];
      renderKdsCards();
    });
  }

  function renderKdsCards() {
    const container = document.getElementById('kds-tickets-container');
    if (!container) return;

    const lang = state.lang || 'it';
    const labels = STATUS_LABELS[lang] || STATUS_LABELS.it;
    const actions = STATUS_ACTIONS[lang] || STATUS_ACTIONS.it;

    // Display only first 3 tickets to fit the 3-column grid
    const displayOrders = state.kdsOrders.slice(0, 3);

    container.innerHTML = displayOrders.map((order, idx) => {
      const status = order.status;
      const statusLabel = labels[status];
      const nextAction = actions[status];

      return `
        <div class="kds-ticket" data-order-index="${idx}">
          <div>
            <div class="kds-ticket-header">
              <span class="kds-table-badge">${order.table}</span>
              <span class="kds-timer">#${order.id} • ${order.time}</span>
            </div>
            <div style="margin-bottom:12px;">
              <span style="font-size:11px; font-weight:800; padding:3px 8px; border-radius:6px; background:rgba(255,255,255,0.08);">
                ${statusLabel}
              </span>
            </div>
            <ul class="kds-items-list">
              ${order.items.map(item => `<li><span>${item}</span><span style="color:#22C55E;">✓</span></li>`).join('')}
            </ul>
          </div>

          <button type="button" class="kds-status-btn status-${status}" data-action="advance-order" data-order-index="${idx}">
            <span>${nextAction}</span>
          </button>
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-action="advance-order"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const orderIdx = parseInt(btn.getAttribute('data-order-index'), 10);
        advanceOrderState(orderIdx);
      });
    });
  }

  function advanceOrderState(orderIdx) {
    const order = state.kdsOrders[orderIdx];
    if (!order) return;

    const currentStep = STATUS_CYCLE.indexOf(order.status);
    const nextStep = (currentStep + 1) % STATUS_CYCLE.length;
    order.status = STATUS_CYCLE[nextStep];

    renderKdsCards();
  }

  /* ==========================================================================
     5. TESTIMONIALS CAROUSEL
     ========================================================================== */
  function initTestimonialsCarousel() {
    const track = document.getElementById('testimonial-track');
    const slides = document.querySelectorAll('.testimonial-slide');
    const prevBtn = document.querySelector('[data-action="prev-testimonial"]');
    const nextBtn = document.querySelector('[data-action="next-testimonial"]');
    const dotsContainer = document.getElementById('carousel-dots');

    if (!track || slides.length === 0) return;

    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      slides.forEach((_, idx) => {
        const dot = document.createElement('button');
        dot.className = `carousel-dot ${idx === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Testimonianza ${idx + 1}`);
        dot.addEventListener('click', () => {
          goToSlide(idx);
          resetAutoAdvance();
        });
        dotsContainer.appendChild(dot);
      });
    }

    function goToSlide(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;
      state.carouselIndex = index;

      track.style.transform = `translateX(-${100 * index}%)`;

      document.querySelectorAll('.carousel-dot').forEach((d, i) => {
        d.classList.toggle('active', i === index);
      });
    }

    prevBtn?.addEventListener('click', () => {
      goToSlide(state.carouselIndex - 1);
      resetAutoAdvance();
    });

    nextBtn?.addEventListener('click', () => {
      goToSlide(state.carouselIndex + 1);
      resetAutoAdvance();
    });

    // Touch swipe
    let startX = 0;
    track.addEventListener('touchstart', (e) => {
      startX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].screenX - startX;
      if (Math.abs(diff) > 40) {
        if (diff < 0) goToSlide(state.carouselIndex + 1);
        else goToSlide(state.carouselIndex - 1);
        resetAutoAdvance();
      }
    }, { passive: true });

    function startAutoAdvance() {
      state.carouselTimer = setInterval(() => {
        goToSlide(state.carouselIndex + 1);
      }, 7000);
    }

    function resetAutoAdvance() {
      if (state.carouselTimer) clearInterval(state.carouselTimer);
      startAutoAdvance();
    }

    startAutoAdvance();
  }

  /* ==========================================================================
     6. FAQ ACCORDION
     ========================================================================== */
  function initFaqAccordion() {
    const items = document.querySelectorAll('.faq-item');
    items.forEach((item) => {
      const btn = item.querySelector('.faq-question-btn');
      const answer = item.querySelector('.faq-answer');

      btn?.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        items.forEach((other) => {
          if (other !== item) {
            other.classList.remove('open');
            other.querySelector('.faq-question-btn')?.setAttribute('aria-expanded', 'false');
            const otherAns = other.querySelector('.faq-answer');
            if (otherAns) otherAns.style.maxHeight = null;
          }
        });

        if (isOpen) {
          item.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
          if (answer) answer.style.maxHeight = null;
        } else {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
          if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    });
  }

  /* ==========================================================================
     7. CONTACT FORM SUBMISSION
     ========================================================================== */
  function initContactForm() {
    const form = document.getElementById('contact-form');
    const statusMsg = document.getElementById('form-status-msg');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (statusMsg) {
        statusMsg.className = 'form-status-msg';
        statusMsg.style.display = 'none';
        statusMsg.textContent = '';
      }

      // Honeypot check
      const honey = form.querySelector('input[name="company_fax"]')?.value;
      if (honey && honey.trim().length > 0) {
        showMsg('Messaggio inviato con successo!', 'success');
        form.reset();
        return;
      }

      const name = form.querySelector('#contact-name')?.value.trim();
      const email = form.querySelector('#contact-email')?.value.trim();
      const barName = form.querySelector('#contact-bar')?.value.trim();
      const phone = form.querySelector('#contact-phone')?.value.trim();
      const message = form.querySelector('#contact-message')?.value.trim();

      const isFr = (state.lang || 'it') === 'fr';

      if (!name || !email || !message) {
        showMsg(
          isFr ? 'Veuillez remplir tous les champs obligatoires (*).' : 'Compila tutti i campi obbligatori (*).',
          'error'
        );
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showMsg(
          isFr ? 'Veuillez saisir une adresse email valide.' : 'Inserisci un indirizzo email valido.',
          'error'
        );
        return;
      }

      const submitBtn = document.getElementById('contact-submit-btn');
      const originalText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>${isFr ? 'Envoi...' : 'Invio...'}</span>`;
      }

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, barName, phone, message, lang: state.lang })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          showMsg(
            isFr
              ? 'Merci ! Votre message a bien été envoyé. Notre équipe vous répondra sous 24h ouvrées.'
              : 'Grazie! Il tuo messaggio è stato inviato con successo. Ti risponderemo entro 24 ore.',
            'success'
          );
          form.reset();
        } else {
          throw new Error(data.error || 'Server error');
        }
      } catch (err) {
        console.error('Contact error:', err);
        showMsg(
          isFr
            ? 'Une erreur est survenue. Veuillez écrire à info@barpilot.eu.'
            : 'Si è verificato un errore durante l\'invio. Puoi scriverci direttamente a info@barpilot.eu.',
          'error'
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });

    function showMsg(text, type) {
      if (!statusMsg) return;
      statusMsg.textContent = text;
      statusMsg.className = `form-status-msg ${type}`;
      statusMsg.style.display = 'block';
      statusMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /* ==========================================================================
     8. SCROLL REVEAL ANIMATIONS
     ========================================================================== */
  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal-on-scroll').forEach(el => el.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
      observer.observe(el);
    });
  }

  /* ==========================================================================
     9. BOOTSTRAP
     ========================================================================== */
  function onReady() {
    initTheme();
    initLanguage();
    initNavigation();
    initKdsSimulation();
    initTestimonialsCarousel();
    initFaqAccordion();
    initContactForm();
    initScrollReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
