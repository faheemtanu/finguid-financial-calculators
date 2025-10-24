/*
  HOME LOAN PRO — AI‑POWERED MORTGAGE AFFORDABILITY CALCULATOR - PRODUCTION JS v4.0
  FinGuid USA Market Domination Build - World's First AI-Powered Calculator
   © 2025 FinGuid - World's First AI Calculator Platform for Americans
 
*/

// ==========================================================================
// I. GLOBAL CONFIGURATION & STATE MANAGEMENT
// ==========================================================================

const AFFORDABILITY_CALCULATOR = {
    VERSION: '4.0',
    FRONT_END_DTI: 0.28, 
    BACK_END_DTI: 0.36,  
    DEFAULT_RATE: 7.00, 
    INITIAL_STATE: {
        annualIncome: 80000,
        monthlyDebts: 500,
        downPayment: 20000,
        mortgageTerm: 30, // years
        interestRate: 7.00,
        propertyTaxRate: 0.012, // 1.2% of home value
        insuranceRate: 0.0035, // 0.35% of home value
        pmiRate: 0.005, // 0.5% of loan, for < 20% down
    }
};

let userPreferences = {
    colorScheme: 'light',
    voiceMode: false
};

// ==========================================================================
// II. CORE CALCULATION LOGIC (DTI-based calculation)
// ==========================================================================

function calculateAffordability() {
    const inputs = getCalculatorInputs();

    // 1. Calculate Max Monthly PITI based on Front-End DTI (28%)
    const maxMonthlyPITI_FE = inputs.annualIncome * AFFORDABILITY_CALCULATOR.FRONT_END_DTI / 12;

    // 2. Calculate Max Monthly PITI based on Back-End DTI (36%)
    const maxMonthlyDebt_BE = inputs.annualIncome * AFFORDABILITY_CALCULATOR.BACK_END_DTI / 12;
    const maxMonthlyPITI_BE = maxMonthlyDebt_BE - inputs.monthlyDebts;

    // 3. Final Max Monthly PITI: The lower of the two constraints
    const maxMonthlyPITI = Math.min(maxMonthlyPITI_FE, maxMonthlyPITI_BE);

    if (maxMonthlyPITI <= 0) {
        renderResults({ maxHomePrice: 0, maxLoanAmount: 0, estimatedTotalPITI: 0, monthlyDebt: inputs.monthlyDebts, estimatedP_I: 0, estimatedTax: 0, estimatedIns: 0, estimatedPMI: 0 });
        showToast('Your monthly debt is too high to qualify for a loan.', 'error');
        return;
    }

    // 4. Calculate Mortgage Constant Components
    const monthlyRate = inputs.interestRate / 100 / 12;
    const termMonths = inputs.mortgageTerm * 12;
    const P_I_Factor = (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1) || 0;

    // 5. Calculate Fixed Cost Factors (Tax, Insurance)
    const taxFactorMonthly = AFFORDABILITY_CALCULATOR.INITIAL_STATE.propertyTaxRate / 12;
    const insuranceFactorMonthly = AFFORDABILITY_CALCULATOR.INITIAL_STATE.insuranceRate / 12;
    
    const initialPMIFactor = AFFORDABILITY_CALCULATOR.INITIAL_STATE.pmiRate / 12;

    // Sub-function to calculate L and H for a given PMI factor
    const calculateLoanAndPrice = (pmiFactor) => {
        // L = (PITI_max - DP * (T + I)) / (P_I_Factor + T + I + PMI_Factor)
        const numerator = maxMonthlyPITI - inputs.downPayment * (taxFactorMonthly + insuranceFactorMonthly);
        const denominator = P_I_Factor + taxFactorMonthly + insuranceFactorMonthly + pmiFactor;
        
        const maxLoanAmount = numerator / denominator;
        const maxHomePrice = maxLoanAmount + inputs.downPayment;
        
        return { maxLoanAmount, maxHomePrice };
    };

    // 6. ITERATIVE SOLUTION for Max Loan Amount (L) to correctly handle PMI
    
    // Step A: Calculate initial price assuming NO PMI (pmiFactor = 0)
    let pmiFactorMonthly = 0;
    let { maxLoanAmount, maxHomePrice } = calculateLoanAndPrice(pmiFactorMonthly);
    
    // Step B: Check if PMI is actually required (LTV > 80%)
    const LTV = maxHomePrice > 0 ? maxLoanAmount / maxHomePrice : 1; 
    
    if (LTV > 0.80 && maxHomePrice > 0) { 
        // Step C: If required, set the correct PMI factor and re-calculate
        pmiFactorMonthly = initialPMIFactor;
        ({ maxLoanAmount, maxHomePrice } = calculateLoanAndPrice(pmiFactorMonthly));
    }

    // 7. Render Results
    const results = {
        maxHomePrice: Math.max(0, maxHomePrice),
        maxLoanAmount: Math.max(0, maxLoanAmount),
        monthlyDebt: inputs.monthlyDebts,
        estimatedP_I: (maxLoanAmount > 0 ? maxLoanAmount * P_I_Factor : 0),
        estimatedTax: (maxHomePrice > 0 ? maxHomePrice * taxFactorMonthly : 0),
        estimatedIns: (maxHomePrice > 0 ? maxHomePrice * insuranceFactorMonthly : 0),
        estimatedPMI: (pmiFactorMonthly > 0 && maxLoanAmount > 0 ? maxLoanAmount * pmiFactorMonthly : 0),
        estimatedTotalPITI: maxMonthlyPITI
    };
    
    renderResults(results);
    renderInsights(results, inputs);
    speech.speakResults(results);
}


// ==========================================================================
// III. DATA INPUT AND UTILITIES
// ==========================================================================

function getCalculatorInputs() {
    const parseNumeric = (id, defaultValue) => {
        const element = document.getElementById(id);
        if (!element) return defaultValue; // Handle missing elements gracefully
        const value = element.value;
        return parseFloat(value.replace(/[^0-9.]/g, '')) || defaultValue;
    };
    
    const parseInteger = (id, defaultValue) => {
        const element = document.getElementById(id);
        if (!element) return defaultValue;
        return parseInt(element.value) || defaultValue;
    };

    const parseFloatValue = (id, defaultValue) => {
        const element = document.getElementById(id);
        if (!element) return defaultValue;
        return parseFloat(element.value) || defaultValue;
    };
    
    const zipCodeElement = document.getElementById('zipCode');
    
    return {
        annualIncome: parseNumeric('annualIncome', AFFORDABILITY_CALCULATOR.INITIAL_STATE.annualIncome),
        monthlyDebts: parseNumeric('monthlyDebts', AFFORDABILITY_CALCULATOR.INITIAL_STATE.monthlyDebts),
        downPayment: parseNumeric('downPayment', AFFORDABILITY_CALCULATOR.INITIAL_STATE.downPayment),
        mortgageTerm: parseInteger('mortgageTerm', AFFORDABILITY_CALCULATOR.INITIAL_STATE.mortgageTerm),
        interestRate: parseFloatValue('interestRate', AFFORDABILITY_CALCULATOR.INITIAL_STATE.interestRate),
        zipCode: zipCodeElement ? zipCodeElement.value.trim() : ''
    };
}

function formatCurrency(number) {
    if (isNaN(number) || number < 0) return '$0';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
}

function formatPercent(number) {
    if (!isFinite(number) || isNaN(number) || number < 0) return '0.00%';
    return (number * 100).toFixed(2) + '%';
}


// ==========================================================================
// IV. RESULTS RENDERING & INSIGHTS
// ==========================================================================

function renderResults(results) {
    document.getElementById('result-price').textContent = formatCurrency(results.maxHomePrice);
    document.getElementById('result-loan-amount').textContent = formatCurrency(results.maxLoanAmount);
    document.getElementById('result-monthly-piti').textContent = formatCurrency(results.estimatedTotalPITI);
    document.getElementById('breakdown-pi').textContent = formatCurrency(results.estimatedP_I);
    document.getElementById('breakdown-tax').textContent = formatCurrency(results.estimatedTax);
    document.getElementById('breakdown-ins').textContent = formatCurrency(results.estimatedIns);
    
    const pmiElement = document.getElementById('breakdown-pmi');
    pmiElement.textContent = formatCurrency(results.estimatedPMI);
    
    const pmiDetailItem = pmiElement.closest('.detail-item');
    if (pmiDetailItem) {
        pmiDetailItem.classList.toggle('alert-pmi', results.estimatedPMI > 0);
    }
    
    const annualIncome = getCalculatorInputs().annualIncome;
    const monthlyGross = annualIncome / 12;
    
    const frontEndDTI = monthlyGross > 0 ? results.estimatedTotalPITI / monthlyGross : 0;
    const backEndDTI = monthlyGross > 0 ? (results.estimatedTotalPITI + results.monthlyDebt) / monthlyGross : 0;

    document.getElementById('dti-front-end').textContent = formatPercent(frontEndDTI);
    document.getElementById('dti-back-end').textContent = formatPercent(backEndDTI);

    document.getElementById('results-section').style.display = 'block';
}

function renderInsights(results, inputs) {
    const insightsContainer = document.getElementById('ai-insights-list');
    insightsContainer.innerHTML = '';
    const monthlyGross = inputs.annualIncome / 12;
    const backEndDTI = (results.estimatedTotalPITI + inputs.monthlyDebts) / monthlyGross;
    
    let insights = [];

    if (backEndDTI > 0.35) {
        insights.push({ icon: 'fas fa-exclamation-triangle', text: `Your Back-End DTI is high (${formatPercent(backEndDTI)}). Consider **reducing your monthly debts**.` });
    } else if (backEndDTI < 0.25 && results.maxHomePrice > 0) {
        insights.push({ icon: 'fas fa-check-circle', text: `Excellent! Your DTI is low. This suggests **strong financial health**.` });
    }

    if (results.estimatedPMI > 0) {
        // Calculate the additional down payment needed to reach 20% LTV
        const pmiAvoidanceDownPayment = Math.max(0, (results.maxHomePrice * 0.20) - inputs.downPayment);
        insights.push({ icon: 'fas fa-shield-alt', text: `**PMI Warning:** You will pay Private Mortgage Insurance. Try saving an extra **${formatCurrency(pmiAvoidanceDownPayment)}** to avoid PMI.` });
    } else if (results.maxHomePrice > 0) {
        insights.push({ icon: 'fas fa-trophy', text: `Great Job! Your 20% or more down payment means you **avoid costly Private Mortgage Insurance (PMI)**.` });
    }
    
    if (results.maxHomePrice === 0) {
        insights.push({ icon: 'fas fa-times-circle', text: 'We cannot calculate an affordable price. Please verify your **Annual Income** and **Monthly Debts** are correct.' });
    }

    insights.forEach(insight => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="${insight.icon}" aria-hidden="true"></i> ${insight.text}`;
        insightsContainer.appendChild(li);
    });
}


// ==========================================================================
// V. ACCESSIBILITY & UTILITY (LIGHT/DARK, VOICE)
// ==========================================================================

const accessibility = {
    toggleColorScheme: function() {
        const html = document.documentElement;
        userPreferences.colorScheme = (userPreferences.colorScheme === 'light' ? 'dark' : 'light');
        html.setAttribute('data-color-scheme', userPreferences.colorScheme);
        localStorage.setItem('colorScheme', userPreferences.colorScheme);
        this.updateModeButton();
    },
    updateModeButton: function() {
        const button = document.getElementById('toggle-mode');
        if (!button) return;
        const isDark = userPreferences.colorScheme === 'dark';
        button.innerHTML = isDark 
            ? '<i class="fas fa-sun" aria-hidden="true"></i> Light Mode' 
            : '<i class="fas fa-moon" aria-hidden="true"></i> Dark Mode';
    },
    loadColorScheme: function() {
        const savedScheme = localStorage.getItem('colorScheme');
        if (savedScheme) {
            userPreferences.colorScheme = savedScheme;
            document.documentElement.setAttribute('data-color-scheme', savedScheme);
        } else {
            const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (systemPrefersDark) {
                userPreferences.colorScheme = 'dark';
                document.documentElement.setAttribute('data-color-scheme', 'dark');
            }
        }
        this.updateModeButton();
    }
};

const speech = {
    synthesis: window.speechSynthesis,
    recognition: window.SpeechRecognition || window.webkitSpeechRecognition,
    
    initialize: function() {
        if (!this.recognition || !this.synthesis) {
            const voiceButton = document.getElementById('toggle-voice');
            if (voiceButton) voiceButton.style.display = 'none';
            return;
        }
        // Check for saved voice mode preference
        const savedVoiceMode = localStorage.getItem('voiceMode');
        if (savedVoiceMode) {
            userPreferences.voiceMode = savedVoiceMode === 'true'; 
        }

        this.setupRecognition();
        this.updateVoiceButton();
        if (userPreferences.voiceMode) {
             // Start listening if voice mode was active
             try { this.recognizer.start(); } catch (e) { /* already running */ }
        }
    },
    setupRecognition: function() {
        this.recognizer = new this.recognition();
        this.recognizer.interimResults = false;
        this.recognizer.lang = 'en-US';
        this.recognizer.continuous = true;

        this.recognizer.onresult = (event) => {
            const last = event.results.length - 1;
            const command = event.results[last][0].transcript.toLowerCase();
            this.handleCommand(command);
        };
        
        this.recognizer.onend = () => {
            if (userPreferences.voiceMode) {
                this.recognizer.start();
            }
        };
    },
    toggleListening: function() {
        userPreferences.voiceMode = !userPreferences.voiceMode;
        localStorage.setItem('voiceMode', userPreferences.voiceMode);
        this.updateVoiceButton();
        if (userPreferences.voiceMode) {
            try {
                this.recognizer.start();
                showToast('Voice Command Active. Say "Calculate" or "Help".', 'success');
            } catch (e) { showToast('Voice command already running.', 'info'); }
        } else {
            this.recognizer.stop();
            showToast('Voice Command Disabled.', 'error');
        }
    },
    updateVoiceButton: function() {
        const button = document.getElementById('toggle-voice');
        if (!button) return;
        const isActive = userPreferences.voiceMode;
        button.innerHTML = isActive 
            ? '<i class="fas fa-microphone-alt-slash" aria-hidden="true"></i> Voice Off' 
            : '<i class="fas fa-microphone-alt" aria-hidden="true"></i> Voice On';
    },
    handleCommand: function(command) {
        if (command.includes('calculate') || command.includes('compute')) {
            calculateAffordability();
            showToast('Voice command: Calculating Affordability.', 'success');
        } else if (command.includes('reset') || command.includes('clear')) {
            document.getElementById('calculator-form').reset();
            showToast('Voice command: Form Reset.', 'success');
        } else if (command.includes('help')) {
            this.speakText('I can calculate your affordability. Try saying: Calculate, or Reset.');
        } else {
            showToast(`Voice command received: "${command}". Try "Calculate".`, 'error');
        }
    },
    speakText: function(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        this.synthesis.speak(utterance);
    },
    speakResults: function(results) {
        if (!userPreferences.voiceMode || results.maxHomePrice <= 0) return;
        const homePrice = formatCurrency(results.maxHomePrice);
        const monthlyPITI = formatCurrency(results.estimatedTotalPITI);
        const speechText = `Based on your inputs, your maximum affordable home price is ${homePrice}. This would result in an estimated maximum monthly payment of ${monthlyPITI}.`;
        this.speakText(speechText);
    }
};


// ==========================================================================
// VI. EVENT LISTENERS & INITIALIZATION
// ==========================================================================

function setupEventListeners() {
    // CRITICAL FIX: Ensure form submission triggers the main function
    const form = document.getElementById('calculator-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); 
            calculateAffordability();
        });
        // Run calculation dynamically on every input change for instant feedback
        form.addEventListener('input', calculateAffordability);
    }

    const toggleModeButton = document.getElementById('toggle-mode');
    if (toggleModeButton) {
        toggleModeButton.addEventListener('click', accessibility.toggleColorScheme.bind(accessibility));
    }

    const toggleVoiceButton = document.getElementById('toggle-voice');
    if (toggleVoiceButton) {
        toggleVoiceButton.addEventListener('click', speech.toggleListening.bind(speech));
    }
}

function loadUserPreferences() {
    accessibility.loadColorScheme();
    // Voice preference is loaded in speech.initialize() to handle recognizer state
}

// Mock FRED API function
const fredAPI = {
    startAutomaticUpdates: function() {
        setTimeout(() => {
            const liveRate = 6.85; 
            const rateInput = document.getElementById('interestRate');
            if (rateInput) {
                rateInput.value = liveRate.toFixed(2);
            }
            AFFORDABILITY_CALCULATOR.INITIAL_STATE.interestRate = liveRate;
            // Run calculation after the rate update
            calculateAffordability(); 
        }, 500);
    }
};

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10); 
    
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 4000);
}


// ==========================================================================
// VII. DOCUMENT INITIALIZATION
// ==========================================================================


document.addEventListener('DOMContentLoaded', function() {
    loadUserPreferences();
    speech.initialize();
    setupEventListeners();
    fredAPI.startAutomaticUpdates(); 
});

// The extraneous closing brace has been removed.
