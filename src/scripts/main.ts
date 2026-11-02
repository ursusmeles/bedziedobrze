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

const initEmailReveal = () => {
  const revealBtn = document.querySelector('.reveal-btn') as HTMLButtonElement;
  const emailBox = document.querySelector('.email-box') as HTMLAnchorElement;

  if (revealBtn && emailBox) {
    let isRevealed = false;
    let realEmail = '';

    revealBtn.addEventListener('click', async () => {
      // STATE 0 -> 1: Reveal the email
      if (!isRevealed) {
        const user = revealBtn.dataset.u;
        const domain = revealBtn.dataset.d;
        realEmail = `${user}@${domain}`;

        // Inject data
        emailBox.textContent = realEmail;
        emailBox.href = `mailto:${realEmail}`;
        
        // Trigger animations & accessibility
        emailBox.removeAttribute('aria-hidden');
        emailBox.removeAttribute('tabindex');
        emailBox.classList.add('is-revealed');
        
        // Transform button into a Copy action
        revealBtn.textContent = 'Skopiuj adres';
        revealBtn.classList.add('is-clicked');
        
        isRevealed = true;
      } 
      // STATE 1 -> 2: Copy to clipboard
else {
        try {
          await navigator.clipboard.writeText(realEmail);
          
          // Visual feedback
          const originalText = revealBtn.textContent;
          revealBtn.textContent = 'Skopiowano!';
          revealBtn.classList.add('is-copied');
          revealBtn.style.pointerEvents = 'none'; // Prevent spam clicking
          
          // Reset back to State 1
          setTimeout(() => { 
            revealBtn.textContent = originalText;
            revealBtn.classList.remove('is-copied'); 
            revealBtn.style.pointerEvents = 'auto';
          }, 2000);
          
        } catch (err) {
          console.error('Clipboard copy failed', err);
          revealBtn.textContent = 'Błąd kopiowania';
        }
      }
    });
  }
};

// Master Initializer
document.addEventListener('astro:page-load', () => {
  initHeaderScroll();
  initMobileNav();
  initParallax();
  initEmailReveal();
});
