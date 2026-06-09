# FlowMat — Screen Inventory

**Figma File:** [FlowMat — Design System & Screens v1.0](https://www.figma.com/design/PLACEHOLDER — replace with actual file URL after Figma file creation)

All screens are organized into two Figma pages:
- **Page: Instructor Portal** — Desktop screens at 1440px × 900px
- **Page: Student App** — Mobile screens at 390px × 844px (iPhone 14)

An additional page:
- **Page: Components** — All shared components and variants
- **Page: White-Label Theming** — Side-by-side gym brand comparison frame

---

## Instructor Portal Screens (Desktop — 1440px)

### IP-01 · Technique Library

**Figma frame name:** `IP-01 Technique Library`

The central repository for all techniques a gym has created. Instructors browse, search, filter, and add techniques here.

**Layout:**
- Left nav (240px fixed): FlowMat logo at top, nav items (Library, Flowchart Builder, Weekly Posts, Class Planner, Students, Settings), active state uses `--color-primary` left border + background tint
- Top bar: page title "Technique Library", search input (left-aligned), filter dropdowns (Position, Belt Level, Type), `+ Add Technique` primary button (right-aligned)
- Main content area: responsive grid of `TechniqueCard` components (grid variant, 240px each), 24px gaps

**Key UX notes for engineers:**
- The search input performs a debounced (300ms) Supabase full-text search on technique `title` and `description`
- Filter dropdowns are multi-select; active filters shown as dismissible chips above the grid
- The grid uses CSS Grid with `repeat(auto-fill, minmax(240px, 1fr))` — do not use a fixed column count
- `+ Add Technique` opens a slide-over panel (not a new route) to minimize context switching
- Empty state (no techniques yet): uses the `EmptyState` component with "Add Technique" CTA

---

### IP-02 · Flowchart Builder

**Figma frame name:** `IP-02 Flowchart Builder`

The visual tool for building a gym's "game plan" — connecting techniques into a directed flowchart that students see in their app.

**Layout:**
- Top toolbar (56px): FlowMat logo, breadcrumb "Library > Flowchart Builder", divider, Undo, Redo, Fit View icon buttons, `+ Add Node` button, Template picker dropdown, Save button (primary, right-aligned)
- Left sidebar (280px, collapsible): "Technique Library" panel header, search input, scrollable list of all techniques as compact `list` variant `TechniqueCard` components — drag to canvas to add
- Main canvas: full-width dark background (`--color-surface-bg`), React Flow instance, `FlowchartNode` components connected by animated dashed edges with condition labels

**Key UX notes for engineers:**
- The canvas uses React Flow (`reactflow` package). Node and edge data is persisted to Supabase in `flowchart_nodes` and `flowchart_edges` tables on every Save action
- Edge labels ("if defended →", "counter →") are editable inline on double-click
- Auto-save is **not** enabled — explicit Save button only, to prevent accidental publishes
- The sidebar uses the same technique search API as IP-01 (debounced, Supabase full-text)
- Nodes show belt-color left border using the technique's `belt_level` field mapped to `--color-belt-*` tokens
- Undo/Redo is client-side only (React state stack, max 50 steps) — not persisted
- Template picker loads pre-built flowchart templates from a `flowchart_templates` Supabase table

---

### IP-03 · Student Dashboard

**Figma frame name:** `IP-03 Student Dashboard`

Overview of all students enrolled at the gym. Instructors monitor progression and identify at-risk students.

**Layout:**
- Same left nav as IP-01
- Top: page title "Students", `+ Invite Student` button (right-aligned)
- Summary row (top of content): three `StatCard` components — "Active Students" (neutral), "Avg Techniques Logged" (neutral), "At-Risk Students" (warning/danger based on count)
- Student table below: columns — Avatar + Name, Belt, Techniques Logged, Last Active, Flowchart Nodes, Risk

**Table column details:**
- Avatar: 32px circle with initials fallback
- Belt: `BeltBadge` component (sm variant)
- Techniques Logged: plain number
- Last Active: relative timestamp ("3 days ago") in `--type-body-sm` `--color-text-secondary`
- Flowchart Nodes: plain number
- Risk: `ChurnRiskIndicator` component

**Key UX notes for engineers:**
- At-risk threshold logic: `high` if last active > 21 days, `medium` if 8–21 days, `low` if ≤7 days — this threshold should be configurable in gym settings, not hard-coded
- Clicking a student row navigates to a student detail page (not yet designed in v1.0 — route placeholder needed)
- The table is sortable by all columns; default sort is Risk descending (highest risk first)
- Pagination: 50 rows per page, cursor-based (Supabase `range`)
- The summary `StatCard` values are computed server-side via a Supabase view or RPC for performance

---

## Student App Screens (Mobile — 390px × 844px)

### SA-01 · Home / Curriculum Feed

**Figma frame name:** `SA-01 Home Feed`

The student's primary daily surface. Shows the latest weekly posts and announcements from their gym instructor.

**Layout:**
- Status bar (44px, system)
- Header (56px): gym logo (left, 120px × 40px bounding box), student first name greeting ("Hey, Marcus"), `BeltBadge` sm (right)
- Scrollable feed: `FeedCard` components (weekly-post and announcement variants), 16px horizontal padding, 12px gap between cards
- Bottom tab bar: `BottomTabBar` component, Feed tab active

**Key UX notes for engineers:**
- Feed is ordered by `published_at` descending — newest first
- Weekly post cards show a technique preview thumbnail (from the first technique in the post); if none, use a branded gradient placeholder
- Announcement cards must be visually distinct (amber left border) — never mistake them for content posts
- Pull-to-refresh triggers a re-fetch from Supabase `weekly_posts` table filtered by `gym_id`
- Unread indicator: a small `--color-primary` dot on the Feed tab icon if there are posts newer than the student's `last_feed_viewed_at` timestamp
- Empty state (no posts yet): `EmptyState` component — "Your instructor hasn't posted yet. Check back soon."

---

### SA-02 · Personal Flowchart

**Figma frame name:** `SA-02 Personal Flowchart`

The emotional core of the student experience. A read-only visualization of the student's personal "game" — techniques they've logged, connected into a flowchart.

**Layout:**
- Status bar (44px)
- Stats bar (48px): "X techniques · X connections" in `--type-body-sm`, read-only
- Full-screen canvas (WebView rendering a React Flow read-only graph): dark background (`--color-surface-bg`), `FlowchartNodeMobile` components
- Bottom tab bar

**Empty state (no techniques logged):**
- Rendered inside the canvas area
- SVG illustration: simplified mat outline (gentle line art, not photographic)
- Heading: "Your game plan grows here." (`--type-h1`)
- Subtext: "Log your first technique after class." (`--type-body`, `--color-text-secondary`)
- CTA button: "Log a Technique" (primary button, taps to open SA-04)

**Key UX notes for engineers:**
- The flowchart data is the gym's master flowchart filtered to only show nodes where the student has a corresponding `technique_logs` entry — the student "reveals" the graph as they log
- `isLogged` nodes show a `--color-success` check icon; unlogged nodes are dimmed (40% opacity) if visible at all — consider whether to show unlogged nodes or not (product decision, flag in `gym_settings.show_unlogged_nodes`)
- The WebView approach is chosen for parity with the Instructor Portal canvas (same React Flow codebase). The native app embeds a local HTML bundle, not a remote URL, for offline resilience
- Pan and pinch-to-zoom are enabled; no editing allowed
- Stats bar updates in real-time via Supabase Realtime subscription on `technique_logs`

---

### SA-03 · Belt Progression

**Figma frame name:** `SA-03 Belt Progression`

Shows the student's current belt, progress toward next belt, and what techniques are required to be eligible for promotion.

**Layout:**
- Status bar + navigation header ("Belt Progression", back chevron)
- Current belt section: large `BeltBadge` (lg variant, centered, 80px height), belt name below in `--type-h1`
- Progress section: "X of Y techniques logged for next belt" label, full-width progress bar (fill = `--color-primary`, `--radius-full`)
- Instructor note (card): amber left border, "Your instructor decides when to promote you. This shows your readiness, not a guarantee." — `--type-body-sm`
- Required techniques list: section header "Required for [next belt]", scrollable list of technique names with logged/not-logged status (checkmark or empty circle + technique title + position chip)

**Key UX notes for engineers:**
- Belt requirements are defined per gym in a `belt_requirements` table (gym_id, belt_level, technique_id) — instructors configure this in the portal (Settings screen, v2 scope)
- Progress bar percentage = `logged_required_techniques / total_required_techniques`; cap display at 100% even if student has logged more than required
- The instructor note must always be visible — it sets the right expectation and reduces "I hit 100%, where's my promotion?" support requests
- "Not yet configured" state: if the gym hasn't set belt requirements, show a friendly message: "Your instructor hasn't set belt requirements yet."
- This screen is accessible from the Profile tab, not the bottom tab bar directly

---

### SA-04 · Technique Log — Add Technique

**Figma frame name:** `SA-04 Log Technique Sheet`

A bottom sheet modal that allows students to quickly log a technique they drilled or rolled. **Target: completable in under 15 seconds from the home screen.**

**Layout:**
- Bottom sheet (slides up, `--radius-lg` top corners, `--color-surface-elevated` background)
- Drag handle (40px × 4px, `--color-surface-card`, centered, 12px from top)
- Sheet title: "Log a Technique" (`--type-h2`, 16px from drag handle)
- Search bar: full-width, `--radius-md`, magnifier icon, placeholder "Search techniques..."
- Recent techniques section (shown before any search): "Recent" label (`--type-label`), list of last 5 logged techniques as compact rows (title, position chip, belt chip)
- Search results: replaces recent list when query length ≥ 2 characters
- Each row: 48px tall, technique title (`--type-body`), position chip + belt chip (right side)
- **On tap → quick-add form (same sheet, slides up):**
  - Selected technique name (non-editable, confirmation)
  - Notes field: multiline text input, optional, placeholder "What worked? What to drill more?"
  - Toggle row: "Drilled" toggle + "Rolled" toggle (can select both)
  - "Log It" primary button (full-width)

**Key UX notes for engineers:**
- The sheet opens instantly from the Log tab icon in `BottomTabBar` — zero loading state; recent techniques are pre-fetched when the app loads
- Search is client-side against the gym's full technique list (pre-loaded at app start, stored in local state) — no network round-trip during search
- The "Log It" button posts to `technique_logs` (student_id, technique_id, notes, drilled, rolled, logged_at) and dismisses the sheet with a brief success toast
- The entire interaction is designed to be thumb-reachable — no element should require stretching beyond the natural thumb arc on a 390px-wide screen
- **15-second path:** Open app (already on Feed) → tap Log tab → recognize technique in Recent list → tap row → tap "Log It" = 3 taps, ~8 seconds
- Notes field and toggles are friction-reducers, not required — the "Log It" button is always enabled once a technique is selected

---

## White-Label Theming Frame

**Figma frame name:** `WL-01 White Label Brand Comparison`

A single wide frame (1440px × 900px) showing the `SA-01 Home Feed` screen rendered side-by-side in three gym brand configurations. This is a design-only frame for communicating the theming system to engineers and stakeholders.

**Three columns:**
1. **FlowMat (default):** Primary `#1B4FD8`, Secondary `#F59E0B`, FlowMat wordmark
2. **Gracie North (example):** Primary `#1E3A5F` (navy), Secondary `#C9A84C` (gold), "GN" crest placeholder
3. **Checkmat Austin (example):** Primary `#CC0000` (red), Secondary `#111111` (black), Checkmat logo placeholder

Each column is an exact duplicate of the SA-01 frame with only `--color-primary`, `--color-secondary`, and the gym logo swapped. The layout, spacing, and all other tokens are identical, demonstrating that the theming system requires no layout changes.

**Key note for engineers:** This frame confirms that the theming contract is two hex values + one image URL. If a proposed design change requires more overrides to look correct across all three brands, the design needs revision — not the theming system.

---

## Screen Status

| Frame ID | Screen Name | Platform | Status |
|---|---|---|---|
| IP-01 | Technique Library | Instructor Portal | Designed v1.0 |
| IP-02 | Flowchart Builder | Instructor Portal | Designed v1.0 |
| IP-03 | Student Dashboard | Instructor Portal | Designed v1.0 |
| SA-01 | Home / Curriculum Feed | Student App | Designed v1.0 |
| SA-02 | Personal Flowchart | Student App | Designed v1.0 |
| SA-03 | Belt Progression | Student App | Designed v1.0 |
| SA-04 | Log Technique Sheet | Student App | Designed v1.0 |
| WL-01 | White Label Brand Comparison | Cross-platform | Designed v1.0 |
| IP-04 | Weekly Post Editor | Instructor Portal | Planned v1.1 |
| IP-05 | Class Planner | Instructor Portal | Planned v1.1 |
| SA-05 | Video Library | Student App | Planned v1.1 |
| SA-06 | Student Profile | Student App | Planned v1.1 |
