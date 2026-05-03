import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.7.0',
  date: '2026-05-02',
  changes: [
    { type: 'forbedring', text: 'Forenklet skjema for å legge til garn — navn, antall, bilde og kommentar er tydelig synlig først, mens øvrige detaljer er skjult bak "Vis flere detaljer".' },
    { type: 'forbedring', text: 'Garn-skjemaet i prosjektvisningen og i garnlageret har samme felter, slik at du får tilgang til alt begge steder.' },
    { type: 'ny', text: 'Ta bilde direkte med kameraet, eller velg fra biblioteket, når du legger til eller redigerer garn.' },
  ],
} satisfies ReleaseEntry;
