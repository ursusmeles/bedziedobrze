export {};

// A bottom pin needs the actual section height, including responsive text.
// CSS owns the viewport offset and disables pinning for reduced motion.
let currentBody: HTMLElement | null = null;
let dispose = () => {};

const resetScrollOverlaps = () => {
  dispose();
  dispose = () => {};
  currentBody = null;
};

const initScrollOverlaps = () => {
  if (currentBody === document.body) return;
  resetScrollOverlaps();
  currentBody = document.body;
  if (!('ResizeObserver' in window)) return;

  const sections = [...document.querySelectorAll<HTMLElement>('[data-scroll-pin="bottom"]')];
  const measure = (section: HTMLElement) => {
    const height = section.getBoundingClientRect().height;
    if (height <= 0) return;
    const value = `${height}px`;
    if (section.style.getPropertyValue('--overlap-height') !== value) {
      section.style.setProperty('--overlap-height', value);
    }
    section.setAttribute('data-pin-ready', '');
  };
  let active = true;
  const observer = new ResizeObserver(entries => {
    if (!active) return;
    for (const entry of entries) measure(entry.target as HTMLElement);
  });
  dispose = () => {
    active = false;
    observer.disconnect();
    for (const section of sections) {
      section.style.removeProperty('--overlap-height');
      section.removeAttribute('data-pin-ready');
    }
  };

  for (const section of sections) {
    measure(section);
    observer.observe(section, { box: 'border-box' });
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollOverlaps, { once: true });
} else {
  initScrollOverlaps();
}
document.addEventListener('astro:page-load', initScrollOverlaps);
document.addEventListener('astro:before-swap', resetScrollOverlaps);
