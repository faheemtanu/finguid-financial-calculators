/**
 * CAR LEASE CALCULATOR v2.1 - PRODUCTION
 * FinGuid USA - Fixed Net Worth Chart + Sponsor/Affiliate Optimization
 */

const CAR_LEASE_CALCULATOR = {
    VERSION: '2.1',
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
                year: Math.ceil(m / 12), buyNetWorth: Math.max(0, buyEquity), leaseNetWorth: Math.max(0, leaseInvestedSavings),
                carMarketValue: currentMarketValue, loanBalance: buyLoanBalance
            });
        }
    }
    
    const finalData = S.annualComparisonData.length > 0 ? S.annualComparisonData[S.annualComparisonData.length - 1] : { leaseNetWorth: 0, buyNetWorth: 0 };
    S.totalNetWorthLease = Math.max(0, finalData.leaseNetWorth);
    S.totalNetWorthBuy = Math.max(0, finalData.buyNetWorth);
    S.monthlyLeasePayment = Math.max(0, totalMonthlyLeasePayment);
    S.monthlyBuyPayment = Math.max(0, totalMonthlyBuyPayment);
    S.leaseTotalCost = Math.max(0, totalLeaseCost);
    S.buyTotalCost = Math.max(0, (totalMonthlyBuyPayment * S.leaseTerm) + initialBuyCost);
    S.buyEndEquity = Math.max(0, finalData.buyNetWorth);
    S.leaseBreakdown = { depreciation: monthlyDepreciation, rentCharge: monthlyRentCharge, tax: monthlySalesTax };
}

function generateAIInsights() {
    const S = CAR_LEASE_CALCULATOR.STATE;
    const output = document.getElementById('ai-insights-output');
    if (!S.annualComparisonData || S.annualComparisonData.length === 0 || isNaN(S.monthlyLeasePayment) || S.msrp <= 0) {
        output.innerHTML = '<p class="placeholder-text">Enter valid lease and buy details to generate 20+ AI insights...</p>';
        return;
    }
    let html = '';
    const netWorthDifference = S.totalNetWorthBuy - S.totalNetWorthLease;
    const period = S.leaseTerm / 12;
    const finalData = S.annualComparisonData[S.annualComparisonData.length - 1];
    
    html += '<div class="recommendation-alert ';
    if (netWorthDifference > 1000) {
        html += 'low-priority">';
        html += `<strong>💰 AI VERDICT: BUYING</strong> You'll be ${UTILS.formatCurrency(netWorthDifference)} wealthier with ${UTILS.formatCurrency(S.buyEndEquity)} equity.`;
        document.getElementById('final-verdict-box').className = 'final-verdict-box buy-recommended';
        document.getElementById('final-verdict-text').textContent = `BUY: ${UTILS.formatCurrency(netWorthDifference)} BETTER!`;
    } else if (netWorthDifference < -1000) {
        html += 'medium-priority">';
        html += `<strong>🔑 AI VERDICT: LEASING</strong> You'll be ${UTILS.formatCurrency(Math.abs(netWorthDifference))} wealthier investing the difference.`;
        document.getElementById('final-verdict-box').className = 'final-verdict-box lease-recommended';
        document.getElementById('final-verdict-text').textContent = `LEASE: ${UTILS.formatCurrency(Math.abs(netWorthDifference))} BETTER!`;
    } else {
        html += 'high-priority">';
        html += `<strong>⚖️ NEAR TIE</strong> Difference minimal. Choose based on lifestyle.`;
        document.getElementById('final-verdict-box').className = 'final-verdict-box';
        document.getElementById('final-verdict-text').textContent = `NEAR TIE - Choose on lifestyle`;
    }
    html += '</div>';
    
    if (S.downPayment > 1000) {
        html += `<p class="insight-item"><strong>⚠️ High Lease Down:</strong> ${UTILS.formatCurrency(S.downPayment)} at risk if car totaled. <strong>AI Tip:</strong> Use $0 down.</p>`;
    }
    const onePercentRule = (S.monthlyLeasePayment / S.msrp) * 100;
    if (!isNaN(onePercentRule) && S.msrp > 0) {
        if (onePercentRule <= 1.25 && S.downPayment === 0) {
            html += `<p class="insight-item"><strong>✅ Great Deal:</strong> ${onePercentRule.toFixed(2)}% payment-to-MSRP ratio!</p>`;
        } else if (onePercentRule > 1.75) {
            html += `<p class="insight-item"><strong>⚠️ High Payment Ratio:</strong> ${onePercentRule.toFixed(2)}% - Negotiate lower.</p>`;
        }
    }
    const discount = S.msrp - S.negotiatedPrice;
    if (discount <= 0) {
        html += `<p class="insight-item"><strong>🚨 No Discount:</strong> Negotiated at/above MSRP. Aim for 5-10% below.</p>`;
    } else if ((discount / S.msrp) * 100 >= 8) {
        html += `<p class="insight-item"><strong>✅ Strong Negotiation:</strong> Saved ${UTILS.formatCurrency(discount)}!</p>`;
    }
    if (S.interestRate > 9.0) {
        html += `<p class="insight-item"><strong>🚨 High Rate:</strong> ${S.interestRate.toFixed(2)}% APR. Shop lenders.</p>`;
    } else if (S.interestRate < 4.0) {
        html += `<p class="insight-item"><strong>✅ Excellent Rate:</strong> ${S.interestRate.toFixed(2)}% APR!</p>`;
    }
    if (S.residualPercent < 50) {
        html += `<p class="insight-item"><strong>📉 Low Residual:</strong> ${S.residualPercent}% means heavy depreciation.</p>`;
    } else if (S.residualPercent >= 65) {
        html += `<p class="insight-item"><strong>✅ Strong Residual:</strong> ${S.residualPercent}% holds value well.</p>`;
    }
    if (S.buyEndEquity > 5000) {
        html += `<p class="insight-item"><strong>🏠 Equity Building:</strong> Build ${UTILS.formatCurrency(S.buyEndEquity)} in equity!</p>`;
    }
    if (S.salesTaxRate > 8) {
        html += `<p class="insight-item"><strong>🏛️ High Tax:</strong> ${S.salesTaxRate}% rate impacts both options.</p>`;
    }
    if (S.leaseTerm <= 24) {
        html += `<p class="insight-item"><strong>⏱️ Short Lease:</strong> Higher payments but always new car.</p>`;
    } else if (S.leaseTerm >= 48) {
        html += `<p class="insight-item"><strong>⏱️ Long Lease:</strong> Consider buying if keeping this long.</p>`;
    }
    html += `<p class="insight-item"><strong>🛣️ Mileage Limit:</strong> Leases: 10-15K miles/year. Overages: $0.15-0.30/mile.</p>`;
    html += `<p class="insight-item"><strong>🔧 Wear & Tear:</strong> Charges at lease-end: $1K-3K typical.</p>`;
    html += `<p class="insight-item"><strong>⚠️ Early Termination:</strong> Breaking lease costs $5K+. Buying offers flexibility.</p>`;
    html += `<p class="insight-item"><strong>🛡️ Insurance:</strong> Lease requires full coverage ($100-300/mo more).</p>`;
    html += `<p class="insight-item"><strong>🎨 Customization:</strong> No mods on leases. Buying = personalize freely.</p>`;
    if (S.residualPercent > 0) {
        const residualValue = S.msrp * (S.residualPercent / 100);
        html += `<p class="insight-item"><strong>🔑 Buyout Option:</strong> Purchase at lease-end for ${UTILS.formatCurrency(residualValue)}.</p>`;
    }
    
    html += `<div class="monetization-banner">
        <strong>📞 Get Pre-Approved for Auto Financing</strong><br>
        <span>Compare rates from top lenders & see if you qualify for special offers.</span><br>
        <a href="#" class="affiliate-link-cta" onclick="alert('Affiliate link to: Auto Loan Partner'); return false;">👉 Get Auto Loan Quotes →</a>
    </div>`;
    
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
    const buyData = S.annualComparisonData.map(d => Math.max(0, d.buyNetWorth));
    const leaseData = S.annualComparisonData.map(d => Math.max(0, d.leaseNetWorth));
    
    if (CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart) {
        CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart.destroy();
    }
    
    const isDarkMode = document.documentElement.getAttribute('data-color-scheme') === 'dark';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDarkMode ? '#ffffff' : '#333333';
    
    try {
        CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Buying (Equity)',
                    data: buyData,
                    borderColor: '#24acb9',
                    backgroundColor: 'rgba(36, 172, 185, 0.1)',
                    fill: true, tension: 0.4, borderWidth: 3,
                    pointRadius: 5, pointHoverRadius: 8,
                    pointBackgroundColor: '#24acb9',
                    pointBorderColor: '#fff', pointBorderWidth: 2
                }, {
                    label: 'Leasing (Invested Savings)',
                    data: leaseData,
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    fill: true, tension: 0.4, borderWidth: 3,
                    pointRadius: 5, pointHoverRadius: 8,
                    pointBackgroundColor: '#ffc107',
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
                        titleColor: textColor, bodyColor: textColor, borderColor: gridColor, borderWidth: 1, padding: 12
                    }
                },
                scales: {
                    y: {
                        title: { display: true, text: 'Net Worth ($)', color: textColor, font: { size: 13, weight: 'bold' } },
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
    } catch (error) {
        console.error('Chart Error:', error);
    }
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
        document.getElementById('final-verdict-text').textContent = "Enter valid data...";
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
        const savedScheme = localStorage.getItem(COLOR_SCHEME_KEY) || 'light';
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
        if (CAR_LEASE_CALCULATOR.charts.leaseVsBuyChart) {
            setTimeout(updateChart, 100);
        }
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
            if (transcript.includes('calculate')) {
                updateCalculations();
            } else if (transcript.includes('chart')) {
                document.querySelector('[data-tab="chart"]')?.click();
            }
        };
    }
    function toggleVoiceRecognition() {
        if (!recognition) return;
        if (isListening) recognition.stop(); else recognition.start();
    }
    function toggleTextToSpeech() {
        isTTSEnabled = !isTTSEnabled;
        const btn = document.getElementById('toggle-text-to-speech');
        if (isTTSEnabled) btn.classList.replace('tts-inactive', 'tts-active');
        else btn.classList.replace('tts-active', 'tts-inactive');
    }
    return { initialize, toggleVoiceRecognition, toggleTextToSpeech };
})();

document.addEventListener('DOMContentLoaded', function() {
    THEME_MANAGER.loadUserPreferences();
    SPEECH.initialize();
    
    document.getElementById('toggle-color-scheme')?.addEventListener('click', THEME_MANAGER.toggleColorScheme);
    document.getElementById('toggle-voice-command')?.addEventListener('click', SPEECH.toggleVoiceRecognition);
    document.getElementById('toggle-text-to-speech')?.addEventListener('click', SPEECH.toggleTextToSpeech);
    
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
    console.log(`%c✅ FinGuid Car Lease Calculator v${CAR_LEASE_CALCULATOR.VERSION}`, 'color: #24acb9; font-size: 16px; font-weight: bold;');
});
