/**
 * World's First AI-Enhanced Mortgage Calculator JavaScript - IMPROVED
 * COMPREHENSIVE FUNCTIONALITY WITH FIXES
 * Features: Fixed voice control, screen reader, A-/A+, amount chips, down payment sync
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
        paymentsPerPage: 12,
        minFontSize: 80,
        maxFontSize: 150
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
        avgSavings: 45,
        currentPage: 1,
        totalPages: 1,
        amortizationData: [],
        screenReaderEnhanced: false,
        isVoiceSupported: false
    };

    // ========== UTILITY FUNCTIONS ==========
    const utils = {
        formatCurrency: (amount) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        },

        formatNumber: (num) => {
            return new Intl.NumberFormat('en-US').format(num);
        },

        parseNumber: (str) => {
            if (typeof str === 'number') return str;
            return parseFloat(str.replace(/[,$%]/g, '')) || 0;
        },

        formatNumberInput: (input) => {
            const value = utils.parseNumber(input.value);
            if (value > 0) {
                input.value = utils.formatNumber(value);
            }
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

        announceToScreenReader: (message) => {
            const announcer = document.getElementById('sr-announcements');
            if (announcer) {
                announcer.textContent = message;
                setTimeout(() => announcer.textContent = '', 1000);
            }
        },

        showToast: (message, type = 'info') => {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            `;

            container.appendChild(toast);
            setTimeout(() => toast.remove(), 5000);
        }
    };

    // ========== DOM ELEMENTS ==========
    const elements = {
        homePrice: document.getElementById('home-price'),
        downPayment: document.getElementById('down-payment'),
        downPaymentPercent: document.getElementById('down-payment-percent'),
        interestRate: document.getElementById('interest-rate'),
        loanTerm: document.getElementById('loan-term'),
        customTerm: document.getElementById('custom-term'),
        propertyTax: document.getElementById('property-tax'),
        homeInsurance: document.getElementById('home-insurance'),
        pmi: document.getElementById('pmi'),
        extraMonthly: document.getElementById('extra-monthly'),
        extraOnetime: document.getElementById('extra-onetime'),
        
        // Results
        totalPayment: document.getElementById('total-payment'),
        principalInterest: document.getElementById('principal-interest'),
        monthlyTax: document.getElementById('monthly-tax'),
        monthlyInsurance: document.getElementById('monthly-insurance'),
        monthlyPmi: document.getElementById('monthly-pmi'),
        displayLoanAmount: document.getElementById('display-loan-amount'),
        displayTotalInterest: document.getElementById('display-total-interest'),
        displayTotalCost: document.getElementById('display-total-cost'),
        displayPayoffDate: document.getElementById('display-payoff-date'),

        // Controls
        calculateBtn: document.getElementById('calculate-btn'),
        resetForm: document.getElementById('reset-form'),
        amountToggle: document.getElementById('amount-toggle'),
        percentToggle: document.getElementById('percent-toggle'),
        amountInput: document.getElementById('amount-input'),
        percentInput: document.getElementById('percent-input'),

        // Voice controls
        voiceInput: document.getElementById('voice-input'),
        voiceToggle: document.getElementById('voice-toggle'),
        voiceIcon: document.getElementById('voice-icon'),
        voiceStatus: document.getElementById('voice-status'),
        voiceText: document.getElementById('voice-text'),

        // Accessibility
        fontSmaller: document.getElementById('font-smaller'),
        fontLarger: document.getElementById('font-larger'),
        themeToggle: document.getElementById('theme-toggle'),
        themeIcon: document.getElementById('theme-icon'),
        screenReaderToggle: document.getElementById('screen-reader-toggle'),

        // Charts and tabs
        mortgageChart: document.getElementById('mortgage-chart'),
        tabBtns: document.querySelectorAll('.tab-btn'),
        tabContents: document.querySelectorAll('.tab-content'),
        
        // Suggestion chips
        suggestionChips: document.querySelectorAll('.suggestion-chip'),
        termChips: document.querySelectorAll('.term-chip')
    };

    // ========== VOICE CONTROL FUNCTIONS ==========
    const voiceControl = {
        init: () => {
            // Check for browser support
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                STATE.isVoiceSupported = true;
                voiceControl.setupRecognition();
            } else {
                // Hide voice controls if not supported
                if (elements.voiceInput) elements.voiceInput.style.display = 'none';
                if (elements.voiceToggle) elements.voiceToggle.style.display = 'none';
                utils.showToast('Voice recognition not supported in this browser', 'warning');
            }
        },

        setupRecognition: () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            // Global voice recognition
            STATE.globalVoiceRecognition = new SpeechRecognition();
            STATE.globalVoiceRecognition.continuous = true;
            STATE.globalVoiceRecognition.interimResults = false;
            STATE.globalVoiceRecognition.lang = 'en-US';

            STATE.globalVoiceRecognition.onstart = () => {
                STATE.isGlobalListening = true;
                if (elements.voiceIcon) elements.voiceIcon.className = 'fas fa-microphone-slash';
                if (elements.voiceStatus) {
                    elements.voiceStatus.style.display = 'block';
                    elements.voiceText.textContent = 'Listening for commands...';
                }
                utils.announceToScreenReader('Voice recognition started');
            };

            STATE.globalVoiceRecognition.onend = () => {
                STATE.isGlobalListening = false;
                if (elements.voiceIcon) elements.voiceIcon.className = 'fas fa-microphone';
                if (elements.voiceStatus) elements.voiceStatus.style.display = 'none';
                utils.announceToScreenReader('Voice recognition stopped');
            };

            STATE.globalVoiceRecognition.onerror = (event) => {
                console.error('Voice recognition error:', event.error);
                voiceControl.handleError(event.error);
            };

            STATE.globalVoiceRecognition.onresult = (event) => {
                const result = event.results[event.results.length - 1];
                if (result.isFinal) {
                    const command = result[0].transcript.toLowerCase().trim();
                    voiceControl.processCommand(command);
                }
            };

            // Local voice recognition for single input
            STATE.localVoiceRecognition = new SpeechRecognition();
            STATE.localVoiceRecognition.continuous = false;
            STATE.localVoiceRecognition.interimResults = false;
            STATE.localVoiceRecognition.lang = 'en-US';

            STATE.localVoiceRecognition.onresult = (event) => {
                const result = event.results[0][0].transcript;
                voiceControl.processInputCommand(result);
            };
        },

        processCommand: (command) => {
            console.log('Voice command:', command);
            utils.announceToScreenReader(`Processing command: ${command}`);

            // Home price commands
            if (command.includes('home price') || command.includes('house price')) {
                const price = voiceControl.extractNumber(command);
                if (price > 0) {
                    elements.homePrice.value = utils.formatNumber(price);
                    utils.announceToScreenReader(`Home price set to ${utils.formatCurrency(price)}`);
                    calculations.calculate();
                }
            }
            // Down payment commands
            else if (command.includes('down payment')) {
                const amount = voiceControl.extractNumber(command);
                if (amount > 0) {
                    if (command.includes('percent') || command.includes('%')) {
                        downPaymentControl.setPercent(amount);
                        utils.announceToScreenReader(`Down payment set to ${amount} percent`);
                    } else {
                        elements.downPayment.value = utils.formatNumber(amount);
                        downPaymentControl.syncFromAmount();
                        utils.announceToScreenReader(`Down payment set to ${utils.formatCurrency(amount)}`);
                    }
                    calculations.calculate();
                }
            }
            // Interest rate commands
            else if (command.includes('interest rate') || command.includes('rate')) {
                const rate = voiceControl.extractNumber(command);
                if (rate > 0) {
                    elements.interestRate.value = rate;
                    utils.announceToScreenReader(`Interest rate set to ${rate} percent`);
                    calculations.calculate();
                }
            }
            // Calculate command
            else if (command.includes('calculate') || command.includes('compute')) {
                calculations.calculate();
                utils.announceToScreenReader('Calculating mortgage');
            }
            // Reset command
            else if (command.includes('reset') || command.includes('clear')) {
                formControls.reset();
                utils.announceToScreenReader('Form reset');
            }
            // Navigation commands
            else if (command.includes('show chart')) {
                tabControl.showTab('chart');
            }
            else if (command.includes('show insights') || command.includes('show ai')) {
                tabControl.showTab('insights');
            }
            else if (command.includes('show schedule') || command.includes('show amortization')) {
                tabControl.showTab('amortization');
            }
            else {
                utils.announceToScreenReader('Command not recognized');
                utils.showToast('Command not recognized. Try "set home price to 400000" or "calculate mortgage"', 'info');
            }
        },

        processInputCommand: (command) => {
            const number = voiceControl.extractNumber(command);
            if (number > 0) {
                // Logic to determine which input to fill based on context
                const focusedElement = document.activeElement;
                if (focusedElement && focusedElement.tagName === 'INPUT') {
                    focusedElement.value = utils.formatNumber(number);
                    focusedElement.dispatchEvent(new Event('input'));
                }
            }
        },

        extractNumber: (text) => {
            // Extract numbers from voice command
            const matches = text.match(/(\d+(?:,\d{3})*(?:\.\d+)?)/g);
            if (matches) {
                return utils.parseNumber(matches[0]);
            }
            
            // Handle written numbers
            const wordNumbers = {
                'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
                'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
                'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
                'hundred': 100, 'thousand': 1000, 'million': 1000000
            };
            
            for (const [word, num] of Object.entries(wordNumbers)) {
                if (text.includes(word)) {
                    return num;
                }
            }
            
            return 0;
        },

        handleError: (error) => {
            let message = 'Voice recognition error';
            switch (error) {
                case 'no-speech':
                    message = 'No speech detected';
                    break;
                case 'audio-capture':
                    message = 'No microphone found';
                    break;
                case 'not-allowed':
                    message = 'Microphone permission denied';
                    break;
                case 'network':
                    message = 'Network error occurred';
                    break;
            }
            utils.showToast(message, 'error');
            utils.announceToScreenReader(message);
        },

        toggleGlobal: () => {
            if (!STATE.isVoiceSupported) {
                utils.showToast('Voice recognition not supported', 'error');
                return;
            }

            if (STATE.isGlobalListening) {
                STATE.globalVoiceRecognition.stop();
            } else {
                try {
                    STATE.globalVoiceRecognition.start();
                } catch (error) {
                    console.error('Voice recognition start error:', error);
                    voiceControl.handleError('not-allowed');
                }
            }
        },

        startLocal: () => {
            if (!STATE.isVoiceSupported) {
                utils.showToast('Voice recognition not supported', 'error');
                return;
            }

            try {
                STATE.localVoiceRecognition.start();
                utils.showToast('Speak now to input a value', 'info');
            } catch (error) {
                console.error('Local voice recognition error:', error);
                voiceControl.handleError('not-allowed');
            }
        }
    };

    // ========== ACCESSIBILITY FUNCTIONS ==========
    const accessibility = {
        init: () => {
            accessibility.setupFontControls();
            accessibility.setupThemeControl();
            accessibility.setupScreenReader();
            accessibility.setupKeyboardNavigation();
        },

        setupFontControls: () => {
            if (elements.fontSmaller) {
                elements.fontSmaller.addEventListener('click', () => {
                    if (STATE.currentFontSize > CONFIG.minFontSize) {
                        STATE.currentFontSize -= 10;
                        accessibility.applyFontSize();
                        utils.announceToScreenReader(`Font size decreased to ${STATE.currentFontSize}%`);
                    }
                });
            }

            if (elements.fontLarger) {
                elements.fontLarger.addEventListener('click', () => {
                    if (STATE.currentFontSize < CONFIG.maxFontSize) {
                        STATE.currentFontSize += 10;
                        accessibility.applyFontSize();
                        utils.announceToScreenReader(`Font size increased to ${STATE.currentFontSize}%`);
                    }
                });
            }
        },

        applyFontSize: () => {
            document.documentElement.style.fontSize = `${STATE.currentFontSize}%`;
            
            // Update button states
            if (elements.fontSmaller) {
                elements.fontSmaller.disabled = STATE.currentFontSize <= CONFIG.minFontSize;
            }
            if (elements.fontLarger) {
                elements.fontLarger.disabled = STATE.currentFontSize >= CONFIG.maxFontSize;
            }
        },

        setupThemeControl: () => {
            if (elements.themeToggle) {
                elements.themeToggle.addEventListener('click', () => {
                    STATE.theme = STATE.theme === 'light' ? 'dark' : 'light';
                    document.documentElement.setAttribute('data-theme', STATE.theme);
                    
                    if (elements.themeIcon) {
                        elements.themeIcon.className = STATE.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
                    }
                    
                    utils.announceToScreenReader(`Switched to ${STATE.theme} mode`);
                    localStorage.setItem('theme', STATE.theme);
                });

                // Load saved theme
                const savedTheme = localStorage.getItem('theme');
                if (savedTheme) {
                    STATE.theme = savedTheme;
                    document.documentElement.setAttribute('data-theme', STATE.theme);
                    if (elements.themeIcon) {
                        elements.themeIcon.className = STATE.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
                    }
                }
            }
        },

        setupScreenReader: () => {
            if (elements.screenReaderToggle) {
                elements.screenReaderToggle.addEventListener('click', () => {
                    STATE.screenReaderEnhanced = !STATE.screenReaderEnhanced;
                    elements.screenReaderToggle.classList.toggle('active', STATE.screenReaderEnhanced);
                    
                    if (STATE.screenReaderEnhanced) {
                        accessibility.enhanceForScreenReader();
                        utils.announceToScreenReader('Screen reader enhancements activated');
                    } else {
                        accessibility.removeScreenReaderEnhancements();
                        utils.announceToScreenReader('Screen reader enhancements deactivated');
                    }
                });
            }
        },

        enhanceForScreenReader: () => {
            // Add more descriptive labels and ARIA attributes
            document.querySelectorAll('input').forEach(input => {
                if (!input.getAttribute('aria-describedby')) {
                    const label = input.closest('.form-group')?.querySelector('label');
                    if (label) {
                        input.setAttribute('aria-label', label.textContent.replace(/\s+/g, ' ').trim());
                    }
                }
            });

            // Add live regions for dynamic content
            const resultsPanel = document.querySelector('.results-panel');
            if (resultsPanel) {
                resultsPanel.setAttribute('aria-live', 'polite');
                resultsPanel.setAttribute('aria-atomic', 'true');
            }

            // Enhance button descriptions
            document.querySelectorAll('button').forEach(btn => {
                if (!btn.getAttribute('aria-label') && btn.textContent) {
                    btn.setAttribute('aria-label', btn.textContent.trim());
                }
            });
        },

        removeScreenReaderEnhancements: () => {
            // Remove added ARIA attributes
            document.querySelectorAll('[aria-live="polite"]').forEach(el => {
                el.removeAttribute('aria-live');
                el.removeAttribute('aria-atomic');
            });
        },

        setupKeyboardNavigation: () => {
            // Add keyboard support for custom elements
            document.querySelectorAll('.suggestion-chip, .term-chip, .toggle-btn').forEach(element => {
                element.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        element.click();
                    }
                });
            });

            // Hamburger menu keyboard support
            const hamburger = document.querySelector('.hamburger');
            if (hamburger) {
                hamburger.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        hamburger.click();
                    }
                });
            }
        }
    };

    // ========== DOWN PAYMENT CONTROL ==========
    const downPaymentControl = {
        init: () => {
            if (elements.amountToggle) {
                elements.amountToggle.addEventListener('click', () => {
                    downPaymentControl.showAmount();
                });
            }

            if (elements.percentToggle) {
                elements.percentToggle.addEventListener('click', () => {
                    downPaymentControl.showPercent();
                });
            }

            if (elements.downPayment) {
                elements.downPayment.addEventListener('input', utils.debounce(() => {
                    downPaymentControl.syncFromAmount();
                    calculations.calculate();
                }, CONFIG.debounceDelay));

                elements.downPayment.addEventListener('blur', () => {
                    utils.formatNumberInput(elements.downPayment);
                });
            }

            if (elements.downPaymentPercent) {
                elements.downPaymentPercent.addEventListener('input', utils.debounce(() => {
                    downPaymentControl.syncFromPercent();
                    calculations.calculate();
                }, CONFIG.debounceDelay));
            }
        },

        showAmount: () => {
            if (elements.amountToggle) elements.amountToggle.classList.add('active');
            if (elements.percentToggle) elements.percentToggle.classList.remove('active');
            if (elements.amountInput) elements.amountInput.style.display = 'block';
            if (elements.percentInput) elements.percentInput.style.display = 'none';
            utils.announceToScreenReader('Switched to amount input');
        },

        showPercent: () => {
            if (elements.percentToggle) elements.percentToggle.classList.add('active');
            if (elements.amountToggle) elements.amountToggle.classList.remove('active');
            if (elements.percentInput) elements.percentInput.style.display = 'block';
            if (elements.amountInput) elements.amountInput.style.display = 'none';
            utils.announceToScreenReader('Switched to percentage input');
        },

        syncFromAmount: () => {
            const homePrice = utils.parseNumber(elements.homePrice.value);
            const downPayment = utils.parseNumber(elements.downPayment.value);
            
            if (homePrice > 0 && downPayment >= 0) {
                const percentage = (downPayment / homePrice) * 100;
                if (elements.downPaymentPercent) {
                    elements.downPaymentPercent.value = Math.min(percentage, 100).toFixed(1);
                }
            }
        },

        syncFromPercent: () => {
            const homePrice = utils.parseNumber(elements.homePrice.value);
            const percentage = utils.parseNumber(elements.downPaymentPercent.value);
            
            if (homePrice > 0 && percentage >= 0) {
                const amount = (homePrice * percentage) / 100;
                if (elements.downPayment) {
                    elements.downPayment.value = utils.formatNumber(amount);
                }
            }
        },

        setPercent: (percent) => {
            if (elements.downPaymentPercent) {
                elements.downPaymentPercent.value = percent;
                downPaymentControl.syncFromPercent();
            }
        }
    };

    // ========== SUGGESTION CHIPS ==========
    const suggestionChips = {
        init: () => {
            elements.suggestionChips.forEach(chip => {
                chip.addEventListener('click', () => {
                    const value = chip.getAttribute('data-value');
                    const inputId = chip.getAttribute('data-input');
                    const input = document.getElementById(inputId);
                    
                    if (input && value) {
                        input.value = utils.formatNumber(parseInt(value));
                        input.dispatchEvent(new Event('input'));
                        chip.focus(); // Maintain focus for accessibility
                        utils.announceToScreenReader(`Set ${inputId.replace('-', ' ')} to ${utils.formatCurrency(parseInt(value))}`);
                    }
                });
            });
        }
    };

    // ========== TERM CHIPS ==========
    const termChips = {
        init: () => {
            elements.termChips.forEach(chip => {
                chip.addEventListener('click', () => {
                    const years = chip.getAttribute('data-years');
                    
                    // Remove active class from all chips
                    elements.termChips.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    
                    if (years === 'custom') {
                        const customGroup = document.getElementById('custom-term-group');
                        if (customGroup) {
                            customGroup.style.display = 'block';
                            elements.customTerm.focus();
                        }
                        utils.announceToScreenReader('Custom term input activated');
                    } else {
                        const customGroup = document.getElementById('custom-term-group');
                        if (customGroup) customGroup.style.display = 'none';
                        
                        if (elements.loanTerm) {
                            elements.loanTerm.value = years;
                        }
                        utils.announceToScreenReader(`Loan term set to ${years} years`);
                        calculations.calculate();
                    }
                });
            });

            if (elements.customTerm) {
                elements.customTerm.addEventListener('input', () => {
                    const years = parseInt(elements.customTerm.value);
                    if (years > 0 && years <= 40) {
                        elements.loanTerm.value = years;
                        calculations.calculate();
                    }
                });
            }
        }
    };

    // ========== TAB CONTROL ==========
    const tabControl = {
        init: () => {
            elements.tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const tabId = btn.getAttribute('data-tab');
                    tabControl.showTab(tabId);
                });
            });
        },

        showTab: (tabId) => {
            // Update buttons
            elements.tabBtns.forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-tab') === tabId) {
                    btn.classList.add('active');
                }
            });

            // Update content
            elements.tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });

            utils.announceToScreenReader(`Switched to ${tabId} tab`);
        }
    };

    // ========== CALCULATIONS ==========
    const calculations = {
        calculate: () => {
            const inputs = calculations.getInputs();
            
            if (!calculations.validateInputs(inputs)) {
                return;
            }

            const results = calculations.computeMortgage(inputs);
            calculations.displayResults(results);
            calculations.updateCharts(results);
            calculations.generateAmortizationTable(results);
            
            STATE.currentCalculation = results;
            utils.announceToScreenReader('Mortgage calculation completed');
        },

        getInputs: () => {
            return {
                homePrice: utils.parseNumber(elements.homePrice?.value || 0),
                downPayment: utils.parseNumber(elements.downPayment?.value || 0),
                interestRate: utils.parseNumber(elements.interestRate?.value || 0),
                loanTerm: parseInt(elements.loanTerm?.value || 30),
                propertyTax: utils.parseNumber(elements.propertyTax?.value || 0),
                homeInsurance: utils.parseNumber(elements.homeInsurance?.value || 0),
                pmi: utils.parseNumber(elements.pmi?.value || 0),
                extraMonthly: utils.parseNumber(elements.extraMonthly?.value || 0),
                extraYearly: utils.parseNumber(elements.extraOnetime?.value || 0)
            };
        },

        validateInputs: (inputs) => {
            if (inputs.homePrice <= 0) {
                utils.showToast('Please enter a valid home price', 'error');
                elements.homePrice?.focus();
                return false;
            }

            if (inputs.downPayment >= inputs.homePrice) {
                utils.showToast('Down payment cannot exceed home price', 'error');
                elements.downPayment?.focus();
                return false;
            }

            if (inputs.interestRate <= 0 || inputs.interestRate > 30) {
                utils.showToast('Please enter a valid interest rate (0.01% - 30%)', 'error');
                elements.interestRate?.focus();
                return false;
            }

            return true;
        },

        computeMortgage: (inputs) => {
            const loanAmount = inputs.homePrice - inputs.downPayment;
            const monthlyRate = inputs.interestRate / 100 / 12;
            const totalPayments = inputs.loanTerm * 12;

            // Monthly principal and interest
            const monthlyPI = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                              (Math.pow(1 + monthlyRate, totalPayments) - 1);

            // Other monthly costs
            const monthlyTax = inputs.propertyTax / 12;
            const monthlyInsurance = inputs.homeInsurance / 12;
            const monthlyPmi = inputs.downPayment < inputs.homePrice * 0.20 ? 
                              (loanAmount * CONFIG.pmiRate / 12) : 0;

            const totalMonthlyPayment = monthlyPI + monthlyTax + monthlyInsurance + monthlyPmi;
            const totalInterest = (monthlyPI * totalPayments) - loanAmount;
            const totalCost = inputs.homePrice + totalInterest;

            const payoffDate = new Date();
            payoffDate.setFullYear(payoffDate.getFullYear() + inputs.loanTerm);

            return {
                inputs,
                loanAmount,
                monthlyPI: monthlyPI,
                monthlyTax,
                monthlyInsurance,
                monthlyPmi,
                totalMonthlyPayment,
                totalInterest,
                totalCost,
                payoffDate,
                totalPayments,
                monthlyRate
            };
        },

        displayResults: (results) => {
            if (elements.totalPayment) {
                elements.totalPayment.textContent = utils.formatCurrency(results.totalMonthlyPayment);
            }
            if (elements.principalInterest) {
                elements.principalInterest.textContent = utils.formatCurrency(results.monthlyPI);
            }
            if (elements.monthlyTax) {
                elements.monthlyTax.textContent = utils.formatCurrency(results.monthlyTax);
            }
            if (elements.monthlyInsurance) {
                elements.monthlyInsurance.textContent = utils.formatCurrency(results.monthlyInsurance);
            }
            if (elements.monthlyPmi) {
                elements.monthlyPmi.textContent = utils.formatCurrency(results.monthlyPmi);
            }
            if (elements.displayLoanAmount) {
                elements.displayLoanAmount.textContent = utils.formatCurrency(results.loanAmount);
            }
            if (elements.displayTotalInterest) {
                elements.displayTotalInterest.textContent = utils.formatCurrency(results.totalInterest);
            }
            if (elements.displayTotalCost) {
                elements.displayTotalCost.textContent = utils.formatCurrency(results.totalCost);
            }
            if (elements.displayPayoffDate) {
                elements.displayPayoffDate.textContent = results.payoffDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: 'numeric' 
                });
            }

            // Update PMI status
            calculations.updatePmiStatus(results);
        },

        updatePmiStatus: (results) => {
            const pmiStatus = document.getElementById('pmi-status');
            const pmiWarning = document.getElementById('pmi-warning');
            
            if (results.monthlyPmi > 0) {
                if (pmiStatus) pmiStatus.textContent = `PMI: ${utils.formatCurrency(results.monthlyPmi)}/month`;
                if (pmiWarning) pmiWarning.style.display = 'block';
            } else {
                if (pmiStatus) pmiStatus.textContent = 'No PMI required (20%+ down payment)';
                if (pmiWarning) pmiWarning.style.display = 'none';
            }
        },

        updateCharts: (results) => {
            if (!elements.mortgageChart) return;

            const ctx = elements.mortgageChart.getContext('2d');
            
            if (STATE.chart) {
                STATE.chart.destroy();
            }

            // Generate yearly data for chart
            const yearlyData = [];
            let balance = results.loanAmount;
            
            for (let year = 1; year <= results.inputs.loanTerm; year++) {
                let yearlyPrincipal = 0;
                let yearlyInterest = 0;
                
                for (let month = 1; month <= 12; month++) {
                    if (balance <= 0) break;
                    
                    const interestPayment = balance * results.monthlyRate;
                    const principalPayment = results.monthlyPI - interestPayment;
                    
                    yearlyPrincipal += principalPayment;
                    yearlyInterest += interestPayment;
                    balance -= principalPayment;
                    
                    if (balance < 0) balance = 0;
                }
                
                yearlyData.push({
                    year,
                    principal: yearlyPrincipal,
                    interest: yearlyInterest,
                    balance
                });
            }

            STATE.yearlyData = yearlyData;

            STATE.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: yearlyData.map(d => `Year ${d.year}`),
                    datasets: [{
                        label: 'Remaining Balance',
                        data: yearlyData.map(d => d.balance),
                        borderColor: '#0d9488',
                        backgroundColor: 'rgba(13, 148, 136, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Loan Balance Over Time'
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return utils.formatCurrency(value);
                                }
                            }
                        }
                    }
                }
            });
        },

        generateAmortizationTable: (results) => {
            const tbody = document.getElementById('amortization-body');
            if (!tbody) return;

            STATE.amortizationData = [];
            let balance = results.loanAmount;
            const startDate = new Date();

            for (let payment = 1; payment <= results.totalPayments; payment++) {
                if (balance <= 0) break;

                const interestPayment = balance * results.monthlyRate;
                const principalPayment = Math.min(results.monthlyPI - interestPayment, balance);
                balance -= principalPayment;

                if (balance < 0) balance = 0;

                const paymentDate = new Date(startDate);
                paymentDate.setMonth(paymentDate.getMonth() + payment - 1);

                STATE.amortizationData.push({
                    payment,
                    date: paymentDate,
                    totalPayment: results.monthlyPI,
                    principal: principalPayment,
                    interest: interestPayment,
                    balance
                });
            }

            STATE.totalPages = Math.ceil(STATE.amortizationData.length / CONFIG.paymentsPerPage);
            calculations.displayAmortizationPage(1);
        },

        displayAmortizationPage: (page) => {
            const tbody = document.getElementById('amortization-body');
            if (!tbody) return;

            const start = (page - 1) * CONFIG.paymentsPerPage;
            const end = Math.min(start + CONFIG.paymentsPerPage, STATE.amortizationData.length);
            
            tbody.innerHTML = '';

            if (STATE.amortizationData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="no-data">Calculate mortgage to view schedule</td></tr>';
                return;
            }

            for (let i = start; i < end; i++) {
                const payment = STATE.amortizationData[i];
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${payment.payment}</td>
                    <td>${payment.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</td>
                    <td>${utils.formatCurrency(payment.totalPayment)}</td>
                    <td>${utils.formatCurrency(payment.principal)}</td>
                    <td>${utils.formatCurrency(payment.interest)}</td>
                    <td>${utils.formatCurrency(payment.balance)}</td>
                `;
                tbody.appendChild(row);
            }

            // Update pagination
            const pageInfo = document.getElementById('page-info');
            if (pageInfo) {
                pageInfo.textContent = `Page ${page} of ${STATE.totalPages} (${STATE.amortizationData.length} payments)`;
            }

            const prevBtn = document.getElementById('prev-page');
            const nextBtn = document.getElementById('next-page');
            
            if (prevBtn) prevBtn.disabled = page === 1;
            if (nextBtn) nextBtn.disabled = page === STATE.totalPages;

            STATE.currentPage = page;
        }
    };

    // ========== FORM CONTROLS ==========
    const formControls = {
        init: () => {
            // Calculate button
            if (elements.calculateBtn) {
                elements.calculateBtn.addEventListener('click', calculations.calculate);
            }

            // Reset button
            if (elements.resetForm) {
                elements.resetForm.addEventListener('click', formControls.reset);
            }

            // Input formatting and validation
            const numberInputs = [
                elements.homePrice,
                elements.downPayment,
                elements.propertyTax,
                elements.homeInsurance,
                elements.extraMonthly,
                elements.extraOnetime
            ].filter(Boolean);

            numberInputs.forEach(input => {
                input.addEventListener('blur', () => utils.formatNumberInput(input));
                input.addEventListener('input', utils.debounce(calculations.calculate, CONFIG.debounceDelay));
            });

            // Interest rate input
            if (elements.interestRate) {
                elements.interestRate.addEventListener('input', utils.debounce(calculations.calculate, CONFIG.debounceDelay));
            }

            // Auto-calculate property tax and insurance
            if (elements.homePrice) {
                elements.homePrice.addEventListener('input', () => {
                    formControls.updateDependentFields();
                });
            }

            // Pagination buttons
            const prevBtn = document.getElementById('prev-page');
            const nextBtn = document.getElementById('next-page');

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (STATE.currentPage > 1) {
                        calculations.displayAmortizationPage(STATE.currentPage - 1);
                    }
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (STATE.currentPage < STATE.totalPages) {
                        calculations.displayAmortizationPage(STATE.currentPage + 1);
                    }
                });
            }
        },

        updateDependentFields: () => {
            const homePrice = utils.parseNumber(elements.homePrice?.value || 0);
            
            if (homePrice > 0) {
                // Update property tax (0.76% of home value as default for CA)
                if (elements.propertyTax) {
                    elements.propertyTax.value = utils.formatNumber(homePrice * 0.0076);
                }

                // Update home insurance (0.2% of home value)
                if (elements.homeInsurance) {
                    elements.homeInsurance.value = utils.formatNumber(homePrice * CONFIG.defaultInsuranceRate);
                }

                // Sync down payment if in percentage mode
                if (elements.percentInput?.style.display !== 'none') {
                    downPaymentControl.syncFromPercent();
                } else {
                    downPaymentControl.syncFromAmount();
                }
            }
        },

        reset: () => {
            // Reset all form inputs to defaults
            if (elements.homePrice) elements.homePrice.value = '400,000';
            if (elements.downPayment) elements.downPayment.value = '80,000';
            if (elements.downPaymentPercent) elements.downPaymentPercent.value = '20';
            if (elements.interestRate) elements.interestRate.value = '6.75';
            if (elements.loanTerm) elements.loanTerm.value = '30';
            if (elements.propertyTax) elements.propertyTax.value = '3,040';
            if (elements.homeInsurance) elements.homeInsurance.value = '800';
            if (elements.pmi) elements.pmi.value = '0';
            if (elements.extraMonthly) elements.extraMonthly.value = '';
            if (elements.extraOnetime) elements.extraOnetime.value = '';

            // Reset term chips
            elements.termChips.forEach(chip => {
                chip.classList.remove('active');
                if (chip.getAttribute('data-years') === '30') {
                    chip.classList.add('active');
                }
            });

            // Hide custom term input
            const customGroup = document.getElementById('custom-term-group');
            if (customGroup) customGroup.style.display = 'none';

            // Reset to amount input for down payment
            downPaymentControl.showAmount();

            // Recalculate
            calculations.calculate();

            utils.announceToScreenReader('Form has been reset to default values');
        }
    };

    // ========== EVENT LISTENERS ==========
    const setupEventListeners = () => {
        // Voice control buttons
        if (elements.voiceToggle) {
            elements.voiceToggle.addEventListener('click', voiceControl.toggleGlobal);
        }

        if (elements.voiceInput) {
            elements.voiceInput.addEventListener('click', voiceControl.startLocal);
        }

        // Hamburger menu
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }

        // Modal controls
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            }
        });
    };

    // ========== INITIALIZATION ==========
    const init = () => {
        console.log('Initializing AI Mortgage Calculator...');
        
        // Initialize all modules
        voiceControl.init();
        accessibility.init();
        downPaymentControl.init();
        suggestionChips.init();
        termChips.init();
        tabControl.init();
        formControls.init();
        setupEventListeners();

        // Perform initial calculation
        calculations.calculate();

        // Update stats periodically
        setInterval(() => {
            STATE.calculationsToday += Math.floor(Math.random() * 5) + 1;
            const calcCount = document.getElementById('calc-count');
            if (calcCount) {
                calcCount.textContent = utils.formatNumber(STATE.calculationsToday);
            }
        }, CONFIG.calculationsUpdateInterval);

        console.log('AI Mortgage Calculator initialized successfully');
        utils.announceToScreenReader('Mortgage calculator loaded and ready');
    };

    // Start initialization
    init();
});
