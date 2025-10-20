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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const engine = getEngine();
    const { userId } = await context.params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'UserId obrigatório' },
        { status: 400 }
      );
    }

    const stats = await engine.obterEstatisticas(userId);
    
    return NextResponse.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
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