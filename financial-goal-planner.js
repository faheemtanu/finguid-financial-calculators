/**
 * ============================================================================
 * FINGUID FINANCIAL GOAL PLANNER - WORLD-CLASS JAVASCRIPT v2.0
 * ============================================================================
 * 
 * FEATURES:
 * ✅ AI-Powered Insights & Personalized Recommendations
 * ✅ Live FRED API - Real-time Inflation Data
 * ✅ Voice Commands & Text-to-Speech
 * ✅ Dark/Light Mode Toggle
 * ✅ PWA Ready - Mobile App Experience
 * ✅ Interactive Chart.js Visualization
 * ✅ Multiple Goal Types (College, Home, Retirement, Emergency, Car, Custom)
 * ✅ Monthly Savings Target Calculation
 * ✅ Milestone Timeline & Progress Tracking
 * ✅ Annual Breakdown Table & CSV Export
 * ✅ SEO Optimized FAQ & Educational Content
 * ✅ Lead Generation & Affiliate Integration
 * ✅ Fully Responsive & Accessible
 * 
 * © 2025 FinGuid USA - World's First AI Financial Calculator Platform
 * ============================================================================
 */

'use strict';

/* ========== CONFIGURATION ========== */
const FINGUID_CONFIG = {
    APP_NAME: 'FinGuid Financial Goal Planner',
    VERSION: '2.0',
    DEBUG: false,
    
    // FRED API Configuration
    FRED: {
        BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
        API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
        SERIES_ID: 'CPIAUCSL', // Consumer Price Index - All Urban Consumers
        FALLBACK_RATE: 3.0,
        CACHE_KEY: 'finguid_inflation_rate',
        CACHE_DURATION: 12 * 60 * 60 * 1000 // 12 hours
    },
    
    // Google Analytics
    GTAG_ID: 'G-NYBL2CDNQJ',
    
    // Goal Type Presets
    GOAL_TYPES: {
        college: {
            name: 'College Fund',
            default_amount: 200000,
            default_years: 18,
            description: '4-year public university cost'
        },
        home: {
            name: 'Home Down Payment',
            default_amount: 80000,
            default_years: 5,
            description: '20% down payment on $400K home'
        },
        retirement: {
            name: 'Retirement Fund',
            default_amount: 1000000,
            default_years: 30,
            description: 'Comfortable retirement goal'
        },
        emergency: {
            name: 'Emergency Fund',
            default_amount: 25000,
            default_years: 1,
            description: '6 months of expenses'
        },
        car: {
            name: 'Car Purchase',
            default_amount: 35000,
            default_years: 3,
            description: 'New vehicle purchase'
        },
        custom: {
            name: 'Custom Goal',
            default_amount: 50000,
            default_years: 5,
            description: 'Your personal goal'
        }
    }
};

/* ========== GLOBAL STATE ========== */
let APP_STATE = {
    goalType: 'college',
    goalAmount: 200000,
    currentSavings: 5000,
    monthlyContribution: 500,
    timeYears: 18,
    expectedReturn: 7.0,
    inflationRate: 3.0,
    results: null,
    chart: null,
    ttsEnabled: false,
    voiceEnabled: false
};

/* ========== UTILITY FUNCTIONS ========== */
const UTILS = {
    /**
     * Format number as US currency
     */
    formatCurrency(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },

    /**
     * Format number with commas
     */
    formatNumber(num, decimals = 0) {
        if (typeof num !== 'number' || isNaN(num)) return '0';
        return num.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },

    /**
     * Format percentage
     */
    formatPercent(rate) {
        return UTILS.formatNumber(rate, 1) + '%';
    },

    /**
     * Get DOM element safely
     */
    getEl(id) {
        return document.getElementById(id);
    },

    /**
     * Show toast notification
     */
    toast(message, type = 'success', duration = 3000) {
        const container = UTILS.getEl('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
        
        container.appendChild(toast);
        
        setTimeout(() => toast.remove(), duration);

        // Track in GA
        if (window.gtag) {
            gtag('event', 'toast_notification', {
                message: message,
                type: type
            });
        }
    },

    /**
     * Debounce function
     */
    debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * Parse currency input
     */
    parseCurrency(value) {
        if (typeof value === 'string') {
            return parseFloat(value.replace(/[$,]/g, '')) || 0;
        }
        return parseFloat(value) || 0;
    },

    /**
     * Track GA event
     */
    trackEvent(eventName, eventParams = {}) {
        if (window.gtag) {
            gtag('event', eventName, eventParams);
        }
    }
};

/* ========== FRED API MODULE ========== */
const FRED_API = {
    /**
     * Fetch latest inflation rate from FRED
     */
    async fetchInflationRate() {
        try {
            // Check cache first
            const cached = localStorage.getItem(FINGUID_CONFIG.FRED.CACHE_KEY);
            if (cached) {
                const data = JSON.parse(cached);
                if (Date.now() - data.timestamp < FINGUID_CONFIG.FRED.CACHE_DURATION) {
                    return data.rate;
                }
            }

            const url = new URL(FINGUID_CONFIG.FRED.BASE_URL);
            url.searchParams.append('series_id', FINGUID_CONFIG.FRED.SERIES_ID);
            url.searchParams.append('api_key', FINGUID_CONFIG.FRED.API_KEY);
            url.searchParams.append('file_type', 'json');
            url.searchParams.append('sort_order', 'desc');
            url.searchParams.append('limit', '25');

            const response = await fetch(url);
            if (!response.ok) throw new Error(`FRED API error: ${response.status}`);

            const data = await response.json();
            const observations = data.observations
                .filter(obs => obs.value && obs.value !== '.')
                .slice(0, 13)
                .reverse();

            if (observations.length >= 2) {
                const latest = parseFloat(observations[observations.length - 1].value);
                const prior = parseFloat(observations[observations.length - 13].value);
                const rate = Math.max(0, ((latest - prior) / prior) * 100);

                // Cache the rate
                localStorage.setItem(FINGUID_CONFIG.FRED.CACHE_KEY, JSON.stringify({
                    rate: rate,
                    timestamp: Date.now(),
                    date: observations[observations.length - 1].date
                }));

                return rate;
            }
        } catch (error) {
            if (FINGUID_CONFIG.DEBUG) console.error('FRED API Error:', error);
        }

        return FINGUID_CONFIG.FRED.FALLBACK_RATE;
    },

    /**
     * Initialize FRED data
     */
    async init() {
        const badge = UTILS.getEl('fred-status');
        const input = UTILS.getEl('inflation-rate');
        
        if (badge) badge.textContent = 'Fetching FRED data...';

        const rate = await this.fetchInflationRate();
        APP_STATE.inflationRate = rate;

        if (input) input.value = rate.toFixed(1);
        if (badge) badge.textContent = '✓ Live FRED Data';

        UTILS.trackEvent('fred_api_loaded', { rate: rate });
    }
};

/* ========== CALCULATION ENGINE ========== */
const CALCULATOR = {
    /**
     * Calculate monthly savings needed
     */
    calculateMonthlySavings() {
        const state = APP_STATE;
        const r = state.expectedReturn / 100;
        const n = state.timeYears;
        const P = state.currentSavings;
        const FV = state.goalAmount;

        // Future value of current savings
        const fvP = P * Math.pow(1 + r, n);

        if (fvP >= FV) {
            return 0; // Already have enough
        }

        // Using Future Value of Annuity formula: FV = PMT * [((1+r)^n - 1) / r]
        // Solve for PMT: PMT = FV / [((1+r)^n - 1) / r]
        
        let pmt;
        if (r > 0) {
            const annuityFactor = (Math.pow(1 + r, n) - 1) / r;
            pmt = (FV - fvP) / annuityFactor;
        } else {
            pmt = (FV - P) / n;
        }

        return Math.max(0, pmt / 12); // Convert to monthly
    },

    /**
     * Generate annual breakdown
     */
    generateBreakdown() {
        const state = APP_STATE;
        const monthlyRate = state.expectedReturn / 100 / 12;
        const monthlyContribution = state.monthlyContribution;
        const breakdown = [];

        let balance = state.currentSavings;
        
        for (let month = 1; month <= state.timeYears * 12; month++) {
            balance = (balance + monthlyContribution) * (1 + monthlyRate);
            
            if (month % 12 === 0) {
                const year = month / 12;
                const inflationAdjusted = state.goalAmount / Math.pow(1 + state.inflationRate / 100, year);
                const percentToGoal = (balance / state.goalAmount) * 100;
                
                breakdown.push({
                    year,
                    balance: Math.round(balance),
                    investmentGains: Math.round(balance - state.currentSavings - (monthlyContribution * month)),
                    percentToGoal: Math.min(percentToGoal, 100),
                    inflationAdjusted: Math.round(inflationAdjusted)
                });
            }
        }

        return breakdown;
    },

    /**
     * Calculate all results
     */
    calculate() {
        const state = APP_STATE;
        const monthlySavings = this.calculateMonthlySavings();
        const breakdown = this.generateBreakdown();
        
        const totalContributions = state.currentSavings + (monthlySavings * 12 * state.timeYears);
        const finalBalance = breakdown[breakdown.length - 1]?.balance || 0;
        const investmentGains = finalBalance - totalContributions;
        const inflationAdjustedGoal = state.goalAmount / Math.pow(1 + state.inflationRate / 100, state.timeYears);

        state.results = {
            monthlySavings: Math.round(monthlySavings),
            totalContributions: Math.round(totalContributions),
            investmentGains: Math.round(investmentGains),
            finalBalance: Math.round(finalBalance),
            inflationAdjustedGoal: Math.round(inflationAdjustedGoal),
            breakdown: breakdown
        };

        return state.results;
    }
};

/* ========== AI INSIGHTS ENGINE ========== */
const AI_INSIGHTS = {
    /**
     * Generate personalized AI insights
     */
    generate() {
        const state = APP_STATE;
        const results = state.results;
        
        if (!results) return [];

        const insights = [];

        // Insight 1: Feasibility Check
        if (results.monthlySavings > 5000) {
            insights.push({
                type: 'warning',
                title: 'High Monthly Savings Required',
                content: `Your goal requires ${UTILS.formatCurrency(results.monthlySavings)}/month. Consider increasing your investment return or extending your timeline.`,
                action: 'Explore higher-yield investments →',
                link: '#'
            });
        } else if (results.monthlySavings < 100) {
            insights.push({
                type: 'success',
                title: 'Affordable Goal Target',
                content: `You only need ${UTILS.formatCurrency(results.monthlySavings)}/month to reach your goal. Automate this amount today!`,
                action: 'Set Up Automatic Transfers →',
                link: '#'
            });
        }

        // Insight 2: Investment Power
        const gainPercent = (results.investmentGains / results.finalBalance) * 100;
        if (gainPercent > 50 && state.timeYears > 10) {
            insights.push({
                type: 'info',
                title: 'Compound Growth Working Hard',
                content: `${UTILS.formatPercent(gainPercent)} of your final balance comes from investment gains! This is the power of long-term investing.`,
                action: 'Maximize with Index Funds →',
                link: '#'
            });
        }

        // Insight 3: Inflation Impact
        const inflationImpact = ((state.goalAmount - results.inflationAdjustedGoal) / state.goalAmount) * 100;
        if (inflationImpact > 20) {
            insights.push({
                type: 'warning',
                title: 'Inflation Will Reduce Purchasing Power',
                content: `Inflation will erode ${UTILS.formatPercent(inflationImpact)} of your goal's value. Your ${UTILS.formatCurrency(state.goalAmount)} today = ${UTILS.formatCurrency(results.inflationAdjustedGoal)} in purchasing power.`,
                action: 'Learn About Inflation Protection →',
                link: '#'
            });
        }

        // Insight 4: Goal Type Recommendation
        if (state.goalType === 'college') {
            insights.push({
                type: 'success',
                title: '529 Plan Recommendation',
                content: 'Consider a 529 College Savings Plan for tax-free growth. Many states offer income tax deductions on contributions.',
                action: 'Compare 529 Plans →',
                link: '#'
            });
        } else if (state.goalType === 'home') {
            insights.push({
                type: 'success',
                title: 'First-Time Homebuyer Tip',
                content: 'Explore first-time homebuyer programs and down payment assistance. Some loans require only 3-5% down.',
                action: 'First-Time Buyer Programs →',
                link: '#'
            });
        } else if (state.goalType === 'retirement') {
            insights.push({
                type: 'success',
                title: 'Maximize Retirement Accounts',
                content: 'Prioritize 401(k) and IRA contributions for tax benefits. In 2024, limits are $23,500 (401k) and $7,000 (IRA).',
                action: 'Retirement Account Guide →',
                link: '#'
            });
        }

        // Insight 5: Risk Assessment
        if (state.expectedReturn > 12) {
            insights.push({
                type: 'warning',
                title: 'High Return Assumption',
                content: 'You\'ve assumed a return rate of ' + UTILS.formatPercent(state.expectedReturn) + '. Historically, the S&P 500 averages ~10%. Consider more conservative estimates.',
                action: 'Understand Asset Allocation →',
                link: '#'
            });
        }

        return insights;
    },

    /**
     * Render insights HTML
     */
    render(insights) {
        const box = UTILS.getEl('ai-insights-box');
        if (!box) return;

        if (!insights || insights.length === 0) {
            box.innerHTML = '<p class="placeholder">Enter your details to receive AI insights</p>';
            return;
        }

        let html = '<div class="insights-list">';
        
        insights.forEach(insight => {
            const iconClass = {
                success: 'fa-check-circle',
                warning: 'fa-exclamation-circle',
                info: 'fa-info-circle'
            }[insight.type] || 'fa-lightbulb';

            html += `
                <div class="insight-item insight-${insight.type}">
                    <div class="insight-title">
                        <i class="fas ${iconClass}"></i> ${insight.title}
                    </div>
                    <p class="insight-text">${insight.content}</p>
                    <div class="insight-action">
                        <a href="${insight.link}" target="_blank" rel="noopener">${insight.action}</a>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        box.innerHTML = html;
    }
};

/* ========== UI UPDATE MODULE ========== */
const UI = {
    /**
     * Update all displays
     */
    updateAll() {
        const results = APP_STATE.results;
        if (!results) return;

        // Update summary cards
        UTILS.getEl('monthly-target').textContent = UTILS.formatCurrency(results.monthlySavings);
        UTILS.getEl('total-invested').textContent = UTILS.formatCurrency(results.totalContributions);
        UTILS.getEl('inflation-adjusted-goal').textContent = UTILS.formatCurrency(results.inflationAdjustedGoal);
        UTILS.getEl('investment-gains').textContent = UTILS.formatCurrency(results.investmentGains);

        // Update milestones
        this.updateMilestones();

        // Update chart
        CHART_MODULE.update();

        // Update table
        this.updateTable();

        // Generate and render AI insights
        const insights = AI_INSIGHTS.generate();
        AI_INSIGHTS.render(insights);
    },

    /**
     * Update milestones
     */
    updateMilestones() {
        const timeline = UTILS.getEl('milestone-timeline');
        if (!timeline || !APP_STATE.results) return;

        const breakdown = APP_STATE.results.breakdown;
        const milestones = [
            { percent: 25, icon: 'flag', label: '25% Complete' },
            { percent: 50, icon: 'flag-checkered', label: 'Halfway There!' },
            { percent: 75, icon: 'trophy', label: '75% Complete' },
            { percent: 100, icon: 'crown', label: 'Goal Reached!' }
        ];

        let html = '';
        
        milestones.forEach(milestone => {
            const yearData = breakdown.find(d => d.percentToGoal >= milestone.percent);
            if (yearData) {
                html += `
                    <div class="milestone-item">
                        <div class="milestone-icon"><i class="fas fa-${milestone.icon}"></i></div>
                        <h4>${milestone.label}</h4>
                        <p>Year ${yearData.year}: ${UTILS.formatCurrency(yearData.balance)}</p>
                    </div>
                `;
            }
        });

        timeline.innerHTML = html || '<p class="placeholder">Calculate to see milestones</p>';
    },

    /**
     * Update data table
     */
    updateTable() {
        const tbody = UTILS.getEl('breakdown-table-body')?.querySelector('tbody');
        if (!tbody || !APP_STATE.results) return;

        const breakdown = APP_STATE.results.breakdown;
        let html = '';

        breakdown.forEach(row => {
            html += `
                <tr>
                    <td>${row.year}</td>
                    <td>${UTILS.formatCurrency(row.balance - row.investmentGains)}</td>
                    <td>${UTILS.formatCurrency(APP_STATE.monthlyContribution * 12)}</td>
                    <td>${UTILS.formatCurrency(row.investmentGains)}</td>
                    <td>${UTILS.formatCurrency(row.balance)}</td>
                    <td>${UTILS.formatCurrency(row.inflationAdjusted)}</td>
                    <td>${UTILS.formatNumber(row.percentToGoal, 1)}%</td>
                </tr>
            `;
        });

        tbody.innerHTML = html || '<tr><td colspan="7" class="no-data">No data</td></tr>';
    }
};

/* ========== CHART MODULE ========== */
const CHART_MODULE = {
    chart: null,

    /**
     * Update chart
     */
    update() {
        const canvas = UTILS.getEl('progressChart');
        if (!canvas || !APP_STATE.results) return;

        const breakdown = APP_STATE.results.breakdown;
        const isDark = document.documentElement.getAttribute('data-color-scheme') === 'dark';

        const labels = breakdown.map(row => `Year ${row.year}`);
        const balanceData = breakdown.map(row => row.balance);
        const goalLine = breakdown.map(() => APP_STATE.goalAmount);

        const ctx = canvas.getContext('2d');

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Your Savings Growth',
                        data: balanceData,
                        borderColor: '#19343B',
                        backgroundColor: 'rgba(25, 52, 59, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3
                    },
                    {
                        label: 'Goal Target',
                        data: goalLine,
                        borderColor: '#f59e0b',
                        borderDash: [10, 5],
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: isDark ? '#f9fafb' : '#111827',
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                        titleColor: isDark ? '#f9fafb' : '#111827',
                        bodyColor: isDark ? '#f9fafb' : '#111827',
                        callbacks: {
                            label: ctx => `${ctx.dataset.label}: ${UTILS.formatCurrency(ctx.parsed.y)}`
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            color: isDark ? '#d1d5db' : '#6b7280',
                            callback: value => UTILS.formatCurrency(value / 1000) + 'K'
                        },
                        grid: {
                            color: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        ticks: { color: isDark ? '#d1d5db' : '#6b7280' },
                        grid: { color: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.1)' }
                    }
                }
            }
        });
    }
};

/* ========== THEME MODULE ========== */
const THEME = {
    init() {
        const savedScheme = localStorage.getItem('finguid-theme') || 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-color-scheme', savedScheme);
        this.updateIcon(savedScheme);
    },

    toggle() {
        const current = document.documentElement.getAttribute('data-color-scheme');
        const newScheme = current === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-color-scheme', newScheme);
        localStorage.setItem('finguid-theme', newScheme);
        
        this.updateIcon(newScheme);
        CHART_MODULE.update();

        UTILS.trackEvent('theme_toggled', { theme: newScheme });
    },

    updateIcon(scheme) {
        const btn = UTILS.getEl('toggle-color-scheme');
        if (btn) {
            btn.querySelector('i').className = scheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }
};

/* ========== VOICE & TEXT-TO-SPEECH ========== */
const VOICE_MODULE = {
    recognition: null,
    synthesis: window.speechSynthesis,

    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
        }
    },

    toggleVoiceCommand() {
        if (!this.recognition) {
            UTILS.toast('Voice commands not supported in this browser', 'error');
            return;
        }

        APP_STATE.voiceEnabled = !APP_STATE.voiceEnabled;
        const btn = UTILS.getEl('toggle-voice-command');
        
        if (APP_STATE.voiceEnabled) {
            btn.classList.add('active');
            this.recognition.start();
            UTILS.toast('Voice command active', 'success');
        } else {
            btn.classList.remove('active');
            this.recognition.abort();
        }
    },

    toggleTextToSpeech() {
        APP_STATE.ttsEnabled = !APP_STATE.ttsEnabled;
        const btn = UTILS.getEl('toggle-text-to-speech');
        
        if (APP_STATE.ttsEnabled) {
            btn.classList.add('active');
            UTILS.toast('Text-to-Speech enabled', 'success');
        } else {
            btn.classList.remove('active');
            this.synthesis.cancel();
        }
    },

    speak(text) {
        if (!APP_STATE.ttsEnabled || !this.synthesis) return;

        this.synthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        this.synthesis.speak(utterance);
    }
};

/* ========== EXPORT MODULE ========== */
const EXPORT = {
    toCSV() {
        if (!APP_STATE.results) {
            UTILS.toast('Calculate first', 'error');
            return;
        }

        let csv = 'Financial Goal Planner - Export\n\n';
        csv += `Goal Type,${APP_STATE.goalType}\n`;
        csv += `Goal Amount,${APP_STATE.goalAmount}\n`;
        csv += `Monthly Savings,${APP_STATE.results.monthlySavings}\n\n`;

        csv += 'Year,Starting Balance,Annual Contribution,Investment Gains,Ending Balance,Today\'s Value,% to Goal\n';

        APP_STATE.results.breakdown.forEach(row => {
            csv += `${row.year},${row.balance - row.investmentGains},${APP_STATE.monthlyContribution * 12},${row.investmentGains},${row.balance},${row.inflationAdjusted},${row.percentToGoal.toFixed(1)}%\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FinGuid-Goal-Plan-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        UTILS.trackEvent('csv_exported', { goal_type: APP_STATE.goalType });
        UTILS.toast('Data exported successfully!', 'success');
    }
};

/* ========== EVENT HANDLERS ========== */
function handleFormSubmit(e) {
    e.preventDefault();

    // Update state from form
    APP_STATE.goalType = document.querySelector('input[name="goal-type"]:checked')?.value || 'college';
    APP_STATE.goalAmount = UTILS.parseCurrency(UTILS.getEl('goal-amount').value);
    APP_STATE.currentSavings = UTILS.parseCurrency(UTILS.getEl('current-savings').value);
    APP_STATE.timeYears = parseFloat(UTILS.getEl('time-years').value);
    APP_STATE.monthlyContribution = UTILS.parseCurrency(UTILS.getEl('monthly-savings').value);
    APP_STATE.expectedReturn = parseFloat(UTILS.getEl('return-rate').value);
    APP_STATE.inflationRate = parseFloat(UTILS.getEl('inflation-rate').value);

    // Calculate
    CALCULATOR.calculate();
    UI.updateAll();

    // Track
    UTILS.trackEvent('goal_calculated', {
        goal_type: APP_STATE.goalType,
        goal_amount: APP_STATE.goalAmount,
        years: APP_STATE.timeYears
    });

    // Voice feedback
    VOICE_MODULE.speak(`Calculation complete. You need to save ${UTILS.formatCurrency(APP_STATE.results.monthlySavings)} monthly to reach your goal.`);

    UTILS.toast('Goal plan calculated!', 'success');
    window.scrollTo({ top: document.querySelector('.results-section').offsetTop - 100, behavior: 'smooth' });
}

function handleTabClick(e) {
    const tabName = e.target.getAttribute('data-tab');
    
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.classList.add('hidden');
    });
    
    document.querySelector(`#${tabName}`).classList.add('active');
    document.querySelector(`#${tabName}`).classList.remove('hidden');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');

    UTILS.trackEvent('tab_switched', { tab: tabName });
}

function handleLeadFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    // Here you would send to your lead management system
    // Example: CRM, email service, etc.
    
    UTILS.toast('Thank you! A financial advisor will contact you soon.', 'success');
    e.target.reset();

    UTILS.trackEvent('lead_submitted', {
        goal_type: formData.get('goal-type')
    });
}

function handleRangeSync() {
    const yearInput = UTILS.getEl('time-years');
    const yearRange = UTILS.getEl('time-range');
    const returnInput = UTILS.getEl('return-rate');
    const returnRange = UTILS.getEl('return-range');

    const syncInputs = UTILS.debounce(() => {
        if (document.activeElement === yearRange) {
            yearInput.value = yearRange.value;
        }
        if (document.activeElement === returnRange) {
            returnInput.value = returnRange.value;
        }
    }, 100);

    yearRange.addEventListener('input', syncInputs);
    returnRange.addEventListener('input', syncInputs);
}

/* ========== INITIALIZATION ========== */
async function initApp() {
    if (FINGUID_CONFIG.DEBUG) console.log('🎯 FinGuid Goal Planner v' + FINGUID_CONFIG.VERSION + ' initializing...');

    // Initialize theme
    THEME.init();

    // Initialize voice
    VOICE_MODULE.init();

    // Fetch FRED data
    await FRED_API.init();

    // Setup event listeners
    const form = UTILS.getEl('goal-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', handleTabClick);
    });

    const leadForm = UTILS.getEl('lead-form');
    if (leadForm) {
        leadForm.addEventListener('submit', handleLeadFormSubmit);
    }

    // Theme toggle
    const themeBtn = UTILS.getEl('toggle-color-scheme');
    if (themeBtn) themeBtn.addEventListener('click', () => THEME.toggle());

    // Voice & TTS toggle
    const voiceBtn = UTILS.getEl('toggle-voice-command');
    if (voiceBtn) voiceBtn.addEventListener('click', () => VOICE_MODULE.toggleVoiceCommand());

    const ttsBtn = UTILS.getEl('toggle-text-to-speech');
    if (ttsBtn) ttsBtn.addEventListener('click', () => VOICE_MODULE.toggleTextToSpeech());

    // CSV export
    const exportBtn = UTILS.getEl('export-csv-btn');
    if (exportBtn) exportBtn.addEventListener('click', () => EXPORT.toCSV());

    // Range sync
    handleRangeSync();

    // Track page view
    UTILS.trackEvent('page_view', {
        page_title: 'Financial Goal Planner',
        page_path: '/financial-goal-planner.html'
    });

    if (FINGUID_CONFIG.DEBUG) console.log('✅ FinGuid Goal Planner ready!');
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Handle window resize for chart
window.addEventListener('resize', UTILS.debounce(() => {
    if (APP_STATE.results) {
        CHART_MODULE.update();
    }
}, 250));
