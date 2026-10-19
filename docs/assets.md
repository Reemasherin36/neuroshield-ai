# Assets

All visual assets are original and were created for this project. Nothing was scraped, copied, or taken from a reference site. No raster photographs are used, so `frontend/public/images/` is intentionally empty.

| Asset | Where | How it was made |
|---|---|---|
| Logo mark and lockups (light and dark) | `frontend/src/components/Logo.tsx`, `public/brand/logo-*.svg` | Hand-written SVG: shield containing a small neural network |
| Favicon set | `public/brand/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` | PNGs rendered from the SVG with `sharp` (a one-off tool, not a project dependency) |
| Social preview | `public/brand/og-image.svg` and `og-image.png` (1200x630) | Hand-written SVG, rendered to PNG the same way |
| Hero brain illustration | `src/components/BrainIllustration.tsx` | Layered inline SVG: two hemispheres, glow, neural-network overlay. The node layout is decorative, not data |
| Background system | `src/components/Backgrounds.tsx` | CSS gradients, dot grid, blurred orbs |
| Feature icons | `src/components/icons.tsx` | Custom SVG, matching the style of lucide-react |
| 404 and empty-state scenes | `NotFoundIllustration.tsx`, `EmptyStates.tsx` | Small hand-written SVG scenes |
| Fonts | none bundled | The font stack lists Inter first, then system fonts. Inter is **not** loaded, so most visitors see their system font |

Illustrations are decorative or explanatory. They are not evidence and do not depict real scans, doctors, or patients.

## Third-party libraries (direct dependencies, licenses read from `package.json`)
@hookform/resolvers, react, react-dom, react-hook-form, react-router-dom, recharts, zod: MIT. lucide-react: ISC.

## Before deployment
The Open Graph image URL in `frontend/index.html` is relative (`/brand/og-image.png`). Social crawlers need an absolute URL, so set it to your real domain.
