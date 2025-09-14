/* HomeLoan Pro - Enhanced Mortgage Calculator with Advanced Features
   Features: Bi-weekly payments, Credit score impact, Closing costs, Rent vs Buy, Investment analysis
   Enhanced with side-by-side layout and comprehensive financial tools
   SEO & Performance Optimized for US Market */

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

    // Credit Score Impact Data
    const creditScoreRates = {
        800: { rate: 6.43, pmiRate: 0.30 },
        780: { rate: 6.43, pmiRate: 0.32 }, 
        760: { rate: 6.54, pmiRate: 0.35 },
        740: { rate: 6.63, pmiRate: 0.40 },
        720: { rate: 6.79, pmiRate: 0.45 },
        700: { rate: 6.83, pmiRate: 0.50 },
        680: { rate: 6.98, pmiRate: 0.60 },
        660: { rate: 7.04, pmiRate: 0.70 },
        640: { rate: 7.20, pmiRate: 0.85 },
        620: { rate: 7.34, pmiRate: 1.05 }
    };

    // Closing Costs by State
    const closingCostsByState = {
        CA: { titleInsurance: 0.002, recordingFees: 250, transferTax: 0.0011, avgAttorneyFees: 1200 },
        TX: { titleInsurance: 0.00075, recordingFees: 180, transferTax: 0, avgAttorneyFees: 800 },
        FL: { titleInsurance: 0.00125, recordingFees: 200, transferTax: 0.007, avgAttorneyFees: 900 },
        NY: { titleInsurance: 0.0015, recordingFees: 300, transferTax: 0.004, avgAttorneyFees: 1500 },
        IL: { titleInsurance: 0.0018, recordingFees: 220, transferTax: 0.001, avgAttorneyFees: 1100 },
        // Default for other states
        DEFAULT: { titleInsurance: 0.0015, recordingFees: 200, transferTax: 0.001, avgAttorneyFees: 1000 }
    };

    // State names for tooltips
    const stateNames = {
        AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
        CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
        IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
        ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
        MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
        NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
        OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
        SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
        WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'
    };

    // Calculator state
    let currentMode = 'payment';
    let activeTerm = 30;
    let usePct = false;
    let currentPaymentFreq = 'monthly';
    let comparisons = [];
    let recognition = null;
    let currentCalculation = null;
    let payoffChart = null;
    let breakdownChart = null;
    let amortizationChart = null;

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
        
        // Credit score elements
        creditScore: $('#credit-score'),
        useCreditScore: $('#use-credit-score'),
        
        // Payment frequency elements
        monthlyToggle: $('#monthly-toggle'),
        biweeklyToggle: $('#biweekly-toggle'),
        biweeklyResults: $('#biweekly-results'),
        
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
        
        // Rent vs Buy inputs
        homeValue: $('#home-value'),
        monthlyRent: $('#monthly-rent'),
        rentIncrease: $('#rent-increase'),
        homeAppreciation: $('#home-appreciation'),
        analysisYears: $('#analysis-years'),
        
        // Investment inputs
        investmentPrice: $('#investment-price'),
        investmentDown: $('#investment-down'),
        monthlyRentalIncome: $('#monthly-rental-income'),
        vacancyRate: $('#vacancy-rate'),
        operatingExpenses: $('#operating-expenses'),
        
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
        scenarioBtns: $$('.scenario-btn'),
        
        // Enhanced sections
        creditScoreImpact: $('#credit-score-impact'),
        closingCostsSection: $('#closing-costs')
    };

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
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

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
        els.tabAmount?.addEventListener('click', () => switchDPMode(false));
        els.tabPercent?.addEventListener('click', () => switchDPMode(true));

        // Payment frequency toggle
        els.monthlyToggle?.addEventListener('click', () => setPaymentFreq('monthly'));
        els.biweeklyToggle?.addEventListener('click', () => setPaymentFreq('biweekly'));

        // Credit score slider
        els.creditScore?.addEventListener('input', updateCreditScoreDisplay);
        els.useCreditScore?.addEventListener('change', calculate);

        // Input synchronization
        els.homePrice?.addEventListener('input', handleHomePriceChange);
        els.dpAmount?.addEventListener('input', () => syncDownPayment(false));
        els.dpPercent?.addEventListener('input', () => syncDownPayment(true));
        els.state?.addEventListener('change', updatePropertyTax);

        // Term selection
        els.termButtons?.addEventListener('click', (e) => {
            const btn = e.target.closest('.chip[data-term]');
            if (btn) setTerm(+btn.dataset.term);
        });
        
        els.termCustom?.addEventListener('input', handleCustomTerm);

        // Advanced options
        els.advancedToggle?.addEventListener('click', toggleAdvanced);

        // Auto-calculation on input changes
        const autoCalcInputs = [
            els.homePrice, els.dpAmount, els.dpPercent, els.interestRate,
            els.propertyTax, els.homeInsurance, els.pmiRate, els.hoaFees,
            els.extraMonthly, els.extraOnce, els.creditScore
        ];
        
        autoCalcInputs.forEach(input => {
            if (input) {
                input.addEventListener('input', debounce(calculate, 300));
            }
        });

        // Action buttons
        els.calculateBtn?.addEventListener('click', calculate);
        els.resetBtn?.addEventListener('click', resetForm);
        els.emailBtn?.addEventListener('click', emailResults);
        els.shareBtn?.addEventListener('click', shareResults);
        els.printBtn?.addEventListener('click', () => window.print());
        els.viewFullSchedule?.addEventListener('click', showFullSchedule);
        els.closeSchedule?.addEventListener('click', () => els.scheduleModal?.close());

        // Voice buttons
        els.voiceBtns.forEach(btn => {
            btn.addEventListener('click', () => startVoiceInput(btn.dataset.field));
        });

        // Comparison
        els.addScenario?.addEventListener('click', addComparison);
        els.clearScenarios?.addEventListener('click', clearComparisons);

        // Modal backdrop click
        els.scheduleModal?.addEventListener('click', (e) => {
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
        updateCreditScoreDisplay();
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
            const contentId = content.id.replace('-mode', '');
            content.classList.toggle('active', contentId === mode || content.id === `${mode}-mode`);
        });

        // Update calculate button text
        const btnText = {
            'payment': 'Calculate Payment',
            'refinance': 'Calculate Savings',
            'affordability': 'Calculate Affordability',
            'rent-vs-buy': 'Compare Rent vs Buy',
            'investment': 'Analyze Investment'
        };
        
        if (els.calculateBtn) {
            els.calculateBtn.innerHTML = `<i class="fas fa-calculator"></i> ${btnText[mode]}`;
        }

        calculate();
    }

    // Payment frequency toggle
    function setPaymentFreq(freq) {
        currentPaymentFreq = freq;
        
        // Update button states
        els.monthlyToggle?.classList.toggle('active', freq === 'monthly');
        els.biweeklyToggle?.classList.toggle('active', freq === 'biweekly');
        
        // Show/hide bi-weekly results
        if (els.biweeklyResults) {
            if (freq === 'biweekly') {
                els.biweeklyResults.classList.remove('hidden');
                updateBiWeeklyDisplay();
            } else {
                els.biweeklyResults.classList.add('hidden');
            }
        }
        
        calculate();
    }

    // Credit score functions
    function updateCreditScoreDisplay() {
        const creditScore = +els.creditScore?.value || 740;
        const useCreditForRate = els.useCreditScore?.checked;
        
        // Update display
        const creditValue = $('.credit-value');
        const creditRating = $('.credit-rating');
        
        if (creditValue) creditValue.textContent = creditScore;
        if (creditRating) {
            let rating = 'Fair';
            if (creditScore >= 800) rating = 'Exceptional';
            else if (creditScore >= 740) rating = 'Very Good';
            else if (creditScore >= 670) rating = 'Good';
            else if (creditScore >= 580) rating = 'Fair';
            else rating = 'Poor';
            
            creditRating.textContent = rating;
        }
        
        // Update interest rate if enabled
        if (useCreditForRate && els.interestRate) {
            const rates = Object.keys(creditScoreRates).map(Number).sort((a, b) => b - a);
            const closestScore = rates.find(score => creditScore >= score) || 620;
            const rateData = creditScoreRates[closestScore];
            
            if (rateData) {
                els.interestRate.value = rateData.rate;
            }
        }
        
        // Update credit score impact display
        updateCreditScoreImpact(creditScore);
    }

    function updateCreditScoreImpact(currentScore) {
        const creditSection = els.creditScoreImpact;
        if (!creditSection) return;
        
        const homePrice = +els.homePrice?.value || 400000;
        const dpAmount = +els.dpAmount?.value || 80000;
        const loanAmount = homePrice - dpAmount;
        
        const scenarios = [];
        for (const [score, data] of Object.entries(creditScoreRates)) {
            const scenarioScore = parseInt(score);
            if (scenarioScore >= currentScore - 60 && scenarioScore <= currentScore + 60) {
                const monthlyRate = data.rate / 100 / 12;
                const months = 30 * 12;
                
                // Calculate monthly PI payment
                let monthlyPayment = 0;
                if (monthlyRate > 0) {
                    monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                                   (Math.pow(1 + monthlyRate, months) - 1);
                }
                
                // Calculate PMI if down payment < 20%
                const dpPercent = ((homePrice - loanAmount) / homePrice) * 100;
                const monthlyPMI = dpPercent < 20 ? (loanAmount * data.pmiRate / 100 / 12) : 0;
                
                scenarios.push({
                    creditScore: scenarioScore,
                    interestRate: data.rate,
                    monthlyPayment: monthlyPayment + monthlyPMI,
                    monthlyPMI,
                    totalCost: (monthlyPayment + monthlyPMI) * months
                });
            }
        }
        
        scenarios.sort((a, b) => b.creditScore - a.creditScore);
        
        let html = `
            <div class="credit-scenarios">
        `;
        
        scenarios.forEach((scenario, index) => {
            const isCurrentScore = scenario.creditScore <= currentScore && 
                                 (index === scenarios.length - 1 || scenarios[index + 1].creditScore > currentScore);
            
            html += `
                <div class="credit-scenario ${isCurrentScore ? 'current' : ''}">
                    <div class="score-badge">${scenario.creditScore}+</div>
                    <div class="rate-info">
                        <span class="rate">${scenario.interestRate}% APR</span>
                        <span class="payment">${money(scenario.monthlyPayment)}/mo</span>
                    </div>
                    ${scenario.monthlyPMI > 0 ? `<div class="pmi">PMI: ${money(scenario.monthlyPMI)}</div>` : ''}
                </div>
            `;
        });
        
        html += '</div>';
        creditSection.innerHTML = html;
    }

    // Closing costs calculation
    function calculateClosingCosts(homePrice, loanAmount, state) {
        const stateData = closingCostsByState[state] || closingCostsByState['DEFAULT'];
        
        const costs = {
            // Lender Fees
            originationFee: loanAmount * 0.01, // 1% origination fee
            appraisalFee: homePrice < 500000 ? 500 : 750,
            creditReportFee: 50,
            floodCertification: 25,
            taxService: 75,
            
            // Third Party Fees
            titleInsurance: homePrice * stateData.titleInsurance,
            homeInspection: 400,
            surveyFee: 350,
            recordingFees: stateData.recordingFees,
            attorneyFees: stateData.avgAttorneyFees,
            
            // Government Fees
            transferTax: homePrice * stateData.transferTax,
            
            // Prepaid Items
            homeownersInsurance: (homePrice * 0.0024) / 12, // 1 month
            propertyTaxes: (homePrice * (stateTaxRates[state] || 1.0) / 100) / 12 * 2, // 2 months
            mortgageInsurance: loanAmount * 0.005 / 12, // 1 month if applicable
            
            // Escrow Deposits
            escrowInsurance: (homePrice * 0.0024) / 12 * 2, // 2 months
            escrowTaxes: (homePrice * (stateTaxRates[state] || 1.0) / 100) / 12 * 2 // 2 months
        };
        
        // Calculate total
        const totalClosingCosts = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
        const cashToClose = totalClosingCosts + (homePrice - loanAmount); // Plus down payment
        
        return {
            itemizedCosts: costs,
            totalClosingCosts,
            cashToClose,
            percentOfLoan: (totalClosingCosts / loanAmount) * 100
        };
    }

    function updateClosingCostsDisplay() {
        const closingSection = els.closingCostsSection;
        if (!closingSection) return;
        
        const homePrice = +els.homePrice?.value || 400000;
        const dpAmount = +els.dpAmount?.value || 80000;
        const loanAmount = homePrice - dpAmount;
        const state = els.state?.value || 'CA';
        
        const closingData = calculateClosingCosts(homePrice, loanAmount, state);
        
        let html = `
            <div class="closing-summary">
                <div class="total-cost">
                    <span class="label">Total Closing Costs:</span>
                    <span class="amount">${money(closingData.totalClosingCosts)}</span>
                </div>
                <div class="cash-to-close">
                    <span class="label">Cash to Close:</span>
                    <span class="amount highlight">${money(closingData.cashToClose)}</span>
                </div>
            </div>
            
            <div class="cost-categories">
        `;
        
        // Group costs by category
        const categories = [
            {
                name: 'Lender Fees',
                items: ['originationFee', 'appraisalFee', 'creditReportFee', 'floodCertification', 'taxService']
            },
            {
                name: 'Third Party Fees',
                items: ['titleInsurance', 'homeInspection', 'surveyFee', 'recordingFees', 'attorneyFees']
            },
            {
                name: 'Government Fees',
                items: ['transferTax']
            },
            {
                name: 'Prepaid Items',
                items: ['homeownersInsurance', 'propertyTaxes', 'mortgageInsurance']
            }
        ];
        
        categories.forEach(category => {
            html += `<div class="cost-category">
                        <h4>${category.name}</h4>`;
            
            category.items.forEach(item => {
                const cost = closingData.itemizedCosts[item];
                if (cost > 0) {
                    const label = item.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    html += `<div class="cost-item">
                                <span>${label}:</span>
                                <span>${money(cost)}</span>
                            </div>`;
                }
            });
            
            html += '</div>';
        });
        
        html += `
            </div>
            <div class="closing-tips">
                <h4>💡 Money Saving Tips</h4>
                <ul>
                    <li>Shop around for title insurance and attorney fees</li>
                    <li>Ask seller to contribute to closing costs</li>
                    <li>Consider lender credits to reduce upfront costs</li>
                    <li>Review Loan Estimate carefully for accuracy</li>
                </ul>
            </div>
        `;
        
        closingSection.innerHTML = html;
    }

    // Bi-weekly payment calculations
    function calculateBiWeeklyPayments(loanAmount, annualRate, monthlyPayment) {
        const biWeeklyPayment = monthlyPayment / 2;
        const biWeeklyRate = annualRate / 26; // 26 payments per year
        
        let balance = loanAmount;
        let paymentNumber = 0;
        let totalInterest = 0;
        
        // Calculate bi-weekly schedule
        while (balance > 0 && paymentNumber < 780) { // Max 30 years worth
            const interestPayment = balance * biWeeklyRate;
            let principalPayment = biWeeklyPayment - interestPayment;
            
            if (principalPayment > balance) {
                principalPayment = balance;
            }
            
            totalInterest += interestPayment;
            balance -= principalPayment;
            paymentNumber++;
            
            if (balance <= 0) break;
        }
        
        return {
            biWeeklyPayment: biWeeklyPayment,
            totalPayments: paymentNumber,
            yearsToPayoff: paymentNumber / 26,
            totalInterest: totalInterest
        };
    }

    function updateBiWeeklyDisplay() {
        if (!currentCalculation) return;
        
        const { loanAmount, rate, monthlyPI, totalInterest, term } = currentCalculation;
        const biWeeklyData = calculateBiWeeklyPayments(loanAmount, rate / 100, monthlyPI);
        
        // Update display elements
        const monthlyAmount = $('#monthly-amount');
        const monthlyPayoff = $('#monthly-payoff');
        const monthlyInterest = $('#monthly-interest');
        const biweeklyAmount = $('#biweekly-amount');
        const biweeklyPayoff = $('#biweekly-payoff');
        const biweeklyInterest = $('#biweekly-interest');
        const timeSaved = $('#time-saved');
        const interestSaved = $('#interest-saved');
        
        if (monthlyAmount) monthlyAmount.textContent = money(monthlyPI);
        if (monthlyPayoff) monthlyPayoff.textContent = `${term} years`;
        if (monthlyInterest) monthlyInterest.textContent = money(totalInterest);
        
        if (biweeklyAmount) biweeklyAmount.textContent = money(biWeeklyData.biWeeklyPayment);
        if (biweeklyPayoff) biweeklyPayoff.textContent = `${biWeeklyData.yearsToPayoff.toFixed(1)} years`;
        if (biweeklyInterest) biweeklyInterest.textContent = money(biWeeklyData.totalInterest);
        
        // Calculate savings
        const timesSaved = term - biWeeklyData.yearsToPayoff;
        const interestSavings = totalInterest - biWeeklyData.totalInterest;
        
        if (timeSaved) timeSaved.textContent = `${timesSaved.toFixed(1)} years`;
        if (interestSaved) interestSaved.textContent = money(interestSavings);
    }

    // Down payment mode switching
    function switchDPMode(usePercent) {
        usePct = usePercent;
        els.tabAmount?.classList.toggle('active', !usePercent);
        els.tabPercent?.classList.toggle('active', usePercent);
        els.dpAmountWrap?.classList.toggle('hidden', usePercent);
        els.dpPercentWrap?.classList.toggle('hidden', !usePercent);
        syncDownPayment(usePercent);
    }

    // Sync down payment inputs
    function syncDownPayment(fromPercent) {
        const homePrice = +els.homePrice?.value || 0;
        
        if (fromPercent) {
            const pct = Math.min(100, Math.max(0, +els.dpPercent?.value || 0));
            const amt = Math.round(homePrice * pct / 100);
            if (els.dpAmount) els.dpAmount.value = amt;
        } else {
            const amt = Math.min(homePrice, Math.max(0, +els.dpAmount?.value || 0));
            const pct = homePrice > 0 ? (amt / homePrice * 100) : 0;
            if (els.dpPercent) els.dpPercent.value = pct.toFixed(1);
        }
        
        updatePMIBanner();
    }

    // Handle home price changes
    function handleHomePriceChange() {
        syncDownPayment(usePct);
        updatePropertyTax();
        updateInsurance();
        updateClosingCostsDisplay();
    }

    // Update PMI banner
    function updatePMIBanner() {
        const dpPct = +els.dpPercent?.value || 0;
        const needsPMI = dpPct < 20;
        
        if (els.pmiBanner) {
            els.pmiBanner.classList.toggle('hidden', !needsPMI);
            
            if (needsPMI) {
                els.pmiBanner.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    PMI Required - Down payment is ${dpPct.toFixed(1)}% (less than 20% of home value)
                `;
            }
        }
    }

    // Update property tax based on state
    function updatePropertyTax() {
        const homePrice = +els.homePrice?.value || 0;
        const state = els.state?.value;
        
        if (!state || !homePrice || !els.propertyTax) return;
        
        const taxRate = stateTaxRates[state] || 1.0;
        const annualTax = Math.round(homePrice * (taxRate / 100));
        els.propertyTax.value = annualTax;
        
        // Update tooltip with state info
        const stateInfo = `${stateNames[state]} average: ${taxRate}%`;
        els.propertyTax.setAttribute('title', stateInfo);
        
        updateClosingCostsDisplay();
    }

    // Update insurance estimate
    function updateInsurance() {
        const homePrice = +els.homePrice?.value || 0;
        const estimate = Math.round(homePrice * 0.0024); // ~0.24% of home value
        
        if (els.homeInsurance) {
            els.homeInsurance.value = Math.max(600, Math.min(estimate, 3000));
        }
    }

    // Term selection
    function setTerm(years) {
        activeTerm = years;
        
        $$('[data-term]').forEach(btn => {
            btn.classList.toggle('active', +btn.dataset.term === years);
        });
        
        if (els.termCustom) els.termCustom.value = '';
        calculate();
    }

    // Handle custom term input
    function handleCustomTerm() {
        const customYears = +els.termCustom?.value;
        
        if (customYears >= 1 && customYears <= 40) {
            activeTerm = customYears;
            $$('[data-term]').forEach(btn => btn.classList.remove('active'));
        }
        
        calculate();
    }

    // Toggle advanced options
    function toggleAdvanced() {
        const panel = els.advancedPanel;
        const arrow = els.advancedToggle?.querySelector('.arrow');
        
        if (panel) {
            panel.classList.toggle('hidden');
        }
        
        if (arrow) {
            arrow.classList.toggle('rotated');
        }
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
                if (els.homePrice) {
                    els.homePrice.value = value;
                    handleHomePriceChange();
                }
                showNotification(`Home price set to ${money(value)}`, 'success');
            }
        } else if (transcript.includes('down payment')) {
            if (numbers && numbers.length > 0) {
                let value = parseFloat(numbers[0]);
                
                if (transcript.includes('percent')) {
                    usePct = true;
                    switchDPMode(true);
                    if (els.dpPercent) els.dpPercent.value = value;
                    syncDownPayment(true);
                } else {
                    if (value < 1000) value *= 1000;
                    usePct = false;
                    switchDPMode(false);
                    if (els.dpAmount) els.dpAmount.value = value;
                    syncDownPayment(false);
                }
                showNotification('Down payment updated', 'success');
            }
        } else if (transcript.includes('interest rate') || transcript.includes('rate')) {
            if (numbers && numbers.length > 0) {
                const value = parseFloat(numbers[0]);
                if (els.interestRate) els.interestRate.value = value;
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
        if (els.voiceStatus) {
            els.voiceStatus.classList.add('active');
        }
    }

    function hideVoiceStatus() {
        if (els.voiceStatus) {
            els.voiceStatus.classList.remove('active');
        }
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
                case 'rent-vs-buy':
                    result = calculateRentVsBuy();
                    break;
                case 'investment':
                    result = calculateInvestment();
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
                    updateClosingCostsDisplay();
                    
                    if (currentPaymentFreq === 'biweekly') {
                        updateBiWeeklyDisplay();
                    }
                }
            }
        } catch (error) {
            console.error('Calculation error:', error);
            showNotification('Calculation error. Please check your inputs.', 'error');
        }
    }

    // Payment calculation
    function calculatePayment() {
        const homePrice = +els.homePrice?.value || 0;
        const dpAmount = +els.dpAmount?.value || 0;
        const loanAmount = Math.max(0, homePrice - dpAmount);
        let rate = (+els.interestRate?.value || 0) / 100;
        const term = +els.termCustom?.value || activeTerm;
        const months = term * 12;
        
        // Apply credit score adjustment if enabled
        if (els.useCreditScore?.checked) {
            const creditScore = +els.creditScore?.value || 740;
            const rates = Object.keys(creditScoreRates).map(Number).sort((a, b) => b - a);
            const closestScore = rates.find(score => creditScore >= score) || 620;
            const rateData = creditScoreRates[closestScore];
            
            if (rateData) {
                rate = rateData.rate / 100;
            }
        }
        
        if (!homePrice || !rate || !term) return null;
        
        // Property costs
        const annualTax = +els.propertyTax?.value || 0;
        const annualInsurance = +els.homeInsurance?.value || 0;
        const pmiRate = (+els.pmiRate?.value || 0) / 100;
        const monthlyHOA = +els.hoaFees?.value || 0;
        const extraMonthly = +els.extraMonthly?.value || 0;
        const extraOnce = +els.extraOnce?.value || 0;
        
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
        const currentBalance = +els.currentBalance?.value || 0;
        const currentRate = (+els.currentRate?.value || 0) / 100;
        const remainingTerm = +els.remainingTerm?.value || 0;
        const newRate = (+els.newRate?.value || 0) / 100;
        const newTerm = +els.newTerm?.value || 0;
        const closingCosts = +els.closingCosts?.value || 0;
        
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
        const annualIncome = +els.annualIncome?.value || 0;
        const monthlyDebts = +els.monthlyDebts?.value || 0;
        const downPayment = +els.downPaymentSaved?.value || 0;
        const dtiRatio = (+els.dtiRatio?.value || 36) / 100;
        
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

    // Rent vs Buy calculation
    function calculateRentVsBuy() {
        const homeValue = +els.homeValue?.value || 0;
        const monthlyRent = +els.monthlyRent?.value || 0;
        const rentIncrease = (+els.rentIncrease?.value || 3) / 100;
        const homeAppreciation = (+els.homeAppreciation?.value || 3.5) / 100;
        const analysisYears = +els.analysisYears?.value || 10;
        
        if (!homeValue || !monthlyRent) return null;
        
        // Simplified buy vs rent calculation
        const downPayment = homeValue * 0.2; // Assume 20% down
        const loanAmount = homeValue - downPayment;
        const mortgageRate = 0.065 / 12; // 6.5% annual
        const months = 30 * 12;
        
        // Monthly mortgage payment
        const monthlyMortgage = loanAmount * (mortgageRate * Math.pow(1 + mortgageRate, months)) / 
                               (Math.pow(1 + mortgageRate, months) - 1);
        
        // Additional monthly costs for buying
        const monthlyTax = homeValue * 0.012 / 12; // 1.2% annual property tax
        const monthlyInsurance = homeValue * 0.0024 / 12; // 0.24% annual insurance
        const monthlyMaintenance = homeValue * 0.01 / 12; // 1% annual maintenance
        
        const totalMonthlyCostBuy = monthlyMortgage + monthlyTax + monthlyInsurance + monthlyMaintenance;
        
        // Calculate totals over analysis period
        let totalRentCost = 0;
        let currentRent = monthlyRent;
        
        for (let year = 1; year <= analysisYears; year++) {
            totalRentCost += currentRent * 12;
            currentRent *= (1 + rentIncrease);
        }
        
        const totalBuyCost = downPayment + (totalMonthlyCostBuy * analysisYears * 12);
        const homeValueAfterAppreciation = homeValue * Math.pow(1 + homeAppreciation, analysisYears);
        const netBuyCost = totalBuyCost - homeValueAfterAppreciation;
        
        return {
            mode: 'rent-vs-buy',
            homeValue,
            monthlyRent,
            totalMonthlyCostBuy,
            totalRentCost,
            totalBuyCost,
            netBuyCost,
            homeValueAfterAppreciation,
            analysisYears,
            recommendation: netBuyCost < totalRentCost ? 'buy' : 'rent'
        };
    }

    // Investment property calculation
    function calculateInvestment() {
        const propertyPrice = +els.investmentPrice?.value || 0;
        const downPayment = +els.investmentDown?.value || 0;
        const monthlyRent = +els.monthlyRentalIncome?.value || 0;
        const vacancyRate = (+els.vacancyRate?.value || 5) / 100;
        const operatingExpenses = +els.operatingExpenses?.value || 0;
        
        if (!propertyPrice || !monthlyRent) return null;
        
        const loanAmount = propertyPrice - downPayment;
        const mortgageRate = 0.075 / 12; // 7.5% for investment property
        const months = 30 * 12;
        
        // Monthly mortgage payment
        const monthlyMortgage = loanAmount * (mortgageRate * Math.pow(1 + mortgageRate, months)) / 
                               (Math.pow(1 + mortgageRate, months) - 1);
        
        // Calculate cash flow
        const effectiveRent = monthlyRent * (1 - vacancyRate);
        const netOperatingIncome = effectiveRent - operatingExpenses;
        const cashFlow = netOperatingIncome - monthlyMortgage;
        
        // Calculate key metrics
        const grossRentMultiplier = propertyPrice / (monthlyRent * 12);
        const capRate = (netOperatingIncome * 12) / propertyPrice;
        const cashOnCashReturn = (cashFlow * 12) / downPayment;
        
        return {
            mode: 'investment',
            propertyPrice,
            downPayment,
            monthlyRent,
            effectiveRent,
            monthlyMortgage,
            operatingExpenses,
            netOperatingIncome,
            cashFlow,
            grossRentMultiplier,
            capRate: capRate * 100,
            cashOnCashReturn: cashOnCashReturn * 100
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
            case 'rent-vs-buy':
                updateRentVsBuyDisplay(result);
                break;
            case 'investment':
                updateInvestmentDisplay(result);
                break;
        }
    }

    // Update payment mode display
    function updatePaymentDisplay(result) {
        if (els.totalPayment) els.totalPayment.textContent = money(result.totalMonthly);
        if (els.loanAmount) els.loanAmount.textContent = money(result.loanAmount);
        if (els.totalInterest) els.totalInterest.textContent = money(result.totalInterest);
        if (els.piAmount) els.piAmount.textContent = money(result.monthlyPI);
        if (els.taxAmount) els.taxAmount.textContent = money(result.monthlyTax);
        if (els.insuranceAmount) els.insuranceAmount.textContent = money(result.monthlyInsurance);
        if (els.pmiAmount) els.pmiAmount.textContent = money(result.monthlyPMI);
        if (els.hoaAmount) els.hoaAmount.textContent = money(result.monthlyHOA);
        
        // Show/hide PMI row
        if (els.rowPmi) els.rowPmi.classList.toggle('hidden', !result.needsPMI);
    }

    // Update refinance mode display
    function updateRefinanceDisplay(result) {
        const savingsColor = result.monthlySavings > 0 ? '#10b981' : '#ef4444';
        
        if (els.totalPayment) {
            els.totalPayment.innerHTML = `
                <div class="refinance-comparison">
                    <div class="comparison-item">
                        <span class="label">Current Payment</span>
                        <span class="value">${money(result.currentPayment)}</span>
                    </div>
                    <div class="comparison-item">
                        <span class="label">New Payment</span>
                        <span class="value">${money(result.newPayment)}</span>
                    </div>
                    <div class="comparison-item highlight">
                        <span class="label">Monthly ${result.monthlySavings > 0 ? 'Savings' : 'Increase'}</span>
                        <span class="value" style="color: ${savingsColor}">
                            ${money(Math.abs(result.monthlySavings))}
                        </span>
                    </div>
                </div>
            `;
        }
    }

    // Update affordability mode display
    function updateAffordabilityDisplay(result) {
        if (els.totalPayment) {
            els.totalPayment.innerHTML = `
                <div class="affordability-results">
                    <div class="affordability-item">
                        <span class="label">Maximum Home Price</span>
                        <span class="value highlight">${money(result.maxHomePrice)}</span>
                    </div>
                    <div class="affordability-item">
                        <span class="label">Maximum Monthly Payment</span>
                        <span class="value">${money(result.maxMortgagePayment)}</span>
                    </div>
                    <div class="affordability-item">
                        <span class="label">Monthly Income</span>
                        <span class="value">${money(result.monthlyIncome)}</span>
                    </div>
                </div>
            `;
        }
    }

    // Update rent vs buy display
    function updateRentVsBuyDisplay(result) {
        if (els.totalPayment) {
            els.totalPayment.innerHTML = `
                <div class="rent-vs-buy-results">
                    <div class="comparison-header">
                        <h3>Recommendation: ${result.recommendation === 'buy' ? '🏠 Buy' : '🏠 Rent'}</h3>
                    </div>
                    <div class="comparison-grid">
                        <div class="comparison-option">
                            <h4>Renting</h4>
                            <div class="option-details">
                                <span class="total-cost">${money(result.totalRentCost)}</span>
                                <span class="period">Total over ${result.analysisYears} years</span>
                            </div>
                        </div>
                        <div class="comparison-option">
                            <h4>Buying</h4>
                            <div class="option-details">
                                <span class="total-cost">${money(result.netBuyCost)}</span>
                                <span class="period">Net cost after appreciation</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Update investment display
    function updateInvestmentDisplay(result) {
        if (els.totalPayment) {
            els.totalPayment.innerHTML = `
                <div class="investment-results">
                    <div class="investment-metrics">
                        <div class="metric-item ${result.cashFlow > 0 ? 'positive' : 'negative'}">
                            <span class="label">Monthly Cash Flow</span>
                            <span class="value">${money(result.cashFlow)}</span>
                        </div>
                        <div class="metric-item">
                            <span class="label">Cap Rate</span>
                            <span class="value">${result.capRate.toFixed(2)}%</span>
                        </div>
                        <div class="metric-item">
                            <span class="label">Cash-on-Cash Return</span>
                            <span class="value">${result.cashOnCashReturn.toFixed(2)}%</span>
                        </div>
                        <div class="metric-item">
                            <span class="label">Gross Rent Multiplier</span>
                            <span class="value">${result.grossRentMultiplier.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Charts update function
    function updateCharts(result) {
        updateBreakdownChart(result);
        updateAmortizationChart(result);
    }

    function updateBreakdownChart(result) {
        const ctx = els.breakdownChart?.getContext('2d');
        if (!ctx) return;
        
        if (breakdownChart) {
            breakdownChart.destroy();
        }
        
        const data = {
            labels: ['Principal & Interest', 'Property Tax', 'Insurance', 'PMI', 'HOA'],
            datasets: [{
                data: [
                    result.monthlyPI,
                    result.monthlyTax,
                    result.monthlyInsurance,
                    result.monthlyPMI,
                    result.monthlyHOA
                ],
                backgroundColor: [
                    '#33808d',
                    '#e6814f',
                    '#32c68d',
                    '#ff5459',
                    '#a855f7'
                ]
            }]
        };
        
        breakdownChart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    function updateAmortizationChart(result) {
        const ctx = els.amortizationChart?.getContext('2d');
        if (!ctx || !result.schedule) return;
        
        if (amortizationChart) {
            amortizationChart.destroy();
        }
        
        // Sample data points (every 12 months)
        const labels = [];
        const principalData = [];
        const balanceData = [];
        
        result.schedule.forEach((payment, index) => {
            if (index % 12 === 0) {
                labels.push(`Year ${Math.floor(index / 12) + 1}`);
                principalData.push(result.loanAmount - payment.balance);
                balanceData.push(payment.balance);
            }
        });
        
        amortizationChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Principal Paid',
                    data: principalData,
                    borderColor: '#33808d',
                    backgroundColor: 'rgba(51, 128, 141, 0.1)',
                    fill: true
                }, {
                    label: 'Remaining Balance',
                    data: balanceData,
                    borderColor: '#e6814f',
                    backgroundColor: 'rgba(230, 129, 79, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // Amortization table update
    function updateAmortizationTable(result) {
        if (!els.amortizationBody || !result.schedule) return;
        
        let html = '';
        const schedule = result.schedule;
        
        // Show first 5 years (60 payments) grouped by year
        for (let year = 1; year <= 5; year++) {
            const yearStart = (year - 1) * 12;
            const yearEnd = Math.min(year * 12, schedule.length);
            
            if (yearStart >= schedule.length) break;
            
            let yearPayment = 0;
            let yearPrincipal = 0;
            let yearInterest = 0;
            
            for (let month = yearStart; month < yearEnd; month++) {
                if (schedule[month]) {
                    yearPayment += schedule[month].payment;
                    yearPrincipal += schedule[month].principal;
                    yearInterest += schedule[month].interest;
                }
            }
            
            const endBalance = schedule[yearEnd - 1]?.balance || 0;
            
            html += `
                <tr>
                    <td>${year}</td>
                    <td>${money(yearPayment)}</td>
                    <td>${money(yearPrincipal)}</td>
                    <td>${money(yearInterest)}</td>
                    <td>${money(endBalance)}</td>
                </tr>
            `;
        }
        
        els.amortizationBody.innerHTML = html;
    }

    // Generate AI insights
    function generateInsights(result) {
        if (!els.insightsList) return;
        
        const insights = [];
        
        if (result.mode === 'payment') {
            // PMI insight
            if (result.needsPMI) {
                const dpNeeded = result.homePrice * 0.2 - result.dpAmount;
                insights.push(`💡 Increase down payment by ${money(dpNeeded)} to eliminate PMI and save ${money(result.monthlyPMI)}/month`);
            }
            
            // Bi-weekly insight
            if (currentPaymentFreq === 'monthly') {
                const biWeeklyData = calculateBiWeeklyPayments(result.loanAmount, result.rate / 100, result.monthlyPI);
                const savings = result.totalInterest - biWeeklyData.totalInterest;
                insights.push(`🎯 Consider bi-weekly payments to save ${money(savings)} in interest`);
            }
            
            // Rate shopping insight
            const rateSavings = result.loanAmount * 0.0025 * result.term; // 0.25% savings
            insights.push(`🏦 Shop around for better rates - 0.25% savings = ${money(rateSavings)} over loan term`);
            
            // Extra payment insight
            if (result.extraMonthly === 0) {
                insights.push(`💰 Adding $100/month extra could save years off your mortgage`);
            }
        }
        
        // Investment insights
        if (result.mode === 'investment') {
            if (result.capRate < 5) {
                insights.push(`📈 Cap rate of ${result.capRate.toFixed(2)}% is below market average`);
            }
            
            if (result.cashFlow < 0) {
                insights.push(`⚠️ Negative cash flow of ${money(Math.abs(result.cashFlow))}/month requires additional investment`);
            }
        }
        
        let html = '';
        insights.forEach(insight => {
            html += `<li>${insight}</li>`;
        });
        
        els.insightsList.innerHTML = html;
    }

    // Utility functions for other features
    function resetForm() {
        // Reset to default values
        if (els.homePrice) els.homePrice.value = '400000';
        if (els.dpAmount) els.dpAmount.value = '80000';
        if (els.interestRate) els.interestRate.value = '6.5';
        
        setTerm(30);
        calculate();
    }

    function emailResults() {
        // Implementation for email functionality
        showNotification('Email functionality coming soon!', 'info');
    }

    function shareResults() {
        // Implementation for share functionality
        if (navigator.share) {
            navigator.share({
                title: 'Mortgage Calculation Results',
                text: 'Check out my mortgage calculation results',
                url: window.location.href
            });
        } else {
            showNotification('Share functionality not supported', 'error');
        }
    }

    function showFullSchedule() {
        if (els.scheduleModal) {
            els.scheduleModal.showModal();
            updateFullScheduleTable();
        }
    }

    function updateFullScheduleTable() {
        if (!els.fullScheduleBody || !currentCalculation?.schedule) return;
        
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
    }

    function addComparison() {
        // Implementation for scenario comparison
        if (!currentCalculation) {
            showNotification('Please calculate first', 'error');
            return;
        }
        
        const name = els.scenarioName?.value || `Scenario ${comparisons.length + 1}`;
        comparisons.push({
            name,
            calculation: {...currentCalculation}
        });
        
        updateComparisonDisplay();
        if (els.scenarioName) els.scenarioName.value = '';
    }

    function clearComparisons() {
        comparisons = [];
        updateComparisonDisplay();
    }

    function updateComparisonDisplay() {
        if (!els.comparisonGrid) return;
        
        if (comparisons.length === 0) {
            els.comparisonGrid.innerHTML = '<p class="empty-state">No scenarios to compare. Add scenarios above.</p>';
            return;
        }
        
        let html = '';
        comparisons.forEach((scenario, index) => {
            const calc = scenario.calculation;
            html += `
                <div class="comparison-scenario">
                    <h4>${scenario.name}</h4>
                    <div class="scenario-details">
                        <div class="detail">Payment: ${money(calc.totalMonthly)}</div>
                        <div class="detail">Loan: ${money(calc.loanAmount)}</div>
                        <div class="detail">Interest: ${money(calc.totalInterest)}</div>
                    </div>
                    <button class="btn-outline btn-sm" onclick="removeScenario(${index})">Remove</button>
                </div>
            `;
        });
        
        els.comparisonGrid.innerHTML = html;
    }

    function removeScenario(index) {
        comparisons.splice(index, 1);
        updateComparisonDisplay();
    }

    function toggleMobileMenu() {
        const navMenu = $('#nav-menu');
        if (navMenu) {
            navMenu.classList.toggle('active');
        }
    }

    function showTooltip(event) {
        // Implementation for tooltip display
        const tooltip = event.target.getAttribute('data-tooltip');
        if (tooltip) {
            // Create and show tooltip
        }
    }

    function hideTooltip(event) {
        // Implementation for tooltip hiding
    }

    // Make functions globally available
    window.removeScenario = removeScenario;
    
    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
