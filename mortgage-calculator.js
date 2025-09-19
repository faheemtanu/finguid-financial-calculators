/**
 * mortgage-calculator.js
 * FinGuid AI-Enhanced Mortgage Calculator v9.1
 * Production Ready with Interactive Chart and PDF Export
 */

'use strict';

// ========== CONFIGURATION & STATE ==========
const CONFIG = {
    debounceDelay: 300,
    amortizationPageSize: 12,
    colors: {
        remaining: 'rgba(255, 107, 107, 1)', // #ff6b6b
        principal: 'rgba(78, 205, 196, 1)', // #4ecdc4
        interest:  'rgba(69, 183, 209, 1)', // #45b7d1
        grid: 'rgba(0, 0, 0, 0.1)'
    }
};

const STATE = {
    currentCalculation: null,
    amortizationData: [],
    timelineData: [],
    currentPage: 1,
    totalPages: 1,
    timelineChart: null,
    chartInitialized: false,
    maxYears: 30
};

// US States with property tax rates (2024 data)
const STATE_TAX_RATES = {
    'AL': { name: 'Alabama', rate: 0.0041 }, 'AK': { name: 'Alaska', rate: 0.0119 },
    'AZ': { name: 'Arizona', rate: 0.0062 }, 'AR': { name: 'Arkansas', rate: 0.0061 },
    'CA': { name: 'California', rate: 0.0075 }, 'CO': { name: 'Colorado', rate: 0.0051 },
    'CT': { name: 'Connecticut', rate: 0.0214 }, 'DE': { name: 'Delaware', rate: 0.0057 },
    'FL': { name: 'Florida', rate: 0.0083 }, 'GA': { name: 'Georgia', rate: 0.0089 },
    'HI': { name: 'Hawaii', rate: 0.0028 }, 'ID': { name: 'Idaho', rate: 0.0069 },
    'IL': { name: 'Illinois', rate: 0.0227 }, 'IN': { name: 'Indiana', rate: 0.0085 },
    'IA': { name: 'Iowa', rate: 0.0157 }, 'KS': { name: 'Kansas', rate: 0.0141 },
    'KY': { name: 'Kentucky', rate: 0.0086 }, 'LA': { name: 'Louisiana', rate: 0.0055 },
    'ME': { name: 'Maine', rate: 0.0128 }, 'MD': { name: 'Maryland', rate: 0.0109 },
    'MA': { name: 'Massachusetts', rate: 0.0117 }, 'MI': { name: 'Michigan', rate: 0.0154 },
    'MN': { name: 'Minnesota', rate: 0.0112 }, 'MS': { name: 'Mississippi', rate: 0.0081 },
    'MO': { name: 'Missouri', rate: 0.0097 }, 'MT': { name: 'Montana', rate: 0.0084 },
    'NE': { name: 'Nebraska', rate: 0.0173 }, 'NV': { name: 'Nevada', rate: 0.0053 },
    'NH': { name: 'New Hampshire', rate: 0.0209 }, 'NJ': { name: 'New Jersey', rate: 0.0249 },
    'NM': { name: 'New Mexico', rate: 0.0080 }, 'NY': { name: 'New York', rate: 0.0169 },
    'NC': { name: 'North Carolina', rate: 0.0084 }, 'ND': { name: 'North Dakota', rate: 0.0142 },
    'OH': { name: 'Ohio', rate: 0.0162 }, 'OK': { name: 'Oklahoma', rate: 0.0090 },
    'OR': { name: 'Oregon', rate: 0.0093 }, 'PA': { name: 'Pennsylvania', rate: 0.0158 },
    'RI': { name: 'Rhode Island', rate: 0.0153 }, 'SC': { name: 'South Carolina', rate: 0.0057 },
    'SD': { name: 'South Dakota', rate: 0.0132 }, 'TN': { name: 'Tennessee', rate: 0.0064 },
    'TX': { name: 'Texas', rate: 0.0180 }, 'UT': { name: 'Utah', rate: 0.0066 },
    'VT': { name: 'Vermont', rate: 0.0190 }, 'VA': { name: 'Virginia', rate: 0.0082 },
    'WA': { name: 'Washington', rate: 0.0094 }, 'WV': { name: 'West Virginia', rate: 0.0059 },
    'WI': { name: 'Wisconsin', rate: 0.0185 }, 'WY': { name: 'Wyoming', rate: 0.0062 }
};

// ========== UTILITY FUNCTIONS ==========
const Utils = {
    $: (selector) => document.querySelector(selector),
    $$: (selector) => document.querySelectorAll(selector),
    formatCurrency: (amount, decimals = 0) => {
        if (isNaN(amount) || amount === null) return '$ 0';
        const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount);
        return formatted.replace('$', '$ ');
    },
    parseCurrency: (value) => parseFloat(String(value).replace(/[$,\s]/g, '')) || 0,
    formatNumberInput: (value) => value.replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','),
    debounce: (func, delay) => {
        let timeoutId;
        return (...args) => { clearTimeout(timeoutId); timeoutId = setTimeout(() => func.apply(this, args), delay); };
    },
    showToast: (message, type = 'info') => {
        const icons = { success: '✅', error: '❌', info: 'ℹ️' };
        const container = Utils.$('#toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    },
    showLoading: (show) => { Utils.$('#loading-overlay').style.display = show ? 'flex' : 'none'; },
};

// ========== MORTGAGE CALCULATIONS ==========
const MortgageCalculator = {
    calculate(inputs) {
        const { homePrice, downPayment, interestRate, loanTerm, propertyTax, homeInsurance, pmi, hoaFees, extraPayment = 0 } = inputs;
        const loanAmount = homePrice - downPayment;
        if (loanAmount <= 0) return this.getEmptyResult();
        const monthlyRate = interestRate / 100 / 12;
        const totalPayments = loanTerm * 12;
        const principalInterest = monthlyRate > 0 ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1) : loanAmount / totalPayments;
        const totalMonthlyPayment = principalInterest + (propertyTax / 12) + (homeInsurance / 12) + (pmi / 12) + hoaFees;
        
        const schedule = this.generateAmortizationSchedule(loanAmount, interestRate, loanTerm, 0);
        const scheduleWithExtra = this.generateAmortizationSchedule(loanAmount, interestRate, loanTerm, extraPayment);

        const totalInterest = schedule.reduce((sum, p) => sum + p.interest, 0);
        const payoffDate = schedule[schedule.length - 1]?.date || new Date();

        let extraPaymentImpact = null;
        if (extraPayment > 0) {
            const totalInterestWithExtra = scheduleWithExtra.reduce((sum, p) => sum + p.interest, 0);
            const monthsSaved = schedule.length - scheduleWithExtra.length;
            extraPaymentImpact = {
                interestSavings: totalInterest - totalInterestWithExtra,
                monthsSaved,
                yearsSaved: Math.floor(monthsSaved / 12),
                monthsRemaining: monthsSaved % 12,
                payoffDate: scheduleWithExtra[scheduleWithExtra.length - 1]?.date || new Date(),
                newLoanTerm: Math.ceil(scheduleWithExtra.length / 12)
            };
        }
        
        return {
            principalInterest,
            totalMonthlyPayment,
            totalInterest,
            totalCost: loanAmount + totalInterest,
            payoffDate,
            extraPaymentImpact,
            downPaymentPercent: (downPayment / homePrice) * 100,
            monthlyPropertyTax: propertyTax / 12,
            monthlyInsurance: homeInsurance / 12,
            monthlyPmi: pmi / 12,
            monthlyHoa: hoaFees,
        };
    },
    getEmptyResult() { return { loanAmount: 0, totalMonthlyPayment: 0, totalInterest: 0, totalCost: 0, payoffDate: new Date(), extraPaymentImpact: null }; },
    generateAmortizationSchedule(loanAmount, interestRate, loanTerm, extraPayment = 0) {
        const monthlyRate = interestRate / 100 / 12;
        const totalPayments = loanTerm * 12;
        const principalInterest = monthlyRate > 0 ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1) : (loanAmount / totalPayments);
        let balance = loanAmount;
        const schedule = [];
        for (let i = 1; balance > 0.01 && i <= totalPayments * 2; i++) {
            const interest = balance * monthlyRate;
            let principal = principalInterest - interest + extraPayment;
            if (balance - principal < 0) {
                principal = balance;
                balance = 0;
            } else {
                balance -= principal;
            }
            const paymentDate = new Date();
            paymentDate.setMonth(paymentDate.getMonth() + i);
            schedule.push({ paymentNumber: i, date: paymentDate, principal, interest, balance: Math.max(0, balance) });
        }
        return schedule;
    },
    generateTimelineData(amortizationData, loanTerm) {
        if (!amortizationData.length) return [];
        const timeline = [];
        let principalPaid = 0, interestPaid = 0;
        for (let year = 1; year <= Math.max(loanTerm, Math.ceil(amortizationData.length / 12)); year++) {
            const yearEndIndex = Math.min(year * 12, amortizationData.length) - 1;
            if (yearEndIndex < 0) break;
            const yearSlice = amortizationData.slice((year - 1) * 12, year * 12);
            principalPaid += yearSlice.reduce((s, p) => s + p.principal, 0);
            interestPaid += yearSlice.reduce((s, p) => s + p.interest, 0);
            timeline.push({
                year,
                remainingBalance: amortizationData[yearEndIndex].balance,
                principalPaid,
                interestPaid,
            });
            if (amortizationData[yearEndIndex].balance <= 0) break;
        }
        return timeline;
    },
};

// ========== CHART MANAGEMENT ==========
const ChartManager = {
    verticalLinePlugin: {
        id: 'verticalLine',
        afterDraw: chart => {
            if (chart.tooltip?._active?.length) {
                const ctx = chart.ctx;
                const activePoint = chart.tooltip._active[0];
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(activePoint.element.x, chart.chartArea.top);
                ctx.lineTo(activePoint.element.x, chart.chartArea.bottom);
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.stroke();
                ctx.restore();
            }
        }
    },
    initializeChart() {
        if (STATE.timelineChart) STATE.timelineChart.destroy();
        const ctx = Utils.$('#timeline-chart').getContext('2d');
        STATE.timelineChart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [
                { label: 'Remaining Balance', data: [], borderColor: CONFIG.colors.remaining, tension: 0.1, borderWidth: 3 },
                { label: 'Principal Paid', data: [], borderColor: CONFIG.colors.principal, tension: 0.1, borderWidth: 3 },
                { label: 'Interest Paid', data: [], borderColor: CONFIG.colors.interest, tension: 0.1, borderWidth: 3 }
            ]},
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: { ticks: { callback: value => '$' + (value / 1000) + 'k' } },
                    x: { grid: { display: false } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false, callbacks: { label: c => `${c.dataset.label}: ${Utils.formatCurrency(c.raw)}` } }
                },
                onHover: (event, elements) => {
                    if (elements.length > 0) {
                        const year = elements[0].index + 1;
                        UI.updateYearSlider(year);
                    }
                }
            },
            plugins: [this.verticalLinePlugin]
        });
        STATE.chartInitialized = true;
    },
    updateChart(timelineData) {
        if (!STATE.chartInitialized || !timelineData.length) return;
        const chart = STATE.timelineChart;
        chart.data.labels = timelineData.map(d => d.year);
        chart.data.datasets[0].data = timelineData.map(d => d.remainingBalance);
        chart.data.datasets[1].data = timelineData.map(d => d.principalPaid);
        chart.data.datasets[2].data = timelineData.map(d => d.interestPaid);
        chart.update('none');
    }
};

// ========== UI MANAGEMENT ==========
const UI = {
    init() {
        this.populateStates();
        this.bindEvents();
        setTimeout(() => { if (this.isFormValid()) this.calculateMortgage(); }, 100);
    },
    populateStates() {
        const select = Utils.$('#property-state');
        select.innerHTML = '<option value="">Select State</option>';
        Object.entries(STATE_TAX_RATES).forEach(([code, data]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = data.name;
            select.appendChild(option);
        });
        select.value = 'CA';
    },
    bindEvents() {
        const form = Utils.$('#mortgage-form');
        const debouncedCalculate = Utils.debounce(this.calculateMortgage, CONFIG.debounceDelay);
        form.addEventListener('input', e => {
            const target = e.target;
            if (target.id === 'home-price' || target.id === 'down-payment') {
                this.updateLoanAmount();
                this.updateDownPaymentPercentage();
            }
            if (target.id === 'home-price' || target.id === 'property-state') {
                this.updatePropertyTax();
            }
            if (target.id.includes('-payment') || target.id === 'home-price') {
                this.formatCurrencyInput(e);
            }
            this.updateActiveTermChip();
            debouncedCalculate();
        });
        Utils.$$('#share-results-btn').forEach(btn => btn.addEventListener('click', () => this.openShareModal()));
        Utils.$('#save-pdf-btn').addEventListener('click', this.generatePDF);
        Utils.$('#print-btn').addEventListener('click', () => window.print());
        Utils.$('#year-slider').addEventListener('input', this.updateTimelineDisplayFromSlider);
        Utils.$('#prev-page').addEventListener('click', () => this.changeAmortizationPage(-1));
        Utils.$('#next-page').addEventListener('click', () => this.changeAmortizationPage(1));
        Utils.$('#theme-toggle').addEventListener('click', this.toggleTheme);
        this.bindTabEvents();
        this.bindModalEvents();
    },
    bindTabEvents() {
        Utils.$$('.tab-btn-main').forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                Utils.$$('.tab-btn-main').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                Utils.$$('.tab-content-main').forEach(content => {
                    content.classList.toggle('active', content.id === tabId);
                });
            });
        });
    },
    bindModalEvents() {
        const modal = Utils.$('#share-modal');
        modal.querySelector('.modal-overlay').addEventListener('click', this.closeShareModal);
        modal.querySelector('.modal-close').addEventListener('click', this.closeShareModal);
        modal.querySelector('.copy-url-btn').addEventListener('click', this.copyShareUrl);
    },
    calculateMortgage() {
        if (!UI.isFormValid()) return;
        Utils.showLoading(true);
        const inputs = {
            homePrice: Utils.parseCurrency(Utils.$('#home-price').value),
            downPayment: Utils.parseCurrency(Utils.$('#down-payment').value),
            interestRate: parseFloat(Utils.$('#interest-rate').value),
            loanTerm: parseInt(Utils.$('#loan-term').value),
            propertyTax: Utils.parseCurrency(Utils.$('#property-tax').value),
            homeInsurance: Utils.parseCurrency(Utils.$('#home-insurance').value),
            pmi: Utils.parseCurrency(Utils.$('#pmi').value),
            hoaFees: Utils.parseCurrency(Utils.$('#hoa-fees').value),
            extraPayment: Utils.parseCurrency(Utils.$('#extra-payment').value)
        };
        const results = MortgageCalculator.calculate(inputs);
        STATE.currentCalculation = { inputs, results };
        STATE.amortizationData = MortgageCalculator.generateAmortizationSchedule(inputs.loanAmount, inputs.interestRate, inputs.loanTerm, inputs.extraPayment);
        STATE.timelineData = MortgageCalculator.generateTimelineData(STATE.amortizationData, inputs.loanTerm);
        this.updateAllUI(inputs, results);
        Utils.showLoading(false);
    },
    updateAllUI(inputs, results) {
        this.updatePaymentSummary(results);
        this.updateLoanSummary(inputs, results);
        this.updateExtraPaymentImpact(results.extraPaymentImpact);
        if (!STATE.chartInitialized) ChartManager.initializeChart();
        ChartManager.updateChart(STATE.timelineData);
        this.updateSlider();
        this.updateTimelineDisplay(1);
        this.updateAmortizationView();
        AI.generateInsights(inputs, results);
    },
    updatePaymentSummary(r) {
        Utils.$('#total-payment').textContent = Utils.formatCurrency(r.totalMonthlyPayment, 2);
        Utils.$('#principal-interest').textContent = Utils.formatCurrency(r.principalInterest, 2);
        Utils.$('#monthly-property-tax').textContent = Utils.formatCurrency(r.monthlyPropertyTax, 2);
        Utils.$('#monthly-insurance').textContent = Utils.formatCurrency(r.monthlyInsurance, 2);
        Utils.$('#monthly-pmi').textContent = Utils.formatCurrency(r.monthlyPmi, 2);
        Utils.$('#monthly-hoa').textContent = Utils.formatCurrency(r.monthlyHoa, 2);
    },
    updateLoanSummary(i, r) {
        Utils.$('#summary-loan-amount').textContent = Utils.formatCurrency(i.loanAmount);
        Utils.$('#summary-total-interest').textContent = Utils.formatCurrency(r.totalInterest);
        Utils.$('#summary-total-cost').textContent = Utils.formatCurrency(r.totalCost);
        const payoffDate = r.extraPaymentImpact ? r.extraPaymentImpact.payoffDate : r.payoffDate;
        Utils.$('#summary-payoff-date').textContent = payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric'});
    },
    updateExtraPaymentImpact(impact) {
        const section = Utils.$('#extra-payment-impact');
        if (impact) {
            section.style.display = 'block';
            Utils.$('#interest-savings').textContent = Utils.formatCurrency(impact.interestSavings);
            Utils.$('#time-saved').textContent = `${impact.yearsSaved} yrs, ${impact.monthsRemaining} mos`;
            Utils.$('#payoff-date').textContent = impact.payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric'});
        } else {
            section.style.display = 'none';
        }
    },
    updateAmortizationView() {
        STATE.currentPage = 1;
        const totalPages = Math.ceil(STATE.amortizationData.length / CONFIG.amortizationPageSize);
        STATE.totalPages = totalPages > 0 ? totalPages : 1;
        this.renderAmortizationPage();
    },
    renderAmortizationPage() {
        const tbody = Utils.$('#amortization-tbody');
        const start = (STATE.currentPage - 1) * CONFIG.amortizationPageSize;
        const end = start + CONFIG.amortizationPageSize;
        const pageData = STATE.amortizationData.slice(start, end);
        tbody.innerHTML = pageData.map(row => `
            <tr>
                <td>${row.paymentNumber}</td>
                <td>${row.date.toLocaleDateString('en-US',{month:'short', year:'numeric'})}</td>
                <td>${Utils.formatCurrency(row.principal + row.interest, 2)}</td>
                <td>${Utils.formatCurrency(row.principal, 2)}</td>
                <td>${Utils.formatCurrency(row.interest, 2)}</td>
                <td>${Utils.formatCurrency(row.balance, 2)}</td>
            </tr>
        `).join('');
        Utils.$('#pagination-text').textContent = `Page ${STATE.currentPage} of ${STATE.totalPages}`;
        Utils.$('#prev-page').disabled = STATE.currentPage === 1;
        Utils.$('#next-page').disabled = STATE.currentPage === STATE.totalPages;
    },
    changeAmortizationPage(direction) {
        const newPage = STATE.currentPage + direction;
        if (newPage > 0 && newPage <= STATE.totalPages) {
            STATE.currentPage = newPage;
            this.renderAmortizationPage();
        }
    },
    updateSlider() {
        const slider = Utils.$('#year-slider');
        STATE.maxYears = STATE.timelineData.length;
        slider.max = STATE.maxYears > 0 ? STATE.maxYears : 1;
        slider.value = 1;
        Utils.$('#max-year-display').textContent = `Year ${slider.max}`;
    },
    updateTimelineDisplayFromSlider() {
        const year = parseInt(Utils.$('#year-slider').value);
        UI.updateTimelineDisplay(year);
    },
    updateTimelineDisplay(year) {
        const yearData = STATE.timelineData[year - 1];
        if (!yearData) return;
        Utils.$('#remaining-balance').textContent = Utils.formatCurrency(yearData.remainingBalance);
        Utils.$('#principal-paid').textContent = Utils.formatCurrency(yearData.principalPaid);
        Utils.$('#interest-paid').textContent = Utils.formatCurrency(yearData.interestPaid);
        Utils.$('#current-year-display').textContent = `Year ${year}`;

        // Highlight point on chart
        if (STATE.timelineChart) {
            STATE.timelineChart.tooltip.setActiveElements([{ datasetIndex: 0, index: year - 1 }], { x: 0, y: 0 });
            STATE.timelineChart.update();
        }
    },
    updateYearSlider(year) {
        const slider = Utils.$('#year-slider');
        if (slider) {
            slider.value = year;
            this.updateTimelineDisplay(year);
        }
    },
    isFormValid: () => ['home-price', 'interest-rate', 'loan-term'].every(id => Utils.parseCurrency(Utils.$(`#${id}`).value) > 0),
    updateLoanAmount() {
        const homePrice = Utils.parseCurrency(Utils.$('#home-price').value);
        const downPayment = Utils.parseCurrency(Utils.$('#down-payment').value);
        Utils.$('#loan-amount').value = Utils.formatNumberInput(String(Math.max(0, homePrice - downPayment)));
    },
    updateDownPaymentPercentage() {
        const homePrice = Utils.parseCurrency(Utils.$('#home-price').value);
        const downPayment = Utils.parseCurrency(Utils.$('#down-payment').value);
        const percent = homePrice > 0 ? (downPayment / homePrice) * 100 : 0;
        Utils.$('#down-payment-percent').textContent = `${percent.toFixed(1)}%`;
    },
    updatePropertyTax() {
        const stateCode = Utils.$('#property-state').value;
        const homePrice = Utils.parseCurrency(Utils.$('#home-price').value);
        if (stateCode && STATE_TAX_RATES[stateCode] && homePrice > 0) {
            const tax = homePrice * STATE_TAX_RATES[stateCode].rate;
            Utils.$('#property-tax').value = Utils.formatNumberInput(String(Math.round(tax)));
        }
    },
    updateActiveTermChip() {
        const term = Utils.$('#loan-term').value;
        Utils.$$('.term-chip').forEach(c => c.classList.toggle('active', c.dataset.term === term));
    },
    formatCurrencyInput: e => {
        const input = e.target;
        const value = Utils.parseCurrency(input.value);
        input.value = value > 0 ? Utils.formatNumberInput(String(value)) : '';
    },
    toggleTheme() {
        const body = document.body;
        const isDark = body.getAttribute('data-color-scheme') === 'dark';
        body.setAttribute('data-color-scheme', isDark ? 'light' : 'dark');
        Utils.$('.theme-icon').textContent = isDark ? '🌙' : '☀️';
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
        if (STATE.chartInitialized) ChartManager.initializeChart(); // Re-init chart for new colors
    },
    openShareModal() {
        Utils.$('#share-url').value = this.generateShareUrl();
        Utils.$('#share-modal').style.display = 'block';
    },
    closeShareModal() { Utils.$('#share-modal').style.display = 'none'; },
    generateShareUrl() {
        if (!STATE.currentCalculation) return window.location.href;
        const params = new URLSearchParams(STATE.currentCalculation.inputs);
        return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    },
    copyShareUrl() {
        const input = Utils.$('#share-url');
        navigator.clipboard.writeText(input.value).then(() => Utils.showToast('Link copied!', 'success'));
    },
    async generatePDF() {
        if (!STATE.currentCalculation) return Utils.showToast('Please calculate first.', 'error');
        Utils.showLoading(true);
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const { inputs, results } = STATE.currentCalculation;
            const margin = 15;
            let y = 20;

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(20);
            pdf.text('Mortgage Summary', margin, y);
            y += 15;

            pdf.setFontSize(12);
            pdf.text('Loan Details', margin, y); y += 7;
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Home Price: ${Utils.formatCurrency(inputs.homePrice)}`, margin, y); y += 6;
            pdf.text(`Loan Amount: ${Utils.formatCurrency(inputs.loanAmount)}`, margin, y); y += 6;
            pdf.text(`Interest Rate: ${inputs.interestRate}%`, margin, y); y += 6;
            pdf.text(`Loan Term: ${inputs.loanTerm} years`, margin, y); y += 10;
            
            pdf.setFont('helvetica', 'bold');
            pdf.text('Monthly Payment', margin, y); y += 7;
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Total: ${Utils.formatCurrency(results.totalMonthlyPayment, 2)}`, margin, y); y += 10;
            
            const canvas = Utils.$('#timeline-chart');
            const chartImage = await html2canvas(canvas.parentElement, { backgroundColor: null });
            const imgData = chartImage.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth() - 2 * margin;
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', margin, y, pdfWidth, pdfHeight);
            y += pdfHeight + 10;
            
            pdf.save('mortgage-summary.pdf');
        } catch (e) {
            console.error(e);
            Utils.showToast('Error generating PDF.', 'error');
        }
        Utils.showLoading(false);
    }
};

// ========== AI INSIGHTS ==========
const AI = {
    generateInsights(inputs, results) {
        const insights = [];
        if (results.downPaymentPercent < 20) insights.push({ type: 'warning', icon: '⚠️', title: 'PMI Required', content: `Your down payment is below 20%. Consider increasing it to avoid Private Mortgage Insurance (PMI).` });
        else insights.push({ type: 'success', icon: '✅', title: 'No PMI Needed', content: `Great! Your ${results.downPaymentPercent.toFixed(1)}% down payment helps you avoid PMI.` });
        if (results.extraPaymentImpact) insights.push({ type: 'success', icon: '🚀', title: 'Accelerated Payoff', content: `Your extra payments will save you ${Utils.formatCurrency(results.extraPaymentImpact.interestSavings)} and you'll be debt-free ${results.extraPaymentImpact.yearsSaved} years sooner!` });
        else insights.push({ type: 'tip', icon: '💡', title: 'Pay Off Faster', content: 'Even a small extra monthly payment can save you thousands in interest and shorten your loan term significantly.' });
        if (results.totalInterest > inputs.loanAmount) insights.push({ type: 'analysis', icon: '📊', title: 'Interest vs. Principal', content: `You will pay more in interest (${Utils.formatCurrency(results.totalInterest)}) than the original loan amount. This is common for long-term loans.` });
        
        this.display(insights);
    },
    display(insights) {
        const container = Utils.$('#insights-container');
        container.innerHTML = insights.map(i => `
            <div class="insight-card ${i.type}">
                <div class="insight-icon">${i.icon}</div>
                <div class="insight-content">
                    <h3 class="insight-title">${i.title}</h3>
                    <p class="insight-text">${i.content}</p>
                </div>
            </div>`).join('');
    }
};

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', UI.init);
