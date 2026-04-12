# Language Support (i18n) Plan

## Context

Knito is currently hardcoded in Norwegian (Bokmål) with ~325 translatable strings across ~16 components. The goal is to add multi-language support starting with Norwegian + English, built to easily add more languages (Swedish, German, etc.) in the future.

Key challenge: `ProjectStatus` values (`'Aktiv'`, `'Fullført'`, `'Planlagt'`, `'På vent'`, `'Arkivert'`) are Norwegian strings used as both **data keys** (stored in backend KV store) and **display text**. The data keys must stay Norwegian; only the display text gets translated.

## Approach: react-i18next

Using `react-i18next` + `i18next` over a custom context because:
- Proper pluralization rules per locale (Norwegian/English are simple, but German/Swedish differ)
- Namespace splitting for organized translation files
- Extraction tooling and translator-friendly workflow
- ~25KB gzipped — acceptable for future-proofing
- Battle-tested with React 19

## New Files

```
src/i18n/
  index.ts              — i18next config + initialization
  dateLocale.ts         — date-fns locale mapping
  locales/
    nb.json             — Norwegian translations (all strings)
    en.json             — English translations
```

## Implementation

### Step 1: Install dependencies

```
npm install i18next react-i18next --legacy-peer-deps
```

### Step 2: Create i18n config (`src/i18n/index.ts`)

- Initialize i18next with `nb` as default language, `en` as fallback
- Load translations from JSON imports (bundled, no HTTP requests)
- Interpolation: `{{variable}}` syntax
- Pluralization: `_one` / `_other` suffixes (i18next v23+ default)
- Persist language choice in `localStorage`

### Step 3: Create translation files

**`src/i18n/locales/nb.json`** — Extract all ~325 Norwegian strings into flat dotted keys:

```json
{
  "common.loading": "Laster...",
  "common.cancel": "Avbryt",
  "common.delete": "Slett",
  "common.back": "Tilbake",
  "common.save": "Lagre",
  "common.add": "Legg til",

  "status.Aktiv": "Aktiv",
  "status.Fullført": "Fullført",
  "status.Planlagt": "Planlagt",
  "status.På vent": "På vent",
  "status.Arkivert": "Arkivert",
  "status.Alle": "Alle",

  "nav.projects": "Prosjekter",
  "nav.yarnInventory": "Garnlager",
  "nav.tools": "Verktøy",
  "nav.statistics": "Statistikk",

  "dashboard.title": "Mine Strikkeprosjekter",
  "dashboard.welcome": "Velkommen, {{name}}!",
  "dashboard.newProject": "Nytt prosjekt",
  "dashboard.signOut": "Logg ut",
  "dashboard.project_one": "{{count}} prosjekt",
  "dashboard.project_other": "{{count}} prosjekter",

  ...etc (full extraction needed during implementation)
}
```

**`src/i18n/locales/en.json`** — English equivalents:

```json
{
  "common.loading": "Loading...",
  "status.Aktiv": "Active",
  "status.Fullført": "Completed",
  "status.Planlagt": "Planned",
  "status.På vent": "On hold",
  "status.Arkivert": "Archived",
  "dashboard.title": "My Knitting Projects",
  "dashboard.welcome": "Welcome, {{name}}!",
  "dashboard.project_one": "{{count}} project",
  "dashboard.project_other": "{{count}} projects",
  ...etc
}
```

### Step 4: Wire up in `main.tsx`

```tsx
import './i18n';  // side-effect import, initializes i18next
```

No provider wrapper needed — `react-i18next` uses i18next's singleton by default.

### Step 5: Update components

Replace hardcoded strings with `t()` calls. Pattern for each component:

```tsx
import { useTranslation } from 'react-i18next';

export function ProjectList({ ... }) {
  const { t } = useTranslation();
  
  // Status display (data key → translated text):
  {t(`status.${project.status}`)}
  
  // Pluralization:
  {t('dashboard.project', { count: stats.active })}
  
  // Interpolation:
  {t('dashboard.welcome', { name: user.name || user.email })}
}
```

**Files to update (in order, ~strings per file):**

1. `src/App.tsx` — ~20: page title, welcome, stat cards, tab names, footer, keyboard hints
2. `src/components/ProjectList.tsx` — ~18: search placeholder, filter/sort buttons, empty states, result count
3. `src/components/ProjectDetail.tsx` — ~60: labels, tab names, timer, counters, toasts, form fields
4. `src/components/AuthForm.tsx` — ~35: form labels, error messages, forgot password dialog
5. `src/components/YarnInventory.tsx` — ~25: labels, empty states, dialog, toasts
6. `src/components/NeedleInventory.tsx` — ~30: labels, needle types, empty states, dialog, toasts
7. `src/components/StatisticsView.tsx` — ~25: stat cards, status labels, category display
8. `src/components/AddProjectDialog.tsx` — ~25: dialog, PROJECT_TEMPLATES array (names + notes)
9. `src/components/CounterWidget.tsx` — ~5: reset button label
10. `src/components/PasswordResetFlow.tsx` — ~15: validation, error/success messages
11. `src/components/PasswordResetAdmin.tsx` — ~10: form labels, validation
12. `src/components/ErrorBoundary.tsx` — ~3: error title, description, retry button
13. `src/hooks/useProjects.ts` — ~10: toast messages for CRUD operations

### Step 6: Date locale switching

`date-fns` is already used with `{ locale: nb }`. Create a locale mapping:

```tsx
// src/i18n/dateLocale.ts
import { nb } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';

export const dateLocales = { nb, en: enUS } as const;
```

In components using date-fns:
```tsx
import { dateLocales } from '../i18n/dateLocale';
const { i18n } = useTranslation();
format(date, 'PPP', { locale: dateLocales[i18n.language] })
```

Also update `toLocaleDateString('nb-NO')` in `ProjectCard.tsx` to use the current language.

### Step 7: Add language switcher

Add a dropdown `Select` next to the theme toggle in `App.tsx` header:

```tsx
<Select value={i18n.language} onValueChange={(lang) => i18n.changeLanguage(lang)}>
  <SelectTrigger className="w-[70px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="nb">NO</SelectItem>
    <SelectItem value="en">EN</SelectItem>
  </SelectContent>
</Select>
```

Future languages just need a new JSON file + a new `SelectItem`.

## Key Design Decisions

**Status enum stays Norwegian in data layer.** `ProjectStatus = 'Aktiv' | 'Fullført' | ...` is unchanged. Display uses `t('status.${project.status}')`. Filtering logic uses the raw Norwegian strings — no change needed.

**PROJECT_TEMPLATES translated by key.** Each template gets a translation key:
```json
"templates.sokker.name": "Sokker",
"templates.sokker.notes": "Tips: Husk å måle fotlengde før du starter!"
```

**Needle type options translated.** The 6 needle types (`Rundpinne`, `Strømpepinne`, etc.) get translation keys. The internal value stays Norwegian (stored in data).

**Pluralization uses i18next's `_one`/`_other` convention.**
- `"project_one": "{{count}} project"` / `"project_other": "{{count}} projects"`
- Replaces all inline ternary pluralization (`count !== 1 ? 'er' : ''`)

## Adding a New Language

1. Create `src/i18n/locales/sv.json` (copy `en.json`, translate)
2. Add locale to `src/i18n/dateLocale.ts`
3. Import JSON in `src/i18n/index.ts` resources
4. Add `<SelectItem value="sv">SV</SelectItem>` to the switcher

## Verification

1. `npm run build` — no compile errors
2. `npm run dev` — manually test:
   - Switch language NO → EN → NO
   - Verify all tabs, forms, dialogs show correct translations
   - Verify status badges show translated text
   - Verify filter buttons use translated text but filtering still works
   - Verify dates format correctly in both locales
   - Verify toast messages are translated
   - Verify language persists across page reload
   - Verify PROJECT_TEMPLATES are translated
