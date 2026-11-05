export const dynamic = 'force-dynamic';

import { getCurrentDbUser } from '@/lib/auth/session';
import { canManageElection } from '@/lib/auth/authorization';
import { Certificate, AuditLog } from '@/models/index.js';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/utils/error-handler';
import { Op } from 'sequelize';
import { z } from 'zod';

const revokeSchema = z.object({
  reason: z.string().min(5, 'Revocation reason must be at least 5 characters').max(500),
});

/**
 * PATCH /api/certificates/[certificateId]/revoke
 * Revokes an issued certificate with an official administrative reason and creates an immutable audit trail.
 */
export async function PATCH(request, { params }) {
  try {
    const { certificateId } = params;
    const dbUser = await getCurrentDbUser();

    if (!dbUser) {
      throw new UnauthorizedError('Authentication required to revoke certificates');
    }

    const cert = await Certificate.findOne({
      where: {
        [Op.or]: [{ certificateId }, { id: certificateId }],
      },
    });

    if (!cert) {
      throw new NotFoundError('Certificate not found');
    }

    const isManager = await canManageElection(dbUser.id, cert.electionId);
    if (!isManager) {
      throw new ForbiddenError('You do not have permission to revoke certificates for this election');
    }

    if (cert.revokedAt) {
      throw new ValidationError(
        `Certificate has already been revoked on ${new Date(cert.revokedAt).toLocaleString()} with reason: "${cert.revocationReason}"`
      );
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = revokeSchema.safeParse(body);

    if (!parseResult.success) {
      throw new ValidationError(parseResult.error.errors.map((e) => e.message).join(', '));
    }

    const { reason } = parseResult.data;

    await cert.update({
      revokedAt: new Date(),
      revocationReason: reason,
      revokedBy: dbUser.id,
    });

    // Create Audit Log
    await AuditLog.create({
      orgId: cert.orgId,
      userId: dbUser.id,
      action: 'CERTIFICATE_REVOKED',
      entityType: 'certificate',
      entityId: cert.id,
      metadata: {
        certificateId: cert.certificateId,
        recipient: cert.recipientNameSnapshot,
        electionId: cert.electionId,
        reason,
      },
    });

    return successResponse(cert, 'Certificate successfully revoked and logged in audit registry');
  } catch (error) {
    return handleApiError(error);
  }
}

