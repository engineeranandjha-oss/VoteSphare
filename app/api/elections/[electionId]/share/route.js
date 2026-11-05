import { Election, Organization } from '@/models/index.js';
import { generateShareableLinks } from '@/lib/sharing/links';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, NotFoundError } from '@/lib/utils/error-handler';

/**
 * GET /api/elections/[electionId]/share
 * Retrieve canonical voting and results links, embed snippets, and vanity URLs.
 */
export async function GET(request, { params }) {
  try {
    const { electionId } = params;
    const { searchParams } = new URL(request.url);

    const election = await Election.findByPk(electionId, {
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug', 'type', 'logo'],
        },
      ],
    });

    if (!election) {
      throw new NotFoundError('Election not found');
    }

    // Determine host baseUrl dynamically from headers or default
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = host ? `${protocol}://${host}` : undefined;

    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');

    const utm = {};
    if (utmSource) utm.utm_source = utmSource;
    if (utmMedium) utm.utm_medium = utmMedium;
    if (utmCampaign) utm.utm_campaign = utmCampaign;

    const links = generateShareableLinks(election, baseUrl, { utm });

    return successResponse(links, 'Shareable election links generated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
