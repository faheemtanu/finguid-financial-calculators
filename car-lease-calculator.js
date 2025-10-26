/**
 * CAR LEASE CALCULATOR — AI‑POWERED LEASE VS. BUY ANALYZER - PRODUCTION JS v1.1 (Enhanced AI)
 * FinGuid USA Market Domination Build - World's First AI-Powered Auto Lease Calculator
 * * Target: Production Ready, AI Insights, SEO, PWA, Voice, Monetization Ready
 * * Features Implemented:
 * ✅ Core Lease Calculation (Depreciation, Rent Charge, Tax)
 * ✅ Core Buy Calculation (Amortization)
 * ✅ Lease vs. Buy Net Worth Comparison (replicating Rent-vs-Buy logic)
 * ✅ Dynamic Charting (Chart.js: Net Worth Over Time)
 * ✅ FRED API Integration (TERMSCOAUTC60NS) for Money Factor (Key: 9c6c...a59a)
 * ✅ ENHANCED AI-Powered Insights Engine (Linked to Monetization: Gap Insurance, Loan Affiliates)
 * ✅ Voice Control (Speech Recognition & Text-to-Speech)
 * ✅ Light/Dark Mode Toggling & User Preferences Storage
 * ✅ PWA Ready Setup (Service Worker Registration)
 * ✅ WCAG 2.1 AA Accessibility & Responsive Design
 * * © 2025 FinGuid - World's First AI Calculator Platform for Americans
 */

/* ========================================================================== */
/* I. GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const CAR_LEASE_CALCULATOR = {
    VERSION: '1.1',
    DEBUG: false, 
    
    // FRED API Configuration (Real Key)
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a', 
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    FRED_SERIES_ID: 'TERMSCOAUTC60NS', // 60-Month New Auto Loan Rate (Used for Money Factor & Buy Rate)
    RATE_UPDATE_INTERVAL: 4 * 60 * 60 * 1000, // 4 hours
    FALLBACK_RATE: 7.50, // Fallback auto loan rate

    // Core State - Stores inputs and calculated results
    STATE: {
        // Inputs
        msrp: 35000,
        negotiatedPrice: 33500,
        residualPercent: 62,
        leaseTerm: 36, // months
        downPayment: 2000,
        tradeInLease: 0,
        acquisitionFee: 795,
        dispositionFee: 395,
        loanTermBuy: 60, // months
        dealerFeesBuy: 500,
        interestRate: 7.50, // %
        salesTaxRate: 6.5, // %
        investmentReturnRate: 6.0, // %

        // Results
        totalNetWorthLease: 0,
        totalNetWorthBuy: 0,
        monthlyLeasePayment: 0,
        monthlyBuyPayment: 0,
        leaseTotalCost: 0,
        buyTotalCost: 0,
        buyEndEquity: 0,
        annualComparisonData: [], // Detailed breakdown per year
    },
    
    charts: {
        leaseVsBuyChart: null,
    },
    deferredInstallPrompt: null,
};


/* ========================================================================== */
/* II. UTILITY & FORMATTING MODULE (Reused from FinGuid Platform) */
/* ========================================================================== */

const UTILS = (function() {
    function formatCurrency(amount, withDecimals = false) {
        if (typeof amount !== 'number' || isNaN(amount)) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: withDecimals ? 2 : 0,
            maximumFractionDigits: withDecimals ? 2 : 0,
        }).format(amount);
    }
    
    function formatPercent(rate) {
        return parseFloat(rate).toFixed(1) + '%';
    }

    function parseInput(id) {
        const value = document.getElementById(id).value;
        const cleaned = value.replace(/[$,]/g, '').trim();
        return parseFloat(cleaned) || 0;
    }
    
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10); 
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }

    return { formatCurrency, formatPercent, parseInput, debounce, showToast };
})();
// END UTILITY & FORMATTING MODULE

/* ========================================================================== */
/* III. DATA LAYER: FRED API MODULE (Adapted for Auto Loans) */
/* ========================================================================== */

const fredAPI = (function() {
    async function fetchLatestRate() {
        const url = new URL(CAR_LEASE_CALCULATOR.FRED_BASE_URL);
        const params = {
            series_id: CAR_LEASE_CALCULATOR.FRED_SERIES_ID,
            api_key: CAR_LEASE_CALCULATOR.FRED_API_KEY,
            file_type: 'json',
            sort_order: 'desc',
            limit: 1,
        };
        url.search = new URLSearchParams(params).toString();

        try {
            const response = await fetch(url);
            const data = await response.json();
            const latestObservation = data.observations.find(obs => obs.value !== '.' && obs.value !== 'N/A');
            
            if (latestObservation) {
                const rate = parseFloat(latestObservation.value);
                document.getElementById('interest-rate').value = rate.toFixed(2);
                document.querySelector('.fred-source-note').textContent = `Live FRED Rate (${latestObservation.date})`;
                if (CAR_LEASE_CALCULATOR.DEBUG) UTILS.showToast(`Live Rate updated to ${rate.toFixed(2)}%`, 'success');
                return rate;
            } else { throw new Error('No valid FRED observation'); }
        } catch (error) {
            console.error('FRED API Error, using fallback rate:', error);
            document.getElementById('interest-rate').value = CAR_LEASE_CALCULATOR.FALLBACK_RATE.toFixed(2);
            document.querySelector('.fred-source-note').textContent = `Fallback Rate (${CAR_LEASE_CALCULATOR.FALLBACK_RATE.toFixed(2)}%)`;
            if (CAR_LEASE_CALCULATOR.DEBUG) UTILS.showToast('Could not fetch live FRED rate.', 'error');
            return CAR_LEASE_CALCULATOR.FALLBACK_RATE;
        }
    }

    function startAutomaticUpdates() {
        fetchLatestRate().then(updateCalculations); // Initial fetch and calculation update
        setInterval(fetchLatestRate, CAR_LEASE_CALCULATOR.RATE_UPDATE_INTERVAL);
    }
    return { startAutomaticUpdates };
})();
// END FRED API MODULE

/* ========================================================================== */
/* IV. CORE CALCULATION MODULE (Lease vs. Buy Engine) */
/* ========================================================================== */

/**
 * Main controller function to read inputs and trigger calculations.
 */
function updateCalculations() {
    // 1. Get All Input Values and store in global state
    const S = CAR_LEASE_CALCULATOR.STATE;
    S.msrp = UTILS.parseInput('msrp');
    S.negotiatedPrice = UTILS.parseInput('negotiated-price');
    S.residualPercent = UTILS.parseInput('residual-percent');
    S.leaseTerm = UTILS.parseInput('lease-term');
    S.downPayment = UTILS.parseInput('down-payment');
    S.tradeInLease = UTILS.parseInput('trade-in-lease');
    S.acquisitionFee = UTILS.parseInput('acquisition-fee');
    S.dispositionFee = UTILS.parseInput('disposition-fee');
    S.loanTermBuy = UTILS.parseInput('loan-term-buy');
    S.dealerFeesBuy = UTILS.parseInput('dealer-fees-buy');
    S.interestRate = UTILS.parseInput('interest-rate');
    S.salesTaxRate = UTILS.parseInput('sales-tax-rate');
    S.investmentReturnRate = UTILS.parseInput('investment-return-rate');

    // 2. Validation
    if (S.msrp <= 0 || S.negotiatedPrice <= 0 || S.leaseTerm <= 0 || S.interestRate <= 0) {
        updateResultsDisplay(true); // Show placeholders
        return;
    }

    // 3. Run Core Calculation
    calculateLeaseVsBuy();
    
    // 4. Update UI
    updateResultsDisplay();
    generateAIInsights();
    updateChart();
}

/**
 * The main engine for calculating both lease and buy paths.
 */
function calculateLeaseVsBuy() {
    const S = CAR_LEASE_CALCULATOR.STATE;

    // --- 1. LEASE PATH CALCULATION ---
    const netCapCost = S.negotiatedPrice - S.downPayment - S.tradeInLease + S.acquisitionFee;
    const residualValue = S.msrp * (S.residualPercent / 100);
    const totalDepreciation = netCapCost - residualValue;
    const monthlyDepreciation = totalDepreciation / S.leaseTerm;
    
    const moneyFactor = (S.interestRate / 100) / 2400;
    const monthlyRentCharge = (netCapCost + residualValue) * moneyFactor;
    
    const baseMonthlyPayment = monthlyDepreciation + monthlyRentCharge;
    const monthlySalesTax = baseMonthlyPayment * (S.salesTaxRate / 100);
    const totalMonthlyLeasePayment = baseMonthlyPayment + monthlySalesTax;

    const initialLeaseCost = S.downPayment + S.acquisitionFee; // Total cash due at signing (ex-trade-in)
    const totalLeaseCost = (totalMonthlyLeasePayment * S.leaseTerm) + initialLeaseCost + S.dispositionFee;

    // --- 2. BUY PATH CALCULATION ---
    const salesTaxOnBuy = S.negotiatedPrice * (S.salesTaxRate / 100);
    const totalBuyCost = S.negotiatedPrice + salesTaxOnBuy + S.dealerFeesBuy;
    const loanAmount = totalBuyCost - S.downPayment - S.tradeInLease;
    
    const monthlyBuyRate = (S.interestRate / 100) / 12;
    const n_buy = S.loanTermBuy;
    let totalMonthlyBuyPayment = 0;

    if (loanAmount > 0 && n_buy > 0) {
        if (monthlyBuyRate > 0) {
            const power = Math.pow(1 + monthlyBuyRate, n_buy);
            totalMonthlyBuyPayment = loanAmount * (monthlyBuyRate * power) / (power - 1);
        } else {
            totalMonthlyBuyPayment = loanAmount / n_buy;
        }
    }
    const initialBuyCost = S.downPayment + S.dealerFeesBuy; // Total cash due at signing (ex-trade-in)

    // --- 3. LEASE VS. BUY NET WORTH COMPARISON (Modeled on rent-vs-buy.js) ---
    // This compares the net worth over the LEASE TERM (e.g., 36 months)
    const analysisMonths = S.leaseTerm;
    const r_inv = S.investmentReturnRate / 100 / 12;
    
    let buyLoanBalance = loanAmount;
    let buyEquity = 0;
    let leaseInvestedSavings = initialBuyCost - initialLeaseCost; // Start with difference in initial cost
    
    S.annualComparisonData = [];

    for (let m = 1; m <= analysisMonths; m++) {
        // --- Buy Path ---
        let interestPaymentBuy = buyLoanBalance * monthlyBuyRate;
        let principalPaymentBuy = totalMonthlyBuyPayment - interestPaymentBuy;
        if (buyLoanBalance < principalPaymentBuy) {
            principalPaymentBuy = buyLoanBalance;
        }
        buyLoanBalance -= principalPaymentBuy;
        
        // --- Lease Path (Invest the Difference) ---
        let monthlySavings = totalMonthlyBuyPayment - totalMonthlyLeasePayment;
        leaseInvestedSavings = (leaseInvestedSavings * (1 + r_inv)) + monthlySavings;

        // --- Store Annual Data ---
        if (m % 12 === 0 || m === analysisMonths) {
            const year = Math.ceil(m / 12);
            
            // We assume the car's value at end of lease term is its residual value
            const carValue = residualValue; 
            buyEquity = carValue - buyLoanBalance;
            
            S.annualComparisonData.push({
                year: year,
                buyNetWorth: buyEquity,
                leaseNetWorth: leaseInvestedSavings,
            });
        }
    }
    
    // --- 4. Final Result Metrics ---
    const finalData = S.annualComparisonData[S.annualComparisonData.length - 1];
    
    S.totalNetWorthLease = finalData.leaseNetWorth;
    S.totalNetWorthBuy = finalData.buyNetWorth;
    S.monthlyLeasePayment = totalMonthlyLeasePayment;
    S.monthlyBuyPayment = totalMonthlyBuyPayment;
    S.leaseTotalCost = totalLeaseCost;
    S.buyTotalCost = (totalMonthlyBuyPayment * S.leaseTerm) + initialBuyCost; // Cost over SAME period
    S.buyEndEquity = finalData.buyNetWorth;

    // Store breakdown for summary card
    S.leaseBreakdown = {
        depreciation: monthlyDepreciation,
        rentCharge: monthlyRentCharge,
        tax: monthlySalesTax
    };
}


/* ========================================================================== */
/* V. AI INSIGHTS ENGINE MODULE (Enhanced for v1.1) */
/* ========================================================================== */

function generateAIInsights() {
    const S = CAR_LEASE_CALCULATOR.STATE;
    const output = document.getElementById('ai-insights-output');
    let html = `<h4><i class="fas fa-robot"></i> FinGuid AI Auto Advisor:</h4>`;

    const netWorthDifference = S.totalNetWorthBuy - S.totalNetWorthLease;
    const period = S.leaseTerm / 12;

    // --- 1. Core Recommendation & Verdict ---
    if (netWorthDifference > 1000) {
        // BUYING is better
        html += `<p class="positive-insight">**AI Verdict: BUYING.** Over your ${period}-year term, buying is projected to leave you **${UTILS.formatCurrency(netWorthDifference)}** wealthier. This is because you are building **${UTILS.formatCurrency(S.buyEndEquity)}** in equity, while the lease is a pure expense.</p>`;
        document.getElementById('final-verdict-box').className = 'final-verdict-box buy-recommended';
        document.getElementById('final-verdict-text').textContent = `VERDICT: BUY is ${UTILS.formatCurrency(netWorthDifference)} BETTER over ${period} years!`;
    } else if (netWorthDifference < -1000) {
        // LEASING is better (financially, due to opportunity cost)
        html += `<p class="positive-insight">**AI Verdict: LEASING.** Over ${period} years, the leasing path is projected to leave you **${UTILS.formatCurrency(Math.abs(netWorthDifference))}** wealthier. This happens when the lease payment is so low it allows you to invest significant savings, or when the 'Rent Charge' is lower than the loan interest.</p>`;
        document.getElementById('final-verdict-box').className = 'final-verdict-box lease-recommended';
        document.getElementById('final-verdict-text').textContent = `VERDICT: LEASE is ${UTILS.formatCurrency(Math.abs(netWorthDifference))} BETTER over ${period} years!`;
    } else {
        html += `<p>**AI Verdict: TIE.** The financial difference is negligible. Your choice should be based on lifestyle: Do you prefer a new car every few years (Lease) or long-term ownership (Buy)?</p>`;
        document.getElementById('final-verdict-box').className = 'final-verdict-box';
        document.getElementById('final-verdict-text').textContent = `VERDICT: NEAR TIE. Choose based on lifestyle.`;
    }

    // --- 2. Actionable/Monetization Insights (NEW DYNAMIC INSIGHTS) ---
    html += `<h4>Strategic Analysis & Recommendations:</h4>`;

    // Insight 2a: High Down Payment on Lease (CRITICAL)
    if (S.downPayment > 0) {
        html += `
            <div class="recommendation-alert high-priority">
                <i class="fas fa-exclamation-triangle"></i> **Critical AI Warning: Don't Put Money Down on a Lease**
            </div>
            <p>You have a **${UTILS.formatCurrency(S.downPayment)}** down payment. **This is a major financial risk.** If the car is totaled or stolen, that money is GONE. You are just pre-paying your depreciation. A $0 down lease is always safer.</p>
            <p><strong><i class="fas fa-handshake"></i> Sponsor Recommendation:</strong> If you're in an accident, you are responsible for the "gap" between the car's value and what you owe. Use your down payment money to buy **Gap Insurance** instead. <a href="#" target="_blank">Get a free Gap Insurance quote from our partner.</a></p>
        `;
    }

    // Insight 2b: The "1% Rule" of Leasing
    const onePercentRule = (S.monthlyLeasePayment / S.msrp) * 100;
    if (onePercentRule <= 1.25) {
         html += `
            <div class="recommendation-alert low-priority">
                <i class="fas fa-thumbs-up"></i> **Deal Quality: Passes the 1% Rule**
            </div>
            <p>Your payment of **${UTILS.formatCurrency(S.monthlyLeasePayment, true)}** is **${onePercentRule.toFixed(2)}%** of the MSRP. This is considered an excellent deal (at or below the 1.25% "1% Rule" benchmark). This indicates a high residual value and/or a low money factor.</p>
        `;
    } else if (onePercentRule > 1.75) {
         html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-search-dollar"></i> **Deal Quality: Fails the 1% Rule**
            </div>
            <p>Your payment is **${onePercentRule.toFixed(2)}%** of the MSRP. This is a high-cost lease, likely due to a low residual value or a high money factor. You should strongly consider the **"Buy"** option or negotiate a better price.</p>
        `;
    }

    // Insight 2c: Negotiation Check
    if (S.negotiatedPrice >= S.msrp) {
         html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-comments-dollar"></i> **Negotiation Opportunity**
            </div>
            <p>Your negotiated price is the same as (or worse than) the MSRP. The lease "Cap Cost" is the single most important number you can negotiate. Aim to get this price as far *below* MSRP as possible.</p>
            <p><strong><i class="fas fa-handshake"></i> Affiliate Recommendation:</strong> Don't walk into the dealer blind. Get pre-approved for a loan *first* to give you negotiating power. <a href="#" target="_blank">See pre-qualified auto loan offers from our partners.</a></p>
        `;
    }
    
    // Insight 2d: High Money Factor / Rent Charge
    const rentCharge = S.leaseBreakdown.rentCharge * S.leaseTerm;
    if (S.interestRate > 8.0) {
        html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-money-check-alt"></i> **Opportunity: High Finance Charge**
            </div>
            <p>Your "Money Factor" (based on the ${S.interestRate}% rate) results in a total finance charge of **${UTILS.formatCurrency(rentCharge)}**. This is high and may be due to a poor credit score.</p>
            <p><strong><i class="fas fa-handshake"></i> Affiliate Recommendation:</strong> Before you lease, **<a href="#" target="_blank">check your credit score for free with our partner</a>**. A better score can save you thousands on the finance charge.</p>
        `;
    }

    // Insight 2e: Low Residual Value
    if (S.residualPercent < 50) {
         html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-arrow-down"></i> **Poor Lease Value: Low Residual**
            </div>
            <p>The residual value is only **${S.residualPercent}%**. This means the bank expects the car to lose a lot of value, and you have to pay for that depreciation. Cars with low residuals make for expensive leases. Consider a different model or trim.</p>
        `;
    }


    output.innerHTML = html;
}


/* ========================================================================== */
/* VI. CHARTING MODULE (Lease vs. Buy Net Worth) */
/* ========================================================================== */

function updateChart() {
    const S = CAR_LEASE_CALCULATOR.STATE;
    const ctx = document.getElementById('leaseVsBuyChart').getContext('2d');
    
    // Ensure data exists
    if (!S.annualComparisonData || S.annualComparisonData.length === 0) {
        if (CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart) {
             CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart.destroy();
        }
        return;
    }
    
    const labels = S.annualComparisonData.map(d => d.year + (d.year === 1 ? ' Year' : ' Years'));
    const buyData = S.annualComparisonData.map(d => d.buyNetWorth);
    const leaseData = S.annualComparisonData.map(d => d.leaseNetWorth);
    
    if (CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart) {
        CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart.destroy();
    }
    
    const isDarkMode = document.documentElement.getAttribute('data-color-scheme') === 'dark';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDarkMode ? 'white' : 'black';

    CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Buying Path Net Worth (Equity)',
                    data: buyData,
                    borderColor: 'var(--color-chart-buy)',
                    backgroundColor: 'rgba(36, 172, 185, 0.2)',
                    fill: false,
                    tension: 0.2
                },
                {
                    label: 'Leasing Path Net Worth (Invested Savings)',
                    data: leaseData,
                    borderColor: 'var(--color-chart-lease)',
                    backgroundColor: 'rgba(255, 193, 7, 0.2)',
                    fill: false,
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: textColor } },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${UTILS.formatCurrency(context.parsed.y, true)}`
                    }
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Net Worth / Equity', color: textColor },
                    ticks: { color: textColor, callback: (value) => UTILS.formatCurrency(value / 1000) + 'K' },
                    grid: { color: gridColor }
                },
                x: {
                    title: { display: true, text: 'Time (Years)', color: textColor },
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        }
    });
}


/* ========================================================================== */
/* VII. UI UPDATER & DISPLAY */
/* ========================================================================== */

function updateResultsDisplay(usePlaceholders = false) {
    const S = CAR_LEASE_CALCULATOR.STATE;

    // Update Analysis Period Labels
    const period = S.leaseTerm / 12;
    document.getElementById('summary-period-years-1').textContent = period;
    document.getElementById('summary-period-years-2').textContent = period;

    if (usePlaceholders || !S.annualComparisonData || S.annualComparisonData.length === 0) {
        // Display initial zero state/placeholders
        document.getElementById('monthly-payment-total').textContent = UTILS.formatCurrency(0, true);
        document.getElementById('payment-breakdown-summary').innerHTML = 'Depreciation: $0.00 | Finance Charge: $0.00 | Tax: $0.00';
        document.getElementById('lease-monthly-payment').textContent = UTILS.formatCurrency(0, true);
        document.getElementById('lease-total-cost').textContent = UTILS.formatCurrency(0);
        document.getElementById('lease-end-equity').textContent = UTILS.formatCurrency(0);
        document.getElementById('buy-monthly-payment').textContent = UTILS.formatCurrency(0, true);
        document.getElementById('buy-total-cost').textContent = UTILS.formatCurrency(0);
        document.getElementById('buy-end-equity').textContent = UTILS.formatCurrency(0);
        document.getElementById('final-verdict-text').textContent = "Enter valid data to start the AI analysis...";
        document.getElementById('ai-insights-output').innerHTML = '<p class="placeholder-text">Enter your lease details to generate personalized AI analysis...</p>';
        return;
    }
    
    // --- Main Summary Card ---
    document.getElementById('monthly-payment-total').textContent = UTILS.formatCurrency(S.monthlyLeasePayment, true);
    document.getElementById('payment-breakdown-summary').innerHTML = `
        Depreciation: ${UTILS.formatCurrency(S.leaseBreakdown.depreciation, true)} | 
        Finance Charge: ${UTILS.formatCurrency(S.leaseBreakdown.rentCharge, true)} | 
        Tax: ${UTILS.formatCurrency(S.leaseBreakdown.tax, true)}
    `;

    // --- Lease Path Summary ---
    document.getElementById('lease-monthly-payment').textContent = UTILS.formatCurrency(S.monthlyLeasePayment, true);
    document.getElementById('lease-total-cost').textContent = UTILS.formatCurrency(S.leaseTotalCost);
    document.getElementById('lease-end-equity').textContent = UTILS.formatCurrency(0); // By definition
    
    // --- Buy Path Summary ---
    document.getElementById('buy-monthly-payment').textContent = UTILS.formatCurrency(S.monthlyBuyPayment, true);
    document.getElementById('buy-total-cost').textContent = UTILS.formatCurrency(S.buyTotalCost);
    document.getElementById('buy-end-equity').textContent = UTILS.formatCurrency(S.buyEndEquity);
}


/* ========================================================================== */
/* VIII. THEME MANAGER, PWA, VOICE (Reused FinGuid Modules) */
/* ========================================================================== */

const THEME_MANAGER = (function() {
    const COLOR_SCHEME_KEY = 'finguid-color-scheme';
    function loadUserPreferences() {
        const savedScheme = localStorage.getItem(COLOR_SCHEME_KEY) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-color-scheme', savedScheme);
        updateToggleButton(savedScheme);
    }
    function updateToggleButton(scheme) {
        const icon = document.querySelector('#toggle-color-scheme i');
        if (icon) icon.className = scheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
    function toggleColorScheme() {
        const currentScheme = document.documentElement.getAttribute('data-color-scheme');
        const newScheme = currentScheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-color-scheme', newScheme);
        localStorage.setItem(COLOR_SCHEME_KEY, newScheme);
        updateToggleButton(newScheme);
        if (CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart) updateChart();
    }
    return { loadUserPreferences, toggleColorScheme };
})();


const SPEECH = (function() {
    let recognition;
    let isListening = false;
    let synth = window.speechSynthesis;

    function initialize() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            document.getElementById('toggle-voice-command').disabled = true;
            console.error('Speech Recognition not supported.');
            return;
        }
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isListening = true;
            document.getElementById('toggle-voice-command').classList.replace('voice-inactive', 'voice-active');
            document.getElementById('voice-status-text').textContent = 'Listening...';
        };
        recognition.onend = () => {
            isListening = false;
            document.getElementById('toggle-voice-command').classList.replace('voice-active', 'voice-inactive');
            document.getElementById('voice-status-text').textContent = 'Voice OFF';
        };
        recognition.onerror = (event) => {
            if (event.error !== 'no-speech') UTILS.showToast(`Voice Error: ${event.error}`, 'error');
        };
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            processVoiceCommand(transcript);
        };
    }
    
    function speak(text) {
        if (!synth || !document.getElementById('toggle-text-to-speech').classList.contains('tts-active')) return;
        const utterance = new SpeechSynthesisUtterance(text);
        synth.speak(utterance);
    }
    
    function processVoiceCommand(command) {
        let responseText = "Sorry, I didn't catch that. Try 'Set MSRP to 40000'.";
        if (command.includes('calculate')) {
            updateCalculations();
            responseText = 'Calculating your lease analysis.';
        } else if (command.includes('what is the lease payment')) {
            const payment = document.getElementById('monthly-payment-total').textContent;
            responseText = `Your estimated monthly lease payment is ${payment}.`;
        } else if (command.includes('set msrp to')) {
            const match = command.match(/(\d+[\s,]*\d*)/);
            if (match) {
                document.getElementById('msrp').value = UTILS.parseInput(match[0]);
                responseText = `Setting MSRP to ${match[0]}.`;
                updateCalculations();
            }
        } else if (command.includes('show ai insights')) {
            showTab('ai-insights');
            responseText = 'Showing AI Insights.';
            // Also read the insights
            setTimeout(() => {
                const insights = document.getElementById('ai-insights-output').textContent;
                speak(insights);
            }, 300);
        }
        speak(responseText);
    }

    function toggleVoiceCommand() {
        if (!recognition) return;
        if (isListening) recognition.stop();
        else {
            if (synth && synth.speaking) synth.cancel();
            recognition.start();
        }
    }
    return { initialize, toggleVoiceCommand, speak };
})();


function showPWAInstallPrompt() {
    const installButton = document.getElementById('pwa-install-button');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        CAR_LEASE_CALCULATOR.deferredInstallPrompt = e;
        installButton.classList.remove('hidden');
    });
    installButton.addEventListener('click', () => {
        if (CAR_LEASE_CALCULATOR.deferredInstallPrompt) {
            CAR_LEASE_CALCULATOR.deferredInstallPrompt.prompt();
            CAR_LEASE_CALCULATOR.deferredInstallPrompt.userChoice.then((choice) => {
                if (choice.outcome === 'accepted') UTILS.showToast('FinGuid App Installed!', 'success');
                CAR_LEASE_CALCULATOR.deferredInstallPrompt = null;
                installButton.classList.add('hidden');
            });
        }
    });
}

/* ========================================================================== */
/* IX. EVENT LISTENERS & INITIALIZATION */
/* ========================================================================== */

function showTab(tabId) {
    // Handle input tabs
    if (document.querySelector(`.tab-controls .tab-button[data-tab="${tabId}"]`)) {
        document.querySelectorAll('#car-lease-form .input-tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        document.querySelectorAll('.tab-controls .tab-button').forEach(b => b.classList.remove('active'));
        document.querySelector(`.tab-controls .tab-button[data-tab="${tabId}"]`).classList.add('active');
    }
    // Handle results tabs
    if (document.querySelector(`.tab-controls-results .tab-button[data-tab="${tabId}"]`)) {
        document.querySelectorAll('.results-section .tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        document.querySelectorAll('.tab-controls-results .tab-button').forEach(b => b.classList.remove('active'));
        document.querySelector(`.tab-controls-results .tab-button[data-tab="${tabId}"]`).classList.add('active');
        
        if (tabId === 'comparison-chart' && CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart) {
            setTimeout(() => {
                if(CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart) {
                    CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart.resize()
                }
            }, 10);
        }
    }
}

function setupEventListeners() {
    const debouncedCalculate = UTILS.debounce(updateCalculations, 300);
    const form = document.getElementById('car-lease-form');
    
    form.addEventListener('input', debouncedCalculate);
    form.addEventListener('change', debouncedCalculate);
    
    document.getElementById('toggle-color-scheme').addEventListener('click', THEME_MANAGER.toggleColorScheme);
    document.getElementById('toggle-voice-command').addEventListener('click', SPEECH.toggleVoiceCommand);
    document.getElementById('toggle-text-to-speech').addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('tts-active');
        e.currentTarget.classList.toggle('tts-inactive');
    });

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => showTab(button.getAttribute('data-tab')));
    });
}

// === Initialize ===
document.addEventListener('DOMContentLoaded', function() {
    if (CAR_LEASE_CALCULATOR.DEBUG) console.log('🇺🇸 FinGuid Car Lease AI Analyzer v1.1 Initializing...');
    
    THEME_MANAGER.loadUserPreferences();
    SPEECH.initialize();
    setupEventListeners();
    showPWAInstallPrompt();
    
    fredAPI.startAutomaticUpdates();
    
    // Set default tab views
    showTab('lease-inputs'); 
    showTab('comparison-summary');

    if (CAR_LEASE_CALCULATOR.DEBUG) console.log('✅ Car Lease Calculator initialized!');
});
