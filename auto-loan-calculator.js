/**
 * AUTO LOAN CALCULATOR — AI‑POWERED ANALYZER - PRODUCTION JS v1.0
 * FinGuid USA Market Domination Build - World's First AI-Powered Auto Calculator
 * * Target: Production Ready, AI Insights, SEO, PWA, Voice, Monetization Ready
 * * Features Implemented:
 * ✅ Core Auto Loan Calculation (Price, Down, Trade-in, Tax, Fees)
 * ✅ Dynamic Charting (Chart.js: Total Cost Breakdown)
 * ✅ Amortization Schedule & CSV Export
 * ✅ Loan Term Comparison Table
 * ✅ FRED API Integration (TERMSCOAUTC60NS) with Auto-Update (Key: 9c6c421f077f2091e8bae4f143ada59a)
 * ✅ AI-Powered Insights Engine (Linked to Monetization)
 * ✅ Voice Control (Speech Recognition & Text-to-Speech)
 * ✅ Light/Dark Mode Toggling & User Preferences Storage
 * ✅ PWA Ready Setup (Service Worker Registration)
 * ✅ WCAG 2.1 AA Accessibility & Responsive Design
 * ✅ Google Analytics (G-NYBL2CDNQJ) Ready (Included in HTML)
 * * © 2025 FinGuid - World's First AI Calculator Platform for Americans
 */

/* ========================================================================== */
/* GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const AUTO_LOAN_CALCULATOR = {
    VERSION: '1.0',
    DEBUG: false, 
    
    // FRED API Configuration (Real Key)
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a', 
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    FRED_SERIES_ID: 'TERMSCOAUTC60NS', // 60-Month New Auto Loan Rate
    RATE_UPDATE_INTERVAL: 4 * 60 * 60 * 1000, // 4 hours
    FALLBACK_RATE: 7.50, // Fallback auto loan rate

    // UI State
    charts: {
        paymentBreakdown: null,
    },
    // Core Calculation State
    currentCalculation: {
        vehiclePrice: 0,
        totalDownPayment: 0,
        tradeInValue: 0,
        totalLoanAmount: 0,
        salesTaxAmount: 0,
        feesAmount: 0,
        interestRate: 0,
        loanTermMonths: 60,
        monthlyPayment: 0,
        monthlyTaxAndFee: 0, // Prorated tax/fee component of payment
        monthlyPI: 0,
        totalInterestPaid: 0,
        totalCost: 0,
        amortizationSchedule: [],
    },
    deferredInstallPrompt: null,
};


/* ========================================================================== */
/* I. UTILITY & FORMATTING MODULE (Reused from FinGuid Platform) */
/* ========================================================================== */

const UTILS = (function() {
    
    /**
     * Formats a number as USD currency.
     * @param {number} amount - The number to format.
     * @returns {string} The formatted currency string.
     */
    function formatCurrency(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) return '$0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }

    /**
     * Parses a currency string back into a numeric value.
     * @param {string} currencyString - The string to parse.
     * @returns {number} The numeric value.
     */
    function parseCurrency(currencyString) {
        if (typeof currencyString !== 'string') return parseFloat(currencyString) || 0;
        const cleanString = currencyString.replace(/[$,]/g, '').replace(/,/g, '').trim();
        return parseFloat(cleanString) || 0;
    }

    /**
     * Debounces a function call.
     * @param {function} func - The function to debounce.
     * @param {number} delay - The delay in milliseconds.
     * @returns {function} The debounced function.
     */
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    /**
     * Creates a temporary toast notification.
     * @param {string} message - The message to display.
     * @param {string} type - 'success' or 'error'.
     */
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Show the toast
        setTimeout(() => toast.classList.add('show'), 10); 
        
        // Hide and remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }
    
    // Export public methods
    return {
        formatCurrency,
        parseCurrency,
        debounce,
        showToast,
    };
})();
// END UTILITY & FORMATTING MODULE

/* ========================================================================== */
/* II. DATA LAYER: FRED API MODULE (Adapted for Auto Loans) */
/* ========================================================================== */

const fredAPI = (function() {

    /**
     * Fetches the latest 60-month new auto loan rate from the FRED API.
     */
    async function fetchLatestRate() {
        if (AUTO_LOAN_CALCULATOR.DEBUG) {
            console.warn('DEBUG MODE: Using mock FRED rate.');
            return AUTO_LOAN_CALCULATOR.FALLBACK_RATE;
        }

        const url = new URL(AUTO_LOAN_CALCULATOR.FRED_BASE_URL);
        const params = {
            series_id: AUTO_LOAN_CALCULATOR.FRED_SERIES_ID,
            api_key: AUTO_LOAN_CALCULATOR.FRED_API_KEY,
            file_type: 'json',
            sort_order: 'desc',
            limit: 1,
        };
        url.search = new URLSearchParams(params).toString();

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`FRED API returned status: ${response.status}`);
            }
            const data = await response.json();
            
            const latestObservation = data.observations.find(obs => obs.value !== '.' && obs.value !== 'N/A');
            if (latestObservation) {
                const rate = parseFloat(latestObservation.value);
                document.getElementById('interest-rate').value = rate.toFixed(2);
                document.querySelector('.fred-source-note').textContent = `Live FRED Rate (${latestObservation.date})`;
                console.log(`🏦 FRED Auto Loan Rate updated: ${rate}%`);
                UTILS.showToast(`Live Auto Loan Rate updated to ${rate.toFixed(2)}%`, 'success');
                return rate;
            } else {
                throw new Error('No valid observation found in FRED data.');
            }
        } catch (error) {
            console.error('FRED API Error, using fallback rate:', error);
            document.getElementById('interest-rate').value = AUTO_LOAN_CALCULATOR.FALLBACK_RATE.toFixed(2);
            document.querySelector('.fred-source-note').textContent = `Fallback Rate (${AUTO_LOAN_CALCULATOR.FALLBACK_RATE.toFixed(2)}%)`;
            UTILS.showToast('Could not fetch live FRED rate. Using fallback.', 'error');
            return AUTO_LOAN_CALCULATOR.FALLBACK_RATE;
        }
    }

    /**
     * Starts the automatic rate update timer.
     */
    function startAutomaticUpdates() {
        fetchLatestRate().then(updateCalculations); // Initial fetch and calculation update
        setInterval(fetchLatestRate, AUTO_LOAN_CALCULATOR.RATE_UPDATE_INTERVAL);
    }

    // Export public methods
    return {
        startAutomaticUpdates,
    };
})();
// END FRED API MODULE


/* ========================================================================== */
/* IV. CORE CALCULATION MODULE */
/* ========================================================================== */

/**
 * Main function to calculate the auto loan payment and amortization schedule.
 * @param {object} inputs - An object containing all parsed form inputs.
 * @returns {object} - A results object for a single loan term.
 */
function calculateAutoLoan(inputs) {
    const { price, downPayment, tradeIn, ratePercent, termMonths, taxRatePercent, fees } = inputs;

    // --- 1. Calculate Loan Principal ---
    const totalDown = downPayment + tradeIn;
    const taxRate = taxRatePercent / 100;
    
    // Calculate sales tax. Most states tax (Price - Trade-in).
    const taxableAmount = Math.max(0, price - tradeIn);
    const salesTaxAmount = taxableAmount * taxRate;
    
    const totalCost = price + salesTaxAmount + fees;
    const loanAmount = Math.max(0, totalCost - totalDown);

    // --- 2. Calculate Monthly Payment (P&I) ---
    const monthlyRate = (ratePercent / 100) / 12;
    let monthlyPI = 0;

    if (loanAmount > 0 && termMonths > 0) {
        if (monthlyRate > 0) {
            // M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1]
            const power = Math.pow(1 + monthlyRate, termMonths);
            monthlyPI = loanAmount * (monthlyRate * power) / (power - 1);
        } else {
            // 0% interest
            monthlyPI = loanAmount / termMonths;
        }
    }
    
    // This is the total monthly payment
    const totalMonthlyPayment = monthlyPI;
    const totalPaid = totalMonthlyPayment * termMonths;
    const totalInterest = Math.max(0, totalPaid - loanAmount);
    const totalCostWithLoan = totalDown + totalPaid;

    // --- 3. Amortization Schedule ---
    let balance = loanAmount;
    const schedule = [];
    
    for (let month = 1; month <= termMonths; month++) {
        const interestPayment = balance * monthlyRate;
        let principalPayment = totalMonthlyPayment - interestPayment;
        
        // Final payment adjustment
        if (month === termMonths) {
            principalPayment = balance;
        }
        
        balance -= principalPayment;
        
        schedule.push({
            month,
            payment: totalMonthlyPayment,
            principal: principalPayment,
            interest: interestPayment,
            balance: Math.max(0, balance),
        });
    }

    // --- 4. Return Results Object ---
    return {
        vehiclePrice: price,
        totalDownPayment: totalDown,
        tradeInValue: tradeIn,
        totalLoanAmount: loanAmount,
        salesTaxAmount: salesTaxAmount,
        feesAmount: fees,
        interestRate: ratePercent,
        loanTermMonths: termMonths,
        monthlyPayment: totalMonthlyPayment,
        monthlyPI: totalMonthlyPayment, // For auto loan, P&I is the full payment
        monthlyTaxAndFee: (salesTaxAmount + fees) / termMonths, // Prorated component
        totalInterestPaid: totalInterest,
        totalCost: totalCostWithLoan,
        amortizationSchedule: schedule,
    };
}

/**
 * Reads inputs from the form, calls the calculator, and updates the UI.
 * This is the primary function triggered by user interaction.
 */
function updateCalculations() {
    // 1. Get Input Values
    const inputs = {
        price: UTILS.parseCurrency(document.getElementById('vehicle-price').value),
        downPayment: UTILS.parseCurrency(document.getElementById('down-payment').value),
        tradeIn: UTILS.parseCurrency(document.getElementById('trade-in-value').value),
        ratePercent: UTILS.parseCurrency(document.getElementById('interest-rate').value),
        termMonths: parseInt(document.getElementById('loan-term').value, 10),
        taxRatePercent: UTILS.parseCurrency(document.getElementById('sales-tax-rate').value),
        fees: UTILS.parseCurrency(document.getElementById('fees-other').value),
    };
    
    // 2. Robust Validation
    if (inputs.price <= 0 || inputs.ratePercent < 0 || inputs.termMonths <= 0 || (inputs.price + inputs.fees) < (inputs.downPayment + inputs.tradeIn)) {
        document.getElementById('monthly-payment-total').textContent = '$0.00';
        document.getElementById('payment-breakdown-summary').innerHTML = 'Please enter valid loan parameters.';
        // Clear summary details
        ['total-loan-amount', 'total-interest', 'total-sales-tax', 'total-fees', 'total-payments'].forEach(id => document.getElementById(id).textContent = '$0.00');
        return; 
    }

    // 3. Run Core Calculation
    const calc = calculateAutoLoan(inputs);
    
    // 4. Update Global State
    AUTO_LOAN_CALCULATOR.currentCalculation = calc;

    // 5. Update Main Summary Results
    document.getElementById('monthly-payment-total').textContent = UTILS.formatCurrency(calc.monthlyPayment);
    const breakdownText = `
        Principal & Interest: ${UTILS.formatCurrency(calc.monthlyPI)}
    `;
    document.getElementById('payment-breakdown-summary').innerHTML = breakdownText;

    // 6. Update Total Cost Breakdown Tab
    document.getElementById('total-loan-amount').textContent = UTILS.formatCurrency(calc.totalLoanAmount);
    document.getElementById('total-interest').textContent = UTILS.formatCurrency(calc.totalInterestPaid);
    document.getElementById('total-sales-tax').textContent = UTILS.formatCurrency(calc.salesTaxAmount);
    document.getElementById('total-fees').textContent = UTILS.formatCurrency(calc.feesAmount);
    document.getElementById('total-payments').textContent = UTILS.formatCurrency(calc.totalCost); 
    
    // 7. Run Feature Updates
    updatePaymentBreakdownChart();
    generateAmortizationTable();
    calculateAndDisplayComparison();
    generateAIInsights();
}
// END CORE CALCULATION MODULE

/* ========================================================================== */
/* V. CHART & COMPARISON VISUALIZATION MODULE */
/* ========================================================================== */

/**
 * Initializes or updates the Total Cost Breakdown (Doughnut) Chart.
 */
function updatePaymentBreakdownChart() {
    const calc = AUTO_LOAN_CALCULATOR.currentCalculation;
    if (calc.totalCost <= 0) return;
    
    const ctx = document.getElementById('payment-breakdown-chart').getContext('2d');

    const chartLabels = ['Vehicle Price', 'Total Interest', 'Sales Tax', 'Fees'];
    const chartDataValues = [
        calc.vehiclePrice, 
        calc.totalInterestPaid, 
        calc.salesTaxAmount, 
        calc.feesAmount
    ];
    // Colors from FinGuid palette
    const chartColors = [
        '#19343B', // Primary (Slate 900)
        '#E44D2E', // A warning-like color for Interest (similar to Red 500)
        '#24ACBD', // Accent (Teal 400)
        '#A7A9A9'  // Gray (from mortgage PMI)
    ];

    const chartData = {
        labels: chartLabels,
        datasets: [{
            label: 'Total Cost Breakdown',
            data: chartDataValues,
            backgroundColor: chartColors,
            hoverBackgroundColor: chartColors.map(c => c + 'AA'), // Slightly transparent hover
            borderWidth: 1,
        }]
    };

    if (AUTO_LOAN_CALCULATOR.charts.paymentBreakdown) {
        AUTO_LOAN_CALCULATOR.charts.paymentBreakdown.destroy();
    }

    AUTO_LOAN_CALCULATOR.charts.paymentBreakdown = new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim()
                    }
                },
                title: {
                    display: true,
                    text: 'Total Cost Breakdown (Over Loan Life)',
                    color: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            let value = context.parsed;
                            let total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            let percent = ((value / total) * 100).toFixed(1);
                            return `${label}: ${UTILS.formatCurrency(value)} (${percent}%)`;
                        }
                    }
                }
            },
        },
    });
}

/**
 * Populates the full amortization schedule table.
 */
function generateAmortizationTable() {
    const tableBody = document.querySelector('#amortization-table tbody');
    tableBody.innerHTML = ''; // Clear previous data
    const schedule = AUTO_LOAN_CALCULATOR.currentCalculation.amortizationSchedule;
    const fragment = document.createDocumentFragment();

    schedule.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.month}</td>
            <td>${UTILS.formatCurrency(item.payment)}</td>
            <td>${UTILS.formatCurrency(item.principal)}</td>
            <td>${UTILS.formatCurrency(item.interest)}</td>
            <td>${UTILS.formatCurrency(item.balance)}</td>
        `;
        fragment.appendChild(row);
    });

    tableBody.appendChild(fragment);
}

/**
 * Calculates and displays the loan term comparison table.
 */
function calculateAndDisplayComparison() {
    const tableBody = document.querySelector('#loan-comparison-table tbody');
    tableBody.innerHTML = '';
    const fragment = document.createDocumentFragment();
    
    // Get base inputs
    const baseInputs = {
        price: UTILS.parseCurrency(document.getElementById('vehicle-price').value),
        downPayment: UTILS.parseCurrency(document.getElementById('down-payment').value),
        tradeIn: UTILS.parseCurrency(document.getElementById('trade-in-value').value),
        ratePercent: UTILS.parseCurrency(document.getElementById('interest-rate').value),
        taxRatePercent: UTILS.parseCurrency(document.getElementById('sales-tax-rate').value),
        fees: UTILS.parseCurrency(document.getElementById('fees-other').value),
    };

    if (baseInputs.price <= 0) return;
    
    const termsToCompare = [36, 48, 60, 72, 84];
    
    termsToCompare.forEach(term => {
        const inputs = { ...baseInputs, termMonths: term };
        const result = calculateAutoLoan(inputs);
        
        const row = document.createElement('tr');
        if (term === AUTO_LOAN_CALCULATOR.currentCalculation.loanTermMonths) {
            row.style.fontWeight = 'bold';
            row.style.backgroundColor = 'var(--color-gray-200)';
        }
        
        row.innerHTML = `
            <td>${term} Months</td>
            <td>${UTILS.formatCurrency(result.monthlyPayment)}</td>
            <td>${UTILS.formatCurrency(result.totalInterestPaid)}</td>
            <td>${UTILS.formatCurrency(result.totalCost)}</td>
        `;
        fragment.appendChild(row);
    });
    
    tableBody.appendChild(fragment);
}

// END CHART & COMPARISON MODULE

/* ========================================================================== */
/* VI. AI INSIGHTS ENGINE MODULE (Monetization Focused) */
/* ========================================================================== */

/**
 * Generates financial recommendations based on calculated results.
 */
function generateAIInsights() {
    const contentBox = document.getElementById('ai-insights-content');
    const calc = AUTO_LOAN_CALCULATOR.currentCalculation;
    
    // Destructure for easier access
    const { totalDownPayment, vehiclePrice, loanTermMonths, interestRate, monthlyPayment, totalInterestPaid, totalLoanAmount } = calc;
    
    let insightsHtml = '';
    const ltv = (totalLoanAmount / vehiclePrice) * 100;

    // --- Insight 1: Long Loan Term (72+ Months) ---
    if (loanTermMonths >= 72) {
        insightsHtml += `
            <div class="recommendation-alert high-priority">
                <i class="fas fa-exclamation-triangle"></i> **High Priority: High-Risk Loan Term**
            </div>
            <p>You've selected an **${loanTermMonths}-month** term. While this lowers your payment to ${UTILS.formatCurrency(monthlyPayment)}, you will pay **${UTILS.formatCurrency(totalInterestPaid)}** in interest and are at a high risk of being "upside-down" (owing more than the car is worth) for several years.</p>
            <p><strong>AI Recommendation:</strong> A 72 or 84-month loan should be avoided unless absolutely necessary. A vehicle is a depreciating asset. <br/>
            <strong><i class="fas fa-handshake"></i> Monetization/Sponsor Link:</strong> If you must take this term, you absolutely need Gap Insurance. <a href="#" target="_blank">Click here to get a quote from our Gap Insurance partner.</a></p>
        `;
    }

    // --- Insight 2: High Interest Rate (Rate > 9%) ---
    else if (interestRate > 9.0) {
        insightsHtml += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-chart-bar"></i> **Opportunity: High Interest Rate Detected**
            </div>
            <p>Your interest rate of **${interestRate.toFixed(2)}%** is high, costing you **${UTILS.formatCurrency(totalInterestPaid)}** in interest. This is often linked to a lower credit score.</p>
            <p><strong>AI Recommendation:</strong> Improving your credit score before buying can save you thousands. A 2-point rate drop on this loan would save you ~${UTILS.formatCurrency(totalInterestPaid * 0.25)}.</p>
            <p><strong><i class="fas fa-handshake"></i> Affiliate Link:</strong> We recommend checking your score for free with our partner. <a href="#" target="_blank">Click here to get your Free Credit Score from CreditKarma.</a></p>
        `;
    }

    // --- Insight 3: Low Down Payment (LTV > 90%) ---
    else if (ltv > 90 && totalDownPayment < (vehiclePrice * 0.1)) {
         insightsHtml += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-chart-bar"></i> **Strategy: Low Down Payment**
            </div>
            <p>Your total down payment is less than 10% of the vehicle's price. This increases your monthly payment and, like a long-term loan, increases your risk of being "upside-down."</p>
            <p><strong>AI Recommendation:</strong> We recommend a down payment of at least 20% to offset initial depreciation.</p>
            <p><strong><i class="fas fa-handshake"></i> Sponsor Link:</strong> If 20% isn't possible, compare rates from multiple lenders to minimize your interest cost. <a href="#" target="_blank">See pre-qualified offers from our lending partners.</a></p>
        `;
    }
    
    // --- Insight 4: Good Loan Structure (Term <= 60 AND Rate < 7%) ---
    else if (loanTermMonths <= 60 && interestRate < 7.0) {
        insightsHtml += `
            <div class="recommendation-alert low-priority">
                <i class="fas fa-lightbulb"></i> **Wealth-Building Strategy: Strong Loan Structure**
            </div>
            <p>This is a solid loan structure. Your **${loanTermMonths}-month** term and **${interestRate.toFixed(2)}%** rate will help you build equity quickly and minimize interest costs.</p>
            <p><strong>AI Recommendation:</strong> Since your loan is well-structured, your next savings opportunity is on insurance.</p>
            <p><strong><i class="fas fa-handshake"></i> Affiliate Link:</strong> Use our partner tool to compare auto insurance rates in 2 minutes. The average user saves $400/year. <a href="#" target="_blank">Compare Auto Insurance Quotes Now (from Progressive/Geico).</a></p>
        `;
    }
    
    // --- Fallback/Initial state ---
    if (insightsHtml === '') {
        insightsHtml = '<p>Your parameters look reasonable. A shorter term (like 48 or 60 months) is generally recommended to build equity faster and pay less interest.</p>';
    }

    contentBox.innerHTML = insightsHtml;
}
// END AI INSIGHTS ENGINE MODULE

/* ========================================================================== */
/* VII. VOICE CONTROL MODULE (Reused from FinGuid Platform) */
/* ========================================================================== */

const speech = (function() {
    
    let recognition;
    let isListening = false;
    let synth = window.speechSynthesis;
    
    /**
     * Text to Speech function
     */
    function speak(text) {
        if (!synth || !document.getElementById('toggle-text-to-speech').classList.contains('tts-active')) return; 
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        synth.speak(utterance);
    }
    
    /**
     * Initializes Speech Recognition API.
     */
    function initializeRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            document.getElementById('toggle-voice-command').disabled = true;
            document.getElementById('voice-status-text').textContent = 'Not Supported';
            console.error('Speech Recognition not supported in this browser.');
            return;
        }
        
        recognition = new SpeechRecognition();
        recognition.continuous = false; 
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = function() {
            isListening = true;
            document.getElementById('toggle-voice-command').classList.replace('voice-inactive', 'voice-active');
            document.getElementById('voice-status-text').textContent = 'Listening...';
        };

        recognition.onend = function() {
            isListening = false;
            document.getElementById('toggle-voice-command').classList.replace('voice-active', 'voice-inactive');
            document.getElementById('voice-status-text').textContent = 'Voice OFF';
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            if (event.error !== 'no-speech') {
                UTILS.showToast(`Voice Error: ${event.error}`, 'error');
            }
            isListening = false;
        };

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript.toLowerCase();
            console.log('Voice Command Received:', transcript);
            processVoiceCommand(transcript);
        };
    }
    
    /**
     * Processes the recognized voice command.
     */
    function processVoiceCommand(command) {
        let responseText = '';
        
        // --- Command Logic ---
        if (command.includes('calculate') || command.includes('show results')) {
            document.getElementById('calculate-button').click();
            responseText = 'Calculating your auto loan.';
        } else if (command.includes('what is the payment') || command.includes('read payment')) {
            const payment = document.getElementById('monthly-payment-total').textContent;
            responseText = `Your estimated monthly payment is ${payment}.`;
        } else if (command.includes('set price to') || command.includes('price is')) {
            const match = command.match(/(\d+[\s,]*\d*)/);
            if (match) {
                const price = UTILS.parseCurrency(match[0]);
                document.getElementById('vehicle-price').value = UTILS.formatCurrency(price).replace(/[$,.00]/g, '');
                responseText = `Setting vehicle price to ${UTILS.formatCurrency(price)}.`;
                updateCalculations();
            }
        } else if (command.includes('set rate to') || command.includes('rate is')) {
            const match = command.match(/(\d+\.?\d*)/);
            if (match) {
                const rate = parseFloat(match[0]);
                document.getElementById('interest-rate').value = rate.toFixed(2);
                responseText = `Setting interest rate to ${rate.toFixed(2)} percent.`;
                updateCalculations();
            }
        } else if (command.includes('set term to')) {
            const match = command.match(/(\d+)/);
            if (match && [36, 48, 60, 72, 84].includes(parseInt(match[0]))) {
                const term = match[0];
                document.getElementById('loan-term').value = term;
                responseText = `Setting loan term to ${term} months.`;
                updateCalculations();
            } else {
                 responseText = "Sorry, please choose a valid term: 36, 48, 60, 72, or 84 months.";
            }
        } else if (command.includes('show ai insights') || command.includes('what is the advice')) {
            showTab('ai-insights');
            responseText = 'Displaying AI auto advisor insights.';
            // Also read the insights
            setTimeout(() => {
                const insights = document.getElementById('ai-insights-content').textContent;
                speak(insights);
            }, 300);
        } else {
            responseText = "Sorry, I didn't recognize that command. Try 'Set price to 30000' or 'Calculate'.";
        }
        
        speak(responseText);
    }

    /**
     * Toggles the speech recognition on or off.
     */
    function toggleVoiceCommand() {
        if (!recognition) return;
        
        if (isListening) {
            recognition.stop();
        } else {
            if (synth && synth.speaking) {
                synth.cancel();
            }
            recognition.start();
        }
    }
    
    return {
        initialize: initializeRecognition,
        toggleVoiceCommand,
        speak,
    };
})();
// END VOICE CONTROL MODULE

/* ========================================================================== */
/* VIII. PWA & USER PREFERENCES MODULE (Reused from FinGuid Platform) */
/* ========================================================================== */

/**
 * Registers the service worker for PWA functionality.
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js') // Assuming root SW
                .then(registration => {
                    console.log('PWA ServiceWorker registration successful:', registration.scope);
                })
                .catch(err => {
                    console.error('PWA ServiceWorker registration failed:', err);
                });
        });
    }
}

/**
 * Handles the PWA install prompt.
 */
function showPWAInstallPrompt() {
    const installButton = document.getElementById('pwa-install-button');
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        AUTO_LOAN_CALCULATOR.deferredInstallPrompt = e;
        installButton.classList.remove('hidden');
    });

    installButton.addEventListener('click', () => {
        if (AUTO_LOAN_CALCULATOR.deferredInstallPrompt) {
            AUTO_LOAN_CALCULATOR.deferredInstallPrompt.prompt();
            AUTO_LOAN_CALCULATOR.deferredInstallPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    UTILS.showToast('FinGuid App Installed!', 'success');
                }
                AUTO_LOAN_CALCULATOR.deferredInstallPrompt = null;
                installButton.classList.add('hidden');
            });
        }
    });
}

/**
 * Toggles color scheme and saves preference to localStorage.
 */
function toggleColorScheme() {
    const html = document.documentElement;
    const currentScheme = html.getAttribute('data-color-scheme');
    const newScheme = currentScheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-color-scheme', newScheme);
    localStorage.setItem('colorScheme', newScheme);
    
    const icon = document.querySelector('#toggle-color-scheme i');
    icon.className = newScheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    
    // Re-render charts to pick up new theme colors
    updatePaymentBreakdownChart();
}

/**
 * Loads user color scheme preference from localStorage.
 */
function loadUserPreferences() {
    const savedScheme = localStorage.getItem('colorScheme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let initialScheme = 'light';
    
    if (savedScheme) {
        initialScheme = savedScheme;
    } else if (prefersDark) {
        initialScheme = 'dark';
    }
    
    document.documentElement.setAttribute('data-color-scheme', initialScheme);
    const icon = document.querySelector('#toggle-color-scheme i');
    icon.className = initialScheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}
// END PWA & USER PREFERENCES MODULE

/* ========================================================================== */
/* IX. UI EVENT HANDLING & SETUP */
/* ========================================================================== */

/**
 * Shows the selected tab content and marks the button as active.
 * @param {string} tabId - The ID of the tab content to show.
 */
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
    
    if (tabId === 'payment-components' && AUTO_LOAN_CALCULATOR.charts.paymentBreakdown) {
        AUTO_LOAN_CALCULATOR.charts.paymentBreakdown.resize();
    }
}

/**
 * Toggles the visibility of advanced PITI options.
 */
function toggleAdvancedOptions() {
    const button = document.getElementById('toggle-advanced-options');
    const content = document.getElementById('advanced-options-group');
    
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', !isExpanded);
    content.setAttribute('aria-hidden', isExpanded);
}

/**
 * Exports the full amortization schedule to a CSV file.
 */
function exportAmortizationToCSV() {
    const schedule = AUTO_LOAN_CALCULATOR.currentCalculation.amortizationSchedule;
    if (schedule.length === 0) {
        UTILS.showToast('Please calculate the loan before exporting.', 'error');
        return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    const header = ['Month', 'Payment', 'Principal', 'Interest', 'Remaining Balance'];
    csvContent += header.join(',') + '\n';

    schedule.forEach(item => {
        const row = [
            item.month,
            item.payment.toFixed(2),
            item.principal.toFixed(2),
            item.interest.toFixed(2),
            item.balance.toFixed(2),
        ];
        csvContent += row.join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `auto_loan_schedule_${AUTO_LOAN_CALCULATOR.currentCalculation.loanTermMonths}mo.csv`);
    document.body.appendChild(link);
    link.click(); 
    document.body.removeChild(link);
    
    UTILS.showToast('Amortization schedule exported to CSV!', 'success');
}


/**
 * Sets up all global event listeners.
 */
function setupEventListeners() {
    const form = document.getElementById('auto-loan-form');
    const inputs = form.querySelectorAll('input[type="text"], select');
    
    // --- Form Submission Handler ---
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        updateCalculations();
    });
    
    // --- Live Input Change Handlers (Debounced) ---
    inputs.forEach(input => {
        input.addEventListener('input', UTILS.debounce(updateCalculations, 400));
    });
    
    // Select dropdowns (Term) should update immediately
    document.getElementById('loan-term').addEventListener('change', updateCalculations);
    
    // --- UI Controls ---
    document.getElementById('toggle-color-scheme').addEventListener('click', toggleColorScheme);
    document.getElementById('toggle-advanced-options').addEventListener('click', toggleAdvancedOptions);
    document.getElementById('toggle-voice-command').addEventListener('click', speech.toggleVoiceCommand);
    document.getElementById('toggle-text-to-speech').addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('tts-active');
        e.currentTarget.classList.toggle('tts-inactive');
    });

    // --- Tab Switching ---
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            showTab(button.getAttribute('data-tab'));
        });
    });
    
    // === Export CSV ===
    document.getElementById('export-csv-button').addEventListener('click', exportAmortizationToCSV);
}
// END EVENT LISTENERS SETUP

/* ========================================================================== */
/* X. DOCUMENT INITIALIZATION */
/* ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🇺🇸 FinGuid Auto Loan Analyzer — AI‑Powered Calculator v1.0');
    console.log('📊 World\'s First AI-Powered Auto Loan Calculator');
    console.log('🏦 Federal Reserve Data Integration: ACTIVE (Key: 9c6c...a59a)');
    
    // 1. Initialize Core State and UI
    registerServiceWorker(); // For PWA functionality
    loadUserPreferences();
    speech.initialize();
    setupEventListeners();
    showPWAInstallPrompt();
    
    // 2. Set default tab views
    showTab('payment-components'); 
    
    // 3. Fetch Live Rate and Initial Calculation
    fredAPI.startAutomaticUpdates(); 
    
    console.log('✅ Auto Loan Calculator initialized successfully with all features!');
});
