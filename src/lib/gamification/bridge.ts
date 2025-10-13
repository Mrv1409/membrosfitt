import { Timestamp } from 'firebase/firestore';
import type { 
  GamificationEngine,
  Achievement,
  UserProgress,
  GamificationEvent,
  ActionType,
  XPSource,
  
} from './types';


interface IntegrationManager {
  engine?: GamificationEngine;
  handleChallengeAction?(eventData: unknown): Promise<void>;
  handleEngineAction?(eventData: unknown): Promise<void>;
  processSyncQueue?(): Promise<void>;
  getIntegrationStatus(): Promise<IntegrationStatus>;
}

interface IntegrationStatus {
  isIntegrated: boolean;
  lastSync?: Date;
  engineStatus?: 'connected' | 'disconnected' | 'error';
  error?: string;
}

interface ChallengeEventData {
  challengeId: string;
  userId: string;
  action: 'start' | 'progress' | 'complete' | 'abandon';
  progress?: number;
  metadata?: Record<string, unknown>;
}

interface EngineEventData {
  type: string;
  userId: string;
  action: string;
  data: Record<string, unknown>;
}

export class GamificationBridge {
  private integrationManager: IntegrationManager;
  private eventListeners: Map<string, Array<(data?: unknown) => void>> = new Map();
  private isInitialized = false;
  private challengeEventHandler: (event: Event) => void;

  constructor(integrationManager: IntegrationManager) {
    this.integrationManager = integrationManager;
    
    
    this.challengeEventHandler = this.handleChallengeEvent.bind(this);
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('🎯 Inicializando Gamification Bridge...');
      
      await this.setupEventListeners();
      await this.validateIntegration();
      
      this.isInitialized = true;
      console.log('✅ Bridge inicializado com sucesso!');
      
      this.emit('initialized', { timestamp: new Date() });
      
    } catch (error) {
      console.error('❌ Erro ao inicializar Bridge:', error);
      this.emit('error', { type: 'initialization', error });
    }
  }

  private async setupEventListeners(): Promise<void> {
    console.log('🎯 Configurando listeners do Bridge...');
    
    try {
      
      window.addEventListener('challengeAction', this.challengeEventHandler);

      if (this.integrationManager.engine?.on) {
        this.integrationManager.engine.on('actionPerformed', (data: unknown) => {
          this.handleEngineEvent(data as EngineEventData).catch(error => {
            console.error('❌ Erro no handler do engine:', error);
          });
        });
      }

      console.log('✅ Event listeners configurados!');
      
    } catch (error) {
      console.error('❌ Erro ao configurar listeners:', error);
      throw error;
    }
  }

  private async validateIntegration(): Promise<void> {
    try {
      const status = await this.integrationManager.getIntegrationStatus();
      
      if (!status.isIntegrated) {
        console.warn('⚠️ IntegrationManager não está integrado');
      }
      
      if (!this.integrationManager.engine) {
        console.warn('⚠️ GamificationEngine não está disponível');
      }
      
    } catch (error) {
      console.error('❌ Erro ao validar integração:', error);
      
    }
  }

  private async handleChallengeEvent(event: Event): Promise<void> {
    const customEvent = event as CustomEvent<ChallengeEventData>;
    const eventData = customEvent.detail;
    
    if (!this.isValidChallengeEvent(eventData)) {
      console.warn('⚠️ Evento de desafio inválido:', eventData);
      return;
    }

    try {
      console.log('🎮 Bridge processando evento de desafio:', eventData);
      
      
      if (this.integrationManager.handleChallengeAction) {
        await this.integrationManager.handleChallengeAction(eventData);
      } else {
        
        await this.processDirectEngineAction(eventData);
      }
      
      
      this.emit('challengeProcessed', eventData);
      
    } catch (error) {
      console.error('❌ Erro ao processar evento de desafio:', error);
      this.emit('error', { type: 'challenge', error, eventData });
    }
  }
  
  private async handleEngineEvent(eventData: EngineEventData): Promise<void> {
    if (!this.isValidEngineEvent(eventData)) {
      console.warn('⚠️ Evento do engine inválido:', eventData);
      return;
    }

    try {
      console.log('🚀 Bridge processando evento do engine:', eventData);
      
    if (this.integrationManager.handleEngineAction) {

        await this.integrationManager.handleEngineAction(eventData);
      }
      
      this.emit('engineProcessed', eventData);
      
    } catch (error) {
      console.error('❌ Erro ao processar evento do engine:', error);
      this.emit('error', { type: 'engine', error, eventData });
    }
  }

  private async processDirectEngineAction(challengeData: ChallengeEventData): Promise<void> {
    if (!this.integrationManager.engine) {
      throw new Error('Engine não disponível para processamento direto');
    }

    const gamificationEvent: GamificationEvent = {
      action: `challenge_${challengeData.action}`,
      metadata: {
        challengeId: challengeData.challengeId,
        progress: challengeData.progress,
        ...challengeData.metadata
      },
      timestamp: new Date()
    };

    
    if (challengeData.action === 'complete') {
      gamificationEvent.points = this.calculateChallengePoints(challengeData);
    }

    await this.integrationManager.engine.performAction(gamificationEvent);
  }

  
  private calculateChallengePoints(challengeData: ChallengeEventData): number {
    
    const basePoints = 100;
    const progressBonus = (challengeData.progress || 0) * 10;
    return basePoints + progressBonus;
  }

  
  async executeAction(actionType: ActionType, actionData: Record<string, unknown>): Promise<unknown> {
    if (!this.isInitialized) {
      throw new Error('Bridge não foi inicializado');
    }

    console.log(`🎯 Executando ação: ${actionType}`, actionData);
    
    try {
      
      if (this.integrationManager.engine?.performAction) {
        const gamificationEvent: GamificationEvent = {
          action: actionType,
          ...actionData,
          timestamp: new Date()
        };
        
        const result = await this.integrationManager.engine.performAction(gamificationEvent);
        
        this.emit('actionExecuted', { actionType, actionData, result });
        return result;
      }
      
      throw new Error('Engine não disponível no IntegrationManager');
      
    } catch (error) {
      console.error(`❌ Erro ao executar ação ${actionType}:`, error);
      this.emit('error', { type: 'action', actionType, error });
      throw error;
    }
  }

  async addXP(points: number, source: XPSource, metadata?: Record<string, unknown>): Promise<void> {
    try {
      if (this.integrationManager.engine?.addPoints) {
        await this.integrationManager.engine.addPoints(points, { source, ...metadata });
        this.emit('xpAdded', { points, source, metadata });
      } else {
        
        await this.executeAction('add_xp', { points, source, metadata });
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar XP:', error);
      this.emit('error', { type: 'xp', error });
      throw error;
    }
  }

  
  async unlockAchievement(achievementId: string, metadata?: Record<string, unknown>): Promise<void> {
    try {
      if (this.integrationManager.engine?.unlockAchievement) {
        await this.integrationManager.engine.unlockAchievement(achievementId, metadata);
        this.emit('achievementUnlocked', { achievementId, metadata });
      } else {
        await this.executeAction('unlock_achievement', { achievementId, metadata });
      }
    } catch (error) {
      console.error('❌ Erro ao desbloquear conquista:', error);
      this.emit('error', { type: 'achievement', error });
      throw error;
    }
  }

  
  async getUserProgress(): Promise<UserProgress | null> {
    try {
      if (this.integrationManager.engine?.getUserProfile) {
        return await this.integrationManager.engine.getUserProfile();
      }
      
    
      const status = await this.integrationManager.getIntegrationStatus();
      
      
      return this.createBasicUserProgress(status);
      
    } catch (error) {
      console.error('❌ Erro ao obter progresso:', error);
      this.emit('error', { type: 'progress', error });
      return null;
    }
  }

//eslint-disable-next-line
  private createBasicUserProgress(status: IntegrationStatus): UserProgress {
    const now = new Date();
    const timestamp = Timestamp.fromDate(now);
    
    return {
      id: 'default',
      userId: 'current_user',
      dailyStats: {
        date: now.toISOString().split('T')[0],
        xpEarned: 0,
        tasksCompleted: 0,
        achievementsUnlocked: 0,
        badgesEarned: 0,
        socialInteractions: 0,
        timeSpent: 0,
        streaksUpdated: []
      },
      weeklyStats: {
        week: `${now.getFullYear()}-${Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`,
        xpEarned: 0,
        tasksCompleted: 0,
        achievementsUnlocked: 0,
        badgesEarned: 0,
        bestStreak: 0,
        averageDaily: 0
      },
      monthlyStats: {
        month: now.toISOString().substring(0, 7),
        xpEarned: 0,
        levelsGained: 0,
        challengesCompleted: 0,
        socialScore: 0,
        consistency: 0
      },
      milestones: [],
      lastCalculated: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
      totalPoints: 0,
      currentStreak: 0
    };
  }

  async checkAchievements(): Promise<Achievement[]> {
    try {
      if (this.integrationManager.engine?.getAchievements) {
        return await this.integrationManager.engine.getAchievements();
      }
      
      console.warn('⚠️ Método getAchievements não disponível no engine');
      return [];
      
    } catch (error) {
      console.error('❌ Erro ao verificar conquistas:', error);
      this.emit('error', { type: 'achievements', error });
      return [];
    }
  }

  
  async syncData(): Promise<void> {
    try {
      console.log('🔄 Iniciando sincronização via Bridge...');
      
      
      if (this.integrationManager.processSyncQueue) {
        await this.integrationManager.processSyncQueue();
      } else {
        console.warn('⚠️ Método processSyncQueue não disponível');
      }
      
      console.log('✅ Sincronização concluída!');
      this.emit('syncCompleted', { timestamp: new Date() });
      
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      this.emit('error', { type: 'sync', error });
      throw error;
    }
  }

  
  async getStatus(): Promise<IntegrationStatus> {
    try {
      const status = await this.integrationManager.getIntegrationStatus();
      return {
        ...status,
        lastCheck: new Date()
      } as IntegrationStatus & { lastCheck: Date };
      
    } catch (error) {
      console.error('❌ Erro ao obter status:', error);
      return { 
        isIntegrated: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        lastCheck: new Date()
      } as IntegrationStatus & { lastCheck: Date };
    }
  }

  
  private isValidChallengeEvent(eventData: unknown): eventData is ChallengeEventData {
    if (!eventData || typeof eventData !== 'object') return false;
    
    const data = eventData as Record<string, unknown>;
    return typeof data.challengeId === 'string' && 
           typeof data.userId === 'string' && 
           typeof data.action === 'string' &&
           ['start', 'progress', 'complete', 'abandon'].includes(data.action as string);
  }

  private isValidEngineEvent(eventData: unknown): eventData is EngineEventData {
    if (!eventData || typeof eventData !== 'object') return false;
    
    const data = eventData as Record<string, unknown>;
    return typeof data.type === 'string' && 
           typeof data.userId === 'string' && 
           typeof data.action === 'string' &&
           typeof data.data === 'object';
  }

  
  on(event: string, callback: (data?: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data?: unknown) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Erro no listener ${event}:`, error);
        }
      });
    }
  }

  
  get initialized(): boolean {
    return this.isInitialized;
  }

  
  destroy(): void {
    console.log('🧹 Destruindo Bridge...');
    
    
    this.eventListeners.clear();
    
    
    window.removeEventListener('challengeAction', this.challengeEventHandler);
    
    
    this.isInitialized = false;
    
    console.log('✅ Bridge destruído!');
  }
}


export function createGamificationBridge(integrationManager: IntegrationManager): GamificationBridge {
  console.log('🌉 Criando Gamification Bridge...');
  
  const bridge = new GamificationBridge(integrationManager);
  
  
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as unknown as { gamificationBridge: GamificationBridge }).gamificationBridge = bridge;
  }
  
  console.log('✅ Bridge criado e pronto!');
  return bridge;
}

export default GamificationBridge;