import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.11.1',
  date: '2026-05-16',
  changes: [
    { type: 'fiks', text: 'Fjernet unødvendige seksjonsoverskrifter ("Aktive" / "Andre") fra prosjektlisten' },
  ],
} satisfies ReleaseEntry;
