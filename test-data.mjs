import { loadDailyUsageData } from 'ccusage/data-loader';
import { calculateTotals } from 'ccusage/calculate-cost';

async function test() {
  const dailyData = await loadDailyUsageData();
  const todayData = dailyData.find(d => d.date === '2025-09-17') || { cost: 0 };
  const yesterdayData = dailyData.find(d => d.date === '2025-09-16') || {
    cost: 0,
  };

  console.log('Today data:', JSON.stringify(todayData, null, 1));
  console.log('Yesterday data:', JSON.stringify(yesterdayData, null, 1));

  // Add compatibility layer
  if (todayData && !todayData.models && todayData.modelsUsed) {
    todayData.models = todayData.modelsUsed.reduce((acc, model) => {
      acc[model] = true;
      return acc;
    }, {});
  }

  const totals = calculateTotals(dailyData);
  totals.cost = totals.totalCost;

  console.log(
    'Final today data with models:',
    JSON.stringify(todayData, null, 1)
  );
  console.log('Final totals with cost:', JSON.stringify(totals, null, 1));
}
test();
