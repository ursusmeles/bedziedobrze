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
      'Aby biznes mógł stabilnie rosnąć, trzeba nieustannie testować, optymalizować i szukać nowych rozwiązań. Zdejmujemy z Ciebie ten ciężar. Nasze kreatywne pomysły opieramy na danych, a ich skuteczność sprawdzamy i raportujemy.',
    ],
    toolsLabel: 'Usługi',
    highlight: 'Zdejmujemy z Ciebie ten ciężar.',
    tools: [
      { id: 'strategia', label: 'strategia', description: 'Przekujemy Twoje przewagi w konkretny plan biznesowy. Zdefiniujemy Twoich klientów, ich potrzeby i jak do nich trafić. Rozplanujemy działania marketingowe na kolejne miesiące.' },
      { id: 'ads', label: 'ads & analytics', description: 'Zaprojektujemy i wdrożymy kampanie reklamowe oparte na szczegółowej analityce. Pokaż się w Google, na Facebooku i Instagramie, w ChatGPT, na LinkedIn lub na Reddicie.' },
      { id: 'ecommerce', label: 'e-commerce', description: 'Zbudujemy lub poprawimy Twój sklep internetowy. Ułatwimy klientom znalezienie produktów i dokończenie zakupu. Zadbamy zarówno o design, jak i o narzędzia wspierające wzrost wartości zamówień.' },
      { id: 'reklamy-wideo', label: 'reklamy wideo', description: 'Stworzymy treści wideo gotowe pod wybrane kanały i formaty reklamowe. Zadbamy o jasny przekaz, chwytliwy scenariusz, reżyserię, oświetlenie i postprodukcję.' },
    ],
  },
  {
    id: 'wizerunek',
    title: 'Skuteczny i spójny wizerunek',
    paragraphs: [
      'Klienci poznają Twoją firmę na różne sposoby. Dbamy o to, żeby za każdym razem rozpoznawali tę samą markę i rozumieli, co ma do zaoferowania. Porządkujemy Twoją komunikację, by jasno i czytelnie pokazywała cechy, które chcemy podkreślić.',
    ],
    toolsLabel: 'Usługi',
    highlight: 'Porządkujemy Twoją komunikację',
    tools: [
      { id: 'brand-design', label: 'brand design', description: 'Uporządkujemy lub odświeżymy identyfikację wizualną Twojej marki. Ustalimy, jak korzystać z logo, kolorów i typografii. Przygotujemy materiały, które ułatwią zachowanie spójności na co dzień.' },
      { id: 'strona', label: 'strona internetowa', description: 'Zaprojektujemy i zbudujemy stronę, która przedstawi Cię w najlepszym świetle. Zadbamy o nowoczesny design, bezpardonową szybkość działania, dostępność i wygodną obsługę na telefonie.' },
      { id: 'social-media', label: 'wideo na social media', description: 'Przygotujemy rolki, filmy i zdjęcia w stylu Twojej marki, dopasowane pod wybrane kanały social media. Pomożemy zaplanować tematy i formaty publikacji.' },
      { id: 'podkasty', label: 'podkasty firmowe', description: 'W naszym studiu na gdańskim Przymorzu nagramy podkast, w którym podzielisz się branżową wiedzą i doświadczeniem. Pomożemy dobrać tematy i format, zadbamy o obraz, dźwięk, montaż i promocję.' },
    ],
  },
  {
    id: 'start',
    title: 'Start nowego biznesu',
    paragraphs: [
      'Startupy wymagają ogromnej ilości uwagi od swoich founderów. Pomagamy ustalić, co jest potrzebne na początek, a co może poczekać. Przygotowujemy markę na launch i usprawniamy Twoją codzienną pracę.',
    ],
    toolsLabel: 'Usługi',
    highlight: 'Pomagamy ustalić, co jest potrzebne',
    tools: [
      { id: 'strategia-marki', label: 'strategia marki', description: 'Na warsztatach ustalimy profil Twojego klienta, najważniejsze wyróżniki Twojej oferty i sposób ich komunikacji. Przygotujemy plan działań potrzebnych do wprowadzenia marki na rynek i osiągnięcia PMF.' },
      { id: 'branding', label: 'branding od zera', description: 'Stworzymy identyfikację wizualną Twojej nowej marki. Zaprojektujemy logo, dobierzemy kolory, motion i typografię oraz przygotujemy materiały potrzebne na start. Całość będzie odpowiadać przyjętej strategii.' },
      { id: 'automatyzacja-ai', label: 'automatyzacja & AI', description: 'Zmapujemy powtarzalne zadania, które warto zautomatyzować. Zarekomendujemy najlepsze narzędzia i wdrożymy automatyzacje z AI na pokładzie tam, gdzie ułatwią pracę i oszczędzą pieniądze.' },
      { id: 'wideo-foto', label: 'wideo & foto', description: 'Wyprodukujemy wideo i fotografię, które pokażą klientom Ciebie oraz Twój nowy biznes. Dostarczymy materiały dopasowane do strony internetowej, social mediów i kampanii reklamowych.' },
    ],
  },
];
