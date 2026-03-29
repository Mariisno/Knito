# Test av prosjektlagring

## Hvordan teste at lagring fungerer

### 1. Opprett et nytt prosjekt
1. Logg inn i appen
2. Klikk på "Nytt prosjekt" eller trykk `N`
3. Skriv inn et prosjektnavn (f.eks. "Test Sokker")
4. Klikk "Legg til"

### 2. Sjekk konsollen for logging
Åpne Developer Tools (F12) og se i Console-fanen. Du skal se:

**Frontend logging:**
```
handleAddProject - Creating new project: {
  "name": "Test Sokker",
  "progress": 0,
  "status": "Planlagt",
  "images": [],
  "yarns": [],
  "needles": [],
  "counters": [],
  "id": "1234567890",
  "createdAt": "2026-03-29T..."
}
handleAddProject - Calling api.createProject...
Creating project: { ... }
Project created successfully: { ... }
handleAddProject - Project saved successfully: { ... }
```

**Backend logging (se i Supabase Dashboard > Edge Functions > Logs):**
```
POST /projects - Starting project creation...
POST /projects - Received project: { ... }
POST /projects - Saving to key: project:USER_ID:PROJECT_ID
POST /projects - Project saved successfully
```

### 3. Verifiser at prosjektet lagres
1. Refresh siden (F5)
2. Prosjektet skal fortsatt være der
3. Dette betyr at det er lagret i databasen

### 4. Test oppdatering
1. Klikk på et prosjekt
2. Endre progresjon med slideren
3. Legg til garn, notater, bilder, etc.
4. Sjekk konsollen for UPDATE logging
5. Refresh siden - endringene skal være lagret

### 5. Test sletting
1. Klikk på et prosjekt
2. Klikk "Slett prosjekt"
3. Bekreft slettingen
4. Prosjektet skal forsvinne
5. Refresh siden - prosjektet skal fortsatt være borte

## Hva lagres i databasen?

All prosjektdata lagres i Supabase KV-store med følgende struktur:

**Key pattern:** `project:USER_ID:PROJECT_ID`

**Value:** Hele prosjektobjektet som JSON:
```json
{
  "id": "1234567890",
  "name": "Mine Sokker",
  "progress": 45,
  "status": "Aktiv",
  "createdAt": "2026-03-29T10:00:00.000Z",
  "images": ["https://..."],
  "yarns": [
    {
      "id": "yarn1",
      "name": "Alpakka",
      "brand": "Sandnes Garn",
      "color": "Rød",
      "amount": "100g"
    }
  ],
  "needles": [
    {
      "id": "needle1",
      "size": "3.5mm",
      "type": "Rundpinner"
    }
  ],
  "recipe": "Oppskrift her...",
  "notes": "Notater her...",
  "counters": [
    {
      "id": "counter1",
      "label": "Omganger",
      "count": 25
    }
  ],
  "timeSpentMinutes": 120,
  "category": "Sokker"
}
```

## Feilsøking

### Prosjekter lagres ikke
1. Sjekk at du er logget inn
2. Sjekk konsollen for feilmeldinger
3. Sjekk at `accessToken` finnes
4. Se på backend logs i Supabase

### Prosjekter forsvinner etter refresh
Dette betyr at CREATE virker, men backend ikke lagrer.
1. Sjekk backend logs
2. Se etter "Project saved successfully"
3. Verifiser at `kv.set()` blir kalt

### Oppdateringer lagres ikke
1. Sjekk at UPDATE logging vises
2. Se etter "Project updated successfully" i backend
3. Verifiser at optimistic update fungerer

## Suksesskriterier

✅ Nye prosjekter vises umiddelbart (optimistic update)  
✅ Prosjekter finnes fortsatt etter refresh (lagret i backend)  
✅ Oppdateringer blir lagret  
✅ Slettede prosjekter forsvinner permanent  
✅ Bilder lastes opp og lagres  
✅ Garnlager lagres separat  
✅ Alle felt (progresjon, status, notater, garn, bilder, etc.) lagres korrekt
