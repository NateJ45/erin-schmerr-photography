# Design directions: Tate Fine Art Photography, 2026-11-18

Four static mockups for the portfolio, each a home page plus one story page (A 1950s Halloween at
home), so the current look (Soft Focus Editorial) can be compared with genuinely different options
before any reskin. Nothing here touches `src/`, `brand/brand.config.json` or the dataset.

- Open `index.html` for the side-by-side comparison, or any `direction-*.html` directly.
- Photographs are hot-linked from the public Sanity CDN that the live site already uses; no image
  files are in this folder. They are her interim Instagram-sized copies.
- All visitor-facing copy is a draft in her voice (from the voice guide and her published lines).
  Facts are the dataset's: titles, deks, dates, places, credits and publications. Lines marked as
  quotes are her own words from captions and interviews.
- Light only (CLAUDE.md rule 3). Scrolling is native everywhere (rule 5); every effect has a
  reduced-motion and a touch or no-JS fallback, and nothing in the first viewport starts hidden.
- Screenshots: `shots/<file>-<390|768|1280>.png`, from `npm run directions:shoot`. They are
  NOT committed (`.gitignore` here): every shot contains her photographs, and her images never go
  in this public repo. Run the command once to see them in `index.html`. The screenshot
  browser gets each page in its settled state (B's wipe-ins already open, C's photos already
  developed), because a full-page capture cannot scroll them into view.

## Decision

Waiting on Nathan's pick.

## Must not look like

The current site: Instrument Serif and Sans, warm paper with a Dusk accent, a full-bleed crossfading
cover hero with heading, subhead and two buttons. None of the four directions uses Instrument, a
full-bleed hero, or the hero, stories grid, marquee, intro, tear sheets, booking band order.

## Archetypes and forced divergence

| Axis              | A. The Contact Sheet                                     | B. The Feature                                       | C. Chapters by Decade                                       | D. The Album                                             |
| ----------------- | -------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| Archetype         | Index / directory                                        | Editorial / magazine                                 | Story / scroll chapter                                      | Split-screen                                             |
| Layout structure  | 4/8 split head, then full-width roll rows and tables     | 12-column asymmetric magazine grid, centred cover    | One narrow column beside a fixed rail                       | Two halves: sticky print left, pages scroll right        |
| Nav pattern       | No nav bar: the index table is the hero, film-edge strip | Centred nameplate with a ruled section row           | Side rail of chapters with a progress line                  | One "Contents" button opening an overlay sheet           |
| Hero structure    | List (all 16 stories, filterable)                        | Magazine cover: portrait with coverlines either side | Type only: a framed silent-film intertitle                  | Split: mounted print beside the headline                 |
| Type pairing      | Archivo condensed + Archivo (grotesque, width axis)      | Bodoni Moda + Libre Franklin (didone + grotesque)    | Cormorant Garamond + Jost (old-style + geometric)           | Libre Caslon + Courier Prime (transitional + typewriter) |
| Density           | Dense: 16 rows and 24 frames on two screens              | Medium-dense: 6 sections, short blocks               | Airy: one idea per screen, 8 sections                       | Medium-airy: one story per screen                        |
| Imagery treatment | Small frames on film strips, grease-pencil picks         | Cover crop with type around it; mixed column spans   | Single large plates that develop from sepia to colour       | Prints mounted on cream with black photo corners         |
| Colour role       | Cool white, black film, one red pencil accent            | Cream with three spot colours (red, teal, mustard)   | Bone and brown ink only; photos are the only colour         | Sage album card, cream mounts, no accent                 |
| Motion            | Grease-pencil circle draws on; loupe follows the pointer | Pictures wipe in from the gutter                     | Photos develop as they reach mid-screen (CSS scroll-driven) | The left print cross-dissolves as pages turn             |

## The directions

### A. The Contact Sheet (`direction-a.html`, `direction-a-story.html`)

Her whole archive on one page, the way a photographer actually looks at work: an index of all 16
rolls you can filter by decade, Halloween, "from a book or film" or published, then contact strips
with her pick circled in red grease pencil. The story page is the full sheet of frames with a loupe
that enlarges whatever you point at, the cast as a data table, and the four prints she chose.

- **Bet:** visitors who arrive from a credit want to scan everything she has made, fast, and judge
  the eye by the edit.
- **Rejects:** no hero image, no slideshow, no big serif, no card grid.
- **Costs:** dense on a phone; needs six good frames per story; reads more like an archive than a
  feeling.

### B. The Feature (`direction-b.html`, `direction-b-story.html`)

The site as a magazine issue. A huge Bodoni nameplate, a cover portrait with coverlines in spot
colours ("A 1950s Halloween at home", "How to book a session, page 12"), a ruled contents page with
page numbers, a feature spread with a drop cap and her pull quote, the magazines she has been in as
one big wall of names, and sessions as a boxed classified. The story page is a feature spread: title
over the picture's top edge, the cast in a masthead box, two-column text, pictures in mixed spans.

- **Bet:** her work already lives in magazines; a site set like an issue makes the press and the
  stories feel like one thing.
- **Rejects:** no full-bleed hero, no single accent colour, no quiet minimal grid.
- **Costs:** needs a cover picked and coverlines written for each "issue"; spot colours can fight
  some pictures; more copy to keep fresh.

### C. Chapters by Decade (`direction-c.html`, `direction-c-story.html`)

The work told the way she thinks about it: by era. A silent-film title card opens ("Portraits from
other decades"), then chapters: a prologue (dad's camera), the 1950s, 1960s, 1970s, "From the page"
(Shakespeare, Washington Irving, Annie Oakley) and "Halloween, all year", then notices from the press
like a theatre programme and an epilogue, "Your chapter". A side rail tracks the chapter. Photos come
up sepia and develop into colour as they reach the middle of the screen. The story page is scenes,
one per character, closing on end credits: "Starring Elvis, Pierrot, the devil, the beauty queen".

- **Bet:** she thinks in decades and stories, so the site should too; a visitor finds their era first
  and the photographer second.
- **Rejects:** no grid of thumbnails, no top nav bar, no accent colour.
- **Costs:** a long scroll before press and booking; each new story needs a home in a chapter; the
  rail becomes a tab row on phones.

### D. The Album (`direction-d.html`, `direction-d-story.html`)

"Found in an old album", said literally. Prints mounted on cream with black photo corners on a sage
album card, typewritten labels, and a split screen: the print stays put on the left while the album
pages turn on the right, and the print changes with the page. The story page keeps the big print on
the left and lays the rest out as small mounted prints with typed captions; choosing one mounts it
large. Credits are typed on a ruled index card.

- **Bet:** the album is the brand; one print at a time, and a visitor slows down to match.
- **Rejects:** no grid, no thumbnails, no colour accent, no nav links in a bar.
- **Costs:** the split collapses to a plain stack on phones; few stories fit on the home page; photo
  corners are a strong prop that could tire.

## Recommendation

**C, Chapters by Decade,** with two borrowings. It is the furthest from the current site and the
closest to how she describes her own work (by decade, by story, by film), it gives Halloween its own
chapter, and its one effect, photos developing from sepia, is the "dad's old camera" idea made
visible without a shader. Take B's "As seen in" wall of magazine names for the press section (it
reads louder and prouder than C's programme notices), and keep A's filterable index as the
`/stories/` archive page, where density is a feature. B is the runner-up if Nathan wants the press
front and centre; it is the most fun of the four but asks for the most upkeep. The pick is Nathan's.

## Trade-offs at a glance

| Direction | Phone        | Upkeep for Erin             | New story lands as     | Press visibility |
| --------- | ------------ | --------------------------- | ---------------------- | ---------------- |
| A         | Dense, works | Low (needs 6 frames)        | A row and a strip      | Medium (ledger)  |
| B         | Good         | High (cover and coverlines) | A contents line        | High             |
| C         | Good         | Medium (pick a chapter)     | A plate in its chapter | Medium           |
| D         | Plain stack  | Low                         | A page with one print  | Low              |

## References

Gathered on 2026-11-18 with the `awwwards` MCP (site search, details, elements, page structure,
motion DNA and one motion recording) and the `madegooddesigns` MCP (design inspiration and
public-domain museum art; cite [madegooddesigns.com](https://madegooddesigns.com/inspiration/)).
References are for inspiration only; no layout or asset is copied.

| #   | Reference                                                                                                                                           | Source                                                   | What to take                                                                                                                                                                 | Motion                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | [Julie Cate Christman](https://www.juliecate.com)                                                                                                   | awwwards nominee                                         | A notes column of plain prose beside a single photo; "switch to gallery view" as a quiet toggle (C and D story pages)                                                        | Lenis smooth scroll only; no triggers. We keep native scroll                                     |
| 2   | [ViV MGMT](https://vivmgmt.com/)                                                                                                                    | awwwards SOTD, Nov 2026                                  | Serif artist name with a count ("(184) All"), a filter, a grid and list toggle, a roster overlay that reveals a picture on hover (A's index and filters, D's Contents sheet) | Hover image reveal in the roster                                                                 |
| 3   | [Gavin Schneider Productions](https://www.gsproductions.co.za/)                                                                                     | awwwards SOTD, Mar 2026                                  | Project meta in columns (Client, Photographer), a list or grid switch, a percentage progress line (A's roll meta, C's scene counter)                                         | Preloader and page transitions; we skip both                                                     |
| 4   | [TERAKAWA Photo Office](https://www.terakawaoffice.com/en/)                                                                                         | awwwards nominee                                         | Field notes with a time-of-day rail down the left edge (C's chapter rail)                                                                                                    | Recorded: the hero photo breaks into a WebGL particle field. A clear anti-reference for her work |
| 5   | [Ruth Griffioen](https://ruthgriffioen.art/)                                                                                                        | awwwards nominee                                         | A flowing wall of work with very quiet type; the archive as a place, not a page                                                                                              | WebGL, slow 2.8s keyframes, no scroll triggers                                                   |
| 6   | [Weiss & Lameraner](https://www.weisslameraner.com/en)                                                                                              | awwwards                                                 | Stacked nameplate with weight contrast (B's nameplate)                                                                                                                       | None of note                                                                                     |
| 7   | [Gianluca Gradogna](https://gianlucagradogna.com/)                                                                                                  | awwwards SOTD                                            | Two panels side by side, a card on one and a photograph on the other (D's split)                                                                                             | Panel slides                                                                                     |
| 8   | [PSP Production](https://productionportugal.com/)                                                                                                   | awwwards SOTD                                            | Anti-reference: type laid over a full-bleed picture, which the current site already does                                                                                     | Bracketed nav labels                                                                             |
| 9   | Magazine Covers; Fashion Magazine Cover                                                                                                             | madegooddesigns, editorial and vintage themes            | Coverline hierarchy: kicker, then a short serif line, several per side (B)                                                                                                   | n/a                                                                                              |
| 10  | Postered (1950s and 60s Italian posters)                                                                                                            | madegooddesigns, vintage                                 | Earthy palette with serif and sans mixed; a basis for B's spot colours                                                                                                       | n/a                                                                                              |
| 11  | Type Specimen Grid (a contact sheet)                                                                                                                | madegooddesigns, editorial                               | Rows of small proofs with a handwritten mark (A's contact strips and pencil circles)                                                                                         | n/a                                                                                              |
| 12  | [The Woman in White, W. H. Hooper, 1871](https://madegooddesigns.com/inspiration/museum/the-woman-in-white-1871-7f99d13ee1c3)                       | madegooddesigns museum art, The Met, CC0                 | A framed poster with lettering above and below the picture (C's title card)                                                                                                  | n/a                                                                                              |
| 13  | [Program for Théâtres l'Athénée, Henry Somm, 1881](https://madegooddesigns.com/inspiration/museum/program-for-th-atres-l-ath-n-e-1881-0b3eedd0cef6) | madegooddesigns museum art, National Gallery of Art, CC0 | A theatre programme: billing, cast, notices (C's end credits and press notices)                                                                                              | n/a                                                                                              |
| 14  | Vintage Camera Still Life (Polaroids on a sheet)                                                                                                    | madegooddesigns, vintage                                 | Prints as objects on a surface (D's mounted prints)                                                                                                                          | n/a                                                                                              |
| 15  | Film Box Collection                                                                                                                                 | madegooddesigns, retro                                   | Film-stock lettering and amber on black (A's film-edge strip)                                                                                                                | n/a                                                                                              |

Font pairings were checked against madegooddesigns' pairing data (Bodoni-class didone with an
American grotesque; a typewriter mono beside a book serif).
