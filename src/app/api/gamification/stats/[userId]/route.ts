import { NextRequest, NextResponse } from 'next/server';
import { GamificationEngine } from '@/lib/gamification/engine';

const gamificationEngine = new GamificationEngine();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    // ✅ MUDANÇA PARA NEXT.JS 15: params agora é uma Promise
    const { userId } = await context.params;
    
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