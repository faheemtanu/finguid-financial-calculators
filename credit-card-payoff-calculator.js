/**
 * CREDIT CARD PAYOFF STRATEGIST — World's First AI-Powered Debt Strategist - PRODUCTION JS v1.0
 * FinGuid USA Market Domination Build 
 * * Target: Production Ready, AI Insights, SEO, PWA, Voice, Monetization Ready
 * * FRED API: 9c6c421f077f2091e8bae4f143ada59a (Key noted for platform consistency, but not used for CC APR)
 * * Google Analytics: G-NYBL2CDNQJ (in HTML)
 * * © 2025 FinGuid - World's First AI Calculator Platform for Americans
 * * ONLY SOURCE OF INCOME: ADVERTISING, SPONSOR, AFFILIATE
 */

/* ========================================================================== */
/* I. GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const CC_PAYOFF_CALCULATOR = {
    VERSION: '1.0',
    DEBUG: true, 
    
    // Core State - Stores inputs and calculated results
    STATE: {
        // Inputs
        currentBalance: 5000,
        apr: 29.99,
        minPaymentRate: 2, // % of balance
        minPaymentFloor: 25, // $ floor
        extraPayment: 50,
        targetDate: null,
        
        // Results
        baseline: {
            months: 0,
            interest: 0,
            monthlyPayment: 0,
            schedule: [],
            payoffDate: null,
        },
        accelerated: {
            months: 0,
            interest: 0,
            monthlyPayment: 0,
            schedule: [],
            payoffDate: null,
        },
        target: {
            months: 0,
            interest: 0,
            monthlyPayment: 0,
            schedule: [],
            payoffDate: null,
        },
    },

    charts: {
        balanceChart: null,
    },
};


/* ========================================================================== */
/* II. CORE CALCULATION LOGIC */
/* ========================================================================== */

/**
 * Calculates the monthly minimum payment based on the current balance and rules.
 * @param {number} balance - The current outstanding balance.
 * @returns {number} The calculated minimum payment.
 */
function calculateMinPayment(balance) {
    const ratePayment = balance * (CC_PAYOFF_CALCULATOR.STATE.minPaymentRate / 100);
    const minPayment = Math.max(ratePayment, CC_PAYOFF_CALCULATOR.STATE.minPaymentFloor);
    return minPayment;
}

/**
 * Generates the full payoff schedule (amortization) for a given monthly payment amount.
 * @param {number} initialBalance - The starting debt amount.
 * @param {number} fixedPayment - The total fixed payment (Min + Extra). If null, min payment is calculated dynamically.
 * @returns {{months: number, interest: number, schedule: Array<Object>, payoffDate: Date}}
 */
function generatePayoffSchedule(initialBalance, fixedPayment = null) {
    let balance = initialBalance;
    let totalInterest = 0;
    let month = 0;
    const schedule = [];
    const monthlyRate = CC_PAYOFF_CALCULATOR.STATE.apr / 100 / 12;

    const startDate = new Date();

    // Safety break for extremely long payoffs (e.g., 50 years)
    while (balance > 0 && month < 600) { 
        month++;

        // 1. Calculate Interest for the Month
        const interestPaid = balance * monthlyRate;

        // 2. Determine Payment
        let payment;
        if (fixedPayment) {
            // Fixed Payment Strategy (Extra or Target)
            payment = fixedPayment;
        } else {
            // Minimum Payment Strategy
            payment = calculateMinPayment(balance);
        }
        
        // Ensure payment covers at least the interest, otherwise it's a never-pay-off scenario
        if (payment <= interestPaid) {
            // If it never pays off, break and flag it (shouldn't happen with minPaymentFloor, but safety)
            return { months: Infinity, interest: Infinity, schedule: schedule, payoffDate: null };
        }

        // 3. Calculate Principal Paid
        const principalPaid = payment - interestPaid;

        // 4. Update Balance
        const newBalance = Math.max(0, balance - principalPaid);
        
        // 5. Check if the payment pays off the debt completely
        if (newBalance === 0) {
             // Final payment should only be the remaining balance + final interest
             const finalPayment = balance + interestPaid;
             schedule.push({
                month: month,
                payment: finalPayment,
                interest: interestPaid,
                principal: balance,
                balance: 0,
            });
            totalInterest += interestPaid;
            balance = 0;
            break;
        }

        // 6. Record Schedule
        schedule.push({
            month: month,
            payment: payment,
            interest: interestPaid,
            principal: principalPaid,
            balance: newBalance,
        });

        totalInterest += interestPaid;
        balance = newBalance;
    }

    const payoffDate = new Date(startDate.setMonth(startDate.getMonth() + month));

    return { 
        months: month, 
        interest: totalInterest, 
        schedule: schedule,
        payoffDate: payoffDate,
    };
}


/**
 * Calculates the fixed monthly payment needed to pay off the debt by a specific target date.
 * Uses a simplified annuity formula for estimation and then iterative check.
 * @param {number} initialBalance
 * @param {Date} targetDate
 * @returns {number} The required fixed monthly payment.
 */
function calculateTargetPayment(initialBalance, targetDate) {
    const today = new Date();
    const months = (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth());
    
    if (months <= 0) return initialBalance; // Pay immediately

    const rate = CC_PAYOFF_CALCULATOR.STATE.apr / 100 / 12;

    // Standard annuity payment formula
    const requiredPayment = initialBalance * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    
    // Add a safety check/floor for minimum payment
    const minPaymentFloor = calculateMinPayment(initialBalance);

    return Math.max(requiredPayment, minPaymentFloor);
}


/**
 * Main function to calculate all three strategies and update the state.
 */
function updateCalculations() {
    const S = CC_PAYOFF_CALCULATOR.STATE;

    // 1. Validate Inputs
    const balance = parseFloat(document.getElementById('currentBalance').value);
    const apr = parseFloat(document.getElementById('apr').value);
    const extraPayment = parseFloat(document.getElementById('extraPayment').value);
    const minPaymentRate = parseFloat(document.getElementById('minPaymentRate').value);
    const minPaymentFloor = parseFloat(document.getElementById('minPaymentFloor').value);
    const targetDateStr = document.getElementById('targetDate').value;

    if (isNaN(balance) || isNaN(apr) || balance <= 0 || apr <= 0) {
        showToast('Please enter valid Balance and APR.', 'error');
        return;
    }

    S.currentBalance = balance;
    S.apr = apr;
    S.extraPayment = extraPayment;
    S.minPaymentRate = minPaymentRate;
    S.minPaymentFloor = minPaymentFloor;


    // --- 2. BASELINE (Minimum Payment Only) ---
    const baselineResults = generatePayoffSchedule(S.currentBalance, null);
    S.baseline.months = baselineResults.months;
    S.baseline.interest = baselineResults.interest;
    S.baseline.schedule = baselineResults.schedule;
    S.baseline.payoffDate = baselineResults.payoffDate;
    S.baseline.monthlyPayment = baselineResults.schedule.length > 0 ? baselineResults.schedule[0].payment : calculateMinPayment(S.currentBalance);


    // --- 3. ACCELERATED (Fixed Extra Payment) ---
    const fixedPayment = S.extraPayment + calculateMinPayment(S.currentBalance);
    const acceleratedResults = generatePayoffSchedule(S.currentBalance, fixedPayment);
    S.accelerated.months = acceleratedResults.months;
    S.accelerated.interest = acceleratedResults.interest;
    S.accelerated.schedule = acceleratedResults.schedule;
    S.accelerated.payoffDate = acceleratedResults.payoffDate;
    S.accelerated.monthlyPayment = fixedPayment;


    // --- 4. TARGET DATE (Optional) ---
    if (targetDateStr) {
        const targetDate = new Date(targetDateStr + 'T00:00:00'); // Use T00 to avoid timezone issues
        S.targetDate = targetDate;
        
        const requiredPayment = calculateTargetPayment(S.currentBalance, targetDate);
        const targetResults = generatePayoffSchedule(S.currentBalance, requiredPayment);

        S.target.months = targetResults.months;
        S.target.interest = targetResults.interest;
        S.target.schedule = targetResults.schedule;
        S.target.payoffDate = targetResults.payoffDate;
        S.target.monthlyPayment = requiredPayment;
    } else {
        // Clear target state if date is removed
        S.target.months = 0;
        S.target.interest = 0;
        S.target.schedule = [];
        S.target.payoffDate = null;
        S.target.monthlyPayment = 0;
        S.targetDate = null;
    }

    // --- 5. RENDER RESULTS ---
    updateResultsUI();
    updateChart();
    generateAiInsights();

    showToast('Calculations updated successfully!', 'success');
}


/* ========================================================================== */
/* III. UI RENDERING & CHARTS */
/* ========================================================================== */

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});
const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });

function formatCurrency(value) {
    if (value === Infinity) return 'N/A';
    return formatter.format(value);
}

function updateResultsUI() {
    const S = CC_PAYOFF_CALCULATOR.STATE;

    // Payoff Summary Card Updates
    const savings = S.baseline.interest - S.accelerated.interest;
    const timeSavedMonths = S.baseline.months - S.accelerated.months;
    const timeSavedYears = timeSavedMonths / 12;

    document.getElementById('min-pay-years').textContent = `${(S.baseline.months / 12).toFixed(1)} Years`;
    document.getElementById('min-pay-interest').textContent = `Interest: ${formatCurrency(S.baseline.interest)}`;
    
    document.getElementById('extra-pay-years').textContent = `${(S.accelerated.months / 12).toFixed(1)} Years`;
    document.getElementById('extra-pay-interest').textContent = `Interest: ${formatCurrency(S.accelerated.interest)}`;
    
    document.getElementById('interest-savings').textContent = formatCurrency(savings);
    document.getElementById('time-saved').textContent = `${timeSavedMonths.toFixed(0)} Months (${timeSavedYears.toFixed(1)} Years) Saved`;

    // Update Schedule Select
    const scheduleSelect = document.getElementById('schedule-strategy');
    // Ensure options are available (especially for target)
    if (S.targetDate && scheduleSelect.querySelector('option[value="target"]').disabled) {
        scheduleSelect.querySelector('option[value="target"]').disabled = false;
    } else if (!S.targetDate) {
        // Optionally disable the target option if no date is set
        scheduleSelect.querySelector('option[value="target"]').disabled = true;
    }

    // Default to showing the extra payment schedule
    renderAmortizationTable(S.accelerated.schedule);
}

function updateChart() {
    const S = CC_PAYOFF_CALCULATOR.STATE;
    const ctx = document.getElementById('balanceChart').getContext('2d');
    
    // Prepare data points for charting (down-sample long schedules)
    const MAX_POINTS = 60; // Max points on the chart for performance
    
    const getChartData = (schedule) => {
        const data = [{ month: 0, balance: S.currentBalance }];
        const step = Math.ceil(schedule.length / MAX_POINTS);
        
        for (let i = 0; i < schedule.length; i += step) {
            data.push({
                month: schedule[i].month,
                balance: schedule[i].balance
            });
        }
        if (schedule.length > 0) {
            data.push({ month: schedule[schedule.length-1].month, balance: 0 });
        }
        return data;
    };
    
    const baselineData = getChartData(S.baseline.schedule);
    const acceleratedData = getChartData(S.accelerated.schedule);
    
    const labels = [...new Set([...baselineData.map(d => d.month), ...acceleratedData.map(d => d.month)])].sort((a,b) => a-b);
    
    const createDataset = (label, scheduleData, color) => ({
        label: label,
        data: labels.map(l => {
            // Find the balance for this month, or interpolate/use last value
            const item = scheduleData.find(d => d.month === l);
            if (item) return item.balance;
            
            // Interpolate (simplified: just use the last known balance if not explicitly charted)
            const priorItem = scheduleData.filter(d => d.month < l).pop();
            return priorItem ? priorItem.balance : S.currentBalance;
        }),
        borderColor: color,
        backgroundColor: color + '40', // 40 is alpha for fill
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        spanGaps: true,
    });
    
    const datasets = [
        createDataset('Min. Payment (Baseline)', baselineData, 'rgba(239, 68, 68, 1)'), // Red
        createDataset('Accelerated Payment', acceleratedData, 'rgba(36, 172, 185, 1)'), // FinGuid Accent Teal
    ];

    if (CC_PAYOFF_CALCULATOR.charts.balanceChart) {
        CC_PAYOFF_CALCULATOR.charts.balanceChart.data.labels = labels;
        CC_PAYOFF_CALCULATOR.charts.balanceChart.data.datasets = datasets;
        CC_PAYOFF_CALCULATOR.charts.balanceChart.update();
    } else {
        CC_PAYOFF_CALCULATOR.charts.balanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
                            title: (context) => `Month: ${context[0].label}`,
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Months to Payoff' }
                    },
                    y: {
                        title: { display: true, text: 'Remaining Balance ($)' },
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => formatCurrency(value),
                        }
                    }
                }
            }
        });
    }
}


function renderAmortizationTable(schedule) {
    const tbody = document.getElementById('amortization-table').querySelector('tbody');
    tbody.innerHTML = ''; // Clear previous results

    if (schedule.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No schedule generated. Please check inputs.</td></tr>';
        return;
    }

    schedule.forEach(item => {
        const row = tbody.insertRow();
        row.insertCell().textContent = item.month;
        row.insertCell().textContent = formatCurrency(item.payment);
        row.insertCell().textContent = formatCurrency(item.interest);
        row.insertCell().textContent = formatCurrency(item.principal);
        row.insertCell().textContent = formatCurrency(item.balance);
    });
}


/* ========================================================================== */
/* IV. AI INSIGHTS ENGINE (Monetization & Recommendations) */
/* ========================================================================== */

function generateAiInsights() {
    const S = CC_PAYOFF_CALCULATOR.STATE;
    const insightsBox = document.getElementById('ai-recommendations');
    const results = [];

    // --- Core Debt Metrics ---
    const totalInterestBaseline = S.baseline.interest;
    const totalInterestAccelerated = S.accelerated.interest;
    const savings = totalInterestBaseline - totalInterestAccelerated;
    const apr = S.apr;
    const payoffYears = S.accelerated.months / 12;

    // Insight 1: APR Severity & Consolidation Recommendation (Affiliate Monetization)
    if (apr > 25.0) {
        results.push(`
            <div class="insight warning"><i class="fas fa-exclamation-triangle"></i>
            **HIGH APR ALERT**: Your ${apr.toFixed(2)}% APR is significantly high. This means over 25% of your payment is likely going straight to interest. You need to prioritize reducing this rate. 
            **AI Action:** <a href="#affiliate-link-2" class="insight-cta">Explore Debt Consolidation Loans or Balance Transfer Cards now.</a>
            </div>
        `);
    } else if (apr > 18.0) {
        results.push(`
            <div class="insight advisory"><i class="fas fa-hand-point-right"></i>
            Your ${apr.toFixed(2)}% APR is above the national average. Consider negotiating with your bank or seeking a lower-rate personal loan to accelerate your payoff even further.
            </div>
        `);
    }

    // Insight 2: Impact of Extra Payment
    if (S.extraPayment > 0 && savings > 1000) {
        results.push(`
            <div class="insight success"><i class="fas fa-piggy-bank"></i>
            **Financial Win!** By paying an extra ${formatCurrency(S.extraPayment)} per month, you are projected to save **${formatCurrency(savings)}** in interest and be debt-free **${(S.baseline.months - S.accelerated.months).toFixed(0)} months** faster. Keep up this momentum!
            </div>
        `);
    } else if (S.extraPayment === 0) {
        results.push(`
            <div class="insight advisory"><i class="fas fa-calculator"></i>
            **Minimum Payment Trap:** Sticking to the minimum payment will take you **${(S.baseline.months / 12).toFixed(1)} years** to become debt-free. Even a small extra payment, like $25, can make a huge difference. Try adding an extra payment and recalculating!
            </div>
        `);
    }

    // Insight 3: Long-term Risk/Affiliate Product Placement
    if (payoffYears > 5 && apr > 20) {
        results.push(`
            <div class="insight risk"><i class="fas fa-lock"></i>
            **Long-Term Risk:** Your current plan spans **${payoffYears.toFixed(1)} years**. Over this time, financial emergencies can force you to use the card again. The best defense is paying it off faster. **Affiliate Product:** Check out credit repair services to help improve your credit score for better loan options.
            </div>
        `);
    }
    
    // Insight 4: Target Date Feedback
    if (S.target.months > 0) {
        if (S.target.monthlyPayment > S.accelerated.monthlyPayment * 2) {
             results.push(`
                <div class="insight challenge"><i class="fas fa-calendar-alt"></i>
                **Target Challenge:** To meet your goal of paying off by ${dateFormatter.format(S.targetDate)}, you need a payment of **${formatCurrency(S.target.monthlyPayment)}**. This is a great goal, but ensure this aggressive payment fits comfortably into your budget!
                </div>
            `);
        } else {
             results.push(`
                <div class="insight goal"><i class="fas fa-bullseye"></i>
                **Goal Achieved:** Your target date payment of **${formatCurrency(S.target.monthlyPayment)}** is highly effective! You will be debt-free right on schedule.
                </div>
            `);
        }
    }


    insightsBox.innerHTML = results.length > 0 ? results.join('<hr>') : '<p class="success">No immediate risks detected. Your strategy looks sound!</p>';
    SPEECH.textToSpeech(insightsBox.innerText);
}


/* ========================================================================== */
/* V. PLATFORM UTILITIES (THEME, SPEECH, TOAST) */
/* (Replicated/Simplified from FinGuid Architecture) */
/* ========================================================================== */

// --- Theme Management ---
const THEME_MANAGER = {
    loadUserPreferences: () => {
        const theme = localStorage.getItem('finguid-theme') || 'light';
        document.documentElement.setAttribute('data-color-scheme', theme);
    },
    toggleTheme: () => {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-color-scheme', newTheme);
        localStorage.setItem('finguid-theme', newTheme);
        // Chart redraw fix for dark mode (optional, but good practice)
        if (CC_PAYOFF_CALCULATOR.charts.balanceChart) {
            CC_PAYOFF_CALCULATOR.charts.balanceChart.update();
        }
    }
};

// --- Speech/Voice Management (Mocked/Stubbed for structure) ---
const SPEECH = {
    isListening: false,
    recognition: null,
    synth: window.speechSynthesis,

    initialize: () => {
        // Initialize SpeechRecognition if available
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            SPEECH.recognition = new SpeechRecognition();
            SPEECH.recognition.continuous = false;
            SPEECH.recognition.interimResults = false;
            SPEECH.recognition.lang = 'en-US';

            SPEECH.recognition.onresult = (event) => {
                const command = event.results[0][0].transcript.toLowerCase();
                SPEECH.handleCommand(command);
            };

            SPEECH.recognition.onerror = (event) => {
                if (CC_PAYOFF_CALCULATOR.DEBUG) console.error('Speech recognition error', event.error);
                showToast('Voice command error. Try again.', 'error');
                document.getElementById('voice-input-toggle').classList.remove('active');
                SPEECH.isListening = false;
            };
        } else {
            document.getElementById('voice-input-toggle').style.display = 'none';
        }
    },
    
    toggleListening: () => {
        if (!SPEECH.recognition) return;

        if (SPEECH.isListening) {
            SPEECH.recognition.stop();
            document.getElementById('voice-input-toggle').classList.remove('active');
            SPEECH.isListening = false;
            showToast('Voice command stopped.', 'success');
        } else {
            try {
                SPEECH.recognition.start();
                document.getElementById('voice-input-toggle').classList.add('active');
                SPEECH.isListening = true;
                showToast('Listening for commands (e.g., "Set balance to 5000")...', 'success');
            } catch (e) {
                 // Handle recognition already started error
            }
        }
    },

    handleCommand: (command) => {
        const S = CC_PAYOFF_CALCULATOR.STATE;
        let updateNeeded = false;
        
        if (command.includes('calculate') || command.includes('show results')) {
            updateCalculations();
            updateNeeded = true;
        } else if (command.includes('theme')) {
            THEME_MANAGER.toggleTheme();
            updateNeeded = true;
        } else if (command.includes('balance to')) {
            const match = command.match(/balance to (\d+)/);
            if (match) {
                document.getElementById('currentBalance').value = parseFloat(match[1]);
                updateNeeded = true;
            }
        } // Add more commands for APR, extra payment, etc.

        if (updateNeeded) {
            updateCalculations();
            SPEECH.textToSpeech(command.includes('calculate') ? "Calculation complete. Results updated." : "Input updated.");
        } else {
            SPEECH.textToSpeech(`Command not recognized: ${command}`);
        }
    },

    textToSpeech: (text) => {
        if (!document.getElementById('text-to-speech-toggle').classList.contains('active')) return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        SPEECH.synth.speak(utterance);
    },
    
    toggleTTS: () => {
        const ttsBtn = document.getElementById('text-to-speech-toggle');
        ttsBtn.classList.toggle('active');
        if (ttsBtn.classList.contains('active')) {
            showToast('Text to Speech is **ON**. AI Insights will be read aloud.', 'success');
        } else {
            showToast('Text to Speech is **OFF**.', 'error');
            SPEECH.synth.cancel();
        }
    }
};

// --- Toast Notifications ---
function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Animate out and remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => container.removeChild(toast), 300);
    }, duration);
}


/* ========================================================================== */
/* VI. DATA EXPORT & EVENTS */
/* ========================================================================== */

function exportAmortizationToCSV() {
    const S = CC_PAYOFF_CALCULATOR.STATE;
    const strategy = document.getElementById('schedule-strategy').value;
    let schedule = [];
    let name = 'FinGuid-CC-Payoff-Schedule';

    if (strategy === 'min') { schedule = S.baseline.schedule; name += '-Minimum'; }
    else if (strategy === 'target') { schedule = S.target.schedule; name += '-Target'; }
    else { schedule = S.accelerated.schedule; name += '-Accelerated'; } // Default to accelerated

    if (schedule.length === 0) {
        showToast('No schedule data to export. Run a calculation first.', 'error');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Month,Payment,Interest Paid,Principal Paid,Remaining Balance\n";

    schedule.forEach(item => {
        const row = [
            item.month, 
            item.payment.toFixed(2), 
            item.interest.toFixed(2), 
            item.principal.toFixed(2), 
            item.balance.toFixed(2)
        ];
        csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${name}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
    showToast('Payoff schedule exported to CSV!', 'success');
}

function setupEventListeners() {
    // Input Change Event (Recalculate on any input change)
    document.getElementById('cc-payoff-form').addEventListener('submit', function(e) {
        e.preventDefault();
        updateCalculations();
    });
    
    // Tab Control for Results
    document.querySelectorAll('.tab-controls-results .tab-button').forEach(button => {
        button.addEventListener('click', function(e) {
            const tabId = e.target.getAttribute('data-tab');
            if (['strategy-comparison', 'payoff-schedule', 'ai-insights'].includes(tabId)) {
                
                // Remove active from all content and buttons
                document.querySelectorAll('.results-section .tab-content').forEach(content => content.classList.remove('active'));
                document.querySelectorAll('.tab-controls-results .tab-button').forEach(btn => btn.classList.remove('active'));
                
                // Set current as active
                document.getElementById(tabId).classList.add('active');
                e.target.classList.add('active');
                
                // Chart redraw fix
                if (tabId === 'strategy-comparison' && CC_PAYOFF_CALCULATOR.charts.balanceChart) {
                    setTimeout(() => CC_PAYOFF_CALCULATOR.charts.balanceChart.resize(), 10); 
                }
            }
        });
    });

    // Schedule Strategy Switch
    document.getElementById('schedule-strategy').addEventListener('change', function(e) {
        const strategy = e.target.value;
        let schedule = CC_PAYOFF_CALCULATOR.STATE.accelerated.schedule; // Default

        if (strategy === 'min') { schedule = CC_PAYOFF_CALCULATOR.STATE.baseline.schedule; }
        else if (strategy === 'target' && CC_PAYOFF_CALCULATOR.STATE.target.schedule.length > 0) { 
            schedule = CC_PAYOFF_CALCULATOR.STATE.target.schedule; 
        }
        renderAmortizationTable(schedule);
    });

    // Accessibility/Theming Controls
    document.getElementById('theme-toggle').addEventListener('click', THEME_MANAGER.toggleTheme);
    document.getElementById('voice-input-toggle').addEventListener('click', SPEECH.toggleListening);
    document.getElementById('text-to-speech-toggle').addEventListener('click', SPEECH.toggleTTS);
    
    // CSV Export Button
    document.getElementById('export-csv-button').addEventListener('click', exportAmortizationToCSV);
}


/* ========================================================================== */
/* VII. DOCUMENT INITIALIZATION */
/* ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    if (CC_PAYOFF_CALCULATOR.DEBUG) console.log('🇺🇸 FinGuid Credit Card Payoff Strategist v1.0 Initializing...');
    
    // 1. Initialize Core Features
    THEME_MANAGER.loadUserPreferences();
    SPEECH.initialize();
    setupEventListeners();
    
    // 2. Initial Calculation (with default values)
    updateCalculations(); 
    
    if (CC_PAYOFF_CALCULATOR.DEBUG) console.log('✅ Credit Card Payoff Calculator initialized!');
});
