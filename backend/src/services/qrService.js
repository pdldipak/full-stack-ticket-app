import QRCode from 'qrcode';

/**
 * Generates a PNG QR code as a base64 data URL (data:image/png;base64,...).
 * Payload is the ticket code scanned at entry.
 */
export async function generateQrDataUrl(payload) {
  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    margin: 2,
    width: 256,
  });
  return dataUrl;
}
