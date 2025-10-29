/**
 * INVESTMENT CALCULATOR — AI‑POWERED GROWTH & GOAL PLANNER - PRODUCTION JS v1.0
 * FinGuid USA Market Domination Build - World's First AI-Powered Investment Calculator
 * * Target: Production Ready, AI Insights, SEO, PWA, Voice, Monetization Ready
 * * Features Implemented:
 * ✅ Compound Interest Calculation (Lump Sum + Contributions)
 * ✅ Goal Planning Modes (Time to Goal, Contribution Needed)
 * ✅ Live Inflation Adjustment (FRED API: CPIAUCSL)
 * ✅ Dynamic Charting (Chart.js: Growth, Contributions, Inflation Impact)
 * ✅ Dynamic AI-Powered Insights Engine (Monetization Focused)
 * ✅ Voice Control & Text-to-Speech Stubs
 * ✅ Light/Dark Mode Toggling & User Preferences Storage
 * ✅ PWA Ready Setup
 * ✅ Data Table & CSV Export
 * * FRED API Key: 9c6c421f077f2091e8bae4f143ada59a
 * * © 2025 FinGuid - World's First AI Calculator Platform for Americans
 */

/* ========================================================================== */
/* I. GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const INVESTMENT_CALCULATOR = {
    VERSION: '1.0',
    DEBUG: false,

    // FRED API Configuration (Real Key)
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    FRED_INFLATION_SERIES_ID: 'CPIAUCSL', // Consumer Price Index for All Urban Consumers
    RATE_UPDATE_INTERVAL: 12 * 60 * 60 * 1000, // 12 hours (Inflation data updates less frequently)
    FALLBACK_INFLATION_RATE: 3.0, // Fallback inflation rate

    // Core State - Stores inputs and calculated results
    STATE: {
        // Inputs (Defaults)
        calculationMode: 'calc-fv', // 'calc-fv', 'calc-goal-time', 'calc-goal-contribution'
        initialInvestment: 10000,
        monthlyContribution: 500,
        yearsToGrow: 20,
        expectedReturnRate: 7.0, // %
        financialGoal: 1000000,
        inflationRate: 3.0, // % - Updated by FRED

        // Results
        futureValue: 0,
        totalPrincipal: 0,
        totalGains: 0,
        inflationAdjustedFV: 0,
        yearsToGoal: null,
        contributionNeeded: null,
        annualData: [], // Detailed breakdown per year
    },

    charts: {
        investmentGrowthChart: null,
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

     function formatNumber(num, decimals = 0) {
        if (typeof num !== 'number' || isNaN(num)) return '0';
        return num.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    }

    function formatPercent(rate) {
         if (typeof rate !== 'number' || isNaN(rate)) return '0.0%';
        return rate.toFixed(1) + '%';
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

    return { formatCurrency, formatNumber, formatPercent, parseInput, debounce, showToast };
})();
// END UTILITY & FORMATTING MODULE

/* ========================================================================== */
/* III. DATA LAYER: FRED API MODULE (Inflation Rate) */
/* ========================================================================== */

const fredAPI = (function() {
    async function fetchLatestInflationRate() {
        if (INVESTMENT_CALCULATOR.DEBUG) {
            console.warn('DEBUG MODE: Using mock Inflation rate.');
            return INVESTMENT_CALCULATOR.FALLBACK_INFLATION_RATE;
        }

        const url = new URL(INVESTMENT_CALCULATOR.FRED_BASE_URL);
        const params = {
            series_id: INVESTMENT_CALCULATOR.FRED_INFLATION_SERIES_ID,
            api_key: INVESTMENT_CALCULATOR.FRED_API_KEY,
            file_type: 'json',
            sort_order: 'desc',
            limit: 13, // Get 13 months to calculate YoY change
            observation_start: new Date(Date.now() - 14 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Approx 14 months ago
        };
        url.search = new URLSearchParams(params).toString();

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`FRED API returned status: ${response.status}`);
            }
            const data = await response.json();

            const observations = data.observations.filter(obs => obs.value !== '.' && obs.value !== 'N/A').reverse(); // oldest first

            if (observations.length >= 13) {
                const latestValue = parseFloat(observations[observations.length - 1].value);
                const priorYearValue = parseFloat(observations[observations.length - 13].value);
                const inflationRate = ((latestValue - priorYearValue) / priorYearValue) * 100;

                const rate = Math.max(0, inflationRate); // Ensure rate is not negative
                document.getElementById('inflation-rate').value = rate.toFixed(1);
                document.querySelector('#inflation-rate + .fred-source-note').textContent = `Live FRED Rate (${observations[observations.length - 1].date})`;
                console.log(`📈 FRED Inflation Rate updated: ${rate.toFixed(1)}%`);
                 if (INVESTMENT_CALCULATOR.DEBUG) UTILS.showToast(`Live Inflation Rate updated to ${rate.toFixed(1)}%`, 'success');
                return rate;
            } else {
                throw new Error('Not enough valid observations found in FRED data.');
            }
        } catch (error) {
            console.error('FRED Inflation API Error, using fallback rate:', error);
            document.getElementById('inflation-rate').value = INVESTMENT_CALCULATOR.FALLBACK_INFLATION_RATE.toFixed(1);
            document.querySelector('#inflation-rate + .fred-source-note').textContent = `Fallback Rate (${INVESTMENT_CALCULATOR.FALLBACK_INFLATION_RATE.toFixed(1)}%)`;
             if (INVESTMENT_CALCULATOR.DEBUG) UTILS.showToast('Could not fetch live inflation rate. Using fallback.', 'error');
            return INVESTMENT_CALCULATOR.FALLBACK_INFLATION_RATE;
        }
    }

    function startAutomaticUpdates() {
        fetchLatestInflationRate().then(rate => {
            INVESTMENT_CALCULATOR.STATE.inflationRate = rate;
            updateCalculations(); // Initial calculation after fetching rate
        });
        setInterval(async () => {
             const rate = await fetchLatestInflationRate();
             INVESTMENT_CALCULATOR.STATE.inflationRate = rate;
             // Optionally trigger re-calculation if rate changes significantly
             // updateCalculations();
        }, INVESTMENT_CALCULATOR.RATE_UPDATE_INTERVAL);
    }
    return { startAutomaticUpdates };
})();
// END FRED API MODULE


/* ========================================================================== */
/* IV. CORE CALCULATION ENGINE (Compound Interest & Goal Planning) */
/* ========================================================================== */

/**
 * Main calculation function dispatcher based on selected mode.
 */
function updateCalculations() {
    const S = INVESTMENT_CALCULATOR.STATE;

    // Determine calculation mode
    S.calculationMode = document.querySelector('.input-tabs .tab-button.active').getAttribute('data-tab');

    // Get common inputs
    S.inflationRate = UTILS.parseInput('inflation-rate');

    // Get mode-specific inputs and run calculation
    if (S.calculationMode === 'calc-fv') {
        S.initialInvestment = UTILS.parseInput('initial-investment');
        S.monthlyContribution = UTILS.parseInput('monthly-contribution');
        S.yearsToGrow = UTILS.parseInput('years-to-grow');
        S.expectedReturnRate = UTILS.parseInput('expected-return-rate');
        calculateFutureValue();
    } else { // Goal Planning modes share many inputs
        S.financialGoal = UTILS.parseInput('financial-goal');
        S.initialInvestment = UTILS.parseInput('initial-investment-goal');
        S.expectedReturnRate = UTILS.parseInput('expected-return-rate-goal');
         if (S.calculationMode === 'calc-goal-time') {
            S.monthlyContribution = UTILS.parseInput('monthly-contribution-goal');
            calculateTimeToGoal();
        } else if (S.calculationMode === 'calc-goal-contribution') {
            S.yearsToGrow = UTILS.parseInput('years-to-grow-goal');
            calculateContributionNeeded();
        }
    }

    // Update UI elements common to all modes
    updateResultsDisplay();
    generateAIInsights();
    updateChart();
    updateDataTable();
}

/**
 * Calculates future value based on current state inputs.
 */
function calculateFutureValue() {
    const S = INVESTMENT_CALCULATOR.STATE;
    if (S.yearsToGrow <= 0 || S.expectedReturnRate < 0) return;

    const r = S.expectedReturnRate / 100; // Annual rate as decimal
    const n = S.yearsToGrow;
    const initial = S.initialInvestment;
    const pmt = S.monthlyContribution * 12; // Annual contribution

    let futureValue = initial * Math.pow(1 + r, n); // FV of initial investment
    if (r > 0) {
        futureValue += pmt * ( (Math.pow(1 + r, n) - 1) / r ); // FV of annual contributions
    } else {
         futureValue += pmt * n; // Simple sum if rate is 0
    }


    const totalPrincipal = initial + (pmt * n);
    const totalGains = futureValue - totalPrincipal;

    // Inflation Adjustment
    const i = S.inflationRate / 100;
    const inflationAdjustedFV = futureValue / Math.pow(1 + i, n);

    S.futureValue = futureValue;
    S.totalPrincipal = totalPrincipal;
    S.totalGains = totalGains;
    S.inflationAdjustedFV = inflationAdjustedFV;
    S.yearsToGoal = null; // Clear goal-specific results
    S.contributionNeeded = null;

    // Generate Annual Data for Chart/Table
    generateAnnualData(initial, pmt, r, n, i);
}

/**
 * Calculates the number of years needed to reach a financial goal.
 * Uses an iterative approach as solving for 'n' algebraically is complex.
 */
function calculateTimeToGoal() {
    const S = INVESTMENT_CALCULATOR.STATE;
     if (S.financialGoal <= S.initialInvestment || S.expectedReturnRate < 0) {
        S.yearsToGoal = 0; // Already reached or invalid rate
        S.futureValue = S.initialInvestment;
        S.totalPrincipal = S.initialInvestment;
        S.totalGains = 0;
        S.inflationAdjustedFV = S.initialInvestment;
        S.contributionNeeded = null;
        S.annualData = [];
        return;
     }
     if (S.monthlyContribution <= 0 && S.initialInvestment * (1 + S.expectedReturnRate / 100) <= S.initialInvestment) {
        S.yearsToGoal = Infinity; // Goal unreachable if no growth and no contributions
        S.futureValue = S.initialInvestment;
        S.totalPrincipal = S.initialInvestment;
        S.totalGains = 0;
        S.inflationAdjustedFV = S.initialInvestment;
        S.contributionNeeded = null;
        S.annualData = [];
         UTILS.showToast("Goal may be unreachable with current inputs.", "error");
        return;
     }

    const r = S.expectedReturnRate / 100;
    const initial = S.initialInvestment;
    const pmt = S.monthlyContribution * 12;
    const goal = S.financialGoal;
    const i = S.inflationRate / 100;

    let years = 0;
    let currentFV = initial;
    const maxYears = 100; // Prevent infinite loop

    S.annualData = [];
     let balance = initial;

    while (currentFV < goal && years < maxYears) {
        years++;
         const annualInterest = balance * r;
         balance = (balance + pmt) * (1 + r); // Add contribution then apply interest
         currentFV = balance; // FV at end of year

         const inflationAdjusted = currentFV / Math.pow(1 + i, years);
         S.annualData.push({
             year: years,
             startBalance: balance / (1+r) - pmt, // Approx start balance
             contributions: pmt,
             interestEarned: annualInterest, // Approx interest earned
             endBalance: currentFV,
             inflationAdjustedBalance: inflationAdjusted
         });

    }

    if (years >= maxYears) {
         S.yearsToGoal = Infinity; // Consider unreachable
         UTILS.showToast("Goal may take over 100 years to reach.", "error");
    } else {
        S.yearsToGoal = years;
        S.yearsToGrow = years; // Update yearsToGrow for consistency
        // Recalculate final values precisely for the determined number of years
        calculateFutureValue(); // This updates FV, principal, gains, adjusted FV
    }
     S.contributionNeeded = null; // Clear other goal result
}

/**
 * Calculates the monthly contribution needed to reach a goal in a set time.
 */
function calculateContributionNeeded() {
    const S = INVESTMENT_CALCULATOR.STATE;
    if (S.yearsToGrow <= 0 || S.expectedReturnRate < 0 || S.financialGoal <= 0) return;


    const r = S.expectedReturnRate / 100; // Annual rate
    const n = S.yearsToGrow;
    const initial = S.initialInvestment;
    const goal = S.financialGoal;
    const i = S.inflationRate / 100;

    const fvInitial = initial * Math.pow(1 + r, n); // FV of initial investment

    let pmt = 0; // Annual contribution needed
     if (fvInitial >= goal) {
        pmt = 0; // Initial amount already meets the goal
        S.contributionNeeded = 0;
     } else if (r > 0) {
        const fvAnnuityFactor = (Math.pow(1 + r, n) - 1) / r;
        pmt = (goal - fvInitial) / fvAnnuityFactor;
        S.contributionNeeded = pmt / 12;
    } else { // Rate is 0
         pmt = (goal - initial) / n;
         S.contributionNeeded = pmt / 12;
    }
    S.contributionNeeded = Math.max(0, S.contributionNeeded); // Cannot be negative

    // Update state for consistency and generate annual data
    S.monthlyContribution = S.contributionNeeded;
    calculateFutureValue(); // Calculate FV, gains, etc. based on the needed contribution
    S.yearsToGoal = null; // Clear other goal result
}


/**
 * Generates year-by-year data for the chart and table.
 */
function generateAnnualData(initial, pmt, r, n, i) {
    const S = INVESTMENT_CALCULATOR.STATE;
    S.annualData = [];
    let balance = initial;

    for (let year = 1; year <= n; year++) {
        const startBalance = balance;
        const interestEarned = balance * r;
        balance = (balance + pmt) * (1 + r); // Add contribution then apply interest

        const inflationAdjusted = balance / Math.pow(1 + i, year);

        S.annualData.push({
            year: year,
            startBalance: startBalance,
            contributions: pmt,
            interestEarned: interestEarned + pmt *r, // Interest on balance + interest on contributions (approx)
            endBalance: balance,
            inflationAdjustedBalance: inflationAdjusted
        });
    }
}

/* ========================================================================== */
/* V. AI INSIGHTS ENGINE (Monetization Focused) */
/* ========================================================================== */

function generateAIInsights() {
    const S = INVESTMENT_CALCULATOR.STATE;
    const output = document.getElementById('ai-insights-output');
    let html = `<h4><i class="fas fa-robot"></i> FinGuid AI Investment Advisor:</h4>`;

     // Ensure calculations have run and results are valid
     if (S.futureValue <= 0 && S.initialInvestment > 0) {
        output.innerHTML = '<p class="placeholder-text">Enter valid investment parameters to generate AI analysis...</p>';
        return;
    }

    const goalMet = S.calculationMode !== 'calc-fv' && S.futureValue >= S.financialGoal;
    const timeHorizon = S.yearsToGrow;
    const finalFV = S.futureValue;
    const finalAdjustedFV = S.inflationAdjustedFV;
    const gainsRatio = S.totalGains / finalFV;

    // --- Core Verdict based on Goal (if applicable) ---
    if (S.calculationMode === 'calc-goal-time' || S.calculationMode === 'calc-goal-contribution') {
        if (S.yearsToGoal === Infinity || S.contributionNeeded >= (S.annualSalary || 75000)/12 * 0.5 ) { // Assuming high needed contribution relative to typical salary
            html += `<p class="negative-insight">**Goal Alert: Current plan seems unrealistic.** Reaching ${UTILS.formatCurrency(S.financialGoal)} may take too long or require very high contributions. Consider adjusting your goal, increasing your return rate assumption, or extending your timeline.</p>`;
        } else if (goalMet || S.yearsToGoal > 0 || S.contributionNeeded > 0) {
             html += `<p class="positive-insight">**Goal Status: On Track!** Your plan projects you can reach your goal of ${UTILS.formatCurrency(S.financialGoal)}. See results for details on time or contribution needed.</p>`;
        }
    } else {
        // General FV projection comment
         html += `<p>Your projection shows a future value of **${UTILS.formatCurrency(finalFV)}**. After adjusting for inflation, the estimated value in today's dollars is **${UTILS.formatCurrency(finalAdjustedFV)}**.</p>`;
    }


    // --- Actionable/Monetization Insights ---
    html += `<h4>Strategic Analysis & Recommendations:</h4>`;
    let insightsAdded = 0;

    // 1. Impact of Inflation
    if (finalFV > 0 && (finalFV - finalAdjustedFV) / finalFV > 0.3 && timeHorizon > 10) { // If inflation erodes > 30%
        insightsAdded++;
        html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-arrow-trend-down"></i> **Inflation Impact Warning**
            </div>
            <p>Inflation is projected to erode over **${UTILS.formatPercent((finalFV - finalAdjustedFV) / finalFV * 100)}** of your future value over ${timeHorizon} years. To combat this, aim for investments with returns significantly higher than the ${UTILS.formatPercent(S.inflationRate)} inflation rate.</p>
            <p><strong><i class="fas fa-handshake"></i> Affiliate Recommendation:</strong> Explore growth-oriented investments like diversified stock market ETFs. <a href="#" target="_blank" rel="noopener affiliate">Compare top US brokerage accounts offering low-cost ETFs.</a></p>
        `;
    }

    // 2. Power of Compounding (if gains are > 50% of FV)
    if (gainsRatio > 0.5 && timeHorizon >= 15) {
        insightsAdded++;
        html += `
            <div class="recommendation-alert low-priority">
                <i class="fas fa-seedling"></i> **Power of Compounding is Working!**
            </div>
            <p>Over **${UTILS.formatPercent(gainsRatio * 100)}** of your projected future value comes from compound gains, not just your contributions! The longer you invest, the more powerful this effect becomes.</p>
             <p><strong><i class="fas fa-handshake"></i> Sponsor Recommendation:</strong> Maximize compounding by contributing consistently. Consider automating your investments. <a href="#" target="_blank" rel="noopener sponsored">Learn about automated investing with our partner Robo-Advisors.</a></p>
       `;
    }

    // 3. Low Contribution Alert
    if (S.monthlyContribution < 100 && S.initialInvestment < 5000) {
        insightsAdded++;
         html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-triangle-exclamation"></i> **Opportunity: Increase Contributions**
            </div>
            <p>Your current monthly contribution of **${UTILS.formatCurrency(S.monthlyContribution)}** is low. Even small increases can significantly impact your future value due to compounding. Aim for 10-15% of your income if possible.</p>
            <p><strong><i class="fas fa-handshake"></i> Affiliate Recommendation:</strong> Find ways to save more. <a href="#" target="_blank" rel="noopener affiliate">Explore top budgeting apps to optimize your spending.</a></p>
        `;
    }

    // 4. Rate of Return Reality Check
     if (S.expectedReturnRate > 12.0) {
        insightsAdded++;
         html += `
            <div class="recommendation-alert high-priority">
                <i class="fas fa-magnifying-glass-chart"></i> **Expectation Check: High Return Rate**
            </div>
            <p>An expected annual return of **${UTILS.formatPercent(S.expectedReturnRate)}** is very optimistic and historically difficult to sustain consistently. Consider using a more conservative rate (e.g., 7-10%) for planning.</p>
             <p><strong><i class="fas fa-handshake"></i> Sponsor Recommendation:</strong> Understand investment risk. <a href="#" target="_blank" rel="noopener sponsored">Connect with a financial advisor to create a realistic portfolio strategy.</a></p>
       `;
    } else if (S.expectedReturnRate < S.inflationRate + 1) {
         insightsAdded++;
         html += `
             <div class="recommendation-alert medium-priority">
                 <i class="fas fa-arrow-down"></i> **Growth Alert: Low Return Rate vs. Inflation**
             </div>
             <p>Your expected return (**${UTILS.formatPercent(S.expectedReturnRate)}**) is barely outpacing inflation (**${UTILS.formatPercent(S.inflationRate)}**). Your money's purchasing power may not grow significantly. Explore options to potentially increase returns while managing risk.</p>
             <p><strong><i class="fas fa-handshake"></i> Affiliate Recommendation:</strong> Diversification is key. <a href="#" target="_blank" rel="noopener affiliate">Explore investment options beyond basic savings accounts with our partner brokers.</a></p>
         `;
     }


    // 5. Short Time Horizon Issue (for large goals)
    if (timeHorizon < 5 && S.financialGoal > S.initialInvestment * 2 && S.calculationMode !== 'calc-fv') {
        insightsAdded++;
         html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-clock"></i> **Timeline Alert: Short Horizon for Goal**
            </div>
            <p>Reaching a significant financial goal in under 5 years often requires very high contributions or assumes high-risk, high-return investments. Ensure your plan is realistic.</p>
       `;
    }

    // Fallback / General Advice
     if (insightsAdded === 0) {
        html += `
            <div class="recommendation-alert low-priority">
                <i class="fas fa-check-circle"></i> **Solid Foundation**
            </div>
            <p>Your investment parameters appear reasonable. Consistency and time are your greatest allies in building wealth.</p>
            <p><strong><i class="fas fa-handshake"></i> Next Step:</strong> Consider tax-advantaged accounts like IRAs or 401(k)s to maximize your growth. <a href="#" target="_blank" rel="noopener affiliate">Learn more about retirement accounts with our partner resources.</a></p>
        `;
    }


    output.innerHTML = html;
}

/* ========================================================================== */
/* VI. CHARTING MODULE (Investment Growth) */
/* ========================================================================== */

function updateChart() {
    const S = INVESTMENT_CALCULATOR.STATE;
    const ctx = document.getElementById('investmentGrowthChart').getContext('2d');

    if (!S.annualData || S.annualData.length === 0) {
        // Clear or hide chart if no data
        if (INVESTMENT_CALCULATOR.charts.investmentGrowthChart) {
            INVESTMENT_CALCULATOR.charts.investmentGrowthChart.destroy();
            INVESTMENT_CALCULATOR.charts.investmentGrowthChart = null;
        }
        // Optionally display placeholder
        // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        // ctx.fillText('Enter data to generate chart.', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    const labels = S.annualData.map(d => `Year ${d.year}`);
    const totalValueData = S.annualData.map(d => d.endBalance);
    const principalData = S.annualData.map((d, i) => S.initialInvestment + d.contributions * (i + 1));
    const inflationAdjustedData = S.annualData.map(d => d.inflationAdjustedBalance);


    if (INVESTMENT_CALCULATOR.charts.investmentGrowthChart) {
        INVESTMENT_CALCULATOR.charts.investmentGrowthChart.destroy();
    }

    const isDarkMode = document.documentElement.getAttribute('data-color-scheme') === 'dark';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDarkMode ? 'white' : 'black';

    INVESTMENT_CALCULATOR.charts.investmentGrowthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Value (Nominal)',
                    data: totalValueData,
                    borderColor: 'var(--color-chart-total)',
                    backgroundColor: 'rgba(19, 52, 59, 0.1)', // Corresponds to --color-primary lightened
                    fill: true,
                    tension: 0.1,
                     yAxisID: 'y-value',
                },
                {
                    label: 'Total Principal Invested',
                    data: principalData,
                    borderColor: 'var(--color-chart-principal)',
                     borderDash: [5, 5],
                    fill: false,
                    tension: 0.1,
                     yAxisID: 'y-value',
                },
                 {
                    label: 'Value (Inflation-Adjusted)',
                    data: inflationAdjustedData,
                    borderColor: 'var(--color-chart-inflation)',
                    fill: false,
                    tension: 0.1,
                     yAxisID: 'y-value',
                     hidden: S.inflationRate <= 0 // Hide if inflation is zero
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
             interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { labels: { color: textColor } },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${UTILS.formatCurrency(context.parsed.y)}`
                    }
                }
            },
            scales: {
                y: { // Renamed from 'y-value' for simplicity if only one axis needed
                    title: { display: true, text: 'Value ($)', color: textColor },
                    ticks: { color: textColor, callback: (value) => UTILS.formatCurrency(value / 1000) + 'K' },
                    grid: { color: gridColor },
                    beginAtZero: true
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
/* VII. DATA TABLE & EXPORT */
/* ========================================================================== */

function updateDataTable() {
    const S = INVESTMENT_CALCULATOR.STATE;
    const tableBody = document.querySelector('#annual-data-table tbody');
    tableBody.innerHTML = ''; // Clear previous data

    if (!S.annualData || S.annualData.length === 0) {
        // Optionally display a placeholder row
         tableBody.innerHTML = '<tr><td colspan="6">No data to display. Enter parameters and calculate.</td></tr>';
        return;
    }

    const fragment = document.createDocumentFragment();
    S.annualData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.year}</td>
            <td>${UTILS.formatCurrency(item.startBalance)}</td>
            <td>${UTILS.formatCurrency(item.contributions)}</td>
            <td>${UTILS.formatCurrency(item.interestEarned)}</td>
            <td>${UTILS.formatCurrency(item.endBalance)}</td>
            <td>${UTILS.formatCurrency(item.inflationAdjustedBalance)}</td>
        `;
        fragment.appendChild(row);
    });
    tableBody.appendChild(fragment);
}

function exportDataToCSV() {
    const S = INVESTMENT_CALCULATOR.STATE;
    if (!S.annualData || S.annualData.length === 0) {
        UTILS.showToast('No data available to export.', 'error');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    const header = ['Year', 'Start Balance ($)', 'Contributions ($)', 'Interest Earned ($)', 'End Balance ($)', 'Inflation Adjusted Balance ($)'];
    csvContent += header.join(',') + '\n';

    S.annualData.forEach(item => {
        const row = [
            item.year,
            item.startBalance.toFixed(2),
            item.contributions.toFixed(2),
            item.interestEarned.toFixed(2),
            item.endBalance.toFixed(2),
            item.inflationAdjustedBalance.toFixed(2),
        ];
        csvContent += row.join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `investment_projection_${S.yearsToGrow}yrs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    UTILS.showToast('Annual data exported to CSV!', 'success');
}


/* ========================================================================== */
/* VIII. UI UPDATER & DISPLAY */
/* ========================================================================== */

function updateResultsDisplay() {
    const S = INVESTMENT_CALCULATOR.STATE;
    const fvSummary = document.getElementById('future-value-total');
    const fvSummaryDetails = document.getElementById('investment-summary-details');
    const inflationAdjSummary = document.getElementById('inflation-adjusted-value');
    const goalSummary = document.getElementById('goal-results-summary');
    const goalFigure = document.getElementById('goal-result-figure');
    const goalUnit = document.getElementById('goal-result-unit');
    const goalDetails = document.getElementById('goal-details-summary');


    // Update FV Summary (always visible but might show $0)
    fvSummary.textContent = UTILS.formatCurrency(S.futureValue);
    fvSummaryDetails.innerHTML = `Total Principal: ${UTILS.formatCurrency(S.totalPrincipal)} | Total Gains: ${UTILS.formatCurrency(S.totalGains)}`;
     inflationAdjSummary.innerHTML = `Inflation-Adjusted: ${UTILS.formatCurrency(S.inflationAdjustedFV)} <span class="input-note">(in today's dollars, assuming ${UTILS.formatPercent(S.inflationRate)} inflation)</span>`;

     // Update Goal Summary (conditionally visible)
    goalSummary.classList.add('hidden'); // Hide by default
    if (S.calculationMode === 'calc-goal-time' && S.yearsToGoal !== null) {
        goalSummary.classList.remove('hidden');
        if(S.yearsToGoal === Infinity) {
             goalFigure.textContent = 'Never';
             goalUnit.textContent = '';
             goalDetails.textContent = 'Goal may be unreachable with current inputs.';
        } else {
             goalFigure.textContent = UTILS.formatNumber(S.yearsToGoal);
             goalUnit.textContent = S.yearsToGoal === 1 ? 'Year' : 'Years';
             goalDetails.textContent = `To reach ${UTILS.formatCurrency(S.financialGoal)}`;
        }

    } else if (S.calculationMode === 'calc-goal-contribution' && S.contributionNeeded !== null) {
        goalSummary.classList.remove('hidden');
         goalFigure.textContent = UTILS.formatCurrency(S.contributionNeeded, true);
         goalUnit.textContent = '/ month';
         goalDetails.textContent = `Needed for ${UTILS.formatNumber(S.yearsToGrow)} years to reach ${UTILS.formatCurrency(S.financialGoal)}`;
    }

     // Hide/Show relevant summaries
    if (S.calculationMode === 'calc-fv') {
        document.querySelector('.summary-card:not(.goal-summary)').classList.remove('hidden');
        goalSummary.classList.add('hidden');
    } else {
         document.querySelector('.summary-card:not(.goal-summary)').classList.add('hidden'); // Hide standard FV summary when goal planning
        // Goal summary visibility handled above
    }
}


/* ========================================================================== */
/* IX. THEME MANAGER, PWA, VOICE (Reused FinGuid Modules - Stubs) */
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
        if (INVESTMENT_CALCULATOR.charts.investmentGrowthChart) updateChart(); // Redraw chart
    }
    return { loadUserPreferences, toggleColorScheme };
})();


const SPEECH = (function() {
    // Basic stubs - integrate actual Web Speech API if needed
     function initialize() {
        document.getElementById('toggle-voice-command').addEventListener('click', () => {
             UTILS.showToast('Voice Command activated (stub).', 'info');
             document.getElementById('toggle-voice-command').classList.toggle('voice-active');
              document.getElementById('voice-status-text').textContent = document.getElementById('toggle-voice-command').classList.contains('voice-active') ? 'Voice ON' : 'Voice OFF';

        });
        document.getElementById('toggle-text-to-speech').addEventListener('click', (e) => {
            const isActive = e.currentTarget.classList.toggle('tts-active');
             e.currentTarget.classList.toggle('tts-inactive', !isActive);
             UTILS.showToast(isActive ? 'Text-to-Speech active (stub).' : 'Text-to-Speech inactive.', 'info');
        });
    }
    return { initialize };
})();


function showPWAInstallPrompt() {
    const installButton = document.getElementById('pwa-install-button');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        INVESTMENT_CALCULATOR.deferredInstallPrompt = e;
        installButton.classList.remove('hidden');
    });
    installButton.addEventListener('click', () => {
        if (INVESTMENT_CALCULATOR.deferredInstallPrompt) {
            INVESTMENT_CALCULATOR.deferredInstallPrompt.prompt();
            INVESTMENT_CALCULATOR.deferredInstallPrompt.userChoice.then((choice) => {
                if (choice.outcome === 'accepted') UTILS.showToast('FinGuid App Installed!', 'success');
                INVESTMENT_CALCULATOR.deferredInstallPrompt = null;
                installButton.classList.add('hidden');
            });
        }
    });
}

/* ========================================================================== */
/* X. EVENT LISTENERS & INITIALIZATION */
/* ========================================================================== */

function setupEventListeners() {
    const debouncedCalculate = UTILS.debounce(updateCalculations, 300);
    const form = document.getElementById('investment-form');

    // Recalculate on any input change within the form
    form.addEventListener('input', debouncedCalculate);
    form.addEventListener('change', debouncedCalculate); // For select dropdowns if added

    // Theme, PWA, Voice buttons
    document.getElementById('toggle-color-scheme').addEventListener('click', THEME_MANAGER.toggleColorScheme);
    // Voice/TTS listeners are set in SPEECH.initialize()

    // Tab Switching for Input Modes
    document.querySelectorAll('.input-tabs .tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.target.getAttribute('data-tab');
            document.querySelectorAll('#investment-form .input-tab-content').forEach(content => content.classList.add('hidden'));
            document.getElementById(tabId).classList.remove('hidden');
            document.querySelectorAll('.input-tabs .tab-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            // Update state and recalculate immediately when switching modes
             INVESTMENT_CALCULATOR.STATE.calculationMode = tabId;
             updateCalculations();
        });
    });

    // Tab Switching for Results
     document.querySelectorAll('.tab-controls-results .tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.target.getAttribute('data-tab');
            document.querySelectorAll('.results-section .tab-content').forEach(content => content.classList.add('hidden'));
             document.getElementById(tabId).classList.remove('hidden'); // Show selected
             document.querySelectorAll('.tab-controls-results .tab-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            // Ensure chart redraws if its tab is activated
            if (tabId === 'growth-chart') {
                setTimeout(() => {
                    if (INVESTMENT_CALCULATOR.charts.investmentGrowthChart) {
                        INVESTMENT_CALCULATOR.charts.investmentGrowthChart.resize();
                    } else {
                        updateChart(); // Attempt to create if it doesn't exist
                    }
                }, 50);
            }
        });
    });

     // Goal Calculation Buttons
     document.getElementById('calculate-time-button').addEventListener('click', () => {
         INVESTMENT_CALCULATOR.STATE.calculationMode = 'calc-goal-time';
         updateCalculations();
         UTILS.showToast('Calculating time needed to reach goal...', 'info');
     });
     document.getElementById('calculate-contribution-button').addEventListener('click', () => {
         INVESTMENT_CALCULATOR.STATE.calculationMode = 'calc-goal-contribution';
         updateCalculations();
         UTILS.showToast('Calculating contribution needed...', 'info');
     });

    // Export CSV Button
    document.getElementById('export-csv-button').addEventListener('click', exportDataToCSV);

     // Ensure initial tab content visibility matches button state
    document.querySelectorAll('.input-tabs .tab-button').forEach(btn => {
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.toggle('hidden', !btn.classList.contains('active'));
         document.getElementById(tabId).classList.toggle('active', btn.classList.contains('active')); // Also add active class to visible one
    });
     document.querySelectorAll('.tab-controls-results .tab-button').forEach(btn => {
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.toggle('hidden', !btn.classList.contains('active'));
         document.getElementById(tabId).classList.toggle('active', btn.classList.contains('active'));
    });
}

// === Initialize ===
document.addEventListener('DOMContentLoaded', function() {
    if (INVESTMENT_CALCULATOR.DEBUG) console.log('🇺🇸 FinGuid Investment AI Planner v1.0 Initializing...');

    // 1. Initialize Core Features
    THEME_MANAGER.loadUserPreferences();
    SPEECH.initialize();
    setupEventListeners();
    showPWAInstallPrompt();

    // 2. Fetch Live Inflation Rate and Trigger Initial Calculation
    fredAPI.startAutomaticUpdates(); // This includes the initial calculation call

    // Set default tab visibility based on initial state
    showTab('calc-fv'); // Show Future Value inputs
    showTab('growth-chart'); // Show Growth Chart results

    if (INVESTMENT_CALCULATOR.DEBUG) console.log('✅ Investment Calculator initialized!');
});
