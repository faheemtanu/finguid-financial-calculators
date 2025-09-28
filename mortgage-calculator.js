/**
 * World's First AI-Enhanced Mortgage Calculator - Complete JavaScript
 * Full-Featured Implementation with Voice Control, AI Insights, and Real Calculations
 * Version: 2.1 UI/UX Enhanced Edition
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // CONFIGURATION & STATE MANAGEMENT
    // ==========================================================================

    const CONFIG = {
        debounceDelay: 300,
        defaultInsuranceRate: 0.004, // 0.4% of home value annually
        calculationsUpdateInterval: 7000,
        savingsUpdateInterval: 9000,
        voiceTimeout: 15000,
        maxSliderYear: 30,
        pmiRate: 0.005, // 0.5% annually
        apiUpdateInterval: 15 * 60 * 1000, // 15 minutes
        paymentsPerPage: 12,
    };

    const STATE = {
        chart: null,
        yearlyData: [],
        currentCalculation: null,
        globalVoiceRecognition: null,
        isGlobalListening: false,
        currentFontSize: 100,
        theme: 'light',
        screenReaderActive: false,
        calculationsToday: 12847,
        avgSavings: 45000,
        currentPage: 1,
        totalPages: 1,
        amortizationData: [],
        marketRates: { "30yr": 6.75, "15yr": 6.25, "arm": 5.95 },
        lastUpdated: new Date(),
        savedCalculations: []
    };

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
                style: 'currency', currency: 'USD',
                minimumFractionDigits: decimals, maximumFractionDigits: decimals
            }).format(Math.abs(amount));
        },
        formatNumber: (num) => {
            if (num === null || num === undefined || isNaN(num)) return '0';
            return new Intl.NumberFormat('en-US').format(num);
        },
        parseNumber: (str) => {
            if (!str || typeof str !== 'string') str = String(str || '0');
            const cleaned = str.replace(/[^\d.-]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : Math.abs(parsed);
        },
        debounce: (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => { clearTimeout(timeout); func.apply(this, args); };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        generateId: () => Date.now().toString(36) + Math.random().toString(36).substring(2),
        formatDate: (date) => new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(date),
        updateDateTime: () => {
            const now = new Date();
            const dateTimeString = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(now);
            const elements = Utils.$$('.rate-update');
            elements.forEach(el => el.textContent = `Updated ${dateTimeString}`);
        },
        $: (selector) => document.querySelector(selector),
        $$: (selector) => document.querySelectorAll(selector),
        showToast: (message, type = 'info') => {
            const container = Utils.$('#toast-container'); if (!container) return;
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            const iconMap = { 'success': 'check-circle', 'error': 'exclamation-triangle', 'warning': 'exclamation-circle', 'info': 'info-circle' };
            toast.innerHTML = `<i class="fas fa-${iconMap[type] || 'info-circle'}"></i><span>${message}</span>`;
            container.appendChild(toast);
            setTimeout(() => {
                toast.style.animation = 'toast-out 0.3s ease forwards';
                setTimeout(() => toast.remove(), 300);
            }, 5000);
        },
        announceToScreenReader: (message) => {
            const announcements = Utils.$('#sr-announcements');
            if (announcements) { announcements.textContent = message; }
        },
        showLoading: (show = true) => {
            const overlay = Utils.$('#loading-overlay');
            if (overlay) overlay.style.display = show ? 'flex' : 'none';
        }
    };

    // ==========================================================================
    // DYNAMIC STATISTICS UPDATER
    // ==========================================================================

    const StatsUpdater = {
        init() {
            this.updateCalculationsCounter(); this.updateSavingsCounter();
            setInterval(() => this.updateCalculationsCounter(), CONFIG.calculationsUpdateInterval);
            setInterval(() => this.updateSavingsCounter(), CONFIG.savingsUpdateInterval);
            setInterval(() => this.updateMarketRates(), CONFIG.apiUpdateInterval);
            Utils.updateDateTime(); setInterval(Utils.updateDateTime, 60000);
        },
        updateCalculationsCounter() {
            STATE.calculationsToday += Math.floor(Math.random() * 20) + 8;
            const el = Utils.$('#calc-count');
            if (el) el.textContent = Utils.formatNumber(STATE.calculationsToday);
        },
        updateSavingsCounter() {
            STATE.avgSavings += Math.floor(Math.random() * 2500) + 750;
            const el = Utils.$('#avg-savings');
            if (el) el.textContent = '$' + Math.floor(STATE.avgSavings / 1000) + 'K';
        },
        updateMarketRates() {
            Object.keys(STATE.marketRates).forEach(rateType => {
                const variation = (Math.random() - 0.5) * 0.2;
                const newRate = Math.max(4.0, Math.min(9.0, STATE.marketRates[rateType] + variation));
                STATE.marketRates[rateType] = Math.round(newRate * 100) / 100;
            });
            const rate30El = Utils.$('#market-30yr'), rate15El = Utils.$('#market-15yr'), rateArmEl = Utils.$('#market-arm');
            if (rate30El) rate30El.textContent = STATE.marketRates["30yr"].toFixed(2) + '%';
            if (rate15El) rate15El.textContent = STATE.marketRates["15yr"].toFixed(2) + '%';
            if (rateArmEl) rateArmEl.textContent = STATE.marketRates["arm"].toFixed(2) + '%';
            STATE.lastUpdated = new Date(); Utils.updateDateTime();
        }
    };

    // ==========================================================================
    // GLOBAL VOICE CONTROL
    // ==========================================================================

    const GlobalVoiceControl = {
        init() {
            if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
                console.warn('Speech recognition not supported');
                this.disableVoiceControls(); return;
            }
            this.setupSpeechRecognition(); this.bindEvents();
        },
        disableVoiceControls() {
            Utils.$$('#voice-toggle, #voice-input, #voice-demo').forEach(btn => {
                if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
            });
        },
        setupSpeechRecognition() {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            STATE.globalVoiceRecognition = new SpeechRecognition();
            STATE.globalVoiceRecognition.continuous = true;
            STATE.globalVoiceRecognition.interimResults = false;
            STATE.globalVoiceRecognition.lang = 'en-US';
            STATE.globalVoiceRecognition.onstart = () => this.onStart();
            STATE.globalVoiceRecognition.onresult = (e) => this.onResult(e);
            STATE.globalVoiceRecognition.onerror = (e) => this.onError(e);
            STATE.globalVoiceRecognition.onend = () => this.onEnd();
        },
        bindEvents() {
            Utils.$('#voice-toggle')?.addEventListener('click', () => this.toggle());
            Utils.$('#voice-demo')?.addEventListener('click', () => this.startDemo());
            Utils.$('#voice-input')?.addEventListener('click', () => this.startLocalInput());
        },
        toggle() { STATE.isGlobalListening ? this.stop() : this.start(); },
        start() {
            if (!STATE.globalVoiceRecognition || STATE.isGlobalListening) return;
            try { STATE.globalVoiceRecognition.start(); Utils.announceToScreenReader('Global voice control activated'); }
            catch (e) { console.error('Voice start error:', e); Utils.showToast('Voice recognition failed', 'error'); }
        },
        stop() {
            if (STATE.globalVoiceRecognition && STATE.isGlobalListening) STATE.globalVoiceRecognition.stop();
        },
        startDemo() {
            this.start(); setTimeout(() => Utils.showToast('Try: "Set home price to 500 thousand"', 'info'), 1000);
        },
        startLocalInput() { this.start(); Utils.showToast('Listening for mortgage details...', 'info'); },
        onStart() { STATE.isGlobalListening = true; this.updateVoiceUI(true); },
        onResult(event) {
            const lastResult = event.results[event.results.length - 1];
            if (lastResult.isFinal) {
                const transcript = lastResult[0].transcript.toLowerCase().trim();
                Utils.$('#voice-text').textContent = `Heard: "${transcript}"`;
                setTimeout(() => this.processCommand(transcript), 500);
            }
        },
        onError(event) {
            const errorMessages = { 'no-speech': 'No speech detected.', 'audio-capture': 'Microphone not accessible.', 'not-allowed': 'Microphone access denied.' };
            Utils.showToast(errorMessages[event.error] || `Voice error: ${event.error}`, 'error');
            this.stop();
        },
        onEnd() { STATE.isGlobalListening = false; this.updateVoiceUI(false); },
        updateVoiceUI(isListening) {
            Utils.$('#voice-toggle')?.classList.toggle('active', isListening);
            const statusEl = Utils.$('#voice-status');
            if (statusEl) {
                statusEl.style.display = isListening ? 'flex' : 'none';
                if(isListening) Utils.$('#voice-text').textContent = "Listening...";
            }
        },
        processCommand(command) {
            console.log('Processing voice command:', command);
            if (this.handleNavigationCommands(command)) return;
            if (this.handleAccessibilityCommands(command)) return;
            if (this.handleCalculatorCommands(command)) return;
            if (this.handleFieldCommands(command)) return;
            Utils.showToast(`Command "${command}" not recognized.`, 'info');
        },
        handleNavigationCommands(command) {
            const nav = { 'chart': 'chart', 'insights': 'insights', 'schedule': 'amortization', 'amortization': 'amortization' };
            for (const [key, val] of Object.entries(nav)) {
                if (command.includes(key)) { MortgageCalculator.switchTab(val); return true; }
            }
            return false;
        },
        handleAccessibilityCommands(command) {
            if (command.includes('dark')) { AccessibilityControls.setTheme('dark'); return true; }
            if (command.includes('light')) { AccessibilityControls.setTheme('light'); return true; }
            if (command.includes('increase') || command.includes('bigger')) { AccessibilityControls.adjustFontSize(10); return true; }
            if (command.includes('decrease') || command.includes('smaller')) { AccessibilityControls.adjustFontSize(-10); return true; }
            return false;
        },
        handleCalculatorCommands(command) {
            if (command.includes('calculate') || command.includes('compute')) { MortgageCalculator.calculate(); return true; }
            if (command.includes('reset')) { MortgageCalculator.resetForm(); return true; }
            if (command.includes('save')) { MortgageCalculator.saveCalculation(); return true; }
            return false;
        },
        handleFieldCommands(command) {
            const numMatch = command.match(/(\d{1,3}(?:,\d{3})*|\d+)\s*(?:thousand|k)?/);
            const value = numMatch ? parseFloat(numMatch[1].replace(/,/g, '')) * ((numMatch[0].includes('thousand') || numMatch[0].includes('k')) ? 1000 : 1) : null;
            
            const rateMatch = command.match(/([\d.]+)\s*percent/);
            const rateValue = rateMatch ? parseFloat(rateMatch[1]) : null;

            const termMatch = command.match(/(\d+)\s*year/);
            const termValue = termMatch ? parseInt(termMatch[1]) : null;

            if (command.includes('home price') && value) { this.updateField('home-price', value); return true; }
            if (command.includes('down payment') && value) { this.updateField('down-payment', value); return true; }
            if (command.includes('interest rate') && rateValue) { this.updateField('interest-rate', rateValue); return true; }
            if (command.includes('loan term') && termValue) { this.updateField('loan-term', termValue); return true; }
            return false;
        },
        updateField(fieldId, value) {
            const field = Utils.$('#' + fieldId);
            if (!field) return;
            if (fieldId === 'loan-term') {
                Utils.$$('.term-chip').forEach(c => c.classList.remove('active'));
                const chip = Utils.$(`[data-term="${value}"]`);
                if(chip) chip.classList.add('active');
                field.value = value;
            } else if (fieldId === 'interest-rate'){
                field.value = value.toString();
            } else {
                field.value = Utils.formatNumber(value);
            }
            field.dispatchEvent(new Event('input', { bubbles: true }));
            Utils.showToast(`${field.previousElementSibling.textContent} set to ${field.value}`, 'success');
        }
    };

    // ==========================================================================
    // ACCESSIBILITY CONTROLS
    // ==========================================================================

    const AccessibilityControls = {
        init() { this.bindEvents(); this.loadSavedSettings(); },
        bindEvents() {
            Utils.$('#font-smaller')?.addEventListener('click', () => this.adjustFontSize(-10));
            Utils.$('#font-larger')?.addEventListener('click', () => this.adjustFontSize(10));
            Utils.$('#theme-toggle')?.addEventListener('click', () => this.toggleTheme());
            Utils.$('#screen-reader-toggle')?.addEventListener('click', () => this.toggleScreenReader());
        },
        loadSavedSettings() {
            this.setTheme(localStorage.getItem('mortgageCalc_theme') || 'light');
            STATE.currentFontSize = parseInt(localStorage.getItem('mortgageCalc_fontSize') || '100');
            document.documentElement.style.fontSize = STATE.currentFontSize + '%';
            STATE.screenReaderActive = localStorage.getItem('mortgageCalc_screenReader') === 'true';
            this.updateScreenReaderButton();
        },
        adjustFontSize(change) {
            STATE.currentFontSize = Math.max(80, Math.min(150, STATE.currentFontSize + change));
            document.documentElement.style.fontSize = STATE.currentFontSize + '%';
            localStorage.setItem('mortgageCalc_fontSize', STATE.currentFontSize);
        },
        toggleTheme() { this.setTheme(STATE.theme === 'light' ? 'dark' : 'light'); },
        setTheme(theme) {
            STATE.theme = theme;
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('mortgageCalc_theme', theme);
            this.updateThemeButton();
            if (STATE.chart) ChartManager.render(STATE.currentCalculation); // Re-render chart for theme
        },
        updateThemeButton() {
            const btn = Utils.$('#theme-toggle');
            const icon = Utils.$('#theme-icon');
            const span = btn?.querySelector('span');
            if(icon) icon.className = `fa-solid fa-${STATE.theme === 'light' ? 'moon' : 'sun'}`;
            if(span) span.textContent = `${STATE.theme === 'light' ? 'Dark' : 'Light'} Mode`;
        },
        toggleScreenReader() {
            STATE.screenReaderActive = !STATE.screenReaderActive;
            localStorage.setItem('mortgageCalc_screenReader', STATE.screenReaderActive);
            this.updateScreenReaderButton();
            Utils.showToast(`Screen reader enhancements ${STATE.screenReaderActive ? 'enabled' : 'disabled'}`, 'success');
        },
        updateScreenReaderButton() {
            Utils.$('#screen-reader-toggle')?.classList.toggle('active', STATE.screenReaderActive);
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
            Utils.$$('input[type="text"], input[type="checkbox"], select').forEach(el => {
                el.addEventListener('input', () => { this.handleInputChange(el); debouncedCalculate(); });
            });
            Utils.$$('input[type="text"]').forEach(input => {
                input.addEventListener('blur', (e) => this.formatInputValue(e.target));
            });
            Utils.$$('.suggestion-chip').forEach(c => c.addEventListener('click', e => this.handleSuggestionChip(e.target)));
            Utils.$$('.term-chip').forEach(c => c.addEventListener('click', e => { this.handleTermSelection(e.target); debouncedCalculate(); }));
            Utils.$('#amount-toggle')?.addEventListener('click', () => this.switchDownPaymentMode('amount'));
            Utils.$('#percent-toggle')?.addEventListener('click', () => this.switchDownPaymentMode('percent'));
            Utils.$$('.tab-btn').forEach(btn => btn.addEventListener('click', (e) => this.switchTab(e.currentTarget.dataset.tab)));
            Utils.$('#year-range')?.addEventListener('input', e => YearSliderManager.updateFromSlider(parseInt(e.target.value)));
            Utils.$('#calculate-btn')?.addEventListener('click', () => this.calculate());
            Utils.$('#reset-form')?.addEventListener('click', () => this.resetForm());
            Utils.$('#save-calculation')?.addEventListener('click', () => this.saveCalculation());
            Utils.$('#compare-btn')?.addEventListener('click', () => this.showComparison());
            Utils.$('#scroll-to-calculator')?.addEventListener('click', () => Utils.$('#main-content').scrollIntoView({ behavior: 'smooth' }));
            Utils.$('#share-btn')?.addEventListener('click', () => this.shareResults());
            Utils.$('#pdf-download-btn')?.addEventListener('click', () => this.downloadPDF());
            Utils.$('#print-btn')?.addEventListener('click', () => window.print());
        },
    
        handleInputChange(input) {
            const id = input.id;
            switch(id) {
                case 'home-price':
                    this.syncDownPayment('amount');
                    this.updateDependentCosts();
                    break;
                case 'down-payment': this.syncDownPayment('amount'); this.updatePMIStatus(); break;
                case 'down-payment-percent': this.syncDownPayment('percent'); this.updatePMIStatus(); break;
                case 'interest-rate': this.updateRateStatus(Utils.parseNumber(input.value)); break;
                case 'property-state': this.updatePropertyTax(); break;
            }
        },
    
        formatInputValue(input) {
            if (!input.id.includes('percent') && !input.id.includes('rate')) {
                const value = Utils.parseNumber(input.value);
                input.value = Utils.formatNumber(value);
            }
        },

        updateDependentCosts() {
            this.updateInsurance();
            this.updatePropertyTax();
        },

        populateStates() {
            const stateSelect = Utils.$('#property-state'); if (!stateSelect) return;
            const states = [ 'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
            states.forEach(state => {
                const option = document.createElement('option');
                option.value = state; option.textContent = state;
                stateSelect.appendChild(option);
            });
            stateSelect.value = 'CA';
        },
    
        setInitialValues() {
            const rate = STATE.marketRates["30yr"] || 6.75;
            Utils.$('#interest-rate').value = rate.toFixed(2);
            this.updateDependentCosts();
            this.updatePMIStatus();
            this.updateRateStatus(rate);
        },

        switchDownPaymentMode(mode) {
            const amountInput = Utils.$('#amount-input'), percentInput = Utils.$('#percent-input');
            const amountToggle = Utils.$('#amount-toggle'), percentToggle = Utils.$('#percent-toggle');
            if (mode === 'amount') {
                amountInput.style.display = 'flex'; percentInput.style.display = 'none';
                amountToggle.classList.add('active'); percentToggle.classList.remove('active');
            } else {
                amountInput.style.display = 'none'; percentInput.style.display = 'flex';
                amountToggle.classList.remove('active'); percentToggle.classList.add('active');
            }
        },
    
        handleTermSelection(chip) {
            Utils.$$('.term-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            Utils.$('#loan-term').value = chip.dataset.term;
        },
    
        switchTab(tabName) {
            if (!tabName) return;
            Utils.$$('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
            Utils.$$('.tab-content').forEach(content => content.classList.toggle('active', content.id === tabName));
            Utils.announceToScreenReader(`Switched to ${tabName} tab`);
        },
    
        updateInsurance() {
            const homePrice = Utils.parseNumber(Utils.$('#home-price').value);
            const insuranceInput = Utils.$('#home-insurance');
            if (homePrice > 0 && insuranceInput) {
                const recommended = Math.round(homePrice * CONFIG.defaultInsuranceRate);
                if (Utils.parseNumber(insuranceInput.value) === 0) {
                     insuranceInput.value = Utils.formatNumber(recommended);
                }
            }
        },
    
        syncDownPayment(source) {
            const homePrice = Utils.parseNumber(Utils.$('#home-price').value);
            const dpAmountEl = Utils.$('#down-payment'), dpPercentEl = Utils.$('#down-payment-percent');
            if (homePrice <= 0) return;
    
            if (source === 'amount') {
                const amount = Utils.parseNumber(dpAmountEl.value);
                const percent = Math.min(100, (amount / homePrice) * 100);
                dpPercentEl.value = isNaN(percent) ? 0 : percent.toFixed(1);
            } else {
                const percent = Math.max(0, Math.min(100, Utils.parseNumber(dpPercentEl.value)));
                const amount = (homePrice * percent) / 100;
                dpAmountEl.value = Utils.formatNumber(Math.round(amount));
            }
            this.updatePMIStatus();
        },
    
        updatePMIStatus() {
            const homePrice = Utils.parseNumber(Utils.$('#home-price').value);
            const downPayment = Utils.parseNumber(Utils.$('#down-payment').value);
            const pmiInput = Utils.$('#pmi'), pmiStatus = Utils.$('#pmi-status'), pmiWarning = Utils.$('#pmi-warning');
            if (homePrice <= 0) return;
    
            const downPaymentPercent = (downPayment / homePrice) * 100;
            const loanAmount = homePrice - downPayment;
    
            if (downPaymentPercent < 20 && loanAmount > 0) {
                const monthlyPMI = Math.round((loanAmount * CONFIG.pmiRate) / 12);
                pmiInput.value = Utils.formatNumber(monthlyPMI);
                pmiStatus.textContent = `PMI may be required (${downPaymentPercent.toFixed(1)}% down).`;
                pmiWarning.style.display = 'flex';
            } else {
                pmiInput.value = '0';
                pmiStatus.textContent = 'No PMI required (20%+ down).';
                pmiWarning.style.display = 'none';
            }
        },
    
        updatePropertyTax() {
            const state = Utils.$('#property-state').value;
            const homePrice = Utils.parseNumber(Utils.$('#home-price').value);
            const taxInput = Utils.$('#property-tax');
            const taxHelp = Utils.$('#tax-help');

            if (state && homePrice > 0 && STATE_TAX_RATES[state] && taxInput) {
                const taxRate = STATE_TAX_RATES[state];
                const annualTax = Math.round(homePrice * (taxRate / 100));
                
                if (Utils.parseNumber(taxInput.value) === 0) {
                    taxInput.value = Utils.formatNumber(annualTax);
                }
                if(taxHelp) taxHelp.textContent = `Est. for ${state}: ${taxRate}% of home value.`;
            } else if (taxHelp) {
                taxHelp.textContent = '';
            }
        },

        updateRateStatus(rate) {
            const rateStatus = Utils.$('#rate-status'); if (!rateStatus || isNaN(rate)) return;
            const marketAvg = STATE.marketRates["30yr"] || 6.75;
            const diff = rate - marketAvg;
            let status = 'Market Avg', className = '';
            if (diff > 0.5) { status = 'Above Market'; className = 'rate-high'; }
            else if (diff < -0.5) { status = 'Below Market'; className = 'rate-low'; }
            rateStatus.textContent = status;
            rateStatus.className = `input-adornment rate-adornment ${className}`;
        },
    
        calculate() {
            try {
                Utils.showLoading(true);
                const params = this.getCalculationParams();
                if (!this.validateParams(params)) { Utils.showLoading(false); return; }
                const result = this.performCalculation(params);
                if (!result) { Utils.showLoading(false); return; }
                STATE.currentCalculation = result;
                this.updateResults(result);
                ChartManager.render(result);
                YearSliderManager.init(result);
                AIInsights.render(result);
                AmortizationTable.render(result);
                Utils.announceToScreenReader('Mortgage calculation completed.');
                setTimeout(() => Utils.showLoading(false), 300);
            } catch (error) {
                console.error('Calculation error:', error);
                Utils.showToast('Error in calculation. Please check inputs.', 'error');
                Utils.showLoading(false);
            }
        },
    
        getCalculationParams: () => ({
            homePrice: Utils.parseNumber(Utils.$('#home-price').value),
            downPayment: Utils.parseNumber(Utils.$('#down-payment').value),
            rate: Utils.parseNumber(Utils.$('#interest-rate').value),
            term: parseInt(Utils.$('#loan-term').value),
            propertyTax: Utils.parseNumber(Utils.$('#property-tax').value),
            homeInsurance: Utils.parseNumber(Utils.$('#home-insurance').value),
            pmi: Utils.parseNumber(Utils.$('#pmi').value),
            extraMonthly: Utils.parseNumber(Utils.$('#extra-monthly').value),
            extraOnetime: Utils.parseNumber(Utils.$('#extra-onetime').value),
            biWeekly: Utils.$('#bi-weekly').checked
        }),
    
        validateParams(params) {
            if (params.homePrice <= 0) { Utils.showToast('Enter a valid home price', 'error'); return false; }
            if (params.rate <= 0 || params.rate > 25) { Utils.showToast('Enter a valid interest rate', 'error'); return false; }
            if (params.downPayment >= params.homePrice) { Utils.showToast('Down payment must be less than home price', 'error'); return false; }
            return true;
        },
    
        performCalculation(params) {
            const loanAmount = params.homePrice - params.downPayment;
            if (loanAmount <= 0) { Utils.showToast('Loan amount is zero or less', 'info'); return null; }
            const schedule = this.generateAmortizationSchedule(loanAmount, params.rate / 100, params.term, params.extraMonthly, params.extraOnetime, params.biWeekly);
            if (schedule.length === 0) return null;
            const monthlyPI = schedule[0]?.payment || 0;
            const monthlyTax = params.propertyTax / 12;
            const monthlyInsurance = params.homeInsurance / 12;
            const monthlyPMI = params.pmi;
            const totalMonthlyPayment = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI;
            const totalInterest = schedule.reduce((sum, p) => sum + p.interest, 0);
            
            // For savings calculation
            const baseSchedule = this.generateAmortizationSchedule(loanAmount, params.rate / 100, params.term, 0, 0, false);
            const baseInterest = baseSchedule.reduce((sum, p) => sum + p.interest, 0);
            
            return {
                params, loanAmount, monthlyPI, monthlyTax, monthlyInsurance, monthlyPMI,
                totalMonthlyPayment, totalInterest, totalCost: loanAmount + totalInterest,
                payoffDate: new Date(schedule[schedule.length - 1].date),
                schedule,
                interestSavings: Math.max(0, baseInterest - totalInterest),
                timeSavingsMonths: Math.max(0, baseSchedule.length - schedule.length),
                downPaymentPercent: (params.downPayment / params.homePrice) * 100
            };
        },
    
        generateAmortizationSchedule(principal, annualRate, termYears, extraMonthly = 0, extraOnetime = 0, biWeekly = false) {
            const schedule = []; let balance = principal;
            const paymentsPerYear = biWeekly ? 26 : 12;
            const ratePerPeriod = annualRate / paymentsPerYear;
            const totalPayments = termYears * paymentsPerYear;
            if (ratePerPeriod <= 0) return []; // Avoid infinite loop on 0 interest
            
            const basePayment = principal * (ratePerPeriod * Math.pow(1 + ratePerPeriod, totalPayments)) / (Math.pow(1 + ratePerPeriod, totalPayments) - 1);
            if (isNaN(basePayment)) return [];

            const startDate = new Date();
            for (let i = 1; i <= totalPayments && balance > 0.01; i++) {
                const interest = balance * ratePerPeriod;
                let extra = extraMonthly;
                if (extraOnetime > 0 && ( (biWeekly && i===26) || (!biWeekly && i===12) )) extra += extraOnetime;
                
                let principalPayment = basePayment - interest + extra;
                if (balance < basePayment + extra) principalPayment = balance;
                balance -= principalPayment;
                
                const paymentDate = new Date(startDate);
                if(biWeekly) paymentDate.setDate(startDate.getDate() + (i - 1) * 14);
                else paymentDate.setMonth(startDate.getMonth() + i - 1);
                
                schedule.push({
                    paymentNumber: i, date: paymentDate,
                    payment: basePayment + extra, principal: principalPayment,
                    interest: interest, balance: Math.max(0, balance)
                });
            }
            return schedule;
        },
    
        updateResults(calc) {
            Utils.$('#total-payment').textContent = Utils.formatCurrency(calc.totalMonthlyPayment);
            Utils.$('#principal-interest').textContent = Utils.formatCurrency(calc.monthlyPI);
            Utils.$('#monthly-tax').textContent = Utils.formatCurrency(calc.monthlyTax);
            Utils.$('#monthly-insurance').textContent = Utils.formatCurrency(calc.monthlyInsurance);
            Utils.$('#monthly-pmi').textContent = Utils.formatCurrency(calc.monthlyPMI);
            Utils.$('#display-loan-amount').textContent = Utils.formatCurrency(calc.loanAmount);
            Utils.$('#display-total-interest').textContent = Utils.formatCurrency(calc.totalInterest);
            Utils.$('#display-total-cost').textContent = Utils.formatCurrency(calc.totalCost);
            Utils.$('#display-payoff-date').textContent = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(calc.payoffDate);
            Utils.$('#chart-loan-amount').textContent = `Based on a ${Utils.formatCurrency(calc.loanAmount)} mortgage`;
            
            if (calc.interestSavings > 0) {
                const years = Math.floor(calc.timeSavingsMonths / 12);
                const months = calc.timeSavingsMonths % 12;
                let timeText = (years > 0 ? `${years}y ` : '') + (months > 0 ? `${months}m` : '');
                Utils.$('#savings-preview').textContent = `Save ${Utils.formatCurrency(calc.interestSavings)} & payoff ${timeText} sooner!`;
            } else {
                 Utils.$('#savings-preview').textContent = 'Add extra payments to see potential savings.';
            }

            this.updateBreakdownBars(calc);
        },
    
        updateBreakdownBars(calc) {
            const total = calc.totalMonthlyPayment; if (total <= 0) return;
            const p = {
                pi: (calc.monthlyPI / total) * 100, tax: (calc.monthlyTax / total) * 100,
                insurance: (calc.monthlyInsurance / total) * 100, pmi: (calc.monthlyPMI / total) * 100
            };
            Utils.$('#pi-fill').style.width = `${p.pi}%`; Utils.$('#tax-fill').style.width = `${p.tax}%`;
            Utils.$('#insurance-fill').style.width = `${p.insurance}%`; Utils.$('#pmi-fill').style.width = `${p.pmi}%`;
        },
    
        resetForm() {
            Utils.$('#mortgage-form').reset();
            this.setInitialValues();
            this.switchDownPaymentMode('amount');
            Utils.$$('.term-chip').forEach(c => c.classList.toggle('active', c.dataset.term === '30'));
            Utils.$('#loan-term').value = '30';
            setTimeout(() => this.calculate(), 100);
            Utils.showToast('Form reset to default values', 'success');
        },
    
        saveCalculation() {
            if (!STATE.currentCalculation) { Utils.showToast('Calculate a mortgage first', 'info'); return; }
            const calcData = { id: Utils.generateId(), ...STATE.currentCalculation.params };
            STATE.savedCalculations.push(calcData);
            if(STATE.savedCalculations.length > 10) STATE.savedCalculations.shift();
            localStorage.setItem('mortgageCalculations', JSON.stringify(STATE.savedCalculations));
            Utils.showToast('Calculation saved successfully', 'success');
        },
    
        showComparison() { Utils.showToast('Comparison feature coming soon!', 'info'); },
        shareResults() {
            if (!STATE.currentCalculation) { Utils.showToast('Calculate a mortgage first', 'info'); return; }
            const text = `My Mortgage: ${Utils.formatCurrency(STATE.currentCalculation.totalMonthlyPayment)}/mo for a ${Utils.formatCurrency(STATE.currentCalculation.params.homePrice)} home.`;
            if (navigator.share) navigator.share({ title: 'My Mortgage Calculation', text, url: window.location.href });
            else { navigator.clipboard.writeText(text); Utils.showToast('Results copied to clipboard', 'success'); }
        },
        downloadPDF() { Utils.showToast('PDF download feature coming soon!', 'info'); },
    };
    
    // ==========================================================================
    // CHART MANAGER
    // ==========================================================================
    
    const ChartManager = {
        render(calculation) {
            if (!calculation || !calculation.schedule || typeof Chart === 'undefined') return;
            const ctx = Utils.$('#mortgage-timeline-chart')?.getContext('2d'); if (!ctx) return;
            if (STATE.chart) STATE.chart.destroy();
            
            STATE.yearlyData = this.prepareYearlyData(calculation.schedule, calculation.loanAmount);
            if (STATE.yearlyData.length === 0) return;
    
            const isDarkMode = STATE.theme === 'dark';
            const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
            const textColor = isDarkMode ? '#a1a1aa' : '#71717a';

            STATE.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: STATE.yearlyData.map(d => `Year ${d.year}`),
                    datasets: [
                        { label: 'Remaining Balance', data: STATE.yearlyData.map(d => d.balance), borderColor: '#37b5b5', backgroundColor: 'rgba(55, 181, 181, 0.1)', fill: true, tension: 0.4 },
                        { label: 'Principal Paid', data: STATE.yearlyData.map(d => d.principalPaid), borderColor: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.1)', fill: true, tension: 0.4 },
                        { label: 'Interest Paid', data: STATE.yearlyData.map(d => d.interestPaid), borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { color: textColor } },
                        y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, callback: v => Utils.formatCurrency(v, 0) } }
                    },
                    interaction: { mode: 'index', intersect: false },
                }
            });
            this.updateLegendValues(1);
        },
    
        prepareYearlyData(schedule, initialLoanAmount) {
            if (!schedule || schedule.length === 0) return [];
            const yearlyData = []; let currentYear = 1; let yearlyPrincipal = 0;
            let yearlyInterest = 0; let yearEndBalance = initialLoanAmount;
            const paymentsPerYear = schedule.length > 1 && (schedule[1].date.getTime() - schedule[0].date.getTime() < 20 * 24 * 60 * 60 * 1000) ? 26 : 12;

            schedule.forEach((payment, index) => {
                const paymentYear = Math.ceil((index + 1) / paymentsPerYear);
                if (paymentYear === currentYear) {
                    yearlyPrincipal += payment.principal; yearlyInterest += payment.interest; yearEndBalance = payment.balance;
                } else {
                    yearlyData.push({ year: currentYear, balance: yearEndBalance, principalPaid: yearlyPrincipal, interestPaid: yearlyInterest });
                    currentYear = paymentYear; yearlyPrincipal = payment.principal;
                    yearlyInterest = payment.interest; yearEndBalance = payment.balance;
                }
            });
            if (yearlyPrincipal > 0 || yearlyInterest > 0) {
                 yearlyData.push({ year: currentYear, balance: yearEndBalance, principalPaid: yearlyPrincipal, interestPaid: yearlyInterest });
            }
            return yearlyData;
        },
    
        updateLegendValues(year) {
            const yearData = STATE.yearlyData[year - 1]; if (!yearData) return;
            Utils.$('#remaining-balance').textContent = Utils.formatCurrency(yearData.balance);
            Utils.$('#principal-paid').textContent = Utils.formatCurrency(yearData.principalPaid);
            Utils.$('#interest-paid').textContent = Utils.formatCurrency(yearData.interestPaid);
        }
    };
    
    // ==========================================================================
    // YEAR SLIDER MANAGER
    // ==========================================================================
    
    const YearSliderManager = {
        init(calculation) {
            const slider = Utils.$('#year-range'); if (!slider || !STATE.yearlyData.length) return;
            slider.max = Math.min(calculation.params.term, STATE.yearlyData.length);
            slider.value = 1; this.updateFromSlider(1);
        },
        updateFromSlider(year) {
            Utils.$('#year-label').textContent = `Year ${year}`;
            ChartManager.updateLegendValues(year);
        }
    };
    
    // ==========================================================================
    // AI INSIGHTS GENERATOR
    // ==========================================================================
    
    const AIInsights = {
        render(calculation) {
            const container = Utils.$('#ai-insights'); if (!container || !calculation) return;
            const insights = this.generateInsights(calculation);
            container.innerHTML = '';
            if (insights.length === 0) {
                container.innerHTML = this.createInsightHTML({ type: 'info', icon: 'check-circle', title: 'Solid Plan!', message: 'Your mortgage terms look good. No specific recommendations at this time.' });
                return;
            }
            insights.forEach(insight => container.innerHTML += this.createInsightHTML(insight));
        },
        createInsightHTML({ type, icon, title, message }) {
            return `<div class="insight-item ${type}">
                        <i class="fas fa-${icon} insight-icon"></i>
                        <div><h5>${title}</h5><p>${message}</p></div>
                    </div>`;
        },
        generateInsights(calc) {
            const insights = [];
            if (calc.downPaymentPercent < 10) {
                insights.push({ type: 'warning', icon: 'triangle-exclamation', title: 'Low Down Payment', message: `Your ${calc.downPaymentPercent.toFixed(1)}% down payment requires PMI of ${Utils.formatCurrency(calc.monthlyPMI)}/mo. Consider a larger down payment.` });
            } else if (calc.downPaymentPercent >= 20) {
                insights.push({ type: 'success', icon: 'check-circle', title: 'Great Down Payment', message: `Your ${calc.downPaymentPercent.toFixed(1)}% down payment eliminates PMI, saving you money.` });
            }
            if (calc.params.rate > (STATE.marketRates["30yr"] + 0.5)) {
                insights.push({ type: 'warning', icon: 'chart-line', title: 'High Interest Rate', message: `At ${calc.params.rate}%, your rate is above the market average. Shop around with other lenders.` });
            }
            if (calc.interestSavings > 10000) {
                 insights.push({ type: 'success', icon: 'piggy-bank', title: 'Smart Extra Payments', message: `Your extra payments will save you ${Utils.formatCurrency(calc.interestSavings)} in interest!` });
            } else {
                 const suggestedExtra = Math.round(calc.monthlyPI * 0.1);
                 insights.push({ type: 'info', icon: 'lightbulb', title: 'Consider Extra Payments', message: `Adding just ${Utils.formatCurrency(suggestedExtra)}/mo could save you thousands and shorten your loan term.` });
            }
            if (calc.params.term === 30 && calc.monthlyPI < (calc.params.homePrice / 1000 * 6)) { // Simple affordability check
                insights.push({ type: 'info', icon: 'clock', title: 'Consider a 15-Year Loan', message: `A shorter term could save you over ${Utils.formatCurrency(calc.totalInterest / 2)} in interest if you can afford the higher monthly payment.` });
            }
            return insights.slice(0, 4);
        }
    };
    
    // ==========================================================================
    // AMORTIZATION TABLE MANAGER
    // ==========================================================================
    
    const AmortizationTable = {
        render(calculation) {
            if (!calculation || !calculation.schedule) { this.showEmptyState(); return; }
            STATE.amortizationData = calculation.schedule;
            this.renderPage(1);
        },
        renderPage(page) {
            const tbody = Utils.$('#amortization-table tbody'); if (!tbody) return;
            const pageData = STATE.amortizationData.slice(0, 12); // Show first year for simplicity
            tbody.innerHTML = '';
            if (pageData.length === 0) { this.showEmptyState(); return; }
            pageData.forEach(p => {
                const row = tbody.insertRow();
                row.innerHTML = `<td>${p.paymentNumber}</td><td>${Utils.formatDate(p.date)}</td><td>${Utils.formatCurrency(p.payment)}</td><td>${Utils.formatCurrency(p.principal)}</td><td>${Utils.formatCurrency(p.interest)}</td><td>${Utils.formatCurrency(p.balance)}</td>`;
            });
        },
        showEmptyState() {
            const tbody = Utils.$('#amortization-table tbody');
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Calculate mortgage to view payment schedule</td></tr>`;
        }
    };

    // ==========================================================================
    // INITIALIZATION
    // ==========================================================================
    
    function initializeApplication() {
        try {
            console.log('🏠 Initializing AI-Enhanced Mortgage Calculator...');
            AccessibilityControls.init();
            GlobalVoiceControl.init();
            MortgageCalculator.init();
            StatsUpdater.init();
            Utils.showToast('Welcome to the AI Mortgage Calculator! 🎉', 'success');
        } catch (error) {
            console.error('❌ Initialization error:', error);
            Utils.showToast('Failed to initialize calculator.', 'error');
        }
    }
    
    initializeApplication();
});
