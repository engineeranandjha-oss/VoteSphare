import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// In-memory cache for assets across PDF generations
let cachedSealDataUrl = null;
let cachedCinzelFontBase64 = null;
let cachedPlayfairFontBase64 = null;

/**
 * Loads and caches the official VoteSphere seal PNG asset.
 */
function getOfficialSealDataUrl() {
  if (cachedSealDataUrl) return cachedSealDataUrl;
  try {
    const sealPath = path.join(process.cwd(), 'public', 'Votesphere Official Seal.png');
    if (fs.existsSync(sealPath)) {
      const buffer = fs.readFileSync(sealPath);
      cachedSealDataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
      return cachedSealDataUrl;
    }
  } catch (err) {
    console.error('Failed to load official VoteSphere seal asset:', err);
  }
  return null;
}

/**
 * Loads and registers custom Google Fonts (Cinzel & Playfair Display) in jsPDF.
 */
function registerCustomFonts(doc) {
  try {
    const fontsDir = path.join(process.cwd(), 'public', 'fonts');

    if (!cachedCinzelFontBase64) {
      const cinzelPath = path.join(fontsDir, 'Cinzel-Bold.ttf');
      if (fs.existsSync(cinzelPath)) {
        cachedCinzelFontBase64 = fs.readFileSync(cinzelPath).toString('base64');
      }
    }

    if (!cachedPlayfairFontBase64) {
      const playfairPath = path.join(fontsDir, 'PlayfairDisplay-Bold.ttf');
      if (fs.existsSync(playfairPath)) {
        cachedPlayfairFontBase64 = fs.readFileSync(playfairPath).toString('base64');
      }
    }

    if (cachedCinzelFontBase64) {
      doc.addFileToVFS('Cinzel-Bold.ttf', cachedCinzelFontBase64);
      doc.addFont('Cinzel-Bold.ttf', 'Cinzel', 'bold');
      doc.addFont('Cinzel-Bold.ttf', 'Cinzel', 'normal');
    }

    if (cachedPlayfairFontBase64) {
      doc.addFileToVFS('PlayfairDisplay-Bold.ttf', cachedPlayfairFontBase64);
      doc.addFont('PlayfairDisplay-Bold.ttf', 'PlayfairDisplay', 'bold');
      doc.addFont('PlayfairDisplay-Bold.ttf', 'PlayfairDisplay', 'normal');
    }
  } catch (err) {
    console.error('Failed to register custom fonts:', err);
  }
}

/**
 * Crops any input logo (data URL, Buffer, or file path) into a true anti-aliased circle.
 * Preserves the original aspect ratio with fit: 'contain' inside a clean circular mask.
 *
 * @param {string|Buffer} logoInput
 * @param {number} pixelSize
 * @returns {Promise<string|null>} PNG base64 Data URL or null
 */
export async function cropLogoToCircle(logoInput, pixelSize = 320) {
  if (!logoInput) return null;
  try {
    let inputBuffer = null;
    if (typeof logoInput === 'string') {
      if (logoInput.startsWith('data:image/')) {
        const base64Data = logoInput.replace(/^data:image\/\w+;base64,/, '');
        inputBuffer = Buffer.from(base64Data, 'base64');
      } else if (logoInput.startsWith('http://') || logoInput.startsWith('https://')) {
        const res = await fetch(logoInput);
        if (res.ok) {
          inputBuffer = Buffer.from(await res.arrayBuffer());
        }
      } else if (fs.existsSync(logoInput)) {
        inputBuffer = fs.readFileSync(logoInput);
      }
    } else if (Buffer.isBuffer(logoInput)) {
      inputBuffer = logoInput;
    }

    if (!inputBuffer) return null;

    const radius = pixelSize / 2;
    // Anti-aliased SVG circle mask
    const circleMaskSvg = Buffer.from(
      `<svg width="${pixelSize}" height="${pixelSize}"><circle cx="${radius}" cy="${radius}" r="${radius}" fill="#ffffff"/></svg>`
    );

    const croppedPng = await sharp(inputBuffer)
      .resize(pixelSize, pixelSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .composite([
        {
          input: circleMaskSvg,
          blend: 'dest-in',
        },
      ])
      .png()
      .toBuffer();

    return `data:image/png;base64,${croppedPng.toString('base64')}`;
  } catch (err) {
    console.error('Error cropping logo into circle:', err);
    return null;
  }
}

/**
 * Draws subtle security-pattern waves in the corners and margin boundaries.
 */
function drawSecurityBackground(doc, pageWidth, pageHeight) {
  doc.saveGraphicsState();
  doc.setDrawColor(241, 245, 249); // slate-100 very faint
  doc.setLineWidth(0.15);

  // Corner security wave arcs
  const waveSpans = [
    { cx: 12, cy: 12, dirX: 1, dirY: 1 },
    { cx: pageWidth - 12, cy: 12, dirX: -1, dirY: 1 },
    { cx: 12, cy: pageHeight - 12, dirX: 1, dirY: -1 },
    { cx: pageWidth - 12, cy: pageHeight - 12, dirX: -1, dirY: -1 },
  ];

  for (const w of waveSpans) {
    for (let r = 8; r <= 36; r += 4) {
      doc.line(
        w.cx,
        w.cy + w.dirY * (r * 0.7),
        w.cx + w.dirX * (r * 0.7),
        w.cy
      );
    }
  }

  doc.restoreGraphicsState();
}

/**
 * Draws the ornate multi-tier regal border.
 */
function drawCertificateBorder(doc, pageWidth, pageHeight, primaryNavy, goldAccent) {
  // 1. Outer Deep Royal Navy border
  doc.setDrawColor(...primaryNavy);
  doc.setLineWidth(1.8);
  doc.rect(7, 7, pageWidth - 14, pageHeight - 14);

  // 2. Middle Gold Accent border
  doc.setDrawColor(...goldAccent);
  doc.setLineWidth(0.75);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // 3. Inner Slate Hairline frame
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.25);
  doc.rect(12.5, 12.5, pageWidth - 25, pageHeight - 25);
}

/**
 * Draws elaborate symmetrical corner ornaments with multi-tier brackets and gold diamonds.
 */
function drawOrnamentalCorners(doc, pageWidth, pageHeight, goldPrimary, goldAccent) {
  const drawCorner = (cx, cy, dirX, dirY) => {
    // Outer L-bracket
    doc.setDrawColor(...goldPrimary);
    doc.setLineWidth(0.8);
    doc.line(cx, cy, cx + dirX * 14, cy);
    doc.line(cx, cy, cx, cy + dirY * 14);

    // Inner parallel bracket
    doc.setDrawColor(...goldAccent);
    doc.setLineWidth(0.4);
    doc.line(cx + dirX * 2.5, cy + dirY * 2.5, cx + dirX * 11, cy + dirY * 2.5);
    doc.line(cx + dirX * 2.5, cy + dirY * 2.5, cx + dirX * 2.5, cy + dirY * 11);

    // Diagonal stepped tick
    doc.line(cx + dirX * 2.5, cy + dirY * 2.5, cx + dirX * 7.5, cy + dirY * 7.5);

    // Corner accent diamond
    const dx = cx + dirX * 4.5;
    const dy = cy + dirY * 4.5;
    doc.setFillColor(...goldAccent);
    doc.lines(
      [
        [1.1, -1.1],
        [1.1, 1.1],
        [-1.1, 1.1],
        [-1.1, -1.1],
      ],
      dx - 1.1,
      dy,
      [1, 1],
      'F'
    );
  };

  drawCorner(10, 10, 1, 1);
  drawCorner(pageWidth - 10, 10, -1, 1);
  drawCorner(10, pageHeight - 10, 1, -1);
  drawCorner(pageWidth - 10, pageHeight - 10, -1, -1);
}

/**
 * Draws the circular organization logo with a luxury double-ring circular frame.
 * If the logo is absent or fails, draws an elegant monogram crest.
 */
function drawCircularOrganizationLogo(
  doc,
  circularLogoDataUrl,
  orgName,
  cx,
  cy,
  radius,
  primaryNavy,
  goldPrimary,
  goldWarm
) {
  // Outer gold circular frame
  doc.setDrawColor(...goldPrimary);
  doc.setLineWidth(0.75);
  doc.circle(cx, cy, radius + 1.2, 'D');

  // Inner navy circular frame
  doc.setDrawColor(...primaryNavy);
  doc.setLineWidth(0.4);
  doc.circle(cx, cy, radius + 0.4, 'D');

  if (circularLogoDataUrl) {
    try {
      const diameter = radius * 2;
      doc.addImage(
        circularLogoDataUrl,
        'PNG',
        cx - radius,
        cy - radius,
        diameter,
        diameter
      );
      return;
    } catch (err) {
      console.error('Failed to embed circular logo into PDF:', err);
    }
  }

  // Fallback: Elegant Circular Monogram Crest
  doc.setFillColor(...primaryNavy);
  doc.circle(cx, cy, radius, 'F');

  doc.setDrawColor(...goldWarm);
  doc.setLineWidth(0.3);
  doc.circle(cx, cy, radius - 1.2, 'D');

  const words = orgName.split(/\s+/).filter(Boolean);
  const initials =
    words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : orgName.slice(0, 2).toUpperCase() || 'VS';

  try {
    doc.setFont('Cinzel', 'bold');
  } catch {
    doc.setFont('times', 'bold');
  }
  doc.setFontSize(9);
  doc.setTextColor(...goldWarm);
  doc.text(initials, cx, cy + 3.2, { align: 'center' });
}

/**
 * Draws the ornamental horizontal title plaque replacing simple rectangular boxes.
 */
function drawCertificateTitlePlaque(
  doc,
  mainTitle,
  cx,
  cy,
  width,
  height,
  primaryNavy,
  goldPrimary,
  goldWarm
) {
  const halfW = width / 2;
  const halfH = height / 2;
  const notch = 3.5;

  // Notched / Ornamental Plaque Polygon
  const left = cx - halfW;
  const right = cx + halfW;
  const top = cy - halfH;
  const bottom = cy + halfH;

  doc.setFillColor(...primaryNavy);
  doc.setDrawColor(...goldPrimary);
  doc.setLineWidth(0.8);

  // Plaque shape with notched corners
  const plaquePoints = [
    [left + notch, top],
    [right - notch, top],
    [right, top + notch],
    [right + 3, cy],
    [right, bottom - notch],
    [right - notch, bottom],
    [left + notch, bottom],
    [left, bottom - notch],
    [left - 3, cy],
    [left, top + notch],
  ];

  // Draw filled plaque
  doc.lines(
    plaquePoints.slice(1).map((pt, i) => [pt[0] - plaquePoints[i][0], pt[1] - plaquePoints[i][1]]),
    plaquePoints[0][0],
    plaquePoints[0][1],
    [1, 1],
    'FD',
    true
  );

  // Inner hairline detailing
  doc.setDrawColor(...goldWarm);
  doc.setLineWidth(0.3);
  doc.rect(left + 2, top + 1.2, width - 4, height - 2.4, 'D');

  // Decorative side finials (Gold diamond and flourishes on left and right)
  const drawFinial = (fx, dir) => {
    doc.setFillColor(...goldPrimary);
    doc.lines(
      [
        [1.5, -1.5],
        [1.5, 1.5],
        [-1.5, 1.5],
        [-1.5, -1.5],
      ],
      fx - 1.5,
      cy,
      [1, 1],
      'F'
    );
    // Horizontal accent ticks
    doc.setDrawColor(...goldPrimary);
    doc.setLineWidth(0.5);
    doc.line(fx + dir * 2.5, cy, fx + dir * 11, cy);
    doc.circle(fx + dir * 12, cy, 0.6, 'F');
  };

  drawFinial(left - 5, -1);
  drawFinial(right + 5, 1);

  // Title Text inside plaque
  try {
    doc.setFont('Cinzel', 'bold');
  } catch {
    doc.setFont('times', 'bold');
  }
  doc.setFontSize(17);
  doc.setTextColor(255, 255, 255);
  doc.text(mainTitle, cx, cy + 3.0, { align: 'center' });
}

/**
 * Draws decorative gold laurel branches alongside the recipient's name.
 */
function drawLaurelBranches(doc, cx, cy, spanWidth) {
  const drawBranch = (startX, dir) => {
    doc.setDrawColor(217, 119, 6); // goldAccent
    doc.setFillColor(217, 119, 6);
    doc.setLineWidth(0.45);

    // Curved stem line
    const stem = [
      [startX, cy + 1],
      [startX + dir * 5, cy + 0.2],
      [startX + dir * 11, cy - 1.5],
      [startX + dir * 17, cy - 3.8],
    ];
    for (let i = 0; i < stem.length - 1; i++) {
      doc.line(stem[i][0], stem[i][1], stem[i + 1][0], stem[i + 1][1]);
    }

    // Leaf pairs
    const leaves = [
      { dx: 3.5, dy: 0, w: 2.2, h: 1.1 },
      { dx: 4.5, dy: 1.8, w: 2.1, h: 1.0 },
      { dx: 8.5, dy: -1.2, w: 2.3, h: 1.1 },
      { dx: 9.5, dy: 1.2, w: 2.1, h: 1.0 },
      { dx: 13.5, dy: -2.8, w: 2.3, h: 1.1 },
      { dx: 14.5, dy: -0.2, w: 2.1, h: 1.0 },
      { dx: 17.5, dy: -4.2, w: 2.4, h: 1.1 }, // tip leaf
    ];

    for (const leaf of leaves) {
      doc.ellipse(startX + dir * leaf.dx, cy + leaf.dy, leaf.w, leaf.h, 'F');
    }
  };

  const leftStart = cx - spanWidth / 2 - 4;
  const rightStart = cx + spanWidth / 2 + 4;

  drawBranch(leftStart, -1);
  drawBranch(rightStart, 1);
}

/**
 * Draws the recipient name with premium typography, dynamic scaling, and decorative rules.
 */
function drawStyledRecipientName(
  doc,
  recipientName,
  cx,
  cy,
  maxAvailableWidth,
  slateNavy,
  goldAccent
) {
  let fontSize = 28;
  try {
    doc.setFont('PlayfairDisplay', 'bold');
  } catch {
    doc.setFont('times', 'bold');
  }

  doc.setFontSize(fontSize);
  let nameWidth = doc.getTextWidth(recipientName);

  // Dynamic scaling for long recipient names
  if (nameWidth > maxAvailableWidth) {
    fontSize = Math.max(17, Math.floor(fontSize * (maxAvailableWidth / nameWidth)));
    doc.setFontSize(fontSize);
    nameWidth = doc.getTextWidth(recipientName);
  }

  doc.setTextColor(...slateNavy);
  doc.text(recipientName, cx, cy, { align: 'center' });

  // Draw Laurel branches on both sides
  drawLaurelBranches(doc, cx, cy - 2, nameWidth);

  // Decorative gold underline with center diamond
  const underlineY = cy + 4.5;
  const ruleWidth = Math.min(Math.max(nameWidth + 30, 85), 185);

  doc.setDrawColor(...goldAccent);
  doc.setLineWidth(0.65);
  doc.line(cx - ruleWidth / 2, underlineY, cx + ruleWidth / 2, underlineY);

  // Center diamond flourish
  doc.setFillColor(...goldAccent);
  doc.lines(
    [
      [1.3, -1.3],
      [1.3, 1.3],
      [-1.3, 1.3],
      [-1.3, -1.3],
    ],
    cx - 1.3,
    underlineY,
    [1, 1],
    'F'
  );

  // Flanking accent dots
  doc.circle(cx - 7, underlineY, 0.45, 'F');
  doc.circle(cx + 7, underlineY, 0.45, 'F');
}



/**
 * Draws the elongated capsule / elliptical-style tally information panel.
 */
function drawDecorativeTallyCapsule(
  doc,
  isVictory,
  votesReceived,
  totalVotes,
  votePercentage,
  issueDateFormatted,
  resultVer,
  cx,
  cy,
  width,
  height,
  certAccent,
  certAccentLight,
  goldAccent,
  secondarySlate
) {
  const radius = height / 2;
  const left = cx - width / 2;
  const top = cy - height / 2;

  // Background capsule fill & gold border
  doc.setFillColor(...certAccentLight);
  doc.setDrawColor(...goldAccent);
  doc.setLineWidth(0.55);
  doc.roundedRect(left, top, width, height, radius, radius, 'FD');

  // Inner delicate hairline
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.2);
  doc.roundedRect(
    left + 0.8,
    top + 0.8,
    width - 1.6,
    height - 1.6,
    radius - 0.8,
    radius - 0.8,
    'D'
  );

  const votesRecorded =
    typeof votesReceived === 'number'
      ? `${votesReceived.toLocaleString()} votes`
      : '0 votes';

  const percentageStr =
    votePercentage !== null && votePercentage !== undefined
      ? `(${votePercentage}%)`
      : '';

  const totalVotesStr =
    typeof totalVotes === 'number' && totalVotes > 0
      ? `of ${totalVotes.toLocaleString()} ballots cast`
      : '';

  // Line 1: Certified Mandate or Candidate Participation
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...certAccent);

  const headline = isVictory
    ? `CERTIFIED MANDATE: ${votesRecorded} ${percentageStr} ${totalVotesStr}`.trim()
    : `CANDIDATE PARTICIPATION: ${votesRecorded} ${percentageStr} RECORDED`.trim();

  // Larger headline font with automatic fitting
  const headlineMaxWidth = width - 24;
  let headlineFontSize = 9.5;
  const headlineMinFontSize = 8;

  doc.setFontSize(headlineFontSize);

  while (
    doc.getTextWidth(headline) > headlineMaxWidth &&
    headlineFontSize > headlineMinFontSize
  ) {
    headlineFontSize = Math.max( headlineMinFontSize, headlineFontSize - 0.1 );
    doc.setFontSize(headlineFontSize);
  }

  const headlineWidth = doc.getTextWidth(headline);

  doc.text(headline, cx - headlineWidth / 2, cy - 1, {
    align: 'left'
  });

  // Line 2: Details & Result Version
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondarySlate);

  if (typeof doc.setCharSpace === 'function') {
    doc.setCharSpace(0);
  }

  const subline = isVictory
    ? `Declared on ${issueDateFormatted}  |  Official Integrity Certified  |  Result Version: ${resultVer}`
    : `Official Candidate Recognition  |  Certified on ${issueDateFormatted}  |  Result Version: ${resultVer}`;

  // Larger supporting text with automatic fitting
  const sublineMaxWidth = width - 24;
  let sublineFontSize = 8;
  const sublineMinFontSize = 7;

  doc.setFontSize(sublineFontSize);

  while (
    doc.getTextWidth(subline) > sublineMaxWidth &&
    sublineFontSize > sublineMinFontSize
  ) {
    sublineFontSize = Math.max( sublineMinFontSize, sublineFontSize - 0.1 );
    doc.setFontSize(sublineFontSize);
  }

  // Exact horizontal centering
  const sublineWidth = doc.getTextWidth(subline);

  doc.text(subline, cx - sublineWidth / 2, cy + 3.8, {
    align: 'left'
  });
}

/**
 * Draws the bottom three-column section with vertical gold dividers:
 * Left: QR Code & Verification
 * Center: Official VoteSphere Seal
 * Right: Digital Authorization Attribution (NO demo signature)
 */
function drawTripartiteSection(
  doc,
  certificate,
  organization,
  verifyUrl,
  qrDataUrl,
  sealDataUrl,
  pageWidth,
  primaryNavy,
  secondarySlate,
  mutedSlate,
  goldPrimary,
  goldAccent,
  royalBlue
) {
  const sectionY = 139;

  // 1. Left Column: QR Code & Cryptographic Verification
  const qrX = 22;
  const qrSize = 25;

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', qrX, sectionY + 1, qrSize, qrSize);
    } catch {
      // Graceful fallback
    }
  }

  const metaX = qrX + qrSize + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...primaryNavy);
  doc.text('SCAN TO VERIFY AUTHENTICITY', metaX, sectionY + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...secondarySlate);
  doc.text(`ID: ${certificate.certificateId}`, metaX, sectionY + 11.5);
  doc.text(
    `Token: ${certificate.verificationToken ? certificate.verificationToken.slice(0, 16) : 'VERIFIED'}...`,
    metaX,
    sectionY + 16
  );
  doc.text('Tamper-Evident Ledger Record', metaX, sectionY + 20.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...royalBlue);
  doc.text('votesphere.org/verify', metaX, sectionY + 25);

  // Vertical Gold Divider 1 (between Left and Center)
  doc.setDrawColor(...goldAccent);
  doc.setLineWidth(0.35);
  doc.line(106, sectionY + 2, 106, sectionY + 28);
  doc.setFillColor(...goldAccent);
  doc.circle(106, sectionY + 15, 0.7, 'F');

  // 2. Center Column: Official VoteSphere Seal
  const sealSize = 30;
  const sealX = (pageWidth - sealSize) / 2; // 133.5 mm

  if (sealDataUrl) {
    try {
      doc.addImage(sealDataUrl, 'PNG', sealX, sectionY, sealSize, sealSize);
    } catch (err) {
      console.error('Failed to embed official seal in PDF:', err);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...primaryNavy);
  doc.text('VOTESPHERE ELECTORAL COMMISSION', pageWidth / 2, sectionY + sealSize + 3.2, {
    align: 'center',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(...goldPrimary);
  doc.text('OFFICIAL SEAL OF DEMOCRATIC INTEGRITY', pageWidth / 2, sectionY + sealSize + 6.4, {
    align: 'center',
  });

  // Vertical Gold Divider 2 (between Center and Right)
  doc.setDrawColor(...goldAccent);
  doc.setLineWidth(0.35);
  doc.line(190, sectionY + 2, 190, sectionY + 28);
  doc.setFillColor(...goldAccent);
  doc.circle(190, sectionY + 15, 0.7, 'F');

  // 3. Right Column: Digital Authorization Attribution
  // Strictly NO handwritten signatures or fake cursive text!
  const rightCenterX = 238;
  const rawOwner =
    organization.owner?.name ||
    organization.owner?.displayName ||
    organization.signatoryName ||
    certificate.metadata?.signatoryName ||
    'Authorized Election Official';

  // Format to Title Case if all uppercase (e.g., ANAND JHA -> Anand Jha)
  const ownerName =
    rawOwner === rawOwner.toUpperCase() && rawOwner.length > 2
      ? rawOwner
          .toLowerCase()
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      : rawOwner;

  const orgName = (
    certificate.orgNameSnapshot ||
    organization.name ||
    'Certified Organization'
  ).toUpperCase();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryNavy);
  doc.text(`Digitally signed by "${ownerName}"`, rightCenterX, sectionY + 11, { align: 'center' });

  // Signature rule
  doc.setDrawColor(...primaryNavy);
  doc.setLineWidth(0.5);
  doc.line(rightCenterX - 30, sectionY + 16, rightCenterX + 30, sectionY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryNavy);
  doc.text('Authorized Election Official', rightCenterX, sectionY + 21, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...secondarySlate);
  doc.text('Electoral Commission Representative', rightCenterX, sectionY + 25.5, {
    align: 'center',
  });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(...mutedSlate);
  doc.text(orgName, rightCenterX, sectionY + 30, { align: 'center' });
}



/**
 * Draws a compact footer ribbon with three equally distributed,
 * individually center-aligned text segments.
 */
function drawFooterRibbon(
  doc,
  certificateId,
  resultVer,
  ribbonX,
  ribbonY,
  ribbonWidth,
  ribbonHeight,
  primaryNavy,
  goldAccent,
  goldWarm
) {
  // Keep ribbon safely inside the certificate border
  const horizontalInset = 8;
  const adjustedX = ribbonX + horizontalInset;
  const adjustedWidth = ribbonWidth - horizontalInset * 2;

  const radius = ribbonHeight / 2;

  // Draw pill-shaped ribbon
  doc.setFillColor(...primaryNavy);
  doc.setDrawColor(...goldAccent);
  doc.setLineWidth(0.55);

  doc.roundedRect(
    adjustedX,
    ribbonY,
    adjustedWidth,
    ribbonHeight,
    radius,
    radius,
    'FD'
  );

  // Decorative gold end caps
  doc.setFillColor(...goldAccent);
  doc.circle(adjustedX + radius, ribbonY + radius, 1.1, 'F');
  doc.circle(
    adjustedX + adjustedWidth - radius,
    ribbonY + radius,
    1.1,
    'F'
  );

  // Three text segments
  const segments = [
    {
      text: `Certificate Serial: ${certificateId}`,
      color: goldWarm
    },
    {
      text: 'Zero-Knowledge Anonymity Protected',
      color: [255, 255, 255]
    },
    {
      text: `Result Version: ${resultVer}`,
      color: goldWarm
    }
  ];

  doc.setFont('helvetica', 'bold');

  if (typeof doc.setCharSpace === 'function') {
    doc.setCharSpace(0);
  }

  // Usable text area between the rounded ends
  const contentLeft = adjustedX + radius * 2 + 8;
  const contentRight = adjustedX + adjustedWidth - radius * 2 - 8;
  const contentWidth = contentRight - contentLeft;

  // Divide the available area into three equal sections
  const columnWidth = contentWidth / 3;

  // Increase font size while ensuring every segment fits
  let fontSize = 8.2;
  const minFontSize = 6.8;

  doc.setFontSize(fontSize);

  const fitsAllSegments = () => {
    return segments.every(
      segment => doc.getTextWidth(segment.text) <= columnWidth - 12
    );
  };

  while (!fitsAllSegments() && fontSize > minFontSize) {
    fontSize = Math.max(minFontSize, fontSize - 0.1);
    doc.setFontSize(fontSize);
  }

  // Vertically center text inside the ribbon
  const textY =
    ribbonY + ribbonHeight / 2 + (fontSize * 0.3528) / 2;

  // Draw all three segments centered in their respective columns
  segments.forEach((segment, index) => {
    const columnCenter =
      contentLeft + columnWidth * index + columnWidth / 2;

    doc.setTextColor(...segment.color);

    doc.text(segment.text, columnCenter, textY, {
      align: 'center'
    });
  });
}


/**
 * Generates an official, publication-quality Certificate PDF as a Buffer.
 * Supports both 'victory' (Winner Certificate) and 'participation' (Civic Participation Award).
 *
 * @param {Object} params
 * @param {Object} params.certificate - Certificate record (or plain object)
 * @param {Object} [params.organization] - Organization object
 * @param {Object} [params.election] - Election object
 * @param {string} [params.origin] - Base domain URL for QR verification
 * @returns {Promise<Buffer>}
 */
export async function generateCertificatePdfBuffer({
  certificate,
  organization = {},
  election = {},
  origin = process.env.NEXT_PUBLIC_APP_URL || 'https://votesphere.org',
}) {
  const isVictory = certificate.certificateType === 'victory';

  // Create Landscape A4 Document: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // Register custom typography
  registerCustomFonts(doc);

  // Palette: Deep royal navy, gold decorative accents, slate metadata
  const primaryNavy = [12, 35, 64]; // #0c2340 - Royal deep navy
  const slateNavy = [15, 23, 42]; // #0f172a - Headings & names
  const secondarySlate = [71, 85, 105]; // #475569 - Subtitles & captions
  const mutedSlate = [148, 163, 184]; // #94a3b8 - Minor metadata
  const goldPrimary = [180, 83, 9]; // #b45309 - Rich amber gold
  const goldAccent = [217, 119, 6]; // #d97706 - Vibrant gold trim
  const goldWarm = [245, 158, 11]; // #f59e0b - Warm gold text
  const royalBlue = [29, 78, 216]; // #1d4ed8 - Election titles & links

  const certAccent = isVictory ? goldPrimary : royalBlue;
  const certAccentLight = isVictory ? [255, 252, 240] : [244, 248, 255]; // Soft ivory vs pale blue

  // 1. Background & Security Guilloché
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  drawSecurityBackground(doc, pageWidth, pageHeight);

  // 2. Borders & Corner Flourishes
  drawCertificateBorder(doc, pageWidth, pageHeight, primaryNavy, goldAccent);
  drawOrnamentalCorners(doc, pageWidth, pageHeight, goldPrimary, goldAccent);

  // Revocation Watermark if Revoked
  if (certificate.revokedAt) {
    doc.saveGraphicsState();
    doc.setTextColor(239, 68, 68); // red-500
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(60);
    doc.text('REVOKED', pageWidth / 2, pageHeight / 2 + 10, {
      align: 'center',
      angle: 28,
    });
    doc.restoreGraphicsState();
  }

  // 3. Organization Branding at Top (NO VoteSphere logo at top)
  const orgName = (
    certificate.orgNameSnapshot ||
    organization.name ||
    'Certified Organization'
  ).toUpperCase();

  const orgLogoCenterY = 23.5;
  const orgLogoRadius = 8;

  // Module 1: True Circular Crop using sharp & SVG mask
  let circularLogoDataUrl = null;
  if (organization.logo) {
    circularLogoDataUrl = await cropLogoToCircle(organization.logo, 320);
  }

  drawCircularOrganizationLogo(
    doc,
    circularLogoDataUrl,
    orgName,
    pageWidth / 2,
    orgLogoCenterY,
    orgLogoRadius,
    primaryNavy,
    goldPrimary,
    goldWarm
  );

  // Dynamic Organization Name (Centered, uppercase, bold)
  let currentY = 36.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryNavy);
  doc.text(orgName, pageWidth / 2, currentY, { align: 'center' });

  // Organization Subtitle / Authority Designation
  currentY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(...goldPrimary);
  doc.text(
    'OFFICIAL DEMOCRATIC ELECTION AUTHORITY • CERTIFIED ELECTORAL RECORD',
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );

  // Central Gold Rule with Diamond
  currentY += 4;
  doc.setDrawColor(...goldAccent);
  doc.setLineWidth(0.45);
  doc.line(pageWidth / 2 - 42, currentY, pageWidth / 2 + 42, currentY);

  doc.setFillColor(...goldAccent);
  doc.lines(
    [
      [1, -1],
      [1, 1],
      [-1, 1],
      [-1, -1],
    ],
    pageWidth / 2 - 1,
    currentY,
    [1, 1],
    'F'
  );

  // 4. Prominent Title Plaque Banner (Module 3A)
  currentY += 10.5;
  const plaqueWidth = 210;
  const plaqueHeight = 13.5;
  const mainTitle = isVictory
    ? 'CERTIFICATE OF ELECTION VICTORY'
    : 'CERTIFICATE OF PARTICIPATION';

  const recipientName = (certificate.recipientNameSnapshot || 'Honored Candidate').trim();
  const positionTitle = certificate.positionTitleSnapshot || 'Elected Position';
  const electionTitle = certificate.electionTitleSnapshot || election.title || 'General Election';

  // Official PDF document properties (accessible metadata & search indexing)
  doc.setDocumentProperties({
    title: `${mainTitle} - ${recipientName}`,
    subject: `${positionTitle} - ${electionTitle}`,
    author: orgName,
    keywords: `VoteSphere, Certificate, ${certificate.certificateId}, ${recipientName}, ${mainTitle}`,
    creator: 'VoteSphere Electoral Commission',
  });

  drawCertificateTitlePlaque(
    doc,
    mainTitle,
    pageWidth / 2,
    currentY,
    plaqueWidth,
    plaqueHeight,
    primaryNavy,
    goldPrimary,
    goldWarm
  );

  // Subtitle Ribbon
  currentY += plaqueHeight / 2 + 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(150, 100, 25); // Warm bronze gold
  doc.text('THIS OFFICIAL CREDENTIAL IS PROUDLY CONFERRED UPON', pageWidth / 2, currentY, {
    align: 'center',
  });

  // 5. Recipient Name – Premium Typography & Laurel Branches (Module 2)
  currentY += 12;
  drawStyledRecipientName(doc, recipientName, pageWidth / 2, currentY, 175, slateNavy, goldAccent);

  // 6. Achievement & Election Citation
  currentY += 12.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.2);
  doc.setTextColor(51, 65, 85); // slate-700

  if (isVictory) {
    doc.text(
      'for securing the certified democratic mandate and being officially elected to the office of',
      pageWidth / 2,
      currentY,
      { align: 'center' }
    );
  } else {
    doc.text(
      'for successfully participating as a candidate in the democratic electoral process for the office of',
      pageWidth / 2,
      currentY,
      { align: 'center' }
    );
  }

  // Contested Office / Position Title
  currentY += 7;
  try {
    doc.setFont('Cinzel', 'bold');
  } catch {
    doc.setFont('times', 'bold');
  }
  doc.setFontSize(14.5);
  doc.setTextColor(...primaryNavy);
  doc.text(positionTitle, pageWidth / 2, currentY, { align: 'center' });

  // Election Title
  currentY += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...royalBlue);
  doc.text(`in the ${electionTitle}`, pageWidth / 2, currentY, { align: 'center' });

  // Organization Bylaws context
  currentY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...secondarySlate);
  doc.text(
    `conducted by ${orgName} under constitutional democratic electoral bylaws.`,
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );

  // 7. Decorative Tally Capsule / Elliptical Panel (Module 3B)
  currentY += 10.5;
  const capsuleWidth = 206;
  const capsuleHeight = 12.5;

  const issueDateFormatted = certificate.issuedAt
    ? new Date(certificate.issuedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

  const resultVer = certificate.resultVersion || 1;

  drawDecorativeTallyCapsule(
    doc,
    isVictory,
    certificate.votesReceived,
    certificate.totalVotes,
    certificate.votePercentage,
    issueDateFormatted,
    resultVer,
    pageWidth / 2,
    currentY,
    capsuleWidth,
    capsuleHeight,
    certAccent,
    certAccentLight,
    goldAccent,
    secondarySlate
  );

  // 8. Bottom Tripartite Section (Module 6)
  const cleanOrigin = origin.replace(/\/+$/, '');
  const verifyUrl = `${cleanOrigin}/certificates/verify/${certificate.certificateId}`;

  let qrDataUrl = null;
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 140,
      color: {
        dark: '#0c2340ff',
        light: '#ffffffff',
      },
    });
  } catch {
    // Fallback handled gracefully
  }

  const sealDataUrl = getOfficialSealDataUrl();

  drawTripartiteSection(
    doc,
    certificate,
    organization,
    verifyUrl,
    qrDataUrl,
    sealDataUrl,
    pageWidth,
    primaryNavy,
    secondarySlate,
    mutedSlate,
    goldPrimary,
    goldAccent,
    royalBlue
  );

  // 9. Bottom Information Ribbon with Left-Aligned Content (Modules 3C & 5)
  const ribbonX = 11;
  const ribbonY = 186.5;
  const ribbonWidth = pageWidth - 22; // 275 mm
  const ribbonHeight = 8;

  drawFooterRibbon(
    doc,
    certificate.certificateId,
    resultVer,
    ribbonX,
    ribbonY,
    ribbonWidth,
    ribbonHeight,
    primaryNavy,
    goldAccent,
    goldWarm
  );

  // Return generated PDF buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
