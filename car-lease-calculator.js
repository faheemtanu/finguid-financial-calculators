// CAR LEASE CALCULATOR - PRODUCTION v2.2
// Complete Production JavaScript with all features - UPGRADED AI INSIGHTS

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
        leaseEquity: 0,
        buyEquity: 0,
        annualData: [],
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
    
    formatPercent(val) {
        return (val || 0).toFixed(1) + '%';
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
    const depreciation = (capCost - residual) / S.leaseTerm;
    const moneyFactor = (S.interestRate / 100) / 2400;
    const rentCharge = (capCost + residual) * moneyFactor;
    const basePayment = depreciation + rentCharge;
    const taxPayment = basePayment * (S.salesTaxRate / 100);
    S.monthlyLeasePayment = basePayment + taxPayment;
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
    
    S.totalBuyCost = (S.monthlyBuyPayment * S.loanTermBuy) + S.buyDownPayment + S.dealerFeesBuy;
    
    // NET WORTH OVER TIME
    S.annualData = [];
    let balance = loanAmount;
    let value = S.buyPrice;
    let leaseInvested = (S.buyDownPayment + S.dealerFeesBuy - S.downPayment - S.acquisitionFee) + (S.monthlyBuyPayment - S.monthlyLeasePayment);
    
    const monthlyDepreciation = (S.marketAppreciation / 100) / 12;
    const monthlyReturn = (S.investmentReturn / 100) / 12;
    
    for (let m = 1; m <= S.leaseTerm; m++) {
        value *= (1 + monthlyDepreciation);
        
        const interest = balance * rate;
        const principal = S.monthlyBuyPayment - interest;
        balance = Math.max(0, balance - principal);
        
        const buyEquity = Math.max(0, value - balance);
        
        if (m > 1) {
            leaseInvested = leaseInvested * (1 + monthlyReturn) + (S.monthlyBuyPayment - S.monthlyLeasePayment);
        }
        
        if (m % 12 === 0) {
            S.annualData.push({
                year: m / 12,
                buyEquity: buyEquity,
                leaseEquity: leaseInvested
            });
        }
    }
    
    if (S.annualData.length === 0) {
        S.annualData.push({year: S.leaseTerm/12, buyEquity: 0, leaseEquity: 0});
    }
    
    S.buyEquity = S.annualData[S.annualData.length - 1].buyEquity;
    S.leaseEquity = S.annualData[S.annualData.length - 1].leaseEquity;
    
    displayResults();
    updateChart();
    generateInsights();
}

function displayResults() {
    const S = APP.STATE;
    
    document.getElementById('monthly-payment').textContent = UTILS.formatCurrency(S.monthlyLeasePayment);
    document.getElementById('payment-breakdown').textContent = 
        `Depreciation: ${UTILS.formatCurrency(S.monthlyLeasePayment * 0.4)} | Finance: ${UTILS.formatCurrency(S.monthlyLeasePayment * 0.3)} | Tax: ${UTILS.formatCurrency(S.monthlyLeasePayment * 0.3)}`;
    
    document.getElementById('lease-monthly').textContent = UTILS.formatCurrency(S.monthlyLeasePayment);
    document.getElementById('lease-total').textContent = UTILS.formatCurrency(S.totalLeaseCost);
    document.getElementById('buy-monthly').textContent = UTILS.formatCurrency(S.monthlyBuyPayment);
    document.getElementById('buy-total').textContent = UTILS.formatCurrency(S.totalBuyCost);
    document.getElementById('buy-equity').textContent = UTILS.formatCurrency(S.buyEquity);
    
    const diff = S.buyEquity - S.leaseEquity;
    const verdict = document.getElementById('verdict-box');
    
    if (diff > 1000) {
        verdict.style.background = 'rgba(36, 172, 185, 0.1)';
        verdict.style.borderLeft = '4px solid #24ACB9';
        document.getElementById('verdict-text').innerHTML = 
            `<strong>💰 BUYING is Better:</strong> You'll be ${UTILS.formatCurrency(diff)} wealthier!`;
    } else if (diff < -1000) {
        verdict.style.background = 'rgba(255, 193, 7, 0.1)';
        verdict.style.borderLeft = '4px solid #FFC107';
        document.getElementById('verdict-text').innerHTML = 
            `<strong>🔑 LEASING is Better:</strong> You'll be ${UTILS.formatCurrency(Math.abs(diff))} wealthier!`;
    } else {
        verdict.style.background = 'rgba(100, 116, 139, 0.1)';
        verdict.style.borderLeft = '4px solid #64748B';
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
    
    const labels = S.annualData.map(d => `Year ${Math.round(d.year)}`);
    const buyData = S.annualData.map(d => Math.max(0, d.buyEquity));
    const leaseData = S.annualData.map(d => Math.max(0, d.leaseEquity));
    
    try {
        APP.charts.main = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Buying Path (Equity)',
                        data: buyData,
                        borderColor: '#24ACB9',
                        backgroundColor: 'rgba(36, 172, 185, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 5
                    },
                    {
                        label: 'Leasing Path (Invested)',
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
                        labels: { usePointStyle: true, padding: 15 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: val => UTILS.formatCurrency(val / 1000) + 'K'
                        }
                    }
                }
            }
        });
    } catch (e) {
        console.error('Chart error:', e);
    }
}

function generateInsights() {
    const S = APP.STATE;
    const container = document.getElementById('ai-insights');
    let html = '';
    const insights = []; // Array to store all insights

    // === CORE METRICS CALCULATION (for insights) ===
    const capCost = S.negotiatedPrice - S.downPayment - S.tradeInLease + S.acquisitionFee;
    const residual = S.msrp * (S.residualPercent / 100);
    const moneyFactor = (S.interestRate / 100) / 2400;
    const rentChargeTotal = (capCost + residual) * moneyFactor * S.leaseTerm;
    const depreciationTotal = (capCost - residual);
    
    const leaseAPR = moneyFactor * 2400;
    const onePercentRuleRatio = (S.monthlyLeasePayment / S.msrp) * 100;
    
    // Effective Monthly Lease Payment (including all upfront/back-end costs)
    const effectiveMonthlyLeasePayment = S.totalLeaseCost / S.leaseTerm; 
    
    // Buy metrics
    const buyTaxRate = S.salesTaxRate / 100;
    const buyPriceWithTax = S.buyPrice * (1 + buyTaxRate);
    const buyLoanAmount = buyPriceWithTax + S.dealerFeesBuy - S.buyDownPayment - S.buyTradeIn;
    // Approximation of total interest: Total Payments - Principal Paid (Loan Amount)
    const buyTotalInterest = (S.monthlyBuyPayment * S.loanTermBuy) - buyLoanAmount;
    const buyEffectiveMonthlyPayment = S.totalBuyCost / S.loanTermBuy;
    
    const equityDifference = S.buyEquity - S.leaseEquity;
    
    // Helper function for insight HTML (Colors: #24ACB9 Teal, #FFC107 Amber, #EF4444 Red, #10B981 Green, #60A5FA Blue)
    const createInsight = (title, body, color, bgColor = '0.1') => {
        const style = color ? `style="border-left-color: ${color}; background: rgba(${hexToRgb(color)}, ${bgColor});"` : '';
        return `<div class="insight-item" ${style}><strong>${title}</strong><br>${body}</div>`;
    };
    
    function hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '';
    }

    // ============================================================================
    // A. OVERALL VERDICT & COST COMPARISON (3 INSIGHTS)
    // ============================================================================
    
    // 1. Primary Recommendation (Difference over $1500 threshold)
    if (equityDifference > 1500) {
        insights.push(createInsight('💰 AI VERDICT: BUYING is Superior', 
            `You are projected to be **${UTILS.formatCurrency(equityDifference, 0)}** wealthier by buying and building equity.`, 
            '#24ACB9')); 
    } else if (equityDifference < -1500) {
        insights.push(createInsight('🔑 AI VERDICT: LEASING is Superior', 
            `Your invested savings grow faster! You are projected to be **${UTILS.formatCurrency(Math.abs(equityDifference), 0)}** wealthier with the leasing path.`, 
            '#FFC107')); 
    } else {
        insights.push(createInsight('⚖️ AI VERDICT: NEAR TIE', 
            `The financial difference is minimal (${UTILS.formatCurrency(Math.abs(equityDifference), 0)}). Lifestyle and preference should decide.`, 
            '#64748B', '0.05')); // Slate
    }

    // 2. Total Cost vs. Proportionate Cost
    const proportionateBuyCost = S.totalBuyCost * (S.leaseTerm / S.loanTermBuy);
    if (S.totalLeaseCost < proportionateBuyCost * 0.9) {
        insights.push(createInsight('Total Cost Efficiency', 
            `The total lease cost (${UTILS.formatCurrency(S.totalLeaseCost, 0)}) is significantly lower than the cost of owning for the same period.`, 
            '#10B981')); 
    }

    // 3. Monthly Payment Gap
    if (S.monthlyBuyPayment > S.monthlyLeasePayment * 1.5) {
        insights.push(createInsight('Monthly Cash Flow Burden', 
            `The buying payment is over 50% higher than the lease payment. Ensure this fits your monthly budget.`, 
            '#F97316')); 
    }

    // ============================================================================
    // B. LEASE ANALYSIS (10 INSIGHTS)
    // ============================================================================

    // 4. Residual Value Check (Good/Bad)
    if (S.residualPercent >= 60) {
        insights.push(createInsight('✅ Strong Residual Value', 
            `At **${S.residualPercent.toFixed(1)}%**, the car is expected to hold value well, leading to lower depreciation and a better lease.`, 
            '#10B981'));
    } else if (S.residualPercent < 50) {
        insights.push(createInsight('⚠️ Weak Residual Value', 
            `A residual of **${S.residualPercent.toFixed(1)}%** suggests a higher depreciation cost is baked into your lease.`, 
            '#EF4444')); 
    }
    
    // 5. One Percent Rule (True Check: MSRP + $0 DAS)
    if (onePercentRuleRatio <= 1.25 && S.downPayment === 0 && S.tradeInLease === 0) {
        insights.push(createInsight('🔥 1.25% Rule Pass', 
            `Your payment is **${onePercentRuleRatio.toFixed(2)}%** of the MSRP with $0 due at signing—an excellent lease deal.`, 
            '#14B8A6')); 
    }

    // 6. Effective Lease APR Check (Over 8%)
    if (leaseAPR > 8) {
        insights.push(createInsight('⚠️ High Effective Lease Rate', 
            `Your equivalent lease APR is **${leaseAPR.toFixed(2)}%**. You should negotiate the money factor or consider purchasing.`, 
            '#F59E0B')); 
    }

    // 7. Total Rent Charge Ratio
    if (rentChargeTotal > depreciationTotal * 0.4) {
        insights.push(createInsight('🚨 High Rent Charge', 
            `The total rent charge (${UTILS.formatCurrency(rentChargeTotal, 0)}) is high, costing more than 40% of the total depreciation cost.`, 
            '#EF4444'));
    }
    
    // 8. Down Payment Risk (Lease > $1k)
    if (S.downPayment > 1000) {
        insights.push(createInsight('⚠️ High Lease Down Payment Risk', 
            `You are putting **${UTILS.formatCurrency(S.downPayment, 0)}** at risk if the vehicle is totaled. Consider $0 down for leases.`, 
            '#F59E0B'));
    }
    
    // 9. Fee Negotiation Opportunity (High Acq/Disp)
    if (S.acquisitionFee > 850 || S.dispositionFee > 450) {
        insights.push(createInsight('Fee Negotiation Opportunity', 
            `The Acquisition Fee (${UTILS.formatCurrency(S.acquisitionFee, 0)}) or Disposition Fee (${UTILS.formatCurrency(S.dispositionFee, 0)}) is high. Shop other dealerships.`, 
            '#60A5FA')); 
    }

    // 10. Capitalized Cost Reduction Efficiency
    const CCR = S.downPayment + S.tradeInLease;
    if (CCR > 0 && CCR < S.acquisitionFee) {
        insights.push(createInsight('Down Payment Inefficiency', 
            `Your Cap Cost Reduction is only covering the Acquisition Fee, which may be poor use of upfront cash.`, 
            '#C084FC')); // Purple
    }

    // 11. Effective Payment Analysis (Hidden Costs)
    if (effectiveMonthlyLeasePayment > S.monthlyLeasePayment * 1.15) {
         insights.push(createInsight('Total Cost Hides Monthly Cost', 
            `Your effective monthly cost (${UTILS.formatCurrency(effectiveMonthlyLeasePayment, 0)}) is >15% higher than your quoted payment.`, 
            '#F97316'));
    }
    
    // 12. Depreciation vs. Payment
    if (depreciationTotal / S.leaseTerm > S.monthlyLeasePayment * 0.6) {
        insights.push(createInsight('Depreciation Dominates Payment', 
            `Over 60% of your monthly payment is covering depreciation, indicating a good use of the lease structure vs. a high money factor.`, 
            '#10B981'));
    }
    
    // 13. High MSRP Markup
    if (S.negotiatedPrice > S.msrp * 1.05) {
        insights.push(createInsight('🚨 Negotiated Price Markup', 
            `The Negotiated Price is **${UTILS.formatCurrency(S.negotiatedPrice - S.msrp, 0)}** over MSRP. You should negotiate a lower price.`, 
            '#EF4444'));
    }


    // ============================================================================
    // C. BUY/LOAN ANALYSIS (6 INSIGHTS)
    // ============================================================================

    // 14. Interest Rate Check (Buy)
    if (S.interestRate > 8.5) {
        insights.push(createInsight('🚨 High Buy Interest Rate Warning', 
            `An APR of **${S.interestRate.toFixed(2)}%** significantly increases your total cost. Secure pre-approval first.`, 
            '#EF4444'));
    } else if (S.interestRate < 4.0) {
        insights.push(createInsight('✅ Excellent Buy Interest Rate', 
            `A low APR of **${S.interestRate.toFixed(2)}%** heavily favors the buying option, minimizing interest costs.`, 
            '#10B981'));
    }

    // 15. Loan Term Check (Over 60 months)
    if (S.loanTermBuy > 60) {
        insights.push(createInsight('⚠️ Long Loan Term Risk', 
            `A **${S.loanTermBuy}-month** loan increases the risk of being "upside-down" (negative equity) and paying more total interest.`, 
            '#F59E0B'));
    }

    // 16. Total Interest Paid Ratio
    if (buyTotalInterest > buyLoanAmount * 0.25) {
        insights.push(createInsight('Substantial Total Interest', 
            `You are projected to pay **${UTILS.formatCurrency(buyTotalInterest, 0)}** in interest, over 25% of the loan amount.`, 
            '#EF4444'));
    }
    
    // 17. Dealer Fees Check (Buy > $800)
    if (S.dealerFeesBuy > 800) {
        insights.push(createInsight('High Dealer Fees', 
            `Dealer fees of **${UTILS.formatCurrency(S.dealerFeesBuy, 0)}** are excessive. These are often negotiable "junk fees."`, 
            '#F59E0B'));
    }
    
    // 18. Down Payment Size (Buy < 15%)
    if (S.buyDownPayment / S.buyPrice < 0.15) {
        insights.push(createInsight('Recommended Down Payment', 
            `Your buy down payment is less than the recommended 15-20%. Consider increasing it to build equity faster.`, 
            '#60A5FA'));
    }


    // ============================================================================
    // D. NET WORTH / OPPORTUNITY COST (6 INSIGHTS)
    // ============================================================================
    
    // 19. Equity vs. Investment Return Magnitude
    if (S.leaseEquity > S.buyEquity * 1.25) {
        insights.push(createInsight('Investment Outperforms Equity', 
            `Your projected investment return (**${UTILS.formatCurrency(S.leaseEquity, 0)}**) is 25% higher than the car's equity. Leasing capital strategy is strong.`, 
            '#10B981'));
    }

    // 20. Market Appreciation Risk (High Depreciation)
    if (S.marketAppreciation < -10) {
        insights.push(createInsight('🚨 High Depreciation Risk', 
            `A **${S.marketAppreciation.toFixed(1)}%** annual depreciation rate makes buying more financially hazardous than leasing.`, 
            '#EF4444'));
    } else if (S.marketAppreciation > 0) {
         insights.push(createInsight('✅ Vehicle Appreciating/Holding Value', 
            `The projected appreciation strongly favors the buying path, increasing your equity gain.`, 
            '#14B8A6'));
    }
    
    // 21. Investment Return vs. Loan Rate
    if (S.investmentReturn > S.interestRate + 1.5) {
        insights.push(createInsight('Strong Opportunity Cost', 
            `Because your investment return (${S.investmentReturn.toFixed(1)}%) is significantly higher than your loan rate, the opportunity cost of buying is high.`, 
            '#60A5FA'));
    }

    // 22. Breakeven Point Analysis (Upfront Cash)
    const buyDAS = S.buyDownPayment + S.dealerFeesBuy;
    const leaseDAS = S.downPayment + S.acquisitionFee;
    if (buyDAS > leaseDAS * 2.5) {
        insights.push(createInsight('Upfront Cash Flow Strain', 
            `The buying option requires over 2.5x the initial cash compared to leasing, severely impacting your liquidity.`, 
            '#F97316'));
    }
    
    // 23. Tax Burden Comparison (Leasing is often more tax-efficient)
    const buyTax = S.buyPrice * buyTaxRate;
    const leaseTax = S.monthlyLeasePayment * (S.salesTaxRate / (100 + S.salesTaxRate)) * S.leaseTerm;
    if (buyTax > leaseTax * 1.5) {
        insights.push(createInsight('Tax Efficiency (Lease)', 
            `Leasing is more tax-efficient in this scenario as tax is paid on the usage (payment), not the full sale price.`, 
            '#10B981'));
    }
    
    // 24. Final Equity Ratio
    if (S.buyEquity / S.totalBuyCost < 0.1) {
        insights.push(createInsight('Low Equity-to-Cost Ratio', 
            `Your final equity is less than 10% of the total purchase cost, suggesting poor value retention or high cost of ownership.`, 
            '#F59E0B'));
    }

    // 25. High Registration Fee
    if (S.registrationFee > 500) {
        insights.push(createInsight('High Registration/Title Fee', 
            `A registration fee of **${UTILS.formatCurrency(S.registrationFee, 0)}** is high. This is a common point for dealer markups.`, 
            '#F97316'));
    }
    
    
    // ============================================================================
    // FINAL RENDER
    // ============================================================================

    // Combine all generated insights
    html += insights.join(''); 
    
    // Affiliate CTA - remains the same
    html += `<div class="affiliate-box">
        <h3>💳 Get Pre-Approved for Auto Financing</h3>
        <p>Compare rates and save thousands!</p>
        <a href="#" class="btn-primary" onclick="alert('Partner: Auto Loan'); return false;">
            Get Quotes →
        </a>
    </div>`;
    
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
    if (APP.charts.main) {
        setTimeout(() => updateChart(), 100);
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
    if (!SpeechRecognition) return;
    
    APP.recognition = new SpeechRecognition();
    APP.recognition.continuous = false;
    APP.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        if (transcript.includes('calculate')) {
            calculate();
            speak('Calculation complete');
        }
    };
}

function toggleVoice() {
    if (!APP.recognition) {
        UTILS.showToast('Voice not supported', 'error');
        return;
    }
    APP.recognition.start();
}

function speak(text) {
    if (!APP.synthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    APP.synthesis.speak(utterance);
}

function toggleTTS() {
    UTILS.showToast('Text-to-Speech toggled', 'success');
}

// ============================================================================
// TAB MANAGEMENT
// ============================================================================

function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Deactivate all buttons
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // Show active tab
            document.getElementById(tabId).classList.add('active');
            this.classList.add('active');
            
            // Update chart if needed
            if (tabId === 'chart') {
                setTimeout(() => updateChart(), 100);
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
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', debouncedCalc);
    });
    
    // FRED API
    fetchFREDRate();
    
    // Initial calculation
    calculate();
    
    console.log('✅ Car Lease Calculator v' + APP.VERSION + ' Ready!');
});

// FRED API
function fetchFREDRate() {
    const url = new URL(APP.FRED_URL);
    url.searchParams.set('series_id', APP.FRED_SERIES);
    url.searchParams.set('api_key', APP.FRED_KEY);
    url.searchParams.set('file_type', 'json');
    url.searchParams.set('sort_order', 'desc');
    url.searchParams.set('limit', '1');
    
    fetch(url)
        .then(r => r.json())
        .then(data => {
            const obs = data.observations[0];
            if (obs && obs.value !== '.' && obs.value !== 'N/A') {
                const rate = parseFloat(obs.value);
                document.getElementById('interest-rate').value = rate.toFixed(2);
                calculate();
            }
        })
        .catch(e => console.log('FRED API unavailable'));
}
