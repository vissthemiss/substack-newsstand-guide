# Task 7 Report: Brand assets

Status: Complete

Commit: `2979bca` — `assets: add murmur wordmark and warm oak shelf texture`

## Delivered

- `public/assets/wordmark.png`: 1024×123 RGBA PNG with the supplied `murmur.` lettering retained and the near-black plate converted to transparency.
- `public/assets/worn-wood.jpg`: 1600×512 generated warm-oak texture with horizontal grain, tonal variation, pores, and restrained knots for shelf backgrounds.

## Verification

- Confirmed the wordmark is RGBA with alpha values from 0–255 and 35,795 fully transparent pixels.
- Confirmed the wood texture is RGB, has warm golden channel means `[179.8, 118.0, 57.4]`, and non-flat pixel variation (`std 51.7`).
- Visually reviewed both generated assets.

Concerns: None.

## Critical fix follow-up

- Reprocessed `public/assets/wordmark.png` with Sharp, converting pixels whose maximum RGB channel was ≤40 to full transparency and trimming empty edges.
- Verified the result is a 1022×122 RGBA PNG with alpha values 0–255, 85,562 fully transparent pixels, and zero visible pixels remaining at or below the near-black threshold.
- Visual review: only the distressed `murmur.` letterforms and period remain; the rectangular black plate is gone and the surrounding/interior negative space is transparent.
- Checks: `npm test` (7 files, 25 tests passed) and `npm run build` passed.
