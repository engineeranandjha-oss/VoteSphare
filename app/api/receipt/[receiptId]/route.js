import { verifyBallotReceipt } from '@/lib/voting/verification';
import { generateQRCodeDataUrl } from '@/lib/sharing/qrcode';
import { getBaseUrl } from '@/lib/sharing/links';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, NotFoundError } from '@/lib/utils/error-handler';

/**
 * GET /api/receipt/[receiptId]
 * Retrieve verifiable ballot certificate by permalink ID.
 */
export async function GET(request, { params }) {
  try {
    const { receiptId } = params;

    const result = await verifyBallotReceipt(receiptId);

    if (!result) {
      throw new NotFoundError(
        'No verified ballot receipt found matching the given identifier.'
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
      'Ballot receipt retrieved successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
