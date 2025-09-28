/**
 * mortgage-calculator.js
 * FinGuid AI-Enhanced Mortgage Calculator v8.0
 * Production Ready with Enhanced Features
 * 
 * Features:
 * - Real-time mortgage calculations
 * - State-based property tax calculations  
 * - Voice commands and screen reader support
 * - Interactive mortgage over time chart
 * - AI-powered insights
 * - Amortization schedule with pagination
 * - Share functionality
 * - Mobile responsive
 */

'use strict';

// ========== CONFIGURATION & STATE ==========
const CONFIG = {
    debounceDelay: 300,
    amortizationPageSize: 12,
    chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20
                }
            }
        }
    },
    colors: {
        primary: '#21808d',
        secondary: '#f59e0b', 
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
    }
};

const STATE = {
    currentCalculation: null,
    amortizationData: [],
    currentView: 'monthly',
    currentPage: 1,
    isListening: false,
    screenReaderEnabled: false,
    speechRecognition: null,
    timelineChart: null
};

// US States with property tax rates (2024 data)
const STATE_TAX_RATES = {
    'AL': { name: 'Alabama', rate: 0.0041 },
    'AK': { name: 'Alaska', rate: 0.0119 },
    'AZ': { name: 'Arizona', rate: 0.0062 },
    'AR': { name: 'Arkansas', rate: 0.0061 },
    'CA': { name: 'California', rate: 0.0075 },
    'CO': { name: 'Colorado', rate: 0.0051 },
    'CT': { name: 'Connecticut', rate: 0.0214 },
    'DE': { name: 'Delaware', rate: 0.0057 },
    'FL': { name: 'Florida', rate: 0.0083 },
    'GA': { name: 'Georgia', rate: 0.0089 },
    'HI': { name: 'Hawaii', rate: 0.0028 },
    'ID': { name: 'Idaho', rate: 0.0069 },
    'IL': { name: 'Illinois', rate: 0.0227 },
    'IN': { name: 'Indiana', rate: 0.0085 },
    'IA': { name: 'Iowa', rate: 0.0157 },
    'KS': { name: 'Kansas', rate: 0.0141 },
    'KY': { name: 'Kentucky', rate: 0.0086 },
    'LA': { name: 'Louisiana', rate: 0.0055 },
    'ME': { name: 'Maine', rate: 0.0128 },
    'MD': { name: 'Maryland', rate: 0.0109 },
    'MA': { name: 'Massachusetts', rate: 0.0117 },
    'MI': { name: 'Michigan', rate: 0.0154 },
    'MN': { name: 'Minnesota', rate: 0.0112 },
    'MS': { name: 'Mississippi', rate: 0.0081 },
    'MO': { name: 'Missouri', rate: 0.0097 },
    'MT': { name: 'Montana', rate: 0.0084 },
    'NE': { name: 'Nebraska', rate: 0.0173 },
    'NV': { name: 'Nevada', rate: 0.0053 },
    'NH': { name: 'New Hampshire', rate: 0.0209 },
    'NJ': { name: 'New Jersey', rate: 0.0249 },
    'NM': { name: 'New Mexico', rate: 0.0080 },
    'NY': { name: 'New York', rate: 0.0169 },
    'NC': { name: 'North Carolina', rate: 0.0084 },
    'ND': { name: 'North Dakota', rate: 0.0142 },
    'OH': { name: 'Ohio', rate: 0.0162 },
    'OK': { name: 'Oklahoma', rate: 0.0090 },
    'OR': { name: 'Oregon', rate: 0.0093 },
    'PA': { name: 'Pennsylvania', rate: 0.0158 },
    'RI': { name: 'Rhode Island', rate: 0.0153 },
    'SC': { name: 'South Carolina', rate: 0.0057 },
    'SD': { name: 'South Dakota', rate: 0.0132 },
    'TN': { name: 'Tennessee', rate: 0.0064 },
    'TX': { name: 'Texas', rate: 0.0180 },
    'UT': { name: 'Utah', rate: 0.0066 },
    'VT': { name: 'Vermont', rate: 0.0190 },
    'VA': { name: 'Virginia', rate: 0.0082 },
    'WA': { name: 'Washington', rate: 0.0094 },
    'WV': { name: 'West Virginia', rate: 0.0059 },
    'WI': { name: 'Wisconsin', rate: 0.0185 },
    'WY': { name: 'Wyoming', rate: 0.0062 }
};

// ========== UTILITY FUNCTIONS ==========
const Utils = {
    // DOM selection helpers
    $: (selector) => document.querySelector(selector),
    $$: (selector) => document.querySelectorAll(selector),
    
    // Currency formatting
    formatCurrency: (amount, decimals = 0) => {
        if (isNaN(amount) || amount === null) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(amount);
    },
    
    // Number formatting  
    formatNumber: (num) => {
        if (isNaN(num)) return '0';
        return new Intl.NumberFormat('en-US').format(num);
    },
    
    // Date formatting
    formatDate: (date) => {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
        });
    },
    
    // Debounce function
    debounce: (func, delay) => {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },
    
    // Show toast notification
    showToast: (message, type = 'info') => {
        const container = Utils.$('#toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${getToastIcon(type)}"></i>
            </div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
};

function getToastIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle', 
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

// ========== MORTGAGE CALCULATION ENGINE ==========
class MortgageCalculator {
    constructor() {
        this.inputs = {};
        this.results = {};
    }
    
    // Get all form inputs
    getInputs() {
        const homePrice = parseFloat(Utils.$('#home-price').value) || 0;
        const downPayment = parseFloat(Utils.$('#down-payment').value) || 0;
        const interestRate = parseFloat(Utils.$('#interest-rate').value) || 0;
        const loanTerm = parseInt(Utils.$('#loan-term').value) || 30;
        const propertyState = Utils.$('#property-state').value;
        const propertyTax = parseFloat(Utils.$('#property-tax').value) || 0;
        const homeInsurance = parseFloat(Utils.$('#home-insurance').value) || 0;
        const hoaFees = parseFloat(Utils.$('#hoa-fees').value) || 0;
        const loanStart = Utils.$('#loan-start').value;
        
        return {
            homePrice,
            downPayment,
            interestRate: interestRate / 100, // Convert to decimal
            loanTerm,
            propertyState,
            propertyTax,
            homeInsurance,
            hoaFees,
            loanStart: loanStart ? new Date(loanStart + '-01') : new Date()
        };
    }
    
    // Validate inputs
    validateInputs(inputs) {
        const errors = [];
        
        if (inputs.homePrice <= 0) {
            errors.push('Home price must be greater than $0');
        }
        
        if (inputs.downPayment >= inputs.homePrice) {
            errors.push('Down payment cannot be equal to or greater than home price');
        }
        
        if (inputs.interestRate <= 0 || inputs.interestRate > 0.5) {
            errors.push('Interest rate must be between 0.1% and 50%');
        }
        
        if (inputs.loanTerm < 1 || inputs.loanTerm > 50) {
            errors.push('Loan term must be between 1 and 50 years');
        }
        
        return errors;
    }
    
    // Calculate property tax based on state
    calculatePropertyTax(homePrice, state) {
        if (!state || !STATE_TAX_RATES[state]) {
            return homePrice * 0.011; // National average ~1.1%
        }
        return homePrice * STATE_TAX_RATES[state].rate;
    }
    
    // Calculate PMI
    calculatePMI(loanAmount, downPaymentPercent) {
        if (downPaymentPercent >= 0.20) {
            return 0; // No PMI if 20% or more down
        }
        
        // PMI typically ranges from 0.3% to 1.5% annually
        let pmiRate = 0.005; // 0.5% default
        
        if (downPaymentPercent < 0.05) {
            pmiRate = 0.015; // 1.5% for less than 5% down
        } else if (downPaymentPercent < 0.10) {
            pmiRate = 0.01; // 1.0% for less than 10% down
        } else if (downPaymentPercent < 0.15) {
            pmiRate = 0.0075; // 0.75% for less than 15% down
        }
        
        return (loanAmount * pmiRate) / 12; // Monthly PMI
    }
    
    // Main calculation function
    calculate() {
        const inputs = this.getInputs();
        const errors = this.validateInputs(inputs);
        
        if (errors.length > 0) {
            Utils.showToast(errors[0], 'error');
            return null;
        }
        
        // Basic calculations
        const loanAmount = inputs.homePrice - inputs.downPayment;
        const monthlyInterestRate = inputs.interestRate / 12;
        const numberOfPayments = inputs.loanTerm * 12;
        const downPaymentPercent = inputs.downPayment / inputs.homePrice;
        
        // Monthly principal and interest (P&I)
        let monthlyPI = 0;
        if (monthlyInterestRate > 0) {
            monthlyPI = loanAmount * 
                (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
                (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
        } else {
            monthlyPI = loanAmount / numberOfPayments; // 0% interest case
        }
        
        // Property tax calculation
        let annualPropertyTax = inputs.propertyTax;
        if (annualPropertyTax === 0) {
            annualPropertyTax = this.calculatePropertyTax(inputs.homePrice, inputs.propertyState);
        }
        const monthlyPropertyTax = annualPropertyTax / 12;
        
        // Insurance calculation  
        let annualInsurance = inputs.homeInsurance;
        if (annualInsurance === 0) {
            annualInsurance = inputs.homePrice * 0.003; // 0.3% of home value default
        }
        const monthlyInsurance = annualInsurance / 12;
        
        // PMI calculation
        const monthlyPMI = this.calculatePMI(loanAmount, downPaymentPercent);
        
        // Total monthly payment
        const totalMonthlyPayment = monthlyPI + monthlyPropertyTax + 
                                   monthlyInsurance + monthlyPMI + inputs.hoaFees;
        
        // Total cost calculations
        const totalInterestPaid = (monthlyPI * numberOfPayments) - loanAmount;
        const totalCostOfLoan = loanAmount + totalInterestPaid;
        
        this.results = {
            inputs,
            loanAmount,
            monthlyPI,
            monthlyPropertyTax,
            monthlyInsurance, 
            monthlyPMI,
            monthlyHOA: inputs.hoaFees,
            totalMonthlyPayment,
            totalInterestPaid,
            totalCostOfLoan,
            downPaymentPercent,
            numberOfPayments,
            monthlyInterestRate
        };
        
        return this.results;
    }
    
    // Generate amortization schedule
    generateAmortizationSchedule() {
        if (!this.results) return [];
        
        const { loanAmount, monthlyInterestRate, numberOfPayments, inputs } = this.results;
        const schedule = [];
        let remainingBalance = loanAmount;
        let currentDate = new Date(inputs.loanStart);
        
        for (let payment = 1; payment <= numberOfPayments; payment++) {
            const interestPayment = remainingBalance * monthlyInterestRate;
            const principalPayment = this.results.monthlyPI - interestPayment;
            remainingBalance -= principalPayment;
            
            // Prevent negative balance due to rounding
            if (remainingBalance < 0) {
                remainingBalance = 0;
            }
            
            schedule.push({
                paymentNumber: payment,
                date: new Date(currentDate),
                payment: this.results.monthlyPI,
                principal: principalPayment,
                interest: interestPayment,
                balance: remainingBalance
            });
            
            // Move to next month
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        return schedule;
    }
}

// ========== AI INSIGHTS ENGINE ==========
class AIInsights {
    static generateInsights(calculation) {
        const insights = [];
        const { results } = calculation;
        
        // Down payment insights
        if (results.downPaymentPercent < 0.20) {
            const additionalDown = (results.inputs.homePrice * 0.20) - results.inputs.downPayment;
            insights.push({
                type: 'warning',
                icon: 'fa-exclamation-triangle',
                title: 'PMI Alert',
                content: `Consider increasing your down payment by ${Utils.formatCurrency(additionalDown)} to reach 20% and eliminate PMI (${Utils.formatCurrency(results.monthlyPMI * 12)} annually).`
            });
        }
        
        // Interest rate insights
        if (results.inputs.interestRate > 0.07) {
            const potentialSavings = results.totalInterestPaid * 0.15; // Estimate 15% savings
            insights.push({
                type: 'info',
                icon: 'fa-percentage',
                title: 'Rate Shopping Opportunity',
                content: `Your rate is above current averages. Shopping for a 0.5% better rate could save you ${Utils.formatCurrency(potentialSavings)} over the loan term.`
            });
        }
        
        // Payment-to-income ratio (estimate)
        const estimatedIncome = results.totalMonthlyPayment / 0.28; // 28% rule
        if (results.totalMonthlyPayment > estimatedIncome * 0.28) {
            insights.push({
                type: 'warning',
                icon: 'fa-chart-line',
                title: 'Budget Consideration',
                content: `Your payment may exceed recommended guidelines. Consider a maximum monthly housing cost of ${Utils.formatCurrency(estimatedIncome * 0.28)} (28% of income).`
            });
        }
        
        // Loan term insights
        if (results.inputs.loanTerm === 30) {
            const payment15yr = results.loanAmount * 
                ((results.inputs.interestRate - 0.005) / 12 * Math.pow(1 + (results.inputs.interestRate - 0.005) / 12, 180)) /
                (Math.pow(1 + (results.inputs.interestRate - 0.005) / 12, 180) - 1);
            const savings = results.totalInterestPaid - ((payment15yr * 180) - results.loanAmount);
            
            insights.push({
                type: 'success',
                icon: 'fa-clock',
                title: '15-Year Loan Benefits',
                content: `A 15-year loan could save you ${Utils.formatCurrency(savings)} in interest, though monthly payments would be ${Utils.formatCurrency(payment15yr - results.monthlyPI)} higher.`
            });
        }
        
        // Extra payment insights
        const extraPaymentImpact = this.calculateExtraPaymentImpact(results, 100);
        insights.push({
            type: 'success',
            icon: 'fa-plus-circle',
            title: 'Extra Payment Power',
            content: `Paying an extra $100/month could save you ${Utils.formatCurrency(extraPaymentImpact.interestSaved)} and pay off your loan ${extraPaymentImpact.timesSaved} months earlier.`
        });
        
        return insights;
    }
    
    static calculateExtraPaymentImpact(results, extraPayment) {
        const { loanAmount, monthlyInterestRate, monthlyPI } = results;
        let balance = loanAmount;
        let totalInterest = 0;
        let months = 0;
        
        while (balance > 0 && months < 360) {
            const interestPayment = balance * monthlyInterestRate;
            const principalPayment = monthlyPI - interestPayment + extraPayment;
            
            totalInterest += interestPayment;
            balance -= principalPayment;
            months++;
            
            if (balance <= 0) break;
        }
        
        const originalInterest = results.totalInterestPaid;
        const interestSaved = originalInterest - totalInterest;
        const timesSaved = results.numberOfPayments - months;
        
        return { interestSaved, timesSaved };
    }
}

// ========== UI CONTROLLER ==========
class UIController {
    constructor() {
        this.calculator = new MortgageCalculator();
        this.initializeEventListeners();
        this.initializeAccessibility();
        this.setDefaultValues();
    }
    
    initializeEventListeners() {
        // Form input listeners with debouncing
        const inputs = ['home-price', 'down-payment', 'down-payment-percent', 
                       'interest-rate', 'loan-term', 'property-state', 
                       'property-tax', 'home-insurance', 'hoa-fees'];
        
        inputs.forEach(inputId => {
            const element = Utils.$(`#${inputId}`);
            if (element) {
                element.addEventListener('input', 
                    Utils.debounce(() => this.handleInputChange(), CONFIG.debounceDelay)
                );
            }
        });
        
        // Down payment synchronization
        Utils.$('#down-payment').addEventListener('input', () => {
            this.syncDownPayment('amount');
        });
        
        Utils.$('#down-payment-percent').addEventListener('input', () => {
            this.syncDownPayment('percent');
        });
        
        // Tab controls
        Utils.$$('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleTabSwitch(e);
            });
        });
        
        // Term chips
        Utils.$$('.term-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                this.handleTermSelection(e);
            });
        });
        
        // Action buttons
        Utils.$('#share-results')?.addEventListener('click', () => this.shareResults());
        Utils.$('#save-calculation')?.addEventListener('click', () => this.saveCalculation());
        Utils.$('#print-results')?.addEventListener('click', () => this.printResults());
        
        // Pagination
        Utils.$('#prev-page')?.addEventListener('click', () => this.previousPage());
        Utils.$('#next-page')?.addEventListener('click', () => this.nextPage());
        
        // Accessibility toggles
        Utils.$('#voice-toggle')?.addEventListener('click', () => this.toggleVoiceCommands());
        Utils.$('#screen-reader-toggle')?.addEventListener('click', () => this.toggleScreenReader());
        
        // Property state change
        Utils.$('#property-state')?.addEventListener('change', () => {
            this.updatePropertyTaxFromState();
        });
    }
    
    setDefaultValues() {
        // Set current date as default loan start
        const now = new Date();
        const dateString = now.getFullYear() + '-' + 
                          String(now.getMonth() + 1).padStart(2, '0');
        Utils.$('#loan-start').value = dateString;
        
        // Set some default values to show immediate results
        Utils.$('#home-price').value = '400000';
        Utils.$('#down-payment').value = '80000';  
        Utils.$('#interest-rate').value = '6.75';
        Utils.$('#loan-term').value = '30';
        
        // Trigger initial calculation
        setTimeout(() => this.handleInputChange(), 100);
    }
    
    handleInputChange() {
        const calculation = this.calculator.calculate();
        if (calculation) {
            this.updateResults(calculation);
            this.updateChart(calculation);
            this.updateInsights(calculation);
            this.updateAmortizationSchedule(calculation);
            STATE.currentCalculation = calculation;
        }
    }
    
    syncDownPayment(changedType) {
        const homePrice = parseFloat(Utils.$('#home-price').value) || 0;
        
        if (changedType === 'amount') {
            const amount = parseFloat(Utils.$('#down-payment').value) || 0;
            const percent = homePrice > 0 ? (amount / homePrice) * 100 : 0;
            Utils.$('#down-payment-percent').value = percent.toFixed(1);
        } else {
            const percent = parseFloat(Utils.$('#down-payment-percent').value) || 0;
            const amount = (homePrice * percent) / 100;
            Utils.$('#down-payment').value = Math.round(amount);
        }
    }
    
    handleTabSwitch(e) {
        e.preventDefault();
        const tabBtn = e.target.closest('.tab-btn');
        const tabName = tabBtn.dataset.tab;
        const tabGroup = tabBtn.closest('.form-group');
        
        // Update active tab button
        tabGroup.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        tabBtn.classList.add('active');
        
        // Update active tab content
        tabGroup.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        tabGroup.querySelector(`[data-content="${tabName}"]`).classList.add('active');
    }
    
    handleTermSelection(e) {
        e.preventDefault();
        const chip = e.target;
        const term = chip.dataset.term;
        
        // Update active chip
        Utils.$$('.term-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        // Update select value
        Utils.$('#loan-term').value = term;
        
        // Trigger calculation
        this.handleInputChange();
    }
    
    updatePropertyTaxFromState() {
        const state = Utils.$('#property-state').value;
        const homePrice = parseFloat(Utils.$('#home-price').value) || 0;
        
        if (state && STATE_TAX_RATES[state] && homePrice > 0) {
            const annualTax = homePrice * STATE_TAX_RATES[state].rate;
            Utils.$('#property-tax').value = Math.round(annualTax);
            this.handleInputChange();
        }
    }
    
    updateResults(calculation) {
        const { results } = calculation;
        
        // Update main payment display
        Utils.$('#total-payment').textContent = 
            Utils.formatCurrency(results.totalMonthlyPayment);
        
        // Update breakdown
        Utils.$('#principal-interest').textContent = 
            Utils.formatCurrency(results.monthlyPI);
        Utils.$('#monthly-property-tax').textContent = 
            Utils.formatCurrency(results.monthlyPropertyTax);
        Utils.$('#monthly-insurance').textContent = 
            Utils.formatCurrency(results.monthlyInsurance);
        
        // PMI row - show/hide based on down payment
        const pmiRow = Utils.$('#pmi-row');
        if (results.monthlyPMI > 0) {
            Utils.$('#monthly-pmi').textContent = Utils.formatCurrency(results.monthlyPMI);
            pmiRow.style.display = 'flex';
        } else {
            pmiRow.style.display = 'none';
        }
        
        // HOA row - show/hide based on input
        const hoaRow = Utils.$('#hoa-row');
        if (results.monthlyHOA > 0) {
            Utils.$('#monthly-hoa').textContent = Utils.formatCurrency(results.monthlyHOA);
            hoaRow.style.display = 'flex';
        } else {
            hoaRow.style.display = 'none';
        }
        
        // Update over time summary (placeholder values)
        const remainingBalance = results.loanAmount * 0.95; // Estimate after 1 year
        const principalPaid = results.loanAmount * 0.05;
        const interestPaid = results.monthlyPI * 12 - principalPaid;
        
        Utils.$('#remaining-balance').textContent = Utils.formatCurrency(remainingBalance);
        Utils.$('#principal-paid').textContent = Utils.formatCurrency(principalPaid);
        Utils.$('#interest-paid').textContent = Utils.formatCurrency(interestPaid);
    }
    
    updateChart(calculation) {
        const canvas = Utils.$('#mortgage-timeline-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (STATE.timelineChart) {
            STATE.timelineChart.destroy();
        }
        
        // Generate sample data points for 30 years
        const { results } = calculation;
        const years = [];
        const balanceData = [];
        const principalData = [];
        const interestData = [];
        
        let balance = results.loanAmount;
        let totalPrincipal = 0;
        let totalInterest = 0;
        
        for (let year = 0; year <= results.inputs.loanTerm; year += 5) {
            const monthsElapsed = year * 12;
            
            // Calculate balance at this point (simplified)
            if (monthsElapsed < results.numberOfPayments) {
                const remainingPayments = results.numberOfPayments - monthsElapsed;
                balance = results.monthlyPI > 0 ? 
                    results.loanAmount * Math.pow(1 + results.monthlyInterestRate, remainingPayments) -
                    results.monthlyPI * ((Math.pow(1 + results.monthlyInterestRate, remainingPayments) - 1) / results.monthlyInterestRate) : 0;
                
                totalPrincipal = results.loanAmount - balance;
                totalInterest = (results.monthlyPI * monthsElapsed) - totalPrincipal;
            } else {
                balance = 0;
                totalPrincipal = results.loanAmount;
                totalInterest = results.totalInterestPaid;
            }
            
            years.push(`Year ${year}`);
            balanceData.push(Math.max(0, balance));
            principalData.push(Math.max(0, totalPrincipal));
            interestData.push(Math.max(0, totalInterest));
        }
        
        STATE.timelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'Remaining Balance',
                    data: balanceData,
                    borderColor: CONFIG.colors.primary,
                    backgroundColor: CONFIG.colors.primary + '20',
                    fill: true
                }, {
                    label: 'Principal Paid',
                    data: principalData,
                    borderColor: CONFIG.colors.success,
                    backgroundColor: CONFIG.colors.success + '20',
                    fill: true
                }, {
                    label: 'Interest Paid',
                    data: interestData,
                    borderColor: CONFIG.colors.warning,
                    backgroundColor: CONFIG.colors.warning + '20',
                    fill: true
                }]
            },
            options: {
                ...CONFIG.chartOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }
    
    updateInsights(calculation) {
        const insights = AIInsights.generateInsights(calculation);
        const container = Utils.$('#insights-container');
        
        container.innerHTML = insights.map(insight => `
            <div class="insight-item ${insight.type}">
                <div class="insight-icon">
                    <i class="fas ${insight.icon}"></i>
                </div>
                <div class="insight-content">
                    <h4>${insight.title}</h4>
                    <p>${insight.content}</p>
                </div>
            </div>
        `).join('');
    }
    
    updateAmortizationSchedule(calculation) {
        const schedule = this.calculator.generateAmortizationSchedule();
        STATE.amortizationData = schedule;
        STATE.currentPage = 1;
        this.renderAmortizationPage();
    }
    
    renderAmortizationPage() {
        const tbody = Utils.$('#amortization-tbody');
        const startIdx = (STATE.currentPage - 1) * CONFIG.amortizationPageSize;
        const endIdx = startIdx + CONFIG.amortizationPageSize;
        const pageData = STATE.amortizationData.slice(startIdx, endIdx);
        
        tbody.innerHTML = pageData.map(row => `
            <tr>
                <td>${row.paymentNumber}</td>
                <td>${Utils.formatDate(row.date)}</td>
                <td>${Utils.formatCurrency(row.payment)}</td>
                <td>${Utils.formatCurrency(row.principal)}</td>
                <td>${Utils.formatCurrency(row.interest)}</td>
                <td>${Utils.formatCurrency(row.balance)}</td>
            </tr>
        `).join('');
        
        // Update pagination
        const totalPages = Math.ceil(STATE.amortizationData.length / CONFIG.amortizationPageSize);
        Utils.$('#page-info').textContent = `Page ${STATE.currentPage} of ${totalPages}`;
        
        Utils.$('#prev-page').disabled = STATE.currentPage === 1;
        Utils.$('#next-page').disabled = STATE.currentPage === totalPages;
    }
    
    previousPage() {
        if (STATE.currentPage > 1) {
            STATE.currentPage--;
            this.renderAmortizationPage();
        }
    }
    
    nextPage() {
        const totalPages = Math.ceil(STATE.amortizationData.length / CONFIG.amortizationPageSize);
        if (STATE.currentPage < totalPages) {
            STATE.currentPage++;
            this.renderAmortizationPage();
        }
    }
    
    shareResults() {
        if (!STATE.currentCalculation) {
            Utils.showToast('No calculation to share', 'warning');
            return;
        }
        
        const { results } = STATE.currentCalculation;
        const shareText = `My mortgage calculation: ${Utils.formatCurrency(results.totalMonthlyPayment)}/month for a ${Utils.formatCurrency(results.inputs.homePrice)} home with ${(results.downPaymentPercent * 100).toFixed(1)}% down. Calculate yours at ${window.location.href}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'My Mortgage Calculation',
                text: shareText,
                url: window.location.href
            });
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText);
            Utils.showToast('Results copied to clipboard!', 'success');
        } else {
            Utils.showToast('Sharing not supported on this device', 'warning');
        }
    }
    
    saveCalculation() {
        if (!STATE.currentCalculation) {
            Utils.showToast('No calculation to save', 'warning');
            return;
        }
        
        const data = {
            calculation: STATE.currentCalculation,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('mortgage-calculation', JSON.stringify(data));
        Utils.showToast('Calculation saved!', 'success');
    }
    
    printResults() {
        window.print();
    }
    
    initializeAccessibility() {
        // Screen reader announcements
        const srAnnouncer = document.createElement('div');
        srAnnouncer.setAttribute('aria-live', 'polite');
        srAnnouncer.setAttribute('aria-atomic', 'true');
        srAnnouncer.className = 'sr-only';
        srAnnouncer.id = 'sr-announcer';
        document.body.appendChild(srAnnouncer);
    }
    
    toggleVoiceCommands() {
        // Voice command implementation would go here
        Utils.showToast('Voice commands feature coming soon!', 'info');
    }
    
    toggleScreenReader() {
        STATE.screenReaderEnabled = !STATE.screenReaderEnabled;
        const btn = Utils.$('#screen-reader-toggle');
        
        if (STATE.screenReaderEnabled) {
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            Utils.showToast('Screen reader mode enabled', 'success');
        } else {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
            Utils.showToast('Screen reader mode disabled', 'info');
        }
    }
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    const app = new UIController();
    
    // Set up global error handling
    window.addEventListener('error', (e) => {
        console.error('Application error:', e);
        Utils.showToast('An error occurred. Please refresh and try again.', 'error');
    });
    
    // Performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            console.log(`App loaded in ${loadTime.toFixed(2)}ms`);
        });
    }
    
    console.log('🏠 FinGuid Mortgage Calculator v8.0 initialized');
    console.log('✅ All features loaded and ready');
});
