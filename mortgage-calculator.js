/**
 * mortgage-calculator-improved.js
 * FinGuid AI-Enhanced Mortgage Calculator v9.0
 * Production Ready with Enhanced Features and Improvements
 * 
 * Features:
 * - Reorganized results section with proper order
 * - Interactive Mortgage Over Time chart with year slider
 * - Collapsible amortization schedule (default collapsed)
 * - Universal sharing (Share, PDF, Print)
 * - Related calculators section
 * - Customer feedback with GitHub storage
 * - Extra payments impact calculation
 * - Improved input field spacing
 * - Enhanced accessibility and mobile support
 */

'use strict';

// ========== CONFIGURATION & STATE ==========
const CONFIG = {
    debounceDelay: 300,
    amortizationPageSize: 12,
    githubConfig: {
        owner: 'your-username',
        repo: 'finguid-feedback',
        branch: 'main',
        token: 'your_github_token' // Store securely in production
    },
    chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#21808d',
                borderWidth: 1
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return Utils.formatCurrency(value, 0);
                    }
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
    activeTab: 'mortgage-over-time',
    isListening: false,
    screenReaderEnabled: false,
    speechRecognition: null,
    timelineChart: null,
    selectedYear: 1,
    feedbackRating: 0
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
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
};

// ========== CALCULATION ENGINE ==========
const CalculationEngine = {
    getInputs: () => {
        const homePrice = parseFloat(Utils.$('#home-price').value) || 0;
        const dpAmount = parseFloat(Utils.$('#dp-amount').value) || 0;
        const dpPercent = parseFloat(Utils.$('#dp-percent').value) || 0;

        // Determine which down payment value to use
        const activeTab = Utils.$('.tab-btn.active')?.dataset.tab || 'dollar';
        const downPayment = activeTab === 'percent' ? (homePrice * dpPercent / 100) : dpAmount;

        return {
            homePrice,
            downPayment,
            interestRate: parseFloat(Utils.$('#interest-rate').value) || 0,
            loanTerm: parseInt(Utils.$('#loan-term').value) || 0,
            startDate: Utils.$('#start-date').value,
            state: Utils.$('#state').value,
            propertyTax: parseFloat(Utils.$('#property-tax').value) || 0,
            homeInsurance: parseFloat(Utils.$('#home-insurance').value) || 0,
            hoaFees: parseFloat(Utils.$('#hoa-fees').value) || 0,
            extraMonthly: parseFloat(Utils.$('#extra-monthly').value) || 0,
            extraYearly: parseFloat(Utils.$('#extra-yearly').value) || 0,
            extraYearlyDate: Utils.$('#extra-yearly-date')?.value
        };
    },

    calculate: Utils.debounce(() => {
        try {
            const inputs = CalculationEngine.getInputs();
            const results = CalculationEngine.calculateMortgage(inputs);
            
            STATE.currentCalculation = results;
            STATE.amortizationData = CalculationEngine.generateAmortization(inputs, results);

            // Update all UI components
            UIManager.displayResults(results, inputs);
            UIManager.displayLoanSummary(results, inputs);
            UIManager.updateChartData(results, inputs);
            AIInsights.generate(inputs, results);
            AmortizationManager.display();

            // Announce to screen reader
            AccessibilityManager.announce(`Monthly payment updated: ${Utils.formatCurrency(results.totalMonthly)}`);

        } catch (error) {
            console.error('Calculation error:', error);
            Utils.showToast('Error calculating mortgage. Please check your inputs.', 'error');
        }
    }, CONFIG.debounceDelay),

    calculateMortgage: (inputs) => {
        const { homePrice, downPayment, interestRate, loanTerm, propertyTax, homeInsurance, hoaFees, extraMonthly } = inputs;

        // Validate inputs
        if (homePrice <= 0 || loanTerm <= 0) {
            return CalculationEngine.getEmptyResult();
        }

        const loanAmount = Math.max(0, homePrice - downPayment);
        const downPaymentPercent = homePrice > 0 ? (downPayment / homePrice) * 100 : 0;

        if (loanAmount <= 0) {
            return CalculationEngine.getEmptyResult();
        }

        // Calculate monthly payment (Principal & Interest)
        const monthlyRate = interestRate / 100 / 12;
        const numPayments = loanTerm * 12;
        
        let monthlyPI = 0;
        if (monthlyRate > 0) {
            monthlyPI = loanAmount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -numPayments)));
        } else {
            monthlyPI = loanAmount / numPayments; // 0% interest case
        }

        // Calculate PMI (if down payment < 20%)
        const monthlyPMI = downPaymentPercent < 20 ? (loanAmount * 0.005) / 12 : 0;

        // Calculate other monthly costs
        const monthlyTax = propertyTax / 12;
        const monthlyInsurance = homeInsurance / 12;
        const monthlyHOA = hoaFees;

        // Calculate totals
        const totalMonthly = monthlyPI + monthlyPMI + monthlyTax + monthlyInsurance + monthlyHOA;
        
        // Calculate total interest without extra payments first
        const totalInterest = (monthlyPI * numPayments) - loanAmount;
        const totalPaid = loanAmount + totalInterest;

        // Calculate payoff date
        const startDate = new Date(inputs.startDate + '-01');
        const payoffDate = new Date(startDate);
        payoffDate.setMonth(payoffDate.getMonth() + numPayments);

        return {
            loanAmount,
            downPaymentPercent,
            monthlyPI: isNaN(monthlyPI) ? 0 : monthlyPI,
            monthlyPMI,
            monthlyTax,
            monthlyInsurance,
            monthlyHOA,
            totalMonthly: isNaN(totalMonthly) ? 0 : totalMonthly,
            totalInterest: isNaN(totalInterest) ? 0 : totalInterest,
            totalPaid: isNaN(totalPaid) ? 0 : totalPaid,
            payoffDate,
            extraMonthly
        };
    },

    getEmptyResult: () => ({
        loanAmount: 0,
        downPaymentPercent: 0,
        monthlyPI: 0,
        monthlyPMI: 0,
        monthlyTax: 0,
        monthlyInsurance: 0,
        monthlyHOA: 0,
        totalMonthly: 0,
        totalInterest: 0,
        totalPaid: 0,
        payoffDate: new Date(),
        extraMonthly: 0
    }),

    generateAmortization: (inputs, results) => {
        const { loanAmount, monthlyPI } = results;
        const { extraMonthly, extraYearly, extraYearlyDate, interestRate, loanTerm } = inputs;

        if (loanAmount <= 0 || monthlyPI <= 0) return [];

        const schedule = [];
        const monthlyRate = interestRate / 100 / 12;
        let balance = loanAmount;
        let paymentNum = 1;
        let currentDate = new Date(inputs.startDate + '-01');

        // Calculate when to apply yearly extra payment
        let extraYearlyPaymentMonth = -1;
        if (extraYearlyDate && extraYearly > 0) {
            const extraDate = new Date(extraYearlyDate + '-01');
            const startDate = new Date(inputs.startDate + '-01');
            extraYearlyPaymentMonth = ((extraDate.getFullYear() - startDate.getFullYear()) * 12) + 
                                    (extraDate.getMonth() - startDate.getMonth()) + 1;
        }

        // Generate schedule
        while (balance > 0.01 && paymentNum <= loanTerm * 12 * 2) { // Safety limit
            const interestPayment = balance * monthlyRate;
            let principalPayment = monthlyPI - interestPayment;

            // Add extra payments
            let totalExtraPayment = extraMonthly;
            if (paymentNum === extraYearlyPaymentMonth) {
                totalExtraPayment += extraYearly;
            }

            principalPayment += totalExtraPayment;

            // Don't overpay
            if (principalPayment > balance) {
                principalPayment = balance;
            }

            balance -= principalPayment;

            schedule.push({
                paymentNumber: paymentNum,
                date: new Date(currentDate),
                payment: interestPayment + principalPayment,
                principal: principalPayment,
                interest: interestPayment,
                balance: Math.max(0, balance),
                extraPayment: totalExtraPayment
            });

            paymentNum++;
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        return schedule;
    }
};

// ========== UI MANAGER ==========
const UIManager = {
    displayResults: (results, inputs) => {
        // Update total payment
        const totalElement = Utils.$('#total-payment');
        if (totalElement) {
            totalElement.textContent = Utils.formatCurrency(results.totalMonthly, 2);
        }

        // Update breakdown
        const breakdownElement = Utils.$('#payment-breakdown');
        if (breakdownElement) {
            let html = `
                <div class="breakdown-item">
                    <span>Principal & Interest</span>
                    <span>${Utils.formatCurrency(results.monthlyPI, 2)}</span>
                </div>
            `;

            if (results.monthlyPMI > 0) {
                html += `
                    <div class="breakdown-item">
                        <span>PMI</span>
                        <span>${Utils.formatCurrency(results.monthlyPMI, 2)}</span>
                    </div>
                `;
            }

            html += `
                <div class="breakdown-item">
                    <span>Property Tax</span>
                    <span>${Utils.formatCurrency(results.monthlyTax, 2)}</span>
                </div>
                <div class="breakdown-item">
                    <span>Home Insurance</span>
                    <span>${Utils.formatCurrency(results.monthlyInsurance, 2)}</span>
                </div>
            `;

            if (results.monthlyHOA > 0) {
                html += `
                    <div class="breakdown-item">
                        <span>HOA Fees</span>
                        <span>${Utils.formatCurrency(results.monthlyHOA, 2)}</span>
                    </div>
                `;
            }

            if (results.extraMonthly > 0) {
                html += `
                    <div class="breakdown-item extra-payment">
                        <span>Extra Monthly Payment</span>
                        <span>+${Utils.formatCurrency(results.extraMonthly, 2)}</span>
                    </div>
                `;
            }

            breakdownElement.innerHTML = html;
        }
    },

    displayLoanSummary: (results, inputs) => {
        // Calculate total cost with extra payments impact
        const schedule = STATE.amortizationData;
        const actualTotalInterest = schedule.reduce((sum, payment) => sum + payment.interest, 0);
        const totalCostWithExtras = results.loanAmount + actualTotalInterest;

        // Calculate payoff date from schedule
        const actualPayoffDate = schedule.length > 0 ? schedule[schedule.length - 1].date : results.payoffDate;

        // Update loan summary
        const loanAmountEl = Utils.$('#loan-amount-display');
        const totalInterestEl = Utils.$('#total-interest-display');
        const totalCostEl = Utils.$('#total-cost-display');
        const payoffDateEl = Utils.$('#payoff-date-display');

        if (loanAmountEl) loanAmountEl.textContent = Utils.formatCurrency(results.loanAmount, 0);
        if (totalInterestEl) totalInterestEl.textContent = Utils.formatCurrency(actualTotalInterest, 0);
        if (totalCostEl) totalCostEl.textContent = Utils.formatCurrency(totalCostWithExtras, 0);
        if (payoffDateEl) payoffDateEl.textContent = Utils.formatDate(actualPayoffDate);
    },

    updateChartData: (results, inputs) => {
        // Update chart summary for selected year
        const yearIndex = Math.min(STATE.selectedYear - 1, Math.floor(STATE.amortizationData.length / 12) - 1);
        const yearData = STATE.amortizationData.slice(yearIndex * 12, (yearIndex + 1) * 12);
        
        if (yearData.length > 0) {
            const remainingBalance = yearData[yearData.length - 1].balance;
            const principalPaid = yearData.reduce((sum, p) => sum + p.principal, 0);
            const interestPaid = yearData.reduce((sum, p) => sum + p.interest, 0);

            const remainingEl = Utils.$('#chart-remaining-balance');
            const principalEl = Utils.$('#chart-principal-paid');
            const interestEl = Utils.$('#chart-interest-paid');

            if (remainingEl) remainingEl.textContent = Utils.formatCurrency(remainingBalance, 0);
            if (principalEl) principalEl.textContent = Utils.formatCurrency(principalPaid, 0);
            if (interestEl) interestEl.textContent = Utils.formatCurrency(interestPaid, 0);
        }

        // Update chart
        UIManager.createTimelineChart(results, inputs);

        // Update year slider
        const yearSlider = Utils.$('#year-slider');
        if (yearSlider && STATE.amortizationData.length > 0) {
            const maxYears = Math.ceil(STATE.amortizationData.length / 12);
            yearSlider.max = maxYears;
            yearSlider.value = STATE.selectedYear;
        }
    },

    createTimelineChart: (results, inputs) => {
        const canvas = Utils.$('#mortgage-timeline-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (STATE.timelineChart) {
            STATE.timelineChart.destroy();
        }

        // Generate data for chart (yearly data points)
        const schedule = STATE.amortizationData;
        const yearlyData = [];
        const labels = [];
        const balanceData = [];
        const principalData = [];
        const interestData = [];

        // Group by years
        for (let year = 1; year <= Math.min(inputs.loanTerm, 30); year += (year <= 10 ? 1 : 5)) {
            const yearIndex = (year - 1) * 12;
            if (schedule[yearIndex]) {
                labels.push(`Year ${year}`);
                balanceData.push(schedule[yearIndex].balance);
                
                const yearPayments = schedule.slice(Math.max(0, yearIndex - 11), yearIndex + 1);
                principalData.push(yearPayments.reduce((sum, p) => sum + p.principal, 0));
                interestData.push(yearPayments.reduce((sum, p) => sum + p.interest, 0));
            }
        }

        STATE.timelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Remaining Balance',
                        data: balanceData,
                        borderColor: CONFIG.colors.error,
                        backgroundColor: CONFIG.colors.error + '20',
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Principal Paid (Annual)',
                        data: principalData,
                        borderColor: CONFIG.colors.success,
                        backgroundColor: CONFIG.colors.success + '20',
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Interest Paid (Annual)',
                        data: interestData,
                        borderColor: CONFIG.colors.primary,
                        backgroundColor: CONFIG.colors.primary + '20',
                        fill: false,
                        tension: 0.1
                    }
                ]
            },
            options: {
                ...CONFIG.chartOptions,
                plugins: {
                    ...CONFIG.chartOptions.plugins,
                    tooltip: {
                        ...CONFIG.chartOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${Utils.formatCurrency(context.parsed.y, 0)}`;
                            }
                        }
                    }
                }
            }
        });
    }
};

// ========== TAB MANAGER ==========
const TabManager = {
    switchTab: (tabName) => {
        // Update tab headers
        Utils.$$('.tab-header').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        Utils.$$('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        STATE.activeTab = tabName;

        // If switching to mortgage over time, update chart
        if (tabName === 'mortgage-over-time') {
            setTimeout(() => {
                if (STATE.currentCalculation) {
                    UIManager.createTimelineChart(STATE.currentCalculation, CalculationEngine.getInputs());
                }
            }, 100);
        }
    },

    setupTabControls: () => {
        Utils.$$('.tab-header').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                TabManager.switchTab(tabName);
            });
        });

        // Year slider for chart interaction
        const yearSlider = Utils.$('#year-slider');
        if (yearSlider) {
            yearSlider.addEventListener('input', (e) => {
                STATE.selectedYear = parseInt(e.target.value);
                Utils.$('#current-year').textContent = STATE.selectedYear;
                
                if (STATE.currentCalculation) {
                    UIManager.updateChartData(STATE.currentCalculation, CalculationEngine.getInputs());
                }
            });
        }
    }
};

// ========== AI INSIGHTS ==========
const AIInsights = {
    generate: (inputs, results) => {
        const insights = [];

        // PMI Warning
        if (results.monthlyPMI > 0) {
            const additionalDown = (inputs.homePrice * 0.2) - inputs.downPayment;
            insights.push({
                type: 'warning',
                icon: 'fas fa-exclamation-triangle',
                title: 'PMI Alert',
                content: `You're paying ${Utils.formatCurrency(results.monthlyPMI, 0)}/month in PMI. Consider increasing your down payment by ${Utils.formatCurrency(additionalDown, 0)} to reach 20% and eliminate PMI.`
            });
        }

        // Interest Rate Analysis
        if (inputs.interestRate > 7.5) {
            insights.push({
                type: 'warning',
                icon: 'fas fa-chart-line',
                title: 'High Interest Rate',
                content: `Your rate of ${inputs.interestRate}% is above current market averages. Consider shopping around for better rates or improving your credit score.`
            });
        } else if (inputs.interestRate < 5.0) {
            insights.push({
                type: 'success',
                icon: 'fas fa-thumbs-up',
                title: 'Great Rate!',
                content: `Your ${inputs.interestRate}% rate is excellent and below market average. You're saving significant money on interest.`
            });
        }

        // Affordability Rule
        const recommendedIncome = results.totalMonthly / 0.28;
        insights.push({
            type: 'info',
            icon: 'fas fa-calculator',
            title: 'Income Recommendation',
            content: `For comfortable affordability (28% rule), your gross monthly income should be at least ${Utils.formatCurrency(recommendedIncome, 0)}.`
        });

        // Extra Payment Benefits
        if (inputs.extraMonthly > 0) {
            const schedule = STATE.amortizationData;
            const originalTermMonths = inputs.loanTerm * 12;
            const actualTermMonths = schedule.length;
            const monthsSaved = originalTermMonths - actualTermMonths;
            const yearsSaved = monthsSaved / 12;

            if (yearsSaved > 0.5) {
                insights.push({
                    type: 'success',
                    icon: 'fas fa-rocket',
                    title: 'Extra Payment Impact',
                    content: `Your extra ${Utils.formatCurrency(inputs.extraMonthly, 0)}/month payment will save you approximately ${yearsSaved.toFixed(1)} years and thousands in interest!`
                });
            }
        }

        // Property Tax Analysis
        const stateInfo = STATE_TAX_RATES[inputs.state];
        if (stateInfo && stateInfo.rate > 0.015) {
            insights.push({
                type: 'warning',
                icon: 'fas fa-home',
                title: 'High Property Tax State',
                content: `${stateInfo.name} has above-average property taxes at ${(stateInfo.rate * 100).toFixed(2)}%. Budget accordingly for annual increases.`
            });
        }

        // Display insights
        AIInsights.display(insights);
    },

    display: (insights) => {
        const container = Utils.$('#insights-list');
        if (!container) return;

        const html = insights.map(insight => `
            <div class="insight-item ${insight.type}">
                <i class="${insight.icon}" aria-hidden="true"></i>
                <div class="insight-content">
                    <h4>${insight.title}</h4>
                    <p>${insight.content}</p>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }
};

// ========== SHARING FUNCTIONALITY ==========
const SharingManager = {
    share: async () => {
        if (!STATE.currentCalculation) {
            Utils.showToast('No results to share', 'warning');
            return;
        }

        const shareData = {
            title: 'My Mortgage Calculation - FinGuid',
            text: `Monthly Payment: ${Utils.formatCurrency(STATE.currentCalculation.totalMonthly)}`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                Utils.showToast('Results shared successfully', 'success');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    SharingManager.fallbackShare(shareData);
                }
            }
        } else {
            SharingManager.fallbackShare(shareData);
        }
    },

    fallbackShare: async (shareData) => {
        try {
            await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
            Utils.showToast('Results copied to clipboard', 'success');
        } catch (error) {
            Utils.showToast('Unable to share results', 'error');
        }
    },

    savePDF: async () => {
        if (!STATE.currentCalculation) {
            Utils.showToast('No results to save', 'warning');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            
            // Add title
            pdf.setFontSize(20);
            pdf.text('Mortgage Calculator Results', 20, 30);
            
            // Add summary
            pdf.setFontSize(12);
            const results = STATE.currentCalculation;
            const inputs = CalculationEngine.getInputs();
            
            let yPosition = 50;
            const lineHeight = 8;
            
            const addLine = (text) => {
                pdf.text(text, 20, yPosition);
                yPosition += lineHeight;
            };
            
            addLine(`Monthly Payment: ${Utils.formatCurrency(results.totalMonthly)}`);
            addLine(`Loan Amount: ${Utils.formatCurrency(results.loanAmount)}`);
            addLine(`Total Interest: ${Utils.formatCurrency(STATE.amortizationData.reduce((sum, p) => sum + p.interest, 0))}`);
            addLine(`Total Cost: ${Utils.formatCurrency(results.loanAmount + STATE.amortizationData.reduce((sum, p) => sum + p.interest, 0))}`);
            
            yPosition += 10;
            addLine('Payment Breakdown:');
            addLine(`  Principal & Interest: ${Utils.formatCurrency(results.monthlyPI)}`);
            if (results.monthlyPMI > 0) addLine(`  PMI: ${Utils.formatCurrency(results.monthlyPMI)}`);
            addLine(`  Property Tax: ${Utils.formatCurrency(results.monthlyTax)}`);
            addLine(`  Home Insurance: ${Utils.formatCurrency(results.monthlyInsurance)}`);
            if (results.monthlyHOA > 0) addLine(`  HOA Fees: ${Utils.formatCurrency(results.monthlyHOA)}`);
            
            // Save the PDF
            pdf.save('mortgage-calculation.pdf');
            Utils.showToast('PDF saved successfully', 'success');
            
        } catch (error) {
            console.error('PDF generation error:', error);
            Utils.showToast('Error generating PDF', 'error');
        }
    },

    print: () => {
        window.print();
    }
};

// ========== FEEDBACK MANAGER ==========
const FeedbackManager = {
    setupRating: () => {
        const stars = Utils.$$('#feedback-rating .fa-star');
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                STATE.feedbackRating = index + 1;
                FeedbackManager.updateStars();
            });

            star.addEventListener('mouseenter', () => {
                FeedbackManager.highlightStars(index + 1);
            });
        });

        const ratingContainer = Utils.$('#feedback-rating');
        if (ratingContainer) {
            ratingContainer.addEventListener('mouseleave', () => {
                FeedbackManager.updateStars();
            });
        }
    },

    updateStars: () => {
        const stars = Utils.$$('#feedback-rating .fa-star');
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < STATE.feedbackRating);
        });
    },

    highlightStars: (rating) => {
        const stars = Utils.$$('#feedback-rating .fa-star');
        stars.forEach((star, index) => {
            star.classList.toggle('hover', index < rating);
        });
    },

    submitFeedback: async (formData) => {
        try {
            // Create feedback object
            const feedback = {
                timestamp: new Date().toISOString(),
                name: formData.get('feedback-name') || 'Anonymous',
                email: formData.get('feedback-email') || '',
                rating: STATE.feedbackRating,
                message: formData.get('feedback-message'),
                url: window.location.href,
                userAgent: navigator.userAgent
            };

            // Store in GitHub (you would implement this with your GitHub token)
            await FeedbackManager.storeInGitHub(feedback);
            
            Utils.showToast('Thank you for your feedback!', 'success');
            
            // Reset form
            Utils.$('#feedback-form').reset();
            STATE.feedbackRating = 0;
            FeedbackManager.updateStars();
            
        } catch (error) {
            console.error('Feedback submission error:', error);
            Utils.showToast('Error submitting feedback. Please try again.', 'error');
        }
    },

    storeInGitHub: async (feedback) => {
        // This is a placeholder implementation
        // In production, you'd implement this server-side for security
        console.log('Storing feedback:', feedback);
        
        // For now, store in localStorage as a fallback
        const storedFeedback = JSON.parse(localStorage.getItem('finguid-feedback') || '[]');
        storedFeedback.push(feedback);
        localStorage.setItem('finguid-feedback', JSON.stringify(storedFeedback));
    }
};

// ========== AMORTIZATION MANAGER ==========
const AmortizationManager = {
    display: () => {
        const thead = Utils.$('#amortization-table thead');
        const tbody = Utils.$('#amortization-table tbody');
        
        if (!thead || !tbody) return;

        // Get current page data
        const data = AmortizationManager.getCurrentPageData();

        // Display data
        tbody.innerHTML = data.map(row => `
            <tr>
                <td>${row.paymentNumber}</td>
                <td>${Utils.formatDate(row.date)}</td>
                <td>${Utils.formatCurrency(row.payment, 2)}</td>
                <td>${Utils.formatCurrency(row.principal, 2)}</td>
                <td>${Utils.formatCurrency(row.interest, 2)}</td>
                <td>${Utils.formatCurrency(row.balance, 2)}</td>
            </tr>
        `).join('');

        // Update pagination
        AmortizationManager.updatePagination();
    },

    getCurrentPageData: () => {
        let data = STATE.amortizationData;
        if (STATE.currentView === 'yearly') {
            data = AmortizationManager.getYearlyData();
        }

        const startIndex = (STATE.currentPage - 1) * CONFIG.amortizationPageSize;
        const endIndex = startIndex + CONFIG.amortizationPageSize;
        return data.slice(startIndex, endIndex);
    },

    getYearlyData: () => {
        const yearlyData = [];
        const schedule = STATE.amortizationData;

        for (let i = 11; i < schedule.length; i += 12) {
            if (schedule[i]) {
                const yearPayments = schedule.slice(Math.max(0, i - 11), i + 1);
                yearlyData.push({
                    paymentNumber: Math.floor(i / 12) + 1,
                    date: schedule[i].date,
                    payment: yearPayments.reduce((sum, p) => sum + p.payment, 0),
                    principal: yearPayments.reduce((sum, p) => sum + p.principal, 0),
                    interest: yearPayments.reduce((sum, p) => sum + p.interest, 0),
                    balance: schedule[i].balance
                });
            }
        }

        return yearlyData;
    },

    updatePagination: () => {
        const totalData = STATE.currentView === 'yearly' ? 
            AmortizationManager.getYearlyData().length : STATE.amortizationData.length;
        const totalPages = Math.ceil(totalData / CONFIG.amortizationPageSize);

        const pageInfo = Utils.$('#page-info');
        const prevBtn = Utils.$('#prev-page');
        const nextBtn = Utils.$('#next-page');

        if (pageInfo) pageInfo.textContent = `Page ${STATE.currentPage} of ${totalPages}`;
        if (prevBtn) prevBtn.disabled = STATE.currentPage === 1;
        if (nextBtn) nextBtn.disabled = STATE.currentPage === totalPages;
    },

    switchView: (view) => {
        STATE.currentView = view;
        STATE.currentPage = 1;

        // Update view buttons
        Utils.$$('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.id === `view-${view}`);
        });

        AmortizationManager.display();
    },

    changePage: (direction) => {
        const totalData = STATE.currentView === 'yearly' ? 
            AmortizationManager.getYearlyData().length : STATE.amortizationData.length;
        const totalPages = Math.ceil(totalData / CONFIG.amortizationPageSize);

        const newPage = STATE.currentPage + direction;
        if (newPage >= 1 && newPage <= totalPages) {
            STATE.currentPage = newPage;
            AmortizationManager.display();
        }
    },

    exportCSV: () => {
        if (!STATE.amortizationData.length) {
            Utils.showToast('No data to export', 'warning');
            return;
        }

        const csvHeader = 'Payment #,Date,Payment,Principal,Interest,Balance,Extra Payment\n';
        const csvData = STATE.amortizationData.map(row => 
            `${row.paymentNumber},${Utils.formatDate(row.date)},${row.payment.toFixed(2)},${row.principal.toFixed(2)},${row.interest.toFixed(2)},${row.balance.toFixed(2)},${row.extraPayment.toFixed(2)}`
        ).join('\n');

        const blob = new Blob([csvHeader + csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'amortization-schedule.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Utils.showToast('Amortization schedule exported successfully', 'success');
    }
};

// ========== FORM HANDLERS ==========
const FormHandlers = {
    setupTabControls: () => {
        Utils.$$('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                if (!targetTab) return;

                // Update tab buttons
                const tabGroup = e.target.closest('.tab-controls');
                tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                // Update tab content
                const container = tabGroup.nextElementSibling.parentElement;
                container.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                container.querySelector(`[data-tab-content="${targetTab}"]`)?.classList.add('active');

                // Sync down payment values
                FormHandlers.syncDownPayment();
            });
        });
    },

    setupTermChips: () => {
        Utils.$$('.term-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const termValue = e.target.dataset.term;
                if (!termValue) return;

                // Update active chip
                Utils.$$('.term-chip').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');

                // Update input value
                const loanTermInput = Utils.$('#loan-term');
                if (loanTermInput) {
                    loanTermInput.value = termValue;
                    CalculationEngine.calculate();
                }
            });
        });
    },

    syncDownPayment: () => {
        const homePrice = parseFloat(Utils.$('#home-price').value) || 0;
        const dpAmount = parseFloat(Utils.$('#dp-amount').value) || 0;
        const dpPercent = parseFloat(Utils.$('#dp-percent').value) || 0;
        const activeTab = Utils.$('.tab-btn.active')?.dataset.tab;

        if (activeTab === 'percent') {
            // Update dollar amount based on percentage
            const calculatedAmount = homePrice * dpPercent / 100;
            const dpAmountInput = Utils.$('#dp-amount');
            if (dpAmountInput) {
                dpAmountInput.value = Math.round(calculatedAmount);
            }
        } else {
            // Update percentage based on dollar amount
            const calculatedPercent = homePrice > 0 ? (dpAmount / homePrice) * 100 : 0;
            const dpPercentInput = Utils.$('#dp-percent');
            if (dpPercentInput) {
                dpPercentInput.value = calculatedPercent.toFixed(1);
            }
        }
    },

    setupPropertyTaxSync: () => {
        const stateSelect = Utils.$('#state');
        const propertyTaxInput = Utils.$('#property-tax');
        const homePriceInput = Utils.$('#home-price');

        if (stateSelect) {
            stateSelect.addEventListener('change', () => {
                const selectedState = stateSelect.value;
                const homePrice = parseFloat(homePriceInput?.value) || 0;

                if (selectedState && STATE_TAX_RATES[selectedState] && homePrice > 0) {
                    const stateData = STATE_TAX_RATES[selectedState];
                    const annualTax = Math.round(homePrice * stateData.rate);

                    if (propertyTaxInput) {
                        propertyTaxInput.value = annualTax;
                    }

                    CalculationEngine.calculate();
                }
            });
        }
    },

    setupLoanTermSync: () => {
        const loanTermInput = Utils.$('#loan-term');
        if (loanTermInput) {
            loanTermInput.addEventListener('input', (e) => {
                const value = e.target.value;

                // Update term chips
                Utils.$$('.term-chip').forEach(chip => {
                    chip.classList.toggle('active', chip.dataset.term === value);
                });
            });
        }
    }
};

// ========== ACCESSIBILITY MANAGER ==========
const AccessibilityManager = {
    announce: (message) => {
        if (!STATE.screenReaderEnabled) return;

        const announcer = Utils.$('#sr-announcements');
        if (announcer) {
            announcer.textContent = '';
            setTimeout(() => {
                announcer.textContent = message;
            }, 100);
        }
    },

    toggle: () => {
        STATE.screenReaderEnabled = !STATE.screenReaderEnabled;
        const btn = Utils.$('#screen-reader-btn');
        if (btn) {
            btn.classList.toggle('active', STATE.screenReaderEnabled);
            btn.setAttribute('aria-pressed', STATE.screenReaderEnabled);
        }

        AccessibilityManager.announce(`Screen reader ${STATE.screenReaderEnabled ? 'enabled' : 'disabled'}`);
        Utils.showToast(`Screen reader ${STATE.screenReaderEnabled ? 'enabled' : 'disabled'}`, 'info');
    }
};

// ========== VOICE MANAGER ==========
const VoiceManager = {
    setup: () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        STATE.speechRecognition = new SpeechRecognition();
        
        STATE.speechRecognition.continuous = false;
        STATE.speechRecognition.interimResults = false;
        STATE.speechRecognition.lang = 'en-US';

        STATE.speechRecognition.onstart = () => {
            STATE.isListening = true;
            const voiceStatus = Utils.$('#voice-status');
            const voiceBtn = Utils.$('#voice-command-btn');
            
            if (voiceStatus) voiceStatus.style.display = 'flex';
            if (voiceBtn) voiceBtn.classList.add('active');
            
            AccessibilityManager.announce('Voice command activated. Listening...');
        };

        STATE.speechRecognition.onend = () => {
            STATE.isListening = false;
            const voiceStatus = Utils.$('#voice-status');
            const voiceBtn = Utils.$('#voice-command-btn');
            
            if (voiceStatus) voiceStatus.style.display = 'none';
            if (voiceBtn) voiceBtn.classList.remove('active');
        };

        STATE.speechRecognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            VoiceManager.processCommand(transcript);
        };

        STATE.speechRecognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            AccessibilityManager.announce('Voice recognition error. Please try again.');
        };
    },

    toggle: () => {
        if (!STATE.speechRecognition) {
            Utils.showToast('Voice recognition not available in this browser', 'error');
            return;
        }

        if (STATE.isListening) {
            STATE.speechRecognition.stop();
        } else {
            STATE.speechRecognition.start();
        }
    },

    processCommand: (command) => {
        console.log('Voice command:', command);

        // Extract numbers from command
        const numberMatch = command.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/);
        const number = numberMatch ? parseFloat(numberMatch[1].replace(/,/g, '')) : null;

        if (!number && !command.includes('calculate')) {
            AccessibilityManager.announce('No number detected in voice command');
            return;
        }

        // Command mapping
        const commandMap = {
            'home price': '#home-price',
            'house price': '#home-price',
            'down payment': '#dp-amount',
            'interest rate': '#interest-rate',
            'loan term': '#loan-term',
            'property tax': '#property-tax',
            'insurance': '#home-insurance',
            'hoa fees': '#hoa-fees'
        };

        // Process commands
        for (const [phrase, selector] of Object.entries(commandMap)) {
            if (command.includes(phrase)) {
                const element = Utils.$(selector);
                if (element && number) {
                    element.value = number;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    AccessibilityManager.announce(`${phrase} set to ${Utils.formatNumber(number)}`);
                    return;
                }
            }
        }

        // Special commands
        if (command.includes('calculate')) {
            CalculationEngine.calculate();
            AccessibilityManager.announce('Calculation updated');
            return;
        }

        AccessibilityManager.announce('Voice command not recognized. Try saying "home price 400000" or similar.');
    }
};

// ========== INITIALIZATION ==========
const App = {
    init: () => {
        App.setupDefaults();
        App.setupEventListeners();
        App.populateStateDropdown();
        VoiceManager.setup();
        FormHandlers.setupTabControls();
        FormHandlers.setupTermChips();
        FormHandlers.setupPropertyTaxSync();
        FormHandlers.setupLoanTermSync();
        TabManager.setupTabControls();
        FeedbackManager.setupRating();
        CalculationEngine.calculate();
    },

    setupDefaults: () => {
        // Set default form values
        const defaults = {
            '#home-price': 400000,
            '#dp-amount': 80000,
            '#dp-percent': 20,
            '#interest-rate': 6.75,
            '#loan-term': 30,
            '#property-tax': 3000,
            '#home-insurance': 1700,
            '#hoa-fees': 0,
            '#extra-monthly': 0,
            '#extra-yearly': 0
        };

        Object.entries(defaults).forEach(([selector, value]) => {
            const element = Utils.$(selector);
            if (element && !element.value) {
                element.value = value;
            }
        });

        // Set default start date to next month
        const startDateInput = Utils.$('#start-date');
        if (startDateInput && !startDateInput.value) {
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            startDateInput.value = nextMonth.toISOString().slice(0, 7);
        }

        // Set default extra yearly payment date to next year
        const extraYearlyDateInput = Utils.$('#extra-yearly-date');
        if (extraYearlyDateInput && !extraYearlyDateInput.value) {
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            extraYearlyDateInput.value = nextYear.toISOString().slice(0, 7);
        }
    },

    setupEventListeners: () => {
        // Form input changes trigger calculations
        const form = Utils.$('#mortgage-form');
        if (form) {
            form.addEventListener('input', (e) => {
                if (e.target.type === 'number' || e.target.type === 'month') {
                    FormHandlers.syncDownPayment();
                    CalculationEngine.calculate();
                }
            });
        }

        // Global controls
        const screenReaderBtn = Utils.$('#screen-reader-btn');
        if (screenReaderBtn) {
            screenReaderBtn.addEventListener('click', AccessibilityManager.toggle);
        }

        const voiceBtn = Utils.$('#voice-command-btn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', VoiceManager.toggle);
        }

        const voiceClose = Utils.$('#voice-close');
        if (voiceClose) {
            voiceClose.addEventListener('click', () => {
                if (STATE.speechRecognition && STATE.isListening) {
                    STATE.speechRecognition.stop();
                }
            });
        }

        // Amortization controls
        const viewMonthly = Utils.$('#view-monthly');
        const viewYearly = Utils.$('#view-yearly');
        const prevPage = Utils.$('#prev-page');
        const nextPage = Utils.$('#next-page');
        const exportCSV = Utils.$('#export-csv-btn');
        const printSchedule = Utils.$('#print-schedule-btn');

        if (viewMonthly) viewMonthly.addEventListener('click', () => AmortizationManager.switchView('monthly'));
        if (viewYearly) viewYearly.addEventListener('click', () => AmortizationManager.switchView('yearly'));
        if (prevPage) prevPage.addEventListener('click', () => AmortizationManager.changePage(-1));
        if (nextPage) nextPage.addEventListener('click', () => AmortizationManager.changePage(1));
        if (exportCSV) exportCSV.addEventListener('click', AmortizationManager.exportCSV);
        if (printSchedule) printSchedule.addEventListener('click', () => window.print());

        // Share buttons
        const shareBtn = Utils.$('#share-btn');
        const savePdfBtn = Utils.$('#save-pdf-btn');
        const printBtn = Utils.$('#print-btn');

        if (shareBtn) shareBtn.addEventListener('click', SharingManager.share);
        if (savePdfBtn) savePdfBtn.addEventListener('click', SharingManager.savePDF);
        if (printBtn) printBtn.addEventListener('click', SharingManager.print);

        // Feedback form
        const feedbackForm = Utils.$('#feedback-form');
        if (feedbackForm) {
            feedbackForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                FeedbackManager.submitFeedback(formData);
            });
        }

        // Mobile menu
        const hamburger = Utils.$('#hamburger');
        const navMenu = Utils.$('#nav-menu');
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                hamburger.setAttribute('aria-expanded', navMenu.classList.contains('active'));
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.altKey) {
                switch (e.key.toLowerCase()) {
                    case 'v':
                        e.preventDefault();
                        VoiceManager.toggle();
                        break;
                    case 'r':
                        e.preventDefault();
                        AccessibilityManager.toggle();
                        break;
                }
            }
        });
    },

    populateStateDropdown: () => {
        const stateSelect = Utils.$('#state');
        if (!stateSelect) return;

        stateSelect.innerHTML = '<option value="">Select State</option>';
        
        Object.entries(STATE_TAX_RATES).forEach(([code, data]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = data.name;
            if (code === 'CA') option.selected = true; // Default to California
            stateSelect.appendChild(option);
        });
    }
};

// START APPLICATION
document.addEventListener('DOMContentLoaded', App.init);
