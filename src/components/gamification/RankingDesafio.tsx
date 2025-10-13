import React from 'react';
import { Desafio } from '../../lib/gamification/desafios';

interface RankingDesafioProps {
  desafio: Desafio;
  isOpen: boolean;
  onClose: () => void;
  userIdAtual?: string;
}

const RankingDesafio: React.FC<RankingDesafioProps> = ({
  desafio,
  isOpen,
  onClose,
  userIdAtual
}) => {
  if (!isOpen) return null;

  const getPosicaoIcon = (posicao: number) => {
    const icons = { 1: '🥇', 2: '🥈', 3: '🥉' };
    return icons[posicao as keyof typeof icons] || `#${posicao}`;
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${getCorTipo(desafio.tipo)} p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{desafio.icone}</span>
              <div>
                <h3 className="text-white font-bold">{desafio.nome}</h3>
                <p className="text-white/80 text-sm">Ranking</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Lista Ranking */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {desafio.ranking.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <span className="text-4xl mb-2 block">👥</span>
              <p>Nenhum participante ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {desafio.ranking.map((participante) => (
                <div
                  key={participante.userId}
                  className={`flex items-center space-x-3 p-3 rounded-xl transition-colors ${
                    participante.userId === userIdAtual
                      ? 'bg-blue-500/20 border border-blue-500/30'
                      : 'bg-gray-800/50 hover:bg-gray-800'
                  }`}
                >
                  {/* Posição */}
                  <div className="text-2xl w-8 text-center">
                    {getPosicaoIcon(participante.posicao)}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center text-white font-semibold">
                    {participante.userAvatar || participante.userName.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium truncate">
                        {participante.userName}
                        {participante.userId === userIdAtual && (
                          <span className="text-blue-400 text-xs ml-1">(Você)</span>
                        )}
                      </p>
                      <span className="text-yellow-400 font-bold text-sm">
                        {participante.pontuacao}pts
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-1 bg-gray-700 rounded-full">
                          <div 
                            className={`h-1 rounded-full bg-gradient-to-r ${getCorTipo(desafio.tipo)}`}
                            style={{ width: `${(participante.progresso / desafio.objetivo.meta) * 100}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-xs">
                          {participante.progresso}/{desafio.objetivo.meta}
                        </span>
                      </div>
                      
                      {participante.metaAtingida && (
                        <span className="text-green-400 text-xs">✅</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>👥 {desafio.totalParticipantes} participantes</span>
            <span>🏆 Meta: {desafio.objetivo.meta} {desafio.objetivo.unidade}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingDesafio;