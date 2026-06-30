const crypto = require('crypto');

function generateSecret() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  while (result.length < 16) {
    const byte = crypto.randomBytes(1)[0];
    if (byte < 224) { // 224 is 7 * 32, avoids modulo bias
      result += alphabet[byte % 32];
    }
  }
  return result;
}

const secret = generateSecret();
const label = 'admin';
const issuer = 'audiotrackdown';
const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;

const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(otpauthUrl)}`;

console.log(`
======================================================================
  🔒  audiotrackdown — Admin Two-Factor Authentication (2FA) Setup
======================================================================

1. Open your authenticator app (Google Authenticator, Authy, etc.) on your phone.

2. Scan the QR code by opening this link in your browser:
   👉 ${qrUrl}

3. Or manually enter the Secret Key details:
   🔑 Secret Key: ${secret}
   👤 Account Name: ${label}
   🏢 Issuer: ${issuer}

4. To enforce 2FA verification, copy the Secret Key and update your
   backend/.env file with the following variable:

   ADMIN_TOTP_SECRET=${secret}

5. Save the .env file and restart your backend server.

⚠️  IMPORTANT: If you remove or comment out ADMIN_TOTP_SECRET from
    backend/.env, 2FA checking will be bypassed and require only the 
    normal admin password to access the panel.
======================================================================
`);
