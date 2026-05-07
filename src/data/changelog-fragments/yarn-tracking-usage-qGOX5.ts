import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.8.0',
  date: '2026-05-04',
  changes: [
    { type: 'ny', text: 'Marker garn som brukt direkte fra prosjektet — ett trykk trekker fra både prosjektet og lageret' },
    { type: 'ny', text: 'Garn på prosjekter viser nå "X av Y nøster" og en "Ferdig"-pille når alt er brukt opp' },
    { type: 'ny', text: 'Statistikk viser totalt antall nøster du har brukt på tvers av alle prosjekter' },
    { type: 'forbedring', text: 'Forenklet dialogen for å legge til garn — én skjerm med tallinntasting og lagernivå i listen' },
    { type: 'forbedring', text: 'Loggen oppdateres automatisk når du markerer garn som brukt' },
  ],
} satisfies ReleaseEntry;
