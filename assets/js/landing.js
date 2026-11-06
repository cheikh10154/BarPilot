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
      { id: '104', table: 'Tavolo 4', time: '12:42', items: ['2x Aperol Spritz', '1x Tagliere Misto', '1x Chips Artigianali'], status: 'prep', stepIndex: 1 },
      { id: '105', table: 'Banco 2', time: '12:45', items: ['1x Espresso Doppio', '1x Cornetto Pistacchio'], status: 'ready', stepIndex: 2 },
      { id: '106', table: 'Dehors 7', time: '12:48', items: ['2x Gin Tonic Mare', '1x Pinsa Romana'], status: 'new', stepIndex: 0 },
      { id: '107', table: 'Tavolo 12', time: '12:50', items: ['1x Negroni Sbagliato', '1x Calice Franciacorta'], status: 'served', stepIndex: 3 }
    ]
  };

  const STATUS_CYCLE = ['new', 'prep', 'ready', 'served'];
  const STATUS_LABELS = {
    it: { new: 'Nuova comanda', prep: 'In preparazione', ready: 'Pronta al banco', served: 'Servita al tavolo' },
    fr: { new: 'Nouvelle com.', prep: 'En préparation', ready: 'Prête au comptoir', served: 'Servie à table' }
  };
  const STATUS_ACTIONS = {
    it: { new: 'Avvia preparazione', prep: 'Segna come pronta', ready: 'Segna come servita', served: 'Archivia comanda' },
    fr: { new: 'Lancer préparation', prep: 'Marquer comme prête', ready: 'Marquer comme servie', served: 'Archiver commande' }
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

    // Watch OS preference changes if user hasn't explicitly set one
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('barpilot_theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });

    // Theme toggle buttons (desktop + mobile)
    document.querySelectorAll('[data-action="toggle-theme"]').forEach((btn) => {
      btn.addEventListener('click', toggleTheme);
    });
  }

  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('light-theme', theme === 'light');
    document.body.classList.toggle('dark-theme', theme === 'dark');

    // Update icons and labels
    document.querySelectorAll('[data-action="toggle-theme"]').forEach((btn) => {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Passa alla modalità chiara' : 'Passa alla modalità scura');
      const icon = btn.querySelector('.theme-icon');
      if (icon) {
        icon.innerHTML = theme === 'dark'
          ? `<svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
          : `<svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
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
    if (state.translations[lang]) {
      return state.translations[lang];
    }
    try {
      const res = await fetch(`/locales/${lang}.json?v=1.0.0`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.translations[lang] = data;
      return data;
    } catch (err) {
      console.warn(`Could not fetch /locales/${lang}.json, trying fallback:`, err);
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

    const dict = await loadTranslations(lang);
    if (dict) {
      applyTranslations(dict);
    }

    // Update active state in language selector pills
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      const targetLang = btn.getAttribute('data-lang-btn');
      btn.classList.toggle('active', targetLang === lang);
      btn.setAttribute('aria-pressed', targetLang === lang ? 'true' : 'false');
    });

    // Update KDS live status labels
    renderKdsCards();

    // Update URL shallowly if requested without full page reload
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
    // Text contents
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

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = getTranslation(key, dict);
      if (val !== null) el.setAttribute('placeholder', val);
    });

    // Titles & Alt
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      const val = getTranslation(key, dict);
      if (val !== null) el.setAttribute('title', val);
    });
    document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
      const key = el.getAttribute('data-i18n-alt');
      const val = getTranslation(key, dict);
      if (val !== null) el.setAttribute('alt', val);
    });

    // Page title and meta description
    if (dict.meta) {
      if (dict.meta.title) document.title = dict.meta.title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && dict.meta.desc) metaDesc.setAttribute('content', dict.meta.desc);
    }
  }

  function initLanguage() {
    const lang = detectInitialLanguage();
    setLanguage(lang, false);

    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const selected = btn.getAttribute('data-lang-btn');
        if (selected && selected !== state.lang) {
          setLanguage(selected, true);
        }
      });
    });
  }

  /* ==========================================================================
     3. STICKY NAVBAR & MOBILE DRAWER
     ========================================================================== */
  function initNavigation() {
    const navbar = document.querySelector('.site-header');
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    const mobileDrawer = document.querySelector('.mobile-nav-drawer');
    const backdrop = document.querySelector('.nav-backdrop');

    // Sticky glassmorphism on scroll
    function onScroll() {
      if (window.scrollY > 20) {
        navbar?.classList.add('scrolled');
      } else {
        navbar?.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mobile drawer toggle
    function openMenu() {
      document.body.classList.add('menu-open');
      mobileDrawer?.classList.add('open');
      backdrop?.classList.add('active');
      toggleBtn?.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
      document.body.classList.remove('menu-open');
      mobileDrawer?.classList.remove('open');
      backdrop?.classList.remove('active');
      toggleBtn?.setAttribute('aria-expanded', 'false');
    }

    toggleBtn?.addEventListener('click', () => {
      const isOpen = mobileDrawer?.classList.contains('open');
      if (isOpen) closeMenu();
      else openMenu();
    });

    backdrop?.addEventListener('click', closeMenu);

    // Auto-close when clicking any link inside mobile drawer
    mobileDrawer?.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        closeMenu();
      });
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
          const targetPos = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;
          window.scrollTo({
            top: targetPos,
            behavior: 'smooth'
          });
          // Update active link in navbar
          updateActiveNavLink(href);
        }
      });
    });

    // Scroll spy
    const sections = document.querySelectorAll('section[id]');
    function highlightNavOnScroll() {
      const scrollPos = window.scrollY + 120;
      sections.forEach((sec) => {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        const id = sec.getAttribute('id');
        if (scrollPos >= top && scrollPos < top + height) {
          updateActiveNavLink(`#${id}`);
        }
      });
    }
    window.addEventListener('scroll', highlightNavOnScroll, { passive: true });
  }

  function updateActiveNavLink(hash) {
    document.querySelectorAll('.nav-link').forEach((link) => {
      if (link.getAttribute('href') === hash) {
        link.classList.add('active');
      } else if (link.getAttribute('href')?.startsWith('#')) {
        link.classList.remove('active');
      }
    });
  }

  /* ==========================================================================
     4. INTERACTIVE KDS SIMULATION
     ========================================================================== */
  function initKdsSimulation() {
    renderKdsCards();

    // Reset button
    const resetBtn = document.querySelector('[data-action="reset-kds"]');
    resetBtn?.addEventListener('click', () => {
      state.kdsOrders = [
        { id: '104', table: 'Tavolo 4', time: '12:42', items: ['2x Aperol Spritz', '1x Tagliere Misto', '1x Chips Artigianali'], status: 'prep', stepIndex: 1 },
        { id: '105', table: 'Banco 2', time: '12:45', items: ['1x Espresso Doppio', '1x Cornetto Pistacchio'], status: 'ready', stepIndex: 2 },
        { id: '106', table: 'Dehors 7', time: '12:48', items: ['2x Gin Tonic Mare', '1x Pinsa Romana'], status: 'new', stepIndex: 0 },
        { id: '107', table: 'Tavolo 12', time: '12:50', items: ['1x Negroni Sbagliato', '1x Calice Franciacorta'], status: 'served', stepIndex: 3 }
      ];
      renderKdsCards();
    });
  }

  function renderKdsCards() {
    const container = document.getElementById('kds-orders-container');
    if (!container) return;

    const lang = state.lang || 'it';
    const labels = STATUS_LABELS[lang] || STATUS_LABELS.it;
    const actions = STATUS_ACTIONS[lang] || STATUS_ACTIONS.it;

    container.innerHTML = state.kdsOrders.map((order, idx) => {
      const status = order.status;
      const statusLabel = labels[status];
      const nextAction = actions[status];

      return `
        <div class="kds-card status-${status}" data-order-index="${idx}">
          <div class="kds-card-header">
            <div class="kds-order-info">
              <span class="kds-order-id">#${order.id}</span>
              <span class="kds-table-badge">${order.table}</span>
            </div>
            <span class="kds-time">${order.time}</span>
          </div>

          <div class="kds-status-pill status-${status}">
            <span class="status-dot"></span>
            ${statusLabel}
          </div>

          <ul class="kds-items-list">
            ${order.items.map(item => `<li><span class="item-check">✓</span> ${item}</li>`).join('')}
          </ul>

          <div class="kds-card-footer">
            <button class="kds-action-btn status-btn-${status}" data-action="advance-order" data-order-index="${idx}" aria-label="${nextAction}">
              <span>${nextAction}</span>
              <svg class="lucide-icon inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Bind event clicks
    container.querySelectorAll('[data-action="advance-order"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
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
    order.stepIndex = nextStep;

    const card = document.querySelector(`.kds-card[data-order-index="${orderIdx}"]`);
    if (card) {
      card.classList.add('state-pulse');
      setTimeout(() => {
        card.classList.remove('state-pulse');
      }, 400);
    }

    renderKdsCards();
  }

  /* ==========================================================================
     5. TESTIMONIALS CAROUSEL
     ========================================================================== */
  function initTestimonialsCarousel() {
    const track = document.querySelector('.testimonials-track');
    const cards = document.querySelectorAll('.testimonial-card');
    const prevBtn = document.querySelector('[data-action="prev-testimonial"]');
    const nextBtn = document.querySelector('[data-action="next-testimonial"]');
    const dotsContainer = document.querySelector('.carousel-dots');

    if (!track || cards.length === 0) return;

    // Build dots
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      cards.forEach((_, idx) => {
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
      if (index < 0) index = cards.length - 1;
      if (index >= cards.length) index = 0;
      state.carouselIndex = index;

      const offset = -100 * index;
      track.style.transform = `translateX(${offset}%)`;

      // Update dots
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

    // Touch swipe support
    let startX = 0;
    let endX = 0;
    track.addEventListener('touchstart', (e) => {
      startX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const diff = endX - startX;
      if (Math.abs(diff) > 40) {
        if (diff < 0) {
          goToSlide(state.carouselIndex + 1);
        } else {
          goToSlide(state.carouselIndex - 1);
        }
        resetAutoAdvance();
      }
    }

    // Auto advance every 7 seconds
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

    // Pause on mouse hover
    track.closest('.testimonials-viewport')?.addEventListener('mouseenter', () => {
      if (state.carouselTimer) clearInterval(state.carouselTimer);
    });
    track.closest('.testimonials-viewport')?.addEventListener('mouseleave', () => {
      startAutoAdvance();
    });
  }

  /* ==========================================================================
     6. FAQ ACCORDION
     ========================================================================== */
  function initFaqAccordion() {
    const items = document.querySelectorAll('.faq-item');
    items.forEach((item) => {
      const header = item.querySelector('.faq-question');
      header?.addEventListener('click', () => {
        const isCurrentlyOpen = item.classList.contains('active');

        // Optional: close other items for an exclusive accordion
        items.forEach((other) => {
          if (other !== item) {
            other.classList.remove('active');
            other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
          }
        });

        item.classList.toggle('active', !isCurrentlyOpen);
        header.setAttribute('aria-expanded', (!isCurrentlyOpen).toString());
      });
    });
  }

  /* ==========================================================================
     7. CONTACT FORM SUBMISSION
     ========================================================================== */
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const alertBox = document.getElementById('contact-alert');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Clear previous alerts
      if (alertBox) {
        alertBox.className = 'contact-alert hidden';
        alertBox.textContent = '';
      }

      // Check honeypot
      const honey = form.querySelector('input[name="company_fax"]')?.value;
      if (honey && honey.trim().length > 0) {
        // Silent drop for bots
        showAlert('Messaggio inviato con successo!', 'success');
        form.reset();
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : '';

      // Validate inputs
      const name = form.querySelector('#contact-name')?.value.trim();
      const email = form.querySelector('#contact-email')?.value.trim();
      const barName = form.querySelector('#contact-bar')?.value.trim();
      const phone = form.querySelector('#contact-phone')?.value.trim();
      const message = form.querySelector('#contact-message')?.value.trim();

      const lang = state.lang || 'it';
      const isFr = lang === 'fr';

      if (!name || !email || !message) {
        showAlert(
          isFr ? 'Veuillez remplir tous les champs obligatoires (nom, email, message).' : 'Compila tutti i campi obbligatori (nome, email, messaggio).',
          'error'
        );
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showAlert(
          isFr ? 'Veuillez saisir une adresse email valide.' : 'Inserisci un indirizzo email valido.',
          'error'
        );
        return;
      }

      // Set loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="lucide-icon spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          <span>${isFr ? 'Envoi en cours...' : 'Invio in corso...'}</span>
        `;
      }

      try {
        const payload = {
          name,
          email,
          barName,
          phone,
          message,
          lang
        };

        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.success) {
          showAlert(
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
        console.error('Contact submit error:', err);
        showAlert(
          isFr
            ? "Une erreur est survenue lors de l'envoi. Veuillez nous contacter directement par email à info@barpilot.eu."
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

    function showAlert(text, type) {
      if (!alertBox) return;
      alertBox.textContent = text;
      alertBox.className = `contact-alert ${type}`;
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /* ==========================================================================
     8. SCROLL REVEAL ANIMATIONS (IntersectionObserver)
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
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
      observer.observe(el);
    });
  }

  /* ==========================================================================
     9. BOOTSTRAP ON DOM READY
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
