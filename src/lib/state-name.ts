// Safe to edit by hand
// A US state's full name from the two-letter code Business info stores ("OH" -> "Ohio"),
// so a component can say "Ohio" without anyone typing it (rule 15: derived, not stored).
// A name already written out comes back as it is; anything unknown comes back empty, so
// the caller simply draws nothing.

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
const NAMES = new Set(Object.values(STATES).map((n) => n.toLowerCase()));

/** "OH" -> "Ohio", "ohio" -> "Ohio", "Ohio" -> "Ohio", "XX" or empty -> "". */
export function stateName(state: string | null | undefined): string {
  const t = (state ?? '').trim();
  if (!t) return '';
  const byCode = STATES[t.toUpperCase()];
  if (byCode) return byCode;
  if (NAMES.has(t.toLowerCase())) {
    return Object.values(STATES).find((n) => n.toLowerCase() === t.toLowerCase()) ?? '';
  }
  return '';
}
