// Accumulate extra input only at the document end; native scrolling stays passive.
export const initFooterEqualizer = (signal: AbortSignal) => {
  const equalizer = document.querySelector<HTMLElement>('[data-footer-equalizer]');
  if (!equalizer || signal.aborted) return;
  const root = document.scrollingElement ?? document.documentElement;
  let level = 0;
  let frame = 0;
  let settleTimer = 0;
  let viewportWidth = window.innerWidth;
  let touch: { x: number; y: number } | undefined;

  const atBottom = () => root.scrollHeight - root.scrollTop - window.innerHeight <= 2;
  const render = () => {
    frame = 0;
    if (signal.aborted) return;
    equalizer.style.setProperty('--equalizer-level', String(level));
    if (level > 0) equalizer.setAttribute('data-equalizer-active', '');
  };
  const reset = () => {
    window.cancelAnimationFrame(frame);
    window.clearTimeout(settleTimer);
    frame = 0;
    settleTimer = 0;
    level = 0;
    equalizer.style.setProperty('--equalizer-level', '0');
    equalizer.removeAttribute('data-equalizer-active');
  };
  const push = (distance: number) => {
    if (!Number.isFinite(distance) || distance === 0 || signal.aborted) return;
    if (distance < 0) {
      reset();
      return;
    }
    if (!atBottom()) return;
    const viewport = Math.max(1, window.innerHeight);
    level = Math.min(1, level + Math.min(distance, viewport * 0.3) / (viewport * 0.75));
    if (!frame) frame = window.requestAnimationFrame(render);
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(reset, 1400);
  };

  window.addEventListener('wheel', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.deltaZ
      || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    // Wheel deltas can be pixels, lines or pages; normalize the effort.
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    push(event.deltaY * unit);
  }, { passive: true, signal });
  window.addEventListener('touchstart', event => {
    touch = event.touches.length === 1
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
      : undefined;
  }, { passive: true, signal });
  window.addEventListener('touchmove', event => {
    if (!touch || event.touches.length !== 1) {
      touch = undefined;
      return;
    }
    const current = event.touches[0];
    const horizontal = current.clientX - touch.x;
    const vertical = touch.y - current.clientY;
    touch = { x: current.clientX, y: current.clientY };
    if (!event.defaultPrevented && Math.abs(vertical) > Math.abs(horizontal)) push(vertical);
  }, { passive: true, signal });
  const endTouch = () => { touch = undefined; };
  window.addEventListener('touchend', endTouch, { passive: true, signal });
  window.addEventListener('touchcancel', endTouch, { passive: true, signal });
  window.addEventListener('scroll', () => {
    if (level > 0 && !atBottom()) reset();
  }, { passive: true, signal });
  window.addEventListener('resize', () => {
    // Browser chrome changes mobile viewport height during a swipe.
    if (window.innerWidth === viewportWidth) return;
    viewportWidth = window.innerWidth;
    reset();
  }, { passive: true, signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) reset();
  }, { signal });
  signal.addEventListener('abort', () => {
    reset();
    equalizer.style.removeProperty('--equalizer-level');
    equalizer.removeAttribute('data-equalizer-ready');
    touch = undefined;
  }, { once: true });
  equalizer.setAttribute('data-equalizer-ready', '');
};
