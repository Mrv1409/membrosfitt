import { NextRequest, NextResponse } from 'next/server';
import { GamificationEngine } from '@/lib/gamification/engine';
import { DesafiosManager } from '@/lib/gamification/desafios';

// ✅ Lazy initialization
let gamificationEngine: GamificationEngine | null = null;
let desafiosManager: DesafiosManager | null = null;
//eslint-disable-next-line
function getEngine() {
  if (!gamificationEngine) {
    gamificationEngine = new GamificationEngine();
  }
  return gamificationEngine;
}

function getDesafiosManager() {
  if (!desafiosManager) {
    desafiosManager = new DesafiosManager();
  }
  return desafiosManager;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ desafioId: string }> }
) {
  try {
    const manager = getDesafiosManager();
    const { desafioId } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!desafioId || !userId) {
      return NextResponse.json(
        { error: 'DesafioId e userId obrigatórios' },
        { status: 400 }
      );
    }

    const progresso = await manager.obterProgressoUsuario(desafioId, userId);
    
    return NextResponse.json({
      success: true,
      data: progresso
    });

  } catch (error) {
    console.error('❌ Erro ao buscar progresso:', error);
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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ desafioId: string }> }
) {
  try {
    const manager = getDesafiosManager();
    const { desafioId } = await context.params;
    const body = await request.json();
    const { userId, valor, acao, descricao } = body;
    
    if (!desafioId || !userId || valor === undefined) {
      return NextResponse.json(
        { error: 'DesafioId, userId e valor são obrigatórios' },
        { status: 400 }
      );
    }

    const progressoAtualizado = await manager.atualizarProgresso(
      desafioId, 
      userId, 
      valor, 
      acao || 'progresso',
      descricao || 'Progresso atualizado'
    );

    // Se meta atingida, pode adicionar lógica de recompensa aqui
    if (progressoAtualizado?.metaAtingida) {//eslint-disable-next-line
      const desafio = await manager.obterDesafio(desafioId);
      
      // TODO: Adicionar pontos de recompensa via GamificationEngine
      // const engine = getEngine();
      // await engine.adicionarPontos(userId, 'DESAFIO_COMPLETO', { desafioId });
    }

    return NextResponse.json({
      success: true,
      data: progressoAtualizado,
      message: progressoAtualizado?.metaAtingida ? 
        'Parabéns! Meta atingida! 🎉' : 
        'Progresso atualizado com sucesso!'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar progresso:', error);
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