/**
 * BUSINESS LOAN AI ANALYZER — World's First AI-Powered Business Loan Calculator - PRODUCTION JS v1.0
 * FinGuid USA Market Domination Build 
 * * Target: Production Ready, AI Insights, SEO, PWA, Voice, Monetization Ready
 * * FRED API: 9c6c421f077f2091e8bae4f143ada59a
 * * Google Analytics: G-NYBL2CDNQJ (in HTML)
 * * © 2025 FinGuid - FinGuid - World's First AI Calculator Platform for Americans
 */

/* ========================================================================== */
/* I. GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const LOAN_CALCULATOR = {
    VERSION: '1.0',
    DEBUG: false, 
    
    // FRED API Configuration (Real Key)
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a', 
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    FRED_SERIES_ID: 'PRIME', // US Prime Rate - Benchmark for business loans
    RATE_UPDATE_INTERVAL: 4 * 60 * 60 * 1000, // 4 hours
    FALLBACK_RATE: 8.50, // Default rate if API fails

    // Core State - Stores inputs and calculated results
    STATE: {
        loanAmount: 100000,
        loanTermYears: 7,
        annualRate: 8.50,
        initialInvestment: 5000,
        monthlyRevenueIncrease: 1500,
        
        // Results
        monthlyPayment: 0,
        totalInterest: 0,
        totalPayments: 0,
        netCashFlow: 0,
        roiPercentage: 0,
        sbaPrimeRate: 0,
        amortization: [],
        cashFlowProjection: []
    }
};

/* ========================================================================== */
/* II. UTILITY FUNCTIONS */
/* ========================================================================== */

const FORMATTER = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const PERCENT_FORMATTER = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

function toFixed(num, fixed) {
    const re = new RegExp('^-?\\d+(?:\\.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
}

/* ========================================================================== */
/* III. FRED API INTEGRATION */
/* ========================================================================== */

const fredAPI = {
    fetchLatestRate: async () => {
        const url = `${LOAN_CALCULATOR.FRED_BASE_URL}?series_id=${LOAN_CALCULATOR.FRED_SERIES_ID}&api_key=${LOAN_CALCULATOR.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('FRED API network response was not ok');
            
            const data = await response.json();
            
            if (data.observations && data.observations.length > 0) {
                let latestRate = parseFloat(data.observations[0].value);
                if (latestRate === 0 || isNaN(latestRate)) {
                    // Fallback to average rate for PRIME
                    latestRate = LOAN_CALCULATOR.FALLBACK_RATE; 
                }
                
                // For a business loan, we use Prime + a minimum spread (e.g., 2% over Prime)
                // This is a dynamic but conservative assumption.
                const benchmarkRate = parseFloat(toFixed(latestRate + 2.0, 2)); 

                LOAN_CALCULATOR.STATE.annualRate = benchmarkRate;
                LOAN_CALCULATOR.STATE.sbaPrimeRate = latestRate;

                // Update UI elements
                document.getElementById('interest-rate').value = benchmarkRate;
                document.getElementById('rate-source').textContent = `(Live FRED Prime + 2.00% Spread: ${toFixed(latestRate, 2)}%)`;
                
                // Trigger calculation after fetching rate
                calculateBusinessLoan();
            } else {
                throw new Error('No observations found in FRED data.');
            }

        } catch (error) {
            if (LOAN_CALCULATOR.DEBUG) console.error('FRED API Error:', error);
            // Use fallback rate and display error
            LOAN_CALCULATOR.STATE.annualRate = LOAN_CALCULATOR.FALLBACK_RATE;
            document.getElementById('interest-rate').value = LOAN_CALCULATOR.FALLBACK_RATE;
            document.getElementById('rate-source').textContent = `(Fallback Rate: ${LOAN_CALCULATOR.FALLBACK_RATE}%)`;
            showToast('Could not fetch live rate. Using fallback rate.', 'error');
            calculateBusinessLoan();
        }
    },

    startAutomaticUpdates: () => {
        fredAPI.fetchLatestRate();
        // setInterval(fredAPI.fetchLatestRate, LOAN_CALCULATOR.RATE_UPDATE_INTERVAL); // Disabled for production stability unless needed
    }
};

/* ========================================================================== */
/* IV. CORE CALCULATION LOGIC */
/* ========================================================================== */

function calculateBusinessLoan() {
    // 1. Get Inputs
    const P = parseFloat(document.getElementById('loan-amount').value) || 0;
    const rate = parseFloat(document.getElementById('interest-rate').value) / 100;
    const termYears = parseInt(document.getElementById('loan-term').value) || 0;
    const investment = parseFloat(document.getElementById('initial-investment').value) || 0;
    const profitIncrease = parseFloat(document.getElementById('monthly-revenue-increase').value) || 0;

    // Save to state
    LOAN_CALCULATOR.STATE.loanAmount = P;
    LOAN_CALCULATOR.STATE.annualRate = rate * 100;
    LOAN_CALCULATOR.STATE.loanTermYears = termYears;
    LOAN_CALCULATOR.STATE.initialInvestment = investment;
    LOAN_CALCULATOR.STATE.monthlyRevenueIncrease = profitIncrease;

    const r = rate / 12; // Monthly interest rate
    const n = termYears * 12; // Total number of payments

    // 2. Monthly Payment Calculation (Amortization Formula)
    let M = 0;
    if (r > 0) {
        M = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    } else {
        // Zero interest or short term
        M = P / n;
    }
    M = parseFloat(toFixed(M, 2));

    // 3. Amortization Schedule (For chart and total interest)
    let balance = P;
    let totalInterest = 0;
    let amortization = [];
    let cashFlowProjection = [];
    let cumulativeNetProfit = -investment;

    for (let i = 1; i <= n; i++) {
        let interest = balance * r;
        let principal = M - interest;
        
        // Handle last payment
        if (i === n) {
            principal = balance;
            M = interest + principal;
        }

        balance -= principal;
        totalInterest += interest;
        
        // Amortization Schedule
        amortization.push({
            month: i,
            payment: M,
            principal: principal,
            interest: interest,
            balance: balance > 0.01 ? balance : 0 // Handle float errors
        });
        
        // Cash Flow Projection
        const netCashFlow = profitIncrease - M;
        cumulativeNetProfit += netCashFlow;

        cashFlowProjection.push({
            month: i,
            netCashFlow: netCashFlow,
            cumulativeNetProfit: cumulativeNetProfit
        });
    }

    // 4. Final Totals & ROI/Cash Flow
    const totalPayments = P + totalInterest;
    const totalNetProfit = cumulativeNetProfit;
    const roiPercentage = ((totalNetProfit / P) * 100) / 100; // Calculate as percentage (for formatter)
    const netCashFlow = profitIncrease - M;

    // 5. Update State
    LOAN_CALCULATOR.STATE.monthlyPayment = M;
    LOAN_CALCULATOR.STATE.totalInterest = totalInterest;
    LOAN_CALCULATOR.STATE.totalPayments = totalPayments;
    LOAN_CALCULATOR.STATE.amortization = amortization;
    LOAN_CALCULATOR.STATE.cashFlowProjection = cashFlowProjection;
    LOAN_CALCULATOR.STATE.netCashFlow = netCashFlow;
    LOAN_CALCULATOR.STATE.roiPercentage = roiPercentage;
    LOAN_CALCULATOR.STATE.totalNetProfit = totalNetProfit;
    
    // 6. Render Results
    updateResults(M, totalInterest, totalPayments, netCashFlow, roiPercentage, totalNetProfit);
    drawCharts(amortization, cashFlowProjection);
    generateSBAComparison(P, termYears);
    generateAIInsights(M, P, netCashFlow, roiPercentage, termYears);
}


/* ========================================================================== */
/* V. RENDER & UI UPDATES */
/* ========================================================================== */

function updateResults(M, totalInterest, totalPayments, netCashFlow, roiPercentage, totalNetProfit) {
    document.getElementById('monthly-payment-result').textContent = FORMATTER.format(M);
    document.getElementById('total-interest-paid').textContent = FORMATTER.format(totalInterest);
    document.getElementById('total-payments').textContent = FORMATTER.format(totalPayments);
    document.getElementById('total-net-profit').textContent = FORMATTER.format(totalNetProfit);
    document.getElementById('roi-percentage-detail').textContent = PERCENT_FORMATTER.format(roiPercentage);
    document.getElementById('roi-result').textContent = PERCENT_FORMATTER.format(roiPercentage);

    // Update Cash Flow Result box with conditional color/icon
    const cashFlowElement = document.getElementById('net-cash-flow-result');
    const cashFlowBox = cashFlowElement.closest('.detail-box');
    
    cashFlowElement.textContent = FORMATTER.format(Math.abs(netCashFlow));
    cashFlowBox.classList.remove('positive', 'negative');

    if (netCashFlow >= 0) {
        cashFlowElement.insertAdjacentHTML('afterbegin', '<i class="fas fa-arrow-up icon-green"></i> ');
        cashFlowBox.querySelector('.detail-label').textContent = 'Net Monthly Cash Flow (Positive)';
        cashFlowBox.classList.add('positive');
    } else {
        cashFlowElement.insertAdjacentHTML('afterbegin', '<i class="fas fa-arrow-down icon-red"></i> ');
        cashFlowBox.querySelector('.detail-label').textContent = 'Net Monthly Cash Flow (Negative)';
        cashFlowBox.classList.add('negative');
    }
}

/* ========================================================================== */
/* VI. CHARTS (Amortization & Cash Flow/ROI) */
/* ========================================================================== */

let amortizationChartInstance = null;
let cashFlowChartInstance = null;

function drawCharts(amortizationData, cashFlowData) {
    const monthlyData = amortizationData.map(d => d.month);
    const principalData = amortizationData.map(d => parseFloat(toFixed(d.principal, 2)));
    const interestData = amortizationData.map(d => parseFloat(toFixed(d.interest, 2)));
    const cumulativeProfitData = cashFlowData.map(d => parseFloat(toFixed(d.cumulativeNetProfit, 2)));

    // --- Amortization Chart ---
    if (amortizationChartInstance) amortizationChartInstance.destroy();
    
    const ctxAmortization = document.getElementById('amortizationChart').getContext('2d');
    amortizationChartInstance = new Chart(ctxAmortization, {
        type: 'bar',
        data: {
            labels: monthlyData.filter((_, i) => i % 12 === 0).map(m => `Year ${m / 12}`),
            datasets: [{
                label: 'Principal Paid',
                data: principalData.filter((_, i) => i % 12 === 11).map((_, i, arr) => arr.slice(i * 12, (i + 1) * 12).reduce((a, b) => a + b, 0)),
                backgroundColor: 'var(--color-teal-400)',
            }, {
                label: 'Interest Paid',
                data: interestData.filter((_, i) => i % 12 === 11).map((_, i, arr) => arr.slice(i * 12, (i + 1) * 12).reduce((a, b) => a + b, 0)),
                backgroundColor: 'var(--color-slate-500)',
            }]
        },
        options: {
            responsive: true,
            scales: { x: { stacked: true }, y: { stacked: true } },
            plugins: { title: { display: true, text: 'Yearly Principal vs. Interest' } }
        }
    });

    // --- Cash Flow/ROI Chart (Cumulative Net Profit) ---
    if (cashFlowChartInstance) cashFlowChartInstance.destroy();
    
    const ctxCashFlow = document.getElementById('cashFlowChart').getContext('2d');
    cashFlowChartInstance = new Chart(ctxCashFlow, {
        type: 'line',
        data: {
            labels: monthlyData.filter((_, i) => i % 12 === 0).map(m => `Year ${m / 12}`),
            datasets: [{
                label: 'Cumulative Net Profit (ROI)',
                data: cumulativeProfitData.filter((_, i) => i % 12 === 11),
                borderColor: 'var(--color-green-500)',
                backgroundColor: 'rgba(0, 128, 0, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: false }
            },
            plugins: {
                title: { display: true, text: 'Cumulative Net Profit Over Loan Term' }
            }
        }
    });
}

/* ========================================================================== */
/* VII. SBA COMPARISON LOGIC */
/* ========================================================================== */

function generateSBAComparison(P, termYears) {
    const primeRate = LOAN_CALCULATOR.STATE.sbaPrimeRate || LOAN_CALCULATOR.FALLBACK_RATE - 2.0;
    const tableBody = document.getElementById('sba-tbody');
    tableBody.innerHTML = ''; // Clear previous results

    // SBA 7(a) - Max Spread Example (for a loan < $50,000)
    // SBA 7(a) terms are complex. We use a typical max rate: Prime + 6.5%
    // Term typically 10 years for working capital, 25 for real estate. Using a blend of 15 years for a general example.
    const rate7a = primeRate + 6.5; 
    const term7a = Math.min(termYears, 25);
    const r7a = (rate7a / 100) / 12;
    const n7a = term7a * 12;
    const M7a = P * (r7a * Math.pow(1 + r7a, n7a)) / (Math.pow(1 + r7a, n7a) - 1);
    
    // SBA 504 - Often lower rate, longer term, but higher fees.
    // Use a fixed rate slightly lower than 7(a) for comparison.
    const rate504 = primeRate + 3.0; 
    const term504 = Math.min(termYears, 25);
    const r504 = (rate504 / 100) / 12;
    const n504 = term504 * 12;
    const M504 = P * (r504 * Math.pow(1 + r504, n504)) / (Math.pow(1 + r504, n504) - 1);


    const sbaLoans = [
        { name: 'SBA 7(a) Loan', term: `${term7a} Years`, rate: `${toFixed(rate7a, 2)}%`, payment: FORMATTER.format(M7a) },
        { name: 'SBA 504 Loan', term: `${term504} Years`, rate: `${toFixed(rate504, 2)}%`, payment: FORMATTER.format(M504) }
    ];

    sbaLoans.forEach(loan => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td data-label="Loan Type">${loan.name}</td>
            <td data-label="Max Loan Term">${loan.term}</td>
            <td data-label="Estimated Max Rate">${loan.rate}</td>
            <td data-label="Est. Monthly Payment">${loan.payment}</td>
        `;
    });
}

/* ========================================================================== */
/* VIII. AI-POWERED INSIGHTS (Conditional Text Generation) */
/* ========================================================================== */

function generateAIInsights(M, P, netCashFlow, roiPercentage, termYears) {
    const aiContent = document.getElementById('ai-insights-content');
    aiContent.innerHTML = ''; // Clear previous content
    
    // Monetary thresholds (Adjust for a real AI engine)
    const annualPayment = M * 12;
    const paymentToPrincipalRatio = annualPayment / P;
    const monthlyCashFlowPercent = (netCashFlow / M) * 100;

    let insights = [];
    
    // Insight 1: Cash Flow Stability
    if (netCashFlow < 0) {
        insights.push({
            type: 'CRITICAL',
            title: 'Cash Flow Warning',
            text: `Your projected **Net Monthly Cash Flow is negative** (${FORMATTER.format(netCashFlow)}). This means your expected profit increase is less than the required loan payment. **Action:** Consider reducing the loan amount, finding a lower interest rate, or increasing your projected profit.`
        });
    } else if (netCashFlow < 0.25 * M) { // Net Cash Flow < 25% of the payment
        insights.push({
            type: 'CAUTION',
            title: 'Tight Cash Flow Alert',
            text: `Your loan payment is high relative to your new profit, leaving a thin margin (${FORMATTER.format(netCashFlow)}). **Recommendation:** Secure an emergency fund to cover at least 6 months of payments in case business performance is volatile.`
        });
    } else {
        insights.push({
            type: 'POSITIVE',
            title: 'Strong Cash Flow Projected',
            text: `Your projected business profits are **comfortably covering the loan payment**, resulting in a positive net cash flow of **${FORMATTER.format(netCashFlow)}** per month. This signals financial stability.`
        });
    }

    // Insight 2: Return on Investment (ROI)
    if (roiPercentage > 0.50) {
        insights.push({
            type: 'POSITIVE',
            title: 'Exceptional ROI',
            text: `An estimated **${PERCENT_FORMATTER.format(roiPercentage)} ROI** is highly attractive. This investment is projected to yield high returns relative to the loan principal, a great sign for capital efficiency.`
        });
    } else if (roiPercentage > 0.15) {
        insights.push({
            type: 'CAUTION',
            title: 'Solid Investment',
            text: `The **${PERCENT_FORMATTER.format(roiPercentage)} ROI** suggests a profitable venture. Focus on maintaining your projected revenue growth to maximize this return.`
        });
    } else {
         insights.push({
            type: 'CRITICAL',
            title: 'Low ROI/High Risk',
            text: `The calculated **${PERCENT_FORMATTER.format(roiPercentage)} ROI** is relatively low. **Recommendation:** You may be over-leveraged. Re-evaluate if the loan is necessary or seek more profitable opportunities.`
        });
    }
    
    // Insight 3: Loan Structure & Comparison
     insights.push({
        type: 'NEUTRAL',
        title: 'SBA Loan Opportunity',
        text: `Based on your ${termYears}-year term, the **SBA 7(a) loan** may offer a longer repayment schedule and potentially lower monthly payment than traditional bank loans. **Action:** Navigate to the 'SBA Loan Comparison' tab to review the estimated payments and contact an SBA-preferred lender via our affiliate links.`
    });

    // Render insights
    insights.forEach(insight => {
        const div = document.createElement('div');
        div.className = `ai-insight ai-${insight.type.toLowerCase()}`;
        div.innerHTML = `
            <strong>${insight.title} (${insight.type})</strong>
            <p>${insight.text}</p>
        `;
        aiContent.appendChild(div);
    });

    // Add monetization call to action
    const adBox = document.querySelector('.ad-slot.affiliate-box').cloneNode(true);
    adBox.classList.remove('affiliate-box');
    adBox.classList.add('ad-slot-final');
    aiContent.appendChild(adBox);
}


/* ========================================================================== */
/* IX. EXPORT & UTILITY FEATURES (CSV, PWA, THEME, SPEECH) */
/* ========================================================================== */

function exportAmortizationToCSV() {
    const data = LOAN_CALCULATOR.STATE.amortization;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Month,Payment,Principal,Interest,Balance\n";

    data.forEach(row => {
        const rowString = [
            row.month,
            toFixed(row.payment, 2),
            toFixed(row.principal, 2),
            toFixed(row.interest, 2),
            toFixed(row.balance, 2)
        ].join(",");
        csvContent += rowString + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "FinGuid_BusinessLoan_Schedule.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported Amortization Schedule to CSV!', 'success');
}

// Placeholder for Theme, Speech, Toast functions (Copied from existing calculator structure)
const THEME_MANAGER = {
    loadUserPreferences: () => {
        const savedTheme = localStorage.getItem('finguid-theme') || 'light';
        document.documentElement.setAttribute('data-color-scheme', savedTheme);
        THEME_MANAGER.updateToggleButton(savedTheme);
    },
    toggleTheme: () => {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-color-scheme', currentTheme);
        localStorage.setItem('finguid-theme', currentTheme);
        THEME_MANAGER.updateToggleButton(currentTheme);
        if (amortizationChartInstance) amortizationChartInstance.update();
        if (cashFlowChartInstance) cashFlowChartInstance.update();
    },
    updateToggleButton: (theme) => {
        const button = document.getElementById('theme-toggle');
        button.innerHTML = theme === 'dark' 
            ? '<i class="fas fa-moon" aria-hidden="true"></i>' 
            : '<i class="fas fa-sun" aria-hidden="true"></i>';
    }
};

const SPEECH = {
    initialize: () => {
        document.getElementById('text-to-speech-button').addEventListener('click', SPEECH.readResults);
        document.getElementById('voice-command-button').addEventListener('click', SPEECH.startRecognition);
    },
    readResults: () => {
        const monthlyPayment = document.getElementById('monthly-payment-result').textContent;
        const netCashFlow = document.getElementById('net-cash-flow-result').textContent;
        const roi = document.getElementById('roi-result').textContent;
        const textToRead = `Your monthly payment is ${monthlyPayment}. Your net monthly cash flow is ${netCashFlow}. Your total return on investment is ${roi}. Review the AI insights tab for a detailed analysis.`;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
        showToast('Reading results...', 'neutral');
    },
    startRecognition: () => {
        // Mock recognition logic for production ready example
        showToast('Voice command activated. Try saying "calculate loan 200000 for 10 years at 8 percent"', 'neutral');
        // In a full PWA build, this would use the Web Speech API
    }
};

function showToast(message, type = 'neutral', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => container.removeChild(toast), 300);
    }, duration);
}


/* ========================================================================== */
/* X. EVENT LISTENERS & INITIALIZATION */
/* ========================================================================== */

function setupEventListeners() {
    // === Calculation Trigger ===
    document.getElementById('loan-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateBusinessLoan();
    });
    
    // Auto-recalculate on input change
    document.querySelectorAll('#loan-form input').forEach(input => {
        input.addEventListener('change', calculateBusinessLoan);
    });

    // === Tab Switching ===
    document.querySelectorAll('.tab-controls-results .tab-button').forEach(button => {
        button.addEventListener('click', function(e) {
            const tabId = e.target.getAttribute('data-tab');
            document.querySelectorAll('.results-section .tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            document.querySelectorAll('.tab-controls-results .tab-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            // Ensure charts redraw correctly if their tab is activated
            if (tabId === 'amortization-chart' && amortizationChartInstance) {
                setTimeout(() => amortizationChartInstance.resize(), 10); 
            }
             if (tabId === 'cash-flow-chart' && cashFlowChartInstance) {
                setTimeout(() => cashFlowChartInstance.resize(), 10); 
            }
        });
    });
    
    // === Theme Toggle ===
    document.getElementById('theme-toggle').addEventListener('click', THEME_MANAGER.toggleTheme);
    
    // === Export CSV ===
    document.getElementById('export-csv-button').addEventListener('click', exportAmortizationToCSV);
}

// === Initialize ===
document.addEventListener('DOMContentLoaded', function() {
    if (LOAN_CALCULATOR.DEBUG) console.log('🇺🇸 FinGuid Business Loan AI Analyzer v1.0 Initializing...');
    
    // 1. Initialize Core Features
    THEME_MANAGER.loadUserPreferences();
    SPEECH.initialize();
    setupEventListeners();
    
    // 2. Fetch Live Rate and Trigger Initial Calculation
    // This fetches the live rate, which then triggers the main calculation upon success/fail.
    fredAPI.startAutomaticUpdates(); 
    
    if (LOAN_CALCULATOR.DEBUG) console.log('✅ Business Loan Calculator initialized!');
});
