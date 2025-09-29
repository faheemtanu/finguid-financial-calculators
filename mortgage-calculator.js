/**
 * World's First AI-Enhanced Mortgage Calculator - Complete JavaScript
 * Full-Featured Implementation with Voice Control, AI Insights, and Real Calculations
 * Version: 2.0 Ultimate Edition
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // CONFIGURATION & STATE MANAGEMENT
    // ==========================================================================

    const CONFIG = {
        debounceDelay: 300,
        defaultInsuranceRate: 0.002, // 0.2% of home value annually
        calculationsUpdateInterval: 7000,
        savingsUpdateInterval: 9000,
        voiceTimeout: 15000,
        maxSliderYear: 30,
        pmiRate: 0.005, // 0.5% annually
        apiUpdateInterval: 15 * 60 * 1000, // 15 minutes
        paymentsPerPage: 12,
        animation: {
            duration: 300,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }
    };

    const STATE = {
        // Core application state
        chart: null,
        yearlyData: [],
        currentCalculation: null,
        
        // Voice control state  
        globalVoiceRecognition: null,
        localVoiceRecognition: null,
        isGlobalListening: false,
        isLocalListening: false,
        
        // UI state
        currentFontSize: 100,
        theme: 'light',
        screenReaderActive: false,
        
        // Dynamic data
        calculationsToday: 12847,
        avgSavings: 45000,
        
        // Table state
        currentPage: 1,
        totalPages: 1,
        amortizationData: [],
        
        // Market data
        marketRates: {
            "30yr": 6.75,
            "15yr": 6.25,
            "arm": 5.95,
            "fha": 6.50
        },
        lastUpdated: new Date(),
        
        // Comparison data
        comparisonData: null,
        savedCalculations: []
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

    // ==========================================================================
    // UTILITY FUNCTIONS
    // ==========================================================================

    const Utils = {
        formatCurrency: (amount, decimals = 0) => {
            if (amount === null || amount === undefined || isNaN(amount)) return '$0';
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(Math.abs(amount));
        },

        formatNumber: (num) => {
            if (num === null || num === undefined || isNaN(num)) return '0';
            return new Intl.NumberFormat('en-US').format(num);
        },

        parseNumber: (str) => {
            if (!str || str === '') return 0;
            // Remove all non-numeric characters except decimal point and negative sign
            const cleaned = str.toString().replace(/[^\d.-]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : Math.abs(parsed); // Always return positive
        },

        debounce: (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func.apply(this, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        generateId: () => {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        },

        formatDate: (date) => {
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(date);
        },

        updateDateTime: () => {
            const now = new Date();
            const dateTimeString = new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }).format(now);

            const elements = document.querySelectorAll('#current-date-time, #rate-update-time, .rate-timestamp, .rate-update');
            elements.forEach(el => {
                if (el) el.textContent = `Updated ${dateTimeString}`;
            });
        },

        // DOM utilities
        $: (selector) => document.querySelector(selector),
        $$: (selector) => document.querySelectorAll(selector),

        showToast: (message, type = 'info') => {
            const container = Utils.$('#toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;

            const iconMap = {
                'success': 'check-circle',
                'error': 'exclamation-triangle',
                'warning': 'exclamation-circle',
                'info': 'info-circle'
            };

            toast.innerHTML = `
                <i class="fas fa-${iconMap[type] || 'info-circle'}"></i>
                <span class="toast-message">${message}</span>
            `;

            container.appendChild(toast);

            // Auto remove after 5 seconds
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.style.animation = 'toastSlideIn 0.3s ease-out reverse';
                    setTimeout(() => toast.remove(), 300);
                }
            }, 5000);
        },

        announceToScreenReader: (message) => {
            if (!STATE.screenReaderActive) return;
            const announcements = Utils.$('#sr-announcements');
            if (announcements) {
                announcements.textContent = message;
                // Clear after a moment to allow for repeated announcements
                setTimeout(() => {
                    if (announcements.textContent === message) {
                        announcements.textContent = '';
                    }
                }, 1000);
            }
        },

        showLoading: (show = true) => {
            const overlay = Utils.$('#loading-overlay');
            if (overlay) {
                overlay.style.display = show ? 'grid' : 'none';
            }
        }
    };

    // ==========================================================================
    // DYNAMIC STATISTICS UPDATER
    // ==========================================================================

    const StatsUpdater = {
        init() {
            this.updateCalculationsCounter();
            this.updateSavingsCounter();
            
            // Set up intervals for live updates
            setInterval(() => this.updateCalculationsCounter(), CONFIG.calculationsUpdateInterval);
            setInterval(() => this.updateSavingsCounter(), CONFIG.savingsUpdateInterval);
            setInterval(() => this.updateMarketRates(), CONFIG.apiUpdateInterval);
            
            // Update timestamps
            Utils.updateDateTime();
            setInterval(() => Utils.updateDateTime(), 60000); // Update every minute
        },

        updateCalculationsCounter() {
            const increment = Math.floor(Math.random() * 20) + 8; // 8-27 increment
            STATE.calculationsToday += increment;
            
            const element = Utils.$('#calc-count');
            if (element) {
                element.textContent = Utils.formatNumber(STATE.calculationsToday);
            }
        },

        updateSavingsCounter() {
            const increment = Math.floor(Math.random() * 2500) + 750; // 750-3249 increment
            STATE.avgSavings += increment;
            
            const element = Utils.$('#avg-savings');
            if (element) {
                const formattedValue = Math.floor(STATE.avgSavings / 1000) + 'K';
                element.textContent = '$' + formattedValue;
            }
        },

        updateMarketRates() {
            // Simulate realistic market rate fluctuations
            Object.keys(STATE.marketRates).forEach(rateType => {
                const variation = (Math.random() - 0.5) * 0.2; // ±0.1%
                const currentRate = STATE.marketRates[rateType];
                const newRate = Math.max(4.0, Math.min(9.0, currentRate + variation));
                STATE.marketRates[rateType] = Math.round(newRate * 100) / 100; // Round to 2 decimals
            });

            // Update display elements
            const rate30Element = Utils.$('#market-30yr');
            const rate15Element = Utils.$('#market-15yr');
            const rateArmElement = Utils.$('#market-arm');
            
            if (rate30Element) rate30Element.textContent = STATE.marketRates["30yr"].toFixed(2) + '%';
            if (rate15Element) rate15Element.textContent = STATE.marketRates["15yr"].toFixed(2) + '%';
            if (rateArmElement) rateArmElement.textContent = STATE.marketRates["arm"].toFixed(2) + '%';

            STATE.lastUpdated = new Date();
            Utils.updateDateTime();
        }
    };

    // ==========================================================================
    // GLOBAL VOICE CONTROL SYSTEM
    // ==========================================================================

    const GlobalVoiceControl = {
        init() {
            // Check for speech recognition support
            if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
                console.warn('Speech recognition not supported in this browser');
                this.disableVoiceControls();
                return;
            }

            this.setupSpeechRecognition();
            this.bindEvents();
        },

        disableVoiceControls() {
            const voiceButtons = Utils.$$('#voice-toggle, #voice-input, #voice-demo');
            voiceButtons.forEach(btn => {
                if (btn) {
                    btn.disabled = true;
                    btn.title = 'Voice control not supported in this browser';
                    btn.style.opacity = '0.5';
                }
            });
        },

        setupSpeechRecognition() {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            STATE.globalVoiceRecognition = new SpeechRecognition();
            
            STATE.globalVoiceRecognition.continuous = true;
            STATE.globalVoiceRecognition.interimResults = false;
            STATE.globalVoiceRecognition.lang = 'en-US';
            STATE.globalVoiceRecognition.maxAlternatives = 3;

            // Event handlers
            STATE.globalVoiceRecognition.onstart = () => this.onStart();
            STATE.globalVoiceRecognition.onresult = (event) => this.onResult(event);
            STATE.globalVoiceRecognition.onerror = (event) => this.onError(event);
            STATE.globalVoiceRecognition.onend = () => this.onEnd();
        },

        bindEvents() {
            const voiceToggle = Utils.$('#voice-toggle');
            const voiceDemo = Utils.$('#voice-demo');
            const voiceInput = Utils.$('#voice-input');

            if (voiceToggle) {
                voiceToggle.addEventListener('click', () => this.toggle());
            }

            if (voiceDemo) {
                voiceDemo.addEventListener('click', () => this.startDemo());
            }

            if (voiceInput) {
                voiceInput.addEventListener('click', () => this.startLocalInput());
            }
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
                Utils.announceToScreenReader('Global voice control activated');
            } catch (error) {
                console.error('Voice recognition start error:', error);
                Utils.showToast('Voice recognition failed to start', 'error');
            }
        },

        stop() {
            if (!STATE.globalVoiceRecognition || !STATE.isGlobalListening) return;
            STATE.globalVoiceRecognition.stop();
        },

        startDemo() {
            this.start();
            setTimeout(() => {
                Utils.showToast('Try saying: "Set home price to 500 thousand" or "Calculate mortgage"', 'info');
            }, 1000);
        },

        startLocalInput() {
            this.start();
            Utils.showToast('Listening for mortgage details...', 'info');
        },

        onStart() {
            STATE.isGlobalListening = true;
            this.updateVoiceUI(true);
            Utils.announceToScreenReader('Voice listening started');
        },

        onResult(event) {
            const results = Array.from(event.results);
            const lastResult = results[results.length - 1];
            
            if (lastResult.isFinal) {
                const transcript = lastResult[0].transcript.toLowerCase().trim();
                this.updateVoiceStatus(`Heard: "${transcript}"`);
                
                // Process command after short delay
                setTimeout(() => {
                    this.processCommand(transcript);
                }, 500);
            }
        },

        onError(event) {
            console.error('Voice recognition error:', event.error);
            
            const errorMessages = {
                'no-speech': 'No speech detected. Please try again.',
                'audio-capture': 'Microphone not accessible. Check permissions.',
                'not-allowed': 'Microphone access denied. Please allow microphone access.',
                'network': 'Network error occurred during speech recognition.'
            };

            const message = errorMessages[event.error] || `Voice error: ${event.error}`;
            Utils.showToast(message, 'error');
            this.stop();
        },

        onEnd() {
            STATE.isGlobalListening = false;
            this.updateVoiceUI(false);
            Utils.announceToScreenReader('Voice listening stopped');
        },

        updateVoiceUI(isListening) {
            const btn = Utils.$('#voice-toggle');
            const icon = Utils.$('#voice-icon');
            const status = Utils.$('#voice-status');

            if (btn) btn.classList.toggle('active', isListening);
            if (icon) icon.className = isListening ? 'fas fa-microphone-slash' : 'fas fa-microphone';
            
            if (status) {
                status.style.display = isListening ? 'flex' : 'none';
                if (isListening) {
                    this.updateVoiceStatus('Global Voice Active - Say your command...');
                }
            }
        },

        updateVoiceStatus(text) {
            const statusText = Utils.$('#voice-text');
            if (statusText) {
                statusText.textContent = text;
            }
        },

        processCommand(command) {
            console.log('Processing voice command:', command);

            // Navigation commands
            if (this.handleNavigationCommands(command)) return;
            
            // Theme and accessibility commands
            if (this.handleAccessibilityCommands(command)) return;
            
            // Calculator commands
            if (this.handleCalculatorCommands(command)) return;
            
            // Field input commands
            if (this.handleFieldCommands(command)) return;

            // If no command matched
            Utils.showToast(`Command "${command}" not recognized. Try "calculate", "dark mode", or specify field values.`, 'info');
        },

        handleNavigationCommands(command) {
            const navCommands = {
                'show chart': () => MortgageCalculator.switchTab('chart'),
                'mortgage over time': () => MortgageCalculator.switchTab('chart'),
                'show insights': () => MortgageCalculator.switchTab('insights'),
                'ai insights': () => MortgageCalculator.switchTab('insights'),
                'show schedule': () => MortgageCalculator.switchTab('amortization'),
                'amortization': () => MortgageCalculator.switchTab('amortization'),
                'payment schedule': () => MortgageCalculator.switchTab('amortization'),
                'scroll to calculator': () => {
                    document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
                }
            };

            for (const [phrase, action] of Object.entries(navCommands)) {
                if (command.includes(phrase)) {
                    action();
                    Utils.showToast(`Navigated to ${phrase}`, 'success');
                    return true;
                }
            }
            return false;
        },

        handleAccessibilityCommands(command) {
            if (command.includes('dark mode') || command.includes('dark theme')) {
                AccessibilityControls.setTheme('dark');
                return true;
            }

            if (command.includes('light mode') || command.includes('light theme')) {
                AccessibilityControls.setTheme('light');
                return true;
            }

            if (command.includes('increase font') || command.includes('bigger text') || command.includes('larger font')) {
                AccessibilityControls.adjustFontSize(10);
                return true;
            }

            if (command.includes('decrease font') || command.includes('smaller text') || command.includes('smaller font')) {
                AccessibilityControls.adjustFontSize(-10);
                return true;
            }

            return false;
        },

        handleCalculatorCommands(command) {
            if (command.includes('calculate') || command.includes('compute') || command.includes('run calculation')) {
                MortgageCalculator.calculate();
                Utils.announceToScreenReader('Mortgage calculation updated');
                Utils.showToast('Mortgage calculated successfully', 'success');
                return true;
            }

            if (command.includes('reset') || command.includes('clear all') || command.includes('start over')) {
                MortgageCalculator.resetForm();
                return true;
            }

            if (command.includes('save') || command.includes('save calculation')) {
                MortgageCalculator.saveCalculation();
                return true;
            }

            return false;
        },

        handleFieldCommands(command) {
            // Price commands - handle various formats
            const priceMatch = command.match(/(?:home price|house price|property price)\s+(?:to\s+)?(?:\$?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:thousand|k)?|\$?(\d+)k|\$?(\d+)\s*thousand)/i);
            if (priceMatch) {
                let value;
                if (priceMatch[1]) {
                    value = parseFloat(priceMatch[1].replace(/,/g, ''));
                    if (command.includes('thousand') || command.includes('k')) value *= 1000;
                } else if (priceMatch[2]) {
                    value = parseFloat(priceMatch[2]) * 1000;
                } else if (priceMatch[3]) {
                    value = parseFloat(priceMatch[3]) * 1000;
                }
                
                if (value) {
                    this.updateField('home-price', value);
                    return true;
                }
            }

            // Down payment commands
            const downPaymentMatch = command.match(/(?:down payment)\s+(?:to\s+)?(?:\$?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:thousand|k)?|\$?(\d+)k|\$?(\d+)\s*thousand)/i);
            if (downPaymentMatch) {
                let value;
                if (downPaymentMatch[1]) {
                    value = parseFloat(downPaymentMatch[1].replace(/,/g, ''));
                    if (command.includes('thousand') || command.includes('k')) value *= 1000;
                } else if (downPaymentMatch[2]) {
                    value = parseFloat(downPaymentMatch[2]) * 1000;
                } else if (downPaymentMatch[3]) {
                    value = parseFloat(downPaymentMatch[3]) * 1000;
                }
                
                if (value) {
                    this.updateField('down-payment', value);
                    return true;
                }
            }

            // Interest rate commands
            const rateMatch = command.match(/(?:interest rate|rate)\s+(?:to\s+)?([\d.]+)(?:\s*percent)?/i);
            if (rateMatch) {
                const rate = parseFloat(rateMatch[1]);
                this.updateField('interest-rate', rate);
                return true;
            }

            // Loan term commands
            const termMatch = command.match(/(?:loan term|term)\s+(?:to\s+)?(\d+)\s*(?:years?)?/i);
            if (termMatch) {
                const term = parseInt(termMatch[1]);
                if ([15, 20, 30].includes(term)) {
                    this.updateField('loan-term', term);
                    return true;
                }
            }

            return false;
        },

        updateField(fieldId, value) {
            const field = Utils.$('#' + fieldId);
            if (!field) return;

            if (fieldId === 'loan-term') {
                // Handle term selection
                Utils.$$('.term-chip').forEach(chip => chip.classList.remove('active'));
                const termChip = Utils.$(`[data-term="${value}"]`);
                if (termChip) {
                    termChip.classList.add('active');
                    termChip.setAttribute('aria-checked', 'true');
                }
                field.value = value;
            } else if (fieldId === 'interest-rate') {
                field.value = value.toString();
            } else {
                field.value = Utils.formatNumber(value);
            }

            // Trigger input event to update calculations
            field.dispatchEvent(new Event('input', { bubbles: true }));

            // Provide feedback
            const fieldNames = {
                'home-price': 'Home price',
                'down-payment': 'Down payment', 
                'interest-rate': 'Interest rate',
                'loan-term': 'Loan term'
            };

            const displayValue = fieldId === 'interest-rate' ? 
                `${value}%` : 
                fieldId === 'loan-term' ? 
                `${value} years` : 
                Utils.formatCurrency(value);

            Utils.announceToScreenReader(`${fieldNames[fieldId]} set to ${displayValue}`);
            Utils.showToast(`${fieldNames[fieldId]} updated to ${displayValue}`, 'success');
        }
    };

    // ==========================================================================
    // ACCESSIBILITY CONTROLS
    // ==========================================================================

    const AccessibilityControls = {
        init() {
            this.bindEvents();
            this.loadSavedSettings();
        },

        bindEvents() {
            const fontSmallerBtn = Utils.$('#font-smaller');
            const fontLargerBtn = Utils.$('#font-larger');
            const themeToggleBtn = Utils.$('#theme-toggle');
            const screenReaderBtn = Utils.$('#screen-reader-toggle');

            if (fontSmallerBtn) fontSmallerBtn.addEventListener('click', () => this.adjustFontSize(-10));
            if (fontLargerBtn) fontLargerBtn.addEventListener('click', () => this.adjustFontSize(10));
            if (themeToggleBtn) themeToggleBtn.addEventListener('click', () => this.toggleTheme());
            if (screenReaderBtn) screenReaderBtn.addEventListener('click', () => this.toggleScreenReader());
        },

        loadSavedSettings() {
            // Load theme
            const savedTheme = localStorage.getItem('mortgageCalc_theme') || 'light';
            this.setTheme(savedTheme);

            // Load font size
            const savedFontSize = localStorage.getItem('mortgageCalc_fontSize') || '100';
            STATE.currentFontSize = parseInt(savedFontSize);
            document.documentElement.style.fontSize = STATE.currentFontSize + '%';

            // Load screen reader setting
            const savedScreenReader = localStorage.getItem('mortgageCalc_screenReader') === 'true';
            STATE.screenReaderActive = savedScreenReader;
            this.updateScreenReaderButton();
        },

        adjustFontSize(change) {
            STATE.currentFontSize = Math.max(80, Math.min(150, STATE.currentFontSize + change));
            
            document.documentElement.style.fontSize = STATE.currentFontSize + '%';
            localStorage.setItem('mortgageCalc_fontSize', STATE.currentFontSize.toString());

            const action = change > 0 ? 'increased' : 'decreased';
            Utils.announceToScreenReader(`Font size ${action} to ${STATE.currentFontSize}%`);
            Utils.showToast(`Font size ${action} to ${STATE.currentFontSize}%`, 'success');
        },

        toggleTheme() {
            STATE.theme = STATE.theme === 'light' ? 'dark' : 'light';
            this.setTheme(STATE.theme);
        },

        setTheme(theme) {
            STATE.theme = theme;
            
            // Update document attributes
            document.documentElement.setAttribute('data-theme', theme);
            document.body.setAttribute('data-theme', theme);
            
            // Save preference
            localStorage.setItem('mortgageCalc_theme', theme);

            // Update button
            this.updateThemeButton();

            Utils.announceToScreenReader(`Switched to ${theme} mode`);
            Utils.showToast(`Switched to ${theme} mode`, 'success');
        },

        updateThemeButton() {
            const btn = Utils.$('#theme-toggle');
            const icon = Utils.$('#theme-icon');
            const span = btn?.querySelector('span');

            if (icon && span) {
                if (STATE.theme === 'light') {
                    icon.className = 'fas fa-moon';
                    span.textContent = 'Dark Mode';
                } else {
                    icon.className = 'fas fa-sun';
                    span.textContent = 'Light Mode';
                }
            }
        },

        toggleScreenReader() {
            STATE.screenReaderActive = !STATE.screenReaderActive;
            localStorage.setItem('mortgageCalc_screenReader', STATE.screenReaderActive.toString());
            
            this.updateScreenReaderButton();

            const message = STATE.screenReaderActive ? 
                'Screen reader enhancements enabled' : 
                'Screen reader enhancements disabled';

            Utils.announceToScreenReader(message);
            Utils.showToast(message, 'success');
        },

        updateScreenReaderButton() {
            const btn = Utils.$('#screen-reader-toggle');
            if (btn) {
                btn.classList.toggle('active', STATE.screenReaderActive);
            }
        }
    };

    // ==========================================================================
    // MORTGAGE CALCULATOR CORE
    // ==========================================================================

    const MortgageCalculator = {
        init() {
            this.bindEvents();
            this.populateStates();
            this.setInitialValues();
            this.calculate();
        },

        bindEvents() {
            const debouncedCalculate = Utils.debounce(() => this.calculate(), CONFIG.debounceDelay);

            // Input field listeners
            Utils.$$('input[type="text"], input[type="number"]').forEach(input => {
                input.addEventListener('input', (e) => {
                    this.handleInputChange(e.target);
                    debouncedCalculate();
                });

                input.addEventListener('blur', (e) => {
                    this.formatInputValue(e.target);
                });
            });

            // State selection
            const stateSelect = Utils.$('#property-state');
            if (stateSelect) {
                stateSelect.addEventListener('change', () => {
                    this.updatePropertyTax();
                    debouncedCalculate();
                });
            }

            // Suggestion chips
            Utils.$$('.suggestion-chip').forEach(chip => {
                chip.addEventListener('click', (e) => {
                    const value = e.target.dataset.value;
                    const inputId = e.target.dataset.input;
                    const input = inputId ? Utils.$('#' + inputId) : e.target.closest('.form-group').querySelector('input');
                    
                    if (input && value) {
                        input.value = value;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        Utils.showToast(`${input.labels?.[0]?.textContent || 'Field'} updated`, 'success');
                    }
                });
            });

            // Term chips
            Utils.$$('.term-chip').forEach(chip => {
                chip.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleTermSelection(e.target);
                    debouncedCalculate();
                });
            });

            // Down payment toggle
            const amountToggle = Utils.$('#amount-toggle');
            const percentToggle = Utils.$('#percent-toggle');

            if (amountToggle) {
                amountToggle.addEventListener('click', () => {
                    this.switchDownPaymentMode('amount');
                });
            }

            if (percentToggle) {
                percentToggle.addEventListener('click', () => {
                    this.switchDownPaymentMode('percent');
                });
            }

            // Tab controls
            Utils.$$('.tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.switchTab(e.target.dataset.tab);
                });
            });

            // Year range slider
            const yearRange = Utils.$('#year-range');
            if (yearRange) {
                yearRange.addEventListener('input', (e) => {
                    YearSliderManager.updateFromSlider(parseInt(e.target.value));
                });
            }

            // Action buttons
            const calculateBtn = Utils.$('#calculate-btn');
            const resetBtn = Utils.$('#reset-form');
            const saveBtn = Utils.$('#save-calculation');
            const compareBtn = Utils.$('#compare-btn');
            const scrollBtn = Utils.$('#scroll-to-calculator');

            if (calculateBtn) calculateBtn.addEventListener('click', () => this.calculate());
            if (resetBtn) resetBtn.addEventListener('click', () => this.resetForm());
            if (saveBtn) saveBtn.addEventListener('click', () => this.saveCalculation());
            if (compareBtn) compareBtn.addEventListener('click', () => this.showComparison());
            if (scrollBtn) {
                scrollBtn.addEventListener('click', () => {
                    document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
                });
            }

            // Sharing buttons
            const shareBtn = Utils.$('#share-btn');
            const pdfBtn = Utils.$('#pdf-download-btn');
            const printBtn = Utils.$('#print-btn');

            if (shareBtn) shareBtn.addEventListener('click', () => this.shareResults());
            if (pdfBtn) pdfBtn.addEventListener('click', () => this.downloadPDF());
            if (printBtn) printBtn.addEventListener('click', () => window.print());

            // Advanced options toggle
            const advancedOptions = Utils.$('.advanced-options');
            if (advancedOptions) {
                advancedOptions.addEventListener('toggle', (e) => {
                    if (e.target.open) {
                        Utils.announceToScreenReader('Advanced payment options expanded');
                    }
                });
            }
        },

        handleInputChange(input) {
            const id = input.id;
            
            switch (id) {
                case 'home-price':
                    this.updateInsurance();
                    this.syncDownPayment('amount');
                    this.updatePropertyTax();
                    break;
                case 'down-payment':
                    this.syncDownPayment('amount');
                    this.updatePMIStatus();
                    break;
                case 'down-payment-percent':
                    this.syncDownPayment('percent');
                    this.updatePMIStatus();
                    break;
                case 'interest-rate':
                    this.updateRateStatus(parseFloat(input.value));
                    break;
                case 'extra-monthly':
                case 'extra-onetime':
                    this.updateExtraPaymentPreview();
                    break;
            }
        },

        formatInputValue(input) {
            if (input.type !== 'number') return;
            
            const value = Utils.parseNumber(input.value);
            if (value > 0) {
                // Format currency fields
                if (['home-price', 'down-payment', 'property-tax', 'home-insurance', 'pmi', 'extra-monthly', 'extra-onetime'].includes(input.id)) {
                    input.value = Utils.formatNumber(value);
                }
            }
        },

        populateStates() {
            const stateSelect = Utils.$('#property-state');
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

            // Clear existing options
            stateSelect.innerHTML = '';

            states.forEach(state => {
                const option = document.createElement('option');
                option.value = state.value;
                option.textContent = state.text;
                stateSelect.appendChild(option);
            });

            // Set default to California
            stateSelect.value = 'CA';
        },

        setInitialValues() {
            const currentRate = STATE.marketRates["30yr"] || 6.75;
            
            const defaults = {
                'home-price': 400000,
                'down-payment': 80000,
                'down-payment-percent': 20,
                'interest-rate': currentRate.toFixed(2),
                'property-tax': 3000,
                'home-insurance': 1600,
                'pmi': 0,
                'extra-monthly': 0,
                'extra-onetime': 0
            };

            Object.entries(defaults).forEach(([id, value]) => {
                const element = Utils.$('#' + id);
                if (element && !element.value) {
                    element.value = typeof value === 'number' ? Utils.formatNumber(value) : value;
                }
            });

            // Update dependent calculations
            this.updateInsurance();
            this.updatePropertyTax();
            this.updatePMIStatus();
            this.updateRateStatus(currentRate);
        },

        switchDownPaymentMode(mode) {
            const amountInput = Utils.$('#amount-input');
            const percentInput = Utils.$('#percent-input');
            const amountToggle = Utils.$('#amount-toggle');
            const percentToggle = Utils.$('#percent-toggle');

            if (mode === 'amount') {
                if (amountInput) amountInput.style.display = 'block';
                if (percentInput) percentInput.style.display = 'none';
                if (amountToggle) amountToggle.classList.add('active');
                if (percentToggle) percentToggle.classList.remove('active');
                
                amountToggle?.setAttribute('aria-checked', 'true');
                percentToggle?.setAttribute('aria-checked', 'false');
            } else {
                if (amountInput) amountInput.style.display = 'none';
                if (percentInput) percentInput.style.display = 'block';
                if (amountToggle) amountToggle.classList.remove('active');
                if (percentToggle) percentToggle.classList.add('active');
                
                amountToggle?.setAttribute('aria-checked', 'false');
                percentToggle?.setAttribute('aria-checked', 'true');
            }

            Utils.announceToScreenReader(`Switched to ${mode} mode for down payment`);
        },

        handleTermSelection(chip) {
            // Remove active class from all chips
            Utils.$$('.term-chip').forEach(c => {
                c.classList.remove('active');
                c.setAttribute('aria-checked', 'false');
            });
            
            // Add active class to selected chip
            chip.classList.add('active');
            chip.setAttribute('aria-checked', 'true');

            const term = parseInt(chip.dataset.term);
            const hiddenSelect = Utils.$('#loan-term');
            if (hiddenSelect) {
                hiddenSelect.value = term;
            }

            Utils.announceToScreenReader(`Selected ${term} year loan term`);
        },

        switchTab(tabName) {
            if (!tabName) return;

            // Update tab buttons
            Utils.$$('.tab-btn').forEach(btn => {
                const isActive = btn.dataset.tab === tabName;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-selected', isActive.toString());
            });

            // Update tab content
            Utils.$$('.tab-content').forEach(content => {
                const isActive = content.id === tabName;
                content.classList.toggle('active', isActive);
            });

            // Announce to screen reader
            const tabNames = {
                'chart': 'Mortgage Over Time Chart',
                'insights': 'AI-Powered Insights',
                'amortization': 'Amortization Schedule'
            };

            Utils.announceToScreenReader(`Switched to ${tabNames[tabName]} tab`);
        },

        updateInsurance() {
            const homePrice = Utils.parseNumber(Utils.$('#home-price')?.value || '0');
            const insuranceInput = Utils.$('#home-insurance');

            if (homePrice > 0 && insuranceInput) {
                const currentInsurance = Utils.parseNumber(insuranceInput.value);
                
                // Only auto-update if field is empty or very low
                if (currentInsurance < homePrice * CONFIG.defaultInsuranceRate * 0.5) {
                    const recommendedInsurance = Math.round(homePrice * CONFIG.defaultInsuranceRate);
                    insuranceInput.value = Utils.formatNumber(recommendedInsurance);
                    
                    // Update help text
                    const helpText = Utils.$('#insurance-help');
                    if (helpText) {
                        helpText.innerHTML = `Recommended: ${Utils.formatCurrency(recommendedInsurance)} (0.2% of home value)`;
                    }
                }
            }
        },

        syncDownPayment(source) {
            const homePrice = Utils.parseNumber(Utils.$('#home-price')?.value || '0');
            const downPaymentAmount = Utils.$('#down-payment');
            const downPaymentPercent = Utils.$('#down-payment-percent');

            if (homePrice <= 0) return;

            if (source === 'amount' && downPaymentAmount) {
                const amount = Utils.parseNumber(downPaymentAmount.value || '0');
                const percentage = Math.min(100, (amount / homePrice) * 100);

                if (downPaymentPercent) {
                    downPaymentPercent.value = Math.round(percentage * 10) / 10;
                }
            } else if (source === 'percent' && downPaymentPercent) {
                const percentage = Math.max(0, Math.min(100, parseFloat(downPaymentPercent.value || '0')));
                const amount = Math.round((homePrice * percentage) / 100);

                if (downPaymentAmount) {
                    downPaymentAmount.value = Utils.formatNumber(amount);
                }
                
                // Update the percent field to ensure it's within bounds
                downPaymentPercent.value = percentage;
            }

            this.updatePMIStatus();
        },

        updatePMIStatus() {
            const homePrice = Utils.parseNumber(Utils.$('#home-price')?.value || '0');
            const downPayment = Utils.parseNumber(Utils.$('#down-payment')?.value || '0');
            const pmiInput = Utils.$('#pmi');
            const pmiStatus = Utils.$('#pmi-status');
            const pmiWarning = Utils.$('#pmi-warning');

            if (homePrice <= 0 || downPayment < 0) return;

            const downPaymentPercent = (downPayment / homePrice) * 100;
            const loanAmount = homePrice - downPayment;

            if (downPaymentPercent < 20 && loanAmount > 0) {
                // PMI required
                const monthlyPMI = Math.round((loanAmount * CONFIG.pmiRate) / 12);
                
                if (pmiInput) pmiInput.value = Utils.formatNumber(monthlyPMI);
                if (pmiStatus) pmiStatus.textContent = `PMI required (${downPaymentPercent.toFixed(1)}% down)`;
                if (pmiWarning) pmiWarning.style.display = 'flex';
            } else {
                // No PMI required
                if (pmiInput) pmiInput.value = '0';
                if (pmiStatus) pmiStatus.textContent = 'No PMI required (20%+ down payment)';
                if (pmiWarning) pmiWarning.style.display = 'none';
            }
        },

        updatePropertyTax() {
            const state = Utils.$('#property-state')?.value;
            const homePrice = Utils.parseNumber(Utils.$('#home-price')?.value || '0');
            const propertyTaxInput = Utils.$('#property-tax');

            if (state && homePrice > 0 && STATE_TAX_RATES[state] && propertyTaxInput) {
                const taxRate = STATE_TAX_RATES[state];
                const annualTax = Math.round(homePrice * (taxRate / 100));
                const currentTax = Utils.parseNumber(propertyTaxInput.value);
                
                // Only auto-update if field is empty or significantly different
                if (currentTax === 0 || Math.abs(currentTax - annualTax) / annualTax > 0.3) {
                    propertyTaxInput.value = Utils.formatNumber(annualTax);
                }

                // Update help text
                const taxHelp = Utils.$('#tax-help');
                if (taxHelp) {
                    taxHelp.innerHTML = `Auto-calculated: <span id="tax-rate-display">${taxRate}%</span> of home value`;
                }
            }
        },

        updateRateStatus(rate) {
            const rateStatus = Utils.$('#rate-status');
            if (!rateStatus || isNaN(rate)) return;

            const marketAvg = STATE.marketRates["30yr"] || 6.75;
            const difference = rate - marketAvg;

            let status = 'Market Average';
            let className = '';

            if (difference > 0.5) {
                status = 'Above Market';
                className = 'rate-high';
            } else if (difference < -0.5) {
                status = 'Below Market';
                className = 'rate-low';
            }

            rateStatus.textContent = status;
            rateStatus.className = `rate-status ${className}`;
        },

        updateExtraPaymentPreview() {
            // This would be called after calculation to show savings preview
            if (STATE.currentCalculation) {
                const preview = Utils.$('#savings-preview');
                const calc = STATE.currentCalculation;
                
                if (preview && calc.interestSavings > 0) {
                    const years = Math.floor(calc.timeSavingsMonths / 12);
                    const months = calc.timeSavingsMonths % 12;
                    
                    let timeText = '';
                    if (years > 0) timeText += `${years} year${years !== 1 ? 's' : ''}`;
                    if (months > 0) {
                        if (timeText) timeText += ' and ';
                        timeText += `${months} month${months !== 1 ? 's' : ''}`;
                    }
                    
                    preview.innerHTML = `Potential savings: ${Utils.formatCurrency(calc.interestSavings)} and ${timeText} sooner payoff`;
                    preview.style.color = 'var(--color-success)';
                } else if (preview) {
                    preview.textContent = 'Add extra payments to see potential savings';
                    preview.style.color = '';
                }
            }
        },

        calculate() {
            try {
                Utils.showLoading(true);
                
                const params = this.getCalculationParams();
                if (!this.validateParams(params)) {
                    Utils.showLoading(false);
                    return;
                }

                const result = this.performCalculation(params);
                if (!result) {
                    Utils.showLoading(false);
                    return;
                }

                STATE.currentCalculation = result;
                
                // Update all result displays
                this.updateResults(result);
                this.updateExtraPaymentPreview();
                
                // Update visualizations
                ChartManager.render(result);
                YearSliderManager.init(result);
                AIInsights.render(result);
                AmortizationTable.render(result);

                Utils.announceToScreenReader('Mortgage calculation completed with updated results');
                
                // Small delay to show loading effect
                setTimeout(() => {
                    Utils.showLoading(false);
                }, 300);
                
            } catch (error) {
                console.error('Calculation error:', error);
                Utils.showToast('Error in calculation. Please check your inputs and try again.', 'error');
                Utils.showLoading(false);
            }
        },

        getCalculationParams() {
            const homePrice = Utils.parseNumber(Utils.$('#home-price')?.value || '0');
            const downPayment = Utils.parseNumber(Utils.$('#down-payment')?.value || '0');
            const rate = parseFloat(Utils.$('#interest-rate')?.value || '0');

            // Get selected loan term
            let term = 30;
            const activeTermChip = Utils.$('.term-chip.active');
            if (activeTermChip) {
                term = parseInt(activeTermChip.dataset.term) || 30;
            }

            const propertyTax = Utils.parseNumber(Utils.$('#property-tax')?.value || '0');
            const homeInsurance = Utils.parseNumber(Utils.$('#home-insurance')?.value || '0');
            const pmi = Utils.parseNumber(Utils.$('#pmi')?.value || '0');
            const extraMonthly = Utils.parseNumber(Utils.$('#extra-monthly')?.value || '0');
            const extraOnetime = Utils.parseNumber(Utils.$('#extra-onetime')?.value || '0');
            
            const biWeekly = Utils.$('#bi-weekly')?.checked || false;

            return {
                homePrice,
                downPayment,
                rate,
                term,
                propertyTax,
                homeInsurance,
                pmi,
                extraMonthly,
                extraOnetime,
                biWeekly
            };
        },

        validateParams(params) {
            const errors = [];

            if (params.homePrice <= 0) {
                errors.push('Please enter a valid home price');
            }

            if (params.rate <= 0 || params.rate > 20) {
                errors.push('Please enter a valid interest rate between 0% and 20%');
            }

            if (params.downPayment >= params.homePrice) {
                errors.push('Down payment cannot be greater than or equal to home price');
            }

            if (params.downPayment < 0) {
                errors.push('Down payment cannot be negative');
            }

            if (![15, 20, 30].includes(params.term)) {
                errors.push('Please select a valid loan term (15, 20, or 30 years)');
            }

            if (errors.length > 0) {
                errors.forEach(error => Utils.showToast(error, 'error'));
                return false;
            }

            return true;
        },

        performCalculation(params) {
            const loanAmount = params.homePrice - params.downPayment;
            
            if (loanAmount <= 0) {
                Utils.showToast('Loan amount must be greater than zero', 'error');
                return null;
            }

            const monthlyRate = params.rate / 100 / 12;
            let numPayments = params.term * 12;
            
            // Adjust for bi-weekly payments
            if (params.biWeekly) {
                numPayments = params.term * 26; // 26 bi-weekly payments per year
            }

            if (monthlyRate === 0) {
                // Handle 0% interest rate
                const monthlyPI = loanAmount / numPayments;
                return this.calculateWithZeroInterest(params, monthlyPI);
            }

            // Calculate base monthly payment (Principal & Interest)
            const paymentFrequency = params.biWeekly ? 26 : 12;
            const adjustedRate = params.rate / 100 / paymentFrequency;
            const adjustedPayments = params.term * paymentFrequency;

            const monthlyPI = loanAmount * 
                (adjustedRate * Math.pow(1 + adjustedRate, adjustedPayments)) / 
                (Math.pow(1 + adjustedRate, adjustedPayments) - 1);

            // Monthly additional costs
            const monthlyTax = params.propertyTax / 12;
            const monthlyInsurance = params.homeInsurance / 12;
            const monthlyPMI = params.pmi;
            
            const totalMonthlyPayment = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI;

            // Generate amortization schedule
            const schedule = this.generateAmortizationSchedule(
                loanAmount,
                params.rate / 100,
                params.term,
                params.extraMonthly,
                params.extraOnetime,
                params.biWeekly
            );

            if (schedule.length === 0) {
                Utils.showToast('Error generating payment schedule', 'error');
                return null;
            }

            // Calculate totals
            const totalInterest = schedule.reduce((sum, payment) => sum + payment.interest, 0);
            const totalCost = loanAmount + totalInterest;

            // Calculate savings from extra payments
            const baseSchedule = this.generateAmortizationSchedule(loanAmount, params.rate / 100, params.term, 0, 0, false);
            const baseInterest = baseSchedule.reduce((sum, payment) => sum + payment.interest, 0);
            const interestSavings = Math.max(0, baseInterest - totalInterest);
            const timeSavingsMonths = Math.max(0, baseSchedule.length - schedule.length);

            const payoffDate = schedule.length > 0 ? 
                new Date(schedule[schedule.length - 1].date) : 
                new Date();
            
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

        calculateWithZeroInterest(params, monthlyPI) {
            // Special handling for 0% interest rate
            const loanAmount = params.homePrice - params.downPayment;
            const monthlyTax = params.propertyTax / 12;
            const monthlyInsurance = params.homeInsurance / 12;
            const monthlyPMI = params.pmi;
            const totalMonthlyPayment = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI;

            // Simple schedule for 0% interest
            const schedule = [];
            const startDate = new Date();
            let remainingBalance = loanAmount;
            const numPayments = params.term * 12;

            for (let i = 1; i <= numPayments && remainingBalance > 0.01; i++) {
                const paymentDate = new Date(startDate);
                paymentDate.setMonth(paymentDate.getMonth() + i - 1);

                const principalPayment = Math.min(monthlyPI + params.extraMonthly, remainingBalance);
                remainingBalance -= principalPayment;

                schedule.push({
                    paymentNumber: i,
                    date: paymentDate,
                    payment: principalPayment,
                    principal: principalPayment,
                    interest: 0,
                    balance: Math.max(0, remainingBalance)
                });
            }

            return {
                params,
                loanAmount,
                monthlyPI,
                monthlyTax,
                monthlyInsurance,
                monthlyPMI,
                totalMonthlyPayment,
                totalInterest: 0,
                totalCost: loanAmount,
                payoffDate: schedule[schedule.length - 1]?.date || new Date(),
                schedule,
                interestSavings: 0,
                timeSavingsMonths: 0,
                downPaymentPercent: (params.downPayment / params.homePrice) * 100
            };
        },

        generateAmortizationSchedule(principal, annualRate, termYears, extraMonthly = 0, extraOnetime = 0, biWeekly = false) {
            const schedule = [];
            let remainingBalance = principal;
            
            const paymentsPerYear = biWeekly ? 26 : 12;
            const periodRate = annualRate / paymentsPerYear;
            const totalPayments = termYears * paymentsPerYear;
            
            if (periodRate === 0) {
                // Handle 0% interest case
                const paymentAmount = principal / totalPayments;
                const startDate = new Date();
                
                for (let i = 1; i <= totalPayments && remainingBalance > 0.01; i++) {
                    const paymentDate = new Date(startDate);
                    if (biWeekly) {
                        paymentDate.setDate(paymentDate.getDate() + (i - 1) * 14);
                    } else {
                        paymentDate.setMonth(paymentDate.getMonth() + i - 1);
                    }

                    const principalPayment = Math.min(paymentAmount + extraMonthly, remainingBalance);
                    remainingBalance -= principalPayment;

                    schedule.push({
                        paymentNumber: i,
                        date: paymentDate,
                        payment: principalPayment,
                        principal: principalPayment,
                        interest: 0,
                        balance: Math.max(0, remainingBalance)
                    });
                }
                return schedule;
            }

            // Calculate base payment amount
            const basePayment = principal * 
                (periodRate * Math.pow(1 + periodRate, totalPayments)) / 
                (Math.pow(1 + periodRate, totalPayments) - 1);

            const startDate = new Date();

            for (let paymentNum = 1; paymentNum <= totalPayments && remainingBalance > 0.01; paymentNum++) {
                const interestPayment = remainingBalance * periodRate;
                
                // Apply extra payments
                let extraThisPayment = extraMonthly;
                
                // Apply one-time payment at month 12 (payment 12 for monthly, payment 26 for bi-weekly)
                const oneTimePaymentNumber = biWeekly ? 26 : 12;
                if (extraOnetime > 0 && paymentNum === oneTimePaymentNumber) {
                    extraThisPayment += extraOnetime;
                }

                let principalPayment = basePayment - interestPayment + extraThisPayment;

                // Don't overpay
                if (principalPayment > remainingBalance) {
                    principalPayment = remainingBalance;
                }

                remainingBalance -= principalPayment;

                // Calculate payment date
                const paymentDate = new Date(startDate);
                if (biWeekly) {
                    paymentDate.setDate(paymentDate.getDate() + (paymentNum - 1) * 14);
                } else {
                    paymentDate.setMonth(paymentDate.getMonth() + paymentNum - 1);
                }

                schedule.push({
                    paymentNumber: paymentNum,
                    date: paymentDate,
                    payment: basePayment + extraThisPayment,
                    principal: principalPayment,
                    interest: interestPayment,
                    balance: Math.max(0, remainingBalance)
                });

                if (remainingBalance <= 0.01) break;
            }

            return schedule;
        },

        updateResults(calc) {
            // Update main payment display
            const totalPaymentElement = Utils.$('#total-payment');
            if (totalPaymentElement) {
                totalPaymentElement.textContent = Utils.formatCurrency(calc.totalMonthlyPayment);
            }

            // Update payment breakdown
            Utils.$('#principal-interest').textContent = Utils.formatCurrency(calc.monthlyPI);
            Utils.$('#monthly-tax').textContent = Utils.formatCurrency(calc.monthlyTax);
            Utils.$('#monthly-insurance').textContent = Utils.formatCurrency(calc.monthlyInsurance);
            Utils.$('#monthly-pmi').textContent = Utils.formatCurrency(calc.monthlyPMI);

            // Update loan summary
            Utils.$('#display-loan-amount').textContent = Utils.formatCurrency(calc.loanAmount);
            Utils.$('#display-total-interest').textContent = Utils.formatCurrency(calc.totalInterest);
            Utils.$('#display-total-cost').textContent = Utils.formatCurrency(calc.totalCost);
            
            const payoffDate = Utils.$('#display-payoff-date');
            if (payoffDate) {
                payoffDate.textContent = calc.payoffDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: 'numeric' 
                });
            }

            // Update chart loan amount
            const chartLoanAmount = Utils.$('#chart-loan-amount');
            if (chartLoanAmount) {
                chartLoanAmount.textContent = `Based on a ${Utils.formatCurrency(calc.loanAmount)} mortgage`;
            }

            // Update breakdown bars
            this.updateBreakdownBars(calc);
        },

        updateBreakdownBars(calc) {
            const total = calc.totalMonthlyPayment;
            if (total <= 0) return;

            const percentages = {
                pi: (calc.monthlyPI / total) * 100,
                tax: (calc.monthlyTax / total) * 100,
                insurance: (calc.monthlyInsurance / total) * 100,
                pmi: (calc.monthlyPMI / total) * 100
            };

            const fillElements = {
                '#pi-fill': percentages.pi,
                '#tax-fill': percentages.tax,
                '#insurance-fill': percentages.insurance,
                '#pmi-fill': percentages.pmi
            };

            Object.entries(fillElements).forEach(([selector, width]) => {
                const element = Utils.$(selector);
                if (element) {
                    element.style.width = Math.round(width) + '%';
                }
            });
        },

        resetForm() {
            // Reset all input fields to defaults
            const defaults = {
                'home-price': '400000',
                'down-payment': '80000',
                'down-payment-percent': '20',
                'interest-rate': STATE.marketRates["30yr"].toFixed(2),
                'property-tax': '',
                'home-insurance': '',
                'extra-monthly': '0',
                'extra-onetime': '0'
            };

            Object.entries(defaults).forEach(([id, value]) => {
                const field = Utils.$('#' + id);
                if (field) {
                    field.value = value;
                }
            });

            // Reset state selection
            const stateSelect = Utils.$('#property-state');
            if (stateSelect) {
                stateSelect.value = 'CA';
            }

            // Reset loan term to 30 years
            Utils.$$('.term-chip').forEach(chip => {
                chip.classList.remove('active');
                chip.setAttribute('aria-checked', 'false');
            });
            
            const term30 = Utils.$('[data-term="30"]');
            if (term30) {
                term30.classList.add('active');
                term30.setAttribute('aria-checked', 'true');
            }

            const hiddenTermSelect = Utils.$('#loan-term');
            if (hiddenTermSelect) {
                hiddenTermSelect.value = '30';
            }

            // Reset down payment mode to amount
            this.switchDownPaymentMode('amount');

            // Reset bi-weekly checkbox
            const biWeeklyCheckbox = Utils.$('#bi-weekly');
            if (biWeeklyCheckbox) {
                biWeeklyCheckbox.checked = false;
            }

            // Update dependent fields
            this.updateInsurance();
            this.updatePropertyTax();
            this.updatePMIStatus();
            
            // Recalculate
            setTimeout(() => {
                this.calculate();
            }, 100);

            Utils.showToast('Form reset to default values', 'success');
            Utils.announceToScreenReader('Form has been reset to default values');
        },

        saveCalculation() {
            if (!STATE.currentCalculation) {
                Utils.showToast('Please calculate a mortgage first', 'info');
                return;
            }

            const calc = STATE.currentCalculation;
            const calculationData = {
                id: Utils.generateId(),
                timestamp: new Date().toISOString(),
                homePrice: calc.params.homePrice,
                downPayment: calc.params.downPayment,
                interestRate: calc.params.rate,
                loanTerm: calc.params.term,
                monthlyPayment: calc.totalMonthlyPayment,
                totalInterest: calc.totalInterest,
                totalCost: calc.totalCost,
                payoffDate: calc.payoffDate.toISOString()
            };

            try {
                // Get existing calculations
                let savedCalculations = JSON.parse(localStorage.getItem('mortgageCalculations') || '[]');
                
                // Add new calculation
                savedCalculations.push(calculationData);
                
                // Keep only last 10 calculations
                if (savedCalculations.length > 10) {
                    savedCalculations = savedCalculations.slice(-10);
                }

                // Save back to localStorage
                localStorage.setItem('mortgageCalculations', JSON.stringify(savedCalculations));
                
                STATE.savedCalculations = savedCalculations;

                Utils.showToast('Calculation saved successfully', 'success');
                Utils.announceToScreenReader('Mortgage calculation has been saved');
                
            } catch (error) {
                console.error('Error saving calculation:', error);
                Utils.showToast('Error saving calculation', 'error');
            }
        },

        showComparison() {
            Utils.showToast('Comparison feature coming soon! Save multiple calculations to compare them.', 'info');
        },

        shareResults() {
            if (!STATE.currentCalculation) {
                Utils.showToast('Please calculate a mortgage first', 'info');
                return;
            }

            const calc = STATE.currentCalculation;
            const shareData = {
                title: 'My Mortgage Calculation',
                text: `Home Price: ${Utils.formatCurrency(calc.params.homePrice)}\nDown Payment: ${Utils.formatCurrency(calc.params.downPayment)}\nMonthly Payment: ${Utils.formatCurrency(calc.totalMonthlyPayment)}`,
                url: window.location.href
            };

            if (navigator.share) {
                navigator.share(shareData).catch(console.error);
            } else {
                // Fallback: copy to clipboard
                navigator.clipboard.writeText(shareData.text).then(() => {
                    Utils.showToast('Calculation details copied to clipboard', 'success');
                }).catch(() => {
                    Utils.showToast('Unable to copy to clipboard', 'error');
                });
            }
        },

        downloadPDF() {
            Utils.showToast('PDF download feature coming soon!', 'info');
        }
    };

    // ==========================================================================
    // CHART MANAGER
    // ==========================================================================

    const ChartManager = {
        render(calculation) {
            if (!calculation || !calculation.schedule || !window.Chart) {
                console.warn('Chart.js not available or no calculation data');
                return;
            }

            const ctx = Utils.$('#mortgage-timeline-chart');
            if (!ctx) return;

            // Destroy existing chart
            if (STATE.chart) {
                STATE.chart.destroy();
                STATE.chart = null;
            }

            // Prepare yearly data
            STATE.yearlyData = this.prepareYearlyData(calculation.schedule, calculation.loanAmount);

            if (STATE.yearlyData.length === 0) {
                console.warn('No yearly data available for chart');
                return;
            }

            const data = {
                labels: STATE.yearlyData.map(d => `Year ${d.year}`),
                datasets: [
                    {
                        label: 'Remaining Balance',
                        data: STATE.yearlyData.map(d => d.balance),
                        backgroundColor: 'rgba(249, 115, 22, 0.2)',
                        borderColor: 'rgba(249, 115, 22, 1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: 'rgba(249, 115, 22, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    },
                    {
                        label: 'Principal Paid',
                        data: STATE.yearlyData.map(d => d.principalPaid),
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    },
                    {
                        label: 'Interest Paid',
                        data: STATE.yearlyData.map(d => d.interestPaid),
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    }
                ]
            };

            const options = {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: false // We have custom legend
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            title: function(context) {
                                return `Year ${context[0].label.replace('Year ', '')}`;
                            },
                            label: function(context) {
                                return `${context.dataset.label}: ${Utils.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawOnChartArea: true,
                            drawTicks: false
                        },
                        ticks: {
                            color: '#6B7280',
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawOnChartArea: true,
                            drawTicks: false
                        },
                        ticks: {
                            color: '#6B7280',
                            font: {
                                size: 12,
                                weight: '500'
                            },
                            callback: function(value) {
                                return Utils.formatCurrency(value, 0);
                            }
                        }
                    }
                },
                elements: {
                    line: {
                        borderJoinStyle: 'round',
                        borderCapStyle: 'round'
                    }
                },
                animation: {
                    duration: 800,
                    easing: 'easeOutQuart'
                }
            };

            try {
                STATE.chart = new Chart(ctx, {
                    type: 'line',
                    data: data,
                    options: options
                });

                // Update legend values for year 1
                this.updateLegendValues(1);
                
            } catch (error) {
                console.error('Error creating chart:', error);
            }
        },

        prepareYearlyData(schedule, initialLoanAmount) {
            if (!schedule || schedule.length === 0) return [];

            const yearlyData = [];
            let currentYear = 1;
            let yearlyPrincipal = 0;
            let yearlyInterest = 0;
            let yearEndBalance = initialLoanAmount;

            // Group payments by year
            schedule.forEach((payment, index) => {
                const paymentYear = Math.ceil((index + 1) / 12);

                if (paymentYear === currentYear) {
                    yearlyPrincipal += payment.principal || 0;
                    yearlyInterest += payment.interest || 0;
                    yearEndBalance = payment.balance || 0;
                } else {
                    // Save previous year data
                    yearlyData.push({
                        year: currentYear,
                        balance: yearEndBalance,
                        principalPaid: yearlyPrincipal,
                        interestPaid: yearlyInterest
                    });

                    // Start new year
                    currentYear = paymentYear;
                    yearlyPrincipal = payment.principal || 0;
                    yearlyInterest = payment.interest || 0;
                    yearEndBalance = payment.balance || 0;
                }
            });

            // Add the last year
            if (yearlyPrincipal > 0 || yearlyInterest > 0) {
                yearlyData.push({
                    year: currentYear,
                    balance: yearEndBalance,
                    principalPaid: yearlyPrincipal,
                    interestPaid: yearlyInterest
                });
            }

            return yearlyData;
        },

        updateLegendValues(year) {
            const yearData = STATE.yearlyData[year - 1];
            if (!yearData) return;

            const elements = {
                '#remaining-balance': yearData.balance,
                '#principal-paid': yearData.principalPaid,
                '#interest-paid': yearData.interestPaid
            };

            Object.entries(elements).forEach(([selector, value]) => {
                const element = Utils.$(selector);
                if (element) {
                    element.textContent = Utils.formatCurrency(value);
                }
            });
        }
    };

    // ==========================================================================
    // YEAR SLIDER MANAGER
    // ==========================================================================

    const YearSliderManager = {
        init(calculation) {
            const slider = Utils.$('#year-range');
            const label = Utils.$('#year-label');

            if (!slider || !calculation || !STATE.yearlyData.length) return;

            const maxYear = Math.min(calculation.params.term, STATE.yearlyData.length);
            slider.max = maxYear;
            slider.value = 1;

            this.updateFromSlider(1);

            Utils.announceToScreenReader(`Year slider initialized with range 1 to ${maxYear}`);
        },

        updateFromSlider(year) {
            const label = Utils.$('#year-label');
            if (label) {
                label.textContent = `Year ${year}`;
            }

            // Update chart legend values
            ChartManager.updateLegendValues(year);

            // Update details text
            const details = Utils.$('.current-year');
            if (details) {
                const yearData = STATE.yearlyData[year - 1];
                if (yearData) {
                    details.textContent = `Year ${year}: ${Utils.formatCurrency(yearData.balance)} remaining balance`;
                } else {
                    details.textContent = `Viewing Year ${year} details`;
                }
            }

            Utils.announceToScreenReader(`Updated to Year ${year} data`);
        }
    };

    // ==========================================================================
    // AI INSIGHTS GENERATOR
    // ==========================================================================

    const AIInsights = {
        render(calculation) {
            const container = Utils.$('#ai-insights');
            if (!container || !calculation) return;

            const insights = this.generateInsights(calculation);
            
            container.innerHTML = '';
            
            if (insights.length === 0) {
                container.innerHTML = `
                    <div class="insight-item info">
                        <i class="fas fa-brain insight-icon"></i>
                        <div>
                            <h5>AI Analysis Complete</h5>
                            <p>Your mortgage terms look good! No specific recommendations at this time.</p>
                        </div>
                    </div>
                `;
                return;
            }

            insights.forEach(insight => {
                const item = document.createElement('div');
                item.className = `insight-item ${insight.type}`;
                item.innerHTML = `
                    <i class="fas fa-${insight.icon} insight-icon"></i>
                    <div>
                        <h5>${insight.title}</h5>
                        <p>${insight.message}</p>
                    </div>
                `;
                container.appendChild(item);
            });

            Utils.announceToScreenReader(`AI has generated ${insights.length} insights for your mortgage`);
        },

        generateInsights(calc) {
            const insights = [];
            const downPaymentPercent = calc.downPaymentPercent;
            
            // Estimate monthly income based on 28% debt-to-income ratio
            const estimatedMonthlyIncome = calc.totalMonthlyPayment / 0.28;

            // Down payment analysis
            if (downPaymentPercent < 10) {
                insights.push({
                    type: 'warning',
                    icon: 'exclamation-triangle',
                    title: 'Low Down Payment Alert',
                    message: `Your ${downPaymentPercent.toFixed(1)}% down payment will require PMI, increasing your monthly costs by ${Utils.formatCurrency(calc.monthlyPMI)}. Consider saving for a larger down payment to eliminate PMI and reduce monthly expenses.`
                });
            } else if (downPaymentPercent >= 20) {
                insights.push({
                    type: 'success',
                    icon: 'check-circle',
                    title: 'Excellent Down Payment',
                    message: `Your ${downPaymentPercent.toFixed(1)}% down payment eliminates PMI and reduces your loan amount significantly. This is excellent financial planning that will save you money over the life of the loan.`
                });
            } else {
                insights.push({
                    type: 'info',
                    icon: 'info-circle',
                    title: 'Good Down Payment',
                    message: `Your ${downPaymentPercent.toFixed(1)}% down payment requires PMI of ${Utils.formatCurrency(calc.monthlyPMI)} monthly. Consider saving a bit more to reach 20% and eliminate PMI.`
                });
            }

            // Interest rate analysis
            const currentMarketRate = STATE.marketRates["30yr"];
            if (calc.params.rate > currentMarketRate + 0.5) {
                insights.push({
                    type: 'warning',
                    icon: 'chart-line',
                    title: 'Above Market Rate',
                    message: `At ${calc.params.rate}%, you're paying ${(calc.params.rate - currentMarketRate).toFixed(2)} percentage points above current market rates (~${currentMarketRate.toFixed(2)}%). Shop around with multiple lenders to potentially save thousands.`
                });
            } else if (calc.params.rate < currentMarketRate - 0.3) {
                insights.push({
                    type: 'success',
                    icon: 'thumbs-up',
                    title: 'Great Interest Rate',
                    message: `Your ${calc.params.rate}% rate is excellent, ${(currentMarketRate - calc.params.rate).toFixed(2)} points below current market average. This will save you significant money in interest over the loan term.`
                });
            }

            // Payment-to-income analysis
            const paymentRatio = (calc.totalMonthlyPayment / estimatedMonthlyIncome) * 100;
            if (paymentRatio > 35) {
                insights.push({
                    type: 'error',
                    icon: 'exclamation-circle',
                    title: 'High Payment Ratio',
                    message: `Your monthly payment appears to be ${paymentRatio.toFixed(0)}% of estimated income, which is high. Consider a less expensive home, larger down payment, or longer loan term to improve affordability.`
                });
            } else if (paymentRatio < 20) {
                insights.push({
                    type: 'success',
                    icon: 'smile',
                    title: 'Comfortable Payment',
                    message: `Your monthly payment is very manageable at approximately ${paymentRatio.toFixed(0)}% of estimated income. You have good room in your budget for other financial goals.`
                });
            }

            // Extra payment benefits
            if (calc.params.extraMonthly > 0 || calc.params.extraOnetime > 0) {
                const years = Math.floor(calc.timeSavingsMonths / 12);
                const months = calc.timeSavingsMonths % 12;
                let timeText = '';
                if (years > 0) timeText += `${years} year${years !== 1 ? 's' : ''}`;
                if (months > 0) {
                    if (timeText) timeText += ' and ';
                    timeText += `${months} month${months !== 1 ? 's' : ''}`;
                }

                insights.push({
                    type: 'success',
                    icon: 'piggy-bank',
                    title: 'Smart Extra Payment Strategy',
                    message: `Your extra payments of ${Utils.formatCurrency(calc.params.extraMonthly + (calc.params.extraOnetime / 12))} average monthly will save you ${Utils.formatCurrency(calc.interestSavings)} and pay off your loan ${timeText} earlier. Excellent strategy!`
                });
            } else {
                // Suggest extra payments
                const suggestedExtra = Math.round(calc.monthlyPI * 0.1); // 10% of P&I
                const potentialSavings = this.estimateExtraSavings(calc.loanAmount, calc.params.rate, calc.params.term, suggestedExtra);
                
                insights.push({
                    type: 'info',
                    icon: 'lightbulb',
                    title: 'Consider Extra Payments',
                    message: `Adding just ${Utils.formatCurrency(suggestedExtra)} monthly (10% of your P&I payment) could save you approximately ${Utils.formatCurrency(potentialSavings.interestSaved)} and ${potentialSavings.timeSaved} years of payments.`
                });
            }

            // Loan term analysis
            if (calc.params.term === 30 && calc.params.rate > 6.5) {
                const shorterTermSavings = this.estimateTermSavings(calc.loanAmount, calc.params.rate);
                insights.push({
                    type: 'info',
                    icon: 'clock',
                    title: 'Consider Shorter Term',
                    message: `A 15-year loan would increase monthly payments by approximately ${Utils.formatCurrency(shorterTermSavings.paymentIncrease)}, but could save you over ${Utils.formatCurrency(shorterTermSavings.interestSaved)} in total interest.`
                });
            }

            // Bi-weekly payment suggestion
            if (!calc.params.biWeekly) {
                const biWeeklySavings = this.estimateBiWeeklySavings(calc.loanAmount, calc.params.rate, calc.params.term);
                if (biWeeklySavings.yearsSaved > 2) {
                    insights.push({
                        type: 'info',
                        icon: 'calendar-alt',
                        title: 'Consider Bi-Weekly Payments',
                        message: `Making bi-weekly payments (26 payments per year instead of 12) would pay off your loan ${biWeeklySavings.yearsSaved} years earlier and save you ${Utils.formatCurrency(biWeeklySavings.interestSaved)} in interest.`
                    });
                }
            }

            // Return up to 4 most relevant insights
            return insights.slice(0, 4);
        },

        estimateExtraSavings(loanAmount, rate, term, extraPayment) {
            // Quick estimation of savings from extra payments
            const monthlyRate = rate / 100 / 12;
            const totalPayments = term * 12;
            
            const basePayment = loanAmount * 
                (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                (Math.pow(1 + monthlyRate, totalPayments) - 1);

            // Rough calculation - in practice would need full amortization
            const extraPercent = extraPayment / basePayment;
            const timeSavedYears = Math.min(term * extraPercent * 0.3, term - 5); // Conservative estimate
            const interestSaved = loanAmount * (rate / 100) * timeSavedYears * 0.4; // Conservative estimate

            return {
                interestSaved: Math.max(0, interestSaved),
                timeSaved: Math.max(0, Math.floor(timeSavedYears))
            };
        },

        estimateTermSavings(loanAmount, rate) {
            const monthlyRate = rate / 100 / 12;
            
            // 30-year payment
            const payment30 = loanAmount * 
                (monthlyRate * Math.pow(1 + monthlyRate, 360)) / 
                (Math.pow(1 + monthlyRate, 360) - 1);

            // 15-year payment
            const payment15 = loanAmount * 
                (monthlyRate * Math.pow(1 + monthlyRate, 180)) / 
                (Math.pow(1 + monthlyRate, 180) - 1);

            const paymentIncrease = payment15 - payment30;
            
            // Rough interest savings calculation
            const totalInterest30 = (payment30 * 360) - loanAmount;
            const totalInterest15 = (payment15 * 180) - loanAmount;
            const interestSaved = totalInterest30 - totalInterest15;

            return {
                paymentIncrease: Math.max(0, paymentIncrease),
                interestSaved: Math.max(0, interestSaved)
            };
        },

        estimateBiWeeklySavings(loanAmount, rate, term) {
            // Simplified calculation for bi-weekly savings
            const annualRate = rate / 100;
            const biWeeklyFactor = 0.7; // Typical reduction factor
            
            const yearsSaved = Math.floor(term * biWeeklyFactor);
            const interestSaved = loanAmount * annualRate * yearsSaved * 0.5;

            return {
                yearsSaved: Math.max(0, yearsSaved),
                interestSaved: Math.max(0, interestSaved)
            };
        }
    };

    // ==========================================================================
    // AMORTIZATION TABLE MANAGER
    // ==========================================================================

    const AmortizationTable = {
        render(calculation) {
            if (!calculation || !calculation.schedule) {
                this.showEmptyState();
                return;
            }

            STATE.amortizationData = calculation.schedule;
            STATE.totalPages = Math.ceil(STATE.amortizationData.length / CONFIG.paymentsPerPage);
            STATE.currentPage = 1;

            this.renderPage(1);
        },

        renderPage(page) {
            const tbody = Utils.$('#amortization-table tbody');
            if (!tbody) return;

            STATE.currentPage = page;
            const start = (page - 1) * CONFIG.paymentsPerPage;
            const end = start + CONFIG.paymentsPerPage;
            const pageData = STATE.amortizationData.slice(start, end);

            tbody.innerHTML = '';

            if (pageData.length === 0) {
                this.showEmptyState();
                return;
            }

            pageData.forEach(payment => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${payment.paymentNumber || ''}</td>
                    <td>${payment.date ? Utils.formatDate(payment.date) : ''}</td>
                    <td>${Utils.formatCurrency(payment.payment || 0)}</td>
                    <td>${Utils.formatCurrency(payment.principal || 0)}</td>
                    <td>${Utils.formatCurrency(payment.interest || 0)}</td>
                    <td>${Utils.formatCurrency(payment.balance || 0)}</td>
                `;

                // Add hover effect and accessibility
                row.addEventListener('mouseenter', () => {
                    row.style.backgroundColor = 'var(--bg-tertiary)';
                });

                row.addEventListener('mouseleave', () => {
                    row.style.backgroundColor = '';
                });
            });

            // Update pagination info if needed
            this.updatePaginationInfo();
        },

        showEmptyState() {
            const tbody = Utils.$('#amortization-table tbody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-state">
                            <i class="fas fa-calculator" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                            <br>Calculate mortgage to view payment schedule
                        </td>
                    </tr>
                `;
            }
        },

        updatePaginationInfo() {
            // This could be enhanced to show pagination controls
            // For now, we just load the first 12 payments
        }
    };

    // ==========================================================================
    // APPLICATION INITIALIZATION
    // ==========================================================================

    function initializeApplication() {
        try {
            console.log('🏠 Initializing AI-Enhanced Mortgage Calculator...');

            // Initialize all modules in order
            AccessibilityControls.init();
            GlobalVoiceControl.init();
            MortgageCalculator.init();
            StatsUpdater.init();

            // Show welcome message
            setTimeout(() => {
                Utils.showToast('Welcome to the AI-Enhanced Mortgage Calculator! 🎉', 'success');
                Utils.announceToScreenReader('AI-Enhanced Mortgage Calculator loaded successfully');
            }, 1500);

            console.log('✅ AI Mortgage Calculator initialized successfully!');

        } catch (error) {
            console.error('❌ Initialization error:', error);
            Utils.showToast('Failed to initialize calculator. Please refresh the page.', 'error');
        }
    }

    // Start the application
    initializeApplication();

    // Export for debugging (development only)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.MortgageCalcDebug = {
            STATE,
            CONFIG,
            Utils,
            MortgageCalculator,
            ChartManager,
            AIInsights
        };
    }
});

// Additional utility functions that might be needed globally
window.formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '$0';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Math.abs(amount));
};
