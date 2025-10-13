import { NextRequest, NextResponse } from 'next/server';
import { GamificationEngine } from '@/lib/gamification/engine';
import { DesafiosManager } from '@/lib/gamification/desafios';
//eslint-disable-next-line
const gamificationEngine = new GamificationEngine();
const desafiosManager = new DesafiosManager(); 


export async function GET(
  request: NextRequest,
  context: { params: Promise<{ desafioId: string }> }
) {
  try {
    // ✅ MUDANÇA PARA NEXT.JS 15: params agora é uma Promise
    const { desafioId } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!desafioId || !userId) {
      return NextResponse.json(
        { error: 'DesafioId e userId obrigatórios' },
        { status: 400 }
      );
    }

    const progresso = await desafiosManager.obterProgressoUsuario(desafioId, userId);
    
    return NextResponse.json({
      success: true,
      data: progresso
    });

  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        success: false 
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
    // ✅ MUDANÇA PARA NEXT.JS 15: params agora é uma Promise
    const { desafioId } = await context.params;
    const body = await request.json();
    const { userId, valor, acao, descricao } = body;
    
    if (!desafioId || !userId || valor === undefined) {
      return NextResponse.json(
        { error: 'DesafioId, userId e valor são obrigatórios' },
        { status: 400 }
      );
    }

    
    const progressoAtualizado = await desafiosManager.atualizarProgresso(
      desafioId, 
      userId, 
      valor, 
      acao || 'progresso',
      descricao || 'Progresso atualizado'
    );

    
    if (progressoAtualizado?.metaAtingida) { 
      //eslint-disable-next-line
      const desafio = await desafiosManager.obterDesafio(desafioId);
      
      
      
    }

    return NextResponse.json({
      success: true,
      data: progressoAtualizado,
      message: progressoAtualizado?.metaAtingida ? 
        'Parabéns! Meta atingida! 🎉' : 
        'Progresso atualizado com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        success: false 
      },
      { status: 500 }
    );
  }
}