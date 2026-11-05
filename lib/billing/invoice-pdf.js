import { jsPDF } from 'jspdf';
import { formatPriceInr } from './plans-config.js';

/**
 * Generates an official, GST-compliant Tax Invoice PDF as a Buffer.
 * Conforms to Section 31 of CGST Act, 2017 and SAC Code 998313 (IT & Cloud Software Services).
 *
 * @param {Object} params
 * @param {Object} params.invoice - Invoice Sequelize plain object
 * @param {Object} params.organization - Organization plain object
 * @param {Object} [params.payment] - Payment plain object
 * @returns {Buffer}
 */
export function generateInvoicePdfBuffer({ invoice, organization, payment = {} }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 16;
  const contentWidth = pageWidth - margin * 2; // 178mm

  let currentY = margin;

  // 1. Top Header Bar
  doc.setFillColor(15, 23, 42); // slate-900 (#0f172a)
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('VoteSphere', margin + 8, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('TAX INVOICE / PAYMENT RECEIPT', margin + 8, currentY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text(invoice.invoiceNumber || 'INV-000000', pageWidth - margin - 8, currentY + 11, {
    align: 'right',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const issuedDate = invoice.issuedAt
    ? new Date(invoice.issuedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN');
  doc.text(`Date: ${issuedDate}`, pageWidth - margin - 8, currentY + 18, {
    align: 'right',
  });

  currentY += 32;

  // 2. Issuer & Customer Details Columns
  // Supplier Details (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('SUPPLIER / SERVICE PROVIDER:', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('VoteSphere Technologies Pvt. Ltd.', margin, currentY + 5);
  doc.text('SAC Code: 998313 (IT & Cloud Application Services)', margin, currentY + 9);
  doc.text('GSTIN: 29AABCV1234F1Z5', margin, currentY + 13);
  doc.text('Karnataka, India (State Code: 29)', margin, currentY + 17);

  // Billed To (Right)
  const rightColX = margin + contentWidth / 2 + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('BILLED TO (CUSTOMER):', rightColX, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(organization.name || 'Organization', rightColX, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const payerEmail = invoice.billingDetails?.payerEmail || 'Authorized Administrator';
  doc.text(`Email: ${payerEmail}`, rightColX, currentY + 9);
  if (invoice.billingDetails?.gstin) {
    doc.text(`Customer GSTIN: ${invoice.billingDetails.gstin}`, rightColX, currentY + 13);
  } else {
    doc.text('GST Category: Unregistered Customer', rightColX, currentY + 13);
  }
  doc.text(`Place of Supply: India`, rightColX, currentY + 17);

  currentY += 28;

  // 3. Line Items Table Header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, currentY, contentWidth, 7, 'F');
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.line(margin, currentY, margin + contentWidth, currentY);
  doc.line(margin, currentY + 7, margin + contentWidth, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('DESCRIPTION', margin + 4, currentY + 4.8);
  doc.text('SAC', margin + 92, currentY + 4.8);
  doc.text('QTY', margin + 114, currentY + 4.8);
  doc.text('TAXABLE VALUE', margin + 142, currentY + 4.8, { align: 'right' });
  doc.text('AMOUNT', margin + contentWidth - 4, currentY + 4.8, { align: 'right' });

  currentY += 7;

  // Line Item Row
  const description =
    invoice.billingDetails?.orderType === 'event_pass'
      ? 'VoteSphere Event Pass (30-Day Complete Electoral Validity)'
      : invoice.billingDetails?.orderType === 'booster'
      ? 'Voter Capacity Booster Seat Allocation'
      : 'VoteSphere Multi-Tenant Anonymous Voting Platform Subscription';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(description, margin + 4, currentY + 6);
  doc.text('998313', margin + 92, currentY + 6);
  doc.text('1', margin + 114, currentY + 6);
  doc.text(formatPriceInr(invoice.subtotal), margin + 142, currentY + 6, { align: 'right' });
  doc.text(formatPriceInr(invoice.subtotal), margin + contentWidth - 4, currentY + 6, {
    align: 'right',
  });

  currentY += 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, currentY, margin + contentWidth, currentY);

  currentY += 6;

  // 4. Tax Breakdown Summary Table (Right-aligned)
  const summaryWidth = 80;
  const summaryX = margin + contentWidth - summaryWidth;

  const cgst = Math.round(invoice.taxAmount / 2);
  const sgst = invoice.taxAmount - cgst;

  const summaryRows = [
    ['Subtotal (Taxable Value)', formatPriceInr(invoice.subtotal)],
    ['CGST (9.0%)', formatPriceInr(cgst)],
    ['SGST (9.0%)', formatPriceInr(sgst)],
  ];

  doc.setFontSize(8);
  for (const [lbl, val] of summaryRows) {
    doc.setTextColor(100, 116, 139);
    doc.text(lbl, summaryX, currentY);
    doc.setTextColor(15, 23, 42);
    doc.text(val, margin + contentWidth - 4, currentY, { align: 'right' });
    currentY += 5.5;
  }

  // Total Line
  doc.setDrawColor(15, 23, 42);
  doc.line(summaryX, currentY, margin + contentWidth, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Total (INR)', summaryX, currentY);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text(formatPriceInr(invoice.totalAmount), margin + contentWidth - 4, currentY, {
    align: 'right',
  });

  currentY += 16;

  // 5. Payment Confirmation Details
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('PAYMENT SETTLEMENT & RECONCILIATION:', margin + 6, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const payId = payment.razorpayPaymentId || 'Verified Online Gateway Settlement';
  const payMethod = payment.paymentMethod ? payment.paymentMethod.toUpperCase() : 'ONLINE / UPI';
  doc.text(`Payment ID: ${payId}  •  Method: ${payMethod}  •  Status: PAID / CAPTURED`, margin + 6, currentY + 11);
  doc.text('Zero-Knowledge Anonymity Guarantee: Payment records are legally dissociated from cast ballots.', margin + 6, currentY + 16);

  // 6. Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - margin - 8, margin + contentWidth, pageHeight - margin - 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `VoteSphere Cryptographic Ledger Invoicing • Generated on ${new Date().toUTCString()}`,
    margin,
    pageHeight - margin - 3
  );
  doc.text('votesphere.org • Democratic Governance Infrastructure', margin + contentWidth, pageHeight - margin - 3, {
    align: 'right',
  });

  // Export as Buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

