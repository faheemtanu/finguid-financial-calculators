/*
 * FinGuid Business Loan Calculator
 * S.O.L.I.D. Inspired Modular JavaScript
 */

// --- A) APPLICATION CONTROLLER (Main) ---
// Orchestrates all other modules
const appController = (function(ui, calc, analysis, api, speech) {

    // --- DOM Elements ---
    const DOM = ui.getDomStrings();

    // --- FRED API Key ---
    // IMPORTANT: In a real-world app, this should be hidden on a server/proxy
    // to prevent public exposure. But as requested, it's here.
    const FRED_API_KEY = '9c6c421f077f2091e8bae4f143ada59a';

    // --- Global State ---
    let chartInstance = null;
    let lastAnalysisText = ""; // Store last analysis for TTS

    /**
     * Set up all event listeners for the application
     */
    const setupEventListeners = () => {
        document.getElementById(DOM.form).addEventListener('submit', ctrlCalculateLoan);
        document.getElementById(DOM.themeToggle).addEventListener('click', ui.toggleTheme);
        document.getElementById(DOM.fetchRate).addEventListener('click', ctrlFetchLiveRate);
        document.getElementById(DOM.voiceCommand).addEventListener('click', ctrlVoiceCommand);
        document.getElementById(DOM.ttsButton).addEventListener('click', ctrlReadResults);
        document.getElementById(DOM.clearButton).addEventListener('click', ui.clearForm);

        // Load theme preference from localStorage
        ui.loadTheme();
        
        // Register PWA Service Worker
        registerServiceWorker();
    };

    /**
     * Main calculation function triggered by form submit
     * @param {Event} e - The form submit event
     */
    const ctrlCalculateLoan = (e) => {
        e.preventDefault();

        // 1. Get user input
        const inputs = ui.getInputs();

        // 2. Validate input
        if (!inputs.loanAmount || !inputs.interestRate || !inputs.loanTerm) {
            ui.displayAiInsight("Please fill in all required loan fields.", "danger");
            return;
        }

        // 3. Perform calculations
        const { monthlyPayment, totalInterest, totalCost, amortizationSchedule } = 
            calc.calculateLoan(inputs.loanAmount, inputs.interestRate, inputs.loanTerm);

        // 4. Generate AI analysis
        const { insightHtml, insightText } = 
            analysis.generateInsights(inputs, { monthlyPayment, totalInterest });
        lastAnalysisText = insightText; // Save for TTS

        // 5. Display results
        ui.displayResults(
            inputs.loanAmount,
            monthlyPayment,
            totalInterest,
            totalCost,
            amortizationSchedule
        );
        ui.displayAiInsight(insightHtml);
        
        // 6. Draw Chart
        if (chartInstance) {
            chartInstance.destroy();
        }
        chartInstance = ui.displayChart(inputs.loanAmount, totalInterest);
    };

    /**
     * Controller to fetch live interest rate from FRED API
     */
    const ctrlFetchLiveRate = async () => {
        ui.setLoading(DOM.fetchRate, true);
        try {
            // Using 'DPRIME' (Bank Prime Loan Rate) as a relevant benchmark
            const rateData = await api.fetchFredData('DPRIME', FRED_API_KEY);
            if (rateData) {
                ui.updateInterestRate(rateData.value, rateData.date);
            } else {
                throw new Error('Could not parse rate data.');
            }
        } catch (error) {
            console.error('FRED API Error:', error);
            ui.displayRateInfo('Error fetching rate. Please try again.');
        } finally {
            ui.setLoading(DOM.fetchRate, false);
        }
    };

    /**
     * Controller for Voice Command
     */
    const ctrlVoiceCommand = () => {
        speech.startRecognition(
            (transcript) => {
                // Simple parsing logic (can be expanded)
                const numbers = transcript.match(/\d+(?:,\d+)*(?:\.\d+)?/g) || [];
                if (transcript.includes('loan amount') && numbers[0]) {
                    document.getElementById(DOM.loanAmount).value = numbers[0].replace(/,/g, '');
                }
                if (transcript.includes('interest rate') && numbers[0]) {
                    document.getElementById(DOM.interestRate).value = numbers[0];
                }
                if (transcript.includes('term') && numbers[0]) {
                    document.getElementById(DOM.loanTerm).value = numbers[0];
                }
                if (transcript.includes('calculate')) {
                    document.getElementById(DOM.calculateButton).click();
                }
            },
            (error) => {
                console.error('Voice Error:', error);
                ui.displayAiInsight('Voice command failed. Please try again.', 'danger');
            }
        );
    };

    /**
     * Controller for Text-to-Speech (TTS)
     */
    const ctrlReadResults = () => {
        if (!lastAnalysisText) {
            speech.speakText("Please calculate a loan first to hear the analysis.");
            return;
        }
        speech.speakText(lastAnalysisText);
    };

    /**
     * Register PWA Service Worker
     */
    const registerServiceWorker = () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('PWA Service Worker registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    };

    // Public init function
    return {
        init: () => {
            console.log('FinGuid Business Loan Calculator Initialized.');
            setupEventListeners();
        }
    };

})(uiController, calculatorController, analysisController, apiController, speechController);

// --- B) UI CONTROLLER ---
// Handles DOM manipulation (reading and writing)
const uiController = (function() {

    const DOMstrings = {
        form: 'loan-form',
        loanAmount: 'loan-amount',
        interestRate: 'interest-rate',
        loanTerm: 'loan-term',
        loanType: 'loan-type',
        monthlyRevenue: 'monthly-revenue',
        monthlyExpenses: 'monthly-expenses',
        calculateButton: 'calculate-btn',
        clearButton: 'clear-btn',
        fetchRate: 'fetch-rate',
        rateInfoDisplay: 'rate-info-display',
        resultsSection: 'results',
        monthlyPayment: 'monthly-payment',
        totalPrincipal: 'total-principal',
        totalInterest: 'total-interest',
        totalCost: 'total-cost',
        aiInsightContent: 'ai-insight-content',
        amortizationBody: 'amortization-body',
        loanChart: 'loan-chart',
        themeToggle: 'theme-toggle',
        voiceCommand: 'voice-command',
        ttsButton: 'tts-button'
    };

    /**
     * Format numbers to currency (American English)
     * @param {number} num - The number to format
     * @returns {string} - Formatted currency string
     */
    const formatCurrency = (num) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(num);
    };

    return {
        getDomStrings: () => DOMstrings,

        /**
         * Get all input values from the form
         * @returns {object} - An object with all form values
         */
        getInputs: () => ({
            loanAmount: parseFloat(document.getElementById(DOMstrings.loanAmount).value),
            interestRate: parseFloat(document.getElementById(DOMstrings.interestRate).value),
            loanTerm: parseFloat(document.getElementById(DOMstrings.loanTerm).value),
            loanType: document.getElementById(DOMstrings.loanType).value,
            monthlyRevenue: parseFloat(document.getElementById(DOMstrings.monthlyRevenue).value),
            monthlyExpenses: parseFloat(document.getElementById(DOMstrings.monthlyExpenses).value)
        }),
        
        /**
         * Display the main calculation results
         */
        displayResults: (principal, payment, interest, total, amortization) => {
            document.getElementById(DOMstrings.monthlyPayment).textContent = formatCurrency(payment);
            document.getElementById(DOMstrings.totalPrincipal).textContent = formatCurrency(principal);
            document.getElementById(DOMstrings.totalInterest).textContent = formatCurrency(interest);
            document.getElementById(DOMstrings.totalCost).textContent = formatCurrency(total);

            // Populate Amortization Table
            const tableBody = document.getElementById(DOMstrings.amortizationBody);
            let html = '';
            amortization.forEach(row => {
                html += `
                    <tr>
                        <td>${row.month}</td>
                        <td>${formatCurrency(row.payment)}</td>
                        <td>${formatCurrency(row.principal)}</td>
                        <td>${formatCurrency(row.interest)}</td>
                        <td>${formatCurrency(row.balance)}</td>
                    </tr>
                `;
            });
            tableBody.innerHTML = html;

            document.getElementById(DOMstrings.resultsSection).classList.remove('hidden');
        },

        /**
         * Display the dynamic AI insight message
         * @param {string} html - The HTML content for the insight panel
         * @param {string} type - 'info', 'success', 'warning', 'danger' (not used here, but in ctrlCalc)
         */
        displayAiInsight: (html, type = 'info') => {
            const contentEl = document.getElementById(DOMstrings.aiInsightContent);
            contentEl.innerHTML = html;
            
            // This is for simple text errors
            if (type !== 'info') {
                 contentEl.innerHTML = `<p class="insight-${type}">${html}</p>`;
            }
        },

        /**
         * Render the Principal vs. Interest Pie Chart
         * @returns {Chart} - The new Chart.js instance
         */
        displayChart: (principal, interest) => {
            const ctx = document.getElementById(DOMstrings.loanChart).getContext('2d');
            const isDark = document.body.classList.contains('dark-mode');
            
            return new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Total Principal', 'Total Interest'],
                    datasets: [{
                        data: [principal, interest],
                        backgroundColor: [
                            'rgba(0, 82, 204, 0.8)', // Primary
                            'rgba(255, 139, 0, 0.8)' // Warning
                        ],
                        borderColor: [
                            isDark ? '#1c1c1e' : '#ffffff'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: isDark ? '#f2f2f7' : '#172b4d'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${formatCurrency(context.raw)}`;
                                }
                            }
                        }
                    }
                }
            });
        },
        
        /**
         * Update the interest rate field from API
         * @param {string} rate - The new rate value
         * @param {string} date - The date of the rate observation
         */
        updateInterestRate: (rate, date) => {
            document.getElementById(DOMstrings.interestRate).value = rate;
            uiController.displayRateInfo(`Live Prime Rate: ${rate}% (as of ${date})`);
        },

        displayRateInfo: (message) => {
            document.getElementById(DOMstrings.rateInfoDisplay).innerHTML = message;
        },

        setLoading: (buttonId, isLoading) => {
            const button = document.getElementById(buttonId);
            if (isLoading) {
                button.disabled = true;
                button.textContent = 'Fetching...';
            } else {
                button.disabled = false;
                button.textContent = 'Get Live Rate';
            }
        },
        
        clearForm: () => {
            document.getElementById(DOMstrings.form).reset();
            document.getElementById(DOMstrings.resultsSection).classList.add('hidden');
            document.getElementById(DOMstrings.aiInsightContent).innerHTML = '<p>Enter your loan details and optional cash flow to receive AI analysis.</p>';
            if (window.chartInstance) {
                window.chartInstance.destroy();
            }
        },

        // --- Theme Toggler ---
        toggleTheme: () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        },

        loadTheme: () => {
            if (localStorage.getItem('theme') === 'dark' || 
               (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('theme'))) {
                document.body.classList.add('dark-mode');
            }
        }
    };

})();

// --- C) CALCULATOR CONTROLLER ---
// Handles all mathematical calculations
const calculatorController = (function() {

    return {
        /**
         * Calculates all loan metrics
         * @param {number} p - Principal (Loan Amount)
         * @param {number} r - Annual Interest Rate (e.g., 8.5)
         * @param {number} y - Loan Term (Years)
         * @returns {object} - All calculation results
         */
        calculateLoan: (p, r, y) => {
            const monthlyRate = (r / 100) / 12;
            const n = y * 12; // Total number of payments (months)

            // Monthly Payment (M) = P [ r(1+r)^n ] / [ (1+r)^n – 1]
            const monthlyPayment = p * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
            
            const totalCost = monthlyPayment * n;
            const totalInterest = totalCost - p;

            // Generate Amortization
            let balance = p;
            const amortizationSchedule = [];
            for (let i = 1; i <= n; i++) {
                const interestPayment = balance * monthlyRate;
                const principalPayment = monthlyPayment - interestPayment;
                balance -= principalPayment;

                amortizationSchedule.push({
                    month: i,
                    payment: monthlyPayment,
                    principal: principalPayment,
                    interest: interestPayment,
                    balance: balance > 0 ? balance : 0 // Avoid negative zero
                });
            }
            
            return { monthlyPayment, totalInterest, totalCost, amortizationSchedule };
        }
    };

})();

// --- D) ANALYSIS CONTROLLER ("AI" Insights) ---
// Generates dynamic analysis based on user input
const analysisController = (function() {

    const formatCurrency = (num) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);

    /**
     * Generates HTML and plain-text insights
     * @param {object} inputs - The user's form inputs
     * @param {object} results - The calculation results
     * @returns {object} - { insightHtml, insightText }
     */
    return {
        generateInsights: (inputs, results) => {
            let html = '';
            let text = '';

            // 1. Loan Type Insight
            const { loanType } = inputs;
            if (loanType === 'sba-7a' || loanType === 'sba-504') {
                html += `<p><strong class="insight-info">SBA Loan Insight:</strong> You've selected an SBA loan. These often have favorable, long-term rates but require detailed paperwork. The total interest is ${formatCurrency(results.totalInterest)}.</p>`;
                text += `SBA Loan Insight: You've selected an SBA loan. These often have favorable, long-term rates. The total interest is ${formatCurrency(results.totalInterest)}. `;
            } else {
                html += `<p><strong class="insight-info">Conventional Loan:</strong> For this ${inputs.loanTerm}-year conventional loan, your total interest paid will be ${formatCurrency(results.totalInterest)}.</p>`;
                text += `Conventional Loan: For this ${inputs.loanTerm}-year conventional loan, your total interest paid will be ${formatCurrency(results.totalInterest)}. `;
            }

            // 2. Cash Flow & DSCR Analysis
            const { monthlyRevenue, monthlyExpenses } = inputs;
            const { monthlyPayment } = results;

            if (monthlyRevenue > 0 && monthlyExpenses >= 0) {
                const netOperatingIncome = monthlyRevenue - monthlyExpenses;
                
                if (netOperatingIncome <= 0) {
                    html += `<p><strong class="insight-danger">Cash Flow Warning:</strong> Your monthly expenses meet or exceed your revenue, resulting in zero or negative net income. This loan is unaffordable and you are unlikely to be approved.</p>`;
                    text += `Cash Flow Warning: Your monthly expenses meet or exceed your revenue. This loan is unaffordable.`;
                
                } else {
                    // Debt Service Coverage Ratio (DSCR)
                    const dscr = netOperatingIncome / monthlyPayment;
                    // Business "DTI" (Payment as % of Net Income)
                    const paymentToIncomeRatio = (monthlyPayment / netOperatingIncome) * 100;
                    
                    let dscrInsight = '';
                    let dscrText = '';

                    if (dscr < 1.25) {
                        dscrInsight = `<strong class="insight-danger">High Risk (DSCR: ${dscr.toFixed(2)}):</strong> Lenders typically require a DSCR of 1.25x or higher. Your net income of ${formatCurrency(netOperatingIncome)} barely covers the new ${formatCurrency(monthlyPayment)} payment. Approval is unlikely.`;
                        dscrText = `High Risk. Your Debt Service Coverage Ratio is ${dscr.toFixed(2)}. Lenders typically require 1.25 or higher. Approval is unlikely.`;
                    } else if (dscr >= 1.25 && dscr < 1.75) {
                        dscrInsight = `<strong class="insight-warning">Moderate Risk (DSCR: ${dscr.toFixed(2)}):</strong> Your cash flow can cover this loan, but it will be tight, consuming ${paymentToIncomeRatio.toFixed(0)}% of your net income. Ensure your revenue forecasts are accurate.`;
                        dscrText = `Moderate Risk. Your DSCR is ${dscr.toFixed(2)}. This loan will consume ${paymentToIncomeRatio.toFixed(0)} percent of your net income.`;
                    } else {
                        dscrInsight = `<strong class="insight-success">Good Position (DSCR: ${dscr.toFixed(2)}):</strong> Your estimated net income of ${formatCurrency(netOperatingIncome)} comfortably covers the loan payment, consuming only ${paymentToIncomeRatio.toFixed(0)}% of it. Lenders will view this favorably.`;
                        dscrText = `Good Position. Your DSCR is ${dscr.toFixed(2)}. Your cash flow comfortably covers this payment.`;
                    }
                    html += `<p>${dscrInsight}</p>`;
                    text += dscrText;
                }
            } else {
                html += `<p><strong class="insight-info">Cash Flow Tip:</strong> Enter your monthly revenue and expenses to get an AI-powered cash flow analysis and see if you can truly afford this loan.</p>`;
                text += `Cash Flow Tip: Enter your monthly revenue and expenses to get an AI-powered cash flow analysis.`;
            }

            // 3. ROI Analysis
            html += `<p><strong class="insight-info">ROI Target:</strong> To be profitable, this ${formatCurrency(inputs.loanAmount)} loan must generate more than <strong>${formatCurrency(results.totalInterest)}</strong> in new, additional profit over the next ${inputs.loanTerm} years.</p>`;
            text += ` ROI Target: To be profitable, this loan must generate more than ${formatCurrency(results.totalInterest)} in new profit over ${inputs.loanTerm} years.`;

            return { insightHtml: html, insightText: text };
        }
    };

})();

// --- E) API CONTROLLER ---
// Handles external API calls (FRED)
const apiController = (function() {

    return {
        /**
         * Fetches data from the FRED API
         * @param {string} seriesId - The FRED series ID (e.g., 'DPRIME')
         * @param {string} apiKey - Your FRED API key
         * @returns {object|null} - { value, date } or null
         */
        fetchFredData: async (seriesId, apiKey) => {
            const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
            
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`FRED API request failed with status ${response.status}`);
                }
                const data = await response.json();
                
                if (data.observations && data.observations.length > 0) {
                    const latestObservation = data.observations[0];
                    // Check for placeholder '.' value
                    if(latestObservation.value === '.') {
                        // If latest is placeholder, try the next one (unlikely with limit=1 but good practice)
                        return null; 
                    }
                    return {
                        value: latestObservation.value,
                        date: latestObservation.date
                    };
                } else {
                    return null;
                }
            } catch (error) {
                console.error('Error fetching from FRED:', error);
                return null;
            }
        }
    };

})();

// --- F) SPEECH CONTROLLER ---
// Handles Web Speech API (Recognition & Synthesis)
const speechController = (function() {

    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;
    if (recognition) {
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
    }

    const synthesis = window.speechSynthesis;

    return {
        /**
         * Starts voice recognition
         * @param {function} onResult - Callback function for a successful result
         * @param {function} onError - Callback function for an error
         */
        startRecognition: (onResult, onError) => {
            if (!recognition) {
                onError('Speech recognition not supported in this browser.');
                return;
            }

            recognition.start();

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                onResult(transcript);
            };

            recognition.onspeechend = () => {
                recognition.stop();
            };

            recognition.onerror = (event) => {
                onError(event.error);
            };
        },

        /**
         * Speaks the given text
         * @param {string} text - The text to speak
         */
        speakText: (text) => {
            if (!synthesis) {
                console.error('Text-to-speech not supported in this browser.');
                return;
            }
            
            // Cancel any ongoing speech
            if (synthesis.speaking) {
                synthesis.cancel();
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            synthesis.speak(utterance);
        }
    };

})();

// --- Initialize the Application ---
document.addEventListener('DOMContentLoaded', appController.init);
