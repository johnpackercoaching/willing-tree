# 🌳 Willing Tree - Relationship Growth App

A modern web application for couples to strengthen their relationships through weekly intentional actions and mutual understanding.

## 🚨 Current Status

**⚠️ PRODUCTION BLOCKED** - Security incident remediation in progress
- **Local Development**: ✅ Fully functional
- **Production**: ❌ Awaiting API key update in Vercel
- **Last Incident**: 2024-09-24 - Firebase API keys rotated (local fixed, production pending)

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/johnpackercoaching/willing-tree.git
cd willing-tree
npm install

# Setup environment variables
cp .env.example .env
# Add your Firebase configuration to .env

# Start development server
npm run dev
# Visit http://localhost:5173
```

## 📱 Live Demo & Deployment

- **Production URL**: https://willing-tree-pi.vercel.app (currently down - API key expired)
- **Platform**: Vercel with automated deployments from `main` branch
- **Firebase Project**: `willing-tree-fork`

## 🎯 Core Concept

**Willing Tree** helps couples create deeper connections through a unique privacy-preserving game:

### How It Works

1. **Create Wishes** - Each partner lists 12 things they wish for from their partner
2. **See Partner's Wishes** - View what your partner wishes for (promotes understanding)
3. **Select Willing Items** - Secretly choose 5 from your PARTNER's wishlist to work on
4. **Weekly Action** - Work on your selected items throughout the week
5. **Guess & Score** - Partners guess what each other selected, earning points for correct guesses
6. **Privacy Preserved** - Willing selections remain private, preventing coercion

### Why It's Different
- **Wishes are visible** → Promotes open communication
- **Willing is private** → Preserves autonomy
- **Gamification** → Makes relationship work engaging
- **Weekly cycles** → Creates sustainable habits

## 🏗️ Architecture & Tech Stack

### Current Implementation

```
Frontend (70% Complete)          Backend (0% Complete)
├── React 19.1 + TypeScript      ├── ❌ API Endpoints
├── Tailwind CSS 4.1             ├── ❌ Stripe Webhooks
├── Zustand + React Query        ├── ❌ Email Service
├── Firebase Auth/Firestore      ├── ❌ Cloud Functions
├── Vite 7.1 Build System        └── ❌ SMS Service
└── PWA + Capacitor Ready
```

### Technology Stack
- **Frontend Framework**: React 19.1.1 with TypeScript
- **Styling**: Tailwind CSS 4.1.12
- **State Management**: Zustand 5.0.8 + React Query
- **Database**: Firebase Firestore with real-time sync
- **Authentication**: Firebase Auth (email/password)
- **Payments**: Stripe integration (frontend ready, backend missing)
- **Build Tool**: Vite 7.1.2
- **Deployment**: Vercel + GitHub Actions

## ✅ What's Actually Working

### Core Features
- ✅ **Complete user authentication** (signup, login, password reset)
- ✅ **Full game flow** (wishes → willing → guessing → scoring)
- ✅ **Partner pairing system** (create and manage relationships)
- ✅ **Real-time data sync** between partners
- ✅ **Weekly cycle management** with automatic progression
- ✅ **Scoring system** with correct implementation
- ✅ **Mobile-responsive design** with PWA support

### Premium System (Frontend Only)
- ✅ **Subscription tiers defined** (Free: 1 innermost, Premium: 3)
- ✅ **Feature gating hooks** (`usePremiumFeature`)
- ✅ **Upgrade prompts** throughout the app
- ⚠️ **Payment processing** configured but no backend

## 🚧 Partially Implemented

### Analytics Dashboard
- ✅ UI complete with charts
- ❌ Shows mock data only
- ❌ No real data integration

### Email/SMS Invitations
- ✅ Service layer exists
- ❌ No actual sending capability
- ❌ Requires backend implementation

### Data Export
- ✅ UI shows export option
- ❌ No actual export functionality
- ❌ Premium feature not implemented

## ❌ Not Yet Implemented

### Critical Missing Pieces
- **Backend API Server** - No endpoints exist
- **Payment Processing** - Cannot charge cards
- **Email Notifications** - Cannot send emails
- **Push Notifications** - Not configured
- **Cloud Functions** - No serverless functions
- **Mobile Apps** - Capacitor configured but not built

### Features Requiring Backend
- Weekly reminder emails
- Partner invitation emails
- Subscription management
- Payment webhook handling
- Data export functionality
- Advanced analytics

## 🔐 Security & Privacy

### Current Security Status
- ✅ **Comprehensive security headers** in vercel.json
- ✅ **Firebase security rules** configured
- ✅ **Authentication** properly implemented
- ⚠️ **API Key Rotation** - Complete locally, production pending
- ❌ **Rate limiting** - Placeholder only, not functional

### Recent Security Incident (2024-09-24)
- **Issue**: Firebase API keys exposed in git history
- **Resolution**: Keys rotated, history cleaned
- **Status**: Local environment secure, production needs update

## 🛠️ Development Setup

### Prerequisites
- Node.js 20+
- npm 10+
- Firebase account
- Vercel account (for deployment)

### Environment Variables

Create `.env` file:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=willing-tree-fork.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=willing-tree-fork
VITE_FIREBASE_STORAGE_BUCKET=willing-tree-fork.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=105791805598
VITE_FIREBASE_APP_ID=your_app_id_here
```

### Available Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:5173)
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint
npm run test            # Run tests (minimal coverage)

# Deployment
npm run build:vercel    # Build for Vercel
npm run deploy          # Deploy to Vercel

# Mobile (Configured but not tested)
npm run ios             # Build iOS app
npm run android         # Build Android app
```

## 📊 Project Completion Status

| Component | Status | Progress | Notes |
|-----------|---------|----------|-------|
| **Frontend UI** | 🟢 Working | 85% | All major flows complete |
| **Authentication** | 🟢 Working | 100% | Firebase Auth fully integrated |
| **Database** | 🟢 Working | 90% | Firestore with real-time sync |
| **Game Logic** | 🟢 Working | 95% | Core mechanics implemented |
| **Premium Features** | 🟡 Partial | 40% | Frontend only, no payment processing |
| **Backend API** | 🔴 Missing | 0% | No server exists |
| **Email Service** | 🔴 Missing | 0% | Code exists, not functional |
| **Payment Processing** | 🔴 Missing | 0% | Stripe configured, no backend |
| **Mobile Apps** | 🟡 Configured | 20% | Capacitor ready, not built |
| **Analytics** | 🟡 Mock Only | 30% | UI complete, fake data |

**Overall Completion: ~35%** (Strong frontend, no backend)

## 🎯 Immediate Next Steps

### 🚨 Critical (Deployment Blockers)
1. **Update Vercel environment variables** with new Firebase API key
2. **Test production deployment** after credential update
3. **Implement rate limiting** in Firestore rules

### 📈 High Priority (Make It Work)
1. **Create backend API** with Express/Next.js API routes
2. **Implement Stripe webhooks** for payment processing
3. **Setup email service** (SendGrid/Resend)
4. **Add real data to analytics**

### ⭐ Medium Priority (Polish)
1. **Build and test mobile apps**
2. **Implement push notifications**
3. **Add comprehensive testing**
4. **Create cloud functions for automation**

## 🤝 Contributing

This is a private project. The codebase needs:
- Backend API implementation
- Payment processing setup
- Email service integration
- Comprehensive testing
- Security hardening

## 📝 Technical Debt

- **No backend infrastructure** - Biggest gap
- **Mock data in analytics** - Needs real integration
- **Minimal test coverage** - Only 2 test files
- **Field naming inconsistencies** - wishList vs wishlist
- **No error recovery** - API failures not handled gracefully

## 🔍 Known Issues

1. **Production is down** - API key expired, awaiting update
2. **Payments don't work** - No backend to process
3. **Emails don't send** - Service not implemented
4. **Analytics show fake data** - Not connected to real data
5. **Rate limiting disabled** - Security concern

## 📈 Business Model

**Target**: Couples seeking to strengthen their relationships

**Pricing**:
- **Free Tier**: 1 relationship (innermost)
- **Premium**: $1/month for 3 relationships + analytics

**Current Status**: Frontend shows pricing, but cannot accept payments

## 🏁 Summary

Willing Tree is a **well-designed frontend prototype** with excellent UX and solid technical foundation. The core relationship game is fully implemented in the browser, but the application lacks the backend infrastructure needed for production use. The immediate priority is updating production credentials and implementing a basic API server for payments and emails.

**Ready for**: Demo, user testing, frontend development
**Not ready for**: Production launch, accepting payments, sending emails

---

*Last updated: 2024-09-24 after security incident remediation and comprehensive analysis*