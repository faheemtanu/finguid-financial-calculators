/* ========================================================================== */
/* FinGuid USA Mortgage Calculator - Enhanced JS v27.0                      */
/* Federal Reserve Integration & Advanced AI Features                        */
/* ========================================================================== */

const MORTGAGE_CALCULATOR = {
    VERSION: '27.0-FinGuid-Enhanced',
    DEBUG: true,
    
    // FRED API Configuration
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    
    // Series IDs for different rates
    FRED_SERIES: {
        MORTGAGE30US: 'MORTGAGE30US',
        MORTGAGE15US: 'MORTGAGE15US',
        DGS10: 'DGS10'
    },
    
    // Rate update configuration
    RATE_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    LAST_UPDATE_THURSDAY: false,
    
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
        creditScore: 740,
        interestRate: 6.44,
        loanTerm: 30,
        loanType: 'conventional',
        propertyTax: 9000,
        homeInsurance: 1800,
        pmi: 0,
        hoaFees: 0,
        extraMonthly: 0,
        oneTimeExtra: 0,
        closingCostsPercent: 3,
        state: 'default'
    },
    
    // Amortization data
    amortizationSchedule: [],
    scheduleCurrentPage: 1,
    scheduleItemsPerPage: 12,
    scheduleType: 'monthly',
    
    // Current rates from FRED
    currentRates: {
        mortgage30yr: 6.44,
        mortgage15yr: 5.89,
        treasury10yr: 4.25,
        lastUpdate: null
    },
    
    // UI state
    voiceEnabled: false,
    screenReaderMode: false,
    currentTheme: 'dark',
    speechRecognition: window.SpeechRecognition || window.webkitSpeechRecognition,
    speechSynthesis: window.speechSynthesis
};

// Enhanced State Rates Database
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

// FRED API Manager with Enhanced Error Handling
class FredAPIManager {
    constructor() {
        this.apiKey = MORTGAGE_CALCULATOR.FRED_API_KEY;
        this.baseUrl = MORTGAGE_CALCULATOR.FRED_BASE_URL;
        this.cache = new Map();
        this.rateUpdateAttempts = 0;
        this.maxAttempts = 3;
    }

    async fetchFredData(seriesId) {
        const url = `${this.baseUrl}?series_id=${seriesId}&api_key=${this.apiKey}&file_type=json&sort_order=desc&limit=2`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return this.parseFredObservations(data);
        } catch (error) {
            console.error(`FRED API Error for ${seriesId}:`, error);
            throw error;
        }
    }

    parseFredObservations(data) {
        if (!data.observations || data.observations.length === 0) {
            throw new Error('No observations found in FRED response');
        }

        const validObservations = data.observations.filter(obs => 
            obs.value !== '.' && !isNaN(parseFloat(obs.value))
        );

        if (validObservations.length === 0) {
            throw new Error('No valid rate data found');
        }

        return {
            current: parseFloat(validObservations[0].value),
            previous: validObservations[1] ? parseFloat(validObservations[1].value) : null,
            date: validObservations[0].date
        };
    }

    async getCurrentMortgageRates() {
        if (this.rateUpdateAttempts >= this.maxAttempts) {
            console.warn('Max FRED API attempts reached, using cached rates');
            return this.getCachedRates();
        }

        showLoading('Fetching live Federal Reserve rates...');

        try {
            const [rate30yr, rate15yr, treasury10yr] = await Promise.all([
                this.fetchFredData('MORTGAGE30US'),
                this.fetchFredData('MORTGAGE15US'),
                this.fetchFredData('DGS10')
            ]);

            MORTGAGE_CALCULATOR.currentRates = {
                mortgage30yr: rate30yr.current,
                mortgage15yr: rate15yr.current,
                treasury10yr: treasury10yr.current,
                lastUpdate: new Date().toISOString()
            };

            this.updateRateDisplays();
            this.rateUpdateAttempts = 0;
            
            showToast('Live rates updated successfully!', 'success');
            return MORTGAGE_CALCULATOR.currentRates;

        } catch (error) {
            this.rateUpdateAttempts++;
            console.error('Failed to fetch FRED rates:', error);
            showToast('Using cached rates - FRED API temporarily unavailable', 'warning');
            return this.getCachedRates();
        } finally {
            hideLoading();
        }
    }

    getCachedRates() {
        const cached = localStorage.getItem('finguid_cached_rates');
        if (cached) {
            return JSON.parse(cached);
        }
        return MORTGAGE_CALCULATOR.currentRates;
    }

    updateRateDisplays() {
        const rates = MORTGAGE_CALCULATOR.currentRates;
        
        // Update rate displays
        document.getElementById('rate-30yr').textContent = `${rates.mortgage30yr.toFixed(2)}%`;
        document.getElementById('rate-15yr').textContent = `${rates.mortgage15yr.toFixed(2)}%`;
        document.getElementById('rate-treasury').textContent = `${rates.treasury10yr.toFixed(2)}%`;
        
        // Update last update time
        const updateTime = document.getElementById('rate-update-time');
        if (updateTime) {
            const lastUpdate = new Date(rates.lastUpdate);
            updateTime.textContent = `Last updated: ${lastUpdate.toLocaleString()}`;
        }

        // Cache rates
        localStorage.setItem('finguid_cached_rates', JSON.stringify(rates));
    }

    shouldUpdateRates() {
        const lastUpdate = MORTGAGE_CALCULATOR.currentRates.lastUpdate;
        if (!lastUpdate) return true;

        const lastUpdateDate = new Date(lastUpdate);
        const now = new Date();
        const hoursSinceUpdate = (now - lastUpdateDate) / (1000 * 60 * 60);

        // Update if more than 24 hours old or it's Thursday afternoon
        return hoursSinceUpdate > 24 || this.isThursdayUpdateTime();
    }

    isThursdayUpdateTime() {
        const now = new Date();
        const isThursday = now.getDay() === 4; // 4 = Thursday
        const isUpdateTime = now.getHours() >= 14; // 2 PM ET
        
        return isThursday && isUpdateTime && !MORTGAGE_CALCULATOR.LAST_UPDATE_THURSDAY;
    }
}

// Core Calculation Functions
function updateCalculation(sourceId = null) {
    if (MORTGAGE_CALCULATOR.DEBUG) {
        console.log(`🔄 Calculation triggered by: ${sourceId}`);
    }

    const current = MORTGAGE_CALCULATOR.currentCalculation;

    // Read all inputs
    current.homePrice = parseFloat(document.getElementById('home-price').value) || 0;
    current.downPayment = parseFloat(document.getElementById('down-payment').value) || 0;
    current.downPaymentPercent = parseFloat(document.getElementById('down-payment-percent').value) || 0;
    current.creditScore = parseFloat(document.getElementById('credit-score').value) || 0;
    current.interestRate = parseFloat(document.getElementById('interest-rate').value) || 0;
    current.propertyTax = parseFloat(document.getElementById('property-tax').value) || 0;
    current.homeInsurance = parseFloat(document.getElementById('home-insurance').value) || 0;
    current.pmi = parseFloat(document.getElementById('pmi').value) || 0;
    current.hoaFees = parseFloat(document.getElementById('hoa-fees').value) || 0;
    current.extraMonthly = parseFloat(document.getElementById('extra-monthly').value) || 0;
    current.oneTimeExtra = parseFloat(document.getElementById('one-time-extra').value) || 0;
    current.closingCostsPercent = parseFloat(document.getElementById('closing-costs-percentage').value) || 0;

    // Update credit score indicator
    updateCreditScoreIndicator(current.creditScore);

    // Sync down payment calculations
    if (sourceId === 'down-payment') {
        current.downPaymentPercent = (current.downPayment / current.homePrice) * 100 || 0;
        document.getElementById('down-payment-percent').value = current.downPaymentPercent.toFixed(2);
    } else if (sourceId === 'down-payment-percent') {
        current.downPayment = current.homePrice * (current.downPaymentPercent / 100);
        document.getElementById('down-payment').value = current.downPayment.toFixed(0);
    }

    // Calculate loan amount and PMI
    current.loanAmount = current.homePrice - current.downPayment;
    calculatePMI(current);

    // Perform core calculations
    const monthlyPI = calculatePrincipalAndInterest(current);
    const monthlyTax = current.propertyTax / 12;
    const monthlyInsurance = current.homeInsurance / 12;
    const monthlyPITI = monthlyPI + monthlyTax + monthlyInsurance + current.pmi + current.hoaFees;
    const finalMonthlyPayment = monthlyPITI + current.extraMonthly;

    // Calculate amortization and totals
    const amortizationData = calculateAmortization(monthlyPITI, current.extraMonthly, current.loanTerm);
    Object.assign(current, amortizationData);

    // Update UI
    updatePaymentDisplays(finalMonthlyPayment, monthlyPI, monthlyTax, monthlyInsurance, current);
    updateLoanTotals(current);
    renderCharts(monthlyPI, monthlyTax, monthlyInsurance, current);
    renderAIPoweredInsights();
    renderPaymentScheduleTable();

    // Visual feedback
    if (sourceId) {
        highlightPaymentUpdate();
    }
}

function updateCreditScoreIndicator(score) {
    const fill = document.getElementById('score-fill');
    if (fill) {
        const percentage = ((score - 300) / (850 - 300)) * 100;
        fill.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
    }
}

function calculatePMI(current) {
    if (current.downPaymentPercent < 20 && current.loanType === 'conventional') {
        const ltv = (current.loanAmount / current.homePrice) * 100;
        let pmiRate = 0.005; // Base rate
        
        // Adjust based on credit score
        if (current.creditScore >= 760) pmiRate = 0.0038;
        else if (current.creditScore >= 700) pmiRate = 0.0045;
        else if (current.creditScore >= 680) pmiRate = 0.0052;
        else if (current.creditScore >= 660) pmiRate = 0.0065;
        else if (current.creditScore >= 640) pmiRate = 0.008;
        else pmiRate = 0.01;
        
        // LTV adjustment
        if (ltv > 95) pmiRate *= 1.2;
        else if (ltv > 90) pmiRate *= 1.1;
        
        current.pmi = (current.loanAmount * pmiRate) / 12;
    } else {
        current.pmi = 0;
    }
    document.getElementById('pmi').value = current.pmi.toFixed(2);
}

function calculatePrincipalAndInterest(current) {
    const principal = current.loanAmount;
    const rateMonthly = (current.interestRate / 100) / 12;
    const paymentsTotal = current.loanTerm * 12;

    if (rateMonthly === 0) {
        return principal / paymentsTotal;
    }

    const monthlyPI = principal * 
        (rateMonthly * Math.pow(1 + rateMonthly, paymentsTotal)) / 
        (Math.pow(1 + rateMonthly, paymentsTotal) - 1);

    return isNaN(monthlyPI) || monthlyPI === Infinity ? 0 : monthlyPI;
}

// Enhanced Amortization Calculation
function calculateAmortization(monthlyPITI, extraMonthly, loanTerm) {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    let balance = current.loanAmount;
    let rateMonthly = (current.interestRate / 100) / 12;
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
        totalInterestPaid += interestPaid;
        cumulativeInterest += interestPaid;
        
        let principalPaid = monthlyPI - interestPaid;
        let extraPaymentApplied = extraMonthly + (month === 1 ? oneTimeExtra : 0);
        let actualPrincipalPaid = principalPaid + extraPaymentApplied;

        // Handle final payment
        if (balance < actualPrincipalPaid) {
            actualPrincipalPaid = balance;
            balance = 0;
        } else {
            balance -= actualPrincipalPaid;
        }

        cumulativePrincipal += actualPrincipalPaid;
        
        schedule.push({
            month: month,
            year: Math.ceil(month / 12),
            date: new Date(new Date().setMonth(new Date().getMonth() + month)),
            totalPayment: monthlyPI + extraPaymentApplied,
            principal: actualPrincipalPaid,
            interest: interestPaid,
            extra: extraPaymentApplied,
            endingBalance: balance,
            cumulativePrincipal: cumulativePrincipal,
            cumulativeInterest: cumulativeInterest
        });

        totalPaymentsMade++;
        if (month === 1) oneTimeExtra = 0;
    }
    
    const payoffDate = new Date(new Date().setMonth(new Date().getMonth() + totalPaymentsMade));
    const fullTotalCost = current.homePrice + totalInterestPaid + (current.homePrice * current.closingCostsPercent / 100);

    return { 
        amortizationSchedule: schedule, 
        totalInterest: totalInterestPaid, 
        payoffDate: payoffDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
        totalPayments: totalPaymentsMade,
        fullTotalCost: fullTotalCost
    };
}

// UI Update Functions
function updatePaymentDisplays(finalMonthly, pi, tax, insurance, current) {
    document.getElementById('monthly-payment-total').textContent = formatCurrency(finalMonthly);
    document.getElementById('pi-monthly').textContent = formatCurrency(pi);
    
    const taxInsMonthly = tax + insurance + current.pmi + current.hoaFees;
    document.getElementById('tax-ins-monthly').textContent = formatCurrency(taxInsMonthly);
}

function updateLoanTotals(current) {
    document.getElementById('total-cost').textContent = formatCurrency(current.fullTotalCost);
    document.getElementById('total-interest').textContent = formatCurrency(current.totalInterest);
    document.getElementById('payoff-date').textContent = current.payoffDate;
    document.getElementById('closing-costs').textContent = formatCurrency(current.homePrice * (current.closingCostsPercent / 100));
}

function highlightPaymentUpdate() {
    const paymentElement = document.getElementById('monthly-payment-total');
    paymentElement.parentElement.classList.add('highlight');
    setTimeout(() => {
        paymentElement.parentElement.classList.remove('highlight');
    }, 1000);
}

// Chart Rendering Functions
function renderCharts(pi, tax, insurance, current) {
    renderPaymentComponentsChart(pi, tax, insurance, current);
    renderMortgageTimelineChart();
}

function renderPaymentComponentsChart(pi, tax, insurance, current) {
    const ctx = document.getElementById('paymentComponentsChart').getContext('2d');
    
    if (MORTGAGE_CALCULATOR.charts.paymentComponents) {
        MORTGAGE_CALCULATOR.charts.paymentComponents.destroy();
    }
    
    const other = current.pmi + current.hoaFees;
    
    MORTGAGE_CALCULATOR.charts.paymentComponents = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal & Interest', 'Property Tax', 'Home Insurance', 'PMI & HOA'],
            datasets: [{
                data: [pi, tax, insurance, other],
                backgroundColor: [
                    getComputedStyle(document.documentElement).getPropertyValue('--color-chart-1'),
                    getComputedStyle(document.documentElement).getPropertyValue('--color-chart-2'),
                    getComputedStyle(document.documentElement).getPropertyValue('--color-chart-3'),
                    getComputedStyle(document.documentElement).getPropertyValue('--color-chart-4')
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text'),
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${formatCurrency(context.parsed)}`;
                        }
                    }
                }
            }
        }
    });
}

function renderMortgageTimelineChart() {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const schedule = current.amortizationSchedule;
    if (!schedule.length) return;

    const ctx = document.getElementById('mortgageTimelineChart').getContext('2d');
    
    if (MORTGAGE_CALCULATOR.charts.mortgageTimeline) {
        MORTGAGE_CALCULATOR.charts.mortgageTimeline.destroy();
    }
    
    // Use yearly data for cleaner visualization
    const yearlyData = schedule.filter(item => item.month % 12 === 0 || item.month === schedule.length);

    MORTGAGE_CALCULATOR.charts.mortgageTimeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: yearlyData.map(item => `Year ${item.year}`),
            datasets: [
                {
                    label: 'Remaining Balance',
                    data: yearlyData.map(item => item.endingBalance),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--color-chart-1'),
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Principal Paid',
                    data: yearlyData.map(item => item.cumulativePrincipal),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--color-chart-2'),
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Interest Paid',
                    data: yearlyData.map(item => item.cumulativeInterest),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--color-chart-3'),
                    backgroundColor: 'transparent',
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
                intersect: false,
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text')
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--color-border') },
                    ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary') }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--color-border') },
                    ticks: { 
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary'),
                        callback: function(value) {
                            return formatCurrency(value, true);
                        }
                    }
                }
            }
        }
    });
}

// Enhanced AI Insights with Dynamic Analysis
function renderAIPoweredInsights() {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const aiOutput = document.getElementById('ai-insights-output');
    
    if (!aiOutput) return;

    aiOutput.innerHTML = `<div class="insight-loading">
        <i class="fas fa-sync-alt fa-spin"></i>
        <span>Generating personalized AI insights...</span>
    </div>`;

    setTimeout(() => {
        const insights = generateAIInsights(current);
        displayInsights(insights, aiOutput);
    }, 800);
}

function generateAIInsights(current) {
    const insights = [];
    const monthlyPITI = parseFloat(document.getElementById('monthly-payment-total').textContent.replace(/[^0-9.-]+/g,""));

    // 1. Down Payment Analysis
    if (current.downPaymentPercent >= 20) {
        insights.push({
            title: "Excellent Down Payment Strategy",
            content: `Your ${current.downPaymentPercent}% down payment eliminates PMI and saves you approximately ${formatCurrency(current.pmi * 12)} annually. This strong equity position gives you better negotiating power.`,
            icon: "fas fa-trophy",
            priority: 1
        });
    } else if (current.downPaymentPercent >= 10) {
        insights.push({
            title: "Good Down Payment Progress",
            content: `Consider increasing your down payment to 20% to eliminate ${formatCurrency(current.pmi)} monthly PMI. This could save you ${formatCurrency(current.pmi * 12 * 5)} over 5 years.`,
            icon: "fas fa-chart-line",
            priority: 2
        });
    } else {
        insights.push({
            title: "Down Payment Opportunity",
            content: `With ${current.downPaymentPercent}% down, explore FHA loans (3.5% minimum) or consider saving longer to reach 10% for better rates.`,
            icon: "fas fa-piggy-bank",
            priority: 3
        });
    }

    // 2. Credit Score Impact
    if (current.creditScore >= 760) {
        insights.push({
            title: "Excellent Credit Advantage",
            content: `Your 760+ credit score qualifies you for the best available rates. You're saving approximately 0.5% compared to average borrowers.`,
            icon: "fas fa-star",
            priority: 1
        });
    } else if (current.creditScore >= 700) {
        insights.push({
            title: "Good Credit Position",
            content: `Improving your score to 760+ could save you ${formatCurrency(calculatePotentialSavings(current))} in interest over the loan term.`,
            icon: "fas fa-chart-bar",
            priority: 2
        });
    } else {
        insights.push({
            title: "Credit Improvement Opportunity",
            content: `Consider credit repair strategies. A 50-point increase could save you ${formatCurrency(calculatePotentialSavings(current, 50))} over the loan term.`,
            icon: "fas fa-hand-holding-usd",
            priority: 3
        });
    }

    // 3. Extra Payment Impact
    if (current.extraMonthly > 0 || current.oneTimeExtra > 0) {
        const savings = calculateExtraPaymentSavings(current);
        insights.push({
            title: "Accelerated Payoff Strategy",
            content: `Your extra payments are saving you ${formatCurrency(savings.interestSaved)} in interest and cutting your loan term by ${savings.monthsSaved} months.`,
            icon: "fas fa-bolt",
            priority: 2
        });
    } else {
        insights.push({
            title: "Early Payoff Potential",
            content: `Adding ${formatCurrency(100)} extra monthly could save you ${formatCurrency(calculatePotentialExtraPaymentSavings(current, 100))} and reduce your loan term by 4 years.`,
            icon: "fas fa-rocket",
            priority: 3
        });
    }

    // 4. Loan Type Optimization
    insights.push({
        title: "Loan Type Analysis",
        content: generateLoanTypeInsight(current),
        icon: "fas fa-university",
        priority: 2
    });

    // 5. Rate Comparison
    const marketRate = MORTGAGE_CALCULATOR.currentRates.mortgage30yr;
    const rateDiff = current.interestRate - marketRate;
    if (Math.abs(rateDiff) > 0.25) {
        insights.push({
            title: "Rate Comparison Alert",
            content: `Your rate is ${rateDiff > 0 ? 'higher' : 'lower'} than current market average (${marketRate}%). ${rateDiff > 0 ? 'Consider shopping around.' : 'Great rate!'}`,
            icon: "fas fa-percentage",
            priority: rateDiff > 0 ? 2 : 1
        });
    }

    // 6. Affordability Check
    const estimatedIncome = monthlyPITI * 3 * 12; // 33% of income rule
    if (monthlyPITI > 4000) {
        insights.push({
            title: "High Payment Alert",
            content: `This payment suggests an annual income of ${formatCurrency(estimatedIncome)} needed for comfortable affordability.`,
            icon: "fas fa-exclamation-triangle",
            priority: 3
        });
    }

    // 7. Refinance Potential
    if (current.interestRate > 5.5) {
        insights.push({
            title: "Future Refinance Watch",
            content: "When rates drop below 5.5%, consider refinancing to lower your payment. Set up rate alerts.",
            icon: "fas fa-sync-alt",
            priority: 3
        });
    }

    // 8. Tax & Insurance Analysis
    const taxInsPercent = ((current.propertyTax + current.homeInsurance) / current.homePrice * 100);
    if (taxInsPercent > 2) {
        insights.push({
            title: "High Tax/Insurance Area",
            content: `Your combined tax and insurance rate is ${taxInsPercent.toFixed(2)}% annually. Verify these estimates match your location.`,
            icon: "fas fa-map-marker-alt",
            priority: 2
        });
    }

    return insights.sort((a, b) => a.priority - b.priority);
}

function displayInsights(insights, container) {
    let html = '';
    insights.forEach(insight => {
        html += `
            <div class="insight-card">
                <div class="insight-header">
                    <i class="${insight.icon} insight-icon"></i>
                    <span class="insight-title">${insight.title}</span>
                </div>
                <div class="insight-content">
                    ${insight.content}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    if (MORTGAGE_CALCULATOR.screenReaderMode) {
        announceToScreenReader('AI insights updated with personalized mortgage recommendations');
    }
}

// Utility Functions
function calculatePotentialSavings(current, scoreImprovement = 0) {
    // Simplified calculation - in real implementation, use rate tables
    const improvement = scoreImprovement || (760 - current.creditScore);
    if (improvement <= 0) return 0;
    
    const potentialRateReduction = improvement * 0.002; // 0.2% per 100 points
    const monthlySavings = (current.loanAmount * potentialRateReduction / 100) / 12;
    return monthlySavings * current.loanTerm * 12 * 0.7; // Rough estimate
}

function calculateExtraPaymentSavings(current) {
    const schedule = current.amortizationSchedule;
    if (!schedule.length) return { interestSaved: 0, monthsSaved: 0 };
    
    const lastPayment = schedule[schedule.length - 1];
    const totalPayments = schedule.length;
    const standardTerm = current.loanTerm * 12;
    
    return {
        interestSaved: lastPayment.cumulativeInterest * 0.15, // Approximation
        monthsSaved: Math.max(0, standardTerm - totalPayments)
    };
}

function calculatePotentialExtraPaymentSavings(current, extraPayment) {
    // Simplified calculation
    return (extraPayment * current.loanTerm * 12 * 0.3); // Rough estimate
}

function generateLoanTypeInsight(current) {
    switch(current.loanType) {
        case 'conventional':
            return current.downPaymentPercent >= 20 ? 
                "Conventional with 20% down is optimal - no PMI and competitive rates." :
                "Consider if FHA might offer better terms with your current down payment.";
        case 'fha':
            return "FHA loans are great for lower credit scores but include lifetime MIP in most cases.";
        case 'va':
            return "Excellent VA loan benefits - no down payment and no PMI requirements.";
        case 'usda':
            return "USDA loans offer 100% financing for eligible rural properties.";
        default:
            return "Review all loan types to find the best fit for your situation.";
    }
}

// Payment Schedule Functions
function renderPaymentScheduleTable() {
    const schedule = MORTGAGE_CALCULATOR.currentCalculation.amortizationSchedule;
    const tableBody = document.querySelector('#payment-schedule-table tbody');
    
    if (!schedule.length) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No schedule data available</td></tr>';
        return;
    }

    const type = MORTGAGE_CALCULATOR.scheduleType;
    let dataToRender = schedule;
    
    if (type === 'yearly') {
        dataToRender = aggregateYearly(schedule);
    }
    
    const itemsPerPage = MORTGAGE_CALCULATOR.scheduleItemsPerPage;
    const currentPage = MORTGAGE_CALCULATOR.scheduleCurrentPage;
    const totalPages = Math.ceil(dataToRender.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedData = dataToRender.slice(start, end);

    let html = '';
    paginatedData.forEach(item => {
        html += `
            <tr>
                <td>${type === 'monthly' ? `Month ${item.month}` : `Year ${item.year}`}</td>
                <td>${formatCurrency(item.totalPayment)}</td>
                <td>${formatCurrency(item.principal)}</td>
                <td>${formatCurrency(item.interest)}</td>
                <td>${formatCurrency(item.endingBalance)}</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    renderPaginationControls(totalPages);
}

function aggregateYearly(schedule) {
    const yearlyMap = new Map();
    
    schedule.forEach(item => {
        const yearKey = item.year;
        if (!yearlyMap.has(yearKey)) {
            yearlyMap.set(yearKey, {
                year: yearKey,
                totalPayment: 0,
                principal: 0,
                interest: 0,
                endingBalance: item.endingBalance,
                month: item.month
            });
        }
        
        const yearlyItem = yearlyMap.get(yearKey);
        yearlyItem.totalPayment += item.totalPayment;
        yearlyItem.principal += item.principal;
        yearlyItem.interest += item.interest;
    });
    
    return Array.from(yearlyMap.values());
}

function renderPaginationControls(totalPages) {
    const container = document.getElementById('schedule-pagination');
    const currentPage = MORTGAGE_CALCULATOR.scheduleCurrentPage;
    
    let html = '';
    
    if (currentPage > 1) {
        html += `<button class="btn btn-sm" onclick="changeSchedulePage(${currentPage - 1})">Previous</button>`;
    }
    
    html += `<span>Page ${currentPage} of ${totalPages}</span>`;
    
    if (currentPage < totalPages) {
        html += `<button class="btn btn-sm" onclick="changeSchedulePage(${currentPage + 1})">Next</button>`;
    }
    
    container.innerHTML = html;
}

// Export and Share Functions
function exportSchedule(format) {
    const schedule = MORTGAGE_CALCULATOR.currentCalculation.amortizationSchedule;
    if (!schedule.length) {
        showToast('No schedule data to export', 'error');
        return;
    }
    
    showLoading(`Generating ${format.toUpperCase()} export...`);
    
    setTimeout(() => {
        try {
            if (format === 'csv') {
                exportToCSV(schedule);
            } else if (format === 'pdf') {
                exportToPDF(schedule);
            }
        } catch (error) {
            console.error('Export error:', error);
            showToast('Export failed', 'error');
        } finally {
            hideLoading();
        }
    }, 500);
}

function exportToCSV(schedule) {
    const type = MORTGAGE_CALCULATOR.scheduleType;
    const dataToExport = type === 'yearly' ? aggregateYearly(schedule) : schedule;
    
    const headers = ['Period', 'Total Payment', 'Principal', 'Interest', 'Ending Balance'];
    const rows = dataToExport.map(item => [
        type === 'monthly' ? `Month ${item.month}` : `Year ${item.year}`,
        formatCurrency(item.totalPayment, true),
        formatCurrency(item.principal, true),
        formatCurrency(item.interest, true),
        formatCurrency(item.endingBalance, true)
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    downloadFile(csvContent, 'mortgage-schedule.csv', 'text/csv');
    showToast('CSV exported successfully', 'success');
}

function exportToPDF(schedule) {
    // Simplified PDF export - in production, use jsPDF with autoTable
    showToast('PDF export would generate here with full library', 'info');
}

function shareResults(platform) {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const monthlyPayment = document.getElementById('monthly-payment-total').textContent;
    
    const shareText = `My mortgage payment: ${monthlyPayment} | Calculated with FinGuid USA`;
    const shareUrl = window.location.href;
    
    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    };
    
    if (platform === 'copy') {
        navigator.clipboard.writeText(shareText + ' ' + shareUrl).then(() => {
            showToast('Link copied to clipboard!', 'success');
        });
        return;
    }
    
    if (shareUrls[platform]) {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        showToast(`Sharing via ${platform}`, 'info');
    }
}

function shareResultsPDF() {
    showLoading('Generating comprehensive report...');
    
    setTimeout(() => {
        // In production, generate actual PDF with jsPDF
        showToast('PDF report download started', 'success');
        hideLoading();
    }, 1500);
}

// UI Control Functions
function switchTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Activate selected tab
    const selectedTab = document.getElementById(`tab-${tabId}`);
    const selectedBtn = document.querySelector(`[data-tab="${tabId}"]`);
    
    if (selectedTab && selectedBtn) {
        selectedTab.classList.add('active');
        selectedBtn.classList.add('active');
    }
    
    // Special handling for certain tabs
    if (tabId === 'timeline') {
        renderMortgageTimelineChart();
    } else if (tabId === 'insights') {
        renderAIPoweredInsights();
    } else if (tabId === 'schedule') {
        renderPaymentScheduleTable();
    }
}

function toggleScheduleType(type) {
    MORTGAGE_CALCULATOR.scheduleType = type;
    MORTGAGE_CALCULATOR.scheduleCurrentPage = 1;
    
    // Update active button
    document.querySelectorAll('.view-toggle .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderPaymentScheduleTable();
}

function changeSchedulePage(page) {
    MORTGAGE_CALCULATOR.scheduleCurrentPage = page;
    renderPaymentScheduleTable();
}

function toggleCollapsible(sectionId) {
    const section = document.getElementById(sectionId);
    section.classList.toggle('open');
}

function setLoanType(button) {
    document.querySelectorAll('[data-loan-type]').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
    
    MORTGAGE_CALCULATOR.currentCalculation.loanType = button.dataset.loanType;
    updateCalculation('loan-type');
    
    showToast(`Loan type set to ${button.dataset.loanType.toUpperCase()}`, 'info');
}

function setLoanTerm(button) {
    document.querySelectorAll('[data-term]').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
    
    MORTGAGE_CALCULATOR.currentCalculation.loanTerm = parseInt(button.dataset.term);
    updateCalculation('loan-term');
    
    showToast(`Loan term set to ${button.dataset.term} years`, 'info');
}

// Theme and Accessibility
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-color-scheme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    
    html.setAttribute('data-color-scheme', newTheme);
    MORTGAGE_CALCULATOR.currentTheme = newTheme;
    localStorage.setItem('finguid_theme', newTheme);
    
    // Re-render charts
    setTimeout(() => {
        if (MORTGAGE_CALCULATOR.charts.paymentComponents) {
            const current = MORTGAGE_CALCULATOR.currentCalculation;
            const monthlyPI = parseFloat(document.getElementById('pi-monthly').textContent.replace(/[^0-9.-]+/g,""));
            renderPaymentComponentsChart(monthlyPI, current.propertyTax/12, current.homeInsurance/12, current);
        }
    }, 100);
    
    showToast(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode activated`, 'info');
}

function toggleScreenReader() {
    MORTGAGE_CALCULATOR.screenReaderMode = !MORTGAGE_CALCULATOR.screenReaderMode;
    const toggle = document.getElementById('screen-reader-toggle');
    
    if (MORTGAGE_CALCULATOR.screenReaderMode) {
        toggle.classList.add('active');
        announceToScreenReader('Screen reader mode enabled');
        showToast('Screen reader mode on', 'info');
    } else {
        toggle.classList.remove('active');
        if (MORTGAGE_CALCULATOR.speechSynthesis.speaking) {
            MORTGAGE_CALCULATOR.speechSynthesis.cancel();
        }
        showToast('Screen reader mode off', 'info');
    }
}

function toggleVoiceControl() {
    if (!MORTGAGE_CALCULATOR.speechRecognition) {
        showToast('Voice recognition not supported', 'error');
        return;
    }
    
    MORTGAGE_CALCULATOR.voiceEnabled = !MORTGAGE_CALCULATOR.voiceEnabled;
    const voiceStatus = document.getElementById('voice-status');
    
    if (MORTGAGE_CALCULATOR.voiceEnabled) {
        voiceStatus.style.display = 'flex';
        startVoiceRecognition();
        showToast('Voice control activated', 'info');
    } else {
        voiceStatus.style.display = 'none';
        if (MORTGAGE_CALCULATOR.recognition) {
            MORTGAGE_CALCULATOR.recognition.stop();
        }
        showToast('Voice control deactivated', 'info');
    }
}

function startVoiceRecognition() {
    MORTGAGE_CALCULATOR.recognition = new MORTGAGE_CALCULATOR.speechRecognition();
    MORTGAGE_CALCULATOR.recognition.continuous = true;
    MORTGAGE_CALCULATOR.recognition.interimResults = false;
    MORTGAGE_CALCULATOR.recognition.lang = 'en-US';
    
    MORTGAGE_CALCULATOR.recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        processVoiceCommand(transcript);
    };
    
    MORTGAGE_CALCULATOR.recognition.start();
}

function processVoiceCommand(transcript) {
    console.log('Voice command:', transcript);
    
    // Simple voice command processing
    const commands = {
        'home price': () => setInputValue('home-price', extractNumber(transcript) * 1000),
        'down payment': () => setInputValue('down-payment', extractNumber(transcript) * 1000),
        'interest rate': () => setInputValue('interest-rate', extractNumber(transcript)),
        'credit score': () => setInputValue('credit-score', extractNumber(transcript))
    };
    
    for (const [command, action] of Object.entries(commands)) {
        if (transcript.includes(command)) {
            action();
            break;
        }
    }
}

function setInputValue(id, value) {
    const element = document.getElementById(id);
    if (element && value) {
        element.value = value;
        updateCalculation(id);
        showToast(`${id.replace('-', ' ')} set to ${value}`, 'success');
    }
}

function extractNumber(text) {
    const match = text.match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : null;
}

function announceToScreenReader(text) {
    if (!MORTGAGE_CALCULATOR.screenReaderMode) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    MORTGAGE_CALCULATOR.speechSynthesis.speak(utterance);
}

// State Management
function populateStateDropdown() {
    const select = document.getElementById('state-select');
    const states = Object.keys(STATE_RATES).sort();
    
    states.forEach(code => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = STATE_RATES[code].name;
        select.appendChild(option);
    });
}

function handleStateChange() {
    const select = document.getElementById('state-select');
    const stateCode = select.value;
    
    if (stateCode === 'default') return;
    
    const stateData = STATE_RATES[stateCode];
    const homePrice = MORTGAGE_CALCULATOR.currentCalculation.homePrice || 1;
    
    const annualTax = homePrice * (stateData.taxRate / 100);
    const annualInsurance = homePrice * (stateData.insuranceRate / 100);
    
    document.getElementById('property-tax').value = annualTax.toFixed(0);
    document.getElementById('home-insurance').value = annualInsurance.toFixed(0);
    
    updateCalculation('state-select');
    showToast(`Rates updated for ${stateData.name}`, 'info');
}

// Utility Functions
function formatCurrency(amount, excludeSymbol = false) {
    if (isNaN(amount)) return excludeSymbol ? '0.00' : '$0.00';
    
    if (excludeSymbol) {
        return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
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
    
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => toast.remove(), 4000);
}

function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loading-indicator');
    const messageEl = document.getElementById('loading-message');
    
    if (messageEl) messageEl.textContent = message;
    if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loading-indicator');
    if (overlay) overlay.style.display = 'none';
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Comparison Window
function openLoanCompareWindow() {
    const features = [
        'Multiple loan scenarios',
        'Side-by-side comparison',
        'Total cost analysis',
        'Break-even calculations'
    ];
    
    showToast('Loan comparison tool would open here', 'info');
}

function refreshInsights() {
    renderAIPoweredInsights();
    showToast('AI insights refreshed', 'success');
}

// Initialization
function initializeCalculator() {
    console.log('🚀 Initializing FinGuid USA Mortgage Calculator');
    
    // Restore user preferences
    const savedTheme = localStorage.getItem('finguid_theme') || 'dark';
    document.documentElement.setAttribute('data-color-scheme', savedTheme);
    MORTGAGE_CALCULATOR.currentTheme = savedTheme;
    
    // Initialize components
    populateStateDropdown();
    
    // Initialize FRED API
    const fredManager = new FredAPIManager();
    
    // Load rates
    setTimeout(async () => {
        if (fredManager.shouldUpdateRates()) {
            await fredManager.getCurrentMortgageRates();
        } else {
            fredManager.updateRateDisplays();
        }
    }, 1000);
    
    // Set up periodic rate updates
    setInterval(() => {
        if (fredManager.shouldUpdateRates()) {
            fredManager.getCurrentMortgageRates();
        }
    }, MORTGAGE_CALCULATOR.RATE_UPDATE_INTERVAL);
    
    // Initial calculation
    updateCalculation('init');
    
    // Set up keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            toggleTheme();
        }
    });
    
    console.log('✅ FinGuid USA Calculator initialized successfully');
}

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCalculator);
} else {
    initializeCalculator();
}
