import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.9.0',
  date: '2026-05-06',
  changes: [
    { type: 'ny', text: 'Nytt design (v2) for knapper og dialoger – bytt mellom v1 og v2 fra brukermenyen øverst til høyre' },
    { type: 'forbedring', text: 'Større trykkflater på knapper og lukk-knapp i dialoger' },
    { type: 'forbedring', text: 'Dialoger åpnes som et bunnpanel på mobil og har mykere bevegelser' },
  ],
} satisfies ReleaseEntry;
