# CommonTime — Design System

> **Find the best shared time, not just the overlapping one.**
> A competitive concept to When2meet for small peer groups (3–10 people).
> This file records the design direction as it is implemented in `src/styles/index.css` and the components.

---

## 1. Direction

**Calm paper, decisive ink.** White bento cards float on a warm-gray canvas ruled with a faint 24px grid, a nod to a calendar. Everything is quiet so that two things carry the meaning:

1. **One green family** for availability. It's the only saturated color in the product, so green always means "people can come."
2. **Ink (near-black)** for decisions: primary actions, the #1 rank badge, and the confirmed ticket.

Personality comes from motion and small physical details: a sliding brush pill, painted time that merges into calendar blocks, a ticket with perforation notches, and a stamp that thunks down when you confirm. Color stays restrained.

Reference cues taken from the brief's moodboard:

| Reference | What we borrowed |
| --- | --- |
| Bento UI kit (tasks, tracking, product cards) | White 20px cards, hairline borders, uppercase eyebrows, dashed dividers, illustrated avatars, the segmented "streak tracker" bar |
| Fanned calendar cards | The hero's fanned option cards; painted availability rendered as calendar-event blocks |
| ElevenLabs list + orb | A single expressive moment per screen; everything else stays editorial and calm |
| Admin app (Shopify connect) | Breadcrumb header, quiet sidebar-like metadata pills, tables of plain facts |
| Dark "Book a call" sheet | The ink header of the confirmed ticket; the selected-day ink pills in the date picker |

---

## 2. Tokens

### Surfaces
| Token | Value | Use |
| --- | --- | --- |
| `canvas` | `#F4F4F2` + 24px grid at 2.8% black | Page background |
| `surface` | `#FFFFFF` | Cards, popovers |
| `sunken` | `#F7F7F5` | Inset panels inside cards |
| `line` / `line-strong` | 7% / 12% black | Hairlines, dashed dividers |

### Text & ink
| Token | Value | Contrast on white |
| --- | --- | --- |
| `fg` | `#121212` | 18.9:1 |
| `fg-2` | `#545454` | 7.6:1 |
| `fg-3` | `#717171` | 4.8:1 (AA body) |
| `fg-4` | `#A6A6A6` | Decorative / disabled only |
| `ink` | `#161616` | Primary buttons, rank #1, ticket |
| `accent` | `#5B5BF0` | Focus rings, organizer badge, hover window outline |

### Preference states (never color alone — PRD §14)
| State | Fill | Pattern | Icon | Avatar ring |
| --- | --- | --- | --- | --- |
| **Preferred** | `pref` `oklch(0.78 0.15 153)` | solid | filled star | solid green ring |
| **Works** | `works` `oklch(0.955 0.04 150)` | 45° hatch in `works-line` | check | dashed ring |
| **Unavailable** | white | none | ✕ (in summaries) | greyscale avatar |

Text and icons on green use `pref-ink` `oklch(0.33 0.08 153)`, never white.

**Heatmap ramp:** each cell's fill is `color-mix(pref, white)`, scaled from 12% to 100% by the share of people who can attend. A cell where everyone can attend switches to `pref-strong`, so full coverage reads instantly.

### Spacing
A 4px grid. The working steps are **4 · 8 · 12 · 16 · 20 · 24 · 32**.

| Relationship | Space |
| --- | --- |
| Inside a group (label → input, date → time) | 4–8px |
| Between groups inside a card (header → content, divider margins) | 16–20px |
| Card padding | **20px**, 16px under `sm` |
| Between sibling cards | 16px |
| Between page sections (e.g. top row → results) | 32px |
| Section label above a card stack | 24px row + 12px gap, inset 4px from the card edge |
| Adjacent bordered controls | 8–12px |

**Rules:**
- **Gaps:** the gap between groups is always at least 2× the gap within one.
- **Shared tops:** side-by-side columns start with the same `SectionLabel` row, so their cards share a top edge.
- **Equal rows:** cards in one row stretch to equal height, and their footer rows pin to the bottom so they share a baseline.
- **Direction:** all horizontal spacing uses logical properties (`ps/pe/ms/me`, `text-end`).
- **Optical alignment:** buttons with a leading or trailing icon take 2px less padding on the icon side.

### Radii (concentric)
`card 20px` → inner panels `12px` → chips `8px`. Each outer radius equals the inner radius plus the padding between them.

These nested surfaces follow the rule:

| Surface | Outer | Padding | Inner |
| --- | --- | --- | --- |
| Brush dock | 14 | 4 | 10 |
| Segmented control | 12 | 4 | 8 |
| Rank ladder | 14 | 6 | 8 |
| Invitee field | 14 | 6 | 8 |
| Share-link panel | 18 | 10 | 8 |
| Dialog (an 8px frame) | 24 | 8 | 16 |
| Demo menu | 18 | 6 | 12 |
| Calendar menu | 14 | 4 | 10 |

### Depth
- `shadow-card`: 1px ring + 1px contact + soft 20px ambient. Every card uses it.
- `shadow-raised`: active brush pill, hovered option card, pointer chip.
- `shadow-pop`: popovers, dialogs, toasts.
- `shadow-ink`: inset top highlight + 1px black ring on primary buttons.

### Type
Inter Variable with the optical-size axis (`font-optical-sizing: auto`, so large sizes pick up the Display cut). Features: `cv11` (single-storey a), `ss03`.

| Step | Size / line | Use |
| --- | --- | --- |
| 2xs | 11/14 | Eyebrows (uppercase, +0.06em) |
| xs | 12/16 | Meta |
| sm | 13/18 | Secondary text |
| base | 14/20 | Body |
| md | 16/24 | Card titles |
| lg | 20/26 | Section titles, times on cards |
| xl | 28/32 | Page titles, the #1 time |
| 2xl | 44/46 | Ticket date |

Headings use −0.02em tracking and `text-wrap: balance`, and paragraphs use `text-wrap: pretty`. **Every time, count and score uses `tabular-nums`.**

---

## 3. Motion

Motion is used where it explains something, and kept out of the way everywhere else.

| Token | Value |
| --- | --- |
| `ease-out` | `cubic-bezier(.23, 1, .32, 1)` (entrances, presses) |
| `ease-in-out` | `cubic-bezier(.77, 0, .175, 1)` (on-screen movement) |
| `ease-drawer` | `cubic-bezier(.32, .72, 0, 1)` |
| UI durations | 120 / 180 / 240 ms |
| Spring | `{ duration: .35–.45, bounce: .15 }`; playful moments go up to `.55` bounce |

**Rules:**
- Animate only `transform` and `opacity`. The one exception is height on disclosures.
- Presses scale to `0.97`. Nothing enters from `scale(0)`; entrances start at 0.9–0.96 with opacity.
- Popovers grow from their trigger (`--transform-origin`). Modals stay centered.
- Exits are faster than entrances (≈120–150 ms vs 200–320 ms).
- Hover effects only under `(hover: hover) and (pointer: fine)`.
- **Frequency rule:** anything used constantly doesn't animate. That covers the demo-dock role switch, the heatmap hover window and keyboard grid navigation.
- `prefers-reduced-motion`: `MotionConfig reducedMotion="user"` drops transform motion, CSS keyframes collapse to 1 ms, and the celebration is skipped. The confirmed state is still distinct because of its layout.

**Signature moments:**

| Moment | Motion | Why |
| --- | --- | --- |
| Switching brush | Spring-sliding pill + swatch wobble | Makes the active mode unmistakable |
| Painting | New blocks scale in from .94; a stroke label follows the pointer | Immediate feedback + exact range readout |
| Option card ↔ heatmap | Hovering a card glides a highlight to that window (shared `layoutId`) | Links the explanation to the evidence |
| "Why this rank" | Ladder expands; the deciding step is lifted and inked | Transparent ranking (PRD Feature 2) |
| Confirm | The chosen card morphs into the ticket; stamp lands; small tile burst | Closes the loop; rare, so it earns delight |
| Copy | Label crossfades to ✓ through a 2px blur | Reads as one morphing control |

---

## 4. Components

- **Card / Eyebrow / Divider**: the bento grammar.
- **Button** (`cva`): `primary` (ink), `secondary` (white + hairline), `ghost`, `accent`, `danger`; sizes `sm`/`md`/`lg`/`icon`.
- **SegmentedControl**: radiogroup with arrow-key support and a spring pill.
- **Avatar**: DiceBear *notionists* on pastel grounds. The ring and badge encode state by shape.
- **BrushDock**: three "paint pots" (Preferred, Works, Erase) plus undo. Keys 1/2/3, ⌘/Ctrl+Z.
- **AvailabilityPainter**: the grid of 30-min cells.
  - Drag paints a rectangle. Starting on an already-painted cell erases.
  - Contiguous runs render as merged blocks with their time range.
  - Non-drag alternatives: tap a cell, tap a day header to fill the column, or use the keyboard (arrows, Space, Shift+arrows).
- **GroupHeatmap**: attendance or preference ramp.
  - Hovering shows a duration-length window and a who-can-come popover.
  - Rank pins mark recommended windows; a roster lets you isolate one person; clicking a window chooses it.
- **RecommendationCard**: rank, time, attendance ring, ★/✓/✕ counts, per-person state avatars, the PRD reason line, the "Why this rank" ladder, and *Choose this time*.
- **StatusStrip**: segmented progress, pending avatars "breathe", and *Copy reminder*. CommonTime never sends messages itself.
- **ConfirmDialog**: attendance grouped by state, plus an amber warning naming who can't come or hasn't responded.
- **ConfirmedTicket**: ink header, perforation notches, the stamp, and *Add to calendar* (.ics / Google).
- **DemoDock**: dark glass pill. It's demo chrome, deliberately styled unlike the product UI.

---

## 5. Copy voice

Plain, warm and specific. Name people instead of using counts when it matters ("Jordan can't make it"). Never say "Best time" for an option that leaves someone out without explaining why. Show ties as ties ("We won't pick a winner for you").
