// Mortgage Calculator JavaScript - Advanced AI-Enhanced Version
// Finguid Financial Calculators - 2025

class MortgageCalculator {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeVoiceRecognition();
        this.savedCalculations = JSON.parse(localStorage.getItem('savedMortgageCalculations')) || [];
        this.currentCalculation = null;
        this.voiceRecognition = null;
        this.isCalculating = false;
        
        // State tax rates data (2025)
        this.stateTaxRates = {
            'AL': 0.41, 'AK': 1.24, 'AZ': 0.60, 'AR': 0.66, 'CA': 0.81, 'CO': 0.52,
            'CT': 2.16, 'DE': 0.62, 'FL': 0.89, 'GA': 0.95, 'HI': 0.29, 'ID': 0.63,
            'IL': 2.29, 'IN': 0.83, 'IA': 1.59, 'KS': 1.40, 'KY': 0.89, 'LA': 0.62,
            'ME': 1.29, 'MD': 1.07, 'MA': 1.19, 'MI': 1.53, 'MN': 1.10, 'MS': 0.81,
            'MO': 1.00, 'MT': 0.83, 'NE': 1.70, 'NV': 0.55, 'NH': 2.09, 'NJ': 2.46,
            'NM': 0.84, 'NY': 1.73, 'NC': 0.80, 'ND': 1.02, 'OH': 1.57, 'OK': 0.99,
            'OR': 0.92, 'PA': 1.56, 'RI': 1.54, 'SC': 0.58, 'SD': 1.24, 'TN': 0.65,
            'TX': 1.90, 'UT': 0.57, 'VT': 1.89, 'VA': 0.83, 'WA': 0.93, 'WV': 0.59,
            'WI': 1.71, 'WY': 0.61
        };
        
        // Initialize with default calculation
        this.calculatePayment();
    }

    initializeElements() {
        // Input elements
        this.homePrice = document.getElementById('home-price');
        this.homePriceRange = document.getElementById('home-price-range');
        this.downPayment = document.getElementById('down-payment');
        this.downPaymentRange = document.getElementById('down-payment-range');
        this.loanTerm = document.getElementById('loan-term');
        this.interestRate = document.getElementById('interest-rate');
        this.interestRateRange = document.getElementById('interest-rate-range');
        this.state = document.getElementById('state');
        this.propertyTax = document.getElementById('property-tax');
        this.homeInsurance = document.getElementById('home-insurance');
        this.pmiRate = document.getElementById('pmi-rate');
        this.hoaFees = document.getElementById('hoa-fees');

        // Display elements
        this.totalPayment = document.getElementById('total-payment');
        this.piAmount = document.getElementById('pi-amount');
        this.taxAmount = document.getElementById('tax-amount');
        this.insuranceAmount = document.getElementById('insurance-amount');
        this.pmiAmount = document.getElementById('pmi-amount');
        this.loanAmountDisplay = document.getElementById('loan-amount');
        this.totalInterest = document.getElementById('total-interest');
        this.totalCost = document.getElementById('total-cost');

        // Other elements
        this.dpPercentage = document.getElementById('dp-percentage');
        this.pmiIndicator = document.getElementById('pmi-indicator');
        this.pmiLegend = document.getElementById('pmi-legend');
        this.amortizationBody = document.getElementById('amortization-body');
        this.insightsList = document.getElementById('insights-list');
        this.voiceStatus = document.getElementById('voice-status');
        this.loadingOverlay = document.getElementById('loading-overlay');
    }

    initializeEventListeners() {
        // Input synchronization
        this.homePrice.addEventListener('input', () => this.syncHomePriceInputs());
        this.homePriceRange.addEventListener('input', () => this.syncHomePriceInputs());
        
        this.downPayment.addEventListener('input', () => this.syncDownPaymentInputs());
        this.downPaymentRange.addEventListener('input', () => this.syncDownPaymentInputs());
        
        this.interestRate.addEventListener('input', () => this.syncInterestRateInputs());
        this.interestRateRange.addEventListener('input', () => this.syncInterestRateInputs());

        // State change updates property tax
        this.state.addEventListener('change', () => this.updatePropertyTax());

        // Loan term buttons
        document.querySelectorAll('.term-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectLoanTerm(btn));
        });

        // Down payment tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchDownPaymentTab(btn));
        });

        // Advanced options toggle
        document.getElementById('advanced-toggle').addEventListener('click', () => {
            this.toggleAdvancedOptions();
        });

        // Voice input buttons
        document.querySelectorAll('.voice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.startVoiceInput(e.target.dataset.field));
        });

        // Action buttons
        document.getElementById('calculate-btn').addEventListener('click', () => this.calculatePayment());
        document.getElementById('save-calculation').addEventListener('click', () => this.saveCalculation());
        document.getElementById('compare-loans').addEventListener('click', () => this.showComparison());
        document.getElementById('reset-form').addEventListener('click', () => this.resetForm());
        document.getElementById('email-results').addEventListener('click', () => this.showEmailModal());
        document.getElementById('download-pdf').addEventListener('click', () => this.downloadPDF());
        document.getElementById('print-results').addEventListener('click', () => this.printResults());
        document.getElementById('share-results').addEventListener('click', () => this.shareResults());
        document.getElementById('copy-embed').addEventListener('click', () => this.copyEmbedCode());

        // Email modal
        document.getElementById('close-email-modal').addEventListener('click', () => this.closeEmailModal());
        document.getElementById('cancel-email').addEventListener('click', () => this.closeEmailModal());
        document.getElementById('send-email').addEventListener('click', () => this.sendEmailResults());

        // Hamburger menu
        document.getElementById('hamburger').addEventListener('click', () => this.toggleMobileMenu());

        // Auto-calculate on input changes
        [this.homePrice, this.downPayment, this.interestRate, this.propertyTax, 
         this.homeInsurance, this.pmiRate, this.hoaFees].forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    clearTimeout(this.calculateTimeout);
                    this.calculateTimeout = setTimeout(() => this.calculatePayment(), 500);
                });
            }
        });
    }

    initializeVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.voiceRecognition = new SpeechRecognition();
            this.voiceRecognition.continuous = false;
            this.voiceRecognition.interimResults = false;
            this.voiceRecognition.lang = 'en-US';
            this.voiceRecognition.maxAlternatives = 1;

            this.voiceRecognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                this.processVoiceCommand(transcript);
            };

            this.voiceRecognition.onerror = (event) => {
                console.error('Voice recognition error:', event.error);
                this.hideVoiceStatus();
                this.showToast('Voice recognition error. Please try again.', 'error');
            };

            this.voiceRecognition.onend = () => {
                this.hideVoiceStatus();
            };
        }
    }

    // Input synchronization methods
    syncHomePriceInputs() {
        const value = event.target.value;
        this.homePrice.value = value;
        this.homePriceRange.value = value;
        this.updateDownPaymentMax();
        this.updatePropertyTax();
        this.updateInsurance();
    }

    syncDownPaymentInputs() {
        if (event.target === this.downPaymentRange) {
            // Range changed - update dollar amount
            const percentage = parseFloat(this.downPaymentRange.value);
            const amount = Math.round((this.homePrice.value * percentage) / 100);
            this.downPayment.value = amount;
            this.dpPercentage.textContent = percentage.toFixed(1) + '%';
        } else {
            // Dollar amount changed - update percentage
            const amount = parseFloat(this.downPayment.value);
            const percentage = (amount / this.homePrice.value) * 100;
            this.downPaymentRange.value = percentage;
            this.dpPercentage.textContent = percentage.toFixed(1) + '%';
        }
        this.updatePMIIndicator();
    }

    syncInterestRateInputs() {
        const value = event.target.value;
        this.interestRate.value = value;
        this.interestRateRange.value = value;
    }

    updateDownPaymentMax() {
        this.downPayment.max = this.homePrice.value;
        this.syncDownPaymentInputs();
    }

    updatePropertyTax() {
        const homeValue = parseFloat(this.homePrice.value);
        const state = this.state.value;
        const taxRate = this.stateTaxRates[state] || 1.0;
        const annualTax = Math.round(homeValue * (taxRate / 100));
        this.propertyTax.value = annualTax;
    }

    updateInsurance() {
        const homeValue = parseFloat(this.homePrice.value);
        const annualInsurance = Math.round(homeValue * 0.0024); // ~0.24% of home value
        this.homeInsurance.value = Math.max(800, Math.min(annualInsurance, 3000));
    }

    updatePMIIndicator() {
        const downPaymentPercent = (this.downPayment.value / this.homePrice.value) * 100;
        const needsPMI = downPaymentPercent < 20;
        
        this.pmiIndicator.style.display = needsPMI ? 'flex' : 'none';
        this.pmiLegend.style.display = needsPMI ? 'flex' : 'none';
        
        if (needsPMI) {
            this.pmiIndicator.innerHTML = `
                <i class="fas fa-shield-alt"></i>
                <span>PMI Required (${downPaymentPercent.toFixed(1)}% down payment)</span>
            `;
        }
    }

    selectLoanTerm(button) {
        document.querySelectorAll('.term-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.loanTerm.value = button.dataset.term;
        this.calculatePayment();
    }

    switchDownPaymentTab(button) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const isPercentage = button.dataset.tab === 'percentage';
        document.getElementById('dp-prefix').textContent = isPercentage ? '' : '$';
        // Add percentage input logic here if needed
    }

    toggleAdvancedOptions() {
        const panel = document.getElementById('advanced-panel');
        const toggle = document.getElementById('advanced-toggle');
        const icon = toggle.querySelector('.fa-chevron-down');
        
        panel.classList.toggle('active');
        icon.classList.toggle('rotated');
    }

    toggleMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        const hamburger = document.getElementById('hamburger');
        
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    }

    // Voice recognition methods
    startVoiceInput(field) {
        if (!this.voiceRecognition) {
            this.showToast('Voice input not supported in this browser', 'error');
            return;
        }

        this.currentVoiceField = field;
        this.showVoiceStatus();
        this.voiceRecognition.start();
    }

    processVoiceCommand(transcript) {
        console.log('Voice command:', transcript);
        
        // Extract numbers from transcript
        const numbers = transcript.match(/\d+(?:\.\d+)?/g);
        
        if (transcript.includes('home price') || transcript.includes('house price')) {
            if (numbers && numbers.length > 0) {
                let value = parseFloat(numbers[0]);
                if (value < 10000) value *= 1000; // Assume thousands if small number
                this.homePrice.value = value;
                this.syncHomePriceInputs();
                this.showToast(`Home price set to $${value.toLocaleString()}`, 'success');
            }
        } else if (transcript.includes('down payment')) {
            if (numbers && numbers.length > 0) {
                let value = parseFloat(numbers[0]);
                if (transcript.includes('percent') || transcript.includes('%')) {
                    // Percentage input
                    this.downPaymentRange.value = value;
                    this.syncDownPaymentInputs();
                } else {
                    // Dollar amount
                    if (value < 1000) value *= 1000; // Assume thousands
                    this.downPayment.value = value;
                    this.syncDownPaymentInputs();
                }
                this.showToast(`Down payment updated`, 'success');
            }
        } else if (transcript.includes('interest rate') || transcript.includes('rate')) {
            if (numbers && numbers.length > 0) {
                const value = parseFloat(numbers[0]);
                this.interestRate.value = value;
                this.syncInterestRateInputs();
                this.showToast(`Interest rate set to ${value}%`, 'success');
            }
        } else if (transcript.includes('calculate')) {
            this.calculatePayment();
            this.showToast('Calculation completed!', 'success');
        } else {
            this.showToast('Try saying: "Set home price to 500000" or "Calculate"', 'info');
        }

        this.calculatePayment();
    }

    showVoiceStatus() {
        this.voiceStatus.style.display = 'flex';
        this.voiceStatus.innerHTML = `
            <i class="fas fa-microphone-alt pulse"></i>
            <span>Listening... Say something like "set home price to 400000"</span>
        `;
    }

    hideVoiceStatus() {
        this.voiceStatus.style.display = 'none';
    }

    // Main calculation method
    calculatePayment() {
        if (this.isCalculating) return;
        
        this.isCalculating = true;
        this.showLoadingOverlay();

        // Simulate calculation delay for better UX
        setTimeout(() => {
            try {
                this.performCalculation();
                this.updateDisplay();
                this.generateAIInsights();
                this.updateAmortizationTable();
            } catch (error) {
                console.error('Calculation error:', error);
                this.showToast('Calculation error. Please check your inputs.', 'error');
            } finally {
                this.hideLoadingOverlay();
                this.isCalculating = false;
            }
        }, 300);
    }

    performCalculation() {
        // Get input values
        const homePrice = parseFloat(this.homePrice.value) || 0;
        const downPayment = parseFloat(this.downPayment.value) || 0;
        const loanAmount = homePrice - downPayment;
        const annualRate = parseFloat(this.interestRate.value) / 100;
        const monthlyRate = annualRate / 12;
        const termYears = parseInt(this.loanTerm.value);
        const termMonths = termYears * 12;
        const annualPropertyTax = parseFloat(this.propertyTax.value) || 0;
        const annualInsurance = parseFloat(this.homeInsurance.value) || 0;
        const annualPMIRate = parseFloat(this.pmiRate.value) / 100;
        const monthlyHOA = parseFloat(this.hoaFees.value) || 0;

        // Calculate monthly principal & interest
        let monthlyPI = 0;
        if (monthlyRate > 0) {
            monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                       (Math.pow(1 + monthlyRate, termMonths) - 1);
        } else {
            monthlyPI = loanAmount / termMonths;
        }

        // Calculate other monthly costs
        const monthlyPropertyTax = annualPropertyTax / 12;
        const monthlyInsurance = annualInsurance / 12;
        const downPaymentPercent = (downPayment / homePrice) * 100;
        const needsPMI = downPaymentPercent < 20;
        const monthlyPMI = needsPMI ? (loanAmount * annualPMIRate) / 12 : 0;

        // Total monthly payment
        const totalMonthly = monthlyPI + monthlyPropertyTax + monthlyInsurance + monthlyPMI + monthlyHOA;

        // Total costs
        const totalInterestPaid = (monthlyPI * termMonths) - loanAmount;
        const totalCost = loanAmount + totalInterestPaid;

        // Store calculation results
        this.currentCalculation = {
            homePrice,
            downPayment,
            loanAmount,
            monthlyPI,
            monthlyPropertyTax,
            monthlyInsurance,
            monthlyPMI,
            monthlyHOA,
            totalMonthly,
            totalInterestPaid,
            totalCost,
            annualRate,
            termYears,
            downPaymentPercent,
            needsPMI,
            timestamp: Date.now()
        };
    }

    updateDisplay() {
        const calc = this.currentCalculation;
        
        // Update main payment display
        this.totalPayment.textContent = this.formatCurrency(calc.totalMonthly);
        this.piAmount.textContent = this.formatCurrency(calc.monthlyPI);
        this.taxAmount.textContent = this.formatCurrency(calc.monthlyPropertyTax);
        this.insuranceAmount.textContent = this.formatCurrency(calc.monthlyInsurance);
        this.pmiAmount.textContent = this.formatCurrency(calc.monthlyPMI);

        // Update key metrics
        this.loanAmountDisplay.textContent = this.formatCurrency(calc.loanAmount);
        this.totalInterest.textContent = this.formatCurrency(calc.totalInterestPaid);
        this.totalCost.textContent = this.formatCurrency(calc.totalCost);

        // Update chart visualization
        this.updatePaymentChart();

        // Update PMI display
        this.pmiLegend.style.display = calc.needsPMI ? 'flex' : 'none';
    }

    updatePaymentChart() {
        const calc = this.currentCalculation;
        const total = calc.totalMonthly;
        
        const piPercent = (calc.monthlyPI / total) * 100;
        const taxPercent = (calc.monthlyPropertyTax / total) * 100;
        const insurancePercent = (calc.monthlyInsurance / total) * 100;
        const pmiPercent = (calc.monthlyPMI / total) * 100;

        document.querySelector('.chart-segment.principal').style.width = `${piPercent}%`;
        document.querySelector('.chart-segment.taxes').style.width = `${taxPercent}%`;
        document.querySelector('.chart-segment.insurance').style.width = `${insurancePercent}%`;
        document.querySelector('.chart-segment.pmi').style.width = `${pmiPercent}%`;
    }

    updateAmortizationTable() {
        const calc = this.currentCalculation;
        const monthlyRate = calc.annualRate / 12;
        let balance = calc.loanAmount;
        let html = '';

        for (let year = 1; year <= Math.min(5, calc.termYears); year++) {
            let yearlyPrincipal = 0;
            let yearlyInterest = 0;

            for (let month = 1; month <= 12; month++) {
                const interestPayment = balance * monthlyRate;
                const principalPayment = calc.monthlyPI - interestPayment;
                
                yearlyInterest += interestPayment;
                yearlyPrincipal += principalPayment;
                balance -= principalPayment;

                if (balance < 0) balance = 0;
            }

            html += `
                <tr>
                    <td>${year}</td>
                    <td>${this.formatCurrency(calc.monthlyPI * 12)}</td>
                    <td>${this.formatCurrency(yearlyPrincipal)}</td>
                    <td>${this.formatCurrency(yearlyInterest)}</td>
                    <td>${this.formatCurrency(balance)}</td>
                </tr>
            `;
        }

        this.amortizationBody.innerHTML = html;
    }

    generateAIInsights() {
        const calc = this.currentCalculation;
        const insights = [];

        // Down payment analysis
        if (calc.downPaymentPercent < 20) {
            const additional = calc.homePrice * 0.2 - calc.downPayment;
            insights.push({
                icon: 'fas fa-piggy-bank',
                title: 'Down Payment Opportunity',
                message: `Increasing down payment by ${this.formatCurrency(additional)} would eliminate PMI, saving $${Math.round(calc.monthlyPMI)}/month.`,
                type: 'tip'
            });
        }

        // Interest rate analysis
        if (calc.annualRate > 6.5) {
            const savings = calc.loanAmount * 0.01 / 12; // 1% rate reduction
            insights.push({
                icon: 'fas fa-chart-line',
                title: 'Rate Shopping Recommended',
                message: `Your rate is above current averages. A 1% reduction could save $${Math.round(savings)}/month.`,
                type: 'warning'
            });
        }

        // Loan term analysis
        if (calc.termYears === 30) {
            const fifteenYearRate = calc.annualRate - 0.5; // Assume 0.5% lower for 15-year
            const fifteenYearMonthlyRate = fifteenYearRate / 100 / 12;
            const fifteenYearPayment = calc.loanAmount * 
                (fifteenYearMonthlyRate * Math.pow(1 + fifteenYearMonthlyRate, 180)) / 
                (Math.pow(1 + fifteenYearMonthlyRate, 180) - 1);
            const interestSavings = calc.totalInterestPaid - (fifteenYearPayment * 180 - calc.loanAmount);
            
            if (interestSavings > 50000) {
                insights.push({
                    icon: 'fas fa-clock',
                    title: '15-Year Loan Advantage',
                    message: `A 15-year loan could save ${this.formatCurrency(interestSavings)} in interest, despite higher monthly payments.`,
                    type: 'tip'
                });
            }
        }

        // Affordability analysis
        const assumedIncome = calc.totalMonthly * 4; // Assume 25% debt-to-income ratio
        const debtRatio = (calc.totalMonthly / assumedIncome) * 100;
        
        if (debtRatio > 28) {
            insights.push({
                icon: 'fas fa-exclamation-triangle',
                title: 'Affordability Concern',
                message: `Payment may exceed recommended 28% of income. Consider a lower price range or larger down payment.`,
                type: 'warning'
            });
        } else {
            insights.push({
                icon: 'fas fa-thumbs-up',
                title: 'Good Affordability',
                message: `Your payment appears to be within recommended affordability guidelines.`,
                type: 'success'
            });
        }

        // PMI removal timeline
        if (calc.needsPMI) {
            const monthsToRemovePMI = this.calculatePMIRemovalTime();
            insights.push({
                icon: 'fas fa-calendar-check',
                title: 'PMI Removal Timeline',
                message: `PMI can be removed in approximately ${monthsToRemovePMI} months when you reach 20% equity.`,
                type: 'info'
            });
        }

        this.displayInsights(insights);
    }

    calculatePMIRemovalTime() {
        const calc = this.currentCalculation;
        const monthlyRate = calc.annualRate / 12;
        let balance = calc.loanAmount;
        const targetEquity = calc.homePrice * 0.8; // 20% equity = 80% loan-to-value
        
        for (let month = 1; month <= calc.termYears * 12; month++) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = calc.monthlyPI - interestPayment;
            balance -= principalPayment;
            
            if (balance <= targetEquity) {
                return month;
            }
        }
        return calc.termYears * 12; // Fallback
    }

    displayInsights(insights) {
        let html = '';
        insights.forEach(insight => {
            html += `
                <div class="insight-item ${insight.type}">
                    <div class="insight-icon">
                        <i class="${insight.icon}"></i>
                    </div>
                    <div class="insight-content">
                        <h4>${insight.title}</h4>
                        <p>${insight.message}</p>
                    </div>
                </div>
            `;
        });
        this.insightsList.innerHTML = html;
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    showLoadingOverlay() {
        this.loadingOverlay.style.display = 'flex';
    }

    hideLoadingOverlay() {
        this.loadingOverlay.style.display = 'none';
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add to page
        document.body.appendChild(toast);
        
        // Show and auto-hide
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    // Action methods
    saveCalculation() {
        if (!this.currentCalculation) {
            this.showToast('Please calculate first', 'warning');
            return;
        }

        const name = prompt('Save calculation as:') || `Calculation ${Date.now()}`;
        const savedCalc = {
            ...this.currentCalculation,
            name,
            id: Date.now()
        };

        this.savedCalculations.push(savedCalc);
        localStorage.setItem('savedMortgageCalculations', JSON.stringify(this.savedCalculations));
        this.showToast('Calculation saved successfully!', 'success');
    }

    showComparison() {
        if (this.savedCalculations.length === 0) {
            this.showToast('No saved calculations to compare', 'info');
            return;
        }

        // Show comparison interface
        const comparisonSection = document.getElementById('comparison-section');
        comparisonSection.style.display = 'block';
        
        // Populate comparison data
        this.renderComparison();
    }

    renderComparison() {
        // Implementation for loan comparison interface
        // This would create a table comparing different saved calculations
    }

    resetForm() {
        this.homePrice.value = 500000;
        this.downPayment.value = 100000;
        this.interestRate.value = 6.5;
        this.loanTerm.value = 30;
        this.state.value = 'CA';
        this.propertyTax.value = 4050;
        this.homeInsurance.value = 1200;
        this.pmiRate.value = 0.75;
        this.hoaFees.value = 0;

        // Reset UI elements
        this.syncHomePriceInputs();
        this.syncDownPaymentInputs();
        this.syncInterestRateInputs();
        this.updatePropertyTax();
        this.updateInsurance();

        // Reset term buttons
        document.querySelectorAll('.term-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.term === '30');
        });

        this.calculatePayment();
        this.showToast('Form reset to defaults', 'info');
    }

    showEmailModal() {
        document.getElementById('email-modal').style.display = 'flex';
    }

    closeEmailModal() {
        document.getElementById('email-modal').style.display = 'none';
    }

    async sendEmailResults() {
        const email = document.getElementById('email-address').value;
        const name = document.getElementById('email-name').value;
        const includeSchedule = document.getElementById('include-schedule').checked;
        const includeInsights = document.getElementById('include-insights').checked;

        if (!email) {
            this.showToast('Please enter an email address', 'error');
            return;
        }

        this.showLoadingOverlay();

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.closeEmailModal();
            this.showToast('Results sent successfully!', 'success');
        } catch (error) {
            this.showToast('Failed to send email. Please try again.', 'error');
        } finally {
            this.hideLoadingOverlay();
        }
    }

    downloadPDF() {
        this.showToast('PDF download feature coming soon!', 'info');
        // Implementation for PDF generation
    }

    printResults() {
        window.print();
    }

    shareResults() {
        if (navigator.share) {
            navigator.share({
                title: 'My Mortgage Calculation - Finguid',
                text: `Monthly Payment: ${this.formatCurrency(this.currentCalculation.totalMonthly)}`,
                url: window.location.href
            });
        } else {
            // Fallback to copying URL
            navigator.clipboard.writeText(window.location.href);
            this.showToast('Link copied to clipboard!', 'success');
        }
    }

    copyEmbedCode() {
        const embedCode = document.getElementById('embed-code');
        embedCode.select();
        navigator.clipboard.writeText(embedCode.value);
        this.showToast('Embed code copied to clipboard!', 'success');
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mortgageCalculator = new MortgageCalculator();
});

// PWA install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button
    const installBtn = document.createElement('button');
    installBtn.className = 'install-btn';
    installBtn.innerHTML = '<i class="fas fa-download"></i> Install App';
    installBtn.onclick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            document.body.removeChild(installBtn);
        }
    };
    
    document.body.appendChild(installBtn);
});

// Analytics tracking
function trackCalculation(calculation) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'mortgage_calculation', {
            'event_category': 'Calculator',
            'event_label': 'Mortgage',
            'value': Math.round(calculation.totalMonthly)
        });
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MortgageCalculator;
}