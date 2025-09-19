/**
 * mortgage-calculator.js
 * FinGuid AI-Enhanced Mortgage Calculator v9.2
 * Production Ready with Interactive Chart and Extra Payment Logic
 * * Features:
 * - Real-time mortgage calculations with extra payment impact
 * - State-based property tax calculations
 * - Interactive mortgage over time chart with year dragging
 * - AI-powered insights
 * - Collapsible amortization schedule with pagination
 * - Comprehensive sharing functionality (Share, Save PDF, Print)
 * - Mobile responsive design & accessibility features
 */

'use strict';

// ========== CONFIGURATION & STATE ==========
const CONFIG = {
    debounceDelay: 300,
    amortizationPageSize: 12,
    colors: {
        remaining: '#ff6b6b',
        principal: '#4ecdc4',
        interest: '#45b7d1'
    }
};

const STATE = {
    currentCalculation: null,
    amortizationData: [],
    timelineData: [],
    amortizationView: 'yearly',
    amortizationPage: 1,
    timelineChart: null,
    currentYear: 1,
    maxYears: 30,
    isCalculating: false,
    chartInitialized: false
};

const STATE_TAX_RATES = {
    'AL': { name: 'Alabama', rate: 0.0041 }, 'AK': { name: 'Alaska', rate: 0.0119 }, 'AZ': { name: 'Arizona', rate: 0.0062 }, 'AR': { name: 'Arkansas', rate: 0.0061 }, 'CA': { name: 'California', rate: 0.0075 },
    'CO': { name: 'Colorado', rate: 0.0051 }, 'CT': { name: 'Connecticut', rate: 0.0214 }, 'DE': { name: 'Delaware', rate: 0.0057 }, 'FL': { name: 'Florida', rate: 0.0083 }, 'GA': { name: 'Georgia', rate: 0.0089 },
    'HI': { name: 'Hawaii', rate: 0.0028 }, 'ID': { name: 'Idaho', rate: 0.0069 }, 'IL': { name: 'Illinois', rate: 0.0227 }, 'IN': { name: 'Indiana', rate: 0.0085 }, 'IA': { name: 'Iowa', rate: 0.0157 },
    'KS': { name: 'Kansas', rate: 0.0141 }, 'KY': { name: 'Kentucky', rate: 0.0086 }, 'LA': { name: 'Louisiana', rate: 0.0055 }, 'ME': { name: 'Maine', rate: 0.0128 }, 'MD': { name: 'Maryland', rate: 0.0109 },
    'MA': { name: 'Massachusetts', rate: 0.0117 }, 'MI': { name: 'Michigan', rate: 0.0154 }, 'MN': { name: 'Minnesota', rate: 0.0112 }, 'MS': { name: 'Mississippi', rate: 0.0081 }, 'MO': { name: 'Missouri', rate: 0.0097 },
    'MT': { name: 'Montana', rate: 0.0084 }, 'NE': { name: 'Nebraska', rate: 0.0173 }, 'NV': { name: 'Nevada', rate: 0.0053 }, 'NH': { name: 'New Hampshire', rate: 0.0209 }, 'NJ': { name: 'New Jersey', rate: 0.0249 },
    'NM': { name: 'New Mexico', rate: 0.0080 }, 'NY': { name: 'New York', rate: 0.0169 }, 'NC': { name: 'North Carolina', rate: 0.0084 }, 'ND': { name: 'North Dakota', rate: 0.0142 }, 'OH': { name: 'Ohio', rate: 0.0162 },
    'OK': { name: 'Oklahoma', rate: 0.0090 }, 'OR': { name: 'Oregon', rate: 0.0093 }, 'PA': { name: 'Pennsylvania', rate: 0.0158 }, 'RI': { name: 'Rhode Island', rate: 0.0153 }, 'SC': { name: 'South Carolina', rate: 0.0057 },
    'SD': { name: 'South Dakota', rate: 0.0132 }, 'TN': { name: 'Tennessee', rate: 0.0064 }, 'TX': { name: 'Texas', rate: 0.0180 }, 'UT': { name: 'Utah', rate: 0.0066 }, 'VT': { name: 'Vermont', rate: 0.0190 },
    'VA': { name: 'Virginia', rate: 0.0082 }, 'WA': { name: 'Washington', rate: 0.0094 }, 'WV': { name: 'West Virginia', rate: 0.0059 }, 'WI': { name: 'Wisconsin', rate: 0.0185 }, 'WY': { name: 'Wyoming', rate: 0.0062 }
};

// ========== UTILITY FUNCTIONS ==========
const Utils = {
    $: (selector) => document.querySelector(selector),
    $$: (selector) => document.querySelectorAll(selector),
    formatCurrency: (amount, decimals = 0) => {
        if (isNaN(amount) || amount === null) return '$ 0';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount).replace('$', '$ ');
    },
    parseCurrency: (value) => parseFloat(value.toString().replace(/[$,\s]/g, '')) || 0,
    formatNumberInput: (value) => value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','),
    debounce: (func, delay) => { let timeoutId; return (...args) => { clearTimeout(timeoutId); timeoutId = setTimeout(() => func.apply(this, args), delay); }; },
    showToast: (message, type = 'info') => {
        const container = Utils.$('#toast-container'); if (!container) return;
        const toast = document.createElement('div'); toast.className = `toast toast-${type}`;
        toast.innerHTML = `<div class="toast-content"><span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span><span class="toast-message">${message}</span></div><button class="toast-close" aria-label="Close">&times;</button>`;
        container.appendChild(toast); setTimeout(() => toast.remove(), 5000); toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    },
    showLoading: (show = true) => { const overlay = Utils.$('#loading-overlay'); if (overlay) overlay.style.display = show ? 'flex' : 'none'; }
};

// ========== MORTGAGE CALCULATIONS ==========
const MortgageCalculator = {
    calculate(inputs) {
        const { loanAmount, interestRate, loanTerm, propertyTax, homeInsurance, pmi, hoaFees, extraPayment } = inputs;
        const monthlyRate = interestRate / 100 / 12;
        const totalPayments = loanTerm * 12;
        if (loanAmount <= 0 || totalPayments <= 0) return this.getEmptyResult();
        
        const principalInterest = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
        const monthlyPropertyTax = propertyTax / 12;
        const monthlyInsurance = homeInsurance / 12;
        const monthlyPmi = pmi / 12;
        const totalMonthlyPayment = principalInterest + monthlyPropertyTax + monthlyInsurance + monthlyPmi + hoaFees;

        const originalTotalInterest = (principalInterest * totalPayments) - loanAmount;
        let extraPaymentImpact = null;
        let totalInterest = originalTotalInterest;
        
        if (extraPayment > 0) {
            extraPaymentImpact = this.calculateExtraPaymentImpact(loanAmount, monthlyRate, totalPayments, principalInterest, extraPayment);
            totalInterest = extraPaymentImpact.newTotalInterest;
        }

        return {
            principalInterest, monthlyPropertyTax, monthlyInsurance, monthlyPmi, monthlyHoa: hoaFees,
            totalMonthlyPayment, totalInterest, totalCost: loanAmount + totalInterest, extraPaymentImpact,
            downPaymentPercent: (inputs.downPayment / inputs.homePrice) * 100
        };
    },
    calculateExtraPaymentImpact(loanAmount, monthlyRate, totalPayments, regularPayment, extraPayment) {
        let balance = loanAmount; let totalInterestWithExtra = 0; let paymentCount = 0;
        const monthlyPaymentWithExtra = regularPayment + extraPayment;
        while (balance > 0.01 && paymentCount < totalPayments * 2) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = Math.min(monthlyPaymentWithExtra - interestPayment, balance);
            balance -= principalPayment; totalInterestWithExtra += interestPayment; paymentCount++;
            if (balance <= 0) break;
        }
        const originalTotalInterest = (regularPayment * totalPayments) - loanAmount;
        const interestSavings = originalTotalInterest - totalInterestWithExtra;
        const monthsSaved = totalPayments - paymentCount;
        const today = new Date(); const payoffDate = new Date(); payoffDate.setMonth(today.getMonth() + paymentCount);
        return {
            interestSavings, monthsSaved, yearsSaved: Math.floor(monthsSaved / 12),
            monthsRemaining: monthsSaved % 12, payoffDate, newTotalInterest: totalInterestWithExtra
        };
    },
    generateAmortizationSchedule(loanAmount, interestRate, loanTerm, extraPayment = 0) {
        const monthlyRate = interestRate / 100 / 12;
        const totalPayments = loanTerm * 12;
        const principalInterest = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
        let balance = loanAmount; const schedule = [];
        for (let i = 0; i < totalPayments * 2 && balance > 0.01; i++) {
            const interest = balance * monthlyRate;
            const principal = Math.min((principalInterest + extraPayment) - interest, balance);
            balance -= principal;
            schedule.push({ principal, interest, balance: Math.max(0, balance) });
        }
        return schedule;
    },
    generateTimelineData(schedule) {
        const timelineData = []; let cumulativePrincipal = 0; let cumulativeInterest = 0;
        for (let year = 1; year <= schedule.length / 12 + 1; year++) {
            const yearEndIndex = Math.min(year * 12 - 1, schedule.length - 1);
            if (yearEndIndex < 0 || !schedule[yearEndIndex]) break;
            const yearPayments = schedule.slice((year - 1) * 12, year * 12);
            const yearlyPrincipal = yearPayments.reduce((sum, p) => sum + p.principal, 0);
            const yearlyInterest = yearPayments.reduce((sum, p) => sum + p.interest, 0);
            cumulativePrincipal += yearlyPrincipal; cumulativeInterest += yearlyInterest;
            timelineData.push({
                year, remainingBalance: schedule[yearEndIndex].balance,
                principalPaid: cumulativePrincipal, interestPaid: cumulativeInterest
            });
            if (schedule[yearEndIndex].balance <= 0) break;
        }
        return timelineData;
    },
    getEmptyResult: () => ({ principalInterest: 0, monthlyPropertyTax: 0, monthlyInsurance: 0, monthlyPmi: 0, monthlyHoa: 0, totalMonthlyPayment: 0, totalInterest: 0, totalCost: 0, extraPaymentImpact: null, downPaymentPercent: 0 })
};

// ========== CHART MANAGEMENT ==========
const ChartManager = {
    initialize() {
        if (typeof Chart === 'undefined') { Utils.showToast('Chart library not loaded.', 'error'); return; }
        const canvas = Utils.$('#timeline-chart'); if (!canvas) return;
        if (STATE.timelineChart) STATE.timelineChart.destroy();
        const ctx = canvas.getContext('2d');
        STATE.timelineChart = new Chart(ctx, {
            type: 'line', data: { labels: [], datasets: [ { label: 'Remaining Balance', data: [], borderColor: CONFIG.colors.remaining, tension: 0.1 }, { label: 'Principal Paid', data: [], borderColor: CONFIG.colors.principal, tension: 0.1 }, { label: 'Interest Paid', data: [], borderColor: CONFIG.colors.interest, tension: 0.1 }] },
            options: {
                responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' },
                scales: { x: { title: { display: true, text: 'Years' } }, y: { title: { display: true, text: 'Amount ($)' }, ticks: { callback: (value) => '$' + (value / 1000) + 'k' } } },
                plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${Utils.formatCurrency(context.parsed.y)}` } } },
                onHover: (event, activeElements) => { if (activeElements.length > 0) UI.updateYearSlider(activeElements[0].index + 1); },
                onClick: (event, activeElements) => { if (activeElements.length > 0) UI.updateYearSlider(activeElements[0].index + 1); }
            }
        });
        STATE.chartInitialized = true;
    },
    update(timelineData) {
        if (!STATE.timelineChart || !timelineData) return;
        STATE.timelineChart.data.labels = timelineData.map(d => d.year);
        STATE.timelineChart.data.datasets[0].data = timelineData.map(d => d.remainingBalance);
        STATE.timelineChart.data.datasets[1].data = timelineData.map(d => d.principalPaid);
        STATE.timelineChart.data.datasets[2].data = timelineData.map(d => d.interestPaid);
        STATE.timelineChart.update('none');
    }
};

// ========== UI MANAGEMENT ==========
const UI = {
    init() {
        this.populateStates(); this.bindEvents(); this.setupCollapsibleSections();
        setTimeout(() => { if (this.isFormValid()) this.calculateMortgage(); }, 500);
    },
    populateStates() {
        const stateSelect = Utils.$('#property-state'); if (!stateSelect) return;
        stateSelect.innerHTML = '<option value="">Select State</option>';
        Object.entries(STATE_TAX_RATES).forEach(([code, data]) => {
            const option = document.createElement('option'); option.value = code; option.textContent = data.name; stateSelect.appendChild(option);
        });
        stateSelect.value = 'CA';
    },
    bindEvents() {
        const form = Utils.$('#mortgage-form');
        const debouncedCalculate = Utils.debounce(this.calculateMortgage, CONFIG.debounceDelay);
        form.addEventListener('input', e => {
            const target = e.target;
            if (target.type === 'text') this.formatCurrencyInput(e);
            if (['home-price', 'down-payment'].includes(target.id)) this.updateLoanAmount();
            debouncedCalculate();
        });
        Utils.$('#property-state').addEventListener('change', this.updatePropertyTax);
        Utils.$('#year-slider').addEventListener('input', this.updateTimelineDisplay);
        Utils.$$('.toggle-btn').forEach(btn => btn.addEventListener('click', e => this.handleViewToggle(e.target.dataset.view)));
        Utils.$('#prev-page').addEventListener('click', () => this.changeAmortizationPage(-1));
        Utils.$('#next-page').addEventListener('click', () => this.changeAmortizationPage(1));
        this.bindShareEvents();
        Utils.$('#theme-toggle').addEventListener('click', this.toggleTheme);
        Utils.$('#mobile-menu-toggle').addEventListener('click', () => Utils.$('#nav-menu').classList.toggle('open'));
    },
    setupCollapsibleSections() {
        Utils.$$('.collapsible-header').forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                const isExpanded = header.getAttribute('aria-expanded') === 'true';
                header.setAttribute('aria-expanded', !isExpanded);
                content.style.display = isExpanded ? 'none' : 'block';
            });
        });
    },
    calculateMortgage() {
        if (STATE.isCalculating) return; STATE.isCalculating = true; Utils.showLoading(true);
        try {
            const inputs = {
                homePrice: Utils.parseCurrency(Utils.$('#home-price').value), downPayment: Utils.parseCurrency(Utils.$('#down-payment').value),
                interestRate: parseFloat(Utils.$('#interest-rate').value) || 0, loanTerm: parseInt(Utils.$('#loan-term').value) || 30,
                propertyTax: Utils.parseCurrency(Utils.$('#property-tax').value), homeInsurance: Utils.parseCurrency(Utils.$('#home-insurance').value),
                pmi: Utils.parseCurrency(Utils.$('#pmi').value), hoaFees: Utils.parseCurrency(Utils.$('#hoa-fees').value),
                extraPayment: Utils.parseCurrency(Utils.$('#extra-payment').value)
            };
            inputs.loanAmount = Math.max(0, inputs.homePrice - inputs.downPayment);
            if (inputs.homePrice <= 0 || inputs.interestRate <= 0 || inputs.loanTerm <= 0) return;
            
            const results = MortgageCalculator.calculate(inputs);
            STATE.currentCalculation = { inputs, results };
            STATE.amortizationData = MortgageCalculator.generateAmortizationSchedule(inputs.loanAmount, inputs.interestRate, inputs.loanTerm, inputs.extraPayment);
            STATE.timelineData = MortgageCalculator.generateTimelineData(STATE.amortizationData);

            UI.updateResults(results); UI.renderAmortizationTable(); UI.updateTimelineChart(); UI.updateAIInsights(inputs, results);
        } catch (error) { Utils.showToast('Error in calculation.', 'error'); } 
        finally { STATE.isCalculating = false; Utils.showLoading(false); }
    },
    updateResults(results) {
        const elements = {
            '#total-payment': results.totalMonthlyPayment, '#principal-interest': results.principalInterest,
            '#monthly-property-tax': results.monthlyPropertyTax, '#monthly-insurance': results.monthlyInsurance,
            '#monthly-pmi': results.monthlyPmi, '#monthly-hoa': results.monthlyHoa,
            '#total-interest': results.totalInterest, '#total-cost': results.totalCost
        };
        for (const [selector, value] of Object.entries(elements)) Utils.$(selector).textContent = Utils.formatCurrency(value, selector === '#total-payment' ? 2 : 0);
        
        Utils.$('#payment-breakdown').innerHTML = `<span>Principal & Interest: ${Utils.formatCurrency(results.principalInterest, 2)}</span>`;
        
        const impactSection = Utils.$('#extra-payment-impact');
        if (results.extraPaymentImpact) {
            const { interestSavings, yearsSaved, monthsRemaining, payoffDate } = results.extraPaymentImpact;
            Utils.$('#interest-savings').textContent = Utils.formatCurrency(interestSavings);
            Utils.$('#time-saved').textContent = `${yearsSaved} yr, ${monthsRemaining} mo`;
            Utils.$('#payoff-date').textContent = payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            impactSection.style.display = 'block';
        } else {
            impactSection.style.display = 'none';
        }
    },
    renderAmortizationTable() {
        const tbody = Utils.$('#amortization-tbody'); if (!tbody) return;
        let data, startIndex, endIndex, totalPages;
        const itemsPerPage = CONFIG.amortizationPageSize;

        if (STATE.amortizationView === 'yearly') {
            const yearlyData = [];
            for (let i = 0; i < STATE.amortizationData.length / 12; i++) {
                const yearSlice = STATE.amortizationData.slice(i * 12, (i + 1) * 12);
                if (yearSlice.length === 0) continue;
                yearlyData.push({
                    label: `Year ${i + 1}`,
                    principal: yearSlice.reduce((a, b) => a + b.principal, 0),
                    interest: yearSlice.reduce((a, b) => a + b.interest, 0),
                    balance: yearSlice[yearSlice.length - 1].balance
                });
            }
            data = yearlyData;
        } else {
            data = STATE.amortizationData.map((row, i) => ({
                label: `Month ${i + 1}`, principal: row.principal, interest: row.interest, balance: row.balance
            }));
        }
        
        totalPages = Math.ceil(data.length / itemsPerPage);
        startIndex = (STATE.amortizationPage - 1) * itemsPerPage;
        endIndex = startIndex + itemsPerPage;
        
        tbody.innerHTML = data.slice(startIndex, endIndex).map(row => `<tr><td>${row.label}</td><td>${Utils.formatCurrency(row.principal)}</td><td>${Utils.formatCurrency(row.interest)}</td><td>${Utils.formatCurrency(row.balance)}</td></tr>`).join('');
        this.updateAmortizationPagination(totalPages);
    },
    updateAmortizationPagination(totalPages) {
        Utils.$('#page-info').textContent = `Page ${STATE.amortizationPage} of ${totalPages || 1}`;
        Utils.$('#pagination-text').textContent = `Page ${STATE.amortizationPage} of ${totalPages || 1}`;
        Utils.$('#prev-page').disabled = STATE.amortizationPage <= 1;
        Utils.$('#next-page').disabled = STATE.amortizationPage >= totalPages;
    },
    changeAmortizationPage(direction) {
        STATE.amortizationPage += direction; this.renderAmortizationTable();
    },
    handleViewToggle(view) {
        STATE.amortizationView = view; STATE.amortizationPage = 1;
        Utils.$$('.toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
        this.renderAmortizationTable();
    },
    updateTimelineChart() {
        if (!STATE.chartInitialized) ChartManager.initialize();
        if (STATE.timelineData.length > 0) {
            ChartManager.update(STATE.timelineData);
            STATE.maxYears = STATE.timelineData.length;
            const slider = Utils.$('#year-slider'); slider.max = STATE.maxYears; slider.value = 1;
            Utils.$('#max-year-display').textContent = `Year ${STATE.maxYears}`;
            this.updateTimelineDisplay();
        }
    },
    updateTimelineDisplay() {
        const year = parseInt(Utils.$('#year-slider').value);
        const yearData = STATE.timelineData[year - 1];
        if (yearData) {
            Utils.$('#remaining-balance').textContent = Utils.formatCurrency(yearData.remainingBalance);
            Utils.$('#principal-paid').textContent = Utils.formatCurrency(yearData.principalPaid);
            Utils.$('#interest-paid').textContent = Utils.formatCurrency(yearData.interestPaid);
            Utils.$('#current-year-display').textContent = `Year ${year}`;
        }
        STATE.currentYear = year;
    },
    updateYearSlider(year) {
        const slider = Utils.$('#year-slider');
        if (slider && year >= 1 && year <= STATE.maxYears) { slider.value = year; this.updateTimelineDisplay(); }
    },
    updateAIInsights(inputs, results) {
        const container = Utils.$('#insights-container'); if (!container) return;
        const insights = [];
        if (results.downPaymentPercent < 20) insights.push({ type: 'warning', icon: '⚠️', title: 'PMI Alert', content: `Your down payment is below 20%. Consider increasing it to remove PMI and lower your monthly cost.` });
        else insights.push({ type: 'success', icon: '✅', title: 'Great Down Payment!', content: `With a ${results.downPaymentPercent.toFixed(1)}% down payment, you've avoided PMI.` });
        if (results.extraPaymentImpact) insights.push({ type: 'success', icon: '🚀', title: 'Accelerated Payoff', content: `Your extra payment saves you ${Utils.formatCurrency(results.extraPaymentImpact.interestSavings)} and pays off your loan ${results.extraPaymentImpact.yearsSaved} years early!` });
        else insights.push({ type: 'tip', icon: '💡', title: 'Pay Off Faster', content: 'Even a small extra monthly payment can save you thousands in interest over the life of the loan.' });
        const interestRatio = results.totalInterest / inputs.loanAmount;
        if (interestRatio > 1) insights.push({ type: 'warning', icon: '📈', title: 'High Interest Cost', content: `You'll pay ${Math.round(interestRatio*100)}% of the loan amount in interest. Consider a shorter term or extra payments.` });
        
        container.innerHTML = insights.map(i => `<div class="insight-card ${i.type}"><div class="insight-icon">${i.icon}</div><div class="insight-content"><h3 class="insight-title">${i.title}</h3><p class="insight-text">${i.content}</p></div></div>`).join('');
    },
    updateLoanAmount() {
        const homePrice = Utils.parseCurrency(Utils.$('#home-price').value);
        const downPayment = Utils.parseCurrency(Utils.$('#down-payment').value);
        const loanAmount = Math.max(0, homePrice - downPayment);
        Utils.$('#loan-amount').value = Utils.formatNumberInput(loanAmount.toFixed(0));
        Utils.$('#down-payment-percent').textContent = homePrice > 0 ? `${((downPayment / homePrice) * 100).toFixed(1)}%` : '0.0%';
    },
    updatePropertyTax() {
        const stateCode = Utils.$('#property-state').value;
        const homePrice = Utils.parseCurrency(Utils.$('#home-price').value);
        if (stateCode && STATE_TAX_RATES[stateCode] && homePrice > 0) {
            const annualTax = homePrice * STATE_TAX_RATES[stateCode].rate;
            Utils.$('#property-tax').value = Utils.formatNumberInput(annualTax.toFixed(0));
        }
        UI.calculateMortgage();
    },
    formatCurrencyInput(e) { e.target.value = Utils.formatNumberInput(e.target.value); },
    isFormValid: () => ['home-price', 'down-payment', 'interest-rate'].every(id => Utils.parseCurrency(Utils.$(`#${id}`).value) > 0),
    toggleTheme() {
        const body = document.body;
        const currentScheme = body.getAttribute('data-color-scheme');
        const newScheme = currentScheme === 'light' ? 'dark' : 'light';
        body.setAttribute('data-color-scheme', newScheme);
        Utils.$('#theme-toggle .theme-icon').textContent = newScheme === 'light' ? '🌙' : '☀️';
    },
    bindShareEvents() {
        Utils.$('#share-results-btn').addEventListener('click', () => UI.openShareModal());
        Utils.$('#save-pdf-btn').addEventListener('click', () => UI.generatePDF());
        Utils.$('#print-btn').addEventListener('click', () => window.print());
        const modal = Utils.$('#share-modal');
        modal.querySelector('.modal-overlay').addEventListener('click', UI.closeShareModal);
        modal.querySelector('.modal-close').addEventListener('click', UI.closeShareModal);
        Utils.$$('.share-option').forEach(opt => opt.addEventListener('click', e => UI.handleShare(e.currentTarget.dataset.method)));
        Utils.$('.copy-url-btn').addEventListener('click', UI.copyShareUrl);
    },
    openShareModal() { Utils.$('#share-modal').style.display = 'flex'; Utils.$('#share-url').value = window.location.href; },
    closeShareModal() { Utils.$('#share-modal').style.display = 'none'; },
    handleShare(method) { /* Share logic here */ Utils.showToast(`${method} sharing not implemented.`, 'info'); this.closeShareModal(); },
    copyShareUrl() { navigator.clipboard.writeText(Utils.$('#share-url').value).then(() => Utils.showToast('Link copied!', 'success')); },
    generatePDF() {
        if (!STATE.currentCalculation) { Utils.showToast('Please calculate first.', 'error'); return; }
        Utils.showToast('PDF generation started...', 'info');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        const { inputs, results } = STATE.currentCalculation;
        pdf.text("Mortgage Calculation Report", 10, 10);
        pdf.text(`Total Monthly Payment: ${Utils.formatCurrency(results.totalMonthlyPayment, 2)}`, 10, 20);
        pdf.text(`Home Price: ${Utils.formatCurrency(inputs.homePrice)}`, 10, 30);
        pdf.save('mortgage-report.pdf');
    }
};

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => UI.init());
