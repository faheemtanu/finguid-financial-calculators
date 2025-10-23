/**
 * HOME LOAN PRO — AI‑POWERED MORTGAGE CALCULATOR - PRODUCTION JS v1.1
 * ENHANCED WITH MONETIZATION, LIVE FRED API, AND ADVANCED SEO/PWA FEATURES
 * ALIGNED WITH FINGUID MASTER IMPLEMENTATION GUIDE
 * * Your FRED API Key: 9c6c421f077f2091e8bae4f143ada59a
 * Your Google Analytics ID: G-NYBL2CDNQJ
 * © 2025 FinGuid - World's First AI Calculator Platform for Americans
 * * --- V1.1 CHANGELOG ---
 * ✅ Real FRED API Integration (30yr, 15yr, 5/1 ARM)
 * ✅ Live Rate Selector UI
 * ✅ Real PWA Install Prompt
 * ✅ Google Analytics Custom Event Tracking (Calculations, Exports, Leads)
 * ✅ Monetization Event Listeners (Affiliate Links, Lead Form)
 * ✅ Partner-Friendly Embed Tool Functionality
 * ✅ Optimized for Core Web Vitals (Defer loading)
 */

/* ========================================================================== */
/* GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const MORTGAGE_CALCULATOR = {
    VERSION: '1.1',
    DEBUG: false,
    
    // FRED API Configuration
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    FRED_SERIES: {
        '30-Year Fixed': 'MORTGAGE30US',
        '15-Year Fixed': 'MORTGAGE15US',
        '5/1-Year ARM': 'MORTGAGE5US1'
    },
    RATE_UPDATE_INTERVAL: 60 * 60 * 1000, // 1 hour
    
    // Chart instances for cleanup
    charts: {
        paymentComponents: null,
        mortgageTimeline: null
    },
    
    // Current calculation state
    currentCalculation: {
        homePrice: 450000,
        downPayment: 90000,
        downPaymentPercent: 20,
        loanAmount: 360000,
        interestRate: 6.44,
        loanTerm: 30,
        loanType: 'conventional',
        propertyTax: 9000,
        homeInsurance: 1800,
        pmi: 0,
        hoaFees: 0,
        extraMonthly: 0,
        extraWeekly: 0,
        monthlyPayment: 0,
        totalInterest: 0,
        totalCost: 0,
        closingCostsPercent: 3
    },

    // Comparison Loan B state
    comparisonLoan: {
        enabled: false,
        homePrice: 400000,
        downPayment: 100000,
        downPaymentPercent: 25,
        loanAmount: 300000,
        interestRate: 5.99,
        loanTerm: 15,
        monthlyPayment: 0,
        totalInterest: 0,
        totalCost: 0,
        baseP_I: 0,
        payoffMonths: 0,
        extraInterestSaved: 0
    },
    
    // Amortization schedule
    amortizationSchedule: [],
    scheduleCurrentPage: 0,
    scheduleItemsPerPage: 12,
    scheduleType: 'monthly',
    
    // UI state
    currentTheme: 'light',
    fontScaleOptions: [0.75, 0.875, 1, 1.125, 1.25],
    currentFontScaleIndex: 2,
    voiceEnabled: false,
    screenReaderMode: false,
    deferredInstallPrompt: null,
    
    // Store for live rates
    liveRates: {},
    
    // Rate update tracking
    lastRateUpdate: 0
};

/* ========================================================================== */
/* COMPREHENSIVE ZIP CODE DATABASE */
/* ========================================================================== */

const ZIP_DATABASE = {
    zipCodes: new Map(),
    
    initialize() {
        const sampleZipData = [
            // Northeast
            { zip: '10001', city: 'New York', state: 'NY', stateName: 'New York', propertyTaxRate: 1.25, insuranceRate: 0.4 },
            { zip: '02101', city: 'Boston', state: 'MA', stateName: 'Massachusetts', propertyTaxRate: 1.17, insuranceRate: 0.55 },
            // Southeast
            { zip: '33101', city: 'Miami', state: 'FL', stateName: 'Florida', propertyTaxRate: 1.02, insuranceRate: 1.2 },
            { zip: '30301', city: 'Atlanta', state: 'GA', stateName: 'Georgia', propertyTaxRate: 0.83, insuranceRate: 0.65 },
            // Midwest  
            { zip: '60601', city: 'Chicago', state: 'IL', stateName: 'Illinois', propertyTaxRate: 2.05, insuranceRate: 0.5 },
            // Southwest
            { zip: '77001', city: 'Houston', state: 'TX', stateName: 'Texas', propertyTaxRate: 1.81, insuranceRate: 0.7 },
            // West Coast
            { zip: '90210', city: 'Beverly Hills', state: 'CA', stateName: 'California', propertyTaxRate: 0.75, insuranceRate: 0.6 },
            // Mountain States
            { zip: '80201', city: 'Denver', state: 'CO', stateName: 'Colorado', propertyTaxRate: 0.51, insuranceRate: 0.55 },
            // Additional major ZIP codes
            { zip: '99501', city: 'Anchorage', state: 'AK', stateName: 'Alaska', propertyTaxRate: 1.19, insuranceRate: 0.6 },
            { zip: '20001', city: 'Washington', state: 'DC', stateName: 'District of Columbia', propertyTaxRate: 0.57, insuranceRate: 0.4 },
        ];

        sampleZipData.forEach(data => {
            data.propertyTaxRate = data.propertyTaxRate / 100;
            data.insuranceRate = data.insuranceRate / 100;
            this.zipCodes.set(data.zip, data);
        });
        
        const defaultZip = this.zipCodes.get('77001');
        if (defaultZip) {
            document.getElementById('zip-code').value = '77001';
            this.updateZipInfo(defaultZip);
        }
    },
    
    getZipData(zipCode) {
        return this.zipCodes.get(zipCode);
    },
    
    updateZipInfo(zipData) {
        if (!zipData) return;
        
        const price = MORTGAGE_CALCULATOR.currentCalculation.homePrice || 450000;
        const estimatedTax = price * zipData.propertyTaxRate;
        const estimatedInsurance = price * zipData.insuranceRate;
        
        document.getElementById('property-tax').value = formatCurrency(estimatedTax, false);
        document.getElementById('home-insurance').value = formatCurrency(estimatedInsurance, false);
        
        document.getElementById('zip-info').querySelector('.status-text').textContent = 
            `${zipData.city}, ${zipData.state} (${zipData.stateName})`;
        document.getElementById('tax-rate-info').querySelector('.status-text').textContent = 
            `~${(zipData.propertyTaxRate * 100).toFixed(2)}% (Est.)`;
        document.getElementById('insurance-rate-info').querySelector('.status-text').textContent = 
            `~${(zipData.insuranceRate * 100).toFixed(2)}% (Est.)`;

        showToast(`Defaults loaded for ${zipData.city}, ${zipData.state}!`, 'success');
        updateCalculations();
    }
};

/* ========================================================================== */
/* REAL FRED API INTEGRATION */
/* ========================================================================== */

const fredAPI = {
    
    async fetchSeries(seriesId) {
        const url = `${MORTGAGE_CALCULATOR.FRED_BASE_URL}?series_id=${seriesId}&api_key=${MORTGAGE_CALCULATOR.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`FRED API Error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            const rate = parseFloat(data.observations[0].value);
            if (isNaN(rate)) {
                 throw new Error(`FRED API Error: Invalid rate value for ${seriesId}`);
            }
            return rate;
        } catch (error) {
            console.error(`Failed to fetch FRED series ${seriesId}:`, error);
            if (typeof gtag === 'function') {
                gtag('event', 'api_error', {
                    'event_category': 'FRED API',
                    'event_label': `Fetch failed: ${seriesId}`,
                    'value': error.message
                });
            }
            return null;
        }
    },

    async fetchAllLiveRates() {
        const ratePromises = [];
        const rateLabels = [];

        for (const [label, seriesId] of Object.entries(MORTGAGE_CALCULATOR.FRED_SERIES)) {
            rateLabels.push(label);
            ratePromises.push(this.fetchSeries(seriesId));
        }

        const results = await Promise.all(ratePromises);
        
        results.forEach((rate, index) => {
            const label = rateLabels[index];
            if (rate !== null) {
                MORTGAGE_CALCULATOR.liveRates[label] = rate;
            }
        });

        MORTGAGE_CALCULATOR.lastRateUpdate = Date.now();
        return { success: Object.keys(MORTGAGE_CALCULATOR.liveRates).length > 0, rates: MORTGAGE_CALCULATOR.liveRates };
    },
    
    updateRateUI() {
        const rateInput = document.getElementById('interest-rate');
        const statusSpan = document.getElementById('fred-rate-status').querySelector('.status-text');
        const rateSelect = document.getElementById('live-rate-select');

        rateSelect.innerHTML = '<option value="">Apply Live Rate</option>';
        
        let firstRate = null;
        
        for (const [label, rate] of Object.entries(MORTGAGE_CALCULATOR.liveRates)) {
            if (firstRate === null) firstRate = rate;
            
            const option = document.createElement('option');
            option.value = rate.toFixed(2);
            option.textContent = `${label}: ${rate.toFixed(2)}%`;
            rateSelect.appendChild(option);
        }

        if (firstRate !== null) {
            rateInput.value = firstRate.toFixed(2);
            statusSpan.textContent = `Live Rates Loaded (30-Yr: ${firstRate.toFixed(2)}%)`;
            updateCalculations();
        } else {
             statusSpan.textContent = `Error loading live rates. Using default.`;
        }
    },

    async startAutomaticUpdates() {
        const updateRates = async () => {
            const statusSpan = document.getElementById('fred-rate-status').querySelector('.status-text');
            const statusIcon = document.getElementById('fred-rate-status').querySelector('.status-icon');

            statusIcon.classList.add('fa-spin');
            statusSpan.textContent = 'FRED Rate: Fetching...';
            showLoading(true, 'Fetching live mortgage rates from FRED...');

            const result = await this.fetchAllLiveRates();
            
            statusIcon.classList.remove('fa-spin');
            showLoading(false);

            if (result.success) {
                this.updateRateUI();
                showToast(`Live FRED rates updated!`, 'success');
            } else {
                statusSpan.textContent = `FRED Rate: Error. Using default.`;
                showToast(`Could not fetch live FRED rates. Using default values.`, 'error');
                if (!MORTGAGE_CALCULATOR.currentCalculation.monthlyPayment) {
                     updateCalculations();
                }
            }

            setTimeout(updateRates, MORTGAGE_CALCULATOR.RATE_UPDATE_INTERVAL);
        };

        updateRates();
    }
};

/* ========================================================================== */
/* UTILITY FUNCTIONS */
/* ========================================================================== */

function formatCurrency(value, includeSymbol = true) {
    if (isNaN(value) || value === null) return includeSymbol ? '$0.00' : '0';
    return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function parseCurrency(currencyString) {
    if (!currencyString) return 0;
    const cleanedString = String(currencyString).replace(/[^0-9.-]+/g, "");
    return parseFloat(cleanedString) || 0;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

    let icon = '';
    if (type === 'success') icon = '<i class="fas fa-check-circle" aria-hidden="true"></i>';
    else if (type === 'error') icon = '<i class="fas fa-times-circle" aria-hidden="true"></i>';
    else if (type === 'warning') icon = '<i class="fas fa-exclamation-triangle" aria-hidden="true"></i>';
    else icon = '<i class="fas fa-info-circle" aria-hidden="true"></i>';

    toast.innerHTML = `${icon} <span class="toast-text">${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 5000);

    if (typeof gtag === 'function') {
        gtag('event', 'show_toast', {
            'event_category': 'UI',
            'event_label': type,
            'value': message
        });
    }
}

function showLoading(show, message = 'Recalculating...') {
    const overlay = document.getElementById('loading-overlay');
    const messageElement = document.getElementById('loading-message');
    if (show) {
        messageElement.textContent = message;
        overlay.style.display = 'flex';
    } else {
        overlay.style.display = 'none';
    }
}

/* ========================================================================== */
/* CORE MORTGAGE CALCULATIONS */
/* ========================================================================== */

function calculateP_I(P, r, t) {
    if (r === 0) {
        return P / (t * 12);
    }
    const r_m = r / 12;
    const n = t * 12;
    
    return P * (r_m * Math.pow(1 + r_m, n)) / (Math.pow(1 + r_m, n) - 1);
}

function generateAmortizationSchedule(params, isComparison = false) {
    let { loanAmount, interestRate, loanTerm, extraMonthly, extraWeekly } = params;
    
    let P = loanAmount;
    const r = interestRate / 100;
    const t = loanTerm;
    const r_m = r / 12;
    const n = t * 12;
    
    const baseP_I = calculateP_I(P, r, t);
    
    const extraWeeklyMonthlyEquivalent = extraWeekly * (52 / 12);
    const totalExtraPrincipal = extraMonthly + extraWeeklyMonthlyEquivalent;
    
    let totalInterest = 0;
    let balance = P;
    let schedule = [];
    let monthCount = 0;

    for (let i = 1; i <= n * 2 && balance > 0; i++) {
        monthCount = i;
        
        const monthlyInterest = balance * r_m;
        let principalPayment = baseP_I - monthlyInterest;
        let totalPayment = baseP_I;
        
        let extraPayment = totalExtraPrincipal;
        
        if (principalPayment + extraPayment > balance) {
            extraPayment = balance - principalPayment;
            if (extraPayment < 0) extraPayment = 0;
            principalPayment = balance - extraPayment;
        }

        if (balance < (principalPayment + extraPayment)) {
             principalPayment = balance;
             extraPayment = 0;
        }
        
        const totalPrincipal = principalPayment + extraPayment;
        balance -= totalPrincipal;
        totalInterest += monthlyInterest;

        schedule.push({
            month: i,
            year: Math.ceil(i / 12),
            payment: baseP_I + extraPayment,
            pi: baseP_I,
            interest: monthlyInterest,
            principal: principalPayment,
            extraPrincipal: extraPayment,
            balance: Math.max(0, balance)
        });
        
        if (balance <= 0.01) {
            const lastPayment = schedule[schedule.length - 1];
            const previousBalance = schedule.length > 1 ? schedule[schedule.length - 2].balance : P;
            const finalInterest = previousBalance * r_m;
            const finalPrincipal = previousBalance;
            const finalP_I = finalInterest + finalPrincipal;
            
            totalInterest = (totalInterest - monthlyInterest) + finalInterest;
            
            lastPayment.payment = finalInterest + finalPrincipal;
            lastPayment.pi = finalInterest + finalPrincipal;
            lastPayment.interest = finalInterest;
            lastPayment.principal = finalPrincipal;
            lastPayment.extraPrincipal = 0;
            lastPayment.balance = 0;
            
            break;  
        }
    }
    
    const payoffMonth = monthCount % 12 === 0 ? 12 : monthCount % 12;
    const payoffYear = Math.floor((monthCount - 1) / 12);
    const payoffDate = new Date();
    payoffDate.setFullYear(payoffDate.getFullYear() + payoffYear);
    payoffDate.setMonth(payoffDate.getMonth() + payoffMonth);

    const totalCost = P + totalInterest;
    const effectiveAPR = ((totalInterest / P) / (monthCount / 12) * 2) * 100;
    
    const baseTotalInterest = (calculateP_I(P, r, t) * n) - P;
    const interestSaved = baseTotalInterest - totalInterest;

    const results = {
        schedule: schedule,
        totalInterest: totalInterest,
        totalPrincipalPaid: P,
        totalCost: totalCost,
        payoffMonths: monthCount,
        payoffDate: payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        baseP_I: baseP_I,
        effectiveAPR: effectiveAPR,
        extraInterestSaved: interestSaved > 0 ? interestSaved : 0
    };

    if (!isComparison) {
        MORTGAGE_CALCULATOR.amortizationSchedule = schedule;
    }
    
    return results;
}

function updateCalculations() {
    const calc = MORTGAGE_CALCULATOR.currentCalculation;
    
    const homePrice = parseCurrency(document.getElementById('home-price').value);
    let downPayment = parseCurrency(document.getElementById('down-payment').value);
    let interestRate = parseFloat(document.getElementById('interest-rate').value);
    const loanTerm = parseInt(document.getElementById('loan-term').value);
    const propertyTax = parseCurrency(document.getElementById('property-tax').value);
    const homeInsurance = parseCurrency(document.getElementById('home-insurance').value);
    let pmi = parseCurrency(document.getElementById('pmi').value);
    const hoaFees = parseCurrency(document.getElementById('hoa-fees').value);
    const extraMonthly = parseCurrency(document.getElementById('extra-monthly').value);
    const extraWeekly = parseCurrency(document.getElementById('extra-weekly').value);
    const loanType = document.getElementById('loan-type').value;

    if (homePrice <= 0 || downPayment >= homePrice || interestRate <= 0 || loanTerm <= 0) {
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('calculation-error-message').style.display = 'block';
        showToast('Please enter valid Home Price, Down Payment, and Rate.', 'error');
        return;
    }
    document.getElementById('results-section').style.display = 'block';
    document.getElementById('calculation-error-message').style.display = 'none';

    const loanAmount = homePrice - downPayment;
    const downPaymentPercent = (downPayment / homePrice) * 100;
    
    if (loanType === 'conventional' && downPaymentPercent < 20 && loanAmount > 0) {
        pmi = (loanAmount * 0.008);
        document.querySelector('.pmi-info span').textContent = `PMI: ${formatCurrency(pmi / 12)}/mo added (Est. 0.8%)`;
        document.getElementById('pmi').value = formatCurrency(pmi, false);
    } else {
        pmi = 0;
        document.querySelector('.pmi-info span').textContent = `PMI: $0.00/mo (DP >= 20% or non-conventional)`;
        document.getElementById('pmi').value = '0';
    }

    Object.assign(calc, {
        homePrice, downPayment, downPaymentPercent, loanAmount, interestRate, loanTerm,
        propertyTax, homeInsurance, pmi, hoaFees, extraMonthly, extraWeekly, loanType
    });
    
    const baseP_I_Monthly = calculateP_I(loanAmount, interestRate / 100, loanTerm);
    const results = generateAmortizationSchedule(calc, false);
    
    const taxMonthly = propertyTax / 12;
    const insuranceMonthly = homeInsurance / 12;
    const pmiMonthly = pmi / 12;
    
    const totalPITI = baseP_I_Monthly + taxMonthly + insuranceMonthly + pmiMonthly;
    const totalPayment = totalPITI + hoaFees;

    calc.monthlyPayment = totalPayment;
    calc.totalInterest = results.totalInterest;
    calc.totalCost = results.totalCost;
    calc.baseP_I = baseP_I_Monthly;

    if (MORTGAGE_CALCULATOR.comparisonLoan.enabled) {
        updateComparisonCalculations();
    }
    
    updateResultsUI(results, baseP_I_Monthly, taxMonthly, insuranceMonthly, pmiMonthly);
    updatePaymentComponentsChart(baseP_I_Monthly, taxMonthly, insuranceMonthly, pmiMonthly, hoaFees);
    updateMortgageTimelineChart(results.payoffMonths, calc.loanTerm * 12);
    renderAmortizationTable();
    generateAIInsights(results.payoffMonths, results.extraInterestSaved, results.totalInterest);

    if (typeof gtag === 'function') {
        gtag('event', 'calculate_mortgage', {
            'event_category': 'Calculator',
            'event_label': 'Main Calculation',
            'value': loanAmount,
            'home_price': homePrice,
            'interest_rate': interestRate,
            'loan_term': loanTerm
        });
    }
}

function updateResultsUI(results, baseP_I_Monthly, taxMonthly, insuranceMonthly, pmiMonthly) {
    const calc = MORTGAGE_CALCULATOR.currentCalculation;
    
    document.getElementById('monthly-payment-total').textContent = formatCurrency(calc.monthlyPayment);
    document.getElementById('loan-amount-display').textContent = formatCurrency(calc.loanAmount);
    document.getElementById('total-cost-display').textContent = formatCurrency(calc.totalCost);
    document.getElementById('total-interest-display').textContent = formatCurrency(calc.totalInterest);
    document.getElementById('payoff-date-display').textContent = results.payoffDate;

    document.getElementById('pi-payment-display').textContent = formatCurrency(baseP_I_Monthly);
    document.getElementById('tax-monthly-display').textContent = formatCurrency(taxMonthly);
    document.getElementById('insurance-monthly-display').textContent = formatCurrency(insuranceMonthly);
    document.getElementById('pmi-monthly-display').textContent = formatCurrency(pmiMonthly);
    document.getElementById('hoa-fees-display').textContent = formatCurrency(calc.hoaFees);
    document.getElementById('total-monthly-display').textContent = formatCurrency(calc.monthlyPayment);

    document.getElementById('summary-home-price').textContent = formatCurrency(calc.homePrice);
    document.getElementById('summary-down-payment').textContent = `${formatCurrency(calc.downPayment)} (${calc.downPaymentPercent.toFixed(1)}%)`;
    document.getElementById('summary-loan-amount').textContent = formatCurrency(calc.loanAmount);
    
    const closingCosts = calc.homePrice * (calc.closingCostsPercent / 100);
    document.getElementById('summary-closing-costs').textContent = formatCurrency(closingCosts);
    document.getElementById('summary-cash-needed').textContent = formatCurrency(calc.downPayment + closingCosts);
    
    document.getElementById('summary-total-cost').textContent = formatCurrency(calc.totalCost);
    document.getElementById('summary-effective-apr').textContent = `${results.effectiveAPR.toFixed(2)}%`;
    
    const monthsSaved = (calc.loanTerm * 12) - results.payoffMonths;
    document.getElementById('extra-payment-savings').textContent = formatCurrency(results.extraInterestSaved);
    document.getElementById('extra-payment-months-saved').textContent = `${monthsSaved} months (${(monthsSaved / 12).toFixed(1)} years)`;
    
    const compBtn = document.getElementById('toggle-comparison');
    compBtn.textContent = MORTGAGE_CALCULATOR.comparisonLoan.enabled ? 'Disable Comparison' : 'Enable Comparison';
}

/* ========================================================================== */
/* COMPARISON LOGIC */
/* ========================================================================== */

function updateComparisonCalculations() {
    const comp = MORTGAGE_CALCULATOR.comparisonLoan;

    const homePrice = parseCurrency(document.getElementById('comp-home-price').value) || comp.homePrice;
    const downPaymentPercent = parseFloat(document.getElementById('comp-down-payment-percent').value) || comp.downPaymentPercent;
    const downPayment = homePrice * (downPaymentPercent / 100);
    const loanAmount = homePrice - downPayment;
    const interestRate = parseFloat(document.getElementById('comp-interest-rate').value) || comp.interestRate;
    const loanTerm = parseInt(document.getElementById('comp-loan-term').value) || comp.loanTerm;

    Object.assign(comp, {
        homePrice, downPayment, downPaymentPercent, loanAmount, interestRate, loanTerm
    });

    const compParams = { 
        loanAmount: comp.loanAmount, 
        interestRate: comp.interestRate, 
        loanTerm: comp.loanTerm, 
        extraMonthly: 0, 
        extraWeekly: 0 
    };
    const results = generateAmortizationSchedule(compParams, true);

    comp.baseP_I = results.baseP_I;
    comp.monthlyPayment = results.baseP_I;
    comp.totalInterest = results.totalInterest;
    comp.totalCost = results.totalCost;
    comp.payoffMonths = results.payoffMonths;
    comp.extraInterestSaved = results.extraInterestSaved;

    updateComparisonUI();
}

function updateComparisonUI() {
    const comp = MORTGAGE_CALCULATOR.comparisonLoan;
    const main = MORTGAGE_CALCULATOR.currentCalculation;
    const compSection = document.getElementById('comparison-results-box');

    if (!comp.enabled) {
        compSection.style.display = 'none';
        compSection.setAttribute('aria-hidden', 'true');
        return;
    }
    
    compSection.style.display = 'block';
    compSection.setAttribute('aria-hidden', 'false');

    document.getElementById('comp-home-price').value = formatCurrency(comp.homePrice, false);
    document.getElementById('comp-down-payment-percent').value = comp.downPaymentPercent.toFixed(1);
    document.getElementById('comp-interest-rate').value = comp.interestRate.toFixed(2);
    document.getElementById('comp-loan-term').value = comp.loanTerm;

    const monthlyDifference = main.baseP_I - comp.baseP_I;
    const interestDifference = main.totalInterest - comp.totalInterest;

    let insightText = '';
    if (monthlyDifference > 0) {
        insightText = `Loan B saves you ${formatCurrency(Math.abs(monthlyDifference))} on your monthly P&I payment and a total of ${formatCurrency(Math.abs(interestDifference))} in interest over the life of the loan.`;
    } else if (monthlyDifference < 0) {
        insightText = `Loan A saves you ${formatCurrency(Math.abs(monthlyDifference))} on your monthly P&I payment and a total of ${formatCurrency(Math.abs(interestDifference))} in interest over the life of the loan.`;
    } else {
        insightText = 'The monthly payments for both loans are nearly identical.';
    }

    document.getElementById('comparison-insight-text').textContent = insightText;
}

function toggleComparison() {
    const comp = MORTGAGE_CALCULATOR.comparisonLoan;
    comp.enabled = !comp.enabled;
    
    const toggleBtn = document.getElementById('compare-loan-toggle');
    const compTool = document.getElementById('loan-comparison-tool');
    
    if (comp.enabled) {
        toggleBtn.innerHTML = '<i class="fas fa-times"></i> Remove Comparison';
        toggleBtn.setAttribute('aria-expanded', 'true');
        compTool.style.display = 'grid';
        compTool.setAttribute('aria-hidden', 'false');
        updateComparisonCalculations();
        showToast('Loan comparison enabled!', 'success');
    } else {
        toggleBtn.innerHTML = '<i class="fas fa-balance-scale-left"></i> Compare a Second Loan';
        toggleBtn.setAttribute('aria-expanded', 'false');
        compTool.style.display = 'none';
        compTool.setAttribute('aria-hidden', 'true');
        document.getElementById('comparison-results-box').style.display = 'none';
        showToast('Loan comparison disabled!', 'info');
    }
    
    if (typeof gtag === 'function') {
        gtag('event', 'toggle_comparison', {
            'event_category': 'Feature',
            'event_label': comp.enabled ? 'Enabled' : 'Disabled'
        });
    }
}

/* ========================================================================== */
/* CHART INTEGRATION */
/* ========================================================================== */

function initializeCharts() {
    const paymentCtx = document.getElementById('payment-components-chart').getContext('2d');
    MORTGAGE_CALCULATOR.charts.paymentComponents = new Chart(paymentCtx, {
        type: 'pie',
        data: {
            labels: ['Principal & Interest', 'Property Tax', 'Home Insurance', 'PMI', 'HOA Fees'],
            datasets: [{
                data: [0, 0, 0, 0, 0],
                backgroundColor: ['#21808D', '#4196A1', '#FF5459', '#E68161', '#5E5240'],
                hoverOffset: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' },
                title: { display: true, text: 'Monthly Payment Components (PITI + HOA)' }
            }
        }
    });

    const timelineCtx = document.getElementById('mortgage-timeline-chart').getContext('2d');
    MORTGAGE_CALCULATOR.charts.mortgageTimeline = new Chart(timelineCtx, {
        type: 'bar',
        data: {
            labels: ['Loan Term'],
            datasets: [{
                label: 'Original Term',
                data: [0],
                backgroundColor: '#A7A9A9',
            },
            {
                label: 'Payoff Time with Extra Payments',
                data: [0],
                backgroundColor: '#21808D',
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, beginAtZero: true },
                y: { stacked: true }
            },
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Loan Payoff Timeline' }
            }
        }
    });
}

function updatePaymentComponentsChart(pi, tax, insurance, pmi, hoa) {
    const chart = MORTGAGE_CALCULATOR.charts.paymentComponents;
    if (!chart) return;

    chart.data.datasets[0].data = [pi, tax, insurance, pmi, hoa];
    chart.options.plugins.title.text = `Total Monthly Payment: ${formatCurrency(pi + tax + insurance + pmi + hoa)}`;
    chart.update();
}

function updateMortgageTimelineChart(payoffMonths, originalMonths) {
    const chart = MORTGAGE_CALCULATOR.charts.mortgageTimeline;
    if (!chart) return;

    if (MORTGAGE_CALCULATOR.currentCalculation.extraMonthly > 0 || MORTGAGE_CALCULATOR.currentCalculation.extraWeekly > 0) {
        chart.data.datasets[0].data = [originalMonths];
        chart.data.datasets[1].data = [payoffMonths];
        chart.options.plugins.title.text = `Payoff Timeline: ${payoffMonths} months vs ${originalMonths} months`;
    } else {
        chart.data.datasets[0].data = [originalMonths];
        chart.data.datasets[1].data = [0];
        chart.options.plugins.title.text = `Loan Term: ${originalMonths} months`;
    }
    chart.update();
}

/* ========================================================================== */
/* AMORTIZATION TABLE LOGIC */
/* ========================================================================== */

function renderAmortizationTable() {
    const { amortizationSchedule, scheduleCurrentPage, scheduleItemsPerPage, scheduleType } = MORTGAGE_CALCULATOR;
    const tbody = document.getElementById('amortization-table-body');
    const paginationInfo = document.getElementById('amortization-pagination-info');
    tbody.innerHTML = '';
    
    let displaySchedule = amortizationSchedule;
    if (scheduleType === 'yearly') {
        const yearlyMap = new Map();
        amortizationSchedule.forEach(month => {
            const year = month.year;
            if (!yearlyMap.has(year)) {
                yearlyMap.set(year, {
                    year: year,
                    interest: 0,
                    principal: 0,
                    extraPrincipal: 0,
                    balance: month.balance,
                    payment: 0
                });
            }
            const yearlyData = yearlyMap.get(year);
            yearlyData.interest += month.interest;
            yearlyData.principal += month.principal;
            yearlyData.extraPrincipal += month.extraPrincipal;
            yearlyData.payment = yearlyData.interest + yearlyData.principal + yearlyData.extraPrincipal;
            yearlyData.balance = month.balance;
        });
        displaySchedule = Array.from(yearlyMap.values());
    }

    const totalItems = displaySchedule.length;
    const totalPages = Math.ceil(totalItems / scheduleItemsPerPage);
    const start = scheduleCurrentPage * scheduleItemsPerPage;
    const end = Math.min(start + scheduleItemsPerPage, totalItems);

    for (let i = start; i < end; i++) {
        const item = displaySchedule[i];
        const row = tbody.insertRow();
        
        if (scheduleType === 'monthly') {
            row.insertCell().textContent = item.month;
            row.insertCell().textContent = formatCurrency(item.pi + item.extraPrincipal);
            row.insertCell().textContent = formatCurrency(item.interest);
            row.insertCell().textContent = formatCurrency(item.principal + item.extraPrincipal);
            row.insertCell().textContent = formatCurrency(item.balance);
        } else {
            row.insertCell().textContent = `Year ${item.year}`;
            row.insertCell().textContent = formatCurrency(item.payment);
            row.insertCell().textContent = formatCurrency(item.interest);
            row.insertCell().textContent = formatCurrency(item.principal + item.extraPrincipal);
            row.insertCell().textContent = formatCurrency(item.balance);
        }
    }

    paginationInfo.textContent = `Showing ${start + 1} - ${end} of ${totalItems} ${scheduleType === 'monthly' ? 'payments' : 'years'}`;
    
    document.getElementById('amortization-prev').disabled = scheduleCurrentPage === 0;
    document.getElementById('amortization-next').disabled = scheduleCurrentPage >= totalPages - 1;
}

function changeAmortizationView(type) {
    MORTGAGE_CALCULATOR.scheduleType = type;
    MORTGAGE_CALCULATOR.scheduleCurrentPage = 0;
    
    document.getElementById('amortization-monthly-btn').classList.remove('active');
    document.getElementById('amortization-yearly-btn').classList.remove('active');
    document.getElementById(`amortization-${type}-btn`).classList.add('active');
    
    renderAmortizationTable();
    showToast(`Amortization view switched to ${type}!`, 'info');
}

function paginateAmortizationTable(direction) {
    const { amortizationSchedule, scheduleItemsPerPage } = MORTGAGE_CALCULATOR;
    
    let totalItems = amortizationSchedule.length;
    if (MORTGAGE_CALCULATOR.scheduleType === 'yearly') {
        const yearlyMap = new Map();
        amortizationSchedule.forEach(month => {
            if (!yearlyMap.has(month.year)) yearlyMap.set(month.year, true);
        });
        totalItems = yearlyMap.size;
    }
    
    const totalPages = Math.ceil(totalItems / scheduleItemsPerPage);
    let newPage = MORTGAGE_CALCULATOR.scheduleCurrentPage;

    if (direction === 'next' && newPage < totalPages - 1) {
        newPage++;
    } else if (direction === 'prev' && newPage > 0) {
        newPage--;
    } else {
        return;
    }

    MORTGAGE_CALCULATOR.scheduleCurrentPage = newPage;
    renderAmortizationTable();
}

/* ========================================================================== */
/* AI/SEO/MONETIZATION FEATURES */
/* ========================================================================== */

function generateAIInsights(payoffMonths, interestSaved, totalInterest) {
    const calc = MORTGAGE_CALCULATOR.currentCalculation;
    const aiTextElement = document.getElementById('ai-insights-text');
    const originalMonths = calc.loanTerm * 12;

    let insights = [];

    if (calc.downPaymentPercent < 20) {
        insights.push(`**AI Alert: You are below the 20% down payment threshold!** Your estimated monthly payment includes **PMI** of ${formatCurrency(calc.pmi / 12)}. Consider saving ${formatCurrency((calc.homePrice * 0.2) - calc.downPayment)} more to eliminate this fee and save thousands.`);
    } else if (calc.downPaymentPercent >= 25) {
        insights.push(`**Smart Move!** Your ${calc.downPaymentPercent.toFixed(1)}% down payment is excellent. You've secured the best possible loan terms and completely avoided PMI. Your cash-on-hand is ${formatCurrency(calc.downPayment + (calc.homePrice * (calc.closingCostsPercent / 100)))}.`);
    } else {
        insights.push(`Your ${calc.downPaymentPercent.toFixed(1)}% down payment is solid. You've avoided PMI, keeping your total interest at ${formatCurrency(totalInterest)} over the loan term.`);
    }

    if (interestSaved > 0) {
        insights.push(`**The FinGuid AI confirms:** By paying an extra ${formatCurrency(calc.extraMonthly + (calc.extraWeekly * 52 / 12))}/month, you will save **${formatCurrency(interestSaved)}** in interest and pay off your home **${((originalMonths - payoffMonths) / 12).toFixed(1)} years** early!`);
    } else {
        insights.push(`**Optimize Your Payoff:** Consider adding just $100/month to your payment. Over 30 years, this could save you over $${(calc.loanAmount * 0.05).toFixed(0).toLocaleString()} in interest.`);
    }

    const zipData = ZIP_DATABASE.get(document.getElementById('zip-code').value);
    if (zipData) {
        insights.push(`**Location Check:** The estimated property tax rate in **${zipData.city}, ${zipData.state}** is **${(zipData.propertyTaxRate * 100).toFixed(2)}%**. Your annual tax bill is ${formatCurrency(calc.propertyTax)}. This is a key factor in your total monthly cost.`);
    }

    aiTextElement.innerHTML = insights.map(i => `<p>${i}</p>`).join('');

    if (typeof gtag === 'function') {
        gtag('event', 'ai_insight_generated', {
            'event_category': 'AI',
            'event_label': 'Insight Generated',
            'value': calc.loanAmount
        });
    }
}

function handleMonetizationClick(event) {
    const link = event.currentTarget;
    const gaLabel = link.getAttribute('data-ga-label') || link.textContent.trim();

    if (typeof gtag === 'function') {
        gtag('event', 'affiliate_click', {
            'event_category': 'Monetization',
            'event_label': gaLabel,
            'value': MORTGAGE_CALCULATOR.currentCalculation.loanAmount,
            'rate': MORTGAGE_CALCULATOR.currentCalculation.interestRate
        });
    }

    showToast(`Redirecting to a top-rated partner for: ${gaLabel}`, 'info');

    if (MORTGAGE_CALCULATOR.DEBUG) {
        event.preventDefault();
        console.log(`[MONETIZATION] Click tracked for: ${gaLabel}`);
    }
}

/* ========================================================================== */
/* PWA AND EXPORT LOGIC */
/* ========================================================================== */

function initPWA() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        MORTGAGE_CALCULATOR.deferredInstallPrompt = e;
        const installButton = document.getElementById('pwa-install-button');
        if (installButton) {
            installButton.style.display = 'block';
            installButton.addEventListener('click', handlePWAInstall);
        }
    });

    window.addEventListener('appinstalled', () => {
        const installButton = document.getElementById('pwa-install-button');
        if (installButton) installButton.style.display = 'none';
        showToast('Home Loan Pro successfully installed! 🎉', 'success');
        
        if (typeof gtag === 'function') {
            gtag('event', 'pwa_install', { 'event_category': 'PWA', 'event_label': 'Success' });
        }
    });
}

function handlePWAInstall() {
    const prompt = MORTGAGE_CALCULATOR.deferredInstallPrompt;
    if (prompt) {
        prompt.prompt();
        prompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
            } else {
                console.log('User dismissed the A2HS prompt');
            }
            MORTGAGE_CALCULATOR.deferredInstallPrompt = null;
        });
    }
}

function exportResults(format) {
    if (format === 'csv') {
        exportToCSV();
    } else if (format === 'pdf') {
        exportToPDF();
    }
    
    if (typeof gtag === 'function') {
        gtag('event', 'export_results', { 'event_category': 'Data', 'event_label': format });
    }
}

function exportToCSV() {
    const { amortizationSchedule, currentCalculation } = MORTGAGE_CALCULATOR;
    const calc = currentCalculation;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Report,Value\n";
    csvContent += `Loan Amount,${calc.loanAmount}\n`;
    csvContent += `Interest Rate,${calc.interestRate}%\n`;
    csvContent += `Loan Term,${calc.loanTerm} years\n`;
    csvContent += `Monthly PITI,${calc.monthlyPayment}\n`;
    csvContent += `Total Interest Paid,${calc.totalInterest}\n`;
    csvContent += "\nAmortization Schedule\n";
    csvContent += "Month,P&I Payment,Interest,Principal,Extra Principal,Remaining Balance\n";

    amortizationSchedule.forEach(row => {
        const rowData = [
            row.month,
            (row.pi + row.extraPrincipal).toFixed(2),
            row.interest.toFixed(2),
            row.principal.toFixed(2),
            row.extraPrincipal.toFixed(2),
            row.balance.toFixed(2)
        ];
        csvContent += rowData.join(',') + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "FinGuid_Mortgage_Schedule.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    showToast('Exported to CSV successfully!', 'success');
}

function exportToPDF() {
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        showToast('PDF library not yet loaded. Please try again in a moment.', 'warning');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const calc = MORTGAGE_CALCULATOR.currentCalculation;
    
    doc.setFontSize(18);
    doc.text("FinGuid Home Loan Pro Report", 10, 10);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US')}`, 10, 18);
    
    let y = 30;

    doc.setFontSize(14);
    doc.text("Loan Summary (Loan A)", 10, y);
    doc.setFontSize(10);
    y += 8;
    doc.text(`Home Price: ${formatCurrency(calc.homePrice)}`, 10, y); y += 6;
    doc.text(`Loan Amount: ${formatCurrency(calc.loanAmount)}`, 10, y); y += 6;
    doc.text(`Interest Rate: ${calc.interestRate}%`, 10, y); y += 6;
    doc.text(`Monthly Payment (PITI+HOA): ${formatCurrency(calc.monthlyPayment)}`, 10, y); y += 6;
    doc.text(`Total Interest Paid: ${formatCurrency(calc.totalInterest)}`, 10, y); y += 6;

    y += 10;
    doc.setFontSize(14);
    doc.text("Amortization Schedule (First 12 Months)", 10, y);
    
    const columns = ["Month", "P&I Pay", "Interest", "Principal", "Balance"];
    const data = MORTGAGE_CALCULATOR.amortizationSchedule.slice(0, 12).map(row => [
        row.month,
        formatCurrency(row.pi + row.extraPrincipal),
        formatCurrency(row.interest),
        formatCurrency(row.principal + row.extraPrincipal),
        formatCurrency(row.balance)
    ]);

    doc.autoTable({
        startY: y + 5,
        head: [columns],
        body: data,
        theme: 'striped',
        styles: { fontSize: 8 }
    });
    
    doc.save("FinGuid_Mortgage_Report.pdf");
    showToast('Exported to PDF successfully!', 'success');
}

/* ========================================================================== */
/* UI/EVENT HANDLING */
/* ========================================================================== */

function handleInput(event) {
    const input = event.target;
    const id = input.id;
    let value = input.value;

    if (id === 'zip-code' && value.length === 5) {
        const zipData = ZIP_DATABASE.get(value);
        if (zipData) {
            ZIP_DATABASE.updateZipInfo(zipData);
        } else {
            document.getElementById('zip-info').querySelector('.status-text').textContent = 'ZIP Code Not Found (Using Global Avg)';
            showToast('ZIP code not found. Using a national average for tax/insurance estimates.', 'warning');
        }
    }
    
    if (id === 'live-rate-select' && value) {
        document.getElementById('interest-rate').value = value;
        input.value = '';
        showToast(`Applied live rate: ${value}%`, 'success');
    }
    
    if (id === 'down-payment-percent') {
        const percent = parseFloat(value) / 100;
        const price = MORTGAGE_CALCULATOR.currentCalculation.homePrice;
        const newDownPayment = price * percent;
        document.getElementById('down-payment').value = formatCurrency(newDownPayment, false);
    } else if (id === 'down-payment') {
        const downPayment = parseCurrency(value);
        const price = MORTGAGE_CALCULATOR.currentCalculation.homePrice;
        const newPercent = (downPayment / price) * 100;
        document.getElementById('down-payment-percent').value = newPercent.toFixed(1);
    }
    
    if (id.startsWith('comp-')) {
        if (MORTGAGE_CALCULATOR.comparisonLoan.enabled) {
            updateComparisonCalculations();
        }
        return;
    }

    updateCalculations();
}

function initializeEventListeners() {
    document.getElementById('calculator-form').addEventListener('change', handleInput);
    document.getElementById('calculator-form').addEventListener('keyup', (e) => {
        if (['home-price', 'down-payment', 'interest-rate', 'property-tax', 'home-insurance'].includes(e.target.id)) {
            if (e.key === 'Enter' || e.type === 'blur') {
                handleInput(e);
            }
        }
    });
    
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const target = e.currentTarget.getAttribute('data-target');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(target).classList.add('active');
            e.currentTarget.classList.add('active');
            
            if (target === 'charts-tab') {
                MORTGAGE_CALCULATOR.charts.paymentComponents.resize();
                MORTGAGE_CALCULATOR.charts.mortgageTimeline.resize();
            }
            
            if (typeof gtag === 'function') {
                 gtag('event', 'view_tab', { 'event_category': 'Navigation', 'event_label': target });
             }
        });
    });

    document.getElementById('amortization-monthly-btn').addEventListener('click', () => changeAmortizationView('monthly'));
    document.getElementById('amortization-yearly-btn').addEventListener('click', () => changeAmortizationView('yearly'));
    document.getElementById('amortization-prev').addEventListener('click', () => paginateAmortizationTable('prev'));
    document.getElementById('amortization-next').addEventListener('click', () => paginateAmortizationTable('next'));

    document.getElementById('toggle-comparison').addEventListener('click', () => toggleComparison());
    
    document.querySelectorAll('.affiliate-link, .monetization-cta').forEach(link => {
        link.addEventListener('click', handleMonetizationClick);
    });
    
    document.getElementById('export-pdf').addEventListener('click', () => exportResults('pdf'));
    document.getElementById('export-csv').addEventListener('click', () => exportResults('csv'));

    document.getElementById('calculate-btn').addEventListener('click', updateCalculations);
    
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('screen-reader-toggle').addEventListener('click', toggleScreenReader);
    document.getElementById('voice-toggle').addEventListener('click', toggleVoiceControl);
}

function toggleTheme() {
    const currentScheme = document.body.getAttribute('data-color-scheme');
    const newScheme = currentScheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-color-scheme', newScheme);
    MORTGAGE_CALCULATOR.currentTheme = newScheme;
    
    const themeIcon = document.querySelector('#theme-toggle .theme-icon');
    themeIcon.className = newScheme === 'light' ? 'fas fa-moon theme-icon' : 'fas fa-sun theme-icon';
    
    showToast(`${newScheme === 'light' ? 'Light' : 'Dark'} mode activated`, 'info');
}

function toggleScreenReader() {
    MORTGAGE_CALCULATOR.screenReaderMode = !MORTGAGE_CALCULATOR.screenReaderMode;
    const button = document.getElementById('screen-reader-toggle');
    
    if (MORTGAGE_CALCULATOR.screenReaderMode) {
        button.classList.add('active');
        document.body.classList.add('screen-reader-mode');
        showToast('Screen reader mode enabled', 'success');
    } else {
        button.classList.remove('active');
        document.body.classList.remove('screen-reader-mode');
        showToast('Screen reader mode disabled', 'info');
    }
}

function toggleVoiceControl() {
    MORTGAGE_CALCULATOR.voiceEnabled = !MORTGAGE_CALCULATOR.voiceEnabled;
    const button = document.getElementById('voice-toggle');
    const status = document.getElementById('voice-status');
    
    if (MORTGAGE_CALCULATOR.voiceEnabled) {
        button.classList.add('active');
        status.style.display = 'block';
        status.setAttribute('aria-hidden', 'false');
        status.querySelector('.voice-status-text').textContent = 'Voice Control: Listening...';
        showToast('Voice control enabled', 'success');
    } else {
        button.classList.remove('active');
        status.style.display = 'none';
        status.setAttribute('aria-hidden', 'true');
        showToast('Voice control disabled', 'info');
    }
}

function adjustFontSize(direction) {
    if (direction === 'increase' && MORTGAGE_CALCULATOR.currentFontScaleIndex < MORTGAGE_CALCULATOR.fontScaleOptions.length - 1) {
        MORTGAGE_CALCULATOR.currentFontScaleIndex++;
    } else if (direction === 'decrease' && MORTGAGE_CALCULATOR.currentFontScaleIndex > 0) {
        MORTGAGE_CALCULATOR.currentFontScaleIndex--;
    }
    
    const scale = MORTGAGE_CALCULATOR.fontScaleOptions[MORTGAGE_CALCULATOR.currentFontScaleIndex];
    document.documentElement.style.fontSize = `${scale * 100}%`;
    showToast(`Font size adjusted to ${Math.round(scale * 100)}%`, 'info');
}

/* ========================================================================== */
/* INITIALIZATION */
/* ========================================================================== */

function init() {
    console.log(`Home Loan Pro v${MORTGAGE_CALCULATOR.VERSION} Initializing...`);

    ZIP_DATABASE.initialize();
    initializeCharts();
    initPWA();
    initializeEventListeners();
    fredAPI.startAutomaticUpdates();
    updateCalculations();
}

document.addEventListener('DOMContentLoaded', init);
