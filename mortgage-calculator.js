/**
 * World's First AI-Enhanced Mortgage Calculator JavaScript
 * COMPREHENSIVE FUNCTIONALITY FOR ALL FEATURES
 * Features: Global voice control, real-time calculations, AI insights, amortization table,
 * down payment sync, PMI auto-calc, state-based taxes, comparison tools, accessibility
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // ========== CONFIGURATION & STATE ==========
    const CONFIG = {
        debounceDelay: 300,
        defaultInsuranceRate: 0.002, // 0.2% of home value
        calculationsUpdateInterval: 5000, // 5 seconds
        savingsUpdateInterval: 7000, // 7 seconds
        voiceTimeout: 15000, // 15 seconds
        maxSliderYear: 30,
        pmiRate: 0.005, // 0.5% annually
        apiUpdateInterval: 15 * 60 * 1000, // 15 minutes
        paymentsPerPage: 12
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
        screenReaderActive: false,
        currentPage: 1,
        totalPages: 1,
        amortizationData: [],
        comparisonData: null,
        marketRates: {
            "30yr": 6.75,
            "15yr": 6.25,
            "arm": 5.95,
            "fha": 6.50
        },
        lastUpdated: new Date()
    };

    // Enhanced State Tax Rates (property tax as percentage of home value)
    const STATE_TAX_RATES = {
        'AL': 0.41, 'AK': 1.19, 'AZ': 0.72, 'AR': 0.62, 'CA': 0.76, 'CO': 0.55,
        'CT': 2.14, 'DE': 0.57, 'FL': 0.98, 'GA': 0.92, 'HI': 0.28, 'ID': 0.69,
        'IL': 2.16, 'IN': 0.85, 'IA': 1.57, 'KS': 1.41, 'KY': 0.86, 'LA': 0.55,
        'ME': 1.36, 'MD': 1.09, 'MA': 1.23, 'MI': 1.54, 'MN': 1.12, 'MS': 0.81,
        'MO': 0.97, 'MT': 0.84, 'NE': 1.73, 'NV': 0.64, 'NH': 2.18, 'NJ': 2.42,
        'NM': 0.80, 'NY': 1.72, 'NC': 0.84, 'ND': 0.98, 'OH': 1.56, 'OK': 0.90,
        'OR': 0.97, 'PA': 1.58, 'RI': 1.63, 'SC': 0.57, 'SD': 1.31, 'TN': 0.71,
        'TX': 1.90, 'UT': 0.66, 'VT': 1.90, 'VA': 0.82, 'WA': 0.98, 'WV': 0.59,
        'WI': 1.68, 'WY': 0.61
    };

    // ========== DOM UTILITIES ==========
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    // ========== UTILITY FUNCTIONS ==========
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
            return parseFloat(str.toString().replace(/[^0-9.-]/g, '')) || 0;
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

            const icon = type === 'success' ? 'check-circle' : 
                        type === 'error' ? 'exclamation-triangle' : 
                        type === 'warning' ? 'exclamation-circle' : 'info-circle';

            toast.innerHTML = `
                <i class="fas fa-${icon}"></i>
                <span class="toast-message">${message}</span>
            `;

            container.appendChild(toast);

            // Remove after 5 seconds
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.style.animation = 'toastSlide 0.3s ease-out reverse';
                    setTimeout(() => toast.remove(), 300);
                }
            }, 5000);
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
        },

        formatDate: (date) => {
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        },

        updateDateTime: () => {
            const now = new Date();
            const dateTimeString = now.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            const elements = $$('#current-date-time, #rate-update-time .rate-timestamp, .rate-update');
            elements.forEach(el => {
                if (el) el.textContent = `Updated ${dateTimeString}`;
            });
        }
    };

    // ========== DYNAMIC STATS UPDATER ==========
    const StatsUpdater = {
        init() {
            this.updateCalculationsCounter();
            this.updateSavingsCounter();
            setInterval(() => this.updateCalculationsCounter(), CONFIG.calculationsUpdateInterval);
            setInterval(() => this.updateSavingsCounter(), CONFIG.savingsUpdateInterval);
            setInterval(() => this.updateMarketRates(), CONFIG.apiUpdateInterval);
            Utils.updateDateTime();
            setInterval(() => Utils.updateDateTime(), 60000); // Update every minute
        },

        updateCalculationsCounter() {
            const increment = Math.floor(Math.random() * 15) + 5; // 5-19 increment
            STATE.calculationsToday += increment;
            const element = $('#calc-count');
            if (element) {
                element.textContent = Utils.formatNumber(STATE.calculationsToday);
            }
        },

        updateSavingsCounter() {
            const increment = Math.floor(Math.random() * 3000) + 1000; // 1000-3999 increment
            STATE.avgSavings += increment;
            const element = $('#avg-savings');
            if (element) {
                element.textContent = '$' + Math.floor(STATE.avgSavings / 1000) + 'K';
            }
        },

        updateMarketRates() {
            // Simulate market rate updates (in real app, this would fetch from API)
            const variation = (Math.random() - 0.5) * 0.25; // ±0.125%
            STATE.marketRates["30yr"] = Math.max(5.0, Math.min(8.0, STATE.marketRates["30yr"] + variation));
            STATE.marketRates["15yr"] = STATE.marketRates["30yr"] - 0.5;

            // Update display
            const rate30 = $('#market-30yr');
            const rate15 = $('#market-15yr');
            const currentRate = $('#current-rate');

            if (rate30) rate30.textContent = STATE.marketRates["30yr"].toFixed(2) + '%';
            if (rate15) rate15.textContent = STATE.marketRates["15yr"].toFixed(2) + '%';
            if (currentRate) currentRate.textContent = STATE.marketRates["30yr"].toFixed(2) + '%';

            // Update range display
            const rateRange = $('#rate-range');
            if (rateRange) {
                const min = (STATE.marketRates["30yr"] - 0.5).toFixed(1);
                const max = (STATE.marketRates["30yr"] + 0.5).toFixed(1);
                rateRange.textContent = `${min}% - ${max}%`;
            }

            STATE.lastUpdated = new Date();
            Utils.updateDateTime();
        }
    };

    // ========== GLOBAL VOICE CONTROL ==========
    const GlobalVoiceControl = {
        init() {
            if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
                console.warn('Speech recognition not supported');
                const voiceBtn = $('#voice-toggle');
                if (voiceBtn) {
                    voiceBtn.disabled = true;
                    voiceBtn.title = 'Voice control not supported in this browser';
                }
                return;
            }

            // Initialize Global Speech Recognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            STATE.globalVoiceRecognition = new SpeechRecognition();
            STATE.globalVoiceRecognition.continuous = true;
            STATE.globalVoiceRecognition.interimResults = false;
            STATE.globalVoiceRecognition.lang = 'en-US';

            // Event listeners
            STATE.globalVoiceRecognition.onstart = () => this.onStart();
            STATE.globalVoiceRecognition.onresult = (event) => this.onResult(event);
            STATE.globalVoiceRecognition.onerror = (event) => this.onError(event);
            STATE.globalVoiceRecognition.onend = () => this.onEnd();

            // Button listeners
            $('#voice-toggle')?.addEventListener('click', () => this.toggle());
        },

        toggle() {
            if (STATE.isGlobalListening) {
                this.stop();
            } else {
                this.start();
            }
        },

        start() {
            if (!STATE.globalVoiceRecognition || STATE.isGlobalListening) return;

            try {
                STATE.globalVoiceRecognition.start();
                Utils.announceToScreenReader('Global voice control activated. You can now speak commands.');
            } catch (error) {
                Utils.showToast('Voice recognition failed to start', 'error');
                console.error('Global voice error:', error);
            }
        },

        stop() {
            if (!STATE.globalVoiceRecognition || !STATE.isGlobalListening) return;
            STATE.globalVoiceRecognition.stop();
        },

        onStart() {
            STATE.isGlobalListening = true;
            const btn = $('#voice-toggle');
            const icon = $('#voice-icon');
            const status = $('#voice-status');

            if (btn) btn.classList.add('active');
            if (icon) icon.className = 'fas fa-microphone-slash';
            if (status) {
                status.style.display = 'flex';
                $('#voice-text').textContent = 'Global Voice Active - Speak any command...';
            }

            Utils.announceToScreenReader('Voice listening activated');
        },

        onResult(event) {
            const result = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            const textElement = $('#voice-text');

            if (textElement) {
                textElement.textContent = `Heard: "${result}"`;
            }

            setTimeout(() => this.processCommand(result), 500);
        },

        onError(event) {
            console.error('Voice recognition error:', event.error);
            Utils.showToast(`Voice error: ${event.error}`, 'error');
            this.stop();
        },

        onEnd() {
            STATE.isGlobalListening = false;
            const btn = $('#voice-toggle');
            const icon = $('#voice-icon');
            const status = $('#voice-status');

            if (btn) btn.classList.remove('active');
            if (icon) icon.className = 'fas fa-microphone';
            if (status) status.style.display = 'none';

            Utils.announceToScreenReader('Voice listening stopped');
        },

        processCommand(command) {
            console.log('Processing command:', command);

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
                MortgageCalculator.switchTab('chart');
                return;
            }

            if (command.includes('show insights') || command.includes('ai insights')) {
                MortgageCalculator.switchTab('insights');
                return;
            }

            if (command.includes('amortization') || command.includes('payment schedule')) {
                MortgageCalculator.switchTab('amortization');
                return;
            }

            // Field-specific commands
            const fieldCommands = {
                'home price': /(?:home|house|property) price (\d+)/i,
                'down payment': /down payment (\d+)/i,
                'interest rate': /interest rate ([\d.]+)/i,
                'loan term': /loan term (\d+)/i
            };

            for (const [field, pattern] of Object.entries(fieldCommands)) {
                const match = command.match(pattern);
                if (match) {
                    this.updateField(field, parseFloat(match[1]));
                    return;
                }
            }

            // If no command matched
            Utils.showToast(`Command "${command}" not recognized. Try "calculate", "dark mode", or field names with values.`, 'info');
        },

        updateField(fieldName, value) {
            const fieldMap = {
                'home price': 'home-price',
                'down payment': 'down-payment', 
                'interest rate': 'interest-rate',
                'loan term': 'loan-term'
            };

            const fieldId = fieldMap[fieldName];
            const field = $('#' + fieldId);

            if (field) {
                if (fieldName === 'interest rate') {
                    field.value = value;
                } else if (fieldName === 'loan term') {
                    // Handle loan term selection
                    $$('.term-chip').forEach(chip => chip.classList.remove('active'));
                    const termChip = $(`[data-years="${value}"]`);
                    if (termChip) {
                        termChip.classList.add('active');
                    }
                    field.value = value;
                } else {
                    field.value = Utils.formatNumber(value);
                }

                field.dispatchEvent(new Event('input', { bubbles: true }));
                Utils.announceToScreenReader(`${fieldName} set to ${value}`);
                Utils.showToast(`${fieldName} updated to ${fieldName === 'interest rate' ? value + '%' : Utils.formatCurrency(value)}`, 'success');
            }
        },

        resetAllFields() {
            $$('input[type="text"], input[type="number"]').forEach(field => {
                if (!['interest-rate', 'property-state'].includes(field.id)) {
                    field.value = '';
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });

            // Reset term to 30 years
            $$('.term-chip').forEach(chip => chip.classList.remove('active'));
            $('[data-years="30"]')?.classList.add('active');

            Utils.announceToScreenReader('All fields cleared');
            Utils.showToast('All fields cleared', 'success');
        }
    };

    // ========== FORM VOICE CONTROL ==========
    const FormVoiceControl = {
        init() {
            const voiceBtn = $('#voice-input');
            if (!voiceBtn) return;

            if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
                voiceBtn.disabled = true;
                voiceBtn.title = 'Voice control not supported in this browser';
                return;
            }

            // Initialize Local Speech Recognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            STATE.localVoiceRecognition = new SpeechRecognition();
            STATE.localVoiceRecognition.continuous = false;
            STATE.localVoiceRecognition.interimResults = false;
            STATE.localVoiceRecognition.lang = 'en-US';

            // Event listeners
            STATE.localVoiceRecognition.onstart = () => this.onStart();
            STATE.localVoiceRecognition.onresult = (event) => this.onResult(event);
            STATE.localVoiceRecognition.onerror = (event) => this.onError(event);
            STATE.localVoiceRecognition.onend = () => this.onEnd();

            voiceBtn.addEventListener('click', () => this.toggle());
        },

        toggle() {
            if (STATE.isLocalListening) {
                this.stop();
            } else {
                this.start();
            }
        },

        start() {
            if (!STATE.localVoiceRecognition || STATE.isLocalListening) return;

            try {
                STATE.localVoiceRecognition.start();
                Utils.announceToScreenReader('Form voice input started. Speak field names with values.');
            } catch (error) {
                Utils.showToast('Voice recognition failed to start', 'error');
                console.error('Form voice error:', error);
            }
        },

        stop() {
            if (!STATE.localVoiceRecognition || !STATE.isLocalListening) return;
            STATE.localVoiceRecognition.stop();
        },

        onStart() {
            STATE.isLocalListening = true;
            const btn = $('#voice-input');
            if (btn) {
                btn.classList.add('active');
                btn.innerHTML = '<i class="fas fa-microphone-slash"></i> Listening...';
            }
        },

        onResult(event) {
            const result = event.results[0][0].transcript.toLowerCase().trim();
            Utils.showToast(`Heard: "${result}"`, 'info');

            setTimeout(() => {
                this.processCommand(result);
                this.stop();
            }, 1000);
        },

        onError(event) {
            console.error('Form voice error:', event.error);
            Utils.showToast(`Voice input error: ${event.error}`, 'error');
            this.stop();
        },

        onEnd() {
            STATE.isLocalListening = false;
            const btn = $('#voice-input');
            if (btn) {
                btn.classList.remove('active');
                btn.innerHTML = '<i class="fas fa-microphone"></i> Voice Input';
            }
        },

        processCommand(command) {
            // Extract field and value from voice command
            const patterns = [
                { field: 'home-price', patterns: [/(?:home|house|property) price (\d+)/i] },
                { field: 'down-payment', patterns: [/down payment (\d+)/i] },
                { field: 'interest-rate', patterns: [/interest rate ([\d.]+)/i] },
                { field: 'property-tax', patterns: [/property tax (\d+)/i] },
                { field: 'home-insurance', patterns: [/(?:home )?insurance (\d+)/i] },
                { field: 'extra-monthly', patterns: [/extra (?:monthly )?payment (\d+)/i] }
            ];

            let processed = false;

            for (const { field, patterns } of patterns) {
                for (const pattern of patterns) {
                    const match = command.match(pattern);
                    if (match) {
                        const value = parseFloat(match[1]);
                        this.updateField(field, value);
                        processed = true;
                        break;
                    }
                }
                if (processed) break;
            }

            if (!processed) {
                Utils.showToast('Command not recognized. Try saying field names with values like "home price 500000".', 'info');
            }
        },

        updateField(fieldId, value) {
            const field = $('#' + fieldId);
            if (!field) return;

            if (fieldId === 'interest-rate') {
                field.value = value;
            } else {
                field.value = Utils.formatNumber(value);
            }

            field.dispatchEvent(new Event('input', { bubbles: true }));

            const fieldNames = {
                'home-price': 'Home Price',
                'down-payment': 'Down Payment',
                'interest-rate': 'Interest Rate',
                'property-tax': 'Property Tax',
                'home-insurance': 'Home Insurance',
                'extra-monthly': 'Extra Monthly Payment'
            };

            const fieldName = fieldNames[fieldId];
            Utils.announceToScreenReader(`${fieldName} set to ${value}`);
            Utils.showToast(`${fieldName} updated to ${fieldId === 'interest-rate' ? value + '%' : Utils.formatCurrency(value)}`, 'success');
        }
    };

    // ========== ACCESSIBILITY CONTROLS ==========
    const AccessibilityControls = {
        init() {
            $('#font-smaller')?.addEventListener('click', () => this.adjustFontSize(-10));
            $('#font-larger')?.addEventListener('click', () => this.adjustFontSize(10));
            $('#theme-toggle')?.addEventListener('click', () => this.toggleTheme());
            $('#screen-reader-toggle')?.addEventListener('click', () => this.toggleScreenReader());

            // Initialize theme from localStorage
            const savedTheme = localStorage.getItem('theme') || 'light';
            this.setTheme(savedTheme);

            // Initialize font size from localStorage
            const savedFontSize = localStorage.getItem('fontSize') || '100';
            STATE.currentFontSize = parseInt(savedFontSize);
            document.documentElement.style.fontSize = STATE.currentFontSize + '%';
        },

        adjustFontSize(change) {
            STATE.currentFontSize += change;
            STATE.currentFontSize = Math.max(80, Math.min(150, STATE.currentFontSize));

            document.documentElement.style.fontSize = STATE.currentFontSize + '%';
            localStorage.setItem('fontSize', STATE.currentFontSize.toString());

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
            localStorage.setItem('theme', theme);

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

            const message = STATE.screenReaderActive ? 
                'Screen reader enhancements enabled' : 
                'Screen reader enhancements disabled';

            Utils.announceToScreenReader(message);
            Utils.showToast(message, 'success');
        }
    };

    // ========== MORTGAGE CALCULATOR CORE ==========
    const MortgageCalculator = {
        init() {
            this.bindEvents();
            this.populateStates();
            this.setInitialValues();
            this.calculate();
        },

        bindEvents() {
            const debouncedCalculate = Utils.debounce(() => this.calculate(), CONFIG.debounceDelay);

            // Input field listeners with enhanced functionality
            $$('input[type="text"], input[type="number"]').forEach(input => {
                input.addEventListener('input', (e) => {
                    if (e.target.type === 'text' && !['custom-term', 'property-state'].includes(e.target.id)) {
                        this.formatNumberInput(e.target);
                    }

                    // Enhanced functionality based on field
                    if (e.target.id === 'home-price') {
                        this.updateInsurance();
                        this.syncDownPayment('amount');
                        this.updatePropertyTax();
                    } else if (e.target.id === 'down-payment') {
                        this.syncDownPayment('amount');
                        this.updatePMIStatus();
                    } else if (e.target.id === 'down-payment-percent') {
                        this.syncDownPayment('percent');
                        this.updatePMIStatus();
                    } else if (e.target.id === 'property-state') {
                        this.updatePropertyTax();
                    }

                    debouncedCalculate();
                });
            });

            // Suggestion chip listeners
            $$('.suggestion-chip').forEach(chip => {
                chip.addEventListener('click', (e) => {
                    const value = e.target.dataset.value;
                    const inputId = e.target.dataset.input;
                    const input = inputId ? $('#' + inputId) : e.target.closest('.form-group').querySelector('input');

                    if (input && value) {
                        input.value = Utils.formatNumber(value);
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                });
            });

            // Toggle button listeners
            $$('.toggle-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleToggle(e.target);
                    debouncedCalculate();
                });
            });

            // Term chip listeners
            $$('.term-chip').forEach(chip => {
                chip.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleTermSelection(e.target);
                    debouncedCalculate();
                });
            });

            // Tab control listeners
            $$('.tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.switchTab(e.target.dataset.tab);
                });
            });

            // Down payment toggle listeners
            $('#amount-toggle')?.addEventListener('click', () => {
                $('#amount-input').style.display = 'block';
                $('#percent-input').style.display = 'none';
                $('#amount-toggle').classList.add('active');
                $('#percent-toggle').classList.remove('active');
            });

            $('#percent-toggle')?.addEventListener('click', () => {
                $('#amount-input').style.display = 'none';
                $('#percent-input').style.display = 'block';
                $('#percent-toggle').classList.add('active');
                $('#amount-toggle').classList.remove('active');
            });

            // Enhanced year range slider
            $('#year-range')?.addEventListener('input', (e) => {
                YearSliderManager.updateFromSlider(parseInt(e.target.value));
            });

            // State selection
            $('#property-state')?.addEventListener('change', () => {
                this.updatePropertyTax();
                debouncedCalculate();
            });

            // Action button listeners
            $('#calculate-btn')?.addEventListener('click', () => this.calculate());
            $('#reset-form')?.addEventListener('click', () => this.resetForm());
            $('#compare-btn')?.addEventListener('click', () => this.showComparison());
            $('#share-btn')?.addEventListener('click', () => this.showShareOptions());
            $('#pdf-download-btn')?.addEventListener('click', () => this.downloadPDF());
            $('#print-btn')?.addEventListener('click', () => this.printResults());
            $('#save-calculation')?.addEventListener('click', () => this.saveCalculation());

            // View current rates
            $('#view-current-rates')?.addEventListener('click', () => this.toggleCurrentRates());

            // Modal close buttons
            $$('.modal-close').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.target.closest('.modal').style.display = 'none';
                });
            });

            // Click outside modal to close
            $$('.modal').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.style.display = 'none';
                    }
                });
            });
        },

        populateStates() {
            const stateSelect = $('#property-state');
            if (!stateSelect) return;

            const states = [
                { value: '', text: 'Select your state...' },
                { value: 'AL', text: 'Alabama' }, { value: 'AK', text: 'Alaska' }, 
                { value: 'AZ', text: 'Arizona' }, { value: 'AR', text: 'Arkansas' },
                { value: 'CA', text: 'California' }, { value: 'CO', text: 'Colorado' },
                { value: 'CT', text: 'Connecticut' }, { value: 'DE', text: 'Delaware' },
                { value: 'FL', text: 'Florida' }, { value: 'GA', text: 'Georgia' },
                { value: 'HI', text: 'Hawaii' }, { value: 'ID', text: 'Idaho' },
                { value: 'IL', text: 'Illinois' }, { value: 'IN', text: 'Indiana' },
                { value: 'IA', text: 'Iowa' }, { value: 'KS', text: 'Kansas' },
                { value: 'KY', text: 'Kentucky' }, { value: 'LA', text: 'Louisiana' },
                { value: 'ME', text: 'Maine' }, { value: 'MD', text: 'Maryland' },
                { value: 'MA', text: 'Massachusetts' }, { value: 'MI', text: 'Michigan' },
                { value: 'MN', text: 'Minnesota' }, { value: 'MS', text: 'Mississippi' },
                { value: 'MO', text: 'Missouri' }, { value: 'MT', text: 'Montana' },
                { value: 'NE', text: 'Nebraska' }, { value: 'NV', text: 'Nevada' },
                { value: 'NH', text: 'New Hampshire' }, { value: 'NJ', text: 'New Jersey' },
                { value: 'NM', text: 'New Mexico' }, { value: 'NY', text: 'New York' },
                { value: 'NC', text: 'North Carolina' }, { value: 'ND', text: 'North Dakota' },
                { value: 'OH', text: 'Ohio' }, { value: 'OK', text: 'Oklahoma' },
                { value: 'OR', text: 'Oregon' }, { value: 'PA', text: 'Pennsylvania' },
                { value: 'RI', text: 'Rhode Island' }, { value: 'SC', text: 'South Carolina' },
                { value: 'SD', text: 'South Dakota' }, { value: 'TN', text: 'Tennessee' },
                { value: 'TX', text: 'Texas' }, { value: 'UT', text: 'Utah' },
                { value: 'VT', text: 'Vermont' }, { value: 'VA', text: 'Virginia' },
                { value: 'WA', text: 'Washington' }, { value: 'WV', text: 'West Virginia' },
                { value: 'WI', text: 'Wisconsin' }, { value: 'WY', text: 'Wyoming' }
            ];

            states.forEach(state => {
                const option = document.createElement('option');
                option.value = state.value;
                option.textContent = state.text;
                stateSelect.appendChild(option);
            });

            // Set default state to California
            stateSelect.value = 'CA';
        },

        setInitialValues() {
            // Set default values
            const defaults = {
                'home-price': '400000',
                'down-payment': '80000',
                'down-payment-percent': '20',
                'interest-rate': STATE.marketRates["30yr"].toFixed(2),
                'property-tax': '3000',
                'home-insurance': '800'
            };

            Object.entries(defaults).forEach(([id, value]) => {
                const element = $('#' + id);
                if (element && !element.value) {
                    element.value = value;
                }
            });

            this.updateInsurance();
            this.updatePropertyTax();
            this.updatePMIStatus();
        },

        formatNumberInput(input) {
            const value = Utils.parseNumber(input.value);
            if (value > 0) {
                input.value = Utils.formatNumber(value);
            }
        },

        handleToggle(button) {
            const group = button.closest('.toggle-group');
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
                'chart': 'Mortgage Over Time',
                'insights': 'AI-Powered Insights', 
                'amortization': 'Amortization Schedule'
            };

            Utils.announceToScreenReader(`Switched to ${tabNames[tabName]} tab`);
        },

        // Enhanced Insurance Auto-Calculation
        updateInsurance() {
            const homePrice = Utils.parseNumber($('#home-price')?.value || '0');
            const insuranceInput = $('#home-insurance');

            if (homePrice > 0 && insuranceInput) {
                const defaultInsurance = Math.round(homePrice * CONFIG.defaultInsuranceRate);

                // Only auto-update if field is empty or contains the previous calculated value
                if (!insuranceInput.value || Utils.parseNumber(insuranceInput.value) === 0) {
                    insuranceInput.value = Utils.formatNumber(defaultInsurance);
                }

                // Update help text
                const helpText = $('#insurance-help');
                if (helpText) {
                    helpText.innerHTML = `Default: 0.2% of home value = ${Utils.formatCurrency(defaultInsurance, 0)}`;
                }
            }
        },

        // Enhanced Down Payment Sync with Working Percentage
        syncDownPayment(source) {
            const homePrice = Utils.parseNumber($('#home-price')?.value || '0');
            const downPaymentAmount = $('#down-payment');
            const downPaymentPercent = $('#down-payment-percent');

            if (homePrice <= 0) return;

            if (source === 'amount' && downPaymentAmount) {
                const amount = Utils.parseNumber(downPaymentAmount.value || '0');
                const percentage = (amount / homePrice) * 100;
                if (downPaymentPercent) {
                    downPaymentPercent.value = Math.round(percentage * 10) / 10; // Round to 1 decimal
                }
            } else if (source === 'percent' && downPaymentPercent) {
                const percentage = parseFloat(downPaymentPercent.value || '0');
                const amount = Math.round((homePrice * percentage) / 100);
                if (downPaymentAmount) {
                    downPaymentAmount.value = Utils.formatNumber(amount);
                }
            }

            this.updatePMIStatus();
        },

        // Enhanced PMI Status and Warning
        updatePMIStatus() {
            const homePrice = Utils.parseNumber($('#home-price')?.value || '0');
            const downPayment = Utils.parseNumber($('#down-payment')?.value || '0');
            const pmiInput = $('#pmi');
            const pmiStatus = $('#pmi-status');
            const pmiWarning = $('#pmi-warning');
            const pmiRange = $('#pmi-range');

            if (homePrice <= 0) return;

            const downPaymentPercent = (downPayment / homePrice) * 100;

            if (downPaymentPercent < 20) {
                // PMI required
                const monthlyPMI = Math.round((homePrice - downPayment) * CONFIG.pmiRate / 12);

                if (pmiInput) pmiInput.value = Utils.formatNumber(monthlyPMI);
                if (pmiStatus) pmiStatus.textContent = `PMI required (${downPaymentPercent.toFixed(1)}% down payment)`;
                if (pmiWarning) pmiWarning.style.display = 'flex';
                if (pmiRange) pmiRange.style.display = 'block';
            } else {
                // No PMI required
                if (pmiInput) pmiInput.value = '0';
                if (pmiStatus) pmiStatus.textContent = 'No PMI required (20%+ down payment)';
                if (pmiWarning) pmiWarning.style.display = 'none';
                if (pmiRange) pmiRange.style.display = 'none';
            }
        },

        updatePropertyTax() {
            const state = $('#property-state')?.value;
            const homePrice = Utils.parseNumber($('#home-price')?.value || '0');
            const propertyTaxInput = $('#property-tax');
            const taxHelp = $('#tax-help');
            const taxRateDisplay = $('#tax-rate-display');

            if (state && homePrice > 0 && STATE_TAX_RATES[state] && propertyTaxInput) {
                const taxRate = STATE_TAX_RATES[state];
                const annualTax = Math.round(homePrice * (taxRate / 100));

                // Only auto-update if field is empty or contains a previous calculated value
                if (!propertyTaxInput.value || Utils.parseNumber(propertyTaxInput.value) === 0) {
                    propertyTaxInput.value = Utils.formatNumber(annualTax);
                }

                // Update help text
                if (taxHelp) {
                    taxHelp.innerHTML = `Auto-calculated: <span id="tax-rate-display">${taxRate}%</span> of home value`;
                }

                if (taxRateDisplay) {
                    taxRateDisplay.textContent = taxRate + '%';
                }
            }
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
            const homePrice = Utils.parseNumber($('#home-price')?.value || '0');
            const downPayment = Utils.parseNumber($('#down-payment')?.value || '0');
            const rate = parseFloat($('#interest-rate')?.value || '0');

            // Get loan term
            let term;
            const activeTermChip = $('.term-chip.active');
            if (activeTermChip && activeTermChip.dataset.years === 'custom') {
                term = parseInt($('#custom-term')?.value || '30');
            } else if (activeTermChip) {
                term = parseInt(activeTermChip.dataset.years || '30');
            } else {
                term = 30;
            }

            const propertyTax = Utils.parseNumber($('#property-tax')?.value || '0');
            const homeInsurance = Utils.parseNumber($('#home-insurance')?.value || '0');
            const pmi = Utils.parseNumber($('#pmi')?.value || '0');
            const extraMonthly = Utils.parseNumber($('#extra-monthly')?.value || '0');
            const extraOnetime = Utils.parseNumber($('#extra-onetime')?.value || '0');

            return { 
                homePrice, 
                downPayment, 
                rate, 
                term, 
                propertyTax, 
                homeInsurance, 
                pmi,
                extraMonthly, 
                extraOnetime 
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

            if (monthlyRate === 0 || numPayments === 0) return null;

            // Calculate base monthly payment (P&I)
            const monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                             (Math.pow(1 + monthlyRate, numPayments) - 1);

            // Monthly costs
            const monthlyTax = params.propertyTax / 12;
            const monthlyInsurance = params.homeInsurance / 12;
            const monthlyPMI = params.pmi;

            const totalMonthlyPayment = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI;

            // Generate amortization schedule
            const schedule = this.generateAmortizationSchedule(
                loanAmount, 
                monthlyRate, 
                numPayments, 
                params.extraMonthly, 
                params.extraOnetime
            );

            const totalInterest = schedule.reduce((sum, payment) => sum + payment.interest, 0);
            const totalCost = loanAmount + totalInterest;

            // Calculate savings from extra payments
            const baseSchedule = this.generateAmortizationSchedule(loanAmount, monthlyRate, numPayments, 0, 0);
            const baseInterest = baseSchedule.reduce((sum, payment) => sum + payment.interest, 0);
            const interestSavings = baseInterest - totalInterest;
            const timeSavingsMonths = baseSchedule.length - schedule.length;

            const payoffDate = schedule.length > 0 ? schedule[schedule.length - 1].date : new Date();
            const downPaymentPercent = (params.downPayment / params.homePrice) * 100;

            return {
                params,
                loanAmount,
                monthlyPI,
                monthlyTax,
                monthlyInsurance,
                monthlyPMI,
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

        generateAmortizationSchedule(principal, monthlyRate, numPayments, extraMonthly = 0, extraOnetime = 0) {
            const schedule = [];
            let remainingBalance = principal;
            const basePayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                               (Math.pow(1 + monthlyRate, numPayments) - 1);

            const startDate = new Date();

            for (let paymentNum = 1; paymentNum <= numPayments && remainingBalance > 0.01; paymentNum++) {
                const interestPayment = remainingBalance * monthlyRate;

                // Apply extra one-time payment in January of each year
                const isYearlyPayment = extraOnetime > 0 && (paymentNum - 1) % 12 === 0;
                const extraThisMonth = extraMonthly + (isYearlyPayment ? extraOnetime : 0);

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
            $('#total-payment').textContent = Utils.formatCurrency(calc.totalMonthlyPayment);
            $('#principal-interest').textContent = Utils.formatCurrency(calc.monthlyPI);
            $('#monthly-tax').textContent = Utils.formatCurrency(calc.monthlyTax);
            $('#monthly-insurance').textContent = Utils.formatCurrency(calc.monthlyInsurance);
            $('#monthly-pmi').textContent = Utils.formatCurrency(calc.monthlyPMI);

            $('#display-loan-amount').textContent = Utils.formatCurrency(calc.loanAmount);
            $('#display-total-interest').textContent = Utils.formatCurrency(calc.totalInterest);
            $('#display-total-cost').textContent = Utils.formatCurrency(calc.totalCost);
            $('#display-payoff-date').textContent = calc.payoffDate.toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
            });

            // Update chart loan amount
            $('#chart-loan-amount').textContent = Utils.formatCurrency(calc.loanAmount);
        },

        updateSavingsPreview(calc) {
            const preview = $('#savings-preview');
            if (!preview) return;

            if (calc.interestSavings > 0) {
                const years = Math.floor(calc.timeSavingsMonths / 12);
                const months = calc.timeSavingsMonths % 12;

                let timeText = '';
                if (years > 0) {
                    timeText = `${years} year${years !== 1 ? 's' : ''}`;
                }
                if (months > 0) {
                    if (timeText) timeText += ' and ';
                    timeText += `${months} month${months !== 1 ? 's' : ''}`;
                }

                preview.innerHTML = `Potential savings: **${Utils.formatCurrency(calc.interestSavings)}** in interest, pay off **${timeText}** sooner`;
                preview.style.color = 'var(--color-green-500)';

                // Update extra impact if visible
                const extraImpact = $('#extra-impact');
                if (extraImpact) {
                    extraImpact.style.display = 'block';
                    $('#interest-savings').textContent = Utils.formatCurrency(calc.interestSavings);
                    $('#time-savings').textContent = timeText;
                    $('#new-payoff').textContent = calc.payoffDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                    });
                }
            } else {
                preview.textContent = 'Potential savings: $0';
                preview.style.color = '';
                $('#extra-impact')?.style.display == 'none';
            }
        },

        resetForm() {
            // Reset form fields to defaults
            $('#home-price').value = '400,000';
            $('#down-payment').value = '80,000';
            $('#down-payment-percent').value = '20';
            $('#interest-rate').value = STATE.marketRates["30yr"].toFixed(2);
            $('#property-tax').value = '';
            $('#home-insurance').value = '';
            $('#extra-monthly').value = '';
            $('#extra-onetime').value = '';

            // Reset state to California
            $('#property-state').value = 'CA';

            // Reset term to 30 years
            $$('.term-chip').forEach(c => c.classList.remove('active'));
            $('[data-years="30"]')?.classList.add('active');
            $('#custom-term-group').style.display = 'none';
            $('#loan-term').value = '30';

            // Reset down payment toggle
            $('#amount-input').style.display = 'block';
            $('#percent-input').style.display = 'none';
            $('#amount-toggle').classList.add('active');
            $('#percent-toggle').classList.remove('active');

            // Update dependent fields
            this.updateInsurance();
            this.updatePropertyTax();
            this.updatePMIStatus();
            this.calculate();

            Utils.showToast('Form reset to default values', 'success');
            Utils.announceToScreenReader('Form reset to default values');
        },

        showComparison() {
            const modal = $('#comparison-modal');
            if (modal) {
                modal.style.display = 'block';
                this.populateCurrentScenario();
                Utils.announceToScreenReader('Comparison modal opened');
            }
        },

        populateCurrentScenario() {
            const current = $('#current-scenario-details');
            if (!current || !STATE.currentCalculation) return;

            const calc = STATE.currentCalculation;
            current.innerHTML = `
                <div class="scenario-detail">
                    <span>Home Price:</span>
                    <span>${Utils.formatCurrency(calc.params.homePrice)}</span>
                </div>
                <div class="scenario-detail">
                    <span>Down Payment:</span>
                    <span>${Utils.formatCurrency(calc.params.downPayment)} (${calc.downPaymentPercent.toFixed(1)}%)</span>
                </div>
                <div class="scenario-detail">
                    <span>Interest Rate:</span>
                    <span>${calc.params.rate.toFixed(2)}%</span>
                </div>
                <div class="scenario-detail">
                    <span>Loan Term:</span>
                    <span>${calc.params.term} years</span>
                </div>
                <div class="scenario-result">
                    <span>Monthly Payment:</span>
                    <span><strong>${Utils.formatCurrency(calc.totalMonthlyPayment)}</strong></span>
                </div>
            `;
        },

        showShareOptions() {
            const modal = $('#share-modal');
            if (modal) {
                modal.style.display = 'block';

                // Generate share URL with current calculation params
                const params = new URLSearchParams({
                    homePrice: $('#home-price')?.value || '',
                    downPayment: $('#down-payment')?.value || '',
                    interestRate: $('#interest-rate')?.value || '',
                    loanTerm: $('#loan-term')?.value || '30'
                });

                const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
                $('#share-url').value = shareUrl;

                Utils.announceToScreenReader('Share options opened');
            }
        },

        async downloadPDF() {
            try {
                Utils.showToast('Generating PDF...', 'info');
                Utils.announceToScreenReader('Generating PDF report');

                if (!window.jsPDF) {
                    Utils.showToast('PDF library not loaded', 'error');
                    return;
                }

                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF();

                // Add header
                pdf.setFontSize(18);
                pdf.text('Mortgage Calculation Report', 20, 30);

                // Add calculation details
                if (STATE.currentCalculation) {
                    const calc = STATE.currentCalculation;
                    let yPos = 50;

                    pdf.setFontSize(12);
                    pdf.text(`Home Price: ${Utils.formatCurrency(calc.params.homePrice)}`, 20, yPos);
                    yPos += 10;
                    pdf.text(`Down Payment: ${Utils.formatCurrency(calc.params.downPayment)} (${calc.downPaymentPercent.toFixed(1)}%)`, 20, yPos);
                    yPos += 10;
                    pdf.text(`Loan Amount: ${Utils.formatCurrency(calc.loanAmount)}`, 20, yPos);
                    yPos += 10;
                    pdf.text(`Interest Rate: ${calc.params.rate.toFixed(2)}%`, 20, yPos);
                    yPos += 10;
                    pdf.text(`Loan Term: ${calc.params.term} years`, 20, yPos);
                    yPos += 20;

                    pdf.setFontSize(14);
                    pdf.text(`Total Monthly Payment: ${Utils.formatCurrency(calc.totalMonthlyPayment)}`, 20, yPos);
                    yPos += 15;

                    pdf.setFontSize(12);
                    pdf.text(`Principal & Interest: ${Utils.formatCurrency(calc.monthlyPI)}`, 25, yPos);
                    yPos += 8;
                    pdf.text(`Property Tax: ${Utils.formatCurrency(calc.monthlyTax)}`, 25, yPos);
                    yPos += 8;
                    pdf.text(`Home Insurance: ${Utils.formatCurrency(calc.monthlyInsurance)}`, 25, yPos);
                    yPos += 8;
                    pdf.text(`PMI: ${Utils.formatCurrency(calc.monthlyPMI)}`, 25, yPos);
                    yPos += 20;

                    pdf.text(`Total Interest: ${Utils.formatCurrency(calc.totalInterest)}`, 20, yPos);
                    yPos += 10;
                    pdf.text(`Total Cost: ${Utils.formatCurrency(calc.totalCost)}`, 20, yPos);
                    yPos += 10;
                    pdf.text(`Payoff Date: ${calc.payoffDate.toLocaleDateString()}`, 20, yPos);
                }

                // Add footer
                const pageHeight = pdf.internal.pageSize.height;
                pdf.setFontSize(10);
                pdf.text('Generated by World\'s First AI Calculator', 20, pageHeight - 20);
                pdf.text(new Date().toLocaleDateString(), 150, pageHeight - 20);

                pdf.save('mortgage-calculation.pdf');
                Utils.showToast('PDF downloaded successfully!', 'success');

            } catch (error) {
                console.error('PDF generation error:', error);
                Utils.showToast('Failed to generate PDF', 'error');
            }
        },

        printResults() {
            const printContent = document.createElement('div');
            printContent.innerHTML = `
                <h1>Mortgage Calculation Report</h1>
                <div id="print-results"></div>
            `;

            if (STATE.currentCalculation) {
                const calc = STATE.currentCalculation;
                printContent.querySelector('#print-results').innerHTML = `
                    <h2>Loan Details</h2>
                    <p>Home Price: ${Utils.formatCurrency(calc.params.homePrice)}</p>
                    <p>Down Payment: ${Utils.formatCurrency(calc.params.downPayment)} (${calc.downPaymentPercent.toFixed(1)}%)</p>
                    <p>Loan Amount: ${Utils.formatCurrency(calc.loanAmount)}</p>
                    <p>Interest Rate: ${calc.params.rate.toFixed(2)}%</p>
                    <p>Loan Term: ${calc.params.term} years</p>

                    <h2>Monthly Payment Breakdown</h2>
                    <p><strong>Total Monthly Payment: ${Utils.formatCurrency(calc.totalMonthlyPayment)}</strong></p>
                    <p>Principal & Interest: ${Utils.formatCurrency(calc.monthlyPI)}</p>
                    <p>Property Tax: ${Utils.formatCurrency(calc.monthlyTax)}</p>
                    <p>Home Insurance: ${Utils.formatCurrency(calc.monthlyInsurance)}</p>
                    <p>PMI: ${Utils.formatCurrency(calc.monthlyPMI)}</p>

                    <h2>Loan Summary</h2>
                    <p>Total Interest: ${Utils.formatCurrency(calc.totalInterest)}</p>
                    <p>Total Cost: ${Utils.formatCurrency(calc.totalCost)}</p>
                    <p>Payoff Date: ${calc.payoffDate.toLocaleDateString()}</p>
                `;
            }

            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Mortgage Calculation Report</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 40px; }
                            h1 { color: #0d9488; }
                            h2 { color: #334155; margin-top: 30px; }
                            p { margin: 10px 0; }
                        </style>
                    </head>
                    <body>
                        ${printContent.innerHTML}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();

            Utils.announceToScreenReader('Print dialog opened');
        },

        saveCalculation() {
            if (!STATE.currentCalculation) {
                Utils.showToast('No calculation to save', 'warning');
                return;
            }

            const calc = STATE.currentCalculation;
            const savedCalc = {
                timestamp: new Date().toISOString(),
                params: calc.params,
                results: {
                    totalMonthlyPayment: calc.totalMonthlyPayment,
                    loanAmount: calc.loanAmount,
                    totalInterest: calc.totalInterest,
                    totalCost: calc.totalCost,
                    payoffDate: calc.payoffDate
                }
            };

            // Save to localStorage
            const savedCalculations = JSON.parse(localStorage.getItem('savedCalculations') || '[]');
            savedCalculations.push(savedCalc);

            // Keep only last 10 calculations
            if (savedCalculations.length > 10) {
                savedCalculations.splice(0, savedCalculations.length - 10);
            }

            localStorage.setItem('savedCalculations', JSON.stringify(savedCalculations));

            Utils.showToast('Calculation saved successfully', 'success');
            Utils.announceToScreenReader('Calculation saved for future reference');
        },

        toggleCurrentRates() {
            const panel = $('#current-rates');
            if (panel) {
                const isVisible = panel.style.display === 'block';
                panel.style.display = isVisible ? 'none' : 'block';

                if (!isVisible) {
                    // Update rates display
                    $('#market-30yr').textContent = STATE.marketRates["30yr"].toFixed(2) + '%';
                    $('#market-15yr').textContent = STATE.marketRates["15yr"].toFixed(2) + '%';

                    Utils.announceToScreenReader('Current market rates displayed');
                } else {
                    Utils.announceToScreenReader('Current market rates hidden');
                }
            }
        }
    };

    // ========== YEAR SLIDER MANAGER ==========
    const YearSliderManager = {
        init(calculation) {
            if (!calculation || !calculation.schedule) return;

            this.calculation = calculation;
            this.generateYearlyData();
            this.setupSlider();
            this.updateFromSlider(Math.min(28, this.yearlyData.length));
        },

        generateYearlyData() {
            const schedule = this.calculation.schedule;
            this.yearlyData = [];

            let totalPrincipal = 0;
            let totalInterest = 0;
            const loanAmount = this.calculation.loanAmount;

            for (let year = 1; year <= this.calculation.params.term; year++) {
                const endOfYearIndex = Math.min(year * 12 - 1, schedule.length - 1);
                if (endOfYearIndex < 0 || !schedule[endOfYearIndex]) continue;

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

            // Screen reader announcement
            Utils.announceToScreenReader(
                `Year ${year}: Remaining balance ${Utils.formatCurrency(data.balance)}, ` +
                `Principal paid ${Utils.formatCurrency(data.totalPrincipal)}, ` +
                `Interest paid ${Utils.formatCurrency(data.totalInterest)}`
            );
        }
    };

    // ========== CHART MANAGER ==========
    const ChartManager = {
        init() {
            if (!window.Chart) {
                console.error('Chart.js not loaded');
                return;
            }

            const ctx = $('#mortgage-timeline-chart')?.getContext('2d');
            if (!ctx) return;

            STATE.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Remaining Balance',
                            data: [],
                            borderColor: '#f97316',
                            backgroundColor: 'rgba(249, 115, 22, 0.1)',
                            fill: true,
                            tension: 0.2,
                            pointRadius: 3,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'Principal Paid',
                            data: [],
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.2,
                            fill: false,
                            pointRadius: 3,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'Interest Paid',
                            data: [],
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.2,
                            fill: false,
                            pointRadius: 3,
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
                                text: 'Amount'
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

            const yearlyData = YearSliderManager.yearlyData;
            if (yearlyData.length === 0) return;

            const years = yearlyData.map(d => d.year);
            STATE.chart.data.labels = years;
            STATE.chart.data.datasets[0].data = yearlyData.map(d => d.balance);
            STATE.chart.data.datasets[1].data = yearlyData.map(d => d.totalPrincipal);
            STATE.chart.data.datasets[2].data = yearlyData.map(d => d.totalInterest);

            STATE.chart.update();
        }
    };

    // ========== AI INSIGHTS ==========
    const AIInsights = {
        render(calc) {
            const container = $('#ai-insights-content');
            if (!container || !calc) return;

            const insights = this.generateInsights(calc);
            container.innerHTML = insights.map(insight => `
                <div class="insight-item ${insight.type}">
                    <div class="insight-icon">
                        <i class="fas fa-${insight.icon}"></i>
                    </div>
                    <div class="insight-content">
                        <div class="insight-title">${insight.title}</div>
                        <div class="insight-text">${insight.text}</div>
                    </div>
                </div>
            `).join('');
        },

        generateInsights(calc) {
            const insights = [];

            // Payment to income ratio insight
            if (calc.totalMonthlyPayment) {
                const estimatedIncome = calc.totalMonthlyPayment * 3.5; // Assume 28% rule
                insights.push({
                    type: 'info',
                    icon: 'chart-pie',
                    title: 'Payment-to-Income Ratio',
                    text: `Your monthly payment suggests an income of ~${Utils.formatCurrency(estimatedIncome * 12, 0)} annually. Aim to keep housing costs under 28% of gross income.`
                });
            }

            // PMI insight
            if (calc.monthlyPMI > 0) {
                const annualPMI = calc.monthlyPMI * 12;
                insights.push({
                    type: 'warning',
                    icon: 'exclamation-triangle',
                    title: 'PMI Elimination Strategy',
                    text: `You're paying ${Utils.formatCurrency(annualPMI, 0)} annually in PMI. Consider extra principal payments to reach 20% equity faster and eliminate this cost.`
                });
            } else {
                insights.push({
                    type: 'success',
                    icon: 'check-circle',
                    title: 'No PMI Required',
                    text: `Great! With 20%+ down payment, you avoid PMI, saving approximately ${Utils.formatCurrency(calc.loanAmount * 0.005, 0)} annually.`
                });
            }

            // Interest rate insight
            const currentMarketRate = STATE.marketRates["30yr"];
            if (calc.params.rate < currentMarketRate - 0.25) {
                insights.push({
                    type: 'success',
                    icon: 'thumbs-up',
                    title: 'Excellent Rate',
                    text: `Your ${calc.params.rate.toFixed(2)}% rate is below current market average of ${currentMarketRate.toFixed(2)}%. This saves you approximately ${Utils.formatCurrency((currentMarketRate - calc.params.rate) * calc.loanAmount / 100 / 12 * 12, 0)} annually.`
                });
            } else if (calc.params.rate > currentMarketRate + 0.25) {
                insights.push({
                    type: 'warning',
                    icon: 'exclamation-circle',
                    title: 'Rate Shopping Opportunity',
                    text: `Your ${calc.params.rate.toFixed(2)}% rate is above market average of ${currentMarketRate.toFixed(2)}%. Consider shopping for better rates to potentially save thousands.`
                });
            }

            // Extra payment insight
            if (calc.params.extraMonthly > 0 || calc.params.extraOnetime > 0) {
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
                    title: 'Smart Extra Payment Strategy',
                    text: `Your extra payments will save ${Utils.formatCurrency(calc.interestSavings)} in interest and pay off your loan ${timeText} early. Excellent financial decision!`
                });
            } else {
                const extraPayment = Math.round(calc.monthlyPI * 0.1); // 10% extra
                const potentialSavings = calc.totalInterest * 0.15; // Rough estimate
                insights.push({
                    type: 'info',
                    icon: 'lightbulb',
                    title: 'Extra Payment Opportunity',
                    text: `Consider adding just ${Utils.formatCurrency(extraPayment)} monthly to your principal. This could save you approximately ${Utils.formatCurrency(potentialSavings)} in interest over the loan term.`
                });
            }

            // Bi-weekly payment insight (as requested)
            const biweeklyPayment = calc.monthlyPI / 2;
            const biweeklyInterestSavings = calc.totalInterest * 0.25; // Rough estimate
            const biweeklyTimeSavings = calc.params.term * 12 * 0.25; // Rough estimate in months
            const biweeklyYears = Math.floor(biweeklyTimeSavings / 12);

            insights.push({
                type: 'info',
                icon: 'calendar-alt',
                title: 'Bi-weekly Payment Strategy',
                text: `If you paid ${Utils.formatCurrency(biweeklyPayment)} every two weeks instead of monthly, you'd save approximately ${Utils.formatCurrency(biweeklyInterestSavings)} in interest and pay off your loan about ${biweeklyYears} years earlier.`
            });

            // Refinancing insight
            if (calc.params.rate > 6.0) {
                insights.push({
                    type: 'info',
                    icon: 'exchange-alt',
                    title: 'Future Refinancing Opportunity',
                    text: `Monitor rates closely. If rates drop 0.5-1% below your current rate, refinancing could save significant money, even with closing costs.`
                });
            }

            return insights;
        }
    };

    // ========== AMORTIZATION TABLE ==========
    const AmortizationTable = {
        render(calc) {
            if (!calc || !calc.schedule) return;

            STATE.amortizationData = calc.schedule;
            STATE.currentPage = 1;
            STATE.totalPages = Math.ceil(calc.schedule.length / CONFIG.paymentsPerPage);

            this.updateTable();
            this.updatePagination();
            this.bindPaginationEvents();
        },

        updateTable() {
            const tbody = $('#amortization-table tbody');
            if (!tbody || !STATE.amortizationData.length) {
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="6" class="no-data">Calculate mortgage to view schedule</td></tr>';
                }
                return;
            }

            const startIndex = (STATE.currentPage - 1) * CONFIG.paymentsPerPage;
            const endIndex = Math.min(startIndex + CONFIG.paymentsPerPage, STATE.amortizationData.length);
            const pageData = STATE.amortizationData.slice(startIndex, endIndex);

            tbody.innerHTML = pageData.map(payment => `
                <tr>
                    <td>${payment.paymentNumber}</td>
                    <td>${Utils.formatDate(payment.date)}</td>
                    <td>${Utils.formatCurrency(payment.payment)}</td>
                    <td>${Utils.formatCurrency(payment.principal)}</td>
                    <td>${Utils.formatCurrency(payment.interest)}</td>
                    <td>${Utils.formatCurrency(payment.balance)}</td>
                </tr>
            `).join('');
        },

        updatePagination() {
            $('#page-display').textContent = `Page ${STATE.currentPage}`;
            $('#total-pages').textContent = STATE.totalPages;
            $('#payment-count').textContent = `${STATE.amortizationData.length} payments`;

            // Update button states
            $('#first-page').disabled = STATE.currentPage === 1;
            $('#prev-page').disabled = STATE.currentPage === 1;
            $('#next-page').disabled = STATE.currentPage === STATE.totalPages;
            $('#last-page').disabled = STATE.currentPage === STATE.totalPages;
        },

        bindPaginationEvents() {
            $('#first-page')?.addEventListener('click', () => {
                STATE.currentPage = 1;
                this.updateTable();
                this.updatePagination();
            });

            $('#prev-page')?.addEventListener('click', () => {
                if (STATE.currentPage > 1) {
                    STATE.currentPage--;
                    this.updateTable();
                    this.updatePagination();
                }
            });

            $('#next-page')?.addEventListener('click', () => {
                if (STATE.currentPage < STATE.totalPages) {
                    STATE.currentPage++;
                    this.updateTable();
                    this.updatePagination();
                }
            });

            $('#last-page')?.addEventListener('click', () => {
                STATE.currentPage = STATE.totalPages;
                this.updateTable();
                this.updatePagination();
            });

            // Download and print handlers
            $('#download-schedule')?.addEventListener('click', () => this.downloadSchedule());
            $('#print-schedule')?.addEventListener('click', () => this.printSchedule());
        },

        downloadSchedule() {
            if (!STATE.amortizationData.length) return;

            // Create CSV content
            const headers = ['Payment #', 'Date', 'Payment', 'Principal', 'Interest', 'Balance'];
            const csvContent = [
                headers.join(','),
                ...STATE.amortizationData.map(payment => [
                    payment.paymentNumber,
                    Utils.formatDate(payment.date),
                    payment.payment.toFixed(2),
                    payment.principal.toFixed(2),
                    payment.interest.toFixed(2),
                    payment.balance.toFixed(2)
                ].join(','))
            ].join('\n');

            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'amortization-schedule.csv';
            a.click();
            window.URL.revokeObjectURL(url);

            Utils.showToast('Amortization schedule downloaded', 'success');
        },

        printSchedule() {
            if (!STATE.amortizationData.length) return;

            const printContent = `
                <h1>Amortization Schedule</h1>
                <table border="1" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f0f0f0;">
                            <th>Payment #</th>
                            <th>Date</th>
                            <th>Payment</th>
                            <th>Principal</th>
                            <th>Interest</th>
                            <th>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${STATE.amortizationData.map(payment => `
                            <tr>
                                <td>${payment.paymentNumber}</td>
                                <td>${Utils.formatDate(payment.date)}</td>
                                <td>${Utils.formatCurrency(payment.payment)}</td>
                                <td>${Utils.formatCurrency(payment.principal)}</td>
                                <td>${Utils.formatCurrency(payment.interest)}</td>
                                <td>${Utils.formatCurrency(payment.balance)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Amortization Schedule</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            h1 { color: #0d9488; }
                            table { font-size: 12px; }
                            th { padding: 8px; text-align: left; }
                            td { padding: 6px; }
                        </style>
                    </head>
                    <body>${printContent}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    // ========== INITIALIZATION ==========
    function initialize() {
        try {
            // Initialize all components
            StatsUpdater.init();
            AccessibilityControls.init();
            GlobalVoiceControl.init();
            FormVoiceControl.init();
            MortgageCalculator.init();
            ChartManager.init();

            // Load URL parameters if present
            loadURLParameters();

            Utils.showToast('Calculator loaded successfully', 'success');
            console.log('🎯 World\'s First AI-Enhanced Mortgage Calculator initialized successfully!');

        } catch (error) {
            console.error('Initialization error:', error);
            Utils.showToast('Error loading calculator', 'error');
        }
    }

    function loadURLParameters() {
        const params = new URLSearchParams(window.location.search);

        if (params.has('homePrice')) {
            $('#home-price').value = Utils.formatNumber(params.get('homePrice'));
        }
        if (params.has('downPayment')) {
            $('#down-payment').value = Utils.formatNumber(params.get('downPayment'));
        }
        if (params.has('interestRate')) {
            $('#interest-rate').value = params.get('interestRate');
        }
        if (params.has('loanTerm')) {
            const term = params.get('loanTerm');
            $$('.term-chip').forEach(chip => chip.classList.remove('active'));
            $(`[data-years="${term}"]`)?.classList.add('active');
        }

        // Trigger calculation if parameters were loaded
        if (params.toString()) {
            MortgageCalculator.calculate();
        }
    }

    // Start the application
    initialize();
});
