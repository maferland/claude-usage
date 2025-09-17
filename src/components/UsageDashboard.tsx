import React from 'react';
import { UsageData, POLLING_FREQUENCIES, PollingFrequency } from '../types/index';

interface UsageDashboardProps {
  usageData: UsageData | null;
  loading: boolean;
  error: string | null;
  pollingFrequency?: string;
}

const UsageDashboard: React.FC<UsageDashboardProps> = ({
  usageData,
  loading,
  error,
  pollingFrequency
}) => {
  if (!usageData) {
    return (
      <div className="dashboard-empty">
        <p>No usage data available</p>
      </div>
    );
  }

  const formatCurrency = (amount: number | undefined) => `$${(amount || 0).toFixed(2)}`;
  const formatDate = (dateStr: string) => {
    // Handle date-only strings (YYYY-MM-DD) to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return 'Unknown';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Unknown';
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="usage-dashboard">
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Today's Usage */}
      <section className="dashboard-section today-section">
        <h2>Today's Usage</h2>
        <div className="today-cost">
          <span className="cost-amount">{formatCurrency(usageData.today.cost)}</span>
          <span className="cost-date">{formatDate(usageData.today.date)}</span>
        </div>

      </section>


      {/* Total Usage */}
      <section className="dashboard-section totals-section">
        <h2>Total Usage</h2>
        <div className="totals-grid">
          <div className="total-item">
            <span className="total-label">This Week</span>
            <span className="total-amount">{formatCurrency(usageData.totals.weekly_cost || 0)}</span>
          </div>
          <div className="total-item">
            <span className="total-label">This Month</span>
            <span className="total-amount">{formatCurrency(usageData.totals.monthly_cost || 0)}</span>
          </div>
          <div className="total-item">
            <span className="total-label">All Time</span>
            <span className="total-amount">{formatCurrency(usageData.totals.cost || 0)}</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="last-updated">
          Last updated: {formatTime(usageData.lastUpdated)}
          {loading && <span className="updating-indicator">Updating...</span>}
        </div>
        <div className="current-mode">
          {pollingFrequency && (
            <div className="mode-indicator">
              <div
                className="mode-dot"
                style={{ backgroundColor: POLLING_FREQUENCIES[pollingFrequency as PollingFrequency].color }}
              />
              <span className="mode-text">
                {POLLING_FREQUENCIES[pollingFrequency as PollingFrequency].label}
              </span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default UsageDashboard;