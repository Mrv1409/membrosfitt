// src/lib/firebase/admin.ts
// Mock temporário - não funciona mas evita erros de build

console.warn('Firebase Admin não está configurado. Funcionalidades de gamification não funcionarão.');

// Exporta com os nomes que os arquivos esperam
export const adminDb = null as unknown;
export const adminAuth = null as unknown;

// ADICIONA ESSES:
export const db = null as unknown;  // ← Alguns arquivos importam como 'db'
export const auth = null as unknown;  // ← Alguns arquivos importam como 'auth'