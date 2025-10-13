'use client';

import { useEffect, useState } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc, getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  Flame, 
  Trophy, 
  TrendingUp, 
  Target,
  Dumbbell,
  Utensils,
  Play,
  Award,
  Zap,
  Calendar,
  Activity,
  LogOut,
  User
} from 'lucide-react';

interface UserProfile {
  name: string;
  peso: number;
  metadePeso: number;
  objetivo: string;
}

interface GamificationData {
  pontos: number;
  nivel: string;
  streakAtual: number;
}

interface TreinoDoDia {
  tipo: string;
  grupoMuscular: string[];
  duracaoEstimada: number;
  exercicios: string[];
}

interface NutricaoDoDia {
  totalCalorias: number;
  metaCalorica: number;
  proximaRefeicao: string;
  horarioProximaRefeicao: string;
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [treinoDoDia, setTreinoDoDia] = useState<TreinoDoDia | null>(null);
  const [nutricaoDoDia, setNutricaoDoDia] = useState<NutricaoDoDia | null>(null);
  const [planoId, setPlanoId] = useState<string | null>(null);
  const [diaDescanso, setDiaDescanso] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const auth = getAuth(app);
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handlePerfil = () => {
    router.push('/perfil');
  };

  const getDiaSemanaPtToEn = () => {
    const dias = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dias[new Date().getDay()];
  };

  const getDiaSemanaFormatado = () => {
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const hoje = new Date();
    return `${dias[hoje.getDay()]}, ${hoje.getDate()} de ${meses[hoje.getMonth()]}`;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const auth = getAuth(app);
        const user = auth.currentUser;
        if (!user) return;

        const db = getFirestore(app);
        
        // Buscar perfil
        const profileSnap = await getDoc(doc(db, 'users', user.uid));
        setUserData(profileSnap.data() as UserProfile);

        // Buscar gamificação
        const gamificationSnap = await getDoc(doc(db, 'users', user.uid, 'gamification', 'data'));
        if (gamificationSnap.exists()) {
          setGamificationData(gamificationSnap.data() as GamificationData);
        }

        // Buscar plano mais recente
        const planosRef = collection(db, 'users', user.uid, 'planos');
        const planosQuery = query(planosRef, orderBy('metadata.criadoEm', 'desc'), limit(1));
        const planosSnap = await getDocs(planosQuery);

        if (!planosSnap.empty) {
          const planoDoc = planosSnap.docs[0];
          const planoData = planoDoc.data();
          const planoIdAtual = planoDoc.id;
          setPlanoId(planoIdAtual);

          const diaAtual = getDiaSemanaPtToEn();

          // Extrair treino do dia
          const treinoHoje = planoData.planoTreino?.semana?.[diaAtual];
          if (treinoHoje?.descanso) {
            setDiaDescanso(true);
          } else if (treinoHoje?.treino) {
            setTreinoDoDia({
              tipo: treinoHoje.treino.tipo,
              grupoMuscular: treinoHoje.treino.grupoMuscular || [],
              duracaoEstimada: treinoHoje.treino.duracaoEstimada,
              exercicios: treinoHoje.treino.exercicios || []
            });
          }

          // Extrair nutrição do dia
          const nutricaoHoje = planoData.planoNutricional?.semana?.[diaAtual];
          if (nutricaoHoje) {
            const horaAtual = new Date().getHours();
            let proximaRefeicao = 'Café da manhã';
            let horario = '07:00';

            // Encontrar próxima refeição
            for (const refeicao of nutricaoHoje.refeicoes) {
              const [hora] = refeicao.horario.split(':').map(Number);
              if (hora > horaAtual) {
                proximaRefeicao = refeicao.tipo;
                horario = refeicao.horario;
                break;
              }
            }

            setNutricaoDoDia({
              totalCalorias: nutricaoHoje.totalDiario?.calorias || 0,
              metaCalorica: planoData.planoNutricional.metaCalorica,
              proximaRefeicao,
              horarioProximaRefeicao: horario
            });
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const getMensagemMotivacional = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "💪 Bom dia, campeão!";
    if (hora < 18) return "🔥 Boa tarde, guerreiro!";
    return "⚡ Boa noite, atleta!";
  };

  const getDicaAleatoria = () => {
    const dicas = [
      "Você não precisa ser perfeito. Só precisa começar. Treine hoje.",
      "Cada treino é um investimento no seu futuro. Vale a pena!",
      "A disciplina vence a motivação. Seja consistente!",
      "Seu único limite é você mesmo. Quebre barreiras hoje!",
      "Grandes resultados começam com pequenas ações diárias.",
      "O corpo alcança o que a mente acredita. Visualize seu sucesso!"
    ];
    return dicas[Math.floor(Math.random() * dicas.length)];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-transparent border-t-green-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen text-white pb-20">
      {/* Imagens de Fundo */}
      <Image
        src="/images/ImagemDesk.png"
        alt="Background Desktop"
        fill
        sizes="100vw"
        className="object-cover hidden md:block pointer-events-none select-none"
        quality={100}
        priority
      />
      <Image
        src="/images/ImagemMobnegona.png"
        alt="Background Mobile"
        fill
        sizes="100vw"
        className="object-cover md:hidden pointer-events-none select-none"
        quality={100}
        priority
      />

      {/* Overlay Escuro */}
      <div className="absolute inset-0 bg-black/85" />

      {/* Conteúdo Principal */}
      <div className="relative z-10 w-full px-4 py-4">
        
        {/* Header Compacto com Navegação */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePerfil}
            className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10"
          >
            <User className="w-4 h-4 text-green-400" />
            <span className="text-sm font-bold text-white">Perfil</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="bg-white/5 p-2 rounded-xl border border-white/10"
          >
            <LogOut className="w-4 h-4 text-white" />
          </motion.button>
        </motion.div>

        {/* Header Motivacional */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_0_10px_#00FF8B] tracking-wide mb-2">
            MEMBROS FIT
          </h1>
          <p className="text-lg font-bold text-green-400 mb-1">
            {getMensagemMotivacional()}
          </p>
          <p className="text-sm text-gray-300">
            Bem-vindo de volta, <span className="text-white font-bold">{userData?.name || 'Atleta'}</span>
          </p>
        </motion.div>

        {/* Stats Bar - Gamificação Visível */}
        {gamificationData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-green-400/20 to-green-500/20 border-2 border-green-500 p-4 rounded-2xl backdrop-blur-md mb-6 shadow-lg shadow-green-500/20"
          >
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <p className="text-xs font-bold text-gray-200">NÍVEL</p>
                </div>
                <p className="text-xl font-black text-white">{gamificationData.nivel}</p>
              </div>
              <div className="text-center border-x border-green-500/30">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-green-400" />
                  <p className="text-xs font-bold text-gray-300">PONTOS</p>
                </div>
                <p className="text-xl font-black text-green-400">{gamificationData.pontos.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <p className="text-xs font-bold text-gray-300">STREAK</p>
                </div>
                <p className="text-xl font-black text-orange-400">{gamificationData.streakAtual} dias</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Treino do Dia - DESTAQUE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-green-400/20 to-green-500/20 border-2 border-green-500 p-4 rounded-2xl backdrop-blur-md mb-4 shadow-lg shadow-green-500/20 cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => planoId && router.push(`/dashboard/plano/${planoId}`)}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-black text-white">TREINO DO DIA</h2>
              </div>
              <p className="text-gray-300 font-bold text-sm">{getDiaSemanaFormatado()}</p>
            </div>
            {treinoDoDia && (
              <div className="bg-green-500/30 px-3 py-1 rounded-lg">
                <p className="text-green-400 font-black text-xs">{treinoDoDia.duracaoEstimada} min</p>
              </div>
            )}
          </div>

          {diaDescanso ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">😴</div>
              <p className="text-white font-black text-base mb-1">Dia de Descanso</p>
              <p className="text-gray-300 text-sm font-bold">Recupere suas energias para amanhã!</p>
            </div>
          ) : treinoDoDia ? (
            <>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-300" />
                  <p className="text-white font-bold text-sm">{treinoDoDia.tipo}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-300" />
                  <p className="text-gray-300 text-sm font-bold">{treinoDoDia.grupoMuscular.join(', ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-400" />
                  <p className="text-gray-300 text-sm font-bold">{treinoDoDia.exercicios.length} exercícios • +50 pontos ao concluir</p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg"
              >
                <Play className="w-4 h-4" />
                VER TREINO COMPLETO
              </motion.button>
            </>
          ) : (
            <div className="text-center py-4">
              <Dumbbell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 font-bold text-sm">Nenhum plano ativo</p>
              <p className="text-gray-500 text-xs font-bold mt-1">Gere um plano para ver seus treinos</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/perfil');
                }}
                className="mt-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl text-xs"
              >
                GERAR PLANO COM IA
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Grid de 2 Cards */}
        <div className="grid grid-cols-1 gap-4 mb-4">
          
          {/* Nutrição Hoje */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-yellow-400/20 to-yellow-400/20 border-2 border-yellow-400 p-4 rounded-2xl backdrop-blur-md shadow-lg shadow-yellow-500/20 cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => planoId && router.push(`/dashboard/plano/${planoId}`)}
          >
            <div className="flex items-center gap-2 mb-3">
              <Utensils className="w-5 h-5 text-yellow-400" />
              <h3 className="text-base font-black text-white">NUTRIÇÃO HOJE</h3>
            </div>

            {nutricaoDoDia ? (
              <>
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-100 font-bold text-xs">Meta Calórica</p>
                    <p className="text-white font-black text-base">{nutricaoDoDia.metaCalorica.toLocaleString()}</p>
                  </div>
                  <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '0%' }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-gray-100 font-bold mt-1">Registre suas refeições para acompanhar</p>
                </div>

                <div className="bg-black/20 p-3 rounded-xl">
                  <p className="text-yellow-400 font-bold text-xs mb-1">Próxima Refeição:</p>
                  <p className="text-white font-black text-sm">{nutricaoDoDia.proximaRefeicao}</p>
                  <p className="text-gray-400 font-bold text-xs">{nutricaoDoDia.horarioProximaRefeicao}</p>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <Utensils className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 font-bold text-sm">Nenhum plano ativo</p>
              </div>
            )}
          </motion.div>

          {/* Missão Semanal */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-gray-200/20 to-gray-500/20 border-2 border-gray-500 p-4 rounded-2xl backdrop-blur-md shadow-lg shadow-gray-500/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-black text-white">MISSÃO SEMANAL</h3>
            </div>

            <p className="text-white font-bold text-sm mb-2">
              Complete 5 treinos esta semana
            </p>

            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <p className="text-gray-100 font-bold text-xs">Progresso</p>
                <p className="text-gray-400 font-black text-base">3/5</p>
              </div>
              <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '60%' }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="h-full bg-gradient-to-r from-gray-400 to-gray-500 rounded-full"
                />
              </div>
            </div>
            
              <div className="flex items-center gap-2 text-white">
              <Award className="w-4 h-4" />
              <p className="font-bold text-xs">Recompensa: +500 pontos + 🏆 Conquista</p>
            </div>
          </motion.div>
        </div>

        {/* Ações Rápidas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-4"
        >
          <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-600" />
            AÇÕES RÁPIDAS
          </h2>
          
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: '📑', label: 'Meus Planos', href: '/dashboard/planos', color: 'from-green-400/20 to-green-500/20 border-green-500' },
              { icon: '📈', label: 'Progresso', href: '/progresso', color: 'from-green-400/20 to-green-500/20 border-green-500' },
              { icon: '🏆', label: 'Protocolos', href: '/protocolos', color: 'from-green-400/20 to-green-500/20 border-green-500' },
              { icon: '🍽️', label: 'Receitas', href: '/receitas', color: 'from-green-400/20 to-green-500/20 border-green-500' },
              { icon: '🎮', label: 'Gamificação', href: '/gamification', color: 'from-green-400/20 to-green-500/20 border-green-500' },
              { icon: '🔔', label: 'Notificações', href: '/notificacoes', color: 'from-green-400/20 to-green-500/20 border-green-500' },
            ].map((action, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(action.href)}
                className={`cursor-pointer bg-gradient-to-r ${action.color} p-3 rounded-xl backdrop-blur-md shadow-lg transition-all duration-300 text-center border-2`}
              >
                <div className="text-2xl mb-1">{action.icon}</div>
                <p className="text-white font-bold text-xs">{action.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Dica Motivacional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border-2 border-yellow-500 p-4 rounded-2xl shadow-lg backdrop-blur-md mb-4"
        >
          <h2 className="text-base font-black text-yellow-400 mb-2 flex items-center gap-2">
            💬 DICA DO DIA
          </h2>
          <p className="text-white text-sm font-bold leading-relaxed">
            {getDicaAleatoria()}
          </p>
        </motion.div>

        {/* Sobre o App */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-white/5 to-white/10 border border-white/20 p-4 rounded-2xl backdrop-blur-md"
        >
          <h2 className="text-green-400 font-black text-base mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            SOBRE O APP
          </h2>
          <p className="text-sm text-gray-300 font-bold leading-relaxed">
            Um sistema fitness completo com inteligência artificial, planos adaptados,
            progresso visível e uma jornada gamificada pra manter sua motivação em alta.
            Transforme seu corpo, eleve sua mente.
          </p>
        </motion.div>
      </div>
    </div>
  );
}