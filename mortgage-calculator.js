/* ============================================================================
   WORLD'S #1 AI-ENHANCED MORTGAGE CALCULATOR - PRODUCTION JAVASCRIPT
   Advanced Features: AI Insights, Voice Control, Real-Time Updates
   Version: 3.1 Production Ready
   ============================================================================ */

(function() {
    'use strict';

    // ========== Global State Management ==========
    class MortgageCalculatorState {
        constructor() {
            this.calculations = {};
            this.savedCalculations = [];
            this.comparisonData = [];
            this.voiceEnabled = false;
            this.chartInstance = null;
            this.amortizationData = [];
            this.currentPage = 1;
            this.itemsPerPage = 12;
            this.recognition = null;
            this.darkMode = this.detectPreferredTheme();
            this.fontScale = 1.0;
            this.screenReaderMode = false;
            this.extraPaymentFrequency = 'monthly';

            // Market data
            this.marketRates = {
                '30yr': 6.43,
                '15yr': 5.73,
                'arm': 5.90,
                'fha': 6.44
            };

            // Location-based data
            this.stateData = {
                'Alabama': { tax: 0.0041, insurance: 1200 }, 'Alaska': { tax: 0.0103, insurance: 1100 }, 'Arizona': { tax: 0.0066, insurance: 1300 },
                'Arkansas': { tax: 0.0062, insurance: 1400 }, 'California': { tax: 0.0075, insurance: 2100 }, 'Colorado': { tax: 0.0051, insurance: 1800 },
                'Connecticut': { tax: 0.0208, insurance: 1600 }, 'Delaware': { tax: 0.0057, insurance: 1500 }, 'Florida': { tax: 0.0083, insurance: 2400 },
                'Georgia': { tax: 0.0092, insurance: 1700 }, 'Hawaii': { tax: 0.0028, insurance: 1400 }, 'Idaho': { tax: 0.0069, insurance: 1200 },
                'Illinois': { tax: 0.0223, insurance: 1500 }, 'Indiana': { tax: 0.0085, insurance: 1300 }, 'Iowa': { tax: 0.0154, insurance: 1400 },
                'Kansas': { tax: 0.0144, insurance: 1500 }, 'Kentucky': { tax: 0.0086, insurance: 1600 }, 'Louisiana': { tax: 0.0055, insurance: 2200 },
                'Maine': { tax: 0.0125, insurance: 1300 }, 'Maryland': { tax: 0.0108, insurance: 1600 }, 'Massachusetts': { tax: 0.0116, insurance: 1700 },
                'Michigan': { tax: 0.0154, insurance: 1400 }, 'Minnesota': { tax: 0.0111, insurance: 1500 }, 'Mississippi': { tax: 0.0061, insurance: 1800 },
                'Missouri': { tax: 0.0098, insurance: 1500 }, 'Montana': { tax: 0.0084, insurance: 1300 }, 'Nebraska': { tax: 0.0176, insurance: 1600 },
                'Nevada': { tax: 0.0060, insurance: 1300 }, 'New Hampshire': { tax: 0.0186, insurance: 1200 }, 'New Jersey': { tax: 0.0249, insurance: 1800 },
                'New Mexico': { tax: 0.0080, insurance: 1400 }, 'New York': { tax: 0.0162, insurance: 1900 }, 'North Carolina': { tax: 0.0084, insurance: 1500 },
                'North Dakota': { tax: 0.0098, insurance: 1400 }, 'Ohio': { tax: 0.0157, insurance: 1300 }, 'Oklahoma': { tax: 0.0090, insurance: 1700 },
                'Oregon': { tax: 0.0087, insurance: 1200 }, 'Pennsylvania': { tax: 0.0153, insurance: 1400 }, 'Rhode Island': { tax: 0.0147, insurance: 1600 },
                'South Carolina': { tax: 0.0057, insurance: 1600 }, 'South Dakota': { tax: 0.0128, insurance: 1500 }, 'Tennessee': { tax: 0.0064, insurance: 1500 },
                'Texas': { tax: 0.0181, insurance: 2000 }, 'Utah': { tax: 0.0061, insurance: 1300 }, 'Vermont': { tax: 0.0186, insurance: 1200 },
                'Virginia': { tax: 0.0082, insurance: 1500 }, 'Washington': { tax: 0.0087, insurance: 1400 }, 'West Virginia': { tax: 0.0059, insurance: 1400 },
                'Wisconsin': { tax: 0.0176, insurance: 1300 }, 'Wyoming': { tax: 0.0062, insurance: 1200 }
            };
        }

        detectPreferredTheme() {
            if (typeof window !== 'undefined') {
                return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
            return false;
        }

        updateCalculations(data) {
            this.calculations = { ...this.calculations, ...data };
        }
    }

    const state = new MortgageCalculatorState();

    // ========== Utility Functions ==========
    const Utils = {
        formatCurrency(amount, includeCents = false) {
            if (typeof amount !== 'number' || isNaN(amount)) return '$0';
            const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: includeCents ? 2 : 0, maximumFractionDigits: includeCents ? 2 : 0 });
            return formatter.format(amount);
        },
        formatNumber(num, decimals = 0) {
            if (typeof num !== 'number' || isNaN(num)) return '0';
            return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num);
        },
        parseCurrency(value) {
            if (typeof value === 'number') return value;
            const cleaned = String(value).replace(/[$,]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        },
        parsePercentage(value) {
            const cleaned = String(value).replace(/[%]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        },
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => { clearTimeout(timeout); func(...args); };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        showToast(message, type = 'info', duration = 4000) {
            const toastContainer = document.getElementById('toast-container');
            if(!toastContainer) return;
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
            toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
            toastContainer.appendChild(toast);
            setTimeout(() => toast.remove(), duration);
            toast.addEventListener('click', () => toast.remove());
        },
        formatDate(date) {
            return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short' }).format(date);
        },
        announceToScreenReader(message) {
            const announcement = document.getElementById('sr-announcements');
            if (announcement) announcement.textContent = message;
        }
    };

    // ========== Mortgage Calculator Engine ==========
    class MortgageEngine {
        static calculateMonthlyPayment(principal, rate, termYears) {
            if (principal <= 0 || rate < 0 || termYears <= 0) return 0;
            if (rate === 0) return principal / (termYears * 12);

            const monthlyRate = rate / 100 / 12;
            const numPayments = termYears * 12;
            const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
            return isNaN(monthlyPayment) ? 0 : monthlyPayment;
        }

        static calculatePMI(loanAmount, homePrice) {
            const ltvRatio = loanAmount / homePrice;
            if (ltvRatio <= 0.8 || loanAmount <= 0) return 0;
            let pmiRate = 0.005; // 0.5% annually
            if (ltvRatio > 0.95) pmiRate = 0.01;
            else if (ltvRatio > 0.9) pmiRate = 0.008;
            else if (ltvRatio > 0.85) pmiRate = 0.006;
            return (loanAmount * pmiRate) / 12;
        }

        static generateAmortizationSchedule(principal, rate, termYears, extraMonthly = 0, extraOnetime = 0) {
            if (principal <= 0) return [];
            const schedule = [];
            const monthlyRate = rate / 100 / 12;
            const originalPayment = this.calculateMonthlyPayment(principal, rate, termYears);
            let balance = principal;
            let month = 1;

            while (balance > 0.01 && month <= termYears * 12 * 2) {
                const interestPayment = balance * monthlyRate;
                let principalPayment = originalPayment - interestPayment;
                
                if (month === 12 && extraOnetime > 0) {
                    principalPayment += extraOnetime;
                }
                principalPayment += extraMonthly;

                if (principalPayment + interestPayment < 0) break;
                if (principalPayment > balance) principalPayment = balance;

                balance -= principalPayment;
                if (balance < 0) balance = 0;

                schedule.push({ month, payment: originalPayment + extraMonthly, principal: principalPayment, interest: interestPayment, balance });
                month++;
            }
            return schedule;
        }
    }

    // ========== AI Insights Generator ==========
    class AIInsights {
        static generateInsights(calculations, formData) {
            const insights = [];
            const { ltvRatio, monthlyPMI, loanAmount, interestRate, loanTerm, totalMonthly } = calculations;

            // Down payment insight
            if (ltvRatio <= 0.8) {
                insights.push({ type: 'success', title: 'Excellent Down Payment!', message: `Your ${Utils.formatNumber((1 - ltvRatio) * 100, 1)}% down payment eliminates PMI, saving you money each month.` });
            } else {
                insights.push({ type: 'info', title: 'PMI Required', message: `With a ${Utils.formatNumber((1-ltvRatio) * 100, 1)}% down payment, your estimated monthly PMI is ${Utils.formatCurrency(monthlyPMI)}. Reaching 20% equity will remove this cost.` });
            }

            // Extra payment suggestion
            const extraPaymentAmount = state.extraPaymentFrequency === 'weekly' ? formData.extraPayment * (52 / 12) : formData.extraPayment;
            if(extraPaymentAmount > 0) {
                const savings = this.calculateExtraPaymentSavings(loanAmount, interestRate, loanTerm, extraPaymentAmount);
                 if (savings.savings > 0) {
                     insights.push({ type: 'success', title: 'Accelerated Payoff!', message: `By adding ${Utils.formatCurrency(formData.extraPayment)} ${state.extraPaymentFrequency}, you could save over ${Utils.formatCurrency(savings.savings)} in interest and pay off your loan ${savings.timeSaved} years early!` });
                 }
            } else {
                 const suggestedExtra = 200;
                 const savings = this.calculateExtraPaymentSavings(loanAmount, interestRate, loanTerm, suggestedExtra);
                 if (savings.savings > 10000) {
                     insights.push({ type: 'info', title: 'Extra Payment Opportunity', message: `Adding just ${Utils.formatCurrency(suggestedExtra)}/month extra could save you over ${Utils.formatCurrency(savings.savings)} in interest and pay off your loan ${savings.timeSaved} years early.` });
                 }
            }
            
            // Interest rate insight
            if (state.marketRates['30yr']) {
                const marketAverage = state.marketRates['30yr'];
                if (interestRate > marketAverage + 0.25) {
                    insights.push({ type: 'warning', title: 'Rate Shopping Opportunity', message: `Your rate is ${(interestRate - marketAverage).toFixed(2)}% above the market average. Shopping with multiple lenders could save you thousands.` });
                } else if (interestRate < marketAverage - 0.1) {
                    insights.push({ type: 'success', title: 'Great Interest Rate!', message: `Your rate is ${(marketAverage - interestRate).toFixed(2)}% below the market average. You've secured an excellent deal!` });
                }
            }

            return insights;
        }

        static calculateExtraPaymentSavings(principal, rate, termYears, extraMonthly) {
            const standardSchedule = MortgageEngine.generateAmortizationSchedule(principal, rate, termYears);
            const extraSchedule = MortgageEngine.generateAmortizationSchedule(principal, rate, termYears, extraMonthly);
            if (!standardSchedule.length || !extraSchedule.length) return { savings: 0, timeSaved: 0 };

            const standardTotalInterest = standardSchedule.reduce((sum, row) => sum + row.interest, 0);
            const extraTotalInterest = extraSchedule.reduce((sum, row) => sum + row.interest, 0);

            const savings = standardTotalInterest - extraTotalInterest;
            const timeSaved = (standardSchedule.length - extraSchedule.length) / 12;

            return { savings, timeSaved: Utils.formatNumber(timeSaved, 1) };
        }
    }
    
    // ========== Form Management ==========
    class FormManager {
        constructor() {
            this.form = document.querySelector('.mortgage-form');
            this.inputs = {};
            this.initializeInputs();
            this.setupEventListeners();
            this.populateStatesDropdown();
        }

        initializeInputs() {
            const ids = ['home-price', 'down-payment', 'down-payment-percent', 'interest-rate', 'loan-term', 'custom-term', 'property-state', 'property-tax', 'home-insurance', 'pmi', 'extra-payment-amount', 'extra-onetime'];
            ids.forEach(id => this.inputs[id] = document.getElementById(id));
        }
        
        populateStatesDropdown() {
            const stateSelect = this.inputs['property-state'];
            if (!stateSelect) return;
            stateSelect.innerHTML = '<option value="">Select your state...</option>';
            Object.keys(state.stateData).forEach(stateName => {
                const option = document.createElement('option');
                option.value = stateName;
                option.textContent = stateName;
                stateSelect.appendChild(option);
            });
        }
        
        setupEventListeners() {
            // Live formatting
            ['home-price', 'down-payment', 'property-tax', 'home-insurance', 'extra-payment-amount', 'extra-onetime'].forEach(id => {
                this.inputs[id]?.addEventListener('input', e => this.formatCurrencyInput(e.target));
            });
            this.inputs['interest-rate']?.addEventListener('input', e => this.formatDecimalInput(e.target));
            this.inputs['down-payment-percent']?.addEventListener('input', e => this.formatDecimalInput(e.target));
            
            // Down payment toggle
            document.getElementById('amount-toggle').addEventListener('click', () => this.toggleDownPaymentMode('amount'));
            document.getElementById('percent-toggle').addEventListener('click', () => this.toggleDownPaymentMode('percent'));

            // Loan Term
            document.querySelectorAll('.term-chip').forEach(chip => chip.addEventListener('click', () => this.selectLoanTerm(chip.dataset.term)));
            this.inputs['custom-term'].addEventListener('input', e => this.selectLoanTerm(e.target.value));

            // Location-based costs
            this.inputs['property-state'].addEventListener('change', this.updateLocationBasedData.bind(this));
            this.inputs['home-price'].addEventListener('input', this.updateLocationBasedData.bind(this));
            
            // Auto-calculation triggers
            const debouncedCalc = Utils.debounce(() => document.dispatchEvent(new CustomEvent('calculate')), 300);
            Object.values(this.inputs).forEach(input => input?.addEventListener('input', debouncedCalc));
            document.querySelectorAll('.term-chip, .toggle-btn').forEach(el => el.addEventListener('click', debouncedCalc));
            
            // Suggestion chips
            document.querySelector('.input-suggestions')?.addEventListener('click', e => {
                if(e.target.classList.contains('suggestion-chip')) {
                    const input = this.inputs[e.target.dataset.input];
                    if (input) {
                        input.value = Utils.formatNumber(parseFloat(e.target.dataset.value));
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            });
            
            // Extra payments
            document.getElementById('monthly-toggle').addEventListener('click', () => this.setExtraPaymentFrequency('monthly'));
            document.getElementById('weekly-toggle').addEventListener('click', () => this.setExtraPaymentFrequency('weekly'));
            this.inputs['extra-payment-amount']?.addEventListener('input', this.updateExtraPaymentPreview.bind(this));
            
             // Down payment sync
            this.inputs['home-price']?.addEventListener('input', this.handleDownPaymentChange.bind(this));
            this.inputs['down-payment']?.addEventListener('input', this.handleDownPaymentChange.bind(this));
            this.inputs['down-payment-percent']?.addEventListener('input', this.handleDownPaymentChange.bind(this));
        }

        formatCurrencyInput(input) {
            const value = Utils.parseCurrency(input.value);
            input.value = value > 0 ? new Intl.NumberFormat('en-US').format(value) : '';
        }
        
        formatDecimalInput(input) {
            let value = input.value;
            // Allow only one dot and numbers
            value = value.replace(/[^0-9.]/g, '');
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            input.value = value;
        }

        toggleDownPaymentMode(mode) {
            const amountInputDiv = document.getElementById('amount-input');
            const percentInputDiv = document.getElementById('percent-input');
            const amountToggle = document.getElementById('amount-toggle');
            const percentToggle = document.getElementById('percent-toggle');

            amountInputDiv.style.display = (mode === 'amount') ? 'block' : 'none';
            percentInputDiv.style.display = (mode === 'percent') ? 'block' : 'none';
            amountToggle.classList.toggle('active', mode === 'amount');
            percentToggle.classList.toggle('active', mode === 'percent');
            
            this.handleDownPaymentChange();
        }

        handleDownPaymentChange() {
            const homePrice = Utils.parseCurrency(this.inputs['home-price'].value);
            const dpAmount = Utils.parseCurrency(this.inputs['down-payment'].value);
            const dpPercent = Utils.parsePercentage(this.inputs['down-payment-percent'].value);
            const isPercentMode = document.getElementById('percent-input').style.display === 'block';

            if (homePrice > 0) {
                if (isPercentMode) {
                    const newAmount = homePrice * (dpPercent / 100);
                    this.inputs['down-payment'].value = Utils.formatNumber(newAmount, 0);
                } else {
                    const newPercent = (dpAmount / homePrice) * 100;
                    this.inputs['down-payment-percent'].value = isNaN(newPercent) ? '' : Utils.formatNumber(newPercent, 2);
                }
            }
            this.updatePMI();
        }
        
        updatePMI() {
            const homePrice = Utils.parseCurrency(this.inputs['home-price'].value);
            const downPayment = Utils.parseCurrency(this.inputs['down-payment'].value);
            const loanAmount = homePrice - downPayment;
            
            const pmiWarning = document.getElementById('pmi-warning');
            const monthlyPMI = MortgageEngine.calculatePMI(loanAmount, homePrice);

            this.inputs['pmi'].value = Utils.formatNumber(monthlyPMI, 0);

            if(pmiWarning) {
                pmiWarning.style.display = (monthlyPMI > 0) ? 'flex' : 'none';
            }
        }

        selectLoanTerm(term) {
            const termVal = parseInt(term);
            this.inputs['loan-term'].value = isNaN(termVal) ? 30 : termVal;

            document.querySelectorAll('.term-chip').forEach(chip => {
                chip.classList.toggle('active', chip.dataset.term === String(termVal));
            });
            if (![15, 20, 30].includes(termVal)) {
                this.inputs['custom-term'].value = term;
            } else {
                this.inputs['custom-term'].value = '';
            }
        }
        
        updateLocationBasedData() {
            const selectedState = this.inputs['property-state'].value;
            const homePrice = Utils.parseCurrency(this.inputs['home-price'].value);

            if (selectedState && state.stateData[selectedState] && homePrice > 0) {
                const data = state.stateData[selectedState];
                this.inputs['property-tax'].value = Utils.formatNumber(homePrice * data.tax, 0);
                this.inputs['home-insurance'].value = Utils.formatNumber(data.insurance + (homePrice / 1000) * 0.5, 0); // Base + value factor
            }
        }

        setExtraPaymentFrequency(frequency) {
            state.extraPaymentFrequency = frequency;
            document.getElementById('monthly-toggle').classList.toggle('active', frequency === 'monthly');
            document.getElementById('weekly-toggle').classList.toggle('active', frequency === 'weekly');
            const label = document.querySelector('label[for="extra-payment-amount"]');
            if (label) {
                label.textContent = `Extra ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Payment`;
            }
            this.updateExtraPaymentPreview();
        }

        updateExtraPaymentPreview() {
            const savingsPreview = document.getElementById('savings-preview');
            const formData = this.getFormData();
            const { loanAmount, interestRate, loanTerm } = state.calculations;
            if (!loanAmount || formData.extraPayment <= 0) {
                savingsPreview.innerHTML = 'Add extra payments to see potential savings';
                return;
            }
            const monthlyEquivalent = state.extraPaymentFrequency === 'weekly' 
                ? formData.extraPayment * (52 / 12) 
                : formData.extraPayment;
            const savings = AIInsights.calculateExtraPaymentSavings(loanAmount, interestRate, loanTerm, monthlyEquivalent);
            if (savings.savings > 0) {
                savingsPreview.innerHTML = `You could save <strong>${Utils.formatCurrency(savings.savings)}</strong> in interest and pay off your loan <strong>${savings.timeSaved} years</strong> early!`;
            } else {
                savingsPreview.innerHTML = 'Add extra payments to see potential savings';
            }
        }

        getFormData() {
            const homePrice = Utils.parseCurrency(this.inputs['home-price'].value);
            const downPayment = Utils.parseCurrency(this.inputs['down-payment'].value);
            return {
                homePrice,
                downPayment,
                interestRate: Utils.parsePercentage(this.inputs['interest-rate'].value),
                loanTerm: parseInt(this.inputs['loan-term'].value, 10) || 30,
                propertyTax: Utils.parseCurrency(this.inputs['property-tax'].value),
                homeInsurance: Utils.parseCurrency(this.inputs['home-insurance'].value),
                pmi: Utils.parseCurrency(this.inputs['pmi'].value),
                extraPayment: Utils.parseCurrency(this.inputs['extra-payment-amount'].value),
                extraOnetime: Utils.parseCurrency(this.inputs['extra-onetime'].value)
            };
        }
        
        reset() {
            this.form.reset();
            this.inputs['home-price'].value = '400,000';
            this.inputs['down-payment'].value = '80,000';
            this.inputs['down-payment-percent'].value = '20';
            this.inputs['interest-rate'].value = '6.43';
            this.selectLoanTerm('30');
            this.toggleDownPaymentMode('amount');
            this.setExtraPaymentFrequency('monthly');
            document.dispatchEvent(new CustomEvent('calculate'));
            Utils.showToast('Form has been reset', 'info');
        }
    }

    // ========== Results Display Manager ==========
    class ResultsManager {
        constructor() {
            this.elements = {};
            const ids = ['total-payment', 'principal-interest', 'monthly-tax', 'monthly-insurance', 'monthly-pmi', 'display-loan-amount', 'display-total-interest', 'display-total-cost', 'display-payoff-date', 'chart-loan-amount', 'ai-insights', 'pi-fill', 'tax-fill', 'insurance-fill', 'pmi-fill', 'amortization-table-body', 'current-page', 'total-pages', 'prev-page', 'next-page'];
            ids.forEach(id => this.elements[id] = document.getElementById(id));
            this.chartManager = new ChartManager();

            this.elements['prev-page']?.addEventListener('click', () => this.changeAmortizationPage(-1));
            this.elements['next-page']?.addEventListener('click', () => this.changeAmortizationPage(1));
        }

        updateAll(calculations, amortizationData, formData) {
            this.updateSummary(calculations);
            this.updateBreakdown(calculations);
            this.chartManager.updateChart(amortizationData, calculations.loanAmount);
            this.updateAmortizationTable(amortizationData);
            this.updateAIInsights(calculations, formData);
            Utils.announceToScreenReader(`Monthly payment calculated: ${Utils.formatCurrency(calculations.totalMonthly)}`);
        }
        
        updateSummary(calc) {
            this.elements['total-payment'].textContent = Utils.formatCurrency(calc.totalMonthly);
            this.elements['display-loan-amount'].textContent = Utils.formatCurrency(calc.loanAmount);
            this.elements['display-total-interest'].textContent = Utils.formatCurrency(calc.totalInterest);
            this.elements['display-total-cost'].textContent = Utils.formatCurrency(calc.totalCost);
            this.elements['display-payoff-date'].textContent = calc.payoffDate ? Utils.formatDate(calc.payoffDate) : 'N/A';
            this.elements['chart-loan-amount'].textContent = `Based on a ${Utils.formatCurrency(calc.loanAmount)} mortgage`;
        }

        updateBreakdown(calc) {
            this.elements['principal-interest'].textContent = Utils.formatCurrency(calc.monthlyPI);
            this.elements['monthly-tax'].textContent = Utils.formatCurrency(calc.monthlyTax);
            this.elements['monthly-insurance'].textContent = Utils.formatCurrency(calc.monthlyInsurance);
            this.elements['monthly-pmi'].textContent = Utils.formatCurrency(calc.monthlyPMI);

            const total = calc.totalMonthly > 0 ? calc.totalMonthly : 1;
            this.elements['pi-fill'].style.width = `${(calc.monthlyPI / total) * 100}%`;
            this.elements['tax-fill'].style.width = `${(calc.monthlyTax / total) * 100}%`;
            this.elements['insurance-fill'].style.width = `${(calc.monthlyInsurance / total) * 100}%`;
            this.elements['pmi-fill'].style.width = `${(calc.monthlyPMI / total) * 100}%`;
        }

        updateAIInsights(calculations, formData) {
            const insights = AIInsights.generateInsights(calculations, formData);
            this.elements['ai-insights'].innerHTML = insights.map(insight => `
                <div class="insight-item ${insight.type}">
                    <div class="insight-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="insight-content">
                        <h5>${insight.title}</h5>
                        <p>${insight.message}</p>
                    </div>
                </div>
            `).join('');
        }

        updateAmortizationTable(data) {
            state.amortizationData = data;
            state.currentPage = 1;
            this.renderAmortizationPage();
        }

        renderAmortizationPage() {
            const { amortizationData, currentPage, itemsPerPage } = state;
            const totalPages = Math.ceil(amortizationData.length / itemsPerPage);
            
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const pageData = amortizationData.slice(start, end);

            if (pageData.length === 0) {
                 this.elements['amortization-table-body'].innerHTML = '<tr><td colspan="6" class="empty-state">No payment schedule to display.</td></tr>';
            } else {
                this.elements['amortization-table-body'].innerHTML = pageData.map(row => {
                    const paymentDate = new Date();
                    paymentDate.setMonth(paymentDate.getMonth() + row.month - 1);
                    return `
                        <tr>
                            <td>${row.month}</td>
                            <td>${Utils.formatDate(paymentDate)}</td>
                            <td>${Utils.formatCurrency(row.payment, true)}</td>
                            <td>${Utils.formatCurrency(row.principal, true)}</td>
                            <td>${Utils.formatCurrency(row.interest, true)}</td>
                            <td>${Utils.formatCurrency(row.balance, true)}</td>
                        </tr>`;
                }).join('');
            }

            this.elements['current-page'].textContent = currentPage;
            this.elements['total-pages'].textContent = totalPages > 0 ? totalPages : 1;
            this.elements['prev-page'].disabled = currentPage === 1;
            this.elements['next-page'].disabled = currentPage === totalPages || totalPages === 0;
        }

        changeAmortizationPage(direction) {
            const totalPages = Math.ceil(state.amortizationData.length / state.itemsPerPage);
            const newPage = state.currentPage + direction;
            if (newPage >= 1 && newPage <= totalPages) {
                state.currentPage = newPage;
                this.renderAmortizationPage();
            }
        }
    }

    // ========== Chart Management ==========
    class ChartManager {
        constructor() {
            this.canvas = document.getElementById('mortgage-timeline-chart');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.yearSlider = document.getElementById('year-range');
            this.yearLabel = document.getElementById('year-label');
            this.remainingBalanceEl = document.getElementById('remaining-balance');
            this.principalPaidEl = document.getElementById('principal-paid');
            this.interestPaidEl = document.getElementById('interest-paid');
        }

        updateChart(amortizationData, loanAmount) {
            if (!this.ctx || !amortizationData.length) return;

            if (state.chartInstance) state.chartInstance.destroy();
            
            const labels = amortizationData.map(d => d.month);
            const balanceData = amortizationData.map(d => d.balance);
            const principalPaidData = amortizationData.map(d => loanAmount - d.balance);
            const interestPaidData = amortizationData.reduce((acc, d) => {
                acc.push((acc.length > 0 ? acc[acc.length - 1] : 0) + d.interest);
                return acc;
            }, []);

            state.chartInstance = new Chart(this.ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        { label: 'Remaining Balance', data: balanceData, borderColor: 'var(--chart-balance)', tension: 0.1, fill: true, backgroundColor: 'rgba(168, 75, 47, 0.1)' },
                        { label: 'Principal Paid', data: principalPaidData, borderColor: 'var(--chart-principal)', tension: 0.1, fill: false }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        x: { display: false },
                        y: { ticks: { callback: value => Utils.formatCurrency(value) } }
                    },
                    plugins: { tooltip: { callbacks: { label: context => `${context.dataset.label}: ${Utils.formatCurrency(context.raw)}` } } }
                }
            });

            this.setupSlider(amortizationData.length / 12, amortizationData, principalPaidData, interestPaidData);
        }

        setupSlider(maxYears, data, principalPaidData, interestPaidData) {
            this.yearSlider.max = Math.ceil(maxYears);
            this.yearSlider.value = 1;
            
            const updateSliderDetails = () => {
                const year = parseInt(this.yearSlider.value, 10);
                const monthIndex = Math.min(year * 12 - 1, data.length - 1);
                if(monthIndex < 0) return;

                this.yearLabel.textContent = `End of Year ${year}`;
                this.remainingBalanceEl.textContent = Utils.formatCurrency(data[monthIndex].balance);
                this.principalPaidEl.textContent = Utils.formatCurrency(principalPaidData[monthIndex]);
                this.interestPaidEl.textContent = Utils.formatCurrency(interestPaidData[monthIndex]);
            };

            this.yearSlider.oninput = updateSliderDetails;
            updateSliderDetails();
        }
    }
    
    // ========== Tab Management ==========
    class TabManager {
        constructor() {
            this.tabContainer = document.querySelector('.tab-controls');
            if(!this.tabContainer) return;
            this.tabContainer.addEventListener('click', e => {
                const button = e.target.closest('button');
                if (button) this.switchTab(button.dataset.tab);
            });
        }
        switchTab(tabId) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.toggle('active', content.id === tabId));
            if (tabId === 'chart' && state.chartInstance) {
                state.chartInstance.resize();
            }
            Utils.announceToScreenReader(`Switched to ${tabId} tab`);
        }
    }
    
    // ========== Theme Manager ==========
    class ThemeManager {
        constructor() {
            this.themeToggle = document.getElementById('theme-toggle');
            this.themeToggle?.addEventListener('click', this.toggleTheme.bind(this));
            this.initTheme();
        }
        initTheme() {
            const savedTheme = localStorage.getItem('theme') || (state.darkMode ? 'dark' : 'light');
            document.body.dataset.theme = savedTheme;
            document.getElementById('theme-icon')?.classList.toggle('fa-sun', savedTheme === 'dark');
            document.getElementById('theme-icon')?.classList.toggle('fa-moon', savedTheme === 'light');
        }
        toggleTheme() {
            let currentTheme = document.body.dataset.theme;
            let newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.body.dataset.theme = newTheme;
            localStorage.setItem('theme', newTheme);
            document.getElementById('theme-icon')?.classList.toggle('fa-sun', newTheme === 'dark');
            document.getElementById('theme-icon')?.classList.toggle('fa-moon', newTheme === 'light');
        }
    }

    // ========== Main Calculator Controller ==========
    class MortgageCalculator {
        constructor() {
            this.formManager = new FormManager();
            this.resultsManager = new ResultsManager();
            this.tabManager = new TabManager();
            this.themeManager = new ThemeManager();
            this.init();
        }

        init() {
            document.addEventListener('calculate', this.calculate.bind(this));
            document.getElementById('calculate-btn')?.addEventListener('click', this.calculate.bind(this));
            document.getElementById('reset-form')?.addEventListener('click', () => this.formManager.reset());
            this.performInitialCalculation();
        }

        calculate() {
            document.getElementById('loading-overlay').style.display = 'grid';
            
            // Use a timeout to allow the loading spinner to render before the calculation blocks the main thread.
            setTimeout(() => {
                const formData = this.formManager.getFormData();
                const { homePrice, downPayment, interestRate, loanTerm, propertyTax, homeInsurance, pmi, extraPayment, extraOnetime } = formData;
                
                const loanAmount = homePrice - downPayment;
                if (loanAmount <= 0) {
                    document.getElementById('loading-overlay').style.display = 'none';
                    return;
                }
                
                const monthlyEquivalentExtra = state.extraPaymentFrequency === 'weekly' ? extraPayment * (52 / 12) : extraPayment;

                const amortizationData = MortgageEngine.generateAmortizationSchedule(loanAmount, interestRate, loanTerm, monthlyEquivalentExtra, extraOnetime);
                
                const monthlyPI = MortgageEngine.calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
                const monthlyTax = propertyTax / 12;
                const monthlyInsurance = homeInsurance / 12;

                const totalInterest = amortizationData.reduce((acc, row) => acc + row.interest, 0);
                const totalCost = loanAmount + totalInterest + (propertyTax + homeInsurance) * (amortizationData.length / 12);
                
                const payoffDate = new Date();
                payoffDate.setMonth(payoffDate.getMonth() + amortizationData.length);

                const calculations = {
                    loanAmount, interestRate, loanTerm,
                    monthlyPI, monthlyTax, monthlyInsurance, monthlyPMI: pmi,
                    totalMonthly: monthlyPI + monthlyTax + monthlyInsurance + pmi,
                    totalInterest, totalCost, payoffDate,
                    ltvRatio: loanAmount / homePrice
                };
                
                state.updateCalculations(calculations);
                
                this.resultsManager.updateAll(calculations, amortizationData, formData);
                this.formManager.updateExtraPaymentPreview();

                document.getElementById('loading-overlay').style.display = 'none';
            }, 100);
        }

        performInitialCalculation() {
            document.dispatchEvent(new CustomEvent('calculate'));
        }
    }

    // ========== Initialize Application ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.mortgageCalculator = new MortgageCalculator());
    } else {
        window.mortgageCalculator = new MortgageCalculator();
    }
})();
