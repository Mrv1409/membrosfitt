import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuth } from "firebase-admin/auth";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";

import { UserProfile } from "@/types/profile";

// Inicialização Firebase Admin
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      }),
    });
    console.log("✅ Firebase Admin inicializado com sucesso");
  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase Admin:", error);
  }
}

const db = getFirestore();

// --- SCHEMAS ZOD (MANTIDOS) ---

const ItemRefeicaoSchema = z.object({
  alimento: z.string().min(1, "Nome do alimento é obrigatório."),
  quantidade: z.string().min(1, "Quantidade do alimento é obrigatória."),
  calorias: z.number().int().min(0, "Calorias devem ser um número positivo ou zero."),
});

const MacrosSchema = z.object({
  proteinas: z.number().int().min(0),
  carboidratos: z.number().int().min(0),
  gorduras: z.number().int().min(0),
  calorias: z.number().int().min(0),
});

const RefeicaoSchema = z.object({
  tipo: z.string().min(1, "Tipo da refeição é obrigatório."),
  horario: z.string().min(1, "Horário da refeição é obrigatório."),
  itens: z.array(ItemRefeicaoSchema).min(1, "Deve haver pelo menos um item na refeição."),
  macros: MacrosSchema,
});

const PlanoNutricionalDiaSchema = z.object({
  refeicoes: z.array(RefeicaoSchema).min(1, "Deve haver pelo menos uma refeição no dia."),
  totalDiario: MacrosSchema,
});

const ExerciciosTreinoSchema = z.object({
  nome: z.string().min(1, "Nome do exercício é obrigatório."),
  series: z.number().int().positive("Séries deve ser um número positivo."),
  repeticoes: z.string().min(1, "Repetições é obrigatória."),
  descanso: z.string().min(1, "Descanso é obrigatório."),
  observacoes: z.string().optional(),
});

const TreinoObjetoSchema = z.object({
  tipo: z.string().min(1, "Tipo de treino é obrigatório."),
  grupoMuscular: z.array(z.string().min(1, "Grupo muscular não pode ser vazio.")).min(1, "Deve haver pelo menos um grupo muscular."),
  exercicios: z.array(ExerciciosTreinoSchema).min(1, "Deve haver pelo menos um exercício."),
  duracaoEstimada: z.number().int().positive("Duração estimada deve ser um número positivo."),
  intensidade: z.string().min(1, "Intensidade é obrigatória."),
});

const DiaDeDescansoSchema = z.object({
  descanso: z.literal(true, {
    errorMap: () => ({ message: "O dia de descanso deve ter 'descanso: true'." })
  }),
});

const PlanoTreinoDiaSchema = z.union([
  z.object({
    treino: TreinoObjetoSchema,
    descanso: z.literal(false).optional()
  }),
  DiaDeDescansoSchema
]);

const PlanoSchema = z.object({
  planoNutricional: z.object({
    metaCalorica: z.number().int().positive("Meta calórica deve ser um número positivo."),
    semana: z.record(z.string().min(1, "Chave do dia da semana não pode ser vazia."), PlanoNutricionalDiaSchema),
  }),
  planoTreino: z.object({
    semana: z.record(z.string().min(1, "Chave do dia da semana não pode ser vazia."), PlanoTreinoDiaSchema),
  }),
  observacoes: z.object({
    nutricao: z.array(z.string()),
    treino: z.array(z.string()),
    geral: z.array(z.string()),
  }),
});

type PlanoGerado = z.infer<typeof PlanoSchema>;

// --- FUNÇÃO PARA CONVERTER VALORES (MANTIDA) ---
function converterValor(valor: unknown): number {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string') {
    const num = parseFloat(valor);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

export async function POST(req: Request) {
  console.log("🚀 Iniciando geração de plano com especialistas...");

  try {
    // Verificação de variáveis de ambiente
    const envVars = {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
      GROQ_API_KEY: process.env.GROQ_API_KEY
    };

    const missingVars = Object.entries(envVars)//eslint-disable-next-line
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.error("❌ Variáveis de ambiente ausentes:", missingVars);
      return NextResponse.json({ 
        error: `Variáveis de ambiente ausentes: ${missingVars.join(', ')}` 
      }, { status: 500 });
    }

    // Verificação de autenticação
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split("Bearer ")[1];

    if (!token) {
      console.error("❌ Token ausente");
      return NextResponse.json({ error: "Token de autenticação ausente" }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = await getAuth().verifyIdToken(token);
      userId = decoded.uid;
      console.log("✅ Token válido para usuário:", userId);
    } catch (err: unknown) {
      console.error("❌ Erro na verificação do token:", err);
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Verificação do usuário
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      console.error("❌ Usuário não encontrado");
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const userData = userDoc.data();
    if (userData && typeof userData.completedProfile === 'boolean' && !userData.completedProfile) {
      console.error("❌ Perfil incompleto");
      return NextResponse.json({
        error: "Perfil incompleto. Complete o onboarding primeiro.",
        redirectTo: "/onboarding"
      }, { status: 400 });
    }

    // Buscar perfil detalhado
    const profileSnap = await db.collection("userProfile").doc(userId).get();
    const profileData = profileSnap.data();

    if (!profileData) {
      console.error("❌ Perfil detalhado não encontrado");
      return NextResponse.json({ error: "Perfil detalhado não encontrado" }, { status: 404 });
    }

    // Montar perfil completo com conversões seguras
    const profile: UserProfile = {
      userId: userId,
      name: userData?.name || profileData.userName || userData?.userName || 'Usuário',
      email: userData?.email || '',
      whatsapp: userData?.whatsapp || '',
      city: userData?.city || '',
      state: userData?.state || '',
      biotype: profileData.biotype || 'mesomorfo',
      goal: profileData.goal || 'hipertrofia',
      preferred_schedule: userData?.preferred_schedule || '',
      notifications_enable: typeof userData?.notifications_enable === 'boolean' ? userData.notifications_enable : true,
      gender: profileData.gender || 'Masculino',
      born: profileData.born || '1990-01-01',
      activity_level: profileData.activity_level || 'sedentary',
      weight: converterValor(profileData.weight) || 70,
      height: converterValor(profileData.height) || 170,
      weight_goal: converterValor(profileData.weight_goal) || 70,
      weekly_activities: Math.max(1, converterValor(profileData.weekly_activities) || 3),
      meals_day: Math.max(3, converterValor(profileData.meals_day) || 4),
      experience_level: profileData.experience_level || 'iniciante',
      dietary_restrictions: Array.isArray(profileData.dietary_restrictions) ? profileData.dietary_restrictions : [],
      level: typeof profileData.level === 'number' ? profileData.level : 1,
      createdAt: profileData.createdAt?.toDate ? profileData.createdAt.toDate() : profileData.createdAt,
      completedProfile: typeof userData?.completedProfile === 'boolean' ? userData.completedProfile : false,
      premium: typeof userData?.premium === 'boolean' ? userData.premium : false,
      role: userData?.role || 'user',
      measurements: undefined,
      photos: [],
    };

    // Validar dados essenciais
    if (!profile.name || !profile.gender || !profile.biotype || !profile.goal || !profile.born) {
      console.error("❌ Dados essenciais ausentes");
      return NextResponse.json({
        error: "Dados essenciais ausentes no perfil. Complete o onboarding.",
        redirectTo: "/onboarding"
      }, { status: 400 });
    }

    if (profile.weight <= 0 || profile.height <= 0) {
      console.error("❌ Peso ou altura inválidos");
      return NextResponse.json({
        error: "Peso ou altura inválidos. Verifique seus dados.",
        redirectTo: "/onboarding"
      }, { status: 400 });
    }

    // Calcular TMB e meta calórica
    const currentYear = new Date().getFullYear();
    const birthYear = new Date(profile.born).getFullYear();
    const idadeCalculada = Math.max(18, Math.min(80, currentYear - birthYear));

    const tmb = profile.gender === 'Masculino'
      ? 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * idadeCalculada)
      : 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * idadeCalculada);

    const metaCalorica = Math.round(tmb * 1.2);

    console.log("📊 Dados calculados:", {
      tmb: Math.round(tmb),
      metaCalorica,
      idade: idadeCalculada,
      peso: profile.weight,
      altura: profile.height
    });

    // 🚀 CHAMAR AMBAS IAS ESPECIALIZADAS EM PARALELO
    console.log("🎯 Iniciando geração paralela com especialistas...");

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const [resultadoTreino, resultadoNutricao] = await Promise.allSettled([
      // IA Personal Trainer (120B)
      fetch(`${baseUrl}/api/gerar-plano-treino`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          userData: profile,
          diasTreino: profile.weekly_activities,
          metaCalorica
        })
      }),
      
      // IA Nutricionista (20B)  
      fetch(`${baseUrl}/api/gerar-plano-nutricao`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          userData: profile,
          metaCalorica
        })
      })
    ]);

    // ✅ PROCESSAR RESULTADOS
    let planoTreino, planoNutricao;

// Processar IA Treino
if (resultadoTreino.status === 'fulfilled') {
  if (resultadoTreino.value.ok) {
    const data = await resultadoTreino.value.json();
    planoTreino = data.planoTreino;
    console.log("✅ IA Treino - Plano gerado com sucesso");
  } else {
    const errorText = await resultadoTreino.value.text();
    console.error("❌ IA Treino falhou - Status:", resultadoTreino.value.status, "Erro:", errorText);
    throw new Error("Falha na geração do plano de treino");
  }
} else {
  // resultadoTreino.status === 'rejected'
  console.error("❌ IA Treino falhou - Promise rejeitada:", resultadoTreino.reason);
  throw new Error("Falha na geração do plano de treino");
}

// Processar IA Nutrição
if (resultadoNutricao.status === 'fulfilled') {
  if (resultadoNutricao.value.ok) {
    const data = await resultadoNutricao.value.json();
    planoNutricao = data.planoNutricao;
    console.log("✅ IA Nutrição - Plano gerado com sucesso");
  } else {
    const errorText = await resultadoNutricao.value.text();
    console.error("❌ IA Nutrição falhou - Status:", resultadoNutricao.value.status, "Erro:", errorText);
    throw new Error("Falha na geração do plano nutricional");
  }

  } else {
  // resultadoNutricao.status === 'rejected'
  console.error("❌ IA Nutrição falhou - Promise rejeitada:", resultadoNutricao.reason);
  throw new Error("Falha na geração do plano nutricional");
  }

    // 🎯 MONTAR PLANO COMPLETO
    const planoCompleto: PlanoGerado = {
      planoNutricional: planoNutricao,
      planoTreino: planoTreino,
      observacoes: {
        nutricao: ["Plano gerado por IA Nutricionista especializada"],
        treino: ["Plano gerado por IA Personal Trainer especializado"], 
        geral: ["Planos criados por especialistas IA"]
      }
    };

    // ✅ VALIDAR PLANO COMPLETO
    try {
      PlanoSchema.parse(planoCompleto);
      console.log("✅ Plano completo validado com sucesso");
    } catch (schemaError: unknown) {
      console.error("❌ Erro na validação do plano completo:", schemaError);
      throw new Error("Plano gerado não atende aos requisitos de qualidade");
    }

    // 💾 SALVAR NO FIRESTORE
    console.log("💾 Salvando no Firestore...");
    const planoId = uuidv4();

    const dadosParaSalvar = {
      id: planoId,
      userId,
      nomeUsuario: profile.name,
      ...planoCompleto,
      metadata: {
        criadoEm: new Date(),
        tmb: Math.round(tmb),
        modelo: "ESPECIALISTAS_IA",
        provider: "groq-especializado",
        tentativas: 1,
        dadosUsuario: {
          peso: profile.weight,
          altura: profile.height,
          objetivo: profile.goal,
          biotipo: profile.biotype,
          genero: profile.gender,
          idade: idadeCalculada
        }
      }
    };

    try {
      const docRef = db.collection("users").doc(userId).collection("planos").doc(planoId);
      await docRef.set(dadosParaSalvar);

      console.log("✅ Plano salvo com sucesso!");

      // Resposta de sucesso
      return NextResponse.json({
        success: true,
        id: planoId,
        metaCalorica: metaCalorica,
        message: "Plano gerado com sucesso por especialistas IA!",
        modeloUsado: "ESPECIALISTAS_IA",
        tentativas: 1,
        redirectUrl: `/dashboard/plano/${planoId}`
      });

    } catch (firestoreError: unknown) {
      console.error("❌ Erro do Firestore:", firestoreError);
      throw new Error(`Erro ao salvar no Firestore: ${firestoreError instanceof Error ? firestoreError.message : String(firestoreError)}`);
    }

  } catch (err: unknown) {
    console.error("💥 Erro fatal:", err);

    let errorMessage = "Erro interno do servidor";
    if (err instanceof Error) {
      errorMessage = err.message;
    } else {
      errorMessage = String(err);
    }

    return NextResponse.json({
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}