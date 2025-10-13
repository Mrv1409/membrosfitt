import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  connectFirestoreEmulator, // eslint-disable-line
  enableNetwork,
  disableNetwork 
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// ===== CONFIGURAÇÃO DO PROJETO =====
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app: FirebaseApp = initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

// ===== EMULADOR (DESENVOLVIMENTO) =====
if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR) {
  // Conectar ao emulador se necessário
  // connectFirestoreEmulator(db, 'localhost', 8080);
}

// ===== COLEÇÕES MAPEADAS =====
export const COLLECTIONS = {
  // Gamificação Core
  USERS: 'users',
  DESAFIOS: 'desafios',
  RANKINGS: 'rankings',
  USER_PROGRESS: 'userProgress',
  DESAFIOS_PROGRESSO: 'desafios_progresso',
  USER_PROFILE: 'userProfile',
  
  // Fitness Ecosystem
  TREINOS: 'treinos',
  USER_TREINOS: 'user_treinos',
  NUTRICAO: 'nutricao',
  USER_NUTRICAO: 'user_nutricao',
  NOTIFICACOES: 'notificacoes',
  PROTOCOLOS_FITNESS: 'protocolos_fitness',
  ANALYTICS: 'analytics'
} as const;

// ===== TIPOS DE DADOS =====
export interface FirebaseDocument {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserData extends FirebaseDocument {
  email: string;
  displayName: string;
  level: number;
  totalPoints: number;
  currentStreak: number;
  badges: string[];
  isActive: boolean;
}

export interface DesafioData extends FirebaseDocument {
  titulo: string;
  descricao: string;
  categoria: 'forca' | 'cardio' | 'flexibilidade' | 'resistencia';
  dificuldade: 'iniciante' | 'intermediario' | 'avancado';
  pontos: number;
  prazo: number; // dias
  meta: number;
  unidade: string;
  ativo: boolean;
  participantes: number;
}

export interface ProgressoData extends FirebaseDocument {
  userId: string;
  desafioId: string;
  progresso: number;
  meta: number;
  status: 'ativo' | 'concluido' | 'pausado' | 'abandonado';
  dataInicio: Date;
  dataFim?: Date;
  pontosGanhos: number;
}

// ===== CONEXÃO E HEALTH CHECK =====
export class FirebaseConnection {
  private static instance: FirebaseConnection;
  private isConnected: boolean = false;
  
  private constructor() {}
  
  static getInstance(): FirebaseConnection {
    if (!FirebaseConnection.instance) {
      FirebaseConnection.instance = new FirebaseConnection();
    }
    return FirebaseConnection.instance;
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      await enableNetwork(db);
      this.isConnected = true;
      console.log('🔥 Firebase conectado com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ Erro na conexão Firebase:', error);
      this.isConnected = false;
      return false;
    }
  }
  
  async disconnect(): Promise<void> {
    try {
      await disableNetwork(db);
      this.isConnected = false;
      console.log('📴 Firebase desconectado');
    } catch (error) {
      console.error('❌ Erro ao desconectar Firebase:', error);
    }
  }
  
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// ===== EXPORTS =====
export { app, db, auth };
export default FirebaseConnection.getInstance();