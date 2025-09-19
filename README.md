# Willing Box - Relationship Growth App

A hybrid PWA for couples to grow their relationships through weekly intentional actions.

## 🚀 Live Demo

**Production URL**: https://willing-tree-pi.vercel.app

## 📦 Deployment Status

- **Platform**: Vercel
- **Firebase Project**: willing-tree-fork
- **Auto-Deploy**: Enabled (pushes to main branch auto-deploy)

## 🎯 Core Concept

**Willing Tree** helps couples create deeper connections through:

- **12-item Wishlists**: Each partner creates wishes for what they'd like from their partner
- **Partner's Wishes ARE Visible**: You can see what your partner wishes for
- **5-item Willing Lists**: Secretly select from your PARTNER'S wishlist what you're willing to do
- **Weekly Guessing Game**: Partners guess what the other was willing to work on
- **Privacy Where It Matters**: Willing selections remain private to preserve autonomy

## 🎮 Complete Game Flow - Step by Step

### Phase 1: Getting Started
1. **Sign Up** → Create account with email and password
2. **Profile Setup** → Enter name, age, gender (helps with AI suggestions)
3. **Pair with Partner** → Send invite via email or share QR code
4. **Partner Accepts** → Both partners are now connected in an "Innermost"

### Phase 2: Creating Wishlists (One-Time Setup)
5. **Create Your Wishlist** → Write 12 wishes of what you'd like from your partner
   - Example: "I wish you would give me a hug when you come home"
   - AI suggests age/gender-appropriate wishes if you need ideas
   - Mark 2 wishes as "Most Wanted" (worth double points)
6. **Partner Creates Their Wishlist** → Your partner does the same
7. **Review Partner's Wishes** → You can now SEE what your partner wishes for
   - This promotes understanding and communication
   - You learn what matters to your partner

### Phase 3: Weekly Cycle (Repeats Every Week)

#### Monday - Selection Day
8. **Select Your Willing List** → SECRETLY choose 5 items from your PARTNER'S wishlist
   - You're choosing what you're willing to work on this week
   - Rank them 1-5 by priority
   - Your partner CANNOT see your selections (privacy preserved)
9. **Partner Selects Too** → They secretly choose from YOUR wishlist

#### Tuesday-Saturday - Action Days  
10. **Work on Your Willing Items** → Throughout the week, do the things you selected
    - No pressure or monitoring from partner
    - Work at your own pace
    - Focus on the items you prioritized

#### Sunday - Guessing & Reveal Day
11. **Guess Partner's Willing** → Look at YOUR wishlist and guess which 5 items your partner selected
    - "I think they were willing to work on these 5 wishes of mine"
12. **Partner Guesses Too** → They guess which of their wishes you selected
13. **See Results** → The app reveals:
    - What you guessed vs. what they actually selected
    - What they guessed vs. what you actually selected
    - Points earned (see scoring below)
14. **Review & Reflect** → Discuss what worked, celebrate efforts

### Phase 4: Continue Growing
15. **Next Week** → Return to Phase 3, Step 8
    - Keep the same wishlists for consistency
    - Select new willing items based on what you learned
    - Build momentum week after week

### Scoring System
- **Correct Guess**: 1 point (2 points if it was a "Most Wanted" item)
- **Partner Guessed You Correctly**: 2 points (4 points if "Most Wanted")
- **Why?** This rewards DOING the behaviors more than monitoring your partner

### What Makes This Special
- **Wishes are visible** → Promotes open communication about needs
- **Willing is private** → Preserves autonomy and prevents coercion
- **Weekly cycles** → Creates sustainable habits
- **Gamification** → Makes relationship work fun and engaging

## 🏗️ Architecture

### Hybrid PWA + Native Apps
```
React PWA (Core) + Capacitor.js (Native Wrapper)
├── Web: Installable PWA with offline support
├── iOS: Native app via Capacitor  
├── Android: Native app via Capacitor
└── Single codebase for all platforms
```

### Tech Stack
- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **State**: Zustand + React Query  
- **Backend**: Firebase (Auth, Firestore, Functions)
- **Payments**: Stripe ($1/month subscription)
- **Mobile**: Capacitor.js for native features
- **Animations**: Framer Motion

## 🔐 Privacy & Scoring Rules

### Privacy Rules (CRITICAL)
- Partners **NEVER** see each other's Willing lists
- This preserves autonomy and prevents prescriptive behavior
- Only your own Willing list is visible to you

### Scoring System  
- **Guesser**: 1 point per correct guess (2 if "Most Wanted")
- **Performer**: 2 points per correct guess about them (4 if "Most Wanted")
- **Incentive**: Rewards performing behaviors over monitoring partner

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- iOS: Xcode (for iOS development)
- Android: Android Studio (for Android development)

### Development Setup

1. **Clone and Install**
```bash
git clone [repository-url]
cd willing-box-pwa
npm install
```

2. **Environment Variables**
```bash
cp .env.local.example .env.local
# Edit .env.local with your Firebase and Stripe keys
```

3. **Start Development Server**
```bash
npm run dev
```

4. **Add Mobile Platforms** (optional)
```bash
# iOS
npm run cap:add ios
npm run ios

# Android  
npm run cap:add android
npm run android
```

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Copy config to `.env.local`

### Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Create a product with $1/month recurring price
3. Copy publishable key to `.env.local`

## 📱 Features

### ✅ Completed
- **Hybrid PWA Foundation**: Vite + React + TypeScript
- **Core Business Logic**: Scoring engine with privacy rules
- **State Management**: Zustand stores with persistence
- **Authentication**: Firebase Auth integration
- **Subscription System**: Stripe integration ($1/month)
- **Responsive Design**: Mobile-first with safe areas
- **PWA Features**: Manifest, service worker, installable

### 🚧 In Development  
- Complete UI for all user flows
- Firebase security rules
- Backend cloud functions
- Push notifications
- Advanced analytics

## 🏃‍♂️ Usage

### Quick User Flow Summary
1. **Sign Up**: Create account with email/password
2. **Pair**: Invite partner via email or QR code  
3. **Create Wishlist**: Each partner lists 12 wishes
4. **View Partner's Wishes**: See what your partner wishes for
5. **Select Willing**: Secretly pick 5 from PARTNER'S wishlist
6. **Weekly Cycle**: 
   - Work on selected items
   - Guess partner's selections
   - Reveal scores
   - Select new willing items next week

### Subscription Model
- **Free**: 1 Innermost (relationship pairing)
- **Premium** ($1/month): Up to 3 Innermosts + analytics

## 🛠️ Development Setup

### Prerequisites
- Node.js 20+ and npm 10+
- Firebase account
- Vercel account (for deployment)

### Environment Variables
Create a `.env.local` file with:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=willing-tree-fork.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=willing-tree-fork
VITE_FIREBASE_STORAGE_BUCKET=willing-tree-fork.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=105791805598
VITE_FIREBASE_APP_ID=your_app_id
```

### Development Commands

```bash
# Development
npm install             # Install dependencies
npm run dev              # Start dev server
npm run build           # Build for production  
npm run preview         # Preview production build
npm run lint           # Run ESLint

# Mobile Development
npm run ios            # Build and run iOS app
npm run android        # Build and run Android app  
npm run cap:sync       # Sync web assets to mobile
npm run cap:copy       # Copy web assets only

# Production
npm run build:prod     # Full production build with linting
```

## 🎨 Design System

### Colors (Organic Growth Theme)
- **Tree Green** (#4A8B4A): Primary actions and growth elements
- **Bark Brown** (#8B6F47): Warm accents and earth tones  
- **Stone Grey** (#6B7280): Text and neutral elements
- **Background** (#FAF7F5): Warm bark-tinted background
- **Text** (#1F2937): High-contrast readable text

### Breakpoints
- **Mobile**: < 640px (primary target)
- **Tablet**: 640px - 1024px  
- **Desktop**: > 1024px

## 📊 Business Model

**Revenue**: $1/user/month subscription

**Target**: 500 paying users = $500/month break-even

**Projections**:
- 10,000 users × 20% conversion = 2,000 paid × $1 = $2,000/month
- Break-even at ~500 paying users

## 🔒 Security Features

- Firebase Authentication with security rules
- Stripe PCI-compliant payment processing  
- HTTPS everywhere (required for PWA)
- Content Security Policy headers
- XSS and CSRF protection

## 📝 License

Private - All rights reserved.

## 🤝 Contributing

This is a private project. Contact the development team for contribution guidelines.

---

**Built with ❤️ for relationship growth**
