const jwt = require('jsonwebtoken');

let googlePublicCerts = null;
let googleCertsExpiry = 0;

/**
 * Dynamically fetches Google's public certificates for Firebase ID Token validation,
 * caching them according to Cache-Control max-age header.
 */
async function fetchGooglePublicCerts() {
  const now = Date.now();
  if (googlePublicCerts && now < googleCertsExpiry) {
    return googlePublicCerts;
  }

  console.log('[Auth Middleware] Fetching latest Google public certs for Firebase Auth...');
  const res = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
  if (!res.ok) {
    throw new Error('Failed to fetch Firebase public certs from Google.');
  }

  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  // Default to 1 hour if cache-control header is missing or invalid
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) * 1000 : 3600 * 1000;

  googlePublicCerts = await res.json();
  googleCertsExpiry = now + maxAge;
  return googlePublicCerts;
}

/**
 * Cryptographically verifies the Firebase ID Token (JWT)
 */
async function verifyFirebaseToken(token) {
  const decodedHeader = jwt.decode(token, { complete: true });
  if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
    throw new Error('Invalid token structure or missing key ID (kid).');
  }

  const kid = decodedHeader.header.kid;
  const certs = await fetchGooglePublicCerts();
  const cert = certs[kid];

  if (!cert) {
    // Force refresh certs and retry once in case keys rotated recently
    googlePublicCerts = null;
    const certsRetry = await fetchGooglePublicCerts();
    const certRetry = certsRetry[kid];
    if (!certRetry) {
      throw new Error(`Token key ID (kid) "${kid}" not found in current Google certificates.`);
    }
    return verifyJwtWithCert(token, certRetry);
  }

  return verifyJwtWithCert(token, cert);
}

function verifyJwtWithCert(token, cert) {
  // Read configured project ID. Use a default fallback if missing, but advise user to define it.
  const projectId = process.env.FIREBASE_PROJECT_ID || 'aivoicedub-59ee7';
  
  return new Promise((resolve, reject) => {
    jwt.verify(token, cert, {
      algorithms: ['RS256'],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`
    }, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

/**
 * Firebase ID Token authentication middleware.
 * Attaches verified user details to req.user, or leaves it null for guests.
 */
async function firebaseAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token || token === 'null' || token === 'undefined') {
    req.user = null;
    return next();
  }

  try {
    const decoded = await verifyFirebaseToken(token);
    req.user = {
      uid: decoded.sub,
      email: decoded.email
    };
    next();
  } catch (err) {
    console.error('[Auth Middleware] Firebase token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

module.exports = firebaseAuth;
