/* ============================================================================
   AI-ENHANCED MORTGAGE CALCULATOR - V4.1 STABLE JAVASCRIPT
   Modern UX, Robust Logic, and Full Feature Implementation
   ============================================================================ */

(function() {
    'use strict';

    // ========== Global State & Utilities ==========
    const state = {
        extraPaymentFrequency: 'monthly',
        amortizationData: [],
        currentPage: 1,
        itemsPerPage: 12,
        chartInstance: null,
    };

    const Utils = {
        parseCurrency: (val) => parseFloat(String(val).replace(/[$,]/g, '')) || 0,
        formatCurrency: (num, hideCents = false) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: hideCents ? 0 : 2, maximumFractionDigits: hideCents ? 0 : 2 }).format(num),
        formatNumber: (num) => new Intl.NumberFormat('en-US').format(num),
        debounce: (func, wait) => {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },
    };

    // ========== Mortgage Calculation Engine ==========
    class MortgageEngine {
        static getMonthlyPayment(p, r, n) {
            if (p <= 0) return 0;
            if (r === 0) return p / n;
            return p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        }

        static getAmortization(formData) {
            const principal = formData.homePrice - formData.downPayment;
            if (principal <= 0) return [];

            const monthlyRate = formData.interestRate / 100 / 12;
            const termInMonths = formData.loanTerm * 12;
            const monthlyPI = this.getMonthlyPayment(principal, monthlyRate, termInMonths);
            
            const extraMonthly = state.extraPaymentFrequency === 'weekly' 
                ? formData.extraMonthly * (52 / 12) 
                : formData.extraMonthly;

            let balance = principal;
            const schedule = [];
            
            for (let i = 1; i <= termInMonths && balance > 0; i++) {
                const interest = balance * monthlyRate;
                let principalPaid = monthlyPI - interest + extraMonthly;
                if (balance - principalPaid < 0) {
                    principalPaid = balance;
                }
                balance -= principalPaid;

                schedule.push({ month: i, principal: principalPaid, interest, balance });
            }
            return schedule;
        }
    }

    // ========== UI Component Managers ==========
    class UIManager {
        constructor() {
            this.elements = this.getElements();
            this.chartCtx = this.elements.chartCanvas?.getContext('2d');
            this.init();
        }

        getElements() {
            const ids = ['home-price', 'down-payment', 'down-payment-percent', 'amount-toggle', 'percent-toggle', 'amount-input', 'percent-input', 'pmi-warning', 'interest-rate', 'loan-term', 'property-tax', 'home-insurance', 'pmi', 'extra-monthly', 'monthly-toggle', 'weekly-toggle', 'extra-payment-label', 'savings-preview', 'total-payment', 'display-loan-amount', 'display-total-interest', 'display-payoff-date', 'principal-interest', 'monthly-tax', 'monthly-insurance', 'monthly-pmi', 'mortgage-timeline-chart', 'ai-insights', 'amortization-table-body', 'prev-page', 'next-page', 'current-page', 'total-pages', 'reset-form', 'theme-toggle', 'theme-icon', 'loading-overlay'];
            const elements = {};
            ids.forEach(id => elements[id.replace(/-(\w)/g, (m, p1) => p1.toUpperCase())] = document.getElementById(id));
            elements.termChips = document.querySelectorAll('.term-chip');
            elements.tabButtons = document.querySelectorAll('.tab-btn');
            elements.tabContents = document.querySelectorAll('.tab-content');
            elements.chartCanvas = elements.mortgageTimelineChart;
            return elements;
        }

        init() {
            this.setupEventListeners();
            this.updateTheme(localStorage.getItem('theme') === 'dark');
            this.performInitialCalculation();
        }

        setupEventListeners() {
            const debouncedCalc = Utils.debounce(() => this.calculate(), 300);

            // Input formatting and live calculation
            ['homePrice', 'downPayment', 'propertyTax', 'homeInsurance', 'extraMonthly'].forEach(key => {
                this.elements[key]?.addEventListener('input', (e) => this.formatCurrencyInput(e.target));
                this.elements[key]?.addEventListener('blur', (e) => this.formatCurrencyInput(e.target, true));
                this.elements[key]?.addEventListener('input', debouncedCalc);
            });

            ['downPaymentPercent', 'interestRate'].forEach(key => {
                this.elements[key]?.addEventListener('input', (e) => this.formatDecimalInput(e.target));
                this.elements[key]?.addEventListener('input', debouncedCalc);
            });
            
            // Toggles and Chips
            this.elements.amountToggle?.addEventListener('click', () => this.toggleDownPaymentMode('amount'));
            this.elements.percentToggle?.addEventListener('click', () => this.toggleDownPaymentMode('percent'));
            this.elements.monthlyToggle?.addEventListener('click', () => this.setExtraPaymentFrequency('monthly'));
            this.elements.weeklyToggle?.addEventListener('click', () => this.setExtraPaymentFrequency('weekly'));

            this.elements.termChips.forEach(chip => chip.addEventListener('click', () => {
                this.selectLoanTerm(chip.dataset.term);
                debouncedCalc();
            }));
            
            this.elements.tabButtons.forEach(btn => btn.addEventListener('click', () => this.switchTab(btn.dataset.tab)));
            
            // Buttons
            this.elements.resetForm?.addEventListener('click', () => this.reset());
            this.elements.themeToggle?.addEventListener('click', () => this.updateTheme(document.body.dataset.theme !== 'dark'));
            this.elements.prevPage?.addEventListener('click', () => this.renderAmortizationPage(state.currentPage - 1));
            this.elements.nextPage?.addEventListener('click', () => this.renderAmortizationPage(state.currentPage + 1));

            // Sync down payment fields
            this.elements.homePrice?.addEventListener('input', () => this.syncDownPayment());
            this.elements.downPayment?.addEventListener('input', () => this.syncDownPayment('amount'));
            this.elements.downPaymentPercent?.addEventListener('input', () => this.syncDownPayment('percent'));
        }

        formatCurrencyInput(input, onBlur = false) {
            let value = Utils.parseCurrency(input.value);
            if (onBlur) {
                input.value = value > 0 ? Utils.formatNumber(value) : '';
            }
        }
        
        formatDecimalInput(input) {
            let value = input.value.replace(/[^0-9.]/g, '');
            const parts = value.split('.');
            if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
            input.value = value;
        }

        toggleDownPaymentMode(mode) {
            const isAmount = mode === 'amount';
            this.elements.amountInput.style.display = isAmount ? 'block' : 'none';
            this.elements.percentInput.style.display = isAmount ? 'none' : 'block';
            this.elements.amountToggle.classList.toggle('active', isAmount);
            this.elements.percentToggle.classList.toggle('active', !isAmount);
        }
        
        syncDownPayment(source) {
            const homePrice = Utils.parseCurrency(this.elements.homePrice.value);
            if (homePrice === 0 && source) return;

            if (source === 'amount') {
                const amount = Utils.parseCurrency(this.elements.downPayment.value);
                const percent = (amount / homePrice) * 100;
                this.elements.downPaymentPercent.value = isFinite(percent) ? percent.toFixed(2) : '';
            } else { // Source is percent or home price change
                const percent = Utils.parseCurrency(this.elements.downPaymentPercent.value);
                const amount = homePrice * (percent / 100);
                this.elements.downPayment.value = Utils.formatNumber(amount);
            }
            this.updatePMIWarning();
        }
        
        updatePMIWarning() {
            const homePrice = Utils.parseCurrency(this.elements.homePrice.value);
            const downPayment = Utils.parseCurrency(this.elements.downPayment.value);
            const isUnder20 = homePrice > 0 && downPayment / homePrice < 0.2;
            this.elements.pmiWarning.style.display = isUnder20 ? 'flex' : 'none';
        }

        selectLoanTerm(term) {
            this.elements.loanTerm.value = term;
            this.elements.termChips.forEach(chip => {
                chip.classList.toggle('active', chip.dataset.term === term);
            });
        }
        
        setExtraPaymentFrequency(freq) {
            state.extraPaymentFrequency = freq;
            this.elements.monthlyToggle.classList.toggle('active', freq === 'monthly');
            this.elements.weeklyToggle.classList.toggle('active', freq === 'weekly');
            this.elements.extraPaymentLabel.textContent = `Extra ${freq.charAt(0).toUpperCase() + freq.slice(1)} Payment`;
            this.calculate(); // Recalculate on frequency change
        }

        getFormData() {
            const homePrice = Utils.parseCurrency(this.elements.homePrice.value);
            const downPayment = Utils.parseCurrency(this.elements.downPayment.value);
            const loanAmount = homePrice - downPayment;
            
            const pmi = (loanAmount / homePrice) < 0.8 || homePrice === 0 || loanAmount <= 0 ? 0 : (loanAmount * 0.005) / 12; // Simplified PMI
            this.elements.pmi.value = Utils.formatNumber(pmi);

            return {
                homePrice,
                downPayment,
                interestRate: Utils.parseCurrency(this.elements.interestRate.value),
                loanTerm: parseInt(this.elements.loanTerm.value, 10),
                propertyTax: Utils.parseCurrency(this.elements.propertyTax.value),
                homeInsurance: Utils.parseCurrency(this.elements.homeInsurance.value),
                pmi,
                extraMonthly: Utils.parseCurrency(this.elements.extraMonthly.value),
            };
        }

        calculate() {
            this.elements.loadingOverlay.style.display = 'grid';
            try {
                const formData = this.getFormData();
                const principal = formData.homePrice - formData.downPayment;

                if (principal <= 0) {
                    this.renderEmptyResults();
                    return;
                }

                state.amortizationData = MortgageEngine.getAmortization(formData);

                const monthlyRate = formData.interestRate / 100 / 12;
                const termInMonths = formData.loanTerm * 12;
                const monthlyPI = MortgageEngine.getMonthlyPayment(principal, monthlyRate, termInMonths);
                
                const totalMonthly = monthlyPI + (formData.propertyTax / 12) + (formData.homeInsurance / 12) + formData.pmi;

                this.renderResults(formData, totalMonthly, monthlyPI);
                this.renderChart();
                this.renderAmortizationPage(1);
                this.renderAIInsights(formData);
                this.updateSavingsPreview(formData);

            } catch (error) {
                console.error("Calculation Error:", error);
            } finally {
                setTimeout(() => this.elements.loadingOverlay.style.display = 'none', 200);
            }
        }
        
        renderResults(formData, totalMonthly, monthlyPI) {
            const loanAmount = formData.homePrice - formData.downPayment;
            const totalInterest = state.amortizationData.reduce((acc, row) => acc + row.interest, 0);
            const payoffDate = new Date();
            if (state.amortizationData.length > 0) {
                payoffDate.setMonth(payoffDate.getMonth() + state.amortizationData.length);
            }

            this.elements.totalPayment.textContent = Utils.formatCurrency(totalMonthly);
            this.elements.displayLoanAmount.textContent = Utils.formatCurrency(loanAmount, true);
            this.elements.displayTotalInterest.textContent = Utils.formatCurrency(totalInterest, true);
            this.elements.displayPayoffDate.textContent = state.amortizationData.length > 0 ? payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '--';

            this.elements.principalInterest.textContent = Utils.formatCurrency(monthlyPI);
            this.elements.monthlyTax.textContent = Utils.formatCurrency(formData.propertyTax / 12);
            this.elements.monthlyInsurance.textContent = Utils.formatCurrency(formData.homeInsurance / 12);
            this.elements.monthlyPmi.textContent = Utils.formatCurrency(formData.pmi);
        }

        renderEmptyResults() {
             state.amortizationData = [];
             this.renderResults({propertyTax:0, homeInsurance:0, pmi:0}, 0, 0);
             this.renderChart();
             this.renderAmortizationPage(1);
             this.renderAIInsights(this.getFormData());
             this.updateSavingsPreview(this.getFormData());
        }
        
        renderChart() {
            if (!this.chartCtx) return;
            if (state.chartInstance) state.chartInstance.destroy();

            if (state.amortizationData.length === 0) return;

            const loanAmount = Utils.parseCurrency(this.elements.homePrice.value) - Utils.parseCurrency(this.elements.downPayment.value);
            const yearlyData = state.amortizationData.filter((_, i) => (i + 1) % 12 === 0 || i === state.amortizationData.length - 1);
            
            state.chartInstance = new Chart(this.chartCtx, {
                type: 'line',
                data: {
                    labels: yearlyData.map(d => Math.ceil(d.month / 12)),
                    datasets: [
                        { label: 'Remaining Balance', data: yearlyData.map(d => d.balance), borderColor: 'var(--c-primary)', backgroundColor: 'rgba(26, 109, 255, 0.1)', tension: 0.2, fill: true },
                        { label: 'Principal Paid', data: yearlyData.map(d => loanAmount - d.balance), borderColor: 'var(--c-success)', backgroundColor: 'rgba(3, 152, 85, 0.1)', tension: 0.2, fill: false }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: 'Year' } } } }
            });
        }
        
        renderAmortizationPage(page) {
            const totalPages = Math.ceil(state.amortizationData.length / state.itemsPerPage);
            state.currentPage = Math.max(1, Math.min(page, totalPages || 1));
            
            const start = (state.currentPage - 1) * state.itemsPerPage;
            const end = start + state.itemsPerPage;
            const pageData = state.amortizationData.slice(start, end);

            if(pageData.length === 0){
                this.elements.amortizationTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 2rem;">No payment schedule to display.</td></tr>`;
            } else {
                this.elements.amortizationTableBody.innerHTML = pageData.map(row => `
                    <tr>
                        <td>${row.month}</td>
                        <td>${Utils.formatCurrency(row.principal)}</td>
                        <td>${Utils.formatCurrency(row.interest)}</td>
                        <td>${Utils.formatCurrency(row.balance)}</td>
                    </tr>
                `).join('');
            }
            

            this.elements.currentPage.textContent = state.currentPage;
            this.elements.totalPages.textContent = totalPages || 1;
            this.elements.prevPage.disabled = state.currentPage === 1;
            this.elements.nextPage.disabled = state.currentPage === (totalPages || 1);
        }

        renderAIInsights(formData) {
            const insights = [];
            const downPaymentPercent = formData.homePrice > 0 ? (formData.downPayment / formData.homePrice) * 100 : 0;

            if(formData.homePrice <= 0) {
                 insights.push({ type: 'info', title: 'Ready to Start?', message: `Enter your home price and down payment to get personalized AI insights.`, icon: 'fa-lightbulb' });
            } else if (downPaymentPercent >= 20) {
                insights.push({ type: 'success', title: 'Great Down Payment!', message: `Your ${downPaymentPercent.toFixed(1)}% down payment helps you avoid Private Mortgage Insurance (PMI).`, icon: 'fa-check-circle' });
            } else {
                insights.push({ type: 'warning', title: 'Consider a Higher Down Payment', message: `Increasing your down payment to 20% would eliminate monthly PMI costs, lowering your monthly payment.`, icon: 'fa-exclamation-triangle' });
            }
            
            if (formData.extraMonthly > 0) {
                 insights.push({ type: 'success', title: 'Accelerated Payments', message: `Making extra payments is a smart way to build equity faster and save thousands in interest.`, icon: 'fa-rocket' });
            } else if (formData.homePrice > 0) {
                 insights.push({ type: 'info', title: 'Pay Off Your Loan Faster', message: 'Consider adding even a small extra amount to your monthly payment to save thousands over the life of the loan.', icon: 'fa-lightbulb' });
            }

            this.elements.aiInsights.innerHTML = insights.map(i => `
                <div class="insight-item ${i.type}">
                    <i class="fas ${i.icon} insight-icon"></i>
                    <div><h5>${i.title}</h5><p>${i.message}</p></div>
                </div>
            `).join('');
        }

        updateSavingsPreview(formData) {
             if (formData.extraMonthly <= 0) {
                this.elements.savingsPreview.textContent = 'Add extra payments to see potential savings.';
                return;
            }
            const standardAmortization = MortgageEngine.getAmortization({ ...formData, extraMonthly: 0 });
            if(standardAmortization.length === 0) return;

            const totalInterestStandard = standardAmortization.reduce((acc, row) => acc + row.interest, 0);
            const totalInterestExtra = state.amortizationData.reduce((acc, row) => acc + row.interest, 0);

            const savings = totalInterestStandard - totalInterestExtra;
            const timeSaved = (standardAmortization.length - state.amortizationData.length) / 12;

            if (savings > 0) {
                this.elements.savingsPreview.innerHTML = `You could save <strong>${Utils.formatCurrency(savings)}</strong> and pay off your loan <strong>${timeSaved.toFixed(1)} years</strong> early!`;
            } else {
                this.elements.savingsPreview.textContent = 'Add extra payments to see potential savings.';
            }
        }

        switchTab(tabId) {
            this.elements.tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
            this.elements.tabContents.forEach(content => content.classList.toggle('active', content.id === tabId));
            if (tabId === 'chart') {
                setTimeout(() => this.renderChart(), 50); // Re-render chart on tab switch to ensure correct sizing
            }
        }

        updateTheme(isDark) {
            document.body.dataset.theme = isDark ? 'dark' : 'light';
            this.elements.themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            this.renderChart(); // Re-render chart for new theme colors
        }
        
        reset() {
            this.elements.homePrice.value = '400,000';
            this.elements.downPaymentPercent.value = '20';
            this.elements.interestRate.value = '6.43';
            this.elements.propertyTax.value = '';
            this.elements.homeInsurance.value = '';
            this.elements.extraMonthly.value = '0';
            this.selectLoanTerm('30');
            this.toggleDownPaymentMode('amount');
            this.syncDownPayment('percent');
            this.calculate();
        }

        performInitialCalculation() {
             setTimeout(() => this.calculate(), 100);
        }
    }

    // ========== Initialize Application ==========
    document.addEventListener('DOMContentLoaded', () => new UIManager());
})();
