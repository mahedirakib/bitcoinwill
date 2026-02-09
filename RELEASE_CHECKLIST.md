# Release & QA Checklist

## 🏗️ Build & Environment
- [ ] `npm run lint` passes with zero warnings.
- [ ] `npm run test` passes all core Bitcoin logic tests.
- [ ] Static build `npm run build` succeeds.
- [ ] Build folder (`dist/`) size is reasonable (< 2MB).

## 🧪 Manual QA Checklist
### 1. Creation Flow
- [ ] Attempt to use owner key for beneficiary (should fail).
- [ ] Attempt to use invalid hex (should fail).
- [ ] Verify slider updates approximate time correctly.
- [ ] Verify "Sample Keys" generate the deterministic address: `tb1q...` (see README).

### 2. Safety Features
- [ ] Verify Mainnet lock requires exact phrase.
- [ ] Verify Mainnet badge appears on results page.
- [ ] Verify Error Boundary triggers on forced crash.

### 3. Portability
- [ ] Download Recovery Kit JSON.
- [ ] Upload JSON to /instructions page.
- [ ] Verify all details match the original generation.
- [ ] Test "Print to PDF" on instructions page.

## ♿ Accessibility & UI
- [ ] Contrast ratios for Mainnet (Red) vs Background meet WCAG AA.
- [ ] All buttons have hover/active states.
- [ ] Input fields have clear labels.

## 🚀 Deployment Notes
- This is a static SPA. Ensure the hosting provider (Netlify/Vercel) handles the base path correctly.
- No backend required. Disable any server-side features.
