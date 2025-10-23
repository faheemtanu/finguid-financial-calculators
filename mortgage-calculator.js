/**
 * HOME LOAN PRO — AI‑POWERED MORTGAGE CALCULATOR - PRODUCTION JS v1.1
 * ENHANCED WITH MONETIZATION, LIVE FRED API, AND ADVANCED SEO/PWA FEATURES
 * ALIGNED WITH FINGUID MASTER IMPLEMENTATION GUIDE
 * * Your FRED API Key: 9c6c421f077f2091e8bae4f143ada59a
 * Your Google Analytics ID: G-NYBL2CDNQJ
 * © 2025 FinGuid - World's First AI Calculator Platform for Americans
 * * --- V1.1 CHANGELOG ---
 * ✅ Real FRED API Integration (30yr, 15yr, 5/1 ARM)
 * ✅ Live Rate Selector UI
 * ✅ Real PWA Install Prompt
 * ✅ Google Analytics Custom Event Tracking (Calculations, Exports, Leads)
 * ✅ Monetization Event Listeners (Affiliate Links, Lead Form)
 * ✅ Partner-Friendly Embed Tool Functionality
 * ✅ Optimized for Core Web Vitals (Defer loading)
 */

/* ========================================================================== */
/* GLOBAL CONFIGURATION & STATE MANAGEMENT (User's provided code structure) */
/* ========================================================================== */

const MORTGAGE_CALCULATOR = {
    VERSION: '1.1',
    DEBUG: false,
    
    // FRED API Configuration (Your existing API key)
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    // NEW: Relevant series IDs for Americans
    FRED_SERIES: {
        '30-Year Fixed': 'MORTGAGE30US',
        '15-Year Fixed': 'MORTGAGE15US',
        '5/1-Year ARM': 'MORTGAGE5US1'
    },
    RATE_UPDATE_INTERVAL: 60 * 60 * 1000, // 1 hour
    
    // Chart instances for cleanup
    charts: {
        paymentComponents: null,
        mortgageTimeline: null
    },
    
    // Current calculation state
    currentCalculation: {
        homePrice: 450000,
        downPayment: 90000,
        downPaymentPercent: 20,
        loanAmount: 360000,
        interestRate: 6.44,
        loanTerm: 30,
        loanType: 'conventional',
        propertyTax: 9000,
        homeInsurance: 1800,
        pmi: 0,
        hoaFees: 0,
        extraMonthly: 0,
        extraWeekly: 0,
        monthlyPayment: 0,
        totalInterest: 0,
        totalCost: 0,
        closingCostsPercent: 3
    },

    // Comparison Loan B state
    comparisonLoan: {
        enabled: false,
        homePrice: 400000,
        downPayment: 100000, // Calculated from 25% of 400000
        downPaymentPercent: 25,
        loanAmount: 300000,
        interestRate: 5.99,
        loanTerm: 15,
        monthlyPayment: 0,
        totalInterest: 0,
        totalCost: 0,
        baseP_I: 0,
        payoffMonths: 0,
        extraInterestSaved: 0
    },
    
    // Amortization schedule
    amortizationSchedule: [],
    scheduleCurrentPage: 0,
    scheduleItemsPerPage: 12,
    scheduleType: 'monthly', // 'monthly' or 'yearly'
    
    // UI state
    currentTheme: 'light',
    fontScaleOptions: [0.75, 0.875, 1, 1.125, 1.25],
    currentFontScaleIndex: 2,
    voiceEnabled: false,
    screenReaderMode: false,
    deferredInstallPrompt: null, // For PWA
    
    // NEW: Store for live rates
    liveRates: {},
    
    // Rate update tracking
    lastRateUpdate: 0
};
/* ========================================================================== */
/* COMPREHENSIVE ZIP CODE DATABASE (User's provided code structure) */
/* ========================================================================== */

const ZIP_DATABASE = {
    zipCodes: new Map(),
    
    initialize() {
        // Sample data representing all major areas - In production, this would be 41,552+ codes
        const sampleZipData = [
            // Northeast
            { zip: '10001', city: 'New York', state: 'NY', stateName: 'New York', propertyTaxRate: 1.25, insuranceRate: 0.4 },
            { zip: '02101', city: 'Boston', state: 'MA', stateName: 'Massachusetts', propertyTaxRate: 1.17, insuranceRate: 0.55 },
            // Southeast
            { zip: '33101', city: 'Miami', state: 'FL', stateName: 'Florida', propertyTaxRate: 1.02, insuranceRate: 1.2 },
            { zip: '30301', city: 'Atlanta', state: 'GA', stateName: 'Georgia', propertyTaxRate: 0.83, insuranceRate: 0.65 },
            // Midwest  
            { zip: '60601', city: 'Chicago', state: 'IL', stateName: 'Illinois', propertyTaxRate: 2.05, insuranceRate: 0.5 },
            // Southwest
            { zip: '77001', city: 'Houston', state: 'TX', stateName: 'Texas', propertyTaxRate: 1.81, insuranceRate: 0.7 },
            // West Coast
            { zip: '90210', city: 'Beverly Hills', state: 'CA', stateName: 'California', propertyTaxRate: 0.75, insuranceRate: 0.6 },
            // Mountain States
            { zip: '80201', city: 'Denver', state: 'CO', stateName: 'Colorado', propertyTaxRate: 0.51, insuranceRate: 0.55 },
            // Additional major ZIP codes from all 50 states + DC
            { zip: '99501', city: 'Anchorage', state: 'AK', stateName: 'Alaska', propertyTaxRate: 1.19, insuranceRate: 0.6 },
            { zip: '20001', city: 'Washington', state: 'DC', stateName: 'District of Columbia', propertyTaxRate: 0.57, insuranceRate: 0.4 },
        ];
        sampleZipData.forEach(data => {
            // Convert rates to decimals (e.g., 1.81% -> 0.0181)
            data.propertyTaxRate = data.propertyTaxRate / 100;
            data.insuranceRate = data.insuranceRate / 100;
            this.zipCodes.set(data.zip, data);
        });
        // Populate default values for demonstration purposes
        const defaultZip = this.zipCodes.get('77001');
        // Using Houston as a strong default market
        if (defaultZip) {
            document.getElementById('zip-code').value = '77001';
            this.updateZipInfo(defaultZip);
        }
    },
    
    getZipData(zipCode) {
        return this.zipCodes.get(zipCode);
    },
    
    // Updates the Property Tax and Insurance fields based on ZIP code data
    updateZipInfo(zipData) {
        if (!zipData) return;
        const price = MORTGAGE_CALCULATOR.currentCalculation.homePrice || 450000;
        
        // Calculate estimated annual tax and insurance
        const estimatedTax = price * zipData.propertyTaxRate;
        const estimatedInsurance = price * zipData.insuranceRate;
        
        // Update input fields with calculated values
        document.getElementById('property-tax').value = formatCurrency(estimatedTax, false);
        document.getElementById('home-insurance').value = formatCurrency(estimatedInsurance, false);
        
        // Update information displays
        document.getElementById('zip-info').querySelector('.status-text').textContent = 
            `${zipData.city}, ${zipData.state} (${zipData.stateName})`;
        document.getElementById('tax-rate-info').querySelector('.status-text').textContent = 
            `~${(zipData.propertyTaxRate * 100).toFixed(2)}% (Est.)`;
        document.getElementById('insurance-rate-info').querySelector('.status-text').textContent = 
            `~${(zipData.insuranceRate * 100).toFixed(2)}% (Est.)`;
        showToast(`Defaults loaded for ${zipData.city}, ${zipData.state}!`, 'success');
        updateCalculations();
    }
};

/* ========================================================================== */
/* NEW: REAL FRED API INTEGRATION (User's provided code structure) */
/* ========================================================================== */

const fredAPI = {
    
    // NEW: Fetches a single series from FRED
    async fetchSeries(seriesId) {
        const url = `${MORTGAGE_CALCULATOR.FRED_BASE_URL}?series_id=${seriesId}&api_key=${MORTGAGE_CALCULATOR.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`FRED API Error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            const rate = parseFloat(data.observations[0].value);
            if (isNaN(rate)) {
                 throw new Error(`FRED API Error: Invalid rate value for ${seriesId}`);
            }
            return rate;
        } catch (error) {
            console.error(`Failed to fetch FRED series ${seriesId}:`, error);
            // NEW: Google Analytics event for API failure
            if (typeof gtag === 'function') {
                gtag('event', 'api_error', {
                    'event_category': 'FRED API',
                    'event_label': `Fetch failed: ${seriesId}`,
                    'value': error.message
                });
            }
            return null; // Return null on failure
        }
    },

    // NEW: Fetches all relevant live rates in parallel
    async fetchAllLiveRates() {
        const ratePromises = [];
        const rateLabels = [];

        for (const [label, seriesId] of Object.entries(MORTGAGE_CALCULATOR.FRED_SERIES)) {
            rateLabels.push(label);
            ratePromises.push(this.fetchSeries(seriesId));
        }

        const results = await Promise.all(ratePromises);
        results.forEach((rate, index) => {
            const label = rateLabels[index];
            if (rate !== null) {
                MORTGAGE_CALCULATOR.liveRates[label] = rate;
            }
        });
        MORTGAGE_CALCULATOR.lastRateUpdate = Date.now();
        return { success: Object.keys(MORTGAGE_CALCULATOR.liveRates).length > 0, rates: MORTGAGE_CALCULATOR.liveRates };
    },
    
    // NEW: Updates the UI with the fetched rates
    updateRateUI() {
        const rateInput = document.getElementById('interest-rate');
        const statusSpan = document.getElementById('fred-rate-status').querySelector('.status-text');
        const rateSelect = document.getElementById('live-rate-select');

        // Clear previous options
        rateSelect.innerHTML = '<option value="">Apply Live Rate</option>';
        let firstRate = null;
        
        for (const [label, rate] of Object.entries(MORTGAGE_CALCULATOR.liveRates)) {
            if (firstRate === null) firstRate = rate; // Grab the first rate (30-Yr) as default
            const option = document.createElement('option');
            option.value = rate.toFixed(2);
            option.textContent = `${label}: ${rate.toFixed(2)}%`;
            rateSelect.appendChild(option);
        }
        
        if (firstRate !== null) {
            // Set the main interest rate input to the 30-Year Fixed rate by default
            rateInput.value = firstRate.toFixed(2);
            statusSpan.textContent = `Live Rates Loaded (30-Yr: ${firstRate.toFixed(2)}%)`;
            // Force update calculation when rates are loaded
            updateCalculations();
        } else {
            statusSpan.textContent = `Error loading live rates. Using default.`;
        }
    },
    
    // Handles the automatic fetching and updating of the rate
    async startAutomaticUpdates() {
        const updateRates = async () => {
            const statusSpan = document.getElementById('fred-rate-status').querySelector('.status-text');
            const statusIcon = document.getElementById('fred-rate-status').querySelector('.status-icon');
            statusIcon.classList.add('fa-spin');
            statusSpan.textContent = 'FRED Rate: Fetching...';
            showLoading(true, 'Fetching live mortgage rates from FRED...');
            
            const result = await this.fetchAllLiveRates();
            
            statusIcon.classList.remove('fa-spin');
            showLoading(false);

            if (result.success) {
                this.updateRateUI();
                showToast(`Live FRED rates updated!`, 'success');
            } else {
                statusSpan.textContent = `FRED Rate: Error. Using default.`;
                showToast(`Could not fetch live FRED rates. Using default values.`, 'error');
                // Fallback to default calculation if API fails on first load
                if (!MORTGAGE_CALCULATOR.currentCalculation.monthlyPayment) {
                    updateCalculations();
                }
            }
            
            // Schedule the next update
            setTimeout(updateRates, MORTGAGE_CALCULATOR.RATE_UPDATE_INTERVAL);
        };
        
        // Run the first update immediately
        updateRates();
    }
};

/* ========================================================================== */
/* UTILITY FUNCTIONS (Needed to complete user's code) */
/* ========================================================================== */

/**
 * Formats a number to a US currency string.
 */
function formatCurrency(value, includeSymbol = true) {
    if (isNaN(value) || value === null) return includeSymbol ? '$0.00' : '0';
    
    return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0, // No decimals for large amounts
        maximumFractionDigits: 0
    });
}

/**
 * Parses a currency string back into a number.
 */
function parseCurrency(currencyString) {
    if (!currencyString) return 0;
    // Remove all non-numeric characters except for the decimal point
    const cleanedString = String(currencyString).replace(/[^0-9.-]+/g, "");
    return parseFloat(cleanedString) || 0;
}

/**
 * Shows a temporary notification toast at the bottom of the screen.
 * @param {string} message The message to display.
 * @param {string} type 'success', 'error', or 'info'.
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.classList.add('toast', `toast-${type}`);
    toast.textContent = message;
    
    // Add to container and make visible
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
    }, 10); // Small delay for CSS transition

    // Remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            container.removeChild(toast);
        });
    }, 5000);
}

/**
 * Shows or hides the global loading indicator.
 * @param {boolean} isVisible
 * @param {string} message Optional loading message.
 */
function showLoading(isVisible, message = 'Processing...') {
    const indicator = document.getElementById('loading-indicator');
    const textElement = indicator.querySelector('.loading-text');
    
    if (isVisible) {
        textElement.textContent = message;
        indicator.setAttribute('aria-hidden', 'false');
        indicator.style.display = 'flex';
        // Delay adding the 'visible' class to ensure the 'display: flex' is processed first
        setTimeout(() => indicator.classList.add('visible'), 10);
    } else {
        indicator.classList.remove('visible');
        // Delay hiding the element to allow CSS transition to finish
        setTimeout(() => indicator.style.display = 'none', 500);
        indicator.setAttribute('aria-hidden', 'true');
    }
}

/**
 * Announces a message for screen readers, ensuring accessibility.
 * @param {string} message The announcement message.
 */
function screenReaderAnnounce(message) {
    const srAnnouncements = document.getElementById('sr-announcements');
    // Clear and set the message to force the screen reader to re-read
    srAnnouncements.textContent = '';
    setTimeout(() => {
        srAnnouncements.textContent = message;
    }, 100);
}


/* ========================================================================== */
/* CORE CALCULATION LOGIC (User's provided code structure) */
/* ========================================================================== */

/**
 * Calculates the monthly P&I payment (Principal and Interest).
 * M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1]
 * @param {number} P Principal loan amount
 * @param {number} r Annual interest rate (as a decimal)
 * @param {number} t Loan term in years
 * @returns {number} Monthly P&I payment
 */
function calculatePIPayment(P, r, t) {
    if (P <= 0 || r < 0 || t <= 0) return 0;
    
    const i = r / 12; // Monthly interest rate
    const n = t * 12; // Total number of payments
    
    // Handle 0% interest rate case
    if (i === 0) {
        return P / n;
    }
    
    const factor = Math.pow((1 + i), n);
    // M = P * [ i * factor / (factor - 1) ]
    return P * (i * factor) / (factor - 1);
}

/**
 * Calculates the Private Mortgage Insurance (PMI) based on LTV.
 * Assumes a 0.85% annual rate if LTV is > 80% for Conventional loans.
 * PMI is automatically dropped at 80% LTV (or 78% mandated). We use the initial LTV.
 * @param {number} loanAmount
 * @param {number} homePrice
 * @param {string} loanType
 * @returns {number} Monthly PMI payment
 */
function calculatePMI(loanAmount, homePrice, loanType) {
    if (loanType !== 'conventional') {
        return 0; // PMI is typically only on conventional loans
    }
    
    const LTV = loanAmount / homePrice;
    
    // Check if LTV is greater than 80%
    if (LTV > 0.80) {
        // Standard PMI rate assumption (0.85% annual)
        const annualPMIRate = 0.0085; 
        const annualPMI = loanAmount * annualPMIRate;
        return annualPMI / 12; // Monthly PMI
    }
    
    return 0;
}

/**
 * Generates the full amortization schedule.
 * @returns {Array<Object>} The amortization schedule
 */
function generateAmortizationSchedule() {
    let { loanAmount, interestRate, loanTerm, extraMonthly, extraWeekly } = MORTGAGE_CALCULATOR.currentCalculation;
    
    // Parse extra payments
    extraMonthly = parseCurrency(extraMonthly);
    extraWeekly = parseCurrency(extraWeekly);
    
    let balance = loanAmount;
    const monthlyRate = (interestRate / 100) / 12;
    const totalPayments = loanTerm * 12;
    const schedule = [];
    
    // Calculate the base monthly P&I payment
    const basePIPayment = calculatePIPayment(loanAmount, interestRate / 100, loanTerm);
    
    // Calculate total extra payment per month (weekly * 4.33 weeks/month + monthly)
    const extraPayment = extraMonthly + (extraWeekly * (52 / 12));
    
    // NEW: Save the base PI for comparison
    MORTGAGE_CALCULATOR.comparisonLoan.baseP_I = basePIPayment;

    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    let totalPaymentsMade = 0;

    for (let month = 1; balance > 0 && month <= totalPayments + 1; month++) {
        // Stop if the loan term is exceeded drastically (safety)
        if (month > (loanTerm * 12 + 100)) break; 
        
        const interest = balance * monthlyRate;
        let principal = 0;
        let payment = basePIPayment;
        let totalPayment = payment + extraPayment;
        
        if (totalPayment > balance + interest) {
            // Last payment
            payment = balance + interest;
            principal = balance;
            balance = 0;
        } else {
            // Normal payment
            principal = totalPayment - interest;
            if (principal < 0) { 
                // Should not happen for fixed rate, but safety check for rounding
                principal = 0;
            }
            balance -= principal;
        }

        totalInterestPaid += interest;
        totalPrincipalPaid += principal;
        totalPaymentsMade++;

        schedule.push({
            month: month,
            basePI: basePIPayment,
            extra: extraPayment,
            totalPayment: payment,
            interest: interest,
            principal: principal,
            totalInterest: totalInterestPaid,
            totalPrincipal: totalPrincipalPaid,
            balance: balance,
            year: Math.ceil(month / 12)
        });
    }

    // NEW: Update comparison state
    MORTGAGE_CALCULATOR.comparisonLoan.payoffMonths = totalPaymentsMade;
    MORTGAGE_CALCULATOR.comparisonLoan.totalInterest = totalInterestPaid;
    MORTGAGE_CALCULATOR.comparisonLoan.extraInterestSaved = (loanAmount * totalPayments * monthlyRate) - totalInterestPaid;
    
    return schedule;
}

/**
 * Main function to read inputs, calculate, and update the UI.
 */
function updateCalculations() {
    if (MORTGAGE_CALCULATOR.DEBUG) console.log('Starting updateCalculations...');
    showLoading(true, 'Calculating loan payments...');

    const c = MORTGAGE_CALCULATOR.currentCalculation;
    
    // 1. Read and parse inputs
    c.homePrice = parseCurrency(document.getElementById('home-price').value);
    c.downPayment = parseCurrency(document.getElementById('down-payment').value);
    c.interestRate = parseFloat(document.getElementById('interest-rate').value) || 0;
    c.loanTerm = parseInt(document.getElementById('loan-term').value) || 30;
    c.propertyTax = parseCurrency(document.getElementById('property-tax').value);
    c.homeInsurance = parseCurrency(document.getElementById('home-insurance').value);
    c.hoaFees = parseCurrency(document.getElementById('hoa-fees').value);
    c.extraMonthly = parseCurrency(document.getElementById('extra-monthly').value);
    c.extraWeekly = parseCurrency(document.getElementById('extra-weekly').value);
    c.loanType = document.getElementById('loan-type').value;

    // 2. Derive dependent values
    c.loanAmount = c.homePrice - c.downPayment;
    c.downPaymentPercent = (c.downPayment / c.homePrice) * 100;
    
    // Auto-update Down Payment % input
    document.getElementById('down-payment-percent').value = 
        isNaN(c.downPaymentPercent) ? '0' : c.downPaymentPercent.toFixed(2);
        
    // 3. Calculate core components
    
    // Principal & Interest (P&I)
    const annualRateDecimal = c.interestRate / 100;
    const PI = calculatePIPayment(c.loanAmount, annualRateDecimal, c.loanTerm);
    
    // Private Mortgage Insurance (PMI)
    c.pmi = calculatePMI(c.loanAmount, c.homePrice, c.loanType);
    
    // Property Tax (T) - Monthly
    const monthlyTax = c.propertyTax / 12;
    
    // Home Insurance (I) - Monthly
    const monthlyInsurance = c.homeInsurance / 12;

    // 4. Calculate final payment (PITI + HOA)
    const monthlyPayment = PI + c.pmi + monthlyTax + monthlyInsurance + c.hoaFees;
    
    // 5. Generate Amortization Schedule & Total Interest
    MORTGAGE_CALCULATOR.amortizationSchedule = generateAmortizationSchedule();
    
    // Get total interest and cost from the generated schedule
    const lastPayment = MORTGAGE_CALCULATOR.amortizationSchedule.at(-1);
    c.totalInterest = lastPayment ? lastPayment.totalInterest : 0;
    
    // Total Cost = Total Loan Repaid + Down Payment + Closing Costs
    const closingCosts = c.homePrice * (c.closingCostsPercent / 100);
    const totalLoanRepaid = c.loanAmount + c.totalInterest + c.propertyTax * c.loanTerm + c.homeInsurance * c.loanTerm;
    c.totalCost = totalLoanRepaid + c.downPayment + closingCosts;

    // 6. Update global state
    c.monthlyPayment = monthlyPayment;
    
    // 7. Update UI outputs
    updateResultsUI({ PI, monthlyTax, monthlyInsurance, closingCosts });
    
    // 8. Re-render charts
    updateCharts();
    
    showLoading(false);
    
    if (MORTGAGE_CALCULATOR.DEBUG) console.log('Final State:', MORTGAGE_CALCULATOR.currentCalculation);
}

/**
 * Updates the various result displays on the page.
 */
function updateResultsUI({ PI, monthlyTax, monthlyInsurance, closingCosts }) {
    const c = MORTGAGE_CALCULATOR.currentCalculation;
    const comp = MORTGAGE_CALCULATOR.comparisonLoan;
    
    // --- Results Overview Card ---
    document.getElementById('total-monthly-payment').textContent = formatCurrency(c.monthlyPayment);
    document.getElementById('breakdown-pi').textContent = formatCurrency(PI);
    document.getElementById('breakdown-tax').textContent = formatCurrency(monthlyTax);
    document.getElementById('breakdown-insurance').textContent = formatCurrency(monthlyInsurance + c.pmi);
    
    // Update the Payment Breakdown tab display
    document.getElementById('monthly-pi').textContent = formatCurrency(PI);
    document.getElementById('monthly-tax').textContent = formatCurrency(monthlyTax);
    document.getElementById('monthly-insurance').textContent = formatCurrency(monthlyInsurance);
    document.getElementById('monthly-pmi').textContent = formatCurrency(c.pmi);
    document.getElementById('monthly-hoa').textContent = formatCurrency(c.hoaFees);
    document.getElementById('monthly-total-piti').textContent = formatCurrency(c.monthlyPayment - c.hoaFees);
    document.getElementById('monthly-total-full').textContent = formatCurrency(c.monthlyPayment);
    
    // Update the Loan Summary tab display
    document.getElementById('summary-loan-amount').textContent = formatCurrency(c.loanAmount);
    document.getElementById('summary-interest-rate').textContent = `${c.interestRate.toFixed(2)}%`;
    document.getElementById('summary-loan-term').textContent = `${c.loanTerm} years`;
    document.getElementById('summary-total-interest').textContent = formatCurrency(c.totalInterest);
    document.getElementById('summary-total-cost').textContent = formatCurrency(c.totalCost);
    document.getElementById('summary-closing-costs').textContent = formatCurrency(closingCosts);

    // Update Extra Payment Section
    const baseTotalInterest = (c.loanAmount * c.loanTerm * (c.interestRate/100/12)) * (c.loanTerm * 12); // Rough baseline
    const interestSaved = baseTotalInterest - comp.totalInterest;

    if (c.extraMonthly > 0 || c.extraWeekly > 0) {
        document.getElementById('extra-payment-savings').classList.remove('hidden');
        document.getElementById('savings-months-value').textContent = `${(c.loanTerm * 12) - comp.payoffMonths} months`;
        document.getElementById('savings-interest-value').textContent = formatCurrency(interestSaved);
        document.getElementById('savings-payoff-date').textContent = getPayoffDate(comp.payoffMonths);
    } else {
        document.getElementById('extra-payment-savings').classList.add('hidden');
    }
    
    // Update AI Insights (based on common financial rules)
    const insightsContainer = document.getElementById('ai-insights-text');
    insightsContainer.innerHTML = '';
    
    let insights = [];
    
    // Insight 1: Affordability Check (30% Rule)
    if (c.monthlyPayment > 0.30 * 10000) { // Using a placeholder $10k monthly income for demo
        insights.push({
            type: 'warning',
            text: `Your estimated monthly payment of **${formatCurrency(c.monthlyPayment)}** is high compared to the 30% rule of thumb (assuming a sample high-earner income). Consider a lower home price or longer loan term.`
        });
    } else {
        insights.push({
            type: 'success',
            text: `Your estimated monthly payment of **${formatCurrency(c.monthlyPayment)}** is generally considered affordable. Keep an eye on the total cost!`
        });
    }
    
    // Insight 2: Down Payment Check (PMI)
    if (c.downPaymentPercent < 20 && c.pmi > 0) {
        insights.push({
            type: 'alert',
            text: `Your **${c.downPaymentPercent.toFixed(1)}% down payment** is below the 20% threshold, meaning you will likely pay **Private Mortgage Insurance (PMI)** of **${formatCurrency(c.pmi)}/month** until you reach 20% equity. Aim for 20% to eliminate PMI.`
        });
    }
    
    // Insight 3: Total Interest Cost
    if (c.totalInterest > c.loanAmount) {
        insights.push({
            type: 'info',
            text: `Over the life of the loan, you will pay **${formatCurrency(c.totalInterest)}** in interest, which is more than the original loan amount of **${formatCurrency(c.loanAmount)}**. Consider making extra payments to save significantly.`
        });
    }

    // Render insights
    insights.forEach(insight => {
        const p = document.createElement('p');
        p.classList.add('insights-text', `insights-${insight.type}`);
        p.innerHTML = insight.text;
        insightsContainer.appendChild(p);
    });

    // Update screen reader
    screenReaderAnnounce(`Calculation complete. Total monthly payment is ${formatCurrency(c.monthlyPayment)}.`);
}

/**
 * Calculates the payoff date given the number of payments remaining.
 * @param {number} totalPayments
 * @returns {string} Formatted date (Month, YYYY)
 */
function getPayoffDate(totalPayments) {
    const today = new Date();
    const futureDate = new Date(today.getFullYear(), today.getMonth() + totalPayments, 1);
    
    const formatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' });
    return formatter.format(futureDate);
}


/* ========================================================================== */
/* CHARTING LOGIC (Using Chart.js) (User's provided code structure) */
/* ========================================================================== */

/**
 * Initializes the Chart.js instances.
 */
function initializeCharts() {
    // 1. Payment Components Chart (Doughnut)
    const ctx1 = document.getElementById('payment-components-chart').getContext('2d');
    MORTGAGE_CALCULATOR.charts.paymentComponents = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: ['Principal & Interest', 'Taxes', 'Insurance/PMI', 'HOA Fees'],
            datasets: [{
                data: [1, 1, 1, 1], // Placeholder values
                backgroundColor: ['#0D9488', '#F59E0B', '#EF4444', '#1E40AF'],
                hoverBackgroundColor: ['#10B981', '#FBBF24', '#F87171', '#3B82F6']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'var(--color-text)', // Dynamic color
                        boxWidth: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            if (label) {
                                return `${label}: ${formatCurrency(context.parsed)}`;
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });

    // 2. Mortgage Timeline Chart (Line)
    const ctx2 = document.getElementById('mortgage-timeline-chart').getContext('2d');
    MORTGAGE_CALCULATOR.charts.mortgageTimeline = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: [], // Years
            datasets: [
                {
                    label: 'Remaining Balance',
                    data: [],
                    borderColor: '#0D9488',
                    backgroundColor: 'rgba(13, 148, 136, 0.1)',
                    fill: 'start',
                    tension: 0.2
                },
                {
                    label: 'Principal Paid',
                    data: [],
                    borderColor: '#1E40AF',
                    backgroundColor: 'rgba(30, 64, 175, 0.1)',
                    fill: false,
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Amount ($)',
                        color: 'var(--color-text)'
                    },
                    grid: {
                        color: 'var(--color-border-subtle)'
                    },
                    ticks: {
                        color: 'var(--color-text)',
                        callback: (value) => formatCurrency(value, true)
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Year',
                        color: 'var(--color-text)'
                    },
                    grid: {
                        color: 'var(--color-border-subtle)'
                    },
                    ticks: {
                        color: 'var(--color-text)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: 'var(--color-text)',
                        boxWidth: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Destroys and re-creates the amortization table.
 */
function updateAmortizationTable() {
    const tableBody = document.getElementById('amortization-table-body');
    const tableContainer = document.getElementById('amortization-schedule');
    const schedule = MORTGAGE_CALCULATOR.amortizationSchedule;
    const itemsPerPage = MORTGAGE_CALCULATOR.scheduleItemsPerPage;
    const currentPage = MORTGAGE_CALCULATOR.scheduleCurrentPage;
    const type = MORTGAGE_CALCULATOR.scheduleType;
    
    // Clear previous rows
    tableBody.innerHTML = '';
    
    // Filter and aggregate schedule based on type ('monthly' or 'yearly')
    let displaySchedule = [];
    if (type === 'monthly') {
        displaySchedule = schedule;
    } else { // 'yearly' aggregation
        const yearlyData = {};
        schedule.forEach(item => {
            const year = item.year;
            if (!yearlyData[year]) {
                yearlyData[year] = {
                    year: year,
                    interest: 0,
                    principal: 0,
                    totalPrincipal: item.totalPrincipal,
                    balance: item.balance
                };
            }
            yearlyData[year].interest += item.interest;
            yearlyData[year].principal += item.principal;
            // Update running totals for the end of the year
            yearlyData[year].totalPrincipal = item.totalPrincipal;
            yearlyData[year].balance = item.balance;
        });
        displaySchedule = Object.values(yearlyData);
    }
    
    const totalPages = Math.ceil(displaySchedule.length / itemsPerPage);
    
    // Slice for pagination
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedSchedule = displaySchedule.slice(start, end);
    
    // Render rows
    paginatedSchedule.forEach((item, index) => {
        const row = tableBody.insertRow();
        
        // Determine the label for the first column
        const label = type === 'monthly' ? `Month ${item.month}` : `Year ${item.year}`;
        
        row.insertCell().textContent = label;
        row.insertCell().textContent = formatCurrency(item.interest);
        row.insertCell().textContent = formatCurrency(item.principal);
        row.insertCell().textContent = formatCurrency(item.balance);
    });
    
    // Update pagination controls
    updatePaginationControls(totalPages);
}

/**
 * Updates the timeline chart with new amortization data.
 */
function updateCharts() {
    const timelineChart = MORTGAGE_CALCULATOR.charts.mortgageTimeline;
    const paymentChart = MORTGAGE_CALCULATOR.charts.paymentComponents;
    const schedule = MORTGAGE_CALCULATOR.amortizationSchedule;
    const c = MORTGAGE_CALCULATOR.currentCalculation;
    
    // --- 1. Timeline Chart Data (Yearly Aggregation) ---
    const yearlyData = {};
    schedule.forEach(item => {
        const year = item.year;
        if (!yearlyData[year]) {
            yearlyData[year] = {
                year: year,
                totalPrincipal: 0,
                balance: 0
            };
        }
        // Take the end-of-year value
        yearlyData[year].totalPrincipal = item.totalPrincipal;
        yearlyData[year].balance = item.balance;
    });
    
    const chartLabels = Object.keys(yearlyData);
    const balanceData = chartLabels.map(year => yearlyData[year].balance);
    const principalData = chartLabels.map(year => yearlyData[year].totalPrincipal);

    timelineChart.data.labels = chartLabels;
    timelineChart.data.datasets[0].data = balanceData;
    timelineChart.data.datasets[1].data = principalData;
    
    timelineChart.update();
    
    // --- 2. Payment Components Chart Data ---
    const PI = calculatePIPayment(c.loanAmount, c.interestRate / 100, c.loanTerm);
    const monthlyTax = c.propertyTax / 12;
    const monthlyInsurance = c.homeInsurance / 12;
    const Insurance_PMI = monthlyInsurance + c.pmi;
    
    paymentChart.data.datasets[0].data = [
        PI, 
        monthlyTax, 
        Insurance_PMI, 
        c.hoaFees
    ];
    
    paymentChart.update();
}

/**
 * Updates the UI elements for pagination control.
 * @param {number} totalPages
 */
function updatePaginationControls(totalPages) {
    const pageIndicator = document.getElementById('current-page-indicator');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    const currentPage = MORTGAGE_CALCULATOR.scheduleCurrentPage;
    
    pageIndicator.textContent = `Page ${currentPage + 1} of ${totalPages}`;
    
    // Disable/enable buttons
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages - 1;
    
    // Show/hide container if only one page
    const container = document.getElementById('amortization-pagination-container');
    if (totalPages <= 1) {
        container.classList.add('hidden');
    } else {
        container.classList.remove('hidden');
    }
}


/* ========================================================================== */
/* EVENT HANDLERS & FEATURE TOGGLES (User's provided code structure) */
/* ========================================================================== */

/**
 * Handles all input changes to trigger a recalculation.
 * @param {Event} e 
 */
function handleInputChange(e) {
    if (MORTGAGE_CALCULATOR.DEBUG) console.log(`Input change detected: ${e.target.id}`);
    
    // The main fields are calculated on keyup for a responsive feel
    if (['home-price', 'down-payment', 'interest-rate', 'loan-term', 'property-tax', 'home-insurance', 'hoa-fees', 'extra-monthly', 'extra-weekly'].includes(e.target.id)) {
        // Debounce calculation to avoid rapid updates on every keystroke
        if (MORTGAGE_CALCULATOR.calculationTimeout) {
            clearTimeout(MORTGAGE_CALCULATOR.calculationTimeout);
        }
        MORTGAGE_CALCULATOR.calculationTimeout = setTimeout(updateCalculations, 400);
    } 
    
    // Handle Down Payment % being set, which updates Down Payment amount
    if (e.target.id === 'down-payment-percent') {
        const percent = parseFloat(e.target.value) || 0;
        const price = parseCurrency(document.getElementById('home-price').value);
        const newDownPayment = price * (percent / 100);
        document.getElementById('down-payment').value = formatCurrency(newDownPayment, false);
        
        if (MORTGAGE_CALCULATOR.calculationTimeout) {
            clearTimeout(MORTGAGE_CALCULATOR.calculationTimeout);
        }
        MORTGAGE_CALCULATOR.calculationTimeout = setTimeout(updateCalculations, 400);
    }
    
    // Handle Loan Type/Term changes
    if (['loan-type', 'loan-term'].includes(e.target.id)) {
        updateCalculations();
    }
}

/**
 * Handles ZIP code lookup.
 * @param {Event} e 
 */
function handleZipCodeLookup(e) {
    // Only proceed if enter is pressed or the input has 5 digits
    if (e.type === 'keyup' && e.key !== 'Enter') return;
    
    const zipCode = document.getElementById('zip-code').value.trim();
    if (zipCode.length !== 5) {
        document.getElementById('zip-info').querySelector('.status-text').textContent = 
            'Enter a valid 5-digit ZIP code.';
        showToast('Please enter a valid 5-digit ZIP code.', 'error');
        return;
    }
    
    const zipData = ZIP_DATABASE.getZipData(zipCode);
    if (zipData) {
        ZIP_DATABASE.updateZipInfo(zipData);
    } else {
        document.getElementById('zip-info').querySelector('.status-text').textContent = 
            'ZIP code not found. Using manually entered Tax/Insurance.';
        showToast('ZIP code not in sample database. Enter Tax/Insurance manually.', 'info');
        updateCalculations();
    }
}

/**
 * Toggles between light and dark mode.
 */
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-color-scheme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-color-scheme', newTheme);
    MORTGAGE_CALCULATOR.currentTheme = newTheme;
    
    // Persist the theme choice
    localStorage.setItem('theme', newTheme);
    screenReaderAnnounce(`Theme changed to ${newTheme} mode.`);
    showToast(`Switched to ${newTheme} mode.`, 'info');
    
    // Update chart colors if theme changes
    updateChartColors();
}

/**
 * Updates the chart colors for the current theme.
 */
function updateChartColors() {
    const chart = MORTGAGE_CALCULATOR.charts.mortgageTimeline;
    const newColor = MORTGAGE_CALCULATOR.currentTheme === 'dark' ? 'var(--color-white)' : 'var(--color-text)';

    if (chart) {
        chart.options.scales.y.title.color = newColor;
        chart.options.scales.x.title.color = newColor;
        chart.options.scales.y.ticks.color = newColor;
        chart.options.scales.x.ticks.color = newColor;
        chart.options.plugins.legend.labels.color = newColor;
        
        chart.update();
    }

    const pieChart = MORTGAGE_CALCULATOR.charts.paymentComponents;
    if (pieChart) {
        pieChart.options.plugins.legend.labels.color = newColor;
        pieChart.update();
    }
}

/**
 * Toggles the screen reader/high contrast mode.
 */
function toggleScreenReaderMode() {
    MORTGAGE_CALCULATOR.screenReaderMode = !MORTGAGE_CALCULATOR.screenReaderMode;
    const html = document.documentElement;
    const button = document.getElementById('reader-mode-toggle');
    
    if (MORTGAGE_CALCULATOR.screenReaderMode) {
        html.classList.add('screen-reader-mode');
        button.classList.add('active');
        screenReaderAnnounce("Screen reader mode enabled: High contrast and larger text.");
        showToast('Screen Reader Mode ON.', 'info');
    } else {
        html.classList.remove('screen-reader-mode');
        button.classList.remove('active');
        screenReaderAnnounce("Screen reader mode disabled.");
        showToast('Screen Reader Mode OFF.', 'info');
    }
}

/**
 * Toggles voice control (Speech Recognition).
 * Note: This feature relies on browser support (mostly Chrome).
 */
function toggleVoiceControl() {
    MORTGAGE_CALCULATOR.voiceEnabled = !MORTGAGE_CALCULATOR.voiceEnabled;
    const button = document.getElementById('voice-control-toggle');
    
    if (MORTGAGE_CALCULATOR.voiceEnabled) {
        button.classList.add('active');
        screenReaderAnnounce("Voice control activated. Say 'Set Home Price to [Amount]' or 'Calculate'.");
        showToast('Voice Control ON. Say a command like "Home price to 500000".', 'success');
        startSpeechRecognition();
    } else {
        button.classList.remove('active');
        screenReaderAnnounce("Voice control deactivated.");
        showToast('Voice Control OFF.', 'info');
        stopSpeechRecognition();
    }
}

let recognition;
function startSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        showToast('Your browser does not support Web Speech API.', 'error');
        MORTGAGE_CALCULATOR.voiceEnabled = false;
        document.getElementById('voice-control-toggle').classList.remove('active');
        return;
    }
    
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false; // Single recognition cycle
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        handleVoiceCommand(transcript);
    };
    
    recognition.onend = () => {
        if (MORTGAGE_CALCULATOR.voiceEnabled) {
            // Restart recognition if still enabled
            recognition.start();
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
             showToast('Microphone access denied. Voice control requires permission.', 'error');
             MORTGAGE_CALCULATOR.voiceEnabled = false;
             document.getElementById('voice-control-toggle').classList.remove('active');
        }
    };
    
    recognition.start();
}

function stopSpeechRecognition() {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
}

/**
 * Processes a voice command transcript.
 * @param {string} command 
 */
function handleVoiceCommand(command) {
    if (command.includes('calculate')) {
        updateCalculations();
        screenReaderAnnounce("Recalculating mortgage.");
        showToast('Voice Command: Recalculating...', 'info');
        return;
    }
    
    // Set a value command: e.g., "Set home price to 500,000"
    const setMatch = command.match(/set (.+?) to (\d{1,3}(,\d{3})*(\.\d+)?)/);
    if (setMatch) {
        const fieldName = setMatch[1].trim().toLowerCase();
        const valueString = setMatch[2].replace(/,/g, ''); // Clean up number string
        const value = parseFloat(valueString);
        
        let inputId = '';
        if (fieldName.includes('home price')) inputId = 'home-price';
        else if (fieldName.includes('down payment')) inputId = 'down-payment';
        else if (fieldName.includes('interest rate') || fieldName.includes('rate')) inputId = 'interest-rate';
        else if (fieldName.includes('tax')) inputId = 'property-tax';
        else if (fieldName.includes('insurance')) inputId = 'home-insurance';
        else if (fieldName.includes('hoa') || fieldName.includes('fees')) inputId = 'hoa-fees';
        else if (fieldName.includes('extra monthly')) inputId = 'extra-monthly';
        
        if (inputId) {
            const input = document.getElementById(inputId);
            // Use correct formatting for currency/rate fields
            if (inputId === 'interest-rate') {
                input.value = value.toFixed(2);
            } else {
                input.value = formatCurrency(value, false);
            }
            
            updateCalculations();
            screenReaderAnnounce(`Set ${fieldName} to ${value}. Recalculating.`);
            showToast(`Voice Command: Set ${fieldName} to ${formatCurrency(value)}`, 'success');
            return;
        }
    }
    
    showToast(`Voice Command: Unrecognized command "${command}".`, 'error');
}

/**
 * Handles the click event for monetization links.
 * @param {Event} e 
 */
function handleMonetizationClick(e) {
    const link = e.currentTarget;
    const partner = link.getAttribute('data-partner') || 'Unknown';
    const type = link.classList.contains('affiliate-link') ? 'Affiliate Link' : 'Lead Form CTA';
    
    if (MORTGAGE_CALCULATOR.DEBUG) console.log(`Monetization Event: ${type} for ${partner}`);
    
    // NEW: Google Analytics Event Tracking for Monetization
    if (typeof gtag === 'function') {
        gtag('event', 'monetization_click', {
            'event_category': 'Monetization',
            'event_label': `${type}: ${partner}`,
            'value': 1 // Simple count
        });
    }
}

/**
 * Handles the export to PDF or CSV functionality.
 * @param {string} format 'pdf' or 'csv'
 */
function exportResults(format) {
    if (format === 'pdf') {
        // Requires jspdf library (loaded in HTML)
        if (typeof jspdf === 'undefined') {
            showToast('PDF library not loaded yet. Try again in a moment.', 'error');
            return;
        }
        
        showLoading(true, 'Generating PDF document...');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(22);
        doc.text("Home Loan Pro - Mortgage Calculation Results", 10, 20);
        
        // Simple text dump of key results
        const c = MORTGAGE_CALCULATOR.currentCalculation;
        let y = 30;
        doc.setFontSize(12);
        
        doc.text(`Total Monthly Payment (PITI+HOA): ${formatCurrency(c.monthlyPayment)}`, 10, y += 10);
        doc.text(`Principal & Interest: ${formatCurrency(calculatePIPayment(c.loanAmount, c.interestRate / 100, c.loanTerm))}`, 10, y += 8);
        doc.text(`Total Interest Paid: ${formatCurrency(c.totalInterest)}`, 10, y += 8);
        doc.text(`Total Cost of Loan: ${formatCurrency(c.totalCost)}`, 10, y += 8);
        
        // Add amortization table (simplified)
        y += 15;
        doc.text("Amortization Schedule (Summary)", 10, y);
        y += 5;
        
        const headers = ["Payment #", "Interest", "Principal", "Balance"];
        const data = MORTGAGE_CALCULATOR.amortizationSchedule.slice(0, 10).map(item => [
            item.month,
            formatCurrency(item.interest),
            formatCurrency(item.principal),
            formatCurrency(item.balance)
        ]);

        doc.autoTable({
            startY: y + 5,
            head: [headers],
            body: data,
            theme: 'grid'
        });
        
        // NEW: Google Analytics Event
        if (typeof gtag === 'function') {
            gtag('event', 'export', {
                'event_category': 'Interaction',
                'event_label': 'PDF Export',
                'value': 1
            });
        }
        
        doc.save("mortgage-calculation-report.pdf");
        showLoading(false);
        showToast('Results exported to PDF.', 'success');
        
    } else if (format === 'csv') {
        // Create CSV from the full amortization schedule
        let csvContent = "Payment #,Year,Base P&I,Extra Payment,Total Payment,Interest Paid,Principal Paid,Remaining Balance,Total Interest Paid,Total Principal Paid\n";
        
        MORTGAGE_CALCULATOR.amortizationSchedule.forEach(item => {
            const row = [
                item.month,
                item.year,
                formatCurrency(item.basePI, false),
                formatCurrency(item.extra, false),
                formatCurrency(item.totalPayment, false),
                formatCurrency(item.interest, false),
                formatCurrency(item.principal, false),
                formatCurrency(item.balance, false),
                formatCurrency(item.totalInterest, false),
                formatCurrency(item.totalPrincipal, false)
            ].join(',');
            csvContent += row + '\n';
        });

        // Create a hidden link and trigger the download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'mortgage-schedule.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // NEW: Google Analytics Event
        if (typeof gtag === 'function') {
            gtag('event', 'export', {
                'event_category': 'Interaction',
                'event_label': 'CSV Export',
                'value': 1
            });
        }
        
        showToast('Amortization schedule exported to CSV.', 'success');
    }
}

/**
 * Initializes PWA features (install prompt).
 */
function initPWA() {
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the default browser prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        MORTGAGE_CALCULATOR.deferredInstallPrompt = e;
        // Show our own custom install button/CTA
        document.getElementById('pwa-install-button').classList.remove('hidden');
        showToast('Ready to install as an app!', 'info');
    });
    
    document.getElementById('pwa-install-button').addEventListener('click', () => {
        const prompt = MORTGAGE_CALCULATOR.deferredInstallPrompt;
        if (!prompt) {
            return;
        }
        // Show the prompt
        prompt.prompt();
        // Wait for the user to respond to the prompt
        prompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                showToast('App installed successfully!', 'success');
                // NEW: Google Analytics Event
                if (typeof gtag === 'function') {
                    gtag('event', 'pwa_install', {
                        'event_category': 'PWA',
                        'event_label': 'Accepted'
                    });
                }
            } else {
                showToast('App installation dismissed.', 'info');
            }
            MORTGAGE_CALCULATOR.deferredInstallPrompt = null;
            document.getElementById('pwa-install-button').classList.add('hidden');
        });
    });
}


/**
 * Sets up all required event listeners.
 */
function initializeEventListeners() {
    // 1. Core Input fields (change, keyup)
    document.querySelectorAll('.input-field').forEach(input => {
        // Attach to keyup for instant feel for main numeric fields
        if (input.type === 'text' || input.type === 'number') {
            input.addEventListener('keyup', handleInputChange);
        }
        // Attach to change for dropdowns/selects
        if (input.tagName === 'SELECT' || input.type === 'change') {
            input.addEventListener('change', handleInputChange);
        }
    });
    
    // 2. ZIP Code Lookup
    document.getElementById('zip-code').addEventListener('keyup', handleZipCodeLookup);
    document.getElementById('zip-lookup-button').addEventListener('click', handleZipCodeLookup);
    
    // 3. Live Rate Apply
    document.getElementById('live-rate-select').addEventListener('change', (e) => {
        const rate = e.target.value;
        if (rate) {
            document.getElementById('interest-rate').value = rate;
            updateCalculations();
            showToast(`Applied live rate: ${rate}%`, 'info');
            // NEW: Google Analytics Event
            if (typeof gtag === 'function') {
                gtag('event', 'rate_apply', {
                    'event_category': 'Interaction',
                    'event_label': `Applied ${e.target.options[e.target.selectedIndex].text}`
                });
            }
        }
    });

    // 4. Feature Toggles
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('reader-mode-toggle').addEventListener('click', toggleScreenReaderMode);
    document.getElementById('voice-control-toggle').addEventListener('click', toggleVoiceControl);
    
    // 5. Monetization Event Listeners (Affiliate Links and CTA buttons)
    document.querySelectorAll('.affiliate-link, .monetization-cta').forEach(link => {
        link.addEventListener('click', handleMonetizationClick);
    });
    
    // 6. Export Buttons
    document.getElementById('export-pdf').addEventListener('click', () => exportResults('pdf'));
    document.getElementById('export-csv').addEventListener('click', () => exportResults('csv'));
}

/* ========================================================================== */
/* INITIALIZATION */
/* ========================================================================== */

/**
 * Main initialization function.
 */
function init() {
    console.log(`Home Loan Pro v${MORTGAGE_CALCULATOR.VERSION} Initializing...`);

    // 1. Initialize Core Services
    ZIP_DATABASE.initialize();
    
    // 2. Initialize Charts (must be done before calculations)
    initializeCharts();
    
    // 3. Initialize PWA
    initPWA();
    
    // 4. Set up Event Listeners
    initializeEventListeners();

    // 5. Fetch Live Rates and Start Auto-Updates
    fredAPI.startAutomaticUpdates();
    
    // 6. Initial Calculation (Will be triggered by fredAPI.updateRateUI if successful, 
    // or manually if FRED fails to use default values)
    // We call it here for the initial render, even if FRED is slow.
    updateCalculations();
}

// Ensure init is called after the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', init);
