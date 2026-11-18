---
name: Erin Schmerr Photography, Soft Focus Editorial
description: Warm paper, a big editorial serif, almost no chrome; photos resolve from blur into focus.
colors:
  paper: '#F3EEE7'
  paper-soft: '#EAE3D9'
  ink: '#1F1B18'
  muted-text: '#5C534B'
  dusk: '#7A4A40'
  divider: '#D9CFC2'
  dark-ground: '#12100E'
  dark-card: '#1C1916'
  dark-ink: '#EEE7DD'
  dark-muted: '#A99F94'
  dark-dusk: '#D6A898'
typography:
  display:
    fontFamily: 'Instrument Serif, Georgia, Times New Roman, serif'
    fontSize: 'clamp(3rem, 9vw, 8.5rem)'
  body:
    fontFamily: 'Instrument Sans Variable, system-ui, sans-serif'
rounded:
  base: '0'
components:
  button-primary:
    backgroundColor: '{colors.dusk}'
    textColor: '{colors.paper}'
    rounded: '{rounded.base}'
    height: '44px'
---

# Design System: Soft Focus Editorial

Direction chosen 2026-11-17 for the build on placeholder content. Two answers from the client can still move it: the brand name (wordmark only) and whether she prefers a dark site (both themes ship, so that is a default swap). The CSS wins if this file and the code disagree: tokens live in `brand/brand.config.json`, written into `src/styles/globals.css` by `npm run apply-brand`; the site's own layer is `src/styles/erin.css`.

## 1. Overview

**Creative North Star: everything comes into focus.** A fine-art portrait portfolio that feels like a printed art book: warm paper, a large editorial serif, photos given room, and motion that behaves like a lens pulling focus.

- **Light is the default, dark ships too** (rule 3). Dark is a deep warm black, not grey, so prints read like a gallery wall.
- **No polish-layer chrome.** No brand stripe, no card lift, no tinted bands around photos. Sections separate by space and hairline rules.
- **Square corners.** Radius 0 on photos, buttons and fields.
- **One left edge, one row of chrome** (2026-11-17). The header has no eyebrow strip (its tagline already sits in the hero and the footer); the theme toggle lives in the nav row, and the row uses the page gutter so the wordmark lines up with every heading below it. Content bands all sit on paper: the starter's paper-soft cadence, sunburst ornaments and testimonial glow are switched off in `src/styles/erin.css`, and sections part with a content-width hairline. The footer defaults to the compact style (brand row on top, left-aligned at every width); an editor's choice in Site settings still wins.

## 2. Colors

| Role                                  | Light           | Dark                 | Contrast on ground |
| ------------------------------------- | --------------- | -------------------- | ------------------ |
| Ground                                | Paper `#F3EEE7` | `#12100E`            |                    |
| Soft band                             | `#EAE3D9`       | `#1C1916`            |                    |
| Text                                  | Ink `#1F1B18`   | `#EEE7DD`            | 14.8 / 15.5        |
| Muted text                            | `#5C534B`       | `#A99F94`            | 5.7 / 7.3          |
| Accent (links, the one filled button) | Dusk `#7A4A40`  | `#D6A898`            | 6.3 / 9.0          |
| Hairline                              | `#D9CFC2`       | `oklch(1 0 0 / 12%)` | decorative         |

Dusk is the only colour. It is used for links, the inquiry button and text selection, never as a section background.

## 3. Typography

- **Display: Instrument Serif** (400, roman and italic). Story titles and page heads run very large and tight (`leading 0.95`, slight negative tracking). Italic carries emphasis inside titles.
- **Body and UI: Instrument Sans Variable.** Credits, captions and the nav set small, uppercase, tracked (0.14em) so they read like a magazine masthead.
- Numbers in credits and EXIF use tabular figures.

## 4. Elevation

Flat. Nothing floats except the lightbox and the phone menu. Depth comes from photos, not shadows.

## 5. Components

- **Focus image** (`FocusImage.astro`): every photo renders over its own LQIP blur and resolves to sharp as it loads and enters view. Reduced motion shows it sharp at once.
- **Credit block** (`CreditBlock.astro`): a two-column definition list (role, then linked name), set like a magazine credit.
- **Story index** (`StoryIndex.astro`): selected stories as a grid or a list, with a toggle; in list view, hovering a title reveals its cover.
- **Published marquee** (`PublishedMarquee.astro`): "As published in" on the left and the magazine names in one line beside it (stacked on phones). From four names up it scrolls slowly (at least 40s a lap), pausing on hover, keyboard focus and its Pause button; fewer names, JS off or reduced motion keep the still line.
- **Tear-sheet stack** (`TearSheetStack.astro`): the newest tear sheets fanned and overlapping like prints on a table, with the list of features beside them; pointing at a feature or a sheet lifts that sheet. Reduced motion keeps the overlap and drops the turn and lift.
- **Press page** (`src/pages/press.astro`): an index by year. The year sits in a left rail that stays in view (from 1024 up) while its features pass; each feature is a row with its tear sheet, issue and date, the magazine large, the excerpt and a "Read the feature" link.
- **Story page** (`src/pages/stories/[slug].astro`): a magazine feature. The opener sets a portrait cover beside the title, short line, place and date, credits and "Published in" (a landscape cover runs full bleed above them). The sequence comes from `storySequence()` in `src/lib/portfolio.ts`: a landscape runs wide, two portraits in a row sit side by side, a lone portrait is set off to one side, alternating. It closes on "Next story" with its cover (the first story follows the last).
- **Archive canvas** (`ArchiveCanvas.astro`): every photo on a draggable canvas; a plain grid on touch and under reduced motion.
- **Buttons:** one family (rule 17). Text links with an underline that draws in; the single filled Dusk button is the inquiry.

## 6. Do's and Don'ts

Motion: slow optical easing `cubic-bezier(0.22, 1, 0.36, 1)`, 700 to 1200ms for focus pulls, 300ms for UI. Scrolling stays native (rule 5). Every effect has a reduced-motion and a touch fallback, and hidden start states sit under `html.motion` so the page reads without JavaScript. The site plan's interactions live in `src/styles/erin-motion.css`: a first-visit loader (`FirstVisitLoader.astro`: the name pulls into focus and the curtain lifts in 1.1s, once per device, never under reduced motion or with storage blocked; it hides nothing underneath), a variable-weight nav hover (Instrument Sans thickens, with the bold width reserved so nothing moves; hover pointers only) and a slow drift of story photos inside their frames (CSS scroll-driven; still on touch, under reduced motion and where unsupported).

**Do**

- Let photos run full bleed or with generous margins; keep captions small.
- Credit every person on a story, linked where they have a page.
- Use placeholder images that read as placeholders until originals arrive.

**Don't**

- Don't frame photos in cards, shadows or rounded corners.
- Don't use a script font, blush pink, or wedding-template copy.
- Don't distort photos with shaders beyond the hero's one focus effect.
- Don't write an em-dash in public copy.
