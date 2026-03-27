const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Auth trigger: Create user document on first sign-in
 * Triggered automatically by Firebase Auth
 */
const createUser = functions.auth.user().onCreate(async (user) => {
  try {
    await admin.firestore().collection('users').doc(user.uid).set({
      email: user.email || null,
      displayName: user.displayName || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      subscription: {
        status: 'free',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodEnd: null,
      },
      usage: {
        date: null,
        count: 0,
      },
    });
    functions.logger.log('User document created for:', user.uid);
  } catch (err) {
    functions.logger.error('Error creating user document:', err);
  }
});

module.exports = { createUser };
