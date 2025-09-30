/* ============================================================================
WORLD'S #1 AI-ENHANCED MORTGAGE CALCULATOR - PRODUCTION JAVASCRIPT
Advanced Features: AI Insights, Voice Control, Real-Time Updates
Version: 3.2 Production Ready - ALL User Requirements Implemented
============================================================================ */

(function() {
    'use strict';

    // ========== Global State Management ==========
    class MortgageCalculatorState {
        constructor() {
            this.calculations = {};
            this.savedCalculations = [];
            this.comparisonData = [];
            this.voiceEnabled = false;
            this.chartInstance = null;
            this.amortizationData = [];
            this.currentPage = 1;
            this.itemsPerPage = 12;
            this.recognition = null;
            this.darkMode = this.detectPreferredTheme();
            this.fontScale = 1.0;
            this.screenReaderMode = false;
            this.locationData = null;
            this.extraPaymentFrequency = 'monthly'; // Single frequency toggle
            
            // Market data
            this.marketRates = {
                '30yr': 6.43,
                '15yr': 5.73,
                'arm': 5.90,
                'fha': 6.44
            };
            
            this.currentInputs = {
                homePrice: 400000,
                downPayment: 80000,
                interestRate: 6.43,
                loanTerm: 30,
                propertyTax: 8000,
                homeInsurance: 1500,
                hoaFees: 0,
                extraPayment: 0,
                extraOneTime: 0
            };
        }

        detectPreferredTheme() {
            if (typeof window !== 'undefined' && window.matchMedia) {
                return window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
            return false;
        }

        updateInputs(newInputs) {
            this.currentInputs = { ...this.currentInputs, ...newInputs };
            this.calculate();
        }

        // FIXED: Robust calculation method without NaN errors
        calculate() {
            try {
                const inputs = this.currentInputs;
                
                // Validate inputs
                if (!inputs.homePrice || inputs.homePrice <= 0) {
                    throw new Error('Invalid home price');
                }
                if (!inputs.downPayment || inputs.downPayment < 0) {
                    throw new Error('Invalid down payment');
                }
                if (!inputs.interestRate || inputs.interestRate <= 0) {
                    throw new Error('Invalid interest rate');
                }
                if (!inputs.loanTerm || inputs.loanTerm <= 0) {
                    throw new Error('Invalid loan term');
                }

                const loanAmount = inputs.homePrice - inputs.downPayment;
                if (loanAmount <= 0) {
                    throw new Error('Down payment cannot exceed home price');
                }

                const monthlyRate = inputs.interestRate / 100 / 12;
                const numberOfPayments = inputs.loanTerm * 12;
                
                // Calculate monthly principal and interest
                const monthlyPI = (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) / 
                                (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
                
                if (!isFinite(monthlyPI) || isNaN(monthlyPI)) {
                    throw new Error('Invalid calculation result');
                }

                const monthlyTax = inputs.propertyTax / 12;
                const monthlyInsurance = inputs.homeInsurance / 12;
                const monthlyHOA = inputs.hoaFees;
                
                // PMI calculation (if down payment < 20%)
                const downPaymentPercent = (inputs.downPayment / inputs.homePrice) * 100;
                const monthlyPMI = downPaymentPercent < 20 ? loanAmount * 0.005 / 12 : 0;
                
                const totalMonthlyPayment = monthlyPI + monthlyTax + monthlyInsurance + monthlyHOA + monthlyPMI;
                
                // Calculate totals
                const totalInterest = (monthlyPI * numberOfPayments) - loanAmount;
                const totalCost = inputs.homePrice + totalInterest + (inputs.propertyTax * inputs.loanTerm) + 
                                (inputs.homeInsurance * inputs.loanTerm) + (monthlyHOA * numberOfPayments) + 
                                (monthlyPMI * numberOfPayments);
                
                // Calculate payoff date
                const payoffDate = new Date();
                payoffDate.setMonth(payoffDate.getMonth() + numberOfPayments);
                
                this.calculations = {
                    loanAmount,
                    monthlyPI,
                    monthlyTax,
                    monthlyInsurance,
                    monthlyHOA,
                    monthlyPMI,
                    totalMonthlyPayment,
                    totalInterest,
                    totalCost,
                    payoffDate,
                    downPaymentPercent,
                    numberOfPayments
                };
                
                this.generateAmortizationSchedule();
                this.updateUI();
                
            } catch (error) {
                console.error('Calculation error:', error);
                this.showError('Error performing calculation: ' + error.message);
                // Reset calculations on error
                this.calculations = {};
            }
        }

        generateAmortizationSchedule() {
            const inputs = this.currentInputs;
            const calc = this.calculations;
            
            if (!calc.loanAmount || !calc.monthlyPI) return;
            
            this.amortizationData = [];
            let balance = calc.loanAmount;
            const monthlyRate = inputs.interestRate / 100 / 12;
            
            // Convert extra payment based on frequency
            const monthlyExtraPayment = this.extraPaymentFrequency === 'weekly' ? 
                (inputs.extraPayment * 52) / 12 : inputs.extraPayment;
            
            const startDate = new Date();
            
            for (let paymentNumber = 1; paymentNumber <= calc.numberOfPayments && balance > 0; paymentNumber++) {
                const interestPayment = balance * monthlyRate;
                let principalPayment = calc.monthlyPI - interestPayment;
                
                // Add extra payments
                let extraThisMonth = monthlyExtraPayment;
                if (paymentNumber <= 12 && inputs.extraOneTime > 0) {
                    extraThisMonth += inputs.extraOneTime / 12;
                }
                
                principalPayment += extraThisMonth;
                
                // Ensure we don't overpay
                if (principalPayment > balance) {
                    principalPayment = balance;
                }
                
                balance -= principalPayment;
                
                const paymentDate = new Date(startDate);
                paymentDate.setMonth(paymentDate.getMonth() + paymentNumber - 1);
                
                this.amortizationData.push({
                    paymentNumber,
                    date: paymentDate,
                    payment: calc.monthlyPI + extraThisMonth,
                    principal: principalPayment,
                    interest: interestPayment,
                    balance: Math.max(0, balance)
                });
            }
        }

        updateUI() {
            this.updatePaymentDisplay();
            this.updateSummaryCards();
            this.updateBreakdown();
            this.updateChart();
            this.updateAmortizationTable();
            this.generateAIInsights();
        }

        updatePaymentDisplay() {
            const calc = this.calculations;
            const paymentEl = document.getElementById('total-payment');
            if (paymentEl && calc.totalMonthlyPayment) {
                paymentEl.textContent = this.formatCurrency(calc.totalMonthlyPayment);
                paymentEl.classList.add('animate-count');
                setTimeout(() => paymentEl.classList.remove('animate-count'), 500);
            }
        }

        updateSummaryCards() {
            const calc = this.calculations;
            if (!calc.loanAmount) return;
            
            const updates = [
                { id: 'display-loan-amount', value: calc.loanAmount },
                { id: 'display-total-interest', value: calc.totalInterest },
                { id: 'display-total-cost', value: calc.totalCost },
                { id: 'display-payoff-date', value: this.formatDate(calc.payoffDate) }
            ];
            
            updates.forEach(update => {
                const el = document.getElementById(update.id);
                if (el) {
                    el.textContent = update.id === 'display-payoff-date' ? 
                        update.value : this.formatCurrency(update.value);
                }
            });
        }

        updateBreakdown() {
            const calc = this.calculations;
            if (!calc.totalMonthlyPayment) return;
            
            const breakdownItems = [
                { id: 'principal-interest', fillId: 'pi-fill', value: calc.monthlyPI },
                { id: 'monthly-tax', fillId: 'tax-fill', value: calc.monthlyTax },
                { id: 'monthly-insurance', fillId: 'insurance-fill', value: calc.monthlyInsurance },
                { id: 'monthly-pmi', fillId: 'pmi-fill', value: calc.monthlyPMI }
            ];
            
            breakdownItems.forEach(item => {
                const amountEl = document.getElementById(item.id);
                const fillEl = document.getElementById(item.fillId);
                
                if (amountEl && fillEl) {
                    amountEl.textContent = this.formatCurrency(item.value);
                    const percentage = (item.value / calc.totalMonthlyPayment) * 100;
                    
                    setTimeout(() => {
                        fillEl.style.width = `${percentage}%`;
                    }, 100);
                }
            });
        }

        // FIXED: Properly working chart with year slider
        updateChart() {
            const canvas = document.getElementById('mortgage-chart');
            if (!canvas || !this.amortizationData.length) return;
            
            const ctx = canvas.getContext('2d');
            
            // Destroy existing chart
            if (this.chartInstance) {
                this.chartInstance.destroy();
            }
            
            // Prepare chart data (yearly aggregates)
            const yearlyData = this.aggregateAmortizationByYear();
            
            const labels = yearlyData.map(item => item.year);
            const principalData = yearlyData.map(item => item.principalPaid);
            const interestData = yearlyData.map(item => item.interestPaid);
            const balanceData = yearlyData.map(item => item.balance);
            
            this.chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Principal Paid',
                        data: principalData,
                        borderColor: 'rgba(34, 197, 94, 1)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        fill: false,
                        tension: 0.2
                    }, {
                        label: 'Interest Paid',
                        data: interestData,
                        borderColor: 'rgba(251, 191, 36, 1)',
                        backgroundColor: 'rgba(251, 191, 36, 0.1)',
                        fill: false,
                        tension: 0.2
                    }, {
                        label: 'Remaining Balance',
                        data: balanceData,
                        borderColor: 'rgba(59, 130, 246, 1)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: false,
                        tension: 0.2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Year'
                            },
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            }
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Amount ($)'
                            },
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
            
            // Update chart subtitle
            const subtitleEl = document.getElementById('chart-loan-amount');
            if (subtitleEl && this.calculations.loanAmount) {
                subtitleEl.textContent = `Based on a ${this.formatCurrency(this.calculations.loanAmount)} mortgage`;
            }
            
            // Initialize year slider
            this.initializeYearSlider(yearlyData);
        }

        aggregateAmortizationByYear() {
            const yearlyMap = new Map();
            let cumulativePrincipal = 0;
            let cumulativeInterest = 0;
            
            this.amortizationData.forEach(payment => {
                const year = Math.ceil(payment.paymentNumber / 12);
                
                if (!yearlyMap.has(year)) {
                    yearlyMap.set(year, {
                        year,
                        principalPaid: 0,
                        interestPaid: 0,
                        balance: payment.balance
                    });
                }
                
                const yearData = yearlyMap.get(year);
                cumulativePrincipal += payment.principal;
                cumulativeInterest += payment.interest;
                
                yearData.principalPaid = cumulativePrincipal;
                yearData.interestPaid = cumulativeInterest;
                yearData.balance = payment.balance;
            });
            
            return Array.from(yearlyMap.values()).sort((a, b) => a.year - b.year);
        }

        initializeYearSlider(yearlyData) {
            const slider = document.getElementById('year-slider');
            const display = document.getElementById('year-display');
            
            if (!slider || !display || !yearlyData.length) return;
            
            slider.min = '1';
            slider.max = yearlyData.length.toString();
            slider.value = Math.min(15, yearlyData.length).toString();
            
            const updateSliderValues = () => {
                const yearIndex = parseInt(slider.value) - 1;
                const yearData = yearlyData[yearIndex];
                
                if (yearData) {
                    display.textContent = `Year ${yearData.year}`;
                    
                    // Update legend values
                    this.updateChartLegend(yearData);
                }
            };
            
            slider.addEventListener('input', updateSliderValues);
            updateSliderValues();
        }

        updateChartLegend(yearData) {
            const legendElements = [
                { id: 'legend-principal', value: yearData.principalPaid },
                { id: 'legend-interest', value: yearData.interestPaid },
                { id: 'legend-balance', value: yearData.balance }
            ];
            
            legendElements.forEach(item => {
                const el = document.getElementById(item.id);
                if (el) {
                    el.textContent = this.formatCurrency(item.value);
                }
            });
        }

        updateAmortizationTable() {
            const tableBody = document.getElementById('amortization-body');
            if (!tableBody || !this.amortizationData.length) return;
            
            const viewSelect = document.getElementById('amortization-view');
            const isYearlyView = viewSelect && viewSelect.value === 'yearly';
            
            let displayData = this.amortizationData;
            
            if (isYearlyView) {
                displayData = this.getYearlyAmortizationData();
            }
            
            // Pagination
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            const pageData = displayData.slice(startIndex, endIndex);
            
            // Clear table
            tableBody.innerHTML = '';
            
            // Add rows
            pageData.forEach((payment, index) => {
                const row = tableBody.insertRow();
                row.innerHTML = `
                    <td>${isYearlyView ? `Year ${payment.year}` : payment.paymentNumber}</td>
                    <td>${this.formatDate(payment.date)}</td>
                    <td>${this.formatCurrency(payment.payment)}</td>
                    <td>${this.formatCurrency(payment.principal)}</td>
                    <td>${this.formatCurrency(payment.interest)}</td>
                    <td>${this.formatCurrency(payment.balance)}</td>
                `;
                
                // Add alternating row colors
                if (index % 2 === 0) {
                    row.style.backgroundColor = 'var(--color-gray-50)';
                }
            });
            
            // Update pagination
            this.updateAmortizationPagination(displayData.length);
        }

        getYearlyAmortizationData() {
            const yearlyData = [];
            let currentYear = null;
            let yearlyPayment = 0;
            let yearlyPrincipal = 0;
            let yearlyInterest = 0;
            let lastBalance = 0;
            let yearStartDate = null;
            
            this.amortizationData.forEach(payment => {
                const paymentYear = Math.ceil(payment.paymentNumber / 12);
                
                if (currentYear !== paymentYear) {
                    if (currentYear !== null) {
                        yearlyData.push({
                            year: currentYear,
                            date: yearStartDate,
                            payment: yearlyPayment,
                            principal: yearlyPrincipal,
                            interest: yearlyInterest,
                            balance: lastBalance
                        });
                    }
                    
                    currentYear = paymentYear;
                    yearlyPayment = 0;
                    yearlyPrincipal = 0;
                    yearlyInterest = 0;
                    yearStartDate = payment.date;
                }
                
                yearlyPayment += payment.payment;
                yearlyPrincipal += payment.principal;
                yearlyInterest += payment.interest;
                lastBalance = payment.balance;
            });
            
            // Add the last year
            if (currentYear !== null) {
                yearlyData.push({
                    year: currentYear,
                    date: yearStartDate,
                    payment: yearlyPayment,
                    principal: yearlyPrincipal,
                    interest: yearlyInterest,
                    balance: lastBalance
                });
            }
            
            return yearlyData;
        }

        updateAmortizationPagination(totalItems) {
            const totalPages = Math.ceil(totalItems / this.itemsPerPage);
            const paginationInfo = document.getElementById('pagination-info');
            const prevBtn = document.getElementById('prev-page');
            const nextBtn = document.getElementById('next-page');
            
            if (paginationInfo) {
                paginationInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
            }
            
            if (prevBtn) {
                prevBtn.disabled = this.currentPage <= 1;
            }
            
            if (nextBtn) {
                nextBtn.disabled = this.currentPage >= totalPages;
            }
        }

        // Enhanced AI Insights Generator
        generateAIInsights() {
            const calc = this.calculations;
            const inputs = this.currentInputs;
            
            if (!calc.loanAmount) return;
            
            const insights = [];
            
            // Down Payment Insight
            if (calc.downPaymentPercent >= 20) {
                insights.push({
                    type: 'success',
                    title: 'Excellent Down Payment!',
                    content: `Your ${calc.downPaymentPercent.toFixed(1)}% down payment eliminates PMI, saving you ${this.formatCurrency(calc.monthlyPMI * calc.numberOfPayments)} over the life of the loan.`
                });
            } else {
                insights.push({
                    type: 'warning',
                    title: 'Consider Increasing Down Payment',
                    content: `Your ${calc.downPaymentPercent.toFixed(1)}% down payment requires PMI of ${this.formatCurrency(calc.monthlyPMI)}/month. Increasing to 20% could save you money.`
                });
            }
            
            // Interest Rate Insight
            const avgRate = this.marketRates['30yr'];
            if (inputs.interestRate < avgRate) {
                insights.push({
                    type: 'success',
                    title: 'Great Interest Rate!',
                    content: `Your ${inputs.interestRate}% rate is ${(avgRate - inputs.interestRate).toFixed(2)}% below the national average of ${avgRate}%.`
                });
            } else if (inputs.interestRate > avgRate + 0.5) {
                insights.push({
                    type: 'info',
                    title: 'Rate Shopping Opportunity',
                    content: `Your current rate is above market average. Shopping with multiple lenders could potentially save you 0.25-0.5%.`
                });
            }
            
            // Extra Payment Insight
            if (inputs.extraPayment > 0) {
                const regularPayoffMonths = calc.numberOfPayments;
                const extraPayoffMonths = this.amortizationData.length;
                const monthsSaved = regularPayoffMonths - extraPayoffMonths;
                const yearsSaved = Math.floor(monthsSaved / 12);
                
                if (yearsSaved > 0) {
                    insights.push({
                        type: 'success',
                        title: 'Extra Payments Pay Off!',
                        content: `Your extra ${this.formatCurrency(inputs.extraPayment)}/${this.extraPaymentFrequency} payment will save you ${yearsSaved} years and thousands in interest.`
                    });
                }
            } else {
                const extraAmount = Math.max(100, calc.monthlyPI * 0.1);
                insights.push({
                    type: 'info',
                    title: 'Consider Extra Payments',
                    content: `Adding just ${this.formatCurrency(extraAmount)}/month extra could save you years of payments and tens of thousands in interest.`
                });
            }
            
            // Loan Term Insight
            if (inputs.loanTerm === 30) {
                const rate15 = this.marketRates['15yr'];
                const savings15yr = this.calculate15YearSavings(calc.loanAmount, rate15);
                if (savings15yr > 0) {
                    insights.push({
                        type: 'info',
                        title: '15-Year Loan Consideration',
                        content: `A 15-year loan at ${rate15}% could save you over ${this.formatCurrency(savings15yr)} in interest, though payments would be higher.`
                    });
                }
            }
            
            // Total Interest Insight
            const interestPercent = (calc.totalInterest / calc.loanAmount) * 100;
            if (interestPercent > 50) {
                insights.push({
                    type: 'warning',
                    title: 'High Total Interest',
                    content: `You'll pay ${interestPercent.toFixed(0)}% of your loan amount in interest. Consider a shorter term or extra payments to reduce this.`
                });
            }
            
            this.displayInsights(insights);
        }

        calculate15YearSavings(loanAmount, rate15) {
            const monthlyRate15 = rate15 / 100 / 12;
            const payments15 = 15 * 12;
            
            const monthlyPI15 = (loanAmount * (monthlyRate15 * Math.pow(1 + monthlyRate15, payments15))) / 
                               (Math.pow(1 + monthlyRate15, payments15) - 1);
            
            const totalInterest15 = (monthlyPI15 * payments15) - loanAmount;
            
            return this.calculations.totalInterest - totalInterest15;
        }

        displayInsights(insights) {
            const container = document.getElementById('ai-insights');
            if (!container) return;
            
            container.innerHTML = '';
            
            insights.forEach((insight, index) => {
                const insightEl = document.createElement('div');
                insightEl.className = `insight-item insight-${insight.type}`;
                insightEl.style.animationDelay = `${index * 0.1}s`;
                
                insightEl.innerHTML = `
                    <h4 class="insight-title">${insight.title}</h4>
                    <p class="insight-content">${insight.content}</p>
                `;
                
                container.appendChild(insightEl);
            });
        }

        // Utility Methods
        formatCurrency(amount) {
            if (typeof amount !== 'number' || !isFinite(amount)) return '$0';
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(Math.round(amount));
        }

        formatDate(date) {
            if (!(date instanceof Date) || isNaN(date)) return '-';
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short'
            });
        }

        showError(message) {
            this.showToast(message, 'error');
        }

        showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            if (!container) return;
            
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.textContent = message;
            
            container.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 5000);
        }
    }

    // ========== Initialize Application ==========
    const app = new MortgageCalculatorState();
    
    // ========== Event Listeners ==========
    document.addEventListener('DOMContentLoaded', function() {
        initializeFormHandlers();
        initializeTabHandlers();
        initializeAccessibilityControls();
        initializeVoiceControl();
        initializeShareHandlers();
        initializeAmortizationHandlers();
        initializeExtraPaymentFrequency();
        
        // Initial calculation
        app.calculate();
    });

    function initializeFormHandlers() {
        const form = document.getElementById('mortgage-form');
        if (!form) return;
        
        // Form submission
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            collectInputsAndCalculate();
        });
        
        // Real-time input updates
        const inputs = form.querySelectorAll('input[type="text"]');
        inputs.forEach(input => {
            input.addEventListener('input', debounce(handleInputChange, 300));
            input.addEventListener('focus', selectInputText);
        });
        
        // Term selector
        const termButtons = document.querySelectorAll('.term-chip');
        termButtons.forEach(button => {
            button.addEventListener('click', function() {
                termButtons.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-checked', 'false');
                });
                this.classList.add('active');
                this.setAttribute('aria-checked', 'true');
                
                app.currentInputs.loanTerm = parseInt(this.dataset.term);
                app.calculate();
            });
        });
        
        // Collapsible sections
        const toggles = document.querySelectorAll('.collapsible-toggle');
        toggles.forEach(toggle => {
            toggle.addEventListener('click', function() {
                const content = document.getElementById(this.getAttribute('aria-controls'));
                const isExpanded = this.getAttribute('aria-expanded') === 'true';
                
                this.setAttribute('aria-expanded', !isExpanded);
                if (content) {
                    content.classList.toggle('active', !isExpanded);
                }
            });
        });
        
        // Reset button
        const resetBtn = document.getElementById('reset-form');
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to reset all inputs?')) {
                    form.reset();
                    app.currentInputs = {
                        homePrice: 400000,
                        downPayment: 80000,
                        interestRate: 6.43,
                        loanTerm: 30,
                        propertyTax: 8000,
                        homeInsurance: 1500,
                        hoaFees: 0,
                        extraPayment: 0,
                        extraOneTime: 0
                    };
                    app.extraPaymentFrequency = 'monthly';
                    populateFormFromState();
                    app.calculate();
                    app.showToast('Form reset successfully', 'success');
                }
            });
        }
    }

    // FIXED: Extra payment frequency toggle
    function initializeExtraPaymentFrequency() {
        const frequencyButtons = document.querySelectorAll('.frequency-btn');
        const extraPaymentLabel = document.getElementById('extra-payment-label');
        
        frequencyButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Update button states
                frequencyButtons.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-checked', 'false');
                });
                this.classList.add('active');
                this.setAttribute('aria-checked', 'true');
                
                // Update frequency
                app.extraPaymentFrequency = this.dataset.frequency;
                
                // Update label text
                if (extraPaymentLabel) {
                    extraPaymentLabel.textContent = app.extraPaymentFrequency === 'weekly' ? 
                        'Extra Weekly Payment' : 'Extra Monthly Payment';
                }
                
                // Recalculate
                app.calculate();
                app.showToast(`Switched to ${app.extraPaymentFrequency} extra payments`, 'info');
            });
        });
    }

    function handleInputChange(e) {
        const field = e.target;
        const value = parseFloat(field.value.replace(/[,$]/g, '')) || 0;
        
        // Map field names to state properties
        const fieldMap = {
            'home-price': 'homePrice',
            'down-payment': 'downPayment',
            'interest-rate': 'interestRate',
            'property-tax': 'propertyTax',
            'home-insurance': 'homeInsurance',
            'hoa-fees': 'hoaFees',
            'extra-payment': 'extraPayment',
            'extra-onetime': 'extraOneTime'
        };
        
        const stateField = fieldMap[field.id];
        if (stateField) {
            app.currentInputs[stateField] = value;
            app.calculate();
        }
    }

    function collectInputsAndCalculate() {
        const inputs = {
            homePrice: parseFloat(document.getElementById('home-price').value.replace(/[,$]/g, '')) || 0,
            downPayment: parseFloat(document.getElementById('down-payment').value.replace(/[,$]/g, '')) || 0,
            interestRate: parseFloat(document.getElementById('interest-rate').value) || 0,
            loanTerm: parseInt(document.querySelector('.term-chip.active')?.dataset.term) || 30,
            propertyTax: parseFloat(document.getElementById('property-tax').value.replace(/[,$]/g, '')) || 0,
            homeInsurance: parseFloat(document.getElementById('home-insurance').value.replace(/[,$]/g, '')) || 0,
            hoaFees: parseFloat(document.getElementById('hoa-fees').value.replace(/[,$]/g, '')) || 0,
            extraPayment: parseFloat(document.getElementById('extra-payment').value.replace(/[,$]/g, '')) || 0,
            extraOneTime: parseFloat(document.getElementById('extra-onetime').value.replace(/[,$]/g, '')) || 0
        };
        
        app.updateInputs(inputs);
    }

    function populateFormFromState() {
        const inputs = app.currentInputs;
        
        document.getElementById('home-price').value = inputs.homePrice.toLocaleString();
        document.getElementById('down-payment').value = inputs.downPayment.toLocaleString();
        document.getElementById('interest-rate').value = inputs.interestRate;
        document.getElementById('property-tax').value = inputs.propertyTax.toLocaleString();
        document.getElementById('home-insurance').value = inputs.homeInsurance.toLocaleString();
        document.getElementById('hoa-fees').value = inputs.hoaFees.toLocaleString();
        document.getElementById('extra-payment').value = inputs.extraPayment.toLocaleString();
        document.getElementById('extra-onetime').value = inputs.extraOneTime.toLocaleString();
        
        // Update term selector
        document.querySelectorAll('.term-chip').forEach(chip => {
            const isActive = parseInt(chip.dataset.term) === inputs.loanTerm;
            chip.classList.toggle('active', isActive);
            chip.setAttribute('aria-checked', isActive);
        });
    }

    function selectInputText(e) {
        setTimeout(() => e.target.select(), 10);
    }

    function initializeTabHandlers() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetTab = this.dataset.tab;
                
                // Update button states
                tabButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-selected', 'false');
                });
                this.classList.add('active');
                this.setAttribute('aria-selected', 'true');
                
                // Update content visibility
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });
                
                const targetContent = document.getElementById(targetTab + '-panel');
                if (targetContent) {
                    targetContent.classList.add('active');
                }
                
                // Trigger specific actions for certain tabs
                if (targetTab === 'mortgage-chart' && app.chartInstance) {
                    setTimeout(() => app.chartInstance.resize(), 100);
                }
                
                // Update screen reader announcement
                announceToScreenReader(`Switched to ${this.textContent.trim()} tab`);
            });
        });
    }

    function initializeAccessibilityControls() {
        // Font size controls
        document.getElementById('font-decrease')?.addEventListener('click', () => adjustFontSize(-0.1));
        document.getElementById('font-increase')?.addEventListener('click', () => adjustFontSize(0.1));
        document.getElementById('font-reset')?.addEventListener('click', () => setFontSize(1.0));
        
        // Theme toggle
        document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
        
        // Set initial theme
        if (app.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    function adjustFontSize(delta) {
        app.fontScale = Math.max(0.8, Math.min(1.5, app.fontScale + delta));
        setFontSize(app.fontScale);
    }

    function setFontSize(scale) {
        app.fontScale = scale;
        document.body.className = document.body.className.replace(/font-scale-\d+/g, '');
        document.body.classList.add(`font-scale-${Math.round(scale * 100)}`);
        
        announceToScreenReader(`Font size set to ${Math.round(scale * 100)}%`);
    }

    function toggleTheme() {
        app.darkMode = !app.darkMode;
        const theme = app.darkMode ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        
        const button = document.getElementById('theme-toggle');
        if (button) {
            button.setAttribute('aria-pressed', app.darkMode);
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = app.darkMode ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
        
        announceToScreenReader(`Switched to ${theme} theme`);
    }

    function initializeVoiceControl() {
        const voiceToggle = document.getElementById('voice-toggle');
        if (!voiceToggle) return;
        
        voiceToggle.addEventListener('click', toggleVoiceControl);
        
        // Check for speech recognition support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            voiceToggle.style.display = 'none';
            return;
        }
    }

    function toggleVoiceControl() {
        app.voiceEnabled = !app.voiceEnabled;
        const button = document.getElementById('voice-toggle');
        
        if (button) {
            button.setAttribute('aria-pressed', app.voiceEnabled);
            button.classList.toggle('active', app.voiceEnabled);
        }
        
        if (app.voiceEnabled) {
            startVoiceRecognition();
            app.showToast('Voice control activated. Try saying "Calculate payment" or "Reset form"', 'success');
        } else {
            stopVoiceRecognition();
            app.showToast('Voice control deactivated', 'info');
        }
    }

    function startVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        
        app.recognition = new SpeechRecognition();
        app.recognition.continuous = true;
        app.recognition.interimResults = false;
        
        app.recognition.onresult = function(event) {
            const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            processVoiceCommand(command);
        };
        
        app.recognition.onerror = function(event) {
            console.warn('Voice recognition error:', event.error);
        };
        
        app.recognition.start();
    }

    function stopVoiceRecognition() {
        if (app.recognition) {
            app.recognition.stop();
            app.recognition = null;
        }
    }

    function processVoiceCommand(command) {
        const voiceStatus = document.getElementById('voice-status');
        const voiceText = document.getElementById('voice-text');
        
        // Show voice status
        if (voiceStatus && voiceText) {
            voiceText.textContent = `Heard: "${command}"`;
            voiceStatus.classList.add('active');
            setTimeout(() => voiceStatus.classList.remove('active'), 3000);
        }
        
        if (command.includes('calculate') || command.includes('compute')) {
            app.calculate();
            app.showToast('Calculation updated via voice command', 'success');
        } else if (command.includes('reset')) {
            document.getElementById('reset-form')?.click();
        } else if (command.includes('share')) {
            document.getElementById('share-results')?.click();
        } else if (command.includes('print')) {
            document.getElementById('print-results')?.click();
        } else {
            app.showToast('Command not recognized. Try "calculate payment" or "reset form"', 'warning');
        }
    }

    // FIXED: Universal sharing functions that actually work
    function initializeShareHandlers() {
        document.getElementById('share-results')?.addEventListener('click', shareResults);
        document.getElementById('download-pdf')?.addEventListener('click', downloadPDF);
        document.getElementById('print-results')?.addEventListener('click', printResults);
        document.getElementById('save-results')?.addEventListener('click', saveResults);
        document.getElementById('compare-results')?.addEventListener('click', compareResults);
    }

    async function shareResults() {
        const calc = app.calculations;
        if (!calc.totalMonthlyPayment) {
            app.showToast('Please calculate mortgage first', 'warning');
            return;
        }
        
        const shareData = {
            title: 'Mortgage Calculator Results',
            text: `Monthly Payment: ${app.formatCurrency(calc.totalMonthlyPayment)}\nLoan Amount: ${app.formatCurrency(calc.loanAmount)}\nTotal Interest: ${app.formatCurrency(calc.totalInterest)}`,
            url: window.location.href
        };
        
        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                app.showToast('Results shared successfully', 'success');
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(shareData.text + '\n' + shareData.url);
                app.showToast('Results copied to clipboard', 'success');
            }
        } catch (error) {
            console.error('Share failed:', error);
            app.showToast('Share failed. Results copied to clipboard.', 'warning');
        }
    }

    function downloadPDF() {
        const calc = app.calculations;
        if (!calc.totalMonthlyPayment) {
            app.showToast('Please calculate mortgage first', 'warning');
            return;
        }
        
        try {
            const { jsPDF } = window.jspdf;
            if (!jsPDF) {
                app.showToast('PDF library not loaded', 'error');
                return;
            }
            
            const doc = new jsPDF();
            
            // Title
            doc.setFontSize(20);
            doc.text('Mortgage Calculator Results', 20, 30);
            
            // Basic info
            doc.setFontSize(12);
            let yPosition = 50;
            
            const results = [
                ['Home Price:', app.formatCurrency(app.currentInputs.homePrice)],
                ['Down Payment:', app.formatCurrency(app.currentInputs.downPayment) + ` (${calc.downPaymentPercent.toFixed(1)}%)`],
                ['Loan Amount:', app.formatCurrency(calc.loanAmount)],
                ['Interest Rate:', app.currentInputs.interestRate + '%'],
                ['Loan Term:', app.currentInputs.loanTerm + ' years'],
                ['', ''],
                ['Monthly Payment Breakdown:', ''],
                ['Principal & Interest:', app.formatCurrency(calc.monthlyPI)],
                ['Property Tax:', app.formatCurrency(calc.monthlyTax)],
                ['Home Insurance:', app.formatCurrency(calc.monthlyInsurance)],
                ['PMI:', app.formatCurrency(calc.monthlyPMI)],
                ['HOA Fees:', app.formatCurrency(calc.monthlyHOA)],
                ['', ''],
                ['Total Monthly Payment:', app.formatCurrency(calc.totalMonthlyPayment)],
                ['Total Interest Paid:', app.formatCurrency(calc.totalInterest)],
                ['Total Cost:', app.formatCurrency(calc.totalCost)],
                ['Payoff Date:', app.formatDate(calc.payoffDate)]
            ];
            
            results.forEach(([label, value]) => {
                if (label && value) {
                    doc.text(label, 20, yPosition);
                    doc.text(value, 120, yPosition);
                }
                yPosition += 10;
            });
            
            // Footer
            doc.setFontSize(10);
            doc.text(`Generated on ${new Date().toLocaleDateString()} by FinGuid Mortgage Calculator`, 20, 280);
            
            doc.save('mortgage-calculation.pdf');
            app.showToast('PDF downloaded successfully', 'success');
            
        } catch (error) {
            console.error('PDF generation failed:', error);
            app.showToast('PDF download failed', 'error');
        }
    }

    function printResults() {
        const calc = app.calculations;
        if (!calc.totalMonthlyPayment) {
            app.showToast('Please calculate mortgage first', 'warning');
            return;
        }
        
        try {
            window.print();
            app.showToast('Print dialog opened', 'success');
        } catch (error) {
            app.showToast('Print failed', 'error');
        }
    }

    function saveResults() {
        const calc = app.calculations;
        if (!calc.totalMonthlyPayment) {
            app.showToast('Please calculate mortgage first', 'warning');
            return;
        }
        
        try {
            const savedCalculation = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                inputs: { ...app.currentInputs },
                results: { ...calc },
                frequency: app.extraPaymentFrequency
            };
            
            let savedCalcs = JSON.parse(localStorage.getItem('mortgageCalculations') || '[]');
            savedCalcs.unshift(savedCalculation);
            
            // Keep only last 10 calculations
            savedCalcs = savedCalcs.slice(0, 10);
            
            localStorage.setItem('mortgageCalculations', JSON.stringify(savedCalcs));
            app.savedCalculations = savedCalcs;
            
            app.showToast('Results saved for comparison', 'success');
        } catch (error) {
            console.error('Save failed:', error);
            app.showToast('Save failed', 'error');
        }
    }

    function compareResults() {
        try {
            const savedCalcs = JSON.parse(localStorage.getItem('mortgageCalculations') || '[]');
            
            if (savedCalcs.length === 0) {
                app.showToast('No saved calculations to compare', 'warning');
                return;
            }
            
            // Create comparison modal
            createComparisonModal(savedCalcs);
            app.showToast('Comparison view opened', 'success');
            
        } catch (error) {
            console.error('Comparison failed:', error);
            app.showToast('Comparison failed', 'error');
        }
    }

    function createComparisonModal(savedCalcs) {
        // Remove existing modal
        const existingModal = document.getElementById('comparison-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'comparison-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            width: 100%;
        `;
        
        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; font-size: 1.5rem;">Saved Calculations Comparison</h3>
                <button id="close-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
            <div id="comparison-content"></div>
        `;
        
        const comparisonContent = modalContent.querySelector('#comparison-content');
        
        const table = document.createElement('table');
        table.style.cssText = 'width: 100%; border-collapse: collapse; font-size: 0.9rem;';
        
        table.innerHTML = `
            <thead>
                <tr style="background: #f3f4f6;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Date</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Loan Amount</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Monthly Payment</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total Interest</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${savedCalcs.map((calc, index) => `
                    <tr style="border-bottom: 1px solid #e5e7eb; ${index % 2 === 0 ? 'background: #f9fafb;' : ''}">
                        <td style="padding: 12px;">${new Date(calc.timestamp).toLocaleDateString()}</td>
                        <td style="padding: 12px; text-align: right;">${app.formatCurrency(calc.results.loanAmount)}</td>
                        <td style="padding: 12px; text-align: right;">${app.formatCurrency(calc.results.totalMonthlyPayment)}</td>
                        <td style="padding: 12px; text-align: right;">${app.formatCurrency(calc.results.totalInterest)}</td>
                        <td style="padding: 12px; text-align: center;">
                            <button onclick="loadSavedCalculation(${index})" style="padding: 4px 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 4px;">Load</button>
                            <button onclick="deleteSavedCalculation(${index})" style="padding: 4px 8px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        
        comparisonContent.appendChild(table);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Event listeners
        document.getElementById('close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // Make functions globally available
        window.loadSavedCalculation = (index) => {
            const calc = savedCalcs[index];
            app.currentInputs = { ...calc.inputs };
            app.extraPaymentFrequency = calc.frequency || 'monthly';
            populateFormFromState();
            app.calculate();
            modal.remove();
            app.showToast('Calculation loaded successfully', 'success');
        };
        
        window.deleteSavedCalculation = (index) => {
            if (confirm('Delete this saved calculation?')) {
                savedCalcs.splice(index, 1);
                localStorage.setItem('mortgageCalculations', JSON.stringify(savedCalcs));
                modal.remove();
                createComparisonModal(savedCalcs);
                app.showToast('Calculation deleted', 'success');
            }
        };
    }

    function initializeAmortizationHandlers() {
        // View selector
        document.getElementById('amortization-view')?.addEventListener('change', function() {
            app.updateAmortizationTable();
        });
        
        // Pagination
        document.getElementById('prev-page')?.addEventListener('click', function() {
            if (app.currentPage > 1) {
                app.currentPage--;
                app.updateAmortizationTable();
            }
        });
        
        document.getElementById('next-page')?.addEventListener('click', function() {
            const viewSelect = document.getElementById('amortization-view');
            const displayData = viewSelect?.value === 'yearly' ? 
                app.getYearlyAmortizationData() : app.amortizationData;
            const totalPages = Math.ceil(displayData.length / app.itemsPerPage);
            
            if (app.currentPage < totalPages) {
                app.currentPage++;
                app.updateAmortizationTable();
            }
        });
    }

    // Utility Functions
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function announceToScreenReader(message) {
        const announcer = document.getElementById('sr-announcements');
        if (announcer) {
            announcer.textContent = message;
        }
    }

    // Keyboard Navigation
    document.addEventListener('keydown', function(e) {
        // Escape key closes modals
        if (e.key === 'Escape') {
            const modal = document.getElementById('comparison-modal');
            if (modal) modal.remove();
        }
        
        // Ctrl+Enter to calculate
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            app.calculate();
        }
        
        // Ctrl+R to reset (prevent page reload)
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            document.getElementById('reset-form')?.click();
        }
    });

    // Auto-save inputs to localStorage
    setInterval(() => {
        try {
            localStorage.setItem('mortgageInputs', JSON.stringify(app.currentInputs));
            localStorage.setItem('mortgageFrequency', app.extraPaymentFrequency);
        } catch (error) {
            // Ignore localStorage errors
        }
    }, 5000);

    // Load saved inputs on page load
    try {
        const savedInputs = localStorage.getItem('mortgageInputs');
        const savedFrequency = localStorage.getItem('mortgageFrequency');
        
        if (savedInputs) {
            app.currentInputs = { ...app.currentInputs, ...JSON.parse(savedInputs) };
        }
        
        if (savedFrequency) {
            app.extraPaymentFrequency = savedFrequency;
        }
    } catch (error) {
        // Ignore localStorage errors
    }

    // Expose app globally for debugging
    window.mortgageApp = app;
    
})();
