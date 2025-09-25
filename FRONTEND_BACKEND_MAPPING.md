# Frontend → Backend Dependencies Map

## Overview
This document maps all backend endpoints and services that the frontend attempts to call, identifying which are working (Firebase SDK) vs missing (external APIs).

## 1. Firebase Functions (httpsCallable) - MISSING BACKEND

### Email Service (`src/services/email.service.ts`)
All these Firebase Cloud Functions need to be implemented:

| Function Name | Purpose | Parameters | Status |
|---------------|---------|------------|--------|
| `sendPairingInvite` | Send pairing invitation email | `{toEmail, fromName, pairingCode, message, appUrl}` | ❌ NOT IMPLEMENTED |
| `sendWeeklyReminder` | Send weekly reminder emails | `{userId, partnerName, weekNumber}` | ❌ NOT IMPLEMENTED |
| `sendGuessResults` | Send game results notification | `{userId, score, correctGuesses, weekNumber}` | ❌ NOT IMPLEMENTED |
| `sendCustomPasswordReset` | Custom password reset email | `{email}` | ❌ NOT IMPLEMENTED |
| `send2FAConfirmation` | 2FA setup confirmation | `{userId}` | ❌ NOT IMPLEMENTED |

### SMS Service (`src/services/sms.service.ts`)
All these Firebase Cloud Functions need to be implemented:

| Function Name | Purpose | Parameters | Status |
|---------------|---------|------------|--------|
| `sendPairingInviteSMS` | Send pairing invitation via SMS | `{toPhone, fromName, pairingCode, message, appUrl}` | ❌ NOT IMPLEMENTED |
| `sendMutualPairingCode` | Send pairing confirmation code | `{toPhone, code, partnerName}` | ❌ NOT IMPLEMENTED |
| `sendWeeklyReminderSMS` | Send weekly reminder SMS | `{toPhone, partnerName, weekNumber}` | ❌ NOT IMPLEMENTED |
| `sendGameResultsSMS` | Send game results via SMS | `{toPhone, score, correctGuesses}` | ❌ NOT IMPLEMENTED |

## 2. REST API Endpoints - MISSING BACKEND

### Subscription Service (`src/services/subscriptionService.ts`)
These REST endpoints need a backend server (Express/Node.js):

| Endpoint | Method | Purpose | Request Body | Status |
|----------|--------|---------|--------------|--------|
| `/api/create-checkout-session` | POST | Create Stripe checkout | `{priceId, userId, userEmail, successUrl, cancelUrl, mode}` | ❌ NOT IMPLEMENTED |
| `/api/cancel-subscription` | POST | Cancel Stripe subscription | `{userId}` | ❌ NOT IMPLEMENTED |
| `/api/billing-info/{userId}` | GET | Get billing information | - | ❌ NOT IMPLEMENTED |

**Base URL**: Configured via `VITE_API_BASE_URL` environment variable (currently empty/undefined)

## 3. Firebase SDK Services - WORKING ✅

### Authentication Service (`src/services/auth.service.ts`)
Using Firebase Auth SDK directly - **WORKING**:
- `createUserWithEmailAndPassword` ✅
- `signInWithEmailAndPassword` ✅
- `signOut` ✅
- `sendPasswordResetEmail` ✅
- `sendEmailVerification` ✅
- `updateProfile` ✅
- `onAuthStateChanged` ✅
- Phone Multi-Factor Authentication ✅

### Firestore Service (`src/services/firestoreService.ts`)
Using Firestore SDK directly - **WORKING**:
- User profiles CRUD ✅
- Innermosts (relationships) management ✅
- Willing boxes management ✅
- Weekly scores tracking ✅
- Subscription status updates ✅

### Data Collections in Firestore:
- `users` - User profiles
- `innermosts` - Relationship pairings
- `willingBoxes` - Willing items storage
- `weeklyScores` - Game scores tracking

## 4. External Dependencies

### Stripe Integration
- **SDK**: `@stripe/stripe-js` loaded lazily
- **Config**:
  - `VITE_STRIPE_PUBLISHABLE_KEY` - Required for client-side
  - `VITE_STRIPE_PREMIUM_PRICE_ID` - Product pricing ID
- **Status**: ❌ Backend endpoints not implemented

### Firebase Configuration
All these environment variables are required:
- `VITE_FIREBASE_API_KEY` ✅
- `VITE_FIREBASE_AUTH_DOMAIN` ✅
- `VITE_FIREBASE_PROJECT_ID` ✅
- `VITE_FIREBASE_STORAGE_BUCKET` ✅
- `VITE_FIREBASE_MESSAGING_SENDER_ID` ✅
- `VITE_FIREBASE_APP_ID` ✅
- `VITE_FIREBASE_MEASUREMENT_ID` ✅

## 5. Summary

### Working Services ✅
1. **Firebase Auth** - All authentication flows working
2. **Firestore Database** - All CRUD operations working
3. **Firebase Analytics** - Tracking working

### Missing Backend Implementation ❌
1. **Firebase Cloud Functions** (9 functions total):
   - 5 Email notification functions
   - 4 SMS notification functions

2. **REST API Server** (3 endpoints):
   - Stripe payment processing endpoints
   - Billing information endpoint

3. **Infrastructure**:
   - No backend server deployed
   - No Cloud Functions deployed
   - No Stripe webhook handlers

## 6. Implementation Priority

### High Priority
1. Deploy Firebase Cloud Functions for email notifications
2. Implement Stripe payment endpoints

### Medium Priority
1. SMS notification functions (optional feature)
2. Custom password reset flow

### Low Priority
1. 2FA confirmation emails (auth already handles this)

## 7. Error Handling

The frontend has graceful fallbacks for missing services:
- Email/SMS services fail silently for non-critical notifications
- Subscription service shows user-friendly error messages
- Payment features are conditionally enabled based on config
- Firebase services have retry logic with exponential backoff

## 8. Development Notes

### To implement the backend:

1. **Firebase Functions Setup**:
   ```bash
   firebase init functions
   # Implement each httpsCallable function
   firebase deploy --only functions
   ```

2. **Express Server for Stripe**:
   - Create Node.js/Express server
   - Implement Stripe webhook handlers
   - Deploy to Cloud Run or App Engine
   - Update `VITE_API_BASE_URL`

3. **Email Service Provider**:
   - Configure SendGrid/Mailgun/etc
   - Add API keys to Firebase Functions config

4. **SMS Provider**:
   - Configure Twilio/MessageBird/etc
   - Add credentials to Firebase Functions config