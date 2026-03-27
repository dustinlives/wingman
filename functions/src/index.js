const admin = require('firebase-admin');
admin.initializeApp();

// Export all Cloud Functions
const { claude } = require('./claude');
const { createCheckoutSession, createPortalSession, stripeWebhook } = require('./stripe');
const { createUser } = require('./auth-triggers');

// HTTP functions
exports.claude = claude;
exports.createCheckoutSession = createCheckoutSession;
exports.createPortalSession = createPortalSession;
exports.stripeWebhook = stripeWebhook;

// Auth triggers
exports.createUser = createUser;
