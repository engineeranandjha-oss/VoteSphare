export const dynamic = 'force-dynamic';

import { getCurrentDbUser } from '@/lib/auth/session';
import { canManageElection } from '@/lib/auth/authorization';
import { Election, Organization, Candidate, Certificate, AuditLog } from '@/models/index.js';
import { calculateResults } from '@/lib/results/calculation';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from '@/lib/utils/error-handler';
import crypto from 'crypto';

/**
 * POST /api/elections/[electionId]/certificates/generate
 * Generates official Election Victory and Civic Participation certificates for certified, published elections.
 * Idempotent: Skips candidates who already have certificates for the current resultVersion.
 */
export async function POST(request, { params }) {
  try {
    const { electionId } = params;
    const dbUser = await getCurrentDbUser();

    if (!dbUser) {
      throw new UnauthorizedError('Authentication required to generate certificates');
    }

    const election = await Election.findByPk(electionId, {
      include: [
        {
          model: Organization,
          as: 'organization',
        },
      ],
    });

    if (!election) {
      throw new NotFoundError('Election not found');
    }

    const isManager = await canManageElection(dbUser.id, electionId);
    if (!isManager) {
      throw new ForbiddenError('You do not have permission to generate certificates for this election');
    }

    // Certificates can ONLY be generated for published elections
    if (election.status !== 'published') {
      throw new ValidationError(
        `Certificates can only be generated for published elections. Current election status is '${election.status}'.`
      );
    }

    // Compute certified results
    const results = await calculateResults(electionId);
    const org = election.organization;

    const generatedCertificates = [];
    const existingCertificates = [];

    for (const posResult of results.positions || []) {
      for (const cand of posResult.candidates || []) {
        if (cand.status === 'withdrawn') {
          continue; // Withdrawn candidates do not receive completion certificates
        }

        const certType = cand.isWinner ? 'victory' : 'participation';

        // Check if certificate already exists (idempotency)
        let cert = await Certificate.findOne({
          where: {
            electionId,
            positionId: posResult.positionId,
            candidateId: cand.id,
            certificateType: certType,
            resultVersion: 1,
          },
        });

        if (cert) {
          existingCertificates.push(cert);
          continue;
        }

        // Fetch candidate to inspect associated userId
        const candidateDb = await Candidate.findByPk(cand.id);

        const year = new Date().getFullYear();
        const randCode = crypto.randomBytes(3).toString('hex').toUpperCase();
        const certSerialId = `VS-CERT-${year}-${randCode}`;
        const verificationToken = crypto.randomBytes(24).toString('hex');

        cert = await Certificate.create({
          certificateId: certSerialId,
          orgId: election.orgId,
          electionId: election.id,
          candidateId: cand.id,
          positionId: posResult.positionId,
          userId: candidateDb?.userId || null,
          certificateType: certType,
          recipientNameSnapshot: cand.name,
          electionTitleSnapshot: election.title,
          positionTitleSnapshot: posResult.positionName,
          orgNameSnapshot: org?.name || 'VoteSphere Organization',
          votesReceived: cand.voteCount || 0,
          totalVotes: posResult.totalVotes || 0,
          votePercentage: cand.percentage || 0,
          resultVersion: 1,
          verificationToken,
          issuedAt: new Date(),
          metadata: {
            signatoryName: org?.signatoryName || null,
            signatoryTitle: org?.signatoryTitle || null,
            generatedBy: dbUser.id,
          },
        });

        generatedCertificates.push(cert);
      }
    }

    // Create Audit Log
    if (generatedCertificates.length > 0) {
      await AuditLog.create({
        orgId: election.orgId,
        userId: dbUser.id,
        action: 'CERTIFICATES_GENERATED',
        entityType: 'election',
        entityId: election.id,
        metadata: {
          count: generatedCertificates.length,
          alreadyExisting: existingCertificates.length,
        },
      });
    }

    const allCertificates = [...generatedCertificates, ...existingCertificates];

    return successResponse(
      {
        total: allCertificates.length,
        newlyGenerated: generatedCertificates.length,
        existing: existingCertificates.length,
        certificates: allCertificates,
      },
      `Successfully processed certificates: ${generatedCertificates.length} created, ${existingCertificates.length} previously issued.`
    );
  } catch (error) {
    return handleApiError(error);
  }
}

