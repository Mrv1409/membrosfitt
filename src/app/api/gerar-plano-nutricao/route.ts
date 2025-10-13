import { NextResponse } from "next/server";
import { z } from "zod";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

// Schema específico para nutrição (CORRIGIDO)
const ItemRefeicaoSchema = z.object({
  alimento: z.string().min(1, "Nome do alimento é obrigatório."),
  quantidade: z.string().min(1, "Quantidade do alimento é obrigatória."),
  calorias: z.number().min(0, "Calorias devem ser um número positivo ou zero."),
});

const MacrosSchema = z.object({
  proteinas: z.number().min(0),
  carboidratos: z.number().min(0),
  gorduras: z.number().min(0),
  calorias: z.number().min(0),
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

const PlanoNutricaoSchema = z.object({
  metaCalorica: z.number().positive("Meta calórica deve ser um número positivo."),
  semana: z.record(z.string().min(1, "Chave do dia da semana não pode ser vazia."), PlanoNutricionalDiaSchema),
});

// 🛠️ FUNÇÃO AVANÇADA PARA LIMPAR E CORRIGIR JSON MALFORMADO
function limparJSON(jsonString: string): string {
  let cleaned = jsonString
    .replace(/```json\s*|\s*```/g, '') // Remove marcadores de código
    .replace(/,(\s*[}\]])/g, '$1') // Remove vírgulas antes de } ou ]
    .replace(/([}\]])(\s*)([{[])/g, '$1,$2$3') // Adiciona vírgulas entre objetos/arrays
    .trim();

  // 🔥 CORREÇÃO DE ASPAS FALTANTES (problema comum do Llama)
  // Padrão: "chave": valor sem aspas (deve ser "chave": "valor")
  cleaned = cleaned.replace(
    /("(?:alimento|quantidade|tipo|horario|descanso|observacoes)":\s*)([^",{\[\s][^,}\]]*?)(\s*[,}\]])/g,
    '$1"$2"$3'
  );

  // Encontrar início do JSON
  const start = cleaned.indexOf('{');
  if (start === -1) {
    throw new Error("Nenhum JSON válido encontrado na resposta");
  }

  // Tentar encontrar o fim do JSON
  let end = cleaned.lastIndexOf('}');
  
  // Se não encontrou ou tá incompleto, tentar "fechar" o JSON
  if (end === -1 || end < start) {
    console.warn("⚠️ JSON incompleto detectado, tentando fechar...");
    
    // Contar chaves abertas vs fechadas
    let openBraces = 0;
    let closeBraces = 0;
    
    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === '{') openBraces++;
      if (cleaned[i] === '}') closeBraces++;
    }
    
    // Adicionar chaves faltantes
    const missingBraces = openBraces - closeBraces;
    if (missingBraces > 0) {
      cleaned += '}'.repeat(missingBraces);
      console.log(`✅ Adicionadas ${missingBraces} chaves de fechamento`);
    }
    
    end = cleaned.lastIndexOf('}') + 1;
  } else {
    end = end + 1;
  }
  
  if (end === 0) {
    throw new Error("Não foi possível corrigir o JSON");
  }

  return cleaned.slice(start, end);
}

export async function POST(req: Request) {
  console.log("🍎 IA Nutricionista - Iniciando...");

  try {
    const { userData, metaCalorica } = await req.json();

    // Calcular macros específicos baseados no objetivo e biotipo
    const pesoKg = userData.weight;
    let proteinasAlvo, carboidratosAlvo, gordurasAlvo;

    // Ajuste de macros por objetivo
    if (userData.goal === 'hipertrofia') {
      proteinasAlvo = Math.round(pesoKg * 2.2);
      carboidratosAlvo = Math.round(pesoKg * 5);
      gordurasAlvo = Math.round(pesoKg * 1.0);
    } else if (userData.goal === 'emagrecimento') {
      proteinasAlvo = Math.round(pesoKg * 2.4);
      carboidratosAlvo = Math.round(pesoKg * 2.5);
      gordurasAlvo = Math.round(pesoKg * 0.8);
    } else if (userData.goal === 'força') {
      proteinasAlvo = Math.round(pesoKg * 2.0);
      carboidratosAlvo = Math.round(pesoKg * 4.5);
      gordurasAlvo = Math.round(pesoKg * 1.2);
    } else {
      proteinasAlvo = Math.round(pesoKg * 1.8);
      carboidratosAlvo = Math.round(pesoKg * 3.5);
      gordurasAlvo = Math.round(pesoKg * 1.0);
    }

    // 🎯 PROMPT QUALIFICADO E PERSONALIZADO
    const prompt = `Você é um NUTRICIONISTA ESPORTIVO brasileiro especializado em nutrição personalizada.

PERFIL DO CLIENTE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Nome: ${userData.name}
⚖️ Peso atual: ${userData.weight}kg | Meta: ${userData.weight_goal}kg
📏 Altura: ${userData.height}cm
🎯 OBJETIVO PRINCIPAL: ${userData.goal.toUpperCase()}
🧬 Biotipo: ${userData.biotype}
🏃 Nível de atividade: ${userData.activity_level}
💪 Treinos por semana: ${userData.weekly_activities}x
${userData.dietary_restrictions.length > 0 ? `🚫 RESTRIÇÕES ALIMENTARES: ${userData.dietary_restrictions.join(', ')}` : '✅ Sem restrições alimentares'}

PRESCRIÇÃO NUTRICIONAL CALCULADA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Meta Calórica: ${metaCalorica} kcal/dia
🥩 Proteínas: ${proteinasAlvo}g/dia (${Math.round(proteinasAlvo/pesoKg * 10)/10}g/kg)
🍚 Carboidratos: ${carboidratosAlvo}g/dia (${Math.round(carboidratosAlvo/pesoKg * 10)/10}g/kg)
🥑 Gorduras: ${gordurasAlvo}g/dia (${Math.round(gordurasAlvo/pesoKg * 10)/10}g/kg)

ESTRATÉGIA PARA ${userData.goal.toUpperCase()}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${userData.goal === 'hipertrofia' ? 
`• SUPERÁVIT CALÓRICO moderado para construir massa
• Proteína ALTA distribuída em todas as refeições
• Carboidratos ALTOS para energia e anabolismo
• Timing: Proteína + Carbo PRÉ e PÓS treino
• Foco: Recuperação muscular e crescimento` :
userData.goal === 'emagrecimento' ?
`• DÉFICIT CALÓRICO controlado preservando músculo
• Proteína MUITO ALTA para saciedade e preservação muscular
• Carboidratos MODERADOS focados em horários estratégicos
• Gorduras controladas mas essenciais
• Foco: Perda de gordura mantendo massa magra` :
userData.goal === 'força' ?
`• Calorias adequadas para performance máxima
• Proteína ALTA para recuperação
• Carboidratos ALTOS para energia em treinos pesados
• Timing: Carbo antes de treinos intensos
• Foco: Combustível para força explosiva` :
`• Manutenção calórica e composição corporal
• Macros balanceados
• Foco: Saúde e performance sustentável`}

BIOTIPO ${userData.biotype.toUpperCase()} - CONSIDERAÇÕES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${userData.biotype === 'ectomorfo' ? 
`• Metabolismo ACELERADO - precisa alta densidade calórica
• PRIORIZE: Alimentos calóricos, shakes, smoothies, oleaginosas
• CARBOIDRATOS: Não tenha medo, são seus aliados
• DICA: Adicione azeite, pasta de amendoim, granola` :
userData.biotype === 'mesomorfo' ?
`• Metabolismo BALANCEADO - responde bem a dietas estruturadas
• PRIORIZE: Variedade, alimentos integrais, equilíbrio
• FLEXIBILIDADE: Pode alternar macros conforme necessidade
• DICA: Aproveite a versatilidade do seu corpo` :
`• Metabolismo LENTO - precisa controle de calorias e carbo
• PRIORIZE: Vegetais volumosos, proteínas magras, fibras
• CARBOIDRATOS: Estratégicos, integrais, pré-treino
• DICA: Refeições volumosas com baixa densidade calórica`}

${userData.dietary_restrictions.length > 0 ? `
ADAPTAÇÕES PARA RESTRIÇÕES (${userData.dietary_restrictions.join(', ')}):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${gerarSubstituicoesPorRestricao(userData.dietary_restrictions)}
` : ''}

DIRETRIZES CRÍTICAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ALIMENTOS ACESSÍVEIS: Supermercados brasileiros comuns (não importados caros)
✅ VARIEDADE OBRIGATÓRIA: CADA DIA DEVE TER COMBINAÇÕES DIFERENTES
✅ REALISMO: Comida de verdade que brasileiros comem (arroz, feijão, frango, ovos, frutas locais)
✅ CÁLCULOS PRECISOS: Macros e calorias devem bater com os totais diários
✅ ${userData.meals_day} REFEIÇÕES/DIA distribuídas equilibradamente

ALIMENTOS PROIBIDOS/SUBSTITUIR:
${userData.dietary_restrictions.length > 0 ? 
`❌ ${userData.dietary_restrictions.map((r: string) => r.toUpperCase()).join(', ')}` : 
'✅ Sem restrições'}

EXEMPLOS DE ALIMENTOS ACESSÍVEIS NO BRASIL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🥩 Proteínas: Frango (peito/coxa), ovos, atum enlatado, carne moída, tilápia, sardinha, iogurte grego
🍚 Carboidratos: Arroz (branco/integral), batata doce/inglesa, macarrão integral, aveia, pão integral, tapioca, frutas locais
🥑 Gorduras: Azeite de oliva, abacate, pasta de amendoim, castanhas do Pará, ovo inteiro
🥗 Vegetais: Brócolis, couve, tomate, alface, cenoura, abobrinha, chuchu

ESTRUTURA ${userData.meals_day} REFEIÇÕES:
${gerarEstruturaRefeicoes(userData.meals_day)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RETORNE APENAS O JSON VÁLIDO (sem texto adicional):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "metaCalorica": ${metaCalorica},
  "semana": {
    "monday": {
      "refeicoes": [
        {
          "tipo": "Café da manhã",
          "horario": "07:00",
          "itens": [
            { "alimento": "Ovos mexidos", "quantidade": "3 unidades", "calorias": 210 },
            { "alimento": "Pão integral", "quantidade": "2 fatias", "calorias": 140 },
            { "alimento": "Abacate", "quantidade": "1/4 unidade", "calorias": 80 }
          ],
          "macros": { "proteinas": 24, "carboidratos": 28, "gorduras": 18, "calorias": 430 }
        }
      ],
      "totalDiario": { 
        "proteinas": ${proteinasAlvo}, 
        "carboidratos": ${carboidratosAlvo}, 
        "gorduras": ${gordurasAlvo}, 
        "calorias": ${metaCalorica} 
      }
    },
    "tuesday": { "refeicoes": [...], "totalDiario": {...} },
    "wednesday": { "refeicoes": [...], "totalDiario": {...} },
    "thursday": { "refeicoes": [...], "totalDiario": {...} },
    "friday": { "refeicoes": [...], "totalDiario": {...} }
  }
}

IMPORTANTE: Gere APENAS os 5 dias úteis (monday a friday). Não inclua saturday e sunday.
GERE O PLANO COMPLETO PARA OS 5 DIAS COM VARIEDADE E CRIATIVIDADE.`;

    console.log("📤 Enviando requisição para Llama 3.3 70B...");

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 5000,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    console.log("📝 Resposta recebida (primeiros 300 chars):", content.substring(0, 300));

    // 🧹 LIMPAR E VALIDAR JSON COM CORREÇÕES AUTOMÁTICAS
    let jsonContent: string;
    try {
      jsonContent = limparJSON(content);
      console.log("✅ JSON limpo e corrigido (primeiros 400 chars):", jsonContent.substring(0, 400));
      
      // 🔍 VALIDAÇÃO EXTRA: Verificar se tem aspas balanceadas
      const aspasCount = (jsonContent.match(/"/g) || []).length;
      if (aspasCount % 2 !== 0) {
        console.warn(`⚠️ Número ímpar de aspas detectado: ${aspasCount}`);
      }
      
    } catch (cleanError) {
      console.error("❌ Erro ao limpar JSON:", cleanError);
      throw new Error("Não foi possível extrair JSON válido da resposta");
    }

    // 🔍 PARSEAR E VALIDAR COM TRATAMENTO ROBUSTO
    let planoValidado;
    try {
      const planoParsed = JSON.parse(jsonContent);
      planoValidado = PlanoNutricaoSchema.parse(planoParsed);
      console.log("✅ Plano validado com sucesso!");
    } catch (parseError) {
      console.error("❌ Erro ao parsear/validar JSON:", parseError);
      
      // Log detalhado do erro
      if (parseError instanceof SyntaxError) {
        const errorPos = parseError.message.match(/position (\d+)/)?.[1];
        if (errorPos) {
          const pos = parseInt(errorPos);
          const context = jsonContent.substring(Math.max(0, pos - 100), Math.min(jsonContent.length, pos + 100));
          console.error(`📍 Contexto do erro (pos ${pos}):`, context);
        }
        console.error("📄 JSON completo (últimos 500 chars):", jsonContent.substring(jsonContent.length - 500));
        throw new Error(`JSON malformado: ${parseError.message}`);
      }
      throw parseError;
    }

    console.log("✅ IA Nutrição - Plano gerado com sucesso");
    return NextResponse.json({ success: true, planoNutricao: planoValidado });

  } catch (error) {
    console.error("❌ Erro IA Nutrição:", error);
    return NextResponse.json({ 
      error: "Falha ao gerar plano nutricional",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    }, { status: 500 });
  }
}

function gerarEstruturaRefeicoes(mealsDay: number) {
  const estruturas = {
    3: ["☀️ Café da manhã (07:00)", "🌞 Almoço (12:00)", "🌙 Jantar (19:00)"],
    4: ["☀️ Café da manhã (07:00)", "🌞 Almoço (12:00)", "🍎 Lanche da tarde (16:00)", "🌙 Jantar (19:00)"],
    5: ["☀️ Café da manhã (07:00)", "🥤 Lanche da manhã (10:00)", "🌞 Almoço (13:00)", "🍎 Lanche da tarde (16:00)", "🌙 Jantar (19:00)"],
    6: ["☀️ Café da manhã (07:00)", "🥤 Lanche da manhã (10:00)", "🌞 Almoço (12:30)", "🍎 Lanche da tarde (15:30)", "🌙 Jantar (18:30)", "🌜 Ceia (21:00)"]
  };

  return estruturas[mealsDay as keyof typeof estruturas]?.map(refeicao => refeicao).join('\n') || "3 refeições básicas";
}

function gerarSubstituicoesPorRestricao(restricoes: string[]): string {
  const substituicoes: Record<string, string> = {
    'glúten': '→ Arroz, batata, tapioca, mandioca, quinoa, polvilho, macarrão de arroz',
    'lactose': '→ Leite de soja/amêndoa/coco, iogurte vegetal, queijo vegano, creme de leite de coco',
    'frutos-do-mar': '→ Frango, carne bovina, porco, ovos, leguminosas (feijão, lentilha, grão de bico)',
    'vegetariano': '→ Ovos, laticínios, leguminosas, tofu, queijos, iogurtes',
    'vegano': '→ Leguminosas, tofu, tempeh, seitan, leites vegetais, proteína de soja texturizada (PTS)',
    'diabético': '→ Carboidratos integrais, baixo índice glicêmico, fibras, evitar açúcar refinado',
    'hipertensão': '→ Low-sodium, ervas frescas, especiarias, limão, alho, evitar sal refinado',
    'oleaginosas': '→ Sementes (chia, linhaça, girassol), abacate, azeite de oliva',
    'soja': '→ Ervilha proteica, lentilha, grão de bico, feijão, quinoa'
  };

  return restricoes.map(r => {
    const restricaoLower = r.toLowerCase();
    return substituicoes[restricaoLower] || `→ Consulte nutricionista para ${r}`;
  }).join('\n');
}