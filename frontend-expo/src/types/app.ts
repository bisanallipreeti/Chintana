export type ThoughtType = "Constructive" | "Destructive" | "Neutral";

export type ThoughtCategory =
  | "Business"
  | "IT"
  | "Personal"
  | "Emotional"
  | "Strategic"
  | "Creative"
  | "Health"
  | "Financial"
  | "Relationship"
  | "Career"
  | "Education"
  | "Family"
  | "Travel"
  | "Spiritual"
  | "Others";

export interface ThoughtAttachment {
  id: string;
  type: "image" | "video";
  name: string;
  url: string;
  publicId?: string;
  size?: number;
  mimeType?: string;
}

export interface Thought {
  id: string;
  text: string;
  category: ThoughtCategory;
  type: ThoughtType;
  score: number;
  classification: string;
  energyImpact: "energizing" | "neutral" | "draining";
  stressLevel: "minimal" | "low" | "moderate" | "high";
  suggestion: string;
  emotionalInsights?: {
    emotionalTone?: string;
    constructiveness?: string;
    distressLevel?: string;
    resilienceLevel?: string;
    actionOrientation?: string;
    cognitiveDistortion?: string;
    emotionalIntensity?: number;
    copingIndicators?: string[];
    riskSignals?: string[];
    confidence?: number;
    summary?: string;
    recommendation?: string;
    safety?: {
      riskLevel?: string;
      crisisDetected?: boolean;
      reasons?: string[];
      confidence?: number;
    };
  };
  aiMeta?: {
    source?: string;
    model?: string;
    cacheHit?: boolean;
    confidence?: number;
    pipeline?: string;
  };
  allowSharing: boolean;
  confidential: boolean;
  attachments: ThoughtAttachment[];
  revisitAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileData {
  fullName: string;
  email: string;
  phoneCountryIso: string;
  phoneNumber: string;
  occupation: string;
  education: string;
  city: string;
  stateCode: string;
  countryIso: string;
  nationality: string;
  designation: string;
  currencyCode: string;
  monthlyIncome: string;
  additionalAnnualIncome: string;
}

export interface SettingsData {
  twoFactorAuth: boolean;
  dataEncryption: boolean;
  autoDelete: boolean;
  notifications: boolean;
  reminderEmailEnabled: boolean;
  reminderPushEnabled: boolean;
  reminderHourUtc: number;
  biometricEnabled: boolean;
}

export interface UserData {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  profile: ProfileData;
  settings: SettingsData;
  createdAt: string;
}

export interface DashboardSummary {
  totalThoughts: number;
  averageCognitiveScore: number | null;
  dailyStabilitySeries?: Array<{
    date: string;
    day: string;
    score: number;
    count: number;
    weekKey: string;
    weekLabel: string;
  }>;
  weeklyCognitiveStability: Array<{ day: string; date: string; score: number | null }>;
  weeklyCognitiveStabilityMeta: {
    title: string;
    subtitle: string;
  };
  monthlyCognitiveStability?: Array<{
    month: string;
    key: string;
    score: number;
    count: number;
  }>;
  thoughtDistribution: Array<{ name: string; value: number | null; count: number }>;
  mentalLoadMetrics: {
    mentalStabilityScore: number | null;
    stressLevels: {
      minimal: number;
      low: number;
      moderate: number;
      high: number;
    };
  };
  patternDetection?: {
    dominantCategory: string | null;
    destructiveStreak: number;
    momentumTrend: "improving" | "declining" | "stable";
    insights: string[];
  };
  categoryBreakdown: Array<{ category: string; count: number; averageScore: number }>;
  latestThoughts: Thought[];
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: Record<string, unknown>;
}
