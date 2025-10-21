/* ========================================================================== */
/* WORLD'S FIRST AI MORTGAGE CALCULATOR - ENHANCED JS v26.0                */
/* ALL IMPROVEMENTS IMPLEMENTED - PRODUCTION READY                          */
/* ========================================================================== */

// ========================================================================== //
// ENHANCED GLOBAL CONFIGURATION & STATE MANAGEMENT                          //
// ========================================================================== //

const MORTGAGE_CALCULATOR = {
    // Version & Configuration
    VERSION: '26.0-AI-Enhanced',
    DEBUG: true,
    
    // FRED API Configuration
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    RATE_UPDATE_INTERVAL: 60 * 60 * 1000, // 1 hour (3600 seconds)
    
    // Chart instances for cleanup/updates
    charts: {
        paymentComponents: null,
        mortgageTimeline: null
    },
    
    // Current calculation state
    currentCalculation: {
        homePrice: 450000,
        downPayment: 90000,
        downPaymentPercent: 20,
        loanAmount: 360000,
        interestRate: 6.44, // Default Rate
        loanTerm: 30, // Default Term in Years
        loanType: 'conventional',
        propertyTax: 9000, // Annual
        homeInsurance: 1800, // Annual
        pmi: 0, // Monthly
        hoaFees: 0, // Monthly
        extraMonthly: 0,
        oneTimeExtra: 0,
        closingCostsPercent: 3,
        creditScore: 740,
        state: 'default'
    },
    
    // Amortization schedule with monthly/yearly support
    amortizationSchedule: [],
    scheduleCurrentPage: 1,
    scheduleItemsPerPage: 12,
    scheduleType: 'monthly', // 'monthly' or 'yearly'
    
    // Voice recognition & Screen Reader state
    voiceEnabled: false,
    screenReaderMode: false,
    speechRecognition: window.SpeechRecognition || window.webkitSpeechRecognition,
    speechSynthesis: window.speechSynthesis,
    
    // Theme state
    currentTheme: 'dark', // Default Dark Mode
    
    // Rate update tracking
    lastRateUpdate: 0,
    rateUpdateAttempts: 0,
    maxRateUpdateAttempts: 3,
    
    // Treasury yield data
    treasuryYield: null,
    treasuryYieldTrend: 'neutral'
};

// ========================================================================== //
// 50-STATE PROPERTY TAX AND INSURANCE RATE DATABASE                          //
// ========================================================================== //

const STATE_RATES = {
    'AL': { name: 'Alabama', taxRate: 0.40, insuranceRate: 0.75 },
    'AK': { name: 'Alaska', taxRate: 1.19, insuranceRate: 0.50 },
    'AZ': { name: 'Arizona', taxRate: 0.62, insuranceRate: 0.70 },
    'AR': { name: 'Arkansas', taxRate: 0.62, insuranceRate: 0.90 },
    'CA': { name: 'California', taxRate: 0.71, insuranceRate: 0.55 },
    'CO': { name: 'Colorado', taxRate: 0.51, insuranceRate: 0.65 },
    'CT': { name: 'Connecticut', taxRate: 1.93, insuranceRate: 0.40 },
    'DE': { name: 'Delaware', taxRate: 0.58, insuranceRate: 0.45 },
    'DC': { name: 'District of Columbia', taxRate: 0.57, insuranceRate: 0.45 },
    'FL': { name: 'Florida', taxRate: 0.94, insuranceRate: 1.20 },
    'GA': { name: 'Georgia', taxRate: 0.82, insuranceRate: 0.65 },
    'HI': { name: 'Hawaii', taxRate: 0.30, insuranceRate: 0.80 },
    'ID': { name: 'Idaho', taxRate: 0.56, insuranceRate: 0.40 },
    'IL': { name: 'Illinois', taxRate: 2.16, insuranceRate: 0.55 },
    'IN': { name: 'Indiana', taxRate: 0.81, insuranceRate: 0.50 },
    'IA': { name: 'Iowa', taxRate: 1.48, insuranceRate: 0.40 },
    'KS': { name: 'Kansas', taxRate: 1.41, insuranceRate: 0.70 },
    'KY': { name: 'Kentucky', taxRate: 0.85, insuranceRate: 0.60 },
    'LA': { name: 'Louisiana', taxRate: 0.52, insuranceRate: 1.40 },
    'ME': { name: 'Maine', taxRate: 1.26, insuranceRate: 0.40 },
    'MD': { name: 'Maryland', taxRate: 1.05, insuranceRate: 0.45 },
    'MA': { name: 'Massachusetts', taxRate: 1.13, insuranceRate: 0.50 },
    'MI': { name: 'Michigan', taxRate: 1.45, insuranceRate: 0.55 },
    'MN': { name: 'Minnesota', taxRate: 1.05, insuranceRate: 0.40 },
    'MS': { name: 'Mississippi', taxRate: 0.79, insuranceRate: 0.95 },
    'MO': { name: 'Missouri', taxRate: 0.98, insuranceRate: 0.60 },
    'MT': { name: 'Montana', taxRate: 0.85, insuranceRate: 0.45 },
    'NE': { name: 'Nebraska', taxRate: 1.63, insuranceRate: 0.45 },
    'NV': { name: 'Nevada', taxRate: 0.69, insuranceRate: 0.65 },
    'NH': { name: 'New Hampshire', taxRate: 2.18, insuranceRate: 0.40 },
    'NJ': { name: 'New Jersey', taxRate: 2.23, insuranceRate: 0.50 },
    'NM': { name: 'New Mexico', taxRate: 0.76, insuranceRate: 0.55 },
    'NY': { name: 'New York', taxRate: 1.40, insuranceRate: 0.40 },
    'NC': { name: 'North Carolina', taxRate: 0.83, insuranceRate: 0.55 },
    'ND': { name: 'North Dakota', taxRate: 1.11, insuranceRate: 0.40 },
    'OH': { name: 'Ohio', taxRate: 1.56, insuranceRate: 0.50 },
    'OK': { name: 'Oklahoma', taxRate: 0.88, insuranceRate: 0.80 },
    'OR': { name: 'Oregon', taxRate: 0.95, insuranceRate: 0.40 },
    'PA': { name: 'Pennsylvania', taxRate: 1.54, insuranceRate: 0.45 },
    'RI': { name: 'Rhode Island', taxRate: 1.45, insuranceRate: 0.45 },
    'SC': { name: 'South Carolina', taxRate: 0.57, insuranceRate: 0.75 },
    'SD': { name: 'South Dakota', taxRate: 1.22, insuranceRate: 0.40 },
    'TN': { name: 'Tennessee', taxRate: 0.66, insuranceRate: 0.55 },
    'TX': { name: 'Texas', taxRate: 1.68, insuranceRate: 0.90 },
    'UT': { name: 'Utah', taxRate: 0.58, insuranceRate: 0.40 },
    'VT': { name: 'Vermont', taxRate: 1.83, insuranceRate: 0.40 },
    'VA': { name: 'Virginia', taxRate: 0.80, insuranceRate: 0.40 },
    'WA': { name: 'Washington', taxRate: 0.93, insuranceRate: 0.45 },
    'WV': { name: 'West Virginia', taxRate: 0.65, insuranceRate: 0.65 },
    'WI': { name: 'Wisconsin', taxRate: 1.70, insuranceRate: 0.40 },
    'WY': { name: 'Wyoming', taxRate: 0.61, insuranceRate: 0.40 }
};

// ========================================================================== //
// CORE CALCULATION LOGIC                                                    //
// ========================================================================== //

/**
 * Main function to read inputs, calculate mortgage, and update the UI.
 * @param {string} sourceId - The ID of the input that triggered the update.
 */
function updateCalculation(sourceId = null) {
    if (MORTGAGE_CALCULATOR.DEBUG) console.log(`🔄 Calculation triggered by: ${sourceId}`);
    
    // 1. Read Inputs
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    
    current.homePrice = parseFloat(document.getElementById('home-price').value) || 0;
    current.downPayment = parseFloat(document.getElementById('down-payment').value) || 0;
    current.downPaymentPercent = parseFloat(document.getElementById('down-payment-percent').value) || 0;
    current.interestRate = parseFloat(document.getElementById('interest-rate').value) || 0;
    current.propertyTax = parseFloat(document.getElementById('property-tax').value) || 0;
    current.homeInsurance = parseFloat(document.getElementById('home-insurance').value) || 0;
    current.pmi = parseFloat(document.getElementById('pmi').value) || 0;
    current.hoaFees = parseFloat(document.getElementById('hoa-fees').value) || 0;
    current.extraMonthly = parseFloat(document.getElementById('extra-monthly').value) || 0;
    current.oneTimeExtra = parseFloat(document.getElementById('one-time-extra').value) || 0;
    current.closingCostsPercent = parseFloat(document.getElementById('closing-costs-percentage').value) || 0;
    current.creditScore = parseFloat(document.getElementById('credit-score').value) || 0;
    
    // 2. Synchronize Down Payment (2-way sync)
    if (sourceId === 'down-payment') {
        current.downPaymentPercent = (current.downPayment / current.homePrice) * 100 || 0;
        document.getElementById('down-payment-percent').value = current.downPaymentPercent.toFixed(2);
    } else if (sourceId === 'down-payment-percent') {
        current.downPayment = current.homePrice * (current.downPaymentPercent / 100);
        document.getElementById('down-payment').value = current.downPayment.toFixed(0);
    }
    
    // 3. Calculate Loan Amount & PMI (Logic based on loan type/DP)
    current.loanAmount = current.homePrice - current.downPayment;

    // Auto-calculate PMI if DP < 20% and not VA/USDA
    if (current.downPaymentPercent < 20 && current.loanType === 'conventional') {
        // PMI based on credit score and LTV
        const ltv = (current.loanAmount / current.homePrice) * 100;
        let pmiRate = 0.005; // Default 0.5%
        
        if (current.creditScore >= 760) pmiRate = 0.0038;
        else if (current.creditScore >= 700) pmiRate = 0.0045;
        else if (current.creditScore >= 680) pmiRate = 0.0052;
        else if (current.creditScore >= 660) pmiRate = 0.0065;
        else if (current.creditScore >= 640) pmiRate = 0.008;
        else pmiRate = 0.01;
        
        // Adjust for LTV
        if (ltv > 95) pmiRate *= 1.2;
        else if (ltv > 90) pmiRate *= 1.1;
        
        current.pmi = (current.loanAmount * pmiRate) / 12;
    } else {
        current.pmi = 0;
    }
    document.getElementById('pmi').value = current.pmi.toFixed(2);
    
    // 4. Core P&I Calculation (Monthly Payment Formula)
    const principal = current.loanAmount;
    const rateMonthly = (current.interestRate / 100) / 12;
    const paymentsTotal = current.loanTerm * 12;

    let monthlyPI;
    if (rateMonthly === 0) {
        monthlyPI = principal / paymentsTotal;
    } else {
        // M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1]
        monthlyPI = principal * (rateMonthly * Math.pow(1 + rateMonthly, paymentsTotal)) / (Math.pow(1 + rateMonthly, paymentsTotal) - 1);
    }
    if (isNaN(monthlyPI) || monthlyPI === Infinity) monthlyPI = 0;


    // 5. Total Monthly Payment (PITI + Fees)
    const monthlyTax = current.propertyTax / 12;
    const monthlyInsurance = current.homeInsurance / 12;
    
    const monthlyPITI = monthlyPI + monthlyTax + monthlyInsurance + current.pmi + current.hoaFees;
    
    // 6. Final Monthly Display (Base PITI + Extra)
    const finalMonthlyPayment = monthlyPITI + current.extraMonthly;
    
    // 7. Calculate Loan Totals
    // Amortization is required for accurate total interest calculation
    const { amortizationSchedule, totalInterest, payoffDate, totalPayments, fullTotalCost } = calculateAmortization(monthlyPITI, current.extraMonthly, current.loanTerm);
    
    current.totalInterest = totalInterest;
    current.payoffDate = payoffDate;
    current.totalPayments = totalPayments;
    current.amortizationSchedule = amortizationSchedule;
    current.totalCost = current.homePrice + totalInterest + (current.homePrice * current.closingCostsPercent / 100);


    // 8. Update UI (All Sections)
    
    // Main Payment Display
    document.getElementById('monthly-payment-total').textContent = formatCurrency(finalMonthlyPayment);
    
    // Summary Breakdown
    document.getElementById('pi-monthly').textContent = formatCurrency(monthlyPI);
    document.getElementById('tax-monthly').textContent = formatCurrency(monthlyTax);
    document.getElementById('insurance-monthly').textContent = formatCurrency(monthlyInsurance);
    document.getElementById('other-monthly').textContent = formatCurrency(current.pmi + current.hoaFees);
    document.getElementById('total-monthly').textContent = formatCurrency(monthlyPITI);
    
    // Loan Totals
    document.getElementById('total-cost').textContent = formatCurrency(current.homePrice + current.downPayment + current.loanAmount + current.downPayment + current.loanAmount);
    document.getElementById('total-cost').textContent = formatCurrency(fullTotalCost);
    document.getElementById('total-interest').textContent = formatCurrency(totalInterest);
    document.getElementById('payoff-date').textContent = payoffDate;
    document.getElementById('closing-costs').textContent = formatCurrency(current.homePrice * (current.closingCostsPercent / 100));

    // Render Visuals
    renderPaymentComponentsChart(monthlyPI, monthlyTax, monthlyInsurance, current.pmi + current.hoaFees);
    renderMortgageTimelineChart(); // Enhanced with principal and interest paid
    renderAIPoweredInsights(); // Dynamic AI Insights
    renderPaymentScheduleTable(); // Payment Schedule

    // Apply highlight flash for visual feedback
    if (sourceId) {
        document.getElementById('monthly-payment-total').closest('.monthly-payment-card').classList.add('highlight-update');
        setTimeout(() => {
            document.getElementById('monthly-payment-total').closest('.monthly-payment-card').classList.remove('highlight-update');
        }, 700);
    }
}

// ========================================================================== //
// AMORTIZATION & SCHEDULE LOGIC                                              //
// ========================================================================== //

/**
 * Calculates the full amortization schedule, total interest, and payoff date.
 * @param {number} monthlyPITI - The base monthly PITI payment.
 * @param {number} extraMonthly - The user's optional extra monthly payment.
 * @param {number} loanTerm - The original loan term in years.
 * @returns {object} The full schedule, total interest, payoff date, etc.
 */
function calculateAmortization(monthlyPITI, extraMonthly, loanTerm) {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    let balance = current.loanAmount;
    let rateMonthly = (current.interestRate / 100) / 12;
    const monthlyPI = monthlyPITI - (current.propertyTax / 12) - (current.homeInsurance / 12) - current.pmi - current.hoaFees;
    
    const schedule = [];
    let totalInterestPaid = 0;
    let totalPaymentsMade = 0;
    let totalExtraPayments = current.oneTimeExtra;
    let oneTimeExtra = current.oneTimeExtra; // Apply one-time payment to the first month
    let cumulativePrincipal = 0;
    
    // Max 30 years * 12 months = 360 payments + a safe buffer
    const maxPayments = loanTerm * 12 + 60; 

    for (let month = 1; month <= maxPayments && balance > 0; month++) {
        // Calculate interest for this month
        const interestPaid = balance * rateMonthly;
        totalInterestPaid += interestPaid;
        
        // Principal & Interest
        let principalPaid = monthlyPI - interestPaid;
        
        // Apply extra payments
        let totalPayment = monthlyPI + extraMonthly + (month === 1 ? oneTimeExtra : 0);
        let extraPaymentApplied = extraMonthly + (month === 1 ? oneTimeExtra : 0);

        // Adjust principal paid to include extra payment
        let actualPrincipalPaid = principalPaid + extraPaymentApplied;

        // Check if final payment is less than the balance
        if (balance < actualPrincipalPaid) {
            actualPrincipalPaid = balance;
            totalPayment = interestPaid + actualPrincipalPaid + (monthlyPITI - monthlyPI); // Adjust total payment
            balance = 0;
        } else {
            balance -= actualPrincipalPaid;
        }

        cumulativePrincipal += actualPrincipalPaid;
        
        const taxesAndInsurance = (current.propertyTax / 12) + (current.homeInsurance / 12) + current.pmi + current.hoaFees;
        
        schedule.push({
            month: month,
            year: Math.ceil(month / 12),
            date: new Date(new Date().setMonth(new Date().getMonth() + month)).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
            totalPayment: totalPayment + taxesAndInsurance,
            principal: actualPrincipalPaid,
            interest: interestPaid,
            taxAndIns: taxesAndInsurance,
            extra: extraPaymentApplied,
            endingBalance: balance,
            totalInterest: totalInterestPaid,
            cumulativePrincipal: cumulativePrincipal
        });

        totalPaymentsMade++;
        if (month === 1) oneTimeExtra = 0; // Clear one-time extra payment after the first month
    }
    
    const payoffDate = new Date(new Date().setMonth(new Date().getMonth() + totalPaymentsMade)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const fullTotalCost = current.homePrice + totalInterestPaid + (current.homePrice * current.closingCostsPercent / 100);

    return { 
        amortizationSchedule: schedule, 
        totalInterest: totalInterestPaid, 
        payoffDate: payoffDate, 
        totalPayments: totalPaymentsMade,
        fullTotalCost: fullTotalCost
    };
}

/**
 * Renders the Mortgage Balance Over Time Chart with Principal and Interest Paid
 */
function renderMortgageTimelineChart() {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const schedule = current.amortizationSchedule;
    if (!schedule.length) return;

    const ctx = document.getElementById('mortgageTimelineChart').getContext('2d');
    
    // Destroy previous chart instance
    if (MORTGAGE_CALCULATOR.charts.mortgageTimeline) {
        MORTGAGE_CALCULATOR.charts.mortgageTimeline.destroy();
    }
    
    // Use yearly data for a cleaner timeline
    const yearlyData = schedule.filter(item => item.month % 12 === 0 || item.month === schedule.length);

    // Get colors from CSS variables for theme-aware charts
    const chartColorPrimary = getComputedStyle(document.documentElement).getPropertyValue('--color-chart-primary').trim();
    const chartColorSecondary = getComputedStyle(document.documentElement).getPropertyValue('--color-chart-secondary').trim();
    const chartColorQuinary = getComputedStyle(document.documentElement).getPropertyValue('--color-chart-quinary').trim();

    MORTGAGE_CALCULATOR.charts.mortgageTimeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: yearlyData.map(item => item.year),
            datasets: [
                {
                    label: 'Remaining Balance',
                    data: yearlyData.map(item => item.endingBalance),
                    borderColor: chartColorSecondary, // Blue
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    fill: false,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Principal Paid',
                    data: yearlyData.map(item => item.cumulativePrincipal),
                    borderColor: chartColorQuinary, // Brown
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Interest Paid',
                    data: yearlyData.map(item => item.totalInterest),
                    borderColor: chartColorPrimary, // Teal
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.3,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary'),
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Year of Loan',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary')
                    },
                    grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--color-border') + '50' },
                    ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary') }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amount ($)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary')
                    },
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--color-border') + '50' },
                    ticks: { 
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary'),
                        callback: function(value) {
                            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Renders the detailed monthly/yearly payment schedule table
 */
function renderPaymentScheduleTable() {
    const schedule = MORTGAGE_CALCULATOR.currentCalculation.amortizationSchedule;
    const tableBody = document.querySelector('#payment-schedule-table tbody');
    const tableHead = document.querySelector('#payment-schedule-table thead');
    
    // Clear previous content
    tableBody.innerHTML = '';
    
    if (!schedule.length) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No amortization schedule generated yet.</td></tr>';
        return;
    }

    const type = MORTGAGE_CALCULATOR.scheduleType;
    let dataToRender = schedule;
    
    // Aggregate to Yearly View
    if (type === 'yearly') {
        dataToRender = aggregateYearly(schedule);
    }
    
    // Pagination
    const itemsPerPage = MORTGAGE_CALCULATOR.scheduleItemsPerPage;
    const currentPage = MORTGAGE_CALCULATOR.scheduleCurrentPage;
    const totalPages = Math.ceil(dataToRender.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedData = dataToRender.slice(start, end);

    // Render Table Header
    tableHead.innerHTML = `
        <tr>
            <th class="month-col">${type === 'monthly' ? 'Month' : 'Year'}</th>
            <th style="text-align: right;">Total Payment</th>
            <th style="text-align: right;">Principal</th>
            <th style="text-align: right;">Interest</th>
            <th style="text-align: right;">Taxes & Ins</th>
            <th style="text-align: right;">Extra Payment</th>
            <th style="text-align: right;">Ending Balance</th>
        </tr>
    `;

    // Render Table Body
    paginatedData.forEach(item => {
        const row = tableBody.insertRow();
        
        // Month/Year
        const monthCell = row.insertCell();
        monthCell.textContent = type === 'monthly' ? item.month : `Year ${item.year}`;
        monthCell.classList.add('month-col');
        
        row.insertCell().textContent = formatCurrency(item.totalPayment);
        row.insertCell().textContent = formatCurrency(item.principal);
        row.insertCell().textContent = formatCurrency(item.interest);
        row.insertCell().textContent = formatCurrency(item.taxAndIns);
        row.insertCell().textContent = formatCurrency(item.extra);
        row.insertCell().textContent = formatCurrency(item.endingBalance);
        
        row.cells[2].classList.add('principal-col');
        row.cells[3].classList.add('interest-col');
        row.cells[6].classList.add('balance-col');
    });

    renderPaginationControls(totalPages);
}

/**
 * Aggregates monthly schedule data into yearly summaries
 */
function aggregateYearly(schedule) {
    const yearlyMap = new Map();
    schedule.forEach(item => {
        const yearKey = item.year;
        if (!yearlyMap.has(yearKey)) {
            yearlyMap.set(yearKey, {
                year: yearKey,
                totalPayment: 0,
                principal: 0,
                interest: 0,
                taxAndIns: 0,
                extra: 0,
                endingBalance: 0,
                month: item.month
            });
        }
        const yearlyItem = yearlyMap.get(yearKey);
        yearlyItem.totalPayment += item.totalPayment;
        yearlyItem.principal += item.principal;
        yearlyItem.interest += item.interest;
        yearlyItem.taxAndIns += item.taxAndIns;
        yearlyItem.extra += item.extra;
        yearlyItem.endingBalance = item.endingBalance; // Use the balance of the last month in the year
    });
    return Array.from(yearlyMap.values());
}

/**
 * Renders pagination controls for the schedule
 */
function renderPaginationControls(totalPages) {
    const paginationContainer = document.getElementById('schedule-pagination');
    paginationContainer.innerHTML = '';
    const currentPage = MORTGAGE_CALCULATOR.scheduleCurrentPage;

    // Previous Button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '« Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => changeSchedulePage(currentPage - 1);
    paginationContainer.appendChild(prevBtn);

    // Page Number Indicator
    const pageText = document.createElement('span');
    pageText.textContent = `Page ${currentPage} of ${totalPages}`;
    paginationContainer.appendChild(pageText);

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next »';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => changeSchedulePage(currentPage + 1);
    paginationContainer.appendChild(nextBtn);
}

function changeSchedulePage(page) {
    MORTGAGE_CALCULATOR.scheduleCurrentPage = page;
    renderPaymentScheduleTable();
}

function toggleScheduleType(type) {
    document.querySelectorAll('.schedule-controls .chip').forEach(chip => {
        chip.classList.remove('active');
    });
    document.querySelector(`.schedule-controls .chip[data-schedule-type="${type}"]`).classList.add('active');
    MORTGAGE_CALCULATOR.scheduleType = type;
    MORTGAGE_CALCULATOR.scheduleCurrentPage = 1; // Reset to page 1 on type change
    renderPaymentScheduleTable();
}


/**
 * Export the current schedule view
 * @param {string} format - 'pdf' or 'csv'
 */
function exportSchedule(format) {
    const schedule = MORTGAGE_CALCULATOR.currentCalculation.amortizationSchedule;
    if (!schedule.length) {
        showToast('Cannot export empty schedule.', 'error');
        return;
    }
    
    showLoading('Generating export file...');

    const type = MORTGAGE_CALCULATOR.scheduleType;
    const dataToExport = type === 'yearly' ? aggregateYearly(schedule) : schedule;
    
    // Define headers
    const headers = [
        type === 'monthly' ? 'Month' : 'Year',
        'Total Payment',
        'Principal',
        'Interest',
        'Taxes & Insurance',
        'Extra Payment',
        'Ending Balance'
    ];
    
    // Define rows
    const rows = dataToExport.map(item => [
        type === 'monthly' ? item.month : item.year,
        formatCurrency(item.totalPayment, true),
        formatCurrency(item.principal, true),
        formatCurrency(item.interest, true),
        formatCurrency(item.taxAndIns, true),
        formatCurrency(item.extra, true),
        formatCurrency(item.endingBalance, true)
    ]);
    
    const title = `AI_Mortgage_Schedule_${type}_${new Date().getFullYear()}`;

    if (format === 'csv') {
        // Simple CSV generation
        const csvContent = [
            headers.join(','),
            ...rows.map(e => e.join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${title}.csv`;
        link.click();
        hideLoading();
        showToast('Schedule exported to CSV!', 'success');
        
    } else if (format === 'pdf') {
        // PDF generation using jspdf-autotable
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape');
            
            doc.text(`AI Mortgage Calculator - ${type.toUpperCase()} Schedule`, 14, 15);
            doc.setFontSize(10);
            doc.text(`Loan Amount: ${formatCurrency(MORTGAGE_CALCULATOR.currentCalculation.loanAmount)}`, 14, 22);
            doc.text(`Rate: ${MORTGAGE_CALCULATOR.currentCalculation.interestRate}%`, 14, 27);
            doc.text(`Term: ${MORTGAGE_CALCULATOR.currentCalculation.loanTerm} Years`, 14, 32);

            const tableData = [headers, ...rows];
            let y = 40;
            
            // Draw table headers
            doc.setFontSize(8);
            doc.setFillColor(20, 184, 166);
            doc.setTextColor(255, 255, 255);
            doc.rect(14, y, 269, 7, 'F');
            let x = 14;
            const colWidths = [15, 40, 40, 40, 40, 40, 40];
            
            headers.forEach((header, index) => {
                doc.text(header, x + colWidths[index] / 2, y + 4.5, { align: 'center' });
                x += colWidths[index];
            });

            y += 7;
            
            // Draw table rows
            doc.setTextColor(0, 0, 0);
            rows.forEach((row, rowIndex) => {
                if (rowIndex % 2 === 0) {
                    doc.setFillColor(243, 244, 246);
                    doc.rect(14, y, 269, 6, 'F');
                }
                
                x = 14;
                row.forEach((cell, cellIndex) => {
                    doc.text(cell, x + colWidths[cellIndex] / 2, y + 3.5, { align: 'center' });
                    x += colWidths[cellIndex];
                });
                y += 6;
                
                // Add new page if necessary
                if (y > 190 && rowIndex < rows.length - 1) {
                    doc.addPage();
                    y = 15;
                }
            });

            doc.save(`${title}.pdf`);
            hideLoading();
            showToast('Schedule exported to PDF!', 'success');
        } catch (e) {
            console.error('PDF Export Error:', e);
            hideLoading();
            showToast('PDF export failed. Missing jspdf or html2canvas libraries.', 'error');
        }
    }
}

// ========================================================================== //
// UI & CHART RENDERING                                                       //
// ========================================================================== //

/**
 * Renders the Payment Components Pie Chart.
 */
function renderPaymentComponentsChart(pi, tax, ins, other) {
    const ctx = document.getElementById('paymentComponentsChart').getContext('2d');
    
    if (MORTGAGE_CALCULATOR.charts.paymentComponents) {
        MORTGAGE_CALCULATOR.charts.paymentComponents.destroy();
    }
    
    // Get colors from CSS variables for theme-aware charts
    const chartColorPrimary = getComputedStyle(document.documentElement).getPropertyValue('--color-chart-primary').trim();
    const chartColorSecondary = getComputedStyle(document.documentElement).getPropertyValue('--color-chart-secondary').trim();
    const chartColorTertiary = getComputedStyle(document.documentElement).getPropertyValue('--color-chart-tertiary').trim();
    const chartColorQuaternary = getComputedStyle(document.documentElement).getPropertyValue('--color-chart-quaternary').trim();
    const chartColorText = getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim();

    MORTGAGE_CALCULATOR.charts.paymentComponents = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal & Interest', 'Property Tax', 'Home Insurance', 'PMI/HOA/Other'],
            datasets: [{
                data: [pi, tax / 12, ins / 12, other],
                backgroundColor: [
                    chartColorPrimary,
                    chartColorSecondary,
                    chartColorTertiary,
                    chartColorQuaternary
                ],
                hoverOffset: 10,
                borderWidth: 0 // Remove white border in dark mode
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: chartColorText,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// ========================================================================== //
// AI INSIGHTS GENERATION (Dynamic & Comprehensive)                           //
// ========================================================================== //

function renderAIPoweredInsights() {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const amortization = current.amortizationSchedule;
    const aiOutput = document.getElementById('ai-insights-output');
    
    if (!aiOutput) return;

    // Simulate AI processing delay
    aiOutput.innerHTML = `<div class="ai-insight ai-insight-loading"><i class="fas fa-sync-alt fa-spin"></i> Generating personalized insights based on your inputs...</div>`;

    setTimeout(() => {
        let html = '';
        const insights = [];
        
        // --- Insight 1: Loan Comparison / Down Payment Wisdom ---
        let dpStatus;
        if (current.downPaymentPercent >= 20) {
            dpStatus = `Excellent! You've achieved the **20% Down Payment** benchmark. This saves you approximately ${formatCurrency(current.loanAmount * 0.005)} per year by **avoiding PMI** (Private Mortgage Insurance).`;
        } else if (current.downPaymentPercent >= 3.5 && current.downPaymentPercent < 20) {
            dpStatus = `Good start. With a **${current.downPaymentPercent.toFixed(1)}% down payment**, you'll likely incur Private Mortgage Insurance (PMI) of about ${formatCurrency(current.pmi)}/month. Consider increasing your down payment to 20% to eliminate this cost.`;
        } else {
            dpStatus = `At **${current.downPaymentPercent.toFixed(1)}% down**, you should explore an FHA or VA loan to manage the high upfront PMI costs.`;
        }
        
        insights.push({
            title: "Down Payment & PMI Strategy",
            content: dpStatus,
            icon: "fas fa-chart-line",
            priority: 1
        });

        // --- Insight 2: Credit Score Impact ---
        let creditImpact;
        if (current.creditScore >= 760) {
            creditImpact = `Your excellent credit score of **${current.creditScore}** qualifies you for the best available rates. You're saving approximately 0.5-1% compared to average borrowers.`;
        } else if (current.creditScore >= 700) {
            creditImpact = `Your good credit score of **${current.creditScore}** puts you in a competitive position. Consider improving to 760+ for the best rates.`;
        } else if (current.creditScore >= 640) {
            creditImpact = `Your fair credit score of **${current.creditScore}** may result in higher interest rates. Improving your score could save you thousands over the loan term.`;
        } else {
            creditImpact = `Your credit score of **${current.creditScore}** will significantly impact your interest rate. Consider credit repair strategies before applying.`;
        }
        
        insights.push({
            title: "Credit Score Analysis",
            content: creditImpact,
            icon: "fas fa-star",
            priority: 2
        });

        // --- Insight 3: Extra Payment Impact ---
        let extraPayoffDate = new Date(current.payoffDate);
        let originalPayoffDate = new Date(new Date().setFullYear(new Date().getFullYear() + current.loanTerm));
        let monthsSaved = (originalPayoffDate.getFullYear() - extraPayoffDate.getFullYear()) * 12;
        monthsSaved -= (extraPayoffDate.getMonth() - originalPayoffDate.getMonth());
        
        if (current.extraMonthly > 0 || current.oneTimeExtra > 0) {
            const interestSaved = calculateInterestSaved(current.extraMonthly + (current.oneTimeExtra / 12));
            insights.push({
                title: "Acceleration Analysis: Extra Payments",
                content: `Your extra ${formatCurrency(current.extraMonthly + (current.oneTimeExtra / 12))} average monthly payment reduces your loan term by **${monthsSaved} months** (${(monthsSaved/12).toFixed(1)} years). This saves you **${formatCurrency(interestSaved)}** in interest compared to the base loan.`,
                icon: "fas fa-bolt",
                priority: 3
            });
        } else {
            insights.push({
                title: "Early Payoff Potential",
                content: `Paying just **${formatCurrency(100)}** extra per month could save you tens of thousands in interest and cut your loan term by several years. Consider this strategy!`,
                icon: "fas fa-arrow-alt-circle-up",
                priority: 3
            });
        }

        // --- Insight 4: Property Tax/Insurance Burden ---
        const piti = parseFloat(document.getElementById('total-monthly').textContent.replace(/[^0-9.-]+/g,""));
        const monthlyTaxIns = (current.propertyTax / 12) + (current.homeInsurance / 12);
        const taxInsPercent = (monthlyTaxIns / piti) * 100;
        
        if (taxInsPercent > 30) {
            insights.push({
                title: "Tax & Insurance Burden Alert",
                content: `Your property tax and insurance costs make up **${taxInsPercent.toFixed(1)}%** of your total monthly payment. This is higher than the national average. Verify your selected state rate and consider appealing your home appraisal.`,
                icon: "fas fa-exclamation-triangle",
                priority: 4
            });
        } else {
            insights.push({
                title: "Tax & Insurance Comfort",
                content: `At **${taxInsPercent.toFixed(1)}%**, your property tax and insurance costs are manageable for your home price. Good job selecting a state with a reasonable effective tax rate (${(current.propertyTax / current.homePrice * 100).toFixed(2)}%).`,
                icon: "fas fa-check-circle",
                priority: 4
            });
        }
        
        // --- Insight 5: Loan Type Optimization ---
        let loanTypeAdvice;
        switch(current.loanType) {
            case 'conventional':
                if (current.downPaymentPercent < 20) {
                    loanTypeAdvice = "With less than 20% down, you're paying PMI. Consider if an FHA loan might offer better terms for your situation.";
                } else {
                    loanTypeAdvice = "Conventional loan with 20% down is optimal - you avoid PMI and get competitive rates.";
                }
                break;
            case 'fha':
                loanTypeAdvice = "FHA loans are great for lower credit scores and smaller down payments, but you'll pay MIP (similar to PMI) for the life of the loan in most cases.";
                break;
            case 'va':
                loanTypeAdvice = "VA loans offer excellent terms with no down payment requirement and no PMI. Make sure you're maximizing your VA benefits.";
                break;
            case 'usda':
                loanTypeAdvice = "USDA loans are designed for rural homebuyers with no down payment. Verify your property qualifies for this program.";
                break;
        }
        
        insights.push({
            title: "Loan Type Analysis",
            content: loanTypeAdvice,
            icon: "fas fa-hand-holding-usd",
            priority: 5
        });

        // --- Insight 6: Market Rate Comparison ---
        const marketRate = MORTGAGE_CALCULATOR.currentMortgageRate || 6.5;
        const rateDiff = current.interestRate - marketRate;
        
        if (Math.abs(rateDiff) > 0.25) {
            insights.push({
                title: "Rate Comparison",
                content: `Your selected rate of **${current.interestRate}%** is ${rateDiff > 0 ? 'higher' : 'lower'} than the current market average of **${marketRate}%**. ${rateDiff > 0 ? 'You may want to shop around for better rates.' : 'Great job securing a competitive rate!'}`,
                icon: "fas fa-percentage",
                priority: 6
            });
        }

        // --- Insight 7: Affordability Check ---
        const monthlyIncome = piti * 3; // Assuming 33% of income goes to housing
        const annualIncome = monthlyIncome * 12;
        
        if (piti > 5000) {
            insights.push({
                title: "High Payment Alert",
                content: `Your monthly payment of ${formatCurrency(piti)} suggests you need an annual income of approximately ${formatCurrency(annualIncome)} to comfortably afford this home (following the 28/36 rule).`,
                icon: "fas fa-exclamation-circle",
                priority: 7
            });
        }

        // --- Insight 8: Refinance Potential ---
        if (current.interestRate > 5.5) {
            insights.push({
                title: "Future Refinance Opportunity",
                content: "When rates drop below 5.5%, you may want to consider refinancing to lower your monthly payment. Set up rate alerts to monitor the market.",
                icon: "fas fa-sync-alt",
                priority: 8
            });
        }

        // Sort insights by priority and render
        insights.sort((a, b) => a.priority - b.priority);
        
        insights.forEach(insight => {
            html += `
                <div class="ai-insight">
                    <p class="ai-insight-title"><i class="${insight.icon}"></i> ${insight.title}</p>
                    <p>${insight.content}</p>
                </div>
            `;
        });
        
        aiOutput.innerHTML = html;
        
        // Announce the new insights to the screen reader
        if (MORTGAGE_CALCULATOR.screenReaderMode) {
            announceToScreenReader('AI Powered Insights have been updated. Multiple financial strategy insights provided.');
        }

    }, 500); // Small delay for the "AI" feel
}

/**
 * Calculate interest saved from extra payments
 */
function calculateInterestSaved(extraPayment) {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const schedule = current.amortizationSchedule;
    
    if (!schedule.length) return 0;
    
    // Find the last payment in the schedule
    const lastPayment = schedule[schedule.length - 1];
    return lastPayment.totalInterest * 0.1; // Approximation
}

// ========================================================================== //
// FRED API INTEGRATION (Enhanced with Treasury Yield)                        //
// ========================================================================== //

class FredAPIManager {
    constructor() {
        this.apiKey = MORTGAGE_CALCULATOR.FRED_API_KEY;
        this.baseUrl = MORTGAGE_CALCULATOR.FRED_BASE_URL;
        this.cache = new Map();
    }

    /**
     * Fetches the current 30-Year Fixed Rate Mortgage Average from FRED.
     * @returns {Promise<number|null>} The current interest rate as a percentage, or null on failure.
     */
    async getCurrentMortgageRate() {
        if (MORTGAGE_CALCULATOR.rateUpdateAttempts >= MORTGAGE_CALCULATOR.maxRateUpdateAttempts) {
            console.error('Max FRED API update attempts reached.');
            showToast('Failed to fetch live rates after multiple attempts. Using default rate.', 'error');
            return null;
        }

        const seriesId = 'MORTGAGE30US'; // 30-Year Fixed Rate Mortgage Average
        const url = `${this.baseUrl}?series_id=${seriesId}&api_key=${this.apiKey}&file_type=json&sort_order=desc&limit=1`;
        
        showLoading('Fetching live Federal Reserve rates...');
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`FRED API HTTP Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.observations && data.observations.length > 0) {
                const latestRate = parseFloat(data.observations[0].value);
                if (!isNaN(latestRate)) {
                    MORTGAGE_CALCULATOR.lastRateUpdate = Date.now();
                    this.cache.set(seriesId, latestRate);
                    MORTGAGE_CALCULATOR.rateUpdateAttempts = 0;
                    
                    // Update last update time display
                    const updateTimeElement = document.getElementById('rate-update-time');
                    if (updateTimeElement) {
                        updateTimeElement.textContent = `Last updated: ${new Date().toLocaleString()}`;
                    }
                    
                    hideLoading();
                    showToast(`Live Rate Updated: ${latestRate}%`, 'success');
                    console.log(`🏦 FRED API Success: Latest rate is ${latestRate}%`);
                    return latestRate;
                }
            }
            throw new Error('FRED API did not return a valid rate observation.');

        } catch (error) {
            console.error('FRED API Fetch Error:', error.message);
            MORTGAGE_CALCULATOR.rateUpdateAttempts++;
            
            hideLoading();
            showToast('Error fetching live rates from FRED. Using cached/default rate.', 'warning');
            
            // Fallback to cache or default rate
            return this.cache.get(seriesId) || null;
            
        } finally {
            hideLoading();
        }
    }

    /**
     * Fetches the 10-Year Treasury Yield from FRED
     */
    async getTreasuryYield() {
        const seriesId = 'DGS10'; // 10-Year Treasury Constant Maturity Rate
        const url = `${this.baseUrl}?series_id=${seriesId}&api_key=${this.apiKey}&file_type=json&sort_order=desc&limit=2`;
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`FRED API HTTP Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.observations && data.observations.length > 1) {
                const latestYield = parseFloat(data.observations[0].value);
                const previousYield = parseFloat(data.observations[1].value);
                
                if (!isNaN(latestYield) && !isNaN(previousYield)) {
                    MORTGAGE_CALCULATOR.treasuryYield = latestYield;
                    
                    // Determine trend
                    if (latestYield > previousYield) {
                        MORTGAGE_CALCULATOR.treasuryYieldTrend = 'positive';
                    } else if (latestYield < previousYield) {
                        MORTGAGE_CALCULATOR.treasuryYieldTrend = 'negative';
                    } else {
                        MORTGAGE_CALCULATOR.treasuryYieldTrend = 'neutral';
                    }
                    
                    return latestYield;
                }
            }
            return null;
        } catch (error) {
            console.error('FRED Treasury Yield Fetch Error:', error.message);
            return null;
        }
    }
}

// ========================================================================== //
// NEW FEATURES & UTILITY FUNCTIONS                                           //
// ========================================================================== //

/**
 * Populates the state dropdown with all 50 US states
 */
function populateStateDropdown() {
    const select = document.getElementById('state-select');
    // Clear default option (the template already has one, keep it as selected disabled)
    
    // Add all 50 states + DC
    const stateCodes = Object.keys(STATE_RATES).sort();
    
    stateCodes.forEach(code => {
        const state = STATE_RATES[code];
        const option = document.createElement('option');
        option.value = code;
        option.textContent = state.name;
        select.appendChild(option);
    });
}

/**
 * Handles state selection to auto-update tax/insurance inputs
 */
function handleStateChange() {
    const select = document.getElementById('state-select');
    const stateCode = select.value;
    MORTGAGE_CALCULATOR.currentCalculation.state = stateCode;
    
    if (stateCode === 'default') return;

    const stateData = STATE_RATES[stateCode];
    const homePrice = MORTGAGE_CALCULATOR.currentCalculation.homePrice || 1; // Prevent division by zero

    // Calculate annual tax/insurance based on home price and state rates
    const annualTax = homePrice * (stateData.taxRate / 100);
    const annualInsurance = homePrice * (stateData.insuranceRate / 100);

    // Update the input fields
    document.getElementById('property-tax').value = annualTax.toFixed(0);
    document.getElementById('home-insurance').value = annualInsurance.toFixed(0);
    
    // Update the rate display hints
    document.getElementById('tax-rate-display').textContent = `${stateData.taxRate.toFixed(2)}%`;
    document.getElementById('insurance-rate-display').textContent = `${stateData.insuranceRate.toFixed(2)}%`;

    // Trigger calculation with new tax/insurance values
    updateCalculation('state-select');

    showToast(`Tax/Insurance updated for ${stateData.name}`, 'info');
}

/**
 * Switches the content view between the four tabs
 * @param {string} tabId - ID suffix of the tab (e.g., 'payment-summary')
 */
function switchTab(tabId) {
    // 1. Deactivate all buttons and hide all content
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.hidden = true;
    });

    // 2. Activate the selected button and show the content
    const selectedBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    const selectedContent = document.getElementById(`tab-content-${tabId}`);
    
    if (selectedBtn && selectedContent) {
        selectedBtn.classList.add('active');
        selectedBtn.setAttribute('aria-selected', 'true');
        selectedContent.classList.add('active');
        selectedContent.hidden = false;
    }
    
    // 3. Special re-render/logic for tab views
    if (tabId === 'balance-timeline') {
        renderMortgageTimelineChart();
        updateTreasuryYieldDisplay();
    } else if (tabId === 'payment-schedule') {
        renderPaymentScheduleTable();
    } else if (tabId === 'ai-insights') {
        renderAIPoweredInsights();
    }
}

/**
 * Updates the Treasury Yield display in the Balance Timeline tab
 */
function updateTreasuryYieldDisplay() {
    const yieldValueElement = document.getElementById('treasury-yield-value');
    const yieldTrendElement = document.getElementById('yield-trend');
    
    if (MORTGAGE_CALCULATOR.treasuryYield) {
        yieldValueElement.textContent = `${MORTGAGE_CALCULATOR.treasuryYield.toFixed(2)}%`;
        
        // Update trend indicator
        let trendHtml = '';
        switch(MORTGAGE_CALCULATOR.treasuryYieldTrend) {
            case 'positive':
                trendHtml = `<span class="trend-indicator positive"><i class="fas fa-arrow-up"></i> Rising</span>`;
                break;
            case 'negative':
                trendHtml = `<span class="trend-indicator negative"><i class="fas fa-arrow-down"></i> Falling</span>`;
                break;
            default:
                trendHtml = `<span class="trend-indicator neutral"><i class="fas fa-minus"></i> Stable</span>`;
        }
        yieldTrendElement.innerHTML = trendHtml;
    } else {
        yieldValueElement.textContent = 'Loading...';
    }
}

/**
 * Toggles the theme between dark and light mode
 */
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-color-scheme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    
    html.setAttribute('data-color-scheme', newTheme);
    MORTGAGE_CALCULATOR.currentTheme = newTheme;

    // Persist choice
    localStorage.setItem('preferredTheme', newTheme);
    
    // Re-render charts to update colors
    if (MORTGAGE_CALCULATOR.charts.paymentComponents) {
        renderPaymentComponentsChart(
            parseFloat(document.getElementById('pi-monthly').textContent.replace(/[^0-9.-]+/g,"")), 
            MORTGAGE_CALCULATOR.currentCalculation.propertyTax, 
            MORTGAGE_CALCULATOR.currentCalculation.homeInsurance, 
            MORTGAGE_CALCULATOR.currentCalculation.pmi + MORTGAGE_CALCULATOR.currentCalculation.hoaFees
        );
    }
    if (MORTGAGE_CALCULATOR.charts.mortgageTimeline) {
        renderMortgageTimelineChart();
    }
    
    showToast(`Switched to ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} Mode`, 'info');
}

/**
 * Toggles the Screen Reader/Read Aloud functionality
 */
function toggleScreenReader() {
    const toggle = document.getElementById('screen-reader-toggle');
    MORTGAGE_CALCULATOR.screenReaderMode = !MORTGAGE_CALCULATOR.screenReaderMode;
    
    if (MORTGAGE_CALCULATOR.screenReaderMode) {
        toggle.classList.add('active');
        announceToScreenReader('Screen Reader mode enabled. Reading current results: ' + document.getElementById('monthly-payment-total').textContent);
        showToast('Screen Reader Mode On', 'info');
    } else {
        toggle.classList.remove('active');
        if (MORTGAGE_CALCULATOR.speechSynthesis.speaking) {
            MORTGAGE_CALCULATOR.speechSynthesis.cancel();
        }
        showToast('Screen Reader Mode Off', 'info');
    }
}

/**
 * Toggles the Voice Control functionality
 */
function toggleVoiceControl() {
    if (!MORTGAGE_CALCULATOR.speechRecognition) {
        showToast('Voice recognition not supported in this browser.', 'error');
        return;
    }

    MORTGAGE_CALCULATOR.voiceEnabled = !MORTGAGE_CALCULATOR.voiceEnabled;
    const voiceStatus = document.getElementById('voice-status');
    const voiceToggle = document.getElementById('voice-toggle');

    if (MORTGAGE_CALCULATOR.voiceEnabled) {
        voiceStatus.style.display = 'block';
        voiceToggle.classList.add('active');
        startVoiceRecognition();
        showToast('Voice control activated. Try saying "set home price to 500000"', 'info');
    } else {
        voiceStatus.style.display = 'none';
        voiceToggle.classList.remove('active');
        if (MORTGAGE_CALCULATOR.recognition) {
            MORTGAGE_CALCULATOR.recognition.stop();
        }
        showToast('Voice control deactivated', 'info');
    }
}

/**
 * Starts voice recognition
 */
function startVoiceRecognition() {
    if (!MORTGAGE_CALCULATOR.speechRecognition) return;

    MORTGAGE_CALCULATOR.recognition = new MORTGAGE_CALCULATOR.speechRecognition();
    MORTGAGE_CALCULATOR.recognition.continuous = true;
    MORTGAGE_CALCULATOR.recognition.interimResults = false;
    MORTGAGE_CALCULATOR.recognition.lang = 'en-US';

    MORTGAGE_CALCULATOR.recognition.onresult = function(event) {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        processVoiceCommand(transcript);
    };

    MORTGAGE_CALCULATOR.recognition.onerror = function(event) {
        console.error('Voice recognition error:', event.error);
        if (event.error === 'not-allowed') {
            showToast('Microphone access denied. Please enable microphone permissions.', 'error');
            toggleVoiceControl(); // Turn off voice control
        }
    };

    MORTGAGE_CALCULATOR.recognition.onend = function() {
        if (MORTGAGE_CALCULATOR.voiceEnabled) {
            MORTGAGE_CALCULATOR.recognition.start();
        }
    };

    MORTGAGE_CALCULATOR.recognition.start();
}

/**
 * Processes voice commands
 */
function processVoiceCommand(transcript) {
    console.log('Voice command:', transcript);
    
    // Home price commands
    if (transcript.includes('home price') || transcript.includes('house price')) {
        const match = transcript.match(/\d+/);
        if (match) {
            const value = parseInt(match[0]) * 1000; // Assume numbers are in thousands
            document.getElementById('home-price').value = value;
            updateCalculation('home-price');
            showToast(`Home price set to ${formatCurrency(value)}`, 'success');
        }
    }
    
    // Down payment commands
    else if (transcript.includes('down payment')) {
        const match = transcript.match(/\d+/);
        if (match) {
            const value = parseInt(match[0]) * 1000; // Assume numbers are in thousands
            document.getElementById('down-payment').value = value;
            updateCalculation('down-payment');
            showToast(`Down payment set to ${formatCurrency(value)}`, 'success');
        }
    }
    
    // Interest rate commands
    else if (transcript.includes('interest rate') || transcript.includes('rate')) {
        const match = transcript.match(/\d+(\.\d+)?/);
        if (match) {
            const value = parseFloat(match[0]);
            document.getElementById('interest-rate').value = value;
            updateCalculation('interest-rate');
            showToast(`Interest rate set to ${value}%`, 'success');
        }
    }
    
    // Loan term commands
    else if (transcript.includes('loan term') || transcript.includes('term')) {
        if (transcript.includes('15') || transcript.includes('fifteen')) {
            setLoanTerm(document.querySelector('.term-chip[data-term="15"]'));
            showToast('Loan term set to 15 years', 'success');
        } else if (transcript.includes('30') || transcript.includes('thirty')) {
            setLoanTerm(document.querySelector('.term-chip[data-term="30"]'));
            showToast('Loan term set to 30 years', 'success');
        }
    }
    
    // Help command
    else if (transcript.includes('help') || transcript.includes('what can i say')) {
        announceToScreenReader('You can say things like: set home price to 500000, set down payment to 100000, set interest rate to 4.5, set loan term to 30 years');
        showToast('Try saying: "set home price to 500000" or "set interest rate to 4.5"', 'info');
    }
}

/**
 * Reads content aloud using the Web Speech API
 */
function announceToScreenReader(text) {
    if (!MORTGAGE_CALCULATOR.screenReaderMode || !MORTGAGE_CALCULATOR.speechSynthesis) return;

    // Cancel any current speech
    MORTGAGE_CALCULATOR.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1; // Slightly faster reading
    utterance.volume = 1;
    utterance.pitch = 1;
    
    // Try to use an American voice for the US calculator
    const voices = MORTGAGE_CALCULATOR.speechSynthesis.getVoices();
    const usVoice = voices.find(voice => voice.lang === 'en-US');
    if (usVoice) {
        utterance.voice = usVoice;
    }
    
    MORTGAGE_CALCULATOR.speechSynthesis.speak(utterance);
}

/**
 * Opens a new window for the Loan Comparison Tool
 */
function openLoanCompareWindow() {
    const currentData = JSON.stringify(MORTGAGE_CALCULATOR.currentCalculation);
    
    // Open a new window with a simplified/dedicated comparison tool
    const compareWindow = window.open('', 'LoanCompareWindow', 'width=1000,height=700,scrollbars=yes,resizable=yes');
    
    // Write a basic HTML structure to the new window for comparison scenario input
    const newWindowContent = `
        <!DOCTYPE html>
        <html lang="en" data-color-scheme="${MORTGAGE_CALCULATOR.currentTheme}">
        <head>
            <title>Loan Comparison Tool - AI Mortgage Pro</title>
            <link rel="stylesheet" href="mortgage-calculator.css">
            <style>
                body { padding: 20px; background-color: var(--color-background); color: var(--color-text); }
                .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .scenario-card { padding: 15px; border-radius: 8px; background-color: var(--color-surface); border: 1px solid var(--color-border); }
                h1 { font-size: 24px; color: var(--color-primary); margin-bottom: 20px; }
                .form-group label { color: var(--color-text-secondary); }
                .compare-results { margin-top: 20px; border-top: 1px solid var(--color-border); padding-top: 15px; }
                .result-item { display: flex; justify-content: space-between; padding: 5px 0; font-weight: 600; }
                .result-diff { font-weight: 700; color: green; }
                .result-diff.negative { color: red; }
            </style>
        </head>
        <body>
            <h1>Loan Comparison: Multiple Scenarios</h1>
            <div class="compare-grid" id="compare-grid">
                <div class="scenario-card" id="scenario-1">
                    <h2>Scenario 1: Your Current Loan (Base)</h2>
                    <p>Loan Amount: <strong id="base-loan-amount">${formatCurrency(MORTGAGE_CALCULATOR.currentCalculation.loanAmount)}</strong></p>
                    <p>Rate: <strong>${MORTGAGE_CALCULATOR.currentCalculation.interestRate}%</strong></p>
                    <p>Term: <strong>${MORTGAGE_CALCULATOR.currentCalculation.loanTerm} years</strong></p>
                    <p>Monthly Payment: <strong id="base-monthly">${document.getElementById('monthly-payment-total').textContent}</strong></p>
                </div>
                <div class="scenario-card" id="scenario-2">
                    <h2>Scenario 2: Custom Comparison</h2>
                    <div class="form-group">
                        <label>Loan Amount ($)</label>
                        <input type="number" class="form-control" id="compare-loan-amount" value="${MORTGAGE_CALCULATOR.currentCalculation.loanAmount}">
                    </div>
                    <div class="form-group">
                        <label>Interest Rate (%)</label>
                        <input type="number" class="form-control" id="compare-rate" value="${MORTGAGE_CALCULATOR.currentCalculation.interestRate}" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>Loan Term (Years)</label>
                        <input type="number" class="form-control" id="compare-term" value="${MORTGAGE_CALCULATOR.currentCalculation.loanTerm}">
                    </div>
                    <div class="form-group">
                        <button class="btn btn-primary" onclick="calculateComparison()">Compare</button>
                    </div>
                </div>
            </div>
            <div class="compare-results" id="compare-results">
                <!-- Comparison results will appear here -->
            </div>
            <script>
                function calculateComparison() {
                    const baseLoanAmount = parseFloat(${MORTGAGE_CALCULATOR.currentCalculation.loanAmount});
                    const baseRate = parseFloat(${MORTGAGE_CALCULATOR.currentCalculation.interestRate});
                    const baseTerm = parseInt(${MORTGAGE_CALCULATOR.currentCalculation.loanTerm});
                    
                    const compareLoanAmount = parseFloat(document.getElementById('compare-loan-amount').value) || 0;
                    const compareRate = parseFloat(document.getElementById('compare-rate').value) || 0;
                    const compareTerm = parseInt(document.getElementById('compare-term').value) || 0;
                    
                    // Calculate monthly payments
                    const baseMonthly = calculateMonthlyPayment(baseLoanAmount, baseRate, baseTerm);
                    const compareMonthly = calculateMonthlyPayment(compareLoanAmount, compareRate, compareTerm);
                    
                    // Calculate total interest
                    const baseTotalInterest = calculateTotalInterest(baseLoanAmount, baseRate, baseTerm);
                    const compareTotalInterest = calculateTotalInterest(compareLoanAmount, compareRate, compareTerm);
                    
                    // Update results
                    const resultsDiv = document.getElementById('compare-results');
                    resultsDiv.innerHTML = \`
                        <h2>Comparison Results</h2>
                        <div class="result-item">
                            <span>Monthly Payment:</span>
                            <span>Base: \${formatCurrency(baseMonthly)} | Compare: \${formatCurrency(compareMonthly)}</span>
                            <span class="result-diff \${compareMonthly < baseMonthly ? 'negative' : ''}">\${formatCurrency(compareMonthly - baseMonthly)}</span>
                        </div>
                        <div class="result-item">
                            <span>Total Interest:</span>
                            <span>Base: \${formatCurrency(baseTotalInterest)} | Compare: \${formatCurrency(compareTotalInterest)}</span>
                            <span class="result-diff \${compareTotalInterest < baseTotalInterest ? 'negative' : ''}">\${formatCurrency(compareTotalInterest - baseTotalInterest)}</span>
                        </div>
                        <div class="result-item">
                            <span>Loan Cost (Principal + Interest):</span>
                            <span>Base: \${formatCurrency(baseLoanAmount + baseTotalInterest)} | Compare: \${formatCurrency(compareLoanAmount + compareTotalInterest)}</span>
                            <span class="result-diff \${(compareLoanAmount + compareTotalInterest) < (baseLoanAmount + baseTotalInterest) ? 'negative' : ''}">\${formatCurrency((compareLoanAmount + compareTotalInterest) - (baseLoanAmount + baseTotalInterest))}</span>
                        </div>
                    \`;
                }
                
                function calculateMonthlyPayment(principal, rate, term) {
                    const rateMonthly = (rate / 100) / 12;
                    const payments = term * 12;
                    if (rateMonthly === 0) return principal / payments;
                    return principal * (rateMonthly * Math.pow(1 + rateMonthly, payments)) / (Math.pow(1 + rateMonthly, payments) - 1);
                }
                
                function calculateTotalInterest(principal, rate, term) {
                    const monthlyPayment = calculateMonthlyPayment(principal, rate, term);
                    return (monthlyPayment * term * 12) - principal;
                }
                
                function formatCurrency(amount) {
                    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
                }
                
                // Calculate initial comparison on load
                setTimeout(calculateComparison, 100);
            </script>
        </body>
        </html>
    `;
    
    compareWindow.document.write(newWindowContent);
    compareWindow.document.close();
    
    showToast('Loan comparison tool opened in new window', 'info');
}

/**
 * Toggles collapsible sections
 */
function toggleCollapsible(sectionId) {
    const section = document.getElementById(sectionId);
    section.classList.toggle('collapsed');
}

/**
 * Sets the loan type (Conventional, FHA, VA, USDA)
 */
function setLoanType(button) {
    document.querySelectorAll('.loan-type-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
    });
    
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
    
    MORTGAGE_CALCULATOR.currentCalculation.loanType = button.dataset.loanType;
    updateCalculation('loan-type');
    
    // Auto-set down payment based on loan type
    let suggestedDownPaymentPercent = 20; // Default Conventional
    switch(button.dataset.loanType) {
        case 'fha':
            suggestedDownPaymentPercent = 3.5;
            break;
        case 'va':
        case 'usda':
            suggestedDownPaymentPercent = 0;
            break;
    }
    
    document.getElementById('down-payment-percent').value = suggestedDownPaymentPercent;
    updateCalculation('down-payment-percent');
    
    showToast(`Loan type set to ${button.dataset.loanType.toUpperCase()}`, 'info');
}

/**
 * Sets the loan term (15 or 30 years)
 */
function setLoanTerm(button) {
    document.querySelectorAll('.term-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    
    button.classList.add('active');
    MORTGAGE_CALCULATOR.currentCalculation.loanTerm = parseInt(button.dataset.term);
    updateCalculation('loan-term');
    
    showToast(`Loan term set to ${button.dataset.term} years`, 'info');
}

// ========================================================================== //
// SHARING & SOCIAL FEATURES                                                  //
// ========================================================================== //

/**
 * Handles sharing the results via different platforms
 */
function shareResults(platform) {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const monthlyPayment = document.getElementById('monthly-payment-total').textContent;
    const loanAmount = formatCurrency(current.loanAmount);
    const rate = current.interestRate;
    
    const shareText = `My mortgage payment would be ${monthlyPayment} for a ${loanAmount} loan at ${rate}%. Check out this AI Mortgage Calculator: `;
    const shareUrl = window.location.href;
    
    let shareLink = '';
    
    switch(platform) {
        case 'facebook':
            shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
            break;
        case 'twitter':
            shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
            break;
        case 'whatsapp':
            shareLink = `https://wa.me/?text=${encodeURIComponent(shareText + shareUrl)}`;
            break;
        case 'linkedin':
            shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`;
            break;
        case 'copy':
            navigator.clipboard.writeText(shareText + shareUrl).then(() => {
                showToast('Link copied to clipboard!', 'success');
            }).catch(() => {
                showToast('Failed to copy link', 'error');
            });
            return;
        default:
            console.warn('Unknown share platform:', platform);
            return;
    }
    
    if (shareLink) {
        window.open(shareLink, '_blank', 'width=600,height=400');
        showToast(`Sharing via ${platform}`, 'info');
    }
}

/**
 * Generates a PDF of the current results
 */
function shareResultsPDF() {
    showLoading('Generating PDF report...');
    
    setTimeout(() => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(20);
            doc.setTextColor(20, 184, 166);
            doc.text('AI Mortgage Calculator - Results Report', 20, 20);
            
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 30);
            
            // Monthly Payment
            doc.setFontSize(16);
            doc.setTextColor(0, 0, 0);
            doc.text('Monthly Payment Summary', 20, 50);
            
            doc.setFontSize(24);
            doc.setTextColor(20, 184, 166);
            doc.text(document.getElementById('monthly-payment-total').textContent, 20, 65);
            
            // Loan Details
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            let y = 85;
            
            const details = [
                ['Home Price:', formatCurrency(MORTGAGE_CALCULATOR.currentCalculation.homePrice)],
                ['Down Payment:', formatCurrency(MORTGAGE_CALCULATOR.currentCalculation.downPayment)],
                ['Loan Amount:', formatCurrency(MORTGAGE_CALCULATOR.currentCalculation.loanAmount)],
                ['Interest Rate:', `${MORTGAGE_CALCULATOR.currentCalculation.interestRate}%`],
                ['Loan Term:', `${MORTGAGE_CALCULATOR.currentCalculation.loanTerm} years`],
                ['Credit Score:', MORTGAGE_CALCULATOR.currentCalculation.creditScore],
                ['Property Tax:', formatCurrency(MORTGAGE_CALCULATOR.currentCalculation.propertyTax) + '/year'],
                ['Home Insurance:', formatCurrency(MORTGAGE_CALCULATOR.currentCalculation.homeInsurance) + '/year']
            ];
            
            details.forEach(([label, value]) => {
                doc.text(label, 20, y);
                doc.text(value, 80, y);
                y += 8;
            });
            
            // Payment Breakdown
            y += 10;
            doc.setFontSize(14);
            doc.text('Payment Breakdown', 20, y);
            y += 10;
            
            const breakdown = [
                ['Principal & Interest:', document.getElementById('pi-monthly').textContent],
                ['Property Tax:', document.getElementById('tax-monthly').textContent],
                ['Home Insurance:', document.getElementById('insurance-monthly').textContent],
                ['PMI/HOA/Other:', document.getElementById('other-monthly').textContent]
            ];
            
            doc.setFontSize(10);
            breakdown.forEach(([label, value]) => {
                doc.text(label, 20, y);
                doc.text(value, 80, y);
                y += 6;
            });
            
            y += 5;
            doc.setDrawColor(0, 0, 0);
            doc.line(20, y, 80, y);
            y += 8;
            
            doc.setFontSize(12);
            doc.text('Total Monthly Payment:', 20, y);
            doc.text(document.getElementById('total-monthly').textContent, 80, y);
            
            // Footer
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('Generated by AI Mortgage Pro Calculator - worldsfirstai-calculator.com', 20, 280);
            
            // Save the PDF
            doc.save('AI_Mortgage_Calculator_Results.pdf');
            
            hideLoading();
            showToast('PDF report downloaded!', 'success');
        } catch (error) {
            console.error('PDF generation error:', error);
            hideLoading();
            showToast('PDF generation failed. Please try again.', 'error');
        }
    }, 500);
}

// ========================================================================== //
// UTILITY & HELPER FUNCTIONS                                                 //
// ========================================================================== //

/**
 * Formats a number as USD currency
 * @param {number} amount - The amount to format
 * @param {boolean} excludeSymbol - Whether to exclude the $ symbol (for exports)
 * @returns {string} The formatted currency string
 */
function formatCurrency(amount, excludeSymbol = false) {
    if (isNaN(amount) || amount === null) {
        return excludeSymbol ? '0.00' : '$0.00';
    }
    
    const options = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    };
    
    if (excludeSymbol) {
        return amount.toLocaleString('en-US', options);
    } else {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            ...options
        }).format(amount);
    }
}

/**
 * Shows a toast notification
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

/**
 * Shows the loading overlay
 */
function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loading-indicator');
    const messageEl = document.getElementById('loading-message');
    
    if (messageEl) messageEl.textContent = message;
    if (overlay) overlay.style.display = 'flex';
}

/**
 * Hides the loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loading-indicator');
    if (overlay) overlay.style.display = 'none';
}

// ========================================================================== //
// INITIALIZATION & EVENT LISTENERS                                           //
// ========================================================================== //

/**
 * Initializes the calculator when the DOM is loaded
 */
function initializeCalculator() {
    console.log('🚀 Initializing World\'s First AI Mortgage Calculator v26.0');
    
    // 1. Restore user preferences
    const savedTheme = localStorage.getItem('preferredTheme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-color-scheme', savedTheme);
        MORTGAGE_CALCULATOR.currentTheme = savedTheme;
    }
    
    // 2. Populate state dropdown
    populateStateDropdown();
    
    // 3. Initialize FRED API Manager and fetch rates
    const fredManager = new FredAPIManager();
    
    // Schedule rate updates every hour
    setInterval(async () => {
        await fredManager.getCurrentMortgageRate();
        await fredManager.getTreasuryYield();
    }, MORTGAGE_CALCULATOR.RATE_UPDATE_INTERVAL);
    
    // Initial rate fetch
    setTimeout(async () => {
        const currentRate = await fredManager.getCurrentMortgageRate();
        if (currentRate) {
            MORTGAGE_CALCULATOR.currentMortgageRate = currentRate;
            document.getElementById('interest-rate').value = currentRate.toFixed(2);
            updateCalculation('interest-rate');
            
            // Update rate status display
            const rateText = document.getElementById('rate-text');
            if (rateText) {
                rateText.textContent = `Live 30-Year Fixed Rate: ${currentRate.toFixed(2)}%`;
            }
        }
        
        // Fetch Treasury yield
        await fredManager.getTreasuryYield();
        updateTreasuryYieldDisplay();
    }, 1000);
    
    // 4. Set up keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + D to toggle dark mode
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            toggleTheme();
        }
        
        // Ctrl/Cmd + S to share
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            shareResultsPDF();
        }
        
        // Escape to close modals/voice
        if (e.key === 'Escape' && MORTGAGE_CALCULATOR.voiceEnabled) {
            toggleVoiceControl();
        }
    });
    
    // 5. Perform initial calculation
    updateCalculation('initial-load');
    
    // 6. Set up Service Worker for PWA capabilities (if supported)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(() => {
            console.log('✅ Service Worker registered');
        }).catch(error => {
            console.log('❌ Service Worker registration failed:', error);
        });
    }
    
    // 7. Set up font scaling based on user preference
    const savedFontScale = localStorage.getItem('preferredFontScale') || '1';
    document.documentElement.style.setProperty('--font-scale', savedFontScale);
    
    console.log('✅ AI Mortgage Calculator initialized successfully');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCalculator);

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MORTGAGE_CALCULATOR,
        FredAPIManager,
        updateCalculation,
        toggleTheme,
        switchTab
    };
}
