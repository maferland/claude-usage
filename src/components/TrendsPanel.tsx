import React from 'react';
import { UsageData } from '../types/index';

interface TrendsPanelProps {
  usageData: UsageData | null;
}

const TrendsPanel: React.FC<TrendsPanelProps> = ({ usageData }) => {
  if (!usageData) {
    return (
      <div className="trends-panel">
        <div className="trends-loading">Loading trends data...</div>
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

  // Calculate trend statistics

  const recentCosts = usageData.recent.map(day => day.cost).filter(cost => cost !== undefined && cost !== null);
  const validCosts = recentCosts.filter(cost => typeof cost === 'number' && !isNaN(cost));

  const averageCost = validCosts.length > 0 ? validCosts.reduce((a, b) => a + b, 0) / validCosts.length : 0;
  const maxCost = validCosts.length > 0 ? Math.max(...validCosts) : 0;
  const minCost = validCosts.length > 0 ? Math.min(...validCosts) : 0;
  const totalWeekCost = validCosts.reduce((a, b) => a + b, 0);

  // Use today's cost from the correct source and find yesterday in recent data
  const todayCost = usageData.today?.cost || 0;
  const todayDate = usageData.today?.date;

  // Find the most recent day with data (excluding today)
  let yesterdayCost = 0;
  if (todayDate) {
    // Filter out today and find the most recent day with cost > 0
    const recentWithoutToday = usageData.recent.filter(day => day.date !== todayDate && day.cost > 0);
    if (recentWithoutToday.length > 0) {
      // Sort by date and get the most recent
      recentWithoutToday.sort((a, b) => b.date.localeCompare(a.date));
      yesterdayCost = recentWithoutToday[0].cost;
    }
  }

  const percentageChange = yesterdayCost > 0 ? ((todayCost - yesterdayCost) / yesterdayCost) * 100 : 0;

  // Get trend direction for recent days
  const getTrendDirection = () => {
    if (validCosts.length < 3) return 'neutral';

    // Use the most recent 3 valid costs
    const recent3Days = validCosts.slice(0, 3);
    const increasing = recent3Days[0] > recent3Days[1] && recent3Days[1] > recent3Days[2];
    const decreasing = recent3Days[0] < recent3Days[1] && recent3Days[1] < recent3Days[2];

    if (increasing) return 'up';
    if (decreasing) return 'down';
    return 'neutral';
  };

  const trendDirection = getTrendDirection();

  // Create a complete 7-day chart data including today and filling gaps
  const createSevenDayData = () => {
    const chartData = [];
    const today = new Date();
    const todayDateStr = usageData.today?.date || today.toISOString().split('T')[0];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Find existing data for this date
      let dayData;
      if (dateStr === todayDateStr) {
        // For today, use the today data which has the most up-to-date info
        dayData = usageData.today;
      } else {
        // For other days, look in recent data
        dayData = usageData.recent.find(d => d.date === dateStr);
      }

      chartData.push({
        date: dateStr,
        cost: dayData?.cost || 0,
        isToday: dateStr === todayDateStr
      });
    }

    return chartData;
  };

  const sevenDayData = createSevenDayData();
  // Use the same max calculation as the Dashboard's Recent 7 Days section
  const chartMaxCost = Math.max(...sevenDayData.map(d => d.cost || 0));


  return (
    <div className="trends-panel">
      <header className="trends-header">
        <h2>Usage Trends</h2>
      </header>

      <div className="trends-content">
        {/* Trend Summary */}
        <section className="trends-section">
          <h3>Summary</h3>
          <div className="trend-stats">
            <div className="trend-stat">
              <span className="stat-label">Daily Average</span>
              <span className="stat-value">{formatCurrency(averageCost)}</span>
            </div>
            <div className="trend-stat">
              <span className="stat-label">Week Total</span>
              <span className="stat-value">{formatCurrency(totalWeekCost)}</span>
            </div>
            <div className="trend-stat">
              <span className="stat-label">Highest Day</span>
              <span className="stat-value">{formatCurrency(maxCost)}</span>
            </div>
            <div className="trend-stat">
              <span className="stat-label">Daily Change</span>
              <span className={`stat-value ${percentageChange >= 0 ? 'positive' : 'negative'}`}>
                {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%
              </span>
            </div>
          </div>
        </section>

        {/* Visual Chart */}
        <section className="trends-section">
          <h3>7-Day Chart</h3>
          <div className="trend-chart">
            <div className="chart-container">
              {sevenDayData.map((day, index) => {
                const cost = day.cost || 0;
                const heightPercent = cost > 0 ? Math.min((cost / chartMaxCost) * 65, 65) : 0;
                return (
                  <div key={day.date} className="chart-bar">
                    <div
                      className="bar-fill"
                      style={{
                        height: cost > 0
                          ? `${heightPercent}px`
                          : '2px',
                        backgroundColor: (() => {
                          if (day.isToday) return '#007AFF'; // Blue for today
                          if (cost === 0) return '#E5E5E7'; // Gray for no usage
                          if (cost >= chartMaxCost * 0.7) return '#FF3B30'; // Red for high usage
                          if (cost >= chartMaxCost * 0.4) return '#FF9500'; // Orange for medium usage
                          return '#34C759'; // Green for low usage
                        })(),
                        minHeight: cost > 0 ? '4px' : '2px'
                      }}
                    />
                    <div className="bar-label">
                      <div className="bar-cost">{formatCurrency(cost)}</div>
                      <div className="bar-date">{formatDate(day.date)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#007AFF' }} />
                <span>Today</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#E5E5E7' }} />
                <span>Previous Days</span>
              </div>
            </div>
          </div>
        </section>


      </div>
    </div>
  );
};

const TrendIcon: React.FC<{ direction: 'up' | 'down' | 'neutral' }> = ({ direction }) => {
  if (direction === 'up') {
    return (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 2l6 6H9v6H7V8H2l6-6z"/>
      </svg>
    );
  }

  if (direction === 'down') {
    return (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 14L2 8h5V2h2v6h5l-6 6z"/>
      </svg>
    );
  }

  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 8h14"/>
    </svg>
  );
};

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
  </svg>
);

export default TrendsPanel;