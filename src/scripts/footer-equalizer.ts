// Accumulate extra input only at the document end; native scrolling stays passive.
export const initFooterEqualizer = (signal: AbortSignal) => {
  const equalizer = document.querySelector<HTMLElement>('[data-footer-equalizer]');
  if (!equalizer || signal.aborted) return;
  const bars = [...equalizer.querySelectorAll<HTMLElement>('span')].map(element => ({
    element, peak: 0, nextBeat: 0, rising: false,
  }));
  if (!bars.length) return;
  const root = document.scrollingElement ?? document.documentElement;
  const random = (min: number, max: number) => min + Math.random() * (max - min);
  let energy = 0;
  let frame = 0;
  let lastInput = -Infinity;
  let viewportWidth = window.innerWidth;
  let touch: { x: number; y: number } | undefined;

  const atBottom = () => root.scrollHeight - root.scrollTop - window.innerHeight <= 2;
  const move = (bar: typeof bars[number], height: number, duration: number, rising: boolean) => {
    bar.element.style.setProperty('--bar-duration', `${duration}ms`);
    bar.element.style.setProperty('--bar-ease', `var(--ease-circ-${rising ? 'out' : 'in'})`);
    bar.element.style.setProperty('--bar-level', String(height));
  };
  const release = () => {
    window.cancelAnimationFrame(frame);
    frame = 0;
    if (!energy) return;
    for (const bar of bars) {
      move(bar, 0, random(90, 190), false);
      bar.nextBeat = 0;
      bar.rising = false;
    }
    equalizer.removeAttribute('data-equalizer-active');
  };
  const reset = () => { release(); energy = 0; };
  const render = (time: number) => {
    frame = 0;
    if (signal.aborted) return;
    // Start the short release promptly after the last input.
    if (time - lastInput >= 120) {
      release();
      return;
    }
    for (const bar of bars) {
      if (time < bar.nextBeat) continue;
      bar.rising = !bar.rising;
      if (bar.rising) bar.peak = energy * Math.min(1, random(0.3, 1.2));
      const height = bar.rising ? bar.peak : bar.peak * random(0.08, 0.4);
      const duration = bar.rising ? random(55, 125) : random(70, 160);
      move(bar, height, duration, bar.rising);
      bar.nextBeat = time + duration + random(0, 25);
    }
    // Only the clocks run here; CSS transitions interpolate each bar on its own.
    frame = window.requestAnimationFrame(render);
  };
  const push = (distance: number) => {
    if (!Number.isFinite(distance) || distance === 0 || signal.aborted) return;
    if (distance < 0) {
      reset();
      return;
    }
    if (!atBottom() || document.hidden) return;
    const now = performance.now();
    const pause = now - lastInput;
    if (pause >= 120) {
      release();
      // Let successive swipes build higher peaks even after the bars have dropped.
      energy *= Math.exp(-(pause - 120) / 1200);
    }
    lastInput = now;
    const viewport = Math.max(1, window.innerHeight);
    energy = Math.min(1, energy + Math.min(distance, viewport * 0.3) / (viewport * 0.5));
    equalizer.setAttribute('data-equalizer-active', '');
    if (!frame) frame = window.requestAnimationFrame(render);
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
    if (energy > 0 && !atBottom()) reset();
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
    for (const bar of bars) {
      for (const property of ['--bar-level', '--bar-duration', '--bar-ease']) {
        bar.element.style.removeProperty(property);
      }
    }
    equalizer.removeAttribute('data-equalizer-ready');
    touch = undefined;
  }, { once: true });
  equalizer.setAttribute('data-equalizer-ready', '');
};
