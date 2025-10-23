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
    
    // FRED API Configuration (Your existing API key)
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    // Relevant series IDs for Americans
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
    
    // Current calculation state (Default values)
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
    deferredInstallPrompt: null, // For PWA
    
    // Store for live rates
    liveRates: {},
    lastRateUpdate: 0
};

/* ========================================================================== */
/* UTILITY FUNCTIONS */
/* ========================================================================== */

/**
 * Formats a number as USD currency without the symbol, for inputs.
 * @param {number} number 
 * @param {boolean} includeCents 
 * @returns {string}
 */
const formatCurrency = (number, includeCents = true) => {
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD', 
        minimumFractionDigits: includeCents ? 2 : 0,
        maximumFractionDigits: includeCents ? 2 : 0
    }).format(number).replace('$', '');
};

/**
 * Formats a number as USD currency with the symbol, for display.
 * @param {number} number 
 * @returns {string}
 */
const formatDisplayCurrency = (number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(number);
};

/**
 * Gets the numerical value from an input element by ID.
 * @param {string} id 
 * @returns {number}
 */
const getNumericalValue = (id) => {
    const element = document.getElementById(id);
    if (!element) return 0;
    // Remove commas and parse as a float
    return parseFloat(element.value.replace(/,/g, '').replace(/[^\d.-]/g, '') || '0');
};

/**
 * Creates and displays a toast notification.
 * @param {string} message 
 * @param {string} type 'success', 'error', 'warning', 'info'
 */
const showToast = (message, type = 'info') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-times-circle';
    if (type === 'warning') iconClass = 'fa-exclamation-triangle';

    toast.innerHTML = `<i class="fas ${iconClass}" aria-hidden="true"></i> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 5000);
};

/* ========================================================================== */
/* CALCULATION LOGIC */
/* ========================================================================== */

/**
 * Calculates the monthly P&I payment.
 * @returns {number} The monthly Principal and Interest payment.
 */
const calculatePI = (loanAmount, annualRate, termYears) => {
    const monthlyRate = annualRate / 12 / 100;
    const totalPayments = termYears * 12;

    if (monthlyRate === 0 || totalPayments === 0) {
        return loanAmount / totalPayments; // Simple division for 0% or edge cases
    }

    // Standard mortgage payment formula
    return loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
};

/**
 * Main PITI calculation function.
 * @param {object} params - Calculation parameters from state.
 * @returns {object} - Results including PITI components and total monthly payment.
 */
const calculatePITI = (params) => {
    const loanAmount = params.loanAmount;
    const termYears = params.loanTerm;
    const annualTax = params.propertyTax;
    const annualInsurance = params.homeInsurance;
    const annualPMI = params.pmi;
    const monthlyHOA = params.hoaFees;
    
    // 1. Principal & Interest (P&I)
    const principalInterest = calculatePI(loanAmount, params.interestRate, termYears);
    
    // 2. Taxes, Insurance, PMI
    const monthlyTax = annualTax / 12;
    const monthlyInsurance = annualInsurance / 12;
    const monthlyPMI = annualPMI / 12;
    
    // 3. Total Monthly Payment (P+I+T+I+HOA)
    const totalMonthlyPayment = principalInterest + monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA;

    return {
        principalInterest,
        monthlyTax,
        monthlyInsurance,
        monthlyPMI,
        monthlyHOA,
        totalMonthlyPayment
    };
};

/**
 * Estimates annual PMI based on loan type and LTV.
 * @param {number} loanAmount 
 * @param {number} downPaymentPercent 
 * @param {string} loanType 
 * @returns {number} Estimated annual PMI.
 */
const estimatePMI = (loanAmount, downPaymentPercent, loanType) => {
    // PMI is typically required if loanType is 'conventional' AND DP < 20%
    if (loanType === 'conventional' && downPaymentPercent < 20 && loanAmount > 0) {
        // Estimate PMI as 0.75% of the loan amount annually (0.5% to 1.5% range)
        const annualPMIRate = 0.0075; 
        return loanAmount * annualPMIRate;
    }
    // FHA/VA/USDA have their own specific insurance/funding fees handled elsewhere or via manual input
    return 0;
};

/**
 * Generates the full amortization schedule.
 * @param {object} params - Calculation parameters.
 * @returns {object} {schedule: [], totalInterestPaid: number, payoffMonths: number}
 */
const generateAmortizationSchedule = (params) => {
    let balance = params.loanAmount;
    let totalInterestPaid = 0;
    let paymentCount = 0;
    const schedule = [];
    
    const P_I = calculatePI(params.loanAmount, params.interestRate, params.loanTerm);
    const monthlyRate = params.interestRate / 12 / 100;
    const totalPayments = params.loanTerm * 12;
    const monthlyExtra = params.extraMonthly + (params.extraWeekly * 52 / 12);
    const startDate = new Date(); // Current date for schedule start
    
    for (let i = 1; i <= totalPayments; i++) {
        const interestForMonth = balance * monthlyRate;
        let principalPaid = P_I - interestForMonth;
        let totalPrincipal = principalPaid + monthlyExtra;
        
        if (balance <= 0) break;
        
        // Final payment check
        if (balance < totalPrincipal) {
            totalPrincipal = balance;
            principalPaid = totalPrincipal - monthlyExtra;
            if (principalPaid < 0) { // If extra payment covers remaining balance
                principalPaid = totalPrincipal;
            }
        }
        
        balance -= totalPrincipal;
        totalInterestPaid += interestForMonth;
        paymentCount = i;

        // Calculate month/year for the schedule entry
        const paymentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        
        schedule.push({
            month: i,
            date: `${paymentDate.toLocaleString('default', { month: 'short' })} ${paymentDate.getFullYear()}`,
            piPayment: P_I,
            principal: principalPaid,
            interest: interestForMonth,
            extra: monthlyExtra,
            balance: Math.max(0, balance)
        });
        
        if (balance <= 0) break;
    }
    
    return { schedule, totalInterestPaid, payoffMonths: paymentCount };
};


/**
 * Core function to read inputs, update state, calculate, and refresh UI.
 * @param {boolean} isComparison - True if calculating loan B, false for main loan A.
 */
const updateCalculations = (isComparison = false) => {
    const state = isComparison ? MORTGAGE_CALCULATOR.comparisonLoan : MORTGAGE_CALCULATOR.currentCalculation;
    
    // 1. Read Inputs
    const homePrice = getNumericalValue(isComparison ? 'b-home-price' : 'home-price');
    const downPaymentPercent = getNumericalValue(isComparison ? 'b-down-payment-percent' : 'down-payment-percent');
    const loanTerm = getNumericalValue(isComparison ? 'b-loan-term' : 'loan-term');
    
    const downPayment = isComparison 
        ? homePrice * (downPaymentPercent / 100) 
        : getNumericalValue('down-payment');

    // Update main state object
    state.homePrice = homePrice;
    state.downPayment = downPayment;
    state.downPaymentPercent = downPaymentPercent;
    state.loanAmount = homePrice - downPayment;
    state.interestRate = getNumericalValue(isComparison ? 'b-interest-rate' : 'interest-rate');
    state.loanTerm = loanTerm;
    state.loanType = isComparison ? 'conventional' : document.getElementById('loan-type').value;

    if (!isComparison) {
        state.propertyTax = getNumericalValue('property-tax');
        state.homeInsurance = getNumericalValue('home-insurance');
        state.hoaFees = getNumericalValue('hoa-fees');
        state.extraMonthly = getNumericalValue('extra-monthly');
        state.extraWeekly = getNumericalValue('extra-weekly');
        
        // Auto-update/estimate PMI
        const estimatedAnnualPMI = estimatePMI(state.loanAmount, downPaymentPercent, state.loanType);
        state.pmi = getNumericalValue('pmi') > 0 ? getNumericalValue('pmi') : estimatedAnnualPMI;
        document.getElementById('pmi').value = formatCurrency(state.pmi, false);
    } else {
        // For comparison, simplify T, I, PMI to 0 for a pure P&I comparison
        state.propertyTax = 0;
        state.homeInsurance = 0;
        state.pmi = 0;
        state.hoaFees = 0;
        state.extraMonthly = 0;
        state.extraWeekly = 0;
    }

    if (state.loanAmount <= 0) {
        displayErrorResults(isComparison);
        return;
    }

    // 2. Perform Calculations & Amortization
    const results = calculatePITI(state);
    const { schedule, totalInterestPaid, payoffMonths } = generateAmortizationSchedule(state);

    state.monthlyPayment = results.totalMonthlyPayment;
    state.totalInterest = totalInterestPaid;
    state.totalCost = state.loanAmount + totalInterestPaid + state.downPayment + (results.monthlyTax * 12 * state.loanTerm) + (results.monthlyInsurance * 12 * state.loanTerm);
    
    if (!isComparison) {
        MORTGAGE_CALCULATOR.amortizationSchedule = schedule;
        displayMainResults(results, totalInterestPaid, payoffMonths, state);
        
        // Track the successful calculation event for analytics
        if (typeof gtag === 'function') {
            gtag('event', 'calculate_success', {
                'event_category': 'Mortgage Calculator',
                'event_label': `${state.loanTerm}yr @ ${state.interestRate}%`,
                'value': state.monthlyPayment.toFixed(0)
            });
        }
        
        // If comparison is enabled, recalculate and update that too
        if (MORTGAGE_CALCULATOR.comparisonLoan.enabled) {
            updateCalculations(true);
        }

        // Always re-render chart/schedule after main calculation
        renderPaymentBreakdownChart(results);
        renderMortgageTimelineChart(schedule, state.loanAmount);
        renderAmortizationTable();

    } else {
        // Store only the key metrics for comparison display
        MORTGAGE_CALCULATOR.comparisonLoan.baseP_I = results.principalInterest;
        MORTGAGE_CALCULATOR.comparisonLoan.payoffMonths = payoffMonths;
        MORTGAGE_CALCULATOR.comparisonLoan.totalInterest = totalInterestPaid;
        displayComparisonResults(MORTGAGE_CALCULATOR.currentCalculation, MORTGAGE_CALCULATOR.comparisonLoan);
    }
};

/* ========================================================================== */
/* UI RENDERING & UPDATES */
/* ========================================================================== */

/**
 * Updates the main results section in the UI.
 */
const displayMainResults = (results, totalInterest, payoffMonths, state) => {
    // Show results section
    document.querySelector('.results-section').style.opacity = 1;
    document.querySelector('.results-section').style.pointerEvents = 'auto';

    const PITI = results.totalMonthlyPayment - results.monthlyHOA;
    
    // Overview Tab
    document.getElementById('monthly-payment-total').textContent = formatDisplayCurrency(PITI);
    document.getElementById('loan-amount-display').textContent = formatDisplayCurrency(state.loanAmount);
    document.getElementById('total-interest-display').textContent = formatDisplayCurrency(totalInterest);
    document.getElementById('total-cost-display').textContent = formatDisplayCurrency(state.totalCost);

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + payoffMonths);
    document.getElementById('payoff-date-display').textContent = `${payoffDate.toLocaleString('default', { month: 'short' })} ${payoffDate.getFullYear()}`;

    // Breakdown Tab
    document.getElementById('pi-payment-display').textContent = formatDisplayCurrency(results.principalInterest);
    document.getElementById('tax-monthly-display').textContent = formatDisplayCurrency(results.monthlyTax);
    document.getElementById('insurance-monthly-display').textContent = formatDisplayCurrency(results.monthlyInsurance);
    document.getElementById('pmi-monthly-display').textContent = formatDisplayCurrency(results.monthlyPMI);
    document.getElementById('hoa-fees-display').textContent = formatDisplayCurrency(results.monthlyHOA);
    document.getElementById('total-monthly-display').textContent = formatDisplayCurrency(results.totalMonthlyPayment);
    
    // AI Insights (Simulated AI Logic)
    let insights = `Based on your inputs, your **Estimated Monthly Housing Expense (PITI) is ${formatDisplayCurrency(PITI)}**.`;
    if (state.extraMonthly > 0 || state.extraWeekly > 0) {
        insights += ` Your extra payments save you **${formatDisplayCurrency(state.loanAmount * 12 * state.loanTerm - totalInterest)}** in total interest and shorten your loan term by **${state.loanTerm * 12 - payoffMonths} months**.`;
    } else if (state.interestRate > 6.5) {
        insights += ` This is a **high interest burden** for your loan size. The total interest of **${formatDisplayCurrency(totalInterest)}** is significant. Consider increasing your down payment to reduce risk or exploring a 15-year term for substantial interest savings.`;
    } else if (state.downPaymentPercent < 20 && state.loanType === 'conventional') {
         insights += ` **ACTION REQUIRED**: Your down payment is less than 20%, which means you are paying **PMI**. This adds **${formatDisplayCurrency(results.monthlyPMI)}** to your monthly cost. Prioritize paying down the principal to eliminate PMI quickly.`;
    } else {
        insights += ` Your projected total interest is **${formatDisplayCurrency(totalInterest)}** over the loan term. This is a sound financial decision. Consult a licensed lender via the sponsor links below for the next steps.`;
    }
    document.getElementById('ai-insights-text').innerHTML = insights;
    
    showToast('Calculation successful! Results updated.', 'success');
};

/**
 * Updates the comparison results section.
 */
const displayComparisonResults = (loanA, loanB) => {
    const comparisonBox = document.getElementById('comparison-results-box');
    const comparisonText = document.getElementById('comparison-results-text');
    const monthlyA = loanA.monthlyPayment - loanA.monthlyTax - loanA.monthlyInsurance - loanA.monthlyPMI - loanA.hoaFees;
    
    comparisonBox.style.display = 'block';
    
    let comparisonHtml = `
        **Loan B (${loanB.loanTerm}-yr @ ${loanB.interestRate}%):** <br>
        Monthly P&I: **${formatDisplayCurrency(loanB.baseP_I)}** vs. Loan A's **${formatDisplayCurrency(monthlyA)}**. 
        <br>
        Total Interest: **${formatDisplayCurrency(loanB.totalInterest)}** vs. Loan A's **${formatDisplayCurrency(loanA.totalInterest)}**.
    `;

    if (loanB.totalInterest < loanA.totalInterest) {
        const savings = loanA.totalInterest - loanB.totalInterest;
        comparisonHtml += `<br> Loan B saves you **${formatDisplayCurrency(savings)}** in interest, but may increase your monthly P&I payment.`;
    } else {
         comparisonHtml += `<br> Loan A is the lower-cost option overall, assuming all other factors remain equal.`;
    }

    comparisonText.innerHTML = comparisonHtml;
    
    // Update the visual comparison text on the overview tab
    document.getElementById('monthly-payment-comparison').textContent = 
        `Loan B P&I: ${formatDisplayCurrency(loanB.baseP_I)}`;
};

/**
 * Handles error display when loan amount is zero or less.
 */
const displayErrorResults = (isComparison) => {
    if (!isComparison) {
        document.getElementById('monthly-payment-total').textContent = '$0.00';
        document.getElementById('ai-insights-text').innerHTML = '<i class="fas fa-exclamation-circle"></i> **ERROR:** Home Price must be greater than Down Payment to calculate a loan.';
        document.querySelector('.results-section').style.opacity = 0.5;
        document.querySelector('.results-section').style.pointerEvents = 'none';
        showToast('Input Error: Check your home price and down payment.', 'error');
    }
}

/* ========================================================================== */
/* CHART & SCHEDULE RENDERING */
/* ========================================================================== */

/**
 * Initializes the Chart.js instances.
 */
const initializeCharts = () => {
    // Doughnut chart for PITI Breakdown
    const ctxBreakdown = document.getElementById('payment-components-chart').getContext('2d');
    MORTGAGE_CALCULATOR.charts.paymentComponents = new Chart(ctxBreakdown, {
        type: 'doughnut',
        data: {
            labels: ['Principal & Interest', 'Property Tax', 'Home Insurance', 'PMI', 'HOA'],
            datasets: [{
                data: [1, 1, 1, 1, 1], // Placeholder data
                backgroundColor: ['#1E40AF', '#059669', '#F59E0B', '#EF4444', '#7C3AED'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' }, tooltip: { callbacks: { label: (context) => formatDisplayCurrency(context.parsed) } } }
        }
    });

    // Line chart for Amortization Timeline
    const ctxTimeline = document.getElementById('mortgage-timeline-chart').getContext('2d');
    MORTGAGE_CALCULATOR.charts.mortgageTimeline = new Chart(ctxTimeline, {
        type: 'line',
        data: {
            labels: [], // Months/Years
            datasets: [
                { label: 'Loan Balance', data: [], borderColor: '#1E40AF', tension: 0.1, fill: false, yAxisID: 'y' },
                { label: 'Total Interest Paid', data: [], borderColor: '#EF4444', tension: 0.1, fill: false, yAxisID: 'y' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { callback: (value) => formatDisplayCurrency(value) } }
            },
            plugins: { tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatDisplayCurrency(context.parsed.y)}` } } }
        }
    });
};

/**
 * Renders the PITI breakdown doughnut chart.
 */
const renderPaymentBreakdownChart = (results) => {
    if (!MORTGAGE_CALCULATOR.charts.paymentComponents) return;

    MORTGAGE_CALCULATOR.charts.paymentComponents.data.datasets[0].data = [
        results.principalInterest,
        results.monthlyTax,
        results.monthlyInsurance,
        results.monthlyPMI,
        results.monthlyHOA
    ];
    MORTGAGE_CALCULATOR.charts.paymentComponents.update();
};

/**
 * Renders the amortization timeline chart.
 */
const renderMortgageTimelineChart = (schedule, initialBalance) => {
    if (!MORTGAGE_CALCULATOR.charts.mortgageTimeline || schedule.length === 0) return;

    // Filter to yearly milestones for cleaner chart display
    const yearlyData = schedule.filter(item => item.month % 12 === 0 || item.month === schedule.length);
    
    let runningInterest = 0;
    const labels = yearlyData.map(item => `Yr ${Math.ceil(item.month / 12)}`);
    const balanceData = yearlyData.map(item => item.balance);
    
    // Recalculate interest paid up to each year
    const totalInterestData = yearlyData.map(item => {
        const cumulativeInterest = schedule.slice(0, item.month).reduce((sum, entry) => sum + entry.interest, 0);
        return cumulativeInterest;
    });

    MORTGAGE_CALCULATOR.charts.mortgageTimeline.data.labels = labels;
    MORTGAGE_CALCULATOR.charts.mortgageTimeline.data.datasets[0].data = balanceData.slice(0, -1);
    MORTGAGE_CALCULATOR.charts.mortgageTimeline.data.datasets[1].data = totalInterestData.slice(0, -1);
    MORTGAGE_CALCULATOR.charts.mortgageTimeline.update();
};

/**
 * Renders the amortization table based on current state.
 */
const renderAmortizationTable = () => {
    const tableBody = document.querySelector('#amortization-table tbody');
    tableBody.innerHTML = '';
    const schedule = MORTGAGE_CALCULATOR.amortizationSchedule;
    const isMonthly = MORTGAGE_CALCULATOR.scheduleType === 'monthly';

    // Group to Yearly if necessary
    let displaySchedule = schedule;
    if (!isMonthly) {
        displaySchedule = schedule.reduce((acc, current) => {
            const year = Math.ceil(current.month / 12);
            if (!acc[year]) {
                acc[year] = { month: year, date: `Year ${year}`, piPayment: 0, principal: 0, interest: 0, balance: 0 };
            }
            acc[year].piPayment += current.piPayment;
            acc[year].principal += current.principal;
            acc[year].interest += current.interest;
            acc[year].balance = current.balance;
            return acc;
        }, {});
        displaySchedule = Object.values(displaySchedule);
    }

    displaySchedule.forEach((item, index) => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = isMonthly ? item.month : item.month;
        row.insertCell().textContent = item.date;
        row.insertCell().textContent = formatDisplayCurrency(item.piPayment);
        row.insertCell().textContent = formatDisplayCurrency(item.principal);
        row.insertCell().textContent = formatDisplayCurrency(item.interest);
        row.insertCell().textContent = formatDisplayCurrency(item.balance);
    });
};

/* ========================================================================== */
/* FRED API INTEGRATION (Live Rates) */
/* ========================================================================== */

const fredAPI = {
    /**
     * Fetches a single series from FRED.
     * @param {string} seriesId 
     * @returns {Promise<number|null>} The latest rate or null on failure.
     */
    async fetchSeries(seriesId) {
        const url = `${MORTGAGE_CALCULATOR.FRED_BASE_URL}?series_id=${seriesId}&api_key=${MORTGAGE_CALCULATOR.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`FRED API Error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            // FRED rates usually report as a float percentage (e.g., 6.44)
            const rate = parseFloat(data.observations.find(obs => obs.value !== '.').value);
            
            if (isNaN(rate)) {
                throw new Error(`FRED API Error: Invalid rate value for ${seriesId}`);
            }
            return rate;
        } catch (error) {
            console.error(`Failed to fetch FRED series ${seriesId}:`, error);
            // Google Analytics event for API failure
            if (typeof gtag === 'function') {
                gtag('event', 'api_error', { 
                    'event_category': 'FRED API', 
                    'event_label': `Fetch failed: ${seriesId}`, 
                    'value': 1 // Indicates an error occurred
                });
            }
            return null; // Return null on failure
        }
    },

    /**
     * Fetches all relevant live rates in parallel.
     */
    async fetchAllLiveRates() {
        const ratePromises = [];
        const rateLabels = [];
        for (const [label, seriesId] of Object.entries(MORTGAGE_CALCULATOR.FRED_SERIES)) {
            rateLabels.push(label);
            ratePromises.push(this.fetchSeries(seriesId));
        }
        
        const results = await Promise.all(ratePromises);
        
        MORTGAGE_CALCULATOR.liveRates = {};
        results.forEach((rate, index) => {
            const label = rateLabels[index];
            if (rate !== null) {
                MORTGAGE_CALCULATOR.liveRates[label] = rate;
            }
        });
        
        MORTGAGE_CALCULATOR.lastRateUpdate = Date.now();
        this.updateRateUI();
    },

    /**
     * Updates the UI elements with fetched FRED rates.
     */
    updateRateUI() {
        const select = document.getElementById('live-rate-select');
        const statusText = document.querySelector('#fred-rate-status .status-text');
        select.innerHTML = '<option value="">-- Select Rate to Apply --</option>';

        const rates = MORTGAGE_CALCULATOR.liveRates;
        let defaultRate = null;
        let defaultLabel = null;

        if (Object.keys(rates).length === 0) {
            statusText.textContent = `FRED Rate: Error fetching rates. Using default values.`;
            document.getElementById('fred-rate-status').classList.remove('status-info');
            document.getElementById('fred-rate-status').classList.add('status-error');
            showToast('Live mortgage rates unavailable. Using default inputs.', 'warning');
            return;
        }

        for (const [label, rate] of Object.entries(rates)) {
            const option = document.createElement('option');
            option.value = rate.toFixed(2);
            option.textContent = `${label}: ${rate.toFixed(2)}%`;
            select.appendChild(option);
            
            if (label === '30-Year Fixed') {
                defaultRate = rate.toFixed(2);
                defaultLabel = label;
            }
        }
        
        if (defaultRate) {
            statusText.textContent = `FRED Rate: Live average for 30-yr fixed is ${defaultRate}%`;
            document.getElementById('fred-rate-status').classList.remove('status-error');
            document.getElementById('fred-rate-status').classList.add('status-info');
            // Auto-apply the 30-Year Fixed rate if the input field is still at the default placeholder.
            if (getNumericalValue('interest-rate') === 6.44) {
                 document.getElementById('interest-rate').value = defaultRate;
            }
        }
        
        // After fetching rates and potentially updating input, run initial calculation
        updateCalculations();
    },
    
    /**
     * Starts the automatic rate fetching process.
     */
    startAutomaticUpdates() {
        this.fetchAllLiveRates(); // Initial fetch
        setInterval(() => {
            this.fetchAllLiveRates();
        }, MORTGAGE_CALCULATOR.RATE_UPDATE_INTERVAL);
    }
};

/* ========================================================================== */
/* ZIP CODE DATABASE (for Tax/Insurance Estimation) */
/* ========================================================================== */

const ZIP_DATABASE = {
    zipCodes: new Map(),
    
    initialize() {
        // Sample data representing all major US areas - In production, this would be a full 41,552+ codes
        const sampleZipData = [
            { zip: '10001', city: 'New York', state: 'NY', stateName: 'New York', propertyTaxRate: 1.25, insuranceRate: 0.4 },
            { zip: '02101', city: 'Boston', state: 'MA', stateName: 'Massachusetts', propertyTaxRate: 1.17, insuranceRate: 0.55 },
            { zip: '33101', city: 'Miami', state: 'FL', stateName: 'Florida', propertyTaxRate: 1.02, insuranceRate: 1.2 },
            { zip: '30301', city: 'Atlanta', state: 'GA', stateName: 'Georgia', propertyTaxRate: 0.83, insuranceRate: 0.65 },
            { zip: '60601', city: 'Chicago', state: 'IL', stateName: 'Illinois', propertyTaxRate: 2.05, insuranceRate: 0.5 },
            { zip: '77001', city: 'Houston', state: 'TX', stateName: 'Texas', propertyTaxRate: 1.81, insuranceRate: 0.7 },
            { zip: '90210', city: 'Beverly Hills', state: 'CA', stateName: 'California', propertyTaxRate: 0.75, insuranceRate: 0.6 },
            { zip: '80201', city: 'Denver', state: 'CO', stateName: 'Colorado', propertyTaxRate: 0.51, insuranceRate: 0.55 },
            { zip: '99501', city: 'Anchorage', state: 'AK', stateName: 'Alaska', propertyTaxRate: 1.19, insuranceRate: 0.6 },
            { zip: '20001', city: 'Washington', state: 'DC', stateName: 'District of Columbia', propertyTaxRate: 0.57, insuranceRate: 0.4 },
        ];
        
        sampleZipData.forEach(data => {
            // Convert rates from percentage to decimal (e.g., 1.81% -> 0.0181)
            data.propertyTaxRate = data.propertyTaxRate / 100;
            data.insuranceRate = data.insuranceRate / 100;
            this.zipCodes.set(data.zip, data);
        });
        
        // Populate default ZIP info for initial state
        const defaultZip = this.getZipData(document.getElementById('zip-code').value);
        if (defaultZip) {
            this.updateZipInfo(defaultZip, true);
        }
    },
    
    getZipData(zipCode) {
        return this.zipCodes.get(zipCode);
    },
    
    /**
     * Updates the Property Tax and Insurance fields based on ZIP code data.
     */
    updateZipInfo(zipData, isInitialLoad = false) {
        if (!zipData) {
            showToast('ZIP code not found in our database. Using manual inputs.', 'error');
            return;
        }

        const price = MORTGAGE_CALCULATOR.currentCalculation.homePrice;
        
        // Calculate estimated annual tax and insurance
        const estimatedTax = price * zipData.propertyTaxRate;
        const estimatedInsurance = price * zipData.insuranceRate;
        
        // Only auto-update if it's the initial load or the user hasn't modified them significantly
        if (isInitialLoad || getNumericalValue('property-tax') === 0) {
            document.getElementById('property-tax').value = formatCurrency(estimatedTax, false);
        }
        if (isInitialLoad || getNumericalValue('home-insurance') === 0) {
            document.getElementById('home-insurance').value = formatCurrency(estimatedInsurance, false);
        }
        
        // Update information displays
        document.getElementById('zip-info').querySelector('.status-text').textContent = 
            `${zipData.city}, ${zipData.state} (${zipData.stateName})`;
        document.getElementById('tax-rate-info').querySelector('.status-text').textContent = 
            `~${(zipData.propertyTaxRate * 100).toFixed(2)}% (Est.)`;
        document.getElementById('insurance-rate-info').querySelector('.status-text').textContent = 
            `~${(zipData.insuranceRate * 100).toFixed(2)}% (Est.)`;
        
        if (!isInitialLoad) {
             showToast(`Defaults loaded for ${zipData.city}, ${zipData.state}!`, 'success');
        }
       
        updateCalculations();
    }
};

/* ========================================================================== */
/* PWA & ACCESSIBILITY */
/* ========================================================================== */

/**
 * Initializes PWA (Progressive Web App) logic.
 */
const initPWA = () => {
    const installBtn = document.getElementById('install-pwa-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        MORTGAGE_CALCULATOR.deferredInstallPrompt = e;
        // Update UI notify the user they can install the PWA
        installBtn.style.display = 'block';
        
        installBtn.addEventListener('click', () => {
            // Show the prompt
            MORTGAGE_CALCULATOR.deferredInstallPrompt.prompt();
            // Wait for the user to respond to the prompt
            MORTGAGE_CALCULATOR.deferredInstallPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    showToast('App installed successfully!', 'success');
                    // Track PWA install
                    if (typeof gtag === 'function') {
                        gtag('event', 'pwa_install', { 'event_category': 'PWA', 'event_label': 'accepted' });
                    }
                } else {
                    showToast('App install dismissed.', 'info');
                    // Track PWA dismiss
                    if (typeof gtag === 'function') {
                        gtag('event', 'pwa_install', { 'event_category': 'PWA', 'event_label': 'dismissed' });
                    }
                }
                MORTGAGE_CALCULATOR.deferredInstallPrompt = null;
                installBtn.style.display = 'none';
            });
        });
    });
};

/**
 * Adjusts the overall font size for accessibility.
 * @param {string} action - 'increase' or 'decrease'
 */
window.adjustFontSize = (action) => {
    const options = MORTGAGE_CALCULATOR.fontScaleOptions;
    let index = MORTGAGE_CALCULATOR.currentFontScaleIndex;
    
    if (action === 'increase' && index < options.length - 1) {
        index++;
    } else if (action === 'decrease' && index > 0) {
        index--;
    }
    
    MORTGAGE_CALCULATOR.currentFontScaleIndex = index;
    const newScale = options[index];
    // This assumes the CSS has a --base-font-size variable on the :root or <html>
    document.documentElement.style.setProperty('--base-font-size', `${(newScale * 16).toFixed(0)}px`);

    // Track font change
    if (typeof gtag === 'function') {
        gtag('event', 'font_size_change', { 
            'event_category': 'Accessibility', 
            'event_label': `${action}`, 
            'value': (newScale * 100).toFixed(0) 
        });
    }
};

/* ========================================================================== */
/* MONETIZATION & EVENT LISTENERS */
/* ========================================================================== */

/**
 * Handles clicks on monetization/affiliate links for tracking.
 * @param {Event} e 
 */
const handleMonetizationClick = (e) => {
    const target = e.currentTarget.closest('.affiliate-link');
    if (target) {
        const partner = target.dataset.affiliatePartner || 'unknown';
        const ctaType = target.classList.contains('card-affiliate') ? 'lead_form_card' : 'button';
        
        // Track affiliate click
        if (typeof gtag === 'function') {
            gtag('event', 'affiliate_click', {
                'event_category': 'Monetization',
                'event_label': `${partner}_${ctaType}`,
                'value': 1
            });
        }
    }
};

/**
 * Handles Export button clicks.
 * @param {string} type - 'pdf' or 'csv'
 */
const exportResults = (type) => {
    // Placeholder for actual PDF/CSV generation logic using jspdf or custom logic
    showToast(`Exporting Amortization Schedule to ${type.toUpperCase()}... (Placeholder)`, 'info');

    // Track export event
    if (typeof gtag === 'function') {
        gtag('event', 'export_data', {
            'event_category': 'Data Export',
            'event_label': type.toUpperCase(),
            'value': MORTGAGE_CALCULATOR.amortizationSchedule.length
        });
    }
    
    // In a full implementation, you'd use the schedule in MORTGAGE_CALCULATOR.amortizationSchedule
    // along with the jspdf library (already loaded in HTML with async defer) to generate the file.
};


/**
 * Sets up all main event listeners.
 */
function initializeEventListeners() {
    
    // 1. Calculation Trigger Button
    document.getElementById('calculate-btn').addEventListener('click', () => {
        updateCalculations(false);
    });

    // 2. Loan Parameter Change Listeners (Auto-Recalculate logic for related fields)
    const homePriceInput = document.getElementById('home-price');
    const downPaymentInput = document.getElementById('down-payment');
    const downPaymentPercentInput = document.getElementById('down-payment-percent');
    const loanTypeSelect = document.getElementById('loan-type');

    // Update Down Payment Percentage based on dollar value
    const updateDownPaymentPercent = () => {
        const hp = getNumericalValue('home-price');
        const dp = getNumericalValue('down-payment');
        if (hp > 0) {
            const dpPercent = (dp / hp) * 100;
            downPaymentPercentInput.value = dpPercent.toFixed(2);
        } else {
            downPaymentPercentInput.value = '0.00';
        }
        // Force PMI update after DP change
        const loanAmount = hp - dp;
        const estimatedAnnualPMI = estimatePMI(loanAmount, getNumericalValue('down-payment-percent'), loanTypeSelect.value);
        document.getElementById('pmi').value = formatCurrency(estimatedAnnualPMI, false);
    };

    // Update Down Payment Dollar amount based on percentage
    const updateDownPaymentDollar = () => {
        const hp = getNumericalValue('home-price');
        const dpPercent = getNumericalValue('down-payment-percent');
        if (hp > 0 && dpPercent >= 0) {
            const dp = hp * (dpPercent / 100);
            downPaymentInput.value = formatCurrency(dp, false);
        }
        // Force PMI update after DP change
        const loanAmount = hp - getNumericalValue('down-payment');
        const estimatedAnnualPMI = estimatePMI(loanAmount, dpPercent, loanTypeSelect.value);
        document.getElementById('pmi').value = formatCurrency(estimatedAnnualPMI, false);
    };
    
    homePriceInput.addEventListener('change', updateDownPaymentPercent);
    downPaymentInput.addEventListener('change', updateDownPaymentPercent);
    downPaymentPercentInput.addEventListener('change', updateDownPaymentDollar);
    loanTypeSelect.addEventListener('change', updateDownPaymentPercent); // Triggers PMI recalculation

    // 3. ZIP Code & Live Rate Handling
    document.getElementById('zip-code').addEventListener('change', (e) => {
        const zipCode = e.target.value;
        if (zipCode.length === 5) {
            ZIP_DATABASE.updateZipInfo(ZIP_DATABASE.getZipData(zipCode));
        } else {
            showToast('Please enter a 5-digit ZIP code.', 'warning');
        }
    });

    document.getElementById('live-rate-select').addEventListener('change', (e) => {
        if (e.target.value) {
            document.getElementById('interest-rate').value = e.target.value;
            // Optionally trigger a calculation on rate application
            updateCalculations(false);
        }
    });

    // 4. UI/UX Controls
    // Theme Toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const body = document.body;
        const isLight = body.dataset.colorScheme === 'light';
        body.dataset.colorScheme = isLight ? 'dark' : 'light';
        // Toggle icon
        document.querySelector('#theme-toggle .theme-icon').classList.toggle('fa-moon', isLight);
        document.querySelector('#theme-toggle .theme-icon').classList.toggle('fa-sun', !isLight);
        // Track theme change
        if (typeof gtag === 'function') {
            gtag('event', 'theme_change', { 'event_category': 'UX', 'event_label': isLight ? 'dark' : 'light' });
        }
    });

    // Tab Switching Logic
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.currentTarget.dataset.tab;
            
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            e.currentTarget.classList.add('active');
            e.currentTarget.setAttribute('aria-selected', 'true');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Re-render chart if switching to a chart tab (e.g., from overview to breakdown/schedule)
            if (tabId === 'breakdown') renderPaymentBreakdownChart(calculatePITI(MORTGAGE_CALCULATOR.currentCalculation));
            if (tabId === 'schedule') {
                renderAmortizationTable();
            }
        });
    });

    // Comparison Loan Toggle
    document.getElementById('compare-loan-toggle').addEventListener('click', (e) => {
        const comparisonTool = document.getElementById('loan-comparison-tool');
        const isExpanded = e.currentTarget.getAttribute('aria-expanded') === 'true';
        MORTGAGE_CALCULATOR.comparisonLoan.enabled = !isExpanded;
        
        e.currentTarget.setAttribute('aria-expanded', !isExpanded);
        comparisonTool.setAttribute('aria-hidden', isExpanded);
        
        // Use scrollHeight to animate expansion/collapse
        comparisonTool.style.maxHeight = isExpanded ? '0' : comparisonTool.scrollHeight + 'px';
        
        e.currentTarget.innerHTML = !isExpanded
            ? '<i class="fas fa-balance-scale-right"></i> Hide Comparison Loan'
            : '<i class="fas fa-balance-scale-left"></i> Compare a Second Loan';
        
        // Run comparison calculation if enabling
        if (!isExpanded) {
            updateCalculations(true);
        } else {
             document.getElementById('monthly-payment-comparison').textContent = '';
        }
    });

    // 5. Monetization Listeners (Affiliate Links and CTA buttons)
    document.querySelectorAll('.affiliate-link, .monetization-cta').forEach(link => {
        link.addEventListener('click', handleMonetizationClick);
    });
    
    // 6. Export Buttons
    document.getElementById('export-pdf').addEventListener('click', () => exportResults('pdf'));
    document.getElementById('export-csv').addEventListener('click', () => exportResults('csv'));
    
    // 7. Schedule View Toggle
    document.getElementById('schedule-view-type').addEventListener('change', (e) => {
        MORTGAGE_CALCULATOR.scheduleType = e.target.value;
        renderAmortizationTable();
    });
}

/* ========================================================================== */
/* INITIALIZATION */
/* ========================================================================== */

/**
 * Main initialization function.
 */
function init() {
    if (MORTGAGE_CALCULATOR.DEBUG) console.log(`Home Loan Pro v${MORTGAGE_CALCULATOR.VERSION} Initializing...`);

    // 1. Initialize Core Services
    ZIP_DATABASE.initialize();
    
    // 2. Initialize Charts (must be done before calculations)
    // Defer the chart logic to ensure libraries are loaded (async defer in HTML)
    if (window.Chart && window.jspdf) {
        initializeCharts();
    } else {
        // Fallback for slower connections: wait for chart.js/jspdf to load
        const loadCheck = setInterval(() => {
            if (window.Chart && window.jspdf) {
                clearInterval(loadCheck);
                initializeCharts();
                // Re-run calculation to render charts if they loaded late
                updateCalculations();
            }
        }, 200);
    }
    
    // 3. Initialize PWA
    initPWA();
    
    // 4. Set up Event Listeners
    initializeEventListeners();

    // 5. Fetch Live Rates and Start Auto-Updates (Triggers first calculation)
    fredAPI.startAutomaticUpdates();
    
    // 6. Initial Calculation (Fallback if FRED is very slow or fails)
    // This call is here to ensure the UI has values immediately on DOMContentLoaded
    if (Object.keys(MORTGAGE_CALCULATOR.liveRates).length === 0) {
        updateCalculations(); 
    }
}

// Ensure init is called after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
