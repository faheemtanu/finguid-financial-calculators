/**
 * CREDIT CARD PAYOFF CALCULATOR — AI-POWERED DEBT ANALYZER - PRODUCTION JS v1.0
 * FinGuid USA Market Domination Build 
 * * Features: Multi-card input, Snowball/Avalanche, AI Insights, FRED Rate, PWA, Voice
 * * FRED API: 9c6c421f077f2091e8bae4f143ada59a (TERMCBCCALLNS)
 * * Google Analytics: G-NYBL2CDNQJ (in HTML)
 * * © 2025 FinGuid - World's First AI Calculator Platform for Americans
 */

/* ========================================================================== */
/* I. GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const CREDIT_CARD_CALCULATOR = {
    VERSION: '1.0',
    DEBUG: false, 
    
    // FRED API Configuration (Real Key)
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a', 
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    FRED_SERIES_ID: 'TERMCBCCALLNS', // Commercial Bank Interest Rate on Credit Card Plans, All Accounts
    RATE_UPDATE_INTERVAL: 12 * 60 * 60 * 1000, // 12 hours
    
    // UI State
    charts: {
        strategyComparison: null,
    },
    currentCalculation: {
        inputs: {},
        results: {
            minimum: {},
            snowball: {},
            avalanche: {},
            custom: {}
        }
    },
    cardCounter: 1, // For unique IDs
    deferredInstallPrompt: null,
};

/* ========================================================================== */
/* II. UTILITY & FORMATTING MODULE */
/* ========================================================================== */

const UTILS = (function() {
    
    /**
     * Formats a number as USD currency.
     * @param {number} amount - The number to format.
     * @returns {string} The formatted currency string.
     */
    function formatCurrency(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }

    /**
     * Parses a currency string or number input.
     * @param {string|number} value - The input value.
     * @returns {number} The numeric value.
     */
    function parseNumber(value) {
        if (typeof value === 'number') return value;
        if (typeof value !== 'string') return 0;
        const cleanString = value.replace(/[$,]/g, '').trim();
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
     * @param {string} type - 'success', 'error', or 'info'.
     */
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

    /**
     * Formats total months into "X Years, Y Months".
     * @param {number} totalMonths - The total number of months.
     * @returns {string} The formatted string.
     */
    function formatMonthsToYears(totalMonths) {
        if (isNaN(totalMonths) || totalMonths <= 0) return "0 Months";
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        let result = '';
        if (years > 0) {
            result += `${years} Year${years > 1 ? 's' : ''}`;
        }
        if (months > 0) {
            if (years > 0) result += ', ';
            result += `${months} Month${months > 1 ? 's' : ''}`;
        }
        if (years === 0 && months === 0) return "Paid off!";
        return result;
    }

    /**
     * Generates a future date string.
     * @param {number} totalMonths - Months from now.
     * @returns {string} Formatted as "Mon YYYY".
     */
    function getFutureDate(totalMonths) {
        const date = new Date();
        date.setMonth(date.getMonth() + totalMonths);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            year: 'numeric'
        }).format(date);
    }
    
    // Export public methods
    return {
        formatCurrency,
        parseNumber,
        debounce,
        showToast,
        formatMonthsToYears,
        getFutureDate,
    };
})();
// END UTILITY MODULE

/* ========================================================================== */
/* III. DATA LAYER: FRED API MODULE */
/* ========================================================================== */

const fredAPI = (function() {
    
    /**
     * Fetches the latest average credit card APR from the FRED API.
     */
    async function fetchLatestRate() {
        if (CREDIT_CARD_CALCULATOR.DEBUG) {
            console.warn('DEBUG MODE: Using mock FRED rate.');
            return 21.5; // Use a realistic mock rate
        }

        const url = new URL(CREDIT_CARD_CALCULATOR.FRED_BASE_URL);
        const params = {
            series_id: CREDIT_CARD_CALCULATOR.FRED_SERIES_ID,
            api_key: CREDIT_CARD_CALCULATOR.FRED_API_KEY,
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
                document.getElementById('fred-rate-display').textContent = `${rate.toFixed(2)}`;
                return rate;
            } else {
                throw new Error('No valid observation found in FRED data.');
            }
        } catch (error) {
            console.error('FRED API Error, hiding display:', error);
            document.querySelector('.fred-source-note').style.display = 'none';
        }
    }

    // Export public methods
    return {
        fetchLatestRate,
    };
})();
// END FRED API MODULE

/* ========================================================================== */
/* IV. CORE CALCULATION ENGINE */
/* ========================================================================== */

/**
 * Main function to gather inputs and run all calculations.
 */
function updateCalculations() {
    // 1. Get Inputs
    const { cards, monthlyPayment, strategy } = getInputs();
    
    // 2. Validation
    if (cards.length === 0 || cards.some(c => isNaN(c.balance) || isNaN(c.apr) || isNaN(c.minPayment))) {
        UTILS.showToast('Please enter valid balance, APR, and min. payment for all cards.', 'error');
        return;
    }
    const totalMinPayments = cards.reduce((sum, card) => sum + card.minPayment, 0);
    if (strategy === 'custom' && monthlyPayment < totalMinPayments) {
        UTILS.showToast(`Your total payment ($${monthlyPayment}) is less than your total minimums ($${totalMinPayments}). Please increase your budget.`, 'error');
        document.getElementById('monthly-payment').focus();
        return;
    }

    // 3. Store Inputs
    CREDIT_CARD_CALCULATOR.currentCalculation.inputs = { cards, monthlyPayment, strategy };

    // 4. Run Amortization for all 4 strategies to get comparison data
    const calc = CREDIT_CARD_CALCULATOR.currentCalculation;
    const customBudget = (strategy === 'custom') ? monthlyPayment : totalMinPayments;
    
    calc.results.minimum = runAmortization(cards, totalMinPayments, 'minimum');
    calc.results.avalanche = runAmortization(cards, customBudget, 'avalanche');
    calc.results.snowball = runAmortization(cards, customBudget, 'snowball');
    calc.results.custom = runAmortization(cards, customBudget, strategy); // This will be the user's selected strategy
    
    // 5. Update UI
    updateResults(strategy);
}

/**
 * Gathers all data from the DOM.
 * @returns {object} { cards: Array, monthlyPayment: number, strategy: string }
 */
function getInputs() {
    const cards = [];
    const cardElements = document.querySelectorAll('.card-input-group');
    
    cardElements.forEach((cardEl, index) => {
        const id = index + 1;
        const balance = UTILS.parseNumber(cardEl.querySelector('.card-balance').value);
        const apr = UTILS.parseNumber(cardEl.querySelector('.card-apr').value) / 100; // As decimal
        const minPaymentFlat = UTILS.parseNumber(cardEl.querySelector('.card-min-payment').value);
        const minPaymentPercent = UTILS.parseNumber(cardEl.querySelector('.card-min-percent').value) / 100; // As decimal
        
        // Calculate the *actual* minimum payment
        const percentBasedMin = balance * minPaymentPercent;
        const minPayment = Math.max(minPaymentFlat, percentBasedMin, 25); // Assume a $25 floor if both are low

        cards.push({
            id: id,
            name: cardEl.querySelector('.card-name').value || `Card ${id}`,
            balance: balance,
            apr: apr,
            monthlyAPR: apr / 12,
            minPayment: minPayment,
        });
    });

    const monthlyPayment = UTILS.parseNumber(document.getElementById('monthly-payment').value);
    const strategy = document.getElementById('payoff-strategy').value;

    return { cards, monthlyPayment, strategy };
}

/**
 * The core amortization engine.
 * @param {Array} initialCards - Array of card objects.
 * @param {number} totalMonthlyPayment - The total budget.
 * @param {string} strategy - 'avalanche', 'snowball', 'minimum', or 'custom'.
 * @returns {object} The full results object.
 */
function runAmortization(initialCards, totalMonthlyPayment, strategy) {
    // Deep clone cards to avoid mutating the original array
    let cards = initialCards.map(c => ({ ...c }));
    let months = 0;
    let totalInterest = 0;
    let totalPrincipal = 0;
    const schedule = [];
    let isDone = false;
    
    const MAX_MONTHS = 600; // 50 years, failsafe

    while (!isDone && months < MAX_MONTHS) {
        months++;
        let monthInterest = 0;
        let monthPrincipal = 0;
        let monthPayment = 0;
        let remainingBudget = totalMonthlyPayment;

        // 1. Pay minimums on all cards
        if (strategy !== 'minimum') {
            cards.forEach(card => {
                if (card.balance > 0) {
                    const interest = card.balance * card.monthlyAPR;
                    const minPayment = Math.min(card.balance + interest, card.minPayment); // Can't pay more than balance + interest
                    
                    const principal = minPayment - interest;
                    
                    card.balance -= principal;
                    totalInterest += interest;
                    monthInterest += interest;
                    monthPrincipal += principal;
                    monthPayment += minPayment;
                    remainingBudget -= minPayment;
                }
            });
        }

        // 2. Sort for extra payment
        if (strategy === 'avalanche') {
            cards.sort((a, b) => b.apr - a.apr); // Highest APR first
        } else if (strategy === 'snowball') {
            cards.sort((a, b) => a.balance - b.balance); // Lowest balance first
        }
        
        // 3. Apply extra payment (or just minimums)
        for (const card of cards) {
            if (card.balance > 0) {
                const interest = (strategy === 'minimum') ? card.balance * card.monthlyAPR : 0; // Interest already paid if not min-only
                
                let payment;
                if (strategy === 'minimum') {
                    payment = Math.min(card.balance + interest, card.minPayment);
                    remainingBudget -= payment;
                } else {
                    payment = Math.min(card.balance, remainingBudget); // Pay remaining budget or balance, whichever is less
                    remainingBudget -= payment;
                }
                
                const principal = payment - interest;
                
                card.balance -= principal;
                totalInterest += interest;
                monthInterest += interest;
                monthPrincipal += principal;
                monthPayment += (strategy === 'minimum') ? payment : principal; // Only add principal if min already paid
            }
        }
        
        // Add any leftover budget (if all cards paid off this month) to principal
        if (remainingBudget > 0 && strategy !== 'minimum') {
             monthPrincipal += remainingBudget;
        }

        const remainingBalance = cards.reduce((sum, c) => sum + c.balance, 0);

        schedule.push({
            month: months,
            date: UTILS.getFutureDate(months),
            payment: monthPayment,
            principal: monthPrincipal,
            interest: monthInterest,
            balance: remainingBalance,
        });

        if (remainingBalance <= 0) {
            isDone = true;
        }
    }
    
    totalPrincipal = initialCards.reduce((sum, c) => sum + c.balance, 0);
    const totalPaid = totalPrincipal + totalInterest;

    return {
        totalMonths: months,
        totalInterest: totalInterest,
        totalPrincipal: totalPrincipal,
        totalPaid: totalPaid,
        payoffDate: UTILS.getFutureDate(months),
        schedule: schedule,
    };
}


/* ========================================================================== */
/* V. UI UPDATE & CHARTING MODULE */
/* ========================================================================== */

/**
 * Updates all results displays, charts, and AI insights.
 * @param {string} strategy - The user's selected strategy.
 */
function updateResults(strategy) {
    const calc = CREDIT_CARD_CALCULATOR.currentCalculation;
    const userResult = calc.results[strategy] || calc.results.custom;
    const minResult = calc.results.minimum;

    // 1. Update Main Summary Card
    const interestSaved = minResult.totalInterest - userResult.totalInterest;
    document.getElementById('payoff-time-total').textContent = UTILS.formatMonthsToYears(userResult.totalMonths);
    document.getElementById('payoff-summary-details').innerHTML = 
        `Total Interest Saved: ${UTILS.formatCurrency(interestSaved > 0 ? interestSaved : 0)} | Payoff Date: ${userResult.payoffDate}`;

    // 2. Update Payoff Schedule Table
    updatePayoffScheduleTable(userResult.schedule);

    // 3. Update Strategy Comparison Chart
    updateStrategyComparisonChart();

    // 4. Generate AI Insights
    generateAIInsights();

    // 5. Speak the results
    speech.speak(`Calculation complete. You will be debt free in ${UTILS.formatMonthsToYears(userResult.totalMonths)}, saving ${UTILS.formatCurrency(interestSaved)} in interest.`);
}

/**
 * Populates the full payoff schedule table.
 * @param {Array} schedule - The amortization schedule.
 */
function updatePayoffScheduleTable(schedule) {
    const tableBody = document.querySelector('#payoff-schedule-table tbody');
    tableBody.innerHTML = ''; // Clear previous data
    
    if (!schedule || schedule.length === 0) return;

    const fragment = document.createDocumentFragment();
    schedule.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.month} (${item.date})</td>
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
 * Initializes or updates the Strategy Comparison (Bar) Chart.
 */
function updateStrategyComparisonChart() {
    const { results, inputs } = CREDIT_CARD_CALCULATOR.currentCalculation;
    const ctx = document.getElementById('strategy-comparison-chart').getContext('2d');

    // Update the budget display text
    document.getElementById('comparison-budget-display').textContent = UTILS.parseNumber(document.getElementById('monthly-payment').value);
    
    const chartData = {
        labels: ['Minimum Payment', 'Debt Snowball', 'Debt Avalanche'],
        datasets: [
            {
                label: 'Total Interest Paid',
                data: [
                    results.minimum.totalInterest,
                    results.snowball.totalInterest,
                    results.avalanche.totalInterest
                ],
                backgroundColor: 'rgba(239, 68, 68, 0.7)', // Red
                yAxisID: 'y-interest',
            },
            {
                label: 'Months to Payoff',
                data: [
                    results.minimum.totalMonths,
                    results.snowball.totalMonths,
                    results.avalanche.totalMonths
                ],
                backgroundColor: 'rgba(36, 172, 185, 0.7)', // Teal
                yAxisID: 'y-months',
            }
        ]
    };

    // Destroy existing chart instance
    if (CREDIT_CARD_CALCULATOR.charts.strategyComparison) {
        CREDIT_CARD_CALCULATOR.charts.strategyComparison.destroy();
    }

    const isDarkMode = document.documentElement.getAttribute('data-color-scheme') === 'dark';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDarkMode ? '#FFFFFF' : '#333333';

    CREDIT_CARD_CALCULATOR.charts.strategyComparison = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: textColor } },
                title: { display: true, text: 'Strategy Impact on Cost & Time', color: textColor },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.dataset.yAxisID === 'y-interest') {
                                label += UTILS.formatCurrency(context.parsed.y);
                            } else {
                                label += UTILS.formatMonthsToYears(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                'y-interest': {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'Total Interest ($)', color: textColor },
                    ticks: { 
                        color: textColor,
                        callback: value => UTILS.formatCurrency(value)
                    },
                    grid: { drawOnChartArea: false }
                },
                'y-months': {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'Total Months', color: textColor },
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        },
    });
}


/* ========================================================================== */
/* VI. AI INSIGHTS ENGINE MODULE (Conditional Logic) */
/* ========================================================================== */

function generateAIInsights() {
    const { inputs, results } = CREDIT_CARD_CALCULATOR.currentCalculation;
    const userResult = results[inputs.strategy] || results.custom;
    const minResult = results.minimum;
    const avalancheResult = results.avalanche;
    const contentBox = document.getElementById('ai-insights-content');
    
    let insightsHtml = '';

    // --- Insight 1: High-Priority Monetization (Consolidation) ---
    const highAPRCard = inputs.cards.find(c => (c.apr * 100) > 20);
    const totalDebt = inputs.cards.reduce((sum, c) => sum + c.balance, 0);
    
    if (highAPRCard && totalDebt > 5000) {
        // Calculate potential savings with a consolidation loan (e.g., at 11% APR)
        const newLoanResult = runAmortization(
            [{ id: 1, name: 'Consolidated', balance: totalDebt, apr: 0.11, monthlyAPR: 0.11 / 12, minPayment: 0 }],
            inputs.monthlyPayment,
            'custom'
        );
        const potentialSavings = userResult.totalInterest - newLoanResult.totalInterest;

        if (potentialSavings > 250) {
            insightsHtml += `
                <div class="recommendation-alert high-priority">
                    <i class="fas fa-exclamation-triangle"></i> **High Priority Alert: High Interest Detected**
                </div>
                <p>You're paying **${(highAPRCard.apr * 100).toFixed(1)}% APR** on at least one card. Based on your balance, you could potentially save **~${UTILS.formatCurrency(potentialSavings)}** in interest by consolidating your debt into a single, lower-rate personal loan.</p>
                <p><strong>AI Recommendation:</strong> <a href="#affiliate-consolidation" target="_blank" rel="sponsored">Click here to compare pre-qualified debt consolidation loan rates</a>. It's free and won't affect your credit score.</p>
            `;
        }
    }
    
    // --- Insight 2: Medium-Priority Monetization (Balance Transfer) ---
    else if (highAPRCard && totalDebt > 2000) {
        // Calculate 12 months of interest
        const interestIn12Months = userResult.schedule.slice(0, 12).reduce((sum, m) => sum + m.interest, 0);
        insightsHtml += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-percent"></i> **Interest-Saving Strategy: Balance Transfer**
            </div>
            <p>You could stop interest charges cold. By moving your **${(highAPRCard.apr * 100).toFixed(1)}% APR** balance to a 0% introductory APR card, you could save **~${UTILS.formatCurrency(interestIn12Months)}** in the next year alone.</p>
            <p><strong>AI Recommendation:</strong> <a href="#affiliate-transfer" target="_blank" rel="sponsored">See the top-rated 0% APR balance transfer cards</a> to stop paying interest while you pay down principal.</p>
        `;
    }

    // --- Insight 3: Strategy Choice Analysis ---
    if (inputs.strategy === 'avalanche') {
        insightsHtml += `
            <div class="recommendation-alert low-priority">
                <i class="fas fa-fast-forward"></i> **Strategy: Debt Avalanche**
            </div>
            <p>You've chosen the **Debt Avalanche** method. This is the mathematically fastest and cheapest way to get out of debt. By targeting your highest APR card first, you're saving **${UTILS.formatCurrency(results.snowball.totalInterest - results.avalanche.totalInterest)}** more than the Snowball method. Great choice!</p>
        `;
    } else if (inputs.strategy === 'snowball') {
        const firstPayoff = results.snowball.schedule.findIndex(m => m.balance < (totalDebt - inputs.cards.sort((a,b) => a.balance - b.balance)[0].balance + 1));
        insightsHtml += `
            <div class="recommendation-alert low-priority">
                <i class="fas fa-check-circle"></i> **Strategy: Debt Snowball**
            </div>
            <p>You've chosen the **Debt Snowball** method. This is a powerful motivational strategy. You'll get your first "win" by paying off your **${inputs.cards.sort((a,b) => a.balance - b.balance)[0].name}** in just **${firstPayoff + 1} months**! Seeing that zero balance will give you the momentum to keep going.</p>
        `;
    } else if (inputs.strategy === 'minimum') {
        insightsHtml += `
            <div class="recommendation-alert high-priority">
                <i class="fas fa-exclamation-triangle"></i> **Warning: Minimum Payment Trap**
            </div>
            <p>Paying only the minimums will keep you in debt for **${UTILS.formatMonthsToYears(minResult.totalMonths)}** and cost you **${UTILS.formatCurrency(minResult.totalInterest)}** in interest. This is the most expensive path.</p>
            <p><strong>AI Recommendation:</strong> Try switching to the "Debt Avalanche" strategy and use the "Total Monthly Payment" field to see how even a small extra payment can save you thousands.</p>
        `;
    }

    // --- Insight 4: Budget/Acceleration ---
    if (inputs.strategy !== 'minimum' && userResult.totalMonths > 12) {
        // Calculate savings from adding $50
        const boostedPayment = UTILS.parseNumber(document.getElementById('monthly-payment').value) + 50;
        const boostedResult = runAmortization(inputs.cards, boostedPayment, inputs.strategy);
        const monthsSaved = userResult.totalMonths - boostedResult.totalMonths;
        const interestSaved = userResult.totalInterest - boostedResult.totalInterest;

        if (monthsSaved > 1) {
            insightsHtml += `
                <div class="recommendation-alert low-priority">
                    <i class="fas fa-lightbulb"></i> **Wealth-Building Strategy: Accelerate**
                </div>
                <p>Here's a powerful tip: If you add just **$50 more** to your monthly payment (totaling ${UTILS.formatCurrency(boostedPayment)}), you would get out of debt **${UTILS.formatMonthsToYears(monthsSaved)} sooner** and save an extra **${UTILS.formatCurrency(interestSaved)}** in interest!</p>
            `;
        }
    }
    
    // --- Fallback/Initial state ---
    if (insightsHtml === '') {
        insightsHtml = '<p>Your parameters look good! Select a strategy and budget to see your full AI analysis.</p>';
    }

    contentBox.innerHTML = insightsHtml;
}
// END AI INSIGHTS ENGINE MODULE

/* ========================================================================== */
/* VII. PWA, THEME, & VOICE MODULES (FinGuid Standard) */
/* ========================================================================== */

/**
 * Registers the service worker for PWA functionality.
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/register-sw.js') // Using the stub file
                .then(registration => {
                    if (CREDIT_CARD_CALCULATOR.DEBUG) console.log('PWA ServiceWorker registration successful:', registration.scope);
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
        CREDIT_CARD_CALCULATOR.deferredInstallPrompt = e;
        installButton.classList.remove('hidden');
    });

    installButton.addEventListener('click', () => {
        if (CREDIT_CARD_CALCULATOR.deferredInstallPrompt) {
            CREDIT_CARD_CALCULATOR.deferredInstallPrompt.prompt();
            CREDIT_CARD_CALCULATOR.deferredInstallPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    if (CREDIT_CARD_CALCULATOR.DEBUG) console.log('User accepted the A2HS prompt');
                    UTILS.showToast('FinGuid App Installed!', 'success');
                }
                CREDIT_CARD_CALCULATOR.deferredInstallPrompt = null;
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
    updateStrategyComparisonChart();
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

/**
 * Voice Control Module (Web Speech API)
 */
const speech = (function() {
    
    let recognition;
    let isListening = false;
    let synth = window.speechSynthesis;
    let ttsActive = false;
    
    /**
     * Text to Speech function for announcing results/status.
     */
    function speak(text) {
        if (!synth || !ttsActive) return; 
        
        // Cancel any previous speech
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        synth.speak(utterance);
    }
    
    /**
     * Initializes Speech Recognition API.
     */
    function initializeRecognition() {
        if (!('webkitSpeechRecognition' in window)) {
            document.getElementById('toggle-voice-command').disabled = true;
            document.getElementById('voice-status-text').textContent = 'Not Supported';
            console.error('Speech Recognition not supported in this browser.');
            return;
        }
        
        recognition = new webkitSpeechRecognition();
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
            if (CREDIT_CARD_CALCULATOR.DEBUG) console.log('Voice Command Received:', transcript);
            processVoiceCommand(transcript);
        };
    }
    
    /**
     * Processes the recognized voice command.
     */
    function processVoiceCommand(command) {
        let responseText = "Sorry, I didn't recognize that command.";
        
        if (command.includes('calculate') || command.includes('show results')) {
            document.getElementById('calculate-button').click();
            responseText = 'Calculating your payoff plan now.';
        } else if (command.includes('read insights') || command.includes('read advice')) {
            const insights = document.getElementById('ai-insights-content').textContent;
            responseText = `Here are your AI insights: ${insights.substring(0, 200)}...`; // Read first part
            showTab('ai-insights');
        } else if (command.includes('add card')) {
            document.getElementById('add-card-btn').click();
            responseText = 'Added a new card. Please fill in the details.';
        } else if (command.includes('set budget to') || command.includes('set payment to')) {
            const match = command.match(/(\d+[\s,]*\d*)/);
            if (match) {
                const budget = UTILS.parseNumber(match[0]);
                document.getElementById('monthly-payment').value = budget;
                responseText = `Setting total monthly payment to ${UTILS.formatCurrency(budget)}.`;
                updateCalculations();
            }
        } else if (command.includes('avalanche')) {
            document.getElementById('payoff-strategy').value = 'avalanche';
            responseText = 'Switching to Debt Avalanche strategy.';
            updateCalculations();
        } else if (command.includes('snowball')) {
            document.getElementById('payoff-strategy').value = 'snowball';
            responseText = 'Switching to Debt Snowball strategy.';
            updateCalculations();
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
            if (synth && synth.speaking) synth.cancel();
            try {
                recognition.start();
            } catch(e) {
                console.error("Voice recognition already active or error:", e);
                isListening = false;
            }
        }
    }

    /**
     * Toggles Text-to-Speech on or off.
     */
    function toggleTTS() {
        ttsActive = !ttsActive;
        const button = document.getElementById('toggle-text-to-speech');
        button.classList.toggle('tts-active', ttsActive);
        if (ttsActive) {
            UTILS.showToast('Text-to-Speech Enabled', 'info');
            speak('Text to Speech Enabled');
        } else {
            synth.cancel();
            UTILS.showToast('Text-to-Speech Disabled', 'info');
        }
    }
    
    return {
        initialize: initializeRecognition,
        toggleVoiceCommand,
        toggleTTS,
        speak,
    };
})();
// END SPEECH MODULE

/* ========================================================================== */
/* VIII. UI EVENT HANDLING & SETUP */
/* ========================================================================== */

/**
 * Shows the selected tab content and marks the button as active.
 * @param {string} tabId - The ID of the tab content to show.
 */
function showTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Show the selected tab content
    document.getElementById(tabId).classList.add('active');
    // Set the corresponding button as active
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
    
    // Special action for charts: ensure they resize correctly when shown
    if (tabId === 'strategy-comparison') {
        if (CREDIT_CARD_CALCULATOR.charts.strategyComparison) {
            CREDIT_CARD_CALCULATOR.charts.strategyComparison.resize();
        }
    }
}

/**
 * Dynamically adds a new card input group to the form.
 */
function addCard() {
    CREDIT_CARD_CALCULATOR.cardCounter++;
    const C = CREDIT_CARD_CALCULATOR.cardCounter;
    
    const container = document.getElementById('card-list-container');
    const newCard = document.createElement('div');
    newCard.className = 'card-input-group';
    newCard.innerHTML = `
        <button type="button" class="remove-card-btn" aria-label="Remove this card"><i class="fas fa-times"></i></button>
        <div class="input-group">
            <label for="card-name-${C}">Card Name (Optional)</label>
            <input type="text" id="card-name-${C}" class="card-name" placeholder="e.g., Capital One">
        </div>
        <div class="input-split">
            <div class="input-group">
                <label for="card-balance-${C}">Current Balance ($)</label>
                <input type="text" id="card-balance-${C}" class="card-balance" inputmode="numeric" aria-required="true">
            </div>
            <div class="input-group">
                <label for="card-apr-${C}">Interest Rate (APR %)</label>
                <input type="text" id="card-apr-${C}" class="card-apr" inputmode="decimal" aria-required="true">
            </div>
        </div>
        <div class="input-split">
            <div class="input-group">
                <label for="card-min-payment-${C}">Min. Payment ($)</label>
                <input type="text" id="card-min-payment-${C}" class="card-min-payment" inputmode="numeric" aria-required="true">
            </div>
            <div class="input-group min-payment-percent">
                <label for="card-min-percent-${C}">or (% of Balance)</label>
                <input type="text" id="card-min-percent-${C}" class="card-min-percent" inputmode="decimal" aria-label="Minimum Payment Percent">
            </div>
        </div>
        <span class="input-note">Enter either flat $ amount OR % of balance for min. payment.</span>
    `;
    
    container.appendChild(newCard);
    
    // Add event listener to the new remove button
    newCard.querySelector('.remove-card-btn').addEventListener('click', function() {
        newCard.remove();
        updateCalculations();
    });

    // Add input listeners to the new fields
    newCard.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', UTILS.debounce(updateCalculations, 400));
    });

    // Show remove button on the first card
    document.querySelector('.remove-card-btn').style.display = 'block';
}

/**
 * Toggles the visibility of the custom monthly payment input.
 */
function toggleMonthlyPaymentInput() {
    const strategy = document.getElementById('payoff-strategy').value;
    const paymentGroup = document.getElementById('monthly-payment-group');
    
    if (strategy === 'minimum') {
        paymentGroup.style.display = 'none';
    } else {
        paymentGroup.style.display = 'block';
    }
}

/**
 * Sets up all global event listeners.
 */
function setupEventListeners() {
    const form = document.getElementById('payoff-form');
    const inputs = form.querySelectorAll('input, select');
    
    // --- Form Submission Handler ---
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        updateCalculations();
    });
    
    // --- Live Input Change Handlers (Debounced) ---
    inputs.forEach(input => {
        input.addEventListener('input', UTILS.debounce(updateCalculations, 400));
    });
    
    // --- Strategy Change Handler ---
    document.getElementById('payoff-strategy').addEventListener('change', () => {
        toggleMonthlyPaymentInput();
        updateCalculations();
    });

    // --- Add/Remove Card Buttons ---
    document.getElementById('add-card-btn').addEventListener('click', addCard);
    // Note: Remove listeners are added dynamically in addCard()
    
    // --- UI Controls ---
    document.getElementById('toggle-color-scheme').addEventListener('click', toggleColorScheme);
    document.getElementById('toggle-voice-command').addEventListener('click', speech.toggleVoiceCommand);
    document.getElementById('toggle-text-to-speech').addEventListener('click', speech.toggleTTS);

    // --- Tab Switching ---
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            showTab(button.getAttribute('data-tab'));
        });
    });
}
// END EVENT LISTENERS SETUP

/* ========================================================================== */
/* X. DOCUMENT INITIALIZATION */
/* ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🇺🇸 FinGuid Debt Payoff Analyzer — AI‑Powered v1.0');
    console.log('📊 World\'s First AI-Powered Debt Calculator');
    console.log('🏦 Federal Reserve Data Integration: ACTIVE (Key: ...ada59a)');
    console.log('💰 Monetization & Affiliate Slots: ACTIVE');
    
    // 1. Initialize Core State and UI
    registerServiceWorker(); // For PWA functionality
    loadUserPreferences();
    speech.initialize();
    setupEventListeners();
    showPWAInstallPrompt();
    
    // 2. Set default tab views
    showTab('ai-insights'); 
    toggleMonthlyPaymentInput();
    
    // 3. Fetch Live Rate and Initial Calculation
    fredAPI.fetchLatestRate();
    updateCalculations(); // Run initial calculation with default values
    
    console.log('✅ Calculator initialized successfully!');
});
