// eslint-disable-next-line
import React, { useState, useEffect } from 'react';
import { Gift, Users, Trophy, Zap, Share2, Copy, Check } from 'lucide-react';

interface Protocol {
  id: number;
  name: string;
  points: number;
  description: string;
  unlocked: boolean;
}

const MonetizationPage = () => {
  // Estados simulados (conectar com Firebase depois)
  const [user, setUser] = useState({
    name: 'Marvin Costa',
    points: 2500,
    monthlyWorkouts: 7,
    referralCode: 'MARVIN123',
    referredBy: null,
    freeMonthEarned: false,
    plan: 'premium'
  });
 
  const [copied, setCopied] = useState(false); // eslint-disable-next-line
  const [selectedProtocol, setSelectedProtocol] = useState(null); 

  // Protocolos disponíveis para troca
  const protocols = [
    { id: 1, name: 'Hipertrofia Básica', points: 1000, description: 'Protocolo completo para ganho de massa', unlocked: false },
    { id: 2, name: 'Cutting Master', points: 2500, description: 'Definição muscular avançada', unlocked: false },
    { id: 3, name: 'Beast Mode', points: 5000, description: 'Treino extremo para avançados', unlocked: false },
    { id: 4, name: 'Home Workout Pro', points: 1500, description: 'Treinos eficientes em casa', unlocked: false }
  ];

  
  const progressToFreeMonth = Math.min((user.monthlyWorkouts / 10) * 100, 100);
  const workoutsNeeded = Math.max(10 - user.monthlyWorkouts, 0);
  
  
  const canEarnFreeMonth = user.referredBy && user.monthlyWorkouts >= 10 && !user.freeMonthEarned;

  
  const copyReferralCode = () => {
    navigator.clipboard.writeText(`Use meu código no MembrosFit: ${user.referralCode} e ganhe benefícios!`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  
  const exchangeProtocol = (protocol: Protocol) => {
    if (!protocol || typeof protocol !== 'object') {
      console.error('Protocolo inválido');
      return;
    }

    if (user.points >= protocol.points) {
      try {
        // Aqui conectar com Firebase
        setUser(prev => ({ 
          ...prev, 
          points: prev.points - protocol.points,
          lastExchange: new Date().toISOString()
        }));
        alert(`Protocolo "${protocol.name}" desbloqueado com sucesso!`);
      } catch (error) {
        console.error('Erro ao processar troca:', error);
        alert('Ocorreu um erro ao processar a troca. Tente novamente mais tarde.');
      }
    } else {
      alert('Pontos insuficientes para esta troca.');
    }
  };

  
  const claimFreeMonth = () => {
    if (canEarnFreeMonth) {
      setUser(prev => ({ ...prev, freeMonthEarned: true }));
      alert('Parabéns! Seu próximo mês será GRÁTIS! 🎉');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        
    
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">💰 Centro de Recompensas</h1>
          <p className="text-gray-300">Troque seus pontos por benefícios incríveis!</p>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Meus Pontos</p>
                <p className="text-3xl font-bold">{user.points?.toLocaleString() ?? '0'}</p>
              </div>
              <Trophy className="w-12 h-12 text-yellow-200" />
            </div>
          </div>

          
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-green-100 text-sm">Progresso Mês Grátis</p>
                <p className="text-2xl font-bold">{user.monthlyWorkouts}/10</p>
              </div>
              <Gift className="w-12 h-12 text-green-200" />
            </div>
            <div className="w-full bg-green-300 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressToFreeMonth}%` }}
              ></div>
            </div>
            {workoutsNeeded > 0 && (
              <p className="text-green-100 text-xs mt-2">Faltam {workoutsNeeded} treinos!</p>
            )}
          </div>

          
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Seu Código</p>
                <p className="text-2xl font-bold">{user.referralCode}</p>
              </div>
              <Users className="w-12 h-12 text-purple-200" />
            </div>
          </div>
        </div>

        
        {canEarnFreeMonth && (
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 mb-8 border-2 border-green-400 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">🎉 PARABÉNS!</h3>
                <p className="text-green-100">Você conquistou um mês GRÁTIS! Clique para ativar.</p>
              </div>
              <button 
                onClick={claimFreeMonth}
                className="bg-white text-green-600 px-6 py-3 rounded-lg font-bold hover:bg-green-50 transition-colors"
              >
                Resgatar Agora!
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Share2 className="w-8 h-8 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Convide Amigos</h2>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <p className="text-gray-300 text-sm mb-2">Como funciona:</p>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Compartilhe seu código único</li>
                <li>• Amigo se cadastra usando seu código</li>
                <li>• Complete 10 treinos no mês = <span className="text-green-400 font-bold">MÊS GRÁTIS!</span></li>
              </ul>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 bg-gray-700 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Seu código de convite:</p>
                <p className="text-white font-mono text-lg">{user.referralCode}</p>
              </div>
              <button
                onClick={copyReferralCode}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="text-white text-sm">{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-8 h-8 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Protocolos Premium</h2>
            </div>

            <div className="space-y-4">
              {protocols.map((protocol) => (
                <div 
                  key={protocol.id}
                  className={`bg-gray-700 rounded-lg p-4 border-2 transition-all ${
                    user.points >= protocol.points 
                      ? 'border-green-500 hover:border-green-400' 
                      : 'border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-white font-bold text-lg">{protocol.name}</h3>
                      <p className="text-gray-400 text-sm">{protocol.description}</p>
                    </div>
                    <div className="text-right">
                    <p className="text-yellow-400 font-bold">{protocol.points?.toLocaleString() ?? '0'}</p>
                      <p className="text-gray-400 text-xs">pontos</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => exchangeProtocol(protocol)}
                    disabled={user.points < protocol.points}
                    className={`w-full py-2 px-4 rounded-lg font-bold transition-colors ${
                      user.points >= protocol.points
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {user.points >= protocol.points ? 'Desbloquear' : 'Pontos Insuficientes'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        
        {workoutsNeeded > 0 && user.referredBy && (
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4">
            <div className="text-center text-white">
              <p className="text-lg font-bold mb-1">🔥 Continue Treinando!</p>
              <p className="text-blue-100">
                Você já convidou um amigo! Faltam apenas {workoutsNeeded} treinos para ganhar seu mês GRÁTIS!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonetizationPage;