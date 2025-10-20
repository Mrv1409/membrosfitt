import { NextRequest, NextResponse } from 'next/server';
import { GamificationEngine } from '@/lib/gamification/engine';

// ✅ Lazy initialization
let gamificationEngine: GamificationEngine | null = null;

function getEngine() {
  if (!gamificationEngine) {
    gamificationEngine = new GamificationEngine();
  }
  return gamificationEngine;
}

interface ProgressoSemanal {
  dia: string;
  pontos: number;
}

interface MetasDiarias {
  treino: boolean;
  refeicao: boolean;
  checkIn: boolean;
}

interface DashboardData {
  stats: object;
  ranking: object[];
  conquistasRecentes: object[];
  progressoSemanal: ProgressoSemanal[];
  metasDiarias: MetasDiarias;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const engine = getEngine();
    const { userId } = await context.params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'UserId obrigatório', success: false },
        { status: 400 }
      );
    }

    // Buscar dados em paralelo para performance
    const [stats, ranking] = await Promise.all([
      engine.obterEstatisticas(userId),
      engine.obterRankingSemanal(10)
    ]);

    // Por enquanto, vamos criar dados mock para conquistas
    // Você pode implementar este método no GamificationEngine depois
    const conquistasRecentes = [
      { titulo: 'Primeira Semana', descricao: 'Completou 5 dias consecutivos', data: new Date() },
      { titulo: 'Guerreiro', descricao: 'Completou 10 treinos', data: new Date() }
    ];

    const dashboardData: DashboardData = {
      stats,
      ranking,
      conquistasRecentes,
      progressoSemanal: await calcularProgressoSemanal(userId),
      metasDiarias: await verificarMetasDiarias(userId)
    };
    
    return NextResponse.json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados do dashboard:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        success: false,
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
//eslint-disable-next-line
async function calcularProgressoSemanal(userId: string): Promise<ProgressoSemanal[]> {
  // TODO: Implementar lógica real para progresso dos últimos 7 dias
  // Por enquanto retorna dados mock
  const hoje = new Date();//eslint-disable-next-line
  const semanaPassada = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Buscar pontos por dia da semana do Firestore
  // Esta é uma versão simplificada - você pode expandir
  return [
    { dia: 'Dom', pontos: 0 },
    { dia: 'Seg', pontos: 150 },
    { dia: 'Ter', pontos: 200 },
    { dia: 'Qua', pontos: 100 },
    { dia: 'Qui', pontos: 250 },
    { dia: 'Sex', pontos: 180 },
    { dia: 'Sab', pontos: 50 }
  ];
}
//eslint-disable-next-line
async function verificarMetasDiarias(userId: string): Promise<MetasDiarias> {
  //eslint-disable-next-line
  const hoje = new Date().toDateString();
  
  // Esta é uma implementação básica - expandir conforme necessário
  return {
    treino: false, // Verificar se fez treino hoje
    refeicao: false, // Verificar se registrou refeições
    checkIn: false // Verificar se fez check-in
  };
}