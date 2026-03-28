const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Log errors to Firestore for monitoring
 * Frontend sends errors here for centralized logging
 */
const logError = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', 'https://wingman-pwa.web.app');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, stack, context, uid } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message required' });
    }

    // Write to Firestore
    const errorDoc = {
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      message,
      stack: stack || null,
      context: context || {},
      uid: uid || 'anonymous',
      userAgent: req.headers['user-agent'] || null,
      deployed: true,
    };

    await admin.firestore().collection('errorLogs').add(errorDoc);

    // Also log to Cloud Functions logs for real-time monitoring
    functions.logger.error('Frontend Error:', {
      message,
      uid: uid || 'anonymous',
      context,
    });

    return res.json({ logged: true });
  } catch (err) {
    functions.logger.error('Error logging failed:', err);
    return res.status(500).json({ error: 'Failed to log error' });
  }
});

module.exports = { logError };
