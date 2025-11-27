export interface SubtitleEntry {
  start: string;
  end: string;
  text: string;
  sourceFile?: string;
}
export interface SRTFile {
  id: string;
  name: string;
  content: string;
  size: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
  offset?: number; // Calculated offset in seconds
}

export type PlanType = 'free' | 'tier1' | 'tier2' | 'tier3';

export interface Subscription {
  plan: PlanType;
  status: 'active' | 'expired';
  expiryDate?: string;
  razorpaySubscriptionId?: string;
}

export interface Usage {
  date: string;
  uploadCount: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  subscription?: Subscription;
  usage?: Usage;
}
export interface TranscriptFile {
  id: string;
  name: string;
  type: string;
  size: number;
  duration: string | null;
  isPrimary: boolean;
  offset: string;
  content: SubtitleEntry[];
  errors: string[];
}
export type OutputFormat = 'srt' | 'vtt' | 'txt' | 'json';