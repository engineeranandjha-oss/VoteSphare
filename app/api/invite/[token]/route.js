import { verifyInviteToken } from '@/lib/email/invitation';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { Organization, User } from '@/models/index.js';

/**
 * GET /api/invite/[token]
 * Verifies an invitation token and returns organization preview information.
 */
export async function GET(request, { params }) {
  try {
    const { token } = params;

    const verification = verifyInviteToken(token);

    if (!verification.valid || !verification.data) {
      return errorResponse(verification.error || 'Invalid or expired invitation token', 400);
    }

    const { orgId, email, role, expiresAt } = verification.data;

    const organization = await Organization.findByPk(orgId, {
      attributes: ['id', 'name', 'slug', 'type', 'description'],
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'image'],
        },
      ],
    });

    if (!organization) {
      return errorResponse('The organization for this invitation no longer exists', 404);
    }

    return successResponse(
      {
        valid: true,
        email,
        role,
        expiresAt,
        organization: organization.toJSON(),
      },
      'Invitation token verified successfully'
    );
  } catch (error) {
    return errorResponse(error.message || 'Failed to verify invitation token', 500);
  }
}
