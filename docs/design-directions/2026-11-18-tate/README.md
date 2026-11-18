# Design directions: Tate Fine Art Photography, 2026-11-18

Static mockups for the portfolio in two rounds (A to D, then the photo-first, motion-led E to H), each a home page plus one story page (A 1950s Halloween at
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
- Screenshots (`shots/`) and motion captures (`captures/`) are NOT committed (`.gitignore` here):
  every one contains her photographs, and her images never go in this public repo. Run
  `npm run directions:shoot -- docs/design-directions/2026-11-18-tate` to make the stills.

## Decision

Waiting on Nathan's pick.

## Round two (E to H): photo-first, motion-led

Nathan's note on A to D: interesting, but he wants full-page, motion-led showcases where her
photographs are the page. A to D stay below for the record. E to H are all full-bleed, keep type
and chrome to a line or two on paper chips, and make the motion the main event.

- Every motion runs in a browser. Captures of each home page (and the E and G story pages) are in
  `captures/*.mp4`, made with Playwright and kept local like the shots (gitignored: they contain
  her photographs).
- **G needs a server.** The Sanity CDN only sends CORS headers to the project's allowed origins
  (`localhost:4321` and the workers.dev address), and WebGL cannot read a photo without them. Run
  `node serve.mjs` in this folder (no dependencies) and open `http://localhost:4321/`. Opened as a
  plain file, G falls back to its still images. At cutover the real domain joins the CORS list.
- Every direction keeps native scrolling. Scroll effects are CSS scroll-driven animations
  (`animation-timeline: view()`) with a small rAF fallback where needed, never a scroll-hijack
  library. Reduced motion shows the photographs still; touch gets a lighter version (noted per
  direction); without JS every page is a plain run of full-bleed photos.
- The still shots show each page settled (the screenshot browser is detected and skips motion), so
  judge the motion from the captures or the live pages.

### Measured references (awwwards MCP)

| #   | Reference                                                                               | What was measured                                                                                                                                                                                              | What to take                                                                                                               |
| --- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| R1  | [Almira Kho](https://almirakho.com/) (Honorable Mention, Sep 2026)                      | `record_site_motion`, `analyze_scroll_map`, `get_motion_dna`: Lenis, no scroll triggers, document height 900px (the desktop scroll is taken over)                                                              | A portrait shown whole over a blurred enlargement of itself; the works list laid over a soft photo (E, H)                  |
| R2  | [HOLMCHROME](https://holmchrome.byholm.co/) (Honorable Mention, Oct 2026)               | `record_site_motion` (aperture-iris preloader), `analyze_scroll_map` (a canvas app with no document scroll), site elements (film-strip ribbon, viewfinder hero, contact sheet)                                 | The iris opening (G), frame numbers and exposure labels (F)                                                                |
| R3  | [Jon McCormack](https://jonmccormack.com/) (nominee)                                    | `record_site_motion` (loading splash to a full-bleed landscape with one centred line), `analyze_page_structure` with mobile compare: one 900px screen on desktop, five stacked bands of about 497px on a phone | Full-bleed with one line of words; and the lesson that desktop scroll-jacking falls back to a plain stack on phones anyway |
| R4  | [Gallery Play](https://gallery-play.be/) (Honorable Mention)                            | `get_motion_dna`: GSAP ScrollTrigger, Lenis and WebGL; triggers at "top 80%"; durations p25 500ms, median 1000ms, p75 1300ms; ease `cubic-bezier(0, .33, .07, 1.03)`                                           | Reveal timing for captions and the iris range                                                                              |
| R5  | [MORROW](https://morrow.valerian.studio) (horizontal layout)                            | `record_site_motion` (9 keyframes), `get_motion_dna`: ease `cubic-bezier(.22, 1, .36, 1)`, median 1000ms                                                                                                       | Confirms the site's own easing curve and 1s reveals                                                                        |
| R6  | [Hearst Exhibit 2026](https://www.hollywoodexhibit2026.com) (Site of the Day, Aug 2026) | `record_site_motion`: a serif title card on black before the gallery                                                                                                                                           | Anti-reference: a dark preloader that hides the work                                                                       |
| R7  | [Ruth Griffioen](https://ruthgriffioen.art/) (round one)                                | `get_motion_dna`: WebGL, 2.8s keyframes                                                                                                                                                                        | The slow pace for G's 2.6s film-burn                                                                                       |

Three of the four strongest photographer sites take over the desktop scroll (their document is one
900px screen). None of these directions does; the same feel comes from sticky and scroll-driven
layers over native scrolling.

### The directions

#### E. Rack Focus (`direction-e.html`, `direction-e-story.html`)

Each story is one full-screen slide; the next slides up over it as you scroll and racks from soft to
sharp as it arrives. Portraits show whole over a blurred bleed of themselves, so nothing is cropped
on a wide screen. One line of type. The story page plays like a slideshow film: each frame pushes in
slowly and pulls into focus, captions sit like subtitles, segmented progress runs along the top,
with pause, arrows, keyboard and swipe, and the cast as end credits.

- **Bet:** one picture at a time, edge to edge, is how her work wants to be seen.
- **Motion:** CSS scroll-driven blur and scale (no library); 1.2s crossfades in the film.
- **Phone and LCP:** the first slide's image is preloaded and is the LCP. Touch drops the blur and
  keeps scale and fade. Seven full-screen images, so the real build lazy-loads all but the first.
- **Library:** none.

#### F. The Reel (`direction-f.html`, `direction-f-story.html`)

A full-bleed opening frame, then one long reel pinned to the screen: you scroll down and the frames
run sideways, each picture drifting inside its frame for depth, chapters (the 1950s, 1960s, 1970s,
from the page, Halloween) as single lines between frames, a progress rule along the bottom. The story
is the same reel at full height with a frame counter.

- **Bet:** a reel moving sideways feels like film through a camera, and every story gets full height.
- **Motion:** CSS scroll-driven translate (compositor-only, cheap); rAF fallback where unsupported.
- **Phone and LCP:** phones get a native swipe strip with snap instead of the pinned reel. LCP is the
  opening image. The twelve reel images load lazily in the real build.
- **Library:** none.

#### G. Darkroom (`direction-g.html`, `direction-g-story.html`)

A full-screen WebGL layer moves between her covers with a warm film-burn dissolve and a short rack of
lens blur, then each story below opens through an aperture (a clip-path iris) as it scrolls in. The
story page develops as you scroll: one fixed screen, each step burning the current print into the
next, scrubbed by the scroll so it runs backwards too.

- **Bet:** the change between two of her photographs can itself feel like a darkroom.
- **Motion:** a WebGL shader (noise-edged burn with a warm glow, a 5x5 blur during the change); a CSS
  scroll-driven iris.
- **Phone and LCP:** a real `<img>` is the LCP and stays until the first texture is ready; the canvas
  pauses off screen and caps pixel ratio at 1.5. Six 1600px textures is real GPU memory on a phone,
  so the build would use smaller textures there. Reduced motion: no canvas at all.
- **Library:** the mockup is hand-written WebGL (about 60 lines). The real build would keep it
  hand-written (no dependency) or use OGL (about 10 kB); pause for Nathan's OK before adding OGL. It
  also needs the production domain on the Sanity CORS list.

#### H. Depth of Field (`direction-h.html`, `direction-h-story.html`)

The first screen is a table of her prints at three depths: far ones small and soft, near ones large
and sharp. The pointer drifts the layers at different rates, and whatever you point at comes into
focus with its title. Below, each story is a full-bleed backdrop with a second print climbing over it
faster than the page. The story keeps the room behind you, softening, while the prints float up at
three speeds and sharpen as they reach the middle.

- **Bet:** her pictures feel like a dream half remembered; depth and focus say that without words.
- **Motion:** pointer-led transforms (1.2s ease), CSS scroll-driven parallax and focus.
- **Phone and LCP:** eleven small images on the first screen means more requests; LCP is the near
  Halloween print. Touch gets a slow automatic drift; the blur on far prints stays static.
- **Library:** none.

### Trade-offs, round two

| Direction | Feel                           | Phone                     | LCP risk          | Build cost | New dependency             |
| --------- | ------------------------------ | ------------------------- | ----------------- | ---------- | -------------------------- |
| E         | Calm, cinematic, one at a time | Good (lighter effect)     | Low               | Low        | None                       |
| F         | Playful, filmic, sideways      | Swipe strip instead       | Low               | Medium     | None                       |
| G         | Spectacular, warm, darkroom    | Heavy (textures)          | Low (image first) | High       | Maybe OGL; CORS at cutover |
| H         | Dreamy, exploratory            | Auto drift, many requests | Medium            | Medium     | None                       |

### Recommendation, round two

**E, Rack Focus,** as the base. It is the closest to "the photographs are the page": every story gets
the whole screen, portraits are never cropped, and the motion (a slow rack into focus) is the current
site's "everything comes into focus" idea made full-screen. It needs no library, has the safest LCP,
and falls back to a good plain stack. Borrow G's film-burn as the one transition in the story film
once the domain and CORS are settled, since it is the most memorable effect here, and F's reel would
make a strong `/stories/` archive. H is the most dreamlike on a desktop but the weakest on a phone,
where most of her visitors are. The pick is Nathan's.

## Round one (A to D)

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
