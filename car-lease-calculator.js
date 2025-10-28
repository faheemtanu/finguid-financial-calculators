// CAR LEASE CALCULATOR - PRODUCTION v2.2
// Fully functional with 20+ AI Insights Engine

const APP = {
    VERSION: '2.2',
    DEBUG: false,
    FRED_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_URL: 'https://api.stlouisfed.org/fred/series/observations',
    FRED_SERIES: 'TERMCBCCALLNS',
    
    STATE: {
        msrp: 35000,
        negotiatedPrice: 33500,
        residualPercent: 62,
        leaseTerm: 36,
        downPayment: 2000,
        tradeInLease: 0,
        acquisitionFee: 795,
        dispositionFee: 395,
        buyPrice: 33500,
        buyDownPayment: 5000,
        buyTradeIn: 0,
        loanTermBuy: 60,
        dealerFeesBuy: 500,
        interestRate: 7.50,
        salesTaxRate: 6.5,
        registrationFee: 150,
        marketAppreciation: -15,
        investmentReturn: 6.0,
        
        // Results
        monthlyLeasePayment: 0,
        monthlyBuyPayment: 0,
        totalLeaseCost: 0,
        totalBuyCost: 0,
        leaseEquity: 0, // This is "Invested Savings"
        buyEquity: 0,
        annualData: [],
        moneyFactor: 0,
        leaseDepreciation: 0,
        leaseRentCharge: 0,
        leaseTax: 0,
    },
    
    charts: { main: null },
    recognition: null,
    synthesis: window.speechSynthesis
};

// ============================================================================
// UTILITIES
// ============================================================================

const UTILS = {
    formatCurrency(val, decimals = 0) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(val || 0);
    },
    
    parseInput(id) {
        const el = document.getElementById(id);
        return el ? parseFloat(el.value.replace(/[$,]/g, '')) || 0 : 0;
    },
    
    formatPercent(val, decimals = 1) {
        return (val || 0).toFixed(decimals) + '%';
    },
    
    debounce(fn, ms = 500) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), ms);
        };
    },
    
    showToast(msg, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = msg;
        container.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }
};

// ============================================================================
// CALCULATIONS
// ============================================================================

function loadInputs() {
    const S = APP.STATE;
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
    S.investmentReturn = UTILS.parseInput('investment-return');
}

function calculate() {
    loadInputs();
    const S = APP.STATE;
    
    if (S.msrp <= 0 || S.leaseTerm <= 0) {
        displayResults();
        return;
    }
    
    // LEASE CALCULATION
    const capCost = S.negotiatedPrice - S.downPayment - S.tradeInLease + S.acquisitionFee;
    const residual = S.msrp * (S.residualPercent / 100);
    S.leaseDepreciation = (capCost - residual) / S.leaseTerm;
    S.moneyFactor = (S.interestRate / 100) / 2400;
    S.leaseRentCharge = (capCost + residual) * S.moneyFactor;
    const basePayment = S.leaseDepreciation + S.leaseRentCharge;
    S.leaseTax = basePayment * (S.salesTaxRate / 100);
    S.monthlyLeasePayment = basePayment + S.leaseTax;
    S.totalLeaseCost = (S.monthlyLeasePayment * S.leaseTerm) + S.downPayment + S.acquisitionFee + S.dispositionFee;
    
    // BUY CALCULATION
    const tax = (S.buyPrice - S.buyTradeIn) * (S.salesTaxRate / 100);
    const totalPrice = S.buyPrice + tax + S.dealerFeesBuy;
    const loanAmount = totalPrice - S.buyDownPayment - S.buyTradeIn;
    const rate = (S.interestRate / 100) / 12;
    const nPayments = S.loanTermBuy;
    
    if (rate > 0) {
        const power = Math.pow(1 + rate, nPayments);
        S.monthlyBuyPayment = loanAmount * (rate * power) / (power - 1);
    } else {
        S.monthlyBuyPayment = loanAmount / nPayments;
    }
    
    S.totalBuyCost = (S.monthlyBuyPayment * S.loanTermBuy) + S.buyDownPayment + S.buyTradeIn; // Total cost *during loan term*
    
    // NET WORTH OVER TIME
    S.annualData = [];
    let balance = loanAmount;
    let value = S.buyPrice;
    
    // Calculate initial investment difference
    const leaseUpfront = S.downPayment + S.acquisitionFee;
    const buyUpfront = S.buyDownPayment + S.buyTradeIn + S.dealerFeesBuy + tax;
    let leaseInvested = (buyUpfront - leaseUpfront);

    const monthlyDepreciation = (S.marketAppreciation / 100) / 12;
    const monthlyReturn = (S.investmentReturn / 100) / 12;
    
    for (let m = 1; m <= S.leaseTerm; m++) {
        value *= (1 + monthlyDepreciation);
        
        let interest = 0;
        let principal = 0;
        if (m <= S.loanTermBuy) {
             interest = balance * rate;
             principal = S.monthlyBuyPayment - interest;
             balance = Math.max(0, balance - principal);
        }
        
        const buyEquity = Math.max(0, value - balance);
        
        // Add monthly payment difference to invested savings
        const monthlyDiff = S.monthlyBuyPayment - S.monthlyLeasePayment;
        leaseInvested = (leaseInvested * (1 + monthlyReturn)) + monthlyDiff;
        
        
        if (m % 12 === 0 || m === S.leaseTerm) {
            S.annualData.push({
                year: m / 12,
                buyEquity: buyEquity,
                leaseEquity: leaseInvested // "Lease Equity" is really "Invested Savings"
            });
        }
    }
    
    if (S.annualData.length === 0) {
        S.annualData.push({year: S.leaseTerm/12, buyEquity: 0, leaseEquity: 0});
    }
    
    S.buyEquity = S.annualData[S.annualData.length - 1].buyEquity;
    S.leaseEquity = S.annualData[S.annualData.length - 1].leaseEquity;
    
    displayResults();
    // DO NOT call updateChart() here. It will be called by the tab listener.
    generateInsights();
}

function displayResults() {
    const S = APP.STATE;
    
    document.getElementById('monthly-payment').textContent = UTILS.formatCurrency(S.monthlyLeasePayment, 2);
    document.getElementById('payment-breakdown').textContent = 
        `Depreciation: ${UTILS.formatCurrency(S.leaseDepreciation, 2)} | Finance: ${UTILS.formatCurrency(S.leaseRentCharge, 2)} | Tax: ${UTILS.formatCurrency(S.leaseTax, 2)}`;
    
    document.getElementById('lease-monthly').textContent = UTILS.formatCurrency(S.monthlyLeasePayment, 2);
    document.getElementById('lease-total').textContent = UTILS.formatCurrency(S.totalLeaseCost);
    document.getElementById('lease-equity-display').textContent = UTILS.formatCurrency(S.leaseEquity); // Show invested savings
    
    document.getElementById('buy-monthly').textContent = UTILS.formatCurrency(S.monthlyBuyPayment, 2);
    document.getElementById('buy-total').textContent = UTILS.formatCurrency(S.monthlyBuyPayment * S.leaseTerm + (S.buyDownPayment + S.buyTradeIn)); // Total cost *over same term*
    document.getElementById('buy-equity').textContent = UTILS.formatCurrency(S.buyEquity);
    
    const diff = S.buyEquity - S.leaseEquity;
    const verdict = document.getElementById('verdict-box');
    
    if (diff > 200) {
        verdict.style.background = 'rgba(36, 172, 185, 0.1)';
        verdict.style.borderLeft = '4px solid var(--color-primary)';
        document.getElementById('verdict-text').innerHTML = 
            `<strong>💰 BUYING is Better:</strong> You'll be ${UTILS.formatCurrency(diff)} wealthier!`;
    } else if (diff < -200) {
        verdict.style.background = 'rgba(255, 193, 7, 0.1)';
        verdict.style.borderLeft = '4px solid var(--color-accent)';
        document.getElementById('verdict-text').innerHTML = 
            `<strong>🔑 LEASING is Better:</strong> You'll be ${UTILS.formatCurrency(Math.abs(diff))} wealthier!`;
    } else {
        verdict.style.background = 'rgba(100, 116, 139, 0.1)';
        verdict.style.borderLeft = '4px solid var(--color-text-light)';
        document.getElementById('verdict-text').innerHTML = 
            `<strong>⚖️ NEAR TIE:</strong> Difference is minimal (${UTILS.formatCurrency(Math.abs(diff))})`;
    }
}

function updateChart() {
    const S = APP.STATE;
    const canvas = document.getElementById('leaseVsBuyChart');
    if (!canvas || S.annualData.length === 0) return;
    
    if (APP.charts.main) {
        APP.charts.main.destroy();
    }
    
    const labels = S.annualData.map(d => `Year ${d.year.toFixed(1)}`);
    const buyData = S.annualData.map(d => Math.max(0, d.buyEquity));
    const leaseData = S.annualData.map(d => Math.max(0, d.leaseEquity));
    
    const isDark = document.documentElement.getAttribute('data-color-scheme') === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#E1E8ED' : '#1F2121';

    try {
        APP.charts.main = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Buying Path (Net Worth)',
                        data: buyData,
                        borderColor: '#24ACB9',
                        backgroundColor: 'rgba(36, 172, 185, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 5
                    },
                    {
                        label: 'Leasing Path (Net Worth)',
                        data: leaseData,
                        borderColor: '#FFC107',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { 
                            usePointStyle: true, 
                            padding: 15,
                            color: textColor 
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${UTILS.formatCurrency(context.raw)}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: val => UTILS.formatCurrency(val / 1000) + 'K',
                            color: textColor
                        },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    } catch (e) {
        console.error('Chart error:', e);
    }
}

// ============================================================================
// AI INSIGHTS ENGINE (v2.2)
// ============================================================================

function generateInsights() {
    const S = APP.STATE;
    const container = document.getElementById('ai-insights');
    const insights = [];

    const addInsight = (icon, type, title, text) => {
        insights.push({ icon, type, title, text });
    };

    // --- 20+ INSIGHTS ---

    // 1. Primary Verdict
    const diff = S.buyEquity - S.leaseEquity;
    if (diff > 200) {
        addInsight('fa-coins', 'success', 'AI Verdict: Buying Recommended', `Buying leaves you <strong>${UTILS.formatCurrency(diff)}</strong> wealthier at the end of the term by building direct equity in the asset.`);
    } else if (diff < -200) {
        addInsight('fa-key', 'success', 'AI Verdict: Leasing Recommended', `Leasing leaves you <strong>${UTILS.formatCurrency(Math.abs(diff))}</strong> wealthier by investing the savings from lower upfront and monthly costs.`);
    } else {
        addInsight('fa-balance-scale', 'info', 'AI Verdict: Near Tie', `Both options are financially similar (<strong>${UTILS.formatCurrency(Math.abs(diff))}</strong> difference). Choose based on lifestyle flexibility vs. ownership preference.`);
    }

    // 2. 1% Rule of Leasing
    const onePercentRule = (S.monthlyLeasePayment / S.msrp) * 100;
    if (onePercentRule <= 1.0 && S.downPayment === 0) {
        addInsight('fa-star', 'success', 'Excellent Deal: 1% Rule Met', `Your payment is <strong>${UTILS.formatPercent(onePercentRule)}</strong> of MSRP with $0 down. This is considered a great lease deal.`);
    } else if (onePercentRule <= 1.25) {
        addInsight('fa-check', 'success', 'Good Deal: 1.25% Rule Met', `Your payment is <strong>${UTILS.formatPercent(onePercentRule)}</strong> of MSRP. This is a solid lease deal.`);
    } else if (onePercentRule > 1.5) {
        addInsight('fa-exclamation-triangle', 'warning', 'Potentially Poor Deal', `Your payment is <strong>${UTILS.formatPercent(onePercentRule)}</strong> of MSRP. This is high. Aim for 1.25% or less.`);
    }

    // 3. Lease Down Payment
    if (S.downPayment > 0) {
        addInsight('fa-shield-alt', 'warning', 'Lease Down Payment Risk', `You're putting <strong>${UTILS.formatCurrency(S.downPayment)}</strong> down. If the car is totaled, you lose this money. <strong>Recommendation:</strong> Pay $0 down on a lease.`);
    } else {
        addInsight('fa-check-circle', 'success', '$0 Down Lease', `Excellent. You are correctly paying $0 down (Cap Cost Reduction), minimizing your risk.`);
    }

    // 4. Negotiation Analysis
    const discount = S.msrp - S.negotiatedPrice;
    if (discount > 0) {
        addInsight('fa-tags', 'success', 'Good Negotiation', `You've negotiated <strong>${UTILS.formatCurrency(discount)}</strong> (<strong>${UTILS.formatPercent(discount/S.msrp * 100)}</strong>) off the MSRP. This directly lowers your lease depreciation.`);
    } else {
        addInsight('fa-comment-dollar', 'info', 'Negotiation Tip', `You're paying MSRP. Always negotiate the "Negotiated Price" (Cap Cost) just as you would if buying.`);
    }

    // 5. Interest Rate / Money Factor
    const apr = S.interestRate;
    const mf = S.moneyFactor;
    if (apr > 8) {
        addInsight('fa-chart-line', 'error', 'High Interest Rate', `Your APR is <strong>${UTILS.formatPercent(apr)}</strong> (Money Factor: ${mf.toFixed(5)}). This is high. Check your credit or seek other financing/dealers.`);
    } else if (apr < 4) {
        addInsight('fa-check', 'success', 'Excellent Interest Rate', `Your APR is <strong>${UTILS.formatPercent(apr)}</strong> (Money Factor: ${mf.toFixed(5)}). This is a great rate.`);
    } else {
         addInsight('fa-info-circle', 'info', 'Money Factor Insight', `Your APR is <strong>${UTILS.formatPercent(apr)}</strong>, which equals a Money Factor of <strong>${mf.toFixed(5)}</strong>. (APR = Money Factor * 2400).`);
    }

    // 6. Residual Value
    if (S.residualPercent > 60) {
        addInsight('fa-arrow-up', 'success', 'High Residual Value', `A <strong>${S.residualPercent}%</strong> residual is high, which is great for leasing. It means the car holds its value well, lowering your depreciation payment.`);
    } else if (S.residualPercent < 50) {
        addInsight('fa-arrow-down', 'warning', 'Low Residual Value', `A <strong>${S.residualPercent}%</strong> residual is low. This increases your depreciation payment, making the lease more expensive. Common on less popular models.`);
    }

    // 7. Lease Term
    if (S.leaseTerm !== 36) {
        addInsight('fa-calendar-alt', 'info', 'Lease Term Note', `You've selected a <strong>${S.leaseTerm}-month</strong> term. The "sweet spot" is often 24 or 36 months, as it aligns with the 3-year factory warranty.`);
    }

    // 8. Buy Loan Term
    if (S.loanTermBuy > 60) {
        addInsight('fa-calendar-times', 'warning', 'Long Loan Term', `A <strong>${S.loanTermBuy}-month</strong> loan term means you'll pay more interest and be "upside-down" (owe more than it's worth) for longer.`);
    }

    // 9. Payment Comparison
    const paymentDiff = Math.abs(S.monthlyBuyPayment - S.monthlyLeasePayment);
    if (S.monthlyLeasePayment < S.monthlyBuyPayment) {
        addInsight('fa-dollar-sign', 'info', 'Monthly Cash Flow', `Leasing improves your monthly cash flow by <strong>${UTILS.formatCurrency(paymentDiff, 2)}</strong>. This model assumes you invest that difference.`);
    } else {
        addInsight('fa-dollar-sign', 'info', 'Monthly Cash Flow', `Buying improves your monthly cash flow by <strong>${UTILS.formatCurrency(paymentDiff, 2)}</strong>. This is unusual and makes buying more attractive.`);
    }

    // 10. Investment Return Impact
    if (S.investmentReturn > 0 && S.leaseEquity > 0) {
        addInsight('fa-chart-pie', 'info', 'Investment Impact', `Your <strong>${UTILS.formatPercent(S.investmentReturn)}</strong> investment return generated <strong>${UTILS.formatCurrency(S.leaseEquity - ((S.buyDownPayment - S.downPayment) + (S.monthlyBuyPayment - S.monthlyLeasePayment) * S.leaseTerm))}</strong> in compound growth.`);
    }
    
    // 11. Acquisition Fee
    if (S.acquisitionFee > 800) {
         addInsight('fa-file-invoice-dollar', 'warning', 'High Acquisition Fee', `The <strong>${UTILS.formatCurrency(S.acquisitionFee)}</strong> acquisition fee is high (avg is $595-$795). Sometimes this can be negotiated or waived.`);
    }
    
    // 12. Disposition Fee
    if (S.dispositionFee > 0) {
        addInsight('fa-hand-holding-usd', 'info', 'Disposition Fee', `Note the <strong>${UTILS.formatCurrency(S.dispositionFee)}</strong> fee due at lease-end. This is often waived if you lease or buy another car from the same brand.`);
    }
    
    // 13. Lease vs. Buy Price
    if (S.negotiatedPrice !== S.buyPrice) {
        addInsight('fa-exchange-alt', 'error', 'Unfair Comparison', `Your Lease "Negotiated Price" (<strong>${UTILS.formatCurrency(S.negotiatedPrice)}</strong>) and Buy "Purchase Price" (<strong>${UTILS.formatCurrency(S.buyPrice)}</strong>) are different. Set them to be the same for a valid comparison.`);
    }
    
    // 14. Depreciation Insight
    addInsight('fa-car-crash', 'info', 'Lease Depreciation', `You are paying <strong>${UTILS.formatCurrency(S.leaseDepreciation, 2)}/mo</strong> in depreciation and <strong>${UTILS.formatCurrency(S.leaseRentCharge, 2)}/mo</strong> in finance charges (plus tax).`);

    // 15. Total Cost Insight
    addInsight('fa-calculator', 'info', 'Total Cost (Lease Term)', `Over ${S.leaseTerm} months, you'll spend <strong>${UTILS.formatCurrency(S.totalLeaseCost)}</strong> to lease vs. <strong>${UTILS.formatCurrency(S.monthlyBuyPayment * S.leaseTerm + S.buyDownPayment)}</strong> to buy.`);

    // 16. Negative Depreciation
    if (S.marketAppreciation > 0) {
        addInsight('fa-exclamation-triangle', 'warning', 'Vehicle Appreciation?', `You've set market appreciation to <strong>+${S.marketAppreciation}%</strong>. This is highly unusual and not a safe assumption for most vehicles.`);
    }

    // 17. Buy Down Payment
    if (S.buyDownPayment / S.buyPrice < 0.2) {
        addInsight('fa-percent', 'info', 'Buying Down Payment', `Your <strong>${UTILS.formatCurrency(S.buyDownPayment)}</strong> down payment is less than the recommended 20% (<strong>${UTILS.formatCurrency(S.buyPrice * 0.2)}</strong>). This increases interest costs.`);
    }

    // 18. Tax Insight
    if (S.salesTaxRate > 0) {
        addInsight('fa-receipt', 'info', 'Sales Tax Impact', `Leasing is tax-efficient in most states, as you only pay <strong>${UTILS.formatPercent(S.salesTaxRate)}</strong> tax on the monthly payment, not the full vehicle price.`);
    }
    
    // 19. Flexibility
    if (S.leaseEquity > S.buyEquity) {
        addInsight('fa-sync-alt', 'info', 'Lifestyle Flexibility', `Leasing provides flexibility. You can easily get a new car every <strong>${S.leaseTerm}</strong> months without the hassle of selling or trading in a used car.`);
    }

    // 20. Ownership
    if (S.buyEquity > S.leaseEquity) {
        addInsight('fa-home', 'info', 'Pride of Ownership', `Buying builds long-term equity. After your <strong>${S.loanTermBuy}-month</strong> loan, you own the car outright and have no more payments.`);
    }

    // 21. Fees
    addInsight('fa-money-bill-wave', 'info', 'Fee Analysis', `Lease fees total <strong>${UTILS.formatCurrency(S.acquisitionFee + S.dispositionFee)}</strong>. Buy fees total <strong>${UTILS.formatCurrency(S.dealerFeesBuy)}</strong> (plus tax on full price).`);


    // --- Render Insights ---
    let html = '';
    if (insights.length > 0) {
        insights.forEach(insight => {
            html += `
                <div class="insight-item" style="border-left-color: var(--color-${insight.type === 'error' ? 'error' : insight.type === 'warning' ? 'accent' : insight.type === 'success' ? 'success' : 'info'});">
                    <i class="fas ${insight.icon} icon-${insight.type === 'error' ? 'error' : insight.type === 'warning' ? 'warning' : insight.type === 'success' ? 'success' : 'info'}"></i>
                    <div class="insight-text">
                        <strong>${insight.title}</strong>
                        <span>${insight.text}</span>
                    </div>
                </div>
            `;
        });
    } else {
        html = '<p class="placeholder">Enter data to generate 20+ AI insights...</p>';
    }
    
    container.innerHTML = html;
}


// ============================================================================
// THEME MANAGEMENT
// ============================================================================

function initTheme() {
    const html = document.documentElement;
    const saved = localStorage.getItem('color-scheme') || 'light';
    html.setAttribute('data-color-scheme', saved);
    updateThemeIcon(saved);
}

function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-color-scheme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-color-scheme', next);
    localStorage.setItem('color-scheme', next);
    updateThemeIcon(next);
    
    // Re-render chart with new theme colors
    if (document.getElementById('chart').classList.contains('active')) {
         setTimeout(() => updateChart(), 50);
    }
}

function updateThemeIcon(scheme) {
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.innerHTML = scheme === 'dark' 
            ? '<i class="fas fa-moon"></i>' 
            : '<i class="fas fa-sun"></i>';
    }
}

// ============================================================================
// VOICE CONTROL
// ============================================================================

function initVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        document.getElementById('voice-toggle').style.display = 'none';
        return;
    }
    
    APP.recognition = new SpeechRecognition();
    APP.recognition.continuous = false;
    APP.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        if (transcript.includes('calculate')) {
            calculate();
            speak('Calculation complete');
        } else if (transcript.includes('dark mode')) {
            toggleTheme();
        } else if (transcript.includes('show chart')) {
             document.querySelector('[data-tab="chart"]').click();
        } else if (transcript.includes('show comparison')) {
             document.querySelector('[data-tab="comparison"]').click();
        }
    };
    
    APP.recognition.onerror = () => {
         UTILS.showToast('Voice command not recognized.', 'error');
    };
    
    APP.recognition.onstart = () => {
         UTILS.showToast('Listening...', 'info');
    };
}

function toggleVoice() {
    if (!APP.recognition) {
        UTILS.showToast('Voice not supported', 'error');
        return;
    }
    try {
        APP.recognition.start();
    } catch(e) {
        UTILS.showToast('Please allow microphone access.', 'error');
    }
}

function speak(text) {
    if (!APP.synthesis) return;
    APP.synthesis.cancel(); // Cancel any previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    APP.synthesis.speak(utterance);
}

function toggleTTS() {
    if (APP.synthesis.speaking) {
        APP.synthesis.cancel();
        UTILS.showToast('Speech cancelled', 'info');
    } else {
        const S = APP.STATE;
        const diff = S.buyEquity - S.leaseEquity;
        let textToSpeak = '';
        if (diff > 200) {
            textToSpeak = `Buying is recommended. You will be ${UTILS.formatCurrency(diff)} wealthier.`;
        } else if (diff < -200) {
            textToSpeak = `Leasing is recommended. You will be ${UTILS.formatCurrency(Math.abs(diff))} wealthier.`;
        } else {
            textToSpeak = `It's a near tie. Choose based on your lifestyle preferences.`;
        }
        speak(textToSpeak);
    }
}

// ============================================================================
// TAB MANAGEMENT
// ============================================================================

function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            if (!tabId) return;
            
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Deactivate all buttons
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            
            // Show active tab
            const activeTab = document.getElementById(tabId);
            if (activeTab) {
                activeTab.classList.add('active');
            }
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            
            // **CHART FIX:** Update chart *after* it becomes visible.
            if (tabId === 'chart') {
                setTimeout(() => updateChart(), 50); // Small delay to allow tab to render
            }
        });
    });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initTabs();
    initVoice();
    
    // Event listeners
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('voice-toggle').addEventListener('click', toggleVoice);
    document.getElementById('tts-toggle').addEventListener('click', toggleTTS);
    
    // Input listeners
    const debouncedCalc = UTILS.debounce(calculate, 300);
    document.querySelectorAll('.inputs-panel input').forEach(input => {
        input.addEventListener('input', debouncedCalc);
    });
    
    // FRED API
    fetchFREDRate();
    
    // Initial calculation
    calculate();
    
    console.log('✅ Car Lease Calculator v' + APP.VERSION + ' Ready! (Full Insight Engine)');
});

// FRED API
function fetchFREDRate() {
    const url = new URL(APP.FRED_URL);
    url.searchParams.set('series_id', APP.FRED_SERIES);
    url.searchParams.set('api_key', APP.FRED_KEY);
    url.searchsParams.set('file_type', 'json');
    url.searchParams.set('sort_order', 'desc');
    url.searchParams.set('limit', '1');
    
    fetch(url)
        .then(r => r.json())
        .then(data => {
            if (data && data.observations && data.observations.length > 0) {
                const obs = data.observations[0];
                if (obs && obs.value !== '.' && obs.value !== 'N/A') {
                    const rate = parseFloat(obs.value);
                    document.getElementById('interest-rate').value = rate.toFixed(2);
                    calculate(); // Recalculate with the new rate
                }
            } else {
                 console.warn('FRED API response malformed:', data);
            }
        })
        .catch(e => {
            console.error('FRED API fetch error. Using default rate.', e);
            calculate(); // Calculate with default rate if API fails
        });
}
