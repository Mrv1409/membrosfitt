import { Timestamp } from 'firebase/firestore';

// --- Interfaces para dados aninhados e sub-documentos (conforme sua estrutura ATUAL do Firebase) ---

// 1. FitnessProfileFirebase: Reflete o que está na sua coleção 'userProfile'
export interface FitnessProfileFirebase {
    activity_level: string | null;
    biotype: string | null;
    born: string | null; // Formato "DD.MM.YYYY"
    dietary_restrictions?: string[];
    gender: string | null;
    goal: string | null;
    height: number | null; // Em cm
    level: number | null;
    meals_day: number | null;
    userName: string | null; // Seu 'userName' está aqui
    weekly_activities: number | null;
    weight: number | null; // Em kg
    weight_goal: number | null; // Em kg
    createdAt: Timestamp;

}

// 2. BodyMeasurementsFirebase: Reflete o sub-objeto 'measurements' dentro de 'userProgress'
export interface BodyMeasurementsFirebase {
    abdominalCircumference: number | null;
    arm: number | null;
    calf: number | null;
    glutes: number | null;
    pectoral: number | null;
    thigh: number | null;
    waist: number | null;
}

// 3. MeasurementsHistoryEntry: Reflete um item do array 'measurementsHistory' em 'userProgress'
export interface MeasurementsHistoryEntry {
    abdominalCircumference: number | null;
    arm: number | null;
    calf: number | null;
    date: Timestamp;
    glutes: number | null;
    pectoral: number | null;
    thigh: number | null;
    waist: number | null;
    weight: number | null;
}

// 4. GamificationData: Reflete o documento 'data' dentro da sub-coleção 'gamification' de cada usuário
export interface GamificationData {
    achievements: {
        category: string;
        completed: boolean;
        completed_at: Timestamp;
        current_progress: number;
        id: string;
        total_goal: number;
    }[];
    activeChallenges: string[];
    badges: {
        description: string;
        earned_at: Timestamp;
        icon: string;
        id: string;
        name: string;
        rarity: string;
        special_effect: boolean;
    }[];
    challengesParticipating: string[];
    createdAt: Timestamp;
    pointsHistory: {
        action: string;
        points: number;
        timestamp: Timestamp;
    }[];
    rankings: {
        global_position: number;
        month_points: number;
        position_friends: number;
        regional_position: number;
        week_points: number;
    };
    statisticsChallenges: {
        abandoned: number;
        completed: number;
    };
    streaks: {
        active_multiplier: number;
        better: number;
        current: number;
        last_training: Timestamp;
        sequenceDays: Timestamp[];
        vacation: boolean;
    };
    unlockedProtocols: string[];
    updatedAt: Timestamp;
    userId: string;
}

// --- Interfaces Principais (Refletem as coleções de nível superior do Firebase) ---

// User: Reflete a coleção 'users' no Firebase
export interface User {
    id: string; // UID do Firebase Auth (document ID)
    biotype: string;
    city: string;
    completedProfile: boolean;
    createdAt: Timestamp;
    email: string;
    goal: string;
    name: string; // Corresponde ao seu campo 'name' no Firebase
    notifications_enabled: boolean; // Usa snake_case como no Firebase
    preferred_schedule: string; // Usa snake_case
    premium: boolean;
    role: string;
    state: string;
    whatsapp: string;
    // Adicionei estes campos como opcionais, pois não estavam no JSON de users mas são comuns para gamificação
    level?: number;
    xp?: number;
    totalXP?: number;
    lastActivity?: Timestamp;
    isActive?: boolean;
    updatedAt?: Timestamp;
}

// UserProfile: Reflete a coleção 'userProfile' no Firebase
export type UserProfile = {
    userId: string;
    userName: string;
    goal: string;
    gender: string;
    biotype: string;
    born: string; // Data de nascimento como string (YYYY-MM-DD)
    weight: number;
    height: number;
    weight_goal: number; // Opcional, pois nem todos os objetivos têm meta de peso
    weekly_activities: number;
    meals_day: number;
    level?: number;
    createdAt: Timestamp;
    activity_level: string; // Garanta que seja string aqui
    dietary_restrictions?: string[]; // Opcional
    // Propriedades que vêm da coleção 'users' mas que são importantes para o UserProfile combinado
    email?: string;
    city?: string;
    state?: string;
    whatsapp?: string;
    preferred_schedule?: string;
    notifications_enable?: boolean;
    completedProfile?: boolean; // Adicionado para a flag de conclusão do onboarding
};

// UserProgress: Reflete a coleção 'userProgress' no Firebase
export interface UserProgress {
    userId: string;
    date: Timestamp;
    goal: string;
    measurements: BodyMeasurementsFirebase;
    measurementsHistory: MeasurementsHistoryEntry[];
    photos: string[];
    trainingCompleted: {
        completed: number;
        total: number;
    };
    userName: string; // Mantido como 'userName' para corresponder EXATAMENTE ao seu Firebase.
                      // Forte recomendação para corrigir para 'userName' no seu Firebase.
    weight: number;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// --- Tipo de União para o Frontend (Para uso combinado nos seus componentes React) ---
export type UserProfileFull = User & {
    userProfileData?: UserProfile;
    userProgressData?: UserProgress;
    gamificationData?: GamificationData;
};

// ----------------------------------------------------------------------------------
// Suas outras interfaces, enums e types helpers que não foram alterados pela estrutura Firebase
// ----------------------------------------------------------------------------------

export interface CompletedWorkout {
    id: string;
    userId: string;
    workoutName: string;
    workoutType: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other';
    duration: number; // em minutos
    caloriesBurned?: number;
    exercises: {
        name: string;
        sets?: number;
        reps?: number;
        weight?: number;
        duration?: number;
        notes?: string;
    }[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    xpEarned: number;
    completedAt: Timestamp;
    notes?: string;
    rating?: number; // 1-5 stars
}

export interface FirebaseDebugData {
    users: User[];
    userProgress: UserProgress[];
    completedWorkouts?: CompletedWorkout[];
}

export interface FirebaseCollectionsDebug {
    users: User;
    userProgress: UserProgress;
}

export enum XPSource {
    DAILY_LOGIN = 'daily_login',
    TASK_COMPLETION = 'task_completion',
    ACHIEVEMENT_UNLOCK = 'achievement_unlock',
    SOCIAL_INTERACTION = 'social_interaction',
    CHALLENGE_COMPLETE = 'challenge_complete',
    STREAK_BONUS = 'streak_bonus',
    LEVEL_UP = 'level_up',
    SPECIAL_EVENT = 'special_event',
    WORKOUT_COMPLETED = 'workout_completed',
    GOAL_ACHIEVED = 'goal_achieved'
}

export enum BadgeRarity {
    COMMON = 'common',
    RARE = 'rare',
    EPIC = 'epic',
    LEGENDARY = 'legendary',
    MYTHIC = 'mythic'
}

export enum BadgeEffect {
    NONE = 'none',
    GLOW = 'glow',
    PARTICLE = 'particle',
    ANIMATED = 'animated',
    RAINBOW = 'rainbow',
    SPARKLE = 'sparkle'
}

export enum AchievementType {
    MILESTONE = 'milestone',
    STREAK = 'streak',
    SOCIAL = 'social',
    EXPLORATION = 'exploration',
    MASTERY = 'mastery',
    SPECIAL = 'special',
    FITNESS = 'fitness'
}

export enum LeaderboardType {
    XP_TOTAL = 'xp_total',
    XP_WEEKLY = 'xp_weekly',
    XP_MONTHLY = 'xp_monthly',
    LEVEL = 'level',
    ACHIEVEMENTS = 'achievements',
    BADGES = 'badges',
    STREAKS = 'streaks',
    WORKOUTS = 'workouts',
    CUSTOM = 'custom'
}

export enum ChallengeType {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    SPECIAL_EVENT = 'special_event',
    PERSONAL = 'personal',
    GUILD = 'guild',
    FITNESS = 'fitness'
}

export enum ChallengeStatus {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    EXPIRED = 'expired',
    LOCKED = 'locked'
}

export enum RewardType {
    XP = 'xp',
    BADGE = 'badge',
    TITLE = 'title',
    AVATAR = 'avatar',
    CURRENCY = 'currency',
    ITEM = 'item',
    ACCESS = 'access'
}

export enum NotificationType {
    ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
    BADGE_EARNED = 'badge_earned',
    LEVEL_UP = 'level_up',
    CHALLENGE_AVAILABLE = 'challenge_available',
    CHALLENGE_COMPLETED = 'challenge_completed',
    STREAK_MILESTONE = 'streak_milestone',
    LEADERBOARD_POSITION = 'leaderboard_position',
    SOCIAL_INTERACTION = 'social_interaction',
    REWARD_AVAILABLE = 'reward_available',
    WORKOUT_REMINDER = 'workout_reminder'
}

export enum StreakType {
    DAILY_LOGIN = 'daily_login',
    TASK_COMPLETION = 'task_completion',
    EXERCISE = 'exercise',
    STUDY = 'study',
    WORKOUT = 'workout',
    CUSTOM = 'custom'
}

export enum GuildRole {
    MEMBER = 'member',
    MODERATOR = 'moderator',
    ADMIN = 'admin',
    LEADER = 'leader'
}


export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    type: AchievementType;
    rarity: BadgeRarity;
    xpReward: number;
    badgeReward?: string;
    requirements: {
        type: string;
        target: number;
        timeframe?: string;
    };
    isSecret: boolean;
    unlockedBy: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: BadgeRarity;
    specialEffect?: BadgeEffect;
    requirements: string;
    isLimited: boolean;
    maxSupply?: number;
    currentSupply: number;
    ownedBy: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Level {
    level: number;
    xpRequired: number;
    title: string;
    description: string;
    rewards: {
        type: RewardType;
        value: string | number;
    }[];
    unlocksFeatures: string[];
    icon?: string;
    color?: string;
}

export interface Leaderboard {
    id: string;
    name: string;
    description: string;
    type: LeaderboardType;
    timeframe: 'all_time' | 'monthly' | 'weekly' | 'daily';
    rankings: {
        userId: string;
        username: string;
        avatar?: string;
        score: number;
        position: number;
        change: number; // +1, -1, 0 para mudança de posição
    }[];
    isActive: boolean;
    resetDate?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface GamificationEngine {
    getUserProfile(): Promise<UserProgress>; // Ainda precisa de revisão
    performAction(action: GamificationEvent): Promise<void>;
    addPoints(points: number, metadata?: unknown): Promise<void>;
    setStreak(streakData: unknown): Promise<void>;
    unlockAchievement(achievementId: string, metadata?: unknown): Promise<void>;
    logAction(action: string, metadata?: unknown): Promise<void>;
    getAchievements(): Promise<Achievement[]>;
    on(event: string, callback: (data: unknown) => void): void;
}

export interface GamificationEvent {
    action: string;
    points?: number;
    metadata?: unknown;
    timestamp?: Date;
}

export type ActionType = string;


export interface Reward {
    id: string;
    name: string;
    description: string;
    type: RewardType;
    value: string | number; // XP amount, badge ID, etc
    icon: string;
    rarity: BadgeRarity;
    cost?: number; // se for comprado com moedas
    requirements?: {
        level?: number;
        achievements?: string[];
        badges?: string[];
    };
    isLimited: boolean;
    maxClaims?: number;
    currentClaims: number;
    expiresAt?: Timestamp;
    claimedBy: {
        userId: string;
        claimedAt: Timestamp;
    }[];
    isActive: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Challenge {
    id: string;
    name: string;
    description: string;
    type: ChallengeType;
    icon: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
    objectives: {
        id: string;
        description: string;
        target: number;
        current?: number;
        completed: boolean;
    }[];
    rewards: {
        type: RewardType;
        value: string | number;
    }[];
    requirements?: {
        level?: number;
        achievements?: string[];
        completedChallenges?: string[];
    };
    participants: {
        userId: string;
        progress: {
            objectiveId: string;
            current: number;
            completed: boolean;
        }[];
        status: ChallengeStatus;
        joinedAt: Timestamp;
        completedAt?: Timestamp;
    }[];
    maxParticipants?: number;
    startsAt: Timestamp;
    endsAt: Timestamp;
    isActive: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface SocialInteraction {
    id: string;
    type: 'like' | 'comment' | 'share' | 'follow' | 'mention';
    fromUserId: string;
    toUserId: string;
    targetType: 'achievement' | 'badge' | 'level_up' | 'challenge' | 'post';
    targetId: string;
    content?: string; // para comentários
    xpAwarded: number;
    metadata?: Record<string, unknown>;
    createdAt: Timestamp;
}

export interface GamificationNotification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    icon: string;
    data: {
        sourceType: string;
        sourceId: string;
        xpAwarded?: number;
        badgeId?: string;
        achievementId?: string;
        level?: number;
    };
    isRead: boolean;
    actionUrl?: string;
    expiresAt?: Timestamp;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    createdAt: Timestamp;
    readAt?: Timestamp;
}

export interface StreakDay {
    // Mantido para compatibilidade com o tipo 'Streak' se ele for usado em outro lugar.
    // No entanto, seu Firebase armazena Timestamps diretamente em 'sequenceDays'.
    date: string;
    completed: boolean;
    value?: number;
    bonus?: number;
}

export interface Streak {
    id: string;
    userId: string;
    type: StreakType;
    name: string;
    description: string;
    currentCount: number;
    bestCount: number;
    totalDays: number;
    sequenceDays: Timestamp[]; // Correção: No seu Firebase, isso é um array de Timestamps.
    multiplier: number; // XP multiplier based on streak
    milestones: {
        days: number;
        reward: {
            type: RewardType;
            value: string | number;
        };
        claimed: boolean;
    }[];
    isActive: boolean;
    lastUpdated: Timestamp;
    startedAt: Timestamp;
    endedAt?: Timestamp;
    createdAt: Timestamp;
}

export interface AnalyticsEvent {
    id: string;
    userId: string;
    eventType: string;
    category: 'gamification' | 'engagement' | 'progress' | 'social' | 'fitness';
    action: string;
    properties: Record<string, unknown>;
    xpContext?: {
        before: number;
        after: number;
        source: XPSource;
        multiplier?: number;
    };
    sessionId?: string;
    timestamp: Timestamp;
    processed: boolean;
}

export interface Season {
    id: string;
    name: string;
    description: string;
    theme: string;
    startDate: Timestamp;
    endDate: Timestamp;
    isActive: boolean;
    specialRules: {
        xpMultiplier?: number;
        bonusEvents?: string[];
        restrictedFeatures?: string[];
    };
    exclusiveRewards: {
        type: RewardType;
        value: string | number;
        requirements: Record<string, unknown>;
    }[];
    leaderboards: string[]; // IDs dos leaderboards especiais
    challenges: string[]; // IDs dos desafios exclusivos
    participants: {
        userId: string;
        joinedAt: Timestamp;
        seasonXP: number;
        seasonLevel: number;
        rewardsClaimed: string[];
    }[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}


export interface Guild {
    id: string;
    name: string;
    description: string;
    icon: string;
    banner?: string;
    level: number;
    xp: number;
    maxMembers: number;
    currentMembers: number;
    isPublic: boolean;
    requirements?: {
        minLevel?: number;
        minXP?: number;
        requiredAchievements?: string[];
    };
    members: {
        userId: string;
        username: string;
        role: GuildRole;
        contribution: number; // XP contribuído para a guild
        joinedAt: Timestamp;
        lastActive: Timestamp;
    }[];
    achievements: {
        id: string;
        name: string;
        unlockedAt: Timestamp;
        contributedBy: string[];
    }[];
    challenges: {
        challengeId: string;
        status: 'active' | 'completed' | 'failed';
        progress: number;
        target: number;
    }[];
    stats: {
        totalXP: number;
        challengesCompleted: number;
        averageMemberLevel: number;
        activity: number; // 0-100 score
    };
    settings: {
        autoAccept: boolean;
        requireApproval: boolean;
        allowMemberInvites: boolean;
    };
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}


export type UserStats = Pick<User, 'level' | 'xp' | 'totalXP'> & {
    rank?: number;
    achievementCount: number;
    badgeCount: number;
    activeStreaks: number;
};

export type LeaderboardEntry = {
    userId: string;
    username: string;
    avatar?: string;
    score: number;
    position: number;
    change: number;
    badges?: string[];
    level?: number;
};

export type ChallengeProgress = {
    challengeId: string;
    userId: string;
    objectives: {
        id: string;
        current: number;
        target: number;
        percentage: number;
    }[];
    overallProgress: number;
    status: ChallengeStatus;
};

export type XPTransaction = {
    userId: string;
    amount: number;
    source: XPSource;
    sourceId?: string;
    multiplier?: number;
    timestamp: Timestamp;
    description?: string;
};

export type NotificationPayload = {
    type: NotificationType;
    title: string;
    message: string;
    data: Record<string, unknown>;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
};


export interface ComboSystem {
    userId: string;
    currentCombo: number;
    maxCombo: number;
    comboType: string;
    multiplier: number;
    actions: {
        type: string;
        timestamp: Timestamp;
        xpBase: number;
        xpWithCombo: number;
    }[];
    lastAction: Timestamp;
    expiresAt: Timestamp;
}

export interface SpecialEvent {
    id: string;
    name: string;
    type: 'double_xp' | 'special_challenges' | 'limited_badges' | 'community';
    isActive: boolean;
    startDate: Timestamp;
    endDate: Timestamp;
    effects: {
        xpMultiplier?: number;
        unlocksChallenges?: string[];
        unlocksRewards?: string[];
    };
    participants: string[];
}


export interface FirebaseCollections {
    users: User;
    userProfile: UserProfile;
    userProgress: UserProgress;
    achievements: Achievement;
    badges: Badge;
    levels: Level;
    leaderboards: Leaderboard;
    rewards: Reward;
    challenges: Challenge;
    social_interactions: SocialInteraction;
    notifications: GamificationNotification;
    streaks: Streak; // Se esta for uma coleção de nível superior 'streaks'
    analytics_events: AnalyticsEvent;
    seasons: Season;
    guilds: Guild;
    completed_workouts: CompletedWorkout;
}

export type CollectionName = keyof FirebaseCollections;
export type DocumentType<T extends CollectionName> = FirebaseCollections[T];