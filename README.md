# będzie dobrze
An Astro / Cube CSS based website for a small creative collab from Gdańsk, Poland. We help businesses scale, grow their online presence and manage their identity.

The production site redirects to `https://www.bedziedobrze.space/`. `site` in `astro.config.mjs` supplies the canonical host for search metadata, Open Graph, JSON-LD, robots.txt, and the sitemap. The sitemap currently lists the homepage; add new pages to `src/pages/sitemap.xml.ts` when the site grows.

`/llms.txt` provides a Markdown overview using existing homepage copy and section links. Its service descriptions come directly from `src/data/services.ts`, shared with the website.

The social image is `public/og-image.jpg` (1200 × 630, used for link previews), with editable source in `scripts/og-image.html`. Regenerate with `python scripts/generate-social-images.py` after installing Python's `playwright` package and Chromium (`python -m playwright install chromium`, or use system Chromium / `CHROMIUM_PATH`). These tools are only needed to regenerate the committed image, not to build or serve the site.

The OG template imports `src/styles/global.css` directly. It uses the website's `h1` and `.decorative` typography at 228px, with its original line-height, aligned bottom-left with 24px canvas padding. The image contains only the stacked wordmark. The SEO check verifies image copy against the rendered homepage, allowing whitespace, soft-hyphen, and letter-case normalization; use existing or explicitly approved copy when updating the image.

Run `npm run test:seo` to build and check the emitted metadata, structured-data references, social assets and copy, robots.txt, sitemap, and llms.txt. `npm run test:typography` checks the Polish typography middleware.

Motion durations live in `src/styles/tokens.css`: instant 0ms, press/small fade 140ms, short/color 210ms, wipe 300ms, and panel 400ms. Sequencing uses a 20ms stagger unit and a 100ms layer delay. Reduced motion removes these durations and delays.

Use existing Open Props easings directly: `--ease-step-1` for client waves, `--ease-step-2` for font/link wipes, `--ease-step-4` for email waves, `--ease-out-3` for UI feedback and page navigation, and `--ease-circ-in-out` for panels. Client wave durations and offsets are proportional to the shared tokens; tags wait for both covering layers. SVG scroll shifts retain their independent behavior.

Vertical spacing uses `--vertical-rhythm` (`2 * --space-xl-3xl`) for section boundaries after clients, between service/process rows, and below the glyph-and-heading groups in services and process. The about section's top padding, heading-to-founder gap, and gap before the team card use `--space-2xl-3xl` at every viewport size. On mobile, the team-card gap follows the complete founder biography. Lists have no default margins; clients retain an explicit `--space-s` heading gap. Glyphs retain their intrinsic proportions and bottom-align with headings on desktop.
