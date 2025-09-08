// Advanced Mortgage Calculator JavaScript with State Integration and PMI
// Document ready initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeMortgageCalculator();
});

// Global variables for data
let stateTaxRates = {};
let pmiRates = {};
let isPercentageMode = false;

// Initialize the mortgage calculator
async function initializeMortgageCalculator() {
    try {
        // Load external data files
        await loadCalculatorData();
        
        // Set up event listeners
        setupEventListeners();
        
        // Set default values
        setDefaultValues();
        
        // Populate state dropdown
        populateStateDropdown();
        
        console.log('Mortgage calculator initialized successfully');
    } catch (error) {
        console.error('Error initializing mortgage calculator:', error);
        // Fallback initialization without external data
        fallbackInitialization();
    }
}

// Load calculator data from JSON files
async function loadCalculatorData() {
    try {
        const [taxRatesResponse, pmiRatesResponse] = await Promise.all([
            fetch('data/state-tax-rates.json'),
            fetch('data/pmi-rates.json')
        ]);
        
        if (taxRatesResponse.ok) {
            stateTaxRates = await taxRatesResponse.json();
        }
        
        if (pmiRatesResponse.ok) {
            pmiRates = await pmiRatesResponse.json();
        }
    } catch (error) {
        console.warn('Could not load external data files:', error);
        // Use fallback data
        useFallbackData();
    }
}

// Fallback data if JSON files are not available
function useFallbackData() {
    stateTaxRates = {
        "Alabama": 0.41, "Alaska": 1.04, "Arizona": 0.62, "Arkansas": 0.62,
        "California": 0.76, "Colorado": 0.51, "Connecticut": 1.70, "Delaware": 0.57,
        "Florida": 0.89, "Georgia": 0.92, "Hawaii": 0.28, "Idaho": 0.69,
        "Illinois": 2.08, "Indiana": 0.85, "Iowa": 1.50, "Kansas": 1.29,
        "Kentucky": 0.82, "Louisiana": 0.55, "Maine": 1.27, "Maryland": 1.09,
        "Massachusetts": 1.17, "Michigan": 1.44, "Minnesota": 1.11, "Mississippi": 0.81,
        "Missouri": 0.97, "Montana": 0.83, "Nebraska": 1.65, "Nevada": 0.60,
        "New Hampshire": 2.05, "New Jersey": 2.21, "New Mexico": 0.80, "New York": 1.40,
        "North Carolina": 0.84, "North Dakota": 0.99, "Ohio": 1.56, "Oklahoma": 0.90,
        "Oregon": 0.97, "Pennsylvania": 1.51, "Rhode Island": 1.53, "South Carolina": 0.57,
        "South Dakota": 1.22, "Tennessee": 0.71, "Texas": 1.60, "Utah": 0.63,
        "Vermont": 1.86, "Virginia": 0.82, "Washington": 0.93, "West Virginia": 0.58,
        "Wisconsin": 1.73, "Wyoming": 0.61
    };
    
    // PMI rates based on LTV and credit score
    pmiRates = {
        "rates": [
            {"ltv_min": 95.01, "ltv_max": 100, "rate": 1.0},
            {"ltv_min": 90.01, "ltv_max": 95, "rate": 0.7},
            {"ltv_min": 85.01, "ltv_max": 90, "rate": 0.6},
            {"ltv_min": 80.01, "ltv_max": 85, "rate": 0.5}
        ]
    };
}

// Fallback initialization
function fallbackInitialization() {
    useFallbackData();
    populateStateDropdown();
    setupEventListeners();
    setDefaultValues();
}

// Populate state dropdown
function populateStateDropdown() {
    const stateSelect = document.getElementById('state');
    if (!stateSelect) return;
    
    // Clear existing options except the first one
    stateSelect.innerHTML = '<option value="">Select State</option>';
    
    // Sort states alphabetically and add them
    const sortedStates = Object.keys(stateTaxRates).sort();
    
    sortedStates.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
    });
}

// Set up all event listeners
function setupEventListeners() {
    const form = document.getElementById('mortgageForm');
    const toggleButton = document.getElementById('toggleDownPayment');
    const stateSelect = document.getElementById('state');
    const homePriceInput = document.getElementById('homePrice');
    const downPaymentInput = document.getElementById('downPayment');
    const pmiCheckbox = document.getElementById('pmiRequired');
    
    // Form submission
    if (form) {
        form.addEventListener('submit', handleFormSubmission);
    }
    
    // Down payment toggle
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleDownPaymentMode);
    }
    
    // State selection auto-fill property tax
    if (stateSelect) {
        stateSelect.addEventListener('change', handleStateChange);
    }
    
    // Auto-calculate PMI requirement
    if (homePriceInput && downPaymentInput) {
        homePriceInput.addEventListener('input', checkPmiRequirement);
        downPaymentInput.addEventListener('input', checkPmiRequirement);
    }
    
    // PMI checkbox toggle
    if (pmiCheckbox) {
        pmiCheckbox.addEventListener('change', togglePmiSection);
    }
    
    // Real-time calculation (debounced)
    const calculationInputs = ['homePrice', 'downPayment', 'interestRate', 'loanTerm', 'propertyTax', 'homeInsurance', 'hoaFees', 'pmiRate'];
    calculationInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', debounce(performCalculation, 500));
        }
    });
}

// Set default values
function setDefaultValues() {
    const defaults = {
        homePrice: '400000',
        downPayment: '80000',
        interestRate: '6.75',
        loanTerm: '30',
        homeInsurance: '1200'
    };
    
    Object.entries(defaults).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element && !element.value) {
            element.value = value;
        }
    });
}

// Handle form submission
function handleFormSubmission(event) {
    event.preventDefault();
    performCalculation();
    trackCalculatorUsage();
}

// Toggle down payment mode between $ and %
function toggleDownPaymentMode() {
    const toggleButton = document.getElementById('toggleDownPayment');
    const downPaymentInput = document.getElementById('downPayment');
    const homePriceInput = document.getElementById('homePrice');
    
    const homePrice = parseFloat(homePriceInput.value) || 0;
    const downPayment = parseFloat(downPaymentInput.value) || 0;
    
    isPercentageMode = !isPercentageMode;
    
    if (isPercentageMode) {
        toggleButton.textContent = '$';
        toggleButton.title = 'Switch to dollar amount';
        
        // Convert $ to %
        if (homePrice > 0 && downPayment > 0) {
            const percentage = (downPayment / homePrice) * 100;
            downPaymentInput.value = percentage.toFixed(1);
        }
        downPaymentInput.placeholder = '20.0';
    } else {
        toggleButton.textContent = '%';
        toggleButton.title = 'Switch to percentage';
        
        // Convert % to $
        if (homePrice > 0 && downPayment > 0) {
            const dollarAmount = (homePrice * downPayment) / 100;
            downPaymentInput.value = Math.round(dollarAmount);
        }
        downPaymentInput.placeholder = '80,000';
    }
    
    // Update PMI requirement check
    checkPmiRequirement();
}

// Handle state selection change
function handleStateChange() {
    const stateSelect = document.getElementById('state');
    const homePriceInput = document.getElementById('homePrice');
    const propertyTaxInput = document.getElementById('propertyTax');
    
    const selectedState = stateSelect.value;
    const homePrice = parseFloat(homePriceInput.value) || 0;
    
    if (selectedState && stateTaxRates[selectedState] && homePrice > 0) {
        const taxRate = stateTaxRates[selectedState];
        const annualPropertyTax = (homePrice * taxRate) / 100;
        propertyTaxInput.value = Math.round(annualPropertyTax);
        
        // Trigger calculation update
        performCalculation();
    }
}

// Check PMI requirement based on down payment
function checkPmiRequirement() {
    const homePriceInput = document.getElementById('homePrice');
    const downPaymentInput = document.getElementById('downPayment');
    const pmiCheckbox = document.getElementById('pmiRequired');
    const pmiSection = document.getElementById('pmiSection');
    const pmiRateInput = document.getElementById('pmiRate');
    
    const homePrice = parseFloat(homePriceInput.value) || 0;
    let downPayment = parseFloat(downPaymentInput.value) || 0;
    
    if (homePrice <= 0) return;
    
    // Convert percentage to dollar amount if needed
    if (isPercentageMode && downPayment > 0) {
        downPayment = (homePrice * downPayment) / 100;
    }
    
    const loanToValueRatio = ((homePrice - downPayment) / homePrice) * 100;
    
    if (loanToValueRatio > 80) {
        // PMI is required
        pmiCheckbox.checked = true;
        pmiSection.classList.remove('hidden');
        
        // Auto-calculate PMI rate based on LTV
        const pmiRate = calculatePmiRate(loanToValueRatio);
        pmiRateInput.value = pmiRate.toFixed(2);
    } else {
        // PMI is not required
        pmiCheckbox.checked = false;
        pmiSection.classList.add('hidden');
        pmiRateInput.value = '';
    }
}

// Calculate PMI rate based on LTV ratio
function calculatePmiRate(ltvRatio) {
    if (!pmiRates.rates) return 0.5; // Default rate
    
    for (const rate of pmiRates.rates) {
        if (ltvRatio >= rate.ltv_min && ltvRatio <= rate.ltv_max) {
            return rate.rate;
        }
    }
    
    return 0.5; // Default fallback rate
}

// Toggle PMI section visibility
function togglePmiSection() {
    const pmiCheckbox = document.getElementById('pmiRequired');
    const pmiSection = document.getElementById('pmiSection');
    
    if (pmiCheckbox.checked) {
        pmiSection.classList.remove('hidden');
    } else {
        pmiSection.classList.add('hidden');
    }
}

// Main calculation function
function performCalculation() {
    try {
        const formData = getFormData();
        
        if (!validateFormData(formData)) {
            showPlaceholder();
            return;
        }
        
        const results = calculateMortgage(formData);
        displayResults(results);
        generateAmortizationSchedule(results);
        
    } catch (error) {
        console.error('Calculation error:', error);
        showError('An error occurred during calculation. Please check your inputs.');
    }
}

// Get form data
function getFormData() {
    const homePrice = parseFloat(document.getElementById('homePrice').value) || 0;
    let downPayment = parseFloat(document.getElementById('downPayment').value) || 0;
    const loanTerm = parseInt(document.getElementById('loanTerm').value) || 30;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const propertyTax = parseFloat(document.getElementById('propertyTax').value) || 0;
    const homeInsurance = parseFloat(document.getElementById('homeInsurance').value) || 0;
    const hoaFees = parseFloat(document.getElementById('hoaFees').value) || 0;
    const pmiRequired = document.getElementById('pmiRequired').checked;
    const pmiRate = parseFloat(document.getElementById('pmiRate').value) || 0;
    
    // Convert percentage to dollar amount if needed
    if (isPercentageMode && downPayment > 0 && homePrice > 0) {
        downPayment = (homePrice * downPayment) / 100;
    }
    
    return {
        homePrice,
        downPayment,
        loanTerm,
        interestRate,
        propertyTax,
        homeInsurance,
        hoaFees,
        pmiRequired,
        pmiRate
    };
}

// Validate form data
function validateFormData(data) {
    if (data.homePrice <= 0 || data.interestRate <= 0 || data.downPayment < 0) {
        return false;
    }
    
    if (data.downPayment >= data.homePrice) {
        showError('Down payment cannot be greater than or equal to home price.');
        return false;
    }
    
    return true;
}

// Calculate mortgage details
function calculateMortgage(data) {
    const loanAmount = data.homePrice - data.downPayment;
    const monthlyInterestRate = data.interestRate / 100 / 12;
    const numberOfPayments = data.loanTerm * 12;
    
    // Calculate monthly principal and interest
    const monthlyPI = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
                      (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    
    // Calculate other monthly costs
    const monthlyPropertyTax = data.propertyTax / 12;
    const monthlyInsurance = data.homeInsurance / 12;
    const monthlyPmi = data.pmiRequired ? (loanAmount * data.pmiRate / 100) / 12 : 0;
    const monthlyTotal = monthlyPI + monthlyPropertyTax + monthlyInsurance + data.hoaFees + monthlyPmi;
    
    // Calculate totals over loan term
    const totalPrincipalAndInterest = monthlyPI * numberOfPayments;
    const totalInterest = totalPrincipalAndInterest - loanAmount;
    const totalPropertyTax = data.propertyTax * data.loanTerm;
    const totalInsurance = data.homeInsurance * data.loanTerm;
    const totalHoa = data.hoaFees * numberOfPayments;
    const totalPmi = monthlyPmi * numberOfPayments;
    const totalCost = totalPrincipalAndInterest + totalPropertyTax + totalInsurance + totalHoa + totalPmi;
    
    // Calculate down payment percentage
    const downPaymentPercent = (data.downPayment / data.homePrice) * 100;
    
    return {
        ...data,
        loanAmount,
        monthlyPI,
        monthlyPropertyTax,
        monthlyInsurance,
        monthlyPmi,
        monthlyTotal,
        totalInterest,
        totalCost,
        downPaymentPercent,
        monthlyInterestRate,
        numberOfPayments
    };
}

// Display calculation results
function displayResults(results) {
    const resultContainer = document.getElementById('mortgageResult');
    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
    
    const html = `
        <div class="result-summary">
            <div class="result-main">
                <div class="monthly-payment">${formatCurrency(results.monthlyTotal)}</div>
                <div class="result-label">Total Monthly Payment</div>
            </div>
            
            <div class="result-breakdown">
                <h3>Payment Breakdown</h3>
                <div class="breakdown-item">
                    <span>Principal & Interest</span>
                    <span>${formatCurrency(results.monthlyPI)}</span>
                </div>
                <div class="breakdown-item">
                    <span>Property Tax</span>
                    <span>${formatCurrency(results.monthlyPropertyTax)}</span>
                </div>
                <div class="breakdown-item">
                    <span>Home Insurance</span>
                    <span>${formatCurrency(results.monthlyInsurance)}</span>
                </div>
                ${results.monthlyPmi > 0 ? `
                <div class="breakdown-item">
                    <span>PMI</span>
                    <span>${formatCurrency(results.monthlyPmi)}</span>
                </div>
                ` : ''}
                ${results.hoaFees > 0 ? `
                <div class="breakdown-item">
                    <span>HOA Fees</span>
                    <span>${formatCurrency(results.hoaFees)}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="result-totals">
                <h3>Loan Summary</h3>
                <div class="breakdown-item">
                    <span>Loan Amount</span>
                    <span>${formatCurrency(results.loanAmount)}</span>
                </div>
                <div class="breakdown-item">
                    <span>Total Interest Paid</span>
                    <span>${formatCurrency(results.totalInterest)}</span>
                </div>
                <div class="breakdown-item">
                    <span>Total Cost of Loan</span>
                    <span>${formatCurrency(results.totalCost)}</span>
                </div>
                <div class="breakdown-item">
                    <span>Down Payment</span>
                    <span>${formatCurrency(results.downPayment)} (${results.downPaymentPercent.toFixed(1)}%)</span>
                </div>
            </div>
            
            ${generateAiInsight(results)}
        </div>
    `;
    
    resultContainer.innerHTML = html;
    
    // Show amortization section
    document.getElementById('amortizationSection').classList.remove('hidden');
}

// Generate AI-powered insight
function generateAiInsight(results) {
    let insight = '';
    let insightClass = 'ai-insight';
    
    if (results.downPaymentPercent < 10) {
        insight = `⚠️ <strong>Low Down Payment Alert:</strong> With only ${results.downPaymentPercent.toFixed(1)}% down, you'll pay higher PMI rates. Consider saving for at least 10% down to reduce costs.`;
        insightClass += ' warning';
    } else if (results.downPaymentPercent < 20) {
        const additionalNeeded = results.homePrice * 0.2 - results.downPayment;
        insight = `💡 <strong>PMI Savings Opportunity:</strong> You're ${formatCurrency(additionalNeeded)} away from eliminating PMI. This could save you ${formatCurrency(results.monthlyPmi * 12)} annually.`;
    } else if (results.interestRate > 7.5) {
        insight = `📈 <strong>Interest Rate Optimization:</strong> Your ${results.interestRate}% rate is above current averages. Consider shopping with multiple lenders to potentially save thousands.`;
    } else if (results.monthlyTotal > results.homePrice * 0.004) {
        insight = `⚖️ <strong>Affordability Check:</strong> Your monthly payment is ${((results.monthlyTotal / results.homePrice) * 100).toFixed(1)}% of home value. Consider a smaller loan or higher down payment.`;
    } else {
        insight = `✅ <strong>Excellent Setup:</strong> Your mortgage terms look favorable with ${results.downPaymentPercent.toFixed(1)}% down and a competitive ${results.interestRate}% rate!`;
    }
    
    const extraPaymentSavings = calculateExtraPaymentSavings(results);
    insight += ` <br><br><strong>💰 Pro Tip:</strong> Adding just $${Math.round(results.monthlyPI * 0.1)}/month extra to principal could save you approximately ${formatCurrency(extraPaymentSavings.interestSaved)} in interest and pay off your loan ${extraPaymentSavings.monthsSaved} months earlier.`;
    
    return `<div class="${insightClass}">
        <h3><i class="fas fa-brain"></i> AI Financial Insight</h3>
        <p>${insight}</p>
    </div>`;
}

// Calculate extra payment savings
function calculateExtraPaymentSavings(results) {
    const extraPayment = Math.round(results.monthlyPI * 0.1);
    const newMonthlyPayment = results.monthlyPI + extraPayment;
    
    // Simple calculation for demonstration
    const originalMonths = results.numberOfPayments;
    const newMonths = Math.round(originalMonths * 0.85); // Approximate reduction
    const monthsSaved = originalMonths - newMonths;
    const interestSaved = results.totalInterest * 0.15; // Approximate savings
    
    return { monthsSaved, interestSaved };
}

// Generate amortization schedule
function generateAmortizationSchedule(results) {
    const tableBody = document.querySelector('#amortizationTable tbody');
    if (!tableBody) return;
    
    let balance = results.loanAmount;
    const monthlyPayment = results.monthlyPI;
    const monthlyRate = results.monthlyInterestRate;
    
    let html = '';
    
    for (let year = 1; year <= results.loanTerm; year++) {
        let yearlyPrincipal = 0;
        let yearlyInterest = 0;
        const beginningBalance = balance;
        
        for (let month = 1; month <= 12; month++) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            
            yearlyPrincipal += principalPayment;
            yearlyInterest += interestPayment;
            balance -= principalPayment;
            
            if (balance <= 0) {
                balance = 0;
                break;
            }
        }
        
        html += `
            <tr>
                <td>${year}</td>
                <td>${formatCurrency(beginningBalance)}</td>
                <td>${formatCurrency(monthlyPayment)}</td>
                <td>${formatCurrency(yearlyPrincipal)}</td>
                <td>${formatCurrency(yearlyInterest)}</td>
                <td>${formatCurrency(balance)}</td>
            </tr>
        `;
        
        if (balance <= 0) break;
    }
    
    tableBody.innerHTML = html;
}

// Show placeholder
function showPlaceholder() {
    const resultContainer = document.getElementById('mortgageResult');
    resultContainer.innerHTML = `
        <div class="result-placeholder">
            <i class="fas fa-home"></i>
            <h3>Your Payment Breakdown</h3>
            <p>Enter your loan details to see your monthly payment breakdown and amortization schedule.</p>
        </div>
    `;
    
    document.getElementById('amortizationSection').classList.add('hidden');
}

// Show error message
function showError(message) {
    const resultContainer = document.getElementById('mortgageResult');
    resultContainer.innerHTML = `
        <div class="result-placeholder error">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Calculation Error</h3>
            <p>${message}</p>
        </div>
    `;
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Track calculator usage
function trackCalculatorUsage() {
    // Google Analytics tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', 'mortgage_calculation', {
            'event_category': 'Calculator',
            'event_label': 'Mortgage Calculator',
            'value': 1
        });
    }
    
    // Additional tracking can be added here
    console.log('Mortgage calculation tracked');
}