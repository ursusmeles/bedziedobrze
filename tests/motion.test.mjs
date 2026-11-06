import assert from 'node:assert/strict';
import test from 'node:test';
import { mountMotion } from '../src/scripts/motion.ts';
import { initParallax } from '../src/scripts/parallax.ts';
import { initScrollOverlaps } from '../src/scripts/scroll-overlap.ts';
import { initTextReveals } from '../src/scripts/text-reveal.ts';

const flush = async () => { for (let index = 0; index < 8; index += 1) await Promise.resolve(); };

// These doubles test state and lifecycle; they do not render or assess layout.
const withBrowser = async (run, options = {}) => {
  const trace = [];
  const animations = [];
  const intersections = [];
  const resizes = [];
  const frames = new Map();
  const cleanups = [];
  let frameId = 0;

  class Style {
    values = new Map();
    getPropertyValue(name) { return this.values.get(name) || ''; }
    setProperty(name, value) { this.values.set(name, value); }
    removeProperty(name) { this.values.delete(name); }
    get transform() { return this.getPropertyValue('transform'); }
    set transform(value) { trace.push('write'); this.setProperty('transform', value); }
    get willChange() { return this.getPropertyValue('will-change'); }
    set willChange(value) { this.setProperty('will-change', value); }
  }
  class Element {
    constructor(top = 1100, height = 30) {
      this.top = top;
      this.height = height;
      this.textContent = 'A\u0301B\u00adC';
      this.style = new Style();
      this.dataset = {};
      this.classes = new Set();
      this.attributes = new Map();
      this.classList = { add: name => this.classes.add(name), remove: name => this.classes.delete(name) };
    }
    getBoundingClientRect() { trace.push('read'); return { top: this.top, left: 0, width: 100, height: this.height }; }
    setAttribute(name, value) { this.attributes.set(name, value); }
    removeAttribute(name) { this.attributes.delete(name); }
    closest() { return this.anchor || null; }
    animate(keyframes, timing) {
      if (options.animationError) throw new Error('Animation unavailable');
      let resolve, reject;
      const finished = new Promise((yes, no) => { resolve = yes; reject = no; });
      const animation = { keyframes, timing, finished, resolve, cancel: () => reject(new Error('cancelled')) };
      animations.push(animation);
      return animation;
    }
  }
  class IntersectionObserver {
    constructor(callback) { this.callback = callback; this.targets = new Set(); intersections.push(this); }
    observe(target) { this.targets.add(target); }
    unobserve(target) { this.targets.delete(target); }
    disconnect() { this.targets.clear(); }
    enter(target) { this.callback([{ target, isIntersecting: true }]); }
  }
  class ResizeObserver {
    constructor(callback) { this.callback = callback; this.targets = new Set(); resizes.push(this); }
    observe(target) { this.targets.add(target); }
    disconnect() { this.targets.clear(); }
    resize(target, height) { this.callback([{ target, borderBoxSize: [{ blockSize: height }] }]); }
  }

  const headings = [new Element(100), new Element(), new Element(2000)];
  const panel = new Element(1500, 2200);
  const parallax = [new Element(), new Element()];
  parallax.forEach(element => { element.anchor = new Element(500, 600); });
  const motion = new EventTarget();
  motion.matches = options.reduced ?? false;
  motion.change = value => { motion.matches = value; motion.dispatchEvent(new Event('change')); };
  const window = new EventTarget();
  Object.assign(window, {
    innerHeight: 800, innerWidth: 400, matchMedia: () => motion,
    requestAnimationFrame: callback => { const id = ++frameId; frames.set(id, callback); return id; },
    cancelAnimationFrame: id => frames.delete(id),
    IntersectionObserver, ResizeObserver,
  });
  if (options.noObserver) delete window.IntersectionObserver;
  if (options.noResize) delete window.ResizeObserver;
  const fonts = new EventTarget();
  fonts.ready = options.fonts ?? Promise.resolve();
  const document = new EventTarget();
  Object.assign(document, {
    body: {}, documentElement: { lang: 'pl' }, readyState: 'complete', fonts,
    querySelectorAll(selector) {
      if (selector === '[data-parallax]') return parallax;
      if (selector === '[data-scroll-pin="bottom"]') return [panel];
      assert.equal(selector, 'main h2, main h3, #liczby .card > .fixed');
      return headings;
    },
    createTreeWalker(element) {
      let used = false;
      return { nextNode() { if (used) return null; used = true; return element; } };
    },
    createRange() {
      let node, start, end;
      return {
        setStart(value, index) { node = value; start = index; },
        setEnd(value, index) { end = index; },
        getClientRects: () => [{ left: start * 10, top: node.top, width: node.textContent.slice(start, end) === '\u00ad' ? 0 : (end - start) * 10, height: 30 }],
      };
    },
  });
  const tokens = { '--duration-short': '210ms', '--delay-step': '20ms', '--ease-step-4': 'steps(7)' };
  const globals = {
    window, document, Element, IntersectionObserver, ResizeObserver, NodeFilter: { SHOW_TEXT: 4 },
    CSS: { supports: (property, value) => !value.startsWith('path') || options.path !== false },
    getComputedStyle: () => ({ fontSize: '20px', clipPath: 'none', getPropertyValue: name => tokens[name] || '' }),
  };
  const originals = new Map(Object.keys(globals).map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  Object.entries(globals).forEach(([name, value]) => Object.defineProperty(globalThis, name, { configurable: true, writable: true, value }));
  const controller = () => {
    const value = new AbortController();
    cleanups.push(() => value.abort());
    return value;
  };
  try {
    await run({ window, document, headings, panel, parallax, animations, intersections, resizes, frames, motion, trace, controller, cleanups });
  } finally {
    cleanups.reverse().forEach(cleanup => cleanup());
    await flush();
    originals.forEach((descriptor, name) => descriptor ? Object.defineProperty(globalThis, name, descriptor) : delete globalThis[name]);
  }
};

test('text reveals keep graphemes together, skip unused hyphens and play only once', async () => {
  await withBrowser(async ({ headings, animations, intersections, controller }) => {
    initTextReveals(controller().signal);
    await flush();
    assert.equal(headings[0].classes.size, 0);
    intersections[0].enter(headings[1]);
    assert.equal(animations[0].timing.duration, 300);
    assert.equal((animations[0].keyframes[0].clipPath.match(/M/g) || []).length, 3);
    assert.equal(headings[1].textContent, 'A\u0301B\u00adC');
    animations[0].resolve();
    await flush();
    assert.equal(headings[1].classes.size, 0);
    intersections[0].enter(headings[1]);
    assert.equal(animations.length, 1);
    headings[2].textContent = 'A'.repeat(100);
    intersections[0].enter(headings[2]);
    assert.equal(animations[1].timing.duration, 840);
  });
});

test('text stays visible when an observer is missing or initialization is cancelled during font loading', async () => {
  await withBrowser(async ({ headings, controller }) => {
    initTextReveals(controller().signal);
    await flush();
    assert.ok(headings.every(element => element.classes.size === 0));
  }, { noObserver: true });
  let resolveFonts;
  await withBrowser(async ({ headings, intersections, controller }) => {
    const page = controller();
    initTextReveals(page.signal);
    page.abort();
    resolveFonts();
    await flush();
    assert.equal(intersections.length, 0);
    assert.ok(headings.every(element => element.classes.size === 0));
  }, { fonts: new Promise(resolve => { resolveFonts = resolve; }) });
});

test('unsupported path masks fall back to a whole wipe; animation failures restore text', async () => {
  await withBrowser(async ({ headings, animations, intersections, controller }) => {
    initTextReveals(controller().signal);
    await flush();
    intersections[0].enter(headings[1]);
    assert.equal(animations[0].keyframes.length, 2);
    assert.equal(animations[0].keyframes[0].clipPath, 'inset(0 100% 0 0)');
  }, { path: false });
  await withBrowser(async ({ headings, intersections, controller }) => {
    initTextReveals(controller().signal);
    await flush();
    intersections[0].enter(headings[1]);
    assert.equal(headings[1].classes.size, 0);
  }, { animationError: true });
});

test('mobile toolbar height changes do not interrupt text, but width changes clear stale masks', async () => {
  await withBrowser(async ({ window, headings, intersections, controller }) => {
    initTextReveals(controller().signal);
    await flush();
    intersections[0].enter(headings[1]);
    window.innerHeight = 850;
    window.dispatchEvent(new Event('resize'));
    assert.equal(headings[1].classes.size, 1);
    window.innerWidth = 600;
    window.dispatchEvent(new Event('resize'));
    assert.equal(headings[1].classes.size, 0);
  });
});

test('bottom pins use ResizeObserver border-box measurements and release all state on abort', async () => {
  await withBrowser(({ panel, resizes, trace, controller }) => {
    const page = controller();
    initScrollOverlaps(page.signal);
    assert.equal(panel.style.getPropertyValue('--overlap-height'), '2200px');
    trace.length = 0;
    resizes[0].resize(panel, 2700);
    assert.equal(panel.style.getPropertyValue('--overlap-height'), '2700px');
    assert.equal(trace.length, 0, 'observer update does not force a layout read');
    page.abort();
    assert.equal(panel.style.getPropertyValue('--overlap-height'), '');
    assert.equal(panel.attributes.size, 0);
    resizes[0].resize(panel, 3000);
    assert.equal(panel.attributes.size, 0);
    assert.equal(resizes[0].targets.size, 0);
  });
  await withBrowser(({ panel, controller }) => {
    initScrollOverlaps(controller().signal);
    assert.equal(panel.attributes.size, 0);
  }, { noResize: true });
});

test('parallax batches geometry reads, coalesces scroll frames and restores styles on abort', async () => {
  await withBrowser(({ window, parallax, frames, trace, controller }) => {
    parallax[0].style.transform = 'rotate(1deg)';
    parallax[0].style.willChange = 'opacity';
    trace.length = 0;
    const page = controller();
    initParallax(page.signal);
    assert.deepEqual(trace, ['read', 'read', 'write', 'write']);
    for (let index = 0; index < 3; index += 1) window.dispatchEvent(new Event('scroll'));
    assert.equal(frames.size, 1);
    page.abort();
    assert.equal(frames.size, 0);
    assert.equal(parallax[0].style.transform, 'rotate(1deg)');
    assert.equal(parallax[0].style.willChange, 'opacity');
    window.dispatchEvent(new Event('scroll'));
    assert.equal(frames.size, 0);
  });
});

test('one motion lifecycle handles Astro swaps and reduced-motion changes without duplicate observers', async () => {
  await withBrowser(async ({ document, headings, panel, intersections, resizes, motion, cleanups }) => {
    cleanups.push(mountMotion());
    await flush();
    document.dispatchEvent(new Event('astro:page-load'));
    await flush();
    assert.equal(intersections.length, 1);
    assert.equal(resizes.length, 1);
    document.dispatchEvent(new Event('astro:before-swap'));
    assert.ok(headings.every(element => element.classes.size === 0));
    assert.equal(panel.attributes.size, 0);
    document.body = {};
    document.dispatchEvent(new Event('astro:after-swap'));
    document.dispatchEvent(new Event('astro:page-load'));
    await flush();
    assert.equal(resizes.length, 2);
    motion.change(true);
    assert.equal(panel.attributes.size, 0);
    assert.ok(resizes.every(observer => observer.targets.size === 0));
    motion.change(false);
    await flush();
    assert.equal(resizes.length, 3);
  });
});

test('a reduced-motion page creates no observers or animation frames', async () => {
  await withBrowser(async ({ intersections, resizes, frames, headings, cleanups }) => {
    cleanups.push(mountMotion());
    await flush();
    assert.equal(intersections.length, 0);
    assert.equal(resizes.length, 0);
    assert.equal(frames.size, 0);
    assert.ok(headings.every(element => element.classes.size === 0));
  }, { reduced: true });
});
