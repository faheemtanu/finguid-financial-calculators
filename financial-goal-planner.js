/**
 * FINANCIAL GOAL PLANNER — AI-POWERED CALCULATOR v1.0
 * FinGuid USA Market Domination Build
 * * FEATURES:
 * ✅ Multiple Goal Types (Retirement, House, College, Custom)
 * ✅ Three Calculation Modes (Time, Contribution, Return Required)
 * ✅ Live FRED API Inflation Data (CPIAUCSL)
 * ✅ AI-Powered Roadmap & Insights
 * ✅ Milestone Timeline & Monthly Targets
 * ✅ What-If Scenario Analysis
 * ✅ Interactive Charts (Chart.js)
 * ✅ Voice Command (Speech Recognition) & Text-to-Speech
 * ✅ Dark Mode Support & PWA Ready
 * * © 2025 FinGuid USA - World's First AI Financial Calculator Platform
 */

/* ========================================================================== */
/* I. GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const GOAL_PLANNER = {
    VERSION: '1.0',
    DEBUG: false,

    // FRED API Configuration (Real Key - DO NOT DISCLOSE)
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    FRED_INFLATION_SERIES_ID: 'CPIAUCSL', // Consumer Price Index for All Urban Consumers: All Items
    FALLBACK_INFLATION_RATE: 3.0, // Used if FRED API fails

    // State Management - Represents all form inputs
    STATE: {
        goalType: 'retirement', // retirement, home, college, custom
        calculationMode: 'time', // time, contribution, return
        goalAmount: 1000000,
        currentAge: 30,
        initialSavings: 50000,
        monthlyContribution: 1000, // Used for 'time' and 'return' modes
        yearsToGoal: 25, // Used for 'contribution' and 'return' modes
        expectedReturn: 7.0, // Used for 'time' and 'contribution' modes
        inflationRate: 3.0,
        annualIncrease: 2.0 // Annual percentage increase in contribution
    },

    // Results Cache
    RESULT: {
        totalYears: 0,
        monthlyTarget: 0,
        requiredReturn: 0,
        adjustedGoalAmount: 0,
        totalSaved: 0,
        totalInterest: 0,
        chartData: [],
        milestones: []
    },

    charts: {
        progressChart: null
    },
};

/* ========================================================================== */
/* II. UTILITY MODULES (FINCORE - Shared FinGuid Utilities) */
/* ========================================================================== */

const UTILS = {
    formatCurrency: (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
    },
    formatPercent: (value) => {
        return new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(value / 100);
    },
    // Simple debounce function for window resize
    debounce: (func, delay) => {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    },
    // Toast notification for user feedback (Voice/PWA)
    showToast: (message, type = 'info') => {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.classList.add('toast', type);
        toast.textContent = message;
        container.appendChild(toast);

        // Show and auto-hide
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    }
};

/* ========================================================================== */
/* III. FRED API INTEGRATION (Live Economic Data) */
/* ========================================================================== */

const fredAPI = {
    // Fetches the latest CPI data for inflation
    async fetchLatestInflationRate() {
        if (!GOAL_PLANNER.FRED_API_KEY) {
            console.error("FRED API Key is missing.");
            return GOAL_PLANNER.FALLBACK_INFLATION_RATE;
        }

        const today = new Date();
        // Get the date one year ago
        const oneYearAgo = new Date(today.setFullYear(today.getFullYear() - 1));
        const oneYearAgoDateString = oneYearAgo.toISOString().split('T')[0];

        const url = `${GOAL_PLANNER.FRED_BASE_URL}?series_id=${GOAL_PLANNER.FRED_INFLATION_SERIES_ID}&api_key=${GOAL_PLANNER.FRED_API_KEY}&file_type=json&sort_order=desc&limit=13&observation_start=${oneYearAgoDateString}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            const observations = data.observations.filter(obs => obs.value !== '.');

            if (observations.length < 12) {
                console.warn("Not enough data points for 12-month CPI. Using fallback.");
                return GOAL_PLANNER.FALLBACK_INFLATION_RATE;
            }

            // Calculate 12-month inflation rate: (New CPI / Old CPI)^(1) - 1
            const latestCPI = parseFloat(observations[observations.length - 1].value);
            const oneYearAgoCPI = parseFloat(observations[0].value); // Closest to 12 months ago
            
            // Annualized inflation rate percentage
            const rate = ((latestCPI / oneYearAgoCPI) - 1) * 100;
            
            UTILS.showToast(`Live FRED Inflation Rate (${rate.toFixed(2)}%) Applied.`, 'info');
            return rate;

        } catch (error) {
            console.error('Error fetching FRED inflation data:', error);
            return GOAL_PLANNER.FALLBACK_INFLATION_RATE;
        }
    },

    async initialize() {
        const liveRate = await this.fetchLatestInflationRate();
        GOAL_PLANNER.STATE.inflationRate = parseFloat(liveRate.toFixed(2));
        const inflationInput = document.getElementById('inflationRate');
        if (inflationInput) {
            inflationInput.value = GOAL_PLANNER.STATE.inflationRate.toFixed(1);
        }
        // Run initial calculation after getting live rate
        calculateGoalPlan();
    }
};

/* ========================================================================== */
/* IV. CORE FINANCIAL LOGIC */
/* ========================================================================== */

/**
 * Calculates the future value of a series of increasing monthly contributions
 * (annuity due with increasing payments).
 * @param {number} rate - Monthly expected return rate (r/12)
 * @param {number} periods - Total number of months (n * 12)
 * @param {number} initialPayment - Initial monthly contribution (P)
 * @param {number} growthRate - Monthly contribution growth rate (g/12)
 * @param {number} initialSavings - Current savings (PV)
 * @returns {number} Future Value (FV)
 */
function calculateFutureValue(rate, periods, initialPayment, growthRate, initialSavings) {
    const monthlyRate = rate / 12 / 100;
    const monthlyGrowth = growthRate / 12 / 100;

    let fv = initialSavings * Math.pow(1 + monthlyRate, periods);
    let totalContribution = 0;

    for (let i = 1; i <= periods; i++) {
        // Calculate the payment for this month, accounting for annual increase
        const year = Math.ceil(i / 12);
        const annualGrowthFactor = Math.pow(1 + (GOAL_PLANNER.STATE.annualIncrease / 100), year - 1);
        const payment = initialPayment * annualGrowthFactor;

        // Future Value of a single payment: PMT * (1 + r)^n
        fv += payment * Math.pow(1 + monthlyRate, periods - i);
        totalContribution += payment;
    }

    GOAL_PLANNER.RESULT.totalContribution = totalContribution;
    GOAL_PLANNER.RESULT.totalInterest = fv - totalContribution - initialSavings;
    return fv;
}

/**
 * Calculates the required future goal amount adjusted for inflation.
 * @param {number} nominalAmount - The goal amount in today's dollars
 * @param {number} years - Years until the goal
 * @param {number} inflationRate - Annual inflation rate (%)
 * @returns {number} Inflation-Adjusted Goal Amount
 */
function adjustForInflation(nominalAmount, years, inflationRate) {
    const rate = inflationRate / 100;
    // FV = PV * (1 + r)^n
    return nominalAmount * Math.pow(1 + rate, years);
}

/**
 * Main calculation function. Handles the three modes: Time, Contribution, Return.
 */
function calculateGoalPlan() {
    // 1. Get State
    const S = GOAL_PLANNER.STATE;
    const mode = S.calculationMode;

    const goalAmount = parseFloat(S.goalAmount);
    const initialSavings = parseFloat(S.initialSavings);
    const inflationRate = parseFloat(S.inflationRate);
    const annualIncrease = parseFloat(S.annualIncrease);

    let resultValue, resultLabel;

    // 2. Adjust Goal Amount for Inflation (required for all modes)
    const yearsForAdjustment = mode === 'time' ? S.yearsToGoal : 30; // Use a default for the other two modes if years isn't an input
    const adjustedGoalAmount = adjustForInflation(goalAmount, S.yearsToGoal, inflationRate);
    GOAL_PLANNER.RESULT.adjustedGoalAmount = adjustedGoalAmount;

    // 3. Main Calculation Logic
    if (mode === 'time') {
        const monthlyContribution = parseFloat(S.monthlyContribution);
        const expectedReturn = parseFloat(S.expectedReturn);

        // Calculate Future Value over the fixed number of years
        const periods = S.yearsToGoal * 12;
        const totalSaved = calculateFutureValue(expectedReturn, periods, monthlyContribution, annualIncrease, initialSavings);
        
        GOAL_PLANNER.RESULT.totalSaved = totalSaved;
        GOAL_PLANNER.RESULT.totalYears = S.yearsToGoal;
        resultLabel = 'Total Saved (Nominal)';
        resultValue = UTILS.formatCurrency(totalSaved);

        if (totalSaved < adjustedGoalAmount) {
            resultLabel = 'Goal Missed By:';
            resultValue = UTILS.formatCurrency(adjustedGoalAmount - totalSaved);
        } else {
            resultLabel = 'Goal Achieved in:';
            resultValue = `${S.yearsToGoal} Years (On Target)`;
        }

    } else if (mode === 'contribution') {
        // Calculate the Monthly Contribution needed (PMT calculation for growing annuity)
        const periods = S.yearsToGoal * 12;
        const expectedReturn = parseFloat(S.expectedReturn);

        // Initial Savings Future Value
        const fvInitial = initialSavings * Math.pow(1 + (expectedReturn / 12 / 100), periods);
        const neededFromContributions = adjustedGoalAmount - fvInitial;
        
        // This is a complex calculation (PMT for an increasing annuity).
        // For simplicity and stability, we use an iterative approach (Newton-Raphson-like) to solve for PMT.
        // For production, a reliable financial library function for PMT_growing_annuity is ideal.
        
        let targetContribution = neededFromContributions / (periods * 20); // Initial guess
        const tolerance = 1; // within $1

        for (let i = 0; i < 50; i++) { // Max iterations
            const fvTest = calculateFutureValue(expectedReturn, periods, targetContribution, annualIncrease, 0);
            const difference = neededFromContributions - fvTest;

            if (Math.abs(difference) < tolerance) {
                break;
            }

            // Adjust the target contribution based on the difference
            if (fvTest === 0) { // Avoid division by zero on first pass
                targetContribution += neededFromContributions / periods;
            } else {
                 targetContribution *= (neededFromContributions / fvTest);
            }
        }
        
        GOAL_PLANNER.RESULT.monthlyTarget = Math.max(0, targetContribution);
        GOAL_PLANNER.RESULT.totalYears = S.yearsToGoal;
        
        resultLabel = 'Monthly Target (Year 1):';
        resultValue = UTILS.formatCurrency(GOAL_PLANNER.RESULT.monthlyTarget);

    } else if (mode === 'return') {
        // Calculate the Required Return (RATE calculation for growing annuity)
        const monthlyContribution = parseFloat(S.monthlyContribution);
        const periods = S.yearsToGoal * 12;

        // Use iterative search (Binary Search) to find the required rate
        let lowRate = 0.1; // 0.1%
        let highRate = 50.0; // 50% (A safe upper bound)
        let requiredRate = 0;
        const tolerance = 0.0001; // Tolerance for future value difference ($0.01)

        for (let i = 0; i < 50; i++) {
            const midRate = (lowRate + highRate) / 2;
            const fvTest = calculateFutureValue(midRate, periods, monthlyContribution, annualIncrease, initialSavings);
            
            if (Math.abs(fvTest - adjustedGoalAmount) < tolerance) {
                requiredRate = midRate;
                break;
            } else if (fvTest < adjustedGoalAmount) {
                lowRate = midRate;
            } else {
                highRate = midRate;
            }
        }

        GOAL_PLANNER.RESULT.requiredReturn = requiredRate;
        GOAL_PLANNER.RESULT.totalYears = S.yearsToGoal;
        
        if (requiredRate === highRate) { // Indicates goal is not achievable even at 50% return
             resultLabel = 'Required Return:';
             resultValue = 'Goal Not Achievable';
        } else {
            resultLabel = 'Required Annual Return:';
            resultValue = UTILS.formatPercent(requiredRate);
        }
    }

    // 4. Update UI with primary result
    document.getElementById('primary-result-label').textContent = resultLabel;
    document.getElementById('primary-result-value').textContent = resultValue;
    document.getElementById('adjusted-goal-value').textContent = UTILS.formatCurrency(adjustedGoalAmount);

    // 5. Update Total Saved/Interest if in 'time' or 'return' mode (requires iteration)
    if (mode === 'time' || mode === 'return') {
        document.getElementById('total-saved-value').textContent = UTILS.formatCurrency(GOAL_PLANNER.RESULT.totalSaved);
        document.getElementById('total-interest-value').textContent = UTILS.formatCurrency(GOAL_PLANNER.RESULT.totalInterest);
    } else {
        // Recalculate based on the determined monthly target for 'contribution' mode
        const totalSaved = calculateFutureValue(S.expectedReturn, S.yearsToGoal * 12, GOAL_PLANNER.RESULT.monthlyTarget, annualIncrease, initialSavings);
        const totalInterest = totalSaved - GOAL_PLANNER.RESULT.totalContribution - initialSavings;
        document.getElementById('total-saved-value').textContent = UTILS.formatCurrency(totalSaved);
        document.getElementById('total-interest-value').textContent = UTILS.formatCurrency(totalInterest);
    }


    // 6. Generate Chart Data and Insights
    GOAL_PLANNER.RESULT.chartData = generateChartData();
    updateChart(GOAL_PLANNER.RESULT.chartData);
    generateMilestones(GOAL_PLANNER.RESULT.chartData);
    generateAIInsights();
    generateWhatIfScenarios();
}

/* ========================================================================== */
/* V. CHARTING & DATA GENERATION */
/* ========================================================================== */

// Generates the data points for the savings chart
function generateChartData() {
    const S = GOAL_PLANNER.STATE;
    const R = GOAL_PLANNER.RESULT;

    let monthlyContribution = S.monthlyContribution;
    let expectedReturn = S.expectedReturn;
    let years = S.yearsToGoal;

    if (S.calculationMode === 'contribution') {
        monthlyContribution = R.monthlyTarget;
    } else if (S.calculationMode === 'return') {
        expectedReturn = R.requiredReturn;
    }

    const monthlyRate = expectedReturn / 12 / 100;
    const annualGrowthRate = S.annualIncrease / 100;

    let balance = S.initialSavings;
    let annualBalances = [];
    let labels = [];

    // Loop through years
    for (let year = 1; year <= years; year++) {
        let totalContributionThisYear = 0;

        // Loop through 12 months in the year
        for (let month = 1; month <= 12; month++) {
            // Adjust monthly contribution for annual increase at the start of the year
            let currentMonthlyPayment = monthlyContribution * Math.pow(1 + annualGrowthRate, year - 1);
            
            balance = balance * (1 + monthlyRate) + currentMonthlyPayment;
            totalContributionThisYear += currentMonthlyPayment;
        }

        annualBalances.push(Math.round(balance));
        labels.push(S.currentAge + year);
    }

    return { labels, data: annualBalances };
}

// Renders or updates the Chart.js instance
function updateChart(chartData) {
    const ctx = document.getElementById('goal-progress-chart').getContext('2d');
    const R = GOAL_PLANNER.RESULT;
    const S = GOAL_PLANNER.STATE;

    const goalLineData = chartData.labels.map(() => R.adjustedGoalAmount);
    const goalLabel = S.yearsToGoal === R.totalYears ? 'Inflation-Adjusted Goal' : 'Target Goal Amount';

    if (GOAL_PLANNER.charts.progressChart) {
        GOAL_PLANNER.charts.progressChart.destroy();
    }

    GOAL_PLANNER.charts.progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels.map(y => `Age ${y}`),
            datasets: [
                {
                    label: 'Projected Savings Balance',
                    data: chartData.data,
                    backgroundColor: 'rgba(36, 172, 185, 0.4)', // FinGuid Teal
                    borderColor: 'rgba(36, 172, 185, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3
                },
                {
                    label: goalLabel,
                    data: goalLineData,
                    borderColor: 'rgba(220, 38, 38, 0.8)', // Red for Target
                    borderDash: [10, 5],
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Total Value ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return UTILS.formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += UTILS.formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Generates and displays savings milestones
function generateMilestones(chartData) {
    const container = document.getElementById('milestone-container');
    container.innerHTML = '';
    
    if (chartData.data.length === 0) {
         container.innerHTML = '<p class="placeholder-text">Milestones will appear here after calculation.</p>';
         return;
    }

    const milestones = [5, 10, 15, 20, 25].filter(y => y <= GOAL_PLANNER.STATE.yearsToGoal);
    const milestoneList = document.createElement('div');
    milestoneList.classList.add('milestone-list');

    milestones.forEach(year => {
        const index = year - 1;
        const balance = chartData.data[index];
        const age = chartData.labels[index];

        const item = document.createElement('div');
        item.classList.add('milestone-item');
        item.innerHTML = `
            <div class="milestone-icon"><i class="fas fa-calendar-check"></i></div>
            <div class="milestone-content">
                <p class="milestone-year">Age ${age} Target (Year ${year})</p>
                <strong class="milestone-amount">${UTILS.formatCurrency(balance)}</strong>
            </div>
        `;
        milestoneList.appendChild(item);
    });

    if (milestones.length === 0) {
        container.innerHTML = '<p class="placeholder-text">Milestones are only tracked for goals longer than 5 years.</p>';
    } else {
        container.appendChild(milestoneList);
    }
}


/* ========================================================================== */
/* VI. AI-POWERED INSIGHTS & SCENARIOS */
/* ========================================================================== */

function generateAIInsights() {
    const S = GOAL_PLANNER.STATE;
    const R = GOAL_PLANNER.RESULT;
    const container = document.getElementById('ai-insights-container');
    container.innerHTML = '';

    const insights = [];

    // General Insights based on Mode
    if (S.calculationMode === 'time') {
        const goalRatio = R.totalSaved / R.adjustedGoalAmount;
        if (goalRatio < 0.95) {
            insights.push(`**CRITICAL:** Your current plan falls short by **${UTILS.formatCurrency(R.adjustedGoalAmount - R.totalSaved)}** (Inflation Adjusted). Consider increasing your monthly contribution by at least ${UTILS.formatCurrency(S.monthlyContribution * 0.1)} or increasing your expected return.`);
        } else if (goalRatio >= 1.05) {
            insights.push(`**EXCELLENT:** You are on track to exceed your goal by **${UTILS.formatCurrency(R.totalSaved - R.adjustedGoalAmount)}**. You could retire ${((S.yearsToGoal * 12) - calculateGoalTime(S.expectedReturn, S.monthlyContribution, S.initialSavings, R.adjustedGoalAmount)) / 12} years earlier.`);
        } else {
            insights.push(`**ON TARGET:** Your savings of ${UTILS.formatCurrency(R.totalSaved)} is perfectly aligned with the inflation-adjusted goal of ${UTILS.formatCurrency(R.adjustedGoalAmount)}. Continue with this savings discipline.`);
        }
    } else if (S.calculationMode === 'contribution') {
        if (R.monthlyTarget > (S.monthlyContribution * 2)) {
             insights.push(`**HIGH TARGET WARNING:** Your monthly target of **${UTILS.formatCurrency(R.monthlyTarget)}** is aggressive. To reduce this, consider extending your timeline by 5 years or boosting your expected annual return.`);
        } else {
            insights.push(`**ACTIONABLE PLAN:** Your first-year monthly target is **${UTILS.formatCurrency(R.monthlyTarget)}**. Remember this will increase by ${S.annualIncrease}% annually, aligning with your career progression.`);
        }
    } else if (S.calculationMode === 'return') {
        if (R.requiredReturn > 10) {
             insights.push(`**RISK ALERT:** A **${UTILS.formatPercent(R.requiredReturn)}** annual return is required. This indicates a high-risk portfolio may be needed. Consult an advisor on diversifying into high-growth US equity funds.`);
        } else {
            insights.push(`**FEASIBLE:** Your required return of **${UTILS.formatPercent(R.requiredReturn)}** is realistic for a balanced US-market portfolio.`);
        }
    }

    // Secondary Insights
    if (S.inflationRate > GOAL_PLANNER.FALLBACK_INFLATION_RATE + 0.5) {
        insights.push(`**LIVE FRED DATA ALERT:** The current live inflation rate is **${S.inflationRate.toFixed(1)}%**. This is higher than average and means your goal is more expensive. Your savings plan is correctly adjusted for this economic reality.`);
    }

    if (R.totalInterest > R.totalContribution) {
        insights.push(`**THE POWER OF COMPOUNDING:** Over ${R.totalYears} years, your investment interest (${UTILS.formatCurrency(R.totalInterest)}) will exceed your total contributions! This is the hallmark of financial freedom.`);
    }
    
    // Retirement Age specific insight (Example)
    if (S.goalType === 'retirement' && S.currentAge + R.totalYears < 65) {
        insights.push(`**EARLY RETIREMENT ALERT:** Based on your plan, you are projected to reach financial independence at age ${S.currentAge + R.totalYears}. Check out our FIRE (Financial Independence, Retire Early) calculator next!`);
    }

    insights.forEach(insight => {
        const p = document.createElement('p');
        p.innerHTML = `<i class="fas fa-lightbulb"></i> ${insight}`;
        container.appendChild(p);
    });
}

// Reverse calculation for 'time' mode to find the number of months required
function calculateGoalTime(rate, monthlyPayment, initialSavings, goalAmount) {
    let balance = initialSavings;
    let months = 0;
    const monthlyRate = rate / 12 / 100;
    const annualGrowthRate = GOAL_PLANNER.STATE.annualIncrease / 100;

    while (balance < goalAmount && months < 1200) { // Max 100 years
        months++;
        const year = Math.ceil(months / 12);
        const currentMonthlyPayment = monthlyPayment * Math.pow(1 + annualGrowthRate, year - 1);
        
        balance = balance * (1 + monthlyRate) + currentMonthlyPayment;
    }

    return months;
}

function generateWhatIfScenarios() {
    const S = GOAL_PLANNER.STATE;
    const R = GOAL_PLANNER.RESULT;
    const container = document.getElementById('what-if-scenarios');
    container.innerHTML = '';

    const scenarios = [];
    
    // Scenario 1: Increase monthly contribution by 10%
    const newMonthlyCont = S.monthlyContribution * 1.10;
    const monthsFaster1 = R.totalYears * 12 - calculateGoalTime(S.expectedReturn, newMonthlyCont, S.initialSavings, R.adjustedGoalAmount);
    
    if (monthsFaster1 > 0) {
         scenarios.push(`**What if you increased your monthly savings by 10%?** You could reach your goal **${(monthsFaster1 / 12).toFixed(1)} years faster** at your current expected return.`);
    }

    // Scenario 2: Increase expected return by 1.0%
    const newReturnRate = S.expectedReturn + 1.0;
    const monthsFaster2 = R.totalYears * 12 - calculateGoalTime(newReturnRate, S.monthlyContribution, S.initialSavings, R.adjustedGoalAmount);
    
    if (monthsFaster2 > 0) {
         scenarios.push(`**What if you gained 1.0% more in annual return?** This could shorten your goal timeline by **${(monthsFaster2 / 12).toFixed(1)} years** without changing your savings amount. Consider a higher-risk portfolio.`);
    }

    // Scenario 3: Start with 5% more initial savings
    const newInitialSavings = S.initialSavings * 1.05;
    const monthsFaster3 = R.totalYears * 12 - calculateGoalTime(S.expectedReturn, S.monthlyContribution, newInitialSavings, R.adjustedGoalAmount);

    if (monthsFaster3 > 0) {
        scenarios.push(`**What if you find an extra 5% of initial savings?** You would shave **${(monthsFaster3 / 12).toFixed(1)} years** off your savings timeline. The best time to invest is now!`);
    }

    scenarios.forEach(scenario => {
        const p = document.createElement('p');
        p.innerHTML = `<i class="fas fa-chart-pie"></i> ${scenario}`;
        container.appendChild(p);
    });

    if (scenarios.length === 0) {
        container.innerHTML = '<p class="placeholder-text">Run a calculation in "Savings Timeline" mode to see dynamic What-If Scenarios.</p>';
    }
}


/* ========================================================================== */
/* VII. VOICE COMMAND & TEXT-TO-SPEECH (AI/User Friendly) */
/* ========================================================================== */

const speech = {
    tts: null, // Text-to-Speech
    recognition: null, // Speech Recognition

    initialize() {
        if ('speechSynthesis' in window) {
            this.tts = window.speechSynthesis;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.lang = 'en-US'; 
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;

            this.recognition.onresult = (event) => this.handleVoiceCommand(event.results[0][0].transcript);
            this.recognition.onerror = (event) => UTILS.showToast(`Voice Error: ${event.error}`, 'error');
            this.recognition.onend = () => document.getElementById('voice-command-btn').classList.remove('active');
            
            document.getElementById('voice-command-btn').addEventListener('click', () => {
                if (document.getElementById('voice-command-btn').classList.contains('active')) {
                    this.recognition.stop();
                } else {
                    this.startRecognition();
                }
            });
        } else {
            console.warn('Speech Recognition not supported in this browser.');
            document.getElementById('voice-command-btn').style.display = 'none';
        }
    },

    startRecognition() {
        if (this.recognition) {
            document.getElementById('voice-command-btn').classList.add('active');
            UTILS.showToast('Voice Command Active. Try "Set goal amount to 500,000" or "Calculate"', 'info');
            this.speak('Voice command active. How can I help with your financial goal?');
            this.recognition.start();
        }
    },

    speak(text) {
        if (this.tts) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            this.tts.speak(utterance);
        }
    },

    handleVoiceCommand(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        
        if (lowerTranscript.includes('calculate')) {
            calculateGoalPlan();
            this.speak('Calculation performed. Review your new financial plan.');
        } else if (lowerTranscript.includes('goal amount to')) {
            const match = lowerTranscript.match(/to\s*(\d+)/);
            if (match) {
                const amount = parseInt(match[1].replace(/,/g, ''));
                document.getElementById('goalAmount').value = amount;
                GOAL_PLANNER.STATE.goalAmount = amount;
                this.speak(`Goal amount set to ${UTILS.formatCurrency(amount)}.`);
            }
        } else if (lowerTranscript.includes('years to')) {
            const match = lowerTranscript.match(/to\s*(\d+)/);
            if (match) {
                const years = parseInt(match[1]);
                document.getElementById('yearsToGoal').value = years;
                GOAL_PLANNER.STATE.yearsToGoal = years;
                this.speak(`Years to goal set to ${years}.`);
            }
        } else if (lowerTranscript.includes('what is the target')) {
            const target = document.getElementById('primary-result-value').textContent;
            this.speak(`Your primary result is ${target}`);
        } else {
            this.speak(`I didn't understand "${transcript}". Please try "Calculate" or "Set goal amount to..."`);
        }
    }
};


/* ========================================================================== */
/* VIII. THEME & PWA MANAGER */
/* ========================================================================== */

const THEME_MANAGER = {
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('colorScheme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const scheme = saved || (prefersDark ? 'dark' : 'light');
            document.documentElement.setAttribute('data-color-scheme', scheme);
        } catch (e) {
            console.error('Error loading theme preference:', e);
        }
    },

    toggleColorScheme() {
        const current = document.documentElement.getAttribute('data-color-scheme');
        const newScheme = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-color-scheme', newScheme);
        try {
            localStorage.setItem('colorScheme', newScheme);
        } catch (e) {}

        // Re-render chart to pick up new colors
        if (GOAL_PLANNER.charts.progressChart) {
            GOAL_PLANNER.charts.progressChart.update();
        }
    }
};

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js') // Assuming sw.js is at the root
                .then(registration => console.log('PWA ServiceWorker registration successful:', registration.scope))
                .catch(err => console.log('PWA ServiceWorker registration failed:', err));
        });
    }
}

/* ========================================================================== */
/* IX. UI AND EVENT HANDLING */
/* ========================================================================== */

// Updates the visibility of input fields based on the selected calculation mode
function updateInputVisibility(mode) {
    const allModeInputs = document.querySelectorAll('.mode-input');
    allModeInputs.forEach(el => el.style.display = 'none');

    document.querySelectorAll(`.mode-${mode}`).forEach(el => el.style.display = 'block');

    // Update state to use the fields relevant to the current mode
    if (mode === 'time') {
        GOAL_PLANNER.STATE.yearsToGoal = parseFloat(document.getElementById('yearsToGoal').value);
        GOAL_PLANNER.STATE.monthlyContribution = parseFloat(document.getElementById('monthlyContribution').value);
        GOAL_PLANNER.STATE.expectedReturn = parseFloat(document.getElementById('expectedReturn').value);
    } else if (mode === 'contribution') {
        GOAL_PLANNER.STATE.yearsToGoal = parseFloat(document.getElementById('yearsToGoal').value);
        GOAL_PLANNER.STATE.expectedReturn = parseFloat(document.getElementById('expectedReturn').value);
    } else if (mode === 'return') {
        GOAL_PLANNER.STATE.yearsToGoal = parseFloat(document.getElementById('yearsToGoal').value);
        GOAL_PLANNER.STATE.monthlyContribution = parseFloat(document.getElementById('monthlyContribution').value);
    }
}

// Function to handle tab switching
function showResultTab(tabId) {
    document.querySelectorAll('.results-tab-pane').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');

    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');

    // Fix Chart.js size issue on tab change
    if (tabId === 'progress-chart' && GOAL_PLANNER.charts.progressChart) {
        GOAL_PLANNER.charts.progressChart.resize();
    }
}

function exportCSV() {
    const data = GOAL_PLANNER.RESULT.chartData;
    if (!data || data.labels.length === 0) {
        UTILS.showToast('No data to export. Run a calculation first.', 'error');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Year (Age),Projected Balance,Inflation Adjusted Goal\r\n";
    
    data.labels.forEach((age, index) => {
        const balance = data.data[index];
        const goal = GOAL_PLANNER.RESULT.adjustedGoalAmount;
        csvContent += `${age},${balance.toFixed(2)},${goal.toFixed(2)}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "FinGuid_Goal_Plan.csv");
    document.body.appendChild(link); 
    link.click();
    document.body.removeChild(link);
    UTILS.showToast('Goal Plan exported to CSV!', 'success');
}


function setupEventListeners() {
    const form = document.getElementById('goal-planner-form');
    
    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Update all state values from form inputs
        GOAL_PLANNER.STATE.goalType = document.querySelector('input[name="goalType"]:checked').value;
        GOAL_PLANNER.STATE.calculationMode = document.querySelector('input[name="calculationMode"]:checked').value;
        GOAL_PLANNER.STATE.goalAmount = parseFloat(document.getElementById('goalAmount').value);
        GOAL_PLANNER.STATE.currentAge = parseFloat(document.getElementById('currentAge').value);
        GOAL_PLANNER.STATE.initialSavings = parseFloat(document.getElementById('initialSavings').value);
        GOAL_PLANNER.STATE.monthlyContribution = parseFloat(document.getElementById('monthlyContribution').value);
        GOAL_PLANNER.STATE.yearsToGoal = parseFloat(document.getElementById('yearsToGoal').value);
        GOAL_PLANNER.STATE.expectedReturn = parseFloat(document.getElementById('expectedReturn').value);
        GOAL_PLANNER.STATE.inflationRate = parseFloat(document.getElementById('inflationRate').value);
        GOAL_PLANNER.STATE.annualIncrease = parseFloat(document.getElementById('annualIncrease').value);
        
        // Re-run the main calculation
        calculateGoalPlan();
        
        // Speak the primary result (AI assistance)
        speech.speak(`Your new plan is ready. ${document.getElementById('primary-result-label').textContent} is ${document.getElementById('primary-result-value').textContent}`);
    });

    // Input changes (re-calculate on change)
    document.querySelectorAll('#goal-planner-form input:not([type="radio"]):not([type="submit"])').forEach(input => {
        input.addEventListener('input', UTILS.debounce(calculateGoalPlan, 1000));
    });

    // Goal Type change
    document.querySelectorAll('input[name="goalType"]').forEach(input => {
        input.addEventListener('change', (e) => {
            GOAL_PLANNER.STATE.goalType = e.target.value;
            // No need to recalculate on this change, only on submit
        });
    });

    // Calculation Mode change (updates input visibility)
    document.querySelectorAll('input[name="calculationMode"]').forEach(input => {
        input.addEventListener('change', (e) => {
            GOAL_PLANNER.STATE.calculationMode = e.target.value;
            updateInputVisibility(e.target.value);
            // Re-run for dynamic feedback
            calculateGoalPlan();
        });
    });
    
    // Tab switching
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = btn.getAttribute('data-tab');
            showResultTab(tabId);
        });
    });
    
    // Advanced options toggle
    const advToggle = document.getElementById('advanced-toggle');
    if (advToggle) {
        advToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const group = document.getElementById('advanced-options');
            const isOpen = group.getAttribute('aria-hidden') === 'false';
            group.setAttribute('aria-hidden', !isOpen);
            advToggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
            advToggle.querySelector('i').classList.toggle('fa-chevron-down');
            advToggle.querySelector('i').classList.toggle('fa-chevron-up');
        });
    }

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
/* X. INITIALIZATION */
/* ========================================================================== */

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🎯 FinGuid Financial Goal Planner v1.0 Initializing...');

    // Core Setup
    registerServiceWorker(); // PWA
    THEME_MANAGER.loadUserPreferences(); // Dark/Light Mode
    speech.initialize(); // Voice Command / TTS
    setupEventListeners();
    updateInputVisibility(GOAL_PLANNER.STATE.calculationMode); // Set initial UI view
    showResultTab('progress-chart'); // Show chart tab by default

    // Fetch Live Data & Initial Calculation
    await fredAPI.initialize();

    console.log('✅ Goal Planner initialized successfully!');
});

window.addEventListener('resize', UTILS.debounce(() => {
    if (GOAL_PLANNER.charts.progressChart) {
        GOAL_PLANNER.charts.progressChart.resize();
    }
}, 250));
