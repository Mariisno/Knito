import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.6.4',
  date: '2026-05-03',
  changes: [
    { type: 'fiks', text: 'Når du sletter et garn som er i bruk i et prosjekt, fjernes garnet også fra prosjektet. Tidligere ble garnet liggende igjen i lageret uten sletteknapp.' },
  ],
} satisfies ReleaseEntry;
