import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.11.0',
  date: '2026-05-09',
  changes: [
    { type: 'ny', text: 'Velg eksisterende garn som mal når du legger til nytt garn' },
    { type: 'ny', text: 'Dupliser et garn direkte fra garnlisten' },
  ],
} satisfies ReleaseEntry;
