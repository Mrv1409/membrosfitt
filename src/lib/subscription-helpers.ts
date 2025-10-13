import { db } from '@/lib/firebase'; //eslint-disable-next-line
import { collection, query, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';

// Tipos
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'canceled';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  isTrialActive: boolean;
  isSubscriptionActive: boolean;
  trialEndsAt: Date | null;
  daysLeftInTrial: number;
  canGeneratePlan: boolean;
  blockReason?: string;
}

/**
 * Verifica se o usuário possui um plano ativo
 */
export async function checkUserHasActivePlan(userId: string): Promise<boolean> {
  try {
    const plansRef = collection(db, 'users', userId, 'plano');
    const plansSnapshot = await getDocs(plansRef);
    
    return !plansSnapshot.empty;
  } catch (error) {
    console.error('Erro ao verificar plano ativo:', error);
    return false;
  }
}

/**
 * Calcula a data de expiração do trial (7 dias após criação)
 */
export function calculateTrialEndDate(createdAt: Timestamp): Date {
  const trialDays = 7;
  const createdDate = createdAt.toDate();
  const trialEndDate = new Date(createdDate);
  trialEndDate.setDate(trialEndDate.getDate() + trialDays);
  
  return trialEndDate;
}

/**
 * Calcula quantos dias faltam para o trial expirar
 */
export function calculateDaysLeftInTrial(trialEndsAt: Date): number {
  const now = new Date();
  const diffTime = trialEndsAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
}

//eslint-disable-next-line
export function checkSubscriptionStatus(userData: any): SubscriptionInfo {
  const now = new Date();
  
  // Calcula data de fim do trial
  const trialEndsAt = userData.createdAt 
    ? calculateTrialEndDate(userData.createdAt)
    : null;
  
  const daysLeftInTrial = trialEndsAt 
    ? calculateDaysLeftInTrial(trialEndsAt)
    : 0;
  
  // Verifica se trial está ativo
  const isTrialActive = trialEndsAt ? now < trialEndsAt : false;
  
  // Verifica se tem assinatura ativa
  const isSubscriptionActive = userData.subscriptionStatus === 'active' &&
    userData.subscriptionEndsAt &&
    now < userData.subscriptionEndsAt.toDate();
  
  // Define status geral
  let status: SubscriptionStatus = 'trial';
  let canGeneratePlan = false;
  let blockReason: string | undefined;
  
  if (isSubscriptionActive) {
    status = 'active';
    canGeneratePlan = true;
  } else if (isTrialActive) {
    status = 'trial';
    canGeneratePlan = true;
  } else if (userData.subscriptionStatus === 'canceled') {
    status = 'canceled';
    blockReason = 'Sua assinatura foi cancelada. Renove para continuar gerando planos.';
  } else {
    status = 'expired';
    blockReason = 'Seu período de teste expirou. Assine agora por R$ 25,00/mês para continuar!';
  }
  
  return {
    status,
    isTrialActive,
    isSubscriptionActive,
    trialEndsAt,
    daysLeftInTrial,
    canGeneratePlan,
    blockReason
  };
}

/**
 * Atualiza o documento do usuário após gerar um plano
 */
export async function updateUserAfterPlanGeneration(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      hasActivePlan: true,
      lastPlanGeneratedAt: Timestamp.now(),
      planGenerationsCount: (await getDocs(collection(db, 'users', userId, 'plano'))).size,
      updatedAt: Timestamp.now()
    });
    
    console.log('✅ Usuário atualizado após geração de plano');
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    throw error;
  }
}

/**
 * Inicializa campos de assinatura para usuários existentes
 * (Útil para migração de dados)
 */
export async function initializeSubscriptionFields(userId: string, createdAt: Timestamp): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const trialEndsAt = calculateTrialEndDate(createdAt);
    
    await updateDoc(userRef, {
      subscriptionStatus: 'trial',
      trialStartedAt: createdAt,
      trialEndsAt: Timestamp.fromDate(trialEndsAt),
      subscriptionStartedAt: null,
      subscriptionEndsAt: null,
      stripeCustomerId: null,
      hasActivePlan: false,
      planGenerationsCount: 0,
      updatedAt: Timestamp.now()
    });
    
    console.log('✅ Campos de assinatura inicializados');
  } catch (error) {
    console.error('❌ Erro ao inicializar campos:', error);
    throw error;
  }
}