/**
 * mortgage-calculator-enhanced.js
 * Enhanced Mortgage Calculator with all requested features
 * Features: Auto PMI calculation, better chart, extra payments, sharing, UI improvements
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
                    padding: 20,
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#21808d',
                borderWidth: 1
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0,0,0,0.1)'
                },
                ticks: {
                    callback: function(value) {
                        return Utils.formatCurrency(value);
                    }
                }
            },
            x: {
                grid: {
                    color: 'rgba(0,0,0,0.1)'
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
    timelineChart: null,
    isCalculating: false
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
    $: (selector) => document.querySelector(selector),
    $$: (selector) => document.querySelectorAll(selector),

    formatCurrency: (amount, decimals = 0) => {
        if (isNaN(amount) || amount === null) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(amount);
    },

    formatNumber: (num) => {
        if (isNaN(num)) return '0';
        return new Intl.NumberFormat('en-US').format(num);
    },

    formatDate: (date) => {
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    },

    debounce: (func, delay) => {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    showToast: (message, type = 'info') => {
        const container = Utils.$('#toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<div class="toast-content">${message}</div>`;
        
        container.appendChild(toast);
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 4000);
    },

    showLoading: () => {
        const overlay = Utils.$('#loading-overlay');
        if (overlay) overlay.style.display = 'flex';
    },

    hideLoading: () => {
        const overlay = Utils.$('#loading-overlay');
        if (overlay) overlay.style.display = 'none';
    }
};

// ========== MORTGAGE CALCULATION ENGINE ==========
const MortgageCalculator = {
    calculateMonthlyPayment: (principal, annualRate, years) => {
        const monthlyRate = annualRate / 100 / 12;
        const numPayments = years * 12;
        
        if (monthlyRate === 0) {
            return principal / numPayments;
        }
        
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
               (Math.pow(1 + monthlyRate, numPayments) - 1);
    },

    // Auto-calculate PMI based on down payment percentage
    calculatePMI: (loanAmount, downPaymentPercent) => {
        if (downPaymentPercent >= 20) {
            return 0; // No PMI needed for 20%+ down payment
        }
        
        // Typical PMI is 0.3% to 1.15% annually, average ~0.6%
        const annualPMIRate = 0.006; // 0.6%
        return Math.round((loanAmount * annualPMIRate) / 12);
    },

    calculateMortgage: (params) => {
        const {
            homePrice,
            downPayment,
            interestRate,
            loanTerm,
            propertyTax,
            homeInsurance,
            extraMonthly = 0,
            extraOnetime = 0
        } = params;

        const principal = homePrice - downPayment;
        const downPaymentPercent = (downPayment / homePrice) * 100;
        
        // Auto-calculate PMI
        const monthlyPmi = MortgageCalculator.calculatePMI(principal, downPaymentPercent);
        
        const monthlyPayment = MortgageCalculator.calculateMonthlyPayment(principal, interestRate, loanTerm);
        
        // Monthly breakdown
        const monthlyTax = propertyTax / 12;
        const monthlyInsurance = homeInsurance / 12;
        
        const totalMonthly = monthlyPayment + monthlyTax + monthlyInsurance + monthlyPmi;

        // Generate amortization schedule with extra payments
        const amortization = MortgageCalculator.generateAmortizationSchedule({
            principal,
            monthlyPayment,
            interestRate,
            extraMonthly,
            extraOnetime,
            loanTerm
        });

        const totalInterest = amortization.reduce((sum, payment) => sum + payment.interest, 0);
        const totalCost = principal + totalInterest;
        const payoffDate = amortization.length > 0 ? amortization[amortization.length - 1].date : null;

        return {
            loanAmount: principal,
            monthlyPayment: totalMonthly,
            principalAndInterest: monthlyPayment,
            monthlyTax,
            monthlyInsurance,
            monthlyPmi,
            totalInterest,
            totalCost,
            payoffDate,
            amortization,
            downPaymentAmount: downPayment,
            homePrice,
            downPaymentPercent
        };
    },

    generateAmortizationSchedule: (params) => {
        const {
            principal,
            monthlyPayment,
            interestRate,
            extraMonthly = 0,
            extraOnetime = 0,
            loanTerm
        } = params;

        const monthlyRate = interestRate / 100 / 12;
        const schedule = [];
        let balance = principal;
        let paymentNumber = 1;
        
        const startDate = new Date();

        while (balance > 0.01) {
            const currentDate = new Date(startDate);
            currentDate.setMonth(currentDate.getMonth() + paymentNumber - 1);

            const interestPayment = balance * monthlyRate;
            let principalPayment = monthlyPayment - interestPayment;
            
            // Apply extra payments
            let extraPayment = extraMonthly;
            
            // Apply one-time extra payment at month 12
            if (paymentNumber === 12 && extraOnetime > 0) {
                extraPayment += extraOnetime;
            }

            principalPayment += extraPayment;

            // Don't pay more than remaining balance
            if (principalPayment > balance) {
                principalPayment = balance;
            }

            balance -= principalPayment;

            schedule.push({
                paymentNumber,
                date: new Date(currentDate),
                payment: monthlyPayment + extraPayment,
                principal: principalPayment,
                interest: interestPayment,
                balance: Math.max(0, balance),
                extraPayment
            });

            paymentNumber++;

            // Safety break
            if (paymentNumber > 600) break; // Max 50 years
        }

        return schedule;
    }
};

// ========== CHART RENDERING ==========
const ChartManager = {
    renderTimelineChart: (calculation) => {
        const ctx = Utils.$('#mortgage-timeline-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (STATE.timelineChart) {
            STATE.timelineChart.destroy();
        }

        const { amortization } = calculation;
        const yearlyData = ChartManager.aggregateYearlyData(amortization);
        
        // Get current year range from slider
        const yearRange = parseInt(Utils.$('#year-range')?.value || 30);
        const filteredData = yearlyData.slice(0, yearRange);

        const config = {
            type: 'line',
            data: {
                labels: filteredData.map(item => `Year ${item.year - filteredData[0].year + 1}`),
                datasets: [
                    {
                        label: 'Remaining Balance',
                        data: filteredData.map(item => item.balance),
                        borderColor: CONFIG.colors.error,
                        backgroundColor: CONFIG.colors.error + '20',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Principal Paid',
                        data: filteredData.map(item => item.cumulativePrincipal),
                        borderColor: CONFIG.colors.success,
                        backgroundColor: CONFIG.colors.success + '20',
                        fill: false,
                        tension: 0.3,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Interest Paid',
                        data: filteredData.map(item => item.cumulativeInterest),
                        borderColor: CONFIG.colors.warning,
                        backgroundColor: CONFIG.colors.warning + '20',
                        fill: false,
                        tension: 0.3,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                ...CONFIG.chartOptions,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    ...CONFIG.chartOptions.plugins,
                    tooltip: {
                        ...CONFIG.chartOptions.plugins.tooltip,
                        callbacks: {
                            title: function(context) {
                                return `Year ${context[0].dataIndex + 1}`;
                            },
                            label: function(context) {
                                return `${context.dataset.label}: ${Utils.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                }
            }
        };

        STATE.timelineChart = new Chart(ctx, config);
    },

    aggregateYearlyData: (amortization) => {
        const yearlyData = [];
        let currentYear = null;
        let yearData = {
            year: null,
            balance: 0,
            yearlyPrincipal: 0,
            yearlyInterest: 0,
            cumulativePrincipal: 0,
            cumulativeInterest: 0
        };

        let totalPrincipal = 0;
        let totalInterest = 0;

        amortization.forEach(payment => {
            const year = payment.date.getFullYear();
            
            if (currentYear !== year) {
                if (currentYear) {
                    yearlyData.push({ ...yearData });
                }
                
                currentYear = year;
                yearData = {
                    year,
                    balance: payment.balance,
                    yearlyPrincipal: 0,
                    yearlyInterest: 0,
                    cumulativePrincipal: totalPrincipal,
                    cumulativeInterest: totalInterest
                };
            }
            
            yearData.balance = payment.balance;
            yearData.yearlyPrincipal += payment.principal;
            yearData.yearlyInterest += payment.interest;
            
            totalPrincipal += payment.principal;
            totalInterest += payment.interest;
            
            yearData.cumulativePrincipal = totalPrincipal;
            yearData.cumulativeInterest = totalInterest;
        });

        if (currentYear) {
            yearlyData.push(yearData);
        }

        return yearlyData;
    }
};

// ========== AI INSIGHTS GENERATOR ==========
const AIInsights = {
    generateInsights: (calculation) => {
        const insights = [];
        const { 
            loanAmount, 
            totalInterest, 
            monthlyPayment, 
            downPaymentAmount, 
            homePrice,
            downPaymentPercent,
            monthlyPmi,
            amortization 
        } = calculation;

        // Down payment analysis
        if (downPaymentPercent < 20) {
            insights.push({
                type: 'warning',
                icon: '⚠️',
                title: 'PMI Required',
                content: `Your ${downPaymentPercent.toFixed(1)}% down payment requires PMI (${Utils.formatCurrency(monthlyPmi)}/month). Consider saving for 20% down to eliminate this cost.`
            });
        } else {
            insights.push({
                type: 'success',
                icon: '✅',
                title: 'No PMI Required',
                content: `Excellent! Your ${downPaymentPercent.toFixed(1)}% down payment eliminates PMI, saving you money each month.`
            });
        }

        // Interest ratio analysis
        const interestRatio = (totalInterest / loanAmount) * 100;
        if (interestRatio > 80) {
            insights.push({
                type: 'info',
                icon: '📊',
                title: 'Total Interest Cost',
                content: `You'll pay ${Utils.formatCurrency(totalInterest)} in interest (${interestRatio.toFixed(0)}% of loan amount). Extra payments can significantly reduce this.`
            });
        }

        // Monthly payment affordability
        const recommendedIncome = monthlyPayment / 0.28;
        insights.push({
            type: 'info',
            icon: '💰',
            title: 'Income Recommendation',
            content: `For comfortable affordability (28% rule), your gross monthly income should be at least ${Utils.formatCurrency(recommendedIncome)}.`
        });

        // Extra payment benefits
        const withExtraPayments = amortization.some(p => p.extraPayment > 0);
        if (withExtraPayments) {
            const normalSchedule = MortgageCalculator.generateAmortizationSchedule({
                principal: loanAmount,
                monthlyPayment: calculation.principalAndInterest,
                interestRate: 6.75, // Using example rate
                extraMonthly: 0,
                extraOnetime: 0
            });
            
            const normalInterest = normalSchedule.reduce((sum, payment) => sum + payment.interest, 0);
            const savings = normalInterest - totalInterest;
            const timeSaved = (normalSchedule.length - amortization.length) / 12;
            
            insights.push({
                type: 'success',
                icon: '🎯',
                title: 'Extra Payment Benefits',
                content: `Your extra payments save ${Utils.formatCurrency(savings)} in interest and ${timeSaved.toFixed(1)} years off your loan!`
            });
        } else {
            insights.push({
                type: 'info',
                icon: '💡',
                title: 'Extra Payment Opportunity',
                content: `Adding just $100/month extra could save you thousands in interest and years off your loan term.`
            });
        }

        return insights;
    }
};

// ========== FORM MANAGEMENT ==========
const FormManager = {
    init: () => {
        FormManager.setupEventListeners();
        FormManager.populateStateDropdown();
        FormManager.setupTermChips();
        FormManager.setupDownPaymentToggle();
        
        // Initial calculation
        setTimeout(() => {
            FormManager.handleInputChange();
        }, 100);
    },

    setupEventListeners: () => {
        const form = Utils.$('#mortgage-form');
        if (!form) return;

        // Main form inputs
        const inputs = Utils.$$('#mortgage-form input, #mortgage-form select');
        inputs.forEach(input => {
            input.addEventListener('input', Utils.debounce(FormManager.handleInputChange, CONFIG.debounceDelay));
            input.addEventListener('change', FormManager.handleInputChange);
        });

        // Property state change for tax calculation
        const stateSelect = Utils.$('#property-state');
        const propertyTaxInput = Utils.$('#property-tax');
        if (stateSelect && propertyTaxInput) {
            stateSelect.addEventListener('change', () => {
                const selectedState = stateSelect.value;
                const homePrice = parseFloat(Utils.$('#home-price').value) || 0;
                
                if (selectedState && STATE_TAX_RATES[selectedState]) {
                    const estimatedTax = homePrice * STATE_TAX_RATES[selectedState].rate;
                    propertyTaxInput.value = Math.round(estimatedTax);
                    FormManager.handleInputChange();
                }
            });
        }
    },

    setupTermChips: () => {
        const termChips = Utils.$$('.term-chip');
        const loanTermSelect = Utils.$('#loan-term');
        
        termChips.forEach(chip => {
            chip.addEventListener('click', () => {
                // Remove active from all chips
                termChips.forEach(c => c.classList.remove('active'));
                
                // Add active to clicked chip
                chip.classList.add('active');
                
                // Update hidden select
                if (loanTermSelect) {
                    loanTermSelect.value = chip.dataset.term;
                    FormManager.handleInputChange();
                }
            });
        });
    },

    setupDownPaymentToggle: () => {
        const amountToggle = Utils.$('#amount-toggle');
        const percentToggle = Utils.$('#percent-toggle');
        const amountInput = Utils.$('.input-with-prefix');
        const percentInput = Utils.$('.input-with-suffix');
        const downPaymentInput = Utils.$('#down-payment');
        const downPaymentPercentInput = Utils.$('#down-payment-percent');
        const homePriceInput = Utils.$('#home-price');

        if (!amountToggle || !percentToggle) return;

        amountToggle.addEventListener('click', () => {
            amountToggle.classList.add('active');
            percentToggle.classList.remove('active');
            amountInput.style.display = 'flex';
            percentInput.style.display = 'none';
        });

        percentToggle.addEventListener('click', () => {
            percentToggle.classList.add('active');
            amountToggle.classList.remove('active');
            amountInput.style.display = 'none';
            percentInput.style.display = 'flex';
        });

        // Sync dollar and percentage inputs
        if (downPaymentInput && downPaymentPercentInput && homePriceInput) {
            downPaymentInput.addEventListener('input', () => {
                const homePrice = parseFloat(homePriceInput.value) || 0;
                const downPayment = parseFloat(downPaymentInput.value) || 0;
                const percent = homePrice > 0 ? (downPayment / homePrice) * 100 : 0;
                downPaymentPercentInput.value = percent.toFixed(1);
            });

            downPaymentPercentInput.addEventListener('input', () => {
                const homePrice = parseFloat(homePriceInput.value) || 0;
                const percent = parseFloat(downPaymentPercentInput.value) || 0;
                const downPayment = (homePrice * percent) / 100;
                downPaymentInput.value = Math.round(downPayment);
            });
        }
    },

    handleInputChange: () => {
        if (STATE.isCalculating) return;
        STATE.isCalculating = true;

        const formData = FormManager.getFormData();
        if (FormManager.validateForm(formData)) {
            const calculation = MortgageCalculator.calculateMortgage(formData);
            STATE.currentCalculation = calculation;
            ResultsManager.displayResults(calculation);
        }

        STATE.isCalculating = false;
    },

    getFormData: () => {
        const homePrice = parseFloat(Utils.$('#home-price').value) || 400000;
        let downPayment = parseFloat(Utils.$('#down-payment').value) || 80000;
        
        // If percent toggle is active, calculate from percentage
        if (Utils.$('#percent-toggle')?.classList.contains('active')) {
            const percent = parseFloat(Utils.$('#down-payment-percent').value) || 20;
            downPayment = (homePrice * percent) / 100;
        }

        return {
            homePrice,
            downPayment,
            interestRate: parseFloat(Utils.$('#interest-rate').value) || 6.75,
            loanTerm: parseInt(Utils.$('#loan-term').value) || 30,
            propertyTax: parseFloat(Utils.$('#property-tax').value) || 3000,
            homeInsurance: parseFloat(Utils.$('#home-insurance').value) || 1700,
            extraMonthly: parseFloat(Utils.$('#extra-monthly').value) || 0,
            extraOnetime: parseFloat(Utils.$('#extra-onetime').value) || 0
        };
    },

    validateForm: (data) => {
        return data.homePrice > 0 && data.interestRate > 0 && data.loanTerm > 0;
    },

    populateStateDropdown: () => {
        const stateSelect = Utils.$('#property-state');
        if (!stateSelect) return;

        Object.entries(STATE_TAX_RATES).forEach(([code, state]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = state.name;
            stateSelect.appendChild(option);
        });

        stateSelect.value = 'CA'; // Default to California
    }
};

// ========== RESULTS MANAGEMENT ==========
const ResultsManager = {
    displayResults: (calculation) => {
        ResultsManager.displayPaymentSummary(calculation);
        ResultsManager.displayLoanSummary(calculation);
        ResultsManager.updateAmortizationSchedule(calculation);
        ChartManager.renderTimelineChart(calculation);
        ResultsManager.displayAIInsights(calculation);
    },

    displayPaymentSummary: (calculation) => {
        const {
            monthlyPayment,
            principalAndInterest,
            monthlyTax,
            monthlyInsurance,
            monthlyPmi
        } = calculation;

        Utils.$('#total-payment').textContent = Utils.formatCurrency(monthlyPayment);
        Utils.$('#principal-interest').textContent = Utils.formatCurrency(principalAndInterest);
        Utils.$('#monthly-tax').textContent = Utils.formatCurrency(monthlyTax);
        Utils.$('#monthly-insurance').textContent = Utils.formatCurrency(monthlyInsurance);
        Utils.$('#monthly-pmi').textContent = Utils.formatCurrency(monthlyPmi);
        
        // Update PMI input field to show calculated value
        const pmiInput = Utils.$('#pmi');
        if (pmiInput) {
            pmiInput.value = monthlyPmi;
        }
    },

    displayLoanSummary: (calculation) => {
        const { loanAmount, totalInterest, totalCost, payoffDate } = calculation;

        Utils.$('#display-loan-amount').textContent = Utils.formatCurrency(loanAmount);
        Utils.$('#display-total-interest').textContent = Utils.formatCurrency(totalInterest);
        Utils.$('#display-total-cost').textContent = Utils.formatCurrency(totalCost);
        Utils.$('#display-payoff-date').textContent = payoffDate ? 
            payoffDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '--';
    },

    updateAmortizationSchedule: (calculation) => {
        STATE.amortizationData = calculation.amortization;
        STATE.currentPage = 1;
        AmortizationManager.renderTable();
        AmortizationManager.updatePagination();
    },

    displayAIInsights: (calculation) => {
        const insights = AIInsights.generateInsights(calculation);
        const container = Utils.$('#ai-insights-content');
        if (!container) return;

        container.innerHTML = insights.map(insight => `
            <div class="insight-item ${insight.type}">
                <span class="insight-icon">${insight.icon}</span>
                <div class="insight-content">
                    <strong>${insight.title}</strong>
                    <p>${insight.content}</p>
                </div>
            </div>
        `).join('');
    }
};

// ========== AMORTIZATION SCHEDULE MANAGEMENT ==========
const AmortizationManager = {
    renderTable: () => {
        const table = Utils.$('#amortization-table tbody');
        if (!table || !STATE.amortizationData.length) return;

        const data = STATE.currentView === 'yearly' ? 
            AmortizationManager.getYearlyData() : STATE.amortizationData;

        const startIndex = (STATE.currentPage - 1) * CONFIG.amortizationPageSize;
        const endIndex = startIndex + CONFIG.amortizationPageSize;
        const pageData = data.slice(startIndex, endIndex);

        table.innerHTML = pageData.map(payment => `
            <tr>
                <td>${payment.paymentNumber || payment.year}</td>
                <td>${Utils.formatDate(payment.date)}</td>
                <td>${Utils.formatCurrency(payment.payment)}</td>
                <td>${Utils.formatCurrency(payment.principal)}</td>
                <td>${Utils.formatCurrency(payment.interest)}</td>
                <td>${Utils.formatCurrency(payment.balance)}</td>
            </tr>
        `).join('');
    },

    getYearlyData: () => {
        return ChartManager.aggregateYearlyData(STATE.amortizationData).map((yearData, index) => ({
            year: yearData.year,
            date: new Date(yearData.year, 0, 1),
            payment: yearData.yearlyPrincipal + yearData.yearlyInterest,
            principal: yearData.yearlyPrincipal,
            interest: yearData.yearlyInterest,
            balance: yearData.balance
        }));
    },

    updatePagination: () => {
        const data = STATE.currentView === 'yearly' ? 
            AmortizationManager.getYearlyData() : STATE.amortizationData;
        
        const totalPages = Math.ceil(data.length / CONFIG.amortizationPageSize);
        
        Utils.$('#pagination-text').textContent = `Page ${STATE.currentPage} of ${totalPages}`;
        
        const prevBtn = Utils.$('#prev-page');
        const nextBtn = Utils.$('#next-page');
        
        if (prevBtn) prevBtn.disabled = STATE.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = STATE.currentPage >= totalPages;
    }
};

// ========== TAB MANAGEMENT ==========
const TabManager = {
    init: () => {
        const tabButtons = Utils.$$('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', TabManager.switchTab);
        });
    },

    switchTab: (event) => {
        const clickedTab = event.target.dataset.tab;
        
        // Update tab buttons
        const tabButtons = Utils.$$('.tab-btn');
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === clickedTab);
        });

        // Update tab content
        const tabContents = Utils.$$('.tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${clickedTab}-tab`);
        });
    }
};

// ========== SHARING FUNCTIONALITY ==========
const SharingManager = {
    init: () => {
        Utils.$('#share-btn')?.addEventListener('click', SharingManager.handleShare);
        Utils.$('#pdf-btn')?.addEventListener('click', SharingManager.handlePDFDownload);
        Utils.$('#print-btn')?.addEventListener('click', SharingManager.handlePrint);
    },

    handleShare: async () => {
        if (!STATE.currentCalculation) {
            Utils.showToast('Please calculate your mortgage first', 'warning');
            return;
        }

        const calc = STATE.currentCalculation;
        const shareData = {
            title: 'My Mortgage Calculation Results',
            text: `Monthly Payment: ${Utils.formatCurrency(calc.monthlyPayment)}
Loan Amount: ${Utils.formatCurrency(calc.loanAmount)}
Total Interest: ${Utils.formatCurrency(calc.totalInterest)}
Payoff Date: ${calc.payoffDate ? calc.payoffDate.toLocaleDateString() : 'N/A'}`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`);
                Utils.showToast('Results copied to clipboard!', 'success');
            }
        } catch (error) {
            Utils.showToast('Sharing failed. Please try again.', 'error');
        }
    },

    handlePDFDownload: async () => {
        if (!STATE.currentCalculation) {
            Utils.showToast('Please calculate your mortgage first', 'warning');
            return;
        }

        try {
            Utils.showLoading();
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            
            // Header
            pdf.setFontSize(18);
            pdf.setTextColor(33, 128, 141);
            pdf.text('Mortgage Calculation Results', 20, 25);
            
            // Date
            pdf.setFontSize(10);
            pdf.setTextColor(100);
            pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
            
            const calc = STATE.currentCalculation;
            let yPos = 50;
            
            // Monthly Payment Section
            pdf.setFontSize(14);
            pdf.setTextColor(0);
            pdf.text('Monthly Payment Breakdown', 20, yPos);
            yPos += 10;
            
            pdf.setFontSize(11);
            const paymentData = [
                ['Total Monthly Payment', Utils.formatCurrency(calc.monthlyPayment)],
                ['Principal & Interest', Utils.formatCurrency(calc.principalAndInterest)],
                ['Property Tax', Utils.formatCurrency(calc.monthlyTax)],
                ['Home Insurance', Utils.formatCurrency(calc.monthlyInsurance)],
                ['PMI', Utils.formatCurrency(calc.monthlyPmi)]
            ];
            
            paymentData.forEach(([label, value]) => {
                pdf.text(label, 25, yPos);
                pdf.text(value, 150, yPos);
                yPos += 8;
            });
            
            yPos += 10;
            
            // Loan Summary
            pdf.setFontSize(14);
            pdf.text('Loan Summary', 20, yPos);
            yPos += 10;
            
            pdf.setFontSize(11);
            const loanData = [
                ['Loan Amount', Utils.formatCurrency(calc.loanAmount)],
                ['Total Interest Paid', Utils.formatCurrency(calc.totalInterest)],
                ['Total Cost of Loan', Utils.formatCurrency(calc.totalCost)],
                ['Payoff Date', calc.payoffDate ? calc.payoffDate.toLocaleDateString() : 'N/A']
            ];
            
            loanData.forEach(([label, value]) => {
                pdf.text(label, 25, yPos);
                pdf.text(value, 150, yPos);
                yPos += 8;
            });
            
            // AI Insights
            yPos += 15;
            pdf.setFontSize(14);
            pdf.text('AI Insights & Recommendations', 20, yPos);
            yPos += 10;
            
            const insights = AIInsights.generateInsights(calc);
            pdf.setFontSize(10);
            insights.forEach(insight => {
                if (yPos > 250) {
                    pdf.addPage();
                    yPos = 20;
                }
                
                pdf.setFont(undefined, 'bold');
                pdf.text(`${insight.icon} ${insight.title}`, 25, yPos);
                yPos += 8;
                
                pdf.setFont(undefined, 'normal');
                const lines = pdf.splitTextToSize(insight.content, 160);
                lines.forEach(line => {
                    pdf.text(line, 25, yPos);
                    yPos += 6;
                });
                yPos += 5;
            });
            
            pdf.save('mortgage-calculation-results.pdf');
            Utils.showToast('PDF downloaded successfully!', 'success');
            
        } catch (error) {
            Utils.showToast('PDF generation failed. Please try again.', 'error');
            console.error('PDF generation error:', error);
        } finally {
            Utils.hideLoading();
        }
    },

    handlePrint: () => {
        if (!STATE.currentCalculation) {
            Utils.showToast('Please calculate your mortgage first', 'warning');
            return;
        }
        
        window.print();
    }
};

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    FormManager.init();
    TabManager.init();
    SharingManager.init();

    // Setup year range slider
    const yearSlider = Utils.$('#year-range');
    const yearDisplay = Utils.$('#year-display');
    
    if (yearSlider && yearDisplay) {
        yearSlider.addEventListener('input', (e) => {
            const year = e.target.value;
            yearDisplay.textContent = year;
            
            // Update chart if it exists
            if (STATE.timelineChart && STATE.currentCalculation) {
                ChartManager.renderTimelineChart(STATE.currentCalculation);
            }
        });
        
        // Set max value based on loan term
        const updateSliderRange = () => {
            const loanTerm = parseInt(Utils.$('#loan-term')?.value || 30);
            yearSlider.max = Math.min(50, loanTerm + 10); // Allow viewing beyond loan term
            if (parseInt(yearSlider.value) > yearSlider.max) {
                yearSlider.value = yearSlider.max;
                yearDisplay.textContent = yearSlider.value;
            }
        };
        
        Utils.$('#loan-term')?.addEventListener('change', updateSliderRange);
        updateSliderRange();
    }

    // Setup amortization pagination
    Utils.$('#prev-page')?.addEventListener('click', () => {
        if (STATE.currentPage > 1) {
            STATE.currentPage--;
            AmortizationManager.renderTable();
            AmortizationManager.updatePagination();
        }
    });

    Utils.$('#next-page')?.addEventListener('click', () => {
        const data = STATE.currentView === 'yearly' ? 
            AmortizationManager.getYearlyData() : STATE.amortizationData;
        const totalPages = Math.ceil(data.length / CONFIG.amortizationPageSize);
        
        if (STATE.currentPage < totalPages) {
            STATE.currentPage++;
            AmortizationManager.renderTable();
            AmortizationManager.updatePagination();
        }
    });

    // Setup view toggle for amortization
    Utils.$$('.toggle-btn[data-view]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            Utils.$$('.toggle-btn[data-view]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            STATE.currentView = e.target.dataset.view;
            STATE.currentPage = 1;
            AmortizationManager.renderTable();
            AmortizationManager.updatePagination();
        });
    });

    console.log('🏠 Enhanced Mortgage Calculator initialized successfully!');
});
