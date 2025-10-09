/* ========================================================================== */
/* WORLD'S #1 AI-ENHANCED USA MORTGAGE CALCULATOR - PRODUCTION JS v21.0      */
/* © 2025 FinGuid - All Rights Reserved                                       */
/* ========================================================================== */

// Immediately set theme to prevent FOUC (Flash of Unstyled Content)
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

document.addEventListener('DOMContentLoaded', () => {

    const MORTGAGE_CALCULATOR = {
        // FRED API Configuration
        FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a', // Your public API key
        FRED_SERIES_ID: 'MORTGAGE30US',
        
        // State
        baseRate: 6.5, // Default fallback rate
        charts: {},
        amortizationSchedule: [],
        
        // Voice Recognition
        voiceRecognition: null,
        isListening: false,
    };

    // --- DOM Element Cache ---
    const elements = {
        homePrice: document.getElementById('home-price'),
        downPayment: document.getElementById('down-payment'),
        downPaymentPercent: document.getElementById('down-payment-percent'),
        dpDollarBtn: document.getElementById('dp-dollar-btn'),
        dpPercentBtn: document.getElementById('dp-percent-btn'),
        dpDollarWrapper: document.getElementById('down-payment-dollar-wrapper'),
        dpPercentWrapper: document.getElementById('down-payment-percent-wrapper'),
        creditScore: document.getElementById('credit-score'),
        interestRate: document.getElementById('interest-rate'),
        rateInfoText: document.getElementById('rate-info-text'),
        customTerm: document.getElementById('custom-term'),
        zipCode: document.getElementById('zip-code'),
        propertyTax: document.getElementById('property-tax'),
        homeInsurance: document.getElementById('home-insurance'),
        pmi: document.getElementById('pmi'),
        pmiStatus: document.getElementById('pmi-status'),
        hoaFees: document.getElementById('hoa-fees'),
        totalPayment: document.getElementById('total-payment'),
        loanTypeBadge: document.getElementById('loan-type-badge'),
        loanAmountSummary: document.getElementById('loan-amount-summary'),
        totalInterestSummary: document.getElementById('total-interest-summary'),
        totalCostSummary: document.getElementById('total-cost-summary'),
        payoffDateSummary: document.getElementById('payoff-date-summary'),
        insightsContainer: document.getElementById('insights-container'),
        scheduleBody: document.querySelector('#amortization-table tbody'),
        scheduleInfo: document.getElementById('schedule-info'),
        prevPaymentsBtn: document.getElementById('prev-payments'),
        nextPaymentsBtn: document.getElementById('next-payments'),
        timelineChartSubtitle: document.getElementById('timeline-chart-subtitle'),
        yearRange: document.getElementById('year-range'),
        yearLabel: document.getElementById('year-label'),
        principalPaid: document.getElementById('principal-paid'),
        interestPaid: document.getElementById('interest-paid'),
        remainingBalance: document.getElementById('remaining-balance'),
        fontDecrease: document.getElementById('font-decrease'),
        fontReset: document.getElementById('font-reset'),
        fontIncrease: document.getElementById('font-increase'),
        themeToggle: document.getElementById('theme-toggle'),
        voiceToggle: document.getElementById('voice-toggle'),
        screenReaderToggle: document.getElementById('screen-reader-toggle'),
    };

    let scheduleCurrentPage = 0;
    const scheduleItemsPerPage = 12;
    let downPaymentInputSource = 'dollar';

    // --- Core Calculation Engine ---
    function calculateMortgage() {
        const inputs = gatherInputs();
        
        // Core mortgage payment (Principal & Interest)
        const monthlyRate = inputs.interestRate / 100 / 12;
        const numberOfPayments = inputs.loanTerm * 12;
        let monthlyPI = 0;
        if (monthlyRate > 0) {
            monthlyPI = inputs.loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
        } else {
            monthlyPI = inputs.loanAmount / numberOfPayments;
        }

        // Other monthly costs
        const monthlyTax = inputs.propertyTax / 12;
        const monthlyInsurance = inputs.homeInsurance / 12;
        const monthlyPMI = calculatePMI(inputs) / 12;
        const monthlyHOA = inputs.hoaFees;

        const totalMonthlyPayment = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA;
        const totalInterest = (monthlyPI * numberOfPayments) - inputs.loanAmount;
        const totalCost = inputs.loanAmount + totalInterest + (inputs.propertyTax * inputs.loanTerm) + (inputs.homeInsurance * inputs.loanTerm);
        
        const results = { ...inputs, monthlyPI, monthlyTax, monthlyInsurance, monthlyPMI, monthlyHOA, totalMonthlyPayment, totalInterest, totalCost };

        updateUI(results);
        generateAmortizationSchedule(results);
        generateAIInsights(results);
    }

    function gatherInputs() {
        const homePrice = parseCurrency(elements.homePrice.value) || 0;
        const downPayment = parseCurrency(elements.downPayment.value) || 0;
        const interestRate = parseFloat(elements.interestRate.value) || 0;
        const customTermValue = parseInt(elements.customTerm.value);
        const activeTermChip = document.querySelector('.term-chip.active');
        const loanTerm = (customTermValue > 0) ? customTermValue : (activeTermChip ? parseInt(activeTermChip.dataset.term) : 30);
        
        return {
            homePrice,
            downPayment,
            loanAmount: homePrice - downPayment,
            interestRate,
            loanTerm,
            loanType: document.querySelector('.loan-type-btn.active')?.dataset.loanType || 'conventional',
            propertyTax: parseCurrency(elements.propertyTax.value) || 0,
            homeInsurance: parseCurrency(elements.homeInsurance.value) || 0,
            hoaFees: parseCurrency(elements.hoaFees.value) || 0
        };
    }
    
    function calculatePMI(inputs) {
        const ltv = (inputs.loanAmount / inputs.homePrice) * 100;
        let annualPMI = 0;
        
        if (inputs.loanType === 'conventional' && ltv > 80) {
            const pmiRate = 0.0058; // National average PMI rate
            annualPMI = inputs.loanAmount * pmiRate;
            elements.pmiStatus.className = 'pmi-status active';
            elements.pmiStatus.innerHTML = `<i class="fas fa-exclamation-triangle"></i> PMI Required: ${ltv.toFixed(1)}% LTV`;
            elements.pmiStatus.style.display = 'flex';
        } else {
            elements.pmiStatus.className = 'pmi-status inactive';
            elements.pmiStatus.innerHTML = `<i class="fas fa-check-circle"></i> No PMI Required`;
            elements.pmiStatus.style.display = 'flex';
        }
        elements.pmi.value = formatCurrency(annualPMI, false, false);
        return annualPMI;
    }

    // --- UI Update Functions ---
    function updateUI(results) {
        elements.totalPayment.textContent = formatCurrency(results.totalMonthlyPayment);
        elements.loanTypeBadge.textContent = results.loanType.charAt(0).toUpperCase() + results.loanType.slice(1);
        elements.loanAmountSummary.textContent = formatCurrency(results.loanAmount);
        elements.totalInterestSummary.textContent = formatCurrency(results.totalInterest);
        elements.totalCostSummary.textContent = formatCurrency(results.totalCost);

        const payoffDate = new Date();
        payoffDate.setFullYear(payoffDate.getFullYear() + results.loanTerm);
        elements.payoffDateSummary.textContent = payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        updateCharts(results);
    }
    
    function updateCharts(results) {
        // Payment Components Doughnut Chart
        if (MORTGAGE_CALCULATOR.charts.paymentComponents) MORTGAGE_CALCULATOR.charts.paymentComponents.destroy();
        const paymentCtx = document.getElementById('payment-components-chart').getContext('2d');
        MORTGAGE_CALCULATOR.charts.paymentComponents = new Chart(paymentCtx, {
            type: 'doughnut',
            data: {
                labels: ['Principal & Interest', 'Taxes', 'Insurance', 'PMI', 'HOA'],
                datasets: [{
                    data: [results.monthlyPI, results.monthlyTax, results.monthlyInsurance, results.monthlyPMI, results.monthlyHOA].filter(v => v > 0),
                    backgroundColor: ['#14b8a6', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'],
                    borderWidth: 0,
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });

        // Mortgage Timeline Line Chart
        if (MORTGAGE_CALCULATOR.charts.mortgageTimeline) MORTGAGE_CALCULATOR.charts.mortgageTimeline.destroy();
        const timelineCtx = document.getElementById('mortgage-timeline-chart').getContext('2d');
        
        const schedule = generateAmortizationSchedule(results, true); // Get schedule without updating UI
        const yearlyData = schedule.filter((_, i) => (i + 1) % 12 === 0 || i === schedule.length - 1);
        
        elements.timelineChartSubtitle.textContent = `Loan: ${formatCurrency(results.loanAmount)} | Term: ${results.loanTerm} years | Rate: ${results.interestRate}%`;
        
        MORTGAGE_CALCULATOR.charts.mortgageTimeline = new Chart(timelineCtx, {
            type: 'line',
            data: {
                labels: yearlyData.map((_, i) => `Year ${i + 1}`),
                datasets: [
                    { label: 'Remaining Balance', data: yearlyData.map(p => p.remainingBalance), borderColor: '#ef4444', tension: 0.1, fill: false },
                    { label: 'Principal Paid', data: yearlyData.map(p => results.loanAmount - p.remainingBalance), borderColor: '#22c55e', tension: 0.1, fill: false }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
        
        // Update year slider
        elements.yearRange.max = results.loanTerm;
        elements.yearRange.value = Math.min(elements.yearRange.value, results.loanTerm);
        updateYearDisplay();
    }
    
    // --- Amortization ---
    function generateAmortizationSchedule(results, silent = false) {
        let balance = results.loanAmount;
        let totalInterestPaid = 0;
        const schedule = [];
        for (let i = 0; i < results.loanTerm * 12; i++) {
            const interestPayment = balance * (results.interestRate / 100 / 12);
            const principalPayment = results.monthlyPI - interestPayment;
            balance -= principalPayment;
            totalInterestPaid += interestPayment;
            schedule.push({
                paymentNumber: i + 1,
                paymentAmount: results.monthlyPI,
                principalPayment,
                interestPayment,
                remainingBalance: Math.max(0, balance),
                totalInterestPaid
            });
        }
        MORTGAGE_CALCULATOR.amortizationSchedule = schedule;
        if (!silent) {
            scheduleCurrentPage = 0;
            updateScheduleDisplay();
        }
        return schedule;
    }

    function updateScheduleDisplay() {
        if (!elements.scheduleBody) return;
        const schedule = MORTGAGE_CALCULATOR.amortizationSchedule;
        const startIndex = scheduleCurrentPage * scheduleItemsPerPage;
        const endIndex = startIndex + scheduleItemsPerPage;
        const pageItems = schedule.slice(startIndex, endIndex);

        elements.scheduleBody.innerHTML = pageItems.map(p => `
            <tr>
                <td>${p.paymentNumber}</td>
                <td>${formatCurrency(p.paymentAmount)}</td>
                <td>${formatCurrency(p.principalPayment)}</td>
                <td>${formatCurrency(p.interestPayment)}</td>
                <td>${formatCurrency(p.remainingBalance)}</td>
            </tr>
        `).join('');
        
        elements.scheduleInfo.textContent = `Payments ${startIndex + 1}-${Math.min(endIndex, schedule.length)} of ${schedule.length}`;
        elements.prevPaymentsBtn.disabled = scheduleCurrentPage === 0;
        elements.nextPaymentsBtn.disabled = endIndex >= schedule.length;
    }

    // --- FRED API & Interest Rate Logic ---
    async function fetchAndUpdateLiveRate() {
        try {
            const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${MORTGAGE_CALCULATOR.FRED_SERIES_ID}&api_key=${MORTGAGE_CALCULATOR.FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('FRED API Network response was not ok');
            const data = await response.json();
            const rate = parseFloat(data.observations[0].value);
            if (!isNaN(rate)) {
                MORTGAGE_CALCULATOR.baseRate = rate;
                showToast(`Live 30-yr fixed rate updated to ${rate.toFixed(2)}%`, 'success');
                updateInterestRateInput();
            }
        } catch (error) {
            console.error("Failed to fetch FRED rate:", error);
            showToast('Could not fetch live rate, using default.', 'warning');
            updateInterestRateInput();
        }
    }

    function updateInterestRateInput() {
        const creditScore = parseInt(elements.creditScore.value);
        let rateModifier = 0;
        if (creditScore >= 800) rateModifier = -0.25;
        else if (creditScore >= 740) rateModifier = -0.10;
        else if (creditScore < 670 && creditScore >= 580) rateModifier = 0.5;
        else if (creditScore < 580) rateModifier = 1.0;

        const finalRate = MORTGAGE_CALCULATOR.baseRate + rateModifier;
        elements.interestRate.value = finalRate.toFixed(2);
        elements.rateInfoText.textContent = `Est. based on ${MORTGAGE_CALCULATOR.baseRate.toFixed(2)}% base & credit score`;
        elements.interestRate.classList.add('highlight-update');
        setTimeout(() => elements.interestRate.classList.remove('highlight-update'), 1000);
        calculateMortgage();
    }

    // --- AI Insights ---
    function generateAIInsights(results) {
        let insightsHTML = '';
        const ltv = (results.loanAmount / results.homePrice * 100) || 0;

        // Insight 1: Down Payment & PMI
        if (ltv <= 80) {
            insightsHTML += createInsight('success', 'Smart Down Payment', `Excellent! Your ${ (100-ltv).toFixed(1) }% down payment helps you avoid Private Mortgage Insurance (PMI), saving you money every month.`);
        } else {
            insightsHTML += createInsight('warning', 'Consider PMI', `With less than 20% down, you'll likely need PMI. Increasing your down payment to ${formatCurrency(results.homePrice * 0.2)} could eliminate this extra cost.`);
        }

        // Insight 2: Loan Term
        if (results.loanTerm <= 15) {
            insightsHTML += createInsight('success', 'Fast-Track Equity', `Choosing a ${results.loanTerm}-year term is a great way to build equity quickly and save ${formatCurrency(results.totalInterest / 2)} or more in interest compared to a 30-year loan.`);
        } else {
            insightsHTML += createInsight('info', 'Payment Flexibility', `A 30-year term offers a lower, more manageable monthly payment. You can always make extra payments to pay it off faster.`);
        }

        // Insight 3: Rate Analysis
        if (results.interestRate < MORTGAGE_CALCULATOR.baseRate) {
             insightsHTML += createInsight('success', 'Excellent Interest Rate', `Your estimated rate of ${results.interestRate}% is below the national average due to your great credit score, saving you thousands over the life of the loan.`);
        } else {
             insightsHTML += createInsight('info', 'Rate Insight', `Your rate is competitive. To potentially lower it further, consider improving your credit score or comparing quotes from multiple lenders.`);
        }

        elements.insightsContainer.innerHTML = insightsHTML;
    }

    function createInsight(type, title, text) {
        const icons = { success: 'fa-check-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
        return `
            <div class="insight-item insight-${type}">
                <i class="fas ${icons[type]} insight-icon"></i>
                <div>
                    <h4 class="insight-title">${title}</h4>
                    <p class="insight-text">${text}</p>
                </div>
            </div>`;
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        const inputsForCalc = [elements.homePrice, elements.downPayment, elements.downPaymentPercent, elements.interestRate, elements.customTerm, elements.creditScore, elements.propertyTax, elements.homeInsurance, elements.hoaFees];
        inputsForCalc.forEach(el => el.addEventListener('input', debounce(handleInputChange, 250)));
        
        document.querySelectorAll('.suggestion-chip').forEach(c => c.addEventListener('click', calculateMortgage));
        document.querySelectorAll('.term-chip').forEach(c => c.addEventListener('click', handleTermChipClick));
        document.querySelectorAll('.loan-type-btn').forEach(b => b.addEventListener('click', calculateMortgage));

        elements.customTerm.addEventListener('input', () => {
            if (elements.customTerm.value) {
                document.querySelectorAll('.term-chip.active').forEach(c => c.classList.remove('active'));
            }
        });

        // Down Payment Sync
        elements.dpDollarBtn.addEventListener('click', () => downPaymentInputSource = 'dollar');
        elements.dpPercentBtn.addEventListener('click', () => downPaymentInputSource = 'percent');
        elements.downPayment.addEventListener('input', syncDownPayment);
        elements.downPaymentPercent.addEventListener('input', syncDownPayment);
        elements.homePrice.addEventListener('input', syncDownPayment);
        
        // Pagination
        elements.prevPaymentsBtn.addEventListener('click', () => { scheduleCurrentPage--; updateScheduleDisplay(); });
        elements.nextPaymentsBtn.addEventListener('click', () => { scheduleCurrentPage++; updateScheduleDisplay(); });
        
        // Year Slider
        elements.yearRange.addEventListener('input', updateYearDisplay);

        // Accessibility
        elements.fontDecrease.addEventListener('click', () => adjustFontSize(-0.1));
        elements.fontReset.addEventListener('click', () => adjustFontSize(0));
        elements.fontIncrease.addEventListener('click', () => adjustFontSize(0.1));
        elements.themeToggle.addEventListener('click', toggleTheme);
        elements.voiceToggle.addEventListener('click', toggleVoiceControl);
        elements.screenReaderToggle.addEventListener('click', () => document.body.classList.toggle('screen-reader-mode'));
    }

    function handleInputChange(event) {
        if (event.target.id === 'credit-score' || event.target.id === 'interest-rate') {
            updateInterestRateInput();
        } else {
            calculateMortgage();
        }
    }

    function handleTermChipClick(event) {
        document.querySelectorAll('.term-chip.active').forEach(c => c.classList.remove('active'));
        event.currentTarget.classList.add('active');
        elements.customTerm.value = '';
        calculateMortgage();
    }
    
    // --- Input Sync Logic ---
    function syncDownPayment() {
        const homePrice = parseCurrency(elements.homePrice.value) || 0;
        if (homePrice === 0) return;

        if (downPaymentInputSource === 'percent') {
            const percent = parseFloat(elements.downPaymentPercent.value) || 0;
            const dollarAmount = homePrice * (percent / 100);
            elements.downPayment.value = formatCurrency(dollarAmount, false, false);
        } else { // source is 'dollar'
            const dollarAmount = parseCurrency(elements.downPayment.value) || 0;
            const percent = (dollarAmount / homePrice) * 100;
            elements.downPaymentPercent.value = percent.toFixed(1);
        }
    }

    window.showDownPaymentType = (type) => {
        downPaymentInputSource = type;
        elements.dpDollarWrapper.classList.toggle('active', type === 'dollar');
        elements.dpPercentWrapper.classList.toggle('active', type === 'percent');
        elements.dpDollarBtn.classList.toggle('active', type === 'dollar');
        elements.dpPercentBtn.classList.toggle('active', type === 'percent');
        syncDownPayment();
        calculateMortgage();
    };

    function updateYearDisplay() {
        const year = parseInt(elements.yearRange.value);
        elements.yearLabel.textContent = `Year ${year}`;
        const paymentIndex = (year * 12) - 1;
        if (MORTGAGE_CALCULATOR.amortizationSchedule[paymentIndex]) {
            const data = MORTGAGE_CALCULATOR.amortizationSchedule[paymentIndex];
            const loanAmount = parseCurrency(elements.homePrice.value) - parseCurrency(elements.downPayment.value);
            elements.principalPaid.textContent = formatCurrency(loanAmount - data.remainingBalance);
            elements.interestPaid.textContent = formatCurrency(data.totalInterestPaid);
            elements.remainingBalance.textContent = formatCurrency(data.remainingBalance);
        }
    }
    
    // --- Accessibility Functions ---
    let currentFontScale = 1;
    function adjustFontSize(change) {
        if (change === 0) {
            currentFontScale = 1;
        } else {
            currentFontScale = Math.max(0.8, Math.min(1.5, currentFontScale + change));
        }
        document.documentElement.style.fontSize = `${14 * currentFontScale}px`;
        localStorage.setItem('font-scale', currentFontScale);
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        // Re-render charts for new theme colors
        calculateMortgage();
    }

    // --- Voice Control ---
    function toggleVoiceControl() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showToast('Voice recognition not supported in this browser.', 'error');
            return;
        }

        if (MORTGAGE_CALCULATOR.isListening) {
            MORTGAGE_CALCULATOR.voiceRecognition.stop();
            return;
        }

        MORTGAGE_CALCULATOR.voiceRecognition = new SpeechRecognition();
        const recognition = MORTGAGE_CALCULATOR.voiceRecognition;
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            MORTGAGE_CALCULATOR.isListening = true;
            elements.voiceToggle.classList.add('active');
            speak("I'm listening. Say 'help' for a list of commands.");
        };

        recognition.onend = () => {
            MORTGAGE_CALCULATOR.isListening = false;
            elements.voiceToggle.classList.remove('active');
        };

        recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.toLowerCase();
            processVoiceCommand(command);
        };
        
        recognition.onerror = (event) => {
            showToast(`Voice Error: ${event.error}`, 'error');
        };

        recognition.start();
    }

    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
    }
    
    function processVoiceCommand(command) {
        speak(`Processing: ${command}`);
        const numberMatch = command.match(/(\d[\d,]*(\.\d+)?)/);
        const number = numberMatch ? parseFloat(numberMatch[0].replace(/,/g, '')) : null;

        if (command.includes('help')) {
            speak("You can say things like: set home price to 300,000, set down payment to 20 percent, set interest rate to 7.5, or read my monthly payment.");
        } else if (command.includes('home price') && number !== null) {
            elements.homePrice.value = number;
            calculateMortgage();
            speak(`Home price set to ${formatCurrency(number)}.`);
        } else if (command.includes('down payment') && number !== null) {
            if (command.includes('percent')) {
                downPaymentInputSource = 'percent';
                elements.downPaymentPercent.value = number;
            } else {
                downPaymentInputSource = 'dollar';
                elements.downPayment.value = number;
            }
            syncDownPayment();
            calculateMortgage();
            speak(`Down payment set.`);
        } else if (command.includes('read') && command.includes('monthly payment')) {
            speak(`Your total monthly payment is ${elements.totalPayment.textContent}`);
        } else {
            speak("Sorry, I didn't understand that command.");
        }
    }

    // --- PDF & Export ---
    window.generateAndDownloadPDF = function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const results = gatherInputs(); // Use fresh data
        const monthlyPayment = parseCurrency(elements.totalPayment.textContent);

        doc.setFontSize(18);
        doc.text("🇺🇸 Mortgage Summary", 14, 22);
        
        const summaryData = [
            ["Home Price", formatCurrency(results.homePrice)],
            ["Down Payment", formatCurrency(results.downPayment)],
            ["Loan Amount", formatCurrency(results.loanAmount)],
            ["Interest Rate", `${results.interestRate}%`],
            ["Loan Term", `${results.loanTerm} Years`],
            ["Monthly Payment", formatCurrency(monthlyPayment)]
        ];
        
        doc.autoTable({
            startY: 30,
            head: [['Item', 'Value']],
            body: summaryData,
            theme: 'grid'
        });

        doc.save(`Mortgage-Summary-${Date.now()}.pdf`);
        showToast('PDF Downloaded!', 'success');
    };
    
    // --- Utilities ---
    function parseCurrency(value) { return parseFloat(String(value).replace(/[$,]/g, '')) || 0; }
    function formatCurrency(amount, includeCents = true, useSymbol = true) {
        const options = { style: 'currency', currency: 'USD', minimumFractionDigits: includeCents ? 2 : 0, maximumFractionDigits: includeCents ? 2 : 0 };
        let formatted = new Intl.NumberFormat('en-US', options).format(amount);
        return useSymbol ? formatted : formatted.replace('$', '');
    }
    function debounce(func, delay) { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); }; }
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
    
    // --- Initialization ---
    function init() {
        // Apply saved preferences
        if (localStorage.getItem('font-scale')) {
            currentFontScale = parseFloat(localStorage.getItem('font-scale'));
            document.documentElement.style.fontSize = `${14 * currentFontScale}px`;
        }
        
        setupEventListeners();
        fetchAndUpdateLiveRate(); // This will trigger the first calculation
    }

    init();

});
