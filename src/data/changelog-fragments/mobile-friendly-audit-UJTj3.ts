import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.6.3',
  date: '2026-05-01',
  changes: [
    { type: 'forbedring', text: 'Bedre layout på små telefoner — skjemaer, telleren og hero-bildet tilpasser seg smalere skjermer.' },
    { type: 'forbedring', text: 'Nettbrett og større skjermer får litt mer plass (opp til 600 px bred) i stedet for å være låst til telefonbredde.' },
    { type: 'fiks',       text: 'Rediger- og slettknappene i loggen er nå synlige på mobil (krevde tidligere mus-hover).' },
    { type: 'fiks',       text: 'Lange dialoger ruller nå i stedet for å renne over skjermen.' },
    { type: 'fiks',       text: 'Større trykkflater på sletteknapp i pinneskapet, datovelgerne og toppknappene på prosjektsiden.' },
  ],
} satisfies ReleaseEntry;
