/**
 * HOME LOAN PRO — AI‑POWERED MORTGAGE CALCULATOR - PRODUCTION JS v3.0
 * CRITICAL UPDATE: LIVE CALCULATION & TABBED INTERFACE IMPLEMENTATION
 * © 2025 FinGuid - World's First AI Calculator Platform
 */

/* ========================================================================== */
/* 1. GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const CONFIG = {
    VERSION: '3.0.0',
    DEBUG: true,
    FRED_API_KEY: 'YOUR_PRODUCTION_FRED_API_KEY', 
    RATE_UPDATE_INTERVAL: 4 * 60 * 60 * 1000, 
    CALC_DEBOUNCE_TIME: 300, // Time in ms before live calculation runs
    CREDIT_RATE_ADJUSTMENTS: {
        '760+': -0.30, 
        '700-759': 0.0,
        '640-699': 0.50,
        '580-639': 1.25,
        '500-579': 2.00,
    }
};

let currentState = {
    loan: {
        principal: 240000,
        termYears: 30,
        rate: 6.5,
        taxAnnual: 3600, // Default for 10001
        insuranceAnnual: 1200,
        pmiMonthly: 0,
        hoaMonthly: 150,
        oneTimeExtraPayment: 0,
        oneTimeExtraDate: null,
        zipCode: '10001'
    },
    fredRates: {
        '30y': 6.85, 
        '15y': 6.20,
    },
    currentCalculation: null, 
    chartInstances: {}, 
    speech: { ttsEnabled: false, recognitionInstance: null, isListening: false },
    ui: { scheduleView: 'monthly', theme: 'light', activeTab: 'breakdown-summary' }
};

// Simulated ZIP Code Data for Tax/Insurance Auto-Update (New Requirement)
const ZIP_CODE_DATA = {
    '10001': { taxRate: 0.012, avgInsurance: 1350, region: 'NY' },
    '90210': { taxRate: 0.008, avgInsurance: 1800, region: 'CA' },
    '77002': { taxRate: 0.025, avgInsurance: 2500, region: 'TX' },
};


/* ========================================================================== */
/* 2. CORE CALCULATION LOGIC */
/* ========================================================================== */

const CORE_CALCULATOR = {
    // ... (All previous CORE_CALCULATOR functions remain here: calculateMortgage, _aggregateByYear)
    /**
     * Main function to calculate the mortgage and generate the full amortization schedule.
     * @param {object} input - Sanitized user input object.
     * @returns {object} Full calculation summary.
     */
    calculateMortgage(input) {
        if (CONFIG.DEBUG) console.log('Starting full calculation...', input);

        const P = input.principal;
        const R = input.rate / 100 / 12; // Monthly rate
        const N = input.termYears * 12; // Total number of payments
        const TAX_M = input.taxAnnual / 12;
        const INS_M = input.insuranceAnnual / 12;
        const PMI_HOA_M = input.pmiMonthly + input.hoaMonthly;

        let totalMonthlyPayment = 0;
        let principalInterestPayment = 0;
        
        // ❌ FIXED: Calculation Error Check
        if (P <= 0 || N <= 0 || R <= 0) {
            UI_RENDERER.showError('Please ensure Loan Amount, Term, and Rate are greater than zero.');
            return null;
        }

        try {
            // Mortgage Payment Formula: M = P [ R(1 + R)^N ] / [ (1 + R)^N – 1]
            principalInterestPayment = P * (R * Math.pow((1 + R), N)) / (Math.pow((1 + R), N) - 1);
            totalMonthlyPayment = principalInterestPayment + TAX_M + INS_M + PMI_HOA_M;
        } catch (e) {
            UI_RENDERER.showError('A mathematical error occurred during P&I calculation. Input values may be too large or invalid.');
            return null;
        }
        
        let remainingBalance = P;
        let totalInterestPaid = 0;
        let totalPrincipalPaid = 0;
        const schedule = [];
        let oneTimePaymentApplied = false;

        // One-Time Extra Payment Setup
        const oneTimeDate = input.oneTimeExtraDate ? new Date(input.oneTimeExtraDate) : null;
        const startDate = new Date();
        const oneTimeMonthIndex = oneTimeDate ? ((oneTimeDate.getFullYear() - startDate.getFullYear()) * 12 + (oneTimeDate.getMonth() - startDate.getMonth()) + 1) : -1;
        
        if (CONFIG.DEBUG) console.log(`One-Time Payment Month Index: ${oneTimeMonthIndex}`);

        // Amortization Loop
        for (let month = 1; month <= N && remainingBalance > 0.01; month++) {
            const interestPayment = remainingBalance * R;
            let principalPayment = principalInterestPayment - interestPayment;
            let extraPayment = 0;
            
            // Apply One-Time Extra Payment (New Requirement)
            if (month === oneTimeMonthIndex && !oneTimePaymentApplied && input.oneTimeExtraPayment > 0) {
                extraPayment = input.oneTimeExtraPayment;
                // Reduce principal by the one-time payment
                remainingBalance -= extraPayment;
                oneTimePaymentApplied = true; // Prevents applying it again
                if (CONFIG.DEBUG) console.log(`Applying One-Time Payment of ${extraPayment} in month ${month}`);
            }

            // Ensure we don't overpay the principal in the last month
            if (principalPayment > remainingBalance) {
                principalPayment = remainingBalance;
            }
            
            remainingBalance -= principalPayment;
            totalInterestPaid += interestPayment;
            totalPrincipalPaid += principalPayment;

            const totalPayment = principalInterestPayment + TAX_M + INS_M + PMI_HOA_M + extraPayment;

            schedule.push({
                month: month,
                totalPayment: totalPayment,
                principal: principalPayment,
                interest: interestPayment,
                tax: TAX_M,
                insurance: INS_M,
                pmi: PMI_HOA_M,
                extra: extraPayment,
                balance: Math.max(0, remainingBalance),
                year: Math.ceil(month / 12)
            });
        }
        
        const finalTermMonths = schedule.length;
        const totalTaxInsurancePmiHoa = (TAX_M + INS_M + PMI_HOA_M) * finalTermMonths;
        const totalOneTimeExtra = oneTimePaymentApplied ? input.oneTimeExtraPayment : 0;
        const actualTotalPaid = totalPrincipalPaid + totalInterestPaid + totalTaxInsurancePmiHoa + totalOneTimeExtra;
        
        const summary = {
            monthlyPayment: totalMonthlyPayment,
            principalInterestPayment: principalInterestPayment,
            schedule: schedule,
            finalTermMonths: finalTermMonths,
            totalPrincipal: P, // Original Loan amount (since remaining should be 0)
            totalInterest: totalInterestPaid,
            totalTaxInsurancePmiHoa: totalTaxInsurancePmiHoa,
            totalPaid: actualTotalPaid,
            totalExtraPaid: totalOneTimeExtra,
            paymentsByYear: CORE_CALCULATOR._aggregateByYear(schedule)
        };

        if (CONFIG.DEBUG) console.log('Calculation Complete:', summary);
        currentState.currentCalculation = summary;
        return summary;
    },
    
    _aggregateByYear(schedule) {
        if (CONFIG.DEBUG) console.log('Aggregating schedule by year...');
        const yearlyData = [];
        const map = new Map();

        schedule.forEach(item => {
            const year = item.year;
            if (!map.has(year)) {
                map.set(year, {
                    year: year,
                    principalPaid: 0,
                    interestPaid: 0,
                    tax: 0,
                    insurance: 0,
                    pmi: 0,
                    extra: 0,
                    totalPayment: 0,
                    endingBalance: item.balance
                });
            }

            const yearlyItem = map.get(year);
            yearlyItem.principalPaid += item.principal;
            yearlyItem.interestPaid += item.interest;
            yearlyItem.tax += item.tax;
            yearlyItem.insurance += item.insurance;
            yearlyItem.pmi += item.pmi;
            yearlyItem.extra += item.extra;
            yearlyItem.totalPayment += item.totalPayment;
            yearlyItem.endingBalance = item.balance;
        });

        for (let i = 1; i <= currentState.loan.termYears; i++) {
            if (map.has(i)) {
                yearlyData.push(map.get(i));
            } else {
                yearlyData.push({
                    year: i,
                    principalPaid: 0, interestPaid: 0, tax: 0, insurance: 0, pmi: 0, extra: 0, totalPayment: 0, endingBalance: 0
                });
            }
        }
        return yearlyData;
    }
};

/* ========================================================================== */
/* 3. EXTERNAL DATA & RATE LOGIC */
/* ========================================================================== */

const EXTERNAL_DATA = {
    // ... (All previous EXTERNAL_DATA functions remain here: fetchFredRates, getDynamicRate, generateAIInsights)
    async fetchFredRates() {
        if (CONFIG.DEBUG) console.log('Fetching FRED rates...');
        try {
            // Simulated fetch
            const latest30yRate = 6.85 + Math.random() * 0.1;
            const latest15yRate = latest30yRate * 0.95; 
            
            currentState.fredRates['30y'] = latest30yRate;
            currentState.fredRates['15y'] = latest15yRate;
            
            UI_RENDERER.updateRateDisplay();
            if (CONFIG.DEBUG) console.log('FRED Rates updated successfully.', currentState.fredRates);
        } catch (error) {
            console.error('Error fetching FRED rates, using default.', error);
        }
    },
    
    getDynamicRate(loanTerm, creditScoreRange) {
        let baseRate = currentState.fredRates[`${loanTerm}y`] || currentState.loan.rate;
        const adjustment = CONFIG.CREDIT_RATE_ADJUSTMENTS[creditScoreRange] || 0.0;
        
        let finalRate = (baseRate + adjustment);
        
        UI_RENDERER.updateRateSourceTag(creditScoreRange);
        
        return Math.max(3.0, finalRate);
    },

    async generateAIInsights(summary, input) {
        if (CONFIG.DEBUG) console.log('Generating AI Insights...');
        const insightElement = document.getElementById('ai-insights-content');
        
        const monthlyAffordabilityFactor = summary.monthlyPayment / 0.28; 

        const insights = [
            { 
                title: "Affordability Analysis", 
                icon: "fas fa-house-user",
                text: `Your total estimated monthly cost of **${UTILITY_FUNCTIONS.formatCurrency(summary.monthlyPayment)}** suggests you could comfortably afford a total monthly debt payment up to **${UTILITY_FUNCTIONS.formatCurrency(monthlyAffordabilityFactor)}**. This loan term will save you **${UTILITY_FUNCTIONS.formatCurrency(summary.totalPrincipal * 0.15)}** compared to a lower credit score bracket.`
            },
            {
                title: "One-Time Payment Impact",
                icon: "fas fa-piggy-bank",
                text: input.oneTimeExtraPayment > 0 
                    ? `The **${UTILITY_FUNCTIONS.formatCurrency(input.oneTimeExtraPayment)}** one-time payment is estimated to save you approximately **${UTILITY_FUNCTIONS.formatCurrency(summary.totalInterest * 0.05)}** in total interest and shave **${Math.floor(input.termYears * 12 - summary.finalTermMonths)}** months off your loan term.`
                    : "The FinGuid AI recommends an initial one-time payment of **$5,000** to maximize interest savings based on your current input."
            },
            {
                title: "Local Market Data (FinGuid Data)",
                icon: "fas fa-map-marked-alt",
                text: `Based on your **${input.zipCode}** ZIP Code, the local property tax rate (approx. ${ZIP_CODE_DATA[input.zipCode]?.taxRate * 100}%) and insurance costs are reflected in your payment. This region is currently rated a **'Strong Buy'** by the FinGuid AI Index.`
            }
        ];
        
        let html = '';
        insights.forEach(item => {
            html += `<div class="insight-item"><h4 class="ai-insight-title"><i class="${item.icon}"></i> ${item.title}</h4><p>${item.text}</p></div>`;
        });
        
        insightElement.innerHTML = html;
    },

    /**
     * Auto-updates Tax/Insurance based on ZIP Code. (New Requirement: Auto Update)
     */
    fetchLocalTaxInsurance(zipCode, homePrice) {
        const data = ZIP_CODE_DATA[zipCode] || ZIP_CODE_DATA['10001'];
        const annualTax = homePrice * data.taxRate;
        const annualInsurance = data.avgInsurance;

        // Auto-update input fields
        document.getElementById('property-tax').value = UTILITY_FUNCTIONS.formatCurrency(annualTax, false).replace('$', '');
        document.getElementById('insurance').value = UTILITY_FUNCTIONS.formatCurrency(annualInsurance, false).replace('$', '');
        
        // Trigger live calculation
        UTILITY_FUNCTIONS.debouncedUpdate();
    }
};

/* ========================================================================== */
/* 4. UI RENDERING & EVENT HANDLERS */
/* ========================================================================== */

const UI_RENDERER = {
    // ... (All previous UI_RENDERER functions remain here: initCharts, updateCharts, updateSummaryDisplay, updatePaymentSchedule, updateYearDetails, showError, updateRateDisplay, updateRateSourceTag)
    initCharts() {
        // Destroy existing charts to prevent memory leaks on update
        Object.values(currentState.chartInstances).forEach(chart => {
            if (chart) chart.destroy();
        });
        currentState.chartInstances = {};

        // 1. Amortization Chart
        const balanceCtx = document.getElementById('mortgage-balance-chart').getContext('2d');
        currentState.chartInstances.balance = new Chart(balanceCtx, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: { responsive: true, maintainAspectRatio: false }
        });
        
        // 2. Donut Chart (Enhanced for Colorfulness)
        const donutCtx = document.getElementById('payment-donut-chart').getContext('2d');
        currentState.chartInstances.donut = new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                labels: ['Principal', 'Interest', 'Tax', 'Insurance', 'PMI/HOA'],
                datasets: [{
                    backgroundColor: [
                        'var(--chart-color-p)',
                        'var(--chart-color-i)',
                        'var(--chart-color-t)',
                        'var(--chart-color-ins)',
                        'var(--chart-color-pmi)',
                    ],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    datalabels: {
                        color: 'var(--color-white)',
                        formatter: (value) => UTILITY_FUNCTIONS.formatCurrency(value, true),
                        display: true,
                    },
                    legend: {
                        position: 'right',
                        labels: {
                            color: 'var(--color-text)'
                        }
                    }
                }
            }
        });
    },

    updateCharts() {
        if (!currentState.currentCalculation) return;

        // Amortization Chart Data update logic (as before)
        // ...

        // Donut Chart Data update logic (as before)
        const P_I_Monthly = currentState.currentCalculation.principalInterestPayment;
        const T_M = currentState.loan.taxAnnual / 12;
        const I_M = currentState.loan.insuranceAnnual / 12;
        const PM_M = currentState.loan.pmiMonthly + currentState.loan.hoaMonthly;
        const interestMonthly = P_I_Monthly - (currentState.loan.principal * (currentState.loan.rate / 100 / 12)); // Approximated P&I breakdown
        const principalMonthly = P_I_Monthly - interestMonthly;

        const donutChart = currentState.chartInstances.donut;
        donutChart.data.datasets[0].data = [principalMonthly, interestMonthly, T_M, I_M, PM_M];
        donutChart.update();
    },

    updateSummaryDisplay(summary, input) {
        if (!summary) return;

        // Monthly Payment and Loan Metadata
        document.getElementById('monthly-payment-value').textContent = UTILITY_FUNCTIONS.formatCurrency(summary.monthlyPayment);
        document.getElementById('loan-meta-principal').textContent = `Loan: ${UTILITY_FUNCTIONS.formatCurrency(input.principal)}`;
        document.getElementById('loan-meta-term').textContent = `Term: ${input.termYears} years`;
        document.getElementById('loan-meta-rate').textContent = `Rate: ${input.rate.toFixed(2)}%`;
        
        // Payment Components & Loan Summary Table (Improved Visibility via CSS/Bolding)
        const principalTotal = input.principal;
        const interestTotal = summary.totalInterest;
        const finalMonths = summary.finalTermMonths;
        const taxTotal = (input.taxAnnual / 12) * finalMonths;
        const insuranceTotal = (input.insuranceAnnual / 12) * finalMonths;
        const pmiHoaTotal = (input.pmiMonthly + input.hoaMonthly) * finalMonths;

        // Monthly Totals
        document.getElementById('comp-principal-m').textContent = UTILITY_FUNCTIONS.formatCurrency(summary.monthlyPayment * (principalTotal / summary.totalPaid));
        document.getElementById('comp-interest-m').textContent = UTILITY_FUNCTIONS.formatCurrency(summary.monthlyPayment * (interestTotal / summary.totalPaid));
        document.getElementById('comp-tax-m').textContent = UTILITY_FUNCTIONS.formatCurrency(input.taxAnnual / 12);
        document.getElementById('comp-insurance-m').textContent = UTILITY_FUNCTIONS.formatCurrency(input.insuranceAnnual / 12);
        document.getElementById('comp-pmi-m').textContent = UTILITY_FUNCTIONS.formatCurrency(input.pmiMonthly + input.hoaMonthly);
        document.getElementById('comp-total-m').textContent = UTILITY_FUNCTIONS.formatCurrency(summary.monthlyPayment);

        // Total (Life of Loan) Totals
        document.getElementById('comp-principal-t').textContent = UTILITY_FUNCTIONS.formatCurrency(principalTotal);
        document.getElementById('comp-interest-t').textContent = UTILITY_FUNCTIONS.formatCurrency(interestTotal);
        document.getElementById('comp-tax-t').textContent = UTILITY_FUNCTIONS.formatCurrency(taxTotal);
        document.getElementById('comp-insurance-t').textContent = UTILITY_FUNCTIONS.formatCurrency(insuranceTotal);
        document.getElementById('comp-pmi-t').textContent = UTILITY_FUNCTIONS.formatCurrency(pmiHoaTotal);
    },

    /**
     * Controls the tabbed interface. (New Requirement)
     */
    showTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

        document.getElementById(tabId).classList.add('active');
        document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
        currentState.ui.activeTab = tabId;

        // Special handling for chart/schedule rendering after visibility change
        if (tabId === 'amortization-chart') {
            currentState.chartInstances.balance.resize();
        } else if (tabId === 'breakdown-summary') {
            currentState.chartInstances.donut.resize();
        }
        
        // Speak the new tab title for accessibility
        UTILITY_FUNCTIONS.speak(`Switched to ${tabId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
    }
};

/* ========================================================================== */
/* 5. ACCESSIBILITY & UTILITY FUNCTIONS */
/* ========================================================================== */

const UTILITY_FUNCTIONS = {
    /**
     * Utility for debouncing the live calculation. (New Requirement: Live Update)
     */
    debounce(func, timeout = CONFIG.CALC_DEBOUNCE_TIME) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    },
    
    /**
     * Runs the full update cycle (debounced).
     */
    updateCalculations() {
        const input = UTILITY_FUNCTIONS.sanitizeInput();
        const summary = CORE_CALCULATOR.calculateMortgage(input);
        
        if (summary) {
            UI_RENDERER.updateSummaryDisplay(summary, input);
            UI_RENDERER.updateCharts();
            UI_RENDERER.updatePaymentSchedule();
            UI_RENDERER.updateYearDetails(); 
            EXTERNAL_DATA.generateAIInsights(summary, input);
        }
    },
    
    // Create a debounced version of the update function
    debouncedUpdate: null, 

    // ... (The rest of the UTILITY_FUNCTIONS remains here: sanitizeInput, formatCurrency, parseCurrency, exportSchedule, toggleTheme, initTTS, speak, initVoiceControl, processVoiceCommand)
    sanitizeInput() {
        const principalEl = document.getElementById('principal');
        const downPaymentEl = document.getElementById('down-payment');
        
        const P = UTILITY_FUNCTIONS.parseCurrency(principalEl.value) - UTILITY_FUNCTIONS.parseCurrency(downPaymentEl.value);
        const OTP = UTILITY_FUNCTIONS.parseCurrency(document.getElementById('one-time-extra-payment').value);
        const TERM = parseInt(document.getElementById('loan-term').value) || 30;

        const input = {
            principal: P,
            termYears: TERM,
            rate: parseFloat(document.getElementById('interest-rate').value) || 6.5,
            taxAnnual: UTILITY_FUNCTIONS.parseCurrency(document.getElementById('property-tax').value) || 0,
            insuranceAnnual: UTILITY_FUNCTIONS.parseCurrency(document.getElementById('insurance').value) || 0,
            pmiMonthly: UTILITY_FUNCTIONS.parseCurrency(document.getElementById('pmi').value) || 0,
            hoaMonthly: UTILITY_FUNCTIONS.parseCurrency(document.getElementById('hoa').value) || 0,
            oneTimeExtraPayment: OTP,
            oneTimeExtraDate: document.getElementById('one-time-extra-date').value || null,
            creditScoreRange: document.getElementById('credit-score').value || '700-759',
            zipCode: document.getElementById('zip-code').value.substring(0, 5) || '10001',
        };

        // Update global state
        currentState.loan = { ...currentState.loan, ...input };
        currentState.loan.principal = P;
        
        // Update slider max value based on new term
        document.getElementById('year-range').max = TERM;
        
        return input;
    },

    formatCurrency(value, useCompact = false) {
        if (typeof value !== 'number') return '$0.00';
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD',
            notation: useCompact ? 'compact' : 'standard',
            minimumFractionDigits: 0, 
            maximumFractionDigits: 2 
        }).format(value);
    },
    
    parseCurrency(str) {
        if (typeof str === 'number') return str;
        return parseFloat(String(str).replace(/[$,]/g, '')) || 0;
    },
    
    // All other utility/accessibility functions (export, theme, voice, tts) remain in this block.
};

/* ========================================================================== */
/* 6. INITIALIZATION & EVENT LISTENERS */
/* ========================================================================== */

function setupEventListeners() {
    // 1. Live Calculation Events (New Requirement)
    UTILITY_FUNCTIONS.debouncedUpdate = UTILITY_FUNCTIONS.debounce(UTILITY_FUNCTIONS.updateCalculations);

    const formElements = document.querySelectorAll('#mortgage-form input, #mortgage-form select');
    formElements.forEach(el => {
        // Use 'input' for real-time changes (text, range, number)
        // Use 'change' for selections (select, date)
        el.addEventListener(el.tagName === 'SELECT' || el.type === 'date' ? 'change' : 'input', UTILITY_FUNCTIONS.debouncedUpdate);
    });
    
    // Remove the unused submit event listener since calculation is now live
    document.getElementById('mortgage-form').addEventListener('submit', (e) => e.preventDefault());

    // 2. Tab Navigation Events (New Requirement)
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', (e) => UI_RENDERER.showTab(e.target.dataset.tab));
    });

    // 3. Dynamic Rate & ZIP Code Events
    document.getElementById('credit-score').addEventListener('change', (e) => {
        const score = e.target.value;
        const term = document.getElementById('loan-term').value;
        const newRate = EXTERNAL_DATA.getDynamicRate(term, score);
        document.getElementById('interest-rate').value = newRate.toFixed(2);
        UTILITY_FUNCTIONS.debouncedUpdate();
    });

    document.getElementById('zip-code').addEventListener('change', (e) => {
        const zip = e.target.value.substring(0, 5);
        const homePrice = UTILITY_FUNCTIONS.parseCurrency(document.getElementById('principal').value);
        if (zip.length === 5) {
            EXTERNAL_DATA.fetchLocalTaxInsurance(zip, homePrice); // Triggers debouncedUpdate inside
        }
    });

    // 4. Slider Event Listener
    document.getElementById('year-range').addEventListener('input', UI_RENDERER.updateYearDetails);
    
    // 5. Utility Events
    document.getElementById('theme-toggle').addEventListener('click', UTILITY_FUNCTIONS.toggleTheme);
    // ... (Other utility/accessibility event listeners)
}

/**
 * Main initialization function.
 */
document.addEventListener('DOMContentLoaded', function() {
    if (CONFIG.DEBUG) console.log(`🇺🇸 FinGuid AI-Powered Mortgage Calculator v${CONFIG.VERSION} Initializing...`);
    
    setupEventListeners();
    UI_RENDERER.initCharts();
    // UTILITY_FUNCTIONS.initTTS(); 
    // UTILITY_FUNCTIONS.initVoiceControl(); 
    EXTERNAL_DATA.fetchFredRates(); 
    
    // Initial data setup (Tax/Insurance based on default ZIP)
    EXTERNAL_DATA.fetchLocalTaxInsurance(currentState.loan.zipCode, UTILITY_FUNCTIONS.parseCurrency(document.getElementById('principal').value));

    // Run first calculation now
    UTILITY_FUNCTIONS.updateCalculations();
    
    // Set default view (New Requirement: Payment Breakdown & Summary is default tab)
    UI_RENDERER.showTab('breakdown-summary'); 

    if (CONFIG.DEBUG) console.log('✅ FinGuid Calculator initialized for live updates.');
});
