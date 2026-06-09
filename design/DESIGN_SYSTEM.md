# FlowMat Design System

**Figma File:** [FlowMat — Design System & Screens v1.0](https://www.figma.com/design/PLACEHOLDER — replace with actual file URL after Figma file creation)

This document is the single source of truth for the FlowMat design system. It covers color tokens, typography, spacing, components, and white-label theming instructions for engineers implementing the Instructor Portal (React.js) and Student App (React Native).

---

## Color Tokens

All colors are defined as Figma variables in the `Colors` collection. Gyms override `--color-primary` and `--color-secondary` at runtime; all other tokens are fixed.

### Brand / Theme (gym-overridable)

| Token | Default Hex | Usage |
|---|---|---|
| `--color-primary` | `#1B4FD8` | Primary actions, active states, links, progress fills |
| `--color-secondary` | `#F59E0B` | Achievements, highlights, CTAs, belt unlocks |

### Surface / Background

| Token | Hex | Usage |
|---|---|---|
| `--color-surface-bg` | `#0F172A` | App and portal background (dark — mat aesthetic) |
| `--color-surface-elevated` | `#1E293B` | Modals, sheets, nav panels |
| `--color-surface-card` | `#334155` | Cards, list items, technique tiles |

### Text

| Token | Hex | Usage |
|---|---|---|
| `--color-text-primary` | `#F8FAFC` | Headings, primary body copy |
| `--color-text-secondary` | `#94A3B8` | Supporting text, metadata, timestamps |
| `--color-text-muted` | `#475569` | Placeholders, disabled labels |

### Semantic

| Token | Hex | Usage |
|---|---|---|
| `--color-success` | `#10B981` | Logged techniques, confirmed actions, green churn risk |
| `--color-warning` | `#F59E0B` | At-risk students, caution states (shares value with secondary) |
| `--color-error` | `#EF4444` | Errors, high churn risk, destructive actions |

### Belt Colors

These are not overridable — they represent the actual BJJ belt progression.

| Token | Hex | Belt |
|---|---|---|
| `--color-belt-white` | `#F8FAFC` | White belt |
| `--color-belt-blue` | `#3B82F6` | Blue belt |
| `--color-belt-purple` | `#A855F7` | Purple belt |
| `--color-belt-brown` | `#92400E` | Brown belt |
| `--color-belt-black` | `#0F172A` | Black belt |

**Implementation note:** Belt badge backgrounds use the belt color token. White belt badge uses a `1px` border in `--color-text-muted` to remain visible on dark backgrounds.

---

## Typography Scale

Font families: **Inter** (all UI text), **JetBrains Mono** (technique codes/IDs only).

| Token | Family | Size | Weight | Line Height | Usage |
|---|---|---|---|---|---|
| `--type-display` | Inter | 32px | 700 (Bold) | 40px | Screen titles, onboarding hero text |
| `--type-h1` | Inter | 24px | 600 (Semi Bold) | 32px | Section headers, modal titles |
| `--type-h2` | Inter | 20px | 600 (Semi Bold) | 28px | Card headers, panel titles |
| `--type-h3` | Inter | 16px | 600 (Semi Bold) | 24px | List section labels, sub-headers |
| `--type-body` | Inter | 14px | 400 (Regular) | 20px | Primary body copy, descriptions |
| `--type-body-sm` | Inter | 12px | 400 (Regular) | 16px | Metadata, timestamps, helper text |
| `--type-label` | Inter | 12px | 500 (Medium) | 16px | Tags, badges, chip labels — UPPERCASE, letter-spacing: 0.05em |
| `--type-mono` | JetBrains Mono | 12px | 400 (Regular) | 16px | Technique codes (e.g. `ARM-001`) |

---

## Spacing Scale

All spacing is derived from a **4pt base grid**. Use these tokens for all margin, padding, and gap values.

| Token | Value | Common usage |
|---|---|---|
| `--space-xs` | 4px | Icon-to-label gap, tight chip padding |
| `--space-sm` | 8px | Inner card padding, list item vertical padding |
| `--space-md` | 16px | Standard section padding, form field gap |
| `--space-lg` | 24px | Card-to-card gap, modal padding |
| `--space-xl` | 32px | Section separation, screen top padding |
| `--space-2xl` | 48px | Hero sections, large vertical rhythm |
| `--space-3xl` | 64px | Full-screen empty state vertical centering |

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 4px | Tags, chips, small badges |
| `--radius-md` | 8px | Cards, inputs, buttons |
| `--radius-lg` | 12px | Bottom sheets, modals |
| `--radius-xl` | 16px | Large cards, feature panels |
| `--radius-full` | 9999px | Pill buttons, avatar circles, belt badges |

---

## Component Library

All components are defined in the Figma file under **Pages > Components**. Each component has variants documented below.

### TechniqueCard

A card representing a single BJJ technique. Used in the Instructor Portal library grid and Student App technique lists.

- **Variants:** `grid` (240px wide, vertical layout with thumbnail), `list` (full-width, horizontal layout, no thumbnail)
- **Props:** title, position tag, belt color, difficulty (1–5 dots), video thumbnail (optional), `isLogged` boolean (student view only)
- **Grid card anatomy:** 240px × auto, `--radius-md` corners, `--color-surface-card` background, 120px tall thumbnail placeholder (top), `--space-sm` inner padding, title in `--type-h3`, position chip below title, belt badge + difficulty dots in footer row
- **Difficulty dots:** 5 circles, filled with `--color-primary` up to the difficulty level, empty (outlined) beyond

### BeltBadge

Pill-shaped badge displaying the student's current belt rank.

- **Variants:** `white`, `blue`, `purple`, `brown`, `black`
- **Anatomy:** `--radius-full`, belt color token as background, `--type-label` text in uppercase ("WHITE BELT"), white text on all except white belt (which uses `--color-text-primary` text with `--color-text-muted` border)
- **Sizes:** `sm` (used in lists/cards), `lg` (used on Belt Progression screen)

### PositionChip

Small colored chip identifying a technique's BJJ position.

- **Positions and colors:**
  - Guard: `#1D4ED8` (blue family)
  - Mount: `#7C3AED` (purple family)
  - Back: `#B45309` (amber-brown family)
  - Half Guard: `#0F766E` (teal family)
  - Side Control: `#BE185D` (rose family)
  - Standing: `#374151` (neutral)
- **Anatomy:** `--radius-sm`, 6px × 12px padding, `--type-label` text uppercase
- **Behavior:** Multiple chips can stack horizontally with `--space-xs` gap; overflow to "+N more" chip

### FlowchartNode

Node used on the Instructor Portal flowchart canvas (React Flow).

- **Anatomy:** 200px × 80px rounded rectangle (`--radius-md`), `--color-surface-elevated` background, 4px left border in the technique's belt color token, small video thumbnail (40px × 40px) left-aligned, technique title in `--type-body` (600 weight), position chip below title
- **States:** default, selected (2px `--color-primary` outline), hover (slight brightness increase)
- **Ports:** two small circles (top center = entry, bottom center = exit) visible on hover

### FlowchartNodeMobile

Read-only version of FlowchartNode for the Student App WebView.

- **Anatomy:** 160px × 64px, same left belt-color border, title only (no thumbnail to save space), `isLogged` state shows `--color-success` checkmark icon in top-right
- **States:** default, logged (green check), current-focus (primary color glow)

### BottomTabBar

Student App bottom navigation.

- **Tabs:** Feed, Flowchart, Log (center — primary action), Videos, Profile
- **Active state:** icon + label in `--color-primary`, filled icon variant
- **Inactive state:** icon + label in `--color-text-muted`, outlined icon variant
- **Log tab (center):** oversized `--color-primary` filled circle button, `+` icon — extends above the tab bar to draw attention
- **Background:** `--color-surface-elevated`, 1px top border in `--color-surface-card`

### FeedCard

Card in the Student App curriculum feed.

- **Variants:**
  - `weekly-post`: Instructor avatar (40px circle) + name + date in header row; technique preview image (full-width, 16:9); post title in `--type-h2`; truncated description in `--type-body`; "View Technique" link
  - `announcement`: No image; `--color-secondary` left border (4px); title in `--type-h2`; body in `--type-body`; optional CTA button
- **Background:** `--color-surface-card`, `--radius-lg`

### EmptyState

Full-screen or section-level illustration + message for zero-data states. Two key instances:

1. **New gym (no content):** Mat outline illustration (simple SVG line art), heading "Build your curriculum.", subtext "Create your first technique to get started.", primary CTA button "Add Technique"
2. **New student (no techniques logged):** Illustrated flowchart seed/sprout, heading "Your game plan grows here.", subtext "Log your first technique after class.", primary CTA button "Log a Technique"

- **Layout:** vertically centered in available space, illustration max-width 240px, `--space-lg` between illustration and text, `--space-sm` between heading and subtext, `--space-md` before CTA

### StatCard

Summary metric card used in the Instructor Portal student dashboard.

- **Anatomy:** `--color-surface-elevated` background, `--radius-lg`, `--space-md` padding, label in `--type-label` (muted), large number in `--type-display` (`--color-text-primary`), optional subtitle or delta indicator
- **Variants:** `neutral`, `warning` (amber left border), `danger` (red left border)

### ChurnRiskIndicator

Small inline indicator showing a student's engagement risk level.

- **Variants:** `low` (green dot, label "Active"), `medium` (amber dot, label "At Risk"), `high` (red dot, label "Churning")
- **Dot:** 8px circle in semantic color token
- **Used in:** Student table rows, student detail header

---

## White-Label Theming

FlowMat supports full gym brand customization. The runtime theming system injects two CSS custom property overrides at app bootstrap. All other design tokens remain fixed.

### Overridable tokens

```css
--color-primary   /* Main brand color — buttons, active states, progress */
--color-secondary /* Accent color — achievements, badges, highlights */
```

Optionally, gyms may also provide:
```
gymLogoUrl        /* URL to the gym's logo (SVG or PNG, displayed in app header) */
gymName           /* Displayed in onboarding and profile screens */
```

### How it works (React Native)

The Supabase `gyms` table stores `primary_color`, `secondary_color`, `logo_url`, and `gym_name` per gym. At app launch, the `GymThemeProvider` fetches these values and exposes them via React Context. All components consume `useTheme()` instead of hard-coded color constants.

```typescript
// Theme shape
interface GymTheme {
  primaryColor: string;   // hex, e.g. "#1B4FD8"
  secondaryColor: string; // hex, e.g. "#F59E0B"
  logoUrl: string;
  gymName: string;
}
```

### How it works (Instructor Portal / React.js)

CSS custom properties are set on `:root` at runtime:

```javascript
document.documentElement.style.setProperty('--color-primary', gym.primaryColor);
document.documentElement.style.setProperty('--color-secondary', gym.secondaryColor);
```

Tailwind config maps `primary` and `secondary` to `var(--color-primary)` and `var(--color-secondary)` so all utility classes respond automatically.

### Example gym brands

| Gym | Primary | Secondary | Logo treatment |
|---|---|---|---|
| FlowMat (default) | `#1B4FD8` (blue) | `#F59E0B` (amber) | FlowMat wordmark |
| Gracie North (example) | `#1E3A5F` (navy) | `#C9A84C` (gold) | Academy crest |
| Checkmat Austin (example) | `#CC0000` (red) | `#111111` (black) | Checkmat logo |

### Design contract for engineers

- **Never** hard-code `#1B4FD8` or `#F59E0B` in components — always use `--color-primary` / `--color-secondary` tokens or the `useTheme()` hook
- **Never** override belt colors — they are semantically meaningful and non-negotiable
- **Always** test new components against all three example gym brands above before merging
- Surface/background/text tokens are **not** overridable — they are part of the core dark-mat aesthetic and must remain consistent across all gyms
- Logo dimensions: reserve a 120px × 40px bounding box in the app header; the gym logo should fit within this box with `object-fit: contain`
