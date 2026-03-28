const admin = require('firebase-admin');
admin.initializeApp();

// Export all Cloud Functions
const { claude } = require('./claude');
const { createCheckoutSession, createPortalSession, stripeWebhook } = require('./stripe');
const { createUser } = require('./auth-triggers');
const { resetUsage } = require('./admin/reset-usage');
const { logError } = require('./logging');

// HTTP functions
exports.claude = claude;
exports.createCheckoutSession = createCheckoutSession;
exports.createPortalSession = createPortalSession;
exports.stripeWebhook = stripeWebhook;
exports.resetUsage = resetUsage;
exports.logError = logError;

// Auth triggers
exports.createUser = createUser;
