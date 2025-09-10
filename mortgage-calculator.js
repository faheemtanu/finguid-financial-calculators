// ===== MORTGAGE CALCULATOR FUNCTIONALITY =====

document.addEventListener('DOMContentLoaded', function() {
    
    // Get form elements
    const mortgageForm = document.getElementById('mortgage-form');
    const homePriceInput = document.getElementById('home-price');
    const downPaymentInput = document.getElementById('down-payment');
    const interestRateInput = document.getElementById('interest-rate');
    const loanTermInput = document.getElementById('loan-term');
    const propertyTaxInput = document.getElementById('property-tax');
    const homeInsuranceInput = document.getElementById('home-insurance');
    const hoaFeesInput = document.getElementById('hoa-fees');
    
    // Get results elements
    const resultsCard = document.getElementById('results-card');
    const amortizationCard = document.getElementById('amortization-card');
    
    // Initialize calculator
    initializeMortgageCalculator();
    
    function initializeMortgageCalculator() {
        // Set up form validation
        setupFormValidation();
        
        // Set up currency formatting
        setupCurrencyInputs();
        
        // Set up form submission
        mortgageForm.addEventListener('submit', handleFormSubmission);
        
        // Set up down payment percentage calculation
        homePriceInput.addEventListener('input', updateDownPaymentPercentage);
        downPaymentInput.addEventListener('input', updateDownPaymentPercentage);
        
        // Track calculator usage
        trackCalculatorPageLoad();
    }
    
    function setupFormValidation() {
        // Add validation classes and messages
        const requiredFields = [homePriceInput, downPaymentInput, interestRateInput];
        
        requiredFields.forEach(field => {
            field.addEventListener('blur', validateField);
            field.addEventListener('input', clearFieldError);
        });
    }
    
    function setupCurrencyInputs() {
        const currencyInputs = document.querySelectorAll('.currency-input');
        
        currencyInputs.forEach(input => {
            input.addEventListener('input', formatCurrencyInput);
            input.addEventListener('blur', formatCurrencyOnBlur);
        });
    }
    
    function formatCurrencyInput(event) {
        const input = event.target;
        let value = input.value.replace(/[^0-9]/g, '');
        
        if (value) {
            value = parseInt(value).toLocaleString();
        }
        
        input.value = value;
    }
    
    function formatCurrencyOnBlur(event) {
        const input = event.target;
        if (!input.value) return;
        
        const numValue = parseFloat(input.value.replace(/[^0-9.]/g, ''));
        if (!isNaN(numValue)) {
            input.value = numValue.toLocaleString();
        }
    }
    
    function updateDownPaymentPercentage() {
        const homePrice = parseFloat(homePriceInput.value.replace(/[^0-9.]/g, '')) || 0;
        const downPayment = parseFloat(downPaymentInput.value.replace(/[^0-9.]/g, '')) || 0;
        
        const percentage = homePrice > 0 ? (downPayment / homePrice * 100).toFixed(1) : 0;
        document.getElementById('down-payment-percent').textContent = `${percentage}%`;
    }
    
    function validateField(event) {
        const field = event.target;
        const value = field.value.trim();
        
        // Remove existing error styling
        field.classList.remove('error');
        removeFieldError(field);
        
        if (!value && isRequiredField(field)) {
            addFieldError(field, 'This field is required');
            return false;
        }
        
        // Validate specific field types
        if (field === interestRateInput) {
            const rate = parseFloat(value);
            if (isNaN(rate) || rate < 0 || rate > 30) {
                addFieldError(field, 'Please enter a valid interest rate (0-30%)');
                return false;
            }
        }
        
        return true;
    }
    
    function clearFieldError(event) {
        const field = event.target;
        field.classList.remove('error');
        removeFieldError(field);
    }
    
    function addFieldError(field, message) {
        field.classList.add('error');
        
        // Remove existing error message
        removeFieldError(field);
        
        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.textContent = message;
        
        field.parentNode.parentNode.appendChild(errorDiv);
    }
    
    function removeFieldError(field) {
        const errorElement = field.parentNode.parentNode.querySelector('.form-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    function isRequiredField(field) {
        return [homePriceInput, downPaymentInput, interestRateInput].includes(field);
    }
    
    function handleFormSubmission(event) {
        event.preventDefault();
        
        // Validate all required fields
        const isValid = validateAllFields();
        
        if (isValid) {
            calculateMortgage();
            showResults();
            scrollToResults();
            trackCalculatorUsage();
        }
    }
    
    function validateAllFields() {
        let isValid = true;
        const requiredFields = [homePriceInput, downPaymentInput, interestRateInput];
        
        requiredFields.forEach(field => {
            if (!validateField({ target: field })) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    function calculateMortgage() {
        // Get input values
        const homePrice = parseFloat(homePriceInput.value.replace(/[^0-9.]/g, '')) || 0;
        const downPayment = parseFloat(downPaymentInput.value.replace(/[^0-9.]/g, '')) || 0;
        const annualRate = parseFloat(interestRateInput.value) || 0;
        const loanTermYears = parseInt(loanTermInput.value) || 30;
        const annualPropertyTax = parseFloat(propertyTaxInput.value.replace(/[^0-9.]/g, '')) || 0;
        const annualInsurance = parseFloat(homeInsuranceInput.value.replace(/[^0-9.]/g, '')) || 0;
        const monthlyHOA = parseFloat(hoaFeesInput.value.replace(/[^0-9.]/g, '')) || 0;
        
        // Calculate loan amount
        const loanAmount = homePrice - downPayment;
        
        // Calculate monthly payment (Principal & Interest)
        const monthlyRate = annualRate / 100 / 12;
        const totalPayments = loanTermYears * 12;
        
        let monthlyPI = 0;
        if (monthlyRate > 0) {
            monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))
                / (Math.pow(1 + monthlyRate, totalPayments) - 1);
        } else {
            monthlyPI = loanAmount / totalPayments;
        }
        
        // Calculate PMI (if down payment < 20%)
        const downPaymentPercent = (downPayment / homePrice) * 100;
        const monthlyPMI = downPaymentPercent < 20 ? calculatePMI(loanAmount, homePrice) : 0;
        
        // Calculate other monthly costs
        const monthlyPropertyTax = annualPropertyTax / 12;
        const monthlyInsurance = annualInsurance / 12;
        
        // Calculate totals
        const totalMonthlyPayment = monthlyPI + monthlyPMI + monthlyPropertyTax + monthlyInsurance + monthlyHOA;
        const totalInterest = (monthlyPI * totalPayments) - loanAmount;
        const totalPaid = loanAmount + totalInterest;
        
        // Store results for display
        const results = {
            loanAmount: loanAmount,
            monthlyPI: monthlyPI,
            monthlyPMI: monthlyPMI,
            monthlyPropertyTax: monthlyPropertyTax,
            monthlyInsurance: monthlyInsurance,
            monthlyHOA: monthlyHOA,
            totalMonthlyPayment: totalMonthlyPayment,
            totalInterest: totalInterest,
            totalPaid: totalPaid,
            annualRate: annualRate,
            loanTermYears: loanTermYears,
            totalPayments: totalPayments
        };
        
        displayResults(results);
        generateAmortizationSchedule(loanAmount, monthlyRate, totalPayments, monthlyPI);
    }
    
    function calculatePMI(loanAmount, homeValue) {
        const ltvRatio = loanAmount / homeValue;
        let pmiRate = 0.005; // Default 0.5%
        
        // Adjust PMI rate based on LTV ratio
        if (ltvRatio > 0.95) {
            pmiRate = 0.012; // 1.2%
        } else if (ltvRatio > 0.90) {
            pmiRate = 0.008; // 0.8%
        } else if (ltvRatio > 0.85) {
            pmiRate = 0.006; // 0.6%
        }
        
        const annualPMI = loanAmount * pmiRate;
        return annualPMI / 12;
    }
    
    function displayResults(results) {
        // Update payment breakdown
        document.getElementById('total-monthly-payment').textContent = formatCurrency(results.totalMonthlyPayment);
        document.getElementById('principal-interest').textContent = formatCurrency(results.monthlyPI);
        document.getElementById('monthly-property-tax').textContent = formatCurrency(results.monthlyPropertyTax);
        document.getElementById('monthly-insurance').textContent = formatCurrency(results.monthlyInsurance);
        
        // Show/hide PMI row
        const pmiRow = document.getElementById('pmi-row');
        if (results.monthlyPMI > 0) {
            document.getElementById('monthly-pmi').textContent = formatCurrency(results.monthlyPMI);
            pmiRow.style.display = 'flex';
        } else {
            pmiRow.style.display = 'none';
        }
        
        // Show/hide HOA row
        const hoaRow = document.getElementById('hoa-row');
        if (results.monthlyHOA > 0) {
            document.getElementById('monthly-hoa').textContent = formatCurrency(results.monthlyHOA);
            hoaRow.style.display = 'flex';
        } else {
            hoaRow.style.display = 'none';
        }
        
        // Update loan summary
        document.getElementById('loan-amount-display').textContent = formatCurrency(results.loanAmount);
        document.getElementById('total-interest').textContent = formatCurrency(results.totalInterest);
        document.getElementById('total-paid').textContent = formatCurrency(results.totalPaid);
    }
    
    function generateAmortizationSchedule(loanAmount, monthlyRate, totalPayments, monthlyPI) {
        const tbody = document.getElementById('amortization-tbody');
        tbody.innerHTML = '';
        
        let remainingBalance = loanAmount;
        let yearlyPrincipalPaid = 0;
        let yearlyInterestPaid = 0;
        
        for (let month = 1; month <= totalPayments; month++) {
            const interestPayment = remainingBalance * monthlyRate;
            const principalPayment = monthlyPI - interestPayment;
            remainingBalance -= principalPayment;
            
            yearlyPrincipalPaid += principalPayment;
            yearlyInterestPaid += interestPayment;
            
            // Display yearly totals
            if (month % 12 === 0 || month === totalPayments) {
                const year = Math.ceil(month / 12);
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>Year ${year}</td>
                    <td>${formatCurrency(yearlyPrincipalPaid)}</td>
                    <td>${formatCurrency(yearlyInterestPaid)}</td>
                    <td>${formatCurrency(Math.max(0, remainingBalance))}</td>
                `;
                
                tbody.appendChild(row);
                
                // Reset yearly totals
                yearlyPrincipalPaid = 0;
                yearlyInterestPaid = 0;
            }
        }
    }
    
    function showResults() {
        resultsCard.style.display = 'block';
        amortizationCard.style.display = 'block';
        
        // Animate results appearance
        setTimeout(() => {
            resultsCard.classList.add('fade-in-up');
            amortizationCard.classList.add('fade-in-up');
        }, 100);
    }
    
    function scrollToResults() {
        resultsCard.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    function trackCalculatorPageLoad() {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                'event_category': 'calculator',
                'event_label': 'mortgage_calculator'
            });
        }
    }
    
    function trackCalculatorUsage() {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'mortgage_calculation', {
                'event_category': 'engagement',
                'event_label': 'calculate_button_clicked'
            });
        }
    }
});

// ===== UTILITY FUNCTIONS FOR MORTGAGE CALCULATOR =====

function formatCurrency(amount) {
    if (isNaN(amount) || amount === null) return '$0';
    
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Math.round(amount));
}

function formatPercent(decimal, decimals = 2) {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(decimal);
}

// ===== ENHANCED FORM VALIDATION =====

function validateMortgageInputs(data) {
    const errors = {};
    
    if (!data.homePrice || data.homePrice <= 0) {
        errors.homePrice = 'Please enter a valid home price';
    }
    
    if (!data.downPayment || data.downPayment <= 0) {
        errors.downPayment = 'Please enter a valid down payment';
    }
    
    if (data.downPayment >= data.homePrice) {
        errors.downPayment = 'Down payment must be less than home price';
    }
    
    if (!data.interestRate || data.interestRate <= 0 || data.interestRate > 30) {
        errors.interestRate = 'Please enter a valid interest rate (0.1% - 30%)';
    }
    
    if (data.propertyTax < 0) {
        errors.propertyTax = 'Property tax cannot be negative';
    }
    
    if (data.homeInsurance < 0) {
        errors.homeInsurance = 'Home insurance cannot be negative';
    }
    
    if (data.hoaFees < 0) {
        errors.hoaFees = 'HOA fees cannot be negative';
    }
    
    return errors;
}

// ===== MORTGAGE INSIGHTS AND RECOMMENDATIONS =====

function generateMortgageInsights(results) {
    const insights = [];
    const downPaymentPercent = results.downPaymentPercent;
    const dtiRatio = results.totalMonthlyPayment / results.monthlyIncome;
    
    // Down payment insights
    if (downPaymentPercent < 20) {
        insights.push({
            type: 'warning',
            title: 'PMI Required',
            message: `With a ${downPaymentPercent.toFixed(1)}% down payment, you'll pay $${formatCurrency(results.monthlyPMI)} monthly for PMI. Consider increasing your down payment to 20% to eliminate this cost.`
        });
    } else {
        insights.push({
            type: 'success',
            title: 'No PMI Required',
            message: 'Great! With a 20%+ down payment, you won\'t need to pay private mortgage insurance.'
        });
    }
    
    // Interest rate insights
    if (results.annualRate > 7.5) {
        insights.push({
            type: 'info',
            title: 'Interest Rate Consideration',
            message: 'Your interest rate is above the current average. Consider shopping around for better rates or improving your credit score.'
        });
    }
    
    // Loan term insights
    if (results.loanTermYears === 30) {
        const savings15Year = calculate15YearSavings(results);
        insights.push({
            type: 'info',
            title: '15-Year Loan Comparison',
            message: `A 15-year loan would save you approximately $${formatCurrency(savings15Year)} in interest, but increase your monthly payment.`
        });
    }
    
    return insights;
}

function calculate15YearSavings(results30) {
    // Calculate 15-year loan savings
    const monthlyRate = results30.annualRate / 100 / 12;
    const payments15 = 15 * 12;
    
    const monthly15 = results30.loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, payments15))
        / (Math.pow(1 + monthlyRate, payments15) - 1);
    
    const totalInterest15 = (monthly15 * payments15) - results30.loanAmount;
    
    return results30.totalInterest - totalInterest15;
}

// ===== EXPORT FUNCTIONS FOR OTHER SCRIPTS =====

window.MortgageCalculator = {
    formatCurrency,
    formatPercent,
    validateMortgageInputs,
    generateMortgageInsights
};
