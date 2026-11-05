import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/billing/razorpay';
import { processWebhookEvent } from '@/lib/billing/webhook-handlers';
import { WebhookEvent } from '@/models/index.js';

/**
 * POST /api/webhooks/razorpay
 * Central Razorpay webhook ingress endpoint.
 * Enforces raw body HMAC-SHA256 signature verification and idempotent deduplication.
 */
export async function POST(request) {
  let rawBody = '';

  try {
    // 1. Extract raw body text before any JSON transformation
    rawBody = await request.text();

    const signature =
      request.headers.get('x-razorpay-signature') ||
      request.headers.get('X-Razorpay-Signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing X-Razorpay-Signature header' },
        { status: 400 }
      );
    }

    // 2. Cryptographic signature verification using timing-safe comparison
    const isValid = verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature. Payload tampering detected.' },
        { status: 400 }
      );
    }

    // 3. Parse JSON body
    let body = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: 'Malformed JSON payload' },
        { status: 400 }
      );
    }

    const eventType = body.event;
    // Razorpay event object ID or composite fallback
    const eventId =
      body.event_id ||
      body.id ||
      `rzp_evt_${eventType}_${body.created_at || Date.now()}`;

    if (!eventType) {
      return NextResponse.json(
        { error: 'Missing event type in payload' },
        { status: 400 }
      );
    }

    // 4. Idempotency Check: Verify compound unique (provider, eventId)
    let webhookRecord = null;
    try {
      const existingEvent = await WebhookEvent.findOne({
        where: {
          provider: 'razorpay',
          eventId,
        },
      });

      if (existingEvent) {
        if (existingEvent.processingStatus === 'processed') {
          // Replay detected: event already successfully committed
          return NextResponse.json(
            { received: true, duplicate: true, status: 'processed' },
            { status: 200 }
          );
        }
        webhookRecord = existingEvent;
      } else {
        webhookRecord = await WebhookEvent.create({
          provider: 'razorpay',
          eventId,
          eventType,
          payload: body,
          processingStatus: 'processing',
        });
      }
    } catch {
      // In case of parallel unique constraint race, query the record
      webhookRecord = await WebhookEvent.findOne({
        where: { provider: 'razorpay', eventId },
      });
      if (webhookRecord?.processingStatus === 'processed') {
        return NextResponse.json(
          { received: true, duplicate: true },
          { status: 200 }
        );
      }
    }

    // 5. Atomic Event Processing Dispatch
    try {
      const result = await processWebhookEvent({
        eventId,
        eventType,
        payload: body.payload,
      });

      if (webhookRecord) {
        webhookRecord.processingStatus = 'processed';
        webhookRecord.processedAt = new Date();
        await webhookRecord.save();
      }

      return NextResponse.json(
        {
          received: true,
          eventId,
          eventType,
          result,
        },
        { status: 200 }
      );
    } catch (procErr) {
      if (webhookRecord) {
        webhookRecord.processingStatus = 'failed';
        webhookRecord.errorMessage = procErr.message || 'Processing failed';
        await webhookRecord.save();
      }

      // Return 500 so gateway knows to retry transient errors
      return NextResponse.json(
        {
          error: 'Webhook processing failed',
          message: procErr.message,
          eventId,
        },
        { status: 500 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal webhook ingress error', message: err.message },
      { status: 500 }
    );
  }
}

