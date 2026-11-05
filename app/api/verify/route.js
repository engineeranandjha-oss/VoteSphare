import { verifyBallotReceipt } from '@/lib/voting/verification';
import { generateQRCodeDataUrl } from '@/lib/sharing/qrcode';
import { getBaseUrl } from '@/lib/sharing/links';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, NotFoundError, ValidationError } from '@/lib/utils/error-handler';

/**
 * GET /api/verify?receipt=...&eligibilityId=...
 * Query ballot receipt status and ledger verification certificate.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const receipt =
      searchParams.get('receipt') ||
      searchParams.get('receiptId') ||
      searchParams.get('eligibilityId') ||
      searchParams.get('id');

    if (!receipt) {
      throw new ValidationError('Receipt ID or Eligibility Reference is required');
    }

    const electionId = searchParams.get('electionId');
    const result = await verifyBallotReceipt(receipt, { electionId });

    if (!result) {
      throw new NotFoundError(
        'No verified ballot record found matching the provided receipt or eligibility reference.'
      );
    }

    // Generate QR verification data URL
    const baseUrl = getBaseUrl();
    const verifyPermalink = `${baseUrl}/receipt/${result.receiptId || result.eligibilityId}`;
    let qrCode = null;
    try {
      qrCode = await generateQRCodeDataUrl(verifyPermalink, { width: 320 });
    } catch {
      // Graceful fallback if QR generation fails
    }

    return successResponse(
      {
        ...result,
        permalink: verifyPermalink,
        qrCode,
      },
      'Ballot receipt successfully verified in ledger'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/verify
 * JSON verification endpoint
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const receipt = body.receipt || body.receiptId || body.eligibilityId || body.id;

    if (!receipt) {
      throw new ValidationError('Receipt ID or Eligibility Reference is required');
    }

    const result = await verifyBallotReceipt(receipt, { electionId: body.electionId });

    if (!result) {
      throw new NotFoundError(
        'No verified ballot record found matching the provided receipt or eligibility reference.'
      );
    }

    const baseUrl = getBaseUrl();
    const verifyPermalink = `${baseUrl}/receipt/${result.receiptId || result.eligibilityId}`;
    let qrCode = null;
    try {
      qrCode = await generateQRCodeDataUrl(verifyPermalink, { width: 320 });
    } catch {
      // Graceful fallback
    }

    return successResponse(
      {
        ...result,
        permalink: verifyPermalink,
        qrCode,
      },
      'Ballot receipt successfully verified in ledger'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
