// src/scripts/main.ts

const initHeaderScroll = () => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const toggleScrollClass = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 100);
  };

  window.addEventListener('scroll', toggleScrollClass, { passive: true });
  toggleScrollClass(); 
};

const initMobileNav = () => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#mobile-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');
    nav.setAttribute('data-state', !isExpanded ? 'open' : 'closed');
  });

  const links = nav.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      nav.setAttribute('data-state', 'closed');
    });
  });
};

const initParallax = () => {
  const parallaxElements = document.querySelectorAll<HTMLElement>('[data-parallax]');
  if (parallaxElements.length === 0) return;

  let ticking = false;

  const updateParallax = () => {
    const windowCenter = window.innerHeight / 2;
    
    parallaxElements.forEach(el => {
      const speed = parseFloat(el.dataset.speed || '-0.15');
      const anchorDivisor = parseFloat(el.dataset.anchor || '2');

      const anchor = el.closest('section') || el.parentElement || el;
      const rect = anchor.getBoundingClientRect();
      
      const anchorCenter = rect.top + (rect.height / anchorDivisor);
      const scrollEquivalent = windowCenter - anchorCenter;
      
      el.style.transform = `translate3d(0, ${scrollEquivalent * speed}px, 0) scale(${1 + (scrollEquivalent * 0.0001)})`;
    });
    
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  };

  updateParallax();
  window.addEventListener('scroll', onScroll, { passive: true });

  document.addEventListener('astro:before-preparation', () => {
    window.removeEventListener('scroll', onScroll);
  }, { once: true });
};

const initializedEmailButtons = new WeakSet<HTMLButtonElement>();

const initEmailReveal = () => {
  const revealBtn = document.querySelector<HTMLButtonElement>('.reveal-btn');
  const emailBox = document.querySelector<HTMLAnchorElement>('.email-box');
  if (!revealBtn || !emailBox || initializedEmailButtons.has(revealBtn)) return;

  const { u: user, d: domain } = revealBtn.dataset;
  if (!user || !domain) return;
  initializedEmailButtons.add(revealBtn);

  // Hidden text reserves the final dimensions without exposing a mailto link.
  const realEmail = `${user}@${domain}`;
  emailBox.textContent = realEmail;

  revealBtn.addEventListener('click', async () => {
    if (!emailBox.classList.contains('is-revealed')) {
      emailBox.href = `mailto:${realEmail}`;
      emailBox.removeAttribute('aria-hidden');
      emailBox.removeAttribute('tabindex');
      emailBox.classList.add('is-revealed');
      revealBtn.textContent = 'Skopiuj adres';
      revealBtn.classList.add('is-clicked');
      return;
    }

    try {
      await navigator.clipboard.writeText(realEmail);
      const originalText = revealBtn.textContent;
      revealBtn.textContent = 'Skopiowano!';
      revealBtn.classList.add('is-copied');
      revealBtn.style.pointerEvents = 'none';

      setTimeout(() => {
        revealBtn.textContent = originalText;
        revealBtn.classList.remove('is-copied');
        revealBtn.style.pointerEvents = 'auto';
      }, 2000);
    } catch (err) {
      console.error('Clipboard copy failed', err);
      revealBtn.textContent = 'Błąd kopiowania';
    }
  });
};

// Initial visits must not wait for every image before the button works.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEmailReveal, { once: true });
} else {
  initEmailReveal();
}

// Master Initializer
document.addEventListener('astro:page-load', () => {
  initHeaderScroll();
  initMobileNav();
  initParallax();
  initEmailReveal();
});
