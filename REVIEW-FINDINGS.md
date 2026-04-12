# Knito App — Multi-Perspective Review

**Date:** 2026-04-12
**Reviewed by:** UX Designer, UI Designer, Product Owner, Software Architect, Super User (Power Knitter)

---

## The Panel

| Role | Overall Score | Verdict |
|------|--------------|---------|
| UX Designer | — | Solid foundation, navigation friction & cognitive overload in ProjectDetail |
| UI Designer | 8.5/10 | Professional-grade design system, excellent dark mode & visual polish |
| Product Owner | Invest (conditional) | Core features good, but inventory linking is a dealbreaker gap |
| Architect | — | Works at small scale, monolithic state & security issues block growth |
| Super User (knitter) | 6/10 | Great counter & timer, but too shallow for power knitters |

---

## Top Findings Everyone Agrees On

### 1. Needle Inventory is Hidden

The NeedleInventory component is imported and state is managed in App.tsx, but **it's never rendered in the main tab navigation**. The feature is effectively invisible to users. A 4th tab ("Verktoy") needs to be added.

### 2. Inventory Systems Don't Connect to Projects

This is the single biggest product gap. Yarn and needles exist in two isolated worlds:

- **In projects**: manually typed freeform fields
- **In inventory**: structured data with quantities

There's no bridge — you can't "pick yarn from your stash" when creating a project, or "check out a needle" from your collection. The `inventoryNeedleId` field exists in the type but is never used. This makes the inventory features feel half-built.

### 3. ProjectDetail Does Too Much

This single component manages: project editing, yarn/needle CRUD, image uploads, timer with per-second re-renders, log entries, counters, and delete confirmation. The UX designer calls it cognitive overload; the architect calls it a god component. Both recommend decomposing it into focused sub-views (Overview, Work, Materials, Documentation).

### 4. State-Driven Navigation Creates Dead Ends

When you open a project, the entire tab bar disappears. You can't check your yarn inventory while editing a project without going back first. No context switching is possible, which is frustrating for the daily workflow of "knit, check stash, continue."

### 5. App.tsx is a Monolith

All state (9 `useState` hooks), all handlers, all data fetching live in one 546-line root component. Every state change potentially re-renders the entire tree. Props are drilled deep. This makes testing impossible and adding features increasingly painful.

---

## Unique Insights Per Role

### UX Designer

- Keyboard shortcuts (N, Esc) exist but are **not discoverable** — no tooltips, tiny hint text below the fold
- Empty states are present but miss **onboarding opportunities** (no "Get Started" guidance)
- Template system is good but **underutilized** — can't save custom templates or preview before selecting
- Inconsistent add/edit patterns (dialogs in some places, inline forms in others)
- The "Restegarn" (scrap yarn) vs project yarn distinction may confuse new users
- Statistics tab is informational but **not actionable** — no drill-down to specific projects

### UI Designer

- Color system is **excellent** — warm earth tones (#d97757) with semantic status colors
- Dark mode is **thoroughly implemented** with proper token inversions
- Some raw HTML `<select>` elements in NeedleInventory break the shadcn/ui consistency
- Input components lack **error state styling** (no visual validation feedback)
- Touch targets are generous (64px counter buttons) — good for mobile knitting use
- Gradient usage and shadow layering create professional visual depth
- Empty states are well-designed with appropriate icons and messaging
- Chart color tokens (--chart-1 through --chart-5) exist but aren't used in actual visualizations yet

### Product Owner

- **Project status lifecycle makes sense** (Planlagt -> Aktiv -> Pa vent -> Fullfort), but there's no auto-transition or status change history
- **Missing features that matter**: no export/backup, no sharing, no cost tracking, no archiving (delete is permanent)
- **Positioning advice**: Don't compete with Ravelry on social/patterns. Own the niche of "focused project & tool tracker for serious makers"
- **Templates are valuable** (8 built-in) but categories should become tags for more flexibility
- **Competitive strengths**: Time tracking, counters, needle inventory, and data ownership are genuine differentiators vs Ravelry
- **Monetization angle**: Freemium model — core features free, premium for backup/sharing/advanced stats

### Software Architect

- **Security risk**: Backend manually decodes JWT without signature verification — tokens can be forged
- **Wildcard dependencies** (`"*"`) in package.json for 5 packages — will break on major version bumps
- **No error boundaries** — a single component crash takes down the entire app
- **Timer re-renders** the entire ProjectDetail every second when active
- **No pagination/virtualization** — will degrade with 100+ projects
- **Inefficient KV store** — creates a new Supabase client per request instead of using a singleton
- **No optimistic update rollback on partial failures** — all-or-nothing rollback loses successful items
- **Missing memoization** — components like ProjectCard not wrapped with React.memo, causing unnecessary re-renders
- **`any` types** scattered in error handlers and Hono context — weakens type safety

### Super User (Avid Knitter)

- **Counter widget is genuinely excellent** — best feature in the app, would use it "religiously"
- **Missing pattern awareness**: can't track where you are in a pattern, no row-to-pattern mapping
- **Yarn data model is too simple**: no yarn weight (DK/worsted/bulky), fiber content, yardage, or dye lot
- **Gauge tracking absent** — critical for sweaters and fitted garments
- **Real workflow**: Would still need Ravelry for pattern lookup + stash search, and a separate PDF reader for patterns. Knito handles projects well but can't be the only knitting app
- **No bulk operations**: can't mark multiple projects as completed or move yarn between projects
- **Counter limitations**: no +5/+10 buttons for bulk counting, no undo for miscounts, no pattern-repeat awareness
- **Best use case**: Ideal for a knitter with 3-5 active projects, simple patterns, and a modest stash

---

## Competitor Comparison

| Aspect | Knito | Ravelry | KnitCompanion | Row Counter |
|--------|-------|---------|---------------|-------------|
| Time tracking | Built-in timer | Manual entry | No | No |
| Stitch counters | Integrated, excellent UX | Separate tool | Good | Core feature |
| Needle inventory | Dedicated UI (hidden) | Text-based | No | No |
| Offline use | PWA | Web-only | Native | Native |
| Social/sharing | None | Community hub | No | No |
| Pattern library | None | Huge DB | Pattern-guided | No |
| Cost tracking | None | Yes | No | No |
| Data ownership | Self-hosted | Proprietary | Proprietary | Proprietary |
| Yarn database | Freeform fields | Structured DB | No | No |
| Gauge tracking | None | Yes | Yes | No |

**Positioning**: Knito is best as "focused project management + tool tracking" — not a social platform or pattern discovery engine.

---

## Priority Action Plan

### Phase 1 — Critical (Do First)

| # | Action | Why | Effort |
|---|--------|-----|--------|
| 1 | **Add Needle Inventory tab** to main navigation | Feature exists but is invisible to users | Low |
| 2 | **Link inventory to projects** — "Pick from stash" for yarn and needles | Single biggest product gap; makes inventory features actually useful | Medium |
| 3 | **Fix JWT security** — use Supabase's built-in verification instead of manual `atob` | Tokens can currently be forged; security risk | Medium |
| 4 | **Add soft delete/archive** — delete is currently permanent with no undo | Destructive action with no safety net | Low |

### Phase 2 — High Value (Next)

| # | Action | Why | Effort |
|---|--------|-----|--------|
| 5 | **Decompose ProjectDetail** into sub-components (Header, Timer, Materials, Log, Counters) | God component; cognitive overload for users, unmaintainable for devs | High |
| 6 | **Extract state management** from App.tsx into Context or lightweight state library | 9 useState hooks in root; prop drilling everywhere; testing impossible | High |
| 7 | **Add structured yarn fields** — weight, fiber content, yardage | Yarn model too simple for real stash management | Medium |
| 8 | **Add gauge tracking** — structured swatch/gauge fields per project | Critical for sweaters and fitted garments; power knitters expect it | Low |
| 9 | **Pin dependency versions** — remove all `"*"` from package.json | Wildcard versions will break on major version bumps | Low |
| 10 | **Add error boundaries** around major sections | Single component crash takes down entire app | Low |

### Phase 3 — Polish & Differentiate

| # | Action | Why | Effort |
|---|--------|-----|--------|
| 11 | **Allow context switching** — keep tab bar visible when in project detail | Users can't check inventory while editing a project | Medium |
| 12 | **Add export** — PDF/JSON for projects and data backup | No way to back up or share data | Medium |
| 13 | **Improve counters** — add +5/+10 buttons, undo, pattern-repeat awareness | Counter is the best feature; make it even better | Low |
| 14 | **Cost tracking** — optional price field on yarn, total project cost | Requested by budget-conscious and gift knitters | Low |
| 15 | **Advanced statistics** — project duration, yarn trends, productivity over time | Current stats are view-only with no drill-down | Medium |
| 16 | **Improve discoverability** — keyboard shortcut tooltips, onboarding tour, better empty states | Features exist but users don't find them | Low |
| 17 | **Standardize form patterns** — use consistent dialog or inline forms across all sections | Currently mixes dialogs and inline forms for similar operations | Low |
| 18 | **Add input validation & error states** — visual feedback on forms | No error styling on inputs; minimal client-side validation | Low |

### Phase 4 — Future Differentiators

| # | Action | Why | Effort |
|---|--------|-----|--------|
| 19 | Pattern-aware tracking (row-to-pattern mapping, progress within pattern) | Power knitters need to track where they are in complex patterns | High |
| 20 | Dye lot / SKU tracking on yarn | Important for mid-project yarn purchases | Low |
| 21 | Sharing & collaboration (public/private projects, share links) | Social features would expand reach | High |
| 22 | Smart suggestions ("You have leftover yarn — start a project?") | Engagement driver; makes the app feel alive | Medium |
| 23 | Pagination/virtualization for large lists | Current rendering breaks at 100+ projects | Medium |
| 24 | Project-to-project linking (reference another WIP) | Useful for matching sets or learning from past projects | Medium |

---

## The Bottom Line

Knito has a **strong foundation** — the design system is polished, the core workflow (create project -> track progress -> log time) works well, and the counter widget is genuinely best-in-class. The warm, focused UI is appealing.

The critical gap is that the **inventory features don't connect to projects**. This is the single change that would transform Knito from "nice project tracker" to "indispensable knitting companion." Fix the linking, expose the hidden needle tab, and the product story becomes much stronger.

Architecturally, address the JWT security issue soon and start decomposing the monolithic components before adding more features — otherwise each new feature gets harder to build.

**Strategic positioning**: Knito should own the niche of "focused project & tool tracker for serious makers" rather than competing with Ravelry on social features and pattern libraries. That's a winnable, valuable position.
