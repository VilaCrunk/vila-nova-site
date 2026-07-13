/* =============================================================
   VILA NOVA — JavaScript principal
   ============================================================= */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  const reveals = Array.from(document.querySelectorAll('.reveal'));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sem animação: mostra tudo imediatamente.
  if (reduce) {
    reveals.forEach(el => el.classList.add('in'));
    return;
  }

  // Hero (acima da dobra): revela já no load, com stagger.
  // setTimeout (não rAF) para disparar mesmo em contextos sem paint.
  const hero = Array.from(document.querySelectorAll('.hero-copy .reveal, .hero-ruler.reveal'));
  hero.forEach((el, i) => { el.style.transitionDelay = (0.1 + i * 0.12) + 's'; });
  setTimeout(() => hero.forEach(el => el.classList.add('in')), 40);

  // Demais seções (abaixo da dobra): revelam ao entrar no viewport.
  const rest = reveals.filter(el => !hero.includes(el));
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
});
