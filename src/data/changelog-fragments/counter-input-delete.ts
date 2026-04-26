import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.4.4',
  date: '2026-04-26',
  changes: [
    { type: 'forbedring', text: 'Kan nå skrive inn tellerverdi direkte ved å trykke på tallet' },
    { type: 'ny', text: 'Kan slette en teller fra prosjektet' },
    { type: 'forbedring', text: 'Fjernet angre-knapp på teller for enklere grensesnitt' },
  ],
} satisfies ReleaseEntry;
