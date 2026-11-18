# Tate Fine Art Photography (Erin Schmerr)

The portfolio site for Erin Schmerr, a fine-art portrait photographer in Cincinnati and West Chester, Ohio. A credits-first editorial portfolio: stories (shoots) with their credits and publications, an archive of every image, a press page, and a session inquiry.

Built on **Astro 7 + Sanity v6 + Cloudflare Workers**, forked from Nixon Creative Studio's `ncs-astro-sanity-starter`. Content is edited in the Sanity Studio embedded at `/studio`.

Pre-launch address: https://erin-schmerr-photography.nathanjnixon86.workers.dev

Until the client's own photos and copy arrive, every image and most text is a labelled placeholder.

## Getting started

```sh
npm ci
npm run dev        # http://localhost:4321, Studio at /studio
```

A fresh clone builds with no Sanity project: pages render their built-in placeholder content. To use the CMS locally, copy `.env.example` to `.env` and `.dev.vars.example` to `.dev.vars` and fill in the project id and tokens (they are not in the repo).

## Content

| In the Studio                                          | On the site                                           |
| ------------------------------------------------------ | ----------------------------------------------------- |
| Stories (cover, photos, credits, publication)          | `/stories/` and `/stories/<slug>/`                    |
| Photos (alt, caption, archive switch)                  | inside stories and on `/archive/`                     |
| Publications (magazine, issue, date, link, tear sheet) | `/press/`, the home page marquee and tear-sheet stack |
| Collaborators (name, role, link)                       | the credit block on each story                        |
| Pages, About, FAQ, Process, Testimonials               | `/about/`, `/sessions/` and any page you add          |

Camera details (body, lens, focal length, aperture, shutter, ISO) are read from each photo's own file, never typed. Placeholder stories and publications: `npm run seed:portfolio` (dry by default).

A published change goes live after the site rebuilds (the Sanity publish webhook triggers it).

## Quality gates

```sh
npm run check        # astro check + eslint
npm run typegen      # after any schema change, before build
npm run build
npm run test:unit
npm test             # Playwright: smoke, axe light and dark, reflow
```

`ci.yml` runs these on every push and PR; `lighthouse.yml` runs Lighthouse; `deploy.yml` ships `main` to Cloudflare. `sanity-backup.yml` makes a nightly encrypted dataset backup and `uptime.yml` checks the live pages hourly.

Design context: `PRODUCT.md` and `DESIGN.md`. Agent orientation: `CLAUDE.md`. Operations: `OPERATIONS.md`.

## License

Copyright 2026 Nathan Nixon / Nixon Creative Studio. The starter code is released under the [PolyForm Strict License 1.0.0](LICENSE). Photographs shown on the site belong to their photographer and are not covered by that licence.
