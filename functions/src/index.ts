import * as admin from 'firebase-admin';

admin.initializeApp();

// Cloud Functions will be exported here as we build them
// export { claude } from './claude';
// export { createCheckoutSession, stripeWebhook, createPortalSession } from './stripe';
// export { createUser } from './auth-triggers';

// Placeholder function for testing
export const hello = require('firebase-functions').https.onRequest((req, res) => {
  res.json({ status: 'Cloud Functions initialized. Ready to deploy.' });
});
