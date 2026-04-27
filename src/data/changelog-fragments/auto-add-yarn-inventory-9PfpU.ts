import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.5.2',
  date: '2026-04-27',
  changes: [
    { type: 'forbedring', text: 'Når du legger til et nytt garn i et prosjekt dukker det nå automatisk opp i Garnlager med prosjektet som tag' },
  ],
} satisfies ReleaseEntry;
