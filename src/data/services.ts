export interface ServiceTool {
  id: string;
  label: string;
  description: string;
}

export interface Service {
  id: string;
  title: string;
  paragraphs: string[];
  highlight?: string;
  toolsLabel?: string;
  tools: ServiceTool[];
}

export const services: Service[] = [
  {
    id: 'strat',
    title: 'Stabilny wzrost sprzedaży',
    paragraphs: [
      'Aby biznes mógł stabilnie rosnąć, trzeba nieustannie testować, optymalizować i\u00a0szukać nowych rozwiązań. Zdejmujemy z\u00a0Ciebie ten ciężar. Nasze kreatywne pomysły opieramy na danych, a\u00a0ich skuteczność sprawdzamy i\u00a0raportujemy.',
    ],
    toolsLabel: 'Usługi',
    highlight: 'Zdejmujemy z\u00a0Ciebie ten ciężar.',
    tools: [
      { id: 'strategia', label: 'strategia', description: 'Przekujemy Twoje przewagi w\u00a0konkretny plan biznesowy. Zdefiniujemy Twoich klientów, ich potrzeby i\u00a0jak do nich trafić. Rozplanujemy działania marketingowe na kolejne miesiące.' },
      { id: 'ads', label: 'ads & analytics', description: 'Zaprojektujemy i\u00a0wdrożymy kampanie reklamowe oparte na szczegółowej analityce. Pokaż się w\u00a0Google, na Facebooku i\u00a0Instagramie, w\u00a0ChatGPT, na LinkedIn lub na Reddicie.' },
      { id: 'ecommerce', label: 'e-commerce', description: 'Zbudujemy lub poprawimy Twój sklep internetowy. Ułatwimy klientom znalezienie produktów i\u00a0dokończenie zakupu. Zadbamy zarówno o\u00a0design, jak i\u00a0o\u00a0narzędzia wspierające wzrost wartości zamówień.' },
      { id: 'reklamy-wideo', label: 'reklamy wideo', description: 'Stworzymy treści wideo gotowe pod wybrane kanały i\u00a0formaty reklamowe. Zadbamy o\u00a0jasny przekaz, chwytliwy scenariusz, reżyserię, oświetlenie i\u00a0postprodukcję.' },
    ],
  },
  {
    id: 'wizerunek',
    title: 'Skuteczny i\u00a0spójny wizerunek',
    paragraphs: [
      'Klienci poznają Twoją firmę na różne sposoby. Dbamy o\u00a0to, żeby za każdym razem rozpoznawali tę samą markę i\u00a0rozumieli, co ma do zaoferowania. Porządkujemy Twoją komunikację, by jasno i\u00a0czytelnie pokazywała cechy, które chcemy podkreślić.',
    ],
    toolsLabel: 'Usługi',
    highlight: 'Porządkujemy Twoją komunikację',
    tools: [
      { id: 'brand-design', label: 'brand design', description: 'Uporządkujemy lub odświeżymy identyfikację wizualną Twojej marki. Ustalimy, jak korzystać z\u00a0logo, kolorów i\u00a0typografii. Przygotujemy materiały, które ułatwią zachowanie spójności na co dzień.' },
      { id: 'strona', label: 'strona internetowa', description: 'Zaprojektujemy i\u00a0zbudujemy stronę, która przedstawi Cię w\u00a0najlepszym świetle. Zadbamy o\u00a0nowoczesny design, bezpardonową szybkość działania, dostępność i\u00a0wygodną obsługę na telefonie.' },
      { id: 'social-media', label: 'wideo na social media', description: 'Przygotujemy rolki, filmy i\u00a0zdjęcia w\u00a0stylu Twojej marki, dopasowane pod wybrane kanały social media. Pomożemy zaplanować tematy i\u00a0formaty publikacji.' },
      { id: 'podkasty', label: 'podkasty firmowe', description: 'W\u00a0naszym studiu na gdańskim Przymorzu nagramy podkast, w\u00a0którym podzielisz się branżową wiedzą i\u00a0doświadczeniem. Pomożemy dobrać tematy i\u00a0format, zadbamy o\u00a0obraz, dźwięk, montaż i\u00a0promocję.' },
    ],
  },
  {
    id: 'start',
    title: 'Start nowego biznesu',
    paragraphs: [
      'Startupy wymagają ogromnej ilości uwagi od swoich founderów. Pomagamy ustalić, co jest potrzebne na początek, a\u00a0co może poczekać. Przygotowujemy markę na launch i\u00a0usprawniamy Twoją codzienną pracę.',
    ],
    toolsLabel: 'Usługi',
    highlight: 'Pomagamy ustalić, co jest potrzebne',
    tools: [
      { id: 'strategia-marki', label: 'strategia marki', description: 'Na warsztatach ustalimy profil Twojego klienta, najważniejsze wyróżniki Twojej oferty i\u00a0sposób ich komunikacji. Przygotujemy plan działań potrzebnych do wprowadzenia marki na rynek i\u00a0osiągnięcia PMF.' },
      { id: 'branding', label: 'branding od zera', description: 'Stworzymy identyfikację wizualną Twojej nowej marki. Zaprojektujemy logo, dobierzemy kolory, motion i\u00a0typografię oraz przygotujemy materiały potrzebne na start. Całość będzie odpowiadać przyjętej strategii.' },
      { id: 'automatyzacja-ai', label: 'automatyzacja & AI', description: 'Zmapujemy powtarzalne zadania, które warto zautomatyzować. Zarekomendujemy najlepsze narzędzia i\u00a0wdrożymy automatyzacje z\u00a0AI na pokładzie tam, gdzie ułatwią pracę i\u00a0oszczędzą pieniądze.' },
      { id: 'wideo-foto', label: 'wideo & foto', description: 'Wyprodukujemy wideo i\u00a0fotografię, które pokażą klientom Ciebie oraz Twój nowy biznes. Dostarczymy materiały dopasowane do strony internetowej, social mediów i\u00a0kampanii reklamowych.' },
    ],
  },
];
