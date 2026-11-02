import assert from 'node:assert/strict';
import test from 'node:test';
import { polishTypography } from '../src/lib/polish-typography.mjs';

test('binds upper/lower case words, quotes, consecutive words, and source newlines', () => {
  const input = '<html lang="pl"><body><p>W Legnicy a i o u w z dzieckiem, „a potem” i\n szkole.</p></body></html>';
  assert.equal(polishTypography(input), '<html lang="pl"><body><p>W\u00a0Legnicy a\u00a0i\u00a0o\u00a0u\u00a0w\u00a0z\u00a0dzieckiem, „a\u00a0potem” i\u00a0szkole.</p></body></html>');
});

test('binds across inline markup and whitespace nodes without changing markup', () => {
  const input = '<p>Nauka w <strong>Legnicy</strong> i<span> </span><a href="/a b">szkole</a>.</p>';
  assert.equal(polishTypography(input), '<p>Nauka w\u00a0<strong>Legnicy</strong> i<span>\u00a0</span><a href="/a b">szkole</a>.</p>');
});

test('does not bind across explicit breaks or block boundaries', () => {
  const input = '<p>w </p><p>Legnicy i <br>szkole</p>';
  assert.equal(polishTypography(input), input);
});

test('preserves attributes, scripts, code, form fields, foreign text, and opt-outs', () => {
  const input = '<html lang="pl"><head><title>A title</title><script>{"text":"a b"}</script></head><body><pre>w szkole</pre><code>a b</code><textarea>i tak</textarea><select><option>o nas</option></select><p lang="en">a school</p><p translate="no">w szkole</p><p contenteditable>w szkole</p><p data-typography="off">w szkole</p><a href="/w szkole" title="o nas">Cała szkoła</a><script>const x = "w szkole";</script></body></html>';
  assert.equal(polishTypography(input), input);
  assert.equal(polishTypography('<html lang="en"><body>a school</body></html>'), '<html lang="en"><body>a school</body></html>');
});

test('preserves existing entities and is idempotent', () => {
  const input = '<p>w&nbsp;szkole i\u00a0domu, cała oferta, adres https://example.pl/a b</p>';
  assert.equal(polishTypography(input), input);
  const once = polishTypography('<p>W Legnicy i szkole</p>');
  assert.equal(polishTypography(once), once);
});

test('parses noscript fallback markup without changing attributes', () => {
  assert.equal(polishTypography('<noscript><p title="w szkole">w szkole</p></noscript>'),
    '<noscript><p title="w szkole">w\u00a0szkole</p></noscript>');
});
