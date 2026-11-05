import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireViewBillingAccess } from '@/lib/auth/authorization';
import { Invoice, Payment } from '@/models/index.js';
import { formatPriceInr } from '@/lib/billing/plans-config';
import { paginatedResponse } from '@/lib/utils/response';
import {
  handleApiError,
  UnauthorizedError,
} from '@/lib/utils/error-handler';

/**
 * GET /api/orgs/[orgId]/invoices
 * Lists paginated GST tax invoices for an organization.
 */
export async function GET(request, { params }) {
  try {
    const { orgId } = params;
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User synchronization failed');
    }

    await requireViewBillingAccess(dbUser.id, orgId);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const { count, rows } = await Invoice.findAndCountAll({
      where: { orgId },
      limit,
      offset,
      order: [['issuedAt', 'DESC']],
      include: [
        {
          model: Payment,
          as: 'payment',
          attributes: ['id', 'paymentMethod', 'paymentType', 'status'],
        },
      ],
    });

    const formattedRows = rows.map((inv) => {
      const plain = inv.get({ plain: true });
      return {
        ...plain,
        formattedSubtotal: formatPriceInr(plain.subtotal),
        formattedTaxAmount: formatPriceInr(plain.taxAmount),
        formattedTotalAmount: formatPriceInr(plain.totalAmount),
        downloadUrl: `/api/orgs/${orgId}/invoices/${plain.id}/pdf`,
      };
    });

    return paginatedResponse(formattedRows, {
      total: count,
      page,
      limit,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

