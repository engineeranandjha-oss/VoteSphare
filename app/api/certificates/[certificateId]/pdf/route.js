export const dynamic = 'force-dynamic';

import { Certificate, Organization, Election, User } from '@/models/index.js';
import { generateCertificatePdfBuffer } from '@/lib/certificates/certificate-pdf';
import { handleApiError, NotFoundError } from '@/lib/utils/error-handler';
import { Op } from 'sequelize';

/**
 * GET /api/certificates/[certificateId]/pdf
 * Streams generated Certificate PDF buffer directly to client.
 */
export async function GET(request, { params }) {
  try {
    const { certificateId } = params;

    const cert = await Certificate.findOne({
      where: {
        [Op.or]: [{ certificateId }, { id: certificateId }],
      },
      include: [
        {
          model: Organization,
          as: 'organization',
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'displayName', 'email'],
            },
          ],
        },
        {
          model: Election,
          as: 'election',
        },
      ],
    });

    if (!cert) {
      throw new NotFoundError('Certificate not found');
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const origin = `${proto}://${host}`;

    const pdfBuffer = await generateCertificatePdfBuffer({
      certificate: cert.get({ plain: true }),
      organization: cert.organization ? cert.organization.get({ plain: true }) : {},
      election: cert.election ? cert.election.get({ plain: true }) : {},
      origin,
    });

    const url = new URL(request.url);
    const forceDownload = url.searchParams.get('download') === 'true';
    const dispositionType = forceDownload ? 'attachment' : 'inline';
    const filename = `Certificate-${cert.certificateId || 'download'}.pdf`;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${dispositionType}; filename="${filename}"`,
        // Strict anti-caching headers to guarantee fresh downloads across all browsers & proxies
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

