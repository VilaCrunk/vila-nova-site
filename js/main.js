/* =============================================================
   VILA NOVA — JavaScript principal
   ============================================================= */

'use strict';

// main.js é carregado com defer: o DOM já está pronto aqui. Não esperar o
// DOMContentLoaded evita que o hero aguarde os módulos do quiz.
(() => {

  const reveals = Array.from(document.querySelectorAll('.reveal'));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sem animação: mostra tudo imediatamente (e segue para o restante dos comportamentos).
  if (reduce) reveals.forEach(el => el.classList.add('in'));

  // Hero (acima da dobra): revela já no load, com stagger.
  // setTimeout (não rAF) para disparar mesmo em contextos sem paint.
  const hero = reduce ? [] : Array.from(document.querySelectorAll('.hero-copy .reveal, .hero-ruler.reveal'));
  hero.forEach((el, i) => { el.style.transitionDelay = (0.1 + i * 0.12) + 's'; });
  setTimeout(() => hero.forEach(el => el.classList.add('in')), 40);

  // Demais seções (abaixo da dobra): revelam ao entrar no viewport.
  const rest = reduce ? [] : reveals.filter(el => !hero.includes(el));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    rest.forEach(el => io.observe(el));
  } else {
    rest.forEach(el => el.classList.add('in'));
  }

  // Rede de segurança: se o IO não disparar (ambientes sem paint),
  // garante que nada fique permanentemente escondido.
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.in)').forEach(el => el.classList.add('in'));
  }, 2200);

  // Header: menu mobile (hamburger).
  const burger = document.getElementById('hdrBurger');
  const hdrMenu = document.getElementById('hdrMenu');
  if (burger && hdrMenu) {
    burger.addEventListener('click', () => {
      const open = hdrMenu.classList.toggle('open');
      burger.classList.toggle('x', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    hdrMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      hdrMenu.classList.remove('open');
      burger.classList.remove('x');
      burger.setAttribute('aria-expanded', 'false');
    }));
  }

  // Liga um trilho horizontal a um conjunto de pontos: marca o card atual
  // e permite tocar num ponto para ir até o card. (mobile)
  const wireDots = (track, cards, dots) => {
    if (!track || !dots.length || !cards.length) return;
    const setActive = () => {
      const trackLeft = track.getBoundingClientRect().left;
      let best = 0, bestD = Infinity;
      cards.forEach((c, i) => {
        const d = Math.abs(c.getBoundingClientRect().left - trackLeft);
        if (d < bestD) { bestD = d; best = i; }
      });
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === Math.min(best, dots.length - 1)));
    };
    dots.forEach((dot, i) => dot.addEventListener('click', () => {
      const target = cards[Math.min(i, cards.length - 1)];
      const delta = target.getBoundingClientRect().left - track.getBoundingClientRect().left;
      track.scrollBy({ left: delta, behavior: 'smooth' });
    }));
    track.addEventListener('scroll', setActive, { passive: true });
    window.addEventListener('resize', setActive);
    setActive();
  };

  // Carrossel "O que fazemos": setas rolam o trilho + pontos.
  const track = document.querySelector('.cap-track');
  if (track) {
    const step = () => Math.max(240, Math.round(track.clientWidth * 0.72));
    document.querySelectorAll('.cap-arrow').forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = btn.dataset.dir === 'next' ? 1 : -1;
        track.scrollBy({ left: dir * step(), behavior: 'smooth' });
      });
    });
    wireDots(track, Array.from(track.querySelectorAll('.svc-card')),
             Array.from(document.querySelectorAll('.cap-dots:not(.seg-dots) .cap-dot')));
  }

  // Carrossel "Segmentos" (mobile): só pontos.
  const segTrack = document.querySelector('.seg-grid');
  if (segTrack) {
    wireDots(segTrack, Array.from(segTrack.querySelectorAll('.seg-card')),
             Array.from(document.querySelectorAll('.seg-dots .cap-dot')));
  }

  // Contato: formulário inline (abre/fecha) + validação + envio para /api/contato.
  const emailToggle = document.getElementById('emailToggle');
  const contactPanel = document.getElementById('contactForm');
  const contactForm = contactPanel ? contactPanel.querySelector('.contact-form') : null;
  if (emailToggle && contactPanel && contactForm) {
    const openPanel = (focus) => {
      contactPanel.classList.add('is-open');
      emailToggle.setAttribute('aria-expanded', 'true');
      if (focus) setTimeout(() => { const f = document.getElementById('cf-name'); if (f) f.focus({ preventScroll: true }); }, 380);
    };
    emailToggle.addEventListener('click', () => {
      if (contactPanel.classList.contains('is-open')) {
        contactPanel.classList.remove('is-open');
        emailToggle.setAttribute('aria-expanded', 'false');
      } else openPanel(true);
    });

    // Referência opcional de uma avaliação "Avalie sua obra" (sem dados pessoais).
    const refEl = document.getElementById('cf-ref');
    let avaliacaoRef = '';
    const showRef = (id) => {
      avaliacaoRef = id || '';
      if (refEl && avaliacaoRef) { refEl.textContent = 'Referência da sua avaliação: ' + avaliacaoRef.slice(0, 8).toUpperCase(); refEl.hidden = false; }
    };
    document.addEventListener('vn:abrir-contato', (e) => { showRef(e.detail && e.detail.avaliacao); openPanel(false); });

    const fields = {
      name: document.getElementById('cf-name'),
      email: document.getElementById('cf-email'),
      message: document.getElementById('cf-message'),
      consent: document.getElementById('cf-consent'),
    };
    const submitBtn = contactForm.querySelector('.cf-submit');
    const feedback = contactForm.querySelector('.cf-feedback');
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const openedAt = Date.now();

    const validators = {
      name: () => fields.name.value.trim().length > 0,
      email: () => emailRe.test(fields.email.value.trim()),
      message: () => fields.message.value.trim().length > 0,
      consent: () => fields.consent.checked,
    };
    const errorMsgs = {
      name: 'Informe seu nome.',
      email: 'Informe um e-mail válido.',
      message: 'Escreva sua mensagem.',
      consent: 'É necessário autorizar para enviar.',
    };
    const isValid = () => Object.keys(validators).every(k => validators[k]());
    const refreshSubmit = () => { submitBtn.setAttribute('aria-disabled', isValid() ? 'false' : 'true'); };
    const showError = (key, show) => {
      const el = fields[key];
      const wrap = key === 'consent' ? el.closest('.cf-consent') : el.closest('.cf-field');
      if (wrap) wrap.classList.toggle('has-error', show);
      if (key !== 'consent') {
        el.setAttribute('aria-invalid', show ? 'true' : 'false');
        const err = document.getElementById('cf-' + key + '-error');
        if (err) err.textContent = show ? errorMsgs[key] : '';
      }
    };

    ['name', 'email', 'message'].forEach(k => {
      fields[k].addEventListener('input', () => { refreshSubmit(); if (validators[k]()) showError(k, false); });
      fields[k].addEventListener('blur', () => { if (fields[k].value) showError(k, !validators[k]()); });
    });
    fields.consent.addEventListener('change', () => { refreshSubmit(); showError('consent', !validators.consent()); });

    const deliverContact = (payload) => fetch('/api/contato', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    }).then((r) => { if (!r.ok) throw new Error('falha no envio'); });

    let sending = false;
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (sending) return;
      Object.keys(validators).forEach(k => showError(k, !validators[k]()));
      if (!isValid()) {
        const first = ['name', 'email', 'message', 'consent'].find(k => !validators[k]());
        if (first) fields[first].focus();
        return;
      }
      feedback.className = 'cf-feedback';
      const prevLabel = submitBtn.textContent;
      sending = true;
      submitBtn.setAttribute('aria-disabled', 'true');
      submitBtn.textContent = 'Enviando…';
      const phoneEl = document.getElementById('cf-phone');
      const mkt = document.getElementById('cf-marketing');
      const hp = contactForm.querySelector('input[name="website"]');
      const payload = {
        name: fields.name.value.trim(),
        email: fields.email.value.trim(),
        phone: phoneEl ? phoneEl.value.trim() : '',
        message: fields.message.value.trim(),
        consent: true,
        marketing: !!(mkt && mkt.checked),
        avaliacao: avaliacaoRef || null,
        website: hp ? hp.value : '',
        elapsed: Date.now() - openedAt,
      };
      deliverContact(payload).then(() => {
        contactForm.reset();
        if (refEl) refEl.hidden = true;
        feedback.textContent = 'Mensagem enviada com sucesso. Em breve a equipe Vila Nova entrará em contato.';
        feedback.classList.add('is-success');
      }).catch(() => {
        feedback.textContent = 'Não foi possível enviar sua mensagem agora. Tente novamente ou fale conosco pelo WhatsApp.';
        feedback.classList.add('is-error');
      }).finally(() => {
        sending = false;
        submitBtn.textContent = prevLabel;
        refreshSubmit();
      });
    });
  }

  // Aviso de cookies: nada opcional é carregado antes do "Aceitar".
  const CK = 'vn-cookies';
  const banner = document.getElementById('cookieBanner');
  const readCk = () => { try { return localStorage.getItem(CK); } catch { return null; } };
  const writeCk = (v) => { try { localStorage.setItem(CK, v); localStorage.setItem(CK + '-em', new Date().toISOString()); } catch { /* sem storage */ } };
  const loadAnalytics = () => {
    if (window.__vnAnalytics) return;
    window.__vnAnalytics = true;
    // Vercel Web Analytics (agregado, sem cookies). Só roda no domínio publicado.
    if (!/vercel\.app$|vilanovaconsultoria\.com$/.test(location.hostname)) return;
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    const s = document.createElement('script');
    s.defer = true; s.src = '/_vercel/insights/script.js';
    document.head.appendChild(s);
  };
  const showBanner = (show) => {
    if (!banner) return;
    banner.hidden = !show;
    document.body.classList.toggle('has-ck', show);
  };
  const choice = readCk();
  if (choice === 'aceito') loadAnalytics();
  else if (choice !== 'rejeitado') showBanner(true);
  if (banner) banner.querySelectorAll('[data-cookie]').forEach(btn => btn.addEventListener('click', () => {
    const v = btn.dataset.cookie;
    writeCk(v);
    showBanner(false);
    if (v === 'aceito') loadAnalytics();
    else if (window.__vnAnalytics) location.reload(); // revogação: recarrega sem o script de análise
  }));
  document.querySelectorAll('[data-cookie-prefs]').forEach(b => b.addEventListener('click', () => {
    showBanner(true);
    const first = banner && banner.querySelector('[data-cookie]');
    if (first) first.focus();
  }));
})();
