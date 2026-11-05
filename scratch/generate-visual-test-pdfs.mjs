import fs from 'fs';
import path from 'path';
import { generateCertificatePdfBuffer, cropLogoToCircle } from '../lib/certificates/certificate-pdf.js';
import sharp from 'sharp';

async function runVisualTests() {
  const outDir = path.join(process.cwd(), 'tmp', 'test-certificates');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Create a 3:1 wide rectangular test logo
  const wideLogo = await sharp({
    create: {
      width: 600,
      height: 200,
      channels: 4,
      background: { r: 12, g: 35, b: 64, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
  const wideLogoDataUrl = `data:image/png;base64,${wideLogo.toString('base64')}`;

  // 2. Load SSC Firm logo from database if available or create realistic logo
  let sscFirmLogo = wideLogoDataUrl;
  try {
    const { Organization } = await import('../models/index.js');
    const org = await Organization.findOne({ where: { slug: 'ssc-firm' } });
    if (org?.logo) sscFirmLogo = org.logo;
  } catch (err) {
    console.log('Using generated logo for test');
  }

  const testCases = [
    {
      filename: '1-winner-standard.pdf',
      certificate: {
        certificateId: 'VS-CERT-2026-WIN01',
        certificateType: 'victory',
        recipientNameSnapshot: 'Anand Jha',
        electionTitleSnapshot: 'General Election 2026',
        positionTitleSnapshot: 'Chief Executive Officer',
        orgNameSnapshot: 'SSC Firm',
        votesReceived: 12450,
        totalVotes: 18200,
        votePercentage: 68.4,
        verificationToken: '0123456789abcdef0123456789abcdef',
        issuedAt: new Date().toISOString(),
      },
      organization: {
        name: 'SSC Firm',
        logo: sscFirmLogo,
        owner: { displayName: 'Anand Jha' },
      },
    },
    {
      filename: '2-participation-standard.pdf',
      certificate: {
        certificateId: 'VS-CERT-2026-PAR02',
        certificateType: 'participation',
        recipientNameSnapshot: 'Elena Rostova',
        electionTitleSnapshot: 'Annual Executive Election',
        positionTitleSnapshot: 'Vice President of Operations',
        orgNameSnapshot: 'Global Civic Union',
        votesReceived: 5750,
        totalVotes: 18200,
        votePercentage: 31.6,
        verificationToken: 'fedcba9876543210fedcba9876543210',
        issuedAt: new Date().toISOString(),
      },
      organization: {
        name: 'Global Civic Union',
        logo: wideLogoDataUrl,
        owner: { displayName: 'Marcus Aurelius Sterling' },
      },
    },
    {
      filename: '3-winner-long-name.pdf',
      certificate: {
        certificateId: 'VS-CERT-2026-LONG03',
        certificateType: 'victory',
        recipientNameSnapshot: 'Dr. Alexander Bartholomew Montgomery-Chamberlain III',
        electionTitleSnapshot: 'Faculty Senate Leadership Election',
        positionTitleSnapshot: 'Dean of Institutional Strategy',
        orgNameSnapshot: 'Oxford Academic Consortium',
        votesReceived: 420,
        totalVotes: 512,
        votePercentage: 82.0,
        verificationToken: 'aabbccddeeff00112233445566778899',
        issuedAt: new Date().toISOString(),
      },
      organization: {
        name: 'Oxford Academic Consortium',
        owner: { displayName: 'Prof. Alistair Finch' },
      },
    },
    {
      filename: '4-winner-short-name.pdf',
      certificate: {
        certificateId: 'VS-CERT-2026-SHRT04',
        certificateType: 'victory',
        recipientNameSnapshot: 'Bo Li',
        electionTitleSnapshot: 'Student Council Election',
        positionTitleSnapshot: 'Council President',
        orgNameSnapshot: 'Apex University',
        votesReceived: 1200,
        totalVotes: 1500,
        votePercentage: 80.0,
        verificationToken: '11223344556677889900aabbccddeeff',
        issuedAt: new Date().toISOString(),
      },
      organization: {
        name: 'Apex University',
        owner: { displayName: 'Chancellor Victoria Vance' },
      },
    },
    {
      filename: '5-winner-long-org-and-election.pdf',
      certificate: {
        certificateId: 'VS-CERT-2026-MASSIVE05',
        certificateType: 'victory',
        recipientNameSnapshot: 'Hon. Jacqueline Delacroix',
        electionTitleSnapshot: 'Quadrennial Transatlantic Democratic Constitutional Council Election',
        positionTitleSnapshot: 'Senior Commissioner of Transparency & Electoral Governance',
        orgNameSnapshot: 'International Democratic Governance & Constitutional Research Foundation',
        votesReceived: 89400,
        totalVotes: 120000,
        votePercentage: 74.5,
        verificationToken: 'ffffaaaabbbbccccddddeeeeffff0000',
        issuedAt: new Date().toISOString(),
      },
      organization: {
        name: 'International Democratic Governance & Constitutional Research Foundation',
        owner: { displayName: 'Sir Reginald Featherstone' },
      },
    },
    {
      filename: '6-winner-no-logo-monogram.pdf',
      certificate: {
        certificateId: 'VS-CERT-2026-NOLOGO06',
        certificateType: 'victory',
        recipientNameSnapshot: 'Samantha Hayes',
        electionTitleSnapshot: 'Chamber of Commerce Annual Vote',
        positionTitleSnapshot: 'President of Commercial Relations',
        orgNameSnapshot: 'Metropolitan Business Alliance',
        votesReceived: 310,
        totalVotes: 450,
        votePercentage: 68.9,
        verificationToken: '1234567890abcdef1234567890abcdef',
        issuedAt: new Date().toISOString(),
      },
      organization: {
        name: 'Metropolitan Business Alliance',
        logo: null, // Monogram fallback
        owner: { displayName: 'Jonathan Vance' },
      },
    },
    {
      filename: '7-missing-optional-results.pdf',
      certificate: {
        certificateId: 'VS-CERT-2026-OPT07',
        certificateType: 'victory',
        recipientNameSnapshot: 'David Kim',
        electionTitleSnapshot: 'General Union Election',
        positionTitleSnapshot: 'Ombudsperson',
        orgNameSnapshot: 'Federated Union of Engineers',
        votesReceived: null,
        totalVotes: null,
        votePercentage: null,
        verificationToken: '0987654321fedcba0987654321fedcba',
        issuedAt: new Date().toISOString(),
      },
      organization: {
        name: 'Federated Union of Engineers',
        owner: { displayName: 'Chief Warden Thomas' },
      },
    },
  ];

  for (const tc of testCases) {
    const pdfBuf = await generateCertificatePdfBuffer({
      certificate: tc.certificate,
      organization: tc.organization,
      election: { title: tc.certificate.electionTitleSnapshot },
    });
    const filePath = path.join(outDir, tc.filename);
    fs.writeFileSync(filePath, pdfBuf);
    console.log(`✓ Generated ${tc.filename} (${pdfBuf.length} bytes)`);
  }

  console.log(`\nAll 7 visual test certificates generated in ${outDir}`);
}

runVisualTests().catch(console.error);

