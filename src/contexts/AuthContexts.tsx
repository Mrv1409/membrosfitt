'use client';

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
    useMemo,
} from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,//eslint-disable-next-line
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    UserCredential,
    AuthError,
    User as FirebaseUser,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import {
    doc,//eslint-disable-next-line
    setDoc,
    getDoc,//eslint-disable-next-line
    collection,
    serverTimestamp,
    FieldValue,
    writeBatch,
    Timestamp,
} from 'firebase/firestore';

// ✅ IMPORTAR A INTERFACE USERPROFILE GLOBAL
import { UserProfile as GlobalUserProfile } from '@/lib/gamification/types'; // Renomeie para evitar conflito se houver outra UserProfile local

export interface User {
    id: string;
    email: string;
    userName: string;
    userType: 'free' | 'premium';
    completedProfile: boolean;
    createdAt: Timestamp | FieldValue;
}

// ✅ REMOVIDA A INTERFACE USERPROFILE DUPLICADA E INCOMPATÍVEL DAQUI


export interface UserProgress {
    userId: string;
    physicalStats: {
        currentWeight?: number;
        targetWeight?: number;
        currentBodyFat?: number;
        targetBodyFat?: number;
        measurements: Record<string, number>;
    };
    progressPhotos: Array<{
        id: string;
        url: string;
        type: 'front' | 'side' | 'back';
        uploadedAt: Timestamp;
    }>;
    achievements: string[];
    milestones: Array<{
        id: string;
        type: string;
        value: number;
        achievedAt: Timestamp;
    }>;
    lastUpdated: Timestamp | FieldValue;
    createdAt: Timestamp | FieldValue;
}

export interface Gamification {
    userId: string;
    points: number;
    level: number;
    badges: Array<{
        id: string;
        name: string;
        description: string;
        earnedAt: Timestamp;
    }>;
    achievements: Array<{
        id: string;
        name: string;
        description: string;
        progress: number;
        target: number;
        completed: boolean;
        completedAt?: Timestamp;
    }>;
    streaks: {
        current: number;
        longest: number;
        lastWorkout: Timestamp | null;
    };
    stats: {
        totalWorkouts: number;
        totalMinutes: number;
        weeklyGoal: number;
        monthlyGoal: number;
    };
    createdAt: Timestamp | FieldValue;
    updatedAt: Timestamp | FieldValue;
}

export interface ExtendedUser extends FirebaseUser {
    userData?: User;
    profile?: GlobalUserProfile; // ✅ USAR A INTERFACE GLOBAL
    gamification?: Gamification;
}


interface AuthContextType {
    // States
    currentUser: ExtendedUser | null;
    userData: User | null;
    userProfile: GlobalUserProfile | null; // ✅ USAR A INTERFACE GLOBAL
    gamificationData: Gamification | null;
    loading: boolean;
    error: string | null;

    signUp: (email: string, password: string, userName: string) => Promise<UserCredential>;
    signIn: (email: string, password: string) => Promise<UserCredential>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    refreshUserData: () => Promise<void>;
    clearError: () => void;

    getUserData: () => Promise<User | null>;
    getUserProfile: () => Promise<GlobalUserProfile | null>; // ✅ USAR A INTERFACE GLOBAL
    getGamificationData: () => Promise<Gamification | null>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthContextProvider');
    }
    return context;
};


const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 6) errors.push('Password must be at least 6 characters');
    if (!/(?=.*[a-z])/.test(password)) errors.push('Password must contain lowercase letter');
    if (!/(?=.*[A-Z])/.test(password)) errors.push('Password must contain uppercase letter');
    if (!/(?=.*\d)/.test(password)) errors.push('Password must contain number');
    return errors;
};


interface AuthContextProviderProps {
    children: ReactNode;
}

export const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
    // States
    const [currentUser, setCurrentUser] = useState<ExtendedUser | null>(null);
    const [userData, setUserData] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<GlobalUserProfile | null>(null); // ✅ USAR A INTERFACE GLOBAL
    const [gamificationData, setGamificationData] = useState<Gamification | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();


    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const handleAuthError = (err: unknown): string => {
        const error = err as AuthError;

        switch (error.code) {
            case 'auth/email-already-in-use':
                return 'Email already in use';
            case 'auth/weak-password':
                return 'Password too weak';
            case 'auth/invalid-email':
                return 'Invalid email';
            case 'auth/user-not-found':
                return 'User not found';
            case 'auth/wrong-password':
                return 'Wrong password';
            case 'auth/user-disabled':
                return 'Account disabled';
            case 'auth/too-many-requests':
                return 'Too many attempts. Try later';
            default:
                return error.message || 'Authentication error';
        }
    };


    const createUserCollections = async (firebaseUser: FirebaseUser, userName: string, email: string) => {
        const batch = writeBatch(db);
        const userId = firebaseUser.uid;

        try {
            const userRef = doc(db, 'users', userId);
            const userData: Omit<User, 'createdAt'> & { createdAt: FieldValue } = {
                id: userId,
                email,
                userName,
                userType: 'free',
                completedProfile: false,
                createdAt: serverTimestamp(),
            };
            batch.set(userRef, userData);

            const profileRef = doc(db, 'userProfile', userId);
            // ✅ CORREÇÃO AQUI: Salvar userProfile no formato achatado
            const profileData: Omit<GlobalUserProfile, 'createdAt' | 'updatedAt' | 'userId' | 'userName' | 'email' | 'completedProfile'> & { // Excluir campos que não são definidos aqui
                userId: string;
                userName?: string; // Pode vir de users, mas é bom ter aqui
                email?: string;
                completedProfile?: boolean;
                createdAt: FieldValue;
                updatedAt: FieldValue;
            } = {
                userId,
                // Campos de GlobalUserProfile inicializados para o formato achatado
                userName: userName, // Pegar do param
                goal: '',
                gender: '',
                biotype: '',
                born: '',
                weight: 0, // Inicializar com um valor padrão
                height: 0, // Inicializar com um valor padrão
                weekly_activities: 0,
                meals_day: 0,
                level: 1, // Nível inicial
                activity_level: 'sedentary', // Nível de atividade inicial
                dietary_restrictions: [],
                weight_goal: 0, // Opcional
                // Campos que podem vir da coleção 'users' mas são incluídos aqui para consistência
                email: email, // Usar o email do param
                city: '',
                state: '',
                whatsapp: '',
                preferred_schedule: '',
                notifications_enable: true,
                completedProfile: false, // O perfil ainda não está completo no onboarding
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            batch.set(profileRef, profileData);

            const progressRef = doc(db, 'userProgress', userId);
            const progressData: Omit<UserProgress, 'createdAt' | 'lastUpdated'> & {
                createdAt: FieldValue;
                lastUpdated: FieldValue;
            } = {
                userId,
                physicalStats: {
                    measurements: {},
                },
                progressPhotos: [],
                achievements: [],
                milestones: [],
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp(),
            };
            batch.set(progressRef, progressData);

            const gamificationRef = doc(db, 'gamification', userId);
            const gamificationData: Omit<Gamification, 'createdAt' | 'updatedAt'> & {
                createdAt: FieldValue;
                updatedAt: FieldValue;
            } = {
                userId,
                points: 0,
                level: 1,
                badges: [],
                achievements: [],
                streaks: {
                    current: 0,
                    longest: 0,
                    lastWorkout: null,
                },
                stats: {
                    totalWorkouts: 0,
                    totalMinutes: 0,
                    weeklyGoal: 3,
                    monthlyGoal: 12,
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            batch.set(gamificationRef, gamificationData);

            await batch.commit();
            console.log('✅ User collections created successfully');

        } catch (error) {
            console.error('❌ Error creating user collections:', error);
            throw new Error('Failed to create user profile');
        }
    };


    const getUserData = useCallback(async (): Promise<User | null> => {
        try {
            if (!currentUser?.uid) return null;

            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                console.warn('⚠️ User data not found');
                return null;
            }

            const data = userSnap.data();
            return {
                ...data,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt : new Date(),
            } as User;

        } catch (err) {
            console.error('❌ Error fetching user data:', err);
            setError('Failed to load user data');
            return null;
        }
    }, [currentUser?.uid]);

    const getUserProfile = useCallback(async (): Promise<GlobalUserProfile | null> => { // ✅ USAR A INTERFACE GLOBAL
        try {
            if (!currentUser?.uid) return null;

            const profileRef = doc(db, 'userProfile', currentUser.uid);
            const profileSnap = await getDoc(profileRef);

            if (!profileSnap.exists()) {
                console.warn('⚠️ User profile not found');
                return null;
            }

            const data = profileSnap.data();
            // ✅ Mapear dados do Firebase para a GlobalUserProfile consistente (achatar 'measurements')
            const mappedProfile: GlobalUserProfile = {
                userId: currentUser.uid,
                userName: data.userName,
                goal: data.goal,
                gender: data.gender,
                biotype: data.biotype,
                born: data.born,
                weight: data.weight || 0, // ✅ Acessar weight de measurements
                height: data.height,
                weight_goal: data.weight_goal,
                weekly_activities: data.weekly_activities,
                meals_day: data.meals_day,
                level: data.level || 1,
                activity_level: data.activity_level,
                dietary_restrictions: data.dietary_restrictions,
                email: data.email,
                city: data.city,
                state: data.state,
                whatsapp: data.whatsapp,
                preferred_schedule: data.preferred_schedule,
                notifications_enable: data.notifications_enable,
                completedProfile: data.completedProfile,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
            
            };

            return mappedProfile;

        } catch (err) {
            console.error('❌ Error fetching user profile:', err);
            setError('Failed to load user profile');
            return null;
        }
    }, [currentUser?.uid]);

    const getGamificationData = useCallback(async (): Promise<Gamification | null> => {
        try {
            if (!currentUser?.uid) return null;

            const gamificationRef = doc(db, 'gamification', currentUser.uid);
            const gamificationSnap = await getDoc(gamificationRef);

            if (!gamificationSnap.exists()) {
                console.warn('⚠️ Gamification data not found');
                return null;
            }

            const data = gamificationSnap.data();
            return {
                ...data,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt : new Date(),
                updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : new Date(),
            } as Gamification;

        } catch (err) {
            console.error('❌ Error fetching gamification data:', err);
            setError('Failed to load gamification data');
            return null;
        }
    }, [currentUser?.uid]);


    const signUp = useCallback(async (email: string, password: string, userName: string): Promise<UserCredential> => {
        try {
            clearError();
            setLoading(true);

            if (!validateEmail(email)) {
                throw new Error('Invalid email address');
            }

            const passwordErrors = validatePassword(password);
            if (passwordErrors.length > 0) {
                throw new Error(passwordErrors[0]);
            }

            if (!userName.trim() || userName.trim().length < 2) {
                throw new Error('Name must be at least 2 characters');
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            await updateProfile(userCredential.user, {
                displayName: userName.trim()
            });

            await createUserCollections(userCredential.user, userName.trim(), email);

            console.log('✅ User registration completed');
            return userCredential;

        } catch (err) {
            const errorMessage = handleAuthError(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [clearError]);

    const signIn = useCallback(async (email: string, password: string): Promise<UserCredential> => {
        try {
            clearError();
            setLoading(true);

            if (!validateEmail(email)) {
                throw new Error('Invalid email address');
            }

            if (!password.trim()) {
                throw new Error('Password required');
            }

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('✅ User signed in successfully');

            return userCredential;

        } catch (err) {
            const errorMessage = handleAuthError(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [clearError]);

    const signOut = useCallback(async () => {
        try {
            clearError();
            await signOut(); // ✅ Passar 'auth' como argumento
            
            setUserData(null);
            setUserProfile(null);
            setGamificationData(null);

            console.log('✅ User signed out successfully');
            router.push('/');

        } catch (err) {
            const errorMessage = handleAuthError(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [clearError, router]);

    const resetPassword = useCallback(async (email: string) => {
        try {
            clearError();

            if (!validateEmail(email)) {
                throw new Error('Invalid email address');
            }

            await sendPasswordResetEmail(auth, email);
            console.log('✅ Password reset email sent');

        } catch (err) {
            const errorMessage = handleAuthError(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [clearError]);


    const refreshUserData = useCallback(async () => {
        if (!currentUser?.uid) return;

        try {
            setLoading(true);

            const [user, profile, gamification] = await Promise.all([
                getUserData(),
                getUserProfile(),
                getGamificationData(),
            ]);

            setUserData(user);
            setUserProfile(profile);
            setGamificationData(gamification);

        } catch (err) {
            console.error('❌ Error refreshing user data:', err);
            setError('Failed to refresh user data');
        } finally {
            setLoading(false);
        }
    }, [currentUser?.uid, getUserData, getUserProfile, getGamificationData]);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                setLoading(true);

                if (firebaseUser) {
                    setCurrentUser(firebaseUser as ExtendedUser);

                    const [user, profile, gamification] = await Promise.all([
                        (async () => {
                            const userRef = doc(db, 'users', firebaseUser.uid);
                            const userSnap = await getDoc(userRef);
                            return userSnap.exists() ? { ...userSnap.data(), id: firebaseUser.uid } as User : null;
                        })(),
                        (async () => {
                            const profileRef = doc(db, 'userProfile', firebaseUser.uid);
                            const profileSnap = await getDoc(profileRef);
                            if (profileSnap.exists()) {
                                const data = profileSnap.data();
                                // ✅ Mapear dados do Firebase para a GlobalUserProfile consistente
                                return {
                                    userId: firebaseUser.uid,
                                    userName: data.userName,
                                    goal: data.goal,
                                    gender: data.gender,
                                    biotype: data.biotype,
                                    born: data.born,
                                    weight: data.weight || 0, // ✅ Acessar weight de measurements
                                    height: data.height,
                                    weight_goal: data.weight_goal,
                                    weekly_activities: data.weekly_activities,
                                    meals_day: data.meals_day,
                                    level: data.level || 1,
                                    activity_level: data.activity_level,
                                    dietary_restrictions: data.dietary_restrictions,
                                    email: data.email,
                                    city: data.city,
                                    state: data.state,
                                    whatsapp: data.whatsapp,
                                    preferred_schedule: data.preferred_schedule,
                                    notifications_enable: data.notifications_enable,
                                    completedProfile: data.completedProfile,
                                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt : new Date(),
                                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : new Date(),
                                } as GlobalUserProfile;
                            }
                            return null;
                        })(),
                        (async () => {
                            const gamificationRef = doc(db, 'gamification', firebaseUser.uid);
                            const gamificationSnap = await getDoc(gamificationRef);
                            return gamificationSnap.exists() ? gamificationSnap.data() as Gamification : null;
                        })(),
                    ]);

                    setUserData(user);
                    setUserProfile(profile);
                    setGamificationData(gamification);

                } else {
                    setCurrentUser(null);
                    setUserData(null);
                    setUserProfile(null);
                    setGamificationData(null);
                }

            } catch (error) {
                console.error('❌ Error in auth state change:', error);
                setError('Failed to load user session');
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []); // No dependencies to avoid infinite loops


    const value = useMemo(() => ({
        currentUser,
        userData,
        userProfile,
        gamificationData,
        loading,
        error,

        signUp,
        signIn,
        signOut,
        resetPassword,
        refreshUserData,
        clearError,

        getUserData,
        getUserProfile,
        getGamificationData,
    }), [
        currentUser,
        userData,
        userProfile,
        gamificationData,
        loading,
        error,
        signUp,
        signIn,
        signOut,
        resetPassword,
        refreshUserData,
        clearError,
        getUserData,
        getUserProfile,
        getGamificationData,
    ]);


    if (loading && !currentUser) {
        return (
            <div className="fixed inset-0 bg-white flex justify-center items-center z-50">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
                    <p className="text-gray-600 font-medium">Initializing...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContextProvider;