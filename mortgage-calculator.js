/**
 * mortgage-calculator.js
 * FinGuid AI-Enhanced Mortgage Calculator v9.1
 * Production Ready with Fixed Chart Display
 * 
 * Features:
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
            monthsSaved: monthsSaved,
            yearsSaved: yearsSaved,
            monthsRemaining: monthsRemaining,
            payoffDate: payoffDate,
            newLoanTerm: Math.ceil(paymentCount / 12)
        };
    },

    // Generate amortization schedule
    generateAmortizationSchedule: (loanAmount, interestRate, loanTerm, extraPayment = 0) => {
        const monthlyRate = interestRate / 100 / 12;
        const totalPayments = loanTerm * 12;
        const principalInterest = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
            (Math.pow(1 + monthlyRate, totalPayments) - 1);

        let balance = loanAmount;
        const schedule = [];
        const startDate = new Date();
        let paymentNumber = 1;

        while (balance > 0.01 && paymentNumber <= totalPayments * 2) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = Math.min(
                principalInterest + extraPayment - interestPayment, 
                balance
            );
            const totalPayment = principalPayment + interestPayment;

            balance -= principalPayment;

            const paymentDate = new Date(startDate);
            paymentDate.setMonth(startDate.getMonth() + paymentNumber - 1);

            schedule.push({
                paymentNumber: paymentNumber,
                date: paymentDate,
                payment: Math.round(totalPayment * 100) / 100,
                principal: Math.round(principalPayment * 100) / 100,
                interest: Math.round(interestPayment * 100) / 100,
                balance: Math.round(Math.max(0, balance) * 100) / 100
            });

            paymentNumber++;

            if (balance <= 0) break;
        }

        return schedule;
    },

    // Generate timeline data for chart
    generateTimelineData: (loanAmount, interestRate, loanTerm, extraPayment = 0) => {
        const schedule = MortgageCalculator.generateAmortizationSchedule(
            loanAmount, interestRate, loanTerm, extraPayment
        );

        const timelineData = [];
        let cumulativePrincipal = 0;
        let cumulativeInterest = 0;

        for (let year = 1; year <= loanTerm; year++) {
            const yearEndIndex = Math.min(year * 12 - 1, schedule.length - 1);
            if (yearEndIndex >= 0 && schedule[yearEndIndex]) {
                const yearlyPrincipal = schedule.slice((year - 1) * 12, year * 12)
                    .reduce((sum, payment) => sum + payment.principal, 0);
                const yearlyInterest = schedule.slice((year - 1) * 12, year * 12)
                    .reduce((sum, payment) => sum + payment.interest, 0);

                cumulativePrincipal += yearlyPrincipal;
                cumulativeInterest += yearlyInterest;

                timelineData.push({
                    year: year,
                    remainingBalance: schedule[yearEndIndex].balance,
                    principalPaid: Math.round(cumulativePrincipal * 100) / 100,
                    interestPaid: Math.round(cumulativeInterest * 100) / 100,
                    yearlyPrincipal: Math.round(yearlyPrincipal * 100) / 100,
                    yearlyInterest: Math.round(yearlyInterest * 100) / 100
                });
            }

            // Break if loan is paid off
            if (yearEndIndex < schedule.length - 1 && schedule[yearEndIndex].balance <= 0) {
                break;
            }
        }

        return timelineData;
    }
};

// ========== CHART MANAGEMENT ==========
const ChartManager = {
    // Initialize chart with proper error handling
    initializeChart: () => {
        console.log('🎯 Initializing timeline chart...');
        
        const canvas = Utils.$('#timeline-chart');
        if (!canvas) {
            console.error('❌ Timeline chart canvas not found');
            return false;
        }

        // Wait for Chart.js to be available
        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js not loaded');
            Utils.showToast('Chart library not loaded. Please refresh the page.', 'error');
            return false;
        }

        try {
            // Destroy existing chart if it exists
            if (STATE.timelineChart) {
                STATE.timelineChart.destroy();
                STATE.timelineChart = null;
            }

            const ctx = canvas.getContext('2d');
            
            // Set canvas size explicitly
            canvas.style.width = '100%';
            canvas.style.height = '400px';
            
            STATE.timelineChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Remaining Balance',
                            data: [],
                            borderColor: CONFIG.colors.remaining,
                            backgroundColor: CONFIG.colors.remaining + '20',
                            borderWidth: 3,
                            tension: 0.1,
                            fill: false,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'Principal Paid',
                            data: [],
                            borderColor: CONFIG.colors.principal,
                            backgroundColor: CONFIG.colors.principal + '20',
                            borderWidth: 3,
                            tension: 0.1,
                            fill: false,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'Interest Paid',
                            data: [],
                            borderColor: CONFIG.colors.interest,
                            backgroundColor: CONFIG.colors.interest + '20',
                            borderWidth: 3,
                            tension: 0.1,
                            fill: false,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }
                    ]
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
                                text: 'Years',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            },
                            grid: {
                                display: true,
                                color: 'rgba(0,0,0,0.1)'
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
                            grid: {
                                display: true,
                                color: 'rgba(0,0,0,0.1)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            }
                        }
                    },
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
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            borderColor: CONFIG.colors.primary,
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + Utils.formatCurrency(context.parsed.y);
                                }
                            }
                        }
                    },
                    onHover: (event, activeElements) => {
                        if (activeElements.length > 0) {
                            const dataIndex = activeElements[0].index;
                            const year = dataIndex + 1;
                            UI.updateYearSlider(year);
                        }
                    },
                    onClick: (event, activeElements) => {
                        if (activeElements.length > 0) {
                            const dataIndex = activeElements[0].index;
                            const year = dataIndex + 1;
                            UI.updateYearSlider(year);
                        }
                    }
                }
            });

            STATE.chartInitialized = true;
            console.log('✅ Timeline chart initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Error initializing chart:', error);
            Utils.showToast('Failed to initialize chart. Please refresh the page.', 'error');
            return false;
        }
    },

    // Update chart with new data
    updateChart: (timelineData) => {
        if (!STATE.timelineChart || !timelineData || timelineData.length === 0) {
            console.log('⚠️ Chart or data not available for update');
            return false;
        }

        try {
            const labels = timelineData.map(d => `Year ${d.year}`);
            const remainingBalance = timelineData.map(d => d.remainingBalance);
            const principalPaid = timelineData.map(d => d.principalPaid);
            const interestPaid = timelineData.map(d => d.interestPaid);

            STATE.timelineChart.data.labels = labels;
            STATE.timelineChart.data.datasets[0].data = remainingBalance;
            STATE.timelineChart.data.datasets[1].data = principalPaid;
            STATE.timelineChart.data.datasets[2].data = interestPaid;

            STATE.timelineChart.update('none');
            console.log('✅ Chart updated successfully with', timelineData.length, 'data points');
            return true;

        } catch (error) {
            console.error('❌ Error updating chart:', error);
            return false;
        }
    }
};

// ========== UI MANAGEMENT ==========
const UI = {
    // Initialize all UI components
    init: () => {
        console.log('🚀 Initializing Mortgage Calculator UI...');
        UI.populateStates();
        UI.bindEvents();
        UI.setupCollapsibleSections();
        UI.setupFormValidation();
        UI.loadSavedData();
        
        // Initialize chart after a short delay to ensure DOM is ready
        setTimeout(() => {
            ChartManager.initializeChart();
        }, 100);
    },

    // Populate state dropdown
    populateStates: () => {
        const stateSelect = Utils.$('#property-state');
        if (!stateSelect) return;

        // Clear existing options except the first one
        stateSelect.innerHTML = '<option value="">Select State</option>';

        Object.entries(STATE_TAX_RATES).forEach(([code, data]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = data.name;
            stateSelect.appendChild(option);
        });

        // Set default to California
        stateSelect.value = 'CA';
        UI.updatePropertyTax();
    },

    // Bind all event listeners
    bindEvents: () => {
        const form = Utils.$('#mortgage-form');
        if (form) {
            form.addEventListener('submit', UI.handleFormSubmit);

            // Real-time calculation on input change
            const inputs = form.querySelectorAll('input, select');
            inputs.forEach(input => {
                const debouncedCalculate = Utils.debounce(UI.handleInputChange, CONFIG.debounceDelay);
                input.addEventListener('input', debouncedCalculate);
                input.addEventListener('change', debouncedCalculate);
            });

            // Special handling for numeric inputs with formatting
            ['home-price', 'down-payment', 'property-tax', 'home-insurance', 'pmi', 'hoa-fees', 'extra-payment'].forEach(id => {
                const input = Utils.$(`#${id}`);
                if (input) {
                    input.addEventListener('input', UI.formatCurrencyInput);
                    input.addEventListener('blur', UI.validateCurrencyInput);
                }
            });

            // State change handler
            const stateSelect = Utils.$('#property-state');
            if (stateSelect) {
                stateSelect.addEventListener('change', UI.updatePropertyTax);
            }
        }

        // Chart year slider
        const yearSlider = Utils.$('#year-slider');
        if (yearSlider) {
            yearSlider.addEventListener('input', UI.updateTimelineDisplay);
        }

        // Amortization view toggle
        const viewToggle = Utils.$$('.toggle-btn');
        viewToggle.forEach(btn => {
            btn.addEventListener('click', UI.handleViewToggle);
        });

        // Pagination
        const prevBtn = Utils.$('#prev-page');
        const nextBtn = Utils.$('#next-page');
        if (prevBtn) prevBtn.addEventListener('click', () => UI.changePage(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => UI.changePage(1));

        // Share functionality
        UI.bindShareEvents();

        // Global controls
        UI.bindGlobalControls();

        // Theme toggle
        const themeToggle = Utils.$('#theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', UI.toggleTheme);
        }
    },

    // Setup collapsible sections
    setupCollapsibleSections: () => {
        const collapsibleHeaders = Utils.$$('.collapsible-header');
        collapsibleHeaders.forEach(header => {
            header.addEventListener('click', UI.toggleCollapsible);
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    UI.toggleCollapsible.call(header, e);
                }
            });
        });
    },

    // Toggle collapsible sections
    toggleCollapsible: function(e) {
        const header = this;
        const content = header.nextElementSibling;
        const icon = header.querySelector('.collapse-icon');
        const isExpanded = header.getAttribute('aria-expanded') === 'true';

        header.setAttribute('aria-expanded', !isExpanded);
        
        if (isExpanded) {
            content.style.display = 'none';
            icon.textContent = '▼';
            header.classList.remove('expanded');
        } else {
            content.style.display = 'block';
            icon.textContent = '▲';
            header.classList.add('expanded');
        }
    },

    // Handle form submission
    handleFormSubmit: (e) => {
        e.preventDefault();
        UI.calculateMortgage();
    },

    // Handle input changes
    handleInputChange: (e) => {
        const input = e.target;
        
        // Auto-calculate loan amount
        if (input.id === 'home-price' || input.id === 'down-payment') {
            UI.updateLoanAmount();
        }

        // Auto-calculate down payment percentage
        if (input.id === 'home-price' || input.id === 'down-payment') {
            UI.updateDownPaymentPercentage();
        }

        // Auto-calculate mortgage if form is valid
        if (UI.isFormValid()) {
            UI.calculateMortgage();
        }
    },

    // Format currency input
    formatCurrencyInput: (e) => {
        const input = e.target;
        let value = input.value.replace(/[^\d]/g, '');
        
        if (value) {
            value = Utils.formatNumberInput(value);
            input.value = value;
        }
    },

    // Validate currency input
    validateCurrencyInput: (e) => {
        const input = e.target;
        const value = Utils.parseCurrency(input.value);
        
        if (value === 0 && input.value !== '' && input.value !== '0') {
            input.classList.add('error');
            Utils.showToast('Please enter a valid number', 'error');
        } else {
            input.classList.remove('error');
        }
    },

    // Update loan amount automatically
    updateLoanAmount: () => {
        const homePrice = Utils.parseCurrency(Utils.$('#home-price')?.value);
        const downPayment = Utils.parseCurrency(Utils.$('#down-payment')?.value);
        const loanAmount = Math.max(0, homePrice - downPayment);
        
        const loanAmountInput = Utils.$('#loan-amount');
        if (loanAmountInput) {
            loanAmountInput.value = Utils.formatNumberInput(loanAmount.toString());
        }
    },

    // Update down payment percentage
    updateDownPaymentPercentage: () => {
        const homePrice = Utils.parseCurrency(Utils.$('#home-price')?.value);
        const downPayment = Utils.parseCurrency(Utils.$('#down-payment')?.value);
        
        const percentage = homePrice > 0 ? (downPayment / homePrice) * 100 : 0;
        const percentageDisplay = Utils.$('#down-payment-percent');
        
        if (percentageDisplay) {
            percentageDisplay.textContent = `${Math.round(percentage * 10) / 10}%`;
            
            // Add warning if less than 20%
            const container = percentageDisplay.closest('.down-payment-percentage');
            if (percentage < 20) {
                container.classList.add('warning');
                container.title = 'Down payment less than 20% may require PMI';
            } else {
                container.classList.remove('warning');
                container.title = '';
            }
        }
    },

    // Update property tax based on selected state
    updatePropertyTax: () => {
        const stateCode = Utils.$('#property-state')?.value;
        const homePrice = Utils.parseCurrency(Utils.$('#home-price')?.value);
        
        if (stateCode && STATE_TAX_RATES[stateCode] && homePrice > 0) {
            const taxRate = STATE_TAX_RATES[stateCode].rate;
            const annualTax = homePrice * taxRate;
            
            const propertyTaxInput = Utils.$('#property-tax');
            if (propertyTaxInput) {
                propertyTaxInput.value = Utils.formatNumberInput(Math.round(annualTax).toString());
            }

            // Auto-calculate if form is valid
            if (UI.isFormValid()) {
                UI.calculateMortgage();
            }
        }
    },

    // Check if form is valid
    isFormValid: () => {
        const requiredFields = ['home-price', 'down-payment', 'interest-rate', 'loan-term'];
        return requiredFields.every(id => {
            const input = Utils.$(`#${id}`);
            return input && input.value && Utils.parseCurrency(input.value) > 0;
        });
    },

    // Main calculation function
    calculateMortgage: async () => {
        if (STATE.isCalculating) return;
        
        STATE.isCalculating = true;
        Utils.showLoading(true);

        try {
            // Get input values
            const inputs = {
                homePrice: Utils.parseCurrency(Utils.$('#home-price')?.value),
                downPayment: Utils.parseCurrency(Utils.$('#down-payment')?.value),
                loanAmount: Utils.parseCurrency(Utils.$('#loan-amount')?.value),
                interestRate: parseFloat(Utils.$('#interest-rate')?.value || 0),
                loanTerm: parseInt(Utils.$('#loan-term')?.value || 30),
                propertyTax: Utils.parseCurrency(Utils.$('#property-tax')?.value),
                homeInsurance: Utils.parseCurrency(Utils.$('#home-insurance')?.value),
                pmi: Utils.parseCurrency(Utils.$('#pmi')?.value),
                hoaFees: Utils.parseCurrency(Utils.$('#hoa-fees')?.value),
                extraPayment: Utils.parseCurrency(Utils.$('#extra-payment')?.value)
            };

            console.log('💰 Calculating mortgage with inputs:', inputs);

            // Validate inputs
            if (inputs.homePrice <= 0 || inputs.interestRate <= 0 || inputs.loanTerm <= 0) {
                Utils.showToast('Please fill in all required fields with valid values', 'error');
                return;
            }

            // Calculate mortgage
            const results = MortgageCalculator.calculate(inputs);
            STATE.currentCalculation = { inputs, results };

            console.log('✅ Mortgage calculation completed:', results);

            // Update UI
            await UI.updateResults(results);
            await UI.updateAmortizationSchedule(inputs);
            await UI.updateTimelineChart(inputs);
            UI.updateAIInsights(inputs, results);
            UI.showExtraPaymentImpact(results.extraPaymentImpact);

            // Save data for later
            UI.saveData(inputs);

            Utils.showToast('Mortgage calculated successfully!', 'success');

        } catch (error) {
            console.error('❌ Calculation error:', error);
            Utils.showToast('Error calculating mortgage. Please check your inputs.', 'error');
        } finally {
            STATE.isCalculating = false;
            Utils.showLoading(false);
        }
    },

    // Update results display
    updateResults: async (results) => {
        const resultElements = {
            'total-payment': results.totalMonthlyPayment,
            'principal-interest': results.principalInterest,
            'monthly-property-tax': results.monthlyPropertyTax,
            'monthly-insurance': results.monthlyInsurance,
            'monthly-pmi': results.monthlyPmi,
            'monthly-hoa': results.monthlyHoa,
            'total-interest': results.totalInterest,
            'total-cost': results.totalCost
        };

        Object.entries(resultElements).forEach(([id, value]) => {
            const element = Utils.$(`#${id}`);
            if (element) {
                element.textContent = Utils.formatCurrency(value);
            }
        });

        // Update payment breakdown
        const breakdownElement = Utils.$('#payment-breakdown');
        if (breakdownElement) {
            const taxes = results.monthlyPropertyTax + results.monthlyInsurance + results.monthlyPmi + results.monthlyHoa;
            breakdownElement.innerHTML = `
                <span>Principal & Interest: ${Utils.formatCurrency(results.principalInterest)}</span>
                ${taxes > 0 ? `<span>Taxes & Insurance: ${Utils.formatCurrency(taxes)}</span>` : ''}
            `;
        }
    },

    // Show extra payment impact
    showExtraPaymentImpact: (impact) => {
        const impactSection = Utils.$('#extra-payment-impact');
        if (!impactSection) return;

        if (impact) {
            const interestSavingsEl = Utils.$('#interest-savings');
            const timeSavedEl = Utils.$('#time-saved');
            const payoffDateEl = Utils.$('#payoff-date');

            if (interestSavingsEl) interestSavingsEl.textContent = Utils.formatCurrency(impact.interestSavings);
            if (timeSavedEl) {
                const timeSavedText = impact.yearsSaved > 0 
                    ? `${impact.yearsSaved} years${impact.monthsRemaining > 0 ? `, ${impact.monthsRemaining} months` : ''}`
                    : `${impact.monthsRemaining} months`;
                timeSavedEl.textContent = timeSavedText;
            }
            if (payoffDateEl) payoffDateEl.textContent = Utils.formatDate(impact.payoffDate);

            impactSection.style.display = 'block';
        } else {
            impactSection.style.display = 'none';
        }
    },

    // Update amortization schedule
    updateAmortizationSchedule: async (inputs) => {
        const schedule = MortgageCalculator.generateAmortizationSchedule(
            inputs.loanAmount, 
            inputs.interestRate, 
            inputs.loanTerm,
            inputs.extraPayment
        );

        STATE.amortizationData = schedule;
        UI.renderAmortizationTable();
    },

    // Render amortization table
    renderAmortizationTable: () => {
        const tbody = Utils.$('#amortization-tbody');
        if (!tbody || !STATE.amortizationData.length) return;

        const itemsPerPage = CONFIG.amortizationPageSize;
        const startIndex = (STATE.currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, STATE.amortizationData.length);
        const pageData = STATE.amortizationData.slice(startIndex, endIndex);

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
        STATE.totalPages = Math.ceil(STATE.amortizationData.length / itemsPerPage);
        UI.updatePagination();
    },

    // Update pagination controls
    updatePagination: () => {
        const prevBtn = Utils.$('#prev-page');
        const nextBtn = Utils.$('#next-page');
        const pageInfo = Utils.$('#page-info');
        const paginationText = Utils.$('#pagination-text');

        if (prevBtn) prevBtn.disabled = STATE.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = STATE.currentPage >= STATE.totalPages;
        
        if (pageInfo) pageInfo.textContent = `Page ${STATE.currentPage} of ${STATE.totalPages}`;
        if (paginationText) paginationText.textContent = `Page ${STATE.currentPage} of ${STATE.totalPages}`;
    },

    // Change page
    changePage: (direction) => {
        const newPage = STATE.currentPage + direction;
        if (newPage >= 1 && newPage <= STATE.totalPages) {
            STATE.currentPage = newPage;
            UI.renderAmortizationTable();
        }
    },

    // Handle view toggle (yearly/monthly)
    handleViewToggle: (e) => {
        const btn = e.target;
        const view = btn.dataset.view;
        
        if (view && view !== STATE.currentView) {
            // Update active button
            Utils.$$('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            STATE.currentView = view;
            STATE.currentPage = 1;
            
            // Re-render table with different grouping if needed
            UI.renderAmortizationTable();
        }
    },

    // Update timeline chart
    updateTimelineChart: async (inputs) => {
        console.log('📈 Updating timeline chart...');
        
        // Generate timeline data
        const timelineData = MortgageCalculator.generateTimelineData(
            inputs.loanAmount,
            inputs.interestRate,
            inputs.loanTerm,
            inputs.extraPayment
        );

        console.log('📊 Generated timeline data:', timelineData.length, 'points');

        // Store timeline data
        STATE.timelineData = timelineData;

        // Initialize chart if not already done
        if (!STATE.chartInitialized) {
            console.log('🔄 Chart not initialized, initializing now...');
            if (!ChartManager.initializeChart()) {
                console.error('❌ Failed to initialize chart');
                return;
            }
        }

        // Update chart with new data
        if (ChartManager.updateChart(timelineData)) {
            console.log('✅ Chart updated successfully');
        } else {
            console.error('❌ Failed to update chart');
        }

        // Update slider max value
        STATE.maxYears = Math.min(timelineData.length, inputs.loanTerm);
        const yearSlider = Utils.$('#year-slider');
        if (yearSlider) {
            yearSlider.max = STATE.maxYears;
            yearSlider.value = 1;
        }

        // Update max year display
        const maxYearDisplay = Utils.$('#max-year-display');
        if (maxYearDisplay) {
            maxYearDisplay.textContent = `Year ${STATE.maxYears}`;
        }

        // Update initial display
        UI.updateTimelineDisplay();
    },

    // Update timeline display based on slider
    updateTimelineDisplay: () => {
        const yearSlider = Utils.$('#year-slider');
        if (!yearSlider || !STATE.timelineData || STATE.timelineData.length === 0) {
            console.log('⚠️ Timeline display update skipped - missing data');
            return;
        }

        const year = parseInt(yearSlider.value);
        const yearData = STATE.timelineData.find(d => d.year === year);
        
        if (yearData) {
            // Update stats display
            const remainingBalance = Utils.$('#remaining-balance');
            const principalPaid = Utils.$('#principal-paid');
            const interestPaid = Utils.$('#interest-paid');
            const currentYearDisplay = Utils.$('#current-year-display');

            if (remainingBalance) remainingBalance.textContent = Utils.formatCurrency(yearData.remainingBalance);
            if (principalPaid) principalPaid.textContent = Utils.formatCurrency(yearData.principalPaid);
            if (interestPaid) interestPaid.textContent = Utils.formatCurrency(yearData.interestPaid);
            if (currentYearDisplay) currentYearDisplay.textContent = `Year ${year}`;

            console.log('📊 Updated timeline display for year', year, ':', {
                remaining: yearData.remainingBalance,
                principal: yearData.principalPaid,
                interest: yearData.interestPaid
            });
        }

        STATE.currentYear = year;
    },

    // Update year slider programmatically
    updateYearSlider: (year) => {
        const yearSlider = Utils.$('#year-slider');
        if (yearSlider && year >= 1 && year <= STATE.maxYears) {
            yearSlider.value = year;
            UI.updateTimelineDisplay();
        }
    },

    // Update AI insights
    updateAIInsights: (inputs, results) => {
        const container = Utils.$('#insights-container');
        if (!container) return;

        const insights = AI.generateInsights(inputs, results);
        
        container.innerHTML = insights.map(insight => `
            <div class="insight-card ${insight.type}">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                    <h3 class="insight-title">${insight.title}</h3>
                    <p class="insight-text">${insight.content}</p>
                    ${insight.action ? `<button class="insight-action" onclick="${insight.action}">${insight.actionText}</button>` : ''}
                </div>
            </div>
        `).join('');
    },

    // Setup form validation
    setupFormValidation: () => {
        const form = Utils.$('#mortgage-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            if (!UI.validateForm()) {
                e.preventDefault();
                Utils.showToast('Please correct the errors in the form', 'error');
            }
        });
    },

    // Validate entire form
    validateForm: () => {
        let isValid = true;
        const requiredFields = ['home-price', 'down-payment', 'interest-rate', 'loan-term'];
        
        requiredFields.forEach(id => {
            const input = Utils.$(`#${id}`);
            if (!input || !input.value || Utils.parseCurrency(input.value) <= 0) {
                input?.classList.add('error');
                isValid = false;
            } else {
                input.classList.remove('error');
            }
        });

        return isValid;
    },

    // Bind share events
    bindShareEvents: () => {
        // Main share button
        const shareBtn = Utils.$('#share-results-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => UI.openShareModal('results'));
        }

        // Schedule share button
        const shareScheduleBtn = Utils.$('#share-schedule-btn');
        if (shareScheduleBtn) {
            shareScheduleBtn.addEventListener('click', () => UI.openShareModal('schedule'));
        }

        // PDF and print buttons
        const savePdfBtn = Utils.$('#save-pdf-btn');
        const printBtn = Utils.$('#print-btn');
        
        if (savePdfBtn) savePdfBtn.addEventListener('click', UI.generatePDF);
        if (printBtn) printBtn.addEventListener('click', UI.printResults);

        // Modal events
        UI.bindModalEvents();
    },

    // Bind modal events
    bindModalEvents: () => {
        const modal = Utils.$('#share-modal');
        const overlay = modal?.querySelector('.modal-overlay');
        const closeBtn = modal?.querySelector('.modal-close');

        // Close modal events
        [overlay, closeBtn].forEach(element => {
            element?.addEventListener('click', UI.closeShareModal);
        });

        // Share option events
        const shareOptions = Utils.$$('.share-option');
        shareOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const method = e.currentTarget.dataset.method;
                UI.handleShare(method);
            });
        });

        // Copy URL button
        const copyUrlBtn = Utils.$('.copy-url-btn');
        if (copyUrlBtn) {
            copyUrlBtn.addEventListener('click', UI.copyShareUrl);
        }
    },

    // Open share modal
    openShareModal: (type) => {
        const modal = Utils.$('#share-modal');
        if (!modal) return;

        // Generate share URL with current calculation data
        const shareUrl = UI.generateShareUrl();
        const shareUrlInput = Utils.$('#share-url');
        if (shareUrlInput) {
            shareUrlInput.value = shareUrl;
        }

        modal.style.display = 'block';
        modal.setAttribute('data-share-type', type);
    },

    // Close share modal
    closeShareModal: () => {
        const modal = Utils.$('#share-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    // Generate share URL
    generateShareUrl: () => {
        if (!STATE.currentCalculation) return window.location.href;

        const params = new URLSearchParams();
        const inputs = STATE.currentCalculation.inputs;
        
        Object.entries(inputs).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });

        return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    },

    // Handle different share methods
    handleShare: (method) => {
        const shareUrl = UI.generateShareUrl();
        const title = 'My Mortgage Calculation Results';
        const text = `Check out my mortgage calculation: Monthly payment ${Utils.formatCurrency(STATE.currentCalculation?.results?.totalMonthlyPayment || 0)}`;

        switch (method) {
            case 'email':
                const emailSubject = encodeURIComponent(title);
                const emailBody = encodeURIComponent(`${text}\n\n${shareUrl}`);
                window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`);
                break;

            case 'copy':
                UI.copyShareUrl();
                break;

            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
                break;

            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`);
                break;

            case 'linkedin':
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`);
                break;

            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`);
                break;
        }

        UI.closeShareModal();
    },

    // Copy share URL to clipboard
    copyShareUrl: () => {
        const shareUrlInput = Utils.$('#share-url');
        if (shareUrlInput) {
            shareUrlInput.select();
            document.execCommand('copy');
            Utils.showToast('Link copied to clipboard!', 'success');
        }
    },

    // Generate PDF report
    generatePDF: async () => {
        if (!STATE.currentCalculation) {
            Utils.showToast('Please calculate a mortgage first', 'error');
            return;
        }

        Utils.showLoading(true);
        
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // Add title
            pdf.setFontSize(20);
            pdf.setFont(undefined, 'bold');
            pdf.text('Mortgage Calculation Report', 20, 30);
            
            // Add date
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'normal');
            pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 40);
            
            // Add results
            const results = STATE.currentCalculation.results;
            const inputs = STATE.currentCalculation.inputs;
            
            let yPos = 60;
            const lineHeight = 8;
            
            // Loan details
            pdf.setFont(undefined, 'bold');
            pdf.text('Loan Details:', 20, yPos);
            yPos += lineHeight;
            
            pdf.setFont(undefined, 'normal');
            pdf.text(`Home Price: ${Utils.formatCurrency(inputs.homePrice)}`, 20, yPos);
            yPos += lineHeight;
            pdf.text(`Down Payment: ${Utils.formatCurrency(inputs.downPayment)} (${results.downPaymentPercent}%)`, 20, yPos);
            yPos += lineHeight;
            pdf.text(`Loan Amount: ${Utils.formatCurrency(inputs.loanAmount)}`, 20, yPos);
            yPos += lineHeight;
            pdf.text(`Interest Rate: ${inputs.interestRate}%`, 20, yPos);
            yPos += lineHeight;
            pdf.text(`Loan Term: ${inputs.loanTerm} years`, 20, yPos);
            yPos += lineHeight * 2;
            
            // Payment breakdown
            pdf.setFont(undefined, 'bold');
            pdf.text('Monthly Payment Breakdown:', 20, yPos);
            yPos += lineHeight;
            
            pdf.setFont(undefined, 'normal');
            pdf.text(`Principal & Interest: ${Utils.formatCurrency(results.principalInterest)}`, 20, yPos);
            yPos += lineHeight;
            pdf.text(`Property Tax: ${Utils.formatCurrency(results.monthlyPropertyTax)}`, 20, yPos);
            yPos += lineHeight;
            pdf.text(`Home Insurance: ${Utils.formatCurrency(results.monthlyInsurance)}`, 20, yPos);
            yPos += lineHeight;
            pdf.text(`PMI: ${Utils.formatCurrency(results.monthlyPmi)}`, 20, yPos);
            yPos += lineHeight;
            pdf.text(`HOA Fees: ${Utils.formatCurrency(results.monthlyHoa)}`, 20, yPos);
            yPos += lineHeight * 2;
            
            // Totals
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(14);
            pdf.text(`Total Monthly Payment: ${Utils.formatCurrency(results.totalMonthlyPayment)}`, 20, yPos);
            yPos += lineHeight * 2;
            
            pdf.setFontSize(12);
            pdf.text(`Total Interest Paid: ${Utils.formatCurrency(results.totalInterest)}`, 20, yPos);
            yPos += lineHeight;
            pdf.text(`Total Loan Cost: ${Utils.formatCurrency(results.totalCost)}`, 20, yPos);
            
            // Save the PDF
            pdf.save('mortgage-calculation-report.pdf');
            Utils.showToast('PDF report generated successfully!', 'success');
            
        } catch (error) {
            console.error('PDF generation error:', error);
            Utils.showToast('Error generating PDF report', 'error');
        } finally {
            Utils.showLoading(false);
        }
    },

    // Print results
    printResults: () => {
        if (!STATE.currentCalculation) {
            Utils.showToast('Please calculate a mortgage first', 'error');
            return;
        }

        const printWindow = window.open('', '_blank');
        const results = STATE.currentCalculation.results;
        const inputs = STATE.currentCalculation.inputs;
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Mortgage Calculation Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #21808d; }
                    .section { margin-bottom: 20px; }
                    .result-row { display: flex; justify-content: space-between; margin: 5px 0; }
                    .total { font-weight: bold; font-size: 1.2em; color: #21808d; }
                </style>
            </head>
            <body>
                <h1>Mortgage Calculation Report</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
                
                <div class="section">
                    <h2>Loan Details</h2>
                    <div class="result-row">
                        <span>Home Price:</span>
                        <span>${Utils.formatCurrency(inputs.homePrice)}</span>
                    </div>
                    <div class="result-row">
                        <span>Down Payment:</span>
                        <span>${Utils.formatCurrency(inputs.downPayment)} (${results.downPaymentPercent}%)</span>
                    </div>
                    <div class="result-row">
                        <span>Loan Amount:</span>
                        <span>${Utils.formatCurrency(inputs.loanAmount)}</span>
                    </div>
                    <div class="result-row">
                        <span>Interest Rate:</span>
                        <span>${inputs.interestRate}%</span>
                    </div>
                    <div class="result-row">
                        <span>Loan Term:</span>
                        <span>${inputs.loanTerm} years</span>
                    </div>
                </div>
                
                <div class="section">
                    <h2>Monthly Payment Breakdown</h2>
                    <div class="result-row">
                        <span>Principal & Interest:</span>
                        <span>${Utils.formatCurrency(results.principalInterest)}</span>
                    </div>
                    <div class="result-row">
                        <span>Property Tax:</span>
                        <span>${Utils.formatCurrency(results.monthlyPropertyTax)}</span>
                    </div>
                    <div class="result-row">
                        <span>Home Insurance:</span>
                        <span>${Utils.formatCurrency(results.monthlyInsurance)}</span>
                    </div>
                    <div class="result-row">
                        <span>PMI:</span>
                        <span>${Utils.formatCurrency(results.monthlyPmi)}</span>
                    </div>
                    <div class="result-row">
                        <span>HOA Fees:</span>
                        <span>${Utils.formatCurrency(results.monthlyHoa)}</span>
                    </div>
                    <div class="result-row total">
                        <span>Total Monthly Payment:</span>
                        <span>${Utils.formatCurrency(results.totalMonthlyPayment)}</span>
                    </div>
                </div>
                
                <div class="section">
                    <h2>Loan Summary</h2>
                    <div class="result-row">
                        <span>Total Interest Paid:</span>
                        <span>${Utils.formatCurrency(results.totalInterest)}</span>
                    </div>
                    <div class="result-row">
                        <span>Total Loan Cost:</span>
                        <span>${Utils.formatCurrency(results.totalCost)}</span>
                    </div>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    },

    // Bind global controls
    bindGlobalControls: () => {
        // Mobile menu toggle
        const mobileMenuToggle = Utils.$('#mobile-menu-toggle');
        const navMenu = Utils.$('#nav-menu');
        
        if (mobileMenuToggle && navMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                const isOpen = navMenu.classList.contains('open');
                navMenu.classList.toggle('open', !isOpen);
                mobileMenuToggle.setAttribute('aria-expanded', !isOpen);
            });
        }

        // Voice toggle (placeholder for future implementation)
        const voiceToggle = Utils.$('#voice-toggle');
        if (voiceToggle) {
            voiceToggle.addEventListener('click', () => {
                Utils.showToast('Voice commands coming soon!', 'info');
            });
        }
    },

    // Toggle theme
    toggleTheme: () => {
        const body = document.body;
        const themeIcon = Utils.$('.theme-icon');
        
        const isDark = body.getAttribute('data-color-scheme') === 'dark';
        
        if (isDark) {
            body.setAttribute('data-color-scheme', 'light');
            if (themeIcon) themeIcon.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        } else {
            body.setAttribute('data-color-scheme', 'dark');
            if (themeIcon) themeIcon.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        }
    },

    // Load saved data
    loadSavedData: () => {
        try {
            // Load theme preference
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                document.body.setAttribute('data-color-scheme', savedTheme);
                const themeIcon = Utils.$('.theme-icon');
                if (themeIcon) {
                    themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
                }
            }

            // Load form data from URL params
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.toString()) {
                const inputs = {};
                urlParams.forEach((value, key) => {
                    inputs[key] = value;
                });
                UI.populateFormFromData(inputs);
            }

        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    },

    // Populate form from data
    populateFormFromData: (data) => {
        Object.entries(data).forEach(([key, value]) => {
            const input = Utils.$(`#${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
            if (input && value) {
                input.value = value;
            }
        });
        
        // Trigger calculation if form is complete
        setTimeout(() => {
            if (UI.isFormValid()) {
                UI.calculateMortgage();
            }
        }, 100);
    },

    // Save data to localStorage
    saveData: (inputs) => {
        try {
            localStorage.setItem('lastMortgageCalculation', JSON.stringify(inputs));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }
};

// ========== AI INSIGHTS ==========
const AI = {
    generateInsights: (inputs, results) => {
        const insights = [];

        // Payment to income ratio insight
        insights.push({
            type: 'analysis',
            icon: '📊',
            title: 'Payment Analysis',
            content: `Your total monthly payment of ${Utils.formatCurrency(results.totalMonthlyPayment)} includes ${Utils.formatCurrency(results.principalInterest)} for principal and interest. The recommended maximum is 28% of your gross monthly income.`
        });

        // Down payment insight
        if (results.downPaymentPercent < 20) {
            insights.push({
                type: 'warning',
                icon: '⚠️',
                title: 'Down Payment Notice',
                content: `With a ${results.downPaymentPercent}% down payment, you may need to pay PMI. Consider saving for a 20% down payment to eliminate PMI and reduce your monthly payment.`
            });
        } else {
            insights.push({
                type: 'success',
                icon: '✅',
                title: 'Great Down Payment',
                content: `Excellent! Your ${results.downPaymentPercent}% down payment means no PMI required and better loan terms.`
            });
        }

        // Interest rate insight
        if (inputs.interestRate > 7.0) {
            insights.push({
                type: 'tip',
                icon: '💡',
                title: 'Interest Rate Tip',
                content: `Your ${inputs.interestRate}% rate is above current averages. Consider shopping around with multiple lenders or improving your credit score for better rates.`
            });
        }

        // Extra payment insight
        if (results.extraPaymentImpact) {
            insights.push({
                type: 'success',
                icon: '🚀',
                title: 'Extra Payment Impact',
                content: `Your extra payment of ${Utils.formatCurrency(inputs.extraPayment)} will save you ${Utils.formatCurrency(results.extraPaymentImpact.interestSavings)} in interest and pay off your loan ${results.extraPaymentImpact.yearsSaved} years early!`
            });
        } else {
            insights.push({
                type: 'tip',
                icon: '💰',
                title: 'Extra Payment Opportunity',
                content: `Consider making extra principal payments. Even an additional $100/month could save thousands in interest and years off your loan.`
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

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏠 FinGuid Mortgage Calculator v9.1 - Chart Display Fixed');
    
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
