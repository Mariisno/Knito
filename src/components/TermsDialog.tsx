import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsDialog({ open, onOpenChange }: TermsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card max-h-[85vh] flex flex-col" style={{ maxWidth: 520 }}>
        <DialogHeader>
          <DialogTitle>Brukervilkår og personvernerklæring</DialogTitle>
        </DialogHeader>

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>
          <div style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--fg)', display: 'flex', flexDirection: 'column', gap: 20 }}>

            <section>
              <h3 style={{ fontWeight: 600, marginBottom: 6 }}>Om Knito</h3>
              <p>
                Knito er en personlig strikkeapplikasjon for å holde oversikt over strikkeprosjekter,
                garnoversikt og pinner. Appen er kun til privat bruk.
              </p>
            </section>

            <section>
              <h3 style={{ fontWeight: 600, marginBottom: 6 }}>Hva vi lagrer</h3>
              <p style={{ marginBottom: 8 }}>For å drifte tjenesten lagrer vi følgende data knyttet til kontoen din:</p>
              <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>E-postadresse og navn (brukt til innlogging)</li>
                <li>Strikkeprosjekter med notater, fremgang og tidslogg</li>
                <li>Garnoversikt og nålerinventar</li>
                <li>Bilder og PDF-er du laster opp (lagres kryptert)</li>
              </ul>
              <p style={{ marginTop: 8 }}>
                Dataene dine brukes utelukkende til å levere appens funksjonalitet. Vi selger ikke,
                deler ikke eller analyserer persondata.
              </p>
            </section>

            <section>
              <h3 style={{ fontWeight: 600, marginBottom: 6 }}>Opphavsrett og oppskrifter</h3>
              <p style={{ marginBottom: 8 }}>
                Strikkeoppskrifter er normalt beskyttet av opphavsrettsloven. Ved bruk av Knito godtar du at:
              </p>
              <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>Du kun lagrer oppskrifter du selv har laget eller har lovlig tilgang til.</li>
                <li>Du ikke deler, publiserer eller videreformidler andres opphavsrettsbeskyttede oppskrifter via appen.</li>
                <li>Knito ikke er ansvarlig for brukerens håndtering av opphavsrettsbeskyttet materiale.</li>
              </ul>
            </section>

            <section>
              <h3 style={{ fontWeight: 600, marginBottom: 6 }}>Personvern og dine rettigheter (GDPR)</h3>
              <p style={{ marginBottom: 8 }}>
                I henhold til EUs personvernforordning (GDPR), gjeldende i Norge via personopplysningsloven,
                har du følgende rettigheter:
              </p>
              <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li><strong>Innsyn:</strong> Du kan til enhver tid se all data lagret om deg ved å logge inn.</li>
                <li><strong>Dataportabilitet:</strong> Du kan laste ned alle dine data som JSON via «Last ned sikkerhetskopi» eller «Personvern og vilkår» i menyen.</li>
                <li><strong>Sletting:</strong> Du kan slette kontoen din og alle tilknyttede data permanent via «Personvern og vilkår» i menyen.</li>
                <li><strong>Retting:</strong> Du kan oppdatere alle data i appen når som helst.</li>
              </ul>
            </section>

            <section>
              <h3 style={{ fontWeight: 600, marginBottom: 6 }}>Sikkerhet</h3>
              <p>
                Dataene dine er lagret hos Supabase (EU-region) med kryptering i overføring (TLS) og i hvile.
                Alle data er isolert per bruker og ikke tilgjengelig for andre brukere av appen.
              </p>
            </section>

            <section>
              <h3 style={{ fontWeight: 600, marginBottom: 6 }}>Kontakt</h3>
              <p>
                Spørsmål om personvern eller GDPR-henvendelser kan sendes til eieren av denne
                Knito-instansen. For å utøve dine rettigheter, bruk funksjonene under «Personvern og vilkår» i appen.
              </p>
            </section>

            <p style={{ fontSize: 12, color: 'var(--muted-fg)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              Sist oppdatert: april 2025
            </p>
          </div>
        </div>

        <div style={{ paddingTop: 12 }}>
          <Button onClick={() => onOpenChange(false)} className="w-full">Lukk</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
