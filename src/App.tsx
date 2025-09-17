import { useState, useEffect } from 'react';
import { UsageData, AppSettings, PollingFrequency, POLLING_FREQUENCIES } from './types/index';
import { TauriAPI } from './services/tauri-api';
import UsageDashboard from './components/UsageDashboard';
import SettingsPanel from './components/SettingsPanel';
import TrendsPanel from './components/TrendsPanel';
import TabNavigation, { TabType } from './components/TabNavigation';
import './App.css';

function App() {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  useEffect(() => {
    initializeApp();
    setupEventListeners();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing app...');
      setLoading(true);

      // Load settings first
      console.log('Loading settings...');
      const currentSettings = await TauriAPI.getSettings();
      console.log('Settings loaded:', currentSettings);
      setSettings(currentSettings);

      // Load initial usage data
      console.log('Loading usage data...');
      const data = await TauriAPI.getUsageData();
      console.log('Usage data loaded:', data);
      setUsageData(data);

      setLoading(false);
      console.log('App initialization completed successfully');
    } catch (err) {
      console.error('App initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize app');
      setLoading(false);
    }
  };

  const setupEventListeners = async () => {
    // Listen for usage updates from backend
    try {
      await TauriAPI.listenForUsageUpdates((data: UsageData) => {
        setUsageData(data);
      });
    } catch (error) {
      console.log('Event listener setup failed:', error);
    }
  };

  const handleSettingsChange = async (newSettings: AppSettings) => {
    try {
      await TauriAPI.updateSettings(newSettings);
      setSettings(newSettings);

      // Fetch updated data
      const data = await TauriAPI.getUsageData();
      setUsageData(data);
    } catch (err) {
      console.error('Settings update failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    }
  };

  const refreshData = async () => {
    if (!settings) return;

    try {
      console.log('Refreshing data...');
      setLoading(true);
      setError(null); // Clear any previous errors
      const data = await TauriAPI.getUsageData();
      console.log('Received updated data:', data);
      setUsageData(data);
      setLoading(false);
      console.log('Data refresh completed successfully');
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
      setLoading(false);
    }
  };

  const hideWindow = async () => {
    try {
      await TauriAPI.hideWindow();
    } catch (err) {
      console.error('Failed to hide window:', err);
    }
  };

  if (loading && !usageData) {
    return (
      <div className="app loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Claude usage data...</p>
        </div>
      </div>
    );
  }

  if (error && !usageData) {
    return (
      <div className="app error">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={initializeApp} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Claude Usage Monitor</h1>
        </div>
        <div className="header-right">
          <button
            onClick={refreshData}
            className="icon-button refresh-button"
            disabled={loading}
            title={loading ? "Refreshing..." : "Refresh data"}
          >
            <RefreshIcon />
          </button>
        </div>
      </header>

      <TabNavigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />

      <main className="app-main">
        {currentTab === 'dashboard' && (
          <UsageDashboard
            usageData={usageData}
            loading={loading}
            error={error}
            pollingFrequency={settings?.polling_frequency}
          />
        )}
        {currentTab === 'settings' && (
          <SettingsPanel
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        )}
        {currentTab === 'trends' && (
          <TrendsPanel
            usageData={usageData}
          />
        )}
      </main>
    </div>
  );
}

// Simple SVG icons
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
  </svg>
);


const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
  </svg>
);

export default App;
