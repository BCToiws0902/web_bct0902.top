import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../service-account.json'), 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkDb() {
  console.log('--- Checking site_config/main_config ---');
  const configDoc = await db.collection('site_config').doc('main_config').get();
  console.log('Config exists:', configDoc.exists);
  if (configDoc.exists) {
    console.log('Apps count:', (configDoc.data()?.apps || []).length);
    console.log('Quotes count:', (configDoc.data()?.content?.quotes || []).length);
  }

  console.log('--- Checking projects collection ---');
  const snapshot = await db.collection('projects').get();
  console.log('Projects count:', snapshot.size);
  snapshot.forEach(doc => {
    console.log('Project ID:', doc.id, '->', doc.data().title);
  });
}

checkDb().then(() => process.exit(0)).catch(console.error);
