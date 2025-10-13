'use client';
import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/lib/gamification/types';
import {
    ChevronRight,
    ChevronLeft,
    CheckCircle,
    Target,
    Activity,
    Utensils,
    Bell,
    Camera,
    Ruler,
    Trophy,
    Heart,//eslint-disable-next-line
    Zap,
    User,
    Calculator,
    TrendingUp
} from 'lucide-react';

// Importações Firebase
import {
    getFirestore,
    doc,
    updateDoc,
    setDoc,
    serverTimestamp,
    Timestamp,
    getDoc
} from 'firebase/firestore';
import { auth } from '@/lib/firebase';

interface Measurements {
    abdominalCircumference: string;
    arm: string;
    calf: string;
    glutes: string;
    pectoral: string;
    thigh: string;
    waist: string;
}

interface UserData {
    // users collection
    name: string;
    email: string;
    whatsapp: string;
    city: string;
    state: string;
    preferred_schedule: string;
    notifications_enable: boolean;

    // userProfile collection
    gender: string;
    born: string;
    biotype: string;
    goal: string;
    activity_level: string;
    weight: string;
    height: string;
    weight_goal: string;
    weekly_activities: number;
    meals_day: number;
    dietary_restrictions: string[];
    measurements: Measurements;
    photos: string[];
    experience_level: string; // NOVO CAMPO
}

interface ValidationErrors {
    [key: string]: string;
}

interface OnboardingProps {
    onComplete?: (userData: UserProfile) => Promise<void>;
}

// ==================== FUNÇÃO DE SINCRONIZAÇÃO DA GAMIFICAÇÃO ====================
const initializeGamificationFromOnboarding = async (userData: UserData, userId: string) => {
    const db = getFirestore();
    
    try {
        console.log('🎮 Inicializando gamificação com dados do onboarding...');
        
        // 1. Atualizar coleção principal de gamificação
        const gamificationRef = doc(db, 'gamification', userId);
        await setDoc(gamificationRef, {
            // Sincronizar metas com dados do onboarding
            'stats.weeklyGoal': userData.weekly_activities,
            'stats.monthlyGoal': userData.weekly_activities * 4,
            
            // Definir objetivos baseados no goal do usuário
            'userGoal': userData.goal,
            'userBiotype': userData.biotype,
            'userActivityLevel': userData.activity_level,
            'userExperience': userData.experience_level, // NOVO
            
            // Dados iniciais para tracking de progresso
            'initialWeight': parseFloat(userData.weight) || 0,
            'targetWeight': parseFloat(userData.weight_goal) || 0,
            'initialMeasurements': {
                abdominalCircumference: parseFloat(userData.measurements.abdominalCircumference) || 0,
                arm: parseFloat(userData.measurements.arm) || 0,
                calf: parseFloat(userData.measurements.calf) || 0,
                glutes: parseFloat(userData.measurements.glutes) || 0,
                pectoral: parseFloat(userData.measurements.pectoral) || 0,
                thigh: parseFloat(userData.measurements.thigh) || 0,
                waist: parseFloat(userData.measurements.waist) || 0
            },
            
            // Flags de status
            'onboardingCompleted': true,
            'gamificationActive': true,
            'updatedAt': serverTimestamp()
        }, { merge: true });

        // 2. Inicializar subcoleção de gamificação detalhada (compatível com o engine)
        const detailedGamificationRef = doc(db, 'users', userId, 'gamification', 'data');
        
        const existingDoc = await getDoc(detailedGamificationRef);
        
        if (!existingDoc.exists()) {
            // Criar documento inicial compatível com o engine
            await setDoc(detailedGamificationRef, {
                userId: userId,
                pontos: 100, // Pontos iniciais pelo onboarding
                nivel: 'Iniciante',
                streakAtual: 0,
                melhorStreak: 0,
                ultimoTreino: null,
                conquistas: [{
                    id: 'onboarding_complete',
                    nome: 'Primeira Impressão',
                    descricao: 'Completou o cadastro e definiu seus objetivos',
                    icone: '🎯',
                    pontosBbonus: 100,
                    desbloqueadaEm: new Date(),
                    categoria: 'especial'
                }],
                badges: [],
                historicoPontos: [{
                    acao: 'ONBOARDING_COMPLETO',
                    pontos: 100,
                    multiplicador: 1,
                    timestamp: new Date(),
                    detalhes: {
                        objetivo: userData.goal,
                        biotipo: userData.biotype,
                        experiencia: userData.experience_level // NOVO
                    }
                }],
                protocolosDesbloqueados: [],
                desafiosParticipando: [],
                rankingSemanal: 0,
                
                // Dados específicos do usuário baseados no onboarding
                perfilUsuario: {
                    objetivo: userData.goal,
                    biotipo: userData.biotype,
                    nivelAtividade: userData.activity_level,
                    experiencia: userData.experience_level, // NOVO
                    metaSemanal: userData.weekly_activities,
                    pesoInicial: parseFloat(userData.weight) || 0,
                    pesoMeta: parseFloat(userData.weight_goal) || 0,
                    imc: calcularIMC(parseFloat(userData.weight), parseFloat(userData.height)) // NOVO
                },
                
                criadoEm: serverTimestamp(),
                atualizadoEm: serverTimestamp()
            });
        } else {
            // Atualizar documento existente com dados do onboarding
            await updateDoc(detailedGamificationRef, {
                pontos: 100,
                'conquistas': [{
                    id: 'onboarding_complete',
                    nome: 'Primeira Impressão',
                    descricao: 'Completou o cadastro e definiu seus objetivos',
                    icone: '🎯',
                    pontosBbonus: 100,
                    desbloqueadaEm: new Date(),
                    categoria: 'especial'
                }],
                'historicoPontos': [{
                    acao: 'ONBOARDING_COMPLETO',
                    pontos: 100,
                    multiplicador: 1,
                    timestamp: new Date(),
                    detalhes: {
                        objetivo: userData.goal,
                        biotipo: userData.biotype,
                        experiencia: userData.experience_level // NOVO
                    }
                }],
                'perfilUsuario.objetivo': userData.goal,
                'perfilUsuario.biotipo': userData.biotype,
                'perfilUsuario.nivelAtividade': userData.activity_level,
                'perfilUsuario.experiencia': userData.experience_level, // NOVO
                'perfilUsuario.metaSemanal': userData.weekly_activities,
                'perfilUsuario.pesoInicial': parseFloat(userData.weight) || 0,
                'perfilUsuario.pesoMeta': parseFloat(userData.weight_goal) || 0,
                'perfilUsuario.imc': calcularIMC(parseFloat(userData.weight), parseFloat(userData.height)), // NOVO
                atualizadoEm: serverTimestamp()
            });
        }

        console.log('✅ Gamificação sincronizada com sucesso!');
        
        return {
            success: true,
            message: 'Gamificação ativada com seus objetivos!',
            pointsEarned: 100
        };

    } catch (error) {
        console.error('❌ Erro ao sincronizar gamificação:', error);
        throw new Error('Falha na sincronização da gamificação');
    }
};

// ==================== FUNÇÃO PARA CALCULAR IMC ====================
const calcularIMC = (peso: number, altura: number): number => {
    if (!peso || !altura || peso <= 0 || altura <= 0) return 0;
    
    // 🔧 CORREÇÃO: Detecta automaticamente se tá em metros ou centímetros
    // Se altura > 3, assume que tá em centímetros e converte
    // Se altura <= 3, assume que já tá em metros
    const alturaMetros = altura > 3 ? altura / 100 : altura;
    
    const imc = peso / (alturaMetros * alturaMetros);
    return Number(imc.toFixed(1));

};

// ==================== FUNÇÃO PARA CLASSIFICAR IMC ====================
const classificarIMC = (imc: number): { classificacao: string; cor: string } => {
    if (imc === 0) return { classificacao: 'Não calculado', cor: 'text-gray-400' };
    if (imc < 18.5) return { classificacao: 'Abaixo do peso', cor: 'text-yellow-400' };
    if (imc < 25) return { classificacao: 'Peso normal', cor: 'text-green-400' };
    if (imc < 30) return { classificacao: 'Sobrepeso', cor: 'text-orange-400' };
    if (imc < 35) return { classificacao: 'Obesidade Grau I', cor: 'text-red-400' };
    if (imc < 40) return { classificacao: 'Obesidade Grau II', cor: 'text-red-500' };
    return { classificacao: 'Obesidade Grau III', cor: 'text-red-600' };
};

// ==================== FUNÇÃO PARA SALVAR DADOS NO FIREBASE ====================
const saveToFirebase = async (userData: UserData) => {
    const db = getFirestore();
    const currentUser = auth.currentUser;

    if (!currentUser) {
        throw new Error('Usuário não autenticado. Impossível salvar dados.');
    }

    const userId = currentUser.uid;
    const userEmail = currentUser.email || '';

    try {
        const now = new Date();
        const trialEndDate = new Date(now);
        trialEndDate.setDate(trialEndDate.getDate() + 7);
        // Documento da coleção 'users'
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            biotype: userData.biotype,
            city: userData.city,
            completedProfile: true,
            email: userEmail,
            goal: userData.goal,
            state: userData.state,
            preferred_schedule: userData.preferred_schedule,
            name: userData.name,
            notifications_enable: userData.notifications_enable,
            premium: false,
            role: 'user',
            whatsapp: userData.whatsapp,
            experience_level: userData.experience_level, // NOVO
            updatedAt: serverTimestamp(),

            subscriptionStatus: 'trial',
            trialStartedAt: serverTimestamp(),
            trialEndsAt: Timestamp.fromDate(trialEndDate),
            subscriptionStartedAt: null,
            subscriptionEndsAt: null,
            stripeCustomerId: null,
            hasActivePlan: false,
            planGenerationsCount: 0,
            lastPlanGeneratedAt: null,
        });

        // Documento da coleção 'userProfile'
        const userProfileRef = doc(db, 'userProfile', userId);
        const userProfileDoc: Omit<UserProfile, 'createdAt'> & { 
            createdAt?: Timestamp | ReturnType<typeof serverTimestamp>;
            experience_level?: string; // ADICIONAR AQUI
        } = {
            activity_level: userData.activity_level,
            biotype: userData.biotype,
            born: userData.born,
            dietary_restrictions: userData.dietary_restrictions,
            gender: userData.gender,
            goal: userData.goal,
            height: parseFloat(userData.height) || 0,
            meals_day: userData.meals_day,
            userId: userId,
            userName: userData.name,
            weekly_activities: userData.weekly_activities,
            weight: parseFloat(userData.weight) || 0,
            weight_goal: parseFloat(userData.weight_goal) || 0,
            experience_level: userData.experience_level, // AGORA PODE FICAR
            level: 1,
            email: userEmail,
            city: userData.city,
            state: userData.state,
            whatsapp: userData.whatsapp,
            preferred_schedule: userData.preferred_schedule,
            notifications_enable: userData.notifications_enable,
            completedProfile: true,
        };
        await setDoc(userProfileRef, userProfileDoc, { merge: true });

        // Documento da coleção 'userProgress'
        const userProgressRef = doc(db, 'userProgress', userId);
        const userProgressDoc = {
            date: serverTimestamp(),
            photos: userData.photos,
            goal: userData.goal,
            measurements: {
                abdominalCircumference: parseFloat(userData.measurements.abdominalCircumference) || 0,
                arm: parseFloat(userData.measurements.arm) || 0,
                calf: parseFloat(userData.measurements.calf) || 0,
                glutes: parseFloat(userData.measurements.glutes) || 0,
                pectoral: parseFloat(userData.measurements.pectoral) || 0,
                thigh: parseFloat(userData.measurements.thigh) || 0,
                waist: parseFloat(userData.measurements.waist) || 0
            },
            measurementsHistory: [],
            name: userData.name,
            trainingCompleted: {
                completed: 0,
                total: 0
            },
            userId: userId,
            weight: parseFloat(userData.weight) || 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        await setDoc(userProgressRef, userProgressDoc, { merge: true })
        
        console.log('✅ Campos de assinatura inicializados!');
        console.log(`📅 Trial expira em: ${trialEndDate.toLocaleDateString('pt-BR')}`)
        
        console.log('✅ Dados salvos com sucesso no Firebase!');
        return { success: true };

    } catch (error) {
        console.error('❌ Erro ao salvar no Firebase:', error);
        throw new Error('Erro ao salvar dados. Tente novamente.');
    }
};

// ==================== COMPONENTE PRINCIPAL ====================
const FitnessOnboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [userData, setUserData] = useState<UserData>({
        name: '',
        email: '',
        whatsapp: '',
        city: '',
        state: '',
        preferred_schedule: '',
        notifications_enable: true,
        gender: '',
        born: '',
        biotype: '',
        goal: '',
        activity_level: '',
        weight: '',
        height: '',
        weight_goal: '',
        weekly_activities: 3,
        meals_day: 3,
        dietary_restrictions: [],
        measurements: {
            abdominalCircumference: '',
            arm: '',
            calf: '',
            glutes: '',
            pectoral: '',
            thigh: '',
            waist: ''
        },
        photos: [],
        experience_level: '' // NOVO CAMPO
    });

    const [errors, setErrors] = useState<ValidationErrors>({});
    const [isCompleting, setIsCompleting] = useState<boolean>(false);

    // Arrays de opções
    const biotipos = ['ectomorfo', 'mesomorfo', 'endomorfo'];
    const objetivos = ['hipertrofia', 'emagrecimento', 'definição', 'condicionamento', 'força'];
    const nivelAtividade = ['sedentário', 'leve', 'moderado', 'intenso', 'muito intenso'];
    const horarios = ['manhã (6h-10h)', 'tarde (14h-18h)', 'noite (18h-22h)', 'flexível'];
    const restricoes = ['glúten', 'lactose', 'frutos-do-mar', 'vegetariano', 'vegano', 'diabético', 'hipertensão'];
    const estados = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
    const experiencias = [ // NOVO
        { value: 'iniciante_absoluto', label: 'Iniciante Absoluto', desc: 'Menos de 3 meses de experiência' },
        { value: 'iniciante', label: 'Iniciante', desc: '3 a 12 meses de experiência' },
        { value: 'intermediario', label: 'Intermediário', desc: '1 a 3 anos de experiência' },
        { value: 'avancado', label: 'Avançado', desc: 'Mais de 3 anos de experiência' }
    ];

    // Calcular IMC em tempo real
    const imc = calcularIMC(parseFloat(userData.weight), parseFloat(userData.height));
    const classificacaoIMC = classificarIMC(imc);

    const steps = [
        {
            id: 'personal',
            title: 'Dados Pessoais',
            icon: User,
            fields: ['name', 'email', 'whatsapp', 'gender', 'born', 'city', 'state']
        },
        {
            id: 'physical',
            title: 'Perfil Físico',
            icon: Activity,
            fields: ['biotype', 'weight_goal', 'activity_level', 'experience_level'] // NOVO CAMPO
        },
        {
            id: 'goals',
            title: 'Objetivos',
            icon: Target,
            fields: ['goal', 'weekly_activities', 'preferred_schedule']
        },
        {
            id: 'nutrition',
            title: 'Nutrição',
            icon: Utensils,
            fields: ['meals_day', 'dietary_restrictions']
        },
        {
            id: 'measurements',
            title: 'Medidas',
            icon: Ruler,
            fields: ['measurements', 'weight', 'height']
        },
        {
            id: 'photos',
            title: 'Fotos',
            icon: Camera,
            fields: ['photos']
        },
        {
            id: 'preferences',
            title: 'Preferências',
            icon: Bell,
            fields: ['notifications_enable']
        }
    ];

    // Efeito para preencher e-mail e nome se o usuário já estiver logado
    useEffect(() => {
        const currentAuthUser = auth.currentUser;
        if (currentAuthUser) {
            setUserData(prev => ({
                ...prev,
                email: currentAuthUser.email ?? prev.email,
                name: currentAuthUser.displayName ?? prev.name,
            }));
        }
    }, []);

    const validateStep = (stepIndex: number): boolean => {
        const step = steps[stepIndex];
        const newErrors: ValidationErrors = {};

        step.fields.forEach(field => {
            // Pular campos opcionais
            if (field === 'measurements' || field === 'photos' || field === 'dietary_restrictions' || field === 'notifications_enable' || field === 'weekly_activities' || field === 'meals_day') {
                return;
            }
            
            const value = userData[field as keyof UserData];
            // Validar campos de texto
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                newErrors[field] = 'Campo obrigatório';
            }

            if (['weight', 'height', 'weight_goal'].includes(field) && value) {
                const numValue = parseFloat(value as string);
                if (isNaN(numValue) || numValue <= 0) {
                    newErrors[field] = 'Insira um valor numérico válido';
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = (): void => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
        }
    };

    const handlePrev = (): void => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
        setErrors({});
    };

    const handleInputChange = (field: string, value: string | number | boolean): void => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            if (parent === 'measurements') {
                setUserData(prev => ({
                    ...prev,
                    measurements: {
                        ...prev.measurements,
                        [child]: value as string
                    }
                }));
            }
        } else {
            setUserData(prev => ({
                ...prev,
                [field]: value
            }));
        }

        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleArrayToggle = (field: keyof UserData, value: string): void => {
        if (field === 'dietary_restrictions') {
            setUserData(prev => ({
                ...prev,
                [field]: (prev[field] as string[]).includes(value)
                    ? (prev[field] as string[]).filter(item => item !== value)
                    : [...(prev[field] as string[]), value]
            }));
        }
    };

    const handleComplete = async () => {
        if (!validateStep(currentStep)) {
            return;
        }

        setIsCompleting(true);
        setErrors({});

        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('Usuário não autenticado após completar o perfil.');
            }

            const userId = currentUser.uid;

            // 1. Salvar dados básicos no Firebase
            await saveToFirebase(userData);

            // 2. Sincronizar gamificação com dados do onboarding
            try {
                const gamificationResult = await initializeGamificationFromOnboarding(userData, userId);
                console.log('🎮 Gamificação inicializada:', gamificationResult);
            } catch (gamificationError) {
                console.error('⚠️ Erro na gamificação (não crítico):', gamificationError);
            }

            // 3. Mensagem de sucesso
            alert('🎉 Perfil criado com sucesso! Bem-vindo ao seu app fitness!\n\n🎮 Sistema de gamificação ativado - você ganhou 100 pontos!');

            // 4. Callback personalizado se fornecido
            if (onComplete) {
                const userProfile: UserProfile & { experience_level?: string } = {
                    userId: userId,
                    userName: userData.name,
                    goal: userData.goal,
                    gender: userData.gender,
                    biotype: userData.biotype,
                    born: userData.born,
                    weight: parseFloat(userData.weight) || 0,
                    height: parseFloat(userData.height) || 0,
                    weight_goal: parseFloat(userData.weight_goal) || 0,
                    weekly_activities: userData.weekly_activities || 0,
                    meals_day: userData.meals_day || 0,
                    experience_level: userData.experience_level, // AGORA PODE FICAR
                    level: 1,
                    createdAt: Timestamp.now(),
                    activity_level: userData.activity_level,
                    email: userData.email,
                    city: userData.city,
                    state: userData.state,
                    whatsapp: userData.whatsapp,
                    preferred_schedule: userData.preferred_schedule,
                    notifications_enable: userData.notifications_enable,
                    completedProfile: true,
                };

                await onComplete(userProfile);
            }

        } catch (error) {
            console.error('Erro ao finalizar cadastro:', error);
            alert('Erro ao salvar dados. Tente novamente.');
        } finally {
            setIsCompleting(false);
        }
    };

    // --- Renderização dos passos ---
    const renderPersonalStep = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Nome Completo *</label>
                    <input
                        type="text"
                        value={userData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`w-full p-4 bg-gray-800 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-all ${errors.name ? 'border-red-500' : 'border-gray-600'}`}
                        placeholder="Seu nome completo"
                    />
                    {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Email *</label>
                    <input
                        type="email"
                        value={userData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full p-4 bg-gray-800 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-all ${errors.email ? 'border-red-500' : 'border-gray-600'}`}
                        placeholder="seu@email.com"
                    />
                    {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">WhatsApp *</label>
                    <input
                        type="tel"
                        value={userData.whatsapp}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                        className={`w-full p-4 bg-gray-800 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-all ${errors.whatsapp ? 'border-red-500' : 'border-gray-600'}`}
                        placeholder="(11) 99999-9999"
                    />
                    {errors.whatsapp && <p className="text-red-400 text-sm mt-1">{errors.whatsapp}</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Gênero *</label>
                    <select
                        value={userData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className={`w-full p-4 bg-gray-800 border-2 rounded-xl text-white focus:outline-none focus:border-green-500 transition-all ${errors.gender ? 'border-red-500' : 'border-gray-600'}`}
                    >
                        <option value="">Selecione</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Outro">Outro</option>
                    </select>
                    {errors.gender && <p className="text-red-400 text-sm mt-1">{errors.gender}</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Data de Nascimento *</label>
                    <input
                        type="date"
                        value={userData.born}
                        onChange={(e) => handleInputChange('born', e.target.value)}
                        className={`w-full p-4 bg-gray-800 border-2 rounded-xl text-white focus:outline-none focus:border-green-500 transition-all ${errors.born ? 'border-red-500' : 'border-gray-600'}`}
                    />
                    {errors.born && <p className="text-red-400 text-sm mt-1">{errors.born}</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Cidade *</label>
                    <input
                        type="text"
                        value={userData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className={`w-full p-4 bg-gray-800 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-all ${errors.city ? 'border-red-500' : 'border-gray-600'}`}
                        placeholder="Sua cidade"
                    />
                    {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city}</p>}
                </div>
                
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Estado *</label>
                    <select
                        value={userData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className={`w-full p-4 bg-gray-800 border-2 rounded-xl text-white focus:outline-none focus:border-green-500 transition-all ${errors.state ? 'border-red-500' : 'border-gray-600'}`}
                    >
                        <option value="">Selecione</option>
                        {estados.map(estado => (
                            <option key={estado} value={estado}>{estado}</option>
                        ))}
                    </select>
                    {errors.state && <p className="text-red-400 text-sm mt-1">{errors.state}</p>}
                </div>
            </div>
        </div>
    );

    const renderPhysicalStep = () => (
        <div className="space-y-6">
            {/* Biotipo */}
            <div>
                <label className="block text-lg font-bold text-green-400 mb-4">Biotipo *</label>
                <div className="space-y-3">
                    {biotipos.map(tipo => (
                        <label key={tipo} className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${userData.biotype === tipo ? 'border-green-500 bg-green-500/10' : 'border-gray-600 bg-gray-800/50'}`}>
                            <input
                                type="radio"
                                name="biotype"
                                value={tipo}
                                checked={userData.biotype === tipo}
                                onChange={(e) => handleInputChange('biotype', e.target.value)}
                                className="mt-1 mr-3 text-green-500"
                            />
                            <div>
                                <span className="font-bold capitalize text-white text-base">{tipo}</span>
                                <p className="text-sm text-gray-300 mt-1">
                                    {tipo === 'ectomorfo' && 'Corpo magro, metabolismo acelerado'}
                                    {tipo === 'mesomorfo' && 'Corpo atlético, facilidade muscular'}
                                    {tipo === 'endomorfo' && 'Tendência a gordura, metabolismo lento'}
                                </p>
                            </div>
                        </label>
                    ))}
                </div>
                {errors.biotype && <p className="text-red-400 text-sm mt-2">{errors.biotype}</p>}
            </div>

            {/* Experiência - NOVO */}
            <div>
                <label className="block text-lg font-bold text-green-400 mb-4">Experiência com Treino *</label>
                <div className="space-y-3">
                    {experiencias.map(exp => (
                        <label key={exp.value} className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${userData.experience_level === exp.value ? 'border-green-500 bg-green-500/10' : 'border-gray-600 bg-gray-800/50'}`}>
                            <input
                                type="radio"
                                name="experience"
                                value={exp.value}
                                checked={userData.experience_level === exp.value}
                                onChange={(e) => handleInputChange('experience_level', e.target.value)}
                                className="mt-1 mr-3 text-green-500"
                            />
                            <div>
                                <span className="font-bold text-white text-base">{exp.label}</span>
                                <p className="text-sm text-gray-300 mt-1">{exp.desc}</p>
                            </div>
                        </label>
                    ))}
                </div>
                {errors.experience_level && <p className="text-red-400 text-sm mt-2">{errors.experience_level}</p>}
            </div>

            {/* Campos numéricos */}
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Peso Meta (kg) *</label>
                    <input
                        type="number"
                        step="0.1"
                        min="30"
                        max="300"
                        value={userData.weight_goal}
                        onChange={(e) => handleInputChange('weight_goal', e.target.value)}
                        className={`w-full p-4 bg-gray-800 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-all ${errors.weight_goal ? 'border-red-500' : 'border-gray-600'}`}
                        placeholder="80.0"
                    />
                    {errors.weight_goal && <p className="text-red-400 text-sm mt-1">{errors.weight_goal}</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Nível de Atividade *</label>
                    <select
                        value={userData.activity_level}
                        onChange={(e) => handleInputChange('activity_level', e.target.value)}
                        className={`w-full p-4 bg-gray-800 border-2 rounded-xl text-white focus:outline-none focus:border-green-500 transition-all ${errors.activity_level ? 'border-red-500' : 'border-gray-600'}`}
                    >
                        <option value="">Selecione</option>
                        {nivelAtividade.map(nivel => (
                            <option key={nivel} value={nivel} className="capitalize">{nivel}</option>
                        ))}
                    </select>
                    {errors.activity_level && <p className="text-red-400 text-sm mt-1">{errors.activity_level}</p>}
                </div>
            </div>
        </div>
    );

    const renderGoalsStep = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-lg font-bold text-green-400 mb-4">Objetivo Principal *</label>
                <div className="space-y-3">
                    {objetivos.map(obj => (
                        <label key={obj} className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${userData.goal === obj ? 'border-green-500 bg-green-500/10' : 'border-gray-600 bg-gray-800/50'}`}>
                            <input
                                type="radio"
                                name="goal"
                                value={obj}
                                checked={userData.goal === obj}
                                onChange={(e) => handleInputChange('goal', e.target.value)}
                                className="mr-3 text-green-500"
                            />
                            <span className="font-bold capitalize text-white">{obj}</span>
                        </label>
                    ))}
                </div>
                {errors.goal && <p className="text-red-400 text-sm mt-2">{errors.goal}</p>}
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Treinos por Semana *</label>
                    <select
                        value={userData.weekly_activities}
                        onChange={(e) => handleInputChange('weekly_activities', parseInt(e.target.value))}
                        className="w-full p-4 bg-gray-800 border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:border-green-500 transition-all"
                    >
                        {[1, 2, 3, 4, 5, 6, 7].map(num => (
                            <option key={num} value={num}>{num}x por semana</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Horário Preferido *</label>
                    <select
                        value={userData.preferred_schedule}
                        onChange={(e) => handleInputChange('preferred_schedule', e.target.value)}
                        className={`w-full p-4 bg-gray-800 border-2 rounded-xl text-white focus:outline-none focus:border-green-500 transition-all ${errors.preferred_schedule ? 'border-red-500' : 'border-gray-600'}`}
                    >
                        <option value="">Selecione</option>
                        {horarios.map(horario => (
                            <option key={horario} value={horario}>{horario}</option>
                        ))}
                    </select>
                    {errors.preferred_schedule && <p className="text-red-400 text-sm mt-1">{errors.preferred_schedule}</p>}
                </div>
            </div>
        </div>
    );

    const renderNutritionStep = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Refeições por Dia</label>
                    <select
                        value={userData.meals_day}
                        onChange={(e) => handleInputChange('meals_day', parseInt(e.target.value))}
                        className="w-full p-4 bg-gray-800 border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:border-green-500 transition-all"
                    >
                        {[3, 4, 5, 6].map(num => (
                            <option key={num} value={num}>{num} refeições</option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block text-lg font-bold text-green-400 mb-4">Restrições Alimentares (opcional)</label>
                    <div className="grid grid-cols-1 gap-3">
                        {restricoes.map(restricao => (
                            <label key={restricao} className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${userData.dietary_restrictions.includes(restricao) ? 'border-green-500 bg-green-500/10' : 'border-gray-600 bg-gray-800/50'}`}>
                                <input
                                    type="checkbox"
                                    checked={userData.dietary_restrictions.includes(restricao)}
                                    onChange={() => handleArrayToggle('dietary_restrictions', restricao)}
                                    className="mr-3 text-green-500"
                                />
                                <span className="text-sm capitalize text-white">{restricao}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderMeasurementsStep = () => {
        const medidas = [
            { key: 'abdominalCircumference', label: 'Circunferência Abdominal (cm)' },
            { key: 'arm', label: 'Braço (cm)' },
            { key: 'calf', label: 'Panturrilha (cm)' },
            { key: 'glutes', label: 'Glúteos (cm)' },
            { key: 'pectoral', label: 'Peitoral (cm)' },
            { key: 'thigh', label: 'Coxa (cm)' },
            { key: 'waist', label: 'Cintura (cm)' }
        ];
    
        return (
            <div className="space-y-6">
                {/* Display do IMC - NOVO */}
                {(userData.weight && userData.height) && (
                    <div className="bg-gradient-to-r from-green-400/10 to-green-500/10 border border-green-500/30 p-4 rounded-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Calculator className="w-6 h-6 text-green-400" />
                                <div>
                                    <p className="text-green-300 font-bold text-sm">SEU IMC</p>
                                    <p className="text-white font-black text-xl">{imc}</p>
                                    <p className={`text-sm font-bold ${classificacaoIMC.cor}`}>
                                        {classificacaoIMC.classificacao}
                                    </p>
                                </div>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-400" />
                        </div>
                    </div>
                )}

                <div className="bg-gradient-to-r from-blue-600/10 to-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
                    <div className="flex items-start">
                        <Ruler className="w-5 h-5 text-blue-400 mt-1 mr-3 flex-shrink-0" />
                        <div>
                            <h3 className="text-blue-300 font-bold text-sm mb-1">Dados corporais</h3>
                            <p className="text-blue-200 text-xs">
                                Peso e altura são obrigatórios. Medidas corporais são opcionais.
                            </p>
                        </div>
                    </div>
                </div>
    
                {/* CAMPOS OBRIGATÓRIOS: Peso e Altura */}
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">Peso Atual (kg) *</label>
                        <input
                            type="number"
                            step="0.1"
                            min="30"
                            max="300"
                            value={userData.weight}
                            onChange={(e) => handleInputChange('weight', e.target.value)}
                            className={`w-full p-4 bg-gray-800 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-all ${errors.weight ? 'border-red-500' : 'border-gray-600'}`}
                            placeholder="75.0"
                        />
                        {errors.weight && <p className="text-red-400 text-sm mt-1">{errors.weight}</p>}
                    </div>
    
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">Altura (cm) *</label>
                        <input
                            type="number"
                            step="0.1"
                            min="100"
                            max="250"
                            value={userData.height}
                            onChange={(e) => handleInputChange('height', e.target.value)}
                            className={`w-full p-4 bg-gray-800 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-all ${errors.height ? 'border-red-500' : 'border-gray-600'}`}
                            placeholder="180"
                        />
                        {errors.height && <p className="text-red-400 text-sm mt-1">{errors.height}</p>}
                    </div>
                </div>
    
                {/* MEDIDAS CORPORAIS OPCIONAIS */}
                <div>
                    <h3 className="text-base font-bold text-gray-300 mb-4">Medidas Corporais (Opcional)</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {medidas.map(medida => (
                            <div key={medida.key}>
                                <label className="block text-sm font-bold text-gray-300 mb-2">{medida.label}</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="200"
                                    value={userData.measurements[medida.key as keyof Measurements]}
                                    onChange={(e) => handleInputChange(`measurements.${medida.key}`, e.target.value)}
                                    className="w-full p-4 bg-gray-800 border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-all"
                                    placeholder="0.0"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderPhotosStep = () => (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-yellow-600/10 to-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl">
                <div className="flex items-start">
                    <Camera className="w-5 h-5 text-yellow-400 mt-1 mr-3 flex-shrink-0" />
                    <div>
                        <h3 className="text-yellow-300 font-bold text-sm mb-1">Fotos de progresso (opcional)</h3>
                        <p className="text-yellow-200 text-xs">
                            Você pode adicionar fotos depois no app para acompanhar sua evolução.
                        </p>
                    </div>
                </div>
            </div>

            <div className="text-center py-8">
                <div className="bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Adicionar fotos depois</h3>
                <p className="text-gray-400 text-sm">Faça upload das suas fotos de progresso após finalizar o cadastro.</p>
            </div>
        </div>
    );

    const renderPreferencesStep = () => (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600/10 to-purple-500/10 border border-purple-500/30 p-4 rounded-xl">
                <div className="flex items-start">
                    <Bell className="w-5 h-5 text-purple-400 mt-1 mr-3 flex-shrink-0" />
                    <div>
                        <h3 className="text-purple-300 font-bold text-sm mb-1">Últimos ajustes</h3>
                        <p className="text-purple-200 text-xs">
                            Configure suas preferências finais.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800 border-2 border-gray-600 rounded-xl">
                    <div className="flex items-center">
                        <div className="bg-green-500/20 p-2 rounded-lg mr-3">
                            <Bell className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">Notificações</h3>
                            <p className="text-xs text-gray-400">Lembretes de treino e atualizações</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={userData.notifications_enable}
                            onChange={(e) => handleInputChange('notifications_enable', e.target.checked)}
                            className="sr-only"
                        />
                        <div className={`w-12 h-6 rounded-full transition-colors ${userData.notifications_enable ? 'bg-green-500' : 'bg-gray-600'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform transform ${userData.notifications_enable ? 'translate-x-7' : 'translate-x-1'} mt-1`}></div>
                        </div>
                    </label>
                </div>
            </div>

            <div className="bg-gray-800 border border-gray-600 p-4 rounded-xl">
                <h3 className="font-bold text-green-400 text-sm mb-3 flex items-center">
                    <Trophy className="w-4 h-4 mr-2" />
                    Resumo do seu perfil:
                </h3>
                <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="space-y-1">
                        <p className="text-gray-300"><strong className="text-white">Nome:</strong> {userData.name || 'Não informado'}</p>
                        <p className="text-gray-300"><strong className="text-white">Objetivo:</strong> {userData.goal || 'Não informado'}</p>
                        <p className="text-gray-300"><strong className="text-white">Biotipo:</strong> {userData.biotype || 'Não informado'}</p>
                        <p className="text-gray-300"><strong className="text-white">Experiência:</strong> {experiencias.find(e => e.value === userData.experience_level)?.label || 'Não informado'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-gray-300"><strong className="text-white">Treinos/semana:</strong> {userData.weekly_activities}x</p>
                        <p className="text-gray-300"><strong className="text-white">Peso atual:</strong> {userData.weight || 'Não informado'} kg</p>
                        {imc > 0 && (
                            <p className="text-gray-300">
                                <strong className="text-white">IMC:</strong> {imc} 
                                <span className={`ml-2 ${classificacaoIMC.cor}`}>({classificacaoIMC.classificacao})</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCurrentStep = () => {
        switch (steps[currentStep].id) {
            case 'personal': return renderPersonalStep();
            case 'physical': return renderPhysicalStep();
            case 'goals': return renderGoalsStep();
            case 'nutrition': return renderNutritionStep();
            case 'measurements': return renderMeasurementsStep();
            case 'photos': return renderPhotosStep();
            case 'preferences': return renderPreferencesStep();
            default: return null;
        }
    };

    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <div className="min-h-screen bg-black text-white pb-8">
            {/* Header Compacto */}
            <div className="px-4 pt-4 pb-2">
                <div className="text-center mb-6">
                    <div className="flex items-center justify-center mb-3">
                        <div className="bg-gradient-to-r from-green-500 to-blue-500 p-2 rounded-full">
                            <Heart className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-black bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-2">
                        CONFIGURE SEU PERFIL
                    </h1>
                    <p className="text-gray-400 text-sm font-bold">Sua jornada fitness personalizada</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-300">
                            ETAPA {currentStep + 1} DE {steps.length}
                        </span>
                        <span className="text-xs font-bold text-green-400">
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Steps Indicator */}
                <div className="flex justify-center gap-2 mb-6 overflow-x-auto pb-2">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;

                        return (
                            <div
                                key={step.id}
                                className={`flex items-center px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                    isActive
                                        ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                                        : isCompleted
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : 'bg-gray-800 text-gray-400 border border-gray-600'
                                }`}
                            >
                                {isCompleted ? (
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                ) : (
                                    <Icon className="w-3 h-3 mr-1" />
                                )}
                                <span className="hidden sm:inline">{step.title}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Conteúdo Principal */}
            <div className="px-4">
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 mb-6">
                    <div className="mb-4">
                        <h2 className="text-xl font-black text-white mb-2">
                            {steps[currentStep].title}
                        </h2>
                        <div className="h-1 w-16 bg-gradient-to-r from-green-500 to-blue-500 rounded"></div>
                    </div>

                    {renderCurrentStep()}
                </div>

                {/* Navegação */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className={`flex items-center px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                            currentStep === 0
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600'
                        }`}
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </button>

                    {currentStep === steps.length - 1 ? (
                        <button
                            onClick={handleComplete}
                            disabled={isCompleting}
                            className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCompleting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Finalizando...
                                </>
                            ) : (
                                <>
                                    <Trophy className="w-4 h-4 mr-2" />
                                    Finalizar
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-blue-600 transition-all"
                        >
                            Próximo
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </button>
                    )}
                </div>

                {/* Final Screen */}
                {currentStep === steps.length - 1 && (
                    <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-4 mt-6">
                        <div className="text-center">
                            <div className="bg-white/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                                <Trophy className="w-6 h-6 text-yellow-400" />
                            </div>
                            <h3 className="text-lg font-black text-white mb-2">PRONTO PARA COMEÇAR!</h3>
                            <p className="text-sm text-gray-300 mb-4">
                                Ao finalizar você receberá:
                            </p>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="bg-black/20 rounded-xl p-3 border border-white/10">
                                    <div className="text-2xl mb-2">🏆</div>
                                    <div className="font-bold text-white text-sm">100 Pontos Iniciais</div>
                                </div>
                                <div className="bg-black/20 rounded-xl p-3 border border-white/10">
                                    <div className="text-2xl mb-2">🎯</div>
                                    <div className="font-bold text-white text-sm">Plano Personalizado</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FitnessOnboarding;