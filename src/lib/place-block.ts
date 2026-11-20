// Safe to edit by hand
// The header's small place block (Header.astro, DESIGN.md "Header, the boutique bar"):
//
//   Cincinnati
//   West Chester, Ohio
//
// Derived, never typed into a component (rule 15, card 196): the lines are Business info's
// service areas, and the last one carries the state, spelled out, from Business info's
// address. With no service areas it falls back to the address's own town. Empty when
// neither is set, and the header then draws no block.

const STATES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District of Columbia',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
};

/** Placeholder values the starter ships with; they never reach a visitor. */
const PLACEHOLDERS = new Set(['your city', 'xx', 'your state', 'your region']);

const clean = (v: string | null | undefined): string => {
  const t = (v ?? '').trim();
  return PLACEHOLDERS.has(t.toLowerCase()) ? '' : t;
};

/** "OH" -> "Ohio"; a name already spelled out is kept as typed. */
export function stateName(state: string | null | undefined): string {
  const s = clean(state);
  return STATES[s.toUpperCase()] ?? s;
}

/**
 * The place block's lines: each service area on its own line, the state after the last.
 * Falls back to the address's town. At most three lines, so a long list of areas does not
 * turn the header into a column.
 */
export function placeBlockLines(input: {
  serviceAreas?: readonly (string | null)[] | null;
  city?: string | null;
  state?: string | null;
}): string[] {
  const areas = (input.serviceAreas ?? []).map((a) => clean(a)).filter(Boolean);
  const lines = (areas.length ? areas : [clean(input.city)].filter(Boolean)).slice(0, 3);
  if (!lines.length) return [];
  const state = stateName(input.state);
  if (state && !lines[lines.length - 1].toLowerCase().endsWith(state.toLowerCase())) {
    lines[lines.length - 1] = `${lines[lines.length - 1]}, ${state}`;
  }
  return lines;
}
