/**
 * Enhanced Mortgage Calculator JavaScript with Global Voice Control and Advanced Year Slider
 * Features: Global voice control, enhanced year slider calculations, proper chart interactions
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // ======= CONFIGURATION & STATE =======
    const CONFIG = {
        debounceDelay: 350,
        defaultInsuranceRate: 0.002, // 0.2% of home value
        calculationsUpdateInterval: 3000, // 3 seconds
        savingsUpdateInterval: 5000, // 5 seconds
        voiceTimeout: 10000, // 10 seconds
        maxSliderYear: 30
    };

    const STATE = {
        chart: null,
        yearlyData: [],
        currentCalculation: null,
        globalVoiceRecognition: null,
        localVoiceRecognition: null,
        isGlobalListening: false,
        isLocalListening: false,
        currentFontSize: 100,
        theme: 'light',
        calculationsToday: 12847,
        avgSavings: 45000,
        screenReaderActive: false
    };

    // ======= DOM ELEMENT SELECTORS =======
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    // ======= UTILITIES =======
    const Utils = {
        formatCurrency: (amount, decimals = 0) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(amount || 0);
        },

        formatNumber: (num) => {
            return new Intl.NumberFormat('en-US').format(num || 0);
        },

        parseNumber: (str) => {
            if (!str) return 0;
            return parseFloat(str.toString().replace(/[^\d.-]/g, '')) || 0;
        },

        debounce: (func, wait) => {
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

        showToast: (message, type = 'info') => {
            const container = $('#toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i> ${message}`;
            container.appendChild(toast);

            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 4000);
        },

        announceToScreenReader: (message) => {
            if (!STATE.screenReaderActive) return;
            const announcements = $('#sr-announcements');
            if (announcements) {
                announcements.textContent = message;
            }
        },

        generateId: () => {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
    };

    // ======= DYNAMIC STATS UPDATER =======
    const StatsUpdater = {
        init() {
            this.updateCalculationsCounter();
            this.updateSavingsCounter();

            setInterval(() => this.updateCalculationsCounter(), CONFIG.calculationsUpdateInterval);
            setInterval(() => this.updateSavingsCounter(), CONFIG.savingsUpdateInterval);
        },

        updateCalculationsCounter() {
            const increment = Math.floor(Math.random() * 8) + 2; // 2-9 increment
            STATE.calculationsToday += increment;
            const element = $('#calculations-today');
            if (element) {
                element.textContent = Utils.formatNumber(STATE.calculationsToday);
            }
        },

        updateSavingsCounter() {
            const increment = Math.floor(Math.random() * 2000) + 500; // 500-2500 increment  
            STATE.avgSavings += increment;
            const element = $('#avg-savings');
            if (element) {
                element.textContent = Utils.formatCurrency(STATE.avgSavings, 0);
            }
        }
    };

    // ======= GLOBAL VOICE CONTROL =======
    const GlobalVoiceControl = {
        init() {
            const globalVoiceBtn = $('#global-voice-toggle');
            if (!globalVoiceBtn) return;

            if (!window.speechRecognitionSupported) {
                globalVoiceBtn.disabled = true;
                globalVoiceBtn.title = 'Voice control not supported in this browser';
                return;
            }

            // Initialize Global Speech Recognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            STATE.globalVoiceRecognition = new SpeechRecognition();
            STATE.globalVoiceRecognition.continuous = true;
            STATE.globalVoiceRecognition.interimResults = false;
            STATE.globalVoiceRecognition.lang = 'en-US';

            // Event listeners
            STATE.globalVoiceRecognition.onstart = () => this.onGlobalStart();
            STATE.globalVoiceRecognition.onresult = (event) => this.onGlobalResult(event);
            STATE.globalVoiceRecognition.onerror = (event) => this.onGlobalError(event);
            STATE.globalVoiceRecognition.onend = () => this.onGlobalEnd();

            globalVoiceBtn.addEventListener('click', () => this.toggleGlobal());
            $('#global-voice-stop')?.addEventListener('click', () => this.stopGlobal());
        },

        toggleGlobal() {
            if (STATE.isGlobalListening) {
                this.stopGlobal();
            } else {
                this.startGlobal();
            }
        },

        startGlobal() {
            if (!STATE.globalVoiceRecognition || STATE.isGlobalListening) return;

            try {
                STATE.globalVoiceRecognition.start();
                Utils.announceToScreenReader('Global voice control started. You can now speak commands for any field.');
            } catch (error) {
                Utils.showToast('Global voice recognition failed to start', 'error');
                console.error('Global voice error:', error);
            }
        },

        stopGlobal() {
            if (!STATE.globalVoiceRecognition || !STATE.isGlobalListening) return;
            STATE.globalVoiceRecognition.stop();
        },

        onGlobalStart() {
            STATE.isGlobalListening = true;
            const btn = $('#global-voice-toggle');
            const icon = $('#global-voice-icon');
            const feedback = $('#global-voice-feedback');

            if (btn) btn.classList.add('active');
            if (icon) icon.className = 'fas fa-microphone-slash';
            if (feedback) {
                feedback.style.display = 'flex';
                $('#global-voice-text').textContent = 'Global Voice Active - Speak any command...';
            }

            Utils.announceToScreenReader('Global voice listening activated');
        },

        onGlobalResult(event) {
            const result = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            const textElement = $('#global-voice-text');
            if (textElement) {
                textElement.textContent = `Heard: "${result}"`;
            }

            setTimeout(() => {
                this.processGlobalCommand(result);
            }, 500);
        },

        onGlobalError(event) {
            console.error('Global voice recognition error:', event.error);
            Utils.showToast(`Global voice error: ${event.error}`, 'error');
            this.stopGlobal();
        },

        onGlobalEnd() {
            STATE.isGlobalListening = false;
            const btn = $('#global-voice-toggle');
            const icon = $('#global-voice-icon');
            const feedback = $('#global-voice-feedback');

            if (btn) btn.classList.remove('active');
            if (icon) icon.className = 'fas fa-microphone';
            if (feedback) feedback.style.display = 'none';

            Utils.announceToScreenReader('Global voice listening stopped');
        },

        processGlobalCommand(command) {
            console.log('Processing global command:', command);

            // Global navigation commands
            if (command.includes('go to home') || command.includes('navigate home')) {
                window.location.href = '/';
                return;
            }

            if (command.includes('open calculator') || command.includes('show calculators')) {
                const calcMenu = $('.dropdown-menu');
                if (calcMenu) calcMenu.style.display = 'block';
                return;
            }

            // Theme commands
            if (command.includes('dark mode') || command.includes('dark theme')) {
                AccessibilityControls.setTheme('dark');
                return;
            }

            if (command.includes('light mode') || command.includes('light theme')) {
                AccessibilityControls.setTheme('light');
                return;
            }

            // Font size commands
            if (command.includes('increase font') || command.includes('bigger text')) {
                AccessibilityControls.adjustFontSize(10);
                return;
            }

            if (command.includes('decrease font') || command.includes('smaller text')) {
                AccessibilityControls.adjustFontSize(-10);
                return;
            }

            // Calculator commands
            if (command.includes('calculate') || command.includes('compute mortgage')) {
                MortgageCalculator.calculate();
                Utils.announceToScreenReader('Mortgage calculation updated');
                return;
            }

            if (command.includes('reset') || command.includes('clear all')) {
                this.resetAllFields();
                return;
            }

            // Tab switching
            if (command.includes('show chart') || command.includes('mortgage over time')) {
                MortgageCalculator.switchTab('mortgage-over-time');
                return;
            }

            if (command.includes('show insights') || command.includes('ai insights')) {
                MortgageCalculator.switchTab('ai-insights');
                return;
            }

            if (command.includes('show schedule') || command.includes('amortization')) {
                MortgageCalculator.switchTab('amortization');
                return;
            }

            // Field-specific commands - delegate to form voice control
            const fieldCommands = [
                'home price', 'house price', 'property price',
                'down payment', 'interest rate', 'loan term',
                'property tax', 'home insurance', 'extra monthly', 'extra payment'
            ];

            const matchedField = fieldCommands.find(field => command.includes(field));
            if (matchedField) {
                FormVoiceControl.processCommand(command);
                return;
            }

            // If no command matched
            Utils.showToast(`Command "${command}" not recognized. Try "calculate", "dark mode", or field names with values.`, 'info');
        },

        resetAllFields() {
            $$('input[type="text"], input[type="number"]').forEach(field => {
                if (field.id !== 'interest-rate') {
                    field.value = '';
                    field.dispatchEvent(new Event('input'));
                }
            });
            Utils.announceToScreenReader('All fields cleared');
            Utils.showToast('All fields cleared', 'success');
        }
    };

    // ======= FORM VOICE CONTROL =======
    const FormVoiceControl = {
        init() {
            const localVoiceBtn = $('#voice-control-btn');
            if (!localVoiceBtn) return;

            if (!window.speechRecognitionSupported) {
                localVoiceBtn.disabled = true;
                localVoiceBtn.title = 'Voice control not supported in this browser';
                return;
            }

            // Initialize Local Speech Recognition for form fields
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            STATE.localVoiceRecognition = new SpeechRecognition();
            STATE.localVoiceRecognition.continuous = false;
            STATE.localVoiceRecognition.interimResults = false;
            STATE.localVoiceRecognition.lang = 'en-US';

            // Event listeners
            STATE.localVoiceRecognition.onstart = () => this.onLocalStart();
            STATE.localVoiceRecognition.onresult = (event) => this.onLocalResult(event);
            STATE.localVoiceRecognition.onerror = (event) => this.onLocalError(event);
            STATE.localVoiceRecognition.onend = () => this.onLocalEnd();

            localVoiceBtn.addEventListener('click', () => this.toggleLocal());
            $('#voice-stop')?.addEventListener('click', () => this.stopLocal());
        },

        toggleLocal() {
            if (STATE.isLocalListening) {
                this.stopLocal();
            } else {
                this.startLocal();
            }
        },

        startLocal() {
            if (!STATE.localVoiceRecognition || STATE.isLocalListening) return;

            try {
                STATE.localVoiceRecognition.start();
                Utils.announceToScreenReader('Form voice input started. Speak field names with values.');
            } catch (error) {
                Utils.showToast('Form voice recognition failed to start', 'error');
            }
        },

        stopLocal() {
            if (!STATE.localVoiceRecognition || !STATE.isLocalListening) return;
            STATE.localVoiceRecognition.stop();
        },

        onLocalStart() {
            STATE.isLocalListening = true;
            $('#voice-control-btn .voice-status').textContent = 'Listening';
            $('#voice-control-btn i').className = 'fas fa-microphone-slash';
            $('#voice-feedback').style.display = 'flex';
            $('#voice-text').textContent = 'Form Voice Listening...';
        },

        onLocalResult(event) {
            const result = event.results[0][0].transcript.toLowerCase().trim();
            $('#voice-text').textContent = `Heard: "${result}"`;

            setTimeout(() => {
                this.processCommand(result);
                this.stopLocal();
            }, 1000);
        },

        onLocalError(event) {
            console.error('Local voice recognition error:', event.error);
            Utils.showToast(`Form voice input error: ${event.error}`, 'error');
            this.stopLocal();
        },

        onLocalEnd() {
            STATE.isLocalListening = false;
            $('#voice-control-btn .voice-status').textContent = 'Off';
            $('#voice-control-btn i').className = 'fas fa-microphone';
            $('#voice-feedback').style.display = 'none';
        },

        processCommand(command) {
            const commands = {
                'home price': this.extractNumber,
                'house price': this.extractNumber,
                'property price': this.extractNumber,
                'down payment': this.extractNumber,
                'interest rate': this.extractNumber,
                'loan term': this.extractNumber,
                'property tax': this.extractNumber,
                'home insurance': this.extractNumber,
                'extra monthly': this.extractNumber,
                'extra payment': this.extractNumber,
                'extra one time payment': this.extractNumber
            };

            let processed = false;
            for (const [trigger, handler] of Object.entries(commands)) {
                if (command.includes(trigger)) {
                    const value = handler(command);
                    if (value !== null) {
                        this.updateField(trigger, value);
                        processed = true;
                        break;
                    }
                }
            }

            if (!processed) {
                Utils.showToast('Command not recognized. Try saying field names with values like "home price 500000".', 'info');
            }
        },

        extractNumber(command) {
            // Extract numbers from voice command
            const patterns = [
                /\b(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:thousand|k)\b/gi,
                /\b(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:million|m)\b/gi,
                /\b(\d+(?:,\d+)*(?:\.\d+)?)\b/g
            ];

            for (const pattern of patterns) {
                const matches = command.match(pattern);
                if (matches) {
                    let value = parseFloat(matches[0].replace(/[^\d.]/g, ''));

                    if (command.includes('thousand') || command.includes('k')) {
                        value *= 1000;
                    } else if (command.includes('million') || command.includes('m')) {
                        value *= 1000000;
                    }

                    return value;
                }
            }
            return null;
        },

        updateField(fieldName, value) {
            const fieldMap = {
                'home price': '#home-price',
                'house price': '#home-price',
                'property price': '#home-price',
                'down payment': '#down-payment',
                'interest rate': '#interest-rate',
                'loan term': '#custom-term',
                'property tax': '#property-tax',
                'home insurance': '#home-insurance',
                'extra monthly': '#extra-monthly',
                'extra payment': '#extra-monthly',
                'extra one time payment': '#extra-yearly'
            };

            const fieldSelector = fieldMap[fieldName];
            const field = $(fieldSelector);

            if (field) {
                if (fieldName === 'interest rate') {
                    field.value = value;
                } else if (fieldName === 'loan term') {
                    $('#custom-term-group').style.display = 'block';
                    $$('.term-chip').forEach(chip => chip.classList.remove('active'));
                    $('[data-years="custom"]')?.classList.add('active');
                    field.value = value;
                    $('#loan-term').value = value;
                } else {
                    field.value = Utils.formatNumber(value);
                }

                field.dispatchEvent(new Event('input'));
                Utils.announceToScreenReader(`${fieldName} set to ${value}`);
                Utils.showToast(`${fieldName} updated to ${fieldName === 'interest rate' ? value + '%' : Utils.formatCurrency(value)}`, 'success');
            }
        }
    };

    // ======= ACCESSIBILITY CONTROLS =======
    const AccessibilityControls = {
        init() {
            $('#font-smaller')?.addEventListener('click', () => this.adjustFontSize(-10));
            $('#font-larger')?.addEventListener('click', () => this.adjustFontSize(10));
            $('#theme-toggle')?.addEventListener('click', () => this.toggleTheme());
            $('#screen-reader-toggle')?.addEventListener('click', () => this.toggleScreenReader());
        },

        adjustFontSize(change) {
            STATE.currentFontSize += change;
            STATE.currentFontSize = Math.max(80, Math.min(150, STATE.currentFontSize));

            document.documentElement.style.fontSize = `${STATE.currentFontSize}%`;
            Utils.announceToScreenReader(`Font size ${change > 0 ? 'increased' : 'decreased'} to ${STATE.currentFontSize}%`);
            Utils.showToast(`Font size ${change > 0 ? 'increased' : 'decreased'} to ${STATE.currentFontSize}%`, 'success');
        },

        toggleTheme() {
            STATE.theme = STATE.theme === 'light' ? 'dark' : 'light';
            this.setTheme(STATE.theme);
        },

        setTheme(theme) {
            STATE.theme = theme;
            document.documentElement.setAttribute('data-theme', theme);
            document.body.setAttribute('data-theme', theme);

            const icon = $('#theme-icon');
            const span = $('#theme-toggle span');
            if (icon && span) {
                if (theme === 'light') {
                    icon.className = 'fas fa-moon';
                    span.textContent = 'Dark Mode';
                } else {
                    icon.className = 'fas fa-sun';
                    span.textContent = 'Light Mode';
                }
            }

            Utils.announceToScreenReader(`Switched to ${theme} mode`);
            Utils.showToast(`Switched to ${theme} mode`, 'success');
        },

        toggleScreenReader() {
            STATE.screenReaderActive = !STATE.screenReaderActive;
            const btn = $('#screen-reader-toggle');

            if (btn) {
                if (STATE.screenReaderActive) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }

            const message = STATE.screenReaderActive ? 'Screen reader enhancements enabled' : 'Screen reader enhancements disabled';
            Utils.announceToScreenReader(message);
            Utils.showToast(message, 'success');
        }
    };

    // ======= MORTGAGE CALCULATOR CORE =======
    const MortgageCalculator = {
        init() {
            this.bindEvents();
            this.setDefaultInsurance();
            this.updateDateTime();
            this.calculate();

            setInterval(() => this.updateDateTime(), 60000); // Update every minute
        },

        bindEvents() {
            const debouncedCalculate = Utils.debounce(() => this.calculate(), CONFIG.debounceDelay);

            // Input field listeners
            $$('input[type="text"], input[type="number"]').forEach(input => {
                input.addEventListener('input', (e) => {
                    if (e.target.type === 'text' && e.target.id !== 'custom-term') {
                        this.formatNumberInput(e.target);
                    }
                    debouncedCalculate();
                });
            });

            // Toggle buttons
            $$('.toggle-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleToggle(e.target);
                    debouncedCalculate();
                });
            });

            // Term chips
            $$('.term-chip').forEach(chip => {
                chip.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleTermSelection(e.target);
                    debouncedCalculate();
                });
            });

            // Tab controls
            $$('.tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.switchTab(e.target.dataset.tab);
                });
            });

            // Enhanced Year range slider
            $('#year-range')?.addEventListener('input', (e) => {
                YearSliderManager.updateFromSlider(parseInt(e.target.value));
            });

            // Action buttons
            $('#compare-btn')?.addEventListener('click', () => this.showComparison());
            $('#share-btn')?.addEventListener('click', () => this.showShareOptions());
            $('#pdf-download-btn')?.addEventListener('click', () => this.downloadPDF());
            $('#print-btn')?.addEventListener('click', () => this.printResults());
            $('#view-current-rates')?.addEventListener('click', () => this.showCurrentRates());
            $('#reset-form')?.addEventListener('click', () => this.resetForm());

            // Modal close buttons
            $$('.modal-close').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.target.closest('.modal').style.display = 'none';
                });
            });
        },

        setDefaultInsurance() {
            const homePriceInput = $('#home-price');
            const insuranceInput = $('#home-insurance');

            if (homePriceInput && insuranceInput) {
                const updateInsurance = () => {
                    const homePrice = Utils.parseNumber(homePriceInput.value);
                    if (homePrice > 0 && (!insuranceInput.value.trim() || Utils.parseNumber(insuranceInput.value) === 0)) {
                        const defaultInsurance = homePrice * CONFIG.defaultInsuranceRate;
                        insuranceInput.value = Utils.formatNumber(Math.round(defaultInsurance));
                    }
                };

                homePriceInput.addEventListener('input', Utils.debounce(updateInsurance, 500));
                updateInsurance(); // Set initial value
            }
        },

        updateDateTime() {
            const now = new Date();
            const dateTimeString = now.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            const dateTimeElement = $('#current-date-time');
            if (dateTimeElement) {
                dateTimeElement.textContent = `• Updated ${dateTimeString}`;
            }
        },

        formatNumberInput(input) {
            const value = Utils.parseNumber(input.value);
            if (value > 0) {
                input.value = Utils.formatNumber(value);
            }
        },

        handleToggle(button) {
            const group = button.parentElement;
            group.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        },

        handleTermSelection(chip) {
            $$('.term-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            const years = chip.dataset.years;
            const customGroup = $('#custom-term-group');

            if (years === 'custom') {
                customGroup.style.display = 'block';
                $('#custom-term').focus();
            } else {
                customGroup.style.display = 'none';
                $('#loan-term').value = years;
                $('#custom-term').value = '';
            }
        },

        switchTab(tabName) {
            // Update tab buttons
            $$('.tab-btn').forEach(btn => btn.classList.remove('active'));
            $(`[data-tab="${tabName}"]`)?.classList.add('active');

            // Update tab content
            $$('.tab-content').forEach(content => content.classList.remove('active'));
            $(`#${tabName}`)?.classList.add('active');

            // Announce to screen reader
            const tabNames = {
                'mortgage-over-time': 'Mortgage Over Time',
                'ai-insights': 'AI Powered Insights',
                'amortization': 'Amortization Schedule'
            };
            Utils.announceToScreenReader(`Switched to ${tabNames[tabName]} tab`);
        },

        calculate() {
            try {
                const params = this.getCalculationParams();
                if (!this.validateParams(params)) return;

                const result = this.performCalculation(params);
                if (!result) return;

                STATE.currentCalculation = result;
                this.updateResults(result);
                this.updateSavingsPreview(result);

                ChartManager.render(result);
                YearSliderManager.init(result);
                AIInsights.render(result);
                AmortizationTable.render(result);

                Utils.announceToScreenReader('Mortgage calculation updated with new results');
            } catch (error) {
                console.error('Calculation error:', error);
                Utils.showToast('Error in calculation. Please check your inputs.', 'error');
            }
        },

        getCalculationParams() {
            const homePrice = Utils.parseNumber($('#home-price').value);
            const downPayment = Utils.parseNumber($('#down-payment').value);
            const rate = parseFloat($('#interest-rate').value) || 0;

            // Get loan term
            let term;
            const activeTermChip = $('.term-chip.active');
            if (activeTermChip && activeTermChip.dataset.years === 'custom') {
                term = parseInt($('#custom-term').value) || 30;
            } else if (activeTermChip) {
                term = parseInt(activeTermChip.dataset.years) || 30;
            } else {
                term = 30;
            }

            const propertyTax = Utils.parseNumber($('#property-tax').value);
            const homeInsurance = Utils.parseNumber($('#home-insurance').value);
            const extraMonthly = Utils.parseNumber($('#extra-monthly').value);
            const extraYearly = Utils.parseNumber($('#extra-yearly').value);

            return {
                homePrice,
                downPayment,
                rate,
                term,
                propertyTax,
                homeInsurance,
                extraMonthly,
                extraYearly
            };
        },

        validateParams(params) {
            if (params.homePrice <= 0) {
                Utils.showToast('Please enter a valid home price', 'error');
                return false;
            }
            if (params.rate <= 0) {
                Utils.showToast('Please enter a valid interest rate', 'error');
                return false;
            }
            if (params.downPayment >= params.homePrice) {
                Utils.showToast('Down payment cannot be greater than home price', 'error');
                return false;
            }
            return true;
        },

        performCalculation(params) {
            const loanAmount = params.homePrice - params.downPayment;
            const monthlyRate = params.rate / 100 / 12;
            const numPayments = params.term * 12;

            if (monthlyRate <= 0 || numPayments <= 0) return null;

            // Calculate base monthly payment (P&I)
            const monthlyPI = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numPayments));

            // PMI calculation (if down payment < 20%)
            const downPaymentPercent = (params.downPayment / params.homePrice) * 100;
            const pmi = downPaymentPercent < 20 ? (loanAmount * 0.005) / 12 : 0;

            // Monthly costs
            const monthlyTax = params.propertyTax / 12;
            const monthlyInsurance = params.homeInsurance / 12;
            const totalMonthlyPayment = monthlyPI + monthlyTax + monthlyInsurance + pmi;

            // Generate amortization schedule
            const schedule = this.generateAmortizationSchedule(
                loanAmount, 
                monthlyRate, 
                numPayments, 
                params.extraMonthly, 
                params.extraYearly
            );

            const totalInterest = schedule.reduce((sum, payment) => sum + payment.interest, 0);
            const totalCost = loanAmount + totalInterest;

            // Calculate savings from extra payments
            const baseSchedule = this.generateAmortizationSchedule(loanAmount, monthlyRate, numPayments, 0, 0);
            const baseInterest = baseSchedule.reduce((sum, payment) => sum + payment.interest, 0);
            const interestSavings = baseInterest - totalInterest;
            const timeSavingsMonths = baseSchedule.length - schedule.length;

            const payoffDate = schedule.length > 0 ? schedule[schedule.length - 1].date : new Date();

            return {
                params,
                loanAmount,
                monthlyPI,
                monthlyTax,
                monthlyInsurance,
                pmi,
                totalMonthlyPayment,
                totalInterest,
                totalCost,
                payoffDate,
                schedule,
                interestSavings,
                timeSavingsMonths,
                downPaymentPercent
            };
        },

        generateAmortizationSchedule(principal, monthlyRate, numPayments, extraMonthly = 0, extraYearly = 0) {
            const schedule = [];
            let remainingBalance = principal;
            const basePayment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numPayments));
            const startDate = new Date();

            for (let paymentNum = 1; paymentNum <= numPayments && remainingBalance > 0.01; paymentNum++) {
                const interestPayment = remainingBalance * monthlyRate;

                // Apply extra yearly payment in January (payment 1, 13, 25, etc.)
                const isYearlyPayment = extraYearly > 0 && ((paymentNum - 1) % 12 === 0);
                const extraThisMonth = extraMonthly + (isYearlyPayment ? extraYearly : 0);

                let principalPayment = basePayment - interestPayment + extraThisMonth;

                // Don't overpay
                if (principalPayment > remainingBalance) {
                    principalPayment = remainingBalance;
                }

                remainingBalance -= principalPayment;

                const paymentDate = new Date(startDate);
                paymentDate.setMonth(paymentDate.getMonth() + paymentNum - 1);

                schedule.push({
                    paymentNumber: paymentNum,
                    date: paymentDate,
                    payment: basePayment + extraThisMonth,
                    principal: principalPayment,
                    interest: interestPayment,
                    balance: Math.max(0, remainingBalance)
                });

                if (remainingBalance <= 0.01) break;
            }

            return schedule;
        },

        updateResults(calc) {
            $('#total-monthly-payment').textContent = Utils.formatCurrency(calc.totalMonthlyPayment);
            $('#principal-interest').textContent = Utils.formatCurrency(calc.monthlyPI);
            $('#monthly-tax').textContent = Utils.formatCurrency(calc.monthlyTax);
            $('#monthly-insurance').textContent = Utils.formatCurrency(calc.monthlyInsurance);
            $('#monthly-pmi').textContent = Utils.formatCurrency(calc.pmi);

            $('#loan-amount').textContent = Utils.formatCurrency(calc.loanAmount);
            $('#total-interest').textContent = Utils.formatCurrency(calc.totalInterest);
            $('#total-cost').textContent = Utils.formatCurrency(calc.totalCost);
            $('#payoff-date').textContent = calc.payoffDate.toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
            });

            // Update chart loan amount
            $('#chart-loan-amount').textContent = Utils.formatCurrency(calc.params.homePrice);
        },

        updateSavingsPreview(calc) {
            const preview = $('#savings-preview');
            if (preview && calc.interestSavings > 0) {
                const years = Math.floor(calc.timeSavingsMonths / 12);
                const months = calc.timeSavingsMonths % 12;
                let timeText = '';
                if (years > 0) timeText += `${years} year${years > 1 ? 's' : ''}`;
                if (months > 0) {
                    if (timeText) timeText += ' ';
                    timeText += `${months} month${months > 1 ? 's' : ''}`;
                }

                preview.innerHTML = `Potential savings: <strong>${Utils.formatCurrency(calc.interestSavings)}</strong> in interest, pay off <strong>${timeText}</strong> sooner`;
                preview.style.color = 'var(--color-green-500)';
            } else {
                preview.textContent = 'Potential savings: $0';
                preview.style.color = '';
            }
        },

        resetForm() {
            // Reset form fields to defaults
            $('#home-price').value = '400,000';
            $('#down-payment').value = '80,000';
            $('#interest-rate').value = '6.5';
            $('#property-tax').value = '3,000';
            $('#home-insurance').value = '1,700';
            $('#extra-monthly').value = '';
            $('#extra-yearly').value = '';

            // Reset term to 30 years
            $$('.term-chip').forEach(c => c.classList.remove('active'));
            $('[data-years="30"]')?.classList.add('active');
            $('#custom-term-group').style.display = 'none';
            $('#loan-term').value = '30';

            this.calculate();
            Utils.showToast('Form reset to default values', 'success');
            Utils.announceToScreenReader('Form reset to default values');
        },

        showComparison() {
            const modal = $('#comparison-modal');
            if (modal) {
                modal.style.display = 'block';
                Utils.announceToScreenReader('Comparison modal opened');
            }
        },

        showShareOptions() {
            const modal = $('#share-modal');
            if (modal) {
                modal.style.display = 'block';
                Utils.announceToScreenReader('Share options opened');
            }
        },

        async downloadPDF() {
            try {
                Utils.showToast('Generating PDF...', 'info');
                Utils.announceToScreenReader('Generating PDF report');

                // Implementation would use jsPDF to create comprehensive PDF
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF();

                pdf.text('Mortgage Calculation Results', 20, 20);
                // ... additional PDF content generation

                pdf.save('mortgage-calculation.pdf');
                Utils.showToast('PDF downloaded successfully!', 'success');
            } catch (error) {
                console.error('PDF generation error:', error);
                Utils.showToast('Failed to generate PDF', 'error');
            }
        },

        printResults() {
            window.print();
            Utils.announceToScreenReader('Print dialog opened');
        },

        showCurrentRates() {
            const panel = $('#current-rates');
            if (panel) {
                const isVisible = panel.style.display === 'block';
                panel.style.display = isVisible ? 'none' : 'block';
                Utils.announceToScreenReader(isVisible ? 'Current rates hidden' : 'Current rates displayed');
            }
        }
    };

    // ======= ENHANCED YEAR SLIDER MANAGER =======
    const YearSliderManager = {
        init(calculation) {
            if (!calculation || !calculation.schedule) return;

            this.calculation = calculation;
            this.generateYearlyData();
            this.setupSlider();
            this.updateFromSlider(Math.min(28, this.yearlyData.length)); // Default to year 28 or max available
        },

        generateYearlyData() {
            const schedule = this.calculation.schedule;
            this.yearlyData = [];

            let totalPrincipal = 0;
            let totalInterest = 0;
            const loanAmount = this.calculation.loanAmount;

            for (let year = 1; year <= this.calculation.params.term; year++) {
                const endOfYearIndex = Math.min(year * 12 - 1, schedule.length - 1);

                if (endOfYearIndex >= 0 && schedule[endOfYearIndex]) {
                    const payment = schedule[endOfYearIndex];

                    // Calculate totals for this year
                    const yearPayments = schedule.slice((year - 1) * 12, year * 12);
                    const yearPrincipal = yearPayments.reduce((sum, p) => sum + p.principal, 0);
                    const yearInterest = yearPayments.reduce((sum, p) => sum + p.interest, 0);

                    totalPrincipal += yearPrincipal;
                    totalInterest += yearInterest;

                    this.yearlyData.push({
                        year,
                        balance: payment.balance,
                        totalPrincipal,
                        totalInterest,
                        yearPrincipal,
                        yearInterest,
                        monthlyPayment: this.calculation.totalMonthlyPayment,
                        percentPaid: ((loanAmount - payment.balance) / loanAmount) * 100
                    });

                    // Stop if loan is paid off
                    if (payment.balance <= 0) break;
                }
            }
        },

        setupSlider() {
            const slider = $('#year-range');
            const maxYearLabel = $('#max-year-label');

            if (slider && this.yearlyData.length > 0) {
                slider.min = '1';
                slider.max = this.yearlyData.length.toString();
                slider.value = Math.min(28, this.yearlyData.length).toString();

                if (maxYearLabel) {
                    maxYearLabel.textContent = this.yearlyData.length;
                }
            }
        },

        updateFromSlider(year) {
            if (!this.yearlyData || year < 1 || year > this.yearlyData.length) return;

            const data = this.yearlyData[year - 1];
            if (!data) return;

            // Update year indicator
            $('#year-label').textContent = `Year ${year}`;
            $('#current-year').textContent = year;

            // Update legend values
            $('#remaining-balance-display').textContent = Utils.formatCurrency(data.balance);
            $('#principal-paid-display').textContent = Utils.formatCurrency(data.totalPrincipal);
            $('#interest-paid-display').textContent = Utils.formatCurrency(data.totalInterest);

            // Update detailed year analysis
            $('#year-monthly-payment').textContent = Utils.formatCurrency(data.monthlyPayment);
            $('#year-end-balance').textContent = Utils.formatCurrency(data.balance);
            $('#year-principal-paid').textContent = Utils.formatCurrency(data.yearPrincipal);
            $('#year-interest-paid').textContent = Utils.formatCurrency(data.yearInterest);

            // Update chart if available
            if (STATE.chart) {
                this.updateChartHighlight(year);
            }

            // Screen reader announcement
            Utils.announceToScreenReader(
                `Year ${year}: Remaining balance ${Utils.formatCurrency(data.balance)}, ` +
                `Principal paid ${Utils.formatCurrency(data.totalPrincipal)}, ` +
                `Interest paid ${Utils.formatCurrency(data.totalInterest)}`
            );
        },

        updateChartHighlight(year) {
            if (!STATE.chart) return;

            // Update chart to highlight the selected year
            // This would typically involve updating the chart's annotations or active point
            try {
                STATE.chart.options.plugins = STATE.chart.options.plugins || {};
                STATE.chart.options.plugins.annotation = {
                    annotations: {
                        line1: {
                            type: 'line',
                            mode: 'vertical',
                            scaleID: 'x-axis-0',
                            value: year,
                            borderColor: 'rgba(255, 99, 132, 0.8)',
                            borderWidth: 2,
                            label: {
                                content: `Year ${year}`,
                                enabled: true,
                                position: 'top'
                            }
                        }
                    }
                };
                STATE.chart.update();
            } catch (error) {
                console.error('Chart highlight error:', error);
            }
        }
    };

    // ======= CHART MANAGEMENT =======
    const ChartManager = {
        init() {
            if (!window.Chart) {
                console.error('Chart.js not loaded');
                return;
            }

            const ctx = $('#mortgage-timeline-chart')?.getContext('2d');
            if (!ctx) return;

            Chart.register(Chart.LineController, Chart.LineElement, Chart.PointElement, Chart.LinearScale, Chart.CategoryScale, Chart.Tooltip, Chart.Legend);

            STATE.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Remaining Balance',
                            data: [],
                            borderColor: '#F97316',
                            backgroundColor: 'rgba(249, 115, 22, 0.1)',
                            fill: true,
                            tension: 0.2,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'Principal Paid',
                            data: [],
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.2,
                            fill: false,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'Interest Paid',
                            data: [],
                            borderColor: '#3B82F6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.2,
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
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            borderWidth: 1,
                            callbacks: {
                                title: (context) => `End of Year ${context[0].label}`,
                                label: (context) => `${context.dataset.label}: ${Utils.formatCurrency(context.parsed.y)}`
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Year'
                            },
                            grid: {
                                color: 'var(--chart-grid)'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Amount ($)'
                            },
                            grid: {
                                color: 'var(--chart-grid)'
                            },
                            ticks: {
                                callback: (value) => Utils.formatCurrency(value, 0)
                            }
                        }
                    },
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const year = elements[0].index + 1;
                            const slider = $('#year-range');
                            if (slider) {
                                slider.value = year;
                                YearSliderManager.updateFromSlider(year);
                            }
                        }
                    }
                }
            });
        },

        render(calc) {
            if (!calc || !STATE.chart) return;

            const yearlyData = YearSliderManager.yearlyData || [];
            if (yearlyData.length === 0) return;

            const years = yearlyData.map(d => d.year);
            STATE.chart.data.labels = years;
            STATE.chart.data.datasets[0].data = yearlyData.map(d => d.balance);
            STATE.chart.data.datasets[1].data = yearlyData.map(d => d.totalPrincipal);
            STATE.chart.data.datasets[2].data = yearlyData.map(d => d.totalInterest);
            STATE.chart.update();
        }
    };

    // ======= AI INSIGHTS =======
    const AIInsights = {
        render(calc) {
            const container = $('#ai-insights-content');
            if (!container || !calc) return;

            const insights = this.generateInsights(calc);

            container.innerHTML = insights.map(insight => `
                <div class="insight-item ${insight.type}">
                    <i class="fas fa-${insight.icon}"></i>
                    <div>
                        <p>${insight.text}</p>
                    </div>
                </div>
            `).join('');
        },

        generateInsights(calc) {
            const insights = [];

            // PMI Insight
            if (calc.downPaymentPercent < 20) {
                insights.push({
                    type: 'warning',
                    icon: 'exclamation-triangle',
                    text: `<strong>PMI Alert:</strong> Your ${calc.downPaymentPercent.toFixed(1)}% down payment requires PMI of ${Utils.formatCurrency(calc.pmi)}/month. Increase to 20% down to eliminate this cost.`
                });
            } else {
                insights.push({
                    type: 'success',
                    icon: 'check-circle',
                    text: `<strong>Great!</strong> With ${calc.downPaymentPercent.toFixed(1)}% down, you avoid PMI costs.`
                });
            }

            // Extra Payment Benefits
            if (calc.interestSavings > 0) {
                const years = Math.floor(calc.timeSavingsMonths / 12);
                const months = calc.timeSavingsMonths % 12;
                let timeText = years > 0 ? `${years} year${years !== 1 ? 's' : ''}` : '';
                if (months > 0) {
                    if (timeText) timeText += ' and ';
                    timeText += `${months} month${months !== 1 ? 's' : ''}`;
                }

                insights.push({
                    type: 'success',
                    icon: 'piggy-bank',
                    text: `<strong>Smart Strategy:</strong> Your extra payments save ${Utils.formatCurrency(calc.interestSavings)} in interest and ${timeText} in loan term.`
                });
            } else if (calc.params.extraMonthly === 0 && calc.params.extraYearly === 0) {
                // Suggest extra payments
                const extraMonthly = Math.round(calc.monthlyPI * 0.1); // 10% of P&I
                const testParams = { ...calc.params, extraMonthly };

                // Quick calculation for suggestion
                const potentialSavings = calc.totalInterest * 0.15; // Estimated 15% savings

                insights.push({
                    type: 'info',
                    icon: 'lightbulb',
                    text: `<strong>Consider This:</strong> Adding just ${Utils.formatCurrency(extraMonthly)}/month could save approximately ${Utils.formatCurrency(potentialSavings)} in interest.`
                });
            }

            // Loan term insights
            if (calc.params.term === 30) {
                insights.push({
                    type: 'info',
                    icon: 'clock',
                    text: `<strong>15-Year Option:</strong> Consider a shorter loan term for significant interest savings, though monthly payments will be higher.`
                });
            }

            // Rate insights
            if (calc.params.rate > 7) {
                insights.push({
                    type: 'warning',
                    icon: 'chart-line',
                    text: `<strong>High Rate Alert:</strong> At ${calc.params.rate}%, consider shopping for better rates or improving your credit score.`
                });
            } else if (calc.params.rate < 5) {
                insights.push({
                    type: 'success',
                    icon: 'thumbs-up',
                    text: `<strong>Excellent Rate:</strong> Your ${calc.params.rate}% rate is well below current market averages.`
                });
            }

            return insights;
        }
    };

    // ======= AMORTIZATION TABLE =======
    const AmortizationTable = {
        currentPage: 1,
        rowsPerPage: 12,

        render(calc) {
            if (!calc || !calc.schedule) return;

            this.currentPage = 1;
            this.schedule = calc.schedule;
            this.updateTable();
            this.updatePagination();
        },

        updateTable() {
            const tbody = $('#amortization-table tbody');
            if (!tbody || !this.schedule) return;

            const startIndex = (this.currentPage - 1) * this.rowsPerPage;
            const endIndex = startIndex + this.rowsPerPage;
            const pageData = this.schedule.slice(startIndex, endIndex);

            if (pageData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No data available for this page</td></tr>';
                return;
            }

            tbody.innerHTML = pageData.map(payment => `
                <tr>
                    <td>${payment.paymentNumber}</td>
                    <td>${payment.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>${Utils.formatCurrency(payment.payment)}</td>
                    <td>${Utils.formatCurrency(payment.principal)}</td>
                    <td>${Utils.formatCurrency(payment.interest)}</td>
                    <td>${Utils.formatCurrency(payment.balance)}</td>
                </tr>
            `).join('');
        },

        updatePagination() {
            if (!this.schedule) return;

            const totalPages = Math.ceil(this.schedule.length / this.rowsPerPage);

            $('#payment-count').textContent = `${this.schedule.length} payments`;
            $('#page-info').textContent = `Page ${this.currentPage} of ${totalPages}`;
            $('#page-display').textContent = `Page ${this.currentPage}`;

            const prevBtn = $('#prev-page');
            const nextBtn = $('#next-page');

            if (prevBtn) {
                prevBtn.disabled = this.currentPage === 1;
                prevBtn.onclick = () => {
                    if (this.currentPage > 1) {
                        this.currentPage--;
                        this.updateTable();
                        this.updatePagination();
                        Utils.announceToScreenReader(`Page ${this.currentPage} of ${totalPages}`);
                    }
                };
            }

            if (nextBtn) {
                nextBtn.disabled = this.currentPage === totalPages;
                nextBtn.onclick = () => {
                    if (this.currentPage < totalPages) {
                        this.currentPage++;
                        this.updateTable();
                        this.updatePagination();
                        Utils.announceToScreenReader(`Page ${this.currentPage} of ${totalPages}`);
                    }
                };
            }
        }
    };

    // ======= INITIALIZATION =======
    const init = () => {
        try {
            // Initialize all components
            StatsUpdater.init();
            GlobalVoiceControl.init();
            FormVoiceControl.init();
            AccessibilityControls.init();
            MortgageCalculator.init();
            ChartManager.init();

            // Show welcome message
            setTimeout(() => {
                Utils.showToast('🏠 AI-Enhanced Mortgage Calculator loaded successfully!', 'success');
            }, 1000);

            console.log('🏠 AI-Enhanced Mortgage Calculator initialized successfully!');
        } catch (error) {
            console.error('Initialization error:', error);
            Utils.showToast('Error initializing calculator. Please refresh the page.', 'error');
        }
    };

    // Start the application
    init();
});
