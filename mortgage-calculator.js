// Enhanced Mortgage Calculator JavaScript Implementation
document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    // Utility functions
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));
    
    // Formatting utilities
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };
    
    const formatCurrencyDetailed = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };
    
    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US').format(num);
    };
    
    const formatPercentage = (num, decimals = 1) => {
        return `${num.toFixed(decimals)}%`;
    };
    
    // Debounce utility for performance
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };
    
    // US State property tax rates (annual percentage)
    const stateTaxRates = {
        'AL': 0.41, 'AK': 1.19, 'AZ': 0.62, 'AR': 0.61, 'CA': 0.75,
        'CO': 0.51, 'CT': 2.14, 'DE': 0.57, 'FL': 0.83, 'GA': 0.89,
        'HI': 0.28, 'ID': 0.63, 'IL': 2.27, 'IN': 0.85, 'IA': 1.53,
        'KS': 1.41, 'KY': 0.86, 'LA': 0.55, 'ME': 1.28, 'MD': 1.06,
        'MA': 1.17, 'MI': 1.54, 'MN': 1.12, 'MS': 0.61, 'MO': 0.97,
        'MT': 0.84, 'NE': 1.73, 'NV': 0.53, 'NH': 2.05, 'NJ': 2.49,
        'NM': 0.55, 'NY': 1.69, 'NC': 0.84, 'ND': 0.98, 'OH': 1.56,
        'OK': 0.90, 'OR': 0.87, 'PA': 1.58, 'RI': 1.53, 'SC': 0.57,
        'SD': 1.32, 'TN': 0.64, 'TX': 1.81, 'UT': 0.58, 'VT': 1.90,
        'VA': 0.82, 'WA': 0.94, 'WV': 0.59, 'WI': 1.85, 'WY': 0.62
    };
    
    // State names for reference
    const stateNames = {
        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
        'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
        'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
        'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
        'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
        'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
        'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
        'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
        'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
        'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
        'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
        'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
        'WI': 'Wisconsin', 'WY': 'Wyoming'
    };
    
    // Calculator state
    let calculatorState = {
        currentMode: 'payment',
        activeTerm: 30,
        usePctDownPayment: false,
        comparisons: [],
        recognition: null,
        currentCalculation: null,
        isAdvancedMode: false,
        breakdownChart: null
    };
    
    // DOM Elements cache
    const elements = {
        // Form inputs
        homePrice: $('#home-price'),
        dpAmount: $('#dp-amount'),
        dpPercent: $('#dp-percent'),
        interestRate: $('#interest-rate'),
        termCustom: $('#term-custom'),
        state: $('#state'),
        propertyTax: $('#property-tax'),
        homeInsurance: $('#home-insurance'),
        pmiRate: $('#pmi-rate'),
        hoaFees: $('#hoa-fees'),
        extraMonthly: $('#extra-monthly'),
        extraOnce: $('#extra-once'),
        
        // UI controls
        tabAmount: $('#tab-amount'),
        tabPercent: $('#tab-percent'),
        dpAmountWrap: $('#dp-amount-wrap'),
        dpPercentWrap: $('#dp-percent-wrap'),
        pmiBanner: $('#pmi-banner'),
        termButtons: $('#term-buttons'),
        advancedToggle: $('#advanced-toggle'),
        advancedPanel: $('#advanced-panel'),
        
        // Results
        totalPayment: $('#total-payment'),
        loanAmount: $('#loan-amount'),
        totalInterest: $('#total-interest'),
        piAmount: $('#pi-amount'),
        taxAmount: $('#tax-amount'),
        insuranceAmount: $('#insurance-amount'),
        pmiAmount: $('#pmi-amount'),
        hoaAmount: $('#hoa-amount'),
        rowPmi: $('#row-pmi'),
        
        // Charts and tables
        breakdownChart: $('#breakdownChart'),
        legendBreakdown: $('#legend-breakdown'),
        amortizationBody: $('#amortization-body'),
        fullScheduleBody: $('#full-schedule-body'),
        scheduleModal: $('#schedule-modal'),
        
        // Action buttons
        calculateBtn: $('#calculate-btn'),
        resetBtn: $('#reset-form'),
        emailBtn: $('#email-results'),
        shareBtn: $('#share-results'),
        printBtn: $('#print-results'),
        viewFullSchedule: $('#view-full-schedule'),
        closeSchedule: $('#close-schedule'),
        
        // Insights and comparison
        insightsList: $('#insights-list'),
        comparisonCards: $('#comparison-cards'),
        scenarioBtns: $$('.scenario-btn')
    };
    
    // Initialize calculator
    function init() {
        setupEventListeners();
        setInitialValues();
        populateStateDropdown();
        calculate();
    }
    
    // Event listeners setup
    function setupEventListeners() {
        // Down payment tabs
        if (elements.tabAmount) {
            elements.tabAmount.addEventListener('click', () => switchDPMode(false));
        }
        if (elements.tabPercent) {
            elements.tabPercent.addEventListener('click', () => switchDPMode(true));
        }
        
        // Input synchronization
        if (elements.homePrice) {
            elements.homePrice.addEventListener('input', handleHomePriceChange);
        }
        if (elements.dpAmount) {
            elements.dpAmount.addEventListener('input', () => syncDownPayment(false));
        }
        if (elements.dpPercent) {
            elements.dpPercent.addEventListener('input', () => syncDownPayment(true));
        }
        if (elements.state) {
            elements.state.addEventListener('change', () => {
                updatePropertyTax();
                calculate(); // Fixed: Auto-calculate when state changes
            });
        }
        
        // Term selection
        if (elements.termButtons) {
            elements.termButtons.addEventListener('click', (e) => {
                const btn = e.target.closest('.chip[data-term]');
                if (btn) setTerm(parseInt(btn.dataset.term));
            });
        }
        if (elements.termCustom) {
            elements.termCustom.addEventListener('input', handleCustomTerm);
        }
        
        // Advanced options
        if (elements.advancedToggle) {
            elements.advancedToggle.addEventListener('click', toggleAdvanced);
        }
        
        // Auto-calculation on input changes
        const autoCalcInputs = [
            elements.homePrice, elements.dpAmount, elements.dpPercent,
            elements.interestRate, elements.propertyTax, elements.homeInsurance,
            elements.pmiRate, elements.hoaFees, elements.extraMonthly, elements.extraOnce
        ].filter(Boolean);
        
        autoCalcInputs.forEach(input => {
            input.addEventListener('input', debounce(calculate, 300));
        });
        
        // Action buttons
        if (elements.calculateBtn) {
            elements.calculateBtn.addEventListener('click', calculate);
        }
        if (elements.resetBtn) {
            elements.resetBtn.addEventListener('click', resetForm);
        }
        if (elements.emailBtn) {
            elements.emailBtn.addEventListener('click', emailResults);
        }
        if (elements.shareBtn) {
            elements.shareBtn.addEventListener('click', shareResults);
        }
        if (elements.printBtn) {
            elements.printBtn.addEventListener('click', () => window.print());
        }
        if (elements.viewFullSchedule) {
            elements.viewFullSchedule.addEventListener('click', showFullSchedule);
        }
        if (elements.closeSchedule) {
            elements.closeSchedule.addEventListener('click', () => elements.scheduleModal?.close());
        }
        
        // Comparison scenarios
        elements.scenarioBtns.forEach(btn => {
            btn.addEventListener('click', () => loadScenario(btn.dataset.scenario));
        });
        
        // Modal backdrop click
        if (elements.scheduleModal) {
            elements.scheduleModal.addEventListener('click', (e) => {
                if (e.target === elements.scheduleModal) {
                    elements.scheduleModal.close();
                }
            });
        }
        
        // Mobile menu toggle
        const mobileToggle = $('.mobile-menu-toggle');
        const navMenu = $('.nav-menu');
        if (mobileToggle && navMenu) {
            mobileToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
    }
    
    // Populate state dropdown
    function populateStateDropdown() {
        if (!elements.state) return;
        
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select State';
        elements.state.appendChild(defaultOption);
        
        Object.entries(stateNames).forEach(([code, name]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${name} (${code})`;
            elements.state.appendChild(option);
        });
        
        // Set default to California
        elements.state.value = 'CA';
    }
    
    // Set initial values
    function setInitialValues() {
        setTerm(30);
        switchDPMode(false);
        updatePropertyTax();
        updateInsurance();
    }
    
    // Down payment mode switching
    function switchDPMode(usePercent) {
        calculatorState.usePctDownPayment = usePercent;
        
        if (elements.tabAmount) elements.tabAmount.classList.toggle('active', !usePercent);
        if (elements.tabPercent) elements.tabPercent.classList.toggle('active', usePercent);
        if (elements.dpAmountWrap) elements.dpAmountWrap.classList.toggle('hidden', usePercent);
        if (elements.dpPercentWrap) elements.dpPercentWrap.classList.toggle('hidden', !usePercent);
        
        syncDownPayment(usePercent);
    }
    
    // Sync down payment inputs
    function syncDownPayment(fromPercent) {
        const homePrice = parseFloat(elements.homePrice?.value || 0);
        
        if (fromPercent) {
            const pct = Math.min(100, Math.max(0, parseFloat(elements.dpPercent?.value || 0)));
            const amt = Math.round(homePrice * pct / 100);
            if (elements.dpAmount) elements.dpAmount.value = amt;
        } else {
            const amt = Math.min(homePrice, Math.max(0, parseFloat(elements.dpAmount?.value || 0)));
            const pct = homePrice > 0 ? (amt / homePrice * 100) : 0;
            if (elements.dpPercent) elements.dpPercent.value = pct.toFixed(1);
        }
        
        updatePMIBanner();
    }
    
    // Handle home price changes
    function handleHomePriceChange() {
        syncDownPayment(calculatorState.usePctDownPayment);
        updatePropertyTax();
        updateInsurance();
    }
    
    // Update PMI banner
    function updatePMIBanner() {
        if (!elements.pmiBanner || !elements.dpPercent) return;
        
        const dpPct = parseFloat(elements.dpPercent.value || 0);
        const needsPMI = dpPct < 20;
        
        elements.pmiBanner.classList.toggle('hidden', !needsPMI);
        
        if (needsPMI) {
            elements.pmiBanner.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <span>PMI required for down payments less than 20%. Current: ${dpPct.toFixed(1)}%</span>
            `;
        }
    }
    
    // Set loan term
    function setTerm(years) {
        calculatorState.activeTerm = years;
        
        // Update term buttons
        $$('.chip[data-term]').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.term) === years);
        });
        
        // Clear custom term if selecting predefined
        if (elements.termCustom && [15, 20, 25, 30].includes(years)) {
            elements.termCustom.value = '';
        }
        
        calculate();
    }
    
    // Handle custom term input
    function handleCustomTerm() {
        const customTerm = parseInt(elements.termCustom.value);
        if (customTerm && customTerm > 0 && customTerm <= 50) {
            // Clear predefined term selection
            $$('.chip[data-term]').forEach(btn => btn.classList.remove('active'));
            calculatorState.activeTerm = customTerm;
            calculate();
        }
    }
    
    // Toggle advanced options
    function toggleAdvanced() {
        calculatorState.isAdvancedMode = !calculatorState.isAdvancedMode;
        
        elements.advancedToggle.classList.toggle('active', calculatorState.isAdvancedMode);
        elements.advancedPanel.classList.toggle('hidden', !calculatorState.isAdvancedMode);
    }
    
    // Update property tax based on state
    function updatePropertyTax() {
        if (!elements.state || !elements.propertyTax || !elements.homePrice) return;
        
        const stateCode = elements.state.value;
        const homePrice = parseFloat(elements.homePrice.value || 0);
        
        if (stateCode && stateTaxRates[stateCode] && homePrice > 0) {
            const annualTax = Math.round(homePrice * (stateTaxRates[stateCode] / 100));
            elements.propertyTax.value = annualTax;
        }
    }
    
    // Update insurance estimate
    function updateInsurance() {
        if (!elements.homeInsurance || !elements.homePrice) return;
        
        const homePrice = parseFloat(elements.homePrice.value || 0);
        if (homePrice > 0) {
            // Estimate 0.3% of home value annually
            const annualInsurance = Math.round(homePrice * 0.003);
            elements.homeInsurance.value = Math.max(500, annualInsurance);
        }
    }
    
    // Main calculation function
    function calculate() {
        try {
            const inputs = getInputValues();
            const results = calculateMortgage(inputs);
            
            updateResults(results);
            updateBreakdownChart(results);
            updateAmortizationTable(results);
            updateInsights(results, inputs);
            
            calculatorState.currentCalculation = { inputs, results };
            
        } catch (error) {
            console.error('Calculation error:', error);
            showNotification('Error in calculation. Please check your inputs.', 'error');
        }
    }
    
    // Get all input values
    function getInputValues() {
        return {
            homePrice: parseFloat(elements.homePrice?.value || 0),
            downPayment: parseFloat(elements.dpAmount?.value || 0),
            interestRate: parseFloat(elements.interestRate?.value || 0) / 100,
            loanTerm: calculatorState.activeTerm,
            propertyTax: parseFloat(elements.propertyTax?.value || 0),
            homeInsurance: parseFloat(elements.homeInsurance?.value || 0),
            pmiRate: parseFloat(elements.pmiRate?.value || 0) / 100,
            hoaFees: parseFloat(elements.hoaFees?.value || 0),
            extraMonthly: parseFloat(elements.extraMonthly?.value || 0),
            extraOnce: parseFloat(elements.extraOnce?.value || 0),
            state: elements.state?.value || ''
        };
    }
    
    // Calculate mortgage details
    function calculateMortgage(inputs) {
        const {
            homePrice, downPayment, interestRate, loanTerm,
            propertyTax, homeInsurance, pmiRate, hoaFees
        } = inputs;
        
        const loanAmount = homePrice - downPayment;
        const monthlyRate = interestRate / 12;
        const numPayments = loanTerm * 12;
        
        // Calculate monthly P&I
        let monthlyPI = 0;
        if (monthlyRate > 0) {
            monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
        } else {
            monthlyPI = loanAmount / numPayments;
        }
        
        // Calculate other monthly amounts
        const monthlyTax = propertyTax / 12;
        const monthlyInsurance = homeInsurance / 12;
        const monthlyHOA = hoaFees;
        
        // Calculate PMI
        const downPaymentPct = (downPayment / homePrice) * 100;
        const monthlyPMI = downPaymentPct < 20 ? (loanAmount * pmiRate / 12) : 0;
        
        // Total monthly payment
        const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA;
        
        // Total interest over life of loan
        const totalInterest = (monthlyPI * numPayments) - loanAmount;
        
        return {
            loanAmount,
            monthlyPI,
            monthlyTax,
            monthlyInsurance,
            monthlyPMI,
            monthlyHOA,
            totalMonthly,
            totalInterest,
            downPaymentPct,
            monthlyRate,
            numPayments
        };
    }
    
    // Update results display
    function updateResults(results) {
        const {
            loanAmount, monthlyPI, monthlyTax, monthlyInsurance,
            monthlyPMI, monthlyHOA, totalMonthly, totalInterest
        } = results;
        
        // Update main results
        if (elements.totalPayment) elements.totalPayment.textContent = formatCurrency(totalMonthly);
        if (elements.loanAmount) elements.loanAmount.textContent = formatCurrency(loanAmount);
        if (elements.totalInterest) elements.totalInterest.textContent = formatCurrency(totalInterest);
        
        // Update breakdown
        if (elements.piAmount) elements.piAmount.textContent = formatCurrency(monthlyPI);
        if (elements.taxAmount) elements.taxAmount.textContent = formatCurrency(monthlyTax);
        if (elements.insuranceAmount) elements.insuranceAmount.textContent = formatCurrency(monthlyInsurance);
        if (elements.pmiAmount) elements.pmiAmount.textContent = formatCurrency(monthlyPMI);
        if (elements.hoaAmount) elements.hoaAmount.textContent = formatCurrency(monthlyHOA);
        
        // Show/hide PMI row
        if (elements.rowPmi) {
            elements.rowPmi.classList.toggle('hidden', monthlyPMI === 0);
        }
    }
    
    // Update breakdown chart
    function updateBreakdownChart(results) {
        if (!elements.breakdownChart) return;
        
        const ctx = elements.breakdownChart.getContext('2d');
        const { monthlyPI, monthlyTax, monthlyInsurance, monthlyPMI, monthlyHOA } = results;
        
        // Destroy existing chart
        if (calculatorState.breakdownChart) {
            calculatorState.breakdownChart.destroy();
        }
        
        const data = [
            { label: 'Principal & Interest', value: monthlyPI, color: '#21809f' },
            { label: 'Property Tax', value: monthlyTax, color: '#a84b2f' },
            { label: 'Insurance', value: monthlyInsurance, color: '#626c71' }
        ];
        
        if (monthlyPMI > 0) {
            data.push({ label: 'PMI', value: monthlyPMI, color: '#c0152f' });
        }
        
        if (monthlyHOA > 0) {
            data.push({ label: 'HOA', value: monthlyHOA, color: '#a84b2f' });
        }
        
        calculatorState.breakdownChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.label),
                datasets: [{
                    data: data.map(d => d.value),
                    backgroundColor: data.map(d => d.color),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = formatCurrency(context.parsed);
                                const percentage = ((context.parsed / results.totalMonthly) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        // Update legend
        updateChartLegend(data);
    }
    
    // Update chart legend
    function updateChartLegend(data) {
        if (!elements.legendBreakdown) return;
        
        elements.legendBreakdown.innerHTML = data.map(item => `
            <div class="legend-item">
                <div class="legend-color" style="background: ${item.color};"></div>
                <span>${item.label}</span>
            </div>
        `).join('');
    }
    
    // Update amortization table
    function updateAmortizationTable(results) {
        if (!elements.amortizationBody) return;
        
        const { loanAmount, monthlyPI, monthlyRate, numPayments } = results;
        let balance = loanAmount;
        let html = '';
        
        // Show first 60 payments (5 years)
        const paymentsToShow = Math.min(60, numPayments);
        
        for (let i = 1; i <= paymentsToShow; i++) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPI - interestPayment;
            balance -= principalPayment;
            
            html += `
                <tr>
                    <td>${i}</td>
                    <td class="currency">${formatCurrency(monthlyPI)}</td>
                    <td class="currency">${formatCurrency(principalPayment)}</td>
                    <td class="currency">${formatCurrency(interestPayment)}</td>
                    <td class="currency">${formatCurrency(Math.max(0, balance))}</td>
                </tr>
            `;
        }
        
        elements.amortizationBody.innerHTML = html;
    }
    
    // Update AI insights
    function updateInsights(results, inputs) {
        if (!elements.insightsList) return;
        
        const insights = generateInsights(results, inputs);
        
        elements.insightsList.innerHTML = insights.map(insight => `
            <li class="insight-item">
                <div class="insight-icon">
                    <i class="${insight.icon}"></i>
                </div>
                <div class="insight-content">
                    <h4>${insight.title}</h4>
                    <p>${insight.message}</p>
                </div>
            </li>
        `).join('');
    }
    
    // Generate AI insights
    function generateInsights(results, inputs) {
        const insights = [];
        const { downPaymentPct, totalMonthly, monthlyPMI, totalInterest } = results;
        const { homePrice, interestRate, loanTerm } = inputs;
        
        // Down payment insight
        if (downPaymentPct < 20) {
            const targetDP = homePrice * 0.2;
            const additionalNeeded = targetDP - inputs.downPayment;
            insights.push({
                icon: 'fas fa-arrow-up',
                title: 'Eliminate PMI',
                message: `Increase down payment by ${formatCurrency(additionalNeeded)} to reach 20% and eliminate ${formatCurrency(monthlyPMI)}/month PMI.`
            });
        }
        
        // Interest rate insight
        if (interestRate > 0.06) {
            const potentialSavings = (totalMonthly * 0.1); // Rough estimate
            insights.push({
                icon: 'fas fa-percentage',
                title: 'Shop for Better Rates',
                message: `A 1% lower rate could save you approximately ${formatCurrency(potentialSavings)}/month in payments.`
            });
        }
        
        // Loan term insight
        if (loanTerm === 30) {
            insights.push({
                icon: 'fas fa-clock',
                title: 'Consider Shorter Term',
                message: `A 15-year loan could save you significant interest over the life of the loan, though monthly payments would be higher.`
            });
        }
        
        // Extra payment insight
        if (inputs.extraMonthly === 0) {
            const extraPayment = Math.round(totalMonthly * 0.1);
            insights.push({
                icon: 'fas fa-plus',
                title: 'Extra Payments Save Money',
                message: `Adding just ${formatCurrency(extraPayment)}/month extra could save you thousands in interest and years off your loan.`
            });
        }
        
        return insights.slice(0, 4); // Limit to 4 insights
    }
    
    // Load comparison scenario
    function loadScenario(scenarioType) {
        if (!calculatorState.currentCalculation) return;
        
        const { inputs } = calculatorState.currentCalculation;
        const scenarios = generateScenarios(inputs);
        
        displayComparisons([
            { name: 'Current Loan', ...calculatorState.currentCalculation.results, inputs },
            ...scenarios[scenarioType] || []
        ]);
    }
    
    // Generate comparison scenarios
    function generateScenarios(baseInputs) {
        const scenarios = {};
        
        // Lower rate scenario
        const lowerRateInputs = { ...baseInputs, interestRate: Math.max(0.03, baseInputs.interestRate - 0.01) };
        scenarios['lower-rate'] = [{
            name: 'Lower Rate (-1%)',
            ...calculateMortgage(lowerRateInputs),
            inputs: lowerRateInputs
        }];
        
        // Higher down payment scenario
        const higherDPInputs = { ...baseInputs, downPayment: baseInputs.homePrice * 0.25 };
        scenarios['higher-dp'] = [{
            name: 'Higher Down Payment (25%)',
            ...calculateMortgage(higherDPInputs),
            inputs: higherDPInputs
        }];
        
        // Shorter term scenario
        const shorterTermInputs = { ...baseInputs, loanTerm: 15 };
        scenarios['shorter-term'] = [{
            name: 'Shorter Term (15 years)',
            ...calculateMortgage(shorterTermInputs),
            inputs: shorterTermInputs
        }];
        
        // Extra payment scenario
        const extraPaymentInputs = { ...baseInputs, extraMonthly: 200 };
        scenarios['extra-payment'] = [{
            name: 'Extra Payment ($200/month)',
            ...calculateMortgage(extraPaymentInputs),
            inputs: extraPaymentInputs
        }];
        
        return scenarios;
    }
    
    // Display comparisons
    function displayComparisons(comparisons) {
        if (!elements.comparisonCards) return;
        
        const baseComparison = comparisons[0];
        
        elements.comparisonCards.innerHTML = comparisons.map((comp, index) => {
            const savings = index > 0 ? baseComparison.totalMonthly - comp.totalMonthly : 0;
            const interestSavings = index > 0 ? baseComparison.totalInterest - comp.totalInterest : 0;
            
            return `
                <div class="comparison-card">
                    <div class="comparison-header">
                        <h4 class="comparison-title">${comp.name}</h4>
                        ${savings > 0 ? `<span class="comparison-savings">Save ${formatCurrency(savings)}/mo</span>` : ''}
                    </div>
                    <div class="comparison-details">
                        <div class="comparison-row">
                            <span>Monthly Payment</span>
                            <span><strong>${formatCurrency(comp.totalMonthly)}</strong></span>
                        </div>
                        <div class="comparison-row">
                            <span>Total Interest</span>
                            <span>${formatCurrency(comp.totalInterest)}</span>
                        </div>
                        <div class="comparison-row">
                            <span>Loan Amount</span>
                            <span>${formatCurrency(comp.loanAmount)}</span>
                        </div>
                        ${interestSavings > 0 ? `
                        <div class="comparison-row">
                            <span>Interest Savings</span>
                            <span class="text-success"><strong>${formatCurrency(interestSavings)}</strong></span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Show full schedule modal
    function showFullSchedule() {
        if (!elements.scheduleModal || !calculatorState.currentCalculation) return;
        
        const { results } = calculatorState.currentCalculation;
        generateFullSchedule(results);
        elements.scheduleModal.showModal();
    }
    
    // Generate full amortization schedule
    function generateFullSchedule(results) {
        if (!elements.fullScheduleBody) return;
        
        const { loanAmount, monthlyPI, monthlyRate, numPayments } = results;
        let balance = loanAmount;
        let html = '';
        const startDate = new Date();
        
        for (let i = 1; i <= numPayments; i++) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPI - interestPayment;
            balance = Math.max(0, balance - principalPayment);
            
            const paymentDate = new Date(startDate);
            paymentDate.setMonth(paymentDate.getMonth() + i - 1);
            
            html += `
                <tr>
                    <td>${i}</td>
                    <td>${paymentDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</td>
                    <td class="currency">${formatCurrency(monthlyPI)}</td>
                    <td class="currency">${formatCurrency(principalPayment)}</td>
                    <td class="currency">${formatCurrency(interestPayment)}</td>
                    <td class="currency">${formatCurrency(balance)}</td>
                </tr>
            `;
        }
        
        elements.fullScheduleBody.innerHTML = html;
    }
    
    // Reset form
    function resetForm() {
        if (elements.homePrice) elements.homePrice.value = '400000';
        if (elements.dpAmount) elements.dpAmount.value = '80000';
        if (elements.dpPercent) elements.dpPercent.value = '20';
        if (elements.interestRate) elements.interestRate.value = '6.5';
        if (elements.state) elements.state.value = 'CA';
        if (elements.propertyTax) elements.propertyTax.value = '3000';
        if (elements.homeInsurance) elements.homeInsurance.value = '1200';
        if (elements.pmiRate) elements.pmiRate.value = '0.5';
        if (elements.hoaFees) elements.hoaFees.value = '0';
        if (elements.extraMonthly) elements.extraMonthly.value = '0';
        if (elements.extraOnce) elements.extraOnce.value = '0';
        if (elements.termCustom) elements.termCustom.value = '';
        
        setTerm(30);
        switchDPMode(false);
        updatePropertyTax();
        updateInsurance();
        calculate();
        
        if (elements.comparisonCards) {
            elements.comparisonCards.innerHTML = '';
        }
        
        showNotification('Form reset to default values', 'success');
    }
    
    // Email results
    function emailResults() {
        if (!calculatorState.currentCalculation) {
            showNotification('Please calculate first', 'error');
            return;
        }
        
        const { results, inputs } = calculatorState.currentCalculation;
        const subject = encodeURIComponent('Mortgage Calculator Results');
        const body = encodeURIComponent(`
Mortgage Calculator Results:

Home Price: ${formatCurrency(inputs.homePrice)}
Down Payment: ${formatCurrency(inputs.downPayment)} (${results.downPaymentPct.toFixed(1)}%)
Loan Amount: ${formatCurrency(results.loanAmount)}
Interest Rate: ${(inputs.interestRate * 100).toFixed(2)}%
Loan Term: ${inputs.loanTerm} years

Monthly Payment Breakdown:
- Principal & Interest: ${formatCurrency(results.monthlyPI)}
- Property Tax: ${formatCurrency(results.monthlyTax)}
- Home Insurance: ${formatCurrency(results.monthlyInsurance)}
- PMI: ${formatCurrency(results.monthlyPMI)}
- HOA: ${formatCurrency(results.monthlyHOA)}

Total Monthly Payment: ${formatCurrency(results.totalMonthly)}
Total Interest: ${formatCurrency(results.totalInterest)}

Generated by Finguid Mortgage Calculator
        `);
        
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
    
    // Share results
    function shareResults() {
        if (!calculatorState.currentCalculation) {
            showNotification('Please calculate first', 'error');
            return;
        }
        
        const { results } = calculatorState.currentCalculation;
        const shareText = `Check out my mortgage calculation: ${formatCurrency(results.totalMonthly)}/month total payment. Calculate yours at ${window.location.href}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Mortgage Calculator Results',
                text: shareText,
                url: window.location.href
            });
        } else {
            // Fallback to copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                showNotification('Results copied to clipboard', 'success');
            });
        }
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Initialize when DOM is loaded
    init();
});

// Notification styles (add to CSS)
const notificationCSS = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: slideIn 0.3s ease-out;
}

.notification-success { background: #10b981; }
.notification-error { background: #ef4444; }
.notification-info { background: #3b82f6; }

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
`;

// Add notification styles to document
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = notificationCSS;
    document.head.appendChild(style);
}
