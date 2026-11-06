import { initParallax } from './parallax.ts';
import { initScrollOverlaps } from './scroll-overlap.ts';
import { initTextReveals } from './text-reveal.ts';

// One owner for page observers, listeners, pending frames and motion preference.
export const mountMotion = () => {
  const lifetime = new AbortController();
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let body: HTMLElement | null = null;
  let page: AbortController | undefined;

  const stop = () => {
    page?.abort();
    page = undefined;
    body = null;
  };
  const start = () => {
    if (body === document.body) return;
    stop();
    body = document.body;
    if (preference.matches) return;
    page = new AbortController();
    try {
      initTextReveals(page.signal);
      initScrollOverlaps(page.signal);
      initParallax(page.signal);
    } catch (error) {
      page.abort();
      console.warn('Motion enhancement skipped:', error);
    }
  };

  document.addEventListener('astro:before-swap', stop, { signal: lifetime.signal });
  document.addEventListener('astro:after-swap', start, { signal: lifetime.signal });
  document.addEventListener('astro:page-load', start, { signal: lifetime.signal });
  preference.addEventListener('change', () => { stop(); start(); }, { signal: lifetime.signal });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true, signal: lifetime.signal });
  } else {
    start();
  }
  return () => { stop(); lifetime.abort(); };
};
