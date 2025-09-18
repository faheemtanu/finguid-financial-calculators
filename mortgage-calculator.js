/**
 * FinGuid Mortgage Calculator - Enhanced Version 4.0.0
 * Production-ready mortgage calculator with all requested improvements
 * 
 * Key Features:
 * - Smaller loan type cards
 * - No breadcrumb navigation
 * - Ordered loan terms (10, 15, 20, 30) with manual entry
 * - Right-side navigation
 * - State-based property tax auto-calculation
 * - Expandable/reducible amortization schedule
 * - Monthly/yearly amortization views
 * - Voice commands without "Listening..." text
 * - AI-powered insights
 * - Real-time calculations
 * - Comprehensive error handling
 */

'use strict';

// Global application state
const MortgageCalculator = {
    version: '4.0.0',
    initialized: false,
    state: {
        currentCalculation: null,
        chartInstance: null,
        amortizationData: [],
        voiceRecognition: null,
        currentLoanType: 'conventional',
        validationErrors: new Map(),
        isAmortizationExpanded: false,
        currentAmortizationView: 'monthly',
        currentPage: 1,
        pageSize: 12
    },
    config: {
        debounceDelay: 300,
        animationDuration: 250,
        chartColors: {
            principal: '#21808d',
            tax: '#f59e0b',
            insurance: '#10b981',
            pmi: '#ef4444',
            hoa: '#8b5cf6'
        }
    }
};

// State property tax rates for all 50 US states
const STATE_TAX_RATES = {
    'AL': { rate: 0.0041, name: 'Alabama', avgTax: 1649 },
    'AK': { rate: 0.0119, name: 'Alaska', avgTax: 3117 },
    'AZ': { rate: 0.0062, name: 'Arizona', avgTax: 1648 },
    'AR': { rate: 0.0061, name: 'Arkansas', avgTax: 857 },
    'CA': { rate: 0.0075, name: 'California', avgTax: 4456 },
    'CO': { rate: 0.0051, name: 'Colorado', avgTax: 2204 },
    'CT': { rate: 0.0214, name: 'Connecticut', avgTax: 6044 },
    'DE': { rate: 0.0057, name: 'Delaware', avgTax: 1673 },
    'FL': { rate: 0.0083, name: 'Florida', avgTax: 2338 },
    'GA': { rate: 0.0089, name: 'Georgia', avgTax: 1773 },
    'HI': { rate: 0.0028, name: 'Hawaii', avgTax: 1971 },
    'ID': { rate: 0.0069, name: 'Idaho', avgTax: 1791 },
    'IL': { rate: 0.0227, name: 'Illinois', avgTax: 4738 },
    'IN': { rate: 0.0085, name: 'Indiana', avgTax: 1263 },
    'IA': { rate: 0.0157, name: 'Iowa', avgTax: 2540 },
    'KS': { rate: 0.0141, name: 'Kansas', avgTax: 2084 },
    'KY': { rate: 0.0086, name: 'Kentucky', avgTax: 1257 },
    'LA': { rate: 0.0055, name: 'Louisiana', avgTax: 1076 },
    'ME': { rate: 0.0128, name: 'Maine', avgTax: 2792 },
    'MD': { rate: 0.0109, name: 'Maryland', avgTax: 3684 },
    'MA': { rate: 0.0117, name: 'Massachusetts', avgTax: 5570 },
    'MI': { rate: 0.0154, name: 'Michigan', avgTax: 2185 },
    'MN': { rate: 0.0112, name: 'Minnesota', avgTax: 2982 },
    'MS': { rate: 0.0081, name: 'Mississippi', avgTax: 1062 },
    'MO': { rate: 0.0097, name: 'Missouri', avgTax: 1569 },
    'MT': { rate: 0.0084, name: 'Montana', avgTax: 2539 },
    'NE': { rate: 0.0173, name: 'Nebraska', avgTax: 2907 },
    'NV': { rate: 0.0053, name: 'Nevada', avgTax: 1695 },
    'NH': { rate: 0.0209, name: 'New Hampshire', avgTax: 6296 },
    'NJ': { rate: 0.0249, name: 'New Jersey', avgTax: 9112 },
    'NM': { rate: 0.0080, name: 'New Mexico', avgTax: 1413 },
    'NY': { rate: 0.0169, name: 'New York', avgTax: 5844 },
    'NC': { rate: 0.0084, name: 'North Carolina', avgTax: 1749 },
    'ND': { rate: 0.0142, name: 'North Dakota', avgTax: 2675 },
    'OH': { rate: 0.0162, name: 'Ohio', avgTax: 2323 },
    'OK': { rate: 0.0090, name: 'Oklahoma', avgTax: 1436 },
    'OR': { rate: 0.0093, name: 'Oregon', avgTax: 3507 },
    'PA': { rate: 0.0158, name: 'Pennsylvania', avgTax: 3239 },
    'RI': { rate: 0.0153, name: 'Rhode Island', avgTax: 4706 },
    'SC': { rate: 0.0057, name: 'South Carolina', avgTax: 1116 },
    'SD': { rate: 0.0132, name: 'South Dakota', avgTax: 2540 },
    'TN': { rate: 0.0064, name: 'Tennessee', avgTax: 1220 },
    'TX': { rate: 0.0180, name: 'Texas', avgTax: 4153 },
    'UT': { rate: 0.0066, name: 'Utah', avgTax: 2340 },
    'VT': { rate: 0.0190, name: 'Vermont', avgTax: 4873 },
    'VA': { rate: 0.0082, name: 'Virginia', avgTax: 2839 },
    'WA': { rate: 0.0094, name: 'Washington', avgTax: 3668 },
    'WV': { rate: 0.0059, name: 'West Virginia', avgTax: 764 },
    'WI': { rate: 0.0185, name: 'Wisconsin', avgTax: 3595 },
    'WY': { rate: 0.0062, name: 'Wyoming', avgTax: 1723 }
};

// Utility functions
const Utils = {
    // DOM manipulation
    $(selector) {
        return document.querySelector(selector);
    },

    $$(selector) {
        return Array.from(document.querySelectorAll(selector));
    },

    // Formatting functions
    formatCurrency(amount, decimals = 0) {
        if (isNaN(amount)) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(amount);
    },

    formatNumber(num, decimals = 0) {
        if (isNaN(num)) return '0';
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    },

    formatPercentage(num, decimals = 2) {
        if (isNaN(num)) return '0%';
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num / 100);
    },

    // Validation functions
    isValidNumber(value, min = null, max = null) {
        const num = parseFloat(value);
        if (isNaN(num)) return false;
        if (min !== null && num < min) return false;
        if (max !== null && num > max) return false;
        return true;
    },

    // Performance utilities
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

    // Date utilities
    addMonths(date, months) {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    },

    formatDate(date, format = 'MMM YYYY') {
        const options = format === 'MMM YYYY' 
            ? { year: 'numeric', month: 'short' }
            : { year: 'numeric', month: 'numeric', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
};

// Mortgage calculation engine
const MortgageEngine = {
    calculateMonthlyPayment(principal, annualRate, termYears) {
        if (annualRate === 0) {
            return principal / (termYears * 12);
        }
        const monthlyRate = annualRate / 12;
        const numPayments = termYears * 12;
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
               (Math.pow(1 + monthlyRate, numPayments) - 1);
    },

    calculatePMI(loanAmount, downPaymentPercent, loanType) {
        if (loanType === 'va') return 0;
        if (downPaymentPercent >= 20) return 0;

        let pmiRate = 0.008; // Default 0.8%

        if (loanType === 'fha') {
            pmiRate = downPaymentPercent < 10 ? 0.0085 : 0.008;
        } else if (loanType === 'usda') {
            pmiRate = 0.0035;
        }

        return (loanAmount * pmiRate) / 12;
    },

    calculateLoanDetails(inputs) {
        const {
            homePrice, downPaymentAmount, interestRate, loanTerm,
            loanType, propertyTax, homeInsurance, hoaFees,
            extraMonthly, extraYearly
        } = inputs;

        // Calculate loan amount
        const loanAmount = homePrice - downPaymentAmount;
        const downPaymentPercent = (downPaymentAmount / homePrice) * 100;

        // Monthly principal and interest
        const monthlyPI = this.calculateMonthlyPayment(
            loanAmount, 
            interestRate / 100, 
            loanTerm
        );

        // Calculate PMI
        const monthlyPMI = this.calculatePMI(
            loanAmount, 
            downPaymentPercent, 
            loanType
        );

        // Other monthly costs
        const monthlyTax = propertyTax / 12;
        const monthlyInsurance = homeInsurance / 12;
        const monthlyHOA = hoaFees || 0;

        // Total monthly payment
        const totalMonthly = monthlyPI + monthlyPMI + monthlyTax + 
                           monthlyInsurance + monthlyHOA;

        // Calculate totals
        const totalPayments = monthlyPI * (loanTerm * 12);
        const totalInterest = totalPayments - loanAmount;
        const totalCost = homePrice + totalInterest;

        return {
            loanAmount,
            downPaymentAmount,
            downPaymentPercent,
            monthlyPI,
            monthlyPMI,
            monthlyTax,
            monthlyInsurance,
            monthlyHOA,
            totalMonthly,
            totalInterest,
            totalCost,
            loanType,
            inputs
        };
    },

    generateAmortizationSchedule(inputs, results) {
        const { loanAmount, monthlyPI, extraMonthly = 0, extraYearly = 0 } = 
              { ...inputs, ...results };
        const annualRate = inputs.interestRate / 100;
        const monthlyRate = annualRate / 12;
        const startDate = new Date(inputs.startDate || new Date());

        const schedule = [];
        let balance = loanAmount;
        let paymentNumber = 1;
        let currentDate = new Date(startDate);
        let totalInterest = 0;

        while (balance > 0.01 && paymentNumber <= (inputs.loanTerm * 12)) {
            const interestPayment = balance * monthlyRate;
            let principalPayment = monthlyPI - interestPayment + extraMonthly;

            // Add yearly extra payment
            if (extraYearly > 0 && paymentNumber % 12 === 0) {
                principalPayment += extraYearly;
            }

            // Don't overpay
            if (principalPayment > balance) {
                principalPayment = balance;
            }

            balance -= principalPayment;
            totalInterest += interestPayment;

            const equity = inputs.homePrice - balance;

            schedule.push({
                paymentNumber,
                date: new Date(currentDate),
                payment: interestPayment + principalPayment,
                principal: principalPayment,
                interest: interestPayment,
                balance: Math.max(0, balance),
                equity,
                cumulativeInterest: totalInterest
            });

            paymentNumber++;
            currentDate = Utils.addMonths(currentDate, 1);
        }

        return schedule;
    }
};

// AI Insights engine
const AIInsights = {
    generateInsights(inputs, results) {
        const insights = [];

        try {
            // Down payment insights
            if (results.downPaymentPercent < 20) {
                const additionalDown = (inputs.homePrice * 0.2) - results.downPaymentAmount;
                insights.push({
                    type: 'warning',
                    icon: 'fas fa-exclamation-triangle',
                    title: 'PMI Elimination Opportunity',
                    message: `Increasing your down payment by ${Utils.formatCurrency(additionalDown)} to reach 20% would eliminate PMI, saving you ${Utils.formatCurrency(results.monthlyPMI)} monthly.`,
                    action: 'Increase Down Payment'
                });
            }

            // Interest rate insights
            if (inputs.interestRate > 7.5) {
                insights.push({
                    type: 'tip',
                    icon: 'fas fa-chart-line',
                    title: 'Rate Shopping Opportunity',
                    message: `Your rate of ${inputs.interestRate}% is above market average. Shopping for a rate just 0.5% lower could save significant money over the loan term.`,
                    action: 'Compare Rates'
                });
            }

            // Affordability insights
            const monthlyIncome = results.totalMonthly / 0.28;
            insights.push({
                type: 'info',
                icon: 'fas fa-calculator',
                title: 'Income Recommendation',
                message: `For comfortable affordability (28% housing ratio), your gross monthly income should be at least ${Utils.formatCurrency(monthlyIncome, 0)} (${Utils.formatCurrency(monthlyIncome * 12, 0)} annually).`,
                action: 'Check Affordability'
            });

            // Emergency fund insight
            const emergencyFund = results.totalMonthly * 6;
            insights.push({
                type: 'info',
                icon: 'fas fa-shield-alt',
                title: 'Emergency Fund Recommendation',
                message: `Maintain an emergency fund of at least ${Utils.formatCurrency(emergencyFund, 0)} (6 months of housing payments) before purchasing.`,
                action: 'Calculate Emergency Fund'
            });

            return insights;
        } catch (error) {
            console.error('AI insights generation error:', error);
            return [{
                type: 'info',
                icon: 'fas fa-lightbulb',
                title: 'General Recommendation',
                message: 'Consider comparing rates from multiple lenders to ensure you get the best deal.',
                action: 'Get Rate Quotes'
            }];
        }
    }
};

// Chart visualization
const ChartManager = {
    chart: null,

    createPaymentChart(results) {
        const ctx = Utils.$('#payment-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

        const data = {
            labels: ['Principal & Interest', 'Property Tax', 'Home Insurance'],
            datasets: [{
                data: [
                    results.monthlyPI,
                    results.monthlyTax,
                    results.monthlyInsurance
                ],
                backgroundColor: [
                    MortgageCalculator.config.chartColors.principal,
                    MortgageCalculator.config.chartColors.tax,
                    MortgageCalculator.config.chartColors.insurance
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };

        // Add PMI if applicable
        if (results.monthlyPMI > 0) {
            data.labels.push('PMI');
            data.datasets[0].data.push(results.monthlyPMI);
            data.datasets[0].backgroundColor.push(MortgageCalculator.config.chartColors.pmi);
        }

        // Add HOA if applicable
        if (results.monthlyHOA > 0) {
            data.labels.push('HOA Fees');
            data.datasets[0].data.push(results.monthlyHOA);
            data.datasets[0].backgroundColor.push(MortgageCalculator.config.chartColors.hoa);
        }

        const chartType = Utils.$('.chart-toggle.active')?.dataset.chart || 'pie';

        const config = {
            type: chartType,
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = Utils.formatCurrency(context.parsed);
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };

        try {
            this.chart = new Chart(ctx, config);
            this.updateLegend(data);
        } catch (error) {
            console.error('Chart creation error:', error);
        }
    },

    updateLegend(data) {
        const legendContainer = Utils.$('#chart-legend');
        if (!legendContainer) return;

        const total = data.datasets[0].data.reduce((a, b) => a + b, 0);

        legendContainer.innerHTML = data.labels.map((label, index) => {
            const value = data.datasets[0].data[index];
            const percentage = ((value / total) * 100).toFixed(1);
            const color = data.datasets[0].backgroundColor[index];

            return `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${color}"></div>
                    <span>${label}: ${Utils.formatCurrency(value)} (${percentage}%)</span>
                </div>
            `;
        }).join('');
    }
};

// Voice recognition manager - NO "LISTENING..." TEXT DISPLAY
const VoiceManager = {
    recognition: null,
    activeField: null,

    init() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            // Hide voice buttons if not supported
            Utils.$$('.voice-btn').forEach(btn => btn.style.display = 'none');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const result = event.results[0][0].transcript;
            this.processVoiceInput(result);
            this.hideVoiceStatus();
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.hideVoiceStatus();
            ToastManager.show('Voice input failed. Please try again.', 'error');
        };

        this.recognition.onend = () => {
            this.hideVoiceStatus();
        };

        // Bind voice buttons
        Utils.$$('.voice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const fieldId = btn.dataset.field;
                this.startListening(fieldId);
            });
        });

        // Voice status close button
        const voiceClose = Utils.$('#voice-close');
        if (voiceClose) {
            voiceClose.addEventListener('click', () => {
                this.stopListening();
            });
        }
    },

    startListening(fieldId) {
        if (!this.recognition) return;

        this.activeField = fieldId;
        this.showVoiceStatus();

        try {
            this.recognition.start();
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            this.hideVoiceStatus();
        }
    },

    stopListening() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.hideVoiceStatus();
    },

    showVoiceStatus() {
        const voiceStatus = Utils.$('#voice-status');
        if (voiceStatus) {
            voiceStatus.classList.remove('hidden');
        }
    },

    hideVoiceStatus() {
        const voiceStatus = Utils.$('#voice-status');
        if (voiceStatus) {
            voiceStatus.classList.add('hidden');
        }
    },

    processVoiceInput(transcript) {
        if (!this.activeField) return;

        const field = Utils.$(`#${this.activeField}`);
        if (!field) return;

        // Process the transcript based on field type
        let value = this.parseVoiceInput(transcript, this.activeField);

        if (value !== null) {
            field.value = value;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            ToastManager.show(`Set ${this.activeField.replace('-', ' ')} to ${value}`, 'success');
        } else {
            ToastManager.show(`Couldn't understand "${transcript}". Please try again.`, 'warning');
        }
    },

    parseVoiceInput(transcript, fieldId) {
        const text = transcript.toLowerCase().trim();

        // Remove common words and extract numbers
        const cleanText = text.replace(/dollars?|thousand|k|percent|%/g, '');
        const numbers = cleanText.match(/\d+(\.\d+)?/g);

        if (!numbers || numbers.length === 0) return null;

        let value = parseFloat(numbers[0]);

        // Handle thousands
        if (text.includes('thousand') || text.includes('k')) {
            value *= 1000;
        }

        // Handle field-specific processing
        if (fieldId === 'home-price' && value < 10000) {
            value *= 1000; // Assume thousands for home prices
        }

        return value;
    }
};

// Toast notification manager
const ToastManager = {
    show(message, type = 'info', duration = 3000) {
        const container = Utils.$('#toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-message">${message}</div>
            <button type="button" class="toast-close" aria-label="Close notification">
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
        `;

        container.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto-hide
        const timeoutId = setTimeout(() => this.hide(toast), duration);

        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                clearTimeout(timeoutId);
                this.hide(toast);
            });
        }
    },

    hide(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
};

// Form validation module
const FormValidator = {
    validateField(fieldId, value) {
        const validationRules = {
            'home-price': { min: 50000, max: 10000000, required: true },
            'interest-rate': { min: 0.1, max: 20, required: true },
            'loan-term': { min: 1, max: 50, required: true },
            'state': { required: true }
        };

        const rules = validationRules[fieldId];
        if (!rules) return { valid: true, message: '' };

        if (rules.required && (!value || value.toString().trim() === '')) {
            return { valid: false, message: 'This field is required' };
        }

        if (rules.min !== undefined || rules.max !== undefined) {
            const num = parseFloat(value);
            if (isNaN(num)) {
                return { valid: false, message: 'Please enter a valid number' };
            }
            if (rules.min !== undefined && num < rules.min) {
                return { valid: false, message: `Value must be at least ${rules.min}` };
            }
            if (rules.max !== undefined && num > rules.max) {
                return { valid: false, message: `Value must be no more than ${rules.max}` };
            }
        }

        return { valid: true, message: '' };
    },

    showError(fieldId, message) {
        const field = Utils.$(`#${fieldId}`);
        const errorElement = Utils.$(`#${fieldId}-error`);

        if (field) {
            field.classList.add('error');
            field.setAttribute('aria-invalid', 'true');
        }

        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    },

    clearError(fieldId) {
        const field = Utils.$(`#${fieldId}`);
        const errorElement = Utils.$(`#${fieldId}-error`);

        if (field) {
            field.classList.remove('error');
            field.setAttribute('aria-invalid', 'false');
        }

        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }
};

// Main calculator class
class Calculator {
    constructor() {
        this.debounceTimer = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeForm();
        this.initializeVoice();
        VoiceManager.init();
    }

    bindEvents() {
        // Form submission
        const form = Utils.$('#calculator-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Real-time calculation
        form.addEventListener('input', Utils.debounce((e) => {
            this.calculateMortgage();
        }, MortgageCalculator.config.debounceDelay));

        // Loan type selection
        Utils.$$('input[name="loan-type"]').forEach(input => {
            input.addEventListener('change', (e) => {
                MortgageCalculator.state.currentLoanType = e.target.value;
                this.updateLoanTypeDefaults(e.target.value);
                this.calculateMortgage();
            });
        });

        // Term chips - ORDERED 10, 15, 20, 30
        Utils.$$('.term-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                e.preventDefault();
                Utils.$$('.term-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                const term = chip.dataset.term;
                const termInput = Utils.$('#loan-term');
                if (termInput) {
                    termInput.value = term;
                    this.calculateMortgage();
                }
            });
        });

        // Manual term input synchronization
        const termInput = Utils.$('#loan-term');
        if (termInput) {
            termInput.addEventListener('input', (e) => {
                const value = e.target.value;
                Utils.$$('.term-chip').forEach(chip => {
                    chip.classList.toggle('active', chip.dataset.term === value);
                });
            });
        }

        // STATE-BASED PROPERTY TAX AUTO-CALCULATION
        const stateSelect = Utils.$('#state');
        if (stateSelect) {
            stateSelect.addEventListener('change', (e) => {
                this.updatePropertyTaxFromState(e.target.value);
            });
        }

        // Down payment tabs
        Utils.$$('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = btn.dataset.tab;

                Utils.$$('.tab-btn').forEach(b => b.classList.remove('active'));
                Utils.$$('.dp-panel').forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                Utils.$(`[data-panel="${tab}"]`).classList.add('active');
            });
        });

        // Down payment synchronization
        const dpPercent = Utils.$('#down-payment-percent');
        const dpAmount = Utils.$('#down-payment-amount');
        const homePrice = Utils.$('#home-price');

        if (dpPercent && dpAmount && homePrice) {
            dpPercent.addEventListener('input', () => {
                const price = parseFloat(homePrice.value) || 0;
                const percent = parseFloat(dpPercent.value) || 0;
                dpAmount.value = Math.round(price * percent / 100);
            });

            dpAmount.addEventListener('input', () => {
                const price = parseFloat(homePrice.value) || 0;
                const amount = parseFloat(dpAmount.value) || 0;
                if (price > 0) {
                    dpPercent.value = ((amount / price) * 100).toFixed(1);
                }
            });

            homePrice.addEventListener('input', () => {
                const price = parseFloat(homePrice.value) || 0;
                const percent = parseFloat(dpPercent.value) || 0;
                dpAmount.value = Math.round(price * percent / 100);
            });
        }

        // Chart toggle
        Utils.$$('.chart-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                Utils.$$('.chart-toggle').forEach(t => t.classList.remove('active'));
                toggle.classList.add('active');

                if (MortgageCalculator.state.currentCalculation) {
                    ChartManager.createPaymentChart(MortgageCalculator.state.currentCalculation);
                }
            });
        });

        // EXPANDABLE AMORTIZATION SCHEDULE
        const expandBtn = Utils.$('#expand-schedule');
        const tableContainer = Utils.$('#table-container');

        if (expandBtn && tableContainer) {
            expandBtn.addEventListener('click', () => {
                const isExpanded = tableContainer.classList.contains('expanded');

                if (isExpanded) {
                    tableContainer.classList.remove('expanded');
                    expandBtn.innerHTML = `
                        <i class="fas fa-expand" aria-hidden="true"></i>
                        <span class="expand-text">Expand</span>
                    `;
                    MortgageCalculator.state.isAmortizationExpanded = false;
                } else {
                    tableContainer.classList.add('expanded');
                    expandBtn.innerHTML = `
                        <i class="fas fa-compress" aria-hidden="true"></i>
                        <span class="expand-text">Collapse</span>
                    `;
                    MortgageCalculator.state.isAmortizationExpanded = true;
                }
            });
        }

        // MONTHLY/YEARLY VIEW CONTROLS
        Utils.$$('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                Utils.$$('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                MortgageCalculator.state.currentAmortizationView = btn.dataset.view;
                this.updateAmortizationView();
            });
        });

        // Mobile menu toggle
        const mobileToggle = Utils.$('#mobile-menu-toggle');
        const navMenu = Utils.$('#nav-menu');

        if (mobileToggle && navMenu) {
            mobileToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                const isExpanded = navMenu.classList.contains('active');
                mobileToggle.setAttribute('aria-expanded', isExpanded);
            });
        }

        // Modal handling
        const preapprovalBtns = Utils.$$('#get-pre-approved, #cta-get-started');
        const modal = Utils.$('#preapproval-modal');
        const modalClose = Utils.$('#modal-close');
        const modalOverlay = Utils.$('.modal-overlay');

        preapprovalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.openModal());
        });

        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => this.closeModal());
        }

        // Print functionality
        const printBtn = Utils.$('#print-results');
        if (printBtn) {
            printBtn.addEventListener('click', () => window.print());
        }
    }

    initializeForm() {
        // Set default start date
        const startDateInput = Utils.$('#start-date');
        if (startDateInput) {
            const today = new Date();
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            startDateInput.value = nextMonth.toISOString().split('T')[0];
        }

        // Trigger initial calculation
        this.calculateMortgage();
    }

    initializeVoice() {
        VoiceManager.init();
    }

    handleFormSubmit(e) {
        e.preventDefault();
        this.calculateMortgage();
    }

    // STATE-BASED PROPERTY TAX AUTO-CALCULATION - KEY FEATURE
    updatePropertyTaxFromState(stateCode) {
        if (!stateCode || !STATE_TAX_RATES[stateCode]) return;

        const stateData = STATE_TAX_RATES[stateCode];
        const homePrice = parseFloat(Utils.$('#home-price').value) || 400000;
        const annualPropertyTax = Math.round(homePrice * stateData.rate);

        const propertyTaxInput = Utils.$('#property-tax');
        if (propertyTaxInput) {
            propertyTaxInput.value = annualPropertyTax;

            // Update help text
            const helpText = Utils.$('#property-tax-help');
            if (helpText) {
                helpText.textContent = `Auto-calculated for ${stateData.name}: ${(stateData.rate * 100).toFixed(2)}% rate`;
            }

            // Trigger recalculation
            this.calculateMortgage();

            ToastManager.show(`Property tax updated for ${stateData.name}: ${Utils.formatCurrency(annualPropertyTax)}`, 'success');
        }
    }

    updateLoanTypeDefaults(loanType) {
        const dpPercent = Utils.$('#down-payment-percent');
        const pmiRate = Utils.$('#pmi-rate');

        if (!dpPercent || !pmiRate) return;

        switch (loanType) {
            case 'fha':
                dpPercent.value = Math.min(parseFloat(dpPercent.value) || 20, 3.5);
                pmiRate.value = 0.85;
                break;
            case 'va':
                dpPercent.value = 0;
                pmiRate.value = 0;
                break;
            case 'usda':
                dpPercent.value = 0;
                pmiRate.value = 0.35;
                break;
            case 'conventional':
            default:
                pmiRate.value = 0.8;
                break;
        }

        // Update down payment amount
        const homePrice = parseFloat(Utils.$('#home-price').value) || 0;
        const dpAmount = Utils.$('#down-payment-amount');
        if (dpAmount) {
            dpAmount.value = Math.round(homePrice * parseFloat(dpPercent.value) / 100);
        }
    }

    calculateMortgage() {
        try {
            const inputs = this.getFormInputs();
            if (!this.validateInputs(inputs)) return;

            const results = MortgageEngine.calculateLoanDetails(inputs);
            MortgageCalculator.state.currentCalculation = results;

            this.displayResults(results);
            this.generateAIInsights(inputs, results);
            this.updateChart(results);
            this.generateAmortizationSchedule(inputs, results);

            // Show results
            const resultsPanel = Utils.$('#results-panel');
            const amortizationSection = Utils.$('#amortization-section');

            if (resultsPanel) {
                resultsPanel.style.display = 'block';
            }
            if (amortizationSection) {
                amortizationSection.style.display = 'block';
            }

        } catch (error) {
            console.error('Calculation error:', error);
            ToastManager.show('An error occurred during calculation. Please check your inputs.', 'error');
        }
    }

    getFormInputs() {
        const homePrice = parseFloat(Utils.$('#home-price').value) || 0;
        const downPaymentPercent = parseFloat(Utils.$('#down-payment-percent').value) || 0;

        return {
            homePrice,
            downPaymentAmount: Math.round(homePrice * downPaymentPercent / 100),
            interestRate: parseFloat(Utils.$('#interest-rate').value) || 0,
            loanTerm: parseFloat(Utils.$('#loan-term').value) || 0,
            loanType: MortgageCalculator.state.currentLoanType,
            state: Utils.$('#state').value,
            propertyTax: parseFloat(Utils.$('#property-tax').value) || 0,
            homeInsurance: parseFloat(Utils.$('#home-insurance').value) || 0,
            hoaFees: parseFloat(Utils.$('#hoa-fees').value) || 0,
            extraMonthly: parseFloat(Utils.$('#extra-monthly').value) || 0,
            extraYearly: parseFloat(Utils.$('#extra-yearly').value) || 0,
            startDate: Utils.$('#start-date').value
        };
    }

    validateInputs(inputs) {
        let isValid = true;

        // Clear previous errors
        MortgageCalculator.state.validationErrors.clear();

        // Validate required fields
        const validations = [
            { field: 'home-price', value: inputs.homePrice },
            { field: 'interest-rate', value: inputs.interestRate },
            { field: 'loan-term', value: inputs.loanTerm },
            { field: 'state', value: inputs.state }
        ];

        validations.forEach(({ field, value }) => {
            const validation = FormValidator.validateField(field, value);
            if (!validation.valid) {
                FormValidator.showError(field, validation.message);
                isValid = false;
            } else {
                FormValidator.clearError(field);
            }
        });

        return isValid;
    }

    displayResults(results) {
        // Update main payment display
        const totalPaymentEl = Utils.$('#total-payment');
        if (totalPaymentEl) {
            totalPaymentEl.textContent = Utils.formatCurrency(results.totalMonthly);
        }

        // Update payment breakdown
        const breakdownEl = Utils.$('#payment-breakdown');
        if (breakdownEl) {
            const breakdownItems = [
                { label: 'Principal & Interest', value: results.monthlyPI },
                { label: 'Property Tax', value: results.monthlyTax },
                { label: 'Home Insurance', value: results.monthlyInsurance }
            ];

            if (results.monthlyPMI > 0) {
                breakdownItems.push({ label: 'PMI', value: results.monthlyPMI });
            }

            if (results.monthlyHOA > 0) {
                breakdownItems.push({ label: 'HOA Fees', value: results.monthlyHOA });
            }

            breakdownEl.innerHTML = breakdownItems.map(item => `
                <div class="breakdown-item">
                    <span class="breakdown-label">${item.label}</span>
                    <span class="breakdown-value">${Utils.formatCurrency(item.value)}</span>
                </div>
            `).join('');
        }

        // Update summary stats
        const summaryStats = [
            { id: 'loan-amount', value: results.loanAmount },
            { id: 'total-interest', value: results.totalInterest },
            { id: 'total-cost', value: results.totalCost }
        ];

        summaryStats.forEach(({ id, value }) => {
            const el = Utils.$(`#${id}`);
            if (el) {
                el.textContent = Utils.formatCurrency(value);
            }
        });
    }

    generateAIInsights(inputs, results) {
        const insights = AIInsights.generateInsights(inputs, results);
        const insightsContainer = Utils.$('#insights-list');

        if (!insightsContainer) return;

        insightsContainer.innerHTML = insights.map(insight => `
            <div class="insight-item insight-${insight.type}">
                <div class="insight-icon">
                    <i class="${insight.icon}" aria-hidden="true"></i>
                </div>
                <div class="insight-content">
                    <h4 class="insight-title">${insight.title}</h4>
                    <p class="insight-message">${insight.message}</p>
                    <button type="button" class="insight-action">${insight.action}</button>
                </div>
            </div>
        `).join('');
    }

    updateChart(results) {
        ChartManager.createPaymentChart(results);
    }

    generateAmortizationSchedule(inputs, results) {
        const schedule = MortgageEngine.generateAmortizationSchedule(inputs, results);
        MortgageCalculator.state.amortizationData = schedule;
        this.updateAmortizationView();
    }

    // MONTHLY/YEARLY AMORTIZATION VIEW
    updateAmortizationView() {
        const tbody = Utils.$('#amortization-tbody');
        if (!tbody || !MortgageCalculator.state.amortizationData.length) return;

        const view = MortgageCalculator.state.currentAmortizationView;
        const data = view === 'yearly' 
            ? this.getYearlyAmortizationData() 
            : this.getMonthlyAmortizationData();

        tbody.innerHTML = data.map(row => `
            <tr>
                <td>${row.paymentNumber}</td>
                <td>${Utils.formatDate(row.date)}</td>
                <td class="currency">${Utils.formatCurrency(row.payment)}</td>
                <td class="currency">${Utils.formatCurrency(row.principal)}</td>
                <td class="currency">${Utils.formatCurrency(row.interest)}</td>
                <td class="currency">${Utils.formatCurrency(row.balance)}</td>
                <td class="currency">${Utils.formatCurrency(row.equity)}</td>
            </tr>
        `).join('');
    }

    getMonthlyAmortizationData() {
        const startIndex = (MortgageCalculator.state.currentPage - 1) * MortgageCalculator.state.pageSize;
        const endIndex = startIndex + MortgageCalculator.state.pageSize;
        return MortgageCalculator.state.amortizationData.slice(startIndex, endIndex);
    }

    getYearlyAmortizationData() {
        const yearlyData = [];
        const schedule = MortgageCalculator.state.amortizationData;

        for (let i = 11; i < schedule.length; i += 12) {
            const yearPayment = schedule[i];
            if (yearPayment) {
                yearlyData.push({
                    paymentNumber: Math.floor(i / 12) + 1,
                    date: yearPayment.date,
                    payment: schedule.slice(i - 11, i + 1).reduce((sum, p) => sum + p.payment, 0),
                    principal: schedule.slice(i - 11, i + 1).reduce((sum, p) => sum + p.principal, 0),
                    interest: schedule.slice(i - 11, i + 1).reduce((sum, p) => sum + p.interest, 0),
                    balance: yearPayment.balance,
                    equity: yearPayment.equity
                });
            }
        }

        return yearlyData;
    }

    openModal() {
        const modal = Utils.$('#preapproval-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.setAttribute('aria-hidden', 'false');

            // Focus first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    closeModal() {
        const modal = Utils.$('#preapproval-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize calculator
    const calculator = new Calculator();

    // Initialize voice manager separately
    VoiceManager.init();

    // Set global reference
    window.MortgageCalculator = MortgageCalculator;
    window.Calculator = calculator;

    console.log('🏠 FinGuid Mortgage Calculator v4.0.0 initialized successfully!');
    console.log('✅ All requested improvements implemented:');
    console.log('  - Smaller loan type cards');
    console.log('  - No breadcrumb navigation');
    console.log('  - Ordered loan terms (10, 15, 20, 30) with manual entry');
    console.log('  - Right-side navigation');
    console.log('  - State-based property tax auto-calculation');
    console.log('  - Expandable/reducible amortization schedule');
    console.log('  - Monthly/yearly amortization views');
    console.log('  - Voice commands without "Listening..." text');
    console.log('  - Footer matching home page design');
});

// Handle page visibility for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause any ongoing processes when page is hidden
        if (VoiceManager.recognition) {
            VoiceManager.stopListening();
        }
    }
});

// Handle errors globally
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    ToastManager.show('An unexpected error occurred. Please refresh the page.', 'error');
});

// Export for global access
window.Utils = Utils;
window.MortgageEngine = MortgageEngine;
window.AIInsights = AIInsights;
window.ChartManager = ChartManager;
window.VoiceManager = VoiceManager;
window.ToastManager = ToastManager;
window.FormValidator = FormValidator;
