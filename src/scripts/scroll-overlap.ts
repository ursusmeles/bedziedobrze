// Measure the border box so padding and responsive text count toward the pin.
export const initScrollOverlaps = (signal: AbortSignal) => {
  if (signal.aborted || !('ResizeObserver' in window)) return;
  const sections = [...document.querySelectorAll<HTMLElement>('[data-scroll-pin="bottom"]')];
  if (!sections.length) return;

  const applyHeight = (element: HTMLElement, height: number) => {
    if (!Number.isFinite(height) || height <= 0) return;
    const value = `${height}px`;
    if (element.style.getPropertyValue('--overlap-height') === value) return;
    element.style.setProperty('--overlap-height', value);
    element.setAttribute('data-pin-ready', '');
  };
  const observer = new ResizeObserver(entries => {
    if (signal.aborted) return;
    const measurements = entries.map(entry => ({
      element: entry.target as HTMLElement,
      height: entry.borderBoxSize?.[0]?.blockSize ?? entry.target.getBoundingClientRect().height,
    }));
    measurements.forEach(({ element, height }) => applyHeight(element, height));
  });
  signal.addEventListener('abort', () => {
    observer.disconnect();
    for (const section of sections) {
      section.style.removeProperty('--overlap-height');
      section.removeAttribute('data-pin-ready');
    }
  }, { once: true });

  // Batch layout reads before writes; later updates use ResizeObserver sizes.
  const heights = sections.map(section => section.getBoundingClientRect().height);
  sections.forEach((section, index) => {
    applyHeight(section, heights[index]);
    observer.observe(section, { box: 'border-box' });
  });
};
