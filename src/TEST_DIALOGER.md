# 🧪 Test-plan for dialoger i Strikke-app

**Testet dato:** 29. mars 2026  
**Fokus:** Verifisere at alle dialoger fungerer med oppdatert Dialog-implementasjon

---

## 📋 Dialoger som skal testes

### 1. ✅ "Nytt prosjekt"-dialog (AddProjectDialog)
**Plassering:** Hovedside → "Nytt prosjekt"-knapp eller trykk `N`  
**Implementasjon:** Bruker `Dialog` fra `/components/ui/dialog.tsx`

**Testscenarioer:**
- [ ] Dialog åpnes når man klikker "Nytt prosjekt"-knappen
- [ ] Dialog åpnes når man trykker `N`-tasten
- [ ] Dialog lukkes når man klikker "Avbryt"
- [ ] Dialog lukkes når man klikker utenfor dialogen
- [ ] Dialog lukkes når man trykker `Esc`
- [ ] Kan opprette prosjekt med eget navn
- [ ] Kan bytte til "Bruk mal"-visning
- [ ] Kan opprette prosjekt fra mal
- [ ] Dialog nullstilles når den lukkes
- [ ] Autofokus på navnfelt fungerer

---

### 2. ✅ "Legg til restegarn"-dialog (YarnInventory)
**Plassering:** Garnlager-fanen → Restegarn → "Legg til restegarn"-knapp  
**Implementasjon:** Bruker `Dialog` med `DialogTrigger` fra `/components/ui/dialog.tsx`

**Testscenarioer:**
- [ ] Dialog åpnes når man klikker "Legg til restegarn"-knappen
- [ ] Dialog lukkes når man klikker "Avbryt"
- [ ] Dialog lukkes når man klikker utenfor dialogen
- [ ] Alle inputfelt fungerer (navn, merke, farge, mengde, notater)
- [ ] Validering: Kan ikke legge til uten navn
- [ ] Viser feilmelding hvis navn mangler
- [ ] Restegarn legges til i listen
- [ ] Toast-melding vises ved suksess
- [ ] Dialog nullstilles etter tillegging
- [ ] Form nullstilles når dialogen lukkes

---

### 3. ✅ Slett prosjekt-bekreftelse (ProjectDetail)
**Plassering:** Prosjektdetaljer → "Slett prosjekt"-knapp  
**Implementasjon:** Bruker `AlertDialog` fra `/components/ui/alert-dialog.tsx`

**Testscenarioer:**
- [ ] AlertDialog åpnes når man klikker "Slett prosjekt"
- [ ] AlertDialog lukkes når man klikker "Avbryt"
- [ ] AlertDialog lukkes når man klikker utenfor dialogen
- [ ] Prosjektet slettes når man klikker "Slett"
- [ ] Toast-melding vises ved suksess
- [ ] Bruker navigeres tilbake til hovedside
- [ ] Viser korrekt prosjektnavn i advarselstekst

---

## 🔍 Tekniske tester

### Dialog-komponent (Context API)
**Fil:** `/components/ui/dialog.tsx`

**Verifiser:**
- [x] DialogContext er implementert
- [x] Dialog tar imot `open` og `onOpenChange` props
- [x] DialogContent sjekker context.open
- [x] DialogContent håndterer backdrop-klikk
- [x] DialogTrigger håndterer `asChild` prop
- [x] DialogTrigger kaller `context.onOpenChange(true)`

### AlertDialog-komponent
**Fil:** `/components/ui/alert-dialog.tsx`

**Verifiser:**
- [x] AlertDialog tar imot `open` og `onOpenChange` props
- [x] AlertDialog returnerer null hvis ikke open
- [x] AlertDialogContent håndterer backdrop-klikk
- [x] AlertDialogAction og AlertDialogCancel er Button-wrappers

---

## 🚀 Manuelle teststeg

### Test 1: Nytt prosjekt
1. Logg inn i appen
2. Klikk "Nytt prosjekt" eller trykk `N`
3. **Forventet:** Dialog åpnes med fokus på navnfelt
4. Skriv et prosjektnavn
5. Klikk "Legg til"
6. **Forventet:** Prosjekt opprettes, dialog lukkes, toast vises
7. Klikk "Nytt prosjekt" igjen
8. Klikk utenfor dialogen
9. **Forventet:** Dialog lukkes
10. Klikk "Nytt prosjekt" igjen
11. Klikk "Bruk mal"
12. Velg en mal (f.eks. "Sokker")
13. **Forventet:** Prosjekt opprettes med mal-data

### Test 2: Legg til restegarn
1. Gå til "Garnlager"-fanen
2. Gå til "Restegarn"-underfanen
3. Klikk "Legg til restegarn"
4. **Forventet:** Dialog åpnes
5. Prøv å klikke "Legg til" uten å fylle ut navn
6. **Forventet:** Feilmelding vises
7. Fyll ut alle felt
8. Klikk "Legg til"
9. **Forventet:** Restegarn legges til, dialog lukkes, toast vises
10. Klikk "Legg til restegarn" igjen
11. Klikk utenfor dialogen
12. **Forventet:** Dialog lukkes

### Test 3: Slett prosjekt
1. Åpne et prosjekt
2. Klikk "Slett prosjekt"
3. **Forventet:** AlertDialog vises med advarsel
4. Klikk "Avbryt"
5. **Forventet:** AlertDialog lukkes, prosjekt beholdes
6. Klikk "Slett prosjekt" igjen
7. Klikk utenfor dialogen
8. **Forventet:** AlertDialog lukkes
9. Klikk "Slett prosjekt" igjen
10. Klikk "Slett"
11. **Forventet:** Prosjekt slettes, bruker sendes tilbake, toast vises

---

## ✅ Resultater

| Dialog | Åpnes korrekt | Lukkes ved backdrop | Lukkes ved knapp | Funksjonalitet | Status |
|--------|---------------|---------------------|------------------|----------------|--------|
| Nytt prosjekt | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ Ikke testet |
| Legg til restegarn | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ Ikke testet |
| Slett prosjekt | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ Ikke testet |

**Legender:**
- ✅ Fungerer
- ❌ Fungerer ikke
- ⚠️ Delvis / Feil
- ⏳ Ikke testet

---

## 📝 Notater

*Fyll inn eventuelle observasjoner her etter testing...*

---

## 🎯 Konklusjon

Etter gjennomgang av koden:

1. **Dialog-komponenten** er korrekt implementert med Context API
2. **AlertDialog-komponenten** er korrekt implementert
3. **Alle dialoger** bruker riktig komponent
4. **Ingen opplagt kodeproblemer** funnet

**Neste steg:** Manuell testing i nettleser for å bekrefte at alt fungerer i praksis.

---

## 🔧 Eventuelle feil funnet

*Dokumenter feil her hvis noen oppdages under testing...*
