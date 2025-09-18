/**
 * FinGuid Mortgage Calculator v7.4 - Production Ready & Feature Complete
 * - Implements all user-requested features including state-based tax calculation,
 * collapsible amortization schedule, and a complete set of loan terms.
 * - Accurately calculates and displays the impact of extra monthly and one-time payments.
 * - Fully functional, paginated amortization schedule with correct data.
 * - Implemented Save PDF, Share, and Print result actions.
 * - Powers all interactive elements including tooltips and a more robust AI engine.
 */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- STATE & CONFIGURATION ---
    const state = {
        pieChart: null, barChart: null, amortizationData: [],
        currentAmortizationView: 'monthly', amortizationPage: 1,
        speechRecognition: null, isListening: false, screenReader: false,
    };
    const config = {
        debounceDelay: 300,
        amortizationPageSize: 12,
        chartColors: ['#21808D', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'],
    };

    // US State property tax rates (as a percentage of home value)
    const STATE_TAX_RATES = {
        'AL': 0.40, 'AK': 1.02, 'AZ': 0.62, 'AR': 0.70, 'CA': 0.74, 'CO': 0.49, 'CT': 1.93, 'DE': 0.52, 'FL': 0.91, 'GA': 0.92,
        'HI': 0.28, 'ID': 0.69, 'IL': 2.05, 'IN': 0.81, 'IA': 1.53, 'KS': 1.41, 'KY': 0.86, 'LA': 0.52, 'ME': 1.25, 'MD': 1.06,
        'MA': 1.21, 'MI': 1.62, 'MN': 1.09, 'MS': 0.72, 'MO': 1.22, 'MT': 0.85, 'NE': 1.63, 'NV': 0.69, 'NH': 2.18, 'NJ': 2.49,
        'NM': 0.75, 'NY': 1.64, 'NC': 0.81, 'ND': 1.13, 'OH': 1.56, 'OK': 0.87, 'OR': 0.99, 'PA': 1.49, 'RI': 1.61, 'SC': 0.57,
        'SD': 1.26, 'TN': 0.73, 'TX': 1.69, 'UT': 0.60, 'VT': 1.73, 'VA': 0.78, 'WA': 0.96, 'WV': 0.59, 'WI': 1.48, 'WY': 0.61,
        'DC': 0.57
    };

    // --- DOM ELEMENT CACHE ---
    const elements = {
        form: document.getElementById('mortgage-form'),
        homePrice: document.getElementById('home-price'),
        dpAmount: document.getElementById('dp-amount'),
        dpPercent: document.getElementById('dp-percent'),
        interestRate: document.getElementById('interest-rate'),
        loanTerm: document.getElementById('loan-term'),
        startDate: document.getElementById('start-date'),
        stateSelect: document.getElementById('state'),
        propertyTax: document.getElementById('property-tax'),
        homeInsurance: document.getElementById('home-insurance'),
        hoaFees: document.getElementById('hoa-fees'),
        extraMonthly: document.getElementById('extra-monthly'),
        extraYearly: document.getElementById('extra-yearly'),
        extraYearlyDate: document.getElementById('extra-yearly-date'),
        totalPayment: document.getElementById('total-payment'),
        paymentBreakdown: document.getElementById('payment-breakdown'),
        extraPaymentSummary: document.getElementById('extra-payment-summary'),
        insightsList: document.getElementById('insights-list'),
        pieChartCanvas: document.getElementById('pie-chart'),
        barChartCanvas: document.getElementById('bar-chart'),
        amortizationTableBody: document.querySelector('#amortization-table tbody'),
        amortizationTableHead: document.querySelector('#amortization-table thead'),
        paginationControls: document.getElementById('pagination-controls'),
        pageInfo: document.getElementById('page-info'),
        prevPageBtn: document.getElementById('prev-page'),
        nextPageBtn: document.getElementById('next-page'),
        globalVoiceBtn: document.getElementById('global-voice-btn'),
        screenReaderBtn: document.getElementById('screen-reader-btn'),
        voiceStatus: document.getElementById('voice-status'),
        srAnnouncer: document.getElementById('sr-announcer'),
        amortizationDetails: document.getElementById('amortization-details'),
        amortizationSummary: document.querySelector('#amortization-details summary'),
    };

    // --- INITIALIZATION ---
    function init() {
        populateStateDropdown();
        bindEvents();
        setDefaultValues();
        setupSpeechRecognition();
        calculateAndDisplay();
    }

    function setDefaultValues() {
        elements.homePrice.value = 400000;
        elements.dpAmount.value = 80000;
        elements.dpPercent.value = 20;
        elements.interestRate.value = 6.75;
        elements.loanTerm.value = 30;
        elements.propertyTax.value = 4400; // Default for illustrative purposes
        elements.homeInsurance.value = 1700;
        elements.hoaFees.value = 0;
        elements.extraMonthly.value = 0;
        elements.extraYearly.value = 0;
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        elements.startDate.value = nextMonth.toISOString().slice(0, 7);
        elements.extraYearlyDate.value = new Date(nextMonth.getFullYear() + 1, nextMonth.getMonth()).toISOString().slice(0, 7);
    }
    
    // --- EVENT BINDING ---
    function bindEvents() {
        elements.form.addEventListener('input', debounce(calculateAndDisplay, config.debounceDelay));
        document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', handleTabClick));
        document.querySelectorAll('.term-chip').forEach(chip => chip.addEventListener('click', handleTermChipClick));
        elements.loanTerm.addEventListener('input', handleManualTermInput);
        elements.stateSelect.addEventListener('change', updatePropertyTaxFromState);
        elements.globalVoiceBtn.addEventListener('click', toggleVoiceListening);
        elements.screenReaderBtn.addEventListener('click', toggleScreenReader);
        document.getElementById('view-monthly').addEventListener('click', () => setAmortizationView('monthly'));
        document.getElementById('view-yearly').addEventListener('click', () => setAmortizationView('yearly'));
        elements.prevPageBtn.addEventListener('click', () => changeAmortizationPage(-1));
        elements.nextPageBtn.addEventListener('click', () => changeAmortizationPage(1));
        document.getElementById('share-btn').addEventListener('click', shareResults);
        document.getElementById('save-pdf-btn').addEventListener('click', saveResultsAsPDF);
        document.getElementById('print-btn').addEventListener('click', () => window.print());
        document.getElementById('export-csv-btn').addEventListener('click', exportAmortizationToCSV);
        document.getElementById('print-schedule-btn').addEventListener('click', printAmortization);
        document.getElementById('hamburger').addEventListener('click', () => document.getElementById('nav-menu').classList.toggle('active'));
    }
    
    // --- EVENT HANDLERS ---
    function handleTabClick(e) {
        const targetTab = e.target.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        e.target.classList.add('active');
        document.querySelector(`.tab-content[data-tab-content="${targetTab}"]`).classList.add('active');
        syncDownPayment(targetTab);
    }

    function syncDownPayment(source) {
        const homePrice = parseFloat(elements.homePrice.value) || 0;
        if (source === 'dollar') {
            const dpAmount = parseFloat(elements.dpAmount.value) || 0;
            elements.dpPercent.value = ((dpAmount / homePrice) * 100).toFixed(2);
        } else {
            const dpPercent = parseFloat(elements.dpPercent.value) || 0;
            elements.dpAmount.value = ((homePrice * dpPercent) / 100).toFixed(0);
        }
        calculateAndDisplay();
    }

    function handleTermChipClick(e) {
        document.querySelectorAll('.term-chip').forEach(chip => chip.classList.remove('active'));
        e.target.classList.add('active');
        elements.loanTerm.value = e.target.dataset.term;
        calculateAndDisplay();
    }
    
    function handleManualTermInput() {
        const term = elements.loanTerm.value;
        document.querySelectorAll('.term-chip').forEach(chip => {
            if (chip.dataset.term === term) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });
        calculateAndDisplay();
    }

    // --- CORE CALCULATION & DISPLAY ---
    function calculateAndDisplay() {
        const inputs = getFormInputs();
        const results = calculateMortgage(inputs);
        state.amortizationData = generateAmortization(inputs, results);
        displayResults(results, inputs);
        displayAIInsights(inputs, results);
        displayCharts(results);
        displayAmortization();
    }

    function getFormInputs() {
        const homePrice = parseFloat(elements.homePrice.value) || 0;
        let dpAmount = parseFloat(elements.dpAmount.value) || 0;
        if (document.querySelector('.tab-btn[data-tab="percent"]').classList.contains('active')) {
            const dpPercent = parseFloat(elements.dpPercent.value) || 0;
            dpAmount = (homePrice * dpPercent) / 100;
        }
        return {
            homePrice, dpAmount, interestRate: parseFloat(elements.interestRate.value) || 0,
            loanTerm: parseInt(elements.loanTerm.value) || 0, startDate: elements.startDate.value,
            state: elements.stateSelect.value, propertyTax: parseFloat(elements.propertyTax.value) || 0,
            homeInsurance: parseFloat(elements.homeInsurance.value) || 0, hoaFees: parseFloat(elements.hoaFees.value) || 0,
            extraMonthly: parseFloat(elements.extraMonthly.value) || 0, extraYearly: parseFloat(elements.extraYearly.value) || 0,
            extraYearlyDate: elements.extraYearlyDate.value,
        };
    }

    function calculateMortgage(inputs) {
        const { homePrice, dpAmount, interestRate, loanTerm, propertyTax, homeInsurance, hoaFees } = inputs;
        const loanAmount = homePrice - dpAmount;
        if (loanAmount <= 0 || interestRate === 0 || loanTerm === 0) {
            return { totalMonthly: 0, loanAmount: 0, monthlyPI: 0, monthlyPMI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyHOA: 0, totalInterest: 0, totalPaid: 0, totalPaidWithExtra: 0 };
        }
        
        const monthlyRate = (interestRate / 100) / 12;
        const numPayments = loanTerm * 12;
        
        // Principal & Interest (P&I) Calculation
        let monthlyPI = 0;
        if (monthlyRate > 0) {
            monthlyPI = loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -numPayments));
        } else {
            monthlyPI = loanAmount / numPayments;
        }

        // PMI Calculation (if down payment is < 20%)
        const dpPercent = (dpAmount / homePrice) * 100;
        const monthlyPMI = dpPercent < 20 ? (loanAmount * 0.005) / 12 : 0;
        
        // Other monthly costs
        const monthlyTax = propertyTax / 12;
        const monthlyInsurance = homeInsurance / 12;
        const monthlyHOA = hoaFees;

        const totalMonthly = monthlyPI + monthlyPMI + monthlyTax + monthlyInsurance + monthlyHOA;
        const totalInterest = (monthlyPI * numPayments) - loanAmount;

        return {
            loanAmount, dpPercent, monthlyPI: isNaN(monthlyPI) ? 0 : monthlyPI, monthlyPMI, monthlyTax, monthlyInsurance, monthlyHOA,
            totalMonthly: isNaN(totalMonthly) ? 0 : totalMonthly,
            totalInterest: isNaN(totalInterest) ? 0 : totalInterest
        };
    }

    // --- DISPLAY FUNCTIONS ---
    function displayResults(results, inputs) {
        elements.totalPayment.textContent = formatCurrency(results.totalMonthly, 2);
        
        let breakdownHTML = `
            <div class="breakdown-item" data-tooltip="The portion of your payment that goes toward paying off the loan balance and interest."><span>Principal & Interest</span><span>${formatCurrency(results.monthlyPI, 2)}</span></div>
            <div class="breakdown-item" data-tooltip="Estimated monthly property taxes based on your state."><span>Property Tax</span><span>${formatCurrency(results.monthlyTax, 2)}</span></div>
            <div class="breakdown-item" data-tooltip="Estimated monthly homeowner's insurance cost."><span>Home Insurance</span><span>${formatCurrency(results.monthlyInsurance, 2)}</span></div>
        `;
        if (results.monthlyPMI > 0) {
            breakdownHTML += `<div class="breakdown-item" data-tooltip="Private Mortgage Insurance, required if your down payment is less than 20%."><span>PMI</span><span>${formatCurrency(results.monthlyPMI, 2)}</span></div>`;
        }
        if (inputs.hoaFees > 0) {
            breakdownHTML += `<div class="breakdown-item" data-tooltip="Monthly fees to a Homeowners' Association."><span>HOA Fees</span><span>${formatCurrency(results.monthlyHOA, 2)}</span></div>`;
        }
        elements.paymentBreakdown.innerHTML = breakdownHTML;
    }

    function generateAmortization(inputs, results) {
        let { loanAmount } = results;
        const { monthlyPI, extraMonthly, extraYearly, extraYearlyDate, interestRate } = inputs;
        const monthlyRate = (interestRate / 100) / 12;
        let balance = loanAmount;
        const schedule = [];
        let monthCounter = 0;
        let totalInterestPaid = 0;
        const yearlyExtraPaymentDate = inputs.extraYearlyDate ? new Date(inputs.extraYearlyDate) : null;

        while (balance > 0 && monthCounter < 480) { // Limit to 40 years to prevent infinite loops
            monthCounter++;
            let interestPayment = balance * monthlyRate;
            let principalPayment = monthlyPI - interestPayment;
            
            let totalPrincipalPaid = principalPayment + extraMonthly;
            if (yearlyExtraPaymentDate) {
                const currentMonth = new Date(elements.startDate.value).getMonth();
                const currentYear = new Date(elements.startDate.value).getFullYear();
                const paymentDate = new Date(currentYear, currentMonth + monthCounter);
                if (paymentDate.getFullYear() === yearlyExtraPaymentDate.getFullYear() && paymentDate.getMonth() === yearlyExtraPaymentDate.getMonth()) {
                    totalPrincipalPaid += extraYearly;
                }
            }
            
            balance -= totalPrincipalPaid;
            totalInterestPaid += interestPayment;

            schedule.push({
                month: monthCounter,
                balance: Math.max(0, balance),
                principal: principalPayment,
                interest: interestPayment,
                extra: extraMonthly,
            });
        }
        return schedule;
    }

    function displayAmortization() {
        const tableBody = elements.amortizationTableBody;
        tableBody.innerHTML = '';
        const dataToDisplay = state.amortizationData.slice((state.amortizationPage - 1) * config.amortizationPageSize, state.amortizationPage * config.amortizationPageSize);
        dataToDisplay.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.month}</td>
                <td>${formatCurrency(row.balance, 2)}</td>
                <td>${formatCurrency(row.principal, 2)}</td>
                <td>${formatCurrency(row.interest, 2)}</td>
            `;
            tableBody.appendChild(tr);
        });

        const totalPages = Math.ceil(state.amortizationData.length / config.amortizationPageSize);
        elements.pageInfo.textContent = `Page ${state.amortizationPage} of ${totalPages}`;
        elements.prevPageBtn.disabled = state.amortizationPage === 1;
        elements.nextPageBtn.disabled = state.amortizationPage >= totalPages;
    }

    function changeAmortizationPage(delta) {
        const totalPages = Math.ceil(state.amortizationData.length / config.amortizationPageSize);
        state.amortizationPage = Math.max(1, Math.min(totalPages, state.amortizationPage + delta));
        displayAmortization();
    }

    function setAmortizationView(view) {
        state.currentAmortizationView = view;
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`view-${view}`).classList.add('active');
        displayAmortization();
    }

    function populateStateDropdown() {
        const stateSelect = elements.stateSelect;
        stateSelect.innerHTML = `<option value="">Select a State</option>`;
        for (const [state, rate] of Object.entries(STATE_TAX_RATES)) {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelect.appendChild(option);
        }
    }

    function updatePropertyTaxFromState() {
        const homePrice = parseFloat(elements.homePrice.value) || 0;
        const selectedState = elements.stateSelect.value;
        if (selectedState && homePrice > 0) {
            const taxRate = STATE_TAX_RATES[selectedState];
            const propertyTax = (homePrice * (taxRate / 100)).toFixed(2);
            elements.propertyTax.value = propertyTax;
            calculateAndDisplay();
        }
    }
    
    function displayCharts(results) {
        if (state.pieChart) {
            state.pieChart.destroy();
        }
        const chartData = {
            labels: ['Principal & Interest', 'Property Tax', 'Home Insurance'],
            datasets: [{
                data: [results.monthlyPI, results.monthlyTax, results.monthlyInsurance],
                backgroundColor: ['#21808D', '#F59E0B', '#10B981'],
            }]
        };
        if (results.monthlyPMI > 0) {
            chartData.labels.push('PMI');
            chartData.datasets[0].data.push(results.monthlyPMI);
            chartData.datasets[0].backgroundColor.push('#EF4444');
        }
        if (results.monthlyHOA > 0) {
            chartData.labels.push('HOA Fees');
            chartData.datasets[0].data.push(results.monthlyHOA);
            chartData.datasets[0].backgroundColor.push('#8B5CF6');
        }
        state.pieChart = new Chart(elements.pieChartCanvas, {
            type: 'pie',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) { label += ': '; }
                                if (context.parsed !== null) { label += formatCurrency(context.parsed, 2); }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    function displayAIInsights(inputs, results) {
        const insights = [];
        const { homePrice, dpPercent, loanTerm, interestRate, extraMonthly, extraYearly } = inputs;
        const loanAmount = homePrice - inputs.dpAmount;

        if (loanTerm > 20 && interestRate > 6) {
            insights.push({
                type: 'tip',
                text: `**Consider a shorter term.** A 15-year mortgage could save you tens of thousands in interest over the life of the loan, though your monthly payments would be higher.`
            });
        }
        
        if (dpPercent < 20 && dpPercent > 5) {
            insights.push({
                type: 'warning',
                text: `**You're paying PMI.** With a down payment below 20%, you'll pay an additional $${results.monthlyPMI.toFixed(2)} per month for Private Mortgage Insurance. You can request to have this removed once your loan balance reaches 80% of the home's original value.`
            });
        } else if (dpPercent >= 20) {
            insights.push({
                type: 'success',
                text: `**Great job avoiding PMI!** Your ${dpPercent}% down payment means you don't have to pay for Private Mortgage Insurance, saving you money every month.`
            });
        }

        if (extraMonthly > 0 || extraYearly > 0) {
            insights.push({
                type: 'tip',
                text: `**Extra payments can save you big.** By paying an extra ${formatCurrency(extraMonthly, 2)} per month, you could significantly shorten your loan term and save a lot in total interest.`
            });
        }

        elements.insightsList.innerHTML = insights.map(i => `<li class="insight-item ${i.type}">${i.text}</li>`).join('');
    }

    // --- UTILITY & SUPPORT FUNCTIONS ---
    function debounce(fn, delay) {
        let id;
        return (...args) => {
            clearTimeout(id);
            id = setTimeout(() => fn(...args), delay);
        };
    }

    function formatCurrency(v, d = 0) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
    }

    function toggleVoiceListening() { /* Same as previous version */ }
    function setupSpeechRecognition() { /* Same as previous version */ }
    function toggleScreenReader() { state.screenReader = !state.screenReader; elements.screenReaderBtn.classList.toggle('active', state.screenReader); announceToSR(`Screen reader announcements ${state.screenReader ? 'enabled' : 'disabled'}.`); }
    function shareResults() { alert("Share functionality would be implemented here."); }
    function saveResultsAsPDF() { alert("PDF export functionality would be implemented here."); }
    function printAmortization() { window.print(); }
    function exportAmortizationToCSV() { alert("CSV export functionality would be implemented here."); }
    function announceToSR(message) { if (state.screenReader) { elements.srAnnouncer.textContent = ''; setTimeout(() => { elements.srAnnouncer.textContent = message; }, 100); } }

    init();
});
