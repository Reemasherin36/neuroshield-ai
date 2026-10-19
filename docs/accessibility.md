# Accessibility

Target: WCAG 2.1 AA.

## What was checked
| Check | How | Result |
|---|---|---|
| Automated rule scan of every page | `axe-core` inside the Vitest suite (`frontend/src/a11y.test.tsx`), WCAG 2 A/AA, 2.1 A/AA and best-practice rules, rendered with mocked data. Covers landing (both model states), login, register, 404, methodology, assessment form, dashboard (data and empty), history, history detail, analytics, settings, and the result view for each band | **0 violations** after fixes |
| Colour contrast | `python scripts/contrast_check.py` computes WCAG ratios for the 40 colour pairs the UI uses, including text on each hero-gradient stop, chip text, and text over the blurred orb | **40/40 pass.** First run found 8 failures: the `ink-subtle` grey (4.26:1 on white) and light text on the cyan end of the hero gradient (as low as 2.14:1). Fixed by darkening those tokens and the gradient's end stop, using lighter text for small notes, and giving the floating chips a darker glass |
| Keyboard and structure | A skip link on every layout, one `main` landmark per page, labelled navigation landmarks, native `details` for the FAQ, `fieldset`/`legend` for yes/no groups, visible focus ring on every control | Covered by axe and tests, not yet by hands-on keyboard use |
| Form accessibility | Every input has a programmatically associated label. Hints and errors are linked with `aria-describedby`. Errors use `role="alert"`. Tooltips sit beside, not inside, labels | Tested |
| Motion | All animations use `motion-safe:` utilities, and a global `prefers-reduced-motion` rule disables animation and transitions. The static layout is complete without them | Implemented. Not verified in a browser |

Fixes found by this process: the confusion matrix was ARIA-role divs with an invalid structure, so it was rebuilt as a real `<table>`. Duplicate navigation landmark names were disambiguated. The tooltip button was moved out of the form label.

## What was not checked (needs a browser and a person)
- Real rendered contrast. The audit uses design tokens and assumed text placement, not pixels.
- Screen-reader behaviour (NVDA, VoiceOver, TalkBack).
- Keyboard-only use of the real app, including focus order and the mobile menu.
- Zoom to 200% and text-spacing overrides, and the responsive layouts.
- The charts. Recharts draws SVG, which jsdom could not lay out, so chart internals were not scanned. Each chart has a caption and the key numbers also appear as text, but there is no data-table alternative.
- Lighthouse scores.

Use [qa_checklist.md](qa_checklist.md) for these.
