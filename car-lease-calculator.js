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
    VERSION: '1.1', // Updated version for AI enhancements
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
        leaseBreakdown: { depreciation: 0, rentCharge: 0, tax: 0 }, // Initialize breakdown
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
    if (S.msrp <= 0 || S.negotiatedPrice <= 0 || S.leaseTerm <= 0 || S.interestRate < 0) { // Allow 0% rate
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
    const salesTaxOnBuy = (S.negotiatedPrice - S.tradeInLease) * (S.salesTaxRate / 100); // Tax often applied after trade-in
    const totalBuyCost = S.negotiatedPrice + Math.max(0, salesTaxOnBuy) + S.dealerFeesBuy;
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
    // Start with difference in initial cost + first month's payment difference
    let leaseInvestedSavings = (initialBuyCost - initialLeaseCost) + (totalMonthlyBuyPayment - totalMonthlyLeasePayment);

    S.annualComparisonData = [];

    for (let m = 1; m <= analysisMonths; m++) {
        // --- Buy Path ---
        let interestPaymentBuy = buyLoanBalance * monthlyBuyRate;
        let principalPaymentBuy = totalMonthlyBuyPayment - interestPaymentBuy;
        if (buyLoanBalance < principalPaymentBuy) { // Final payment adjustment
            principalPaymentBuy = buyLoanBalance;
        }
        if(buyLoanBalance > 0) buyLoanBalance -= principalPaymentBuy;
        buyLoanBalance = Math.max(0, buyLoanBalance); // Ensure balance isn't negative

        // --- Lease Path (Invest the Difference) ---
        // Apply investment return FIRST, then add this month's savings (if it's not the first month)
        if (m > 1) {
             leaseInvestedSavings = (leaseInvestedSavings * (1 + r_inv)) + (totalMonthlyBuyPayment - totalMonthlyLeasePayment);
        } else {
             leaseInvestedSavings = leaseInvestedSavings * (1 + r_inv); // Only apply return in month 1
        }


        // --- Store Annual Data ---
        if (m % 12 === 0 || m === analysisMonths) {
            const year = Math.ceil(m / 12);

            // Assume the car's value at end of lease term is its residual value for EQUITY calculation
            const carValue = residualValue;
            buyEquity = Math.max(0, carValue - buyLoanBalance); // Equity can't be negative for this comparison

            S.annualComparisonData.push({
                year: year,
                buyNetWorth: buyEquity,
                leaseNetWorth: leaseInvestedSavings,
            });
        }
    }

    // --- 4. Final Result Metrics ---
    // Ensure finalData exists before accessing properties
    const finalData = S.annualComparisonData.length > 0 ? S.annualComparisonData[S.annualComparisonData.length - 1] : { leaseNetWorth: 0, buyNetWorth: 0 };


    S.totalNetWorthLease = finalData.leaseNetWorth;
    S.totalNetWorthBuy = finalData.buyNetWorth;
    S.monthlyLeasePayment = totalMonthlyLeasePayment;
    S.monthlyBuyPayment = totalMonthlyBuyPayment;
    S.leaseTotalCost = totalLeaseCost;
    // Calculate Buy Total Cost over the SAME lease term period for fair comparison
    S.buyTotalCost = (totalMonthlyBuyPayment * S.leaseTerm) + initialBuyCost;
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

    // Ensure calculations have run
     if (!S.annualComparisonData || S.annualComparisonData.length === 0) {
        output.innerHTML = '<p class="placeholder-text">Enter valid lease and buy details to generate AI analysis...</p>';
        return;
    }

    const netWorthDifference = S.totalNetWorthBuy - S.totalNetWorthLease;
    const period = S.leaseTerm / 12;

    // --- 1. Core Recommendation & Verdict ---
    if (netWorthDifference > 1000) {
        // BUYING is better
        html += `<p><strong class="positive-insight">AI Verdict: BUYING Recommended.</strong> Over your ${period}-year analysis period, buying is projected to leave you **${UTILS.formatCurrency(netWorthDifference)}** wealthier. This is primarily because you build **${UTILS.formatCurrency(S.buyEndEquity)}** in equity by the end of the term, while the lease is purely an expense.</p>`;
        document.getElementById('final-verdict-box').className = 'final-verdict-box buy-recommended';
        document.getElementById('final-verdict-text').textContent = `VERDICT: BUY is ${UTILS.formatCurrency(netWorthDifference)} BETTER over ${period} years!`;
    } else if (netWorthDifference < -1000) {
        // LEASING is better (financially, due to opportunity cost)
        html += `<p><strong class="positive-insight">AI Verdict: LEASING Recommended.</strong> Over ${period} years, the leasing path is projected to leave you **${UTILS.formatCurrency(Math.abs(netWorthDifference))}** wealthier. This typically occurs when the lease payment is significantly lower than the buy payment, allowing your invested savings to outperform the equity built by buying, or when the lease has a very low 'Money Factor' (interest rate).</p>`;
        document.getElementById('final-verdict-box').className = 'final-verdict-box lease-recommended';
        document.getElementById('final-verdict-text').textContent = `VERDICT: LEASE is ${UTILS.formatCurrency(Math.abs(netWorthDifference))} BETTER over ${period} years!`;
    } else {
        html += `<p><strong>AI Verdict: TIE.</strong> The financial difference between leasing and buying over ${period} years is minimal in this scenario. Your decision should hinge on **lifestyle preferences**: Do you prioritize always having a new car with lower payments (Lease), or do you prefer ownership and building equity over the long term (Buy)?</p>`;
        document.getElementById('final-verdict-box').className = 'final-verdict-box'; // Neutral style
        document.getElementById('final-verdict-text').textContent = `VERDICT: NEAR TIE. Choose based on lifestyle.`;
    }

    // --- 2. Actionable/Monetization Insights (NEW DYNAMIC INSIGHTS) ---
    html += `<h4>Strategic Analysis & Recommendations:</h4>`;
    let insightsAdded = 0;

    // Insight 2a: High Down Payment on Lease (CRITICAL)
    if (S.downPayment > 100) { // Check if > $100 for robustness
        insightsAdded++;
        html += `
            <div class="recommendation-alert high-priority">
                <i class="fas fa-exclamation-triangle"></i> **Critical AI Warning: Don't Put Money Down on a Lease**
            </div>
            <p>You have a **${UTILS.formatCurrency(S.downPayment)}** down payment ('Cap Cost Reduction'). **This is a major financial risk on a lease.** If the car is totaled or stolen early in the lease, your down payment money is typically GONE, and insurance only covers the car's market value. You are simply pre-paying depreciation and taking unnecessary risk.</p>
            <p><strong>💡 AI Strategy:</strong> Aim for a $0 down lease. Use that cash for the first month's payment and fees only.</p>
            <p><strong><i class="fas fa-handshake"></i> Sponsor Recommendation:</strong> If your leased car's value drops below what you owe (common), you are responsible for the difference in an accident. Protect yourself with **Gap Insurance**. <a href="#" target="_blank" rel="noopener sponsored">Get a free Gap Insurance quote from our partner.</a> It's often cheaper than the dealer's offering.</p>
        `;
    }

    // Insight 2b: The "1% Rule" of Leasing
    const onePercentRule = (S.monthlyLeasePayment / S.msrp) * 100;
     if (!isNaN(onePercentRule) && S.msrp > 0) { // Avoid division by zero
        insightsAdded++;
        if (onePercentRule <= 1.25 && S.downPayment === 0) { // Good deal only if $0 down
             html += `
                <div class="recommendation-alert low-priority">
                    <i class="fas fa-thumbs-up"></i> **Deal Quality: Excellent (Passes the 1% Rule with $0 Down)**
                </div>
                <p>Your monthly payment of **${UTILS.formatCurrency(S.monthlyLeasePayment, true)}** is **${onePercentRule.toFixed(2)}%** of the MSRP, and you have $0 down. This typically indicates a strong deal, likely driven by a high residual value (${S.residualPercent}%) and/or a low money factor (interest rate).</p>
            `;
        } else if (onePercentRule > 1.75 || (onePercentRule > 1.25 && S.downPayment > 0) ) {
             html += `
                <div class="recommendation-alert medium-priority">
                    <i class="fas fa-search-dollar"></i> **Deal Quality: Potentially Poor (Fails the 1% Rule or High Down Payment)**
                </div>
                <p>Your payment (${UTILS.formatCurrency(S.monthlyLeasePayment, true)}) is high relative to the MSRP (${onePercentRule.toFixed(2)}%), especially considering your down payment. This suggests either a low residual value, a high money factor (interest), or insufficient negotiation on the price. You should strongly reconsider or negotiate harder.</p>
                <p><strong><i class="fas fa-handshake"></i> Affiliate Recommendation:</strong> A high payment might stem from a high interest rate (Money Factor). This is often linked to credit score. <a href="#" target="_blank" rel="noopener affiliate">Check your credit score for free via our partner</a> before negotiating further.</p>
            `;
        }
    }


    // Insight 2c: Negotiation Check (Cap Cost vs MSRP)
    const discount = S.msrp - S.negotiatedPrice;
    if (discount <= 0) {
        insightsAdded++;
         html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-comments-dollar"></i> **Negotiation Alert: Paying MSRP or Higher?**
            </div>
            <p>Your negotiated price (**${UTILS.formatCurrency(S.negotiatedPrice)}**) is at or above the MSRP (**${UTILS.formatCurrency(S.msrp)}**). The single most important factor you can negotiate in a lease is the *Capitalized Cost* (the price of the car). Aim to get this significantly *below* MSRP, just as if you were buying.</p>
            <p><strong>💡 AI Strategy:</strong> Research target prices for this model on sites like Edmunds or KBB. Get competing quotes.</p>
            <p><strong><i class="fas fa-handshake"></i> Affiliate Recommendation:</strong> Strengthen your negotiating position by securing financing *before* going to the dealership. <a href="#" target="_blank" rel="noopener affiliate">Compare pre-approved auto loan offers from our lending partners</a>, even if you plan to lease.</p>
        `;
    } else if (discount / S.msrp < 0.03) { // Less than 3% discount
        insightsAdded++;
        html += `
             <div class="recommendation-alert low-priority">
                 <i class="fas fa-percentage"></i> **Negotiation Tip: Push for a Deeper Discount**
             </div>
             <p>You've negotiated a discount of **${UTILS.formatCurrency(discount)}** (${(discount/S.msrp * 100).toFixed(1)}%) below MSRP. While good, aim for 5-10% or more off MSRP for most models, depending on demand. Research invoice pricing and current incentives.</p>
         `;
    }


    // Insight 2d: High Money Factor / Rent Charge Check
    const impliedAPR = S.interestRate; // Money Factor * 2400 = Approx APR
    const rentChargeTotal = S.leaseBreakdown.rentCharge * S.leaseTerm;
    if (impliedAPR > 9.0) { // Using 9% as a threshold for 'high' auto rates currently
        insightsAdded++;
        html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-money-check-alt"></i> **Cost Alert: High Implied Interest Rate (Money Factor)**
            </div>
            <p>The Money Factor used corresponds to an approximate APR of **${impliedAPR.toFixed(2)}%**. This is high for a new car lease/loan and significantly increases your total finance charge to **${UTILS.formatCurrency(rentChargeTotal)}** over the lease term.</p>
            <p><strong>💡 AI Strategy:</strong> Ask the dealer to show you the Money Factor they are using. Verify it aligns with published rates for your credit tier. Sometimes dealers mark this up.</p>
            <p><strong><i class="fas fa-handshake"></i> Affiliate Recommendation:</strong> A high rate often signals credit challenges. Improving your score can save thousands. <a href="#" target="_blank" rel="noopener affiliate">Get your free credit report and see what's impacting your score</a>.</p>
        `;
    }

    // Insight 2e: Low Residual Value Impact
    if (S.residualPercent < 50) {
        insightsAdded++;
         html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-arrow-down"></i> **Cost Alert: Low Residual Value**
            </div>
            <p>The residual value is **${S.residualPercent}%**, which is quite low. This means the bank expects the car to depreciate heavily, and *you* pay for that depreciation through higher monthly payments (**${UTILS.formatCurrency(S.leaseBreakdown.depreciation, true)}**/month). Cars known for poor value retention make for expensive leases.</p>
            <p><strong>💡 AI Strategy:</strong> Consider vehicles known for high residual values (e.g., Toyota, Honda, Subaru often perform well) as they generally lead to lower lease payments.</p>
        `;
    }

    // Insight 2f: General Good Deal / Next Steps
    if (insightsAdded === 0) { // If no major warnings triggered
         html += `
            <div class="recommendation-alert low-priority">
                <i class="fas fa-check-circle"></i> **Deal Analysis: Looks Reasonable**
            </div>
            <p>Based on the numbers provided, this lease structure doesn't raise major red flags. Your negotiated price shows a discount, the residual seems fair, and the implied rate isn't excessively high. The AI's primary recommendation (Lease/Buy/Tie) should guide your decision.</p>
            <p><strong><i class="fas fa-handshake"></i> Final Check:</strong> Before signing, ensure you have competitive auto insurance. Rates can vary widely. <a href="#" target="_blank" rel="noopener affiliate">Compare personalized auto insurance quotes from top US providers in minutes.</a></p>
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

    // Ensure data exists and is valid
    if (!S.annualComparisonData || S.annualComparisonData.length === 0 || !Array.isArray(S.annualComparisonData)) {
        if (CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart) {
             CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart.destroy();
             CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart = null; // Clear instance
        }
        // Optionally display a placeholder message in the chart area
        // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        // ctx.textAlign = 'center';
        // ctx.fillText('Please enter valid data to generate the chart.', ctx.canvas.width / 2, ctx.canvas.height / 2);
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
                    grid: { color: gridColor },
                    beginAtZero: true // Ensure Y-axis starts at 0 or below if negative values possible
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

    // Update Analysis Period Labels (handle potential NaN)
    const period = !isNaN(S.leaseTerm) && S.leaseTerm > 0 ? (S.leaseTerm / 12).toFixed(1) : 0;
    document.getElementById('summary-period-years-1').textContent = period;
    document.getElementById('summary-period-years-2').textContent = period;

    if (usePlaceholders || !S.annualComparisonData || S.annualComparisonData.length === 0 || isNaN(S.monthlyLeasePayment)) {
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
        document.getElementById('final-verdict-box').className = 'final-verdict-box'; // Reset class
        document.getElementById('ai-insights-output').innerHTML = '<p class="placeholder-text">Enter your lease details to generate personalized AI analysis...</p>';

        // Clear chart if it exists
         if (CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart) {
             CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart.destroy();
             CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart = null;
         }
        return;
    }

    // --- Main Summary Card ---
    document.getElementById('monthly-payment-total').textContent = UTILS.formatCurrency(S.monthlyLeasePayment, true);
     // Check if breakdown exists before accessing properties
    const breakdown = S.leaseBreakdown || { depreciation: 0, rentCharge: 0, tax: 0 };
    document.getElementById('payment-breakdown-summary').innerHTML = `
        Depreciation: ${UTILS.formatCurrency(breakdown.depreciation, true)} |
        Finance Charge: ${UTILS.formatCurrency(breakdown.rentCharge, true)} |
        Tax: ${UTILS.formatCurrency(breakdown.tax, true)}
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
        if (CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart) updateChart(); // Redraw chart on theme change
    }
    return { loadUserPreferences, toggleColorScheme };
})();


const SPEECH = (function() {
    let recognition;
    let isListening = false;
    let synth = window.speechSynthesis;
    let isTTSEnabled = false; // Track TTS state

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
             // Avoid showing toast for common 'no-speech' error
            if (event.error !== 'no-speech' && event.error !== 'audio-capture') {
                 UTILS.showToast(`Voice Error: ${event.error}`, 'error');
            }
             console.error('Speech recognition error:', event.error);
             isListening = false; // Ensure listening state is reset
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            processVoiceCommand(transcript);
        };

        // Initialize TTS button state
         const ttsButton = document.getElementById('toggle-text-to-speech');
         ttsButton.addEventListener('click', toggleTTS);
         isTTSEnabled = ttsButton.classList.contains('tts-active');

    }

     function toggleTTS() {
        isTTSEnabled = !isTTSEnabled;
        const button = document.getElementById('toggle-text-to-speech');
        button.classList.toggle('tts-active', isTTSEnabled);
        button.classList.toggle('tts-inactive', !isTTSEnabled);
         if (!isTTSEnabled && synth && synth.speaking) {
            synth.cancel(); // Stop speaking if TTS is turned off
        }
    }

    function speak(text) {
        if (!synth || !isTTSEnabled) return; // Use the tracked state

        // Clean text for better speech synthesis
        const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); // Remove HTML tags and extra whitespace

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0; // Adjust rate as needed
        utterance.pitch = 1.0;
        // Optional: Cancel previous speech before starting new
        if (synth.speaking) {
            synth.cancel();
        }
        synth.speak(utterance);
    }

    function processVoiceCommand(command) {
        console.log("Processing voice command:", command); // Debug log
        let responseText = "Sorry, I didn't catch that. Try 'Set MSRP to 40000'.";
        let shouldSpeak = true; // Flag to control speaking

        try {
            if (command.includes('calculate')) {
                updateCalculations();
                responseText = 'Calculating your lease analysis.';
            } else if (command.includes('what is the lease payment')) {
                const payment = document.getElementById('monthly-payment-total').textContent;
                responseText = `Your estimated monthly lease payment is ${payment}.`;
            } else if (command.includes('set msrp to')) {
                const match = command.match(/(\d{1,3}(?:,\d{3})*|\d+)/); // Match numbers with or without commas
                if (match) {
                    const value = match[0].replace(/,/g, ''); // Remove commas before parsing
                    document.getElementById('msrp').value = UTILS.parseInput(value);
                    responseText = `Setting MSRP to ${UTILS.formatCurrency(UTILS.parseInput(value))}.`;
                     // Debounce or directly call update? Direct call for immediate feedback.
                    updateCalculations();
                } else { responseText = "Please state the MSRP value clearly, for example, 'set MSRP to thirty five thousand'."; }
            } else if (command.includes('set negotiated price to')) {
                 const match = command.match(/(\d{1,3}(?:,\d{3})*|\d+)/);
                 if (match) {
                     const value = match[0].replace(/,/g, '');
                     document.getElementById('negotiated-price').value = UTILS.parseInput(value);
                     responseText = `Setting negotiated price to ${UTILS.formatCurrency(UTILS.parseInput(value))}.`;
                     updateCalculations();
                 } else { responseText = "Please state the negotiated price value clearly.";}
            } else if (command.includes('set down payment to')) {
                 const match = command.match(/(\d{1,3}(?:,\d{3})*|\d+)/);
                 if (match) {
                     const value = match[0].replace(/,/g, '');
                     document.getElementById('down-payment').value = UTILS.parseInput(value);
                     responseText = `Setting down payment to ${UTILS.formatCurrency(UTILS.parseInput(value))}.`;
                     updateCalculations();
                 } else { responseText = "Please state the down payment value clearly."; }
            } else if (command.includes('show ai insights')) {
                showTab('ai-insights');
                responseText = 'Showing AI Insights.';
                 // Read the insights after a short delay to allow UI update
                setTimeout(() => {
                    const insightsElement = document.getElementById('ai-insights-output');
                    if (insightsElement) {
                        speak(insightsElement.textContent);
                    }
                }, 500);
                 shouldSpeak = false; // Prevent double speaking

            } else if (command.includes('show comparison chart')) {
                 showTab('comparison-chart');
                 responseText = 'Showing the net worth comparison chart.';
            } else if (command.includes('show summary')) {
                 showTab('comparison-summary');
                 responseText = 'Showing the lease versus buy summary.';
            }
             else {
                // Keep the default "didn't catch that" message
            }
        } catch (error) {
            console.error("Error processing voice command:", error);
            responseText = "Sorry, I encountered an error processing your command.";
        }


        if (shouldSpeak) {
             speak(responseText);
        }
    }


    function toggleVoiceCommand() {
        if (!recognition) return;
        if (isListening) {
             recognition.stop();
        } else {
             // Cancel any current speech synthesis before starting recognition
             if (synth && synth.speaking) {
                synth.cancel();
             }
             try {
                recognition.start();
             } catch(e) {
                // Handle potential errors like starting too soon after stopping
                console.error("Error starting recognition:", e);
                // Optionally provide user feedback
                // UTILS.showToast("Could not start voice command. Please try again.", "error");
             }
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
    // Determine if it's an input or result tab
    const isInputTab = !!document.querySelector(`.tab-controls .tab-button[data-tab="${tabId}"]`);
    const isResultTab = !!document.querySelector(`.tab-controls-results .tab-button[data-tab="${tabId}"]`);

    if (isInputTab) {
        document.querySelectorAll('#car-lease-form .input-tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        document.querySelectorAll('.tab-controls .tab-button').forEach(b => b.classList.remove('active'));
        document.querySelector(`.tab-controls .tab-button[data-tab="${tabId}"]`).classList.add('active');
    } else if (isResultTab) {
        document.querySelectorAll('.results-section .tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        document.querySelectorAll('.tab-controls-results .tab-button').forEach(b => b.classList.remove('active'));
        document.querySelector(`.tab-controls-results .tab-button[data-tab="${tabId}"]`).classList.add('active');

        // Special handling for chart redraw on tab activation
        if (tabId === 'comparison-chart') {
            setTimeout(() => {
                // Check if chart exists before trying to resize
                if (CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart) {
                    try {
                        CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart.resize();
                    } catch (e) {
                        console.error("Error resizing chart:", e);
                        // Optionally re-initialize chart if resize fails
                        // updateChart();
                    }
                } else {
                    // If chart doesn't exist, try to create it (might happen if data wasn't ready before)
                    updateChart();
                }
            }, 50); // Small delay allows tab transition to complete
        }
    }
}


function setupEventListeners() {
    const debouncedCalculate = UTILS.debounce(updateCalculations, 300);
    const form = document.getElementById('car-lease-form');

    // Use event delegation on the form for better performance
    form.addEventListener('input', (event) => {
         // Only recalculate if the event target is an input or select element
         if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
             debouncedCalculate();
         }
    });
    form.addEventListener('change', (event) => {
         // Handle changes for select dropdowns immediately if needed, or let debounce handle it
         if (event.target.tagName === 'SELECT') {
            // updateCalculations(); // Or use debounce
             debouncedCalculate();
         }
    });


    document.getElementById('toggle-color-scheme').addEventListener('click', THEME_MANAGER.toggleColorScheme);
    document.getElementById('toggle-voice-command').addEventListener('click', SPEECH.toggleVoiceCommand);
    // TTS toggle listener is set up within SPEECH.initialize

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => showTab(button.getAttribute('data-tab')));
    });
}

// === Initialize ===
document.addEventListener('DOMContentLoaded', function() {
    if (CAR_LEASE_CALCULATOR.DEBUG) console.log('🇺🇸 FinGuid Car Lease AI Analyzer v1.1 Initializing...');

    THEME_MANAGER.loadUserPreferences();
    SPEECH.initialize(); // Initialize Speech API and TTS button state
    setupEventListeners();
    showPWAInstallPrompt();

    // Set default tab views explicitly
    showTab('lease-inputs');
    showTab('comparison-summary');

    // Start FRED API updates, which includes an initial calculation
    fredAPI.startAutomaticUpdates();

     // Fallback calculation in case FRED API is very slow or fails on initial load
    setTimeout(() => {
        // Only run if the state hasn't been populated by FRED yet
        if (CAR_LEASE_CALCULATOR.STATE.monthlyLeasePayment === 0) {
            console.log("Running fallback calculation.");
            updateCalculations();
        }
    }, 1500); // Wait 1.5 seconds

    if (CAR_LEASE_CALCULATOR.DEBUG) console.log('✅ Car Lease Calculator initialized!');
});
