/**
 * FINANCIAL GOAL PLANNER — World's First AI-Powered Savings Target Calculator - PRODUCTION JS v1.0
 * FinGuid USA Market Domination Build - World's First AI Calculator Platform
 * * Target: Production Ready, AI Insights, SEO, PWA, Voice, Monetization Ready
 * * FRED API: 9c6c421f077f2091e8bae4f143ada59a (Using DGS10 for savings benchmark)
 * * Google Analytics: G-NYBL2CDNQJ (in HTML)
 * * © 2025 FinGuid - Built for American Financial Decisions
 */

/* ========================================================================== */
/* I. GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const FINANCIAL_GOAL_PLANNER = {
    VERSION: '1.0',
    DEBUG: true, 
    
    // FRED API Configuration (Real Key)
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a', 
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    FRED_SERIES_ID: 'DGS10', // 10-Year Treasury Constant Maturity Rate (Proxy for Risk-Free Rate)
    FALLBACK_RATE: 4.5, // Conservative fallback for a 10-year investment benchmark

    STATE: {
        goalName: 'Dream Home Down Payment',
        goalAmount: 50000,
        timeHorizon: 5, // in years
        currentSavings: 5000,
        annualInterestRate: 6.5, // %
        annualInflationRate: 3.0, // %
        taxRate: 24, // %
        
        // Results
        monthlySavingsTarget: 0,
        inflationAdjustedGoal: 0,
        totalContributions: 0,
        totalInterestEarned: 0,
        effectiveRealRate: 0,
        chartData: null,
    },
    
    charts: {
        goalProgressChart: null,
    },
};

/* ========================================================================== */
/* II. CORE CALCULATION LOGIC */
/* ========================================================================== */

/**
 * Main calculation function. Reads inputs, computes required monthly savings,
 * and generates the full savings projection.
 */
function calculateGoalPlan() {
    const S = FINANCIAL_GOAL_PLANNER.STATE;
    
    // 1. Read Inputs
    S.goalName = document.getElementById('goal-name').value || 'My Goal';
    S.goalAmount = parseFloat(document.getElementById('goal-amount').value) || 0;
    S.timeHorizon = parseFloat(document.getElementById('time-horizon').value) || 0;
    S.currentSavings = parseFloat(document.getElementById('current-savings').value) || 0;
    S.annualInterestRate = parseFloat(document.getElementById('annual-interest-rate').value) / 100 || 0;
    S.annualInflationRate = parseFloat(document.getElementById('annual-inflation-rate').value) / 100 || 0;
    S.taxRate = parseFloat(document.getElementById('tax-rate').value) / 100 || 0;
    
    if (S.goalAmount <= 0 || S.timeHorizon <= 0) {
        updateUI(); // Clear results
        return;
    }
    
    // Derived variables
    const n = S.timeHorizon * 12; // Total number of compounding periods (months)
    const r_annual = S.annualInterestRate;
    const r_monthly = r_annual / 12;
    const i_annual = S.annualInflationRate;
    
    // 2. Adjust Goal Amount for Inflation (Future Value of Goal)
    // The goal amount must be inflated to be achieved in 'real' terms.
    const realGoalAmount = S.goalAmount * Math.pow(1 + i_annual, S.timeHorizon);
    S.inflationAdjustedGoal = realGoalAmount;

    // 3. Calculate Future Value of Current Savings
    // FV = P * (1 + r)^n
    const fvCurrentSavings = S.currentSavings * Math.pow(1 + r_annual, S.timeHorizon);

    // 4. Calculate Required Future Value to be contributed
    const requiredFVFromContributions = Math.max(0, realGoalAmount - fvCurrentSavings);

    // 5. Calculate Monthly Savings Target (P) using Future Value of Annuity Due Formula
    // P = FV_required * r_monthly / ( (1 + r_monthly)^n - 1 ) / (1 + r_monthly)
    let monthlySavingsTarget = 0;
    if (requiredFVFromContributions > 0 && r_monthly > 0) {
        // Assume contributions are made at the beginning of the month (Annuity Due)
        monthlySavingsTarget = requiredFVFromContributions * r_monthly / (Math.pow(1 + r_monthly, n) - 1) / (1 + r_monthly);
    } else if (requiredFVFromContributions > 0 && r_monthly === 0) {
        // Simple case with 0% interest: total contributions / number of months
        monthlySavingsTarget = requiredFVFromContributions / n;
    }
    
    S.monthlySavingsTarget = monthlySavingsTarget;
    
    // 6. Calculate Total Contributions & Interest
    S.totalContributions = S.currentSavings + (monthlySavingsTarget * n);
    const totalFinalValue = fvCurrentSavings + requiredFVFromContributions; // The required FV is the final value
    
    // Total Interest is the total value minus the total contributed
    S.totalInterestEarned = totalFinalValue - S.totalContributions; 
    
    // 7. Calculate Real Rate of Return (Fisher Equation)
    // Real Rate ≈ ((1 + Nominal Rate) / (1 + Inflation Rate)) - 1
    S.effectiveRealRate = ((1 + r_annual) / (1 + i_annual) - 1);

    // 8. Generate Chart Data
    S.chartData = generateGoalProjection(monthlySavingsTarget, S);
    
    // 9. Update UI & Insights
    updateUI();
    updateChart(S.chartData);
    generateAIInsights(S);
}

/**
 * Generates the year-by-year projection data for the chart.
 * @param {number} pmt The monthly payment/contribution
 * @param {object} S The state object
 * @returns {object} Chart data arrays (labels, data)
 */
function generateGoalProjection(pmt, S) {
    const r_monthly = S.annualInterestRate / 12;
    const totalMonths = S.timeHorizon * 12;
    
    let balance = S.currentSavings;
    let totalContribution = S.currentSavings;
    
    const years = [];
    const balances = [];
    
    // Projection Loop
    for (let month = 1; month <= totalMonths; month++) {
        // Annuity Due: Contribution comes first
        balance += pmt; 
        
        // Interest calculation
        const interest = balance * r_monthly;
        balance += interest;

        totalContribution += pmt;
        
        // Store year-end data
        if (month % 12 === 0 || month === totalMonths) {
            years.push(`Year ${month / 12}`);
            balances.push(balance);
        }
    }
    
    return {
        years: years,
        balances: balances,
        target: S.inflationAdjustedGoal
    };
}


/* ========================================================================== */
/* III. UI & DISPLAY UPDATES */
/* ========================================================================== */

/**
 * Updates all numerical results on the page.
 */
function updateUI() {
    const S = FINANCIAL_GOAL_PLANNER.STATE;
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const decimalFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // 1. Summary Card
    document.getElementById('monthly-savings-target').textContent = formatter.format(S.monthlySavingsTarget);
    document.getElementById('real-goal-summary').textContent = `**Real Goal Amount (Inflation-Adjusted):** ${formatter.format(S.inflationAdjustedGoal)} for a ${formatter.format(S.goalAmount)} goal.`;
    
    // 2. Projection Summary
    document.getElementById('total-contributions').textContent = formatter.format(S.totalContributions);
    document.getElementById('total-interest-earned').textContent = formatter.format(S.totalInterestEarned);
    document.getElementById('total-final-value').textContent = formatter.format(S.chartData?.balances.slice(-1)[0] || 0);

    // Initial Savings Growth (FV of initial lump sum - initial lump sum)
    const fvCurrentSavings = S.currentSavings * Math.pow(1 + S.annualInterestRate, S.timeHorizon);
    document.getElementById('current-savings-growth').textContent = formatter.format(fvCurrentSavings - S.currentSavings);

    // Inflation Impact (Real Goal - Nominal Goal)
    document.getElementById('inflation-impact').textContent = formatter.format(S.inflationAdjustedGoal - S.goalAmount);

    document.getElementById('real-rate-return').textContent = `${decimalFormatter.format(S.effectiveRealRate * 100)}%`;
    document.getElementById('monthly-target-first-year').textContent = formatter.format(S.monthlySavingsTarget);
}

/**
 * Renders or updates the Chart.js visualization.
 * @param {object} chartData Data structure from generateGoalProjection
 */
function updateChart(chartData) {
    if (!chartData) return;

    const ctx = document.getElementById('goal-progress-chart').getContext('2d');
    const darkMode = document.documentElement.getAttribute('data-color-scheme') === 'dark';
    const primaryColor = darkMode ? '#57CBD7' : '#13343B'; // Teal-300 / Slate-900

    if (FINANCIAL_GOAL_PLANNER.charts.goalProgressChart) {
        FINANCIAL_GOAL_PLANNER.charts.goalProgressChart.destroy();
    }

    FINANCIAL_GOAL_PLANNER.charts.goalProgressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.years,
            datasets: [
                {
                    label: 'Projected Savings Balance',
                    data: chartData.balances,
                    borderColor: primaryColor,
                    backgroundColor: primaryColor,
                    tension: 0.3,
                    fill: false,
                    pointRadius: 4,
                },
                {
                    label: 'Inflation-Adjusted Goal Target',
                    data: Array(chartData.years.length).fill(chartData.target),
                    borderColor: '#EF4444', // Red-500
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    pointRadius: 0,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Account Value ($)', color: darkMode ? '#B8C5D0' : '#64748B' },
                    ticks: {
                        callback: (value) => `$${(value / 1000).toFixed(0)}k`,
                        color: darkMode ? '#E1E8ED' : '#1F2121',
                    },
                    grid: { color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' },
                },
                x: {
                    title: { display: true, text: 'Time Horizon', color: darkMode ? '#B8C5D0' : '#64748B' },
                    ticks: { color: darkMode ? '#E1E8ED' : '#1F2121' },
                    grid: { color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' },
                }
            },
            plugins: {
                legend: { labels: { color: darkMode ? '#E1E8ED' : '#1F2121' } },
                tooltip: { callbacks: { label: (context) => `${context.dataset.label}: $${context.parsed.y.toFixed(2)}` } }
            }
        }
    });
}


/* ========================================================================== */
/* IV. AI INSIGHTS ENGINE (Monetization & Recommendation Logic) */
/* ========================================================================== */

/**
 * Generates personalized AI insights based on the calculated results.
 * @param {object} S The state object
 */
function generateAIInsights(S) {
    const insightBox = document.getElementById('ai-insights-content');
    let insights = `<h4>AI Analyst for "${S.goalName}" (${S.timeHorizon} Years)</h4>`;
    
    // --- Recommendation 1: Risk-Adjusted Return ---
    if (S.effectiveRealRate < 0.01) {
        insights += `<p class="recommendation-alert high-priority">⚠️ **RISK ALERT: Negative Real Return.** Your projected ${S.annualInterestRate * 100}% return is only yielding an effective real return of **${(S.effectiveRealRate * 100).toFixed(2)}%** after ${S.annualInflationRate * 100}% inflation. **ACTION:** You must seek higher-growth investments like a low-cost index fund or speak to a financial advisor.</p>`;
    } else if (S.timeHorizon > 10 && S.annualInterestRate < 0.07) {
        insights += `<p class="recommendation-alert medium-priority">💡 **OPTIMIZATION:** With a ${S.timeHorizon}-year horizon, the FinGuid AI recommends a higher-growth portfolio (targeting 7-10% return) to aggressively combat inflation and leverage compounding. Your current target is too conservative for a long-term goal.</p>`;
    } else {
        insights += `<p class="recommendation-alert low-priority">✅ **PLAN VALIDATED:** Your current ${S.annualInterestRate * 100}% growth assumption provides a healthy real return, successfully outpacing inflation. Stay the course with your diversified investment strategy.</p>`;
    }
    
    // --- Recommendation 2: Savings Strain ---
    const monthlyIncomeEstimate = 5000; // Mock estimate based on average American
    const savingsRatio = S.monthlySavingsTarget / monthlyIncomeEstimate;
    if (savingsRatio > 0.15) {
        insights += `<p>💸 **FINANCIAL STRAIN:** Your calculated monthly target of **$${S.monthlySavingsTarget.toFixed(2)}** represents approximately **${(savingsRatio * 100).toFixed(0)}%** of a typical American income. If this feels too high, consider increasing your time horizon or reducing the nominal goal amount. **MONETIZATION OPPORTUNITY:** <a href="https://partner-link.com/budgeting-software" target="_blank" class="affiliate-cta">Use our Budgeting Partner Software</a> to find ways to reduce expenses and meet this goal.</p>`;
    } else {
        insights += `<p>💰 **AFFORDABLE GOAL:** The monthly commitment of $${S.monthlySavingsTarget.toFixed(2)} is manageable. You may be able to accelerate your goal by increasing this amount by just 10-15% per year.</p>`;
    }

    // --- Recommendation 3: Tax Advantage (Monetization Focus) ---
    if (S.taxRate > 0.20) {
        insights += `<p>🏦 **TAX STRATEGY:** With a marginal tax rate of ${S.taxRate * 100}%, you should prioritize **tax-advantaged accounts**. For retirement goals, maximize your 401(k)/IRA. For a home, consider a Roth IRA for penalty-free first-time home buyer withdrawals. **MONETIZATION OPPORTUNITY:** <a href="https://partner-link.com/tax-advantaged-account" target="_blank" class="affiliate-cta">Open a Tax-Advantaged Account with our Brokerage Partner now.</a></p>`;
    }

    insightBox.innerHTML = insights;
}


/* ========================================================================== */
/* V. PLATFORM UTILITIES (FRED, VOICE, THEME, PWA) */
/* ========================================================================== */

// --- FRED API Integration ---
const fredAPI = {
    fetchRate() {
        const url = new URL(FINANCIAL_GOAL_PLANNER.FRED_BASE_URL);
        url.searchParams.set('series_id', FINANCIAL_GOAL_PLANNER.FRED_SERIES_ID);
        url.searchParams.set('api_key', FINANCIAL_GOAL_PLANNER.FRED_API_KEY);
        url.searchParams.set('file_type', 'json');
        url.searchParams.set('sort_order', 'desc');
        url.searchParams.set('limit', '1');
        
        const note = document.getElementById('fred-rate-note');
        note.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading Live FRED Rate...`;

        fetch(url)
            .then(r => r.json())
            .then(data => {
                const obs = data.observations.find(o => o.value !== '.' && o.value !== 'N/A');
                if (obs) {
                    const rate = parseFloat(obs.value);
                    const roundedRate = rate.toFixed(2);
                    document.getElementById('annual-interest-rate').value = (rate + 2.0).toFixed(2); // Treasury + 2.0% for a balanced portfolio proxy
                    note.innerHTML = ` FRED® Live 10-Year Treasury: ${roundedRate}% + 2.0% Portfolio Adjustment.`;
                    note.style.color = 'var(--color-green-500)';
                    calculateGoalPlan(); // Trigger calc after rate update
                } else {
                    throw new Error('No valid FRED observation found.');
                }
            })
            .catch(error => {
                console.error("FRED API Error:", error);
                document.getElementById('annual-interest-rate').value = FINANCIAL_GOAL_PLANNER.FALLBACK_RATE.toFixed(2);
                note.innerHTML = ` FRED® Fallback Rate: ${FINANCIAL_GOAL_PLANNER.FALLBACK_RATE.toFixed(2)}% (API Failed)`;
                note.style.color = 'var(--color-red-500)';
                calculateGoalPlan(); // Trigger calc using fallback
            });
    },
    startAutomaticUpdates() {
        // Fetch immediately and then every 4 hours
        this.fetchRate(); 
        setInterval(this.fetchRate, 4 * 60 * 60 * 1000); 
    }
};

// --- Theme Manager (Adapted from other FinGuid files) ---
const THEME_MANAGER = {
    toggleColorScheme() {
        const current = document.documentElement.getAttribute('data-color-scheme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-color-scheme', next);
        localStorage.setItem('colorScheme', next);
        // Redraw chart to update colors
        if (FINANCIAL_GOAL_PLANNER.charts.goalProgressChart) {
            updateChart(FINANCIAL_GOAL_PLANNER.STATE.chartData);
        }
    },
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('colorScheme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const scheme = saved || (prefersDark ? 'dark' : 'light');
            document.documentElement.setAttribute('data-color-scheme', scheme);
        } catch (e) {}
    }
};

// --- Speech/Voice/TTS (Stubs - full implementation is complex but structure is ready) ---
const SPEECH = {
    isVoiceActive: false,
    isTTSActive: false,
    initialize() {
        console.log('Voice/TTS features initialized (Stubs)');
    },
    toggleVoice() {
        this.isVoiceActive = !this.isVoiceActive;
        document.querySelector('.voice-status').classList.toggle('voice-active', this.isVoiceActive);
        document.querySelector('.voice-status').classList.toggle('voice-inactive', !this.isVoiceActive);
        // Full speech recognition implementation would go here
    },
    toggleTTS() {
        this.isTTSActive = !this.isTTSActive;
        const button = document.getElementById('tts-toggle');
        button.classList.toggle('tts-active', this.isTTSActive);
        // Full Text-to-Speech implementation would go here
    }
};


/* ========================================================================== */
/* VI. INITIALIZATION & EVENT LISTENERS */
/* ========================================================================== */

function setupEventListeners() {
    // === Core Input Listener ===
    const debouncedCalc = UTILS.debounce(calculateGoalPlan, 300);
    document.getElementById('goal-planner-form').addEventListener('input', debouncedCalc);
    document.getElementById('goal-planner-form').addEventListener('submit', (e) => {
        e.preventDefault();
        calculateGoalPlan();
    });

    // === Accessibility Controls ===
    document.getElementById('theme-toggle').addEventListener('click', THEME_MANAGER.toggleColorScheme);
    document.getElementById('voice-toggle').addEventListener('click', SPEECH.toggleVoice.bind(SPEECH));
    document.getElementById('tts-toggle').addEventListener('click', SPEECH.toggleTTS.bind(SPEECH));

    // === Tab Switching ===
    document.querySelectorAll('.tab-buttons .tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.target.getAttribute('data-tab');
            document.querySelectorAll('.results-section .tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            document.querySelectorAll('.tab-buttons .tab-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            // Ensure chart redraws correctly if its tab is activated
            if (tabId === 'timeline-chart' && FINANCIAL_GOAL_PLANNER.charts.goalProgressChart) {
                setTimeout(() => FINANCIAL_GOAL_PLANNER.charts.goalProgressChart.resize(), 10); 
            }
        });
    });
    
    // === PWA Install Prompt (Stub) ===
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        console.log('PWA Install Prompt ready');
    });
}

// --- Common Utility Functions (Copied from other FinGuid files) ---
const UTILS = {
    debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    },
    // Placeholder for other shared utilities
};


// === Initialize ===
document.addEventListener('DOMContentLoaded', function() {
    if (FINANCIAL_GOAL_PLANNER.DEBUG) console.log('🇺🇸 FinGuid Financial Goal Planner v1.0 Initializing...');
    
    // 1. Initialize Core Features
    THEME_MANAGER.loadUserPreferences();
    SPEECH.initialize();
    setupEventListeners();
    
    // 2. Fetch Live Rate and Trigger Initial Calculation
    fredAPI.startAutomaticUpdates(); 
    
    // Fallback calculation in case FRED is slow/fails to trigger
    setTimeout(calculateGoalPlan, 1500); 
    
    if (FINANCIAL_GOAL_PLANNER.DEBUG) console.log('✅ Financial Goal Planner initialized!');
});
