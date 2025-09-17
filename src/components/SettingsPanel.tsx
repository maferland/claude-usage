import React, { useState, useEffect } from 'react';
import { AppSettings, PollingFrequency, POLLING_FREQUENCIES } from '../types/index';

interface SettingsPanelProps {
  settings: AppSettings | null;
  onSettingsChange: (settings: AppSettings) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSettingsChange
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  const handleFrequencyChange = (frequency: PollingFrequency) => {
    if (!localSettings) return;

    const newSettings = {
      ...localSettings,
      polling_frequency: frequency
    };

    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  const handleAutoStartChange = (autoStart: boolean) => {
    if (!localSettings) return;

    const newSettings = {
      ...localSettings,
      auto_start: autoStart
    };

    setLocalSettings(newSettings);
    setHasChanges(true);
  };


  const handleSave = () => {
    if (localSettings && hasChanges) {
      onSettingsChange(localSettings);
      setHasChanges(false);
    }
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  if (!localSettings) {
    return (
      <div className="settings-panel">
        <div className="settings-loading">Loading settings...</div>
      </div>
    );
  }


  return (
    <div className="settings-panel">
      <header className="settings-header">
        <h2>Settings</h2>
      </header>

      <div className="settings-content">
        {/* Polling Frequency Selection */}
        <section className="settings-section">
          <h3>Polling Frequency</h3>
          <p className="section-description">
            Choose how often to refresh your Claude usage data
          </p>

          <div className="mode-options">
            {Object.entries(POLLING_FREQUENCIES).map(([frequency, config]) => (
              <div
                key={frequency}
                className={`mode-option ${localSettings.polling_frequency === frequency ? 'selected' : ''}`}
                onClick={() => handleFrequencyChange(frequency as PollingFrequency)}
              >
                <div className="mode-radio">
                  <div className="radio-button">
                    {localSettings.polling_frequency === frequency && <div className="radio-selected" />}
                  </div>
                </div>
                <div className="mode-info">
                  <div className="mode-header">
                    <span
                      className="mode-color"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="mode-label">{config.label}</span>
                  </div>
                  <div className="mode-description">
                    {config.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* Additional Settings */}
        <section className="settings-section">
          <h3>General</h3>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Auto-start with system</span>
              <span className="setting-description">
                Launch the app automatically when you log in
              </span>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={localSettings.auto_start}
                  onChange={(e) => handleAutoStartChange(e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </section>

      </div>

      {hasChanges && (
        <footer className="settings-footer">
          <div className="footer-actions">
            <button
              onClick={handleCancel}
              className="button secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="button primary"
            >
              Save Changes
            </button>
          </div>
        </footer>
      )}
    </div>
  );
};

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
  </svg>
);

export default SettingsPanel;