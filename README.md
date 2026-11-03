# będzie dobrze
An Astro / Cube CSS based website for a small creative collab from Gdańsk, Poland. We help businesses scale, grow their online presence and manage their identity.

Motion durations live in `src/styles/tokens.css`: instant 0ms, press/small fade 140ms, short/color 210ms, wipe 300ms, and panel 400ms. Sequencing uses a 20ms stagger unit and a 100ms layer delay. Reduced motion removes these durations and delays.

Use existing Open Props easings directly: `--ease-step-1` for client waves, `--ease-step-2` for font/link wipes, `--ease-step-4` for email waves, `--ease-out-3` for UI feedback and page navigation, and `--ease-circ-in-out` for panels. Client wave durations and offsets are proportional to the shared tokens; tags wait for both covering layers. SVG scroll shifts retain their independent behavior.

Vertical spacing uses `--vertical-rhythm` (`2 * --space-xl-3xl`) for section boundaries after clients, between service/process rows, and below the glyph-and-heading groups in services and process. The about section's top padding, heading-to-founder gap, and gap before the team card use `--space-2xl-3xl` at every viewport size. On mobile, the team-card gap follows the complete founder biography. Lists have no default margins; clients retain an explicit `--space-s` heading gap. Glyphs retain their intrinsic proportions and bottom-align with headings on desktop.
