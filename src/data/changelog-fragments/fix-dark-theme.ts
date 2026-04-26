import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.5.1',
  date: '2026-04-26',
  changes: [
    { type: 'fiks', text: 'OPPSKRIFT-kortet i prosjektvisningen ser nå riktig ut i mørkt tema' },
    { type: 'fiks', text: 'Riktig fargetone på «Slett prosjekt»-knappen i mørkt tema' },
    { type: 'fiks', text: 'Status-prikker i prosjektlisten leser bedre i mørkt tema' },
  ],
} satisfies ReleaseEntry;
