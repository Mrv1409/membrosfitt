export interface PlanoUsuario {
  id: string;
  metadata: {
    criadoEm: Date;
    tmb: number;
    dadosUsuario: {
      peso: number;
      altura: number;
      objetivo: string;
      biotipo: string;
    };
  };
  planoNutricional: {
    metaCalorica: number;
  };
  planoTreino: {
    nivel: string;
    duracao: number;
    semana: Record<string, DiaTreino>;
  };
  nomeUsuario: string;
}

interface DiaTreino {
  treino: boolean;
  descanso: boolean;
  // Adicione outras propriedades específicas do dia de treino aqui
}
