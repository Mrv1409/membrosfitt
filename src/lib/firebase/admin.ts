// src/lib/firebase/admin.ts
// Mock temporário - não funciona mas evita erros de build

import type { Firestore } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';

console.warn('Firebase Admin não está configurado. Funcionalidades de gamification não funcionarão.');

// Exporta mocks tipados
export const adminDb = null as unknown as Firestore;
export const adminAuth = null as unknown as Auth;

// Aliases para compatibilidade
export const db = adminDb;
export const auth = adminAuth;