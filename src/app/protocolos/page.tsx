'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Filter,
  Search,
  Clock,
  TrendingUp,
  Award,
  X,
  Loader2
} from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import Image from 'next/image';
import MenuBottomNav from '@/components/MenuBottomNav';

interface Video {
  id: string;
  titulo: string;
  descricao: string;
  categoria: 'peito' | 'costas' | 'pernas' | 'ombros' | 'bracos' | 'abdomen' | 'cardio' | 'fullbody';
  nivel: 'iniciante' | 'intermediario' | 'avancado';
  duracao: number;
  cloudinaryUrl: string;
  thumbnailUrl: string;
  instrutor: string;
  pontos: number;
}

const CATEGORIAS = [
  { id: 'todos', nome: 'Todos', emoji: '🎯' },
  { id: 'peito', nome: 'Peito', emoji: '💪' },
  { id: 'costas', nome: 'Costas', emoji: '🔥' },
  { id: 'pernas', nome: 'Pernas', emoji: '🦵' },
  { id: 'ombros', nome: 'Ombros', emoji: '⚡' },
  { id: 'bracos', nome: 'Braços', emoji: '💪' },
  { id: 'abdomen', nome: 'Abdômen', emoji: '🎯' },
  { id: 'cardio', nome: 'Cardio', emoji: '❤️' },
  { id: 'fullbody', nome: 'Full Body', emoji: '🏋️' }
];

const NIVEIS = [
  { id: 'todos', nome: 'Todos os Níveis', emoji: '🎯' },
  { id: 'iniciante', nome: 'Iniciante', emoji: '🟢' },
  { id: 'intermediario', nome: 'Intermediário', emoji: '🟡' },
  { id: 'avancado', nome: 'Avançado', emoji: '🔴' }
];

const VIDEOS_POR_PAGINA = 9;

export default function ProtocolosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosAssistidos, setVideosAssistidos] = useState<Set<string>>(new Set());
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos');
  const [nivelAtivo, setNivelAtivo] = useState('todos');
  const [busca, setBusca] = useState('');
  const [videoSelecionado, setVideoSelecionado] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [videosVisiveis, setVideosVisiveis] = useState(VIDEOS_POR_PAGINA);
  const [loadingMore, setLoadingMore] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // ✅ CORREÇÃO: Aguarda autenticação estar pronta antes de buscar dados
  useEffect(() => {
    const auth = getAuth(app);
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ Usuário autenticado:', user.uid);
        setAuthReady(true);
      } else {
        console.log('❌ Usuário não autenticado');
        setLoading(false);
        setAuthReady(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Busca vídeos apenas quando auth estiver pronto
  useEffect(() => {
    if (authReady) {
      fetchVideosAssistidos();
      fetchVideos();
    }
  }, [authReady]);

  const fetchVideosAssistidos = async () => {
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore(app);
      const assistidosRef = collection(db, 'users', user.uid, 'videosAssistidos');
      const snapshot = await getDocs(assistidosRef);
      
      const ids = new Set<string>();
      snapshot.forEach(doc => {
        ids.add(doc.id);
      });
      
      setVideosAssistidos(ids);
      console.log('✅ Vídeos assistidos carregados:', ids.size);
    } catch (error) {
      console.error('❌ Erro ao buscar vídeos assistidos:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      const db = getFirestore(app);
      const videosRef = collection(db, 'protocolos');
      
      console.log('🔍 Buscando vídeos da coleção protocolos...');
      const snapshot = await getDocs(videosRef);
      
      console.log('📦 Snapshot recebido. Total de documentos:', snapshot.size);
      
      const videosData: Video[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log('📹 Vídeo encontrado:', doc.id, data.titulo);
        videosData.push({ ...data, id: doc.id } as Video);
      });
      
      setVideos(videosData);
      console.log('✅ Vídeos carregados com sucesso:', videosData.length);
      console.log('📋 Lista completa:', videosData.map(v => v.titulo));
    } catch (error) {
      console.error('❌ Erro ao buscar vídeos:', error);
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const marcarComoAssistido = async (video: Video) => {
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore(app);
      
      await setDoc(doc(db, 'users', user.uid, 'videosAssistidos', video.id), {
        videoId: video.id,
        assistidoEm: new Date(),
        pontos: video.pontos
      });

      await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          acao: 'VIDEO_ASSISTIDO',
          detalhes: {
            videoId: video.id,
            titulo: video.titulo,
            categoria: video.categoria
          }
        })
      });

      setVideosAssistidos(prev => new Set(prev).add(video.id));
      setVideoSelecionado(null);
      
      console.log(`✅ Video concluído! +${video.pontos} pontos`);
    } catch (error) {
      console.error('❌ Erro ao marcar vídeo:', error);
    }
  };

  const videosFiltrados = videos.filter(video => {
    const matchCategoria = categoriaAtiva === 'todos' || video.categoria === categoriaAtiva;
    const matchNivel = nivelAtivo === 'todos' || video.nivel === nivelAtivo;
    const matchBusca = video.titulo.toLowerCase().includes(busca.toLowerCase()) ||
                       video.descricao.toLowerCase().includes(busca.toLowerCase());
    return matchCategoria && matchNivel && matchBusca;
  });

  const videosExibidos = videosFiltrados.slice(0, videosVisiveis);
  const temMaisVideos = videosVisiveis < videosFiltrados.length;

  const carregarMais = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVideosVisiveis(prev => prev + VIDEOS_POR_PAGINA);
      setLoadingMore(false);
    }, 500);
  };

  useEffect(() => {
    setVideosVisiveis(VIDEOS_POR_PAGINA);
  }, [categoriaAtiva, nivelAtivo, busca]);

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
            Carregando protocolos...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20 md:pb-8">
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
                className="rounded-3xl w-20 h-20 sm:w-32   sm:h-32 lg:w-48 lg:h-48"
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
            className="text-center mb-6"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-4xl font-black text-white mb-3 drop-shadow-[0_0_10px_#00FF8B]">
              PROTOCOLOS
            </h1>
            <p className="text-sm sm:text-base text-gray-300 font-bold max-w-2xl mx-auto">
              Aprenda com vídeos profissionais e ganhe pontos
            </p>
          </motion.div>
        </div>
      </motion.header>

      {/* Barra de Busca */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="px-4 sm:px-6 lg:px-8 mb-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título ou descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-white/5 border-2 border-white/20 rounded-xl py-3 pl-12 pr-4 text-sm sm:text-base text-white placeholder-gray-400 font-bold focus:border-green-500 focus:outline-none transition-all duration-300"
            />
          </div>
        </div>
      </motion.div>

      {/* Filtros de Categoria */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="px-4 sm:px-6 lg:px-8 mb-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-green-400" />
            <h2 className="text-base sm:text-lg font-black text-white">Categorias</h2>
          </div>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIAS.map((cat) => (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCategoriaAtiva(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-300 ${
                  categoriaAtiva === cat.id
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border-2 border-white/20'
                }`}
              >
                <span className="text-base">{cat.emoji}</span>
                <span>{cat.nome}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Filtros de Nível */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="px-4 sm:px-6 lg:px-8 mb-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h2 className="text-base sm:text-lg font-black text-white">Nível de Dificuldade</h2>
          </div>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {NIVEIS.map((nivel) => (
              <motion.button
                key={nivel.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setNivelAtivo(nivel.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-300 ${
                  nivelAtivo === nivel.id
                    ? nivel.id === 'iniciante'
                      ? 'bg-green-500 text-white shadow-lg'
                      : nivel.id === 'intermediario'
                      ? 'bg-yellow-500 text-white shadow-lg'
                      : nivel.id === 'avancado'
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-green-500 text-white shadow-lg'
                    : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border-2 border-white/20'
                }`}
              >
                <span className="text-base">{nivel.emoji}</span>
                <span>{nivel.nome}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Contador de Resultados */}
      {videosFiltrados.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 sm:px-6 lg:px-8 mb-6"
        >
          <div className="max-w-7xl mx-auto">
            <p className="text-sm sm:text-base text-gray-300 font-bold">
              Mostrando <span className="text-green-400">{videosExibidos.length}</span> de{' '}
              <span className="text-white">{videosFiltrados.length}</span> vídeos
            </p>
          </div>
        </motion.div>
      )}

      {/* Grid de Vídeos */}
      <div className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          {videosFiltrados.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-2xl backdrop-blur-md"
            >
              <Search className="w-20 h-20 text-gray-600 mx-auto mb-6" />
              <h3 className="text-2xl font-black text-white mb-4">
                Nenhum vídeo encontrado
              </h3>
              <p className="text-sm sm:text-base text-gray-300 font-bold">
                Tente ajustar os filtros ou a busca
              </p>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {videosExibidos.map((video, index) => {
                  const jaAssistido = videosAssistidos.has(video.id);
                  
                  return (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className="bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-2xl overflow-hidden backdrop-blur-md hover:border-green-500 transition-all duration-300 cursor-pointer group"
                      onClick={() => setVideoSelecionado(video)}
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-black">
                        <Image
                          src={video.thumbnailUrl || '/images/Logo.png'}
                          alt={video.titulo}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/Logo.png';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Play className="w-16 h-16 text-green-400" />
                        </div>
                        {jaAssistido && (
                          <div className="absolute top-3 right-3 bg-green-500 rounded-full p-2">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-300" />
                          <span className="text-sm font-bold text-white">{video.duracao} min</span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-5">
                        <h3 className="text-lg font-black text-white mb-2 line-clamp-2">
                          {video.titulo}
                        </h3>
                        <p className="text-sm font-bold text-gray-300 mb-4 line-clamp-2">
                          {video.descricao}
                        </p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-xs text-gray-300 font-bold mb-1">Instrutor</p>
                            <p className="text-sm font-black text-white">{video.instrutor}</p>
                          </div>
                          <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2">
                            <Award className="w-4 h-4 text-green-400" />
                            <span className="text-sm font-black text-green-400">+{video.pontos}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <span className={`text-xs font-black px-3 py-1 rounded-lg ${
                            video.nivel === 'iniciante' ? 'bg-green-500/20 text-green-400' :
                            video.nivel === 'intermediario' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {video.nivel}
                          </span>
                          <span className="text-xs font-black px-3 py-1 rounded-lg bg-white/10 text-gray-300">
                            {CATEGORIAS.find(c => c.id === video.categoria)?.nome}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Botão Carregar Mais */}
              {temMaisVideos && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 flex justify-center"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={carregarMais}
                    disabled={loadingMore}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 px-12 rounded-xl flex items-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Carregando...</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-6 h-6" />
                        <span>Carregar Mais Vídeos</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal do Player */}
      <AnimatePresence>
        {videoSelecionado && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setVideoSelecionado(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-r from-white/10 to-white/5 border-2 border-white/20 rounded-2xl max-w-4xl w-full overflow-hidden my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header do Modal */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-black text-white line-clamp-1 pr-2">
                  {videoSelecionado.titulo}
                </h2>
                <button
                  onClick={() => setVideoSelecionado(null)}
                  className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg flex-shrink-0"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Player */}
              <div className="aspect-video bg-black">
                <video
                  src={videoSelecionado.cloudinaryUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              </div>

              {/* Informações */}
              <div className="p-6">
                <p className="text-base text-gray-300 font-bold mb-6">
                  {videoSelecionado.descricao}
                </p>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-gray-300 font-bold mb-1">Instrutor</p>
                      <p className="text-sm font-black text-white">{videoSelecionado.instrutor}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-300 font-bold mb-1">Duração</p>
                      <p className="text-sm font-black text-white">{videoSelecionado.duracao} min</p>
                    </div>
                  </div>

                  {!videosAssistidos.has(videoSelecionado.id) && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => marcarComoAssistido(videoSelecionado)}
                      className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Concluir (+{videoSelecionado.pontos} pts)</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu de Navegação Inferior */}
      <MenuBottomNav />
    </div>
  );
}