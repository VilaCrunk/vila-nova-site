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

  // Carrossel "O que fazemos": setas rolam o trilho.
  const track = document.querySelector('.cap-track');
  if (track) {
    const step = () => Math.max(240, Math.round(track.clientWidth * 0.72));
    document.querySelectorAll('.cap-arrow').forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = btn.dataset.dir === 'next' ? 1 : -1;
        track.scrollBy({ left: dir * step(), behavior: 'smooth' });
      });
    });
  }
});
