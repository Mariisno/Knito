import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.7.0',
  date: '2026-05-02',
  changes: [
    { type: 'ny',         text: 'Pinner som brukes i et aktivt prosjekt vises nå som «opptatt» i pinnelageret' },
    { type: 'forbedring', text: 'Pinnevelgeren i prosjektet viser hvor mange av hver pinne som er ledige, og skjuler de som er fullt i bruk' },
    { type: 'forbedring', text: 'Pinner kan nå fjernes fra et prosjekt direkte fra pinnelisten' },
    { type: 'forbedring', text: 'Fullførte og arkiverte prosjekter frigjør pinnene sine, slik at de blir ledige igjen' },
  ],
} satisfies ReleaseEntry;
