/**
 * FinGuid Mortgage Calculator - Advanced AI-Enhanced Version 3.0.0
 * Production-ready mortgage calculator with comprehensive features
 * 
 * Features:
 * - Multiple loan type support (Conventional, FHA, VA, USDA)
 * - AI-powered insights and recommendations
 * - Real-time calculations with debouncing
 * - Interactive charts and visualizations
 * - Complete amortization schedule
 * - PDF/CSV export functionality
 * - Lead generation and conversion optimization
 * - Advanced error handling and validation
 * - Performance optimization
 * - Accessibility compliance
 * - SEO optimization
 */

'use strict';

// Global application state
const MortgageCalculator = {
    version: '3.0.0',
    initialized: false,
    state: {
        currentCalculation: null,
        chartInstance: null,
        amortizationData: [],
        currentLoanType: 'conventional',
        advancedMode: false,
        validationErrors: new Map(),
        performanceMetrics: {
            calculationTime: 0,
            renderTime: 0,
            lastCalculated: null
        },
        amortizationView: 'monthly' // 'monthly' or 'yearly'
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
        },
        loanTypes: {
            conventional: {
                name: 'Conventional Loan',
                minDownPayment: 0.03,
                maxLTV: 0.97,
                pmiRequired: true,
                pmiThreshold: 0.20
            },
            fha: {
                name: 'FHA Loan',
                minDownPayment: 0.035,
                maxLTV: 0.965,
                pmiRequired: true,
                pmiThreshold: 0.10,
                mipRate: 0.0085
            },
            va: {
                name: 'VA Loan',
                minDownPayment: 0,
                maxLTV: 1.0,
                pmiRequired: false,
                fundingFee: 0.023
            },
            usda: {
                name: 'USDA Loan',
                minDownPayment: 0,
                maxLTV: 1.0,
                pmiRequired: true,
                guaranteeFee: 0.0035
            }
        }
    }
};

// State property tax rates for all 50 US states (2025 data)
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
    'NV': { rate: 0.0053, name: 'Nervada', avgTax: 1695 },
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
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(amount);
    },

    formatNumber(num, decimals = 0) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    },

    formatPercentage(num, decimals = 2) {
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

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    isValidPhone(phone) {
        const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
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

// Form validation module
const FormValidator = {
    validators: {
        required: (value) => value && value.toString().trim() !== '',
        number: (value, min, max) => Utils.isValidNumber(value, min, max),
        email: (value) => Utils.isValidEmail(value),
        phone: (value) => Utils.isValidPhone(value),
        minLength: (value, length) => value && value.length >= length,
        maxLength: (value, length) => value && value.length <= length
    },

    rules: {
        'home-price': [
            { type: 'required', message: 'Home price is required' },
            { type: 'number', min: 50000, max: 10000000, message: 'Home price must be between $50,000 and $10,000,000' }
        ],
        'interest-rate': [
            { type: 'required', message: 'Interest rate is required' },
            { type: 'number', min: 0.1, max: 20, message: 'Interest rate must be between 0.1% and 20%' }
        ],
        'state': [
            { type: 'required', message: 'Please select your state' }
        ],
        'first-name': [
            { type: 'required', message: 'First name is required' },
            { type: 'minLength', length: 2, message: 'First name must be at least 2 characters' }
        ],
        'last-name': [
            { type: 'required', message: 'Last name is required' },
            { type: 'minLength', length: 2, message: 'Last name must be at least 2 characters' }
        ],
        'email': [
            { type: 'required', message: 'Email is required' },
            { type: 'email', message: 'Please enter a valid email address' }
        ],
        'phone': [
            { type: 'required', message: 'Phone number is required' },
            { type: 'phone', message: 'Please enter a valid phone number' }
        ]
    },

    validateField(fieldId, value) {
        const rules = this.rules[fieldId];
        if (!rules) return { valid: true, message: '' };

        for (const rule of rules) {
            let isValid = false;
            
            switch (rule.type) {
                case 'required':
                    isValid = this.validators.required(value);
                    break;
                case 'number':
                    isValid = this.validators.number(value, rule.min, rule.max);
                    break;
                case 'email':
                    isValid = this.validators.email(value);
                    break;
                case 'phone':
                    isValid = this.validators.phone(value);
                    break;
                case 'minLength':
                    isValid = this.validators.minLength(value, rule.length);
                    break;
                case 'maxLength':
                    isValid = this.validators.maxLength(value, rule.length);
                    break;
            }

            if (!isValid) {
                return { valid: false, message: rule.message };
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

        MortgageCalculator.state.validationErrors.set(fieldId, message);
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

        MortgageCalculator.state.validationErrors.delete(fieldId);
    },

    validateForm(formId) {
        const form = Utils.$(`#${formId}`);
        if (!form) return false;

        let isValid = true;
        const formData = new FormData(form);

        // Clear all previous errors
        MortgageCalculator.state.validationErrors.clear();

        // Validate each field
        for (const [fieldId, value] of formData.entries()) {
            const validation = this.validateField(fieldId, value);
            if (!validation.valid) {
                this.showError(fieldId, validation.message);
                isValid = false;
            } else {
                this.clearError(fieldId);
            }
        }

        return isValid;
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

    calculatePMI(loanAmount, downPaymentPercent, loanType, customRate = null) {
        const loanConfig = MortgageCalculator.config.loanTypes[loanType];
        
        if (!loanConfig.pmiRequired) return 0;
        if (loanType === 'va') return 0;
        
        if (downPaymentPercent >= loanConfig.pmiThreshold * 100) return 0;

        let pmiRate = customRate || 0.008; // Default 0.8%
        
        // Adjust PMI rate based on loan type and down payment
        if (loanType === 'fha') {
            pmiRate = downPaymentPercent < 10 ? 0.0085 : 0.008;
        } else if (loanType === 'usda') {
            pmiRate = 0.0035; // USDA guarantee fee
        }
        
        return (loanAmount * pmiRate) / 12;
    },

    calculateLoanDetails(inputs) {
        const startTime = performance.now();
        
        try {
            const {
                homePrice,
                downPaymentAmount,
                interestRate,
                loanTerm,
                loanType,
                propertyTax,
                homeInsurance,
                hoaFees,
                pmiRate,
                extraMonthly,
                extraYearly
            } = inputs;

            // Calculate loan amount
            const loanAmount = homePrice - downPaymentAmount;
            const downPaymentPercent = (downPaymentAmount / homePrice) * 100;
            
            // Monthly principal and interest
            const monthlyPI = this.calculateMonthlyPayment(loanAmount, interestRate / 100, loanTerm);
            
            // Calculate PMI
            const monthlyPMI = this.calculatePMI(loanAmount, downPaymentPercent, loanType, pmiRate / 100);
            
            // Other monthly costs
            const monthlyTax = propertyTax / 12;
            const monthlyInsurance = homeInsurance / 12;
            const monthlyHOA = hoaFees || 0;
            
            // Total monthly payment
            const totalMonthly = monthlyPI + monthlyPMI + monthlyTax + monthlyInsurance + monthlyHOA;
            
            // Calculate totals
            const totalPayments = monthlyPI * (loanTerm * 12);
            const totalInterest = totalPayments - loanAmount;
            const totalCost = homePrice + totalInterest;
            
            // Calculate with extra payments
            const extraPaymentAnalysis = this.calculateExtraPayments(
                loanAmount, interestRate / 100, loanTerm, monthlyPI, extraMonthly, extraYearly
            );

            const results = {
                // Basic calculations
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
                
                // Extra payment analysis
                extraPaymentAnalysis,
                
                // Loan details
                effectiveInterestRate: interestRate,
                loanToValue: (loanAmount / homePrice) * 100,
                debtToIncomeRatio: null, // Will be calculated if income provided
                
                // Metadata
                calculatedAt: new Date(),
                loanType,
                inputs
            };

            // Performance tracking
            const endTime = performance.now();
            MortgageCalculator.state.performanceMetrics.calculationTime = endTime - startTime;
            MortgageCalculator.state.performanceMetrics.lastCalculated = new Date();

            return results;
            
        } catch (error) {
            console.error('Mortgage calculation error:', error);
            throw new Error('Failed to calculate mortgage details. Please check your inputs.');
        }
    },

    calculateExtraPayments(loanAmount, annualRate, termYears, regularPayment, extraMonthly = 0, extraYearly = 0) {
        const monthlyRate = annualRate / 12;
        let balance = loanAmount;
        let totalInterest = 0;
        let paymentCount = 0;
        const maxPayments = termYears * 12;

        while (balance > 0.01 && paymentCount < maxPayments) {
            paymentCount++;
            
            const interestPayment = balance * monthlyRate;
            let principalPayment = regularPayment - interestPayment + extraMonthly;
            
            // Add yearly extra payment if applicable
            if (extraYearly > 0 && paymentCount % 12 === 0) {
                principalPayment += extraYearly;
            }
            
            // Don't overpay
            if (principalPayment > balance) {
                principalPayment = balance;
            }
            
            balance -= principalPayment;
            totalInterest += interestPayment;
        }

        const monthsSaved = (termYears * 12) - paymentCount;
        const interestSaved = (regularPayment * termYears * 12) - loanAmount - totalInterest;

        return {
            payoffMonths: paymentCount,
            monthsSaved,
            totalInterest,
            interestSaved: Math.max(0, interestSaved),
            payoffDate: Utils.addMonths(new Date(), paymentCount)
        };
    },

    generateAmortizationSchedule(inputs, results) {
        const {
            loanAmount,
            monthlyPI,
            extraMonthly = 0,
            extraYearly = 0
        } = { ...inputs, ...results };

        const annualRate = inputs.interestRate / 100;
        const monthlyRate = annualRate / 12;
        const startDate = new Date(inputs.startDate || new Date());
        
        const schedule = [];
        let balance = loanAmount;
        let paymentNumber = 1;
        let currentDate = new Date(startDate);
        let totalInterest = 0;
        let totalPrincipal = 0;

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
            totalPrincipal += principalPayment;
            
            const homeValue = inputs.homePrice * Math.pow(1.03, (paymentNumber - 1) / 12); // Assume 3% appreciation
            const equity = homeValue - balance;

            schedule.push({
                paymentNumber,
                date: new Date(currentDate),
                payment: interestPayment + principalPayment,
                principal: principalPayment,
                interest: interestPayment,
                balance: Math.max(0, balance),
                equity,
                homeValue,
                cumulativeInterest: totalInterest,
                cumulativePrincipal: totalPrincipal
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
                    message: `Increasing your down payment by ${Utils.formatCurrency(additionalDown)} to reach 20% would eliminate PMI, saving you ${Utils.formatCurrency(results.monthlyPMI)} monthly (${Utils.formatCurrency(results.monthlyPMI * 12)} annually).`,
                    action: 'Increase Down Payment',
                    priority: 'high'
                });
            }

            // Interest rate insights
            if (inputs.interestRate > 7.5) {
                insights.push({
                    type: 'tip',
                    icon: 'fas fa-chart-line',
                    title: 'Rate Shopping Opportunity',
                    message: `Your rate of ${inputs.interestRate}% is above the current market average. Shopping for a rate just 0.5% lower could save you approximately ${Utils.formatCurrency(this.calculateRateSavings(inputs, results, 0.5))} over the loan term.`,
                    action: 'Compare Rates',
                    priority: 'high'
                });
            }

            // Extra payment insights
            if (results.extraPaymentAnalysis && results.extraPaymentAnalysis.interestSaved > 10000) {
                insights.push({
                    type: 'success',
                    icon: 'fas fa-piggy-bank',
                    title: 'Extra Payment Benefits',
                    message: `Making extra payments would save you ${Utils.formatCurrency(results.extraPaymentAnalysis.interestSaved)} in interest and pay off your loan ${Math.round(results.extraPaymentAnalysis.monthsSaved / 12)} years early.`,
                    action: 'Set Up Extra Payments',
                    priority: 'medium'
                });
            }

            // Affordability insights
            const monthlyIncome = this.estimateRequiredIncome(results.totalMonthly);
            insights.push({
                type: 'info',
                icon: 'fas fa-calculator',
                title: 'Income Recommendation',
                message: `For comfortable affordability (28% housing ratio), your gross monthly income should be at least ${Utils.formatCurrency(monthlyIncome, 0)} (${Utils.formatCurrency(monthlyIncome * 12, 0)} annually).`,
                action: 'Check Affordability',
                priority: 'medium'
            });

            // Emergency fund insight
            const emergencyFund = results.totalMonthly * 6;
            insights.push({
                type: 'info',
                icon: 'fas fa-shield-alt',
                title: 'Emergency Fund Recommendation',
                message: `Maintain an emergency fund of at least ${Utils.formatCurrency(emergencyFund, 0)} (6 months of housing payments) before purchasing.`,
                action: 'Calculate Emergency Fund',
                priority: 'low'
            });

            // Refinancing insights
            if (inputs.interestRate > 6.0) {
                insights.push({
                    type: 'tip',
                    icon: 'fas fa-exchange-alt',
                    title: 'Future Refinancing Opportunity',
                    message: `If rates drop to 5.5% or below, refinancing could potentially save you significant money. Monitor rates regularly.`,
                    action: 'Set Rate Alert',
                    priority: 'low'
                });
            }

            // Property tax insights
            const stateData = STATE_TAX_RATES[inputs.state];
            if (stateData && inputs.propertyTax > stateData.avgTax * 1.5) {
                insights.push({
                    type: 'warning',
                    icon: 'fas fa-map-marker-alt',
                    title: 'High Property Tax Alert',
                    message: `Your property tax estimate is significantly higher than the ${stateData.name} average of ${Utils.formatCurrency(stateData.avgTax)}. Consider appealing your assessment.`,
                    action: 'Learn About Tax Appeals',
                    priority: 'medium'
                });
            }

            return insights.sort((a, b) => {
                const priorities = { high: 3, medium: 2, low: 1 };
                return priorities[b.priority] - priorities[a.priority];
            });

        } catch (error) {
            console.error('AI insights generation error:', error);
            return [{
                type: 'info',
                icon: 'fas fa-lightbulb',
                title: 'General Recommendation',
                message: 'Consider comparing rates from multiple lenders to ensure you get the best deal.',
                action: 'Get Rate Quotes',
                priority: 'medium'
            }];
        }
    },

    calculateRateSavings(inputs, results, rateReduction) {
        const newRate = inputs.interestRate - rateReduction;
        const newMonthlyPI = MortgageEngine.calculateMonthlyPayment(
            results.loanAmount,
            newRate / 100,
            inputs.loanTerm
        );
        
        const monthlySavings = results.monthlyPI - newMonthlyPI;
        return monthlySavings * inputs.loanTerm * 12;
    },

    estimateRequiredIncome(monthlyPayment) {
        return monthlyPayment / 0.28; // 28% housing ratio
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

        const config = {
            type: Utils.$('.chart-toggle.active')?.dataset.chart === 'bar' ? 'bar' : 'pie',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // We'll use custom legend
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
                },
                animation: {
                    duration: MortgageCalculator.config.animationDuration
                }
            }
        };

        try {
            this.chart = new Chart(ctx, config);
            this.updateLegend(data);
        } catch (error) {
            console.error('Chart creation error:', error);
            this.createSimpleChart(data, ctx.parentElement);
        }
    },

    createSimpleChart(data, container) {
        const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
        const chartHTML = data.labels.map((label, index) => {
            const value = data.datasets[0].data[index];
            const percentage = ((value / total) * 100).toFixed(1);
            const color = data.datasets[0].backgroundColor[index];
            
            return `
                <div class="chart-bar" style="margin-bottom: 8px;">
                    <div class="chart-label" style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="color: ${color};">● ${label}</span>
                        <span>${Utils.formatCurrency(value)} (${percentage}%)</span>
                    </div>
                    <div class="chart-progress" style="background: #e5e7eb; height: 8px; border-radius: 4px;">
                        <div style="background: ${color}; height: 100%; width: ${percentage}%; border-radius: 4px; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = chartHTML;
    },

    updateLegend(data) {
        const legend = Utils.$('#chart-legend');
        if (!legend) return;

        const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
        const legendHTML = data.labels.map((label, index) => {
            const value = data.datasets[0].data[index];
            const percentage = ((value / total) * 100).toFixed(1);
            const color = data.datasets[0].backgroundColor[index];
            
            return `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${color}; width: 16px; height: 16px; border-radius: 2px;"></div>
                    <span class="legend-label">${label}: ${Utils.formatCurrency(value)} (${percentage}%)</span>
                </div>
            `;
        }).join('');

        legend.innerHTML = legendHTML;
    }
};

// Notification system
const NotificationManager = {
    show(message, type = 'info', duration = 5000) {
        const container = Utils.$('#toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-content">
                <i class="${icons[type]}" aria-hidden="true"></i>
                <span class="toast-message">${message}</span>
                <button type="button" class="toast-close" aria-label="Close notification">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            </div>
        `;

        container.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove
        const timeoutId = setTimeout(() => this.remove(toast), duration);

        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(timeoutId);
            this.remove(toast);
        });
    },

    remove(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }
};

// Export functionality
const ExportManager = {
    async exportToPDF(results) {
        try {
            // In production, integrate with jsPDF or similar library
            const content = this.generatePDFContent(results);
            
            // For now, create a printable version
            const printWindow = window.open('', '_blank');
            printWindow.document.write(content);
            printWindow.document.close();
            printWindow.print();
            
            Analytics.trackEvent('export_pdf', {
                loan_amount: results.loanAmount,
                monthly_payment: results.totalMonthly
            });
            
        } catch (error) {
            console.error('PDF export error:', error);
            NotificationManager.show('Failed to export PDF. Please try again.', 'error');
        }
    },

    exportToCSV(scheduleData) {
        try {
            const headers = ['Payment #', 'Date', 'Payment', 'Principal', 'Interest', 'Balance', 'Equity'];
            const csvContent = [
                headers.join(','),
                ...scheduleData.map(row => [
                    row.paymentNumber,
                    Utils.formatDate(row.date, 'MM/DD/YYYY'),
                    row.payment.toFixed(2),
                    row.principal.toFixed(2),
                    row.interest.toFixed(2),
                    row.balance.toFixed(2),
                    row.equity.toFixed(2)
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mortgage-amortization-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            
            window.URL.revokeObjectURL(url);
            
            Analytics.trackEvent('export_csv', {
                rows: scheduleData.length
            });
            
        } catch (error) {
            console.error('CSV export error:', error);
            NotificationManager.show('Failed to export CSV. Please try again.', 'error');
        }
    },

    generatePDFContent(results) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Mortgage Calculation Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                .breakdown { margin-bottom: 30px; }
                .breakdown table { width: 100%; border-collapse: collapse; }
                .breakdown th, .breakdown td { padding: 8px; border: 1px solid #ddd; text-align: right; }
                .breakdown th { background: #e9ecef; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Mortgage Calculation Report</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="summary">
                <h2>Loan Summary</h2>
                <p><strong>Home Price:</strong> ${Utils.formatCurrency(results.inputs.homePrice)}</p>
                <p><strong>Down Payment:</strong> ${Utils.formatCurrency(results.downPaymentAmount)} (${results.downPaymentPercent.toFixed(1)}%)</p>
                <p><strong>Loan Amount:</strong> ${Utils.formatCurrency(results.loanAmount)}</p>
                <p><strong>Interest Rate:</strong> ${results.inputs.interestRate}%</p>
                <p><strong>Loan Term:</strong> ${results.inputs.loanTerm} years</p>
            </div>
            
            <div class="breakdown">
                <h2>Monthly Payment Breakdown</h2>
                <table>
                    <tr><th>Component</th><th>Monthly Amount</th></tr>
                    <tr><td>Principal & Interest</td><td>${Utils.formatCurrency(results.monthlyPI)}</td></tr>
                    <tr><td>Property Tax</td><td>${Utils.formatCurrency(results.monthlyTax)}</td></tr>
                    <tr><td>Home Insurance</td><td>${Utils.formatCurrency(results.monthlyInsurance)}</td></tr>
                    ${results.monthlyPMI > 0 ? `<tr><td>PMI</td><td>${Utils.formatCurrency(results.monthlyPMI)}</td></tr>` : ''}
                    ${results.monthlyHOA > 0 ? `<tr><td>HOA Fees</td><td>${Utils.formatCurrency(results.monthlyHOA)}</td></tr>` : ''}
                    <tr><td><strong>Total Monthly Payment</strong></td><td><strong>${Utils.formatCurrency(results.totalMonthly)}</strong></td></tr>
                </table>
            </div>
            
            <div class="totals">
                <h2>Loan Totals</h2>
                <p><strong>Total Interest Paid:</strong> ${Utils.formatCurrency(results.totalInterest)}</p>
                <p><strong>Total Cost:</strong> ${Utils.formatCurrency(results.totalCost)}</p>
            </div>
        </body>
        </html>
        `;
    }
};

// Analytics and tracking
const Analytics = {
    trackEvent(eventName, properties = {}) {
        try {
            // Google Analytics 4
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, {
                    ...properties,
                    app_version: MortgageCalculator.version
                });
            }

            // Custom analytics
            if (window.analytics && typeof window.analytics.track === 'function') {
                window.analytics.track(eventName, properties);
            }

            console.log('Analytics event:', eventName, properties);
        } catch (error) {
            console.error('Analytics error:', error);
        }
    },

    trackCalculation(inputs, results) {
        this.trackEvent('mortgage_calculation', {
            loan_amount: results.loanAmount,
            home_price: inputs.homePrice,
            down_payment_percent: results.downPaymentPercent,
            interest_rate: inputs.interestRate,
            loan_term: inputs.loanTerm,
            loan_type: inputs.loanType,
            state: inputs.state,
            monthly_payment: results.totalMonthly,
            calculation_time: MortgageCalculator.state.performanceMetrics.calculationTime
        });
    },

    trackFormSubmission(formType, success = true) {
        this.trackEvent('form_submission', {
            form_type: formType,
            success,
            timestamp: new Date().toISOString()
        });
    },

    trackPageLoad() {
        this.trackEvent('page_view', {
            page: 'mortgage_calculator',
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
        });
    }
};

// Main application controller
const App = {
    // Initialize the application
    init() {
        if (MortgageCalculator.initialized) return;

        try {
            console.log(`Initializing FinGuid Mortgage Calculator v${MortgageCalculator.version}`);
            
            // Initialize modules
            this.initializeUI();
            this.setupEventListeners();
            this.populateStateDropdown();
            
            // Set default values
            this.setDefaultValues();
            
            // Perform initial calculation
            this.calculateMortgage();
            
            // Track page load
            Analytics.trackPageLoad();
            
            MortgageCalculator.initialized = true;
            console.log('Mortgage calculator initialized successfully');
            
        } catch (error) {
            console.error('Initialization error:', error);
            NotificationManager.show('Failed to initialize calculator. Please refresh the page.', 'error');
        }
    },

    initializeUI() {
        // Set up loan type selection
        const loanTypeInputs = Utils.$$('input[name="loanType"]');
        loanTypeInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                MortgageCalculator.state.currentLoanType = e.target.value;
                this.updateLoanTypeUI(e.target.value);
                this.calculateMortgage();
            });
        });

        // Set up down payment tabs
        this.setupDownPaymentTabs();
        
        // Set up loan term selection
        this.setupLoanTermSelection();
        
        // Set up chart controls
        this.setupChartControls();
        
        // Set up mobile menu
        this.setupMobileMenu();
        
        // Set up modals
        this.setupModals();
        
        // Set up amortization view controls
        this.setupAmortizationViewControls();
    },

    setupEventListeners() {
        // Form submission
        const mortgageForm = Utils.$('#mortgage-form');
        if (mortgageForm) {
            mortgageForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.calculateMortgage();
            });
        }

        // Input changes with debouncing
        const inputs = Utils.$$('.form-input, .form-select');
        inputs.forEach(input => {
            const debouncedCalculate = Utils.debounce(() => {
                if (FormValidator.validateField(input.id, input.value).valid) {
                    this.calculateMortgage();
                }
            }, MortgageCalculator.config.debounceDelay);
            
            input.addEventListener('input', debouncedCalculate);
            input.addEventListener('change', debouncedCalculate);
            
            // Real-time validation
            input.addEventListener('blur', () => {
                const validation = FormValidator.validateField(input.id, input.value);
                if (!validation.valid) {
                    FormValidator.showError(input.id, validation.message);
                } else {
                    FormValidator.clearError(input.id);
                }
            });
        });

        // Action buttons
        this.setupActionButtons();
        
        // State selection change
        const stateSelect = Utils.$('#state');
        if (stateSelect) {
            stateSelect.addEventListener('change', (e) => {
                this.updatePropertyTax(e.target.value);
                this.calculateMortgage();
            });
        }

        // Reset button
        const resetBtn = Utils.$('#reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetForm();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.calculateMortgage();
            }
        });
    },

    setupActionButtons() {
        // Export PDF
        const exportPDFBtn = Utils.$('#export-pdf-btn');
        if (exportPDFBtn) {
            exportPDFBtn.addEventListener('click', () => {
                if (MortgageCalculator.state.currentCalculation) {
                    ExportManager.exportToPDF(MortgageCalculator.state.currentCalculation);
                } else {
                    NotificationManager.show('Please calculate first before exporting.', 'warning');
                }
            });
        }

        // Export CSV
        const exportScheduleBtn = Utils.$('#export-schedule-btn');
        if (exportScheduleBtn) {
            exportScheduleBtn.addEventListener('click', () => {
                if (MortgageCalculator.state.amortizationData.length > 0) {
                    ExportManager.exportToCSV(MortgageCalculator.state.amortizationData);
                } else {
                    NotificationManager.show('Please calculate first before exporting.', 'warning');
                }
            });
        }

        // Share button
        const shareBtn = Utils.$('#share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareResults();
            });
        }

        // Email button
        const emailBtn = Utils.$('#email-btn');
        if (emailBtn) {
            emailBtn.addEventListener('click', () => {
                this.emailResults();
            });
        }

        // Print button
        const printBtn = Utils.$('#print-btn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }

        // Get quotes button
        const getQuotesBtn = Utils.$('#get-quotes-btn');
        if (getQuotesBtn) {
            getQuotesBtn.addEventListener('click', () => {
                this.showLeadModal();
            });
        }
    },

    setupDownPaymentTabs() {
        const tabAmount = Utils.$('#tab-amount');
        const tabPercent = Utils.$('#tab-percent');
        const amountPanel = Utils.$('#dp-amount-panel');
        const percentPanel = Utils.$('#dp-percent-panel');
        const dpAmount = Utils.$('#dp-amount');
        const dpPercent = Utils.$('#dp-percent');

        if (!tabAmount || !tabPercent) return;

        tabAmount.addEventListener('click', () => {
            this.switchDownPaymentMode('amount');
        });

        tabPercent.addEventListener('click', () => {
            this.switchDownPaymentMode('percent');
        });

        // Sync down payment inputs
        if (dpAmount) {
            dpAmount.addEventListener('input', () => {
                this.syncDownPayment(false);
            });
        }

        if (dpPercent) {
            dpPercent.addEventListener('input', () => {
                this.syncDownPayment(true);
            });
        }
    },

    setupLoanTermSelection() {
        const termChips = Utils.$$('.term-chip');
        const customTermInput = Utils.$('#loan-term-custom');

        termChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const term = parseInt(chip.dataset.term);
                this.setLoanTerm(term);
                if (customTermInput) customTermInput.value = '';
            });
        });

        if (customTermInput) {
            customTermInput.addEventListener('input', (e) => {
                const term = parseInt(e.target.value);
                if (term >= 5 && term <= 50) {
                    this.setLoanTerm(term, true);
                }
            });
        }
    },

    setupAmortizationViewControls() {
        const viewButtons = Utils.$$('.view-btn[data-view]');
        viewButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const viewType = e.target.dataset.view;
                this.switchAmortizationView(viewType);
            });
        });
    },

    switchAmortizationView(viewType) {
        MortgageCalculator.state.amortizationView = viewType;
        
        // Update active button
        Utils.$$('.view-btn[data-view]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewType);
        });
        
        // Update the table display
        if (MortgageCalculator.state.amortizationData.length > 0) {
            this.updateAmortizationTable(MortgageCalculator.state.amortizationData);
        }
    },

    setupChartControls() {
        const chartToggles = Utils.$$('.chart-toggle');
        chartToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const chartType = toggle.dataset.chart;
                
                // Update active state
                chartToggles.forEach(t => t.classList.remove('active'));
                toggle.classList.add('active');
                
                // Recreate chart
                if (MortgageCalculator.state.currentCalculation) {
                    ChartManager.createPaymentChart(MortgageCalculator.state.currentCalculation);
                }
            });
        });
    },

    setupMobileMenu() {
        const mobileToggle = Utils.$('#mobile-menu-toggle');
        const navMenu = Utils.$('#nav-menu');

        if (mobileToggle && navMenu) {
            mobileToggle.addEventListener('click', () => {
                const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
                mobileToggle.setAttribute('aria-expanded', !isExpanded);
                navMenu.classList.toggle('active');
            });
        }
    },

    setupModals() {
        const leadModal = Utils.$('#lead-modal');
        const leadForm = Utils.$('#lead-form');

        if (leadModal) {
            // Close modal on overlay click
            leadModal.addEventListener('click', (e) => {
                if (e.target === leadModal || e.target.hasAttribute('data-close-modal')) {
                    this.hideLeadModal();
                }
            });

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !leadModal.hasAttribute('aria-hidden')) {
                    this.hideLeadModal();
                }
            });
        }

        if (leadForm) {
            leadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLeadSubmission();
            });

            // Phone number formatting
            const phoneInput = Utils.$('#phone');
            if (phoneInput) {
                phoneInput.addEventListener('input', (e) => {
                    e.target.value = this.formatPhoneNumber(e.target.value);
                });
            }
        }
    },

    populateStateDropdown() {
        const stateSelect = Utils.$('#state');
        if (!stateSelect) return;

        // Clear existing options except first
        while (stateSelect.children.length > 1) {
            stateSelect.removeChild(stateSelect.lastChild);
        }

        // Add states
        Object.entries(STATE_TAX_RATES).forEach(([code, data]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${data.name} (${code})`;
            stateSelect.appendChild(option);
        });

        // Set default to California
        stateSelect.value = 'CA';
    },

    setDefaultValues() {
        const defaults = {
            'home-price': 400000,
            'dp-amount': 80000,
            'dp-percent': 20,
            'interest-rate': 6.75,
            'property-tax': 3000,
            'home-insurance': 1200,
            'hoa-fees': 0,
            'pmi-rate': 0.8,
            'extra-monthly': 0,
            'extra-yearly': 0,
            'start-date': new Date().toISOString().substr(0, 7) // Current month
        };

        Object.entries(defaults).forEach(([id, value]) => {
            const element = Utils.$(`#${id}`);
            if (element && !element.value) {
                element.value = value;
            }
        });

        // Set default loan term
        this.setLoanTerm(30);
        
        // Set default state and update property tax
        const stateSelect = Utils.$('#state');
        if (stateSelect && stateSelect.value) {
            this.updatePropertyTax(stateSelect.value);
        }
    },

    // Core calculation method
    calculateMortgage() {
        try {
            const startTime = performance.now();
            
            // Gather input values
            const inputs = this.gatherInputs();
            
            // Validate inputs
            if (!this.validateInputs(inputs)) {
                return;
            }

            // Perform calculations
            const results = MortgageEngine.calculateLoanDetails(inputs);
            
            // Generate AI insights
            const insights = AIInsights.generateInsights(inputs, results);
            
            // Generate amortization schedule
            const amortizationData = MortgageEngine.generateAmortizationSchedule(inputs, results);
            
            // Store results
            MortgageCalculator.state.currentCalculation = results;
            MortgageCalculator.state.amortizationData = amortizationData;
            
            // Update UI
            this.updateResults(results);
            this.updateInsights(insights);
            this.updateAmortizationTable(amortizationData);
            ChartManager.createPaymentChart(results);
            
            // Update PMI alert
            this.updatePMIAlert(results);
            
            // Track analytics
            Analytics.trackCalculation(inputs, results);
            
            const endTime = performance.now();
            MortgageCalculator.state.performanceMetrics.renderTime = endTime - startTime;
            
            console.log(`Calculation completed in ${(endTime - startTime).toFixed(2)}ms`);
            
        } catch (error) {
            console.error('Calculation error:', error);
            NotificationManager.show('Error calculating mortgage. Please check your inputs and try again.', 'error');
        }
    },

    gatherInputs() {
        const formData = new FormData(Utils.$('#mortgage-form'));
        
        return {
            homePrice: parseFloat(formData.get('homePrice') || 0),
            downPaymentAmount: parseFloat(formData.get('downPaymentAmount') || 0),
            downPaymentPercent: parseFloat(formData.get('downPaymentPercent') || 0),
            interestRate: parseFloat(formData.get('interestRate') || 0),
            loanTerm: parseInt(formData.get('loanTermCustom') || 30),
            loanType: formData.get('loanType') || 'conventional',
            state: formData.get('state') || '',
            propertyTax: parseFloat(formData.get('propertyTax') || 0),
            homeInsurance: parseFloat(formData.get('homeInsurance') || 0),
            hoaFees: parseFloat(formData.get('hoaFees') || 0),
            pmiRate: parseFloat(formData.get('pmiRate') || 0),
            extraMonthly: parseFloat(formData.get('extraMonthly') || 0),
            extraYearly: parseFloat(formData.get('extraYearly') || 0),
            startDate: formData.get('startDate') || new Date().toISOString().substr(0, 7)
        };
    },

    validateInputs(inputs) {
        // Basic validation
        if (inputs.homePrice <= 0) {
            NotificationManager.show('Please enter a valid home price.', 'error');
            return false;
        }

        if (inputs.downPaymentAmount >= inputs.homePrice) {
            NotificationManager.show('Down payment cannot exceed home price.', 'error');
            return false;
        }

        if (inputs.interestRate <= 0 || inputs.interestRate > 20) {
            NotificationManager.show('Please enter a valid interest rate (0.1% - 20%).', 'error');
            return false;
        }

        // Loan type specific validation
        const loanConfig = MortgageCalculator.config.loanTypes[inputs.loanType];
        const downPaymentPercent = (inputs.downPaymentAmount / inputs.homePrice) * 100;
        
        if (downPaymentPercent < loanConfig.minDownPayment * 100) {
            NotificationManager.show(
                `Minimum down payment for ${loanConfig.name} is ${loanConfig.minDownPayment * 100}%.`,
                'error'
            );
            return false;
        }

        return true;
    },

    updateResults(results) {
        // Update payment breakdown
        Utils.$('#total-payment').textContent = Utils.formatCurrency(results.totalMonthly);
        Utils.$('#pi-payment').textContent = Utils.formatCurrency(results.monthlyPI);
        Utils.$('#tax-payment').textContent = Utils.formatCurrency(results.monthlyTax);
        Utils.$('#insurance-payment').textContent = Utils.formatCurrency(results.monthlyInsurance);
        
        // Update PMI if applicable
        const pmiRow = Utils.$('#pmi-row');
        const pmiPayment = Utils.$('#pmi-payment');
        if (results.monthlyPMI > 0) {
            pmiRow.classList.remove('hidden');
            pmiPayment.textContent = Utils.formatCurrency(results.monthlyPMI);
        } else {
            pmiRow.classList.add('hidden');
        }
        
        // Update HOA if applicable
        const hoaRow = Utils.$('#hoa-row');
        const hoaPayment = Utils.$('#hoa-payment');
        if (results.monthlyHOA > 0) {
            hoaRow.classList.remove('hidden');
            hoaPayment.textContent = Utils.formatCurrency(results.monthlyHOA);
        } else {
            hoaRow.classList.add('hidden');
        }
        
        // Update summary stats
        Utils.$('#loan-amount').textContent = Utils.formatCurrency(results.loanAmount);
        Utils.$('#total-interest').textContent = Utils.formatCurrency(results.totalInterest);
        Utils.$('#total-cost').textContent = Utils.formatCurrency(results.totalCost);
        
        // Show results section
        Utils.$('#results-summary').classList.remove('hidden');
    },

    updateInsights(insights) {
        const insightsContainer = Utils.$('#insights-list');
        if (!insightsContainer) return;

        if (insights.length === 0) {
            insightsContainer.innerHTML = `
                <div class="insight-item">
                    <div class="insight-icon">
                        <i class="fas fa-lightbulb" aria-hidden="true"></i>
                    </div>
                    <div class="insight-content">
                        <h3 class="insight-title">No Specific Recommendations</h3>
                        <p class="insight-message">Your mortgage terms look good! Consider shopping for the best rates.</p>
                    </div>
                </div>
            `;
            return;
        }

        insightsContainer.innerHTML = insights.map(insight => `
            <div class="insight-item insight-${insight.type}">
                <div class="insight-icon">
                    <i class="${insight.icon}" aria-hidden="true"></i>
                </div>
                <div class="insight-content">
                    <h3 class="insight-title">${insight.title}</h3>
                    <p class="insight-message">${insight.message}</p>
                    <button type="button" class="insight-action">${insight.action}</button>
                </div>
            </div>
        `).join('');
    },

    updateAmortizationTable(scheduleData) {
        const tableBody = Utils.$('#amortization-body');
        const pagination = Utils.$('#table-pagination');
        if (!tableBody || !pagination) return;

        // Clear existing content
        tableBody.innerHTML = '';
        
        // For yearly view, we need to aggregate monthly data
        const displayData = MortgageCalculator.state.amortizationView === 'yearly' 
            ? this.aggregateYearlyData(scheduleData)
            : scheduleData.slice(0, 12); // Show first 12 months initially

        // Populate table
        tableBody.innerHTML = displayData.map(row => `
            <tr>
                <td>${row.paymentNumber}</td>
                <td>${Utils.formatDate(row.date)}</td>
                <td class="currency">${Utils.formatCurrency(row.payment, 2)}</td>
                <td class="currency">${Utils.formatCurrency(row.principal, 2)}</td>
                <td class="currency">${Utils.formatCurrency(row.interest, 2)}</td>
                <td class="currency">${Utils.formatCurrency(row.balance, 2)}</td>
                <td class="currency">${Utils.formatCurrency(row.equity, 2)}</td>
            </tr>
        `).join('');

        // Setup pagination if needed
        if (scheduleData.length > 12 && MortgageCalculator.state.amortizationView === 'monthly') {
            this.setupPagination(scheduleData);
        } else {
            pagination.innerHTML = '';
        }
    },

    aggregateYearlyData(scheduleData) {
        const yearlyData = [];
        
        for (let year = 1; year <= Math.ceil(scheduleData.length / 12); year++) {
            const startIndex = (year - 1) * 12;
            const endIndex = Math.min(startIndex + 12, scheduleData.length);
            const yearData = scheduleData.slice(startIndex, endIndex);
            
            const yearlyEntry = {
                paymentNumber: year,
                date: yearData[0].date,
                payment: yearData.reduce((sum, month) => sum + month.payment, 0),
                principal: yearData.reduce((sum, month) => sum + month.principal, 0),
                interest: yearData.reduce((sum, month) => sum + month.interest, 0),
                balance: yearData[yearData.length - 1].balance,
                equity: yearData[yearData.length - 1].equity
            };
            
            yearlyData.push(yearlyEntry);
        }
        
        return yearlyData;
    },

    setupPagination(scheduleData) {
        const pagination = Utils.$('#table-pagination');
        if (!pagination) return;

        const itemsPerPage = 12;
        const totalPages = Math.ceil(scheduleData.length / itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <div class="pagination-controls">
                <button type="button" class="pagination-btn pagination-prev" disabled>
                    <i class="fas fa-chevron-left" aria-hidden="true"></i>
                </button>
        `;

        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            paginationHTML += `
                <button type="button" class="pagination-btn ${i === 1 ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }

        if (totalPages > 5) {
            paginationHTML += `
                <span class="pagination-ellipsis">...</span>
                <button type="button" class="pagination-btn" data-page="${totalPages}">
                    ${totalPages}
                </button>
            `;
        }

        paginationHTML += `
                <button type="button" class="pagination-btn pagination-next" ${totalPages === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right" aria-hidden="true"></i>
                </button>
            </div>
        `;

        pagination.innerHTML = paginationHTML;

        // Add event listeners
        Utils.$$('.pagination-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page);
                this.showAmortizationPage(scheduleData, page);
            });
        });

        Utils.$('.pagination-prev').addEventListener('click', () => {
            const currentPage = parseInt(Utils.$('.pagination-btn.active')?.dataset.page || '1');
            if (currentPage > 1) {
                this.showAmortizationPage(scheduleData, currentPage - 1);
            }
        });

        Utils.$('.pagination-next').addEventListener('click', () => {
            const currentPage = parseInt(Utils.$('.pagination-btn.active')?.dataset.page || '1');
            if (currentPage < totalPages) {
                this.showAmortizationPage(scheduleData, currentPage + 1);
            }
        });
    },

    showAmortizationPage(scheduleData, page) {
        const itemsPerPage = 12;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, scheduleData.length);
        const pageData = scheduleData.slice(startIndex, endIndex);

        const tableBody = Utils.$('#amortization-body');
        if (!tableBody) return;

        tableBody.innerHTML = pageData.map(row => `
            <tr>
                <td>${row.paymentNumber}</td>
                <td>${Utils.formatDate(row.date)}</td>
                <td class="currency">${Utils.formatCurrency(row.payment, 2)}</td>
                <td class="currency">${Utils.formatCurrency(row.principal, 2)}</td>
                <td class="currency">${Utils.formatCurrency(row.interest, 2)}</td>
                <td class="currency">${Utils.formatCurrency(row.balance, 2)}</td>
                <td class="currency">${Utils.formatCurrency(row.equity, 2)}</td>
            </tr>
        `).join('');

        // Update pagination UI
        Utils.$$('.pagination-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.page === page.toString()) {
                btn.classList.add('active');
            }
        });

        // Update prev/next buttons
        const totalPages = Math.ceil(scheduleData.length / itemsPerPage);
        Utils.$('.pagination-prev').disabled = page === 1;
        Utils.$('.pagination-next').disabled = page === totalPages;
    },

    updatePMIAlert(results) {
        const pmiAlert = Utils.$('#pmi-alert');
        if (!pmiAlert) return;

        if (results.monthlyPMI > 0) {
            pmiAlert.classList.remove('hidden');
            const alertText = pmiAlert.querySelector('.alert-content');
            if (alertText) {
                alertText.innerHTML = `
                    <strong>PMI Required:</strong> Down payments below 20% require Private Mortgage Insurance, 
                    adding ${Utils.formatCurrency(results.monthlyPMI)} to your monthly payment. 
                    <button type="button" class="alert-action">Learn More</button>
                `;
            }
        } else {
            pmiAlert.classList.add('hidden');
        }
    },

    switchDownPaymentMode(mode) {
        const tabAmount = Utils.$('#tab-amount');
        const tabPercent = Utils.$('#tab-percent');
        const amountPanel = Utils.$('#dp-amount-panel');
        const percentPanel = Utils.$('#dp-percent-panel');

        if (mode === 'amount') {
            tabAmount.classList.add('active');
            tabPercent.classList.remove('active');
            amountPanel.classList.add('active');
            percentPanel.classList.remove('active');
        } else {
            tabAmount.classList.remove('active');
            tabPercent.classList.add('active');
            amountPanel.classList.remove('active');
            percentPanel.classList.add('active');
        }
    },

    syncDownPayment(isFromPercent) {
        const homePrice = parseFloat(Utils.$('#home-price').value) || 0;
        const dpAmount = Utils.$('#dp-amount');
        const dpPercent = Utils.$('#dp-percent');

        if (isFromPercent && dpPercent) {
            const percentValue = parseFloat(dpPercent.value) || 0;
            const amountValue = (homePrice * percentValue) / 100;
            dpAmount.value = Math.round(amountValue);
        } else if (dpAmount) {
            const amountValue = parseFloat(dpAmount.value) || 0;
            const percentValue = (amountValue / homePrice) * 100;
            dpPercent.value = percentValue.toFixed(1);
        }
    },

    setLoanTerm(term, isCustom = false) {
        // Update term chips
        Utils.$$('.term-chip').forEach(chip => {
            chip.classList.remove('active');
            if (!isCustom && parseInt(chip.dataset.term) === term) {
                chip.classList.add('active');
            }
        });

        // Update custom input if needed
        if (isCustom) {
            const customInput = Utils.$('#loan-term-custom');
            if (customInput) {
                customInput.value = term;
            }
        }
    },

    updatePropertyTax(stateCode) {
        const stateData = STATE_TAX_RATES[stateCode];
        const propertyTaxInput = Utils.$('#property-tax');
        
        if (stateData && propertyTaxInput && !propertyTaxInput.value) {
            const homePrice = parseFloat(Utils.$('#home-price').value) || 400000;
            const estimatedTax = (homePrice * stateData.rate);
            propertyTaxInput.value = Math.round(estimatedTax);
        }
    },

    updateLoanTypeUI(loanType) {
        const loanConfig = MortgageCalculator.config.loanTypes[loanType];
        const downPaymentPercent = parseFloat(Utils.$('#dp-percent').value) || 0;
        
        // Update PMI visibility
        const pmiInput = Utils.$('#pmi-rate');
        if (pmiInput) {
            if (loanConfig.pmiRequired) {
                pmiInput.closest('.form-group').classList.remove('hidden');
            } else {
                pmiInput.closest('.form-group').classList.add('hidden');
            }
        }
        
        // Update down payment help text
        const dpHelp = Utils.$('#dp-percent-help');
        if (dpHelp) {
            dpHelp.innerHTML = `
                <i class="fas fa-lightbulb" aria-hidden="true"></i>
                Minimum down payment: ${(loanConfig.minDownPayment * 100)}%
                ${loanConfig.pmiRequired ? `, PMI required below ${loanConfig.pmiThreshold * 100}%` : ''}
            `;
        }
    },

    resetForm() {
        const form = Utils.$('#mortgage-form');
        if (form) {
            form.reset();
            this.setDefaultValues();
            
            // Clear all validation errors
            MortgageCalculator.state.validationErrors.forEach((_, fieldId) => {
                FormValidator.clearError(fieldId);
            });
            
            // Reset UI elements
            Utils.$('#results-summary').classList.add('hidden');
            Utils.$('#ai-insights').classList.add('hidden');
            Utils.$('#amortization-body').innerHTML = '';
            
            // Reset chart
            if (ChartManager.chart) {
                ChartManager.chart.destroy();
                ChartManager.chart = null;
            }
            
            NotificationManager.show('Form has been reset to default values.', 'success');
            
            Analytics.trackEvent('form_reset');
        }
    },

    showLeadModal() {
        const modal = Utils.$('#lead-modal');
        if (modal) {
            modal.setAttribute('aria-hidden', 'false');
            modal.style.display = 'flex';
            
            // Focus on first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                firstInput.focus();
            }
        }
    },

    hideLeadModal() {
        const modal = Utils.$('#lead-modal');
        if (modal) {
            modal.setAttribute('aria-hidden', 'true');
            modal.style.display = 'none';
        }
    },

    handleLeadSubmission() {
        const form = Utils.$('#lead-form');
        if (!form) return;

        if (FormValidator.validateForm('lead-form')) {
            // Simulate form submission
            const formData = new FormData(form);
            const leadData = Object.fromEntries(formData.entries());
            
            // Show success message
            NotificationManager.show('Thank you! We\'ll connect you with lenders shortly.', 'success');
            
            // Hide modal
            this.hideLeadModal();
            
            // Reset form
            form.reset();
            
            // Track conversion
            Analytics.trackFormSubmission('lead_generation', true);
            Analytics.trackEvent('lead_submitted', {
                ...leadData,
                credit_score: leadData.creditScore || 'unknown'
            });
        }
    },

    formatPhoneNumber(phone) {
        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '');
        
        // Format based on length
        if (cleaned.length <= 3) {
            return cleaned;
        } else if (cleaned.length <= 6) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        } else {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
        }
    },

    shareResults() {
        if (navigator.share) {
            navigator.share({
                title: 'My Mortgage Calculation',
                text: `My estimated mortgage payment is ${Utils.formatCurrency(MortgageCalculator.state.currentCalculation.totalMonthly)} per month. Check out this calculator!`,
                url: window.location.href
            }).then(() => {
                Analytics.trackEvent('share_results');
            }).catch((error) => {
                console.log('Sharing failed:', error);
                this.copyShareLink();
            });
        } else {
            this.copyShareLink();
        }
    },

    copyShareLink() {
        navigator.clipboard.writeText(window.location.href).then(() => {
            NotificationManager.show('Link copied to clipboard!', 'success');
            Analytics.trackEvent('copy_share_link');
        }).catch(() => {
            NotificationManager.show('Failed to copy link. Please try again.', 'error');
        });
    },

    emailResults() {
        if (MortgageCalculator.state.currentCalculation) {
            const results = MortgageCalculator.state.currentCalculation;
            const subject = encodeURIComponent('My Mortgage Calculation Results');
            const body = encodeURIComponent(`
                Mortgage Calculation Results:
                
                Home Price: ${Utils.formatCurrency(results.inputs.homePrice)}
                Down Payment: ${Utils.formatCurrency(results.downPaymentAmount)} (${results.downPaymentPercent.toFixed(1)}%)
                Loan Amount: ${Utils.formatCurrency(results.loanAmount)}
                Interest Rate: ${results.inputs.interestRate}%
                Loan Term: ${results.inputs.loanTerm} years
                
                Monthly Payment: ${Utils.formatCurrency(results.totalMonthly)}
                - Principal & Interest: ${Utils.formatCurrency(results.monthlyPI)}
                - Property Tax: ${Utils.formatCurrency(results.monthlyTax)}
                - Home Insurance: ${Utils.formatCurrency(results.monthlyInsurance)}
                ${results.monthlyPMI > 0 ? `- PMI: ${Utils.formatCurrency(results.monthlyPMI)}` : ''}
                ${results.monthlyHOA > 0 ? `- HOA Fees: ${Utils.formatCurrency(results.monthlyHOA)}` : ''}
                
                Total Interest: ${Utils.formatCurrency(results.totalInterest)}
                Total Cost: ${Utils.formatCurrency(results.totalCost)}
                
                Generated by FinGuid Mortgage Calculator: ${window.location.href}
            `);
            
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
            
            Analytics.trackEvent('email_results');
        }
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check for browser compatibility
    if (!('querySelector' in document) || !('addEventListener' in window)) {
        alert('Your browser is not supported. Please upgrade to a modern browser.');
        return;
    }

    // Initialize the app
    App.init();

    // Service Worker registration for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then((registration) => {
                console.log('SW registered: ', registration);
            }).catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
        });
    }
});

// Handle page visibility changes for performance
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Page became visible, check if we need to refresh data
        const lastCalculated = MortgageCalculator.state.performanceMetrics.lastCalculated;
        if (lastCalculated && (Date.now() - lastCalculated.getTime()) > 300000) { // 5 minutes
            App.calculateMortgage();
        }
    }
});

// Error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    Analytics.trackEvent('javascript_error', {
        message: event.error?.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

// Performance monitoring
window.addEventListener('load', () => {
    // Report load time to analytics
    const loadTime = performance.now();
    Analytics.trackEvent('page_load_complete', {
        load_time: loadTime,
        dom_content_loaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        load_event_end: performance.timing.loadEventEnd - performance.timing.navigationStart
    });
});
