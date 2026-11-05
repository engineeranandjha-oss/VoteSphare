export const dynamic = 'force-dynamic';

import { Organization, Election, Position, Candidate } from '@/models/index.js';
import { Op } from 'sequelize';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, NotFoundError } from '@/lib/utils/error-handler';

/**
 * GET /api/orgs/public/[slug]/elections
 * Public election history and discovery for an organization.
 * Strictly filters out draft and unpublished elections.
 */
export async function GET(request, { params }) {
  try {
    const { slug } = params;
    if (!slug) {
      throw new NotFoundError('Organization slug is required');
    }

    const cleanSlug = slug.trim().toLowerCase();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);

    const organization = await Organization.findOne({
      where: isUUID ? { id: cleanSlug } : { slug: cleanSlug },
      attributes: ['id', 'name', 'slug'],
    });

    if (!organization) {
      throw new NotFoundError(`Organization '${slug}' not found`);
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category')?.toLowerCase(); // 'active', 'upcoming', 'completed', 'published'

    // Status mapping: STRICTLY EXCLUDES 'draft'
    let allowedStatuses = ['live', 'scheduled', 'ended', 'published', 'archived'];

    if (category === 'active') {
      allowedStatuses = ['live'];
    } else if (category === 'upcoming') {
      allowedStatuses = ['scheduled'];
    } else if (category === 'completed') {
      allowedStatuses = ['ended', 'published', 'archived'];
    } else if (category === 'published') {
      allowedStatuses = ['published'];
    }

    const elections = await Election.findAll({
      where: {
        orgId: organization.id,
        status: { [Op.in]: allowedStatuses },
      },
      attributes: [
        'id',
        'title',
        'description',
        'status',
        'startDate',
        'endDate',
        'createdAt',
        'config',
      ],
      include: [
        {
          model: Position,
          as: 'positions',
          attributes: ['id', 'name'],
          include: [
            {
              model: Candidate,
              as: 'candidates',
              where: { status: 'active' },
              required: false,
              attributes: ['id', 'name', 'photo'],
            },
          ],
        },
      ],
      order: [
        ['startDate', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });

    const serializedElections = elections.map((election) => {
      const positions = election.positions || [];
      const totalCandidates = positions.reduce(
        (acc, pos) => acc + (pos.candidates?.length || 0),
        0
      );

      const hasPublishedResults =
        election.status === 'published' ||
        Boolean(election.config?.publishingDetails) ||
        Boolean(election.isCertified);

      return {
        id: election.id,
        title: election.title,
        description: election.description || null,
        status: election.status,
        startDate: election.startDate,
        endDate: election.endDate,
        createdAt: election.createdAt,
        totalPositions: positions.length,
        totalCandidates,
        positions: positions.map((p) => ({
          id: p.id,
          name: p.name,
          title: p.name,
          candidateCount: p.candidates?.length || 0,
        })),
        hasPublishedResults,
      };
    });

    return successResponse(
      {
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
        elections: serializedElections,
        grouped: {
          active: serializedElections.filter((e) => e.status === 'live'),
          upcoming: serializedElections.filter((e) => e.status === 'scheduled'),
          completed: serializedElections.filter(
            (e) => e.status === 'ended' || e.status === 'published' || e.status === 'archived'
          ),
          published: serializedElections.filter((e) => e.status === 'published'),
        },
      },
      'Public elections retrieved successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

