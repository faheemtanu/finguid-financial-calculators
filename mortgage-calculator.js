/**
 * mortgage-calculator.js
 * World's First AI-Enhanced Mortgage Calculator
 * Features: Voice commands, screen reader, dark/light mode, AI insights, interactive charts
 */

'use strict';

// ========== GLOBAL CONFIGURATION ==========
const CONFIG = {
    debounceDelay: 300,
    amortizationPageSize: 12,
    chartUpdateDelay: 150,
    voiceTimeout: 10000,
    saveKey: 'mortgage_calculations',
    
    // Chart styling
    chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                display: false // We use custom legend
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0,0,0,0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#21808d',
                borderWidth: 2,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    title: function(context) {
                        return `Year ${context[0].dataIndex + 1}`;
                    },
                    label: function(context) {
                        return `${context.dataset.label}: ${Utils.formatCurrency(context.parsed.y)}`;
                    }
                }
            },
            annotation: {
                annotations: {}
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0,0,0,0.1)',
                    lineWidth: 1
                },
                ticks: {
                    callback: function(value) {
                        return Utils.formatCurrency(value);
                    },
                    font: {
                        size: 11
                    }
                }
            },
            x: {
                grid: {
                    color: 'rgba(0,0,0,0.05)',
                    lineWidth: 1
                },
                ticks: {
                    font: {
                        size: 11
                    }
                }
            }
        }
    },
    
    // Color scheme
    colors: {
        primary: '#21808d',
        secondary: '#f59e0b',
        success: '#10b981',
        warning: '#f97316',
        error: '#ef4444',
        info: '#3b82f6',
        remaining: '#f97316', // Orange for remaining balance
        principal: '#10b981', // Green for principal paid
        interest: '#3b82f6'   // Blue for interest paid
    },

    // Voice commands
    voiceCommands: {
        'home price': 'home-price',
        'house price': 'home-price',
        'property price': 'home-price',
        'down payment': 'down-payment',
        'interest rate': 'interest-rate',
        'rate': 'interest-rate',
        'loan term': 'loan-term',
        'term': 'loan-term',
        'property tax': 'property-tax',
        'tax': 'property-tax',
        'insurance': 'home-insurance',
        'extra payment': 'extra-monthly',
        'extra monthly': 'extra-monthly',
        'calculate': 'calculate-btn',
        'reset': 'reset-form'
    }
};

// ========== GLOBAL STATE ==========
const STATE = {
    currentCalculation: null,
    amortizationData: [],
    currentView: 'monthly',
    currentPage: 1,
    totalPages: 1,
    timelineChart: null,
    isCalculating: false,
    
    // Accessibility & UI
    theme: 'light',
    fontSize: 'normal',
    isVoiceEnabled: false,
    isScreenReaderEnabled: false,
    isListening: false,
    speechRecognition: null,
    
    // Saved calculations
    savedCalculations: [],
    
    // Chart interaction
    chartYear: 28,
    chartAnnotation: null
};

// ========== STATE TAX RATES (2024) ==========
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
        if (isNaN(amount) || amount === null || amount === undefined) return '$0';
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

    formatPercent: (num, decimals = 1) => {
        if (isNaN(num)) return '0%';
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num / 100);
    },

    formatDate: (date, options = { year: 'numeric', month: 'short' }) => {
        if (!date || isNaN(date.getTime())) return '--';
        return date.toLocaleDateString('en-US', options);
    },

    debounce: (func, delay) => {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    throttle: (func, limit) => {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    showToast: (message, type = 'info', duration = 4000) => {
        const container = Utils.$('#toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">
                    <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
                </div>
                <div class="toast-message">${message}</div>
                <button class="toast-close" aria-label="Close notification">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        container.appendChild(toast);

        // Close button handler
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });

        // Auto remove
        setTimeout(() => {
            if (container.contains(toast)) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);

        // Announce to screen readers
        if (STATE.isScreenReaderEnabled) {
            ScreenReader.announce(message);
        }
    },

    showLoading: (message = 'Calculating your mortgage with AI insights...') => {
        const overlay = Utils.$('#loading-overlay');
        if (overlay) {
            overlay.querySelector('p').textContent = message;
            overlay.style.display = 'flex';
        }
    },

    hideLoading: () => {
        const overlay = Utils.$('#loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },

    animateValue: (element, start, end, duration = 1000) => {
        if (!element) return;
        
        const startValue = parseFloat(start) || 0;
        const endValue = parseFloat(end) || 0;
        const range = endValue - startValue;
        const startTime = performance.now();
        
        function updateValue(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = startValue + (range * easeOutQuart);
            
            element.textContent = Utils.formatCurrency(currentValue);
            
            if (progress < 1) {
                requestAnimationFrame(updateValue);
            }
        }
        
        requestAnimationFrame(updateValue);
    },

    saveToLocalStorage: (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.warn('Could not save to localStorage:', error);
        }
    },

    loadFromLocalStorage: (key, defaultValue = null) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.warn('Could not load from localStorage:', error);
            return defaultValue;
        }
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
        
        const monthlyPayment = principal * 
            (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
            (Math.pow(1 + monthlyRate, numPayments) - 1);
            
        return monthlyPayment;
    },

    calculateBiWeeklyPayment: (monthlyPayment) => {
        return monthlyPayment / 2;
    },

    calculatePMI: (loanAmount, downPaymentPercent, homePrice) => {
        if (downPaymentPercent >= 20) {
            return 0;
        }
        
        // PMI calculation: typically 0.3% to 1.15% annually
        // Higher PMI for lower down payments
        let annualPMIRate;
        if (downPaymentPercent < 5) {
            annualPMIRate = 0.011; // 1.1%
        } else if (downPaymentPercent < 10) {
            annualPMIRate = 0.008; // 0.8%
        } else if (downPaymentPercent < 15) {
            annualPMIRate = 0.006; // 0.6%
        } else {
            annualPMIRate = 0.004; // 0.4%
        }
        
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
            extraOnetime = 0,
            biWeekly = false
        } = params;

        const principal = homePrice - downPayment;
        const downPaymentPercent = (downPayment / homePrice) * 100;
        
        // Calculate PMI
        const monthlyPmi = MortgageCalculator.calculatePMI(principal, downPaymentPercent, homePrice);
        
        // Calculate base monthly payment
        let monthlyPayment = MortgageCalculator.calculateMonthlyPayment(principal, interestRate, loanTerm);
        let biWeeklyPayment = 0;
        
        if (biWeekly) {
            biWeeklyPayment = MortgageCalculator.calculateBiWeeklyPayment(monthlyPayment);
            // Bi-weekly effectively makes 13 monthly payments per year
            monthlyPayment = biWeeklyPayment * 2;
        }
        
        // Monthly breakdown
        const monthlyTax = propertyTax / 12;
        const monthlyInsurance = homeInsurance / 12;
        
        const totalMonthlyPayment = monthlyPayment + monthlyTax + monthlyInsurance + monthlyPmi;

        // Generate amortization schedules (both regular and with extra payments)
        const baseSchedule = MortgageCalculator.generateAmortizationSchedule({
            principal,
            monthlyPayment: MortgageCalculator.calculateMonthlyPayment(principal, interestRate, loanTerm),
            interestRate,
            extraMonthly: 0,
            extraOnetime: 0,
            biWeekly: false
        });

        const schedule = MortgageCalculator.generateAmortizationSchedule({
            principal,
            monthlyPayment: biWeekly ? biWeeklyPayment * 2 : monthlyPayment,
            interestRate,
            extraMonthly,
            extraOnetime,
            biWeekly
        });

        const totalInterest = schedule.reduce((sum, payment) => sum + payment.interest, 0);
        const totalCost = principal + totalInterest;
        const payoffDate = schedule.length > 0 ? schedule[schedule.length - 1].date : null;

        // Calculate savings from extra payments
        const baseTotalInterest = baseSchedule.reduce((sum, payment) => sum + payment.interest, 0);
        const interestSavings = baseTotalInterest - totalInterest;
        const timeSavings = (baseSchedule.length - schedule.length) / 12; // in years

        return {
            loanAmount: principal,
            monthlyPayment: totalMonthlyPayment,
            principalAndInterest: monthlyPayment,
            biWeeklyPayment,
            monthlyTax,
            monthlyInsurance,
            monthlyPmi,
            totalInterest,
            totalCost,
            payoffDate,
            amortization: schedule,
            baseAmortization: baseSchedule,
            downPaymentAmount: downPayment,
            downPaymentPercent,
            homePrice,
            interestSavings,
            timeSavings,
            biWeekly
        };
    },

    generateAmortizationSchedule: (params) => {
        const {
            principal,
            monthlyPayment,
            interestRate,
            extraMonthly = 0,
            extraOnetime = 0,
            biWeekly = false
        } = params;

        const schedule = [];
        let balance = principal;
        let paymentNumber = 1;
        const startDate = new Date();
        
        // Adjust payment frequency
        const paymentFrequency = biWeekly ? 26 : 12; // payments per year
        const periodicRate = interestRate / 100 / paymentFrequency;
        const actualPayment = biWeekly ? monthlyPayment / 2 : monthlyPayment;

        while (balance > 0.01 && paymentNumber <= 600) { // max 50 years monthly or 25 years biweekly
            const currentDate = new Date(startDate);
            if (biWeekly) {
                currentDate.setDate(currentDate.getDate() + (paymentNumber - 1) * 14);
            } else {
                currentDate.setMonth(currentDate.getMonth() + paymentNumber - 1);
            }

            const interestPayment = balance * periodicRate;
            let principalPayment = actualPayment - interestPayment;
            
            // Apply extra payments (only for monthly)
            let extraPayment = 0;
            if (!biWeekly) {
                extraPayment = extraMonthly;
                
                // Apply one-time extra payment at month 12
                if (paymentNumber === 12 && extraOnetime > 0) {
                    extraPayment += extraOnetime;
                }
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
                payment: actualPayment + extraPayment,
                principal: principalPayment,
                interest: interestPayment,
                balance: Math.max(0, balance),
                extraPayment
            });

            paymentNumber++;
        }

        return schedule;
    }
};

// ========== CHART MANAGEMENT ==========
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

        // Update chart header values for selected year
        ChartManager.updateChartHeaderValues(filteredData, yearRange - 1, calculation);

        const config = {
            type: 'line',
            data: {
                labels: filteredData.map(item => `${item.year}`),
                datasets: [
                    {
                        label: 'Remaining Mortgage Balance',
                        data: filteredData.map(item => item.balance),
                        borderColor: CONFIG.colors.remaining,
                        backgroundColor: CONFIG.colors.remaining + '20',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointHoverRadius: 8,
                        pointBackgroundColor: CONFIG.colors.remaining,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Principal Paid',
                        data: filteredData.map(item => item.cumulativePrincipal),
                        borderColor: CONFIG.colors.principal,
                        backgroundColor: CONFIG.colors.principal + '20',
                        fill: false,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointHoverRadius: 8,
                        pointBackgroundColor: CONFIG.colors.principal,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Interest Paid',
                        data: filteredData.map(item => item.cumulativeInterest),
                        borderColor: CONFIG.colors.interest,
                        backgroundColor: CONFIG.colors.interest + '20',
                        fill: false,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointHoverRadius: 8,
                        pointBackgroundColor: CONFIG.colors.interest,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                ...CONFIG.chartOptions,
                onHover: (event, elements) => {
                    if (elements.length > 0) {
                        const dataIndex = elements[0].index;
                        ChartManager.updateChartHeaderValues(filteredData, dataIndex, calculation);
                        STATE.chartYear = dataIndex + 1;
                        Utils.$('#current-year').textContent = STATE.chartYear;
                    }
                }
            }
        };

        STATE.timelineChart = new Chart(ctx, config);
        
        // Update chart annotations if needed
        ChartManager.updateChartAnnotations(yearRange - 1);
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
    },

    updateChartHeaderValues: (yearlyData, yearIndex, calculation) => {
        if (!yearlyData || yearIndex < 0 || yearIndex >= yearlyData.length) return;
        
        const data = yearlyData[yearIndex];
        
        Utils.$('#chart-loan-amount').textContent = Utils.formatCurrency(calculation.homePrice);
        Utils.$('#remaining-balance').textContent = Utils.formatCurrency(data.balance);
        Utils.$('#principal-paid').textContent = Utils.formatCurrency(data.cumulativePrincipal);
        Utils.$('#interest-paid').textContent = Utils.formatCurrency(data.cumulativeInterest);
        Utils.$('#current-year').textContent = yearIndex + 1;
    },

    updateChartAnnotations: (yearIndex) => {
        if (!STATE.timelineChart) return;
        
        // Add vertical line annotation at current year
        const annotation = {
            type: 'line',
            mode: 'vertical',
            scaleID: 'x',
            value: yearIndex,
            borderColor: CONFIG.colors.primary,
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
                enabled: true,
                content: `Year ${yearIndex + 1}`,
                position: 'top'
            }
        };
        
        STATE.timelineChart.options.plugins.annotation.annotations = { currentYear: annotation };
        STATE.timelineChart.update('none');
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
            principalAndInterest,
            downPaymentAmount, 
            downPaymentPercent,
            homePrice,
            monthlyPmi,
            interestSavings,
            timeSavings,
            biWeekly
        } = calculation;

        // Down payment analysis
        if (downPaymentPercent < 10) {
            insights.push({
                type: 'warning',
                icon: '⚠️',
                title: 'Low Down Payment Alert',
                content: `Your ${downPaymentPercent.toFixed(1)}% down payment requires PMI (${Utils.formatCurrency(monthlyPmi)}/month). Consider saving more to reduce monthly costs.`,
                priority: 'high',
                action: 'Consider increasing down payment to 20% to eliminate PMI'
            });
        } else if (downPaymentPercent < 20) {
            insights.push({
                type: 'info',
                icon: '💡',
                title: 'PMI Required',
                content: `Your ${downPaymentPercent.toFixed(1)}% down payment requires PMI. You'll pay ${Utils.formatCurrency(monthlyPmi * 12)} annually until you reach 20% equity.`,
                priority: 'medium',
                action: 'Track home value appreciation to remove PMI sooner'
            });
        } else {
            insights.push({
                type: 'success',
                icon: '✅',
                title: 'Excellent Down Payment',
                content: `Your ${downPaymentPercent.toFixed(1)}% down payment eliminates PMI, saving you approximately ${Utils.formatCurrency(loanAmount * 0.006)} annually.`,
                priority: 'low',
                action: 'Consider investing saved PMI amount for additional returns'
            });
        }

        // Interest cost analysis
        const interestRatio = (totalInterest / loanAmount) * 100;
        if (interestRatio > 100) {
            insights.push({
                type: 'warning',
                icon: '📊',
                title: 'High Interest Cost',
                content: `You'll pay ${Utils.formatCurrency(totalInterest)} in interest (${interestRatio.toFixed(0)}% of loan amount). This is quite high for a 30-year loan.`,
                priority: 'high',
                action: 'Consider a shorter loan term or extra payments to reduce total interest'
            });
        } else if (interestRatio > 80) {
            insights.push({
                type: 'info',
                icon: '📈',
                title: 'Interest Impact',
                content: `Total interest will be ${Utils.formatCurrency(totalInterest)}. Even small extra payments can significantly reduce this amount.`,
                priority: 'medium',
                action: 'Try adding $100-200 monthly to see dramatic interest savings'
            });
        }

        // Payment-to-income recommendation
        const recommendedIncome = monthlyPayment / 0.28;
        const conservativeIncome = monthlyPayment / 0.25;
        insights.push({
            type: 'info',
            icon: '💰',
            title: 'Income Guidelines',
            content: `For comfortable affordability, your gross monthly income should be ${Utils.formatCurrency(recommendedIncome)} (28% rule) to ${Utils.formatCurrency(conservativeIncome)} (25% rule).`,
            priority: 'medium',
            action: 'Ensure total debt payments don\'t exceed 36% of gross income'
        });

        // Extra payment benefits
        if (interestSavings > 1000 || timeSavings > 0.5) {
            insights.push({
                type: 'success',
                icon: '🎯',
                title: 'Smart Extra Payment Strategy',
                content: `Your extra payments save ${Utils.formatCurrency(interestSavings)} in interest and ${timeSavings.toFixed(1)} years off your loan term!`,
                priority: 'high',
                action: 'Continue extra payments for maximum savings'
            });
        } else {
            const sample100Extra = MortgageCalculator.calculateMortgage({
                homePrice: homePrice,
                downPayment: downPaymentAmount,
                interestRate: 6.75, // Using example rate
                loanTerm: 30,
                propertyTax: 3000,
                homeInsurance: 1700,
                extraMonthly: 100,
                extraOnetime: 0,
                biWeekly: false
            });
            
            const potential100Savings = sample100Extra.interestSavings;
            
            insights.push({
                type: 'info',
                icon: '💡',
                title: 'Extra Payment Opportunity',
                content: `Adding just $100/month could save you approximately ${Utils.formatCurrency(potential100Savings)} in interest over the loan term.`,
                priority: 'medium',
                action: 'Consider any amount of extra payment - every dollar counts!'
            });
        }

        // Bi-weekly payment analysis
        if (biWeekly) {
            insights.push({
                type: 'success',
                icon: '📅',
                title: 'Bi-weekly Payment Benefits',
                content: `Bi-weekly payments effectively make 13 monthly payments per year, significantly reducing your loan term and interest costs.`,
                priority: 'high',
                action: 'Ensure your lender applies bi-weekly payments correctly to principal'
            });
        } else {
            // Calculate bi-weekly benefits
            const biWeeklyCalc = MortgageCalculator.calculateMortgage({
                homePrice: homePrice,
                downPayment: downPaymentAmount,
                interestRate: 6.75,
                loanTerm: 30,
                propertyTax: 3000,
                homeInsurance: 1700,
                extraMonthly: 0,
                extraOnetime: 0,
                biWeekly: true
            });
            
            insights.push({
                type: 'info',
                icon: '📅',
                title: 'Bi-weekly Payment Option',
                content: `Switching to bi-weekly payments could save you approximately ${Utils.formatCurrency(biWeeklyCalc.interestSavings)} and ${biWeeklyCalc.timeSavings.toFixed(1)} years.`,
                priority: 'medium',
                action: 'Consider bi-weekly payments if your budget allows'
            });
        }

        // Market timing insight
        const currentRate = 6.75; // This could be fetched from an API
        insights.push({
            type: 'info',
            icon: '📍',
            title: 'Current Market Context',
            content: `Current mortgage rates are around ${currentRate}%. Consider locking in your rate if you're satisfied with current terms.`,
            priority: 'low',
            action: 'Monitor rate trends and consider refinancing if rates drop significantly'
        });

        // Sort insights by priority
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return insights.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    }
};

// ========== THEME MANAGEMENT ==========
const ThemeManager = {
    init: () => {
        const savedTheme = Utils.loadFromLocalStorage('theme', 'light');
        STATE.theme = savedTheme;
        ThemeManager.applyTheme(savedTheme);
        
        Utils.$('#theme-toggle').addEventListener('click', ThemeManager.toggleTheme);
    },

    toggleTheme: () => {
        const newTheme = STATE.theme === 'light' ? 'dark' : 'light';
        ThemeManager.applyTheme(newTheme);
    },

    applyTheme: (theme) => {
        STATE.theme = theme;
        document.body.setAttribute('data-theme', theme);
        
        const themeIcon = Utils.$('#theme-icon');
        const themeText = Utils.$('#theme-toggle span');
        
        if (theme === 'dark') {
            themeIcon.className = 'fas fa-sun';
            themeText.textContent = 'Light Mode';
        } else {
            themeIcon.className = 'fas fa-moon';
            themeText.textContent = 'Dark Mode';
        }
        
        Utils.saveToLocalStorage('theme', theme);
        
        // Update chart colors if chart exists
        if (STATE.timelineChart) {
            ChartManager.renderTimelineChart(STATE.currentCalculation);
        }
        
        // Announce theme change
        if (STATE.isScreenReaderEnabled) {
            ScreenReader.announce(`Switched to ${theme} mode`);
        }
    }
};

// ========== FONT SIZE MANAGEMENT ==========
const FontManager = {
    init: () => {
        const savedFontSize = Utils.loadFromLocalStorage('fontSize', 'normal');
        STATE.fontSize = savedFontSize;
        FontManager.applyFontSize(savedFontSize);
        
        Utils.$('#font-smaller').addEventListener('click', () => FontManager.changeFontSize('smaller'));
        Utils.$('#font-larger').addEventListener('click', () => FontManager.changeFontSize('larger'));
    },

    changeFontSize: (direction) => {
        const sizes = ['small', 'normal', 'large', 'extra-large'];
        const currentIndex = sizes.indexOf(STATE.fontSize);
        
        let newIndex;
        if (direction === 'smaller') {
            newIndex = Math.max(0, currentIndex - 1);
        } else {
            newIndex = Math.min(sizes.length - 1, currentIndex + 1);
        }
        
        FontManager.applyFontSize(sizes[newIndex]);
    },

    applyFontSize: (size) => {
        STATE.fontSize = size;
        document.body.setAttribute('data-font-size', size);
        Utils.saveToLocalStorage('fontSize', size);
        
        if (STATE.isScreenReaderEnabled) {
            ScreenReader.announce(`Font size changed to ${size}`);
        }
    }
};

// ========== VOICE CONTROL ==========
const VoiceManager = {
    init: () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            Utils.$('#voice-toggle').style.display = 'none';
            Utils.$('#voice-input').style.display = 'none';
            return;
        }

        Utils.$('#voice-toggle').addEventListener('click', VoiceManager.toggleVoice);
        Utils.$('#voice-input').addEventListener('click', VoiceManager.startListening);
        
        VoiceManager.setupSpeechRecognition();
    },

    toggleVoice: () => {
        STATE.isVoiceEnabled = !STATE.isVoiceEnabled;
        const btn = Utils.$('#voice-toggle');
        const icon = Utils.$('#voice-icon');
        const text = btn.querySelector('span');
        
        if (STATE.isVoiceEnabled) {
            btn.classList.add('active');
            icon.className = 'fas fa-microphone-slash';
            text.textContent = 'Voice Off';
            Utils.showToast('Voice control enabled. Click "Voice Input" or say "Hey Calculator"', 'success');
        } else {
            btn.classList.remove('active');
            icon.className = 'fas fa-microphone';
            text.textContent = 'Voice Control';
            VoiceManager.stopListening();
            Utils.showToast('Voice control disabled', 'info');
        }
        
        Utils.saveToLocalStorage('voiceEnabled', STATE.isVoiceEnabled);
    },

    setupSpeechRecognition: () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            STATE.isListening = true;
            VoiceManager.showVoiceStatus('Listening... Speak your mortgage details');
            Utils.$('#voice-input').classList.add('listening');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            VoiceManager.processVoiceCommand(transcript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            VoiceManager.hideVoiceStatus();
            Utils.showToast(`Voice recognition error: ${event.error}`, 'error');
        };

        recognition.onend = () => {
            VoiceManager.stopListening();
        };

        STATE.speechRecognition = recognition;
    },

    startListening: () => {
        if (!STATE.isVoiceEnabled) {
            Utils.showToast('Please enable voice control first', 'warning');
            return;
        }

        if (STATE.isListening) {
            VoiceManager.stopListening();
            return;
        }

        try {
            STATE.speechRecognition.start();
        } catch (error) {
            Utils.showToast('Could not start voice recognition', 'error');
        }
    },

    stopListening: () => {
        STATE.isListening = false;
        VoiceManager.hideVoiceStatus();
        Utils.$('#voice-input').classList.remove('listening');
        
        if (STATE.speechRecognition) {
            try {
                STATE.speechRecognition.stop();
            } catch (error) {
                // Ignore errors when stopping
            }
        }
    },

    processVoiceCommand: (transcript) => {
        console.log('Voice command:', transcript);
        
        // Extract numbers and keywords
        const numbers = transcript.match(/\d+(?:,\d{3})*(?:\.\d+)?/g) || [];
        
        // Command mapping
        let processed = false;
        
        // Home price commands
        if (transcript.includes('home price') || transcript.includes('house price') || transcript.includes('property price')) {
            const amount = VoiceManager.extractAmount(transcript, numbers);
            if (amount) {
                Utils.$('#home-price').value = amount;
                processed = true;
            }
        }
        
        // Down payment commands
        if (transcript.includes('down payment') || transcript.includes('down')) {
            if (transcript.includes('percent') || transcript.includes('%')) {
                const percent = VoiceManager.extractNumber(transcript, numbers, 100);
                if (percent) {
                    Utils.$('#down-payment-percent').value = percent;
                    Utils.$('#percent-toggle').click();
                    processed = true;
                }
            } else {
                const amount = VoiceManager.extractAmount(transcript, numbers);
                if (amount) {
                    Utils.$('#down-payment').value = amount;
                    processed = true;
                }
            }
        }
        
        // Interest rate commands
        if (transcript.includes('interest rate') || transcript.includes('rate')) {
            const rate = VoiceManager.extractNumber(transcript, numbers, 15);
            if (rate) {
                Utils.$('#interest-rate').value = rate;
                processed = true;
            }
        }
        
        // Loan term commands
        if (transcript.includes('loan term') || transcript.includes('term') || transcript.includes('years')) {
            const years = VoiceManager.extractNumber(transcript, numbers, 40);
            if (years === 15 || years === 20 || years === 30) {
                Utils.$(`[data-term="${years}"]`).click();
                processed = true;
            }
        }
        
        // Extra payment commands
        if (transcript.includes('extra payment') || transcript.includes('extra monthly')) {
            const amount = VoiceManager.extractAmount(transcript, numbers);
            if (amount) {
                Utils.$('#extra-monthly').value = amount;
                processed = true;
            }
        }
        
        // Action commands
        if (transcript.includes('calculate') || transcript.includes('compute')) {
            Utils.$('#calculate-btn').click();
            processed = true;
        }
        
        if (transcript.includes('reset') || transcript.includes('clear')) {
            Utils.$('#reset-form').click();
            processed = true;
        }
        
        VoiceManager.hideVoiceStatus();
        
        if (processed) {
            Utils.showToast('Voice command processed successfully!', 'success');
            FormManager.handleInputChange(); // Trigger calculation
        } else {
            Utils.showToast(`Could not understand: "${transcript}". Try commands like "home price 400000" or "interest rate 6.5"`, 'warning');
        }
    },

    extractAmount: (text, numbers) => {
        // Look for large numbers (likely dollar amounts)
        for (const num of numbers) {
            const amount = parseInt(num.replace(/,/g, ''));
            if (amount >= 50000) { // Minimum reasonable home price
                return amount;
            }
        }
        
        // Check for "k" or "thousand" multipliers
        const kMatch = text.match(/(\d+(?:\.\d+)?)\s*k/);
        if (kMatch) {
            return parseInt(parseFloat(kMatch[1]) * 1000);
        }
        
        return null;
    },

    extractNumber: (text, numbers, maxValue = 100) => {
        for (const num of numbers) {
            const value = parseFloat(num);
            if (value <= maxValue) {
                return value;
            }
        }
        return null;
    },

    showVoiceStatus: (message) => {
        const status = Utils.$('#voice-status');
        status.querySelector('span').textContent = message;
        status.style.display = 'flex';
    },

    hideVoiceStatus: () => {
        const status = Utils.$('#voice-status');
        status.style.display = 'none';
    }
};

// ========== SCREEN READER SUPPORT ==========
const ScreenReader = {
    init: () => {
        const savedSREnabled = Utils.loadFromLocalStorage('screenReaderEnabled', false);
        STATE.isScreenReaderEnabled = savedSREnabled;
        ScreenReader.updateUI();
        
        Utils.$('#screen-reader-toggle').addEventListener('click', ScreenReader.toggle);
    },

    toggle: () => {
        STATE.isScreenReaderEnabled = !STATE.isScreenReaderEnabled;
        ScreenReader.updateUI();
        Utils.saveToLocalStorage('screenReaderEnabled', STATE.isScreenReaderEnabled);
        
        const message = STATE.isScreenReaderEnabled ? 
            'Screen reader enhancements enabled. You will now receive detailed spoken feedback.' :
            'Screen reader enhancements disabled.';
            
        ScreenReader.announce(message);
    },

    updateUI: () => {
        const btn = Utils.$('#screen-reader-toggle');
        const icon = Utils.$('#reader-icon');
        const text = btn.querySelector('span');
        
        if (STATE.isScreenReaderEnabled) {
            btn.classList.add('active');
            text.textContent = 'SR On';
        } else {
            btn.classList.remove('active');
            text.textContent = 'Screen Reader';
        }
    },

    announce: (message) => {
        if (!STATE.isScreenReaderEnabled) return;
        
        // Create a live region for announcements
        let liveRegion = Utils.$('#sr-live-region');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'sr-live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            document.body.appendChild(liveRegion);
        }
        
        // Clear and set new message
        liveRegion.textContent = '';
        setTimeout(() => {
            liveRegion.textContent = message;
        }, 100);
    },

    announceCalculation: (calculation) => {
        if (!STATE.isScreenReaderEnabled) return;
        
        const announcement = `Calculation complete. 
            Total monthly payment: ${Utils.formatCurrency(calculation.monthlyPayment)}.
            Loan amount: ${Utils.formatCurrency(calculation.loanAmount)}.
            Total interest: ${Utils.formatCurrency(calculation.totalInterest)}.
            Payoff date: ${Utils.formatDate(calculation.payoffDate)}.`;
            
        ScreenReader.announce(announcement);
    }
};

// ========== FORM MANAGEMENT ==========
const FormManager = {
    init: () => {
        FormManager.setupEventListeners();
        FormManager.populateStateDropdown();
        FormManager.setupTermChips();
        FormManager.setupDownPaymentToggle();
        FormManager.setupSuggestionChips();
        FormManager.loadSavedData();
        
        // Initial calculation with default values
        setTimeout(() => {
            FormManager.handleInputChange();
        }, 500);
    },

    setupEventListeners: () => {
        const form = Utils.$('#mortgage-form');
        if (!form) return;

        // Main form inputs with debounced updates
        const inputs = Utils.$$('#mortgage-form input, #mortgage-form select');
        inputs.forEach(input => {
            input.addEventListener('input', Utils.debounce(FormManager.handleInputChange, CONFIG.debounceDelay));
            input.addEventListener('change', FormManager.handleInputChange);
            
            // Add focus/blur handlers for better UX
            input.addEventListener('focus', (e) => {
                e.target.parentElement?.classList.add('focused');
            });
            
            input.addEventListener('blur', (e) => {
                e.target.parentElement?.classList.remove('focused');
                FormManager.validateField(e.target);
            });
        });

        // Property state change for tax calculation
        Utils.$('#property-state')?.addEventListener('change', FormManager.handleStateChange);
        
        // Bi-weekly toggle
        Utils.$('#bi-weekly')?.addEventListener('change', FormManager.handleInputChange);
        
        // Form actions
        Utils.$('#calculate-btn')?.addEventListener('click', FormManager.forceCalculation);
        Utils.$('#reset-form')?.addEventListener('click', FormManager.resetForm);
        Utils.$('#save-calculation')?.addEventListener('click', FormManager.saveCalculation);
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
                chip.setAttribute('aria-checked', 'true');
                
                // Update other chips
                termChips.forEach(c => {
                    if (c !== chip) {
                        c.setAttribute('aria-checked', 'false');
                    }
                });
                
                // Update hidden select
                if (loanTermSelect) {
                    loanTermSelect.value = chip.dataset.term;
                    
                    // Update year slider max value
                    const yearSlider = Utils.$('#year-range');
                    const maxYearLabel = Utils.$('#max-year');
                    if (yearSlider) {
                        yearSlider.max = chip.dataset.term;
                        if (maxYearLabel) {
                            maxYearLabel.textContent = chip.dataset.term;
                        }
                    }
                    
                    FormManager.handleInputChange();
                }
                
                if (STATE.isScreenReaderEnabled) {
                    ScreenReader.announce(`Loan term set to ${chip.dataset.term} years`);
                }
            });
        });
    },

    setupDownPaymentToggle: () => {
        const amountToggle = Utils.$('#amount-toggle');
        const percentToggle = Utils.$('#percent-toggle');
        const amountInput = Utils.$('#amount-input');
        const percentInput = Utils.$('#percent-input');
        const downPaymentInput = Utils.$('#down-payment');
        const downPaymentPercentInput = Utils.$('#down-payment-percent');
        const homePriceInput = Utils.$('#home-price');

        if (!amountToggle || !percentToggle) return;

        amountToggle.addEventListener('click', () => {
            amountToggle.classList.add('active');
            percentToggle.classList.remove('active');
            amountToggle.setAttribute('aria-checked', 'true');
            percentToggle.setAttribute('aria-checked', 'false');
            amountInput.style.display = 'flex';
            percentInput.style.display = 'none';
            downPaymentInput.focus();
        });

        percentToggle.addEventListener('click', () => {
            percentToggle.classList.add('active');
            amountToggle.classList.remove('active');
            percentToggle.setAttribute('aria-checked', 'true');
            amountToggle.setAttribute('aria-checked', 'false');
            amountInput.style.display = 'none';
            percentInput.style.display = 'flex';
            downPaymentPercentInput.focus();
        });

        // Sync dollar and percentage inputs
        if (downPaymentInput && downPaymentPercentInput && homePriceInput) {
            downPaymentInput.addEventListener('input', () => {
                const homePrice = parseFloat(homePriceInput.value) || 0;
                const downPayment = parseFloat(downPaymentInput.value) || 0;
                const percent = homePrice > 0 ? (downPayment / homePrice) * 100 : 0;
                downPaymentPercentInput.value = percent.toFixed(1);
                FormManager.updatePMIWarning(percent);
            });

            downPaymentPercentInput.addEventListener('input', () => {
                const homePrice = parseFloat(homePriceInput.value) || 0;
                const percent = parseFloat(downPaymentPercentInput.value) || 0;
                const downPayment = (homePrice * percent) / 100;
                downPaymentInput.value = Math.round(downPayment);
                FormManager.updatePMIWarning(percent);
            });
            
            // Update PMI warning on home price change
            homePriceInput.addEventListener('input', () => {
                const homePrice = parseFloat(homePriceInput.value) || 0;
                const downPayment = parseFloat(downPaymentInput.value) || 0;
                const percent = homePrice > 0 ? (downPayment / homePrice) * 100 : 0;
                downPaymentPercentInput.value = percent.toFixed(1);
                FormManager.updatePMIWarning(percent);
            });
        }
    },

    setupSuggestionChips: () => {
        Utils.$$('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const targetInput = chip.dataset.input;
                const value = chip.dataset.value;
                
                if (targetInput && value) {
                    const input = Utils.$(`#${targetInput}`);
                    if (input) {
                        input.value = value;
                        input.focus();
                        FormManager.handleInputChange();
                    }
                } else {
                    // For home price suggestions
                    const input = Utils.$('#home-price');
                    if (input) {
                        input.value = value;
                        input.focus();
                        FormManager.handleInputChange();
                    }
                }
            });
        });
    },

    updatePMIWarning: (downPaymentPercent) => {
        const warning = Utils.$('#pmi-warning');
        const pmiStatus = Utils.$('#pmi-status');
        
        if (downPaymentPercent < 20) {
            warning.style.display = 'flex';
            if (pmiStatus) {
                pmiStatus.textContent = `PMI required (${downPaymentPercent.toFixed(1)}% down payment)`;
                pmiStatus.className = 'form-help text-warning';
            }
        } else {
            warning.style.display = 'none';
            if (pmiStatus) {
                pmiStatus.textContent = 'No PMI required (20%+ down payment)';
                pmiStatus.className = 'form-help text-success';
            }
        }
    },

    handleStateChange: () => {
        const stateSelect = Utils.$('#property-state');
        const propertyTaxInput = Utils.$('#property-tax');
        const taxRateDisplay = Utils.$('#tax-rate-display');
        
        if (!stateSelect || !propertyTaxInput) return;
        
        const selectedState = stateSelect.value;
        const homePrice = parseFloat(Utils.$('#home-price').value) || 0;
        
        if (selectedState && STATE_TAX_RATES[selectedState] && homePrice > 0) {
            const taxRate = STATE_TAX_RATES[selectedState].rate;
            const estimatedTax = homePrice * taxRate;
            propertyTaxInput.value = Math.round(estimatedTax);
            
            if (taxRateDisplay) {
                taxRateDisplay.textContent = Utils.formatPercent(taxRate * 100);
            }
            
            FormManager.handleInputChange();
            
            if (STATE.isScreenReaderEnabled) {
                ScreenReader.announce(`Property tax estimated at ${Utils.formatCurrency(estimatedTax)} for ${STATE_TAX_RATES[selectedState].name}`);
            }
        }
    },

    handleInputChange: () => {
        if (STATE.isCalculating) return;
        
        STATE.isCalculating = true;
        
        try {
            const formData = FormManager.getFormData();
            if (FormManager.validateForm(formData)) {
                const calculation = MortgageCalculator.calculateMortgage(formData);
                STATE.currentCalculation = calculation;
                ResultsManager.displayResults(calculation);
                FormManager.updateExtraPaymentPreview(calculation);
                FormManager.saveFormData(formData);
            }
        } catch (error) {
            console.error('Calculation error:', error);
            Utils.showToast('Error in calculation. Please check your inputs.', 'error');
        } finally {
            STATE.isCalculating = false;
        }
    },

    forceCalculation: () => {
        Utils.showLoading('Generating AI insights...');
        
        setTimeout(() => {
            FormManager.handleInputChange();
            Utils.hideLoading();
            
            if (STATE.currentCalculation && STATE.isScreenReaderEnabled) {
                ScreenReader.announceCalculation(STATE.currentCalculation);
            }
        }, 1000);
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
            extraOnetime: parseFloat(Utils.$('#extra-onetime').value) || 0,
            biWeekly: Utils.$('#bi-weekly')?.checked || false
        };
    },

    validateForm: (data) => {
        const errors = [];
        
        if (data.homePrice <= 0) errors.push('Home price must be greater than 0');
        if (data.downPayment < 0) errors.push('Down payment cannot be negative');
        if (data.downPayment >= data.homePrice) errors.push('Down payment must be less than home price');
        if (data.interestRate <= 0 || data.interestRate > 15) errors.push('Interest rate must be between 0.1% and 15%');
        if (![15, 20, 30].includes(data.loanTerm)) errors.push('Loan term must be 15, 20, or 30 years');
        
        if (errors.length > 0) {
            Utils.showToast(errors[0], 'error');
            return false;
        }
        
        return true;
    },

    validateField: (field) => {
        const value = parseFloat(field.value);
        let isValid = true;
        let message = '';
        
        switch (field.id) {
            case 'home-price':
                if (value < 50000) {
                    isValid = false;
                    message = 'Minimum home price is $50,000';
                }
                break;
            case 'interest-rate':
                if (value < 1 || value > 15) {
                    isValid = false;
                    message = 'Interest rate must be between 1% and 15%';
                }
                break;
        }
        
        if (!isValid) {
            field.classList.add('error');
            Utils.showToast(message, 'error');
        } else {
            field.classList.remove('error');
        }
        
        return isValid;
    },

    updateExtraPaymentPreview: (calculation) => {
        const preview = Utils.$('#extra-impact');
        const savingsPreview = Utils.$('#savings-preview');
        
        if (calculation.interestSavings > 0 || calculation.timeSavings > 0) {
            if (preview) {
                preview.style.display = 'block';
                Utils.$('#interest-savings').textContent = Utils.formatCurrency(calculation.interestSavings);
                Utils.$('#time-savings').textContent = `${calculation.timeSavings.toFixed(1)} years`;
                Utils.$('#new-payoff').textContent = Utils.formatDate(calculation.payoffDate);
            }
            
            if (savingsPreview) {
                savingsPreview.textContent = `Potential savings: ${Utils.formatCurrency(calculation.interestSavings)}`;
            }
        } else {
            if (preview) preview.style.display = 'none';
            if (savingsPreview) savingsPreview.textContent = 'Add extra payments to see savings';
        }
    },

    populateStateDropdown: () => {
        const stateSelect = Utils.$('#property-state');
        if (!stateSelect) return;

        // Clear existing options except the first one
        while (stateSelect.children.length > 1) {
            stateSelect.removeChild(stateSelect.lastChild);
        }

        Object.entries(STATE_TAX_RATES).forEach(([code, state]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = state.name;
            stateSelect.appendChild(option);
        });

        // Set default to California
        stateSelect.value = 'CA';
        FormManager.handleStateChange();
    },

    resetForm: () => {
        if (confirm('Reset all fields to default values?')) {
            // Reset form fields
            Utils.$('#home-price').value = '400000';
            Utils.$('#down-payment').value = '80000';
            Utils.$('#down-payment-percent').value = '20';
            Utils.$('#interest-rate').value = '6.75';
            Utils.$('#property-tax').value = '3000';
            Utils.$('#home-insurance').value = '1700';
            Utils.$('#extra-monthly').value = '0';
            Utils.$('#extra-onetime').value = '0';
            Utils.$('#bi-weekly').checked = false;
            
            // Reset term chips
            Utils.$$('.term-chip').forEach(chip => chip.classList.remove('active'));
            Utils.$('[data-term="30"]').classList.add('active');
            Utils.$('#loan-term').value = '30';
            
            // Reset toggles
            Utils.$('#amount-toggle').click();
            
            // Reset state
            Utils.$('#property-state').value = 'CA';
            
            FormManager.handleInputChange();
            Utils.showToast('Form reset to default values', 'info');
        }
    },

    saveCalculation: () => {
        if (!STATE.currentCalculation) {
            Utils.showToast('No calculation to save', 'warning');
            return;
        }
        
        const calculation = {
            ...STATE.currentCalculation,
            timestamp: new Date().toISOString(),
            formData: FormManager.getFormData()
        };
        
        STATE.savedCalculations.push(calculation);
        Utils.saveToLocalStorage(CONFIG.saveKey, STATE.savedCalculations);
        Utils.showToast('Calculation saved successfully!', 'success');
    },

    saveFormData: (formData) => {
        Utils.saveToLocalStorage('lastFormData', formData);
    },

    loadSavedData: () => {
        const savedFormData = Utils.loadFromLocalStorage('lastFormData');
        const savedCalculations = Utils.loadFromLocalStorage(CONFIG.saveKey, []);
        
        STATE.savedCalculations = savedCalculations;
        
        if (savedFormData) {
            // Load saved form data
            Object.entries(savedFormData).forEach(([key, value]) => {
                const input = Utils.$(`#${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
                if (input) {
                    input.value = value;
                }
            });
        }
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
        ResultsManager.updateBreakdownBars(calculation);
    },

    displayPaymentSummary: (calculation) => {
        const {
            monthlyPayment,
            principalAndInterest,
            monthlyTax,
            monthlyInsurance,
            monthlyPmi
        } = calculation;

        // Animate the total payment update
        const totalPaymentEl = Utils.$('#total-payment');
        const currentValue = parseFloat(totalPaymentEl.textContent.replace(/[$,]/g, '')) || 0;
        Utils.animateValue(totalPaymentEl, currentValue, monthlyPayment, 800);

        // Update breakdown values
        Utils.$('#principal-interest').textContent = Utils.formatCurrency(principalAndInterest);
        Utils.$('#monthly-tax').textContent = Utils.formatCurrency(monthlyTax);
        Utils.$('#monthly-insurance').textContent = Utils.formatCurrency(monthlyInsurance);
        Utils.$('#monthly-pmi').textContent = Utils.formatCurrency(monthlyPmi);
        
        // Update PMI input field
        const pmiInput = Utils.$('#pmi');
        if (pmiInput) {
            pmiInput.value = monthlyPmi;
        }

        // Show payment change indicator
        const changeEl = Utils.$('#payment-change');
        if (STATE.previousPayment && Math.abs(STATE.previousPayment - monthlyPayment) > 1) {
            const difference = monthlyPayment - STATE.previousPayment;
            const icon = difference > 0 ? 'fa-arrow-up' : 'fa-arrow-down';
            const color = difference > 0 ? 'text-error' : 'text-success';
            const sign = difference > 0 ? '+' : '';
            
            changeEl.innerHTML = `
                <i class="fas ${icon}"></i>
                <span>${sign}${Utils.formatCurrency(Math.abs(difference))} from previous</span>
            `;
            changeEl.className = `payment-change ${color}`;
            changeEl.style.display = 'flex';
        }
        
        STATE.previousPayment = monthlyPayment;
    },

    displayLoanSummary: (calculation) => {
        const { loanAmount, totalInterest, totalCost, payoffDate } = calculation;

        Utils.$('#display-loan-amount').textContent = Utils.formatCurrency(loanAmount);
        Utils.$('#display-total-interest').textContent = Utils.formatCurrency(totalInterest);
        Utils.$('#display-total-cost').textContent = Utils.formatCurrency(totalCost);
        Utils.$('#display-payoff-date').textContent = payoffDate ? 
            Utils.formatDate(payoffDate, { year: 'numeric', month: 'short' }) : '--';
    },

    updateBreakdownBars: (calculation) => {
        const total = calculation.monthlyPayment;
        const components = [
            calculation.principalAndInterest,
            calculation.monthlyTax,
            calculation.monthlyInsurance,
            calculation.monthlyPmi
        ];

        const bars = Utils.$$('.breakdown-fill');
        bars.forEach((bar, index) => {
            const percentage = (components[index] / total) * 100;
            bar.style.width = `${percentage}%`;
            bar.style.transition = 'width 0.5s ease';
        });
    },

    updateAmortizationSchedule: (calculation) => {
        STATE.amortizationData = calculation.amortization;
        STATE.currentPage = 1;
        STATE.totalPages = Math.ceil(STATE.amortizationData.length / CONFIG.amortizationPageSize);
        
        AmortizationManager.renderTable();
        AmortizationManager.updatePagination();
        AmortizationManager.updatePaymentCount(calculation);
    },

    displayAIInsights: (calculation) => {
        const insights = AIInsights.generateInsights(calculation);
        const container = Utils.$('#ai-insights-content');
        if (!container) return;

        // Show loading state briefly for better UX
        container.innerHTML = `
            <div class="insight-item loading">
                <div class="insight-icon">
                    <div class="loading-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
                <div class="insight-content">
                    <div class="insight-title">AI is analyzing your loan...</div>
                    <div class="insight-text">Generating personalized recommendations based on your mortgage details.</div>
                </div>
            </div>
        `;

        setTimeout(() => {
            container.innerHTML = insights.map((insight, index) => `
                <div class="insight-item ${insight.type}" style="animation-delay: ${index * 0.1}s">
                    <div class="insight-icon">
                        <span class="insight-emoji">${insight.icon}</span>
                    </div>
                    <div class="insight-content">
                        <div class="insight-title">${insight.title}</div>
                        <div class="insight-text">${insight.content}</div>
                        ${insight.action ? `<div class="insight-action">${insight.action}</div>` : ''}
                    </div>
                    <div class="insight-priority priority-${insight.priority}"></div>
                </div>
            `).join('');
        }, 800);
    }
};

// ========== AMORTIZATION SCHEDULE MANAGEMENT ==========
const AmortizationManager = {
    renderTable: () => {
        const table = Utils.$('#amortization-table tbody');
        if (!table || !STATE.amortizationData.length) {
            if (table) {
                table.innerHTML = '<tr><td colspan="6" class="no-data">Calculate mortgage to view schedule</td></tr>';
            }
            return;
        }

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
        return ChartManager.aggregateYearlyData(STATE.amortizationData).map((yearData) => ({
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
        
        STATE.totalPages = Math.ceil(data.length / CONFIG.amortizationPageSize);
        
        Utils.$('#pagination-text').textContent = `Page ${STATE.currentPage} of ${STATE.totalPages}`;
        
        // Update pagination buttons
        const firstBtn = Utils.$('#first-page');
        const prevBtn = Utils.$('#prev-page');
        const nextBtn = Utils.$('#next-page');
        const lastBtn = Utils.$('#last-page');
        const gotoInput = Utils.$('#goto-page');
        
        if (firstBtn) firstBtn.disabled = STATE.currentPage <= 1;
        if (prevBtn) prevBtn.disabled = STATE.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = STATE.currentPage >= STATE.totalPages;
        if (lastBtn) lastBtn.disabled = STATE.currentPage >= STATE.totalPages;
        
        if (gotoInput) {
            gotoInput.max = STATE.totalPages;
            gotoInput.value = STATE.currentPage;
        }
    },

    updatePaymentCount: (calculation) => {
        const paymentCount = calculation.amortization.length;
        Utils.$('#payment-count').textContent = `${paymentCount} payments`;
    },

    goToPage: (page) => {
        const newPage = Math.max(1, Math.min(STATE.totalPages, page));
        if (newPage !== STATE.currentPage) {
            STATE.currentPage = newPage;
            AmortizationManager.renderTable();
            AmortizationManager.updatePagination();
        }
    }
};

// ========== TAB MANAGEMENT ==========
const TabManager = {
    init: () => {
        const tabButtons = Utils.$$('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', TabManager.switchTab);
        });
        
        // Set default tab (Mortgage Over Time should be shown by default)
        TabManager.setActiveTab('chart');
    },

    switchTab: (event) => {
        const clickedTab = event.target.dataset.tab;
        TabManager.setActiveTab(clickedTab);
    },

    setActiveTab: (tabName) => {
        // Update tab buttons
        const tabButtons = Utils.$$('.tab-btn');
        tabButtons.forEach(btn => {
            const isActive = btn.dataset.tab === tabName;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive);
        });

        // Update tab content
        const tabContents = Utils.$$('.tab-content');
        tabContents.forEach(content => {
            const isActive = content.id === `${tabName}-panel`;
            content.classList.toggle('active', isActive);
            content.setAttribute('aria-hidden', !isActive);
        });
        
        // If switching to chart tab and chart exists, update it
        if (tabName === 'chart' && STATE.timelineChart && STATE.currentCalculation) {
            setTimeout(() => {
                STATE.timelineChart.resize();
            }, 100);
        }
        
        if (STATE.isScreenReaderEnabled) {
            const tabName_readable = tabName === 'chart' ? 'Mortgage Over Time' : 'AI Powered Insights';
            ScreenReader.announce(`Switched to ${tabName_readable} tab`);
        }
    }
};

// ========== SHARING FUNCTIONALITY ==========
const SharingManager = {
    init: () => {
        Utils.$('#share-btn')?.addEventListener('click', SharingManager.toggleShareOptions);
        Utils.$('#pdf-btn')?.addEventListener('click', SharingManager.handlePDFDownload);
        Utils.$('#print-btn')?.addEventListener('click', SharingManager.handlePrint);
        Utils.$('#download-schedule')?.addEventListener('click', SharingManager.downloadSchedule);
        
        // Setup individual share options
        Utils.$$('.share-option').forEach(option => {
            option.addEventListener('click', (e) => {
                SharingManager.handlePlatformShare(e.target.dataset.platform);
            });
        });
    },

    toggleShareOptions: () => {
        const options = Utils.$('#share-options');
        const isVisible = options.style.display === 'flex';
        options.style.display = isVisible ? 'none' : 'flex';
    },

    handlePlatformShare: async (platform) => {
        if (!STATE.currentCalculation) {
            Utils.showToast('Please calculate your mortgage first', 'warning');
            return;
        }

        const calc = STATE.currentCalculation;
        const shareText = SharingManager.generateShareText(calc);
        
        switch (platform) {
            case 'email':
                window.location.href = `mailto:?subject=My Mortgage Calculation Results&body=${encodeURIComponent(shareText)}`;
                break;
                
            case 'copy':
                try {
                    await navigator.clipboard.writeText(shareText);
                    Utils.showToast('Results copied to clipboard!', 'success');
                } catch (error) {
                    Utils.showToast('Could not copy to clipboard', 'error');
                }
                break;
                
            case 'linkedin':
                const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
                window.open(linkedinUrl, '_blank');
                break;
                
            case 'twitter':
                const twitterText = `Check out my mortgage calculation: Monthly payment: ${Utils.formatCurrency(calc.monthlyPayment)} for a ${Utils.formatCurrency(calc.homePrice)} home!`;
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(window.location.href)}`;
                window.open(twitterUrl, '_blank');
                break;
        }
        
        SharingManager.toggleShareOptions();
    },

    generateShareText: (calc) => {
        return `My Mortgage Calculation Results:

🏠 Home Price: ${Utils.formatCurrency(calc.homePrice)}
💰 Down Payment: ${Utils.formatCurrency(calc.downPaymentAmount)} (${calc.downPaymentPercent.toFixed(1)}%)
📊 Monthly Payment: ${Utils.formatCurrency(calc.monthlyPayment)}
📅 Loan Term: ${calc.amortization.length} months
💸 Total Interest: ${Utils.formatCurrency(calc.totalInterest)}
📈 Total Cost: ${Utils.formatCurrency(calc.totalCost)}
🎯 Payoff Date: ${Utils.formatDate(calc.payoffDate)}

${calc.interestSavings > 0 ? `💡 Extra Payment Savings: ${Utils.formatCurrency(calc.interestSavings)}` : ''}

Calculate your own mortgage: ${window.location.href}`;
    },

    handlePDFDownload: async () => {
        if (!STATE.currentCalculation) {
            Utils.showToast('Please calculate your mortgage first', 'warning');
            return;
        }

        try {
            Utils.showLoading('Generating comprehensive PDF report...');
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            await SharingManager.generatePDFReport(pdf, STATE.currentCalculation);
            
            pdf.save(`mortgage-analysis-${new Date().getTime()}.pdf`);
            Utils.showToast('PDF report generated successfully!', 'success');
            
        } catch (error) {
            console.error('PDF generation error:', error);
            Utils.showToast('Failed to generate PDF. Please try again.', 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    generatePDFReport: async (pdf, calc) => {
        let yPos = 20;
        const pageWidth = 210;
        const margin = 20;
        const contentWidth = pageWidth - (2 * margin);
        
        // Header
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(20);
        pdf.setTextColor(33, 128, 141);
        pdf.text('Mortgage Analysis Report', margin, yPos);
        
        yPos += 10;
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin, yPos);
        
        yPos += 20;
        
        // Monthly Payment Summary
        pdf.setFontSize(16);
        pdf.setTextColor(0);
        pdf.text('Monthly Payment Summary', margin, yPos);
        yPos += 10;
        
        const paymentData = [
            ['Total Monthly Payment', Utils.formatCurrency(calc.monthlyPayment)],
            ['Principal & Interest', Utils.formatCurrency(calc.principalAndInterest)],
            ['Property Tax', Utils.formatCurrency(calc.monthlyTax)],
            ['Home Insurance', Utils.formatCurrency(calc.monthlyInsurance)],
            ['PMI', Utils.formatCurrency(calc.monthlyPmi)]
        ];
        
        pdf.setFontSize(11);
        paymentData.forEach(([label, value]) => {
            pdf.text(label, margin + 5, yPos);
            pdf.text(value, margin + 100, yPos);
            yPos += 7;
        });
        
        yPos += 10;
        
        // Loan Summary
        pdf.setFontSize(16);
        pdf.text('Loan Summary', margin, yPos);
        yPos += 10;
        
        const loanData = [
            ['Home Price', Utils.formatCurrency(calc.homePrice)],
            ['Down Payment', `${Utils.formatCurrency(calc.downPaymentAmount)} (${calc.downPaymentPercent.toFixed(1)}%)`],
            ['Loan Amount', Utils.formatCurrency(calc.loanAmount)],
            ['Interest Rate', `${parseFloat(Utils.$('#interest-rate').value)}%`],
            ['Loan Term', `${Utils.$('#loan-term').value} years`],
            ['Total Interest Paid', Utils.formatCurrency(calc.totalInterest)],
            ['Total Cost of Loan', Utils.formatCurrency(calc.totalCost)],
            ['Payoff Date', Utils.formatDate(calc.payoffDate)]
        ];
        
        pdf.setFontSize(11);
        loanData.forEach(([label, value]) => {
            pdf.text(label, margin + 5, yPos);
            pdf.text(value, margin + 100, yPos);
            yPos += 7;
        });
        
        // Add new page for AI insights and amortization
        pdf.addPage();
        yPos = 20;
        
        // AI Insights
        pdf.setFontSize(16);
        pdf.text('AI-Powered Insights & Recommendations', margin, yPos);
        yPos += 15;
        
        const insights = AIInsights.generateInsights(calc);
        pdf.setFontSize(10);
        
        insights.slice(0, 5).forEach(insight => { // Limit to top 5 insights
            if (yPos > 250) {
                pdf.addPage();
                yPos = 20;
            }
            
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${insight.icon} ${insight.title}`, margin + 5, yPos);
            yPos += 8;
            
            pdf.setFont('helvetica', 'normal');
            const lines = pdf.splitTextToSize(insight.content, contentWidth - 10);
            lines.forEach(line => {
                pdf.text(line, margin + 5, yPos);
                yPos += 5;
            });
            
            if (insight.action) {
                pdf.setTextColor(33, 128, 141);
                const actionLines = pdf.splitTextToSize(`Action: ${insight.action}`, contentWidth - 10);
                actionLines.forEach(line => {
                    pdf.text(line, margin + 5, yPos);
                    yPos += 5;
                });
                pdf.setTextColor(0);
            }
            
            yPos += 8;
        });
        
        // Add chart if possible (this would require more complex implementation)
        // For now, we'll add a placeholder
        yPos += 10;
        pdf.setFontSize(16);
        pdf.text('Mortgage Over Time Chart', margin, yPos);
        yPos += 10;
        pdf.setFontSize(10);
        pdf.text('Chart data available in the interactive calculator.', margin + 5, yPos);
        
        // Footer
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(100);
            pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 30, 287);
            pdf.text('Generated by AI-Enhanced Mortgage Calculator', margin, 287);
        }
    },

    downloadSchedule: () => {
        if (!STATE.amortizationData.length) {
            Utils.showToast('No amortization schedule to download', 'warning');
            return;
        }
        
        try {
            const csv = SharingManager.generateScheduleCSV();
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `amortization-schedule-${new Date().getTime()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            Utils.showToast('Amortization schedule downloaded!', 'success');
        } catch (error) {
            Utils.showToast('Failed to download schedule', 'error');
        }
    },

    generateScheduleCSV: () => {
        const headers = ['Payment #', 'Date', 'Payment', 'Principal', 'Interest', 'Balance', 'Extra Payment'];
        const rows = STATE.amortizationData.map(payment => [
            payment.paymentNumber,
            Utils.formatDate(payment.date, { year: 'numeric', month: '2-digit', day: '2-digit' }),
            payment.payment.toFixed(2),
            payment.principal.toFixed(2),
            payment.interest.toFixed(2),
            payment.balance.toFixed(2),
            (payment.extraPayment || 0).toFixed(2)
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    },

    handlePrint: () => {
        if (!STATE.currentCalculation) {
            Utils.showToast('Please calculate your mortgage first', 'warning');
            return;
        }
        
        // Add print-specific styles temporarily
        const printStyles = document.createElement('style');
        printStyles.innerHTML = `
            @media print {
                .global-controls, .sponsor-column, .sharing-section { display: none !important; }
                .calculator-grid { grid-template-columns: 1fr 2fr !important; }
                .chart-container { height: 300px !important; }
            }
        `;
        document.head.appendChild(printStyles);
        
        window.print();
        
        // Remove print styles after printing
        setTimeout(() => {
            document.head.removeChild(printStyles);
        }, 1000);
    }
};

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    ThemeManager.init();
    FontManager.init();
    VoiceManager.init();
    ScreenReader.init();
    FormManager.init();
    TabManager.init();
    SharingManager.init();
    
    // Load user preferences
    const savedTheme = Utils.loadFromLocalStorage('theme', 'light');
    const savedFontSize = Utils.loadFromLocalStorage('fontSize', 'normal');
    const savedVoiceEnabled = Utils.loadFromLocalStorage('voiceEnabled', false);
    const savedSREnabled = Utils.loadFromLocalStorage('screenReaderEnabled', false);
    
    STATE.theme = savedTheme;
    STATE.fontSize = savedFontSize;
    STATE.isVoiceEnabled = savedVoiceEnabled;
    STATE.isScreenReaderEnabled = savedSREnabled;
    
    // Apply saved settings
    ThemeManager.applyTheme(savedTheme);
    FontManager.applyFontSize(savedFontSize);
    if (savedVoiceEnabled) VoiceManager.toggleVoice();
    if (savedSREnabled) ScreenReader.toggle();

    // Setup year range slider
    const yearSlider = Utils.$('#year-range');
    const yearDisplay = Utils.$('#year-display');
    
    if (yearSlider && yearDisplay) {
        yearSlider.addEventListener('input', Utils.throttle((e) => {
            const year = e.target.value;
            yearDisplay.textContent = `Year ${year}`;
            STATE.chartYear = parseInt(year);
            
            // Update chart if it exists
            if (STATE.timelineChart && STATE.currentCalculation) {
                ChartManager.renderTimelineChart(STATE.currentCalculation);
            }
        }, CONFIG.chartUpdateDelay));
    }

    // Setup amortization pagination
    Utils.$('#first-page')?.addEventListener('click', () => AmortizationManager.goToPage(1));
    Utils.$('#prev-page')?.addEventListener('click', () => AmortizationManager.goToPage(STATE.currentPage - 1));
    Utils.$('#next-page')?.addEventListener('click', () => AmortizationManager.goToPage(STATE.currentPage + 1));
    Utils.$('#last-page')?.addEventListener('click', () => AmortizationManager.goToPage(STATE.totalPages));
    Utils.$('#goto-page')?.addEventListener('change', (e) => AmortizationManager.goToPage(parseInt(e.target.value)));

    // Setup view toggle for amortization
    Utils.$$('.toggle-btn[data-view]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            Utils.$$('.toggle-btn[data-view]').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-checked', 'false');
            });
            e.target.classList.add('active');
            e.target.setAttribute('aria-checked', 'true');
            
            STATE.currentView = e.target.dataset.view;
            STATE.currentPage = 1;
            AmortizationManager.renderTable();
            AmortizationManager.updatePagination();
        });
    });

    // Update calculation counter (simulated)
    const updateCounter = () => {
        const counter = Utils.$('#calc-count');
        if (counter) {
            const current = parseInt(counter.textContent.replace(/,/g, ''));
            counter.textContent = Utils.formatNumber(current + Math.floor(Math.random() * 3));
        }
    };
    
    setInterval(updateCounter, 30000); // Update every 30 seconds

    // Initialize tooltips
    if (window.tippy) {
        tippy('[data-tippy-content]', {
            delay: [200, 50],
            arrow: true,
            placement: 'auto',
            theme: 'light-border',
            interactive: true,
            appendTo: () => document.body,
            zIndex: 9999,
            maxWidth: 300
        });
    }

    // Welcome message for screen reader users
    if (STATE.isScreenReaderEnabled) {
        setTimeout(() => {
            ScreenReader.announce('Welcome to the AI-Enhanced Mortgage Calculator. Fill out the form on the left to get started with your mortgage calculation.');
        }, 2000);
    }

    console.log('🏠 AI-Enhanced Mortgage Calculator fully initialized!');
    console.log('Features loaded:', {
        theme: STATE.theme,
        voice: STATE.isVoiceEnabled,
        screenReader: STATE.isScreenReaderEnabled,
        calculations: STATE.savedCalculations.length
    });
});
