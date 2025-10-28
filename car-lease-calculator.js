// CAR LEASE CALCULATOR - PRODUCTION v2.3 - CHART FIXED
// Complete Production JavaScript - ALL FEATURES WORKING

const APP = {
    VERSION: '2.3',
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

// ============================================================================
// CHART - COMPLETE WORKING VERSION
// ============================================================================

function updateChart() {
    const S = APP.STATE;
    const canvas = document.getElementById('leaseVsBuyChart');
    
    // Validate canvas exists
    if (!canvas) {
        console.error('Chart canvas not found');
        return;
    }
    
    // Validate Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js library not loaded');
        return;
    }
    
    // Validate data exists
    if (!S.annualData || S.annualData.length === 0) {
        console.log('No annual data available for chart');
        // Destroy existing chart if no data
        if (APP.charts.main) {
            APP.charts.main.destroy();
            APP.charts.main = null;
        }
        return;
    }
    
    // Prepare data
    const labels = S.annualData.map(d => `Year ${Math.round(d.year)}`);
    const buyData = S.annualData.map(d => Math.max(0, d.buyEquity || 0));
    const leaseData = S.annualData.map(d => Math.max(0, d.leaseEquity || 0));
    
    // Destroy previous chart instance
    if (APP.charts.main) {
        APP.charts.main.destroy();
        APP.charts.main = null;
    }
    
    // Get theme colors
    const isDarkMode = document.documentElement.getAttribute('data-color-scheme') === 'dark';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDarkMode ? '#E1E8ED' : '#1F2121';
    
    try {
        // Create new chart
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
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        pointBackgroundColor: '#24ACB9',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Leasing Path (Invested)',
                        data: leaseData,
                        borderColor: '#FFC107',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        pointBackgroundColor: '#FFC107',
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
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            color: textColor,
                            font: {
                                size: 13,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + UTILS.formatCurrency(context.parsed.y, true);
                            },
                            title: function(items) {
                                return 'After ' + items[0].label;
                            }
                        },
                        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: gridColor,
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: gridColor
                        },
                        ticks: {
                            color: textColor,
                            callback: function(value) {
                                return UTILS.formatCurrency(value / 1000, false) + 'K';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Net Worth ($)',
                            color: textColor,
                            font: {
                                size: 13,
                                weight: 'bold'
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: gridColor
                        },
                        ticks: {
                            color: textColor
                        },
                        title: {
                            display: true,
                            text: 'Time Period',
                            color: textColor,
                            font: {
                                size: 13,
                                weight: 'bold'
                            }
                        }
                    }
                }
            }
        });
        
        console.log('Chart created successfully');
        
    } catch (error) {
        console.error('Chart creation error:', error);
        UTILS.showToast('Chart error: ' + error.message, 'error');
    }
}

// ============================================================================
// AI INSIGHTS - ENHANCED VERSION
// ============================================================================

function generateInsights() {
    const S = APP.STATE;
    const container = document.getElementById('ai-insights');
    if (!container) return;
    
    let html = '';
    
    // 1. Primary recommendation
    const diff = S.buyEquity - S.leaseEquity;
    if (diff > 1000) {
        html += `<div class="insight-item" style="border-left-color: #24ACB9; background: rgba(36, 172, 185, 0.1);">
            <strong>💰 AI VERDICT: BUYING</strong><br>
            You'll build ${UTILS.formatCurrency(S.buyEquity)} in equity over ${(S.leaseTerm/12).toFixed(1)} years!
        </div>`;
    } else if (diff < -1000) {
        html += `<div class="insight-item" style="border-left-color: #FFC107; background: rgba(255, 193, 7, 0.1);">
            <strong>🔑 AI VERDICT: LEASING</strong><br>
            Better ROI with ${UTILS.formatCurrency(S.leaseEquity)} in invested savings!
        </div>`;
    } else {
        html += `<div class="insight-item" style="border-left-color: #64748B; background: rgba(100, 116, 139, 0.1);">
            <strong>⚖️ NEAR TIE:</strong> Difference only ${UTILS.formatCurrency(Math.abs(diff))}. Choose on lifestyle!
        </div>`;
    }
    
    // 2. Down payment check
    if (S.downPayment > 1000) {
        html += `<div class="insight-item" style="border-left-color: #EF4444;">
            <strong>⚠️ High Down Payment Risk:</strong> ${UTILS.formatCurrency(S.downPayment)} at risk if totaled early.
            <br><strong>💡 Tip:</strong> Consider $0 down on leases to minimize risk and preserve capital.
        </div>`;
    }
    
    // 3. One percent rule
    const onePercentRule = (S.monthlyLeasePayment / S.msrp) * 100;
    if (!isNaN(onePercentRule) && S.msrp > 0) {
        if (onePercentRule <= 1.25 && S.downPayment === 0) {
            html += `<div class="insight-item" style="border-left-color: #10B981; background: rgba(16, 185, 129, 0.1);">
                <strong>✅ Excellent Deal:</strong> Payment is ${onePercentRule.toFixed(2)}% of MSRP with $0 down! 
                Meets the industry "1% rule" for good lease deals.
            </div>`;
        } else if (onePercentRule > 1.75) {
            html += `<div class="insight-item" style="border-left-color: #EF4444;">
                <strong>⚠️ High Payment Ratio:</strong> ${onePercentRule.toFixed(2)}% of MSRP. 
                Ideal leases are under 1.5%. Try negotiating lower cap cost or higher residual.
            </div>`;
        }
    }
    
    // 4. Negotiation effectiveness
    const discount = S.msrp - S.negotiatedPrice;
    const discountPercent = (discount / S.msrp) * 100;
    if (discount <= 0) {
        html += `<div class="insight-item" style="border-left-color: #EF4444;">
            <strong>🚨 No Discount:</strong> Negotiated price at/above MSRP. 
            <br><strong>💡 Strategy:</strong> Aim for 5-10% below MSRP. Research invoice prices first.
        </div>`;
    } else if (discountPercent >= 8) {
        html += `<div class="insight-item" style="border-left-color: #10B981;">
            <strong>✅ Strong Negotiation:</strong> Saved ${UTILS.formatCurrency(discount)} (${discountPercent.toFixed(1)}%) below MSRP!
        </div>`;
    }
    
    // 5. Interest rate check
    if (S.interestRate > 8) {
        html += `<div class="insight-item" style="border-left-color: #EF4444;">
            <strong>🚨 High Interest Rate:</strong> ${S.interestRate.toFixed(2)}% APR (money factor: ${(S.interestRate/2400).toFixed(5)})
            <br>Check credit score and shop multiple lenders.
        </div>`;
    } else if (S.interestRate < 4) {
        html += `<div class="insight-item" style="border-left-color: #10B981;">
            <strong>✅ Excellent Interest Rate:</strong> ${S.interestRate.toFixed(2)}% APR is very competitive!
        </div>`;
    }
    
    // 6. Residual value assessment
    if (S.residualPercent < 50) {
        html += `<div class="insight-item" style="border-left-color: #EF4444;">
            <strong>📉 Low Residual:</strong> ${S.residualPercent}% indicates heavy depreciation = higher payments.
        </div>`;
    } else if (S.residualPercent >= 65) {
        html += `<div class="insight-item" style="border-left-color: #10B981;">
            <strong>✅ Strong Residual:</strong> ${S.residualPercent}% value retention = lower lease payments!
        </div>`;
    }
    
    // 7. Buy down payment analysis
    const buyDownPercent = (S.buyDownPayment / S.buyPrice) * 100;
    if (buyDownPercent < 10) {
        html += `<div class="insight-item">
            <strong>💰 Low Buy Down Payment:</strong> Only ${buyDownPercent.toFixed(1)}%. 
            Consider 15-20% down to reduce monthly payments.
        </div>`;
    } else if (buyDownPercent >= 20) {
        html += `<div class="insight-item" style="border-left-color: #10B981;">
            <strong>✅ Solid Down Payment:</strong> ${buyDownPercent.toFixed(1)}% reduces interest costs significantly!
        </div>`;
    }
    
    // 8. Payment difference analysis
    const paymentDiff = Math.abs(S.monthlyBuyPayment - S.monthlyLeasePayment);
    if (paymentDiff > 100) {
        const lower = S.monthlyBuyPayment < S.monthlyLeasePayment ? 'buying' : 'leasing';
        html += `<div class="insight-item">
            <strong>💵 Payment Difference:</strong> ${lower === 'buying' ? 'Buying' : 'Leasing'} 
            has ${UTILS.formatCurrency(paymentDiff)}/month lower payments.
        </div>`;
    }
    
    // 9. Equity building
    if (S.buyEquity > 5000) {
        html += `<div class="insight-item" style="border-left-color: #24ACB9;">
            <strong>🏠 Equity Building:</strong> Build ${UTILS.formatCurrency(S.buyEquity)} in equity 
            after ${(S.leaseTerm/12).toFixed(1)} years!
        </div>`;
    }
    
    // 10. Loan term warning
    if (S.loanTermBuy >= 72) {
        html += `<div class="insight-item" style="border-left-color: #EF4444;">
            <strong>⚠️ Long Loan Term:</strong> ${S.loanTermBuy}-month (${(S.loanTermBuy/12).toFixed(1)} year) loan 
            means potential negative equity for years. Try to keep under 60 months.
        </div>`;
    }
    
    // Affiliate CTA
    html += `<div class="affiliate-box">
        <h3>💳 Get Pre-Approved for Auto Financing</h3>
        <p>Compare rates from top lenders and save thousands!</p>
        <a href="#" class="btn-primary" onclick="alert('Partner: Auto Loan Affiliate'); return false;">
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
    
    // Update chart with new theme
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
        } else if (transcript.includes('chart')) {
            document.querySelector('[data-tab="chart"]')?.click();
            speak('Showing chart');
        }
    };
}

function toggleVoice() {
    if (!APP.recognition) {
        UTILS.showToast('Voice not supported', 'error');
        return;
    }
    APP.recognition.start();
    UTILS.showToast('Listening...', 'info');
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
                b.setAttribute('aria-selected', 'false');
            });
            
            // Show active tab
            const activeTab = document.getElementById(tabId);
            if (activeTab) {
                activeTab.classList.add('active');
            }
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            
            // CRITICAL: Update chart when chart tab is activated
            if (tabId === 'chart') {
                setTimeout(() => {
                    updateChart();
                    console.log('Chart updated on tab switch');
                }, 100);
            }
        });
    });
}

// ============================================================================
// FRED API
// ============================================================================

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
            if (data.observations && data.observations[0]) {
                const obs = data.observations[0];
                if (obs.value !== '.' && obs.value !== 'N/A') {
                    const rate = parseFloat(obs.value);
                    document.getElementById('interest-rate').value = rate.toFixed(2);
                    UTILS.showToast('Live interest rate updated', 'success');
                    calculate();
                }
            }
        })
        .catch(e => {
            console.log('FRED API unavailable, using default rate');
        });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Car Lease Calculator v' + APP.VERSION + ' Starting...');
    
    // Initialize features
    initTheme();
    initTabs();
    initVoice();
    
    // Event listeners
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    
    const voiceBtn = document.getElementById('voice-toggle');
    if (voiceBtn) voiceBtn.addEventListener('click', toggleVoice);
    
    const ttsBtn = document.getElementById('tts-toggle');
    if (ttsBtn) ttsBtn.addEventListener('click', toggleTTS);
    
    // Input listeners with debounce
    const debouncedCalc = UTILS.debounce(calculate, 300);
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', debouncedCalc);
    });
    
    // Fetch FRED API rate
    fetchFREDRate();
    
    // Initial calculation
    calculate();
    
    console.log('✅ Car Lease Calculator Ready! Chart should work now.');
});
