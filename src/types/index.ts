export interface UsageData {
  today: DayData;
  session?: SessionData;
  recent: DayData[];
  totals: TotalData;
  lastUpdated: string;
  mode: string;
  error?: string;
}

export interface DayData {
  date: string;
  cost: number;
  models?: Record<string, boolean>;
}

export interface SessionData {
  id?: string;
  cost: number;
  is_active: boolean;
  start_time?: string;
  end_time?: string;
}

export interface TotalData {
  cost?: number;
  weekly_cost?: number;
  monthly_cost?: number;
}

export interface AppSettings {
  polling_frequency: PollingFrequency;
  auto_start: boolean;
}

export type PollingFrequency = '1min' | '5min' | '10min';

export interface PollingFrequencyConfig {
  label: string;
  description: string;
  interval: number;
  color: string;
}

export const POLLING_FREQUENCIES: Record<
  PollingFrequency,
  PollingFrequencyConfig
> = {
  '1min': {
    label: '1 Minute',
    description:
      'Fast updates - best for active development and real-time monitoring',
    interval: 60,
    color: '#FF3B30',
  },
  '5min': {
    label: '5 Minutes',
    description: 'Balanced updates - good for regular usage monitoring',
    interval: 300,
    color: '#FF9500',
  },
  '10min': {
    label: '10 Minutes',
    description:
      'Slower updates - conserves resources for background monitoring',
    interval: 600,
    color: '#34C759',
  },
};
