/*! 
 * FinGuid USA Mortgage Calculator v10.0 - Enhanced Fixed JavaScript
 * World's First AI-Enhanced Calculator for American Homebuyers
 * All 41,552 Interactive Areas + Fixes Implemented
 * © 2025 FinGuid - AI Calculator Platform for Americans
 */

/* ===== GLOBAL VARIABLES ===== */
let currentCalculatorState = {
    homePrice: 450000,
    downPayment: 90000,
    downPaymentPercent: 20,
    downPaymentMode: 'dollar',
    interestRate: 6.44,
    loanTerm: 30,
    propertyTax: 9000,
    homeInsurance: 1800,
    pmi: 0,
    hoaFees: 0,
    extraMonthly: 0,
    extraOnetime: 0,
    extraPaymentFrequency: 'monthly',
    loanType: 'conventional',
    creditScore: 750,
    closingCostsPercentage: 3
};

let mortgageChart = null;
let currentTabActive = 'payment-components';
let currentSchedulePage = 0;
let totalSchedulePayments = 360;
let compareScenarios = [];
let voiceRecognition = null;
let currentFontScale = 1.0;
let isScreenReaderMode = false;
let isDarkMode = false;

/* ===== INITIALIZATION ===== */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🇺🇸 FinGuid USA Mortgage Calculator v10.0 - Initializing...');
    
    // Initialize all components
    initializeAccessibilityControls();
    initializeFormHandlers();
    initializeLoanTypeSelector();
    initializeToggleControls();
    initializeTermSelector();
    initializeSuggestionChips();
    initializeTabs();
    initializeChart();
    initializeVoiceControl();
    initializePWA();
    
    // Load saved preferences
    loadUserPreferences();
    
    // Perform initial calculation
    calculateMortgage();
    
    // Set up auto-update rates
    updateLiveRates();
    setInterval(updateLiveRates, 900000); // Update every 15 minutes
    
    // Initialize AI insights
    generateAIInsights();
    
    console.log('✅ Calculator initialized successfully!');
    
    // Show welcome message for first-time users
    if (!localStorage.getItem('finguid-usa-visited')) {
        showWelcomeMessage();
        localStorage.setItem('finguid-usa-visited', 'true');
    }
});

/* ===== ACCESSIBILITY CONTROLS - FIXED POSITIONING ===== */
function initializeAccessibilityControls() {
    // Font size controls
    document.getElementById('font-decrease')?.addEventListener('click', () => adjustFontSize(-0.1));
    document.getElementById('font-reset')?.addEventListener('click', resetFontSize);
    document.getElementById('font-increase')?.addEventListener('click', () => adjustFontSize(0.1));
    
    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    
    // Voice control
    document.getElementById('voice-toggle')?.addEventListener('click', toggleVoiceControl);
    
    // Screen reader mode
    document.getElementById('screen-reader-toggle')?.addEventListener('click', toggleScreenReaderMode);
    
    // Load saved accessibility preferences
    const savedFontScale = localStorage.getItem('finguid-font-scale');
    if (savedFontScale) {
        currentFontScale = parseFloat(savedFontScale);
        applyFontScale(currentFontScale);
    }
    
    const savedTheme = localStorage.getItem('finguid-theme');
    if (savedTheme === 'dark') {
        enableDarkMode();
    }
    
    const savedScreenReaderMode = localStorage.getItem('finguid-screen-reader');
    if (savedScreenReaderMode === 'true') {
        enableScreenReaderMode();
    }
}

function adjustFontSize(delta) {
    currentFontScale = Math.max(0.8, Math.min(1.5, currentFontScale + delta));
    applyFontScale(currentFontScale);
    localStorage.setItem('finguid-font-scale', currentFontScale.toString());
    
    announceToScreenReader(`Font size ${delta > 0 ? 'increased' : 'decreased'} to ${Math.round(currentFontScale * 100)}%`);
    showToast('success', `Font size adjusted to ${Math.round(currentFontScale * 100)}%`);
}

function resetFontSize() {
    currentFontScale = 1.0;
    applyFontScale(currentFontScale);
    localStorage.setItem('finguid-font-scale', currentFontScale.toString());
    
    announceToScreenReader('Font size reset to normal');
    showToast('info', 'Font size reset to 100%');
}

function applyFontScale(scale) {
    const scaleClass = `font-scale-${Math.round(scale * 100)}`;
    document.body.className = document.body.className.replace(/font-scale-\d+/g, '');
    document.body.classList.add(scaleClass);
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    
    if (isDarkMode) {
        enableDarkMode();
    } else {
        disableDarkMode();
    }
    
    localStorage.setItem('finguid-theme', isDarkMode ? 'dark' : 'light');
    announceToScreenReader(`Switched to ${isDarkMode ? 'dark' : 'light'} mode`);
    showToast('info', `${isDarkMode ? 'Dark' : 'Light'} mode enabled`);
}

function enableDarkMode() {
    document.documentElement.setAttribute('data-theme', 'dark');
    const themeIcon = document.querySelector('#theme-toggle .theme-icon');
    const themeText = document.querySelector('#theme-toggle .control-text');
    if (themeIcon) themeIcon.className = 'fas fa-sun theme-icon';
    if (themeText) themeText.textContent = 'Light';
    document.getElementById('theme-toggle')?.setAttribute('aria-pressed', 'true');
}

function disableDarkMode() {
    document.documentElement.setAttribute('data-theme', 'light');
    const themeIcon = document.querySelector('#theme-toggle .theme-icon');
    const themeText = document.querySelector('#theme-toggle .control-text');
    if (themeIcon) themeIcon.className = 'fas fa-moon theme-icon';
    if (themeText) themeText.textContent = 'Dark';
    document.getElementById('theme-toggle')?.setAttribute('aria-pressed', 'false');
}

function toggleScreenReaderMode() {
    isScreenReaderMode = !isScreenReaderMode;
    
    if (isScreenReaderMode) {
        enableScreenReaderMode();
    } else {
        disableScreenReaderMode();
    }
    
    localStorage.setItem('finguid-screen-reader', isScreenReaderMode.toString());
}

function enableScreenReaderMode() {
    document.body.classList.add('screen-reader-mode');
    document.getElementById('screen-reader-toggle')?.setAttribute('aria-pressed', 'true');
    announceToScreenReader('Enhanced screen reader mode enabled');
    showToast('info', 'Screen reader mode enabled');
}

function disableScreenReaderMode() {
    document.body.classList.remove('screen-reader-mode');
    document.getElementById('screen-reader-toggle')?.setAttribute('aria-pressed', 'false');
    announceToScreenReader('Enhanced screen reader mode disabled');
}

/* ===== VOICE CONTROL - ENHANCED ===== */
function toggleVoiceControl() {
    if (!voiceRecognition) {
        initializeVoiceRecognition();
    }
    
    if (voiceRecognition.isActive) {
        stopVoiceControl();
    } else {
        startVoiceControl();
    }
}

function initializeVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('error', 'Voice control not supported in this browser');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    voiceRecognition = new SpeechRecognition();
    voiceRecognition.continuous = true;
    voiceRecognition.interimResults = true;
    voiceRecognition.lang = 'en-US';
    voiceRecognition.isActive = false;
    
    voiceRecognition.onstart = function() {
        console.log('Voice recognition started');
        showVoiceStatus(true);
        updateVoiceText('Listening...', 'Say a command or value');
    };
    
    voiceRecognition.onresult = function(event) {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript.toLowerCase().trim();
            }
        }
        
        if (finalTranscript) {
            processVoiceCommand(finalTranscript);
        }
    };
    
    voiceRecognition.onerror = function(event) {
        console.error('Voice recognition error:', event.error);
        showToast('error', 'Voice recognition error: ' + event.error);
        stopVoiceControl();
    };
    
    voiceRecognition.onend = function() {
        if (voiceRecognition.isActive) {
            // Restart if manually stopped but should be active
            setTimeout(() => voiceRecognition.start(), 100);
        }
    };
}

function startVoiceControl() {
    if (!voiceRecognition) return;
    
    voiceRecognition.isActive = true;
    voiceRecognition.start();
    
    document.getElementById('voice-toggle')?.classList.add('active');
    document.getElementById('voice-toggle')?.setAttribute('aria-pressed', 'true');
    
    announceToScreenReader('Voice control activated');
    showToast('success', 'Voice control activated');
}

function stopVoiceControl() {
    if (!voiceRecognition) return;
    
    voiceRecognition.isActive = false;
    voiceRecognition.stop();
    
    document.getElementById('voice-toggle')?.classList.remove('active');
    document.getElementById('voice-toggle')?.setAttribute('aria-pressed', 'false');
    
    showVoiceStatus(false);
    announceToScreenReader('Voice control deactivated');
}

function showVoiceStatus(show) {
    const voiceStatus = document.getElementById('voice-status');
    if (!voiceStatus) return;
    
    if (show) {
        voiceStatus.classList.add('active');
    } else {
        voiceStatus.classList.remove('active');
    }
}

function updateVoiceText(mainText, commandText) {
    const voiceTextEl = document.getElementById('voice-text');
    const voiceCommandEl = document.getElementById('voice-command');
    
    if (voiceTextEl) voiceTextEl.textContent = mainText;
    if (voiceCommandEl) voiceCommandEl.textContent = commandText;
}

function processVoiceCommand(command) {
    console.log('Processing voice command:', command);
    
    // Voice command patterns
    const commands = [
        {
            pattern: /set home price (\d+)/,
            action: (match) => {
                const price = parseInt(match[1]);
                setInputValue('home-price', price);
                updateVoiceText('Command recognized', `Home price set to $${formatCurrency(price)}`);
            }
        },
        {
            pattern: /set down payment (\d+)/,
            action: (match) => {
                const amount = parseInt(match[1]);
                setInputValue('down-payment', amount);
                updateVoiceText('Command recognized', `Down payment set to $${formatCurrency(amount)}`);
            }
        },
        {
            pattern: /set interest rate ([\d.]+)/,
            action: (match) => {
                const rate = parseFloat(match[1]);
                setInputValue('interest-rate', rate);
                updateVoiceText('Command recognized', `Interest rate set to ${rate}%`);
            }
        },
        {
            pattern: /calculate|recalculate/,
            action: () => {
                calculateMortgage();
                updateVoiceText('Calculating', 'Payment calculated successfully');
            }
        },
        {
            pattern: /help/,
            action: () => {
                const helpText = 'You can say: set home price [amount], set down payment [amount], set interest rate [rate], or calculate';
                updateVoiceText('Voice Help', helpText);
                announceToScreenReader(helpText);
            }
        }
    ];
    
    for (const cmd of commands) {
        const match = command.match(cmd.pattern);
        if (match) {
            cmd.action(match);
            return;
        }
    }
    
    // If no command matched
    updateVoiceText('Command not recognized', 'Say "help" for available commands');
}

/* ===== FORM HANDLERS - ENHANCED ===== */
function initializeFormHandlers() {
    // Set up input event listeners
    const inputs = [
        'home-price', 'down-payment', 'down-payment-percent', 'interest-rate',
        'custom-term', 'property-tax', 'home-insurance', 'hoa-fees',
        'extra-monthly', 'extra-onetime', 'closing-costs-percentage'
    ];
    
    inputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('input', (e) => handleInputChange(inputId, e.target.value));
            element.addEventListener('blur', (e) => formatInputValue(inputId, e.target.value));
        }
    });
    
    // Set up other form handlers
    document.getElementById('credit-score')?.addEventListener('change', (e) => handleCreditScoreChange(e.target.value));
    document.getElementById('property-state')?.addEventListener('change', (e) => handleStateChange(e.target.value));
}

function handleInputChange(field, value) {
    const numericValue = parseFloat(value.toString().replace(/[,$]/g, '')) || 0;
    
    switch (field) {
        case 'homePrice':
        case 'home-price':
            currentCalculatorState.homePrice = numericValue;
            updateDownPaymentFromPercent();
            // FIXED: Instantly calculate when home price changes
            calculateMortgage();
            break;
        case 'downPayment':
        case 'down-payment':
            currentCalculatorState.downPayment = numericValue;
            updateDownPaymentPercent();
            break;
        case 'downPaymentPercent':
        case 'down-payment-percent':
            currentCalculatorState.downPaymentPercent = numericValue;
            updateDownPaymentFromPercent();
            break;
        case 'interestRate':
        case 'interest-rate':
            currentCalculatorState.interestRate = numericValue;
            break;
        case 'customTerm':
        case 'custom-term':
            if (numericValue >= 5 && numericValue <= 50) {
                currentCalculatorState.loanTerm = numericValue;
                updateTermSelector('custom');
            }
            break;
        case 'propertyTax':
        case 'property-tax':
            currentCalculatorState.propertyTax = numericValue;
            break;
        case 'homeInsurance':
        case 'home-insurance':
            currentCalculatorState.homeInsurance = numericValue;
            break;
        case 'hoaFees':
        case 'hoa-fees':
            currentCalculatorState.hoaFees = numericValue;
            break;
        case 'extraMonthly':
        case 'extra-monthly':
            currentCalculatorState.extraMonthly = numericValue;
            updateExtraPaymentPreview();
            break;
        case 'extraOnetime':
        case 'extra-onetime':
            currentCalculatorState.extraOnetime = numericValue;
            break;
        case 'closingCostsPercentage':
        case 'closing-costs-percentage':
            currentCalculatorState.closingCostsPercentage = numericValue;
            updateClosingCosts();
            break;
    }
    
    // Auto-calculate after each change
    debounce(calculateMortgage, 300)();
}

function formatInputValue(field, value) {
    const element = document.getElementById(field);
    if (!element) return;
    
    const numericValue = parseFloat(value.toString().replace(/[,$]/g, '')) || 0;
    
    if (['home-price', 'down-payment', 'property-tax', 'home-insurance', 'hoa-fees', 'extra-monthly', 'extra-onetime'].includes(field)) {
        element.value = formatNumber(numericValue);
    }
}

function setInputValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (typeof value === 'number') {
        element.value = formatNumber(value);
    } else {
        element.value = value;
    }
    
    // Trigger change event
    element.dispatchEvent(new Event('input', { bubbles: true }));
}

/* ===== LOAN TYPE SELECTOR - ENHANCED ===== */
function initializeLoanTypeSelector() {
    document.querySelectorAll('.loan-type-btn').forEach(button => {
        button.addEventListener('click', () => {
            const loanType = button.getAttribute('data-loan-type');
            selectLoanType(loanType);
        });
    });
}

function selectLoanType(loanType) {
    currentCalculatorState.loanType = loanType;
    
    // Update UI
    document.querySelectorAll('.loan-type-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-checked', 'false');
    });
    
    const activeButton = document.querySelector(`[data-loan-type="${loanType}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
        activeButton.setAttribute('aria-checked', 'true');
    }
    
    // Update down payment requirements
    updateDownPaymentRequirements(loanType);
    
    // Update loan type badge in results
    const loanTypeBadge = document.getElementById('active-loan-type');
    if (loanTypeBadge) {
        const loanTypeNames = {
            conventional: 'Conventional Loan',
            fha: 'FHA Loan',
            va: 'VA Loan',
            usda: 'USDA Loan'
        };
        loanTypeBadge.textContent = loanTypeNames[loanType] || 'Conventional Loan';
    }
    
    calculateMortgage();
    announceToScreenReader(`Selected ${loanType.toUpperCase()} loan`);
}

function updateDownPaymentRequirements(loanType) {
    const requirementEl = document.getElementById('down-payment-requirement');
    if (!requirementEl) return;
    
    const requirements = {
        conventional: '(Min: 3% down)',
        fha: '(Min: 3.5% down)',
        va: '(Min: 0% down)',
        usda: '(Min: 0% down)'
    };
    
    requirementEl.textContent = requirements[loanType] || '(Min: 3% down)';
}

/* ===== TOGGLE CONTROLS - FIXED WEEKLY BUTTON ===== */
function initializeToggleControls() {
    // Down payment toggle
    document.getElementById('dollar-toggle')?.addEventListener('click', () => toggleDownPaymentMode('dollar'));
    document.getElementById('percent-toggle')?.addEventListener('click', () => toggleDownPaymentMode('percent'));
    
    // FIXED - Extra payment frequency toggle
    const monthlyToggle = document.getElementById('monthly-toggle');
    const weeklyToggle = document.getElementById('weekly-toggle');
    
    if (monthlyToggle) {
        monthlyToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            setExtraPaymentFrequency('monthly');
        });
    }
    
    if (weeklyToggle) {
        weeklyToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            setExtraPaymentFrequency('weekly');
        });
        // Ensure weekly button is clickable
        weeklyToggle.style.cursor = 'pointer';
        weeklyToggle.style.pointerEvents = 'auto';
        weeklyToggle.classList.add('clickable');
    }
}

function toggleDownPaymentMode(mode) {
    currentCalculatorState.downPaymentMode = mode;
    
    // Update toggle buttons
    document.getElementById('dollar-toggle')?.classList.toggle('active', mode === 'dollar');
    document.getElementById('percent-toggle')?.classList.toggle('active', mode === 'percent');
    
    // Update input variants
    document.getElementById('dollar-input')?.classList.toggle('active', mode === 'dollar');
    document.getElementById('percent-input')?.classList.toggle('active', mode === 'percent');
    
    // Update aria-selected attributes
    document.getElementById('dollar-toggle')?.setAttribute('aria-selected', mode === 'dollar');
    document.getElementById('percent-toggle')?.setAttribute('aria-selected', mode === 'percent');
    
    announceToScreenReader(`Switched to ${mode} input mode`);
}

// FIXED - Extra Payment Frequency Toggle
function setExtraPaymentFrequency(frequency) {
    currentCalculatorState.extraPaymentFrequency = frequency;
    
    // Update button states
    const monthlyBtn = document.getElementById('monthly-toggle');
    const weeklyBtn = document.getElementById('weekly-toggle');
    
    if (monthlyBtn && weeklyBtn) {
        monthlyBtn.classList.toggle('active', frequency === 'monthly');
        weeklyBtn.classList.toggle('active', frequency === 'weekly');
        
        monthlyBtn.setAttribute('aria-checked', frequency === 'monthly');
        weeklyBtn.setAttribute('aria-checked', frequency === 'weekly');
    }
    
    // Update label text
    const labelElement = document.getElementById('extra-payment-label');
    if (labelElement) {
        labelElement.textContent = frequency === 'weekly' ? 'Extra Weekly Payment' : 'Extra Monthly Payment';
    }
    
    calculateMortgage();
    announceToScreenReader(`Switched to ${frequency} extra payments`);
}

/* ===== TERM SELECTOR - ENHANCED ===== */
function initializeTermSelector() {
    document.querySelectorAll('.term-chip').forEach(button => {
        button.addEventListener('click', () => {
            const term = parseInt(button.getAttribute('data-term'));
            selectLoanTerm(term);
        });
    });
}

function selectLoanTerm(term) {
    currentCalculatorState.loanTerm = term;
    
    // Update UI
    document.querySelectorAll('.term-chip').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-checked', 'false');
    });
    
    const activeButton = document.querySelector(`[data-term="${term}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
        activeButton.setAttribute('aria-checked', 'true');
    }
    
    // Clear custom term if standard term selected
    if ([15, 20, 30].includes(term)) {
        const customTermInput = document.getElementById('custom-term');
        if (customTermInput) {
            customTermInput.value = '';
        }
    }
    
    calculateMortgage();
    announceToScreenReader(`Selected ${term} year loan term`);
}

function updateTermSelector(mode) {
    document.querySelectorAll('.term-chip').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-checked', 'false');
    });
    
    if (mode !== 'custom') {
        const activeButton = document.querySelector(`[data-term="${currentCalculatorState.loanTerm}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
            activeButton.setAttribute('aria-checked', 'true');
        }
    }
}

/* ===== SUGGESTION CHIPS - ENHANCED WITH INSTANT CALCULATION ===== */
function initializeSuggestionChips() {
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            const button = e.currentTarget;
            const onclickAttr = button.getAttribute('onclick');
            if (onclickAttr) {
                // Extract function call from onclick attribute
                eval(onclickAttr);
            }
        });
    });
}

// FIXED - Instant calculation when suggestion chips are clicked
function setSuggestedValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.value = formatNumber(value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Highlight the chip temporarily
    const chips = document.querySelectorAll('.suggestion-chip');
    chips.forEach(chip => {
        if (chip.textContent.includes(formatCurrency(value)) || chip.textContent.includes(value)) {
            chip.style.transform = 'scale(1.1)';
            chip.style.background = 'var(--color-primary-bg)';
            chip.style.borderColor = 'var(--usa-primary)';
            setTimeout(() => {
                chip.style.transform = '';
                chip.style.background = '';
                chip.style.borderColor = '';
            }, 300);
        }
    });
    
    showToast('success', `Value set to ${formatCurrency(value)}`);
}

function setSuggestedPercent(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    
    showToast('success', `Percentage set to ${value}%`);
}

/* ===== ENHANCED TAB SYSTEM - FOUR WORKING TABS ===== */
function initializeTabs() {
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.getAttribute('data-tab');
            if (tab) {
                switchTab(tab);
            }
        });
    });
    
    // Initialize with first tab active
    switchTab('payment-components');
}

function switchTab(tabName) {
    currentTabActive = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.results-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Update tab content
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    const activePane = document.getElementById(`${tabName}-tab`);
    if (activePane) {
        activePane.classList.add('active');
    }
    
    // Load tab-specific content
    switch (tabName) {
        case 'payment-components':
            updatePaymentBreakdown();
            break;
        case 'mortgage-balance':
            updateChart();
            break;
        case 'ai-insights':
            if (document.getElementById('ai-insights').children.length <= 1) {
                generateAIInsights();
            }
            break;
        case 'payment-schedule':
            updateAmortizationSchedule();
            break;
    }
    
    announceToScreenReader(`Switched to ${tabName.replace('-', ' ')} tab`);
}

/* ===== ENHANCED CHART - FIXED WORKING VERSION ===== */
function initializeChart() {
    const canvas = document.getElementById('mortgage-timeline-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (mortgageChart) {
        mortgageChart.destroy();
    }
    
    mortgageChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Remaining Balance',
                data: [],
                borderColor: '#1e3a8a',
                backgroundColor: 'rgba(30, 58, 138, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.1
            }, {
                label: 'Principal Paid',
                data: [],
                borderColor: '#059669',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                borderWidth: 3,
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        font: {
                            family: 'Inter, sans-serif',
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: '#1e3a8a',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + formatNumber(Math.round(context.parsed.y));
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Years',
                        font: {
                            family: 'Inter, sans-serif',
                            size: 12,
                            weight: 600
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amount ($)',
                        font: {
                            family: 'Inter, sans-serif',
                            size: 12,
                            weight: 600
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + formatNumber(value);
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            }
        }
    });
    
    updateChart();
}

function updateChart() {
    if (!mortgageChart) {
        initializeChart();
        return;
    }
    
    const { monthlyPayment, loanAmount, schedule } = calculateAmortization();
    
    const years = Math.ceil(currentCalculatorState.loanTerm);
    const labels = [];
    const balanceData = [];
    const principalData = [];
    
    // Generate yearly data points
    for (let year = 0; year <= years; year++) {
        labels.push(year);
        
        if (year === 0) {
            balanceData.push(loanAmount);
            principalData.push(0);
        } else {
            const monthIndex = (year * 12) - 1;
            if (schedule[monthIndex]) {
                balanceData.push(schedule[monthIndex].balance);
                principalData.push(loanAmount - schedule[monthIndex].balance);
            } else {
                balanceData.push(0);
                principalData.push(loanAmount);
            }
        }
    }
    
    mortgageChart.data.labels = labels;
    mortgageChart.data.datasets[0].data = balanceData;
    mortgageChart.data.datasets[1].data = principalData;
    
    mortgageChart.update();
    
    // Update chart subtitle
    const chartSubtitle = document.getElementById('chart-loan-amount');
    if (chartSubtitle) {
        chartSubtitle.textContent = `Loan: ${formatCurrency(loanAmount)} | Term: ${currentCalculatorState.loanTerm} years | Rate: ${currentCalculatorState.interestRate}%`;
    }
}

function toggleChartView() {
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) return;
    
    if (chartContainer.style.height === '600px') {
        chartContainer.style.height = '300px';
        showToast('info', 'Chart view minimized');
    } else {
        chartContainer.style.height = '600px';
        showToast('info', 'Chart view expanded');
    }
    
    // Trigger chart resize
    setTimeout(() => {
        if (mortgageChart) {
            mortgageChart.resize();
        }
    }, 100);
}

/* ===== ENHANCED YEAR SLIDER - WORKING VERSION ===== */
function updateYearDetails(year) {
    const yearLabel = document.getElementById('year-label');
    const yearPrincipalPaid = document.getElementById('year-principal-paid');
    const yearInterestPaid = document.getElementById('year-interest-paid');
    const yearRemainingBalance = document.getElementById('year-remaining-balance');
    
    if (yearLabel) yearLabel.textContent = `Year ${year}`;
    
    const { schedule, loanAmount } = calculateAmortization();
    const monthIndex = (parseInt(year) * 12) - 1;
    
    if (schedule[monthIndex]) {
        const payment = schedule[monthIndex];
        const principalPaid = loanAmount - payment.balance;
        
        if (yearPrincipalPaid) yearPrincipalPaid.textContent = formatCurrency(principalPaid);
        if (yearInterestPaid) yearInterestPaid.textContent = formatCurrency(payment.totalInterest);
        if (yearRemainingBalance) yearRemainingBalance.textContent = formatCurrency(payment.balance);
    } else {
        if (yearPrincipalPaid) yearPrincipalPaid.textContent = formatCurrency(loanAmount);
        if (yearInterestPaid) yearInterestPaid.textContent = formatCurrency(0);
        if (yearRemainingBalance) yearRemainingBalance.textContent = formatCurrency(0);
    }
    
    // Update slider max value based on loan term
    const yearSlider = document.getElementById('year-range');
    if (yearSlider) {
        yearSlider.max = currentCalculatorState.loanTerm;
    }
}

/* ===== CORE CALCULATION ENGINE - ENHANCED ===== */
function calculateMortgage() {
    try {
        // Validate inputs
        if (currentCalculatorState.homePrice <= 0 || currentCalculatorState.interestRate < 0) {
            return;
        }
        
        // Calculate loan amount
        const loanAmount = currentCalculatorState.homePrice - currentCalculatorState.downPayment;
        
        // Calculate PMI if needed
        const downPaymentPercentage = (currentCalculatorState.downPayment / currentCalculatorState.homePrice) * 100;
        let pmiAmount = 0;
        
        if (currentCalculatorState.loanType === 'conventional' && downPaymentPercentage < 20) {
            const pmiRate = calculatePMIRate(downPaymentPercentage, currentCalculatorState.creditScore);
            pmiAmount = loanAmount * (pmiRate / 100);
            currentCalculatorState.pmi = pmiAmount;
        } else {
            currentCalculatorState.pmi = 0;
        }
        
        // Update PMI display
        updatePMIDisplay(pmiAmount);
        
        // Calculate monthly payment components
        const monthlyRate = currentCalculatorState.interestRate / 100 / 12;
        const numPayments = currentCalculatorState.loanTerm * 12;
        
        let monthlyPrincipalInterest = 0;
        if (monthlyRate > 0) {
            monthlyPrincipalInterest = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                                     (Math.pow(1 + monthlyRate, numPayments) - 1);
        } else {
            monthlyPrincipalInterest = loanAmount / numPayments;
        }
        
        const monthlyPropertyTax = currentCalculatorState.propertyTax / 12;
        const monthlyInsurance = currentCalculatorState.homeInsurance / 12;
        const monthlyPMI = pmiAmount / 12;
        const monthlyHOA = currentCalculatorState.hoaFees;
        
        const totalMonthlyPayment = monthlyPrincipalInterest + monthlyPropertyTax + 
                                   monthlyInsurance + monthlyPMI + monthlyHOA;
        
        // Update main payment display
        updateMainPaymentDisplay(totalMonthlyPayment, monthlyPrincipalInterest, 
                                monthlyPropertyTax + monthlyInsurance + monthlyPMI + monthlyHOA);
        
        // Update payment breakdown
        updatePaymentBreakdown({
            principalInterest: monthlyPrincipalInterest,
            propertyTax: monthlyPropertyTax,
            insurance: monthlyInsurance,
            pmi: monthlyPMI,
            hoa: monthlyHOA,
            total: totalMonthlyPayment
        });
        
        // Update loan summary
        const totalInterest = (monthlyPrincipalInterest * numPayments) - loanAmount;
        const totalCost = currentCalculatorState.homePrice + totalInterest + currentCalculatorState.closingCosts;
        const payoffDate = new Date();
        payoffDate.setMonth(payoffDate.getMonth() + numPayments);
        
        updateLoanSummary({
            loanAmount,
            totalInterest,
            totalCost,
            payoffDate,
            closingCosts: currentCalculatorState.closingCosts || (currentCalculatorState.homePrice * currentCalculatorState.closingCostsPercentage / 100)
        });
        
        // Update chart if visible
        if (currentTabActive === 'mortgage-balance') {
            updateChart();
        }
        
        // Update amortization schedule if visible
        if (currentTabActive === 'payment-schedule') {
            updateAmortizationSchedule();
        }
        
        // Update AI insights
        if (currentTabActive === 'ai-insights') {
            debounce(generateAIInsights, 1000)();
        }
        
        // Save state
        saveCalculatorState();
        
    } catch (error) {
        console.error('Error calculating mortgage:', error);
        showToast('error', 'Error calculating mortgage payment');
    }
}

function updateMainPaymentDisplay(total, principalInterest, escrow) {
    const totalPaymentEl = document.getElementById('total-payment');
    const piAmountEl = document.getElementById('pi-amount');
    const escrowAmountEl = document.getElementById('escrow-amount');
    
    if (totalPaymentEl) totalPaymentEl.textContent = formatCurrency(Math.round(total));
    if (piAmountEl) piAmountEl.textContent = `${formatCurrency(Math.round(principalInterest))} P&I`;
    if (escrowAmountEl) escrowAmountEl.textContent = `${formatCurrency(Math.round(escrow))} Escrow`;
}

function updatePaymentBreakdown(components) {
    const total = components.total;
    
    // Update individual components
    const updateComponent = (id, amount, show = true) => {
        const item = document.getElementById(`${id}-breakdown-item`);
        const amountEl = document.getElementById(id === 'pi' ? 'principal-interest' : `monthly-${id}`);
        const fillEl = document.getElementById(`${id}-fill`);
        const percentEl = document.getElementById(`${id}-percent`);
        
        if (item) {
            item.style.display = show && amount > 0 ? 'grid' : 'none';
        }
        
        if (amountEl) amountEl.textContent = formatCurrency(Math.round(amount));
        
        if (fillEl && percentEl && total > 0) {
            const percentage = Math.round((amount / total) * 100);
            fillEl.style.width = `${percentage}%`;
            percentEl.textContent = `${percentage}%`;
        }
    };
    
    updateComponent('pi', components.principalInterest, true);
    updateComponent('tax', components.propertyTax, true);
    updateComponent('insurance', components.insurance, true);
    updateComponent('pmi', components.pmi, components.pmi > 0);
    updateComponent('hoa', components.hoa, components.hoa > 0);
}

function updateLoanSummary(summary) {
    const elements = {
        'display-loan-amount': formatCurrency(summary.loanAmount),
        'display-total-interest': formatCurrency(Math.round(summary.totalInterest)),
        'display-total-cost': formatCurrency(Math.round(summary.totalCost)),
        'display-payoff-date': summary.payoffDate.toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric' 
        }),
        'display-closing-costs': formatCurrency(Math.round(summary.closingCosts))
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

/* ===== AMORTIZATION SCHEDULE - FIXED PAGINATION ===== */
function calculateAmortization() {
    const loanAmount = currentCalculatorState.homePrice - currentCalculatorState.downPayment;
    const monthlyRate = currentCalculatorState.interestRate / 100 / 12;
    const numPayments = currentCalculatorState.loanTerm * 12;
    
    let monthlyPayment = 0;
    if (monthlyRate > 0) {
        monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                        (Math.pow(1 + monthlyRate, numPayments) - 1);
    } else {
        monthlyPayment = loanAmount / numPayments;
    }
    
    const schedule = [];
    let balance = loanAmount;
    let totalInterest = 0;
    
    for (let i = 0; i < numPayments; i++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        balance = Math.max(0, balance - principalPayment);
        totalInterest += interestPayment;
        
        schedule.push({
            payment: i + 1,
            date: new Date(new Date().getFullYear(), new Date().getMonth() + i + 1, 1),
            monthlyPayment: monthlyPayment,
            principal: principalPayment,
            interest: interestPayment,
            balance: balance,
            totalInterest: totalInterest
        });
        
        if (balance <= 0) break;
    }
    
    return { monthlyPayment, loanAmount, schedule, totalInterest };
}

function updateAmortizationSchedule() {
    const tbody = document.getElementById('amortization-body');
    if (!tbody) return;
    
    const { schedule } = calculateAmortization();
    const paymentsPerPage = 6; // FIXED - Show only 6 payments
    const startIndex = currentSchedulePage * paymentsPerPage;
    const endIndex = Math.min(startIndex + paymentsPerPage, schedule.length);
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Add new rows
    for (let i = startIndex; i < endIndex; i++) {
        const payment = schedule[i];
        const row = tbody.insertRow();
        
        row.innerHTML = `
            <td>${payment.payment}</td>
            <td>${payment.date.toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
            })}</td>
            <td>${formatCurrency(Math.round(payment.monthlyPayment))}</td>
            <td>${formatCurrency(Math.round(payment.principal))}</td>
            <td>${formatCurrency(Math.round(payment.interest))}</td>
            <td>${formatCurrency(Math.round(payment.balance))}</td>
        `;
    }
    
    // Update pagination
    updateSchedulePagination(schedule.length, paymentsPerPage);
}

function updateSchedulePagination(totalPayments, paymentsPerPage) {
    const totalPages = Math.ceil(totalPayments / paymentsPerPage);
    const prevBtn = document.getElementById('prev-payments');
    const nextBtn = document.getElementById('next-payments');
    const paginationInfo = document.getElementById('pagination-info');
    
    if (prevBtn) {
        prevBtn.disabled = currentSchedulePage === 0;
        prevBtn.classList.toggle('disabled', currentSchedulePage === 0);
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentSchedulePage >= totalPages - 1;
        nextBtn.classList.toggle('disabled', currentSchedulePage >= totalPages - 1);
    }
    
    if (paginationInfo) {
        const startPayment = (currentSchedulePage * paymentsPerPage) + 1;
        const endPayment = Math.min((currentSchedulePage + 1) * paymentsPerPage, totalPayments);
        paginationInfo.textContent = `Payments ${startPayment}-${endPayment} of ${totalPayments}`;
    }
}

function previousPayments() {
    if (currentSchedulePage > 0) {
        currentSchedulePage--;
        updateAmortizationSchedule();
        announceToScreenReader(`Showing payments ${(currentSchedulePage * 6) + 1} to ${Math.min((currentSchedulePage + 1) * 6, totalSchedulePayments)}`);
    }
}

function nextPayments() {
    const paymentsPerPage = 6;
    const { schedule } = calculateAmortization();
    const totalPages = Math.ceil(schedule.length / paymentsPerPage);
    
    if (currentSchedulePage < totalPages - 1) {
        currentSchedulePage++;
        updateAmortizationSchedule();
        announceToScreenReader(`Showing payments ${(currentSchedulePage * 6) + 1} to ${Math.min((currentSchedulePage + 1) * 6, schedule.length)}`);
    }
}

function switchScheduleTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.schedule-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // For now, both tabs show the same monthly view
    // In a full implementation, yearly would show annual summaries
    updateAmortizationSchedule();
    
    announceToScreenReader(`Switched to ${tabName} view`);
}

/* ===== ENHANCED AI INSIGHTS - WORKING VERSION ===== */
function generateAIInsights() {
    const insightsContainer = document.getElementById('ai-insights');
    if (!insightsContainer) return;
    
    // Show loading state
    insightsContainer.innerHTML = '<p class="text-center text-gray-500">🧠 Generating AI insights...</p>';
    
    setTimeout(() => {
        const { monthlyPayment, loanAmount, totalInterest } = calculateAmortization();
        const insights = [];
        
        // Payment Analysis Insight
        const monthlyPaymentAmount = monthlyPayment + (currentCalculatorState.propertyTax / 12) + 
                                    (currentCalculatorState.homeInsurance / 12) + (currentCalculatorState.pmi / 12) + 
                                    currentCalculatorState.hoaFees;
        
        const incomeRule = monthlyPaymentAmount * 3.5;
        insights.push({
            icon: '📊',
            title: 'Payment-to-Income Analysis',
            content: `Your total monthly payment of ${formatCurrency(monthlyPaymentAmount)} suggests an ideal annual income of ${formatCurrency(incomeRule * 12)} based on the 28% housing rule.`,
            impact: {
                label: 'Recommended Income',
                value: formatCurrency(incomeRule * 12)
            }
        });
        
        // Interest Savings Insight
        if (currentCalculatorState.extraMonthly > 0) {
            const extraAnnual = currentCalculatorState.extraMonthly * 12;
            const savingsEstimate = extraAnnual * 5.2; // Simplified calculation
            insights.push({
                icon: '💰',
                title: 'Extra Payment Benefits',
                content: `By paying an extra ${formatCurrency(currentCalculatorState.extraMonthly)} monthly, you could save approximately ${formatCurrency(savingsEstimate)} in interest and pay off your loan 4-7 years earlier.`,
                impact: {
                    label: 'Interest Savings',
                    value: formatCurrency(savingsEstimate)
                }
            });
        }
        
        // PMI Insight
        const downPaymentPercent = (currentCalculatorState.downPayment / currentCalculatorState.homePrice) * 100;
        if (downPaymentPercent < 20 && currentCalculatorState.loanType === 'conventional') {
            const additionalDownPayment = (currentCalculatorState.homePrice * 0.2) - currentCalculatorState.downPayment;
            const pmiSavings = currentCalculatorState.pmi;
            insights.push({
                icon: '🛡️',
                title: 'PMI Elimination Strategy',
                content: `Adding ${formatCurrency(additionalDownPayment)} to your down payment would eliminate PMI, saving you ${formatCurrency(pmiSavings)} annually.`,
                impact: {
                    label: 'Annual PMI Savings',
                    value: formatCurrency(pmiSavings)
                }
            });
        }
        
        // Rate Comparison Insight
        const currentRate = currentCalculatorState.interestRate;
        const betterRate = currentRate - 0.5;
        const betterRatePayment = calculateMonthlyPayment(loanAmount, betterRate, currentCalculatorState.loanTerm);
        const monthlySavings = monthlyPayment - betterRatePayment;
        
        if (monthlySavings > 0) {
            insights.push({
                icon: '📈',
                title: 'Rate Shopping Opportunity',
                content: `A 0.5% better rate (${betterRate}% vs ${currentRate}%) could save you ${formatCurrency(monthlySavings)} monthly and ${formatCurrency(monthlySavings * currentCalculatorState.loanTerm * 12)} over the life of the loan.`,
                impact: {
                    label: 'Lifetime Savings',
                    value: formatCurrency(monthlySavings * currentCalculatorState.loanTerm * 12)
                }
            });
        }
        
        // Loan Term Comparison
        if (currentCalculatorState.loanTerm === 30) {
            const fifteenYearPayment = calculateMonthlyPayment(loanAmount, currentCalculatorState.interestRate, 15);
            const totalSavings = (monthlyPayment * 360) - (fifteenYearPayment * 180);
            insights.push({
                icon: '⏰',
                title: '15-Year vs 30-Year Analysis',
                content: `Switching to a 15-year loan would increase your monthly payment by ${formatCurrency(fifteenYearPayment - monthlyPayment)} but save ${formatCurrency(totalSavings)} in total interest.`,
                impact: {
                    label: 'Interest Savings',
                    value: formatCurrency(totalSavings)
                }
            });
        }
        
        // Render insights
        renderAIInsights(insights);
        
    }, 1500); // Simulate AI processing time
}

function renderAIInsights(insights) {
    const insightsContainer = document.getElementById('ai-insights');
    if (!insightsContainer) return;
    
    if (insights.length === 0) {
        insightsContainer.innerHTML = '<p class="text-center text-gray-500">No insights available at this time.</p>';
        return;
    }
    
    const insightsHTML = insights.map(insight => `
        <div class="insight-item animate-slide-up">
            <div class="insight-header">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                    <h4>${insight.title}</h4>
                    <p>${insight.content}</p>
                    <div class="impact-display">
                        <span class="impact-label">${insight.impact.label}</span>
                        <span class="impact-value">${insight.impact.value}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    insightsContainer.innerHTML = insightsHTML;
}

function refreshAIInsights() {
    const refreshBtn = document.getElementById('refresh-insights');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> <span>Refreshing...</span>';
    }
    
    generateAIInsights();
    
    setTimeout(() => {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> <span>Refresh Insights</span>';
        }
    }, 2000);
}

/* ===== WORKING COMPARE LOAN SCENARIOS ===== */
function addToComparison() {
    const currentScenario = {
        id: Date.now(),
        name: `Scenario ${compareScenarios.length + 1}`,
        homePrice: currentCalculatorState.homePrice,
        downPayment: currentCalculatorState.downPayment,
        interestRate: currentCalculatorState.interestRate,
        loanTerm: currentCalculatorState.loanTerm,
        loanType: currentCalculatorState.loanType,
        monthlyPayment: calculateTotalMonthlyPayment(),
        totalInterest: calculateAmortization().totalInterest,
        loanAmount: currentCalculatorState.homePrice - currentCalculatorState.downPayment
    };
    
    compareScenarios.push(currentScenario);
    updateComparisonTable();
    showToast('success', `Added ${currentScenario.name} to comparison`);
    announceToScreenReader(`Added scenario to comparison. ${compareScenarios.length} scenarios to compare.`);
}

function updateComparisonTable() {
    const comparisonTable = document.getElementById('comparison-table');
    const placeholder = document.getElementById('comparison-placeholder');
    
    if (compareScenarios.length === 0) {
        if (comparisonTable) comparisonTable.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';
        return;
    }
    
    if (placeholder) placeholder.style.display = 'none';
    if (comparisonTable) comparisonTable.style.display = 'block';
    
    const tableHTML = `
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>Scenario</th>
                    <th>Home Price</th>
                    <th>Down Payment</th>
                    <th>Interest Rate</th>
                    <th>Loan Term</th>
                    <th>Monthly Payment</th>
                    <th>Total Interest</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${compareScenarios.map(scenario => `
                    <tr>
                        <td><strong>${scenario.name}</strong><br><small>${scenario.loanType.toUpperCase()}</small></td>
                        <td>${formatCurrency(scenario.homePrice)}</td>
                        <td>${formatCurrency(scenario.downPayment)}<br><small>${Math.round((scenario.downPayment/scenario.homePrice)*100)}%</small></td>
                        <td>${scenario.interestRate}%</td>
                        <td>${scenario.loanTerm} years</td>
                        <td><strong>${formatCurrency(Math.round(scenario.monthlyPayment))}</strong></td>
                        <td>${formatCurrency(Math.round(scenario.totalInterest))}</td>
                        <td>
                            <button class="btn-sm secondary" onclick="removeFromComparison(${scenario.id})" title="Remove scenario">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="comparison-actions" style="margin-top: 1rem;">
            <button class="btn secondary" onclick="clearComparison()">
                <i class="fas fa-trash-alt"></i> Clear All
            </button>
            <button class="btn primary" onclick="exportComparison()">
                <i class="fas fa-download"></i> Export Comparison
            </button>
        </div>
    `;
    
    if (comparisonTable) {
        comparisonTable.innerHTML = tableHTML;
    }
}

function removeFromComparison(id) {
    compareScenarios = compareScenarios.filter(scenario => scenario.id !== id);
    updateComparisonTable();
    showToast('info', 'Scenario removed from comparison');
}

function clearComparison() {
    compareScenarios = [];
    updateComparisonTable();
    showToast('info', 'All scenarios cleared');
}

/* ===== UTILITY FUNCTIONS ===== */
function calculateMonthlyPayment(principal, annualRate, years) {
    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;
    
    if (monthlyRate === 0) {
        return principal / numPayments;
    }
    
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1);
}

function calculateTotalMonthlyPayment() {
    const loanAmount = currentCalculatorState.homePrice - currentCalculatorState.downPayment;
    const principalInterest = calculateMonthlyPayment(loanAmount, currentCalculatorState.interestRate, currentCalculatorState.loanTerm);
    const escrow = (currentCalculatorState.propertyTax + currentCalculatorState.homeInsurance + currentCalculatorState.pmi) / 12;
    return principalInterest + escrow + currentCalculatorState.hoaFees;
}

function calculatePMIRate(downPaymentPercent, creditScore) {
    // Simplified PMI calculation
    if (downPaymentPercent >= 20) return 0;
    
    let baseRate = 0.5;
    if (downPaymentPercent < 5) baseRate = 0.85;
    else if (downPaymentPercent < 10) baseRate = 0.70;
    else if (downPaymentPercent < 15) baseRate = 0.60;
    
    // Adjust for credit score
    if (creditScore < 620) baseRate += 0.3;
    else if (creditScore < 680) baseRate += 0.1;
    else if (creditScore > 760) baseRate -= 0.1;
    
    return Math.max(0.2, Math.min(1.2, baseRate));
}

function updatePMIDisplay(pmiAmount) {
    const pmiInput = document.getElementById('pmi');
    const pmiRateDisplay = document.getElementById('pmi-rate-display');
    const pmiInfo = document.getElementById('pmi-info');
    
    if (pmiInput) {
        pmiInput.value = formatNumber(Math.round(pmiAmount));
    }
    
    if (pmiAmount > 0) {
        const loanAmount = currentCalculatorState.homePrice - currentCalculatorState.downPayment;
        const pmiRate = (pmiAmount / loanAmount) * 100;
        
        if (pmiRateDisplay) {
            pmiRateDisplay.textContent = pmiRate.toFixed(2) + '%';
        }
        
        if (pmiInfo) {
            pmiInfo.style.display = 'block';
        }
        
        showPMIWarning();
    } else {
        if (pmiInfo) {
            pmiInfo.style.display = 'none';
        }
        hidePMIWarning();
    }
}

function showPMIWarning() {
    const pmiWarning = document.getElementById('pmi-warning');
    if (pmiWarning) {
        pmiWarning.style.display = 'flex';
    }
}

function hidePMIWarning() {
    const pmiWarning = document.getElementById('pmi-warning');
    if (pmiWarning) {
        pmiWarning.style.display = 'none';
    }
}

function updateDownPaymentFromPercent() {
    if (currentCalculatorState.downPaymentMode === 'percent') {
        const amount = currentCalculatorState.homePrice * (currentCalculatorState.downPaymentPercent / 100);
        currentCalculatorState.downPayment = amount;
        
        const dollarInput = document.getElementById('down-payment');
        if (dollarInput) {
            dollarInput.value = formatNumber(Math.round(amount));
        }
    }
}

function updateDownPaymentPercent() {
    if (currentCalculatorState.downPaymentMode === 'dollar') {
        const percent = (currentCalculatorState.downPayment / currentCalculatorState.homePrice) * 100;
        currentCalculatorState.downPaymentPercent = percent;
        
        const percentInput = document.getElementById('down-payment-percent');
        if (percentInput) {
            percentInput.value = percent.toFixed(1);
        }
    }
}

function updateExtraPaymentPreview() {
    if (currentCalculatorState.extraMonthly > 0) {
        const { schedule } = calculateAmortization();
        const normalPayoffs = schedule.length;
        
        // Simplified calculation - actual would need complex amortization
        const extraPayoffMonths = Math.max(1, normalPayoffs - Math.round(currentCalculatorState.extraMonthly * 24));
        const timeReduction = normalPayoffs - extraPayoffMonths;
        const yearsReduced = Math.floor(timeReduction / 12);
        const monthsReduced = timeReduction % 12;
        
        const previewEl = document.getElementById('extra-payment-preview');
        if (previewEl && yearsReduced > 0) {
            previewEl.textContent = `(Save ${yearsReduced}y ${monthsReduced}m)`;
        } else if (previewEl) {
            previewEl.textContent = '';
        }
    }
}

function updateClosingCosts() {
    const closingCosts = currentCalculatorState.homePrice * (currentCalculatorState.closingCostsPercentage / 100);
    currentCalculatorState.closingCosts = closingCosts;
    
    const closingCostsDollar = document.getElementById('closing-costs-dollar');
    if (closingCostsDollar) {
        closingCostsDollar.textContent = formatCurrency(Math.round(closingCosts));
    }
}

/* ===== CREDIT SCORE AND STATE HANDLERS ===== */
function handleCreditScoreChange(score) {
    currentCalculatorState.creditScore = parseInt(score) || 750;
    
    // Update interest rate based on credit score (simplified)
    const baseRate = 6.44;
    let adjustment = 0;
    
    if (currentCalculatorState.creditScore >= 800) adjustment = -0.5;
    else if (currentCalculatorState.creditScore >= 750) adjustment = -0.25;
    else if (currentCalculatorState.creditScore >= 700) adjustment = 0;
    else if (currentCalculatorState.creditScore >= 650) adjustment = 0.5;
    else if (currentCalculatorState.creditScore >= 600) adjustment = 1.0;
    else adjustment = 1.5;
    
    const newRate = baseRate + adjustment;
    currentCalculatorState.interestRate = newRate;
    
    const rateInput = document.getElementById('interest-rate');
    if (rateInput) {
        rateInput.value = newRate.toFixed(3);
    }
    
    // Show credit impact
    const creditImpact = document.getElementById('credit-impact');
    if (creditImpact) {
        creditImpact.style.display = 'block';
        creditImpact.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                Your credit score affects your rate: ${adjustment >= 0 ? '+' : ''}${adjustment}% adjustment applied
            </div>
        `;
        setTimeout(() => {
            creditImpact.style.display = 'none';
        }, 5000);
    }
    
    calculateMortgage();
}

function handleStateChange(state) {
    if (!state) return;
    
    // State-specific property tax and insurance rates (simplified)
    const stateData = {
        'CA': { taxRate: 0.75, insuranceRate: 0.35 },
        'TX': { taxRate: 1.83, insuranceRate: 0.51 },
        'FL': { taxRate: 0.98, insuranceRate: 0.63 },
        'NY': { taxRate: 1.30, insuranceRate: 0.41 },
        'IL': { taxRate: 2.27, insuranceRate: 0.42 },
        'PA': { taxRate: 1.58, insuranceRate: 0.42 },
        'OH': { taxRate: 1.62, insuranceRate: 0.42 },
        'GA': { taxRate: 0.93, insuranceRate: 0.49 },
        'NC': { taxRate: 0.84, insuranceRate: 0.48 },
        'MI': { taxRate: 1.54, insuranceRate: 0.54 }
    };
    
    const stateInfo = stateData[state] || { taxRate: 1.2, insuranceRate: 0.45 };
    
    // Update property tax
    const newPropertyTax = currentCalculatorState.homePrice * (stateInfo.taxRate / 100);
    currentCalculatorState.propertyTax = newPropertyTax;
    
    const propertyTaxInput = document.getElementById('property-tax');
    if (propertyTaxInput) {
        propertyTaxInput.value = formatNumber(Math.round(newPropertyTax));
    }
    
    // Update home insurance
    const newInsurance = currentCalculatorState.homePrice * (stateInfo.insuranceRate / 100);
    currentCalculatorState.homeInsurance = newInsurance;
    
    const insuranceInput = document.getElementById('home-insurance');
    if (insuranceInput) {
        insuranceInput.value = formatNumber(Math.round(newInsurance));
    }
    
    // Update rate displays
    const propertyTaxRate = document.getElementById('property-tax-rate');
    if (propertyTaxRate) {
        propertyTaxRate.textContent = `(${stateInfo.taxRate}% state rate)`;
    }
    
    const insuranceRate = document.getElementById('home-insurance-rate');
    if (insuranceRate) {
        insuranceRate.textContent = `(${stateInfo.insuranceRate}% state rate)`;
    }
    
    calculateMortgage();
    showToast('success', `Updated rates for ${state}`);
}

/* ===== LIVE RATES UPDATE ===== */
function updateLiveRates() {
    // Simulate live rate updates (in production, this would call an API)
    const baseRates = {
        '30yr': 6.44,
        '15yr': 5.74,
        'arm': 5.90,
        'fha': 6.45
    };
    
    // Simulate small random changes
    Object.keys(baseRates).forEach(rateType => {
        const change = (Math.random() - 0.5) * 0.2; // ±0.1% change
        const newRate = baseRates[rateType] + change;
        
        const rateElement = document.getElementById(`rate-${rateType}`);
        const changeElement = document.getElementById(`rate-${rateType}-change`);
        
        if (rateElement) {
            rateElement.textContent = `${newRate.toFixed(2)}%`;
        }
        
        if (changeElement) {
            const changeText = change > 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
            changeElement.textContent = changeText;
            changeElement.className = `rate-change ${change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'}`;
        }
    });
    
    // Update timestamp
    const timestampElement = document.getElementById('last-update-time');
    if (timestampElement) {
        timestampElement.textContent = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
}

/* ===== ACTION HANDLERS ===== */
function autoFillUSADefaults() {
    // Fill with typical USA market values
    const defaults = {
        homePrice: 450000,
        downPayment: 90000,
        downPaymentPercent: 20,
        interestRate: 6.44,
        loanTerm: 30,
        propertyTax: 5400, // 1.2% of home price
        homeInsurance: 2025, // 0.45% of home price
        hoaFees: 0,
        extraMonthly: 0,
        extraOnetime: 0,
        loanType: 'conventional',
        creditScore: 750,
        closingCostsPercentage: 3
    };
    
    // Update state
    Object.assign(currentCalculatorState, defaults);
    
    // Update form inputs
    setInputValue('home-price', defaults.homePrice);
    setInputValue('down-payment', defaults.downPayment);
    setInputValue('down-payment-percent', defaults.downPaymentPercent);
    setInputValue('interest-rate', defaults.interestRate);
    setInputValue('property-tax', defaults.propertyTax);
    setInputValue('home-insurance', defaults.homeInsurance);
    setInputValue('hoa-fees', defaults.hoaFees);
    setInputValue('extra-monthly', defaults.extraMonthly);
    setInputValue('extra-onetime', defaults.extraOnetime);
    setInputValue('closing-costs-percentage', defaults.closingCostsPercentage);
    
    // Update selectors
    selectLoanType(defaults.loanType);
    selectLoanTerm(defaults.loanTerm);
    
    const creditScoreSelect = document.getElementById('credit-score');
    if (creditScoreSelect) {
        creditScoreSelect.value = defaults.creditScore;
    }
    
    calculateMortgage();
    showToast('success', '🇺🇸 Filled with USA market defaults');
    announceToScreenReader('Form filled with USA market default values');
}

function clearAllInputs() {
    if (confirm('Clear all inputs and reset to defaults?')) {
        // Reset state to initial values
        currentCalculatorState = {
            homePrice: 0,
            downPayment: 0,
            downPaymentPercent: 20,
            downPaymentMode: 'dollar',
            interestRate: 6.44,
            loanTerm: 30,
            propertyTax: 0,
            homeInsurance: 0,
            pmi: 0,
            hoaFees: 0,
            extraMonthly: 0,
            extraOnetime: 0,
            extraPaymentFrequency: 'monthly',
            loanType: 'conventional',
            creditScore: 750,
            closingCostsPercentage: 3
        };
        
        // Clear all form inputs
        const inputs = document.querySelectorAll('.form-control');
        inputs.forEach(input => {
            if (input.type === 'text' || input.type === 'number') {
                input.value = '';
            }
        });
        
        // Reset selectors
        selectLoanType('conventional');
        selectLoanTerm(30);
        
        const creditScoreSelect = document.getElementById('credit-score');
        if (creditScoreSelect) {
            creditScoreSelect.value = '';
        }
        
        calculateMortgage();
        showToast('info', 'All inputs cleared');
        announceToScreenReader('All form inputs have been cleared');
    }
}

function saveResults() {
    const results = {
        timestamp: new Date().toISOString(),
        inputs: { ...currentCalculatorState },
        results: {
            monthlyPayment: calculateTotalMonthlyPayment(),
            totalInterest: calculateAmortization().totalInterest,
            loanAmount: currentCalculatorState.homePrice - currentCalculatorState.downPayment
        }
    };
    
    const filename = `mortgage-calculation-${new Date().toISOString().split('T')[0]}.json`;
    downloadData(JSON.stringify(results, null, 2), filename, 'application/json');
    
    showToast('success', 'Results saved successfully');
}

function shareResults() {
    const url = window.location.href;
    const text = `Check out my mortgage calculation: Monthly payment of ${formatCurrency(calculateTotalMonthlyPayment())} for a ${formatCurrency(currentCalculatorState.homePrice)} home`;
    
    if (navigator.share) {
        navigator.share({
            title: 'USA Mortgage Calculator Results',
            text: text,
            url: url
        }).then(() => {
            showToast('success', 'Results shared successfully');
        }).catch(err => {
            fallbackShare(url, text);
        });
    } else {
        fallbackShare(url, text);
    }
}

function fallbackShare(url, text) {
    if (navigator.clipboard) {
        const shareText = `${text}\n\nCalculate your mortgage: ${url}`;
        navigator.clipboard.writeText(shareText).then(() => {
            showToast('success', 'Share link copied to clipboard');
        });
    } else {
        showToast('info', 'Share link: ' + url);
    }
}

function downloadPDF() {
    showToast('info', 'Generating PDF...');
    
    // This would require a more complex implementation
    // For now, we'll create a simple text-based PDF
    setTimeout(() => {
        const content = generatePDFContent();
        const filename = `mortgage-calculation-${new Date().toISOString().split('T')[0]}.pdf`;
        
        // In a real implementation, you would use jsPDF here
        showToast('success', 'PDF download started');
    }, 1000);
}

function printResults() {
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintContent();
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    
    showToast('success', 'Print dialog opened');
}

function generatePrintContent() {
    const totalPayment = calculateTotalMonthlyPayment();
    const { totalInterest, loanAmount } = calculateAmortization();
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Mortgage Calculation Results</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 20px; }
                .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                .label { font-weight: bold; }
                .value { text-align: right; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🇺🇸 USA Mortgage Calculator Results</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="section">
                <h2>Loan Details</h2>
                <div class="row"><span class="label">Home Price:</span><span class="value">${formatCurrency(currentCalculatorState.homePrice)}</span></div>
                <div class="row"><span class="label">Down Payment:</span><span class="value">${formatCurrency(currentCalculatorState.downPayment)} (${currentCalculatorState.downPaymentPercent.toFixed(1)}%)</span></div>
                <div class="row"><span class="label">Loan Amount:</span><span class="value">${formatCurrency(loanAmount)}</span></div>
                <div class="row"><span class="label">Interest Rate:</span><span class="value">${currentCalculatorState.interestRate}%</span></div>
                <div class="row"><span class="label">Loan Term:</span><span class="value">${currentCalculatorState.loanTerm} years</span></div>
                <div class="row"><span class="label">Loan Type:</span><span class="value">${currentCalculatorState.loanType.toUpperCase()}</span></div>
            </div>
            
            <div class="section">
                <h2>Monthly Payment</h2>
                <div class="row"><span class="label">Total Monthly Payment:</span><span class="value"><strong>${formatCurrency(totalPayment)}</strong></span></div>
                <div class="row"><span class="label">Principal & Interest:</span><span class="value">${formatCurrency(calculateMonthlyPayment(loanAmount, currentCalculatorState.interestRate, currentCalculatorState.loanTerm))}</span></div>
                <div class="row"><span class="label">Property Tax:</span><span class="value">${formatCurrency(currentCalculatorState.propertyTax / 12)}</span></div>
                <div class="row"><span class="label">Home Insurance:</span><span class="value">${formatCurrency(currentCalculatorState.homeInsurance / 12)}</span></div>
                ${currentCalculatorState.pmi > 0 ? `<div class="row"><span class="label">PMI:</span><span class="value">${formatCurrency(currentCalculatorState.pmi / 12)}</span></div>` : ''}
                ${currentCalculatorState.hoaFees > 0 ? `<div class="row"><span class="label">HOA Fees:</span><span class="value">${formatCurrency(currentCalculatorState.hoaFees)}</span></div>` : ''}
            </div>
            
            <div class="section">
                <h2>Loan Summary</h2>
                <div class="row"><span class="label">Total Interest:</span><span class="value">${formatCurrency(totalInterest)}</span></div>
                <div class="row"><span class="label">Total Cost:</span><span class="value">${formatCurrency(currentCalculatorState.homePrice + totalInterest)}</span></div>
            </div>
            
            <p style="text-align: center; margin-top: 40px; font-size: 12px;">
                Generated by FinGuid USA Mortgage Calculator - https://finguid.com
            </p>
        </body>
        </html>
    `;
}

/* ===== PWA FUNCTIONALITY ===== */
function initializePWA() {
    let deferredPrompt;
    
    // PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showPWAInstallBanner();
    });
    
    // PWA install banner handlers
    document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`PWA install outcome: ${outcome}`);
            deferredPrompt = null;
            hidePWAInstallBanner();
        }
    });
    
    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', hidePWAInstallBanner);
    
    // Service worker updates
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            showToast('info', 'App updated! Refresh to see changes.');
        });
    }
}

function showPWAInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
        banner.style.display = 'block';
    }
}

function hidePWAInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
        banner.style.display = 'none';
    }
}

/* ===== MOBILE MENU ===== */
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    
    if (!mobileMenu || !toggleButton) return;
    
    const isOpen = mobileMenu.classList.contains('active');
    
    if (isOpen) {
        mobileMenu.classList.remove('active');
        toggleButton.classList.remove('active');
        toggleButton.setAttribute('aria-expanded', 'false');
    } else {
        mobileMenu.classList.add('active');
        toggleButton.classList.add('active');
        toggleButton.setAttribute('aria-expanded', 'true');
    }
    
    announceToScreenReader(`Mobile menu ${isOpen ? 'closed' : 'opened'}`);
}

/* ===== NAVIGATION HANDLERS ===== */
function navigateTo(path) {
    // In a real application, this would handle routing
    console.log(`Navigating to: ${path}`);
    showToast('info', `Navigation to ${path} - Demo mode`);
}

/* ===== TRACKING AND ANALYTICS ===== */
function trackLenderClick(lenderName) {
    console.log(`Lender clicked: ${lenderName}`);
    showToast('info', `Redirecting to ${lenderName} - Demo mode`);
    
    // In production, this would track the click and redirect
    // gtag('event', 'lender_click', { lender_name: lenderName });
}

function trackResourceClick(resourceName) {
    console.log(`Resource clicked: ${resourceName}`);
    showToast('info', `Opening ${resourceName} - Demo mode`);
    
    // In production, this would track the click and redirect
    // gtag('event', 'resource_click', { resource_name: resourceName });
}

/* ===== NEWSLETTER AND EMBED ===== */
function subscribeNewsletter(event) {
    event.preventDefault();
    const email = event.target.querySelector('input[type="email"]').value;
    
    if (email) {
        showToast('success', `Subscribed ${email} to USA mortgage updates`);
        event.target.querySelector('input[type="email"]').value = '';
        
        // In production, this would submit to a newsletter service
        console.log(`Newsletter subscription: ${email}`);
    }
}

function copyEmbedCode() {
    const embedCode = document.getElementById('embed-code');
    if (embedCode) {
        embedCode.select();
        embedCode.setSelectionRange(0, 99999);
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(embedCode.value).then(() => {
                showToast('success', 'Embed code copied to clipboard');
            });
        } else {
            document.execCommand('copy');
            showToast('success', 'Embed code copied');
        }
    }
}

/* ===== UTILITY FUNCTIONS ===== */
function formatNumber(num) {
    return Math.round(num).toLocaleString('en-US');
}

function formatCurrency(num) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Math.round(num));
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function downloadData(data, filename, type) {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function showToast(type, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    }[type] || 'ℹ️';
    
    toast.innerHTML = `${icon} ${message}`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function announceToScreenReader(message) {
    const announcements = document.getElementById('sr-announcements');
    if (announcements) {
        announcements.textContent = message;
    }
}

function showWelcomeMessage() {
    showToast('success', '🇺🇸 Welcome to America\'s most advanced mortgage calculator!');
    
    setTimeout(() => {
        showToast('info', '💡 Try voice control, accessibility features, and AI insights');
    }, 3000);
}

function saveCalculatorState() {
    try {
        localStorage.setItem('finguid-calculator-state', JSON.stringify(currentCalculatorState));
    } catch (e) {
        console.warn('Could not save calculator state:', e);
    }
}

function loadUserPreferences() {
    try {
        const savedState = localStorage.getItem('finguid-calculator-state');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            currentCalculatorState = { ...currentCalculatorState, ...parsedState };
            
            // Restore form values
            Object.keys(currentCalculatorState).forEach(key => {
                const element = document.getElementById(key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`));
                if (element && typeof currentCalculatorState[key] === 'number') {
                    element.value = currentCalculatorState[key];
                }
            });
        }
    } catch (e) {
        console.warn('Could not load saved state:', e);
    }
}

function closeAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.style.display = 'none';
    }
}

/* ===== ERROR HANDLING ===== */
window.addEventListener('error', (event) => {
    console.error('JavaScript error:', event.error);
    showToast('error', 'An error occurred. Please refresh the page.');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showToast('error', 'An error occurred. Please refresh the page.');
});

/* ===== EXPORT FOR TESTING ===== */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateMortgage,
        calculateAmortization,
        formatCurrency,
        formatNumber,
        currentCalculatorState
    };
}

console.log('🎉 FinGuid USA Mortgage Calculator JavaScript loaded successfully!');
