/**
 * mortgage-calculator-complete.js
 * Enhanced Mortgage Calculator with all original functionality + new features
 * Includes: calculations, charts, tabs, sharing, extra payments, feedback API
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
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
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
                <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;

        container.appendChild(toast);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 4000);
    },

    // Show loading overlay
    showLoading: () => {
        const overlay = Utils.$('#loading-overlay');
        if (overlay) overlay.style.display = 'flex';
    },

    // Hide loading overlay
    hideLoading: () => {
        const overlay = Utils.$('#loading-overlay');
        if (overlay) overlay.style.display = 'none';
    }
};

// ========== MORTGAGE CALCULATION ENGINE ==========
const MortgageCalculator = {
    // Calculate monthly mortgage payment (P&I only)
    calculateMonthlyPayment: (principal, annualRate, years) => {
        const monthlyRate = annualRate / 100 / 12;
        const numPayments = years * 12;
        
        if (monthlyRate === 0) {
            return principal / numPayments;
        }
        
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
               (Math.pow(1 + monthlyRate, numPayments) - 1);
    },

    // Calculate complete mortgage details including extra payments
    calculateMortgage: (params) => {
        const {
            homePrice,
            downPayment,
            interestRate,
            loanTerm,
            propertyTax,
            homeInsurance,
            pmi,
            hoaFees,
            extraMonthly = 0,
            extraYearly = 0,
            startExtraPayment,
            loanStartDate
        } = params;

        const principal = homePrice - downPayment;
        const monthlyPayment = MortgageCalculator.calculateMonthlyPayment(principal, interestRate, loanTerm);
        
        // Monthly breakdown
        const monthlyTax = propertyTax / 12;
        const monthlyInsurance = homeInsurance / 12;
        const monthlyPmi = pmi;
        const monthlyHoa = hoaFees || 0;
        
        const totalMonthly = monthlyPayment + monthlyTax + monthlyInsurance + monthlyPmi + monthlyHoa;

        // Generate amortization schedule with extra payments
        const amortization = MortgageCalculator.generateAmortizationSchedule({
            principal,
            monthlyPayment,
            interestRate,
            extraMonthly,
            extraYearly,
            startExtraPayment,
            loanStartDate
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
            monthlyHoa,
            totalInterest,
            totalCost,
            payoffDate,
            amortization,
            downPaymentAmount: downPayment,
            homePrice
        };
    },

    // Generate detailed amortization schedule
    generateAmortizationSchedule: (params) => {
        const {
            principal,
            monthlyPayment,
            interestRate,
            extraMonthly = 0,
            extraYearly = 0,
            startExtraPayment,
            loanStartDate
        } = params;

        const monthlyRate = interestRate / 100 / 12;
        const schedule = [];
        let balance = principal;
        let paymentNumber = 1;
        
        // Parse start date or use current date
        const startDate = loanStartDate ? new Date(loanStartDate + '-01') : new Date();
        const extraStartDate = startExtraPayment ? new Date(startExtraPayment + '-01') : null;

        while (balance > 0.01) {
            const currentDate = new Date(startDate);
            currentDate.setMonth(currentDate.getMonth() + paymentNumber - 1);

            const interestPayment = balance * monthlyRate;
            let principalPayment = monthlyPayment - interestPayment;
            
            // Apply extra monthly payment if applicable
            let extraPayment = 0;
            if (extraStartDate && currentDate >= extraStartDate) {
                extraPayment = extraMonthly;
                
                // Add yearly extra payment in January
                if (extraYearly > 0 && currentDate.getMonth() === 0) {
                    extraPayment += extraYearly;
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
                payment: monthlyPayment + extraPayment,
                principal: principalPayment,
                interest: interestPayment,
                balance: Math.max(0, balance),
                extraPayment
            });

            paymentNumber++;

            // Safety break to prevent infinite loops
            if (paymentNumber > 600) break; // Max 50 years
        }

        return schedule;
    }
};

// ========== CHART RENDERING ==========
const ChartManager = {
    // Render mortgage over time chart
    renderTimelineChart: (calculation) => {
        const ctx = Utils.$('#mortgage-timeline-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (STATE.timelineChart) {
            STATE.timelineChart.destroy();
        }

        const { amortization } = calculation;
        const yearlyData = ChartManager.aggregateYearlyData(amortization);

        const config = {
            type: 'line',
            data: {
                labels: yearlyData.map(item => item.year),
                datasets: [
                    {
                        label: 'Remaining Balance',
                        data: yearlyData.map(item => item.balance),
                        borderColor: CONFIG.colors.primary,
                        backgroundColor: CONFIG.colors.primary + '20',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Principal Paid',
                        data: yearlyData.map(item => item.principalPaid),
                        borderColor: CONFIG.colors.success,
                        backgroundColor: CONFIG.colors.success + '20',
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Interest Paid',
                        data: yearlyData.map(item => item.interestPaid),
                        borderColor: CONFIG.colors.warning,
                        backgroundColor: CONFIG.colors.warning + '20',
                        fill: false,
                        tension: 0.4
                    }
                ]
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
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + Utils.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                }
            }
        };

        STATE.timelineChart = new Chart(ctx, config);
    },

    // Aggregate monthly data into yearly data
    aggregateYearlyData: (amortization) => {
        const yearlyData = [];
        let currentYear = null;
        let yearData = {
            year: null,
            balance: 0,
            principalPaid: 0,
            interestPaid: 0
        };

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
                    principalPaid: 0,
                    interestPaid: 0
                };
            }
            
            yearData.balance = payment.balance;
            yearData.principalPaid += payment.principal;
            yearData.interestPaid += payment.interest;
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
            amortization 
        } = calculation;

        // Down payment analysis
        const downPaymentPercent = (downPaymentAmount / homePrice) * 100;
        if (downPaymentPercent < 20) {
            insights.push({
                type: 'warning',
                icon: '⚠️',
                title: 'Consider Increasing Down Payment',
                content: `Your down payment is ${downPaymentPercent.toFixed(1)}%. Increasing to 20% could eliminate PMI and save money long-term.`
            });
        } else {
            insights.push({
                type: 'success',
                icon: '✅',
                title: 'Great Down Payment',
                content: `Your ${downPaymentPercent.toFixed(1)}% down payment helps you avoid PMI and reduces your monthly payment.`
            });
        }

        // Interest vs principal analysis
        const interestRatio = (totalInterest / loanAmount) * 100;
        if (interestRatio > 80) {
            insights.push({
                type: 'info',
                icon: '📊',
                title: 'High Interest Cost',
                content: `You'll pay ${interestRatio.toFixed(0)}% of your loan amount in interest. Consider extra payments to reduce this.`
            });
        }

        // Payment-to-income ratio (assuming 28% rule)
        const recommendedMonthlyIncome = monthlyPayment / 0.28;
        insights.push({
            type: 'info',
            icon: '💰',
            title: 'Recommended Income',
            content: `For comfortable affordability, your gross monthly income should be at least ${Utils.formatCurrency(recommendedMonthlyIncome)}.`
        });

        // Extra payment impact
        if (amortization.some(p => p.extraPayment > 0)) {
            const withoutExtraTotal = loanAmount + (loanAmount * 0.8); // Rough estimate
            const savings = withoutExtraTotal - (loanAmount + totalInterest);
            insights.push({
                type: 'success',
                icon: '🎯',
                title: 'Extra Payment Benefits',
                content: `Your extra payments could save approximately ${Utils.formatCurrency(savings)} in interest over the loan term.`
            });
        }

        return insights;
    }
};

// ========== FORM MANAGEMENT ==========
const FormManager = {
    // Initialize form handlers
    init: () => {
        FormManager.setupEventListeners();
        FormManager.populateStateDropdown();
        FormManager.setDefaultDates();
        FormManager.handleInitialCalculation();
    },

    // Setup all event listeners
    setupEventListeners: () => {
        const form = Utils.$('#mortgage-form');
        if (!form) return;

        // Main form inputs
        const inputs = Utils.$$('#mortgage-form input, #mortgage-form select');
        inputs.forEach(input => {
            input.addEventListener('input', Utils.debounce(FormManager.handleInputChange, CONFIG.debounceDelay));
            input.addEventListener('change', FormManager.handleInputChange);
        });

        // Down payment sync between dollar and percentage
        const downPaymentInput = Utils.$('#down-payment');
        const downPaymentPercentInput = Utils.$('#down-payment-percent');
        const homePriceInput = Utils.$('#home-price');

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

        // PMI auto-calculation based on down payment
        const pmiInput = Utils.$('#pmi');
        if (pmiInput) {
            Utils.$('#down-payment').addEventListener('input', () => {
                const homePrice = parseFloat(Utils.$('#home-price').value) || 0;
                const downPayment = parseFloat(Utils.$('#down-payment').value) || 0;
                const downPaymentPercent = homePrice > 0 ? (downPayment / homePrice) * 100 : 0;
                
                if (downPaymentPercent < 20) {
                    const loanAmount = homePrice - downPayment;
                    const estimatedPMI = Math.round((loanAmount * 0.005) / 12); // 0.5% annually
                    pmiInput.value = estimatedPMI;
                } else {
                    pmiInput.value = 0;
                }
                FormManager.handleInputChange();
            });
        }
    },

    // Handle input changes and trigger calculation
    handleInputChange: () => {
        const formData = FormManager.getFormData();
        if (FormManager.validateForm(formData)) {
            const calculation = MortgageCalculator.calculateMortgage(formData);
            STATE.currentCalculation = calculation;
            ResultsManager.displayResults(calculation);
        }
    },

    // Get form data
    getFormData: () => {
        return {
            homePrice: parseFloat(Utils.$('#home-price').value) || 0,
            downPayment: parseFloat(Utils.$('#down-payment').value) || 0,
            interestRate: parseFloat(Utils.$('#interest-rate').value) || 0,
            loanTerm: parseInt(Utils.$('#loan-term').value) || 30,
            propertyTax: parseFloat(Utils.$('#property-tax').value) || 0,
            homeInsurance: parseFloat(Utils.$('#home-insurance').value) || 0,
            pmi: parseFloat(Utils.$('#pmi').value) || 0,
            hoaFees: parseFloat(Utils.$('#hoa-fees').value) || 0,
            extraMonthly: parseFloat(Utils.$('#extra-monthly').value) || 0,
            extraYearly: parseFloat(Utils.$('#extra-yearly').value) || 0,
            startExtraPayment: Utils.$('#start-extra-payment').value || null,
            loanStartDate: Utils.$('#loan-start-date').value || null
        };
    },

    // Validate form data
    validateForm: (data) => {
        return data.homePrice > 0 && data.interestRate > 0 && data.loanTerm > 0;
    },

    // Populate state dropdown
    populateStateDropdown: () => {
        const stateSelect = Utils.$('#property-state');
        if (!stateSelect) return;

        Object.entries(STATE_TAX_RATES).forEach(([code, state]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = state.name;
            stateSelect.appendChild(option);
        });

        // Set default to California
        stateSelect.value = 'CA';
    },

    // Set default dates
    setDefaultDates: () => {
        const today = new Date();
        const currentMonth = today.toISOString().slice(0, 7);
        
        const loanStartInput = Utils.$('#loan-start-date');
        if (loanStartInput) {
            loanStartInput.value = currentMonth;
        }
    },

    // Handle initial calculation on page load
    handleInitialCalculation: () => {
        // Trigger initial calculation with default values
        setTimeout(() => {
            FormManager.handleInputChange();
        }, 100);
    }
};

// ========== RESULTS MANAGEMENT ==========
const ResultsManager = {
    // Display calculation results
    displayResults: (calculation) => {
        ResultsManager.displayPaymentSummary(calculation);
        ResultsManager.displayLoanSummary(calculation);
        ResultsManager.updateAmortizationSchedule(calculation);
        ChartManager.renderTimelineChart(calculation);
        ResultsManager.displayAIInsights(calculation);
    },

    // Display payment summary
    displayPaymentSummary: (calculation) => {
        const {
            monthlyPayment,
            principalAndInterest,
            monthlyTax,
            monthlyInsurance,
            monthlyPmi,
            monthlyHoa
        } = calculation;

        Utils.$('#total-payment').textContent = Utils.formatCurrency(monthlyPayment);
        Utils.$('#principal-interest').textContent = Utils.formatCurrency(principalAndInterest);
        Utils.$('#monthly-tax').textContent = Utils.formatCurrency(monthlyTax);
        Utils.$('#monthly-insurance').textContent = Utils.formatCurrency(monthlyInsurance);
        Utils.$('#monthly-pmi').textContent = Utils.formatCurrency(monthlyPmi);
        Utils.$('#monthly-hoa').textContent = Utils.formatCurrency(monthlyHoa);
    },

    // Display loan summary (newly requested fields)
    displayLoanSummary: (calculation) => {
        const { loanAmount, totalInterest, totalCost, payoffDate } = calculation;

        Utils.$('#display-loan-amount').textContent = Utils.formatCurrency(loanAmount);
        Utils.$('#display-total-interest').textContent = Utils.formatCurrency(totalInterest);
        Utils.$('#display-total-cost').textContent = Utils.formatCurrency(totalCost);
        Utils.$('#display-payoff-date').textContent = payoffDate ? 
            payoffDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '--';
    },

    // Update amortization schedule
    updateAmortizationSchedule: (calculation) => {
        STATE.amortizationData = calculation.amortization;
        STATE.currentPage = 1;
        AmortizationManager.renderTable();
        AmortizationManager.updatePagination();
    },

    // Display AI insights
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
    // Render amortization table
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

    // Get yearly aggregated data
    getYearlyData: () => {
        return ChartManager.aggregateYearlyData(STATE.amortizationData).map((yearData, index) => ({
            year: yearData.year,
            date: new Date(yearData.year, 0, 1),
            payment: yearData.principalPaid + yearData.interestPaid,
            principal: yearData.principalPaid,
            interest: yearData.interestPaid,
            balance: yearData.balance
        }));
    },

    // Update pagination controls
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

        // Set default tab (Mortgage Over Time should be shown by default as requested)
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
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        const tabContents = Utils.$$('.tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
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

    // Handle native sharing
    handleShare: async () => {
        if (!STATE.currentCalculation) {
            Utils.showToast('Please calculate your mortgage first', 'warning');
            return;
        }

        const shareData = {
            title: 'My Mortgage Calculation Results',
            text: `Monthly Payment: ${Utils.formatCurrency(STATE.currentCalculation.monthlyPayment)}\nLoan Amount: ${Utils.formatCurrency(STATE.currentCalculation.loanAmount)}`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                Utils.showToast('Results copied to clipboard!', 'success');
            }
        } catch (error) {
            Utils.showToast('Sharing failed. Please try again.', 'error');
        }
    },

    // Handle PDF download
    handlePDFDownload: async () => {
        if (!STATE.currentCalculation) {
            Utils.showToast('Please calculate your mortgage first', 'warning');
            return;
        }

        try {
            Utils.showLoading();
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            
            // Add content to PDF
            pdf.setFontSize(20);
            pdf.text('Mortgage Calculation Results', 20, 30);
            
            pdf.setFontSize(12);
            const calc = STATE.currentCalculation;
            
            let yPos = 50;
            const addLine = (text) => {
                pdf.text(text, 20, yPos);
                yPos += 10;
            };
            
            addLine(`Monthly Payment: ${Utils.formatCurrency(calc.monthlyPayment)}`);
            addLine(`Loan Amount: ${Utils.formatCurrency(calc.loanAmount)}`);
            addLine(`Total Interest: ${Utils.formatCurrency(calc.totalInterest)}`);
            addLine(`Total Cost: ${Utils.formatCurrency(calc.totalCost)}`);
            addLine(`Payoff Date: ${calc.payoffDate ? calc.payoffDate.toLocaleDateString() : 'N/A'}`);
            
            // Add breakdown
            yPos += 10;
            addLine('Monthly Breakdown:');
            addLine(`  Principal & Interest: ${Utils.formatCurrency(calc.principalAndInterest)}`);
            addLine(`  Property Tax: ${Utils.formatCurrency(calc.monthlyTax)}`);
            addLine(`  Insurance: ${Utils.formatCurrency(calc.monthlyInsurance)}`);
            addLine(`  PMI: ${Utils.formatCurrency(calc.monthlyPmi)}`);
            addLine(`  HOA: ${Utils.formatCurrency(calc.monthlyHoa)}`);
            
            pdf.save('mortgage-calculation.pdf');
            Utils.showToast('PDF downloaded successfully!', 'success');
            
        } catch (error) {
            Utils.showToast('PDF generation failed. Please try again.', 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    // Handle print
    handlePrint: () => {
        if (!STATE.currentCalculation) {
            Utils.showToast('Please calculate your mortgage first', 'warning');
            return;
        }
        
        window.print();
    }
};

// ========== FEEDBACK SYSTEM ==========
const FeedbackManager = {
    init: () => {
        const feedbackForm = Utils.$('#feedback-form');
        if (feedbackForm) {
            feedbackForm.addEventListener('submit', FeedbackManager.handleSubmit);
        }
    },

    handleSubmit: async (event) => {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const feedback = {
            type: formData.get('type'),
            message: formData.get('message'),
            email: formData.get('email') || 'anonymous'
        };

        try {
            // GitHub Issues API integration
            const response = await fetch('https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/issues', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'token YOUR_GITHUB_TOKEN' // Replace with your token
                },
                body: JSON.stringify({
                    title: `[Feedback] ${feedback.type}`,
                    body: `**Type:** ${feedback.type}\n**Email:** ${feedback.email}\n\n**Message:**\n${feedback.message}`,
                    labels: ['feedback', feedback.type]
                })
            });

            if (response.ok) {
                Utils.showToast('Feedback submitted successfully!', 'success');
                event.target.reset();
            } else {
                throw new Error('Failed to submit feedback');
            }
        } catch (error) {
            Utils.showToast('Failed to submit feedback. Please try again later.', 'error');
        }
    }
};

// ========== VOICE COMMANDS ==========
const VoiceManager = {
    init: () => {
        const voiceBtn = Utils.$('#voice-btn');
        if (voiceBtn && 'webkitSpeechRecognition' in window) {
            voiceBtn.addEventListener('click', VoiceManager.toggleListening);
            VoiceManager.setupSpeechRecognition();
        } else if (voiceBtn) {
            voiceBtn.style.display = 'none'; // Hide if not supported
        }
    },

    setupSpeechRecognition: () => {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            VoiceManager.processVoiceCommand(transcript);
        };

        recognition.onerror = () => {
            Utils.showToast('Voice recognition error. Please try again.', 'error');
            VoiceManager.stopListening();
        };

        recognition.onend = () => {
            VoiceManager.stopListening();
        };

        STATE.speechRecognition = recognition;
    },

    toggleListening: () => {
        if (STATE.isListening) {
            VoiceManager.stopListening();
        } else {
            VoiceManager.startListening();
        }
    },

    startListening: () => {
        if (STATE.speechRecognition) {
            STATE.isListening = true;
            STATE.speechRecognition.start();
            
            const voiceBtn = Utils.$('#voice-btn');
            voiceBtn.classList.add('listening');
            voiceBtn.innerHTML = '<span class="voice-icon">🎙️</span> Listening...';
            
            Utils.showToast('Listening... Speak your mortgage details', 'info');
        }
    },

    stopListening: () => {
        STATE.isListening = false;
        
        const voiceBtn = Utils.$('#voice-btn');
        voiceBtn.classList.remove('listening');
        voiceBtn.innerHTML = '<span class="voice-icon">🎤</span> Voice Input';
    },

    processVoiceCommand: (transcript) => {
        const text = transcript.toLowerCase();
        
        // Extract numbers and keywords
        const homePrice = VoiceManager.extractNumber(text, ['home price', 'house price', 'price']);
        const downPayment = VoiceManager.extractNumber(text, ['down payment', 'down']);
        const interestRate = VoiceManager.extractNumber(text, ['interest rate', 'rate', 'percent']);
        
        // Update form fields
        if (homePrice) Utils.$('#home-price').value = homePrice;
        if (downPayment) Utils.$('#down-payment').value = downPayment;
        if (interestRate) Utils.$('#interest-rate').value = interestRate;
        
        // Trigger calculation
        FormManager.handleInputChange();
        
        Utils.showToast('Voice input processed!', 'success');
    },

    extractNumber: (text, keywords) => {
        for (const keyword of keywords) {
            const regex = new RegExp(`${keyword}[\\s:]*([\\d,]+)`, 'i');
            const match = text.match(regex);
            if (match) {
                return parseInt(match[1].replace(/,/g, ''));
            }
        }
        return null;
    }
};

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    FormManager.init();
    TabManager.init();
    SharingManager.init();
    FeedbackManager.init();
    VoiceManager.init();

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
    Utils.$$('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            Utils.$$('.toggle-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            STATE.currentView = e.target.dataset.view;
            STATE.currentPage = 1;
            AmortizationManager.renderTable();
            AmortizationManager.updatePagination();
        });
    });

    // Setup year range slider for chart
    const yearSlider = Utils.$('#year-range');
    const yearDisplay = Utils.$('#year-display');
    
    if (yearSlider && yearDisplay) {
        yearSlider.addEventListener('input', (e) => {
            const year = e.target.value;
            yearDisplay.textContent = `Year ${year}`;
            
            // Update chart to show data up to selected year
            if (STATE.timelineChart && STATE.currentCalculation) {
                const yearlyData = ChartManager.aggregateYearlyData(STATE.currentCalculation.amortization);
                const filteredData = yearlyData.slice(0, parseInt(year));
                
                STATE.timelineChart.data.labels = filteredData.map(item => item.year);
                STATE.timelineChart.data.datasets.forEach((dataset, index) => {
                    switch (index) {
                        case 0: // Remaining Balance
                            dataset.data = filteredData.map(item => item.balance);
                            break;
                        case 1: // Principal Paid
                            dataset.data = filteredData.map(item => item.principalPaid);
                            break;
                        case 2: // Interest Paid
                            dataset.data = filteredData.map(item => item.interestPaid);
                            break;
                    }
                });
                STATE.timelineChart.update();
            }
        });
    }

    console.log('🏠 AI-Enhanced Mortgage Calculator initialized successfully!');
});
