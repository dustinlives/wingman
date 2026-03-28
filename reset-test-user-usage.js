#!/usr/bin/env node

/**
 * Reset test user daily usage counter
 * Usage: node reset-test-user-usage.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || 
  `${process.env.HOME}/.config/firebase/wingman-pwa-service-account.json`;

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (err) {
  console.error('Error initializing Firebase. Make sure FIREBASE_SERVICE_ACCOUNT is set or the default path exists.');
  console.error('Try using: firebase init admin-sdk');
  process.exit(1);
}

const TEST_USER_EMAIL = 'norman.dustin@gmail.com';

async function resetTestUserUsage() {
  try {
    console.log(`\nSearching for test user: ${TEST_USER_EMAIL}\n`);

    // Find user by email
    const usersRef = admin.firestore().collection('users');
    const query = await usersRef.where('email', '==', TEST_USER_EMAIL).limit(1).get();

    if (query.empty) {
      console.log('❌ Test user not found in database');
      console.log('Make sure the user has signed in at least once.\n');
      process.exit(1);
    }

    const userDoc = query.docs[0];
    const uid = userDoc.id;
    const userData = userDoc.data();

    console.log(`✓ Found user UID: ${uid}`);
    console.log(`✓ Email: ${userData.email}`);
    console.log(`✓ Current usage: `, userData.usage);

    // Reset usage for today
    const today = new Date().toISOString().split('T')[0];
    
    await userDoc.ref.update({
      'usage.date': today,
      'usage.count': 0,
    });

    console.log(`\n✓ Reset usage counter for ${today}`);
    console.log(`✓ Test user ${TEST_USER_EMAIL} can now generate 5 new messages today\n`);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

resetTestUserUsage();
