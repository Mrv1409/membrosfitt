// src/hooks/useUserPlans.ts
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
// ✅ IMPORTAÇÃO DA INTERFACE USERPROFILE GLOBAL
import { UserProfile } from '@/lib/gamification/types'; // Certifique-se de que o caminho está correto

interface UserPlano {
    id: string;
    criadoEm: Date;
    metaCalorica: number;
    nomeUsuario: string;
    planoNutricional: {
        metaCalorica: number;
        semana: Record<string, unknown>;
    };
    planoTreino: {
        semana: Record<string, unknown>;
    };
    observacoes: {
        nutricao: string[];
        treino: string[];
        geral: string[];
    };
    metadata: {
        criadoEm: Date;
        versao: string;
        tmb: number;
        dadosUsuario: {
            peso: number;
            altura: number;
            objetivo: string;
            biotipo: string;
        };
    };
}

// ✅ REMOVIDA A INTERFACE USERPROFILE DUPLICADA AQUI

export function useUserPlans() {
    const [user, loading] = useAuthState(auth);
    const [planos, setPlanos] = useState<UserPlano[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loadingPlanos, setLoadingPlanos] = useState(true);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setPlanos([]);
            setProfile(null);
            setLoadingPlanos(false);
            setLoadingProfile(false);
            setError(null);
            return;
        }

        // Buscar perfil do usuário
        const fetchProfile = async () => {
            try {
                setError(null);
                const profileDoc = await getDoc(doc(db, 'userProfile', user.uid));
                if (profileDoc.exists()) {
                    const profileDataFromFirebase = profileDoc.data();
                    
                    // ✅ Mapear dados do Firebase para a UserProfile consistente
                    // Isso é crucial para que campos como 'weight' aninhados sejam "achatados"
                    const mappedProfile: UserProfile = {
                        userId: user.uid,
                        userName: profileDataFromFirebase.userName || '', // Ou userData.name se vc carregar 'users' tb
                        goal: profileDataFromFirebase.goal || '',
                        gender: profileDataFromFirebase.gender || '',
                        biotype: profileDataFromFirebase.biotype || '',
                        born: profileDataFromFirebase.born || '',
                        weight: profileDataFromFirebase.measurements?.weight || 0, // Acessa weight de measurements
                        height: profileDataFromFirebase.height || 0,
                        weight_goal: profileDataFromFirebase.weight_goal,
                        weekly_activities: profileDataFromFirebase.weekly_activities || 0,
                        meals_day: profileDataFromFirebase.meals_day || 0,
                        level: profileDataFromFirebase.level || 1,
                        createdAt: profileDataFromFirebase.createdAt,
                        activity_level: profileDataFromFirebase.activity_level || '',
                        dietary_restrictions: profileDataFromFirebase.dietary_restrictions,
                        // Adicionar outros campos de 'users' se relevantes para este hook
                        email: profileDataFromFirebase.email, // Se o email estiver em userProfile ou users
                        completedProfile: profileDataFromFirebase.completedProfile, // Se a flag for relevante aqui
                    };
                    
                    setProfile(mappedProfile);
                } else {
                    setError('Perfil não encontrado. Complete seu perfil primeiro.');
                }
            } catch (error) {
                console.error('Erro ao buscar perfil:', error);
                setError('Erro ao carregar perfil do usuário');
            } finally {
                setLoadingProfile(false);
            }
        };

        // Listener para planos em tempo real
        const setupPlanosListener = () => {
            try {
                const planosQuery = query(
                    collection(db, 'users', user.uid, 'planos'),
                    orderBy('metadata.criadoEm', 'desc')
                );

                const unsubscribe = onSnapshot(planosQuery, (snapshot) => {
                    const planosData = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,

                            criadoEm: data.criadoEm?.toDate?.() || data.metadata?.criadoEm?.toDate?.() || new Date(),
                            metadata: {
                                ...data.metadata,
                                criadoEm: data.metadata?.criadoEm?.toDate?.() || new Date(),
                            }
                        };
                    }) as UserPlano[];

                    setPlanos(planosData);
                    setLoadingPlanos(false);
                    setError(null);
                }, (error) => {
                    console.error('Erro ao buscar planos:', error);
                    setError('Erro ao carregar planos');
                    setLoadingPlanos(false);
                });

                return unsubscribe;
            } catch (error) {
                console.error('Erro ao configurar listener:', error);
                setError('Erro ao configurar listener de planos');
                setLoadingPlanos(false);
                return () => { };
            }
        };

        fetchProfile();
        const unsubscribe = setupPlanosListener();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

    // Função para buscar um plano específico
    const getPlanoById = (planoId: string): UserPlano | undefined => {
        return planos.find(plano => plano.id === planoId);
    };

    // Função para verificar se o usuário tem planos
    const hasPlanos = planos.length > 0;

    // Função para obter o plano mais recente
    const getLatestPlano = (): UserPlano | null => {
        return planos.length > 0 ? planos[0] : null;
    };

    return {
        user,
        planos,
        profile,
        loading: loading || loadingPlanos || loadingProfile,
        loadingPlanos,
        loadingProfile,
        error,
        hasProfile: !!profile,
        hasPlanos,
        getPlanoById,
        getLatestPlano,
        totalPlanos: planos.length,
    };
}