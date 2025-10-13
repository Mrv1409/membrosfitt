'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { app } from '@/lib/firebase';
import { Loader2, Pencil, Zap, AlertCircle, User, Target, Activity, ArrowLeft, Lock, Clock } from 'lucide-react';
import MenuBottomNav from '@/components/MenuBottomNav';
import FitnessOnboarding from '@/components/onboarding/FitnessOnboarding';
import { UserProfile } from '@/lib/gamification/types';
import { 
  checkUserHasActivePlan, 
  checkSubscriptionStatus,
  type SubscriptionInfo 
} from '@/lib/subscription-helpers';

const isValidNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;

  const today = new Date();
  let birth: Date;
  if (birthDate.includes('.')) {
    const parts = birthDate.split('.');
    birth = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  } else {
    birth = new Date(birthDate);
  }

  if (isNaN(birth.getTime())) {
    const yearMatch = birthDate.match(/\d{4}/);
    if (yearMatch) {
      const birthYear = parseInt(yearMatch[0]);
      return today.getFullYear() - birthYear;
    }
    return 0;
  }

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};
//eslint-disable-next-line
const normalizeUserProfileData = (data: any, userId: string): UserProfile => {
  return {
    userId: userId,
    userName: data.userName || data.name || null,
    activity_level: data.activity_level || null,
    biotype: data.biotype || null,
    born: data.born || null,
    dietary_restrictions: data.dietary_restrictions || [],
    gender: data.gender || null,
    goal: data.goal || null,
    height: isValidNumber(data.height) ? data.height : null,
    level: isValidNumber(data.level) ? data.level : null,
    meals_day: isValidNumber(data.meals_day) ? data.meals_day : null,
    weekly_activities: isValidNumber(data.weekly_activities) ? data.weekly_activities : null,
    weight: isValidNumber(data.weight) ? data.weight : null,
    weight_goal: isValidNumber(data.weight_goal) ? data.weight_goal : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
  };
};

const isProfileComplete = (userData: UserProfile): boolean => {
  if (!userData) {
    console.log('❌ UserData não existe');
    return false;
  }

  const requiredFieldsCheck = {
    userName: typeof userData.userName === 'string' && userData.userName.trim() !== '',
    weight: typeof userData.weight === 'number' && userData.weight > 0,
    height: typeof userData.height === 'number' && userData.height > 0,
    goal: typeof userData.goal === 'string' && userData.goal.trim() !== '',
    gender: typeof userData.gender === 'string' && userData.gender.trim() !== '',
    biotype: typeof userData.biotype === 'string' && userData.biotype.trim() !== '',
    born: typeof userData.born === 'string' && userData.born.trim() !== '',
    weekly_activities: typeof userData.weekly_activities === 'number' && userData.weekly_activities > 0,
    meals_day: typeof userData.meals_day === 'number' && userData.meals_day > 0,
  };

  console.log('🔍 Verificando perfil completo:', requiredFieldsCheck);
  console.log('📊 Dados do usuário:', userData);

  const isComplete = Object.values(requiredFieldsCheck).every(Boolean);
  console.log(`🎯 Perfil completo: ${isComplete ? '✅ SIM' : '❌ NÃO'}`);

  return isComplete;
};

export default function PerfilPage() {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [age, setAge] = useState<number>(0);
  
  // Estados para controle de plano e assinatura
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [checkingPlan, setCheckingPlan] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(app), async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      setCurrentUserUid(user.uid);

      try {
        const db = getFirestore(app);
        
        // Busca dados do userProfile
        const profileRef = doc(db, 'userProfile', user.uid);
        const profileSnap = await getDoc(profileRef);

        // Busca dados do users (para subscription)
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (profileSnap.exists()) {
          const data = profileSnap.data();
          console.log('Dados brutos do Firestore (PerfilPage):', data);

          const normalizedData = normalizeUserProfileData(data, user.uid);
          console.log('Dados normalizados (PerfilPage):', normalizedData);

          setUserData(normalizedData);

          if (normalizedData.born) {
            const calculatedAge = calculateAge(normalizedData.born);
            setAge(calculatedAge);
          }

          if (!isProfileComplete(normalizedData)) {
            console.log('❌ Perfil incompleto, mostrando onboarding');
            setShowOnboarding(true);
          } else {
            console.log('✅ Perfil completo!');
          }
        } else {
          console.log('Perfil não existe, mostrando onboarding');
          setShowOnboarding(true);
        }

        // Verifica se já tem plano ativo
        if (userSnap.exists()) {
          const userDataFromUsers = userSnap.data();
          
          // Verifica plano ativo
          const planExists = await checkUserHasActivePlan(user.uid);
          setHasActivePlan(planExists);
          console.log(`📋 Plano ativo: ${planExists ? '✅ SIM' : '❌ NÃO'}`);

          // Verifica status da assinatura
          const subInfo = checkSubscriptionStatus(userDataFromUsers);
          setSubscriptionInfo(subInfo);
          console.log('💳 Status da assinatura:', subInfo);
        }

      } catch (error) {
        console.error('Erro ao buscar dados do perfil (PerfilPage):', error);
        setShowOnboarding(true);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleOnboardingComplete = async (data: UserProfile) => {
    if (!currentUserUid) return;

    try {
      const db = getFirestore(app);
      const ref = doc(db, 'userProfile', currentUserUid);

      const dataToSave: Partial<UserProfile> = {
        ...data,
        createdAt: Timestamp.now(),
      };

      console.log('💾 Salvando dados no Firebase (PerfilPage):', dataToSave);
      await setDoc(ref, dataToSave, { merge: true });

      setUserData(data);
      setShowOnboarding(false);

      if (data.born) {
        setAge(calculateAge(data.born));
      }

      console.log('✅ Perfil salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil (PerfilPage):', error);
      alert('Erro ao salvar perfil. Tente novamente.');
    }
  };

  const isComplete = userData && isProfileComplete(userData);

  const handleGeneratePlan = async () => {
    console.log('🚀 Tentando gerar plano...');
    setCheckingPlan(true);

    try {
      if (!isComplete) {
        console.log('❌ Perfil incompleto!');
        alert('Complete seu perfil antes de gerar o plano!');
        return;
      }

      if (!currentUserUid) {
        alert('Erro ao identificar usuário. Faça login novamente.');
        return;
      }

      // Verifica novamente se já tem plano (em tempo real)
      const planExists = await checkUserHasActivePlan(currentUserUid);
      
      if (planExists) {
        alert('⚠️ Você já possui um plano ativo! No momento, é permitido apenas um plano por usuário.');
        return;
      }

      // Verifica status da assinatura
      if (!subscriptionInfo?.canGeneratePlan) {
        alert(subscriptionInfo?.blockReason || 'Não é possível gerar plano no momento.');
        return;
      }

      console.log('✅ Todas as verificações passaram, redirecionando para gerador...');
      router.push('/gerador-plano');

    } catch (error) {
      console.error('❌ Erro ao verificar condições:', error);
      alert('Erro ao verificar condições. Tente novamente.');
    } finally {
      setCheckingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex justify-center items-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-400">Carregando seu perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20 px-4 pt-6 flex flex-col items-center">
      {/* Botão Voltar */}
      {!showOnboarding && (
        <button
          onClick={() => router.push('/dashboard')}
          className="absolute top-6 left-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>
      )}

      {showOnboarding ? (
        <FitnessOnboarding
          onComplete={handleOnboardingComplete}
        />
      ) : (
        <>
          <Image
            src="/images/Logo.png"
            alt="Logo"
            width={150}
            height={150}
            className="mb-4"
          />

          <h1 className="text-3xl md:text-4xl font-bold text-green-600 mb-6 text-center font-bebas">
            MEU PERFIL
          </h1>

          {!userData ? (
            <div className="w-full max-w-md text-center space-y-6">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-red-500 mb-2">Perfil não encontrado</h2>
                <p className="text-gray-400 mb-4">Precisamos criar seu perfil para continuar</p>
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Criar Meu Perfil
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-2xl space-y-6">
              {/* Status da Assinatura/Trial */}
              {subscriptionInfo && (
                <>
                  {subscriptionInfo.isTrialActive && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        <div>
                          <p className="text-blue-200">
                            <strong>Período de teste ativo!</strong>
                          </p>
                          <p className="text-blue-300 text-sm mt-1">
                            Restam {subscriptionInfo.daysLeftInTrial} {subscriptionInfo.daysLeftInTrial === 1 ? 'dia' : 'dias'} de uso gratuito
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {subscriptionInfo.isSubscriptionActive && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <p className="text-green-200">
                          <strong>Assinatura Premium Ativa!</strong> Aproveite todos os recursos.
                        </p>
                      </div>
                    </div>
                  )}

                  {!subscriptionInfo.canGeneratePlan && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <div>
                          <p className="text-red-200">
                            <strong>Acesso Bloqueado</strong>
                          </p>
                          <p className="text-red-300 text-sm mt-1">
                            {subscriptionInfo.blockReason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Status do Plano Ativo */}
              {hasActivePlan && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <div>
                      <p className="text-yellow-200">
                        <strong>Você já possui um plano ativo!</strong>
                      </p>
                      <p className="text-yellow-300 text-sm mt-1">
                        No momento, só é permitido um plano por usuário. Atualizações futuras permitirão múltiplos planos.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status do Perfil */}
              {!isComplete && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <p className="text-yellow-200">
                      <strong>Perfil incompleto!</strong> Complete todas as informações para gerar seu plano personalizado.
                    </p>
                  </div>
                </div>
              )}

              {isComplete && !hasActivePlan && subscriptionInfo?.canGeneratePlan && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <p className="text-green-200">
                      <strong>Perfil completo!</strong> Pronto para gerar seu plano personalizado.
                    </p>
                  </div>
                </div>
              )}

              {/* Informações Pessoais */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <User className="w-6 h-6 text-green-500" />
                  <h2 className="text-xl font-bold text-green-500">Informações Pessoais</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/20 rounded-lg p-3">
                    <span className="text-gray-400 text-sm">Nome</span>
                    <p className="text-white font-semibold">{userData.userName || 'Não informado'}</p>
                  </div>

                  <div className="bg-black/20 rounded-lg p-3">
                    <span className="text-gray-400 text-sm">Idade</span>
                    <p className="text-white font-semibold">
                      {age > 0 ? `${age} anos` : 'Não calculada'}
                    </p>
                  </div>

                  <div className="bg-black/20 rounded-lg p-3">
                    <span className="text-gray-400 text-sm">Gênero</span>
                    <p className="text-white font-semibold">{userData.gender || 'Não informado'}</p>
                  </div>

                  <div className="bg-black/20 rounded-lg p-3">
                    <span className="text-gray-400 text-sm">Data de Nascimento</span>
                    <p className="text-white font-semibold">{userData.born || 'Não informado'}</p>
                  </div>
                </div>
              </div>

              {/* Dados Físicos */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-6 h-6 text-blue-500" />
                  <h2 className="text-xl font-bold text-blue-500">Dados Físicos</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/20 rounded-lg p-3">
                    <span className="text-gray-400 text-sm">Peso Atual</span>
                    <p className="text-white font-semibold">{userData.weight ? `${userData.weight} kg` : 'Não informado'}</p>
                  </div>

                  <div className="bg-black/20 rounded-lg p-3">
                    <span className="text-gray-400 text-sm">Peso Meta</span>
                    <p className="text-white font-semibold">{userData.weight_goal ? `${userData.weight_goal} kg` : 'Não informado'}</p>
                  </div>

                  <div className="bg-black/20 rounded-lg p-3">
                    <span className="text-gray-400 text-sm">Altura</span>
                    <p className="text-white font-semibold">{userData.height ? `${userData.height} cm` : 'Não informado'}</p>
                  </div>

                  <div className="bg-black/20 rounded-lg p-3">
                    <span className="text-gray-400 text-sm">Biotipo</span>
                    <p className="text-white font-semibold">{userData.biotype || 'Não informado'}</p>
                  </div>

                  <div className="bg-black/20 rounded-lg p-3">
                    <span className="text-gray-400 text-sm">Diferença de Peso</span>
                    <p className="text-white font-semibold">
                      {userData.weight && userData.weight_goal
                        ? `${Math.abs(userData.weight_goal - userData.weight)} kg`
                        : 'Não calculado'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Objetivos e Atividades */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-purple-500" />
                  <h2 className="text-xl font-bold text-purple-500">Objetivos e Atividades</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/20 rounded-lg p-3">
                    <span className="text-gray-400 text-sm">Objetivo Principal</span>
                    <p className="text-white font-semibold">{userData.goal || 'Não informado'}</p>
                  </div>

                  <div className="bg-black/20 rounded-lg p-3">
                    <span className="text-gray-400 text-sm">Atividades por Semana</span>
                    <p className="text-white font-semibold">
                      {userData.weekly_activities ? `${userData.weekly_activities}x` : 'Não informado'}
                    </p>
                  </div>

                  <div className="bg-black/20 rounded-lg p-3 md:col-span-2">
                    <span className="text-gray-400 text-sm">Refeições por Dia</span>
                    <p className="text-white font-semibold">
                      {userData.meals_day ? `${userData.meals_day} refeições` : 'Não informado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="flex items-center justify-center gap-2 flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-colors border border-white/20"
                >
                  <Pencil className="w-5 h-5" />
                  Editar Perfil
                </button>

                <button
                  onClick={handleGeneratePlan}
                  disabled={!isComplete || hasActivePlan || !subscriptionInfo?.canGeneratePlan || checkingPlan}
                  className={`flex items-center justify-center gap-3 flex-1 px-6 py-3 rounded-lg transition-colors font-semibold ${
                    isComplete && !hasActivePlan && subscriptionInfo?.canGeneratePlan && !checkingPlan
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {checkingPlan ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      {hasActivePlan ? (
                        <Lock className="w-5 h-5" />
                      ) : (
                        <Zap className="w-5 h-5" />
                      )}
                      {hasActivePlan ? 'Plano já Gerado' : 'Gerar Plano com IA'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {!showOnboarding && <MenuBottomNav />}
    </div>
  );
}