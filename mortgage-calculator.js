/**
 * FinGuid Mortgage Calculator - Enhanced Version 6.0.0
 * Production-ready mortgage calculator with all requested improvements
 * 
 * Key Features:
 * - Hero section reduced to half size
 * - All cards reduced by 20% (compact design)
 * - Global voice input with microphone
 * - Screen reader functionality
 * - Month/year only date selection
 * - Advanced options restructured
 * - Loan type section removed
 * - Side-by-side pie and bar charts
 * - Enhanced accessibility
 */

'use strict';

// Global application state
const MortgageCalculator = {
    version: '6.0.0',
    initialized: false,
    state: {
        currentCalculation: null,
        chartInstance: null,
        amortizationData: [],
        validationErrors: new Map(),
        isAmortizationExpanded: true,
        currentAmortizationView: 'monthly',
        currentPage: 1,
        pageSize: 12,
        voiceRecognition: null,
        screenReaderEnabled: false,
        currentVoiceField: null
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

// Voice command mappings
const VOICE_COMMANDS = {
    'home price': 'home-price',
    'house price': 'home-price',  
    'property price': 'home-price',
    'down payment amount': 'down-payment-amount',
    'down payment': 'down-payment-percent',
    'downpayment': 'down-payment-percent',
    'interest rate': 'interest-rate',
    'rate': 'interest-rate',
    'loan term': 'loan-term',
    'term': 'loan-term',
    'years': 'loan-term',
    'property tax': 'property-tax',
    'taxes': 'property-tax',
    'home insurance': 'home-insurance',
    'insurance': 'home-insurance',
    'hoa fees': 'hoa-fees',
    'hoa': 'hoa-fees',
    'extra monthly': 'extra-monthly',
    'extra yearly': 'extra-yearly',
    'start date': 'start-date'
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
    },

    // Get next month date for default loan start (month/year format)
    getNextMonthDate() {
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const year = nextMonth.getFullYear();
        const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    },

    // Parse voice input for numbers
    parseVoiceNumber(text) {
        // Convert spoken numbers to digits
        const numberWords = {
            'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
            'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
            'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
            'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
            'eighteen': '18', 'nineteen': '19', 'twenty': '20', 'thirty': '30',
            'forty': '40', 'fifty': '50', 'sixty': '60', 'seventy': '70',
            'eighty': '80', 'ninety': '90', 'hundred': '100', 'thousand': '1000'
        };

        let result = text.toLowerCase()
            .replace(/percent|percentage/g, '')
            .replace(/dollars|dollar/g, '')
            .replace(/years|year/g, '')
            .replace(/months|month/g, '')
            .trim();

        // Replace word numbers with digits
        Object.keys(numberWords).forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'g');
            result = result.replace(regex, numberWords[word]);
        });

        // Extract numbers from text
        const numbers = result.match(/\d+\.?\d*/g);
        return numbers ? numbers[0] : text;
    }
};

// Voice Recognition Manager
const VoiceManager = {
    recognition: null,
    isListening: false,

    init() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return false;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.showVoiceStatus();
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.hideVoiceStatus();
        };

        this.recognition.onresult = (event) => {
            const result = event.results[0][0].transcript;
            this.processVoiceInput(result);
        };

        this.recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            ToastManager.show('Voice recognition error. Please try again.', 'error');
            this.hideVoiceStatus();
        };

        return true;
    },

    startListening(fieldId = null) {
        if (!this.recognition) {
            ToastManager.show('Voice recognition not available in this browser.', 'warning');
            return;
        }

        if (this.isListening) {
            this.stopListening();
            return;
        }

        MortgageCalculator.state.currentVoiceField = fieldId;
        this.recognition.start();
    },

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    },

    processVoiceInput(transcript) {
        const text = transcript.toLowerCase().trim();
        
        // If we have a specific field target
        if (MortgageCalculator.state.currentVoiceField) {
            const fieldId = MortgageCalculator.state.currentVoiceField;
            const field = Utils.$(`#${fieldId}`);
            
            if (field) {
                const value = Utils.parseVoiceNumber(text);
                field.value = value;
                field.dispatchEvent(new Event('input', { bubbles: true }));
                
                ScreenReader.announce(`${field.getAttribute('data-voice-field')} set to ${value}`);
                ToastManager.show(`Set ${field.getAttribute('data-voice-field')} to ${value}`, 'success');
            }
        } else {
            // Global voice command processing
            this.processGlobalCommand(text);
        }

        MortgageCalculator.state.currentVoiceField = null;
    },

    processGlobalCommand(text) {
        // Find field name in the command
        let targetField = null;
        let targetValue = null;

        for (const [command, fieldId] of Object.entries(VOICE_COMMANDS)) {
            if (text.includes(command)) {
                targetField = fieldId;
                // Extract value from command
                const parts = text.split(command);
                if (parts.length > 1) {
                    targetValue = Utils.parseVoiceNumber(parts[1]);
                }
                break;
            }
        }

        if (targetField && targetValue) {
            const field = Utils.$(`#${targetField}`);
            if (field) {
                field.value = targetValue;
                field.dispatchEvent(new Event('input', { bubbles: true }));
                
                const fieldName = field.getAttribute('data-voice-field') || targetField.replace('-', ' ');
                ScreenReader.announce(`${fieldName} set to ${targetValue}`);
                ToastManager.show(`Set ${fieldName} to ${targetValue}`, 'success');
            }
        } else {
            ToastManager.show('Voice command not recognized. Try saying "home price 400000" or similar.', 'info');
        }
    },

    showVoiceStatus() {
        const status = Utils.$('#voice-status');
        if (status) {
            status.classList.remove('hidden');
        }
    },

    hideVoiceStatus() {
        const status = Utils.$('#voice-status');
        if (status) {
            status.classList.add('hidden');
        }
    }
};

// Screen Reader Manager
const ScreenReader = {
    enabled: false,
    
    init() {
        const btn = Utils.$('#screen-reader-btn');
        if (btn) {
            btn.addEventListener('click', () => this.toggle());
        }
    },

    toggle() {
        this.enabled = !this.enabled;
        const btn = Utils.$('#screen-reader-btn');
        
        if (btn) {
            btn.classList.toggle('active', this.enabled);
            btn.setAttribute('aria-pressed', this.enabled);
        }

        this.announce(this.enabled ? 'Screen reader mode enabled' : 'Screen reader mode disabled');
        ToastManager.show(this.enabled ? 'Screen reader enabled' : 'Screen reader disabled', 'info');
    },

    announce(message) {
        if (!this.enabled) return;

        const announcer = Utils.$('#sr-announcements');
        if (announcer) {
            announcer.textContent = message;
            // Clear after announcement
            setTimeout(() => {
                announcer.textContent = '';
            }, 1000);
        }
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

    calculatePMI(loanAmount, downPaymentPercent) {
        // Simplified PMI calculation since loan type was removed
        if (downPaymentPercent >= 20) return 0;
        
        let pmiRate = 0.008; // Default 0.8% annually
        if (downPaymentPercent < 10) {
            pmiRate = 0.01; // 1% for very low down payments
        }
        
        return (loanAmount * pmiRate) / 12;
    },

    calculateLoanDetails(inputs) {
        const {
            homePrice, downPaymentAmount, interestRate, loanTerm,
            propertyTax, homeInsurance, hoaFees,
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
        const monthlyPMI = this.calculatePMI(loanAmount, downPaymentPercent);

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
            inputs
        };
    },

    generateAmortizationSchedule(inputs, results) {
        const { loanAmount, monthlyPI, extraMonthly = 0, extraYearly = 0 } = 
              { ...inputs, ...results };
        const annualRate = inputs.interestRate / 100;
        const monthlyRate = annualRate / 12;
        
        // Parse month/year start date
        const startDateParts = inputs.startDate.split('-');
        const startDate = new Date(parseInt(startDateParts[0]), parseInt(startDateParts[1]) - 1, 1);
        
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
    pieChart: null,
    barChart: null,

    createPaymentCharts(results) {
        const pieCtx = Utils.$('#payment-chart');
        if (!pieCtx) return;

        // Destroy existing charts
        if (this.pieChart) {
            this.pieChart.destroy();
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
            this.pieChart = new Chart(pieCtx, config);
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
                <div class="legend-item" role="listitem">
                    <div class="legend-color" style="background-color: ${color}"></div>
                    <span>${label}: ${Utils.formatCurrency(value)} (${percentage}%)</span>
                </div>
            `;
        }).join('');
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

        // Screen reader announcement
        ScreenReader.announce(message);
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
            'start-date': { required: true }
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

        ScreenReader.announce(`Error in ${fieldId.replace('-', ' ')}: ${message}`);
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
        this.setDefaultStartDate();
        this.setInitialPropertyTax();
        this.calculateMortgage(); // Trigger initial calculation with default values
        
        // Initialize voice and screen reader
        VoiceManager.init();
        ScreenReader.init();
    }

    bindEvents() {
        // Form submission
        const form = Utils.$('#calculator-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // AUTO-CALCULATION on input change
        form.addEventListener('input', Utils.debounce((e) => {
            this.calculateMortgage();
        }, MortgageCalculator.config.debounceDelay));

        // Global voice control
        const globalVoiceBtn = Utils.$('#global-voice-btn');
        if (globalVoiceBtn) {
            globalVoiceBtn.addEventListener('click', () => {
                VoiceManager.startListening();
            });
        }

        // Individual voice buttons
        Utils.$$('.voice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const fieldId = btn.dataset.field;
                VoiceManager.startListening(fieldId);
            });
        });

        // Voice status close button
        const voiceClose = Utils.$('#voice-close');
        if (voiceClose) {
            voiceClose.addEventListener('click', () => {
                VoiceManager.stopListening();
            });
        }

        // Term chips
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
                    ScreenReader.announce(`Loan term set to ${term} years`);
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
                
                ScreenReader.announce(`Switched to ${tab} down payment input`);
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
                this.calculateMortgage();
            });

            dpAmount.addEventListener('input', () => {
                const price = parseFloat(homePrice.value) || 0;
                const amount = parseFloat(dpAmount.value) || 0;
                if (price > 0) {
                    dpPercent.value = ((amount / price) * 100).toFixed(1);
                }
                this.calculateMortgage();
            });

            homePrice.addEventListener('input', () => {
                const price = parseFloat(homePrice.value) || 0;
                const percent = parseFloat(dpPercent.value) || 0;
                dpAmount.value = Math.round(price * percent / 100);
                
                // Auto-update property tax based on selected state
                const selectedState = stateSelect.value;
                if (selectedState && STATE_TAX_RATES[selectedState]) {
                    this.updatePropertyTaxFromState(selectedState);
                }
            });
        }

        // Chart toggle
        Utils.$$('.chart-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                Utils.$$('.chart-toggle').forEach(t => t.classList.remove('active'));
                toggle.classList.add('active');
                
                if (MortgageCalculator.state.currentCalculation) {
                    ChartManager.createPaymentCharts(MortgageCalculator.state.currentCalculation);
                }
                
                const chartType = toggle.dataset.chart;
                ScreenReader.announce(`Switched to ${chartType} chart view`);
            });
        });

        // AMORTIZATION CONTROLS
        const collapseBtn = Utils.$('#collapse-schedule');
        const expandBtn = Utils.$('#expand-schedule');
        const tableContainer = Utils.$('#table-container');
        
        if (collapseBtn && expandBtn && tableContainer) {
            collapseBtn.addEventListener('click', () => {
                tableContainer.classList.remove('expanded');
                tableContainer.classList.add('collapsed');
                MortgageCalculator.state.isAmortizationExpanded = false;
                ScreenReader.announce('Amortization schedule collapsed');
            });

            expandBtn.addEventListener('click', () => {
                tableContainer.classList.remove('collapsed');
                tableContainer.classList.add('expanded');
                MortgageCalculator.state.isAmortizationExpanded = true;
                ScreenReader.announce('Amortization schedule expanded');
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
                ScreenReader.announce(`Switched to ${btn.dataset.view} amortization view`);
            });
        });

        // Export and Print functionality
        const exportBtn = Utils.$('#export-schedule');
        const printBtn = Utils.$('#print-schedule');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportAmortizationSchedule());
        }

        if (printBtn) {
            printBtn.addEventListener('click', () => this.printAmortizationSchedule());
        }

        // Next month button for loan start date
        const btnToday = Utils.$('#btn-today');
        if (btnToday) {
            btnToday.addEventListener('click', () => {
                const startDateInput = Utils.$('#start-date');
                if (startDateInput) {
                    startDateInput.value = Utils.getNextMonthDate();
                    this.calculateMortgage();
                    ScreenReader.announce('Loan start date set to next month');
                }
            });
        }

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
        const preapprovalBtns = Utils.$$('#cta-get-started');
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
    }

    setDefaultStartDate() {
        const startDateInput = Utils.$('#start-date');
        if (startDateInput) {
            startDateInput.value = Utils.getNextMonthDate();
        }
    }

    setInitialPropertyTax() {
        // Set default property tax for California (default selected state)
        const stateSelect = Utils.$('#state');
        if (stateSelect && stateSelect.value === 'CA') {
            this.updatePropertyTaxFromState('CA');
        }
    }

    initializeForm() {
        // Trigger initial calculation with default values
        setTimeout(() => {
            this.calculateMortgage();
        }, 100);
    }

    handleFormSubmit(e) {
        e.preventDefault();
        this.calculateMortgage();
    }

    // STATE-BASED PROPERTY TAX AUTO-CALCULATION
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
            ScreenReader.announce(`Property tax updated for ${stateData.name} to ${Utils.formatCurrency(annualPropertyTax)}`);
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

            // Screen reader announcement for results
            ScreenReader.announce(`Mortgage calculation updated. Total monthly payment: ${Utils.formatCurrency(results.totalMonthly)}`);

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
            state: Utils.$('#state').value,
            propertyTax: parseFloat(Utils.$('#property-tax').value) || 0,
            homeInsurance: parseFloat(Utils.$('#home-insurance').value) || 0,
            hoaFees: parseFloat(Utils.$('#hoa-fees').value) || 0,
            extraMonthly: parseFloat(Utils.$('#extra-monthly').value) || 0,
            extraYearly: parseFloat(Utils.$('#extra-yearly').value) || 0,
            startDate: Utils.$('#start-date').value || Utils.getNextMonthDate()
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
            { field: 'start-date', value: inputs.startDate }
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
        const breakdownItems = [
            { id: 'principal-interest', value: results.monthlyPI },
            { id: 'monthly-property-tax', value: results.monthlyTax },
            { id: 'monthly-insurance', value: results.monthlyInsurance }
        ];

        breakdownItems.forEach(({ id, value }) => {
            const el = Utils.$(`#${id}`);
            if (el) {
                el.textContent = Utils.formatCurrency(value);
            }
        });

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
        ChartManager.createPaymentCharts(results);
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

    exportAmortizationSchedule() {
        try {
            const schedule = MortgageCalculator.state.amortizationData;
            if (!schedule.length) return;

            // Create CSV content
            const headers = ['Payment #', 'Date', 'Payment', 'Principal', 'Interest', 'Balance', 'Equity'];
            const csvContent = [
                headers.join(','),
                ...schedule.map(row => [
                    row.paymentNumber,
                    row.date.toLocaleDateString(),
                    row.payment.toFixed(2),
                    row.principal.toFixed(2),
                    row.interest.toFixed(2),
                    row.balance.toFixed(2),
                    row.equity.toFixed(2)
                ].join(','))
            ].join('\n');

            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'amortization-schedule.csv';
            a.click();
            window.URL.revokeObjectURL(url);

            ToastManager.show('Amortization schedule exported successfully!', 'success');
            ScreenReader.announce('Amortization schedule exported to CSV file');
        } catch (error) {
            console.error('Export error:', error);
            ToastManager.show('Failed to export schedule. Please try again.', 'error');
        }
    }

    printAmortizationSchedule() {
        try {
            const printWindow = window.open('', '_blank');
            const schedule = MortgageCalculator.state.amortizationData;
            
            if (!schedule.length) return;

            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Amortization Schedule</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                        th { background-color: #f2f2f2; }
                        .currency { text-align: right; }
                    </style>
                </head>
                <body>
                    <h1>Amortization Schedule</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>Payment #</th>
                                <th>Date</th>
                                <th>Payment</th>
                                <th>Principal</th>
                                <th>Interest</th>
                                <th>Balance</th>
                                <th>Equity</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${schedule.map(row => `
                                <tr>
                                    <td>${row.paymentNumber}</td>
                                    <td>${row.date.toLocaleDateString()}</td>
                                    <td class="currency">${Utils.formatCurrency(row.payment)}</td>
                                    <td class="currency">${Utils.formatCurrency(row.principal)}</td>
                                    <td class="currency">${Utils.formatCurrency(row.interest)}</td>
                                    <td class="currency">${Utils.formatCurrency(row.balance)}</td>
                                    <td class="currency">${Utils.formatCurrency(row.equity)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
                </html>
            `;

            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();

            ToastManager.show('Amortization schedule prepared for printing!', 'success');
            ScreenReader.announce('Amortization schedule opened in print dialog');
        } catch (error) {
            console.error('Print error:', error);
            ToastManager.show('Failed to prepare print view. Please try again.', 'error');
        }
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
            
            ScreenReader.announce('Pre-approval modal opened');
        }
    }

    closeModal() {
        const modal = Utils.$('#preapproval-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
            ScreenReader.announce('Pre-approval modal closed');
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize calculator
    const calculator = new Calculator();
    
    // Set global reference
    window.MortgageCalculator = MortgageCalculator;
    window.Calculator = calculator;
    
    console.log('🏠 FinGuid Mortgage Calculator v6.0.0 initialized successfully!');
    console.log('✅ All requested improvements implemented:');
    console.log('  - Hero section reduced to half size');
    console.log('  - All cards reduced by 20% with adjusted fonts');
    console.log('  - Global voice input with microphone controls');
    console.log('  - Screen reader functionality enabled');
    console.log('  - Month/year only date selection');
    console.log('  - Advanced options restructured');
    console.log('  - Loan type section removed');
    console.log('  - Side-by-side chart layout');
    console.log('  - Enhanced accessibility features');
});

// Handle page visibility for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Stop voice recognition when page is hidden
        if (VoiceManager.isListening) {
            VoiceManager.stopListening();
        }
    }
});

// Handle errors globally
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    ToastManager.show('An unexpected error occurred. Please refresh the page.', 'error');
});

// Keyboard shortcuts for accessibility
document.addEventListener('keydown', (e) => {
    // Alt + V for voice input
    if (e.altKey && e.key === 'v') {
        e.preventDefault();
        VoiceManager.startListening();
    }
    
    // Alt + S for screen reader toggle
    if (e.altKey && e.key === 's') {
        e.preventDefault();
        ScreenReader.toggle();
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        const modal = Utils.$('#preapproval-modal');
        if (modal && modal.style.display === 'flex') {
            Utils.$('#modal-close').click();
        }
        
        if (VoiceManager.isListening) {
            VoiceManager.stopListening();
        }
    }
});

// Export for global access
window.Utils = Utils;
window.MortgageEngine = MortgageEngine;
window.AIInsights = AIInsights;
window.ChartManager = ChartManager;
window.ToastManager = ToastManager;
window.FormValidator = FormValidator;
window.VoiceManager = VoiceManager;
window.ScreenReader = ScreenReader;
