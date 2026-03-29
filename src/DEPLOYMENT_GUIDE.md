# 🚀 Deployment Guide for Knito Strikkeapp

Din app er deployet på: **https://knito.vercel.app/**

## ✅ Deployment Sjekkliste

### 1. Vercel Environment Variables
Du må legge til følgende environment variables i Vercel Dashboard:

**Gå til:** Vercel Dashboard → Ditt prosjekt → Settings → Environment Variables

Legg til disse:
- `VITE_SUPABASE_URL` = Din Supabase project URL
- `VITE_SUPABASE_ANON_KEY` = Din Supabase anon/public key

**Viktig:** Etter å ha lagt til environment variables, må du **redeploy** appen!

---

### 2. Supabase Authentication Redirect URLs
Du må legge til Vercel-domenet ditt i Supabase auth-innstillinger:

**Gå til:** Supabase Dashboard → Authentication → URL Configuration

Legg til følgende i **Redirect URLs**:
```
https://knito.vercel.app/**
https://knito.vercel.app/reset-password
```

Og i **Site URL**:
```
https://knito.vercel.app
```

---

### 3. Supabase Edge Functions CORS
Sjekk at Edge Function tillater requests fra Vercel:

**Gå til:** `/supabase/functions/server/index.tsx`

CORS-innstillingene skal allerede inkludere `*` (alle domener), så dette skal fungere automatisk.

---

### 4. Test Deployment
Når alt er konfigurert:

1. ✅ Gå til https://knito.vercel.app/
2. ✅ Opprett en ny konto
3. ✅ Legg til et strikkeprosjekt
4. ✅ Refresh siden og sjekk at prosjektet er lagret
5. ✅ Test "Glemt passord"-funksjonalitet

---

## 🔧 Troubleshooting

### Problem: "Network Error" eller "Failed to fetch"
**Løsning:** Sjekk at environment variables er lagt til i Vercel og at du har redeployet.

### Problem: "Invalid login credentials"
**Løsning:** Sjekk at Supabase redirect URLs inkluderer Vercel-domenet.

### Problem: "CORS error"
**Løsning:** Sjekk at Edge Function har korrekte CORS-headere (se steg 3).

### Problem: Edge Function feiler
**Løsning:** 
1. Sjekk at Edge Function er deployet i Supabase Dashboard
2. Sjekk Edge Function logs for feilmeldinger
3. Verifiser at SUPABASE_SERVICE_ROLE_KEY er satt som secret i Supabase

---

## 📱 PWA (Progressive Web App)
Appen har PWA-funksjonalitet! Brukere kan:
- Installere appen på mobil og desktop
- Bruke den offline (limitert funksjonalitet)
- Få push-notifikasjoner (hvis konfigurert)

---

## 🔐 Sikkerhet
- ✅ Alle API-kall bruker autentisering
- ✅ SUPABASE_SERVICE_ROLE_KEY er aldri eksponert til frontend
- ✅ All data er brukerspesifikk (isolert per bruker)
- ✅ HTTPS er påkrevd (håndteres automatisk av Vercel)

---

## 📊 Monitoring
**Vercel Dashboard** gir deg:
- Deploy logs
- Runtime logs
- Analytics
- Performance metrics

**Supabase Dashboard** gir deg:
- Database queries
- Auth logs
- Edge Function logs
- Storage usage

---

## 🎯 Neste steg
1. Del lenken med andre: https://knito.vercel.app/
2. Test grundig på forskjellige enheter
3. Overvåk logs for eventuelle feil
4. Samle tilbakemelding fra brukere

---

## 💡 Tips
- Bruk Vercel's **Preview Deployments** for å teste endringer før produksjon
- Sett opp **GitHub Integration** for automatisk deployment ved push
- Vurder å legge til et custom domene (f.eks. knito.no)
- Aktiver Vercel Analytics for å se brukerstatistikk

---

Lykke til med strikke-appen din! 🧶✨
