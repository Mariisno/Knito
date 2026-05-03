import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.7.1',
  date: '2026-05-03',
  changes: [
    { type: 'forbedring', text: 'Skjemaet for nytt prosjekt er gjort mer mobilvennlig — knappene for håndverk og kategori er større og tydeligere, og «Lagre» fremheves nå som en primærknapp i toppen.' },
    { type: 'forbedring', text: 'Lenke til oppskrift har fått en tydelig etikett, og vedlegg-kortene bruker nå primærfargen så det er lettere å se at de er trykkbare.' },
  ],
} satisfies ReleaseEntry;
