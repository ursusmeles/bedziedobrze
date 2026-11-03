# będzie dobrze
An Astro / Cube CSS based website for a small creative collab from Gdańsk, Poland. We help businesses scale, grow their online presence and manage their identity.

Motion durations live in `src/styles/tokens.css`: instant 0ms, press/small fade 140ms, short/color 210ms, wipe 300ms, and panel 400ms. Sequencing uses a 20ms stagger unit and a 100ms layer delay. Reduced motion removes these durations and delays.

Use existing Open Props easings directly: `--ease-step-1` for client waves, `--ease-step-2` for font/link wipes, `--ease-step-4` for email waves, `--ease-out-3` for UI feedback and page navigation, and `--ease-circ-in-out` for panels. Client wave durations and offsets are proportional to the shared tokens; tags wait for both covering layers. SVG scroll shifts retain their independent behavior.
