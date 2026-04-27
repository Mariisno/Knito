import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.6.0',
  date: '2026-04-27',
  changes: [
    { type: 'ny', text: 'Legg til bilde og kommentar når du oppretter et nytt garn' },
    { type: 'ny', text: 'Trykk på et garn i lageret for å redigere alle felter, inkludert bilde og kommentar' },
  ],
} satisfies ReleaseEntry;
