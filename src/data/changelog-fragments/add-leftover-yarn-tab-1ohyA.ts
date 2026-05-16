import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.11.0',
  date: '2026-05-09',
  changes: [
    { type: 'ny', text: 'Restegarn-fane i garnlageret viser garn som ikke er koblet til et prosjekt' },
    { type: 'ny', text: 'Fullfør-dialog lar deg legge til restegarn i lageret når du avslutter et prosjekt' },
  ],
} satisfies ReleaseEntry;
