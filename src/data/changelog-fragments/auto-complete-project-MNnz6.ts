import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.4.3',
  date: '2026-04-25',
  changes: [
    { type: 'forbedring', text: 'Prosjekter settes automatisk til 100 % fremgang når status endres til «Fullført»' },
  ],
} satisfies ReleaseEntry;
