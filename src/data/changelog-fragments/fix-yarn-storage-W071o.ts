import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.6.3',
  date: '2026-05-02',
  changes: [
    { type: 'fiks', text: 'Endringer på et garn i lageret oppdaterer nå garnet i alle prosjekter som bruker det.' },
    { type: 'fiks', text: 'Bekreftelsesvarsel før sletting av et garn som er i bruk i ett eller flere prosjekter.' },
    { type: 'fiks', text: 'Antall nøster i lageret påvirker ikke lenger garn som er lagt til i prosjekter.' },
    { type: 'forbedring', text: 'Lagerskjemaet har nå felter for merke, mengde og pris.' },
  ],
} satisfies ReleaseEntry;
