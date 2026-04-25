import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.5.0',
  date: '2026-04-25',
  changes: [
    { type: 'ny', text: 'Støtte for heklingsprosjekter – velg mellom Strikking og Hekling når du oppretter eller redigerer et prosjekt' },
    { type: 'ny', text: 'Heklenåler støttes nå fullt ut i pinneskapet og på prosjekter' },
  ],
} satisfies ReleaseEntry;
