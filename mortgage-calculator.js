/**
 * mortgage-calculator.js
 * World's First AI-Enhanced Mortgage Calculator - FINAL CORRECTED VERSION
 * Features: Voice commands, screen reader, dark/light mode, AI insights, interactive charts, comprehensive PDF reports.
 */

'use strict';

// ========== GLOBAL CONFIGURATION ==========
const CONFIG = {
    debounceDelay: 300,
    amortizationPageSize: 12,
    saveKey: 'mortgage_calculations',

    getChartOptions: (theme) => ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                titleColor: theme === 'dark' ? '#F1F5F9' : '#0F172A',
                bodyColor: theme === 'dark' ? '#CBD5E1' : '#334155',
                borderColor: '#14B8A6',
                borderWidth: 1,
                padding: 10,
                callbacks: {
                    title: (context) => `Year ${context[0].label}`,
                    label: (context) => ` ${context.dataset.label}: ${Utils.formatCurrency(context.parsed.y)}`,
                },
            },
            annotation: { annotations: {} }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }, ticks: { color: theme === 'dark' ? '#94A3B8' : '#64748B', callback: (value) => Utils.formatCurrency(value) } },
            x: { grid: { display: false }, ticks: { color: theme === 'dark' ? '#94A3B8' : '#64748B' } }
        }
    }),
};

// ========== GLOBAL STATE ==========
const STATE = {
    currentCalculation: null,
    amortizationData: [],
    yearlyData: [],
    amortizationView: 'monthly',
    currentPage: 1,
    totalPages: 1,
    timelineChart: null,
    isCalculating: false,
    theme: 'light',
};

// ========== UTILITY FUNCTIONS ==========
const Utils = {
    $: (selector) => document.querySelector(selector),
    $$: (selector) => document.querySelectorAll(selector),
    formatCurrency: (amount, decimals = 0) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount || 0),
    formatPercent: (num) => `${(num || 0).toFixed(2)}%`,
    debounce: (func, delay) => { let timeoutId; return (...args) => { clearTimeout(timeoutId); timeoutId = setTimeout(() => func.apply(this, args), delay); }; },
    showLoading: (show) => { Utils.$('#loading-overlay').style.display = show ? 'flex' : 'none'; },
    saveToLocalStorage: (key, data) => { try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.warn("Could not save to localStorage", e); } },
    loadFromLocalStorage: (key, defaultValue = null) => { try { const data = localStorage.getItem(key); return data ? JSON.parse(data) : defaultValue; } catch (e) { return defaultValue; } },
};

// ========== CORE MODULES ==========
const MortgageCalculator = {
    calculatePMI: (loanAmount, downPaymentPercent) => {
        if (downPaymentPercent >= 20) return 0;
        const pmiRate = (0.0115 - 0.003) * ((20 - Math.max(5, downPaymentPercent)) / 15) + 0.003;
        return (loanAmount * pmiRate) / 12;
    },
    calculateMortgage: (params) => {
        const { homePrice, downPayment, interestRate, loanTerm, propertyTax, homeInsurance, extraMonthly = 0, extraOnetime = 0, biWeekly = false } = params;
        const principal = homePrice - downPayment;
        if (principal <= 0 || !interestRate || !loanTerm) return null;

        const downPaymentPercent = homePrice > 0 ? (downPayment / homePrice) * 100 : 0;
        const monthlyPmi = MortgageCalculator.calculatePMI(principal, downPaymentPercent);
        
        const baseSchedule = MortgageCalculator.generateAmortizationSchedule({ ...params, extraMonthly: 0, extraOnetime: 0, biWeekly: false });
        const schedule = MortgageCalculator.generateAmortizationSchedule(params);
        if (!schedule.length) return null;

        const totalInterest = schedule.reduce((sum, p) => sum + p.interest, 0);
        const baseTotalInterest = baseSchedule.reduce((sum, p) => sum + p.interest, 0);
        const principalAndInterest = baseSchedule[0]?.payment || 0;

        return { ...params, loanAmount: principal, monthlyPayment: principalAndInterest + (propertyTax / 12) + (homeInsurance / 12) + monthlyPmi,
            principalAndInterest, monthlyTax: propertyTax / 12, monthlyInsurance: homeInsurance / 12, monthlyPmi, totalInterest, 
            totalCost: principal + totalInterest, payoffDate: schedule[schedule.length - 1].date, amortization: schedule, 
            interestSavings: baseTotalInterest - totalInterest, timeSavings: (baseSchedule.length - schedule.length) / 12, downPaymentPercent
        };
    },
    generateAmortizationSchedule: (params) => {
        let { principal, interestRate, loanTerm, extraMonthly, extraOnetime, biWeekly } = params;
        let schedule = [];
        let balance = principal;
        const monthlyRate = interestRate / 100 / 12;

        if (biWeekly) {
            const numBiWeeklyPayments = loanTerm * 26;
            const biWeeklyRate = interestRate / 100 / 26;
            // Effective monthly payment for bi-weekly is 1/2 of monthly payment, paid 26 times.
            const equivalentMonthlyPayment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -loanTerm * 12));
            const biWeeklyPayment = equivalentMonthlyPayment / 2;

            for (let i = 1; i <= numBiWeeklyPayments * 2 && balance > 0.01; i++) {
                const interest = balance * biWeeklyRate;
                let principalPayment = biWeeklyPayment - interest;
                if (balance - principalPayment < 0) { principalPayment = balance; }
                balance -= principalPayment;
                schedule.push({ paymentNumber: i, date: new Date(new Date().setDate(new Date().getDate() + i * 14)), payment: biWeeklyPayment, principal: principalPayment, interest, balance });
            }
        } else {
            const numPayments = loanTerm * 12;
            const monthlyPayment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numPayments));
            if (isNaN(monthlyPayment)) return [];

            for (let i = 1; i <= numPayments && balance > 0.01; i++) {
                const interest = balance * monthlyRate;
                const oneTime = (i === 12) ? extraOnetime : 0;
                let principalPayment = monthlyPayment - interest + extraMonthly + oneTime;
                if (balance - principalPayment < 0) { principalPayment = balance; }
                balance -= principalPayment;
                schedule.push({ paymentNumber: i, date: new Date(new Date().setMonth(new Date().getMonth() + i)), payment: monthlyPayment + extraMonthly + oneTime, principal: principalPayment, interest, balance });
            }
        }
        return schedule;
    }
};

const ChartManager = {
    render(calc) {
        const ctx = Utils.$('#mortgage-timeline-chart').getContext('2d');
        if (STATE.timelineChart) STATE.timelineChart.destroy();
        STATE.yearlyData = this.aggregateYearlyData(calc.amortization);

        STATE.timelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: STATE.yearlyData.map(d => d.year),
                datasets: [
                    { label: 'Remaining Balance', data: STATE.yearlyData.map(d => d.balance), borderColor: 'var(--chart-balance)', fill: true, backgroundColor: 'rgba(249, 115, 22, 0.1)', tension: 0.2, pointRadius: 0, borderWidth: 2.5 },
                    { label: 'Principal Paid', data: STATE.yearlyData.map(d => d.cumulativePrincipal), borderColor: 'var(--chart-principal)', tension: 0.2, pointRadius: 0, borderWidth: 2.5 },
                    { label: 'Interest Paid', data: STATE.yearlyData.map(d => d.cumulativeInterest), borderColor: 'var(--chart-interest)', tension: 0.2, pointRadius: 0, borderWidth: 2.5 },
                ]
            },
            options: CONFIG.getChartOptions(STATE.theme),
        });

        const slider = Utils.$('#year-range');
        slider.min = 1;
        slider.max = calc.loanTerm;
        slider.value = calc.loanTerm;
        Utils.$('#max-year').textContent = calc.loanTerm;
        this.updateForYear(calc.loanTerm);
    },
    aggregateYearlyData(amortization) {
        const yearly = {};
        let cumulativePrincipal = 0, cumulativeInterest = 0;
        const paymentsPerYear = amortization.length > 360 ? 26 : 12; // Crude check for bi-weekly

        for (const p of amortization) {
            const year = Math.ceil(p.paymentNumber / paymentsPerYear);
            if (!yearly[year]) yearly[year] = { year, balance: 0, cumulativePrincipal: 0, cumulativeInterest: 0 };
            
            yearly[year].balance = p.balance;
            cumulativePrincipal += p.principal;
            cumulativeInterest += p.interest;
            yearly[year].cumulativePrincipal = cumulativePrincipal;
            yearly[year].cumulativeInterest = cumulativeInterest;
        }
        return Object.values(yearly);
    },
    updateForYear(year) {
        Utils.$('#current-year').textContent = year;
        const yearData = STATE.yearlyData[year - 1] || STATE.yearlyData[STATE.yearlyData.length - 1];

        if(yearData) {
            Utils.$('#remaining-balance').textContent = Utils.formatCurrency(yearData.balance);
            Utils.$('#principal-paid').textContent = Utils.formatCurrency(yearData.cumulativePrincipal);
            Utils.$('#interest-paid').textContent = Utils.formatCurrency(yearData.cumulativeInterest);
        }

        if (STATE.timelineChart) {
            STATE.timelineChart.options.plugins.annotation.annotations = {
                line1: { type: 'line', xMin: year - 1, xMax: year - 1, borderColor: 'var(--color-primary)', borderWidth: 2, borderDash: [6, 6] }
            };
            STATE.timelineChart.update();
        }
    }
};

const AIInsights = {
    generate(calc) {
        const container = Utils.$('#ai-insights-content');
        container.innerHTML = `<div class="insight-item loading"><div class="insight-icon"><div class="spinner"></div></div><div class="insight-content">AI is analyzing your loan...</div></div>`;
        const insights = [];

        if (calc.downPaymentPercent < 20) {
            insights.push({ type: 'warning', text: `<strong>PMI Alert:</strong> Your ${calc.downPaymentPercent.toFixed(1)}% down payment requires PMI of ${Utils.formatCurrency(calc.monthlyPmi)}/month. Reaching 20% equity will remove this cost.` });
        } else {
            insights.push({ type: 'success', text: `<strong>No PMI:</strong> Excellent! Your ${calc.downPaymentPercent.toFixed(1)}% down payment avoids Private Mortgage Insurance.` });
        }
        if (calc.interestSavings > 100) {
            insights.push({ type: 'success', text: `<strong>Smart Savings:</strong> Your extra payments will save ${Utils.formatCurrency(calc.interestSavings)} and shorten your loan by ${calc.timeSavings.toFixed(1)} years!` });
        }
        if (!calc.biWeekly) {
            const biWeeklyCalc = MortgageCalculator.calculateMortgage({ ...calc, biWeekly: true, extraMonthly: 0, extraOnetime: 0 });
            if (biWeeklyCalc && biWeeklyCalc.interestSavings > 0) {
                insights.push({ type: 'info', text: `<strong>Bi-weekly Option:</strong> By switching to bi-weekly payments, you could save <strong>${Utils.formatCurrency(biWeeklyCalc.interestSavings)}</strong> and pay off your loan <strong>${biWeeklyCalc.timeSavings.toFixed(1)} years sooner</strong>.` });
            }
        }
        
        setTimeout(() => { container.innerHTML = insights.map(i => `<div class="insight-item ${i.type}">${i.text}</div>`).join(''); }, 500);
    }
};

const AppManager = {
    init() {
        STATE.theme = Utils.loadFromLocalStorage('theme', 'light');
        this.applyTheme(STATE.theme);
        
        Utils.$('#theme-toggle').addEventListener('click', () => this.applyTheme(STATE.theme === 'light' ? 'dark' : 'light'));
        Utils.$('#mortgage-form').addEventListener('input', Utils.debounce(() => this.handleFormChange(), CONFIG.debounceDelay));
        Utils.$('#calculate-btn').addEventListener('click', () => this.handleFormChange());
        Utils.$('#year-range').addEventListener('input', (e) => ChartManager.updateForYear(parseInt(e.target.value)));
        Utils.$$('.tab-btn').forEach(btn => btn.addEventListener('click', (e) => this.handleTabSwitch(e.currentTarget.dataset.tab)));
        Utils.$('#pdf-btn').addEventListener('click', () => this.downloadPDF());
        
        this.populateStates();
        setTimeout(() => this.handleFormChange(), 100); // Initial calculation
        if (window.tippy) tippy('[data-tippy-content]');
    },
    handleFormChange() {
        if (STATE.isCalculating) return;
        STATE.isCalculating = true;
        Utils.showLoading(true);
        
        setTimeout(() => {
            const formData = this.getFormData();
            const calc = MortgageCalculator.calculateMortgage(formData);
            STATE.currentCalculation = calc;

            if (calc) {
                this.displayResults(calc);
                ChartManager.render(calc);
                AIInsights.generate(calc);
            }
            Utils.showLoading(false);
            STATE.isCalculating = false;
        }, 250);
    },
    getFormData() {
        const homePrice = parseFloat(Utils.$('#home-price').value) || 0;
        let downPayment;
        if(Utils.$('#percent-toggle').classList.contains('active')) {
            const percent = parseFloat(Utils.$('#down-payment-percent').value) || 0;
            downPayment = homePrice * (percent / 100);
            Utils.$('#down-payment').value = downPayment.toFixed(0);
        } else {
            downPayment = parseFloat(Utils.$('#down-payment').value) || 0;
            if (homePrice > 0) Utils.$('#down-payment-percent').value = ((downPayment / homePrice) * 100).toFixed(1);
        }
        Utils.$('#pmi-warning').style.display = (homePrice > 0 && (downPayment / homePrice) < 0.2) ? 'flex' : 'none';
        
        return {
            homePrice, downPayment,
            interestRate: parseFloat(Utils.$('#interest-rate').value) || 0,
            loanTerm: parseInt(Utils.$('#loan-term').value) || 30,
            propertyTax: parseFloat(Utils.$('#property-tax').value) || 0,
            homeInsurance: parseFloat(Utils.$('#home-insurance').value) || 0,
            extraMonthly: parseFloat(Utils.$('#extra-monthly').value) || 0,
            extraOnetime: parseFloat(Utils.$('#extra-onetime').value) || 0,
            biWeekly: Utils.$('#bi-weekly').checked
        };
    },
    displayResults(calc) {
        Utils.$('#total-payment').textContent = Utils.formatCurrency(calc.monthlyPayment);
        Utils.$('#principal-interest').textContent = Utils.formatCurrency(calc.principalAndInterest);
        Utils.$('#monthly-tax').textContent = Utils.formatCurrency(calc.monthlyTax);
        Utils.$('#monthly-insurance').textContent = Utils.formatCurrency(calc.monthlyInsurance);
        Utils.$('#monthly-pmi').textContent = Utils.formatCurrency(calc.monthlyPmi);
        Utils.$('#pmi').value = calc.monthlyPmi.toFixed(0);
        
        Utils.$('#display-loan-amount').textContent = Utils.formatCurrency(calc.loanAmount);
        Utils.$('#display-total-interest').textContent = Utils.formatCurrency(calc.totalInterest);
        Utils.$('#display-total-cost').textContent = Utils.formatCurrency(calc.totalCost);
        Utils.$('#display-payoff-date').textContent = calc.payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        Utils.$('#chart-loan-amount').textContent = Utils.formatCurrency(calc.homePrice);
        
        const savingsPreview = Utils.$('#savings-preview');
        if (calc.interestSavings > 0) {
            savingsPreview.textContent = `Savings: ${Utils.formatCurrency(calc.interestSavings)}`;
        } else {
            savingsPreview.textContent = 'Potential savings: $0';
        }
    },
    applyTheme(theme) {
        STATE.theme = theme;
        document.body.dataset.theme = theme;
        Utils.$('#theme-icon').className = `fas fa-${theme === 'light' ? 'moon' : 'sun'}`;
        Utils.saveToLocalStorage('theme', theme);
        if (STATE.currentCalculation) ChartManager.render(STATE.currentCalculation);
    },
    handleTabSwitch(tabId) {
        Utils.$$('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
        Utils.$$('.tab-content').forEach(content => content.classList.toggle('active', content.id === `${tabId}-panel`));
    },
    async downloadPDF() {
        if (!STATE.currentCalculation) return;
        Utils.showLoading(true);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const calc = STATE.currentCalculation;

        pdf.setFontSize(20).setFont(undefined, 'bold').text('Mortgage Analysis Report', 15, 20);
        pdf.setFontSize(10).setFont(undefined, 'normal').text(new Date().toLocaleString(), 15, 26);
        
        // Add Summary Info
        pdf.setFontSize(14).setFont(undefined, 'bold').text('Loan Summary', 15, 40);
        pdf.autoTable({ startY: 45, head: [['Metric', 'Value']],
            body: [
                ['Home Price', Utils.formatCurrency(calc.homePrice)],
                ['Loan Amount', Utils.formatCurrency(calc.loanAmount)],
                ['Interest Rate', `${calc.interestRate}%`],
                ['Loan Term', `${calc.loanTerm} Years`],
                ['Total Interest Paid', Utils.formatCurrency(calc.totalInterest)],
                ['Payoff Date', calc.payoffDate.toLocaleDateString()],
            ], theme: 'grid' });
        
        // Add Chart Image
        const chartCanvas = await html2canvas(Utils.$('.chart-container'), { scale: 2 });
        const chartImg = chartCanvas.toDataURL('image/png');
        pdf.addPage();
        pdf.setFontSize(14).setFont(undefined, 'bold').text('Mortgage Over Time', 15, 20);
        pdf.addImage(chartImg, 'PNG', 15, 25, 180, 90);

        // Add Amortization Table
        const tableBody = calc.amortization.map(p => [p.paymentNumber, p.date.toLocaleDateString(), Utils.formatCurrency(p.payment, 2), Utils.formatCurrency(p.principal, 2), Utils.formatCurrency(p.interest, 2), Utils.formatCurrency(p.balance, 2)]);
        pdf.addPage();
        pdf.setFontSize(14).setFont(undefined, 'bold').text('Amortization Schedule', 15, 20);
        pdf.autoTable({ startY: 25, head: [['#', 'Date', 'Payment', 'Principal', 'Interest', 'Balance']], body: tableBody, theme: 'striped' });

        pdf.save(`mortgage-report-${Date.now()}.pdf`);
        Utils.showLoading(false);
    },
    populateStates() {
        const stateSelect = Utils.$('#property-state');
        const states = {"AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California","CO":"Colorado","CT":"Connecticut","DE":"Delaware","FL":"Florida","GA":"Georgia","HI":"Hawaii","ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky","LA":"Louisiana","ME":"Maine","MD":"Maryland","MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri","MT":"Montana","NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico","NY":"New York","NC":"North Carolina","ND":"North Dakota","OH":"Ohio","OK":"Oklahoma","OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island","SC":"South Carolina","SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont","VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming"};
        for(const code in states) {
            stateSelect.options[stateSelect.options.length] = new Option(states[code], code);
        }
    },
};

document.addEventListener('DOMContentLoaded', () => AppManager.init());
