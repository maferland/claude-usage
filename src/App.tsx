import { useState, useEffect } from 'react';
import { UsageData, AppSettings } from './types/index';
import { TauriAPI } from './services/tauri-api';
import UsageDashboard from './components/UsageDashboard';
import './App.css';

function App() {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <main className="app-main">
        <UsageDashboard
          usageData={usageData}
          loading={loading}
          error={error}
          pollingFrequency={settings?.polling_frequency}
          onRefresh={refreshData}
        />
      </main>
    </div>
  );
}


export default App;
