import { NextRequest, NextResponse } from 'next/server';
import { GamificationEngine } from '@/lib/gamification/engine';

const gamificationEngine = new GamificationEngine();

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'UserId obrigatório' },
        { status: 400 }
      );
    }

    const stats = await gamificationEngine.obterEstatisticas(userId);
    
    return NextResponse.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        success: false 
      },
      { status: 500 }
    );
  }
}