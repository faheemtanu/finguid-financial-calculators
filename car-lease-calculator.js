/**
 * CAR LEASE CALCULATOR — AI‑POWERED LEASE VS. BUY ANALYZER v2.0
 * FinGuid USA - Production Ready with Full SEO Optimization
 * 
 * FEATURES:
 * ✅ Complete Lease & Buy Comparison (Separate Input Fields)
 * ✅ Market & Tax Information (Registration, Depreciation)
 * ✅ Enhanced Net Worth Chart
 * ✅ 20+ AI Insights (Dynamic & Personalized)
 * ✅ FRED API Integration (Live Auto Loan Rates)
 * ✅ Voice Control (Speech Recognition & TTS)
 * ✅ Dark/Light Mode Toggle
 * ✅ PWA Ready
 * ✅ WCAG 2.1 AA Accessibility
 */

/* ========================================================================== */
/* GLOBAL CONFIGURATION & STATE */
/* ========================================================================== */

const CAR_LEASE_CALCULATOR = {
    VERSION: '2.0',
    DEBUG: false,

    // FRED API Configuration
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    FRED_SERIES_ID: 'TERMSCOAUTC60NS',
    RATE_UPDATE_INTERVAL: 4 * 60 * 60 * 1000, // 4 hours
    FALLBACK_RATE: 7.50,

    // Application State
    STATE: {
        // Vehicle Info
        msrp: 35000,
        negotiatedPrice: 33500,
        residualPercent: 62,
        leaseTerm: 36,

        // Lease-Specific
        downPayment: 2000,
        tradeInLease: 0,
        acquisitionFee: 795,
        dispositionFee: 395,

        // Buy-Specific
        buyPrice: 33500,
        buyDownPayment: 5000,
        buyTradeIn: 0,
        loanTermBuy: 60,
        dealerFeesBuy: 500,

        // Market & Tax
        interestRate: 7.50,
        salesTaxRate: 6.5,
        registrationFee: 150,
        marketAppreciation: -15,
        investmentReturnRate: 6.0,

        // Results
        totalNetWorthLease: 0,
        totalNetWorthBuy: 0,
        monthlyLeasePayment: 0,
        monthlyBuyPayment: 0,
        leaseTotalCost: 0,
        buyTotalCost: 0,
        buyEndEquity: 0,
        leaseBreakdown: { depreciation: 0, rentCharge: 0, tax: 0 },
        annualComparisonData: [],
        carValueOverTime: [],
    },

    charts: { leaseVsBuyChart: null },
    deferredInstallPrompt: null,
};

/* ========================================================================== */
/* UTILITY & FORMATTING MODULE */
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
        const elem = document.getElementById(id);
        if (!elem) return 0;
        const value = elem.value;
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

/* ========================================================================== */
/* FRED API MODULE */
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
                if (CAR_LEASE_CALCULATOR.DEBUG) UTILS.showToast(`Live Rate: ${rate.toFixed(2)}%`, 'success');
                return rate;
            } else {
                throw new Error('No valid FRED observation');
            }
        } catch (error) {
            console.error('FRED API Error:', error);
            document.getElementById('interest-rate').value = CAR_LEASE_CALCULATOR.FALLBACK_RATE.toFixed(2);
            document.querySelector('.fred-source-note').textContent = `Fallback Rate (${CAR_LEASE_CALCULATOR.FALLBACK_RATE}%)`;
            return CAR_LEASE_CALCULATOR.FALLBACK_RATE;
        }
    }

    function startAutomaticUpdates() {
        fetchLatestRate().then(updateCalculations);
        setInterval(fetchLatestRate, CAR_LEASE_CALCULATOR.RATE_UPDATE_INTERVAL);
    }

    return { startAutomaticUpdates };
})();

/* ========================================================================== */
/* CORE CALCULATION MODULE */
/* ========================================================================== */

function updateCalculations() {
    const S = CAR_LEASE_CALCULATOR.STATE;

    // Parse all inputs
    S.msrp = UTILS.parseInput('msrp');
    S.negotiatedPrice = UTILS.parseInput('negotiated-price');
    S.residualPercent = UTILS.parseInput('residual-percent');
    S.leaseTerm = UTILS.parseInput('lease-term');
    S.downPayment = UTILS.parseInput('down-payment');
    S.tradeInLease = UTILS.parseInput('trade-in-lease');
    S.acquisitionFee = UTILS.parseInput('acquisition-fee');
    S.dispositionFee = UTILS.parseInput('disposition-fee');
    S.buyPrice = UTILS.parseInput('buy-price');
    S.buyDownPayment = UTILS.parseInput('buy-down-payment');
    S.buyTradeIn = UTILS.parseInput('buy-trade-in');
    S.loanTermBuy = UTILS.parseInput('loan-term-buy');
    S.dealerFeesBuy = UTILS.parseInput('dealer-fees-buy');
    S.interestRate = UTILS.parseInput('interest-rate');
    S.salesTaxRate = UTILS.parseInput('sales-tax-rate');
    S.registrationFee = UTILS.parseInput('registration-fee');
    S.marketAppreciation = UTILS.parseInput('market-appreciation');
    S.investmentReturnRate = UTILS.parseInput('investment-return-rate');

    // Validation
    if (S.msrp <= 0 || S.negotiatedPrice <= 0 || S.leaseTerm <= 0 || S.buyPrice <= 0) {
        updateResultsDisplay(true);
        return;
    }

    calculateLeaseVsBuy();
    updateResultsDisplay();
    generateAIInsights();
    updateChart();
}

function calculateLeaseVsBuy() {
    const S = CAR_LEASE_CALCULATOR.STATE;

    // LEASE CALCULATION
    const netCapCost = S.negotiatedPrice - S.downPayment - S.tradeInLease + S.acquisitionFee;
    const residualValue = S.msrp * (S.residualPercent / 100);
    const totalDepreciation = netCapCost - residualValue;
    const monthlyDepreciation = totalDepreciation / S.leaseTerm;
    const moneyFactor = (S.interestRate / 100) / 2400;
    const monthlyRentCharge = (netCapCost + residualValue) * moneyFactor;
    const baseMonthlyPayment = monthlyDepreciation + monthlyRentCharge;
    const monthlySalesTax = baseMonthlyPayment * (S.salesTaxRate / 100);
    const totalMonthlyLeasePayment = baseMonthlyPayment + monthlySalesTax;
    const initialLeaseCost = S.downPayment + S.acquisitionFee;
    const totalLeaseCost = (totalMonthlyLeasePayment * S.leaseTerm) + initialLeaseCost + S.dispositionFee;

    // BUY CALCULATION
    const salesTaxOnBuy = (S.buyPrice - S.buyTradeIn) * (S.salesTaxRate / 100);
    const totalBuyCost = S.buyPrice + Math.max(0, salesTaxOnBuy) + S.dealerFeesBuy;
    const loanAmount = totalBuyCost - S.buyDownPayment - S.buyTradeIn;
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

    const initialBuyCost = S.buyDownPayment + S.dealerFeesBuy;

    // MARKET VALUE TRACKING WITH DEPRECIATION
    S.carValueOverTime = [];
    let currentMarketValue = S.buyPrice;
    const monthlyMarketChange = (S.marketAppreciation / 100) / 12;

    // NET WORTH COMPARISON OVER TIME
    const analysisMonths = S.leaseTerm;
    const r_inv = S.investmentReturnRate / 100 / 12;

    let buyLoanBalance = loanAmount;
    let buyEquity = 0;
    let leaseInvestedSavings = (initialBuyCost - initialLeaseCost) + (totalMonthlyBuyPayment - totalMonthlyLeasePayment);

    S.annualComparisonData = [];

    for (let m = 1; m <= analysisMonths; m++) {
        // Update market value with depreciation/appreciation
        currentMarketValue = currentMarketValue * (1 + monthlyMarketChange);
        S.carValueOverTime.push(currentMarketValue);

        // Calculate buy loan balance reduction
        let interestPaymentBuy = buyLoanBalance * monthlyBuyRate;
        let principalPaymentBuy = totalMonthlyBuyPayment - interestPaymentBuy;

        if (buyLoanBalance < principalPaymentBuy) principalPaymentBuy = buyLoanBalance;
        if (buyLoanBalance > 0) buyLoanBalance -= principalPaymentBuy;
        buyLoanBalance = Math.max(0, buyLoanBalance);

        // Calculate buy equity based on real market value
        buyEquity = Math.max(0, currentMarketValue - buyLoanBalance);

        // Calculate lease invested savings with compound interest
        if (m > 1) {
            leaseInvestedSavings = (leaseInvestedSavings * (1 + r_inv)) + (totalMonthlyBuyPayment - totalMonthlyLeasePayment);
        } else {
            leaseInvestedSavings = leaseInvestedSavings * (1 + r_inv);
        }

        // Store annual data points
        if (m % 12 === 0 || m === analysisMonths) {
            const year = Math.ceil(m / 12);
            S.annualComparisonData.push({
                year: year,
                buyNetWorth: buyEquity,
                leaseNetWorth: leaseInvestedSavings,
                carMarketValue: currentMarketValue,
                loanBalance: buyLoanBalance
            });
        }
    }

    const finalData = S.annualComparisonData.length > 0 ? 
        S.annualComparisonData[S.annualComparisonData.length - 1] : 
        { leaseNetWorth: 0, buyNetWorth: 0 };

    S.totalNetWorthLease = finalData.leaseNetWorth;
    S.totalNetWorthBuy = finalData.buyNetWorth;
    S.monthlyLeasePayment = totalMonthlyLeasePayment;
    S.monthlyBuyPayment = totalMonthlyBuyPayment;
    S.leaseTotalCost = totalLeaseCost;
    S.buyTotalCost = (totalMonthlyBuyPayment * S.leaseTerm) + initialBuyCost;
    S.buyEndEquity = finalData.buyNetWorth;
    S.leaseBreakdown = { 
        depreciation: monthlyDepreciation, 
        rentCharge: monthlyRentCharge, 
        tax: monthlySalesTax 
    };
}

/* ========================================================================== */
/* AI INSIGHTS ENGINE (20+ Dynamic Insights) */
/* ========================================================================== */

function generateAIInsights() {
    const S = CAR_LEASE_CALCULATOR.STATE;
    const output = document.getElementById('ai-insights-output');

    if (!S.annualComparisonData || S.annualComparisonData.length === 0 || 
        isNaN(S.monthlyLeasePayment) || S.msrp <= 0) {
        output.innerHTML = '<p class="placeholder-text">Enter valid lease and buy details to generate comprehensive AI analysis with 20+ personalized insights...</p>';
        return;
    }

    let html = '';
    const netWorthDifference = S.totalNetWorthBuy - S.totalNetWorthLease;
    const period = S.leaseTerm / 12;
    const finalData = S.annualComparisonData[S.annualComparisonData.length - 1];

    // INSIGHT 1: CORE FINANCIAL VERDICT
    html += '<div class="recommendation-alert ';
    
    if (netWorthDifference > 1000) {
        html += 'low-priority">';
        html += `<strong>💰 AI Verdict: BUYING Recommended.</strong> Over your ${period.toFixed(1)}-year analysis period, `;
        html += `buying is projected to leave you <strong>${UTILS.formatCurrency(netWorthDifference)}</strong> wealthier. `;
        html += `This is primarily because you build <strong>${UTILS.formatCurrency(S.buyEndEquity)}</strong> in equity.`;
        
        document.getElementById('final-verdict-box').className = 'final-verdict-box buy-recommended';
        document.getElementById('final-verdict-text').textContent = 
            `VERDICT: BUY is ${UTILS.formatCurrency(netWorthDifference)} BETTER over ${period.toFixed(1)} years!`;
            
    } else if (netWorthDifference < -1000) {
        html += 'medium-priority">';
        html += `<strong>🔑 AI Verdict: LEASING Recommended.</strong> Over ${period.toFixed(1)} years, the leasing path is `;
        html += `projected to leave you <strong>${UTILS.formatCurrency(Math.abs(netWorthDifference))}</strong> wealthier by investing the difference.`;
        
        document.getElementById('final-verdict-box').className = 'final-verdict-box lease-recommended';
        document.getElementById('final-verdict-text').textContent = 
            `VERDICT: LEASE is ${UTILS.formatCurrency(Math.abs(netWorthDifference))} BETTER over ${period.toFixed(1)} years!`;
            
    } else {
        html += 'high-priority">';
        html += `<strong>⚖️ AI Verdict: NEAR TIE.</strong> The financial difference is minimal (${UTILS.formatCurrency(Math.abs(netWorthDifference))}). `;
        html += `Choose based on lifestyle preferences: flexibility (lease) or equity building (buy).`;
        
        document.getElementById('final-verdict-box').className = 'final-verdict-box';
        document.getElementById('final-verdict-text').textContent = `VERDICT: NEAR TIE. Choose based on lifestyle preferences.`;
    }
    html += '</div>';

    // INSIGHT 2: HIGH DOWN PAYMENT RISK (Lease)
    if (S.downPayment > 1000) {
        html += `<p class="insight-item"><strong>⚠️ High Lease Down Payment Risk:</strong> You have a <strong>${UTILS.formatCurrency(S.downPayment)}</strong> `;
        html += `down payment on this lease. If the car is totaled early, you typically lose this money as insurance only covers the car's value.</p>`;
        html += `<p><strong>💡 AI Recommendation:</strong> Aim for a $0 down lease (or minimal first payment only) to minimize risk and preserve capital.</p>`;
    }

    // INSIGHT 3: 1% RULE ANALYSIS
    const onePercentRule = (S.monthlyLeasePayment / S.msrp) * 100;
    if (!isNaN(onePercentRule) && S.msrp > 0) {
        if (onePercentRule <= 1.25 && S.downPayment === 0) {
            html += `<p class="insight-item"><strong>✅ Excellent Lease Deal:</strong> Your monthly payment is <strong>${onePercentRule.toFixed(2)}%</strong> of MSRP with $0 down. `;
            html += `This meets the industry "1% rule" benchmark for a good lease deal.</p>`;
        } else if (onePercentRule > 1.75) {
            html += `<p class="insight-item"><strong>⚠️ High Payment-to-MSRP Ratio:</strong> Your payment is <strong>${onePercentRule.toFixed(2)}%</strong> of MSRP. `;
            html += `Ideal leases are under 1.5% of MSRP. Try negotiating a lower cap cost or higher residual value.</p>`;
        }
    }

    // INSIGHT 4: NEGOTIATION EFFECTIVENESS
    const discount = S.msrp - S.negotiatedPrice;
    const discountPercent = (discount / S.msrp) * 100;
    if (discount <= 0) {
        html += `<p class="insight-item"><strong>🚨 No Discount Alert:</strong> Your negotiated price (${UTILS.formatCurrency(S.negotiatedPrice)}) `;
        html += `is at or above MSRP (${UTILS.formatCurrency(S.msrp)}). The capitalized cost is the most important negotiation point.</p>`;
        html += `<p><strong>💡 Strategy:</strong> Aim for at least 5-10% below MSRP. Research invoice prices and dealer incentives first.</p>`;
    } else if (discountPercent >= 8) {
        html += `<p class="insight-item"><strong>✅ Strong Negotiation:</strong> You negotiated <strong>${UTILS.formatCurrency(discount)}</strong> `;
        html += `(${discountPercent.toFixed(1)}%) below MSRP. Excellent work! This significantly reduces your lease payments.</p>`;
    }

    // INSIGHT 5: INTEREST RATE EVALUATION
    if (S.interestRate > 9.0) {
        html += `<p class="insight-item"><strong>🚨 High Interest Rate Warning:</strong> Your <strong>${S.interestRate.toFixed(2)}% APR</strong> `;
        html += `(money factor: ${(S.interestRate / 2400).toFixed(5)}) is high. Check your credit score and shop multiple lenders.</p>`;
    } else if (S.interestRate < 4.0) {
        html += `<p class="insight-item"><strong>✅ Excellent Interest Rate:</strong> Your <strong>${S.interestRate.toFixed(2)}% APR</strong> `;
        html += `is very competitive. This saves you significant money over the term.</p>`;
    }

    // INSIGHT 6: RESIDUAL VALUE IMPACT
    if (S.residualPercent < 50) {
        html += `<p class="insight-item"><strong>📉 Low Residual Value Warning:</strong> The residual value is <strong>${S.residualPercent}%</strong>, `;
        html += `indicating heavy depreciation. This results in higher monthly lease payments as you're paying for more depreciation.</p>`;
        html += `<p><strong>💡 Consideration:</strong> Vehicles with poor resale value (luxury cars, EVs) often make better purchase candidates.</p>`;
    } else if (S.residualPercent >= 65) {
        html += `<p class="insight-item"><strong>✅ Strong Residual Value:</strong> The <strong>${S.residualPercent}%</strong> residual indicates excellent `;
        html += `value retention. This vehicle holds its value well, making it a good lease candidate with lower payments.</p>`;
    }

    // INSIGHT 7: MARKET DEPRECIATION IMPACT
    if (S.marketAppreciation < -10) {
        html += `<p class="insight-item"><strong>📉 Heavy Depreciation Projected:</strong> You're projecting <strong>${Math.abs(S.marketAppreciation)}%</strong> `;
        html += `annual depreciation. After ${period.toFixed(1)} years, the car's value drops to approximately <strong>${UTILS.formatCurrency(finalData.carMarketValue)}</strong>. `;
        html += `This reduces your equity if buying.</p>`;
    }

    // INSIGHT 8: BUY DOWN PAYMENT ANALYSIS
    const buyDownPaymentPercent = (S.buyDownPayment / S.buyPrice) * 100;
    if (buyDownPaymentPercent < 10) {
        html += `<p class="insight-item"><strong>💰 Low Buy Down Payment:</strong> Your down payment is only <strong>${buyDownPaymentPercent.toFixed(1)}%</strong>. `;
        html += `Consider 15-20% down to reduce monthly payments by approximately <strong>${UTILS.formatCurrency((S.buyPrice * 0.10) * (S.interestRate / 100 / 12))}/month</strong>.</p>`;
    } else if (buyDownPaymentPercent >= 20) {
        html += `<p class="insight-item"><strong>✅ Solid Buy Down Payment:</strong> Your <strong>${buyDownPaymentPercent.toFixed(1)}%</strong> down payment `;
        html += `(${UTILS.formatCurrency(S.buyDownPayment)}) reduces interest costs significantly and builds equity faster.</p>`;
    }

    // INSIGHT 9: PAYMENT DIFFERENCE ANALYSIS
    const paymentDiff = Math.abs(S.monthlyBuyPayment - S.monthlyLeasePayment);
    if (paymentDiff > 100) {
        const lowerOption = S.monthlyBuyPayment < S.monthlyLeasePayment ? 'buying' : 'leasing';
        html += `<p class="insight-item"><strong>💵 Payment Difference:</strong> ${lowerOption === 'buying' ? 'Buying' : 'Leasing'} has `;
        html += `<strong>${UTILS.formatCurrency(paymentDiff)}/month</strong> lower payments. `;
        if (lowerOption === 'leasing') {
            html += `If you invest this difference at ${S.investmentReturnRate}% return, you'd have <strong>${UTILS.formatCurrency(S.totalNetWorthLease)}</strong> after ${period.toFixed(1)} years.`;
        }
        html += `</p>`;
    }

    // INSIGHT 10: EQUITY BUILDING HIGHLIGHT
    if (S.buyEndEquity > 5000) {
        html += `<p class="insight-item"><strong>🏠 Equity Building Advantage:</strong> By buying, you'll build approximately `;
        html += `<strong>${UTILS.formatCurrency(S.buyEndEquity)}</strong> in equity after ${period.toFixed(1)} years (assuming ${S.marketAppreciation}% annual depreciation). `;
        html += `This equity can be used for your next vehicle purchase or as financial cushion.</p>`;
    }

    // INSIGHT 11: INVESTMENT RETURN ASSUMPTION CHECK
    if (S.investmentReturnRate > 8) {
        html += `<p class="insight-item"><strong>📈 Aggressive Investment Assumption:</strong> Your <strong>${S.investmentReturnRate}%</strong> expected return is optimistic. `;
        html += `S&P 500 historical average is ~10%, but includes volatility. Conservative estimate: 6-7%. `;
        html += `Try running scenarios with different return rates.</p>`;
    }

    // INSIGHT 12: TOTAL COST COMPARISON
    const costDifference = Math.abs(S.buyTotalCost - S.leaseTotalCost);
    if (costDifference > 2000) {
        const cheaperOption = S.buyTotalCost < S.leaseTotalCost ? 'Buying' : 'Leasing';
        html += `<p class="insight-item"><strong>💰 Total Cost Analysis:</strong> ${cheaperOption} has <strong>${UTILS.formatCurrency(costDifference)}</strong> `;
        html += `lower cash outlay over ${period.toFixed(1)} years (${UTILS.formatCurrency(S.leaseTotalCost)} lease vs ${UTILS.formatCurrency(S.buyTotalCost)} buy). `;
        html += `However, consider equity and net worth, not just cash flow.</p>`;
    }

    // INSIGHT 13: SALES TAX CONSIDERATIONS
    if (S.salesTaxRate > 8) {
        html += `<p class="insight-item"><strong>🏛️ High Sales Tax Impact:</strong> Your <strong>${S.salesTaxRate}%</strong> tax rate is high. `;
        html += `For leasing, you only pay tax on monthly payments (approximately ${UTILS.formatCurrency(S.leaseBreakdown.tax * S.leaseTerm)} total). `;
        html += `For buying, you pay tax on full price upfront (approximately ${UTILS.formatCurrency((S.buyPrice - S.buyTradeIn) * S.salesTaxRate / 100)}).</p>`;
    }

    // INSIGHT 14: LEASE TERM EVALUATION
    if (S.leaseTerm <= 24) {
        html += `<p class="insight-item"><strong>⏱️ Short Lease Term:</strong> Your ${S.leaseTerm}-month lease means higher monthly payments but you'll always be under warranty. `;
        html += `Consider 36 months for balance of payment affordability and warranty coverage.</p>`;
    } else if (S.leaseTerm >= 48) {
        html += `<p class="insight-item"><strong>⏱️ Long Lease Term Alert:</strong> ${S.leaseTerm}-month leases often have lower residuals and you may exceed warranty. `;
        html += `Consider buying instead if keeping the car this long, as you'll build more equity.</p>`;
    }

    // INSIGHT 15: BUY LOAN TERM WARNING
    if (S.loanTermBuy >= 72) {
        html += `<p class="insight-item"><strong>⚠️ Long Loan Term Warning:</strong> A ${S.loanTermBuy}-month (${(S.loanTermBuy/12).toFixed(1)} year) loan means `;
        html += `you may owe more than the car is worth (negative equity) for years. Try to keep loans under 60 months.</p>`;
    }

    // INSIGHT 16: MILEAGE CONSIDERATIONS
    html += `<p class="insight-item"><strong>🛣️ Mileage Limit Reminder:</strong> Leases typically include 10,000-15,000 miles/year. `;
    html += `Overage charges are $0.15-$0.30 per mile. If you drive over 12,000 miles annually or take frequent road trips, `;
    html += `buying is more cost-effective and stress-free.</p>`;

    // INSIGHT 17: WEAR AND TEAR
    html += `<p class="insight-item"><strong>🔧 Wear and Tear Charges:</strong> At lease end, you'll be charged for damage beyond "normal wear and tear." `;
    html += `This can add $1,000-$3,000 for scratches, dents, interior stains, or tire wear. Buying gives you flexibility to maintain the car your way.</p>`;

    // INSIGHT 18: EARLY TERMINATION RISK
    html += `<p class="insight-item"><strong>⚠️ Early Termination Risk:</strong> Breaking a lease early is expensive (often $5,000+ in penalties). `;
    html += `If there's any chance of job relocation, family changes, or lifestyle shifts, buying offers more flexibility.</p>`;

    // INSIGHT 19: INSURANCE REQUIREMENTS
    html += `<p class="insight-item"><strong>🛡️ Insurance Costs:</strong> Leases require comprehensive and collision coverage with low deductibles, `;
    html += `often costing $100-$300/month more than minimal coverage. Factor this into your budget. Consider getting gap insurance for peace of mind.</p>`;

    // INSIGHT 20: CUSTOMIZATION LIMITATIONS
    html += `<p class="insight-item"><strong>🎨 Customization Restrictions:</strong> Leased vehicles must be returned in original condition. `;
    html += `Aftermarket modifications, custom wheels, tinting, or performance upgrades are prohibited or must be reversed before return. `;
    html += `Buying lets you personalize freely.</p>`;

    // INSIGHT 21: END-OF-LEASE OPTIONS
    if (S.residualPercent > 0) {
        const residualValue = S.msrp * (S.residualPercent / 100);
        html += `<p class="insight-item"><strong>🔑 Lease Buyout Option:</strong> At lease end, you can purchase the car for its residual value of `;
        html += `<strong>${UTILS.formatCurrency(residualValue)}</strong>. If the market value is higher, this could be a good deal. `;
        html += `If you've grown attached to the car and it's in good condition, buying it out may be worth considering.</p>`;
    }

    // MONETIZATION BANNER
    html += `<div class="monetization-banner" style="margin-top: 24px; padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white;">`;
    html += `<strong>📞 Next Step: Get Personalized Quotes</strong><br>`;
    html += `Compare auto financing rates from top lenders and get pre-approved in minutes. `;
    html += `<a href="#" class="affiliate-link-cta" style="color: #ffd700; text-decoration: underline;" onclick="return false;">Compare Auto Loan Rates →</a>`;
    html += `</div>`;

    output.innerHTML = html;
}

/* ========================================================================== */
/* CHART MODULE (Enhanced Visualization) */
/* ========================================================================== */

function updateChart() {
    const S = CAR_LEASE_CALCULATOR.STATE;
    const ctx = document.getElementById('leaseVsBuyChart');
    if (!ctx) return;

    if (!S.annualComparisonData || S.annualComparisonData.length === 0) {
        if (CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart) {
            CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart.destroy();
            CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart = null;
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
    const textColor = isDarkMode ? '#ffffff' : '#333333';

    CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Buying Path Net Worth (Equity)',
                    data: buyData,
                    borderColor: 'var(--color-chart-buy)',
                    backgroundColor: 'rgba(36, 172, 185, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: 'var(--color-chart-buy)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Leasing Path Net Worth (Invested Savings)',
                    data: leaseData,
                    borderColor: 'var(--color-chart-lease)',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: 'var(--color-chart-lease)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
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
                        color: textColor, 
                        font: { size: 13, weight: 'bold' },
                        padding: 15
                    }, 
                    position: 'top' 
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${UTILS.formatCurrency(context.parsed.y, true)}`,
                        title: (items) => `After ${items[0].label}`
                    },
                    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: textColor,
                    bodyColor: textColor,
                    borderColor: gridColor,
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    boxWidth: 15,
                    boxHeight: 15
                }
            },
            scales: {
                y: {
                    title: { 
                        display: true, 
                        text: 'Net Worth / Equity ($)', 
                        color: textColor,
                        font: { size: 13, weight: 'bold' }
                    },
                    ticks: { 
                        color: textColor, 
                        callback: (value) => UTILS.formatCurrency(value / 1000, false) + 'K'
                    },
                    grid: { color: gridColor },
                    beginAtZero: true
                },
                x: {
                    title: { 
                        display: true, 
                        text: 'Time Period', 
                        color: textColor,
                        font: { size: 13, weight: 'bold' }
                    },
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

/* ========================================================================== */
/* UI DISPLAY MODULE */
/* ========================================================================== */

function updateResultsDisplay(usePlaceholders = false) {
    const S = CAR_LEASE_CALCULATOR.STATE;

    const period = !isNaN(S.leaseTerm) && S.leaseTerm > 0 ? (S.leaseTerm / 12).toFixed(1) : '0.0';
    document.getElementById('summary-period-years-1').textContent = period;
    document.getElementById('summary-period-years-2').textContent = period;

    if (usePlaceholders || !S.annualComparisonData || S.annualComparisonData.length === 0 || isNaN(S.monthlyLeasePayment)) {
        document.getElementById('monthly-payment-total').textContent = UTILS.formatCurrency(0, true);
        document.getElementById('payment-breakdown-summary').innerHTML = 'Depreciation: $0.00 | Finance Charge: $0.00 | Tax: $0.00';
        document.getElementById('lease-monthly-payment').textContent = UTILS.formatCurrency(0, true);
        document.getElementById('lease-total-cost').textContent = UTILS.formatCurrency(0);
        document.getElementById('lease-end-equity').textContent = UTILS.formatCurrency(0);
        document.getElementById('buy-monthly-payment').textContent = UTILS.formatCurrency(0, true);
        document.getElementById('buy-total-cost').textContent = UTILS.formatCurrency(0);
        document.getElementById('buy-end-equity').textContent = UTILS.formatCurrency(0);
        document.getElementById('final-verdict-text').textContent = "Enter valid data to start comprehensive AI analysis...";
        document.getElementById('final-verdict-box').className = 'final-verdict-box';
        return;
    }

    document.getElementById('monthly-payment-total').textContent = UTILS.formatCurrency(S.monthlyLeasePayment, true);
    
    const breakdown = S.leaseBreakdown || { depreciation: 0, rentCharge: 0, tax: 0 };
    document.getElementById('payment-breakdown-summary').innerHTML = `
        Depreciation: ${UTILS.formatCurrency(breakdown.depreciation, true)} | 
        Finance Charge: ${UTILS.formatCurrency(breakdown.rentCharge, true)} | 
        Tax: ${UTILS.formatCurrency(breakdown.tax, true)}
    `;

    document.getElementById('lease-monthly-payment').textContent = UTILS.formatCurrency(S.monthlyLeasePayment, true);
    document.getElementById('lease-total-cost').textContent = UTILS.formatCurrency(S.leaseTotalCost);
    document.getElementById('lease-end-equity').textContent = UTILS.formatCurrency(0);
    
    document.getElementById('buy-monthly-payment').textContent = UTILS.formatCurrency(S.monthlyBuyPayment, true);
    document.getElementById('buy-total-cost').textContent = UTILS.formatCurrency(S.buyTotalCost);
    document.getElementById('buy-end-equity').textContent = UTILS.formatCurrency(S.buyEndEquity);
}

/* ========================================================================== */
/* THEME, VOICE, PWA MODULES */
/* ========================================================================== */

const THEME_MANAGER = (function() {
    const COLOR_SCHEME_KEY = 'finguid-color-scheme';

    function loadUserPreferences() {
        const savedScheme = localStorage.getItem(COLOR_SCHEME_KEY) || 
                           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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
    let isTTSEnabled = false;

    function initialize() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

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

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            processVoiceCommand(transcript);
        };
    }

    function processVoiceCommand(command) {
        let responseText = "Sorry, I didn't understand that command.";
        
        if (command.includes('calculate') || command.includes('run')) {
            updateCalculations();
            responseText = 'Running lease versus buy calculation.';
        } else if (command.includes('chart') || command.includes('graph')) {
            document.querySelector('[data-tab="chart"]').click();
            responseText = 'Showing net worth chart.';
        } else if (command.includes('insight') || command.includes('advice')) {
            document.querySelector('[data-tab="ai-insights"]').click();
            responseText = 'Showing AI insights and recommendations.';
        } else if (command.includes('dark') || command.includes('theme')) {
            THEME_MANAGER.toggleColorScheme();
            responseText = 'Toggling color scheme.';
        }
        
        speak(responseText);
    }

    function toggleVoiceRecognition() {
        if (!recognition) {
            UTILS.showToast('Voice recognition not supported in this browser', 'error');
            return;
        }
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    }

    function toggleTextToSpeech() {
        isTTSEnabled = !isTTSEnabled;
        const btn = document.getElementById('toggle-text-to-speech');
        if (isTTSEnabled) {
            btn.classList.replace('tts-inactive', 'tts-active');
            UTILS.showToast('Text-to-speech enabled', 'success');
        } else {
            btn.classList.replace('tts-active', 'tts-inactive');
            UTILS.showToast('Text-to-speech disabled', 'info');
        }
    }

    function speak(text) {
        if (!synth || !isTTSEnabled) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        synth.speak(utterance);
    }

    return { initialize, toggleVoiceRecognition, toggleTextToSpeech };
})();

const PWA = (function() {
    function initialize() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            CAR_LEASE_CALCULATOR.deferredInstallPrompt = e;
            const installBtn = document.getElementById('install-app');
            if (installBtn) {
                installBtn.classList.remove('hidden');
                installBtn.addEventListener('click', promptInstall);
            }
        });
    }

    function promptInstall() {
        const prompt = CAR_LEASE_CALCULATOR.deferredInstallPrompt;
        if (!prompt) return;

        prompt.prompt();
        prompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                UTILS.showToast('App installation started!', 'success');
            }
            CAR_LEASE_CALCULATOR.deferredInstallPrompt = null;
            document.getElementById('install-app').classList.add('hidden');
        });
    }

    return { initialize };
})();

/* ========================================================================== */
/* INITIALIZATION */
/* ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize modules
    THEME_MANAGER.loadUserPreferences();
    SPEECH.initialize();
    PWA.initialize();

    // Event Listeners
    const themeToggle = document.getElementById('toggle-color-scheme');
    if (themeToggle) themeToggle.addEventListener('click', THEME_MANAGER.toggleColorScheme);

    const voiceToggle = document.getElementById('toggle-voice-command');
    if (voiceToggle) voiceToggle.addEventListener('click', SPEECH.toggleVoiceRecognition);

    const ttsToggle = document.getElementById('toggle-text-to-speech');
    if (ttsToggle) ttsToggle.addEventListener('click', SPEECH.toggleTextToSpeech);

    // Debounced calculation updates
    const debouncedUpdate = UTILS.debounce(updateCalculations, 500);
    const allInputs = document.querySelectorAll('input[type="number"]');
    allInputs.forEach(input => input.addEventListener('input', debouncedUpdate));

    // Result tab switching
    const resultTabs = document.querySelectorAll('.tab-controls-results .tab-button');
    resultTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            resultTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            const targetContent = document.getElementById(targetTab);
            if (targetContent) targetContent.classList.add('active');
            
            // Refresh chart if switching to chart tab
            if (targetTab === 'chart') {
                setTimeout(updateChart, 100);
            }
        });
    });

    // Start FRED API updates and initial calculation
    fredAPI.startAutomaticUpdates();
    
    console.log(`%c🚀 FinGuid Car Lease Calculator v${CAR_LEASE_CALCULATOR.VERSION}`, 'color: #24acb9; font-size: 16px; font-weight: bold;');
    console.log('%c✅ Initialized successfully with full SEO optimization', 'color: #4caf50; font-size: 14px;');
});
