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

export async function GET(request: NextRequest) {
  try {
    const engine = getEngine();
    const { searchParams } = new URL(request.url);
    const limite = searchParams.get('limite') || '50';
    const periodo = searchParams.get('periodo') || 'semanal';
    
    const limiteNum = parseInt(limite);
    
    let ranking;
    if (periodo === 'semanal') {
      ranking = await engine.obterRankingSemanal(limiteNum);
    } else {
      // Se implementar outros períodos (mensal, anual), adicione aqui
      ranking = await engine.obterRankingSemanal(limiteNum);
    }
    
    return NextResponse.json({
      success: true,
      data: ranking,
      periodo
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar ranking:', error);
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