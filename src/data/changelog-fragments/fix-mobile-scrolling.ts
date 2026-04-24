import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.4.2',
  date: '2026-04-24',
  changes: [
    { type: 'fiks', text: 'Appen vises nå korrekt under statuslinjen og hjemknappen på mobil (safe area)' },
    { type: 'fiks', text: 'Scrolling er jevnere og mer naturlig på iPhone og Android' },
  ],
} satisfies ReleaseEntry;
