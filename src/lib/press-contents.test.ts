// scaffold-file: press
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { contentsEntries } from './press-contents.ts';
import type { Publication } from './pressQueries.ts';

const pub = (magazine: string, date: string | null, issue?: string): Publication => ({
  _id: `${magazine}-${date}`,
  magazine,
  date,
  issue,
});

describe('contentsEntries', () => {
  it('lists each magazine once, newest feature first', () => {
    const rows = contentsEntries([
      pub('BleachFilm', '2025-07-19', 'Pink'),
      pub('PhotoVogue', '2024-08-05'),
      pub('PhotoVogue', '2023-09-12', 'Plastic'),
      pub('Elysium', '2023-09-13'),
    ]);
    assert.deepEqual(
      rows.map((r) => [r.magazine, r.count, r.latest.date]),
      [
        ['BleachFilm', 1, '2025-07-19'],
        ['PhotoVogue', 2, '2024-08-05'],
        ['Elysium', 1, '2023-09-13'],
      ],
    );
  });
  it('links to that year on the press page, undated last', () => {
    const [dated, undated] = contentsEntries([pub('A', '2023-01-01'), pub('B', null)]);
    assert.equal(dated.href, '/press/#press-2023');
    assert.equal(undated.href, '/press/#press-undated');
  });
  it('skips a feature with no magazine name', () => {
    assert.equal(contentsEntries([pub('  ', '2023-01-01')]).length, 0);
  });
});
