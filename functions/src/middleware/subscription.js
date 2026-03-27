const admin = require('firebase-admin');

const FREE_DAILY_LIMIT = 5;

/**
 * Check if user has remaining free uses or is a paid subscriber
 * @param {string} uid - Firebase UID
 * @param {Object} res - Express response
 * @returns {boolean} - true if allowed, false if limit reached
 */
async function checkUsage(uid, res) {
  try {
    const ref = admin.firestore().collection('users').doc(uid);
    const snap = await ref.get();

    if (!snap.exists) {
      res.status(403).json({ error: 'User not found' });
      return false;
    }

    const data = snap.data();
    const sub = data.subscription || {};

    // Paid subscribers: always allow
    if (sub.status === 'active') {
      // Check subscription hasn't lapsed
      const periodEnd = sub.currentPeriodEnd?.toDate?.() || new Date(sub.currentPeriodEnd);
      if (periodEnd > new Date()) return true;
    }

    // Free users: check daily limit
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    const usage = data.usage || {};
    const todayCount = usage.date === today ? (usage.count || 0) : 0;

    if (todayCount >= FREE_DAILY_LIMIT) {
      res.status(402).json({
        error: 'Free limit reached',
        limit: FREE_DAILY_LIMIT,
        used: todayCount,
      });
      return false;
    }

    return true;
  } catch (err) {
    console.error('Usage check failed:', err);
    res.status(500).json({ error: 'Internal error' });
    return false;
  }
}

module.exports = { checkUsage };
