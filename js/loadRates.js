/**
 * FRED Data Loader - Client-side library
 * Loads economic data from /data/rates.json
 * Production-ready with caching, retry logic, and error handling
 */

class FREDDataLoader {
  constructor(options = {}) {
    this.dataUrl = options.dataUrl || '/data/rates.json';
    this.cacheDuration = options.cacheDuration || 3600000; // 1 hour
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.cache = null;
    this.cacheTimestamp = null;
  }

  async loadRates() {
    if (this.isCacheValid()) {
      console.log('📦 Using cached FRED data');
      return this.cache;
    }
    console.log('🌐 Fetching fresh FRED data...');
    return this.fetchWithRetry();
  }

  isCacheValid() {
    if (!this.cache || !this.cacheTimestamp) return false;
    const cacheAge = Date.now() - this.cacheTimestamp;
    return cacheAge < this.cacheDuration;
  }

  async fetchWithRetry(attempt = 1) {
    try {
      const response = await fetch(this.dataUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.categories || !data.metadata) {
        throw new Error('Invalid data structure received');
      }

      this.cache = data;
      this.cacheTimestamp = Date.now();

      console.log('✅ FRED data loaded successfully');
      console.log(`📊 Categories: ${Object.keys(data.categories).join(', ')}`);
      console.log(`⏰ Last updated: ${data.metadata.last_updated}`);

      return data;

    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);

      if (attempt < this.retryAttempts) {
        console.log(`🔄 Retrying in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.fetchWithRetry(attempt + 1);
      }

      throw new Error(`Failed to load FRED data after ${this.retryAttempts} attempts`);
    }
  }

  async getRate(category, seriesId) {
    const data = await this.loadRates();
    if (!data.categories[category]) {
      console.warn(`Category '${category}' not found`);
      return null;
    }
    if (!data.categories[category][seriesId]) {
      console.warn(`Series '${seriesId}' not found`);
      return null;
    }
    return data.categories[category][seriesId];
  }

  async getLatestValue(category, seriesId) {
    const series = await this.getRate(category, seriesId);
    if (!series || !series.data || !series.data.observations || series.data.observations.length === 0) {
      return null;
    }
    return series.data.observations[0].value;
  }

  async getCategory(category) {
    const data = await this.loadRates();
    return data.categories[category] || null;
  }

  async getMetadata() {
    const data = await this.loadRates();
    return data.metadata;
  }

  clearCache() {
    this.cache = null;
    this.cacheTimestamp = null;
    console.log('🗑️ Cache cleared');
  }
}

// Create singleton instance
const fredLoader = new FREDDataLoader({
  dataUrl: '/data/rates.json',
  cacheDuration: 3600000,
  retryAttempts: 3,
  retryDelay: 1000
});

// Convenience functions
async function getCurrentMortgageRate() {
  return fredLoader.getLatestValue('mortgage', 'MORTGAGE30US');
}

async function get15YearMortgageRate() {
  return fredLoader.getLatestValue('mortgage', 'MORTGAGE15US');
}

async function getTreasuryRate10Year() {
  return fredLoader.getLatestValue('treasury', 'DGS10');
}

function formatRate(rate, decimals = 2) {
  if (rate === null || rate === undefined) return 'N/A';
  return `${rate.toFixed(decimals)}%`;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FREDDataLoader,
    fredLoader,
    getCurrentMortgageRate,
    get15YearMortgageRate,
    getTreasuryRate10Year,
    formatRate
  };
}

// Export for browser
if (typeof window !== 'undefined') {
  window.FREDDataLoader = FREDDataLoader;
  window.fredLoader = fredLoader;
  window.getCurrentMortgageRate = getCurrentMortgageRate;
  window.get15YearMortgageRate = get15YearMortgageRate;
  window.getTreasuryRate10Year = getTreasuryRate10Year;
  window.formatRate = formatRate;
}
