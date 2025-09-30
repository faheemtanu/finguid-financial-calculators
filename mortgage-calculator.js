/* ============================================================================
WORLD'S #1 AI-ENHANCED MORTGAGE CALCULATOR - PRODUCTION JAVASCRIPT
Advanced Features: AI Insights, Voice Control, Real-Time Updates
Version: 3.1 Production Ready - Enhanced with User Requirements
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
            this.extraPaymentFrequency = 'monthly'; // New property for frequency toggle

            // Market data
            this.marketRates = {
                '30yr': 6.43,
                '15yr': 5.73,
                'arm': 5.90,
                'fha': 6.44
            };

            // Location-based data
            this.stateData = {
                'Alabama': { tax: 0.0041, insurance: 1200 },
                'Alaska': { tax: 0.0103, insurance: 1100 },
                'Arizona': { tax: 0.0066, insurance: 1300 },
                'Arkansas': { tax: 0.0062, insurance: 1400 },
                'California': { tax: 0.0075, insurance: 2100 },
                'Colorado': { tax: 0.0051, insurance: 1800 },
                'Connecticut': { tax: 0.0208, insurance: 1600 },
                'Delaware': { tax: 0.0057, insurance: 1500 },
                'Florida': { tax: 0.0083, insurance: 2400 },
                'Georgia': { tax: 0.0092, insurance: 1700 },
                'Hawaii': { tax: 0.0028, insurance: 1400 },
                'Idaho': { tax: 0.0069, insurance: 1200 },
                'Illinois': { tax: 0.0223, insurance: 1500 },
                'Indiana': { tax: 0.0085, insurance: 1300 },
                'Iowa': { tax: 0.0154, insurance: 1400 },
                'Kansas': { tax: 0.0144, insurance: 1500 },
                'Kentucky': { tax: 0.0086, insurance: 1600 },
                'Louisiana': { tax: 0.0055, insurance: 2200 },
                'Maine': { tax: 0.0125, insurance: 1300 },
                'Maryland': { tax: 0.0108, insurance: 1600 },
                'Massachusetts': { tax: 0.0116, insurance: 1700 },
                'Michigan': { tax: 0.0154, insurance: 1400 },
                'Minnesota': { tax: 0.0111, insurance: 1500 },
                'Mississippi': { tax: 0.0061, insurance: 1800 },
                'Missouri': { tax: 0.0098, insurance: 1500 },
                'Montana': { tax: 0.0084, insurance: 1300 },
                'Nebraska': { tax: 0.0176, insurance: 1600 },
                'Nevada': { tax: 0.0060, insurance: 1300 },
                'New Hampshire': { tax: 0.0186, insurance: 1200 },
                'New Jersey': { tax: 0.0249, insurance: 1800 },
                'New Mexico': { tax: 0.0080, insurance: 1400 },
                'New York': { tax: 0.0162, insurance: 1900 },
                'North Carolina': { tax: 0.0084, insurance: 1500 },
                'North Dakota': { tax: 0.0098, insurance: 1400 },
                'Ohio': { tax: 0.0157, insurance: 1300 },
                'Oklahoma': { tax: 0.0090, insurance: 1700 },
                'Oregon': { tax: 0.0087, insurance: 1200 },
                'Pennsylvania': { tax: 0.0153, insurance: 1400 },
                'Rhode Island': { tax: 0.0147, insurance: 1600 },
                'South Carolina': { tax: 0.0057, insurance: 1600 },
                'South Dakota': { tax: 0.0128, insurance: 1500 },
                'Tennessee': { tax: 0.0064, insurance: 1500 },
                'Texas': { tax: 0.0181, insurance: 2000 },
                'Utah': { tax: 0.0061, insurance: 1300 },
                'Vermont': { tax: 0.0186, insurance: 1200 },
                'Virginia': { tax: 0.0082, insurance: 1500 },
                'Washington': { tax: 0.0087, insurance: 1400 },
                'West Virginia': { tax: 0.0059, insurance: 1400 },
                'Wisconsin': { tax: 0.0176, insurance: 1300 },
                'Wyoming': { tax: 0.0062, insurance: 1200 }
            };

            // Enhanced PMI rates with more granular calculations
            this.pmiRates = {
                conventional: {
                    '95+': 0.01, // >95% LTV
                    '90-95': 0.008, // 90-95% LTV
                    '85-90': 0.006, // 85-90% LTV
                    '80-85': 0.005, // 80-85% LTV
                    'below-80': 0.0 // <80% LTV (no PMI)
                },
                fha: 0.008, // 0.8% annually
                va: 0.0, // No PMI
                usda: 0.0035 // 0.35% annually
            };
        }

        detectPreferredTheme() {
            if (typeof window !== 'undefined') {
                return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
            return false;
        }

        updateCalculations(data) {
            this.calculations = { ...this.calculations, ...data };
            this.notifyStateChange('calculations', data);
        }

        notifyStateChange(type, data) {
            const event = new CustomEvent('stateChanged', {
                detail: { type, data }
            });
            document.dispatchEvent(event);
        }
    }

    // Initialize global state
    const state = new MortgageCalculatorState();

    // ========== Utility Functions ========== 
    const Utils = {
        formatCurrency(amount, includeCents = false) {
            if (typeof amount !== 'number' || isNaN(amount)) return '$0';
            const formatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: includeCents ? 2 : 0,
                maximumFractionDigits: includeCents ? 2 : 0
            });
            return formatter.format(amount);
        },

        formatNumber(num, decimals = 0) {
            if (typeof num !== 'number' || isNaN(num)) return '0';
            return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(num);
        },

        parseCurrency(value) {
            if (typeof value === 'number') return value;
            const cleaned = value.toString().replace(/[$,]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        },

        parsePercentage(value) {
            const cleaned = value.toString().replace(/[%]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        },

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

        showToast(message, type = 'info', duration = 4000) {
            const toastContainer = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
                <i class="fas ${this.getToastIcon(type)}" aria-hidden="true"></i>
                <span>${message}</span>
            `;
            toastContainer.appendChild(toast);

            // Auto remove
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, duration);

            // Click to dismiss
            toast.addEventListener('click', () => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            });
        },

        getToastIcon(type) {
            const icons = {
                success: 'fa-check-circle',
                error: 'fa-exclamation-circle',
                warning: 'fa-exclamation-triangle',
                info: 'fa-info-circle'
            };
            return icons[type] || icons.info;
        },

        formatDate(date) {
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(date);
        },

        announceToScreenReader(message) {
            const announcement = document.getElementById('sr-announcements');
            if (announcement) {
                announcement.textContent = message;
                setTimeout(() => {
                    announcement.textContent = '';
                }, 1000);
            }
        }
    };

    // ========== Enhanced Mortgage Calculator Engine ========== 
    class MortgageEngine {
        static calculateMonthlyPayment(principal, rate, termYears) {
            if (rate === 0) return principal / (termYears * 12);
            const monthlyRate = rate / 100 / 12;
            const numPayments = termYears * 12;
            const monthlyPayment = principal * 
                (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                (Math.pow(1 + monthlyRate, numPayments) - 1);
            return monthlyPayment;
        }

        static calculatePMI(loanAmount, homePrice, downPayment, loanType = 'conventional') {
            const ltvRatio = loanAmount / homePrice;

            if (ltvRatio <= 0.8) return { monthly: 0, annual: 0, rate: 0 };

            let pmiRate = 0;

            if (loanType === 'conventional') {
                if (ltvRatio > 0.95) pmiRate = state.pmiRates.conventional['95+'];
                else if (ltvRatio > 0.90) pmiRate = state.pmiRates.conventional['90-95'];
                else if (ltvRatio > 0.85) pmiRate = state.pmiRates.conventional['85-90'];
                else if (ltvRatio > 0.80) pmiRate = state.pmiRates.conventional['80-85'];
            } else {
                pmiRate = state.pmiRates[loanType] || 0;
            }

            const annualPMI = loanAmount * pmiRate;
            const monthlyPMI = annualPMI / 12;

            return {
                monthly: monthlyPMI,
                annual: annualPMI,
                rate: pmiRate,
                ltv: ltvRatio
            };
        }

        static generateAmortizationSchedule(principal, rate, termYears, extraMonthly = 0, extraOnetime = 0, frequency = 'monthly') {
            const monthlyRate = rate / 100 / 12;
            const originalPayment = this.calculateMonthlyPayment(principal, rate, termYears);
            const schedule = [];
            let balance = principal;
            let totalInterest = 0;
            let totalPrincipal = 0;
            let month = 1;

            // Convert weekly to monthly equivalent
            const extraMonthlyEquivalent = frequency === 'weekly' ? extraMonthly * 4.33 : extraMonthly;

            while (balance > 0.01 && month <= termYears * 12 + 120) {
                const interestPayment = balance * monthlyRate;
                let principalPayment = originalPayment - interestPayment;

                // Add extra payments
                if (extraMonthlyEquivalent > 0) {
                    principalPayment += extraMonthlyEquivalent;
                }

                // One-time extra payment at month 12
                if (month === 12 && extraOnetime > 0) {
                    principalPayment += extraOnetime;
                }

                // Don't overpay
                if (principalPayment > balance) {
                    principalPayment = balance;
                }

                const totalPayment = interestPayment + principalPayment;
                balance -= principalPayment;
                totalInterest += interestPayment;
                totalPrincipal += principalPayment;

                const paymentDate = new Date();
                paymentDate.setMonth(paymentDate.getMonth() + month - 1);

                schedule.push({
                    month: month,
                    date: paymentDate,
                    payment: totalPayment,
                    principal: principalPayment,
                    interest: interestPayment,
                    balance: balance,
                    totalInterest: totalInterest,
                    totalPrincipal: totalPrincipal
                });

                month++;
            }

            return schedule;
        }

        static calculateBreakdown(homePrice, downPayment, interestRate, loanTerm, propertyTax, homeInsurance, extraMonthly = 0, frequency = 'monthly') {
            const loanAmount = homePrice - downPayment;
            const monthlyPI = this.calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
            const monthlyTax = propertyTax / 12;
            const monthlyInsurance = homeInsurance / 12;

            // Calculate PMI with enhanced logic
            const pmiData = this.calculatePMI(loanAmount, homePrice, downPayment);
            const monthlyPMI = pmiData.monthly;

            const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI;

            // Generate amortization schedule to get accurate totals
            const schedule = this.generateAmortizationSchedule(loanAmount, interestRate, loanTerm, extraMonthly, 0, frequency);
            const totalInterest = schedule.length > 0 ? schedule[schedule.length - 1].totalInterest : 0;
            const totalCost = loanAmount + totalInterest;

            // Calculate payoff date
            const currentDate = new Date();
            const payoffDate = new Date(currentDate);
            payoffDate.setMonth(payoffDate.getMonth() + schedule.length);

            return {
                loanAmount: loanAmount,
                monthlyPI: monthlyPI,
                monthlyTax: monthlyTax,
                monthlyInsurance: monthlyInsurance,
                monthlyPMI: monthlyPMI,
                totalMonthly: totalMonthly,
                totalInterest: totalInterest,
                totalCost: totalCost,
                payoffDate: payoffDate,
                ltvRatio: loanAmount / homePrice,
                pmiData: pmiData,
                schedule: schedule
            };
        }
    }

    // ========== Enhanced AI Insights Generator ========== 
    class AIInsights {
        static generateInsights(calculations) {
            const insights = [];
            const { loanAmount, monthlyPI, totalInterest, ltvRatio, monthlyPMI, pmiData, schedule } = calculations;

            // Enhanced down payment insight with PMI details
            if (ltvRatio <= 0.8) {
                insights.push({
                    type: 'success',
                    title: 'Excellent Down Payment Strategy!',
                    message: `Your ${Utils.formatNumber((1 - ltvRatio) * 100, 1)}% down payment eliminates PMI entirely, saving you approximately ${Utils.formatCurrency(this.calculatePMISavings(loanAmount) * 12)}/year. This also demonstrates strong financial health to lenders.`,
                    icon: 'fa-check-circle'
                });
            } else if (ltvRatio >= 0.95) {
                const pmiSavings = this.calculatePMISavings(loanAmount, ltvRatio, 0.8);
                insights.push({
                    type: 'warning',
                    title: 'High PMI Impact - Consider Higher Down Payment',
                    message: `With only ${Utils.formatNumber((1 - ltvRatio) * 100, 1)}% down, you'll pay ${Utils.formatCurrency(monthlyPMI)}/month (${(pmiData.rate * 100).toFixed(2)}% annually) in PMI. Reaching 20% down would save ${Utils.formatCurrency(pmiSavings)}/month.`,
                    icon: 'fa-exclamation-triangle'
                });
            } else {
                const monthsToRemovePMI = this.calculateMonthsToRemovePMI(schedule, loanAmount * 0.8);
                insights.push({
                    type: 'info',
                    title: 'PMI Removal Timeline',
                    message: `Your ${Utils.formatNumber((1 - ltvRatio) * 100, 1)}% down payment requires PMI of ${Utils.formatCurrency(monthlyPMI)}/month. PMI will automatically be removed in approximately ${monthsToRemovePMI} months when you reach 20% equity.`,
                    icon: 'fa-info-circle'
                });
            }

            // Enhanced extra payment analysis
            const extraPaymentSavings = this.calculateExtraPaymentSavings(loanAmount, 6.43, 30, 200, 'monthly');
            if (extraPaymentSavings.savings > 30000) {
                insights.push({
                    type: 'info',
                    title: 'Powerful Extra Payment Opportunity',
                    message: `Adding just $200/month extra could save you ${Utils.formatCurrency(extraPaymentSavings.savings)} in interest and pay off your loan ${extraPaymentSavings.timeSaved} years early. That's like earning ${((extraPaymentSavings.savings / (200 * extraPaymentSavings.timeSaved * 12)) * 100).toFixed(1)}% annual return!`,
                    icon: 'fa-lightbulb'
                });
            }

            // Market rate comparison with personalized advice
            const currentRate = parseFloat(document.getElementById('interest-rate')?.value || 6.43);
            const marketAverage = state.marketRates['30yr'];
            if (currentRate > marketAverage + 0.25) {
                const rateDifference = currentRate - marketAverage;
                const monthlyNatSavings = this.calculateRateSavings(loanAmount, currentRate, marketAverage, 30);
                insights.push({
                    type: 'warning',
                    title: 'Rate Shopping Could Save Thousands',
                    message: `Your rate is ${rateDifference.toFixed(2)}% above market average. A ${rateDifference.toFixed(2)}% rate reduction could save you ${Utils.formatCurrency(monthlyNatSavings)}/month or ${Utils.formatCurrency(monthlyNatSavings * 360)} over the loan term.`,
                    icon: 'fa-search'
                });
            } else if (currentRate < marketAverage - 0.15) {
                insights.push({
                    type: 'success',
                    title: 'Outstanding Interest Rate!',
                    message: `Your rate is ${(marketAverage - currentRate).toFixed(2)}% below market average, saving you approximately ${Utils.formatCurrency(this.calculateRateSavings(loanAmount, marketAverage, currentRate, 30))}/month compared to typical borrowers.`,
                    icon: 'fa-star'
                });
            }

            // Debt-to-income insights with market context
            const monthlyIncome = this.estimateMonthlyIncome(calculations.totalMonthly);
            if (monthlyIncome) {
                const dtiRatio = (calculations.totalMonthly / monthlyIncome) * 100;
                if (dtiRatio <= 25) {
                    insights.push({
                        type: 'success',
                        title: 'Conservative Payment Ratio',
                        message: `Your estimated housing payment of ${dtiRatio.toFixed(1)}% of income is well below the 28% guideline, providing excellent financial flexibility and emergency fund capacity.`,
                        icon: 'fa-thumbs-up'
                    });
                } else if (dtiRatio > 33) {
                    insights.push({
                        type: 'warning',
                        title: 'High Payment-to-Income Ratio',
                        message: `At ${dtiRatio.toFixed(1)}% of estimated income, this payment may strain your budget. Consider a home 10-15% less expensive or increase your down payment to improve affordability.`,
                        icon: 'fa-exclamation-triangle'
                    });
                }
            }

            // Loan term optimization insight
            if (loanAmount > 0) {
                const fifteenYearComparison = this.compareLoanTerms(loanAmount, currentRate, 15, 30);
                if (fifteenYearComparison.monthlySavings > 50000) {
                    insights.push({
                        type: 'info',
                        title: '15-Year Loan Comparison',
                        message: `A 15-year loan would increase payments by ${Utils.formatCurrency(fifteenYearComparison.monthlyDifference)} but save ${Utils.formatCurrency(fifteenYearComparison.monthlySavings)} in total interest. Consider if the higher payment fits your budget.`,
                        icon: 'fa-calculator'
                    });
                }
            }

            return insights;
        }

        static calculateExtraPaymentSavings(principal, rate, termYears, extraMonthly, frequency = 'monthly') {
            const standardSchedule = MortgageEngine.generateAmortizationSchedule(principal, rate, termYears);
            const extraSchedule = MortgageEngine.generateAmortizationSchedule(principal, rate, termYears, extraMonthly, 0, frequency);

            const standardTotalInterest = standardSchedule.length > 0 ? standardSchedule[standardSchedule.length - 1].totalInterest : 0;
            const extraTotalInterest = extraSchedule.length > 0 ? extraSchedule[extraSchedule.length - 1].totalInterest : 0;

            const savings = standardTotalInterest - extraTotalInterest;
            const timeSaved = (standardSchedule.length - extraSchedule.length) / 12;

            return {
                savings: Math.max(0, savings),
                timeSaved: Math.max(0, Math.round(timeSaved * 10) / 10)
            };
        }

        static calculatePMISavings(loanAmount, currentLTV = 0.95, targetLTV = 0.8) {
            const currentPMIRate = currentLTV > 0.95 ? 0.01 : currentLTV > 0.9 ? 0.008 : 0.006;
            const targetPMIRate = targetLTV <= 0.8 ? 0 : 0.005;
            return (loanAmount * (currentPMIRate - targetPMIRate)) / 12;
        }

        static calculateMonthsToRemovePMI(schedule, targetBalance) {
            for (let i = 0; i < schedule.length; i++) {
                if (schedule[i].balance <= targetBalance) {
                    return i + 1;
                }
            }
            return schedule.length;
        }

        static calculateRateSavings(loanAmount, currentRate, newRate, termYears) {
            const currentPayment = MortgageEngine.calculateMonthlyPayment(loanAmount, currentRate, termYears);
            const newPayment = MortgageEngine.calculateMonthlyPayment(loanAmount, newRate, termYears);
            return Math.max(0, currentPayment - newPayment);
        }

        static compareLoanTerms(loanAmount, rate, shortTerm, longTerm) {
            const shortPayment = MortgageEngine.calculateMonthlyPayment(loanAmount, rate, shortTerm);
            const longPayment = MortgageEngine.calculateMonthlyPayment(loanAmount, rate, longTerm);

            const shortTotalInterest = (shortPayment * shortTerm * 12) - loanAmount;
            const longTotalInterest = (longPayment * longTerm * 12) - loanAmount;

            return {
                monthlyDifference: shortPayment - longPayment,
                monthlySavings: longTotalInterest - shortTotalInterest
            };
        }

        static estimateMonthlyIncome(monthlyPayment) {
            // Assume payment should be ~27% of gross income for estimation
            return monthlyPayment / 0.27;
        }
    }

    // ========== Enhanced Voice Control System ========== 
    class VoiceController {
        constructor() {
            this.recognition = null;
            this.isListening = false;
            this.commands = this.initializeCommands();
            this.synthesis = window.speechSynthesis;
        }

        initializeCommands() {
            return {
                'calculate': () => this.triggerCalculation(),
                'reset': () => this.resetForm(),
                'set home price *': (price) => this.setInput('home-price', price),
                'set down payment *': (amount) => this.setInput('down-payment', amount),
                'set interest rate *': (rate) => this.setInput('interest-rate', rate),
                'set loan term * years': (term) => this.setLoanTerm(term),
                'show payment breakdown': () => this.switchTab('payment-breakdown'),
                'show chart': () => this.switchTab('mortgage-chart'),
                'show insights': () => this.switchTab('ai-insights'),
                'show schedule': () => this.switchTab('amortization'),
                'show amortization': () => this.switchTab('amortization'),
                'enable dark mode': () => this.toggleTheme(true),
                'enable light mode': () => this.toggleTheme(false),
                'export pdf': () => this.exportPDF(),
                'print results': () => this.printResults(),
                'help': () => this.speakHelp()
            };
        }

        initialize() {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                Utils.showToast('Voice control is not supported in this browser', 'warning');
                return false;
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceStatus('Listening... Say a command or "help"');
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateVoiceStatus('', false);
            };

            this.recognition.onerror = (event) => {
                console.error('Voice recognition error:', event.error);
                this.updateVoiceStatus('Voice error occurred', false);
            };

            this.recognition.onresult = (event) => {
                const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
                this.processCommand(command);
            };

            return true;
        }

        toggle() {
            if (!this.recognition) {
                if (!this.initialize()) return;
            }

            if (this.isListening) {
                this.stop();
            } else {
                this.start();
            }
        }

        start() {
            try {
                this.recognition.start();
                state.voiceEnabled = true;
                Utils.announceToScreenReader('Voice control activated');
            } catch (error) {
                console.error('Failed to start voice recognition:', error);
                Utils.showToast('Failed to start voice control', 'error');
            }
        }

        stop() {
            if (this.recognition) {
                this.recognition.stop();
            }
            state.voiceEnabled = false;
            this.isListening = false;
            this.updateVoiceStatus('', false);
            Utils.announceToScreenReader('Voice control deactivated');
        }

        processCommand(command) {
            console.log('Voice command:', command);
            this.updateVoiceStatus(`Processing: "${command}"`);

            for (const [pattern, handler] of Object.entries(this.commands)) {
                if (pattern.includes('*')) {
                    const regex = new RegExp(pattern.replace('*', '(.+)'));
                    const match = command.match(regex);
                    if (match) {
                        handler(match[1]);
                        return;
                    }
                } else if (command.includes(pattern)) {
                    handler();
                    return;
                }
            }

            this.speak("Sorry, I didn't understand that command. Say 'help' for available commands.");
        }

        updateVoiceStatus(message, show = true) {
            const voiceStatus = document.getElementById('voice-status');
            const voiceText = document.getElementById('voice-text');

            if (show && message) {
                if (voiceText) voiceText.textContent = message;
                if (voiceStatus) voiceStatus.style.display = 'flex';

                setTimeout(() => {
                    if (voiceText && voiceText.textContent === message) {
                        if (voiceStatus) voiceStatus.style.display = 'none';
                    }
                }, 3000);
            } else {
                if (voiceStatus) voiceStatus.style.display = 'none';
            }
        }

        speak(text) {
            if (this.synthesis) {
                this.synthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                utterance.pitch = 1;
                this.synthesis.speak(utterance);
            }
        }

        // Enhanced command handlers
        triggerCalculation() {
            const calculateBtn = document.getElementById('calculate-btn');
            if (calculateBtn) {
                calculateBtn.click();
                this.speak('Calculating your mortgage payment');
            }
        }

        resetForm() {
            const resetBtn = document.getElementById('reset-form');
            if (resetBtn) {
                resetBtn.click();
                this.speak('Form has been reset');
            }
        }

        setInput(inputId, value) {
            const input = document.getElementById(inputId);
            if (input) {
                const numericValue = value.replace(/[^0-9.]/g, '');
                input.value = numericValue;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                this.speak(`Set ${inputId.replace('-', ' ')} to ${numericValue}`);
            }
        }

        setLoanTerm(term) {
            const termChips = document.querySelectorAll('.term-chip');
            const termValue = term.replace(/[^0-9]/g, '');
            termChips.forEach(chip => {
                if (chip.dataset.term === termValue) {
                    chip.click();
                    this.speak(`Set loan term to ${termValue} years`);
                }
            });
        }

        switchTab(tabName) {
            const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
            if (tabBtn) {
                tabBtn.click();
                this.speak(`Switched to ${tabName.replace('-', ' ')} tab`);
            }
        }

        toggleTheme(isDark) {
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle && ((isDark && !state.darkMode) || (!isDark && state.darkMode))) {
                themeToggle.click();
                this.speak(`Switched to ${isDark ? 'dark' : 'light'} mode`);
            }
        }

        exportPDF() {
            const exportBtn = document.getElementById('export-pdf');
            if (exportBtn) {
                exportBtn.click();
                this.speak('Exporting results to PDF');
            }
        }

        printResults() {
            const printBtn = document.getElementById('print-results');
            if (printBtn) {
                printBtn.click();
                this.speak('Printing results');
            }
        }

        speakHelp() {
            const helpText = `Available commands: Calculate, Reset, Set home price, Set down payment, Set interest rate, Set loan term, Show payment breakdown, Show chart, Show insights, Show schedule, Export PDF, Print results, Enable dark mode, Enable light mode.`;
            this.speak(helpText);
        }
    }

    // ========== Enhanced Chart Management ========== 
    class ChartManager {
        constructor() {
            this.chart = null;
            this.canvas = document.getElementById('mortgage-timeline-chart');
            this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        }

        createMortgageChart(amortizationData) {
            if (!this.ctx || !amortizationData.length) return;

            this.destroyChart();

            // Prepare data for yearly intervals
            const yearlyData = this.prepareYearlyData(amortizationData);

            const config = {
                type: 'line',
                data: {
                    labels: yearlyData.labels,
                    datasets: [{
                        label: 'Remaining Balance',
                        data: yearlyData.balance,
                        borderColor: 'rgb(168, 75, 47)',
                        backgroundColor: 'rgba(168, 75, 47, 0.1)',
                        fill: true,
                        tension: 0.2
                    }, {
                        label: 'Principal Paid',
                        data: yearlyData.principalPaid,
                        borderColor: 'rgb(33, 128, 141)',
                        backgroundColor: 'rgba(33, 128, 141, 0.1)',
                        fill: true,
                        tension: 0.2
                    }]
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
                                text: 'Year'
                            },
                            grid: {
                                color: 'rgba(94, 82, 64, 0.1)'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Amount ($)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return Utils.formatCurrency(value);
                                }
                            },
                            grid: {
                                color: 'rgba(94, 82, 64, 0.1)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${Utils.formatCurrency(context.parsed.y)}`;
                                }
                            }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeInOutQuart'
                    }
                }
            };

            this.chart = new Chart(this.ctx, config);
            this.updateChartLegend(amortizationData[0]);
        }

        prepareYearlyData(amortizationData) {
            const yearlyData = {
                labels: [],
                balance: [],
                principalPaid: []
            };

            // Get data points for each year
            for (let year = 1; year <= Math.ceil(amortizationData.length / 12); year++) {
                const monthIndex = Math.min((year * 12) - 1, amortizationData.length - 1);
                const dataPoint = amortizationData[monthIndex] || amortizationData[amortizationData.length - 1];

                yearlyData.labels.push(`Year ${year}`);
                yearlyData.balance.push(dataPoint.balance);
                yearlyData.principalPaid.push(dataPoint.totalPrincipal);
            }

            return yearlyData;
        }

        updateChartLegend(dataPoint) {
            if (!dataPoint) return;

            const remainingBalance = document.getElementById('remaining-balance');
            const principalPaid = document.getElementById('principal-paid');
            const interestPaid = document.getElementById('interest-paid');

            if (remainingBalance) remainingBalance.textContent = Utils.formatCurrency(dataPoint.balance);
            if (principalPaid) principalPaid.textContent = Utils.formatCurrency(dataPoint.totalPrincipal);
            if (interestPaid) interestPaid.textContent = Utils.formatCurrency(dataPoint.totalInterest);
        }

        updateYearSlider(amortizationData) {
            const slider = document.getElementById('year-range');
            const yearLabel = document.getElementById('year-label');
            const yearDetails = document.getElementById('year-details');

            if (!slider || !amortizationData.length) return;

            const maxYear = Math.ceil(amortizationData.length / 12);
            slider.max = maxYear;

            slider.oninput = (e) => {
                const year = parseInt(e.target.value);
                const monthIndex = Math.min((year * 12) - 1, amortizationData.length - 1);
                const dataPoint = amortizationData[monthIndex];

                if (yearLabel) yearLabel.textContent = `Year ${year}`;
                if (yearDetails) yearDetails.textContent = `Viewing Year ${year} details`;

                this.updateChartLegend(dataPoint);
                Utils.announceToScreenReader(`Viewing year ${year} mortgage details`);
            };
        }

        destroyChart() {
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
        }
    }

    // ========== Enhanced Form Management ========== 
    class FormManager {
        constructor() {
            this.form = document.querySelector('.mortgage-form');
            this.inputs = {};
            this.validators = {};
            this.initializeInputs();
            this.setupEventListeners();
        }

        initializeInputs() {
            this.inputs = {
                homePrice: document.getElementById('home-price'),
                downPayment: document.getElementById('down-payment'),
                downPaymentPercent: document.getElementById('down-payment-percent'),
                interestRate: document.getElementById('interest-rate'),
                loanTerm: document.getElementById('loan-term'),
                customTerm: document.getElementById('custom-term'),
                propertyState: document.getElementById('property-state'),
                propertyTax: document.getElementById('property-tax'),
                homeInsurance: document.getElementById('home-insurance'),
                pmi: document.getElementById('pmi'),
                extraMonthly: document.getElementById('extra-monthly'),
                extraOnetime: document.getElementById('extra-onetime')
            };

            this.populateStatesDropdown();
            this.setupInputFormatting();
            this.setupInputValidation();
        }

        populateStatesDropdown() {
            const stateSelect = this.inputs.propertyState;
            if (!stateSelect) return;

            stateSelect.innerHTML = '<option value="">Select your state</option>';

            Object.keys(state.stateData).forEach(stateName => {
                const option = document.createElement('option');
                option.value = stateName;
                option.textContent = stateName;
                stateSelect.appendChild(option);
            });
        }

        setupInputFormatting() {
            const currencyInputs = ['home-price', 'down-payment', 'property-tax', 'home-insurance', 'extra-monthly', 'extra-onetime'];
            currencyInputs.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.addEventListener('input', this.formatCurrencyInput.bind(this));
                    input.addEventListener('blur', this.formatCurrencyInput.bind(this));
                }
            });

            const percentInputs = ['interest-rate', 'down-payment-percent'];
            percentInputs.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.addEventListener('input', this.validatePercentInput.bind(this));
                }
            });
        }

        formatCurrencyInput(e) {
            const input = e.target;
            let value = input.value.replace(/[^0-9.]/g, '');
            if (value) {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    input.value = Utils.formatNumber(numValue);
                }
            }
        }

        validatePercentInput(e) {
            const input = e.target;
            let value = input.value.replace(/[^0-9.]/g, '');
            if (value) {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    if (input.id === 'interest-rate' && numValue > 20) {
                        input.value = '20';
                    } else if (input.id === 'down-payment-percent' && numValue > 100) {
                        input.value = '100';
                    } else {
                        input.value = value;
                    }
                }
            }
        }

        setupEventListeners() {
            // Down payment toggle
            const amountToggle = document.getElementById('amount-toggle');
            const percentToggle = document.getElementById('percent-toggle');

            if (amountToggle && percentToggle) {
                amountToggle.addEventListener('click', () => this.toggleDownPaymentMode('amount'));
                percentToggle.addEventListener('click', () => this.toggleDownPaymentMode('percent'));
            }

            // Term selection
            const termChips = document.querySelectorAll('.term-chip');
            termChips.forEach(chip => {
                chip.addEventListener('click', () => this.selectLoanTerm(chip.dataset.term));
            });

            // Custom term input
            if (this.inputs.customTerm) {
                this.inputs.customTerm.addEventListener('input', (e) => {
                    if (e.target.value) {
                        this.selectLoanTerm(e.target.value);
                        termChips.forEach(chip => chip.classList.remove('active'));
                    }
                });
            }

            // State selection
            if (this.inputs.propertyState) {
                this.inputs.propertyState.addEventListener('change', this.updateLocationBasedData.bind(this));
            }

            // Enhanced Extra Payment Frequency Toggle
            const monthlyToggle = document.getElementById('monthly-toggle');
            const weeklyToggle = document.getElementById('weekly-toggle');

            if (monthlyToggle && weeklyToggle) {
                monthlyToggle.addEventListener('click', () => this.setExtraPaymentFrequency('monthly'));
                weeklyToggle.addEventListener('click', () => this.setExtraPaymentFrequency('weekly'));
            }

            // Real-time calculation triggers
            const calculationTriggers = [
                'home-price', 'down-payment', 'down-payment-percent', 
                'interest-rate', 'property-tax', 'home-insurance', 'extra-monthly'
            ];

            calculationTriggers.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.addEventListener('input', Utils.debounce(() => {
                        this.updatePMICalculation();
                        this.updateExtraPaymentPreview();
                        this.triggerCalculation();
                    }, 500));
                }
            });

            // Sync down payment values
            if (this.inputs.downPayment) {
                this.inputs.downPayment.addEventListener('input', () => this.syncDownPaymentValues('amount'));
            }
            if (this.inputs.downPaymentPercent) {
                this.inputs.downPaymentPercent.addEventListener('input', () => this.syncDownPaymentValues('percent'));
            }

            // Suggestion chips
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('suggestion-chip')) {
                    const targetInput = e.target.dataset.input;
                    const value = e.target.dataset.value;
                    const input = document.getElementById(targetInput);
                    if (input) {
                        input.value = Utils.formatNumber(parseFloat(value));
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            });
        }

        toggleDownPaymentMode(mode) {
            const amountInput = document.getElementById('amount-input');
            const percentInput = document.getElementById('percent-input');
            const amountToggle = document.getElementById('amount-toggle');
            const percentToggle = document.getElementById('percent-toggle');

            if (mode === 'amount') {
                if (amountInput) amountInput.style.display = 'block';
                if (percentInput) percentInput.style.display = 'none';
                if (amountToggle) amountToggle.classList.add('active');
                if (percentToggle) percentToggle.classList.remove('active');

                this.syncDownPaymentValues('amount');
            } else {
                if (amountInput) amountInput.style.display = 'none';
                if (percentInput) percentInput.style.display = 'block';
                if (amountToggle) amountToggle.classList.remove('active');
                if (percentToggle) percentToggle.classList.add('active');

                this.syncDownPaymentValues('percent');
            }
        }

        syncDownPaymentValues(sourceMode) {
            const homePrice = Utils.parseCurrency(this.inputs.homePrice?.value || 0);
            const downPaymentAmount = Utils.parseCurrency(this.inputs.downPayment?.value || 0);
            const downPaymentPercent = Utils.parsePercentage(this.inputs.downPaymentPercent?.value || 0);

            if (sourceMode === 'amount' && homePrice > 0 && downPaymentAmount >= 0) {
                const percent = (downPaymentAmount / homePrice) * 100;
                if (this.inputs.downPaymentPercent) {
                    this.inputs.downPaymentPercent.value = Utils.formatNumber(percent, 1);
                }
            } else if (sourceMode === 'percent' && homePrice > 0 && downPaymentPercent >= 0) {
                const amount = (homePrice * downPaymentPercent) / 100;
                if (this.inputs.downPayment) {
                    this.inputs.downPayment.value = Utils.formatNumber(amount);
                }
            }

            this.updatePMICalculation();
        }

        // Enhanced PMI auto-calculation
        updatePMICalculation() {
            const homePrice = Utils.parseCurrency(this.inputs.homePrice?.value || 0);
            const downPayment = Utils.parseCurrency(this.inputs.downPayment?.value || 0);
            const pmiInput = this.inputs.pmi;
            const pmiWarning = document.getElementById('pmi-warning');
            const pmiPercentageDisplay = document.getElementById('pmi-percentage-display');

            if (homePrice > 0 && downPayment >= 0) {
                const loanAmount = homePrice - downPayment;
                const pmiData = MortgageEngine.calculatePMI(loanAmount, homePrice, downPayment);

                if (pmiInput) {
                    pmiInput.value = Utils.formatNumber(pmiData.monthly);
                }

                if (pmiPercentageDisplay) {
                    pmiPercentageDisplay.textContent = `${(pmiData.rate * 100).toFixed(2)}%`;
                }

                if (pmiWarning) {
                    if (pmiData.ltv > 0.8) {
                        pmiWarning.style.display = 'flex';
                        pmiWarning.querySelector('span').textContent = 
                            `PMI required: ${Utils.formatCurrency(pmiData.monthly)}/month at ${(pmiData.rate * 100).toFixed(2)}% annually`;
                    } else {
                        pmiWarning.style.display = 'none';
                    }
                }
            }
        }

        selectLoanTerm(term) {
            const termChips = document.querySelectorAll('.term-chip');
            termChips.forEach(chip => {
                chip.classList.toggle('active', chip.dataset.term === term);
                chip.setAttribute('aria-checked', chip.dataset.term === term ? 'true' : 'false');
            });

            if (this.inputs.loanTerm) {
                this.inputs.loanTerm.value = term;
            }
            this.triggerCalculation();
        }

        updateLocationBasedData() {
            const selectedState = this.inputs.propertyState?.value;
            const homePrice = Utils.parseCurrency(this.inputs.homePrice?.value || 0);

            if (selectedState && state.stateData[selectedState] && homePrice > 0) {
                const stateData = state.stateData[selectedState];

                // Update property tax
                const annualTax = homePrice * stateData.tax;
                if (this.inputs.propertyTax) {
                    this.inputs.propertyTax.value = Utils.formatNumber(annualTax);
                }

                // Update home insurance
                if (this.inputs.homeInsurance) {
                    this.inputs.homeInsurance.value = Utils.formatNumber(stateData.insurance);
                }

                // Update help text
                const taxHelp = document.getElementById('tax-help');
                const insuranceHelp = document.getElementById('insurance-help');

                if (taxHelp) {
                    taxHelp.textContent = `${selectedState} average: ${(stateData.tax * 100).toFixed(2)}% of home value`;
                }
                if (insuranceHelp) {
                    insuranceHelp.textContent = `${selectedState} average: $${Utils.formatNumber(stateData.insurance)}`;
                }

                this.triggerCalculation();
            }
        }

        // Enhanced extra payment frequency handling
        setExtraPaymentFrequency(frequency) {
            const monthlyToggle = document.getElementById('monthly-toggle');
            const weeklyToggle = document.getElementById('weekly-toggle');
            const extraLabel = document.querySelector('label[for="extra-monthly"]');

            if (frequency === 'monthly') {
                if (monthlyToggle) monthlyToggle.classList.add('active');
                if (weeklyToggle) weeklyToggle.classList.remove('active');
                if (extraLabel) extraLabel.textContent = 'Extra Payment Amount (Monthly)';
            } else {
                if (monthlyToggle) monthlyToggle.classList.remove('active');
                if (weeklyToggle) weeklyToggle.classList.add('active');
                if (extraLabel) extraLabel.textContent = 'Extra Payment Amount (Weekly)';
            }

            state.extraPaymentFrequency = frequency;
            this.updateExtraPaymentPreview();
            this.triggerCalculation();
        }

        updateExtraPaymentPreview() {
            const extraAmount = Utils.parseCurrency(this.inputs.extraMonthly?.value || 0);
            const savingsPreview = document.getElementById('savings-preview');
            const homePrice = Utils.parseCurrency(this.inputs.homePrice?.value || 0);
            const downPayment = Utils.parseCurrency(this.inputs.downPayment?.value || 0);
            const interestRate = Utils.parsePercentage(this.inputs.interestRate?.value || 6.43);
            const loanTerm = parseInt(this.inputs.loanTerm?.value || 30);

            if (extraAmount > 0 && homePrice > downPayment) {
                const loanAmount = homePrice - downPayment;
                const savings = AIInsights.calculateExtraPaymentSavings(
                    loanAmount, 
                    interestRate, 
                    loanTerm, 
                    extraAmount,
                    state.extraPaymentFrequency
                );

                if (savingsPreview) {
                    const frequencyText = state.extraPaymentFrequency === 'weekly' ? 'weekly' : 'monthly';
                    savingsPreview.textContent = 
                        `${Utils.formatCurrency(extraAmount)} ${frequencyText} saves ${Utils.formatCurrency(savings.savings)} in interest and pays off ${savings.timeSaved} years early`;
                    savingsPreview.classList.add('text-success');
                }
            } else {
                if (savingsPreview) {
                    savingsPreview.textContent = 'Add extra payments to see potential savings';
                    savingsPreview.classList.remove('text-success');
                }
            }
        }

        triggerCalculation() {
            const event = new CustomEvent('calculate');
            document.dispatchEvent(event);
        }

        getFormData() {
            const homePrice = Utils.parseCurrency(this.inputs.homePrice?.value || 0);
            const downPayment = Utils.parseCurrency(this.inputs.downPayment?.value || 0);
            const interestRate = Utils.parsePercentage(this.inputs.interestRate?.value || 0);
            const loanTerm = parseInt(this.inputs.loanTerm?.value) || parseInt(this.inputs.customTerm?.value) || 30;
            const propertyTax = Utils.parseCurrency(this.inputs.propertyTax?.value || 0);
            const homeInsurance = Utils.parseCurrency(this.inputs.homeInsurance?.value || 0);
            const extraMonthly = Utils.parseCurrency(this.inputs.extraMonthly?.value || 0);
            const extraOnetime = Utils.parseCurrency(this.inputs.extraOnetime?.value || 0);

            return {
                homePrice,
                downPayment,
                interestRate,
                loanTerm,
                propertyTax,
                homeInsurance,
                extraMonthly,
                extraOnetime,
                extraPaymentFrequency: state.extraPaymentFrequency
            };
        }

        reset() {
            // Reset to default values
            if (this.inputs.homePrice) this.inputs.homePrice.value = '400,000';
            if (this.inputs.downPayment) this.inputs.downPayment.value = '80,000';
            if (this.inputs.downPaymentPercent) this.inputs.downPaymentPercent.value = '20';
            if (this.inputs.interestRate) this.inputs.interestRate.value = '6.43';
            if (this.inputs.propertyTax) this.inputs.propertyTax.value = '7,240';
            if (this.inputs.homeInsurance) this.inputs.homeInsurance.value = '1,600';
            if (this.inputs.pmi) this.inputs.pmi.value = '0';
            if (this.inputs.extraMonthly) this.inputs.extraMonthly.value = '0';
            if (this.inputs.extraOnetime) this.inputs.extraOnetime.value = '0';
            if (this.inputs.propertyState) this.inputs.propertyState.value = '';
            if (this.inputs.customTerm) this.inputs.customTerm.value = '';

            // Reset term selection to 30 years
            this.selectLoanTerm('30');

            // Reset toggles
            this.toggleDownPaymentMode('amount');
            this.setExtraPaymentFrequency('monthly');

            // Hide PMI warning
            const pmiWarning = document.getElementById('pmi-warning');
            if (pmiWarning) pmiWarning.style.display = 'none';

            Utils.showToast('Form has been reset', 'info');
            Utils.announceToScreenReader('Mortgage calculator form has been reset');
        }

        setupInputValidation() {
            this.validators = {
                homePrice: (value) => {
                    const num = Utils.parseCurrency(value);
                    return num > 0 && num <= 10000000;
                },
                downPayment: (value) => {
                    const num = Utils.parseCurrency(value);
                    const homePrice = Utils.parseCurrency(this.inputs.homePrice?.value || 0);
                    return num >= 0 && num <= homePrice;
                },
                interestRate: (value) => {
                    const num = Utils.parsePercentage(value);
                    return num > 0 && num <= 20;
                },
                loanTerm: (value) => {
                    const num = parseInt(value);
                    return num >= 5 && num <= 50;
                }
            };
        }

        validateForm() {
            const formData = this.getFormData();
            const errors = [];

            if (!this.validators.homePrice(formData.homePrice)) {
                errors.push('Home price must be between $1 and $10,000,000');
            }
            if (!this.validators.downPayment(formData.downPayment)) {
                errors.push('Down payment cannot exceed home price');
            }
            if (!this.validators.interestRate(formData.interestRate)) {
                errors.push('Interest rate must be between 0.1% and 20%');
            }
            if (!this.validators.loanTerm(formData.loanTerm)) {
                errors.push('Loan term must be between 5 and 50 years');
            }

            return errors;
        }
    }

    // ========== Enhanced Results Display Manager ========== 
    class ResultsManager {
        constructor() {
            this.elements = this.initializeElements();
            this.chartManager = new ChartManager();
        }

        initializeElements() {
            return {
                totalPayment: document.getElementById('total-payment'),
                principalInterest: document.getElementById('principal-interest'),
                monthlyTax: document.getElementById('monthly-tax'),
                monthlyInsurance: document.getElementById('monthly-insurance'),
                monthlyPMI: document.getElementById('monthly-pmi'),
                displayLoanAmount: document.getElementById('display-loan-amount'),
                displayTotalInterest: document.getElementById('display-total-interest'),
                displayTotalCost: document.getElementById('display-total-cost'),
                displayPayoffDate: document.getElementById('display-payoff-date'),
                chartLoanAmount: document.getElementById('chart-loan-amount'),
                aiInsights: document.getElementById('ai-insights')
            };
        }

        updateResults(calculations) {
            // Update payment highlight
            if (this.elements.totalPayment) {
                this.elements.totalPayment.textContent = Utils.formatCurrency(calculations.totalMonthly);
            }

            // Update payment breakdown
            if (this.elements.principalInterest) {
                this.elements.principalInterest.textContent = Utils.formatCurrency(calculations.monthlyPI);
            }
            if (this.elements.monthlyTax) {
                this.elements.monthlyTax.textContent = Utils.formatCurrency(calculations.monthlyTax);
            }
            if (this.elements.monthlyInsurance) {
                this.elements.monthlyInsurance.textContent = Utils.formatCurrency(calculations.monthlyInsurance);
            }
            if (this.elements.monthlyPMI) {
                this.elements.monthlyPMI.textContent = Utils.formatCurrency(calculations.monthlyPMI);
            }

            // Update loan summary
            if (this.elements.displayLoanAmount) {
                this.elements.displayLoanAmount.textContent = Utils.formatCurrency(calculations.loanAmount);
            }
            if (this.elements.displayTotalInterest) {
                this.elements.displayTotalInterest.textContent = Utils.formatCurrency(calculations.totalInterest);
            }
            if (this.elements.displayTotalCost) {
                this.elements.displayTotalCost.textContent = Utils.formatCurrency(calculations.totalCost);
            }
            if (this.elements.displayPayoffDate) {
                const payoffDate = new Date(calculations.payoffDate);
                this.elements.displayPayoffDate.textContent = payoffDate.toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric'
                });
            }

            // Update chart description
            if (this.elements.chartLoanAmount) {
                this.elements.chartLoanAmount.textContent = 
                    `Based on a ${Utils.formatCurrency(calculations.loanAmount)} mortgage`;
            }

            // Update breakdown bars
            this.updateBreakdownBars(calculations);

            Utils.announceToScreenReader(
                `Monthly payment calculated: ${Utils.formatCurrency(calculations.totalMonthly)}`
            );
        }

        updateBreakdownBars(calculations) {
            const total = calculations.totalMonthly;
            const piPercentage = (calculations.monthlyPI / total) * 100;
            const taxPercentage = (calculations.monthlyTax / total) * 100;
            const insurancePercentage = (calculations.monthlyInsurance / total) * 100;
            const pmiPercentage = (calculations.monthlyPMI / total) * 100;

            const piFill = document.getElementById('pi-fill');
            const taxFill = document.getElementById('tax-fill');
            const insuranceFill = document.getElementById('insurance-fill');
            const pmiFill = document.getElementById('pmi-fill');

            if (piFill) piFill.style.width = `${piPercentage}%`;
            if (taxFill) taxFill.style.width = `${taxPercentage}%`;
            if (insuranceFill) insuranceFill.style.width = `${insurancePercentage}%`;
            if (pmiFill) pmiFill.style.width = `${pmiPercentage}%`;
        }

        updateChart(amortizationData) {
            this.chartManager.createMortgageChart(amortizationData);
            this.chartManager.updateYearSlider(amortizationData);
        }

        updateAIInsights(calculations) {
            if (!this.elements.aiInsights) return;

            const insights = AIInsights.generateInsights(calculations);
            this.elements.aiInsights.innerHTML = insights.map(insight => `
                <div class="insight-item ${insight.type}">
                    <i class="fas ${insight.icon} insight-icon" aria-hidden="true"></i>
                    <div class="insight-content">
                        <h5>${insight.title}</h5>
                        <p>${insight.message}</p>
                    </div>
                </div>
            `).join('');
        }

        updateAmortizationTable(amortizationData) {
            const tableBody = document.getElementById('amortization-table-body');
            if (!tableBody || !amortizationData.length) return;

            const startIndex = (state.currentPage - 1) * state.itemsPerPage;
            const endIndex = Math.min(startIndex + state.itemsPerPage, amortizationData.length);
            const pageData = amortizationData.slice(startIndex, endIndex);

            tableBody.innerHTML = pageData.map(payment => `
                <tr>
                    <td>${payment.month}</td>
                    <td>${Utils.formatDate(payment.date)}</td>
                    <td>${Utils.formatCurrency(payment.payment)}</td>
                    <td>${Utils.formatCurrency(payment.principal)}</td>
                    <td>${Utils.formatCurrency(payment.interest)}</td>
                    <td>${Utils.formatCurrency(payment.balance)}</td>
                </tr>
            `).join('');

            this.updatePagination(amortizationData.length);
        }

        updatePagination(totalItems) {
            const totalPages = Math.ceil(totalItems / state.itemsPerPage);
            const paginationText = document.getElementById('pagination-text');
            const prevBtn = document.getElementById('prev-page');
            const nextBtn = document.getElementById('next-page');

            if (paginationText) {
                paginationText.textContent = `Page ${state.currentPage} of ${totalPages}`;
            }

            if (prevBtn) {
                prevBtn.disabled = state.currentPage <= 1;
                prevBtn.onclick = () => {
                    if (state.currentPage > 1) {
                        state.currentPage--;
                        this.updateAmortizationTable(state.amortizationData);
                    }
                };
            }

            if (nextBtn) {
                nextBtn.disabled = state.currentPage >= totalPages;
                nextBtn.onclick = () => {
                    if (state.currentPage < totalPages) {
                        state.currentPage++;
                        this.updateAmortizationTable(state.amortizationData);
                    }
                };
            }
        }

        clearResults() {
            if (this.elements.totalPayment) {
                this.elements.totalPayment.textContent = '$0';
            }

            ['principalInterest', 'monthlyTax', 'monthlyInsurance', 'monthlyPMI'].forEach(key => {
                if (this.elements[key]) {
                    this.elements[key].textContent = '$0';
                }
            });

            if (this.elements.aiInsights) {
                this.elements.aiInsights.innerHTML = `
                    <div class="insight-item info">
                        <i class="fas fa-info-circle insight-icon" aria-hidden="true"></i>
                        <div class="insight-content">
                            <h5>Ready for AI Insights</h5>
                            <p>Enter your mortgage details to see personalized AI insights and recommendations.</p>
                        </div>
                    </div>
                `;
            }

            const tableBody = document.getElementById('amortization-table-body');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-state">Calculate to view payment schedule</td>
                    </tr>
                `;
            }
        }
    }

    // ========== Enhanced Tab Management ========== 
    class TabManager {
        constructor() {
            this.activeTab = 'payment-breakdown';
            this.setupTabListeners();
        }

        setupTabListeners() {
            const tabBtns = document.querySelectorAll('.tab-btn');
            tabBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const tabId = btn.dataset.tab;
                    this.switchTab(tabId);
                });
            });
        }

        switchTab(tabId) {
            // Update button states
            const tabBtns = document.querySelectorAll('.tab-btn');
            tabBtns.forEach(btn => {
                const isActive = btn.dataset.tab === tabId;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-selected', isActive);
            });

            // Update content visibility
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => {
                const isActive = content.id === `${tabId}-tab`;
                content.classList.toggle('active', isActive);

                if (isActive) {
                    content.setAttribute('aria-hidden', 'false');
                } else {
                    content.setAttribute('aria-hidden', 'true');
                }
            });

            this.activeTab = tabId;
            Utils.announceToScreenReader(`Switched to ${tabId.replace('-', ' ')} tab`);
        }

        getActiveTab() {
            return this.activeTab;
        }
    }

    // ========== Enhanced PDF/Print Export System ========== 
    class ExportManager {
        constructor() {
            this.setupExportListeners();
        }

        setupExportListeners() {
            // Share URL
            const shareBtn = document.getElementById('share-url');
            if (shareBtn) {
                shareBtn.addEventListener('click', this.shareURL.bind(this));
            }

            // Export PDF
            const exportBtn = document.getElementById('export-pdf');
            if (exportBtn) {
                exportBtn.addEventListener('click', this.exportPDF.bind(this));
            }

            // Print Results
            const printBtn = document.getElementById('print-results');
            if (printBtn) {
                printBtn.addEventListener('click', this.printResults.bind(this));
            }
        }

        shareURL() {
            const formData = formManager.getFormData();
            const params = new URLSearchParams();

            Object.keys(formData).forEach(key => {
                if (formData[key] !== 0 && formData[key] !== '') {
                    params.set(key, formData[key]);
                }
            });

            const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

            if (navigator.share) {
                navigator.share({
                    title: 'Mortgage Calculator Results - FinGuid',
                    text: `Check out my mortgage calculation: ${Utils.formatCurrency(state.calculations.totalMonthly)}/month`,
                    url: shareUrl
                });
            } else {
                // Fallback to copy to clipboard
                navigator.clipboard.writeText(shareUrl).then(() => {
                    Utils.showToast('Share URL copied to clipboard!', 'success');
                }).catch(() => {
                    Utils.showToast('Unable to copy URL', 'error');
                });
            }

            Utils.announceToScreenReader('Calculation shared');
        }

        async exportPDF() {
            if (!window.html2pdf) {
                Utils.showToast('PDF export library not loaded', 'error');
                return;
            }

            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) loadingOverlay.style.display = 'grid';

            try {
                // Create comprehensive export content
                const exportContent = this.createExportContent();

                const options = {
                    margin: 0.5,
                    filename: `FinGuid-Mortgage-Analysis-${new Date().toISOString().split('T')[0]}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { 
                        scale: 2,
                        useCORS: true,
                        allowTaint: true 
                    },
                    jsPDF: { 
                        unit: 'in', 
                        format: 'letter', 
                        orientation: 'portrait' 
                    }
                };

                await html2pdf().set(options).from(exportContent).save();
                Utils.showToast('PDF exported successfully!', 'success');
                Utils.announceToScreenReader('PDF export completed');

            } catch (error) {
                console.error('PDF export error:', error);
                Utils.showToast('Failed to export PDF', 'error');
            } finally {
                if (loadingOverlay) loadingOverlay.style.display = 'none';
            }
        }

        createExportContent() {
            const formData = formManager.getFormData();
            const calculations = state.calculations;

            const exportDiv = document.createElement('div');
            exportDiv.style.cssText = `
                font-family: 'Inter', sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                color: #1f2937;
                background: white;
            `;

            exportDiv.innerHTML = `
                <!-- Header -->
                <div style="text-align: center; border-bottom: 3px solid #0f766e; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="color: #0f766e; margin: 0; font-size: 28px; font-weight: 700;">
                        🏠 FinGuid Mortgage Analysis Report
                    </h1>
                    <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 16px;">
                        Generated on ${new Date().toLocaleDateString()} | World's #1 AI-Enhanced Calculator
                    </p>
                </div>

                <!-- Key Results Summary -->
                <div style="background: linear-gradient(135deg, #0f766e, #06b6d4); color: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; text-align: center;">
                    <h2 style="margin: 0 0 15px 0; font-size: 18px;">Monthly Payment</h2>
                    <div style="font-size: 36px; font-weight: 700; margin-bottom: 10px;">
                        ${Utils.formatCurrency(calculations?.totalMonthly || 0)}
                    </div>
                    <p style="margin: 0; opacity: 0.9; font-size: 14px;">
                        Based on ${Utils.formatCurrency(formData.homePrice)} home price • ${formData.loanTerm} year term • ${formData.interestRate}% interest rate
                    </p>
                </div>

                <!-- Payment Breakdown -->
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #0f766e; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">
                        💰 Payment Breakdown
                    </h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div style="padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #0f766e;">
                            <strong>Principal & Interest:</strong><br>
                            <span style="font-size: 18px; color: #0f766e;">${Utils.formatCurrency(calculations?.monthlyPI || 0)}</span>
                        </div>
                        <div style="padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #ea580c;">
                            <strong>Property Tax:</strong><br>
                            <span style="font-size: 18px; color: #ea580c;">${Utils.formatCurrency(calculations?.monthlyTax || 0)}</span>
                        </div>
                        <div style="padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #7c3aed;">
                            <strong>Home Insurance:</strong><br>
                            <span style="font-size: 18px; color: #7c3aed;">${Utils.formatCurrency(calculations?.monthlyInsurance || 0)}</span>
                        </div>
                        <div style="padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #dc2626;">
                            <strong>PMI:</strong><br>
                            <span style="font-size: 18px; color: #dc2626;">${Utils.formatCurrency(calculations?.monthlyPMI || 0)}</span>
                        </div>
                    </div>
                </div>

                <!-- Loan Summary -->
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #0f766e; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">
                        📊 Loan Summary
                    </h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; text-align: center;">
                        <div style="padding: 15px; background: #f0fdf4; border-radius: 8px;">
                            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px;">Loan Amount</div>
                            <div style="font-size: 18px; font-weight: 600; color: #059669;">${Utils.formatCurrency(calculations?.loanAmount || 0)}</div>
                        </div>
                        <div style="padding: 15px; background: #fef3c7; border-radius: 8px;">
                            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px;">Total Interest</div>
                            <div style="font-size: 18px; font-weight: 600; color: #d97706;">${Utils.formatCurrency(calculations?.totalInterest || 0)}</div>
                        </div>
                        <div style="padding: 15px; background: #fde2e8; border-radius: 8px;">
                            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px;">Total Cost</div>
                            <div style="font-size: 18px; font-weight: 600; color: #dc2626;">${Utils.formatCurrency(calculations?.totalCost || 0)}</div>
                        </div>
                        <div style="padding: 15px; background: #e0f2fe; border-radius: 8px;">
                            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px;">Payoff Date</div>
                            <div style="font-size: 18px; font-weight: 600; color: #0369a1;">${calculations?.payoffDate ? new Date(calculations.payoffDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</div>
                        </div>
                    </div>
                </div>

                <!-- AI Insights -->
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #0f766e; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">
                        🤖 AI-Powered Insights
                    </h3>
                    ${this.generateAIInsightsForExport(calculations)}
                </div>

                <!-- Input Parameters -->
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #0f766e; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">
                        📋 Calculation Parameters
                    </h3>
                    <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div><strong>Home Price:</strong> ${Utils.formatCurrency(formData.homePrice)}</div>
                            <div><strong>Down Payment:</strong> ${Utils.formatCurrency(formData.downPayment)}</div>
                            <div><strong>Interest Rate:</strong> ${formData.interestRate}%</div>
                            <div><strong>Loan Term:</strong> ${formData.loanTerm} years</div>
                            <div><strong>Property Tax:</strong> ${Utils.formatCurrency(formData.propertyTax)}/year</div>
                            <div><strong>Home Insurance:</strong> ${Utils.formatCurrency(formData.homeInsurance)}/year</div>
                            ${formData.extraMonthly > 0 ? `<div><strong>Extra Payment:</strong> ${Utils.formatCurrency(formData.extraMonthly)}/${formData.extraPaymentFrequency}</div>` : ''}
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; border-top: 2px solid #d1d5db; padding-top: 20px; margin-top: 30px;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                        Generated by <strong style="color: #0f766e;">FinGuid</strong> - World's #1 AI-Enhanced Mortgage Calculator<br>
                        Visit us at <strong>www.finguid.com</strong> | This analysis is for informational purposes only
                    </p>
                </div>
            `;

            return exportDiv;
        }

        generateAIInsightsForExport(calculations) {
            if (!calculations) return '<p>No insights available - please calculate first.</p>';

            const insights = AIInsights.generateInsights(calculations);
            return insights.map(insight => `
                <div style="margin-bottom: 15px; padding: 15px; background: #f8fafc; border-left: 4px solid ${this.getInsightColor(insight.type)}; border-radius: 6px;">
                    <h4 style="margin: 0 0 8px 0; color: ${this.getInsightColor(insight.type)}; font-size: 16px;">
                        ${insight.title}
                    </h4>
                    <p style="margin: 0; color: #4b5563; line-height: 1.5; font-size: 14px;">
                        ${insight.message}
                    </p>
                </div>
            `).join('');
        }

        getInsightColor(type) {
            const colors = {
                success: '#059669',
                warning: '#d97706',
                info: '#0369a1',
                error: '#dc2626'
            };
            return colors[type] || colors.info;
        }

        printResults() {
            const originalContents = document.body.innerHTML;
            const exportContent = this.createExportContent();

            // Create print styles
            const printStyles = `
                <style>
                    @media print {
                        body { margin: 0; }
                        * { -webkit-print-color-adjust: exact; color-adjust: exact; }
                    }
                </style>
            `;

            document.body.innerHTML = printStyles + exportContent.outerHTML;
            window.print();
            document.body.innerHTML = originalContents;

            // Reinitialize after print
            setTimeout(() => {
                window.location.reload();
            }, 100);

            Utils.announceToScreenReader('Results printed');
        }
    }

    // ========== Enhanced Application Controller ========== 
    class MortgageCalculatorApp {
        constructor() {
            this.formManager = null;
            this.resultsManager = null;
            this.voiceController = null;
            this.tabManager = null;
            this.exportManager = null;

            this.init();
        }

        async init() {
            try {
                // Initialize managers
                this.formManager = new FormManager();
                this.resultsManager = new ResultsManager();
                this.voiceController = new VoiceController();
                this.tabManager = new TabManager();
                this.exportManager = new ExportManager();

                // Setup global event listeners
                this.setupGlobalEventListeners();

                // Setup theme management
                this.setupThemeManagement();

                // Setup accessibility features
                this.setupAccessibilityFeatures();

                // Load URL parameters
                this.loadURLParameters();

                // Initial calculation
                this.performCalculation();

                console.log('✅ Mortgage Calculator App initialized successfully');
                Utils.showToast('Calculator ready! Try voice commands or start calculating.', 'success', 3000);

            } catch (error) {
                console.error('❌ Failed to initialize app:', error);
                Utils.showToast('Failed to initialize calculator', 'error');
            }
        }

        setupGlobalEventListeners() {
            // Calculate button
            document.addEventListener('calculate', () => {
                this.performCalculation();
            });

            // Calculate button click
            const calculateBtn = document.getElementById('calculate-btn');
            if (calculateBtn) {
                calculateBtn.addEventListener('click', () => {
                    this.performCalculation();
                });
            }

            // Reset button
            const resetBtn = document.getElementById('reset-form');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.formManager.reset();
                    this.resultsManager.clearResults();
                });
            }

            // Voice control toggle
            const voiceToggle = document.getElementById('voice-toggle');
            if (voiceToggle) {
                voiceToggle.addEventListener('click', () => {
                    this.voiceController.toggle();
                });
            }

            // Handle page visibility changes
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && this.voiceController.isListening) {
                    this.voiceController.stop();
                }
            });
        }

        setupThemeManagement() {
            const themeToggle = document.getElementById('theme-toggle');
            const themeIcon = themeToggle?.querySelector('i');

            if (themeToggle) {
                themeToggle.addEventListener('click', () => {
                    const currentTheme = document.documentElement.getAttribute('data-theme');
                    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

                    document.documentElement.setAttribute('data-theme', newTheme);
                    state.darkMode = newTheme === 'dark';

                    if (themeIcon) {
                        themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
                    }

                    localStorage.setItem('theme', newTheme);
                    Utils.announceToScreenReader(`Switched to ${newTheme} mode`);
                });

                // Load saved theme
                const savedTheme = localStorage.getItem('theme');
                if (savedTheme) {
                    document.documentElement.setAttribute('data-theme', savedTheme);
                    state.darkMode = savedTheme === 'dark';
                    if (themeIcon) {
                        themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
                    }
                }
            }
        }

        setupAccessibilityFeatures() {
            // Font size controls
            const fontIncrease = document.getElementById('font-increase');
            const fontDecrease = document.getElementById('font-decrease');

            if (fontIncrease) {
                fontIncrease.addEventListener('click', () => {
                    state.fontScale = Math.min(1.5, state.fontScale + 0.1);
                    document.documentElement.style.fontSize = `${state.fontScale}rem`;
                    Utils.announceToScreenReader('Font size increased');
                });
            }

            if (fontDecrease) {
                fontDecrease.addEventListener('click', () => {
                    state.fontScale = Math.max(0.8, state.fontScale - 0.1);
                    document.documentElement.style.fontSize = `${state.fontScale}rem`;
                    Utils.announceToScreenReader('Font size decreased');
                });
            }

            // Keyboard navigation improvements
            document.addEventListener('keydown', (e) => {
                // ESC to close voice control
                if (e.key === 'Escape' && this.voiceController.isListening) {
                    this.voiceController.stop();
                }

                // Tab navigation for tabs
                if (e.key === 'Tab' && e.target.classList.contains('tab-btn')) {
                    e.preventDefault();
                    const tabs = [...document.querySelectorAll('.tab-btn')];
                    const currentIndex = tabs.indexOf(e.target);
                    const nextIndex = e.shiftKey 
                        ? (currentIndex - 1 + tabs.length) % tabs.length
                        : (currentIndex + 1) % tabs.length;
                    tabs[nextIndex].focus();
                }
            });
        }

        loadURLParameters() {
            const params = new URLSearchParams(window.location.search);
            const formData = {};

            // Map URL parameters to form fields
            const paramMap = {
                homePrice: 'home-price',
                downPayment: 'down-payment',
                interestRate: 'interest-rate',
                loanTerm: 'loan-term',
                propertyTax: 'property-tax',
                homeInsurance: 'home-insurance',
                extraMonthly: 'extra-monthly'
            };

            params.forEach((value, key) => {
                if (paramMap[key]) {
                    const input = document.getElementById(paramMap[key]);
                    if (input) {
                        input.value = value;
                        formData[key] = value;
                    }
                }
            });

            // Update extra payment frequency if specified
            if (params.has('extraPaymentFrequency')) {
                this.formManager.setExtraPaymentFrequency(params.get('extraPaymentFrequency'));
            }

            // Trigger calculation if parameters were loaded
            if (Object.keys(formData).length > 0) {
                setTimeout(() => this.performCalculation(), 100);
            }
        }

        performCalculation() {
            const formData = this.formManager.getFormData();
            const errors = this.formManager.validateForm();

            if (errors.length > 0) {
                errors.forEach(error => Utils.showToast(error, 'error'));
                return;
            }

            try {
                // Calculate mortgage details
                const calculations = MortgageEngine.calculateBreakdown(
                    formData.homePrice,
                    formData.downPayment,
                    formData.interestRate,
                    formData.loanTerm,
                    formData.propertyTax,
                    formData.homeInsurance,
                    formData.extraMonthly,
                    formData.extraPaymentFrequency
                );

                // Store results in global state
                state.updateCalculations(calculations);
                state.amortizationData = calculations.schedule;

                // Update all displays
                this.resultsManager.updateResults(calculations);
                this.resultsManager.updateChart(calculations.schedule);
                this.resultsManager.updateAIInsights(calculations);
                this.resultsManager.updateAmortizationTable(calculations.schedule);

                // Reset pagination
                state.currentPage = 1;

                Utils.announceToScreenReader(
                    `Calculation complete. Monthly payment: ${Utils.formatCurrency(calculations.totalMonthly)}`
                );

            } catch (error) {
                console.error('Calculation error:', error);
                Utils.showToast('Error performing calculation', 'error');
            }
        }

        // Public API methods for external integration
        getCalculationData() {
            return {
                formData: this.formManager.getFormData(),
                calculations: state.calculations,
                amortizationData: state.amortizationData
            };
        }

        updateFormField(fieldId, value) {
            const input = document.getElementById(fieldId);
            if (input) {
                input.value = value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }

        switchToTab(tabId) {
            this.tabManager.switchTab(tabId);
        }
    }

    // ========== Initialize Application ========== 
    let app;
    let formManager;

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }

    function initializeApp() {
        try {
            app = new MortgageCalculatorApp();
            formManager = app.formManager;

            // Make app globally available for debugging
            if (typeof window !== 'undefined') {
                window.mortgageCalculator = app;
            }

        } catch (error) {
            console.error('Failed to initialize Mortgage Calculator:', error);

            // Show user-friendly error message
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: #fee2e2; color: #dc2626; padding: 20px; border-radius: 8px;
                border: 1px solid #fca5a5; max-width: 400px; text-align: center; z-index: 10000;
            `;
            errorDiv.innerHTML = `
                <h3>Calculator Initialization Error</h3>
                <p>Please refresh the page to try again.</p>
                <button onclick="window.location.reload()" style="
                    background: #dc2626; color: white; border: none; padding: 8px 16px; 
                    border-radius: 4px; cursor: pointer; margin-top: 10px;
                ">Refresh Page</button>
            `;
            document.body.appendChild(errorDiv);
        }
    }

})();
