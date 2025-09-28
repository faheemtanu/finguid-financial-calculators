/**
 * World's First AI-Enhanced Mortgage Calculator - Complete JavaScript
 * Version: 3.2 - Fully Functional & Corrected
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // CONFIGURATION & STATE MANAGEMENT
    // ==========================================================================

    const CONFIG = {
        debounceDelay: 300,
        defaultInsuranceRate: 0.004,
        pmiRate: 0.005,
        apiUpdateInterval: 5000,
    };

    const STATE = {
        chart: null,
        donutChart: null,
        yearlyData: [],
        currentCalculation: null,
        globalVoiceRecognition: null,
        isGlobalListening: false,
        currentFontSize: 100,
        theme: 'light',
        screenReaderActive: false,
        marketRates: { 
            "30yr": { rate: 6.75, trend: 0 }, 
            "15yr": { rate: 6.25, trend: 0 },
            "arm": { rate: 5.95, trend: 0 }
        },
    };

    const STATE_TAX_RATES = {
        'AL': 0.41, 'AK': 1.19, 'AZ': 0.72, 'AR': 0.62, 'CA': 0.76, 'CO': 0.55, 'CT': 2.14, 'DE': 0.57, 'FL': 0.98, 'GA': 0.92, 'HI': 0.28, 'ID': 0.69, 'IL': 2.16, 'IN': 0.85, 'IA': 1.57, 'KS': 1.41, 'KY': 0.86, 'LA': 0.55, 'ME': 1.36, 'MD': 1.09, 'MA': 1.23, 'MI': 1.54, 'MN': 1.12, 'MS': 0.81, 'MO': 0.97, 'MT': 0.84, 'NE': 1.73, 'NV': 0.64, 'NH': 2.18, 'NJ': 2.42, 'NM': 0.80, 'NY': 1.72, 'NC': 0.84, 'ND': 0.98, 'OH': 1.56, 'OK': 0.90, 'OR': 0.97, 'PA': 1.58, 'RI': 1.63, 'SC': 0.57, 'SD': 1.31, 'TN': 0.71, 'TX': 1.90, 'UT': 0.66, 'VT': 1.90, 'VA': 0.82, 'WA': 0.98, 'WV': 0.59, 'WI': 1.68, 'WY': 0.61
    };
    
    const STATE_NAMES = {
        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
    };


    const Utils = {
        formatCurrency: (amount, decimals = 0) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Math.abs(amount || 0)),
        formatNumber: (num) => new Intl.NumberFormat('en-US').format(num || 0),
        parseNumber: (str) => {
            const cleaned = String(str || '0').replace(/[^\d.-]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : Math.abs(parsed);
        },
        debounce: (func, wait) => { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); }; },
        $: (selector) => document.querySelector(selector),
        $$: (selector) => document.querySelectorAll(selector),
        showToast: (message, type = 'info') => {
            const container = Utils.$('#toast-container'); if (!container) return;
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            const iconMap = { success: 'check-circle', error: 'triangle-exclamation', warning: 'circle-exclamation', info: 'circle-info' };
            toast.innerHTML = `<i class="fa-solid fa-${iconMap[type] || 'circle-info'}"></i><span>${message}</span>`;
            container.appendChild(toast);
            setTimeout(() => toast.remove(), 5000);
        },
        announceToScreenReader: (message) => {
            if (!STATE.screenReaderActive) return;
            const el = Utils.$('#sr-announcements'); if (el) el.textContent = message;
        },
        showLoading: (show = true, text = 'Calculating...') => {
            const el = Utils.$('#loading-overlay'); if (el) {
                el.style.display = show ? 'flex' : 'none';
                Utils.$('#loading-text').textContent = text;
            }
        }
    };

    const StatsUpdater = {
        init() { this.updateMarketRates(); setInterval(() => this.updateMarketRates(), CONFIG.apiUpdateInterval); },
        updateMarketRates() {
            Object.keys(STATE.marketRates).forEach(rateType => {
                const current = STATE.marketRates[rateType];
                const oldRate = current.rate;
                const variation = (Math.random() - 0.5) * 0.05;
                const newRate = Math.max(4.0, Math.min(9.0, oldRate + variation));
                
                current.trend = newRate > oldRate ? 1 : (newRate < oldRate ? -1 : 0);
                current.rate = newRate;

                const el = Utils.$(`#market-${rateType}`);
                const itemEl = el?.closest('.market-item-hero');
                if (el) {
                    let trendIcon = '';
                    if (current.trend === 1) trendIcon = `<i class="fa-solid fa-arrow-up trend-up"></i>`;
                    if (current.trend === -1) trendIcon = `<i class="fa-solid fa-arrow-down trend-down"></i>`;
                    el.innerHTML = `${current.rate.toFixed(2)}% ${trendIcon}`;
                    
                    if (itemEl && current.trend !== 0) {
                        itemEl.classList.remove('flash-update');
                        void itemEl.offsetWidth; 
                        itemEl.classList.add('flash-update');
                    }
                }
            });
        }
    };

    const AccessibilityControls = {
        init() { this.bindEvents(); this.loadSavedSettings(); },
        bindEvents() {
            Utils.$('#font-smaller')?.addEventListener('click', () => this.adjustFontSize(-5));
            Utils.$('#font-larger')?.addEventListener('click', () => this.adjustFontSize(5));
            Utils.$('#theme-toggle')?.addEventListener('click', () => this.toggleTheme());
            Utils.$('#screen-reader-toggle')?.addEventListener('click', () => this.toggleScreenReader());
        },
        loadSavedSettings() {
            this.setTheme(localStorage.getItem('mortgageCalc_theme') || 'light');
            STATE.currentFontSize = parseInt(localStorage.getItem('mortgageCalc_fontSize') || '100');
            document.documentElement.style.fontSize = `${STATE.currentFontSize}%`;
            STATE.screenReaderActive = localStorage.getItem('mortgageCalc_screenReader') === 'true';
            this.updateScreenReaderButton();
        },
        adjustFontSize(change) {
            STATE.currentFontSize = Math.max(90, Math.min(120, STATE.currentFontSize + change));
            document.documentElement.style.fontSize = `${STATE.currentFontSize}%`;
            localStorage.setItem('mortgageCalc_fontSize', STATE.currentFontSize);
            Utils.announceToScreenReader(`Font size set to ${STATE.currentFontSize}%`);
        },
        toggleTheme() { this.setTheme(STATE.theme === 'light' ? 'dark' : 'light'); },
        setTheme(theme) {
            STATE.theme = theme;
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('mortgageCalc_theme', theme);
            this.updateThemeButton();
            if (STATE.currentCalculation) {
                DonutChartManager.render(STATE.currentCalculation);
                ChartManager.render(STATE.currentCalculation);
            }
            Utils.announceToScreenReader(`Theme changed to ${theme} mode`);
        },
        updateThemeButton() {
            const icon = Utils.$('#theme-icon'), span = Utils.$('#theme-toggle .control-text');
            if(icon) icon.className = `fa-solid fa-${STATE.theme === 'light' ? 'moon' : 'sun'}`;
            if(span) span.textContent = `${STATE.theme === 'light' ? 'Dark' : 'Light'}`;
        },
        toggleScreenReader() { 
            STATE.screenReaderActive = !STATE.screenReaderActive;
            localStorage.setItem('mortgageCalc_screenReader', STATE.screenReaderActive);
            this.updateScreenReaderButton();
            Utils.showToast(`Screen reader enhancements ${STATE.screenReaderActive ? 'enabled' : 'disabled'}`, 'info');
            Utils.announceToScreenReader(`Screen reader enhancements ${STATE.screenReaderActive ? 'enabled' : 'disabled'}`);
        },
        updateScreenReaderButton() { Utils.$('#screen-reader-toggle')?.classList.toggle('active', STATE.screenReaderActive); }
    };

    const GlobalVoiceControl = {
        init() {
            if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
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
            STATE.globalVoiceRecognition.continuous = false;
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
        },
        toggle() { STATE.isGlobalListening ? this.stop() : this.start(); },
        start() {
            if (!STATE.globalVoiceRecognition || STATE.isGlobalListening) return;
            try { STATE.globalVoiceRecognition.start(); }
            catch (e) { Utils.showToast('Voice recognition failed to start.', 'error'); }
        },
        stop() {
            if (STATE.globalVoiceRecognition && STATE.isGlobalListening) STATE.globalVoiceRecognition.stop();
        },
        startDemo() {
            this.start(); 
            setTimeout(() => Utils.showToast('Try: "Set home price to 500 thousand"', 'info'), 1000);
        },
        onStart() { STATE.isGlobalListening = true; this.updateVoiceUI(true); Utils.announceToScreenReader('Voice listening started');},
        onResult(event) {
            const transcript = event.results[0][0].transcript.toLowerCase().trim();
            Utils.$('#voice-text').textContent = `Heard: "${transcript}"`;
            setTimeout(() => this.processCommand(transcript), 500);
        },
        onError(event) {
            const errorMessages = { 'no-speech': 'No speech detected.', 'audio-capture': 'Microphone not accessible.', 'not-allowed': 'Microphone access denied.' };
            Utils.showToast(errorMessages[event.error] || `Voice error: ${event.error}`, 'error');
            this.stop();
        },
        onEnd() { STATE.isGlobalListening = false; this.updateVoiceUI(false); Utils.announceToScreenReader('Voice listening stopped');},
        updateVoiceUI(isListening) {
            Utils.$('#voice-toggle')?.classList.toggle('active', isListening);
            const statusEl = Utils.$('#voice-status');
            if (statusEl) {
                statusEl.style.display = isListening ? 'flex' : 'none';
                if(isListening) Utils.$('#voice-text').textContent = "Listening...";
            }
        },
        processCommand(command) {
            if (command.includes('calculate')) { MortgageCalculator.calculate(); return; }
            if (command.includes('reset')) { MortgageCalculator.resetForm(); return; }
            const commands = {
                'home price': 'home-price',
                'down payment': 'down-payment',
                'interest rate': 'interest-rate',
                'loan term': 'loan-term'
            };
            for (const key in commands) {
                if (command.startsWith(`set ${key} to`)) {
                    const value = command.split('to')[1].trim();
                    this.updateField(commands[key], value);
                    return;
                }
            }
            Utils.showToast(`Command not recognized: "${command}"`, 'info');
        },
        updateField(fieldId, value) {
            const field = Utils.$(`#${fieldId}`);
            if (!field) return;

            let numericValue = parseFloat(value.replace(/,|\$|k|thousand/g, ''));
            if (value.includes('k') || value.includes('thousand')) numericValue *= 1000;
            
            if (isNaN(numericValue)) {
                Utils.showToast(`Invalid number for ${fieldId}`, 'error');
                return;
            }

            if (fieldId === 'loan-term') {
                if ([15, 20, 30].includes(numericValue)) {
                    Utils.$$('.term-chip').forEach(c => c.classList.toggle('active', parseInt(c.dataset.term) === numericValue));
                    field.value = numericValue;
                }
            } else {
                field.value = numericValue;
            }
            field.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };
    
    const MortgageCalculator = {
        init() {
            this.bindEvents();
            this.populateStates();
            this.setInitialValues();
            this.calculate();
        },
        bindEvents() {
            const debouncedCalculate = Utils.debounce(() => this.calculate(), CONFIG.debounceDelay);
            Utils.$$('#mortgage-form input, #mortgage-form select').forEach(el => {
                el.addEventListener('input', () => { this.handleInputChange(el); debouncedCalculate(); });
            });
            Utils.$$('input[type="text"]').forEach(input => input.addEventListener('blur', (e) => this.formatInputValue(e.target)));
            Utils.$$('.term-chip').forEach(c => c.addEventListener('click', e => { this.handleTermSelection(e.target); debouncedCalculate(); }));
            Utils.$$('#amount-toggle, #percent-toggle').forEach(btn => btn.addEventListener('click', e => this.switchDownPaymentMode(e.currentTarget.id.includes('amount') ? 'amount' : 'percent')));
            Utils.$$('.tab-btn').forEach(btn => btn.addEventListener('click', (e) => this.switchTab(e.currentTarget.dataset.tab)));
            Utils.$('#year-range')?.addEventListener('input', e => YearSliderManager.updateFromSlider(parseInt(e.target.value)));
            Utils.$('#calculate-btn')?.addEventListener('click', () => this.calculate());
            Utils.$('#reset-form')?.addEventListener('click', () => this.resetForm());
            Utils.$('#share-btn')?.addEventListener('click', () => this.shareResults());
            Utils.$('#pdf-download-btn')?.addEventListener('click', () => this.downloadPDF());
            Utils.$('#print-btn')?.addEventListener('click', () => window.print());
        },
        populateStates() {
            const stateSelect = Utils.$('#property-state'); if (!stateSelect) return;
            stateSelect.innerHTML = '';
            Object.keys(STATE_NAMES).forEach(abbr => {
                if (STATE_TAX_RATES[abbr]) {
                    const option = new Option(STATE_NAMES[abbr], abbr);
                    stateSelect.add(option);
                }
            });
            stateSelect.value = 'CA';
        },
        handleInputChange(input) {
            const id = input.id;
            if (id === 'home-price') { this.syncDownPayment('amount'); this.updateDependentCosts(); } 
            else if (id.includes('down-payment')) { this.syncDownPayment(id.includes('percent') ? 'percent' : 'amount'); }
            else if (id === 'interest-rate') { this.updateRateStatus(Utils.parseNumber(input.value)); } 
            else if (id === 'property-state') { this.updatePropertyTax(); }
        },
        formatInputValue(input) {
            if (!input.id.includes('percent') && !input.id.includes('rate')) {
                input.value = Utils.formatNumber(Utils.parseNumber(input.value));
            }
        },
        updateDependentCosts() { this.updateInsurance(); this.updatePropertyTax(); },
        setInitialValues() {
            Utils.$('#interest-rate').value = (STATE.marketRates["30yr"].rate || 6.75).toFixed(2);
            this.updateDependentCosts();
            this.updatePMIStatus();
        },
        switchDownPaymentMode(mode) {
            const isAmount = mode === 'amount';
            Utils.$('#amount-input').style.display = isAmount ? 'flex' : 'none';
            Utils.$('#percent-input').style.display = isAmount ? 'none' : 'flex';
            Utils.$('#amount-toggle').classList.toggle('active', isAmount);
            Utils.$('#percent-toggle').classList.toggle('active', !isAmount);
        },
        handleTermSelection(chip) {
            Utils.$$('.term-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            Utils.$('#loan-term').value = chip.dataset.term;
        },
        switchTab(tabName) {
            Utils.$$('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
            Utils.$$('.tab-content').forEach(content => content.classList.toggle('active', content.id === tabName));
        },
        updateInsurance() {
            const homePrice = Utils.parseNumber(Utils.$('#home-price').value);
            const insuranceInput = Utils.$('#home-insurance');
            if (homePrice > 0 && Utils.parseNumber(insuranceInput.value) === 0) {
                 insuranceInput.value = Utils.formatNumber(Math.round(homePrice * CONFIG.defaultInsuranceRate));
            }
        },
        syncDownPayment(source) {
            const homePrice = Utils.parseNumber(Utils.$('#home-price').value);
            const dpAmountEl = Utils.$('#down-payment'), dpPercentEl = Utils.$('#down-payment-percent');
            if (homePrice <= 0) return;
            if (source === 'amount') {
                const percent = (Utils.parseNumber(dpAmountEl.value) / homePrice) * 100;
                dpPercentEl.value = isNaN(percent) ? '0.0' : percent.toFixed(1);
            } else {
                const amount = (homePrice * Utils.parseNumber(dpPercentEl.value)) / 100;
                dpAmountEl.value = Utils.formatNumber(Math.round(amount));
            }
            this.updatePMIStatus();
        },
        updatePMIStatus() {
            const homePrice = Utils.parseNumber(Utils.$('#home-price').value);
            const downPayment = Utils.parseNumber(Utils.$('#down-payment').value);
            const pmiInput = Utils.$('#pmi'), pmiStatus = Utils.$('#pmi-status'), pmiWarning = Utils.$('#pmi-warning');
            const downPaymentPercent = homePrice > 0 ? (downPayment / homePrice) * 100 : 0;
            
            if (downPaymentPercent < 20 && (homePrice - downPayment > 0)) {
                const monthlyPMI = Math.round(((homePrice - downPayment) * CONFIG.pmiRate) / 12);
                pmiInput.value = Utils.formatNumber(monthlyPMI);
                pmiStatus.textContent = `PMI estimated for ${downPaymentPercent.toFixed(1)}% down.`;
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
            const taxInput = Utils.$('#property-tax'), taxHelp = Utils.$('#tax-help');
            if (state && homePrice > 0 && STATE_TAX_RATES[state]) {
                const taxRate = STATE_TAX_RATES[state];
                if (Utils.parseNumber(taxInput.value) === 0) {
                    taxInput.value = Utils.formatNumber(Math.round(homePrice * (taxRate / 100)));
                }
                taxHelp.textContent = `Est. for ${STATE_NAMES[state]}: ${taxRate}% of home value.`;
            } else { taxHelp.textContent = ''; }
        },
        updateRateStatus(rate) { 
            const rateStatus = Utils.$('#rate-status');
            const marketAvg = STATE.marketRates["30yr"].rate || 6.75;
            rateStatus.className = 'input-adornment rate-adornment';
            if (rate > marketAvg + 0.5) { rateStatus.textContent = 'High'; rateStatus.classList.add('rate-high'); }
            else if (rate < marketAvg - 0.5) { rateStatus.textContent = 'Low'; rateStatus.classList.add('rate-low'); }
            else { rateStatus.textContent = 'Avg'; }
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
                DonutChartManager.render(result);
                ChartManager.render(result);
                YearSliderManager.init(result);
                AIInsights.render(result);
                AmortizationTable.render(result);
                Utils.announceToScreenReader('Mortgage calculation completed.');
                setTimeout(() => Utils.showLoading(false), 300);
            } catch (error) { console.error(error); Utils.showToast('Calculation error.', 'error'); Utils.showLoading(false); }
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
        }),
        validateParams: (params) => (params.homePrice > 0 && params.rate > 0 && params.downPayment < params.homePrice),
        performCalculation(params) {
            const loanAmount = params.homePrice - params.downPayment; if (loanAmount <= 0) return null;
            const schedule = this.generateAmortizationSchedule(loanAmount, params.rate / 100, params.term, params.extraMonthly, params.extraOnetime);
            if (schedule.length === 0) return null;
            const monthlyPI = schedule[0]?.payment - params.extraMonthly || 0;
            const totalInterest = schedule.reduce((sum, p) => sum + p.interest, 0);
            return { params, loanAmount, monthlyPI, monthlyTax: params.propertyTax / 12, monthlyInsurance: params.homeInsurance / 12, monthlyPMI: params.pmi, totalMonthlyPayment: monthlyPI + (params.propertyTax / 12) + (params.homeInsurance / 12) + params.pmi, totalInterest, totalCost: loanAmount + totalInterest, payoffDate: new Date(schedule[schedule.length - 1].date), schedule, downPaymentPercent: (params.downPayment / params.homePrice) * 100 };
        },
        generateAmortizationSchedule(principal, annualRate, termYears, extraMonthly = 0, extraOnetime = 0) {
            const schedule = []; let balance = principal;
            const ratePerPeriod = annualRate / 12, totalPayments = termYears * 12;
            if (ratePerPeriod <= 0 || isNaN(ratePerPeriod)) return [];
            const basePayment = principal * (ratePerPeriod * Math.pow(1 + ratePerPeriod, totalPayments)) / (Math.pow(1 + ratePerPeriod, totalPayments) - 1);
            for (let i = 1; i <= totalPayments * 2 && balance > 0.01; i++) {
                const interest = balance * ratePerPeriod;
                let extra = extraMonthly; if (extraOnetime > 0 && i === 12) extra += extraOnetime;
                let principalPayment = basePayment - interest + extra;
                if (balance <= basePayment + extra - interest) { principalPayment = balance; }
                balance -= principalPayment;
                const paymentDate = new Date(); paymentDate.setMonth(paymentDate.getMonth() + i - 1);
                schedule.push({ paymentNumber: i, date: paymentDate, payment: basePayment + extra, principal: principalPayment, interest, balance: Math.max(0, balance) });
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
        },
        updateBreakdownBars(calc) {
            const total = calc.totalMonthlyPayment; if (total <= 0) return;
            const p = { pi: calc.monthlyPI / total * 100, tax: calc.monthlyTax / total * 100, ins: calc.monthlyInsurance / total * 100, pmi: calc.monthlyPMI / total * 100 };
            Utils.$('#pi-fill').style.width = `${p.pi}%`; Utils.$('#tax-fill').style.width = `${p.tax}%`;
            Utils.$('#insurance-fill').style.width = `${p.ins}%`; Utils.$('#pmi-fill').style.width = `${p.pmi}%`;
        },
        resetForm() {
            Utils.$('#mortgage-form').reset();
            this.setInitialValues();
            this.switchDownPaymentMode('amount');
            Utils.$$('.term-chip').forEach(c => c.classList.toggle('active', c.dataset.term === '30'));
            Utils.$('#loan-term').value = '30';
            setTimeout(() => this.calculate(), 100);
            Utils.showToast('Form reset', 'success');
        },
        async shareResults() {
            if (!STATE.currentCalculation) { Utils.showToast('Calculate first to share.', 'info'); return; }
            const { totalMonthlyPayment, params } = STATE.currentCalculation;
            const shareData = {
                title: 'My Mortgage Calculation',
                text: `Check out my mortgage estimate: ${Utils.formatCurrency(totalMonthlyPayment)}/mo for a ${Utils.formatCurrency(params.homePrice)} home.`,
                url: window.location.href,
            };
            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                } else {
                    await navigator.clipboard.writeText(`${shareData.text} \n${shareData.url}`);
                    Utils.showToast('Results copied to clipboard!', 'success');
                }
            } catch (err) { Utils.showToast('Could not share results.', 'error'); }
        },
        async downloadPDF() {
            if (!STATE.currentCalculation) { Utils.showToast('Calculate first to generate PDF.', 'info'); return; }
            Utils.showLoading(true, 'Generating PDF...');

            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                const resultsEl = Utils.$('#results-section');
                
                doc.setFontSize(22);
                doc.text("Mortgage Calculation Summary", 14, 22);
                doc.setFontSize(12);
                doc.setTextColor(100);
                doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

                const canvas = await html2canvas(resultsEl, { scale: 2, windowWidth: 1200 });
                const imgData = canvas.toDataURL('image/png');
                const imgProps = doc.getImageProperties(imgData);
                const pdfWidth = doc.internal.pageSize.getWidth() - 28;
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                doc.addImage(imgData, 'PNG', 14, 40, pdfWidth, pdfHeight);

                doc.addPage();
                doc.setFontSize(18);
                doc.text("Full Amortization Schedule", 14, 22);
                
                const tableData = STATE.currentCalculation.schedule.map(p => [
                    p.paymentNumber,
                    Utils.formatCurrency(p.payment),
                    Utils.formatCurrency(p.principal),
                    Utils.formatCurrency(p.interest),
                    Utils.formatCurrency(p.balance)
                ]);

                doc.autoTable({
                    head: [['#', 'Payment', 'Principal', 'Interest', 'Balance']],
                    body: tableData,
                    startY: 30,
                    theme: 'grid',
                    headStyles: { fillColor: [29, 154, 154] },
                });

                doc.save(`Mortgage-Summary-${Date.now()}.pdf`);
            } catch (error) {
                console.error("PDF Generation Error:", error);
                Utils.showToast('Failed to generate PDF.', 'error');
            } finally {
                Utils.showLoading(false);
            }
        }
    };

    const DonutChartManager = {
        render(calculation) {
            if (!calculation || typeof Chart === 'undefined') return;
            const ctx = Utils.$('#cost-breakdown-chart')?.getContext('2d'); if (!ctx) return;
            if (STATE.donutChart) STATE.donutChart.destroy();
            
            STATE.donutChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Principal', 'Interest'],
                    datasets: [{
                        data: [calculation.loanAmount, calculation.totalInterest],
                        backgroundColor: [ getComputedStyle(document.documentElement).getPropertyValue('--color-primary'), getComputedStyle(document.documentElement).getPropertyValue('--color-primary-accent') ],
                        borderColor: STATE.theme === 'dark' ? '#18181b' : '#ffffff',
                        borderWidth: 4, hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '75%',
                    plugins: { legend: { display: false }, tooltip: { enabled: true } },
                }
            });
        }
    };
    
    const ChartManager = {
        render(calculation) {
            if (!calculation || typeof Chart === 'undefined') return;
            const ctx = Utils.$('#mortgage-timeline-chart')?.getContext('2d'); if (!ctx) return;
            if (STATE.chart) STATE.chart.destroy();
            STATE.yearlyData = this.prepareYearlyData(calculation.schedule, calculation.loanAmount);
            if (STATE.yearlyData.length === 0) return;
            
            const gridColor = STATE.theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
            const textColor = STATE.theme === 'dark' ? '#a1a1aa' : '#71717a';

            STATE.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: STATE.yearlyData.map(d => d.year),
                    datasets: [{ label: 'Balance', data: STATE.yearlyData.map(d => d.balance), borderColor: '#37b5b5', backgroundColor: 'rgba(55, 181, 181, 0.1)', fill: true, tension: 0.4 }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { title: { display: true, text: 'Year' }, grid: { color: gridColor }, ticks: { color: textColor } },
                        y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, callback: v => Utils.formatCurrency(v, 0) } }
                    },
                    interaction: { mode: 'index', intersect: false },
                }
            });
            this.updateLegendValues(1);
        },
        prepareYearlyData(schedule, initialLoanAmount) {
            if (!schedule || schedule.length === 0) return [{ year: 0, balance: initialLoanAmount }];
            const yearlyData = []; let currentYear = 1; let yearEndBalance = initialLoanAmount;
            schedule.forEach((payment, index) => {
                const paymentYear = Math.ceil((index + 1) / 12);
                if (paymentYear === currentYear) {
                    yearEndBalance = payment.balance;
                } else {
                    yearlyData.push({ year: currentYear, balance: yearEndBalance });
                    currentYear = paymentYear; yearEndBalance = payment.balance;
                }
            });
            yearlyData.push({ year: currentYear, balance: yearEndBalance });
            return yearlyData;
        },
        updateLegendValues(year) {
            const yearData = STATE.yearlyData[year - 1]; if (!yearData) return;
            Utils.$('#remaining-balance').textContent = Utils.formatCurrency(yearData.balance);
        }
    };
    
    const YearSliderManager = {
        init(calculation) {
            const slider = Utils.$('#year-range'); if (!slider || !STATE.yearlyData.length) return;
            slider.max = Math.max(1, STATE.yearlyData.length);
            slider.value = 1; this.updateFromSlider(1);
        },
        updateFromSlider(year) {
            Utils.$('#year-label').textContent = `End of Year ${year}`;
            ChartManager.updateLegendValues(year);
        }
    };
    
    const AmortizationTable = {
        render(calculation) {
            if (!calculation || !calculation.schedule) { this.showEmptyState(); return; }
            const tbody = Utils.$('#amortization-table tbody'); if (!tbody) return;
            tbody.innerHTML = '';
            calculation.schedule.forEach(p => {
                const row = tbody.insertRow();
                row.innerHTML = `<td>${p.paymentNumber}</td><td>${Utils.formatCurrency(p.payment)}</td><td>${Utils.formatCurrency(p.principal)}</td><td>${Utils.formatCurrency(p.interest)}</td><td>${Utils.formatCurrency(p.balance)}</td>`;
            });
        },
        showEmptyState() {
            const tbody = Utils.$('#amortization-table tbody');
            if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Calculate to view schedule</td></tr>`;
        }
    };

    const AIInsights = {
        render(calc) {
            const container = Utils.$('#ai-insights'); if (!container || !calc) return;
            const insights = this.generateInsights(calc);
            container.innerHTML = '';
            insights.forEach(insight => container.innerHTML += this.createInsightHTML(insight));
        },
        createInsightHTML: ({ type, icon, title, message }) => `<div class="insight-item ${type}"><i class="fa-solid fa-${icon} insight-icon"></i><div><h5>${title}</h5><p>${message}</p></div></div>`,
        
        generateInsights(calc) {
            const insights = [];
            const { params, downPaymentPercent, totalInterest, schedule } = calc;

            if (downPaymentPercent < 20 && params.pmi > 0) {
                insights.push({ type: 'warning', icon: 'triangle-exclamation', title: 'Opportunity to Drop PMI', message: `Your ${downPaymentPercent.toFixed(1)}% down payment requires ${Utils.formatCurrency(params.pmi)}/mo in PMI. Increasing your down payment to 20% (${Utils.formatCurrency(params.homePrice * 0.2)}) could save you money.` });
            } else {
                insights.push({ type: 'success', icon: 'check-circle', title: 'Excellent Down Payment', message: `With ${downPaymentPercent.toFixed(1)}% down, you've avoided PMI, reducing your monthly cost and building equity faster.` });
            }

            const extraPaySuggestion = 100;
            const extraPaySchedule = MortgageCalculator.generateAmortizationSchedule(calc.loanAmount, params.rate / 100, params.term, extraPaySuggestion, 0);
            if (extraPaySchedule.length > 0) {
                const extraPayInterest = extraPaySchedule.reduce((sum, p) => sum + p.interest, 0);
                const interestSaved = totalInterest - extraPayInterest;
                const timeSavedMonths = schedule.length - extraPaySchedule.length;
                if (interestSaved > 0 && timeSavedMonths > 0) {
                    insights.push({ type: 'info', icon: 'piggy-bank', title: `Impact of Paying Extra $${extraPaySuggestion}/mo`, message: `By adding ${Utils.formatCurrency(extraPaySuggestion)} to your monthly payment, you could save **${Utils.formatCurrency(interestSaved)}** in interest and pay off your loan **${Math.floor(timeSavedMonths / 12)} years and ${timeSavedMonths % 12} months** sooner.` });
                }
            }

            if (params.term === 30) {
                const schedule15Yr = MortgageCalculator.generateAmortizationSchedule(calc.loanAmount, params.rate / 100, 15, 0, 0);
                if (schedule15Yr.length > 0) {
                    const payment15Yr = schedule15Yr[0].payment;
                    const interest15Yr = schedule15Yr.reduce((sum, p) => sum + p.interest, 0);
                    const interestSaved15Yr = totalInterest - interest15Yr;
                    const paymentIncrease = payment15Yr - calc.monthlyPI;
                    insights.push({ type: 'info', icon: 'clock-rotate-left', title: 'Consider a 15-Year Loan', message: `Switching to a 15-year term could save you **${Utils.formatCurrency(interestSaved15Yr)}** in total interest. Your monthly P&I would increase by ~${Utils.formatCurrency(paymentIncrease)}.` });
                }
            }
            
            return insights.slice(0, 3);
        }
    };
    
    function initializeApplication() {
        try {
            AccessibilityControls.init();
            GlobalVoiceControl.init();
            MortgageCalculator.init();
            StatsUpdater.init();
            Utils.showToast('Welcome to the AI Mortgage Calculator!', 'info');
        } catch (error) {
            console.error('Initialization error:', error);
            Utils.showToast('Failed to initialize calculator.', 'error');
        }
    }
    
    initializeApplication();
});
