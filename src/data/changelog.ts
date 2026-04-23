export interface ReleaseEntry {
  version: string;
  date: string;
  changes: { type: 'ny' | 'forbedring' | 'fiks'; text: string }[];
}

export const CHANGELOG: ReleaseEntry[] = [
  {
    version: '1.4.0',
    date: '2026-04-23',
    changes: [
      { type: 'forbedring', text: 'Forsidebilde kan nå endres direkte fra prosjektsiden' },
      { type: 'forbedring', text: 'Oppskrift støtter nå PDF, Word og bildefiler – ikke bare PDF' },
      { type: 'forbedring', text: 'Oppskriften kan byttes eller fjernes via menyen på prosjektsiden' },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-04-23',
    changes: [
      { type: 'ny', text: 'Versjonslogg – se hva som er nytt direkte i appen' },
      { type: 'ny', text: 'Varselindikator på innstillingsknappen ved nye oppdateringer' },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-03-10',
    changes: [
      { type: 'ny', text: 'Mørkt og lyst tema kan velges i innstillinger' },
      { type: 'ny', text: 'Eksport av all data som JSON-sikkerhetskopi' },
      { type: 'forbedring', text: 'Raskere lasting av prosjektlisten' },
      { type: 'fiks', text: 'Fiks: telleren nullstilte seg ved bytte av fane' },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-02-01',
    changes: [
      { type: 'ny', text: 'Garnlager – logg og spor garnet ditt' },
      { type: 'ny', text: 'Pinnelager med støtte for rundpinner og strømpepinner' },
      { type: 'forbedring', text: 'Statistikk-fanen viser nå gjennomsnittlig fremgang' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-01-01',
    changes: [
      { type: 'ny', text: 'Første versjon av Knito!' },
      { type: 'ny', text: 'Prosjektstyring med status, fremgang og notater' },
      { type: 'ny', text: 'Tidlogging per strikkeøkt' },
      { type: 'ny', text: 'Teller for runder og masker' },
    ],
  },
];

export const LATEST_VERSION = CHANGELOG[0].version;
