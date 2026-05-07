import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.9.1',
  date: '2026-05-07',
  changes: [
    { type: 'fiks', text: 'Tilbakemeldingsskjemaet viser nå den faktiske feilårsaken når innsending feiler' },
  ],
} satisfies ReleaseEntry;
