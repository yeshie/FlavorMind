#!/usr/bin/env node
// scripts/firebase/add-pending-recipe.js
// Usage:
//   node scripts/firebase/add-pending-recipe.js --key <PATH_TO_SERVICE_ACCOUNT_JSON>
// Optional:
//   --owner <USER_UID> (defaults to the provided authorId)

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const getArg = (flag) => {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
};

const ownerId = getArg('--owner') || 'bkwRDSGSkWbrwwiQMSNulL03K9a2';
const keyPathArg = getArg('--key');
const keyPathEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const keyPath = keyPathArg || keyPathEnv;

if (!keyPath) {
  console.error('Missing service account key. Provide --key <PATH> or set GOOGLE_APPLICATION_CREDENTIALS.');
  process.exit(1);
}

const resolvedKeyPath = path.resolve(keyPath);
if (!fs.existsSync(resolvedKeyPath)) {
  console.error(`Service account file not found: ${resolvedKeyPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(resolvedKeyPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const recipe = {
  title: 'Risotto',
  description:
    'A creamy, starchy rice dish cooked slowly in broth. Original ingredients: Arborio rice, white wine, butter, Parmesan. Local substitutes: Keeri Samba or Suwandel rice, coconut vinegar + 1 tsp sugar, ghee, thick coconut milk.',
  cuisine: 'Italian',
  category: 'dinner',
  difficulty: 'medium',
  prepTime: 0,
  cookTime: 35,
  servings: 1,
  ingredients: [
    { name: 'Keeri Samba or Suwandel rice' },
    { name: 'Ghee' },
    { name: 'Onion (finely chopped)' },
    { name: 'Coconut vinegar' },
    { name: 'Sugar', quantity: 1, unit: 'tsp' },
    { name: 'Hot vegetable stock' },
    { name: 'Thick coconut milk' },
    { name: 'Black pepper' },
  ],
  instructions: [
    { step: 1, description: 'Sauté finely chopped onions in ghee until translucent.' },
    { step: 2, description: 'Add Keeri Samba rice; stir for 2 minutes to toast the grains.' },
    { step: 3, description: 'Add the coconut vinegar and sugar mixture and let it evaporate.' },
    { step: 4, description: 'Add hot vegetable stock one ladle at a time, stirring constantly until absorbed.' },
    { step: 5, description: 'Once rice is tender, stir in thick coconut milk for creaminess.' },
    { step: 6, description: 'Garnish with a swirl of ghee and a pinch of black pepper.' },
  ],
  ownerId,
  publishStatus: 'pending',
  source: 'user',
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

const run = async () => {
  const firestore = admin.firestore();
  const docRef = await firestore.collection('recipes').add(recipe);
  console.log(`Recipe added: ${docRef.id}`);
  process.exit(0);
};

run().catch((error) => {
  console.error('Failed to add recipe:', error);
  process.exit(1);
});
