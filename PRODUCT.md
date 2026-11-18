# Product

Design context for the Erin Schmerr Photography site. Visual system: `DESIGN.md`. Facts that are still waiting on the client are marked **[open]**; do not design around a guess for them.

## Register

brand

A portfolio, not an app. The pictures are the product; the interface stays out of their way.

## Users

- **Primary: people looking for a fine-art portrait session** in and around Cincinnati and West Chester, Ohio. They arrive from Instagram, Facebook, a magazine credit or a search for a fine-art portrait photographer. Mostly on a phone. The decision the site helps them make: "is this the look I want, and how do I book it?"
- **Secondary: creative collaborators and editors** (models, makeup artists, stylists, designers, magazine editors). They arrive from a credit or a shared story. They want to see the work, the credits and the publications, and to share the page that names them.

## Product Purpose

A credits-first editorial portfolio for Erin Schmerr, a fine-art portrait photographer whose work is dreamy and ethereal. It shows the stories (shoots) as editorials, the publications they appeared in, and the people who made each one. A good visit ends in a session inquiry, or in a collaborator sharing the story that credits them.

## Brand Personality

Dreamy, crafted, quiet. The voice is warm and first person, short sentences, no hard sell. The work does the impressing; the copy says who, where and how to book.

Brand name and domain are **[open]** (the business has traded as Stellina Fine Art Photography; the site may use her own name). Every place the name appears reads from `brand/brand.config.json` and Site settings, so the choice is a config change.

## Content model, in plain words

- **Story:** one shoot or editorial. Cover, a sequence of photos, the credit block, and the publication it ran in, if any.
- **Photo:** one image with its alt text, caption, credits and camera details.
- **Publication:** a magazine feature (title, issue, date, link, tear sheet).
- **Collaborator:** a person credited on a story (name, role, link).

Placeholder pictures stand in for every image until originals arrive. They are licence-free and labelled as placeholders.

## Anti-references

- Wedding-photographer templates: script logos, blush pink, "capturing your forever" copy.
- Tech-portfolio gimmicks that distort photos (3D globes, pixel shaders, image drums).
- Heavy chrome: big headers, coloured bands, card shadows around photos.
- Instagram embeds as the portfolio.

## Design Principles

1. **The picture first.** Full-bleed or generous whitespace, never a frame that competes.
2. **Everything comes into focus.** Images arrive soft and resolve; motion is slow and optical, never bouncy.
3. **Credit every hand.** Each story carries a magazine-style credit block with linked names.
4. **Quiet chrome.** Type and space do the structure, not boxes and colour.
5. **Survive real content.** Portrait and landscape photos in any order, long and short titles, a story with no publication.

## Accessibility & Inclusion

The starter's floor: WCAG AA (the site is light only since 2026-11-18) (`src/lib/theme-tokens.test.ts` is a gate), axe and reflow suites, visible focus, 44px tap targets. Every effect has a `prefers-reduced-motion` and a touch fallback, and every page reads with JavaScript off. Alt text describes the picture and names the people credited in it.
