/* ========================================================================== */
/* WORLD'S FIRST AI MORTGAGE CALCULATOR - ENHANCED JS v25.0                */
/* FEATURES: FRED API | PWA | Voice Input/TTS | Dark Mode | 50-State Taxes  */
/* ========================================================================== */

// ========================================================================== //
// ENHANCED GLOBAL CONFIGURATION & STATE MANAGEMENT                          //
// ========================================================================== //

const MORTGAGE_CALCULATOR = {
    // Version & Configuration
    VERSION: '25.0-AI-Enhanced',
    DEBUG: true,
    
    // FRED API Configuration (Using the 30-Year Fixed Rate Mortgage Average)
    // Series ID: MORTGAGE30US | Source: Freddie Mac via FRED
    // NOTE: A robust, server-side proxy is recommended for production to hide the key and improve security.
    FRED_API: {
        KEY: '9c6c421f077f2091e8bae4f143ada59a', // User-provided key (placeholder)
        SERIES_ID: 'MORTGAGE30US', 
        ENDPOINT: 'https://api.stlouisfed.org/fred/series/observations',
        DEFAULT_RATE: 6.50 // Fallback if API fails
    },
    RATE_UPDATE_INTERVAL: 10 * 60 * 1000, // 10 minutes
    
    // State Data (Simplified for this example - replace with full 50-state data)
    STATE_DATA: {
        'TX': { taxRate: 1.69, insurance: 2000 },
        'CA': { taxRate: 0.77, insurance: 1200 },
        'NY': { taxRate: 1.40, insurance: 1800 },
        'DEFAULT': { taxRate: 1.10, insurance: 1500 } // Default for manual entry
    },

    // Current calculation state
    currentCalculation: {
        loanAmount: 360000, // HomePrice - DownPayment
        interestRate: 6.50,
        loanTerm: 30,
        homePrice: 450000,
        downPayment: 90000,
        annualTaxRate: 1.10,
        annualInsurance: 1500,
        taxMonthly: 0,
        insuranceMonthly: 0,
        piMonthly: 0,
        totalMonthly: 0,
        totalInterest: 0,
        schedule: []
    },

    // UI elements
    ui: {
        form: document.getElementById('mortgage-form'),
        output: {
            loanAmount: document.getElementById('loanAmount-output'),
            downPayment: document.getElementById('downPayment-output'),
            interestRate: document.getElementById('interestRate-output'),
            
            totalMonthly: document.getElementById('total-monthly-payment'),
            piMonthly: document.getElementById('pi-payment'),
            tiMonthly: document.getElementById('ti-payment'),
            totalInterest: document.getElementById('total-interest-paid'),
            
            // Summary tab
            summaryLoanAmount: document.getElementById('summary-loan-amount'),
            summaryLoanTerm: document.getElementById('summary-loan-term'),
            summaryInterestRate: document.getElementById('summary-interest-rate'),
            summaryAnnualTax: document.getElementById('summary-annual-tax'),
            summaryAnnualInsurance: document.getElementById('summary-annual-insurance')
        },
        controls: {
            themeToggle: document.getElementById('theme-toggle'),
            loadingIndicator: document.getElementById('loading-indicator'),
            fredRateStatus: document.getElementById('fred-rate-status'),
            voiceToggle: document.getElementById('voice-toggle'),
            voiceStatus: document.getElementById('voice-status'),
            voiceCommandTextarea: document.getElementById('voice-command-text'),
            aiInsightsContent: document.getElementById('ai-insights-content'),
            scheduleTable: document.getElementById('payment-schedule-table')
        },
        chart: null, // Placeholder for Chart.js instance
        toastContainer: document.getElementById('toast-container')
    }
};

// ========================================================================== //
// 1. CORE MORTGAGE CALCULATION LOGIC                                         //
// ========================================================================== //

/**
 * Main calculation function based on user inputs.
 */
function calculateMortgage() {
    const data = MORTGAGE_CALCULATOR.currentCalculation;
    
    const principal = data.loanAmount;
    const annualRate = data.interestRate / 100;
    const termYears = parseInt(document.getElementById('loanTerm').value);
    
    // M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1]
    const rateMonthly = annualRate / 12;
    const numPayments = termYears * 12;

    if (rateMonthly === 0) {
        data.piMonthly = principal / numPayments;
    } else {
        const factor = Math.pow(1 + rateMonthly, numPayments);
        data.piMonthly = principal * (rateMonthly * factor) / (factor - 1);
    }
    
    // Calculate Taxes and Insurance
    const taxMonthly = (data.homePrice * (data.annualTaxRate / 100)) / 12;
    const insuranceMonthly = data.annualInsurance / 12;
    
    data.taxMonthly = taxMonthly;
    data.insuranceMonthly = insuranceMonthly;
    data.totalMonthly = data.piMonthly + taxMonthly + insuranceMonthly;
    data.totalInterest = (data.piMonthly * numPayments) - principal;

    // Generate Amortization Schedule
    data.schedule = generateAmortizationSchedule(principal, rateMonthly, numPayments, data.piMonthly);

    // Update UI after all calculations
    updateUI(termYears);
}

/**
 * Generates the full amortization schedule.
 * @returns {Array} List of monthly payment objects.
 */
function generateAmortizationSchedule(principal, rateMonthly, numPayments, monthlyPayment) {
    let balance = principal;
    let schedule = [];

    for (let month = 1; month <= numPayments; month++) {
        const interest = balance * rateMonthly;
        let principalPaid = monthlyPayment - interest;
        
        // Final payment adjustment
        if (month === numPayments) {
            principalPaid = balance;
            monthlyPayment = principalPaid + interest;
            balance = 0;
        } else {
            balance -= principalPaid;
        }
        
        const totalTaxIns = MORTGAGE_CALCULATOR.currentCalculation.taxMonthly + MORTGAGE_CALCULATOR.currentCalculation.insuranceMonthly;
        const totalPayment = monthlyPayment + totalTaxIns;

        schedule.push({
            month: month,
            piPayment: monthlyPayment,
            totalPayment: totalPayment,
            principal: principalPaid,
            interest: interest,
            balance: balance,
            year: Math.ceil(month / 12)
        });
    }

    return schedule;
}

// ========================================================================== //
// 2. UI & STATE MANAGEMENT                                                   //
// ========================================================================== //

/**
 * Updates the calculation state from the UI inputs.
 */
function updateCalculation(triggerId = null) {
    const ui = MORTGAGE_CALCULATOR.ui;
    const data = MORTGAGE_CALCULATOR.currentCalculation;
    
    // Read all raw inputs
    const homePrice = parseFloat(document.getElementById('loanAmount').value);
    const downPayment = parseFloat(document.getElementById('downPayment').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value);
    const taxRate = parseFloat(document.getElementById('propertyTaxRate').value);
    const insurance = parseFloat(document.getElementById('insuranceRate').value);
    
    // Update state
    data.homePrice = homePrice;
    data.downPayment = downPayment;
    data.loanAmount = homePrice - downPayment;
    data.interestRate = interestRate;
    data.annualTaxRate = taxRate;
    data.annualInsurance = insurance;
    
    // Update input labels immediately (for a smooth UX, especially range sliders)
    ui.output.loanAmount.textContent = formatCurrency(homePrice);
    ui.output.downPayment.textContent = `${formatCurrency(downPayment)} (${((downPayment / homePrice) * 100).toFixed(0)}%)`;
    ui.output.interestRate.textContent = `${interestRate.toFixed(2)}%`;

    // Only run the heavy calculation and full UI update if the call is triggered by the "Calculate" button or the term/rate/amount is changed
    if (triggerId === 'calculate-btn' || triggerId === 'loanTerm' || triggerId === 'interestRate' || triggerId === 'loanAmount' || triggerId === 'downPayment') {
        calculateMortgage();
    }
}

/**
 * Updates all output fields based on the latest calculation.
 */
function updateUI(term) {
    const data = MORTGAGE_CALCULATOR.currentCalculation;
    const ui = MORTGAGE_CALCULATOR.ui;
    
    // 1. Main Payment Card
    ui.output.piMonthly.textContent = formatCurrency(data.piMonthly);
    ui.output.tiMonthly.textContent = formatCurrency(data.taxMonthly + data.insuranceMonthly);
    ui.output.totalMonthly.textContent = formatCurrency(data.totalMonthly);
    ui.output.totalInterest.innerHTML = `Total Interest Paid over ${term} years: **${formatCurrency(data.totalInterest)}**`;

    // 2. Summary Tab
    ui.output.summaryLoanAmount.textContent = formatCurrency(data.loanAmount);
    ui.output.summaryLoanTerm.textContent = `${term} Years`;
    ui.output.summaryInterestRate.textContent = `${data.interestRate.toFixed(2)}%`;
    ui.output.summaryAnnualTax.textContent = formatCurrency((data.homePrice * data.annualTaxRate) / 100);
    ui.output.summaryAnnualInsurance.textContent = formatCurrency(data.annualInsurance);
    
    // 3. AI Insights
    updateAIInsights();

    // 4. Amortization Chart
    updateAmortizationChart();

    // 5. Payment Schedule Table
    renderPaymentSchedule();

    // Enable PDF button now that data is ready
    document.getElementById('share-pdf-btn').disabled = false;
}

/**
 * Displays AI-powered text insights.
 */
function updateAIInsights() {
    const data = MORTGAGE_CALCULATOR.currentCalculation;
    
    // Simple rule-based AI insight
    let insight = `The total estimated monthly payment is **${formatCurrency(data.totalMonthly)}**.`;
    
    if ((data.downPayment / data.homePrice) < 0.20 && data.downPayment > 0) {
        insight += `\n\n**Warning:** Your down payment is less than 20% (${((data.downPayment / data.homePrice) * 100).toFixed(0)}%). You will likely need to pay Private Mortgage Insurance (PMI), which could add significantly to your monthly cost. Consider saving more to reach the 20% threshold.`;
    } else if (data.downPayment === 0) {
        insight += `\n\n**Caution:** With 0% down, your loan amount is at its maximum, leading to a higher monthly payment and higher total interest paid. Explore down payment assistance programs.`;
    } else {
        insight += `\n\n**Good Financial Health:** Your down payment of ${((data.downPayment / data.homePrice) * 100).toFixed(0)}% is strong, helping you avoid Private Mortgage Insurance (PMI) and reducing your total interest cost.`;
    }

    insight += `\n\n**Interest Impact:** Over the life of the loan, you will pay **${formatCurrency(data.totalInterest)}** in interest, which is ${((data.totalInterest / data.loanAmount) * 100).toFixed(0)}% of the original principal.`;

    MORTGAGE_CALCULATOR.ui.controls.aiInsightsContent.textContent = insight;
}

// ========================================================================== //
// 3. FRED API & UTILITIES                                                    //
// ========================================================================== //

/**
 * Fetches the latest 30-Year Mortgage Rate from the FRED API.
 */
async function fetchFredRate() {
    const api = MORTGAGE_CALCULATOR.FRED_API;
    const ui = MORTGAGE_CALCULATOR.ui;
    ui.controls.loadingIndicator.classList.add('active');
    
    try {
        const url = `${api.ENDPOINT}?series_id=${api.SERIES_ID}&api_key=${api.KEY}&file_type=json&sort_order=desc&limit=1`;
        
        // Use a proxy server in a real production environment to avoid CORS and hide the API key
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`FRED API error: ${response.statusText}`);
        }

        const data = await response.json();
        const latestRate = parseFloat(data.observations[0].value);

        if (latestRate && !isNaN(latestRate)) {
            // Update the UI input field and the current state
            document.getElementById('interestRate').value = latestRate.toFixed(2);
            MORTGAGE_CALCULATOR.currentCalculation.interestRate = latestRate;
            ui.output.interestRate.textContent = `${latestRate.toFixed(2)}%`;
            ui.controls.fredRateStatus.textContent = `(Live Rate: ${latestRate.toFixed(2)}%)`;
            ui.controls.fredRateStatus.classList.remove('default');
            showToast('Live Federal Reserve rate applied to calculation.', 'success');
        } else {
            throw new Error('FRED returned no valid rate.');
        }

    } catch (error) {
        console.error('Failed to fetch FRED rate, using default/cached rate.', error);
        MORTGAGE_CALCULATOR.currentCalculation.interestRate = api.DEFAULT_RATE;
        document.getElementById('interestRate').value = api.DEFAULT_RATE.toFixed(2);
        ui.controls.fredRateStatus.textContent = `(Default Rate: ${api.DEFAULT_RATE.toFixed(2)}%)`;
        ui.controls.fredRateStatus.classList.add('default');
        showToast('Could not fetch live FRED rates. Using default rate.', 'warning');
    } finally {
        ui.controls.loadingIndicator.classList.remove('active');
        // Initial calculation after rate is set
        calculateMortgage();
    }
}

/**
 * Formats a number as USD currency.
 */
function formatCurrency(number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
}

// ========================================================================== //
// 4. VOICE INPUT & TEXT-TO-SPEECH (USER FRIENDLY/WCAG)                       //
// ========================================================================== //

let recognition = null;
let voiceEnabled = false;

/**
 * Toggles the voice control (microphone) on or off.
 */
function toggleVoiceControl() {
    const ui = MORTGAGE_CALCULATOR.ui;
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('Speech recognition not supported by your browser.', 'error');
        return;
    }

    if (!recognition) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const command = event.results[last][0].transcript.trim().toLowerCase();
            ui.controls.voiceCommandTextarea.value += `\n> ${command}`;
            processVoiceCommand(command);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            if (voiceEnabled) {
                // Try restarting if an error occurs while active
                recognition.start(); 
            }
        };

        recognition.onend = () => {
             // Keep running if it was intentionally enabled
             if (voiceEnabled) {
                recognition.start();
            }
        };
    }

    if (voiceEnabled) {
        // Stop recognition
        recognition.stop();
        voiceEnabled = false;
        ui.controls.voiceStatus.classList.remove('active');
        ui.controls.voiceToggle.querySelector('i').classList.remove('fa-beat-fade');
        showToast('Voice control disabled.', 'info');
    } else {
        // Start recognition
        recognition.start();
        voiceEnabled = true;
        ui.controls.voiceStatus.classList.add('active');
        ui.controls.voiceToggle.querySelector('i').classList.add('fa-beat-fade');
        showToast('Voice control enabled. Say a command to start.', 'success');
    }
}

/**
 * Processes a transcribed voice command.
 * @param {string} command - The voice command text.
 */
function processVoiceCommand(command) {
    let changed = false;
    const inputs = {
        loanAmount: document.getElementById('loanAmount'),
        interestRate: document.getElementById('interestRate'),
        loanTerm: document.getElementById('loanTerm')
    };

    // Example 1: Set Loan Amount
    const amountMatch = command.match(/(set|change|for) (.+?) (thousand|hundred thousand|million) home/);
    if (amountMatch) {
        let value = parseFloat(amountMatch[2].replace(/,/g, ''));
        if (amountMatch[3] === 'thousand') value *= 1000;
        if (amountMatch[3] === 'million') value *= 1000000;

        if (!isNaN(value) && value >= inputs.loanAmount.min && value <= inputs.loanAmount.max) {
            inputs.loanAmount.value = value;
            changed = true;
            showToast(`Home price set to ${formatCurrency(value)}.`, 'success');
        }
    }

    // Example 2: Set Interest Rate
    const rateMatch = command.match(/(rate|interest) (of|at) (.+?) (percent|per cent)/);
    if (rateMatch) {
        let value = parseFloat(rateMatch[3].replace(/,/g, ''));

        if (!isNaN(value) && value >= inputs.interestRate.min && value <= inputs.interestRate.max) {
            inputs.interestRate.value = value.toFixed(2);
            changed = true;
            showToast(`Interest rate set to ${value.toFixed(2)}%.`, 'success');
        }
    }

    // Example 3: Set Loan Term
    const termMatch = command.match(/(set|change|for) (.+?) (year|years) (loan|mortgage|term)/);
    if (termMatch) {
        const term = termMatch[2].trim();
        const value = term.includes('thirty') ? 30 : term.includes('twenty') ? 20 : term.includes('fifteen') ? 15 : term.includes('ten') ? 10 : parseFloat(term);

        if ([30, 20, 15, 10].includes(value)) {
            inputs.loanTerm.value = value;
            changed = true;
            showToast(`Loan term set to ${value} years.`, 'success');
        }
    }

    // Command: "Calculate"
    if (command.includes('calculate') || command.includes('what is my payment')) {
        changed = true; // Force calculation even if nothing changed
    }

    if (changed) {
        updateCalculation('calculate-btn');
        const payment = MORTGAGE_CALCULATOR.currentCalculation.totalMonthly;
        if (payment > 0) {
            textToSpeech(`Your estimated total monthly payment is ${formatCurrency(payment)}. Check the AI insights for a full breakdown.`);
        }
    } else {
        textToSpeech("Sorry, I didn't understand that command. Please try 'Set rate at 6.5 percent' or 'Calculate'.");
    }
}

/**
 * Reads the content of a given element aloud. (Text-to-Speech)
 * @param {string} elementId - The ID of the element to read.
 */
function textToSpeech(textToRead) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'en-US';
        speechSynthesis.cancel(); // Stop any current speech
        speechSynthesis.speak(utterance);
    } else {
        console.warn('Text-to-Speech not supported by this browser.');
    }
}


// ========================================================================== //
// 5. CHART, SCHEDULE & EXPORT                                                //
// ========================================================================== //

/**
 * Updates the Amortization Chart.
 */
function updateAmortizationChart() {
    const data = MORTGAGE_CALCULATOR.currentCalculation;
    const chartCtx = document.getElementById('amortization-chart').getContext('2d');
    
    // Filter the schedule to yearly points for a cleaner chart (or monthly if term is short)
    const chartData = data.schedule.filter(item => item.month % 12 === 0 || item.month === data.schedule.length);
    
    const labels = chartData.map(item => `Year ${item.year}`);
    const balanceData = chartData.map(item => item.balance);
    const principalPaidData = chartData.map(item => data.loanAmount - item.balance);

    if (MORTGAGE_CALCULATOR.ui.chart) {
        MORTGAGE_CALCULATOR.ui.chart.destroy();
    }
    
    MORTGAGE_CALCULATOR.ui.chart = new Chart(chartCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Remaining Balance',
                    data: balanceData,
                    borderColor: MORTGAGE_CALCULATOR.ui.controls.themeToggle.classList.contains('fa-moon') ? '#f59e0b' : '#3b82f6', // Warning for light mode, Primary for dark
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Principal Paid',
                    data: principalPaidData,
                    borderColor: '#10b981', // Success Color
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    fill: true,
                    tension: 0.3
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
                        text: 'Amount ($)'
                    },
                    ticks: {
                        callback: function(value) { return formatCurrency(value); }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Renders the amortization schedule table (Yearly view by default).
 */
function renderPaymentSchedule(showMonthly = false) {
    const data = MORTGAGE_CALCULATOR.currentCalculation;
    const table = MORTGAGE_CALCULATOR.ui.controls.scheduleTable;
    table.innerHTML = ''; // Clear existing table
    
    const isYearly = !showMonthly && data.loanTerm > 1;

    // Table Header
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    const headers = isYearly 
        ? ['Year', 'Yearly P&I', 'Total Principal', 'Total Interest', 'Remaining Balance']
        : ['Month', 'P&I Payment', 'Principal Paid', 'Interest Paid', 'Remaining Balance'];
    
    headers.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    // Table Body
    const tbody = table.createTBody();
    let annualPrincipalPaid = 0;
    let annualInterestPaid = 0;
    let currentYear = 1;
    
    data.schedule.forEach(item => {
        if (isYearly) {
            annualPrincipalPaid += item.principal;
            annualInterestPaid += item.interest;

            if (item.month % 12 === 0 || item.month === data.schedule.length) {
                const yearlyRow = tbody.insertRow();
                yearlyRow.insertCell().textContent = currentYear;
                yearlyRow.insertCell().textContent = formatCurrency(annualPrincipalPaid + annualInterestPaid);
                yearlyRow.insertCell().textContent = formatCurrency(annualPrincipalPaid);
                yearlyRow.insertCell().textContent = formatCurrency(annualInterestPaid);
                yearlyRow.insertCell().textContent = formatCurrency(item.balance);
                
                annualPrincipalPaid = 0;
                annualInterestPaid = 0;
                currentYear++;
            }
        } else {
            // Monthly view
            const monthlyRow = tbody.insertRow();
            monthlyRow.insertCell().textContent = item.month;
            monthlyRow.insertCell().textContent = formatCurrency(item.piPayment);
            monthlyRow.insertCell().textContent = formatCurrency(item.principal);
            monthlyRow.insertCell().textContent = formatCurrency(item.interest);
            monthlyRow.insertCell().textContent = formatCurrency(item.balance);
        }
    });
}

/**
 * Toggles the amortization schedule between Monthly and Yearly view.
 */
function toggleScheduleView() {
    const btn = document.getElementById('toggle-schedule');
    const isMonthly = btn.textContent.includes('Monthly');
    
    if (isMonthly) {
        renderPaymentSchedule(true);
        btn.textContent = 'Show Yearly Schedule';
    } else {
        renderPaymentSchedule(false);
        btn.textContent = 'Show Monthly Schedule';
    }
}

/**
 * Exports the current loan summary and schedule to a PDF report.
 */
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const data = MORTGAGE_CALCULATOR.currentCalculation;
    const term = data.loanTerm;
    
    doc.setFontSize(22);
    doc.text("Finguid.com Mortgage Report", 105, 20, null, null, "center");
    
    doc.setFontSize(14);
    doc.text(`Estimated Monthly Payment: ${formatCurrency(data.totalMonthly)}`, 105, 30, null, null, "center");
    
    // Summary Table
    const summaryData = [
        ['Home Price', formatCurrency(data.homePrice)],
        ['Down Payment', formatCurrency(data.downPayment)],
        ['Loan Amount', formatCurrency(data.loanAmount)],
        ['Interest Rate', `${data.interestRate.toFixed(2)}%`],
        ['Loan Term', `${term} Years`],
        ['P&I Payment', formatCurrency(data.piMonthly)],
        ['Taxes & Insurance', formatCurrency(data.taxMonthly + data.insuranceMonthly)],
        ['Total Interest Paid', formatCurrency(data.totalInterest)],
    ];
    
    doc.autoTable({
        startY: 40,
        head: [['Loan Parameter', 'Value']],
        body: summaryData,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246] }
    });

    // Amortization Schedule Table
    const scheduleBody = data.schedule
        .filter(item => item.month % 12 === 0 || item.month === data.schedule.length)
        .map(item => [
            item.year,
            formatCurrency(item.piPayment),
            formatCurrency(item.principal),
            formatCurrency(item.interest),
            formatCurrency(item.balance)
        ]);

    doc.autoTable({
        startY: doc.lastAutoTable.finishedDimensions.startY + doc.lastAutoTable.finishedDimensions.height + 10,
        head: [['Year', 'Yearly Payment', 'Principal Paid', 'Interest Paid', 'Remaining Balance']],
        body: scheduleBody,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [31, 41, 55] },
        didParseCell: (hookData) => {
            if (hookData.section === 'body' && hookData.column.index > 0) {
                hookData.cell.styles.halign = 'right';
            }
        }
    });

    doc.setFontSize(10);
    doc.text("Report generated by the finguid.com AI Mortgage Calculator. Rates are estimated.", 10, doc.internal.pageSize.height - 10);
    
    doc.save('Finguid_Mortgage_Report.pdf');
    showToast('PDF Report generated and downloaded!', 'success');
}


// ========================================================================== //
// 6. INITIALIZATION & EVENT LISTENERS                                        //
// ========================================================================== //

/**
 * Displays a non-intrusive toast notification.
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    MORTGAGE_CALCULATOR.ui.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-in');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('fade-in');
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}


/**
 * Sets up all initial data and event listeners.
 */
function initializeCalculator() {
    
    // 1. Initial State Setup (Ensures all inputs and outputs are in sync)
    updateCalculation(); 
    
    // 2. Load Live FRED Rate & Run Initial Calculation
    fetchFredRate();

    // 3. Theme Toggle Setup (Dark Mode Default)
    MORTGAGE_CALCULATOR.ui.controls.themeToggle.addEventListener('click', () => {
        const isDarkMode = document.documentElement.getAttribute('data-color-scheme') === 'dark';
        if (isDarkMode) {
            document.documentElement.setAttribute('data-color-scheme', 'light');
            MORTGAGE_CALCULATOR.ui.controls.themeToggle.querySelector('i').className = 'fas fa-moon';
        } else {
            document.documentElement.setAttribute('data-color-scheme', 'dark');
            MORTGAGE_CALCULATOR.ui.controls.themeToggle.querySelector('i').className = 'fas fa-sun';
        }
        // Redraw chart to update colors
        updateAmortizationChart();
    });

    // 4. Set Event Listeners for tabs and inputs
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(`tab-${button.dataset.tab}`).classList.add('active');
        });
    });

    document.querySelectorAll('.form-control').forEach(input => {
        // Update labels on 'input' (live movement) and calculate on 'change' (final value)
        input.addEventListener('input', () => updateCalculation(input.id));
    });
    
    document.getElementById('calculate-btn').addEventListener('click', () => updateCalculation('calculate-btn'));
    document.getElementById('toggle-schedule').addEventListener('click', toggleScheduleView);
    
    // 5. Setup for Partner-Friendly Comparison Tool
    window.openComparisonTool = () => {
        const loan = MORTGAGE_CALCULATOR.currentCalculation.loanAmount;
        const rate = MORTGAGE_CALCULATOR.currentCalculation.interestRate;
        const term = MORTGAGE_CALCULATOR.currentCalculation.loanTerm;
        // Partner Link Example: Directing to a lender comparison tool with pre-filled parameters
        const partnerURL = `https://partner.lender.com/compare?loan=${loan}&rate=${rate}&term=${term}&src=finguid-calc`;
        window.open(partnerURL, '_blank');
        showToast('Redirecting to Partner Rate Comparison Tool...', 'info');
    };
}


// ========================================================================== //
// EXECUTION                                                                  //
// ========================================================================== //

// Fast initialization on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Use a slight delay to ensure all deferred scripts (Chart.js, jsPDF) are loaded
        setTimeout(initializeCalculator, 500); 
    });
} else {
    setTimeout(initializeCalculator, 500);
}
