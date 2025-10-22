// mortgage-calculator-pro.js - Enhanced with all improvements

/**
 * HOME LOAN PRO — AI‑POWERED MORTGAGE CALCULATOR - PRODUCTION JS v2.0
 * COMPLETE WITH ALL REQUIREMENTS IMPLEMENTED
 * Your FRED API Key: 9c6c421f077f2091e8bae4f143ada59a
 * © 2025 FinGuid - World's First AI Calculator Platform for Americans
 */

/* ========================================================================== */
/* GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const MORTGAGE_CALCULATOR = {
    VERSION: '2.0',
    DEBUG: false,
    
    // FRED API Configuration
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    RATE_UPDATE_INTERVAL: 60 * 60 * 1000, // 1 hour
    
    // Chart instances for cleanup
    charts: {
        paymentComponents: null,
        mortgageTimeline: null
    },
    
    // Current calculation state
    currentCalculation: {
        homePrice: 450000,
        downPayment: 90000,
        downPaymentPercent: 20,
        loanAmount: 360000,
        interestRate: 6.44,
        loanTerm: 30,
        loanType: 'conventional',
        propertyTax: 9000,
        homeInsurance: 1800,
        pmi: 0,
        hoaFees: 0,
        extraMonthly: 0,
        oneTimeExtra: 0,
        oneTimeDate: null,
        monthlyPayment: 0,
        totalInterest: 0,
        totalCost: 0,
        closingCostsPercent: 3
    },
    
    // Amortization schedule
    amortizationSchedule: [],
    scheduleCurrentPage: 0,
    scheduleItemsPerPage: 12,
    scheduleType: 'monthly',
    
    // UI state
    currentTheme: 'light',
    fontScaleOptions: [0.75, 0.875, 1, 1.125, 1.25],
    currentFontScaleIndex: 2,
    voiceEnabled: false,
    screenReaderMode: false,
    speechSynthesis: null,
    
    // Rate update tracking
    lastRateUpdate: 0,
    rateUpdateAttempts: 0,
    maxRateUpdateAttempts: 3
};

/* ========================================================================== */
/* INITIALIZATION */
/* ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🇺🇸 FinGuid Home Loan Pro — AI‑Powered Mortgage Calculator v2.0');
    
    // Initialize core components
    ZIP_DATABASE.initialize();
    populateStates();
    setupEventListeners();
    loadUserPreferences();
    showPWAInstallPrompt();
    
    // Start FRED API automatic updates
    fredAPI.startAutomaticUpdates();
    
    // Set default tab views
    showTab('payment-components');
    
    // Initialize speech synthesis for screen reader
    if ('speechSynthesis' in window) {
        MORTGAGE_CALCULATOR.speechSynthesis = window.speechSynthesis;
    }
    
    // Initial calculation
    updateCalculations();
    
    // Initialize year slider
    const yearSlider = document.getElementById('year-range');
    if (yearSlider) {
        yearSlider.value = Math.floor(MORTGAGE_CALCULATOR.currentCalculation.loanTerm / 2);
        updateYearDetails();
    }
    
    console.log('✅ Calculator initialized successfully with all features!');
});

/* ========================================================================== */
/* MORTGAGE CALCULATION ENGINE - ENHANCED */
/* ========================================================================== */

function calculateMortgage() {
    try {
        const inputs = gatherInputs();
        
        // Update current calculation
        Object.assign(MORTGAGE_CALCULATOR.currentCalculation, inputs);
        
        // Calculate PMI automatically
        calculatePMI(inputs);
        
        // Calculate monthly payment components
        const monthlyPI = calculateMonthlyPI(inputs.loanAmount, inputs.interestRate, inputs.loanTerm);
        const monthlyTax = inputs.propertyTax / 12;
        const monthlyInsurance = inputs.homeInsurance / 12;
        const monthlyPMI = inputs.pmi / 12;
        const monthlyHOA = parseFloat(inputs.hoaFees) || 0;
        
        // Total monthly payment
        const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA;
        
        // Calculate totals with extra payments
        const calculationResult = calculateAmortizationWithExtras(inputs, monthlyPI);
        const totalInterest = calculationResult.totalInterest;
        const totalCost = inputs.homePrice + totalInterest;
        
        // Update calculation object
        MORTGAGE_CALCULATOR.currentCalculation.monthlyPayment = totalMonthly;
        MORTGAGE_CALCULATOR.currentCalculation.totalInterest = totalInterest;
        MORTGAGE_CALCULATOR.currentCalculation.totalCost = totalCost;
        
        // Update UI
        updatePaymentDisplay({
            monthlyPI,
            monthlyTax,
            monthlyInsurance,
            monthlyPMI,
            monthlyHOA,
            totalMonthly,
            totalInterest,
            totalCost,
            ...inputs
        });
        
        // Generate amortization schedule
        generateAmortizationSchedule();
        
        // Update charts
        updatePaymentComponentsChart();
        updateMortgageTimelineChart();
        
        // Update AI insights
        generateAIInsights();
        
        // Announce to screen readers
        announceToScreenReader(`Payment calculated: ${formatCurrency(totalMonthly)} per month`);
        
    } catch (error) {
        console.error('Calculation error:', error);
        showToast('❌ Calculation error occurred', 'error');
    }
}

function calculateAmortizationWithExtras(inputs, monthlyPI) {
    const monthlyRate = inputs.interestRate / 100 / 12;
    const totalPayments = inputs.loanTerm * 12;
    let remainingBalance = inputs.loanAmount;
    let totalInterest = 0;
    
    const oneTimeDate = document.getElementById('one-time-date')?.value;
    const oneTimeExtra = parseCurrency(document.getElementById('one-time-extra')?.value) || 0;
    
    // Calculate one-time payment month
    let oneTimeMonth = -1;
    if (oneTimeDate && oneTimeExtra > 0) {
        const today = new Date();
        const paymentDate = new Date(oneTimeDate);
        const monthsDiff = (paymentDate.getFullYear() - today.getFullYear()) * 12 + 
                          (paymentDate.getMonth() - today.getMonth());
        oneTimeMonth = Math.max(1, Math.min(monthsDiff, totalPayments));
    }
    
    for (let month = 1; month <= totalPayments; month++) {
        const interestPayment = remainingBalance * monthlyRate;
        let principalPayment = monthlyPI - interestPayment;
        
        // Add monthly extra payment
        principalPayment += inputs.extraMonthly;
        
        // Add one-time extra payment if applicable
        if (month === oneTimeMonth) {
            principalPayment += oneTimeExtra;
        }
        
        totalInterest += interestPayment;
        remainingBalance -= principalPayment;
        
        if (remainingBalance <= 0) {
            remainingBalance = 0;
            break;
        }
    }
    
    return { totalInterest, finalBalance: remainingBalance };
}

function gatherInputs() {
    return {
        homePrice: parseCurrency(document.getElementById('home-price')?.value) || 450000,
        downPayment: parseCurrency(document.getElementById('down-payment')?.value) || 90000,
        downPaymentPercent: parseFloat(document.getElementById('down-payment-percent')?.value) || 20,
        loanAmount: 0, // Calculated below
        interestRate: parseFloat(document.getElementById('interest-rate')?.value) || 6.44,
        loanTerm: parseInt(document.getElementById('custom-term')?.value) || 
                  parseInt(document.querySelector('.term-chip.active')?.dataset.term) || 30,
        loanType: document.querySelector('.loan-type-btn.active')?.dataset.loanType || 'conventional',
        propertyTax: parseCurrency(document.getElementById('property-tax')?.value) || 9000,
        homeInsurance: parseCurrency(document.getElementById('home-insurance')?.value) || 1800,
        pmi: parseCurrency(document.getElementById('pmi')?.value) || 0,
        hoaFees: parseCurrency(document.getElementById('hoa-fees')?.value) || 0,
        extraMonthly: parseCurrency(document.getElementById('extra-monthly')?.value) || 0,
        oneTimeExtra: parseCurrency(document.getElementById('one-time-extra')?.value) || 0,
        oneTimeDate: document.getElementById('one-time-date')?.value || null,
        closingCostsPercent: parseFloat(document.getElementById('closing-costs-percentage')?.value) || 3
    };
}

/* ========================================================================== */
/* PAYMENT COMPONENTS CHART - DONUT CHART */
/* ========================================================================== */

function updatePaymentComponentsChart() {
    const canvas = document.getElementById('payment-components-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const calculation = MORTGAGE_CALCULATOR.currentCalculation;
    
    // Destroy existing chart if it exists
    if (MORTGAGE_CALCULATOR.charts.paymentComponents) {
        MORTGAGE_CALCULATOR.charts.paymentComponents.destroy();
    }
    
    const monthlyPI = calculateMonthlyPI(calculation.loanAmount, calculation.interestRate, calculation.loanTerm);
    const monthlyTax = calculation.propertyTax / 12;
    const monthlyInsurance = calculation.homeInsurance / 12;
    const monthlyPMI = calculation.pmi / 12;
    const monthlyHOA = parseFloat(calculation.hoaFees) || 0;
    
    const data = [
        { label: 'Principal & Interest', value: monthlyPI, color: '#0D9488' },
        { label: 'Property Tax', value: monthlyTax, color: '#059669' },
        { label: 'Home Insurance', value: monthlyInsurance, color: '#DC2626' }
    ];
    
    if (monthlyPMI > 0) {
        data.push({ label: 'PMI', value: monthlyPMI, color: '#D97706' });
    }
    
    if (monthlyHOA > 0) {
        data.push({ label: 'HOA Fees', value: monthlyHOA, color: '#7C3AED' });
    }
    
    MORTGAGE_CALCULATOR.charts.paymentComponents = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(item => item.label),
            datasets: [{
                data: data.map(item => item.value),
                backgroundColor: data.map(item => item.color),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}

/* ========================================================================== */
/* MORTGAGE TIMELINE CHART - ENHANCED */
/* ========================================================================== */

function updateMortgageTimelineChart() {
    const canvas = document.getElementById('mortgage-timeline-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (MORTGAGE_CALCULATOR.charts.mortgageTimeline) {
        MORTGAGE_CALCULATOR.charts.mortgageTimeline.destroy();
    }
    
    const schedule = MORTGAGE_CALCULATOR.amortizationSchedule;
    const calculation = MORTGAGE_CALCULATOR.currentCalculation;
    
    // Prepare data for chart (yearly snapshots)
    const years = [];
    const remainingBalance = [];
    const principalPaid = [];
    const interestPaid = [];
    
    let cumulativePrincipal = 0;
    let cumulativeInterest = 0;
    
    for (let year = 0; year <= calculation.loanTerm; year++) {
        const monthIndex = year * 12 - 1; // End of year
        
        if (year === 0) {
            // Starting point
            years.push(year);
            remainingBalance.push(calculation.loanAmount);
            principalPaid.push(0);
            interestPaid.push(0);
        } else if (monthIndex < schedule.length) {
            const payment = schedule[monthIndex];
            
            // Calculate cumulative principal and interest for this year
            const startMonth = (year - 1) * 12;
            const endMonth = Math.min(year * 12, schedule.length);
            
            let yearPrincipal = 0;
            let yearInterest = 0;
            
            for (let m = startMonth; m < endMonth; m++) {
                if (schedule[m]) {
                    yearPrincipal += schedule[m].principal;
                    yearInterest += schedule[m].interest;
                }
            }
            
            cumulativePrincipal += yearPrincipal;
            cumulativeInterest += yearInterest;
            
            years.push(year);
            remainingBalance.push(payment.balance);
            principalPaid.push(cumulativePrincipal);
            interestPaid.push(cumulativeInterest);
        }
    }
    
    // Update chart info with current values
    updateChartInfo();
    
    // Create the chart
    MORTGAGE_CALCULATOR.charts.mortgageTimeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years.map(y => `Year ${y}`),
            datasets: [{
                label: 'Remaining Balance',
                data: remainingBalance,
                borderColor: '#0D9488',
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                fill: true,
                tension: 0.1,
                borderWidth: 3
            }, {
                label: 'Principal Paid',
                data: principalPaid,
                borderColor: '#059669',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                fill: true,
                tension: 0.1,
                borderWidth: 2
            }, {
                label: 'Interest Paid',
                data: interestPaid,
                borderColor: '#DC2626',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                fill: true,
                tension: 0.1,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Years'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Amount ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

/* ========================================================================== */
/* YEAR DETAILS UPDATER - ENHANCED */
/* ========================================================================== */

function updateYearDetails() {
    const yearSlider = document.getElementById('year-range');
    const yearLabel = document.getElementById('year-label');
    const principalPaid = document.getElementById('principal-paid');
    const interestPaid = document.getElementById('interest-paid');
    const remainingBalance = document.getElementById('remaining-balance');
    
    if (!yearSlider) return;
    
    const year = parseInt(yearSlider.value);
    const schedule = MORTGAGE_CALCULATOR.amortizationSchedule;
    
    // Set slider max to loan term
    const maxYear = MORTGAGE_CALCULATOR.currentCalculation.loanTerm;
    yearSlider.max = maxYear;
    
    // Calculate cumulative values up to selected year
    let cumulativePrincipal = 0;
    let cumulativeInterest = 0;
    let balance = MORTGAGE_CALCULATOR.currentCalculation.loanAmount;
    
    const monthIndex = Math.min(year * 12 - 1, schedule.length - 1);
    
    if (monthIndex >= 0 && schedule[monthIndex]) {
        // Sum up to the selected year
        for (let i = 0; i <= monthIndex; i++) {
            if (schedule[i]) {
                cumulativePrincipal += schedule[i].principal;
                cumulativeInterest += schedule[i].interest;
            }
        }
        balance = schedule[monthIndex].balance;
    }
    
    // Update display
    if (yearLabel) {
        yearLabel.textContent = `Year ${year}`;
    }
    
    if (principalPaid) {
        principalPaid.textContent = formatCurrency(cumulativePrincipal);
    }
    
    if (interestPaid) {
        interestPaid.textContent = formatCurrency(cumulativeInterest);
    }
    
    if (remainingBalance) {
        remainingBalance.textContent = formatCurrency(balance);
    }
}

/* ========================================================================== */
/* AI INSIGHTS GENERATION - ENHANCED & DYNAMIC */
/* ========================================================================== */

function generateAIInsights() {
    const calculation = MORTGAGE_CALCULATOR.currentCalculation;
    const insights = [];
    
    // Down payment analysis
    const downPaymentPercent = (calculation.downPayment / calculation.homePrice) * 100;
    if (downPaymentPercent >= 20) {
        insights.push({
            type: 'success',
            icon: '🎯',
            title: 'Down Payment Analysis',
            text: `Your ${downPaymentPercent.toFixed(1)}% down payment eliminates PMI, saving you ${formatCurrency(calculation.pmi)} annually. Great choice for building equity faster!`
        });
    } else {
        const additionalDown = calculation.homePrice * 0.2 - calculation.downPayment;
        insights.push({
            type: 'warning',
            icon: '💰',
            title: 'PMI Opportunity',
            text: `Increasing your down payment by ${formatCurrency(additionalDown)} to reach 20% would eliminate ${formatCurrency(calculation.pmi/12)}/month PMI, saving ${formatCurrency(calculation.pmi)} annually.`
        });
    }
    
    // Extra payment analysis
    const extraMonthly = calculation.extraMonthly;
    if (extraMonthly === 0 && calculation.oneTimeExtra === 0) {
        const extraPayment = 100;
        const interestSavings = calculateInterestSavings(extraPayment);
        const timeSavings = calculateTimeSavings(extraPayment);
        
        insights.push({
            type: 'info',
            icon: '💡',
            title: 'Smart Savings Opportunity',
            text: `Adding just ${formatCurrency(extraPayment)} extra monthly payment could save you ${formatCurrency(interestSavings)} in interest and pay off your loan ${timeSavings} years earlier!`
        });
    } else {
        const totalExtra = extraMonthly + (calculation.oneTimeExtra > 0 ? calculation.oneTimeExtra / calculation.loanTerm / 12 : 0);
        const interestSavings = calculateInterestSavings(totalExtra);
        const timeSavings = calculateTimeSavings(totalExtra);
        
        insights.push({
            type: 'success',
            icon: '🚀',
            title: 'Excellent Strategy',
            text: `Your extra payments will save approximately ${formatCurrency(interestSavings)} in interest and pay off your loan ${timeSavings} years earlier. Keep it up!`
        });
    }
    
    // Rate analysis based on credit score
    const creditScore = parseInt(document.getElementById('credit-score')?.value) || 700;
    const currentRate = calculation.interestRate;
    
    if (creditScore >= 740 && currentRate > 6.0) {
        insights.push({
            type: 'warning',
            icon: '📈',
            title: 'Rate Optimization',
            text: `With your excellent credit score (${creditScore}), you may qualify for rates 0.25-0.5% lower than your current ${currentRate}%. Consider shopping around with different lenders.`
        });
    } else if (creditScore < 680 && currentRate < 7.0) {
        insights.push({
            type: 'info',
            icon: '🎯',
            title: 'Credit Improvement',
            text: `Improving your credit score from ${creditScore} to 700+ could save you ${formatCurrency(calculateRateSavings(0.5))}/month on your mortgage payment.`
        });
    }
    
    // Loan term analysis
    if (calculation.loanTerm === 30) {
        const payment15yr = calculateMonthlyPI(calculation.loanAmount, calculation.interestRate, 15);
        const interestSavings15yr = (calculation.totalInterest - (payment15yr * 15 * 12 - calculation.loanAmount));
        
        insights.push({
            type: 'info',
            icon: '⏰',
            title: 'Loan Term Consideration',
            text: `A 15-year loan would increase your monthly payment to ${formatCurrency(payment15yr)} but save you ${formatCurrency(interestSavings15yr)} in total interest.`
        });
    }
    
    // Property tax analysis
    const propertyTaxRate = (calculation.propertyTax / calculation.homePrice) * 100;
    if (propertyTaxRate > 2) {
        insights.push({
            type: 'warning',
            icon: '🏠',
            title: 'High Property Tax Area',
            text: `Your property tax rate of ${propertyTaxRate.toFixed(2)}% is above the national average (1.1%). Consider this in your long-term budgeting.`
        });
    }
    
    // Update UI
    updateAIInsightsDisplay(insights);
}

/* ========================================================================== */
/* PAYMENT SCHEDULE - ENHANCED WITH ALL COMPONENTS */
/* ========================================================================== */

function generateAmortizationSchedule() {
    const calculation = MORTGAGE_CALCULATOR.currentCalculation;
    const schedule = [];
    
    const monthlyRate = calculation.interestRate / 100 / 12;
    const monthlyPI = calculateMonthlyPI(calculation.loanAmount, calculation.interestRate, calculation.loanTerm);
    const monthlyTax = calculation.propertyTax / 12;
    const monthlyInsurance = calculation.homeInsurance / 12;
    const monthlyPMI = calculation.pmi / 12;
    const monthlyHOA = parseFloat(calculation.hoaFees) || 0;
    const extraMonthly = calculation.extraMonthly;
    
    let remainingBalance = calculation.loanAmount;
    const startDate = new Date();
    
    // Calculate one-time payment details
    const oneTimeDate = document.getElementById('one-time-date')?.value;
    const oneTimeExtra = parseCurrency(document.getElementById('one-time-extra')?.value) || 0;
    let oneTimeMonth = -1;
    
    if (oneTimeDate && oneTimeExtra > 0) {
        const paymentDate = new Date(oneTimeDate);
        const monthsDiff = (paymentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (paymentDate.getMonth() - startDate.getMonth());
        oneTimeMonth = Math.max(1, Math.min(monthsDiff, calculation.loanTerm * 12));
    }
    
    for (let month = 1; month <= calculation.loanTerm * 12; month++) {
        const interestPayment = remainingBalance * monthlyRate;
        let principalPayment = monthlyPI - interestPayment;
        let extraPayment = extraMonthly;
        
        // Add one-time extra payment if applicable
        if (month === oneTimeMonth) {
            extraPayment += oneTimeExtra;
        }
        
        principalPayment += extraPayment;
        remainingBalance -= principalPayment;
        
        // Ensure remaining balance doesn't go negative
        if (remainingBalance < 0) {
            principalPayment += remainingBalance; // Adjust principal payment
            remainingBalance = 0;
        }
        
        const totalPayment = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA + extraPayment;
        const paymentDate = new Date(startDate.getFullYear(), startDate.getMonth() + month - 1, 1);
        
        schedule.push({
            payment: month,
            date: paymentDate,
            paymentAmount: totalPayment,
            principal: principalPayment,
            interest: interestPayment,
            tax: monthlyTax,
            insurance: monthlyInsurance,
            pmi: monthlyPMI,
            hoa: monthlyHOA,
            extra: extraPayment,
            balance: remainingBalance
        });
        
        if (remainingBalance <= 0) break;
    }
    
    MORTGAGE_CALCULATOR.amortizationSchedule = schedule;
    updateScheduleDisplay();
}

/* ========================================================================== */
/* VOICE CONTROL - ENHANCED WITH ALL COMMANDS */
/* ========================================================================== */

function processVoiceCommand(command) {
    console.log('Processing voice command:', command);
    
    // Help commands
    if (command.includes('help') || command.includes('commands')) {
        const helpText = "Available voice commands: Set home price, set down payment, set interest rate, set loan term, calculate mortgage, switch theme, increase font, decrease font, export PDF, show schedule, show chart, show insights, read results";
        speakText(helpText);
        showToast('🎙️ Voice commands available - check screen reader for full list', 'info');
        return;
    }
    
    // Home price commands
    if (command.includes('home price') || command.includes('house price')) {
        const price = extractNumber(command);
        if (price) {
            const homePriceInput = document.getElementById('home-price');
            if (homePriceInput) {
                homePriceInput.value = formatCurrencyInput(price);
                updateCalculations();
                speakText(`Home price set to ${formatCurrency(price)}`);
                showToast(`🏠 Home price set to ${formatCurrency(price)}`, 'success');
            }
        }
        return;
    }
    
    // Down payment commands
    if (command.includes('down payment')) {
        const amount = extractNumber(command);
        if (amount) {
            const downPaymentInput = document.getElementById('down-payment');
            if (downPaymentInput) {
                downPaymentInput.value = formatCurrencyInput(amount);
                syncDownPaymentDollar();
                speakText(`Down payment set to ${formatCurrency(amount)}`);
                showToast(`💰 Down payment set to ${formatCurrency(amount)}`, 'success');
            }
        }
        return;
    }
    
    // Interest rate commands
    if (command.includes('interest rate') || command.includes('rate')) {
        const rate = extractNumber(command);
        if (rate && rate > 0 && rate < 20) {
            const rateInput = document.getElementById('interest-rate');
            if (rateInput) {
                rateInput.value = rate.toFixed(2);
                updateCalculations();
                speakText(`Interest rate set to ${rate} percent`);
                showToast(`📈 Interest rate set to ${rate}%`, 'success');
            }
        }
        return;
    }
    
    // Loan term commands
    if (command.includes('loan term') || command.includes('term')) {
        const term = extractNumber(command);
        if (term && term >= 5 && term <= 40) {
            selectTerm(term);
            speakText(`Loan term set to ${term} years`);
            showToast(`⏰ Loan term set to ${term} years`, 'success');
        }
        return;
    }
    
    // Theme commands
    if (command.includes('dark mode') || command.includes('dark theme')) {
        if (MORTGAGE_CALCULATOR.currentTheme !== 'dark') {
            toggleTheme();
        }
        return;
    }
    
    if (command.includes('light mode') || command.includes('light theme')) {
        if (MORTGAGE_CALCULATOR.currentTheme !== 'light') {
            toggleTheme();
        }
        return;
    }
    
    // Font size commands
    if (command.includes('bigger font') || command.includes('increase font') || command.includes('larger text')) {
        adjustFontSize('increase');
        return;
    }
    
    if (command.includes('smaller font') || command.includes('decrease font') || command.includes('smaller text')) {
        adjustFontSize('decrease');
        return;
    }
    
    // Calculate command
    if (command.includes('calculate') || command.includes('update') || command.includes('recalculate')) {
        updateCalculations();
        const payment = MORTGAGE_CALCULATOR.currentCalculation.monthlyPayment;
        speakText(`Monthly payment calculated: ${formatCurrency(payment)}`);
        showToast(`🧮 Payment calculated: ${formatCurrency(payment)}`, 'success');
        return;
    }
    
    // Read results command
    if (command.includes('read results') || command.includes('speak results') || command.includes('tell me results')) {
        readResultsAloud();
        return;
    }
    
    // Export commands
    if (command.includes('export') || command.includes('download')) {
        if (command.includes('pdf')) {
            downloadPDF();
            return;
        }
        if (command.includes('csv')) {
            exportSchedule('csv');
            return;
        }
    }
    
    // Tab navigation commands
    if (command.includes('show schedule') || command.includes('payment schedule')) {
        showTab('payment-schedule');
        speakText('Showing payment schedule');
        return;
    }
    
    if (command.includes('show chart') || command.includes('mortgage chart')) {
        showTab('mortgage-chart');
        speakText('Showing mortgage chart');
        return;
    }
    
    if (command.includes('ai insights') || command.includes('insights')) {
        showTab('ai-insights');
        speakText('Showing AI insights');
        return;
    }
    
    if (command.includes('payment breakdown') || command.includes('payment components')) {
        showTab('payment-components');
        speakText('Showing payment breakdown');
        return;
    }
    
    // Default response for unrecognized commands
    speakText("Command not recognized. Say help for available commands.");
    showToast('🎙️ Command not recognized. Say "help" for available commands.', 'info');
}

function readResultsAloud() {
    const calculation = MORTGAGE_CALCULATOR.currentCalculation;
    const text = `Your mortgage calculation results: 
        Monthly payment: ${formatCurrency(calculation.monthlyPayment)}.
        Loan amount: ${formatCurrency(calculation.loanAmount)}.
        Interest rate: ${calculation.interestRate} percent.
        Total interest: ${formatCurrency(calculation.totalInterest)}.
        Total cost: ${formatCurrency(calculation.totalCost)}.
        Loan term: ${calculation.loanTerm} years.`;
    
    speakText(text);
    showToast('🔊 Reading results aloud', 'info');
}

function speakText(text) {
    if (MORTGAGE_CALCULATOR.speechSynthesis && MORTGAGE_CALCULATOR.screenReaderMode) {
        // Cancel any ongoing speech
        MORTGAGE_CALCULATOR.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        MORTGAGE_CALCULATOR.speechSynthesis.speak(utterance);
    }
}

/* ========================================================================== */
/* SCREEN READER MODE - ENHANCED WITH TEXT-TO-SPEECH */
/* ========================================================================== */

function toggleScreenReader() {
    const readerBtn = document.getElementById('reader-toggle');
    MORTGAGE_CALCULATOR.screenReaderMode = !MORTGAGE_CALCULATOR.screenReaderMode;
    
    if (readerBtn) {
        if (MORTGAGE_CALCULATOR.screenReaderMode) {
            readerBtn.classList.add('active');
            readerBtn.setAttribute('aria-pressed', 'true');
            document.body.classList.add('screen-reader-active');
            
            // Test speech synthesis
            if (MORTGAGE_CALCULATOR.speechSynthesis) {
                speakText("Screen reader mode activated. I will read important information aloud.");
            }
        } else {
            readerBtn.classList.remove('active');
            readerBtn.setAttribute('aria-pressed', 'false');
            document.body.classList.remove('screen-reader-active');
            
            // Stop any ongoing speech
            if (MORTGAGE_CALCULATOR.speechSynthesis) {
                MORTGAGE_CALCULATOR.speechSynthesis.cancel();
            }
        }
    }
    
    // Store preference
    localStorage.setItem('screenReaderMode', MORTGAGE_CALCULATOR.screenReaderMode.toString());
    
    const status = MORTGAGE_CALCULATOR.screenReaderMode ? 'enabled' : 'disabled';
    showToast(`🔊 Screen reader mode ${status}`, 'info');
    announceToScreenReader(`Screen reader mode ${status}`);
}

/* ========================================================================== */
/* THEME TOGGLE - FIXED */
/* ========================================================================== */

function toggleTheme() {
    const html = document.documentElement;
    const themeBtn = document.getElementById('theme-toggle');
    const themeIcon = themeBtn?.querySelector('.theme-icon');
    const themeLabel = themeBtn?.querySelector('.control-label');
    
    // Toggle theme
    const currentTheme = html.getAttribute('data-color-scheme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    html.setAttribute('data-color-scheme', newTheme);
    MORTGAGE_CALCULATOR.currentTheme = newTheme;
    
    // Update button state
    if (themeBtn) {
        themeBtn.classList.toggle('active');
        themeBtn.setAttribute('aria-pressed', newTheme === 'dark');
    }
    
    // Update icon and label
    if (themeIcon && themeLabel) {
        if (newTheme === 'dark') {
            themeIcon.className = 'fas fa-sun theme-icon';
            themeLabel.textContent = 'Light';
        } else {
            themeIcon.className = 'fas fa-moon theme-icon';
            themeLabel.textContent = 'Dark';
        }
    }
    
    // Store preference
    localStorage.setItem('theme', newTheme);
    
    // Show feedback
    showToast(`${newTheme === 'dark' ? '🌙' : '☀️'} ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} theme activated`, 'info');
    
    // Announce to screen readers
    announceToScreenReader(`Theme changed to ${newTheme} mode`);
    
    // Update charts to reflect theme change
    setTimeout(() => {
        if (MORTGAGE_CALCULATOR.charts.paymentComponents) {
            updatePaymentComponentsChart();
        }
        if (MORTGAGE_CALCULATOR.charts.mortgageTimeline) {
            updateMortgageTimelineChart();
        }
    }, 100);
}

/* ========================================================================== */
/* FONT SIZE ADJUSTMENT - FIXED */
/* ========================================================================== */

function adjustFontSize(action) {
    const body = document.body;
    
    if (action === 'increase') {
        if (MORTGAGE_CALCULATOR.currentFontScaleIndex < MORTGAGE_CALCULATOR.fontScaleOptions.length - 1) {
            MORTGAGE_CALCULATOR.currentFontScaleIndex++;
        }
    } else if (action === 'decrease') {
        if (MORTGAGE_CALCULATOR.currentFontScaleIndex > 0) {
            MORTGAGE_CALCULATOR.currentFontScaleIndex--;
        }
    } else if (action === 'reset') {
        MORTGAGE_CALCULATOR.currentFontScaleIndex = 2; // Default is index 2 (100%)
    }
    
    const newScale = MORTGAGE_CALCULATOR.fontScaleOptions[MORTGAGE_CALCULATOR.currentFontScaleIndex];
    
    // Remove all font scale classes
    body.classList.remove('font-scale-75', 'font-scale-87', 'font-scale-100', 'font-scale-112', 'font-scale-125');
    
    // Add appropriate font scale class
    const scaleClass = `font-scale-${Math.round(newScale * 100)}`;
    body.classList.add(scaleClass);
    
    // Update CSS custom property for font scale
    document.documentElement.style.setProperty('--font-scale', newScale);
    
    // Store in localStorage
    localStorage.setItem('fontSize', newScale.toString());
    
    // Show feedback
    const message = `Font size: ${Math.round(newScale * 100)}%`;
    showToast(message, 'info');
    speakText(message);
}

/* ========================================================================== */
/* UTILITY FUNCTIONS */
/* ========================================================================== */

// All existing utility functions remain the same

// Export for testing if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateMortgage,
        formatCurrency,
        parseCurrency,
        ZIP_DATABASE,
        fredAPI,
        MORTGAGE_CALCULATOR
    };
}
