// Mortgage Calculator JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Load state tax rates and PMI rates
    Promise.all([
        fetch('data/state-tax-rates.json').then(response => response.json()),
        fetch('data/pmi-rates.json').then(response => response.json())
    ]).then(([taxRates, pmiRates]) => {
        initializeCalculator(taxRates, pmiRates);
    }).catch(error => {
        console.error('Error loading data:', error);
    });

    function initializeCalculator(taxRates, pmiRates) {
        // Populate state dropdown
        const stateSelect = document.getElementById('state');
        Object.keys(taxRates).sort().forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelect.appendChild(option);
        });

        // Toggle down payment between $ and %
        const toggleDownPaymentBtn = document.getElementById('toggleDownPayment');
        let isPercentage = false;
        
        toggleDownPaymentBtn.addEventListener('click', function() {
            isPercentage = !isPercentage;
            toggleDownPaymentBtn.textContent = isPercentage ? '%' : '$';
            
            const downPaymentInput = document.getElementById('downPayment');
            const homePriceInput = document.getElementById('homePrice');
            const homePrice = parseFloat(homePriceInput.value) || 0;
            const downPayment = parseFloat(downPaymentInput.value) || 0;
            
            if (homePrice > 0 && downPayment > 0) {
                if (isPercentage) {
                    // Convert $ to %
                    const percentage = (downPayment / homePrice) * 100;
                    downPaymentInput.value = percentage.toFixed(1);
                } else {
                    // Convert % to $
                    const dollarAmount = (homePrice * downPayment) / 100;
                    downPaymentInput.value = Math.round(dollarAmount);
                }
            }
        });

        // Auto-fill property tax based on state
        stateSelect.addEventListener('change', function() {
            const homePriceInput = document.getElementById('homePrice');
            const homePrice = parseFloat(homePriceInput.value) || 0;
            const propertyTaxInput = document.getElementById('propertyTax');
            
            if (homePrice > 0 && this.value) {
                const taxRate = taxRates[this.value];
                const annualPropertyTax = (homePrice * taxRate) / 100;
                propertyTaxInput.value = Math.round(annualPropertyTax);
            }
        });

        // Show/hide PMI section based on down payment
        const homePriceInput = document.getElementById('homePrice');
        const downPaymentInput = document.getElementById('downPayment');
        const pmiRequiredCheckbox = document.getElementById('pmiRequired');
        const pmiSection = document.getElementById('pmiSection');
        
        function checkPmiRequirement() {
            const homePrice = parseFloat(homePriceInput.value) || 0;
            let downPayment = parseFloat(downPaymentInput.value) || 0;
            
            if (isPercentage) {
                downPayment = (homePrice * downPayment) / 100;
            }
            
            const loanToValue = (homePrice - downPayment) / homePrice;
            
            if (homePrice > 0 && downPayment > 0 && loanToValue > 0.8) {
                pmiRequiredCheckbox.checked = true;
                pmiSection.classList.remove('hidden');
                
                // Auto-calculate PMI rate
                const pmiRateInput = document.getElementById('pmiRate');
                let pmiRate = 0.5; // Default
                
                if (loanToValue >= 0.95) pmiRate = 1.0;
                else if (loanToValue >= 0.9) pmiRate = 0.7;
                else if (loanToValue >= 0.85) pmiRate = 0.6;
                
                pmiRateInput.value = pmiRate.toFixed(2);
            } else {
                pmiRequiredCheckbox.checked = false;
                pmiSection.classList.add('hidden');
            }
        }
        
        homePriceInput.addEventListener('input', checkPmiRequirement);
        downPaymentInput.addEventListener('input', checkPmiRequirement);
        pmiRequiredCheckbox.addEventListener('change', function() {
            if (this.checked) {
                pmiSection.classList.remove('hidden');
            } else {
                pmiSection.classList.add('hidden');
            }
        });

        // Form submission
        const mortgageForm = document.getElementById('mortgageForm');
        mortgageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            calculateMortgage(taxRates, pmiRates);
        });
    }

    function calculateMortgage(taxRates, pmiRates) {
        // Get form values
        const homePrice = parseFloat(document.getElementById('homePrice').value) || 0;
        let downPayment = parseFloat(document.getElementById('downPayment').value) || 0;
        const isPercentage = document.getElementById('toggleDownPayment').textContent === '%';
        const loanTerm = parseInt(document.getElementById('loanTerm').value) || 30;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
        const state = document.getElementById('state').value;
        let propertyTax = parseFloat(document.getElementById('propertyTax').value) || 0;
        const homeInsurance = parseFloat(document.getElementById('homeInsurance').value) || 0;
        const hoaFees = parseFloat(document.getElementById('hoaFees').value) || 0;
        const needsPmi = document.getElementById('pmiRequired').checked;
        let pmiRate = parseFloat(document.getElementById('pmiRate').value) || 0;
        
        // Convert down payment if it's a percentage
        if (isPercentage) {
            downPayment = (homePrice * downPayment) / 100;
        }
        
        // Auto-calculate property tax if not provided
        if (propertyTax === 0 && state && taxRates[state]) {
            propertyTax = (homePrice * taxRates[state]) / 100;
            document.getElementById('propertyTax').value = Math.round(propertyTax);
        }
        
        const loanAmount = homePrice - downPayment;
        
        // Auto-calculate PMI rate if not provided but needed
        if (needsPmi && pmiRate === 0) {
            const loanToValue = loanAmount / homePrice;
            if (loanToValue >= 0.95) pmiRate = 1.0;
            else if (loanToValue >= 0.9) pmiRate = 0.7;
            else if (loanToValue >= 0.85) pmiRate = 0.6;
            else pmiRate = 0.5;
            
            document.getElementById('pmiRate').value = pmiRate.toFixed(2);
        }
        
        // Calculate monthly PMI
        const monthlyPmi = needsPmi ? (loanAmount * pmiRate / 100) / 12 : 0;
        
        // Calculate monthly principal and interest
        const monthlyRate = interestRate / 100 / 12;
        const numberOfPayments = loanTerm * 12;
        const monthlyPrincipalAndInterest = loanAmount * 
            (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
            (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
        
        // Calculate other monthly costs
        const monthlyPropertyTax = propertyTax / 12;
        const monthlyInsurance = homeInsurance / 12;
        
        // Total monthly payment
        const totalMonthlyPayment = monthlyPrincipalAndInterest + monthlyPropertyTax + 
                                  monthlyInsurance + hoaFees + monthlyPmi;
        
        // Calculate total costs over loan term
        const totalPrincipalAndInterest = monthlyPrincipalAndInterest * numberOfPayments;
        const totalInterest = totalPrincipalAndInterest - loanAmount;
        const totalPropertyTax = propertyTax * loanTerm;
        const totalInsurance = homeInsurance * loanTerm;
        const totalHoa = hoaFees * numberOfPayments;
        const totalPmi = monthlyPmi * (needsPmi ? (loanTerm * 12) : 0);
        const totalCost = totalPrincipalAndInterest + totalPropertyTax + 
                         totalInsurance + totalHoa + totalPmi;
        
        // Generate amortization schedule
        const amortizationSchedule = generateAmortizationSchedule(loanAmount, interestRate, loanTerm);
        
        // Display results
        displayResults({
            homePrice,
            downPayment,
            loanAmount,
            loanTerm,
            interestRate,
            monthlyPrincipalAndInterest,
            monthlyPropertyTax,
            monthlyInsurance,
            hoaFees,
            monthlyPmi,
            totalMonthlyPayment,
            totalInterest,
            totalCost,
            amortizationSchedule
        });
    }

    function generateAmortizationSchedule(loanAmount, interestRate, loanTerm) {
        const monthlyRate = interestRate / 100 / 12;
        const numberOfPayments = loanTerm * 12;
        const monthlyPayment = loanAmount * 
            (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
            (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
        
        let balance = loanAmount;
        const schedule = [];
        let totalInterest = 0;
        
        for (let month = 1; month <= numberOfPayments; month++) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            balance -= principalPayment;
            totalInterest += interestPayment;
            
            // Only record yearly entries to keep the schedule manageable
            if (month % 12 === 0 || month === 1 || month === numberOfPayments) {
                schedule.push({
                    year: Math.ceil(month / 12),
                    month: month,
                    principal: principalPayment,
                    interest: interestPayment,
                    totalInterest: totalInterest,
                    balance: balance > 0 ? balance : 0
                });
            }
        }
        
        return schedule;
    }

    function displayResults(data) {
        const resultElement = document.getElementById('mortgageResult');
        const amortizationSection = document.getElementById('amortizationSection');
        
        resultElement.innerHTML = `
            <div class="result-summary">
                <div class="result-main">
                    <div class="monthly-payment">$${data.totalMonthlyPayment.toFixed(2)}</div>
                    <div class="result-label">Total Monthly Payment</div>
                </div>
                
                <div class="result-breakdown">
                    <div class="breakdown-item">
                        <span>Principal & Interest:</span>
                        <span>$${data.monthlyPrincipalAndInterest.toFixed(2)}</span>
                    </div>
                    <div class="breakdown-item">
                        <span>Property Tax:</span>
                        <span>$${data.monthlyPropertyTax.toFixed(2)}</span>
                    </div>
                    <div class="breakdown-item">
                        <span>Home Insurance:</span>
                        <span>$${data.monthlyInsurance.toFixed(2)}</span>
                    </div>
                    ${data.hoaFees > 0 ? `
                    <div class="breakdown-item">
                        <span>HOA Fees:</span>
                        <span>$${data.hoaFees.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    ${data.monthlyPmi > 0 ? `
                    <div class="breakdown-item">
                        <span>PMI:</span>
                        <span>$${data.monthlyPmi.toFixed(2)}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="result-totals">
                    <h3>Loan Details</h3>
                    <div class="breakdown-item">
                        <span>Loan Amount:</span>
                        <span>$${data.loanAmount.toLocaleString()}</span>
                    </div>
                    <div class="breakdown-item">
                        <span>Total Interest Paid:</span>
                        <span>$${data.totalInterest.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                    </div>
                    <div class="breakdown-item">
                        <span>Total of ${data.loanTerm * 12} Payments:</span>
                        <span>$${data.totalCost.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                    </div>
                    <div class="breakdown-item">
                        <span>Pay-off Date:</span>
                        <span>${calculatePayoffDate(data.loanTerm)}</span>
                    </div>
                </div>
                
                <div class="ai-insight">
                    <h3><i class="fas fa-robot"></i> AI Insight</h3>
                    <p>${generateAiInsight(data)}</p>
                </div>
            </div>
        `;
        
        // Show amortization section and populate table
        amortizationSection.classList.remove('hidden');
        populateAmortizationTable(data.amortizationSchedule);
        createAmortizationChart(data.amortizationSchedule);
    }

    function calculatePayoffDate(loanTerm) {
        const today = new Date();
        today.setFullYear(today.getFullYear() + loanTerm);
        return today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function generateAiInsight(data) {
        const loanToValue = data.loanAmount / data.homePrice;
        let insights = [];
        
        if (loanToValue > 0.8) {
            insights.push("Consider making additional principal payments to reach 20% equity faster and remove PMI.");
        }
        
        if (data.interestRate > 6) {
            insights.push("Current rates are relatively high. You might want to consider an ARM loan or look for refinancing opportunities when rates drop.");
        }
        
        if (data.loanTerm === 30) {
            insights.push("A 30-year term gives you lower monthly payments but you'll pay more interest over time. Consider a 15-year term if you can afford higher payments.");
        }
        
        if (data.totalInterest > data.loanAmount) {
            insights.push("You'll pay more in interest than the original loan amount. Even one extra payment per year can significantly reduce your total interest paid.");
        }
        
        return insights.length > 0 ? insights.join(' ') : 
            "Your mortgage terms look reasonable. Consider making bi-weekly payments to pay off your loan faster and save on interest.";
    }

    function populateAmortizationTable(schedule) {
        const tableBody = document.querySelector('#amortizationTable tbody');
        tableBody.innerHTML = '';
        
        schedule.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${entry.year}</td>
                <td>$${entry.principal.toFixed(2)}</td>
                <td>$${entry.interest.toFixed(2)}</td>
                <td>$${entry.totalInterest.toFixed(2)}</td>
                <td>$${entry.balance.toFixed(2)}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function createAmortizationChart(schedule) {
        const ctx = document.getElementById('amortizationChart').getContext('2d');
        
        const years = schedule.map(entry => entry.year);
        const principal = schedule.map(entry => entry.principal);
        const interest = schedule.map(entry => entry.interest);
        const balances = schedule.map(entry => entry.balance);
        
        // Destroy previous chart if it exists
        if (window.amortizationChartInstance) {
            window.amortizationChartInstance.destroy();
        }
        
        window.amortizationChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Principal',
                        data: principal,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Interest',
                        data: interest,
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Year'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Amount ($)'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Yearly Principal vs Interest'
                    }
                }
            }
        });
    }
});
