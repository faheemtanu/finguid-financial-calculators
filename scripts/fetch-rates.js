// scripts/fetch-rates.js
const fs = require('fs').promises;
const path = require('path');

const FRED_API_KEY = process.env.FRED_API_KEY;
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

const SERIES_CONFIG = {
  mortgage: {
    'MORTGAGE30US': {
      name: '30-Year Fixed Rate Mortgage Average',
      frequency: 'weekly',
      units: 'percent'
    },
    'MORTGAGE15US': {
      name: '15-Year Fixed Rate Mortgage Average',
      frequency: 'weekly',
      units: 'percent'
    },
    'MORTGAGE5US': {
      name: '5/1-Year Adjustable Rate Mortgage Average',
      frequency: 'weekly',
      units: 'percent'
    }
  },
  treasury: {
    'DGS10': {
      name: '10-Year Treasury Constant Maturity Rate',
      frequency: 'daily',
      units: 'percent'
    },
    'DGS2': {
      name: '2-Year Treasury Constant Maturity Rate',
      frequency: 'daily',
      units: 'percent'
    }
  },
  inflation: {
    'CPIAUCSL': {
      name: 'Consumer Price Index for All Urban Consumers',
      frequency: 'monthly',
      units: 'index'
    },
    'CPILFESL': {
      name: 'Core CPI (excl. Food & Energy)',
      frequency: 'monthly',
      units: 'index'
    }
  },
  employment: {
    'UNRATE': {
      name: 'Unemployment Rate',
      frequency: 'monthly',
      units: 'percent'
    }
  },
  gdp: {
    'GDP': {
      name: 'Gross Domestic Product',
      frequency: 'quarterly',
      units: 'billions'
    }
  }
};

async function fetchSeriesData(seriesId) {
  if (!FRED_API_KEY) {
    throw new Error('FRED_API_KEY environment variable is not set');
  }

  const url = new URL(FRED_BASE_URL);
  url.searchParams.append('series_id', seriesId);
  url.searchParams.append('api_key', FRED_API_KEY);
  url.searchParams.append('file_type', 'json');
  url.searchParams.append('sort_order', 'desc');
  url.searchParams.append('limit', '100');

  try {
    console.log(`Fetching data for ${seriesId}...`);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`FRED API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.observations || data.observations.length === 0) {
      console.warn(`No observations found for ${seriesId}`);
      return null;
    }

    const validObservations = data.observations
      .filter(obs => obs.value !== '.')
      .map(obs => ({
        date: obs.date,
        value: parseFloat(obs.value),
        realtime_start: obs.realtime_start,
        realtime_end: obs.realtime_end
      }));

    return {
      series_id: seriesId,
      realtime_start: data.realtime_start,
      realtime_end: data.realtime_end,
      observation_start: data.observation_start,
      observation_end: data.observation_end,
      units: data.units,
      count: validObservations.length,
      observations: validObservations
    };

  } catch (error) {
    console.error(`Error fetching ${seriesId}:`, error.message);
    return null;
  }
}

async function fetchAllRates() {
  const result = {
    metadata: {
      last_updated: new Date().toISOString(),
      source: 'Federal Reserve Economic Data (FRED)',
      api_url: 'https://fred.stlouisfed.org/',
      data_provider: 'Federal Reserve Bank of St. Louis'
    },
    categories: {}
  };

  for (const [category, series] of Object.entries(SERIES_CONFIG)) {
    console.log(`\nProcessing category: ${category}`);
    result.categories[category] = {};

    const seriesIds = Object.keys(series);
    const dataPromises = seriesIds.map(seriesId => fetchSeriesData(seriesId));
    const dataResults = await Promise.all(dataPromises);

    seriesIds.forEach((seriesId, index) => {
      const seriesData = dataResults[index];
      if (seriesData) {
        result.categories[category][seriesId] = {
          ...SERIES_CONFIG[category][seriesId],
          data: seriesData
        };
      }
    });
  }

  return result;
}

async function saveToFile(data, filepath) {
  try {
    const dir = path.dirname(filepath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`\n✅ Data saved successfully to ${filepath}`);
    console.log(`📊 Total categories: ${Object.keys(data.categories).length}`);
    
    for (const [category, series] of Object.entries(data.categories)) {
      console.log(`   - ${category}: ${Object.keys(series).length} series`);
    }
  } catch (error) {
    console.error(`Error saving file:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting FRED data fetch...');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  try {
    const data = await fetchAllRates();
    const outputPath = path.join(__dirname, '..', 'data', 'rates.json');
    await saveToFile(data, outputPath);
    
    console.log('\n✨ FRED data fetch completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fetchSeriesData, fetchAllRates, saveToFile };
