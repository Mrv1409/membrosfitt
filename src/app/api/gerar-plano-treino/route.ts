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

export async function POST(req: Request) {
  console.log("🏋️ IA Personal Trainer - Iniciando...");

  try {
    const { userData, diasTreino, metaCalorica } = await req.json();

    // 🎯 PROMPT ESPECIALIZADO PARA 5 DIAS
    const prompt = `Você é um PERSONAL TRAINER ESPECIALIZADO com 15 anos de experiência.

CRIE UM PLANO DE TREINO PARA:
- NOME: ${userData.name}
- OBJETIVO: ${userData.goal}
- EXPERIÊNCIA: ${userData.experience_level}
- IDADE: ${userData.idade || 'Não informada'} anos
- GÊNERO: ${userData.gender}
- BIOTIPO: ${userData.biotype}
- FREQUÊNCIA: ${diasTreino} dias/semana
- META CALÓRICA: ${metaCalorica} kcal/dia

ANÁLISE TÉCNICA:
${userData.experience_level === 'iniciante_absoluto' ? 
  '• FOCO: Técnica correta, exercícios básicos, adaptação neuromuscular\n• INTENSIDADE: Baixa-Moderada\n• DESCANSO: 60-90 segundos\n• EXERCÍCIOS: Máquinas e pesos livres básicos' :
userData.experience_level === 'iniciante' ?
  '• FOCO: Progressão de carga, execução precisa\n• INTENSIDADE: Moderada\n• DESCANSO: 60-90 segundos\n• EXERCÍCIOS: Compostos fundamentais' :
userData.experience_level === 'intermediario' ?
  '• FOCO: Volume e intensidade balanceados\n• INTENSIDADE: Moderada-Alta\n• DESCANSO: 45-90 segundos\n• EXERCÍCIOS: Compostos + isolados' :
  '• FOCO: Intensidade máxima, técnicas avançadas\n• INTENSIDADE: Alta\n• DESCANSO: 30-60 segundos\n• EXERCÍCIOS: Avançados e variações'
}

ESTRUTURA PARA ${diasTreino} DIAS/SEMANA (SEGUNDA A SEXTA):
${gerarEstruturaSemanal(diasTreino, userData.goal, userData.experience_level)}

DIRETRIZES PARA ${userData.goal.toUpperCase()}:
${userData.goal === 'hipertrofia' ? 
  '• Volume: 3-4 séries por exercício\n• Repetições: 8-12\n• Progressão: Aumentar carga semanalmente\n• Foco: Músculos alvo com múltiplos exercícios' :
userData.goal === 'emagrecimento' ?
  '• Volume: 3-4 séries por exercício\n• Repetições: 12-15\n• Descanso: Curto (30-60s)\n• Foco: Manter massa muscular em déficit' :
userData.goal === 'força' ?
  '• Volume: 3-5 séries por exercício\n• Repetições: 4-6\n• Descanso: Longo (2-3min)\n• Foco: Exercícios compostos pesados' :
  '• Volume: 3-4 séries por exercício\n• Repetições: 10-15\n• Descanso: 45-90s\n• Foco: Resistência muscular'
}

EXERCÍCIOS ADEQUADOS PARA ${userData.experience_level.toUpperCase()}:
${gerarExerciciosPorNivel(userData.experience_level)}

IMPORTANTE:
- Gerar APENAS dias úteis (monday, tuesday, wednesday, thursday, friday)
- Ajuste complexidade para ${userData.experience_level}
- Exercícios REALISTAS e SEGUROS
- Progressão adequada ao nível
- Descanso entre séries apropriado
- Se ${diasTreino} < 5, use dias de descanso com "descanso": true

RETORNE APENAS JSON VÁLIDO seguindo este formato:

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
            "observacoes": "Execução controlada"
          },
          {
            "nome": "Supino Inclinado com Halteres",
            "series": 3,
            "repeticoes": "10-12",
            "descanso": "60s"
          },
          {
            "nome": "Tríceps Testa",
            "series": 3,
            "repeticoes": "12-15",
            "descanso": "45s"
          }
        ],
        "duracaoEstimada": 45,
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
            "descanso": "90s"
          }
        ],
        "duracaoEstimada": 50,
        "intensidade": "Moderada"
      }
    }
  }
}

GERE O PLANO COMPLETO PARA OS 5 DIAS ÚTEIS (monday a friday).`;

    console.log("📤 Enviando requisição para GPT-OSS 120B...");

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 5000,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

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
  
  return estrutura.map((dia: string) => `• ${dia}`).join('\n');
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

  return exercicios[experiencia as keyof typeof exercicios]?.join('\n') || "Exercícios básicos";
}