'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, getFirestore, Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { 
  LayoutList, 
  Zap,
  ArrowLeft,
  Calendar,
  TrendingUp,
  Flame,
  Target,
  Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PlanoCard } from '@/components/PlanoCard';
import MenuBottomNav from '@/components/MenuBottomNav';
import Image from 'next/image';

interface DiaTreino {
  treino: boolean;
  descanso: boolean;
}

interface Plano {
  id: string;
  nomeUsuario: string;
  metadata: {
    criadoEm: Timestamp;
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
  tipoPlano?: string;
  objetivoPlano?: string;
}

export default function MeusPlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPlanos = async () => {
      setLoading(true);
      const authInstance = getAuth(app);
      const user = authInstance.currentUser;

      if (!user) {
        setLoading(false);
        router.push('/login');
        return;
      }

      const db = getFirestore(app);
      const ref = collection(db, 'users', user.uid, 'planos');

      try {
        const snapshot = await getDocs(ref);

        const dados = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            metadata: {
              ...data.metadata,
              criadoEm: data.metadata?.criadoEm instanceof Timestamp ? data.metadata.criadoEm : Timestamp.fromDate(data.metadata?.criadoEm?.toDate?.() || new Date()),
            },
          } as Plano;
        });

        dados.sort((a, b) => b.metadata.criadoEm.toMillis() - a.metadata.criadoEm.toMillis());
        setPlanos(dados);
      } catch (error) {
        console.error("Erro ao buscar planos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanos();
  }, [router]);

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
            Carregando seus planos...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20 md:pb-8 w-full">
      
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
                className="rounded-3xl w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24"
                priority
              />
            </motion.div>

            <div className="w-[72px] sm:w-[88px]" />
          </div>

          {/* Título e Descrição */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 drop-shadow-[0_0_10px_#00FF8B]">
              MEUS PLANOS
            </h1>
            <p className="text-sm sm:text-base text-gray-300 font-bold max-w-2xl mx-auto">
              Todos os seus planos personalizados de treino e nutrição em um só lugar
            </p>
          </motion.div>

          {/* Botão Criar Novo Plano (se tiver planos) */}
          {planos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/gerar')}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-6 sm:px-8 rounded-xl flex items-center gap-2 shadow-lg text-sm sm:text-base"
              >
                <Plus className="w-5 h-5" />
                <span>Criar Novo Plano</span>
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Estatísticas Redesenhadas (só se tiver planos) */}
      {planos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="px-4 sm:px-6 lg:px-8 mb-8"
        >
          <div className="max-w-7xl mx-auto">
            
            {/* Título da Seção */}
            <div className="flex items-center gap-2 mb-4">
              <LayoutList className="w-5 h-5 text-green-400" />
              <h2 className="text-lg sm:text-xl font-black text-white">
                Visão Geral
              </h2>
            </div>

            {/* Stats em Cards Horizontais */}
            <div className="space-y-3">
              
              {/* Card Total de Planos */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-xl p-4 backdrop-blur-md flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/30 p-3 rounded-lg">
                    <LayoutList className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-300 font-bold">Total de Planos</p>
                    <p className="text-2xl sm:text-3xl font-black text-white">{planos.length}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-300 font-bold">Criados</p>
                  <p className="text-sm font-black text-green-400">Ativos</p>
                </div>
              </motion.div>

              {/* Grid 2 Colunas: Última Data + Meta Calórica */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-xl p-4 backdrop-blur-md"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-green-500/30 p-2.5 rounded-lg">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-300 font-bold">Último Plano</p>
                  </div>
                  <p className="text-base sm:text-lg font-black text-white ml-12">
                    {planos[0]?.metadata.criadoEm.toDate().toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-xl p-4 backdrop-blur-md"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-green-500/30 p-2.5 rounded-lg">
                      <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-300 font-bold">Meta Atual</p>
                  </div>
                  <p className="text-base sm:text-lg font-black text-white ml-12">
                    {planos[0]?.planoNutricional.metaCalorica} <span className="text-sm">kcal/dia</span>
                  </p>
                </motion.div>

              </div>

              {/* Grid 2 Colunas: Nível + TMB */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-xl p-4 backdrop-blur-md"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-green-500/30 p-2.5 rounded-lg">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-300 font-bold">Nível de Treino</p>
                  </div>
                  <p className="text-base sm:text-lg font-black text-white capitalize ml-12">
                    {planos[0]?.planoTreino.nivel || 'N/A'}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-xl p-4 backdrop-blur-md"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-green-500/30 p-2.5 rounded-lg">
                      <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-300 font-bold">Objetivo</p>
                  </div>
                  <p className="text-base sm:text-lg font-black text-white capitalize ml-12 truncate">
                    {planos[0]?.metadata.dadosUsuario?.objetivo || 'N/A'}
                  </p>
                </motion.div>

              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Conteúdo Principal */}
      <div className="px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        <div className="max-w-7xl mx-auto">
          
          {planos.length === 0 ? (
            /* Estado Vazio Redesenhado */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-2xl sm:rounded-3xl backdrop-blur-md p-12 sm:p-20 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="mb-8"
              >
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
                  <Zap className="w-24 h-24 sm:w-32 sm:h-32 text-green-400 relative" />
                </div>
              </motion.div>
              
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-2xl sm:text-3xl font-black text-white mb-4"
              >
                Nenhum Plano Criado
              </motion.h3>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-sm sm:text-base text-gray-300 font-bold mb-10 max-w-md mx-auto leading-relaxed"
              >
                Comece sua jornada fitness agora! Gere seu primeiro plano personalizado de treino e nutrição com nossa IA inteligente.
              </motion.p>
              
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/gerar')}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 px-10 rounded-xl flex items-center gap-3 mx-auto shadow-lg text-base sm:text-lg"
              >
                <Zap className="w-6 h-6" />
                <span>Gerar Meu Primeiro Plano</span>
              </motion.button>
            </motion.div>
          ) : (
            /* Grid de Planos Redesenhado */
            <>
              {/* Cabeçalho da Seção */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="flex items-center justify-between mb-6"
              >
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" />
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Todos os Planos ({planos.length})
                  </h2>
                </div>
              </motion.div>

              {/* Grid de Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {planos.map((plano, index) => (
                  <motion.div
                    key={plano.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + (index * 0.1) }}
                  >
                    <PlanoCard plano={plano} />
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Menu de Navegação Inferior */}
      <MenuBottomNav />
    </div>
  );
}