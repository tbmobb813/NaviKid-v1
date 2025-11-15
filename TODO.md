# MapMuse - Project TODO List

This file outlines the next steps for the MapMuse project, following the strategic pivot to a "Family Adventure & Discovery" application.

## High Priority

- [ ] **Review UI for Implicit Safety Cues:**
  - Audit the application's UI/UX for any elements (icons, colors, text) that might implicitly promise "safety."
  - Replace any such elements with branding that aligns with "adventure," "discovery," and "fun."

- [ ] **Validate New Backend Endpoints:**
  - The API endpoints for the AI Journey Companion (`/text/llm/`) and Voice Navigation (`/stt/transcribe/`) have been updated to `https://api.mapmuse.app/`.
  - You will need to implement these on your backend or choose a new third-party service for this functionality.

- [ ] **Conduct Initial User Testing:**
  - Prepare a build for testing with your family and a small, external beta group.
  * Gather feedback on the new "MapMuse" concept and the "fun/adventure" focus.

## Medium Priority

- [ ] **Enhance "Adventure" Features:**
  - Begin development on features that support the new vision.
  - **Points of Interest:** Plan how to expand the database of family-friendly locations.
  - **Themed Routes:** Design and implement the "Themed Adventure Routes" feature.
  - **Achievements:** Brainstorm and add new achievements that reward exploration and discovery.

- [ ] **Setup Domain & Hosting:**
  - Acquire the `mapmuse.app` domain (or your chosen domain).
  - Configure DNS and hosting for your backend services at `api.mapmuse.app`.

## Low Priority (Technical Debt)

- [ ] **Full Rebrand of Infrastructure:**
  - The internal project codename is still "NaviKid" in many places (database, deployment scripts, backend service names).
  - Plan for a future refactoring effort to change all instances of `navikid` to `mapmuse` for long-term consistency. This is a significant task and should only be done when the product direction is fully validated and stable.
