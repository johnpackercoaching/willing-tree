# Willing Tree Bug Tracker

## Critical Bugs

### WTBUG-001-AUTH-RELOAD-TIMEOUT

**Status**: 🔴 OPEN
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

#### Next Steps for Debugging
1. Add console logs to track `initializeAuth()` execution
2. Check for hanging promises or race conditions
3. Investigate Firebase auth state restoration conflicts
4. Test IndexedDB state during reload

#### Reference
Full details available in `project-memory-willingtree.yaml` under `critical_bug_initialization_timeout_2025_09_25`

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