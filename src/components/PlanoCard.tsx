'use client';

import { motion } from 'framer-motion';//eslint-disable-next-line
import { Calendar, Utensils, Dumbbell, Clock, User, Target, ArrowRight, Flame, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';

interface DiaTreino {
  treino: boolean;
  descanso: boolean;
}

interface PlanoCardProps {
  plano: {
    id: string;
    nomeUsuario: string;
    metadata: {
      criadoEm: Timestamp | Date;
      tmb: number;
      dadosUsuario?: {
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
  };
  className?: string;
}

export function PlanoCard({ plano, className = '' }: PlanoCardProps) {
  const router = useRouter();

  const formatarData = (data: Timestamp | Date): string => {
    try {
      let date: Date;
      if (data instanceof Timestamp) {
        date = data.toDate();
      } else if (data instanceof Date) {
        date = data;
      } else {
        return 'Data não disponível';
      }

      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Data não disponível';
    }
  };

  const dataFormatada = formatarData(plano.metadata.criadoEm);

  const diasDeTreino = Object.values(plano.planoTreino.semana).filter(dia => dia.treino).length;
  const diasDeDescanso = Object.values(plano.planoTreino.semana).filter(dia => dia.descanso).length;

  const getNivelColor = (nivel?: string) => {
    if (!nivel) return 'text-gray-300';
    const nivelLower = nivel.toLowerCase();
    if (nivelLower.includes('iniciante')) return 'text-green-400';
    if (nivelLower.includes('intermediario') || nivelLower.includes('intermediário')) return 'text-yellow-400';
    if (nivelLower.includes('avancado') || nivelLower.includes('avançado')) return 'text-orange-400';
    return 'text-gray-300';
  };
//eslint-disable-next-line
  const getNivelBg = (nivel?: string) => {
    if (!nivel) return 'bg-white/10 border-white/20';
    const nivelLower = nivel.toLowerCase();
    if (nivelLower.includes('iniciante')) return 'bg-green-500/20 border-green-500/30';
    if (nivelLower.includes('intermediario') || nivelLower.includes('intermediário')) return 'bg-yellow-500/20 border-yellow-500/30';
    if (nivelLower.includes('avancado') || nivelLower.includes('avançado')) return 'bg-orange-500/20 border-orange-500/30';
    return 'bg-white/10 border-white/20';
  };

  const handleClick = () => {
    router.push(`/dashboard/plano/${plano.id}`);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-2xl overflow-hidden backdrop-blur-md hover:border-green-500 transition-all duration-300 cursor-pointer group ${className}`}
    >
      {/* Header do Card */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-green-500/30 p-2 rounded-lg">
              <User className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white line-clamp-1">
                {plano.nomeUsuario || 'Usuário'}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-300 font-bold">{dataFormatada}</p>
              </div>
            </div>
          </div>

          <motion.div
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <ArrowRight className="w-5 h-5 text-green-400" />
          </motion.div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-5 space-y-3">
        {/* Meta Calórica */}
        <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="bg-green-500/30 p-2 rounded-lg">
            <Flame className="w-4 h-4 text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-300 font-bold">Meta Calórica</p>
            <p className="text-sm sm:text-base font-black text-white">
              {plano.planoNutricional.metaCalorica} kcal
            </p>
          </div>
        </div>

        {/* Nível e Duração */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="bg-green-500/30 p-2 rounded-lg">
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-300 font-bold">Nível</p>
              <p className={`text-xs sm:text-sm font-black ${getNivelColor(plano.planoTreino.nivel)} capitalize`}>
                {plano.planoTreino.nivel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="bg-green-500/30 p-2 rounded-lg">
              <Clock className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-300 font-bold">Duração</p>
              <p className="text-xs sm:text-sm font-black text-white">
                {plano.planoTreino.duracao} sem
              </p>
            </div>
          </div>
        </div>

        {/* Frequência Semanal */}
        <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="bg-green-500/30 p-2 rounded-lg">
            <Dumbbell className="w-4 h-4 text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-300 font-bold">Frequência Semanal</p>
            <p className="text-xs sm:text-sm font-black text-white">
              {diasDeTreino} treinos • {diasDeDescanso} descansos
            </p>
          </div>
        </div>

        {/* Dados do Usuário */}
        {plano.metadata.dadosUsuario && (
          <div className="pt-3 border-t border-white/10 space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs font-bold text-gray-300">Informações:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                <p className="text-gray-300 font-bold mb-0.5">Objetivo</p>
                <p className="text-white font-black capitalize line-clamp-1">
                  {plano.metadata.dadosUsuario.objetivo}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                <p className="text-gray-300 font-bold mb-0.5">Biotipo</p>
                <p className="text-white font-black capitalize line-clamp-1">
                  {plano.metadata.dadosUsuario.biotipo}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                <p className="text-gray-300 font-bold mb-0.5">Peso</p>
                <p className="text-white font-black">{plano.metadata.dadosUsuario.peso}kg</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                <p className="text-gray-300 font-bold mb-0.5">Altura</p>
                <p className="text-white font-black">{plano.metadata.dadosUsuario.altura}cm</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Botão */}
      <div className="p-5 pt-0">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/dashboard/plano/${plano.id}`);
          }}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg text-sm"
        >
          <span>Ver Plano Completo</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}