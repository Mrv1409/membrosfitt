// lib/firebase/admin.ts
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;

// ✅ Inicialização segura - SÓ roda no servidor (API routes)
function initializeAdminApp() {
  // Verifica se já foi inicializado
  if (adminApp) {
    return { app: adminApp, db: adminDb!, auth: adminAuth! };
  }

  // Verifica se já existe alguma app admin
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    adminDb = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);
    return { app: adminApp, db: adminDb, auth: adminAuth };
  }

  // Validação de variáveis de ambiente
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      '❌ Variáveis de ambiente do Firebase Admin não configuradas. ' +
      'Configure: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
    );
  }

  try {
    // ✅ Inicializa Firebase Admin com credenciais
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        // ⚠️ CRITICAL: Remove quebras de linha extras da chave privada
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      projectId,
    });

    adminDb = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);

    console.log('✅ Firebase Admin inicializado com sucesso');
    
    return { app: adminApp, db: adminDb, auth: adminAuth };
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase Admin:', error);
    throw error;
  }
}

// ✅ Exportações seguras com lazy initialization
export function getAdminApp(): App {
  if (!adminApp) {
    const { app } = initializeAdminApp();
    return app;
  }
  return adminApp;
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    const { db } = initializeAdminApp();
    return db;
  }
  return adminDb;
}

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    const { auth } = initializeAdminApp();
    return auth;
  }
  return adminAuth;
}

// ✅ Aliases para compatibilidade com código existente
export const db = getAdminDb();
export const auth = getAdminAuth();

// ✅ Exporta funções helper para uso seguro
export { getAdminApp as adminApp };