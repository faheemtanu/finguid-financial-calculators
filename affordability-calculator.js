/*
  HOME LOAN PRO — AI‑POWERED MORTGAGE AFFORDABILITY CALCULATOR - PRODUCTION JS v4.0
  FinGuid USA Market Domination Build - World's First AI-Powered Calculator
   Target Production Ready, DTI-Based Affordability Calculation.
   Features Carried Over & Implemented
  ✅ Core DTI Affordability Calculation (28%/36% Rule)
  ✅ FRED API Integration (MORTGAGE30US) with Auto-Update (Key 9c6c421f077f2091e8bae4f143ada59a)
  ✅ AI-Powered Insights Engine (Conditional logic for recommendations & monetization)
  ✅ Voice Control (Speech Recognition & Text-to-Speech)
  ✅ Light/Dark Mode Toggling & User Preferences Storage
  ✅ WCAG 2.1 AA Accessibility & Responsive Design
  ✅ Google Analytics (G-NYBL2CDNQJ) Ready
   © 2025 FinGuid - World's First AI Calculator Platform for Americans
 
*/

// ==========================================================================
// I. GLOBAL CONFIGURATION & STATE MANAGEMENT
// ==========================================================================

const AFFORDABILITY_CALCULATOR = {
    VERSION: '4.0',
    DEBUG: false,
    
    // PILLAR 5: FRED API Configuration (Real Key)
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a', 
    FRED_API_URL: 'https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=9c6c421f077f2091e8bae4f143ada59a&file_type=json&sort_order=desc&limit=1',
    DEFAULT_RATE: 7.00, // Fallback rate
    
    // PILLAR 1: DTI Rules
    FRONT_END_DTI: 0.28, // 28% of gross monthly income for housing
    BACK_END_DTI: 0.36,  // 36% of gross monthly income for all debt
    
    // Default Values
    INITIAL_STATE: {
        annualIncome: 80000,
        monthlyDebts: 500,
        downPayment: 20000,
        mortgageTerm: 30, // years
        interestRate: 7.00,
        propertyTaxRate: 0.012, // 1.2% of home value
        insuranceRate: 0.0035, // 0.35% of home value
        pmiRate: 0.005, // 0.5% of loan, for < 20% down
    }
};

let userPreferences = {
    colorScheme: 'light',
    voiceMode: false
};

// ==========================================================================
// II. CORE CALCULATION LOGIC
// ==========================================================================

/**
 * Calculates the maximum affordable home price based on the 28/36 DTI rule.
 * @returns {object} The maximum affordable price and loan amount.
 */
function calculateAffordability() {
    const inputs = getCalculatorInputs();

    // 1. Calculate Max Monthly Housing Payment (PITI) based on Front-End DTI (28%)
    const maxMonthlyPITI_FE = inputs.annualIncome * AFFORDABILITY_CALCULATOR.FRONT_END_DTI / 12;

    // 2. Calculate Max Monthly Debt Payment based on Back-End DTI (36%)
    const maxMonthlyDebt_BE = inputs.annualIncome * AFFORDABILITY_CALCULATOR.BACK_END_DTI / 12;

    // 3. Calculate Max Monthly Housing Payment (PITI) based on Back-End DTI (36%)
    // PITI must be less than or equal to (36% of gross income) - (other monthly debts)
    const maxMonthlyPITI_BE = maxMonthlyDebt_BE - inputs.monthlyDebts;

    // 4. Final Max Monthly PITI: The lower of the two PITI constraints
    const maxMonthlyPITI = Math.min(maxMonthlyPITI_FE, maxMonthlyPITI_BE);

    // If maxMonthlyPITI is negative (debts are too high), stop.
    if (maxMonthlyPITI <= 0) {
        renderResults({
            maxHomePrice: 0,
            maxLoanAmount: 0,
            maxPITI: maxMonthlyPITI,
            monthlyDebt: inputs.monthlyDebts
        });
        showToast('Your current monthly debt is too high to qualify for a loan.', 'error');
        return;
    }

    // 5. Calculate Mortgage Constant Components
    const monthlyRate = inputs.interestRate / 100 / 12;
    const termMonths = inputs.mortgageTerm * 12;
    const P_I_Factor = (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1) || 0;

    // 6. Calculate Fixed Cost Factors (Tax, Insurance)
    const taxFactorMonthly = AFFORDABILITY_CALCULATOR.INITIAL_STATE.propertyTaxRate / 12;
    const insuranceFactorMonthly = AFFORDABILITY_CALCULATOR.INITIAL_STATE.insuranceRate / 12;
    
    // 7. Calculate PMI Factor
    let pmiFactorMonthly = 0;
    // Check if down payment is less than 20% of the calculated home price (simplified check using a fixed multiple of income for initial estimate)
    const estimatedHomePriceCheck = inputs.annualIncome * 4; 
    if (inputs.downPayment / estimatedHomePriceCheck < 0.20) { 
        pmiFactorMonthly = AFFORDABILITY_CALCULATOR.INITIAL_STATE.pmiRate / 12;
    }

    // 8. Algebraic Solution for Max Loan Amount (L)
    // L = (Max Monthly PITI - Down Payment * (TaxFactor + InsFactor)) / (P_I_Factor + TaxFactor + InsFactor + PMI_Factor)

    const numerator = maxMonthlyPITI - inputs.downPayment * (taxFactorMonthly + insuranceFactorMonthly);
    const denominator = P_I_Factor + taxFactorMonthly + insuranceFactorMonthly + pmiFactorMonthly;
    
    const maxLoanAmount = numerator / denominator;
    const maxHomePrice = maxLoanAmount + inputs.downPayment;

    // 9. Render Results
    const results = {
        maxHomePrice: Math.max(0, maxHomePrice),
        maxLoanAmount: Math.max(0, maxLoanAmount),
        maxPITI: maxMonthlyPITI,
        monthlyDebt: inputs.monthlyDebts,
        // Detailed breakdown (calculated from the final Max Home Price)
        estimatedP_I: (maxLoanAmount > 0 ? maxLoanAmount * P_I_Factor : 0),
        estimatedTax: (maxHomePrice > 0 ? maxHomePrice * taxFactorMonthly : 0),
        estimatedIns: (maxHomePrice > 0 ? maxHomePrice * insuranceFactorMonthly : 0),
        estimatedPMI: (pmiFactorMonthly > 0 && maxLoanAmount > 0 ? maxLoanAmount * pmiFactorMonthly : 0),
        estimatedTotalPITI: maxMonthlyPITI
    };
    
    // Adjust total PITI to be the sum of components, or the DTI limit, whichever is lower
    const sumOfComponents = results.estimatedP_I + results.estimatedTax + results.estimatedIns + results.estimatedPMI;
    results.estimatedTotalPITI = Math.min(maxMonthlyPITI, sumOfComponents);

    renderResults(results);
    renderInsights(results, inputs);
    speech.speakResults(results);
}


// ==========================================================================
// III. DATA INPUT AND UTILITIES
// ==========================================================================

/**
 * Reads all input values from the form.
 * @returns {object} An object containing all calculator inputs.
 */
function getCalculatorInputs() {
    // Helper function to safely parse currency-formatted inputs
    const parseNumeric = (id, defaultValue) => {
        const value = document.getElementById(id).value;
        return parseFloat(value.replace(/[^0-9.]/g, '')) || defaultValue;
    };

    return {
        annualIncome: parseNumeric('annualIncome', AFFORDABILITY_CALCULATOR.INITIAL_STATE.annualIncome),
        monthlyDebts: parseNumeric('monthlyDebts', AFFORDABILITY_CALCULATOR.INITIAL_STATE.monthlyDebts),
        downPayment: parseNumeric('downPayment', AFFORDABILITY_CALCULATOR.INITIAL_STATE.downPayment),
        mortgageTerm: parseInt(document.getElementById('mortgageTerm').value) || AFFORDABILITY_CALCULATOR.INITIAL_STATE.mortgageTerm,
        interestRate: parseFloat(document.getElementById('interestRate').value) || AFFORDABILITY_CALCULATOR.INITIAL_STATE.interestRate,
        zipCode: document.getElementById('zipCode').value.trim()
    };
}

/**
 * Formats a number as USD currency.
 * @param {number} number The number to format.
 * @returns {string} Formatted currency string.
 */
function formatCurrency(number) {
    if (isNaN(number) || number < 0) return '$0';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
}

/**
 * Formats a number as a percentage.
 * @param {number} number The number to format.
 * @returns {string} Formatted percentage string.
 */
function formatPercent(number) {
    // Handle cases where the number is NaN or non-finite
    if (!isFinite(number) || isNaN(number) || number < 0) return '0.00%';
    return (number * 100).toFixed(2) + '%';
}


// ==========================================================================
// IV. RESULTS RENDERING
// ==========================================================================

/**
 * Renders the calculated results to the DOM.
 * @param {object} results The calculation results object.
 */
function renderResults(results) {
    document.getElementById('result-price').textContent = formatCurrency(results.maxHomePrice);
    document.getElementById('result-loan-amount').textContent = formatCurrency(results.maxLoanAmount);
    document.getElementById('result-monthly-
