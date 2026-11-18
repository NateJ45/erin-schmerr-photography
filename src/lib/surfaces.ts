// Safe to edit by hand
// =============================================================================
// Section surfaces: the designed background + ink pairs (PORTS.md card 26)
// =============================================================================
// ONE source of truth for what each of this template's section surfaces IS.
// Read by two places that must never drift:
//
//   1. the section components, which name a surface and get its classes,
//   2. src/lib/surfaces.test.ts - the CONTRAST GATE. It resolves every `tokens`
//      entry against the real declarations in src/styles/globals.css, measures
//      each pair in BOTH themes, and fails below WCAG AA.
//
// A surface is a PAIR, designed as one unit: a background plus the foreground
// treatment that belongs on it. `background` and `muted` are the two the
// alternating cadence assigns (src/lib/sectionCadence.ts); `card` is the raised
// surface the card grids paint; `ink` is the closing CTA band, which is the
// same near-black slab on a light or a dark page.
//
// WHAT THIS FILE DELIBERATELY IS NOT
// It is NOT an editor-facing control, and there is no `tone` field on any block
// schema. That is this template's oldest architecture rule (CLAUDE.md #9:
// "Blocks carry no surface/color field. The alternating-surface logic lives in
// src/lib/sectionCadence.ts. Do not add color fields to block schemas."), and
// it exists so that reordering a page can never break the page rhythm. The
// sibling site repos DO expose a surface swatch, because their sections carry a
// per-section `background` object and no cadence to protect. Here the cadence
// picks; this file only says what the cadence is picking BETWEEN, and holds the
// pairs to AA while it does. Since 2026-10-18 an editor can ASK for a band with
// a block's `look` (src/lib/section-looks.ts, rule 9 as amended): a short
// enum of designed looks, resolved by the cadence into one of the pairs below.
// Still no colour picker and still no `tone` field. For the same reason there is no accent map here:
// an accent choice needs a shared section shell to hang a class on, and this
// template has none - every section paints its own <section>.
//
// A fork that runs `npm run apply-brand` swaps the palette in globals.css. The
// gate below is what tells it whether the swap broke a pair.
// =============================================================================

/** The surface names the components and the cadence already use. */
export type SurfaceValue = 'background' | 'muted' | 'card' | 'ink' | 'feature';

/**
 * The surfaces a CONTENT block can be handed by src/lib/sectionCadence.ts:
 * the two the alternating cadence assigns, plus the ones an editor's `look`
 * can ask for (src/lib/section-looks.ts).
 */
export type CadenceSurface = 'background' | 'muted' | 'feature';

export interface SurfacePair {
  value: SurfaceValue;
  /** Plain-language name, for docs and failure messages. */
  title: string;
  /** One line on when this surface is the right one. */
  hint: string;
  /** The classes a section carrying this surface puts on its own element. */
  className: string;
  /** Light-theme background, as a literal. Pinned to the token by the gate. */
  dot: string;
  /** Dark-theme background, as a literal. Equal to `dot` on a fixed band. */
  dotDark: string;
  /** Literal ink that sits on this background in the light theme. */
  dotInk: string;
  /** The custom properties this surface resolves to, by role. */
  tokens: {
    bg: string;
    text: string;
    heading: string;
    link: string;
  };
  /** True when the band is the same colour in both themes. */
  themeStatic?: boolean;
  /**
   * The custom property the focus ring takes inside a DARK band, when the band re-points it
   * (globals.css). The gate holds it to 3:1 against `tokens.bg` in both themes. Unset on
   * the light surfaces, which keep the page ring.
   */
  ring?: string;
  /** True when src/lib/sectionCadence.ts can assign this surface to a section. */
  inCadence?: boolean;
  /**
   * The token the accent word inside a heading reads on this band, when the
   * band sets its own (`--section-accent` in globals.css). Unset means the
   * shared HEADING_ACCENT rules below. The gate measures whichever applies.
   */
  accentToken?: string;
}

export const SECTION_SURFACES: SurfacePair[] = [
  {
    value: 'background',
    title: 'Paper',
    hint: 'The ordinary page surface. Every other surface is a step away from it.',
    className: 'bg-background',
    dot: '#F3EEE7',
    dotDark: '#12100E',
    dotInk: '#1F1B18',
    inCadence: true,
    tokens: { bg: '--background', text: '--foreground', heading: '--foreground', link: '--link' },
  },
  {
    value: 'muted',
    title: 'Soft paper',
    hint: 'The alternating band. The cadence puts it between two Paper sections.',
    className: 'bg-muted',
    dot: '#EAE3D9',
    dotDark: '#1C1916',
    dotInk: '#1F1B18',
    inCadence: true,
    tokens: { bg: '--muted', text: '--foreground', heading: '--foreground', link: '--link' },
  },
  {
    value: 'card',
    title: 'Card',
    hint: 'The raised surface inside a grid. Never a whole band on its own.',
    className: 'bg-card',
    dot: '#F7F3EE',
    dotDark: '#1C1916',
    dotInk: '#1F1B18',
    tokens: {
      bg: '--card',
      text: '--card-foreground',
      heading: '--card-foreground',
      link: '--link',
    },
  },
  {
    value: 'ink',
    title: 'Ink',
    hint: 'The closing CTA band. The same near-black on a light or a dark page.',
    className: 'bg-accent-dark text-bg',
    dot: '#12100E',
    dotDark: '#12100E',
    dotInk: '#F3EEE7',
    themeStatic: true,
    ring: '--color-bg',
    tokens: {
      bg: '--color-accent-dark',
      text: '--color-bg',
      heading: '--color-bg',
      link: '--color-bg',
    },
  },
  // The Feature look (2026-10-18, src/lib/section-looks.ts). A THEME-STATIC band like Ink, but built from the brand's deep
  // primary instead of near-black, so it reads as "this matters" rather than as
  // the closing call to action. Every value is a brand token, so `npm run
  // apply-brand` moves it with the palette and the gate re-measures it.
  //
  // `.surface-feature` in globals.css re-points the page tokens (--background,
  // --foreground, --link, --muted-foreground, --primary, --border, ...) INSIDE the
  // band, so a section component paints it with no component-level dark styles.
  {
    value: 'feature',
    title: 'Feature',
    hint: 'The deep brand band an editor can ask for with the Feature look. Light text.',
    className: 'surface-feature',
    dot: '#633A31',
    dotDark: '#633A31',
    dotInk: '#F3EEE7',
    themeStatic: true,
    inCadence: true,
    ring: '--feature-foreground',
    accentToken: '--feature-accent',
    tokens: {
      bg: '--feature',
      text: '--feature-foreground',
      heading: '--feature-foreground',
      link: '--feature-link',
    },
  },
];

export const SURFACE_BY_VALUE: Record<string, SurfacePair> = Object.fromEntries(
  SECTION_SURFACES.map((s) => [s.value, s]),
);

/**
 * The class list for one surface name.
 *
 * Unknown or unset resolves to `background`, which is what a section with no
 * cadence assignment already renders.
 */
export function surfaceClass(value?: string | null): string {
  return (SURFACE_BY_VALUE[String(value ?? '')] ?? SURFACE_BY_VALUE.background).className;
}

/**
 * The accent colour for one word inside a heading (the colour sibling of the
 * script accent in src/lib/scriptAccent.ts).
 *
 * There is deliberately no CHOICE here: the editor picks a word, never a
 * colour, so this is one token and one pinned literal for the fixed dark band.
 * `.heading-accent` in globals.css is the other half; the gate measures both.
 */
export const HEADING_ACCENT = {
  /** Theme-aware token the accent word reads on the theme-following surfaces. */
  token: '--primary',
  /** Literal light/dark values of `token`, asserted against globals.css. */
  light: '#7A4A40',
  dark: '#D6A898',
  /** Pinned colour on the fixed ink band, where a theme-aware token would flip. */
  onDarkBand: '#D6A898',
} as const;
