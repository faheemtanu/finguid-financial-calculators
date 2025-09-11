/* HomeLoan Pro - AI-Enhanced Mortgage Calculator 2025
   Features: Voice Input, 50-State Data, PMI, Refinance, Affordability, AI Insights
   SEO & Performance Optimized for US Market
*/

(() => {
    'use strict';
    
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => Array.from(document.querySelectorAll(s));
    const money = (n) => `$${n.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    const formatNumber = (n) => n.toLocaleString('en-US');

    // US State tax rates (%) - All 50 states
    const stateTaxRates = {
        AL: 0.41, AK: 1.24, AZ: 0.60, AR: 0.66, CA: 0.81, CO: 0.52, CT: 2.16, DE: 0.62,
        FL: 0.89, GA: 0.95, HI: 0.29, ID: 0.63, IL: 2.29, IN: 0.83, IA: 1.59, KS: 1.40,
        KY: 0.89, LA: 0.62, ME: 1.29, MD: 1.07, MA: 1.19, MI: 1.53, MN: 1.10, MS: 0.81,
        MO: 1.00, MT: 0.83, NE: 1.70, NV: 0.55, NH: 2.09, NJ: 2.46, NM: 0.84, NY: 1.73,
        NC: 0.80, ND: 1.02, OH: 1.57, OK: 0.99, OR: 0.92, PA: 1.56, RI: 1.54, SC: 0.58,
        SD: 1.24, TN: 0.65, TX: 1.90, UT: 0.57, VT: 1.89, VA: 0.83, WA: 0.93, WV: 0.59,
        WI: 1.71, WY: 0.61
    };

    // State names for tooltips
    const stateNames = {
        AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
        CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
        HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
        KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
        MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
        NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
        NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
        OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
        TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
        WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'
    };

    // Calculator state
    let currentMode = 'payment';
    let activeTerm = 30;
    let usePct = false;
    let comparisons = [];
    let recognition = null;
    let currentCalculation = null;

    // Elements cache
    const els = {
        // Mode tabs
        modeTabs: $$('.tab-btn[data-mode]'),
        modeContents: $$('.mode-content'),
        
        // Payment mode inputs
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

        // Refinance mode inputs
        currentBalance: $('#current-balance'),
        currentRate: $('#current-rate'),
        remainingTerm: $('#remaining-term'),
        newRate: $('#new-rate'),
        newTerm: $('#new-term'),
        closingCosts: $('#closing-costs'),

        // Affordability mode inputs
        annualIncome: $('#annual-income'),
        monthlyDebts: $('#monthly-debts'),
        downPaymentSaved: $('#down-payment-saved'),
        dtiRatio: $('#dti-ratio'),

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
        amortizationChart: $('#amortizationChart'),
        legendBreakdown: $('#legend-breakdown'),
        amortizationBody: $('#amortization-body'),
        fullScheduleBody: $('#full-schedule-body'),
        scheduleModal: $('#schedule-modal'),

        // Actions
        calculateBtn: $('#calculate-btn'),
        resetBtn: $('#reset-form'),
        emailBtn: $('#email-results'),
        shareBtn: $('#share-results'),
        printBtn: $('#print-results'),
        viewFullSchedule: $('#view-full-schedule'),
        closeSchedule: $('#close-schedule'),

        // Voice
        voiceBtns: $$('.voice-btn'),
        voiceStatus: $('#voice-status'),

        // Insights
        insightsList: $('#insights-list'),

        // Comparison
        scenarioName: $('#scenario-name'),
        addScenario: $('#add-scenario'),
        clearScenarios: $('#clear-scenarios'),
        comparisonGrid: $('#comparison-grid'),
        scenarioBtns: $$('.scenario-btn')
    };

    // Initialize calculator
    function init() {
        setupEventListeners();
        setupVoiceRecognition();
        setupTooltips();
        setInitialValues();
        switchMode('payment');
        calculate();
    }

    // Event listeners setup
    function setupEventListeners() {
        // Mode switching
        els.modeTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const mode = tab.dataset.mode;
                switchMode(mode);
            });
        });

        // Down payment tabs
        els.tabAmount.addEventListener('click', () => switchDPMode(false));
        els.tabPercent.addEventListener('click', () => switchDPMode(true));

        // Input synchronization
        els.homePrice.addEventListener('input', handleHomePriceChange);
        els.dpAmount.addEventListener('input', () => syncDownPayment(false));
        els.dpPercent.addEventListener('input', () => syncDownPayment(true));
        els.state.addEventListener('change', updatePropertyTax);

        // Term selection
        els.termButtons.addEventListener('click', (e) => {
            const btn = e.target.closest('.chip[data-term]');
            if (btn) setTerm(+btn.dataset.term);
        });
        els.termCustom.addEventListener('input', handleCustomTerm);

        // Advanced options
        els.advancedToggle.addEventListener('click', toggleAdvanced);

        // Auto-calculation on input changes
        const autoCalcInputs = [
            els.homePrice, els.dpAmount, els.dpPercent, els.interestRate,
            els.propertyTax, els.homeInsurance, els.pmiRate, els.hoaFees,
            els.extraMonthly, els.extraOnce
        ];
        
        autoCalcInputs.forEach(input => {
            if (input) {
                input.addEventListener('input', debounce(calculate, 300));
            }
        });

        // Action buttons
        els.calculateBtn.addEventListener('click', calculate);
        els.resetBtn.addEventListener('click', resetForm);
        els.emailBtn.addEventListener('click', emailResults);
        els.shareBtn.addEventListener('click', shareResults);
        els.printBtn.addEventListener('click', () => window.print());
        els.viewFullSchedule.addEventListener('click', showFullSchedule);
        els.closeSchedule.addEventListener('click', () => els.scheduleModal.close());

        // Voice buttons
        els.voiceBtns.forEach(btn => {
            btn.addEventListener('click', () => startVoiceInput(btn.dataset.field));
        });

        // Voice status close
        $('.voice-close')?.addEventListener('click', hideVoiceStatus);

        // Comparison
        els.addScenario.addEventListener('click', addComparison);
        els.clearScenarios.addEventListener('click', clearComparisons);
        
        els.scenarioBtns.forEach(btn => {
            btn.addEventListener('click', () => loadScenario(btn.dataset.scenario));
        });

        // Modal backdrop click
        els.scheduleModal.addEventListener('click', (e) => {
            if (e.target === els.scheduleModal) {
                els.scheduleModal.close();
            }
        });

        // Hamburger menu
        $('#hamburger')?.addEventListener('click', toggleMobileMenu);
    }

    // Voice recognition setup
    function setupVoiceRecognition() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                // Hide voice buttons if not supported
                els.voiceBtns.forEach(btn => btn.style.display = 'none');
                return;
            }

            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            recognition.maxAlternatives = 1;

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                processVoiceCommand(transcript);
            };

            recognition.onerror = (event) => {
                console.error('Voice recognition error:', event.error);
                hideVoiceStatus();
                showNotification('Voice recognition error. Please try again.', 'error');
            };

            recognition.onend = hideVoiceStatus;

        } catch (error) {
            console.warn('Voice recognition not available:', error);
            els.voiceBtns.forEach(btn => btn.style.display = 'none');
        }
    }

    // Tooltip setup
    function setupTooltips() {
        $$('[data-tooltip]').forEach(element => {
            element.addEventListener('mouseenter', showTooltip);
            element.addEventListener('mouseleave', hideTooltip);
        });
    }

    // Set initial values
    function setInitialValues() {
        setTerm(30);
        switchDPMode(false);
        updatePropertyTax();
        updateInsurance();
    }

    // Mode switching
    function switchMode(mode) {
        currentMode = mode;
        
        // Update active tab
        els.modeTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        // Show/hide content
        els.modeContents.forEach(content => {
            content.classList.toggle('hidden', content.id !== `${mode}-mode`);
        });

        // Update calculate button text
        const btnText = {
            'payment': 'Calculate Payment',
            'refinance': 'Calculate Savings',
            'affordability': 'Calculate Affordability'
        };
        els.calculateBtn.innerHTML = `<i class="fas fa-calculator"></i> ${btnText[mode]}`;

        calculate();
    }

    // Down payment mode switching
    function switchDPMode(usePercent) {
        usePct = usePercent;
        els.tabAmount.classList.toggle('active', !usePercent);
        els.tabPercent.classList.toggle('active', usePercent);
        els.dpAmountWrap.classList.toggle('hidden', usePercent);
        els.dpPercentWrap.classList.toggle('hidden', !usePercent);
        
        syncDownPayment(usePercent);
    }

    // Sync down payment inputs
    function syncDownPayment(fromPercent) {
        const homePrice = +els.homePrice.value || 0;
        
        if (fromPercent) {
            const pct = Math.min(100, Math.max(0, +els.dpPercent.value || 0));
            const amt = Math.round(homePrice * pct / 100);
            els.dpAmount.value = amt;
        } else {
            const amt = Math.min(homePrice, Math.max(0, +els.dpAmount.value || 0));
            const pct = homePrice > 0 ? (amt / homePrice * 100) : 0;
            els.dpPercent.value = pct.toFixed(1);
        }

        updatePMIBanner();
    }

    // Handle home price changes
    function handleHomePriceChange() {
        syncDownPayment(usePct);
        updatePropertyTax();
        updateInsurance();
    }

    // Update PMI banner
    function updatePMIBanner() {
        const dpPct = +els.dpPercent.value || 0;
        const needsPMI = dpPct < 20;
        els.pmiBanner.classList.toggle('hidden', !needsPMI);
        
        if (needsPMI) {
            els.pmiBanner.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <span>PMI Required - Down payment is ${dpPct.toFixed(1)}% (less than 20% of home value)</span>
            `;
        }
    }

    // Update property tax based on state
    function updatePropertyTax() {
        const homePrice = +els.homePrice.value || 0;
        const state = els.state.value;
        
        if (!state || !homePrice) return;
        
        const taxRate = stateTaxRates[state] || 1.0;
        const annualTax = Math.round(homePrice * (taxRate / 100));
        els.propertyTax.value = annualTax;
        
        // Update tooltip with state info
        const stateInfo = `${stateNames[state]} average: ${taxRate}%`;
        els.propertyTax.setAttribute('title', stateInfo);
    }

    // Update insurance estimate
    function updateInsurance() {
        const homePrice = +els.homePrice.value || 0;
        const estimate = Math.round(homePrice * 0.0024); // ~0.24% of home value
        els.homeInsurance.value = Math.max(600, Math.min(estimate, 3000));
    }

    // Term selection
    function setTerm(years) {
        activeTerm = years;
        $$('[data-term]').forEach(btn => {
            btn.classList.toggle('active', +btn.dataset.term === years);
        });
        els.termCustom.value = '';
        calculate();
    }

    // Handle custom term input
    function handleCustomTerm() {
        const customYears = +els.termCustom.value;
        if (customYears >= 1 && customYears <= 40) {
            activeTerm = customYears;
            $$('[data-term]').forEach(btn => btn.classList.remove('active'));
        }
        calculate();
    }

    // Toggle advanced options
    function toggleAdvanced() {
        const panel = els.advancedPanel;
        const arrow = els.advancedToggle.querySelector('.arrow');
        
        panel.classList.toggle('hidden');
        arrow.classList.toggle('rotated');
    }

    // Voice input functions
    function startVoiceInput(field) {
        if (!recognition) {
            showNotification('Voice input not supported in this browser', 'error');
            return;
        }
        
        showVoiceStatus();
        recognition.start();
    }

    function processVoiceCommand(transcript) {
        console.log('Voice command:', transcript);
        
        const numbers = transcript.match(/\d+(?:\.\d+)?/g);
        
        if (transcript.includes('home price') || transcript.includes('house price')) {
            if (numbers && numbers.length > 0) {
                let value = parseFloat(numbers[0]);
                if (value < 10000) value *= 1000;
                els.homePrice.value = value;
                handleHomePriceChange();
                showNotification(`Home price set to ${money(value)}`, 'success');
            }
        } else if (transcript.includes('down payment')) {
            if (numbers && numbers.length > 0) {
                let value = parseFloat(numbers[0]);
                if (transcript.includes('percent')) {
                    usePct = true;
                    switchDPMode(true);
                    els.dpPercent.value = value;
                    syncDownPayment(true);
                } else {
                    if (value < 1000) value *= 1000;
                    usePct = false;
                    switchDPMode(false);
                    els.dpAmount.value = value;
                    syncDownPayment(false);
                }
                showNotification('Down payment updated', 'success');
            }
        } else if (transcript.includes('interest rate') || transcript.includes('rate')) {
            if (numbers && numbers.length > 0) {
                const value = parseFloat(numbers[0]);
                els.interestRate.value = value;
                showNotification(`Interest rate set to ${value}%`, 'success');
            }
        } else if (transcript.includes('calculate')) {
            calculate();
            showNotification('Calculation completed!', 'success');
        } else {
            showNotification('Try saying: "home price 400000" or "interest rate 6.5"', 'info');
        }
        
        calculate();
    }

    function showVoiceStatus() {
        els.voiceStatus.classList.add('active');
    }

    function hideVoiceStatus() {
        els.voiceStatus.classList.remove('active');
    }

    // Main calculation function
    function calculate() {
        try {
            let result;
            
            switch (currentMode) {
                case 'payment':
                    result = calculatePayment();
                    break;
                case 'refinance':
                    result = calculateRefinance();
                    break;
                case 'affordability':
                    result = calculateAffordability();
                    break;
                default:
                    result = calculatePayment();
            }
            
            if (result) {
                currentCalculation = result;
                updateDisplay(result);
                generateInsights(result);
                if (currentMode === 'payment') {
                    updateCharts(result);
                    updateAmortizationTable(result);
                }
            }
        } catch (error) {
            console.error('Calculation error:', error);
            showNotification('Calculation error. Please check your inputs.', 'error');
        }
    }

    // Payment calculation
    function calculatePayment() {
        const homePrice = +els.homePrice.value || 0;
        const dpAmount = +els.dpAmount.value || 0;
        const loanAmount = Math.max(0, homePrice - dpAmount);
        const rate = (+els.interestRate.value || 0) / 100;
        const term = +els.termCustom.value || activeTerm;
        const months = term * 12;

        if (!homePrice || !rate || !term) return null;

        // Property costs
        const annualTax = +els.propertyTax.value || 0;
        const annualInsurance = +els.homeInsurance.value || 0;
        const pmiRate = (+els.pmiRate.value || 0) / 100;
        const monthlyHOA = +els.hoaFees.value || 0;
        const extraMonthly = +els.extraMonthly.value || 0;
        const extraOnce = +els.extraOnce.value || 0;

        // Calculate monthly P&I
        const monthlyRate = rate / 12;
        let monthlyPI = 0;
        if (monthlyRate > 0) {
            monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                       (Math.pow(1 + monthlyRate, months) - 1);
        } else {
            monthlyPI = loanAmount / months;
        }

        // Other monthly costs
        const monthlyTax = annualTax / 12;
        const monthlyInsurance = annualInsurance / 12;
        const dpPercent = homePrice > 0 ? (dpAmount / homePrice * 100) : 0;
        const needsPMI = dpPercent < 20;
        const monthlyPMI = needsPMI ? (loanAmount * pmiRate / 12) : 0;

        const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA;

        // Generate amortization schedule with extra payments
        const schedule = generateSchedule(loanAmount, monthlyRate, monthlyPI, months, extraMonthly, extraOnce);
        const totalInterest = schedule.reduce((sum, payment) => sum + payment.interest, 0);

        return {
            mode: 'payment',
            homePrice,
            dpAmount,
            dpPercent,
            loanAmount,
            rate: rate * 100,
            term,
            monthlyPI,
            monthlyTax,
            monthlyInsurance,
            monthlyPMI,
            monthlyHOA,
            totalMonthly,
            totalInterest,
            totalCost: loanAmount + totalInterest,
            needsPMI,
            schedule,
            extraMonthly,
            extraOnce
        };
    }

    // Refinance calculation
    function calculateRefinance() {
        const currentBalance = +els.currentBalance.value || 0;
        const currentRate = (+els.currentRate.value || 0) / 100;
        const remainingTerm = +els.remainingTerm.value || 0;
        const newRate = (+els.newRate.value || 0) / 100;
        const newTerm = +els.newTerm.value || 0;
        const closingCosts = +els.closingCosts.value || 0;

        if (!currentBalance || !currentRate || !newRate || !newTerm) return null;

        // Current payment
        const currentMonths = remainingTerm * 12;
        const currentMonthlyRate = currentRate / 12;
        const currentPayment = currentBalance * (currentMonthlyRate * Math.pow(1 + currentMonthlyRate, currentMonths)) / 
                              (Math.pow(1 + currentMonthlyRate, currentMonths) - 1);

        // New payment
        const newMonths = newTerm * 12;
        const newMonthlyRate = newRate / 12;
        const newPayment = currentBalance * (newMonthlyRate * Math.pow(1 + newMonthlyRate, newMonths)) / 
                          (Math.pow(1 + newMonthlyRate, newMonths) - 1);

        // Savings calculations
        const monthlySavings = currentPayment - newPayment;
        const breakEvenMonths = closingCosts / Math.abs(monthlySavings);
        
        return {
            mode: 'refinance',
            currentBalance,
            currentPayment,
            newPayment,
            monthlySavings,
            closingCosts,
            breakEvenMonths,
            rateDifference: (currentRate - newRate) * 100
        };
    }

    // Affordability calculation
    function calculateAffordability() {
        const annualIncome = +els.annualIncome.value || 0;
        const monthlyDebts = +els.monthlyDebts.value || 0;
        const downPayment = +els.downPaymentSaved.value || 0;
        const dtiRatio = (+els.dtiRatio.value || 36) / 100;

        if (!annualIncome) return null;

        const monthlyIncome = annualIncome / 12;
        const maxTotalPayment = monthlyIncome * dtiRatio;
        const maxMortgagePayment = maxTotalPayment - monthlyDebts;

        // Estimate maximum home price (assuming 6.5% rate, 30 years, typical costs)
        const estimatedRate = 0.065 / 12;
        const estimatedMonths = 30 * 12;
        const piRatio = estimatedRate * Math.pow(1 + estimatedRate, estimatedMonths) / 
                       (Math.pow(1 + estimatedRate, estimatedMonths) - 1);
        
        // Assume ~25% of payment goes to taxes/insurance/PMI
        const maxPI = maxMortgagePayment * 0.75;
        const maxLoanAmount = maxPI / piRatio;
        const maxHomePrice = maxLoanAmount + downPayment;

        return {
            mode: 'affordability',
            annualIncome,
            monthlyIncome,
            monthlyDebts,
            maxTotalPayment,
            maxMortgagePayment,
            maxHomePrice,
            downPayment,
            dtiRatio: dtiRatio * 100
        };
    }

    // Generate amortization schedule
    function generateSchedule(loanAmount, monthlyRate, monthlyPI, totalMonths, extraMonthly = 0, extraOnce = 0) {
        const schedule = [];
        let balance = loanAmount;
        let totalExtra = 0;

        for (let month = 1; month <= totalMonths && balance > 0; month++) {
            const interestPayment = balance * monthlyRate;
            let principalPayment = monthlyPI - interestPayment;
            let extraPayment = 0;

            // Add extra payments
            if (month === 1 && extraOnce > 0) {
                extraPayment += Math.min(extraOnce, balance - principalPayment);
            }
            if (extraMonthly > 0) {
                extraPayment += Math.min(extraMonthly, balance - principalPayment);
            }

            totalExtra += extraPayment;
            principalPayment += extraPayment;
            
            // Ensure we don't overpay
            if (principalPayment > balance) {
                principalPayment = balance;
                extraPayment = principalPayment - (monthlyPI - interestPayment);
            }

            balance = Math.max(0, balance - principalPayment);

            schedule.push({
                month,
                payment: monthlyPI + extraPayment,
                principal: principalPayment,
                interest: interestPayment,
                extra: extraPayment,
                balance
            });

            if (balance === 0) break;
        }

        return schedule;
    }

    // Update display based on calculation mode
    function updateDisplay(result) {
        switch (result.mode) {
            case 'payment':
                updatePaymentDisplay(result);
                break;
            case 'refinance':
                updateRefinanceDisplay(result);
                break;
            case 'affordability':
                updateAffordabilityDisplay(result);
                break;
        }
    }

    // Update payment mode display
    function updatePaymentDisplay(result) {
        els.totalPayment.textContent = money(result.totalMonthly);
        els.loanAmount.textContent = money(result.loanAmount);
        els.totalInterest.textContent = money(result.totalInterest);
        els.piAmount.textContent = money(result.monthlyPI);
        els.taxAmount.textContent = money(result.monthlyTax);
        els.insuranceAmount.textContent = money(result.monthlyInsurance);
        els.pmiAmount.textContent = money(result.monthlyPMI);
        els.hoaAmount.textContent = money(result.monthlyHOA);

        // Show/hide PMI row
        els.rowPmi.classList.toggle('hidden', !result.needsPMI);
    }

    // Update refinance mode display
    function updateRefinanceDisplay(result) {
        const savingsColor = result.monthlySavings > 0 ? '#10b981' : '#ef4444';
        
        els.totalPayment.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 0.9em; color: var(--color-text-secondary);">Monthly Savings</div>
                <div style="color: ${savingsColor}; font-weight: bold;">
                    ${result.monthlySavings > 0 ? '+' : ''}${money(Math.abs(result.monthlySavings))}
                </div>
                <div style="font-size: 0.8em; margin-top: 8px;">
                    Break-even: ${Math.ceil(result.breakEvenMonths)} months
                </div>
            </div>
        `;

        els.loanAmount.textContent = money(result.currentBalance);
        els.totalInterest.innerHTML = `
            <div>Current: ${money(result.currentPayment)}</div>
            <div>New: ${money(result.newPayment)}</div>
        `;
    }

    // Update affordability mode display
    function updateAffordabilityDisplay(result) {
        els.totalPayment.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 0.9em; color: var(--color-text-secondary);">Max Home Price</div>
                <div style="color: var(--color-success); font-weight: bold;">
                    ${money(result.maxHomePrice)}
                </div>
            </div>
        `;

        els.loanAmount.textContent = money(result.maxHomePrice - result.downPayment);
        els.totalInterest.innerHTML = `
            <div>Max Payment: ${money(result.maxMortgagePayment)}</div>
            <div>DTI Ratio: ${result.dtiRatio.toFixed(1)}%</div>
        `;
    }

    // Update charts
    function updateCharts(result) {
        if (result.mode !== 'payment') return;

        // Pie chart for payment breakdown
        const breakdownData = [
            result.monthlyPI,
            result.monthlyTax,
            result.monthlyInsurance,
            result.monthlyPMI,
            result.monthlyHOA
        ];
        const colors = ['#21808d', '#a84b2f', '#626c71', '#c0152f', '#94a3b8'];
        const labels = ['P&I', 'Taxes', 'Insurance', 'PMI', 'HOA'];
        
        drawPieChart(els.breakdownChart, breakdownData, colors, labels);

        // Line chart for balance over time
        const balancePoints = result.schedule
            .filter((_, i) => i % 12 === 0 || i === result.schedule.length - 1)
            .map((payment, i) => ({ x: i, y: payment.balance }));
        
        drawLineChart(els.amortizationChart, balancePoints);
    }

    // Draw pie chart
    function drawPieChart(canvas, data, colors, labels) {
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height);
        
        canvas.width = size;
        canvas.height = size;
        
        ctx.clearRect(0, 0, size, size);
        
        const total = data.reduce((sum, value) => sum + value, 0);
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = Math.min(centerX, centerY) * 0.8;
        
        let startAngle = -Math.PI / 2;
        
        data.forEach((value, index) => {
            if (value > 0) {
                const angle = (value / total) * 2 * Math.PI;
                
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
                ctx.closePath();
                
                ctx.fillStyle = colors[index];
                ctx.fill();
                
                startAngle += angle;
            }
        });

        // Update legend
        let legendHTML = '';
        data.forEach((value, index) => {
            if (value > 0) {
                legendHTML += `
                    <div class="legend-item">
                        <div class="legend-color" style="background: ${colors[index]}"></div>
                        <span>${labels[index]}: ${money(value)}</span>
                    </div>
                `;
            }
        });
        els.legendBreakdown.innerHTML = legendHTML;
    }

    // Draw line chart
    function drawLineChart(canvas, points) {
        if (points.length === 0) return;
        
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const padding = 40;
        const chartWidth = canvas.width - 2 * padding;
        const chartHeight = canvas.height - 2 * padding;
        
        const maxY = Math.max(...points.map(p => p.y));
        const maxX = Math.max(...points.map(p => p.x));
        
        // Draw axes
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, padding + chartHeight);
        ctx.lineTo(padding + chartWidth, padding + chartHeight);
        ctx.stroke();
        
        // Draw line
        if (points.length > 1) {
            ctx.strokeStyle = '#21808d';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            points.forEach((point, index) => {
                const x = padding + (point.x / maxX) * chartWidth;
                const y = padding + chartHeight - (point.y / maxY) * chartHeight;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
        }
    }

    // Update amortization table
    function updateAmortizationTable(result) {
        if (result.mode !== 'payment' || !result.schedule) return;

        let html = '';
        let currentYear = 1;
        let yearlyPayment = 0;
        let yearlyPrincipal = 0;
        let yearlyInterest = 0;
        let yearEndBalance = 0;

        result.schedule.forEach((payment, index) => {
            yearlyPayment += payment.payment;
            yearlyPrincipal += payment.principal;
            yearlyInterest += payment.interest;
            yearEndBalance = payment.balance;

            // End of year or last payment
            if (payment.month % 12 === 0 || index === result.schedule.length - 1) {
                if (currentYear <= 5) {
                    html += `
                        <tr>
                            <td>${currentYear}</td>
                            <td>${money(yearlyPayment)}</td>
                            <td>${money(yearlyPrincipal)}</td>
                            <td>${money(yearlyInterest)}</td>
                            <td>${money(yearEndBalance)}</td>
                        </tr>
                    `;
                }
                
                currentYear++;
                yearlyPayment = 0;
                yearlyPrincipal = 0;
                yearlyInterest = 0;
            }
        });

        els.amortizationBody.innerHTML = html;
    }

    // Generate AI insights
    function generateInsights(result) {
        const insights = [];

        if (result.mode === 'payment') {
            // PMI insight
            if (result.needsPMI) {
                const additionalDP = Math.max(0, result.homePrice * 0.2 - result.dpAmount);
                insights.push({
                    icon: 'fas fa-shield-alt',
                    type: 'tip',
                    title: 'Eliminate PMI',
                    message: `Increase down payment by ${money(additionalDP)} to reach 20% and eliminate PMI (saves ${money(result.monthlyPMI)}/month)`
                });
            }

            // Term comparison
            if (result.term > 15) {
                const rate15 = result.rate / 100 / 12;
                const months15 = 15 * 12;
                const payment15 = result.loanAmount * (rate15 * Math.pow(1 + rate15, months15)) / (Math.pow(1 + rate15, months15) - 1);
                const interest15 = payment15 * months15 - result.loanAmount;
                const interestSavings = result.totalInterest - interest15;
                
                insights.push({
                    icon: 'fas fa-calendar',
                    type: 'comparison',
                    title: 'Consider 15-Year Term',
                    message: `15-year loan: ${money(payment15)}/month, saves ${money(interestSavings)} in total interest`
                });
            }

            // Extra payment benefits
            if (result.extraMonthly > 0 || result.extraOnce > 0) {
                const withoutExtra = generateSchedule(result.loanAmount, result.rate / 100 / 12, result.monthlyPI, result.term * 12, 0, 0);
                const monthsSaved = withoutExtra.length - result.schedule.length;
                const interestSaved = withoutExtra.reduce((sum, p) => sum + p.interest, 0) - result.totalInterest;
                
                insights.push({
                    icon: 'fas fa-rocket',
                    type: 'savings',
                    title: 'Extra Payment Impact',
                    message: `Extra payments save ${monthsSaved} months and ${money(interestSaved)} in interest`
                });
            } else {
                insights.push({
                    icon: 'fas fa-plus-circle',
                    type: 'tip',
                    title: 'Consider Extra Payments',
                    message: `Adding $100/month could save years on your loan and thousands in interest`
                });
            }

            // Interest rate insight
            if (result.rate > 7) {
                insights.push({
                    icon: 'fas fa-percentage',
                    type: 'warning',
                    title: 'High Interest Rate',
                    message: `Consider improving credit score or shopping for better rates to reduce monthly payment`
                });
            }

        } else if (result.mode === 'refinance') {
            if (result.monthlySavings > 0) {
                insights.push({
                    icon: 'fas fa-chart-line',
                    type: 'savings',
                    title: 'Refinance Benefits',
                    message: `You'll break even in ${Math.ceil(result.breakEvenMonths)} months and save ${money(result.monthlySavings * 12)} annually`
                });
            } else {
                insights.push({
                    icon: 'fas fa-times-circle',
                    type: 'warning',
                    title: 'Not Recommended',
                    message: `Current refinance would increase monthly payment by ${money(Math.abs(result.monthlySavings))}`
                });
            }
        } else if (result.mode === 'affordability') {
            insights.push({
                icon: 'fas fa-home',
                type: 'info',
                title: 'Home Price Range',
                message: `Based on ${result.dtiRatio}% DTI ratio, you can afford homes up to ${money(result.maxHomePrice)}`
            });

            if (result.maxMortgagePayment < 1000) {
                insights.push({
                    icon: 'fas fa-exclamation-triangle',
                    type: 'warning',
                    title: 'Limited Budget',
                    message: `Consider increasing income or reducing existing debts to improve affordability`
                });
            }
        }

        // Render insights
        let insightsHTML = '';
        insights.forEach(insight => {
            const colorClass = {
                'tip': 'insight-tip',
                'savings': 'insight-savings',
                'warning': 'insight-warning',
                'comparison': 'insight-comparison',
                'info': 'insight-info'
            }[insight.type];

            insightsHTML += `
                <li class="insight-item ${colorClass}">
                    <div class="insight-icon">
                        <i class="${insight.icon}"></i>
                    </div>
                    <div class="insight-content">
                        <strong>${insight.title}</strong>
                        <p>${insight.message}</p>
                    </div>
                </li>
            `;
        });

        els.insightsList.innerHTML = insightsHTML;
    }

    // Show full schedule modal
    function showFullSchedule() {
        if (!currentCalculation || !currentCalculation.schedule) return;

        let html = '';
        currentCalculation.schedule.forEach(payment => {
            html += `
                <tr>
                    <td>${payment.month}</td>
                    <td>${money(payment.payment)}</td>
                    <td>${money(payment.principal)}</td>
                    <td>${money(payment.interest)}</td>
                    <td>${money(payment.extra)}</td>
                    <td>${money(payment.balance)}</td>
                </tr>
            `;
        });

        els.fullScheduleBody.innerHTML = html;
        els.scheduleModal.showModal();
    }

    // Email results
    function emailResults() {
        if (!currentCalculation) return;

        let subject, body;

        if (currentCalculation.mode === 'payment') {
            subject = encodeURIComponent(`Mortgage Calculator Results - ${money(currentCalculation.totalMonthly)}/month`);
            body = encodeURIComponent(
                `Mortgage Calculator Results from Finguid HomeLoan Pro\n\n` +
                `Home Price: ${money(currentCalculation.homePrice)}\n` +
                `Down Payment: ${money(currentCalculation.dpAmount)} (${currentCalculation.dpPercent.toFixed(1)}%)\n` +
                `Loan Amount: ${money(currentCalculation.loanAmount)}\n` +
                `Interest Rate: ${currentCalculation.rate.toFixed(2)}%\n` +
                `Term: ${currentCalculation.term} years\n\n` +
                `Monthly Payment Breakdown:\n` +
                `Principal & Interest: ${money(currentCalculation.monthlyPI)}\n` +
                `Property Tax: ${money(currentCalculation.monthlyTax)}\n` +
                `Insurance: ${money(currentCalculation.monthlyInsurance)}\n` +
                `PMI: ${money(currentCalculation.monthlyPMI)}\n` +
                `HOA: ${money(currentCalculation.monthlyHOA)}\n` +
                `Total Monthly: ${money(currentCalculation.totalMonthly)}\n\n` +
                `Total Interest: ${money(currentCalculation.totalInterest)}\n\n` +
                `Calculate your mortgage at: https://www.finguid.com/mortgage-calculator`
            );
        }

        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }

    // Share results
    function shareResults() {
        if (!navigator.share) {
            // Fallback: copy to clipboard
            copyToClipboard();
            return;
        }

        const shareData = {
            title: 'Mortgage Calculator Results',
            text: `Check out my mortgage calculation: ${money(currentCalculation.totalMonthly)}/month`,
            url: window.location.href
        };

        navigator.share(shareData)
            .then(() => showNotification('Results shared successfully!', 'success'))
            .catch(() => copyToClipboard());
    }

    // Copy results to clipboard
    function copyToClipboard() {
        const text = `My mortgage payment: ${money(currentCalculation.totalMonthly)}/month. Calculate yours at ${window.location.href}`;
        
        navigator.clipboard.writeText(text)
            .then(() => showNotification('Results copied to clipboard!', 'success'))
            .catch(() => showNotification('Unable to copy results', 'error'));
    }

    // Comparison functions
    function addComparison() {
        if (!currentCalculation) return;

        const name = els.scenarioName.value.trim() || `Scenario ${comparisons.length + 1}`;
        
        comparisons.push({
            name,
            ...currentCalculation
        });

        els.scenarioName.value = '';
        renderComparisons();
        showNotification('Scenario added to comparison', 'success');
    }

    function clearComparisons() {
        comparisons = [];
        renderComparisons();
        showNotification('All scenarios cleared', 'info');
    }

    function renderComparisons() {
        if (comparisons.length === 0) {
            els.comparisonGrid.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">No scenarios to compare. Add scenarios above.</p>';
            return;
        }

        let html = '';
        comparisons.forEach((scenario, index) => {
            html += `
                <div class="comparison-card">
                    <div class="comparison-header">
                        <h4>${scenario.name}</h4>
                        <button class="remove-scenario" onclick="removeComparison(${index})" title="Remove">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="comparison-details">
                        <div class="detail-row">
                            <span>Monthly Payment:</span>
                            <strong>${money(scenario.totalMonthly)}</strong>
                        </div>
                        <div class="detail-row">
                            <span>Loan Amount:</span>
                            <span>${money(scenario.loanAmount)}</span>
                        </div>
                        <div class="detail-row">
                            <span>Interest Rate:</span>
                            <span>${scenario.rate.toFixed(2)}%</span>
                        </div>
                        <div class="detail-row">
                            <span>Term:</span>
                            <span>${scenario.term} years</span>
                        </div>
                        <div class="detail-row">
                            <span>Total Interest:</span>
                            <span>${money(scenario.totalInterest)}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        els.comparisonGrid.innerHTML = html;
    }

    // Load predefined scenarios
    function loadScenario(scenarioType) {
        const baseValues = {
            homePrice: 400000,
            dpAmount: 80000,
            interestRate: 6.75,
            state: 'CA'
        };

        // Set base values
        Object.keys(baseValues).forEach(key => {
            if (els[key]) els[key].value = baseValues[key];
        });

        clearComparisons();

        switch (scenarioType) {
            case '15year':
                // Add 30-year scenario
                setTerm(30);
                calculate();
                els.scenarioName.value = '30-Year Fixed';
                addComparison();
                
                // Add 15-year scenario
                setTerm(15);
                calculate();
                els.scenarioName.value = '15-Year Fixed';
                addComparison();
                break;

            case 'rates':
                // Compare different rates
                [6.0, 6.5, 7.0, 7.5].forEach(rate => {
                    els.interestRate.value = rate;
                    calculate();
                    els.scenarioName.value = `${rate}% Rate`;
                    addComparison();
                });
                break;

            case 'downpayment':
                // Compare different down payments
                [50000, 80000, 100000].forEach(dp => {
                    els.dpAmount.value = dp;
                    syncDownPayment(false);
                    calculate();
                    els.scenarioName.value = `${money(dp)} Down`;
                    addComparison();
                });
                break;

            case 'extraPayment':
                // Compare with and without extra payments
                els.extraMonthly.value = 0;
                calculate();
                els.scenarioName.value = 'No Extra Payment';
                addComparison();

                els.extraMonthly.value = 200;
                calculate();
                els.scenarioName.value = '$200 Extra/Month';
                addComparison();
                break;
        }

        showNotification(`${scenarioType} scenarios loaded`, 'success');
    }

    // Remove comparison
    window.removeComparison = function(index) {
        comparisons.splice(index, 1);
        renderComparisons();
    };

    // Reset form
    function resetForm() {
        // Reset inputs to defaults
        els.homePrice.value = 400000;
        els.dpAmount.value = 80000;
        els.dpPercent.value = 20;
        els.interestRate.value = 6.75;
        els.state.value = '';
        els.propertyTax.value = 0;
        els.homeInsurance.value = 960;
        els.pmiRate.value = 0.8;
        els.hoaFees.value = 0;
        els.extraMonthly.value = 0;
        els.extraOnce.value = 0;
        els.termCustom.value = '';

        // Reset UI state
        setTerm(30);
        switchDPMode(false);
        switchMode('payment');
        clearComparisons();

        // Recalculate
        updatePropertyTax();
        updateInsurance();
        calculate();

        showNotification('Form reset to defaults', 'info');
    }

    // Utility functions
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

    function showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    function showTooltip(event) {
        const tooltip = event.target.dataset.tooltip;
        if (!tooltip) return;

        const tooltipEl = document.createElement('div');
        tooltipEl.className = 'tooltip-popup';
        tooltipEl.textContent = tooltip;
        
        document.body.appendChild(tooltipEl);
        
        const rect = event.target.getBoundingClientRect();
        tooltipEl.style.left = rect.left + rect.width / 2 - tooltipEl.offsetWidth / 2 + 'px';
        tooltipEl.style.top = rect.top - tooltipEl.offsetHeight - 10 + 'px';
    }

    function hideTooltip() {
        const tooltip = document.querySelector('.tooltip-popup');
        if (tooltip) {
            document.body.removeChild(tooltip);
        }
    }

    function toggleMobileMenu() {
        const navMenu = $('#nav-menu');
        const hamburger = $('#hamburger');
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    }

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', init);

    // Export functions for global access
    window.mortgageCalc = {
        loadScenario,
        removeComparison
    };

    // Analytics tracking
    function trackEvent(action, category = 'Calculator') {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: category,
                event_label: currentMode
            });
        }
    }

    // Track calculator usage
    document.addEventListener('DOMContentLoaded', () => {
        els.calculateBtn.addEventListener('click', () => trackEvent('calculate'));
        els.modeTabs.forEach(tab => {
            tab.addEventListener('click', () => trackEvent('mode_switch', 'Navigation'));
        });
    });

})();
