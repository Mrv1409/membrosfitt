import { NextRequest, NextResponse } from 'next/server';

// ⚠️ GAMIFICAÇÃO TEMPORARIAMENTE DESABILITADA
// Esta API retorna sucesso sem processar nada para não quebrar o build

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log para debug (opcional)
    console.log('📊 Gamificação/Action desabilitada - Dados recebidos:', {
      userId: body.userId,
      acao: body.acao
    });
    
    // Retorna sucesso sem fazer nada
    return NextResponse.json({ 
      success: true,
      message: 'Gamificação temporariamente desabilitada',
      pontos: 0,
      nivel: 1,
      progresso: 0
    });
    
  } catch (error) {
    console.error('Erro na API de gamificação/action:', error);
    return NextResponse.json({ 
      success: true, // Retorna sucesso mesmo com erro
      message: 'Gamificação temporariamente desabilitada' 
    });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'disabled',
    message: 'Gamificação/Action temporariamente desabilitada' 
  });
}