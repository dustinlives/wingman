const admin = require('firebase-admin');

/**
 * Verify Firebase ID token from Authorization header
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {string|null} - uid if valid, null if invalid
 */
async function verifyAuth(req, res) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing auth token' });
    return null;
  }

  const token = header.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid;
  } catch (err) {
    console.error('Auth verification failed:', err);
    res.status(401).json({ error: 'Invalid auth token' });
    return null;
  }
}

module.exports = { verifyAuth };
