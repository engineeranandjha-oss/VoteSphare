import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateInvoicePdfBuffer } from '../lib/billing/invoice-pdf.js';

describe('VoteSphere Module 16.6: Invoice PDF Generation Test Suite', () => {
  test('generates a valid PDF buffer with correct magic headers', () => {
    const mockInvoice = {
      invoiceNumber: 'VS-INV-202611-00001',
      subtotal: 127034,
      taxAmount: 22866,
      totalAmount: 149900,
      currency: 'INR',
      status: 'paid',
      issuedAt: new Date('2026-11-04T12:00:00Z'),
      billingDetails: {
        sacCode: '998313',
        gstRate: '18%',
        payerEmail: 'billing@apex.edu',
        gstin: '29ABCDE1234F1Z5',
      },
    };

    const mockOrg = {
      name: 'Apex University Student Union',
    };

    const mockPayment = {
      razorpayPaymentId: 'pay_test_invoice_pdf_123',
      paymentMethod: 'card',
    };

    const pdfBuffer = generateInvoicePdfBuffer({
      invoice: mockInvoice,
      organization: mockOrg,
      payment: mockPayment,
    });

    assert.ok(Buffer.isBuffer(pdfBuffer), 'Must return a Node.js Buffer');
    assert.ok(pdfBuffer.length > 500, 'PDF buffer should be substantial');

    // PDF magic bytes: %PDF- (0x25 0x50 0x44 0x46 0x2d)
    const magic = pdfBuffer.subarray(0, 5).toString('ascii');
    assert.equal(magic, '%PDF-', 'PDF must begin with valid %PDF- magic header');
  });
});

