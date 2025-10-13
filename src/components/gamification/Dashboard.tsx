import React, { useState } from 'react';
import { Trophy, Target, Flame, TrendingUp, Award, Star, Crown, Calendar } from 'lucide-react';
import { useGamification } from '../../hooks/useGamification';

// ================================================
// 🎮 PROPS E TIPOS
// ================================================

interface DashboardGamificacaoProps {
  userId: string;
}

type Period = 'semana' | 'mes' | 'ano';

const DashboardGamificacao: React.FC<DashboardGamificacaoProps> = ({ userId }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('semana');
  
  // ✅ USANDO O NOVO HOOK
  const { dashboard, loading, error } = useGamification(userId);

  const PERIODS: Period[] = ['semana', 'mes', 'ano'];

  const niveisConfig = {
    'Iniciante': { color: 'from-gray-400 to-gray-600', icon: Target },
    'Intermediário': { color: 'from-blue-400 to-blue-600', icon: TrendingUp },
    'Avançado': { color: 'from-green-400 to-green-600', icon: Award },
    'Elite': { color: 'from-purple-400 to-purple-600', icon: Star },
    'Lenda': { color: 'from-yellow-400 to-yellow-600', icon: Crown },
    'Master': { color: 'from-red-400 to-red-600', icon: Flame }
  };

  // ✅ LOADING E ERROR STATES
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Erro ao carregar dados da gamificação: {error || 'Dados não encontrados'}
        </div>
      </div>
    );
  }

  // ✅ CONFIGURAÇÃO DO NÍVEL ATUAL
  const currentNivelConfig = niveisConfig[dashboard.nivel as keyof typeof niveisConfig] || niveisConfig['Iniciante'];
  const IconeNivel = currentNivelConfig.icon;

  // ✅ CÁLCULO DO PROGRESSO PARA PRÓXIMO NÍVEL
  const progressoNivel = dashboard.pontosParaProximoNivel > 0 
    ? ((dashboard.pontosTotais % 50000) / 50000) * 100 
    : 100;

  // ✅ COMPONENTES AUXILIARES
  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    color = 'blue' 
  }: { 
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>, 
    title: string, 
    value: string | number, 
    subtitle?: string, 
    color?: string 
  }) => (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const ProgressBar = ({ progress, color = 'blue' }: { progress: number, color?: string }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`bg-${color}-500 h-2 rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      
      {/* ✅ HEADER PRINCIPAL - DADOS REAIS */}
      <div className="bg-white rounded-2xl p-8 shadow-xl mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${currentNivelConfig.color} flex items-center justify-center`}>
              <IconeNivel className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{dashboard.nivel}</h1>
              <p className="text-gray-600">{dashboard.pontosTotais?.toLocaleString('pt-BR') ?? '0'} pontos</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Posição no Desafio</p>
            <p className="text-2xl font-bold text-blue-600">
              {dashboard.posicaoRanking > 0 ? `#${dashboard.posicaoRanking}` : '--'}
            </p>
          </div>
        </div>
        
        {/* ✅ BARRA DE PROGRESSO - DADOS REAIS */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Próximo: {dashboard.proximoNivel || 'Master'}
            </span>
            <span className="text-gray-600">
              {dashboard.pontosParaProximoNivel?.toLocaleString('pt-BR') ?? '0'} pts restantes
            </span>
          </div>
          <ProgressBar progress={progressoNivel} color="purple" />
        </div>
      </div>

      {/* ✅ CARDS DE ESTATÍSTICAS - DADOS REAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={Flame} 
          title="Streak Atual" 
          value={dashboard.streakAtual} 
          subtitle={`Melhor: ${dashboard.melhorStreak} dias`}
          color="orange"
        />
        <StatCard 
          icon={Trophy} 
          title="Badges" 
          value={dashboard.totalBadges} 
          subtitle="Conquistados"
          color="yellow"
        />
        <StatCard 
          icon={Award} 
          title="Conquistas" 
          value={dashboard.totalConquistas} 
          subtitle="Desbloqueadas"
          color="green"
        />
        <StatCard 
          icon={TrendingUp} 
          title="Pontos/Semana" 
          value={dashboard.pontosEstaSemana || 0} 
          subtitle="Esta semana"
          color="blue"
        />
      </div>

      {/* ✅ SEÇÃO DE CONQUISTAS E DESAFIO ATIVO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Conquistas Recentes */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Conquistas Recentes
          </h3>
          <div className="space-y-3">
            {dashboard.conquistasRecentes && dashboard.conquistasRecentes.length > 0 ? (
              dashboard.conquistasRecentes.slice(0, 3).map((conquista, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{conquista.id}</p>
                    <p className="text-xs text-gray-500">
                      {conquista.completed_at ? new Date(conquista.completed_at).toLocaleDateString('pt-BR') : 'Recente'}
                    </p>
                  </div>
                  <div className="text-yellow-600 font-bold">+{conquista.current_progress}</div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhuma conquista recente</p>
            )}
          </div>
        </div>

        {/* ✅ DESAFIO ATIVO */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Desafio Ativo
          </h3>
          
          {dashboard.desafioAtivo ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div 
                  className="text-2xl p-2 rounded-lg"
                  style={{ backgroundColor: dashboard.desafioAtivo.cor || '#6B7280' }}
                >
                  {dashboard.desafioAtivo.icone}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{dashboard.desafioAtivo.nome}</h4>
                  <p className="text-sm text-gray-600">{dashboard.desafioAtivo.descricao}</p>
                </div>
              </div>
              
              {dashboard.progressoDesafio && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progresso</span>
                    <span className="text-gray-800 font-medium">
                      {dashboard.progressoDesafio.progresso.toFixed(0)}%
                    </span>
                  </div>
                  <ProgressBar progress={dashboard.progressoDesafio.progresso} color="green" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Posição: #{dashboard.posicaoRanking || '--'}</span>
                    <span>{dashboard.progressoDesafio.pontuacaoAtual} pontos</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Nenhum desafio ativo</p>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Participar de Desafio
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ✅ GRÁFICO DE ATIVIDADE (mantido como mock por enquanto) */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-500" />
            Atividade dos Últimos 7 Dias
          </h3>
          <div className="flex gap-2">
            {PERIODS.map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-end justify-between gap-2 h-32">
          {[120, 85, 150, 200, 95, 180, 160].map((altura, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                style={{ height: `${(altura / 200) * 100}%` }}
              />
              <span className="text-xs text-gray-500">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardGamificacao;
