const functions = require('firebase-functions');
const fetch = require('node-fetch');
const admin = require('firebase-admin');
const { checkUsage } = require('./middleware/subscription');
const { incrementUsage } = require('./lib/firestore');

/**
 * Claude API proxy function
 * HTTP endpoint with proper body parsing + CORS
 */
const claude = functions
  .runWith({ timeoutSeconds: 60, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    // CORS headers for preflight
    res.set('Access-Control-Allow-Origin', 'https://wingman-pwa.web.app');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Max-Age', '3600');

    if (req.method === 'OPTIONS') {
      return res.status(200).send('');
    }

    try {
      // Get and verify auth token
      const authHeader = req.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
      }

      const token = authHeader.slice(7);
      let decodedIdToken;
      try {
        decodedIdToken = await admin.auth().verifyIdToken(token);
      } catch (authErr) {
        functions.logger.error('Token verification failed:', authErr);
        return res.status(401).json({ error: 'Invalid auth token' });
      }

      const uid = decodedIdToken.uid;

      // Check subscription / usage
      const allowed = await checkUsage(uid, null);
      if (!allowed) {
        return res.status(402).json({ error: 'Daily limit exceeded' });
      }

      // Parse request body if it's a string
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (parseErr) {
          functions.logger.error('Body parse error:', parseErr);
          return res.status(400).json({ error: 'Invalid JSON in request body' });
        }
      }

      // Validate request data
      const { messages } = body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'messages array required' });
      }

      // Forward to Anthropic
      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': functions.config().anthropic.key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages,
        }),
      });

      const anthropicData = await anthropicRes.json();

      if (!anthropicRes.ok) {
        functions.logger.error('Anthropic error', anthropicData);
        return res.status(500).json({ error: 'AI service error' });
      }

      // Increment usage count
      await incrementUsage(uid);

      return res.status(200).json(anthropicData);
    } catch (err) {
      functions.logger.error('Claude function error', err);
      return res.status(500).json({ error: err.message || 'Internal error' });
    }
  });

module.exports = { claude };
