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

const initSlider = () => {
  const slider = document.querySelector('.klienci-list.reel') as HTMLElement;
  if (!slider) return;

  let isDown = false;
  let startX = 0;
  let initialScrollLeft = 0;
  let animationId: number;
  let scrollSpeed = 0.5; 
  let direction = 1; 
  let isHovered = false;
  let exactScroll = slider.scrollLeft;

  const autoScroll = () => {
    if (!isDown && !isHovered) {
      exactScroll += (scrollSpeed * direction);
      slider.scrollLeft = exactScroll;
      
      if (Math.ceil(exactScroll) >= slider.scrollWidth - slider.clientWidth) {
        direction = -1;
      } else if (Math.floor(exactScroll) <= 0) {
        direction = 1;
      }
    }
    animationId = requestAnimationFrame(autoScroll);
  };

  autoScroll();

  slider.addEventListener('mousedown', (e) => {
    isDown = true;
    slider.classList.add('is-dragging');
    startX = e.pageX - slider.offsetLeft;
    initialScrollLeft = slider.scrollLeft;
    slider.style.scrollSnapType = 'none';
  });

  slider.addEventListener('mouseenter', () => { isHovered = true; });

  slider.addEventListener('mouseleave', () => {
    isDown = false;
    isHovered = false; 
    slider.classList.remove('is-dragging');
    exactScroll = slider.scrollLeft;
    slider.style.scrollSnapType = '';
  });

  slider.addEventListener('mouseup', () => {
    isDown = false;
    slider.classList.remove('is-dragging');
    exactScroll = slider.scrollLeft;
    slider.style.scrollSnapType = '';
  });

  slider.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault(); 
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 1.5; 
    slider.scrollLeft = initialScrollLeft - walk;
  });

  document.addEventListener('astro:before-preparation', () => {
    cancelAnimationFrame(animationId);
  }, { once: true });
};

const initTabs = () => {
  const tabWrappers = document.querySelectorAll('.stack'); 

  tabWrappers.forEach(wrapper => {
    const tabs = wrapper.querySelectorAll('[role="tab"]');
    const panels = wrapper.querySelectorAll('[role="tabpanel"]');
    if (tabs.length === 0 || panels.length === 0) return;

    let transitionTimeout: any;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const isSelected = tab.getAttribute('aria-selected') === 'true';
        const anyOpen = Array.from(tabs).some(t => t.getAttribute('aria-selected') === 'true');

        tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
        panels.forEach(p => p.setAttribute('aria-hidden', 'true'));
        clearTimeout(transitionTimeout);

        if (!isSelected) {
          tab.setAttribute('aria-selected', 'true');
          const targetPanel = wrapper.querySelector(`#${tab.getAttribute('aria-controls')}`);
          
          if (targetPanel) {
            if (anyOpen) {
              transitionTimeout = setTimeout(() => {
                targetPanel.setAttribute('aria-hidden', 'false');
              }, 400); 
            } else {
              targetPanel.setAttribute('aria-hidden', 'false');
            }
          }
        }
      });
    });
  });
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
  initSlider();
  initTabs();
  initEmailReveal();
});