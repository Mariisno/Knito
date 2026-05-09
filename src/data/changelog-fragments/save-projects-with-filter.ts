import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.10.1',
  date: '2026-05-09',
  changes: [
    { type: 'forbedring', text: 'Nytt prosjekt får automatisk status fra det aktive filteret – legger du til et prosjekt mens du står på Fullført, lagres det som Fullført.' },
  ],
} satisfies ReleaseEntry;
