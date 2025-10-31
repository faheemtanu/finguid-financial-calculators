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

    function exportToCSV(data, filename) {
        const csvContent = data.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
        toggleClass,
        exportToCSV
    };
})();

// ==========================================================================
// S: FRED API SERVICE (SRP: Fetching external data)
// ==========================================================================
const FredService = (function(Config, Utils) {
    'use strict';

    async function fetchFREDRate(seriesId, inputId, noteId, dataExtractor) {
        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${Config.FRED_API_KEY}&file_type=json&sort_order=desc&limit=12`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`FRED API response not ok for ${seriesId}`);
            
            const data = await response.json();
            const rate = dataExtractor(data);

            if (rate !== null) {
                const roundedRate = Math.round(rate * 10) / 10;
                Utils.setInputValue(inputId, roundedRate);
                Utils.setElementHTML(noteId, `Using current FRED live rate: <strong>${roundedRate}%</strong>.`);
                return roundedRate;
            }
        } catch (error) {
            console.error(`Error fetching FRED data for ${seriesId}:`, error);
        }
        return Utils.parseInput(inputId, false); // Return default/user input if API fails
    }

    function extractCPI(data) {
        // Calculate year-over-year inflation from latest CPI data point
        const latest = data.observations.find(obs => obs.value !== '.');
        if (!latest) return null;
        
        const latestValue = parseFloat(latest.value);
        const latestDate = new Date(latest.date);
        
        // Find the observation from 12 months ago
        const yearAgo = new Date(latestDate);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);

        const yearAgoObs = data.observations
            .filter(obs => obs.value !== '.')
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .find(obs => new Date(obs.date) >= yearAgo);

        if (yearAgoObs) {
            const yearAgoValue = parseFloat(yearAgoObs.value);
            // CPI inflation calculation: ((latest / yearAgo) - 1) * 100
            const inflationRate = ((latestValue / yearAgoValue) - 1) * 100;
            return inflationRate;
        }

        return null;
    }

    function extract10YearTreasury(data) {
        // 10-year Treasury yield for benchmark
        const latest = data.observations.find(obs => obs.value !== '.');
        if (latest) {
            return parseFloat(latest.value);
        }
        return null;
    }

    function fetchInflationRate() {
        return fetchFREDRate(
            Config.FRED_SERIES_INFLATION,
            'inflation-rate',
            Config.DOM.fredInflationNote,
            extractCPI
        );
    }

    function fetchReturnBenchmark() {
        return fetchFREDRate(
            Config.FRED_SERIES_RETURN,
            'return-rate',
            Config.DOM.fredReturnNote,
            extract10YearTreasury
        );
    }

    // Expose public methods
    return {
        fetchInflationRate,
        fetchReturnBenchmark
    };
})(Config, Utils);

// ==========================================================================
// S: FINANCIAL CALCULATOR MODULE (SRP: Core TVM logic)
// ==========================================================================
const FinancialSolver = (function(Utils) {
    'use strict';

    const PERIODS_PER_YEAR = 12;

    /**
     * Future Value of an Annuity (FVA) + Future Value of a Lump Sum (FV)
     * FV = PV * (1 + i)^n + PMT * [((1 + i)^n - 1) / i]
     * @param {number} pv - Present Value (starting balance)
     * @param {number} pmt - Payment (monthly contribution)
     * @param {number} n - Total periods (timeline in years * 12)
     * @param {number} i - Rate per period (annual return / 12)
     * @returns {number} Final value (Future Value)
     */
    function solveForFinalValue(pv, pmt, n, i) {
        const fv_pv = pv * Math.pow(1 + i, n);
        let fv_pmt = 0;
        if (i !== 0) {
            fv_pmt = pmt * ((Math.pow(1 + i, n) - 1) / i);
        } else {
            fv_pmt = pmt * n; // Simple interest/no growth case
        }
        return fv_pv + fv_pmt;
    }

    /**
     * Solve for Payment (PMT)
     * PMT = [FV - PV * (1 + i)^n] * [i / ((1 + i)^n - 1)]
     * @param {number} fv_needed - The portion of the goal that needs to be covered by contributions (Goal - FV of PV)
     * @param {number} i - Rate per period (annual return / 12)
     * @param {number} n - Total periods (timeline in years * 12)
     * @returns {number} Monthly payment (PMT)
     */
    function solveForMonthly(fv_needed, i, n) {
        if (n <= 0) return fv_needed;
        if (i === 0) return fv_needed / n;

        // FVA = PMT * [((1 + i)^n - 1) / i]
        const fv_pmt_factor = (Math.pow(1 + i, n) - 1) / i;
        
        if (fv_pmt_factor === 0) return Infinity; // Should not happen with n > 0

        const pmt = fv_needed / fv_pmt_factor;
        return pmt;
    }

    /**
     * Solve for Number of Periods (N) using log functions
     * n = ln((FV*i + PMT) / (PV*i + PMT)) / ln(1 + i)
     * @param {number} fv - Future Value (Goal)
     * @param {number} pv - Present Value (starting balance)
     * @param {number} pmt - Payment (monthly contribution)
     * @param {number} i - Rate per period (annual return / 12)
     * @returns {number} Number of periods (n)
     */
    function solveForTimeline(fv, pv, pmt, i) {
        if (i === 0) return (fv - pv) / pmt;
        
        // This calculation only works if contributions are positive and the goal is reachable
        if (pmt <= 0) return Infinity; // Can't reach goal with no savings

        // Check for basic reachability
        if (fv <= pv) return 0;

        try {
            const numerator = Math.log((fv * i + pmt) / (pv * i + pmt));
            const denominator = Math.log(1 + i);
            
            if (denominator === 0) return Infinity;

            const n = numerator / denominator;
            return Math.ceil(n); // Number of periods (months)
        } catch (e) {
            console.error("Timeline calculation error:", e);
            return Infinity;
        }
    }

    /**
     * Calculates the inflation-adjusted goal amount.
     * @param {number} nominalGoal - The current cost of the goal.
     * @param {number} timelineYears - The number of years until the goal is needed.
     * @param {number} inflationRate - The annual inflation rate (as a percentage, e.g., 3).
     * @returns {number} The inflation-adjusted goal amount (Future Value).
     */
    function adjustForInflation(nominalGoal, timelineYears, inflationRate) {
        const r = inflationRate / 100;
        return nominalGoal * Math.pow(1 + r, timelineYears);
    }

    /**
     * Generates a year-by-year projection schedule.
     * @param {number} pv - Present Value (starting balance)
     * @param {number} pmt - Monthly contribution
     * @param {number} years - Total years
     * @param {number} annualReturn - Annual return rate (%)
     * @returns {Array<Object>} Array of yearly projection objects.
     */
    function generateProjection(pv, pmt, years, annualReturn) {
        const projection = [];
        let balance = pv;
        const i = annualReturn / 100 / PERIODS_PER_YEAR; // Rate per month
        const totalMonths = Math.ceil(years * PERIODS_PER_YEAR);
        
        let totalCash = pv;
        let cumulativeGrowth = 0;

        for (let month = 1; month <= totalMonths; month++) {
            const monthlyInterest = balance * i;
            const newBalance = balance + pmt + monthlyInterest;

            cumulativeGrowth += monthlyInterest;
            balance = newBalance;
            totalCash += pmt;

            // Store yearly data on the last month of the year
            if (month % PERIODS_PER_YEAR === 0 || month === totalMonths) {
                const year = Math.ceil(month / PERIODS_PER_YEAR);
                const yearEndBalance = balance;
                
                // Adjust contribution/growth for the first year if starting with PV
                let annualContribution = pmt * (month % PERIODS_PER_YEAR === 0 ? PERIODS_PER_YEAR : month);
                let annualGrowth = cumulativeGrowth;

                if (year > 1) {
                    // For subsequent years, calculate growth and contribution for just that year
                    const prevYearBalance = projection.length > 0 ? projection[projection.length - 1].balance : pv;
                    const thisYearStartBalance = prevYearBalance;

                    let monthlyBalance = thisYearStartBalance;
                    let yearGrowth = 0;
                    
                    const monthsInYear = month % PERIODS_PER_YEAR === 0 ? PERIODS_PER_YEAR : month % PERIODS_PER_YEAR;

                    for(let m = 1; m <= monthsInYear; m++) {
                        const mInterest = monthlyBalance * i;
                        yearGrowth += mInterest;
                        monthlyBalance = monthlyBalance + pmt + mInterest;
                    }
                    
                    annualContribution = pmt * monthsInYear;
                    annualGrowth = yearGrowth;
                } else if (month === totalMonths) {
                    // This handles the case where total years is < 1
                    annualContribution = pmt * totalMonths;
                } else {
                    // First full year (Year 1)
                    annualGrowth = cumulativeGrowth;
                }

                projection.push({
                    year: year,
                    contribution: annualContribution,
                    growth: annualGrowth,
                    balance: yearEndBalance
                });

                // Reset for next year (except balance which carries over)
                cumulativeGrowth = 0; 
            }
        }
        return projection;
    }
    
    // Expose public methods
    return {
        solveForFinalValue,
        solveForMonthly,
        solveForTimeline,
        adjustForInflation,
        generateProjection,
        PERIODS_PER_YEAR
    };
})(Utils);

// ==========================================================================
// S: AI INSIGHTS MODULE (SRP: Generating conditional advice)
// ==========================================================================
const AIInsights = (function(Utils, FinancialSolver) {
    'use strict';
    
    /**
     * Generates HTML content for AI-powered financial insights based on results.
     * @param {Object} results - The main calculation result object.
     * @param {Object} inputs - The user inputs object.
     * @param {number} inflatedGoal - The inflation-adjusted goal amount.
     * @returns {string} HTML string containing the insights.
     */
    function generate(results, inputs, inflatedGoal) {
        let html = '';
        const annualReturn = inputs.returnRate / 100;
        const timelineYears = inputs.timelineYears;
        const totalContributions = inputs.startingBalance + (inputs.monthlyContribution * inputs.timelineYears * FinancialSolver.PERIODS_PER_YEAR);
        
        // --- 1. General Check for Goal Feasibility ---
        if (inputs.mode === 'monthly') {
            const monthlyNeeded = results.value;
            
            if (monthlyNeeded <= 0) {
                html += `
                <div class="recommendation-alert low-priority">
                    <i class="fas fa-check-circle"></i> <strong>Goal Reached!</strong>
                </div>
                <p>Congratulations! Based on your current savings and expected returns, you will reach your goal of <strong>${Utils.formatCurrency(inflatedGoal)}</strong> in <strong>${inputs.timelineYears} years</strong> without any further monthly contributions. Consider investing any extra cash to exceed your goal.</p>
                `;
            } else if (monthlyNeeded > 0 && monthlyNeeded < 100) {
                html += `
                <p>Your monthly savings target is **${Utils.formatCurrency(monthlyNeeded)}**. This is a highly achievable goal! By automating this small amount, you can ensure you hit your target on time.</p>
                `;
            } else if (monthlyNeeded > 2000) {
                html += `
                <div class="recommendation-alert high-priority">
                    <i class="fas fa-exclamation-triangle"></i> <strong>High Target Alert</strong>
                </div>
                <p>Your required monthly contribution is quite high at **${Utils.formatCurrency(monthlyNeeded)}**. This may strain your current budget. To reduce this, consider:</p>
                <ul>
                    <li>**Increasing your timeline:** Adding 5 years to your plan could reduce the payment significantly.</li>
                    <li>**Increasing expected return:** Reviewing your investment strategy for potentially higher growth, though this involves more risk.</li>
                    <li>**Lowering your target goal:** Re-evaluating the actual final amount you need.</li>
                </ul>
                `;
            }
        } else if (inputs.mode === 'final_value') {
            const finalBalance = results.value;
            
            if (finalBalance >= inflatedGoal) {
                html += `
                <div class="recommendation-alert low-priority">
                    <i class="fas fa-trophy"></i> <strong>Target Exceeded!</strong>
                </div>
                <p>Your plan is on track to reach **${Utils.formatCurrency(finalBalance)}**, exceeding your inflation-adjusted goal of ${Utils.formatCurrency(inflatedGoal)}.</p>
                <p>The extra **${Utils.formatCurrency(finalBalance - inflatedGoal)}** provides a great buffer against market volatility or unexpected expenses. Well done!</p>
                `;
            } else {
                const monthlyNeeded = FinancialSolver.solveForMonthly(inflatedGoal - finalBalance, annualReturn / 12, inputs.timelineYears * 12);
                html += `
                <div class="recommendation-alert medium-priority">
                    <i class="fas fa-warning"></i> <strong>Goal Shortfall Warning</strong>
                </div>
                <p>At your current saving rate of **${Utils.formatCurrency(inputs.monthlyContribution)}/mo** you will only have **${Utils.formatCurrency(finalBalance)}**, missing your goal by **${Utils.formatCurrency(inflatedGoal - finalBalance)}**. To get back on track, you would need to save **${Utils.formatCurrency(monthlyNeeded)}/mo**.</p>
                `;
            }
        } else if (inputs.mode === 'timeline') {
            if (results.value > inputs.timelineYears * 1.5) {
                html += `
                <div class="recommendation-alert high-priority">
                    <i class="fas fa-warning"></i> <strong>Timeline Warning</strong>
                </div>
                <p>At **${Utils.formatCurrency(inputs.monthlyContribution)}/mo**, it will take **${results.value} years** to reach your goal, which is significantly longer than your initial target of **${inputs.timelineYears} years**. Consider increasing your monthly contribution or lowering your goal amount.</p>
                `;
            } else if (results.value <= inputs.timelineYears) {
                html += `
                <div class="recommendation-alert low-priority">
                    <i class="fas fa-chart-line"></i> <strong>Goal Ahead of Schedule!</strong>
                </div>
                <p>Great news! You are on track to reach your goal in **${results.value} years**, well ahead of your **${inputs.timelineYears}-year** target. You could consider reducing your contributions or moving the goal date closer!</p>
                `;
            }
        }
        
        // --- 2. Inflation & Return Insight ---
        if (inputs.inflationRate > inputs.returnRate) {
             html += `
            <div class="recommendation-alert high-priority">
                <i class="fas fa-leaf"></i> <strong>Inflation Risk Alert</strong>
            </div>
            <p>Your assumed **Inflation Rate (${inputs.inflationRate}%)** is higher than your **Expected Annual Return (${inputs.returnRate}%)**. This means the purchasing power of your money is actually shrinking. For long-term goals, you should aim for investments that are expected to beat inflation.</p>
            `;
        } else if (inputs.inflationRate > 4) {
             html += `
            <p>Your plan uses a high inflation rate. While necessary, remember that high inflation significantly increases your future goal target. Make sure you are using investments with strong historical growth to combat this.</p>
            `;
        }

        // --- 3. Compounding Insight (Long-Term Goals) ---
        if (timelineYears >= 15 && totalContributions < (inflatedGoal * 0.5)) {
            html += `
            <p>For your long **${timelineYears}-year** timeline, you are benefiting strongly from **compounding**. You only need to contribute **${Utils.formatCurrency(totalContributions)}** to achieve a goal of **${Utils.formatCurrency(inflatedGoal)}**! The majority of your final wealth comes from investment growth.</p>
            `;
        }
        
        if (html === '') {
             html = '<p>Your plan is balanced. Adjust your inputs to see more personalized insights!</p>';
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
        if (!('webkitSpeechRecognition' in window)) {
            console.warn("Speech Recognition not supported in this browser.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.toLowerCase().trim();
            console.log("Voice Command Recognized:", command);
            onCommandCallback(command);
        };

        recognition.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            if (event.error !== 'no-speech') {
                 Utils.showToast(`Voice Error: ${event.error}`, 'error');
            }
            isListening = false;
            document.getElementById('voice-toggle').setAttribute('aria-pressed', 'false');
            document.getElementById('voice-toggle').classList.remove('active');
        };
        
        recognition.onend = () => {
             if (isListening) {
                 // Restart listening if it stopped automatically and should still be active
                 // This ensures continuous listening if the user is actively speaking commands
                 try {
                    recognition.start();
                 } catch (e) {
                     // Sometimes fails if another recognition is still active
                     console.warn("Could not restart recognition:", e);
                 }
             }
        };

        document.getElementById('voice-toggle').addEventListener('click', () => {
            if (isListening) {
                recognition.stop();
                isListening = false;
                Utils.showToast("Voice commands disabled.");
            } else {
                recognition.start();
                isListening = true;
                Utils.showToast("Voice commands enabled. Try 'Calculate plan' or 'Read insights'.");
            }
            document.getElementById('voice-toggle').setAttribute('aria-pressed', isListening);
            document.getElementById('voice-toggle').classList.toggle('active', isListening);
        });
    }
    
    // Expose public methods
    return {
        initialize,
        speak
    };
})(Utils);

// ==========================================================================
// S: CHART MODULE (SRP: Handling Chart.js initialization and updates)
// ==========================================================================
const ChartModule = (function(Config, Utils) {
    'use strict';

    function createChart(ctx, data, inputs) {
        const labels = Array.from({ length: data.length }, (_, i) => `Year ${i + 1}`);
        const balances = data.map(p => p.balance);
        const contributions = data.map(p => p.contribution);
        
        // Calculate cumulative growth for the chart
        const growth = data.map((p, index) => p.balance - data[index].contribution - (index > 0 ? data[index-1].balance : inputs.startingBalance));

        if (Config.charts.projection) {
            Config.charts.projection.destroy();
        }

        const newChart = new Chart(ctx, {
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
                        pointRadius: 3,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Total Contributions (Annual)',
                        data: data.map(p => p.contribution),
                        borderColor: 'rgba(255, 159, 64, 1)',
                        backgroundColor: 'rgba(255, 159, 64, 0.1)',
                        tension: 0.4,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 2,
                        yAxisID: 'y'
                    }
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--color-text'),
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += Utils.formatCurrency(context.parsed.y, 0);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Year',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--color-text')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--color-text')
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--color-border')
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Value ($)',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--color-text')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--color-text'),
                            callback: function(value) {
                                return Utils.formatCurrency(value, 0).replace('$', '');
                            }
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--color-border')
                        }
                    }
                }
            }
        });

        Config.charts.projection = newChart;
        return newChart;
    }
    
    function update(canvasId, projectionData, inputs) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        if (Config.charts.projection) {
            Config.charts.projection.destroy();
        }
        createChart(ctx, projectionData, inputs);
    }

    return {
        create: createChart,
        update
    };
})(Config, Utils);

// ==========================================================================
// S: APPLICATION CONTROLLER (SRP: Orchestrating the UI and other modules)
// ==========================================================================
const AppController = (function(Config, Utils, FinancialSolver, ChartModule, AIInsights, FredService, SpeechModule) {
    'use strict';

    let state = {
        inputs: {},
        results: {},
        projection: [],
        inflatedGoal: 0
    };
    
    /**
     * @returns {Object} An object containing parsed user inputs.
     */
    function getInputs() {
        const goalName = document.getElementById(Config.DOM.goalSelect).value;
        const customGoal = goalName === 'Custom' ? document.getElementById(Config.DOM.goalCustomInput).value : goalName;
        
        const inputs = {
            goalName: customGoal,
            mode: document.getElementById(Config.DOM.modeSelect).value,
            nominalGoal: Utils.parseInput('goal-amount'),
            startingBalance: Utils.parseInput('starting-balance'),
            timelineYears: Utils.parseInput('goal-timeline', false),
            monthlyContribution: Utils.parseInput('monthly-contribution'),
            returnRate: Utils.parseInput('return-rate', false),
            inflationRate: Utils.parseInput('inflation-rate', false),
        };
        
        // Validate core numeric inputs
        if (inputs.timelineYears <= 0 && inputs.mode !== 'timeline') inputs.timelineYears = 1;
        if (inputs.returnRate < 0) inputs.returnRate = 0;
        if (inputs.inflationRate < 0) inputs.inflationRate = 0;

        return inputs;
    }
    
    /**
     * Handles the core financial calculation logic.
     */
    function handleCalculation() {
        const inputs = getInputs();
        state.inputs = inputs;

        const r = inputs.returnRate / 100;
        const i = r / FinancialSolver.PERIODS_PER_YEAR; // Monthly rate
        const years = inputs.timelineYears;

        // 1. Calculate inflation-adjusted goal
        state.inflatedGoal = FinancialSolver.adjustForInflation(inputs.nominalGoal, years, inputs.inflationRate);
        const inflatedGoal = state.inflatedGoal;

        const pv = inputs.startingBalance;
        const n = Math.ceil(years * FinancialSolver.PERIODS_PER_YEAR); // Total months

        let results = {};
        let finalPmt = inputs.monthlyContribution; // Default
        let finalYears = inputs.timelineYears;

        switch (inputs.mode) {
            case 'monthly':
                // FV_PV = PV * (1 + i)^n
                const fv_pv = pv * Math.pow(1 + i, n);
                const fv_needed = inflatedGoal - fv_pv;
                finalPmt = FinancialSolver.solveForMonthly(fv_needed, i, n);
                if (finalPmt < 0) finalPmt = 0; // If starting balance > goal, contribution is 0

                results = {
                    label: `Monthly Savings for ${inputs.goalName}`,
                    value: finalPmt,
                    unit: "/mo"
                };
                
                state.projection = FinancialSolver.generateProjection(pv, finalPmt, inputs.timelineYears, inputs.returnRate);
                break;

            case 'final_value':
                finalPmt = inputs.monthlyContribution;
                const finalValue = FinancialSolver.solveForFinalValue(pv, finalPmt, n, i);
                
                results = {
                    label: `Final Value of ${inputs.goalName}`,
                    value: finalValue,
                    unit: ""
                };
                
                state.projection = FinancialSolver.generateProjection(pv, finalPmt, inputs.timelineYears, inputs.returnRate);
                break;

            case 'timeline':
                finalPmt = inputs.monthlyContribution;
                const totalMonths = FinancialSolver.solveForTimeline(inflatedGoal, pv, finalPmt, i);
                finalYears = totalMonths / FinancialSolver.PERIODS_PER_YEAR;
                
                // If final years is Infinity, set it to max 50 for projection chart
                const projectionYears = finalYears === Infinity ? 50 : Math.ceil(finalYears);

                results = {
                    label: `Years to Reach ${inputs.goalName}`,
                    value: finalYears.toFixed(1),
                    unit: "years"
                };

                state.projection = FinancialSolver.generateProjection(pv, finalPmt, projectionYears, inputs.returnRate);
                break;

            default:
                break;
        }

        state.results = results;
        updateUI();
        Utils.trackEvent('goal_planner', 'calculation', { mode: inputs.mode, goal: inputs.goalName });
    }
    
    /**
     * Updates all UI elements with the latest results.
     */
    function updateUI() {
        const { inputs, results, projection, inflatedGoal } = state;

        // --- 1. Primary Result Card ---
        Utils.setElementText(Config.DOM.summaryLabel, results.label);
        
        let primaryValue = results.value;
        let primaryUnit = results.unit;
        
        if (inputs.mode === 'monthly' || inputs.mode === 'final_value') {
            // Currency formatting for money results
            primaryValue = Utils.formatCurrency(primaryValue, 0); 
        } else if (inputs.mode === 'timeline') {
            // Timeline results already formatted to 1 decimal
            primaryValue = results.value;
            if (primaryValue === (Infinity / FinancialSolver.PERIODS_PER_YEAR).toFixed(1)) {
                 primaryValue = ">50";
                 primaryUnit = "years";
            } else if (primaryValue === (0).toFixed(1) && results.value > 0) {
                // If it rounds to 0.0 but is actually positive, show a small number
                primaryValue = "<0.1";
            }
        }
        
        Utils.setElementText(Config.DOM.primaryResult, primaryValue);
        Utils.setElementText(Config.DOM.primaryUnit, primaryUnit);
        
        Utils.setElementText(Config.DOM.projectionSummary, 
            `Assuming ${inputs.returnRate}% return and ${inputs.inflationRate}% inflation over ${inputs.timelineYears} years.`);

        // --- 2. Detailed Breakdown (Summary Tab) ---
        const finalItem = projection[projection.length - 1];
        const finalBalance = finalItem ? finalItem.balance : inputs.startingBalance;
        
        let totalCashContributed = inputs.startingBalance;
        let totalGrowth = finalBalance - totalCashContributed;
        
        if (inputs.mode !== 'timeline' || finalBalance > inflatedGoal) {
             const finalYearIndex = projection.findIndex(item => item.balance >= inflatedGoal);
             if (finalYearIndex !== -1) {
                 // For monthly and final_value modes, we calculate based on full timeline
                 const totalMonths = inputs.timelineYears * FinancialSolver.PERIODS_PER_YEAR;
                 totalCashContributed = inputs.startingBalance + (inputs.monthlyContribution * totalMonths);
                 totalGrowth = finalBalance - totalCashContributed;
             }
        } else {
             // For timeline mode, total contributions is calculated from the exact required number of months
             totalCashContributed = inputs.startingBalance + (inputs.monthlyContribution * state.results.value * FinancialSolver.PERIODS_PER_YEAR);
             totalGrowth = finalBalance - totalCashContributed;
        }
        
        // Recalculate if mode is 'monthly' and the calculated monthly payment is used
        if (inputs.mode === 'monthly') {
             const finalPmt = state.results.value;
             const totalMonths = inputs.timelineYears * FinancialSolver.PERIODS_PER_YEAR;
             totalCashContributed = inputs.startingBalance + (finalPmt * totalMonths);
             
             // Recalculate Final Balance based on the required monthly payment
             const n = Math.ceil(inputs.timelineYears * FinancialSolver.PERIODS_PER_YEAR);
             const i = (inputs.returnRate / 100) / FinancialSolver.PERIODS_PER_YEAR;
             const recalculatedFinalBalance = FinancialSolver.solveForFinalValue(inputs.startingBalance, finalPmt, n, i);
             
             totalGrowth = recalculatedFinalBalance - totalCashContributed;
             Utils.setElementText(Config.DOM.finalBalance, Utils.formatCurrency(recalculatedFinalBalance, 0));
        } else {
             Utils.setElementText(Config.DOM.finalBalance, Utils.formatCurrency(finalBalance, 0));
        }
        
        Utils.setElementText(Config.DOM.totalGoal, Utils.formatCurrency(inflatedGoal, 0));
        Utils.setElementText(Config.DOM.totalContributions, Utils.formatCurrency(totalCashContributed, 0));
        Utils.setElementText(Config.DOM.totalGrowth, Utils.formatCurrency(totalGrowth, 0));
        
        // --- 3. AI Insights ---
        const aiHtml = AIInsights.generate(results, inputs, inflatedGoal);
        Utils.setElementHTML(Config.DOM.aiContent, aiHtml);

        // --- 4. Schedule Table ---
        updateScheduleTable(projection, inputs);

        // --- 5. Projection Chart ---
        const ctx = document.getElementById(Config.DOM.projectionCanvas);
        if (ctx) {
            ChartModule.create(ctx, projection, inputs);
        }
    }
    
    /**
     * Updates the year-by-year schedule table.
     * @param {Array<Object>} projection - The yearly projection data.
     * @param {Object} inputs - The user inputs object.
     */
    function updateScheduleTable(projection, inputs) {
        const tbody = document.querySelector(Config.DOM.projectionTableBody);
        if (!tbody) return;
        tbody.innerHTML = '';

        let cumulativeBalance = inputs.startingBalance;
        let cumulativeContribution = inputs.startingBalance;

        projection.forEach((item, index) => {
             // The projection data already contains the annual contribution and growth for the year.
             // We need to calculate the cumulative contribution and reset the annual contribution/growth.
            
             // Calculate cash contributed *this year*
             const yearContribution = item.contribution; 
             const yearGrowth = item.growth;
             
             cumulativeContribution += yearContribution;
             cumulativeBalance = item.balance; // Balance at end of year

             const row = document.createElement('tr');
             row.innerHTML = `
                 <td>${item.year}</td>
                 <td>${Utils.formatCurrency(yearContribution, 0)}</td>
                 <td>${Utils.formatCurrency(yearGrowth, 0)}</td>
                 <td>${Utils.formatCurrency(cumulativeBalance, 0)}</td>
             `;
             tbody.appendChild(row);
        });
    }

    /**
     * Toggles the visibility of the Monthly Contribution input field 
     * based on the selected calculation mode.
     */
    function toggleMonthlyInput() {
        const mode = document.getElementById(Config.DOM.modeSelect).value;
        const isSolvingForMonthly = mode === 'monthly';
        const isSolvingForTimeline = mode === 'timeline';

        // Monthly contribution input is hidden if we are solving FOR it.
        Utils.toggleClass(Config.DOM.monthlyInputGroup, 'hidden', isSolvingForMonthly);
        
        // Goal amount input is hidden if we are solving FOR Final Value (not strictly needed by the current logic, but good practice for clarity)
        Utils.toggleClass('goal-amount-group', 'hidden', mode === 'final_value');
        
        // Timeline input is hidden if we are solving FOR it.
        Utils.toggleClass('goal-timeline-group', 'hidden', isSolvingForTimeline);
        
        // Set required attribute based on visibility
        document.getElementById('monthly-contribution').required = !isSolvingForMonthly;
        document.getElementById('goal-amount').required = mode !== 'final_value';
        document.getElementById('goal-timeline').required = mode !== 'timeline';
        
        // Force re-calculation on mode change
        handleCalculation();
    }
    
    /**
     * Toggles the visibility of the custom goal name input field.
     */
    function toggleCustomGoalInput() {
        const goal = document.getElementById(Config.DOM.goalSelect).value;
        const isCustom = goal === 'Custom';
        
        Utils.toggleClass(Config.DOM.goalCustomGroup, 'hidden', !isCustom);
        document.getElementById(Config.DOM.goalCustomInput).required = isCustom;
        
        handleCalculation();
    }
    
    /**
     * Handles the tab switching logic.
     * @param {string} tabId - The ID of the tab to activate.
     */
    function handleTabSwitch(tabId) {
        const tabContents = document.querySelectorAll('.tab-content');
        const tabButtons = document.querySelectorAll('.tab-button');

        tabContents.forEach(content => {
            Utils.toggleClass(content.id, 'hidden', content.id !== tabId);
            content.setAttribute('aria-selected', content.id === tabId);
        });

        tabButtons.forEach(button => {
            Utils.toggleClass(button.id, 'active', button.getAttribute('aria-controls') === tabId);
            button.setAttribute('aria-selected', button.getAttribute('aria-controls') === tabId);
        });
        
        // Re-render chart on tab switch to ensure it renders correctly after being hidden
        if (tabId === 'projection-chart') {
             if (state.projection && state.projection.length > 0) {
                 ChartModule.update(Config.DOM.projectionCanvas, state.projection, state.inputs);
             }
        }
        
        Utils.trackEvent('goal_planner', 'tab_switch', { tab: tabId });
    }
    
    /**
     * Processes a voice command received from the SpeechModule.
     * @param {string} command - The text command.
     */
    function processVoiceCommand(command) {
        Utils.showToast(`Command: "${command}"`, 'info');
        
        if (command.includes('calculate') || command.includes('plan')) {
            handleCalculation();
            SpeechModule.speak("Calculation complete. Results updated.");
        } else if (command.includes('read insights') || command.includes('what do you think')) {
            const insightsText = document.getElementById(Config.DOM.aiContent).innerText;
            SpeechModule.speak(insightsText.replace(/\n/g, '. '));
        } else if (command.includes('monthly contribution')) {
            Utils.setInputValue(Config.DOM.modeSelect, 'monthly');
            toggleMonthlyInput();
            SpeechModule.speak("Switched mode to solve for monthly contribution.");
        } else if (command.includes('final value') || command.includes('balance')) {
            Utils.setInputValue(Config.DOM.modeSelect, 'final_value');
            toggleMonthlyInput();
            SpeechModule.speak("Switched mode to solve for final value.");
        } else if (command.includes('timeline') || command.includes('years')) {
            Utils.setInputValue(Config.DOM.modeSelect, 'timeline');
            toggleMonthlyInput();
            SpeechModule.speak("Switched mode to solve for timeline in years.");
        } else {
             SpeechModule.speak("Sorry, I didn't recognize that command.");
        }
    }


    /**
     * Initializes all event listeners and external services.
     */
    function initialize() {
        // --- 1. Fetch FRED API Data on load ---
        FredService.fetchInflationRate();
        FredService.fetchReturnBenchmark();
        
        // --- 2. Initialize Voice Module ---
        SpeechModule.initialize(processVoiceCommand);

        document.addEventListener('DOMContentLoaded', () => {
            
            // --- 3. Event Listeners for Form Changes (Recalculate on Change) ---
            const form = document.getElementById(Config.DOM.form);
            if (form) {
                // Use 'submit' event on form instead of 'change' on every input
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    handleCalculation();
                });
            }
            
            // Recalculate on selection changes
            document.getElementById(Config.DOM.modeSelect).addEventListener('change', toggleMonthlyInput);
            document.getElementById(Config.DOM.goalSelect).addEventListener('change', toggleCustomGoalInput);
            
            // Keyup/input event listeners for smoother updates without hitting enter
            const inputFields = document.querySelectorAll('input[type="number"], input[type="text"]');
            inputFields.forEach(input => {
                input.addEventListener('input', Utils.debounce(handleCalculation, 750));
            });

            // --- 4. Tab Listeners ---
            document.getElementById('summary-tab').addEventListener('click', () => handleTabSwitch('summary-details'));
            document.getElementById('projection-chart-tab').addEventListener('click', () => handleTabSwitch('projection-chart'));
            document.getElementById('schedule-tab').addEventListener('click', () => handleTabSwitch('schedule-table'));
            
            // --- 5. Action Buttons ---
            document.getElementById('export-csv-btn').addEventListener('click', () => {
                const header = ["Year", "Annual Contribution", "Investment Growth", "End Balance"];
                const data = state.projection.map(item => [
                    item.year, 
                    item.contribution.toFixed(2), 
                    item.growth.toFixed(2), 
                    item.balance.toFixed(2)
                ]);
                Utils.exportToCSV([header, ...data], `${state.inputs.goalName}-Savings-Schedule.csv`);
                Utils.showToast("Exported to CSV!", 'success');
                Utils.trackEvent('goal_planner', 'export', { goal: state.inputs.goalName });
            });
            
            document.getElementById('read-results-btn').addEventListener('click', () => {
                const insightsText = document.getElementById(Config.DOM.aiContent).innerText;
                SpeechModule.speak(insightsText.replace(/\n/g, '. '));
                Utils.trackEvent('goal_planner', 'read_insights');
            });

            // --- 6. Dark/Light Mode Toggle ---
            const colorSchemeToggle = document.getElementById('theme-toggle');
            if (colorSchemeToggle) {
                 const savedScheme = localStorage.getItem('colorScheme');
                 const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                 let currentScheme = savedScheme || (prefersDark ? 'dark' : 'light');

                 const setTheme = (scheme) => {
                     document.documentElement.setAttribute('data-color-scheme', scheme);
                     localStorage.setItem('colorScheme', scheme);
                     colorSchemeToggle.setAttribute('aria-pressed', scheme === 'dark');
                     const iconClass = scheme === 'dark' ? 'fa-sun' : 'fa-moon';
                     colorSchemeToggle.innerHTML = `<i class="fas ${iconClass}"></i>`;
                     
                     // If chart exists, re-render to update colors
                     if (Config.charts.projection) {
                         ChartModule.update(Config.DOM.projectionCanvas, state.projection, state.inputs);
                     }
                     
                     Utils.trackEvent('theme_toggle', { theme: scheme });
                 };
                 
                 setTheme(currentScheme);

                 colorSchemeToggle.addEventListener('click', () => {
                     currentScheme = currentScheme === 'dark' ? 'light' : 'dark';
                     setTheme(currentScheme);
                 });
            }

            // --- 7. FAQ Accessibility (Accordion) ---
            const faqItems = document.querySelectorAll('.faq-item');
            faqItems.forEach(item => {
                const summary = item.querySelector('summary');
                const content = item.querySelector('[itemprop="acceptedAnswer"]');
                
                // Initialize aria attributes
                content.setAttribute('aria-hidden', !item.open);
                summary.setAttribute('aria-expanded', item.open);

                item.addEventListener('toggle', () => {
                    const isExpanded = item.open;
                    summary.setAttribute('aria-expanded', isExpanded);
                    content.setAttribute('aria-hidden', !isExpanded);
                });
            });

            // --- 8. PWA Install ---
            let deferredPrompt;
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                document.getElementById('pwa-install-button').classList.remove('hidden');
            });

            document.getElementById('pwa-install-button').addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log(`User response to install prompt: ${outcome}`);
                    deferredPrompt = null;
                    document.getElementById('pwa-install-button').classList.add('hidden');
                }
            });
            
            // --- 9. Initial setup ---
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
