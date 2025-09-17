// Rent vs Buy Calculator JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const calculateBtn = document.getElementById('calculate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const downloadPdfBtn = document.getElementById('download-pdf');
    const shareResultsBtn = document.getElementById('share-results');
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    // Default values for demonstration
    const defaultValues = {
        'home-price': 400000,
        'down-payment': 80000,
        'loan-term': 30,
        'interest-rate': 6.5,
        'property-tax': 4800,
        'home-insurance': 1200,
        'pmi': 0.5,
        'hoa': 0,
        'monthly-rent': 2500,
        'rent-increase': 3,
        'investment-return': 7,
        'length-of-stay': 7,
        'inflation-rate': 2.5,
        'marginal-tax-rate': 22,
        'home-appreciation': 3
    };
    
    // Set default values on page load
    function setDefaultValues() {
        for (const [id, value] of Object.entries(defaultValues)) {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        }
    }
    
    // Calculate the rent vs buy comparison
    function calculateRentVsBuy() {
        // Get input values
        const homePrice = parseFloat(document.getElementById('home-price').value) || 0;
        const downPayment = parseFloat(document.getElementById('down-payment').value) || 0;
        const loanTerm = parseInt(document.getElementById('loan-term').value) || 30;
        const interestRate = parseFloat(document.getElementById('interest-rate').value) || 0;
        const propertyTax = parseFloat(document.getElementById('property-tax').value) || 0;
        const homeInsurance = parseFloat(document.getElementById('home-insurance').value) || 0;
        const pmiRate = parseFloat(document.getElementById('pmi').value) || 0;
        const hoaFees = parseFloat(document.getElementById('hoa').value) || 0;
        const monthlyRent = parseFloat(document.getElementById('monthly-rent').value) || 0;
        const rentIncrease = parseFloat(document.getElementById('rent-increase').value) || 0;
        const investmentReturn = parseFloat(document.getElementById('investment-return').value) || 0;
        const lengthOfStay = parseInt(document.getElementById('length-of-stay').value) || 0;
        const inflationRate = parseFloat(document.getElementById('inflation-rate').value) || 0;
        const marginalTaxRate = parseFloat(document.getElementById('marginal-tax-rate').value) || 0;
        const homeAppreciation = parseFloat(document.getElementById('home-appreciation').value) || 0;
        
        // Validate inputs
        if (homePrice <= 0 || lengthOfStay <= 0) {
            alert('Please enter valid values for home price and length of stay.');
            return;
        }
        
        // Calculate loan amount
        const loanAmount = homePrice - downPayment;
        const downPaymentPercent = (downPayment / homePrice) * 100;
        
        // Calculate monthly mortgage payment
        const monthlyInterestRate = interestRate / 100 / 12;
        const numberOfPayments = loanTerm * 12;
        const monthlyMortgagePayment = loanAmount * 
            (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
            (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
        
        // Calculate PMI (if down payment < 20%)
        let monthlyPmi = 0;
        if (downPaymentPercent < 20) {
            monthlyPmi = (loanAmount * (pmiRate / 100)) / 12;
        }
        
        // Calculate monthly property tax and insurance
        const monthlyPropertyTax = propertyTax / 12;
        const monthlyHomeInsurance = homeInsurance / 12;
        
        // Calculate total monthly housing cost
        const totalMonthlyHousingCost = monthlyMortgagePayment + monthlyPropertyTax + 
                                      monthlyHomeInsurance + monthlyPmi + hoaFees;
        
        // Calculate tax savings from mortgage interest deduction
        const annualMortgageInterest = calculateAnnualInterest(loanAmount, interestRate, loanTerm, lengthOfStay);
        const annualTaxSavings = annualMortgageInterest * (marginalTaxRate / 100);
        const monthlyTaxSavings = annualTaxSavings / 12;
        
        // Calculate net monthly housing cost after tax savings
        const netMonthlyHousingCost = totalMonthlyHousingCost - monthlyTaxSavings;
        
        // Calculate total cost of buying over the length of stay
        let totalBuyingCost = 0;
        let totalRentingCost = 0;
        
        // Calculate opportunity cost of down payment and closing costs
        const closingCosts = homePrice * 0.03; // Estimated 3% of home price
        const initialInvestment = downPayment + closingCosts;
        
        // Calculate what the down payment and closing costs would have earned if invested
        const investmentGrowth = calculateInvestmentGrowth(initialInvestment, investmentReturn, lengthOfStay);
        
        // Calculate home value appreciation
        const futureHomeValue = homePrice * Math.pow(1 + (homeAppreciation / 100), lengthOfStay);
        
        // Calculate remaining mortgage balance after length of stay
        const remainingBalance = calculateRemainingBalance(loanAmount, interestRate, loanTerm, lengthOfStay);
        
        // Calculate equity gained
        const equity = futureHomeValue - remainingBalance;
        
        // Calculate total cost of buying
        totalBuyingCost = (netMonthlyHousingCost * 12 * lengthOfStay) + closingCosts - equity + investmentGrowth;
        
        // Calculate total cost of renting
        let currentRent = monthlyRent;
        for (let year = 1; year <= lengthOfStay; year++) {
            totalRentingCost += currentRent * 12;
            currentRent *= (1 + rentIncrease / 100);
        }
        
        // Calculate what the difference between renting and buying costs would have earned if invested
        const monthlyCostDifference = netMonthlyHousingCost - monthlyRent;
        const investmentOpportunity = calculateInvestmentOpportunity(monthlyCostDifference, investmentReturn, lengthOfStay);
        
        // Adjust total renting cost by investment opportunity
        if (monthlyCostDifference > 0) {
            // Buying is more expensive monthly, so renting would have allowed investing the difference
            totalRentingCost -= investmentOpportunity;
        } else {
            // Renting is more expensive monthly, so buying would have saved money that could be invested
            totalBuyingCost += investmentOpportunity;
        }
        
        // Calculate the difference
        const difference = totalBuyingCost - totalRentingCost;
        
        // Format currency
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        
        // Update results
        document.getElementById('buying-cost').textContent = formatter.format(totalBuyingCost);
        document.getElementById('renting-cost').textContent = formatter.format(totalRentingCost);
        document.getElementById('difference-amount').textContent = formatter.format(Math.abs(difference));
        
        // Update breakdown text
        document.getElementById('buying-breakdown').textContent = `Down payment: ${formatter.format(downPayment)} • Loan: ${formatter.format(loanAmount)}`;
        document.getElementById('renting-breakdown').textContent = `Initial rent: ${formatter.format(monthlyRent)}/mo • Annual increase: ${rentIncrease}%`;
        
        // Update recommendation
        let recommendation = '';
        if (difference < 0) {
            recommendation = `Buying is ${formatter.format(Math.abs(difference))} cheaper over ${lengthOfStay} years`;
        } else {
            recommendation = `Renting is ${formatter.format(difference)} cheaper over ${lengthOfStay} years`;
        }
        document.getElementById('recommendation').textContent = recommendation;
        
        // Generate detailed breakdown table
        generateDetailedTable({
            homePrice, downPayment, loanTerm, interestRate, propertyTax, homeInsurance,
            pmiRate, hoaFees, monthlyRent, rentIncrease, investmentReturn, lengthOfStay,
            inflationRate, marginalTaxRate, homeAppreciation, totalBuyingCost, totalRentingCost,
            difference, netMonthlyHousingCost, monthlyMortgagePayment, monthlyPropertyTax,
            monthlyHomeInsurance, monthlyPmi, monthlyTaxSavings, futureHomeValue, remainingBalance,
            equity, closingCosts
        });
        
        // Generate AI insights
        generateAIInsights({
            homePrice, downPayment, loanTerm, interestRate, propertyTax, homeInsurance,
            pmiRate, hoaFees, monthlyRent, rentIncrease, investmentReturn, lengthOfStay,
            inflationRate, marginalTaxRate, homeAppreciation, totalBuyingCost, totalRentingCost,
            difference, netMonthlyHousingCost, monthlyMortgagePayment, monthlyPropertyTax,
            monthlyHomeInsurance, monthlyPmi, monthlyTaxSavings, futureHomeValue, remainingBalance,
            equity, closingCosts, downPaymentPercent
        });
    }
    
    // Calculate annual interest paid on mortgage
    function calculateAnnualInterest(loanAmount, interestRate, loanTerm, years) {
        const monthlyRate = interestRate / 100 / 12;
        const numberOfPayments = loanTerm * 12;
        const paymentsToCalculate = Math.min(years * 12, numberOfPayments);
        
        let totalInterest = 0;
        let remainingBalance = loanAmount;
        
        for (let i = 0; i < paymentsToCalculate; i++) {
            const interestPayment = remainingBalance * monthlyRate;
            const principalPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                                   (Math.pow(1 + monthlyRate, numberOfPayments) - 1) - interestPayment;
            
            totalInterest += interestPayment;
            remainingBalance -= principalPayment;
        }
        
        return totalInterest;
    }
    
    // Calculate remaining mortgage balance after X years
    function calculateRemainingBalance(loanAmount, interestRate, loanTerm, years) {
        const monthlyRate = interestRate / 100 / 12;
        const numberOfPayments = loanTerm * 12;
        const paymentsMade = years * 12;
        
        if (paymentsMade >= numberOfPayments) return 0;
        
        return loanAmount * (Math.pow(1 + monthlyRate, numberOfPayments) - Math.pow(1 + monthlyRate, paymentsMade)) / 
               (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    }
    
    // Calculate investment growth
    function calculateInvestmentGrowth(principal, annualReturn, years) {
        return principal * Math.pow(1 + annualReturn / 100, years) - principal;
    }
    
    // Calculate investment opportunity of monthly savings
    function calculateInvestmentOpportunity(monthlyAmount, annualReturn, years) {
        if (monthlyAmount === 0) return 0;
        
        const monthlyRate = annualReturn / 100 / 12;
        const numberOfMonths = years * 12;
        
        if (monthlyAmount > 0) {
            // Calculate future value of a series of monthly investments
            return monthlyAmount * (Math.pow(1 + monthlyRate, numberOfMonths) - 1) / monthlyRate;
        } else {
            // If negative, it represents money that could have been saved by buying
            return Math.abs(monthlyAmount) * (Math.pow(1 + monthlyRate, numberOfMonths) - 1) / monthlyRate;
        }
    }
    
    // Generate detailed results table
    function generateDetailedTable(data) {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        
        const percentFormatter = new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });
        
        let tableHTML = `
            <table>
                <tr>
                    <th>Category</th>
                    <th>Buying</th>
                    <th>Renting</th>
                </tr>
                <tr>
                    <td>Monthly Payment</td>
                    <td>${formatter.format(data.netMonthlyHousingCost)}</td>
                    <td>${formatter.format(data.monthlyRent)}</td>
                </tr>
                <tr>
                    <td>Down Payment & Closing Costs</td>
                    <td>${formatter.format(data.downPayment + data.closingCosts)}</td>
                    <td>${formatter.format(0)}</td>
                </tr>
                <tr>
                    <td>Total Payments (${data.lengthOfStay} years)</td>
                    <td>${formatter.format(data.netMonthlyHousingCost * 12 * data.lengthOfStay)}</td>
                    <td>${formatter.format(data.totalRentingCost)}</td>
                </tr>
                <tr>
                    <td>Home Appreciation</td>
                    <td>${formatter.format(data.futureHomeValue - data.homePrice)}</td>
                    <td>${formatter.format(0)}</td>
                </tr>
                <tr>
                    <td>Equity Built</td>
                    <td>${formatter.format(data.equity)}</td>
                    <td>${formatter.format(0)}</td>
                </tr>
                <tr>
                    <td>Investment Opportunity</td>
                    <td>${formatter.format(calculateInvestmentGrowth(data.downPayment + data.closingCosts, data.investmentReturn, data.lengthOfStay))}</td>
                    <td>${formatter.format(calculateInvestmentOpportunity(data.netMonthlyHousingCost - data.monthlyRent, data.investmentReturn, data.lengthOfStay))}</td>
                </tr>
                <tr class="total-row">
                    <td><strong>Total Cost</strong></td>
                    <td><strong>${formatter.format(data.totalBuyingCost)}</strong></td>
                    <td><strong>${formatter.format(data.totalRentingCost)}</strong></td>
                </tr>
            </table>
        `;
        
        document.getElementById('results-table').innerHTML = tableHTML;
    }
    
    // Generate AI insights
    function generateAIInsights(data) {
        let insightsHTML = '';
        
        if (data.difference < 0) {
            insightsHTML += `
                <p><strong>Buying appears to be the better financial decision</strong> for your situation, 
                saving you approximately ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(data.difference))} 
                over ${data.lengthOfStay} years compared to renting.</p>
            `;
        } else {
            insightsHTML += `
                <p><strong>Renting appears to be the better financial decision</strong> for your situation, 
                saving you approximately ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(data.difference)} 
                over ${data.lengthOfStay} years compared to buying.</p>
            `;
        }
        
        insightsHTML += `
            <p>Key factors influencing this recommendation:</p>
            <ul>
                <li>Your planned length of stay: <strong>${data.lengthOfStay} years</strong></li>
                <li>Home appreciation assumption: <strong>${data.homeAppreciation}% annually</strong></li>
                <li>Investment return assumption: <strong>${data.investmentReturn}% annually</strong></li>
                <li>Rent increase assumption: <strong>${data.rentIncrease}% annually</strong></li>
        `;
        
        if (data.downPaymentPercent < 20) {
            insightsHTML += `<li>You're paying PMI at <strong>${data.pmiRate}%</strong> of your loan amount annually</li>`;
        }
        
        insightsHTML += `
            </ul>
            <p><strong>Important considerations:</strong> This analysis is based on the assumptions you provided. 
            Actual market conditions may vary. Consider your personal circumstances, including job stability, 
            lifestyle preferences, and risk tolerance when making your decision.</p>
        `;
        
        document.getElementById('ai-insights').innerHTML = insightsHTML;
    }
    
    // Reset form to default values
    function resetForm() {
        setDefaultValues();
        
        // Clear results
        document.getElementById('buying-cost').textContent = '$0';
        document.getElementById('renting-cost').textContent = '$0';
        document.getElementById('difference-amount').textContent = '$0';
        document.getElementById('buying-breakdown').textContent = 'Breakdown';
        document.getElementById('renting-breakdown').textContent = 'Breakdown';
        document.getElementById('recommendation').textContent = 'Recommendation';
        document.getElementById('results-table').innerHTML = '<p>Enter your details and click Calculate to see results</p>';
        document.getElementById('ai-insights').innerHTML = '<p>Our AI will analyze your specific situation and provide personalized recommendations after calculation.</p>';
    }
    
    // Download PDF report
    function downloadPdf() {
        alert('PDF download functionality would be implemented with a library like jsPDF. This feature is available in the premium version.');
    }
    
    // Share results
    function shareResults() {
        if (navigator.share) {
            navigator.share({
                title: 'Rent vs Buy Calculator Results',
                text: 'Check out my rent vs buy calculation results from USA Financial Calculators!',
                url: window.location.href
            })
            .catch(error => {
                console.log('Error sharing:', error);
            });
        } else {
            alert('Web Share API not supported in your browser. You can copy the URL to share.');
        }
    }
    
    // Toggle FAQ items
    function toggleFaq(event) {
        const faqItem = event.currentTarget.parentElement;
        faqItem.classList.toggle('active');
    }
    
    // Initialize event listeners
    function initEventListeners() {
        calculateBtn.addEventListener('click', calculateRentVsBuy);
        resetBtn.addEventListener('click', resetForm);
        downloadPdfBtn.addEventListener('click', downloadPdf);
        shareResultsBtn.addEventListener('click', shareResults);
        
        faqQuestions.forEach(question => {
            question.addEventListener('click', toggleFaq);
        });
    }
    
    // Initialize the calculator
    function init() {
        setDefaultValues();
        initEventListeners();
        
        // Track calculator view (for analytics)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'calculator_view', {
                'event_category': 'calculator',
                'event_label': 'Rent vs Buy Calculator'
            });
        }
    }
    
    // Start the initialization
    init();
});
