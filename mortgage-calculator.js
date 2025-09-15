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
        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
        'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
        'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
        'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
        'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
        'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
        'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
        'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
        'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
        'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
    };

    // Calculator state
    let calculatorState = {
        currentMode: 'payment',
        activeTerm: 30,
        usePctDownPayment: false,
        comparisons: [],
        recognition: null,
        currentCalculation: null,
        isAdvancedMode: false
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

        // State changes trigger calculation update
        if (elements.state) {
            elements.state.addEventListener('change', () => {
                updatePropertyTax();
                calculate(); // Add automatic recalculation when state changes
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
            elements.homePrice, elements.dpAmount, elements.dpPercent, elements.interestRate,
            elements.propertyTax, elements.homeInsurance, elements.pmiRate, elements.hoaFees,
            elements.extraMonthly, elements.extraOnce
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
    }

    // Set loan term
    function setTerm(years) {
        calculatorState.activeTerm = years;
        
        // Update term buttons
        $$('.chip[data-term]').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.term) === years);
        });
        
        // Clear custom input if using predefined term
        if (elements.termCustom && [15, 20, 25, 30].includes(years)) {
            elements.termCustom.value = '';
        }
        
        calculate();
    }

    // Handle custom term input
    function handleCustomTerm() {
        const customTerm = parseInt(elements.termCustom.value);
        if (customTerm && customTerm > 0 && customTerm <= 50) {
            // Deactivate all predefined term buttons
            $$('.chip[data-term]').forEach(btn => btn.classList.remove('active'));
            calculatorState.activeTerm = customTerm;
            calculate();
        }
    }

    // Toggle advanced options
    function toggleAdvanced() {
        const isActive = elements.advancedToggle.classList.toggle('active');
        elements.advancedPanel.classList.toggle('hidden', !isActive);
        calculatorState.isAdvancedMode = isActive;
    }

    // Update property tax based on state
    function updatePropertyTax() {
        if (!elements.state || !elements.propertyTax || !elements.homePrice) return;
        
        const state = elements.state.value;
        const homePrice = parseFloat(elements.homePrice.value || 0);
        
        if (state && stateTaxRates[state] && homePrice > 0) {
            const annualTax = Math.round(homePrice * stateTaxRates[state] / 100);
            elements.propertyTax.value = annualTax;
        }
    }

    // Update insurance estimate
    function updateInsurance() {
        if (!elements.homeInsurance || !elements.homePrice) return;
        
        const homePrice = parseFloat(elements.homePrice.value || 0);
        if (homePrice > 0) {
            // Rough estimate: $3-5 per $1000 of home value annually
            const annualInsurance = Math.round(homePrice * 0.004);
            elements.homeInsurance.value = Math.max(300, annualInsurance); // Minimum $300
        }
    }

    // Main calculation function
    function calculate() {
        try {
            // Get input values
            const homePrice = parseFloat(elements.homePrice?.value || 0);
            const dpAmount = parseFloat(elements.dpAmount?.value || 0);
            const interestRate = parseFloat(elements.interestRate?.value || 0) / 100 / 12;
            const termMonths = calculatorState.activeTerm * 12;
            const propertyTax = parseFloat(elements.propertyTax?.value || 0);
            const homeInsurance = parseFloat(elements.homeInsurance?.value || 0);
            const pmiRate = parseFloat(elements.pmiRate?.value || 0) / 100;
            const hoaFees = parseFloat(elements.hoaFees?.value || 0);
            const extraMonthly = parseFloat(elements.extraMonthly?.value || 0);

            // Validate inputs
            if (homePrice <= 0 || interestRate <= 0 || termMonths <= 0) {
                showError('Please enter valid home price, interest rate, and loan term.');
                return;
            }

            if (dpAmount >= homePrice) {
                showError('Down payment cannot be greater than or equal to home price.');
                return;
            }

            // Calculate loan amount
            const loanAmount = homePrice - dpAmount;
            const dpPercent = (dpAmount / homePrice) * 100;

            // Calculate monthly P&I
            const monthlyPI = loanAmount * (interestRate * Math.pow(1 + interestRate, termMonths)) / 
                             (Math.pow(1 + interestRate, termMonths) - 1);

            // Calculate other monthly costs
            const monthlyTax = propertyTax / 12;
            const monthlyInsurance = homeInsurance / 12;
            const monthlyPMI = dpPercent < 20 ? (loanAmount * pmiRate / 12) : 0;
            const monthlyHOA = hoaFees;

            // Total monthly payment
            const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA;

            // Calculate total interest
            const totalInterest = (monthlyPI * termMonths) - loanAmount;

            // Update results
            updateResults({
                totalMonthly,
                loanAmount,
                totalInterest,
                monthlyPI,
                monthlyTax,
                monthlyInsurance,
                monthlyPMI,
                monthlyHOA,
                dpPercent,
                termMonths,
                interestRate: interestRate * 12,
                homePrice,
                extraMonthly
            });

            // Generate amortization schedule
            generateAmortizationSchedule(loanAmount, interestRate, termMonths, extraMonthly);

            // Update chart
            updateBreakdownChart({
                pi: monthlyPI,
                tax: monthlyTax,
                insurance: monthlyInsurance,
                pmi: monthlyPMI,
                hoa: monthlyHOA
            });

            // Generate AI insights
            generateInsights({
                dpPercent,
                interestRate: interestRate * 12,
                termMonths,
                totalInterest,
                monthlyPMI,
                loanAmount,
                totalMonthly
            });

            // Update comparison scenarios with current values
            updateComparisonScenarios();

            calculatorState.currentCalculation = {
                homePrice,
                loanAmount,
                dpAmount,
                interestRate: interestRate * 12,
                termMonths,
                monthlyPI,
                totalMonthly,
                totalInterest
            };

        } catch (error) {
            console.error('Calculation error:', error);
            showError('An error occurred during calculation. Please check your inputs.');
        }
    }

    // Update results display
    function updateResults(results) {
        if (elements.totalPayment) elements.totalPayment.textContent = formatCurrency(results.totalMonthly);
        if (elements.loanAmount) elements.loanAmount.textContent = formatCurrency(results.loanAmount);
        if (elements.totalInterest) elements.totalInterest.textContent = formatCurrency(results.totalInterest);
        if (elements.piAmount) elements.piAmount.textContent = formatCurrency(results.monthlyPI);
        if (elements.taxAmount) elements.taxAmount.textContent = formatCurrency(results.monthlyTax);
        if (elements.insuranceAmount) elements.insuranceAmount.textContent = formatCurrency(results.monthlyInsurance);
        if (elements.pmiAmount) elements.pmiAmount.textContent = formatCurrency(results.monthlyPMI);
        if (elements.hoaAmount) elements.hoaAmount.textContent = formatCurrency(results.monthlyHOA);

        // Show/hide PMI row
        if (elements.rowPmi) {
            elements.rowPmi.style.display = results.monthlyPMI > 0 ? 'flex' : 'none';
        }
    }

    // Generate amortization schedule
    function generateAmortizationSchedule(loanAmount, monthlyRate, termMonths, extraPayment = 0) {
        if (!elements.amortizationBody) return;

        elements.amortizationBody.innerHTML = '';
        
        let balance = loanAmount;
        const monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                         (Math.pow(1 + monthlyRate, termMonths) - 1);

        // Show first 5 years (60 payments)
        const paymentsToShow = Math.min(60, termMonths);
        
        for (let i = 1; i <= paymentsToShow; i++) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPI - interestPayment + extraPayment;
            balance = Math.max(0, balance - principalPayment);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${i}</td>
                <td class="currency">${formatCurrency(monthlyPI + extraPayment)}</td>
                <td class="currency">${formatCurrency(principalPayment)}</td>
                <td class="currency">${formatCurrency(interestPayment)}</td>
                <td class="currency">${formatCurrency(balance)}</td>
            `;
            
            elements.amortizationBody.appendChild(row);
            
            if (balance <= 0) break;
        }
    }

    // Update breakdown chart
    function updateBreakdownChart(breakdown) {
        if (!elements.breakdownChart) return;

        const ctx = elements.breakdownChart.getContext('2d');
        
        // Destroy existing chart
        if (window.mortgageChart) {
            window.mortgageChart.destroy();
        }

        const data = [];
        const labels = [];
        const colors = [];

        if (breakdown.pi > 0) {
            data.push(breakdown.pi);
            labels.push('Principal & Interest');
            colors.push('#218088');
        }
        if (breakdown.tax > 0) {
            data.push(breakdown.tax);
            labels.push('Property Tax');
            colors.push('#A84F2F');
        }
        if (breakdown.insurance > 0) {
            data.push(breakdown.insurance);
            labels.push('Insurance');
            colors.push('#626C71');
        }
        if (breakdown.pmi > 0) {
            data.push(breakdown.pmi);
            labels.push('PMI');
            colors.push('#C0152F');
        }
        if (breakdown.hoa > 0) {
            data.push(breakdown.hoa);
            labels.push('HOA Fees');
            colors.push('#E68161');
        }

        window.mortgageChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = formatCurrency(context.raw);
                                const percent = ((context.raw / data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                                return `${label}: ${value} (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Update legend
        if (elements.legendBreakdown) {
            elements.legendBreakdown.innerHTML = labels.map((label, index) => `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${colors[index]}"></div>
                    <span>${label}: ${formatCurrency(data[index])}</span>
                </div>
            `).join('');
        }
    }

    // Generate AI insights
    function generateInsights(data) {
        if (!elements.insightsList) return;

        const insights = [];

        // Down payment insight
        if (data.dpPercent < 20) {
            insights.push({
                icon: 'fas fa-arrow-up',
                title: 'Increase Down Payment',
                message: `Increasing your down payment to 20% would eliminate PMI, saving you ${formatCurrency(data.monthlyPMI * 12)} annually.`
            });
        }

        // Interest rate insight
        if (data.interestRate > 0.06) {
            const lowerRatePayment = data.loanAmount * (0.06/12 * Math.pow(1 + 0.06/12, data.termMonths)) / (Math.pow(1 + 0.06/12, data.termMonths) - 1);
            const savings = (data.totalMonthly - lowerRatePayment) * data.termMonths;
            insights.push({
                icon: 'fas fa-percentage',
                title: 'Rate Shopping',
                message: `A 1% lower interest rate could save you ${formatCurrency(savings)} over the loan term.`
            });
        }

        // Term length insight
        if (data.termMonths === 360) {
            const shorterTermPayment = data.loanAmount * (data.interestRate/12 * Math.pow(1 + data.interestRate/12, 180)) / (Math.pow(1 + data.interestRate/12, 180) - 1);
            const interestSavings = data.totalInterest - ((shorterTermPayment * 180) - data.loanAmount);
            insights.push({
                icon: 'fas fa-clock',
                title: '15-Year vs 30-Year',
                message: `A 15-year loan would save ${formatCurrency(interestSavings)} in interest but increase monthly payments by ${formatCurrency(shorterTermPayment - (data.totalMonthly - data.monthlyPI))}.`
            });
        }

        // Extra payment insight
        insights.push({
            icon: 'fas fa-plus-circle',
            title: 'Extra Principal Payments',
            message: `Adding $200/month to principal would save approximately ${formatCurrency(data.totalInterest * 0.15)} in interest and pay off the loan 5-7 years early.`
        });

        // Debt-to-income insight
        const assumedIncome = data.totalMonthly / 0.28; // Assume 28% DTI
        if (data.totalMonthly / assumedIncome > 0.28) {
            insights.push({
                icon: 'fas fa-chart-line',
                title: 'Debt-to-Income Ratio',
                message: `Your total monthly payment represents a significant portion of income. Consider a lower price range or larger down payment.`
            });
        }

        // Render insights
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

    // Load comparison scenario
    function loadScenario(scenario) {
        if (!calculatorState.currentCalculation) {
            calculate(); // Ensure we have current calculation
            return;
        }

        const current = calculatorState.currentCalculation;
        const scenarios = [];

        // Add current scenario
        scenarios.push({
            title: 'Current Scenario',
            data: current,
            savings: 0
        });

        switch (scenario) {
            case 'lower-rate':
                const lowerRate = Math.max(0.01, current.interestRate - 0.01);
                const lowerRateMonthly = current.loanAmount * (lowerRate/12 * Math.pow(1 + lowerRate/12, current.termMonths)) / 
                                       (Math.pow(1 + lowerRate/12, current.termMonths) - 1);
                const lowerRateInterest = (lowerRateMonthly * current.termMonths) - current.loanAmount;
                scenarios.push({
                    title: '1% Lower Rate',
                    data: {
                        ...current,
                        interestRate: lowerRate,
                        monthlyPI: lowerRateMonthly,
                        totalInterest: lowerRateInterest
                    },
                    savings: current.totalInterest - lowerRateInterest
                });
                break;

            case 'higher-down':
                const higherDP = Math.min(current.homePrice * 0.3, current.dpAmount + 20000);
                const higherDPLoan = current.homePrice - higherDP;
                const higherDPMonthly = higherDPLoan * (current.interestRate/12 * Math.pow(1 + current.interestRate/12, current.termMonths)) / 
                                       (Math.pow(1 + current.interestRate/12, current.termMonths) - 1);
                const higherDPInterest = (higherDPMonthly * current.termMonths) - higherDPLoan;
                scenarios.push({
                    title: 'Higher Down Payment',
                    data: {
                        ...current,
                        loanAmount: higherDPLoan,
                        dpAmount: higherDP,
                        monthlyPI: higherDPMonthly,
                        totalInterest: higherDPInterest
                    },
                    savings: current.totalInterest - higherDPInterest
                });
                break;

            case 'shorter-term':
                const shorterTerm = 180; // 15 years
                const shorterMonthly = current.loanAmount * (current.interestRate/12 * Math.pow(1 + current.interestRate/12, shorterTerm)) / 
                                      (Math.pow(1 + current.interestRate/12, shorterTerm) - 1);
                const shorterInterest = (shorterMonthly * shorterTerm) - current.loanAmount;
                scenarios.push({
                    title: '15-Year Term',
                    data: {
                        ...current,
                        termMonths: shorterTerm,
                        monthlyPI: shorterMonthly,
                        totalInterest: shorterInterest
                    },
                    savings: current.totalInterest - shorterInterest
                });
                break;

            case 'extra-payment':
                const extraAmount = 500;
                // Simplified calculation for extra payments
                const extraInterestSavings = current.totalInterest * 0.25; // Rough estimate
                scenarios.push({
                    title: 'Extra $500/Month',
                    data: {
                        ...current,
                        monthlyPI: current.monthlyPI + extraAmount,
                        totalInterest: current.totalInterest - extraInterestSavings
                    },
                    savings: extraInterestSavings
                });
                break;
        }

        renderComparisonCards(scenarios);
    }

    // Render comparison cards
    function renderComparisonCards(scenarios) {
        if (!elements.comparisonCards) return;

        elements.comparisonCards.innerHTML = scenarios.map((scenario, index) => `
            <div class="comparison-card">
                <div class="comparison-header">
                    <h4 class="comparison-title">${scenario.title}</h4>
                    ${scenario.savings > 0 ? `<span class="comparison-savings">Save ${formatCurrency(scenario.savings)}</span>` : ''}
                </div>
                <div class="comparison-details">
                    <div class="comparison-row">
                        <span>Monthly P&I:</span>
                        <span>${formatCurrency(scenario.data.monthlyPI)}</span>
                    </div>
                    <div class="comparison-row">
                        <span>Total Interest:</span>
                        <span>${formatCurrency(scenario.data.totalInterest)}</span>
                    </div>
                    <div class="comparison-row">
                        <span>Loan Amount:</span>
                        <span>${formatCurrency(scenario.data.loanAmount)}</span>
                    </div>
                    <div class="comparison-row">
                        <span>Interest Rate:</span>
                        <span>${formatPercentage(scenario.data.interestRate * 100, 2)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Update comparison scenarios with current values
    function updateComparisonScenarios() {
        // Clear existing comparisons
        if (elements.comparisonCards) {
            elements.comparisonCards.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); font-style: italic;">Click a scenario button above to compare different loan options</p>';
        }
    }

    // Show full amortization schedule
    function showFullSchedule() {
        if (!elements.scheduleModal || !calculatorState.currentCalculation) return;

        const current = calculatorState.currentCalculation;
        const loanAmount = current.loanAmount;
        const monthlyRate = current.interestRate / 12;
        const termMonths = current.termMonths;
        const monthlyPI = current.monthlyPI;

        elements.fullScheduleBody.innerHTML = '';
        
        let balance = loanAmount;
        let totalInterestPaid = 0;
        const startDate = new Date();

        for (let i = 1; i <= termMonths && balance > 0; i++) {
            const paymentDate = new Date(startDate);
            paymentDate.setMonth(paymentDate.getMonth() + i);
            
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPI - interestPayment;
            balance = Math.max(0, balance - principalPayment);
            totalInterestPaid += interestPayment;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${i}</td>
                <td>${paymentDate.toLocaleDateString()}</td>
                <td class="currency">${formatCurrency(monthlyPI)}</td>
                <td class="currency">${formatCurrency(principalPayment)}</td>
                <td class="currency">${formatCurrency(interestPayment)}</td>
                <td class="currency">${formatCurrency(balance)}</td>
                <td class="currency">${formatCurrency(totalInterestPaid)}</td>
            `;
            
            elements.fullScheduleBody.appendChild(row);
        }

        elements.scheduleModal.showModal();
    }

    // Reset form
    function resetForm() {
        if (elements.homePrice) elements.homePrice.value = '400000';
        if (elements.dpAmount) elements.dpAmount.value = '80000';
        if (elements.dpPercent) elements.dpPercent.value = '20';
        if (elements.interestRate) elements.interestRate.value = '6.5';
        if (elements.termCustom) elements.termCustom.value = '';
        if (elements.state) elements.state.value = 'CA';
        if (elements.propertyTax) elements.propertyTax.value = '3000';
        if (elements.homeInsurance) elements.homeInsurance.value = '1200';
        if (elements.pmiRate) elements.pmiRate.value = '0.5';
        if (elements.hoaFees) elements.hoaFees.value = '0';
        if (elements.extraMonthly) elements.extraMonthly.value = '0';
        if (elements.extraOnce) elements.extraOnce.value = '0';

        setTerm(30);
        switchDPMode(false);
        updatePropertyTax();
        calculate();
    }

    // Email results
    function emailResults() {
        if (!calculatorState.currentCalculation) return;

        const current = calculatorState.currentCalculation;
        const subject = encodeURIComponent('My Mortgage Calculation Results');
        const body = encodeURIComponent(`
Mortgage Calculation Results:

Home Price: ${formatCurrency(current.homePrice)}
Down Payment: ${formatCurrency(current.dpAmount)}
Loan Amount: ${formatCurrency(current.loanAmount)}
Interest Rate: ${formatPercentage(current.interestRate * 100, 3)}
Loan Term: ${current.termMonths / 12} years

Monthly Payment: ${formatCurrency(current.totalMonthly)}
Total Interest: ${formatCurrency(current.totalInterest)}

Calculated with USA Financial Calculators
https://usa-financial-calculators.netlify.app/mortgage-calculator
        `);

        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }

    // Share results
    function shareResults() {
        if (navigator.share && calculatorState.currentCalculation) {
            navigator.share({
                title: 'Mortgage Calculator Results',
                text: `Monthly payment: ${formatCurrency(calculatorState.currentCalculation.totalMonthly)}`,
                url: window.location.href
            });
        } else {
            // Fallback to copying URL
            navigator.clipboard.writeText(window.location.href).then(() => {
                showNotification('Link copied to clipboard!', 'success');
            });
        }
    }

    // Show error message
    function showError(message) {
        console.error('Calculator Error:', message);
        // You could implement a toast notification here
        alert(message); // Temporary fallback
    }

    // Show notification
    function showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        // You could implement a toast notification system here
    }

    // Initialize the calculator
    init();
});
