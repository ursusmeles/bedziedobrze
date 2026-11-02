import { defineMiddleware } from 'astro:middleware';
import { polishTypography } from './lib/polish-typography.mjs';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  if (!response.body || !response.headers.get('content-type')?.includes('text/html')) return response;

  const html = polishTypography(await response.text());
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('etag');
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
