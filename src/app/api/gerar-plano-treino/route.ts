import { NextResponse } from "next/server";
import { z } from "zod";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

// Schema específico para treino
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

const PlanoTreinoDiaSchema = z.union([
  z.object({
    treino: TreinoObjetoSchema,
    descanso: z.literal(false).optional()
  }),
  z.object({
    descanso: z.literal(true)
  })
]);

const PlanoTreinoSchema = z.object({
  semana: z.record(z.string().min(1, "Chave do dia da semana não pode ser vazia."), PlanoTreinoDiaSchema),
});

// 🔥 FUNÇÃO COM FALLBACK AUTOMÁTICO
async function gerarPlanoComFallback(prompt: string): Promise<string> {
  const modelos = [
    { nome: "llama-3.3-70b-versatile", descricao: "Principal" },
    { nome: "llama-3.1-8b-instant", descricao: "Backup" }
  ];

  for (const modelo of modelos) {
    try {
      console.log(`🤖 Tentando com ${modelo.nome} (${modelo.descricao})...`);
      
      const response = await groq.chat.completions.create({
        model: modelo.nome,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 5000,
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error("Resposta vazia da IA");
      }

      console.log(`✅ ${modelo.nome} respondeu com sucesso`);
      return content;

    } catch (error) {
      console.error(`❌ ${modelo.nome} falhou:`, error);
      
      // Se for o último modelo, propaga o erro
      if (modelo === modelos[modelos.length - 1]) {
        throw error;
      }
      
      console.log(`🔄 Tentando próximo modelo...`);
    }
  }

  throw new Error("Todos os modelos falharam");
}

export async function POST(req: Request) {
  console.log("🏋️ IA Personal Trainer - Iniciando...");

  try {
    const { userData, diasTreino, metaCalorica } = await req.json();

    // 🎯 PROMPT ESPECIALIZADO MANTENDO TODA ESPECIFICIDADE
    const prompt = `Você é um PERSONAL TRAINER ESPECIALIZADO com 15 anos de experiência.

PERFIL DO CLIENTE:
Nome: ${userData.name}
Objetivo: ${userData.goal}
Experiência: ${userData.experience_level}
Idade: ${userData.idade || 'Não informada'} anos
Gênero: ${userData.gender}
Biotipo: ${userData.biotype}
Frequência: ${diasTreino} dias/semana
Meta Calórica: ${metaCalorica} kcal/dia

ANÁLISE TÉCNICA PARA ${userData.experience_level.toUpperCase()}:
${userData.experience_level === 'iniciante_absoluto' ? 
  'FOCO: Técnica correta, exercícios básicos, adaptação neuromuscular. INTENSIDADE: Baixa-Moderada. DESCANSO: 60-90s. EXERCÍCIOS: Máquinas e pesos livres básicos.' :
userData.experience_level === 'iniciante' ?
  'FOCO: Progressão de carga, execução precisa. INTENSIDADE: Moderada. DESCANSO: 60-90s. EXERCÍCIOS: Compostos fundamentais.' :
userData.experience_level === 'intermediario' ?
  'FOCO: Volume e intensidade balanceados. INTENSIDADE: Moderada-Alta. DESCANSO: 45-90s. EXERCÍCIOS: Compostos + isolados.' :
  'FOCO: Intensidade máxima, técnicas avançadas. INTENSIDADE: Alta. DESCANSO: 30-60s. EXERCÍCIOS: Avançados e variações.'
}

ESTRUTURA SEMANAL ${diasTreino} DIAS (SEGUNDA A SEXTA):
${gerarEstruturaSemanal(diasTreino, userData.goal, userData.experience_level)}

PARÂMETROS PARA ${userData.goal.toUpperCase()}:
${userData.goal === 'hipertrofia' ? 
  'Volume: 3-4 séries. Repetições: 8-12. Progressão: Aumentar carga semanalmente. Foco: Músculos alvo com múltiplos exercícios.' :
userData.goal === 'emagrecimento' ?
  'Volume: 3-4 séries. Repetições: 12-15. Descanso: Curto (30-60s). Foco: Manter massa muscular em déficit.' :
userData.goal === 'força' ?
  'Volume: 3-5 séries. Repetições: 4-6. Descanso: Longo (2-3min). Foco: Exercícios compostos pesados.' :
  'Volume: 3-4 séries. Repetições: 10-15. Descanso: 45-90s. Foco: Resistência muscular.'
}

EXERCÍCIOS ADEQUADOS PARA ${userData.experience_level.toUpperCase()}:
${gerarExerciciosPorNivel(userData.experience_level)}

REGRAS OBRIGATÓRIAS:
1. Gerar APENAS dias úteis (monday, tuesday, wednesday, thursday, friday)
2. Ajuste complexidade para ${userData.experience_level}
3. Exercícios REALISTAS, SEGUROS e disponíveis em academias brasileiras
4. Progressão adequada ao nível de experiência
5. Descanso entre séries apropriado ao objetivo
6. Se ${diasTreino} < 5 dias, preencher dias restantes com "descanso": true
7. Nomes de exercícios em PORTUGUÊS do Brasil
8. Duração estimada REALISTA (30-60 minutos por treino)

FORMATO JSON OBRIGATÓRIO (retorne APENAS o JSON, sem texto adicional):

{
  "semana": {
    "monday": {
      "treino": {
        "tipo": "Peito/Tríceps",
        "grupoMuscular": ["Peito", "Tríceps"],
        "exercicios": [
          {
            "nome": "Supino Reto com Barra",
            "series": 3,
            "repeticoes": "10-12",
            "descanso": "60s",
            "observacoes": "Execução controlada, pegada na largura dos ombros"
          },
          {
            "nome": "Supino Inclinado com Halteres",
            "series": 3,
            "repeticoes": "10-12",
            "descanso": "60s"
          },
          {
            "nome": "Crucifixo na Polia",
            "series": 3,
            "repeticoes": "12-15",
            "descanso": "45s"
          },
          {
            "nome": "Tríceps Testa",
            "series": 3,
            "repeticoes": "12-15",
            "descanso": "45s"
          },
          {
            "nome": "Tríceps Corda",
            "series": 3,
            "repeticoes": "12-15",
            "descanso": "45s"
          }
        ],
        "duracaoEstimada": 50,
        "intensidade": "Moderada"
      }
    },
    "tuesday": {
      "descanso": true
    },
    "wednesday": {
      "treino": {
        "tipo": "Costas/Bíceps",
        "grupoMuscular": ["Costas", "Bíceps"],
        "exercicios": [
          {
            "nome": "Barra Fixa",
            "series": 3,
            "repeticoes": "8-10",
            "descanso": "90s",
            "observacoes": "Use auxílio se necessário"
          },
          {
            "nome": "Remada Curvada",
            "series": 4,
            "repeticoes": "10-12",
            "descanso": "60s"
          },
          {
            "nome": "Rosca Direta",
            "series": 3,
            "repeticoes": "10-12",
            "descanso": "60s"
          }
        ],
        "duracaoEstimada": 55,
        "intensidade": "Moderada"
      }
    },
    "thursday": {
      "treino": {
        "tipo": "Pernas",
        "grupoMuscular": ["Quadríceps", "Posteriores", "Glúteos"],
        "exercicios": [
          {
            "nome": "Agachamento Livre",
            "series": 4,
            "repeticoes": "8-12",
            "descanso": "90s",
            "observacoes": "Profundidade até paralelo"
          }
        ],
        "duracaoEstimada": 60,
        "intensidade": "Alta"
      }
    },
    "friday": {
      "treino": {
        "tipo": "Ombros/Abdômen",
        "grupoMuscular": ["Ombros", "Abdômen"],
        "exercicios": [
          {
            "nome": "Desenvolvimento com Barra",
            "series": 4,
            "repeticoes": "8-12",
            "descanso": "60s"
          }
        ],
        "duracaoEstimada": 45,
        "intensidade": "Moderada"
      }
    }
  }
}

GERE O PLANO COMPLETO SEGUINDO EXATAMENTE ESTE FORMATO PARA OS 5 DIAS ÚTEIS.`;

    console.log("📤 Enviando requisição com sistema de fallback...");

    // 🔥 USAR FUNÇÃO COM FALLBACK
    const content = await gerarPlanoComFallback(prompt);

    console.log("📝 Resposta recebida (primeiros 300 chars):", content.substring(0, 300));

    // Limpar e validar JSON
    const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
    const jsonStart = cleanContent.indexOf('{');
    const jsonEnd = cleanContent.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error("Nenhum JSON encontrado na resposta");
    }
    
    const jsonContent = cleanContent.slice(jsonStart, jsonEnd);
    console.log("🔍 JSON extraído (primeiros 400 chars):", jsonContent.substring(0, 400));
    
    const planoValidado = PlanoTreinoSchema.parse(JSON.parse(jsonContent));

    console.log("✅ IA Treino - Plano gerado com sucesso");
    return NextResponse.json({ success: true, planoTreino: planoValidado });

  } catch (error) {
    console.error("❌ Erro IA Treino:", error);
    return NextResponse.json({ 
      error: "Falha ao gerar plano de treino",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    }, { status: 500 });
  }
}

//eslint-disable-next-line
function gerarEstruturaSemanal(diasTreino: number, objetivo: string, experiencia: string) {
  const estruturas = {
    hipertrofia: {
      2: ["Full Body A (Seg)", "Full Body B (Qua)"],
      3: ["Superior (Seg)", "Inferior (Qua)", "Superior (Sex)"],
      4: ["Peito/Tríceps (Seg)", "Costas/Bíceps (Ter)", "Pernas (Qui)", "Ombros/Abdômen (Sex)"],
      5: ["Peito (Seg)", "Costas (Ter)", "Pernas (Qua)", "Ombros (Qui)", "Braços (Sex)"]
    },
    forca: {
      2: ["Full Body A (Seg)", "Full Body B (Qui)"],
      3: ["Supino (Seg)", "Agachamento (Qua)", "Terra (Sex)"],
      4: ["Supino (Seg)", "Agachamento (Ter)", "Terra (Qui)", "Acessórios (Sex)"],
      5: ["Supino (Seg)", "Agachamento (Ter)", "Terra (Qua)", "Push (Qui)", "Pull (Sex)"]
    },
    emagrecimento: {
      2: ["Full Body A (Seg)", "Full Body B (Qui)"],
      3: ["Full Body A (Seg)", "Full Body B (Qua)", "Cardio (Sex)"],
      4: ["Superior A (Seg)", "Inferior A (Ter)", "Superior B (Qui)", "Cardio (Sex)"],
      5: ["Full Body A (Seg)", "Full Body B (Ter)", "Cardio (Qua)", "Full Body C (Qui)", "Cardio (Sex)"]
    }
  };

  const estruturaObjetivo = estruturas[objetivo as keyof typeof estruturas] as any; //eslint-disable-line
  const estrutura = estruturaObjetivo?.[diasTreino] || ["Full Body"];
  
  return estrutura.map((dia: string) => `${dia}`).join('\n');
}

function gerarExerciciosPorNivel(experiencia: string) {
  const exercicios = {
    iniciante_absoluto: [
      "Máquinas: Leg Press, Peck Deck, Polias",
      "Básicos: Agachamento com peso corporal, Flexões de joelhos",
      "Foco: Aprendizado da técnica"
    ],
    iniciante: [
      "Compostos: Agachamento com barra, Supino, Remada",
      "Máquinas: Para complementar",
      "Foco: Execução precisa"
    ],
    intermediario: [
      "Compostos: Agachamento, Supino, Terra, Desenvolvimento",
      "Isolados: Rosca, Tríceps, Elevações",
      "Foco: Volume e intensidade"
    ],
    avancado: [
      "Compostos pesados + técnicas: Drop sets, Rest-pause",
      "Variações: Supino inclinado, Agachamento frontal",
      "Foco: Intensidade máxima"
    ]
  };

  return exercicios[experiencia as keyof typeof exercicios]?.join('. ') || "Exercícios básicos";
}