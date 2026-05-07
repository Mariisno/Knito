import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.9.0',
  date: '2026-05-07',
  changes: [
    { type: 'ny', text: 'Smartere mønster-teller: sett mål for rader per gjentakelse, så ruller telleren over og øker antall gjentakelser automatisk.' },
    { type: 'ny', text: 'Mønsterposisjon-kort viser hvilken rad du er på av totalt antall, med fremdriftslinje.' },
    { type: 'ny', text: 'Knytt en teller til mønsterposisjonen, så følger «rad av totalt» med når du teller opp eller ned.' },
    { type: 'forbedring', text: 'Teller-seksjonen er gjort tilgjengelig igjen på prosjektsiden.' },
  ],
} satisfies ReleaseEntry;
