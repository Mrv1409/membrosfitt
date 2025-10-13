'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContexts';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Eye, EyeOff, Check, X, Mail, Lock, User } from 'lucide-react';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signUp } = useAuthContext();

  // Validações
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!name.trim()) {
      setError('Por favor, insira seu nome');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor, insira um email válido');
      return;
    }

    if (!isPasswordValid) {
      setError('A senha não atende aos requisitos mínimos');
      return;
    }

    if (!passwordsMatch) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, name);
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Erro ao criar conta. Tente novamente.';
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
            Criar Conta
          </h2>
          <p className="text-sm text-green-500 font-bold text-center mb-6">
            Seu PersoNutri Digital
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
            {/* Nome */}
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-gray-300 mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-black/30 border-2 border-white/10 rounded-xl text-white placeholder-gray-500 font-bold focus:border-green-500 focus:outline-none transition-all"
                  placeholder="Seu nome"
                />
              </div>
            </div>

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
                  className="w-full pl-11 pr-4 py-3 bg-black/30 border-2 border-white/10 rounded-xl text-white placeholder-gray-500 font-bold focus:border-green-500 focus:outline-none transition-all"
                  placeholder="seu@email.com"
                />
              </div>
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
                  className="w-full pl-11 pr-12 py-3 bg-black/30 border-2 border-white/10 rounded-xl text-white placeholder-gray-500 font-bold focus:border-green-500 focus:outline-none transition-all"
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
            </div>

            {/* Requisitos de Senha */}
            {password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-black/30 border border-white/10 rounded-xl p-3 space-y-2"
              >
                <p className="text-xs font-bold text-gray-300 mb-2">Requisitos da senha:</p>
                {[
                  { text: 'Mínimo 8 caracteres', met: passwordRequirements.minLength },
                  { text: 'Letra maiúscula', met: passwordRequirements.hasUpperCase },
                  { text: 'Letra minúscula', met: passwordRequirements.hasLowerCase },
                  { text: 'Um número', met: passwordRequirements.hasNumber },
                  { text: 'Caractere especial (!@#$...)', met: passwordRequirements.hasSpecialChar },
                ].map((req, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {req.met ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-gray-600" />
                    )}
                    <span className={`text-xs font-bold ${req.met ? 'text-green-400' : 'text-gray-500'}`}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Confirmar Senha */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-300 mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`w-full pl-11 pr-12 py-3 bg-black/30 border-2 rounded-xl text-white placeholder-gray-500 font-bold focus:outline-none transition-all ${
                    confirmPassword
                      ? passwordsMatch
                        ? 'border-green-500'
                        : 'border-red-500'
                      : 'border-white/20'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && (
                <p className={`text-xs font-bold mt-2 ${passwordsMatch ? 'text-green-400' : 'text-red-400'}`}>
                  {passwordsMatch ? '✓ Senhas conferem' : '✗ Senhas não coincidem'}
                </p>
              )}
            </div>

            {/* Botão */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !isPasswordValid || !passwordsMatch || !name || !validateEmail(email)}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-black py-3 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </motion.button>
          </form>

          {/* Link para Login */}
          <p className="mt-6 text-center text-sm text-gray-300 font-bold">
            Já tem conta?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-green-400 hover:text-green-300 font-black transition-colors"
            >
              Entrar
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}