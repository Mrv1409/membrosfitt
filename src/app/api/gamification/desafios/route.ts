import { NextRequest, NextResponse } from 'next/server';
import { GamificationEngine } from '@/lib/gamification/engine';
import { DesafiosManager } from '@/lib/gamification/desafios'; 
import { getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// ✅ Lazy initialization
let gamificationEngine: GamificationEngine | null = null;
let desafiosManager: DesafiosManager | null = null;
let db: ReturnType<typeof getAdminDb> | null = null;
//eslint-disable-next-line
function getEngine() {
  if (!gamificationEngine) {
    gamificationEngine = new GamificationEngine();
  }
  return gamificationEngine;
}
//eslint-disable-next-line
function getDesafiosManager() {
  if (!desafiosManager) {
    desafiosManager = new DesafiosManager();
  }
  return desafiosManager;
}

function getDb() {
  if (!db) {
    db = getAdminDb();
  }
  return db;
}

// Interfaces para tipagem correta
interface Objetivo {
  meta: number;
  unidade: string;
  descricao?: string;
}

interface Recompensas {
  pontosBase: number;
  badgeEspecial?: string;
  multiplicadorBonus: number;
}

interface ProgressoUsuario {
  progresso?: number;
  metaAtingida?: boolean;
  ultimaAtualizacao?: Date | null;
  [key: string]: unknown;
}

interface DesafioData {
  id: string;
  nome?: string;
  descricao?: string;
  mes?: number;
  semana?: number;
  icone?: string;
  cor?: string;
  tipo?: string;
  objetivo?: Objetivo;
  recompensas?: Recompensas;
  dataInicio?: Date | null;
  dataFim?: Date | null;
  created?: Date | null;
  ativo?: boolean;
  participantes?: string[];
  ranking?: unknown[];
  totalParticipantes?: number;
  meuProgresso?: ProgressoUsuario; 
  [key: string]: unknown;
}

// GET - Listar desafios ativos
export async function GET(request: NextRequest) {
  try {
    const database = getDb();
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');
    const semana = searchParams.get('semana');
    const tipo = searchParams.get('tipo');
    const userId = searchParams.get('userId');

    let desafiosQuery = database.collection('desafios')
      .where('ativo', '==', true)
      .orderBy('dataInicio', 'desc');

    // Filtros opcionais
    if (mes) {
      desafiosQuery = desafiosQuery.where('mes', '==', parseInt(mes));
    }
    
    if (semana) {
      desafiosQuery = desafiosQuery.where('semana', '==', parseInt(semana));
    }
    
    if (tipo) {
      desafiosQuery = desafiosQuery.where('tipo', '==', tipo);
    }

    const snapshot = await desafiosQuery.get();
    const desafios: DesafioData[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const desafio: DesafioData = { 
        id: docSnap.id,
        ...data,
        dataInicio: data.dataInicio?.toDate?.() || data.dataInicio || null,
        dataFim: data.dataFim?.toDate?.() || data.dataFim || null,
        created: data.created?.toDate?.() || data.created || null,
      };

      // Se userId fornecido, buscar progresso do usuário
      if (userId) {
        try {
          const progressoDoc = await database
            .collection('progressos-desafios')
            .doc(`${docSnap.id}_${userId}`)
            .get();
          
          if (progressoDoc.exists) {
            const progressoData = progressoDoc.data();
            desafio.meuProgresso = { 
              ...progressoData,
              ultimaAtualizacao: progressoData?.ultimaAtualizacao?.toDate?.() || progressoData?.ultimaAtualizacao || null,
            };
          }
        } catch (error) {
          console.error('❌ Erro ao buscar progresso:', error);
        }
      }

      desafios.push(desafio);
    }

    return NextResponse.json({
      success: true,
      data: desafios,
      total: desafios.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar desafios:', error);
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

// POST - Criar novo desafio (admin only)
export async function POST(request: NextRequest) {
  try {
    const database = getDb();
    const body = await request.json();
    
    // Validações básicas
    const { nome, descricao, mes, semana, tipo, objetivo, recompensas } = body;
    
    if (!nome || !descricao || !mes || !semana || !tipo || !objetivo || !recompensas) {
      return NextResponse.json(
        { error: 'Campos obrigatórios em falta' },
        { status: 400 }
      );
    }

    // Gerar ID único
    const desafioId = `desafio_${mes}_${semana}_${Date.now()}`;
    
    // Calcular datas da semana
    const now = new Date();
    const dataInicio = new Date(now.getFullYear(), mes - 1, (semana - 1) * 7 + 1);
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataFim.getDate() + 6);

    const novoDesafio = {
      id: desafioId,
      nome,
      descricao,
      mes: parseInt(mes),
      semana: parseInt(semana),
      icone: body.icone || '🎯',
      cor: body.cor || '#3B82F6',
      tipo,
      objetivo: {
        meta: parseFloat(objetivo.meta),
        unidade: objetivo.unidade,
        descricao: objetivo.descricao
      },
      recompensas: {
        pontosBase: parseInt(recompensas.pontosBase),
        badgeEspecial: recompensas.badgeEspecial || '',
        multiplicadorBonus: parseFloat(recompensas.multiplicadorBonus) || 1.0
      },
      dataInicio: Timestamp.fromDate(dataInicio),
      dataFim: Timestamp.fromDate(dataFim),
      ativo: true,
      participantes: [],
      ranking: [],
      totalParticipantes: 0,
      created: Timestamp.fromDate(now)
    };

    // Salvar no Firestore
    await database.collection('desafios').doc(desafioId).set(novoDesafio);

    return NextResponse.json({
      success: true,
      data: {
        ...novoDesafio,
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
        created: now.toISOString()
      },
      message: 'Desafio criado com sucesso!'
    });

  } catch (error) {
    console.error('❌ Erro ao criar desafio:', error);
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