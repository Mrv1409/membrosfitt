'use client';

import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
  orderBy,
  limit,
  doc,
  setDoc,//eslint-disable-next-line
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { app } from '@/lib/firebase';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import MenuBottomNav from '@/components/MenuBottomNav';
import { 
  Trophy, 
  Camera, 
  Ruler, 
  Activity,
  CheckCircle,
  Target,
  ArrowLeft,
  TrendingUp,
  Calendar,
  Dumbbell,
  Flame,
  Zap,
  Clock
} from 'lucide-react';

interface ProgressoItem {
  date: string;
  peso: number;
  name: string;
  fotos: string[];
  measurements: {
    arm?: number;
    waist?: number;
    pectoral?: number;
    glutes?: number;
    thigh?: number;
    abdominalCircumference?: number;
    calf?: number;
    [key: string]: number | undefined;
  };
}

interface TreinoDoPlano {
  dia: string;
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
  descanso?: boolean;
}

interface TreinoConcluido {
  data: string;
  treinoNome: string;
  duracao: number;
  timestamp: Timestamp;
}

const traduzirMedida = (key: string): string => {
  const traducoes: Record<string, string> = {
    'arm': 'Braço',
    'waist': 'Cintura',
    'pectoral': 'Peitoral',
    'glutes': 'Glúteos',
    'thigh': 'Coxa',
    'abdominalCircumference': 'Abdômen',
    'calf': 'Panturrilha'
  };
  return traducoes[key] || key;
};

const getDiaAtualEn = (): string => {
  const dias = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return dias[new Date().getDay()];
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
  };
  return traducoes[dia.toLowerCase()] || dia;
};

export default function ProgressoPage() {
  const [progresso, setProgresso] = useState<ProgressoItem[]>([]);
  const [treinoDodia, setTreinoDodia] = useState<TreinoDoPlano | null>(null);
  const [treinosConcluidos, setTreinosConcluidos] = useState<TreinoConcluido[]>([]);
  const [treinoDoDiaConcluido, setTreinoDoDiaConcluido] = useState(false);
  const [activeTab, setActiveTab] = useState<'progresso' | 'treinos'>('treinos');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const auth = getAuth(app);
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          router.push('/login');
          return;
        }

        const db = getFirestore(app);

        // Buscar progresso de fotos/medidas
        const progressoRef = collection(db, 'userProgress');
        const progressoQuery = query(progressoRef, where('userId', '==', user.uid));
        const progressoSnap = await getDocs(progressoQuery);
        const progressoData = progressoSnap.docs.map((doc): ProgressoItem => {
          const d = doc.data();
          return {
            date: new Date(d.date.seconds * 1000).toLocaleString('pt-BR'),
            peso: d.peso,
            name: d.name || '',
            fotos: d.fotos || [],
            measurements: d.measurements || {},
          };
        });
        setProgresso(progressoData);

        // Buscar plano mais recente
        const planosRef = collection(db, 'users', user.uid, 'planos');
        const planosQuery = query(planosRef, orderBy('metadata.criadoEm', 'desc'), limit(1));
        const planosSnap = await getDocs(planosQuery);

        if (!planosSnap.empty) {
          const planoData = planosSnap.docs[0].data();
          const diaAtual = getDiaAtualEn();
          const treinoHoje = planoData.planoTreino?.semana?.[diaAtual];

          if (treinoHoje) {
            setTreinoDodia({
              dia: diaAtual,
              ...treinoHoje.treino,
              descanso: treinoHoje.descanso || false
            });
          }
        }

        // Buscar treinos concluídos
        const treinosRef = collection(db, 'users', user.uid, 'treinosConcluidos');
        const treinosSnap = await getDocs(treinosRef);
        const treinosData = treinosSnap.docs.map(doc => doc.data() as TreinoConcluido);
        setTreinosConcluidos(treinosData);

        // Verificar se treino de hoje já foi concluído
        const hoje = new Date().toISOString().split('T')[0];
        const jaConcluido = treinosData.some(t => t.data === hoje);
        setTreinoDoDiaConcluido(jaConcluido);

      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDados();
  }, [router]);

  const handleTreinoConcluido = async () => {
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user || !treinoDodia) return;

      const db = getFirestore(app);
      const hoje = new Date().toISOString().split('T')[0];
      
      // Salvar treino concluído
      const treinoRef = doc(db, 'users', user.uid, 'treinosConcluidos', hoje);
      await setDoc(treinoRef, {
        data: hoje,
        treinoNome: treinoDodia.tipo,
        duracao: treinoDodia.duracaoEstimada,
        timestamp: Timestamp.now()
      });

      setTreinoDoDiaConcluido(true);

      // Chamar API de gamificação
      const response = await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          acao: 'TREINO_COMPLETO',
          detalhes: {
            tipo: treinoDodia.tipo,
            duracao: treinoDodia.duracaoEstimada
          }
        })
      });

      if (response.ok) {
        console.log('✅ Treino registrado e pontos ganhos!');
      }
    } catch (error) {
      console.error('Erro ao registrar treino:', error);
    }
  };

  const handleFotoProgresso = async () => {
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user) return;

      const response = await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          acao: 'FOTO_PROGRESSO'
        })
      });

      if (response.ok) {
        console.log('✅ Pontos ganhos pela foto!');
      }
    } catch (error) {
      console.error('Erro ao registrar foto:', error);
    }
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
            className="w-16 h-16 border-4 border-transparent border-t-green-500 rounded-full mx-auto"
          />
          <p className="text-gray-300 font-bold text-sm sm:text-base">
            Carregando seu progresso...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Redesenhado */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-6"
      >
        <div className="max-w-7xl mx-auto">
          
          {/* Top Bar: Voltar + Logo */}
          <div className="flex items-center justify-between mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              <span className="font-bold text-xs sm:text-sm text-white">Voltar</span>
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
                className="rounded-3xl w-24 h-24 sm:w-32 sm:h-32 lg:w-48 lg:h-48"
                priority
              />
            </motion.div>

            <div className="w-[72px] sm:w-[88px]" />
          </div>

          {/* Título */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl sm:text-3xl lg:text-4xl font-black text-white mb-3 drop-shadow-[0_0_10px_#00FF8B]">
              MEU PROGRESSO
            </h1>
            <p className="text-sm sm:text-base text-gray-300 font-bold max-w-2xl mx-auto">
              Acompanhe sua evolução e conquiste seus objetivos
            </p>
          </motion.div>
        </div>
      </motion.header>

      {/* Tabs Redesenhadas */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="px-4 sm:px-6 lg:px-8 mb-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-3 bg-white/5 backdrop-blur-md rounded-2xl p-1.5 border-2 border-white/20">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('treinos')}
              className={`flex-1 px-4 py-3 rounded-xl font-black text-sm transition-all duration-300 ${
                activeTab === 'treinos' 
                  ? 'bg-green-500 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Dumbbell className="w-4 h-4" />
                <span>Treinos</span>
              </span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('progresso')}
              className={`flex-1 px-4 py-3 rounded-xl font-black text-sm transition-all duration-300 ${
                activeTab === 'progresso' 
                  ? 'bg-green-500 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Evolução</span>
                <span className="sm:hidden">Fotos</span>
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Conteúdo */}
      <div className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            
            {activeTab === 'treinos' ? (
              /* ABA TREINOS */
              <motion.div
                key="treinos"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Card Treino do Dia */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-2xl p-5 sm:p-6 backdrop-blur-md"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-green-500/30 p-2.5 rounded-xl">
                      <Calendar className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-white">
                        Treino de Hoje
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-300 font-bold">
                        {traduzirDia(getDiaAtualEn())}
                      </p>
                    </div>
                  </div>

                  {!treinoDodia ? (
                    <div className="text-center py-12 bg-black/20 rounded-xl">
                      <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-black text-gray-300 mb-2">
                        Nenhum Plano Ativo
                      </h3>
                      <p className="text-sm text-gray-300 font-bold mb-6">
                        Gere um plano para começar seus treinos
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/gerar')}
                        className="bg-green-500 text-white font-bold py-3 px-6 rounded-xl"
                      >
                        Gerar Plano
                      </motion.button>
                    </div>
                  ) : treinoDodia.descanso ? (
                    <div className="text-center py-12 bg-black/20 rounded-xl">
                      <div className="text-6xl mb-4">😴</div>
                      <h3 className="text-2xl font-black text-white mb-2">
                        Dia de Descanso
                      </h3>
                      <p className="text-sm text-gray-300 font-bold">
                        Recupere suas energias para amanhã!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Info do Treino */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-black/20 rounded-xl">
                        <div className="text-center">
                          <p className="text-xs text-gray-300 font-bold mb-1">Tipo</p>
                          <p className="text-sm font-black text-white truncate">{treinoDodia.tipo}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-300 font-bold mb-1">Intensidade</p>
                          <p className="text-sm font-black text-green-400">{treinoDodia.intensidade}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-300 font-bold mb-1">Duração</p>
                          <p className="text-sm font-black text-white">{treinoDodia.duracaoEstimada} min</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-300 font-bold mb-1">Exercícios</p>
                          <p className="text-sm font-black text-white">{treinoDodia.exercicios?.length || 0}</p>
                        </div>
                      </div>

                      {/* Grupos Musculares */}
                      <div className="bg-black/20 rounded-xl p-4">
                        <p className="text-xs text-gray-300 font-bold mb-2">Grupos Musculares:</p>
                        <div className="flex flex-wrap gap-2">
                          {treinoDodia.grupoMuscular?.map((grupo, i) => (
                            <span key={i} className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-xs font-black">
                              {grupo}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Exercícios */}
                      <div className="space-y-2">
                        <p className="text-sm font-black text-white flex items-center gap-2">
                          <Dumbbell className="w-4 h-4 text-green-400" />
                          Exercícios do Dia
                        </p>
                        {treinoDodia.exercicios?.map((ex, i) => (
                          <div key={i} className="bg-black/30 border border-white/10 rounded-xl p-3">
                            <p className="font-black text-white text-sm mb-2">{ex.nome}</p>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center bg-black/30 rounded-lg p-2">
                                <p className="text-gray-300 font-bold mb-1">Séries</p>
                                <p className="text-white font-black">{ex.series}</p>
                              </div>
                              <div className="text-center bg-black/30 rounded-lg p-2">
                                <p className="text-gray-300 font-bold mb-1">Reps</p>
                                <p className="text-white font-black">{ex.repeticoes}</p>
                              </div>
                              <div className="text-center bg-black/30 rounded-lg p-2">
                                <p className="text-gray-300 font-bold mb-1">Descanso</p>
                                <p className="text-white font-black">{ex.descanso}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Botão Concluir */}
                      {treinoDoDiaConcluido ? (
                        <div className="bg-green-500/20 border-2 border-green-500 rounded-xl p-4 flex items-center justify-center gap-3">
                          <CheckCircle className="w-6 h-6 text-green-400" />
                          <span className="font-black text-green-400 text-base">Treino Concluído Hoje!</span>
                        </div>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleTreinoConcluido}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg text-base"
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span>Marcar como Concluído</span>
                        </motion.button>
                      )}
                    </div>
                  )}
                </motion.div>

                {/* Estatísticas */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-2xl p-5 sm:p-6 backdrop-blur-md"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-green-500/30 p-2.5 rounded-xl">
                      <Trophy className="w-5 h-5 text-green-400" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white">
                      Suas Estatísticas
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div 
                      whileHover={{ scale: 1.03, y: -2 }}
                      className="text-center p-6 bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-xl"
                    >
                      <Flame className="w-8 h-8 text-green-400 mx-auto mb-3" />
                      <p className="text-3xl sm:text-4xl font-black text-green-400 mb-2">
                        {treinosConcluidos.length}
                      </p>
                      <p className="text-gray-300 font-bold text-xs sm:text-sm">Treinos Concluídos</p>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.03, y: -2 }}
                      className="text-center p-6 bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-xl"
                    >
                      <Zap className="w-8 h-8 text-green-400 mx-auto mb-3" />
                      <p className="text-3xl sm:text-4xl font-black text-white mb-2">
                        {treinoDoDiaConcluido ? '1' : '0'}
                      </p>
                      <p className="text-gray-300 font-bold text-xs sm:text-sm">Treinos Hoje</p>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              /* ABA PROGRESSO (FOTOS/MEDIDAS) */
              <motion.div
                key="progresso"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Ações Rápidas */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-2xl p-5 sm:p-6 backdrop-blur-md"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="bg-green-500/30 p-2.5 rounded-xl">
                      <Target className="w-5 h-5 text-green-400" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white">
                      Registrar Progresso
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleFotoProgresso}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg text-sm"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Adicionar Foto</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-white/5 hover:bg-white/10 border-2 border-white/20 text-white font-bold py-4 px-5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 text-sm"
                    >
                      <Ruler className="w-5 h-5" />
                      <span>Registrar Medidas</span>
                    </motion.button>
                  </div>
                </motion.div>

                {/* Lista de Progresso */}
                {progresso.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-2xl backdrop-blur-md"
                  >
                    <Camera className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                    <h3 className="text-2xl font-black text-white mb-3">
                      Nenhum Registro Ainda
                    </h3>
                    <p className="text-gray-300 text-sm sm:text-base font-bold max-w-md mx-auto">
                      Comece registrando suas fotos e medidas para acompanhar sua evolução
                    </p>
                  </motion.div>
                ) : (
                  <div className="grid gap-5 lg:grid-cols-2">
                    {progresso.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className="bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 p-5 sm:p-6 rounded-2xl backdrop-blur-md"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-green-400" />
                              <h2 className="text-sm sm:text-base font-black text-white">
                                {item.date}
                              </h2>
                            </div>
                            <p className="text-gray-300 font-bold text-sm">
                              Peso: <span className="text-white font-black">{item.peso} kg</span>
                            </p>
                          </div>
                          <div className="bg-green-500/30 p-2 rounded-lg">
                            <Trophy className="w-5 h-5 text-green-400" />
                          </div>
                        </div>

                        {item.fotos.length > 0 && (
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            {item.fotos.map((foto, i) => (
                              <motion.div 
                                key={i} 
                                className="relative overflow-hidden rounded-xl border-2 border-white/10"
                                whileHover={{ scale: 1.05 }}
                              >
                                <Image
                                  src={foto}
                                  alt={`Foto ${i + 1}`}
                                  width={200}
                                  height={200}
                                  className="object-cover w-full h-32"
                                />
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {Object.keys(item.measurements).length > 0 && (
                          <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                            <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
                              <Ruler className="w-4 h-4 text-green-400" />
                              Medidas Corporais
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                              {Object.entries(item.measurements).map(([key, value], i) => (
                                <div key={i} className="flex justify-between items-center bg-black/30 p-2 rounded-lg">
                                  <span className="text-gray-300 font-bold">
                                    {traduzirMedida(key)}
                                  </span>
                                  <span className="text-white font-black">
                                    {value} cm
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Menu de Navegação Inferior */}
      <MenuBottomNav />
    </div>
  );
}