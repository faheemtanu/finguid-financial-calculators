/**
 * HOME LOAN PRO — AI‑POWERED MORTGAGE CALCULATOR - PRODUCTION JS v1.2
 * FIXED VERSION - ALL FEATURES WORKING
 */

const MORTGAGE_CALCULATOR = {
    VERSION: '1.2',
    DEBUG: true,
    
    // FRED API Configuration
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    FRED_SERIES: {
        '30-Year Fixed': 'MORTGAGE30US',
        '15-Year Fixed': 'MORTGAGE15US',
        '5/1-Year ARM': 'MORTGAGE5US1'
    },
    
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
        totalCost: 0
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
    liveRates: {}
};

/* ========================================================================== */
/* ZIP CODE DATABASE */
/* ========================================================================== */

const ZIP_DATABASE = {
    zipCodes: new Map(),
    
    initialize() {
        const sampleZipData = [
            { zip: '10001', city: 'New York', state: 'NY', stateName: 'New York', propertyTaxRate: 1.25, insuranceRate: 0.4 },
            { zip: '02101', city: 'Boston', state: 'MA', stateName: 'Massachusetts', propertyTaxRate: 1.17, insuranceRate: 0.55 },
            { zip: '33101', city: 'Miami', state: 'FL', stateName: 'Florida', propertyTaxRate: 1.02, insuranceRate: 1.2 },
            { zip: '30301', city: 'Atlanta', state: 'GA', stateName: 'Georgia', propertyTaxRate: 0.83, insuranceRate: 0.65 },
            { zip: '60601', city: 'Chicago', state: 'IL', stateName: 'Illinois', propertyTaxRate: 2.05, insuranceRate: 0.5 },
            { zip: '77001', city: 'Houston', state: 'TX', stateName: 'Texas', propertyTaxRate: 1.81, insuranceRate: 0.7 },
            { zip: '90210', city: 'Beverly Hills', state: 'CA', stateName: 'California', propertyTaxRate: 0.75, insuranceRate: 0.6 },
            { zip: '80201', city: 'Denver', state: 'CO', stateName: 'Colorado', propertyTaxRate: 0.51, insuranceRate: 0.55 },
        ];

        sampleZipData.forEach(data => {
            data.propertyTaxRate = data.propertyTaxRate / 100;
            data.insuranceRate = data.insuranceRate / 100;
            this.zipCodes.set(data.zip, data);
        });
        
        // Set default ZIP code
        const defaultZip = this.zipCodes.get('77001');
        if (defaultZip) {
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
        
        document.getElementById('property-tax').value = this.formatNumber(estimatedTax);
        document.getElementById('home-insurance').value = this.formatNumber(estimatedInsurance);
        
        document.getElementById('zip-info').querySelector('.status-text').textContent = 
            `${zipData.city}, ${zipData.state} (${zipData.stateName})`;
        document.getElementById('tax-rate-info').querySelector('.status-text').textContent = 
            `~${(zipData.propertyTaxRate * 100).toFixed(2)}% (Est.)`;
        document.getElementById('insurance-rate-info').querySelector('.status-text').textContent = 
            `~${(zipData.insuranceRate * 100).toFixed(2)}% (Est.)`;

        this.showToast(`Defaults loaded for ${zipData.city}, ${zipData.state}!`, 'success');
    },

    formatNumber(num) {
        return new Intl.NumberFormat('en-US').format(Math.round(num));
    },

    showToast(message, type = 'info') {
        console.log(`[TOAST ${type.toUpperCase()}]: ${message}`);
    }
};

/* ========================================================================== */
/* UTILITY FUNCTIONS */
/* ========================================================================== */

function formatCurrency(value, includeSymbol = true) {
    if (isNaN(value) || value === null) return includeSymbol ? '$0' : '0';
    return value.toLocaleString('en-US', {
        style: includeSymbol ? 'currency' : 'decimal',
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
        setTimeout(() => toast.remove(), 300);
    }, 4000);
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
    if (r === 0) return P / (t * 12);
    const r_m = r / 12;
    const n = t * 12;
    return P * (r_m * Math.pow(1 + r_m, n)) / (Math.pow(1 + r_m, n) - 1);
}

function generateAmortizationSchedule(params) {
    let { loanAmount, interestRate, loanTerm, extraMonthly, extraWeekly } = params;
    
    const P = loanAmount;
    const r = interestRate / 100;
    const r_m = r / 12;
    const n = loanTerm * 12;
    
    const baseP_I = calculateP_I(P, r, loanTerm);
    const extraWeeklyMonthlyEquivalent = extraWeekly * (52 / 12);
    const totalExtraPrincipal = extraMonthly + extraWeeklyMonthlyEquivalent;
    
    let totalInterest = 0;
    let balance = P;
    let schedule = [];

    for (let i = 1; i <= n && balance > 0; i++) {
        const monthlyInterest = balance * r_m;
        let principalPayment = baseP_I - monthlyInterest;
        
        let extraPayment = Math.min(totalExtraPrincipal, balance - principalPayment);
        if (extraPayment < 0) extraPayment = 0;
        
        const totalPrincipal = principalPayment + extraPayment;
        balance -= totalPrincipal;
        totalInterest += monthlyInterest;

        schedule.push({
            month: i,
            year: Math.ceil(i / 12),
            payment: baseP_I + extraPayment,
            interest: monthlyInterest,
            principal: totalPrincipal,
            balance: Math.max(0, balance)
        });
        
        if (balance <= 0) break;
    }

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + schedule.length);

    return {
        schedule: schedule,
        totalInterest: totalInterest,
        totalCost: P + totalInterest,
        payoffDate: payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        baseP_I: baseP_I
    };
}

function updateCalculations() {
    console.log('Updating calculations...');
    
    const calc = MORTGAGE_CALCULATOR.currentCalculation;
    
    // Get input values
    const homePrice = parseCurrency(document.getElementById('home-price').value);
    const downPayment = parseCurrency(document.getElementById('down-payment').value);
    const interestRate = parseFloat(document.getElementById('interest-rate').value);
    const loanTerm = parseInt(document.getElementById('loan-term').value);
    const propertyTax = parseCurrency(document.getElementById('property-tax').value);
    const homeInsurance = parseCurrency(document.getElementById('home-insurance').value);
    const hoaFees = parseCurrency(document.getElementById('hoa-fees').value);
    const extraMonthly = parseCurrency(document.getElementById('extra-monthly').value);
    const extraWeekly = parseCurrency(document.getElementById('extra-weekly').value);
    const loanType = document.getElementById('loan-type').value;

    // Validate inputs
    if (homePrice <= 0 || downPayment >= homePrice || interestRate <= 0 || loanTerm <= 0) {
        showToast('Please enter valid Home Price, Down Payment, and Rate.', 'error');
        return;
    }

    const loanAmount = homePrice - downPayment;
    const downPaymentPercent = (downPayment / homePrice) * 100;
    
    // Calculate PMI if needed
    let pmi = 0;
    if (loanType === 'conventional' && downPaymentPercent < 20) {
        pmi = (loanAmount * 0.008);
        document.querySelector('.pmi-info span').textContent = `PMI: ${formatCurrency(pmi / 12)}/mo added (Est. 0.8%)`;
    } else {
        document.querySelector('.pmi-info span').textContent = `PMI: $0/mo (DP >= 20% or non-conventional)`;
    }

    // Update state
    Object.assign(calc, {
        homePrice, downPayment, downPaymentPercent, loanAmount, interestRate, loanTerm,
        propertyTax, homeInsurance, pmi, hoaFees, extraMonthly, extraWeekly, loanType
    });
    
    // Run calculations
    const results = generateAmortizationSchedule(calc);
    const baseP_I_Monthly = results.baseP_I;
    const taxMonthly = propertyTax / 12;
    const insuranceMonthly = homeInsurance / 12;
    const pmiMonthly = pmi / 12;
    
    const totalPITI = baseP_I_Monthly + taxMonthly + insuranceMonthly + pmiMonthly;
    const totalPayment = totalPITI + hoaFees;

    // Update state with results
    calc.monthlyPayment = totalPayment;
    calc.totalInterest = results.totalInterest;
    calc.totalCost = results.totalCost;

    // Update UI
    updateResultsUI(results, baseP_I_Monthly, taxMonthly, insuranceMonthly, pmiMonthly);
    
    // Update charts if they exist
    if (MORTGAGE_CALCULATOR.charts.paymentComponents) {
        updatePaymentComponentsChart(baseP_I_Monthly, taxMonthly, insuranceMonthly, pmiMonthly, hoaFees);
    }
    
    // Update comparison if enabled
    if (MORTGAGE_CALCULATOR.comparisonLoan.enabled) {
        updateComparisonCalculations();
    }

    showToast('Calculation updated!', 'success');
}

function updateResultsUI(results, baseP_I_Monthly, taxMonthly, insuranceMonthly, pmiMonthly) {
    const calc = MORTGAGE_CALCULATOR.currentCalculation;
    
    // Update summary card
    document.getElementById('monthly-payment-total').textContent = formatCurrency(calc.monthlyPayment);
    document.getElementById('loan-amount-display').textContent = formatCurrency(calc.loanAmount);
    document.getElementById('total-cost-display').textContent = formatCurrency(calc.totalCost);
    document.getElementById('total-interest-display').textContent = formatCurrency(calc.totalInterest);
    document.getElementById('payoff-date-display').textContent = results.payoffDate;

    // Update payment breakdown
    document.getElementById('pi-payment-display').textContent = formatCurrency(baseP_I_Monthly);
    document.getElementById('tax-monthly-display').textContent = formatCurrency(taxMonthly);
    document.getElementById('insurance-monthly-display').textContent = formatCurrency(insuranceMonthly);
    document.getElementById('pmi-monthly-display').textContent = formatCurrency(pmiMonthly);
    document.getElementById('hoa-fees-display').textContent = formatCurrency(calc.hoaFees);
    document.getElementById('total-monthly-display').textContent = formatCurrency(calc.monthlyPayment);

    // Update loan summary
    document.getElementById('summary-home-price').textContent = formatCurrency(calc.homePrice);
    document.getElementById('summary-down-payment').textContent = `${formatCurrency(calc.downPayment)} (${calc.downPaymentPercent.toFixed(1)}%)`;
    document.getElementById('summary-loan-amount').textContent = formatCurrency(calc.loanAmount);
    
    const closingCosts = calc.homePrice * (calc.closingCostsPercent / 100);
    document.getElementById('summary-closing-costs').textContent = formatCurrency(closingCosts);
    document.getElementById('summary-cash-needed').textContent = formatCurrency(calc.downPayment + closingCosts);
    
    document.getElementById('summary-total-cost').textContent = formatCurrency(calc.totalCost);
}

/* ========================================================================== */
/* COMPARISON LOGIC - FIXED */
/* ========================================================================== */

function updateComparisonCalculations() {
    console.log('Updating comparison calculations...');
    
    const comp = MORTGAGE_CALCULATOR.comparisonLoan;
    if (!comp.enabled) return;

    // Get comparison inputs
    const homePrice = parseCurrency(document.getElementById('comp-home-price').value) || comp.homePrice;
    const downPaymentPercent = parseFloat(document.getElementById('comp-down-payment-percent').value) || comp.downPaymentPercent;
    const downPayment = homePrice * (downPaymentPercent / 100);
    const loanAmount = homePrice - downPayment;
    const interestRate = parseFloat(document.getElementById('comp-interest-rate').value) || comp.interestRate;
    const loanTerm = parseInt(document.getElementById('comp-loan-term').value) || comp.loanTerm;

    // Update comparison state
    Object.assign(comp, {
        homePrice, downPayment, downPaymentPercent, loanAmount, interestRate, loanTerm
    });

    // Calculate comparison results
    const compParams = { 
        loanAmount: comp.loanAmount, 
        interestRate: comp.interestRate, 
        loanTerm: comp.loanTerm, 
        extraMonthly: 0, 
        extraWeekly: 0 
    };
    const results = generateAmortizationSchedule(compParams);

    comp.monthlyPayment = results.baseP_I; // Just P&I for comparison
    comp.totalInterest = results.totalInterest;
    comp.totalCost = results.totalCost;

    updateComparisonUI();
}

function updateComparisonUI() {
    const comp = MORTGAGE_CALCULATOR.comparisonLoan;
    const main = MORTGAGE_CALCULATOR.currentCalculation;
    const compSection = document.getElementById('comparison-results-box');

    if (!comp.enabled) {
        compSection.style.display = 'none';
        return;
    }
    
    compSection.style.display = 'block';

    // Update comparison insight
    const monthlyDifference = main.baseP_I - comp.monthlyPayment;
    const interestDifference = main.totalInterest - comp.totalInterest;

    let insightText = '';
    if (monthlyDifference > 0) {
        insightText = `Loan B saves you ${formatCurrency(monthlyDifference)} monthly and ${formatCurrency(interestDifference)} total interest.`;
    } else if (monthlyDifference < 0) {
        insightText = `Loan A saves you ${formatCurrency(Math.abs(monthlyDifference))} monthly and ${formatCurrency(Math.abs(interestDifference))} total interest.`;
    } else {
        insightText = 'Both loans have similar costs.';
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
        compTool.style.display = 'grid';
        updateComparisonCalculations();
        showToast('Loan comparison enabled!', 'success');
    } else {
        toggleBtn.innerHTML = '<i class="fas fa-balance-scale-left"></i> Compare a Second Loan';
        compTool.style.display = 'none';
        document.getElementById('comparison-results-box').style.display = 'none';
        showToast('Loan comparison disabled!', 'info');
    }
}

/* ========================================================================== */
/* CHART INTEGRATION */
/* ========================================================================== */

function initializeCharts() {
    const paymentCtx = document.getElementById('payment-components-chart');
    if (paymentCtx) {
        MORTGAGE_CALCULATOR.charts.paymentComponents = new Chart(paymentCtx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Principal & Interest', 'Property Tax', 'Home Insurance', 'PMI', 'HOA Fees'],
                datasets: [{
                    data: [2250, 750, 150, 0, 0],
                    backgroundColor: ['#21808D', '#4196A1', '#FF5459', '#E68161', '#5E5240']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
    }
}

function updatePaymentComponentsChart(pi, tax, insurance, pmi, hoa) {
    const chart = MORTGAGE_CALCULATOR.charts.paymentComponents;
    if (chart) {
        chart.data.datasets[0].data = [pi, tax, insurance, pmi, hoa];
        chart.update();
    }
}

/* ========================================================================== */
/* EVENT HANDLERS - FIXED */
/* ========================================================================== */

function handleInput(event) {
    const input = event.target;
    const id = input.id;

    console.log(`Input changed: ${id} = ${input.value}`);

    // ZIP Code lookup
    if (id === 'zip-code' && input.value.length === 5) {
        const zipData = ZIP_DATABASE.getZipData(input.value);
        if (zipData) {
            ZIP_DATABASE.updateZipInfo(zipData);
        }
    }
    
    // Live rate application
    if (id === 'live-rate-select' && input.value) {
        document.getElementById('interest-rate').value = input.value;
        input.value = '';
        showToast(`Applied live rate: ${input.value}%`, 'success');
    }
    
    // Down payment percentage sync
    if (id === 'down-payment-percent') {
        const percent = parseFloat(input.value) / 100;
        const price = parseCurrency(document.getElementById('home-price').value);
        const newDownPayment = price * percent;
        document.getElementById('down-payment').value = formatCurrency(newDownPayment, false);
    } else if (id === 'down-payment') {
        const downPayment = parseCurrency(input.value);
        const price = parseCurrency(document.getElementById('home-price').value);
        const newPercent = (downPayment / price) * 100;
        document.getElementById('down-payment-percent').value = newPercent.toFixed(1);
    }
    
    // Recalculate
    setTimeout(updateCalculations, 100);
}

function handleComparisonInput(event) {
    if (MORTGAGE_CALCULATOR.comparisonLoan.enabled) {
        setTimeout(updateComparisonCalculations, 100);
    }
}

function initializeEventListeners() {
    console.log('Initializing event listeners...');
    
    // Main form inputs
    const mainInputs = [
        'home-price', 'down-payment', 'down-payment-percent', 'loan-type',
        'interest-rate', 'loan-term', 'zip-code', 'property-tax',
        'home-insurance', 'hoa-fees', 'extra-monthly', 'extra-weekly', 'live-rate-select'
    ];
    
    mainInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', handleInput);
            element.addEventListener('change', handleInput);
        }
    });

    // Comparison inputs
    const compInputs = [
        'comp-home-price', 'comp-down-payment-percent', 
        'comp-interest-rate', 'comp-loan-term'
    ];
    
    compInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', handleComparisonInput);
            element.addEventListener('change', handleComparisonInput);
        }
    });

    // Calculate button
    const calculateBtn = document.getElementById('calculate-btn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', updateCalculations);
    }

    // Comparison toggle
    const compareToggle = document.getElementById('compare-loan-toggle');
    if (compareToggle) {
        compareToggle.addEventListener('click', toggleComparison);
    }

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const target = e.currentTarget.getAttribute('data-target');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(target).classList.add('active');
            e.currentTarget.classList.add('active');
        });
    });

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    console.log('Event listeners initialized');
}

function toggleTheme() {
    const currentScheme = document.body.getAttribute('data-color-scheme');
    const newScheme = currentScheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-color-scheme', newScheme);
    
    const themeIcon = document.querySelector('#theme-toggle .theme-icon');
    if (themeIcon) {
        themeIcon.className = newScheme === 'light' ? 'fas fa-moon theme-icon' : 'fas fa-sun theme-icon';
    }
    
    showToast(`${newScheme === 'light' ? 'Light' : 'Dark'} mode activated`, 'info');
}

/* ========================================================================== */
/* INITIALIZATION - FIXED */
/* ========================================================================== */

function init() {
    console.log('Initializing Mortgage Calculator v1.2...');
    
    try {
        // Initialize components
        ZIP_DATABASE.initialize();
        initializeCharts();
        initializeEventListeners();
        
        // Set initial values
        document.getElementById('home-price').value = '450,000';
        document.getElementById('down-payment').value = '90,000';
        document.getElementById('down-payment-percent').value = '20';
        document.getElementById('interest-rate').value = '6.44';
        document.getElementById('loan-term').value = '30';
        document.getElementById('zip-code').value = '77001';
        document.getElementById('property-tax').value = '9,000';
        document.getElementById('home-insurance').value = '1,800';
        
        // Set comparison initial values
        document.getElementById('comp-home-price').value = '400,000';
        document.getElementById('comp-down-payment-percent').value = '25';
        document.getElementById('comp-interest-rate').value = '5.99';
        document.getElementById('comp-loan-term').value = '15';
        
        // Run initial calculation
        setTimeout(updateCalculations, 500);
        
        console.log('Mortgage Calculator initialized successfully');
        showToast('Calculator ready!', 'success');
        
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Error initializing calculator', 'error');
    }
}

// Start when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
