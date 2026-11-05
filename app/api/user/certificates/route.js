export const dynamic = 'force-dynamic';

import { getCurrentDbUser } from '@/lib/auth/session';
import { Certificate, Election, Organization, Position } from '@/models/index.js';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, UnauthorizedError } from '@/lib/utils/error-handler';
import { Op } from 'sequelize';

/**
 * GET /api/user/certificates
 * Retrieves all certificates earned by the current user (either by direct userId association or name matching).
 */
export async function GET() {
  try {
    const dbUser = await getCurrentDbUser();

    if (!dbUser) {
      throw new UnauthorizedError('Authentication required to view your certificates');
    }

    const nameConditions = [];
    if (dbUser.name) nameConditions.push(dbUser.name);
    if (dbUser.displayName) nameConditions.push(dbUser.displayName);

    const whereOr = [{ userId: dbUser.id }];
    if (nameConditions.length > 0) {
      whereOr.push({ recipientNameSnapshot: { [Op.in]: nameConditions } });
    }

    const certificates = await Certificate.findAll({
      where: {
        [Op.or]: whereOr,
      },
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug', 'logo'],
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
      order: [['issuedAt', 'DESC']],
    });

    return successResponse(
      {
        total: certificates.length,
        certificates,
      },
      'User certificates retrieved successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

