import { Desafio, ProgressoDesafio } from '@/lib/gamification/desafios';
import { UserGamification } from '@/lib/gamification/engine';
import React, { useState, useEffect } from 'react';

interface DesafioCardProps {
  desafio: Desafio;
  userGamification: UserGamification;
  progressoUsuario?: ProgressoDesafio;
  onParticipar: (desafioId: string) => Promise<void>;
  onSair: (desafioId: string) => Promise<void>;
  onVerRanking: (desafioId: string) => void;
  loading?: boolean;
}

const DesafioCard: React.FC<DesafioCardProps> = ({
  desafio,
  userGamification,
  progressoUsuario,
  onParticipar,
  onSair,
  onVerRanking,
  loading = false
}) => {
  const [isParticipando, setIsParticipando] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setIsParticipando(userGamification.desafiosParticipando.includes(desafio.id));
  }, [userGamification.desafiosParticipando, desafio.id]);

  const handleParticipar = async () => {
    setActionLoading(true);
    try {
      if (isParticipando) {
        await onSair(desafio.id);
      } else {
        await onParticipar(desafio.id);
      }
    } catch (error) {
      console.error('Erro ao alterar participação:', error);
    } finally {
      setActionLoading(false);
    }
  };

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

  const getProgressoPercentual = () => {
    if (!progressoUsuario) return 0;
    return Math.min((progressoUsuario.progresso / desafio.objetivo.meta) * 100, 100);
  };

  const getDiasRestantes = () => {
    const hoje = new Date();
    const fim = new Date(desafio.dataFim);
    const diffTime = fim.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const formatarData = (data: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    }).format(new Date(data));
  };

  const progressoPercentual = getProgressoPercentual();
  const diasRestantes = getDiasRestantes();

  return (
    <div className={`relative overflow-hidden rounded-2xl ${desafio.cor} p-[1px] shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}>
      {/* Card Principal */}
      <div className="bg-gray-900 rounded-2xl p-6 h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`text-3xl p-3 rounded-xl bg-gradient-to-r ${getCorTipo(desafio.tipo)}`}>
              {desafio.icone}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{desafio.nome}</h3>
              <p className="text-gray-400 text-sm capitalize">{desafio.tipo}</p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            diasRestantes > 0 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {diasRestantes > 0 ? `${diasRestantes} dias` : 'Finalizado'}
          </div>
        </div>

        {/* Descrição */}
        <p className="text-gray-300 text-sm mb-4 leading-relaxed">
          {desafio.descricao}
        </p>

        {/* Objetivo */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Meta</span>
            <span className="text-white font-semibold">
              {desafio.objetivo.meta} {desafio.objetivo.unidade}
            </span>
          </div>
          <p className="text-gray-300 text-xs">
            {desafio.objetivo.descricao}
          </p>
        </div>

        {/* Progresso (se participando) */}
        {isParticipando && progressoUsuario && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Seu Progresso</span>
              <span className="text-white font-semibold">
                {progressoUsuario.progresso}/{desafio.objetivo.meta}
              </span>
            </div>
            
            {/* Barra de Progresso */}
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full bg-gradient-to-r ${getCorTipo(desafio.tipo)} transition-all duration-500`}
                style={{ width: `${progressoPercentual}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">{progressoPercentual.toFixed(1)}% completo</span>
              {progressoUsuario.metaAtingida && (
                <span className="text-green-400 font-medium">✅ Meta atingida!</span>
              )}
            </div>
          </div>
        )}

        {/* Recompensas */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-400 text-sm font-medium">🏆 Recompensas</span>
            <span className="text-white font-bold">+{desafio.recompensas.pontosBase} pts</span>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-gray-300">
            <span>Badge: {desafio.recompensas.badgeEspecial}</span>
            <span>Bônus: {desafio.recompensas.multiplicadorBonus}x</span>
          </div>
        </div>

        {/* Participantes e Data */}
        <div className="flex items-center justify-between mb-4 text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span>👥 {desafio.totalParticipantes} participantes</span>
            <span>📅 {formatarData(desafio.dataInicio)} - {formatarData(desafio.dataFim)}</span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex space-x-3">
          {desafio.ativo && diasRestantes > 0 && (
            <button
              onClick={handleParticipar}
              disabled={actionLoading || loading}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                isParticipando
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                  : `bg-gradient-to-r ${getCorTipo(desafio.tipo)} text-white hover:shadow-lg hover:scale-105`
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {actionLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                </div>
              ) : (
                isParticipando ? 'Sair do Desafio' : 'Participar'
              )}
            </button>
          )}
          
          <button
            onClick={() => onVerRanking(desafio.id)}
            className="px-4 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors font-medium"
          >
            📊 Ranking
          </button>
        </div>

        {/* Streak Atual (se participando) */}
        {isParticipando && progressoUsuario && progressoUsuario.streakAtual > 0 && (
          <div className="mt-4 flex items-center justify-center space-x-2 bg-orange-500/10 rounded-xl py-2">
            <span className="text-orange-400">🔥</span>
            <span className="text-orange-400 font-medium text-sm">
              {progressoUsuario.streakAtual} dias consecutivos
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesafioCard;