import { NextResponse } from 'next/server';
import { requireAuth, getCurrentDbUser } from '@/lib/auth/session';
import { syncUser } from '@/lib/auth/user-sync';
import { requireViewBillingAccess } from '@/lib/auth/authorization';
import { Invoice, Organization, Payment } from '@/models/index.js';
import { generateInvoicePdfBuffer } from '@/lib/billing/invoice-pdf';
import {
  handleApiError,
  UnauthorizedError,
  NotFoundError,
} from '@/lib/utils/error-handler';

/**
 * GET /api/orgs/[orgId]/invoices/[invoiceId]/pdf
 * Streams official GST tax invoice PDF download.
 */
export async function GET(request, { params }) {
  try {
    const { orgId, invoiceId } = params;
    const user = await requireAuth();
    let dbUser = await getCurrentDbUser();

    if (!dbUser) {
      dbUser = await syncUser(user);
    }

    if (!dbUser) {
      throw new UnauthorizedError('User synchronization failed');
    }

    await requireViewBillingAccess(dbUser.id, orgId);

    const invoice = await Invoice.findOne({
      where: { id: invoiceId, orgId },
      include: [
        { model: Organization, as: 'organization' },
        { model: Payment, as: 'payment' },
      ],
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    const plainInvoice = invoice.get({ plain: true });
    const plainOrg = plainInvoice.organization || { name: 'Organization' };
    const plainPayment = plainInvoice.payment || {};

    const pdfBuffer = generateInvoicePdfBuffer({
      invoice: plainInvoice,
      organization: plainOrg,
      payment: plainPayment,
    });

    const filename = `VoteSphere-Invoice-${plainInvoice.invoiceNumber || 'receipt'}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

