import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.8.1',
  date: '2026-05-09',
  changes: [
    { type: 'fiks', text: 'Antall nøster på et prosjekt oppdateres nå automatisk når du endrer antallet på lageret' },
  ],
} satisfies ReleaseEntry;
