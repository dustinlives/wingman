# Wingman — AI Dating Message Coach

A mobile-first PWA that helps users craft compelling messages on dating apps using AI coaching.

## Features

- 📱 **PWA**: Install on home screen, works offline
- 🤖 **AI-Powered**: Claude generates 3 tailored message options per coaching stage
- 💳 **Stripe Subscriptions**: $19/month for unlimited usage
- 🔐 **Secure**: Firebase Auth + Cloud Functions
- ⚡ **Fast**: Single-page app, zero build step

## Quick Start

### Prerequisites

- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- Anthropic API key (Claude)
- Stripe account (test or live keys)

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/dustinlives/wingman.git
   cd wingman
   ```

2. **Install dependencies**
   ```bash
   cd functions
   npm install
   cd ..
   ```

3. **Configure Firebase**
   ```bash
   firebase login
   firebase use <your-project-id>
   ```

4. **Set environment variables**
   ```bash
   firebase functions:config:set anthropic.key="sk-ant-..."
   firebase functions:config:set stripe.secret_key="sk_..."
   firebase functions:config:set stripe.webhook_secret="whsec_..."
   firebase functions:config:set stripe.price_id="price_..."
   ```

5. **Run locally**
   ```bash
   firebase emulators:start
   ```
   Open `http://localhost:5000`

6. **Deploy**
   ```bash
   firebase deploy
   ```

## Project Structure

```
wingman/
├── public/                  # PWA frontend (single HTML file)
├── functions/              # Firebase Cloud Functions (TypeScript)
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore indexes
├── firebase.json           # Firebase config
└── README.md
```

## Architecture

See [wingman-architecture.md](./wingman-architecture.md) for complete technical specification.

### Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (no build step)
- **Hosting**: Firebase Hosting
- **Auth**: Firebase Authentication
- **Database**: Firestore
- **Backend**: Cloud Functions (Node.js 20)
- **Payments**: Stripe
- **AI**: Anthropic Claude

## Development

### Local Testing

1. Start Firebase emulators:
   ```bash
   firebase emulators:start
   ```

2. Get runtime config for local development:
   ```bash
   firebase functions:config:get > functions/.runtimeconfig.json
   ```

3. Test with Stripe CLI (webhook simulation):
   ```bash
   stripe listen --forward-to localhost:5001/wingman-app/us-central1/stripeWebhook
   ```

### Deployment

```bash
# Deploy everything
firebase deploy

# Deploy specific component
firebase deploy --only hosting      # Frontend
firebase deploy --only functions    # Cloud Functions
firebase deploy --only firestore:rules
```

## Environment Variables

Create `.env.local` (never commit):

```
ANTHROPIC_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
```

## License

MIT
