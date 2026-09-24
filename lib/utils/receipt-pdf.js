import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/**
 * Helper to load logo as base64 Data URL across Browser and Node environments
 */
async function loadLogoDataUrl(origin) {
  try {
    if (typeof window !== 'undefined') {
      const url = origin ? `${origin.replace(/\/+$/, '')}/logo.png` : '/logo.png';
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      }
    } else {
      // Node.js test environment support
      try {
        const fs = await import('node:fs');
        const path = await import('node:path');
        const candidatePaths = [
          path.resolve(process.cwd(), 'public', 'logo.png'),
          path.resolve(process.cwd(), 'logo.png'),
        ];
        for (const p of candidatePaths) {
          if (fs.existsSync(p)) {
            const buf = fs.readFileSync(p);
            return `data:image/png;base64,${buf.toString('base64')}`;
          }
        }
      } catch {
        // Fallback
      }
    }
  } catch {
    // Graceful fallback if network/file error occurs
  }
  return null;
}

/**
 * Generate and trigger download of a professional VoteSphere Ballot Receipt PDF.
 *
 * @param {Object} params
 * @param {string} params.receiptId - Cryptographic receipt code (e.g. VS-XXXX-XXXX...)
 * @param {string} params.electionId - Election UUID
 * @param {string} params.electionTitle - Name of the election
 * @param {string|Date} [params.timestamp] - Timestamp when ballot was sealed
 * @param {number} [params.positionsVotedCount] - Number of positions voted
 * @param {boolean} [params.isAnonymous=true] - Privacy mode flag
 * @param {string} [params.origin] - Base URL origin for links
 */
export async function downloadBallotReceiptPdf({
  receiptId = 'VS-UNKNOWN',
  electionId = '',
  electionTitle = 'Election',
  timestamp = new Date().toISOString(),
  positionsVotedCount = 0,
  isAnonymous = true,
  origin,
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const baseOrigin =
    origin ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://votesphere.app');

  const verifyUrl = `${baseOrigin}/receipt/${encodeURIComponent(receiptId)}`;
  const resultsUrl = `${baseOrigin}/e/${electionId}/results`;

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  let currentY = margin;

  // Load logo Data URL
  const logoDataUrl = await loadLogoDataUrl(baseOrigin);

  // -------------------------------------------------------------
  // 1. Top Header Brand Bar
  // -------------------------------------------------------------
  doc.setFillColor(15, 23, 42); // slate-900 (#0f172a)
  doc.roundedRect(margin, currentY, contentWidth, 26, 3, 3, 'F');

  // Top accent stripe (Blue & Indigo gradient simulation)
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(margin + 3, currentY, contentWidth - 6, 2, 'F');

  // Embed Logo Image if available
  let brandTextX = margin + 8;
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', margin + 6, currentY + 5.5, 15, 15);
      brandTextX = margin + 25;
    } catch {
      brandTextX = margin + 8;
    }
  }

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('VOTESPHERE', brandTextX, currentY + 11.5);

  // Brand Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('OFFICIAL BALLOT RECEIPT & CRYPTOGRAPHIC AUDIT PROOF', brandTextX, currentY + 18.5);

  // Status Badge (Right)
  doc.setFillColor(6, 78, 59); // emerald-900
  doc.roundedRect(pageWidth - margin - 42, currentY + 7.5, 36, 11, 2, 2, 'F');
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SEALED IN LEDGER', pageWidth - margin - 24, currentY + 14.5, { align: 'center' });

  currentY += 31;

  // -------------------------------------------------------------
  // 2. Document Title & Description
  // -------------------------------------------------------------
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Ballot Submission Confirmation', margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  const introText =
    'This document serves as immutable cryptographic proof of participation. Your vote has been recorded anonymously and sealed into the verifiable election ledger.';
  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  doc.text(splitIntro, margin, currentY);
  currentY += splitIntro.length * 4.5 + 4;

  // -------------------------------------------------------------
  // 3. Election Information Box
  // -------------------------------------------------------------
  const electionBoxY = currentY;
  const electionBoxHeight = 44;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, electionBoxY, contentWidth, electionBoxHeight, 2.5, 2.5, 'FD');

  // Section Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('ELECTION DETAILS', margin + 6, electionBoxY + 7);

  // Left Column (Election Title, ID)
  const col1X = margin + 6;
  const col2X = margin + 98;
  let rowY = electionBoxY + 14;

  // Election Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('ELECTION NAME:', col1X, rowY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const cleanTitle = electionTitle || 'Election';
  const splitTitle = doc.splitTextToSize(cleanTitle, 82);
  doc.text(splitTitle, col1X, rowY + 4.5);

  // Election ID
  const idY = rowY + 4.5 + Math.min(splitTitle.length, 2) * 4.5 + 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ELECTION ID:', col1X, idY);
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(electionId || 'N/A', col1X, idY + 4);

  // Right Column (Timestamp, Positions, Privacy)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TIMESTAMP (UTC):', col2X, rowY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const formattedDate = new Date(timestamp).toUTCString();
  doc.text(formattedDate, col2X, rowY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('BALLOT SCOPE:', col2X, rowY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `${positionsVotedCount} ${positionsVotedCount === 1 ? 'Position Voted' : 'Positions Voted'}`,
    col2X,
    rowY + 16.5
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PRIVACY MODE:', col2X, rowY + 24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(
    isAnonymous ? 'Zero-Knowledge Dissociated (Identity Severed)' : 'Standard',
    col2X,
    rowY + 28.5
  );

  currentY = electionBoxY + electionBoxHeight + 6;

  // -------------------------------------------------------------
  // 4. Cryptographic Verification Code (Hero Highlight)
  // -------------------------------------------------------------
  const codeBoxY = currentY;
  const codeBoxHeight = 32;

  doc.setFillColor(15, 23, 42); // slate-900
  doc.setDrawColor(30, 41, 59); // slate-800
  doc.roundedRect(margin, codeBoxY, contentWidth, codeBoxHeight, 2.5, 2.5, 'FD');

  doc.setTextColor(56, 189, 248); // sky-400
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CRYPTOGRAPHIC VERIFICATION CODE (PROOF HASH)', margin + 6, codeBoxY + 8);

  // Large monospace hash code
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.setFont('courier', 'bold');
  doc.setFontSize(11.5);

  // Split verification code if wide
  const splitReceiptCode = doc.splitTextToSize(receiptId, contentWidth - 12);
  doc.text(splitReceiptCode, margin + 6, codeBoxY + 16);

  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(
    'Retain this unique token to independently verify your inclusion in the certified election tally.',
    margin + 6,
    codeBoxY + 26
  );

  currentY = codeBoxY + codeBoxHeight + 6;

  // -------------------------------------------------------------
  // 5. Verification QR Code & Live Audit Section
  // -------------------------------------------------------------
  const qrSectionY = currentY;
  const qrSectionHeight = 42;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, qrSectionY, contentWidth, qrSectionHeight, 2.5, 2.5, 'FD');

  // Generate QR Code data URL
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 256,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    // Draw QR code image on left
    const qrSize = 32;
    doc.addImage(qrDataUrl, 'PNG', margin + 5, qrSectionY + 5, qrSize, qrSize);
  } catch {
    // If QR generation fails, draw fallback box
    doc.setFillColor(226, 232, 240);
    doc.rect(margin + 5, qrSectionY + 5, 32, 32, 'F');
  }

  // QR Section Content (Right of QR)
  const qrTextX = margin + 42;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Independent Verification Portal', qrTextX, qrSectionY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const qrInstructions =
    'Scan this QR code with any smartphone camera or visit the verification portal URL below to validate cryptographic ledger inclusion and live turnout.';
  const splitQrInst = doc.splitTextToSize(qrInstructions, contentWidth - 48);
  doc.text(splitQrInst, qrTextX, qrSectionY + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('VERIFICATION URL:', qrTextX, qrSectionY + 27);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(37, 99, 235); // blue-600
  const splitVerifyUrl = doc.splitTextToSize(verifyUrl, contentWidth - 48);
  doc.text(splitVerifyUrl, qrTextX, qrSectionY + 31);

  currentY = qrSectionY + qrSectionHeight + 6;

  // -------------------------------------------------------------
  // 6. Security & Zero-Knowledge Privacy Statement
  // -------------------------------------------------------------
  const secBoxY = currentY;
  const secBoxHeight = 36;

  doc.setFillColor(239, 246, 255); // blue-50 (#eff6ff)
  doc.setDrawColor(191, 219, 254); // blue-200 (#bfdbfe)
  doc.roundedRect(margin, secBoxY, contentWidth, secBoxHeight, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 175); // blue-800
  doc.text('SECURITY & ANONYMITY STATEMENT', margin + 6, secBoxY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138); // blue-900
  const securityStatement =
    'This receipt certifies that your anonymous ballot was cryptographically received, validated, and permanently recorded in the immutable vote ledger. In accordance with zero-knowledge ballot dissociation, your personal identity, email, and user credentials have been strictly dissociated from this ballot receipt and the permanent vote record.';
  const splitSec = doc.splitTextToSize(securityStatement, contentWidth - 12);
  doc.text(splitSec, margin + 6, secBoxY + 12.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(37, 99, 235);
  doc.text(`Official Results Archive: ${resultsUrl}`, margin + 6, secBoxY + 31);

  currentY = secBoxY + secBoxHeight + 8;

  // -------------------------------------------------------------
  // 7. Footer
  // -------------------------------------------------------------
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - margin - 10, pageWidth - margin, pageHeight - margin - 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    `VoteSphere Cryptographic Ledger • Generated on ${new Date().toUTCString()}`,
    margin,
    pageHeight - margin - 5
  );

  doc.text(
    'votesphere.app • Simple. Secure. Shareable Voting.',
    pageWidth - margin,
    pageHeight - margin - 5,
    { align: 'right' }
  );

  // -------------------------------------------------------------
  // 8. Trigger Download with sanitized filename
  // -------------------------------------------------------------
  const sanitizedTitle = cleanTitle
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const filename = `VoteSphere-Ballot-Receipt-${sanitizedTitle || 'Election'}.pdf`;

  doc.save(filename);
  return filename;
}
