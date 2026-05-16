import type { ReleaseEntry } from '../changelog';

export default {
  version: '1.11.0',
  date: '2026-05-16',
  changes: [
    { type: 'ny', text: 'Garn på et aktivt prosjekt vises nå som «opptatt» i garnskapet — du kan ikke reservere flere nøster enn du har på lager.' },
    { type: 'ny', text: 'Når du legger til garn på et prosjekt velger du nå hvor mange nøster du tar — antallet begrenses til det som faktisk er ledig.' },
    { type: 'forbedring', text: 'Når et prosjekt fullføres, blir du bedt om å bekrefte hvor mange nøster som faktisk ble brukt. Resten frigjøres tilbake til garnskapet.' },
  ],
} satisfies ReleaseEntry;
