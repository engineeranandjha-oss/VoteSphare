import { Election } from '@/models/index.js';
import {
  generateQRCodeBuffer,
  generateQRCodeSvg,
  generateElectionQRCodes,
} from '@/lib/sharing/qrcode';
import {
  getPublicElectionUrl,
  getDirectVotingBoothUrl,
  getResultsUrl,
} from '@/lib/sharing/links';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, NotFoundError } from '@/lib/utils/error-handler';

/**
 * GET /api/elections/[electionId]/qrcode
 * Serve raster PNG, vector SVG, or complete JSON QR code suites for an election.
 */
export async function GET(request, { params }) {
  try {
    const { electionId } = params;
    const { searchParams } = new URL(request.url);

    const election = await Election.findByPk(electionId);
    if (!election) {
      throw new NotFoundError('Election not found');
    }

    // Determine host baseUrl dynamically from headers or default
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = host ? `${protocol}://${host}` : undefined;

    const type = searchParams.get('type') || 'overview'; // 'overview' | 'vote' | 'results'
    const format = searchParams.get('format') || 'png'; // 'png' | 'svg' | 'json'
    const size = Math.min(Math.max(Number(searchParams.get('size')) || 512, 128), 2048);
    const isDownload = searchParams.get('download') === 'true';

    // JSON response mode: returns full suite
    if (format === 'json') {
      const suite = await generateElectionQRCodes(electionId, baseUrl, { width: size });
      return successResponse(suite, 'QR code suite generated successfully');
    }

    // Target URL determination
    let targetUrl;
    let fileNameSuffix = 'ballot';

    if (type === 'vote') {
      targetUrl = getDirectVotingBoothUrl(electionId, baseUrl);
      fileNameSuffix = 'voting-booth';
    } else if (type === 'results') {
      targetUrl = getResultsUrl(electionId, baseUrl);
      fileNameSuffix = 'results';
    } else {
      targetUrl = getPublicElectionUrl(electionId, baseUrl);
      fileNameSuffix = 'overview';
    }

    // SVG Vector format
    if (format === 'svg') {
      const svgString = await generateQRCodeSvg(targetUrl, { width: size });
      const headers = {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      };
      if (isDownload) {
        headers['Content-Disposition'] = `attachment; filename="VoteSphere_QR_${fileNameSuffix}_${electionId}.svg"`;
      }
      return new Response(svgString, { status: 200, headers });
    }

    // Default: PNG Raster format
    const pngBuffer = await generateQRCodeBuffer(targetUrl, { width: size });
    const headers = {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    };
    if (isDownload) {
      headers['Content-Disposition'] = `attachment; filename="VoteSphere_QR_${fileNameSuffix}_${electionId}.png"`;
    }
    return new Response(pngBuffer, { status: 200, headers });
  } catch (error) {
    return handleApiError(error);
  }
}
