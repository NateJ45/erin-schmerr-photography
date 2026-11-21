# Erin Schmerr Photography website: CLAUDE.md

Always-loaded rules for this repo, the portfolio site for Erin Schmerr, whose business is **Tate Fine Art Photography** (site name and wordmark since 2026-11-18). The repo, Worker and pre-launch address keep the old `erin-schmerr-photography` slug. File-specific rules load from `.claude/rules/*.md` when you touch matching files; long reference lives in `docs/claude/` and `docs/agent/`.

**This file is client-safe**: the repo is public and may be handed to the client, so it holds technical orientation only. Prices, contract text, strategy, opinions about people, private contacts and credentials never go in this repo (files, commits, PRs, issues, code comments).

**Read this first.** Project records, rules and status are kept privately by the studio, outside this folder. Before doing any work, read the session guide: `C:\Users\natha\Documents\Claude\Projects\_vault\projects\erin-schmerr-photography-session-guide.md`. Also read `~/.claude/CLAUDE.md` and the Projects `CLAUDE.md`.
**Her work, interim copies.** The stories, press and archive show stand-in copies of her own work (`ig-*` ids); never put her photographs in the repo itself. Detail: `docs/claude/overview.md`.

**Read `docs/PENDING.md` early in a session.** It is the live registry of open loops: queued work, known gaps, and waiting-on-a-human items. If you finish or discover one, update it in the same commit.

Companion tactical runbook: `OPERATIONS.md`. Setup entry point: `docs/bootstrap/NEW-PROJECT.md` and `docs/bootstrap/setup-checklist.md`. Shared-improvement registry: `PORTS.md`. Design context: `PRODUCT.md` and `DESIGN.md` (Soft Focus Editorial).

## What this is

The portfolio on **Astro 7 + Sanity v6 + Cloudflare Workers**, forked from `ncs-astro-sanity-starter` on 2026-11-17. Sanity project `feuqkbki`, dataset `production` (public, so no personal data in it). Worker `erin-schmerr-photography`, pre-launch address https://erin-schmerr-photography.nathanjnixon86.workers.dev. **Page-builder-first**: pages render through `SectionRenderer` from Sanity `pageBuilder` arrays. Full overview, capabilities and scaffold list: `docs/claude/overview.md`.

The must-knows:

- TypeScript strict, `output: 'static'` with a handful of SSR routes (`/preview/**`, `/api/draft-mode/*`). Node 22.23.4+ (`.nvmrc`; CI reads it, PORTS.md card 209). Tailwind 4 via `@tailwindcss/vite` (no `tailwind.config.mjs`; tokens in `@theme` in `src/styles/globals.css`). React 19 islands only where interactive.
- The Sanity Studio is **embedded at `/studio`**. There is no separate studio dev server or deploy. Never run `npx sanity deploy`. Its name, mark (`public/favicon.svg`) and accent and background colours come from `brand/brand.config.json` at build time, contrast-guarded by `studio-theme.test.ts` (PORTS.md card 110); `studio.components.logo` is dead in Sanity 6, so never use it. `/studio` is the site's own page (`src/pages/studio/index.astro`: title, icons, splash; card 120), so `astro.config.mjs` sets no `studioBasePath`. It installs to a phone as an app: `/studio/manifest.webmanifest` and a service worker scoped to `/studio/` (`public/studio/sw.js`, card 125) that must never cache a Sanity answer, `/api/**` or anything with a token.
- `sanityFetch(query, params, fallback)` in `src/lib/sanity.ts` is the single chokepoint for Sanity reads; with no project configured it returns the fallback, so `npm run build` works on a fresh clone.
- The business's facts (address, phone, email, hours) are typed ONCE (Business info, Site settings) and read through `resolveBusinessFacts()`. Never type a time or an address into a component: `docs/agent/business-facts.md`.
- Hosting is **Cloudflare Workers**, not Pages. Deploy with `npm run deploy` (`wrangler deploy -c dist/server/wrangler.json`). A bare `wrangler deploy` 404s every sub-route.

## Commands

- `npm run dev`: dev server on :4321, Studio at `/studio`.
- `npm run typegen`: regenerate Sanity types. Run after ANY schema change, before `npm run build`. `npm run build:full` chains both.
- `npm run build`: `astro build` plus post-build scripts. Does NOT chain typegen. Full chain in `docs/claude/build-and-scripts.md`.
- `npm run check` (`astro check && npm run lint`) is the fast gate; `npm run check:full` is typegen, build and unit tests (`test:unit` includes the scripts tests).
- `npm run test:unit` (node --test, `src/lib/*.test.ts`, then `npm run test:scripts`; four are GATES: `theme-tokens`, `layout-variants`, `section-fields`, `site-layout`). `npm test` is the Playwright suite. Also `npm run format:check` and `npm run check:links`.
- `npm run preview`: `wrangler dev` on the last build; the only way to exercise SSR routes locally.
- Everything else (parity, references, apply-brand, seed, scaffold, audits): `docs/claude/build-and-scripts.md`.

## Branch, CI and deploy

- Work on a branch and open a PR; `main` is production. CI (`ci.yml`) runs on every push and PR, as parallel jobs (`static`, `site`, three Playwright shards `e2e`, and the required aggregators `build` and `test`; PORTS.md card 70): the static checks, one build, `check:links` and `npm test` (Playwright); `lighthouse.yml` runs `npx lhci autorun` separately. Parity is deliberately a local gate.
- `deploy.yml` ships production on a push to `main` (docs-only paths, including `CLAUDE.md`, are ignored), on the Sanity publish webhook (`repository_dispatch`) and on manual dispatch. It will not deploy if the unit tests fail.
- Content is statically built: a Sanity edit goes live only after a rebuild (rule 6).

## Rules that bite

Numbering is load-bearing; other docs cite it. Rules 1 to 7 and 10 are in full below. The rest are one-liners; the full text loads from the file named when you touch matching files, or read it directly.

1. **Never click "Remove field" in the Studio** (deletes that field's data everywhere). After a schema change: edit schema, `npm run typegen`, commit, deploy.
2. **No em-dashes in public-facing site copy.** Code comments, commits and internal docs are exempt.
3. **Light only** (decided 2026-11-18). No theme toggle, no dark styles (`docs/agent/theme-and-color.md`).
4. **Desktop nav is server-rendered** in `Header.astro`; do not make it a client-only island.
5. **Scrolling is the browser's own; no Lenis** and no scroll library (`docs/agent/animation.md`).
6. **Content is statically built.** A Sanity edit goes live only after a rebuild.
7. **After any schema change run `npm run typegen` before `npm run build`** (`build:full` runs both).
8. **Astro, adapter, wrangler, React and Sanity versions are a MATCHED SET;** never bump one alone, never `npm audit fix --force`, never regenerate `package-lock.json` (`.claude/rules/dependencies.md`).
   8b. A new logic-driving dropdown goes into `NON_STEGA_FIELDS` in `src/lib/cms-preview.ts`.
9. **Blocks carry no colour/surface field** (`section-fields.test.ts`); `look` is the one exception.
10. **The reserved-slug guard lives inside `getStaticPaths`** in `[slug].astro`.
11. to 13. Fork residue, `apply-brand` font packages, build after `apply-brand` (`.claude/rules/brand-reskin.md`).
12. **A capability is added with its scaffold markers in the same commit** (`.claude/rules/scaffold.md`).
13. **Anything computable from data is derived at build time,** never an editable field.
14. **Retiring data is a backup-then-delete script, run dry first.** A production write needs `--apply` AND `NCS_PRODUCTION_WRITE=yes` (`.claude/rules/data-scripts.md`).
15. **One grammar per page** (`.claude/rules/ui-grammar.md`).
16. **Layout variants are a config axis** in `brand.config.json` (`.claude/rules/brand-reskin.md`, `docs/agent/design-tokens.md`).
17. **Internal page links end in a slash;** data-built hrefs go through `withTrailingSlash()`.

## Design flow and authoring kit

Brief -> references -> design-directions -> reskin (`.claude/rules/design-flow.md`, `docs/claude/overview.md`). Clients build their own pages from templates and saved sections (`docs/agent/sanity.md`, "Authoring kit").

## Live draft preview

The `/preview/**` stack (second Sanity client with stega, SSE proxy, instant text, morph refresh, in-canvas controls) is the most fragile area. Never compare or measure a stega-encoded string, never poll instead of the SSE proxy, `/preview/**` must send `Cache-Control: no-store`, and the `/preview/live` listen must stay `visibility: 'query'`. Everything else is in `.claude/rules/preview-stack.md`, which loads when you touch preview files; read PORTS.md cards 29-29d before touching the refresh loop.

## Code conventions and Working with Claude

Shared by every site repo in the family, so they live in one PORTABLE file imported here (it is expanded into context at launch, so this saves lines in this file, not tokens): the code conventions (strict TypeScript, header comments, Astro and React islands, images, Tailwind) and the working-with-Claude habits (desktop app, Plan Mode, confirm before installing, describe design in plain language, verify in a real browser).

@docs/claude/family-conventions.md

## Visual verification

Every UI change is verified rendered, in light (the only theme, rule 3), at ~375px and ~1280px, with hover/focus/active states and the neighbouring sections checked, before it is reported done. Use the Playwright MCP; for Studio changes open `/studio` in a real browser and read the console. Full loop: `docs/claude/visual-verification.md`.

## Style

Warm, conversational, step-by-step for processes. No em-dashes in public-facing site copy (rule 2). No AI-tell phrases (delve, leverage, robust, seamless and the rest) and no filler openers or closers. The full lists and the site copy voice are in `docs/claude/communication-style.md`.

## Edit zones

Files are either safe to edit by hand (`docs/claude/safe-to-edit.md`) or foundation (`.claude/rules/foundation-files.md`, loads when you touch one). A change to the foundation set is a planned session, and this doc is updated when the architecture shifts.

## Vault

Business context and decisions live in the studio vault, not here; the session guide named at the top of this file says which notes to read and how to log work. Update repo docs in the same piece of work as any change; repo docs stay in the repo, and no vault notes are created inside this repo.

## Ports

This repo owns `PORTS.md`, the registry of improvements shared across the site family, and the files marked `PORTABLE:`. A generalising fix gets a port card in the same commit that generalises it. Changing a marked file changes the family's copy, so keep it general. Cross-project lessons go to `_vault/gotchas/` with a "Ported to" checklist, ticked only when verified in that repo. Run `npm run sync-check` for drift. Full working rules: `.claude/rules/library-of-record.md`.

## Docs map

Path-scoped rules are in `.claude/rules/`. Reference is in `docs/claude/` and `docs/agent/`. The full map: `docs/claude/topic-index.md`. Tactical playbook: `OPERATIONS.md`.
