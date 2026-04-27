import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.6.0',
  date: '2026-04-27',
  changes: [
    { type: 'forbedring', text: 'Legg til mengde når du kobler garn fra lager til et prosjekt' },
    { type: 'ny',         text: 'Slett garn direkte fra prosjektvisningen' },
    { type: 'ny',         text: 'Legg til bilde på garn i garnlageret' },
    { type: 'forbedring', text: 'Rediger garndetaljer direkte fra garnlageret' },
  ],
} satisfies ReleaseEntry;
