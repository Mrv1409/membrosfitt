'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getFirestore, getDoc, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { app, auth } from '@/lib/firebase';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { //eslint-disable-next-line
  Loader2, 
  AlertTriangle, 
  ArrowLeft, 
  Calendar,
  Clock,
  Target,
  Utensils,
  Dumbbell,
  User,
  TrendingUp,
  Activity,
  Flame,
  Zap
} from 'lucide-react';

type PlanoDetalhado = {
  id: string;
  userId: string;
  nomeUsuario: string;
  metadata: {
    criadoEm: Timestamp;
    tmb: number;
    modelo?: string;
    provider?: string;
    modeloUsado?: string;
    dadosUsuario?: {
      peso: number;
      altura: number;
      objetivo: string;
      biotipo: string;
    };
  };
  planoNutricional: {
    metaCalorica: number;
    semana: {
      [dia: string]: {
        refeicoes: {
          tipo: string;
          horario: string;
          itens: {
            alimento: string;
            quantidade: string;
            calorias?: number;
          }[];
          macros: {
            proteinas: number;
            carboidratos: number;
            gorduras: number;
            calorias: number;
          };
        }[];
        totalDiario: {
          calorias: number;
          proteinas: number;
          carboidratos: number;
          gorduras: number;
        };
      };
    };
  };
  planoTreino: {
    semana: {
      [dia: string]: {
        treino?: {
          tipo: string;
          grupoMuscular: string[];
          exercicios: {
            nome: string;
            series: number;
            repeticoes: string;
            descanso: string;
            observacoes?: string;
          }[];
          duracaoEstimada: number;
          intensidade: string;
        };
        descanso?: boolean;
      };
    };
  };
  observacoes: {
    nutricao: string[];
    treino: string[];
    geral: string[];
  };
};

export default function PlanoDetalhadoPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [plano, setPlano] = useState<PlanoDetalhado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'nutricao' | 'treino'>('nutricao');
  const router = useRouter();
  const params = useParams();

  const planoId = params?.id as string;

  const formatarData = (data: Timestamp): string => {
    try {
      let date: Date;
      if (data?.toDate) {
        date = data.toDate();
      } else if (data instanceof Date) {
        date = data;
      } else if (typeof data === 'string') {
        date = new Date(data);
      } else {
        return 'Data não disponível';
      }
      
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'Data não disponível';
    }
  };

  const traduzirDia = (dia: string): string => {
    const traducoes: { [key: string]: string } = {
      'monday': 'Segunda-feira',
      'tuesday': 'Terça-feira', 
      'wednesday': 'Quarta-feira',
      'thursday': 'Quinta-feira',
      'friday': 'Sexta-feira',
      'saturday': 'Sábado',
      'sunday': 'Domingo',
      'segunda': 'Segunda-feira',
      'terca': 'Terça-feira',
      'quarta': 'Quarta-feira', 
      'quinta': 'Quinta-feira',
      'sexta': 'Sexta-feira',
      'sabado': 'Sábado',
      'domingo': 'Domingo'
    };
    
    return traducoes[dia.toLowerCase()] || dia.charAt(0).toUpperCase() + dia.slice(1);
  };

  const ordenarDias = (dias: string[]): string[] => {
    const ordemDias = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const ordemDiasPt = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
    
    return dias.sort((a, b) => {
      const indexA = ordemDias.indexOf(a.toLowerCase()) !== -1 ? ordemDias.indexOf(a.toLowerCase()) : ordemDiasPt.indexOf(a.toLowerCase());
      const indexB = ordemDias.indexOf(b.toLowerCase()) !== -1 ? ordemDias.indexOf(b.toLowerCase()) : ordemDiasPt.indexOf(b.toLowerCase());
      
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
  };

  useEffect(() => {
    const fetchPlano = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          setError('Usuário não autenticado');
          return;
        }

        if (!planoId) {
          setError('ID do plano não fornecido');
          return;
        }

        const db = getFirestore(app);
        const planoRef = doc(db, 'users', user.uid, 'planos', planoId);
        const planoSnap = await getDoc(planoRef);
        
        if (planoSnap.exists()) {
          const dadosPlano = planoSnap.data() as PlanoDetalhado;
          setPlano(dadosPlano);
        } else {
          setError('Plano não encontrado');
        }
      } catch (error) {
        console.error('Erro ao carregar plano:', error);
        setError('Erro ao carregar o plano');
      } finally {
        setLoading(false);
      }
    };

    if (!loadingAuth && user && planoId) {
      fetchPlano();
    } else if (!loadingAuth && !user) {
      setLoading(false);
      setError('Usuário não autenticado');
    }
  }, [user, loadingAuth, planoId]);

  if (loadingAuth || loading) {
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
            className="w-16 h-16 border-4 border-transparent border-t-green-500 rounded-full mx-auto"
          />
          <p className="text-gray-300 font-bold text-sm sm:text-base">
            {loadingAuth ? 'Verificando autenticação...' : 'Carregando seu plano...'}
          </p>
        </motion.div>
      </div>
    );
  }

  if (!user || error || !plano) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 p-8 rounded-2xl backdrop-blur-md"
        >
          <AlertTriangle className="w-16 h-16 text-green-400 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-white mb-4">
            {!user ? 'Acesso Negado' : 'Plano Não Encontrado'}
          </h2>
          <p className="text-gray-300 font-bold mb-8">
            {!user ? 'Você precisa estar logado para ver este plano.' : error || 'O plano solicitado não foi encontrado.'}
          </p>
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(!user ? '/login' : '/dashboard')}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg"
            >
              {!user ? 'Fazer Login' : 'Voltar ao Dashboard'}
            </motion.button>
            {error && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.reload()}
                className="w-full bg-white/5 hover:bg-white/10 border-2 border-white/20 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
              >
                Tentar Novamente
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white w-full">
      {/* Conteúdo Principal */}
      <div className="w-full">
        
        {/* Header Integrado */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full px-4 sm:px-6 pt-6 pb-4"
        >

          {/* Logo Grande Centralizada */}
        <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="flex justify-center mb-8"
      >
        <Image
         src="/images/Logo.png"
         alt="MembrosFit"
         width={180}
         height={180}
         className="rounded-3xl w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40"
         priority
         />
        </motion.div>

          {/* Botão Voltar */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10 mb-6"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            <span className="font-bold text-xs sm:text-sm text-white">Voltar</span>
          </motion.button>

          {/* Card Info do Usuário */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-2xl p-4 sm:p-6 backdrop-blur-md"
          >
            <div className="flex flex-col gap-4">
              {/* Nome e Data */}
              <div className="flex items-start gap-3">
                <div className="bg-gray-400/30 p-2.5 rounded-xl flex-shrink-0">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-black text-white mb-1 break-words">
                    {plano.nomeUsuario}
                  </h1>
                  <p className="text-gray-300 font-bold text-xs sm:text-sm">
                    Criado em {formatarData(plano.metadata.criadoEm)}
                  </p>
                </div>
              </div>
              
              {/* Meta Calórica Destaque */}
              <div className="bg-black/30 rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-gray-200 font-bold">Meta Calórica</p>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-gray-200">
                    {plano.planoNutricional.metaCalorica} <span className="text-sm sm:text-base">kcal</span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Stats Grid */}
            {plano.metadata.dadosUsuario && (
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
                {[
                  { label: 'Objetivo', value: plano.metadata.dadosUsuario.objetivo, icon: Target },
                  { label: 'Biotipo', value: plano.metadata.dadosUsuario.biotipo, icon: Activity },
                  { label: 'Peso', value: `${plano.metadata.dadosUsuario.peso}kg`, icon: TrendingUp },
                  { label: 'TMB', value: `${plano.metadata.tmb} kcal`, icon: Flame }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="text-center p-3 bg-black/20 rounded-xl"
                  >
                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mx-auto mb-1.5" />
                    <p className="text-xs text-gray-300 font-bold mb-1">{stat.label}</p>
                    <p className="text-xs sm:text-sm font-black text-white truncate">{stat.value}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full px-4 sm:px-6 mb-6"
        >
          <div className="flex gap-3 bg-white/5 backdrop-blur-md rounded-2xl p-1.5 border-2 border-white/20">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('nutricao')}
              className={`flex-1 px-4 py-3 rounded-xl font-black text-sm transition-all duration-300 ${
                activeTab === 'nutricao' 
                  ? 'bg-orange-500 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Utensils className="w-4 h-4" />
                <span className="hidden sm:inline">Nutrição</span>
                <span className="sm:hidden">Dieta</span>
              </span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('treino')}
              className={`flex-1 px-4 py-3 rounded-xl font-black text-sm transition-all duration-300 ${
                activeTab === 'treino' 
                  ? 'bg-green-500 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Dumbbell className="w-4 h-4" />
                <span>Treino</span>
              </span>
            </motion.button>
          </div>
        </motion.div>

        {/* Content */}
        <div className="w-full px-4 sm:px-6 pb-12">
          
          {activeTab === 'nutricao' ? (
            /* PLANO NUTRICIONAL */
            <motion.div
              key="nutricao"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {ordenarDias(Object.keys(plano.planoNutricional.semana)).map((dia, index) => {
                const dados = plano.planoNutricional.semana[dia];
                return (
                  <motion.div
                    key={dia}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-2xl p-4 sm:p-5 backdrop-blur-md hover:scale-[1.01] transition-transform duration-300"
                  >
                    {/* Header do Dia */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-orange-400 flex-shrink-0" />
                        <h3 className="text-base sm:text-lg font-black text-white">
                          {traduzirDia(dia)}
                        </h3>
                      </div>
                      <div className="bg-black/30 rounded-xl px-3 py-2 w-fit">
                        <p className="text-xs text-gray-300 font-bold">Total</p>
                        <p className="text-base sm:text-lg font-black text-orange-400">
                          {dados.totalDiario.calorias} kcal
                        </p>
                      </div>
                    </div>

                    {/* Macros do Dia */}
                    <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-black/20 rounded-xl">
                      <div className="text-center">
                        <p className="text-xs text-gray-300 font-bold mb-1">Proteínas</p>
                        <p className="text-sm sm:text-base font-black text-white">{dados.totalDiario.proteinas}g</p>
                      </div>
                      <div className="text-center border-x border-white/10">
                        <p className="text-xs text-gray-300 font-bold mb-1">Carboidratos</p>
                        <p className="text-sm sm:text-base font-black text-white">{dados.totalDiario.carboidratos}g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-300 font-bold mb-1">Gorduras</p>
                        <p className="text-sm sm:text-base font-black text-white">{dados.totalDiario.gorduras}g</p>
                      </div>
                    </div>

                    {/* Refeições */}
                    <div className="space-y-3">
                      {dados.refeicoes.map((refeicao, refIndex) => (
                        <div key={refIndex} className="bg-black/30 border border-white/10 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" />
                              <span className="font-black text-white text-sm">{refeicao.tipo}</span>
                            </div>
                            <span className="text-xs font-bold text-gray-300">{refeicao.horario}</span>
                          </div>
                          
                          <div className="space-y-1.5 mb-2">
                            {refeicao.itens.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex justify-between items-start text-xs">
                                <span className="text-gray-300 font-bold flex-1 pr-2">
                                  {item.alimento} <span className="text-gray-500">({item.quantidade})</span>
                                </span>
                                {item.calorias && (
                                  <span className="text-gray-300 font-bold flex-shrink-0">{item.calorias} kcal</span>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          <div className="pt-2 border-t border-white/10 flex justify-between text-xs">
                            <span className="text-gray-300 font-bold">P: {refeicao.macros.proteinas}g</span>
                            <span className="text-gray-300 font-bold">C: {refeicao.macros.carboidratos}g</span>
                            <span className="text-gray-300 font-bold">G: {refeicao.macros.gorduras}g</span>
                            <span className="text-orange-400 font-black">{refeicao.macros.calorias} kcal</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}

              {/* Observações Nutrição */}
              {plano.observacoes.nutricao.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-2xl p-4 sm:p-5 backdrop-blur-md"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-orange-400" />
                    <h3 className="text-base sm:text-lg font-black text-white">Dicas de Nutrição</h3>
                  </div>
                  <ul className="space-y-2">
                    {plano.observacoes.nutricao.map((obs, index) => (
                      <li key={index} className="text-xs sm:text-sm font-bold text-gray-300 flex items-start">
                        <span className="text-orange-400 mr-2 flex-shrink-0">•</span>
                        {obs}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </motion.div>
          ) : (
            /* PLANO DE TREINO */
            <motion.div
              key="treino"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {ordenarDias(Object.keys(plano.planoTreino.semana)).map((dia, index) => {
                const dados = plano.planoTreino.semana[dia];
                return (
                  <motion.div
                    key={dia}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-2xl p-4 sm:p-5 backdrop-blur-md hover:scale-[1.01] transition-transform duration-300"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <h3 className="text-base sm:text-lg font-black text-white">
                        {traduzirDia(dia)}
                      </h3>
                    </div>
                    
                    {dados.descanso ? (
                      <div className="text-center py-8">
                        <div className="text-5xl mb-3">😴</div>
                        <p className="text-lg font-black text-white mb-1">Dia de Descanso</p>
                        <p className="text-sm font-bold text-gray-300">Recupere suas energias!</p>
                      </div>
                    ) : dados.treino && (
                      <div className="space-y-3">
                        {/* Info do Treino */}
                        <div className="grid grid-cols-2 gap-2 p-3 bg-black/20 rounded-xl">
                          <div className="text-center">
                            <p className="text-xs text-gray-300 font-bold mb-1">Tipo</p>
                            <p className="text-xs sm:text-sm font-black text-white truncate">{dados.treino.tipo}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-300 font-bold mb-1">Intensidade</p>
                            <p className="text-xs sm:text-sm font-black text-green-400">{dados.treino.intensidade}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-300 font-bold mb-1">Duração</p>
                            <p className="text-xs sm:text-sm font-black text-white">{dados.treino.duracaoEstimada} min</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-300 font-bold mb-1">Grupos</p>
                            <p className="text-xs sm:text-sm font-black text-white truncate">{dados.treino.grupoMuscular.join(', ')}</p>
                          </div>
                        </div>

                        {/* Exercícios */}
                        <div className="space-y-2">
                          {dados.treino.exercicios.map((exercicio, exIndex) => (
                            <div key={exIndex} className="bg-black/30 border border-white/10 rounded-xl p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-black text-white text-sm flex-1 pr-2">{exercicio.nome}</span>
                                <Dumbbell className="w-4 h-4 text-green-400 flex-shrink-0" />
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center bg-black/30 rounded-lg p-2">
                                  <p className="text-xs text-gray-300 font-bold mb-1">Séries</p>
                                  <p className="font-black text-white">{exercicio.series}</p>
                                </div>
                                <div className="text-center bg-black/30 rounded-lg p-2">
                                  <p className="text-xs text-gray-300 font-bold mb-1">Reps</p>
                                  <p className="font-black text-white">{exercicio.repeticoes}</p>
                                </div>
                                <div className="text-center bg-black/30 rounded-lg p-2">
                                  <p className="text-xs text-gray-300 font-bold mb-1">Descanso</p>
                                  <p className="font-black text-white">{exercicio.descanso}</p>
                                </div>
                              </div>
                              {exercicio.observacoes && (
                                <div className="mt-2 pt-2 border-t border-white/10">
                                  <p className="text-xs font-bold text-gray-300">{exercicio.observacoes}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Observações Treino */}
              {plano.observacoes.treino.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-2xl p-4 sm:p-5 backdrop-blur-md"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-green-400" />
                    <h3 className="text-base sm:text-lg font-black text-white">Dicas de Treino</h3>
                  </div>
                  <ul className="space-y-2">
                    {plano.observacoes.treino.map((obs, index) => (
                      <li key={index} className="text-xs sm:text-sm font-bold text-gray-300 flex items-start">
                        <span className="text-green-500 mr-2 flex-shrink-0">•</span>
                        {obs}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Observações Gerais */}
          {plano.observacoes.geral.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 bg-gradient-to-r from-gray-700/20 to-gray-800/20 border-2 border-gray-700 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-gray-400" />
                <h3 className="text-base sm:text-lg font-black text-white">Observações Gerais</h3>
              </div>
              <ul className="space-y-2">
                {plano.observacoes.geral.map((obs, index) => (
                  <li key={index} className="text-xs sm:text-sm font-bold text-gray-300 flex items-start">
                    <span className="text-gray-500 mr-2 flex-shrink-0">•</span>
                    {obs}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full px-4 sm:px-6 pb-8"
        >
          <div className="text-center">
            <p className="text-xs sm:text-sm font-bold text-gray-600">
              Plano gerado por IA • Modelo: {plano.metadata.modelo || plano.metadata.modeloUsado || 'N/A'}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}