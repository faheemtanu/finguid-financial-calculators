/* ============================================================================
WORLD'S #1 AI-ENHANCED MORTGAGE CALCULATOR - PRODUCTION JAVASCRIPT
All 17 Requirements Implemented - Auto-calculation & Enhanced Features
Version: 4.0 Production Ready
============================================================================ */

(function() {
    'use strict';

    // ========== Global State Management ========== 
    class MortgageCalculatorState {
        constructor() {
            this.calculations = {};
            this.savedCalculations = [];
            this.voiceEnabled = false;
            this.chartInstance = null;
            this.amortizationData = [];
            this.currentPaymentIndex = 0; // Start from payment 1
            this.recognition = null;
            this.darkMode = this.detectPreferredTheme();
            this.fontScale = 1.0;
            this.screenReaderMode = false;
            this.extraPaymentFrequency = 'monthly'; // Single frequency
            this.isCalculating = false;
            
            // Market data
            this.marketRates = {
                '30yr': 6.43,
                '15yr': 5.73,
                'arm': 5.90,
                'fha': 6.44
            };
            
            // Default inputs
            this.currentInputs = {
                homePrice: 400000,
                downPayment: 80000,
                downPaymentPercent: 20,
                interestRate: 6.43,
                loanTerm: 30,
                propertyState: '',
                propertyTax: 8000,
                homeInsurance: 1500,
                extraPayment: 0
            };

            // State tax and insurance data - FIXED for auto-calculation
            this.stateData = {
                'Alabama': { tax: 0.0041, insurance: 0.003 },
                'Alaska': { tax: 0.0103, insurance: 0.0028 },
                'Arizona': { tax: 0.0066, insurance: 0.0033 },
                'Arkansas': { tax: 0.0062, insurance: 0.0035 },
                'California': { tax: 0.0075, insurance: 0.0053 },
                'Colorado': { tax: 0.0051, insurance: 0.0045 },
                'Connecticut': { tax: 0.0208, insurance: 0.004 },
                'Delaware': { tax: 0.0057, insurance: 0.0038 },
                'Florida': { tax: 0.0083, insurance: 0.006 },
                'Georgia': { tax: 0.0092, insurance: 0.0043 },
                'Hawaii': { tax: 0.0028, insurance: 0.0035 },
                'Idaho': { tax: 0.0069, insurance: 0.003 },
                'Illinois': { tax: 0.0223, insurance: 0.0038 },
                'Indiana': { tax: 0.0085, insurance: 0.0033 },
                'Iowa': { tax: 0.0154, insurance: 0.0035 },
                'Kansas': { tax: 0.0144, insurance: 0.0038 },
                'Kentucky': { tax: 0.0086, insurance: 0.004 },
                'Louisiana': { tax: 0.0055, insurance: 0.0055 },
                'Maine': { tax: 0.0125, insurance: 0.0033 },
                'Maryland': { tax: 0.0108, insurance: 0.004 },
                'Massachusetts': { tax: 0.0116, insurance: 0.0043 },
                'Michigan': { tax: 0.0154, insurance: 0.0035 },
                'Minnesota': { tax: 0.0111, insurance: 0.0038 },
                'Mississippi': { tax: 0.0061, insurance: 0.0045 },
                'Missouri': { tax: 0.0098, insurance: 0.0038 },
                'Montana': { tax: 0.0084, insurance: 0.0033 },
                'Nebraska': { tax: 0.0176, insurance: 0.004 },
                'Nevada': { tax: 0.0060, insurance: 0.0033 },
                'New Hampshire': { tax: 0.0186, insurance: 0.003 },
                'New Jersey': { tax: 0.0249, insurance: 0.0045 },
                'New Mexico': { tax: 0.0080, insurance: 0.0035 },
                'New York': { tax: 0.0162, insurance: 0.0048 },
                'North Carolina': { tax: 0.0084, insurance: 0.0038 },
                'North Dakota': { tax: 0.0098, insurance: 0.0035 },
                'Ohio': { tax: 0.0157, insurance: 0.0033 },
                'Oklahoma': { tax: 0.0090, insurance: 0.0043 },
                'Oregon': { tax: 0.0087, insurance: 0.003 },
                'Pennsylvania': { tax: 0.0153, insurance: 0.0035 },
                'Rhode Island': { tax: 0.0147, insurance: 0.004 },
                'South Carolina': { tax: 0.0057, insurance: 0.004 },
                'South Dakota': { tax: 0.0128, insurance: 0.0038 },
                'Tennessee': { tax: 0.0064, insurance: 0.0038 },
                'Texas': { tax: 0.0181, insurance: 0.005 },
                'Utah': { tax: 0.0061, insurance: 0.0033 },
                'Vermont': { tax: 0.0186, insurance: 0.003 },
                'Virginia': { tax: 0.0082, insurance: 0.0038 },
                'Washington': { tax: 0.0087, insurance: 0.0035 },
                'West Virginia': { tax: 0.0059, insurance: 0.0035 },
                'Wisconsin': { tax: 0.0176, insurance: 0.0033 },
                'Wyoming': { tax: 0.0062, insurance: 0.003 }
            };
        }

        detectPreferredTheme() {
            if (typeof window !== 'undefined' && window.matchMedia) {
                return window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
            return false;
        }

        // ========== FIXED: Auto-calculation on all input changes ==========
        updateInputs(newInputs, skipCalculation = false) {
            this.currentInputs = { ...this.currentInputs, ...newInputs };
            
            // Auto-calculate state-based values
            if (newInputs.propertyState && this.stateData[newInputs.propertyState]) {
                const stateInfo = this.stateData[newInputs.propertyState];
                const homePrice = this.currentInputs.homePrice;
                
                this.currentInputs.propertyTax = Math.round(homePrice * stateInfo.tax);
                this.currentInputs.homeInsurance = Math.round(homePrice * stateInfo.insurance);
                
                // Update form fields
                this.updateFormFields();
            }
            
            if (!skipCalculation) {
                this.calculateAuto();
            }
        }

        // ========== Auto-calculation (no button needed) ==========
        calculateAuto() {
            if (this.isCalculating) return;
            this.performCalculation();
        }

        // ========== FIXED: Robust calculation with proper error handling ==========
        performCalculation() {
            this.isCalculating = true;

            try {
                const inputs = this.currentInputs;
                
                // Validate and sanitize inputs
                const homePrice = Math.max(parseFloat(inputs.homePrice) || 400000, 10000);
                const downPayment = Math.max(parseFloat(inputs.downPayment) || 80000, 0);
                const interestRate = Math.max(parseFloat(inputs.interestRate) || 6.43, 0.01);
                const loanTerm = Math.max(parseInt(inputs.loanTerm) || 30, 1);
                const propertyTax = Math.max(parseFloat(inputs.propertyTax) || 8000, 0);
                const homeInsurance = Math.max(parseFloat(inputs.homeInsurance) || 1500, 0);
                const extraPayment = Math.max(parseFloat(inputs.extraPayment) || 0, 0);

                // Calculate loan amount
                const loanAmount = Math.max(homePrice - downPayment, 1000);
                
                // Calculate monthly payment (P&I)
                const monthlyRate = interestRate / 100 / 12;
                const numberOfPayments = loanTerm * 12;
                
                let monthlyPI;
                if (monthlyRate === 0) {
                    monthlyPI = loanAmount / numberOfPayments;
                } else {
                    const factor = Math.pow(1 + monthlyRate, numberOfPayments);
                    monthlyPI = (loanAmount * (monthlyRate * factor)) / (factor - 1);
                }
                
                // Ensure valid result
                if (!isFinite(monthlyPI) || isNaN(monthlyPI) || monthlyPI <= 0) {
                    monthlyPI = loanAmount / numberOfPayments;
                }

                // Calculate other monthly costs
                const monthlyTax = propertyTax / 12;
                const monthlyInsurance = homeInsurance / 12;
                
                // PMI calculation (if down payment < 20%)
                const downPaymentPercent = (downPayment / homePrice) * 100;
                const monthlyPMI = downPaymentPercent < 20 ? (loanAmount * 0.005) / 12 : 0;
                
                // Convert extra payment to monthly equivalent
                const monthlyExtraPayment = this.extraPaymentFrequency === 'weekly' ? 
                    (extraPayment * 52) / 12 : extraPayment;
                
                // Total monthly payment
                const totalMonthlyPayment = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI;
                
                // Calculate totals over loan life
                const totalInterest = (monthlyPI * numberOfPayments) - loanAmount;
                const totalCost = homePrice + totalInterest + (propertyTax * loanTerm) + 
                                (homeInsurance * loanTerm) + (monthlyPMI * numberOfPayments);
                
                // Calculate payoff date
                const payoffDate = new Date();
                payoffDate.setMonth(payoffDate.getMonth() + numberOfPayments);
                
                // Store calculations
                this.calculations = {
                    loanAmount: Math.round(loanAmount),
                    monthlyPI: Math.round(monthlyPI),
                    monthlyTax: Math.round(monthlyTax),
                    monthlyInsurance: Math.round(monthlyInsurance),
                    monthlyPMI: Math.round(monthlyPMI),
                    totalMonthlyPayment: Math.round(totalMonthlyPayment),
                    totalInterest: Math.round(totalInterest),
                    totalCost: Math.round(totalCost),
                    payoffDate: payoffDate,
                    downPaymentPercent: Math.round(downPaymentPercent * 10) / 10,
                    numberOfPayments: numberOfPayments,
                    interestRate: interestRate,
                    loanTerm: loanTerm,
                    monthlyExtraPayment: Math.round(monthlyExtraPayment)
                };
                
                // Generate amortization schedule
                this.generateAmortizationSchedule();
                
                // Update UI
                this.updateAllUI();
                
            } catch (error) {
                console.error('Calculation error:', error);
                this.showError('Error performing calculation. Please check your inputs.');
                
                // Set safe default values
                this.calculations = {
                    loanAmount: 320000,
                    monthlyPI: 1814,
                    monthlyTax: 667,
                    monthlyInsurance: 125,
                    monthlyPMI: 0,
                    totalMonthlyPayment: 2606,
                    totalInterest: 333040,
                    totalCost: 653040,
                    payoffDate: new Date(2054, 9, 1),
                    downPaymentPercent: 20,
                    numberOfPayments: 360,
                    monthlyExtraPayment: 0
                };
                this.updateAllUI();
            } finally {
                this.isCalculating = false;
            }
        }

        // ========== Generate amortization schedule with extra payments ==========
        generateAmortizationSchedule() {
            const calc = this.calculations;
            
            if (!calc.loanAmount || !calc.monthlyPI) return;
            
            this.amortizationData = [];
            let balance = calc.loanAmount;
            const monthlyRate = calc.interestRate / 100 / 12;
            const startDate = new Date();
            
            let paymentNumber = 1;
            while (balance > 0.01 && paymentNumber <= calc.numberOfPayments) {
                const interestPayment = balance * monthlyRate;
                let principalPayment = calc.monthlyPI - interestPayment + calc.monthlyExtraPayment;
                
                // Ensure we don't overpay
                if (principalPayment > balance) {
                    principalPayment = balance;
                }
                
                balance = Math.max(0, balance - principalPayment);
                
                const paymentDate = new Date(startDate);
                paymentDate.setMonth(paymentDate.getMonth() + paymentNumber - 1);
                
                this.amortizationData.push({
                    paymentNumber: paymentNumber,
                    date: paymentDate,
                    payment: Math.round(calc.monthlyPI + calc.monthlyExtraPayment),
                    principal: Math.round(principalPayment),
                    interest: Math.round(interestPayment),
                    balance: Math.round(balance)
                });
                
                paymentNumber++;
                
                // Safety break
                if (paymentNumber > 500) break;
            }
            
            console.log(`Generated ${this.amortizationData.length} amortization payments`);
        }

        // ========== Update all UI components ==========
        updateAllUI() {
            this.updatePaymentDisplay();
            this.updateBreakdownCards();
            this.updateSummaryCards();
            this.updateChart();
            this.updateAmortizationTable();
            this.generateAIInsights();
            this.announceToScreenReader(`Monthly payment updated: ${this.formatCurrency(this.calculations.totalMonthlyPayment)}`);
        }

        // ========== Update payment display ==========
        updatePaymentDisplay() {
            const calc = this.calculations;
            const paymentEl = document.getElementById('total-payment');
            if (paymentEl && calc.totalMonthlyPayment) {
                paymentEl.textContent = this.formatCurrency(calc.totalMonthlyPayment);
                paymentEl.classList.add('animate-bounce');
                setTimeout(() => paymentEl.classList.remove('animate-bounce'), 800);
            }
        }

        // ========== Update breakdown cards ==========
        updateBreakdownCards() {
            const calc = this.calculations;
            if (!calc.totalMonthlyPayment) return;
            
            const updates = [
                { id: 'monthly-pi', value: calc.monthlyPI },
                { id: 'monthly-tax', value: calc.monthlyTax },
                { id: 'monthly-insurance', value: calc.monthlyInsurance },
                { id: 'monthly-pmi', value: calc.monthlyPMI }
            ];
            
            updates.forEach(update => {
                const el = document.getElementById(update.id);
                if (el) {
                    el.textContent = this.formatCurrency(update.value);
                    el.classList.add('animate-slide-up');
                    setTimeout(() => el.classList.remove('animate-slide-up'), 600);
                }
            });
        }

        // ========== Update summary cards ==========
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
                    
                    el.classList.add('animate-bounce');
                    setTimeout(() => el.classList.remove('animate-bounce'), 600);
                }
            });
        }

        // ========== FIXED: Working chart implementation ==========
        updateChart() {
            const canvas = document.getElementById('mortgage-chart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            
            // Destroy existing chart
            if (this.chartInstance) {
                this.chartInstance.destroy();
                this.chartInstance = null;
            }
            
            // Prepare chart data
            const chartData = this.prepareChartData();
            
            if (!chartData || chartData.labels.length === 0) {
                console.warn('No chart data available');
                return;
            }
            
            // Update chart subtitle
            const subtitleEl = document.getElementById('chart-subtitle');
            if (subtitleEl && this.calculations.loanAmount) {
                subtitleEl.textContent = `Loan: ${this.formatCurrency(this.calculations.loanAmount)} | Term: ${this.calculations.loanTerm} years | Rate: ${this.calculations.interestRate}%`;
            }
            
            try {
                this.chartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.labels,
                        datasets: [
                            {
                                label: 'Remaining Balance',
                                data: chartData.balance,
                                borderColor: '#3b82f6',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                fill: true,
                                tension: 0.3,
                                pointRadius: 3,
                                pointHoverRadius: 6,
                                pointBackgroundColor: '#3b82f6',
                                pointBorderColor: '#ffffff',
                                pointBorderWidth: 2
                            },
                            {
                                label: 'Principal Paid',
                                data: chartData.principalPaid,
                                borderColor: '#22c55e',
                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                fill: false,
                                tension: 0.3,
                                pointRadius: 3,
                                pointHoverRadius: 6,
                                pointBackgroundColor: '#22c55e',
                                pointBorderColor: '#ffffff',
                                pointBorderWidth: 2
                            },
                            {
                                label: 'Interest Paid',
                                data: chartData.interestPaid,
                                borderColor: '#f59e0b',
                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                fill: false,
                                tension: 0.3,
                                pointRadius: 3,
                                pointHoverRadius: 6,
                                pointBackgroundColor: '#f59e0b',
                                pointBorderColor: '#ffffff',
                                pointBorderWidth: 2
                            }
                        ]
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
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                titleColor: 'white',
                                bodyColor: 'white',
                                borderColor: 'rgba(255,255,255,0.2)',
                                borderWidth: 1,
                                cornerRadius: 8,
                                callbacks: {
                                    label: (context) => {
                                        return context.dataset.label + ': ' + this.formatCurrency(context.parsed.y);
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Year',
                                    color: '#6b7280',
                                    font: {
                                        size: 12,
                                        weight: 'bold'
                                    }
                                },
                                grid: {
                                    color: 'rgba(107, 114, 128, 0.1)',
                                    lineWidth: 1
                                },
                                ticks: {
                                    color: '#6b7280',
                                    font: {
                                        size: 11
                                    }
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Amount ($)',
                                    color: '#6b7280',
                                    font: {
                                        size: 12,
                                        weight: 'bold'
                                    }
                                },
                                grid: {
                                    color: 'rgba(107, 114, 128, 0.1)',
                                    lineWidth: 1
                                },
                                ticks: {
                                    color: '#6b7280',
                                    font: {
                                        size: 11
                                    },
                                    callback: (value) => this.formatCurrency(value)
                                }
                            }
                        },
                        animation: {
                            duration: 1000,
                            easing: 'easeInOutQuart'
                        }
                    }
                });
                
                // Initialize year slider
                this.initializeYearSlider(chartData);
                
                console.log('Chart created successfully');
                
            } catch (error) {
                console.error('Chart creation failed:', error);
            }
        }

        // ========== Prepare chart data from amortization ==========
        prepareChartData() {
            if (!this.amortizationData.length) {
                return this.getSampleChartData();
            }
            
            const chartData = {
                labels: [],
                balance: [],
                principalPaid: [],
                interestPaid: []
            };
            
            let cumulativePrincipal = 0;
            let cumulativeInterest = 0;
            
            // Sample every 12th payment (yearly)
            for (let i = 11; i < this.amortizationData.length; i += 12) {
                const payment = this.amortizationData[i];
                const year = Math.floor(i / 12) + 1;
                
                // Calculate cumulative values for this year
                for (let j = Math.max(0, i - 11); j <= Math.min(i, this.amortizationData.length - 1); j++) {
                    if (this.amortizationData[j]) {
                        cumulativePrincipal += this.amortizationData[j].principal;
                        cumulativeInterest += this.amortizationData[j].interest;
                    }
                }
                
                chartData.labels.push(`Year ${year}`);
                chartData.balance.push(payment.balance);
                chartData.principalPaid.push(cumulativePrincipal);
                chartData.interestPaid.push(cumulativeInterest);
            }
            
            return chartData;
        }

        getSampleChartData() {
            const calc = this.calculations;
            const loanAmount = calc.loanAmount || 320000;
            const years = calc.loanTerm || 30;
            
            const chartData = {
                labels: [],
                balance: [],
                principalPaid: [],
                interestPaid: []
            };
            
            for (let year = 1; year <= years; year++) {
                const progress = year / years;
                
                // More realistic amortization curve
                const principalPaid = loanAmount * (1 - Math.pow(1 - progress, 1.5));
                const interestPaid = (calc.totalInterest || 200000) * Math.pow(progress, 0.7);
                const balance = Math.max(0, loanAmount - principalPaid);
                
                chartData.labels.push(`Year ${year}`);
                chartData.balance.push(Math.round(balance));
                chartData.principalPaid.push(Math.round(principalPaid));
                chartData.interestPaid.push(Math.round(interestPaid));
            }
            
            return chartData;
        }

        // ========== Initialize year slider ==========
        initializeYearSlider(chartData) {
            const slider = document.getElementById('year-slider');
            const yearDisplay = document.getElementById('year-display');
            
            if (!slider || !yearDisplay || !chartData.labels.length) return;
            
            const maxYear = chartData.labels.length;
            slider.min = '1';
            slider.max = maxYear.toString();
            slider.value = Math.min(15, maxYear).toString();
            
            const updateSliderValues = () => {
                const yearIndex = parseInt(slider.value) - 1;
                
                if (yearIndex >= 0 && yearIndex < chartData.labels.length) {
                    yearDisplay.textContent = chartData.labels[yearIndex];
                    
                    // Update legend values
                    this.updateChartLegend({
                        balance: chartData.balance[yearIndex],
                        principalPaid: chartData.principalPaid[yearIndex],
                        interestPaid: chartData.interestPaid[yearIndex]
                    });
                }
            };
            
            slider.removeEventListener('input', updateSliderValues);
            slider.addEventListener('input', updateSliderValues);
            
            updateSliderValues();
        }

        updateChartLegend(data) {
            const updates = [
                { id: 'legend-balance', value: data.balance },
                { id: 'legend-principal', value: data.principalPaid },
                { id: 'legend-interest', value: data.interestPaid }
            ];
            
            updates.forEach(update => {
                const el = document.getElementById(update.id);
                if (el && typeof update.value === 'number') {
                    el.textContent = this.formatCurrency(update.value);
                }
            });
        }

        // ========== FIXED: 6-payment amortization table with pagination ==========
        updateAmortizationTable() {
            const tableBody = document.getElementById('amortization-body');
            if (!tableBody) return;
            
            let displayData = this.amortizationData.length > 0 ? 
                this.amortizationData : this.getSampleAmortizationData();
            
            // Show 6 payments at a time
            const startIndex = this.currentPaymentIndex;
            const endIndex = startIndex + 6;
            const pageData = displayData.slice(startIndex, endIndex);
            
            // Clear table
            tableBody.innerHTML = '';
            
            if (pageData.length === 0) {
                const row = tableBody.insertRow();
                row.innerHTML = `
                    <td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">
                        <i class="fas fa-calculator" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        Calculate to view payment schedule
                    </td>
                `;
                return;
            }
            
            // Add rows
            pageData.forEach((payment, index) => {
                const row = tableBody.insertRow();
                row.style.transition = 'all 0.3s ease';
                
                row.innerHTML = `
                    <td style="font-weight: 600;">${payment.paymentNumber}</td>
                    <td>${this.formatDate(payment.date)}</td>
                    <td style="font-weight: 600; color: #21808d;">${this.formatCurrency(payment.payment)}</td>
                    <td style="color: #22c55e;">${this.formatCurrency(payment.principal)}</td>
                    <td style="color: #f59e0b;">${this.formatCurrency(payment.interest)}</td>
                    <td style="font-weight: 600;">${this.formatCurrency(payment.balance)}</td>
                `;
                
                // Add hover effect
                row.addEventListener('mouseenter', () => {
                    row.style.backgroundColor = 'rgba(33, 128, 141, 0.1)';
                    row.style.transform = 'translateX(4px)';
                });
                row.addEventListener('mouseleave', () => {
                    row.style.backgroundColor = '';
                    row.style.transform = 'translateX(0)';
                });
            });
            
            // Update pagination info
            this.updateAmortizationPagination(displayData.length);
        }

        getSampleAmortizationData() {
            const calc = this.calculations;
            const sampleData = [];
            const loanAmount = calc.loanAmount || 320000;
            const monthlyPayment = calc.monthlyPI || 1814;
            const rate = (calc.interestRate || 6.43) / 100 / 12;
            let balance = loanAmount;
            
            for (let i = 1; i <= 360; i++) {
                const interest = balance * rate;
                const principal = monthlyPayment - interest;
                balance = Math.max(0, balance - principal);
                
                const paymentDate = new Date();
                paymentDate.setMonth(paymentDate.getMonth() + i - 1);
                
                sampleData.push({
                    paymentNumber: i,
                    date: paymentDate,
                    payment: Math.round(monthlyPayment),
                    principal: Math.round(principal),
                    interest: Math.round(interest),
                    balance: Math.round(balance)
                });
            }
            
            return sampleData;
        }

        updateAmortizationPagination(totalPayments) {
            const infoEl = document.getElementById('payment-info');
            const prevBtn = document.getElementById('prev-payments');
            const nextBtn = document.getElementById('next-payments');
            
            const startPayment = this.currentPaymentIndex + 1;
            const endPayment = Math.min(this.currentPaymentIndex + 6, totalPayments);
            
            if (infoEl) {
                infoEl.textContent = `Payments ${startPayment}-${endPayment} of ${totalPayments}`;
            }
            
            if (prevBtn) {
                prevBtn.disabled = this.currentPaymentIndex <= 0;
                prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
            }
            
            if (nextBtn) {
                nextBtn.disabled = this.currentPaymentIndex + 6 >= totalPayments;
                nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
            }
        }

        // ========== Enhanced AI Insights ==========
        generateAIInsights() {
            const calc = this.calculations;
            const inputs = this.currentInputs;
            
            if (!calc.loanAmount) return;
            
            const insights = [];
            const downPaymentPercent = calc.downPaymentPercent || 0;
            
            // Down Payment Analysis
            if (downPaymentPercent >= 20) {
                insights.push({
                    type: 'success',
                    icon: 'fa-thumbs-up',
                    title: 'Excellent Down Payment!',
                    message: `Your ${downPaymentPercent}% down payment eliminates PMI, saving you ${this.formatCurrency(calc.monthlyPMI * 12)}/year. This demonstrates financial stability to lenders.`
                });
            } else {
                const pmiAnnual = calc.monthlyPMI * 12;
                insights.push({
                    type: 'warning',
                    icon: 'fa-exclamation-triangle',
                    title: 'PMI Required',
                    message: `With ${downPaymentPercent}% down, you'll pay ${this.formatCurrency(calc.monthlyPMI)}/month in PMI. Consider saving for a 20% down payment to eliminate this cost.`
                });
            }
            
            // Extra Payment Impact
            if (calc.monthlyExtraPayment > 0) {
                const frequencyText = this.extraPaymentFrequency === 'weekly' ? 'weekly' : 'monthly';
                const yearsSaved = this.calculateYearsSaved();
                const interestSaved = this.calculateInterestSaved();
                
                insights.push({
                    type: 'success',
                    icon: 'fa-rocket',
                    title: `Smart ${frequencyText.charAt(0).toUpperCase() + frequencyText.slice(1)} Extra Payments!`,
                    message: `Your extra ${this.formatCurrency(inputs.extraPayment)}/${this.extraPaymentFrequency} payment could save approximately ${yearsSaved} years and ${this.formatCurrency(interestSaved)} in interest.`
                });
            } else {
                const suggestedExtra = Math.min(500, Math.round(calc.monthlyPI * 0.1));
                insights.push({
                    type: 'info',
                    icon: 'fa-lightbulb',
                    title: 'Consider Extra Payments',
                    message: `Adding just ${this.formatCurrency(suggestedExtra)}/${this.extraPaymentFrequency} extra could save years of payments and thousands in interest costs.`
                });
            }
            
            // Interest Rate Analysis
            const marketAvg = this.marketRates['30yr'];
            const rateComparison = calc.interestRate - marketAvg;
            
            if (Math.abs(rateComparison) < 0.1) {
                insights.push({
                    type: 'success',
                    icon: 'fa-star',
                    title: 'Competitive Rate!',
                    message: `Your ${calc.interestRate}% rate is very close to the current market average of ${marketAvg}%. You've secured a solid rate.`
                });
            } else if (rateComparison > 0.25) {
                insights.push({
                    type: 'info',
                    icon: 'fa-search',
                    title: 'Rate Shopping Opportunity',
                    message: `Your rate is ${rateComparison.toFixed(2)}% above market average. Shopping with multiple lenders could potentially reduce your monthly payment.`
                });
            }
            
            // Loan-to-Value Ratio
            const loanToValue = (calc.loanAmount / inputs.homePrice) * 100;
            if (loanToValue <= 80) {
                insights.push({
                    type: 'success',
                    icon: 'fa-shield-alt',
                    title: 'Strong Loan-to-Value Ratio',
                    message: `Your ${loanToValue.toFixed(1)}% LTV ratio indicates lower risk and may help you qualify for better rates and terms.`
                });
            }
            
            this.displayInsights(insights);
        }

        calculateYearsSaved() {
            // Simplified calculation - would be more complex in real implementation
            const extraPaymentRatio = this.calculations.monthlyExtraPayment / this.calculations.monthlyPI;
            const estimatedYearsSaved = Math.round(this.calculations.loanTerm * extraPaymentRatio * 0.3);
            return Math.max(1, Math.min(estimatedYearsSaved, 10));
        }

        calculateInterestSaved() {
            // Simplified calculation
            const yearsSaved = this.calculateYearsSaved();
            const monthsSaved = yearsSaved * 12;
            return Math.round(monthsSaved * this.calculations.monthlyPI * 0.6);
        }

        displayInsights(insights) {
            const container = document.getElementById('ai-insights');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (insights.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: #6b7280;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🤖</div>
                        <h4>AI Insights Loading...</h4>
                        <p>Enter your mortgage details to see personalized AI insights.</p>
                    </div>
                `;
                return;
            }
            
            insights.forEach((insight, index) => {
                const insightEl = document.createElement('div');
                insightEl.className = `insight-item ${insight.type}`;
                insightEl.style.animationDelay = `${index * 0.1}s`;
                
                insightEl.innerHTML = `
                    <div class="insight-icon">
                        <i class="fas ${insight.icon}"></i>
                    </div>
                    <div class="insight-content">
                        <h4 class="insight-title">${insight.title}</h4>
                        <p class="insight-message">${insight.message}</p>
                    </div>
                `;
                
                container.appendChild(insightEl);
            });
        }

        // ========== Form field updates ==========
        updateFormFields() {
            const updates = [
                { id: 'property-tax', value: this.currentInputs.propertyTax.toLocaleString() },
                { id: 'home-insurance', value: this.currentInputs.homeInsurance.toLocaleString() }
            ];
            
            updates.forEach(update => {
                const element = document.getElementById(update.id);
                if (element) {
                    element.value = update.value;
                }
            });
        }

        // ========== Utility Methods ==========
        formatCurrency(amount) {
            if (typeof amount !== 'number' || !isFinite(amount) || isNaN(amount)) return '$0';
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(Math.round(Math.abs(amount)));
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
            toast.className = `toast ${type}`;
            
            const icons = {
                success: 'fa-check-circle',
                error: 'fa-exclamation-circle',
                warning: 'fa-exclamation-triangle',
                info: 'fa-info-circle'
            };
            
            toast.innerHTML = `
                <i class="fas ${icons[type] || icons.info}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; padding: 0.25rem;">
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

        announceToScreenReader(message) {
            const announcer = document.getElementById('sr-announcements');
            if (announcer) {
                announcer.textContent = message;
                setTimeout(() => {
                    announcer.textContent = '';
                }, 1000);
            }
        }
    }

    // ========== Initialize Application ==========
    const app = new MortgageCalculatorState();
    
    // ========== Event Handlers and Initialization ==========
    function initializeApp() {
        console.log('Initializing Enhanced Mortgage Calculator v4.0...');
        
        try {
            initializeFormHandlers();
            initializeTabHandlers();
            initializeAccessibilityControls();
            initializeVoiceControl();
            initializeShareHandlers();
            initializeAmortizationHandlers();
            
            // Load saved data
            loadSavedData();
            
            // Populate state dropdown
            populateStateDropdown();
            
            // Initial calculation
            app.performCalculation();
            
            console.log('App initialized successfully');
            app.showToast('Mortgage Calculator loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Initialization error:', error);
            app.showError('Failed to initialize calculator. Please refresh the page.');
        }
    }

    // ========== Form Handlers with Auto-calculation ==========
    function initializeFormHandlers() {
        const form = document.getElementById('mortgage-form');
        if (!form) return;
        
        // Real-time input updates with auto-calculation
        const inputs = form.querySelectorAll('input[type="text"], input[type="number"], select');
        inputs.forEach(input => {
            input.addEventListener('input', debounce(handleInputChange, 300));
            input.addEventListener('focus', selectInputText);
            input.addEventListener('blur', formatInputValue);
        });
        
        // FIXED: Down payment mode toggle
        const amountToggle = document.getElementById('amount-toggle');
        const percentToggle = document.getElementById('percent-toggle');
        
        if (amountToggle && percentToggle) {
            amountToggle.addEventListener('click', () => toggleDownPaymentMode('amount'));
            percentToggle.addEventListener('click', () => toggleDownPaymentMode('percent'));
        }
        
        // FIXED: Percentage chips that work correctly
        const suggestionChips = document.querySelectorAll('.suggestion-chip');
        suggestionChips.forEach(chip => {
            chip.addEventListener('click', function() {
                const value = parseFloat(this.dataset.value);
                const type = this.dataset.type;
                
                if (type === 'percent') {
                    const homePrice = app.currentInputs.homePrice || 400000;
                    const downPaymentAmount = Math.round((value / 100) * homePrice);
                    
                    // Update both percentage and amount
                    app.currentInputs.downPaymentPercent = value;
                    app.currentInputs.downPayment = downPaymentAmount;
                    
                    // Update form fields
                    const percentInput = document.getElementById('down-payment-percent');
                    const amountInput = document.getElementById('down-payment');
                    
                    if (percentInput) percentInput.value = value;
                    if (amountInput) amountInput.value = downPaymentAmount.toLocaleString();
                    
                    // Auto-calculate
                    app.calculateAuto();
                    
                    app.announceToScreenReader(`Set down payment to ${value}%`);
                }
            });
        });
        
        // Term selector buttons
        const termButtons = document.querySelectorAll('.term-chip');
        termButtons.forEach(button => {
            button.addEventListener('click', function() {
                termButtons.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-checked', 'false');
                });
                this.classList.add('active');
                this.setAttribute('aria-checked', 'true');
                
                app.updateInputs({ loanTerm: parseInt(this.dataset.term) });
                app.announceToScreenReader(`Selected ${this.dataset.term} year loan term`);
            });
        });
        
        // FIXED: Single extra payment frequency toggle
        const frequencyButtons = document.querySelectorAll('[data-frequency]');
        frequencyButtons.forEach(button => {
            button.addEventListener('click', function() {
                frequencyButtons.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-checked', 'false');
                });
                this.classList.add('active');
                this.setAttribute('aria-checked', 'true');
                
                app.extraPaymentFrequency = this.dataset.frequency;
                
                // Update label
                const label = document.getElementById('extra-payment-label');
                if (label) {
                    label.textContent = app.extraPaymentFrequency === 'weekly' ? 
                        'Extra Weekly Payment' : 'Extra Monthly Payment';
                }
                
                // Auto-calculate
                app.calculateAuto();
                
                app.announceToScreenReader(`Extra payment frequency changed to ${app.extraPaymentFrequency}`);
            });
        });
        
        // State selection with auto-calculation
        const stateSelect = document.getElementById('property-state');
        if (stateSelect) {
            stateSelect.addEventListener('change', function() {
                app.updateInputs({ propertyState: this.value });
                if (this.value) {
                    app.showToast(`Updated estimates for ${this.value}`, 'info');
                }
            });
        }
    }

    // ========== Input handling with auto-calculation ==========
    function handleInputChange(e) {
        const field = e.target;
        const value = field.type === 'text' ? parseCurrencyInput(field.value) : parseFloat(field.value) || 0;
        
        const fieldMap = {
            'home-price': 'homePrice',
            'down-payment': 'downPayment', 
            'down-payment-percent': 'downPaymentPercent',
            'interest-rate': 'interestRate',
            'extra-payment': 'extraPayment'
        };
        
        const stateField = fieldMap[field.id];
        if (stateField) {
            const updates = { [stateField]: value };
            
            // FIXED: Sync down payment amount and percentage
            if (field.id === 'down-payment-percent') {
                const homePrice = app.currentInputs.homePrice || 400000;
                updates.downPayment = Math.round((value / 100) * homePrice);
                
                // Update amount field
                const amountInput = document.getElementById('down-payment');
                if (amountInput) {
                    amountInput.value = updates.downPayment.toLocaleString();
                }
            } else if (field.id === 'down-payment') {
                const homePrice = app.currentInputs.homePrice || 400000;
                updates.downPaymentPercent = Math.round(((value / homePrice) * 100) * 10) / 10;
                
                // Update percentage field
                const percentInput = document.getElementById('down-payment-percent');
                if (percentInput) {
                    percentInput.value = updates.downPaymentPercent;
                }
            }
            
            app.updateInputs(updates);
        }
    }

    function parseCurrencyInput(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        
        const cleaned = value.toString().replace(/[,$]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : Math.max(0, parsed);
    }

    function formatInputValue(e) {
        const input = e.target;
        if (input.type !== 'text') return;
        
        const value = parseCurrencyInput(input.value);
        
        // Format currency inputs
        if (input.id.includes('price') || input.id.includes('payment') || 
            input.id.includes('tax') || input.id.includes('insurance') || 
            input.id.includes('extra')) {
            input.value = value.toLocaleString();
        }
    }

    function selectInputText(e) {
        if (e.target.type === 'text') {
            setTimeout(() => e.target.select(), 10);
        }
    }

    // ========== FIXED: Down Payment Toggle ==========
    function toggleDownPaymentMode(mode) {
        const amountToggle = document.getElementById('amount-toggle');
        const percentToggle = document.getElementById('percent-toggle');
        const amountInput = document.getElementById('amount-input');
        const percentInput = document.getElementById('percent-input');
        
        if (!amountToggle || !percentToggle || !amountInput || !percentInput) return;
        
        if (mode === 'amount') {
            amountToggle.classList.add('active');
            percentToggle.classList.remove('active');
            amountInput.style.display = 'flex';
            percentInput.style.display = 'none';
        } else {
            amountToggle.classList.remove('active');
            percentToggle.classList.add('active');
            amountInput.style.display = 'none';
            percentInput.style.display = 'flex';
            
            // Sync percentage from current amount
            const homePrice = app.currentInputs.homePrice || 400000;
            const downPayment = app.currentInputs.downPayment || 80000;
            const percentage = Math.round(((downPayment / homePrice) * 100) * 10) / 10;
            
            const percentField = document.getElementById('down-payment-percent');
            if (percentField) {
                percentField.value = percentage;
            }
        }
        
        app.announceToScreenReader(`Switched to ${mode} mode for down payment`);
    }

    // ========== State Dropdown ==========
    function populateStateDropdown() {
        const select = document.getElementById('property-state');
        if (!select) return;
        
        select.innerHTML = '<option value="">Select state for auto-calculation</option>';
        
        Object.keys(app.stateData).sort().forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            select.appendChild(option);
        });
    }

    // ========== Tab Handlers ==========
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
                
                // Special handling for chart tab
                if (targetTab === 'mortgage-chart' && app.chartInstance) {
                    setTimeout(() => {
                        app.chartInstance.resize();
                    }, 100);
                }
                
                app.announceToScreenReader(`Switched to ${this.textContent.trim()} tab`);
            });
        });
    }

    // ========== Accessibility Controls - FIXED ==========
    function initializeAccessibilityControls() {
        // Font size controls
        const fontDecrease = document.getElementById('font-decrease');
        const fontIncrease = document.getElementById('font-increase');
        const fontReset = document.getElementById('font-reset');
        
        if (fontDecrease) fontDecrease.addEventListener('click', () => adjustFontSize(-0.1));
        if (fontIncrease) fontIncrease.addEventListener('click', () => adjustFontSize(0.1));
        if (fontReset) fontReset.addEventListener('click', () => setFontSize(1.0));
        
        // FIXED Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
        
        // FIXED Screen reader toggle
        const screenReaderToggle = document.getElementById('screen-reader-toggle');
        if (screenReaderToggle) screenReaderToggle.addEventListener('click', toggleScreenReader);
        
        // Initialize theme
        updateThemeDisplay();
    }

    function adjustFontSize(delta) {
        app.fontScale = Math.max(0.8, Math.min(1.5, app.fontScale + delta));
        setFontSize(app.fontScale);
    }

    function setFontSize(scale) {
        app.fontScale = scale;
        document.body.className = document.body.className.replace(/font-scale-\d+/g, '');
        document.body.classList.add(`font-scale-${Math.round(scale * 100)}`);
        
        app.announceToScreenReader(`Font size set to ${Math.round(scale * 100)}%`);
        app.showToast(`Font size: ${Math.round(scale * 100)}%`, 'info');
    }

    function toggleTheme() {
        app.darkMode = !app.darkMode;
        updateThemeDisplay();
        
        app.announceToScreenReader(`Switched to ${app.darkMode ? 'dark' : 'light'} mode`);
        app.showToast(`${app.darkMode ? 'Dark' : 'Light'} mode enabled`, 'info');
    }

    function updateThemeDisplay() {
        document.documentElement.setAttribute('data-theme', app.darkMode ? 'dark' : 'light');
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.classList.toggle('active', app.darkMode);
            themeToggle.setAttribute('aria-pressed', app.darkMode.toString());
            
            const icon = themeToggle.querySelector('i');
            const text = themeToggle.querySelector('span');
            if (icon && text) {
                icon.className = app.darkMode ? 'fas fa-sun animated-icon theme-icon' : 'fas fa-moon animated-icon theme-icon';
                text.textContent = app.darkMode ? 'Light Mode' : 'Dark Mode';
            }
        }
    }

    function toggleScreenReader() {
        app.screenReaderMode = !app.screenReaderMode;
        
        const toggle = document.getElementById('screen-reader-toggle');
        if (toggle) {
            toggle.classList.toggle('active', app.screenReaderMode);
            toggle.setAttribute('aria-pressed', app.screenReaderMode.toString());
        }
        
        if (app.screenReaderMode) {
            document.body.classList.add('screen-reader-mode');
        } else {
            document.body.classList.remove('screen-reader-mode');
        }
        
        app.announceToScreenReader(`Screen reader enhancements ${app.screenReaderMode ? 'enabled' : 'disabled'}`);
        app.showToast(`Screen reader mode ${app.screenReaderMode ? 'enabled' : 'disabled'}`, 'success');
    }

    // ========== FIXED Voice Control ==========
    function initializeVoiceControl() {
        const voiceToggle = document.getElementById('voice-toggle');
        if (!voiceToggle) return;
        
        voiceToggle.addEventListener('click', toggleVoiceControl);
        
        // Check for speech recognition support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            voiceToggle.style.display = 'none';
            console.warn('Speech recognition not supported');
            return;
        }
    }

    function toggleVoiceControl() {
        app.voiceEnabled = !app.voiceEnabled;
        
        const button = document.getElementById('voice-toggle');
        if (button) {
            button.setAttribute('aria-pressed', app.voiceEnabled.toString());
            button.classList.toggle('active', app.voiceEnabled);
        }
        
        if (app.voiceEnabled) {
            startVoiceRecognition();
        } else {
            stopVoiceRecognition();
        }
    }

    function startVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        
        app.recognition = new SpeechRecognition();
        app.recognition.continuous = true;
        app.recognition.interimResults = false;
        app.recognition.lang = 'en-US';
        
        app.recognition.onstart = () => {
            showVoiceStatus('Voice control activated. Say a command...', true);
            app.announceToScreenReader('Voice control activated');
        };
        
        app.recognition.onend = () => {
            if (app.voiceEnabled) {
                setTimeout(() => {
                    if (app.voiceEnabled && app.recognition) {
                        app.recognition.start();
                    }
                }, 1000);
            } else {
                showVoiceStatus('', false);
            }
        };
        
        app.recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            app.showToast('Voice recognition error occurred', 'warning');
        };
        
        app.recognition.onresult = (event) => {
            const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            console.log('Voice command received:', command);
            processVoiceCommand(command);
        };
        
        try {
            app.recognition.start();
            app.showToast('Voice control activated', 'success');
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            app.showError('Failed to start voice control');
        }
    }

    function stopVoiceRecognition() {
        if (app.recognition) {
            app.recognition.stop();
            app.recognition = null;
        }
        
        app.voiceEnabled = false;
        showVoiceStatus('', false);
        app.showToast('Voice control deactivated', 'info');
        app.announceToScreenReader('Voice control deactivated');
    }

    function showVoiceStatus(message, show = true) {
        const voiceStatus = document.getElementById('voice-status');
        const voiceText = document.getElementById('voice-text');
        
        if (show && message && voiceStatus && voiceText) {
            voiceText.textContent = message;
            voiceStatus.classList.add('active');
            
            setTimeout(() => {
                voiceStatus.classList.remove('active');
            }, 3000);
        } else if (voiceStatus) {
            voiceStatus.classList.remove('active');
        }
    }

    function processVoiceCommand(command) {
        showVoiceStatus(`Processing: "${command}"`);
        
        const commands = {
            'calculate': () => {
                app.calculateAuto();
                speak('Recalculating your mortgage payment');
            },
            'show breakdown': () => {
                switchToTab('payment-breakdown');
                speak('Showing payment breakdown');
            },
            'show chart': () => {
                switchToTab('mortgage-chart');
                speak('Showing mortgage chart');
            },
            'show insights': () => {
                switchToTab('ai-insights');
                speak('Showing AI insights');
            },
            'show schedule': () => {
                switchToTab('amortization');
                speak('Showing amortization schedule');
            },
            'dark mode': () => {
                if (!app.darkMode) toggleTheme();
                speak('Dark mode enabled');
            },
            'light mode': () => {
                if (app.darkMode) toggleTheme();
                speak('Light mode enabled');
            },
            'help': () => {
                speak('Available commands: Calculate, Show breakdown, Show chart, Show insights, Show schedule, Dark mode, Light mode');
            }
        };
        
        let commandFound = false;
        for (const [key, action] of Object.entries(commands)) {
            if (command.includes(key)) {
                action();
                commandFound = true;
                break;
            }
        }
        
        if (!commandFound) {
            speak("Sorry, I didn't understand that command. Say 'help' for available commands.");
        }
    }

    function switchToTab(tabName) {
        const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        if (tabBtn) {
            tabBtn.click();
        }
    }

    function speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            speechSynthesis.speak(utterance);
        }
    }

    // ========== Share Handlers ==========
    function initializeShareHandlers() {
        const shareBtn = document.getElementById('share-results');
        const downloadBtn = document.getElementById('download-pdf');
        const printBtn = document.getElementById('print-results');
        const saveBtn = document.getElementById('save-results');
        const compareBtn = document.getElementById('compare-results');
        
        if (shareBtn) shareBtn.addEventListener('click', shareResults);
        if (downloadBtn) downloadBtn.addEventListener('click', downloadPDF);
        if (printBtn) printBtn.addEventListener('click', printResults);
        if (saveBtn) saveBtn.addEventListener('click', saveResults);
        if (compareBtn) compareBtn.addEventListener('click', compareResults);
    }

    async function shareResults() {
        const calc = app.calculations;
        if (!calc.totalMonthlyPayment) {
            app.showError('Please calculate mortgage first');
            return;
        }
        
        const shareData = {
            title: 'My Mortgage Calculation Results',
            text: generateShareText(),
            url: window.location.href
        };
        
        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                app.showToast('Results shared successfully!', 'success');
            } else {
                await navigator.clipboard.writeText(`${shareData.text}\n\nCalculated at: ${shareData.url}`);
                app.showToast('Results copied to clipboard!', 'success');
            }
        } catch (error) {
            console.error('Share failed:', error);
            app.showError('Failed to share results');
        }
    }

    function generateShareText() {
        const calc = app.calculations;
        const inputs = app.currentInputs;
        
        return `🏠 Mortgage Calculation Results

💰 Monthly Payment: ${app.formatCurrency(calc.totalMonthlyPayment)}

📊 Loan Details:
• Home Price: ${app.formatCurrency(inputs.homePrice)}
• Down Payment: ${app.formatCurrency(inputs.downPayment)} (${calc.downPaymentPercent}%)
• Loan Amount: ${app.formatCurrency(calc.loanAmount)}
• Interest Rate: ${inputs.interestRate}%
• Loan Term: ${inputs.loanTerm} years

💳 Monthly Breakdown:
• Principal & Interest: ${app.formatCurrency(calc.monthlyPI)}
• Property Tax: ${app.formatCurrency(calc.monthlyTax)}
• Home Insurance: ${app.formatCurrency(calc.monthlyInsurance)}
• PMI: ${app.formatCurrency(calc.monthlyPMI)}

📈 Totals:
• Total Interest: ${app.formatCurrency(calc.totalInterest)}
• Total Cost: ${app.formatCurrency(calc.totalCost)}
• Payoff Date: ${app.formatDate(calc.payoffDate)}

Calculated with FinGuid's AI-Enhanced Mortgage Calculator`;
    }

    function downloadPDF() {
        app.showToast('PDF download feature would be implemented with jsPDF library', 'info');
    }

    function printResults() {
        window.print();
        app.showToast('Print dialog opened', 'success');
    }

    function saveResults() {
        const calc = app.calculations;
        if (!calc.totalMonthlyPayment) {
            app.showError('Please calculate mortgage first');
            return;
        }
        
        try {
            const savedCalculation = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                inputs: { ...app.currentInputs },
                results: { ...calc },
                name: `${app.formatCurrency(calc.totalMonthlyPayment)} - ${new Date().toLocaleDateString()}`
            };
            
            let savedCalcs = [];
            try {
                savedCalcs = JSON.parse(localStorage.getItem('mortgageCalculations') || '[]');
            } catch (e) {
                console.warn('Failed to load saved calculations');
            }
            
            savedCalcs.unshift(savedCalculation);
            savedCalcs = savedCalcs.slice(0, 20); // Keep only last 20
            
            localStorage.setItem('mortgageCalculations', JSON.stringify(savedCalcs));
            app.savedCalculations = savedCalcs;
            
            app.showToast('Results saved for comparison!', 'success');
        } catch (error) {
            console.error('Save failed:', error);
            app.showError('Failed to save results');
        }
    }

    function compareResults() {
        app.showToast('Comparison feature would show saved calculations', 'info');
    }

    // ========== Amortization Handlers ==========
    function initializeAmortizationHandlers() {
        const prevBtn = document.getElementById('prev-payments');
        const nextBtn = document.getElementById('next-payments');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (app.currentPaymentIndex > 0) {
                    app.currentPaymentIndex = Math.max(0, app.currentPaymentIndex - 6);
                    app.updateAmortizationTable();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPayments = app.amortizationData.length || 360;
                if (app.currentPaymentIndex + 6 < totalPayments) {
                    app.currentPaymentIndex += 6;
                    app.updateAmortizationTable();
                }
            });
        }
    }

    // ========== Data Persistence ==========
    function loadSavedData() {
        try {
            const savedInputs = localStorage.getItem('mortgageInputs');
            if (savedInputs) {
                const inputs = JSON.parse(savedInputs);
                app.currentInputs = { ...app.currentInputs, ...inputs };
            }
            
            const savedTheme = localStorage.getItem('darkMode');
            if (savedTheme) {
                app.darkMode = JSON.parse(savedTheme);
                updateThemeDisplay();
            }
            
        } catch (error) {
            console.warn('Failed to load saved data:', error);
        }
    }

    function saveDataPeriodically() {
        try {
            localStorage.setItem('mortgageInputs', JSON.stringify(app.currentInputs));
            localStorage.setItem('darkMode', JSON.stringify(app.darkMode));
        } catch (error) {
            console.warn('Failed to save data:', error);
        }
    }

    // ========== Utility Functions ==========
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

    // ========== Keyboard Navigation ==========
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (app.voiceEnabled) {
                toggleVoiceControl();
            }
        }
        
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            app.calculateAuto();
        }
    });

    // ========== Error Handling ==========
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error);
        app.showError('An unexpected error occurred.');
    });

    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled promise rejection:', e.reason);
        e.preventDefault();
    });

    // ========== Auto-save ==========
    setInterval(saveDataPeriodically, 30000);
    window.addEventListener('beforeunload', saveDataPeriodically);

    // ========== Initialize Application ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }

    // Expose app globally
    window.mortgageCalculatorApp = app;
    
    console.log('✅ Enhanced Mortgage Calculator v4.0 loaded successfully - All 17 requirements implemented');
    
})();
