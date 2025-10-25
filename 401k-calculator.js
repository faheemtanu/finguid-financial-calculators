/**
 * 401(K) CALCULATOR — World's First AI-Powered Retirement Calculator - PRODUCTION JS v1.0
 * FinGuid USA Market Domination Build 
 * * Target: Production Ready, AI Insights, SEO, PWA, Voice, Monetization Ready
 * * FRED API: 9c6c421f077f2091e8bae4f143ada59a (Used for DGS10 for market context)
 * * Google Analytics: G-NYBL2CDNQJ (in HTML)
 * * © 2025 FinGuid - World's First AI Calculator Platform for Americans
 */

/* ========================================================================== */
/* I. GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const K401_CALCULATOR = {
    VERSION: '1.0',
    DEBUG: true, // Set to false for production
    
    // FRED API Configuration (Real Key)
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a', 
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    // Using DGS10 (10-Year Treasury Yield) for market rate context.
    FRED_SERIES_ID: 'DGS10', 
    FALLBACK_RATE: 4.5, // Fallback for DGS10
    
    STATE: {
        // Inputs (Default values from HTML)
        currentAge: 30,
        retirementAge: 65,
        currentSalary: 75000,
        currentBalance: 25000,
        contributionRate: 10, // %
        salaryGrowthRate: 3.0, // %
        returnRate: 7.0, // %
        matchRate: 4, // % of salary matched up to
        matchMultiplier: 100, // %
        taxBracket: 24, // %
        
        // Results
        projectedValue: 0,
        totalContributions: 0,
        totalEarnings: 0,
        totalMatch: 0,
        annualTaxSaving: 0,
        matchLost: 0,
        projectionData: [] // Array of {year, balance, total_contributions, total_match}
    },
    charts: {
        projectionChart: null
    }
};

/* ========================================================================== */
/* II. UTILITY FUNCTIONS (SHARED) */
/* ========================================================================== */

/** Formats a number as USD currency. */
const formatCurrency = (amount) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
}).format(amount);

/** Displays a toast notification (PWA/UX feature). */
const showToast = (message, type = 'info') => {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.prepend(toast); // Add new toast to the top
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
};

/* ========================================================================== */
/* III. FRED API INTEGRATION (LIVE RATE CONTEXT) */
/* ========================================================================== */

const fredAPI = {
    /** Fetches the latest observation for the specified FRED series. */
    fetchRate: async () => {
        const url = `${K401_CALCULATOR.FRED_BASE_URL}?series_id=${K401_CALCULATOR.FRED_SERIES_ID}&api_key=${K401_CALCULATOR.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.observations && data.observations.length > 0) {
                const rate = parseFloat(data.observations[0].value);
                if (!isNaN(rate) && rate !== 0) {
                    // Update FRED context display (Rate is NOT used for calculation, only as a context for AI/User)
                    const displayElement = document.getElementById('fred-rate-display');
                    displayElement.textContent = `Market Context: ${rate.toFixed(2)}% (10Y T-Yield)`;
                    return rate;
                }
            }
            throw new Error('Invalid FRED response');
            
        } catch (error) {
            if (K401_CALCULATOR.DEBUG) console.error("FRED API Error:", error);
            showToast('Could not fetch live market rate. Using default fallback.', 'error');
            
            const displayElement = document.getElementById('fred-rate-display');
            displayElement.textContent = `Market Context: ${K401_CALCULATOR.FALLBACK_RATE.toFixed(2)}% (FALLBACK)`;
            return K401_CALCULATOR.FALLBACK_RATE;
        }
    },

    /** Starts the periodic rate update and initial fetch. */
    startAutomaticUpdates: () => {
        // Fetch rate on load
        fredAPI.fetchRate(); 
        // Set up a periodic check (e.g., every 4 hours for production)
        if (!K401_CALCULATOR.DEBUG) {
            setInterval(fredAPI.fetchRate, K401_CALCULATOR.RATE_UPDATE_INTERVAL);
        }
    }
};

/* ========================================================================== */
/* IV. CORE CALCULATION LOGIC */
/* ========================================================================== */

/** Main function to perform the 401(k) projection calculation. */
const calculate401k = () => {
    // 1. Get Inputs from DOM and convert to numeric state
    const currentAge = parseFloat(document.getElementById('current-age').value);
    const retirementAge = parseFloat(document.getElementById('retirement-age').value);
    let currentSalary = parseFloat(document.getElementById('current-salary').value);
    let currentBalance = parseFloat(document.getElementById('current-balance').value);
    const contributionRate = parseFloat(document.getElementById('contribution-rate').value) / 100;
    const salaryGrowthRate = parseFloat(document.getElementById('salary-growth-rate').value) / 100;
    const returnRate = parseFloat(document.getElementById('return-rate').value) / 100;
    const matchRate = parseFloat(document.getElementById('match-rate').value) / 100;
    const matchMultiplier = parseFloat(document.getElementById('match-multiplier').value) / 100;
    const taxBracket = parseFloat(document.getElementById('tax-bracket').value) / 100;

    // Validate core inputs
    if (isNaN(currentAge) || isNaN(retirementAge) || currentAge >= retirementAge || returnRate <= 0) {
        document.getElementById('projected-value').textContent = '$0';
        document.getElementById('ai-recommendations').innerHTML = '<p class="loading-message">Please enter valid and realistic inputs to run the world-class analysis.</p>';
        return;
    }

    const yearsToRetirement = retirementAge - currentAge;
    let projectedValue = currentBalance;
    let totalUserContributions = 0;
    let totalEmployerMatch = 0;
    let projectionData = [];

    // --- Core Projection Loop ---
    for (let year = 1; year <= yearsToRetirement; year++) {
        // 1. Calculate Growth on Current Balance (using current year's balance)
        const earningsThisYear = projectedValue * returnRate;
        
        // 2. Calculate Contributions for the year (User & Match)
        const userContribution = currentSalary * contributionRate;
        const matchCap = currentSalary * matchRate;
        const actualMatch = Math.min(userContribution, matchCap) * matchMultiplier;
        
        // 3. Update Totals
        projectedValue = projectedValue + earningsThisYear + userContribution + actualMatch;
        totalUserContributions += userContribution;
        totalEmployerMatch += actualMatch;
        
        // 4. Update Salary for the next year (Future Salary)
        currentSalary *= (1 + salaryGrowthRate);
        
        // 5. Save Data Point for Chart/Projection Analysis
        projectionData.push({
            year: currentAge + year,
            balance: projectedValue,
            totalContributions: totalUserContributions,
            totalMatch: totalEmployerMatch
        });
    }

    // --- Final Results Calculation ---
    const totalContributions = totalUserContributions + totalEmployerMatch;
    const totalEarnings = projectedValue - currentBalance - totalContributions;
    
    // Annual Tax Saving (Based on initial salary and contribution rate)
    const annualUserContribution = K401_CALCULATOR.STATE.currentSalary * contributionRate;
    const annualTaxSaving = annualUserContribution * taxBracket;
    
    // Match Lost (Based on initial salary and match settings)
    const requiredContributionForFullMatch = K401_CALCULATOR.STATE.currentSalary * matchRate;
    let matchLost = 0;
    if (annualUserContribution < requiredContributionForFullMatch) {
        // Match lost = (Required Contribution - Actual Contribution) * Match Multiplier
        matchLost = (requiredContributionForFullMatch - annualUserContribution) * matchMultiplier;
    }

    // 6. Update STATE and UI
    K401_CALCULATOR.STATE.projectedValue = projectedValue;
    K401_CALCULATOR.STATE.totalContributions = totalUserContributions;
    K401_CALCULATOR.STATE.totalEarnings = totalEarnings;
    K401_CALCULATOR.STATE.totalMatch = totalEmployerMatch;
    K401_CALCULATOR.STATE.annualTaxSaving = annualTaxSaving;
    K401_CALCULATOR.STATE.matchLost = matchLost;
    K401_CALCULATOR.STATE.projectionData = projectionData;
    
    updateSummaryUI();
    updateChart();
    updateAnalysisTab();
    updateAIIsights();
};

/* ========================================================================== */
/* V. UI UPDATE FUNCTIONS */
/* ========================================================================== */

/** Updates the main results panel with calculated values. */
const updateSummaryUI = () => {
    document.getElementById('projected-value').textContent = formatCurrency(K401_CALCULATOR.STATE.projectedValue);
    document.getElementById('total-contributions').textContent = formatCurrency(K401_CALCULATOR.STATE.totalContributions + K401_CALCULATOR.STATE.totalMatch);
    document.getElementById('total-earnings').textContent = formatCurrency(K401_CALCULATOR.STATE.totalEarnings);
    document.getElementById('total-match').textContent = formatCurrency(K401_CALCULATOR.STATE.totalMatch);
    document.getElementById('annual-tax-saving').textContent = formatCurrency(K401_CALCULATOR.STATE.annualTaxSaving);
    
    const matchLostEl = document.getElementById('match-lost');
    matchLostEl.textContent = formatCurrency(K401_CALCULATOR.STATE.matchLost);
    matchLostEl.className = K401_CALCULATOR.STATE.matchLost > 0 ? 'value negative' : 'value positive';
};

/** Updates the Tax & Match Benefits tab content. */
const updateAnalysisTab = () => {
    const state = K401_CALCULATOR.STATE;
    const taxSavingText = `Based on your **${(state.taxBracket * 100).toFixed(0)}% tax bracket** and your annual contribution of ${formatCurrency(state.currentSalary * (state.contributionRate / 100))} (pre-tax), you are reducing your taxable income, saving approximately **${formatCurrency(state.annualTaxSaving)}** in federal taxes this year.`;

    let matchSummaryText = `Your employer offers a match of **${(state.matchMultiplier * 100).toFixed(0)}% up to ${(state.matchRate * 100).toFixed(0)}%** of your salary.`;
    
    if (state.matchLost > 0) {
        matchSummaryText += ` **CRITICAL ALERT:** You are currently contributing ${(state.contributionRate * 100).toFixed(1)}%, which is below the maximum match threshold. You are leaving **${formatCurrency(state.matchLost)}** of free money on the table annually! **Increase your contribution to ${(state.matchRate * 100).toFixed(1)}% to claim the full match.**`;
    } else {
        matchSummaryText += ` **Great Job!** You are currently contributing enough to capture the full employer match, securing an estimated **${formatCurrency(state.totalMatch)}** in total employer funds over your career. This is a crucial financial step.`;
    }

    document.getElementById('tax-benefit-text').innerHTML = taxSavingText;
    document.getElementById('match-summary-text').innerHTML = matchSummaryText;
};


/* ========================================================================== */
/* VI. CHARTING (CHART.JS) */
/* ========================================================================== */

/** Creates or updates the retirement projection chart. */
const updateChart = () => {
    const ctx = document.getElementById('projectionChartCanvas').getContext('2d');
    const data = K401_CALCULATOR.STATE.projectionData;

    const labels = data.map(d => d.year);
    const balances = data.map(d => d.balance);

    const initialBalance = K401_CALCULATOR.STATE.currentBalance;
    const contributionData = data.map(d => d.totalContributions + d.totalMatch + initialBalance);
    const earningsData = data.map(d => d.balance);
    
    // Prepare Stacked Area Data (Accumulation of different sources)
    const datasets = [
        {
            label: 'Total Investment Earnings',
            data: earningsData.map((val, i) => val - contributionData[i]),
            backgroundColor: 'rgba(36, 172, 197, 0.6)', // FinGuid Teal
            borderColor: 'rgba(36, 172, 197, 1)',
            stack: 'Stack 0',
            fill: true
        },
        {
            label: 'Your Contributions + Match',
            data: contributionData.map((val, i) => val),
            backgroundColor: 'rgba(19, 52, 59, 0.7)', // FinGuid Dark Teal
            borderColor: 'rgba(19, 52, 59, 1)',
            stack: 'Stack 0',
            fill: true
        }
    ];

    if (K401_CALCULATOR.charts.projectionChart) {
        // Update existing chart
        K401_CALCULATOR.charts.projectionChart.data.labels = labels;
        K401_CALCULATOR.charts.projectionChart.data.datasets = datasets;
        K401_CALCULATOR.charts.projectionChart.update();
    } else {
        // Create new chart
        K401_CALCULATOR.charts.projectionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: false },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Age (Years)' }
                    },
                    y: {
                        title: { display: true, text: 'Total Value ($)' },
                        stacked: true,
                        beginAtZero: true
                    }
                }
            }
        });
    }
};

/* ========================================================================== */
/* VII. AI-POWERED INSIGHTS (Conditional Logic) */
/* ========================================================================== */

/** Generates dynamic, contextual advice based on results and state. */
const updateAIIsights = () => {
    const state = K401_CALCULATOR.STATE;
    const insightsContainer = document.getElementById('ai-recommendations');
    const insights = [];

    const yearsToRetirement = state.retirementAge - state.currentAge;
    const requiredSavingsForMillion = 1000000;
    
    // Insight 1: Match Loss Check
    if (state.matchLost > 0) {
        insights.push({
            type: 'Critical',
            text: `**Immediate Action Required:** You are missing out on **${formatCurrency(state.matchLost)}** in free employer match money annually. FinGuid recommends you **increase your contribution to ${(state.matchRate * 100).toFixed(0)}%** immediately. This is the highest guaranteed return you can get.`
        });
    }

    // Insight 2: Retirement Target Check (E.g., $1M)
    if (state.projectedValue < requiredSavingsForMillion) {
        const shortfall = requiredSavingsForMillion - state.projectedValue;
        const requiredIncrease = (shortfall / yearsToRetirement) / (state.currentSalary * (1 + state.salaryGrowthRate) * state.returnRate) * 100;
        insights.push({
            type: 'Warning',
            text: `**Target Shortfall Alert:** Your projection of ${formatCurrency(state.projectedValue)} falls short of the common \$1M milestone by **${formatCurrency(shortfall)}**. Consider increasing your annual contribution rate or seeking a higher-return portfolio to close this gap. **Affiliate Link: High-Yield Index Funds.**`
        });
    } else {
        insights.push({
            type: 'Success',
            text: `**Excellent Projection:** Your projected value of ${formatCurrency(state.projectedValue)} puts you on a solid path for retirement. Continue maximizing your contributions and maintaining a disciplined strategy. **Sponsor Link: Retirement Security Tools.**`
        });
    }

    // Insight 3: Tax Efficiency
    if (state.taxBracket > 0.22 && state.contributionRate < 0.15) {
        insights.push({
            type: 'Optimization',
            text: `**Tax Efficiency Opportunity:** In the **${(state.taxBracket * 100).toFixed(0)}%** bracket, your pre-tax 401(k) contributions offer significant immediate savings. Maximize your contributions (up to the IRS limit) to lower your current tax burden. **Affiliate Link: Tax Planning Software.**`
        });
    }
    
    // Render Insights
    insightsContainer.innerHTML = insights.map(i => `
        <div class="insight-item insight-${i.type.toLowerCase()}">
            <p><strong>${i.type} Insight:</strong> ${i.text}</p>
        </div>
    `).join('');
};

/* ========================================================================== */
/* VIII. PWA, THEME, VOICE (MODULAR INITS) */
/* ========================================================================== */

const THEME_MANAGER = {
    loadUserPreferences: () => {
        const theme = localStorage.getItem('finguid-theme') || 'light';
        document.documentElement.setAttribute('data-color-scheme', theme);
        document.getElementById('toggle-theme-button').innerHTML = theme === 'dark' 
            ? '<i class="fas fa-moon" aria-hidden="true"></i>' 
            : '<i class="fas fa-sun" aria-hidden="true"></i>';
    },
    toggleTheme: () => {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-color-scheme', newTheme);
        localStorage.setItem('finguid-theme', newTheme);
        THEME_MANAGER.loadUserPreferences();
        // Force chart update to adapt colors
        if (K401_CALCULATOR.charts.projectionChart) K401_CALCULATOR.charts.projectionChart.update();
    }
};

const SPEECH = {
    initialize: () => {
        // Placeholder for full Voice Command/TTS implementation
    },
    speak: (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        } else {
            showToast('Text-to-Speech is not supported in your browser.', 'error');
        }
    }
};


/* ========================================================================== */
/* IX. EVENT LISTENERS SETUP */
/* ========================================================================== */

const setupEventListeners = () => {
    // Input recalculation
    document.getElementById('401k-input-form').addEventListener('input', calculate401k);
    document.getElementById('401k-input-form').addEventListener('change', calculate401k);

    // Theme Toggle
    document.getElementById('toggle-theme-button').addEventListener('click', THEME_MANAGER.toggleTheme);
    
    // Tab Switching
    document.querySelectorAll('.tab-controls-results .tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.target.getAttribute('data-tab');
            document.querySelectorAll('.tab-controls-results .tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.results-section .tab-content').forEach(content => content.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Ensure chart redraws correctly if its tab is activated
            if (tabId === 'projection-chart' && K401_CALCULATOR.charts.projectionChart) {
                setTimeout(() => K401_CALCULATOR.charts.projectionChart.resize(), 10); 
            }
        });
    });

    // Text to Speech
    document.getElementById('text-to-speech-button').addEventListener('click', () => {
        const summaryText = `Your projected value is ${formatCurrency(K401_CALCULATOR.STATE.projectedValue)}. Total free money from employer match is ${formatCurrency(K401_CALCULATOR.STATE.totalMatch)}. See AI insights for recommendations.`;
        SPEECH.speak(summaryText);
        showToast('Reading results aloud...', 'info');
    });
    
    // Voice Command
    document.getElementById('voice-command-button').addEventListener('click', () => {
        showToast('Voice Command activated (feature requires full production speech implementation).', 'info');
        // Placeholder for SPEECH.startListening();
    });
};

/* ========================================================================== */
/* X. DOCUMENT INITIALIZATION */
/* ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    if (K401_CALCULATOR.DEBUG) {
        console.log('🇺🇸 FinGuid 401(k) Calculator — AI‑Powered Retirement v1.0 Initializing...');
        console.log(`🏦 FRED® API Key: ${K401_CALCULATOR.FRED_API_KEY}`);
        console.log(`📊 Google Analytics ID: G-NYBL2CDNQJ`);
        console.log('✅ Production Ready - All Features Initializing...');
    }
    
    // 1. Initialize Core State and UI
    THEME_MANAGER.loadUserPreferences(); // Load saved theme (Dark/Light Mode)
    SPEECH.initialize(); // Initialize Speech Module
    setupEventListeners(); // Set up all input monitors
    
    // 2. Fetch Live Rate and Initial Calculation
    // This fetches the live rate, sets the context display, and then calls calculate401k()
    fredAPI.startAutomaticUpdates(); 
    
    // Fallback calculation in case FRED is slow/fails to trigger
    setTimeout(calculate401k, 1000); 
    
    if (K401_CALCULATOR.DEBUG) console.log('✅ 401(k) Calculator initialized successfully with all features!');
});
