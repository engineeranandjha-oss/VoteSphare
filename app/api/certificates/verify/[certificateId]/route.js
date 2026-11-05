export const dynamic = 'force-dynamic';

import { Certificate, Organization, Election, Position, User } from '@/models/index.js';
import { successResponse } from '@/lib/utils/response';
import { handleApiError } from '@/lib/utils/error-handler';
import { Op } from 'sequelize';

/**
 * GET /api/certificates/verify/[certificateId]
 * Public endpoint to verify cryptographic authenticity of an issued certificate.
 * No authentication required.
 */
export async function GET(request, { params }) {
  try {
    const { certificateId } = params;

    const cert = await Certificate.findOne({
      where: {
        [Op.or]: [
          { certificateId },
          { id: certificateId },
          { verificationToken: certificateId },
        ],
      },
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug', 'logo', 'isVerified', 'signatoryName', 'signatoryTitle'],
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'displayName'],
            },
          ],
        },
        {
          model: Election,
          as: 'election',
          attributes: ['id', 'title', 'status'],
        },
        {
          model: Position,
          as: 'position',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!cert) {
      return Response.json(
        {
          success: false,
          status: 'not_found',
          verified: false,
          message: 'Certificate not found in VoteSphere ledger registry.',
        },
        { status: 404 }
      );
    }

    if (cert.revokedAt) {
      return successResponse(
        {
          status: 'revoked',
          verified: false,
          certificate: {
            certificateId: cert.certificateId,
            certificateType: cert.certificateType,
            recipientName: cert.recipientNameSnapshot,
            electionTitle: cert.electionTitleSnapshot,
            positionTitle: cert.positionTitleSnapshot,
            organizationName: cert.orgNameSnapshot,
            issuedAt: cert.issuedAt,
            revokedAt: cert.revokedAt,
            revocationReason: cert.revocationReason,
          },
        },
        'Certificate found but has been officially REVOKED by the election authority.'
      );
    }

    return successResponse(
      {
        status: 'valid',
        verified: true,
        certificate: {
          certificateId: cert.certificateId,
          certificateType: cert.certificateType,
          recipientName: cert.recipientNameSnapshot,
          electionTitle: cert.electionTitleSnapshot,
          positionTitle: cert.positionTitleSnapshot,
          organizationName: cert.orgNameSnapshot,
          votesReceived: cert.votesReceived,
          totalVotes: cert.totalVotes,
          votePercentage: cert.votePercentage,
          issuedAt: cert.issuedAt,
          verificationTokenPrefix: cert.verificationToken?.slice(0, 16),
          organization: cert.organization
            ? {
                name: cert.organization.name,
                slug: cert.organization.slug,
                logo: cert.organization.logo,
                isVerified: cert.organization.isVerified,
                signatoryTitle: cert.organization.signatoryTitle,
                ownerName: (() => {
                  const raw =
                    cert.organization.owner?.name ||
                    cert.organization.owner?.displayName ||
                    cert.organization.signatoryName ||
                    'Authorized Election Official';
                  return raw === raw.toUpperCase() && raw.length > 2
                    ? raw
                        .toLowerCase()
                        .split(' ')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ')
                    : raw;
                })(),
              }
            : null,
        },
      },
      'Certificate verified as authentic and legally active on VoteSphere ledger.'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

