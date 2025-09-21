/**
 * Mortgage-calculator.js
 * AI-Enhanced Mortgage Calculator
 * Features: Debounced inputs, interactive amortization chart, AI-powered insights.
 */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // ======= CONFIGURATION & STATE =======
    const CONFIG = {
        debounceDelay: 350,
    };

    const STATE = {
        chart: null,
        yearlyData: [],
    };

    // ======= DOM ELEMENT SELECTOR =======
    const $ = s => document.querySelector(s);

    // ======= UTILITIES =======
    const Utils = {
        formatCurrency: (n, d = 0) => new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: d,
            maximumFractionDigits: d
        }).format(n || 0),
        debounce: (fn, ms) => {
            let id;
            return (...args) => {
                clearTimeout(id);
                id = setTimeout(() => fn(...args), ms);
            };
        },
        showToast: (message, type = 'info') => {
            const container = $('#toast-container');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            container.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
    };

    // ======= CALCULATOR LOGIC =======
    const MortgageCalculator = {
        calculate(params) {
            const { homePrice, downPayment, rate, term, tax, ins, extraM, extraOne } = params;
            
            const principal = homePrice - downPayment;
            if (principal <= 0 || !rate || !term) return null;

            const dpPercent = homePrice > 0 ? (downPayment / homePrice) * 100 : 0;
            const pmi = dpPercent < 20 ? (principal * 0.005) / 12 : 0;
            
            // Baseline calculation (no extra payments)
            const baseSched = this.amortSchedule(principal, rate, term, 0, 0);
            if (!baseSched.length) return null;
            const baseInterest = baseSched.reduce((s, p) => s + p.interest, 0);
            const principalAndInterest = baseSched[0]?.payment || 0;
            
            // Calculation with extra payments
            const sched = this.amortSchedule(principal, rate, term, extraM, extraOne);
            const totalInterest = sched.reduce((s, p) => s + p.interest, 0);
            
            const payoffDate = sched.length ? sched[sched.length - 1].date : new Date();

            return {
                params,
                principal,
                pmi,
                dpPercent,
                monthlyPayment: principalAndInterest + (tax / 12) + (ins / 12) + pmi,
                principalAndInterest,
                monthlyTax: tax / 12,
                monthlyIns: ins / 12,
                totalInterest,
                totalCost: principal + totalInterest + (tax * term) + (ins * term) + (pmi * baseSched.length),
                payoffDate,
                amortization: sched,
                interestSavings: baseInterest - totalInterest,
                timeSavings: (baseSched.length - sched.length) / 12,
            };
        },

        amortSchedule(principal, annualRate, years, extraMonthly = 0, extraOnetime = 0) {
            const schedule = [];
            let balance = principal;
            const monthlyRate = annualRate / 100 / 12;
            const numPayments = years * 12;
            
            if (monthlyRate <= 0) return [];

            const baseMonthlyPayment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numPayments));

            for (let i = 1; i <= numPayments && balance > 0.01; i++) {
                const interest = balance * monthlyRate;
                const oneTimePayment = (i === 12) ? extraOnetime : 0; // Apply one-time payment in the 12th month
                let principalPaid = baseMonthlyPayment - interest + extraMonthly + oneTimePayment;
                
                if (principalPaid > balance) {
                    principalPaid = balance;
                }

                balance -= principalPaid;
                
                const date = new Date();
                date.setMonth(date.getMonth() + i);

                schedule.push({
                    paymentNumber: i,
                    date,
                    payment: baseMonthlyPayment + extraMonthly + oneTimePayment,
                    principal: principalPaid,
                    interest,
                    balance: balance < 0 ? 0 : balance,
                });
            }
            return schedule;
        }
    };

    // ======= CHART MANAGEMENT =======
    const ChartManager = {
        init() {
            const ctx = $('#mortgage-timeline-chart').getContext('2d');
            STATE.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        { label: 'Remaining Balance', data: [], borderColor: 'var(--chart-balance)', backgroundColor: 'rgba(249, 115, 22, 0.1)', fill: true, tension: 0.2 },
                        { label: 'Principal Paid', data: [], borderColor: 'var(--chart-principal)', tension: 0.2 },
                        { label: 'Interest Paid', data: [], borderColor: 'var(--chart-interest)', tension: 0.2 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { intersect: false, mode: 'index' },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                title: ctx => `End of Year ${ctx[0].label}`,
                                label: ctx => `${ctx.dataset.label}: ${Utils.formatCurrency(ctx.parsed.y)}`
                            }
                        },
                        annotation: { annotations: {} }
                    },
                    scales: {
                        y: { ticks: { callback: val => Utils.formatCurrency(val, 0) } },
                    }
                }
            });
        },
        
        render(calc) {
            if (!calc || !STATE.chart) return;
            
            STATE.yearlyData = this.aggregateYearly(calc.amortization);
            const years = STATE.yearlyData.map(d => d.year);
            
            STATE.chart.data.labels = years;
            STATE.chart.data.datasets[0].data = STATE.yearlyData.map(d => d.balance);
            STATE.chart.data.datasets[1].data = STATE.yearlyData.map(d => d.principal);
            STATE.chart.data.datasets[2].data = STATE.yearlyData.map(d => d.interest);
            STATE.chart.update();

            const yearRange = $('#year-range');
            yearRange.max = years.length || 1;
            yearRange.value = years.length || 1;
            this.updateSlider(years.length || 1);
        },

        aggregateYearly(amort) {
            const byYear = {};
            let cumulativePrincipal = 0;
            let cumulativeInterest = 0;

            amort.forEach(p => {
                const year = Math.ceil(p.paymentNumber / 12);
                if (!byYear[year]) {
                    byYear[year] = { year, balance: 0, principal: 0, interest: 0 };
                }
                byYear[year].balance = p.balance;
                cumulativePrincipal += p.principal;
                cumulativeInterest += p.interest;
                byYear[year].principal = cumulativePrincipal;
                byYear[year].interest = cumulativeInterest;
            });

            return Object.values(byYear);
        },
        
        updateSlider(year) {
            const yearInt = parseInt(year, 10);
            if (!STATE.yearlyData.length || isNaN(yearInt)) return;

            const data = STATE.yearlyData[yearInt - 1] || STATE.yearlyData[STATE.yearlyData.length - 1];
            
            $('#year-label').textContent = `Year ${yearInt}`;
            $('#remaining-balance-display').textContent = Utils.formatCurrency(data.balance);
            $('#principal-paid-display').textContent = Utils.formatCurrency(data.principal);
            $('#interest-paid-display').textContent = Utils.formatCurrency(data.interest);

            if (STATE.chart) {
                STATE.chart.options.plugins.annotation.annotations = {
                    line1: {
                        type: 'line',
                        xMin: yearInt - 1,
                        xMax: yearInt - 1,
                        borderColor: 'var(--color-primary)',
                        borderWidth: 2,
                    }
                };
                STATE.chart.update();
            }
        }
    };

    // ======= AI INSIGHTS =======
    const AIInsights = {
        render(calc) {
            if(!calc) return;
            const container = $('#ai-insights-content');
            const insights = [];

            // PMI Insight
            if (calc.dpPercent < 20) {
                insights.push({ type: 'warning', text: `<strong>PMI Alert:</strong> Your ${calc.dpPercent.toFixed(1)}% down payment requires PMI of ${Utils.formatCurrency(calc.pmi)}/mo. Increasing your down payment to 20% would eliminate this extra cost.` });
            } else {
                insights.push({ type: 'success', text: `<strong>No PMI:</strong> Excellent! With a ${calc.dpPercent.toFixed(1)}% down payment, you avoid PMI.` });
            }

            // Extra Payments Insight
            if (calc.interestSavings > 0) {
                insights.push({ type: 'success', text: `<strong>Smart Savings:</strong> Your extra payments will save you <strong>${Utils.formatCurrency(calc.interestSavings)}</strong> in interest and you'll pay off your loan <strong>${calc.timeSavings.toFixed(1)} years</strong> sooner.` });
            }
            
            // Bi-Weekly Option Insight
            const biWeeklyCalc = MortgageCalculator.calculate({ ...calc.params, biWeekly: true });
            if (biWeeklyCalc && biWeeklyCalc.interestSavings > calc.interestSavings + 100) {
                 const biWeeklySavings = biWeeklyCalc.interestSavings - calc.interestSavings;
                 const biWeeklyTime = biWeeklyCalc.timeSavings - calc.timeSavings;
                 insights.push({ type: 'info', text: `<strong>Bi-Weekly Payments:</strong> Consider a bi-weekly payment schedule. It could save an additional <strong>${Utils.formatCurrency(biWeeklySavings)}</strong> and cut your loan term by another <strong>${biWeeklyTime.toFixed(1)} years</strong>.` });
            }

            // Loan Term Insight
            if (calc.params.term === 30) {
                const shorterTermCalc = MortgageCalculator.calculate({ ...calc.params, term: 15 });
                if (shorterTermCalc) {
                    insights.push({ type: 'info', text: `<strong>15-Year Option:</strong> A 15-year term could have a higher payment of ${Utils.formatCurrency(shorterTermCalc.monthlyPayment)}, but you would save ${Utils.formatCurrency(calc.totalInterest - shorterTermCalc.totalInterest)} in total interest.` });
                }
            }

            container.innerHTML = insights.map(i => `<div class="insight-item ${i.type}"><i class="fas fa-info-circle"></i><p>${i.text}</p></div>`).join('');
        }
    };
    
    // ======= APP MANAGER =======
    const App = {
        init() {
            ChartManager.init();
            this.addEventListeners();
            this.updateLiveStats();
            this.calculate();
        },

        addEventListeners() {
            const form = $('#mortgage-form');
            form.addEventListener('input', Utils.debounce(() => this.calculate(), CONFIG.debounceDelay));
            
            document.querySelectorAll('.term-chip').forEach(chip => {
                chip.addEventListener('click', (e) => {
                    document.querySelectorAll('.term-chip').forEach(c => c.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    $('#loan-term').value = e.currentTarget.dataset.term;
                    this.calculate();
                });
            });

            ['amount-toggle', 'percent-toggle'].forEach(id => {
                $(`#${id}`).addEventListener('click', () => this.handleDownPaymentToggle(id === 'amount-toggle'));
            });

            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleTabSwitch(e.currentTarget));
            });

            $('#year-range').addEventListener('input', e => ChartManager.updateSlider(e.target.value));
            $('#view-current-rates').addEventListener('click', (e) =>
