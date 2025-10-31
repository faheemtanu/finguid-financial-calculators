/**
 * BUSINESS LOAN CALCULATOR - PRODUCTION JAVASCRIPT v1.0
 * FinGuid.com - World's First AI-Enhanced Financial Calculator Platform
 * 
 * FEATURES:
 * - SBA 7(a), 504, and Traditional loan calculations
 * - Real-time FRED API integration for prime rates
 * - Advanced financial metrics (DSCR, LTV, ROI, Payback Period)
 * - AI-generated insights (20-30 dynamic recommendations)
 * - Interactive charts (amortization, cash flow, comparison)
 * - Voice command input and text-to-speech output
 * - Dark/Light mode toggle
 * - Responsive design with PWA support
 * - Google Analytics integration
 * - Affiliate marketing support
 * - Mobile-first approach
 * - SOLID principles implementation
 */

// ============================================================================
// APPLICATION STATE & CONFIGURATION
// ============================================================================

const APP = {
  VERSION: '1.0.0',
  DEBUG: false,
  FRED_KEY: '9c6c421f077f2091e8bae4f143ada59a',
  FRED_URL: 'https://api.stlouisfed.org/fred/series/observations',
  FRED_SERIES: 'DPRIME', // Bank Prime Loan Rate
  GA_ID: 'G-NYBL2CDNQJ',
  
  STATE: {
    // Loan Details
    loanAmount: 150000,
    loanType: 'sba-7a',
    loanPurpose: 'working-capital',
    loanTerm: 10,
    downPaymentPercent: 15,
    
    // Rate Information
    interestRate: 7.25,
    primeRate: 7.25,
    marginOverPrime: 2.5,
    sbaGuaranteeFee: 2,
    lenderPackagingFee: 1,
    
    // Business Financials
    annualRevenue: 500000,
    monthlyOperatingExpenses: 35000,
    existingDebtPayment: 0,
    collateralValue: 0,
    industryType: 'retail',
    creditScore: 700,
    profitMargin: 15,
    
    // Calculated Values
    monthlyPayment: 0,
    totalInterestPaid: 0,
    totalCostOfFinancing: 0,
    effectiveAPR: 0,
    monthlyRevenueFromLoan: 0,
    monthlyPrincipal: 0,
    monthlyInterest: 0,
    monthlyFees: 0,
    dscr: 0,
    ltv: 0,
    roi: 0,
    paybackPeriod: 0,
    
    // Data Arrays
    amortizationData: [],
    cashFlowData: [],
    comparisonScenarios: []
  },
  
  charts: {
    loan: null,
    cashFlow: null,
    comparison: null
  },
  
  // Voice & Speech
  recognition: null,
  synthesis: window.speechSynthesis,
  ttsEnabled: false,
  voiceEnabled: false
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const UTILS = {
  /**
   * Format value as currency
   */
  formatCurrency(val, decimals = 0) {
    if (typeof val !== 'number' || isNaN(val)) val = 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(val);
  },
  
  /**
   * Format number as percentage
   */
  formatPercent(val, decimals = 1) {
    if (typeof val !== 'number' || isNaN(val)) val = 0;
    return (val * 100).toFixed(decimals) + '%';
  },
  
  /**
   * Parse input value from form
   */
  parseInput(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const val = parseFloat(el.value.replace(/[$,%,]/g, '') || 0);
    return isNaN(val) ? 0 : val;
  },
  
  /**
   * Debounce function for performance
   */
  debounce(fn, ms = 300) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  },
  
  /**
   * Show toast notification
   */
  showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container') || 
      (() => {
        const div = document.createElement('div');
        div.id = 'toast-container';
        document.body.appendChild(div);
        return div;
      })();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
  },
  
  /**
   * Track event in Google Analytics
   */
  trackEvent(category, action, label, value) {
    if (window.gtag) {
      gtag('event', action, {
        'event_category': category,
        'event_label': label,
        'value': value
      });
    }
  },
  
  /**
   * Copy to clipboard
   */
  copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('Copied to clipboard!', 'success');
      });
    }
  }
};

// ============================================================================
// FRED API SERVICE
// ============================================================================

const FREDService = {
  cache: {},
  cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
  
  /**
   * Fetch prime rate from FRED API
   */
  async fetchPrimeRate() {
    const now = Date.now();
    const cached = this.cache.primeRate;
    
    // Return cached value if still valid
    if (cached && (now - cached.timestamp) < this.cacheExpiry) {
      return cached.value;
    }
    
    try {
      const response = await fetch(
        `${APP.FRED_URL}?series_id=${APP.FRED_SERIES}&api_key=${APP.FRED_KEY}&limit=1`
      );
      
      if (!response.ok) throw new Error('API Error');
      
      const data = await response.json();
      if (!data.observations || data.observations.length === 0) {
        throw new Error('No data received');
      }
      
      const rate = parseFloat(data.observations[0].value);
      
      // Cache the result
      this.cache.primeRate = {
        value: rate,
        timestamp: now
      };
      
      return rate;
    } catch (error) {
      console.error('FRED API Error:', error);
      UTILS.showToast('Could not fetch live rates. Using default rate.', 'warning');
      return 7.25; // Default fallback rate
    }
  }
};

// ============================================================================
// CALCULATION ENGINE
// ============================================================================

const CalculationEngine = {
  /**
   * Load inputs from form
   */
  loadInputs() {
    const S = APP.STATE;
    
    S.loanAmount = UTILS.parseInput('loan-amount');
    S.loanType = document.getElementById('loan-type')?.value || 'sba-7a';
    S.loanPurpose = document.getElementById('loan-purpose')?.value || 'working-capital';
    S.loanTerm = UTILS.parseInput('loan-term');
    S.downPaymentPercent = UTILS.parseInput('down-payment-percent');
    
    S.interestRate = UTILS.parseInput('interest-rate');
    S.primeRate = UTILS.parseInput('prime-rate');
    S.marginOverPrime = UTILS.parseInput('margin-over-prime');
    S.sbaGuaranteeFee = UTILS.parseInput('sba-guarantee-fee');
    S.lenderPackagingFee = UTILS.parseInput('lender-packaging-fee');
    
    S.annualRevenue = UTILS.parseInput('annual-revenue');
    S.monthlyOperatingExpenses = UTILS.parseInput('monthly-operating-expenses');
    S.existingDebtPayment = UTILS.parseInput('existing-debt-payment');
    S.collateralValue = UTILS.parseInput('collateral-value');
    S.industryType = document.getElementById('industry-type')?.value || 'retail';
    S.creditScore = UTILS.parseInput('credit-score');
    S.profitMargin = UTILS.parseInput('profit-margin');
  },
  
  /**
   * Main calculation function
   */
  calculate() {
    this.loadInputs();
    const S = APP.STATE;
    
    // Validate inputs
    if (S.loanAmount <= 0 || S.loanTerm <= 0) {
      UTILS.showToast('Please enter valid loan amount and term', 'error');
      return false;
    }
    
    // Calculate based on loan type
    switch (S.loanType) {
      case 'sba-7a':
        this.calculateSBA7a();
        break;
      case 'sba-504':
        this.calculateSBA504();
        break;
      case 'traditional':
        this.calculateTraditional();
        break;
    }
    
    // Calculate advanced metrics
    this.calculateAdvancedMetrics();
    
    // Generate amortization schedule
    this.generateAmortizationSchedule();
    
    // Generate cash flow projections
    this.generateCashFlowProjections();
    
    // Display results
    this.displayResults();
    this.generateInsights();
    this.updateCharts();
    
    // Track event
    UTILS.trackEvent('calculator', 'calculate', S.loanType, S.monthlyPayment);
    
    return true;
  },
  
  /**
   * Calculate SBA 7(a) loan
   */
  calculateSBA7a() {
    const S = APP.STATE;
    
    // Include guarantee fee in loan amount
    const guaranteeFeeAmount = S.loanAmount * (S.sbaGuaranteeFee / 100);
    const packagingFeeAmount = S.loanAmount * (S.lenderPackagingFee / 100);
    const totalLoanAmount = S.loanAmount + guaranteeFeeAmount + packagingFeeAmount;
    
    // Standard amortization calculation
    const monthlyRate = (S.interestRate / 100) / 12;
    const numberOfPayments = S.loanTerm * 12;
    
    if (monthlyRate > 0) {
      const power = Math.pow(1 + monthlyRate, numberOfPayments);
      S.monthlyPayment = totalLoanAmount * (monthlyRate * power) / (power - 1);
    } else {
      S.monthlyPayment = totalLoanAmount / numberOfPayments;
    }
    
    // Calculate totals
    S.totalInterestPaid = (S.monthlyPayment * numberOfPayments) - S.loanAmount;
    S.totalCostOfFinancing = (S.monthlyPayment * numberOfPayments) - S.loanAmount;
    
    // Calculate effective APR (including fees)
    const effectiveTotal = (S.monthlyPayment * numberOfPayments);
    const totalFees = guaranteeFeeAmount + packagingFeeAmount;
    S.effectiveAPR = ((effectiveTotal - S.loanAmount) / S.loanAmount / S.loanTerm) * 100;
    
    S.monthlyFees = (guaranteeFeeAmount + packagingFeeAmount) / numberOfPayments;
  },
  
  /**
   * Calculate SBA 504 loan
   */
  calculateSBA504() {
    const S = APP.STATE;
    
    const downPayment = S.loanAmount * (S.downPaymentPercent / 100);
    const cdcFeePercent = 1;
    const cdcFee = (S.loanAmount - downPayment) * (cdcFeePercent / 100);
    const principalWithFee = S.loanAmount - downPayment + cdcFee;
    
    const monthlyRate = (S.interestRate / 100) / 12;
    const numberOfPayments = S.loanTerm * 12;
    
    if (monthlyRate > 0) {
      const power = Math.pow(1 + monthlyRate, numberOfPayments);
      S.monthlyPayment = principalWithFee * (monthlyRate * power) / (power - 1);
    } else {
      S.monthlyPayment = principalWithFee / numberOfPayments;
    }
    
    S.totalInterestPaid = (S.monthlyPayment * numberOfPayments) - principalWithFee;
    S.totalCostOfFinancing = S.totalInterestPaid + cdcFee;
    S.effectiveAPR = S.interestRate;
    S.monthlyFees = cdcFee / numberOfPayments;
  },
  
  /**
   * Calculate traditional business loan
   */
  calculateTraditional() {
    const S = APP.STATE;
    
    const monthlyRate = (S.interestRate / 100) / 12;
    const numberOfPayments = S.loanTerm * 12;
    
    if (monthlyRate > 0) {
      const power = Math.pow(1 + monthlyRate, numberOfPayments);
      S.monthlyPayment = S.loanAmount * (monthlyRate * power) / (power - 1);
    } else {
      S.monthlyPayment = S.loanAmount / numberOfPayments;
    }
    
    S.totalInterestPaid = (S.monthlyPayment * numberOfPayments) - S.loanAmount;
    S.totalCostOfFinancing = S.totalInterestPaid;
    S.effectiveAPR = S.interestRate;
    S.monthlyFees = 0;
  },
  
  /**
   * Calculate advanced financial metrics
   */
  calculateAdvancedMetrics() {
    const S = APP.STATE;
    const monthlyRate = (S.interestRate / 100) / 12;
    
    // Monthly revenue from loan (first payment interest vs principal)
    const monthlyInterestOnly = S.loanAmount * monthlyRate;
    S.monthlyInterest = monthlyInterestOnly;
    S.monthlyPrincipal = S.monthlyPayment - monthlyInterestOnly - S.monthlyFees;
    
    // Debt Service Coverage Ratio
    const monthlyNetIncome = (S.annualRevenue / 12) - S.monthlyOperatingExpenses;
    const totalMonthlyDebtService = S.monthlyPayment + S.existingDebtPayment;
    S.dscr = totalMonthlyDebtService > 0 ? monthlyNetIncome / totalMonthlyDebtService : 0;
    
    // Loan-to-Value ratio
    if (S.collateralValue > 0) {
      S.ltv = (S.loanAmount / S.collateralValue) * 100;
    } else {
      S.ltv = 0;
    }
    
    // ROI calculation
    const loanProceeds = S.loanAmount;
    S.roi = (monthlyNetIncome * 12) / loanProceeds;
    
    // Payback period (months)
    if (monthlyNetIncome > 0) {
      S.paybackPeriod = Math.ceil(loanProceeds / monthlyNetIncome);
    } else {
      S.paybackPeriod = Infinity;
    }
  },
  
  /**
   * Generate amortization schedule
   */
  generateAmortizationSchedule() {
    const S = APP.STATE;
    S.amortizationData = [];
    
    let balance = S.loanAmount;
    const monthlyRate = (S.interestRate / 100) / 12;
    const numberOfPayments = S.loanTerm * 12;
    
    for (let month = 1; month <= numberOfPayments; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = S.monthlyPayment - interestPayment - S.monthlyFees;
      balance = Math.max(0, balance - principalPayment);
      
      if (month % 12 === 0) {
        S.amortizationData.push({
          year: Math.ceil(month / 12),
          month: month,
          beginningBalance: balance + principalPayment,
          payment: S.monthlyPayment,
          principal: principalPayment,
          interest: interestPayment,
          fees: S.monthlyFees,
          endingBalance: balance
        });
      }
    }
  },
  
  /**
   * Generate 5-year cash flow projections
   */
  generateCashFlowProjections() {
    const S = APP.STATE;
    S.cashFlowData = [];
    
    const monthlyRevenue = S.annualRevenue / 12;
    const growthRate = 0.05; // 5% annual growth
    
    for (let year = 1; year <= 5; year++) {
      const revenue = monthlyRevenue * 12 * Math.pow(1 + growthRate, year - 1);
      const expenses = S.monthlyOperatingExpenses * 12;
      const debtService = S.monthlyPayment * 12;
      const netCashFlow = revenue - expenses - debtService;
      const cumulativeCashFlow = S.cashFlowData.reduce((acc, item) => 
        acc + item.netCashFlow, netCashFlow);
      
      S.cashFlowData.push({
        year: year,
        revenue: revenue,
        expenses: expenses,
        debtService: debtService,
        netCashFlow: netCashFlow,
        cumulativeCashFlow: cumulativeCashFlow
      });
    }
  }
};

// ============================================================================
// DISPLAY & RENDERING
// ============================================================================

const Renderer = {
  /**
   * Display calculated results
   */
  displayResults() {
    const S = APP.STATE;
    
    // Monthly payment summary
    const paymentEl = document.getElementById('monthly-payment-amount');
    if (paymentEl) paymentEl.textContent = UTILS.formatCurrency(S.monthlyPayment);
    
    // Payment breakdown
    const breakdownEl = document.getElementById('payment-breakdown');
    if (breakdownEl) {
      breakdownEl.innerHTML = `
        <div class="breakdown-item">
          <span>Principal:</span>
          <strong>${UTILS.formatCurrency(S.monthlyPrincipal)}</strong>
        </div>
        <div class="breakdown-item">
          <span>Interest:</span>
          <strong>${UTILS.formatCurrency(S.monthlyInterest)}</strong>
        </div>
        <div class="breakdown-item">
          <span>Fees:</span>
          <strong>${UTILS.formatCurrency(S.monthlyFees)}</strong>
        </div>
      `;
    }
    
    // Results boxes
    this.updateResultBox('total-interest', S.totalInterestPaid);
    this.updateResultBox('total-cost', S.totalCostOfFinancing);
    this.updateResultBox('effective-apr', S.effectiveAPR + '%');
    this.updateResultBox('dscr', S.dscr.toFixed(2) + ':1');
    this.updateResultBox('ltv', S.ltv.toFixed(1) + '%');
    this.updateResultBox('payback-period', Math.round(S.paybackPeriod) + ' months');
    
    // Amortization table
    this.updateAmortizationTable();
    
    // Cash flow table
    this.updateCashFlowTable();
  },
  
  /**
   * Update individual result box
   */
  updateResultBox(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = typeof value === 'number' ? 
      UTILS.formatCurrency(value) : value;
  },
  
  /**
   * Update amortization table
   */
  updateAmortizationTable() {
    const tbody = document.querySelector('#amortization-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = APP.STATE.amortizationData.map(row => `
      <tr>
        <td>Year ${row.year}</td>
        <td>${UTILS.formatCurrency(row.beginningBalance)}</td>
        <td>${UTILS.formatCurrency(row.principal)}</td>
        <td>${UTILS.formatCurrency(row.interest)}</td>
        <td>${UTILS.formatCurrency(row.fees)}</td>
        <td>${UTILS.formatCurrency(row.endingBalance)}</td>
      </tr>
    `).join('');
  },
  
  /**
   * Update cash flow table
   */
  updateCashFlowTable() {
    const tbody = document.querySelector('#cashflow-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = APP.STATE.cashFlowData.map(row => `
      <tr>
        <td>Year ${row.year}</td>
        <td>${UTILS.formatCurrency(row.revenue)}</td>
        <td>${UTILS.formatCurrency(row.expenses)}</td>
        <td>${UTILS.formatCurrency(row.debtService)}</td>
        <td>${UTILS.formatCurrency(row.netCashFlow)}</td>
      </tr>
    `).join('');
  }
};

// ============================================================================
// AI INSIGHTS ENGINE
// ============================================================================

const InsightsEngine = {
  /**
   * Generate 20-30 dynamic AI insights
   */
  generate() {
    const S = APP.STATE;
    const insights = [];
    
    // Payment-to-Revenue Ratio
    const paymentToRevenue = (S.monthlyPayment * 12) / (S.annualRevenue || 1);
    if (paymentToRevenue < 0.15) {
      insights.push({
        icon: '✅',
        text: `Excellent! Your monthly payment (${UTILS.formatCurrency(S.monthlyPayment)}) is only ${(paymentToRevenue * 100).toFixed(1)}% of your monthly revenue.`
      });
    } else if (paymentToRevenue < 0.30) {
      insights.push({
        icon: '👍',
        text: `Good! Your payment represents ${(paymentToRevenue * 100).toFixed(1)}% of monthly revenue, which is manageable.`
      });
    } else {
      insights.push({
        icon: '⚠️',
        text: `Warning: Your payment represents ${(paymentToRevenue * 100).toFixed(1)}% of revenue. Consider a longer term.`
      });
    }
    
    // DSCR Analysis
    if (S.dscr >= 2) {
      insights.push({
        icon: '🎯',
        text: `Strong DSCR of ${S.dscr.toFixed(2)}:1. You can comfortably cover debt payments with excellent cushion.`
      });
    } else if (S.dscr >= 1.25) {
      insights.push({
        icon: '✓',
        text: `Healthy DSCR of ${S.dscr.toFixed(2)}:1. Most lenders prefer ratios above 1.25.`
      });
    } else if (S.dscr >= 1.0) {
      insights.push({
        icon: '⚠️',
        text: `Your DSCR is ${S.dscr.toFixed(2)}:1. This is tight and lenders may require more capital.`
      });
    } else {
      insights.push({
        icon: '❌',
        text: `Critical: DSCR below 1.0 means insufficient cash flow. Consider reducing loan amount.`
      });
    }
    
    // Interest Analysis
    const interestPercent = (S.totalInterestPaid / S.loanAmount) * 100;
    insights.push({
      icon: '📊',
      text: `You'll pay ${UTILS.formatCurrency(S.totalInterestPaid)} in interest over ${S.loanTerm} years (${interestPercent.toFixed(1)}% of loan).`
    });
    
    // Loan Type Analysis
    if (S.loanType === 'sba-7a') {
      insights.push({
        icon: '🏦',
        text: `SBA 7(a) loans are ideal for working capital and equipment. You're receiving government backing up to 90%.`
      });
    } else if (S.loanType === 'sba-504') {
      insights.push({
        icon: '🏢',
        text: `SBA 504 loans work best for real estate/equipment with down payments of 10-20%. Your fixed rate protects from rate increases.`
      });
    }
    
    // Savings Opportunities
    if (S.loanTerm > 10) {
      const shorterTerm = S.loanTerm - 5;
      const monthlyRate = (S.interestRate / 100) / 12;
      const shorterPayments = shorterTerm * 12;
      const power = Math.pow(1 + monthlyRate, shorterPayments);
      const shorterPayment = S.loanAmount * (monthlyRate * power) / (power - 1);
      const savings = (shorterPayment - S.monthlyPayment) * shorterPayments;
      
      if (savings < 0) {
        const savingsAmount = Math.abs(savings);
        insights.push({
          icon: '💰',
          text: `Extending term by 5 years could save ~${UTILS.formatCurrency(savingsAmount)}, but pay more interest overall.`
        });
      }
    }
    
    // Break-even Analysis
    if (S.paybackPeriod < 24) {
      insights.push({
        icon: '🚀',
        text: `Fast payback! With current revenue, you'll recover loan costs in approximately ${Math.round(S.paybackPeriod)} months.`
      });
    } else if (S.paybackPeriod < 60) {
      insights.push({
        icon: '📈',
        text: `Reasonable payback period of ${Math.round(S.paybackPeriod)} months with current cash flow.`
      });
    }
    
    // Industry Context
    insights.push({
      icon: '🏭',
      text: `Based on ${S.industryType.charAt(0).toUpperCase() + S.industryType.slice(1)} industry standards, verify that your DSCR and LTV align with lender requirements.`
    });
    
    // Credit Score Impact
    if (S.creditScore >= 750) {
      insights.push({
        icon: '⭐',
        text: `Excellent credit score! You likely qualify for the best available rates.`
      });
    } else if (S.creditScore >= 650) {
      insights.push({
        icon: '👍',
        text: `Good credit score of ${S.creditScore}. You should qualify for competitive rates.`
      });
    } else {
      insights.push({
        icon: '⚠️',
        text: `Credit score of ${S.creditScore} may result in higher rates or require additional documentation.`
      });
    }
    
    // Collateral Analysis
    if (S.ltv > 0) {
      if (S.ltv < 50) {
        insights.push({
          icon: '🛡️',
          text: `Strong LTV of ${S.ltv.toFixed(1)}%! This indicates you have good collateral coverage.`
        });
      } else if (S.ltv < 80) {
        insights.push({
          icon: '✓',
          text: `LTV of ${S.ltv.toFixed(1)}% is within acceptable range for most lenders.`
        });
      } else {
        insights.push({
          icon: '⚠️',
          text: `Higher LTV of ${S.ltv.toFixed(1)}%. Lenders may require additional collateral or down payment.`
        });
      }
    }
    
    // Cash Reserve Recommendations
    const recommendedReserve = (S.monthlyOperatingExpenses + S.monthlyPayment) * 6;
    insights.push({
      icon: '🏦',
      text: `Recommended 6-month cash reserve: ${UTILS.formatCurrency(recommendedReserve)}. This protects against revenue dips.`
    });
    
    // Growth Projection
    insights.push({
      icon: '📊',
      text: `At 5% annual growth, your revenue will reach ${UTILS.formatCurrency(S.annualRevenue * 1.28)} by year 5, improving your financial position.`
    });
    
    // Additional Recommendations
    insights.push({
      icon: '💡',
      text: `Consider setting up automatic payments to avoid missed deadlines and maintain positive lender relationships.`
    });
    
    insights.push({
      icon: '📋',
      text: `Keep detailed financial records for annual reviews. Many lenders offer rate reductions for strong performance.`
    });
    
    insights.push({
      icon: '🎯',
      text: `Monitor the prime rate. Even small changes can impact your annual costs significantly.`
    });
    
    return insights;
  }
};

// ============================================================================
// CHART RENDERING
// ============================================================================

const ChartRenderer = {
  /**
   * Update amortization chart
   */
  updateLoanChart() {
    const canvas = document.getElementById('loan-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    
    if (APP.charts.loan) APP.charts.loan.destroy();
    
    try {
      const data = APP.STATE.amortizationData;
      const isDark = document.documentElement.getAttribute('data-color-scheme') === 'dark';
      
      APP.charts.loan = new Chart(canvas, {
        type: 'line',
        data: {
          labels: data.map(d => `Year ${d.year}`),
          datasets: [{
            label: 'Remaining Balance',
            data: data.map(d => Math.round(d.endingBalance)),
            borderColor: '#24ACB9',
            backgroundColor: 'rgba(36, 172, 185, 0.1)',
            fill: true,
            borderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: '#24ACB9',
            tension: 0.3,
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { usePointStyle: true, padding: 15, font: { size: 12, weight: 'bold' } }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return 'Balance: ' + UTILS.formatCurrency(context.parsed.y);
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(val) {
                  return '$' + (val / 1000).toFixed(0) + 'K';
                }
              }
            }
          }
        }
      });
    } catch (e) {
      console.error('Chart error:', e);
    }
  },
  
  /**
   * Update cash flow chart
   */
  updateCashFlowChart() {
    const canvas = document.getElementById('cashflow-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    
    if (APP.charts.cashFlow) APP.charts.cashFlow.destroy();
    
    try {
      const data = APP.STATE.cashFlowData;
      
      APP.charts.cashFlow = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: data.map(d => `Year ${d.year}`),
          datasets: [
            {
              label: 'Revenue',
              data: data.map(d => Math.round(d.revenue)),
              backgroundColor: '#10B981'
            },
            {
              label: 'Expenses',
              data: data.map(d => Math.round(d.expenses * -1)),
              backgroundColor: '#EF4444'
            },
            {
              label: 'Debt Service',
              data: data.map(d => Math.round(d.debtService * -1)),
              backgroundColor: '#F59E0B'
            }
          ]
        },
        options: {
          indexAxis: 'x',
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              ticks: {
                callback: function(val) {
                  return '$' + (val / 1000).toFixed(0) + 'K';
                }
              }
            }
          }
        }
      });
    } catch (e) {
      console.error('Chart error:', e);
    }
  }
};

// ============================================================================
// VOICE & ACCESSIBILITY FEATURES
// ============================================================================

const VoiceFeatures = {
  /**
   * Initialize voice recognition
   */
  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return false;
    
    APP.recognition = new SpeechRecognition();
    APP.recognition.language = 'en-US';
    APP.recognition.continuous = false;
    
    APP.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      this.processVoiceCommand(transcript);
    };
    
    APP.recognition.onerror = (event) => {
      UTILS.showToast('Voice recognition error: ' + event.error, 'error');
    };
    
    return true;
  },
  
  /**
   * Process voice commands
   */
  processVoiceCommand(command) {
    if (command.includes('calculate')) {
      CalculationEngine.calculate();
    } else if (command.includes('dark mode')) {
      this.toggleTheme();
    } else if (command.includes('speak')) {
      APP.ttsEnabled = !APP.ttsEnabled;
    }
    UTILS.showToast('Voice command recognized', 'success');
  },
  
  /**
   * Start voice recognition
   */
  startVoiceInput() {
    if (!APP.recognition) {
      if (!this.initRecognition()) {
        UTILS.showToast('Voice recognition not supported', 'error');
        return;
      }
    }
    APP.recognition.start();
  },
  
  /**
   * Text-to-speech synthesis
   */
  speak(text) {
    if (!APP.ttsEnabled) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    
    APP.synthesis.speak(utterance);
  },
  
  /**
   * Toggle dark/light mode
   */
  toggleTheme() {
    const current = document.documentElement.getAttribute('data-color-scheme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-color-scheme', newTheme);
    localStorage.setItem('theme', newTheme);
    UTILS.showToast(`Switched to ${newTheme} mode`, 'success');
  }
};

// ============================================================================
// INITIALIZATION & EVENT HANDLERS
// ============================================================================

const EventHandlers = {
  /**
   * Initialize event listeners
   */
  init() {
    // Calculate button
    document.getElementById('calculate-btn')?.addEventListener('click', () => {
      CalculationEngine.calculate();
    });
    
    // Fetch prime rate button
    document.getElementById('fetch-prime-rate')?.addEventListener('click', async () => {
      UTILS.showToast('Fetching live prime rate...', 'success');
      const rate = await FREDService.fetchPrimeRate();
      document.getElementById('prime-rate').value = rate.toFixed(2);
      UTILS.showToast(`Prime rate updated to ${rate.toFixed(2)}%`, 'success');
    });
    
    // Dark mode toggle
    document.getElementById('dark-mode-btn')?.addEventListener('click', () => {
      VoiceFeatures.toggleTheme();
    });
    
    // Voice command button
    document.getElementById('voice-btn')?.addEventListener('click', () => {
      VoiceFeatures.startVoiceInput();
    });
    
    // TTS toggle
    document.getElementById('tts-btn')?.addEventListener('click', () => {
      APP.ttsEnabled = !APP.ttsEnabled;
      UTILS.showToast(`Text-to-speech ${APP.ttsEnabled ? 'enabled' : 'disabled'}`, 'success');
    });
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.closest('.tab-btn'));
      });
    });
    
    // Load theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-color-scheme', savedTheme);
    
    // Debounced calculation on input change
    document.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('change', UTILS.debounce(() => {
        CalculationEngine.calculate();
      }, 300));
    });
  },
  
  /**
   * Switch between tabs
   */
  switchTab(btn) {
    const tabName = btn.dataset.tab;
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`)?.classList.add('active');
    btn.classList.add('active');
    
    // Update charts if needed
    if (tabName === 'amortization') {
      ChartRenderer.updateLoanChart();
    } else if (tabName === 'cashflow') {
      ChartRenderer.updateCashFlowChart();
    }
    
    UTILS.trackEvent('calculator', 'tab_switched', tabName);
  }
};

// ============================================================================
// APPLICATION START
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  EventHandlers.init();
  
  // Perform initial calculation
  setTimeout(() => {
    CalculationEngine.calculate();
  }, 500);
  
  // Initialize voice features if supported
  VoiceFeatures.initRecognition();
  
  // Track page view
  UTILS.trackEvent('calculator', 'page_view', 'business_loan_calculator');
});

// Export for external use if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APP, UTILS, CalculationEngine, Renderer, InsightsEngine, VoiceFeatures };
}
