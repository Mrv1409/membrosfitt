                          // eslint-disable-next-line
import React, { useState, useEffect } from 'react';
import { Trophy, Award, Star, Crown, Flame, Target, Users, Camera, Clock, Moon } from 'lucide-react';


interface Badge {
  id: string;
  nome: string;
  raridade: 'comum' | 'raro' | 'epico' | 'lendario';
  icone: string;
  conquistadaEm: Date;
}

interface Conquista {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  pontosBbonus: number;
  desbloqueadaEm: Date;
  categoria: 'consistencia' | 'volume' | 'social' | 'especial';
}


const mockBadges: Badge[] = [
  { id: '1', nome: 'Primeira Chama', raridade: 'comum', icone: 'flame', conquistadaEm: new Date() },
  { id: '2', nome: 'Uma Semana Firme', raridade: 'raro', icone: 'target', conquistadaEm: new Date() },
  { id: '3', nome: 'Mês de Ferro', raridade: 'epico', icone: 'trophy', conquistadaEm: new Date() }
];

const mockConquistas: Conquista[] = [
  { id: '1', nome: 'Primeira Chama', descricao: 'Complete seu primeiro treino', icone: 'flame', pontosBbonus: 50, desbloqueadaEm: new Date(), categoria: 'consistencia' },
  { id: '2', nome: 'Nutri Master', descricao: '30 dias registrando alimentação', icone: 'star', pontosBbonus: 200, desbloqueadaEm: new Date(), categoria: 'especial' }
];

const BadgesConquistas = () => {
  const [activeTab, setActiveTab] = useState<'badges' | 'conquistas'>('badges');
  const [badges] = useState<Badge[]>(mockBadges);
  const [conquistas] = useState<Conquista[]>(mockConquistas);

  
  const iconMap = {
    flame: Flame, trophy: Trophy, target: Target, star: Star, 
    crown: Crown, award: Award, users: Users, camera: Camera, 
    clock: Clock, moon: Moon
  };


  const raridadeColors = {
    comum: 'from-gray-400 to-gray-600',
    raro: 'from-blue-400 to-blue-600', 
    epico: 'from-purple-400 to-purple-600',
    lendario: 'from-yellow-400 to-yellow-600'
  };

  
  const categoriaColors = {
    consistencia: 'from-green-400 to-green-600',
    volume: 'from-red-400 to-red-600',
    social: 'from-blue-400 to-blue-600', 
    especial: 'from-purple-400 to-purple-600'
  };

  const BadgeCard = ({ badge }: { badge: Badge }) => {
    const IconComponent = iconMap[badge.icone as keyof typeof iconMap] || Trophy;
    const gradientClass = raridadeColors[badge.raridade];
    
    return (
      <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center mx-auto mb-3`}>
          <IconComponent className="w-8 h-8 text-white" />
        </div>
        <h3 className="font-bold text-gray-800 text-center text-sm">{badge.nome}</h3>
        <p className="text-xs text-gray-500 text-center mt-1 capitalize">{badge.raridade}</p>
        <p className="text-xs text-gray-400 text-center mt-1">
          {badge.conquistadaEm.toLocaleDateString('pt-BR')}
        </p>
      </div>
    );
  };

  const ConquistaCard = ({ conquista }: { conquista: Conquista }) => {
    const IconComponent = iconMap[conquista.icone as keyof typeof iconMap] || Award;
    const gradientClass = categoriaColors[conquista.categoria];
    
    return (
      <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
            <IconComponent className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 text-sm">{conquista.nome}</h3>
            <p className="text-xs text-gray-600 mt-1">{conquista.descricao}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                +{conquista.pontosBbonus} pts
              </span>
              <span className="text-xs text-gray-400">
                {conquista.desbloqueadaEm.toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🏆 Conquistas</h1>
        <p className="text-gray-600">Sua jornada épica de transformação</p>
      </div>


      <div className="flex bg-white rounded-xl p-1 mb-6 shadow-md">
        <button
          onClick={() => setActiveTab('badges')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'badges' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'text-gray-600 hover:text-blue-500'
          }`}
        >
          🏅 Badges ({badges.length})
        </button>
        <button
          onClick={() => setActiveTab('conquistas')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'conquistas' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'text-gray-600 hover:text-blue-500'
          }`}
        >
          🎯 Conquistas ({conquistas.length})
        </button>
      </div>

      
      {activeTab === 'badges' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {conquistas.map((conquista) => (
            <ConquistaCard key={conquista.id} conquista={conquista} />
          ))}
        </div>
      )}

      
      <div className="mt-8 bg-white rounded-xl p-6 shadow-md">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-500">{badges.length}</div>
            <div className="text-sm text-gray-600">Badges</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">{conquistas.length}</div>
            <div className="text-sm text-gray-600">Conquistas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-500">
              {conquistas.reduce((acc, c) => acc + c.pontosBbonus, 0)}
            </div>
            <div className="text-sm text-gray-600">Pontos Bônus</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-500">Elite</div>
            <div className="text-sm text-gray-600">Nível Atual</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BadgesConquistas;