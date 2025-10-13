import { useState, useEffect, useCallback } from 'react';

// ================================================
// 🎯 TIPOS ALINHADOS COM SUA ESTRUTURA REAL
// ================================================

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  earned_at: Date;
  special_effect: boolean;
}

interface Achievement {
  id: string;
  category: string;
  completed: boolean;
  completed_at: Date | null;
  total_goal: number;
  current_progress: number;
  createdAt: Date;
}

interface PointsHistory {
  action: string;
  points: number;
  timestamp: Date;
}

interface Rankings {
  global_position: number;
  month_points: number;
  regional_position: number;
  position_friends: number;
  week_points: number;
}

interface Streaks {
  active_multiplier: number;
  better: number;
  current: number;
  last_training: Date | null;
  sequenceDays: Date[];
  vacation: boolean;
}

interface StatisticsChallenges {
  abandoned: number;
  completed: number;
}

//eslint-disable-next-line
interface GamificationData {
  userId: string;
  badges: Badge[];
  achievements: Achievement[];
  pointsHistory: PointsHistory[];
  rankings: Rankings;
  streaks: Streaks;
  challengesParticipating: string[];
  activeChallenges: string[];
  unlockedProtocols: string[];
  statisticsChallenges: StatisticsChallenges;
  createdAt: Date;
  updatedAt: Date;
}

// Desafio ativo (FASE2)
interface DesafioAtivo {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
  tipo: string;
  objetivo: {
    meta: number;
    unidade: string;
    descricao: string;
  };
  dataInicio: Date;
  dataFim: Date;
  totalParticipantes: number;
  userParticipando: boolean;
}

// Progresso do usuário no desafio
interface ProgressoDesafio {
  desafioId: string;
  userId: string;
  progresso: number;
  metaAtingida: boolean;
  pontuacaoAtual: number;
  streakAtual: number;
  ultimaAtualizacao: Date;
}

// Ranking do desafio
interface RankingDesafio {
  userId: string;
  userName: string;
  userAvatar: string;
  progresso: number;
  pontuacao: number;
  posicao: number;
  metaAtingida: boolean;
}

// Dashboard unificado
interface DashboardUnificado {
  // FASE 1 - Gamificação Pessoal
  pontosTotais: number;
  nivel: string;
  streakAtual: number;
  melhorStreak: number;
  totalConquistas: number;
  totalBadges: number;
  proximoNivel: string | null;
  pontosParaProximoNivel: number;
  
  // FASE 2 - Desafios
  desafioAtivo: DesafioAtivo | null;
  progressoDesafio: ProgressoDesafio | null;
  posicaoRanking: number;
  
  // INTEGRADO
  pontosEstaSemana: number;
  conquistasRecentes: Achievement[];
  badgesRecentes: Badge[];
}

// Response das ações
interface ActionResponse {
  success: boolean;
  pontos?: number;
  conquistasNovas?: Achievement[];
  badgesNovas?: Badge[];
  nivelMudou?: boolean;
  desafioAtualizado?: boolean;
  progressoDesafio?: number;
}

// ================================================
// 🎮 HOOK PRINCIPAL - INTEGRAÇÃO TOTAL
// ================================================

export function useGamification(userId?: string) {
  const [dashboard, setDashboard] = useState<DashboardUnificado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ================================================
  // 📊 CARREGAR DASHBOARD UNIFICADO
  // ================================================
  
  const carregarDashboard = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar dados da FASE1 (gamificação pessoal)
      const statsResponse = await fetch(`/api/gamification/stats/${userId}`);
      if (!statsResponse.ok) throw new Error('Erro ao carregar estatísticas');
      const statsData = await statsResponse.json();

      // Buscar dados da FASE2 (desafios)
      const desafiosResponse = await fetch('/api/gamification/desafios');
      if (!desafiosResponse.ok) throw new Error('Erro ao carregar desafios');
      const desafiosData = await desafiosResponse.json();

      // Buscar progresso no desafio ativo (se houver)
      let progressoDesafio = null;
      let posicaoRanking = 0;
      
      if (desafiosData.success && desafiosData.data?.length > 0) {
        const desafioAtivo = desafiosData.data[0];
        
        try {
          const progressoResponse = await fetch(`/api/gamification/desafios/${desafioAtivo.id}/progresso`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          });
          
          if (progressoResponse.ok) {
            const progressoData = await progressoResponse.json();
            progressoDesafio = progressoData.data;
            
            // Buscar ranking
            const rankingResponse = await fetch('/api/gamification/ranking', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ desafioId: desafioAtivo.id })
            });
            
            if (rankingResponse.ok) {
              const rankingData = await rankingResponse.json();
              const userRanking = rankingData.data?.find((r: RankingDesafio) => r.userId === userId);
              posicaoRanking = userRanking?.posicao || 0;
            }
          }
        //eslint-disable-next-line
        } catch (error) {
          console.log('Usuário não está participando do desafio ativo');
        }
      }

      // Montar dashboard unificado
      const dashboardUnificado: DashboardUnificado = {
        // FASE 1
        pontosTotais: statsData.data?.pontosTotais || 0,
        nivel: statsData.data?.nivel || 'Iniciante',
        streakAtual: statsData.data?.streakAtual || 0,
        melhorStreak: statsData.data?.melhorStreak || 0,
        totalConquistas: statsData.data?.totalConquistas || 0,
        totalBadges: statsData.data?.totalBadges || 0,
        proximoNivel: statsData.data?.proximoNivel || null,
        pontosParaProximoNivel: statsData.data?.pontosParaProximoNivel || 0,
        
        // FASE 2
        desafioAtivo: desafiosData.success ? desafiosData.data?.[0] || null : null,
        progressoDesafio,
        posicaoRanking,
        
        // INTEGRADO
        pontosEstaSemana: statsData.data?.pontosEstaSemana || 0,
        conquistasRecentes: statsData.data?.conquistasRecentes || [],
        badgesRecentes: statsData.data?.badgesRecentes || []
      };

      setDashboard(dashboardUnificado);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ================================================
  // 🎯 AÇÕES INTEGRADAS - FASE1 + FASE2
  // ================================================

  const registrarAcao = useCallback(async (
    acao: string,
    detalhes?: Record<string, unknown>
  ): Promise<ActionResponse> => {
    if (!userId) {
      return { success: false };
    }

    try {
      // 1. Registrar ação na FASE1 (engine)
      const engineResponse = await fetch('/api/gamification/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, acao, detalhes })
      });

      if (!engineResponse.ok) {
        throw new Error('Erro ao registrar ação no engine');
      }

      const engineResult = await engineResponse.json();
      let desafioAtualizado = false;
      let progressoDesafio = 0;

      // 2. Se há desafio ativo, atualizar progresso na FASE2
      if (dashboard?.desafioAtivo && dashboard.progressoDesafio) {
        try {
          const desafioResponse = await fetch(`/api/gamification/desafios/${dashboard.desafioAtivo.id}/progresso`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId, 
              acao, 
              valor: detalhes?.valor || 1,
              descricao: detalhes?.descricao || acao
            })
          });

          if (desafioResponse.ok) {
            const desafioResult = await desafioResponse.json();
            desafioAtualizado = true;
            progressoDesafio = desafioResult.data?.novoProgresso || 0;
          }
        //eslint-disable-next-line
        } catch (error) {
          console.log('Erro ao atualizar desafio, mas ação do engine foi registrada');
        }
      }

      // 3. Recarregar dashboard
      await carregarDashboard();

      return {
        success: true,
        pontos: engineResult.pontos,
        conquistasNovas: engineResult.conquistasNovas,
        badgesNovas: engineResult.badgesNovas,
        nivelMudou: engineResult.nivelMudou,
        desafioAtualizado,
        progressoDesafio
      };

    } catch (error) {
      console.error('Erro ao registrar ação:', error);
      return { success: false };
    }
  }, [userId, dashboard, carregarDashboard]);

  // ================================================
  // 🏃‍♂️ PROCESSAR TREINO COMPLETO
  // ================================================

  const processarTreino = useCallback(async (isFimDeSemana = false): Promise<ActionResponse> => {
    return await registrarAcao('TREINO_COMPLETO', { 
      fimDeSemana: isFimDeSemana,
      valor: 1,
      descricao: isFimDeSemana ? 'Treino fim de semana' : 'Treino completo'
    });
  }, [registrarAcao]);

  // ================================================
  // 🎯 GERENCIAR DESAFIOS
  // ================================================

  const participarDesafio = useCallback(async (desafioId: string): Promise<ActionResponse> => {
    if (!userId) return { success: false };

    try {
      const response = await fetch(`/api/gamification/desafios/${desafioId}/participar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) throw new Error('Erro ao participar do desafio');

      const result = await response.json();
      await carregarDashboard(); // Recarregar para mostrar novo desafio

      return {
        success: result.success,
        pontos: 0 // Participar não dá pontos imediatos
      };
    } catch (error) {
      console.error('Erro ao participar do desafio:', error);
      return { success: false };
    }
  }, [userId, carregarDashboard]);

  const buscarRankingDesafio = useCallback(async (desafioId?: string): Promise<RankingDesafio[]> => {
    try {
      const id = desafioId || dashboard?.desafioAtivo?.id;
      if (!id) return [];

      const response = await fetch('/api/gamification/ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ desafioId: id })
      });

      if (!response.ok) throw new Error('Erro ao buscar ranking');

      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Erro ao buscar ranking:', error);
      return [];
    }
  }, [dashboard]);

  // ================================================
  // 🔄 INICIALIZAÇÃO
  // ================================================

  useEffect(() => {
    carregarDashboard();
  }, [carregarDashboard]);
  return {
    // DADOS
    dashboard,
    loading,
    error,
    
    // AÇÕES PRINCIPAIS
    registrarAcao,
    processarTreino,
    
    // DESAFIOS
    participarDesafio,
    buscarRankingDesafio,
    
    // UTILIDADES
    recarregarDashboard: carregarDashboard,
    
    // DADOS ESPECÍFICOS (para compatibilidade)
    stats: dashboard ? {
      pontosTotais: dashboard.pontosTotais,
      nivel: dashboard.nivel,
      streakAtual: dashboard.streakAtual,
      melhorStreak: dashboard.melhorStreak,
      totalConquistas: dashboard.totalConquistas,
      totalBadges: dashboard.totalBadges,
      proximoNivel: dashboard.proximoNivel,
      pontosParaProximoNivel: dashboard.pontosParaProximoNivel
    } : null,
    
    desafioAtivo: dashboard?.desafioAtivo,
    progressoDesafio: dashboard?.progressoDesafio,
    posicaoRanking: dashboard?.posicaoRanking || 0
  };
}// Hook focado apenas na FASE1 (gamificação pessoal)
export function useGamificationEngine(userId?: string) {
  const { stats, registrarAcao, processarTreino, loading, error } = useGamification(userId);
  
  return {
    stats,
    registrarAcao,
    processarTreino,
    loading,
    error
  };
}

// Hook focado apenas na FASE2 (desafios)
export function useDesafios(userId?: string) {
  const { 
    desafioAtivo, 
    progressoDesafio, 
    posicaoRanking,
    participarDesafio, 
    buscarRankingDesafio,
    loading,
    error
  } = useGamification(userId);
  
  return {
    desafioAtivo,
    progressoDesafio,
    posicaoRanking,
    participarDesafio,
    buscarRankingDesafio,
    loading,
    error
  };
}

// Hook para dashboard simplificado
export function useDashboardGamification(userId?: string) {
  const { dashboard, loading, error, recarregarDashboard } = useGamification(userId);
  
  return {
    dashboard,
    loading,
    error,
    refresh: recarregarDashboard
  };
}