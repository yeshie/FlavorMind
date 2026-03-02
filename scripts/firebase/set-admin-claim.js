#!/usr/bin/env node
// scripts/firebase/set-admin-claim.js
// Usage:
//   node scripts/firebase/set-admin-claim.js --uid <USER_UID> --admin true --key <PATH_TO_SERVICE_ACCOUNT_JSON>
// Or set GOOGLE_APPLICATION_CREDENTIALS and omit --key.

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const getArg = (flag) => {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
};

const uid = getArg('--uid');
const adminValueRaw = getArg('--admin');
const keyPathArg = getArg('--key');
const keyPathEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const keyPath = keyPathArg || keyPathEnv;

if (!uid) {
  console.error('Missing --uid <USER_UID>');
  process.exit(1);
}

if (!keyPath) {
  console.error('Missing service account key. Provide --key <PATH> or set GOOGLE_APPLICATION_CREDENTIALS.');
  process.exit(1);
}

const resolvedKeyPath = path.resolve(keyPath);
if (!fs.existsSync(resolvedKeyPath)) {
  console.error(`Service account file not found: ${resolvedKeyPath}`);
  process.exit(1);
}

const adminValue =
  adminValueRaw === undefined ? true : String(adminValueRaw).toLowerCase() === 'true';

const serviceAccount = JSON.parse(fs.readFileSync(resolvedKeyPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const run = async () => {
  await admin.auth().setCustomUserClaims(uid, { admin: adminValue });
  const updatedUser = await admin.auth().getUser(uid);
  console.log(
    `Admin claim ${adminValue ? 'set' : 'cleared'} for ${updatedUser.uid} (${updatedUser.email || 'no-email'})`
  );
  process.exit(0);
};

run().catch((error) => {
  console.error('Failed to set admin claim:', error);
  process.exit(1);
});
