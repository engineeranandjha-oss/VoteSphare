export const dynamic = 'force-dynamic';

import { Certificate, Election, Organization, Position, Candidate, User } from '@/models/index.js';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, NotFoundError } from '@/lib/utils/error-handler';
import { Op } from 'sequelize';

/**
 * GET /api/certificates/[certificateId]
 * Fetches single certificate record by internal UUID or unique serial certificateId.
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
          attributes: ['id', 'name', 'slug', 'logo', 'signatoryName', 'signatoryTitle'],
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
          attributes: ['id', 'title', 'status', 'startDate', 'endDate'],
        },
        {
          model: Position,
          as: 'position',
          attributes: ['id', 'name'],
        },
        {
          model: Candidate,
          as: 'candidate',
          attributes: ['id', 'name', 'photo'],
        },
        {
          model: User,
          as: 'revoker',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!cert) {
      throw new NotFoundError('Certificate not found');
    }

    return successResponse(cert, 'Certificate details retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

