/**
 * script.js
 * FinGuid AI-Enhanced Mortgage Calculator v9.1
 * Production Ready with Fixed Chart Display
 * * Features:
 * - Real-time mortgage calculations with extra payment impact
 * - State-based property tax calculations
 * - Interactive mortgage over time chart with year dragging (FIXED)
 * - AI-powered insights
 * - Collapsible amortization schedule with pagination
 * - Comprehensive sharing functionality (Share, Save PDF, Print)
 * - Mobile responsive design
 * - Accessibility features
 */

'use strict';

// ========== CONFIGURATION & STATE ==========
const CONFIG = {
    debounceDelay: 300,
    amortizationPageSize: 12,
    chartUpdateDelay: 100,
    animationDuration: 300,
    colors: {
        primary: '#21808d',
        primaryLight: '#32b8c8',
        secondary: '#f59e0b',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        remaining: '#ff6b6b',
        principal: '#4ecdc4',
        interest: '#45b7d1'
    }
};

const STATE = {
    currentCalculation: null,
    amortizationData: [],
    timelineData: [],
    currentView: 'yearly',
    currentPage: 1,
    totalPages: 1,
    timelineChart: null,
    currentYear: 1,
    maxYears: 30,
    isCalculating: false,
    chartInitialized: false
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

    // Currency formatting with proper spacing after dollar sign
    formatCurrency: (amount, decimals = 0) => {
        if (isNaN(amount) || amount === null) return '$ 0';
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(amount);
        // Add space after dollar sign
        return formatted.replace('$', '$ ');
    },

    // Number formatting
    formatNumber: (num) => {
        if (isNaN(num)) return '0';
        return new Intl.NumberFormat('en-US').format(num);
    },

    // Parse currency string to number
    parseCurrency: (value) => {
        if (!value) return 0;
        return parseFloat(value.toString().replace(/[$,\s]/g, '')) || 0;
    },

    // Format number input with commas
    formatNumberInput: (value) => {
        const num = value.replace(/[^\d]/g, '');
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
            <div class="toast-content">
                <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span class="toast-message">${message}</span>
            </div>
            <button class="toast-close" aria-label="Close">&times;</button>
        `;

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);

        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
    },

    // Loading overlay
    showLoading: (show = true) => {
        const overlay = Utils.$('#loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    },

    // Animate number changes
    animateNumber: (element, start, end, duration = 1000) => {
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = start + (end - start) * progress;
            element.textContent = Utils.formatCurrency(current);
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }
};

// ========== MORTGAGE CALCULATIONS ==========
const MortgageCalculator = {
    // Main calculation function
    calculate: (inputs) => {
        const {
            homePrice,
            downPayment,
            loanAmount,
            interestRate,
            loanTerm,
            propertyTax,
            homeInsurance,
            pmi,
            hoaFees,
            extraPayment = 0
        } = inputs;

        // Monthly interest rate
        const monthlyRate = interestRate / 100 / 12;
        const totalPayments = loanTerm * 12;

        // Principal and Interest calculation
        const principalInterest = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
            (Math.pow(1 + monthlyRate, totalPayments) - 1);

        // Monthly additional costs
        const monthlyPropertyTax = propertyTax / 12;
        const monthlyInsurance = homeInsurance / 12;
        const monthlyPmi = pmi / 12;
        const monthlyHoa = hoaFees;

        // Total monthly payment
        const totalMonthlyPayment = principalInterest + monthlyPropertyTax + monthlyInsurance + monthlyPmi + monthlyHoa;

        // Total interest over life of loan
        const totalInterest = (principalInterest * totalPayments) - loanAmount;
        const totalCost = loanAmount + totalInterest;

        // Calculate extra payment impact
        let extraPaymentImpact = null;
        if (extraPayment > 0) {
            extraPaymentImpact = MortgageCalculator.calculateExtraPaymentImpact(
                loanAmount, monthlyRate, totalPayments, principalInterest, extraPayment
            );
        }

        return {
            principalInterest: Math.round(principalInterest * 100) / 100,
            monthlyPropertyTax: Math.round(monthlyPropertyTax * 100) / 100,
            monthlyInsurance: Math.round(monthlyInsurance * 100) / 100,
            monthlyPmi: Math.round(monthlyPmi * 100) / 100,
            monthlyHoa: Math.round(monthlyHoa * 100) / 100,
            totalMonthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
            totalInterest: Math.round(totalInterest * 100) / 100,
            totalCost: Math.round(totalCost * 100) / 100,
            extraPaymentImpact: extraPaymentImpact,
            downPaymentPercent: Math.round((downPayment / homePrice) * 100 * 10) / 10
        };
    },

    // Calculate extra payment impact
    calculateExtraPaymentImpact: (loanAmount, monthlyRate, totalPayments, regularPayment, extraPayment) => {
        let balance = loanAmount;
        let totalInterestWithExtra = 0;
        let paymentCount = 0;
        const monthlyPaymentWithExtra = regularPayment + extraPayment;

        while (balance > 0.01 && paymentCount < totalPayments * 2) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = Math.min(monthlyPaymentWithExtra - interestPayment, balance);
            balance -= principalPayment;
            totalInterestWithExtra += interestPayment;
            paymentCount++;
            if (balance <= 0) break;
        }

        const originalTotalInterest = (regularPayment * totalPayments) - loanAmount;
        const interestSavings = originalTotalInterest - totalInterestWithExtra;
        const monthsSaved = totalPayments - paymentCount;
        const yearsSaved = Math.floor(monthsSaved / 12);
        const monthsRemaining = monthsSaved % 12;

        // Calculate payoff date
        const today = new Date();
        const payoffDate = new Date(today);
        payoffDate.setMonth(payoffDate.getMonth() + paymentCount);

        return {
            interestSavings: Math.round(interestSavings * 100) / 100,
            yearsSaved: yearsSaved,
            monthsSaved: monthsRemaining,
            payoffDate: payoffDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            newLoanTermMonths: paymentCount
        };
    },

    // Generate full amortization schedule
    generateAmortizationSchedule: (loanAmount, monthlyRate, totalPayments, monthlyPayment, extraPayment) => {
        let balance = loanAmount;
        const schedule = [];
        let paymentNumber = 1;
        
        while (balance > 0.01 && paymentNumber <= totalPayments) {
            const interestPayment = balance * monthlyRate;
            let principalPayment = monthlyPayment - interestPayment;
            
            // Add extra payment if applicable
            if (extraPayment > 0) {
                principalPayment += extraPayment;
            }

            // Ensure we don't overpay the final payment
            if (balance - principalPayment < 0) {
                principalPayment = balance;
                balance = 0;
            } else {
                balance -= principalPayment;
            }

            schedule.push({
                paymentNumber: paymentNumber,
                monthlyPayment: Math.round((monthlyPayment + (extraPayment || 0)) * 100) / 100,
                interest: Math.round(interestPayment * 100) / 100,
                principal: Math.round(principalPayment * 100) / 100,
                balance: Math.round(balance * 100) / 100
            });
            paymentNumber++;
        }

        return schedule;
    },

    // Generate yearly timeline data for chart
    generateTimelineData: (amortizationData) => {
        const timeline = [];
        let totalPrincipal = 0;
        let totalInterest = 0;
        
        // Use a Set to store years and filter unique years
        const years = new Set(amortizationData.map(d => Math.floor((d.paymentNumber - 1) / 12) + 1));
        
        years.forEach(year => {
            const yearlyPayments = amortizationData.filter(d => Math.floor((d.paymentNumber - 1) / 12) + 1 === year);
            const yearlyPrincipal = yearlyPayments.reduce((sum, p) => sum + p.principal, 0);
            const yearlyInterest = yearlyPayments.reduce((sum, p) => sum + p.interest, 0);
            const remainingBalance = yearlyPayments.length > 0 ? yearlyPayments[yearlyPayments.length - 1].balance : 0;
            
            totalPrincipal += yearlyPrincipal;
            totalInterest += yearlyInterest;
            
            timeline.push({
                year: year,
                principal: Math.round(totalPrincipal * 100) / 100,
                interest: Math.round(totalInterest * 100) / 100,
                remainingBalance: Math.round(remainingBalance * 100) / 100
            });
        });
        
        return timeline;
    },

    // Get property tax rate for a state
    getPropertyTaxRate: (stateCode) => {
        return STATE_TAX_RATES[stateCode] ? STATE_TAX_RATES[stateCode].rate : 0;
    }
};

// ========== CHART MANAGEMENT ==========
const ChartManager = {
    init: () => {
        if (STATE.chartInitialized) return;
        const ctx = Utils.$('#timelineChart').getContext('2d');
        STATE.timelineChart = new Chart(ctx, ChartManager.getChartConfig([]));
        STATE.chartInitialized = true;
    },

    getChartConfig: (data) => {
        const labels = data.map(d => `Year ${d.year}`);
        const datasets = [{
            label: 'Principal Paid',
            data: data.map(d => d.principal),
            backgroundColor: CONFIG.colors.principal,
            borderColor: CONFIG.colors.principal,
            borderWidth: 1,
            fill: true,
            stack: 'combined'
        }, {
            label: 'Interest Paid',
            data: data.map(d => d.interest),
            backgroundColor: CONFIG.colors.interest,
            borderColor: CONFIG.colors.interest,
            borderWidth: 1,
            fill: true,
            stack: 'combined'
        }];

        return {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Year'
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Total Amount Paid'
                        },
                        ticks: {
                            callback: (value) => Utils.formatCurrency(value, 0)
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${Utils.formatCurrency(value, 0)}`;
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false
                    }
                }
            }
        };
    },

    updateChart: (amortizationData) => {
        const timelineData = MortgageCalculator.generateTimelineData(amortizationData);
        STATE.timelineData = timelineData;
        STATE.timelineChart.data = ChartManager.getChartConfig(timelineData).data;
        STATE.timelineChart.update();
    },

    updateMonthlyView: (year) => {
        const monthlyData = STATE.amortizationData.filter(d => Math.floor((d.paymentNumber - 1) / 12) + 1 === year);
        const labels = monthlyData.map(d => `Month ${d.paymentNumber}`);
        const datasets = [{
            label: 'Principal Paid',
            data: monthlyData.map(d => d.principal),
            backgroundColor: CONFIG.colors.principal,
            borderColor: CONFIG.colors.principal,
            borderWidth: 1,
            fill: true
        }, {
            label: 'Interest Paid',
            data: monthlyData.map(d => d.interest),
            backgroundColor: CONFIG.colors.interest,
            borderColor: CONFIG.colors.interest,
            borderWidth: 1,
            fill: true
        }, {
            label: 'Remaining Balance',
            data: monthlyData.map(d => d.balance),
            backgroundColor: 'transparent',
            borderColor: CONFIG.colors.remaining,
            borderWidth: 2,
            pointRadius: 3,
            type: 'line',
            yAxisID: 'y1'
        }];
        
        STATE.timelineChart.data = {
            labels: labels,
            datasets: datasets
        };
        
        STATE.timelineChart.options.scales = {
            x: {
                stacked: false,
                title: { display: true, text: 'Month' }
            },
            y: {
                stacked: false,
                title: { display: true, text: 'Payment Amount' },
                ticks: { callback: (value) => Utils.formatCurrency(value, 0) }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: 'Remaining Balance' },
                grid: { drawOnChartArea: false },
                ticks: { callback: (value) => Utils.formatCurrency(value, 0) }
            }
        };
        
        STATE.timelineChart.update();
    },

    updateYearlyView: () => {
        STATE.timelineChart.data = ChartManager.getChartConfig(STATE.timelineData).data;
        STATE.timelineChart.options.scales = ChartManager.getChartConfig(STATE.timelineData).options.scales;
        STATE.timelineChart.update();
    }
};

// ========== AI INSIGHTS ==========
const AI = {
    generateInsights: (inputs, results) => {
        const insights = [];
        const { homePrice, downPayment, loanAmount, interestRate, loanTerm, propertyTax } = inputs;
        const { totalMonthlyPayment, downPaymentPercent } = results;

        // Down payment insight
        if (downPaymentPercent < 20) {
            insights.push({
                type: 'warning',
                icon: '📉',
                title: 'Lower Down Payment',
                content: `Your down payment is only ${downPaymentPercent}% of the home price. A down payment of 20% or more can help you avoid Private Mortgage Insurance (PMI).`
            });
        }

        // High interest rate insight
        if (interestRate > 7) {
            insights.push({
                type: 'warning',
                icon: '⚠️',
                title: 'Higher Interest Rate',
                content: `Your interest rate of ${interestRate}% is higher than the historical average. Consider shopping around or waiting for better market conditions to reduce your total interest cost.`
            });
        } else if (interestRate < 4) {
             insights.push({
                type: 'success',
                icon: '✅',
                title: 'Excellent Interest Rate',
                content: `Your interest rate of ${interestRate}% is well below the historical average, which will significantly reduce your total interest paid.`
            });
        }
        
        // Property tax insight
        if (inputs.state && propertyTax === MortgageCalculator.getPropertyTaxRate(inputs.state) * homePrice) {
            insights.push({
                type: 'info',
                icon: '🏛️',
                title: 'State-Specific Taxes',
                content: `Based on your selected state of ${STATE_TAX_RATES[inputs.state].name}, your estimated property tax is ${Utils.formatCurrency(propertyTax, 0)}. This can vary by county and local municipality, so always verify.`
            });
        }

        // Long loan term insight
        if (loanTerm > 30) {
            insights.push({
                type: 'warning',
                icon: '⏳',
                title: 'Extended Loan Term',
                content: `A ${loanTerm}-year loan term will result in lower monthly payments but will significantly increase the total interest paid over the life of the loan. Consider a shorter term if you can afford it.`
            });
        }

        // Total cost insight
        const interestPercentage = (results.totalInterest / inputs.loanAmount) * 100;
        if (interestPercentage > 100) {
            insights.push({
                type: 'warning',
                icon: '📈',
                title: 'Total Interest Cost',
                content: `Over the life of your loan, you'll pay ${Utils.formatCurrency(results.totalInterest)} in interest (${Math.round(interestPercentage)}% of your loan amount). Consider a shorter term to reduce total interest.`
            });
        }

        return insights;
    }
};

// ========== UI MANAGEMENT & EVENT LISTENERS ==========
const UI = {
    elements: {
        form: Utils.$('#mortgage-form'),
        homePriceInput: Utils.$('#home-price'),
        downPaymentInput: Utils.$('#down-payment'),
        loanAmountInput: Utils.$('#loan-amount'),
        interestRateInput: Utils.$('#interest-rate'),
        loanTermInput: Utils.$('#loan-term'),
        propertyTaxInput: Utils.$('#property-tax'),
        stateSelect: Utils.$('#state'),
        homeInsuranceInput: Utils.$('#home-insurance'),
        pmiInput: Utils.$('#pmi'),
        hoaFeesInput: Utils.$('#hoa-fees'),
        extraPaymentInput: Utils.$('#extra-payment'),
        calculateBtn: Utils.$('#calculate-btn'),
        resetBtn: Utils.$('#reset-btn'),
        resultsCard: Utils.$('#results-card'),
        monthlyPaymentValue: Utils.$('#monthly-payment-value'),
        piValue: Utils.$('#pi-value'),
        taxValue: Utils.$('#tax-value'),
        insuranceValue: Utils.$('#insurance-value'),
        pmiValue: Utils.$('#pmi-value'),
        hoaValue: Utils.$('#hoa-value'),
        totalInterestValue: Utils.$('#total-interest-value'),
        totalCostValue: Utils.$('#total-cost-value'),
        loanTermValue: Utils.$('#loan-term-value'),
        interestRateValue: Utils.$('#interest-rate-value'),
        extraPaymentSection: Utils.$('#extra-payment-section'),
        interestSavingsValue: Utils.$('#interest-savings-value'),
        timeSavingsValue: Utils.$('#time-savings-value'),
        payoffDateValue: Utils.$('#payoff-date-value'),
        extraPaymentAmount: Utils.$('#extra-payment-amount'),
        insightsContainer: Utils.$('#ai-insights-container'),
        insightsGrid: Utils.$('#insights-grid'),
        amortizationContainer: Utils.$('#amortization-container'),
        amortizationHeader: Utils.$('.collapsible-header'),
        amortizationContent: Utils.$('#amortization-content'),
        amortizationTableBody: Utils.$('#amortization-table-body'),
        prevPageBtn: Utils.$('#prev-page-btn'),
        nextPageBtn: Utils.$('#next-page-btn'),
        pageInfo: Utils.$('#page-info'),
        chartContainer: Utils.$('#chart-container'),
        viewToggleButton: Utils.$('#view-toggle'),
        viewToggleLabel: Utils.$('#toggle-label'),
        yearSlider: Utils.$('#year-slider'),
        sliderYearLabel: Utils.$('#slider-year-label'),
        shareUrlInput: Utils.$('#share-url'),
        copyUrlBtn: Utils.$('.copy-url-btn'),
        shareOptions: Utils.$$('.share-option'),
        themeToggle: Utils.$('#theme-toggle')
    },

    init: () => {
        ChartManager.init();
        UI.addEventListeners();
        UI.updateLoanAmount();
        UI.updateStateTax();
    },

    addEventListeners: () => {
        // Form submission
        UI.elements.form.addEventListener('submit', UI.handleFormSubmit);

        // Input formatting and calculations
        UI.elements.homePriceInput.addEventListener('input', Utils.debounce(UI.handleInput, CONFIG.debounceDelay));
        UI.elements.downPaymentInput.addEventListener('input', Utils.debounce(UI.handleInput, CONFIG.debounceDelay));
        UI.elements.interestRateInput.addEventListener('input', Utils.debounce(UI.handleInput, CONFIG.debounceDelay));
        UI.elements.loanTermInput.addEventListener('input', Utils.debounce(UI.handleInput, CONFIG.debounceDelay));
        UI.elements.propertyTaxInput.addEventListener('input', Utils.debounce(UI.handleInput, CONFIG.debounceDelay));
        UI.elements.homeInsuranceInput.addEventListener('input', Utils.debounce(UI.handleInput, CONFIG.debounceDelay));
        UI.elements.pmiInput.addEventListener('input', Utils.debounce(UI.handleInput, CONFIG.debounceDelay));
        UI.elements.hoaFeesInput.addEventListener('input', Utils.debounce(UI.handleInput, CONFIG.debounceDelay));
        UI.elements.extraPaymentInput.addEventListener('input', Utils.debounce(UI.handleInput, CONFIG.debounceDelay));

        // State change
        UI.elements.stateSelect.addEventListener('change', UI.updateStateTax);

        // Reset button
        UI.elements.resetBtn.addEventListener('click', UI.resetForm);

        // Amortization schedule toggle
        UI.elements.amortizationHeader.addEventListener('click', UI.toggleAmortizationSchedule);
        UI.elements.amortizationHeader.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') UI.toggleAmortizationSchedule();
        });

        // Pagination
        UI.elements.prevPageBtn.addEventListener('click', UI.goToPrevPage);
        UI.elements.nextPageBtn.addEventListener('click', UI.goToNextPage);

        // Chart controls
        UI.elements.viewToggleButton.addEventListener('click', UI.toggleChartView);
        UI.elements.yearSlider.addEventListener('input', UI.handleSliderChange);

        // Copy URL
        UI.elements.copyUrlBtn.addEventListener('click', UI.copyShareUrl);

        // Social sharing
        UI.elements.shareOptions.forEach(btn => {
            btn.addEventListener('click', UI.handleShare);
        });
        
        // Theme toggle
        UI.elements.themeToggle.addEventListener('click', UI.toggleTheme);
        
        // Initial setup for the slider
        UI.elements.yearSlider.max = STATE.maxYears;
        UI.elements.yearSlider.value = STATE.currentYear;
        UI.elements.sliderYearLabel.textContent = `Year ${STATE.currentYear}`;
    },

    handleFormSubmit: (e) => {
        e.preventDefault();
        UI.calculateMortgage();
    },
    
    handleInput: () => {
        UI.updateLoanAmount();
        UI.calculateMortgage();
    },

    isFormValid: () => {
        const homePrice = Utils.parseCurrency(UI.elements.homePriceInput.value);
        const downPayment = Utils.parseCurrency(UI.elements.downPaymentInput.value);
        const interestRate = parseFloat(UI.elements.interestRateInput.value);
        const loanTerm = parseInt(UI.elements.loanTermInput.value);

        if (homePrice <= 0) {
            Utils.showToast('Home Price must be a positive number.', 'error');
            return false;
        }
        if (downPayment >= homePrice) {
            Utils.showToast('Down Payment cannot be greater than or equal to Home Price.', 'error');
            return false;
        }
        if (isNaN(interestRate) || interestRate <= 0) {
            Utils.showToast('Interest Rate must be a positive number.', 'error');
            return false;
        }
        if (isNaN(loanTerm) || loanTerm <= 0) {
            Utils.showToast('Loan Term must be a positive number.', 'error');
            return false;
        }

        return true;
    },

    calculateMortgage: () => {
        if (!UI.isFormValid() || STATE.isCalculating) return;

        STATE.isCalculating = true;
        Utils.showLoading(true);

        const homePrice = Utils.parseCurrency(UI.elements.homePriceInput.value);
        const downPayment = Utils.parseCurrency(UI.elements.downPaymentInput.value);
        const loanAmount = homePrice - downPayment;
        const interestRate = parseFloat(UI.elements.interestRateInput.value);
        const loanTerm = parseInt(UI.elements.loanTermInput.value);
        let propertyTax = Utils.parseCurrency(UI.elements.propertyTaxInput.value);
        const homeInsurance = Utils.parseCurrency(UI.elements.homeInsuranceInput.value);
        const pmi = Utils.parseCurrency(UI.elements.pmiInput.value);
        const hoaFees = Utils.parseCurrency(UI.elements.hoaFeesInput.value);
        const extraPayment = Utils.parseCurrency(UI.elements.extraPaymentInput.value);

        // Auto-calculate property tax if state is selected and tax is not entered
        if (UI.elements.stateSelect.value && propertyTax === 0) {
            propertyTax = homePrice * MortgageCalculator.getPropertyTaxRate(UI.elements.stateSelect.value);
            UI.elements.propertyTaxInput.value = Utils.formatNumber(propertyTax.toFixed(0));
        }

        const inputs = {
            homePrice, downPayment, loanAmount, interestRate, loanTerm, propertyTax,
            homeInsurance, pmi, hoaFees, extraPayment
        };

        const results = MortgageCalculator.calculate(inputs);
        STATE.currentCalculation = results;
        STATE.amortizationData = MortgageCalculator.generateAmortizationSchedule(
            results.loanAmount,
            interestRate / 100 / 12,
            results.extraPaymentImpact ? results.extraPaymentImpact.newLoanTermMonths : loanTerm * 12,
            results.principalInterest,
            extraPayment
        );
        STATE.maxYears = Math.ceil(STATE.amortizationData.length / 12);
        
        setTimeout(() => {
            UI.updateResults(results);
            UI.updateChartAndSchedule();
            Utils.showLoading(false);
            STATE.isCalculating = false;
        }, 500); // Simulate a slight delay for better UX
    },

    updateLoanAmount: () => {
        const homePrice = Utils.parseCurrency(UI.elements.homePriceInput.value);
        const downPayment = Utils.parseCurrency(UI.elements.downPaymentInput.value);
        const loanAmount = homePrice - downPayment;
        UI.elements.loanAmountInput.value = Utils.formatCurrency(loanAmount, 0).replace('$', '');
    },

    updateStateTax: () => {
        const homePrice = Utils.parseCurrency(UI.elements.homePriceInput.value);
        const stateCode = UI.elements.stateSelect.value;
        if (homePrice > 0 && stateCode) {
            const taxRate = MortgageCalculator.getPropertyTaxRate(stateCode);
            const calculatedTax = homePrice * taxRate;
            UI.elements.propertyTaxInput.value = Utils.formatNumber(calculatedTax.toFixed(0));
        }
    },

    updateResults: (results) => {
        // Animate key numbers
        Utils.animateNumber(UI.elements.monthlyPaymentValue, Utils.parseCurrency(UI.elements.monthlyPaymentValue.textContent), results.totalMonthlyPayment);
        Utils.animateNumber(UI.elements.piValue, Utils.parseCurrency(UI.elements.piValue.textContent), results.principalInterest);
        Utils.animateNumber(UI.elements.taxValue, Utils.parseCurrency(UI.elements.taxValue.textContent), results.monthlyPropertyTax);
        Utils.animateNumber(UI.elements.insuranceValue, Utils.parseCurrency(UI.elements.insuranceValue.textContent), results.monthlyInsurance);
        Utils.animateNumber(UI.elements.pmiValue, Utils.parseCurrency(UI.elements.pmiValue.textContent), results.monthlyPmi);
        Utils.animateNumber(UI.elements.hoaValue, Utils.parseCurrency(UI.elements.hoaValue.textContent), results.monthlyHoa);
        Utils.animateNumber(UI.elements.totalInterestValue, Utils.parseCurrency(UI.elements.totalInterestValue.textContent), results.totalInterest);
        Utils.animateNumber(UI.elements.totalCostValue, Utils.parseCurrency(UI.elements.totalCostValue.textContent), results.totalCost);

        UI.elements.loanTermValue.textContent = `${UI.elements.loanTermInput.value} years`;
        UI.elements.interestRateValue.textContent = `${UI.elements.interestRateInput.value}%`;

        // Update extra payment section
        if (results.extraPaymentImpact) {
            UI.elements.extraPaymentSection.classList.remove('hidden');
            UI.elements.extraPaymentAmount.textContent = Utils.formatCurrency(Utils.parseCurrency(UI.elements.extraPaymentInput.value), 0);
            UI.elements.interestSavingsValue.textContent = Utils.formatCurrency(results.extraPaymentImpact.interestSavings, 0);
            const yearsText = results.extraPaymentImpact.yearsSaved > 0 ? `${results.extraPaymentImpact.yearsSaved} years` : '';
            const monthsText = results.extraPaymentImpact.monthsSaved > 0 ? `${results.extraPaymentImpact.monthsSaved} months` : '';
            UI.elements.timeSavingsValue.textContent = `${yearsText} ${monthsText}`.trim();
            UI.elements.payoffDateValue.textContent = results.extraPaymentImpact.payoffDate;
        } else {
            UI.elements.extraPaymentSection.classList.add('hidden');
        }

        // Generate and display AI insights
        UI.displayInsights(AI.generateInsights(UI.getInputs(), results));
        
        // Show results panel
        UI.elements.resultsCard.scrollIntoView({ behavior: 'smooth' });
    },

    updateChartAndSchedule: () => {
        ChartManager.updateChart(STATE.amortizationData);
        UI.elements.yearSlider.max = STATE.maxYears;
        UI.elements.yearSlider.value = STATE.currentYear;
        UI.elements.sliderYearLabel.textContent = `Year ${STATE.currentYear}`;
        UI.renderAmortizationSchedule();
    },

    displayInsights: (insights) => {
        const insightsGrid = UI.elements.insightsGrid;
        insightsGrid.innerHTML = '';
        if (insights.length > 0) {
            UI.elements.insightsContainer.classList.remove('hidden');
            insights.forEach(insight => {
                const card = document.createElement('div');
                card.className = `insight-card insight-card--${insight.type}`;
                card.innerHTML = `
                    <div class="insight-header">
                        <span class="insight-icon">${insight.icon}</span>
                        <h3 class="insight-title">${insight.title}</h3>
                    </div>
                    <div class="insight-content">
                        <p>${insight.content}</p>
                    </div>
                `;
                insightsGrid.appendChild(card);
            });
        } else {
            UI.elements.insightsContainer.classList.add('hidden');
        }
    },

    toggleAmortizationSchedule: () => {
        const content = UI.elements.amortizationContent;
        const isExpanded = UI.elements.amortizationHeader.getAttribute('aria-expanded') === 'true';
        UI.elements.amortizationHeader.setAttribute('aria-expanded', !isExpanded);
        content.classList.toggle('expanded');
    },

    renderAmortizationSchedule: () => {
        const tableBody = UI.elements.amortizationTableBody;
        tableBody.innerHTML = '';
        const startIndex = (STATE.currentPage - 1) * CONFIG.amortizationPageSize;
        const endIndex = startIndex + CONFIG.amortizationPageSize;
        const currentData = STATE.amortizationData.slice(startIndex, endIndex);

        currentData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.paymentNumber}</td>
                <td>${Utils.formatCurrency(row.monthlyPayment, 2)}</td>
                <td>${Utils.formatCurrency(row.principal, 2)}</td>
                <td>${Utils.formatCurrency(row.interest, 2)}</td>
                <td>${Utils.formatCurrency(row.balance, 2)}</td>
            `;
            tableBody.appendChild(tr);
        });

        STATE.totalPages = Math.ceil(STATE.amortizationData.length / CONFIG.amortizationPageSize);
        UI.elements.pageInfo.textContent = `Page ${STATE.currentPage} of ${STATE.totalPages}`;
        UI.elements.prevPageBtn.disabled = STATE.currentPage === 1;
        UI.elements.nextPageBtn.disabled = STATE.currentPage === STATE.totalPages;
    },

    goToPrevPage: () => {
        if (STATE.currentPage > 1) {
            STATE.currentPage--;
            UI.renderAmortizationSchedule();
        }
    },

    goToNextPage: () => {
        if (STATE.currentPage < STATE.totalPages) {
            STATE.currentPage++;
            UI.renderAmortizationSchedule();
        }
    },

    toggleChartView: () => {
        if (STATE.currentView === 'yearly') {
            STATE.currentView = 'monthly';
            UI.elements.viewToggleLabel.textContent = 'View Yearly';
            UI.elements.yearSlider.style.display = 'block';
            UI.elements.sliderYearLabel.style.display = 'block';
            ChartManager.updateMonthlyView(STATE.currentYear);
        } else {
            STATE.currentView = 'yearly';
            UI.elements.viewToggleLabel.textContent = 'View Monthly';
            UI.elements.yearSlider.style.display = 'none';
            UI.elements.sliderYearLabel.style.display = 'none';
            ChartManager.updateYearlyView();
        }
    },

    handleSliderChange: (e) => {
        STATE.currentYear = parseInt(e.target.value);
        UI.elements.sliderYearLabel.textContent = `Year ${STATE.currentYear}`;
        ChartManager.updateMonthlyView(STATE.currentYear);
    },

    resetForm: () => {
        UI.elements.form.reset();
        UI.elements.loanAmountInput.value = '';
        UI.elements.monthlyPaymentValue.textContent = '$ 0';
        UI.elements.piValue.textContent = '$ 0';
        UI.elements.taxValue.textContent = '$ 0';
        UI.elements.insuranceValue.textContent = '$ 0';
        UI.elements.pmiValue.textContent = '$ 0';
        UI.elements.hoaValue.textContent = '$ 0';
        UI.elements.totalInterestValue.textContent = '$ 0';
        UI.elements.totalCostValue.textContent = '$ 0';
        UI.elements.loanTermValue.textContent = '0 years';
        UI.elements.interestRateValue.textContent = '0%';
        UI.elements.extraPaymentSection.classList.add('hidden');
        UI.elements.insightsContainer.classList.add('hidden');
        
        // Reset chart and schedule
        STATE.amortizationData = [];
        STATE.timelineData = [];
        STATE.currentPage = 1;
        STATE.currentView = 'yearly';
        STATE.currentYear = 1;
        UI.elements.viewToggleLabel.textContent = 'View Monthly';
        UI.elements.yearSlider.style.display = 'none';
        UI.elements.sliderYearLabel.style.display = 'none';
        ChartManager.updateChart([]);
        UI.renderAmortizationSchedule();
    },

    getInputs: () => {
        const homePrice = Utils.parseCurrency(UI.elements.homePriceInput.value);
        const downPayment = Utils.parseCurrency(UI.elements.downPaymentInput.value);
        const loanAmount = homePrice - downPayment;
        const interestRate = parseFloat(UI.elements.interestRateInput.value);
        const loanTerm = parseInt(UI.elements.loanTermInput.value);
        const propertyTax = Utils.parseCurrency(UI.elements.propertyTaxInput.value);
        const homeInsurance = Utils.parseCurrency(UI.elements.homeInsuranceInput.value);
        const pmi = Utils.parseCurrency(UI.elements.pmiInput.value);
        const hoaFees = Utils.parseCurrency(UI.elements.hoaFeesInput.value);
        const extraPayment = Utils.parseCurrency(UI.elements.extraPaymentInput.value);

        return {
            homePrice, downPayment, loanAmount, interestRate, loanTerm, propertyTax,
            homeInsurance, pmi, hoaFees, extraPayment, state: UI.elements.stateSelect.value
        };
    },
    
    // Sharing functionality
    createShareableUrl: () => {
        const inputs = UI.getInputs();
        const params = new URLSearchParams(inputs).toString();
        return `${window.location.origin}${window.location.pathname}?${params}`;
    },
    
    copyShareUrl: () => {
        const url = UI.createShareableUrl();
        navigator.clipboard.writeText(url).then(() => {
            Utils.showToast('Link copied to clipboard!', 'success');
        }).catch(err => {
            Utils.showToast('Failed to copy link.', 'error');
            console.error('Failed to copy text: ', err);
        });
    },

    handleShare: (e) => {
        const method = e.currentTarget.dataset.method;
        const url = UI.createShareableUrl();
        const title = "FinGuid Mortgage Calculator Results";
        const text = "Check out my mortgage calculation results!";

        if (navigator.share && method === 'share-native') {
            navigator.share({
                title: title,
                text: text,
                url: url
            }).catch(err => console.log('Error sharing:', err));
        } else {
            const encodedUrl = encodeURIComponent(url);
            let shareUrl = '';
            switch(method) {
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(text)}`;
                    break;
                case 'linkedin':
                    shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(text)}`;
                    break;
                case 'whatsapp':
                    shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text}: ${url}`)}`;
                    break;
                case 'email':
                    shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}: ${url}`)}`;
                    break;
                case 'pdf':
                    // PDF generation is handled separately
                    UI.saveAsPdf();
                    return;
                case 'print':
                    window.print();
                    return;
            }
            if (shareUrl) {
                window.open(shareUrl, '_blank', 'noopener,noreferrer');
            }
        }
    },
    
    saveAsPdf: () => {
        Utils.showLoading(true);
        const content = Utils.$('.calculator-layout');
        
        // Temporarily set a data attribute to control print styles
        document.body.setAttribute('data-printing', 'true');
        
        // Wait for styles to apply
        setTimeout(() => {
            html2canvas(content, {
                scale: 2, // Improve resolution
                useCORS: true
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgProps = pdf.getImageProperties(imgData);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save('mortgage-calculation.pdf');
                
                Utils.showLoading(false);
                document.body.removeAttribute('data-printing');
                Utils.showToast('PDF saved successfully!', 'success');
            }).catch(error => {
                console.error('oops, something went wrong!', error);
                Utils.showLoading(false);
                document.body.removeAttribute('data-printing');
                Utils.showToast('Failed to generate PDF.', 'error');
            });
        }, 100);
    },
    
    toggleTheme: () => {
        const isDark = document.documentElement.getAttribute('data-color-scheme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-color-scheme');
            UI.elements.themeToggle.querySelector('.theme-icon').textContent = '🌙';
        } else {
            document.documentElement.setAttribute('data-color-scheme', 'dark');
            UI.elements.themeToggle.querySelector('.theme-icon').textContent = '☀️';
        }
    }
};

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏠 FinGuid Mortgage Calculator v9.1 - Production Ready');
    
    // Initialize the application
    UI.init();
    
    // Trigger initial calculation if form has default values
    setTimeout(() => {
        if (UI.isFormValid()) {
            UI.calculateMortgage();
        }
    }, 500);
});

// ========== ERROR HANDLING ==========
window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);
    Utils.showToast('An unexpected error occurred. Please refresh the page.', 'error');
});

// ========== EXPORT FOR TESTING ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        MortgageCalculator, 
        Utils, 
        UI, 
        AI, 
        STATE, 
        CONFIG,
        ChartManager
    };
}
