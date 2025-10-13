/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Flame,
  TrendingUp,
  Clock,
  ChefHat,
  Search,
  Utensils,
  X,
  Play
} from 'lucide-react';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import Image from 'next/image';

interface Receita {
  id: string;
  titulo: string;
  objetivo: 'massa' | 'emagrecimento';
  descricao: string;
  ingredientes: string[];
  modoPreparo: string;
  tempoPrep: number;
  calorias: number;
  proteinas?: number;
  dicas?: string;
}

const OBJETIVOS = [
  { id: 'massa', nome: 'GANHO DE MASSA', cor: 'bg-emerald-500', icone: '💪' },
  { id: 'emagrecimento', nome: 'EMAGRECIMENTO', cor: 'bg-orange-500', icone: '🔥' }
];

export default function ReceitasPage() {
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [objetivoAtivo, setObjetivoAtivo] = useState<'massa' | 'emagrecimento'>('massa');
  const [busca, setBusca] = useState('');
  const [receitaSelecionada, setReceitaSelecionada] = useState<Receita | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReceitas();
  }, [objetivoAtivo]);

  const fetchReceitas = async () => {
    try {
      setLoading(true);
      const db = getFirestore(app);
      const receitasRef = collection(db, 'receitas_dicas');
      const q = query(receitasRef, where('objetivo', '==', objetivoAtivo));
      
      const snapshot = await getDocs(q);
      const dados: Receita[] = [];
      
      snapshot.forEach(doc => {
        dados.push({ ...doc.data(), id: doc.id } as Receita);
      });
      
      setReceitas(dados);
    } catch (error) {
      console.error('❌ Erro ao buscar receitas:', error);
      setReceitas([]);
    } finally {
      setLoading(false);
    }
  };

  const receitasFiltradas = receitas.filter(receita => {
    const matchBusca = receita.titulo.toLowerCase().includes(busca.toLowerCase()) ||
                       receita.descricao.toLowerCase().includes(busca.toLowerCase());
    return matchBusca;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-gray-200 border-t-emerald-500 rounded-full mx-auto"
          />
          <p className="text-gray-600 font-bold text-base">
            Carregando receitas...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Minimalista */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-bold text-sm">Voltar</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <ChefHat className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-black text-gray-900">Receitas</h1>
            </div>

            <div className="w-20">
              <Image
                src="/images/Logo.png"
                alt="MembrosFit"
                width={40}
                height={40}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filtros */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {OBJETIVOS.map((obj) => (
            <button
              key={obj.id}
              onClick={() => setObjetivoAtivo(obj.id as 'massa' | 'emagrecimento')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                objetivoAtivo === obj.id
                  ? `${obj.cor} text-white shadow-lg`
                  : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'
              }`}
            >
              <span className="text-lg">{obj.icone}</span>
              {obj.nome}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar receitas..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder-gray-500 font-bold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* Grid de Receitas */}
        {receitasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-600 mb-2">
              Nenhuma receita encontrada
            </h3>
            <p className="text-gray-500">
              Tente ajustar os filtros ou a busca
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {receitasFiltradas.map((receita, index) => (
              <motion.div
                key={receita.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setReceitaSelecionada(receita)}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
              >
                {/* Card Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-black text-gray-900 text-lg leading-tight group-hover:text-emerald-600 transition-colors">
                      {receita.titulo}
                    </h3>
                    <div className={`w-3 h-3 rounded-full ${
                      receita.objetivo === 'massa' ? 'bg-emerald-500' : 'bg-orange-500'
                    }`} />
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                    {receita.descricao}
                  </p>
                </div>

                {/* Card Stats */}
                <div className="px-6 pb-6">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span className="font-bold">{receita.tempoPrep}min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4" />
                      <span className="font-bold">{receita.calorias}cal</span>
                    </div>
                    {receita.proteinas && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-bold">{receita.proteinas}g</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Ver Receita
                    </span>
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal da Receita */}
      <AnimatePresence>
        {receitaSelecionada && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setReceitaSelecionada(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-black text-gray-900 mb-1">
                    {receitaSelecionada.titulo}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {receitaSelecionada.descricao}
                  </p>
                </div>
                <button
                  onClick={() => setReceitaSelecionada(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="text-center">
                    <Clock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-bold">TEMPO</p>
                    <p className="text-lg font-black text-gray-900">{receitaSelecionada.tempoPrep}min</p>
                  </div>
                  <div className="text-center">
                    <Flame className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-bold">CALORIAS</p>
                    <p className="text-lg font-black text-gray-900">{receitaSelecionada.calorias}cal</p>
                  </div>
                  {receitaSelecionada.proteinas && (
                    <div className="text-center">
                      <TrendingUp className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 font-bold">PROTEÍNA</p>
                      <p className="text-lg font-black text-gray-900">{receitaSelecionada.proteinas}g</p>
                    </div>
                  )}
                </div>

                {/* Ingredientes */}
                <div>
                  <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-emerald-500" />
                    Ingredientes
                  </h3>
                  <ul className="space-y-2">
                    {receitaSelecionada.ingredientes.map((ing, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-700">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
                        <span className="text-sm font-bold">{ing}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Modo de Preparo */}
                <div>
                  <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-emerald-500" />
                    Modo de Preparo
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-700 text-sm font-bold leading-relaxed whitespace-pre-line">
                      {receitaSelecionada.modoPreparo}
                    </p>
                  </div>
                </div>

                {/* Dicas */}
                {receitaSelecionada.dicas && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-emerald-800 text-sm font-bold">
                      💡 {receitaSelecionada.dicas}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}