export interface Measurements {
  abdominalCircumference: number;
  arm: number;
  calf: number;
  glutes: number;
  pectoral: number;
  thigh: number;
  waist: number;
}

export interface UserProfile { // Escolha um nome que faça sentido para você, tipo 'UserFullProfile'
  userId: string; // Adicionado: Essencial para identificar o usuário
  name: string; // Vem do seu UserData
  email: string; // Vem do seu UserData
  whatsapp?: string;
  city?: string;
  state?: string;
  biotype: 'ectomorfo' | 'mesomorfo' | 'endomorfo' | string; // Suas opções de string literal
  goal: 'hipertrofia' | 'emagrecimento' | 'definicao' | 'forca' | 'condicionamento' | string; // Suas opções de string literal
  preferred_schedule?: string;
  notifications_enable?: boolean;
  gender: 'Masculino' | 'Feminino' | 'Outro' | string; // Suas opções de string literal
  born: string; // Formato YYYY-MM-DD
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active' | string; // Suas opções de string literal
  weight: number; // ✅ AGORA É NUMBER
  height: number; // ✅ AGORA É NUMBER
  weight_goal: number; // ✅ AGORA É NUMBER
  weekly_activities: number;
  meals_day: number;
  experience_level: 'iniciante' | 'intermediario' | 'avancado' | string;
  dietary_restrictions: string[];
  measurements?: Measurements; // Deixei opcional, pois pode não ter medidas sempre
  photos?: string[]; // Deixei opcional
  level?: number; // Adicionado: Nível de experiência (você tinha na GlobalUserProfile antiga)
  createdAt?: Date; // Opcional, se você tiver um timestamp de criação
  updatedAt?: Date; // Opcional, se você tiver um timestamp de atualização
  completedProfile?: boolean; // Se você tiver essa flag no user doc
  premium?: boolean;
  role?: 'user' | 'admin' |  string;
  

}
