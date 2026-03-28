const functions = require('firebase-functions');
const fetch = require('node-fetch');
const admin = require('firebase-admin');
const { checkUsage } = require('./middleware/subscription');
const { incrementUsage } = require('./lib/firestore');

const STAGE_CONTEXT = {
  'Interest': 'The goal is to stand out and spark curiosity. Focus on being genuinely interesting, showing you\'ve read their profile, and creating intrigue that makes them want to respond.',
  'Attraction': 'Build on initial interest. Create moments that make them smile or feel something. Show personality, wit, and confidence without trying too hard.',
  'Rapport': 'Deepen the connection. Find common ground, share small vulnerabilities, make them feel understood. Move toward genuine conversation rather than impressing.',
  'Desire': 'Create emotional and physical attraction. Be more direct about interest, suggest meeting, build anticipation. Show you\'re thinking about them.',
  'Momentum': 'Keep the energy moving forward. Suggest specific plans, build on previous conversations, show consistent interest. Eliminate uncertainty and move toward real-world connection.',
  'Close': 'Finalize logistics and build confidence. Be direct about meeting, remove barriers, show genuine interest in the real person. This is about follow-through and authentic intention.'
};

function buildSystemPrompt(stage) {
  return `You are a conversational strategist helping someone communicate with calm confidence, emotional intelligence, and subtle playful tension on dating apps and in early romantic conversations.

Communication style to maintain: observational, grounded, warm, lightly playful, quietly decisive. No try-hard energy, no interview-style questions, no validation seeking, no long philosophical texts.

STAGE CONTEXT: The user is at the "${stage}" stage. ${STAGE_CONTEXT[stage] || ''}

CONVERSATION CONTEXT:
In the screenshot or context provided:
- Messages on the RIGHT side are from the USER (the person asking for help)
- Messages on the LEFT side are from the person they're messaging back to
- You're generating a response that the USER should send next (which would appear on the RIGHT)

Generate exactly 4 response options labeled:

A — Most Natural
B — Slightly Playful  
C — Warm & Direct
D — Momentum Forward

Each option should be 1-3 sentences max. After the 4 options, include:

✓ Momentum strategy (one line)
✓ Ask a question OR make a statement
✓ Slow down OR advance

CRITICAL: Return ONLY valid JSON with no markdown code blocks, no explanations, no extra text.

Return EXACTLY this JSON structure:
{
  "A": "your response here",
  "B": "your response here",
  "C": "your response here",
  "D": "your response here",
  "strategy": "momentum strategy here",
  "approach": "question or statement",
  "pacing": "slow down or advance"
}`;
}

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
      const { message, stage, screenshotBase64 } = body;
      if (!message || !stage) {
        return res.status(400).json({ error: 'message and stage required' });
      }

      // Build system prompt server-side
      const systemPrompt = buildSystemPrompt(stage);

      // Build message content with screenshot if available
      let messageContent = `${systemPrompt}\n\nWHAT THEY WANT TO SAY: ${message}`;
      const messages = [{ role: 'user', content: messageContent }];

      if (screenshotBase64) {
        // Replace content array with screenshot + text
        messages[0].content = [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: screenshotBase64 // Already base64 without prefix
            }
          },
          {
            type: 'text',
            text: `${systemPrompt}\n\nWHAT THEY WANT TO SAY: ${message}`
          }
        ];
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
