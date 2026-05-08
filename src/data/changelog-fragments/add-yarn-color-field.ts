import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.7.0',
  date: '2026-05-07',
  changes: [
    { type: 'ny', text: 'Du kan nå redigere et garn (inkludert farge) direkte fra «…»-menyen på garnkortet i prosjektet.' },
    { type: 'forbedring', text: 'Farge er løftet opp som hovedfelt i garnskjemaet, slik at det er enklere å sette ved tillegg eller redigering.' },
    { type: 'forbedring', text: 'Farge på garn vises nå som en liten chip ved siden av navnet i prosjektvisningen.' },
  ],
} satisfies ReleaseEntry;
