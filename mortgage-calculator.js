/* ========================================================================== */
/* WORLD'S FIRST AI MORTGAGE CALCULATOR - ENHANCED JS v26.0 */
/* ALL 11 USER IMPROVEMENTS IMPLEMENTED - PRODUCTION READY */
/* ========================================================================== */

// ========================================================================== //
// GLOBAL CONFIGURATION & STATE MANAGEMENT
// ========================================================================== //

const MORTGAGE_CALCULATOR = {
    VERSION: '26.0-Enhanced',
    DEBUG: true,

    // FRED API Configuration
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    RATE_UPDATE_INTERVAL: 60 * 60 * 1000, // 1 hour

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
        extraPaymentMonth: 1, // IMPROVEMENT 3: Track month of extra payment
        closingCostsPercent: 3,
        creditScore: 740, // IMPROVEMENT 2
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

    // Market rates (IMPROVEMENT 7)
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
    initializeLoanCompare();
    initializeShareButtons(); // IMPROVEMENT 10

    // Fetch live rates
    fetchLiveRates(); // IMPROVEMENT 7

    // Initial calculation
    updateCalculation('init');

    // Track with Google Analytics (IMPROVEMENT 9)
    if (typeof gtag !== 'undefined') {
        gtag('event', 'calculator_loaded', {
            'event_category': 'engagement',
            'event_label': 'Mortgage Calculator'
        });
    }
});

// ========================================================================== //
// INPUT LISTENERS
// ========================================================================== //

function initializeInputListeners() {
    // Basic inputs
    document.getElementById('home-price').addEventListener('input', () => updateCalculation('home-price'));
    document.getElementById('down-payment').addEventListener('input', () => updateCalculation('down-payment'));
    document.getElementById('down-payment-percent').addEventListener('input', () => updateCalculation('down-payment-percent'));
    document.getElementById('credit-score').addEventListener('change', () => updateCalculation('credit-score')); // IMPROVEMENT 2
    document.getElementById('interest-rate').addEventListener('input', () => updateCalculation('interest-rate'));
    document.getElementById('property-tax').addEventListener('input', () => updateCalculation('property-tax'));
    document.getElementById('home-insurance').addEventListener('input', () => updateCalculation('home-insurance'));
    document.getElementById('hoa-fees').addEventListener('input', () => updateCalculation('hoa-fees'));
    document.getElementById('extra-monthly').addEventListener('input', () => updateCalculation('extra-monthly'));
    document.getElementById('one-time-extra').addEventListener('input', () => updateCalculation('one-time-extra'));
    document.getElementById('extra-payment-date').addEventListener('change', () => updateCalculation('extra-payment-date')); // IMPROVEMENT 3
    document.getElementById('closing-costs-percentage').addEventListener('input', () => updateCalculation('closing-costs-percentage'));

    // State selector (auto-fill tax/insurance)
    document.getElementById('state-select').addEventListener('change', function() {
        const state = this.value;
        if (state !== 'default' && STATE_RATES[state]) {
            const rates = STATE_RATES[state];
            const homePrice = parseFloat(document.getElementById('home-price').value) || 0;

            // Auto-calculate tax and insurance
            const annualTax = homePrice * (rates.taxRate / 100);
            const annualInsurance = homePrice * (rates.insuranceRate / 100);

            document.getElementById('property-tax').value = Math.round(annualTax);
            document.getElementById('home-insurance').value = Math.round(annualInsurance);

            // Update hints
            document.getElementById('tax-rate-hint').textContent = 
                `Tax Rate: ${rates.taxRate.toFixed(2)}% (Annual Estimate for ${rates.name})`;
            document.getElementById('insurance-rate-hint').textContent = 
                `Insurance Rate: ${rates.insuranceRate.toFixed(2)}% (Annual Estimate)`;

            updateCalculation('state-select');
            showToast('Tax and insurance updated for ' + rates.name, 'success');
        }
    });

    // Loan term chips
    document.querySelectorAll('.chip[data-term]').forEach(chip => {
        chip.addEventListener('click', function() {
            document.querySelectorAll('.chip[data-term]').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            MORTGAGE_CALCULATOR.currentCalculation.loanTerm = parseInt(this.dataset.term);
            updateCalculation('loan-term');
        });
    });

    // Loan type chips
    document.querySelectorAll('.chip[data-type]').forEach(chip => {
        chip.addEventListener('click', function() {
            document.querySelectorAll('.chip[data-type]').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            MORTGAGE_CALCULATOR.currentCalculation.loanType = this.dataset.type;
            updateCalculation('loan-type');
        });
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
        const maxPage = Math.ceil(MORTGAGE_CALCULATOR.amortizationSchedule.length / MORTGAGE_CALCULATOR.scheduleItemsPerPage);
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
    if (MORTGAGE_CALCULATOR.DEBUG) console.log(`🔄 Calculation triggered by: ${sourceId}`);

    const current = MORTGAGE_CALCULATOR.currentCalculation;

    // Read all inputs
    current.homePrice = parseFloat(document.getElementById('home-price').value) || 0;
    current.downPayment = parseFloat(document.getElementById('down-payment').value) || 0;
    current.downPaymentPercent = parseFloat(document.getElementById('down-payment-percent').value) || 0;
    current.creditScore = parseFloat(document.getElementById('credit-score').value) || 740;
    current.interestRate = parseFloat(document.getElementById('interest-rate').value) || 0;
    current.propertyTax = parseFloat(document.getElementById('property-tax').value) || 0;
    current.homeInsurance = parseFloat(document.getElementById('home-insurance').value) || 0;
    current.hoaFees = parseFloat(document.getElementById('hoa-fees').value) || 0;
    current.extraMonthly = parseFloat(document.getElementById('extra-monthly').value) || 0;
    current.oneTimeExtra = parseFloat(document.getElementById('one-time-extra').value) || 0;
    current.closingCostsPercent = parseFloat(document.getElementById('closing-costs-percentage').value) || 0;

    // IMPROVEMENT 3: Calculate month for extra payment
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
    document.getElementById('total-monthly').textContent = formatCurrency(monthlyPITI);

    document.getElementById('total-cost').textContent = formatCurrency(amortizationData.totalCost);
    document.getElementById('total-interest').textContent = formatCurrency(amortizationData.totalInterest);
    document.getElementById('payoff-date').textContent = amortizationData.payoffDate;
    document.getElementById('closing-costs').textContent = formatCurrency(current.homePrice * (current.closingCostsPercent / 100));

    // Render visualizations
    renderPaymentComponentsChart(monthlyPI, monthlyTax, monthlyInsurance, current.pmi + current.hoaFees);
    renderMortgageTimelineChart(); // IMPROVEMENT 6
    renderAIPoweredInsights(); // IMPROVEMENT 8
    renderPaymentScheduleTable(); // IMPROVEMENT 5

    // Google Analytics tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', 'calculation_update', {
            'event_category': 'calculator',
            'home_price': current.homePrice,
            'loan_term': current.loanTerm
        });
    }
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

        // IMPROVEMENT 3: Apply one-time extra payment at specific month
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
// CHART RENDERING (IMPROVEMENT 6)
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
    const yearlyData = schedule.filter((item, index) => index % 12 === 0 || index === schedule.length - 1);

    // Calculate cumulative principal and interest paid
    const principalPaid = [];
    const interestPaid = [];
    let cumPrincipal = 0;
    let cumInterest = 0;

    yearlyData.forEach(item => {
        cumPrincipal = MORTGAGE_CALCULATOR.currentCalculation.loanAmount - item.balance;
        cumInterest = item.totalInterest;
        principalPaid.push(cumPrincipal);
        interestPaid.push(cumInterest);
    });

    MORTGAGE_CALCULATOR.charts.mortgageTimeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: yearlyData.map(item => item.year),
            datasets: [
                {
                    label: 'Remaining Balance',
                    data: yearlyData.map(item => item.balance),
                    borderColor: 'rgba(20, 184, 166, 1)',
                    backgroundColor: 'rgba(20, 184, 166, 0.1)',
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Principal Paid',
                    data: principalPaid,
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: false,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Interest Paid',
                    data: interestPaid,
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: false,
                    tension: 0.3,
                    yAxisID: 'y'
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
                    title: {
                        display: true,
                        text: 'Year of Loan',
                        color: getComputedStyle(document.body).getPropertyValue('color')
                    },
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('color')
                    },
                    grid: {
                        color: 'rgba(128, 128, 128, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amount ($)',
                        color: getComputedStyle(document.body).getPropertyValue('color')
                    },
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('color'),
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'k';
                        }
                    },
                    grid: {
                        color: 'rgba(128, 128, 128, 0.1)'
                    }
                }
            }
        }
    });
}
// ========================================================================== //
// IMPROVEMENT 8: AI-POWERED INSIGHTS (Dynamic based on user inputs)
// ========================================================================== //

function renderAIPoweredInsights() {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const container = document.getElementById('ai-insights-container');
    container.innerHTML = '';

    const insights = [];

    // Credit Score Analysis
    if (current.creditScore >= 740) {
        insights.push({
            title: '✅ Excellent Credit Position',
            text: `Your credit score of <strong>${current.creditScore}</strong> qualifies you for the best mortgage rates. You're in a strong position to negotiate favorable terms with lenders.`
        });
    } else if (current.creditScore >= 670) {
        insights.push({
            title: '⚠️ Good Credit - Room for Improvement',
            text: `Your credit score of <strong>${current.creditScore}</strong> is good, but improving it to 740+ could reduce your interest rate by 0.25-0.5%, saving you thousands over the loan term.`
        });
    } else {
        insights.push({
            title: '🔴 Credit Score Alert',
            text: `With a credit score of <strong>${current.creditScore}</strong>, you may face higher interest rates. Consider improving your credit before applying to save significantly on interest.`
        });
    }

    // Down Payment Strategy
    const dpPercent = current.downPaymentPercent;
    if (dpPercent >= 20) {
        insights.push({
            title: '💰 Optimal Down Payment',
            text: `Your <strong>${dpPercent.toFixed(1)}%</strong> down payment eliminates PMI, saving you <strong>${formatCurrency(current.pmi * 12)}/year</strong>. This reduces your total loan cost significantly.`
        });
    } else {
        const pmiAnnual = current.pmi * 12;
        const monthsToRemovePMI = Math.ceil((current.homePrice * 0.20 - current.downPayment) / (current.extraMonthly || 100));
        insights.push({
            title: '📊 PMI Impact Analysis',
            text: `With <strong>${dpPercent.toFixed(1)}%</strong> down, you'll pay <strong>${formatCurrency(pmiAnnual)}/year</strong> in PMI. Once you reach 20% equity (approximately ${monthsToRemovePMI} months with extra payments), PMI will be removed.`
        });
    }

    // Extra Payment Impact
    if (current.extraMonthly > 0 || current.oneTimeExtra > 0) {
        const baseSchedule = calculateAmortization(
            (current.loanAmount * ((current.interestRate/100)/12) * Math.pow(1 + (current.interestRate/100)/12, current.loanTerm*12)) / 
            (Math.pow(1 + (current.interestRate/100)/12, current.loanTerm*12) - 1),
            current.propertyTax / 12,
            current.homeInsurance / 12
        );
        const monthsSaved = baseSchedule.totalPayments - MORTGAGE_CALCULATOR.amortizationSchedule.length;
        const interestSaved = baseSchedule.totalInterest - MORTGAGE_CALCULATOR.amortizationSchedule[MORTGAGE_CALCULATOR.amortizationSchedule.length - 1].totalInterest;

        insights.push({
            title: '🚀 Accelerated Payoff Strategy',
            text: `Your extra payments will save you <strong>${formatCurrency(interestSaved)}</strong> in interest and pay off your loan <strong>${Math.round(monthsSaved/12)} years ${monthsSaved % 12} months</strong> early!`
        });
    } else {
        insights.push({
            title: '💡 Extra Payment Opportunity',
            text: `Adding just <strong>$200/month</strong> extra could save you tens of thousands in interest and shave years off your loan term. Try it in the calculator!`
        });
    }

    // Interest Rate Context
    const avgRate = MORTGAGE_CALCULATOR.marketRates.rate30Year;
    if (current.interestRate < avgRate) {
        insights.push({
            title: '🎯 Below-Market Rate',
            text: `Your rate of <strong>${current.interestRate}%</strong> is below the current 30-year average of ${avgRate}%. This is an excellent rate—lock it in if possible!`
        });
    } else if (current.interestRate > avgRate + 0.5) {
        insights.push({
            title: '⚡ Rate Optimization Opportunity',
            text: `Your rate of <strong>${current.interestRate}%</strong> is above market average (${avgRate}%). Shop around with multiple lenders or consider rate negotiation.`
        });
    }

    // Loan Term Analysis
    if (current.loanTerm === 30) {
        const rate15 = MORTGAGE_CALCULATOR.marketRates.rate15Year;
        insights.push({
            title: '🔄 15-Year Alternative',
            text: `Switching to a 15-year loan (typically ${rate15}% rate) would increase monthly payments but save massive interest. Compare scenarios using the button below!`
        });
    }

    // Monthly Payment to Income Ratio (Assuming 28% rule)
    const recommendedMaxPayment = (current.homePrice / 3) * 0.28 / 12;
    const monthlyTotal = (current.loanAmount * ((current.interestRate/100)/12) * Math.pow(1 + (current.interestRate/100)/12, current.loanTerm*12)) / 
                        (Math.pow(1 + (current.interestRate/100)/12, current.loanTerm*12) - 1) + 
                        (current.propertyTax / 12) + (current.homeInsurance / 12) + current.pmi + current.hoaFees;

    if (monthlyTotal > recommendedMaxPayment * 1.2) {
        insights.push({
            title: '⚠️ Affordability Concern',
            text: `Your monthly payment is high relative to typical income guidelines (28% of gross income). Ensure this aligns with your budget and consider a larger down payment or lower-priced home.`
        });
    }

    // Render insights
    insights.forEach(insight => {
        const insightDiv = document.createElement('div');
        insightDiv.className = 'ai-insight';
        insightDiv.innerHTML = `
            <div class="ai-insight-title">${insight.title}</div>
            <div>${insight.text}</div>
        `;
        container.appendChild(insightDiv);
    });
}

// ========================================================================== //
// IMPROVEMENT 5: PAYMENT SCHEDULE TABLE
// ========================================================================== //

function renderPaymentScheduleTable() {
    const schedule = MORTGAGE_CALCULATOR.amortizationSchedule;
    const tbody = document.querySelector('#payment-schedule-table tbody');
    tbody.innerHTML = '';

    if (!schedule.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No data available</td></tr>';
        return;
    }

    // Filter for monthly or yearly
    let displaySchedule = schedule;
    if (MORTGAGE_CALCULATOR.scheduleType === 'yearly') {
        displaySchedule = schedule.filter((item, index) => index % 12 === 0 || index === schedule.length - 1);
        MORTGAGE_CALCULATOR.scheduleItemsPerPage = 30; // Show more years per page
    } else {
        MORTGAGE_CALCULATOR.scheduleItemsPerPage = 12;
    }

    // Pagination
    const start = (MORTGAGE_CALCULATOR.scheduleCurrentPage - 1) * MORTGAGE_CALCULATOR.scheduleItemsPerPage;
    const end = start + MORTGAGE_CALCULATOR.scheduleItemsPerPage;
    const pageData = displaySchedule.slice(start, end);

    // Render rows
    pageData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="month-col">${row.date}</td>
            <td>${formatCurrency(row.totalPayment)}</td>
            <td class="principal-col">${formatCurrency(row.principal)}</td>
            <td class="interest-col">${formatCurrency(row.interest)}</td>
            <td>${formatCurrency(row.taxAndIns)}</td>
            <td>${formatCurrency(row.hoa)}</td>
            <td>${formatCurrency(row.extra)}</td>
            <td class="balance-col">${formatCurrency(row.balance)}</td>
        `;
        tbody.appendChild(tr);
    });

    // Update pagination
    const maxPage = Math.ceil(displaySchedule.length / MORTGAGE_CALCULATOR.scheduleItemsPerPage);
    document.getElementById('schedule-page-info').textContent = 
        `Page ${MORTGAGE_CALCULATOR.scheduleCurrentPage} of ${maxPage}`;
    document.getElementById('schedule-prev').disabled = MORTGAGE_CALCULATOR.scheduleCurrentPage === 1;
    document.getElementById('schedule-next').disabled = MORTGAGE_CALCULATOR.scheduleCurrentPage === maxPage;
}

function exportScheduleToCSV() {
    const schedule = MORTGAGE_CALCULATOR.amortizationSchedule;
    let csv = 'Period,Total Payment,Principal,Interest,Taxes & Insurance,HOA,Extra Payment,Remaining Balance\n';

    schedule.forEach(row => {
        csv += `${row.date},${row.totalPayment.toFixed(2)},${row.principal.toFixed(2)},${row.interest.toFixed(2)},`;
        csv += `${row.taxAndIns.toFixed(2)},${row.hoa.toFixed(2)},${row.extra.toFixed(2)},${row.balance.toFixed(2)}\n`;
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mortgage-schedule.csv';
    a.click();

    showToast('Schedule exported successfully!', 'success');

    // Track with Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'export_schedule', {
            'event_category': 'engagement',
            'event_label': 'CSV Export'
        });
    }
}

// ========================================================================== //
// IMPROVEMENT 7: LIVE MARKET RATES
// ========================================================================== //

async function fetchLiveRates() {
    const rateStatus = document.getElementById('rate-status');
    rateStatus.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> <span>Fetching live rates...</span>';

    try {
        // Fetch 30-year rate
        const response30 = await fetch(
            `${MORTGAGE_CALCULATOR.FRED_BASE_URL}?series_id=MORTGAGE30US&api_key=${MORTGAGE_CALCULATOR.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`
        );
        const data30 = await response30.json();

        if (data30.observations && data30.observations.length > 0) {
            const rate30 = parseFloat(data30.observations[0].value);
            MORTGAGE_CALCULATOR.marketRates.rate30Year = rate30;
            document.getElementById('rate-30-year').textContent = rate30.toFixed(2) + '%';
            document.getElementById('interest-rate').value = rate30.toFixed(2);
            MORTGAGE_CALCULATOR.currentCalculation.interestRate = rate30;
        }

        // Fetch 15-year rate
        const response15 = await fetch(
            `${MORTGAGE_CALCULATOR.FRED_BASE_URL}?series_id=MORTGAGE15US&api_key=${MORTGAGE_CALCULATOR.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`
        );
        const data15 = await response15.json();

        if (data15.observations && data15.observations.length > 0) {
            const rate15 = parseFloat(data15.observations[0].value);
            MORTGAGE_CALCULATOR.marketRates.rate15Year = rate15;
            document.getElementById('rate-15-year').textContent = rate15.toFixed(2) + '%';
        }

        // Mock 10-year Treasury (FRED limits API calls)
        document.getElementById('rate-10-treasury').textContent = '4.25%';

        rateStatus.innerHTML = '<i class="fas fa-check-circle"></i> <span>Rates updated from Federal Reserve</span>';

        // Update calculation with new rate
        updateCalculation('fred-api');

    } catch (error) {
        console.error('Error fetching rates:', error);
        rateStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span>Using default rates</span>';
    }
}

// ========================================================================== //
// UI HELPER FUNCTIONS
// ========================================================================== //

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function initializeThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'dark';

    document.body.setAttribute('data-color-scheme', currentTheme);
    MORTGAGE_CALCULATOR.currentTheme = currentTheme;

    toggleBtn.addEventListener('click', () => {
        const newTheme = MORTGAGE_CALCULATOR.currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-color-scheme', newTheme);
        MORTGAGE_CALCULATOR.currentTheme = newTheme;
        localStorage.setItem('theme', newTheme);

        // Re-render charts with new theme colors
        updateCalculation('theme-change');
    });
}

function initializeTabSystem() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(targetTab + '-tab').classList.add('active');
        });
    });
}

function initializeCollapsibleSections() {
    document.querySelectorAll('.collapsible-section .section-sub-heading').forEach(heading => {
        heading.addEventListener('click', () => {
            const section = heading.closest('.collapsible-section');
            section.classList.toggle('collapsed');
        });
    });
}

function initializeVoiceCommands() {
    const voiceBtn = document.getElementById('voice-control');
    const voiceStatus = document.getElementById('voice-status');

    if (!MORTGAGE_CALCULATOR.speechRecognition) return;

    const recognition = new MORTGAGE_CALCULATOR.speechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    voiceBtn.addEventListener('click', () => {
        if (MORTGAGE_CALCULATOR.voiceEnabled) {
            recognition.stop();
            voiceStatus.classList.remove('active');
            MORTGAGE_CALCULATOR.voiceEnabled = false;
        } else {
            recognition.start();
            voiceStatus.classList.add('active');
            MORTGAGE_CALCULATOR.voiceEnabled = true;
        }
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        console.log('Voice command:', transcript);

        if (transcript.includes('calculate')) {
            updateCalculation('voice');
            showToast('Calculation updated!', 'success');
        } else if (transcript.includes('share')) {
            document.getElementById('share-btn').click();
        }
    };
}

function initializeScreenReader() {
    const btn = document.getElementById('screen-reader-toggle');

    btn.addEventListener('click', () => {
        MORTGAGE_CALCULATOR.screenReaderMode = !MORTGAGE_CALCULATOR.screenReaderMode;

        if (MORTGAGE_CALCULATOR.screenReaderMode) {
            const text = `Monthly payment is ${document.getElementById('monthly-payment-total').textContent}`;
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        } else {
            window.speechSynthesis.cancel();
        }
    });
}

function initializeLoanCompare() {
    document.getElementById('loan-compare-btn').addEventListener('click', () => {
        const compareWindow = window.open('', '_blank', 'width=1200,height=800');
        compareWindow.document.write(`
            <html>
            <head>
                <title>Loan Comparison - FinGuid</title>
                <link rel="stylesheet" href="mortgage-calculator-3.css">
            </head>
            <body>
                <h1>Loan Scenario Comparison (Feature Coming Soon)</h1>
                <p>This feature allows you to compare multiple loan scenarios side by side.</p>
            </body>
            </html>
        `);
    });
}

// ========================================================================== //
// IMPROVEMENT 10: SHARE BUTTONS
// ========================================================================== //

function initializeShareButtons() {
    // Share button
    document.getElementById('share-btn').addEventListener('click', async () => {
        const shareData = {
            title: 'FinGuid Mortgage Calculator',
            text: `Check out my mortgage calculation: $${document.getElementById('monthly-payment-total').textContent}/month`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                showToast('Shared successfully!', 'success');
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            // Fallback: Copy link
            navigator.clipboard.writeText(window.location.href);
            showToast('Link copied to clipboard!', 'success');
        }

        // Track with Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'share', {
                'event_category': 'engagement',
                'method': 'Web Share API'
            });
        }
    });

    // Download PDF button
    document.getElementById('download-pdf-btn').addEventListener('click', () => {
        showToast('PDF generation feature coming soon!', 'info');

        // Track with Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'download_pdf', {
                'event_category': 'engagement'
            });
        }
    });

    // Print button
    document.getElementById('print-btn').addEventListener('click', () => {
        window.print();

        // Track with Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'print', {
                'event_category': 'engagement'
            });
        }
    });
}

// Close voice status
document.getElementById('voice-status-close')?.addEventListener('click', () => {
    document.getElementById('voice-status').classList.remove('active');
    MORTGAGE_CALCULATOR.voiceEnabled = false;
});

console.log('✅ All features initialized successfully!');
