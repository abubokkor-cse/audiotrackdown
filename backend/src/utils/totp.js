const crypto = require('crypto');

/**
 * Base32 decoding helper (RFC 4648)
 */
function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let clean = base32.toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '');
  let len = clean.length;
  let bits = 0;
  let val = 0;
  let buffer = Buffer.alloc(Math.floor((len * 5) / 8));
  let index = 0;

  for (let i = 0; i < len; i++) {
    const idx = alphabet.indexOf(clean[i]);
    if (idx === -1) throw new Error('Invalid base32 character');
    val = (val << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      if (index < buffer.length) {
        buffer[index++] = (val >>> (bits - 8)) & 255;
      }
      bits -= 8;
    }
  }
  return buffer;
}

/**
 * Generate HOTP code (RFC 4226)
 */
function generateHotp(secretBuffer, counter) {
  const buffer = Buffer.alloc(8);
  let tempCounter = counter;
  for (let i = 7; i >= 0; i--) {
    buffer[i] = tempCounter & 0xff;
    tempCounter = tempCounter >> 8;
  }

  // HMAC-SHA-1
  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(buffer);
  const hmacResult = hmac.digest();

  // Dynamic truncation
  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const binary =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verify TOTP code (RFC 6238)
 */
function verifyTotp(token, secretBase32, windowSize = 1) {
  if (!token || !secretBase32) return false;
  
  const cleanToken = token.replace(/[\s-]/g, '');
  if (cleanToken.length !== 6 || isNaN(cleanToken)) return false;

  try {
    const secretBuffer = base32Decode(secretBase32);
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / 30);

    // Validate token against permitted time drift windows
    for (let i = -windowSize; i <= windowSize; i++) {
      const calculated = generateHotp(secretBuffer, counter + i);
      if (calculated === cleanToken) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('[TOTP Verification] Error decoding or computing TOTP:', err.message);
    return false;
  }
}

module.exports = {
  verifyTotp,
  base32Decode,
  generateHotp
};
