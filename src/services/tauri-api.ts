import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { UsageData, AppSettings } from '../types/index';

export class TauriAPI {
  static async getUsageData(): Promise<UsageData> {
    return await invoke('get_usage_data');
  }

  static async getSettings(): Promise<AppSettings> {
    return await invoke('get_settings');
  }

  static async updateSettings(settings: AppSettings): Promise<void> {
    return await invoke('update_settings', { newSettings: settings });
  }

  static async showWindow(): Promise<void> {
    return await invoke('show_window');
  }

  static async hideWindow(): Promise<void> {
    return await invoke('hide_window');
  }

  static async listenForUsageUpdates(callback: (data: UsageData) => void) {
    try {
      return await listen('usage-updated', (event) => {
        callback(event.payload as UsageData);
      });
    } catch (error) {
      console.log('Failed to setup usage update listener:', error);
      return null;
    }
  }
}