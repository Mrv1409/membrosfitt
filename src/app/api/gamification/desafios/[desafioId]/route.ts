import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';


import '@/lib/firebase/admin'; 

const db = getFirestore();


interface Objetivo {
  tipo: string;
  meta: number;
  unidade: string;
  descricao?: string;
}

interface Recompensa {
  tipo: string;
  valor: number;
  descricao: string;
}

interface ProgressoUsuario {
  progresso: number;
  metaAtingida: boolean;
  ultimaAtualizacao: Date | null;
  historico: HistoricoItem[];
}

interface Estatisticas {
  totalParticipantes: number;
  metasAtingidas: number;
  progressoMedio: number;
}

interface DesafioData {
  id: string;
  nome?: string;
  descricao?: string;
  icone?: string;
  cor?: string;
  ativo?: boolean;
  objetivo?: Objetivo;
  recompensas?: Recompensa[];
  dataInicio?: Date | null;
  dataFim?: Date | null;
  created?: Date | null;
  meuProgresso?: ProgressoUsuario;
  estatisticas?: Estatisticas;
  [key: string]: unknown;
}

interface HistoricoItem {
  data?: Date | { toDate?: () => Date } | null;
  valor?: number;
  acao?: string;
  descricao?: string;
  [key: string]: unknown;
}


export async function GET(
  request: NextRequest,
  context: { params: Promise<{ desafioId: string }> }
) {
  try {
    // ✅ MUDANÇA PARA NEXT.JS 15: params agora é uma Promise
    const { desafioId } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!desafioId) {
      return NextResponse.json(
        { error: 'DesafioId obrigatório' },
        { status: 400 }
      );
    }

    
    const desafioRef = db.collection('desafios').doc(desafioId);
    const desafioDoc = await desafioRef.get();
    
    if (!desafioDoc.exists) {
      return NextResponse.json(
        { error: 'Desafio não encontrado' },
        { status: 404 }
      );
    }

    const desafioData = desafioDoc.data();
    const desafio: DesafioData = { 
      id: desafioDoc.id,
      ...desafioData,
      
      dataInicio: desafioData?.dataInicio?.toDate?.() || desafioData?.dataInicio || null,
      dataFim: desafioData?.dataFim?.toDate?.() || desafioData?.dataFim || null,
      created: desafioData?.created?.toDate?.() || desafioData?.created || null,
    };

    
    if (userId) {
      try {
        const progressoRef = db.collection('progressos-desafios').doc(`${desafioId}_${userId}`);
        const progressoDoc = await progressoRef.get();
        
        if (progressoDoc.exists) {
          const progressoData = progressoDoc.data();
          desafio.meuProgresso = { 
            progresso: progressoData?.progresso || 0,
            metaAtingida: progressoData?.metaAtingida || false,
            ultimaAtualizacao: progressoData?.ultimaAtualizacao?.toDate?.() || progressoData?.ultimaAtualizacao || null,
            historico: progressoData?.historico?.map((item: HistoricoItem) => ({
              ...item,
              data: (item.data && typeof item.data === 'object' && 'toDate' in item.data) 
                ? (item.data as { toDate: () => Date }).toDate() 
                : item.data || null
            })) || []
          };
        }
      } catch (error) {
        console.error('Erro ao buscar progresso:', error);
      }
    }

    
    const progressosQuery = db.collection('progressos-desafios')
      .where('desafioId', '==', desafioId);
    
    const progressosSnapshot = await progressosQuery.get();
    const estatisticas = {
      totalParticipantes: progressosSnapshot.size,
      metasAtingidas: 0,
      progressoMedio: 0
    };

    let somaProgresso = 0;
    progressosSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.metaAtingida) estatisticas.metasAtingidas++;
      somaProgresso += data.progresso || 0;
    });

    if (progressosSnapshot.size > 0) {
      estatisticas.progressoMedio = Math.round(somaProgresso / progressosSnapshot.size);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...desafio,
        estatisticas
      }
    });

  } catch (error) {
    console.error('Erro ao buscar desafio:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        success: false 
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar desafio
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ desafioId: string }> }
) {
  try {
    // ✅ MUDANÇA PARA NEXT.JS 15: params agora é uma Promise
    const { desafioId } = await context.params;
    const body = await request.json();
    
    if (!desafioId) {
      return NextResponse.json(
        { error: 'DesafioId obrigatório' },
        { status: 400 }
      );
    }

    
    const desafioRef = db.collection('desafios').doc(desafioId);
    const desafioDoc = await desafioRef.get();
    
    if (!desafioDoc.exists) {
      return NextResponse.json(
        { error: 'Desafio não encontrado' },
        { status: 404 }
      );
    }
    const updateData: Record<string, unknown> = {};
    
    const allowedFields = [
      'nome', 'descricao', 'icone', 'cor', 'ativo',
      'objetivo', 'recompensas'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    
    if (body.dataInicio) {
      updateData.dataInicio = Timestamp.fromDate(new Date(body.dataInicio));
    }
    if (body.dataFim) {
      updateData.dataFim = Timestamp.fromDate(new Date(body.dataFim));
    }

    
    await desafioRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Desafio atualizado com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao atualizar desafio:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        success: false 
      },
      { status: 500 }
    );
  }
}

// DELETE - Deletar desafio (admin only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ desafioId: string }> }
) {
  try {
    // ✅ MUDANÇA PARA NEXT.JS 15: params agora é uma Promise
    const { desafioId } = await context.params;
    
    if (!desafioId) {
      return NextResponse.json(
        { error: 'DesafioId obrigatório' },
        { status: 400 }
      );
    }

    
    const desafioRef = db.collection('desafios').doc(desafioId);
    const desafioDoc = await desafioRef.get();
    
    if (!desafioDoc.exists) {
      return NextResponse.json(
        { error: 'Desafio não encontrado' },
        { status: 404 }
      );
    }

    
    const progressosQuery = db.collection('progressos-desafios')
      .where('desafioId', '==', desafioId);
    
    const progressosSnapshot = await progressosQuery.get();
    const batch = db.batch();
    
    progressosSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    
    batch.delete(desafioRef);
    
    
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'Desafio deletado com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao deletar desafio:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        success: false 
      },
      { status: 500 }
    );
  }
}