// ===== CORE CALCULATOR FUNCTIONS WITH AI INSIGHTS =====
// USA Financial Calculators - World's First AI-Enhanced Platform
// Version: 2.0.0
// Author: Finguid Team

'use strict';

class FinancialCalculators {
    constructor() {
        this.stateData = this.initializeStateData();
        this.aiInsights = new AIInsights();
        this.emailService = new EmailService();
        this.currentCalculation = null;
        this.calculators = new Map();
        this.init();
    }

    init() {
        this.createCalculatorCards();
        this.bindEvents();
        this.loadSavedData();
        this.setupOfflineSupport();
    }

    // ===== STATE-SPECIFIC DATA =====
    initializeStateData() {
        return {
            propertyTaxRates: {
                'AL': 0.0041, 'AK': 0.0089, 'AZ': 0.0066, 'AR': 0.0062, 'CA': 0.0075,
                'CO': 0.0051, 'CT': 0.0169, 'DE': 0.0043, 'FL': 0.0083, 'GA': 0.0092,
                'HI': 0.0031, 'ID': 0.0069, 'IL': 0.0211, 'IN': 0.0085, 'IA': 0.0154,
                'KS': 0.0140, 'KY': 0.0086, 'LA': 0.0055, 'ME': 0.0132, 'MD': 0.0087,
                'MA': 0.0115, 'MI': 0.0145, 'MN': 0.0111, 'MS': 0.0081, 'MO': 0.0099,
                'MT': 0.0084, 'NE': 0.0174, 'NV': 0.0053, 'NH': 0.0186, 'NJ': 0.0249,
                'NM': 0.0055, 'NY': 0.0124, 'NC': 0.0084, 'ND': 0.0098, 'OH': 0.0154,
                'OK': 0.0090, 'OR': 0.0087, 'PA': 0.0135, 'RI': 0.0137, 'SC': 0.0073,
                'SD': 0.0085, 'TN': 0.0067, 'TX': 0.0181, 'UT': 0.0060, 'VT': 0.0160,
                'VA': 0.0081, 'WA': 0.0087, 'WV': 0.0059, 'WI': 0.0176, 'WY': 0.0062
            },
            salesTaxRates: {
                'AL': 0.0400, 'AK': 0.0000, 'AZ': 0.0560, 'AR': 0.0650, 'CA': 0.0725,
                'CO': 0.0290, 'CT': 0.0635, 'DE': 0.0000, 'FL': 0.0600, 'GA': 0.0400,
                'HI': 0.0400, 'ID': 0.0600, 'IL': 0.0625, 'IN': 0.0700, 'IA': 0.0600,
                'KS': 0.0650, 'KY': 0.0600, 'LA': 0.0445, 'ME': 0.0550, 'MD': 0.0600,
                'MA': 0.0625, 'MI': 0.0600, 'MN': 0.0688, 'MS': 0.0700, 'MO': 0.0423,
                'MT': 0.0000, 'NE': 0.0550, 'NV': 0.0685, 'NH': 0.0000, 'NJ': 0.0663,
                'NM': 0.0513, 'NY': 0.0400, 'NC': 0.0475, 'ND': 0.0500, 'OH': 0.0575,
                'OK': 0.0450, 'OR': 0.0000, 'PA': 0.0600, 'RI': 0.0700, 'SC': 0.0600,
                'SD': 0.0450, 'TN': 0.0700, 'TX': 0.0625, 'UT': 0.0485, 'VT': 0.0600,
                'VA': 0.0530, 'WA': 0.0650, 'WV': 0.0600, 'WI': 0.0500, 'WY': 0.0400
            },
            avgInsuranceRates: {
                homeowners: {
                    'AL': 2313, 'AK': 739, 'AZ': 1056, 'AR': 1544, 'CA': 1011, 'CO': 2709,
                    'CT': 1258, 'DE': 956, 'FL': 1964, 'GA': 1558, 'HI': 575, 'ID': 682,
                    'IL': 1178, 'IN': 1162, 'IA': 1523, 'KS': 1681, 'KY': 1056, 'LA': 2839,
                    'ME': 808, 'MD': 1200, 'MA': 1188, 'MI': 1173, 'MN': 1362, 'MS': 1654,
                    'MO': 1567, 'MT': 918, 'NE': 1738, 'NV': 912, 'NH': 1019, 'NJ': 1262,
                    'NM': 1035, 'NY': 1188, 'NC': 1194, 'ND': 1336, 'OH': 1037, 'OK': 2537,
                    'OR': 723, 'PA': 1017, 'RI': 1307, 'SC': 1444, 'SD': 1534, 'TN': 1248,
                    'TX': 2394, 'UT': 774, 'VT': 1017, 'VA': 1042, 'WA': 913, 'WV': 851,
                    'WI': 1092, 'WY': 992
                },
                auto: {
                    'AL': 1739, 'AK': 1463, 'AZ': 1627, 'AR': 1714, 'CA': 2065, 'CO': 1897,
                    'CT': 1712, 'DE': 2067, 'FL': 2364, 'GA': 1822, 'HI': 1234, 'ID': 1297,
                    'IL': 1333, 'IN': 1190, 'IA': 1336, 'KS': 1534, 'KY': 1685, 'LA': 2839,
                    'ME': 1007, 'MD': 1746, 'MA': 1507, 'MI': 2639, 'MN': 1777, 'MS': 1674,
                    'MO': 1395, 'MT': 1486, 'NE': 1554, 'NV': 1876, 'NH': 1112, 'NJ': 1905,
                    'NM': 1336, 'NY': 1570, 'NC': 1380, 'ND': 1442, 'OH': 1156, 'OK': 1778,
                    'OR': 1427, 'PA': 1608, 'RI': 1895, 'SC': 1443, 'SD': 1441, 'TN': 1189,
                    'TX': 1808, 'UT': 1621, 'VT': 1125, 'VA': 1223, 'WA': 1474, 'WV': 1396,
                    'WI': 1334, 'WY': 1590
                }
            },
            federalTaxBrackets2025: [
                { min: 0, max: 11600, rate: 0.10 },
                { min: 11601, max: 47150, rate: 0.12 },
                { min: 47151, max: 100525, rate: 0.22 },
                { min: 100526, max: 191950, rate: 0.24 },
                { min: 191951, max: 243725, rate: 0.32 },
                { min: 243726, max: 609350, rate: 0.35 },
                { min: 609351, max: Infinity, rate: 0.37 }
            ],
            currentRates: {
                mortgage: 7.2,
                auto: 5.8,
                personal: 11.5,
                creditCard: 24.8,
                savings: 4.5,
                cd: 5.1
            }
        };
    }

    // ===== CALCULATOR CARD CREATION =====
    createCalculatorCards() {
        const calculatorGrid = document.getElementById('calculatorGrid');
        if (!calculatorGrid) return;

        const calculators = [
            {
                id: 'mortgage-calculator',
                title: 'Mortgage Calculator',
                subtitle: 'Calculate monthly payments with PMI, taxes, and insurance',
                icon: 'fas fa-home',
                category: 'mortgage',
                inputs: this.getMortgageInputs(),
                priority: 1
            },
            {
                id: 'auto-loan-calculator',
                title: 'Auto Loan Calculator',
                subtitle: 'Compare financing options with trade-in values',
                icon: 'fas fa-car',
                category: 'auto',
                inputs: this.getAutoLoanInputs(),
                priority: 2
            },
            {
                id: 'investment-calculator',
                title: 'Investment Calculator',
                subtitle: 'Plan your financial future with compound interest',
                icon: 'fas fa-chart-line',
                category: 'investment',
                inputs: this.getInvestmentInputs(),
                priority: 3
            },
            {
                id: 'credit-card-calculator',
                title: 'Credit Card Payoff Calculator',
                subtitle: 'Calculate payoff time and interest costs',
                icon: 'fas fa-credit-card',
                category: 'credit',
                inputs: this.getCreditCardInputs(),
                priority: 4
            },
            {
                id: 'retirement-calculator',
                title: '401k Retirement Calculator',
                subtitle: 'Plan for retirement with employer matching',
                icon: 'fas fa-piggy-bank',
                category: 'retirement',
                inputs: this.getRetirementInputs(),
                priority: 5
            },
            {
                id: 'refinance-calculator',
                title: 'Mortgage Refinance Calculator',
                subtitle: 'See if refinancing saves you money',
                icon: 'fas fa-exchange-alt',
                category: 'refinance',
                inputs: this.getRefinanceInputs(),
                priority: 6
            }
        ];

        calculators.forEach(calc => {
            const cardElement = this.createCalculatorCard(calc);
            calculatorGrid.appendChild(cardElement);
            this.calculators.set(calc.id, calc);
        });
    }

    createCalculatorCard(calculator) {
        const card = document.createElement('div');
        card.className = 'calculator-card';
        card.id = calculator.id;
        card.setAttribute('role', 'region');
        card.setAttribute('aria-labelledby', `${calculator.id}-title`);

        card.innerHTML = `
            <div class="calculator-header">
                <div class="calculator-icon">
                    <i class="${calculator.icon}" aria-hidden="true"></i>
                </div>
                <div>
                    <h3 class="calculator-title" id="${calculator.id}-title">${calculator.title}</h3>
                    <p class="calculator-subtitle">${calculator.subtitle}</p>
                </div>
            </div>
            
            <div class="calculator-layout">
                <div class="calculator-inputs">
                    <h4><i class="fas fa-edit"></i> Input Details</h4>
                    <form class="calculator-form" id="${calculator.id}-form">
                        ${this.generateInputFields(calculator.inputs)}
                    </form>
                </div>
                
                <div class="calculator-results hidden" id="${calculator.id}-results">
                    <h4><i class="fas fa-calculator"></i> Results</h4>
                    <div class="results-content" id="${calculator.id}-results-content">
                        <!-- Results will be populated here -->
                    </div>
                    <div class="ai-insights" id="${calculator.id}-insights">
                        <!-- AI insights will be populated here -->
                    </div>
                </div>
            </div>
            
            <div class="calculator-buttons">
                <button type="button" class="btn-calculate" data-calculator="${calculator.id}">
                    <i class="fas fa-calculator"></i>
                    Calculate
                </button>
                <button type="button" class="btn-reset" data-calculator="${calculator.id}">
                    <i class="fas fa-redo"></i>
                    Reset
                </button>
                <button type="button" class="btn-email hidden" data-calculator="${calculator.id}">
                    <i class="fas fa-envelope"></i>
                    Email Results
                </button>
            </div>
        `;

        return card;
    }

    // ===== INPUT FIELD DEFINITIONS =====
    getMortgageInputs() {
        return [
            {
                id: 'homePrice',
                label: 'Home Price',
                type: 'currency',
                required: true,
                placeholder: '450,000',
                tooltip: 'The total purchase price of the home'
            },
            {
                id: 'downPayment',
                label: 'Down Payment',
                type: 'currency',
                required: true,
                placeholder: '90,000',
                tooltip: 'Amount paid upfront (typically 10-20% of home price)'
            },
            {
                id: 'interestRate',
                label: 'Interest Rate (%)',
                type: 'percentage',
                required: true,
                placeholder: '7.2',
                tooltip: 'Annual interest rate for your mortgage'
            },
            {
                id: 'loanTerm',
                label: 'Loan Term',
                type: 'select',
                required: true,
                options: [
                    { value: '15', label: '15 years' },
                    { value: '20', label: '20 years' },
                    { value: '25', label: '25 years' },
                    { value: '30', label: '30 years' }
                ],
                tooltip: 'Length of time to repay the loan'
            },
            {
                id: 'state',
                label: 'State',
                type: 'select',
                required: true,
                options: this.getStateOptions(),
                tooltip: 'Your state affects property tax rates'
            },
            {
                id: 'propertyTax',
                label: 'Annual Property Tax',
                type: 'currency',
                placeholder: 'Auto-calculated',
                tooltip: 'Will be calculated based on your state if left empty'
            },
            {
                id: 'homeInsurance',
                label: 'Annual Home Insurance',
                type: 'currency',
                placeholder: 'Auto-calculated',
                tooltip: 'Will be calculated based on your state if left empty'
            },
            {
                id: 'pmi',
                label: 'PMI (if down payment < 20%)',
                type: 'currency',
                placeholder: 'Auto-calculated',
                tooltip: 'Private Mortgage Insurance - required if down payment is less than 20%'
            },
            {
                id: 'hoaFees',
                label: 'Monthly HOA Fees',
                type: 'currency',
                placeholder: '0',
                tooltip: 'Homeowners Association fees (optional)'
            }
        ];
    }

    getAutoLoanInputs() {
        return [
            {
                id: 'vehiclePrice',
                label: 'Vehicle Price',
                type: 'currency',
                required: true,
                placeholder: '35,000',
                tooltip: 'The total price of the vehicle'
            },
            {
                id: 'downPayment',
                label: 'Down Payment',
                type: 'currency',
                required: true,
                placeholder: '7,000',
                tooltip: 'Amount paid upfront'
            },
            {
                id: 'tradeInValue',
                label: 'Trade-in Value',
                type: 'currency',
                placeholder: '0',
                tooltip: 'Value of your current vehicle (optional)'
            },
            {
                id: 'interestRate',
                label: 'Interest Rate (%)',
                type: 'percentage',
                required: true,
                placeholder: '5.8',
                tooltip: 'Annual interest rate for your auto loan'
            },
            {
                id: 'loanTerm',
                label: 'Loan Term',
                type: 'select',
                required: true,
                options: [
                    { value: '24', label: '24 months' },
                    { value: '36', label: '36 months' },
                    { value: '48', label: '48 months' },
                    { value: '60', label: '60 months' },
                    { value: '72', label: '72 months' },
                    { value: '84', label: '84 months' }
                ],
                tooltip: 'Length of time to repay the loan'
            },
            {
                id: 'state',
                label: 'State',
                type: 'select',
                required: true,
                options: this.getStateOptions(),
                tooltip: 'Your state affects sales tax rates'
            },
            {
                id: 'salesTax',
                label: 'Sales Tax (%)',
                type: 'percentage',
                placeholder: 'Auto-calculated',
                tooltip: 'Will be calculated based on your state if left empty'
            },
            {
                id: 'fees',
                label: 'Additional Fees',
                type: 'currency',
                placeholder: '1,500',
                tooltip: 'Documentation, registration, and other fees'
            }
        ];
    }

    getInvestmentInputs() {
        return [
            {
                id: 'initialAmount',
                label: 'Initial Investment',
                type: 'currency',
                required: true,
                placeholder: '10,000',
                tooltip: 'The amount you invest initially'
            },
            {
                id: 'monthlyContribution',
                label: 'Monthly Contribution',
                type: 'currency',
                placeholder: '500',
                tooltip: 'Amount you plan to invest each month'
            },
            {
                id: 'annualReturn',
                label: 'Expected Annual Return (%)',
                type: 'percentage',
                required: true,
                placeholder: '8',
                tooltip: 'Expected yearly return on your investment'
            },
            {
                id: 'investmentPeriod',
                label: 'Investment Period (Years)',
                type: 'number',
                required: true,
                placeholder: '20',
                tooltip: 'How long you plan to invest'
            },
            {
                id: 'inflationRate',
                label: 'Inflation Rate (%)',
                type: 'percentage',
                placeholder: '2.5',
                tooltip: 'Expected annual inflation rate'
            },
            {
                id: 'taxRate',
                label: 'Tax Rate on Gains (%)',
                type: 'percentage',
                placeholder: '20',
                tooltip: 'Tax rate on investment gains'
            }
        ];
    }

    getCreditCardInputs() {
        return [
            {
                id: 'balance',
                label: 'Current Balance',
                type: 'currency',
                required: true,
                placeholder: '5,000',
                tooltip: 'Your current credit card balance'
            },
            {
                id: 'interestRate',
                label: 'Interest Rate (APR %)',
                type: 'percentage',
                required: true,
                placeholder: '24.8',
                tooltip: 'Annual Percentage Rate on your credit card'
            },
            {
                id: 'paymentStrategy',
                label: 'Payment Strategy',
                type: 'radio',
                required: true,
                options: [
                    { value: 'minimum', label: 'Minimum Payment Only' },
                    { value: 'fixed', label: 'Fixed Monthly Payment' },
                    { value: 'payoff', label: 'Pay Off In Specific Time' }
                ],
                tooltip: 'Choose your payment strategy'
            },
            {
                id: 'monthlyPayment',
                label: 'Monthly Payment',
                type: 'currency',
                placeholder: '200',
                tooltip: 'Amount you plan to pay each month',
                conditional: 'paymentStrategy:fixed'
            },
            {
                id: 'payoffTime',
                label: 'Months to Pay Off',
                type: 'number',
                placeholder: '24',
                tooltip: 'Target number of months to pay off balance',
                conditional: 'paymentStrategy:payoff'
            }
        ];
    }

    getRetirementInputs() {
        return [
            {
                id: 'currentAge',
                label: 'Current Age',
                type: 'number',
                required: true,
                placeholder: '30',
                tooltip: 'Your current age'
            },
            {
                id: 'retirementAge',
                label: 'Retirement Age',
                type: 'number',
                required: true,
                placeholder: '65',
                tooltip: 'Age you plan to retire'
            },
            {
                id: 'currentSalary',
                label: 'Current Annual Salary',
                type: 'currency',
                required: true,
                placeholder: '75,000',
                tooltip: 'Your current annual salary'
            },
            {
                id: 'currentBalance',
                label: 'Current 401k Balance',
                type: 'currency',
                placeholder: '25,000',
                tooltip: 'Current balance in your 401k account'
            },
            {
                id: 'employeeContribution',
                label: 'Your Contribution (%)',
                type: 'percentage',
                required: true,
                placeholder: '6',
                tooltip: 'Percentage of salary you contribute'
            },
            {
                id: 'employerMatch',
                label: 'Employer Match (%)',
                type: 'percentage',
                placeholder: '3',
                tooltip: 'Percentage your employer matches'
            },
            {
                id: 'expectedReturn',
                label: 'Expected Annual Return (%)',
                type: 'percentage',
                required: true,
                placeholder: '7',
                tooltip: 'Expected annual return on investments'
            },
            {
                id: 'salaryIncreases',
                label: 'Annual Salary Increases (%)',
                type: 'percentage',
                placeholder: '2.5',
                tooltip: 'Expected annual salary increases'
            }
        ];
    }

    getRefinanceInputs() {
        return [
            {
                id: 'currentBalance',
                label: 'Current Loan Balance',
                type: 'currency',
                required: true,
                placeholder: '320,000',
                tooltip: 'Remaining balance on your current mortgage'
            },
            {
                id: 'currentRate',
                label: 'Current Interest Rate (%)',
                type: 'percentage',
                required: true,
                placeholder: '8.5',
                tooltip: 'Current interest rate on your mortgage'
            },
            {
                id: 'currentTerm',
                label: 'Remaining Term (Years)',
                type: 'number',
                required: true,
                placeholder: '25',
                tooltip: 'Years remaining on current mortgage'
            },
            {
                id: 'newRate',
                label: 'New Interest Rate (%)',
                type: 'percentage',
                required: true,
                placeholder: '7.2',
                tooltip: 'Interest rate for the new mortgage'
            },
            {
                id: 'newTerm',
                label: 'New Loan Term',
                type: 'select',
                required: true,
                options: [
                    { value: '15', label: '15 years' },
                    { value: '20', label: '20 years' },
                    { value: '25', label: '25 years' },
                    { value: '30', label: '30 years' }
                ],
                tooltip: 'Term for the new mortgage'
            },
            {
                id: 'closingCosts',
                label: 'Closing Costs',
                type: 'currency',
                placeholder: '5,000',
                tooltip: 'Total closing costs for refinancing'
            }
        ];
    }

    // ===== INPUT FIELD GENERATION =====
    generateInputFields(inputs) {
        let html = '';
        let currentRow = '';
        let fieldsInRow = 0;

        inputs.forEach((input, index) => {
            const fieldHtml = this.generateSingleInput(input);
            
            if (input.type === 'radio' || input.fullWidth || fieldsInRow >= 2) {
                // Close current row if it has fields
                if (currentRow) {
                    html += `<div class="form-row">${currentRow}</div>`;
                    currentRow = '';
                    fieldsInRow = 0;
                }
                
                // Add full-width field
                html += fieldHtml;
            } else {
                // Add to current row
                currentRow += fieldHtml;
                fieldsInRow++;
                
                // If this is the last field or we have 2 fields, close the row
                if (index === inputs.length - 1 || fieldsInRow >= 2) {
                    html += `<div class="form-row">${currentRow}</div>`;
                    currentRow = '';
                    fieldsInRow = 0;
                }
            }
        });

        return html;
    }

    generateSingleInput(input) {
        const required = input.required ? 'required' : '';
        const placeholder = input.placeholder ? `placeholder="${input.placeholder}"` : '';
        const tooltip = input.tooltip ? `<i class="fas fa-question-circle tooltip-icon" data-tooltip="${input.tooltip}"></i>` : '';
        const requiredMark = input.required ? '<span class="required">*</span>' : '';

        switch (input.type) {
            case 'currency':
                return `
                    <div class="form-group ${input.conditional ? 'conditional' : ''}" ${input.conditional ? `data-condition="${input.conditional}"` : ''}>
                        <label for="${input.id}" class="form-label">
                            ${input.label}${requiredMark}${tooltip}
                        </label>
                        <div class="input-wrapper">
                            <span class="input-prefix">$</span>
                            <input 
                                type="number" 
                                id="${input.id}" 
                                name="${input.id}" 
                                class="form-input" 
                                ${placeholder} 
                                ${required}
                                min="0"
                                step="0.01"
                            >
                        </div>
                    </div>
                `;

            case 'percentage':
                return `
                    <div class="form-group ${input.conditional ? 'conditional' : ''}" ${input.conditional ? `data-condition="${input.conditional}"` : ''}>
                        <label for="${input.id}" class="form-label">
                            ${input.label}${requiredMark}${tooltip}
                        </label>
                        <div class="input-wrapper has-suffix">
                            <input 
                                type="number" 
                                id="${input.id}" 
                                name="${input.id}" 
                                class="form-input" 
                                ${placeholder} 
                                ${required}
                                min="0"
                                max="100"
                                step="0.01"
                            >
                            <span class="input-suffix">%</span>
                        </div>
                    </div>
                `;

            case 'select':
                const options = input.options.map(option => 
                    `<option value="${option.value}">${option.label}</option>`
                ).join('');
                return `
                    <div class="form-group ${input.conditional ? 'conditional' : ''}" ${input.conditional ? `data-condition="${input.conditional}"` : ''}>
                        <label for="${input.id}" class="form-label">
                            ${input.label}${requiredMark}${tooltip}
                        </label>
                        <select id="${input.id}" name="${input.id}" class="form-select" ${required}>
                            <option value="">Select ${input.label}</option>
                            ${options}
                        </select>
                    </div>
                `;

            case 'radio':
                const radioOptions = input.options.map(option => `
                    <div class="radio-item">
                        <input 
                            type="radio" 
                            id="${input.id}-${option.value}" 
                            name="${input.id}" 
                            value="${option.value}" 
                            ${required}
                        >
                        <label for="${input.id}-${option.value}">${option.label}</label>
                    </div>
                `).join('');
                return `
                    <div class="form-group full-width ${input.conditional ? 'conditional' : ''}" ${input.conditional ? `data-condition="${input.conditional}"` : ''}>
                        <label class="form-label">
                            ${input.label}${requiredMark}${tooltip}
                        </label>
                        <div class="radio-group">
                            ${radioOptions}
                        </div>
                    </div>
                `;

            default:
                return `
                    <div class="form-group ${input.conditional ? 'conditional' : ''}" ${input.conditional ? `data-condition="${input.conditional}"` : ''}>
                        <label for="${input.id}" class="form-label">
                            ${input.label}${requiredMark}${tooltip}
                        </label>
                        <input 
                            type="${input.type}" 
                            id="${input.id}" 
                            name="${input.id}" 
                            class="form-input" 
                            ${placeholder} 
                            ${required}
                            ${input.min ? `min="${input.min}"` : ''}
                            ${input.max ? `max="${input.max}"` : ''}
                            ${input.step ? `step="${input.step}"` : ''}
                        >
                    </div>
                `;
        }
    }

    getStateOptions() {
        return [
            { value: 'AL', label: 'Alabama' },
            { value: 'AK', label: 'Alaska' },
            { value: 'AZ', label: 'Arizona' },
            { value: 'AR', label: 'Arkansas' },
            { value: 'CA', label: 'California' },
            { value: 'CO', label: 'Colorado' },
            { value: 'CT', label: 'Connecticut' },
            { value: 'DE', label: 'Delaware' },
            { value: 'FL', label: 'Florida' },
            { value: 'GA', label: 'Georgia' },
            { value: 'HI', label: 'Hawaii' },
            { value: 'ID', label: 'Idaho' },
            { value: 'IL', label: 'Illinois' },
            { value: 'IN', label: 'Indiana' },
            { value: 'IA', label: 'Iowa' },
            { value: 'KS', label: 'Kansas' },
            { value: 'KY', label: 'Kentucky' },
            { value: 'LA', label: 'Louisiana' },
            { value: 'ME', label: 'Maine' },
            { value: 'MD', label: 'Maryland' },
            { value: 'MA', label: 'Massachusetts' },
            { value: 'MI', label: 'Michigan' },
            { value: 'MN', label: 'Minnesota' },
            { value: 'MS', label: 'Mississippi' },
            { value: 'MO', label: 'Missouri' },
            { value: 'MT', label: 'Montana' },
            { value: 'NE', label: 'Nebraska' },
            { value: 'NV', label: 'Nevada' },
            { value: 'NH', label: 'New Hampshire' },
            { value: 'NJ', label: 'New Jersey' },
            { value: 'NM', label: 'New Mexico' },
            { value: 'NY', label: 'New York' },
            { value: 'NC', label: 'North Carolina' },
            { value: 'ND', label: 'North Dakota' },
            { value: 'OH', label: 'Ohio' },
            { value: 'OK', label: 'Oklahoma' },
            { value: 'OR', label: 'Oregon' },
            { value: 'PA', label: 'Pennsylvania' },
            { value: 'RI', label: 'Rhode Island' },
            { value: 'SC', label: 'South Carolina' },
            { value: 'SD', label: 'South Dakota' },
            { value: 'TN', label: 'Tennessee' },
            { value: 'TX', label: 'Texas' },
            { value: 'UT', label: 'Utah' },
            { value: 'VT', label: 'Vermont' },
            { value: 'VA', label: 'Virginia' },
            { value: 'WA', label: 'Washington' },
            { value: 'WV', label: 'West Virginia' },
            { value: 'WI', label: 'Wisconsin' },
            { value: 'WY', label: 'Wyoming' }
        ];
    }

    // ===== EVENT BINDING =====
    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-calculate')) {
                const calculatorId = e.target.dataset.calculator;
                this.handleCalculation(calculatorId, e.target);
            } else if (e.target.matches('.btn-reset')) {
                const calculatorId = e.target.dataset.calculator;
                this.resetCalculator(calculatorId);
            } else if (e.target.matches('.btn-email')) {
                const calculatorId = e.target.dataset.calculator;
                this.showEmailModal(calculatorId);
            }
        });

        // Handle conditional field visibility
        document.addEventListener('change', (e) => {
            if (e.target.type === 'radio') {
                this.handleConditionalFields(e.target);
            }
            
            // Auto-calculate dependent fields
            if (e.target.matches('[name="state"]')) {
                this.updateStateDependentFields(e.target);
            }
        });

        // Handle form validation on input
        document.addEventListener('input', (e) => {
            if (e.target.matches('.form-input, .form-select')) {
                this.validateField(e.target);
            }
        });

        // Handle tooltip display
        document.addEventListener('mouseover', (e) => {
            if (e.target.matches('.tooltip-icon')) {
                this.showTooltip(e.target);
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.matches('.tooltip-icon')) {
                this.hideTooltip(e.target);
            }
        });
    }

    // ===== MAIN CALCULATION HANDLER =====
    async handleCalculation(calculatorId, button) {
        try {
            // Show loading state
            this.setLoadingState(button, true);
            
            // Get form data
            const formData = this.getFormData(calculatorId);
            
            // Validate data
            const validation = this.validateFormData(calculatorId, formData);
            if (!validation.isValid) {
                this.showValidationErrors(calculatorId, validation.errors);
                return;
            }

            // Perform calculation based on type
            let results;
            switch (calculatorId) {
                case 'mortgage-calculator':
                    results = await this.calculateMortgage(formData);
                    break;
                case 'auto-loan-calculator':
                    results = await this.calculateAutoLoan(formData);
                    break;
                case 'investment-calculator':
                    results = await this.calculateInvestment(formData);
                    break;
                case 'credit-card-calculator':
                    results = await this.calculateCreditCard(formData);
                    break;
                case 'retirement-calculator':
                    results = await this.calculateRetirement(formData);
                    break;
                case 'refinance-calculator':
                    results = await this.calculateRefinance(formData);
                    break;
                default:
                    throw new Error(`Unknown calculator type: ${calculatorId}`);
            }

            // Display results
            this.displayResults(calculatorId, results);
            
            // Generate and display AI insights
            const insights = await this.aiInsights.generateInsights(calculatorId, formData, results);
            this.displayAIInsights(calculatorId, insights);

            // Show email button
            this.showEmailButton(calculatorId);

            // Save calculation to history
            this.saveCalculation(calculatorId, formData, results);

            // Track analytics
            this.trackCalculation(calculatorId, results);

        } catch (error) {
            console.error('Calculation error:', error);
            this.showError(calculatorId, 'An error occurred during calculation. Please try again.');
        } finally {
            this.setLoadingState(button, false);
        }
    }

    // ===== MORTGAGE CALCULATOR =====
    async calculateMortgage(data) {
        const homePrice = parseFloat(data.homePrice);
        const downPayment = parseFloat(data.downPayment) || 0;
        const interestRate = parseFloat(data.interestRate) / 100;
        const loanTermYears = parseInt(data.loanTerm);
        const state = data.state;

        // Calculate loan amount
        const loanAmount = homePrice - downPayment;
        const downPaymentPercent = (downPayment / homePrice) * 100;

        // Calculate monthly payment components
        const monthlyRate = interestRate / 12;
        const totalPayments = loanTermYears * 12;
        
        // Principal and Interest
        const monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                         (Math.pow(1 + monthlyRate, totalPayments) - 1);

        // Property tax (use provided value or calculate from state data)
        let monthlyPropertyTax;
        if (data.propertyTax) {
            monthlyPropertyTax = parseFloat(data.propertyTax) / 12;
        } else {
            const propertyTaxRate = this.stateData.propertyTaxRates[state] || 0.01;
            monthlyPropertyTax = (homePrice * propertyTaxRate) / 12;
        }

        // Home insurance (use provided value or calculate from state data)
        let monthlyInsurance;
        if (data.homeInsurance) {
            monthlyInsurance = parseFloat(data.homeInsurance) / 12;
        } else {
            const avgInsurance = this.stateData.avgInsuranceRates.homeowners[state] || 1200;
            monthlyInsurance = avgInsurance / 12;
        }

        // PMI calculation
        let monthlyPMI = 0;
        if (downPaymentPercent < 20) {
            if (data.pmi) {
                monthlyPMI = parseFloat(data.pmi) / 12;
            } else {
                // Typical PMI is 0.5% to 1% of loan amount annually
                monthlyPMI = (loanAmount * 0.006) / 12; // 0.6% annually
            }
        }

        // HOA fees
        const monthlyHOA = parseFloat(data.hoaFees) || 0;

        // Total monthly payment
        const totalMonthlyPayment = monthlyPI + monthlyPropertyTax + monthlyInsurance + monthlyPMI + monthlyHOA;

        // Total costs over life of loan
        const totalInterest = (monthlyPI * totalPayments) - loanAmount;
        const totalCost = totalMonthlyPayment * totalPayments + downPayment;

        // Generate amortization schedule (first year)
        const amortizationSchedule = this.generateAmortizationSchedule(loanAmount, monthlyRate, totalPayments, 12);

        return {
            loanAmount,
            downPayment,
            downPaymentPercent: Math.round(downPaymentPercent * 10) / 10,
            monthlyPayment: {
                principalInterest: monthlyPI,
                propertyTax: monthlyPropertyTax,
                insurance: monthlyInsurance,
                pmi: monthlyPMI,
                hoa: monthlyHOA,
                total: totalMonthlyPayment
            },
            loanSummary: {
                totalInterest,
                totalCost,
                payoffDate: new Date(Date.now() + (totalPayments * 30 * 24 * 60 * 60 * 1000)),
                totalPayments
            },
            amortizationSchedule,
            calculationType: 'mortgage'
        };
    }

    // ===== AUTO LOAN CALCULATOR =====
    async calculateAutoLoan(data) {
        const vehiclePrice = parseFloat(data.vehiclePrice);
        const downPayment = parseFloat(data.downPayment) || 0;
        const tradeInValue = parseFloat(data.tradeInValue) || 0;
        const interestRate = parseFloat(data.interestRate) / 100;
        const loanTermMonths = parseInt(data.loanTerm);
        const state = data.state;
        const additionalFees = parseFloat(data.fees) || 0;

        // Calculate sales tax
        let salesTaxAmount;
        if (data.salesTax) {
            salesTaxAmount = vehiclePrice * (parseFloat(data.salesTax) / 100);
        } else {
            const salesTaxRate = this.stateData.salesTaxRates[state] || 0.06;
            salesTaxAmount = vehiclePrice * salesTaxRate;
        }

        // Total amount to finance
        const totalCost = vehiclePrice + salesTaxAmount + additionalFees;
        const loanAmount = totalCost - downPayment - tradeInValue;

        if (loanAmount <= 0) {
            throw new Error('Loan amount must be positive. Check your down payment and trade-in values.');
        }

        // Calculate monthly payment
        const monthlyRate = interestRate / 12;
        const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) / 
                              (Math.pow(1 + monthlyRate, loanTermMonths) - 1);

        const totalInterest = (monthlyPayment * loanTermMonths) - loanAmount;
        const totalOfPayments = monthlyPayment * loanTermMonths;

        return {
            vehiclePrice,
            downPayment,
            tradeInValue,
            salesTaxAmount,
            additionalFees,
            loanAmount,
            monthlyPayment,
            totalInterest,
            totalOfPayments: totalOfPayments + downPayment + tradeInValue,
            interestRate: interestRate * 100,
            loanTermMonths,
            calculationType: 'auto'
        };
    }

    // ===== INVESTMENT CALCULATOR =====
    async calculateInvestment(data) {
        const initialAmount = parseFloat(data.initialAmount);
        const monthlyContribution = parseFloat(data.monthlyContribution) || 0;
        const annualReturn = parseFloat(data.annualReturn) / 100;
        const years = parseFloat(data.investmentPeriod);
        const inflationRate = (parseFloat(data.inflationRate) || 2.5) / 100;
        const taxRate = (parseFloat(data.taxRate) || 20) / 100;

        const monthlyReturn = annualReturn / 12;
        const totalMonths = years * 12;

        // Calculate future value with monthly contributions
        let futureValue = initialAmount;
        let totalContributions = initialAmount;
        const yearlyBreakdown = [];

        for (let year = 1; year <= years; year++) {
            for (let month = 1; month <= 12; month++) {
                futureValue = futureValue * (1 + monthlyReturn) + monthlyContribution;
                totalContributions += monthlyContribution;
            }
            
            yearlyBreakdown.push({
                year,
                balance: futureValue,
                contributions: totalContributions,
                gains: futureValue - totalContributions
            });
        }

        const totalGains = futureValue - totalContributions;
        const taxesOwed = totalGains * taxRate;
        const afterTaxValue = futureValue - taxesOwed;

        // Adjust for inflation
        const realValue = afterTaxValue / Math.pow(1 + inflationRate, years);

        return {
            initialAmount,
            monthlyContribution,
            totalContributions,
            futureValue,
            totalGains,
            taxesOwed,
            afterTaxValue,
            realValue,
            realGains: realValue - totalContributions,
            effectiveReturn: ((afterTaxValue / totalContributions) - 1) * 100 / years,
            yearlyBreakdown,
            calculationType: 'investment'
        };
    }

    // ===== CREDIT CARD CALCULATOR =====
    async calculateCreditCard(data) {
        const balance = parseFloat(data.balance);
        const interestRate = parseFloat(data.interestRate) / 100;
        const paymentStrategy = data.paymentStrategy;
        
        const monthlyRate = interestRate / 12;
        let results = {};

        if (paymentStrategy === 'minimum') {
            // Minimum payment (typically 2-3% of balance)
            const minPaymentPercent = 0.025; // 2.5%
            const minPayment = Math.max(balance * minPaymentPercent, 25); // Minimum $25

            results = this.calculatePayoffSchedule(balance, monthlyRate, minPayment);
            results.paymentType = 'Minimum Payment';
            results.monthlyPayment = minPayment;
            
        } else if (paymentStrategy === 'fixed') {
            const monthlyPayment = parseFloat(data.monthlyPayment);
            
            if (monthlyPayment <= balance * monthlyRate) {
                throw new Error('Monthly payment must be greater than monthly interest to pay off the balance.');
            }
            
            results = this.calculatePayoffSchedule(balance, monthlyRate, monthlyPayment);
            results.paymentType = 'Fixed Monthly Payment';
            results.monthlyPayment = monthlyPayment;
            
        } else if (paymentStrategy === 'payoff') {
            const targetMonths = parseInt(data.payoffTime);
            
            // Calculate required monthly payment
            const requiredPayment = balance * (monthlyRate * Math.pow(1 + monthlyRate, targetMonths)) / 
                                  (Math.pow(1 + monthlyRate, targetMonths) - 1);
            
            results = this.calculatePayoffSchedule(balance, monthlyRate, requiredPayment);
            results.paymentType = `Pay off in ${targetMonths} months`;
            results.monthlyPayment = requiredPayment;
            results.targetMonths = targetMonths;
        }

        // Add comparison with minimum payment
        const minPayment = Math.max(balance * 0.025, 25);
        const minPaymentResults = this.calculatePayoffSchedule(balance, monthlyRate, minPayment);
        
        results.comparison = {
            minPaymentMonths: minPaymentResults.monthsToPayoff,
            minPaymentInterest: minPaymentResults.totalInterest,
            interestSavings: minPaymentResults.totalInterest - results.totalInterest,
            timeSavings: minPaymentResults.monthsToPayoff - results.monthsToPayoff
        };

        results.calculationType = 'creditCard';
        return results;
    }

    calculatePayoffSchedule(balance, monthlyRate, monthlyPayment) {
        let currentBalance = balance;
        let totalInterest = 0;
        let months = 0;
        const schedule = [];

        while (currentBalance > 0.01 && months < 600) { // Cap at 50 years
            const interestPayment = currentBalance * monthlyRate;
            const principalPayment = Math.min(monthlyPayment - interestPayment, currentBalance);
            
            if (principalPayment <= 0) {
                // Payment doesn't cover interest
                months = Infinity;
                break;
            }
            
            currentBalance -= principalPayment;
            totalInterest += interestPayment;
            months++;

            if (months <= 12 || months % 12 === 0) {
                schedule.push({
                    month: months,
                    payment: monthlyPayment,
                    interest: interestPayment,
                    principal: principalPayment,
                    balance: currentBalance
                });
            }
        }

        return {
            monthsToPayoff: months === Infinity ? 'Never (payment too low)' : months,
            totalInterest: Math.round(totalInterest),
            totalPaid: Math.round(balance + totalInterest),
            schedule
        };
    }

    // ===== RETIREMENT CALCULATOR =====
    async calculateRetirement(data) {
        const currentAge = parseInt(data.currentAge);
        const retirementAge = parseInt(data.retirementAge);
        const currentSalary = parseFloat(data.currentSalary);
        const currentBalance = parseFloat(data.currentBalance) || 0;
        const employeeContribution = parseFloat(data.employeeContribution) / 100;
        const employerMatch = parseFloat(data.employerMatch) / 100;
        const expectedReturn = parseFloat(data.expectedReturn) / 100;
        const salaryIncreases = (parseFloat(data.salaryIncreases) || 0) / 100;

        const yearsToRetirement = retirementAge - currentAge;
        
        if (yearsToRetirement <= 0) {
            throw new Error('Retirement age must be greater than current age.');
        }

        let projectedBalance = currentBalance;
        let totalContributions = 0;
        let totalEmployerMatch = 0;
        let salary = currentSalary;
        const yearlyProjections = [];

        for (let year = 1; year <= yearsToRetirement; year++) {
            // Apply salary increase
            if (year > 1) {
                salary *= (1 + salaryIncreases);
            }

            // Calculate contributions
            const employeeAnnualContribution = salary * employeeContribution;
            const employerAnnualMatch = Math.min(salary * employerMatch, employeeAnnualContribution);
            const totalAnnualContribution = employeeAnnualContribution + employerAnnualMatch;

            // Apply investment growth
            projectedBalance = projectedBalance * (1 + expectedReturn) + totalAnnualContribution;
            
            totalContributions += employeeAnnualContribution;
            totalEmployerMatch += employerAnnualMatch;

            yearlyProjections.push({
                year: year,
                age: currentAge + year,
                salary: salary,
                employeeContribution: employeeAnnualContribution,
                employerMatch: employerAnnualMatch,
                balance: projectedBalance
            });
        }

        // Calculate replacement ratio (common retirement planning metric)
        const finalSalary = salary;
        const recommendedRetirementIncome = finalSalary * 0.8; // 80% replacement ratio
        const monthlyRetirementIncome = recommendedRetirementIncome / 12;

        // Calculate how long the retirement savings might last
        // Using 4% withdrawal rule as a baseline
        const safeWithdrawalRate = 0.04;
        const sustainableAnnualIncome = projectedBalance * safeWithdrawalRate;
        const sustainableMonthlyIncome = sustainableAnnualIncome / 12;

        return {
            currentAge,
            retirementAge,
            yearsToRetirement,
            currentBalance,
            projectedBalance,
            totalContributions,
            totalEmployerMatch,
            totalGrowth: projectedBalance - currentBalance - totalContributions - totalEmployerMatch,
            finalSalary,
            recommendedRetirementIncome,
            monthlyRetirementIncome,
            sustainableAnnualIncome,
            sustainableMonthlyIncome,
            replacementRatio: (sustainableAnnualIncome / finalSalary) * 100,
            shortfall: Math.max(0, recommendedRetirementIncome - sustainableAnnualIncome),
            yearlyProjections: yearlyProjections.filter((_, index) => index % 5 === 0 || index === yearlyProjections.length - 1),
            calculationType: 'retirement'
        };
    }

    // ===== REFINANCE CALCULATOR =====
    async calculateRefinance(data) {
        const currentBalance = parseFloat(data.currentBalance);
        const currentRate = parseFloat(data.currentRate) / 100;
        const currentTerm = parseFloat(data.currentTerm);
        const newRate = parseFloat(data.newRate) / 100;
        const newTerm = parseInt(data.newTerm);
        const closingCosts = parseFloat(data.closingCosts) || 0;

        // Current loan calculations
        const currentMonthlyRate = currentRate / 12;
        const currentTotalPayments = currentTerm * 12;
        const currentMonthlyPayment = currentBalance * (currentMonthlyRate * Math.pow(1 + currentMonthlyRate, currentTotalPayments)) / 
                                     (Math.pow(1 + currentMonthlyRate, currentTotalPayments) - 1);
        const currentTotalCost = currentMonthlyPayment * currentTotalPayments;

        // New loan calculations
        const newMonthlyRate = newRate / 12;
        const newTotalPayments = newTerm * 12;
        const newMonthlyPayment = currentBalance * (newMonthlyRate * Math.pow(1 + newMonthlyRate, newTotalPayments)) / 
                                 (Math.pow(1 + newMonthlyRate, newTotalPayments) - 1);
        const newTotalCost = newMonthlyPayment * newTotalPayments + closingCosts;

        // Savings calculations
        const monthlySavings = currentMonthlyPayment - newMonthlyPayment;
        const totalSavings = currentTotalCost - newTotalCost;
        const breakEvenMonths = closingCosts / monthlySavings;

        return {
            currentLoan: {
                balance: currentBalance,
                rate: currentRate * 100,
                monthlyPayment: currentMonthlyPayment,
                totalCost: currentTotalCost,
                remainingTerm: currentTerm
            },
            newLoan: {
                balance: currentBalance,
                rate: newRate * 100,
                monthlyPayment: newMonthlyPayment,
                totalCost: newTotalCost,
                term: newTerm,
                closingCosts
            },
            savings: {
                monthlyPayment: monthlySavings,
                totalCost: totalSavings,
                breakEvenMonths: Math.ceil(breakEvenMonths),
                breakEvenYears: Math.round(breakEvenMonths / 12 * 10) / 10
            },
            recommendation: totalSavings > 0 && breakEvenMonths < (newTerm * 12 * 0.5),
            calculationType: 'refinance'
        };
    }

    // ===== AMORTIZATION SCHEDULE GENERATION =====
    generateAmortizationSchedule(loanAmount, monthlyRate, totalPayments, monthsToShow = 12) {
        const schedule = [];
        let remainingBalance = loanAmount;
        
        const monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                         (Math.pow(1 + monthlyRate, totalPayments) - 1);

        for (let month = 1; month <= Math.min(monthsToShow, totalPayments); month++) {
            const interestPayment = remainingBalance * monthlyRate;
            const principalPayment = monthlyPI - interestPayment;
            remainingBalance -= principalPayment;

            schedule.push({
                month,
                payment: monthlyPI,
                principal: principalPayment,
                interest: interestPayment,
                balance: Math.max(0, remainingBalance)
            });
        }

        return schedule;
    }

    // ===== FORM DATA HANDLING =====
    getFormData(calculatorId) {
        const form = document.getElementById(`${calculatorId}-form`);
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Handle radio buttons
        const radioInputs = form.querySelectorAll('input[type="radio"]:checked');
        radioInputs.forEach(radio => {
            data[radio.name] = radio.value;
        });

        return data;
    }

    validateFormData(calculatorId, data) {
        const calculator = this.calculators.get(calculatorId);
        if (!calculator) return { isValid: false, errors: ['Calculator not found'] };

        const errors = [];

        calculator.inputs.forEach(input => {
            if (input.required && (!data[input.id] || data[input.id].trim() === '')) {
                errors.push(`${input.label} is required`);
            }

            if (data[input.id] && input.type === 'currency') {
                const value = parseFloat(data[input.id]);
                if (isNaN(value) || value < 0) {
                    errors.push(`${input.label} must be a valid positive number`);
                }
            }

            if (data[input.id] && input.type === 'percentage') {
                const value = parseFloat(data[input.id]);
                if (isNaN(value) || value < 0 || value > 100) {
                    errors.push(`${input.label} must be between 0 and 100`);
                }
            }
        });

        // Specific validation for each calculator
        switch (calculatorId) {
            case 'mortgage-calculator':
                if (data.homePrice && data.downPayment) {
                    const homePrice = parseFloat(data.homePrice);
                    const downPayment = parseFloat(data.downPayment);
                    if (downPayment >= homePrice) {
                        errors.push('Down payment cannot be greater than or equal to home price');
                    }
                }
                break;
                
            case 'retirement-calculator':
                if (data.currentAge && data.retirementAge) {
                    const currentAge = parseInt(data.currentAge);
                    const retirementAge = parseInt(data.retirementAge);
                    if (retirementAge <= currentAge) {
                        errors.push('Retirement age must be greater than current age');
                    }
                }
                break;
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // ===== RESULTS DISPLAY =====
    displayResults(calculatorId, results) {
        const resultsContainer = document.getElementById(`${calculatorId}-results`);
        const resultsContent = document.getElementById(`${calculatorId}-results-content`);
        
        if (!resultsContainer || !resultsContent) return;

        let html = '';

        switch (results.calculationType) {
            case 'mortgage':
                html = this.generateMortgageResults(results);
                break;
            case 'auto':
                html = this.generateAutoLoanResults(results);
                break;
            case 'investment':
                html = this.generateInvestmentResults(results);
                break;
            case 'creditCard':
                html = this.generateCreditCardResults(results);
                break;
            case 'retirement':
                html = this.generateRetirementResults(results);
                break;
            case 'refinance':
                html = this.generateRefinanceResults(results);
                break;
        }

        resultsContent.innerHTML = html;
        resultsContainer.classList.remove('hidden');
        
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Store results for email functionality
        this.currentCalculation = { calculatorId, results };
    }

    generateMortgageResults(results) {
        return `
            <div class="result-card primary">
                <div class="result-header">
                    <div>
                        <div class="result-value large">$${this.formatNumber(results.monthlyPayment.total)}</div>
                        <div class="result-label">Total Monthly Payment</div>
                    </div>
                    <div class="result-icon">
                        <i class="fas fa-home"></i>
                    </div>
                </div>
            </div>

            <div class="result-breakdown">
                <div class="breakdown-item">
                    <span class="breakdown-label">Principal & Interest</span>
                    <span class="breakdown-value">$${this.formatNumber(results.monthlyPayment.principalInterest)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Property Taxes</span>
                    <span class="breakdown-value">$${this.formatNumber(results.monthlyPayment.propertyTax)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Home Insurance</span>
                    <span class="breakdown-value">$${this.formatNumber(results.monthlyPayment.insurance)}</span>
                </div>
                ${results.monthlyPayment.pmi > 0 ? `
                <div class="breakdown-item">
                    <span class="breakdown-label">PMI</span>
                    <span class="breakdown-value">$${this.formatNumber(results.monthlyPayment.pmi)}</span>
                </div>
                ` : ''}
                ${results.monthlyPayment.hoa > 0 ? `
                <div class="breakdown-item">
                    <span class="breakdown-label">HOA Fees</span>
                    <span class="breakdown-value">$${this.formatNumber(results.monthlyPayment.hoa)}</span>
                </div>
                ` : ''}
                <div class="breakdown-item">
                    <span class="breakdown-label">Total Monthly Payment</span>
                    <span class="breakdown-value">$${this.formatNumber(results.monthlyPayment.total)}</span>
                </div>
            </div>

            <div class="result-card">
                <h5><i class="fas fa-chart-bar"></i> Loan Summary</h5>
                <div class="breakdown-item">
                    <span class="breakdown-label">Loan Amount</span>
                    <span class="breakdown-value">$${this.formatNumber(results.loanAmount)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Down Payment (${results.downPaymentPercent}%)</span>
                    <span class="breakdown-value">$${this.formatNumber(results.downPayment)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Total Interest Paid</span>
                    <span class="breakdown-value">$${this.formatNumber(results.loanSummary.totalInterest)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Total Cost of Home</span>
                    <span class="breakdown-value">$${this.formatNumber(results.loanSummary.totalCost)}</span>
                </div>
            </div>

            ${results.amortizationSchedule.length > 0 ? `
            <div class="result-card">
                <h5><i class="fas fa-table"></i> First Year Payment Schedule</h5>
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th>Payment</th>
                            <th>Principal</th>
                            <th>Interest</th>
                            <th>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.amortizationSchedule.map(payment => `
                            <tr>
                                <td>${payment.month}</td>
                                <td>$${this.formatNumber(payment.payment)}</td>
                                <td>$${this.formatNumber(payment.principal)}</td>
                                <td>$${this.formatNumber(payment.interest)}</td>
                                <td>$${this.formatNumber(payment.balance)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
        `;
    }

    generateAutoLoanResults(results) {
        return `
            <div class="result-card primary">
                <div class="result-header">
                    <div>
                        <div class="result-value large">$${this.formatNumber(results.monthlyPayment)}</div>
                        <div class="result-label">Monthly Payment</div>
                    </div>
                    <div class="result-icon">
                        <i class="fas fa-car"></i>
                    </div>
                </div>
            </div>

            <div class="result-breakdown">
                <div class="breakdown-item">
                    <span class="breakdown-label">Vehicle Price</span>
                    <span class="breakdown-value">$${this.formatNumber(results.vehiclePrice)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Down Payment</span>
                    <span class="breakdown-value">$${this.formatNumber(results.downPayment)}</span>
                </div>
                ${results.tradeInValue > 0 ? `
                <div class="breakdown-item">
                    <span class="breakdown-label">Trade-in Value</span>
                    <span class="breakdown-value">$${this.formatNumber(results.tradeInValue)}</span>
                </div>
                ` : ''}
                <div class="breakdown-item">
                    <span class="breakdown-label">Sales Tax</span>
                    <span class="breakdown-value">$${this.formatNumber(results.salesTaxAmount)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Additional Fees</span>
                    <span class="breakdown-value">$${this.formatNumber(results.additionalFees)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Loan Amount</span>
                    <span class="breakdown-value">$${this.formatNumber(results.loanAmount)}</span>
                </div>
            </div>

            <div class="result-card">
                <h5><i class="fas fa-calculator"></i> Loan Details</h5>
                <div class="breakdown-item">
                    <span class="breakdown-label">Interest Rate</span>
                    <span class="breakdown-value">${results.interestRate.toFixed(2)}%</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Loan Term</span>
                    <span class="breakdown-value">${results.loanTermMonths} months</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Total Interest</span>
                    <span class="breakdown-value">$${this.formatNumber(results.totalInterest)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Total Cost of Vehicle</span>
                    <span class="breakdown-value">$${this.formatNumber(results.totalOfPayments)}</span>
                </div>
            </div>
        `;
    }

    generateInvestmentResults(results) {
        return `
            <div class="result-card primary">
                <div class="result-header">
                    <div>
                        <div class="result-value large">$${this.formatNumber(results.futureValue)}</div>
                        <div class="result-label">Future Value</div>
                    </div>
                    <div class="result-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                </div>
            </div>

            <div class="result-breakdown">
                <div class="breakdown-item">
                    <span class="breakdown-label">Total Contributions</span>
                    <span class="breakdown-value">$${this.formatNumber(results.totalContributions)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Investment Gains</span>
                    <span class="breakdown-value">$${this.formatNumber(results.totalGains)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Taxes on Gains</span>
                    <span class="breakdown-value">$${this.formatNumber(results.taxesOwed)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">After-Tax Value</span>
                    <span class="breakdown-value">$${this.formatNumber(results.afterTaxValue)}</span>
                </div>
            </div>

            <div class="result-card">
                <h5><i class="fas fa-info-circle"></i> Inflation-Adjusted Analysis</h5>
                <div class="breakdown-item">
                    <span class="breakdown-label">Real Value (Today's Dollars)</span>
                    <span class="breakdown-value">$${this.formatNumber(results.realValue)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Real Gains</span>
                    <span class="breakdown-value">$${this.formatNumber(results.realGains)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Effective Annual Return</span>
                    <span class="breakdown-value">${results.effectiveReturn.toFixed(2)}%</span>
                </div>
            </div>

            ${results.yearlyBreakdown.length > 0 ? `
            <div class="result-card">
                <h5><i class="fas fa-calendar"></i> Growth Projection (Every 5 Years)</h5>
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>Year</th>
                            <th>Contributions</th>
                            <th>Investment Gains</th>
                            <th>Total Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.yearlyBreakdown.filter((_, i) => i % 5 === 0 || i === results.yearlyBreakdown.length - 1).map(year => `
                            <tr>
                                <td>${year.year}</td>
                                <td>$${this.formatNumber(year.contributions)}</td>
                                <td>$${this.formatNumber(year.gains)}</td>
                                <td>$${this.formatNumber(year.balance)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
        `;
    }

    generateCreditCardResults(results) {
        const monthsDisplay = results.monthsToPayoff === 'Never (payment too low)' 
            ? results.monthsToPayoff 
            : `${results.monthsToPayoff} months (${Math.round(results.monthsToPayoff / 12 * 10) / 10} years)`;

        return `
            <div class="result-card primary">
                <div class="result-header">
                    <div>
                        <div class="result-value">$${this.formatNumber(results.monthlyPayment)}</div>
                        <div class="result-label">${results.paymentType}</div>
                    </div>
                    <div class="result-icon">
                        <i class="fas fa-credit-card"></i>
                    </div>
                </div>
            </div>

            <div class="result-breakdown">
                <div class="breakdown-item">
                    <span class="breakdown-label">Time to Pay Off</span>
                    <span class="breakdown-value">${monthsDisplay}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Total Interest Paid</span>
                    <span class="breakdown-value">$${this.formatNumber(results.totalInterest)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Total Amount Paid</span>
                    <span class="breakdown-value">$${this.formatNumber(results.totalPaid)}</span>
                </div>
            </div>

            ${results.comparison ? `
            <div class="result-card">
                <h5><i class="fas fa-compare"></i> Comparison with Minimum Payments</h5>
                <div class="breakdown-item">
                    <span class="breakdown-label">Interest Savings</span>
                    <span class="breakdown-value ${results.comparison.interestSavings > 0 ? 'success' : ''}">
                        $${this.formatNumber(results.comparison.interestSavings)}
                    </span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Time Savings</span>
                    <span class="breakdown-value ${results.comparison.timeSavings > 0 ? 'success' : ''}">
                        ${results.comparison.timeSavings} months
                    </span>
                </div>
            </div>
            ` : ''}

            ${results.schedule.length > 0 ? `
            <div class="result-card">
                <h5><i class="fas fa-calendar"></i> Payment Schedule (First Year)</h5>
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th>Payment</th>
                            <th>Interest</th>
                            <th>Principal</th>
                            <th>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.schedule.filter(p => p.month <= 12).map(payment => `
                            <tr>
                                <td>${payment.month}</td>
                                <td>$${this.formatNumber(payment.payment)}</td>
                                <td>$${this.formatNumber(payment.interest)}</td>
                                <td>$${this.formatNumber(payment.principal)}</td>
                                <td>$${this.formatNumber(payment.balance)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
        `;
    }

    generateRetirementResults(results) {
        return `
            <div class="result-card primary">
                <div class="result-header">
                    <div>
                        <div class="result-value large">$${this.formatNumber(results.projectedBalance)}</div>
                        <div class="result-label">Projected 401k Balance at Retirement</div>
                    </div>
                    <div class="result-icon">
                        <i class="fas fa-piggy-bank"></i>
                    </div>
                </div>
            </div>

            <div class="result-breakdown">
                <div class="breakdown-item">
                    <span class="breakdown-label">Current Balance</span>
                    <span class="breakdown-value">$${this.formatNumber(results.currentBalance)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Your Contributions</span>
                    <span class="breakdown-value">$${this.formatNumber(results.totalContributions)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Employer Match</span>
                    <span class="breakdown-value">$${this.formatNumber(results.totalEmployerMatch)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Investment Growth</span>
                    <span class="breakdown-value">$${this.formatNumber(results.totalGrowth)}</span>
                </div>
            </div>

            <div class="result-card">
                <h5><i class="fas fa-hand-holding-usd"></i> Retirement Income Analysis</h5>
                <div class="breakdown-item">
                    <span class="breakdown-label">Final Salary</span>
                    <span class="breakdown-value">$${this.formatNumber(results.finalSalary)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Recommended Retirement Income (80%)</span>
                    <span class="breakdown-value">$${this.formatNumber(results.recommendedRetirementIncome)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Sustainable Annual Income (4% rule)</span>
                    <span class="breakdown-value">$${this.formatNumber(results.sustainableAnnualIncome)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Monthly Retirement Income</span>
                    <span class="breakdown-value">$${this.formatNumber(results.sustainableMonthlyIncome)}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Income Replacement Ratio</span>
                    <span class="breakdown-value ${results.replacementRatio >= 80 ? 'success' : 'warning'}">
                        ${results.replacementRatio.toFixed(1)}%
                    </span>
                </div>
                ${results.shortfall > 0 ? `
                <div class="breakdown-item">
                    <span class="breakdown-label">Annual Shortfall</span>
                    <span class="breakdown-value warning">$${this.formatNumber(results.shortfall)}</span>
                </div>
                ` : ''}
            </div>

            ${results.yearlyProjections.length > 0 ? `
            <div class="result-card">
                <h5><i class="fas fa-chart-line"></i> 401k Growth Projection</h5>
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>Year</th>
                            <th>Age</th>
                            <th>Salary</th>
                            <th>Your Contribution</th>
                            <th>Employer Match</th>
                            <th>Account Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.yearlyProjections.map(year => `
                            <tr>
                                <td>${year.year}</td>
                                <td>${year.age}</td>
                                <td>$${this.formatNumber(year.salary)}</td>
                                <td>$${this.formatNumber(year.employeeContribution)}</td>
                                <td>$${this.formatNumber(year.employerMatch)}</td>
                                <td>$${this.formatNumber(year.balance)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
        `;
    }

    generateRefinanceResults(results) {
        const recommendation = results.recommendation 
            ? '<span class="success">✓ Refinancing is recommended</span>'
            : '<span class="warning">⚠ Consider if refinancing is worth it</span>';

        return `
            <div class="result-card primary">
                <div class="result-header">
                    <div>
                        <div class="result-value">$${this.formatNumber(Math.abs(results.savings.monthlyPayment))}</div>
                        <div class="result-label">
                            ${results.savings.monthlyPayment > 0 ? 'Monthly Savings' : 'Monthly Increase'}
                        </div>
                    </div>
                    <div class="result-icon">
                        <i class="fas fa-exchange-alt"></i>
                    </div>
                </div>
            </div>

            <div class="result-card">
                <h5><i class="fas fa-thumbs-up"></i> Recommendation</h5>
                <div style="text-align: center; font-size: 18px; padding: 10px;">
                    ${recommendation}
                </div>
            </div>

            <div class="result-breakdown">
                <div class="breakdown-item">
                    <span class="breakdown-label">Monthly Payment Savings</span>
                    <span class="breakdown-value ${results.savings.monthlyPayment > 0 ? 'success' : 'warning'}">
                        ${results.savings.monthlyPayment > 0 ? '+' : ''}$${this.formatNumber(results.savings.monthlyPayment)}
                    </span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Total Cost Savings</span>
                    <span class="breakdown-value ${results.savings.totalCost > 0 ? 'success' : 'warning'}">
                        ${results.savings.totalCost > 0 ? '+' : ''}$${this.formatNumber(results.savings.totalCost)}
                    </span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Break-even Time</span>
                    <span class="breakdown-value">
                        ${results.savings.breakEvenMonths} months (${results.savings.breakEvenYears} years)
                    </span>
                </div>
            </div>

            <div class="result-card">
                <h5><i class="fas fa-balance-scale"></i> Current vs New Loan Comparison</h5>
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Current Loan</th>
                            <th>New Loan</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Interest Rate</td>
                            <td>${results.currentLoan.rate.toFixed(2)}%</td>
                            <td>${results.newLoan.rate.toFixed(2)}%</td>
                        </tr>
                        <tr>
                            <td>Monthly Payment</td>
                            <td>$${this.formatNumber(results.currentLoan.monthlyPayment)}</td>
                            <td>$${this.formatNumber(results.newLoan.monthlyPayment)}</td>
                        </tr>
                        <tr>
                            <td>Remaining Term</td>
                            <td>${results.currentLoan.remainingTerm} years</td>
                            <td>${results.newLoan.term} years</td>
                        </tr>
                        <tr>
                            <td>Total Cost</td>
                            <td>$${this.formatNumber(results.currentLoan.totalCost)}</td>
                            <td>$${this.formatNumber(results.newLoan.totalCost)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    // ===== CONTINUE IN NEXT MESSAGE =====
    // This file is getting very long. Shall I continue with the remaining functions?
}
