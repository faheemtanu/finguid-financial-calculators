/* ========================================================================== */
/* WORLD'S FIRST AI MORTGAGE CALCULATOR - PRODUCTION v28.0 */
/* ALL IMPROVEMENTS IMPLEMENTED - FULLY FUNCTIONAL */
/* ========================================================================== */

// ========================================================================== //
// GLOBAL CONFIGURATION & STATE MANAGEMENT
// ========================================================================== //

const MORTGAGE_CALCULATOR = {
    VERSION: '28.0-Production',
    DEBUG: false,

    // FRED API Configuration (2x daily updates)
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    RATE_UPDATE_INTERVAL: 12 * 60 * 60 * 1000, // 12 hours (2x daily)

    // Chart instances
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
        oneTimeExtra: 0,
        extraPaymentMonth: 1,
        closingCostsPercent: 3,
        creditScore: 740,
        state: 'default'
    },

    // Amortization schedule
    amortizationSchedule: [],
    scheduleCurrentPage: 1,
    scheduleItemsPerPage: 12,
    scheduleType: 'monthly',

    // Voice & Screen Reader
    voiceEnabled: false,
    screenReaderMode: false,
    speechRecognition: window.SpeechRecognition || window.webkitSpeechRecognition,
    speechSynthesis: window.speechSynthesis,

    // Theme
    currentTheme: 'dark',

    // Rate tracking
    lastRateUpdate: 0,
    rateUpdateAttempts: 0,
    maxRateUpdateAttempts: 3,

    // Market rates
    marketRates: {
        rate30Year: 6.44,
        rate15Year: 5.89,
        rate10Treasury: 4.25
    }
};

// 50-STATE TAX AND INSURANCE DATABASE
const STATE_RATES = {
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

// Credit Score to Interest Rate Mapping
const CREDIT_SCORE_RATES = {
    '800': { rate: 6.10, description: 'Excellent - Best rates available' },
    '740': { rate: 6.44, description: 'Very Good - Competitive rates' },
    '670': { rate: 6.95, description: 'Good - Standard rates' },
    '620': { rate: 7.55, description: 'Fair - Higher rates' },
    '580': { rate: 8.40, description: 'Poor - Significantly higher rates' },
    '550': { rate: 9.90, description: 'Very Poor - Highest rates' }
};

// ========================================================================== //
// INITIALIZATION
// ========================================================================== //

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 FinGuid AI Mortgage Calculator v' + MORTGAGE_CALCULATOR.VERSION);

    // Initialize all components
    initializeInputListeners();
    initializeThemeToggle();
    initializeTabSystem();
    initializeCollapsibleSections();
    initializeVoiceCommands();
    initializeScreenReader();
    initializeContentToggle();
    initializeCustomLoanTerm();
    initializeLoanTypeDisplay();
    initializeShareButtons();
    initializeLoanCompare();
    initializeCreditScoreRateUpdate();

    // Fetch live rates
    fetchLiveRates();

    // Set up auto-refresh for rates (2x daily)
    setInterval(fetchLiveRates, MORTGAGE_CALCULATOR.RATE_UPDATE_INTERVAL);

    // Initial calculation
    updateCalculation('init');

    // Google Analytics tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', 'calculator_loaded', {
            'event_category': 'engagement',
            'event_label': 'Mortgage Calculator v28'
        });
    }
});

// ========================================================================== //
// CONTENT TOGGLE (Basic/Advanced)
// ========================================================================== //

function initializeContentToggle() {
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const toggleContents = {
        'basic': document.getElementById('basic-content'),
        'advanced': document.getElementById('advanced-content')
    };

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const contentType = this.dataset.content;

            // Update button states
            toggleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Update content visibility
            Object.keys(toggleContents).forEach(key => {
                if (key === contentType) {
                    toggleContents[key].classList.add('active');
                } else {
                    toggleContents[key].classList.remove('active');
                }
            });

            // Track with Google Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'content_toggle', {
                    'event_category': 'engagement',
                    'content_type': contentType
                });
            }
        });
    });
}

// ========================================================================== //
// CUSTOM LOAN TERM ENTRY
// ========================================================================== //

function initializeCustomLoanTerm() {
    const customTermChip = document.getElementById('custom-term-chip');
    const customTermInput = document.getElementById('custom-term-input');
    const termChips = document.querySelectorAll('.chip[data-term]');

    termChips.forEach(chip => {
        chip.addEventListener('click', function() {
            termChips.forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            if (this.dataset.term === 'custom') {
                customTermInput.style.display = 'block';
                customTermInput.focus();
            } else {
                customTermInput.style.display = 'none';
                MORTGAGE_CALCULATOR.currentCalculation.loanTerm = parseInt(this.dataset.term);
                updateCalculation('loan-term');
            }
        });
    });

    customTermInput.addEventListener('input', function() {
        const value = parseInt(this.value);
        if (!isNaN(value) && value > 0 && value <= 50) {
            MORTGAGE_CALCULATOR.currentCalculation.loanTerm = value;
            updateCalculation('custom-term');
        }
    });
}

// ========================================================================== //
// LOAN TYPE DISPLAY IN MONTHLY PAYMENT
// ========================================================================== //

function initializeLoanTypeDisplay() {
    const loanTypeChips = document.querySelectorAll('.chip[data-type]');
    const loanTypeDisplay = document.getElementById('loan-type-display');

    loanTypeChips.forEach(chip => {
        chip.addEventListener('click', function() {
            loanTypeChips.forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            const loanType = this.dataset.type;
            MORTGAGE_CALCULATOR.currentCalculation.loanType = loanType;

            // Update display text
            const displayText = {
                'conventional': 'Conventional Loan',
                'fha': 'FHA Loan',
                'va': 'VA Loan',
                'usda': 'USDA Loan'
            };
            loanTypeDisplay.textContent = displayText[loanType] || 'Conventional Loan';

            updateCalculation('loan-type');
        });
    });
}

// ========================================================================== //
// CREDIT SCORE AFFECTS INTEREST RATE
// ========================================================================== //

function initializeCreditScoreRateUpdate() {
    const creditScoreSelect = document.getElementById('credit-score');
    const interestRateInput = document.getElementById('interest-rate');

    creditScoreSelect.addEventListener('change', function() {
        const creditScore = this.value;
        const rateInfo = CREDIT_SCORE_RATES[creditScore];

        if (rateInfo) {
            interestRateInput.value = rateInfo.rate.toFixed(2);
            MORTGAGE_CALCULATOR.currentCalculation.interestRate = rateInfo.rate;
            MORTGAGE_CALCULATOR.currentCalculation.creditScore = parseInt(creditScore);

            showToast(`Rate updated to ${rateInfo.rate}% based on your credit score`, 'success');
            updateCalculation('credit-score');
        }
    });
}

// ========================================================================== //
// FETCH LIVE RATES FROM FRED (2x daily)
// ========================================================================== //

async function fetchLiveRates() {
    const now = Date.now();

    // Check if we've already updated recently (within last 11 hours)
    if (now - MORTGAGE_CALCULATOR.lastRateUpdate < 11 * 60 * 60 * 1000) {
        console.log('Rates were recently updated, skipping...');
        return;
    }

    try {
        // MORTGAGE30US - 30-Year Fixed Rate Mortgage Average
        const rate30Response = await fetch(
            `${MORTGAGE_CALCULATOR.FRED_BASE_URL}?series_id=MORTGAGE30US&api_key=${MORTGAGE_CALCULATOR.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`
        );

        // MORTGAGE15US - 15-Year Fixed Rate Mortgage Average
        const rate15Response = await fetch(
            `${MORTGAGE_CALCULATOR.FRED_BASE_URL}?series_id=MORTGAGE15US&api_key=${MORTGAGE_CALCULATOR.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`
        );

        // DGS10 - 10-Year Treasury Constant Maturity Rate
        const rate10Response = await fetch(
            `${MORTGAGE_CALCULATOR.FRED_BASE_URL}?series_id=DGS10&api_key=${MORTGAGE_CALCULATOR.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`
        );

        if (rate30Response.ok && rate15Response.ok && rate10Response.ok) {
            const rate30Data = await rate30Response.json();
            const rate15Data = await rate15Response.json();
            const rate10Data = await rate10Response.json();

            if (rate30Data.observations && rate30Data.observations.length > 0 &&
                rate15Data.observations && rate15Data.observations.length > 0 &&
                rate10Data.observations && rate10Data.observations.length > 0) {

                const rate30 = parseFloat(rate30Data.observations[0].value);
                const rate15 = parseFloat(rate15Data.observations[0].value);
                const rate10 = parseFloat(rate10Data.observations[0].value);

                // Update market rates
                MORTGAGE_CALCULATOR.marketRates.rate30Year = rate30;
                MORTGAGE_CALCULATOR.marketRates.rate15Year = rate15;
                MORTGAGE_CALCULATOR.marketRates.rate10Treasury = rate10;

                // Update UI
                document.getElementById('rate-30-year').textContent = rate30.toFixed(2) + '%';
                document.getElementById('rate-15-year').textContent = rate15.toFixed(2) + '%';
                document.getElementById('rate-10-treasury').textContent = rate10.toFixed(2) + '%';

                // Update timestamp
                const updateTime = new Date().toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                document.getElementById('rate-update-time-value').textContent = updateTime;

                // Update status
                document.getElementById('live-rate-status').innerHTML = 
                    `<i class="fas fa-check-circle"></i> Live rates updated`;

                // Update user's interest rate if using 30-year
                if (MORTGAGE_CALCULATOR.currentCalculation.loanTerm === 30) {
                    document.getElementById('interest-rate').value = rate30.toFixed(2);
                    MORTGAGE_CALCULATOR.currentCalculation.interestRate = rate30;
                    updateCalculation('live-rate-update');
                }

                MORTGAGE_CALCULATOR.lastRateUpdate = now;
                MORTGAGE_CALCULATOR.rateUpdateAttempts = 0;

                showToast('Live rates updated from FRED', 'success');

                console.log('✅ Live rates fetched successfully');
            }
        }
    } catch (error) {
        console.error('Error fetching live rates:', error);
        MORTGAGE_CALCULATOR.rateUpdateAttempts++;

        if (MORTGAGE_CALCULATOR.rateUpdateAttempts < MORTGAGE_CALCULATOR.maxRateUpdateAttempts) {
            // Retry after 5 minutes
            setTimeout(fetchLiveRates, 5 * 60 * 1000);
        } else {
            document.getElementById('live-rate-status').innerHTML = 
                `<i class="fas fa-exclamation-triangle"></i> Using default rates`;
            showToast('Unable to fetch live rates, using defaults', 'warning');
        }
    }
}

// ========================================================================== //
// INPUT LISTENERS
// ========================================================================== //

function initializeInputListeners() {
    // Basic inputs
    document.getElementById('home-price').addEventListener('input', () => updateCalculation('home-price'));
    document.getElementById('down-payment').addEventListener('input', () => updateCalculation('down-payment'));
    document.getElementById('down-payment-percent').addEventListener('input', () => updateCalculation('down-payment-percent'));
    document.getElementById('interest-rate').addEventListener('input', () => updateCalculation('interest-rate'));
    document.getElementById('property-tax').addEventListener('input', () => updateCalculation('property-tax'));
    document.getElementById('home-insurance').addEventListener('input', () => updateCalculation('home-insurance'));
    document.getElementById('hoa-fees').addEventListener('input', () => updateCalculation('hoa-fees'));
    document.getElementById('extra-monthly').addEventListener('input', () => updateCalculation('extra-monthly'));
    document.getElementById('one-time-extra').addEventListener('input', () => updateCalculation('one-time-extra'));
    document.getElementById('extra-payment-date').addEventListener('change', () => updateCalculation('extra-payment-date'));
    document.getElementById('closing-costs-percentage').addEventListener('input', () => updateCalculation('closing-costs-percentage'));

    // State selector
    document.getElementById('state-select').addEventListener('change', function() {
        const state = this.value;
        if (state !== 'default' && STATE_RATES[state]) {
            const rates = STATE_RATES[state];
            const homePrice = parseFloat(document.getElementById('home-price').value) || 0;

            const annualTax = homePrice * (rates.taxRate / 100);
            const annualInsurance = homePrice * (rates.insuranceRate / 100);

            document.getElementById('property-tax').value = Math.round(annualTax);
            document.getElementById('home-insurance').value = Math.round(annualInsurance);

            document.getElementById('tax-rate-hint').textContent =
                `Tax Rate: ${rates.taxRate.toFixed(2)}% (${rates.name})`;
            document.getElementById('insurance-rate-hint').textContent =
                `Insurance Rate: ${rates.insuranceRate.toFixed(2)}% (${rates.name})`;

            updateCalculation('state-select');
            showToast(`Rates updated for ${rates.name}`, 'success');
        }
    });

    // Schedule controls
    document.getElementById('schedule-monthly').addEventListener('click', function() {
        MORTGAGE_CALCULATOR.scheduleType = 'monthly';
        this.classList.add('active');
        document.getElementById('schedule-yearly').classList.remove('active');
        MORTGAGE_CALCULATOR.scheduleCurrentPage = 1;
        renderPaymentScheduleTable();
    });

    document.getElementById('schedule-yearly').addEventListener('click', function() {
        MORTGAGE_CALCULATOR.scheduleType = 'yearly';
        this.classList.add('active');
        document.getElementById('schedule-monthly').classList.remove('active');
        MORTGAGE_CALCULATOR.scheduleCurrentPage = 1;
        renderPaymentScheduleTable();
    });

    document.getElementById('schedule-prev').addEventListener('click', () => {
        if (MORTGAGE_CALCULATOR.scheduleCurrentPage > 1) {
            MORTGAGE_CALCULATOR.scheduleCurrentPage--;
            renderPaymentScheduleTable();
        }
    });

    document.getElementById('schedule-next').addEventListener('click', () => {
        const schedule = MORTGAGE_CALCULATOR.scheduleType === 'yearly' ? 
            aggregateYearlySchedule() : MORTGAGE_CALCULATOR.amortizationSchedule;
        const maxPage = Math.ceil(schedule.length / MORTGAGE_CALCULATOR.scheduleItemsPerPage);
        if (MORTGAGE_CALCULATOR.scheduleCurrentPage < maxPage) {
            MORTGAGE_CALCULATOR.scheduleCurrentPage++;
            renderPaymentScheduleTable();
        }
    });

    document.getElementById('export-schedule').addEventListener('click', exportScheduleToCSV);
}

// ========================================================================== //
// CORE CALCULATION LOGIC
// ========================================================================== //

function updateCalculation(sourceId = null) {
    const current = MORTGAGE_CALCULATOR.currentCalculation;

    // Read all inputs
    current.homePrice = parseFloat(document.getElementById('home-price').value) || 0;
    current.downPayment = parseFloat(document.getElementById('down-payment').value) || 0;
    current.downPaymentPercent = parseFloat(document.getElementById('down-payment-percent').value) || 0;
    current.interestRate = parseFloat(document.getElementById('interest-rate').value) || 0;
    current.propertyTax = parseFloat(document.getElementById('property-tax').value) || 0;
    current.homeInsurance = parseFloat(document.getElementById('home-insurance').value) || 0;
    current.hoaFees = parseFloat(document.getElementById('hoa-fees').value) || 0;
    current.extraMonthly = parseFloat(document.getElementById('extra-monthly').value) || 0;
    current.oneTimeExtra = parseFloat(document.getElementById('one-time-extra').value) || 0;
    current.closingCostsPercent = parseFloat(document.getElementById('closing-costs-percentage').value) || 0;

    // Calculate extra payment month from date
    const extraPaymentDate = document.getElementById('extra-payment-date').value;
    if (extraPaymentDate && current.oneTimeExtra > 0) {
        const today = new Date();
        const paymentDate = new Date(extraPaymentDate);
        const monthsDiff = (paymentDate.getFullYear() - today.getFullYear()) * 12 +
                          (paymentDate.getMonth() - today.getMonth());
        current.extraPaymentMonth = Math.max(1, monthsDiff);
    } else {
        current.extraPaymentMonth = 1;
    }

    // Synchronize down payment
    if (sourceId === 'down-payment') {
        current.downPaymentPercent = (current.downPayment / current.homePrice) * 100 || 0;
        document.getElementById('down-payment-percent').value = current.downPaymentPercent.toFixed(2);
    } else if (sourceId === 'down-payment-percent') {
        current.downPayment = current.homePrice * (current.downPaymentPercent / 100);
        document.getElementById('down-payment').value = current.downPayment.toFixed(0);
    }

    // Calculate loan amount
    current.loanAmount = current.homePrice - current.downPayment;

    // Auto-calculate PMI
    if (current.downPaymentPercent < 20 && current.loanType === 'conventional') {
        current.pmi = (current.loanAmount * 0.005) / 12;
    } else if (current.loanType === 'fha' && current.downPaymentPercent < 10) {
        current.pmi = (current.loanAmount * 0.0085) / 12;
    } else {
        current.pmi = 0;
    }
    document.getElementById('pmi').value = current.pmi.toFixed(2);

    // Core mortgage calculation
    const principal = current.loanAmount;
    const rateMonthly = (current.interestRate / 100) / 12;
    const paymentsTotal = current.loanTerm * 12;

    let monthlyPI;
    if (rateMonthly === 0) {
        monthlyPI = principal / paymentsTotal;
    } else {
        monthlyPI = principal * (rateMonthly * Math.pow(1 + rateMonthly, paymentsTotal)) /
                   (Math.pow(1 + rateMonthly, paymentsTotal) - 1);
    }

    if (isNaN(monthlyPI) || monthlyPI === Infinity) monthlyPI = 0;

    // Total monthly payment
    const monthlyTax = current.propertyTax / 12;
    const monthlyInsurance = current.homeInsurance / 12;
    const monthlyPITI = monthlyPI + monthlyTax + monthlyInsurance + current.pmi + current.hoaFees;
    const finalMonthlyPayment = monthlyPITI + current.extraMonthly;

    // Calculate amortization
    const amortizationData = calculateAmortization(monthlyPI, monthlyTax, monthlyInsurance);
    MORTGAGE_CALCULATOR.amortizationSchedule = amortizationData.schedule;

    // Update UI
    document.getElementById('monthly-payment-total').textContent = formatCurrency(finalMonthlyPayment);
    document.getElementById('pi-monthly').textContent = formatCurrency(monthlyPI);
    document.getElementById('tax-monthly').textContent = formatCurrency(monthlyTax);
    document.getElementById('insurance-monthly').textContent = formatCurrency(monthlyInsurance);
    document.getElementById('other-monthly').textContent = formatCurrency(current.pmi + current.hoaFees);
    
    // Update extra monthly payment display
    const extraMonthlyRow = document.getElementById('extra-monthly-row');
    const extraMonthlyDisplay = document.getElementById('extra-monthly-display');
    if (current.extraMonthly > 0) {
        extraMonthlyRow.style.display = 'flex';
        extraMonthlyDisplay.textContent = formatCurrency(current.extraMonthly);
    } else {
        extraMonthlyRow.style.display = 'none';
    }
    
    document.getElementById('total-monthly').textContent = formatCurrency(monthlyPITI);
    document.getElementById('total-cost').textContent = formatCurrency(amortizationData.totalCost);
    document.getElementById('total-interest').textContent = formatCurrency(amortizationData.totalInterest);
    document.getElementById('payoff-date').textContent = amortizationData.payoffDate;
    document.getElementById('closing-costs').textContent = formatCurrency(current.homePrice * (current.closingCostsPercent / 100));

    // Update live numbers for timeline
    updateLiveNumbers();

    // Render visualizations
    renderPaymentComponentsChart(monthlyPI, monthlyTax, monthlyInsurance, current.pmi + current.hoaFees);
    renderMortgageTimelineChart();
    renderAIPoweredInsights();
    renderPaymentScheduleTable();

    // Track with Google Analytics
    if (typeof gtag !== 'undefined' && sourceId !== 'init') {
        gtag('event', 'calculation_update', {
            'event_category': 'calculator',
            'source': sourceId
        });
    }
}

// ========================================================================== //
// LIVE NUMBERS UPDATE FOR TIMELINE
// ========================================================================== //

function updateLiveNumbers() {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    
    // Current balance is the initial loan amount
    document.getElementById('current-balance').textContent = formatCurrency(current.loanAmount);
    
    // For initial state, principal paid is 0
    document.getElementById('principal-paid').textContent = formatCurrency(0);
    
    // For initial state, interest paid is 0
    document.getElementById('interest-paid').textContent = formatCurrency(0);
}

// ========================================================================== //
// AMORTIZATION CALCULATION
// ========================================================================== //

function calculateAmortization(monthlyPI, monthlyTax, monthlyInsurance) {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    let balance = current.loanAmount;
    const rateMonthly = (current.interestRate / 100) / 12;
    const schedule = [];
    let totalInterest = 0;
    let totalPayments = 0;
    const maxPayments = current.loanTerm * 12 + 60;

    for (let month = 1; month <= maxPayments && balance > 0.01; month++) {
        const interestPayment = balance * rateMonthly;
        totalInterest += interestPayment;

        let principalPayment = monthlyPI - interestPayment;
        let extraPayment = current.extraMonthly;

        // Apply one-time extra payment
        if (month === current.extraPaymentMonth && current.oneTimeExtra > 0) {
            extraPayment += current.oneTimeExtra;
        }

        const totalPrincipal = principalPayment + extraPayment;

        // Handle final payment
        if (balance < totalPrincipal) {
            principalPayment = balance;
            extraPayment = 0;
            balance = 0;
        } else {
            balance -= totalPrincipal;
        }

        const taxAndIns = monthlyTax + monthlyInsurance + current.pmi;
        schedule.push({
            month: month,
            year: Math.ceil(month / 12),
            date: getDateString(month),
            totalPayment: monthlyPI + taxAndIns + extraPayment + current.hoaFees,
            principal: principalPayment,
            interest: interestPayment,
            taxAndIns: taxAndIns,
            hoa: current.hoaFees,
            extra: extraPayment,
            balance: balance,
            totalInterest: totalInterest
        });

        totalPayments++;
    }

    const payoffDate = getDateString(totalPayments);
    const totalCost = current.homePrice + totalInterest + (current.homePrice * current.closingCostsPercent / 100);

    return {
        schedule: schedule,
        totalInterest: totalInterest,
        payoffDate: payoffDate,
        totalPayments: totalPayments,
        totalCost: totalCost
    };
}

function getDateString(monthsFromNow) {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsFromNow);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

// ========================================================================== //
// FIXED YEARLY PAYMENT SCHEDULE
// ========================================================================== //

function aggregateYearlySchedule() {
    const monthly = MORTGAGE_CALCULATOR.amortizationSchedule;
    const yearly = [];

    for (let year = 1; year <= Math.ceil(monthly.length / 12); year++) {
        const yearData = monthly.filter(m => m.year === year);
        if (yearData.length === 0) continue;

        const yearAggregate = {
            year: year,
            month: year, // For display purposes
            date: `Year ${year}`,
            totalPayment: yearData.reduce((sum, m) => sum + m.totalPayment, 0),
            principal: yearData.reduce((sum, m) => sum + m.principal, 0),
            interest: yearData.reduce((sum, m) => sum + m.interest, 0),
            taxAndIns: yearData.reduce((sum, m) => sum + m.taxAndIns, 0),
            hoa: yearData.reduce((sum, m) => sum + m.hoa, 0),
            extra: yearData.reduce((sum, m) => sum + m.extra, 0),
            balance: yearData[yearData.length - 1].balance
        };

        yearly.push(yearAggregate);
    }

    return yearly;
}

function renderPaymentScheduleTable() {
    const schedule = MORTGAGE_CALCULATOR.scheduleType === 'yearly' ? 
        aggregateYearlySchedule() : MORTGAGE_CALCULATOR.amortizationSchedule;

    const tbody = document.getElementById('schedule-table-body');
    tbody.innerHTML = '';

    const page = MORTGAGE_CALCULATOR.scheduleCurrentPage;
    const itemsPerPage = MORTGAGE_CALCULATOR.scheduleItemsPerPage;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, schedule.length);

    for (let i = startIndex; i < endIndex; i++) {
        const item = schedule[i];
        const row = document.createElement('tr');

        const periodLabel = MORTGAGE_CALCULATOR.scheduleType === 'yearly' ? 
            `Year ${item.year}` : `Month ${item.month}`;

        row.innerHTML = `
            <td class="month-col">${periodLabel}</td>
            <td>${formatCurrency(item.totalPayment)}</td>
            <td class="principal-col">${formatCurrency(item.principal)}</td>
            <td class="interest-col">${formatCurrency(item.interest)}</td>
            <td>${formatCurrency(item.taxAndIns)}</td>
            <td>${formatCurrency(item.hoa)}</td>
            <td>${formatCurrency(item.extra)}</td>
            <td class="balance-col">${formatCurrency(item.balance)}</td>
        `;

        tbody.appendChild(row);
    }

    // Update pagination
    const maxPage = Math.ceil(schedule.length / itemsPerPage);
    document.getElementById('schedule-page-info').textContent = `Page ${page} of ${maxPage}`;

    document.getElementById('schedule-prev').disabled = page === 1;
    document.getElementById('schedule-next').disabled = page === maxPage;
}

function exportScheduleToCSV() {
    const schedule = MORTGAGE_CALCULATOR.scheduleType === 'yearly' ? 
        aggregateYearlySchedule() : MORTGAGE_CALCULATOR.amortizationSchedule;

    let csv = 'Period,Total Payment,Principal,Interest,Taxes & Insurance,HOA,Extra Payment,Balance\n';

    schedule.forEach(item => {
        const period = MORTGAGE_CALCULATOR.scheduleType === 'yearly' ? 
            `Year ${item.year}` : `Month ${item.month}`;
        csv += `${period},${item.totalPayment.toFixed(2)},${item.principal.toFixed(2)},`;
        csv += `${item.interest.toFixed(2)},${item.taxAndIns.toFixed(2)},${item.hoa.toFixed(2)},`;
        csv += `${item.extra.toFixed(2)},${item.balance.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mortgage-schedule-${MORTGAGE_CALCULATOR.scheduleType}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast('Schedule exported to CSV', 'success');
}

// ========================================================================== //
// CHART RENDERING
// ========================================================================== //

function renderPaymentComponentsChart(pi, tax, insurance, other) {
    const ctx = document.getElementById('paymentComponentsChart').getContext('2d');

    if (MORTGAGE_CALCULATOR.charts.paymentComponents) {
        MORTGAGE_CALCULATOR.charts.paymentComponents.destroy();
    }

    MORTGAGE_CALCULATOR.charts.paymentComponents = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal & Interest', 'Property Tax', 'Home Insurance', 'PMI & HOA'],
            datasets: [{
                data: [pi, tax, insurance, other],
                backgroundColor: [
                    'rgba(20, 184, 166, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(245, 158, 11, 1)'
                ],
                borderWidth: 2,
                borderColor: getComputedStyle(document.body).backgroundColor
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.body).getPropertyValue('color'),
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + formatCurrency(context.parsed);
                        }
                    }
                }
            }
        }
    });
}

function renderMortgageTimelineChart() {
    const schedule = MORTGAGE_CALCULATOR.amortizationSchedule;
    if (!schedule.length) return;

    const ctx = document.getElementById('mortgageTimelineChart').getContext('2d');

    if (MORTGAGE_CALCULATOR.charts.mortgageTimeline) {
        MORTGAGE_CALCULATOR.charts.mortgageTimeline.destroy();
    }

    // Use yearly data
    const yearlyData = schedule.filter((item, index) => 
        index % 12 === 0 || index === schedule.length - 1
    );

    // Calculate cumulative values
    const principalPaid = [];
    const interestPaid = [];

    yearlyData.forEach(item => {
        const cumPrincipal = MORTGAGE_CALCULATOR.currentCalculation.loanAmount - item.balance;
        const cumInterest = item.totalInterest;
        principalPaid.push(cumPrincipal);
        interestPaid.push(cumInterest);
    });

    MORTGAGE_CALCULATOR.charts.mortgageTimeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: yearlyData.map(item => `Year ${item.year}`),
            datasets: [
                {
                    label: 'Remaining Balance',
                    data: yearlyData.map(item => item.balance),
                    borderColor: 'rgba(20, 184, 166, 1)',
                    backgroundColor: 'rgba(20, 184, 166, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Principal Paid',
                    data: principalPaid,
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: false,
                    tension: 0.3
                },
                {
                    label: 'Interest Paid',
                    data: interestPaid,
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: false,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.body).getPropertyValue('color'),
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: getComputedStyle(document.body).getPropertyValue('color') },
                    grid: { color: 'rgba(128, 128, 128, 0.1)' }
                },
                y: {
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('color'),
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'k';
                        }
                    },
                    grid: { color: 'rgba(128, 128, 128, 0.1)' }
                }
            }
        }
    });
}

// ========================================================================== //
// ENHANCED AI INSIGHTS (Dynamic & Comprehensive)
// ========================================================================== //

function renderAIPoweredInsights() {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const container = document.getElementById('ai-insights-container');
    container.innerHTML = '';

    const insights = [];

    // 1. Credit Score Analysis
    if (current.creditScore >= 740) {
        insights.push({
            icon: '✅',
            title: 'Excellent Credit Position',
            text: `Your credit score of **${current.creditScore}** qualifies you for the best mortgage rates. You're in a strong position to negotiate favorable terms with lenders. Consider shopping around to compare offers from multiple lenders.`
        });
    } else if (current.creditScore >= 670) {
        const potentialSavings = calculateRateSavings(current.creditScore, 740);
        insights.push({
            icon: '⚠️',
            title: 'Good Credit - Room for Improvement',
            text: `Your credit score of **${current.creditScore}** is good, but improving it to 740+ could reduce your interest rate by 0.25-0.5%, saving you approximately **${formatCurrency(potentialSavings)}** over the loan term.`
        });
    } else {
        insights.push({
            icon: '🔴',
            title: 'Credit Score Alert',
            text: `With a credit score of **${current.creditScore}**, you may face significantly higher interest rates. Consider improving your credit score before applying. Simple steps: pay bills on time, reduce credit utilization below 30%, and avoid new credit inquiries.`
        });
    }

    // 2. Down Payment Strategy
    const dpPercent = current.downPaymentPercent;
    if (dpPercent >= 20) {
        insights.push({
            icon: '💰',
            title: 'Optimal Down Payment',
            text: `Your **${dpPercent.toFixed(1)}%** down payment eliminates PMI, saving you **${formatCurrency(current.pmi * 12)}/year**. This reduces your total loan cost significantly and demonstrates strong financial position to lenders.`
        });
    } else {
        const pmiAnnual = current.pmi * 12;
        const targetEquity = current.homePrice * 0.20;
        const currentEquity = current.downPayment;
        const equityNeeded = targetEquity - currentEquity;
        const monthsToRemovePMI = current.extraMonthly > 0 ? 
            Math.ceil(equityNeeded / current.extraMonthly) : 
            Math.ceil((current.loanAmount * 0.2) / (current.loanAmount / (current.loanTerm * 12)));

        insights.push({
            icon: '📊',
            title: 'PMI Impact Analysis',
            text: `With **${dpPercent.toFixed(1)}%** down, you'll pay **${formatCurrency(pmiAnnual)}/year** in PMI (**${formatCurrency(pmiAnnual/12)}/month**). Once you reach 20% equity (approximately ${monthsToRemovePMI} months), PMI will be automatically removed. ${current.extraMonthly > 0 ? 'Your extra payments will help you reach this faster!' : 'Consider making extra payments to eliminate PMI sooner.'}`
        });
    }

    // 3. Extra Payment Impact - Enhanced Accelerated Payoff Strategy
    if (current.extraMonthly > 0 || current.oneTimeExtra > 0) {
        const schedule = MORTGAGE_CALCULATOR.amortizationSchedule;
        const lastPayment = schedule[schedule.length - 1];
        const originalTerm = current.loanTerm * 12;
        const actualTerm = schedule.length;
        const monthsSaved = originalTerm - actualTerm;
        const yearsSaved = Math.floor(monthsSaved / 12);
        const remainingMonths = monthsSaved % 12;

        // Calculate interest saved
        const originalInterest = calculateOriginalInterest();
        const interestSaved = originalInterest - lastPayment.totalInterest;

        let strategyText = `Your accelerated payoff strategy is **powerful**! `;

        if (current.extraMonthly > 0) {
            strategyText += `By paying an extra **${formatCurrency(current.extraMonthly)}/month**, you'll `;
        }
        if (current.oneTimeExtra > 0) {
            strategyText += `${current.extraMonthly > 0 ? 'and making a' : 'Making a'} one-time payment of **${formatCurrency(current.oneTimeExtra)}**, you'll `;
        }

        strategyText += `save **${formatCurrency(interestSaved)}** in interest and pay off your mortgage **${yearsSaved} years ${remainingMonths} months** early! This is equivalent to earning a **${current.interestRate.toFixed(2)}%** guaranteed return on those extra payments.`;

        insights.push({
            icon: '🚀',
            title: 'Accelerated Payoff Strategy',
            text: strategyText
        });

        // Add specific milestone insights
        const breakevenYear = Math.ceil(actualTerm / 12);
        insights.push({
            icon: '🎯',
            title: 'Payoff Milestone',
            text: `With your current strategy, you'll be mortgage-free by **${lastPayment.date}** (year ${breakevenYear}). The last ${yearsSaved} years of payments would have gone mostly to interest - you're essentially getting those years back!`
        });
    } else {
        // Suggest extra payment strategy
        const testExtra = 200;
        const testSavings = calculateExtraPaymentImpact(testExtra);

        insights.push({
            icon: '💡',
            title: 'Extra Payment Opportunity',
            text: `Adding just **${formatCurrency(testExtra)}/month** extra could save you approximately **${formatCurrency(testSavings.interestSaved)}** in interest and shorten your loan by **${testSavings.monthsSaved}** months (${Math.floor(testSavings.monthsSaved/12)} years). Try it in the calculator to see your personalized results!`
        });
    }

    // 4. Interest Rate Context
    const avgRate = MORTGAGE_CALCULATOR.marketRates.rate30Year;
    const rateDiff = current.interestRate - avgRate;

    if (rateDiff < -0.25) {
        insights.push({
            icon: '🎯',
            title: 'Below-Market Rate',
            text: `Your rate of **${current.interestRate}%** is **${Math.abs(rateDiff).toFixed(2)}%** below the current 30-year average of ${avgRate}%. This is an excellent rate—lock it in if possible! This could save you tens of thousands over the life of the loan.`
        });
    } else if (rateDiff > 0.5) {
        const potentialSavings = calculateRateSavingsAmount(current.interestRate, avgRate);
        insights.push({
            icon: '⚡',
            title: 'Rate Optimization Opportunity',
            text: `Your rate of **${current.interestRate}%** is **${rateDiff.toFixed(2)}%** above the market average (${avgRate}%). Shopping around with multiple lenders could save you approximately **${formatCurrency(potentialSavings)}** over the loan term. Get at least 3 rate quotes before committing.`
        });
    }

    // 5. Loan Term Analysis
    if (current.loanTerm === 30) {
        const rate15 = MORTGAGE_CALCULATOR.marketRates.rate15Year;
        const savings15Year = calculate15YearSavings();

        insights.push({
            icon: '🔄',
            title: '15-Year Loan Alternative',
            text: `A 15-year loan (typically **${rate15}%** rate) would increase monthly payments by approximately **${formatCurrency(savings15Year.paymentIncrease)}**, but save you **${formatCurrency(savings15Year.interestSaved)}** in interest! Your loan would be paid off **15 years** earlier. Use the Compare Scenarios button below to see side-by-side comparison.`
        });
    }

    // 6. Monthly Payment Affordability
    const monthlyPayment = current.loanAmount * ((current.interestRate/100)/12) * 
        Math.pow(1 + (current.interestRate/100)/12, current.loanTerm*12) /
        (Math.pow(1 + (current.interestRate/100)/12, current.loanTerm*12) - 1) +
        (current.propertyTax / 12) + (current.homeInsurance / 12) + current.pmi + current.hoaFees;

    // Assuming 28% rule (payment should be < 28% of gross monthly income)
    const impliedIncome = monthlyPayment / 0.28;
    const annualIncome = impliedIncome * 12;

    insights.push({
        icon: '💵',
        title: 'Income Requirement',
        text: `Based on the 28% rule, this payment requires a gross annual income of approximately **${formatCurrency(annualIncome)}** (${formatCurrency(impliedIncome)}/month). Lenders typically want your housing payment to be less than 28% of gross income and total debt payments below 36%. Make sure this aligns with your budget.`
        });

    // 7. Total Cost Analysis
    const totalCost = current.homePrice + MORTGAGE_CALCULATOR.amortizationSchedule[MORTGAGE_CALCULATOR.amortizationSchedule.length - 1].totalInterest;
    const interestPercent = (MORTGAGE_CALCULATOR.amortizationSchedule[MORTGAGE_CALCULATOR.amortizationSchedule.length - 1].totalInterest / current.homePrice) * 100;

    insights.push({
        icon: '💸',
        title: 'Total Cost of Homeownership',
        text: `Over the life of this loan, you'll pay **${formatCurrency(totalCost)}** total (home + interest). That's **${interestPercent.toFixed(0)}%** more than the home's purchase price. This is why strategies like extra payments and lower interest rates have such dramatic impact on your wealth.`
    });

    // 8. Loan Type Specific Advice
    if (current.loanType === 'fha') {
        insights.push({
            icon: '🏦',
            title: 'FHA Loan Consideration',
            text: `FHA loans are great for lower down payments (as low as 3.5%), but remember that FHA MIP (mortgage insurance) typically lasts for the life of the loan if you put down less than 10%. Consider refinancing to conventional once you reach 20% equity to eliminate insurance premiums.`
        });
    } else if (current.loanType === 'va') {
        insights.push({
            icon: '🇺🇸',
            title: 'VA Loan Benefits',
            text: `VA loans offer incredible benefits: no down payment required, no PMI, and typically lower interest rates. Thank you for your service! These benefits can save you tens of thousands compared to conventional loans. Make sure you're getting the best VA rate available.`
        });
    }

    // 9. Property Tax Consideration
    const annualTaxPercent = (current.propertyTax / current.homePrice) * 100;
    if (annualTaxPercent > 1.5) {
        insights.push({
            icon: '🏛️',
            title: 'High Property Tax Area',
            text: `Your property tax rate of **${annualTaxPercent.toFixed(2)}%** is above the national average. Property taxes can increase over time, so budget accordingly. Research your area's tax history and any upcoming assessments that might affect your payments.`
        });
    }

    // Render all insights
    insights.forEach(insight => {
        const insightDiv = document.createElement('div');
        insightDiv.className = 'ai-insight';
        insightDiv.innerHTML = `
            <div class="ai-insight-title">
                ${insight.icon} ${insight.title}
            </div>
            <p>${insight.text}</p>
        `;
        container.appendChild(insightDiv);
    });
}

// Helper functions for AI insights calculations
function calculateOriginalInterest() {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const rateMonthly = (current.interestRate / 100) / 12;
    const paymentsTotal = current.loanTerm * 12;

    const monthlyPI = current.loanAmount * (rateMonthly * Math.pow(1 + rateMonthly, paymentsTotal)) /
                     (Math.pow(1 + rateMonthly, paymentsTotal) - 1);

    return (monthlyPI * paymentsTotal) - current.loanAmount;
}

function calculateRateSavings(currentScore, targetScore) {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const currentRate = CREDIT_SCORE_RATES[currentScore.toString()]?.rate || current.interestRate;
    const targetRate = CREDIT_SCORE_RATES[targetScore.toString()]?.rate || currentRate - 0.5;

    return calculateRateSavingsAmount(currentRate, targetRate);
}

function calculateRateSavingsAmount(currentRate, newRate) {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const paymentsTotal = current.loanTerm * 12;

    const currentMonthly = current.loanAmount * ((currentRate/100)/12) * 
        Math.pow(1 + (currentRate/100)/12, paymentsTotal) /
        (Math.pow(1 + (currentRate/100)/12, paymentsTotal) - 1);

    const newMonthly = current.loanAmount * ((newRate/100)/12) * 
        Math.pow(1 + (newRate/100)/12, paymentsTotal) /
        (Math.pow(1 + (newRate/100)/12, paymentsTotal) - 1);

    const currentTotalInterest = (currentMonthly * paymentsTotal) - current.loanAmount;
    const newTotalInterest = (newMonthly * paymentsTotal) - current.loanAmount;

    return currentTotalInterest - newTotalInterest;
}

function calculate15YearSavings() {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const rate15 = MORTGAGE_CALCULATOR.marketRates.rate15Year;

    const currentMonthly = current.loanAmount * ((current.interestRate/100)/12) * 
        Math.pow(1 + (current.interestRate/100)/12, 30*12) /
        (Math.pow(1 + (current.interestRate/100)/12, 30*12) - 1);

    const monthly15 = current.loanAmount * ((rate15/100)/12) * 
        Math.pow(1 + (rate15/100)/12, 15*12) /
        (Math.pow(1 + (rate15/100)/12, 15*12) - 1);

    const currentTotalInterest = (currentMonthly * 30*12) - current.loanAmount;
    const totalInterest15 = (monthly15 * 15*12) - current.loanAmount;

    return {
        paymentIncrease: monthly15 - currentMonthly,
        interestSaved: currentTotalInterest - totalInterest15
    };
}

function calculateExtraPaymentImpact(extraAmount) {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const originalSchedule = calculateAmortization(
        current.loanAmount * ((current.interestRate/100)/12) * 
        Math.pow(1 + (current.interestRate/100)/12, current.loanTerm*12) /
        (Math.pow(1 + (current.interestRate/100)/12, current.loanTerm*12) - 1),
        current.propertyTax / 12,
        current.homeInsurance / 12
    );

    current.extraMonthly = extraAmount;
    const newSchedule = calculateAmortization(
        current.loanAmount * ((current.interestRate/100)/12) * 
        Math.pow(1 + (current.interestRate/100)/12, current.loanTerm*12) /
        (Math.pow(1 + (current.interestRate/100)/12, current.loanTerm*12) - 1),
        current.propertyTax / 12,
        current.homeInsurance / 12
    );

    current.extraMonthly = 0;

    return {
        interestSaved: originalSchedule.totalInterest - newSchedule.totalInterest,
        monthsSaved: originalSchedule.schedule.length - newSchedule.schedule.length
    };
}

// ========================================================================== //
// SHARE RESULTS & PDF DOWNLOAD
// ========================================================================== //

function initializeShareButtons() {
    document.getElementById('share-btn').addEventListener('click', function() {
        const shareOptions = document.getElementById('social-share-options');
        shareOptions.style.display = shareOptions.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('download-pdf-btn').addEventListener('click', generatePDF);
    document.getElementById('print-btn').addEventListener('click', () => window.print());

    // Social share buttons
    document.querySelectorAll('.btn-social').forEach(btn => {
        btn.addEventListener('click', function() {
            const platform = this.dataset.platform;
            shareResults(platform);
        });
    });
}

function generatePDF() {
    try {
        // Check if jsPDF is available
        if (typeof jspdf === 'undefined') {
            showToast('PDF generation library not loaded. Please try again.', 'error');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add header
        doc.setFillColor(20, 184, 166);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Mortgage Calculator Results', 105, 15, { align: 'center' });
        doc.setFontSize(10);
        doc.text('Generated by FinGuid AI Mortgage Calculator', 105, 22, { align: 'center' });

        // Add date
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 10, 40);

        // Add loan details
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Loan Details', 10, 55);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const details = [
            `Home Price: ${formatCurrency(MORTGAGE_CALCULATOR.currentCalculation.homePrice)}`,
            `Down Payment: ${formatCurrency(MORTGAGE_CALCULATOR.currentCalculation.downPayment)} (${MORTGAGE_CALCULATOR.currentCalculation.downPaymentPercent.toFixed(1)}%)`,
            `Loan Amount: ${formatCurrency(MORTGAGE_CALCULATOR.currentCalculation.loanAmount)}`,
            `Interest Rate: ${MORTGAGE_CALCULATOR.currentCalculation.interestRate.toFixed(2)}%`,
            `Loan Term: ${MORTGAGE_CALCULATOR.currentCalculation.loanTerm} years`,
            `Loan Type: ${MORTGAGE_CALCULATOR.currentCalculation.loanType}`
        ];

        details.forEach((detail, index) => {
            doc.text(detail, 10, 65 + (index * 6));
        });

        // Add payment summary
        doc.setFont('helvetica', 'bold');
        doc.text('Payment Summary', 10, 105);
        doc.setFont('helvetica', 'normal');

        const monthlyPayment = document.getElementById('monthly-payment-total').textContent;
        const payments = [
            `Monthly Payment: ${monthlyPayment}`,
            `Principal & Interest: ${document.getElementById('pi-monthly').textContent}`,
            `Property Tax: ${document.getElementById('tax-monthly').textContent}`,
            `Home Insurance: ${document.getElementById('insurance-monthly').textContent}`,
            `PMI & HOA: ${document.getElementById('other-monthly').textContent}`
        ];

        payments.forEach((payment, index) => {
            doc.text(payment, 10, 115 + (index * 6));
        });

        // Add total costs
        doc.setFont('helvetica', 'bold');
        doc.text('Total Costs', 10, 150);
        doc.setFont('helvetica', 'normal');

        const costs = [
            `Total Loan Cost: ${document.getElementById('total-cost').textContent}`,
            `Total Interest Paid: ${document.getElementById('total-interest').textContent}`,
            `Payoff Date: ${document.getElementById('payoff-date').textContent}`,
            `Closing Costs: ${document.getElementById('closing-costs').textContent}`
        ];

        costs.forEach((cost, index) => {
            doc.text(cost, 10, 160 + (index * 6));
        });

        // Add disclaimer
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('This is an estimate for educational purposes. Actual terms may vary. Consult with qualified financial professionals for personalized advice.', 10, 280, { maxWidth: 190 });

        // Save the PDF
        doc.save('mortgage-calculator-results.pdf');
        showToast('PDF downloaded successfully', 'success');

    } catch (error) {
        console.error('PDF generation error:', error);
        showToast('Error generating PDF. Please try again.', 'error');
    }
}

function shareResults(platform) {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const monthlyPayment = document.getElementById('monthly-payment-total').textContent;
    const totalInterest = document.getElementById('total-interest').textContent;

    const text = `My mortgage payment would be ${monthlyPayment}/month with ${totalInterest} total interest. Calculate yours with FinGuid AI Mortgage Calculator!`;
    const url = window.location.href;

    let shareUrl;

    switch (platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
            break;
        case 'linkedin':
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
            break;
        case 'email':
            shareUrl = `mailto:?subject=Mortgage Calculator Results&body=${encodeURIComponent(text + '\n\n' + url)}`;
            break;
        default:
            return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
}

// ========================================================================== //
// LOAN COMPARISON MODAL
// ========================================================================== //

function initializeLoanCompare() {
    const compareBtn = document.getElementById('compare-scenarios-btn');
    const modal = document.getElementById('compare-modal');
    const closeBtn = document.getElementById('compare-modal-close');

    compareBtn.addEventListener('click', () => {
        showComparisonModal();
        modal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function showComparisonModal() {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const modalBody = document.getElementById('compare-modal-body');
    
    // Create comparison scenarios
    const scenarios = [
        {
            name: 'Current Scenario',
            interestRate: current.interestRate,
            loanTerm: current.loanTerm,
            downPaymentPercent: current.downPaymentPercent,
            extraMonthly: current.extraMonthly
        },
        {
            name: '15-Year Loan',
            interestRate: MORTGAGE_CALCULATOR.marketRates.rate15Year,
            loanTerm: 15,
            downPaymentPercent: current.downPaymentPercent,
            extraMonthly: 0
        },
        {
            name: 'Lower Rate (-0.5%)',
            interestRate: current.interestRate - 0.5,
            loanTerm: current.loanTerm,
            downPaymentPercent: current.downPaymentPercent,
            extraMonthly: 0
        },
        {
            name: 'Higher Down Payment (25%)',
            interestRate: current.interestRate,
            loanTerm: current.loanTerm,
            downPaymentPercent: 25,
            extraMonthly: 0
        },
        {
            name: 'Extra $200/Month',
            interestRate: current.interestRate,
            loanTerm: current.loanTerm,
            downPaymentPercent: current.downPaymentPercent,
            extraMonthly: 200
        }
    ];

    let html = '<div class="comparison-grid">';
    
    scenarios.forEach(scenario => {
        const result = calculateScenario(scenario);
        html += `
            <div class="comparison-card">
                <h3>${scenario.name}</h3>
                <div class="comparison-details">
                    <div class="comparison-item">
                        <span>Monthly Payment:</span>
                        <strong>${formatCurrency(result.monthlyPayment)}</strong>
                    </div>
                    <div class="comparison-item">
                        <span>Total Interest:</span>
                        <strong>${formatCurrency(result.totalInterest)}</strong>
                    </div>
                    <div class="comparison-item">
                        <span>Payoff Date:</span>
                        <strong>${result.payoffDate}</strong>
                    </div>
                    <div class="comparison-item">
                        <span>Interest Saved:</span>
                        <strong style="color: ${result.interestSaved >= 0 ? 'var(--color-success)' : 'var(--color-error)'}">
                            ${result.interestSaved >= 0 ? '+' : ''}${formatCurrency(result.interestSaved)}
                        </strong>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    modalBody.innerHTML = html;
}

function calculateScenario(scenario) {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    
    // Calculate loan amount for this scenario
    const downPayment = current.homePrice * (scenario.downPaymentPercent / 100);
    const loanAmount = current.homePrice - downPayment;
    
    // Calculate monthly payment
    const rateMonthly = (scenario.interestRate / 100) / 12;
    const paymentsTotal = scenario.loanTerm * 12;
    
    let monthlyPI;
    if (rateMonthly === 0) {
        monthlyPI = loanAmount / paymentsTotal;
    } else {
        monthlyPI = loanAmount * (rateMonthly * Math.pow(1 + rateMonthly, paymentsTotal)) /
                   (Math.pow(1 + rateMonthly, paymentsTotal) - 1);
    }
    
    // Add extra payment
    const totalMonthly = monthlyPI + (current.propertyTax / 12) + 
                        (current.homeInsurance / 12) + scenario.extraMonthly;
    
    // Calculate total interest
    const totalInterest = (monthlyPI * paymentsTotal) - loanAmount;
    
    // Calculate payoff date
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + paymentsTotal);
    const payoffString = payoffDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    
    // Calculate interest saved compared to current scenario
    const currentTotalInterest = (MORTGAGE_CALCULATOR.amortizationSchedule[MORTGAGE_CALCULATOR.amortizationSchedule.length - 1]?.totalInterest || 0);
    const interestSaved = currentTotalInterest - totalInterest;
    
    return {
        monthlyPayment: totalMonthly,
        totalInterest: totalInterest,
        payoffDate: payoffString,
        interestSaved: interestSaved
    };
}

// ========================================================================== //
// VOICE COMMANDS & SCREEN READER
// ========================================================================== //

function initializeVoiceCommands() {
    const voiceBtn = document.querySelector('.voice-toggle');
    const voiceStatus = document.getElementById('voice-status');

    if (!MORTGAGE_CALCULATOR.speechRecognition) {
        voiceBtn.style.display = 'none';
        return;
    }

    const recognition = new MORTGAGE_CALCULATOR.speechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    voiceBtn.addEventListener('click', function() {
        if (MORTGAGE_CALCULATOR.voiceEnabled) {
            recognition.stop();
            MORTGAGE_CALCULATOR.voiceEnabled = false;
            voiceStatus.classList.remove('active');
            showToast('Voice commands disabled', 'info');
        } else {
            recognition.start();
            MORTGAGE_CALCULATOR.voiceEnabled = true;
            voiceStatus.classList.add('active');
            showToast('Listening for voice commands...', 'info');
        }
    });

    recognition.onresult = function(event) {
        const command = event.results[0][0].transcript.toLowerCase();
        document.getElementById('voice-status-text').textContent = `Heard: "${command}"`;
        processVoiceCommand(command);
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        showToast('Voice recognition error: ' + event.error, 'error');
        MORTGAGE_CALCULATOR.voiceEnabled = false;
        voiceStatus.classList.remove('active');
    };

    recognition.onend = function() {
        if (MORTGAGE_CALCULATOR.voiceEnabled) {
            recognition.start();
        }
    };

    // Close voice status
    document.getElementById('voice-status-close').addEventListener('click', function() {
        recognition.stop();
        MORTGAGE_CALCULATOR.voiceEnabled = false;
        voiceStatus.classList.remove('active');
    });
}

function processVoiceCommand(command) {
    const current = MORTGAGE_CALCULATOR.currentCalculation;

    if (command.includes('home price') || command.includes('price')) {
        const match = command.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        if (match) {
            const price = parseFloat(match[1].replace(/,/g, ''));
            document.getElementById('home-price').value = price;
            updateCalculation('voice-home-price');
            speak(`Home price set to ${formatCurrency(price)}`);
        }
    } else if (command.includes('interest rate') || command.includes('rate')) {
        const match = command.match(/(\d+(?:\.\d{1,2})?)%/);
        if (match) {
            const rate = parseFloat(match[1]);
            document.getElementById('interest-rate').value = rate;
            updateCalculation('voice-interest-rate');
            speak(`Interest rate set to ${rate} percent`);
        }
    } else if (command.includes('down payment')) {
        const match = command.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        if (match) {
            const dp = parseFloat(match[1].replace(/,/g, ''));
            document.getElementById('down-payment').value = dp;
            updateCalculation('voice-down-payment');
            speak(`Down payment set to ${formatCurrency(dp)}`);
        }
    } else if (command.includes('loan term') || command.includes('term')) {
        if (command.includes('15') || command.includes('fifteen')) {
            document.querySelector('.chip[data-term="15"]').click();
            speak('Loan term set to 15 years');
        } else if (command.includes('30') || command.includes('thirty')) {
            document.querySelector('.chip[data-term="30"]').click();
            speak('Loan term set to 30 years');
        }
    } else if (command.includes('monthly payment') || command.includes('payment')) {
        const monthlyPayment = document.getElementById('monthly-payment-total').textContent;
        speak(`Your estimated monthly payment is ${monthlyPayment}`);
    } else if (command.includes('total interest')) {
        const totalInterest = document.getElementById('total-interest').textContent;
        speak(`Total interest paid will be ${totalInterest}`);
    } else if (command.includes('payoff date')) {
        const payoffDate = document.getElementById('payoff-date').textContent;
        speak(`Your loan will be paid off in ${payoffDate}`);
    } else if (command.includes('help') || command.includes('commands')) {
        speak('Available commands: set home price, set interest rate, set down payment, set loan term, ask for monthly payment, total interest, or payoff date');
    } else {
        speak('Command not recognized. Say "help" for available commands.');
    }
}

function initializeScreenReader() {
    const screenReaderBtn = document.querySelector('.screen-reader-toggle');
    
    screenReaderBtn.addEventListener('click', function() {
        MORTGAGE_CALCULATOR.screenReaderMode = !MORTGAGE_CALCULATOR.screenReaderMode;
        
        if (MORTGAGE_CALCULATOR.screenReaderMode) {
            document.body.classList.add('screen-reader-mode');
            speak('Screen reader mode enabled');
            showToast('Screen reader mode enabled', 'success');
        } else {
            document.body.classList.remove('screen-reader-mode');
            speak('Screen reader mode disabled');
            showToast('Screen reader mode disabled', 'info');
        }
    });
}

function speak(text) {
    if (!MORTGAGE_CALCULATOR.speechSynthesis) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    MORTGAGE_CALCULATOR.speechSynthesis.speak(utterance);
}

// ========================================================================== //
// THEME MANAGEMENT
// ========================================================================== //

function initializeThemeToggle() {
    const themeBtn = document.querySelector('.theme-toggle');
    const savedTheme = localStorage.getItem('calculator-theme') || 'dark';
    
    setTheme(savedTheme);
    
    themeBtn.addEventListener('click', function() {
        const newTheme = MORTGAGE_CALCULATOR.currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('calculator-theme', newTheme);
    });
}

function setTheme(theme) {
    MORTGAGE_CALCULATOR.currentTheme = theme;
    document.documentElement.setAttribute('data-color-scheme', theme);
    
    // Update charts if they exist
    Object.values(MORTGAGE_CALCULATOR.charts).forEach(chart => {
        if (chart) {
            chart.update('none');
        }
    });
}

// ========================================================================== //
// TAB SYSTEM
// ========================================================================== //

function initializeTabSystem() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;

            // Update button states
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Update content visibility
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `tab-${tabId}`) {
                    content.classList.add('active');
                }
            });

            // Special handling for timeline tab
            if (tabId === 'timeline') {
                setTimeout(() => {
                    if (MORTGAGE_CALCULATOR.charts.mortgageTimeline) {
                        MORTGAGE_CALCULATOR.charts.mortgageTimeline.resize();
                    }
                }, 100);
            }

            // Track with Google Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'tab_switch', {
                    'event_category': 'engagement',
                    'tab_name': tabId
                });
            }
        });
    });
}

// ========================================================================== //
// COLLAPSIBLE SECTIONS
// ========================================================================== //

function initializeCollapsibleSections() {
    const collapsibleSections = document.querySelectorAll('.collapsible-section');

    collapsibleSections.forEach(section => {
        const heading = section.querySelector('.section-sub-heading');
        
        heading.addEventListener('click', function() {
            section.classList.toggle('collapsed');
        });
    });
}

// ========================================================================== //
// UTILITY FUNCTIONS
// ========================================================================== //

function formatCurrency(amount) {
    if (isNaN(amount)) return '$0';
    
    // Handle very large numbers
    if (amount >= 1000000) {
        return '$' + (amount / 1000000).toFixed(1) + 'M';
    } else if (amount >= 1000) {
        return '$' + (amount / 1000).toFixed(0) + 'k';
    } else {
        return '$' + amount.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// ========================================================================== //
// ERROR HANDLING & DEBUGGING
// ========================================================================== //

window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    
    if (MORTGAGE_CALCULATOR.DEBUG) {
        showToast('An error occurred. Check console for details.', 'error');
    }
});

// Export for global access if needed
window.MORTGAGE_CALCULATOR = MORTGAGE_CALCULATOR;

console.log('🎯 FinGuid AI Mortgage Calculator v' + MORTGAGE_CALCULATOR.VERSION + ' initialized successfully');
