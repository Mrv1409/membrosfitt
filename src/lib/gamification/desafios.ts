import '@/lib/firebase/admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const db = getFirestore();

export interface Desafio {
  id: string;
  nome: string;
  descricao: string;
  mes: number; // 1-12
  semana: number; // 1-4
  icone: string;
  cor: string;
  tipo: 'cardio' | 'forca' | 'consistencia' | 'nutricao' | 'especial';
  objetivo: {
    meta: number;
    unidade: string; // 'minutos', 'repeticoes', 'dias', 'vezes'
    descricao: string;
  };
  recompensas: {
    pontosBase: number;
    badgeEspecial: string;
    multiplicadorBonus: number;
  };
  dataInicio: Date;
  dataFim: Date;
  ativo: boolean;
  participantes: Array<string>; // Simplificado - apenas IDs dos usuários
  ranking: Array<{
    userId: string;
    userName: string;
    userAvatar: string;
    progresso: number;
    pontuacao: number;
    posicao: number;
    metaAtingida: boolean;
  }>;
  totalParticipantes: number;
  created: Timestamp;
}

export interface RankingItem {
  userId: string;
  userName: string;
  userAvatar: string;
  progresso: number;
  pontuacao: number;
  posicao: number;
  metaAtingida: boolean;
}

export interface ProgressoDesafio {
  desafioId: string;
  userId: string;
  progresso: number; // 0-100%
  metaAtingida: boolean;
  pontuacaoAtual: number;
  ultimaAtualizacao: Timestamp;
  historico: Array<HistoricoItem>;
  streakAtual: number;
  melhorStreak: number;
}

export interface HistoricoItem {
  data: Timestamp;
  valor: number;
  acao: string;
  descricao: string;
}

export interface NotificacaoDesafio {
  id: string;
  userId: string;
  tipo: 'novo_desafio' | 'meta_atingida' | 'ranking_subiu' | 'desafio_finalizado';
  titulo: string;
  mensagem: string;
  lida: boolean;
  created: Timestamp;
}

// ==================== CALENDÁRIO EXPANDIDO 2025 ====================

export class DesafiosManager {
  private readonly DESAFIOS_ANUAIS = {
    1: { // JANEIRO - "New Year, New Me"
      1: {
        nome: "Cardio Blast Semanal",
        descricao: "Complete 30 minutos de cardio por dia durante 7 dias consecutivos",
        tipo: "cardio" as const,
        meta: 7,
        unidade: "dias",
        pontos: 300,
        icone: "🏃‍♂️",
        cor: "#FF6B6B"
      },
      2: {
        nome: "Hydration Master",
        descricao: "Beba pelo menos 3L de água por dia durante 7 dias",
        tipo: "nutricao" as const,
        meta: 7,
        unidade: "dias",
        pontos: 250,
        icone: "💧",
        cor: "#4ECDC4"
      },
      3: {
        nome: "Protein Power Week",
        descricao: "Atinja sua meta de proteína diária por 7 dias consecutivos",
        tipo: "nutricao" as const,
        meta: 7,
        unidade: "dias",
        pontos: 350,
        icone: "🥩",
        cor: "#45B7D1"
      },
      4: {
        nome: "Consistency Champion",
        descricao: "Treine todos os dias da semana sem faltar nenhum",
        tipo: "consistencia" as const,
        meta: 7,
        unidade: "treinos",
        pontos: 500,
        icone: "👑",
        cor: "#F9CA24"
      }
    },
    2: { // FEVEREIRO - "Amor Próprio"
      1: {
        nome: "Self-Care Sunday",
        descricao: "Complete 7 sessões de descanso ativo (yoga, caminhada, meditação)",
        tipo: "especial" as const,
        meta: 7,
        unidade: "sessoes",
        pontos: 280,
        icone: "🧘‍♀️",
        cor: "#FF9FF3"
      },
      2: {
        nome: "Heart Rate Zone",
        descricao: "Mantenha FC elevada por 20min em 5 treinos diferentes",
        tipo: "cardio" as const,
        meta: 5,
        unidade: "treinos",
        pontos: 400,
        icone: "❤️",
        cor: "#FF6B9D"
      },
      3: {
        nome: "Flexibility Master",
        descricao: "Faça 15 minutos de alongamento todos os dias por 7 dias",
        tipo: "especial" as const,
        meta: 7,
        unidade: "dias",
        pontos: 300,
        icone: "🤸‍♀️",
        cor: "#C44569"
      },
      4: {
        nome: "Progress Tracker",
        descricao: "Registre seu progresso com fotos 4 vezes na semana",
        tipo: "especial" as const,
        meta: 4,
        unidade: "registros",
        pontos: 250,
        icone: "📸",
        cor: "#F8B500"
      }
    },
    3: { // MARÇO - "Força e Determinação"
      1: {
        nome: "Strength Week",
        descricao: "Complete 5 treinos focados em força com pesos",
        tipo: "forca" as const,
        meta: 5,
        unidade: "treinos",
        pontos: 400,
        icone: "💪",
        cor: "#6C5CE7"
      },
      2: {
        nome: "Core Destroyer",
        descricao: "Faça 100 abdominais por dia durante 7 dias",
        tipo: "forca" as const,
        meta: 700,
        unidade: "repeticoes",
        pontos: 350,
        icone: "🔥",
        cor: "#FD79A8"
      },
      3: {
        nome: "Upper Body Blast",
        descricao: "5 treinos intensos focados em membros superiores",
        tipo: "forca" as const,
        meta: 5,
        unidade: "treinos",
        pontos: 400,
        icone: "💥",
        cor: "#00B894"
      },
      4: {
        nome: "Total Body Challenge",
        descricao: "Treino completo (força + cardio) 6 vezes na semana",
        tipo: "especial" as const,
        meta: 6,
        unidade: "treinos",
        pontos: 550,
        icone: "🚀",
        cor: "#E17055"
      }
    },
    4: { // ABRIL - "Primavera Fitness"
      1: {
        nome: "Spring Cardio",
        descricao: "200 minutos de cardio distribuídos em 7 dias",
        tipo: "cardio" as const,
        meta: 200,
        unidade: "minutos",
        pontos: 450,
        icone: "🌸",
        cor: "#FD79A8"
      },
      2: {
        nome: "Outdoor Adventure",
        descricao: "5 treinos ao ar livre (corrida, bike, caminhada)",
        tipo: "especial" as const,
        meta: 5,
        unidade: "treinos",
        pontos: 350,
        icone: "🌳",
        cor: "#00B894"
      },
      3: {
        nome: "Squat Challenge",
        descricao: "500 agachamentos distribuídos em 7 dias",
        tipo: "forca" as const,
        meta: 500,
        unidade: "repeticoes",
        pontos: 400,
        icone: "🍑",
        cor: "#6C5CE7"
      },
      4: {
        nome: "Mindful Movement",
        descricao: "Combine treino com mindfulness por 6 dias",
        tipo: "especial" as const,
        meta: 6,
        unidade: "sessoes",
        pontos: 380,
        icone: "🧠",
        cor: "#A29BFE"
      }
    }
  };

  // ==================== MÉTODOS PRINCIPAIS ====================

  /**
   * Obtém um desafio específico pelo ID
   */
  async obterDesafio(desafioId: string): Promise<Desafio | null> {
    try {
      const desafioRef = db.collection('desafios').doc(desafioId);
      const desafioDoc = await desafioRef.get();
      
      if (!desafioDoc.exists) {
        return null;
      }
      
      const data = desafioDoc.data();
      return {
        id: desafioDoc.id,
        ...data,
        dataInicio: data?.dataInicio?.toDate() || new Date(),
        dataFim: data?.dataFim?.toDate() || new Date(),
        created: data?.created || Timestamp.now()
      } as Desafio;
    } catch (error) {
      console.error('Erro ao obter desafio:', error);
      return null;
    }
  }

  /**
   * Obtém o desafio ativo atual
   */
  async obterDesafioAtivo(): Promise<Desafio | null> {
    try {
      const desafiosRef = db.collection('desafios');
      const query = desafiosRef.where('ativo', '==', true).limit(1);
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        dataInicio: data.dataInicio?.toDate() || new Date(),
        dataFim: data.dataFim?.toDate() || new Date(),
        created: data.created || Timestamp.now()
      } as Desafio;
    } catch (error) {
      console.error('Erro ao obter desafio ativo:', error);
      return null;
    }
  }

  /**
   * Cria desafio ativo para a semana atual
   */
  async criarDesafioSemanal(): Promise<Desafio> {
    const agora = new Date();
    const mes = agora.getMonth() + 1;
    const semanaDoMes = Math.ceil(agora.getDate() / 7);
    
    const desafiosDoMes = this.DESAFIOS_ANUAIS[mes as keyof typeof this.DESAFIOS_ANUAIS];
    if (!desafiosDoMes) {
      throw new Error(`Desafios não definidos para o mês ${mes}`);
    }
    
    const desafioTemplate = desafiosDoMes[semanaDoMes as keyof typeof desafiosDoMes];
    if (!desafioTemplate) {
      throw new Error(`Desafio não encontrado para mês ${mes}, semana ${semanaDoMes}`);
    }

    const desafioId = `desafio_${mes}_${semanaDoMes}_${agora.getFullYear()}`;
    
    // Calcular datas (desafio dura 7 dias)
    const dataInicio = new Date();
    dataInicio.setHours(0, 0, 0, 0);
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataInicio.getDate() + 7);
    dataFim.setHours(23, 59, 59, 999);

    const novoDesafio: Desafio = {
      id: desafioId,
      nome: desafioTemplate.nome,
      descricao: desafioTemplate.descricao,
      mes,
      semana: semanaDoMes,
      icone: desafioTemplate.icone,
      cor: desafioTemplate.cor,
      tipo: desafioTemplate.tipo,
      objetivo: {
        meta: desafioTemplate.meta,
        unidade: desafioTemplate.unidade,
        descricao: desafioTemplate.descricao
      },
      recompensas: {
        pontosBase: desafioTemplate.pontos,
        badgeEspecial: `${desafioTemplate.icone} ${desafioTemplate.nome}`,
        multiplicadorBonus: 1.5
      },
      dataInicio,
      dataFim,
      ativo: true,
      participantes: [],
      ranking: [],
      totalParticipantes: 0,
      created: Timestamp.fromDate(new Date())
    };

    // Salvar no Firestore
    const desafioRef = db.collection('desafios').doc(desafioId);
    await desafioRef.set({
      ...novoDesafio,
      dataInicio: Timestamp.fromDate(novoDesafio.dataInicio),
      dataFim: Timestamp.fromDate(novoDesafio.dataFim),
      created: novoDesafio.created
    });

    return novoDesafio;
  }

  /**
   * Inscreve usuário no desafio
   */
  //eslint-disable-next-line
  async inscreverUsuario(userId: string, userName: string, userAvatar: string = '', desafioId: string) {
    try {
      const desafioAtivo = await this.obterDesafio(desafioId);
      
      if (!desafioAtivo) {
        return { success: false, message: "Desafio não encontrado" };
      }

      // Verificar se já está inscrito
      if (desafioAtivo.participantes.includes(userId)) {
        return { success: false, message: "Usuário já inscrito neste desafio" };
      }
      
      // Atualizar lista de participantes
      const novosParticipantes = [...desafioAtivo.participantes, userId];
      
      const desafioRef = db.collection('desafios').doc(desafioAtivo.id);
      await desafioRef.update({
        participantes: novosParticipantes,
        totalParticipantes: novosParticipantes.length
      });

      // Criar progresso inicial
      const progressoRef = db.collection('desafios').doc(desafioId).collection('progressos').doc(userId);
      const progressoInicial: ProgressoDesafio = {
        desafioId: desafioId,
        userId: userId,
        progresso: 0,
        metaAtingida: false,
        pontuacaoAtual: 0,
        ultimaAtualizacao: Timestamp.fromDate(new Date()),
        historico: [],
        streakAtual: 0,
        melhorStreak: 0
      };
      
      await progressoRef.set({
        ...progressoInicial,
        ultimaAtualizacao: progressoInicial.ultimaAtualizacao
      });

      return { 
        success: true, 
        message: "Inscrito com sucesso no desafio!",
        desafio: desafioAtivo
      };

    } catch (error) {
      console.error('Erro ao inscrever usuário:', error);
      return { success: false, message: "Erro ao se inscrever no desafio" };
    }
  }

  /**
   * Atualiza progresso do usuário
   */
  async atualizarProgresso(
    userId: string, 
    acao: string, 
    valor: number = 1, 
    descricaoAcao: string = '', 
    desafioId: string 
  ): Promise<{
    metaAtingida: boolean;
    pontos: number;
    conquistouMeta: boolean;
    posicaoRanking: number;
    novoProgresso: number;
    streakAtual: number;
  }> {
    try {
      const desafioAtivo = await this.obterDesafio(desafioId) as Desafio;
      if (!desafioAtivo) {
        return { 
          pontos: 0, 
          conquistouMeta: false, 
          posicaoRanking: 0, 
          novoProgresso: 0, 
          streakAtual: 0,
          metaAtingida: false
        };
      }

      const progressoRef = db.collection('desafios').doc(desafioAtivo.id).collection('progressos').doc(userId);
      const progressoDoc = await progressoRef.get();
      
      if (!progressoDoc.exists) {
        throw new Error("Usuário não inscrito no desafio");
      }

      const progresso = progressoDoc.data() as ProgressoDesafio;
      
      // Calcular novo progresso baseado no tipo de desafio
      let novoProgresso = progresso.progresso;
      let pontosGanhos = 0;
      let incrementoStreak = 0;
      
      switch (desafioAtivo.tipo) {
        case 'cardio':
          if (acao === 'TREINO_CARDIO' || acao === 'CARDIO_MINUTOS') {
            novoProgresso += (valor / desafioAtivo.objetivo.meta) * 100;
            pontosGanhos = Math.round(25 * valor);
            incrementoStreak = 1;
          }
          break;
          
        case 'forca':
          if (acao === 'TREINO_FORCA' || acao === 'REPETICOES' || acao === 'FORCA_EXERCICIO') {
            novoProgresso += (valor / desafioAtivo.objetivo.meta) * 100;
            pontosGanhos = Math.round(20 * valor);
            incrementoStreak = 1;
          }
          break;
          
        case 'consistencia':
          if (acao === 'TREINO_COMPLETO' || acao === 'DIA_TREINO') {
            novoProgresso += (1 / desafioAtivo.objetivo.meta) * 100;
            pontosGanhos = 50;
            incrementoStreak = 1;
          }
          break;
          
        case 'nutricao':
          if (acao === 'META_NUTRICAO' || acao === 'AGUA_META' || acao === 'PROTEINA_META') {
            novoProgresso += (1 / desafioAtivo.objetivo.meta) * 100;
            pontosGanhos = 30;
            incrementoStreak = 1;
          }
          break;
          
        case 'especial':
          if (acao === 'ACAO_ESPECIAL' || acao === 'SESSAO_ESPECIAL') {
            novoProgresso += (valor / desafioAtivo.objetivo.meta) * 100;
            pontosGanhos = Math.round(35 * valor);
            incrementoStreak = valor;
          }
          break;
      }

      // Limitar progresso a 100%
      novoProgresso = Math.min(novoProgresso, 100);
      
      // Verificar se atingiu meta
      const metaAtingida = novoProgresso >= 100;
      const conquistouMeta = !progresso.metaAtingida && metaAtingida;
      
      // Atualizar streak
      const novoStreak = progresso.streakAtual + incrementoStreak;
      const melhorStreak = Math.max(progresso.melhorStreak, novoStreak);
      
      // Bônus por completar o desafio
      if (conquistouMeta) {
        pontosGanhos += desafioAtivo.recompensas.pontosBase;
        
        // Criar notificação de meta atingida
        await this.criarNotificacao(userId, 'meta_atingida', {
          titulo: "🎉 Meta Atingida!",
          mensagem: `Parabéns! Você completou o desafio "${desafioAtivo.nome}"`
        });
      }
      
      // Criar item histórico
      const historicoItem: HistoricoItem = {
        data: Timestamp.now(),
        valor: valor,
        acao: acao,
        descricao: descricaoAcao || `${acao}: ${valor}`
      };
      
      // Atualizar progresso no Firebase (ADMIN SDK)
      const progressoAtualizado: Partial<ProgressoDesafio> = {
        progresso: novoProgresso,
        metaAtingida: metaAtingida,
        pontuacaoAtual: progresso.pontuacaoAtual + pontosGanhos,
        ultimaAtualizacao: Timestamp.now(),
        historico: [...progresso.historico, historicoItem],
        streakAtual: novoStreak,
        melhorStreak: melhorStreak
      };
      
      await progressoRef.update(progressoAtualizado);
      
      // Atualizar ranking
      const posicaoRanking = await this.atualizarRankingDesafio(desafioAtivo.id);
      
      return {
        pontos: pontosGanhos,
        conquistouMeta: conquistouMeta,
        posicaoRanking: posicaoRanking,
        novoProgresso: novoProgresso,
        streakAtual: novoStreak,
        metaAtingida: metaAtingida
      };

    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      return { 
        pontos: 0, 
        conquistouMeta: false, 
        posicaoRanking: 0, 
        novoProgresso: 0, 
        streakAtual: 0,
        metaAtingida: false
      };
    }
  }

  /**
   * Obtém progresso do usuário no desafio ativo
   */
  async obterProgressoUsuario(userId: string, desafioId?: string): Promise<ProgressoDesafio | null> {
    try {
      let desafioAtivo: Desafio | null;
      
      if (desafioId) {
        desafioAtivo = await this.obterDesafio(desafioId);
      } else {
        desafioAtivo = await this.obterDesafioAtivo();
      }
      
      if (!desafioAtivo) return null;

      const progressoRef = db.collection('desafios').doc(desafioAtivo.id).collection('progressos').doc(userId);
      const progressoDoc = await progressoRef.get();
      
      if (!progressoDoc.exists) return null;

      const data = progressoDoc.data();
      return {
        ...data,
        ultimaAtualizacao: data?.ultimaAtualizacao || Timestamp.now(),
        historico: data?.historico?.map((h: HistoricoItem) => ({
          ...h,
          data: h.data || Timestamp.now()
        })) || []
      } as ProgressoDesafio;
    } catch (error) {
      console.error('Erro ao obter progresso do usuário:', error);
      return null;
    }
  }

  /**
   * Obtém ranking do desafio com informações dos usuários
   */
  async obterRankingDesafio(desafioId: string, limite: number = 50): Promise<Array<{
    userId: string;
    userName: string;
    userAvatar: string;
    progresso: number;
    pontuacao: number;
    posicao: number;
    metaAtingida: boolean;
    streakAtual: number;
  }>> {
    try {
      const progressosRef = db.collection('desafios').doc(desafioId).collection('progressos');
      const snapshot = await progressosRef
        .orderBy('pontuacaoAtual', 'desc')
        .orderBy('progresso', 'desc')
        .limit(limite)
        .get();
      
      const ranking = [];
      for (let i = 0; i < snapshot.docs.length; i++) {
        const doc = snapshot.docs[i];
        const data = doc.data() as ProgressoDesafio;
        
        // Buscar dados do usuário
        const userRef = db.collection('users').doc(data.userId);
        const userDoc = await userRef.get();
        const userData = userDoc.exists ? userDoc.data() : {};
        
        ranking.push({
          userId: data.userId,
          userName: userData?.name || 'Usuário',
          userAvatar: userData?.avatar || '',
          progresso: data.progresso,
          pontuacao: data.pontuacaoAtual,
          posicao: i + 1,
          metaAtingida: data.metaAtingida,
          streakAtual: data.streakAtual || 0
        });
      }
      
      return ranking;
    } catch (error) {
      console.error('Erro ao obter ranking:', error);
      return [];
    }
  }

  /**
   * Atualiza ranking do desafio
   */
  private async atualizarRankingDesafio(desafioId: string): Promise<number> {
    try {
      const ranking = await this.obterRankingDesafio(desafioId);
      
      const desafioRef = db.collection('desafios').doc(desafioId);
      await desafioRef.update({
        ranking: ranking.slice(0, 10) // Top 10 no documento principal
      });
      
      return ranking.length;
    } catch (error) {
      console.error('Erro ao atualizar ranking:', error);
      return 0;
    }
  }

  /**
   * Cria uma notificação para o usuário
   */
  async criarNotificacao(
    userId: string, 
    tipo: NotificacaoDesafio['tipo'], 
    dados: {
      titulo: string;
      mensagem: string;
    }
  ): Promise<void> {
    try {
      const notificacaoId = `notif_${userId}_${Date.now()}`;
      const notificacaoRef = db.collection('users').doc(userId).collection('notificacoes').doc(notificacaoId);
      
      const notificacao: NotificacaoDesafio = {
        id: notificacaoId,
        userId,
        tipo,
        titulo: dados.titulo,
        mensagem: dados.mensagem,
        lida: false,
        created: Timestamp.fromDate(new Date())
      };
      
      await notificacaoRef.set({
        ...notificacao,
        created: notificacao.created
      });
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
    }
  }

  /**
   * Finaliza desafios expirados
   */
  async finalizarDesafiosExpirados(): Promise<void> {
    try {
      const desafiosRef = db.collection('desafios');
      const query = desafiosRef
        .where('ativo', '==', true)
        .where('dataFim', '<', Timestamp.now());
      
      const snapshot = await query.get();
      
      for (const doc of snapshot.docs) {
        const desafio = {
          ...doc.data(),
          id: doc.id,
          dataInicio: doc.data().dataInicio?.toDate() || new Date(),
          dataFim: doc.data().dataFim?.toDate() || new Date(),
          created: doc.data().created || Timestamp.now()
        } as Desafio;
        
        await this.distribuirRecompensasFinais(desafio);
        
        // Desativar desafio
        await doc.ref.update({ ativo: false });
      }
    } catch (error) {
      console.error('Erro ao finalizar desafios:', error);
    }
  }

  /**
   * Distribui recompensas finais
   */
  private async distribuirRecompensasFinais(desafio: Desafio): Promise<void> {
    try {
      const ranking = await this.obterRankingDesafio(desafio.id);
      
      const recompensasTop3 = [
        { posicao: 1, badge: '🥇 Campeão', pontosBonus: 500, raridade: 'lendario' },
        { posicao: 2, badge: '🥈 Vice-Campeão', pontosBonus: 300, raridade: 'epico' },
        { posicao: 3, badge: '🥉 Terceiro Lugar', pontosBonus: 200, raridade: 'raro' }
      ];

      for (const recompensa of recompensasTop3) {
        const usuario = ranking.find(r => r.posicao === recompensa.posicao);
        if (usuario) {
          // Criar notificação de finalização
          await this.criarNotificacao(usuario.userId, 'desafio_finalizado', {
            titulo: `🏆 ${recompensa.badge}`,
            mensagem: `Parabéns! Você ficou em ${recompensa.posicao}º lugar no desafio "${desafio.nome}"`
          });
        }
      }
    } catch (error) {
      console.error('Erro ao distribuir recompensas:', error);
    }
  }

  /**
   * Obtém estatísticas do usuário
   */
  async obterEstatisticasUsuario(userId: string): Promise<{
    desafiosParticipados: number;
    desafiosCompletos: number;
    pontosTotais: number;
    melhorPosicao: number;
    streakRecord: number;
  }> {
    try {
      // Buscar todos os desafios que o usuário participou
      const desafiosRef = db.collection('desafios');
      const query = desafiosRef.where('participantes', 'array-contains', userId);
      const snapshot = await query.get();
      
      let desafiosCompletos = 0;
      let pontosTotais = 0;
      let melhorPosicao= 999;
      let streakRecord = 0;
      
      for (const doc of snapshot.docs) {
        const desafioId = doc.id;
        
        // Buscar progresso do usuário neste desafio
        const progressoRef = db.collection('desafios').doc(desafioId).collection('progressos').doc(userId);
        const progressoDoc = await progressoRef.get();
        
        if (progressoDoc.exists) {
          const progresso = progressoDoc.data() as ProgressoDesafio;
          
          if (progresso.metaAtingida) {
            desafiosCompletos++;
          }
          
          pontosTotais += progresso.pontuacaoAtual || 0;
          
          if (progresso.melhorStreak > streakRecord) {
            streakRecord = progresso.melhorStreak;
          }
          
          // Verificar posição no ranking
          const ranking = await this.obterRankingDesafio(desafioId);
          const usuarioNoRanking = ranking.find(r => r.userId === userId);
          if (usuarioNoRanking && usuarioNoRanking.posicao < melhorPosicao) {
            melhorPosicao = usuarioNoRanking.posicao;
          }
        }
      }
      
      return {
        desafiosParticipados: snapshot.docs.length,
        desafiosCompletos,
        pontosTotais,
        melhorPosicao: melhorPosicao === 999 ? 0 : melhorPosicao,
        streakRecord
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas do usuário:', error);
      return {
        desafiosParticipados: 0,
        desafiosCompletos: 0,
        pontosTotais: 0,
        melhorPosicao: 0,
        streakRecord: 0
      };
    }
  }

  /**
   * Obtém histórico de desafios do usuário
   */
  async obterHistoricoDesafios(userId: string, limite: number = 20): Promise<Array<{
    desafio: Desafio;
    progresso: ProgressoDesafio;
    posicaoFinal: number;
  }>> {
    try {
      const desafiosRef = db.collection('desafios');
      const query = desafiosRef
        .where('participantes', 'array-contains', userId)
        .orderBy('created', 'desc')
        .limit(limite);
      
      const snapshot = await query.get();
      const historico = [];
      
      for (const doc of snapshot.docs) {
        const desafioData = doc.data();
        const desafio = {
          id: doc.id,
          ...desafioData,
          dataInicio: desafioData.dataInicio?.toDate() || new Date(),
          dataFim: desafioData.dataFim?.toDate() || new Date(),
          created: desafioData.created || Timestamp.now()
        } as Desafio;
        
        // Buscar progresso do usuário
        const progressoRef = db.collection('desafios').doc(doc.id).collection('progressos').doc(userId);
        const progressoDoc = await progressoRef.get();
        
        if (progressoDoc.exists) {
          const progresso = progressoDoc.data() as ProgressoDesafio;
          
          // Buscar posição final no ranking
          const ranking = await this.obterRankingDesafio(doc.id);
          const posicaoFinal = ranking.find(r => r.userId === userId)?.posicao || 0;
          
          historico.push({
            desafio,
            progresso,
            posicaoFinal
          });
        }
      }
      
      return historico;
    } catch (error) {
      console.error('Erro ao obter histórico de desafios:', error);
      return [];
    }
  }

  /**
   * Obtém desafios disponíveis para o mês atual
   */
  obterDesafiosDoMes(mes?: number): Array<{
    semana: number;
    desafio: {
      nome: string;
      descricao: string;
      tipo: 'cardio' | 'forca' | 'consistencia' | 'nutricao' | 'especial';
      meta: number;
      unidade: string;
      pontos: number;
      icone: string;
      cor: string;
    };
  }> {
    const mesAtual = mes || new Date().getMonth() + 1;
    const desafiosDoMes = this.DESAFIOS_ANUAIS[mesAtual as keyof typeof this.DESAFIOS_ANUAIS];
    
    if (!desafiosDoMes) {
      return [];
    }
    
    return Object.entries(desafiosDoMes).map(([semana, desafio]) => ({
      semana: parseInt(semana),
      desafio
    }));
  }

  /**
   * Obtém próximos desafios da semana
   */
  obterProximosDesafios(quantidade: number = 4): Array<{
    mes: number;
    semana: number;
    desafio: {
      nome: string;
      descricao: string;
      tipo: 'cardio' | 'forca' | 'consistencia' | 'nutricao' | 'especial';
      meta: number;
      unidade: string;
      pontos: number;
      icone: string;
      cor: string;
    };
    dataInicio: Date;
   }> {
    const agora = new Date();
    const proximosDesafios = [];
    
    for (let i = 0; i < quantidade; i++) {
      const dataFutura = new Date(agora);
      dataFutura.setDate(agora.getDate() + (i * 7)); // Próximas semanas
      
      const mes = dataFutura.getMonth() + 1;
      const semana = Math.ceil(dataFutura.getDate() / 7);
      
      const desafiosDoMes = this.DESAFIOS_ANUAIS[mes as keyof typeof this.DESAFIOS_ANUAIS];
      if (desafiosDoMes) {
        const desafio = desafiosDoMes[semana as keyof typeof desafiosDoMes];
        if (desafio) {
          proximosDesafios.push({
            mes,
            semana,
            desafio,
            dataInicio: dataFutura
          });
        }
      }
    }
    
    return proximosDesafios;
  }

  /**
   * Marca notificação como lida
   */
  async marcarNotificacaoLida(userId: string, notificacaoId: string): Promise<boolean> {
    try {
      const notificacaoRef = db.collection('users').doc(userId).collection('notificacoes').doc(notificacaoId);
      await notificacaoRef.update({ lida: true });
      return true;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return false;
    }
  }

  /**
   * Obtém notificações não lidas do usuário
   */
  async obterNotificacoesNaoLidas(userId: string, limite: number = 10): Promise<NotificacaoDesafio[]> {
    try {
      const notificacoesRef = db.collection('users').doc(userId).collection('notificacoes');
      const query = notificacoesRef
        .where('lida', '==', false)
        .orderBy('created', 'desc')
        .limit(limite);
      
      const snapshot = await query.get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created: doc.data().created || Timestamp.now()
      })) as NotificacaoDesafio[];
    } catch (error) {
      console.error('Erro ao obter notificações:', error);
      return [];
    }
  }

  /**
   * Verifica se há desafio ativo e cria um novo se necessário
   */
  async verificarECriarDesafioAtivo(): Promise<Desafio> {
    const desafioAtivo = await this.obterDesafioAtivo();
    
    if (!desafioAtivo) {
      return await this.criarDesafioSemanal();
    }
    
    // Verificar se o desafio atual expirou
    const agora = new Date();
    if (desafioAtivo.dataFim < agora) {
      await this.finalizarDesafiosExpirados();
      return await this.criarDesafioSemanal();
    }
    
    return desafioAtivo;
  }

  /**
   * Obtém leaderboard global (top usuários de todos os desafios)
   */
  async obterLeaderboardGlobal(limite: number = 50): Promise<Array<{
    userId: string;
    userName: string;
    userAvatar: string;
    pontosTotais: number;
    desafiosCompletos: number;
    melhorPosicao: number;
    streakRecord: number;
    posicaoGlobal: number;
  }>> {
    try {
      // Buscar todos os usuários únicos que participaram de desafios
      const desafiosRef = db.collection('desafios');
      const snapshot = await desafiosRef.get();
      
      const usuariosMap = new Map<string, {
        pontosTotais: number;
        desafiosCompletos: number;
        melhorPosicao: number;
        streakRecord: number;
      }>();
      
      // Processar cada desafio
      for (const desafioDoc of snapshot.docs) {
        const desafioId = desafioDoc.id;
        const desafioData = desafioDoc.data();
        
        if (desafioData.participantes && Array.isArray(desafioData.participantes)) {
          for (const userId of desafioData.participantes) {
            // Buscar progresso do usuário
            const progressoRef = db.collection('desafios').doc(desafioId).collection('progressos').doc(userId);
            const progressoDoc = await progressoRef.get();
            
            if (progressoDoc.exists) {
              const progresso = progressoDoc.data() as ProgressoDesafio;
              
              if (!usuariosMap.has(userId)) {
                usuariosMap.set(userId, {
                  pontosTotais: 0,
                  desafiosCompletos: 0,
                  melhorPosicao: 999,
                  streakRecord: 0
                });
              }
              
              const stats = usuariosMap.get(userId)!;
              stats.pontosTotais += progresso.pontuacaoAtual || 0;
              
              if (progresso.metaAtingida) {
                stats.desafiosCompletos++;
              }
              
              if (progresso.melhorStreak > stats.streakRecord) {
                stats.streakRecord = progresso.melhorStreak;
              }
              
              // Verificar posição no ranking deste desafio
              const ranking = await this.obterRankingDesafio(desafioId);
              const posicao = ranking.find(r => r.userId === userId)?.posicao || 999;
              if (posicao < stats.melhorPosicao) {
                stats.melhorPosicao = posicao;
              }
            }
          }
        }
      }
      
      // Converter para array e ordenar por pontos totais
      const leaderboard = [];
      for (const [userId, stats] of usuariosMap) {
        // Buscar dados do usuário
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        const userData = userDoc.exists ? userDoc.data() : {};
        
        leaderboard.push({
          userId,
          userName: userData?.name || 'Usuário',
          userAvatar: userData?.avatar || '',
          pontosTotais: stats.pontosTotais,
          desafiosCompletos: stats.desafiosCompletos,
          melhorPosicao: stats.melhorPosicao === 999 ? 0 : stats.melhorPosicao,
          streakRecord: stats.streakRecord,
          posicaoGlobal: 0 // Será definido após ordenação
        });
      }
      
      // Ordenar por pontos totais (decrescente)
      leaderboard.sort((a, b) => b.pontosTotais - a.pontosTotais);
      
      // Definir posições
      leaderboard.forEach((user, index) => {
        user.posicaoGlobal = index + 1;
      });
      
      return leaderboard.slice(0, limite);
    } catch (error) {
      console.error('Erro ao obter leaderboard global:', error);
      return [];
    }
  }

  /**
   * Obtém estatísticas gerais do sistema de desafios
   */
  async obterEstatisticasGerais(): Promise<{
    totalDesafios: number;
    totalParticipantes: number;
    desafiosAtivos: number;
    pontosDistribuidos: number;
    taxaConclusao: number;
  }> {
    try {
      const desafiosRef = db.collection('desafios');
      const snapshot = await desafiosRef.get();
      
      let totalParticipantes = 0;
      let desafiosAtivos = 0;
      let pontosDistribuidos = 0;
      let totalProgressos = 0;
      let progressosCompletos = 0;
      
      for (const doc of snapshot.docs) {
        const desafio = doc.data();
        
        if (desafio.ativo) {
          desafiosAtivos++;
        }
        
        totalParticipantes += desafio.totalParticipantes || 0;
        
        // Buscar progressos deste desafio
        const progressosRef = db.collection('desafios').doc(doc.id).collection('progressos');
        const progressosSnapshot = await progressosRef.get();
        
        progressosSnapshot.forEach(progressoDoc => {
          const progresso = progressoDoc.data() as ProgressoDesafio;
          totalProgressos++;
          
          if (progresso.metaAtingida) {
            progressosCompletos++;
          }
          
          pontosDistribuidos += progresso.pontuacaoAtual || 0;
        });
      }
      
      const taxaConclusao = totalProgressos > 0 ? (progressosCompletos / totalProgressos) * 100 : 0;
      
      return {
        totalDesafios: snapshot.docs.length,
        totalParticipantes,
        desafiosAtivos,
        pontosDistribuidos,
        taxaConclusao: Math.round(taxaConclusao * 100) / 100
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas gerais:', error);
      return {
        totalDesafios: 0,
        totalParticipantes: 0,
        desafiosAtivos: 0,
        pontosDistribuidos: 0,
        taxaConclusao: 0
      };
    }
  }
}

// ==================== INSTÂNCIA SINGLETON ====================

export const desafiosManager = new DesafiosManager();

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Função helper para calcular progresso baseado no tipo de ação
 */
export function calcularProgressoAcao(
  tipoDesafio: Desafio['tipo'],
  acao: string,
  valor: number,
  metaTotal: number
): { progresso: number; pontos: number } {
  let incrementoProgresso = 0;
  let pontos = 0;
  
  switch (tipoDesafio) {
    case 'cardio':
      if (['TREINO_CARDIO', 'CARDIO_MINUTOS', 'CORRIDA', 'BIKE'].includes(acao)) {
        incrementoProgresso = (valor / metaTotal) * 100;
        pontos = Math.round(25 * valor);
      }
      break;
      
    case 'forca':
      if (['TREINO_FORCA', 'REPETICOES', 'PESO_LEVANTADO'].includes(acao)) {
        incrementoProgresso = (valor / metaTotal) * 100;
        pontos = Math.round(20 * valor);
      }
      break;
      
    case 'consistencia':
      if (['TREINO_COMPLETO', 'DIA_ATIVO'].includes(acao)) {
        incrementoProgresso = (1 / metaTotal) * 100;
        pontos = 50;
      }
      break;
      
    case 'nutricao':
      if (['META_AGUA', 'META_PROTEINA', 'REFEICAO_SAUDAVEL'].includes(acao)) {
        incrementoProgresso = (1 / metaTotal) * 100;
        pontos = 30;
      }
      break;
      
    case 'especial':
      incrementoProgresso = (valor / metaTotal) * 100;
      pontos = Math.round(35 * valor);
      break;
  }
  
  return {
    progresso: Math.min(incrementoProgresso, 100),
    pontos: Math.max(pontos, 0)
  };
}

/**
 * Valida se uma ação é válida para um tipo de desafio
 */
export function validarAcaoDesafio(tipoDesafio: Desafio['tipo'], acao: string): boolean {
  const acoesValidas = {
    cardio: ['TREINO_CARDIO', 'CARDIO_MINUTOS', 'CORRIDA', 'BIKE', 'CAMINHADA'],
    forca: ['TREINO_FORCA', 'REPETICOES', 'PESO_LEVANTADO', 'EXERCICIO_FORCA'],
    consistencia: ['TREINO_COMPLETO', 'DIA_ATIVO', 'CHECK_IN_DIARIO'],
    nutricao: ['META_AGUA', 'META_PROTEINA', 'REFEICAO_SAUDAVEL', 'VITAMINAS'],
    especial: ['ACAO_ESPECIAL', 'SESSAO_ESPECIAL', 'YOGA', 'MEDITACAO', 'ALONGAMENTO']
  };
  
  return acoesValidas[tipoDesafio]?.includes(acao) || false;
}

/**
 * Formata tempo restante do desafio
 */
export function formatarTempoRestante(dataFim: Date): string {
  const agora = new Date();
  const diferenca = dataFim.getTime() - agora.getTime();
  
  if (diferenca <= 0) {
    return 'Finalizado';
  }
  
  const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
  
  if (dias > 0) {
    return `${dias}d ${horas}h ${minutos}m`;
  } else if (horas > 0) {
    return `${horas}h ${minutos}m`;
  } else {
    return `${minutos}m`;
  }
}

/**
 * Gera cor baseada na posição no ranking
 */
export function corPorPosicao(posicao: number): string {
  if (posicao === 1) return '#FFD700'; // Ouro
  if (posicao === 2) return '#C0C0C0'; // Prata
  if (posicao === 3) return '#CD7F32'; // Bronze
  if (posicao <= 10) return '#4ECDC4'; // Top 10
  return '#95A5A6'; // Outros
}