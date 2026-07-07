# Contributing to Bitcoin Will

Bitcoin Will is an open-source, client-side Bitcoin inheritance tool. Thank
you for considering a contribution. This document explains how to get set up
and how we review changes.

> This is financial software. Users trust it with their Bitcoin inheritance.
> Be conservative with changes, thorough with testing, and clear in your
> descriptions.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Development Guidelines](#development-guidelines)
- [Testing](#testing)
- [Security](#security)
- [Recognition](#recognition)

## Code of Conduct

Participation in this project is governed by the
[Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected
to uphold that code. Please report unacceptable behavior privately via the
channels listed in that document.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Basic understanding of Bitcoin, React, and TypeScript

### Fork and Clone

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/bitcoinwill.app.git
   cd bitcoinwill.app
   ```
3. Add the upstream remote to stay in sync:
   ```bash
   git remote add upstream https://github.com/mahedirakib/bitcoinwill.app.git
   ```

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Lint code
npm run lint

# Everything at once (lint + tests + build)
npm run ready-check
```

The app will be available at `http://localhost:5173`.

## How to Contribute

### What We're Looking For

- **Bug fixes** - Especially for Bitcoin logic or edge cases
- **Test coverage** - More tests for the `lib/bitcoin/` module
- **Documentation** - Improvements to clarity and completeness
- **UI/UX enhancements** - Better user experience (especially for
  non-technical users)
- **Security improvements** - Audits, reviews, and hardening
- **Performance optimizations** - Faster builds, smaller bundles

### What We're NOT Looking For

- New dependencies (unless absolutely necessary and justified)
- Backend/server components (this is a client-side only app)
- Analytics or tracking code
- Breaking changes to the Recovery Kit format (requires a migration plan
  and explicit maintainer approval)
- Features that require private keys (the app must remain non-custodial)

### Pull Request Workflow

1. **Sync with upstream** before starting:
   ```bash
   git checkout main
   git pull upstream main
   ```

2. **Create a branch** from `main` with a descriptive name:
   ```bash
   git checkout -b feature/add-qr-code-display
   git checkout -b fix/validation-error-message
   git checkout -b docs/improve-readme
   ```

3. **Make your changes** with clear, focused commits (see
   [Commit Message Format](#commit-message-format) below).

4. **Test your changes** thoroughly:
   - Run `npm run ready-check` and ensure everything passes
   - Test on both Testnet and Regtest networks for Bitcoin changes
   - Verify the build works: `npm run build`
   - Add or update tests for any logic changes

5. **Update documentation** if needed:
   - `README.md` for user-facing changes
   - `PROTOCOL.md` for Bitcoin logic changes
   - `CHANGELOG.md` for notable user-facing changes

6. **Open a pull request** against `main`:
   - Provide a clear description of the changes and motivation
   - Reference any related issues (`Closes #123`, `Refs #456`)
   - Include screenshots for UI changes
   - Confirm `npm run ready-check` passes locally

7. **Respond to review feedback** constructively. Reviewers may request
   changes; push additional commits rather than force-pushing during review
   unless asked.

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, no logic change)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Build process, dependencies, etc.

Examples:
```
feat(bitcoin): add Taproot address support

fix(ui): correct button alignment on mobile

docs: add security audit results to SECURITY.md
```

### Issues

- **Bugs:** Open an issue with a clear title, reproduction steps, expected vs
  actual behavior, and your environment (browser, OS, network).
- **Feature requests:** Open an issue with the `enhancement` label and explain
  the use case, not just the solution.
- **Questions:** Please search closed issues first; if none match, open a new
  issue tagged as a question.

## Development Guidelines

Detailed code patterns, project structure, and hard constraints are
documented in [AGENTS.md](./AGENTS.md). The short version:

- **Type everything** explicitly.
- **Use path aliases** (`@/components/...`, not `../../../components/...`).
- **Named exports only** (no `export default`), except for page components.
- **No `@ts-ignore`, `@ts-expect-error`, or `as any`.** Fix the root cause.
- **Handle all errors** with user-visible messages.
- **Add `type="button"`** to all buttons.
- **Co-locate tests** with source files (`foo.ts` -> `foo.test.ts`).

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test -- --coverage

# Run a specific file
npm run test -- src/lib/bitcoin/planEngine.test.ts

# Run E2E tests
npm run test:e2e
```

### Writing Tests

- All Bitcoin logic must have unit tests
- Test both success and failure cases
- Use descriptive test names
- Mock external dependencies (e.g. explorer API calls)

Example:

```typescript
import { describe, it, expect } from 'vitest';
import { buildPlan } from './planEngine';

describe('buildPlan', () => {
  it('should generate valid P2WSH address for testnet', () => {
    const result = buildPlan({
      network: 'testnet',
      inheritance_type: 'timelock_recovery',
      owner_pubkey: '02e963...',
      beneficiary_pubkey: '03e963...',
      locktime_blocks: 144,
    });

    expect(result.address).toMatch(/^tb1/);
    expect(result.descriptor).toContain('wsh');
  });

  it('should throw error for invalid public key', () => {
    expect(() => buildPlan({ /* invalid input */ })).toThrow();
  });
});
```

See [TESTING.md](./TESTING.md) for the full testing strategy.

## Security

### Reporting Vulnerabilities

**DO NOT disclose security vulnerabilities through public issues or PRs.**

Use the private channels described in [SECURITY.md](./SECURITY.md)
(GitHub Security Advisories are preferred).

### Security Best Practices for Contributors

- Never commit private keys (even test keys). Use fixtures with fake data.
- Review all dependencies before adding; justify them in your PR.
- Ensure the app remains client-side only (no server, no telemetry).
- Validate all user inputs.
- Follow Bitcoin script best practices and double-check CSV/timelock values.

## Recognition

Contributors are recognized in `CHANGELOG.md` entries for the release that
includes their work, and in the GitHub release notes. Significant
contributions may be highlighted in the README.

Thank you for helping make Bitcoin inheritance safer and easier for everyone.
