import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import test from 'node:test';
import { parse } from 'parse5';

const output = new URL('../dist/', import.meta.url);
const html = readFileSync(new URL('index.html', output), 'utf8');
const document = parse(html);
const nodes = [];
function walk(node) {
  nodes.push(node);
  for (const child of node.childNodes ?? []) walk(child);
}
walk(document);
const attr = (node, name) => node.attrs?.find(attribute => attribute.name === name)?.value;
const text = node => (node.childNodes ?? []).map(child => child.value ?? text(child)).join('');
const tags = name => nodes.filter(node => node.tagName === name);
function meta(name) {
  const matches = tags('meta').filter(node => attr(node, 'name') === name || attr(node, 'property') === name);
  assert.equal(matches.length, 1, `Expected exactly one ${name} tag`);
  return attr(matches[0], 'content');
}
const canonical = 'https://www.bedziedobrze.space/';
const normalizeCopy = value => value.replace(/\u00ad/g, '').replace(/\s+/g, ' ').trim();
function pageCopy(node) {
  if (['script', 'style', 'svg'].includes(node.tagName)) return '';
  if (node.nodeName === '#text') return node.value;
  const content = (node.childNodes ?? []).map(pageCopy).join('');
  return ['p', 'div', 'section', 'article', 'h1', 'h2', 'h3', 'h4', 'li', 'br'].includes(node.tagName)
    ? ` ${content} ` : content;
}
const homepageCopy = normalizeCopy(pageCopy(tags('body')[0]));

test('built page has consistent Polish search and social metadata on the production host', () => {
  assert.equal(attr(tags('html')[0], 'lang'), 'pl');
  assert.equal(tags('title').length, 1);
  const title = text(tags('title')[0]);
  assert.equal(title, 'będzie/dobrze — gdańskie studio kreatywne');
  assert.equal(meta('og:title'), title);
  assert.equal(meta('twitter:title'), title);
  const description = meta('description');
  assert.ok(description.length > 80 && description.length < 180);
  assert.equal(meta('og:description'), description);
  assert.equal(meta('twitter:description'), description);
  assert.ok(homepageCopy.includes(normalizeCopy(description)), 'Description should quote existing homepage copy');
  const canonicalLinks = tags('link').filter(node => attr(node, 'rel') === 'canonical');
  assert.equal(canonicalLinks.length, 1);
  assert.equal(attr(canonicalLinks[0], 'href'), canonical);
  assert.equal(meta('og:url'), canonical);
  assert.equal(meta('og:locale'), 'pl_PL');
  assert.equal(meta('og:type'), 'website');
  assert.equal(meta('twitter:card'), 'summary_large_image');
  assert.equal(meta('og:site_name'), 'będzie\\dobrze');
  assert.ok(!tags('meta').some(node => /robots|googlebot/.test(attr(node, 'name') ?? '') && /noindex|none/i.test(attr(node, 'content') ?? '')));
});

test('OG image copy quotes the website', () => {
  let checked = 0;
  function check(node, insideCard = false) {
    insideCard ||= node.tagName === 'article';
    if (insideCard && node.nodeName === '#text') {
      const copy = normalizeCopy(node.value);
      if (copy) {
        const quotesHomepage = homepageCopy.toLocaleLowerCase('pl').includes(copy.toLocaleLowerCase('pl'));
        assert.ok(quotesHomepage, `OG image copy must quote the homepage: ${copy}`);
        checked++;
      }
    }
    for (const child of node.childNodes ?? []) check(child, insideCard);
  }
  check(parse(readFileSync(new URL('../scripts/og-image.html', import.meta.url), 'utf8')));
  assert.ok(checked >= 2, 'The OG image should contain the stacked wordmark');
});

test('social previews and linked head assets exist in the built site', () => {
  assert.equal(meta('og:image'), `${canonical}og-image.jpg`);
  assert.equal(meta('twitter:image'), meta('og:image'));
  assert.equal(meta('og:image:width'), '1200');
  assert.equal(meta('og:image:height'), '630');
  assert.ok(meta('og:image:alt').length > 20);
  assert.equal(meta('twitter:image:alt'), meta('og:image:alt'));
  const headAssets = tags('link').filter(node => ['icon', 'shortcut icon', 'apple-touch-icon', 'manifest', 'preload'].includes(attr(node, 'rel')));
  for (const path of [...headAssets.map(node => attr(node, 'href')), meta('og:image')]) {
    const url = new URL(path, canonical);
    assert.equal(url.origin, new URL(canonical).origin);
    const file = new URL(`.${url.pathname}`, output);
    assert.ok(statSync(file).size > 0, `${url.pathname} should exist`);
    if (url.pathname.endsWith('.jpg')) {
      assert.equal(readFileSync(file).subarray(0, 3).toString('hex'), 'ffd8ff', 'Social previews must be real JPEG files');
    }
  }
});

test('JSON-LD parses and every internal entity reference resolves', () => {
  const scripts = tags('script').filter(node => attr(node, 'type') === 'application/ld+json');
  assert.equal(scripts.length, 1);
  const data = JSON.parse(text(scripts[0]));
  assert.equal(data['@context'], 'https://schema.org');
  const graph = data['@graph'];
  const ids = new Set(graph.map(entity => entity['@id']));
  assert.equal(ids.size, graph.length);
  function checkReferences(value) {
    if (!value || typeof value !== 'object') return;
    if (value['@id']) {
      assert.ok(ids.has(value['@id']), `Unresolved entity: ${value['@id']}`);
      assert.equal(new URL(value['@id']).origin, new URL(canonical).origin);
    }
    for (const child of Object.values(value)) checkReferences(child);
  }
  checkReferences(graph);
  const organization = graph.find(entity => entity['@type'] === 'ProfessionalService');
  const website = graph.find(entity => entity['@type'] === 'WebSite');
  const webpage = graph.find(entity => entity['@type'] === 'WebPage');
  assert.equal(organization.name, meta('og:site_name'));
  assert.equal(website.publisher['@id'], organization['@id']);
  assert.equal(webpage.isPartOf['@id'], website['@id']);
  assert.equal(webpage.url, canonical);
  assert.equal(webpage.description, meta('description'));
  assert.equal(organization.image, meta('og:image'));
  assert.equal(webpage.primaryImageOfPage.url, meta('og:image'));
  const logo = new URL(organization.logo);
  assert.ok(statSync(new URL(`.${logo.pathname}`, output)).size > 0);
});

test('robots and sitemap direct crawlers to the canonical homepage', () => {
  const robots = readFileSync(new URL('robots.txt', output), 'utf8');
  assert.match(robots, /User-agent: \*\nAllow: \/\n/);
  assert.ok(!/^Disallow:\s*\/\s*$/m.test(robots));
  assert.ok(robots.includes(`Sitemap: ${canonical}sitemap.xml`));
  const sitemap = readFileSync(new URL('sitemap.xml', output), 'utf8');
  assert.match(sitemap, /xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/);
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  assert.deepEqual(urls, [canonical]);
});

test('llms.txt uses existing website copy and links to real page sections', () => {
  const llms = readFileSync(new URL('llms.txt', output), 'utf8');
  assert.ok(llms.startsWith('# będzie\\dobrze\n'));
  const ids = new Set(nodes.map(node => attr(node, 'id')).filter(Boolean));
  const links = [...llms.matchAll(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/g)];
  assert.ok(links.length > 10);
  for (const [, label, href] of links) {
    const url = new URL(href);
    assert.equal(url.origin, new URL(canonical).origin);
    assert.equal(url.pathname, '/');
    if (url.hash) assert.ok(ids.has(url.hash.slice(1)), `Missing section: ${url.hash}`);
    assert.ok(homepageCopy.includes(normalizeCopy(label)), `Link label must quote the site: ${label}`);
  }
  for (const line of llms.split('\n').filter(Boolean)) {
    // Check headings, quoted introduction, prose, and descriptions after linked labels.
    const copy = line.startsWith('- [')
      ? line.split('): ')[1]
      : line.replace(/^#{1,6} |^> /, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    if (copy) assert.ok(homepageCopy.includes(normalizeCopy(copy)), `llms.txt copy must quote the website: ${copy}`);
  }
});
