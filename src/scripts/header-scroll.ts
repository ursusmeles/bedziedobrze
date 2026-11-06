export const initHeaderScroll = (signal: AbortSignal, reducedMotion = false) => {
  const header = document.querySelector<HTMLElement>('.site-header');
  if (!header || signal.aborted) return;
  const desktop = window.matchMedia('(min-width: 44rem)');
  let previous = Math.max(0, window.scrollY);
  let direction = 0;
  let distance = 0;
  let frame = 0;

  const reveal = () => {
    header.classList.remove('is-hidden');
    direction = 0;
    distance = 0;
  };
  const update = () => {
    frame = 0;
    if (signal.aborted) return;
    const current = Math.max(0, window.scrollY);
    const delta = current - previous;
    previous = current;
    header.classList.toggle('is-scrolled', current > 100);
    if (!desktop.matches || reducedMotion || current < 160 || header.querySelector(':focus-visible')) {
      reveal();
      return;
    }
    if (!delta) return;
    const nextDirection = Math.sign(delta);
    if (nextDirection !== direction) {
      direction = nextDirection;
      distance = 0;
    }
    distance += Math.abs(delta);
    // Separate thresholds prevent jitter from small trackpad corrections.
    if (direction > 0 && distance >= 48) header.classList.add('is-hidden');
    if (direction < 0 && distance >= 12) reveal();
  };
  const requestUpdate = () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  };
  const reset = () => {
    previous = Math.max(0, window.scrollY);
    reveal();
  };
  window.addEventListener('scroll', requestUpdate, { passive: true, signal });
  desktop.addEventListener('change', reset, { signal });
  header.addEventListener('focusin', reveal, { signal });
  signal.addEventListener('abort', () => {
    window.cancelAnimationFrame(frame);
    header.classList.remove('is-hidden', 'is-scrolled');
  }, { once: true });
  update();
};
