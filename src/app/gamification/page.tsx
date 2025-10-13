/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Flame, TrendingUp, Award, Clock, Zap, User, Activity } from 'lucide-react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import Image from 'next/image';

interface Conquista {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  pontosBbonus: number;
  desbloqueadaEm: Date;
  categoria: string;
}

interface HistoricoPonto {
  acao: string;
  pontos: number;
  multiplicador: number;
  timestamp: Date;
}

interface UserGamification {
  pontos: number;
  nivel: string;
  streakAtual: number;
  melhorStreak: number;
  conquistas: Conquista[];
  historicoPontos: HistoricoPonto[];
  protocolosDesbloqueados: string[];
}

const GamificationPage = () => {
  const [gamificationData, setGamificationData] = useState<UserGamification | null>(null);
  const [loading, setLoading] = useState(true);
  const [proximoNivel, setProximoNivel] = useState<string>('');
  const [pontosProximoNivel, setPontosProximoNivel] = useState<number>(0);
  const [progressoNivel, setProgressoNivel] = useState<number>(0);

  const niveis = {
    'Iniciante': { min: 0, max: 999, next: 1000 },
    'Intermediário': { min: 1000, max: 4999, next: 5000 },
    'Avançado': { min: 5000, max: 14999, next: 15000 },
    'Elite': { min: 15000, max: 49999, next: 50000 },
    'Lenda': { min: 50000, max: 99999, next: 100000 },
    'Master': { min: 100000, max: Infinity, next: Infinity }
  };

  useEffect(() => {
    fetchGamificationData();
  }, []);

  const fetchGamificationData = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        console.error('Usuário não autenticado');
        setLoading(false);
        return;
      }

      const db = getFirestore();
      const gamificationRef = doc(db, 'users', user.uid, 'gamification', 'data');
      const gamificationSnap = await getDoc(gamificationRef);

      if (gamificationSnap.exists()) {
        const data = gamificationSnap.data() as UserGamification;
        
        if (data.conquistas) {
          data.conquistas = data.conquistas.map(c => ({
            ...c,
            desbloqueadaEm: c.desbloqueadaEm instanceof Date ? c.desbloqueadaEm : new Date()
          }));
        }
        
        if (data.historicoPontos) {
          data.historicoPontos = data.historicoPontos.map(h => ({
            ...h,
            timestamp: h.timestamp instanceof Date ? h.timestamp : new Date()
          }));
        }

        setGamificationData(data);
        calcularProgressoNivel(data.pontos, data.nivel);
      } else {
        console.error('Dados de gamificação não encontrados');
      }
    } catch (error) {
      console.error('Erro ao buscar dados de gamificação:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularProgressoNivel = (pontos: number, nivelAtual: string) => {
    const nivel = niveis[nivelAtual as keyof typeof niveis];
    if (!nivel) return;

    if (nivelAtual === 'Master') {
      setProximoNivel('Master');
      setPontosProximoNivel(0);
      setProgressoNivel(100);
      return;
    }

    const pontosNoNivel = pontos - nivel.min;
    const pontosNecessarios = nivel.next - nivel.min;
    const progresso = (pontosNoNivel / pontosNecessarios) * 100;

    setProgressoNivel(Math.min(progresso, 100));
    setPontosProximoNivel(nivel.next - pontos);

    const niveisArray = Object.keys(niveis);
    const indexAtual = niveisArray.indexOf(nivelAtual);
    if (indexAtual < niveisArray.length - 1) {
      setProximoNivel(niveisArray[indexAtual + 1]);
    }
  };

  const formatarData = (data: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit', 
      minute: '2-digit'
    }).format(data);
  };

  const formatarAcao = (acao: string) => {
    const acoes: Record<string, string> = {
      'TREINO_COMPLETO': 'Treino Completo',
      'REFEICAO_REGISTRADA': 'Refeição Registrada',
      'CHECK_IN_DIARIO': 'Check-in Diário',
      'FOTO_PROGRESSO': 'Foto de Progresso',
      'COMPARTILHAR_CONQUISTA': 'Conquista Compartilhada',
      'ONBOARDING_COMPLETO': 'Perfil Criado'
    };
    return acoes[acao] || acao;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-transparent border-t-emerald-400 rounded-full mx-auto"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 font-semibold text-sm sm:text-base"
          >
            Preparando sua experiência...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (!gamificationData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md space-y-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="text-emerald-400"
          >
            <Trophy className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" />
          </motion.div>
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Perfil Incompleto</h2>
            <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
              Complete o onboarding para desbloquear toda a experiência de gamificação
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <motion.button
              whileHover={{ scale: 1.05, x: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className="flex items-center gap-2 sm:gap-3 text-gray-400 hover:text-white transition-all duration-300 p-2 sm:p-3 rounded-xl sm:rounded-2xl hover:bg-white/5"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold text-sm sm:text-base">Voltar</span>
            </motion.button>

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <Image
                src="/images/Logo.png"
                alt="MembrosFit"
                width={180}
                height={180}
                className="rounded-xl sm:rounded-2xl w-24 h-24 sm:w-30 sm:h-30"
              />
            </motion.div>

            <div className="w-16 sm:w-20" />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center space-y-2 sm:space-y-3"
          >
            <h1 className="text-2xl sm:text-3xl lg:text-3xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Sua Jornada
            </h1>
            <p className="text-gray-400 font-semibold text-sm sm:text-base">Acompanhe sua evolução</p>
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12"
      >
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: Trophy, label: 'PONTOS', value: gamificationData.pontos.toLocaleString(), color: 'emerald', gradient: 'from-emerald-500 to-emerald-600' },
              { icon: Award, label: 'NÍVEL', value: gamificationData.nivel, color: 'blue', gradient: 'from-blue-500 to-blue-600' },
              { icon: Flame, label: 'STREAK', value: gamificationData.streakAtual.toString(), color: 'orange', gradient: 'from-orange-500 to-red-500' },
              { icon: TrendingUp, label: 'RECORDE', value: gamificationData.melhorStreak.toString(), color: 'cyan', gradient: 'from-cyan-500 to-cyan-600' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 backdrop-blur-xl hover:border-white/30 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className={`text-${stat.color}-400 group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-400 tracking-wider">{stat.label}</span>
                </div>
                <p className={`text-xl sm:text-2xl lg:text-3xl font-black text-${stat.color}-400 group-hover:text-${stat.color}-300 transition-colors duration-300`}>
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Progresso do Nível */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 backdrop-blur-xl hover:border-white/30 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="text-emerald-400 bg-emerald-400/10 p-2 sm:p-3 rounded-xl">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-white">Progresso do Nível</h2>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-gray-400 font-bold">{gamificationData.nivel}</span>
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-emerald-400 font-black text-base sm:text-lg"
                >
                  {Math.round(progressoNivel)}%
                </motion.span>
                <span className="text-gray-400 font-bold">{proximoNivel}</span>
              </div>
              
              <div className="relative w-full h-3 sm:h-4 bg-white/10 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressoNivel}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-cyan-400 rounded-full relative"
                >
                  <motion.div
                    animate={{ x: [0, 100, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                </motion.div>
              </div>
              
              {gamificationData.nivel !== 'Master' && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center text-gray-400 text-xs sm:text-sm font-semibold"
                >
                  {pontosProximoNivel.toLocaleString()} pontos para evoluir
                </motion.p>
              )}
            </div>
          </motion.section>

          {/* Conquistas */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 backdrop-blur-xl hover:border-white/30 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center gap-3">
                <div className="text-blue-400 bg-blue-400/10 p-2 sm:p-3 rounded-xl">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-white">Conquistas</h2>
              </div>
              <motion.span 
                whileHover={{ scale: 1.1 }}
                className="text-gray-400 font-black bg-white/5 px-3 sm:px-4 py-1 sm:py-2 rounded-xl text-sm sm:text-base"
              >
                {gamificationData.conquistas.length}
              </motion.span>
            </div>

            <AnimatePresence>
              {gamificationData.conquistas.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 sm:py-16 space-y-4"
                >
                  <Award className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto" />
                  <p className="text-gray-400 font-semibold text-sm sm:text-base">Complete atividades para desbloquear conquistas</p>
                </motion.div>
              ) : (
                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                  {gamificationData.conquistas.slice(-6).reverse().map((conquista, index) => (
                    <motion.div
                      key={conquista.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:border-white/20 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <motion.span 
                          whileHover={{ rotate: 360, scale: 1.2 }}
                          transition={{ duration: 0.5 }}
                          className="text-2xl sm:text-3xl"
                        >
                          {conquista.icone}
                        </motion.span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-black mb-1 sm:mb-2 truncate text-sm sm:text-base">{conquista.nome}</h3>
                          <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">{conquista.descricao}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-emerald-400 text-xs sm:text-sm font-black bg-emerald-400/10 px-2 sm:px-3 py-1 rounded-lg">
                              +{conquista.pontosBbonus} pts
                            </span>
                            <span className="text-gray-500 text-[10px] sm:text-xs font-semibold">
                              {formatarData(conquista.desbloqueadaEm)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Histórico de Pontos */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 backdrop-blur-xl hover:border-white/30 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="text-cyan-400 bg-cyan-400/10 p-2 sm:p-3 rounded-xl">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-white">Atividades Recentes</h2>
            </div>

            <AnimatePresence>
              {gamificationData.historicoPontos.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 sm:py-16 space-y-4"
                >
                  <Zap className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto" />
                  <p className="text-gray-400 font-semibold text-sm sm:text-base">Suas atividades aparecerão aqui</p>
                </motion.div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {gamificationData.historicoPontos.slice(-10).reverse().map((historico, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: -4 }}
                      className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:border-white/20 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold truncate text-sm sm:text-base mb-1">
                            {formatarAcao(historico.acao)}
                          </p>
                          <p className="text-gray-400 text-xs sm:text-sm font-semibold">
                            {formatarData(historico.timestamp)}
                          </p>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <p className="text-emerald-400 font-black text-base sm:text-lg">
                            +{historico.pontos}
                          </p>
                          {historico.multiplicador > 1 && (
                            <motion.p 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring" }}
                              className="text-cyan-400 text-xs font-black bg-cyan-400/10 px-2 py-0.5 rounded mt-1"
                            >
                              x{historico.multiplicador}
                            </motion.p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Protocolos Desbloqueados */}
          {gamificationData.protocolosDesbloqueados.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 backdrop-blur-xl hover:border-white/30 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="text-emerald-400 bg-emerald-400/10 p-2 sm:p-3 rounded-xl">
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-white">Protocolos Desbloqueados</h2>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {gamificationData.protocolosDesbloqueados.map((protocolo, index) => (
                  <motion.span
                    key={protocolo}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="bg-gradient-to-r from-emerald-400/20 to-emerald-500/20 border border-emerald-400/30 text-emerald-400 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 cursor-pointer"
                  >
                    {protocolo}
                  </motion.span>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </motion.main>
    </div>
  );
};

export default GamificationPage;