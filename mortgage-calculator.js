// Mortgage Calculator JavaScript with Advanced Features
// State tax rates data will be loaded from external JSON file
let stateTaxRates = {};

// Load state tax rates on page load
document.addEventListener('DOMContentLoaded', function() {
    loadStateTaxRates();
    setupEventListeners();
    setDefaultValues();
});

// Load state tax rates from JSON file
async function loadStateTaxRates() {
    try {
        const response = await fetch('data/state-tax-rates.json');
        stateTaxRates = await response.json();
        populateStateDropdown();
    } catch (error) {
        console.error('Error loading state tax rates:', error);
        // Fallback to basic state list if JSON fails to load
        populateBasicStates();
    }
}

// Populate state dropdown with tax rate data
function populateStateDropdown() {
    const stateSelect = document.getElementById('state');
    stateSelect.innerHTML = '<option value="">Select State</option>';
    
    // Sort states alphabetically
    const sortedStates = Object.keys(stateTaxRates).sort();
    
    sortedStates.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
    });
}

// Fallback state list if JSON fails
function populateBasicStates() {
    const states = [
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
        'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
        'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
        'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
        'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
        'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
        'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
        'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
        'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
        'West Virginia', 'Wisconsin', 'Wyoming'
    ];
    
    const stateSelect = document.getElementById('state');
    stateSelect.innerHTML = '<option value="">Select State</option>';
    
    states.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Real-time calculation on input change
    const inputs = ['homePrice', 'downPayment', 'interestRate', 'loanTerm', 'propertyTax', 'homeInsurance', 'hoaFees'];
    inputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('input', debounce(calculateMortgage, 500));
        }
    });
    
    // State selection handler
    document.getElementById('state').addEventListener('change', function() {
        updatePropertyTaxFromState();
        calculateMortgage();
    });
    
    // Down payment percentage calculator
    document.getElementById('homePrice').addEventListener('input', updateDownPaymentSuggestion);
    document.getElementById('downPayment').addEventListener('input', updateDownPaymentPercentage);
}

// Set default values
function setDefaultValues() {
    document.getElementById('homePrice').value = '400000';
    document.getElementById('downPayment').value = '80000';
    document.getElementById('interestRate').value = '6.5';
    document.getElementById('propertyTax').value = '4800';
    document.getElementById('homeInsurance').value = '1200';
}

// Update property tax based on selected state
function updatePropertyTaxFromState() {
    const selectedState = document.getElementById('state').value;
    const homePrice = parseFloat(document.getElementById('homePrice').value) || 0;
    
    if (selectedState && stateTaxRates[selectedState] && homePrice > 0) {
        const taxRate = stateTaxRates[selectedState].rate / 100;
        const estimatedTax = homePrice * taxRate;
        document.getElementById('propertyTax').value = Math.round(estimatedTax);
    }
}

// Update down payment percentage display
function updateDownPaymentPercentage() {
    const homePrice = parseFloat(document.getElementById('homePrice').value) || 0;
    const downPayment = parseFloat(document.getElementById('downPayment').value) || 0;
    
    if (homePrice > 0) {
        const percentage = (downPayment / homePrice) * 100;
        // This will be displayed in results
    }
}

// Suggest down payment amounts
function updateDownPaymentSuggestion() {
    const homePrice = parseFloat(document.getElementById('homePrice').value) || 0;
    if (homePrice > 0) {
        // Auto-suggest 20% down payment to avoid PMI
        const suggestedDown = homePrice * 0.20;
        if (!document.getElementById('downPayment').value) {
            document.getElementById('downPayment').value = Math.round(suggestedDown);
        }
    }
}

// Main mortgage calculation function
function calculateMortgage() {
    try {
        // Get input values
        const homePrice = parseFloat(document.getElementById('homePrice').value) || 0;
        const downPayment = parseFloat(document.getElementById('downPayment').value) || 0;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
        const loanTermYears = parseInt(document.getElementById('loanTerm').value) || 30;
        const annualPropertyTax = parseFloat(document.getElementById('propertyTax').value) || 0;
        const annualInsurance = parseFloat(document.getElementById('homeInsurance').value) || 0;
        const monthlyHOA = parseFloat(document.getElementById('hoaFees').value) || 0;
        
        // Validation
        if (homePrice <= 0 || interestRate <= 0) {
            document.getElementById('resultsContainer').style.display = 'none';
            document.getElementById('placeholder').style.display = 'block';
            return;
        }
        
        // Calculate loan amount
        const loanAmount = homePrice - downPayment;
        
        if (loanAmount <= 0) {
            alert('Down payment cannot be greater than or equal to home price');
            return;
        }
        
        // Calculate monthly interest rate and number of payments
        const monthlyRate = interestRate / 100 / 12;
        const numberOfPayments = loanTermYears * 12;
        
        // Calculate monthly principal and interest payment
        const monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                         (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
        
        // Calculate other monthly costs
        const monthlyPropertyTax = annualPropertyTax / 12;
        const monthlyInsurance = annualInsurance / 12;
        
        // Calculate PMI (Private Mortgage Insurance)
        const downPaymentPercent = (downPayment / homePrice) * 100;
        let monthlyPMI = 0;
        
        if (downPaymentPercent < 20) {
            // PMI is typically 0.3% to 1.5% of loan amount annually
            // Using 0.5% as default, can be made more sophisticated
            monthlyPMI = (loanAmount * 0.005) / 12;
        }
        
        // Calculate total monthly payment
        const totalMonthlyPayment = monthlyPI + monthlyPropertyTax + monthlyInsurance + monthlyPMI + monthlyHOA;
        
        // Calculate loan totals
        const totalInterest = (monthlyPI * numberOfPayments) - loanAmount;
        const totalLoanCost = loanAmount + totalInterest;
        
        // Display results
        displayResults({
            totalMonthlyPayment,
            monthlyPI,
            monthlyPropertyTax,
            monthlyInsurance,
            monthlyPMI,
            monthlyHOA,
            loanAmount,
            totalInterest,
            totalLoanCost,
            downPaymentPercent,
            homePrice,
            downPayment,
            interestRate,
            loanTermYears
        });
        
        // Generate amortization schedule
        generateAmortizationSchedule(loanAmount, monthlyRate, numberOfPayments, monthlyPI);
        
        // Generate AI recommendation
        generateAIRecommendation({
            downPaymentPercent,
            monthlyPI,
            totalMonthlyPayment,
            interestRate,
            loanAmount,
            homePrice
        });
        
        // Track calculator usage
        if (typeof trackCalculatorUse === 'function') {
            trackCalculatorUse();
        }
        
    } catch (error) {
        console.error('Error in mortgage calculation:', error);
        alert('An error occurred during calculation. Please check your inputs.');
    }
}

// Display calculation results
function displayResults(results) {
    // Show results container
    document.getElementById('resultsContainer').style.display = 'block';
    document.getElementById('placeholder').style.display = 'none';
    
    // Format currency display
    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
    
    // Update main payment display
    document.getElementById('totalMonthlyPayment').textContent = formatCurrency(results.totalMonthlyPayment);
    
    // Update payment breakdown
    document.getElementById('principalInterest').textContent = formatCurrency(results.monthlyPI);
    document.getElementById('monthlyPropertyTax').textContent = formatCurrency(results.monthlyPropertyTax);
    document.getElementById('monthlyInsurance').textContent = formatCurrency(results.monthlyInsurance);
    document.getElementById('totalBreakdown').textContent = formatCurrency(results.totalMonthlyPayment);
    
    // Handle PMI display
    const pmiRow = document.getElementById('pmiRow');
    if (results.monthlyPMI > 0) {
        pmiRow.style.display = 'flex';
        document.getElementById('monthlyPMI').textContent = formatCurrency(results.monthlyPMI);
    } else {
        pmiRow.style.display = 'none';
    }
    
    // Handle HOA display
    const hoaRow = document.getElementById('hoaRow');
    if (results.monthlyHOA > 0) {
        hoaRow.style.display = 'flex';
        document.getElementById('monthlyHOA').textContent = formatCurrency(results.monthlyHOA);
    } else {
        hoaRow.style.display = 'none';
    }
    
    // Update loan summary
    document.getElementById('loanAmount').textContent = formatCurrency(results.loanAmount);
    document.getElementById('totalInterest').textContent = formatCurrency(results.totalInterest);
    document.getElementById('totalLoanCost').textContent = formatCurrency(results.totalLoanCost);
    document.getElementById('downPaymentPercent').textContent = results.downPaymentPercent.toFixed(1) + '%';
}

// Generate amortization schedule
function generateAmortizationSchedule(loanAmount, monthlyRate, numberOfPayments, monthlyPayment) {
    let balance = loanAmount;
    let amortizationData = [];
    
    for (let year = 1; year <= Math.ceil(numberOfPayments / 12); year++) {
        let yearlyPrincipal = 0;
        let yearlyInterest = 0;
        
        for (let month = 1; month <= 12 && ((year - 1) * 12 + month) <= numberOfPayments; month++) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            
            yearlyPrincipal += principalPayment;
            yearlyInterest += interestPayment;
            balance -= principalPayment;
        }
        
        amortizationData.push({
            year: year,
            principal: yearlyPrincipal,
            interest: yearlyInterest,
            balance: Math.max(0, balance)
        });
        
        if (balance <= 0) break;
    }
    
    // Populate amortization table
    const tableBody = document.getElementById('amortizationTable');
    tableBody.innerHTML = '';
    
    amortizationData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.year}</td>
            <td>$${row.principal.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
            <td>$${row.interest.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
            <td>$${row.balance.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// Generate AI-powered recommendation
function generateAIRecommendation(data) {
    let recommendation = '';
    
    if (data.downPaymentPercent < 20) {
        recommendation = `💡 <strong>PMI Alert:</strong> With ${data.downPaymentPercent.toFixed(1)}% down, you'll pay PMI. Consider saving for a 20% down payment (${((data.homePrice * 0.2) - (data.homePrice * data.downPaymentPercent / 100)).toLocaleString('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 0})} more) to eliminate PMI and save money.`;
    } else if (data.interestRate > 7) {
        recommendation = `📈 <strong>Interest Rate Tip:</strong> Your rate of ${data.interestRate}% is relatively high. Consider shopping around with multiple lenders or improving your credit score to secure better rates.`;
    } else if (data.totalMonthlyPayment > data.homePrice * 0.0035) {
        recommendation = `⚠️ <strong>Affordability Warning:</strong> Your monthly payment is quite high relative to the home price. Consider a less expensive home or larger down payment to improve affordability.`;
    } else {
        recommendation = `✅ <strong>Good Deal:</strong> Your mortgage terms look favorable! You're putting down ${data.downPaymentPercent.toFixed(1)}% and have a competitive interest rate of ${data.interestRate}%.`;
    }
    
    // Add extra payment suggestion
    const extraPayment = data.monthlyPI * 0.1; // Suggest 10% extra
    recommendation += ` <br><br><strong>Savings Tip:</strong> Adding just $${extraPayment.toFixed(0)}/month extra to principal could save you thousands in interest and pay off your loan years earlier.`;
    
    document.getElementById('aiRecommendation').innerHTML = recommendation;
}

// Toggle amortization schedule visibility
function toggleAmortization() {
    const container = document.getElementById('amortizationContainer');
    const button = document.querySelector('.toggle-amortization');
    
    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        button.innerHTML = '<i class="fas fa-chart-line"></i> Hide Amortization Schedule';
    } else {
        container.classList.add('hidden');
        button.innerHTML = '<i class="fas fa-chart-line"></i> View Amortization Schedule';
    }
}

// Utility function to debounce rapid input changes
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

// Format number inputs with commas
function formatNumberInput(input) {
    const value = input.value.replace(/,/g, '');
    if (!isNaN(value) && value !== '') {
        input.value = parseFloat(value).toLocaleString('en-US');
    }
}

// Export functionality (for future PDF generation)
function exportResults() {
    // This function can be enhanced to generate PDF reports
    const results = {
        homePrice: document.getElementById('homePrice').value,
        downPayment: document.getElementById('downPayment').value,
        monthlyPayment: document.getElementById('totalMonthlyPayment').textContent,
        // Add more fields as needed
    };
    
    console.log('Exporting results:', results);
    // Future: Generate PDF or email functionality
}

// Initialize calculator with URL parameters (for sharing)
function initializeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('price')) {
        document.getElementById('homePrice').value = urlParams.get('price');
    }
    if (urlParams.get('down')) {
        document.getElementById('downPayment').value = urlParams.get('down');
    }
    if (urlParams.get('rate')) {
        document.getElementById('interestRate').value = urlParams.get('rate');
    }
    
    // Calculate if parameters were provided
    if (urlParams.has('price') || urlParams.has('down') || urlParams.has('rate')) {
        setTimeout(calculateMortgage, 100);
    }
}

// Call initialization
document.addEventListener('DOMContentLoaded', initializeFromURL);