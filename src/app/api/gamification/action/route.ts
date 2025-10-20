import { NextRequest, NextResponse } from 'next/server';
import { GamificationEngine } from '@/lib/gamification/engine';

// ✅ Inicializa engine apenas quando necessário
let gamificationEngine: GamificationEngine | null = null;

function getEngine() {
  if (!gamificationEngine) {
    gamificationEngine = new GamificationEngine();
  }
  return gamificationEngine;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, acao, detalhes } = body;
    
    if (!userId || !acao) {
      return NextResponse.json(
        { 
          error: 'UserId e ação são obrigatórios',
          success: false 
        },
        { status: 400 }
      );
    }

    const engine = getEngine();
    let resultado;
    
    // Tratar ação específica de treino
    if (acao === 'TREINO_COMPLETO') {
      const isFimDeSemana = detalhes?.isFimDeSemana || false;
      resultado = await engine.processarTreinoCompleto(userId, isFimDeSemana);
    } else {
      resultado = await engine.adicionarPontos(userId, acao, detalhes);
    }
    
    return NextResponse.json({
      success: true,
      data: resultado,
      message: `+${resultado.pontos} pontos!`
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar ação:', error);
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