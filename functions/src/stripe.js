const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Stripe = require('stripe');
const { verifyAuth } = require('./middleware/auth');
const { cors } = require('./lib/cors');
const { getUser, updateUser, getUserByStripeCustomerId } = require('./lib/firestore');

const stripe = new Stripe(functions.config().stripe.secret_key);

/**
 * Create Stripe checkout session
 * POST /createCheckoutSession
 * Requires Firebase auth token
 */
const createCheckoutSession = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const uid = await verifyAuth(req, res);
      if (!uid) return;

      const userData = await getUser(uid);
      if (!userData) {
        return res.status(403).json({ error: 'User not found' });
      }

      // Create or retrieve Stripe customer
      let customerId = userData.subscription?.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userData.email,
          metadata: { firebaseUid: uid },
        });
        customerId = customer.id;
        await updateUser(uid, { 'subscription.stripeCustomerId': customerId });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{ price: functions.config().stripe.price_id, quantity: 1 }],
        success_url: `https://wingman-pwa.firebaseapp.com/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://wingman-pwa.firebaseapp.com/?checkout=canceled`,
        subscription_data: {
          metadata: { firebaseUid: uid },
        },
      });

      return res.json({ url: session.url });
    } catch (err) {
      functions.logger.error('Checkout session error', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  });
});

/**
 * Create Stripe billing portal session
 * POST /createPortalSession
 * Requires Firebase auth token
 */
const createPortalSession = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const uid = await verifyAuth(req, res);
      if (!uid) return;

      const userData = await getUser(uid);
      const customerId = userData?.subscription?.stripeCustomerId;

      if (!customerId) {
        return res.status(400).json({ error: 'No Stripe customer found' });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: 'https://wingman-pwa.firebaseapp.com/',
      });

      return res.json({ url: session.url });
    } catch (err) {
      functions.logger.error('Portal session error', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  });
});

/**
 * Stripe webhook handler
 * POST /stripeWebhook
 * Handles subscription lifecycle events
 * NOTE: Must receive raw request body for signature verification
 */
const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      functions.config().stripe.webhook_secret
    );
  } catch (err) {
    functions.logger.error('Webhook signature verification failed', err);
    return res.status(400).send('Webhook Error');
  }

  const db = admin.firestore();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const uid = session.subscription_data?.metadata?.firebaseUid
                    || await getUserByStripeCustomerId(session.customer);
        if (!uid) break;

        await updateUser(uid, {
          'subscription.status': 'active',
          'subscription.stripeCustomerId': session.customer,
          'subscription.stripeSubscriptionId': session.subscription,
        });
        functions.logger.log('Subscription activated for user:', uid);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const uid = await getUserByStripeCustomerId(invoice.customer);
        if (!uid) break;

        const sub = await stripe.subscriptions.retrieve(invoice.subscription);
        await updateUser(uid, {
          'subscription.status': 'active',
          'subscription.currentPeriodEnd': new Date(sub.current_period_end * 1000),
        });
        functions.logger.log('Invoice paid for user:', uid);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const uid = await getUserByStripeCustomerId(invoice.customer);
        if (!uid) break;

        await updateUser(uid, { 'subscription.status': 'past_due' });
        functions.logger.log('Payment failed for user:', uid);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const uid = await getUserByStripeCustomerId(sub.customer);
        if (!uid) break;

        await updateUser(uid, { 'subscription.status': 'canceled' });
        functions.logger.log('Subscription canceled for user:', uid);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const uid = await getUserByStripeCustomerId(sub.customer);
        if (!uid) break;

        await updateUser(uid, {
          'subscription.currentPeriodEnd': new Date(sub.current_period_end * 1000),
        });
        functions.logger.log('Subscription updated for user:', uid);
        break;
      }

      default:
        functions.logger.log('Unhandled webhook event:', event.type);
    }

    return res.json({ received: true });
  } catch (err) {
    functions.logger.error('Webhook processing error', err);
    return res.status(500).json({ received: false });
  }
});

module.exports = { createCheckoutSession, createPortalSession, stripeWebhook };
