const readNumber = (value: string | undefined, fallback: number) => {
  const number = Number.parseFloat(value ?? '');
  return Number.isFinite(number) ? number : fallback;
};

export const initParallax = (signal: AbortSignal) => {
  if (signal.aborted) return;
  const elements = [...document.querySelectorAll<HTMLElement>('[data-parallax]')].map(element => ({
    element,
    anchor: element.closest('section') ?? element.parentElement ?? element,
    speed: readNumber(element.dataset.speed, -0.15),
    divisor: Math.max(1, readNumber(element.dataset.anchor, 2)),
    transform: element.style.transform,
    willChange: element.style.willChange,
  }));
  if (!elements.length) return;
  let frame = 0;

  const update = () => {
    frame = 0;
    if (signal.aborted) return;
    const center = window.innerHeight / 2;
    // All geometry reads precede writes, avoiding layout work between images.
    const transforms = elements.map(({ anchor, speed, divisor }) => {
      const rect = anchor.getBoundingClientRect();
      const distance = center - (rect.top + rect.height / divisor);
      const scale = Math.max(0.01, 1 + distance * 0.0001);
      return `translate3d(0, ${distance * speed}px, 0) scale(${scale})`;
    });
    elements.forEach(({ element }, index) => { element.style.transform = transforms[index]; });
  };
  const requestUpdate = () => {
    if (!frame && !signal.aborted) frame = window.requestAnimationFrame(update);
  };
  signal.addEventListener('abort', () => {
    window.cancelAnimationFrame(frame);
    elements.forEach(({ element, transform, willChange }) => {
      element.style.transform = transform;
      element.style.willChange = willChange;
    });
  }, { once: true });
  elements.forEach(({ element }) => { element.style.willChange = 'transform'; });
  window.addEventListener('scroll', requestUpdate, { passive: true, signal });
  window.addEventListener('resize', requestUpdate, { passive: true, signal });
  document.fonts.addEventListener('loadingdone', requestUpdate, { signal });
  update();
};
