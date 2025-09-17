import React from 'react';
import { UsageData, POLLING_FREQUENCIES, PollingFrequency } from '../types/index';

interface UsageDashboardProps {
  usageData: UsageData | null;
  loading: boolean;
  error: string | null;
  pollingFrequency?: string;
  onRefresh: () => void;
}

const UsageDashboard: React.FC<UsageDashboardProps> = ({
  usageData,
  loading,
  error,
  pollingFrequency,
  onRefresh
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
        <div className="section-header">
          <h2>Today's Usage</h2>
          <button
            onClick={onRefresh}
            className="icon-button refresh-button"
            disabled={loading}
            title={loading ? "Refreshing..." : "Refresh data"}
          >
            <RefreshIcon />
          </button>
        </div>
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

      {/* Status Information */}
      <section className="dashboard-section status-section">
        <div className="status-info">
          <div className="last-updated">
            Last updated: {formatTime(usageData.lastUpdated)}
            {loading && <span className="updating-indicator">Updating...</span>}
          </div>
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
      </section>
    </div>
  );
};

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
  </svg>
);

export default UsageDashboard;