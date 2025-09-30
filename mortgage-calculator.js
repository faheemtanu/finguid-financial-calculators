/* ============================================================================
   WORLD'S #1 AI-ENHANCED MORTGAGE CALCULATOR - PRODUCTION JAVASCRIPT
   Advanced Features: AI Insights, Voice Control, Real-Time Updates, PMI Auto-Calc
   Version: 4.0 Production Ready - All Improvements Implemented
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
            this.locationData = null;
            this.extraPaymentFrequency = 'monthly'; // NEW: Track frequency

            // Market data
            this.marketRates = {
                '30yr': 6.43,
                '15yr': 5.73,
                'arm': 5.90,
                'fha': 6.44
            };

            // PMI rates based on LTV ratio - ENHANCED
            this.pmiRates = {
                // LTV ratio: [min rate, max rate, typical rate]
                0.95: [0.008, 0.015, 0.012], // >95% LTV
                0.90: [0.006, 0.012, 0.008], // 90-95% LTV  
                0.85: [0.004, 0.008, 0.006], // 85-90% LTV
                0.80: [0.003, 0.006, 0.005], // 80-85% LTV
                0.00: [0.000, 0.000, 0.000]  // <80% LTV (no PMI)
            };

            // Location-based data with enhanced tax rates
            this.stateData = {
                'Alabama': { tax: 0.0041, insurance: 1200 },
                'Alaska': { tax: 0.0103, insurance: 1100 },
                'Arizona': { tax: 0.0066, insurance: 1300 },
                'Arkansas': { tax: 0.0062, insurance: 1400 },
                'California': { tax: 0.0075, insurance: 2100 },
                'Colorado': { tax: 0.0051, insurance: 1800 },
                'Connecticut': { tax: 0.0208, insurance: 1600 },
                'Delaware': { tax: 0.0057, insurance: 1500 },
                'Florida': { tax: 0.0083, insurance: 2400 },
                'Georgia': { tax: 0.0092, insurance: 1700 },
                'Hawaii': { tax: 0.0028, insurance: 1400 },
                'Idaho': { tax: 0.0069, insurance: 1200 },
                'Illinois': { tax: 0.0223, insurance: 1500 },
                'Indiana': { tax: 0.0085, insurance: 1300 },
                'Iowa': { tax: 0.0154, insurance: 1400 },
                'Kansas': { tax: 0.0144, insurance: 1500 },
                'Kentucky': { tax: 0.0086, insurance: 1600 },
                'Louisiana': { tax: 0.0055, insurance: 2200 },
                'Maine': { tax: 0.0125, insurance: 1300 },
                'Maryland': { tax: 0.0108, insurance: 1600 },
                'Massachusetts': { tax: 0.0116, insurance: 1700 },
                'Michigan': { tax: 0.0154, insurance: 1400 },
                'Minnesota': { tax: 0.0111, insurance: 1500 },
                'Mississippi': { tax: 0.0061, insurance: 1800 },
                'Missouri': { tax: 0.0098, insurance: 1500 },
                'Montana': { tax: 0.0084, insurance: 1300 },
                'Nebraska': { tax: 0.0176, insurance: 1600 },
                'Nevada': { tax: 0.0060, insurance: 1300 },
                'New Hampshire': { tax: 0.0186, insurance: 1200 },
                'New Jersey': { tax: 0.0249, insurance: 1800 },
                'New Mexico': { tax: 0.0080, insurance: 1400 },
                'New York': { tax: 0.0162, insurance: 1900 },
                'North Carolina': { tax: 0.0084, insurance: 1500 },
                'North Dakota': { tax: 0.0098, insurance: 1400 },
                'Ohio': { tax: 0.0157, insurance: 1300 },
                'Oklahoma': { tax: 0.0090, insurance: 1700 },
                'Oregon': { tax: 0.0087, insurance: 1200 },
                'Pennsylvania': { tax: 0.0153, insurance: 1400 },
                'Rhode Island': { tax: 0.0147, insurance: 1600 },
                'South Carolina': { tax: 0.0057, insurance: 1600 },
                'South Dakota': { tax: 0.0128, insurance: 1500 },
                'Tennessee': { tax: 0.0064, insurance: 1500 },
                'Texas': { tax: 0.0181, insurance: 2000 },
                'Utah': { tax: 0.0061, insurance: 1300 },
                'Vermont': { tax: 0.0186, insurance: 1200 },
                'Virginia': { tax: 0.0082, insurance: 1500 },
                'Washington': { tax: 0.0087, insurance: 1400 },
                'West Virginia': { tax: 0.0059, insurance: 1400 },
                'Wisconsin': { tax: 0.0176, insurance: 1300 },
                'Wyoming': { tax: 0.0062, insurance: 1200 }
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
            this.notifyStateChange('calculations', data);
        }

        notifyStateChange(type, data) {
            const event = new CustomEvent('stateChanged', {
                detail: { type, data }
            });
            document.dispatchEvent(event);
        }
    }

    // Initialize global state
    const state = new MortgageCalculatorState();

    // ========== Utility Functions ==========
    const Utils = {
        formatCurrency(amount, includeCents = false) {
            if (typeof amount !== 'number' || isNaN(amount)) return '$0';

            const formatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: includeCents ? 2 : 0,
                maximumFractionDigits: includeCents ? 2 : 0
            });

            return formatter.format(amount);
        },

        formatNumber(num, decimals = 0) {
            if (typeof num !== 'number' || isNaN(num)) return '0';

            return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(num);
        },

        parseCurrency(value) {
            if (typeof value === 'number') return value;

            const cleaned = value.toString().replace(/[$,]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        },

        parsePercentage(value) {
            const cleaned = value.toString().replace(/[%]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        },

        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        showToast(message, type = 'info', duration = 4000) {
            const toastContainer = document.getElementById('toast-container');
            const toast = document.createElement('div');

            toast.className = `toast ${type}`;
            toast.innerHTML = `
                <i class="fas ${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            `;

            toastContainer.appendChild(toast);

            // Auto remove
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, duration);

            // Click to dismiss
            toast.addEventListener('click', () => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            });
        },

        getToastIcon(type) {
            const icons = {
                success: 'fa-check-circle',
                error: 'fa-exclamation-circle',
                warning: 'fa-exclamation-triangle',
                info: 'fa-info-circle'
            };
            return icons[type] || icons.info;
        },

        formatDate(date) {
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(date);
        },

        announceToScreenReader(message) {
            const announcement = document.getElementById('sr-announcements');
            if (announcement) {
                announcement.textContent = message;
                setTimeout(() => {
                    announcement.textContent = '';
                }, 1000);
            }
        },

        // NEW: Enhanced number formatting for inputs
        formatInputNumber(value, allowDecimals = true) {
            if (!value) return '';

            // Remove all non-numeric characters except decimal point
            let cleaned = value.toString().replace(/[^0-9.]/g, '');

            if (!allowDecimals) {
                cleaned = cleaned.replace(/\./g, '');
            } else {
                // Ensure only one decimal point
                const parts = cleaned.split('.');
                if (parts.length > 2) {
                    cleaned = parts[0] + '.' + parts.slice(1).join('');
                }
            }

            return cleaned;
        }
    };

    // ========== Enhanced Mortgage Calculator Engine ==========
    class MortgageEngine {
        static calculateMonthlyPayment(principal, rate, termYears) {
            if (rate === 0) return principal / (termYears * 12);

            const monthlyRate = rate / 100 / 12;
            const numPayments = termYears * 12;

            const monthlyPayment = principal * 
                (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                (Math.pow(1 + monthlyRate, numPayments) - 1);

            return monthlyPayment;
        }

        // ENHANCED PMI calculation with LTV-based rates
        static calculatePMI(loanAmount, homePrice, downPayment) {
            const ltvRatio = loanAmount / homePrice;

            if (ltvRatio <= 0.8) return { monthly: 0, rate: 0, range: '0% - 0%' };

            // Determine PMI rate based on LTV
            let pmiData;
            if (ltvRatio > 0.95) {
                pmiData = state.pmiRates[0.95];
            } else if (ltvRatio > 0.90) {
                pmiData = state.pmiRates[0.90];
            } else if (ltvRatio > 0.85) {
                pmiData = state.pmiRates[0.85];
            } else {
                pmiData = state.pmiRates[0.80];
            }

            const [minRate, maxRate, typicalRate] = pmiData;
            const monthlyPMI = (loanAmount * typicalRate) / 12;

            return {
                monthly: monthlyPMI,
                rate: typicalRate,
                range: `${(minRate * 100).toFixed(1)}% - ${(maxRate * 100).toFixed(1)}%`
            };
        }

        // ENHANCED amortization with extra payments
        static generateAmortizationSchedule(principal, rate, termYears, extraPayment = 0, extraOnetime = 0, frequency = 'monthly') {
            const monthlyRate = rate / 100 / 12;
            const originalPayment = this.calculateMonthlyPayment(principal, rate, termYears);
            const schedule = [];

            let balance = principal;
            let totalInterest = 0;
            let totalPrincipal = 0;
            let month = 1;

            // Convert weekly extra payment to monthly equivalent
            const monthlyExtraPayment = frequency === 'weekly' ? extraPayment * 4.33 : extraPayment;

            while (balance > 0.01 && month <= termYears * 12 + 120) {
                const interestPayment = balance * monthlyRate;
                let principalPayment = originalPayment - interestPayment;

                // Add extra payments
                if (monthlyExtraPayment > 0) {
                    principalPayment += monthlyExtraPayment;
                }

                // One-time extra payment at month 12
                if (month === 12 && extraOnetime > 0) {
                    principalPayment += extraOnetime;
                }

                // Don't overpay
                if (principalPayment > balance) {
                    principalPayment = balance;
                }

                const totalPayment = interestPayment + principalPayment;
                balance -= principalPayment;

                totalInterest += interestPayment;
                totalPrincipal += principalPayment;

                schedule.push({
                    month: month,
                    payment: totalPayment,
                    principal: principalPayment,
                    interest: interestPayment,
                    balance: balance,
                    totalInterest: totalInterest,
                    totalPrincipal: totalPrincipal
                });

                month++;
            }

            return schedule;
        }

        static calculateBreakdown(homePrice, downPayment, interestRate, loanTerm, propertyTax, homeInsurance, pmiData, extraPayment = 0) {
            const loanAmount = homePrice - downPayment;
            const monthlyPI = this.calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
            const monthlyTax = propertyTax / 12;
            const monthlyInsurance = homeInsurance / 12;
            const monthlyPMI = pmiData.monthly;

            const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI;
            const totalInterest = (monthlyPI * loanTerm * 12) - loanAmount;
            const totalCost = loanAmount + totalInterest;

            // Calculate payoff date
            const currentDate = new Date();
            const payoffDate = new Date(currentDate);
            payoffDate.setFullYear(payoffDate.getFullYear() + loanTerm);

            return {
                loanAmount: loanAmount,
                monthlyPI: monthlyPI,
                monthlyTax: monthlyTax,
                monthlyInsurance: monthlyInsurance,
                monthlyPMI: monthlyPMI,
                totalMonthly: totalMonthly,
                totalInterest: totalInterest,
                totalCost: totalCost,
                payoffDate: payoffDate,
                ltvRatio: loanAmount / homePrice,
                pmiData: pmiData
            };
        }
    }

    // ========== Enhanced AI Insights Generator ==========
    class AIInsights {
        static generateInsights(calculations, extraPayment = 0, frequency = 'monthly') {
            const insights = [];
            const { loanAmount, monthlyPI, totalInterest, ltvRatio, monthlyPMI, pmiData } = calculations;

            // Down payment insight
            if (ltvRatio <= 0.8) {
                insights.push({
                    type: 'success',
                    title: 'Excellent Down Payment!',
                    message: `Your ${Utils.formatNumber((1 - ltvRatio) * 100, 1)}% down payment eliminates PMI, saving you money each month and showing lenders you're a lower-risk borrower.`,
                    icon: 'fa-check-circle'
                });
            } else if (ltvRatio >= 0.95) {
                insights.push({
                    type: 'warning',
                    title: 'High LTV Ratio',
                    message: `With only ${Utils.formatNumber((1 - ltvRatio) * 100, 1)}% down, you'll pay ${Utils.formatCurrency(monthlyPMI)} monthly in PMI (${(pmiData.rate * 100).toFixed(2)}% annually). Consider saving more for a larger down payment.`,
                    icon: 'fa-exclamation-triangle'
                });
            } else {
                insights.push({
                    type: 'info',
                    title: 'PMI Required',
                    message: `Your ${Utils.formatNumber((1 - ltvRatio) * 100, 1)}% down payment requires PMI of ${Utils.formatCurrency(monthlyPMI)}/month (${(pmiData.rate * 100).toFixed(2)}% annually) until you reach 20% equity.`,
                    icon: 'fa-info-circle'
                });
            }

            // ENHANCED: Extra payment suggestion with frequency awareness
            if (extraPayment > 0) {
                const extraPaymentSavings = this.calculateExtraPaymentSavings(loanAmount, 6.43, 30, extraPayment, frequency);
                const frequencyText = frequency === 'weekly' ? 'weekly' : 'monthly';

                insights.push({
                    type: 'success',
                    title: `Great ${frequencyText} Extra Payment!`,
                    message: `Your ${Utils.formatCurrency(extraPayment)} ${frequencyText} extra payment could save you ${Utils.formatCurrency(extraPaymentSavings.savings)} in interest and pay off your loan ${extraPaymentSavings.timeSaved} years early.`,
                    icon: 'fa-piggy-bank'
                });
            } else {
                const suggestedExtra = frequency === 'weekly' ? 50 : 200;
                const extraPaymentSavings = this.calculateExtraPaymentSavings(loanAmount, 6.43, 30, suggestedExtra, frequency);

                insights.push({
                    type: 'info',
                    title: 'Consider Extra Payments',
                    message: `Adding just ${Utils.formatCurrency(suggestedExtra)}/${frequency} extra could save you over ${Utils.formatCurrency(extraPaymentSavings.savings)} in interest and pay off your loan ${extraPaymentSavings.timeSaved} years early.`,
                    icon: 'fa-lightbulb'
                });
            }

            // Interest rate insight
            if (state.marketRates['30yr']) {
                const currentRate = parseFloat(document.getElementById('interest-rate').value);
                const marketAverage = state.marketRates['30yr'];

                if (currentRate > marketAverage + 0.25) {
                    insights.push({
                        type: 'warning',
                        title: 'Rate Shopping Opportunity',
                        message: `Your rate is ${(currentRate - marketAverage).toFixed(2)}% above market average. Shopping with multiple lenders could save you thousands.`,
                        icon: 'fa-search'
                    });
                } else if (currentRate < marketAverage - 0.25) {
                    insights.push({
                        type: 'success',
                        title: 'Great Interest Rate!',
                        message: `Your rate is ${(marketAverage - currentRate).toFixed(2)}% below market average. You've secured an excellent deal!`,
                        icon: 'fa-star'
                    });
                }
            }

            return insights;
        }

        // ENHANCED: Extra payment calculations with frequency support
        static calculateExtraPaymentSavings(principal, rate, termYears, extraPayment, frequency = 'monthly') {
            const standardSchedule = MortgageEngine.generateAmortizationSchedule(principal, rate, termYears);
            const extraSchedule = MortgageEngine.generateAmortizationSchedule(principal, rate, termYears, extraPayment, 0, frequency);

            const standardTotalInterest = standardSchedule[standardSchedule.length - 1]?.totalInterest || 0;
            const extraTotalInterest = extraSchedule[extraSchedule.length - 1]?.totalInterest || 0;

            const savings = standardTotalInterest - extraTotalInterest;
            const timeSaved = (standardSchedule.length - extraSchedule.length) / 12;

            return {
                savings: Math.max(0, savings),
                timeSaved: Math.max(0, Math.round(timeSaved * 10) / 10)
            };
        }
    }

    // ========== Enhanced Form Management ==========
    class FormManager {
        constructor() {
            this.form = document.querySelector('.mortgage-form');
            this.inputs = {};
            this.validators = {};
            this.initializeInputs();
            this.setupEventListeners();
        }

        initializeInputs() {
            this.inputs = {
                homePrice: document.getElementById('home-price'),
                downPayment: document.getElementById('down-payment'),
                downPaymentPercent: document.getElementById('down-payment-percent'),
                interestRate: document.getElementById('interest-rate'),
                loanTerm: document.getElementById('loan-term'),
                customTerm: document.getElementById('custom-term'),
                propertyState: document.getElementById('property-state'),
                propertyTax: document.getElementById('property-tax'),
                homeInsurance: document.getElementById('home-insurance'),
                pmi: document.getElementById('pmi'),
                extraPayment: document.getElementById('extra-payment'), // UNIFIED extra payment
                extraOnetime: document.getElementById('extra-onetime')
            };

            this.populateStatesDropdown();
            this.setupInputFormatting();
            this.setupInputValidation();
        }

        populateStatesDropdown() {
            const stateSelect = this.inputs.propertyState;
            if (!stateSelect) return;

            // Add default option
            stateSelect.innerHTML = '<option value="">Select your state...</option>';

            // Add states
            Object.keys(state.stateData).forEach(stateName => {
                const option = document.createElement('option');
                option.value = stateName;
                option.textContent = stateName;
                stateSelect.appendChild(option);
            });
        }

        setupInputFormatting() {
            // ENHANCED: Currency formatting with better decimal support
            const currencyInputs = ['home-price', 'down-payment', 'property-tax', 'home-insurance', 'extra-payment', 'extra-onetime'];
            currencyInputs.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.addEventListener('input', (e) => this.formatCurrencyInput(e, false));
                    input.addEventListener('blur', (e) => this.formatCurrencyInput(e, true));
                }
            });

            // ENHANCED: Percentage formatting with decimal support
            const percentInputs = ['interest-rate', 'down-payment-percent'];
            percentInputs.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.addEventListener('input', this.formatPercentInput.bind(this));
                }
            });
        }

        formatCurrencyInput(e, addCommas = false) {
            const input = e.target;
            let value = Utils.formatInputNumber(input.value, false); // No decimals for currency

            if (value && addCommas) {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    input.value = Utils.formatNumber(numValue);
                }
            } else if (value) {
                input.value = value;
            }
        }

        formatPercentInput(e) {
            const input = e.target;
            let value = Utils.formatInputNumber(input.value, true); // Allow decimals for percentages

            if (value) {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    // Cap percentage at reasonable limits
                    if (input.id === 'interest-rate' && numValue > 20) {
                        input.value = '20';
                    } else if (input.id === 'down-payment-percent' && numValue > 100) {
                        input.value = '100';
                    } else {
                        input.value = value;
                    }
                }
            }

            // Trigger synchronization for down payment
            if (input.id === 'down-payment-percent') {
                this.syncDownPaymentValues('percent');
                this.updatePMIWarning();
            }
        }

        setupEventListeners() {
            // Down payment toggle
            const amountToggle = document.getElementById('amount-toggle');
            const percentToggle = document.getElementById('percent-toggle');

            if (amountToggle && percentToggle) {
                amountToggle.addEventListener('click', () => this.toggleDownPaymentMode('amount'));
                percentToggle.addEventListener('click', () => this.toggleDownPaymentMode('percent'));
            }

            // Term selection
            const termChips = document.querySelectorAll('.term-chip');
            termChips.forEach(chip => {
                chip.addEventListener('click', () => this.selectLoanTerm(chip.dataset.term));
            });

            // Custom term input
            if (this.inputs.customTerm) {
                this.inputs.customTerm.addEventListener('input', (e) => {
                    if (e.target.value) {
                        this.selectLoanTerm(e.target.value);
                        termChips.forEach(chip => chip.classList.remove('active'));
                    }
                });
            }

            // State selection for tax/insurance calculation
            if (this.inputs.propertyState) {
                this.inputs.propertyState.addEventListener('change', this.updateLocationBasedData.bind(this));
            }

            // ENHANCED: Real-time calculation triggers with PMI sync
            const calculationTriggers = [
                'home-price', 'down-payment', 'down-payment-percent', 
                'interest-rate', 'property-tax', 'home-insurance', 'extra-payment'
            ];

            calculationTriggers.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.addEventListener('input', Utils.debounce(() => {
                        if (id === 'down-payment') {
                            this.syncDownPaymentValues('amount');
                            this.updatePMIWarning();
                        }
                        this.triggerCalculation();
                    }, 300));
                }
            });

            // Suggestion chips
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('suggestion-chip')) {
                    const targetInput = e.target.dataset.input;
                    const value = e.target.dataset.value;
                    const input = document.getElementById(targetInput);

                    if (input) {
                        input.value = Utils.formatNumber(parseFloat(value));
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            });

            // ENHANCED: Extra payment frequency toggle (SINGLE VALUE)
            const monthlyToggle = document.getElementById('monthly-toggle');
            const weeklyToggle = document.getElementById('weekly-toggle');

            if (monthlyToggle && weeklyToggle) {
                monthlyToggle.addEventListener('click', () => this.setExtraPaymentFrequency('monthly'));
                weeklyToggle.addEventListener('click', () => this.setExtraPaymentFrequency('weekly'));
            }
        }

        toggleDownPaymentMode(mode) {
            const amountInput = document.getElementById('amount-input');
            const percentInput = document.getElementById('percent-input');
            const amountToggle = document.getElementById('amount-toggle');
            const percentToggle = document.getElementById('percent-toggle');

            if (mode === 'amount') {
                amountInput.style.display = 'block';
                percentInput.style.display = 'none';
                amountToggle.classList.add('active');
                percentToggle.classList.remove('active');
                amountToggle.setAttribute('aria-pressed', 'true');
                percentToggle.setAttribute('aria-pressed', 'false');
            } else {
                amountInput.style.display = 'none';
                percentInput.style.display = 'block';
                amountToggle.classList.remove('active');
                percentToggle.classList.add('active');
                amountToggle.setAttribute('aria-pressed', 'false');
                percentToggle.setAttribute('aria-pressed', 'true');
            }
        }

        // ENHANCED: Down payment synchronization
        syncDownPaymentValues(sourceMode) {
            const homePrice = Utils.parseCurrency(this.inputs.homePrice.value);
            const downPaymentAmount = Utils.parseCurrency(this.inputs.downPayment.value);
            const downPaymentPercent = Utils.parsePercentage(this.inputs.downPaymentPercent.value);

            if (sourceMode === 'amount' && homePrice > 0 && downPaymentAmount > 0) {
                const percent = (downPaymentAmount / homePrice) * 100;
                this.inputs.downPaymentPercent.value = Utils.formatNumber(percent, 2);
            } else if (sourceMode === 'percent' && homePrice > 0 && downPaymentPercent > 0) {
                const amount = (homePrice * downPaymentPercent) / 100;
                this.inputs.downPayment.value = Utils.formatNumber(amount);
            }
        }

        selectLoanTerm(term) {
            const termChips = document.querySelectorAll('.term-chip');
            termChips.forEach(chip => {
                chip.classList.toggle('active', chip.dataset.term === term);
                chip.setAttribute('aria-checked', chip.dataset.term === term ? 'true' : 'false');
            });

            this.inputs.loanTerm.value = term;
            this.triggerCalculation();
        }

        updateLocationBasedData() {
            const selectedState = this.inputs.propertyState.value;
            const homePrice = Utils.parseCurrency(this.inputs.homePrice.value);

            if (selectedState && state.stateData[selectedState] && homePrice > 0) {
                const stateData = state.stateData[selectedState];

                // Update property tax
                const annualTax = homePrice * stateData.tax;
                this.inputs.propertyTax.value = Utils.formatNumber(annualTax);

                // Update home insurance
                this.inputs.homeInsurance.value = Utils.formatNumber(stateData.insurance);

                // Update help text
                const taxHelp = document.getElementById('tax-help');
                const insuranceHelp = document.getElementById('insurance-help');

                if (taxHelp) {
                    taxHelp.textContent = `${selectedState} average: ${(stateData.tax * 100).toFixed(2)}% of home value`;
                }

                if (insuranceHelp) {
                    insuranceHelp.textContent = `${selectedState} average: $${Utils.formatNumber(stateData.insurance)}`;
                }

                this.triggerCalculation();
            }
        }

        // ENHANCED: PMI warning with rate display
        updatePMIWarning() {
            const homePrice = Utils.parseCurrency(this.inputs.homePrice.value);
            const downPayment = Utils.parseCurrency(this.inputs.downPayment.value);
            const pmiWarning = document.getElementById('pmi-warning');
            const pmiInput = this.inputs.pmi;
            const pmiAmountDisplay = document.getElementById('pmi-amount-display');
            const pmiRateDisplay = document.getElementById('pmi-rate-display');

            if (homePrice > 0 && downPayment > 0) {
                const loanAmount = homePrice - downPayment;
                const pmiData = MortgageEngine.calculatePMI(loanAmount, homePrice, downPayment);

                if (pmiData.monthly > 0) {
                    // PMI required
                    pmiWarning.style.display = 'flex';
                    pmiInput.value = Utils.formatNumber(pmiData.monthly);

                    if (pmiAmountDisplay) {
                        pmiAmountDisplay.textContent = Utils.formatNumber(pmiData.monthly);
                    }

                    if (pmiRateDisplay) {
                        pmiRateDisplay.textContent = `${(pmiData.rate * 100).toFixed(2)}% (Range: ${pmiData.range})`;
                    }
                } else {
                    // No PMI required
                    pmiWarning.style.display = 'none';
                    pmiInput.value = '0';

                    if (pmiAmountDisplay) {
                        pmiAmountDisplay.textContent = '0';
                    }

                    if (pmiRateDisplay) {
                        pmiRateDisplay.textContent = '0% (Range: 0% - 0%)';
                    }
                }
            }
        }

        // ENHANCED: Single extra payment field with frequency toggle
        setExtraPaymentFrequency(frequency) {
            const monthlyToggle = document.getElementById('monthly-toggle');
            const weeklyToggle = document.getElementById('weekly-toggle');
            const extraLabel = document.getElementById('extra-payment-label');
            const extraHelp = document.getElementById('extra-payment-help');

            if (frequency === 'monthly') {
                monthlyToggle.classList.add('active');
                weeklyToggle.classList.remove('active');
                monthlyToggle.setAttribute('aria-pressed', 'true');
                weeklyToggle.setAttribute('aria-pressed', 'false');

                if (extraLabel) extraLabel.textContent = 'Extra Monthly Payment';
                if (extraHelp) extraHelp.textContent = 'Additional amount to pay each month';
            } else {
                monthlyToggle.classList.remove('active');
                weeklyToggle.classList.add('active');
                monthlyToggle.setAttribute('aria-pressed', 'false');
                weeklyToggle.setAttribute('aria-pressed', 'true');

                if (extraLabel) extraLabel.textContent = 'Extra Weekly Payment';
                if (extraHelp) extraHelp.textContent = 'Additional amount to pay each week';
            }

            state.extraPaymentFrequency = frequency;
            this.updateExtraPaymentPreview();
            this.triggerCalculation(); // Recalculate with new frequency
        }

        updateExtraPaymentPreview() {
            const extraAmount = Utils.parseCurrency(this.inputs.extraPayment.value);
            const savingsPreview = document.getElementById('savings-preview');
            const savingsText = savingsPreview.querySelector('span');

            if (extraAmount > 0 && state.calculations.loanAmount) {
                const savings = AIInsights.calculateExtraPaymentSavings(
                    state.calculations.loanAmount,
                    Utils.parsePercentage(this.inputs.interestRate.value),
                    parseInt(this.inputs.loanTerm.value),
                    extraAmount,
                    state.extraPaymentFrequency
                );

                const frequencyText = state.extraPaymentFrequency === 'weekly' ? 'weekly' : 'monthly';
                savingsText.textContent = `Save ${Utils.formatCurrency(savings.savings)} in interest and pay off ${savings.timeSaved} years early with ${Utils.formatCurrency(extraAmount)} ${frequencyText}`;
                savingsPreview.classList.add('text-success');
            } else {
                savingsText.textContent = 'Add extra payments to see potential savings';
                savingsPreview.classList.remove('text-success');
            }
        }

        triggerCalculation() {
            const event = new CustomEvent('calculate');
            document.dispatchEvent(event);
        }

        getFormData() {
            const homePrice = Utils.parseCurrency(this.inputs.homePrice.value);
            const downPayment = Utils.parseCurrency(this.inputs.downPayment.value);
            const interestRate = Utils.parsePercentage(this.inputs.interestRate.value);
            const loanTerm = parseInt(this.inputs.loanTerm.value) || parseInt(this.inputs.customTerm.value) || 30;
            const propertyTax = Utils.parseCurrency(this.inputs.propertyTax.value);
            const homeInsurance = Utils.parseCurrency(this.inputs.homeInsurance.value);
            const extraPayment = Utils.parseCurrency(this.inputs.extraPayment.value);
            const extraOnetime = Utils.parseCurrency(this.inputs.extraOnetime.value);

            return {
                homePrice,
                downPayment,
                interestRate,
                loanTerm,
                propertyTax,
                homeInsurance,
                extraPayment,
                extraOnetime,
                frequency: state.extraPaymentFrequency
            };
        }

        reset() {
            // Reset to default values
            this.inputs.homePrice.value = '400,000';
            this.inputs.downPayment.value = '80,000';
            this.inputs.downPaymentPercent.value = '20';
            this.inputs.interestRate.value = '6.43';
            this.inputs.propertyTax.value = '3,000';
            this.inputs.homeInsurance.value = '1,600';
            this.inputs.pmi.value = '0';
            this.inputs.extraPayment.value = '0';
            this.inputs.extraOnetime.value = '0';
            this.inputs.propertyState.value = '';

            if (this.inputs.customTerm) {
                this.inputs.customTerm.value = '';
            }

            // Reset term selection to 30 years
            this.selectLoanTerm('30');

            // Reset toggles
            this.toggleDownPaymentMode('amount');
            this.setExtraPaymentFrequency('monthly');

            // Hide PMI warning
            const pmiWarning = document.getElementById('pmi-warning');
            if (pmiWarning) pmiWarning.style.display = 'none';

            Utils.showToast('Form has been reset', 'info');
            Utils.announceToScreenReader('Mortgage calculator form has been reset');
        }

        validateForm() {
            const formData = this.getFormData();
            const errors = [];

            if (formData.homePrice <= 0) {
                errors.push('Home price must be greater than $0');
            }

            if (formData.downPayment >= formData.homePrice) {
                errors.push('Down payment cannot exceed home price');
            }

            if (formData.interestRate <= 0 || formData.interestRate > 20) {
                errors.push('Interest rate must be between 0.1% and 20%');
            }

            if (formData.loanTerm < 5 || formData.loanTerm > 50) {
                errors.push('Loan term must be between 5 and 50 years');
            }

            return errors;
        }
    }

    // ========== Enhanced Results Display Manager ==========
    class ResultsManager {
        constructor() {
            this.elements = this.initializeElements();
            this.chartManager = new ChartManager();
        }

        initializeElements() {
            return {
                totalPayment: document.getElementById('total-payment'),
                principalInterest: document.getElementById('principal-interest'),
                monthlyTax: document.getElementById('monthly-tax'),
                monthlyInsurance: document.getElementById('monthly-insurance'),
                monthlyPMI: document.getElementById('monthly-pmi'),
                displayLoanAmount: document.getElementById('display-loan-amount'),
                displayTotalInterest: document.getElementById('display-total-interest'),
                displayTotalCost: document.getElementById('display-total-cost'),
                displayPayoffDate: document.getElementById('display-payoff-date'),
                chartLoanAmount: document.getElementById('chart-loan-amount'),
                aiInsightsList: document.getElementById('ai-insights-list')
            };
        }

        updateResults(calculations) {
            // Update payment highlight
            if (this.elements.totalPayment) {
                this.elements.totalPayment.textContent = Utils.formatCurrency(calculations.totalMonthly);
            }

            // Update payment breakdown
            if (this.elements.principalInterest) {
                this.elements.principalInterest.textContent = Utils.formatCurrency(calculations.monthlyPI);
            }

            if (this.elements.monthlyTax) {
                this.elements.monthlyTax.textContent = Utils.formatCurrency(calculations.monthlyTax);
            }

            if (this.elements.monthlyInsurance) {
                this.elements.monthlyInsurance.textContent = Utils.formatCurrency(calculations.monthlyInsurance);
            }

            if (this.elements.monthlyPMI) {
                this.elements.monthlyPMI.textContent = Utils.formatCurrency(calculations.monthlyPMI);
            }

            // Update loan summary
            if (this.elements.displayLoanAmount) {
                this.elements.displayLoanAmount.textContent = Utils.formatCurrency(calculations.loanAmount);
            }

            if (this.elements.displayTotalInterest) {
                this.elements.displayTotalInterest.textContent = Utils.formatCurrency(calculations.totalInterest);
            }

            if (this.elements.displayTotalCost) {
                this.elements.displayTotalCost.textContent = Utils.formatCurrency(calculations.totalCost);
            }

            if (this.elements.displayPayoffDate) {
                const payoffDate = new Date(calculations.payoffDate);
                this.elements.displayPayoffDate.textContent = payoffDate.toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric'
                });
            }

            // Update chart description
            if (this.elements.chartLoanAmount) {
                this.elements.chartLoanAmount.textContent = `Interactive chart based on your ${Utils.formatCurrency(calculations.loanAmount)} loan`;
            }

            // Update breakdown bars
            this.updateBreakdownBars(calculations);

            Utils.announceToScreenReader(`Monthly payment calculated: ${Utils.formatCurrency(calculations.totalMonthly)}`);
        }

        updateBreakdownBars(calculations) {
            const total = calculations.totalMonthly;

            const piPercentage = (calculations.monthlyPI / total) * 100;
            const taxPercentage = (calculations.monthlyTax / total) * 100;
            const insurancePercentage = (calculations.monthlyInsurance / total) * 100;
            const pmiPercentage = (calculations.monthlyPMI / total) * 100;

            const piFill = document.querySelector('#pi-fill .breakdown-fill');
            const taxFill = document.querySelector('#tax-fill .breakdown-fill');
            const insuranceFill = document.querySelector('#insurance-fill .breakdown-fill');
            const pmiFill = document.querySelector('#pmi-fill .breakdown-fill');

            if (piFill) piFill.style.width = `${piPercentage}%`;
            if (taxFill) taxFill.style.width = `${taxPercentage}%`;
            if (insuranceFill) insuranceFill.style.width = `${insurancePercentage}%`;
            if (pmiFill) pmiFill.style.width = `${pmiPercentage}%`;
        }

        updateChart(amortizationData) {
            this.chartManager.createMortgageChart(amortizationData);
            this.chartManager.updateYearSlider(amortizationData);
        }

        // ENHANCED: AI insights with extra payment awareness
        updateAIInsights(calculations, extraPayment = 0, frequency = 'monthly') {
            if (!this.elements.aiInsightsList) return;

            const insights = AIInsights.generateInsights(calculations, extraPayment, frequency);

            this.elements.aiInsightsList.innerHTML = insights.map(insight => `
                <div class="insight-item ${insight.type}">
                    <div class="insight-icon">
                        <i class="fas ${insight.icon}"></i>
                    </div>
                    <div class="insight-content">
                        <h4>${insight.title}</h4>
                        <p>${insight.message}</p>
                    </div>
                </div>
            `).join('');
        }

        updateAmortizationTable(amortizationData) {
            const tableBody = document.getElementById('amortization-table-body');
            if (!tableBody || !amortizationData.length) return;

            state.amortizationData = amortizationData;
            this.renderAmortizationPage(1);
        }

        renderAmortizationPage(pageNumber) {
            const tableBody = document.getElementById('amortization-table-body');
            const currentPageSpan = document.getElementById('current-page');
            const totalPagesSpan = document.getElementById('total-pages');
            const prevBtn = document.getElementById('prev-page');
            const nextBtn = document.getElementById('next-page');

            if (!tableBody) return;

            const startIndex = (pageNumber - 1) * state.itemsPerPage;
            const endIndex = Math.min(startIndex + state.itemsPerPage, state.amortizationData.length);
            const totalPages = Math.ceil(state.amortizationData.length / state.itemsPerPage);

            // Clear table
            tableBody.innerHTML = '';

            // Add rows for current page
            for (let i = startIndex; i < endIndex; i++) {
                const payment = state.amortizationData[i];
                const row = document.createElement('tr');

                const paymentDate = new Date();
                paymentDate.setMonth(paymentDate.getMonth() + payment.month - 1);

                row.innerHTML = `
                    <td>${payment.month}</td>
                    <td>${Utils.formatDate(paymentDate)}</td>
                    <td>${Utils.formatCurrency(payment.payment, true)}</td>
                    <td>${Utils.formatCurrency(payment.principal, true)}</td>
                    <td>${Utils.formatCurrency(payment.interest, true)}</td>
                    <td>${Utils.formatCurrency(payment.balance, true)}</td>
                `;

                tableBody.appendChild(row);
            }

            // Update pagination controls
            state.currentPage = pageNumber;

            if (currentPageSpan) currentPageSpan.textContent = pageNumber;
            if (totalPagesSpan) totalPagesSpan.textContent = totalPages;

            if (prevBtn) {
                prevBtn.disabled = pageNumber <= 1;
                prevBtn.onclick = () => this.renderAmortizationPage(pageNumber - 1);
            }

            if (nextBtn) {
                nextBtn.disabled = pageNumber >= totalPages;
                nextBtn.onclick = () => this.renderAmortizationPage(pageNumber + 1);
            }
        }
    }

    // ========== Enhanced Chart Manager ==========
    class ChartManager {
        constructor() {
            this.chart = null;
            this.canvas = document.getElementById('mortgage-timeline-chart');
            this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        }

        createMortgageChart(amortizationData) {
            if (!this.ctx || !amortizationData.length) return;

            this.destroyChart();

            // Prepare data for yearly intervals
            const yearlyData = this.prepareYearlyData(amortizationData);

            const config = {
                type: 'line',
                data: {
                    labels: yearlyData.labels,
                    datasets: [{
                        label: 'Remaining Balance',
                        data: yearlyData.balance,
                        borderColor: '#A84B2F',
                        backgroundColor: 'rgba(168, 75, 47, 0.1)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }, {
                        label: 'Principal Paid',
                        data: yearlyData.principalPaid,
                        borderColor: '#21808D',
                        backgroundColor: 'rgba(33, 128, 141, 0.1)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Year',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            },
                            grid: {
                                color: 'rgba(94, 82, 64, 0.1)'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Amount ($)',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            },
                            ticks: {
                                callback: function(value) {
                                    return Utils.formatCurrency(value);
                                }
                            },
                            grid: {
                                color: 'rgba(94, 82, 64, 0.1)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            borderColor: '#21808D',
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${Utils.formatCurrency(context.parsed.y)}`;
                                }
                            }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeInOutQuart'
                    }
                }
            };

            this.chart = new Chart(this.ctx, config);

            // Update legend values
            this.updateChartLegend(amortizationData[0]);
        }

        prepareYearlyData(amortizationData) {
            const yearlyData = {
                labels: [],
                balance: [],
                principalPaid: []
            };

            // Get data points for each year
            for (let year = 1; year <= Math.ceil(amortizationData.length / 12); year++) {
                const monthIndex = Math.min((year * 12) - 1, amortizationData.length - 1);
                const dataPoint = amortizationData[monthIndex];

                if (dataPoint) {
                    yearlyData.labels.push(`Year ${year}`);
                    yearlyData.balance.push(dataPoint.balance);
                    yearlyData.principalPaid.push(dataPoint.totalPrincipal);
                }
            }

            return yearlyData;
        }

        updateChartLegend(yearData) {
            if (!yearData) return;

            const remainingBalance = document.getElementById('remaining-balance');
            const principalPaid = document.getElementById('principal-paid');
            const interestPaid = document.getElementById('interest-paid');

            if (remainingBalance) remainingBalance.textContent = Utils.formatCurrency(yearData.balance);
            if (principalPaid) principalPaid.textContent = Utils.formatCurrency(yearData.totalPrincipal);
            if (interestPaid) interestPaid.textContent = Utils.formatCurrency(yearData.totalInterest);
        }

        updateYearSlider(amortizationData) {
            const slider = document.getElementById('year-range');
            const yearLabel = document.getElementById('year-label');
            const yearDetails = document.getElementById('year-details');

            if (!slider || !amortizationData.length) return;

            const maxYear = Math.ceil(amortizationData.length / 12);
            slider.max = maxYear;

            slider.oninput = (e) => {
                const year = parseInt(e.target.value);
                const monthIndex = Math.min((year * 12) - 1, amortizationData.length - 1);
                const dataPoint = amortizationData[monthIndex];

                if (yearLabel) yearLabel.textContent = `Year ${year}`;
                if (yearDetails) {
                    const currentYearSpan = yearDetails.querySelector('.current-year');
                    if (currentYearSpan) {
                        currentYearSpan.textContent = `Year ${year}`;
                    }
                }

                this.updateChartLegend(dataPoint);
                Utils.announceToScreenReader(`Viewing year ${year} mortgage details`);
            };
        }

        destroyChart() {
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
        }
    }

    // ========== Enhanced Tab Management ==========
    class TabManager {
        constructor() {
            this.tabButtons = document.querySelectorAll('.tab-btn');
            this.tabContents = document.querySelectorAll('.tab-content');

            this.init();
        }

        init() {
            this.tabButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.switchTab(e.target.dataset.tab || e.currentTarget.dataset.tab);
                });
            });

            // Set default active tab (payment-breakup)
            this.switchTab('payment-breakup');
        }

        switchTab(tabName) {
            // Update buttons
            this.tabButtons.forEach(btn => {
                const isActive = btn.dataset.tab === tabName;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-selected', isActive.toString());
            });

            // Update content panels
            this.tabContents.forEach(content => {
                const isActive = content.id === tabName;
                content.classList.toggle('active', isActive);
                content.style.display = isActive ? 'block' : 'none';
            });

            // If switching to chart tab and we have data, update chart
            if (tabName === 'mortgage-overtime' && state.amortizationData.length) {
                setTimeout(() => {
                    const resultsManager = new ResultsManager();
                    resultsManager.updateChart(state.amortizationData);
                }, 100);
            }

            Utils.announceToScreenReader(`Switched to ${tabName.replace('-', ' ')} tab`);
        }
    }

    // ========== Enhanced Theme Manager ==========
    class ThemeManager {
        constructor() {
            this.body = document.body;
            this.themeToggle = document.getElementById('theme-toggle');
            this.themeIcon = document.getElementById('theme-icon');
            this.fontSizeControls = {
                smaller: document.getElementById('font-smaller'),
                larger: document.getElementById('font-larger')
            };

            this.init();
        }

        init() {
            // Initialize theme from localStorage or system preference
            const savedTheme = localStorage.getItem('mortgage-calc-theme');
            if (savedTheme) {
                this.setTheme(savedTheme === 'dark');
            } else {
                this.setTheme(state.darkMode);
            }

            // Setup event listeners
            if (this.themeToggle) {
                this.themeToggle.addEventListener('click', this.toggleTheme.bind(this));
            }

            if (this.fontSizeControls.smaller) {
                this.fontSizeControls.smaller.addEventListener('click', () => this.adjustFontSize(-0.1));
            }

            if (this.fontSizeControls.larger) {
                this.fontSizeControls.larger.addEventListener('click', () => this.adjustFontSize(0.1));
            }

            // Listen for system theme changes
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                    if (!localStorage.getItem('mortgage-calc-theme')) {
                        this.setTheme(e.matches);
                    }
                });
            }
        }

        toggleTheme() {
            const isDark = this.body.dataset.theme === 'dark';
            this.setTheme(!isDark);
        }

        setTheme(isDark) {
            this.body.dataset.theme = isDark ? 'dark' : 'light';
            state.darkMode = isDark;

            // Update toggle button
            if (this.themeIcon) {
                this.themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }

            if (this.themeToggle) {
                const span = this.themeToggle.querySelector('span');
                if (span) span.textContent = isDark ? 'Light Mode' : 'Dark Mode';
            }

            // Save preference
            localStorage.setItem('mortgage-calc-theme', isDark ? 'dark' : 'light');

            Utils.announceToScreenReader(`Switched to ${isDark ? 'dark' : 'light'} mode`);
        }

        adjustFontSize(delta) {
            state.fontScale = Math.max(0.8, Math.min(1.5, state.fontScale + delta));

            const scaleClass = `font-scale-${Math.round(state.fontScale * 100)}`;

            // Remove existing scale classes
            this.body.className = this.body.className.replace(/font-scale-\d+/g, '');

            // Add new scale class
            this.body.classList.add(scaleClass);

            // Save preference
            localStorage.setItem('mortgage-calc-font-scale', state.fontScale.toString());

            Utils.announceToScreenReader(`Font size ${delta > 0 ? 'increased' : 'decreased'}`);
        }
    }

    // ========== Enhanced Voice Control System ==========
    class VoiceController {
        constructor() {
            this.recognition = null;
            this.isListening = false;
            this.commands = this.initializeCommands();
            this.synthesis = window.speechSynthesis;
        }

        initializeCommands() {
            return {
                'calculate': () => this.triggerCalculation(),
                'reset': () => this.resetForm(),
                'set home price *': (price) => this.setInput('home-price', price),
                'set down payment *': (amount) => this.setInput('down-payment', amount),
                'set interest rate *': (rate) => this.setInput('interest-rate', rate),
                'set loan term * years': (term) => this.setLoanTerm(term),
                'show payment breakdown': () => this.switchTab('payment-breakup'),
                'show mortgage over time': () => this.switchTab('mortgage-overtime'),
                'show ai insights': () => this.switchTab('ai-insights'),
                'show schedule': () => this.switchTab('amortization'),
                'enable dark mode': () => this.toggleTheme(true),
                'enable light mode': () => this.toggleTheme(false),
                'help': () => this.speakHelp()
            };
        }

        initialize() {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                Utils.showToast('Voice control is not supported in this browser', 'warning');
                return false;
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();

            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceStatus('Listening... Say "calculate" or "help"');
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateVoiceStatus('', false);
            };

            this.recognition.onerror = (event) => {
                console.error('Voice recognition error:', event.error);
                this.updateVoiceStatus('Voice error occurred', false);
            };

            this.recognition.onresult = (event) => {
                const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
                this.processCommand(command);
            };

            return true;
        }

        toggle() {
            if (!this.recognition) {
                if (!this.initialize()) return;
            }

            if (this.isListening) {
                this.stop();
            } else {
                this.start();
            }
        }

        start() {
            try {
                this.recognition.start();
                state.voiceEnabled = true;
                Utils.announceToScreenReader('Voice control activated');
            } catch (error) {
                console.error('Failed to start voice recognition:', error);
                Utils.showToast('Failed to start voice control', 'error');
            }
        }

        stop() {
            if (this.recognition) {
                this.recognition.stop();
            }
            state.voiceEnabled = false;
            this.isListening = false;
            this.updateVoiceStatus('', false);
            Utils.announceToScreenReader('Voice control deactivated');
        }

        processCommand(command) {
            console.log('Voice command:', command);
            this.updateVoiceStatus(`Processing: "${command}"`);

            for (const [pattern, handler] of Object.entries(this.commands)) {
                if (pattern.includes('*')) {
                    const regex = new RegExp(pattern.replace('*', '(.+)'));
                    const match = command.match(regex);
                    if (match) {
                        handler(match[1]);
                        return;
                    }
                } else if (command.includes(pattern)) {
                    handler();
                    return;
                }
            }

            this.speak("Sorry, I didn't understand that command. Say 'help' for available commands.");
        }

        updateVoiceStatus(message, show = true) {
            const voiceStatus = document.getElementById('voice-status');
            const voiceText = document.getElementById('voice-text');

            if (show && message) {
                if (voiceText) voiceText.textContent = message;
                if (voiceStatus) voiceStatus.style.display = 'flex';

                setTimeout(() => {
                    if (voiceText && voiceText.textContent === message && voiceStatus) {
                        voiceStatus.style.display = 'none';
                    }
                }, 3000);
            } else if (voiceStatus) {
                voiceStatus.style.display = 'none';
            }
        }

        speak(text) {
            if (this.synthesis) {
                this.synthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                utterance.pitch = 1;
                this.synthesis.speak(utterance);
            }
        }

        // Command handlers
        triggerCalculation() {
            const calculateBtn = document.getElementById('calculate-btn');
            if (calculateBtn) {
                calculateBtn.click();
                this.speak('Calculating your mortgage payment');
            }
        }

        resetForm() {
            const resetBtn = document.getElementById('reset-form');
            if (resetBtn) {
                resetBtn.click();
                this.speak('Form has been reset');
            }
        }

        setInput(inputId, value) {
            const input = document.getElementById(inputId);
            if (input) {
                const numericValue = value.replace(/[^0-9.]/g, '');
                input.value = numericValue;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                this.speak(`Set ${inputId.replace('-', ' ')} to ${numericValue}`);
            }
        }

        setLoanTerm(term) {
            const termChips = document.querySelectorAll('.term-chip');
            const termValue = term.replace(/[^0-9]/g, '');

            termChips.forEach(chip => {
                if (chip.dataset.term === termValue) {
                    chip.click();
                    this.speak(`Set loan term to ${termValue} years`);
                }
            });
        }

        switchTab(tabName) {
            const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
            if (tabBtn) {
                tabBtn.click();
                this.speak(`Switched to ${tabName.replace('-', ' ')} tab`);
            }
        }

        toggleTheme(isDark) {
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle && ((isDark && !state.darkMode) || (!isDark && state.darkMode))) {
                themeToggle.click();
                this.speak(`Switched to ${isDark ? 'dark' : 'light'} mode`);
            }
        }

        speakHelp() {
            const helpText = `Available commands: Calculate, Reset, Set home price, Set down payment, Set interest rate, Set loan term, Show payment breakdown, Show mortgage over time, Show A I insights, Show schedule, Enable dark mode, Enable light mode.`;
            this.speak(helpText);
        }
    }

    // ========== Enhanced Universal Actions Manager ==========
    class UniversalActionsManager {
        constructor() {
            this.setupEventListeners();
        }

        setupEventListeners() {
            // Share button
            const shareBtn = document.getElementById('share-btn');
            if (shareBtn) {
                shareBtn.addEventListener('click', this.shareResults.bind(this));
            }

            // PDF export button
            const pdfBtn = document.getElementById('pdf-download-btn');
            if (pdfBtn) {
                pdfBtn.addEventListener('click', this.exportToPDF.bind(this));
            }

            // Print button
            const printBtn = document.getElementById('print-btn');
            if (printBtn) {
                printBtn.addEventListener('click', this.printResults.bind(this));
            }

            // Save calculation button
            const saveBtn = document.getElementById('save-calculation');
            if (saveBtn) {
                saveBtn.addEventListener('click', this.saveCalculation.bind(this));
            }
        }

        async shareResults() {
            const calculations = state.calculations;
            if (!calculations.totalMonthly) {
                Utils.showToast('Please calculate a mortgage first', 'warning');
                return;
            }

            const formData = window.mortgageCalculator.formManager.getFormData();

            const shareText = `🏠 My Mortgage Calculation - FinGuid Calculator

📊 Monthly Payment: ${Utils.formatCurrency(calculations.totalMonthly)}
🏡 Home Price: ${Utils.formatCurrency(formData.homePrice)}
💰 Down Payment: ${Utils.formatCurrency(formData.downPayment)}
📈 Interest Rate: ${formData.interestRate}%
📅 Loan Term: ${formData.loanTerm} years

💡 Loan Amount: ${Utils.formatCurrency(calculations.loanAmount)}
🔢 Total Interest: ${Utils.formatCurrency(calculations.totalInterest)}
💯 Total Cost: ${Utils.formatCurrency(calculations.totalCost)}
🗓️ Payoff Date: ${Utils.formatDate(calculations.payoffDate)}

${formData.extraPayment > 0 ? `⚡ Extra ${state.extraPaymentFrequency} Payment: ${Utils.formatCurrency(formData.extraPayment)}` : ''}

Calculated with FinGuid's AI-Enhanced Mortgage Calculator 🤖
🔗 https://finguid.com/mortgage-calculator`;

            const shareData = {
                title: 'My Mortgage Calculation - FinGuid AI Calculator',
                text: shareText,
                url: 'https://finguid.com/mortgage-calculator'
            };

            try {
                if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                    Utils.showToast('Results shared successfully!', 'success');
                } else {
                    // Fallback: copy to clipboard
                    await navigator.clipboard.writeText(shareText);
                    Utils.showToast('Results copied to clipboard!', 'success');
                }
            } catch (error) {
                console.error('Share failed:', error);
                Utils.showToast('Failed to share results', 'error');
            }
        }

        exportToPDF() {
            const calculations = state.calculations;
            if (!calculations.totalMonthly) {
                Utils.showToast('Please calculate a mortgage first', 'warning');
                return;
            }

            Utils.showToast('PDF export feature coming soon! Use Print for now.', 'info');
            // TODO: Implement comprehensive PDF export with charts and branding
        }

        printResults() {
            // Prepare print-friendly content
            const printContent = this.generatePrintContent();

            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();

            Utils.showToast('Print dialog opened', 'info');
        }

        generatePrintContent() {
            const calculations = state.calculations;
            const formData = window.mortgageCalculator.formManager.getFormData();

            return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Mortgage Calculation Report - FinGuid</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #21808D; padding-bottom: 20px; }
                    .logo { color: #21808D; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                    .section { margin: 20px 0; page-break-inside: avoid; }
                    .section h2 { color: #21808D; border-bottom: 2px solid #21808D; padding-bottom: 5px; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
                    .highlight { background: #f0f8ff; padding: 15px; border-left: 4px solid #21808D; margin: 15px 0; }
                    .payment-amount { font-size: 32px; font-weight: bold; color: #21808D; text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
                    th { background: #21808D; color: white; }
                    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">🏠 FinGuid - AI Mortgage Calculator</div>
                    <p>Comprehensive Mortgage Analysis Report</p>
                    <p>Generated on ${new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</p>
                </div>

                <div class="section">
                    <h2>📊 Monthly Payment Summary</h2>
                    <div class="highlight">
                        <div class="payment-amount">${Utils.formatCurrency(calculations.totalMonthly)}</div>
                        <p style="text-align: center; margin: 10px 0;">Total Monthly Payment</p>
                    </div>
                </div>

                <div class="section">
                    <h2>🏡 Loan Details</h2>
                    <div class="grid">
                        <div>
                            <strong>Home Price:</strong> ${Utils.formatCurrency(formData.homePrice)}<br>
                            <strong>Down Payment:</strong> ${Utils.formatCurrency(formData.downPayment)}<br>
                            <strong>Loan Amount:</strong> ${Utils.formatCurrency(calculations.loanAmount)}<br>
                            <strong>Interest Rate:</strong> ${formData.interestRate}%
                        </div>
                        <div>
                            <strong>Loan Term:</strong> ${formData.loanTerm} years<br>
                            <strong>Total Interest:</strong> ${Utils.formatCurrency(calculations.totalInterest)}<br>
                            <strong>Total Cost:</strong> ${Utils.formatCurrency(calculations.totalCost)}<br>
                            <strong>Payoff Date:</strong> ${Utils.formatDate(calculations.payoffDate)}
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>💰 Payment Breakdown</h2>
                    <table>
                        <tr><th>Component</th><th>Monthly Amount</th><th>Percentage</th></tr>
                        <tr><td>Principal & Interest</td><td>${Utils.formatCurrency(calculations.monthlyPI)}</td><td>${((calculations.monthlyPI / calculations.totalMonthly) * 100).toFixed(1)}%</td></tr>
                        <tr><td>Property Tax</td><td>${Utils.formatCurrency(calculations.monthlyTax)}</td><td>${((calculations.monthlyTax / calculations.totalMonthly) * 100).toFixed(1)}%</td></tr>
                        <tr><td>Home Insurance</td><td>${Utils.formatCurrency(calculations.monthlyInsurance)}</td><td>${((calculations.monthlyInsurance / calculations.totalMonthly) * 100).toFixed(1)}%</td></tr>
                        <tr><td>PMI</td><td>${Utils.formatCurrency(calculations.monthlyPMI)}</td><td>${((calculations.monthlyPMI / calculations.totalMonthly) * 100).toFixed(1)}%</td></tr>
                        <tr style="font-weight: bold; background: #f5f5f5;"><td>Total Monthly Payment</td><td>${Utils.formatCurrency(calculations.totalMonthly)}</td><td>100%</td></tr>
                    </table>
                </div>

                ${formData.extraPayment > 0 ? `
                <div class="section">
                    <h2>⚡ Extra Payment Strategy</h2>
                    <div class="highlight">
                        <p><strong>Extra ${state.extraPaymentFrequency} Payment:</strong> ${Utils.formatCurrency(formData.extraPayment)}</p>
                        <p>This extra payment strategy can help you save significantly on interest and pay off your mortgage faster.</p>
                    </div>
                </div>
                ` : ''}

                <div class="footer">
                    <p>This calculation is provided by FinGuid AI-Enhanced Mortgage Calculator</p>
                    <p>Visit https://finguid.com for more financial tools and resources</p>
                    <p><em>Disclaimer: This is an estimate for planning purposes. Consult with qualified financial professionals for personalized advice.</em></p>
                </div>
            </body>
            </html>
            `;
        }

        saveCalculation() {
            const calculations = state.calculations;
            if (!calculations.totalMonthly) {
                Utils.showToast('Please calculate a mortgage first', 'warning');
                return;
            }

            const formData = window.mortgageCalculator.formManager.getFormData();
            const savedCalc = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                formData: formData,
                calculations: calculations,
                name: `Mortgage - ${Utils.formatCurrency(calculations.totalMonthly)}/month`,
                extraPaymentFrequency: state.extraPaymentFrequency
            };

            state.savedCalculations.push(savedCalc);

            // Save to localStorage
            try {
                localStorage.setItem('mortgage-calc-saved', JSON.stringify(state.savedCalculations));
                Utils.showToast('Calculation saved successfully!', 'success');
            } catch (error) {
                console.error('Failed to save calculation:', error);
                Utils.showToast('Failed to save calculation', 'error');
            }
        }
    }

    // ========== Main Calculator Controller ==========
    class MortgageCalculator {
        constructor() {
            this.formManager = new FormManager();
            this.resultsManager = new ResultsManager();
            this.voiceController = new VoiceController();
            this.themeManager = new ThemeManager();
            this.tabManager = new TabManager();
            this.universalActions = new UniversalActionsManager();

            this.init();
        }

        init() {
            this.setupEventListeners();
            this.setupScrollBehavior();
            this.performInitialCalculation();

            Utils.showToast('World's #1 AI Mortgage Calculator loaded!', 'success');
        }

        setupEventListeners() {
            // Calculation trigger
            document.addEventListener('calculate', this.calculate.bind(this));

            // Main calculate button
            const calculateBtn = document.getElementById('calculate-btn');
            if (calculateBtn) {
                calculateBtn.addEventListener('click', this.calculate.bind(this));
            }

            // Reset button
            const resetBtn = document.getElementById('reset-form');
            if (resetBtn) {
                resetBtn.addEventListener('click', this.resetForm.bind(this));
            }

            // Voice control toggle
            const voiceToggle = document.getElementById('voice-toggle');
            if (voiceToggle) {
                voiceToggle.addEventListener('click', () => {
                    this.voiceController.toggle();
                });
            }

            // Screen reader toggle
            const screenReaderToggle = document.getElementById('screen-reader-toggle');
            if (screenReaderToggle) {
                screenReaderToggle.addEventListener('click', this.toggleScreenReaderMode.bind(this));
            }

            // Hero demo button
            const voiceDemo = document.getElementById('voice-demo');
            if (voiceDemo) {
                voiceDemo.addEventListener('click', () => {
                    this.voiceController.toggle();
                    setTimeout(() => {
                        this.voiceController.speak("Voice control is now active. You can say commands like 'calculate', 'set home price 500000', or 'show payment breakdown'.");
                    }, 500);
                });
            }
        }

        setupScrollBehavior() {
            // Smooth scroll to calculator
            const scrollToCalcBtn = document.getElementById('scroll-to-calculator');
            if (scrollToCalcBtn) {
                scrollToCalcBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const mainContent = document.getElementById('main-content');
                    if (mainContent) {
                        mainContent.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            }
        }

        calculate() {
            // Show loading state
            this.showLoadingState();

            // Validate form
            const errors = this.formManager.validateForm();
            if (errors.length > 0) {
                this.hideLoadingState();
                errors.forEach(error => Utils.showToast(error, 'error'));
                return;
            }

            const formData = this.formManager.getFormData();

            // Perform calculations
            setTimeout(() => {
                try {
                    // Calculate PMI first
                    const loanAmount = formData.homePrice - formData.downPayment;
                    const pmiData = MortgageEngine.calculatePMI(loanAmount, formData.homePrice, formData.downPayment);

                    // Calculate full breakdown
                    const calculations = MortgageEngine.calculateBreakdown(
                        formData.homePrice,
                        formData.downPayment,
                        formData.interestRate,
                        formData.loanTerm,
                        formData.propertyTax,
                        formData.homeInsurance,
                        pmiData,
                        formData.extraPayment
                    );

                    // Generate amortization schedule
                    const amortizationData = MortgageEngine.generateAmortizationSchedule(
                        calculations.loanAmount,
                        formData.interestRate,
                        formData.loanTerm,
                        formData.extraPayment,
                        formData.extraOnetime,
                        formData.frequency
                    );

                    // Update state
                    state.updateCalculations(calculations);
                    state.amortizationData = amortizationData;

                    // Update UI
                    this.resultsManager.updateResults(calculations);
                    this.resultsManager.updateChart(amortizationData);
                    this.resultsManager.updateAIInsights(calculations, formData.extraPayment, formData.frequency);
                    this.resultsManager.updateAmortizationTable(amortizationData);

                    // Update extra payment preview
                    this.formManager.updateExtraPaymentPreview();

                    this.hideLoadingState();

                    Utils.showToast('Calculation completed successfully!', 'success');

                } catch (error) {
                    console.error('Calculation error:', error);
                    this.hideLoadingState();
                    Utils.showToast('An error occurred during calculation. Please try again.', 'error');
                }
            }, 300);
        }

        showLoadingState() {
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'grid';
            }
        }

        hideLoadingState() {
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }

        resetForm() {
            this.formManager.reset();

            // Clear results
            state.calculations = {};
            state.amortizationData = [];

            // Reset chart
            this.resultsManager.chartManager.destroyChart();

            // Clear AI insights
            if (this.resultsManager.elements.aiInsightsList) {
                this.resultsManager.elements.aiInsightsList.innerHTML = '<p>Enter your mortgage details to see personalized AI insights.</p>';
            }

            // Clear amortization table
            const tableBody = document.getElementById('amortization-table-body');
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-calculator"></i> Click "Calculate Payment" to view detailed payment schedule</td></tr>';
            }

            // Switch back to default tab
            this.tabManager.switchTab('payment-breakup');
        }

        performInitialCalculation() {
            // Perform calculation with default values
            setTimeout(() => {
                this.calculate();
            }, 500);
        }

        toggleScreenReaderMode() {
            state.screenReaderMode = !state.screenReaderMode;

            const toggle = document.getElementById('screen-reader-toggle');
            if (toggle) {
                toggle.classList.toggle('active', state.screenReaderMode);
            }

            if (state.screenReaderMode) {
                document.body.classList.add('screen-reader-mode');
                Utils.announceToScreenReader('Screen reader mode activated. Enhanced accessibility features enabled.');
                Utils.showToast('Screen reader mode enabled', 'info');
            } else {
                document.body.classList.remove('screen-reader-mode');
                Utils.announceToScreenReader('Screen reader mode deactivated.');
                Utils.showToast('Screen reader mode disabled', 'info');
            }
        }
    }

    // ========== Initialize Application ==========
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }

    function initializeApp() {
        // Initialize the main calculator application
        window.mortgageCalculator = new MortgageCalculator();

        // Add global error handling
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            Utils.showToast('An unexpected error occurred. Please refresh the page.', 'error');
        });

        // Add unhandled promise rejection handling
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            event.preventDefault();
        });

        // Performance monitoring
        if ('performance' in window) {
            window.addEventListener('load', () => {
                const loadTime = Math.round(performance.now());
                console.log(`Mortgage Calculator loaded in ${loadTime}ms`);

                if (loadTime > 3000) {
                    console.warn('Slow load time detected. Consider optimizing.');
                }
            });
        }

        console.log('🏡 FinGuid Mortgage Calculator v4.0 - Production Ready');
        console.log('✨ AI-Enhanced • 🎤 Voice Control • 📊 Real-Time PMI • 🏷️ Four Tabs');
    }

    // Expose utilities for debugging in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.calculatorDebug = {
            state,
            Utils,
            MortgageEngine,
            AIInsights
        };
    }

})();
