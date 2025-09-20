'use strict';

// ========== GLOBAL CONFIGURATION ==========
const CONFIG = {
    debounceDelay: 300,
    amortizationPageSize: 12,
    saveKey: 'mortgage_calculator_data',
    colors: {
        light: {
            grid: 'rgba(19, 52, 59, 0.1)',
            ticks: 'rgba(98, 108, 113, 1)',
            balance: 'rgba(230, 129, 97, 1)',
            principal: 'rgba(33, 128, 141, 1)',
            interest: 'rgba(192, 21, 47, 1)',
        },
        dark: {
            grid: 'rgba(119, 124, 124, 0.2)',
            ticks: 'rgba(167, 169, 169, 1)',
            balance: 'rgba(230, 129, 97, 1)',
            principal: 'rgba(50, 184, 198, 1)',
            interest: 'rgba(255, 84, 89, 1)',
        }
    },
};

// ========== GLOBAL STATE ==========
const STATE = {
    currentCalculation: null,
    amortizationData: [],
    currentPage: 1,
    totalPages: 1,
    timelineChart: null,
    isCalculating: false,
    theme: 'light',
    fontSize: 'normal',
    isVoiceEnabled: false,
    isScreenReaderEnabled: false,
    speechRecognition: null,
};

// ========== STATE TAX RATES (Approximations) ==========
const STATE_TAX_RATES = { 'AL': 0.0041, 'AK': 0.0119, 'AZ': 0.0062, 'AR': 0.0061, 'CA': 0.0075, 'CO': 0.0051, 'CT': 0.0214, 'DE': 0.0057, 'FL': 0.0083, 'GA': 0.0089, 'HI': 0.0028, 'ID': 0.0069, 'IL': 0.0227, 'IN': 0.0085, 'IA': 0.0157, 'KS': 0.0141, 'KY': 0.0086, 'LA': 0.0055, 'ME': 0.0128, 'MD': 0.0109, 'MA': 0.0117, 'MI': 0.0154, 'MN': 0.0112, 'MS': 0.0081, 'MO': 0.0097, 'MT': 0.0084, 'NE': 0.0173, 'NV': 0.0053, 'NH': 0.0209, 'NJ': 0.0249, 'NM': 0.0080, 'NY': 0.0169, 'NC': 0.0084, 'ND': 0.0142, 'OH': 0.0162, 'OK': 0.0090, 'OR': 0.0093, 'PA': 0.0158, 'RI': 0.0153, 'SC': 0.0057, 'SD': 0.0132, 'TN': 0.0064, 'TX': 0.0180, 'UT': 0.0066, 'VT': 0.0190, 'VA': 0.0082, 'WA': 0.0094, 'WV': 0.0059, 'WI': 0.0185, 'WY': 0.0062 };

// ========== UTILITY FUNCTIONS ==========
const Utils = {
    $: (selector) => document.querySelector(selector),
    $$: (selector) => document.querySelectorAll(selector),
    formatCurrency: (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0),
    formatPercent: (num) => new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num / 100),
    debounce: (func, delay) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => func.apply(this, args), delay); }; },
    showToast: (message, type = 'info', duration = 4000) => {
        const container = Utils.$('#toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), duration);
        if (STATE.isScreenReaderEnabled) ScreenReader.announce(message);
    },
    saveToLocalStorage: (key, data) => { try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.warn("Could not save to localStorage", e); } },
    loadFromLocalStorage: (key, defaultValue = null) => { try { const data = localStorage.getItem(key); return data ? JSON.parse(data) : defaultValue; } catch (e) { return defaultValue; } },
};

// ========== MORTGAGE CALCULATION ENGINE ==========
const MortgageCalculator = {
    calculatePMI: (loanAmount, downPaymentPercent) => {
        if (downPaymentPercent >= 20) return 0;
        // PMI is a complex calculation; this is a simplified estimate.
        const pmiRate = (20 - downPaymentPercent) * 0.0005 + 0.003; // Simple linear model
        return (loanAmount * pmiRate) / 12;
    },
    calculateMortgage: (params) => {
        const { homePrice, downPayment, interestRate, loanTerm, propertyTax, homeInsurance, extraMonthly = 0, extraOnetime = 0, biWeekly = false } = params;
        const principal = homePrice - downPayment;
        if (principal <= 0) return null;
        const downPaymentPercent = (downPayment / homePrice) * 100;
        const monthlyPmi = MortgageCalculator.calculatePMI(principal, downPaymentPercent);
        const schedule = MortgageCalculator.generateAmortizationSchedule({ principal, interestRate, loanTerm, extraMonthly, extraOnetime, biWeekly });
        if (!schedule.length) return null;
        
        const baseSchedule = MortgageCalculator.generateAmortizationSchedule({ principal, interestRate, loanTerm });
        const totalInterest = schedule.reduce((sum, p) => sum + p.interest, 0);
        const baseTotalInterest = baseSchedule.reduce((sum, p) => sum + p.interest, 0);

        const principalAndInterest = baseSchedule[0].payment - baseSchedule[0].interest + baseSchedule[0].principal > 0 ? (principal * (interestRate / 100 / 12)) / (1 - Math.pow(1 + (interestRate / 100 / 12), -loanTerm * 12)) : 0;

        return {
            loanAmount: principal,
            monthlyPayment: principalAndInterest + (propertyTax / 12) + (homeInsurance / 12) + monthlyPmi,
            principalAndInterest,
            monthlyTax: propertyTax / 12,
            monthlyInsurance: homeInsurance / 12,
            monthlyPmi,
            totalInterest,
            totalCost: principal + totalInterest + (propertyTax * (schedule.length / 12)) + (homeInsurance * (schedule.length / 12)),
            payoffDate: schedule[schedule.length - 1].date,
            amortization: schedule,
            interestSavings: baseTotalInterest - totalInterest,
            timeSavings: (baseSchedule.length - schedule.length) / 12,
            downPaymentPercent, homePrice,
        };
    },
    generateAmortizationSchedule: (params) => {
        const { principal, interestRate, loanTerm, extraMonthly = 0, extraOnetime = 0, biWeekly = false } = params;
        const schedule = [];
        let balance = principal;
        const monthlyRate = interestRate / 100 / 12;
        const numPayments = loanTerm * 12;
        const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
        if (isNaN(monthlyPayment)) return [];

        for (let i = 1; i <= numPayments && balance > 0; i++) {
            const interest = balance * monthlyRate;
            const oneTime = (i === 12) ? extraOnetime : 0;
            let principalPayment = monthlyPayment - interest + extraMonthly + oneTime;
            if (balance - principalPayment < 0) {
                principalPayment = balance;
                balance = 0;
            } else {
                balance -= principalPayment;
            }
            schedule.push({
                paymentNumber: i,
                date: new Date(new Date().setMonth(new Date().getMonth() + i)),
                payment: monthlyPayment + extraMonthly + oneTime,
                principal: principalPayment,
                interest: interest,
                balance,
            });
        }
        return schedule;
    }
};

// ========== UI & EVENT MANAGERS ==========
const UIManager = {
    init() {
        // Load preferences
        STATE.theme = Utils.loadFromLocalStorage('theme', 'light');
        STATE.fontSize = Utils.loadFromLocalStorage('fontSize', 'normal');
        this.applyTheme(STATE.theme);
        this.applyFontSize(STATE.fontSize);

        // Setup event listeners
        Utils.$$('#theme-toggle, #voice-toggle, #screen-reader-toggle').forEach(el => el.addEventListener('click', this.handleControlClick));
        Utils.$$('#font-smaller, #font-larger').forEach(el => el.addEventListener('click', this.handleFontClick));
        Utils.$$('#mortgage-form').addEventListener('input', Utils.debounce(this.calculate, CONFIG.debounceDelay));
        Utils.$$('#reset-form').addEventListener('click', this.resetForm);
        Utils.$$('#calculate-btn').addEventListener('click', this.calculate);
        Utils.$$('.term-chip').forEach(c => c.addEventListener('click', this.handleTermChipClick));
        Utils.$$('.toggle-btn').forEach(b => b.addEventListener('click', this.handleDownPaymentToggle));
        Utils.$$('.suggestion-chip').forEach(s => s.addEventListener('click', this.handleSuggestionChipClick));
        Utils.$$('#property-state').addEventListener('change', this.handleStateChange);
        Utils.$$('.tab-btn').forEach(t => t.addEventListener('click', this.handleTabClick));
        Utils.$('#year-range').addEventListener('input', this.handleYearSlider);
        Utils.$$('.pagination-controls button, #goto-page').forEach(el => el.addEventListener('click change', this.handlePagination));
        Utils.$$('#download-schedule').addEventListener('click', () => this.downloadCSV());
        Utils.$$('#pdf-btn').addEventListener('click', () => this.downloadPDF());
        Utils.$$('#print-btn').addEventListener('click', () => window.print());

        this.populateStateDropdown();
        this.loadFormData();
        this.calculate();
        if (window.tippy) tippy('[data-tippy-content]');
    },
    
    calculate() {
        if (STATE.isCalculating) return;
        STATE.isCalculating = true;
        Utils.$('#loading-overlay').style.display = 'flex';

        setTimeout(() => {
            const formData = UIManager.getFormData();
            UIManager.saveFormData(formData);
            const calculation = MortgageCalculator.calculateMortgage(formData);
            STATE.currentCalculation = calculation;
            
            if (calculation) {
                UIManager.displayResults(calculation);
            }

            Utils.$('#loading-overlay').style.display = 'none';
            STATE.isCalculating = false;
        }, 250);
    },

    displayResults(calc) {
        // Summary
        Utils.$('#total-payment').textContent = Utils.formatCurrency(calc.monthlyPayment);
        Utils.$('#principal-interest').textContent = Utils.formatCurrency(calc.principalAndInterest);
        Utils.$('#monthly-tax').textContent = Utils.formatCurrency(calc.monthlyTax);
        Utils.$('#monthly-insurance').textContent = Utils.formatCurrency(calc.monthlyInsurance);
        Utils.$('#monthly-pmi').textContent = Utils.formatCurrency(calc.monthlyPmi);
        Utils.$('#display-loan-amount').textContent = Utils.formatCurrency(calc.loanAmount);
        Utils.$('#display-total-interest').textContent = Utils.formatCurrency(calc.totalInterest);
        Utils.$('#display-total-cost').textContent = Utils.formatCurrency(calc.totalCost);
        Utils.$('#display-payoff-date').textContent = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short' }).format(calc.payoffDate);
        
        // Extra payments
        const impactEl = Utils.$('#extra-impact');
        if (calc.interestSavings > 0) {
            Utils.$('#interest-savings').textContent = Utils.formatCurrency(calc.interestSavings);
            Utils.$('#time-savings').textContent = `${calc.timeSavings.toFixed(1)} years`;
            Utils.$('#new-payoff').textContent = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short' }).format(calc.payoffDate);
            impactEl.style.display = 'block';
        } else {
            impactEl.style.display = 'none';
        }
        
        // Amortization
        STATE.amortizationData = calc.amortization;
        STATE.currentPage = 1;
        STATE.totalPages = Math.ceil(STATE.amortizationData.length / CONFIG.amortizationPageSize);
        this.renderAmortizationTable();
        this.updatePaginationUI();
        
        // Chart
        this.renderChart(calc);
        
        // AI Insights
        this.renderAIInsights(calc);
    },

    renderChart(calc) {
        const ctx = Utils.$('#mortgage-timeline-chart');
        if (STATE.timelineChart) STATE.timelineChart.destroy();
        
        const yearlyData = calc.amortization.reduce((acc, p) => {
            const year = p.date.getFullYear();
            if (!acc[year]) acc[year] = { year, balance: 0, principal: 0, interest: 0 };
            acc[year].balance = p.balance;
            acc[year].principal += p.principal;
            acc[year].interest += p.interest;
            return acc;
        }, {});
        
        let cumulativePrincipal = 0;
        let cumulativeInterest = 0;
        const chartData = Object.values(yearlyData).map(y => {
            cumulativePrincipal += y.principal;
            cumulativeInterest += y.interest;
            return { ...y, cumulativePrincipal, cumulativeInterest };
        });

        const getChartOptions = () => {
            const colors = CONFIG.colors[STATE.theme];
            return {
                responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' },
                plugins: { legend: { display: false }, tooltip: { /* callbacks */ } },
                scales: {
                    y: { beginAtZero: true, grid: { color: colors.grid }, ticks: { color: colors.ticks, callback: v => Utils.formatCurrency(v) } },
                    x: { grid: { display: false }, ticks: { color: colors.ticks } }
                }
            };
        };

        STATE.timelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(d => d.year),
                datasets: [
                    { label: 'Balance', data: chartData.map(d => d.balance), borderColor: CONFIG.colors[STATE.theme].balance, tension: 0.1, borderWidth: 2, pointRadius: 0 },
                    { label: 'Principal', data: chartData.map(d => d.cumulativePrincipal), borderColor: CONFIG.colors[STATE.theme].principal, tension: 0.1, borderWidth: 2, pointRadius: 0 },
                    { label: 'Interest', data: chartData.map(d => d.cumulativeInterest), borderColor: CONFIG.colors[STATE.theme].interest, tension: 0.1, borderWidth: 2, pointRadius: 0 },
                ]
            },
            options: getChartOptions(),
        });

        this.handleYearSlider({ target: Utils.$('#year-range') });
    },

    renderAIInsights(calc) {
        const container = Utils.$('#ai-insights-content');
        container.innerHTML = `<div class="insight-item loading"><div class="spinner small"></div> <span>Generating insights...</span></div>`;
        
        setTimeout(() => {
            const insights = [];
            if (calc.downPaymentPercent < 20) insights.push({ type: 'warning', text: `With a ${calc.downPaymentPercent.toFixed(1)}% down payment, you'll pay ${Utils.formatCurrency(calc.monthlyPmi)}/month in PMI. Increasing your down payment to 20% (${Utils.formatCurrency(calc.homePrice * 0.2)}) would save ${Utils.formatCurrency(calc.monthlyPmi * 12)} annually.` });
            else insights.push({ type: 'success', text: `Excellent! Your ${calc.downPaymentPercent.toFixed(1)}% down payment avoids PMI, saving you money each month.` });
            
            if (calc.interestSavings > 1000) insights.push({ type: 'success', text: `Your extra payments are saving you ${Utils.formatCurrency(calc.interestSavings)} in interest and cutting ${calc.timeSavings.toFixed(1)} years off your loan!` });
            else {
                // Rerun calculation with a hypothetical extra payment
                const formData = this.getFormData();
                const sampleCalc = MortgageCalculator.calculateMortgage({...formData, extraMonthly: 100});
                if(sampleCalc && sampleCalc.interestSavings > 0) {
                    insights.push({ type: 'info', text: `Consider adding an extra payment. Just $100/month could save you ~${Utils.formatCurrency(sampleCalc.interestSavings)} in interest.` });
                }
            }
            container.innerHTML = insights.map(i => `<div class="insight-item ${i.type}">${i.text}</div>`).join('');
        }, 500);
    },

    renderAmortizationTable() {
        const tbody = Utils.$('#amortization-table tbody');
        const startIndex = (STATE.currentPage - 1) * CONFIG.amortizationPageSize;
        const pageData = STATE.amortizationData.slice(startIndex, startIndex + CONFIG.amortizationPageSize);
        tbody.innerHTML = pageData.map(p => `
            <tr>
                <td>${p.paymentNumber}</td>
                <td>${new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(p.date)}</td>
                <td>${Utils.formatCurrency(p.payment)}</td>
                <td>${Utils.formatCurrency(p.principal)}</td>
                <td>${Utils.formatCurrency(p.interest)}</td>
                <td>${Utils.formatCurrency(p.balance)}</td>
            </tr>
        `).join('');
    },
    
    // ... Event Handlers and other UI methods
    handleControlClick(e) {
        const button = e.currentTarget;
        if (button.id === 'theme-toggle') {
            const newTheme = STATE.theme === 'light' ? 'dark' : 'light';
            UIManager.applyTheme(newTheme);
        }
        // ... other controls
    },
    
    handleFontClick(e) {
        const sizes = ['small', 'normal', 'large', 'extra-large'];
        let index = sizes.indexOf(STATE.fontSize);
        if (e.currentTarget.id === 'font-smaller') index = Math.max(0, index - 1);
        else index = Math.min(sizes.length - 1, index + 1);
        UIManager.applyFontSize(sizes[index]);
    },
    
    applyTheme(theme) {
        STATE.theme = theme;
        document.body.setAttribute('data-color-scheme', theme);
        Utils.$('#theme-icon').className = `fas fa-${theme === 'light' ? 'moon' : 'sun'}`;
        Utils.$('#theme-toggle .control-text').textContent = `${theme === 'light' ? 'Dark' : 'Light'} Mode`;
        Utils.saveToLocalStorage('theme', theme);
        if (STATE.currentCalculation) this.renderChart(STATE.currentCalculation);
    },

    applyFontSize(size) {
        STATE.fontSize = size;
        document.body.setAttribute('data-font-size', size);
        Utils.saveToLocalStorage('fontSize', size);
    },

    getFormData() {
        const homePrice = parseFloat(Utils.$('#home-price').value) || 0;
        let downPayment;
        if (Utils.$('#percent-toggle').classList.contains('active')) {
            const percent = parseFloat(Utils.$('#down-payment-percent').value) || 0;
            downPayment = homePrice * (percent / 100);
        } else {
            downPayment = parseFloat(Utils.$('#down-payment').value) || 0;
        }

        return {
            homePrice, downPayment,
            interestRate: parseFloat(Utils.$('#interest-rate').value) || 0,
            loanTerm: parseInt(Utils.$('#loan-term').value) || 30,
            propertyTax: parseFloat(Utils.$('#property-tax').value) || 0,
            homeInsurance: parseFloat(Utils.$('#home-insurance').value) || 0,
            extraMonthly: parseFloat(Utils.$('#extra-monthly').value) || 0,
            extraOnetime: parseFloat(Utils.$('#extra-onetime').value) || 0,
            biWeekly: Utils.$('#bi-weekly').checked,
        };
    },
    
    saveFormData(data) { Utils.saveToLocalStorage('formData', data); },
    loadFormData() {
        const data = Utils.loadFromLocalStorage('formData');
        if (data) {
            Object.keys(data).forEach(key => {
                const el = Utils.$(`[id="${key.replace(/([A-Z])/g, "-$1").toLowerCase()}"]`);
                if (el) {
                    if (el.type === 'checkbox') el.checked = data[key];
                    else el.value = data[key];
                }
            });
        }
    },

    populateStateDropdown() {
        const select = Utils.$('#property-state');
        // A short list for example
        const states = { 'CA': 'California', 'TX': 'Texas', 'FL': 'Florida', 'NY': 'New York' };
        Object.entries(states).forEach(([code, name]) => {
            const rate = STATE_TAX_RATES[code];
            if(rate) {
                const opt = document.createElement('option');
                opt.value = code;
                opt.textContent = name;
                select.appendChild(opt);
            }
        });
        select.value = 'CA'; // Default
    },
    
    handleStateChange(e) {
        const state = e.target.value;
        const rate = STATE_TAX_RATES[state];
        const homePrice = parseFloat(Utils.$('#home-price').value) || 0;
        if (rate && homePrice > 0) {
            Utils.$('#property-tax').value = Math.round(homePrice * rate);
            Utils.$('#tax-rate-display').textContent = this.formatPercent(rate * 100);
            this.calculate();
        }
    },
    
    handleTermChipClick(e) {
        Utils.$$('.term-chip').forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        Utils.$('#loan-term').value = e.currentTarget.dataset.term;
        this.calculate();
    },

    handleDownPaymentToggle(e) {
        const isAmount = e.currentTarget.id === 'amount-toggle';
        Utils.$('#amount-toggle').classList.toggle('active', isAmount);
        Utils.$('#percent-toggle').classList.toggle('active', !isAmount);
        Utils.$('#amount-input').style.display = isAmount ? 'flex' : 'none';
        Utils.$('#percent-input').style.display = !isAmount ? 'flex' : 'none';
    },
    
    handleSuggestionChipClick(e) {
        Utils.$('#home-price').value = e.currentTarget.dataset.value;
        this.calculate();
    },

    handleTabClick(e) {
        const tab = e.currentTarget.dataset.tab;
        Utils.$$('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        Utils.$$('.tab-content').forEach(c => c.classList.toggle('active', c.id === `${tab}-panel`));
    },

    handleYearSlider(e) {
        const year = parseInt(e.target.value);
        Utils.$('#current-year').textContent = year;
        const chart = STATE.timelineChart;
        if (!chart) return;
        const dataIndex = year - 1; // Assuming years start at 1
        
        const data = chart.data.datasets[0].data;
        if (dataIndex >= 0 && dataIndex < data.length) {
            Utils.$('#remaining-balance').textContent = Utils.formatCurrency(chart.data.datasets[0].data[dataIndex]);
            Utils.$('#principal-paid').textContent = Utils.formatCurrency(chart.data.datasets[1].data[dataIndex]);
            Utils.$('#interest-paid').textContent = Utils.formatCurrency(chart.data.datasets[2].data[dataIndex]);
        }
    },
    
    updatePaginationUI() {
        Utils.$('#pagination-text').textContent = `Page ${STATE.currentPage} of ${STATE.totalPages}`;
        Utils.$('#goto-page').value = STATE.currentPage;
        Utils.$('#goto-page').max = STATE.totalPages;
        Utils.$('#first-page').disabled = STATE.currentPage === 1;
        Utils.$('#prev-page').disabled = STATE.currentPage === 1;
        Utils.$('#next-page').disabled = STATE.currentPage === STATE.totalPages;
        Utils.$('#last-page').disabled = STATE.currentPage === STATE.totalPages;
    },

    handlePagination(e) {
        const id = e.target.id;
        if (id === 'first-page') STATE.currentPage = 1;
        if (id === 'prev-page') STATE.currentPage = Math.max(1, STATE.currentPage - 1);
        if (id === 'next-page') STATE.currentPage = Math.min(STATE.totalPages, STATE.currentPage + 1);
        if (id === 'last-page') STATE.currentPage = STATE.totalPages;
        if (id === 'goto-page') STATE.currentPage = parseInt(e.target.value);
        this.renderAmortizationTable();
        this.updatePaginationUI();
    },
    
    downloadCSV() {
        if (!STATE.amortizationData.length) return;
        const headers = "Payment #,Date,Payment,Principal,Interest,Balance\n";
        const csv = STATE.amortizationData.map(p => 
            [p.paymentNumber, p.date.toISOString().slice(0,10), p.payment, p.principal, p.interest, p.balance].join(',')
        ).join('\n');
        const blob = new Blob([headers + csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'amortization-schedule.csv';
        a.click();
        URL.revokeObjectURL(url);
    },
};

document.addEventListener('DOMContentLoaded', () => UIManager.init());
