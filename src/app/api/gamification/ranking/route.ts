import { NextRequest, NextResponse } from 'next/server';
import { GamificationEngine } from '@/lib/gamification/engine';

const gamificationEngine = new GamificationEngine();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limite = searchParams.get('limite') || '50';
    const periodo = searchParams.get('periodo') || 'semanal';
    
    const limiteNum = parseInt(limite);
    
    let ranking;
    if (periodo === 'semanal') {
      ranking = await gamificationEngine.obterRankingSemanal(limiteNum);
    } else {
      ranking = await gamificationEngine.obterRankingSemanal(limiteNum);
    }
    
    return NextResponse.json({
      success: true,
      data: ranking,
      periodo
    });
    
  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        success: false 
      },
      { status: 500 }
    );
  }
}