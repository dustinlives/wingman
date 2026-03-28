const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { verifyAuth } = require('./middleware/auth');
const { checkUsage } = require('./middleware/subscription');
const { incrementUsage, getUser } = require('./lib/firestore');

/**
 * Claude API proxy function
 * POST /claude
 * Requires Firebase auth token
 * Checks subscription status and daily free usage limit
 * Forwards request to Anthropic Claude API
 */
const claude = functions
  .runWith({ timeoutSeconds: 60, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    // Set CORS headers manually
    const origin = req.headers.origin;
    const allowedOrigins = [
      'https://wingman-pwa.web.app',
      'https://wingman-pwa.firebaseapp.com',
      'https://wingman.app',
      'http://localhost:5000',
    ];

    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // 1. Verify Firebase auth token
      const uid = await verifyAuth(req, res);
      if (!uid) return;

      // 2. Check subscription / usage
      const allowed = await checkUsage(uid, res);
      if (!allowed) return;

      // 3. Validate request body
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'messages array required' });
      }

      // 4. Forward to Anthropic
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

      const data = await anthropicRes.json();

      if (!anthropicRes.ok) {
        functions.logger.error('Anthropic error', data);
        return res.status(502).json({ error: 'AI service error', detail: data });
      }

      // 5. Increment usage count
      await incrementUsage(uid);

      return res.json(data);
    } catch (err) {
      functions.logger.error('Claude function error', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  });

module.exports = { claude };
