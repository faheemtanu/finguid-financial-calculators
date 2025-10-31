/**
 * FINANCIAL GOAL PLANNER - World's First AI-Powered Savings Calculator
 * FinGuid USA - Production v1.1 (S.O.L.I.D. Architecture)
 *
 * Features:
 * - Solves for Monthly Contribution, Final Value, or Time
 * - Inflation-adjusted goal calculation
 * - Dynamic projection chart (Chart.js)
 * - Year-by-year savings schedule
 * - AI-Powered Insights Engine (Dynamic & Conditional)
 * - FRED API Integration (CPI for Inflation, 10-Yr Treasury for Return Benchmark)
 * - Voice Command & Text-to-Speech
 * - PWA & Dark/Light Mode support
 * - GA-ID: G-NYBL2CDNQJ
 * - FRED-API-KEY: 9c6c421f077f2091e8bae4f143ada59a
 */

// ==========================================================================
// S: CONFIGURATION MODULE (SRP: Storing static config)
// ==========================================================================
const Config = (function() {
    'use strict';

    return {
        GA_ID: 'G-NYBL2CDNQJ',
        FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
        FRED_SERIES_INFLATION: 'CPIAUCSL', // Consumer Price Index
        FRED_SERIES_RETURN: 'DGS10',      // 10-Year Treasury
        DOM: {
            form: 'goal-form',
            goalSelect: 'goal-name-select',
            goalCustomGroup: 'goal-name-custom-group',
            goalCustomInput: 'goal-name-custom',
            modeSelect: 'calculation-mode',
            monthlyInputGroup: 'monthly-contribution-group',
            summaryLabel: 'summary-label',
            primaryResult: 'primary-result-display',
            primaryUnit: 'primary-result-unit',
            projectionSummary: 'projection-summary',
            totalGoal: 'total-goal',
            totalContributions: 'total-contributions',
            totalGrowth: 'total-growth',
            finalBalance: 'final-balance',
            projectionCanvas: 'projection-canvas',
            projectionTableBody: '#projection-table tbody',
            aiContent: 'ai-insights-content',
            fredInflationNote: 'fred-inflation-note',
            fredReturnNote: 'fred-return-note'
        },
        charts: {
            projection: null
        }
    };
})();

// ==========================================================================
// S: UTILITY MODULE (SRP: Formatting, Parsing, DOM Helpers)
// ==========================================================================
const Utils = (function() {
    'use strict';

    function formatCurrency(amount, decimals = 0) {
        if (typeof amount !== 'number' || isNaN(amount)) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(amount);
    }

    function parseInput(id, isCurrency = true) {
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
    }

    function showToast(message, type = 'success') {
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
    }

    function trackEvent(eventName, eventData = {}) {
        if (typeof gtag === 'function') {
            gtag('event', eventName, eventData);
        }
    }
    
    function setElementText(id, text) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = text;
        }
    }
    
    function setElementHTML(id, html) {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = html;
        }
    }
    
    function setInputValue(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.value = value;
        }
    }
    
    function toggleClass(id, className, show) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.toggle(className, show);
        }
    }

    // Expose public methods
    return {
        formatCurrency,
        parseInput,
        showToast,
        trackEvent,
        setElementText,
        setElementHTML,
        setInputValue,
        toggleClass
    };
})();

// ==========================================================================
// S: FRED API SERVICE (SRP: Fetching external data)
// ==========================================================================
const FredService = (function(Config, Utils) {
    'useD strict';

    async function fetchFREDRate(seriesId, inputId, noteId, dataExtractor) {
        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${Config.FRED_API_KEY}&file_type=json&sort_order=desc&limit=12`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`FRED API response not ok for ${seriesId}`);
            const data = await response.json();
            
            const { value, note } = dataExtractor(data.observations);
            
            Utils.setInputValue(inputId, value.toFixed(1));
            Utils.setElementText(noteId, note);
            
        } catch (error) {
            console.error(`FRED Error for ${seriesId}:`, error);
            Utils.setElementText(noteId, `Using default value.`);
        }
    }

    function extractReturnRate(observations) {
        const latest = observations.find(o => o.value !== ".");
        const value = parseFloat(latest.value);
        return { value: value, note: `📈 Live 10-Yr Treasury: ${value.toFixed(2)}% (${latest.date})` };
    }

    function extractInflationRate(observations) {
        const latest = observations.find(o => o.value !== ".");
        const prior = observations[11]; // 12th observation (1 year ago)
        const latestValue = parseFloat(latest.value);
        const priorValue = parseFloat(prior.value);
        const inflation = ((latestValue - priorValue) / priorValue) * 100;
        return { value: inflation, note: `📊 Live Y/Y Inflation: ${inflation.toFixed(1)}% (${latest.date})` };
    }

    function initialize() {
        fetchFREDRate(Config.FRED_SERIES_INFLATION, 'inflation-rate', Config.DOM.fredInflationNote, extractInflationRate);
        fetchFREDRate(Config.FRED_SERIES_RETURN, 'return-rate', Config.DOM.fredReturnNote, extractReturnRate);
    }
    
    return {
        initialize
    };
})(Config, Utils);

// ==========================================================================
// S: FINANCIAL SOLVER MODULE (SRP: Core financial math)
// ==========================================================================
const FinancialSolver = (function() {
    'use strict';

    // PMT = (FV * i) / ((1 + i)^n - 1)
    function solveForMonthly(fv, i, n) {
        if (i === 0) return fv / n;
        return (fv * i) / (Math.pow(1 + i, n) - 1);
    }

    // FV = PV(1+i)^n + PMT[((1+i)^n - 1) / i]
    function solveForFinalValue(pv, pmt, i, n) {
        if (i === 0) return pv + (pmt * n);
        const fv_pv = pv * Math.pow(1 + i, n);
        const fv_pmt = pmt * (Math.pow(1 + i, n) - 1) / i;
        return fv_pv + fv_pmt;
    }

    // n = ln((FV*i + PMT) / (PV*i + PMT)) / ln(1 + i)
    function solveForTimeline(fv, pv, pmt, i) {
        if (i === 0) return (fv - pv) / pmt;
        if (pmt <= 0) return Infinity; // Can't reach goal with no savings
        if (fv * i + pmt <= 0 || pv * i + pmt <= 0) return Infinity; 
        
        try {
            return Math.log((fv * i + pmt) / (pv * i + pmt)) / Math.log(1 + i);
        } catch (e) {
            return Infinity; // Error (e.g., log of negative)
        }
    }
    
    function generateProjection(pv, pmt, years, rate) {
        const projection = [];
        let balance = pv;
        const n = Math.ceil(years * 12);
        const i = rate / 12;

        for (let month = 1; month <= n; month++) {
            balance += pmt + (balance * i); // Compound interest
            
            if (month % 12 === 0 || (month === n && n % 12 !== 0)) {
                const year = Math.ceil(month / 12);
                projection.push({
                    year: year,
                    contribution: pmt * 12,
                    balance: balance
                });
            }
        }
        
        // Calculate annual growth
        let lastBalance = pv;
        for (let item of projection) {
            let annualContribution = item.contribution;
            // Adjust contribution for the final partial year
            if (item.year === projection.length && n % 12 !== 0) {
                 annualContribution = pmt * (n % 12);
            }
            item.growth = item.balance - lastBalance - annualContribution;
            lastBalance = item.balance;
        }

        return projection;
    }

    return {
        solveForMonthly,
        solveForFinalValue,
        solveForTimeline,
        generateProjection
    };
})();

// ==========================================================================
// S: CHART MODULE (SRP: Manages the Chart.js instance)
// ==========================================================================
const ChartModule = (function(Config, Utils) {
    'use strict';
    
    function update(canvasId, projection, inputs) {
        if (projection.length === 0) return;

        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return;

        const labels = projection.map(p => `Year ${p.year}`);
        const balances = projection.map(p => p.balance);
        
        // Calculate cumulative contributions for the chart
        const contributions = [];
        let runningTotal = inputs.currentSavings;
        projection.forEach(p => {
             // Adjust contribution for the final partial year
            let annualContribution = p.contribution;
            if (p.year === projection.length && (inputs.timelineYears * 12) % 12 !== 0) {
                 annualContribution = inputs.monthlyContribution * ((inputs.timelineYears * 12) % 12);
            }
            runningTotal += annualContribution;
            contributions.push(runningTotal);
        });

        // Calculate cumulative growth for the chart
        const growth = projection.map((p, index) => p.balance - contributions[index]);

        if (Config.charts.projection) {
            Config.charts.projection.destroy();
        }

        Config.charts.projection = new Chart(ctx, {
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
                            label: (ctx) => `${ctx.dataset.label}: ${Utils.formatCurrency(ctx.parsed.y, 0)}`
                        }
                    }
                },
                scales: {
                    y: { ticks: { callback: (v) => Utils.formatCurrency(v, 0) } }
                }
            }
        });
    }
    
    function resize() {
        if (Config.charts.projection) {
            Config.charts.projection.resize();
        }
    }

    return {
        update,
        resize
    };
})(Config, Utils);

// ==========================================================================
// S: AI INSIGHTS MODULE (SRP: Generating business logic/advice)
// ==========================================================================
const AIInsights = (function(Utils, Solver) {
    'use strict';
    
    function generate(inputs, results, inflatedGoal, projection) {
        let html = '';
        const finalBalance = projection.length > 0 ? projection[projection.length - 1].balance : 0;

        // Insight 1: Inflation Impact
        if (inputs.inflationRate > 0 && inflatedGoal > inputs.goalAmount) {
            html += `
                <div class="recommendation-alert medium-priority">
                    <i class="fas fa-exclamation-triangle"></i> <strong>Inflation Alert</strong>
                </div>
                <p>Your <strong>${inputs.goalName}</strong> goal of <strong>${Utils.formatCurrency(inputs.goalAmount)}</strong> will likely cost <strong>${Utils.formatCurrency(inflatedGoal)}</strong> in ${inputs.timelineYears} years due to ${inputs.inflationRate.toFixed(1)}% inflation. Our plan is based on this more realistic, higher target.</p>
            `;
        }

        // Insight 2: Shortfall / On Track / Timeline
        if (inputs.mode === 'final_value') {
            if (finalBalance >= inflatedGoal) {
                html += `
                    <div class="recommendation-alert low-priority">
                        <i class="fas fa-check-circle"></i> <strong>You're On Track!</strong>
                    </div>
                    <p>Congratulations! By saving <strong>${Utils.formatCurrency(inputs.monthlyContribution)}/mo</strong>, you are projected to have <strong>${Utils.formatCurrency(finalBalance)}</strong>, exceeding your inflated goal of ${Utils.formatCurrency(inflatedGoal)}.</p>
                `;
            } else {
                const i = inputs.returnRate / 12;
                const n = inputs.timelineYears * 12;
                const fv_pv = inputs.currentSavings * Math.pow(1 + i, n);
                const fv_needed = inflatedGoal - fv_pv;
                const monthlyNeeded = Solver.solveForMonthly(fv_needed, i, n);
                
                html += `
                    <div class="recommendation-alert high-priority">
                        <i class="fas fa-warning"></i> <strong>Goal Shortfall Warning</strong>
                    </div>
                    <p>At your current savings rate, you're projected to have <strong>${Utils.formatCurrency(finalBalance)}</strong>, missing your goal by <strong>${Utils.formatCurrency(inflatedGoal - finalBalance)}</strong>. To get back on track, you would need to save <strong>${Utils.formatCurrency(monthlyNeeded)}/mo</strong>.</p>
                `;
            }
        } else if (inputs.mode === 'timeline') {
             if (results.value > inputs.timelineYears * 1.5) {
                 html += `
                    <div class="recommendation-alert high-priority">
                        <i class="fas fa-warning"></i> <strong>Timeline Warning</strong>
                    </div>
                    <p>At <strong>${Utils.formatCurrency(inputs.monthlyContribution)}/mo</strong>, it will take <strong>${results.value} years</strong> to reach your goal, which is much longer than your ${inputs.timelineYears}-year target. You may need to increase your savings rate.</p>
                `;
             } else {
                 html += `
                    <div class="recommendation-alert low-priority">
                        <i class="fas fa-check-circle"></i> <strong>Goal is Achievable!</strong>
                    </div>
                    <p>By saving <strong>${Utils.formatCurrency(inputs.monthlyContribution)}/mo</strong>, you are on track to reach your goal in <strong>${results.value} years</strong>, which is within your target timeline.</p>
                `;
             }
        }

        // Insight 3: Risk vs. Timeline
        if (inputs.timelineYears <= 3 && inputs.returnRate > 0.04) {
            html += `
                <div class="recommendation-alert high-priority">
                    <i class="fas fa-shield-alt"></i> <strong>High-Risk Strategy Alert</strong>
                </div>
                <p>A <strong>${(inputs.returnRate * 100).toFixed(1)}%</strong> return for a short <strong>${inputs.timelineYears}-year</strong> goal is an aggressive strategy. Market downturns could cause you to miss your goal. For short-term goals, consider safer options like a <strong>High-Yield Savings Account</strong> or CDs, which protect your principal.</p>
                <p><i><strong>Sponsor:</strong> Check out our partner's High-Yield Savings account to grow your short-term savings safely.</i></p>
            `;
        } else if (inputs.timelineYears > 15 && inputs.returnRate < 0.05) { // 5%
            html += `
                <div class="recommendation-alert medium-priority">
                    <i class="fas fa-chart-line"></i> <strong>Strategy Opportunity</strong>
                </div>
                <p>With a long timeline of <strong>${inputs.timelineYears} years</strong>, your plan may be too conservative. A <strong>${(inputs.returnRate * 100).toFixed(1)}%</strong> return might not be keeping up with long-term market averages. Increasing your risk tolerance slightly with a diversified portfolio could help you reach your goal much faster or with smaller contributions.</p>
            `;
        }
        
        // Insight 4: Power of Starting Savings
        if (inputs.currentSavings > 0) {
             const i = inputs.returnRate / 12;
             const n = inputs.timelineYears * 12;
             const fv_pv = inputs.currentSavings * Math.pow(1 + i, n);
             html += `
                <div class="recommendation-alert low-priority">
                    <i class="fas fa-rocket"></i> <strong>Head Start!</strong>
                </div>
                <p>Your current savings of <strong>${Utils.formatCurrency(inputs.currentSavings)}</strong> is a fantastic start. Left to grow on its own, it's projected to become <strong>${Utils.formatCurrency(fv_pv)}</strong>, accounting for <strong>${((fv_pv / finalBalance) * 100).toFixed(0)}%</strong> of your final balance!</p>
            `;
        }

        if (html === '') {
            html = '<p>Your goal plan is balanced. Adjust your inputs to see more personalized insights!</p>';
        }

        return html;
    }

    return {
        generate
    };
})(Utils, FinancialSolver);

// ==========================================================================
// S: SPEECH & VOICE MODULE (SRP: Handling a11y speech features)
// ==========================================================================
const SpeechModule = (function(Utils) {
    'use strict';
    
    let recognition;
    const synth = window.speechSynthesis;
    let isListening = false;
    
    function speak(text) {
        if (!synth) {
            Utils.showToast("Text-to-Speech is not supported in this browser.", "error");
            return;
        }
        if (synth.speaking) {
            synth.cancel();
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        synth.speak(utterance);
    }
    
    function initialize(onCommandCallback) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            Utils.showToast("Voice commands not supported.", "error");
            document.getElementById('toggle-voice-command').disabled = true;
            return;
        }
        
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        const voiceBtn = document.getElementById('toggle-voice-command');

        recognition.onstart = () => {
            isListening = true;
            voiceBtn.classList.replace('voice-inactive', 'voice-active');
            voiceBtn.title = "Listening... Click to stop.";
        };
        
        recognition.onend = () => {
            isListening = false;
            voiceBtn.classList.replace('voice-active', 'voice-inactive');
            voiceBtn.title = "Enable Voice Control";
        };
        
        recognition.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            if (event.error !== 'no-speech') Utils.showToast(`Voice Error: ${event.error}`, "error");
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase().trim();
            onCommandCallback(transcript);
        };
    }
    
    function toggleListening() {
        if (!recognition) return;
        if (isListening) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch(e) {
                console.error("Could not start recognition:", e);
            }
        }
    }
    
    return {
        initialize,
        toggleListening,
        speak
    };
})(Utils);

// ==========================================================================
// S: APPLICATION CONTROLLER (SRP: Orchestrating all modules)
// D: Depends on abstractions (modules), not concrete implementations.
// ==========================================================================
const AppController = (function(Config, Utils, Solver, Chart, AI, Fred, Speech) {
    'use strict';
    
    // Application state
    let state = {
        inputs: {},
        results: {},
        projection: [],
        inflatedGoal: 0
    };

    function handleCalculation() {
        // 1. Get Inputs
        let goalName = document.getElementById(Config.DOM.goalSelect).value;
        if (goalName === 'custom') {
            goalName = document.getElementById(Config.DOM.goalCustomInput).value || "Custom Goal";
        }

        const inputs = {
            goalName: goalName,
            goalAmount: Utils.parseInput('goal-amount'),
            timelineYears: Utils.parseInput('goal-timeline', false),
            currentSavings: Utils.parseInput('current-savings'),
            returnRate: Utils.parseInput('return-rate', false) / 100,
            inflationRate: Utils.parseInput('inflation-rate', false) / 100,
            mode: document.getElementById('calculation-mode').value,
            monthlyContribution: Utils.parseInput('monthly-contribution')
        };
        
        // 2. Core Logic
        const i = inputs.returnRate / 12; // Monthly interest rate
        let n = inputs.timelineYears * 12; // Number of months
        const pv = inputs.currentSavings;
        
        const inflatedGoal = inputs.goalAmount * Math.pow(1 + inputs.inflationRate, inputs.timelineYears);
        
        let results = {};
        let projection = [];
        let finalPmt = inputs.monthlyContribution; // Default
        let finalYears = inputs.timelineYears;

        switch (inputs.mode) {
            case 'monthly':
                const fv_pv = pv * Math.pow(1 + i, n);
                const fv_needed = inflatedGoal - fv_pv;
                finalPmt = Solver.solveForMonthly(fv_needed, i, n);
                if (finalPmt < 0) finalPmt = 0;
                
                results = { label: "You Need to Save", value: Utils.formatCurrency(finalPmt), unit: "/mo" };
                projection = Solver.generateProjection(pv, finalPmt, inputs.timelineYears, inputs.returnRate);
                break;

            case 'final_value':
                finalPmt = inputs.monthlyContribution;
                const finalValue = Solver.solveForFinalValue(pv, finalPmt, i, n);
                results = { label: "You Will Have", value: Utils.formatCurrency(finalValue), unit: `in ${inputs.timelineYears} yrs` };
                projection = Solver.generateProjection(pv, finalPmt, inputs.timelineYears, inputs.returnRate);
                break;

            case 'timeline':
                finalPmt = inputs.monthlyContribution;
                n = Solver.solveForTimeline(inflatedGoal, pv, finalPmt, i);
                finalYears = n / 12;
                
                if (n === Infinity || isNaN(n) || n < 0) {
                    results = { label: "Timeline", value: "N/A", unit: "Goal unreachable" };
                    Utils.showToast("With these savings, the goal is unreachable.", "error");
                    finalYears = 0;
                } else {
                    results = { label: "It Will Take", value: finalYears.toFixed(1), unit: "years" };
                }
                projection = Solver.generateProjection(pv, finalPmt, finalYears, inputs.returnRate);
                break;
        }
        
        // 3. Update State
        inputs.monthlyContribution = finalPmt; // Store the calculated or used PMT
        inputs.timelineYears = finalYears;     // Store the calculated or used Years
        state = { inputs, results, projection, inflatedGoal };
        
        // 4. Update UI (D: Pass data to modules)
        updateDOM(state);

        Utils.trackEvent('goal_calculation', {
            goal_mode: inputs.mode,
            goal_amount: inputs.goalAmount
        });
    }
    
    function updateDOM(state) {
        const { inputs, results, projection, inflatedGoal } = state;
        
        // Update summary card
        Utils.setElementText(Config.DOM.summaryLabel, results.label);
        Utils.setElementText(Config.DOM.primaryResult, results.value);
        Utils.setElementText(Config.DOM.primaryUnit, results.unit);

        const finalProjection = projection.length > 0 ? projection[projection.length - 1] : { balance: inputs.currentSavings };
        Utils.setElementText(Config.DOM.projectionSummary, `Inflated Goal: ${Utils.formatCurrency(inflatedGoal)} | Final Balance: ${Utils.formatCurrency(finalProjection.balance)}`);
        
        // Update details tab
        const totalContributions = inputs.currentSavings + projection.reduce((acc, p) => {
             // Adjust contribution for the final partial year
            let annualContribution = p.contribution;
            if (p.year === projection.length && (inputs.timelineYears * 12) % 12 !== 0) {
                 annualContribution = inputs.monthlyContribution * ((inputs.timelineYears * 12) % 12);
            }
            return acc + annualContribution;
        }, 0);
        
        const totalGrowth = finalProjection.balance - totalContributions;
        Utils.setElementText(Config.DOM.totalGoal, Utils.formatCurrency(inflatedGoal));
        Utils.setElementText(Config.DOM.totalContributions, Utils.formatCurrency(totalContributions));
        Utils.setElementText(Config.DOM.totalGrowth, Utils.formatCurrency(totalGrowth));
        Utils.setElementText(Config.DOM.finalBalance, Utils.formatCurrency(finalProjection.balance));
        
        // Update Table
        updateScheduleTable(projection, inputs);
        
        // Update Chart
        Chart.update(Config.DOM.projectionCanvas, projection, inputs);
        
        // Update AI Insights
        const aiHtml = AI.generate(inputs, results, inflatedGoal, projection);
        Utils.setElementHTML(Config.DOM.aiContent, aiHtml);
    }
    
    function updateScheduleTable(projection, inputs) {
        const tbody = document.querySelector(Config.DOM.projectionTableBody);
        if (!tbody) return;
        
        tbody.innerHTML = '';
        projection.forEach(item => {
            let annualContribution = item.contribution;
            // Adjust contribution for the final partial year
            if (item.year === projection.length && (inputs.timelineYears * 12) % 12 !== 0) {
                 annualContribution = inputs.monthlyContribution * ((inputs.timelineYears * 12) % 12);
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.year}</td>
                <td>${Utils.formatCurrency(annualContribution, 0)}</td>
                <td>${Utils.formatCurrency(item.growth, 0)}</td>
                <td>${Utils.formatCurrency(item.balance, 0)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    function handleVoiceCommand(command) {
        console.log("Voice command:", command);
        let spokenResponse = "";

        try {
            if (command.includes("calculate") || command.includes("plan my goal")) {
                document.getElementById(Config.DOM.form).requestSubmit();
                spokenResponse = "Calculating your goal plan.";
            } else if (command.includes("what is the result") || command.includes("read the result")) {
                Speech.speak(`Your result is: ${state.results.label}, ${state.results.value} ${state.results.unit}.`);
                return;
            } else if (command.includes("set goal to")) {
                const amount = command.match(/set goal to.*?([\d,]+)/)?.[1]?.replace(/,/g, '');
                if (amount) {
                    Utils.setInputValue('goal-amount', amount);
                    spokenResponse = `Goal amount set to ${Utils.formatCurrency(parseFloat(amount))}.`;
                    handleCalculation();
                }
            } else if (command.includes("set savings to")) {
                const amount = command.match(/set savings to.*?([\d,]+)/)?.[1]?.replace(/,/g, '');
                if (amount) {
                    Utils.setInputValue('current-savings', amount);
                    spokenResponse = `Current savings set to ${Utils.formatCurrency(parseFloat(amount))}.`;
                    handleCalculation();
                }
            } else if (command.includes("set time to")) {
                const time = command.match(/set time to.*?(\d+)/)?.[1];
                if (time) {
                    Utils.setInputValue('goal-timeline', time);
                    spokenResponse = `Timeline set to ${time} years.`;
                    handleCalculation();
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
            Speech.speak(spokenResponse);
        }
    }
    
    function toggleMonthlyInput() {
        const mode = document.getElementById(Config.DOM.modeSelect).value;
        Utils.toggleClass(Config.DOM.monthlyInputGroup, 'hidden', mode === 'monthly');
    }

    function toggleCustomGoalInput() {
        const mode = document.getElementById(Config.DOM.goalSelect).value;
        Utils.toggleClass(Config.DOM.goalCustomGroup, 'hidden', mode !== 'custom');
    }
    
    function showTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('[role="tab"]').forEach(b => b.setAttribute('aria-selected', 'false'));
        
        document.getElementById(tabId)?.classList.add('active');
        document.querySelector(`[data-tab="${tabId}"]`)?.setAttribute('aria-selected', 'true');
        
        if (tabId === 'projection-chart') {
            Chart.resize();
        }
        Utils.trackEvent('view_tab', { tab_id: tabId });
    }
    
    function toggleColorScheme() {
        const html = document.documentElement;
        const scheme = html.getAttribute('data-color-scheme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-color-scheme', scheme);
        try { localStorage.setItem('colorScheme', scheme); } catch (e) {}
        
        const icon = document.querySelector('#toggle-color-scheme i');
        icon.className = scheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        
        Utils.trackEvent('theme_toggle', { theme: scheme });
        Chart.update(Config.DOM.projectionCanvas, state.projection, state.inputs); // Re-render chart
    }

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
    
    function initialize() {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🇺🇸 FinGuid Financial Goal Planner v1.1 (S.O.L.I.D.)');
            
            loadPreferences();
            
            // Setup all event listeners
            document.getElementById(Config.DOM.form).addEventListener('submit', (e) => {
                e.preventDefault();
                handleCalculation();
            });
            document.getElementById(Config.DOM.modeSelect).addEventListener('change', toggleMonthlyInput);
            document.getElementById(Config.DOM.goalSelect).addEventListener('change', toggleCustomGoalInput);
            
            document.getElementById('toggle-color-scheme').addEventListener('click', toggleColorScheme);
            document.querySelectorAll('[data-tab]').forEach(btn => {
                btn.addEventListener('click', () => showTab(btn.getAttribute('data-tab')));
            });

            // Initialize Speech
            Speech.initialize(handleVoiceCommand);
            document.getElementById('toggle-voice-command').addEventListener('click', Speech.toggleListening);
            document.getElementById('toggle-text-to-speech').addEventListener('click', () => {
                 Speech.speak(`Your result is: ${state.results.label}, ${state.results.value} ${state.results.unit}.`);
            });
            
            // Fetch live data
            Fred.initialize(); 
            
            // Initial setup
            toggleMonthlyInput(); 
            toggleCustomGoalInput();
            handleCalculation(); // Run initial calculation
            
            console.log('✅ Goal Planner Ready!');
        });
    }

    return {
        initialize
    };

})(Config, Utils, FinancialSolver, ChartModule, AIInsights, FredService, SpeechModule);

// ==========================================================================
// START THE APPLICATION
// ==========================================================================
AppController.initialize();
