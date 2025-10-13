'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContexts';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuthContext();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validações
    if (!validateEmail(email)) {
      setError('Por favor, insira um email válido');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erro ao fazer login. Por favor, tente novamente.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center mb-8"
        >
          <Image
            src="/images/Logo.png"
            alt="MembrosFit"
            width={180}
            height={180}
            className="rounded-3xl"
            priority
          />
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md"
        >
          <h2 className="text-2xl sm:text-3xl font-black text-white text-center mb-2">
            Bem-vindo de volta!
          </h2>
          <p className="text-sm text-green-500 font-bold text-center mb-6">
            Entre para continuar sua jornada
          </p>

          {/* Erro */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-400 rounded-xl text-sm font-bold"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full pl-11 pr-4 py-3 bg-black/30 border-2 rounded-xl text-white placeholder-gray-500 font-bold focus:outline-none transition-all ${
                    email && !validateEmail(email)
                      ? 'border-red-500'
                      : 'border-white/10 focus:border-green-500'
                  }`}
                  placeholder="seu@email.com"
                />
              </div>
              {email && !validateEmail(email) && (
                <p className="text-xs text-red-400 font-bold mt-1">Email inválido</p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full pl-11 pr-12 py-3 bg-black/30 border-2 rounded-xl text-white placeholder-gray-500 font-bold focus:outline-none transition-all ${
                    password && password.length < 6
                      ? 'border-red-500'
                      : 'border-white/10 focus:border-green-500'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password && password.length < 6 && (
                <p className="text-xs text-red-400 font-bold mt-1">Mínimo 6 caracteres</p>
              )}
            </div>

            {/* Link Esqueci Senha */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  // TODO: Implementar reset de senha
                  alert('Funcionalidade de reset de senha em desenvolvimento');
                }}
                className="text-sm text-gray-400 hover:text-green-400 font-bold transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Botão */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !validateEmail(email) || password.length < 6}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-black py-3 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </motion.button>
          </form>

          {/* Link para Registro */}
          <p className="mt-6 text-center text-sm text-gray-300 font-bold">
            Não tem conta?{' '}
            <button
              onClick={() => router.push('/register')}
              className="text-green-400 hover:text-green-300 font-black transition-colors"
            >
              Criar Conta
            </button>
          </p>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-gray-600 font-bold mt-8"
        >
          © 2025 MembrosFit. Todos os direitos reservados.
        </motion.p>
      </motion.div>
    </div>
  );
}