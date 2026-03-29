# 🔧 Feilsøking: Database/Innloggingsproblemer

## 🚨 Problem
Du får ikke logget inn i strikke-appen.

## ✅ Løsning: Diagnostikkverktøy

Jeg har laget et automatisk diagnostikkverktøy som tester alle systemkomponenter.

### Slik bruker du det:

1. **Appen kjører nå i diagnostikk-modus** - du vil se en testside i stedet for innloggingsskjermen
2. **Klikk på "Start diagnostikk"**-knappen
3. **Se resultatet** - verktøyet kjører 5 tester:
   - ✓ Supabase-konfigurasjon
   - ✓ Supabase-tilkobling
   - ✓ Edge Functions-tilkobling
   - ✓ Opprett testkonto
   - ✓ Logg inn med testkonto

### Hva testene sjekker:

#### Test 1: Supabase-konfigurasjon
- Sjekker at `projectId` og `publicAnonKey` er konfigurert
- **Hvis feil**: Supabase-konfigurasjonen mangler i `/utils/supabase/info.tsx`

#### Test 2: Supabase-tilkobling  
- Sjekker at Supabase-serveren er tilgjengelig
- **Hvis feil**: Supabase-prosjektet er kanskje ikke aktivt eller feil URL

#### Test 3: Edge Functions-tilkobling
- Sjekker at Edge Function `server` er deployet og fungerer
- **Hvis feil**: Edge Function er ikke deployet eller CORS-problemer
  
**Løsning hvis Edge Functions feiler:**
1. Åpne [Supabase Dashboard](https://supabase.com/dashboard)
2. Velg ditt prosjekt
3. Gå til **Edge Functions** i sidemenyen
4. Deploy funksjonen `server` hvis den ikke er deployet:
   ```bash
   supabase functions deploy server
   ```

#### Test 4: Opprett testkonto
- Prøver å opprette en testkonto via Edge Function
- **Hvis feil**: 
  - Edge Function mangler miljøvariabelen `SUPABASE_SERVICE_ROLE_KEY`
  - KV-store har problemer
  
**Løsning:**
1. Gå til Supabase Dashboard → Project Settings → API
2. Kopier `service_role` key (secret)
3. Gå til Edge Functions → Configuration → Secrets
4. Legg til secret: `SUPABASE_SERVICE_ROLE_KEY` med verdien du kopierte

#### Test 5: Logg inn med testkonto
- Prøver å logge inn med testk ontoen som ble opprettet
- **Hvis feil**: Autentisering fungerer ikke riktig

---

## 🔄 Gå tilbake til normal modus

Når diagnostikken er fullført og alle tester er grønne:

1. Åpne `/App.tsx`
2. Finn linjen: `const SHOW_DIAGNOSTIC = true;`
3. Endre til: `const SHOW_DIAGNOSTIC = false;`
4. Refresh siden

---

## 📊 Vanlige problemer og løsninger

### Problem: "Edge Functions er ikke tilgjengelig"

**Årsak**: Edge Function er ikke deployet eller har feil konfigurasjon

**Løsning**:
```bash
# I terminal, fra prosjektmappen:
supabase functions deploy server
```

### Problem: "Kunne ikke opprette testkonto"

**Årsak**: Mangler `SUPABASE_SERVICE_ROLE_KEY` som secret

**Løsning**:
1. Supabase Dashboard → Settings → API
2. Kopier `service_role` key
3. Edge Functions → Configuration → Secrets
4. Legg til: `SUPABASE_SERVICE_ROLE_KEY=<din_key>`

### Problem: "Kunne ikke logge inn"

**Årsak**: Autentisering eller database-problemer

**Løsning**:
1. Sjekk at bruker er opprettet i Supabase Dashboard → Authentication → Users
2. Verifiser at passordet er minst 6 tegn
3. Prøv å refreshe siden

---

## 💡 Tips

- **Se konsolloggen** i nettleseren (F12 → Console) for detaljerte feilmeldinger
- **Sjekk Edge Function logs** i Supabase Dashboard for server-feil
- **Test med Postman/cURL** hvis du vil teste API-endepunktene direkte

---

## 📞 Neste steg

Hvis diagnostikkverktøyet viser at alt fungerer (alle grønne ✅):
1. Sett `SHOW_DIAGNOSTIC = false` i `/App.tsx`
2. Prøv å logge inn med din vanlige bruker
3. Hvis du ikke har en bruker, opprett en ny via "Opprett konto"

Hvis noen tester feiler (røde ❌):
1. Les feilmeldingen nøye
2. Følg instruksjonene under "Vanlige problemer og løsninger"
3. Kjør diagnostikken på nytt etter å ha fikset problemet

**Lykke til! 🧶**
