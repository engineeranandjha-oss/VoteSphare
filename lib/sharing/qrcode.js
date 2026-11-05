/**
 * VoteSphere QR Code Generation Engine
 * Generates high-resolution raster (PNG) and vector (SVG) QR codes with High Error Correction.
 */

import QRCode from 'qrcode';
import {
  getPublicElectionUrl,
  getDirectVotingBoothUrl,
  getResultsUrl,
  normalizeBaseUrl,
} from './links.js';

const DEFAULT_OPTIONS = {
  errorCorrectionLevel: 'H', // High error correction (retains scannability with up to 30% damage/distortion)
  margin: 2,
  width: 512,
  color: {
    dark: '#0f172a', // Slate-900 dark modules for optimal contrast
    light: '#ffffff', // Pure white background
  },
};

/**
 * Generate a PNG Data URL for a given target string or URL
 * @param {string} text - Target URL or string to encode
 * @param {object} [options]
 * @returns {Promise<string>} Base64 Data URL (data:image/png;base64,...)
 */
export async function generateQRCodeDataUrl(text, options = {}) {
  if (!text) throw new Error('Target text or URL is required for QR code generation');
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  return QRCode.toDataURL(text, mergedOptions);
}

/**
 * Generate a raw SVG string for a given target string or URL (for crisp vector scaling and print)
 * @param {string} text - Target URL or string to encode
 * @param {object} [options]
 * @returns {Promise<string>} SVG XML string
 */
export async function generateQRCodeSvg(text, options = {}) {
  if (!text) throw new Error('Target text or URL is required for QR code generation');
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options, type: 'svg' };
  return QRCode.toString(text, mergedOptions);
}

/**
 * Generate a binary PNG Buffer for direct file downloads or image response streaming
 * @param {string} text - Target URL or string to encode
 * @param {object} [options]
 * @returns {Promise<Buffer>} PNG binary buffer
 */
export async function generateQRCodeBuffer(text, options = {}) {
  if (!text) throw new Error('Target text or URL is required for QR code generation');
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  return QRCode.toBuffer(text, mergedOptions);
}

/**
 * Generate a comprehensive suite of QR codes for an election (Overview, Direct Booth, Results)
 * @param {string} electionId
 * @param {string} [baseUrl]
 * @param {object} [options]
 * @returns {Promise<object>}
 */
export async function generateElectionQRCodes(electionId, baseUrl, options = {}) {
  if (!electionId) throw new Error('electionId is required');

  const base = normalizeBaseUrl(baseUrl);
  const publicUrl = getPublicElectionUrl(electionId, base, options.utm);
  const voteUrl = getDirectVotingBoothUrl(electionId, base, options.utm);
  const resultsUrl = getResultsUrl(electionId, base, options.utm);

  const [publicDataUrl, voteDataUrl, resultsDataUrl] = await Promise.all([
    generateQRCodeDataUrl(publicUrl, options),
    generateQRCodeDataUrl(voteUrl, options),
    generateQRCodeDataUrl(resultsUrl, options),
  ]);

  return {
    electionId,
    public: {
      targetUrl: publicUrl,
      dataUrl: publicDataUrl,
    },
    vote: {
      targetUrl: voteUrl,
      dataUrl: voteDataUrl,
    },
    results: {
      targetUrl: resultsUrl,
      dataUrl: resultsDataUrl,
    },
    metadata: {
      errorCorrectionLevel: options.errorCorrectionLevel || DEFAULT_OPTIONS.errorCorrectionLevel,
      generatedAt: new Date().toISOString(),
      baseUrl: base,
    },
  };
}
