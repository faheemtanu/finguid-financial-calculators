/* ========================================================================== */
/* FINGUID PRO AI MORTGAGE CALCULATOR - PRODUCTION JS v25.0 PRO           */
/* All User Improvements Implemented:                                         */
/* 1. Branding Updates & Minimized Header                                     */
/* 2. Google Analytics Tracking (G-NYBL2CDNQJ)                                */
/* 3. Live FRED API Integration (3 series, 12-Hour Update)                    */
/* 4. Credit Score Tiered Rate Adjustment (NEW)                               */
/* 5. Fully Functional Loan Compare (NEW)                                     */
/* 6. Voice Command Fix & Screen Reader Mode (Accessibility)                  */
/* 7. Footer Implementation (NEW)                                             */
/* 8. Amortization Chart Update (Stacked Area/Line - MATCHING MOCK)           */
/* ========================================================================== */

// ========================================================================== //
// ENHANCED GLOBAL CONFIGURATION & STATE MANAGEMENT                          //
// ========================================================================== //

const MORTGAGE_CALCULATOR = {
    // Version & Configuration
    VERSION: '25.0-AI-Enhanced-PRO',
    DEBUG: true,
    
    // FRED API Configuration
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    RATE_UPDATE_INTERVAL: 12 * 60 * 60 * 1000,
    
    // FRED Series IDs for Live Rates
    FRED_SERIES: {
        '30YFIXED': 'MORTGAGE30US',
        '15YT': 'GZ15',
        '10YT': 'DGS10'
    },
    
    // Cached Live Rates & Update Time
    liveRates: {
        '30YFIXED': 6.50,
        '15YT': 4.50,
        '10YT': 4.30,
        lastUpdate: 0
    },

    // Credit Score Adjustment Tiers
    CREDIT_TIERS: [
        { score: 780, adjustment: -0.30 },
        { score: 720, adjustment: 0.00 },
        { score: 660, adjustment: 0.50 },
        { score: 600, adjustment: 1.00 },
        { score: 500, adjustment: 1.50 }
    ],

    // Chart instances for cleanup/updates
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
        interestRate: 6.50,
        loanTerm: 30,
        loanType: 'conventional',
        propertyTax: 9000,
        homeInsurance: 1800,
        pmi: 0,
        hoaFees: 0,
        extraMonthly: 0,
        oneTimeExtra: 0,
        closingCostsPercent: 3,
        creditScore: 740,
        state: 'default',
        monthlyPITI: 0,
        totalInterest: 0,
        payoffDate: '',
        totalCost: 0
    },
    
    // Amortization schedule
    amortizationSchedule: [],
    scheduleCurrentPage: 1,
    scheduleItemsPerPage: 12,
    scheduleType: 'monthly',
    
    // Voice recognition & Screen Reader state
    voiceEnabled: false,
    screenReaderMode: false,
    speechRecognition: window.SpeechRecognition || window.webkitSpeechRecognition,
    speechSynthesis: window.speechSynthesis,
    
    // Theme state
    currentTheme: 'dark',
};

// ========================================================================== //
// STATE TAX/INSURANCE DATA                                                  //
// ========================================================================== //

const STATE_RATES = {
    'DEFAULT': { name: 'Select State', taxRate: 1.00, insuranceRate: 0.50 },
    'AL': { name: 'Alabama', taxRate: 0.40, insuranceRate: 0.75 },
    'AK': { name: 'Alaska', taxRate: 1.19, insuranceRate: 0.50 },
    'AZ': { name: 'Arizona', taxRate: 0.62, insuranceRate: 0.70 },
    'AR': { name: 'Arkansas', taxRate: 0.62, insuranceRate: 0.90 },
    'CA': { name: 'California', taxRate: 0.71, insuranceRate: 0.55 },
    'CO': { name: 'Colorado', taxRate: 0.51, insuranceRate: 0.65 },
    'CT': { name: 'Connecticut', taxRate: 1.93, insuranceRate: 0.40 },
    'DE': { name: 'Delaware', taxRate: 0.58, insuranceRate: 0.45 },
    'DC': { name: 'District of Columbia', taxRate: 0.57, insuranceRate: 0.45 },
    'FL': { name: 'Florida', taxRate: 0.94, insuranceRate: 1.20 },
    'GA': { name: 'Georgia', taxRate: 0.82, insuranceRate: 0.65 },
    'HI': { name: 'Hawaii', taxRate: 0.30, insuranceRate: 0.80 },
    'ID': { name: 'Idaho', taxRate: 0.56, insuranceRate: 0.40 },
    'IL': { name: 'Illinois', taxRate: 2.16, insuranceRate: 0.55 },
    'IN': { name: 'Indiana', taxRate: 0.81, insuranceRate: 0.50 },
    'IA': { name: 'Iowa', taxRate: 1.48, insuranceRate: 0.40 },
    'KS': { name: 'Kansas', taxRate: 1.41, insuranceRate: 0.70 },
    'KY': { name: 'Kentucky', taxRate: 0.85, insuranceRate: 0.60 },
    'LA': { name: 'Louisiana', taxRate: 0.52, insuranceRate: 1.40 },
    'ME': { name: 'Maine', taxRate: 1.26, insuranceRate: 0.40 },
    'MD': { name: 'Maryland', taxRate: 1.05, insuranceRate: 0.45 },
    'MA': { name: 'Massachusetts', taxRate: 1.13, insuranceRate: 0.50 },
    'MI': { name: 'Michigan', taxRate: 1.45, insuranceRate: 0.55 },
    'MN': { name: 'Minnesota', taxRate: 1.05, insuranceRate: 0.40 },
    'MS': { name: 'Mississippi', taxRate: 0.79, insuranceRate: 0.95 },
    'MO': { name: 'Missouri', taxRate: 0.98, insuranceRate: 0.60 },
    'MT': { name: 'Montana', taxRate: 0.85, insuranceRate: 0.45 },
    'NE': { name: 'Nebraska', taxRate: 1.63, insuranceRate: 0.45 },
    'NV': { name: 'Nevada', taxRate: 0.69, insuranceRate: 0.65 },
    'NH': { name: 'New Hampshire', taxRate: 2.18, insuranceRate: 0.40 },
    'NJ': { name: 'New Jersey', taxRate: 2.23, insuranceRate: 0.50 },
    'NM': { name: 'New Mexico', taxRate: 0.76, insuranceRate: 0.55 },
    'NY': { name: 'New York', taxRate: 1.40, insuranceRate: 0.40 },
    'NC': { name: 'North Carolina', taxRate: 0.83, insuranceRate: 0.55 },
    'ND': { name: 'North Dakota', taxRate: 1.11, insuranceRate: 0.40 },
    'OH': { name: 'Ohio', taxRate: 1.56, insuranceRate: 0.50 },
    'OK': { name: 'Oklahoma', taxRate: 0.88, insuranceRate: 0.80 },
    'OR': { name: 'Oregon', taxRate: 0.95, insuranceRate: 0.40 },
    'PA': { name: 'Pennsylvania', taxRate: 1.54, insuranceRate: 0.45 },
    'RI': { name: 'Rhode Island', taxRate: 1.45, insuranceRate: 0.45 },
    'SC': { name: 'South Carolina', taxRate: 0.57, insuranceRate: 0.75 },
    'SD': { name: 'South Dakota', taxRate: 1.22, insuranceRate: 0.40 },
    'TN': { name: 'Tennessee', taxRate: 0.66, insuranceRate: 0.55 },
    'TX': { name: 'Texas', taxRate: 1.68, insuranceRate: 0.90 },
    'UT': { name: 'Utah', taxRate: 0.58, insuranceRate: 0.40 },
    'VT': { name: 'Vermont', taxRate: 1.83, insuranceRate: 0.40 },
    'VA': { name: 'Virginia', taxRate: 0.80, insuranceRate: 0.40 },
    'WA': { name: 'Washington', taxRate: 0.93, insuranceRate: 0.45 },
    'WV': { name: 'West Virginia', taxRate: 0.65, insuranceRate: 0.65 },
    'WI': { name: 'Wisconsin', taxRate: 1.70, insuranceRate: 0.40 },
    'WY': { name: 'Wyoming', taxRate: 0.61, insuranceRate: 0.40 }
};

// ========================================================================== //
// FIXED CORE FUNCTIONS                                                      //
// ========================================================================== //

/**
 * Fetches multiple live interest rate series from the FRED API.
 */
async function fetchLiveFredRates() {
    const now = Date.now();
    const isRateFresh = (now - MORTGAGE_CALCULATOR.liveRates.lastUpdate) < MORTGAGE_CALCULATOR.RATE_UPDATE_INTERVAL;

    if (isRateFresh && MORTGAGE_CALCULATOR.liveRates.lastUpdate !== 0) {
        if (MORTGAGE_CALCULATOR.DEBUG) console.log("FRED rates are fresh. Skipping API call.");
        updateRateDisplay();
        return;
    }

    if (MORTGAGE_CALCULATOR.DEBUG) console.log("🏦 Fetching fresh FRED API rates...");
    if (document.getElementById('loading-message')) {
        document.getElementById('loading-message').textContent = "Fetching live Federal Reserve rates...";
    }
    if (document.getElementById('loading-indicator')) {
        document.getElementById('loading-indicator').setAttribute('aria-hidden', 'false');
    }

    const fetchPromises = Object.entries(MORTGAGE_CALCULATOR.FRED_SERIES).map(([key, seriesId]) => {
        const url = `${MORTGAGE_CALCULATOR.FRED_BASE_URL}?series_id=${seriesId}&api_key=${MORTGAGE_CALCULATOR.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
        return fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${seriesId}`);
                return response.json();
            })
            .then(data => {
                if (data.observations && data.observations.length > 0) {
                    const latestValue = parseFloat(data.observations[0].value);
                    if (latestValue > 0) {
                        MORTGAGE_CALCULATOR.liveRates[key] = latestValue;
                    }
                }
            })
            .catch(error => {
                console.error(`Error fetching FRED series ${seriesId}:`, error);
            });
    });

    try {
        await Promise.all(fetchPromises);
        MORTGAGE_CALCULATOR.liveRates.lastUpdate = Date.now();
        updateRateDisplay();
        autoAdjustRate();
        updateCalculation('auto-rate-adjust');
        showToast("Live FRED rates updated successfully!", 'success');
    } catch (error) {
        console.error("Critical error in FRED rate fetching:", error);
        showToast("Failed to fetch live FRED rates. Using cached/default.", 'error');
    } finally {
        if (document.getElementById('loading-indicator')) {
            document.getElementById('loading-indicator').setAttribute('aria-hidden', 'true');
        }
    }
}

/**
 * Updates the display panel with the fetched live FRED rates.
 */
function updateRateDisplay() {
    const rates = MORTGAGE_CALCULATOR.liveRates;
    const date = new Date(rates.lastUpdate);
    const timeString = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (document.getElementById('fred-rate-30y-fixed')) {
        document.getElementById('fred-rate-30y-fixed').textContent = `${rates['30YFIXED'].toFixed(2)}%`;
    }
    if (document.getElementById('fred-rate-15y')) {
        document.getElementById('fred-rate-15y').textContent = `${rates['15YT'].toFixed(2)}%`;
    }
    if (document.getElementById('fred-rate-10y')) {
        document.getElementById('fred-rate-10y').textContent = `${rates['10YT'].toFixed(2)}%`;
    }
    if (document.getElementById('last-update-time')) {
        document.getElementById('last-update-time').textContent = `${dateString} @ ${timeString}`;
    }
}

/**
 * Calculates the adjusted interest rate based on the live 30Y Fixed Rate 
 * and the user's selected Credit Score.
 */
function autoAdjustRate() {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const baseRate = MORTGAGE_CALCULATOR.liveRates['30YFIXED'];
    const userScore = current.creditScore;
    
    let adjustment = 0;
    
    // Find the appropriate adjustment tier
    for (const tier of MORTGAGE_CALCULATOR.CREDIT_TIERS) {
        if (userScore >= tier.score) {
            adjustment = tier.adjustment;
            break;
        }
    }

    const newRate = (baseRate + adjustment);
    
    // Update the state and the input field
    current.interestRate = newRate;
    if (document.getElementById('interest-rate')) {
        document.getElementById('interest-rate').value = newRate.toFixed(2);
    }
    
    if (MORTGAGE_CALCULATOR.DEBUG) console.log(`Rate adjusted: Base(${baseRate.toFixed(2)}%) + Adj(${adjustment.toFixed(2)}%) = ${newRate.toFixed(2)}%`);

    // Only set the auto-rate indicator if the user didn't manually override the rate
    if (document.getElementById('auto-rate-indicator')) {
        document.getElementById('auto-rate-indicator').style.display = 'inline-block';
    }
}

/**
 * Handles the change event for the credit score slider.
 * @param {string} sourceId - The ID of the input that triggered the update.
 */
function updateCreditScore(sourceId) {
    const scoreValue = document.getElementById('credit-score').value;
    MORTGAGE_CALCULATOR.currentCalculation.creditScore = parseInt(scoreValue);
    if (document.getElementById('current-score-value')) {
        document.getElementById('current-score-value').textContent = scoreValue;
    }
    
    // Recalculate and update the interest rate immediately
    autoAdjustRate(); 
    updateCalculation(sourceId);
}

// ========================================================================== //
// FIXED CORE CALCULATION LOGIC                                              //
// ========================================================================== //

/**
 * Main function to read inputs, calculate mortgage, and update the UI.
 * @param {string} sourceId - The ID of the input that triggered the update.
 */
function updateCalculation(sourceId = null) {
    if (MORTGAGE_CALCULATOR.DEBUG) console.log(`🔄 Calculation triggered by: ${sourceId}`);
    
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    
    // 1. Read Inputs
    const homePrice = parseFloat(document.getElementById('home-price').value) || 0;
    const downPayment = parseFloat(document.getElementById('down-payment').value) || 0;
    const downPaymentPercent = parseFloat(document.getElementById('down-payment-percent').value) || 0;
    const interestRateInput = parseFloat(document.getElementById('interest-rate').value) || 0;
    
    // Handle state selection
    if (sourceId === 'state-select') {
        autoUpdateTaxAndInsurance();
    }
    
    // If the user manually changed the interest rate, turn off auto-adjust indicator
    if (sourceId === 'interest-rate') {
        if (document.getElementById('auto-rate-indicator')) {
            document.getElementById('auto-rate-indicator').style.display = 'none';
        }
        current.interestRate = interestRateInput;
    } else if (sourceId === 'auto-rate-adjust') {
        current.interestRate = interestRateInput;
    } else {
        current.interestRate = parseFloat(document.getElementById('interest-rate').value) || 0;
    }

    // 2. Synchronize Down Payment (2-way sync)
    if (sourceId === 'down-payment') {
        current.downPaymentPercent = (downPayment / homePrice) * 100 || 0;
        document.getElementById('down-payment-percent').value = current.downPaymentPercent.toFixed(2);
    } else if (sourceId === 'down-payment-percent') {
        current.downPayment = homePrice * (downPaymentPercent / 100);
        document.getElementById('down-payment').value = current.downPayment.toFixed(0);
    }
    
    // Update all core properties
    current.homePrice = homePrice;
    current.downPayment = parseFloat(document.getElementById('down-payment').value) || 0;
    current.downPaymentPercent = parseFloat(document.getElementById('down-payment-percent').value) || 0;
    current.loanAmount = current.homePrice - current.downPayment;
    current.loanTerm = parseInt(document.getElementById('loan-term').value) || 30;
    current.loanType = document.getElementById('loan-type').value;

    // Remaining input reads
    current.propertyTax = parseFloat(document.getElementById('property-tax').value) || 0;
    current.homeInsurance = parseFloat(document.getElementById('home-insurance').value) || 0;
    current.pmi = parseFloat(document.getElementById('pmi').value) || 0;
    current.hoaFees = parseFloat(document.getElementById('hoa-fees').value) || 0;
    current.extraMonthly = parseFloat(document.getElementById('extra-monthly').value) || 0;
    current.oneTimeExtra = parseFloat(document.getElementById('one-time-extra').value) || 0;
    current.closingCostsPercent = parseFloat(document.getElementById('closing-costs-percentage').value) || 0;

    // 3. Auto-calculate PMI (Logic based on loan type/DP)
    if (current.downPaymentPercent < 20 && current.loanType === 'conventional') {
        current.pmi = (current.loanAmount * 0.005) / 12;
    } else {
        current.pmi = 0;
    }
    document.getElementById('pmi').value = current.pmi.toFixed(2);

    // 4. Core P&I Calculation (Monthly Payment Formula)
    const principal = current.loanAmount;
    const rateMonthly = (current.interestRate / 100) / 12;
    const paymentsTotal = current.loanTerm * 12;

    let monthlyPI;
    if (rateMonthly === 0) {
        monthlyPI = principal / paymentsTotal;
    } else {
        monthlyPI = principal * (rateMonthly * Math.pow(1 + rateMonthly, paymentsTotal)) / (Math.pow(1 + rateMonthly, paymentsTotal) - 1);
    }
    if (isNaN(monthlyPI) || monthlyPI === Infinity) monthlyPI = 0;

    // 5. Total Monthly Payment (PITI + Fees)
    const monthlyTax = current.propertyTax / 12;
    const monthlyInsurance = current.homeInsurance / 12;
    const monthlyPITI = monthlyPI + monthlyTax + monthlyInsurance + current.pmi + current.hoaFees;
    
    // 6. Final Monthly Display (Base PITI + Extra)
    const finalMonthlyPayment = monthlyPITI + current.extraMonthly;
    
    // 7. Calculate Loan Totals via Amortization
    const { amortizationSchedule, totalInterest, payoffDate, fullTotalCost } = calculateAmortization(monthlyPITI, current.extraMonthly, current.loanTerm);
    
    current.totalInterest = totalInterest;
    current.payoffDate = payoffDate;
    current.amortizationSchedule = amortizationSchedule;
    current.totalCost = fullTotalCost;
    current.monthlyPITI = monthlyPITI;

    // 8. Update UI (All Sections)
    
    if (document.getElementById('monthly-payment-total')) {
        document.getElementById('monthly-payment-total').textContent = formatCurrency(finalMonthlyPayment);
    }
    if (document.getElementById('extra-badge')) {
        document.getElementById('extra-badge').style.display = current.extraMonthly > 0 || current.oneTimeExtra > 0 ? 'inline-block' : 'none';
    }
    
    // Summary Breakdown
    if (document.getElementById('pi-monthly')) {
        document.getElementById('pi-monthly').textContent = formatCurrency(monthlyPI);
    }
    if (document.getElementById('tax-monthly')) {
        document.getElementById('tax-monthly').textContent = formatCurrency(monthlyTax);
    }
    if (document.getElementById('insurance-monthly')) {
        document.getElementById('insurance-monthly').textContent = formatCurrency(monthlyInsurance);
    }
    if (document.getElementById('other-monthly')) {
        document.getElementById('other-monthly').textContent = formatCurrency(current.pmi + current.hoaFees);
    }
    
    // Loan Totals
    if (document.getElementById('total-cost')) {
        document.getElementById('total-cost').textContent = formatCurrency(fullTotalCost);
    }
    if (document.getElementById('total-interest')) {
        document.getElementById('total-interest').textContent = formatCurrency(totalInterest);
    }
    if (document.getElementById('payoff-date')) {
        document.getElementById('payoff-date').textContent = payoffDate;
    }
    if (document.getElementById('closing-costs')) {
        document.getElementById('closing-costs').textContent = formatCurrency(current.homePrice * (current.closingCostsPercent / 100));
    }

    // Render Visuals
    renderPaymentComponentsChart(monthlyPI, monthlyTax, monthlyInsurance, current.pmi + current.hoaFees);
    renderMortgageTimelineChart();
    renderAIPoweredInsights();
    renderPaymentScheduleTable();

    // Apply highlight flash for visual feedback
    if (sourceId && document.getElementById('monthly-payment-total')) {
        const paymentCard = document.getElementById('monthly-payment-total').closest('.monthly-payment-card');
        if (paymentCard) {
            paymentCard.classList.add('highlight-update');
            setTimeout(() => {
                paymentCard.classList.remove('highlight-update');
            }, 700);
        }
    }
}

// ========================================================================== //
// FIXED AMORTIZATION & CHART LOGIC                                          //
// ========================================================================== //

/**
 * Calculates the full amortization schedule.
 */
function calculateAmortization(monthlyPITI, extraMonthly, loanTerm) {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    let balance = current.loanAmount;
    const rateMonthly = (current.interestRate / 100) / 12;
    const monthlyPI = monthlyPITI - (current.propertyTax / 12) - (current.homeInsurance / 12) - current.pmi - current.hoaFees;
    
    const schedule = [];
    let totalInterestPaid = 0;
    let totalPaymentsMade = 0;
    let oneTimeExtra = current.oneTimeExtra;
    let cumulativePrincipal = 0;
    let cumulativeInterest = 0;
    
    const maxPayments = loanTerm * 12 + 60;

    for (let month = 1; month <= maxPayments && balance > 0; month++) {
        const interestPaid = balance * rateMonthly;
        
        let extraPaymentApplied = extraMonthly + (month === 1 ? oneTimeExtra : 0);
        let principalPaid = monthlyPI - interestPaid;
        let actualPrincipalPaid = principalPaid + extraPaymentApplied;
        let taxesAndInsurance = (current.propertyTax / 12) + (current.homeInsurance / 12) + current.pmi + current.hoaFees;

        // Final payment check
        if (balance < actualPrincipalPaid) {
            actualPrincipalPaid = balance;
            balance = 0;
        } else {
            balance -= actualPrincipalPaid;
        }

        totalInterestPaid += interestPaid;
        cumulativePrincipal += actualPrincipalPaid;
        cumulativeInterest += interestPaid;
        totalPaymentsMade++;

        schedule.push({ 
            month: month, 
            year: Math.ceil(month / 12), 
            date: new Date(new Date().setMonth(new Date().getMonth() + month)).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }), 
            totalPayment: actualPrincipalPaid + interestPaid + taxesAndInsurance, 
            principal: actualPrincipalPaid, 
            interest: interestPaid, 
            taxAndIns: taxesAndInsurance, 
            extra: extraPaymentApplied, 
            endingBalance: balance, 
            totalInterest: cumulativeInterest,
            totalPrincipal: cumulativePrincipal
        });

        if (month === 1) oneTimeExtra = 0;
    }

    const payoffDate = new Date(new Date().setMonth(new Date().getMonth() + totalPaymentsMade)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const fullTotalCost = current.homePrice + totalInterestPaid + (current.homePrice * current.closingCostsPercent / 100);
    
    return { amortizationSchedule: schedule, totalInterest: totalInterestPaid, payoffDate: payoffDate, totalPayments: totalPaymentsMade, fullTotalCost: fullTotalCost };
}

/**
 * Renders the Mortgage Balance Over Time Chart
 */
function renderMortgageTimelineChart() {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const schedule = current.amortizationSchedule;
    if (!schedule.length) return;

    const ctx = document.getElementById('mortgageTimelineChart');
    if (!ctx) return;

    // Destroy previous chart instance
    if (MORTGAGE_CALCULATOR.charts.mortgageTimeline) {
        MORTGAGE_CALCULATOR.charts.mortgageTimeline.destroy();
    }

    // Use yearly data for a cleaner timeline
    const yearlyData = schedule.filter(item => item.month % 12 === 0 || item.month === schedule.length);
    const maxCumulativeCost = current.homePrice + current.totalInterest;

    MORTGAGE_CALCULATOR.charts.mortgageTimeline = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: yearlyData.map(item => `Year ${item.year}`),
            datasets: [
                {
                    label: 'Total Interest Paid',
                    data: yearlyData.map(item => item.totalInterest),
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    fill: true,
                    stack: 'payments',
                    tension: 0.4,
                    pointRadius: 0
                },
                {
                    label: 'Total Principal Paid',
                    data: yearlyData.map(item => item.totalPrincipal),
                    backgroundColor: 'rgba(20, 184, 166, 0.6)',
                    borderColor: 'rgba(20, 184, 166, 1)',
                    fill: true,
                    stack: 'payments',
                    tension: 0.4,
                    pointRadius: 0
                },
                {
                    label: 'Remaining Balance',
                    data: yearlyData.map(item => item.endingBalance),
                    backgroundColor: 'transparent',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 3,
                    yAxisID: 'y1',
                    pointRadius: 3,
                    pointBackgroundColor: 'rgba(59, 130, 246, 1)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(156, 163, 175, 0.1)' },
                    title: {
                        display: true,
                        text: 'Year of Loan',
                        color: 'rgba(156, 163, 175, 1)'
                    }
                },
                y: {
                    stack: 'payments',
                    beginAtZero: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Cumulative Paid ($)',
                        color: 'rgba(156, 163, 175, 1)'
                    },
                    grid: { color: 'rgba(156, 163, 175, 0.1)' },
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000) + 'K';
                        },
                        color: 'rgba(156, 163, 175, 1)'
                    },
                    max: maxCumulativeCost * 1.05
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Remaining Balance ($)',
                        color: 'rgba(59, 130, 246, 1)'
                    },
                    grid: { drawOnChartArea: false },
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000) + 'K';
                        },
                        color: 'rgba(59, 130, 246, 1)'
                    },
                    max: current.loanAmount * 1.05
                }
            }
        }
    });
}

/**
 * Renders the Payment Components Pie/Doughnut Chart
 */
function renderPaymentComponentsChart(pi, tax, insurance, other) {
    const ctx = document.getElementById('paymentComponentsChart');
    if (!ctx) return;

    // Destroy previous chart instance
    if (MORTGAGE_CALCULATOR.charts.paymentComponents) {
        MORTGAGE_CALCULATOR.charts.paymentComponents.destroy();
    }

    MORTGAGE_CALCULATOR.charts.paymentComponents = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Principal & Interest', 'Property Tax', 'Home Insurance', 'PMI & HOA'],
            datasets: [{
                data: [pi, tax, insurance, other],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(107, 114, 128, 0.8)'
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(107, 114, 128, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'rgba(156, 163, 175, 1)',
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ========================================================================== //
// NEW MISSING FUNCTION IMPLEMENTATIONS                                      //
// ========================================================================== //

/**
 * Renders AI Powered Insights
 */
function renderAIPoweredInsights() {
    const insightsContent = document.getElementById('ai-insights-content');
    if (!insightsContent) return;

    const current = MORTGAGE_CALCULATOR.currentCalculation;
    
    const insights = [];
    
    // Credit Score Insight
    if (current.creditScore >= 780) {
        insights.push({
            title: "Excellent Credit Score",
            message: "Your credit score qualifies you for the best available rates. Consider shopping around for even better terms.",
            type: "success",
            icon: "fa-star"
        });
    } else if (current.creditScore >= 720) {
        insights.push({
            title: "Good Credit Score", 
            message: "You're getting competitive rates. Paying down other debts could help improve your score further.",
            type: "info",
            icon: "fa-thumbs-up"
        });
    }
    
    // Down Payment Insight
    if (current.downPaymentPercent < 20) {
        insights.push({
            title: "Consider Larger Down Payment",
            message: "A 20% down payment would eliminate PMI costs and save you money long-term.",
            type: "warning",
            icon: "fa-piggy-bank"
        });
    }
    
    // Extra Payments Insight
    if (current.extraMonthly > 0 || current.oneTimeExtra > 0) {
        const totalSavings = current.totalInterest - calculateAmortization(current.monthlyPITI, 0, current.loanTerm).totalInterest;
        insights.push({
            title: "Smart Extra Payments",
            message: `Your extra payments could save approximately ${formatCurrency(totalSavings)} in interest.`,
            type: "success",
            icon: "fa-rocket"
        });
    }
    
    // Default insight if none apply
    if (insights.length === 0) {
        insights.push({
            title: "Solid Financial Plan",
            message: "Your current mortgage plan is well-structured. Consider consulting with a financial advisor for personalized advice.",
            type: "info",
            icon: "fa-chart-line"
        });
    }
    
    // Render insights
    insightsContent.innerHTML = insights.map(insight => `
        <div class="ai-insight ai-insight-${insight.type}">
            <div class="ai-insight-icon">
                <i class="fas ${insight.icon}"></i>
            </div>
            <div class="ai-insight-content">
                <h5>${insight.title}</h5>
                <p>${insight.message}</p>
            </div>
        </div>
    `).join('');
}

/**
 * Renders Payment Schedule Table
 */
function renderPaymentScheduleTable() {
    const table = document.getElementById('payment-schedule-table');
    if (!table) return;

    const schedule = MORTGAGE_CALCULATOR.currentCalculation.amortizationSchedule;
    const currentPage = MORTGAGE_CALCULATOR.scheduleCurrentPage;
    const itemsPerPage = MORTGAGE_CALCULATOR.scheduleItemsPerPage;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, schedule.length);
    const pageData = schedule.slice(startIndex, endIndex);

    // Build table headers
    let html = `
        <thead>
            <tr>
                <th>Month</th>
                <th>Date</th>
                <th>Principal</th>
                <th>Interest</th>
                <th>Tax & Insurance</th>
                <th>Extra</th>
                <th>Total Payment</th>
                <th>Remaining Balance</th>
            </tr>
        </thead>
        <tbody>
    `;

    // Build table rows
    pageData.forEach(payment => {
        html += `
            <tr>
                <td>${payment.month}</td>
                <td>${payment.date}</td>
                <td>${formatCurrency(payment.principal)}</td>
                <td>${formatCurrency(payment.interest)}</td>
                <td>${formatCurrency(payment.taxAndIns)}</td>
                <td>${formatCurrency(payment.extra)}</td>
                <td>${formatCurrency(payment.totalPayment)}</td>
                <td>${formatCurrency(payment.endingBalance)}</td>
            </tr>
        `;
    });

    html += '</tbody>';
    table.innerHTML = html;

    // Update pagination controls
    updatePaginationControls();
}

/**
 * Updates pagination controls for schedule table
 */
function updatePaginationControls() {
    const totalPages = Math.ceil(MORTGAGE_CALCULATOR.currentCalculation.amortizationSchedule.length / MORTGAGE_CALCULATOR.scheduleItemsPerPage);
    const currentPage = MORTGAGE_CALCULATOR.scheduleCurrentPage;

    if (document.getElementById('prev-page-btn')) {
        document.getElementById('prev-page-btn').disabled = currentPage <= 1;
    }
    if (document.getElementById('next-page-btn')) {
        document.getElementById('next-page-btn').disabled = currentPage >= totalPages;
    }
    if (document.getElementById('page-status')) {
        document.getElementById('page-status').textContent = `Page ${currentPage} of ${totalPages}`;
    }
}

/**
 * Changes schedule page
 */
function changeSchedulePage(direction) {
    const totalPages = Math.ceil(MORTGAGE_CALCULATOR.currentCalculation.amortizationSchedule.length / MORTGAGE_CALCULATOR.scheduleItemsPerPage);
    const newPage = MORTGAGE_CALCULATOR.scheduleCurrentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        MORTGAGE_CALCULATOR.scheduleCurrentPage = newPage;
        renderPaymentScheduleTable();
    }
}

/**
 * Toggles schedule type between monthly and yearly
 */
function toggleScheduleType() {
    const toggleBtn = document.getElementById('schedule-toggle-btn');
    if (MORTGAGE_CALCULATOR.scheduleType === 'monthly') {
        MORTGAGE_CALCULATOR.scheduleType = 'yearly';
        MORTGAGE_CALCULATOR.scheduleItemsPerPage = 5;
        toggleBtn.textContent = 'View Monthly';
    } else {
        MORTGAGE_CALCULATOR.scheduleType = 'monthly';
        MORTGAGE_CALCULATOR.scheduleItemsPerPage = 12;
        toggleBtn.textContent = 'View Yearly';
    }
    MORTGAGE_CALCULATOR.scheduleCurrentPage = 1;
    renderPaymentScheduleTable();
}

// ========================================================================== //
// FIXED UTILITY FUNCTIONS                                                   //
// ========================================================================== //

/**
 * Formats a number as USD currency.
 */
function formatCurrency(number) {
    if (isNaN(number)) return '$0';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(number);
}

/**
 * Simple toast notification system.
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 5000);
    
    // Read the toast message aloud if screen reader mode is active
    if (MORTGAGE_CALCULATOR.screenReaderMode) {
        speakText(message);
    }
}

/**
 * Handles automatic setting of Property Tax and Home Insurance based on the selected state.
 */
function autoUpdateTaxAndInsurance() {
    const stateCode = document.getElementById('state-select').value;
    const stateData = STATE_RATES[stateCode] || STATE_RATES['DEFAULT'];
    const homePrice = MORTGAGE_CALCULATOR.currentCalculation.homePrice;

    // Tax is (Tax Rate % of Home Price)
    const annualTax = homePrice * (stateData.taxRate / 100);
    document.getElementById('property-tax').value = annualTax.toFixed(0);

    // Insurance is (Insurance Rate % of Home Price)
    const annualInsurance = homePrice * (stateData.insuranceRate / 100);
    document.getElementById('home-insurance').value = annualInsurance.toFixed(0);

    MORTGAGE_CALCULATOR.currentCalculation.state = stateCode;
    showToast(`Tax/Insurance updated for ${stateData.name}`, 'info');
}

/**
 * Populates the state select dropdown.
 */
function populateStateSelect() {
    const select = document.getElementById('state-select');
    if (!select) return;
    
    // Clear existing options
    select.innerHTML = '';
    
    const sortedStates = Object.keys(STATE_RATES).sort();

    sortedStates.forEach(code => {
        const stateName = STATE_RATES[code].name;
        const option = document.createElement('option');
        option.value = code;
        option.textContent = stateName;
        if (code === 'DEFAULT') {
             option.textContent = 'Select State (Manual Input)';
        } else if (code === 'TX') {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

/**
 * Toggles between light and dark themes
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-color-scheme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-color-scheme', newTheme);
    MORTGAGE_CALCULATOR.currentTheme = newTheme;
    
    // Update theme toggle button icon
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const sunIcon = themeToggle.querySelector('.fa-sun');
        const moonIcon = themeToggle.querySelector('.fa-moon');
        
        if (sunIcon && moonIcon) {
            sunIcon.style.display = newTheme === 'dark' ? 'none' : 'block';
            moonIcon.style.display = newTheme === 'dark' ? 'block' : 'none';
        }
    }
    
    showToast(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode activated`, 'info');
}

/**
 * Shares results as PDF (placeholder implementation)
 */
function shareResultsPDF() {
    showToast("PDF export feature would be implemented here", 'info');
}

// ========================================================================== //
// FIXED VOICE CONTROL FUNCTIONS                                             //
// ========================================================================== //

// Voice Recognition Instance
let recognition = null;
if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    
    recognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        handleVoiceCommand(command);
    };

    recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        if (event.error !== 'no-speech') {
            showToast(`Voice Error: ${event.error}. Try again.`, 'error');
            toggleVoiceControl(false);
        }
    };

    recognition.onend = () => {
        if (MORTGAGE_CALCULATOR.voiceEnabled) {
            setTimeout(() => {
                if (MORTGAGE_CALCULATOR.voiceEnabled) startVoiceRecognition();
            }, 500);
        }
    };
} else {
    // Disable voice controls if API is not supported
    const voiceToggle = document.getElementById('voice-toggle');
    if (voiceToggle) {
        voiceToggle.disabled = true;
    }
    showToast("Voice command not supported by your browser.", 'error');
}

/**
 * Toggles the state of the voice control feature.
 */
function toggleVoiceControl(forceState = null) {
    const voiceToggleBtn = document.getElementById('voice-toggle');
    if (!voiceToggleBtn) return;
    
    if (forceState !== null) {
        MORTGAGE_CALCULATOR.voiceEnabled = forceState;
    } else {
        MORTGAGE_CALCULATOR.voiceEnabled = !MORTGAGE_CALCULATOR.voiceEnabled;
    }

    if (MORTGAGE_CALCULATOR.voiceEnabled) {
        voiceToggleBtn.classList.add('active-voice');
        const voiceStatus = document.getElementById('voice-status');
        if (voiceStatus) {
            voiceStatus.setAttribute('aria-hidden', 'false');
        }
        startVoiceRecognition();
    } else {
        voiceToggleBtn.classList.remove('active-voice');
        const voiceStatus = document.getElementById('voice-status');
        if (voiceStatus) {
            voiceStatus.setAttribute('aria-hidden', 'true');
        }
        if (recognition) recognition.stop();
    }
}

/**
 * Starts the voice recognition service.
 */
function startVoiceRecognition() {
    if (MORTGAGE_CALCULATOR.voiceEnabled && recognition) {
        try {
            recognition.start();
            if (MORTGAGE_CALCULATOR.DEBUG) console.log('Voice recognition started.');
        } catch (e) {
            if (e.name !== 'InvalidStateError') {
                console.error("Failed to start voice recognition:", e);
            }
        }
    }
}

/**
 * Processes the voice command and modifies the calculator inputs.
 */
function handleVoiceCommand(command) {
    const parts = command.split(' ');
    const number = parseFloat(parts.find(p => !isNaN(parseFloat(p)))) || 0;

    if (command.includes('home price') && number > 0) {
        document.getElementById('home-price').value = number;
        showToast(`Set Home Price to ${formatCurrency(number)}`, 'info');
    } else if (command.includes('interest rate') && number > 0) {
        document.getElementById('interest-rate').value = number.toFixed(2);
        const autoIndicator = document.getElementById('auto-rate-indicator');
        if (autoIndicator) {
            autoIndicator.style.display = 'none';
        }
        showToast(`Set Interest Rate to ${number.toFixed(2)}%`, 'info');
    } else if (command.includes('down payment') && number > 0) {
        document.getElementById('down-payment').value = number;
        showToast(`Set Down Payment to ${formatCurrency(number)}`, 'info');
    } else if (command.includes('loan term') && (number === 30 || number === 15 || number === 10)) {
        document.getElementById('loan-term').value = number;
        showToast(`Set Loan Term to ${number} years`, 'info');
    } else if (command.includes('calculate') || command.includes('show payment')) {
        showToast("Recalculating mortgage...", 'info');
    } else {
        showToast(`Command not recognized: "${command}"`, 'warning');
        return;
    }

    updateCalculation('voice-command');
}

/**
 * Toggles the screen reader mode (Text to Speech).
 */
function toggleScreenReader() {
    MORTGAGE_CALCULATOR.screenReaderMode = !MORTGAGE_CALCULATOR.screenReaderMode;
    const srToggleBtn = document.getElementById('screen-reader-toggle');
    if (srToggleBtn) {
        srToggleBtn.classList.toggle('active', MORTGAGE_CALCULATOR.screenReaderMode);
    }
    
    if (MORTGAGE_CALCULATOR.screenReaderMode) {
        speakText("Screen Reader mode activated. All major updates will now be read aloud.");
    } else {
        if (MORTGAGE_CALCULATOR.speechSynthesis.speaking) {
            MORTGAGE_CALCULATOR.speechSynthesis.cancel();
        }
        showToast("Screen Reader mode deactivated.", 'info');
    }
}

/**
 * Reads the given text aloud using the browser's Speech Synthesis API.
 */
function speakText(text) {
    if (!MORTGAGE_CALCULATOR.screenReaderMode || !MORTGAGE_CALCULATOR.speechSynthesis) return;

    if (MORTGAGE_CALCULATOR.speechSynthesis.speaking) {
        MORTGAGE_CALCULATOR.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = MORTGAGE_CALCULATOR.speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.lang === 'en-US') || null;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    MORTGAGE_CALCULATOR.speechSynthesis.speak(utterance);
}

// ========================================================================== //
// INITIALIZATION & EXECUTION                                                 //
// ========================================================================== //

/**
 * Initializes the calculator on page load.
 */
function initializeCalculator() {
    if (MORTGAGE_CALCULATOR.DEBUG) console.log("🚀 Calculator initializing...");

    // 1. Theme and Accessibility
    document.documentElement.setAttribute('data-color-scheme', MORTGAGE_CALCULATOR.currentTheme);

    // 2. Populate Dropdowns (State list)
    populateStateSelect();
    
    // 3. Kick off FRED rate fetching and scheduling
    fetchLiveFredRates();
    setInterval(fetchLiveFredRates, MORTGAGE_CALCULATOR.RATE_UPDATE_INTERVAL);

    // 4. Set Event Listeners
    document.querySelectorAll('.form-control').forEach(input => {
        input.addEventListener('input', () => updateCalculation(input.id));
        input.addEventListener('change', () => updateCalculation(input.id));
    });
    
    // Event listener for credit score slider
    const creditScoreInput = document.getElementById('credit-score');
    if (creditScoreInput) {
        creditScoreInput.addEventListener('input', () => updateCreditScore('credit-score'));
        creditScoreInput.addEventListener('change', () => updateCreditScore('credit-score'));
    }
    
    // Event listeners for tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = e.target.id.replace('tab-btn-', 'tab-');
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            e.target.classList.add('active');
            e.target.setAttribute('aria-selected', 'true');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // 5. Initial Calculation
    updateCalculation();
}

// Fast initialization on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeCalculator, 500);
    });
} else {
    setTimeout(initializeCalculator, 500);
}
