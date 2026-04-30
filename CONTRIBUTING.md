# Internal Development Guide

Bitcoin Will is a private-source Bitcoin inheritance tool. This document is for authorized maintainers and reviewers working in the private repository.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Guidelines](#development-guidelines)
- [Testing](#testing)
- [Security](#security)
- [Questions](#questions)

## Code of Conduct

This project is committed to providing a respectful and security-focused development environment. We expect authorized contributors to:

- Be respectful and constructive in all interactions
- Focus on what's best for the Bitcoin community
- Accept constructive criticism gracefully
- Prioritize user security and privacy

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Basic understanding of Bitcoin, React, and TypeScript

### Clone

1. Confirm you have access to the private repository.
2. Clone the repository locally:
   ```bash
   git clone <private-repository-url>
   cd bitcoinwill
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
```

The app will be available at `http://localhost:5173`.

## Development Guidelines

### What We're Looking For

- **Bug fixes** - Especially for Bitcoin logic or edge cases
- **Test coverage** - More tests for the bitcoin/ module
- **Documentation** - Improvements to clarity and completeness
- **UI/UX enhancements** - Better user experience (especially for non-technical users)
- **Security improvements** - Audits, reviews, and hardening
- **Performance optimizations** - Faster builds, smaller bundles

### What We're NOT Looking For

- New dependencies (unless absolutely necessary)
- Backend/server components (this is a client-side only app)
- Analytics or tracking code
- Breaking changes to the Recovery Kit format

### Change Review Process

1. **Create a branch** from `main` with a descriptive name:
   ```bash
   git checkout -b feature/add-qr-code-display
   git checkout -b fix/validation-error-message
   git checkout -b docs/improve-readme
   ```

2. **Make your changes** with clear, focused commits:
   ```bash
   git commit -m "feat: add QR code display for vault addresses
   
   - Adds qrcode.react dependency
   - Displays QR code in Results step
   - Allows downloading QR as PNG"
   ```

3. **Test your changes** thoroughly:
   - Run `npm run test` and ensure all tests pass
   - Test on both Testnet and Regtest networks
   - Verify the build works: `npm run build`

4. **Update documentation** if needed:
   - README.md for user-facing changes
   - PROTOCOL.md for Bitcoin logic changes
   - This file for process changes

5. **Submit for review**:
   - Provide a clear description of the changes
   - Reference any related private issues or tasks
   - Include screenshots for UI changes
   - Ensure CI checks pass before merge

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

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test -- --coverage
```

### Writing Tests

- All Bitcoin logic must have unit tests
- Test both success and failure cases
- Use descriptive test names
- Mock external dependencies

Example:
```typescript
import { describe, it, expect } from 'vitest';
import { buildPlan } from './planEngine';

describe('buildPlan', () => {
  it('should generate valid P2WSH address for testnet', () => {
    // Test implementation
  });
  
  it('should throw error for invalid public key', () => {
    // Test implementation
  });
});
```

## Security

### Reporting Vulnerabilities

**DO NOT** disclose security vulnerabilities through external channels.

Instead, use the private repository's vulnerability reporting flow or contact the maintainers directly.

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Security Best Practices for Contributors

- Never commit private keys (even test keys)
- Review all dependencies before adding
- Ensure client-side only execution
- Validate all user inputs
- Follow Bitcoin script best practices

## Questions?

- **General questions:** Ask in the private maintainer channel.
- **Bug reports:** Open a private issue or task.
- **Feature requests:** Open a private issue or task with the `enhancement` label.

## Recognition

Authorized contributors may be recognized in private release notes when appropriate.

Thank you for helping make Bitcoin inheritance safer and easier to maintain.
