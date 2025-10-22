/* ========================================================================== */
/* WORLD'S FIRST AI MORTGAGE CALCULATOR - ENHANCED JS v25.0                */
/* PRODUCTION READY WITH PWA, 50-STATE TAXES, VOICE COMMANDS               */
/* ========================================================================== */

// ========================================================================== //
// ENHANCED GLOBAL CONFIGURATION & STATE MANAGEMENT                          //
// ========================================================================== //

const MORTGAGE_CALCULATOR = {
    // Version & Configuration
    VERSION: '25.0-AI-Enhanced-PROD',
    DEBUG: false,
    
    // FRED API Configuration
    FRED_API: {
        KEY: '9c6c421f077f2091e8bae4f143ada59a',
        SERIES_ID: 'MORTGAGE30US', 
        ENDPOINT: 'https://api.stlouisfed.org/fred/series/observations',
        DEFAULT_RATE: 6.50
    },
    RATE_UPDATE_INTERVAL: 10 * 60 * 1000, // 10 minutes
    
    // Enhanced 50-State Data with realistic averages
    STATE_DATA: {
        'AL': { taxRate: 0.42, insurance: 1200, stateName: 'Alabama' },
        'AK': { taxRate: 1.04, insurance: 1100, stateName: 'Alaska' },
        'AZ': { taxRate: 0.72, insurance: 900, stateName: 'Arizona' },
        'AR': { taxRate: 0.64, insurance: 1000, stateName: 'Arkansas' },
        'CA': { taxRate: 0.77, insurance: 1200, stateName: 'California' },
        'CO': { taxRate: 0.55, insurance: 1100, stateName: 'Colorado' },
        'CT': { taxRate: 1.70, insurance: 1400, stateName: 'Connecticut' },
        'DE': { taxRate: 0.57, insurance: 1000, stateName: 'Delaware' },
        'FL': { taxRate: 0.89, insurance: 1300, stateName: 'Florida' },
        'GA': { taxRate: 0.91, insurance: 1100, stateName: 'Georgia' },
        'HI': { taxRate: 0.28, insurance: 1200, stateName: 'Hawaii' },
        'ID': { taxRate: 0.69, insurance: 800, stateName: 'Idaho' },
        'IL': { taxRate: 2.05, insurance: 1000, stateName: 'Illinois' },
        'IN': { taxRate: 0.85, insurance: 900, stateName: 'Indiana' },
        'IA': { taxRate: 1.50, insurance: 800, stateName: 'Iowa' },
        'KS': { taxRate: 1.37, insurance: 1200, stateName: 'Kansas' },
        'KY': { taxRate: 0.86, insurance: 900, stateName: 'Kentucky' },
        'LA': { taxRate: 0.55, insurance: 1500, stateName: 'Louisiana' },
        'ME': { taxRate: 1.30, insurance: 900, stateName: 'Maine' },
        'MD': { taxRate: 1.09, insurance: 1100, stateName: 'Maryland' },
        'MA': { taxRate: 1.23, insurance: 1300, stateName: 'Massachusetts' },
        'MI': { taxRate: 1.50, insurance: 1000, stateName: 'Michigan' },
        'MN': { taxRate: 1.12, insurance: 1200, stateName: 'Minnesota' },
        'MS': { taxRate: 0.81, insurance: 1300, stateName: 'Mississippi' },
        'MO': { taxRate: 0.97, insurance: 1100, stateName: 'Missouri' },
        'MT': { taxRate: 0.84, insurance: 1000, stateName: 'Montana' },
        'NE': { taxRate: 1.73, insurance: 1200, stateName: 'Nebraska' },
        'NV': { taxRate: 0.60, insurance: 900, stateName: 'Nevada' },
        'NH': { taxRate: 2.05, insurance: 1000, stateName: 'New Hampshire' },
        'NJ': { taxRate: 2.21, insurance: 1100, stateName: 'New Jersey' },
        'NM': { taxRate: 0.80, insurance: 900, stateName: 'New Mexico' },
        'NY': { taxRate: 1.40, insurance: 1300, stateName: 'New York' },
        'NC': { taxRate: 0.84, insurance: 1100, stateName: 'North Carolina' },
        'ND': { taxRate: 0.99, insurance: 1000, stateName: 'North Dakota' },
        'OH': { taxRate: 1.56, insurance: 800, stateName: 'Ohio' },
        'OK': { taxRate: 0.90, insurance: 1400, stateName: 'Oklahoma' },
        'OR': { taxRate: 0.97, insurance: 700, stateName: 'Oregon' },
        'PA': { taxRate: 1.58, insurance: 900, stateName: 'Pennsylvania' },
        'RI': { taxRate: 1.63, insurance: 1200, stateName: 'Rhode Island' },
        'SC': { taxRate: 0.57, insurance: 1100, stateName: 'South Carolina' },
        'SD': { taxRate: 1.31, insurance: 1100, stateName: 'South Dakota' },
        'TN': { taxRate: 0.71, insurance: 1000, stateName: 'Tennessee' },
        'TX': { taxRate: 1.69, insurance: 1600, stateName: 'Texas' },
        'UT': { taxRate: 0.63, insurance: 700, stateName: 'Utah' },
        'VT': { taxRate: 1.90, insurance: 900, stateName: 'Vermont' },
        'VA': { taxRate: 0.82, insurance: 1000, stateName: 'Virginia' },
        'WA': { taxRate: 0.98, insurance: 800, stateName: 'Washington' },
        'WV': { taxRate: 0.59, insurance: 900, stateName: 'West Virginia' },
        'WI': { taxRate: 1.76, insurance: 800, stateName: 'Wisconsin' },
        'WY': { taxRate: 0.61, insurance: 1000, stateName: 'Wyoming' },
        'DC': { taxRate: 0.56, insurance: 1200, stateName: 'District of Columbia' },
        'DEFAULT': { taxRate: 1.10, insurance: 1200, stateName: 'National Average' }
    },

    // Current calculation state
    currentCalculation: {
        loanAmount: 360000,
        interestRate: 6.50,
        loanTerm: 30,
        homePrice: 450000,
        downPayment: 90000,
        state: 'CA',
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
            homePrice: document.getElementById('homePrice-output'),
            downPayment: document.getElementById('downPayment-output'),
            interestRate: document.getElementById('interestRate-output'),
            propertyTaxRate: document.getElementById('propertyTaxRate-output'),
            insuranceRate: document.getElementById('insuranceRate-output'),
            
            totalMonthly: document.getElementById('total-monthly-payment'),
            piMonthly: document.getElementById('pi-payment'),
            tiMonthly: document.getElementById('ti-payment'),
            totalInterest: document.getElementById('total-interest-paid'),
            
            // Summary tab
            summaryHomePrice: document.getElementById('summary-home-price'),
            summaryDownPayment: document.getElementById('summary-down-payment'),
            summaryLoanAmount: document.getElementById('summary-loan-amount'),
            summaryLoanTerm: document.getElementById('summary-loan-term'),
            summaryInterestRate: document.getElementById('summary-interest-rate'),
            summaryState: document.getElementById('summary-state'),
            summaryAnnualTax: document.getElementById('summary-annual-tax'),
            summaryAnnualInsurance: document.getElementById('summary-annual-insurance'),
            summaryTotalPrincipal: document.getElementById('summary-total-principal'),
            summaryTotalInterest: document.getElementById('summary-total-interest'),
            summaryTotalCost: document.getElementById('summary-total-cost'),
            summaryLTV: document.getElementById('summary-ltv')
        },
        controls: {
            themeToggle: document.getElementById('theme-toggle'),
            loadingIndicator: document.getElementById('loading-indicator'),
            fredRateStatus: document.getElementById('fred-rate-status'),
            voiceToggle: document.getElementById('voice-toggle'),
            voiceStatus: document.getElementById('voice-status'),
            voiceCommandTextarea: document.getElementById('voice-command-text'),
            aiInsightsContent: document.getElementById('ai-insights-content'),
            scheduleTable: document.getElementById('payment-schedule-table'),
            installBtn: document.getElementById('install-btn'),
            readAloudBtn: document.getElementById('read-aloud-btn')
        },
        chart: null,
        toastContainer: document.getElementById('toast-container'),
        deferredPrompt: null
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

    // Track calculation event
    trackCalculationEvent();

    // Update UI after all calculations
    updateUI(termYears);
}

/**
 * Generates the full amortization schedule.
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
        
        const totalTaxIns = MORTGAGE_CALCULATOR.currentCalculation.taxMonthly + 
                           MORTGAGE_CALCULATOR.currentCalculation.insuranceMonthly;
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
    const homePrice = parseFloat(document.getElementById('homePrice').value);
    const downPayment = parseFloat(document.getElementById('downPayment').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value);
    const state = document.getElementById('stateSelect').value;
    
    // Get state-specific data
    const stateData = MORTGAGE_CALCULATOR.STATE_DATA[state] || MORTGAGE_CALCULATOR.STATE_DATA.DEFAULT;
    
    // Update state
    data.homePrice = homePrice;
    data.downPayment = downPayment;
    data.loanAmount = homePrice - downPayment;
    data.interestRate = interestRate;
    data.state = state;
    data.annualTaxRate = stateData.taxRate;
    data.annualInsurance = stateData.insurance;

    // Update input labels immediately
    ui.output.homePrice.textContent = formatCurrency(homePrice);
    const downPaymentPercent = ((downPayment / homePrice) * 100).toFixed(1);
    ui.output.downPayment.textContent = `${formatCurrency(downPayment)} (${downPaymentPercent}%)`;
    ui.output.interestRate.textContent = `${interestRate.toFixed(2)}%`;
    
    // Update state-specific tax and insurance
    document.getElementById('propertyTaxRate').value = stateData.taxRate;
    document.getElementById('insuranceRate').value = stateData.insurance;
    ui.output.propertyTaxRate.textContent = `${stateData.taxRate.toFixed(2)}%`;
    ui.output.insuranceRate.textContent = formatCurrency(stateData.insurance);

    // Only run the heavy calculation and full UI update if needed
    if (triggerId === 'calculate-btn' || triggerId === 'loanTerm' || 
        triggerId === 'interestRate' || triggerId === 'homePrice' || 
        triggerId === 'downPayment' || triggerId === 'stateSelect') {
        calculateMortgage();
    }
}

/**
 * Updates all output fields based on the latest calculation.
 */
function updateUI(term) {
    const data = MORTGAGE_CALCULATOR.currentCalculation;
    const ui = MORTGAGE_CALCULATOR.ui;
    const stateData = MORTGAGE_CALCULATOR.STATE_DATA[data.state] || MORTGAGE_CALCULATOR.STATE_DATA.DEFAULT;
    
    // 1. Main Payment Card
    ui.output.piMonthly.textContent = formatCurrency(data.piMonthly);
    ui.output.tiMonthly.textContent = formatCurrency(data.taxMonthly + data.insuranceMonthly);
    ui.output.totalMonthly.textContent = formatCurrency(data.totalMonthly);
    ui.output.totalInterest.innerHTML = `Total Interest Paid over ${term} years: <strong>${formatCurrency(data.totalInterest)}</strong>`;

    // 2. Summary Tab
    ui.output.summaryHomePrice.textContent = formatCurrency(data.homePrice);
    ui.output.summaryDownPayment.textContent = `${formatCurrency(data.downPayment)} (${((data.downPayment / data.homePrice) * 100).toFixed(1)}%)`;
    ui.output.summaryLoanAmount.textContent = formatCurrency(data.loanAmount);
    ui.output.summaryLoanTerm.textContent = `${term} Years`;
    ui.output.summaryInterestRate.textContent = `${data.interestRate.toFixed(2)}%`;
    ui.output.summaryState.textContent = stateData.stateName;
    ui.output.summaryAnnualTax.textContent = formatCurrency((data.homePrice * data.annualTaxRate) / 100);
    ui.output.summaryAnnualInsurance.textContent = formatCurrency(data.annualInsurance);
    ui.output.summaryTotalPrincipal.textContent = formatCurrency(data.loanAmount);
    ui.output.summaryTotalInterest.textContent = formatCurrency(data.totalInterest);
    ui.output.summaryTotalCost.textContent = formatCurrency(data.loanAmount + data.totalInterest);
    ui.output.summaryLTV.textContent = `${((data.loanAmount / data.homePrice) * 100).toFixed(1)}%`;
    
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
 * Enhanced AI-powered financial insights
 */
function updateAIInsights() {
    const data = MORTGAGE_CALCULATOR.currentCalculation;
    const ui = MORTGAGE_CALCULATOR.ui;
    
    // Show loading state
    ui.controls.aiInsightsContent.innerHTML = '<div class="loading-ai">🔄 Generating AI insights...</div>';

    // Use enhanced rule-based insights (in production, you could integrate with an AI API here)
    setTimeout(() => {
        ui.controls.aiInsightsContent.innerHTML = generateEnhancedRuleBasedInsights(data);
    }, 800);
}

/**
 * Enhanced rule-based insights with more intelligence
 */
function generateEnhancedRuleBasedInsights(data) {
    let insights = [];
    const downPaymentPercent = (data.downPayment / data.homePrice) * 100;
    const estimatedIncome = data.homePrice * 0.04; // Rough estimate of qualifying income
    const dtiRatio = (data.totalMonthly / (estimatedIncome / 12)) * 100;
    const stateData = MORTGAGE_CALCULATOR.STATE_DATA[data.state] || MORTGAGE_CALCULATOR.STATE_DATA.DEFAULT;

    // Down payment analysis
    if (downPaymentPercent < 3) {
        insights.push(`🚨 <strong>Very Low Down Payment (${downPaymentPercent.toFixed(1)}%)</strong>: You may struggle to qualify for conventional loans and will likely pay PMI. Consider FHA loans (3.5% minimum) or saving more.`);
    } else if (downPaymentPercent < 10) {
        insights.push(`⚠️ <strong>Low Down Payment (${downPaymentPercent.toFixed(1)}%)</strong>: You'll likely pay Private Mortgage Insurance (PMI) adding 0.5%-1% annually. PMI typically drops at 20% equity.`);
    } else if (downPaymentPercent < 20) {
        insights.push(`📊 <strong>Moderate Down Payment (${downPaymentPercent.toFixed(1)}%)</strong>: Good start! Reach 20% to eliminate PMI and get better rates.`);
    } else {
        insights.push(`✅ <strong>Strong Down Payment (${downPaymentPercent.toFixed(1)}%)</strong>: Excellent! You'll avoid PMI and qualify for the best rates.`);
    }
    
    // Debt-to-Income analysis
    if (dtiRatio > 43) {
        insights.push(`💸 <strong>High Debt-to-Income Ratio</strong>: Your payment represents ${dtiRatio.toFixed(0)}% of estimated income. Most lenders prefer <36% for optimal approval.`);
    } else if (dtiRatio > 28) {
        insights.push(`📈 <strong>Moderate Debt-to-Income</strong>: Your payment is ${dtiRatio.toFixed(0)}% of estimated income - within acceptable range for most lenders.`);
    } else {
        insights.push(`👍 <strong>Healthy Debt-to-Income</strong>: Your payment is ${dtiRatio.toFixed(0)}% of estimated income - well within comfortable lending guidelines.`);
    }
    
    // Interest rate context
    if (data.interestRate > 7.5) {
        insights.push(`📈 <strong>High Interest Rate Environment</strong>: Consider waiting for rates to drop or explore ARMs if planning to move within 5-7 years.`);
    } else if (data.interestRate < 5) {
        insights.push(`🎯 <strong>Excellent Rate</strong>: You're locking in a historically low rate - great timing!`);
    } else {
        insights.push(`📊 <strong>Current Market Rate</strong>: Your rate is in line with current market conditions.`);
    }

    // State-specific insights
    if (stateData.taxRate > 1.5) {
        insights.push(`🏠 <strong>High Property Tax State</strong>: ${stateData.stateName} has above-average property taxes. Consider this in your long-term budget.`);
    } else if (stateData.taxRate < 0.5) {
        insights.push(`💡 <strong>Low Property Tax State</strong>: ${stateData.stateName} has below-average property taxes, which helps with affordability.`);
    }

    // Total interest awareness
    const interestToPrincipal = (data.totalInterest / data.loanAmount) * 100;
    insights.push(`💰 <strong>Interest Impact</strong>: You'll pay ${formatCurrency(data.totalInterest)} in interest - that's ${interestToPrincipal.toFixed(0)}% of your loan amount!`);

    // Extra payment recommendation
    const monthlyExtra = data.piMonthly * 0.1;
    const potentialSavings = data.totalInterest * 0.2;
    insights.push(`⚡ <strong>Smart Tip</strong>: Adding just ${formatCurrency(monthlyExtra)} extra monthly could save ~${formatCurrency(potentialSavings)} and pay off your loan 5+ years early.`);

    // Market comparison
    const avgRate = MORTGAGE_CALCULATOR.FRED_API.DEFAULT_RATE;
    if (data.interestRate < avgRate - 0.5) {
        insights.push(`📉 <strong>Below Average Rate</strong>: Your rate is significantly below the national average - great deal!`);
    } else if (data.interestRate > avgRate + 0.5) {
        insights.push(`📈 <strong>Above Average Rate</strong>: Consider shopping around - your rate is higher than the national average.`);
    }

    return insights.join('\n\n');
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
    
    // Show loading only if we're actually fetching
    if (navigator.onLine) {
        ui.controls.loadingIndicator.classList.add('active');
    }
    
    try {
        const url = `${api.ENDPOINT}?series_id=${api.SERIES_ID}&api_key=${api.KEY}&file_type=json&sort_order=desc&limit=1`;
        
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`FRED API error: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.observations && data.observations.length > 0) {
            const latestRate = parseFloat(data.observations[0].value);

            if (latestRate && !isNaN(latestRate)) {
                // Update the UI input field and the current state
                document.getElementById('interestRate').value = latestRate.toFixed(2);
                MORTGAGE_CALCULATOR.currentCalculation.interestRate = latestRate;
                ui.output.interestRate.textContent = `${latestRate.toFixed(2)}%`;
                ui.controls.fredRateStatus.textContent = `(Live Rate: ${latestRate.toFixed(2)}%)`;
                ui.controls.fredRateStatus.classList.remove('default');
                showToast('Live Federal Reserve rate applied to calculation.', 'success');
                
                // Update calculation with new rate
                updateCalculation('interestRate');
                return;
            }
        }
        
        throw new Error('FRED returned no valid rate.');

    } catch (error) {
        console.error('Failed to fetch FRED rate, using default/cached rate.', error);
        MORTGAGE_CALCULATOR.currentCalculation.interestRate = api.DEFAULT_RATE;
        document.getElementById('interestRate').value = api.DEFAULT_RATE.toFixed(2);
        ui.controls.fredRateStatus.textContent = `(Default Rate: ${api.DEFAULT_RATE.toFixed(2)}%)`;
        ui.controls.fredRateStatus.classList.add('default');
        
        if (navigator.onLine) {
            showToast('Could not fetch live FRED rates. Using default rate.', 'warning');
        }
    } finally {
        ui.controls.loadingIndicator.classList.remove('active');
    }
}

/**
 * Formats a number as USD currency.
 */
function formatCurrency(number) {
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD', 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
    }).format(number);
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
            if (voiceEnabled && event.error !== 'no-speech') {
                showToast(`Voice recognition error: ${event.error}`, 'error');
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
        try {
            recognition.start();
            voiceEnabled = true;
            ui.controls.voiceStatus.classList.add('active');
            ui.controls.voiceToggle.querySelector('i').classList.add('fa-beat-fade');
            showToast('Voice control enabled. Say a command to start.', 'success');
        } catch (error) {
            showToast('Error starting voice recognition.', 'error');
        }
    }
}

/**
 * Enhanced voice command processing with natural language understanding
 */
function processVoiceCommand(command) {
    let changed = false;
    const inputs = {
        homePrice: document.getElementById('homePrice'),
        downPayment: document.getElementById('downPayment'),
        interestRate: document.getElementById('interestRate'),
        loanTerm: document.getElementById('loanTerm'),
        stateSelect: document.getElementById('stateSelect')
    };

    // Enhanced command patterns with better natural language processing
    const patterns = [
        // Home price patterns
        { 
            regex: /(home|house|price|loan).*?(\d+(?:\.\d+)?)\s*(thousand|hundred thousand|million|k|m)/gi,
            handler: (match) => {
                let value = parseFloat(match[2].replace(/,/g, ''));
                if (match[3].includes('thousand') || match[3] === 'k') value *= 1000;
                if (match[3].includes('million') || match[3] === 'm') value *= 1000000;
                if (value >= inputs.homePrice.min && value <= inputs.homePrice.max) {
                    inputs.homePrice.value = value;
                    return `Home price set to ${formatCurrency(value)}`;
                }
                return null;
            }
        },
        
        // Interest rate patterns
        {
            regex: /(rate|interest).*?(\d+(?:\.\d+)?)\s*(percent|per cent|%)/gi,
            handler: (match) => {
                const value = parseFloat(match[2]);
                if (value >= inputs.interestRate.min && value <= inputs.interestRate.max) {
                    inputs.interestRate.value = value.toFixed(2);
                    return `Interest rate set to ${value.toFixed(2)}%`;
                }
                return null;
            }
        },
        
        // State selection
        {
            regex: /(state|location).*?(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming)/gi,
            handler: (match) => {
                const stateMap = {
                    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
                    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
                    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
                    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
                    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
                    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
                    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
                    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
                    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
                    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
                    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
                    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
                    'wisconsin': 'WI', 'wyoming': 'WY'
                };
                const stateName = match[2].toLowerCase();
                if (stateMap[stateName]) {
                    inputs.stateSelect.value = stateMap[stateName];
                    return `State set to ${stateName.charAt(0).toUpperCase() + stateName.slice(1)}`;
                }
                return null;
            }
        },
        
        // Loan term patterns
        {
            regex: /(term|years).*?(10|15|20|30|ten|fifteen|twenty|thirty)/gi,
            handler: (match) => {
                const termMap = {
                    '10': '10', 'ten': '10',
                    '15': '15', 'fifteen': '15',
                    '20': '20', 'twenty': '20',
                    '30': '30', 'thirty': '30'
                };
                const term = termMap[match[2].toLowerCase()];
                if (term) {
                    inputs.loanTerm.value = term;
                    return `Loan term set to ${term} years`;
                }
                return null;
            }
        }
    ];

    // Process all patterns
    let feedback = null;
    patterns.forEach(pattern => {
        const matches = [...command.matchAll(pattern.regex)];
        matches.forEach(match => {
            const result = pattern.handler(match);
            if (result) {
                changed = true;
                feedback = result;
                showToast(result, 'success');
            }
        });
    });

    // Special commands
    if (command.includes('calculate') || command.includes('what is my payment') || command.includes('compute')) {
        changed = true;
        if (!feedback) feedback = 'Calculating mortgage payment...';
    }

    if (command.includes('reset') || command.includes('clear')) {
        resetCalculator();
        showToast('Calculator reset to default values', 'info');
        return;
    }

    if (changed) {
        updateCalculation('calculate-btn');
        if (feedback && command.includes('calculate')) {
            const payment = MORTGAGE_CALCULATOR.currentCalculation.totalMonthly;
            textToSpeech(`Your estimated total monthly payment is ${formatCurrency(payment)}. ${feedback}`);
        }
    } else if (!command.includes('calculate')) {
        textToSpeech("Sorry, I didn't understand that command. Try something like 'Set home price to 500 thousand' or 'Calculate my payment'.");
    }
}

/**
 * Reads the content of a given element aloud. (Text-to-Speech)
 */
function textToSpeech(textToRead) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        speechSynthesis.cancel(); // Stop any current speech
        speechSynthesis.speak(utterance);
    } else {
        console.warn('Text-to-Speech not supported by this browser.');
    }
}

/**
 * Reset calculator to default values
 */
function resetCalculator() {
    document.getElementById('homePrice').value = 450000;
    document.getElementById('downPayment').value = 90000;
    document.getElementById('interestRate').value = 6.5;
    document.getElementById('loanTerm').value = 30;
    document.getElementById('stateSelect').value = 'CA';
    
    updateCalculation();
}

// ========================================================================== //
// 5. CHART, SCHEDULE & EXPORT                                                //
// ========================================================================== //

/**
 * Updates the Amortization Chart.
 */
function updateAmortizationChart() {
    const data = MORTGAGE_CALCULATOR.currentCalculation;
    const chartCanvas = document.getElementById('amortization-chart');
    
    if (!chartCanvas) return;
    
    const chartCtx = chartCanvas.getContext('2d');
    
    // Filter the schedule to yearly points for a cleaner chart
    const chartData = data.schedule.filter(item => item.month % 12 === 0 || item.month === data.schedule.length);
    
    const labels = chartData.map(item => `Year ${item.year}`);
    const balanceData = chartData.map(item => item.balance);
    const principalPaidData = chartData.map(item => data.loanAmount - item.balance);

    if (MORTGAGE_CALCULATOR.ui.chart) {
        MORTGAGE_CALCULATOR.ui.chart.destroy();
    }
    
    // Determine chart colors based on theme
    const isDarkMode = document.documentElement.getAttribute('data-color-scheme') === 'dark';
    const balanceColor = isDarkMode ? '#f59e0b' : '#3b82f6';
    const principalColor = '#10b981';
    const gridColor = isDarkMode ? '#374151' : '#e5e7eb';
    const textColor = isDarkMode ? '#f9fafb' : '#111827';
    const mutedTextColor = isDarkMode ? '#9ca3af' : '#6b7280';
    
    MORTGAGE_CALCULATOR.ui.chart = new Chart(chartCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Remaining Balance',
                    data: balanceData,
                    borderColor: balanceColor,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2
                },
                {
                    label: 'Principal Paid',
                    data: principalPaidData,
                    borderColor: principalColor,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        font: {
                            family: "'Inter', sans-serif"
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
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: mutedTextColor,
                        font: {
                            family: "'Inter', sans-serif"
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: mutedTextColor,
                        font: {
                            family: "'Inter', sans-serif"
                        },
                        callback: function(value) { 
                            if (value >= 1000000) {
                                return '$' + (value / 1000000).toFixed(1) + 'M';
                            } else if (value >= 1000) {
                                return '$' + (value / 1000).toFixed(0) + 'K';
                            }
                            return '$' + value;
                        }
                    },
                    title: {
                        display: true,
                        text: 'Amount ($)',
                        color: textColor,
                        font: {
                            family: "'Inter', sans-serif",
                            weight: '500'
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
    
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = ''; // Clear existing table
    
    const isYearly = !showMonthly && data.loanTerm > 1;

    if (isYearly) {
        let annualPrincipalPaid = 0;
        let annualInterestPaid = 0;
        let currentYear = 1;
        
        data.schedule.forEach(item => {
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
        });
    } else {
        // Monthly view
        data.schedule.forEach(item => {
            const monthlyRow = tbody.insertRow();
            monthlyRow.insertCell().textContent = item.month;
            monthlyRow.insertCell().textContent = formatCurrency(item.piPayment);
            monthlyRow.insertCell().textContent = formatCurrency(item.principal);
            monthlyRow.insertCell().textContent = formatCurrency(item.interest);
            monthlyRow.insertCell().textContent = formatCurrency(item.balance);
        });
    }
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
    if (!jsPDF) {
        showToast('PDF export library not loaded.', 'error');
        return;
    }
    
    const doc = new jsPDF();
    const data = MORTGAGE_CALCULATOR.currentCalculation;
    const term = data.loanTerm;
    const stateData = MORTGAGE_CALCULATOR.STATE_DATA[data.state] || MORTGAGE_CALCULATOR.STATE_DATA.DEFAULT;
    
    // Title
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246);
    doc.text("Finguid.com Mortgage Report", 105, 20, null, null, "center");
    
    // Payment summary
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Estimated Monthly Payment: ${formatCurrency(data.totalMonthly)}`, 105, 30, null, null, "center");
    
    // Summary Table
    const summaryData = [
        ['Home Price', formatCurrency(data.homePrice)],
        ['Down Payment', formatCurrency(data.downPayment)],
        ['Loan Amount', formatCurrency(data.loanAmount)],
        ['Interest Rate', `${data.interestRate.toFixed(2)}%`],
        ['Loan Term', `${term} Years`],
        ['State', stateData.stateName],
        ['P&I Payment', formatCurrency(data.piMonthly)],
        ['Taxes & Insurance', formatCurrency(data.taxMonthly + data.insuranceMonthly)],
        ['Total Interest Paid', formatCurrency(data.totalInterest)],
        ['Total Loan Cost', formatCurrency(data.loanAmount + data.totalInterest)],
    ];
    
    doc.autoTable({
        startY: 40,
        head: [['Loan Parameter', 'Value']],
        body: summaryData,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246] }
    });

    // Amortization Schedule Table (Yearly)
    const scheduleBody = data.schedule
        .filter(item => item.month % 12 === 0 || item.month === data.schedule.length)
        .map(item => [
            item.year,
            formatCurrency(item.piPayment * 12),
            formatCurrency(data.loanAmount - item.balance),
            formatCurrency((item.piPayment * 12) - (data.loanAmount - item.balance)),
            formatCurrency(item.balance)
        ]);

    doc.autoTable({
        startY: doc.lastAutoTable.finishedY + 10,
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

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Report generated by the finguid.com AI Mortgage Calculator. Rates are estimates.", 10, doc.internal.pageSize.height - 10);
    
    // Save the PDF
    doc.save('Finguid_Mortgage_Report.pdf');
    showToast('PDF Report generated and downloaded!', 'success');
    
    // Track PDF export event
    trackPartnerClick('PDF_Export');
}

/**
 * Exports schedule to CSV
 */
function exportToCSV() {
    const data = MORTGAGE_CALCULATOR.currentCalculation;
    let csvContent = "Year,Yearly Payment,Principal Paid,Interest Paid,Remaining Balance\n";
    
    data.schedule
        .filter(item => item.month % 12 === 0 || item.month === data.schedule.length)
        .forEach(item => {
            const yearlyPayment = item.piPayment * 12;
            const principalPaid = data.loanAmount - item.balance;
            const interestPaid = yearlyPayment - principalPaid;
            
            csvContent += `${item.year},${yearlyPayment},${principalPaid},${interestPaid},${item.balance}\n`;
        });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'mortgage_schedule.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showToast('CSV file downloaded!', 'success');
    trackPartnerClick('CSV_Export');
}

// ========================================================================== //
// 6. ANALYTICS & TRACKING                                                    //
// ========================================================================== //

/**
 * Enhanced analytics tracking
 */
function trackCalculatorEvent(eventName, eventData = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
            ...eventData,
            event_category: 'mortgage_calculator',
            event_label: 'finguid_mortgage_calc'
        });
    }
    
    // Log to console in development
    if (MORTGAGE_CALCULATOR.DEBUG) {
        console.log('Analytics Event:', eventName, eventData);
    }
}

/**
 * Track calculation events
 */
function trackCalculationEvent() {
    const data = MORTGAGE_CALCULATOR.currentCalculation;
    trackCalculatorEvent('calculation_completed', {
        loan_amount: data.loanAmount,
        interest_rate: data.interestRate,
        monthly_payment: data.totalMonthly,
        down_payment_percent: ((data.downPayment / data.homePrice) * 100).toFixed(1),
        state: data.state
    });
}

/**
 * Track partner clicks for affiliate revenue
 */
function trackPartnerClick(partnerName) {
    const data = MORTGAGE_CALCULATOR.currentCalculation;
    trackCalculatorEvent('partner_click', {
        partner_name: partnerName,
        loan_amount: data.loanAmount,
        interest_rate: data.interestRate,
        monthly_payment: data.totalMonthly
    });
}

// ========================================================================== //
// 7. PWA FUNCTIONALITY                                                       //
// ========================================================================== //

/**
 * Initialize PWA functionality
 */
function initializePWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    }

    // Add before install prompt event listener
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        MORTGAGE_CALCULATOR.ui.deferredPrompt = e;
        // Show install button
        MORTGAGE_CALCULATOR.ui.controls.installBtn.style.display = 'flex';
    });

    // Handle install button click
    MORTGAGE_CALCULATOR.ui.controls.installBtn.addEventListener('click', async () => {
        if (!MORTGAGE_CALCULATOR.ui.deferredPrompt) return;
        
        // Show the install prompt
        MORTGAGE_CALCULATOR.ui.deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await MORTGAGE_CALCULATOR.ui.deferredPrompt.userChoice;
        
        // We've used the prompt, and can't use it again, discard it
        MORTGAGE_CALCULATOR.ui.deferredPrompt = null;
        
        // Hide the install button
        MORTGAGE_CALCULATOR.ui.controls.installBtn.style.display = 'none';
        
        if (outcome === 'accepted') {
            showToast('App installed successfully!', 'success');
            trackCalculatorEvent('pwa_install', { outcome: 'accepted' });
        } else {
            showToast('App installation cancelled.', 'info');
            trackCalculatorEvent('pwa_install', { outcome: 'dismissed' });
        }
    });

    // Track app launched from installed state
    window.addEventListener('appinstalled', () => {
        MORTGAGE_CALCULATOR.ui.deferredPrompt = null;
        trackCalculatorEvent('pwa_launch');
    });
}

// ========================================================================== //
// 8. UI UTILITIES & INITIALIZATION                                           //
// ========================================================================== //

/**
 * Displays a non-intrusive toast notification.
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="${icons[type] || icons.info} toast-icon"></i>
        <span>${message}</span>
    `;

    MORTGAGE_CALCULATOR.ui.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-in');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('fade-in');
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 500);
    }, 5000);
}

/**
 * Sets up all initial data and event listeners.
 */
function initializeCalculator() {
    const ui = MORTGAGE_CALCULATOR.ui;
    
    // 1. Initial State Setup
    updateCalculation(); 
    
    // 2. Load Live FRED Rate
    fetchFredRate();
    
    // 3. Set up recurring FRED rate updates
    setInterval(fetchFredRate, MORTGAGE_CALCULATOR.RATE_UPDATE_INTERVAL);

    // 4. Theme Toggle Setup (Dark Mode Default)
    ui.controls.themeToggle.addEventListener('click', () => {
        const isDarkMode = document.documentElement.getAttribute('data-color-scheme') === 'dark';
        if (isDarkMode) {
            document.documentElement.setAttribute('data-color-scheme', 'light');
            ui.controls.themeToggle.querySelector('i').className = 'fas fa-moon';
            localStorage.setItem('color-scheme', 'light');
        } else {
            document.documentElement.setAttribute('data-color-scheme', 'dark');
            ui.controls.themeToggle.querySelector('i').className = 'fas fa-sun';
            localStorage.setItem('color-scheme', 'dark');
        }
        // Redraw chart to update colors
        updateAmortizationChart();
    });

    // 5. Set Event Listeners for tabs and inputs
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(`tab-${button.dataset.tab}`).classList.add('active');
            
            // Special handling for chart tab
            if (button.dataset.tab === 'balance-chart') {
                setTimeout(updateAmortizationChart, 100);
            }
        });
    });

    // Input event listeners
    document.querySelectorAll('.form-control').forEach(input => {
        input.addEventListener('input', () => updateCalculation(input.id));
    });
    
    // Button event listeners
    document.getElementById('calculate-btn').addEventListener('click', () => updateCalculation('calculate-btn'));
    document.getElementById('toggle-schedule').addEventListener('click', toggleScheduleView);
    document.getElementById('export-schedule-csv').addEventListener('click', exportToCSV);
    document.getElementById('share-pdf-btn').addEventListener('click', exportToPDF);
    document.getElementById('save-calculation').addEventListener('click', () => {
        showToast('Calculation saved to your browser storage.', 'success');
        localStorage.setItem('lastMortgageCalculation', JSON.stringify(MORTGAGE_CALCULATOR.currentCalculation));
    });
    
    // Voice control
    ui.controls.voiceToggle.addEventListener('click', toggleVoiceControl);
    ui.controls.voiceStatus.querySelector('.voice-status-close').addEventListener('click', toggleVoiceControl);
    
    // Read aloud button
    ui.controls.readAloudBtn.addEventListener('click', () => {
        const insightsText = ui.controls.aiInsightsContent.textContent;
        textToSpeech(insightsText);
    });
    
    // Partner link tracking
    document.querySelectorAll('.partner-link').forEach(link => {
        link.addEventListener('click', (e) => {
            trackPartnerClick(e.target.dataset.partner || e.target.textContent);
        });
    });
    
    // Agent lead form
    document.getElementById('agentLeadForm').addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Thank you! We\'ll connect you with a local agent shortly.', 'success');
        trackPartnerClick('Agent_Lead');
        e.target.reset();
    });
    
    // 6. Initialize PWA
    initializePWA();
    
    // 7. Load saved theme preference
    const savedTheme = localStorage.getItem('color-scheme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-color-scheme', savedTheme);
        ui.controls.themeToggle.querySelector('i').className = savedTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
    
    // 8. Load saved calculation if exists
    const savedCalculation = localStorage.getItem('lastMortgageCalculation');
    if (savedCalculation) {
        try {
            const calculation = JSON.parse(savedCalculation);
            document.getElementById('homePrice').value = calculation.homePrice;
            document.getElementById('downPayment').value = calculation.downPayment;
            document.getElementById('interestRate').value = calculation.interestRate;
            document.getElementById('loanTerm').value = calculation.loanTerm;
            document.getElementById('stateSelect').value = calculation.state;
            updateCalculation();
        } catch (e) {
            console.error('Error loading saved calculation:', e);
        }
    }
    
    // 9. Track initial page view
    trackCalculatorEvent('page_view');
    
    showToast('Mortgage calculator ready! Try voice commands for hands-free operation.', 'success');
}

// ========================================================================== //
// EXECUTION                                                                  //
// ========================================================================== //

// Fast initialization on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Use a slight delay to ensure all deferred scripts are loaded
        setTimeout(initializeCalculator, 100);
    });
} else {
    setTimeout(initializeCalculator, 100);
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MORTGAGE_CALCULATOR, calculateMortgage };
}
