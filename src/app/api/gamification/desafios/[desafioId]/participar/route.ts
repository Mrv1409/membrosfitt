import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import '@/lib/firebase/admin';

const db = getFirestore();

// POST - Participar de um desafio
export async function POST(
  request: NextRequest,
  { params }: { params: { desafioId: string } }
) {
  try {
    const { desafioId } = params;
    const body = await request.json();
    const { userId, userName, userAvatar } = body;
    
    if (!desafioId || !userId || !userName) {
      return NextResponse.json(
        { error: 'DesafioId, userId e userName são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se desafio existe e está ativo
    const desafioRef = db.collection('desafios').doc(desafioId);
    const desafioDoc = await desafioRef.get();
    
    if (!desafioDoc.exists) {
      return NextResponse.json(
        { error: 'Desafio não encontrado' },
        { status: 404 }
      );
    }

    const desafioData = desafioDoc.data();
    
    if (!desafioData?.ativo) {
      return NextResponse.json(
        { error: 'Desafio não está ativo' },
        { status: 400 }
      );
    }

    // Verificar se já está participando
    const progressoId = `${desafioId}_${userId}`;
    const progressoRef = db.collection('progressos-desafios').doc(progressoId);
    const progressoDoc = await progressoRef.get();
    
    if (progressoDoc.exists) {
      return NextResponse.json(
        { error: 'Usuário já está participando deste desafio' },
        { status: 400 }
      );
    }

    // Verificar se desafio ainda está no prazo
    const agora = new Date();
    const dataFim = desafioData.dataFim?.toDate() || new Date(desafioData.dataFim);
    
    if (agora > dataFim) {
      return NextResponse.json(
        { error: 'Desafio já foi finalizado' },
        { status: 400 }
      );
    }

    // Criar progresso inicial
    const novoProgresso = {
      desafioId,
      userId,
      progresso: 0,
      metaAtingida: false,
      pontuacaoAtual: 0,
      ultimaAtualizacao: Timestamp.fromDate(agora),
      historico: [{
        data: Timestamp.fromDate(agora),
        valor: 0,
        acao: 'participar',
        descricao: 'Entrou no desafio'
      }],
      streakAtual: 0,
      melhorStreak: 0
    };

    // Salvar progresso
    await progressoRef.set(novoProgresso);

    // Adicionar usuário aos participantes do desafio
    await desafioRef.update({
      participantes: FieldValue.arrayUnion(userId),
      totalParticipantes: (desafioData.totalParticipantes || 0) + 1,
      ranking: FieldValue.arrayUnion({
        userId,
        userName,
        userAvatar: userAvatar || '',
        progresso: 0,
        pontuacao: 0,
        posicao: (desafioData.totalParticipantes || 0) + 1,
        metaAtingida: false
      })
    });

    // Criar notificação
    const notificacaoId = `notif_${Date.now()}_${userId}`;
    const notificacao = {
      id: notificacaoId,
      userId,
      tipo: 'novo_desafio',
      titulo: 'Desafio Iniciado! 🎯',
      mensagem: `Você entrou no desafio "${desafioData.nome}". Boa sorte!`,
      lida: false,
      created: Timestamp.fromDate(agora)
    };

    await db.collection('notificacoes-desafios').doc(notificacaoId).set(notificacao);

    return NextResponse.json({
      success: true,
      data: {
        progressoId,
        desafioNome: desafioData.nome,
        progresso: novoProgresso
      },
      message: 'Você entrou no desafio com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao participar do desafio:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        success: false 
      },
      { status: 500 }
    );
  }
}

// DELETE - Sair do desafio
export async function DELETE(
  request: NextRequest,
  { params }: { params: { desafioId: string } }
) {
  try {
    const { desafioId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!desafioId || !userId) {
      return NextResponse.json(
        { error: 'DesafioId e userId são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se está participando
    const progressoId = `${desafioId}_${userId}`;
    const progressoRef = db.collection('progressos-desafios').doc(progressoId);
    const progressoDoc = await progressoRef.get();
    
    if (!progressoDoc.exists) {
      return NextResponse.json(
        { error: 'Usuário não está participando deste desafio' },
        { status: 400 }
      );
    }

    // Buscar dados do desafio
    const desafioRef = db.collection('desafios').doc(desafioId);
    const desafioDoc = await desafioRef.get();
    
    if (!desafioDoc.exists) {
      return NextResponse.json(
        { error: 'Desafio não encontrado' },
        { status: 404 }
      );
    }

    const desafioData = desafioDoc.data();

    // Usar batch para operações atômicas
    const batch = db.batch();

    // Remover progresso
    batch.delete(progressoRef);

    // Atualizar desafio (remover do array e ranking)
    const participantesAtualizados = (desafioData?.participantes || []).filter(
      (id: string) => id !== userId
    );
    
    const rankingAtualizado = (desafioData?.ranking || []).filter(
      (item: Record<string, unknown>) => item.userId !== userId
    );

    // Recalcular posições do ranking
    const rankingReordenado = rankingAtualizado
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (b.pontuacao as number) - (a.pontuacao as number))
      .map((item: Record<string, unknown>, index: number) => ({
        ...item,
        posicao: index + 1
      }));

    batch.update(desafioRef, {
      participantes: participantesAtualizados,
      totalParticipantes: participantesAtualizados.length,
      ranking: rankingReordenado
    });

    // Executar todas as operações
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'Você saiu do desafio com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao sair do desafio:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        success: false 
      },
      { status: 500 }
    );
  }
}