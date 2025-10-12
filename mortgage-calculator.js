/* ========================================================================== */
/* HOME LOAN PRO - AI MORTGAGE CALCULATOR - ENHANCED JS v26.0               */
/* PRESERVING ALL ORIGINAL FUNCTIONALITY + NEW FEATURES IMPLEMENTED         */
/* Functional Dark Mode, ZIP/State Logic, Chart/Schedule Fixes, Tabs UI     */
/* ========================================================================== */

// ========================================================================== //
// GLOBAL CONFIGURATION & STATE MANAGEMENT
// ========================================================================== //
const MORTGAGE_CALCULATOR = {
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    RATE_UPDATE_INTERVAL: 60 * 60 * 1000, // 1 hour
    charts: { paymentComponents: null, mortgageTimeline: null },
    currentCalculation: {
        homePrice: 450000,
        downPayment: 90000,
        downPaymentPercent: 20,
        interestRate: 6.44,
        loanTerm: 30,
        loanType: 'conventional',
        propertyTax: 9000,
        homeInsurance: 1800,
    },
    amortizationSchedule: [],
    scheduleCurrentPage: 0,
    scheduleItemsPerPage: 12,
    scheduleType: 'monthly',
    fontScaleOptions: [0.75, 0.875, 1, 1.125, 1.25],
    currentFontScaleIndex: 2,
};

// ========================================================================== //
// LOCATION & TAX DATABASE (ZIP CODES)
// ========================================================================== //
const LOCATION_DATA = {
    zipCodes: new Map(),
    states: new Map(),

    async initialize() {
        // In a real production environment, this would fetch a comprehensive JSON file.
        // For this example, we're using a larger sample set directly.
        // To use an external file:
        // const response = await fetch('path/to/zipcodes.json');
        // const zipData = await response.json();
        const zipData = this.getSampleZipData();

        zipData.forEach(data => {
            this.zipCodes.set(data.zip, data);
            if (!this.states.has(data.state)) {
                this.states.set(data.state, {
                    state: data.state,
                    stateName: data.stateName,
                    propertyTaxRate: data.propertyTaxRate,
                    insuranceRate: data.insuranceRate
                });
            }
        });
        console.log(`🇺🇸 ZIP Code Database initialized with ${this.zipCodes.size} sample codes.`);
        this.populateStateDropdown();
    },

    populateStateDropdown() {
        const stateDropdown = document.getElementById('state');
        if (!stateDropdown) return;
        stateDropdown.innerHTML = '<option value="">Select State</option>';
        const sortedStates = [...this.states.values()].sort((a, b) => a.stateName.localeCompare(b.stateName));
        sortedStates.forEach(data => {
            const option = document.createElement('option');
            option.value = data.state;
            option.textContent = data.stateName;
            stateDropdown.appendChild(option);
        });
    },

    lookupZip(zipCode) {
        if (zipCode.length !== 5) return null;
        return this.zipCodes.get(zipCode) || null;
    },

    lookupState(stateAbbr) {
        return this.states.get(stateAbbr) || null;
    },
    
    // Provides a sample dataset. For production, load this from a separate JSON file.
    getSampleZipData() {
        return [
            { zip: '10001', city: 'New York', state: 'NY', stateName: 'New York', propertyTaxRate: 0.0125, insuranceRate: 0.004 },
            { zip: '02108', city: 'Boston', state: 'MA', stateName: 'Massachusetts', propertyTaxRate: 0.0117, insuranceRate: 0.0055 },
            { zip: '90210', city: 'Beverly Hills', state: 'CA', stateName: 'California', propertyTaxRate: 0.0075, insuranceRate: 0.006 },
            { zip: '33101', city: 'Miami', state: 'FL', stateName: 'Florida', propertyTaxRate: 0.0102, insuranceRate: 0.012 },
            { zip: '60601', city: 'Chicago', state: 'IL', stateName: 'Illinois', propertyTaxRate: 0.0205, insuranceRate: 0.005 },
            { zip: '77001', city: 'Houston', state: 'TX', stateName: 'Texas', propertyTaxRate: 0.0181, insuranceRate: 0.007 },
            { zip: '80202', city: 'Denver', state: 'CO', stateName: 'Colorado', propertyTaxRate: 0.0051, insuranceRate: 0.0055 },
            { zip: '98101', city: 'Seattle', state: 'WA', stateName: 'Washington', propertyTaxRate: 0.0092, insuranceRate: 0.0045 },
            // Add more sample data for all 50 states to populate the dropdown
            { zip: '35203', city: 'Birmingham', state: 'AL', stateName: 'Alabama', propertyTaxRate: 0.0040, insuranceRate: 0.0065 },
            { zip: '99701', city: 'Fairbanks', state: 'AK', stateName: 'Alaska', propertyTaxRate: 0.0119, insuranceRate: 0.0050 },
            { zip: '85001', city: 'Phoenix', state: 'AZ', stateName: 'Arizona', propertyTaxRate: 0.0062, insuranceRate: 0.0080 },
            { zip: '72201', city: 'Little Rock', state: 'AR', stateName: 'Arkansas', propertyTaxRate: 0.0062, insuranceRate: 0.0075 },
            { zip: '06103', city: 'Hartford', state: 'CT', stateName: 'Connecticut', propertyTaxRate: 0.0214, insuranceRate: 0.0050 },
            { zip: '19901', city: 'Dover', state: 'DE', stateName: 'Delaware', propertyTaxRate: 0.0057, insuranceRate: 0.0040 },
            { zip: '30303', city: 'Atlanta', state: 'GA', stateName: 'Georgia', propertyTaxRate: 0.0083, insuranceRate: 0.0065 },
            { zip: '96813', city: 'Honolulu', state: 'HI', stateName: 'Hawaii', propertyTaxRate: 0.0028, insuranceRate: 0.0090 },
            { zip: '83702', city: 'Boise', state: 'ID', stateName: 'Idaho', propertyTaxRate: 0.0063, insuranceRate: 0.0045 },
            { zip: '46204', city: 'Indianapolis', state: 'IN', stateName: 'Indiana', propertyTaxRate: 0.0081, insuranceRate: 0.0050 },
            { zip: '50309', city: 'Des Moines', state: 'IA', stateName: 'Iowa', propertyTaxRate: 0.0153, insuranceRate: 0.0055 },
            { zip: '66603', city: 'Topeka', state: 'KS', stateName: 'Kansas', propertyTaxRate: 0.0137, insuranceRate: 0.0070 },
            { zip: '40601', city: 'Frankfort', state: 'KY', stateName: 'Kentucky', propertyTaxRate: 0.0083, insuranceRate: 0.0060 },
            { zip: '70802', city: 'Baton Rouge', state: 'LA', stateName: 'Louisiana', propertyTaxRate: 0.0053, insuranceRate: 0.0100 },
            { zip: '04330', city: 'Augusta', state: 'ME', stateName: 'Maine', propertyTaxRate: 0.0128, insuranceRate: 0.0045 },
            { zip: '21401', city: 'Annapolis', state: 'MD', stateName: 'Maryland', propertyTaxRate: 0.0106, insuranceRate: 0.0040 },
            { zip: '48933', city: 'Lansing', state: 'MI', stateName: 'Michigan', propertyTaxRate: 0.0154, insuranceRate: 0.0055 },
            { zip: '55102', city: 'Saint Paul', state: 'MN', stateName: 'Minnesota', propertyTaxRate: 0.0111, insuranceRate: 0.0060 },
            { zip: '39201', city: 'Jackson', state: 'MS', stateName: 'Mississippi', propertyTaxRate: 0.0081, insuranceRate: 0.0085 },
            { zip: '65101', city: 'Jefferson City', state: 'MO', stateName: 'Missouri', propertyTaxRate: 0.0095, insuranceRate: 0.0065 },
            { zip: '59601', city: 'Helena', state: 'MT', stateName: 'Montana', propertyTaxRate: 0.0083, insuranceRate: 0.0050 },
            { zip: '68508', city: 'Lincoln', state: 'NE', stateName: 'Nebraska', propertyTaxRate: 0.0161, insuranceRate: 0.0070 },
            { zip: '89701', city: 'Carson City', state: 'NV', stateName: 'Nevada', propertyTaxRate: 0.0053, insuranceRate: 0.0065 },
            { zip: '03301', city: 'Concord', state: 'NH', stateName: 'New Hampshire', propertyTaxRate: 0.0205, insuranceRate: 0.0040 },
            { zip: '08608', city: 'Trenton', state: 'NJ', stateName: 'New Jersey', propertyTaxRate: 0.0249, insuranceRate: 0.0045 },
            { zip: '87501', city: 'Santa Fe', state: 'NM', stateName: 'New Mexico', propertyTaxRate: 0.0078, insuranceRate: 0.0060 },
            { zip: '27601', city: 'Raleigh', state: 'NC', stateName: 'North Carolina', propertyTaxRate: 0.0084, insuranceRate: 0.0060 },
            { zip: '58501', city: 'Bismarck', state: 'ND', stateName: 'North Dakota', propertyTaxRate: 0.0099, insuranceRate: 0.0065 },
            { zip: '43215', city: 'Columbus', state: 'OH', stateName: 'Ohio', propertyTaxRate: 0.0156, insuranceRate: 0.0045 },
            { zip: '73102', city: 'Oklahoma City', state: 'OK', stateName: 'Oklahoma', propertyTaxRate: 0.0087, insuranceRate: 0.0095 },
            { zip: '97301', city: 'Salem', state: 'OR', stateName: 'Oregon', propertyTaxRate: 0.0105, insuranceRate: 0.0050 },
            { zip: '17101', city: 'Harrisburg', state: 'PA', stateName: 'Pennsylvania', propertyTaxRate: 0.0158, insuranceRate: 0.0035 },
            { zip: '02903', city: 'Providence', state: 'RI', stateName: 'Rhode Island', propertyTaxRate: 0.0153, insuranceRate: 0.0050 },
            { zip: '29201', city: 'Columbia', state: 'SC', stateName: 'South Carolina', propertyTaxRate: 0.0057, insuranceRate: 0.0070 },
            { zip: '57501', city: 'Pierre', state: 'SD', stateName: 'South Dakota', propertyTaxRate: 0.0122, insuranceRate: 0.0075 },
            { zip: '37219', city: 'Nashville', state: 'TN', stateName: 'Tennessee', propertyTaxRate: 0.0064, insuranceRate: 0.0065 },
            { zip: '84111', city: 'Salt Lake City', state: 'UT', stateName: 'Utah', propertyTaxRate: 0.0058, insuranceRate: 0.0045 },
            { zip: '05602', city: 'Montpelier', state: 'VT', stateName: 'Vermont', propertyTaxRate: 0.0186, insuranceRate: 0.0040 },
            { zip: '23219', city: 'Richmond', state: 'VA', stateName: 'Virginia', propertyTaxRate: 0.0082, insuranceRate: 0.0050 },
            { zip: '25301', city: 'Charleston', state: 'WV', stateName: 'West Virginia', propertyTaxRate: 0.0058, insuranceRate: 0.0055 },
            { zip: '53703', city: 'Madison', state: 'WI', stateName: 'Wisconsin', propertyTaxRate: 0.0176, insuranceRate: 0.0050 },
            { zip: '82001', city: 'Cheyenne', state: 'WY', stateName: 'Wyoming', propertyTaxRate: 0.0061, insuranceRate: 0.0055 }
        ];
    }
};

// ========================================================================== //
// FRED API INTEGRATION FOR LIVE RATES
// ========================================================================== //
class FredAPIManager {
    constructor() {
        this.apiKey = MORTGAGE_CALCULATOR.FRED_API_KEY;
        this.baseUrl = 'https://api.stlouisfed.org/fred/series/observations';
        this.cache = { rate: null, date: null };
        this.lastUpdate = 0;
    }

    async updateLiveRates() {
        const now = Date.now();
        if (now - this.lastUpdate < MORTGAGE_CALCULATOR.RATE_UPDATE_INTERVAL) {
            return; // Don't fetch if updated within the last hour
        }
        
        showLoadingIndicator('Fetching live rates...');
        try {
            const seriesId = 'MORTGAGE30US';
            const url = `${this.baseUrl}?series_id=${seriesId}&api_key=${this.apiKey}&file_type=json&limit=1&sort_order=desc`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`FRED API Error: ${response.status}`);
            const data = await response.json();

            if (data.observations && data.observations.length > 0) {
                const rate = parseFloat(data.observations[0].value);
                if (isNaN(rate) || rate < 1 || rate > 20) throw new Error('Invalid rate data');
                
                this.cache = { rate, date: data.observations[0].date };
                this.lastUpdate = now;

                document.getElementById('interest-rate').value = rate.toFixed(2);
                this.updateRateDisplay(rate, this.cache.date);
                showToast(`✅ Live rate updated: ${rate.toFixed(2)}%`, 'success');
                calculateMortgage();
            } else {
                throw new Error('No observations found');
            }
        } catch (error) {
            console.error('🚫 FRED API Error:', error);
            showToast('⚠️ Could not fetch live rates.', 'warning');
        } finally {
            hideLoadingIndicator();
        }
    }

    updateRateDisplay(rate, rateDate) {
        const liveBadge = document.querySelector('.live-rate-badge');
        if (liveBadge) liveBadge.innerHTML = `<i class="fas fa-circle live-icon"></i> LIVE: ${rate.toFixed(2)}%`;
        
        const federalAttribution = document.querySelector('.federal-attribution');
        if (federalAttribution) {
            const updateDate = new Date(rateDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            federalAttribution.textContent = `Data from Federal Reserve (FRED) - Updated: ${updateDate}`;
        }
    }

    startAutomaticUpdates() {
        this.updateLiveRates(); // Initial fetch
        setInterval(() => this.updateLiveRates(), MORTGAGE_CALCULATOR.RATE_UPDATE_INTERVAL);
    }
}
const fredAPI = new FredAPIManager();

// ========================================================================== //
// MORTGAGE CALCULATION ENGINE
// ========================================================================== //
function calculateMortgage() {
    const inputs = gatherInputs();
    Object.assign(MORTGAGE_CALCULATOR.currentCalculation, inputs);

    const { homePrice, downPayment, interestRate, loanTerm, loanType } = inputs;
    const loanAmount = homePrice - downPayment;
    const ltv = (loanAmount / homePrice) * 100;
    
    // Auto-calculate PMI
    let pmi = 0;
    if (loanType === 'conventional' && ltv > 80) {
        const creditScore = parseInt(document.getElementById('credit-score').value);
        let pmiRate = (creditScore >= 740) ? 0.0035 : (creditScore >= 670) ? 0.0055 : 0.0085;
        pmi = loanAmount * pmiRate;
    }
    document.getElementById('pmi').value = formatCurrencyInput(pmi, 0);
    showPMIStatus(pmi > 0, ltv, pmi);

    // Monthly Calculations
    const monthlyPI = calculateMonthlyPI(loanAmount, interestRate, loanTerm);
    const monthlyTax = inputs.propertyTax / 12;
    const monthlyInsurance = inputs.homeInsurance / 12;
    const monthlyPMI = pmi / 12;
    const monthlyHOA = inputs.hoaFees;
    const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA;
    
    // Total Calculations
    const totalPayments = monthlyPI * loanTerm * 12;
    const totalInterest = totalPayments - loanAmount;
    const totalCost = homePrice + totalInterest;

    // Update state
    Object.assign(MORTGAGE_CALCULATOR.currentCalculation, { loanAmount, pmi, totalMonthly, totalInterest, totalCost });
    
    updateDisplay({ totalMonthly, monthlyPI, monthlyTax, monthlyInsurance, monthlyPMI, monthlyHOA, loanAmount, totalInterest, totalCost, loanTerm });
    generateAmortizationSchedule();
    updateAllCharts();
    generateAIInsights();
    announceToScreenReader(`Payment calculated: ${formatCurrency(totalMonthly)} per month.`);
}

function gatherInputs() {
    return {
        homePrice: parseCurrency(document.getElementById('home-price').value),
        downPayment: parseCurrency(document.getElementById('down-payment').value),
        interestRate: parseFloat(document.getElementById('interest-rate').value),
        loanTerm: parseInt(document.querySelector('.term-chip.active')?.dataset.term) || parseInt(document.getElementById('custom-term').value) || 30,
        loanType: document.querySelector('.loan-type-btn.active')?.dataset.loanType || 'conventional',
        propertyTax: parseCurrency(document.getElementById('property-tax').value),
        homeInsurance: parseCurrency(document.getElementById('home-insurance').value),
        hoaFees: parseCurrency(document.getElementById('hoa-fees').value),
    };
}

function calculateMonthlyPI(principal, annualRate, years) {
    if (principal <= 0) return 0;
    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;
    if (monthlyRate === 0) return principal / numPayments;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
}

// ========================================================================== //
// UI UPDATE & DISPLAY FUNCTIONS
// ========================================================================== //
function updateDisplay(data) {
    document.getElementById('total-payment').textContent = formatCurrency(data.totalMonthly);
    document.getElementById('pi-summary').textContent = `${formatCurrency(data.monthlyPI)} P&I`;
    const escrow = data.monthlyTax + data.monthlyInsurance + (data.monthlyPMI || 0) + (data.monthlyHOA || 0);
    document.getElementById('escrow-summary').textContent = `${formatCurrency(escrow)} Escrow`;
    
    document.getElementById('loan-amount-summary').textContent = formatCurrency(data.loanAmount);
    document.getElementById('total-interest-summary').textContent = formatCurrency(data.totalInterest);
    document.getElementById('total-cost-summary').textContent = formatCurrency(data.totalCost);
    
    const payoffDate = new Date();
    payoffDate.setFullYear(payoffDate.getFullYear() + data.loanTerm);
    document.getElementById('payoff-date-summary').textContent = payoffDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

    document.getElementById('chart-subtitle').textContent = `Loan: ${formatCurrency(data.loanAmount)} | Term: ${data.loanTerm} years | Rate: ${MORTGAGE_CALCULATOR.currentCalculation.interestRate}%`;
}

function showPMIStatus(required, ltv, amount) {
    const statusEl = document.getElementById('pmi-status');
    statusEl.classList.add('show');
    if (required) {
        statusEl.className = 'pmi-status show active';
        statusEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> PMI Required: ${ltv.toFixed(1)}% LTV (${formatCurrency(amount/12)}/mo)`;
    } else {
        statusEl.className = 'pmi-status show inactive';
        statusEl.innerHTML = `<i class="fas fa-check-circle"></i> No PMI Required: ${ltv.toFixed(1)}% LTV`;
    }
}

// ========================================================================== //
// CHARTS & SCHEDULES
// ========================================================================== //
function updateAllCharts() {
    updatePaymentComponentsChart();
    updateMortgageTimelineChart();
}

function updatePaymentComponentsChart() {
    const ctx = document.getElementById('payment-components-chart').getContext('2d');
    if (MORTGAGE_CALCULATOR.charts.paymentComponents) {
        MORTGAGE_CALCULATOR.charts.paymentComponents.destroy();
    }
    const { loanAmount, interestRate, loanTerm, propertyTax, homeInsurance, pmi, hoaFees } = MORTGAGE_CALCULATOR.currentCalculation;
    
    const data = {
        labels: ['P&I', 'Property Tax', 'Insurance', 'PMI', 'HOA'],
        datasets: [{
            data: [
                calculateMonthlyPI(loanAmount, interestRate, loanTerm),
                propertyTax / 12,
                homeInsurance / 12,
                pmi / 12,
                hoaFees
            ],
            backgroundColor: ['#14b8a6', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'],
        }]
    };
    
    MORTGAGE_CALCULATOR.charts.paymentComponents = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function updateMortgageTimelineChart() {
    const ctx = document.getElementById('mortgage-timeline-chart').getContext('2d');
    if (MORTGAGE_CALCULATOR.charts.mortgageTimeline) {
        MORTGAGE_CALCULATOR.charts.mortgageTimeline.destroy();
    }
    const schedule = MORTGAGE_CALCULATOR.amortizationSchedule;
    if (!schedule.length) return;

    const yearlyData = schedule.filter((_, i) => (i + 1) % 12 === 0 || i === schedule.length - 1);
    const labels = yearlyData.map((_, i) => `Year ${i + 1}`);
    const balanceData = yearlyData.map(p => p.remainingBalance);
    const principalPaidData = yearlyData.map(p => MORTGAGE_CALCULATOR.currentCalculation.loanAmount - p.remainingBalance);

    MORTGAGE_CALCULATOR.charts.mortgageTimeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Remaining Balance', data: balanceData, borderColor: '#ef4444', fill: true, backgroundColor: 'rgba(239, 68, 68, 0.1)', tension: 0.3 },
                { label: 'Principal Paid', data: principalPaidData, borderColor: '#14b8a6', fill: true, backgroundColor: 'rgba(20, 184, 166, 0.1)', tension: 0.3 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

function generateAmortizationSchedule() {
    const { loanAmount, interestRate, loanTerm } = MORTGAGE_CALCULATOR.currentCalculation;
    const monthlyPayment = calculateMonthlyPI(loanAmount, interestRate, loanTerm);
    let balance = loanAmount;
    const schedule = [];
    const monthlyRate = interestRate / 100 / 12;

    for (let i = 1; i <= loanTerm * 12; i++) {
        const interestPayment = balance * monthlyRate;
        let principalPayment = monthlyPayment - interestPayment;
        if (balance < monthlyPayment) principalPayment = balance - interestPayment;
        balance -= principalPayment;
        if (balance < 0) balance = 0;
        
        const paymentDate = new Date();
        paymentDate.setMonth(paymentDate.getMonth() + i);

        schedule.push({
            paymentNumber: i,
            paymentDate,
            paymentAmount: monthlyPayment,
            principalPayment,
            interestPayment,
            remainingBalance: balance,
        });
        if (balance === 0) break;
    }
    MORTGAGE_CALCULATOR.amortizationSchedule = schedule;
    updateScheduleDisplay();
}

function updateScheduleDisplay() {
    const tableBody = document.getElementById('schedule-tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    
    const { schedule, scheduleType, scheduleCurrentPage, scheduleItemsPerPage } = MORTGAGE_CALCULATOR;
    const displaySchedule = scheduleType === 'yearly' ? schedule.filter((item, index) => (index + 1) % 12 === 0 || index === schedule.length - 1) : schedule;
    
    const startIndex = scheduleCurrentPage * scheduleItemsPerPage;
    const pageItems = displaySchedule.slice(startIndex, startIndex + scheduleItemsPerPage);

    pageItems.forEach(item => {
        const row = tableBody.insertRow();
        const displayNum = scheduleType === 'yearly' ? Math.ceil(item.paymentNumber / 12) : item.paymentNumber;
        row.innerHTML = `
            <td>${displayNum}</td>
            <td>${item.paymentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</td>
            <td>${formatCurrency(item.paymentAmount)}</td>
            <td>${formatCurrency(item.principalPayment)}</td>
            <td>${formatCurrency(item.interestPayment)}</td>
            <td>${formatCurrency(item.remainingBalance)}</td>
        `;
    });
    updateSchedulePagination(displaySchedule.length);
}

function updateSchedulePagination(totalItems) {
    const { scheduleCurrentPage, scheduleItemsPerPage } = MORTGAGE_CALCULATOR;
    const totalPages = Math.ceil(totalItems / scheduleItemsPerPage);
    
    document.getElementById('pagination-info').textContent = `Page ${scheduleCurrentPage + 1} of ${totalPages}`;
    document.getElementById('prev-page').disabled = scheduleCurrentPage === 0;
    document.getElementById('next-page').disabled = scheduleCurrentPage >= totalPages - 1;
}

function changePage(direction) {
    MORTGAGE_CALCULATOR.scheduleCurrentPage += direction;
    updateScheduleDisplay();
}

function toggleScheduleType(type) {
    MORTGAGE_CALCULATOR.scheduleType = type;
    MORTGAGE_CALCULATOR.scheduleCurrentPage = 0;
    document.querySelectorAll('.schedule-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.schedule === type));
    updateScheduleDisplay();
}

// ========================================================================== //
// AI INSIGHTS
// ========================================================================== //
function generateAIInsights() {
    const container = document.getElementById('insights-container');
    if (!container) return;
    const calc = MORTGAGE_CALCULATOR.currentCalculation;
    let insightsHTML = '';

    // Down Payment Insight
    if (calc.downPaymentPercent < 20) {
        insightsHTML += `<div class="insight-item"><h4 class="insight-title"><i class="fas fa-piggy-bank"></i>PMI Impact</h4><p>Increasing your down payment to 20% would eliminate ~$${(calc.pmi/12).toFixed(0)}/month in PMI.</p></div>`;
    } else {
        insightsHTML += `<div class="insight-item"><h4 class="insight-title"><i class="fas fa-check-circle"></i>Great Down Payment</h4><p>Your ${calc.downPaymentPercent.toFixed(1)}% down payment helps you avoid PMI and build equity faster.</p></div>`;
    }

    // Interest Rate Insight
    if (calc.interestRate > 7.0) {
        insightsHTML += `<div class="insight-item"><h4 class="insight-title"><i class="fas fa-chart-line"></i>Refinance Opportunity</h4><p>Your rate is higher than average. Improving your credit score could help you refinance to a lower rate in the future, saving thousands.</p></div>`;
    }

    // Loan Term Insight
    if (calc.loanTerm === 30) {
        const shorterTermPI = calculateMonthlyPI(calc.loanAmount, calc.interestRate - 0.25, 15);
        const interestSaved = calc.totalInterest - ((shorterTermPI * 15 * 12) - calc.loanAmount);
        insightsHTML += `<div class="insight-item"><h4 class="insight-title"><i class="fas fa-forward"></i>Faster Payoff</h4><p>Consider a 15-year term. Though the monthly payment is higher, you could save over ${formatCurrency(interestSaved)} in interest.</p></div>`;
    }
    
    container.innerHTML = insightsHTML || '<p>Enter your details to see personalized AI insights.</p>';
}

// ========================================================================== //
// USER INPUT HANDLERS & SYNC
// ========================================================================== //
function syncDownPaymentDollar() {
    const dpAmount = parseCurrency(document.getElementById('down-payment').value);
    const homePrice = parseCurrency(document.getElementById('home-price').value);
    if (homePrice > 0) {
        const percentage = (dpAmount / homePrice) * 100;
        document.getElementById('down-payment-percent').value = percentage.toFixed(1);
        updateDownPaymentChips(percentage);
        calculateMortgage();
    }
}

function syncDownPaymentPercent() {
    const percentage = parseFloat(document.getElementById('down-payment-percent').value);
    const homePrice = parseCurrency(document.getElementById('home-price').value);
    if (homePrice > 0 && percentage >= 0) {
        const dpAmount = (homePrice * percentage) / 100;
        document.getElementById('down-payment').value = formatCurrencyInput(dpAmount);
        updateDownPaymentChips(percentage);
        calculateMortgage();
    }
}

function setDownPaymentChip(percentage) {
    document.getElementById('down-payment-percent').value = percentage.toString();
    syncDownPaymentPercent();
}

function updateDownPaymentChips(percentage) {
    document.querySelectorAll('.percentage-chip').forEach(chip => {
        const chipValue = parseFloat(chip.querySelector('.chip-value').textContent);
        chip.classList.toggle('active', Math.abs(chipValue - percentage) < 0.1);
    });
}

function selectTerm(years) {
    document.querySelectorAll('.term-chip').forEach(chip => chip.classList.toggle('active', parseInt(chip.dataset.term) === years));
    document.getElementById('custom-term').value = '';
    calculateMortgage();
}

function selectCustomTerm() {
    const customTerm = document.getElementById('custom-term').value;
    if (customTerm && parseInt(customTerm) >= 5) {
        document.querySelectorAll('.term-chip').forEach(chip => chip.classList.remove('active'));
        calculateMortgage();
    }
}

function selectLoanType(type) {
    document.querySelectorAll('.loan-type-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.loanType === type));
    calculateMortgage();
}

function handleLocationUpdate(source) {
    const homePrice = parseCurrency(document.getElementById('home-price').value);
    let locationData;

    if (source === 'zip') {
        const zip = document.getElementById('zip-code').value;
        locationData = LOCATION_DATA.lookupZip(zip);
        if (locationData) {
            document.getElementById('state').value = locationData.state;
            document.getElementById('location-display').textContent = `${locationData.city}, ${locationData.stateName}`;
        } else {
             document.getElementById('location-display').textContent = 'ZIP not found. Using state average.';
             const stateAbbr = document.getElementById('state').value;
             locationData = LOCATION_DATA.lookupState(stateAbbr);
        }
    } else { // source is 'state'
        const stateAbbr = document.getElementById('state').value;
        locationData = LOCATION_DATA.lookupState(stateAbbr);
         document.getElementById('location-display').textContent = 'Estimates based on state average.';
    }

    if (locationData && homePrice > 0) {
        document.getElementById('property-tax').value = formatCurrencyInput(homePrice * locationData.propertyTaxRate, 0);
        document.getElementById('home-insurance').value = formatCurrencyInput(homePrice * locationData.insuranceRate, 0);
    }
    calculateMortgage();
}


// ========================================================================== //
// ACCESSIBILITY & UTILITY
// ========================================================================== //
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-color-scheme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-color-scheme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.className = newTheme === 'dark' ? 'fas fa-sun theme-icon' : 'fas fa-moon theme-icon';
    document.querySelector('#theme-toggle .control-label').textContent = newTheme === 'dark' ? 'Light' : 'Dark';
    
    // Re-render charts for new theme colors
    setTimeout(updateAllCharts, 10);
}

function adjustFontSize(action) {
    let i = MORTGAGE_CALCULATOR.currentFontScaleIndex;
    if (action === 'increase' && i < MORTGAGE_CALCULATOR.fontScaleOptions.length - 1) i++;
    if (action === 'decrease' && i > 0) i--;
    if (action === 'reset') i = 2;
    MORTGAGE_CALCULATOR.currentFontScaleIndex = i;
    const newScale = MORTGAGE_CALCULATOR.fontScaleOptions[i];
    document.body.className = `font-scale-${Math.round(newScale * 100)}`;
    localStorage.setItem('fontSize', newScale);
}

function setupTabs() {
    const tabContainer = document.querySelector('.results-section');
    tabContainer.addEventListener('click', (e) => {
        if (e.target.matches('.tab-btn')) {
            const targetPaneId = e.target.getAttribute('aria-controls');
            
            tabContainer.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            e.target.classList.add('active');
            e.target.setAttribute('aria-selected', 'true');

            tabContainer.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.toggle('active', pane.id === targetPaneId);
            });
        }
    });
}


function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}
function formatCurrencyInput(amount, digits = 2) {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false }).format(amount).replace(/,/g, '');
}
function parseCurrency(value) {
    return parseFloat(value.toString().replace(/[^0-9.-]+/g, '')) || 0;
}
function showLoadingIndicator(message = 'Loading...') { document.getElementById('loading-indicator').classList.add('show'); }
function hideLoadingIndicator() { document.getElementById('loading-indicator').classList.remove('show'); }
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `${message}<button class="toast-close">&times;</button>`;
    toast.querySelector('.toast-close').onclick = () => toast.remove();
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}
function announceToScreenReader(message) { document.getElementById('sr-announcements').textContent = message; }

// ========================================================================== //
// INITIALIZATION
// ========================================================================== //
document.addEventListener('DOMContentLoaded', () => {
    // Load preferences
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-color-scheme', savedTheme);
        const themeIcon = document.querySelector('.theme-icon');
        themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun theme-icon' : 'fas fa-moon theme-icon';
        document.querySelector('#theme-toggle .control-label').textContent = savedTheme === 'dark' ? 'Light' : 'Dark';
    }
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
        const scale = parseFloat(savedFontSize);
        MORTGAGE_CALCULATOR.currentFontScaleIndex = MORTGAGE_CALCULATOR.fontScaleOptions.indexOf(scale) ?? 2;
        document.body.className = `font-scale-${Math.round(scale * 100)}`;
    }
    
    // Setup event listeners
    const inputs = ['home-price', 'down-payment', 'interest-rate', 'property-tax', 'home-insurance', 'hoa-fees', 'credit-score'];
    inputs.forEach(id => document.getElementById(id).addEventListener('input', calculateMortgage));
    
    document.getElementById('down-payment-percent').addEventListener('input', syncDownPaymentPercent);
    document.getElementById('custom-term').addEventListener('input', selectCustomTerm);
    
    document.getElementById('zip-code').addEventListener('input', () => handleLocationUpdate('zip'));
    document.getElementById('state').addEventListener('change', () => handleLocationUpdate('state'));
    
    LOCATION_DATA.initialize();
    fredAPI.startAutomaticUpdates();
    setupTabs();
    calculateMortgage(); // Initial calculation
});
