// Advanced Mortgage Calculator with AI Features
// State-specific data, PMI calculations, and comprehensive analysis

class AdvancedMortgageCalculator {
    constructor() {
        this.stateData = null;
        this.currentCalculation = null;
        this.savedCalculations = JSON.parse(localStorage.getItem('finguid_calculations') || '[]');
        this.initializeElements();
        this.bindEvents();
        this.loadStateData();
        this.initializeVoice();
    }

    initializeElements() {
        // Input elements
        this.elements = {
            homePrice: document.getElementById('home-price'),
            homePriceRange: document.getElementById('home-price-range'),
            downPayment: document.getElementById('down-payment'),
            downPaymentRange: document.getElementById('down-payment-range'),
            downPaymentPercent: document.getElementById('down-payment-percent'),
            interestRate: document.getElementById('interest-rate'),
            interestRateRange: document.getElementById('interest-rate-range'),
            loanTerm: document.getElementById('loan-term'),
            state: document.getElementById('state'),
            creditScore: document.getElementById('credit-score'),
            extraPayment: document.getElementById('extra-payment'),
            
            // Voice elements
            voiceBtn: document.getElementById('voice-btn'),
            voiceStatus: document.getElementById('voice-status'),
            
            // Action buttons
            calculateBtn: document.getElementById('calculate-btn'),
            saveBtn: document.getElementById('save-btn'),
            emailBtn: document.getElementById('email-btn'),
            printBtn: document.getElementById('print-btn'),
            compareBtn: document.getElementById('compare-btn'),
            
            // Result elements
            monthlyPayment: document.getElementById('monthly-payment'),
            piAmount: document.getElementById('pi-amount'),
            taxesAmount: document.getElementById('taxes-amount'),
            insuranceAmount: document.getElementById('insurance-amount'),
            pmiAmount: document.getElementById('pmi-amount'),
            pmiLegend: document.getElementById('pmi-legend'),
            
            // Chart elements
            chartPrincipal: document.getElementById('chart-principal'),
            chartInterest: document.getElementById('chart-interest'),
            chartTaxes: document.getElementById('chart-taxes'),
            chartInsurance: document.getElementById('chart-insurance'),
            chartPmi: document.getElementById('chart-pmi'),
            
            // Table and insights
            amortizationTable: document.getElementById('amortization-table'),
            insightsContainer: document.getElementById('insights-container')
        };
    }

    bindEvents() {
        // Sync inputs with ranges
        this.syncInputs();
        
        // Calculate on input change
        ['input', 'change'].forEach(event => {
            [this.elements.homePrice, this.elements.downPayment, this.elements.interestRate, 
             this.elements.loanTerm, this.elements.state, this.elements.creditScore, 
             this.elements.extraPayment].forEach(element => {
                element.addEventListener(event, () => this.calculateMortgage());
            });
        });

        // Button events
        this.elements.calculateBtn.addEventListener('click', () => this.calculateMortgage());
        this.elements.saveBtn.addEventListener('click', () => this.saveCalculation());
        this.elements.emailBtn.addEventListener('click', () => this.emailResults());
        this.elements.printBtn.addEventListener('click', () => this.printResults());
        this.elements.compareBtn.addEventListener('click', () => this.openComparison());
        this.elements.voiceBtn.addEventListener('click', () => this.startVoiceInput());
        
        // Auto-calculate on page load
        setTimeout(() => this.calculateMortgage(), 100);
    }

    syncInputs() {
        // Home Price sync
        this.elements.homePrice.addEventListener('input', () => {
            this.elements.homePriceRange.value = this.elements.homePrice.value;
            this.updateDownPaymentMax();
        });
        
        this.elements.homePriceRange.addEventListener('input', () => {
            this.elements.homePrice.value = this.elements.homePriceRange.value;
            this.updateDownPaymentMax();
        });

        // Down Payment sync
        this.elements.downPayment.addEventListener('input', () => {
            const percent = (this.elements.downPayment.value / this.elements.homePrice.value) * 100;
            this.elements.downPaymentRange.value = Math.min(percent, 50);
            this.elements.downPaymentPercent.textContent = Math.round(percent) + '%';
        });
        
        this.elements.downPaymentRange.addEventListener('input', () => {
            const amount = Math.round((this.elements.homePrice.value * this.elements.downPaymentRange.value) / 100);
            this.elements.downPayment.value = amount;
            this.elements.downPaymentPercent.textContent = this.elements.downPaymentRange.value + '%';
        });

        // Interest Rate sync
        this.elements.interestRate.addEventListener('input', () => {
            this.elements.interestRateRange.value = this.elements.interestRate.value;
        });
        
        this.elements.interestRateRange.addEventListener('input', () => {
            this.elements.interestRate.value = this.elements.interestRateRange.value;
        });
    }

    updateDownPaymentMax() {
        const homePrice = parseFloat(this.elements.homePrice.value);
        this.elements.downPayment.max = homePrice;
        
        // Update percentage display
        const currentPercent = (this.elements.downPayment.value / homePrice) * 100;
        this.elements.downPaymentPercent.textContent = Math.round(currentPercent) + '%';
    }

    async loadStateData() {
        try {
            const response = await fetch('/data/state-tax-rates.json');
            this.stateData = await response.json();
            this.populateStates();
        } catch (error) {
            console.error('Failed to load state data:', error);
            // Fallback to default data
            this.stateData = this.getDefaultStateData();
        }
    }

    populateStates() {
        const stateSelect = this.elements.state;
        stateSelect.innerHTML = '';
        
        if (this.stateData && this.stateData.states) {
            Object.entries(this.stateData.states).forEach(([code, data]) => {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = data.name;
                stateSelect.appendChild(option);
            });
        }
    }

    getDefaultStateData() {
        return {
            states: {
                'CA': {
                    name: 'California',
                    property_tax_rate: 0.0075,
                    average_insurance: 1200,
                    pmi_rates: { excellent: 0.005, good: 0.0065, fair: 0.0085, poor: 0.012 }
                },
                'TX': {
                    name: 'Texas',
                    property_tax_rate: 0.0181,
                    average_insurance: 1800,
                    pmi_rates: { excellent: 0.0048, good: 0.0062, fair: 0.008, poor: 0.0115 }
                },
                'NY': {
                    name: 'New York',
                    property_tax_rate: 0.0123,
                    average_insurance: 1400,
                    pmi_rates: { excellent: 0.0052, good: 0.0067, fair: 0.0087, poor: 0.0125 }
                },
                'FL': {
                    name: 'Florida',
                    property_tax_rate: 0.0089,
                    average_insurance: 2000,
                    pmi_rates: { excellent: 0.0051, good: 0.0066, fair: 0.0086, poor: 0.0123 }
                },
                'WA': {
                    name: 'Washington',
                    property_tax_rate: 0.0092,
                    average_insurance: 900,
                    pmi_rates: { excellent: 0.0049, good: 0.0064, fair: 0.0084, poor: 0.012 }
                }
            }
        };
    }

    calculateMortgage() {
        const homePrice = parseFloat(this.elements.homePrice.value) || 0;
        const downPayment = parseFloat(this.elements.downPayment.value) || 0;
        const annualRate = parseFloat(this.elements.interestRate.value) / 100 || 0;
        const loanTermYears = parseInt(this.elements.loanTerm.value) || 30;
        const selectedState = this.elements.state.value || 'CA';
        const creditScore = this.elements.creditScore.value || 'good';
        const extraPayment = parseFloat(this.elements.extraPayment.value) || 0;

        // Basic validations
        if (homePrice < 50000 || downPayment < 0 || annualRate < 0) {
            this.showError('Please enter valid values for all fields.');
            return;
        }

        // Calculate loan amount
        const loanAmount = homePrice - downPayment;
        
        if (loanAmount <= 0) {
            this.showError('Down payment cannot be greater than or equal to home price.');
            return;
        }

        // Get state-specific data
        const stateInfo = this.stateData?.states?.[selectedState] || this.getDefaultStateData().states['CA'];
        
        // Calculate monthly values
        const monthlyRate = annualRate / 12;
        const totalMonths = loanTermYears * 12;
        
        // Monthly Principal & Interest
        let monthlyPI;
        if (monthlyRate === 0) {
            monthlyPI = loanAmount / totalMonths;
        } else {
            monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                       (Math.pow(1 + monthlyRate, totalMonths) - 1);
        }

        // Calculate PMI
        const ltv = (loanAmount / homePrice) * 100;
        const monthlyPMI = this.calculatePMI(loanAmount, homePrice, creditScore, stateInfo);

        // Calculate property tax and insurance
        const monthlyPropertyTax = (homePrice * stateInfo.property_tax_rate) / 12;
        const monthlyInsurance = stateInfo.average_insurance / 12;

        // Total monthly payment
        const totalMonthly = monthlyPI + monthlyPMI + monthlyPropertyTax + monthlyInsurance;

        // Store current calculation
        this.currentCalculation = {
            homePrice,
            downPayment,
            loanAmount,
            annualRate,
            monthlyRate,
            loanTermYears,
            totalMonths,
            monthlyPI,
            monthlyPMI,
            monthlyPropertyTax,
            monthlyInsurance,
            totalMonthly,
            extraPayment,
            ltv,
            selectedState,
            creditScore,
            stateInfo,
            timestamp: new Date().toISOString()
        };

        // Update display
        this.updateResults();
        this.updateChart();
        this.generateAmortizationTable();
        this.generateAIInsights();

        // Track calculation
        this.trackCalculation();
    }

    calculatePMI(loanAmount, homeValue, creditScore, stateInfo) {
        const ltv = (loanAmount / homeValue) * 100;
        
        // No PMI if LTV <= 80%
        if (ltv <= 80) return 0;
        
        // Get PMI rate based on credit score
        const pmiRate = stateInfo.pmi_rates?.[creditScore] || 0.008;
        
        // Annual PMI / 12 months
        return (loanAmount * pmiRate) / 12;
    }

    updateResults() {
        const calc = this.currentCalculation;
        
        // Update main values
        this.elements.monthlyPayment.textContent = this.formatCurrency(calc.totalMonthly);
        this.elements.piAmount.textContent = this.formatCurrency(calc.monthlyPI);
        this.elements.taxesAmount.textContent = this.formatCurrency(calc.monthlyPropertyTax);
        this.elements.insuranceAmount.textContent = this.formatCurrency(calc.monthlyInsurance);
        
        // Show/hide PMI
        if (calc.monthlyPMI > 0) {
            this.elements.pmiAmount.textContent = this.formatCurrency(calc.monthlyPMI);
            this.elements.pmiLegend.style.display = 'flex';
        } else {
            this.elements.pmiLegend.style.display = 'none';
        }
    }

    updateChart() {
        const calc = this.currentCalculation;
        const total = calc.monthlyPI + calc.monthlyPMI + calc.monthlyPropertyTax + calc.monthlyInsurance;
        
        // Calculate percentages
        const piPercent = (calc.monthlyPI / total) * 100;
        const pmiPercent = (calc.monthlyPMI / total) * 100;
        const taxPercent = (calc.monthlyPropertyTax / total) * 100;
        const insPercent = (calc.monthlyInsurance / total) * 100;
        
        // Update chart segments
        this.elements.chartPrincipal.style.width = piPercent + '%';
        this.elements.chartPmi.style.width = pmiPercent + '%';
        this.elements.chartTaxes.style.width = taxPercent + '%';
        this.elements.chartInsurance.style.width = insPercent + '%';
        this.elements.chartInterest.style.width = '0%'; // Interest is part of P&I
    }

    generateAmortizationTable() {
        const calc = this.currentCalculation;
        const tbody = this.elements.amortizationTable.querySelector('tbody');
        tbody.innerHTML = '';

        let balance = calc.loanAmount;
        
        for (let year = 1; year <= Math.min(5, calc.loanTermYears); year++) {
            let yearlyPrincipal = 0;
            let yearlyInterest = 0;
            
            for (let month = 1; month <= 12 && balance > 0; month++) {
                const interestPayment = balance * calc.monthlyRate;
                const principalPayment = Math.min(calc.monthlyPI - interestPayment + calc.extraPayment, balance);
                
                yearlyPrincipal += principalPayment;
                yearlyInterest += interestPayment;
                balance -= principalPayment;
                
                if (balance < 0) balance = 0;
            }
            
            const row = tbody.insertRow();
            row.innerHTML = `
                <td style="text-align: center;">${year}</td>
                <td>${this.formatCurrency(yearlyPrincipal)}</td>
                <td>${this.formatCurrency(yearlyInterest)}</td>
                <td>${this.formatCurrency(balance)}</td>
            `;
        }
    }

    generateAIInsights() {
        const calc = this.currentCalculation;
        const insights = [];

        // PMI Insight
        if (calc.monthlyPMI > 0) {
            const pmiRemovalDate = this.calculatePMIRemovalTime(calc);
            insights.push({
                icon: 'fa-shield-alt',
                title: 'PMI Elimination Strategy',
                content: `You're paying $${Math.round(calc.monthlyPMI)}/month in PMI. ${pmiRemovalDate.message}`,
                type: 'info'
            });
        }

        // Affordability Check
        const assumedIncome = calc.homePrice / 3; // Conservative estimate
        const dtiRatio = (calc.totalMonthly * 12) / assumedIncome;
        
        if (dtiRatio <= 0.28) {
            insights.push({
                icon: 'fa-thumbs-up',
                title: 'Excellent Affordability',
                content: `Your payment represents ${Math.round(dtiRatio * 100)}% of estimated income, well within the recommended 28% range.`,
                type: 'success'
            });
        } else if (dtiRatio > 0.36) {
            insights.push({
                icon: 'fa-exclamation-triangle',
                title: 'Affordability Warning',
                content: `This payment may be too high for your income. Consider a lower price range or larger down payment.`,
                type: 'warning'
            });
        }

        // Extra Payment Benefits
        if (calc.extraPayment === 0) {
            const extraBenefit = this.calculateExtraPaymentBenefit(calc, 200);
            insights.push({
                icon: 'fa-piggy-bank',
                title: 'Extra Payment Opportunity',
                content: `Paying an extra $200/month could save you $${Math.round(extraBenefit.interestSaved).toLocaleString()} and ${extraBenefit.timeSaved} years.`,
                type: 'tip'
            });
        }

        // Interest Rate Insight
        if (calc.annualRate > 0.07) {
            insights.push({
                icon: 'fa-chart-line',
                title: 'Rate Shopping Recommended',
                content: `Your rate is above current market averages. Shopping for a better rate could save you thousands.`,
                type: 'warning'
            });
        }

        // Term Optimization
        if (calc.loanTermYears === 30) {
            const term15Benefit = this.calculateTermComparison(calc, 15);
            insights.push({
                icon: 'fa-clock',
                title: '15-Year Loan Comparison',
                content: `A 15-year loan would cost $${Math.round(term15Benefit.monthlyDiff)} more monthly but save $${Math.round(term15Benefit.totalSavings).toLocaleString()} total.`,
                type: 'tip'
            });
        }

        this.displayInsights(insights);
    }

    calculatePMIRemovalTime(calc) {
        if (calc.monthlyPMI === 0) return { months: 0, message: "No PMI required." };
        
        let balance = calc.loanAmount;
        let months = 0;
        const targetLTV = 0.78; // PMI typically removed at 78% LTV
        const targetBalance = calc.homePrice * targetLTV;
        
        while (balance > targetBalance && months < calc.totalMonths) {
            const interestPayment = balance * calc.monthlyRate;
            const principalPayment = calc.monthlyPI - interestPayment + calc.extraPayment;
            balance -= principalPayment;
            months++;
        }
        
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        
        if (years > 0) {
            return {
                months,
                message: `PMI will be removed in approximately ${years} years and ${remainingMonths} months.`
            };
        } else {
            return {
                months,
                message: `PMI will be removed in approximately ${months} months.`
            };
        }
    }

    calculateExtraPaymentBenefit(calc, extraAmount) {
        // Calculate with extra payment
        let balance = calc.loanAmount;
        let totalInterest = 0;
        let months = 0;
        
        while (balance > 0.01 && months < calc.totalMonths) {
            const interestPayment = balance * calc.monthlyRate;
            const principalPayment = Math.min(calc.monthlyPI + extraAmount - interestPayment, balance);
            
            totalInterest += interestPayment;
            balance -= principalPayment;
            months++;
        }
        
        // Calculate without extra payment
        const originalTotalInterest = (calc.monthlyPI * calc.totalMonths) - calc.loanAmount;
        
        return {
            interestSaved: originalTotalInterest - totalInterest,
            timeSaved: Math.round((calc.totalMonths - months) / 12 * 10) / 10
        };
    }

    calculateTermComparison(calc, newTermYears) {
        const newTotalMonths = newTermYears * 12;
        const newMonthlyPI = calc.loanAmount * 
            (calc.monthlyRate * Math.pow(1 + calc.monthlyRate, newTotalMonths)) / 
            (Math.pow(1 + calc.monthlyRate, newTotalMonths) - 1);
        
        const originalTotalCost = calc.monthlyPI * calc.totalMonths;
        const newTotalCost = newMonthlyPI * newTotalMonths;
        
        return {
            monthlyDiff: newMonthlyPI - calc.monthlyPI,
            totalSavings: originalTotalCost - newTotalCost
        };
    }

    displayInsights(insights) {
        let html = '';
        
        insights.forEach(insight => {
            const typeClass = insight.type === 'success' ? 'success' : 
                            insight.type === 'warning' ? 'warning' : 
                            insight.type === 'tip' ? 'info' : 'info';
            
            html += `
                <div class="insight-item">
                    <div class="insight-icon">
                        <i class="fas ${insight.icon}"></i>
                    </div>
                    <div class="insight-content">
                        <h4>${insight.title}</h4>
                        <p>${insight.content}</p>
                    </div>
                </div>
            `;
        });
        
        this.elements.insightsContainer.innerHTML = html;
    }

    // Voice Recognition
    initializeVoice() {
        this.recognition = null;
        
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
        } else if ('SpeechRecognition' in window) {
            this.recognition = new SpeechRecognition();
        }
        
        if (this.recognition) {
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                this.processVoiceCommand(transcript);
            };
            
            this.recognition.onerror = (event) => {
                this.elements.voiceStatus.textContent = 'Voice recognition error: ' + event.error;
                this.resetVoiceButton();
            };
            
            this.recognition.onend = () => {
                this.resetVoiceButton();
            };
        } else {
            this.elements.voiceBtn.style.display = 'none';
            this.elements.voiceStatus.textContent = 'Voice input not supported';
        }
    }

    startVoiceInput() {
        if (!this.recognition) return;
        
        this.elements.voiceStatus.textContent = 'Listening... (try "set home price 500000" or "calculate")';
        this.elements.voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
        this.elements.voiceBtn.style.background = 'var(--color-error)';
        
        this.recognition.start();
    }

    resetVoiceButton() {
        this.elements.voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        this.elements.voiceBtn.style.background = 'var(--color-primary)';
        this.elements.voiceStatus.textContent = 'Voice input ready';
    }

    processVoiceCommand(transcript) {
        console.log('Voice command:', transcript);
        
        // Extract numbers from transcript
        const numbers = transcript.match(/\d+/g);
        
        if (transcript.includes('home price') || transcript.includes('house price')) {
            if (numbers && numbers[0]) {
                this.elements.homePrice.value = numbers[0];
                this.elements.homePriceRange.value = numbers[0];
                this.updateDownPaymentMax();
                this.elements.voiceStatus.textContent = `Set home price to $${numbers[0]}`;
            }
        } else if (transcript.includes('down payment')) {
            if (numbers && numbers[0]) {
                this.elements.downPayment.value = numbers[0];
                this.elements.voiceStatus.textContent = `Set down payment to $${numbers[0]}`;
            }
        } else if (transcript.includes('interest rate') || transcript.includes('rate')) {
            if (numbers && numbers[0]) {
                const rate = parseFloat(numbers[0]);
                if (rate < 20) { // Assume percentage
                    this.elements.interestRate.value = rate;
                    this.elements.interestRateRange.value = rate;
                    this.elements.voiceStatus.textContent = `Set interest rate to ${rate}%`;
                }
            }
        } else if (transcript.includes('calculate') || transcript.includes('compute')) {
            this.calculateMortgage();
            this.elements.voiceStatus.textContent = 'Calculation completed!';
        } else if (transcript.includes('reset')) {
            this.resetForm();
            this.elements.voiceStatus.textContent = 'Form reset';
        } else {
            this.elements.voiceStatus.textContent = 'Try: "set home price 500000", "set rate 6.5", or "calculate"';
        }
        
        // Auto-calculate after voice input
        setTimeout(() => this.calculateMortgage(), 500);
    }

    // Utility functions
    formatCurrency(amount) {
        return '$' + Math.round(amount).toLocaleString();
    }

    formatPercent(decimal) {
        return (decimal * 100).toFixed(2) + '%';
    }

    showError(message) {
        // Create or update error display
        let errorDiv = document.getElementById('error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'error-message';
            errorDiv.className = 'alert alert-error';
            errorDiv.style.margin = '1rem 0';
            this.elements.calculateBtn.parentNode.insertBefore(errorDiv, this.elements.calculateBtn.nextSibling);
        }
        
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    // Action functions
    saveCalculation() {
        if (!this.currentCalculation) {
            alert('Please calculate first before saving.');
            return;
        }
        
        const calculation = {
            ...this.currentCalculation,
            id: Date.now(),
            name: `Home $${Math.round(this.currentCalculation.homePrice / 1000)}K - ${this.currentCalculation.annualRate * 100}%`
        };
        
        this.savedCalculations.unshift(calculation);
        if (this.savedCalculations.length > 10) {
            this.savedCalculations = this.savedCalculations.slice(0, 10);
        }
        
        localStorage.setItem('finguid_calculations', JSON.stringify(this.savedCalculations));
        
        // Show success message
        this.elements.saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        setTimeout(() => {
            this.elements.saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
        }, 2000);
    }

    emailResults() {
        if (!this.currentCalculation) {
            alert('Please calculate first before emailing.');
            return;
        }
        
        const calc = this.currentCalculation;
        const subject = `Mortgage Calculation Results - $${Math.round(calc.homePrice / 1000)}K home`;
        const body = `
Mortgage Calculation Results from Finguid:

Home Price: ${this.formatCurrency(calc.homePrice)}
Down Payment: ${this.formatCurrency(calc.downPayment)} (${Math.round((calc.downPayment/calc.homePrice)*100)}%)
Loan Amount: ${this.formatCurrency(calc.loanAmount)}
Interest Rate: ${(calc.annualRate * 100).toFixed(2)}%
Loan Term: ${calc.loanTermYears} years

Monthly Payment Breakdown:
- Principal & Interest: ${this.formatCurrency(calc.monthlyPI)}
- Property Tax: ${this.formatCurrency(calc.monthlyPropertyTax)}
- Insurance: ${this.formatCurrency(calc.monthlyInsurance)}
- PMI: ${this.formatCurrency(calc.monthlyPMI)}
- Total Monthly Payment: ${this.formatCurrency(calc.totalMonthly)}

Calculate your own at: https://finguid.com/mortgage-calculator
        `.trim();
        
        const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailto;
    }

    printResults() {
        window.print();
    }

    openComparison() {
        if (this.savedCalculations.length === 0) {
            alert('No saved calculations to compare. Save some calculations first!');
            return;
        }
        
        // This would open a comparison modal/page
        console.log('Opening comparison with saved calculations:', this.savedCalculations);
        alert('Comparison feature will open a detailed side-by-side view of your saved calculations.');
    }

    resetForm() {
        this.elements.homePrice.value = 500000;
        this.elements.downPayment.value = 100000;
        this.elements.interestRate.value = 6.5;
        this.elements.loanTerm.value = 30;
        this.elements.state.value = 'CA';
        this.elements.creditScore.value = 'good';
        this.elements.extraPayment.value = 0;
        
        // Reset ranges
        this.elements.homePriceRange.value = 500000;
        this.elements.downPaymentRange.value = 20;
        this.elements.interestRateRange.value = 6.5;
        this.elements.downPaymentPercent.textContent = '20%';
        
        this.calculateMortgage();
    }

    trackCalculation() {
        // Google Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'calculator_use', {
                event_category: 'Calculator',
                event_label: 'Mortgage Calculator',
                value: Math.round(this.currentCalculation.homePrice / 1000)
            });
        }
        
        // Track for AI training
        const calculationData = {
            timestamp: new Date().toISOString(),
            home_price: this.currentCalculation.homePrice,
            down_payment_percent: Math.round((this.currentCalculation.downPayment / this.currentCalculation.homePrice) * 100),
            interest_rate: this.currentCalculation.annualRate * 100,
            loan_term: this.currentCalculation.loanTermYears,
            state: this.currentCalculation.selectedState,
            credit_score: this.currentCalculation.creditScore,
            monthly_payment: this.currentCalculation.totalMonthly
        };
        
        // Send to analytics endpoint (implement based on your needs)
        console.log('Calculation tracked:', calculationData);
    }
}

// Utility functions for embed and sharing
function copyEmbed() {
    const embedCode = document.getElementById('embed-code');
    embedCode.select();
    document.execCommand('copy');
    
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    setTimeout(() => {
        button.textContent = originalText;
    }, 2000);
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.mortgageCalculator = new AdvancedMortgageCalculator();
    
    // Performance monitoring
    const loadTime = performance.now();
    console.log(`Mortgage calculator loaded in ${Math.round(loadTime)}ms`);
    
    // Track load time for optimization
    if (typeof gtag !== 'undefined') {
        gtag('event', 'timing_complete', {
            name: 'calculator_load',
            value: Math.round(loadTime)
        });
    }
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
            console.log('SW registered: ', registration);
        }).catch(function(registrationError) {
            console.log('SW registration failed: ', registrationError);
        });
    });
}
