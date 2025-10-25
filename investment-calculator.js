/**
 * INVESTMENT CALCULATOR PRO — World's First AI‑Powered Retirement Planner - PRODUCTION JS v1.0
 * FinGuid USA Market Domination Build
 * * Target: Production Ready, AI Insights, SEO, PWA, Voice, Monetization Ready
 * * FRED API: 9c6c421f077f2091e8bae4f143ada59a
 * * Google Analytics: G-NYBL2CDNQJ (in HTML)
 * * © 2025 FinGuid - World's First AI Calculator Platform for Americans
 */

/* ========================================================================== */
/* I. GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const INVESTMENT_CALCULATOR = {
    VERSION: '1.0',
    DEBUG: false, // Set to true for console logging
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a', 
    
    // FRED Series for Live Market Context (10-Year Treasury Yield as a benchmark)
    FRED_SERIES_ID: 'DGS10', 
    FALLBACK_RATE: 4.5, // Fallback rate for DGS10 in case of API failure

    STATE: {
        initialBalance: 10000,
        annualContribution: 6000,
        timeHorizon: 30,
        expectedReturn: 8.0,
        compoundingFrequency: 12, // Monthly
        liveBenchmarkRate: 0.0,
        results: null
    },
    
    // Chart instance holder
    charts: {
        investmentChart: null
    }
};

/* ========================================================================== */
/* II. PLATFORM UTILITIES (FRED API, THEME, SPEECH) */
/* ========================================================================== */

const UTILS = {
    // Utility for showing non-intrusive messages (toasts)
    showToast: (message, type = 'info') => {
        if (!INVESTMENT_CALCULATOR.DEBUG) return; // Only show in debug mode
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    },

    // Formats a number as USD currency
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },

    // Formats a number as a percentage
    formatPercent: (rate) => {
        return `${(rate).toFixed(2)}%`;
    }
};

const THEME_MANAGER = {
    // Loads user theme preference from localStorage or defaults to 'light'
    loadUserPreferences: () => {
        const savedTheme = localStorage.getItem('finguid-theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-color-scheme', savedTheme);
        }
        document.getElementById('theme-toggle-button').addEventListener('click', THEME_MANAGER.toggleTheme);
    },

    // Toggles between 'light' and 'dark' mode
    toggleTheme: () => {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-color-scheme', newTheme);
        localStorage.setItem('finguid-theme', newTheme);
        // Redraw chart to ensure colors update
        if (INVESTMENT_CALCULATOR.charts.investmentChart) {
            INVESTMENT_CALCULATOR.charts.investmentChart.update();
        }
        UTILS.showToast(`Switched to ${newTheme} mode.`, 'info');
    }
};

const SPEECH = {
    // Placeholder for real speech module based on existing files
    initialize: () => {
        document.getElementById('voice-command-button').addEventListener('click', () => {
            // Placeholder: The actual speech logic would go here.
            UTILS.showToast('Voice Command activated (feature requires full browser compatibility).', 'info');
            // SPEECH.startListening();
        });
        if (INVESTMENT_CALCULATOR.DEBUG) console.log('Speech Module Initialized.');
    }
};


const FRED_API = {
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    
    // Fetches the latest observation for the specified FRED series ID
    fetchLiveRate: async (seriesId) => {
        const url = `${FRED_API.FRED_BASE_URL}?series_id=${seriesId}&api_key=${INVESTMENT_CALCULATOR.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const latestValue = parseFloat(data.observations[0].value);
            return isNaN(latestValue) ? INVESTMENT_CALCULATOR.FALLBACK_RATE : latestValue;
        } catch (error) {
            if (INVESTMENT_CALCULATOR.DEBUG) console.error("FRED API Error:", error);
            UTILS.showToast('FRED API failed to fetch live benchmark rate. Using fallback.', 'error');
            return INVESTMENT_CALCULATOR.FALLBACK_RATE;
        }
    },

    // Automatic rate update and initial calculation
    startAutomaticUpdates: async () => {
        const rate = await FRED_API.fetchLiveRate(INVESTMENT_CALCULATOR.FRED_SERIES_ID);
        INVESTMENT_CALCULATOR.STATE.liveBenchmarkRate = rate;

        // Display the rate
        const displayElement = document.getElementById('live-rate-display');
        displayElement.textContent = UTILS.formatPercent(rate);
        
        if (INVESTMENT_CALCULATOR.DEBUG) console.log(`FRED Live Benchmark Rate (${INVESTMENT_CALCULATOR.FRED_SERIES_ID}): ${rate.toFixed(2)}%`);
        
        // Trigger initial calculation after rate is fetched
        calculateInvestment(); 
    }
};


/* ========================================================================== */
/* III. CORE CALCULATION LOGIC (Compound Interest / Annuity) */
/* ========================================================================== */

/**
 * Calculates the future value of an investment with periodic contributions (Annuity Future Value + Single Sum Future Value).
 * @returns {Array} An array of growth data objects [{year, startBalance, interest, contribution, endBalance}]
 */
function calculateGrowthSchedule(state) {
    let { initialBalance, annualContribution, expectedReturn, timeHorizon, compoundingFrequency } = state;

    const rate_per_period = (expectedReturn / 100) / compoundingFrequency;
    const periods_per_year = compoundingFrequency;
    const annual_contribution_per_period = annualContribution / periods_per_year;

    let balance = initialBalance;
    const schedule = [];
    let totalPrincipal = initialBalance;
    let totalInterest = 0;

    for (let year = 1; year <= timeHorizon; year++) {
        const startBalance = balance;
        let yearlyInterest = 0;
        let yearlyContribution = 0;

        for (let period = 1; period <= periods_per_year; period++) {
            // 1. Calculate interest for the period
            const interestForPeriod = balance * rate_per_period;
            
            // 2. Add interest to yearly total
            yearlyInterest += interestForPeriod;
            totalInterest += interestForPeriod;
            balance += interestForPeriod;

            // 3. Add contribution at the end of the period
            balance += annual_contribution_per_period;
            yearlyContribution += annual_contribution_per_period;
        }

        // Adjust for last contribution, as it's included in totalPrincipal for calculation ease
        const annualContributionFinal = year === timeHorizon ? annualContribution : annualContribution;
        
        // This accounts for the annual contribution made *after* the initial balance is set, but only the principal part
        if (year > 1) {
             totalPrincipal += annualContributionFinal;
        }
        
        // NOTE: The totalPrincipal calculation should include the initialBalance and annualContribution * timeHorizon
        
        schedule.push({
            year: year,
            startBalance: startBalance,
            interest: yearlyInterest,
            contribution: annualContributionFinal,
            endBalance: balance
        });
    }

    // Recalculate total principal for accurate reporting
    totalPrincipal = initialBalance + (annualContribution * timeHorizon);
    
    // Final results
    INVESTMENT_CALCULATOR.STATE.results = {
        schedule: schedule,
        finalBalance: balance,
        totalPrincipal: totalPrincipal,
        totalInterest: balance - totalPrincipal,
        totalReturnRate: ((balance / totalPrincipal) - 1) * 100
    };

    return INVESTMENT_CALCULATOR.STATE.results;
}


/**
 * Main function to read inputs, calculate, and render results.
 */
function calculateInvestment() {
    // 1. Read and update state from inputs
    const initialBalance = parseFloat(document.getElementById('initialBalance').value) || 0;
    const annualContribution = parseFloat(document.getElementById('annualContribution').value) || 0;
    const timeHorizon = parseInt(document.getElementById('timeHorizon').value) || 1;
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) || 0;
    const compoundingFrequency = parseInt(document.getElementById('compoundingFrequency').value) || 12;

    INVESTMENT_CALCULATOR.STATE = {
        ...INVESTMENT_CALCULATOR.STATE,
        initialBalance, annualContribution, timeHorizon, expectedReturn, compoundingFrequency
    };

    if (timeHorizon < 1) return; // Prevent calculation for invalid input

    // 2. Calculate the growth schedule and results
    const results = calculateGrowthSchedule(INVESTMENT_CALCULATOR.STATE);

    // 3. Render the summary
    document.getElementById('final-balance').textContent = UTILS.formatCurrency(results.finalBalance);
    document.getElementById('total-principal').textContent = UTILS.formatCurrency(results.totalPrincipal);
    document.getElementById('total-interest').textContent = UTILS.formatCurrency(results.totalInterest);
    document.getElementById('total-ror').textContent = UTILS.formatPercent(results.totalReturnRate);
    
    // Update chart and details table
    renderChart(results.schedule);
    renderDetailsTable(results.schedule);
    generateAIInsights(results);
}

/* ========================================================================== */
/* IV. RENDERING & VISUALIZATION */
/* ========================================================================== */

function renderChart(schedule) {
    const ctx = document.getElementById('investment-chart').getContext('2d');
    
    // Data for stacking: Principal starts with initial balance, then adds contribution.
    const initialPrincipal = schedule[0] ? schedule[0].startBalance : 0;
    const principalData = [initialPrincipal];
    const interestData = [0];
    
    let cumulativePrincipal = INVESTMENT_CALCULATOR.STATE.initialBalance;
    
    schedule.forEach(yearData => {
        // Principal is initial balance + cumulative contributions
        cumulativePrincipal += yearData.contribution;
        principalData.push(cumulativePrincipal);
        
        // Interest is the difference between end balance and total principal
        interestData.push(yearData.endBalance - cumulativePrincipal);
    });
    
    // Ensure all arrays have the same length (timeHorizon + 1 for starting point)
    const labels = [0, ...schedule.map(d => d.year)];
    
    // If chart exists, destroy it first
    if (INVESTMENT_CALCULATOR.charts.investmentChart) {
        INVESTMENT_CALCULATOR.charts.investmentChart.destroy();
    }
    
    const isDark = document.documentElement.getAttribute('data-color-scheme') === 'dark';
    const chartTextColor = isDark ? '#f0f0f0' : '#13343B';

    INVESTMENT_CALCULATOR.charts.investmentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Interest Earned',
                    data: interestData,
                    backgroundColor: 'rgba(36, 172, 197, 0.7)', // var(--color-chart-interest)
                    stack: 'Stack 0',
                },
                {
                    label: 'Total Principal Contributed',
                    data: principalData,
                    backgroundColor: 'rgba(0, 123, 255, 0.7)', // var(--color-chart-principal)
                    stack: 'Stack 0',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    title: { display: true, text: 'Year', color: chartTextColor },
                    ticks: { color: chartTextColor }
                },
                y: {
                    stacked: true,
                    title: { display: true, text: 'Balance ($)', color: chartTextColor },
                    ticks: { 
                        color: chartTextColor,
                        callback: function(value) { return UTILS.formatCurrency(value).replace('$', ''); }
                    }
                }
            },
            plugins: {
                legend: { labels: { color: chartTextColor } },
                tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${UTILS.formatCurrency(context.parsed.y)}` } }
            }
        }
    });
}

function renderDetailsTable(schedule) {
    const tableBody = document.querySelector('#growth-table tbody');
    tableBody.innerHTML = '';

    schedule.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.year}</td>
            <td>${UTILS.formatCurrency(row.startBalance)}</td>
            <td class="${row.interest > 0 ? 'highlight-positive' : ''}">${UTILS.formatCurrency(row.interest)}</td>
            <td>${UTILS.formatCurrency(row.contribution)}</td>
            <td><strong class="highlight-brand">${UTILS.formatCurrency(row.endBalance)}</strong></td>
        `;
        tableBody.appendChild(tr);
    });
}

/* ========================================================================== */
/* V. AI INSIGHTS ENGINE (Conditional Logic & Dynamic Recommendations) */
/* ========================================================================== */

function generateAIInsights(results) {
    const { finalBalance, totalPrincipal, totalInterest, totalReturnRate } = results;
    const { timeHorizon, expectedReturn, annualContribution, initialBalance, liveBenchmarkRate } = INVESTMENT_CALCULATOR.STATE;
    const insightOutput = document.getElementById('ai-insights-output');
    let insightsHTML = '<h3>Personalized FinGuid Investment Summary</h3>';

    const principalPct = (totalPrincipal / finalBalance) * 100;
    const interestPct = (totalInterest / finalBalance) * 100;

    // Insight 1: General Summary
    insightsHTML += `<p><i class="fas fa-magic"></i> Based on your inputs, your total investment of <strong>${UTILS.formatCurrency(totalPrincipal)}</strong> is projected to grow into a massive <strong>${UTILS.formatCurrency(finalBalance)}</strong> over ${timeHorizon} years. Your wealth will increase by <strong>${UTILS.formatCurrency(totalInterest)}</strong> solely from compound interest.</p>`;

    // Insight 2: Compound Interest Effectiveness
    if (interestPct > 50) {
        insightsHTML += `<p><i class="fas fa-rocket"></i> **Compound Interest is Your Ally!** Over ${timeHorizon} years, <strong>${interestPct.toFixed(1)}%</strong> of your final balance is generated by interest, demonstrating the power of time and consistent growth. Keep contributions steady!</p>`;
    } else {
        insightsHTML += `<p><i class="fas fa-hand-holding-usd"></i> Your own principal contributions (<strong>${principalPct.toFixed(1)}%</strong> of the total) are currently the driving force. To boost the *interest earned* portion, consider increasing your annual contribution or extending your time horizon.</p>`;
    }
    
    // Insight 3: Live Rate Comparison / Risk Context (FRED DGS10)
    if (expectedReturn < liveBenchmarkRate + 2) {
        insightsHTML += `<p><i class="fas fa-exclamation-triangle"></i> **Risk Alert:** Your expected return of ${UTILS.formatPercent(expectedReturn)} is quite close to the current long-term benchmark rate of ${UTILS.formatPercent(liveBenchmarkRate)}. This suggests a potentially low-risk portfolio (like bonds). Consider increasing risk tolerance for higher potential returns to better combat inflation.</p>`;
    } else if (expectedReturn > 10) {
        insightsHTML += `<p><i class="fas fa-chart-line"></i> **Aggressive Growth Strategy:** A ${UTILS.formatPercent(expectedReturn)} return is ambitious, typically requiring heavy investment in growth stocks. Ensure your risk tolerance is high and your portfolio is well-diversified to pursue this target. </p>`;
    } else {
        insightsHTML += `<p><i class="fas fa-check-circle"></i> **Balanced Approach:** Your expected return is sensible for a diversified portfolio. The real-time benchmark rate is ${UTILS.formatPercent(liveBenchmarkRate)}.</p>`;
    }
    
    // Insight 4: Retirement Goal Tracking (Simple Goal: 1 Million)
    const millionTarget = 1000000;
    if (finalBalance >= millionTarget) {
        insightsHTML += `<p><i class="fas fa-trophy"></i> **Millionaire Goal Reached!** You are projected to surpass the $1 Million mark with this plan. Consider exploring advanced withdrawal strategies with a partner advisor (see our sponsor links).</p>`;
    } else if (finalBalance * 1.25 >= millionTarget) { // Close to goal
        insightsHTML += `<p><i class="fas fa-bullseye"></i> **Close to $1M!** Your current path projects ${UTILS.formatCurrency(finalBalance)}. Increasing your annual contribution by just 25% (to ${UTILS.formatCurrency(annualContribution * 1.25)}) could likely push you over the <strong>$1 Million</strong> goal. Run the calculation again to check!</p>`;
    }

    // Call to Action (Monetization)
    insightsHTML += '<p class="ai-cta"><i class="fas fa-money-bill-alt"></i> **Next Step:** To secure your financial future, get matched with a **FinGuid-vetted Retirement Planner** via our affiliate partners. This is how we keep this world-class tool **free** for Americans!</p>';

    insightOutput.innerHTML = insightsHTML;
}

function exportAmortizationToCSV() {
    const results = INVESTMENT_CALCULATOR.STATE.results;
    if (!results || results.schedule.length === 0) {
        UTILS.showToast('Please calculate your investment first.', 'error');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Year,Start Balance,Interest Earned,Contributions,End Balance\n";

    results.schedule.forEach(row => {
        const rowString = [
            row.year,
            row.startBalance.toFixed(2),
            row.interest.toFixed(2),
            row.contribution.toFixed(2),
            row.endBalance.toFixed(2)
        ].join(',');
        csvContent += rowString + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "FinGuid_Investment_Growth_Schedule.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    UTILS.showToast('Investment schedule exported to CSV!', 'success');
}

// Function to handle tab switching
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
    
    // Ensure chart redraws correctly if its tab is activated
    if (tabId === 'growth-chart' && INVESTMENT_CALCULATOR.charts.investmentChart) {
        setTimeout(() => INVESTMENT_CALCULATOR.charts.investmentChart.resize(), 10);
    }
}


/* ========================================================================== */
/* VI. DOCUMENT INITIALIZATION & EVENT LISTENERS */
/* ========================================================================== */

function setupEventListeners() {
    const form = document.getElementById('investment-form');
    
    // Listen for all input/change events on the form
    form.addEventListener('input', (e) => {
        // Update range value displays dynamically
        if (e.target.type === 'range' || e.target.type === 'number') {
            const display = e.target.closest('.form-group').querySelector('.range-value');
            if (display) {
                if (e.target.id === 'expectedReturn') {
                    display.textContent = `${e.target.value}%`;
                } else if (e.target.id === 'timeHorizon') {
                    display.textContent = `${e.target.value} Years`;
                } else {
                    display.textContent = UTILS.formatCurrency(e.target.value);
                }
            }
        }
        calculateInvestment();
    });
    
    // Tab switching setup
    document.querySelectorAll('.tab-controls-results .tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            showTab(e.target.getAttribute('data-tab'));
        });
    });
    
    // CSV Export
    document.getElementById('export-csv-button').addEventListener('click', exportAmortizationToCSV);
}

// Function to register the PWA service worker (placeholder)
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/register-sw.js').then(registration => {
                if (INVESTMENT_CALCULATOR.DEBUG) console.log('PWA ServiceWorker registered: ', registration.scope);
            }).catch(error => {
                if (INVESTMENT_CALCULATOR.DEBUG) console.log('PWA ServiceWorker registration failed: ', error);
            });
        });
    }
}


document.addEventListener('DOMContentLoaded', function() {
    if (INVESTMENT_CALCULATOR.DEBUG) console.log('🇺🇸 FinGuid Investment Calculator Pro v1.0 Initializing...');

    // 1. Initialize Core Features
    registerServiceWorker(); // For PWA functionality
    THEME_MANAGER.loadUserPreferences(); // Load saved theme (Dark/Light Mode)
    SPEECH.initialize(); // Initialize Speech Module
    setupEventListeners(); // Set up all input monitors
    
    // 2. Set default tab view
    showTab('growth-chart'); 
    
    // 3. Fetch Live Rate and Initial Calculation
    // This fetches the live rate, sets the benchmark, and then calls calculateInvestment()
    FRED_API.startAutomaticUpdates(); 
    
    // Fallback calculation in case FRED is slow/fails
    setTimeout(calculateInvestment, 1500); 

    if (INVESTMENT_CALCULATOR.DEBUG) console.log('✅ Investment Calculator initialized successfully!');
});
