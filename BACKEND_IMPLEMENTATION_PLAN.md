# 🔧 Willing Tree Backend Implementation Plan

## Executive Summary

**Current State**: Production is **completely broken** - Firebase isn't initialized due to missing environment variables in Vercel. The backend is 10-20% complete with Firebase Functions written but not deployed, and Stripe API endpoints completely missing.

**Critical Discovery**: Your login wasn't working in production - it was likely local testing. Production has **zero functional backend** currently.

---

## 🚨 Phase 1: Emergency Fixes (30 minutes)

### Task 1.1: Fix Vercel Environment Variables
**Priority**: 🔴 CRITICAL - Nothing works without this

Add these to Vercel dashboard at https://vercel.com/john-packers-projects/willing-tree/settings/environment-variables:

```bash
VITE_FIREBASE_API_KEY=AIzaSyCb0k6P1IdJP3_a2sJPpON3OLczjDJilu4
VITE_FIREBASE_AUTH_DOMAIN=willing-tree-fork.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=willing-tree-fork
VITE_FIREBASE_STORAGE_BUCKET=willing-tree-fork.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=105791805598
VITE_FIREBASE_APP_ID=1:105791805598:web:acf539a97f52cf9bab438f
VITE_FIREBASE_MEASUREMENT_ID=G-YOUR_MEASUREMENT_ID
```

**Impact**: Restores authentication and database functionality immediately.

### Task 1.2: Fix firebase.json Configuration
**Priority**: 🔴 CRITICAL - Functions can't deploy without this

Edit `/Users/johnye/willing-tree/firebase.json` and add:

```json
{
  "hosting": { /* keep existing */ },
  "firestore": { /* keep existing */ },
  "storage": { /* keep existing */ },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18",
    "ignore": [
      "node_modules",
      ".git",
      "firebase-debug.log"
    ],
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run build"
    ]
  }
}
```

---

## 🚀 Phase 2: Deploy Existing Firebase Functions (1 hour)

### Task 2.1: Configure Function Environment Variables

```bash
# Install Firebase CLI if needed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set SendGrid configuration
firebase functions:config:set sendgrid.api_key="YOUR_SENDGRID_API_KEY"

# Set Twilio configuration
firebase functions:config:set twilio.account_sid="YOUR_TWILIO_SID"
firebase functions:config:set twilio.auth_token="YOUR_TWILIO_AUTH_TOKEN"
firebase functions:config:set twilio.phone_number="+1234567890"

# Set app URL
firebase functions:config:set app.url="https://willing-tree-pi.vercel.app"
```

### Task 2.2: Deploy Functions

```bash
# Build functions
cd functions
npm run build

# Deploy to Firebase
firebase deploy --only functions
```

### Task 2.3: Verify Deployment

Test these endpoints in Firebase Console:
- `sendPairingInvite` - Email invitations
- `sendWeeklyReminder` - Weekly reminders
- `sendGuessResults` - Game results
- `weeklyReminderScheduler` - Cron job (Mondays 9 AM)
- 5 SMS functions for mobile notifications

**Impact**: Enables all email/SMS notification features.

---

## 💳 Phase 3: Create Stripe Backend (4-6 hours)

### Task 3.1: Create Vercel API Routes

Create `/api` directory in project root with these files:

#### `/api/create-checkout-session.ts`
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID, // Your $1/month price ID
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.VITE_APP_URL}/success`,
      cancel_url: `${process.env.VITE_APP_URL}/profile`,
      metadata: { userId },
      customer_email: email,
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
```

#### `/api/cancel-subscription.ts`
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    // Get user's subscription ID from Firestore
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    const subscriptionId = userDoc.data()?.stripeSubscriptionId;

    if (!subscriptionId) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // Cancel subscription at period end
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
}
```

#### `/api/webhook.ts`
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        // Update user subscription status in Firestore
        await admin.firestore()
          .collection('users')
          .doc(session.metadata!.userId)
          .update({
            subscriptionStatus: 'premium',
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
          });
        break;

      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        // Update user to free tier
        await admin.firestore()
          .collection('users')
          .where('stripeSubscriptionId', '==', subscription.id)
          .get()
          .then(snapshot => {
            snapshot.docs.forEach(doc => {
              doc.ref.update({ subscriptionStatus: 'free' });
            });
          });
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
}
```

### Task 3.2: Add Stripe Environment Variables to Vercel

```bash
STRIPE_SECRET_KEY=sk_live_YOUR_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
STRIPE_PRICE_ID=price_YOUR_PRICE_ID
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
```

### Task 3.3: Configure Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://willing-tree-pi.vercel.app/api/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.deleted`
4. Copy webhook secret to Vercel env vars

---

## ✅ Phase 4: Testing & Verification (2 hours)

### Test Checklist

#### Firebase Functions:
- [ ] Send test pairing invitation email
- [ ] Verify weekly reminder scheduler runs
- [ ] Test SMS notifications work
- [ ] Check function logs for errors

#### Stripe Integration:
- [ ] Create test subscription
- [ ] Cancel test subscription
- [ ] Verify webhook updates Firestore
- [ ] Check billing info retrieval

#### End-to-End Flow:
- [ ] User can sign up
- [ ] User can upgrade to premium
- [ ] Premium features unlock
- [ ] Email notifications send
- [ ] Weekly cycle works

---

## 📊 Backend Completion Timeline

| Phase | Duration | Completion | Result |
|-------|----------|------------|---------|
| Phase 1: Emergency Fixes | 30 min | 0% → 40% | Auth & DB working |
| Phase 2: Deploy Functions | 1 hour | 40% → 70% | Notifications working |
| Phase 3: Stripe Backend | 4-6 hours | 70% → 95% | Payments working |
| Phase 4: Testing | 2 hours | 95% → 100% | Production ready |

**Total Time**: ~8 hours of focused work

---

## 🎯 Success Metrics

After implementation, production should have:
- ✅ Working authentication and database
- ✅ 9 Firebase Functions deployed and callable
- ✅ 4 API endpoints for Stripe integration
- ✅ Email notifications via SendGrid
- ✅ SMS notifications via Twilio
- ✅ Subscription management working
- ✅ Weekly automated reminders

---

## 📝 Required Accounts & Keys

### Services Needed:
1. **SendGrid** - Email service ($0-20/month)
   - Sign up at sendgrid.com
   - Get API key from Settings → API Keys

2. **Twilio** - SMS service ($0.0075/SMS)
   - Sign up at twilio.com
   - Get Account SID, Auth Token, Phone Number

3. **Stripe** - Payment processing (2.9% + 30¢)
   - Already have account
   - Need to create $1/month subscription product

4. **Firebase Blaze Plan** - Pay-as-you-go
   - Required for Cloud Functions
   - ~$0-5/month for small usage

---

## 🚀 Quick Start Commands

```bash
# 1. Fix Vercel environment variables (do in dashboard)

# 2. Update firebase.json (add functions config)

# 3. Deploy functions
cd functions
npm run build
firebase functions:config:set sendgrid.api_key="YOUR_KEY"
firebase functions:config:set twilio.account_sid="YOUR_SID"
firebase deploy --only functions

# 4. Create API routes in /api directory

# 5. Deploy to Vercel
git add .
git commit -m "Add backend implementation"
git push
```

---

## ⚠️ Common Issues & Solutions

**Issue**: Functions deploy fails
**Solution**: Upgrade to Firebase Blaze plan

**Issue**: Stripe webhooks not received
**Solution**: Check webhook secret and endpoint URL

**Issue**: Emails not sending
**Solution**: Verify SendGrid API key and sender verification

**Issue**: Firebase Auth still not working
**Solution**: Redeploy Vercel after adding env variables

---

*This plan will take your backend from 10% to 100% complete in approximately 8 hours of focused implementation.*