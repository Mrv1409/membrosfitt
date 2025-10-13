import { Desafio, ProgressoDesafio } from '@/lib/gamification/desafios';
import { UserGamification } from '@/lib/gamification/engine';
import DesafioCard from '@/components/gamification/DesafioCard';
import RankingDesafio from '@/components/gamification/RankingDesafio';
import { useState } from 'react';

interface ListaDesafiosProps {
  desafios: Desafio[];
  userGamification: UserGamification;
  progressosUsuario: ProgressoDesafio[];
  onParticipar: (desafioId: string) => Promise<void>;
  onSair: (desafioId: string) => Promise<void>;
  loading?: boolean;
}

const ListaDesafios: React.FC<ListaDesafiosProps> = ({
  desafios,
  userGamification,
  progressosUsuario,
  onParticipar,
  onSair,
  loading = false
}) => {
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('ativos');
  const [rankingDesafio, setRankingDesafio] = useState<Desafio | null>(null);

  const tiposDesafio = [
    { value: 'todos', label: 'Todos', icone: '🎯' },
    { value: 'cardio', label: 'Cardio', icone: '❤️' },
    { value: 'forca', label: 'Força', icone: '💪' },
    { value: 'consistencia', label: 'Consistência', icone: '🔥' },
    { value: 'nutricao', label: 'Nutrição', icone: '🥗' },
    { value: 'especial', label: 'Especial', icone: '⭐' }
  ];

  const statusOptions = [
    { value: 'ativos', label: 'Ativos' },
    { value: 'participando', label: 'Participando' },
    { value: 'finalizados', label: 'Finalizados' }
  ];

  const desafiosFiltrados = desafios.filter(desafio => {
    // Filtro por tipo
    if (filtroTipo !== 'todos' && desafio.tipo !== filtroTipo) return false;
    
    // Filtro por status
    const hoje = new Date();
    const fim = new Date(desafio.dataFim);
    const isAtivo = desafio.ativo && fim > hoje;
    const isParticipando = userGamification.desafiosParticipando.includes(desafio.id);
    
    switch (filtroStatus) {
      case 'ativos':
        return isAtivo;
      case 'participando':
        return isParticipando;
      case 'finalizados':
        return !isAtivo;
      default:
        return true;
    }
  });

  const getProgressoUsuario = (desafioId: string) => {
    return progressosUsuario.find(p => p.desafioId === desafioId);
  };

  const handleVerRanking = (desafioId: string) => {
    const desafio = desafios.find(d => d.id === desafioId);
    if (desafio) {
      setRankingDesafio(desafio);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Desafios</h2>
          <p className="text-gray-400">Participe e ganhe pontos extras!</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400">
            {desafiosFiltrados.length}
          </div>
          <div className="text-xs text-gray-400">disponíveis</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="space-y-4">
        {/* Filtro por Tipo */}
        <div>
          <h3 className="text-white font-medium mb-2">Tipo de Desafio</h3>
          <div className="flex flex-wrap gap-2">
            {tiposDesafio.map(tipo => (
              <button
                key={tipo.value}
                onClick={() => setFiltroTipo(tipo.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filtroTipo === tipo.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {tipo.icone} {tipo.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro por Status */}
        <div>
          <h3 className="text-white font-medium mb-2">Status</h3>
          <div className="flex gap-2">
            {statusOptions.map(status => (
              <button
                key={status.value}
                onClick={() => setFiltroStatus(status.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filtroStatus === status.value
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2" />
          <p className="text-gray-400">Carregando desafios...</p>
        </div>
      )}

      {/* Lista de Desafios */}
      {!loading && (
        <>
          {desafiosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhum desafio encontrado
              </h3>
              <p className="text-gray-400">
                {filtroStatus === 'participando' 
                  ? 'Você ainda não está participando de nenhum desafio'
                  : 'Tente alterar os filtros ou aguarde novos desafios'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {desafiosFiltrados.map(desafio => (
                <DesafioCard
                  key={desafio.id}
                  desafio={desafio}
                  userGamification={userGamification}
                  progressoUsuario={getProgressoUsuario(desafio.id)}
                  onParticipar={onParticipar}
                  onSair={onSair}
                  onVerRanking={handleVerRanking}
                  loading={loading}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal Ranking */}
      {rankingDesafio && (
        <RankingDesafio
          desafio={rankingDesafio}
          isOpen={true}
          onClose={() => setRankingDesafio(null)}
          userIdAtual={userGamification.userId}
        />
      )}
    </div>
  );
};

export default ListaDesafios;