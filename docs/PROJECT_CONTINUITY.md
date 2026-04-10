# Project Continuity

## Last update
2026-04-10

## What changed in this iteration
- Breadcrumb behavior improved:
  - Trail now truncates naturally when navigating back to an earlier breadcrumb.
  - Home breadcrumb now shows only the house icon.
  - Labels for movie/series/person breadcrumbs are generated from slug-readable names.
- URL model upgraded to friendly slug paths:
  - Movie: `/en/movie/the-office`
  - Series: `/en/series/the-office`
  - Person: `/en/person/will-ferrell`
- Backward compatibility kept:
  - Existing numeric routes (`/person/23659`, etc.) still resolve correctly.
- Slug route resolution implemented:
  - Detail routes resolve slug -> TMDB id through search matching.
  - CamelCase slugs (e.g. `WillFerrell`, `TheOffice`) are also interpreted.
- Internal links migrated to slug URLs in cards, suggestions, cast/crew links, and person filmography links.
- Desktop tab scrollbar artifact fixed:
  - Tabs now keep horizontal scroll only on small screens and hide scrollbar visuals.
- Home improved with quick insight cards and direct access links to relevant Discover views.
- Vercel image transformation pressure reduced:
  - `next/image` optimization disabled globally in `next.config.ts` (`images.unoptimized = true`).

## Notes
- Slug-only URLs improve readability and SEO, but can be ambiguous in edge cases with duplicated names.
- Current resolver uses best-match strategy over TMDB search results.

## Pending follow-ups
- Optional canonical URL strategy for duplicate title collisions.
- Additional Home UX pass after mobile QA.
- Keep updating this file after each implementation conversation.
