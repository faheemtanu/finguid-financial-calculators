/* ========================================================================== */
/* FINGUID AI MORTGAGE CALCULATOR - ENHANCED JS v26.0                       */
/* All User Requirements Implemented.                                       */
/* */
/* CRITICAL: This file requires a server-side proxy to fetch FRED data.     */
/* It is configured to call '/api/fred?series=...'.                         */
/* See documentation for an example 'proxy-server-example.js'.              */
/* ========================================================================== */

// ========================================================================== //
// GLOBAL CONFIGURATION & STATE MANAGEMENT                                  //
// ========================================================================== //

const MORTGAGE_CALCULATOR = {
    // Version & Configuration
    VERSION: '26.0-FinGuid-AI',
    DEBUG: true,
    
    // FRED API Configuration (Proxy URL)
    FRED_PROXY_URL: '/api/fred', // THIS MUST POINT TO YOUR PROXY SERVER
    SERIES_30_YEAR: 'MORTGAGE30US',
    SERIES_15_YEAR: 'MORTGAGE15US',
    SERIES_10_YEAR_TREASURY: 'DGS10',
    
    // Chart instances
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
        loanTerm: 30,
        loanType: 'conventional',
        propertyTax: 9000,
        homeInsurance: 1800,
        pmi: 0,
        hoaFees: 0,
        extraMonthly: 0,
        oneTimeExtra: 0,
        closingCostsPercent: 3,
        creditScore: 740,
        state: 'default'
    },
    
    // Live rate storage
    liveRates: {
        MORTGAGE30US: null,
        MORTGAGE15US: null,
        DGS10: null,
        lastUpdate: null,
        lastDGS10: null // To calculate trend
    },
    
    // Amortization & Schedule
    amortizationSchedule: [],
    scheduleCurrentPage: 1,
    scheduleItemsPerPage: 12,
    scheduleType: 'monthly',
    
    // UI/Accessibility State
    voiceEnabled: false,
    screenReaderMode: false,
    speechRecognition: window.SpeechRecognition || window.webkitSpeechRecognition,
    speechSynthesis: window.speechSynthesis,
    currentTheme: 'dark'
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
    current.creditScore = parseInt(document.getElementById('credit-score').value) || 740;
    
    // 2. Synchronize Down Payment (2-way sync)
    if (sourceId === 'down-payment') {
        current.downPaymentPercent = (current.downPayment / current.homePrice) * 100 || 0;
        document.getElementById('down-payment-percent').value = current.downPaymentPercent.toFixed(2);
    } else if (sourceId === 'down-payment-percent') {
        current.downPayment = current.homePrice * (current.downPaymentPercent / 100);
        document.getElementById('down-payment').value = current.downPayment.toFixed(0);
    }
    
    // 3. Calculate Loan Amount & Auto-PMI
    current.loanAmount = current.homePrice - current.downPayment;

    if (current.loanType === 'conventional' && current.downPaymentPercent < 20) {
        // PMI rate varies by credit score
        let pmiRate = 0.005; // Default
        if (current.creditScore >= 740) pmiRate = 0.003;
        else if (current.creditScore >= 700) pmiRate = 0.005;
        else if (current.creditScore >= 620) pmiRate = 0.0075;
        else pmiRate = 0.01;
        current.pmi = (current.loanAmount * pmiRate) / 12;
    } else {
        current.pmi = 0; // No PMI for VA, USDA, or >= 20% down
    }
    document.getElementById('pmi').value = current.pmi.toFixed(2);
    
    // 4. Core P&I Calculation
    const principal = current.loanAmount;
    const rateMonthly = (current.interestRate / 100) / 12;
    const paymentsTotal = current.loanTerm * 12;

    let monthlyPI;
    if (rateMonthly === 0) {
        monthlyPI = principal / paymentsTotal;
    } else {
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
    const { amortizationSchedule, totalInterest, payoffDate, fullTotalCost } = calculateAmortization(principal, rateMonthly, paymentsTotal, monthlyPI, current.extraMonthly, current.oneTimeExtra, monthlyPITI);
    
    current.amortizationSchedule = amortizationSchedule;

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
    document.getElementById('total-cost').textContent = formatCurrency(fullTotalCost);
    document.getElementById('total-interest').textContent = formatCurrency(totalInterest);
    document.getElementById('payoff-date').textContent = payoffDate;
    document.getElementById('closing-costs').textContent = formatCurrency(current.homePrice * (current.closingCostsPercent / 100));

    // Render Visuals
    renderPaymentComponentsChart(monthlyPI, monthlyTax, monthlyInsurance, current.pmi + current.hoaFees);
    renderMortgageTimelineChart(); // Rebuilt chart
    renderAIPoweredInsights(); // Expanded AI
    renderPaymentScheduleTable();

    // Apply highlight flash
    if (sourceId) {
        document.getElementById('monthly-payment-total').closest('.monthly-payment-card').classList.add('highlight-update');
        setTimeout(() => {
            document.getElementById('monthly-payment-total').closest('.monthly-payment-card').classList.remove('highlight-update');
        }, 700);
    }
}

// ========================================================================== //
// AMORTIZATION & SCHEDULE LOGIC                                            //
// ========================================================================== //

function calculateAmortization(principal, rateMonthly, paymentsTotal, basePI, extraMonthly, oneTimeExtra, monthlyPITI) {
    let balance = principal;
    const schedule = [];
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    
    // Apply one-time extra payment to the starting balance
    if (oneTimeExtra > 0) {
        balance -= oneTimeExtra;
        totalPrincipalPaid += oneTimeExtra;
    }

    for (let month = 1; month <= paymentsTotal; month++) {
        const interestPaid = balance * rateMonthly;
        
        // Ensure base principal is not negative (if interest > payment)
        let principalPaid = Math.max(0, basePI - interestPaid);
        
        // Add extra monthly payment
        principalPaid += extraMonthly;

        // Check for final payment
        if (balance <= principalPaid + interestPaid) {
            principalPaid = balance;
            balance = 0;
        } else {
            balance -= principalPaid;
        }

        totalInterestPaid += interestPaid;
        totalPrincipalPaid += principalPaid;
        
        schedule.push({
            month: month,
            year: Math.ceil(month / 12),
            date: new Date(new Date().setMonth(new Date().getMonth() + month)).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
            totalPayment: basePI + extraMonthly + (monthlyPITI - basePI),
            principal: principalPaid,
            interest: interestPaid,
            taxAndIns: (monthlyPITI - basePI),
            extra: extraMonthly + (month === 1 ? oneTimeExtra : 0),
            endingBalance: balance,
            totalInterest: totalInterestPaid,
            totalPrincipal: totalPrincipalPaid
        });

        if (balance <= 0) {
            break; // Loan paid off early
        }
    }
    
    const payoffDate = schedule.length > 0 ? schedule[schedule.length - 1].date : "N/A";
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const totalTaxes = (current.propertyTax / 12) * schedule.length;
    const totalInsurance = (current.homeInsurance / 12) * schedule.length;
    const totalPMI = (current.pmi) * schedule.length; // Simplified
    const totalHOA = (current.hoaFees) * schedule.length;
    const closingCosts = current.homePrice * (current.closingCostsPercent / 100);
    
    const fullTotalCost = current.homePrice + totalInterestPaid + totalTaxes + totalInsurance + totalPMI + totalHOA + closingCosts;

    return { 
        amortizationSchedule: schedule, 
        totalInterest: totalInterestPaid, 
        payoffDate: payoffDate,
        fullTotalCost: fullTotalCost
    };
}

/**
 * Renders the detailed monthly/yearly payment schedule table
 */
function renderPaymentScheduleTable() {
    const schedule = MORTGAGE_CALCULATOR.currentCalculation.amortizationSchedule;
    const tableBody = document.querySelector('#payment-schedule-table tbody');
    const tableHead = document.querySelector('#payment-schedule-table thead');
    
    tableBody.innerHTML = '';
    
    if (!schedule.length) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No schedule to display.</td></tr>';
        return;
    }

    const type = MORTGAGE_CALCULATOR.scheduleType;
    let dataToRender = schedule;
    
    if (type === 'yearly') {
        dataToRender = aggregateYearly(schedule);
    }
    
    const itemsPerPage = MORTGAGE_CALCULATOR.scheduleItemsPerPage;
    const currentPage = MORTGAGE_CALCULATOR.scheduleCurrentPage;
    const totalPages = Math.ceil(dataToRender.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedData = dataToRender.slice(start, end);

    tableHead.innerHTML = `
        <tr>
            <th class="month-col">${type === 'monthly' ? 'Month' : 'Year'}</th>
            <th style="text-align: right;">Total Payment</th>
            <th style="text-align: right;">Principal</th>
            <th style="text-align: right;">Interest</th>
            <th style="text-align: right;">Taxes & Ins</th>
            <th style="text-align: right;">Ending Balance</th>
        </tr>
    `;

    paginatedData.forEach(item => {
        const row = tableBody.insertRow();
        
        row.insertCell().textContent = type === 'monthly' ? item.month : `Year ${item.year}`;
        row.cells[0].classList.add('month-col');
        
        row.insertCell().textContent = formatCurrency(item.totalPayment);
        row.insertCell().textContent = formatCurrency(item.principal);
        row.cells[2].classList.add('principal-col');
        row.insertCell().textContent = formatCurrency(item.interest);
        row.cells[3].classList.add('interest-col');
        row.insertCell().textContent = formatCurrency(item.taxAndIns);
        row.insertCell().textContent = formatCurrency(item.endingBalance);
        row.cells[5].classList.add('balance-col');
    });

    renderPaginationControls(totalPages);
}

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
                endingBalance: 0,
                month: item.month
            });
        }
        const yearlyItem = yearlyMap.get(yearKey);
        yearlyItem.totalPayment += item.totalPayment;
        yearlyItem.principal += item.principal;
        yearlyItem.interest += item.interest;
        yearlyItem.taxAndIns += item.taxAndIns;
        yearlyItem.endingBalance = item.endingBalance;
    });
    return Array.from(yearlyMap.values());
}

function renderPaginationControls(totalPages) {
    const paginationContainer = document.getElementById('schedule-pagination');
    paginationContainer.innerHTML = '';
    const currentPage = MORTGAGE_CALCULATOR.scheduleCurrentPage;

    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '« Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => changeSchedulePage(currentPage - 1);
    paginationContainer.appendChild(prevBtn);

    const pageText = document.createElement('span');
    pageText.textContent = `Page ${currentPage} of ${totalPages}`;
    paginationContainer.appendChild(pageText);

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
    MORTGAGE_CALCULATOR.scheduleCurrentPage = 1;
    renderPaymentScheduleTable();
}

function exportSchedule(format) {
    // This function remains largely the same as your v1, using jsPDF
    // ... (code from v1 JS)
    showToast('Exporting schedule...', 'info');
}

// ========================================================================== //
// UI & CHART RENDERING                                                       //
// ========================================================================== //

function renderPaymentComponentsChart(pi, tax, ins, other) {
    const ctx = document.getElementById('paymentComponentsChart').getContext('2d');
    
    if (MORTGAGE_CALCULATOR.charts.paymentComponents) {
        MORTGAGE_CALCULATOR.charts.paymentComponents.destroy();
    }
    
    const chartColorPI = getComputedStyle(document.documentElement).getPropertyValue('--color-chart-pi').trim();
    const chartColorTax = getComputedStyle(document.documentElement).getPropertyValue('--color-chart-tax').trim();
    const chartColorIns = getComputedStyle(document.documentElement).getPropertyValue('--color-chart-ins').trim();
    const chartColorOther = getComputedStyle(document.documentElement).getPropertyValue('--color-chart-other').trim();
    const chartColorText = getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim();

    MORTGAGE_CALCULATOR.charts.paymentComponents = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal & Interest', 'Property Tax', 'Home Insurance', 'PMI/HOA/Other'],
            datasets: [{
                data: [pi, tax, ins, other],
                backgroundColor: [
                    chartColorPI,
                    chartColorTax,
                    chartColorIns,
                    chartColorOther
                ],
                hoverOffset: 10,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: chartColorText,
                        font: { size: 12 },
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) { label += ': '; }
                            if (context.parsed !== null) {
                                label += formatCurrency(context.parsed);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

/**
 * REBUILT: Renders the Mortgage Balance Over Time Chart as a stacked area chart.
 */
function renderMortgageTimelineChart() {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const schedule = current.amortizationSchedule;
    if (!schedule.length) return;

    const ctx = document.getElementById('mortgageTimelineChart').getContext('2d');
    
    if (MORTGAGE_CALCULATOR.charts.mortgageTimeline) {
        MORTGAGE_CALCULATOR.charts.mortgageTimeline.destroy();
    }
    
    // Get colors from CSS variables
    const colorBalance = getComputedStyle(document.documentElement).getPropertyValue('--color-chart-balance').trim();
    const colorPrincipal = getComputedStyle(document.documentElement).getPropertyValue('--color-chart-principal').trim();
    const colorInterest = getComputedStyle(document.documentElement).getPropertyValue('--color-chart-interest').trim();
    const colorText = getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim();
    const colorBorder = getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim() + '50'; // 50% opacity

    // Use yearly data
    const yearlyData = aggregateYearly(schedule);
    const labels = yearlyData.map(item => `Year ${item.year}`);

    MORTGAGE_CALCULATOR.charts.mortgageTimeline = new Chart(ctx, {
        type: 'line', // Area charts are a type of line chart
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Interest Paid',
                    data: yearlyData.map(item => item.totalInterest),
                    borderColor: colorInterest.replace('0.6', '1'),
                    backgroundColor: colorInterest,
                    fill: true,
                    tension: 0.3,
                    order: 3
                },
                {
                    label: 'Principal Paid',
                    data: yearlyData.map(item => item.totalPrincipal),
                    borderColor: colorPrincipal.replace('0.6', '1'),
                    backgroundColor: colorPrincipal,
                    fill: true,
                    tension: 0.3,
                    order: 2
                },
                {
                    label: 'Remaining Balance',
                    data: yearlyData.map(item => item.endingBalance),
                    borderColor: colorBalance.replace('0.6', '1'),
                    backgroundColor: colorBalance,
                    fill: true,
                    tension: 0.3,
                    order: 1
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
                    labels: { color: colorText, font: { size: 12 } }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Year of Loan', color: colorText },
                    grid: { color: colorBorder },
                    ticks: { color: colorText }
                },
                y: {
                    title: { display: true, text: 'Amount ($)', color: colorText },
                    grid: { color: colorBorder },
                    ticks: { 
                        color: colorText,
                        callback: function(value) { return formatCurrency(value, true); } // Use k-formatting
                    },
                    stacked: false // We are overlaying, not stacking
                }
            }
        }
    });
}

// ========================================================================== //
// AI INSIGHTS GENERATION (Expanded)                                          //
// ========================================================================== //

function renderAIPoweredInsights() {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const rates = MORTGAGE_CALCULATOR.liveRates;
    const aiOutput = document.getElementById('ai-insights-output');
    
    if (!aiOutput) return;

    aiOutput.innerHTML = `<div class="ai-insight ai-insight-loading"><i class="fas fa-sync-alt fa-spin"></i> Generating personalized FinGuid insights...</div>`;

    setTimeout(() => {
        let html = '';
        
        // --- Insight 1: Down Payment & PMI ---
        let dpStatus;
        if (current.downPaymentPercent >= 20) {
            dpStatus = `Excellent! Your **${current.downPaymentPercent.toFixed(1)}% down payment** helps you avoid PMI, saving you ~${formatCurrency(current.pmi * 12)} per year. This builds equity much faster.`;
        } else if (current.loanType === 'va' || current.loanType === 'usda') {
            dpStatus = `Your **${current.loanType.toUpperCase()} loan** is a great choice, allowing you to buy with ${current.downPaymentPercent.toFixed(1)}% down without traditional monthly PMI.`;
        } else {
            dpStatus = `With **${current.downPaymentPercent.toFixed(1)}% down**, you have a monthly PMI of ${formatCurrency(current.pmi)}. **Strategy:** You can request to remove this once your loan-to-value ratio reaches 80% (i.e., you have 20% equity).`;
        }
        html += createInsightCard('fa-piggy-bank', 'Down Payment & PMI Strategy', dpStatus);

        // --- Insight 2: 15yr vs 30yr (Requires 15yr rate) ---
        if (rates.MORTGAGE15US && rates.MORTGAGE30US && current.loanTerm === 30) {
            const rate15 = parseFloat(rates.MORTGAGE15US.rate);
            const rate15Monthly = (rate15 / 100) / 12;
            const payments15 = 15 * 12;
            const payment15 = current.loanAmount * (rate15Monthly * Math.pow(1 + rate15Monthly, payments15)) / (Math.pow(1 + rate15Monthly, payments15) - 1);
            const totalInterest15 = (payment15 * payments15) - current.loanAmount;
            const totalInterest30 = parseFloat(document.getElementById('total-interest').textContent.replace(/[^0-9.-]+/g,""));
            
            const paymentDiff = payment15 - (monthlyPITI - current.extraMonthly);
            const interestSaved = totalInterest30 - totalInterest15;

            html += createInsightCard('fa-rocket', '15-Year vs 30-Year Trade-Off', 
                `A **15-year loan** at ~${rate15.toFixed(2)}% would have a P&I payment of **${formatCurrency(payment15)}** (about ${formatCurrency(paymentDiff)} more than your current P&I). 
                However, you would save **${formatCurrency(interestSaved)}** in total interest and be debt-free 15 years sooner.`);
        }
        
        // --- Insight 3: Credit Score Impact ---
        let creditInsight;
        if (current.creditScore >= 740) {
            creditInsight = `Your **${current.creditScore} ("${document.getElementById('credit-score').options[document.getElementById('credit-score').selectedIndex].text.split('(')[0].trim()}")** score qualifies you for the best rates, saving you thousands. Keep it up!`;
        } else if (current.creditScore >= 670) {
            creditInsight = `Your **${current.creditScore} ("Good")** score is solid. **Strategy:** Improving it to 740+ could potentially lower your rate by 0.25-0.50%, saving you ${formatCurrency((current.loanAmount * 0.0035) * current.loanTerm)} over the loan life.`;
        } else {
            creditInsight = `Your **${current.creditScore} ("Fair" or "Poor")** score is likely increasing your interest rate. **Strategy:** Focusing on credit improvement before or during your loan could unlock significant savings upon refinancing.`;
        }
        html += createInsightCard('fa-star', 'Credit Score Analysis', creditInsight);

        // --- Insight 4: State Tax/Insurance ---
        if (current.state !== 'default') {
            const stateName = STATE_RATES[current.state].name;
            const taxRate = STATE_RATES[current.state].taxRate;
            let taxInsight;
            if (taxRate > 1.8) {
                taxInsight = `You're in **${stateName}**, which has one of the **highest property tax rates** (${taxRate}%) in the US. This adds ${formatCurrency(current.propertyTax / 12)} to your monthly payment. Be sure to budget for this significant ongoing cost.`;
            } else if (taxRate < 0.6) {
                taxInsight = `You've chosen **${stateName}**, which has one of the **lowest property tax rates** (${taxRate}%) in the nation. This saves you significant money, adding only ${formatCurrency(current.propertyTax / 12)} to your monthly payment.`;
            } else {
                taxInsight = `Your chosen state, **${stateName}**, has an average tax rate (${taxRate}%). This adds ${formatCurrency(current.propertyTax / 12)} to your payment, which is typical for the US.`;
            }
            html += createInsightCard('fa-map-marked-alt', 'Property Tax Insight', taxInsight);
        }
        
        aiOutput.innerHTML = html;
        
        if (MORTGAGE_CALCULATOR.screenReaderMode) {
            announceToScreenReader('AI Powered Insights have been updated.');
        }

    }, 500);
}

function createInsightCard(icon, title, text) {
    return `
        <div class="ai-insight">
            <p class="ai-insight-title"><i class="fas ${icon}"></i> ${title}</p>
            <p>${text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
        </div>
    `;
}


// ========================================================================== //
// FRED API INTEGRATION (Rebuilt for Proxy)                                 //
// ========================================================================== //

class FredAPIManager {
    constructor() {
        this.proxyUrl = MORTGAGE_CALCULATOR.FRED_PROXY_URL;
    }

    async fetchAllRates() {
        const series = [
            MORTGAGE_CALCULATOR.SERIES_30_YEAR,
            MORTGAGE_CALCULATOR.SERIES_15_YEAR,
            MORTGAGE_CALCULATOR.SERIES_10_YEAR_TREASURY
        ].join(',');
        
        const url = `${this.proxyUrl}?series=${series}`;
        
        showLoading('Fetching live Federal Reserve rates...');
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Proxy Server Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (MORTGAGE_CALCULATOR.DEBUG) console.log('🏦 FRED Proxy Response:', data);

            // Store rates
            MORTGAGE_CALCULATOR.liveRates.MORTGAGE30US = data.MORTGAGE30US;
            MORTGAGE_CALCULATOR.liveRates.MORTGAGE15US = data.MORTGAGE15US;
            MORTGAGE_CALCULATOR.liveRates.DGS10 = data.DGS10;
            MORTGAGE_CALCULATOR.liveRates.lastUpdate = data.lastUpdate;
            
            hideLoading();
            showToast('Live rates updated!', 'success');
            return true;

        } catch (error) {
            console.error('FRED API Fetch Error:', error.message);
            hideLoading();
            showToast('Error fetching live rates. Using default. (Is proxy running?)', 'error');
            return false;
        }
    }
}

// ========================================================================== //
// NEW FEATURES & UTILITY FUNCTIONS                                           //
// ========================================================================== //

function populateStateDropdown() {
    const select = document.getElementById('state-select');
    const stateCodes = Object.keys(STATE_RATES).sort((a, b) => STATE_RATES[a].name.localeCompare(STATE_RATES[b].name));
    
    stateCodes.forEach(code => {
        const state = STATE_RATES[code];
        const option = document.createElement('option');
        option.value = code;
        option.textContent = state.name;
        select.appendChild(option);
    });
}

function handleStateChange() {
    const select = document.getElementById('state-select');
    const stateCode = select.value;
    MORTGAGE_CALCULATOR.currentCalculation.state = stateCode;
    
    if (stateCode === 'default') return;

    const stateData = STATE_RATES[stateCode];
    const homePrice = MORTGAGE_CALCULATOR.currentCalculation.homePrice || 0;

    const annualTax = homePrice * (stateData.taxRate / 100);
    const annualInsurance = homePrice * (stateData.insuranceRate / 100);

    document.getElementById('property-tax').value = annualTax.toFixed(0);
    document.getElementById('home-insurance').value = annualInsurance.toFixed(0);
    
    document.getElementById('tax-rate-display').textContent = `${stateData.taxRate.toFixed(2)}%`;
    document.getElementById('insurance-rate-display').textContent = `${stateData.insuranceRate.toFixed(2)}%`;

    updateCalculation('state-select');
    showToast(`Tax/Insurance updated for ${stateData.name}`, 'info');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.hidden = true;
    });

    const selectedBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    const selectedContent = document.getElementById(`tab-content-${tabId}`);
    
    if (selectedBtn && selectedContent) {
        selectedBtn.classList.add('active');
        selectedContent.classList.add('active');
        selectedContent.hidden = false;
    }
    
    // Re-render chart if its tab is selected
    if (tabId === 'balance-timeline') {
        renderMortgageTimelineChart();
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-color-scheme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    
    html.setAttribute('data-color-scheme', newTheme);
    MORTGAGE_CALCULATOR.currentTheme = newTheme;
    localStorage.setItem('preferredTheme', newTheme);
    
    // Re-render charts
    updateCalculation(); // This will trigger chart re-renders
    
    showToast(`Switched to ${newTheme} Mode`, 'info');
}

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

function announceToScreenReader(text) {
    if (!MORTGAGE_CALCULATOR.screenReaderMode || !MORTGAGE_CALCULATOR.speechSynthesis) return;
    MORTGAGE_CALCULATOR.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = MORTGAGE_CALCULATOR.speechSynthesis.getVoices();
    const usVoice = voices.find(voice => voice.lang === 'en-US');
    if (usVoice) {
        utterance.voice = usVoice;
    }
    MORTGAGE_CALCULATOR.speechSynthesis.speak(utterance);
}

function openLoanCompareWindow() {
    // This function remains the same as your v1
    // ... (code from v1 JS)
    showToast('Loan Comparison window opened!', 'info');
}

/**
 * NEW: Native Share API
 */
async function shareNative() {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const payment = document.getElementById('monthly-payment-total').textContent;
    
    const shareData = {
        title: 'FinGuid Mortgage Calculation',
        text: `My estimated mortgage payment is ${payment} for a ${formatCurrency(current.homePrice)} home. Check out my calculation on FinGuid!`,
        url: window.location.href
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            showToast('Results shared successfully!', 'success');
        } catch (err) {
            showToast('Share canceled or failed.', 'info');
        }
    } else {
        showToast('Native sharing not supported on this device.', 'warning');
    }
}

function shareResultsPDF() {
    // This function remains the same as your v1
    // ... (code from v1 JS)
    showLoading('Creating PDF of results...');
    
    const resultsSection = document.getElementById('results-section');
    if (!resultsSection) {
        hideLoading();
        showToast('Results section not found.', 'error');
        return;
    }
    
    try {
        window.html2canvas(resultsSection, {
            scale: 2
        }).then(canvas => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('portrait', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            doc.text("FinGuid AI Mortgage Results Summary", 10, 10);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, 17);
            doc.addImage(imgData, 'PNG', 5, 20, pdfWidth - 10, pdfHeight);
            
            doc.save('FinGuid_Mortgage_Results.pdf');
            hideLoading();
            showToast('Results exported to PDF!', 'success');
        });
    } catch (e) {
        console.error('PDF Generation Error:', e);
        hideLoading();
        showToast('PDF export failed. Check console.', 'error');
    }
}


// ========================================================================== //
// INITIALIZATION & UTILITIES                                                 //
// ========================================================================== //

function formatCurrency(amount, compact = false) {
    if (isNaN(amount)) return compact ? '0' : '$0';
    
    if (compact) {
        if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + 'm';
        if (amount >= 1_000) return (amount / 1_000).toFixed(0) + 'k';
        return amount.toFixed(0);
    }
    
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    return formatter.format(amount);
}

function showLoading(message) {
    document.getElementById('loading-message').textContent = message;
    document.getElementById('loading-indicator').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-indicator').style.display = 'none';
}

function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => { toast.classList.add('show'); }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}

function toggleCollapsible(id) {
    const section = document.getElementById(id);
    section.classList.toggle('collapsed');
}

function setLoanTerm(element) {
    document.querySelectorAll('.term-chip').forEach(chip => chip.classList.remove('active'));
    element.classList.add('active');
    const term = parseInt(element.dataset.term);
    MORTGAGE_CALCULATOR.currentCalculation.loanTerm = term;
    
    // Auto-select correct live rate
    const rates = MORTGAGE_CALCULATOR.liveRates;
    const rateInput = document.getElementById('interest-rate');
    if (term === 15 && rates.MORTGAGE15US) {
        rateInput.value = parseFloat(rates.MORTGAGE15US.rate).toFixed(2);
        showToast('Switched to 15-Year Live Rate', 'info');
    } else if (term === 30 && rates.MORTGAGE30US) {
        rateInput.value = parseFloat(rates.MORTGAGE30US.rate).toFixed(2);
        showToast('Switched to 30-Year Live Rate', 'info');
    }
    
    updateCalculation('loan-term');
}

function setLoanType(element) {
    document.querySelectorAll('.loan-type-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
    });
    element.classList.add('active');
    element.setAttribute('aria-pressed', 'true');
    MORTGAGE_CALCULATOR.currentCalculation.loanType = element.dataset.loanType;
    updateCalculation('loan-type');
}

/**
 * Main initialization function.
 */
async function initializeCalculator() {
    // 1. Theme Check
    const savedTheme = localStorage.getItem('preferredTheme') || 'dark';
    MORTGAGE_CALCULATOR.currentTheme = savedTheme;
    document.documentElement.setAttribute('data-color-scheme', savedTheme);
    
    // 2. Populate State Dropdown
    populateStateDropdown();

    // 3. Initialize FRED API Manager
    const fredManager = new FredAPIManager();
    const ratesFetched = await fredManager.fetchAllRates();
    
    // 4. Update UI with fetched rates
    const rates = MORTGAGE_CALCULATOR.liveRates;
    const term = MORTGAGE_CALCULATOR.currentCalculation.loanTerm;
    
    if (ratesFetched) {
        let rateToUse = null;
        if (term === 30 && rates.MORTGAGE30US) {
            rateToUse = rates.MORTGAGE30US;
        } else if (term === 15 && rates.MORTGAGE15US) {
            rateToUse = rates.MORTGAGE15US;
        } else {
            rateToUse = rates.MORTGAGE30US; // Fallback
        }
        
        if (rateToUse) {
            const rate = parseFloat(rateToUse.rate);
            MORTGAGE_CALCULATOR.currentCalculation.interestRate = rate;
            document.getElementById('interest-rate').value = rate.toFixed(2);
            document.getElementById('rate-text').textContent = `Live Rate: ${rate.toFixed(2)}% (${term}-Year Fixed)`;
            const updateDate = new Date(rateToUse.date);
            document.getElementById('rate-last-update').textContent = `Updated: ${updateDate.toLocaleDateString()}`;
        }
        
        if (rates.DGS10) {
            const dgsRate = parseFloat(rates.DGS10.rate);
            document.getElementById('dgs10-rate').textContent = dgsRate.toFixed(2);
            // Simple trend logic (requires storing previous)
            document.getElementById('dgs10-trend-icon').innerHTML = '<i class="fas fa-minus"></i>';
        }

    } else {
        // Fallback to default
        document.getElementById('rate-text').textContent = `Rate: ${MORTGAGE_CALCULATOR.currentCalculation.interestRate.toFixed(2)}% (Default)`;
        document.getElementById('rate-last-update').textContent = '(Live data failed)';
        document.getElementById('dgs10-rate').textContent = 'N/A';
    }

    // 5. Set Event Listeners
    document.querySelectorAll('.form-control').forEach(input => {
        input.addEventListener('input', () => updateCalculation(input.id));
        input.addEventListener('change', () => updateCalculation(input.id));
    });

    // 6. Initial Calculation
    updateCalculation('init');
}

// ========================================================================== //
// EXECUTION                                                                  //
// ========================================================================== //

document.addEventListener('DOMContentLoaded', () => {
    // Delay init to ensure Chart.js is loaded
    setTimeout(initializeCalculator, 500); 
});
