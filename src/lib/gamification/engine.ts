import { getAdminDb } from '@/lib/firebase/admin';

let db: ReturnType<typeof getAdminDb> | null = null;

function getDb() {
  if (!db) {
    db = getAdminDb();
  }
  return db;
}

export interface UserGamification {
  userId: string;
  pontos: number;
  nivel: 'Iniciante' | 'Intermediário' | 'Avançado' | 'Elite' | 'Lenda' | 'Master';
  streakAtual: number;
  melhorStreak: number;
  ultimoTreino: Date | null;
  conquistas: Conquista[];
  badges: Badge[];
  historicoPontos: HistoricoPonto[];
  protocolosDesbloqueados: string[];
  desafiosParticipando: string[];
  rankingSemanal: number;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface Conquista {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  pontosBbonus: number;
  desbloqueadaEm: Date;
  categoria: 'consistencia' | 'volume' | 'social' | 'especial';
}

export interface Badge {
  id: string;
  nome: string;
  raridade: 'comum' | 'raro' | 'epico' | 'lendario';
  icone: string;
  animacao?: string;
  conquistadaEm: Date;
}

export interface HistoricoPonto {
  acao: string;
  pontos: number;
  multiplicador: number;
  timestamp: Date;
  detalhes?: Record<string, number | boolean>;
}

interface GamificationResult {
  pontos: number;
  conquistasNovas: Conquista[];
  nivelMudou: boolean;
}

interface StreakMultiplier {
  [days: number]: number;
}

// ==================== SISTEMA DE PONTUAÇÃO ====================

export class GamificationEngine {
  
  // Tabela de pontuações base
  private readonly PONTOS_ACOES = {
    TREINO_COMPLETO: 100,
    REFEICAO_REGISTRADA: 25,
    CHECK_IN_DIARIO: 10,
    FOTO_PROGRESSO: 50,
    COMPARTILHAR_CONQUISTA: 30,
    ATIVAR_NOTIFICACOES: 20,
    CONVIDAR_AMIGO: 200,
    PRIMEIRA_SEMANA: 500,
    FIM_DE_SEMANA_OPCIONAL: 50
  };

  // Multiplicadores por streak (apenas dias úteis)
  private readonly MULTIPLICADORES_STREAK: StreakMultiplier = {
    5: 1.5,
    10: 2.0,
    20: 2.5,
    40: 3.0,
    60: 3.5
  };

  // Níveis e requisitos de pontos
  private readonly NIVEIS = {
    'Iniciante': { min: 0, max: 999 },
    'Intermediário': { min: 1000, max: 4999 },
    'Avançado': { min: 5000, max: 14999 },
    'Elite': { min: 15000, max: 49999 },
    'Lenda': { min: 50000, max: 99999 },
    'Master': { min: 100000, max: Infinity }
  };

  // ==================== MÉTODOS PRINCIPAIS ====================

  /**
   * Adiciona pontos para uma ação específica
   */
  async adicionarPontos(
    userId: string, 
    acao: keyof typeof this.PONTOS_ACOES, 
    detalhes?: Record<string, number | boolean>
  ): Promise<GamificationResult> {
    
    const database = getDb();
    const userGamificationRef = database.collection('users').doc(userId).collection('gamification').doc('data');
    const userGamification = await this.obterDadosGamificacao(userId);
    
    // Calcular pontos base
    const pontosBase = this.PONTOS_ACOES[acao];
    
    // Aplicar multiplicador de streak (apenas para treinos)
    let multiplicador = 1;
    if (acao === 'TREINO_COMPLETO') {
      multiplicador = this.calcularMultiplicadorStreak(userGamification.streakAtual);
    }
    
    const pontosFinal = Math.round(pontosBase * multiplicador);
    
    // Atualizar pontos totais
    const novosPontos = userGamification.pontos + pontosFinal;
    
    // Verificar mudança de nível
    const nivelAnterior = userGamification.nivel;
    const novoNivel = this.calcularNivel(novosPontos);
    const nivelMudou = nivelAnterior !== novoNivel;
    
    // Verificar novas conquistas
    const conquistasNovas = await this.verificarConquistas(userId, userGamification, acao, detalhes);
    
    // Criar registro histórico
    const registroHistorico: HistoricoPonto = {
      acao,
      pontos: pontosFinal,
      multiplicador,
      timestamp: new Date(),
      detalhes
    };
    
    // Atualizar no Firestore
    await userGamificationRef.update({
      pontos: novosPontos,
      nivel: novoNivel,
      conquistas: [...userGamification.conquistas, ...conquistasNovas],
      historicoPontos: [...userGamification.historicoPontos, registroHistorico],
      atualizadoEm: new Date()
    });
    
    // Se mudou de nível, dar pontos bônus
    if (nivelMudou) {
      await this.processarMudancaNivel(userId, novoNivel);
    }
    
    return {
      pontos: pontosFinal,
      conquistasNovas,
      nivelMudou
    };
  }

  /**
   * Processa um treino completo (atualiza streak + pontos)
   */
  async processarTreinoCompleto(userId: string, isFimDeSemana: boolean = false): Promise<GamificationResult> {
    const userGamification = await this.obterDadosGamificacao(userId);
    
    const hoje = new Date();
    const ontem = userGamification.ultimoTreino;
    
    let novoStreak = userGamification.streakAtual;
    
    if (!isFimDeSemana) {
      if (this.isSequenciaValida(ontem, hoje)) {
        novoStreak = userGamification.streakAtual + 1;
      } else {
        novoStreak = 1;
      }
    }
    
    const database = getDb();
    const userGamificationRef = database.collection('users').doc(userId).collection('gamification').doc('data');
    await userGamificationRef.update({
      streakAtual: novoStreak,
      melhorStreak: Math.max(userGamification.melhorStreak, novoStreak),
      ultimoTreino: hoje
    });
    
    const acao = isFimDeSemana ? 'FIM_DE_SEMANA_OPCIONAL' : 'TREINO_COMPLETO';
    return await this.adicionarPontos(userId, acao, { 
      isFimDeSemana, 
      streakAtual: novoStreak 
    });
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Obtém dados de gamificação do usuário
   */
  private async obterDadosGamificacao(userId: string): Promise<UserGamification> {
    const database = getDb();
    const userGamificationRef = database.collection('users').doc(userId).collection('gamification').doc('data');
    const doc = await userGamificationRef.get();
    
    if (!doc.exists) {
      const dadosIniciais: UserGamification = {
        userId,
        pontos: 0,
        nivel: 'Iniciante',
        streakAtual: 0,
        melhorStreak: 0,
        ultimoTreino: null,
        conquistas: [],
        badges: [],
        historicoPontos: [],
        protocolosDesbloqueados: [],
        desafiosParticipando: [],
        rankingSemanal: 0,
        criadoEm: new Date(),
        atualizadoEm: new Date()
      };
      
      await userGamificationRef.set(dadosIniciais);
      return dadosIniciais;
    }
    
    return doc.data() as UserGamification;
  }

  /**
   * Calcula multiplicador baseado no streak atual
   */
  private calcularMultiplicadorStreak(streakAtual: number): number {
    const streaksOrdenados = Object.keys(this.MULTIPLICADORES_STREAK)
      .map(Number)
      .sort((a, b) => b - a);
    
    for (const streakMinimo of streaksOrdenados) {
      if (streakAtual >= streakMinimo) {
        return this.MULTIPLICADORES_STREAK[streakMinimo];
      }
    }
    
    return 1;
  }

  /**
   * Calcula nível baseado nos pontos
   */
  private calcularNivel(pontos: number): UserGamification['nivel'] {
    for (const [nivel, range] of Object.entries(this.NIVEIS)) {
      if (pontos >= range.min && pontos <= range.max) {
        return nivel as UserGamification['nivel'];
      }
    }
    return 'Master';
  }

  /**
   * Verifica se dois dias são sequenciais (apenas dias úteis)
   */
  private isSequenciaValida(dataAnterior: Date | null, dataAtual: Date): boolean {
    if (!dataAnterior) return true;
    
    const diffMs = dataAtual.getTime() - dataAnterior.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDias === 1) return true;
    
    const diaAnterior = dataAnterior.getDay();
    const diaAtual = dataAtual.getDay();
    
    if (diaAnterior === 5 && diaAtual === 1 && diffDias === 3) return true;
    if (diaAnterior === 4 && diaAtual === 1 && diffDias === 4) return true;
    
    return false;
  }

  /**
   * Verifica conquistas baseadas na ação
   */
  private async verificarConquistas(
    userId: string, 
    userGamification: UserGamification, 
    acao: string, 
    detalhes?: Record<string, number | boolean>
  ): Promise<Conquista[]> {
    
    const conquistasNovas: Conquista[] = [];
    const conquistasExistentes = userGamification.conquistas.map(c => c.id);
    
    if (acao === 'TREINO_COMPLETO') {
      const streak = typeof detalhes?.streakAtual === 'number' ? detalhes.streakAtual : 0;
      
      const conquistasStreak = [
        { id: 'primeira_chama', nome: 'Primeira Chama', streak: 1, pontos: 50 },
        { id: 'uma_semana_firme', nome: 'Uma Semana Firme', streak: 5, pontos: 100 },
        { id: 'mes_de_ferro', nome: 'Mês de Ferro', streak: 20, pontos: 300 },
        { id: 'trimestre_imparavel', nome: 'Trimestre Imparável', streak: 60, pontos: 500 },
        { id: 'ano_lendario', nome: 'Ano Lendário', streak: 240, pontos: 1000 }
      ];
      
      for (const conquista of conquistasStreak) {
        if (streak >= conquista.streak && !conquistasExistentes.includes(conquista.id)) {
          conquistasNovas.push({
            id: conquista.id,
            nome: conquista.nome,
            descricao: `Complete ${conquista.streak} dias úteis consecutivos`,
            icone: '🔥',
            pontosBbonus: conquista.pontos,
            desbloqueadaEm: new Date(),
            categoria: 'consistencia'
          });
        }
      }
    }

    const totalTreinos = userGamification.historicoPontos.filter(h => h.acao === 'TREINO_COMPLETO').length;
    
    const conquistasVolume = [
      { id: 'primeira_duzia', nome: 'Primeira Dúzia', total: 12, pontos: 200 },
      { id: 'meio_seculo', nome: 'Meio Século', total: 50, pontos: 500 },
      { id: 'centenario', nome: 'Centenário', total: 100, pontos: 1000 },
      { id: 'conquistador', nome: 'Conquistador', total: 500, pontos: 2500 }
    ];
    
    for (const conquista of conquistasVolume) {
      if (totalTreinos >= conquista.total && !conquistasExistentes.includes(conquista.id)) {
        conquistasNovas.push({
          id: conquista.id,
          nome: conquista.nome,
          descricao: `Complete ${conquista.total} treinos`,
          icone: '💪',
          pontosBbonus: conquista.pontos,
          desbloqueadaEm: new Date(),
          categoria: 'volume'
        });
      }
    }

    return conquistasNovas;
  }

  /**
   * Processa mudança de nível
   */
  private async processarMudancaNivel(userId: string, novoNivel: string): Promise<void> {
    type Nivel = keyof typeof this.NIVEIS;
    
    const bonusNivel: Record<Nivel, number> = {
      'Iniciante': 0,
      'Intermediário': 200,
      'Avançado': 500,
      'Elite': 1000,
      'Lenda': 2500,
      'Master': 5000
    };
    
    const nivelValido = Object.keys(this.NIVEIS).includes(novoNivel);
    if (!nivelValido) {
      throw new Error(`Nível inválido: ${novoNivel}`);
    }
    
    const database = getDb();
    const userGamificationRef = database.collection('users').doc(userId).collection('gamification').doc('data');
    const userGamification = await userGamificationRef.get();
    const data = userGamification.data() || {};
    const ultimaBonusNivel = data.ultimaBonusNivel || null;
    
    const podeReceberBonus = !ultimaBonusNivel || 
      new Date(ultimaBonusNivel).getTime() + 24 * 60 * 60 * 1000 < Date.now();
    
    const nivelTemBonus = bonusNivel[novoNivel as Nivel];
    const bonusDisponivel = nivelTemBonus > 0;
    
    if (bonusDisponivel && podeReceberBonus) {
      await database.runTransaction(async (transaction) => {
        const doc = await transaction.get(userGamificationRef);
        const pontosAtuais = doc.data()?.pontos || 0;
        
        transaction.update(userGamificationRef, {
          pontos: pontosAtuais + nivelTemBonus,
          ultimaBonusNivel: new Date().toISOString()
        });
      });
    }

    await this.verificarDesbloqueioProtocolos(userId, novoNivel);
  }

  /**
   * Verifica desbloqueio de protocolos por nível
   */
  private async verificarDesbloqueioProtocolos(userId: string, nivel: string): Promise<void> {
    const protocolosPorNivel: Record<string, string[]> = {
      'Iniciante': [],
      'Intermediário': ['hipertrofia_basica'],
      'Avançado': ['cutting_master', 'hipertrofia_avancada'],
      'Elite': ['beast_mode', 'definicao_extrema'],
      'Lenda': ['protocolo_lenda', 'transformacao_total'],
      'Master': ['master_protocol', 'genetic_override']
    };

    const protocolos = protocolosPorNivel[nivel] ?? [];
    
    if (protocolos.length > 0) {
      const database = getDb();
      const userGamificationRef = database.collection('users').doc(userId).collection('gamification').doc('data');
      
      const doc = await userGamificationRef.get();
      const data = doc.data() || {};
      const protocolosAtuais = data.protocolosDesbloqueados || [];
      
      type Protocolo = string;
      const novosProtocolos = protocolos.filter((proto: Protocolo) => !protocolosAtuais.includes(proto));
      
      if (novosProtocolos.length > 0) {
        await database.runTransaction(async (transaction) => {
          const doc = await transaction.get(userGamificationRef);
          const protocolosAtuais = doc.data()?.protocolosDesbloqueados || [];
          
          transaction.update(userGamificationRef, {
            protocolosDesbloqueados: [...protocolosAtuais, ...novosProtocolos]
          });
        });
      }
    }
  }

  async obterRankingSemanal(limite: number = 100): Promise<Array<{userId: string, pontos: number, posicao: number}>> {
    const database = getDb();
    const agora = new Date();
    const inicioSemana = new Date(agora.setDate(agora.getDate() - agora.getDay()));
    
    const snapshot = await database.collectionGroup('gamification')
      .where('atualizadoEm', '>=', inicioSemana)
      .orderBy('pontos', 'desc')
      .limit(limite)
      .get();
    
    return snapshot.docs.map((doc, index) => ({
      userId: doc.data().userId,
      pontos: doc.data().pontos,
      posicao: index + 1
    }));
  }

  async obterEstatisticas(userId: string): Promise<{
    pontosTotais: number;
    nivel: string;
    streakAtual: number;
    melhorStreak: number;
    totalConquistas: number;
    totalBadges: number;
    protocolosDesbloqueados: number;
    proximoNivel: string | null;
    pontosParaProximoNivel: number;
  }> {
    const userGamification = await this.obterDadosGamificacao(userId);
    
    return {
      pontosTotais: userGamification.pontos,
      nivel: userGamification.nivel,
      streakAtual: userGamification.streakAtual,
      melhorStreak: userGamification.melhorStreak,
      totalConquistas: userGamification.conquistas.length,
      totalBadges: userGamification.badges.length,
      protocolosDesbloqueados: userGamification.protocolosDesbloqueados.length,
      proximoNivel: this.calcularProximoNivel(userGamification.pontos),
      pontosParaProximoNivel: this.calcularPontosParaProximoNivel(userGamification.pontos)
    };
  }

  private calcularProximoNivel(pontosAtuais: number): string | null {
    const niveisOrdenados = [
      { nome: 'Intermediário', min: 1000 },
      { nome: 'Avançado', min: 5000 },
      { nome: 'Elite', min: 15000 },
      { nome: 'Lenda', min: 50000 },
      { nome: 'Master', min: 100000 }
    ];

    for (const nivel of niveisOrdenados) {
      if (pontosAtuais < nivel.min) {
        return nivel.nome;
      }
    }
    
    return null;
  }

  private calcularPontosParaProximoNivel(pontosAtuais: number): number {
    const proximoNivel = this.calcularProximoNivel(pontosAtuais);
    if (!proximoNivel) return 0;
    
    type Nivel = keyof typeof this.NIVEIS;
    
    if (!Object.keys(this.NIVEIS).includes(proximoNivel)) {
      throw new Error(`Nível inválido: ${proximoNivel}`);
    }
    
    const niveisMap: Record<Nivel, number> = {
      'Iniciante': 0,  
      'Intermediário': 1000,
      'Avançado': 5000,
      'Elite': 15000,
      'Lenda': 50000,
      'Master': 100000
    };

    const pontosNecessarios = niveisMap[proximoNivel as Nivel];
    
    return pontosNecessarios - pontosAtuais;
  }
}