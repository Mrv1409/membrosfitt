import React from 'react';

// ================================================
// 🎯 TIPOS ATUALIZADOS (compatíveis com o hook)
// ================================================

interface DesafioAtivo {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
  tipo: string;
  objetivo: {
    meta: number;
    unidade: string;
    descricao: string;
  };
  dataInicio: Date;
  dataFim: Date;
  totalParticipantes: number;
  userParticipando: boolean;
}

interface ProgressoDesafio {
  desafioId: string;
  userId: string;
  progresso: number;
  metaAtingida: boolean;
  pontuacaoAtual: number;
  streakAtual: number;
  ultimaAtualizacao: Date;
}

interface ProgressoDesafioCardProps {
  desafio: DesafioAtivo;
  progressoUsuario: ProgressoDesafio;
  onClick?: () => void;
}

// ================================================
// 🎮 COMPONENTE ATUALIZADO
// ================================================

const ProgressoDesafioCard: React.FC<ProgressoDesafioCardProps> = ({
  desafio,
  progressoUsuario,
  onClick
}) => {
  const getCorTipo = (tipo: string) => {
    const cores = {
      cardio: 'from-red-500 to-pink-500',
      forca: 'from-orange-500 to-red-500',
      consistencia: 'from-green-500 to-emerald-500',
      nutricao: 'from-blue-500 to-cyan-500',
      especial: 'from-purple-500 to-pink-500'
    };
    return cores[tipo as keyof typeof cores] || 'from-gray-500 to-gray-600';
  };

  // ✅ AJUSTE: Progresso já vem em % do hook
  const progressoPercentual = Math.min(progressoUsuario.progresso, 100);

  const getDiasRestantes = () => {
    const hoje = new Date();
    const fim = new Date(desafio.dataFim);
    const diffTime = fim.getTime() - hoje.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const diasRestantes = getDiasRestantes();

  // ✅ NOVO: Calcular progresso atual baseado na meta
  const progressoAtual = Math.round((progressoPercentual / 100) * desafio.objetivo.meta);

  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl bg-gray-900 p-4 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg ${onClick ? 'hover:bg-gray-800' : ''}`}
    >
      {/* Header Compacto */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div 
            className="text-lg p-2 rounded-lg"
            style={{ backgroundColor: desafio.cor || '#6B7280' }}
          >
            {desafio.icone}
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm">{desafio.nome}</h4>
            <p className="text-gray-400 text-xs">{diasRestantes}d restantes</p>
          </div>
        </div>
        
        {/* Status Badge */}
        {progressoUsuario.metaAtingida && (
          <div className="text-green-400 text-lg">✅</div>
        )}
      </div>

      {/* Progresso */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-gray-400 text-xs">Progresso</span>
          <span className="text-white text-xs font-medium">
            {progressoAtual}/{desafio.objetivo.meta} {desafio.objetivo.unidade}
          </span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full bg-gradient-to-r ${getCorTipo(desafio.tipo)} transition-all duration-500`}
            style={{ width: `${progressoPercentual}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">{progressoPercentual.toFixed(0)}%</span>
        
        {/* Streak */}
        {progressoUsuario.streakAtual > 0 && (
          <div className="flex items-center space-x-1 text-orange-400">
            <span>🔥</span>
            <span>{progressoUsuario.streakAtual}</span>
          </div>
        )}
        
        {/* ✅ AJUSTE: Usar pontuação atual do progresso */}
        <span className="text-green-400 font-medium">
          {progressoUsuario.pontuacaoAtual}pts
        </span>
      </div>
    </div>
  );
};

export default ProgressoDesafioCard;
