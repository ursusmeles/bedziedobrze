export interface ServiceTool {
  id: string;
  label: string;
  description: string;
}

export interface Service {
  id: string;
  title: string;
  paragraphs: string[];
  tools: ServiceTool[];
}

export const services: Service[] = [
  {
    id: 'strat',
    title: 'Strategia i\u00a0wzrost sprzedaży',
    paragraphs: [
      'Przekujemy Twoje przewagi w\u00a0konkretny plan działań, skierowanych do właściwych odbiorców. Zdefiniujemy do kogo mówisz i\u00a0jak mówisz oraz dlaczego klienci powinni wybrać Ciebie, a\u00a0nie kon\u00adkurencję.',
      'Zaprojektujemy i\u00a0wdrożymy wielokanałowe kampanie marketingowe oparte na szczegółowej analityce. Zoptymalizujemy je tak, by każda złotówka wydana na marketing się zwróciła.',
    ],
    tools: [
      { id: 'strategia', label: 'strategia', description: 'Treść dla strategii...' },
      { id: 'design', label: 'design', description: 'Treść dla designu...' },
      { id: 'ads', label: 'ads', description: 'Treść dla ads...' },
      { id: 'analityka', label: 'analityka', description: 'Treść dla analityki...' },
      { id: 'offline', label: 'offline', description: 'Treść dla offline...' },
    ],
  },
  {
    id: 'wideo',
    title: 'Wideo, foto &\u00a0studio',
    paragraphs: [
      'Stworzymy materiały filmowe na najwyższym poziomie — od koncepcji po postprodukcję.',
      'Prowadzimy własne studio nagrań na gdańskim Przymorzu, gotowe do produkcji podcastów, kursów online, rolek i\u00a0do streamingu.',
    ],
    tools: [
      { id: 'podkasty', label: 'podkasty', description: 'Treść dla podkastów...' },
      { id: 'reels', label: 'reels', description: 'Treść dla reels...' },
      { id: 'streaming', label: 'streaming', description: 'Treść dla streamingu...' },
    ],
  },
  {
    id: 'web',
    title: 'Web design &\u00a0development',
    paragraphs: [
      'Zbudujemy ultraszybką stronę internetową lub sklep e-commerce tak, by rzeczywiście sprzedawały. Bez kompromisów w\u00a0kwestii user experience, pozycjonowania, responsywności i\u00a0dostępności.',
    ],
    tools: [
      { id: 'css', label: 'css/html', description: 'Treść dla css/html...' },
      { id: 'ux', label: 'ux/ui', description: 'Treść dla ux/ui...' },
      { id: 'seo', label: 'seo', description: 'Treść dla seo...' },
      { id: 'cms', label: 'cms', description: 'Treść dla cms...' },
    ],
  },
];
