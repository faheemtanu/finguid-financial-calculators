/**
 * AI-Enhanced Mortgage Calculator - ENHANCED PRODUCTION JAVASCRIPT  
 * Improved UI/UX with perfect year-dragging chart interaction and all features preserved
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // ===== CONFIGURATION & STATE =====
    const CONFIG = {
        debounceDelay: 300,
        defaultInsuranceRate: 0.002, // 0.2% of home value
        calculationsUpdateInterval: 5000, // 5 seconds
        savingsUpdateInterval: 7000, // 7 seconds
        voiceTimeout: 15000, // 15 seconds
        maxSliderYear: 30,
        pmiRate: 0.005, // 0.5% annually
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
        avgSavings: 45000,
        screenReaderActive: false,
        currentPage: 1,
        totalPages: 1,
        amortizationData: [],
        isVoiceSupported: false,
        chartHighlightLine: null
    };

    // Enhanced State Tax Rates (property tax as percentage of home value)
    const STATE_TAX_RATES = {
        'AL': 0.41, 'AK': 1.19, 'AZ': 0.72, 'AR': 0.62, 'CA': 0.76, 'CO': 0.55, 'CT': 2.14, 'DE': 0.57,
        'FL': 0.98, 'GA': 0.92, 'HI': 0.28, 'ID': 0.69, 'IL': 2.16, 'IN': 0.85, 'IA': 1.57, 'KS': 1.41,
        'KY': 0.86, 'LA': 0.55, 'ME': 1.36, 'MD': 1.09, 'MA': 1.23, 'MI': 1.54, 'MN': 1.12, 'MS': 0.81,
        'MO': 0.97, 'MT': 0.84, 'NE': 1.73, 'NV': 0.64, 'NH': 2.18, 'NJ': 2.42, 'NM': 0.80, 'NY': 1.72,
        'NC': 0.84, 'ND': 0.98, 'OH': 1.56, 'OK': 0.90, 'OR': 0.97, 'PA': 1.58, 'RI': 1.63, 'SC': 0.57,
        'SD': 1.31, 'TN': 0.71, 'TX': 1.90, 'UT': 0.66, 'VT': 1.90, 'VA': 0.82, 'WA': 0.98, 'WV': 0.59,
        'WI': 1.68, 'WY': 0.61
    };

    // ===== DOM UTILITIES =====
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    // ===== UTILITY FUNCTIONS =====
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

            toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
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

            const elements = $$('#rate-update-time');
            elements.forEach(el => {
                if (el) el.textContent = `Updated ${dateTimeString}`;
            });
        }
    };

    // ===== DYNAMIC STATS UPDATER =====
    const StatsUpdater = {
        init() {
            this.updateCalculationsCounter();
            this.updateSavingsCounter();
            setInterval(() => this.updateCalculationsCounter(), CONFIG.calculationsUpdateInterval);
            setInterval(() => this.updateSavingsCounter(), CONFIG.savingsUpdateInterval);
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
        }
    };

    // ===== VOICE CONTROL =====
    const VoiceControl = {
        init() {
            if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
                console.warn('Speech recognition not supported');
                const voiceButtons = $$('#voice-toggle, #voice-input');
                voiceButtons.forEach(btn => {
                    if (btn) {
                        btn.disabled = true;
                        btn.title = 'Voice control not supported in this browser';
                    }
                });
                return;
            }

            STATE.isVoiceSupported = true;
            this.setupRecognition();

            // Button event listeners
            $('#voice-toggle')?.addEventListener('click', () => this.toggleGlobal());
            $('#voice-input')?.addEventListener('click', () => this.startLocal());
        },

        setupRecognition() {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            // Global voice recognition
            STATE.globalVoiceRecognition = new SpeechRecognition();
            STATE.globalVoiceRecognition.continuous = true;
            STATE.globalVoiceRecognition.interimResults = false;
            STATE.globalVoiceRecognition.lang = 'en-US';

            STATE.globalVoiceRecognition.onstart = () => {
                STATE.isGlobalListening = true;
                $('#voice-icon').className = 'fas fa-microphone-slash';
                $('#voice-toggle').classList.add('active');
                $('#voice-status').style.display = 'flex';
                $('#voice-text').textContent = 'Listening for global commands...';
                Utils.announceToScreenReader('Global voice recognition started');
            };

            STATE.globalVoiceRecognition.onend = () => {
                STATE.isGlobalListening = false;
                $('#voice-icon').className = 'fas fa-microphone';
                $('#voice-toggle').classList.remove('active');
                $('#voice-status').style.display = 'none';
                Utils.announceToScreenReader('Global voice recognition stopped');
            };

            STATE.globalVoiceRecognition.onerror = (event) => {
                console.error('Voice recognition error:', event.error);
                this.handleError(event.error);
            };

            STATE.globalVoiceRecognition.onresult = (event) => {
                const result = event.results[event.results.length - 1];
                if (result.isFinal) {
                    const command = result[0].transcript.toLowerCase().trim();
                    console.log('Voice command received:', command);
                    this.processCommand(command);
                }
            };

            // Local voice recognition for form inputs
            STATE.localVoiceRecognition = new SpeechRecognition();
            STATE.localVoiceRecognition.continuous = false;
            STATE.localVoiceRecognition.interimResults = false;
            STATE.localVoiceRecognition.lang = 'en-US';

            STATE.localVoiceRecognition.onresult = (event) => {
                const result = event.results[0][0].transcript;
                console.log('Local voice input:', result);
                this.processInputCommand(result);
            };

            STATE.localVoiceRecognition.onerror = (event) => {
                console.error('Local voice recognition error:', event.error);
                this.handleError(event.error);
            };
        },

        toggleGlobal() {
            if (!STATE.isVoiceSupported) {
                Utils.showToast('Voice recognition not supported', 'error');
                return;
            }

            if (STATE.isGlobalListening) {
                STATE.globalVoiceRecognition.stop();
            } else {
                try {
                    STATE.globalVoiceRecognition.start();
                    Utils.showToast('Say "set home price to 400000" or "calculate mortgage"', 'info');
                } catch (error) {
                    console.error('Voice recognition start error:', error);
                    this.handleError('not-allowed');
                }
            }
        },

        startLocal() {
            if (!STATE.isVoiceSupported) {
                Utils.showToast('Voice recognition not supported', 'error');
                return;
            }

            try {
                STATE.localVoiceRecognition.start();
                Utils.showToast('Speak now to input a value', 'info');
            } catch (error) {
                console.error('Local voice recognition error:', error);
                this.handleError('not-allowed');
            }
        },

        processCommand(command) {
            Utils.announceToScreenReader(`Processing command: ${command}`);

            // Home price commands
            if (command.includes('home price') || command.includes('house price')) {
                const price = this.extractNumber(command);
                if (price > 0) {
                    $('#home-price').value = Utils.formatNumber(price);
                    Utils.announceToScreenReader(`Home price set to ${Utils.formatCurrency(price)}`);
                    MortgageCalculator.calculate();
                }
            }
            // Down payment commands
            else if (command.includes('down payment')) {
                const amount = this.extractNumber(command);
                if (amount > 0) {
                    if (command.includes('percent') || command.includes('%')) {
                        DownPaymentControl.setPercent(amount);
                        Utils.announceToScreenReader(`Down payment set to ${amount} percent`);
                    } else {
                        $('#down-payment').value = Utils.formatNumber(amount);
                        DownPaymentControl.syncFromAmount();
                        Utils.announceToScreenReader(`Down payment set to ${Utils.formatCurrency(amount)}`);
                    }
                    MortgageCalculator.calculate();
                }
            }
            // Interest rate commands
            else if (command.includes('interest rate') || command.includes('rate')) {
                const rate = this.extractNumber(command);
                if (rate > 0) {
                    $('#interest-rate').value = rate;
                    Utils.announceToScreenReader(`Interest rate set to ${rate} percent`);
                    MortgageCalculator.calculate();
                }
            }
            // Calculate command
            else if (command.includes('calculate') || command.includes('compute')) {
                MortgageCalculator.calculate();
                Utils.announceToScreenReader('Calculating mortgage');
            }
            // Reset command
            else if (command.includes('reset') || command.includes('clear')) {
                MortgageCalculator.resetForm();
                Utils.announceToScreenReader('Form reset');
            }
            // Tab navigation commands
            else if (command.includes('show chart')) {
                TabControl.showTab('chart');
            }
            else if (command.includes('show insights') || command.includes('show ai')) {
                TabControl.showTab('insights');
            }
            else if (command.includes('show schedule') || command.includes('show amortization')) {
                TabControl.showTab('amortization');
            }
            else {
                Utils.announceToScreenReader('Command not recognized. Try saying "set home price to 400000" or "calculate mortgage"');
                Utils.showToast('Command not recognized. Try "set home price to 400000" or "calculate mortgage"', 'info');
            }
        },

        processInputCommand(command) {
            const number = this.extractNumber(command);
            if (number > 0) {
                const focusedElement = document.activeElement;
                if (focusedElement && focusedElement.tagName === 'INPUT') {
                    focusedElement.value = Utils.formatNumber(number);
                    focusedElement.dispatchEvent(new Event('input'));
                    Utils.announceToScreenReader(`Input set to ${number}`);
                }
            }
        },

        extractNumber(text) {
            // Extract numbers from voice command
            const matches = text.match(/(\d+(?:,\d{3})*(?:\.\d+)?)/g);
            if (matches) {
                return Utils.parseNumber(matches[0]);
            }

            // Handle written numbers
            const wordNumbers = {
                'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
                'ten': 10, 'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
                'hundred': 100, 'thousand': 1000, 'million': 1000000
            };

            for (const [word, num] of Object.entries(wordNumbers)) {
                if (text.includes(word)) {
                    return num;
                }
            }

            return 0;
        },

        handleError(error) {
            let message = 'Voice recognition error';
            switch (error) {
                case 'no-speech':
                    message = 'No speech detected. Please try again.';
                    break;
                case 'audio-capture':
                    message = 'No microphone found. Please check your microphone settings.';
                    break;
                case 'not-allowed':
                    message = 'Microphone permission denied. Please allow microphone access.';
                    break;
                case 'network':
                    message = 'Network error occurred. Please check your connection.';
                    break;
            }
            Utils.showToast(message, 'error');
            Utils.announceToScreenReader(message);
        }
    };

    // ===== ACCESSIBILITY CONTROLS =====
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
            this.applyFontSize();
        },

        adjustFontSize(change) {
            STATE.currentFontSize += change;
            STATE.currentFontSize = Math.max(CONFIG.minFontSize, Math.min(CONFIG.maxFontSize, STATE.currentFontSize));
            this.applyFontSize();
            localStorage.setItem('fontSize', STATE.currentFontSize.toString());

            Utils.announceToScreenReader(`Font size ${change > 0 ? 'increased' : 'decreased'} to ${STATE.currentFontSize}%`);
            Utils.showToast(`Font size: ${STATE.currentFontSize}%`, 'success');
        },

        applyFontSize() {
            // Remove existing font scale classes
            document.body.classList.remove(
                'font-scale-80', 'font-scale-90', 'font-scale-100', 'font-scale-110', 
                'font-scale-120', 'font-scale-130', 'font-scale-140', 'font-scale-150'
            );

            // Add new font scale class
            document.body.classList.add(`font-scale-${STATE.currentFontSize}`);

            // Update button states
            const smallerBtn = $('#font-smaller');
            const largerBtn = $('#font-larger');

            if (smallerBtn) {
                smallerBtn.disabled = STATE.currentFontSize <= CONFIG.minFontSize;
                smallerBtn.classList.toggle('disabled', STATE.currentFontSize <= CONFIG.minFontSize);
            }

            if (largerBtn) {
                largerBtn.disabled = STATE.currentFontSize >= CONFIG.maxFontSize;
                largerBtn.classList.toggle('disabled', STATE.currentFontSize >= CONFIG.maxFontSize);
            }
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
            const themeToggle = $('#theme-toggle');

            if (icon && themeToggle) {
                if (theme === 'light') {
                    icon.className = 'fas fa-moon';
                    themeToggle.innerHTML = '<i id="theme-icon" class="fas fa-moon"></i> Dark Mode';
                } else {
                    icon.className = 'fas fa-sun';
                    themeToggle.innerHTML = '<i id="theme-icon" class="fas fa-sun"></i> Light Mode';
                }
            }

            Utils.announceToScreenReader(`Switched to ${theme} mode`);
            Utils.showToast(`Switched to ${theme} mode`, 'success');
        },

        toggleScreenReader() {
            STATE.screenReaderActive = !STATE.screenReaderActive;
            const btn = $('#screen-reader-toggle');

            if (btn) {
                btn.classList.toggle('active', STATE.screenReaderActive);
            }

            const message = STATE.screenReaderActive ? 
                'Screen reader enhancements enabled' : 
                'Screen reader enhancements disabled';
            Utils.announceToScreenReader(message);
            Utils.showToast(message, 'success');
        }
    };

    // ===== DOWN PAYMENT CONTROL =====
    const DownPaymentControl = {
        init() {
            $('#amount-toggle')?.addEventListener('click', () => this.showAmount());
            $('#percent-toggle')?.addEventListener('click', () => this.showPercent());

            // Input event listeners
            $('#down-payment')?.addEventListener('input', Utils.debounce(() => {
                this.syncFromAmount();
                MortgageCalculator.calculate();
            }, CONFIG.debounceDelay));

            $('#down-payment-percent')?.addEventListener('input', Utils.debounce(() => {
                this.syncFromPercent();
                MortgageCalculator.calculate();
            }, CONFIG.debounceDelay));
        },

        showAmount() {
            $('#amount-toggle')?.classList.add('active');
            $('#percent-toggle')?.classList.remove('active');
            $('#amount-input').style.display = 'flex';
            $('#percent-input').style.display = 'none';
            Utils.announceToScreenReader('Switched to dollar amount input for down payment');
        },

        showPercent() {
            $('#percent-toggle')?.classList.add('active');
            $('#amount-toggle')?.classList.remove('active');
            $('#percent-input').style.display = 'flex';
            $('#amount-input').style.display = 'none';
            Utils.announceToScreenReader('Switched to percentage input for down payment');
        },

        syncFromAmount() {
            const homePrice = Utils.parseNumber($('#home-price').value);
            const downPayment = Utils.parseNumber($('#down-payment').value);

            if (homePrice > 0 && downPayment >= 0) {
                const percentage = (downPayment / homePrice) * 100;
                const percentField = $('#down-payment-percent');
                if (percentField) {
                    percentField.value = Math.min(percentage, 100).toFixed(1);
                }
            }
        },

        syncFromPercent() {
            const homePrice = Utils.parseNumber($('#home-price').value);
            const percentage = Utils.parseNumber($('#down-payment-percent').value);

            if (homePrice > 0 && percentage >= 0) {
                const amount = (homePrice * percentage) / 100;
                const amountField = $('#down-payment');
                if (amountField) {
                    amountField.value = Utils.formatNumber(amount);
                }
            }
        },

        setPercent(percent) {
            const percentField = $('#down-payment-percent');
            if (percentField) {
                percentField.value = percent;
                this.syncFromPercent();
            }
        }
    };

    // ===== TAB CONTROL =====
    const TabControl = {
        init() {
            $$('.tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tabId = btn.getAttribute('data-tab');
                    this.showTab(tabId);
                });
            });
        },

        showTab(tabId) {
            // Update buttons
            $$('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
                if (btn.getAttribute('data-tab') === tabId) {
                    btn.classList.add('active');
                    btn.setAttribute('aria-selected', 'true');
                }
            });

            // Update content
            $$('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });

            const tabNames = {
                'chart': 'Mortgage Over Time',
                'insights': 'AI-Powered Insights',
                'amortization': 'Amortization Schedule'
            };

            Utils.announceToScreenReader(`Switched to ${tabNames[tabId]} tab`);

            // If switching to chart tab, update chart size
            if (tabId === 'chart' && STATE.chart) {
                setTimeout(() => {
                    STATE.chart.resize();
                }, 100);
            }
        }
    };

    // ===== ENHANCED YEAR SLIDER MANAGER =====
    const YearSliderManager = {
        init(calculation) {
            if (!calculation || !calculation.schedule) return;

            this.calculation = calculation;
            this.generateYearlyData();
            this.setupSlider();
            // Default to showing year 1 initially
            this.updateFromSlider(1);
        },

        generateYearlyData() {
            const schedule = this.calculation.schedule;
            this.yearlyData = [];

            let totalPrincipal = 0;
            let totalInterest = 0;
            const loanAmount = this.calculation.loanAmount;

            // Generate data for each year of the loan term
            for (let year = 1; year <= this.calculation.params.term; year++) {
                const startIndex = (year - 1) * 12;
                const endIndex = Math.min(year * 12 - 1, schedule.length - 1);

                if (endIndex >= 0 && schedule[endIndex]) {
                    const payment = schedule[endIndex];

                    // Calculate totals for this year
                    const yearPayments = schedule.slice(startIndex, endIndex + 1);
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
                        percentPaid: ((loanAmount - payment.balance) / loanAmount) * 100
                    });

                    // Stop if loan is paid off
                    if (payment.balance <= 0) break;
                }
            }

            // Store in STATE for chart access
            STATE.yearlyData = this.yearlyData;
        },

        setupSlider() {
            const slider = $('#year-range');

            if (slider && this.yearlyData.length > 0) {
                slider.min = '1';
                slider.max = this.yearlyData.length.toString();
                slider.value = '1';

                // Enhanced slider interaction
                slider.addEventListener('input', (e) => {
                    this.updateFromSlider(parseInt(e.target.value));
                });

                // Add touch/mouse interaction feedback
                slider.addEventListener('mousedown', () => {
                    slider.style.cursor = 'grabbing';
                });

                slider.addEventListener('mouseup', () => {
                    slider.style.cursor = 'grab';
                });
            }
        },

        updateFromSlider(year) {
            if (!this.yearlyData || year < 1 || year > this.yearlyData.length) return;

            const data = this.yearlyData[year - 1];
            if (!data) return;

            // Update year indicator
            const yearLabel = $('#year-label');
            if (yearLabel) {
                yearLabel.textContent = `Year ${year} of ${this.calculation.params.term}`;
            }

            // Update legend values with animation
            this.updateLegendValue('#remaining-balance-display', data.balance);
            this.updateLegendValue('#principal-paid-display', data.totalPrincipal);
            this.updateLegendValue('#interest-paid-display', data.totalInterest);

            // Update chart highlight
            if (STATE.chart) {
                ChartManager.updateHighlight(year);
            }

            // Update year details
            const yearDetails = $('.current-year');
            if (yearDetails) {
                const percentComplete = ((year / this.calculation.params.term) * 100).toFixed(1);
                yearDetails.textContent = `${percentComplete}% of loan term completed`;
            }

            // Announce to screen reader
            Utils.announceToScreenReader(
                `Year ${year}: Remaining balance ${Utils.formatCurrency(data.balance)}, Principal paid ${Utils.formatCurrency(data.totalPrincipal)}, Interest paid ${Utils.formatCurrency(data.totalInterest)}`
            );
        },

        updateLegendValue(selector, value) {
            const element = $(selector);
            if (!element) return;

            // Add smooth transition
            element.style.transition = 'all 0.3s ease';
            element.style.transform = 'scale(1.05)';
            element.textContent = Utils.formatCurrency(value);

            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 300);
        }
    };

    // ===== ENHANCED CHART MANAGER WITH PERFECT YEAR HIGHLIGHTING =====
    const ChartManager = {
        render(calculation) {
            const ctx = $('#mortgage-chart');
            if (!ctx) return;

            // Destroy existing chart
            if (STATE.chart) {
                STATE.chart.destroy();
            }

            const yearlyData = STATE.yearlyData || [];
            if (yearlyData.length === 0) return;

            const years = yearlyData.map(d => d.year);
            const balanceData = yearlyData.map(d => d.balance);
            const principalData = yearlyData.map(d => d.totalPrincipal);
            const interestData = yearlyData.map(d => d.totalInterest);

            STATE.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: years,
                    datasets: [{
                        label: 'Remaining Balance',
                        data: balanceData,
                        borderColor: 'var(--chart-balance)',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 8,
                        pointBackgroundColor: 'var(--chart-balance)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }, {
                        label: 'Principal Paid',
                        data: principalData,
                        borderColor: 'var(--chart-principal)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 8,
                        pointBackgroundColor: 'var(--chart-principal)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }, {
                        label: 'Interest Paid',
                        data: interestData,
                        borderColor: 'var(--chart-interest)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 8,
                        pointBackgroundColor: 'var(--chart-interest)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 1000,
                        easing: 'easeInOutQuart'
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: {
                            display: false // We have custom legend
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: 'var(--color-primary)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: true,
                            callbacks: {
                                title: (items) => `Year ${items[0].label}`,
                                label: (item) => {
                                    const value = Utils.formatCurrency(item.raw);
                                    return `${item.dataset.label}: ${value}`;
                                },
                                afterBody: (items) => {
                                    if (items.length > 0) {
                                        const year = parseInt(items[0].label);
                                        const data = STATE.yearlyData[year - 1];
                                        if (data) {
                                            return [
                                                '',
                                                `Year ${year} payments:`,
                                                `Principal: ${Utils.formatCurrency(data.yearPrincipal || 0)}`,
                                                `Interest: ${Utils.formatCurrency(data.yearInterest || 0)}`
                                            ];
                                        }
                                    }
                                    return [];
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Year',
                                color: 'var(--text-secondary)',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            },
                            ticks: {
                                color: 'var(--text-secondary)',
                                font: {
                                    size: 12
                                }
                            },
                            grid: {
                                color: 'var(--chart-grid)',
                                lineWidth: 1
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Amount ($)',
                                color: 'var(--text-secondary)',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            },
                            ticks: {
                                color: 'var(--text-secondary)',
                                font: {
                                    size: 12
                                },
                                callback: function(value) {
                                    return Utils.formatCurrency(value, 0);
                                }
                            },
                            grid: {
                                color: 'var(--chart-grid)',
                                lineWidth: 1
                            }
                        }
                    },
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const elementIndex = elements[0].index;
                            const year = elementIndex + 1;

                            // Update slider position
                            const slider = $('#year-range');
                            if (slider) {
                                slider.value = year;
                            }

                            // Update display
                            YearSliderManager.updateFromSlider(year);
                        }
                    }
                }
            });

            // Initial highlight at year 1
            this.updateHighlight(1);
        },

        updateHighlight(year) {
            if (!STATE.chart || !STATE.yearlyData) return;

            const yearIndex = year - 1;
            if (yearIndex < 0 || yearIndex >= STATE.yearlyData.length) return;

            // Remove existing highlight line
            if (STATE.chartHighlightLine) {
                STATE.chart.data.datasets = STATE.chart.data.datasets.filter(
                    dataset => dataset.label !== 'Current Year'
                );
            }

            // Add vertical line at current year
            const highlightData = new Array(STATE.yearlyData.length).fill(null);
            const maxValue = Math.max(...STATE.chart.data.datasets[0].data);
            highlightData[yearIndex] = maxValue;

            STATE.chartHighlightLine = {
                label: 'Current Year',
                data: highlightData,
                borderColor: 'rgba(13, 148, 136, 0.8)',
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                borderWidth: 3,
                borderDash: [5, 5],
                fill: false,
                pointRadius: 8,
                pointHoverRadius: 12,
                pointBackgroundColor: 'var(--color-primary)',
                pointBorderColor: '#fff',
                pointBorderWidth: 3,
                tension: 0
            };

            STATE.chart.data.datasets.push(STATE.chartHighlightLine);

            // Update chart with animation
            STATE.chart.update('active');

            // Flash the point briefly
            setTimeout(() => {
                const meta = STATE.chart.getDatasetMeta(STATE.chart.data.datasets.length - 1);
                const point = meta.data[yearIndex];
                if (point) {
                    point.options.pointRadius = 12;
                    STATE.chart.update('none');

                    setTimeout(() => {
                        point.options.pointRadius = 8;
                        STATE.chart.update('none');
                    }, 200);
                }
            }, 100);
        }
    };

    // ===== MORTGAGE CALCULATOR CORE =====
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
            $$('input[type="text"], input[type="number"]').forEach(input => {
                input.addEventListener('input', (e) => {
                    if (e.target.type === 'text' && !['custom-term', 'property-state'].includes(e.target.id)) {
                        this.formatNumberInput(e.target);
                    }

                    // Enhanced functionality based on field
                    if (e.target.id === 'home-price') {
                        this.updateInsurance();
                        DownPaymentControl.syncFromAmount();
                        this.updatePropertyTax();
                    } else if (e.target.id === 'down-payment') {
                        DownPaymentControl.syncFromAmount();
                        this.updatePMIStatus();
                    } else if (e.target.id === 'down-payment-percent') {
                        DownPaymentControl.syncFromPercent();
                        this.updatePMIStatus();
                    }

                    debouncedCalculate();
                });
            });

            // Suggestion chip listeners
            $$('.suggestion-chip').forEach(chip => {
                chip.addEventListener('click', (e) => {
                    const value = e.target.dataset.value;
                    const inputId = e.target.dataset.input;
                    const input = $('#' + inputId);

                    if (input && value) {
                        input.value = Utils.formatNumber(value);
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
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

            // State selection
            $('#property-state')?.addEventListener('change', () => {
                this.updatePropertyTax();
                debouncedCalculate();
            });

            // Action button listeners
            $('#calculate-btn')?.addEventListener('click', () => this.calculate());
            $('#reset-form')?.addEventListener('click', () => this.resetForm());
            $('#share-btn')?.addEventListener('click', () => this.shareResults());
            $('#pdf-download-btn')?.addEventListener('click', () => this.downloadPDF());
            $('#print-btn')?.addEventListener('click', () => this.printResults());
        },

        populateStates() {
            const stateSelect = $('#property-state');
            if (!stateSelect) return;

            // Add US states
            const states = [
                { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
                { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
                { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
                { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
                { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
                { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
                { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
                { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
                { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
                { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
                { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
                { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
                { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
                { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
                { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
                { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
                { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
            ];

            states.forEach(state => {
                const option = document.createElement('option');
                option.value = state.code;
                option.textContent = state.name;
                stateSelect.appendChild(option);
            });

            // Default to California
            stateSelect.value = 'CA';
        },

        setInitialValues() {
            // Set default insurance based on home price
            this.updateInsurance();
            this.updatePropertyTax();
            this.updatePMIStatus();
        },

        updateInsurance() {
            const homePrice = Utils.parseNumber($('#home-price').value);
            const insuranceField = $('#home-insurance');

            if (homePrice > 0 && insuranceField && (!insuranceField.value || Utils.parseNumber(insuranceField.value) === 0)) {
                const defaultInsurance = homePrice * CONFIG.defaultInsuranceRate;
                insuranceField.value = Utils.formatNumber(Math.round(defaultInsurance));
            }
        },

        updatePropertyTax() {
            const homePrice = Utils.parseNumber($('#home-price').value);
            const state = $('#property-state').value;
            const taxField = $('#property-tax');
            const taxRateDisplay = $('#tax-rate-display');

            if (homePrice > 0 && state && STATE_TAX_RATES[state]) {
                const taxRate = STATE_TAX_RATES[state];
                const taxAmount = (homePrice * taxRate) / 100;

                if (taxField) {
                    taxField.value = Utils.formatNumber(Math.round(taxAmount));
                }

                if (taxRateDisplay) {
                    taxRateDisplay.textContent = `${taxRate}% of home value`;
                }
            }
        },

        updatePMIStatus() {
            const homePrice = Utils.parseNumber($('#home-price').value);
            const downPayment = Utils.parseNumber($('#down-payment').value);
            const pmiField = $('#pmi');
            const pmiHelp = $('#pmi-help');

            if (homePrice > 0 && downPayment >= 0) {
                const downPaymentPercent = (downPayment / homePrice) * 100;
                const pmiAmount = downPaymentPercent < 20 ? (homePrice - downPayment) * CONFIG.pmiRate / 12 : 0;

                if (pmiField) {
                    pmiField.value = Utils.formatNumber(Math.round(pmiAmount));
                }

                if (pmiHelp) {
                    if (downPaymentPercent < 20) {
                        pmiHelp.textContent = `Required: Down payment is ${downPaymentPercent.toFixed(1)}% (less than 20%)`;
                        pmiHelp.style.color = 'var(--color-orange-500)';
                    } else {
                        pmiHelp.textContent = 'Not required: Down payment is 20% or more';
                        pmiHelp.style.color = 'var(--color-green-500)';
                    }
                }
            }
        },

        formatNumberInput(input) {
            const value = Utils.parseNumber(input.value);
            if (value > 0) {
                input.value = Utils.formatNumber(value);
            }
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
            const pmi = Utils.parseNumber($('#pmi').value);
            const extraMonthly = Utils.parseNumber($('#extra-monthly').value);
            const extraOnetime = Utils.parseNumber($('#extra-onetime').value);

            return {
                homePrice, downPayment, rate, term, propertyTax, homeInsurance, pmi, extraMonthly, extraOnetime
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
                loanAmount, monthlyRate, numPayments, params.extraMonthly, params.extraOnetime
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
                params, loanAmount, monthlyPI, monthlyTax, monthlyInsurance, monthlyPMI,
                totalMonthlyPayment, totalInterest, totalCost, payoffDate, schedule,
                interestSavings, timeSavingsMonths, downPaymentPercent
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

            // Update chart loan amount display
            $('#chart-loan-amount').textContent = `Based on a ${Utils.formatCurrency(calc.params.homePrice)} mortgage`;
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

                preview.innerHTML = `Potential savings: <strong>${Utils.formatCurrency(calc.interestSavings)}</strong> in interest, pay off <strong>${timeText}</strong> sooner`;
                preview.style.display = 'block';
                preview.style.color = 'var(--color-green-500)';
            } else {
                preview.style.display = 'none';
            }
        },

        resetForm() {
            // Reset form fields to defaults
            $('#home-price').value = '400,000';
            $('#down-payment').value = '80,000';
            $('#down-payment-percent').value = '20';
            $('#interest-rate').value = '6.75';
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
            $('#amount-input').style.display = 'flex';
            $('#percent-input').style.display = 'none';
            $('#amount-toggle')?.classList.add('active');
            $('#percent-toggle')?.classList.remove('active');

            // Update dependent fields
            this.updateInsurance();
            this.updatePropertyTax();
            this.updatePMIStatus();
            this.calculate();

            Utils.showToast('Form reset to default values', 'success');
            Utils.announceToScreenReader('Form reset to default values');
        },

        async shareResults() {
            if (!STATE.currentCalculation) {
                Utils.showToast('No calculation to share. Please calculate first.', 'warning');
                return;
            }

            const shareData = {
                title: 'My Mortgage Calculation Results',
                text: `Monthly Payment: ${Utils.formatCurrency(STATE.currentCalculation.totalMonthlyPayment)}, Loan Amount: ${Utils.formatCurrency(STATE.currentCalculation.loanAmount)}`,
                url: window.location.href
            };

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                    Utils.showToast('Results shared successfully!', 'success');
                } else {
                    // Fallback: copy to clipboard
                    await navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
                    Utils.showToast('Results copied to clipboard!', 'success');
                }
            } catch (err) {
                console.error('Share failed:', err);
                Utils.showToast('Unable to share results', 'error');
            }
        },

        async downloadPDF() {
            if (!STATE.currentCalculation) {
                Utils.showToast('No calculation to download. Please calculate first.', 'warning');
                return;
            }

            try {
                $('#loading-overlay').style.display = 'grid';
                Utils.showToast('Generating PDF...', 'info');

                // Simple PDF generation using window.print
                // In production, you'd use a proper PDF library
                setTimeout(() => {
                    window.print();
                    $('#loading-overlay').style.display = 'none';
                    Utils.showToast('PDF generation completed!', 'success');
                }, 1000);

            } catch (error) {
                console.error('PDF generation error:', error);
                $('#loading-overlay').style.display = 'none';
                Utils.showToast('Failed to generate PDF', 'error');
            }
        },

        printResults() {
            window.print();
            Utils.announceToScreenReader('Print dialog opened');
        }
    };

    // ===== AI INSIGHTS =====
    const AIInsights = {
        render(calculation) {
            const container = $('#ai-insights');
            if (!container) return;

            // Show loading initially
            this.showLoading(container);

            // Generate insights after a delay to simulate AI processing
            setTimeout(() => {
                this.generateInsights(container, calculation);
            }, 2000);
        },

        showLoading(container) {
            container.innerHTML = `
                <div class="insight-item info">
                    <i class="fas fa-brain insight-icon"></i>
                    <div>
                        <h5>Analyzing your loan...</h5>
                        <p>AI is calculating personalized recommendations based on your loan details.</p>
                    </div>
                </div>
            `;
        },

        generateInsights(container, calc) {
            const insights = this.calculateInsights(calc);

            container.innerHTML = insights.map(insight => `
                <div class="insight-item ${insight.type}">
                    <i class="fas fa-${insight.icon} insight-icon"></i>
                    <div>
                        <h5>${insight.title}</h5>
                        <p>${insight.description}</p>
                    </div>
                </div>
            `).join('');
        },

        calculateInsights(calc) {
            const insights = [];

            // PMI Insight
            if (calc.downPaymentPercent < 20) {
                insights.push({
                    type: 'warning',
                    icon: 'shield-alt',
                    title: 'Eliminate PMI',
                    description: `You're paying ${Utils.formatCurrency(calc.monthlyPMI * 12)} annually in PMI. Consider increasing your down payment to 20% to eliminate this cost.`
                });
            } else {
                insights.push({
                    type: 'success',
                    icon: 'check-circle',
                    title: 'No PMI Required!',
                    description: 'Great job! Your down payment is 20% or more, so you avoid Private Mortgage Insurance costs.'
                });
            }

            // Extra Payment Insight
            if (calc.params.extraMonthly === 0 && calc.params.extraOnetime === 0) {
                const extraPayment = Math.round(calc.monthlyPI * 0.1); // 10% of P&I
                insights.push({
                    type: 'info',
                    icon: 'lightbulb',
                    title: 'Accelerate Payoff',
                    description: `Adding just ${Utils.formatCurrency(extraPayment)}/month could save you thousands in interest and years of payments.`
                });
            } else {
                insights.push({
                    type: 'success',
                    icon: 'rocket',
                    title: 'Smart Extra Payments!',
                    description: `Your extra payments will save you ${Utils.formatCurrency(calc.interestSavings)} in interest over the life of the loan.`
                });
            }

            // Interest Rate Insight
            if (calc.params.rate > 7.0) {
                insights.push({
                    type: 'warning',
                    icon: 'percentage',
                    title: 'Consider Rate Shopping',
                    description: `Your ${calc.params.rate}% rate is above average. Shopping around could potentially save you money.`
                });
            } else if (calc.params.rate < 6.0) {
                insights.push({
                    type: 'success',
                    icon: 'star',
                    title: 'Excellent Rate!',
                    description: `Your ${calc.params.rate}% rate is very competitive in today's market.`
                });
            }

            // Loan Term Insight
            if (calc.params.term === 30) {
                insights.push({
                    type: 'info',
                    icon: 'clock',
                    title: '15-Year Alternative',
                    description: 'Consider a 15-year loan to save significantly on interest, though your monthly payment would be higher.'
                });
            }

            return insights.slice(0, 4); // Show max 4 insights
        }
    };

    // ===== AMORTIZATION TABLE =====
    const AmortizationTable = {
        render(calculation) {
            const tbody = $('#amortization-table tbody');
            if (!tbody) return;

            if (!calculation || !calculation.schedule || calculation.schedule.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Calculate mortgage to view schedule</td></tr>';
                return;
            }

            // Show first 12 payments by default
            const payments = calculation.schedule.slice(0, 12);

            tbody.innerHTML = payments.map(payment => `
                <tr>
                    <td>${payment.paymentNumber}</td>
                    <td>${payment.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</td>
                    <td>${Utils.formatCurrency(payment.payment)}</td>
                    <td>${Utils.formatCurrency(payment.principal)}</td>
                    <td>${Utils.formatCurrency(payment.interest)}</td>
                    <td>${Utils.formatCurrency(payment.balance)}</td>
                </tr>
            `).join('');
        }
    };

    // ===== INITIALIZATION =====
    const init = () => {
        try {
            // Initialize all components
            StatsUpdater.init();
            VoiceControl.init();
            AccessibilityControls.init();
            DownPaymentControl.init();
            TabControl.init();
            MortgageCalculator.init();

            console.log('AI-Enhanced Mortgage Calculator initialized successfully');
        } catch (error) {
            console.error('Initialization error:', error);
            Utils.showToast('Application failed to initialize properly', 'error');
        }
    };

    // Start the application
    init();
});
