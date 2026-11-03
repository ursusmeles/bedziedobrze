import type { APIRoute } from 'astro';
import { services } from '../data/services';

// Reuse the site's service data so this text follows changes to the actual offer.
export const GET: APIRoute = ({ site }) => {
  const url = (fragment: string) => new URL(`/${fragment}`, site).href;
  const serviceText = services.map(service => [
    `### ${service.title}`,
    service.paragraphs.join('\n\n'),
    service.tools.map(tool => `- [${tool.label}](${url('#uslugi')}): ${tool.description}`).join('\n'),
  ].join('\n\n')).join('\n\n');

  return new Response(`# będzie\\dobrze

> będzie\\dobrze to gdańskie studio kreatywne.

Wspieramy Cię w skalowaniu Twojego biznesu. Tworzymy strony i sklepy internetowe, produkujemy wideo i fotografię, prowadzimy kampanie reklamowe.

## Studio

- [będzie dobrze](${url('')})
- [Dlaczego będzie dobrze](${url('#manifest')})
- [Kim jesteśmy](${url('#onas')})

## Co robimy, żeby było dobrze

[Co robimy](${url('#uslugi')})

${serviceText}

## Prosty proces

[Jak działamy](${url('#proces')})

## Porozmawiajmy

Masz projekt? Problem do rozwiązania? Napisz do nas, my zajmiemy się resztą.

- [Kontakt do nas](${url('#kontakt')})
`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
