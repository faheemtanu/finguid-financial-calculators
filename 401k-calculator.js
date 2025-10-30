// ===== CONFIGURATION & CONSTANTS =====
const CONFIG = {
    IRS_LIMIT_2024: 23000,
    CATCHUP_LIMIT: 7500,
    DEFAULT_INFLATION: 0.025,
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_SERIES_ID: 'CPIAUCSL',
    GA_TRACKING_ID: 'G-NYBL2CDNQJ'
};

const TAX_BRACKETS_2024 = {
    single: [
        { limit: 11600, rate: 0.10 },
        { limit: 47150, rate: 0.12 },
        { limit: 100525, rate: 0.22 },
        { limit: 191950, rate: 0.24 },
        { limit: 243725, rate: 0.32 },
        { limit: 609350, rate: 0.35 },
        { limit: 10000000, rate: 0.37 }
    ],
    married_filing_jointly: [
        { limit: 23200, rate: 0.10 },
        { limit: 94300, rate: 0.12 },
        { limit: 201050, rate: 0.22 },
        { limit: 383900, rate: 0.24 },
        { limit: 487450, rate: 0.32 },
        { limit: 731200, rate: 0.35 },
        { limit: 10000000, rate: 0.37 }
    ],
    head_of_household: [
        { limit: 16550, rate: 0.10 },
        { limit: 63100, rate: 0.12 },
        { limit: 100500, rate: 0.22 },
        { limit: 191950, rate: 0.24 },
        { limit: 243700, rate: 0.32 },
        { limit: 609350, rate: 0.35 },
        { limit: 10000000, rate: 0.37 }
    ]
};

const AFFILIATE_PARTNERS = [
    { name: 'Robo-Advisor', icon: 'fas fa-robot', cta: 'Compare Advisors', key: 'robo' },
    { name: 'Financial Advisor Match', icon: 'fas fa-handshake', cta: 'Get Matched', key: 'advisor' },
    { name: 'High-Yield Savings', icon: 'fas fa-piggy-bank', cta: 'See Rates', key: 'savings' },
    { name: '401(k) Rollover', icon: 'fas fa-exchange-alt', cta: 'Start Rollover', key: 'rollover' }
];

// ===== STATE MANAGEMENT =====
let appState = {
    currentTheme: 'light',
    voiceEnabled: false,
    ttsEnabled: false,
    inflationRate: CONFIG.DEFAULT_INFLATION,
    lastCalculation: null,
    chart: null
};

// ===== UTILITY FUNCTIONS =====
const Utils = {
    formatCurrency: (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    },
    
    parseCurrency: (value) => {
        if (typeof value === 'number') return value;
        return parseFloat(value.toString().replace(/[$,]/g, '')) || 0;
    },
    
    formatPercent: (value, decimals = 1) => {
        return `${value.toFixed(decimals)}%`;
    },
    
    showToast: (message, duration = 3000) => {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), duration);
    },
    
    trackEvent: (category, action, label = '') => {
        if (typeof gtag === 'function') {
            gtag('event', action, {
                'event_category': category,
                'event_label': label
            });
        }
    }
};

// ===== CALCULATION ENGINE =====
const Calculator = {
    getMarginalTaxRate: (income, filingStatus) => {
        const brackets = TAX_BRACKETS_2024[filingStatus] || TAX_BRACKETS_2024.single;
        for (let bracket of brackets) {
            if (income <= bracket.limit) {
                return bracket.rate;
            }
        }
        return brackets[brackets.length - 1].rate;
    },
    
    calculateContributionLimit: (age, includeCatchup) => {
        let limit = CONFIG.IRS_LIMIT_2024;
        if (includeCatchup && age >= 50) {
            limit += CONFIG.CATCHUP_LIMIT;
        }
        return limit;
    },
    
    calculateEmployerMatch: (salary, contributionPercent, matchPercent, matchLimit) => {
        const yourContribution = salary * (contributionPercent / 100);
        const matchableAmount = salary * (matchLimit / 100);
        const employerMatch = Math.min(yourContribution, matchableAmount) * (matchPercent / 100);
        return employerMatch;
    },
    
    calculateProjection: (inputs) => {
        const {
            currentAge,
            retirementAge,
            salary,
            currentBalance,
            contributionPercent,
            matchPercent,
            matchLimit,
            salaryIncrease,
            rateOfReturn,
            includeCatchup,
            includeInflation,
            filingStatus
        } = inputs;
        
        const years = retirementAge - currentAge;
        const schedule = [];
        const inflationAdjustment = includeInflation ? appState.inflationRate : 0;
        const realReturn = rateOfReturn - inflationAdjustment;
        
        let balance = currentBalance;
        let currentSalary = salary;
        let totalContributions = 0;
        let totalMatch = 0;
        let totalGrowth = 0;
        
        for (let year = 0; year < years; year++) {
            const age = currentAge + year;
            const contributionLimit = this.calculateContributionLimit(age, includeCatchup);
            
            // Calculate contributions
            let yourContribution = currentSalary * (contributionPercent / 100);
            yourContribution = Math.min(yourContribution, contributionLimit);
            
            const employerMatch = this.calculateEmployerMatch(
                currentSalary,
                Math.min(contributionPercent, (contributionLimit / currentSalary) * 100),
                matchPercent,
                matchLimit
            );
            
            const totalYearContribution = yourContribution + employerMatch;
            
            // Calculate investment growth
            const beginningBalance = balance;
            const gains = beginningBalance * (realReturn / 100);
            balance = beginningBalance + totalYearContribution + gains;
            
            // Track totals
            totalContributions += yourContribution;
            totalMatch += employerMatch;
            totalGrowth += gains;
            
            schedule.push({
                age,
                salary: currentSalary,
                contribution: yourContribution,
                match: employerMatch,
                gains,
                balance
            });
            
            // Increase salary for next year
            currentSalary *= (1 + salaryIncrease / 100);
        }
        
        return {
            finalBalance: balance,
            totalContributions,
            totalMatch,
            totalGrowth,
            schedule,
            firstYear: schedule[0] || {}
        };
    }
};

// ===== AI INSIGHTS ENGINE =====
const AIEngine = {
    generateInsights: (inputs, results) => {
        const insights = [];
        const { contributionPercent, matchPercent, matchLimit, currentAge, retirementAge, salary, rateOfReturn } = inputs;
        const { finalBalance, totalMatch, firstYear } = results;
        
        // Insight 1: Employer Match Analysis
        if (contributionPercent < matchLimit) {
            const missedMatch = ((matchLimit - contributionPercent) / 100) * salary * (matchPercent / 100);
            insights.push({
                priority: 'high',
                icon: 'fas fa-exclamation-triangle',
                title: 'Missing Free Money!',
                text: `You're contributing ${contributionPercent}% but your employer matches up to ${matchLimit}%. You're missing ${Utils.formatCurrency(missedMatch)} in free employer match annually. Consider increasing your contribution to maximize this benefit.`
            });
        } else {
            insights.push({
                priority: 'low',
                icon: 'fas fa-check-circle',
                title: 'Full Employer Match Secured',
                text: `Excellent! You're contributing enough to receive the full employer match of ${Utils.formatCurrency(firstYear.match || 0)} annually. This is essentially free money for your retirement.`
            });
        }
        
        // Insight 2: Catch-up Contributions
        const yearsTo50 = 50 - currentAge;
        if (currentAge >= 50) {
            insights.push({
                priority: 'medium',
                icon: 'fas fa-rocket',
                title: 'Catch-Up Contributions Available',
                text: `At age ${currentAge}, you're eligible for catch-up contributions allowing an additional $${CONFIG.CATCHUP_LIMIT.toLocaleString()} annually. This could significantly boost your retirement savings.`
            });
        } else if (yearsTo50 <= 10 && yearsTo50 > 0) {
            insights.push({
                priority: 'low',
                icon: 'fas fa-clock',
                title: 'Future Catch-Up Opportunity',
                text: `In ${yearsTo50} years, you'll be eligible for catch-up contributions of $${CONFIG.CATCHUP_LIMIT.toLocaleString()} annually. Plan ahead to take advantage of this opportunity.`
            });
        }
        
        // Insight 3: Retirement Readiness
        const yearsToRetirement = retirementAge - currentAge;
        const estimatedNeeds = salary * 0.8 * 25; // 80% replacement, 4% withdrawal rule
        const readinessPercent = (finalBalance / estimatedNeeds) * 100;
        
        if (readinessPercent >= 100) {
            insights.push({
                priority: 'low',
                icon: 'fas fa-trophy',
                title: 'On Track for Retirement',
                text: `Based on the 4% withdrawal rule, your projected balance of ${Utils.formatCurrency(finalBalance)} could support annual retirement income of ${Utils.formatCurrency(finalBalance * 0.04)}. You're ${Math.round(readinessPercent)}% funded relative to an 80% salary replacement goal.`
            });
        } else if (readinessPercent >= 70) {
            insights.push({
                priority: 'medium',
                icon: 'fas fa-chart-line',
                title: 'Nearly There',
                text: `You're ${Math.round(readinessPercent)}% of the way to a comfortable retirement. Consider increasing contributions by ${Math.ceil((100 - readinessPercent) / 10)}% to reach your goal.`
            });
        } else {
            insights.push({
                priority: 'high',
                icon: 'fas fa-exclamation-circle',
                title: 'Retirement Gap Alert',
                text: `Your projected balance covers ${Math.round(readinessPercent)}% of estimated retirement needs. Consider increasing contributions, working longer, or consulting a financial advisor to close this gap.`
            });
        }
        
        // Insight 4: Tax Efficiency
        const marginalRate = Calculator.getMarginalTaxRate(salary, inputs.filingStatus);
        const taxSavings = firstYear.contribution * marginalRate;
        insights.push({
            priority: 'medium',
            icon: 'fas fa-percent',
            title: 'Tax Savings Benefit',
            text: `Your 401(k) contributions reduce your taxable income by ${Utils.formatCurrency(firstYear.contribution || 0)}, saving approximately ${Utils.formatCurrency(taxSavings)} in taxes annually at your ${Utils.formatPercent(marginalRate * 100, 0)} marginal rate.`
        });
        
        // Insight 5: Investment Return Impact
        if (rateOfReturn < 6) {
            insights.push({
                priority: 'medium',
                icon: 'fas fa-chart-bar',
                title: 'Conservative Investment Returns',
                text: `Your assumed ${rateOfReturn}% return is conservative. Historical S&P 500 returns average 10-11% annually. A diversified portfolio aligned with your risk tolerance could potentially improve long-term results.`
            });
        } else if (rateOfReturn > 10) {
            insights.push({
                priority: 'medium',
                icon: 'fas fa-balance-scale',
                title: 'Aggressive Return Assumption',
                text: `Your ${rateOfReturn}% return assumption is optimistic. While possible, it's wise to plan conservatively. Consider what-if scenarios with lower returns to ensure you're prepared for various market conditions.`
            });
        }
        
        // Insight 6: Time Horizon
        if (yearsToRetirement > 30) {
            insights.push({
                priority: 'low',
                icon: 'fas fa-hourglass-start',
                title: 'Time is Your Biggest Asset',
                text: `With ${yearsToRetirement} years until retirement, you have time for compound growth to work its magic. Even small increases in contributions now can result in significant gains over time.`
            });
        } else if (yearsToRetirement < 10) {
            insights.push({
                priority: 'high',
                icon: 'fas fa-hourglass-end',
                title: 'Approaching Retirement',
                text: `With only ${yearsToRetirement} years to retirement, it's crucial to maximize contributions now. Consider catch-up contributions if eligible and review your asset allocation with a financial advisor.`
            });
        }
        
        // Insight 7: Salary Growth Impact
        const avgSalaryIncrease = inputs.salaryIncrease;
        if (avgSalaryIncrease < 2) {
            insights.push({
                priority: 'low',
                icon: 'fas fa-arrow-up',
                title: 'Conservative Salary Projection',
                text: `Your ${avgSalaryIncrease}% annual salary increase is modest. Career advancement, job changes, or skill development could accelerate salary growth and increase retirement savings potential.`
            });
        }
        
        // Insight 8: Action Items
        const actions = [];
        if (contributionPercent < matchLimit) actions.push(`Increase contribution to ${matchLimit}% to maximize employer match`);
        if (currentAge >= 50) actions.push('Enable catch-up contributions');
        if (readinessPercent < 80) actions.push('Consider increasing total savings rate by 2-3%');
        actions.push('Review and rebalance portfolio annually');
        actions.push('Consult with a fiduciary financial advisor');
        
        insights.push({
            priority: 'low',
            icon: 'fas fa-tasks',
            title: 'Recommended Action Items',
            text: actions.map((action, i) => `${i + 1}. ${action}`).join(' | ')
        });
        
        return insights;
    }
};

// ===== UI CONTROLLER =====
const UI = {
    getInputValues: () => {
        return {
            currentAge: parseInt(document.getElementById('currentAge').value) || 30,
            retirementAge: parseInt(document.getElementById('retirementAge').value) || 65,
            salary: Utils.parseCurrency(document.getElementById('salary').value),
            currentBalance: Utils.parseCurrency(document.getElementById('currentBalance').value),
            contributionPercent: parseFloat(document.getElementById('contribution').value) || 6,
            matchPercent: parseFloat(document.getElementById('matchPercent').value) || 100,
            matchLimit: parseFloat(document.getElementById('matchLimit').value) || 6,
            salaryIncrease: parseFloat(document.getElementById('salaryIncrease').value) || 3,
            rateOfReturn: parseFloat(document.getElementById('rateOfReturn').value) || 7,
            includeCatchup: document.getElementById('includeCatchup').checked,
            includeInflation: document.getElementById('includeInflation').checked,
            filingStatus: document.getElementById('filingStatus').value
        };
    },
    
    validateInputs: (inputs) => {
        if (inputs.currentAge >= inputs.retirementAge) {
            Utils.showToast('Retirement age must be greater than current age');
            return false;
        }
        if (inputs.salary <= 0) {
            Utils.showToast('Please enter a valid salary');
            return false;
        }
        if (inputs.contributionPercent < 0 || inputs.contributionPercent > 100) {
            Utils.showToast('Contribution percentage must be between 0-100%');
            return false;
        }
        return true;
    },
    
    displayResults: (inputs, results) => {
        // Show results container
        document.getElementById('resultsContainer').classList.remove('results-hidden');
        document.getElementById('initialMessage').style.display = 'none';
        
        // Update summary card
        document.getElementById('summaryAmount').textContent = Utils.formatCurrency(results.finalBalance);
        document.getElementById('summaryBreakdown').textContent = 
            `Your Cont: ${Utils.formatCurrency(results.totalContributions)} | ` +
            `Employer Match: ${Utils.formatCurrency(results.totalMatch)} | ` +
            `Total Growth: ${Utils.formatCurrency(results.totalGrowth)}`;
        
        // Update summary tab
        const firstYear = results.firstYear;
        document.getElementById('firstYearContribution').textContent = Utils.formatCurrency(firstYear.contribution || 0);
        document.getElementById('firstYearMatch').textContent = Utils.formatCurrency(firstYear.match || 0);
        document.getElementById('firstYearTotal').textContent = Utils.formatCurrency((firstYear.contribution || 0) + (firstYear.match || 0));
        
        const marginalRate = Calculator.getMarginalTaxRate(inputs.salary, inputs.filingStatus);
        const taxSavings = firstYear.contribution * marginalRate;
        document.getElementById('taxRate').textContent = Utils.formatPercent(marginalRate * 100, 0);
        document.getElementById('taxSavings').textContent = Utils.formatCurrency(taxSavings);
        
        // Update chart
        this.updateChart(results.schedule);
        
        // Generate AI insights
        const insights = AIEngine.generateInsights(inputs, results);
        this.displayInsights(insights);
        
        // Update schedule table
        this.updateScheduleTable(results.schedule);
        
        // Display partner cards
        this.displayPartnerCards();
        
        // Speak results if TTS enabled
        if (appState.ttsEnabled) {
            Speech.speak(`Your projected retirement balance is ${Utils.formatCurrency(results.finalBalance)}`);
        }
        
        Utils.trackEvent('Calculator', 'calculation_completed', 'success');
    },
    
    updateChart: (schedule) => {
        const ctx = document.getElementById('projectionsChart');
        const isDark = appState.currentTheme === 'dark';
        
        const labels = schedule.map(row => row.age);
        const balances = schedule.map(row => row.balance);
        const contributions = schedule.map(row => {
            let total = row.contribution + row.match;
            for (let i = 0; i < schedule.indexOf(row); i++) {
                total += schedule[i].contribution + schedule[i].match;
            }
            return total;
        });
        
        if (appState.chart) {
            appState.chart.destroy();
        }
        
        appState.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Total Balance',
                        data: balances,
                        borderColor: '#24ACB9',
                        backgroundColor: 'rgba(36, 172, 185, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Total Contributions',
                        data: contributions,
                        borderColor: '#133C3B',
                        backgroundColor: 'rgba(19, 60, 59, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: isDark ? '#FFFFFF' : '#1F2121',
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${Utils.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                        ticks: { color: isDark ? '#B7B8B9' : '#646C8B' },
                        title: { display: true, text: 'Age', color: isDark ? '#FFFFFF' : '#1F2121' }
                    },
                    y: {
                        grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                        ticks: {
                            color: isDark ? '#B7B8B9' : '#646C8B',
                            callback: (value) => Utils.formatCurrency(value)
                        },
                        title: { display: true, text: 'Balance', color: isDark ? '#FFFFFF' : '#1F2121' }
                    }
                }
            }
        });
    },
    
    displayInsights: (insights) => {
        const container = document.getElementById('insightsList');
        container.innerHTML = insights.map(insight => `
            <div class="insight-card priority-${insight.priority}">
                <div class="insight-header">
                    <i class="insight-icon ${insight.icon}"></i>
                    <span class="insight-title">${insight.title}</span>
                    <span class="priority-badge ${insight.priority}">${insight.priority}</span>
                </div>
                <p class="insight-text">${insight.text}</p>
            </div>
        `).join('');
    },
    
    displayPartnerCards: () => {
        const container = document.getElementById('partnersCards');
        container.innerHTML = AFFILIATE_PARTNERS.map(partner => `
            <div class="partner-mini-card" data-partner="${partner.key}">
                <i class="${partner.icon}"></i>
                <h4>${partner.name}</h4>
                <button class="partner-cta" data-partner="${partner.key}">${partner.cta}</button>
            </div>
        `).join('');
    },
    
    updateScheduleTable: (schedule) => {
        const tbody = document.getElementById('scheduleBody');
        tbody.innerHTML = schedule.map(row => `
            <tr>
                <td>${row.age}</td>
                <td>${Utils.formatCurrency(row.salary)}</td>
                <td>${Utils.formatCurrency(row.contribution)}</td>
                <td>${Utils.formatCurrency(row.match)}</td>
                <td>${Utils.formatCurrency(row.gains)}</td>
                <td><strong>${Utils.formatCurrency(row.balance)}</strong></td>
            </tr>
        `).join('');
    }
};

// ===== THEME MANAGER =====
const Theme = {
    init: () => {
        const savedTheme = appState.currentTheme;
        this.apply(savedTheme);
    },
    
    toggle: () => {
        const newTheme = appState.currentTheme === 'light' ? 'dark' : 'light';
        this.apply(newTheme);
        Utils.trackEvent('UI', 'theme_toggle', newTheme);
    },
    
    apply: (theme) => {
        appState.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        
        const icon = document.querySelector('#darkModeToggle i');
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
        
        // Re-render chart if exists
        if (appState.chart && appState.lastCalculation) {
            UI.updateChart(appState.lastCalculation.schedule);
        }
    }
};

// ===== SPEECH & VOICE CONTROL =====
const Speech = {
    recognition: null,
    synthesis: window.speechSynthesis,
    
    initVoice: () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.log('Speech recognition not supported');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
            this.processVoiceCommand(transcript);
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };
    },
    
    toggleVoice: () => {
        if (!this.recognition) {
            Utils.showToast('Voice recognition not supported in this browser');
            return;
        }
        
        appState.voiceEnabled = !appState.voiceEnabled;
        const btn = document.getElementById('voiceToggle');
        
        if (appState.voiceEnabled) {
            this.recognition.start();
            btn.classList.add('voice-active');
            btn.title = 'Voice Control ON';
            Utils.showToast('Voice control activated. Try saying "calculate" or "show results"');
            Utils.trackEvent('Features', 'voice_enabled', 'on');
        } else {
            this.recognition.stop();
            btn.classList.remove('voice-active');
            btn.title = 'Voice Control OFF';
            Utils.showToast('Voice control deactivated');
            Utils.trackEvent('Features', 'voice_enabled', 'off');
        }
    },
    
    processVoiceCommand: (transcript) => {
        console.log('Voice command:', transcript);
        
        if (transcript.includes('calculate') || transcript.includes('compute')) {
            document.getElementById('calculateBtn').click();
            this.speak('Calculating your retirement projection');
        } else if (transcript.includes('dark mode') || transcript.includes('light mode')) {
            Theme.toggle();
            this.speak(`Switched to ${appState.currentTheme} mode`);
        } else if (transcript.includes('results') || transcript.includes('show me')) {
            this.speak('Displaying your retirement projection results');
        }
    },
    
    toggleTTS: () => {
        appState.ttsEnabled = !appState.ttsEnabled;
        const btn = document.getElementById('ttsToggle');
        
        if (appState.ttsEnabled) {
            btn.classList.add('active');
            Utils.showToast('Text-to-speech enabled');
            this.speak('Text to speech is now enabled');
            Utils.trackEvent('Features', 'tts_enabled', 'on');
        } else {
            btn.classList.remove('active');
            this.synthesis.cancel();
            Utils.showToast('Text-to-speech disabled');
            Utils.trackEvent('Features', 'tts_enabled', 'off');
        }
    },
    
    speak: (text) => {
        if (!appState.ttsEnabled) return;
        
        this.synthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        this.synthesis.speak(utterance);
    }
};

// ===== PWA MANAGER =====
const PWA = {
    deferredPrompt: null,
    
    init: () => {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                console.log('Service worker registration not available');
            });
        }
        
        // Handle install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            document.getElementById('installBtn').style.display = 'flex';
        });
        
        // Handle install click
        document.getElementById('installBtn').addEventListener('click', async () => {
            if (!this.deferredPrompt) return;
            
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                Utils.showToast('App installed successfully!');
                Utils.trackEvent('PWA', 'install', 'accepted');
            }
            
            this.deferredPrompt = null;
            document.getElementById('installBtn').style.display = 'none';
        });
    }
};

// ===== FRED API INTEGRATION =====
const FREDApi = {
    fetchInflationRate: async () => {
        try {
            const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${CONFIG.FRED_SERIES_ID}&api_key=${CONFIG.FRED_API_KEY}&file_type=json&sort_order=desc&limit=13`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.observations && data.observations.length >= 13) {
                const latest = parseFloat(data.observations[0].value);
                const yearAgo = parseFloat(data.observations[12].value);
                const inflationRate = ((latest - yearAgo) / yearAgo) * 100;
                
                appState.inflationRate = inflationRate / 100;
                document.getElementById('inflationRate').textContent = Utils.formatPercent(inflationRate);
                
                console.log('FRED inflation rate updated:', inflationRate);
            }
        } catch (error) {
            console.error('Error fetching FRED data:', error);
            document.getElementById('inflationRate').textContent = Utils.formatPercent(CONFIG.DEFAULT_INFLATION * 100);
        }
    }
};

// ===== TAB NAVIGATION =====
const Tabs = {
    init: () => {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                this.switchTab(tabId);
                Utils.trackEvent('Navigation', 'tab_switch', tabId);
            });
        });
    },
    
    switchTab: (tabId) => {
        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.querySelector(`[data-tab="${tabId}"]`).setAttribute('aria-selected', 'true');
        
        // Update panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');
    }
};

// ===== AFFILIATE TRACKING =====
const Affiliates = {
    init: () => {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-partner]') || e.target.closest('[data-partner]')) {
                const partner = e.target.getAttribute('data-partner') || e.target.closest('[data-partner]').getAttribute('data-partner');
                this.trackClick(partner);
            }
        });
    },
    
    trackClick: (partner) => {
        Utils.showToast(`Redirecting to ${partner} partner...`);
        Utils.trackEvent('Affiliate', 'click', partner);
        console.log('Affiliate click:', partner);
        // In production, redirect to actual affiliate links
    }
};

// ===== MAIN CALCULATOR FUNCTION =====
function calculate() {
    const inputs = UI.getInputValues();
    
    if (!UI.validateInputs(inputs)) {
        return;
    }
    
    const results = Calculator.calculateProjection(inputs);
    appState.lastCalculation = results;
    
    UI.displayResults(inputs, results);
}

// ===== FORMAT CURRENCY INPUTS =====
function formatCurrencyInput(input) {
    input.addEventListener('blur', () => {
        const value = Utils.parseCurrency(input.value);
        input.value = Utils.formatCurrency(value);
    });
    
    input.addEventListener('focus', () => {
        const value = Utils.parseCurrency(input.value);
        input.value = value > 0 ? value : '';
    });
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    Theme.init();
    Tabs.init();
    PWA.init();
    Speech.initVoice();
    Affiliates.init();
    
    // Fetch live inflation data
    FREDApi.fetchInflationRate();
    
    // Format currency inputs
    formatCurrencyInput(document.getElementById('salary'));
    formatCurrencyInput(document.getElementById('currentBalance'));
    
    // Event listeners
    document.getElementById('calculateBtn').addEventListener('click', calculate);
    document.getElementById('darkModeToggle').addEventListener('click', () => Theme.toggle());
    document.getElementById('voiceToggle').addEventListener('click', () => Speech.toggleVoice());
    document.getElementById('ttsToggle').addEventListener('click', () => Speech.toggleTTS());
    
    // Auto-calculate on input change (debounced)
    let debounceTimer;
    document.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (appState.lastCalculation) {
                    calculate();
                }
            }, 500);
        });
    });
    
    console.log('FinGuid 401(k) Calculator initialized');
    Utils.showToast('Welcome to FinGuid USA! Enter your details to get started.');
});
