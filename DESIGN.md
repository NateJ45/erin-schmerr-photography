---
name: Tate Fine Art Photography, Soft Focus Editorial
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

Direction chosen 2026-11-17 for the build on placeholder content. The brand name is settled as Tate Fine Art Photography (2026-11-18; the wordmark sets "Tate" in Instrument Serif roman and "Fine Art Photography" in its italic, in Dusk). One answer from the client can still move it: whether she would rather have a dark site (the site is light only since 2026-11-18; the dark tokens are still in the code, so bringing dark back is a small change). The CSS wins if this file and the code disagree: tokens live in `brand/brand.config.json`, written into `src/styles/globals.css` by `npm run apply-brand`; the site's own layer is `src/styles/erin.css`.

## 1. Overview

**Creative North Star: everything comes into focus.** A fine-art portrait portfolio that feels like a printed art book: warm paper, a large editorial serif, photos given room, and motion that behaves like a lens pulling focus.

- **Light only** (2026-11-18, rule 3). Warm paper is the one ground; there is no theme toggle and the system dark setting is ignored. The dark column below is kept for reference and for the shared dark test suites.
- **No polish-layer chrome.** No brand stripe, no card lift, no tinted bands around photos. Sections separate by space and hairline rules.
- **Square corners.** Radius 0 on photos, buttons and fields.
- **One left edge, one row of chrome** (2026-11-17; the darkroom chrome since 2026-11-18). The header has no eyebrow strip; its one row uses the page gutter so the wordmark lines up with every heading below it, and a film-leader strip runs under it. Content bands all sit on paper: the starter's paper-soft cadence, sunburst ornaments and testimonial glow are switched off in `src/styles/erin.css`, and sections part with a content-width hairline. The footer is the centred end credits (it keeps the compact style's class, so its page columns sit two by two on a phone).

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

- **Header, "the darkroom"** (`Header.astro`, 2026-11-18): a film-leader strip, not a bar. The wordmark on the left; the nav set like the printed edge of a negative, tiny tracked uppercase with Dusk frame numbers ("01 Stories 02 Archive"); the page you are on ringed in grease pencil (`darkroom/GreasePencil.astro`, a hand-drawn loop in Dusk); "Book a session" as the one Dusk button, with a small red safelight dot (the label typed in Site settings wins). Under the row runs the leader: an ink strip with sprocket holes and, from 1024 up, edge printing. Hovering a nav item with a mouse shows a small print beside it (a picture the site already uses for that page: a story cover, a tear sheet) that pulls from blur to sharp; touch, keyboard and reduced motion get none, and the lazy image is not fetched until hovered. Scrolling down slims the header to the leader strip; scrolling up brings it back (transforms only). Server-rendered links (rule 4).
- **Phone menu, "the contact sheet"** (`MobileNav.astro`): the "Menu" button opens a full-screen dialog on a black film ground. Each page is a small frame (her featured story covers, cycled; a page's own picture where it has one) with sprocket holes down both edges, a frame number under it and the page name large in Instrument Serif on a paper chip; the page you are on is ringed in grease pencil. The frames develop one after another as it opens (blur to sharp, 60ms apart; reduced motion: none). "Book a session" sits under the sheet. A real dialog: labelled "Menu", focus trapped, Escape and "Close" close it, focus returns to the button, 44px targets, the page behind does not scroll. Without JavaScript the button is a link to the footer's page list. Site settings phone menu groups still work: each group is a labelled sheet.
- **Footer, "end credits"** (`Footer.astro`): paper, centred like the end of a film. "Photographs by Erin Schmerr", then "Starring" (people credited on her stories, most credited first), "On location at" (story places and credited venues) and "As published in" (the press magazines), each linked where the data has a page, then the site's pages from Site settings footer columns. "Booking sessions in Cincinnati and West Chester" with her local time (`site.timeZone`; the zone's short name without JS, in a fixed-width box so nothing moves), email, phone and social links when Site settings has them, the small print (copyright, privacy, Studio), and a huge "Tate" cropped by the bottom edge. Where the credits come into view they roll up a little on a CSS `view()` timeline (translate only; still under reduced motion or without support). The data is derived in `src/components/darkroom/chrome-data.ts`, read once per build.
- **Cover slides** (`CoverHero.astro`, block `coverHero`; picked 2026-11-18): the home page opens with the featured stories one per screen, full bleed and sticky, so each slides up over the last. Arriving slides rack from soft and slightly large to sharp on a CSS `view()` timeline (touch: scale and fade only; reduced motion, no JS or no support: still). A portrait shows whole over its own blurred LQIP on a wide screen. The first slide carries the headline, line and buttons on a paper chip, never animates, and holds the LCP image; the rest load lazily. Each slide has a caption chip and a counter. Nothing moves on its own, so there is no Pause button. An optional small portrait of her sits inside the headline, after a chosen word, in a square-cornered frame sized in em (the page opens on a person; empty, the headline is plain words).
- **The home page's order** (2026-11-18, modelled on a person-first studio site): cover slides, proof strip, who it is for (one line), selected stories, how a session works (the steps rail), how I get the look, the crew list, tear sheets, the signed close.
- **Proof strip** (`ProofStrip.astro`, block `proofStrip`): one slow line under the slides: the press features from Publications (the magazine in the display face, what ran small beside it) with quotes in her own words between them, set in the display italic with where she said them. It is the Published marquee's machinery (pausable, still under reduced motion, without JS or with fewer than four items).
- **Craft notes** (`CraftNotes.astro`, block `craftNotes`): "How I get the look". The heading in the text track of the shared split, held in view from 1024 up; numbered notes (an italic numeral, a title, a sentence) parted by hairlines in the other track.
- **Crew list** (`CrewList.astro`, block `crewSection`): a short paragraph beside a crew list set like a story credit (role small, name in the display face), on the shared split.
- **Signed close** (`SignedClose.astro`, block `signedClose`): the last band, on paper, not a dark panel. A large heading, then the note, the page's one filled Dusk button and "Signed," with her name in Instrument Serif italic (never a script font).
- **Focus image** (`FocusImage.astro`): every photo renders over its own LQIP blur and resolves to sharp as it loads and enters view. Reduced motion shows it sharp at once.
- **Credit block** (`CreditBlock.astro`): a two-column definition list (role, then linked name), set like a magazine credit.
- **Story index** (`StoryIndex.astro`): selected stories as a grid or a list, with a toggle; in list view, hovering a title reveals its cover.
- **Published marquee** (`PublishedMarquee.astro`): "As published in" on the left and the magazine names in one line beside it (stacked on phones). From four names up it scrolls slowly (at least 40s a lap), pausing on hover, keyboard focus and its Pause button; fewer names, JS off or reduced motion keep the still line.
- **Tear-sheet stack** (`TearSheetStack.astro`): the newest tear sheets fanned and overlapping like prints on a table, with the list of features beside them; pointing at a feature or a sheet lifts that sheet. Reduced motion keeps the overlap and drops the turn and lift.
- **Press page** (`src/pages/press.astro`): an index by year. The year sits in a left rail that stays in view (from 1024 up) while its features pass; each feature is a row with its tear sheet, issue and date, the magazine large, the excerpt and a "Read the feature" link.
- **Story page** (`src/pages/stories/[slug].astro`, picked 2026-11-18): a slideshow film. The cover, then the photos (`storyFrames()` in `src/lib/portfolio.ts`, the cover never twice), are full-screen frames under the header: a portrait shows whole over its own blurred LQIP when the frame is wide, a landscape when it is tall (a container query), otherwise the photo fills the frame on its hotspot. The title, place and date sit on a paper chip at the top (a smaller running title after the first frame); captions (her caption, else the alt) and the camera line are subtitles on paper chips. `src/scripts/story-film.ts` plays it: a 4.8s hold with a slow 1.06 push-in, segmented progress along the top, a frame counter, Previous, Pause/Play and Next (44px, real buttons), Left and Right arrows, Space, sideways swipe. Between frames `src/scripts/film-burn.ts` (hand-written WebGL 1, no dependency) burns the print into the next along a noise edge with a warm glow over 1.6s; it needs CORS from `cdn.sanity.io` (the listed origins only), so anywhere else, or without WebGL, the frames crossfade over 1.2s with a focus pull. Pixel ratio capped at 1.5; only the frames around the current one keep a texture. The last frame is the end credits on paper: "Starring" (the credits), the story's line, place and date, "Published in", "Watch again" and a link to "How this was made". Autoplay stops on the end credits, while the tab is hidden and while the film is mostly scrolled away; the live region is polite when the visitor moves and quiet while it plays by itself. Reduced motion: no autoplay, no Play button, no push-in or burn; Previous and Next cut. Without JavaScript: a vertical run of full-bleed frames with their captions, then the end credits. The first frame is the LCP (eager, high priority, never blurred). After the film it ends like a case study: "How this was made" (where the idea came from, the place, the cast from the credits, a venue already named as the place left out) beside "Want a session like this?" and a link to the contact page, then "Next story" with its cover (the first story follows the last).
- **Archive canvas** (`ArchiveCanvas.astro`): every photo on a draggable canvas; a plain grid on touch and under reduced motion.
- **Buttons:** one family (rule 17). Text links with an underline that draws in; the single filled Dusk button is the inquiry.

## 6. Do's and Don'ts

Motion: slow optical easing `cubic-bezier(0.22, 1, 0.36, 1)`, 700 to 1200ms for focus pulls, 300ms for UI. Scrolling stays native (rule 5). Every effect has a reduced-motion and a touch fallback, and hidden start states sit under `html.motion` so the page reads without JavaScript. The site plan's interactions live in `src/styles/erin-motion.css`: a first-visit loader (`FirstVisitLoader.astro`: the name pulls into focus and the curtain lifts in 1.1s, once per device, never under reduced motion or with storage blocked; it hides nothing underneath), the darkroom chrome's hover prints, developing frames and rolling credits, a variable-weight nav hover (the nav label thickens, with the bold width reserved so nothing moves; hover pointers only). The story page's film has its own motion (Story page, above).

**Do**

- Let photos run full bleed or with generous margins; keep captions small.
- Credit every person on a story, linked where they have a page.
- Use placeholder images that read as placeholders until originals arrive.

**Don't**

- Don't frame photos in cards, shadows or rounded corners.
- Don't use a script font, blush pink, or wedding-template copy.
- Don't distort photos with shaders beyond the hero's one focus effect.
- Don't write an em-dash in public copy.
