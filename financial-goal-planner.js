/**
 * FINANCIAL GOAL PLANNER - World's First AI-Powered Savings Calculator
 * FinGuid USA - Production v1.0
 * * Features:
 * - Solves for Monthly Contribution, Final Value, or Time
 * - Inflation-adjusted goal calculation
 * - Dynamic projection chart (Chart.js)
 * - Year-by-year savings schedule
 * - AI-Powered Insights Engine
 * - FRED API Integration (CPI for Inflation, 10-Yr Treasury for Return Benchmark)
 * - Voice Command & Text-to-Speech
 * - PWA & Dark/Light Mode support
 * - GA-ID: G-NYBL2CDNQJ
 * - FRED-API-KEY: 9c6c421f077f2091e8bae4f143ada59a
 */

const CONFIG = {
    VERSION: '1.0',
    DEBUG: false,
    GA_ID: 'G-NYBL2CDNQJ',
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    
    // FRED Series IDs
    FRED_SERIES_INFLATION: 'CPIAUCSL', // Consumer Price Index for All Urban Consumers
    FRED_SERIES_RETURN: 'DGS10',      // 10-Year Treasury Constant Maturity Rate
    
    charts: { projection: null },
    calculation: {
        inputs: {},
        projection: [],
        results: {}
    },
    
    // Voice/Speech Synthesis
    speech: {
        recognition: null,
        synth: window.speechSynthesis,
        isListening: false
    }
};

const UTILS = {
    /**
     * Formats a number as USD currency.
     */
    formatCurrency(amount, decimals = 0) {
        if (typeof amount !== 'number' || isNaN(amount)) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(amount);
    },

    /**
     * Parses a string (currency or percentage) into a float.
     */
    parseInput(id, isCurrency = true) {
        const elem = document.getElementById(id);
        if (!elem) {
            console.error(`Element not found: ${id}`);
            return 0;
        }
        const value = elem.value;
        if (isCurrency) {
            const clean = value.replace(/[$,]/g, '').trim();
            return parseFloat(clean) || 0;
        }
        return parseFloat(value) || 0;
    },

    /**
     * Displays a toast notification.
     */
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type} show`;
        toast.setAttribute('role', 'alert');
        toast.textContent = message;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * Tracks an event with Google Analytics.
     */
    trackEvent(eventName, eventData = {}) {
        if (typeof gtag === 'function') {
            gtag('event', eventName, eventData);
        }
    }
};

/**
 * Fetches a specific series from the FRED API.
 * @param {string} seriesId - The FRED series ID (e.g., 'CPIAUCSL').
 * @param {string} inputId - The ID of the input field to update.
 * @param {string} noteId - The ID of the note span to update.
 * @param {function} dataExtractor - Function to extract the desired value from observations.
 */
async function fetchFREDRate(seriesId, inputId, noteId, dataExtractor) {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${CONFIG.FRED_API_KEY}&file_type=json&sort_order=desc&limit=12`;
    const noteEl = document.getElementById(noteId);

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`FRED API response not ok for ${seriesId}`);
        const data = await response.json();
        
        const { value, date, note } = dataExtractor(data.observations);
        
        document.getElementById(inputId).value = value.toFixed(1);
        if (noteEl) noteEl.textContent = `${note} (${date})`;
        
    } catch (error) {
        console.error(`FRED Error for ${seriesId}:`, error);
        if (noteEl) noteEl.textContent = `Using default value.`;
    }
}

/**
 * Extracts the latest 10-Year Treasury rate.
 */
function extractReturnRate(observations) {
    const latest = observations.find(o => o.value !== ".");
    const value = parseFloat(latest.value);
    return { value: value, date: latest.date, note: `📈 Live 10-Yr Treasury: ${value.toFixed(2)}%` };
}

/**
 * Extracts the Year-over-Year inflation rate from CPI data.
 */
function extractInflationRate(observations) {
    const latest = observations.find(o => o.value !== ".");
    const prior = observations[11]; // 12th observation (1 year ago)
    const latestValue = parseFloat(latest.value);
    const priorValue = parseFloat(prior.value);
    const inflation = ((latestValue - priorValue) / priorValue) * 100;
    return { value: inflation, date: latest.date, note: `📊 Live Y/Y Inflation: ${inflation.toFixed(1)}%` };
}

/**
 * Initializes all FRED API data fetches.
 */
function initializeFRED() {
    fetchFREDRate(CONFIG.FRED_SERIES_INFLATION, 'inflation-rate', 'fred-inflation-note', extractInflationRate);
    fetchFREDRate(CONFIG.FRED_SERIES_RETURN, 'return-rate', 'fred-return-note', extractReturnRate);
}

// --- Financial Calculation Solvers ---

/**
 * Solves for the required monthly contribution.
 * PMT = (FV_Needed * i) / ((1 + i)^n - 1)
 */
function solveForMonthly(fv, i, n) {
    if (i === 0) return fv / n;
    return (fv * i) / (Math.pow(1 + i, n) - 1);
}

/**
 * Solves for the final future value.
 * FV = PV(1+i)^n + PMT[((1+i)^n - 1) / i]
 */
function solveForFinalValue(pv, pmt, i, n) {
    if (i === 0) return pv + (pmt * n);
    const fv_pv = pv * Math.pow(1 + i, n);
    const fv_pmt = pmt * (Math.pow(1 + i, n) - 1) / i;
    return fv_pv + fv_pmt;
}

/**
 * Solves for the number of periods (time).
 * n = ln((FV*i + PMT) / (PV*i + PMT)) / ln(1 + i)
 */
function solveForTimeline(fv, pv, pmt, i) {
    if (i === 0) return (fv - pv) / pmt;
    if (fv * i + pmt <= 0 || pv * i + pmt <= 0) return -1; // Cannot solve
    
    try {
        const n = Math.log((fv * i + pmt) / (pv * i + pmt)) / Math.log(1 + i);
        return n;
    } catch (e) {
        return -1; // Error (e.g., log of negative)
    }
}

/**
 * Main calculation function.
 */
function calculateGoal() {
    // 1. Get Inputs
    const inputs = {
        goalAmount: UTILS.parseInput('goal-amount'),
        timelineYears: UTILS.parseInput('goal-timeline', false),
        currentSavings: UTILS.parseInput('current-savings'),
        returnRate: UTILS.parseInput('return-rate', false) / 100,
        inflationRate: UTILS.parseInput('inflation-rate', false) / 100,
        mode: document.getElementById('calculation-mode').value,
        monthlyContribution: UTILS.parseInput('monthly-contribution')
    };
    CONFIG.calculation.inputs = inputs;

    // 2. Adjust Goal for Inflation
    const inflatedGoal = inputs.goalAmount * Math.pow(1 + inputs.inflationRate, inputs.timelineYears);
    
    const i = inputs.returnRate / 12; // Monthly interest rate
    let n = inputs.timelineYears * 12; // Number of months
    const pv = inputs.currentSavings;
    let pmt = inputs.monthlyContribution;
    
    let result = {};
    let projection = [];

    // 3. Solve based on mode
    switch (inputs.mode) {
        case 'monthly':
            const fv_pv = pv * Math.pow(1 + i, n); // Future value of current savings
            const fv_needed = inflatedGoal - fv_pv; // How much more we need
            
            pmt = solveForMonthly(fv_needed, i, n);
            if (pmt < 0) pmt = 0; // Already have enough
            
            result = {
                label: "You Need to Save",
                value: UTILS.formatCurrency(pmt),
                unit: "/mo"
            };
            projection = generateProjection(pv, pmt, inputs.timelineYears, inputs.returnRate);
            break;

        case 'final_value':
            const finalValue = solveForFinalValue(pv, pmt, i, n);
            result = {
                label: "You Will Have",
                value: UTILS.formatCurrency(finalValue),
                unit: `in ${inputs.timelineYears} yrs`
            };
            projection = generateProjection(pv, pmt, inputs.timelineYears, inputs.returnRate);
            break;

        case 'timeline':
            n = solveForTimeline(inflatedGoal, pv, pmt, i);
            const yearsNeeded = n / 12;
            
            if (n === -1 || isNaN(n)) {
                result = { label: "Timeline", value: "N/A", unit: "Goal unreachable" };
                UTILS.showToast("With these savings, the goal is unreachable.", "error");
            } else {
                 result = {
                    label: "It Will Take",
                    value: yearsNeeded.toFixed(1),
                    unit: "years"
                };
            }
            projection = generateProjection(pv, pmt, yearsNeeded, inputs.returnRate);
            break;
    }

    CONFIG.calculation.results = result;
    CONFIG.calculation.projection = projection;
    CONFIG.calculation.inflatedGoal = inflatedGoal;

    updateUI();
    updateCharts();
    updateSchedule();
    generateAIInsights();
    
    UTILS.trackEvent('goal_calculation', {
        goal_mode: inputs.mode,
        goal_amount: inputs.goalAmount,
        goal_timeline: inputs.timelineYears
    });
}

/**
 * Generates the year-by-year data for chart and table.
 */
function generateProjection(pv, pmt, years, rate) {
    const projection = [];
    let balance = pv;
    const n = Math.ceil(years * 12);
    const i = rate / 12;

    for (let month = 1; month <= n; month++) {
        const growth = balance * i;
        balance += pmt + growth;
        
        // Store data at the end of each year
        if (month % 12 === 0 || month === n) {
            const year = Math.ceil(month / 12);
            const totalContributions = pv + (pmt * month);
            const totalGrowth = balance - totalContributions;
            projection.push({
                year: year,
                contribution: pmt * 12,
                growth: totalGrowth, // This is CUMULATIVE growth
                balance: balance
            });
        }
    }
    
    // Adjust growth to be annual, not cumulative, for the table
    let lastYearGrowth = 0;
    for (let item of projection) {
        let currentYearGrowth = item.growth;
        item.growth = currentYearGrowth - lastYearGrowth;
        lastYearGrowth = currentYearGrowth;
    }

    return projection;
}

/**
* Updates the main UI elements with calculation results.
*/
function updateUI() {
    const { results, projection, inputs, inflatedGoal } = CONFIG.calculation;
    
    // Update summary card
    document.getElementById('summary-label').textContent = results.label;
    document.getElementById('primary-result-display').textContent = results.value;
    document.getElementById('primary-result-unit').textContent = results.unit;

    const finalProjection = projection.length > 0 ? projection[projection.length - 1] : { balance: 0, contribution: 0, growth: 0 };
    const finalBalance = finalProjection.balance;
    const totalContributions = inputs.currentSavings + (inputs.monthlyContribution * (projection.length * 12));
    const totalGrowth = finalBalance - totalContributions;

    document.getElementById('projection-summary').textContent = `Inflated Goal: ${UTILS.formatCurrency(inflatedGoal)} | Final Balance: ${UTILS.formatCurrency(finalBalance)}`;
    
    // Update details tab
    document.getElementById('total-goal').textContent = UTILS.formatCurrency(inflatedGoal);
    document.getElementById('total-contributions').textContent = UTILS.formatCurrency(totalContributions);
    document.getElementById('total-growth').textContent = UTILS.formatCurrency(totalGrowth);
    document.getElementById('final-balance').textContent = UTILS.formatCurrency(finalBalance);
}

/**
 * Updates the projection chart.
 */
function updateCharts() {
    const { projection } = CONFIG.calculation;
    if (projection.length === 0) return;

    const ctx = document.getElementById('projection-canvas')?.getContext('2d');
    if (!ctx) return;

    const labels = projection.map(p => `Year ${p.year}`);
    const balances = projection.map(p => p.balance);
    const contributions = projection.map(p => CONFIG.calculation.inputs.currentSavings + (p.year * 12 * (CONFIG.calculation.inputs.mode === 'monthly' ? CONFIG.calculation.results.value.replace(/[$,]/g, '') : CONFIG.calculation.inputs.monthlyContribution)));
    
    // Calculate cumulative growth for the chart
    const growth = projection.map(p => p.balance - (CONFIG.calculation.inputs.currentSavings + (p.year * 12 * (CONFIG.calculation.inputs.mode === 'monthly' ? parseFloat(CONFIG.calculation.results.value.replace(/[$,]/g, '')) : CONFIG.calculation.inputs.monthlyContribution))));

    if (CONFIG.charts.projection) CONFIG.charts.projection.destroy();

    CONFIG.charts.projection = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Balance',
                    data: balances,
                    borderColor: 'rgba(36, 172, 185, 1)',
                    backgroundColor: 'rgba(36, 172, 185, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                },
                {
                    label: 'Total Contributions',
                    data: contributions,
                    borderColor: 'rgba(19, 52, 59, 0.6)',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderDash: [5, 5],
                },
                 {
                    label: 'Total Growth',
                    data: growth,
                    borderColor: 'rgba(16, 185, 129, 0.7)',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderDash: [3, 3],
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${UTILS.formatCurrency(ctx.parsed.y, 0)}`
                    }
                }
            },
            scales: {
                y: { ticks: { callback: (v) => UTILS.formatCurrency(v, 0) } }
            }
        }
    });
}

/**
 * Updates the year-by-year schedule table.
 */
function updateSchedule() {
    const { projection } = CONFIG.calculation;
    const tbody = document.querySelector('#projection-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    projection.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.year}</td>
            <td>${UTILS.formatCurrency(item.contribution, 0)}</td>
            <td>${UTILS.formatCurrency(item.growth, 0)}</td>
            <td>${UTILS.formatCurrency(item.balance, 0)}</td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Generates personalized AI insights based on inputs and results.
 */
function generateAIInsights() {
    const { inputs, results, inflatedGoal, projection } = CONFIG.calculation;
    const contentBox = document.getElementById('ai-insights-content');
    if (!contentBox) return;

    let html = '';
    const finalBalance = projection.length > 0 ? projection[projection.length - 1].balance : 0;

    // Insight 1: Inflation Impact
    if (inputs.inflationRate > 0 && inflatedGoal > inputs.goalAmount) {
        html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-exclamation-triangle"></i> <strong>Inflation Alert</strong>
            </div>
            <p>Your goal of <strong>${UTILS.formatCurrency(inputs.goalAmount)}</strong> will feel like <strong>${UTILS.formatCurrency(inflatedGoal)}</strong> in ${inputs.timelineYears} years due to ${inputs.inflationRate}% inflation. Our plan is based on this more realistic, higher target.</p>
        `;
    }

    // Insight 2: Shortfall / On Track
    if (inputs.mode === 'final_value') {
        if (finalBalance >= inflatedGoal) {
            html += `
                <div class="recommendation-alert low-priority">
                    <i class="fas fa-check-circle"></i> <strong>You're On Track!</strong>
                </div>
                <p>Congratulations! By saving <strong>${UTILS.formatCurrency(inputs.monthlyContribution)}/mo</strong>, you are projected to have <strong>${UTILS.formatCurrency(finalBalance)}</strong>, which exceeds your inflated goal of ${UTILS.formatCurrency(inflatedGoal)}.</p>
            `;
        } else {
             const monthlyNeeded = solveForMonthly(inflatedGoal - (inputs.currentSavings * Math.pow(1 + inputs.returnRate / 12, inputs.timelineYears * 12)), inputs.returnRate / 12, inputs.timelineYears * 12);
            html += `
                <div class="recommendation-alert high-priority">
                    <i class="fas fa-warning"></i> <strong>Goal Shortfall Warning</strong>
                </div>
                <p>At your current savings rate, you are projected to have <strong>${UTILS.formatCurrency(finalBalance)}</strong>, missing your goal by <strong>${UTILS.formatCurrency(inflatedGoal - finalBalance)}</strong>. To get back on track, you would need to save <strong>${UTILS.formatCurrency(monthlyNeeded)}/mo</strong>.</p>
            `;
        }
    }

    // Insight 3: Risk vs. Timeline
    if (inputs.timelineYears <= 3 && inputs.returnRate > 4) {
         html += `
            <div class="recommendation-alert high-priority">
                <i class="fas fa-shield-alt"></i> <strong>High-Risk Strategy Alert</strong>
            </div>
            <p>A <strong>${inputs.returnRate.toFixed(1)}%</strong> return for a short <strong>${inputs.timelineYears}-year</strong> goal is an aggressive strategy. Market downturns could cause you to miss your goal. For short-term goals, consider safer options like a <strong>High-Yield Savings Account</strong> or CDs, which protect your principal.</p>
            <p><i><strong>Sponsor:</strong> Check out our partner's High-Yield Savings account to grow your short-term savings safely.</i></p>
        `;
    } else if (inputs.timelineYears > 10 && inputs.returnRate < 5) {
         html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-chart-line"></i> <strong>Strategy Opportunity</strong>
            </div>
            <p>With a long timeline of <strong>${inputs.timelineYears} years</strong>, your plan may be too conservative. A <strong>${inputs.returnRate.toFixed(1)}%</strong> return might not be keeping up with long-term market averages. Increasing your risk tolerance slightly with a diversified portfolio could help you reach your goal much faster or with smaller contributions.</p>
        `;
    }
    
    if (html === '') {
        html = '<p>Your goal plan is balanced. Adjust your inputs to see more personalized insights!</p>';
    }

    contentBox.innerHTML = html;
}

// --- UI & Event Listeners ---

/**
 * Toggles the visibility of the monthly contribution input based on the mode.
 */
function toggleMonthlyInput() {
    const mode = document.getElementById('calculation-mode').value;
    const group = document.getElementById('monthly-contribution-group');
    
    if (mode === 'monthly') {
        group.classList.add('hidden');
    } else {
        group.classList.remove('hidden');
    }
}

/**
 * Toggles the color scheme (light/dark) and saves preference.
 */
function toggleColorScheme() {
    const html = document.documentElement;
    const scheme = html.getAttribute('data-color-scheme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-color-scheme', scheme);
    try { localStorage.setItem('colorScheme', scheme); } catch (e) {}
    
    // Update icon
    const icon = document.querySelector('#toggle-color-scheme i');
    icon.className = scheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    
    UTILS.trackEvent('theme_toggle', { theme: scheme });
    updateCharts(); // Re-render charts for new theme colors
}

/**
 * Loads saved color scheme preference.
 */
function loadPreferences() {
    try {
        const saved = localStorage.getItem('colorScheme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const scheme = saved || (prefersDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-color-scheme', scheme);
        
        const icon = document.querySelector('#toggle-color-scheme i');
        icon.className = scheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    } catch (e) {}
}

/**
 * Shows the specified tab and hides others.
 */
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('[role="tab"]').forEach(b => b.setAttribute('aria-selected', 'false'));
    
    document.getElementById(tabId)?.classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`)?.setAttribute('aria-selected', 'true');
    
    if (tabId === 'projection-chart') {
        CONFIG.charts.projection?.resize();
    }
    UTILS.trackEvent('view_tab', { tab_id: tabId });
}

// --- Voice Command & TTS ---

/**
 * Speaks the given text using the browser's Speech Synthesis.
 */
function speak(text) {
    if (!CONFIG.speech.synth) {
        UTILS.showToast("Text-to-Speech is not supported in this browser.", "error");
        return;
    }
    if (CONFIG.speech.synth.speaking) {
        CONFIG.speech.synth.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    CONFIG.speech.synth.speak(utterance);
}

/**
 * Reads the primary result aloud.
 */
function readResults() {
    const label = document.getElementById('summary-label').textContent;
    const value = document.getElementById('primary-result-display').textContent;
    const unit = document.getElementById('primary-result-unit').textContent;
    
    speak(`Your result is: ${label}, ${value} ${unit}.`);
    document.getElementById('toggle-text-to-speech').classList.replace('tts-inactive', 'tts-active');
    setTimeout(() => {
         document.getElementById('toggle-text-to-speech').classList.replace('tts-active', 'tts-inactive');
    }, 2000);
}

/**
 * Initializes the Speech Recognition engine.
 */
function initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        UTILS.showToast("Voice commands not supported in this browser.", "error");
        document.getElementById('toggle-voice-command').disabled = true;
        return;
    }
    
    CONFIG.speech.recognition = new SpeechRecognition();
    const recognition = CONFIG.speech.recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    const voiceBtn = document.getElementById('toggle-voice-command');

    recognition.onstart = () => {
        CONFIG.speech.isListening = true;
        voiceBtn.classList.replace('voice-inactive', 'voice-active');
        voiceBtn.title = "Listening... Click to stop.";
    };
    
    recognition.onend = () => {
        CONFIG.speech.isListening = false;
        voiceBtn.classList.replace('voice-active', 'voice-inactive');
        voiceBtn.title = "Enable Voice Control";
    };
    
    recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error !== 'no-speech') {
            UTILS.showToast(`Voice Error: ${event.error}`, "error");
        }
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        processVoiceCommand(transcript);
    };
}

/**
 * Toggles the voice command listener on or off.
 */
function toggleVoiceCommand() {
    if (!CONFIG.speech.recognition) {
        initializeSpeechRecognition();
    }
    if (CONFIG.speech.isListening) {
        CONFIG.speech.recognition.stop();
    } else {
        try {
            CONFIG.speech.recognition.start();
        } catch(e) {
            console.error("Could not start recognition:", e);
        }
    }
}

/**
 * Processes recognized voice commands.
 * @param {string} command - The recognized speech transcript.
 */
function processVoiceCommand(command) {
    console.log("Voice command:", command);
    let spokenResponse = "";

    try {
        if (command.includes("calculate") || command.includes("plan my goal")) {
            document.getElementById('goal-form').requestSubmit();
            spokenResponse = "Calculating your goal plan.";
        } else if (command.includes("what is the result") || command.includes("read the result")) {
            readResults();
            return; // readResults handles its own speech
        } else if (command.includes("set goal to")) {
            const amount = command.match(/set goal to.*?([\d,]+)/)?.[1]?.replace(/,/g, '');
            if (amount) {
                document.getElementById('goal-amount').value = amount;
                spokenResponse = `Goal amount set to ${UTILS.formatCurrency(parseFloat(amount))}.`;
                calculateGoal();
            }
        } else if (command.includes("set savings to")) {
            const amount = command.match(/set savings to.*?([\d,]+)/)?.[1]?.replace(/,/g, '');
            if (amount) {
                document.getElementById('current-savings').value = amount;
                spokenResponse = `Current savings set to ${UTILS.formatCurrency(parseFloat(amount))}.`;
                calculateGoal();
            }
        } else if (command.includes("set time to")) {
            const time = command.match(/set time to.*?(\d+)/)?.[1];
            if (time) {
                document.getElementById('goal-timeline').value = time;
                spokenResponse = `Timeline set to ${time} years.`;
                calculateGoal();
            }
        } else if (command.includes("show ai insights")) {
            showTab('ai-insights');
            spokenResponse = "Showing AI Insights.";
        } else if (command.includes("show projection")) {
            showTab('projection-chart');
            spokenResponse = "Showing projection chart.";
        } else {
            spokenResponse = "Sorry, I didn't understand that. Try 'set goal to 50000' or 'calculate'.";
        }
    } catch (e) {
        console.error("Voice command processing error:", e);
        spokenResponse = "There was an error processing your command.";
    }
    
    if (spokenResponse) {
        speak(spokenResponse);
    }
}


/**
 * Sets up all initial event listeners for the page.
 */
function setupEventListeners() {
    // Form submission
    document.getElementById('goal-form').addEventListener('submit', (e) => {
        e.preventDefault();
        calculateGoal();
    });

    // Calculation mode change
    document.getElementById('calculation-mode').addEventListener('change', toggleMonthlyInput);
    
    // Accessibility controls
    document.getElementById('toggle-color-scheme').addEventListener('click', toggleColorScheme);
    document.getElementById('toggle-voice-command').addEventListener('click', toggleVoiceCommand);
    document.getElementById('toggle-text-to-speech').addEventListener('click', readResults);

    // Tab navigation
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => showTab(btn.getAttribute('data-tab')));
    });

    // PWA Install Button
    document.getElementById('pwa-install-button').addEventListener('click', () => {
        // Logic to show install prompt (requires a 'beforeinstallprompt' event listener)
        // This is a placeholder as the prompt event is handled elsewhere.
        console.log("Install button clicked. Prompt logic should be handled.");
    });
}

/**
 * Fires when the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🇺🇸 FinGuid Financial Goal Planner v1.0 - AI-Powered');
    
    loadPreferences();
    setupEventListeners();
    initializeFRED(); // Fetch live rates
    toggleMonthlyInput(); // Set initial UI state
    calculateGoal(); // Run initial calculation with default values
    
    console.log('✅ Goal Planner Ready!');
});
