# Manual QA checklist (needs a browser)

Automated checks cannot see the rendered pages. Run through this once before demoing, and note anything that looks wrong.

Start both servers (`scripts\run-backend.ps1`, `scripts\run-frontend.ps1`) and open http://localhost:5173.

## 1. Responsive layout: repeat at 375, 768 and 1440 px wide
Chrome or Edge: press F12, then the device toolbar (Ctrl+Shift+M), and set the width.
- [ ] Landing: no sideways scrolling; hero text readable; the brain illustration and 3 chips do not overlap the text; mobile menu opens and closes; all 10 sections look sensible.
- [ ] Sign in and Register: the form is usable at 375 px; the gradient side panel appears only on wide screens.
- [ ] App pages (after signing in): sidebar on wide screens, scrollable tab row on narrow; assessment form fields stack on mobile; History rows wrap cleanly; Analytics charts resize without clipping.
- [ ] Methodology: the pipeline diagram scrolls sideways inside its own box instead of breaking the page.

## 2. Contrast and legibility
- [ ] Hero text, badge, chips, and the privacy note on the sign-in panel are easy to read over the gradient.
- [ ] Small grey captions are readable on white and on the pale page background.
- [ ] Tooling (optional): Chrome DevTools > Lighthouse > Accessibility, or the axe DevTools extension, on Landing, Sign in, Assessment, Result and Analytics.

## 3. Keyboard only (no mouse)
- [ ] Tab from the top of any page: the first stop is "Skip to main content", and Enter moves you to the page content.
- [ ] You can reach and operate every control: nav links, mobile menu, FAQ items (Enter or Space), form fields, tooltips (focus the info button), the consent checkbox, both submit buttons, Delete and Confirm buttons.
- [ ] A visible focus ring is always present and focus order follows the visual order.

## 4. Reduced motion
- [ ] Turn on "Reduce motion" in your OS (Windows: Settings > Accessibility > Visual effects > Animation effects off). Reload: the brain nodes stop pulsing and the chips stop floating, and nothing is missing.

## 5. Performance
- [ ] Lighthouse Performance on Landing (production build: `npm run build` then `npm run preview`). Note the scores. None are claimed here.

## 6. The result and analysis pages (new)
- [ ] After an assessment the page starts with a large "Higher stroke risk" or "Lower stroke risk" headline and an "Estimated stroke risk: x%" line, then the two-state scale with the marker on the right side.
- [ ] The factor chart is readable at 375 px: labels are not cut off, bars point right (up) or left (down), and the lists below match the bars.
- [ ] Try three profiles: an older person with high glucose (expect higher), a young person with healthy values (expect lower and "under 0.1%" or a small percent), and one with BMI over 30 (expect the "do not read it as protective" note if BMI appears under "pushing down").
- [ ] Analytics shows the same verdict and chart for your latest saved assessment, and an empty state if you have none.
- [ ] No page shows ROC, precision, recall, confusion matrix or "model transparency" wording to a user (only the Methodology page keeps technical detail).

## 7. Content and safety review
- [ ] Every result page (try all three bands) shows the emergency warning, the "not a diagnosis" statement, and advice to see a professional, and never says you are safe.
- [ ] No page shows testimonials, user counts, ratings, logos, awards, or compliance badges.
- [ ] Stop the backend and reload Landing, Dashboard and Assessment: each shows a clear message instead of fake data.
- [ ] Remove `artifacts/pipeline.joblib`, restart the backend: Assessment, Analytics and Landing show "model not trained yet".
