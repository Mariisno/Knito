import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.9.0',
  date: '2026-05-06',
  changes: [
    { type: 'ny', text: 'Du kan nå velge antall når du legger til en pinne på et prosjekt – både egne prosjektpinner og pinner fra lageret' },
    { type: 'forbedring', text: 'Juster antall direkte fra pinnelisten i prosjektet med +/− knapper' },
  ],
} satisfies ReleaseEntry;
