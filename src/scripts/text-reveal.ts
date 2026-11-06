// Range masks preserve kerning, balanced wrapping and discretionary hyphens.
type GlyphMask = { left: number; top: number; width: number; height: number };

const revealTimeScale = 1.2;
const maxRevealDuration = 700 * revealTimeScale;
const completed = new WeakSet<HTMLElement>();
const readMilliseconds = (styles: CSSStyleDeclaration, token: string, fallback: number) => {
  const match = styles.getPropertyValue(token).trim().match(/^(\d+(?:\.\d+)?)(ms|s)$/);
  return match ? Number(match[1]) * (match[2] === 's' ? 1000 : 1) : fallback;
};

const measureGlyphs = (element: HTMLElement, segmenter: Intl.Segmenter): GlyphMask[] => {
  const origin = element.getBoundingClientRect();
  const padding = Number.parseFloat(getComputedStyle(element).fontSize) * 0.1;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
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
  // Longer text accelerates the stagger rather than exceeding the sequence cap.
  const delay = Math.min(stagger, Math.max(0, maxRevealDuration - duration) / Math.max(1, masks.length - 1));
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

// Only the paint is masked. Native text, wrapping and accessible names stay intact.
export const initTextReveals = (signal: AbortSignal) => {
  if (signal.aborted || !('IntersectionObserver' in window) || !('animate' in Element.prototype)
    || typeof CSS === 'undefined' || !CSS.supports('clip-path', 'inset(0 100% 0 0)')) return;

  const pending = new Set<HTMLElement>();
  const active = new Map<HTMLElement, Animation>();
  let observer: IntersectionObserver | undefined;

  const finish = (element: HTMLElement) => {
    completed.add(element);
    pending.delete(element);
    element.classList.remove('text-reveal-pending');
    const animation = active.get(element);
    active.delete(element);
    animation?.cancel();
  };
  const showAll = () => {
    observer?.disconnect();
    [...pending].forEach(finish);
  };
  signal.addEventListener('abort', showAll, { once: true });

  const prepare = async () => {
    // Keep everything visible while fonts load; never measure fallback typography.
    await document.fonts.ready;
    if (signal.aborted) return;

    const styles = getComputedStyle(document.documentElement);
    const duration = Math.min(maxRevealDuration, readMilliseconds(styles, '--duration-short', 210) * revealTimeScale);
    const stagger = readMilliseconds(styles, '--delay-step', 20) * revealTimeScale;
    if (duration <= 0) return;
    const easing = styles.getPropertyValue('--ease-step-4').trim() || 'steps(7)';
    const steps = Number(easing.match(/steps\(\s*(\d+)/)?.[1]) || 7;
    const segmenter = typeof Intl.Segmenter === 'function'
      && CSS.supports('clip-path', 'path("M0 0H1V1H0Z")')
      ? new Intl.Segmenter(document.documentElement.lang || 'pl', { granularity: 'grapheme' })
      : null;

    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        if (!entry.isIntersecting || !pending.has(element) || signal.aborted) continue;
        observer?.unobserve(element);
        try {
          const masks = segmenter ? measureGlyphs(element, segmenter) : [];
          const effect = masks.length
            ? letterKeyframes(masks, duration, stagger, steps)
            : {
                keyframes: [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0)' }],
                duration,
              };
          const animation = element.animate(effect.keyframes, {
            duration: effect.duration,
            easing: masks.length ? 'linear' : easing,
            fill: 'both',
          });
          active.set(element, animation);
          animation.finished.then(() => finish(element), () => finish(element));
        } catch {
          finish(element);
        }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });

    const finishActive = () => [...active.keys()].forEach(finish);
    let viewportWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      // Mobile browser chrome changes viewport height during ordinary scrolling.
      if (window.innerWidth === viewportWidth) return;
      viewportWidth = window.innerWidth;
      finishActive();
    }, { passive: true, signal });
    document.fonts.addEventListener('loadingdone', finishActive, { signal });

    for (const element of document.querySelectorAll<HTMLElement>('main h2, main h3, #liczby .card > .fixed')) {
      const rect = element.getBoundingClientRect();
      // Already visible headings, including direct section links, stay visible.
      if (completed.has(element) || rect.top < window.innerHeight || !rect.width || !rect.height
        || getComputedStyle(element).clipPath !== 'none') continue;
      pending.add(element);
      element.classList.add('text-reveal-pending');
      observer.observe(element);
    }
  };

  // An optional enhancement must never leave text concealed after a failure.
  void prepare().catch(showAll);
};
