import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,// eslint-disable-line
  DocumentSnapshot,// eslint-disable-line
  QueryConstraint,
  writeBatch,
  increment,
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';

import { db, COLLECTIONS, FirebaseDocument } from './config';

// ===== CLASSE BASE PARA OPERAÇÕES FIRESTORE =====
export class FirebaseHelper<T extends FirebaseDocument> {
  constructor(private collectionName: string) {}

  // ===== CREATE =====
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Documento criado: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao criar documento:', error);
      throw new Error(`Erro ao criar ${this.collectionName}: ${error}`);
    }
  }

  // ===== READ =====
  async getById(id: string): Promise<T | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate()
        } as T;
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar documento:', error);
      throw new Error(`Erro ao buscar ${this.collectionName}: ${error}`);
    }
  }

  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as T[];
    } catch (error) {
      console.error('❌ Erro ao buscar documentos:', error);
      throw new Error(`Erro ao buscar ${this.collectionName}: ${error}`);
    }
  }

  // ===== UPDATE =====
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Documento atualizado: ${id}`);
    } catch (error) {
      console.error('❌ Erro ao atualizar documento:', error);
      throw new Error(`Erro ao atualizar ${this.collectionName}: ${error}`);
    }
  }

  // ===== DELETE =====
  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, id));
      console.log(`✅ Documento deletado: ${id}`);
    } catch (error) {
      console.error('❌ Erro ao deletar documento:', error);
      throw new Error(`Erro ao deletar ${this.collectionName}: ${error}`);
    }
  }

  // ===== REAL-TIME LISTENER =====
  onSnapshot(
    callback: (data: T[]) => void,
    constraints: QueryConstraint[] = []
  ): Unsubscribe {
    const q = query(collection(db, this.collectionName), ...constraints);
    
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as T[];
      
      callback(data);
    });
  }

  // ===== BATCH OPERATIONS =====
  async batchWrite(operations: Array<{
    type: 'create' | 'update' | 'delete';
    id?: string;
    data?: unknown;
  }>): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      operations.forEach(operation => {
        const docRef = operation.id 
          ? doc(db, this.collectionName, operation.id)
          : doc(collection(db, this.collectionName));
          
        switch (operation.type) {
          case 'create':
            batch.set(docRef, {
              ...operation.data || {},
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            break;
          case 'update':
            batch.update(docRef, {
              ...operation.data || {},
              updatedAt: serverTimestamp()
            });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });
      
      await batch.commit();
      console.log(`✅ Batch de ${operations.length} operações executado`);
    } catch (error) {
      console.error('❌ Erro no batch:', error);
      throw new Error(`Erro no batch ${this.collectionName}: ${error}`);
    }
  }
}

// ===== INSTÂNCIAS ESPECÍFICAS =====
export const usersHelper = new FirebaseHelper(COLLECTIONS.USERS);
export const desafiosHelper = new FirebaseHelper(COLLECTIONS.DESAFIOS);
export const rankingsHelper = new FirebaseHelper(COLLECTIONS.RANKINGS);
export const userProgressHelper = new FirebaseHelper(COLLECTIONS.USER_PROGRESS);
export const desafiosProgressoHelper = new FirebaseHelper(COLLECTIONS.DESAFIOS_PROGRESSO);
export const userProfileHelper = new FirebaseHelper(COLLECTIONS.USER_PROFILE);
export const treinosHelper = new FirebaseHelper(COLLECTIONS.TREINOS);
export const userTreinosHelper = new FirebaseHelper(COLLECTIONS.USER_TREINOS);
export const nutricaoHelper = new FirebaseHelper(COLLECTIONS.NUTRICAO);
export const userNutricaoHelper = new FirebaseHelper(COLLECTIONS.USER_NUTRICAO);
export const notificacoesHelper = new FirebaseHelper(COLLECTIONS.NOTIFICACOES);
export const protocolosFitnessHelper = new FirebaseHelper(COLLECTIONS.PROTOCOLOS_FITNESS);
export const analyticsHelper = new FirebaseHelper(COLLECTIONS.ANALYTICS);

// ===== FUNÇÕES ESPECÍFICAS GAMIFICAÇÃO =====
export class GamificationHelpers {
  // Atualizar pontos do usuário
  static async updateUserPoints(userId: string, points: number): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        totalPoints: increment(points),
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Pontos atualizados: +${points} para ${userId}`);
    } catch (error) {
      console.error('❌ Erro ao atualizar pontos:', error);
      throw error;
    }
  }

  // Buscar ranking dos usuários
  static async getRanking(limitCount: number = 10): Promise<unknown[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.USERS),
        orderBy('totalPoints', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar ranking:', error);
      throw error;
    }
  }

  // Buscar desafios ativos
  static async getActiveDesafios(): Promise<unknown[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.DESAFIOS),
        where('ativo', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar desafios:', error);
      throw error;
    }
  }

  // Participar de um desafio
  static async participarDesafio(userId: string, desafioId: string): Promise<string> {
    try {
      const progressoData = {
        userId,
        desafioId,
        progresso: 0,
        status: 'ativo',
        dataInicio: serverTimestamp(),
        pontosGanhos: 0
      };
      
      const docRef = await addDoc(collection(db, COLLECTIONS.DESAFIOS_PROGRESSO), progressoData);
      console.log(`✅ Usuário ${userId} participando do desafio ${desafioId}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao participar do desafio:', error);
      throw error;
    }
  }
}

// ===== EXPORT DEFAULT =====
export default FirebaseHelper;