// Safe to edit by hand
// The brand colours and display font for the generated share images (og-default.png and the
// per-page cards). scripts/lib/render-og.mjs is PORTABLE, so a fork's brand goes in through its
// `theme` option from here, never edited into render-og's DEFAULTS (that reports DRIFT in
// sync-check). `npm run apply-brand` rewrites the values below from brand/brand.config.json by
// regex: keep the two-space indent and single quotes, or a rebrand fails on this file.
export const OG_THEME = {
  bg: '#F3EEE7', // --background (light)
  primary: '#7A4A40', // --color-primary
  primaryDark: '#633A31', // --color-primary-dark
  accent: '#1F1B18', // --color-accent
  taupe: '#B9A999', // --color-secondary
  fontDisplay: 'Instrument Serif, Georgia, Cambria, Times New Roman, serif',
};
