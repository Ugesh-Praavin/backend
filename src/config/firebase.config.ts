import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

const serviceAccountPath = path.resolve(__dirname, '../../firebase-adminsdk.json');

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, 'utf8')
) as ServiceAccount;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();

export { admin };
