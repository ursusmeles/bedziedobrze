// Keep the text untouched: Range measurements let masks follow native kerning,
// balanced wrapping and discretionary hyphens without splitting the heading.
type GlyphMask = { left: number; top: number; width: number; height: number };

const completed = new WeakSet<HTMLElement>();
let currentBody: HTMLElement | null = null;
let generation = 0;
let dispose = () => {};

const resetHeadingReveals = () => {
  generation += 1;
  dispose();
  dispose = () => {};
  currentBody = null;
};

const readMilliseconds = (styles: CSSStyleDeclaration, token: string, fallback: number) => {
  const value = styles.getPropertyValue(token).trim();
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number * (value.endsWith('ms') ? 1 : 1000) : fallback;
};

const measureGlyphs = (heading: HTMLElement, segmenter: Intl.Segmenter): GlyphMask[] => {
  const origin = heading.getBoundingClientRect();
  const padding = Number.parseFloat(getComputedStyle(heading).fontSize) * 0.1;
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  const masks: GlyphMask[] = [];
  let node: Node | null;

  while ((node = walker.nextNode())) {
    for (const { segment, index } of segmenter.segment(node.textContent ?? '')) {
      if (/^\s+$/u.test(segment)) continue;
      range.setStart(node, index);
      range.setEnd(node, index + segment.length);

      for (const rect of range.getClientRects()) {
        // An unused soft hyphen has no painted width.
        if (rect.width <= 0 || rect.height <= 0) continue;
        masks.push({
          left: rect.left - origin.left - padding,
          top: rect.top - origin.top - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });
      }
    }
  }

  return masks;
};

const letterKeyframes = (masks: GlyphMask[], duration: number, stagger: number, steps: number) => {
  // Longer headings accelerate the stagger rather than exceeding 700ms.
  const delay = Math.min(stagger, Math.max(0, 700 - duration) / Math.max(1, masks.length - 1));
  const total = duration + delay * (masks.length - 1);
  const frames = Math.ceil(total / (1000 / 60));
  const keyframes: Keyframe[] = [];
  const round = (value: number) => Math.round(value * 100) / 100;

  for (let frame = 0; frame <= frames; frame += 1) {
    const time = total * frame / frames;
    const path = masks.map((mask, index) => {
      const progress = Math.min(1, Math.max(0, (time - delay * index) / duration));
      const stepped = Math.floor(progress * steps + 1e-8) / steps;
      return `M${round(mask.left)} ${round(mask.top)}h${round(mask.width * stepped)}v${round(mask.height)}h${round(-mask.width * stepped)}Z`;
    }).join(' ');
    keyframes.push({ clipPath: `path("${path}")`, offset: frame / frames, easing: 'steps(1, end)' });
  }

  return { keyframes, duration: total };
};

const initHeadingReveals = async () => {
  if (currentBody === document.body) return;
  resetHeadingReveals();
  currentBody = document.body;
  const version = generation;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (motion.matches || !('IntersectionObserver' in window) || !('animate' in Element.prototype)
    || !CSS.supports('clip-path', 'inset(0 100% 0 0)')) return;

  // Never hide content while fonts are loading. Measure only settled typography.
  await document.fonts.ready;
  if (generation !== version || motion.matches) return;

  const styles = getComputedStyle(document.documentElement);
  const duration = Math.min(700, readMilliseconds(styles, '--duration-short', 210));
  const stagger = readMilliseconds(styles, '--delay-step', 20);
  if (duration <= 0) return;
  const easing = styles.getPropertyValue('--ease-step-4').trim() || 'steps(7)';
  const steps = Number(easing.match(/steps\(\s*(\d+)/)?.[1]) || 7;
  const segmenter = typeof Intl.Segmenter === 'function'
    && CSS.supports('clip-path', 'path("M0 0H1V1H0Z")')
    ? new Intl.Segmenter(document.documentElement.lang || 'pl', { granularity: 'grapheme' })
    : null;
  const pending = new Set<HTMLElement>();
  const active = new Map<HTMLElement, Animation>();

  const finish = (heading: HTMLElement) => {
    completed.add(heading);
    pending.delete(heading);
    heading.classList.remove('heading-reveal-pending');
    const animation = active.get(heading);
    active.delete(heading);
    animation?.cancel();
  };

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const heading = entry.target as HTMLElement;
      if (!pending.has(heading)) continue;
      observer.unobserve(heading);
      try {
        const masks = segmenter ? measureGlyphs(heading, segmenter) : [];
        const effect = masks.length
          ? letterKeyframes(masks, duration, stagger, steps)
          : {
              keyframes: [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0)' }],
              duration,
            };
        const animation = heading.animate(effect.keyframes, {
          duration: effect.duration,
          easing: masks.length ? 'linear' : easing,
          fill: 'both',
        });
        active.set(heading, animation);
        animation.finished.then(() => finish(heading), () => finish(heading));
      } catch {
        finish(heading);
      }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });

  // A viewport/font change can invalidate an in-flight mask. Reveal immediately;
  // headings still waiting for entry will be measured at their new size.
  const finishActive = () => [...active.keys()].forEach(finish);
  let viewportWidth = window.innerWidth;
  const onResize = () => {
    // Mobile browser chrome changes viewport height during ordinary scrolling.
    if (window.innerWidth === viewportWidth) return;
    viewportWidth = window.innerWidth;
    finishActive();
  };
  const showAll = () => {
    observer.disconnect();
    [...pending].forEach(finish);
  };
  const onMotionChange = () => { if (motion.matches) showAll(); };
  dispose = () => {
    showAll();
    window.removeEventListener('resize', onResize);
    document.fonts.removeEventListener('loadingdone', finishActive);
    motion.removeEventListener('change', onMotionChange);
  };
  window.addEventListener('resize', onResize, { passive: true });
  document.fonts.addEventListener('loadingdone', finishActive);
  motion.addEventListener('change', onMotionChange);

  try {
    for (const heading of document.querySelectorAll<HTMLElement>('main h2')) {
      const rect = heading.getBoundingClientRect();
      // Leave already visible headings alone, including direct section links.
      if (completed.has(heading) || rect.top < window.innerHeight || !rect.width || !rect.height
        || getComputedStyle(heading).clipPath !== 'none') continue;
      pending.add(heading);
      heading.classList.add('heading-reveal-pending');
      observer.observe(heading);
    }
  } catch {
    dispose();
  }
};

const startHeadingReveals = () => { void initHeadingReveals().catch(resetHeadingReveals); };
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startHeadingReveals, { once: true });
} else {
  startHeadingReveals();
}
document.addEventListener('astro:page-load', startHeadingReveals);
document.addEventListener('astro:before-swap', resetHeadingReveals);
