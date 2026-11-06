import { initFooterEqualizer } from '../src/scripts/footer-equalizer.ts';
import { initHeaderScroll } from '../src/scripts/header-scroll.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import { mountMotion } from '../src/scripts/motion.ts';
import { initParallax } from '../src/scripts/parallax.ts';
import { initScrollOverlaps } from '../src/scripts/scroll-overlap.ts';
import { initTextReveals } from '../src/scripts/text-reveal.ts';

const dispatch = (target, type, fields = {}) => {
  const event = Object.assign(new Event(type, { cancelable: true }), fields);
  target.dispatchEvent(event);
  return event;
};
const drain = (callbacks, time = 0) => {
  const pending = [...callbacks.values()];
  callbacks.clear();
  pending.forEach(callback => callback(time));
};

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
  let now = 0;
  let randomState = 123;
  const originalRandom = Math.random;
  Math.random = () => {
    randomState = (1664525 * randomState + 1013904223) >>> 0;
    return randomState / 2 ** 32;
  };
  const advance = milliseconds => { now += milliseconds; drain(frames, now); };

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
  class Element extends EventTarget {
    constructor(top = 1100, height = 30) {
      super();
      this.top = top;
      this.height = height;
      this.textContent = 'A\u0301B\u00adC';
      this.style = new Style();
      this.dataset = {};
      this.classes = new Set();
      this.attributes = new Map();
      this.classList = {
        add: (...names) => names.forEach(name => this.classes.add(name)),
        remove: (...names) => names.forEach(name => this.classes.delete(name)),
        toggle: (name, force) => force ? this.classes.add(name) : this.classes.delete(name),
      };
    }
    getBoundingClientRect() { trace.push('read'); return { top: this.top, left: 0, width: 100, height: this.height }; }
    setAttribute(name, value) { this.attributes.set(name, value); }
    removeAttribute(name) { this.attributes.delete(name); }
    closest() { return this.anchor || null; }
    querySelector() { return this.keyboardFocus ? {} : null; }
    querySelectorAll(selector) { assert.equal(selector, 'span'); return this.children || []; }
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
  const equalizer = new Element();
  const bars = Array.from({ length: 12 }, () => new Element());
  equalizer.children = bars;
  const header = new Element(0);
  const root = { lang: 'pl', scrollHeight: 8000, scrollTop: 0 };
  const desktop = new EventTarget();
  desktop.matches = options.desktop ?? false;
  const motion = new EventTarget();
  motion.matches = options.reduced ?? false;
  motion.change = value => { motion.matches = value; motion.dispatchEvent(new Event('change')); };
  const window = new EventTarget();
  Object.assign(window, {
    innerHeight: 800, innerWidth: 400, scrollY: 0,
    matchMedia: query => query === '(min-width: 44rem)' ? desktop : motion,
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
    body: {}, documentElement: root, scrollingElement: root, readyState: 'complete', fonts,
    querySelector(selector) {
      if (selector === '[data-footer-equalizer]') return options.noEqualizer ? null : equalizer;
      if (selector === '.site-header') return header;
      throw new Error(`Unexpected selector: ${selector}`);
    },
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
    window, document, performance: { now: () => now }, Element, IntersectionObserver, ResizeObserver, NodeFilter: { SHOW_TEXT: 4 },
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
    await run({ window, document, headings, panel, parallax, animations, intersections, resizes, frames, advance, motion, trace, controller, cleanups, equalizer, bars, header, root, desktop });
  } finally {
    cleanups.reverse().forEach(cleanup => cleanup());
    await flush();
    Math.random = originalRandom;
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
  await withBrowser(async ({ intersections, resizes, frames, headings, cleanups, equalizer, header }) => {
    cleanups.push(mountMotion());
    await flush();
    assert.equal(intersections.length, 0);
    assert.equal(resizes.length, 0);
    assert.equal(frames.size, 0);
    assert.equal(equalizer.attributes.size, 0);
    assert.equal(header.classes.has('is-hidden'), false);
    assert.ok(headings.every(element => element.classes.size === 0));
  }, { reduced: true });
});


const levels = bars => bars.map(bar => Number(bar.style.getPropertyValue('--bar-level')));
const wheel = (window, fields = {}) => dispatch(window, 'wheel', { deltaX: 0, deltaY: 120, deltaMode: 0, ...fields });

test('footer normalizes wheel effort, caps peaks, ignores other gestures and leaves scrolling native', async () => {
  const waves = [];
  for (const fields of [{ deltaY: 120 }, { deltaY: 7.5, deltaMode: 1 }, { deltaY: 0.15, deltaMode: 2 }]) {
    await withBrowser(({ window, root, bars, equalizer, frames, advance, controller }) => {
      initFooterEqualizer(controller().signal);
      wheel(window);
      assert.equal(frames.size, 0);
      root.scrollTop = root.scrollHeight - window.innerHeight;
      const scrollTop = root.scrollTop;
      for (const ignored of [{ ctrlKey: true }, { metaKey: true }, { deltaX: 200 }, { deltaZ: 1 }, { deltaY: NaN }]) wheel(window, ignored);
      assert.equal(frames.size, 0);
      assert.equal(wheel(window, fields).defaultPrevented, false);
      advance(0);
      waves.push(levels(bars));
      assert.ok(levels(bars).every(height => height > 0 && height <= 0.3));
      assert.equal(root.scrollTop, scrollTop);
      wheel(window, { deltaY: -120 });
      assert.ok(levels(bars).every(height => height === 0));
      assert.equal(frames.size, 0);
      assert.equal(equalizer.attributes.has('data-equalizer-active'), false);
      for (let index = 0; index < 20; index += 1) wheel(window, { deltaY: 500 });
      assert.equal(frames.size, 1, 'multiple inputs use one shared clock');
      advance(0);
      assert.ok(levels(bars).every(height => height >= 0 && height <= 1));
      assert.ok(levels(bars).includes(1), 'full effort can reach the viewport cap');
    });
  }
  assert.deepEqual(waves[0], waves[1]);
  assert.deepEqual(waves[0], waves[2]);
});

test('bars pulse on independent clocks with changing peaks and circ attack and release', async () => {
  await withBrowser(({ window, root, bars, frames, advance, controller }) => {
    initFooterEqualizer(controller().signal);
    root.scrollTop = root.scrollHeight - window.innerHeight;
    wheel(window);
    advance(0);
    assert.ok(new Set(levels(bars)).size > 6);
    assert.ok(new Set(bars.map(bar => bar.style.getPropertyValue('--bar-duration'))).size > 6);
    const leaders = new Set();
    let mixedDirections = false;
    for (let index = 0; index < 35; index += 1) {
      wheel(window, { deltaY: 20 });
      advance(20);
      const heights = levels(bars);
      leaders.add(heights.indexOf(Math.max(...heights)));
      const directions = new Set(bars.map(bar => bar.style.getPropertyValue('--bar-ease')));
      mixedDirections ||= directions.has('var(--ease-circ-in)') && directions.has('var(--ease-circ-out)');
    }
    assert.ok(mixedDirections, 'some bars drop while others rise');
    assert.ok(leaders.size > 3, 'the tallest bar changes over time');
    advance(121);
    assert.ok(levels(bars).every(height => height === 0));
    assert.ok(bars.every(bar => bar.style.getPropertyValue('--bar-ease') === 'var(--ease-circ-in)'));
    assert.ok(bars.every(bar => {
      const duration = parseFloat(bar.style.getPropertyValue('--bar-duration'));
      return duration >= 90 && duration <= 190;
    }));
    assert.equal(frames.size, 0, 'the clock stops as soon as the release begins');
  });
});

test('footer touch effort builds across swipes and releases promptly when input stops', async () => {
  const peaks = [];
  for (const swipes of [1, 2]) {
    await withBrowser(({ window, root, bars, equalizer, frames, advance, controller }) => {
      initFooterEqualizer(controller().signal);
      root.scrollTop = root.scrollHeight - window.innerHeight;
      const touches = (x, y) => [{ clientX: x, clientY: y }];
      for (let index = 0; index < swipes; index += 1) {
        dispatch(window, 'touchstart', { touches: touches(100, 500) });
        const event = dispatch(window, 'touchmove', { touches: touches(100, 380) });
        assert.equal(event.defaultPrevented, false);
        dispatch(window, 'touchend');
      }
      advance(0);
      peaks.push(levels(bars));
      dispatch(window, 'touchstart', { touches: touches(100, 500) });
      dispatch(window, 'touchmove', { touches: touches(300, 490) });
      dispatch(window, 'touchmove', { touches: [...touches(300, 300), ...touches(100, 200)] });
      dispatch(window, 'touchmove', { touches: touches(100, 100) });
      advance(121);
      assert.ok(levels(bars).every(height => height === 0));
      assert.equal(equalizer.attributes.has('data-equalizer-active'), false);
      assert.equal(frames.size, 0);
    });
  }
  peaks[0].forEach((height, index) => assert.equal(peaks[1][index], height * 2));
});

test('separate swipes can reach full height despite the quick visual release; long pauses shed effort', async () => {
  await withBrowser(({ window, root, bars, advance, controller }) => {
    initFooterEqualizer(controller().signal);
    root.scrollTop = root.scrollHeight - window.innerHeight;
    const touches = y => [{ clientX: 100, clientY: y }];
    let reachedCap = false;
    for (let index = 0; index < 10; index += 1) {
      dispatch(window, 'touchstart', { touches: touches(500) });
      dispatch(window, 'touchmove', { touches: touches(380) });
      dispatch(window, 'touchend');
      advance(0);
      reachedCap ||= levels(bars).includes(1);
      advance(300);
      assert.ok(levels(bars).every(height => height === 0));
    }
    assert.ok(reachedCap, 'repeated swipes accumulate enough effort for full-height peaks');
    advance(5000);
    dispatch(window, 'touchstart', { touches: touches(500) });
    dispatch(window, 'touchmove', { touches: touches(380) });
    advance(0);
    assert.ok(Math.max(...levels(bars)) < 0.35, 'a fresh gesture after a long pause starts small');
  });
});

test('footer resets on leaving the bottom, width changes and hidden tabs, and abort clears all bar state', async () => {
  await withBrowser(({ window, document, root, equalizer, bars, frames, advance, controller }) => {
    const page = controller();
    initFooterEqualizer(page.signal);
    const push = () => {
      root.scrollTop = root.scrollHeight - window.innerHeight;
      wheel(window);
      advance(0);
    };
    push();
    window.innerHeight += 30;
    dispatch(window, 'resize');
    assert.ok(levels(bars).some(height => height > 0));
    window.innerWidth += 100;
    dispatch(window, 'resize');
    assert.ok(levels(bars).every(height => height === 0));
    push();
    root.scrollTop -= 100;
    dispatch(window, 'scroll');
    assert.ok(levels(bars).every(height => height === 0));
    push();
    document.hidden = true;
    dispatch(document, 'visibilitychange');
    assert.ok(levels(bars).every(height => height === 0));
    wheel(window);
    assert.equal(frames.size, 0, 'a hidden page cannot restart the clock');
    document.hidden = false;
    wheel(window);
    assert.equal(frames.size, 1);
    page.abort();
    assert.equal(frames.size, 0);
    assert.equal(equalizer.attributes.size, 0);
    assert.ok(bars.every(bar => bar.style.values.size === 0));
    wheel(window);
    assert.equal(frames.size, 0);
  });
});

test('desktop header uses direction thresholds, returns near the top and reveals for keyboard focus', async () => {
  await withBrowser(({ window, header, desktop, frames, controller }) => {
    const page = controller();
    initHeaderScroll(page.signal);
    const scroll = y => { window.scrollY = y; dispatch(window, 'scroll'); drain(frames); };
    scroll(140);
    assert.equal(header.classes.has('is-hidden'), false);
    assert.equal(header.classes.has('is-scrolled'), true);
    scroll(170);
    assert.equal(header.classes.has('is-hidden'), false);
    scroll(190);
    assert.equal(header.classes.has('is-hidden'), true);
    scroll(186);
    assert.equal(header.classes.has('is-hidden'), true);
    scroll(178);
    assert.equal(header.classes.has('is-hidden'), false);
    scroll(250);
    assert.equal(header.classes.has('is-hidden'), true);
    dispatch(header, 'focusin');
    assert.equal(header.classes.has('is-hidden'), false);
    header.keyboardFocus = true;
    scroll(500);
    assert.equal(header.classes.has('is-hidden'), false);
    header.keyboardFocus = false;
    scroll(600);
    assert.equal(header.classes.has('is-hidden'), true);
    scroll(80);
    assert.equal(header.classes.has('is-hidden'), false);
    assert.equal(header.classes.has('is-scrolled'), false);
    scroll(700);
    assert.equal(header.classes.has('is-hidden'), true);
    desktop.matches = false;
    dispatch(desktop, 'change');
    assert.equal(header.classes.has('is-hidden'), false);
    scroll(900);
    assert.equal(header.classes.has('is-hidden'), false);
    dispatch(window, 'scroll');
    page.abort();
    assert.equal(frames.size, 0);
    assert.equal(header.classes.size, 0);
  }, { desktop: true });
});

test('mobile and reduced-motion headers stay visible while keeping the scrolled backdrop', async () => {
  for (const options of [{ desktop: false }, { desktop: true, reduced: true }]) {
    await withBrowser(({ window, header, frames, controller }) => {
      initHeaderScroll(controller().signal, options.reduced);
      window.scrollY = 600;
      dispatch(window, 'scroll');
      drain(frames);
      assert.equal(header.classes.has('is-hidden'), false);
      assert.equal(header.classes.has('is-scrolled'), true);
    }, options);
  }
});
