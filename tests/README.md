# Willing Tree E2E Tests

This directory contains end-to-end tests for the Willing Tree application using Playwright.

## Setup

Tests are already configured and ready to run. Playwright browsers are installed automatically.

## Test User Credentials

- **Email**: willingtree.test.2024@gmail.com
- **Password**: TestUser2024!Secure

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with UI (interactive mode)
```bash
npm run test:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests for specific browser
```bash
npm run test:chrome    # Chromium only
npm run test:firefox   # Firefox only
npm run test:safari    # WebKit/Safari only
```

### Run mobile tests
```bash
npm run test:mobile
```

### Debug tests
```bash
npm run test:debug
```

### View test report
```bash
npm run test:report
```

## Test Structure

- `/helpers/auth.helper.ts` - Authentication helper functions
- `/e2e/auth.spec.ts` - Authentication and login/logout tests

## Test Features

- ✅ Login flow validation
- ✅ Logout flow
- ✅ Invalid credentials handling
- ✅ Form validation
- ✅ Navigation after login
- ✅ Session persistence
- ✅ Protected route handling
- ✅ Signup flow (if accessible)
- ✅ Password visibility toggle
- ✅ Mobile responsive testing

## Configuration

Tests are configured to run against: https://willing-tree-pi.vercel.app

Configuration includes:
- Screenshots on failure
- Video recording on failure
- Network trace collection on retry
- Multiple browser support (Chrome, Firefox, Safari)
- Mobile viewport testing
- Parallel test execution

## Artifacts

Test artifacts (screenshots, videos, traces) are saved in:
- `test-results/` - Test outputs and artifacts
- `playwright-report/` - HTML test report

These directories are gitignored and not committed to the repository.
