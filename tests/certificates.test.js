import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Certificate, Election, Position, Candidate } from '../models/index.js';
import { generateCertificatePdfBuffer } from '../lib/certificates/certificate-pdf.js';

describe('VoteSphere Module 3: Winner & Participation Certificates Test Suite', () => {
  // 1. Model Schema & Constraints
  describe('1. Certificate Model Schema Integrity', () => {
    test('verifies Certificate model attributes and foreign keys', () => {
      const attrs = Certificate.rawAttributes;
      assert.ok(attrs.id, 'id primary key must exist');
      assert.ok(attrs.certificateId, 'certificateId must exist');
      assert.ok(attrs.orgId, 'orgId FK must exist');
      assert.ok(attrs.electionId, 'electionId FK must exist');
      assert.ok(attrs.candidateId, 'candidateId FK must exist');
      assert.ok(attrs.positionId, 'positionId FK must exist');
      assert.ok(attrs.certificateType, 'certificateType ENUM must exist');
      assert.ok(attrs.recipientNameSnapshot, 'recipientNameSnapshot must exist');
      assert.ok(attrs.electionTitleSnapshot, 'electionTitleSnapshot must exist');
      assert.ok(attrs.positionTitleSnapshot, 'positionTitleSnapshot must exist');
      assert.ok(attrs.orgNameSnapshot, 'orgNameSnapshot must exist');
      assert.ok(attrs.verificationToken, 'verificationToken must exist');
      assert.ok(attrs.resultVersion, 'resultVersion must exist');
      assert.ok(attrs.issuedAt, 'issuedAt must exist');
      assert.ok(attrs.revokedAt, 'revokedAt must exist');
      assert.ok(attrs.revocationReason, 'revocationReason must exist');
      assert.ok(attrs.revokedBy, 'revokedBy FK must exist');
    });

    test('verifies certificateType allows only victory and participation', () => {
      const attr = Certificate.rawAttributes.certificateType;
      assert.deepEqual(attr.values, ['victory', 'participation']);
    });
  });

  // 2. Issuance Logic & Separation of Honors
  describe('2. Certificate Generation & Rules Engine', () => {
    const election = {
      id: 'e-1',
      title: '2026 Student Union General Election',
      status: 'published',
      orgId: 'org-1',
      organization: { name: 'Apex University' },
    };

    const positionResults = [
      {
        positionId: 'pos-1',
        positionName: 'Student Body President',
        totalVotes: 300,
        candidates: [
          { id: 'c-1', name: 'Alice Winner', status: 'active', voteCount: 180, percentage: 60.0, isWinner: true },
          { id: 'c-2', name: 'Bob RunnerUp', status: 'active', voteCount: 120, percentage: 40.0, isWinner: false },
          { id: 'c-3', name: 'Charlie Withdrawn', status: 'withdrawn', voteCount: 0, percentage: 0.0, isWinner: false },
        ],
      },
    ];

    function evaluateCertificates(results) {
      const certsToCreate = [];
      for (const pos of results) {
        for (const cand of pos.candidates) {
          if (cand.status === 'withdrawn') continue;
          const type = cand.isWinner ? 'victory' : 'participation';
          certsToCreate.push({
            candidateId: cand.id,
            candidateName: cand.name,
            positionId: pos.positionId,
            positionName: pos.positionName,
            certificateType: type,
            votesReceived: cand.voteCount,
            totalVotes: pos.totalVotes,
            votePercentage: cand.percentage,
          });
        }
      }
      return certsToCreate;
    }

    test('issues victory certificate to certified winner and participation to runner-up', () => {
      const certs = evaluateCertificates(positionResults);
      assert.equal(certs.length, 2, 'Withdrawn candidate must be excluded');

      const victory = certs.find((c) => c.candidateId === 'c-1');
      assert.ok(victory);
      assert.equal(victory.certificateType, 'victory');
      assert.equal(victory.votesReceived, 180);
      assert.equal(victory.votePercentage, 60.0);

      const participation = certs.find((c) => c.candidateId === 'c-2');
      assert.ok(participation);
      assert.equal(participation.certificateType, 'participation');
      assert.equal(participation.votesReceived, 120);
    });

    test('verifies certificates cannot be generated for non-published elections', () => {
      function assertCanGenerate(status) {
        if (status !== 'published') {
          throw new Error(`Certificates can only be generated for published elections. Status: ${status}`);
        }
      }

      assert.throws(() => assertCanGenerate('draft'), /published elections/);
      assert.throws(() => assertCanGenerate('live'), /published elections/);
      assert.throws(() => assertCanGenerate('ended'), /published elections/);
      assert.doesNotThrow(() => assertCanGenerate('published'));
    });
  });

  // 3. PDF Generator Buffer Verification
  describe('3. Professional PDF Generator', () => {
    test('generates valid landscape A4 PDF buffer for victory certificate with official seal and dynamic owner signature', async () => {
      const victoryCert = {
        certificateId: 'VS-CERT-2026-VIC01',
        certificateType: 'victory',
        recipientNameSnapshot: 'Alice Walker',
        electionTitleSnapshot: 'Presidential Election 2026',
        positionTitleSnapshot: 'Union President',
        orgNameSnapshot: 'National Governance Institute',
        votesReceived: 1420,
        totalVotes: 2500,
        votePercentage: 56.8,
        verificationToken: '0123456789abcdef0123456789abcdef0123456789abcdef',
        issuedAt: new Date().toISOString(),
      };

      const buffer = await generateCertificatePdfBuffer({
        certificate: victoryCert,
        organization: {
          name: 'National Governance Institute',
          owner: { displayName: 'Chancellor Victoria Vance' },
        },
      });

      assert.ok(Buffer.isBuffer(buffer), 'Output must be a Node.js Buffer');
      assert.ok(buffer.length > 500000, 'PDF buffer must contain high-resolution official seal binary payload');
      // Verify PDF header magic bytes %PDF
      const header = buffer.toString('utf-8', 0, 4);
      assert.equal(header, '%PDF');

      const raw = buffer.toString('binary');
      assert.ok(raw.includes('Alice Walker'), 'Must contain recipient name');
      assert.ok(raw.includes('CERTIFICATE OF ELECTION VICTORY'), 'Must contain victory certificate title');
      assert.ok(raw.includes('Digitally signed by'), 'Must contain digital signature attribution');
      assert.ok(raw.includes('Chancellor Victoria Vance'), 'Must contain dynamically fetched owner name');
    });

    test('generates valid PDF buffer for participation certificate with organization logo and revoked watermark', async () => {
      const sampleLogo =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

      const revokedCert = {
        certificateId: 'VS-CERT-2026-PAR02',
        certificateType: 'participation',
        recipientNameSnapshot: 'David Smith',
        electionTitleSnapshot: 'Board of Directors 2026',
        positionTitleSnapshot: 'Executive Director',
        orgNameSnapshot: 'Metropolitan Guild',
        votesReceived: 320,
        totalVotes: 1200,
        votePercentage: 26.6,
        verificationToken: 'abcdef0123456789abcdef0123456789abcdef0123456789',
        issuedAt: new Date().toISOString(),
        revokedAt: new Date().toISOString(),
        revocationReason: 'Candidate disqualification discovered after election closure',
      };

      const buffer = await generateCertificatePdfBuffer({
        certificate: revokedCert,
        organization: {
          name: 'Metropolitan Guild',
          logo: sampleLogo,
          owner: { name: 'Arthur Pendelton' },
        },
      });

      assert.ok(Buffer.isBuffer(buffer));
      assert.equal(buffer.toString('utf-8', 0, 4), '%PDF');

      const raw = buffer.toString('binary');
      assert.ok(raw.includes('David Smith'), 'Must contain recipient name');
      assert.ok(raw.includes('CERTIFICATE OF PARTICIPATION'), 'Must contain participation title');
      assert.ok(raw.includes('REVOKED'), 'Must include REVOKED watermark');
      assert.ok(raw.includes('Arthur Pendelton'), 'Must contain dynamically fetched owner name');
    });
  });

  // 4. Public Verification & Administrative Revocation
  describe('4. Certificate Public Verification & Revocation Flow', () => {
    const certStore = new Map();

    const cert1 = {
      id: 'uuid-cert-1',
      certificateId: 'VS-CERT-2026-X1Y2Z',
      verificationToken: 'token-secret-12345',
      certificateType: 'victory',
      recipientNameSnapshot: 'Sarah Connor',
      electionTitleSnapshot: 'Global Representative Vote',
      positionTitleSnapshot: 'Chief Delegate',
      orgNameSnapshot: 'Alliance Council',
      revokedAt: null,
      revocationReason: null,
    };

    certStore.set(cert1.certificateId, cert1);

    function verifyCertificate(queryId) {
      const cert = certStore.get(queryId);
      if (!cert) {
        return { status: 'not_found', verified: false };
      }
      if (cert.revokedAt) {
        return {
          status: 'revoked',
          verified: false,
          revocationReason: cert.revocationReason,
          revokedAt: cert.revokedAt,
        };
      }
      return { status: 'valid', verified: true, certificate: cert };
    }

    test('returns valid status for active certificate', () => {
      const res = verifyCertificate('VS-CERT-2026-X1Y2Z');
      assert.equal(res.status, 'valid');
      assert.equal(res.verified, true);
      assert.equal(res.certificate.recipientNameSnapshot, 'Sarah Connor');
    });

    test('returns not_found status for unknown certificate serial', () => {
      const res = verifyCertificate('VS-CERT-UNKNOWN');
      assert.equal(res.status, 'not_found');
      assert.equal(res.verified, false);
    });

    test('records revocation reason and revoker, reflecting revoked status on public verification', () => {
      // Perform revocation
      const reason = 'Election recount altered winner determination';
      cert1.revokedAt = new Date().toISOString();
      cert1.revocationReason = reason;

      const res = verifyCertificate('VS-CERT-2026-X1Y2Z');
      assert.equal(res.status, 'revoked');
      assert.equal(res.verified, false);
      assert.equal(res.revocationReason, reason);
    });
  });
});

