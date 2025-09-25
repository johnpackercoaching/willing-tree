# Willing Tree Bug Tracker

## Critical Bugs

### WTBUG-001-AUTH-RELOAD-TIMEOUT

**Status**: ✅ FIXED (2025-09-25)
**Severity**: CRITICAL
**Discovered**: 2025-09-25
**Affects**: All authenticated users who refresh their browser

#### Summary
Application shows "Initialization Error - Application initialization timed out" when authenticated users reload the page.

#### Reproduction Steps
1. Navigate to https://willing-tree-pi.vercel.app
2. Log in with valid credentials (willingtree.test.2024@gmail.com / TestUser2024!Secure)
3. Wait for successful authentication
4. Reload the page (F5)
5. Wait 20 seconds
6. Error screen appears

#### Technical Details
- **Timeout Location**: `src/App.tsx:172-177` (20 second timeout)
- **Hanging Function**: `initializeAuth()` at `src/App.tsx:161`
- **Test Failure**: `tests/e2e/welcome-screen-qa.spec.ts:323`
- **Error Screen**: Shows "Retry" and "Clear Data & Retry" buttons

#### Key Observations
- Works fine on initial load
- Only fails after authenticated reload
- Firebase initializes successfully but `initializeAuth()` doesn't complete
- Test passes without authentication, fails with authentication

#### Impact
- Users lose their session on browser refresh
- Must clear data and re-login
- Affects browser crash recovery, bookmarks, network interruptions

#### Resolution
**Fixed in commit**: c4c0565

**Root Cause**:
The `initializeAuth()` function was not returning a proper promise that resolved when authentication was ready. Additionally, stale auth listeners persisted after page reload, preventing proper re-initialization.

**Fix Applied**:
1. Modified `initializeAuth()` to return a promise that resolves when auth state is determined
2. Clean up existing auth listeners before creating new ones on reload
3. Added proper initialization tracking to prevent concurrent attempts
4. Synchronized timeout handling between App.tsx and authStore

**Files Modified**:
- `src/stores/authStore.ts` - Core fix for promise resolution and listener cleanup
- `src/App.tsx` - Removed debug logging after fix verification

#### Reference
Full details available in `project-memory-willingtree.yaml` under `critical_bug_initialization_timeout_2025_09_25`

---

## Production Issues

### WTFIX-001-ROBOTS-TXT

**Status**: ✅ FIXED (2025-09-25)
**Severity**: MEDIUM
**Discovered**: 2025-09-25
**Test**: tests/e2e/production-health.spec.ts:40

#### Summary
No robots.txt file exists, causing the server to return HTML instead of crawling instructions for search engines.

#### Impact
- Search engines cannot read crawling instructions
- SEO optimization is compromised
- May affect search engine indexing

#### Resolution
**Fixed**: Created `/public/robots.txt` with proper crawling instructions
- Allows all user agents to crawl main content
- Disallows admin and API routes for security
- Includes sitemap location for better SEO
- File is now served correctly at /robots.txt

#### Effort
5 minutes - trivial fix ✅ COMPLETED

---

## Test Results Summary

### WTTEST-001-PROD-HEALTH

**Date**: 2025-09-25
**Result**: 8/13 tests passed
**Security**: 🟢 EXCELLENT - All security headers configured correctly

#### Key Findings
- ✅ Security headers (CSP, HSTS, X-Frame-Options) all present
- ✅ SSL certificate valid until Nov 2025
- ✅ Performance metrics good (~500ms DOM load)
- ❌ Missing robots.txt file
- ❌ Network timeouts (related to WTBUG-001, now fixed)

Full details in `project-memory-willingtree.yaml` under `production_health_test_2025_09_25`

---

## How to Use This File

When starting a new conversation about a bug, reference the Bug ID (e.g., "WTBUG-001") and Claude Code will:
1. Search for the bug ID in this file and project memory
2. Load all relevant context and test results
3. Continue debugging where the previous session left off

## Bug ID Format
`WTBUG-[NUMBER]-[SHORT-DESCRIPTION]`
- WTBUG: Willing Tree Bug
- NUMBER: Sequential bug number
- SHORT-DESCRIPTION: Brief identifier (e.g., AUTH-RELOAD-TIMEOUT)