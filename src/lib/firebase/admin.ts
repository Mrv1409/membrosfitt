import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, initializeFirestore, FirestoreSettings } from 'firebase-admin/firestore';

// Configuração do Firebase Admin
const serviceAccount: { [key: string]: string } = {
  type: process.env.FIREBASE_TYPE as string,
  project_id: process.env.FIREBASE_PROJECT_ID as string,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID as string,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') as string,
  client_email: process.env.FIREBASE_CLIENT_EMAIL as string,
  client_id: process.env.FIREBASE_CLIENT_ID as string,
  auth_uri: process.env.FIREBASE_AUTH_URI as string,
  token_uri: process.env.FIREBASE_TOKEN_URI as string,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL as string,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL as string
};

if (!getApps().length) {
  const app = initializeApp({
    credential: cert(serviceAccount),
  });

  // Inicializar Firestore com configuração específica
  const firestoreSettings: FirestoreSettings = {};
  // Configurações padrão do Firestore são suficientes para a maioria dos casos

  initializeFirestore(app, firestoreSettings);
}

export const db = getFirestore();
