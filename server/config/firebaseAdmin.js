const { initializeApp, getApps, cert, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

function getCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    const hasPlaceholder = String(serviceAccount.project_id || '').includes('YOUR_') || String(serviceAccount.private_key || '').includes('YOUR_');
    if (!hasPlaceholder) {
      if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        return cert(serviceAccount);
    }
  }
  return process.env.GOOGLE_APPLICATION_CREDENTIALS ? applicationDefault() : undefined;
}

if (!getApps().length) {
  const credential = getCredential();
  initializeApp({ ...(credential ? { credential } : {}), projectId: process.env.FIREBASE_PROJECT_ID || 'meridian-c8e1a' });
}

module.exports = { auth: getAuth };
