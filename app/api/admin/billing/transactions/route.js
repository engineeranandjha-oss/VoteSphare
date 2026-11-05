import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requirePlatformAdmin } from '@/lib/auth/authorization';
import {
  Payment,
  Organization,
  User,
  Invoice,
} from '@/models/index.js';
import { Op } from 'sequelize';
import { formatPriceInr } from '@/lib/billing/plans-config';
import { successResponse } from '@/lib/utils/response';
import { handleApiError, UnauthorizedError } from '@/lib/utils/error-handler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/billing/transactions
 * Returns a paginated list of all platform financial transactions for superadmins.
 * Includes associated organization, customer identity, payment status, and tax invoices.
 */
export async function GET(request) {
  try {
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User synchronization failed');
    }

    // Require platform administrator privileges
    requirePlatformAdmin(dbUser);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;
    const statusFilter = searchParams.get('status');
    const search = searchParams.get('search')?.trim();

    const whereClause = {};

    if (statusFilter && ['captured', 'refunded', 'failed', 'authorized', 'created'].includes(statusFilter)) {
      whereClause.status = statusFilter;
    }

    if (search) {
      whereClause[Op.or] = [
        { razorpayPaymentId: { [Op.like]: `%${search}%` } },
        { razorpayOrderId: { [Op.like]: `%${search}%` } },
        { razorpaySubscriptionId: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: payments } = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['id', 'invoiceNumber', 'status', 'total', 'issuedAt'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const formattedTransactions = payments.map((p) => {
      const invoice = p.invoice || null;
      return {
        id: p.id,
        amount: p.amount,
        formattedAmount: formatPriceInr(p.amount),
        currency: p.currency,
        status: p.status,
        paymentType: p.paymentType,
        paymentMethod: p.paymentMethod,
        razorpayPaymentId: p.razorpayPaymentId,
        razorpayOrderId: p.razorpayOrderId,
        razorpaySubscriptionId: p.razorpaySubscriptionId,
        createdAt: p.createdAt,
        organization: p.organization
          ? {
              id: p.organization.id,
              name: p.organization.name,
              slug: p.organization.slug,
            }
          : null,
        user: p.user
          ? {
              name: p.user.name,
              email: p.user.email,
            }
          : null,
        invoice: invoice
          ? {
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              status: invoice.status,
              issuedAt: invoice.issuedAt,
            }
          : null,
      };
    });

    return successResponse(
      {
        transactions: formattedTransactions,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
      'Platform transactions retrieved successfully'
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Admin Transactions API Error]:', error);
    return handleApiError(error);
  }
}

