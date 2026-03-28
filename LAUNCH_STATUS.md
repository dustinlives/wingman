# Wingman App — Launch Status & Documentation

**Current Status:** Ready for Public Launch (Phase 5 & 6 Complete)  
**Last Updated:** March 28, 2026  
**Deploy URL:** https://wingman-pwa.web.app

---

## Executive Summary

Wingman is a production-ready AI dating coach PWA that helps users craft confident, authentic dating messages. The app integrates Claude AI for message generation, Stripe for subscriptions, and Firebase for backend infrastructure.

**Marketing Strategy:** Instagram-driven growth (user-managed)

---

## 📋 Project Phases

### ✅ Phase 1: Stripe Live Keys
- **Status:** Completed
- **What:** Moved from test mode to live Stripe keys
- **Impact:** Real payments now processing
- **Config:** `stripe.secret_key` and `stripe.price_id` set in Firebase Functions config

### ✅ Phase 2: Legal & Compliance
- **Status:** Completed
- **Privacy Policy:** Custom in-app screen with:
  - Data collection policies (email, screenshots, usage)
  - Screenshot handling (sent to Anthropic, not stored permanently)
  - Third-party services listed (Anthropic, Stripe, Firebase)
  - User rights (data access, deletion on request)
  
- **Terms of Service:** Custom in-app screen with:
  - Service description and limitations
  - Subscription terms ($19/month, auto-renewal)
  - 7-day money-back guarantee
  - Acceptable use policy
  - Liability limitations

### ✅ Phase 3: Error Logging to Firestore
- **Status:** Completed
- **Implementation:**
  - Cloud Function: `logError` captures frontend errors
  - Firestore Collection: `errorLogs` stores all errors with:
    - Timestamp, user ID, error message, stack trace
    - Context metadata (error origin, error code)
    - User agent for debugging
  - Frontend Error Handlers:
    - Global `window.onerror` for uncaught exceptions
    - `window.onunhandledrejection` for promise failures
    - Try-catch in all async functions (auth, API calls, payments)
  
- **Monitored Areas:**
  - Authentication (Google, email sign-in/up)
  - Message generation (Claude API)
  - Payment flow (Stripe checkout & billing portal)
  - Dashboard updates (home screen, account screen)
  - Service worker registration

### ✅ Phase 4: Analytics Setup
- **Status:** Completed
- **Events Tracked:**
  - `sign_in_google` — Google authentication
  - `sign_in_email` — Email sign-in attempts
  - `sign_up_email` — New email registrations
  - `select_stage` — Conversation stage selection (with stage parameter)
  - `upload_screenshot` — Screenshot uploads (with file size in KB)
  - `generate_message` — Message generation calls (with stage, screenshot presence, attempt count)
  - `initiate_checkout` — Subscription checkout initiated
  - `open_billing_portal` — Billing portal access
  
- **Dashboard:** Firebase Analytics console available at:
  - Go to: Firebase Console > Wingman Project > Analytics
  - All events real-time trackable

### ✅ Phase 5: Public Launch (No Beta)
- **Status:** Complete
- **Marketing:** Instagram-driven (user-managed)
- **Launch URL:** https://wingman-pwa.web.app
- **All systems production-ready**

---

## 🏗️ Architecture

### Frontend (PWA)
- **Framework:** Vanilla JavaScript + Firebase SDK
- **Storage:** LocalStorage for session state
- **Features:**
  - Progressive Web App (installable on iOS/Android)
  - Offline-capable with service worker
  - Responsive mobile-first design
  - Six conversation stages (Interest → Close)

### Backend (Firebase)
- **Authentication:** Firebase Auth (Google OAuth, Email/Password)
- **Database:** Firestore for users, subscriptions, usage tracking
- **Functions:** Node.js Cloud Functions for:
  - `createCheckoutSession` — Stripe checkout
  - `createPortalSession` — Stripe billing portal
  - `stripeWebhook` — Subscription updates
  - `claude` — Message generation (Claude API)
  - `logError` — Error logging
  - `resetUsage` — Daily usage reset
  - `createUser` — User creation on signup
  
- **Payments:** Stripe (live mode)
- **Media:** Firebase Storage (screenshots)

### Monitoring & Logging
- **Error Logs:** Firestore `errorLogs` collection
- **Analytics:** Firebase Analytics dashboard
- **Cloud Logs:** Firebase Cloud Functions logs

---

## 🚀 Deployment

### Current Deployment Status
```
✅ Hosting: Firebase Hosting (wingman-pwa.web.app)
✅ Functions: Cloud Functions (all 7 functions live)
✅ Database: Firestore (production mode)
✅ Auth: Firebase Auth (production)
✅ Payments: Stripe (live keys active)
✅ Analytics: Firebase Analytics (tracking events)
✅ Error Logging: Firestore + Cloud Logs
```

### Last Deploy
- **Date:** March 28, 2026
- **Changes:** Analytics event tracking added
- **Command:** `firebase deploy --only hosting,functions`

### How to Deploy Updates
```bash
cd "Wingman App"

# Deploy only hosting changes
firebase deploy --only hosting

# Deploy only Cloud Functions changes
firebase deploy --only functions

# Deploy everything
firebase deploy --only hosting,functions
```

---

## 📊 Key Features

### User Acquisition
- **Sign-up Methods:**
  - Google OAuth (1-click)
  - Email/Password (traditional)
  
- **Free Tier:** 
  - 5 messages per day
  - All conversation stages available
  - Screenshot analysis available
  
- **Paid Tier ($19/month):**
  - Unlimited messages
  - 7-day money-back guarantee
  - Stripe-managed subscriptions

### Core Functionality
1. **Stage Selection** — Pick conversation stage (Interest → Close)
2. **Message Input** — Describe what you want to say
3. **Screenshot Upload** — Optional image of conversation (sent to Claude)
4. **AI Generation** — Claude generates 4 response options:
   - Most Natural
   - Slightly Playful
   - Warm & Direct
   - Momentum Forward
5. **Strategy Tips** — Context-specific coaching
6. **Copy-to-Clipboard** — One-click copy of selected response

### Payment Flow
1. Click "Upgrade" button
2. Redirected to Stripe checkout (secure)
3. On success → Redirect back to app, subscription active
4. Manage subscription via "Billing Portal" in Account

### Error Handling
- All errors logged to Firestore with context
- User-friendly error messages shown in app
- Network failures auto-retry (up to 2 attempts with exponential backoff)
- Rate limit (402 status) shows upgrade prompt

---

## 📈 Analytics & Monitoring

### How to Monitor
1. **Cloud Functions Logs:**
   ```bash
   firebase functions:log
   ```

2. **Error Logs (Firestore):**
   - Console → Firestore → `errorLogs` collection
   - View all errors by user, time, error type

3. **Analytics Dashboard:**
   - Console → Analytics → View all tracked events
   - Real-time user activity

### Key Metrics to Track
- DAU (Daily Active Users)
- Conversion rate (free → paid)
- Message generation success rate
- Error frequency by type
- Most used conversation stages

---

## 🔧 Configuration

### Stripe Setup (Live)
- **Secret Key:** `sk_live_...` (in Functions config)
- **Price ID:** `price_1...` (in Functions config)
- **Webhook:** Stripe → webhook events processed by `stripeWebhook` function

### Firebase Config (Frontend)
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCZb0VAS3ejUV61zckzH78ruWXOxd8z92k",
  authDomain: "wingman-pwa.firebaseapp.com",
  projectId: "wingman-pwa",
  storageBucket: "wingman-pwa.firebasestorage.app",
  messagingSenderId: "373501217787",
  appId: "1:373501217787:web:b465bddce7a86e5a68195e"
};
```

### Claude API Setup
- **Endpoint:** `/api/claude` (Cloud Function)
- **Auth:** Firebase ID token required
- **Rate Limit:** 402 status returned if daily limit exceeded

---

## 📱 Progressive Web App

### Mobile Installation
- **iOS:** Safari → Share → Add to Home Screen
- **Android:** Chrome → Menu → Install App

### Capabilities
- Installable (icon on home screen)
- Offline support (cached assets load)
- Push notifications (optional future feature)
- Full-screen mode

---

## 🔐 Security & Privacy

### Data Handling
- **Passwords:** Firebase Auth (encrypted at rest)
- **Screenshots:** Sent to Anthropic (not stored in Firestore)
- **Email:** Stored in Firebase Auth
- **Subscription Data:** Stored in Firestore (user documents)

### Access Control
- Firebase Security Rules (default: read/write only own data)
- Google Cloud IAM for Cloud Functions

### Compliance
- GDPR-ready (user deletion available)
- Terms & Privacy Policy in-app
- User consent on first load

---

## 🚨 Troubleshooting

### Message Generation Fails
1. Check internet connection
2. Verify Claude API key in Functions config
3. Check Firestore error logs for details
4. Check Cloud Functions logs: `firebase functions:log`

### Payments Not Processing
1. Verify Stripe live keys in Functions config
2. Check Stripe dashboard for webhook failures
3. View error logs in Firestore

### Users Can't Sign In
1. Check Firebase Auth is enabled
2. Verify API keys updated in frontend
3. Check Firebase auth quotas not exceeded

### Analytics Not Recording
1. Open browser console (look for logEvent calls)
2. Check Firebase Analytics is enabled in project
3. Wait 24 hours (analytics data can take time to process)

---

## 📞 Support & Maintenance

### Regular Tasks
- **Daily:** Check error logs in Firestore
- **Weekly:** Review analytics dashboard
- **Monthly:** Check Stripe subscription revenue
- **Quarterly:** Review user feedback & update messaging

### Common Updates
- **Add new conversation stages:** Edit stage context in `generateMessages()`
- **Adjust pricing:** Update `price_id` in Functions config
- **Change daily limit:** Edit limit check in `claude.js` function
- **Modify coaching tips:** Edit strategy generation in API prompt

---

## 🎯 Next Steps (Post-Launch)

### Immediate (Week 1)
- [ ] Share launch link on Instagram
- [ ] Monitor error logs daily
- [ ] Check analytics for first users

### Short-term (Month 1)
- [ ] Gather user feedback
- [ ] Fix any bugs from real usage
- [ ] Optimize Claude prompts based on user behavior

### Medium-term (Q2 2026)
- [ ] Add share/referral system (track with analytics)
- [ ] A/B test different pricing tiers
- [ ] Expand conversation stage library

### Long-term
- [ ] Native mobile apps (iOS/Android)
- [ ] Additional AI features
- [ ] Community features (shared templates)

---

## 📚 Documentation Files

- `wingman-architecture.md` — System architecture overview
- `LAUNCH_STATUS.md` — This file (launch & status)
- `README.md` — Project readme
- Firebase Console — Full project configuration

---

## 🎉 Launch Checklist

```
✅ Code deployed to production
✅ Error logging active (Firestore)
✅ Analytics tracking enabled
✅ Stripe live keys configured
✅ Users can sign up & pay
✅ Privacy Policy & Terms visible
✅ Service worker deployed
✅ All mobile features working
✅ Database security rules set
✅ Cloud Functions configured
✅ Error monitoring set up
```

---

**Ready for Instagram launch! 🚀**

For questions or issues, check Firebase Console logs or error logs in Firestore.
