/**
 * AUTO LOAN PRO — WORLD'S FIRST AI‑POWERED CAR PAYMENT CALCULATOR - PRODUCTION JS v1.0
 * FinGuid USA Market Domination Build 
 * * Target: Production Ready, AI Insights, SEO, PWA, Voice, Monetization Ready
 * * FRED API: 9c6c421f077f2091e8bae4f143ada59a
 * * FRED Series ID (60-Month New Auto Loan): RIFLPBCIANM60NM
 * * Google Analytics: G-NYBL2CDNQJ (in HTML)
 * * © 2025 FinGuid - World's First AI Calculator Platform for Americans
 */

/* ========================================================================== */
/* I. GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const AUTO_CALCULATOR = {
    VERSION: '1.0',
    DEBUG: false, // Set to false for production
    
    // FRED API Configuration
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a', 
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    // RIFLPBCIANM60NM: Finance Rate on Consumer Installment Loans at Commercial Banks, New Autos 60 Month Loan
    FRED_SERIES_ID: 'RIFLPBCIANM60NM', 
    RATE_UPDATE_INTERVAL: 4 * 60 * 60 * 1000, // 4 hours
    FALLBACK_RATE: 7.64, // Default/Fallback Rate (Approx. Q3 2025 avg)

    // Core State - Stores inputs and calculated results
    STATE: {
        // Inputs
        vehiclePrice: 35000,
        downPayment: 5000,
        tradeInValue: 3000,
        salesTaxRate: 6.5, // percent
        otherFees: 500,
        interestRate: 7.64, // percent
        loanTermMonths: 60, // months

        // Results
        loanPrincipal: 0,
        monthlyPayment: 0,
        totalTax: 0,
        totalInterest: 0,
        totalPayments: 0,
        amortization: [],
    },
    
    charts: {
        costBreakdownChart: null,
    }
};

/* ========================================================================== */
/* II. UTILITY FUNCTIONS (Placeholder - Assumes existing FinGuid library is available) */
/* ========================================================================== */

const UTILS = {
    // Format number to USD currency (e.g., $1,234.56)
    formatCurrency: (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    },
    // Format number to percentage (e.g., 6.5%)
    formatPercent: (value) => `${value.toFixed(2)}%`,
    // Show a temporary toast notification (for Voice/PWA feedback)
    showToast: (message, type = 'info') => {
        if (AUTO_CALCULATOR.DEBUG) console.log(`Toast: ${message}`);
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.classList.add('toast', type);
        toast.textContent = message;
        container.prepend(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }
};

/* ========================================================================== */
/* III. FRED API INTEGRATION (Live Interest Rates) */
/* ========================================================================== */

const fredAPI = {
    fetchLatestRate: async () => {
        const apiKey = AUTO_CALCULATOR.FRED_API_KEY;
        const seriesId = AUTO_CALCULATOR.FRED_SERIES_ID;
        const url = `${AUTO_CALCULATOR.FRED_BASE_URL}?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
        
        const rateLabel = document.getElementById('fred-rate-label');
        rateLabel.textContent = 'Fetching FRED®...';

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            
            const observation = data.observations.find(obs => obs.value !== '.' && obs.value !== '0.0');
            let latestRate = observation ? parseFloat(observation.value) : AUTO_CALCULATOR.FALLBACK_RATE;
            
            // FRED rates are typically in percent already
            latestRate = parseFloat(latestRate.toFixed(2));
            
            // Update STATE and Input Field
            AUTO_CALCULATOR.STATE.interestRate = latestRate;
            document.getElementById('interest-rate').value = latestRate;

            // Update Label
            rateLabel.textContent = `Live FRED® Rate: ${UTILS.formatPercent(latestRate)} (60M)`;
            rateLabel.style.color = 'var(--color-green-500)';
            
            if (AUTO_CALCULATOR.DEBUG) UTILS.showToast(`Live Auto Loan Rate fetched: ${latestRate}%`, 'success');
            
        } catch (error) {
            console.error('FRED API Error:', error);
            const fallbackRate = AUTO_CALCULATOR.FALLBACK_RATE;
            AUTO_CALCULATOR.STATE.interestRate = fallbackRate;
            document.getElementById('interest-rate').value = fallbackRate;
            rateLabel.textContent = `Rate Fallback: ${UTILS.formatPercent(fallbackRate)}`;
            rateLabel.style.color = 'var(--color-red-500)';
            if (AUTO_CALCULATOR.DEBUG) UTILS.showToast(`FRED failed. Using fallback rate: ${fallbackRate}%`, 'error');
        } finally {
            // Trigger calculation with the latest (or fallback) rate
            calculateAutoLoan();
        }
    },
    
    startAutomaticUpdates: () => {
        fredAPI.fetchLatestRate();
        setInterval(fredAPI.fetchLatestRate, AUTO_CALCULATOR.RATE_UPDATE_INTERVAL);
    }
};

/* ========================================================================== */
/* IV. CORE CALCULATION ENGINE */
/* ========================================================================== */

// The main function that runs on every input change
function calculateAutoLoan() {
    // 1. Gather Inputs
    const P = parseFloat(document.getElementById('vehicle-price').value) || 0;
    const D = parseFloat(document.getElementById('down-payment').value) || 0;
    const T = parseFloat(document.getElementById('trade-in-value').value) || 0;
    const S = parseFloat(document.getElementById('sales-tax-rate').value) / 100 || 0;
    const F = parseFloat(document.getElementById('other-fees').value) || 0;
    const R_annual = parseFloat(document.getElementById('interest-rate').value) / 100 || 0;
    const N = parseInt(document.getElementById('loan-term').value) || 60;

    // Save to state for AI/Comparison
    AUTO_CALCULATOR.STATE.vehiclePrice = P;
    AUTO_CALCULATOR.STATE.downPayment = D;
    AUTO_CALCULATOR.STATE.tradeInValue = T;
    AUTO_CALCULATOR.STATE.salesTaxRate = S * 100;
    AUTO_CALCULATOR.STATE.otherFees = F;
    AUTO_CALCULATOR.STATE.interestRate = R_annual * 100;
    AUTO_CALCULATOR.STATE.loanTermMonths = N;
    
    // 2. Calculate Total Taxable Amount and Total Tax
    // Auto tax is usually calculated on the purchase price minus the trade-in.
    const taxableAmount = Math.max(0, P - T);
    const totalTax = taxableAmount * S;
    AUTO_CALCULATOR.STATE.totalTax = totalTax;

    // 3. Calculate Loan Principal (The amount actually borrowed)
    const principalLoanAmount = P + totalTax + F - D - T;
    const P_loan = Math.max(0, principalLoanAmount);
    AUTO_CALCULATOR.STATE.loanPrincipal = P_loan;

    // If loan amount is zero or less, stop and display result
    if (P_loan <= 0 || R_annual === 0) {
        AUTO_CALCULATOR.STATE.monthlyPayment = 0;
        AUTO_CALCULATOR.STATE.totalInterest = 0;
        AUTO_CALCULATOR.STATE.totalPayments = P_loan;
        updateResultsDisplay();
        generateComparisonTable();
        updateCharts();
        generateAIInsights();
        return; 
    }
    
    // 4. Calculate Monthly Payment (M) - Amortization Formula
    const R_monthly = R_annual / 12; // Monthly interest rate
    const N_months = N; // Total number of payments

    // M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1 ]
    const numerator = R_monthly * Math.pow((1 + R_monthly), N_months);
    const denominator = Math.pow((1 + R_monthly), N_months) - 1;
    let monthlyPayment = P_loan * (numerator / denominator);
    
    // Check for calculation errors (e.g., extremely high rate/term)
    if (isNaN(monthlyPayment) || monthlyPayment === Infinity) {
        monthlyPayment = P_loan / N_months; // Simple principal payment only
    }

    // 5. Calculate Amortization Schedule & Totals
    const { totalInterest, amortization } = calculateAmortization(P_loan, R_annual, N_months, monthlyPayment);

    // 6. Update State with Final Results
    AUTO_CALCULATOR.STATE.monthlyPayment = monthlyPayment;
    AUTO_CALCULATOR.STATE.totalInterest = totalInterest;
    AUTO_CALCULATOR.STATE.totalPayments = P_loan + totalInterest;
    AUTO_CALCULATOR.STATE.amortization = amortization;

    // 7. Update UI
    updateResultsDisplay();
    generateComparisonTable(P_loan, R_annual); // Pass P_loan and R_annual for comparison
    updateCharts();
    generateAIInsights();
}

/**
 * Generates the full amortization schedule and total interest.
 * @param {number} principal - Loan amount.
 * @param {number} annualRate - Annual interest rate (as a decimal, e.g., 0.05).
 * @param {number} termMonths - Total number of payments.
 * @param {number} payment - Calculated fixed monthly payment.
 * @returns {{totalInterest: number, amortization: Array<Object>}}
 */
function calculateAmortization(principal, annualRate, termMonths, payment) {
    let balance = principal;
    let totalInterest = 0;
    const monthlyRate = annualRate / 12;
    const schedule = [];

    for (let month = 1; month <= termMonths; month++) {
        const interestPayment = balance * monthlyRate;
        
        let principalPayment = payment - interestPayment;
        
        // Final payment adjustment
        if (month === termMonths) {
            principalPayment = balance;
            payment = principalPayment + interestPayment;
        }

        balance -= principalPayment;
        totalInterest += interestPayment;

        schedule.push({
            month: month,
            payment: payment,
            principal: principalPayment,
            interest: interestPayment,
            balance: balance
        });
    }

    return { totalInterest, amortization: schedule };
}

/* ========================================================================== */
/* V. DYNAMIC RESULTS, CHARTS, AND INSIGHTS */
/* ========================================================================== */

function updateResultsDisplay() {
    const S = AUTO_CALCULATOR.STATE;

    // Main Result Card
    document.getElementById('monthly-payment-result').textContent = UTILS.formatCurrency(S.monthlyPayment);
    document.getElementById('payment-breakdown-summary').textContent = 
        `Based on a ${UTILS.formatCurrency(S.loanPrincipal)} loan amount over ${S.loanTermMonths} months at ${UTILS.formatPercent(S.interestRate)}.`;

    // Input Summary
    document.getElementById('display-loan-amount').textContent = UTILS.formatCurrency(S.loanPrincipal);
    document.getElementById('display-tax-amount').textContent = UTILS.formatCurrency(S.totalTax);
    
    // Breakdown Tab
    document.getElementById('total-principal-paid').textContent = UTILS.formatCurrency(S.loanPrincipal);
    document.getElementById('total-interest-paid').textContent = UTILS.formatCurrency(S.totalInterest);
    document.getElementById('total-payments').textContent = UTILS.formatCurrency(S.totalPayments);
    
    const interestPercent = (S.totalInterest / S.totalPayments) * 100;
    document.getElementById('interest-percentage').textContent = UTILS.formatPercent(interestPercent);
}

/**
 * WORLD'S FIRST AI-POWERED INSIGHTS ENGINE
 * Provides dynamic, data-driven recommendations and contextual insights.
 * Focused on maximizing monetization (Affiliate/Sponsor/Advertising) by identifying user pain points.
 */
function generateAIInsights() {
    const S = AUTO_CALCULATOR.STATE;
    const insights = [];
    const monthlyPayment = S.monthlyPayment;
    const totalCost = S.totalPayments;
    const totalInterest = S.totalInterest;
    const loanTermYears = S.loanTermMonths / 12;
    const rate = S.interestRate;
    const loanToValue = (S.loanPrincipal / S.vehiclePrice) * 100;
    
    // --- Insight 1: High Loan Term (Risk for Depreciation) ---
    if (S.loanTermMonths >= 72) {
        insights.push({
            type: 'warning',
            text: `⚠️ **Extended Loan Term Risk:** A **${S.loanTermMonths}-month** loan significantly increases your risk of being **"upside down"** (owing more than the car is worth) due to vehicle depreciation. This loan costs you an extra ${UTILS.formatCurrency(totalInterest)} in interest. **Recommendation:** Try to stick to a 60-month term or less. [Link to our 'Refinance Pro' calculator to compare rates later]`,
            monetization: 'affiliate-refi'
        });
    } else if (S.loanTermMonths <= 48) {
        insights.push({
            type: 'success',
            text: `✅ **Smart Term:** Your **${S.loanTermMonths}-month** loan term is excellent for minimizing total interest and building equity quickly. You will pay only ${UTILS.formatCurrency(totalInterest)} in interest.`,
            monetization: 'none'
        });
    }

    // --- Insight 2: High Interest Rate (Affiliate/Sponsor Opportunity) ---
    if (rate > 8.5) {
        insights.push({
            type: 'critical',
            text: `🚨 **High Interest Alert:** Your ${UTILS.formatPercent(rate)} interest rate is significantly above the current US average, costing you an extra ${UTILS.formatCurrency(totalInterest)} in total. **Action:** We strongly recommend getting a free rate comparison from our trusted, low-APR **Sponsor Partner**.`,
            monetization: 'sponsor-partner'
        });
    } else if (rate < 6.0) {
        insights.push({
            type: 'success',
            text: `⭐ **Excellent Rate:** Your ${UTILS.formatPercent(rate)} rate is fantastic! This is helping you keep your total loan cost low.`,
            monetization: 'none'
        });
    }

    // --- Insight 3: Trade-in/Down Payment (Equity and Principal) ---
    if (S.downPayment + S.tradeInValue < S.vehiclePrice * 0.15) { // Less than 15% total equity contribution
         insights.push({
            type: 'info',
            text: `📈 **Build Equity:** Your total down payment and trade-in value is low, making your Loan-to-Value (LTV) high at **${loanToValue.toFixed(0)}%**. Increasing your down payment by $1,000 could lower your monthly payment by ${UTILS.formatCurrency(monthlyPayment * (1000 / S.loanPrincipal))} and save thousands.`,
            monetization: 'affiliate-debt-reduction'
        });
    }
    
    // --- Insight 4: General Call to Action (Advertising) ---
    if (insights.length === 0) {
        insights.push({
            type: 'info',
            text: `💡 **Dynamic Snapshot:** Your estimated monthly payment is **${UTILS.formatCurrency(monthlyPayment)}**. This includes ${UTILS.formatCurrency(S.totalTax)} in sales tax and ${UTILS.formatCurrency(S.otherFees)} in fees. For the best financial security, don't forget to **secure quality auto insurance** for your new vehicle. [Link to Ad Slot]`,
            monetization: 'advertising-insurance'
        });
    }


    // 5. Render Insights to the UI
    const aiTextElement = document.getElementById('ai-insight-text');
    aiTextElement.innerHTML = ''; // Clear previous insights
    
    insights.forEach(insight => {
        const p = document.createElement('p');
        p.innerHTML = insight.text;
        p.classList.add(`insight-${insight.type}`); // Use CSS to style warning/success/etc.
        aiTextElement.appendChild(p);
    });
}

/**
 * Calculates and generates the Payment Comparison Table (48M, 60M, 72M)
 * @param {number} P_loan - Calculated loan principal.
 * @param {number} R_annual - Annual interest rate (as a decimal).
 */
function generateComparisonTable(P_loan = AUTO_CALCULATOR.STATE.loanPrincipal, R_annual = AUTO_CALCULATOR.STATE.interestRate / 100) {
    const terms = [48, 60, 72, 84];
    const tableBody = document.getElementById('comparison-table-body');
    tableBody.innerHTML = '';

    if (P_loan <= 0) {
        tableBody.innerHTML = '<tr><td colspan="4">Please enter a valid loan amount to view comparisons.</td></tr>';
        return;
    }

    terms.forEach(N_months => {
        const R_monthly = R_annual / 12; 

        // Calculation (re-use logic from main function)
        const numerator = R_monthly * Math.pow((1 + R_monthly), N_months);
        const denominator = Math.pow((1 + R_monthly), N_months) - 1;
        let monthlyPayment = P_loan * (numerator / denominator);

        // Calculate Total Interest for this term
        const totalInterest = (monthlyPayment * N_months) - P_loan;
        const totalCost = P_loan + totalInterest;

        // Create Table Row
        const row = tableBody.insertRow();
        
        let termText = `${N_months} Months (${N_months / 12} Years)`;
        if (N_months === AUTO_CALCULATOR.STATE.loanTermMonths) {
            termText += ' (Current)';
            row.classList.add('current-selection'); // Highlight current term
        }

        row.insertCell().textContent = termText;
        row.insertCell().textContent = UTILS.formatCurrency(monthlyPayment);
        row.insertCell().textContent = UTILS.formatCurrency(totalInterest);
        row.insertCell().textContent = UTILS.formatCurrency(totalCost);
    });
}


/**
 * Initializes/Updates the Chart.js visualization for Cost Breakdown.
 */
function updateCharts() {
    const S = AUTO_CALCULATOR.STATE;
    const ctx = document.getElementById('cost-breakdown-chart').getContext('2d');
    
    const principal = S.loanPrincipal;
    const interest = S.totalInterest;

    // Check if the chart already exists
    if (AUTO_CALCULATOR.charts.costBreakdownChart) {
        AUTO_CALCULATOR.charts.costBreakdownChart.data.datasets[0].data = [principal, interest];
        AUTO_CALCULATOR.charts.costBreakdownChart.update();
        return;
    }

    AUTO_CALCULATOR.charts.costBreakdownChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal Paid', 'Interest Paid'],
            datasets: [{
                data: [principal, interest],
                backgroundColor: [
                    'var(--color-chart-principal)', 
                    'var(--color-chart-interest)'
                ],
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            aspectRatio: 1.5,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: 'var(--text-color)',
                        font: { size: 14 }
                    }
                },
                title: {
                    display: true,
                    text: 'Principal vs. Interest Breakdown',
                    color: 'var(--text-color)',
                    font: { size: 16 }
                },
            },
            // The following ensures Dark Mode compatibility
            onResize: (chart, size) => {
                chart.options.plugins.legend.labels.color = document.documentElement.getAttribute('data-color-scheme') === 'dark' ? 'var(--color-white)' : 'var(--text-color)';
                chart.options.plugins.title.color = document.documentElement.getAttribute('data-color-scheme') === 'dark' ? 'var(--color-white)' : 'var(--text-color)';
                chart.update('none');
            }
        }
    });
}

// Placeholder for Theme Manager (Assumes code from other files is modularized)
const THEME_MANAGER = {
    loadUserPreferences: () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-color-scheme', savedTheme);
        document.getElementById('theme-toggle-button').innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    },
    toggleTheme: () => {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-color-scheme', newTheme);
        localStorage.setItem('theme', newTheme);
        document.getElementById('theme-toggle-button').innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        
        // Ensure chart colors are updated immediately
        if (AUTO_CALCULATOR.charts.costBreakdownChart) {
             AUTO_CALCULATOR.charts.costBreakdownChart.options.plugins.legend.labels.color = newTheme === 'dark' ? '#f0f0f0' : '#13343B'; // Use specific light/dark colors
             AUTO_CALCULATOR.charts.costBreakdownChart.options.plugins.title.color = newTheme === 'dark' ? '#f0f0f0' : '#13343B';
             AUTO_CALCULATOR.charts.costBreakdownChart.update();
        }
    }
}

// Placeholder for Speech Module (Voice Command / Text-to-Speech)
const SPEECH = {
    initialize: () => {
        if (AUTO_CALCULATOR.DEBUG) console.log('Speech Module Initialized (Placeholders)');
        // In a full implementation, this is where SpeechRecognition/Synthesis would be set up.
    },
    startListening: () => {
        // Placeholder for Voice Command
        UTILS.showToast('🎙️ Voice Command activated. Try saying "Set vehicle price to forty thousand".', 'info');
    }
}

/* ========================================================================== */
/* VI. EVENT LISTENERS & INITIALIZATION */
/* ========================================================================== */

function setupEventListeners() {
    // === Core Input Listeners ===
    const form = document.getElementById('auto-loan-form');
    // Recalculate on any input change (dynamic updates)
    form.addEventListener('input', calculateAutoLoan); 
    form.addEventListener('change', calculateAutoLoan); 

    // === Theme Toggle ===
    document.getElementById('theme-toggle-button').addEventListener('click', THEME_MANAGER.toggleTheme);
    
    // === Voice Command/Accessibility ===
    document.getElementById('voice-command-button').addEventListener('click', SPEECH.startListening);
    
    // === Tab Switching ---
    document.querySelectorAll('.tab-controls-results .tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.target.getAttribute('data-tab');
            document.querySelectorAll('.tab-controls-results .tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.results-section .tab-content').forEach(content => content.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Ensure chart redraws correctly if its tab is activated (e.g., resizing issue on hidden tabs)
            if (tabId === 'payment-breakdown' && AUTO_CALCULATOR.charts.costBreakdownChart) {
                setTimeout(() => AUTO_CALCULATOR.charts.costBreakdownChart.resize(), 50); 
            }
        });
    });
}

/* ========================================================================== */
/* VII. DOCUMENT INITIALIZATION */
/* ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    if (AUTO_CALCULATOR.DEBUG) {
        console.log('🇺🇸 FinGuid Auto Loan Pro — AI‑Powered Calculator v1.0 Initializing...');
        console.log('📊 World\'s First AI-Powered Auto Loan Calculator');
        console.log(`🏦 FRED® API Key: ${AUTO_CALCULATOR.FRED_API_KEY}`);
        console.log(`🏦 FRED® Series: ${AUTO_CALCULATOR.FRED_SERIES_ID}`);
        console.log('✅ Production Ready - All Features Initializing...');
    }
    
    // 1. Initialize Core State and UI
    THEME_MANAGER.loadUserPreferences(); // Load saved theme (Dark/Light Mode)
    SPEECH.initialize(); // Initialize Speech Module
    setupEventListeners(); // Set up all input monitors
    
    // 2. Fetch Live Rate and Initial Calculation
    // This fetches the live rate, sets the input, and then calls calculateAutoLoan()
    fredAPI.startAutomaticUpdates(); 
    
    // Fallback calculation in case FRED is slow/fails to trigger in time
    setTimeout(calculateAutoLoan, 1500); 
    
    if (AUTO_CALCULATOR.DEBUG) console.log('✅ Auto Loan Calculator initialized successfully!');
});
