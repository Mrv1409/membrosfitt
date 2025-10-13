'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
    Loader2,
    Zap,
    CheckCircle2,
    AlertCircle,
    Brain,
    Utensils,
    Dumbbell,
    Sparkles,
    User
} from 'lucide-react';
import MenuBottomNav from './MenuBottomNav';

// IMPORTAÇÃO DA INTERFACE USERPROFILE DO SEU TYPES.TS
import { UserProfile } from '@/lib/gamification/types';

interface PlanoResponse {
    success: boolean;
    id: string;
    metaCalorica: number;
    message: string;
    error?: string;
    debug?: unknown;
}

export default function GeradorPlano() {
    const [user, loading] = useAuthState(auth);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const router = useRouter();

    // ✅ CARREGAR PERFIL DAS COLEÇÕES CORRETAS
    useEffect(() => {
        const loadUserProfile = async () => {
            if (!user) {
                setProfileLoading(false);
                return;
            }

            try {
                console.log('🔍 Carregando perfil para usuário:', user.uid);

                // 1. Buscar dados básicos na coleção users
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const userData = userDoc.exists() ? userDoc.data() : {};

                console.log('👤 Dados da coleção users:', userData);

                // 2. Buscar perfil detalhado na coleção userProfile
                const profileDoc = await getDoc(doc(db, 'userProfile', user.uid));
                const profileData = profileDoc.exists() ? profileDoc.data() : {};

                console.log('📋 Dados da coleção userProfile:', profileData);

                // 3. ✅ COMBINAR DADOS DAS DUAS COLEÇÕES NA INTERFACE UserProfile
                const combinedProfile: UserProfile = {
                    // Da coleção users
                    userId: user.uid, // Adicionar userId
                    userName: userData.name || profileData.userName, // Prioriza name de users, senão userName de userProfile
                    email: userData.email,
                    city: userData.city, // Estes campos não estão na sua UserProfile do types.ts, mas estão na UserData do Onboarding.
                    state: userData.state, // Se eles forem importantes aqui, adicione-os na UserProfile em types.ts
                    completedProfile: userData.completedProfile || true, // Esta flag virá do Firebase



                    // Da coleção userProfile (e alguns de users para garantir consistência)
                    weight: profileData.weight,
                    height: profileData.height,
                    gender: profileData.gender,
                    goal: profileData.goal,
                    activity_level: profileData.activity_level,
                    biotype: profileData.biotype,
                    weekly_activities: profileData.weekly_activities,
                    meals_day: profileData.meals_day,
                    dietary_restrictions: profileData.dietary_restrictions,
                    born: profileData.born,
                    level: profileData.level || 1, // Default para level se não existir
                    createdAt: profileData.createdAt // Timestamp
                    ,
                    weight_goal: profileData.weight_goal
                };

                if (profileDoc.exists() && profileData.userName) {
                    combinedProfile.completedProfile = true;
                }

                console.log('✅ Perfil combinado:', combinedProfile);
                setUserProfile(combinedProfile);

            } catch (error) {
                console.error('❌ Erro ao carregar perfil:', error);
            } finally {
                setProfileLoading(false);
            }
        };

        loadUserProfile();
    }, [user]);

    // ✅ CORREÇÃO: VERIFICAÇÃO MAIS ROBUSTA DOS CAMPOS ESSENCIAIS
    const isProfileComplete = (profile: UserProfile | null): boolean => {
        if (!profile) {
            console.log('❌ Perfil não encontrado ou nulo.');
            return false;
        }

        // Verifica a flag `completedProfile` que vem do Firebase
        if (profile.completedProfile === true) {
            console.log('✅ completedProfile é true. Perfil completo.');
            return true;
        }

        // Se a flag não for true, faz uma validação mais detalhada dos campos essenciais
        const requiredFields = [
            'userName', 'born', 'gender', 'biotype', 'goal', 'activity_level',
            'weight', 'height', 'weekly_activities', 'meals_day', 'weight_goal'
        ];

        for (const field of requiredFields) {
            const value = profile[field as keyof UserProfile];
            if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '') || (typeof value === 'number' && isNaN(value))) {
                console.log(`❌ Campo '${field}' está faltando ou inválido.`);
                return false;
            }
        }

        console.log('✅ Todos os campos essenciais estão preenchidos. Perfil completo.');
        return true;
    };


    const simulateProgress = () => {
        setProgress(0);
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + Math.random() * 15;
            });
        }, 500);
        return interval;
    };

    const gerarPlano = async () => {
        if (!user) {
            setStatus('error');
            setErrorMessage('Você precisa estar logado para gerar um plano');
            return;
        }

        // ✅ VERIFICAÇÃO ATUALIZADA
        if (!isProfileComplete(userProfile)) {
            setStatus('error');
            setErrorMessage('Seu perfil está incompleto. Complete o onboarding primeiro para gerar um plano personalizado. Redirecionando...');

            // Redirecionar para onboarding se necessário
            setTimeout(() => {
                router.push('/onboarding');
            }, 3000);
            return;
        }

        setIsGenerating(true);
        setStatus('generating');
        setErrorMessage('');

        const progressInterval = simulateProgress();

        try {
            console.log('🚀 Iniciando geração de plano...');

            // Obter token com retry
            let token;
            try {
                token = await user.getIdToken(true);
                console.log('✅ Token obtido com sucesso');
            } catch (tokenError) {
                console.error('❌ Erro ao obter token:', tokenError);
                throw new Error('Erro de autenticação. Tente fazer login novamente.');
            }

            console.log('📡 Fazendo requisição para /api/gerar-plano');

            const response = await fetch('/api/gerar-plano', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(120000), // 2 minutos
            });

            console.log('📥 Status da resposta:', response.status);

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Sessão expirada. Faça login novamente.');
                } else if (response.status === 403) {
                    throw new Error('Permissão negada. Verifique suas configurações de perfil.');
                } else if (response.status === 429) {
                    throw new Error('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
                } else if (response.status >= 500) {
                    throw new Error('Erro interno do servidor. Tente novamente em alguns minutos.');
                }
            }

            const data: PlanoResponse = await response.json();
            console.log('📋 Resposta da API:', data);

            if (!response.ok) {
                throw new Error(data.error || data.message || `Erro ${response.status}: ${response.statusText}`);
            }

            if (!data.success || !data.id) {
                throw new Error(data.error || 'Falha ao gerar plano. Tente novamente.');
            }

            // Sucesso
            clearInterval(progressInterval);
            setProgress(100);
            setStatus('success');

            console.log('✅ Plano gerado com sucesso:', {
                id: data.id,
                metaCalorica: data.metaCalorica
            });

            // Redirect após sucesso
            setTimeout(() => {
                router.push(`/dashboard/plano/${data.id}`);
            }, 2000);

        } catch (error) {
            clearInterval(progressInterval);
            setStatus('error');

            console.error('❌ Erro ao gerar plano:', error);

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    setErrorMessage('Tempo limite excedido. Tente novamente.');
                } else {
                    setErrorMessage(error.message);
                }
            } else {
                setErrorMessage('Erro inesperado ao gerar plano. Tente novamente.');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    // Loading states
    if (loading || profileLoading) {
        return (
            <>
                <div className="flex items-center justify-center p-8 min-h-[50vh]">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Carregando informações...</p>
                    </div>
                </div>
                <MenuBottomNav />
            </>
        );
    }

    // User not authenticated
    if (!user) {
        return (
            <>
                <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 text-center">
                    <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Login Necessário
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Você precisa estar logado para gerar seu plano personalizado
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        Fazer Login
                    </button>
                </div>
                <MenuBottomNav />
            </>
        );
    }

    // ✅ VERIFICAÇÃO CORRIGIDA: Agora só bloqueia se realmente não tiver completedProfile = true
    if (!isProfileComplete(userProfile)) {
        return (
            <>
                <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 text-center">
                    <User className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Complete seu Perfil
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Para gerar um plano personalizado, precisamos que você complete o onboarding.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                        <p className="text-amber-800 text-sm">
                            <strong>Informações necessárias:</strong><br />
                            Nome, data de nascimento, gênero, biotipo, objetivo, nível de atividade, peso e altura.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/onboarding')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            Completar Onboarding
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/perfil')}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            Ver Perfil Atual
                        </button>
                    </div>
                </div>
                <MenuBottomNav />
            </>
        );
    }

    return (
        <>
            <div className="max-w-2xl mx-auto pb-20">
                {/* ✅ HEADER ATUALIZADO COM DADOS CORRETOS */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="bg-green-100 rounded-full p-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Perfil Completo ✅</p>
                            <p className="text-sm text-gray-600">
                                Olá, {userProfile?.userName || 'Usuário'}! Seu perfil está pronto para gerar planos personalizados.
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Objetivo: {userProfile?.goal} | Biotipo: {userProfile?.biotype}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main generator card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-8 border border-blue-100">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <div className="relative">
                                <Brain className="h-12 w-12 text-blue-600" />
                                <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Gerador de Plano IA
                        </h2>
                        <p className="text-gray-600 text-lg">
                            Crie seu plano personalizado de nutrição e treino em segundos
                        </p>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="flex items-center space-x-3 bg-white rounded-lg p-4 shadow-sm">
                            <Utensils className="h-8 w-8 text-green-600" />
                            <div>
                                <h4 className="font-semibold text-gray-900">Plano Nutricional</h4>
                                <p className="text-sm text-gray-600">Refeições personalizadas</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 bg-white rounded-lg p-4 shadow-sm">
                            <Dumbbell className="h-8 w-8 text-red-600" />
                            <div>
                                <h4 className="font-semibold text-gray-900">Plano de Treino</h4>
                                <p className="text-sm text-gray-600">Exercícios específicos</p>
                            </div>
                        </div>
                    </div>

                    {/* Status-based content */}
                    {status === 'idle' && (
                        <div className="text-center">
                            <button
                                onClick={gerarPlano}
                                disabled={isGenerating}
                                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                <Zap className="h-6 w-6 mr-2 group-hover:animate-pulse" />
                                Gerar Meu Plano Personalizado
                            </button>
                            <p className="text-sm text-gray-500 mt-3">
                                ⚡ Powered by IA MarvinCode - Groq
                            </p>
                        </div>
                    )}

                    {status === 'generating' && (
                        <div className="text-center space-y-6">
                            <div className="relative">
                                <div className="flex items-center justify-center space-x-2 mb-4">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                    <span className="text-xl font-semibold text-gray-900">
                                        Gerando seu plano...
                                    </span>
                                </div>

                                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                                    <div
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>

                                <div className="text-sm text-gray-600 space-y-2">
                                    {progress < 30 && <p>🧠 Analisando seu perfil...</p>}
                                    {progress >= 30 && progress < 60 && <p>🍽️ Criando plano nutricional...</p>}
                                    {progress >= 60 && progress < 90 && <p>💪 Montando treinos personalizados...</p>}
                                    {progress >= 90 && <p>✨ Finalizando detalhes...</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-center space-y-4">
                            <div className="flex items-center justify-center">
                                <CheckCircle2 className="h-16 w-16 text-green-600 animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">
                                Plano Criado com Sucesso! 🎉
                            </h3>
                            <p className="text-gray-600">
                                Redirecionando para visualizar seu plano personalizado...
                            </p>
                            <div className="flex items-center justify-center space-x-2">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                <span className="text-sm text-blue-600">Carregando...</span>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center space-y-4">
                            <div className="flex items-center justify-center">
                                <AlertCircle className="h-16 w-16 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">
                                Ops! Algo deu errado
                            </h3>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-700 text-sm">
                                    {errorMessage}
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={() => {
                                        setStatus('idle');
                                        setErrorMessage('');
                                        setProgress(0);
                                    }}
                                    className="inline-flex items-center px-6 py-3 text-base font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                    Tentar Novamente
                                </button>
                                {errorMessage.includes('perfil') && (
                                    <button
                                        onClick={() => router.push('/onboarding')}
                                        className="inline-flex items-center px-6 py-3 text-base font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Completar Onboarding
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Additional info */}
                    {status === 'idle' && (
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <div className="text-center text-sm text-gray-500 space-y-2">
                                <p>✅ Baseado no seu perfil e objetivos</p>
                                <p>⚡ Geração em tempo real com IA</p>
                                <p>💾 Salvo automaticamente na sua conta</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Benefits card */}
                <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">O que você receberá:</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center space-x-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Plano nutricional completo para 7 dias</span>
                        </li>
                        <li className="flex items-center space-x-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Rotina de treinos específica para seu biotipo</span>
                        </li>
                        <li className="flex items-center space-x-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Cálculo preciso de macronutrientes</span>
                        </li>
                        <li className="flex items-center space-x-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Observações e dicas personalizadas</span>
                        </li>
                    </ul>
                </div>
            </div>

            <MenuBottomNav />
        </>
    );
}