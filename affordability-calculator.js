// DOM Elements
const annualIncomeInput = document.getElementById('annualIncome');
const monthlyDebtsInput = document.getElementById('monthlyDebts');
const downPaymentInput = document.getElementById('downPayment');
const downPaymentPercentInput = document.getElementById('downPaymentPercent');
const interestRateInput = document.getElementById('interestRate');
const loanTermSelect = document.getElementById('loanTerm');
const stateSelect = document.getElementById('state');
const propertyTaxInput = document.getElementById('propertyTax');
const homeInsuranceInput = document.getElementById('homeInsurance');
const hoaFeesInput = document.getElementById('hoaFees');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const resultsContainer = document.getElementById('results');

// Result Elements
const maxHomePriceEl = document.getElementById('maxHomePrice');
const monthlyPaymentEl = document.getElementById('monthlyPayment');
const loanAmountEl = document.getElementById('loanAmount');
const dtiRatioEl = document.getElementById('dtiRatio');
const breakdownPIEl = document.getElementById('breakdownPI');
const breakdownTaxEl = document.getElementById('breakdownTax');
const breakdownInsuranceEl = document.getElementById('breakdownInsurance');
const breakdownHOAEl = document.getElementById('breakdownHOA');
const breakdownTotalEl = document.getElementById('breakdownTotal');
const aiInsightsTextEl = document.getElementById('aiInsightsText');

// State tax rates (simplified for demo)
const stateTaxRates = {
    'CA': 0.0076, // California
    'TX': 0.0180, // Texas
    'FL': 0.0098, // Florida
    'NY': 0.0132  // New York
};

// Default property tax rate if state not selected
const defaultTaxRate = 0.011;

// Event Listeners
calculateBtn.addEventListener('click', calculateAffordability);
resetBtn.addEventListener('click', resetCalculator);

// Sync down payment amount and percentage
downPaymentInput.addEventListener('input', updateDownPaymentPercent);
downPaymentPercentInput.addEventListener('input', updateDownPaymentAmount);

// Update property tax based on state selection
stateSelect.addEventListener('change', updatePropertyTax);

// Calculate home affordability
function calculateAffordability() {
    // Get input values
    const annualIncome = parseFloat(annualIncomeInput.value) || 0;
    const monthlyDebts = parseFloat(monthlyDebtsInput.value) || 0;
    const downPayment = parseFloat(downPaymentInput.value) || 0;
    const interestRate = parseFloat(interestRateInput.value) || 0;
    const loanTerm = parseInt(loanTermSelect.value) || 30;
    const homeInsurance = parseFloat(homeInsuranceInput.value) || 0;
    const hoaFees = parseFloat(hoaFeesInput.value) || 0;
    
    // Calculate monthly income
    const monthlyIncome = annualIncome / 12;
    
    // Calculate maximum monthly payment using the 28/36 rule
    const frontEndMax = monthlyIncome * 0.28;
    const backEndMax = monthlyIncome * 0.36 - monthlyDebts;
    const maxMonthlyPayment = Math.min(frontEndMax, backEndMax);
    
    // Calculate property tax
    let propertyTaxRate = defaultTaxRate;
    if (stateSelect.value && stateTaxRates[stateSelect.value]) {
        propertyTaxRate = stateTaxRates[stateSelect.value];
    }
    
    // Estimate home price based on monthly payment
    const estimatedHomePrice = estimateHomePrice(
        maxMonthlyPayment, 
        downPayment, 
        interestRate, 
        loanTerm, 
        propertyTaxRate, 
        homeInsurance, 
        hoaFees
    );
    
    // Calculate loan amount
    const loanAmount = estimatedHomePrice - downPayment;
    
    // Calculate monthly mortgage payment breakdown
    const monthlyPaymentBreakdown = calculateMonthlyPayment(
        loanAmount, 
        interestRate, 
        loanTerm, 
        estimatedHomePrice * propertyTaxRate / 12, 
        homeInsurance / 12, 
        hoaFees
    );
    
    // Calculate debt-to-income ratio
    const dtiRatio = ((monthlyPaymentBreakdown.total + monthlyDebts) / monthlyIncome * 100).toFixed(1);
    
    // Display results
    displayResults(
        estimatedHomePrice, 
        monthlyPaymentBreakdown, 
        loanAmount, 
        dtiRatio
    );
    
    // Show results container
    resultsContainer.style.display = 'block';
    
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
    
    // Track calculation event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'affordability_calculated', {
            'event_category': 'calculator',
            'event_label': 'home_affordability',
            'value': estimatedHomePrice
        });
    }
}

// Estimate home price based on monthly payment
function estimateHomePrice(monthlyPayment, downPayment, interestRate, loanTerm, propertyTaxRate, annualInsurance, monthlyHoa) {
    // Convert annual values to monthly
    const monthlyInsurance = annualInsurance / 12;
    const monthlyPropertyTax = (propertyTaxRate / 12);
    
    // Calculate principal and interest portion of payment
    const piPayment = monthlyPayment - monthlyHoa - monthlyInsurance;
    
    // Calculate maximum loan amount based on PI payment
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    
    // If no interest rate provided, use a simplified calculation
    if (interestRate === 0) {
        return downPayment + (piPayment * numberOfPayments);
    }
    
    const loanAmount = piPayment * (1 - Math.pow(1 + monthlyRate, -numberOfPayments)) / monthlyRate;
    
    // Calculate home price (loan amount + down payment)
    let homePrice = loanAmount + downPayment;
    
    // Adjust for property tax (iterative approach for better accuracy)
    let adjustedHomePrice = homePrice;
    let previousHomePrice = 0;
    let iterations = 0;
    
    while (Math.abs(adjustedHomePrice - previousHomePrice) > 10 && iterations < 10) {
        previousHomePrice = adjustedHomePrice;
        const monthlyTax = adjustedHomePrice * monthlyPropertyTax;
        const adjustedPIPayment = monthlyPayment - monthlyHoa - monthlyInsurance - monthlyTax;
        
        if (adjustedPIPayment <= 0) {
            break;
        }
        
        const adjustedLoanAmount = adjustedPIPayment * (1 - Math.pow(1 + monthlyRate, -numberOfPayments)) / monthlyRate;
        adjustedHomePrice = adjustedLoanAmount + downPayment;
        iterations++;
    }
    
    return Math.max(0, adjustedHomePrice);
}

// Calculate monthly payment breakdown
function calculateMonthlyPayment(loanAmount, interestRate, loanTerm, monthlyTax, monthlyInsurance, monthlyHoa) {
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    
    let monthlyPI = 0;
    
    if (interestRate === 0) {
        monthlyPI = loanAmount / numberOfPayments;
    } else {
        monthlyPI = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments) / 
                   (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    }
    
    const totalPayment = monthlyPI + monthlyTax + monthlyInsurance + monthlyHoa;
    
    return {
        principalInterest: monthlyPI,
        tax: monthlyTax,
        insurance: monthlyInsurance,
        hoa: monthlyHoa,
        total: totalPayment
    };
}

// Display results
function displayResults(homePrice, paymentBreakdown, loanAmount, dtiRatio) {
    // Format currency
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    const detailedFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // Update result elements
    maxHomePriceEl.textContent = formatter.format(homePrice);
    monthlyPaymentEl.textContent = detailedFormatter.format(paymentBreakdown.total);
    loanAmountEl.textContent = formatter.format(loanAmount);
    dtiRatioEl.textContent = dtiRatio + '%';
    
    // Update breakdown elements
    breakdownPIEl.textContent = detailedFormatter.format(paymentBreakdown.principalInterest);
    breakdownTaxEl.textContent = detailedFormatter.format(paymentBreakdown.tax);
    breakdownInsuranceEl.textContent = detailedFormatter.format(paymentBreakdown.insurance);
    breakdownHOAEl.textContent = detailedFormatter.format(paymentBreakdown.hoa);
    breakdownTotalEl.textContent = detailedFormatter.format(paymentBreakdown.total);
    
    // Generate AI insights
    generateAIInsights(homePrice, paymentBreakdown, dtiRatio);
}

// Generate AI-powered insights
function generateAIInsights(homePrice, paymentBreakdown, dtiRatio) {
    const annualIncome = parseFloat(annualIncomeInput.value) || 0;
    const downPayment = parseFloat(downPaymentInput.value) || 0;
    
    let insights = '';
    
    // DTI ratio analysis
    if (dtiRatio > 43) {
        insights += `⚠️ Your debt-to-income ratio is ${dtiRatio}%, which is above the 43% threshold that many lenders prefer. Consider paying down existing debts to improve your affordability.<br><br>`;
    } else if (dtiRatio > 36) {
        insights += `📋 Your debt-to-income ratio is ${dtiRatio}%, which is within acceptable limits but on the higher side. Some lenders may still approve your mortgage.<br><br>`;
    } else {
        insights += `✅ Your debt-to-income ratio is ${dtiRatio}%, which is excellent. You're in a strong position to qualify for a mortgage.<br><br>`;
    }
    
    // Down payment analysis
    const downPaymentPercent = (downPayment / homePrice * 100) || 0;
    if (downPaymentPercent < 20) {
        insights += `💡 With a ${downPaymentPercent.toFixed(1)}% down payment, you'll likely need to pay for Private Mortgage Insurance (PMI), which adds to your monthly costs. Consider saving for a larger down payment if possible.<br><br>`;
    } else {
        insights += `🎉 Your ${downPaymentPercent.toFixed(1)}% down payment is excellent! You'll avoid PMI and get better interest rates.<br><br>`;
    }
    
    // Housing cost analysis
    const housingCostRatio = (paymentBreakdown.total / (annualIncome / 12) * 100).toFixed(1);
    insights += `🏠 Your housing costs would be ${housingCostRatio}% of your monthly income. The recommended maximum is 28%.<br><br>`;
    
    // Location-specific advice
    if (stateSelect.value) {
        insights += `📍 Based on your location (${stateSelect.options[stateSelect.selectedIndex].text}), property taxes are ${(stateTaxRates[stateSelect.value] * 100).toFixed(2)}% of home value annually. This is ${stateTaxRates[stateSelect.value] > defaultTaxRate ? 'higher' : 'lower'} than the national average.<br><br>`;
    }
    
    // General recommendations
    insights += `💡 Recommendation: Consider homes priced up to ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(homePrice * 0.9)} to maintain a comfortable budget buffer.`;
    
    aiInsightsTextEl.innerHTML = insights;
}

// Update down payment percentage based on amount
function updateDownPaymentPercent() {
    const downPayment = parseFloat(downPaymentInput.value) || 0;
    const homePrice = parseFloat(maxHomePriceEl.textContent.replace(/[^0-9.-]+/g, "")) || 300000;
    
    if (homePrice > 0) {
        const percent = (downPayment / homePrice * 100).toFixed(1);
        downPaymentPercentInput.value = percent;
    }
}

// Update down payment amount based on percentage
function updateDownPaymentAmount() {
    const percent = parseFloat(downPaymentPercentInput.value) || 0;
    const homePrice = parseFloat(maxHomePriceEl.textContent.replace(/[^0-9.-]+/g, "")) || 300000;
    
    if (homePrice > 0) {
        const amount = homePrice * (percent / 100);
        downPaymentInput.value = Math.round(amount);
    }
}

// Update property tax based on state selection
function updatePropertyTax() {
    if (stateSelect.value && stateTaxRates[stateSelect.value]) {
        const taxRate = stateTaxRates[stateSelect.value];
        const homePrice = parseFloat(maxHomePriceEl.textContent.replace(/[^0-9.-]+/g, "")) || 300000;
        const annualTax = homePrice * taxRate;
        propertyTaxInput.value = Math.round(annualTax);
    } else {
        propertyTaxInput.value = '';
    }
}

// Reset calculator
function resetCalculator() {
    annualIncomeInput.value = '';
    monthlyDebtsInput.value = '';
    downPaymentInput.value = '';
    downPaymentPercentInput.value = '';
    interestRateInput.value = '';
    loanTermSelect.value = '30';
    stateSelect.value = '';
    propertyTaxInput.value = '';
    homeInsuranceInput.value = '';
    hoaFeesInput.value = '';
    
    resultsContainer.style.display = 'none';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize calculator with some default values for demo
document.addEventListener('DOMContentLoaded', function() {
    // Set some reasonable defaults for demonstration
    annualIncomeInput.value = '75000';
    monthlyDebtsInput.value = '500';
    downPaymentInput.value = '20000';
    interestRateInput.value = '7.5';
    homeInsuranceInput.value = '1200';
    
    // Add event listeners to all calculate buttons for tracking
    document.querySelectorAll('.calculate-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'calculator_use', {
                    'event_category': 'calculator',
                    'event_label': this.closest('.calculator-card').querySelector('h2').textContent,
                    'value': 1
                });
            }
        });
    });
});