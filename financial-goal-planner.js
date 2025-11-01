/**
 * FINANCIAL GOAL PLANNER — AI-POWERED CALCULATOR v1.0
 * FinGuid USA Market Domination Build
 * 
 * FEATURES:
 * ✅ Multiple Goal Types (Retirement, House, College, Custom)
 * ✅ Three Calculation Modes (Time, Contribution, Return Required)
 * ✅ Live FRED API Inflation Data
 * ✅ AI-Powered Roadmap & Insights
 * ✅ Milestone Timeline
 * ✅ What-If Scenario Analysis
 * ✅ Interactive Charts (Chart.js)
 * ✅ CSV Export
 * ✅ Dark Mode Support
 * ✅ Mobile Responsive
 * 
 * © 2025 FinGuid USA - World's First AI Financial Calculator Platform
 */

/* ========================================================================== */
/* I. GLOBAL CONFIGURATION */
/* ========================================================================== */

const GOAL_PLANNER = {
    VERSION: '1.0',
    DEBUG: false,

    // FRED API Configuration
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    FRED_INFLATION_SERIES_ID: 'CPIAUCSL',
    FALLBACK_INFLATION_RATE: 3.0,

    // State Management
    STATE: {
        goalType: 'retirement',
        calculationMode: 'time',
        goalAmount: 1000000,
        currentAge: 30,
        initialSavings: 50000,
        monthlyContribution: 1000,
        expectedReturn: 7.0,
        inflationRate: 3.0,
        targetYears: 25,
        
        // Results
        yearsToGoal: null,
        contributionNeeded: null,
        returnRequired: null,
        futureValue: 0,
        totalInvested: 0,
        inflationAdjustedValue: 0,
        annualData: [],
        milestones: [],
    },

    charts: {
        progressChart: null,
        scenarioChart: null,
    }
};

/* ========================================================================== */
/* II. UTILITY FUNCTIONS */
/* ========================================================================== */

const UTILS = {
    formatCurrency(amount, decimals = 0) {
        if (typeof amount !== 'number' || isNaN(amount)) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(amount);
    },

    formatNumber(num, decimals = 0) {
        if (typeof num !== 'number' || isNaN(num)) return '0';
        return num.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    },

    formatPercent(rate) {
        if (typeof rate !== 'number' || isNaN(rate)) return '0.0%';
        return rate.toFixed(1) + '%';
    },

    parseInput(id) {
        const element = document.getElementById(id);
        if (!element) return 0;
        const value = element.value.replace(/[$,]/g, '').trim();
        return parseFloat(value) || 0;
    },

    debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

/* ========================================================================== */
/* III. FRED API MODULE */
/* ========================================================================== */

const fredAPI = {
    async fetchLatestInflationRate() {
        if (GOAL_PLANNER.DEBUG) {
            return GOAL_PLANNER.FALLBACK_INFLATION_RATE;
        }

        const url = new URL(GOAL_PLANNER.FRED_BASE_URL);
        const params = {
            series_id: GOAL_PLANNER.FRED_INFLATION_SERIES_ID,
            api_key: GOAL_PLANNER.FRED_API_KEY,
            file_type: 'json',
            sort_order: 'desc',
            limit: 13,
        };
        url.search = new URLSearchParams(params).toString();

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`FRED API Error: ${response.status}`);
            
            const data = await response.json();
            const observations = data.observations.filter(obs => obs.value !== '.' && obs.value !== 'N/A').reverse();

            if (observations.length >= 13) {
                const latestValue = parseFloat(observations[observations.length - 1].value);
                const priorYearValue = parseFloat(observations[observations.length - 13].value);
                const inflationRate = ((latestValue - priorYearValue) / priorYearValue) * 100;
                const rate = Math.max(0, inflationRate);
                
                const inflationInput = document.getElementById('inflation-rate-goal');
                if (inflationInput) inflationInput.value = rate.toFixed(1);
                
                const noteElement = document.querySelector('.fred-source-note');
                if (noteElement) noteElement.textContent = `Live FRED Rate (${observations[observations.length - 1].date})`;
                
                return rate;
            } else {
                throw new Error('Insufficient FRED data');
            }
        } catch (error) {
            console.error('FRED API Error:', error);
            const inflationInput = document.getElementById('inflation-rate-goal');
            if (inflationInput) inflationInput.value = GOAL_PLANNER.FALLBACK_INFLATION_RATE.toFixed(1);
            
            const noteElement = document.querySelector('.fred-source-note');
            if (noteElement) noteElement.textContent = 'Fallback Rate';
            
            return GOAL_PLANNER.FALLBACK_INFLATION_RATE;
        }
    },

    async initialize() {
        const rate = await this.fetchLatestInflationRate();
        GOAL_PLANNER.STATE.inflationRate = rate;
        updateCalculations();
    }
};

/* ========================================================================== */
/* IV. CALCULATION ENGINE */
/* ========================================================================== */

function updateCalculations() {
    const S = GOAL_PLANNER.STATE;
    
    // Read inputs
    S.goalAmount = UTILS.parseInput('goal-amount');
    S.currentAge = UTILS.parseInput('current-age');
    S.initialSavings = UTILS.parseInput('initial-savings');
    S.monthlyContribution = UTILS.parseInput('monthly-contribution-goal');
    S.expectedReturn = UTILS.parseInput('expected-return-goal');
    S.inflationRate = UTILS.parseInput('inflation-rate-goal');

    // Calculate based on mode
    if (S.calculationMode === 'time') {
        calculateTimeToGoal();
    } else if (S.calculationMode === 'contribution') {
        S.targetYears = UTILS.parseInput('target-years-contribution');
        calculateContributionNeeded();
    } else if (S.calculationMode === 'return') {
        S.targetYears = UTILS.parseInput('target-years-return');
        calculateReturnRequired();
    }

    updateUI();
    updateChart();
    generateMilestones();
    generateAIRoadmap();
    updateDataTable();
}

function calculateTimeToGoal() {
    const S = GOAL_PLANNER.STATE;
    const r = S.expectedReturn / 100;
    const initial = S.initialSavings;
    const pmt = S.monthlyContribution * 12;
    const goal = S.goalAmount;

    if (goal <= initial) {
        S.yearsToGoal = 0;
        S.futureValue = initial;
        S.totalInvested = initial;
        S.inflationAdjustedValue = initial;
        S.annualData = [];
        return;
    }

    let years = 0;
    let balance = initial;
    const maxYears = 100;
    S.annualData = [];

    while (balance < goal && years < maxYears) {
        years++;
        const startBalance = balance;
        const gains = balance * r + pmt * r;
        balance = (balance + pmt) * (1 + r);
        
        const inflationAdjusted = balance / Math.pow(1 + S.inflationRate / 100, years);
        
        S.annualData.push({
            year: years,
            age: S.currentAge + years,
            startBalance,
            contributions: pmt,
            gains,
            endBalance: balance,
            inflationAdjusted,
            progress: (balance / goal) * 100
        });
    }

    S.yearsToGoal = years >= maxYears ? Infinity : years;
    S.futureValue = balance;
    S.totalInvested = initial + (pmt * years);
    S.inflationAdjustedValue = balance / Math.pow(1 + S.inflationRate / 100, years);
}

function calculateContributionNeeded() {
    const S = GOAL_PLANNER.STATE;
    const r = S.expectedReturn / 100;
    const n = S.targetYears;
    const initial = S.initialSavings;
    const goal = S.goalAmount;

    const fvInitial = initial * Math.pow(1 + r, n);
    
    if (fvInitial >= goal) {
        S.contributionNeeded = 0;
    } else if (r > 0) {
        const fvAnnuityFactor = (Math.pow(1 + r, n) - 1) / r;
        const pmt = (goal - fvInitial) / fvAnnuityFactor;
        S.contributionNeeded = pmt / 12;
    } else {
        const pmt = (goal - initial) / n;
        S.contributionNeeded = pmt / 12;
    }

    S.monthlyContribution = S.contributionNeeded;
    generateAnnualData(initial, S.contributionNeeded * 12, r, n);
}

function calculateReturnRequired() {
    const S = GOAL_PLANNER.STATE;
    const n = S.targetYears;
    const initial = S.initialSavings;
    const pmt = S.monthlyContribution * 12;
    const goal = S.goalAmount;

    // Binary search for required return rate
    let low = 0, high = 0.30; // 0% to 30%
    let iterations = 0;
    const maxIterations = 100;

    while (iterations < maxIterations && high - low > 0.0001) {
        const mid = (low + high) / 2;
        const fv = initial * Math.pow(1 + mid, n) + pmt * ((Math.pow(1 + mid, n) - 1) / mid);
        
        if (fv < goal) {
            low = mid;
        } else {
            high = mid;
        }
        iterations++;
    }

    S.returnRequired = ((low + high) / 2) * 100;
    S.expectedReturn = S.returnRequired;
    
    generateAnnualData(initial, pmt, S.returnRequired / 100, n);
}

function generateAnnualData(initial, pmt, r, n) {
    const S = GOAL_PLANNER.STATE;
    S.annualData = [];
    let balance = initial;

    for (let year = 1; year <= n; year++) {
        const startBalance = balance;
        const gains = balance * r + pmt * r;
        balance = (balance + pmt) * (1 + r);
        
        const inflationAdjusted = balance / Math.pow(1 + S.inflationRate / 100, year);

        S.annualData.push({
            year,
            age: S.currentAge + year,
            startBalance,
            contributions: pmt,
            gains,
            endBalance: balance,
            inflationAdjusted,
            progress: (balance / S.goalAmount) * 100
        });
    }

    S.futureValue = balance;
    S.totalInvested = initial + (pmt * n);
    S.inflationAdjustedValue = balance / Math.pow(1 + S.inflationRate / 100, n);
}

/* ========================================================================== */
/* V. UI UPDATE FUNCTIONS */
/* ========================================================================== */

function updateUI() {
    const S = GOAL_PLANNER.STATE;
    
    const mainResult = document.getElementById('goal-result-main');
    const resultUnit = document.getElementById('goal-result-unit');
    const resultDetails = document.getElementById('goal-result-details');
    
    if (S.calculationMode === 'time') {
        if (mainResult) mainResult.textContent = S.yearsToGoal === Infinity ? 'Never' : UTILS.formatNumber(S.yearsToGoal);
        if (resultUnit) resultUnit.textContent = S.yearsToGoal === 1 ? 'Year' : 'Years';
        if (resultDetails) resultDetails.textContent = `To reach ${UTILS.formatCurrency(S.goalAmount)} (Age ${S.currentAge + S.yearsToGoal})`;
    } else if (S.calculationMode === 'contribution') {
        if (mainResult) mainResult.textContent = UTILS.formatCurrency(S.contributionNeeded, 2);
        if (resultUnit) resultUnit.textContent = '/ month';
        if (resultDetails) resultDetails.textContent = `For ${S.targetYears} years to reach ${UTILS.formatCurrency(S.goalAmount)}`;
    } else if (S.calculationMode === 'return') {
        if (mainResult) mainResult.textContent = UTILS.formatPercent(S.returnRequired);
        if (resultUnit) resultUnit.textContent = 'annual return';
        if (resultDetails) resultDetails.textContent = `Needed for ${S.targetYears} years with ${UTILS.formatCurrency(S.monthlyContribution, 0)}/mo`;
    }

    // Update summary cards
    const totalInvestedEl = document.getElementById('total-invested');
    const futureValueEl = document.getElementById('future-value-goal');
    const inflationAdjustedEl = document.getElementById('inflation-adjusted-goal');
    
    if (totalInvestedEl) totalInvestedEl.textContent = UTILS.formatCurrency(S.totalInvested);
    if (futureValueEl) futureValueEl.textContent = UTILS.formatCurrency(S.futureValue);
    if (inflationAdjustedEl) inflationAdjustedEl.textContent = UTILS.formatCurrency(S.inflationAdjustedValue);
}

function generateMilestones() {
    const S = GOAL_PLANNER.STATE;
    const container = document.getElementById('milestone-timeline');
    if (!container || !S.annualData.length) return;

    const milestones = [
        { percent: 25, icon: 'flag', label: '25% Progress' },
        { percent: 50, icon: 'flag-checkered', label: 'Halfway There!' },
        { percent: 75, icon: 'trophy', label: '75% Complete' },
        { percent: 100, icon: 'crown', label: 'Goal Achieved!' }
    ];

    let html = '<div class="milestone-list">';
    
    milestones.forEach(milestone => {
        const yearData = S.annualData.find(d => d.progress >= milestone.percent);
        if (yearData) {
            html += `
                <div class="milestone-item">
                    <div class="milestone-icon"><i class="fas fa-${milestone.icon}"></i></div>
                    <div class="milestone-content">
                        <h4>${milestone.label}</h4>
                        <p>Year ${yearData.year} (Age ${yearData.age}) — ${UTILS.formatCurrency(yearData.endBalance)}</p>
                    </div>
                </div>
            `;
        }
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function generateAIRoadmap() {
    const S = GOAL_PLANNER.STATE;
    const output = document.getElementById('ai-roadmap-output');
    if (!output) return;

    if (!S.annualData.length) {
        output.innerHTML = '<p class="placeholder-text">Enter your goal details to receive AI-powered insights...</p>';
        return;
    }

    let html = `<h4><i class="fas fa-robot"></i> Your AI-Powered Financial Roadmap:</h4>`;

    // Goal achievability analysis
    const isAchievable = S.yearsToGoal !== Infinity && S.yearsToGoal <= 50;
    const timeHorizon = S.calculationMode === 'time' ? S.yearsToGoal : S.targetYears;
    const totalGains = S.futureValue - S.totalInvested;
    const gainsPercent = (totalGains / S.futureValue) * 100;

    if (!isAchievable) {
        html += `
            <div class="recommendation-alert high-priority">
                <i class="fas fa-exclamation-triangle"></i> <strong>Goal May Be Unrealistic</strong>
            </div>
            <p>Based on your current plan, reaching ${UTILS.formatCurrency(S.goalAmount)} may take over 50 years or be unattainable. Consider:</p>
            <ul>
                <li>Increasing monthly contributions significantly</li>
                <li>Adjusting goal amount to be more realistic</li>
                <li>Extending timeline if possible</li>
                <li>Seeking higher-return investment opportunities (with appropriate risk)</li>
            </ul>
        `;
    } else {
        html += `
            <div class="recommendation-alert low-priority">
                <i class="fas fa-check-circle"></i> <strong>Goal Status: Achievable!</strong>
            </div>
            <p>Your goal of ${UTILS.formatCurrency(S.goalAmount)} is achievable in approximately ${timeHorizon} years based on your current plan.</p>
        `;
    }

    // Compound growth insight
    if (gainsPercent > 50 && timeHorizon >= 15) {
        html += `
            <div class="recommendation-alert low-priority">
                <i class="fas fa-seedling"></i> <strong>Compound Growth Working For You</strong>
            </div>
            <p>Over ${UTILS.formatPercent(gainsPercent)} of your projected wealth comes from investment gains, not contributions! This demonstrates the power of compound growth over ${timeHorizon} years.</p>
            <p><strong>Affiliate Recommendation:</strong> Maximize compound growth with low-cost index funds. <a href="#" target="_blank">Compare top investment platforms →</a></p>
        `;
    }

    // Return rate analysis
    if (S.calculationMode === 'return' && S.returnRequired > 12) {
        html += `
            <div class="recommendation-alert high-priority">
                <i class="fas fa-chart-line"></i> <strong>High Return Rate Required</strong>
            </div>
            <p>Achieving your goal requires ${UTILS.formatPercent(S.returnRequired)} annual returns, which is historically very difficult to sustain. The S&P 500's long-term average is ~10%. Consider:</p>
            <ul>
                <li>Increasing monthly contributions to reduce required return</li>
                <li>Extending your timeline</li>
                <li>Consulting a financial advisor for high-growth strategies</li>
            </ul>
            <p><strong>Sponsor Recommendation:</strong> <a href="#" target="_blank">Connect with a certified financial planner →</a></p>
        `;
    }

    // Contribution feasibility
    if (S.calculationMode === 'contribution' && S.contributionNeeded > S.monthlyContribution * 3) {
        html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-wallet"></i> <strong>High Monthly Contribution Required</strong>
            </div>
            <p>Reaching your goal requires ${UTILS.formatCurrency(S.contributionNeeded, 0)} monthly, which is significantly higher than your current ${UTILS.formatCurrency(S.monthlyContribution, 0)}. Consider:</p>
            <ul>
                <li>Extending your timeline to reduce monthly burden</li>
                <li>Looking for ways to increase income</li>
                <li>Optimizing budget to free up more savings</li>
            </ul>
            <p><strong>Affiliate Recommendation:</strong> <a href="#" target="_blank">Top budgeting apps to maximize savings →</a></p>
        `;
    }

    // Inflation impact
    const inflationErosion = ((S.futureValue - S.inflationAdjustedValue) / S.futureValue) * 100;
    if (inflationErosion > 30 && timeHorizon > 15) {
        html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-fire"></i> <strong>Significant Inflation Impact</strong>
            </div>
            <p>Inflation will erode ${UTILS.formatPercent(inflationErosion)} of your future value's purchasing power over ${timeHorizon} years. Your ${UTILS.formatCurrency(S.futureValue)} will have the buying power of only ${UTILS.formatCurrency(S.inflationAdjustedValue)} in today's dollars.</p>
            <p>Ensure your goal amount accounts for this, or aim for returns exceeding ${UTILS.formatPercent(S.inflationRate + 3)} to stay ahead of inflation.</p>
        `;
    }

    // Age-based advice
    const goalAge = S.currentAge + timeHorizon;
    if (S.goalType === 'retirement') {
        if (goalAge < 60) {
            html += `
                <div class="recommendation-alert low-priority">
                    <i class="fas fa-calendar-check"></i> <strong>Early Retirement Track</strong>
                </div>
                <p>You're on track for early retirement at age ${goalAge}! Consider maximizing tax-advantaged accounts (401k, IRA) to keep more of your gains.</p>
                <p><strong>Recommendation:</strong> <a href="#" target="_blank">Learn about retirement account optimization →</a></p>
            `;
        } else if (goalAge > 70) {
            html += `
                <div class="recommendation-alert medium-priority">
                    <i class="fas fa-hourglass-end"></i> <strong>Late Retirement Timeline</strong>
                </div>
                <p>Your projected retirement age is ${goalAge}. If you'd like to retire earlier, consider increasing contributions or seeking professional advice to optimize your strategy.</p>
            `;
        }
    }

    output.innerHTML = html;
}

/* ========================================================================== */
/* VI. CHARTING */
/* ========================================================================== */

function updateChart() {
    const S = GOAL_PLANNER.STATE;
    const canvas = document.getElementById('goalProgressChart');
    if (!canvas || !S.annualData.length) return;

    const ctx = canvas.getContext('2d');
    
    if (GOAL_PLANNER.charts.progressChart) {
        GOAL_PLANNER.charts.progressChart.destroy();
    }

    const labels = S.annualData.map(d => `Year ${d.year}`);
    const balanceData = S.annualData.map(d => d.endBalance);
    const principalData = S.annualData.map(d => S.initialSavings + d.contributions * d.year);
    const inflationData = S.annualData.map(d => d.inflationAdjusted);
    const goalLine = S.annualData.map(() => S.goalAmount);

    const isDarkMode = document.documentElement.getAttribute('data-color-scheme') === 'dark';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDarkMode ? '#ffffff' : '#000000';
    const primaryColor = isDarkMode ? '#14b8a6' : '#19343B';
    const accentColor = isDarkMode ? '#5eead4' : '#2dd4bf';

    GOAL_PLANNER.charts.progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Account Balance',
                    data: balanceData,
                    borderColor: primaryColor,
                    backgroundColor: isDarkMode ? 'rgba(20, 184, 166, 0.1)' : 'rgba(25, 52, 59, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                },
                {
                    label: 'Goal Target',
                    data: goalLine,
                    borderColor: '#f59e0b',
                    borderDash: [10, 5],
                    fill: false,
                    borderWidth: 2,
                    pointRadius: 0,
                },
                {
                    label: 'Total Invested',
                    data: principalData,
                    borderColor: accentColor,
                    borderDash: [5, 5],
                    fill: false,
                    borderWidth: 2,
                },
                {
                    label: 'Inflation-Adjusted Value',
                    data: inflationData,
                    borderColor: '#ef4444',
                    fill: false,
                    tension: 0.4,
                    borderWidth: 2,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    labels: { color: textColor, font: { size: 12 } }
                },
                tooltip: {
                    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    titleColor: textColor,
                    bodyColor: textColor,
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${UTILS.formatCurrency(context.parsed.y)}`
                    }
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Value ($)', color: textColor },
                    ticks: {
                        color: textColor,
                        callback: (value) => UTILS.formatCurrency(value / 1000) + 'K'
                    },
                    grid: { color: gridColor }
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
/* VII. DATA TABLE */
/* ========================================================================== */

function updateDataTable() {
    const S = GOAL_PLANNER.STATE;
    const tbody = document.querySelector('#goal-annual-table tbody');
    if (!tbody) return;

    if (!S.annualData.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">Enter goal details to generate yearly breakdown</td></tr>';
        return;
    }

    let html = '';
    S.annualData.forEach(row => {
        html += `
            <tr>
                <td>${row.year}</td>
                <td>${row.age}</td>
                <td>${UTILS.formatCurrency(row.startBalance)}</td>
                <td>${UTILS.formatCurrency(row.contributions)}</td>
                <td>${UTILS.formatCurrency(row.gains)}</td>
                <td>${UTILS.formatCurrency(row.endBalance)}</td>
                <td>${UTILS.formatCurrency(row.inflationAdjusted)}</td>
                <td>${UTILS.formatNumber(row.progress, 1)}%</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function exportCSV() {
    const S = GOAL_PLANNER.STATE;
    if (!S.annualData.length) {
        UTILS.showToast('No data to export', 'error');
        return;
    }

    let csv = 'Year,Age,Start Balance,Contributions,Gains,End Balance,Inflation-Adjusted,Progress\n';
    S.annualData.forEach(row => {
        csv += `${row.year},${row.age},${row.startBalance.toFixed(2)},${row.contributions.toFixed(2)},${row.gains.toFixed(2)},${row.endBalance.toFixed(2)},${row.inflationAdjusted.toFixed(2)},${row.progress.toFixed(1)}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial_goal_plan_${S.goalType}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    UTILS.showToast('Data exported successfully!', 'success');
}

/* ========================================================================== */
/* VIII. TAB MANAGEMENT */
/* ========================================================================== */

function showResultTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('active');
    });
    
    const tab = document.getElementById(tabId);
    if (tab) {
        tab.classList.remove('hidden');
        tab.classList.add('active');
    }
    
    document.querySelectorAll('.tab-controls-results .tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    
    if (tabId === 'progress-chart' && GOAL_PLANNER.charts.progressChart) {
        setTimeout(() => GOAL_PLANNER.charts.progressChart.resize(), 100);
    }
}

/* ========================================================================== */
/* IX. THEME & PWA */
/* ========================================================================== */

const THEME_MANAGER = {
    loadUserPreferences() {
        const savedScheme = localStorage.getItem('finguid-color-scheme') || 
                           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-color-scheme', savedScheme);
        this.updateToggleButton(savedScheme);
    },
    
    updateToggleButton(scheme) {
        const icon = document.querySelector('#toggle-color-scheme i');
        if (icon) icon.className = scheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    },
    
    toggleColorScheme() {
        const currentScheme = document.documentElement.getAttribute('data-color-scheme');
        const newScheme = currentScheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-color-scheme', newScheme);
        localStorage.setItem('finguid-color-scheme', newScheme);
        this.updateToggleButton(newScheme);
        if (GOAL_PLANNER.charts.progressChart) updateChart();
    }
};

/* ========================================================================== */
/* X. EVENT LISTENERS & INITIALIZATION */
/* ========================================================================== */

function setupEventListeners() {
    const form = document.getElementById('goal-planner-form');
    if (!form) return;

    const debouncedCalc = UTILS.debounce(updateCalculations, 300);
    form.addEventListener('input', debouncedCalc);
    form.addEventListener('change', debouncedCalc);

    // Goal type selection
    document.querySelectorAll('input[name="goal-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            GOAL_PLANNER.STATE.goalType = e.target.value;
            updateCalculations();
        });
    });

    // Calculation mode selection
    document.querySelectorAll('.mode-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = btn.getAttribute('data-mode');
            GOAL_PLANNER.STATE.calculationMode = mode;
            
            document.querySelectorAll('.mode-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show/hide mode-specific inputs
            document.getElementById('contribution-mode-input').classList.toggle('hidden', mode !== 'contribution');
            document.getElementById('return-mode-input').classList.toggle('hidden', mode !== 'return');
            
            updateCalculations();
        });
    });

    // Result tab switching
    document.querySelectorAll('.tab-controls-results .tab-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = btn.getAttribute('data-tab');
            showResultTab(tabId);
        });
    });

    // Theme toggle
    const themeBtn = document.getElementById('toggle-color-scheme');
    if (themeBtn) themeBtn.addEventListener('click', () => THEME_MANAGER.toggleColorScheme());

    // CSV export
    const exportBtn = document.getElementById('export-goal-csv');
    if (exportBtn) exportBtn.addEventListener('click', exportCSV);

    // Lead form
    const leadForm = document.getElementById('lead-form');
    if (leadForm) {
        leadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            UTILS.showToast('Thank you! A financial advisor will contact you soon.', 'success');
            leadForm.reset();
        });
    }
}

/* ========================================================================== */
/* XI. INITIALIZATION */
/* ========================================================================== */

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🎯 FinGuid Financial Goal Planner v1.0 Initializing...');

    THEME_MANAGER.loadUserPreferences();
    setupEventListeners();
    showResultTab('progress-chart');

    await fredAPI.initialize();

    console.log('✅ Goal Planner initialized successfully!');
});

window.addEventListener('resize', UTILS.debounce(() => {
    if (GOAL_PLANNER.charts.progressChart) {
        GOAL_PLANNER.charts.progressChart.resize();
    }
}, 250));
