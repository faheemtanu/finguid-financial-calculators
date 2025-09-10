<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mortgage Calculator | FinGuid</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8fafc;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: #1e40af;
            color: white;
            padding: 20px 0;
            margin-bottom: 30px;
            border-radius: 12px;
        }
        .nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 20px;
        }
        .logo {
            font-size: 24px;
            font-weight: 700;
        }
        .logo a {
            color: white;
            text-decoration: none;
        }
        .calculator-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 30px;
        }
        @media (min-width: 768px) {
            .calculator-grid {
                grid-template-columns: 1fr 1fr;
            }
        }
        .calculator-card {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border: 1px solid #e2e8f0;
        }
        .calculator-card h2 {
            color: #1e40af;
            margin-bottom: 20px;
            font-size: 20px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #374151;
        }
        .form-group input,
        .form-group select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        .form-group input:focus,
        .form-group select:focus {
            border-color: #1e40af;
            outline: none;
        }
        .input-note {
            font-size: 14px;
            color: #6b7280;
            margin-top: 5px;
        }
        .calculate-btn {
            background: #1e40af;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: background-color 0.3s;
        }
        .calculate-btn:hover {
            background: #1d4ed8;
        }
        .result {
            background: #ecfdf5;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            border-left: 4px solid #10b981;
            display: none;
        }
        .result.show {
            display: block;
        }
        .footer {
            background: #1f2937;
            color: white;
            text-align: center;
            padding: 40px 0;
            margin-top: 60px;
            border-radius: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="nav">
                <div class="logo">
                    <a href="#"><i class="fas fa-calculator"></i> FinGuid</a>
                </div>
            </div>
        </div>

        <!-- Main Calculator Section -->
        <div class="calculator-grid">
            <!-- Mortgage Calculator -->
            <div class="calculator-card">
                <h2><i class="fas fa-home"></i> Mortgage Calculator</h2>
                <div class="form-group">
                    <label for="homePrice">Home Price ($)</label>
                    <input type="number" id="homePrice" placeholder="300,000" min="1000">
                </div>
                <div class="form-group">
                    <label for="downPayment">Down Payment ($)</label>
                    <input type="number" id="downPayment" placeholder="60,000" min="0">
                </div>
                <div class="form-group">
                    <label for="loanTerm">Loan Term (Years)</label>
                    <select id="loanTerm">
                        <option value="30">30 years</option>
                        <option value="15">15 years</option>
                        <option value="10">10 years</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="interestRate">Interest Rate (%)</label>
                    <input type="number" id="interestRate" placeholder="6.5" min="0.1" max="20" step="0.01">
                </div>
                <div class="form-group">
                    <label for="state">Select your state</label>
                    <select id="state" required>
                        <option value="">Select your state</option>
                        <!-- States will be populated by JavaScript -->
                    </select>
                </div>
                <div class="form-group">
                    <label for="propertyTax">Annual Property Tax ($)</label>
                    <input type="number" id="propertyTax" placeholder="3,600" min="0">
                    <div class="input-note">Will be auto-filled based on state</div>
                </div>
                <div class="form-group">
                    <label for="insurance">Annual Home Insurance ($)</label>
                    <input type="number" id="insurance" placeholder="1,200" min="0">
                </div>
                <div class="form-group">
                    <label for="hoa">Monthly HOA Fees ($)</label>
                    <input type="number" id="hoa" placeholder="100" min="0">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="pmiRequired"> 
                        I need PMI (down payment less than 20%)
                    </label>
                </div>
                <button class="calculate-btn" onclick="calculateMortgage()">
                    <i class="fas fa-calculator"></i> Calculate Payment
                </button>
                <div id="mortgageResult" class="result">
                    <h3>Your Monthly Payment</h3>
                    <div id="mortgageOutput"></div>
                </div>
            </div>

            <!-- Results Section -->
            <div class="calculator-card">
                <h2><i class="fas fa-chart-pie"></i> Payment Breakdown</h2>
                <div id="resultsPlaceholder">
                    <p style="text-align: center; color: #6b7280; padding: 40px 0;">
                        Enter your loan details to see payment breakdown
                    </p>
                </div>
                <div id="resultsContent" style="display: none;">
                    <div style="margin-bottom: 20px;">
                        <div style="font-size: 24px; font-weight: bold; color: #1e40af; text-align: center;">
                            $<span id="totalPayment">0</span>
                        </div>
                        <div style="text-align: center; color: #6b7280;">Total Monthly Payment</div>
                    </div>
                    
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                            <span>Principal & Interest:</span>
                            <span>$<span id="principalInterest">0</span></span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                            <span>Property Tax:</span>
                            <span>$<span id="propertyTaxDisplay">0</span></span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                            <span>Home Insurance:</span>
                            <span>$<span id="insuranceDisplay">0</span></span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                            <span>HOA Fees:</span>
                            <span>$<span id="hoaDisplay">0</span></span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 10px 0; display: none;" id="pmiRow">
                            <span>PMI:</span>
                            <span>$<span id="pmiDisplay">0</span></span>
                        </div>
                    </div>
                    
                    <div style="background: #eff6ff; padding: 15px; border-radius: 8px;">
                        <h3 style="color: #1e40af; margin-bottom: 10px;">AI Insight</h3>
                        <p id="aiInsight">Based on your inputs, here's our analysis...</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>&copy; 2025 FinGuid. Built with ❤️ for Americans.</p>
        </div>
    </div>

    <script>
        // State tax rates data
        const stateTaxRates = {
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
            "Wisconsin": 1.73, "Wyoming": 0.61, "District of Columbia": 0.56
        };

        // Populate state dropdown on page load
        document.addEventListener('DOMContentLoaded', function() {
            const stateSelect = document.getElementById('state');
            
            // Add states to dropdown
            for (const state in stateTaxRates) {
                const option = document.createElement('option');
                option.value = state;
                option.textContent = state;
                stateSelect.appendChild(option);
            }
            
            // Add event listener to auto-fill property tax based on state
            stateSelect.addEventListener('change', function() {
                const homePrice = parseFloat(document.getElementById('homePrice').value) || 0;
                if (homePrice > 0 && this.value) {
                    const taxRate = stateTaxRates[this.value];
                    const annualPropertyTax = (homePrice * taxRate) / 100;
                    document.getElementById('propertyTax').value = Math.round(annualPropertyTax);
                }
            });
            
            // Also update property tax when home price changes
            document.getElementById('homePrice').addEventListener('input', function() {
                const state = document.getElementById('state').value;
                const homePrice = parseFloat(this.value) || 0;
                if (homePrice > 0 && state) {
                    const taxRate = stateTaxRates[state];
                    const annualPropertyTax = (homePrice * taxRate) / 100;
                    document.getElementById('propertyTax').value = Math.round(annualPropertyTax);
                }
            });
        });

        // Mortgage calculation function
        function calculateMortgage() {
            // Get input values
            const homePrice = parseFloat(document.getElementById('homePrice').value) || 0;
            const downPayment = parseFloat(document.getElementById('downPayment').value) || 0;
            const loanTerm = parseInt(document.getElementById('loanTerm').value) || 30;
            const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
            const propertyTax = parseFloat(document.getElementById('propertyTax').value) || 0;
            const insurance = parseFloat(document.getElementById('insurance').value) || 0;
            const hoa = parseFloat(document.getElementById('hoa').value) || 0;
            const needsPmi = document.getElementById('pmiRequired').checked;
            
            // Calculate loan amount
            const loanAmount = homePrice - downPayment;
            
            // Calculate monthly principal and interest
            const monthlyRate = interestRate / 100 / 12;
            const numberOfPayments = loanTerm * 12;
            const monthlyPrincipalAndInterest = loanAmount * 
                (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
            
            // Calculate PMI if needed
            let monthlyPmi = 0;
            if (needsPmi && downPayment / homePrice < 0.2) {
                // PMI is typically 0.5% to 1% of loan amount annually
                monthlyPmi = (loanAmount * 0.005) / 12;
            }
            
            // Calculate other monthly costs
            const monthlyPropertyTax = propertyTax / 12;
            const monthlyInsurance = insurance / 12;
            
            // Calculate total monthly payment
            const totalMonthlyPayment = monthlyPrincipalAndInterest + monthlyPropertyTax + 
                                      monthlyInsurance + hoa + monthlyPmi;
            
            // Display results
            document.getElementById('totalPayment').textContent = totalMonthlyPayment.toFixed(2);
            document.getElementById('principalInterest').textContent = monthlyPrincipalAndInterest.toFixed(2);
            document.getElementById('propertyTaxDisplay').textContent = monthlyPropertyTax.toFixed(2);
            document.getElementById('insuranceDisplay').textContent = monthlyInsurance.toFixed(2);
            document.getElementById('hoaDisplay').textContent = hoa.toFixed(2);
            
            // Show/hide PMI row
            if (monthlyPmi > 0) {
                document.getElementById('pmiRow').style.display = 'flex';
                document.getElementById('pmiDisplay').textContent = monthlyPmi.toFixed(2);
            } else {
                document.getElementById('pmiRow').style.display = 'none';
            }
            
            // Generate AI insight
            generateAiInsight(homePrice, downPayment, loanTerm, interestRate);
            
            // Show results
            document.getElementById('resultsPlaceholder').style.display = 'none';
            document.getElementById('resultsContent').style.display = 'block';
            
            // Show mortgage result
            document.getElementById('mortgageResult').classList.add('show');
        }

        // Generate AI insight based on user inputs
        function generateAiInsight(homePrice, downPayment, loanTerm, interestRate) {
            const loanAmount = homePrice - downPayment;
            const loanToValue = loanAmount / homePrice;
            let insight = '';
            
            if (loanToValue > 0.8) {
                insight += 'Consider making additional principal payments to reach 20% equity faster and remove PMI. ';
            }
            
            if (interestRate > 6) {
                insight += 'Current rates are relatively high. You might want to consider an ARM loan or look for refinancing opportunities when rates drop. ';
            }
            
            if (loanTerm === 30) {
                insight += 'A 30-year term gives you lower monthly payments but you\'ll pay more interest over time. Consider a 15-year term if you can afford higher payments.';
            }
            
            document.getElementById('aiInsight').textContent = insight || 
                'Your mortgage terms look reasonable. Consider making bi-weekly payments to pay off your loan faster.';
        }
    </script>

    <!-- Font Awesome for icons -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
</body>
</html>