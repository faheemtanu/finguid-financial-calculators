// Tab functionality
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(tab.getAttribute('data-tab') + '-tab').classList.add('active');
    });
});

// Hamburger menu functionality
document.getElementById('hamburger').addEventListener('click', () => {
    const navMenu = document.getElementById('nav-menu');
    navMenu.classList.toggle('active');
});

// Mortgage payment calculation function
function calculateMortgagePayment(principal, annualRate, years) {
    const monthlyRate = annualRate / 100 / 12;
    const numberOfPayments = years * 12;
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                          (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    return monthlyPayment;
}

// Total interest calculation function
function calculateTotalInterest(principal, monthlyPayment, years) {
    const totalPayments = monthlyPayment * years * 12;
    return totalPayments - principal;
}

// Main refinance calculation function
function calculateRefinance() {
    // Get input values
    const currentBalance = parseFloat(document.getElementById('currentBalance').value) || 0;
    const currentRate = parseFloat(document.getElementById('currentRate').value) || 0;
    const remainingTerm = parseFloat(document.getElementById('remainingTerm').value) || 0;
    const newRate = parseFloat(document.getElementById('newRate').value) || 0;
    const newTerm = parseFloat(document.getElementById('newTerm').value) || 0;
    const closingCosts = parseFloat(document.getElementById('closingCosts').value) || 0;

    // Validate inputs
    if (!currentBalance || !currentRate || !remainingTerm || !newRate || !newTerm) {
        alert('Please fill in all required fields');
        return;
    }

    // Calculate current mortgage details
    const currentMonthly = calculateMortgagePayment(currentBalance, currentRate, remainingTerm);
    const currentTotalInterest = calculateTotalInterest(currentBalance, currentMonthly, remainingTerm);
    const currentTotalCost = currentBalance + currentTotalInterest;

    // Calculate new mortgage details
    const newMonthly = calculateMortgagePayment(currentBalance, newRate, newTerm);
    const newTotalInterest = calculateTotalInterest(currentBalance, newMonthly, newTerm);
    const newTotalCost = currentBalance + newTotalInterest + closingCosts;

    // Calculate savings
    const monthlySavings = currentMonthly - newMonthly;
    const totalSavings = currentTotalCost - newTotalCost;
    const breakEvenMonths = closingCosts / monthlySavings;
    const breakEvenYears = breakEvenMonths / 12;

    // Format numbers for display
    const formatCurrency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
    const formatNumber = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    // Generate results HTML
    let resultsHTML = `
        <table class="comparison-table">
            <tr>
                <th></th>
                <th>Current Loan</th>
                <th>New Loan</th>
                <th>Difference</th>
            </tr>
            <tr>
                <td>Monthly Payment</td>
                <td>${formatCurrency.format(currentMonthly)}</td>
                <td>${formatCurrency.format(newMonthly)}</td>
                <td class="${monthlySavings > 0 ? 'savings' : 'cost'}">${formatCurrency.format(monthlySavings)}</td>
            </tr>
            <tr>
                <td>Total Interest</td>
                <td>${formatCurrency.format(currentTotalInterest)}</td>
                <td>${formatCurrency.format(newTotalInterest)}</td>
                <td class="${(currentTotalInterest - newTotalInterest) > 0 ? 'savings' : 'cost'}">${formatCurrency.format(currentTotalInterest - newTotalInterest)}</td>
            </tr>
            <tr>
                <td>Total Cost</td>
                <td>${formatCurrency.format(currentTotalCost)}</td>
                <td>${formatCurrency.format(newTotalCost)}</td>
                <td class="${totalSavings > 0 ? 'savings' : 'cost'}">${formatCurrency.format(totalSavings)}</td>
            </tr>
        </table>
        
        <div style="margin-top: 20px;">
            <h4>Break-Even Analysis</h4>
            <p>It will take approximately <strong>${formatNumber.format(breakEvenMonths)} months (${breakEvenYears.toFixed(1)} years)</strong> to break even on your closing costs.</p>
            <p>Your monthly savings will be <strong class="savings">${formatCurrency.format(monthlySavings)}</strong>.</p>
        </div>
    `;

    // Add AI-powered recommendation
    let aiRecommendation = '';
    if (monthlySavings > 0 && breakEvenYears < 5) {
        aiRecommendation = `Based on your inputs, refinancing appears to be a <strong>good financial decision</strong>. You'll save money monthly and recoup your closing costs in a reasonable time frame.`;
    } else if (monthlySavings > 0 && breakEvenYears >= 5) {
        aiRecommendation = `Refinancing will lower your monthly payment, but it will take <strong>${breakEvenYears.toFixed(1)} years</strong> to break even. This may only make sense if you plan to stay in your home long-term.`;
    } else if (monthlySavings <= 0) {
        aiRecommendation = `Based on your inputs, refinancing would <strong>not save you money</strong> on your monthly payment. You may want to reconsider or adjust your loan terms.`;
    }

    resultsHTML += `
        <div class="ai-tip">
            <h4><i class="fas fa-robot"></i> AI Recommendation</h4>
            <p>${aiRecommendation}</p>
        </div>
    `;

    // Display results
    document.getElementById('refinanceOutput').innerHTML = resultsHTML;
    document.getElementById('refinanceResult').classList.add('show');

    // Track usage with Google Analytics if available
    if (typeof gtag !== 'undefined') {
        gtag('event', 'calculator_use', {
            'event_category': 'calculator',
            'event_label': 'Refinance Calculator',
            'value': 1
        });
    }
}

// Advanced refinance calculation function
function calculateRefinanceAdvanced() {
    // This would include more detailed calculations with property tax, insurance, etc.
    // For now, we'll just use the basic calculation
    calculateRefinance();
    
    // Add note that advanced features are coming soon
    document.getElementById('refinanceOutput').innerHTML += `
        <div class="ai-tip" style="margin-top: 20px;">
            <h4><i class="fas fa-info-circle"></i> Note</h4>
            <p>Advanced refinance calculations with property-specific taxes and insurance are coming soon. The current calculation provides a solid estimate based on your loan details.</p>
        </div>
    `;
}