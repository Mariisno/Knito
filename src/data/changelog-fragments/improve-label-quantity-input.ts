import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.10.2',
  date: '2026-05-09',
  changes: [
    { type: 'forbedring', text: 'Merke vises nå rett under garnnavn i "Legg til garn", uten å åpne Rediger.' },
    { type: 'fiks', text: 'Antall-feltet kan nå tømmes og redigeres direkte uten å måtte skrive et tall først.' },
  ],
} satisfies ReleaseEntry;
