const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Admin function to reset test user daily usage
 * Restricted to authenticated admin users only
 * Call from: POST /api/admin/reset-usage
 */
const resetUsage = functions
  .runWith({ timeoutSeconds: 30 })
  .https.onRequest(async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', 'https://wingman-pwa.web.app');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).send('');
    }

    try {
      // Verify auth token
      const authHeader = req.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing auth token' });
      }

      const token = authHeader.slice(7);
      let decodedIdToken;
      try {
        decodedIdToken = await admin.auth().verifyIdToken(token);
      } catch (authErr) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Only allow specific admin email
      const adminEmails = ['norman.dustin@gmail.com']; // Can call for themselves
      if (!adminEmails.includes(decodedIdToken.email)) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Parse body
      const { email } = req.body || {};
      if (!email) {
        return res.status(400).json({ error: 'email required in body' });
      }

      // Find user by email
      const usersRef = admin.firestore().collection('users');
      const query = await usersRef.where('email', '==', email).limit(1).get();

      if (query.empty) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userDoc = query.docs[0];
      const uid = userDoc.id;
      const today = new Date().toISOString().split('T')[0];

      // Reset usage
      await userDoc.ref.update({
        'usage.date': today,
        'usage.count': 0,
      });

      return res.status(200).json({
        success: true,
        uid,
        email,
        message: `Reset usage for ${email}`,
      });
    } catch (err) {
      functions.logger.error('Reset usage error:', err);
      return res.status(500).json({ error: err.message });
    }
  });

module.exports = { resetUsage };
