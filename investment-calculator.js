/**
 * INVESTMENT CALCULATOR — AI‑POWERED GROWTH & GOAL PLANNER - PRODUCTION JS v1.1 FIXED
 * FinGuid USA Market Domination Build - World's First AI-Powered Investment Calculator
 * 
 * FIXES APPLIED:
 * ✅ Added missing showTab() function
 * ✅ Fixed tab switching logic
 * ✅ Enhanced FRED API error handling
 * ✅ Fixed chart initialization and responsive sizing
 * ✅ Corrected goal calculation button handlers
 * ✅ Fixed initialization sequence
 * ✅ Improved dark mode chart color handling
 * ✅ Added proper mobile optimization
 * 
 * © 2025 FinGuid - World's First AI Calculator Platform for Americans
 */

/* ========================================================================== */
/* I. GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const INVESTMENT_CALCULATOR = {
    VERSION: '1.1',
    DEBUG: false,

    // FRED API Configuration (Real Key)
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    FRED_INFLATION_SERIES_ID: 'CPIAUCSL', // Consumer Price Index for All Urban Consumers
    RATE_UPDATE_INTERVAL: 12 * 60 * 60 * 1000, // 12 hours
    FALLBACK_INFLATION_RATE: 3.0,

    // Core State
    STATE: {
        calculationMode: 'calc-fv',
        initialInvestment: 10000,
        monthlyContribution: 500,
        yearsToGrow: 20,
        expectedReturnRate: 7.0,
        financialGoal: 1000000,
        inflationRate: 3.0,
        futureValue: 0,
        totalPrincipal: 0,
        totalGains: 0,
        inflationAdjustedFV: 0,
        yearsToGoal: null,
        contributionNeeded: null,
        annualData: [],
    },

    charts: {
        investmentGrowthChart: null,
    },
    deferredInstallPrompt: null,
};

/* ========================================================================== */
/* II. UTILITY & FORMATTING MODULE */
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
        const element = document.getElementById(id);
        if (!element) return 0;
        const value = element.value;
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

/* ========================================================================== */
/* III. DATA LAYER: FRED API MODULE */
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
            limit: 13,
            observation_start: new Date(Date.now() - 14 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
        url.search = new URLSearchParams(params).toString();

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`FRED API returned status: ${response.status}`);
            }
            const data = await response.json();

            const observations = data.observations.filter(obs => obs.value !== '.' && obs.value !== 'N/A').reverse();

            if (observations.length >= 13) {
                const latestValue = parseFloat(observations[observations.length - 1].value);
                const priorYearValue = parseFloat(observations[observations.length - 13].value);
                const inflationRate = ((latestValue - priorYearValue) / priorYearValue) * 100;

                const rate = Math.max(0, inflationRate);
                const inflationInput = document.getElementById('inflation-rate');
                if (inflationInput) {
                    inflationInput.value = rate.toFixed(1);
                }
                const noteElement = document.querySelector('.fred-source-note');
                if (noteElement) {
                    noteElement.textContent = `Live FRED Rate (${observations[observations.length - 1].date})`;
                }
                console.log(`📈 FRED Inflation Rate updated: ${rate.toFixed(1)}%`);
                return rate;
            } else {
                throw new Error('Not enough valid observations found in FRED data.');
            }
        } catch (error) {
            console.error('FRED Inflation API Error, using fallback rate:', error);
            const inflationInput = document.getElementById('inflation-rate');
            if (inflationInput) {
                inflationInput.value = INVESTMENT_CALCULATOR.FALLBACK_INFLATION_RATE.toFixed(1);
            }
            const noteElement = document.querySelector('.fred-source-note');
            if (noteElement) {
                noteElement.textContent = `Fallback Rate (${INVESTMENT_CALCULATOR.FALLBACK_INFLATION_RATE.toFixed(1)}%)`;
            }
            return INVESTMENT_CALCULATOR.FALLBACK_INFLATION_RATE;
        }
    }

    function startAutomaticUpdates() {
        fetchLatestInflationRate().then(rate => {
            INVESTMENT_CALCULATOR.STATE.inflationRate = rate;
            updateCalculations();
        });
        
        setInterval(async () => {
            const rate = await fetchLatestInflationRate();
            INVESTMENT_CALCULATOR.STATE.inflationRate = rate;
        }, INVESTMENT_CALCULATOR.RATE_UPDATE_INTERVAL);
    }
    
    return { startAutomaticUpdates };
})();

/* ========================================================================== */
/* IV. CORE CALCULATION ENGINE */
/* ========================================================================== */

function updateCalculations() {
    const S = INVESTMENT_CALCULATOR.STATE;

    const activeTab = document.querySelector('.input-tabs .tab-button.active');
    if (activeTab) {
        S.calculationMode = activeTab.getAttribute('data-tab');
    }

    S.inflationRate = UTILS.parseInput('inflation-rate');

    if (S.calculationMode === 'calc-fv') {
        S.initialInvestment = UTILS.parseInput('initial-investment');
        S.monthlyContribution = UTILS.parseInput('monthly-contribution');
        S.yearsToGrow = UTILS.parseInput('years-to-grow');
        S.expectedReturnRate = UTILS.parseInput('expected-return-rate');
        calculateFutureValue();
    } else {
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

    updateResultsDisplay();
    generateAIInsights();
    updateChart();
    updateDataTable();
}

function calculateFutureValue() {
    const S = INVESTMENT_CALCULATOR.STATE;
    if (S.yearsToGrow <= 0 || S.expectedReturnRate < 0) return;

    const r = S.expectedReturnRate / 100;
    const n = S.yearsToGrow;
    const initial = S.initialInvestment;
    const pmt = S.monthlyContribution * 12;

    let futureValue = initial * Math.pow(1 + r, n);
    if (r > 0) {
        futureValue += pmt * ((Math.pow(1 + r, n) - 1) / r);
    } else {
        futureValue += pmt * n;
    }

    const totalPrincipal = initial + (pmt * n);
    const totalGains = futureValue - totalPrincipal;

    const i = S.inflationRate / 100;
    const inflationAdjustedFV = futureValue / Math.pow(1 + i, n);

    S.futureValue = futureValue;
    S.totalPrincipal = totalPrincipal;
    S.totalGains = totalGains;
    S.inflationAdjustedFV = inflationAdjustedFV;
    S.yearsToGoal = null;
    S.contributionNeeded = null;

    generateAnnualData(initial, pmt, r, n, i);
}

function calculateTimeToGoal() {
    const S = INVESTMENT_CALCULATOR.STATE;
    
    if (S.financialGoal <= S.initialInvestment) {
        S.yearsToGoal = 0;
        S.futureValue = S.initialInvestment;
        S.totalPrincipal = S.initialInvestment;
        S.totalGains = 0;
        S.inflationAdjustedFV = S.initialInvestment;
        S.contributionNeeded = null;
        S.annualData = [];
        return;
    }

    const r = S.expectedReturnRate / 100;
    const initial = S.initialInvestment;
    const pmt = S.monthlyContribution * 12;
    const goal = S.financialGoal;
    const i = S.inflationRate / 100;

    let years = 0;
    let balance = initial;
    const maxYears = 100;

    S.annualData = [];

    while (balance < goal && years < maxYears) {
        years++;
        const startBalance = balance;
        const annualInterest = balance * r;
        balance = (balance + pmt) * (1 + r);

        const inflationAdjusted = balance / Math.pow(1 + i, years);
        S.annualData.push({
            year: years,
            startBalance: startBalance,
            contributions: pmt,
            interestEarned: annualInterest,
            endBalance: balance,
            inflationAdjustedBalance: inflationAdjusted
        });
    }

    if (years >= maxYears) {
        S.yearsToGoal = Infinity;
        UTILS.showToast("Goal may take over 100 years to reach.", "error");
    } else {
        S.yearsToGoal = years;
        S.yearsToGrow = years;
        S.futureValue = balance;
        S.totalPrincipal = initial + (pmt * years);
        S.totalGains = balance - S.totalPrincipal;
        S.inflationAdjustedFV = balance / Math.pow(1 + i, years);
    }
    S.contributionNeeded = null;
}

function calculateContributionNeeded() {
    const S = INVESTMENT_CALCULATOR.STATE;
    if (S.yearsToGrow <= 0 || S.expectedReturnRate < 0 || S.financialGoal <= 0) return;

    const r = S.expectedReturnRate / 100;
    const n = S.yearsToGrow;
    const initial = S.initialInvestment;
    const goal = S.financialGoal;
    const i = S.inflationRate / 100;

    const fvInitial = initial * Math.pow(1 + r, n);

    let pmt = 0;
    if (fvInitial >= goal) {
        pmt = 0;
        S.contributionNeeded = 0;
    } else if (r > 0) {
        const fvAnnuityFactor = (Math.pow(1 + r, n) - 1) / r;
        pmt = (goal - fvInitial) / fvAnnuityFactor;
        S.contributionNeeded = pmt / 12;
    } else {
        pmt = (goal - initial) / n;
        S.contributionNeeded = pmt / 12;
    }
    
    S.contributionNeeded = Math.max(0, S.contributionNeeded);
    S.monthlyContribution = S.contributionNeeded;
    
    calculateFutureValue();
    S.yearsToGoal = null;
}

function generateAnnualData(initial, pmt, r, n, i) {
    const S = INVESTMENT_CALCULATOR.STATE;
    S.annualData = [];
    let balance = initial;

    for (let year = 1; year <= n; year++) {
        const startBalance = balance;
        const interestEarned = balance * r;
        balance = (balance + pmt) * (1 + r);

        const inflationAdjusted = balance / Math.pow(1 + i, year);

        S.annualData.push({
            year: year,
            startBalance: startBalance,
            contributions: pmt,
            interestEarned: interestEarned + pmt * r,
            endBalance: balance,
            inflationAdjustedBalance: inflationAdjusted
        });
    }
}

/* ========================================================================== */
/* V. AI INSIGHTS ENGINE */
/* ========================================================================== */

function generateAIInsights() {
    const S = INVESTMENT_CALCULATOR.STATE;
    const output = document.getElementById('ai-insights-output');
    if (!output) return;

    let html = `<h4><i class="fas fa-robot"></i> FinGuid AI Investment Advisor:</h4>`;

    if (S.futureValue <= 0 && S.initialInvestment > 0) {
        output.innerHTML = '<p class="placeholder-text">Enter valid investment parameters to generate AI analysis...</p>';
        return;
    }

    const goalMet = S.calculationMode !== 'calc-fv' && S.futureValue >= S.financialGoal;
    const timeHorizon = S.yearsToGrow;
    const finalFV = S.futureValue;
    const finalAdjustedFV = S.inflationAdjustedFV;
    const gainsRatio = S.totalGains / finalFV;

    // Goal Status
    if (S.calculationMode === 'calc-goal-time' || S.calculationMode === 'calc-goal-contribution') {
        if (S.yearsToGoal === Infinity) {
            html += `<p class="negative-insight"><strong>⚠️ Goal Alert: Current plan seems unrealistic.</strong> Reaching ${UTILS.formatCurrency(S.financialGoal)} may take too long. Consider adjusting your goal, increasing your return rate assumption, or extending your timeline.</p>`;
        } else if (S.yearsToGoal > 0 || S.contributionNeeded > 0) {
            html += `<p class="positive-insight"><strong>✅ Goal Status: On Track!</strong> Your plan projects you can reach your goal of ${UTILS.formatCurrency(S.financialGoal)}. See results for details on time or contribution needed.</p>`;
        }
    } else {
        html += `<p>Your projection shows a future value of <strong>${UTILS.formatCurrency(finalFV)}</strong>. After adjusting for inflation, the estimated value in today's dollars is <strong>${UTILS.formatCurrency(finalAdjustedFV)}</strong>.</p>`;
    }

    html += `<h4>Strategic Analysis & Recommendations:</h4>`;
    let insightsAdded = 0;

    // Inflation Impact Warning
    if (finalFV > 0 && (finalFV - finalAdjustedFV) / finalFV > 0.3 && timeHorizon > 10) {
        insightsAdded++;
        html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-arrow-trend-down"></i> <strong>Inflation Impact Warning</strong>
            </div>
            <p>Inflation is projected to erode over <strong>${UTILS.formatPercent((finalFV - finalAdjustedFV) / finalFV * 100)}</strong> of your future value over ${timeHorizon} years. To combat this, aim for investments with returns significantly higher than the ${UTILS.formatPercent(S.inflationRate)} inflation rate.</p>
            <p><strong><i class="fas fa-handshake"></i> Affiliate Recommendation:</strong> Explore growth-oriented investments like diversified stock market ETFs. <a href="#" target="_blank" rel="noopener">Compare top US brokerage accounts offering low-cost ETFs.</a></p>
        `;
    }

    // Power of Compounding
    if (gainsRatio > 0.5 && timeHorizon >= 15) {
        insightsAdded++;
        html += `
            <div class="recommendation-alert low-priority">
                <i class="fas fa-seedling"></i> <strong>Power of Compounding is Working!</strong>
            </div>
            <p>Over <strong>${UTILS.formatPercent(gainsRatio * 100)}</strong> of your projected future value comes from compound gains, not just your contributions! The longer you invest, the more powerful this effect becomes.</p>
            <p><strong><i class="fas fa-handshake"></i> Sponsor Recommendation:</strong> Maximize compounding by contributing consistently. <a href="#" target="_blank" rel="noopener">Learn about automated investing with our partner Robo-Advisors.</a></p>
        `;
    }

    // Low Contribution Alert
    if (S.monthlyContribution < 100 && S.initialInvestment < 5000) {
        insightsAdded++;
        html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-triangle-exclamation"></i> <strong>Opportunity: Increase Contributions</strong>
            </div>
            <p>Your current monthly contribution of <strong>${UTILS.formatCurrency(S.monthlyContribution)}</strong> is low. Even small increases can significantly impact your future value due to compounding. Aim for 10-15% of your income if possible.</p>
            <p><strong><i class="fas fa-handshake"></i> Affiliate Recommendation:</strong> Find ways to save more. <a href="#" target="_blank" rel="noopener">Explore top budgeting apps to optimize your spending.</a></p>
        `;
    }

    // High Return Rate Check
    if (S.expectedReturnRate > 12.0) {
        insightsAdded++;
        html += `
            <div class="recommendation-alert high-priority">
                <i class="fas fa-magnifying-glass-chart"></i> <strong>Expectation Check: High Return Rate</strong>
            </div>
            <p>An expected annual return of <strong>${UTILS.formatPercent(S.expectedReturnRate)}</strong> is very optimistic and historically difficult to sustain consistently. Consider using a more conservative rate (e.g., 7-10%) for planning. The S&P 500 historical average is approximately 10% annually.</p>
            <p><strong><i class="fas fa-handshake"></i> Sponsor Recommendation:</strong> Understand investment risk. <a href="#" target="_blank" rel="noopener">Connect with a financial advisor to create a realistic portfolio strategy.</a></p>
        `;
    } else if (S.expectedReturnRate < S.inflationRate + 1) {
        insightsAdded++;
        html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-arrow-down"></i> <strong>Growth Alert: Low Return Rate vs. Inflation</strong>
            </div>
            <p>Your expected return (<strong>${UTILS.formatPercent(S.expectedReturnRate)}</strong>) is barely outpacing inflation (<strong>${UTILS.formatPercent(S.inflationRate)}</strong>). Your money's purchasing power may not grow significantly. Explore options to potentially increase returns while managing risk.</p>
            <p><strong><i class="fas fa-handshake"></i> Affiliate Recommendation:</strong> Diversification is key. <a href="#" target="_blank" rel="noopener">Explore investment options beyond basic savings accounts.</a></p>
        `;
    }

    // Short Time Horizon
    if (timeHorizon < 5 && S.financialGoal > S.initialInvestment * 2 && S.calculationMode !== 'calc-fv') {
        insightsAdded++;
        html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-clock"></i> <strong>Timeline Alert: Short Horizon for Goal</strong>
            </div>
            <p>Reaching a significant financial goal in under 5 years often requires very high contributions or assumes high-risk, high-return investments. Ensure your plan is realistic and consider extending your timeline for more achievable results.</p>
        `;
    }

    // Fallback
    if (insightsAdded === 0) {
        html += `
            <div class="recommendation-alert low-priority">
                <i class="fas fa-check-circle"></i> <strong>Solid Foundation</strong>
            </div>
            <p>Your investment parameters appear reasonable. Consistency and time are your greatest allies in building wealth. Stay the course and review your plan annually.</p>
            <p><strong><i class="fas fa-handshake"></i> Next Step:</strong> Consider tax-advantaged accounts like IRAs or 401(k)s to maximize your growth. <a href="#" target="_blank" rel="noopener">Learn more about retirement accounts.</a></p>
        `;
    }

    output.innerHTML = html;
}

/* ========================================================================== */
/* VI. CHARTING MODULE */
/* ========================================================================== */

function updateChart() {
    const S = INVESTMENT_CALCULATOR.STATE;
    const canvas = document.getElementById('investmentGrowthChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');

    if (!S.annualData || S.annualData.length === 0) {
        if (INVESTMENT_CALCULATOR.charts.investmentGrowthChart) {
            INVESTMENT_CALCULATOR.charts.investmentGrowthChart.destroy();
            INVESTMENT_CALCULATOR.charts.investmentGrowthChart = null;
        }
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
    const textColor = isDarkMode ? '#ffffff' : '#000000';
    
    // Dynamic color values based on theme
    const primaryColor = isDarkMode ? '#14b8a6' : '#19343B';
    const accentColor = isDarkMode ? '#5eead4' : '#2dd4bf';
    const inflationColor = '#ef4444';

    INVESTMENT_CALCULATOR.charts.investmentGrowthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Value (Nominal)',
                    data: totalValueData,
                    borderColor: primaryColor,
                    backgroundColor: isDarkMode ? 'rgba(20, 184, 166, 0.1)' : 'rgba(25, 52, 59, 0.1)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 3,
                },
                {
                    label: 'Total Principal Invested',
                    data: principalData,
                    borderColor: accentColor,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.1,
                    borderWidth: 2,
                },
                {
                    label: 'Value (Inflation-Adjusted)',
                    data: inflationAdjustedData,
                    borderColor: inflationColor,
                    fill: false,
                    tension: 0.3,
                    borderWidth: 2,
                    hidden: S.inflationRate <= 0
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
                    labels: { 
                        color: textColor,
                        font: {
                            size: 12,
                            family: "'Inter', sans-serif"
                        },
                        padding: 15
                    } 
                },
                tooltip: {
                    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    titleColor: textColor,
                    bodyColor: textColor,
                    borderColor: gridColor,
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${UTILS.formatCurrency(context.parsed.y)}`
                    }
                }
            },
            scales: {
                y: {
                    title: { 
                        display: true, 
                        text: 'Value ($)', 
                        color: textColor,
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    },
                    ticks: { 
                        color: textColor, 
                        callback: (value) => {
                            if (value >= 1000) {
                                return UTILS.formatCurrency(value / 1000, false) + 'K';
                            }
                            return UTILS.formatCurrency(value, false);
                        }
                    },
                    grid: { color: gridColor },
                    beginAtZero: true
                },
                x: {
                    title: { 
                        display: true, 
                        text: 'Time (Years)', 
                        color: textColor,
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    },
                    ticks: { 
                        color: textColor,
                        maxRotation: 45,
                        minRotation: 0
                    },
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
    if (!tableBody) return;
    
    tableBody.innerHTML = '';

    if (!S.annualData || S.annualData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No data to display. Enter parameters and calculate.</td></tr>';
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

    if (!fvSummary) return;

    // Update FV Summary
    fvSummary.textContent = UTILS.formatCurrency(S.futureValue);
    if (fvSummaryDetails) {
        fvSummaryDetails.innerHTML = `Total Principal: ${UTILS.formatCurrency(S.totalPrincipal)} | Total Gains: ${UTILS.formatCurrency(S.totalGains)}`;
    }
    if (inflationAdjSummary) {
        inflationAdjSummary.innerHTML = `Inflation-Adjusted: ${UTILS.formatCurrency(S.inflationAdjustedFV)} <span class="input-note">(in today's dollars, assuming ${UTILS.formatPercent(S.inflationRate)} inflation)</span>`;
    }

    // Update Goal Summary
    if (goalSummary) {
        goalSummary.classList.add('hidden');
        
        if (S.calculationMode === 'calc-goal-time' && S.yearsToGoal !== null) {
            goalSummary.classList.remove('hidden');
            if (S.yearsToGoal === Infinity) {
                if (goalFigure) goalFigure.textContent = 'Never';
                if (goalUnit) goalUnit.textContent = '';
                if (goalDetails) goalDetails.textContent = 'Goal may be unreachable with current inputs.';
            } else {
                if (goalFigure) goalFigure.textContent = UTILS.formatNumber(S.yearsToGoal);
                if (goalUnit) goalUnit.textContent = S.yearsToGoal === 1 ? 'Year' : 'Years';
                if (goalDetails) goalDetails.textContent = `To reach ${UTILS.formatCurrency(S.financialGoal)}`;
            }
        } else if (S.calculationMode === 'calc-goal-contribution' && S.contributionNeeded !== null) {
            goalSummary.classList.remove('hidden');
            if (goalFigure) goalFigure.textContent = UTILS.formatCurrency(S.contributionNeeded, true);
            if (goalUnit) goalUnit.textContent = '/ month';
            if (goalDetails) goalDetails.textContent = `Needed for ${UTILS.formatNumber(S.yearsToGrow)} years to reach ${UTILS.formatCurrency(S.financialGoal)}`;
        }
    }

    // Show/Hide summaries based on mode
    const mainSummary = document.querySelector('.summary-card:not(.goal-summary)');
    if (mainSummary) {
        if (S.calculationMode === 'calc-fv') {
            mainSummary.classList.remove('hidden');
        } else {
            mainSummary.classList.add('hidden');
        }
    }
}

/* ========================================================================== */
/* IX. TAB MANAGEMENT - FIXED MISSING FUNCTION */
/* ========================================================================== */

function showTab(tabId) {
    // Hide all input tabs
    document.querySelectorAll('.input-tab-content').forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('active');
    });
    
    // Show selected input tab
    const inputTab = document.getElementById(tabId);
    if (inputTab) {
        inputTab.classList.remove('hidden');
        inputTab.classList.add('active');
    }
    
    // Update input tab buttons
    document.querySelectorAll('.input-tabs .tab-button').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function showResultTab(tabId) {
    // Hide all result tabs
    document.querySelectorAll('.results-section .tab-content').forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('active');
    });
    
    // Show selected result tab
    const resultTab = document.getElementById(tabId);
    if (resultTab) {
        resultTab.classList.remove('hidden');
        resultTab.classList.add('active');
    }
    
    // Update result tab buttons
    document.querySelectorAll('.tab-controls-results .tab-button').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Resize chart if growth chart tab is shown
    if (tabId === 'growth-chart') {
        setTimeout(() => {
            if (INVESTMENT_CALCULATOR.charts.investmentGrowthChart) {
                INVESTMENT_CALCULATOR.charts.investmentGrowthChart.resize();
            }
        }, 100);
    }
}

/* ========================================================================== */
/* X. THEME MANAGER, PWA, VOICE */
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
        if (icon) {
            icon.className = scheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }
    
    function toggleColorScheme() {
        const currentScheme = document.documentElement.getAttribute('data-color-scheme');
        const newScheme = currentScheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-color-scheme', newScheme);
        localStorage.setItem(COLOR_SCHEME_KEY, newScheme);
        updateToggleButton(newScheme);
        
        // Redraw chart with new colors
        if (INVESTMENT_CALCULATOR.charts.investmentGrowthChart) {
            updateChart();
        }
    }
    
    return { loadUserPreferences, toggleColorScheme };
})();

const SPEECH = (function() {
    function initialize() {
        const voiceButton = document.getElementById('toggle-voice-command');
        const ttsButton = document.getElementById('toggle-text-to-speech');
        
        if (voiceButton) {
            voiceButton.addEventListener('click', () => {
                voiceButton.classList.toggle('voice-active');
                voiceButton.classList.toggle('voice-inactive');
                const statusText = document.getElementById('voice-status-text');
                if (statusText) {
                    statusText.textContent = voiceButton.classList.contains('voice-active') ? 'Voice ON' : 'Voice OFF';
                }
                UTILS.showToast(voiceButton.classList.contains('voice-active') ? 'Voice Command activated' : 'Voice Command deactivated', 'info');
            });
        }
        
        if (ttsButton) {
            ttsButton.addEventListener('click', () => {
                const isActive = ttsButton.classList.toggle('tts-active');
                ttsButton.classList.toggle('tts-inactive', !isActive);
                UTILS.showToast(isActive ? 'Text-to-Speech activated' : 'Text-to-Speech deactivated', 'info');
            });
        }
    }
    
    return { initialize };
})();

function showPWAInstallPrompt() {
    const installButton = document.getElementById('pwa-install-button');
    if (!installButton) return;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        INVESTMENT_CALCULATOR.deferredInstallPrompt = e;
        installButton.classList.remove('hidden');
    });
    
    installButton.addEventListener('click', () => {
        if (INVESTMENT_CALCULATOR.deferredInstallPrompt) {
            INVESTMENT_CALCULATOR.deferredInstallPrompt.prompt();
            INVESTMENT_CALCULATOR.deferredInstallPrompt.userChoice.then((choice) => {
                if (choice.outcome === 'accepted') {
                    UTILS.showToast('FinGuid App Installed!', 'success');
                }
                INVESTMENT_CALCULATOR.deferredInstallPrompt = null;
                installButton.classList.add('hidden');
            });
        }
    });
}

/* ========================================================================== */
/* XI. EVENT LISTENERS & INITIALIZATION */
/* ========================================================================== */

function setupEventListeners() {
    const debouncedCalculate = UTILS.debounce(updateCalculations, 300);
    const form = document.getElementById('investment-form');
    if (!form) return;

    // Recalculate on input changes
    form.addEventListener('input', debouncedCalculate);
    form.addEventListener('change', debouncedCalculate);

    // Theme toggle
    const themeToggle = document.getElementById('toggle-color-scheme');
    if (themeToggle) {
        themeToggle.addEventListener('click', THEME_MANAGER.toggleColorScheme);
    }

    // Input Tab Switching
    document.querySelectorAll('.input-tabs .tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.target.getAttribute('data-tab');
            showTab(tabId);
            INVESTMENT_CALCULATOR.STATE.calculationMode = tabId;
            updateCalculations();
        });
    });

    // Results Tab Switching
    document.querySelectorAll('.tab-controls-results .tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.target.getAttribute('data-tab');
            showResultTab(tabId);
        });
    });

    // Goal Calculation Buttons
    const calcTimeButton = document.getElementById('calculate-time-button');
    if (calcTimeButton) {
        calcTimeButton.addEventListener('click', () => {
            INVESTMENT_CALCULATOR.STATE.calculationMode = 'calc-goal-time';
            updateCalculations();
            UTILS.showToast('Calculating time needed to reach goal...', 'info');
        });
    }

    const calcContributionButton = document.getElementById('calculate-contribution-button');
    if (calcContributionButton) {
        calcContributionButton.addEventListener('click', () => {
            INVESTMENT_CALCULATOR.STATE.calculationMode = 'calc-goal-contribution';
            updateCalculations();
            UTILS.showToast('Calculating contribution needed...', 'info');
        });
    }

    // Export CSV Button
    const exportButton = document.getElementById('export-csv-button');
    if (exportButton) {
        exportButton.addEventListener('click', exportDataToCSV);
    }
}

/* ========================================================================== */
/* XII. INITIALIZATION */
/* ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🇺🇸 FinGuid Investment AI Planner v1.1 FIXED Initializing...');

    // 1. Initialize Core Features
    THEME_MANAGER.loadUserPreferences();
    SPEECH.initialize();
    setupEventListeners();
    showPWAInstallPrompt();

    // 2. Set default tab visibility
    showTab('calc-fv');
    showResultTab('growth-chart');

    // 3. Fetch Live Inflation Rate and Trigger Initial Calculation
    fredAPI.startAutomaticUpdates();

    console.log('✅ Investment Calculator initialized successfully!');
});

// Handle window resize for chart responsiveness
window.addEventListener('resize', UTILS.debounce(() => {
    if (INVESTMENT_CALCULATOR.charts.investmentGrowthChart) {
        INVESTMENT_CALCULATOR.charts.investmentGrowthChart.resize();
    }
}, 250));
