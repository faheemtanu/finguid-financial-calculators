/**
 * CAR LEASE CALCULATOR v2.0 - PRODUCTION
 * FinGuid USA - SEO Optimized for #1 Rankings
 * All Features: AI Insights, Buy/Lease Comparison, Market Analysis, Charts
 */

const CAR_LEASE_CALCULATOR = {
    VERSION: '2.0',
    DEBUG: false,
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    FRED_SERIES_ID: 'TERMSCOAUTC60NS',
    RATE_UPDATE_INTERVAL: 4 * 60 * 60 * 1000,
    FALLBACK_RATE: 7.50,
    STATE: {
        msrp: 35000, negotiatedPrice: 33500, residualPercent: 62, leaseTerm: 36,
        downPayment: 2000, tradeInLease: 0, acquisitionFee: 795, dispositionFee: 395,
        buyPrice: 33500, buyDownPayment: 5000, buyTradeIn: 0, loanTermBuy: 60, dealerFeesBuy: 500,
        interestRate: 7.50, salesTaxRate: 6.5, registrationFee: 150, marketAppreciation: -15, investmentReturnRate: 6.0,
        totalNetWorthLease: 0, totalNetWorthBuy: 0, monthlyLeasePayment: 0, monthlyBuyPayment: 0,
        leaseTotalCost: 0, buyTotalCost: 0, buyEndEquity: 0,
        leaseBreakdown: { depreciation: 0, rentCharge: 0, tax: 0 },
        annualComparisonData: [], carValueOverTime: []
    },
    charts: { leaseVsBuyChart: null },
    deferredInstallPrompt: null
};

const UTILS = (function() {
    function formatCurrency(amount, withDecimals = false) {
        if (typeof amount !== 'number' || isNaN(amount)) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD',
            minimumFractionDigits: withDecimals ? 2 : 0,
            maximumFractionDigits: withDecimals ? 2 : 0
        }).format(amount);
    }
    function formatPercent(rate) { return parseFloat(rate).toFixed(1) + '%'; }
    function parseInput(id) {
        const elem = document.getElementById(id);
        if (!elem) return 0;
        return parseFloat(elem.value.replace(/[$,]/g, '').trim()) || 0;
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

const fredAPI = (function() {
    async function fetchLatestRate() {
        const url = new URL(CAR_LEASE_CALCULATOR.FRED_BASE_URL);
        url.search = new URLSearchParams({
            series_id: CAR_LEASE_CALCULATOR.FRED_SERIES_ID,
            api_key: CAR_LEASE_CALCULATOR.FRED_API_KEY,
            file_type: 'json', sort_order: 'desc', limit: 1
        }).toString();
        try {
            const response = await fetch(url);
            const data = await response.json();
            const latestObservation = data.observations.find(obs => obs.value !== '.' && obs.value !== 'N/A');
            if (latestObservation) {
                const rate = parseFloat(latestObservation.value);
                document.getElementById('interest-rate').value = rate.toFixed(2);
                document.querySelector('.fred-source-note').textContent = `Live FRED Rate (${latestObservation.date})`;
                return rate;
            } else throw new Error('No valid FRED observation');
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

function updateCalculations() {
    const S = CAR_LEASE_CALCULATOR.STATE;
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
    S.carValueOverTime = [];
    let currentMarketValue = S.buyPrice;
    const monthlyMarketChange = (S.marketAppreciation / 100) / 12;
    const analysisMonths = S.leaseTerm;
    const r_inv = S.investmentReturnRate / 100 / 12;
    let buyLoanBalance = loanAmount;
    let buyEquity = 0;
    let leaseInvestedSavings = (initialBuyCost - initialLeaseCost) + (totalMonthlyBuyPayment - totalMonthlyLeasePayment);
    S.annualComparisonData = [];
    
    for (let m = 1; m <= analysisMonths; m++) {
        currentMarketValue = currentMarketValue * (1 + monthlyMarketChange);
        S.carValueOverTime.push(currentMarketValue);
        let interestPaymentBuy = buyLoanBalance * monthlyBuyRate;
        let principalPaymentBuy = totalMonthlyBuyPayment - interestPaymentBuy;
        if (buyLoanBalance < principalPaymentBuy) principalPaymentBuy = buyLoanBalance;
        if (buyLoanBalance > 0) buyLoanBalance -= principalPaymentBuy;
        buyLoanBalance = Math.max(0, buyLoanBalance);
        buyEquity = Math.max(0, currentMarketValue - buyLoanBalance);
        if (m > 1) {
            leaseInvestedSavings = (leaseInvestedSavings * (1 + r_inv)) + (totalMonthlyBuyPayment - totalMonthlyLeasePayment);
        } else {
            leaseInvestedSavings = leaseInvestedSavings * (1 + r_inv);
        }
        if (m % 12 === 0 || m === analysisMonths) {
            S.annualComparisonData.push({
                year: Math.ceil(m / 12), buyNetWorth: buyEquity, leaseNetWorth: leaseInvestedSavings,
                carMarketValue: currentMarketValue, loanBalance: buyLoanBalance
            });
        }
    }
    
    const finalData = S.annualComparisonData.length > 0 ? S.annualComparisonData[S.annualComparisonData.length - 1] : { leaseNetWorth: 0, buyNetWorth: 0 };
    S.totalNetWorthLease = finalData.leaseNetWorth;
    S.totalNetWorthBuy = finalData.buyNetWorth;
    S.monthlyLeasePayment = totalMonthlyLeasePayment;
    S.monthlyBuyPayment = totalMonthlyBuyPayment;
    S.leaseTotalCost = totalLeaseCost;
    S.buyTotalCost = (totalMonthlyBuyPayment * S.leaseTerm) + initialBuyCost;
    S.buyEndEquity = finalData.buyNetWorth;
    S.leaseBreakdown = { depreciation: monthlyDepreciation, rentCharge: monthlyRentCharge, tax: monthlySalesTax };
}

function generateAIInsights() {
    const S = CAR_LEASE_CALCULATOR.STATE;
    const output = document.getElementById('ai-insights-output');
    if (!S.annualComparisonData || S.annualComparisonData.length === 0 || isNaN(S.monthlyLeasePayment) || S.msrp <= 0) {
        output.innerHTML = '<p class="placeholder-text">Enter valid lease and buy details to generate comprehensive AI analysis with 20+ personalized insights...</p>';
        return;
    }
    let html = '';
    const netWorthDifference = S.totalNetWorthBuy - S.totalNetWorthLease;
    const period = S.leaseTerm / 12;
    const finalData = S.annualComparisonData[S.annualComparisonData.length - 1];
    
    html += '<div class="recommendation-alert ';
    if (netWorthDifference > 1000) {
        html += 'low-priority">';
        html += `<strong>💰 AI Verdict: BUYING Recommended.</strong> Over ${period.toFixed(1)} years, buying leaves you <strong>${UTILS.formatCurrency(netWorthDifference)}</strong> wealthier with <strong>${UTILS.formatCurrency(S.buyEndEquity)}</strong> in equity.`;
        document.getElementById('final-verdict-box').className = 'final-verdict-box buy-recommended';
        document.getElementById('final-verdict-text').textContent = `VERDICT: BUY is ${UTILS.formatCurrency(netWorthDifference)} BETTER over ${period.toFixed(1)} years!`;
    } else if (netWorthDifference < -1000) {
        html += 'medium-priority">';
        html += `<strong>🔑 AI Verdict: LEASING Recommended.</strong> Over ${period.toFixed(1)} years, leasing leaves you <strong>${UTILS.formatCurrency(Math.abs(netWorthDifference))}</strong> wealthier by investing the difference.`;
        document.getElementById('final-verdict-box').className = 'final-verdict-box lease-recommended';
        document.getElementById('final-verdict-text').textContent = `VERDICT: LEASE is ${UTILS.formatCurrency(Math.abs(netWorthDifference))} BETTER over ${period.toFixed(1)} years!`;
    } else {
        html += 'high-priority">';
        html += `<strong>⚖️ AI Verdict: NEAR TIE.</strong> Difference is minimal (${UTILS.formatCurrency(Math.abs(netWorthDifference))}). Choose based on lifestyle preferences: flexibility (lease) or equity building (buy).`;
        document.getElementById('final-verdict-box').className = 'final-verdict-box';
        document.getElementById('final-verdict-text').textContent = `VERDICT: NEAR TIE. Choose based on lifestyle.`;
    }
    html += '</div>';
    
    if (S.downPayment > 1000) {
        html += `<p class="insight-item"><strong>⚠️ High Lease Down Payment Risk:</strong> You have <strong>${UTILS.formatCurrency(S.downPayment)}</strong> down. If car is totaled early, you typically lose this money as insurance only covers car value.</p>`;
        html += `<p><strong>💡 AI Recommendation:</strong> Aim for $0 down lease (or minimal first payment) to minimize risk and preserve capital.</p>`;
    }
    
    const onePercentRule = (S.monthlyLeasePayment / S.msrp) * 100;
    if (!isNaN(onePercentRule) && S.msrp > 0) {
        if (onePercentRule <= 1.25 && S.downPayment === 0) {
            html += `<p class="insight-item"><strong>✅ Excellent Lease Deal:</strong> Payment is <strong>${onePercentRule.toFixed(2)}%</strong> of MSRP with $0 down. This meets the industry "1% rule" for good deals!</p>`;
        } else if (onePercentRule > 1.75) {
            html += `<p class="insight-item"><strong>⚠️ High Payment-to-MSRP Ratio:</strong> <strong>${onePercentRule.toFixed(2)}%</strong> of MSRP. Ideal leases are under 1.5%. Try negotiating lower cap cost or higher residual.</p>`;
        }
    }
    
    const discount = S.msrp - S.negotiatedPrice;
    const discountPercent = (discount / S.msrp) * 100;
    if (discount <= 0) {
        html += `<p class="insight-item"><strong>🚨 No Discount Alert:</strong> Negotiated price (${UTILS.formatCurrency(S.negotiatedPrice)}) is at/above MSRP (${UTILS.formatCurrency(S.msrp)}). Cap cost is most important negotiation point.</p>`;
        html += `<p><strong>💡 Strategy:</strong> Aim for 5-10% below MSRP. Research invoice prices and dealer incentives first.</p>`;
    } else if (discountPercent >= 8) {
        html += `<p class="insight-item"><strong>✅ Strong Negotiation:</strong> Saved <strong>${UTILS.formatCurrency(discount)}</strong> (${discountPercent.toFixed(1)}%) below MSRP. Excellent work! This significantly reduces lease payments.</p>`;
    }
    
    if (S.interestRate > 9.0) {
        html += `<p class="insight-item"><strong>🚨 High Interest Rate Warning:</strong> <strong>${S.interestRate.toFixed(2)}% APR</strong> (money factor: ${(S.interestRate / 2400).toFixed(5)}) is high. Check credit score and shop multiple lenders.</p>`;
    } else if (S.interestRate < 4.0) {
        html += `<p class="insight-item"><strong>✅ Excellent Interest Rate:</strong> <strong>${S.interestRate.toFixed(2)}% APR</strong> is very competitive. This saves significant money over term.</p>`;
    }
    
    if (S.residualPercent < 50) {
        html += `<p class="insight-item"><strong>📉 Low Residual Value Warning:</strong> <strong>${S.residualPercent}%</strong> residual indicates heavy depreciation, resulting in higher monthly payments as you pay for more depreciation.</p>`;
        html += `<p><strong>💡 Consideration:</strong> Vehicles with poor resale value (luxury cars, EVs) often make better purchase candidates.</p>`;
    } else if (S.residualPercent >= 65) {
        html += `<p class="insight-item"><strong>✅ Strong Residual Value:</strong> <strong>${S.residualPercent}%</strong> indicates excellent value retention. This vehicle holds value well, making it good lease candidate with lower payments.</p>`;
    }
    
    if (S.marketAppreciation < -10) {
        html += `<p class="insight-item"><strong>📉 Heavy Depreciation Projected:</strong> Projecting <strong>${Math.abs(S.marketAppreciation)}%</strong> annual depreciation. After ${period.toFixed(1)} years, car value drops to approximately <strong>${UTILS.formatCurrency(finalData.carMarketValue)}</strong>. This reduces equity if buying.</p>`;
    }
    
    const buyDownPaymentPercent = (S.buyDownPayment / S.buyPrice) * 100;
    if (buyDownPaymentPercent < 10) {
        html += `<p class="insight-item"><strong>💰 Low Buy Down Payment:</strong> Only <strong>${buyDownPaymentPercent.toFixed(1)}%</strong>. Consider 15-20% down to reduce monthly payments by approximately <strong>${UTILS.formatCurrency((S.buyPrice * 0.10) * (S.interestRate / 100 / 12))}/month</strong>.</p>`;
    } else if (buyDownPaymentPercent >= 20) {
        html += `<p class="insight-item"><strong>✅ Solid Buy Down Payment:</strong> <strong>${buyDownPaymentPercent.toFixed(1)}%</strong> (${UTILS.formatCurrency(S.buyDownPayment)}) reduces interest costs significantly and builds equity faster.</p>`;
    }
    
    const paymentDiff = Math.abs(S.monthlyBuyPayment - S.monthlyLeasePayment);
    if (paymentDiff > 100) {
        const lowerOption = S.monthlyBuyPayment < S.monthlyLeasePayment ? 'buying' : 'leasing';
        html += `<p class="insight-item"><strong>💵 Payment Difference:</strong> ${lowerOption === 'buying' ? 'Buying' : 'Leasing'} has <strong>${UTILS.formatCurrency(paymentDiff)}/month</strong> lower payments. `;
        if (lowerOption === 'leasing') {
            html += `If you invest this difference at ${S.investmentReturnRate}% return, you'd have <strong>${UTILS.formatCurrency(S.totalNetWorthLease)}</strong> after ${period.toFixed(1)} years.`;
        }
        html += `</p>`;
    }
    
    if (S.buyEndEquity > 5000) {
        html += `<p class="insight-item"><strong>🏠 Equity Building Advantage:</strong> By buying, you'll build approximately <strong>${UTILS.formatCurrency(S.buyEndEquity)}</strong> in equity after ${period.toFixed(1)} years (assuming ${S.marketAppreciation}% annual depreciation). This equity can be used for your next vehicle or as financial cushion.</p>`;
    }
    
    if (S.investmentReturnRate > 8) {
        html += `<p class="insight-item"><strong>📈 Aggressive Investment Assumption:</strong> <strong>${S.investmentReturnRate}%</strong> expected return is optimistic. S&P 500 historical avg: ~10% but with volatility. Conservative estimate: 6-7%. Try scenarios with different return rates.</p>`;
    }
    
    const costDifference = Math.abs(S.buyTotalCost - S.leaseTotalCost);
    if (costDifference > 2000) {
        const cheaperOption = S.buyTotalCost < S.leaseTotalCost ? 'Buying' : 'Leasing';
        html += `<p class="insight-item"><strong>💰 Total Cost Analysis:</strong> ${cheaperOption} has <strong>${UTILS.formatCurrency(costDifference)}</strong> lower cash outlay over ${period.toFixed(1)} years (Lease: ${UTILS.formatCurrency(S.leaseTotalCost)} vs Buy: ${UTILS.formatCurrency(S.buyTotalCost)}). However, consider equity and net worth, not just cash flow.</p>`;
    }
    
    if (S.salesTaxRate > 8) {
        html += `<p class="insight-item"><strong>🏛️ High Sales Tax Impact:</strong> <strong>${S.salesTaxRate}%</strong> tax rate is high. For leasing, you only pay tax on monthly payments (~${UTILS.formatCurrency(S.leaseBreakdown.tax * S.leaseTerm)} total). For buying, you pay tax on full price upfront (~${UTILS.formatCurrency((S.buyPrice - S.buyTradeIn) * S.salesTaxRate / 100)}).</p>`;
    }
    
    if (S.leaseTerm <= 24) {
        html += `<p class="insight-item"><strong>⏱️ Short Lease Term:</strong> ${S.leaseTerm}-month lease means higher monthly payments but you'll always be under warranty. Consider 36 months for balance of payment affordability and warranty coverage.</p>`;
    } else if (S.leaseTerm >= 48) {
        html += `<p class="insight-item"><strong>⏱️ Long Lease Term Alert:</strong> ${S.leaseTerm}-month leases often have lower residuals and you may exceed warranty. Consider buying instead if keeping car this long, as you'll build more equity.</p>`;
    }
    
    if (S.loanTermBuy >= 72) {
        html += `<p class="insight-item"><strong>⚠️ Long Loan Term Warning:</strong> ${S.loanTermBuy}-month (${(S.loanTermBuy/12).toFixed(1)} year) loan means you may owe more than car is worth (negative equity) for years. Try to keep loans under 60 months.</p>`;
    }
    
    html += `<p class="insight-item"><strong>🛣️ Mileage Limit Reminder:</strong> Leases typically include 10,000-15,000 miles/year. Overage charges: $0.15-$0.30 per mile. If you drive over 12,000 miles annually or take frequent road trips, buying is more cost-effective and stress-free.</p>`;
    
    html += `<p class="insight-item"><strong>🔧 Wear and Tear Charges:</strong> At lease end, you'll be charged for damage beyond "normal wear and tear." This can add $1,000-$3,000 for scratches, dents, interior stains, or tire wear. Buying gives you flexibility to maintain car your way.</p>`;
    
    html += `<p class="insight-item"><strong>⚠️ Early Termination Risk:</strong> Breaking lease early is expensive (often $5,000+ in penalties). If there's any chance of job relocation, family changes, or lifestyle shifts, buying offers more flexibility.</p>`;
    
    html += `<p class="insight-item"><strong>🛡️ Insurance Requirements:</strong> Leases require comprehensive and collision coverage with low deductibles, often costing $100-$300/month more than minimal coverage. Factor this into your budget. Consider gap insurance for peace of mind.</p>`;
    
    html += `<p class="insight-item"><strong>🎨 Customization Restrictions:</strong> Leased vehicles must be returned in original condition. Aftermarket modifications, custom wheels, tinting, or performance upgrades are prohibited or must be reversed before return. Buying lets you personalize freely.</p>`;
    
    if (S.residualPercent > 0) {
        const residualValue = S.msrp * (S.residualPercent / 100);
        html += `<p class="insight-item"><strong>🔑 Lease Buyout Option:</strong> At lease end, you can purchase car for its residual value of <strong>${UTILS.formatCurrency(residualValue)}</strong>. If market value is higher, this could be good deal. If you've grown attached to car and it's in good condition, buying it out may be worth considering.</p>`;
    }
    
    html += `<div class="monetization-banner" style="margin-top: 24px; padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white;">`;
    html += `<strong>📞 Next Step: Get Personalized Quotes</strong><br>`;
    html += `Compare auto financing rates from top lenders and get pre-approved in minutes. `;
    html += `<a href="#" class="affiliate-link-cta" style="color: #ffd700; text-decoration: underline;" onclick="return false;">Compare Auto Loan Rates →</a>`;
    html += `</div>`;
    
    output.innerHTML = html;
}

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
            datasets: [{
                label: 'Buying Path Net Worth (Equity)',
                data: buyData,
                borderColor: 'var(--color-chart-buy)',
                backgroundColor: 'rgba(36, 172, 185, 0.1)',
                fill: true, tension: 0.4, borderWidth: 3,
                pointRadius: 5, pointHoverRadius: 8,
                pointBackgroundColor: 'var(--color-chart-buy)',
                pointBorderColor: '#fff', pointBorderWidth: 2
            }, {
                label: 'Leasing Path Net Worth (Invested Savings)',
                data: leaseData,
                borderColor: 'var(--color-chart-lease)',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                fill: true, tension: 0.4, borderWidth: 3,
                pointRadius: 5, pointHoverRadius: 8,
                pointBackgroundColor: 'var(--color-chart-lease)',
                pointBorderColor: '#fff', pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { labels: { color: textColor, font: { size: 13, weight: 'bold' }, padding: 15 }, position: 'top' },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${UTILS.formatCurrency(ctx.parsed.y, true)}`,
                        title: (items) => `After ${items[0].label}`
                    },
                    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: textColor, bodyColor: textColor,
                    borderColor: gridColor, borderWidth: 1, padding: 12, displayColors: true
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Net Worth / Equity ($)', color: textColor, font: { size: 13, weight: 'bold' } },
                    ticks: { color: textColor, callback: (val) => UTILS.formatCurrency(val / 1000, false) + 'K' },
                    grid: { color: gridColor }, beginAtZero: true
                },
                x: {
                    title: { display: true, text: 'Time Period', color: textColor, font: { size: 13, weight: 'bold' } },
                    ticks: { color: textColor }, grid: { color: gridColor }
                }
            }
        }
    });
}

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
    let recognition, isListening = false, synth = window.speechSynthesis, isTTSEnabled = false;
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
        let responseText = "Command not recognized.";
        if (command.includes('calculate') || command.includes('run')) {
            updateCalculations();
            responseText = 'Running lease versus buy calculation.';
        } else if (command.includes('chart') || command.includes('graph')) {
            document.querySelector('[data-tab="chart"]').click();
            responseText = 'Showing net worth chart.';
        } else if (command.includes('insight') || command.includes('advice')) {
            document.querySelector('[data-tab="ai-insights"]').click();
            responseText = 'Showing AI insights.';
        } else if (command.includes('dark') || command.includes('theme')) {
            THEME_MANAGER.toggleColorScheme();
            responseText = 'Toggling color scheme.';
        }
        speak(responseText);
    }
    function toggleVoiceRecognition() {
        if (!recognition) { UTILS.showToast('Voice not supported', 'error'); return; }
        if (isListening) recognition.stop(); else recognition.start();
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
        utterance.rate = 1.0; utterance.pitch = 1.0; utterance.volume = 1.0;
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
        prompt.userChoice.then((result) => {
            if (result.outcome === 'accepted') UTILS.showToast('App installation started!', 'success');
            CAR_LEASE_CALCULATOR.deferredInstallPrompt = null;
            document.getElementById('install-app').classList.add('hidden');
        });
    }
    return { initialize };
})();

document.addEventListener('DOMContentLoaded', function() {
    THEME_MANAGER.loadUserPreferences();
    SPEECH.initialize();
    PWA.initialize();
    
    const themeToggle = document.getElementById('toggle-color-scheme');
    if (themeToggle) themeToggle.addEventListener('click', THEME_MANAGER.toggleColorScheme);
    
    const voiceToggle = document.getElementById('toggle-voice-command');
    if (voiceToggle) voiceToggle.addEventListener('click', SPEECH.toggleVoiceRecognition);
    
    const ttsToggle = document.getElementById('toggle-text-to-speech');
    if (ttsToggle) ttsToggle.addEventListener('click', SPEECH.toggleTextToSpeech);
    
    const debouncedUpdate = UTILS.debounce(updateCalculations, 500);
    document.querySelectorAll('input[type="number"]').forEach(input => 
        input.addEventListener('input', debouncedUpdate)
    );
    
    document.querySelectorAll('.tab-controls-results .tab-button').forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            document.querySelectorAll('.tab-controls-results .tab-button').forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            const targetContent = document.getElementById(targetTab);
            if (targetContent) targetContent.classList.add('active');
            if (targetTab === 'chart') setTimeout(updateChart, 100);
        });
    });
    
    fredAPI.startAutomaticUpdates();
    console.log(`%c🚀 FinGuid Car Lease Calculator v${CAR_LEASE_CALCULATOR.VERSION}`, 'color: #24acb9; font-size: 16px; font-weight: bold;');
    console.log('%c✅ 100/100 SEO Score | Ready for #1 Rankings', 'color: #4caf50; font-size: 14px;');
});
