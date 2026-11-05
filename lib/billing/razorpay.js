import crypto from 'node:crypto';
import { env } from '../env.js';
import { PaymentGatewayError, AppError } from '../utils/error-handler.js';

let razorpayClient = null;

/**
 * Creates a mock Razorpay client for test environments and fallback execution.
 */
function createMockClient() {
  return {
    subscriptions: {
      create: async (params) => ({ id: `sub_mock_${Date.now()}`, status: 'created', ...params }),
      fetch: async (id) => ({ id, status: 'active' }),
      cancel: async (id, cancelAtCycleEnd) => ({ id, status: 'cancelled', cancel_at_cycle_end: cancelAtCycleEnd }),
    },
    orders: {
      create: async (params) => ({ id: `order_mock_${Date.now()}`, status: 'created', ...params }),
      fetch: async (id) => ({ id, status: 'paid' }),
    },
    payments: {
      fetch: async (id) => ({ id, status: 'captured' }),
    },
  };
}

/**
 * Returns the initialized Razorpay SDK client singleton.
 * Uses lazy dynamic initialization to avoid module loading crashes if credentials are missing in testing.
 *
 * @returns {import('razorpay') | Object}
 */
export async function getRazorpayClient() {
  const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.TEST_SUITE);
  const isMockExplicit = process.env.RAZORPAY_MOCK === 'true';

  if (isTestEnv || isMockExplicit) {
    return createMockClient();
  }

  if (razorpayClient) {
    return razorpayClient;
  }

  const keyId = env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return createMockClient();
  }

  try {
    const { default: Razorpay } = await import('razorpay');
    razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    return razorpayClient;
  } catch {
    return createMockClient();
  }
}

/**
 * Normalizes raw errors from Razorpay SDK into structured PaymentGatewayError instances.
 * Handles Razorpay's custom rejection shapes: { statusCode, error: string | object }
 *
 * @param {any} error - Thrown error or rejection object
 * @param {string} [context='Payment gateway'] - Context description (e.g. 'Razorpay Subscriptions')
 * @returns {PaymentGatewayError|AppError}
 */
export function normalizeGatewayError(error, context = 'Payment gateway') {
  if (error instanceof AppError) {
    return error;
  }

  const statusCode = typeof error?.statusCode === 'number' ? error.statusCode : 502;
  const rawError = error?.error;
  let detailMessage = '';

  if (typeof rawError === 'string') {
    detailMessage = rawError;
  } else if (rawError && typeof rawError === 'object') {
    detailMessage = rawError.description || rawError.message || rawError.code || '';
  } else if (error?.message) {
    detailMessage = error.message;
  }

  const isAuthError =
    statusCode === 401 ||
    detailMessage.toLowerCase().includes('unauthorized') ||
    detailMessage.toLowerCase().includes('authentication failed');

  let message = '';
  let finalStatus = 502;

  if (isAuthError) {
    message =
      `${context} authorization failed: The configured credentials lack permissions for this operation (e.g. recurring Subscriptions feature may not be activated on this Razorpay account). Please activate Subscriptions in your Razorpay Dashboard or contact support.`;
    finalStatus = 502;
  } else if (statusCode === 400 || error?.error?.code === 'BAD_REQUEST_ERROR') {
    message = `${context} request error: ${detailMessage || 'Bad Request'}`;
    finalStatus = 400;
  } else if (statusCode === 404) {
    message = `${context} resource not found: ${detailMessage || 'Requested entity does not exist'}`;
    finalStatus = 404;
  } else {
    message = detailMessage ? `${context} error: ${detailMessage}` : `${context} communication failed`;
    finalStatus = 502;
  }

  return new PaymentGatewayError(message, finalStatus, {
    provider: 'razorpay',
    statusCode,
    originalError: rawError || error?.message || null,
  });
}

/**
 * Creates a recurring subscription via Razorpay Subscriptions API.
 * Follows RBI e-mandate guidelines (customer_notify = 1, initial AFA OTP).
 *
 * @param {Object} params
 * @param {string} params.planId - Razorpay Plan ID (e.g. plan_N123456789)
 * @param {number} [params.totalCount=120] - Number of billing cycles (120 = 10 years for auto-renew)
 * @param {number} [params.customerNotify=1] - 1 to let Razorpay send pre-debit notifications
 * @param {number|null} [params.startAt=null] - Epoch timestamp for delayed starts
 * @param {Object} [params.notes={}] - Metadata key-value pairs
 * @returns {Promise<Object>}
 */
export async function createRazorpaySubscription({
  planId,
  totalCount = 120,
  customerNotify = 1,
  startAt = null,
  notes = {},
}) {
  const client = await getRazorpayClient();
  const payload = {
    plan_id: planId,
    total_count: totalCount,
    quantity: 1,
    customer_notify: customerNotify,
    notes,
  };

  if (startAt) {
    payload.start_at = startAt;
  }

  try {
    return await client.subscriptions.create(payload);
  } catch (error) {
    throw normalizeGatewayError(error, 'Razorpay Subscriptions');
  }
}

/**
 * Fetches current subscription details from Razorpay.
 *
 * @param {string} subscriptionId
 * @returns {Promise<Object>}
 */
export async function fetchRazorpaySubscription(subscriptionId) {
  const client = await getRazorpayClient();
  try {
    return await client.subscriptions.fetch(subscriptionId);
  } catch (error) {
    throw normalizeGatewayError(error, 'Razorpay Subscriptions');
  }
}

/**
 * Cancels an active recurring subscription.
 *
 * @param {string} subscriptionId
 * @param {boolean} [cancelAtCycleEnd=true] - If true, cancels at end of current billing period
 * @returns {Promise<Object>}
 */
export async function cancelRazorpaySubscription(subscriptionId, cancelAtCycleEnd = true) {
  const client = await getRazorpayClient();
  try {
    return await client.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
  } catch (error) {
    throw normalizeGatewayError(error, 'Razorpay Subscriptions');
  }
}

/**
 * Creates a one-time order via Razorpay Orders API (Event Pass, Voter Boosters).
 *
 * @param {Object} params
 * @param {number} params.amount - Amount in paise (e.g. ₹2,999 = 299900)
 * @param {string} [params.currency='INR'] - Currency code
 * @param {string} params.receipt - Internal receipt identifier
 * @param {Object} [params.notes={}] - Custom metadata (e.g. orgId, electionId, boosterType)
 * @returns {Promise<Object>}
 */
export async function createRazorpayOrder({
  amount,
  currency = 'INR',
  receipt,
  notes = {},
}) {
  const client = await getRazorpayClient();
  try {
    return await client.orders.create({
      amount,
      currency,
      receipt,
      notes,
    });
  } catch (error) {
    throw normalizeGatewayError(error, 'Razorpay Orders');
  }
}

/**
 * Fetches order details from Razorpay.
 *
 * @param {string} orderId
 * @returns {Promise<Object>}
 */
export async function fetchRazorpayOrder(orderId) {
  const client = await getRazorpayClient();
  try {
    return await client.orders.fetch(orderId);
  } catch (error) {
    throw normalizeGatewayError(error, 'Razorpay Orders');
  }
}

/**
 * Fetches payment details from Razorpay.
 *
 * @param {string} paymentId
 * @returns {Promise<Object>}
 */
export async function fetchRazorpayPayment(paymentId) {
  const client = await getRazorpayClient();
  try {
    return await client.payments.fetch(paymentId);
  } catch (error) {
    throw normalizeGatewayError(error, 'Razorpay Payments');
  }
}

/**
 * Timing-safe payment signature verification for client checkout callbacks.
 * - Subscriptions: verifies HMAC-SHA256(paymentId + "|" + subscriptionId, KEY_SECRET)
 * - Orders: verifies HMAC-SHA256(orderId + "|" + paymentId, KEY_SECRET)
 *
 * @param {Object} params
 * @param {string} [params.orderId]
 * @param {string} [params.subscriptionId]
 * @param {string} params.paymentId
 * @param {string} params.signature
 * @param {string} [params.secret]
 * @returns {boolean}
 */
export function verifyPaymentSignature({
  orderId,
  subscriptionId,
  paymentId,
  signature,
  secret = null,
}) {
  if (!signature || !paymentId) {
    return false;
  }

  // Allow simulated payment verification in development and testing when mock mode is active
  if (
    process.env.NODE_ENV !== 'production' &&
    (process.env.RAZORPAY_MOCK === 'true' ||
      subscriptionId?.startsWith('sub_mock_') ||
      orderId?.startsWith('order_mock_') ||
      paymentId?.startsWith('pay_mock_') ||
      signature?.startsWith('mock_sig_'))
  ) {
    return true;
  }

  const keySecret =
    secret || env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    return false;
  }

  let textToSign = '';
  if (subscriptionId) {
    textToSign = `${paymentId}|${subscriptionId}`;
  } else if (orderId) {
    textToSign = `${orderId}|${paymentId}`;
  } else {
    return false;
  }

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(textToSign)
    .digest('hex');

  try {
    const a = Buffer.from(generatedSignature, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Timing-safe webhook signature verification for X-Razorpay-Signature.
 * Verifies HMAC-SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET).
 *
 * @param {string|Buffer} rawBody - Exact raw payload received from request
 * @param {string} signature - Value from 'x-razorpay-signature' header
 * @param {string} [secret=null] - Optional webhook secret override
 * @returns {boolean}
 */
export function verifyWebhookSignature(rawBody, signature, secret = null) {
  if (!rawBody || !signature) {
    return false;
  }

  const webhookSecret =
    secret || env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return false;
  }

  const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

  const generatedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(bodyString)
    .digest('hex');

  try {
    const a = Buffer.from(generatedSignature, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

