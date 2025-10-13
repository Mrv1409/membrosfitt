import { NextRequest, NextResponse } from 'next/server';
import { GamificationEngine } from '@/lib/gamification/engine';

const gamificationEngine = new GamificationEngine();

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
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'UserId obrigatório', success: false },
        { status: 400 }
      );
    }

    // Buscar dados em paralelo para performance
    const [stats, ranking] = await Promise.all([
      gamificationEngine.obterEstatisticas(userId),
      gamificationEngine.obterRankingSemanal(10)
    ]);

    // Por enquanto, vamos criar dados mock para conquistas
    // Você pode implementar este método no GamificationEngine depois
    const conquistasRecentes = [
      { titulo: 'Primeira Semana', descricao: 'Completou 7 dias consecutivos', data: new Date() },
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
    console.error('Erro ao buscar dados do dashboard:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        success: false 
      },
      { status: 500 }
    );
  }
}

//eslint-disable-next-line
async function calcularProgressoSemanal(userId: string): Promise<ProgressoSemanal[]> {
  // Implementar lógica para progresso dos últimos 7 dias
  const hoje = new Date();
  //eslint-disable-next-line
  const semanaPassada = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Buscar pontos por dia da semana
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