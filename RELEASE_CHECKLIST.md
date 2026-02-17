# Release & QA Checklist

## 🏗️ Build & Environment
- [x] `npm run lint` passes with zero warnings.
- [x] `npm run test` passes all core Bitcoin logic tests.
- [x] Static build `npm run build` succeeds.
- [x] Build folder (`dist/`) size is reasonable (< 2MB).

## 🧪 Manual QA Checklist
### 1. Creation Flow
- [x] Attempt to use owner key for beneficiary (should fail).
- [x] Attempt to use invalid hex (should fail).
- [x] Verify slider updates approximate time correctly.
- [x] Verify "Sample Keys" generate the deterministic address: `tb1q...` (see README).

### 2. Safety Features
- [x] Verify Mainnet lock requires exact phrase.
- [x] Verify Mainnet badge appears on results page.
- [x] Verify Error Boundary triggers on forced crash.

### 3. Portability
- [x] Download Recovery Kit JSON.
- [x] Upload JSON to /instructions page.
- [x] Verify all details match the original generation.
- [x] Test "Print to PDF" on instructions page.

## ♿ Accessibility & UI
- [x] Contrast ratios for Mainnet (Red) vs Background meet WCAG AA.
- [x] All buttons have hover/active states.
- [x] Input fields have clear labels.

## 🚀 Deployment Notes
- This is a static SPA. Ensure the hosting provider (Netlify/Vercel) handles the base path correctly.
- No backend required. Disable any server-side features.
