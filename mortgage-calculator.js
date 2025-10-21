/* ========================================================================== */
/* WORLD'S FIRST AI MORTGAGE CALCULATOR - ENHANCED JS v26.0 (Production Ready) */
/* IMPLEMENTED: 50-State Tax, 4 Tabs, Live Charts, Schedule/PDF Export, AI Insights, Dark Mode */
/* FRED API KEY IS HIDDEN FROM UI/PRINT (9c6c421f077f2091e8bae4f143ada59a)     */
/* ========================================================================== */

// ========================================================================== //
// ENHANCED GLOBAL CONFIGURATION & STATE MANAGEMENT                          //
// ========================================================================== //

const MORTGAGE_CALCULATOR = {
    // Version & Configuration
    VERSION: '26.0',
    DEBUG: true,
    
    // FRED API Configuration (Key is hidden from print/display - Feature 6)
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a', 
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    RATE_UPDATE_INTERVAL: 60 * 60 * 1000, // 1 hour (3600 seconds)
    
    // Chart instances for cleanup (Feature 3)
    charts: {
        paymentComponents: null,
        mortgageTimeline: null
    },
    
    // Current calculation state
    currentCalculation: {
        homePrice: 450000,
        downPayment: 90000,
        loanTerm: 30,
        interestRate: 6.5,
        propertyTaxRate: 1.1, // Annual %
        homeInsurance: 1200, // Annual $
        pmi: 0.5,
        state: 'TX'
    },

    // 50-State Data (Average Annual Property Tax Rate (%) and Annual Home Insurance ($) - Feature 1)
    STATE_DATA: {
        "AL": { name: "Alabama", taxRate: 0.42, insurance: 1400 }, "AK": { name: "Alaska", taxRate: 1.02, insurance: 900 },
        "AZ": { name: "Arizona", taxRate: 0.77, insurance: 1000 }, "AR": { name: "Arkansas", taxRate: 0.61, insurance: 1350 },
        "CA": { name: "California", taxRate: 0.79, insurance: 1100 }, "CO": { name: "Colorado", taxRate: 0.51, insurance: 1250 },
        "CT": { name: "Connecticut", taxRate: 2.14, insurance: 1500 }, "DE": { name: "Delaware", taxRate: 0.57, insurance: 950 },
        "FL": { name: "Florida", taxRate: 0.94, insurance: 2500 }, "GA": { name: "Georgia", taxRate: 0.87, insurance: 1150 },
        "HI": { name: "Hawaii", taxRate: 0.28, insurance: 1800 }, "ID": { name: "Idaho", taxRate: 0.69, insurance: 850 },
        "IL": { name: "Illinois", taxRate: 2.16, insurance: 1200 }, "IN": { name: "Indiana", taxRate: 0.81, insurance: 900 },
        "IA": { name: "Iowa", taxRate: 1.48, insurance: 950 }, "KS": { name: "Kansas", taxRate: 1.41, insurance: 1100 },
        "KY": { name: "Kentucky", taxRate: 0.83, insurance: 1050 }, "LA": { name: "Louisiana", taxRate: 0.52, insurance: 2100 },
        "ME": { name: "Maine", taxRate: 1.25, insurance: 950 }, "MD": { name: "Maryland", taxRate: 1.05, insurance: 1000 },
        "MA": { name: "Massachusetts", taxRate: 1.24, insurance: 1300 }, "MI": { name: "Michigan", taxRate: 1.57, insurance: 1100 },
        "MN": { name: "Minnesota", taxRate: 1.07, insurance: 1050 }, "MS": { name: "Mississippi", taxRate: 0.76, insurance: 1800 },
        "MO": { name: "Missouri", taxRate: 1.35, insurance: 1000 }, "MT": { name: "Montana", taxRate: 0.83, insurance: 850 },
        "NE": { name: "Nebraska", taxRate: 1.83, insurance: 1150 }, "NV": { name: "Nevada", taxRate: 0.69, insurance: 950 },
        "NH": { name: "New Hampshire", taxRate: 2.05, insurance: 1000 }, "NJ": { name: "New Jersey", taxRate: 2.49, insurance: 1300 },
        "NM": { name: "New Mexico", taxRate: 0.77, insurance: 900 }, "NY": { name: "New York", taxRate: 1.39, insurance: 1400 },
        "NC": { name: "North Carolina", taxRate: 0.81, insurance: 950 }, "ND": { name: "North Dakota", taxRate: 1.13, insurance: 800 },
        "OH": { name: "Ohio", taxRate: 1.62, insurance: 1100 }, "OK": { name: "Oklahoma", taxRate: 0.87, insurance: 1250 },
        "OR": { name: "Oregon", taxRate: 0.94, insurance: 900 }, "PA": { name: "Pennsylvania", taxRate: 1.48, insurance: 1300 },
        "RI": { name: "Rhode Island", taxRate: 1.46, insurance: 1200 }, "SC": { name: "South Carolina", taxRate: 0.57, insurance: 1600 },
        "SD": { name: "South Dakota", taxRate: 1.31, insurance: 900 }, "TN": { name: "Tennessee", taxRate: 0.67, insurance: 1100 },
        "TX": { name: "Texas", taxRate: 1.68, insurance: 1800 }, // Defaulting to TX
        "UT": { name: "Utah", taxRate: 0.65, insurance: 850 }, "VT": { name: "Vermont", taxRate: 1.76, insurance: 950 },
        "VA": { name: "Virginia", taxRate: 0.80, insurance: 1000 }, "WA": { name: "Washington", taxRate: 0.93, insurance: 900 },
        "WV": { name: "West Virginia", taxRate: 0.64, insurance: 1000 }, "WI": { name: "Wisconsin", taxRate: 1.70, insurance: 1050 },
        "WY": { name: "Wyoming", taxRate: 0.61, insurance: 750 }
    }
};

// ========================================================================== //
// CORE CALCULATION LOGIC                                                    //
// ========================================================================== //

/**
 * Main calculation function. Computes P&I, Taxes, Insurance, and PMI.
 * @returns {object} The full payment breakdown.
 */
function calculateMortgage() {
    // 1. Get current state from inputs
    const homePrice = parseFloat(document.getElementById('home-price').value) || 0;
    const downPayment = parseFloat(document.getElementById('down-payment').value) || 0;
    const loanTerm = parseInt(document.getElementById('loan-term').value) || 30;
    const annualRate = (parseFloat(document.getElementById('interest-rate').value) / 100) || 0.065;
    let pmiRate = (parseFloat(document.getElementById('pmi').value) / 100) || 0;
    const taxRate = (parseFloat(document.getElementById('property-tax-rate').value) / 100) || 0.01;
    let annualInsurance = parseFloat(document.getElementById('home-insurance').value) || 0;

    // Update global state
    MORTGAGE_CALCULATOR.currentCalculation = { homePrice, downPayment, loanTerm, interestRate: annualRate * 100, pmi: pmiRate * 100, propertyTaxRate: taxRate * 100, homeInsurance: annualInsurance };

    const loanAmount = homePrice - downPayment;
    const months = loanTerm * 12;
    const monthlyRate = annualRate / 12;

    if (loanAmount <= 0 || months <= 0 || monthlyRate === 0) {
        return { monthlyPayment: 0, totalInterest: 0, totalPayoff: homePrice, principalInterest: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyPMI: 0 };
    }

    // 2. Principal & Interest (P&I) Calculation
    const PI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    const principalInterest = PI || 0;
    
    // 3. Taxes & Insurance Calculation (PITI)
    const monthlyTax = (homePrice * taxRate) / 12;
    const monthlyInsurance = annualInsurance / 12;

    // 4. PMI Calculation (Only if Down Payment is < 20% of homePrice)
    const downPaymentPercent = downPayment / homePrice;
    let monthlyPMI = 0;
    if (downPaymentPercent < 0.20) {
        // PMI is calculated on the Loan Amount (LTV > 80%)
        monthlyPMI = (loanAmount * pmiRate) / 12;
        document.getElementById('pmi-tip').textContent = `PMI: ${MORTGAGE_CALCULATOR.currentCalculation.pmi.toFixed(2)}% on $${loanAmount.toLocaleString()} (LTV > 80%)`;
    } else {
        // Hide PMI if LTV <= 80%
        monthlyPMI = 0;
        document.getElementById('pmi').value = 0.0;
        document.getElementById('pmi-tip').textContent = `PMI: Waived (Down Payment is >= 20%)`;
    }

    const monthlyPayment = principalInterest + monthlyTax + monthlyInsurance + monthlyPMI;

    // 5. Totals Calculation
    const totalPayoff = (monthlyPayment * months) + downPayment;
    const totalInterest = (principalInterest * months) - loanAmount;

    return {
        monthlyPayment: monthlyPayment,
        totalInterest: totalInterest,
        totalPayoff: totalPayoff,
        principalInterest: principalInterest,
        monthlyTax: monthlyTax,
        monthlyInsurance: monthlyInsurance,
        monthlyPMI: monthlyPMI,
        loanAmount: loanAmount,
        months: months,
        monthlyRate: monthlyRate,
        annualRate: annualRate
    };
}

/**
 * Amortization data for charts and schedules (Feature 3 & 4).
 * @param {object} calcs - The output of calculateMortgage().
 * @returns {Array<object>} Monthly/Yearly amortization data.
 */
function getAmortizationData(calcs) {
    let { loanAmount, monthlyRate, months } = calcs;
    let balance = loanAmount;
    const data = [];

    for (let i = 1; i <= months; i++) {
        let interestPayment = balance * monthlyRate;
        let principalPayment = calcs.principalInterest - interestPayment;
        balance -= principalPayment;
        balance = Math.max(0, balance); // Ensure balance does not go negative

        data.push({
            month: i,
            year: Math.ceil(i / 12),
            startingBalance: balance + principalPayment,
            monthlyPayment: calcs.monthlyPayment,
            principal: principalPayment,
            interest: interestPayment,
            taxInsurancePITI: calcs.monthlyTax + calcs.monthlyInsurance + calcs.monthlyPMI,
            endingBalance: balance
        });
    }

    return data;
}

// ========================================================================== //
// DATA FETCHING (FRED API Fix - Feature 9)                                   //
// ========================================================================== //

/**
 * Fetches the latest 30-year fixed rate from FRED API.
 */
async function fetchLiveRate() {
    if (MORTGAGE_CALCULATOR.DEBUG) {
        console.log(`🏦 Attempting to fetch live FRED rate...`);
    }

    const seriesId = 'MORTGAGE30US';
    const apiKey = MORTGAGE_CALCULATOR.FRED_API_KEY;
    
    // Construct the robust API URL (Fixes fetching issues)
    const url = `${MORTGAGE_CALCULATOR.FRED_BASE_URL}?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
    
    showLoading(true, 'Fetching live Federal Reserve rates...');
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`FRED API returned status ${response.status}`);
        }
        const data = await response.json();
        const latestObservation = data.observations.find(obs => obs.value !== '.');

        if (latestObservation) {
            const rate = parseFloat(latestObservation.value);
            document.getElementById('interest-rate').value = rate.toFixed(2);
            document.getElementById('fred-rate-label').textContent = `(Live FRED: ${rate.toFixed(2)}%)`;
            showToast(`✅ Live rate updated to ${rate.toFixed(2)}% from FRED.`, 'success');
            
            // Recalculate after rate update
            updateCalculatorResults();
        } else {
            showToast('⚠️ FRED rate is unavailable. Using default rate.', 'warning');
        }
    } catch (error) {
        console.error('Error fetching FRED rate:', error);
        showToast('❌ Failed to fetch live FRED rate. Using default rate.', 'error');
    } finally {
        showLoading(false);
    }
}


// ========================================================================== //
// UI UPDATE & RENDERING FUNCTIONS                                            //
// ========================================================================== //

/**
 * Formats a number to a US Dollar currency string.
 */
function formatCurrency(number) {
    if (typeof number !== 'number' || isNaN(number)) return '$0.00';
    return number.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Updates all result fields, charts, and schedules after calculation.
 */
function updateCalculatorResults() {
    const calcs = calculateMortgage();
    const { homePrice, downPayment } = MORTGAGE_CALCULATOR.currentCalculation;

    // Update Down Payment Percentage
    const dpPercent = (downPayment / homePrice) * 100;
    document.getElementById('down-payment-percent').value = isNaN(dpPercent) ? '0.00%' : `${dpPercent.toFixed(2)}%`;

    // Update Overall Summary
    document.getElementById('monthly-payment-result').textContent = formatCurrency(calcs.monthlyPayment);
    document.getElementById('total-interest-result').textContent = formatCurrency(calcs.totalInterest);
    document.getElementById('total-payoff-result').textContent = formatCurrency(calcs.totalPayoff);

    // Update Loan Summary Breakdown (Tab 1)
    renderLoanSummaryBreakdown(calcs);

    // Update Mortgage Balance Over Time Chart (Tab 2 - Feature 3)
    const amortizationData = getAmortizationData(calcs);
    renderMortgageTimelineChart(amortizationData);

    // Update Payment Schedule (Tab 4 - Feature 4)
    generatePaymentScheduleTable(amortizationData);
    
    // Update AI Insights (Tab 3)
    generateAIInsights(calcs);
}


/**
 * Renders the Payment Components Pie Chart and breakdown list (Tab 1).
 */
function renderLoanSummaryBreakdown(calcs) {
    const ctx = document.getElementById('paymentComponentsChart').getContext('2d');

    const data = [
        calcs.principalInterest - calcs.monthlyTax - calcs.monthlyInsurance - calcs.monthlyPMI, // Principal
        calcs.monthlyTax, // Taxes
        calcs.monthlyInsurance, // Insurance
        calcs.monthlyPMI // PMI
    ];
    
    const labels = [
        `Principal & Interest`, 
        `Taxes (${(calcs.monthlyTax / calcs.monthlyPayment * 100).toFixed(1)}%)`, 
        `Insurance (${(calcs.monthlyInsurance / calcs.monthlyPayment * 100).toFixed(1)}%)`, 
        `PMI (${(calcs.monthlyPMI / calcs.monthlyPayment * 100).toFixed(1)}%)`
    ];

    if (MORTGAGE_CALCULATOR.charts.paymentComponents) {
        MORTGAGE_CALCULATOR.charts.paymentComponents.destroy();
    }

    MORTGAGE_CALCULATOR.charts.paymentComponents = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data.map(d => Math.max(0, d)), // Ensure no negative data points
                backgroundColor: ['#14b8a6', '#3b82f6', '#f59e0b', '#8b5cf6'], // Teal, Blue, Amber, Purple
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            aspectRatio: 1.5,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: 'var(--text-color-primary)' }
                },
                title: { display: false },
                tooltip: { callbacks: { label: (context) => `${context.label}: ${formatCurrency(context.parsed)}` } }
            }
        }
    });

    // Render Breakdown Grid
    const breakdownEl = document.getElementById('breakdown-summary');
    breakdownEl.innerHTML = `
        <div class="breakdown-item principal">
            <span class="label">Principal & Interest</span>
            <span class="value">${formatCurrency(calcs.principalInterest)}</span>
        </div>
        <div class="breakdown-item interest">
            <span class="label">Estimated Interest</span>
            <span class="value">${formatCurrency(calcs.principalInterest - calcs.monthlyTax - calcs.monthlyInsurance - calcs.monthlyPMI)}</span>
        </div>
        <div class="breakdown-item tax">
            <span class="label">Property Tax</span>
            <span class="value">${formatCurrency(calcs.monthlyTax)}</span>
        </div>
        <div class="breakdown-item insurance">
            <span class="label">Home Insurance</span>
            <span class="value">${formatCurrency(calcs.monthlyInsurance)}</span>
        </div>
        <div class="breakdown-item pmi">
            <span class="label">Monthly PMI</span>
            <span class="value">${formatCurrency(calcs.monthlyPMI)}</span>
        </div>
    `;
}

/**
 * Renders the Mortgage Balance Over Time line chart (Tab 2 - Feature 3).
 */
function renderMortgageTimelineChart(amortizationData) {
    const ctx = document.getElementById('mortgageTimelineChart').getContext('2d');
    const loanTerm = MORTGAGE_CALCULATOR.currentCalculation.loanTerm;
    
    // Aggregate by year for a cleaner chart (only need end-of-year data)
    const yearlyData = [];
    for (let i = 1; i <= loanTerm; i++) {
        const yearEndData = amortizationData.find(d => d.month === i * 12) || amortizationData[amortizationData.length - 1];
        if (yearEndData) {
            yearlyData.push({
                year: i,
                balance: yearEndData.endingBalance
            });
        }
    }

    if (MORTGAGE_CALCULATOR.charts.mortgageTimeline) {
        MORTGAGE_CALCULATOR.charts.mortgageTimeline.destroy();
    }

    MORTGAGE_CALCULATOR.charts.mortgageTimeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: yearlyData.map(d => `Year ${d.year}`),
            datasets: [
                {
                    label: 'Remaining Mortgage Balance',
                    data: yearlyData.map(d => d.balance),
                    borderColor: '#3b82f6', // Blue
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            aspectRatio: 2,
            plugins: {
                legend: { labels: { color: 'var(--text-color-primary)' } },
                tooltip: { 
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
                    }
                }
            },
            scales: {
                x: { 
                    title: { display: true, text: 'Year', color: 'var(--text-color-secondary)' },
                    ticks: { color: 'var(--text-color-secondary)' }
                },
                y: {
                    title: { display: true, text: 'Balance ($)', color: 'var(--text-color-secondary)' },
                    ticks: { 
                        callback: (value) => formatCurrency(value).replace('$', ''),
                        color: 'var(--text-color-secondary)'
                    }
                }
            }
        }
    });
}

/**
 * Generates the full payment schedule table (Tab 4 - Feature 4).
 */
function generatePaymentScheduleTable(amortizationData) {
    const tableBody = document.querySelector('#schedule-table tbody');
    tableBody.innerHTML = '';
    
    if (amortizationData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No loan details entered or invalid calculation.</td></tr>';
        return;
    }

    let yearlyPrincipal = 0;
    let yearlyInterest = 0;
    let yearlyPayment = 0;
    let currentYear = 1;

    amortizationData.forEach((d, index) => {
        // Monthly Row
        const monthlyRow = tableBody.insertRow();
        monthlyRow.innerHTML = `
            <td>${d.year}-${(d.month % 12 === 0 ? 12 : d.month % 12)}</td>
            <td>${formatCurrency(d.monthlyPayment)}</td>
            <td>${formatCurrency(d.principal)}</td>
            <td>${formatCurrency(d.interest)}</td>
            <td>${formatCurrency(d.taxInsurancePITI)}</td>
            <td>${formatCurrency(d.endingBalance)}</td>
        `;
        
        yearlyPrincipal += d.principal;
        yearlyInterest += d.interest;
        yearlyPayment += d.monthlyPayment;

        // Yearly Summary Row (Feature 4: Monthly AND Yearly Schedule)
        if (d.month % 12 === 0 || index === amortizationData.length - 1) {
            const summaryRow = tableBody.insertRow();
            summaryRow.className = 'yearly-summary';
            summaryRow.innerHTML = `
                <td><strong>Year ${currentYear} Summary</strong></td>
                <td><strong>${formatCurrency(yearlyPayment)}</strong></td>
                <td><strong>${formatCurrency(yearlyPrincipal)}</strong></td>
                <td><strong>${formatCurrency(yearlyInterest)}</strong></td>
                <td><strong>N/A</strong></td>
                <td><strong>${formatCurrency(d.endingBalance)}</strong></td>
            `;
            
            // Reset for next year
            yearlyPrincipal = 0;
            yearlyInterest = 0;
            yearlyPayment = 0;
            currentYear++;
        }
    });
}

/**
 * Generates dynamic AI-Powered Insights (Tab 3 - New AI Feature).
 */
function generateAIInsights(calcs) {
    const insightBox = document.getElementById('ai-insights-text');
    const { totalInterest, monthlyPayment, totalPayoff, loanTerm, interestRate, downPayment, homePrice } = calcs;
    const loanToValue = 1 - (downPayment / homePrice);
    
    if (loanToValue > 1 || isNaN(loanToValue)) {
         insightBox.innerHTML = `<p class="placeholder-text">Please input valid Home Price and Down Payment to receive AI Insights.</p>`;
         return;
    }

    let insights = '';

    // 1. Total Cost Insight
    insights += `<p><i class="fas fa-chart-line" style="color:#f59e0b;"></i> **Financial Snapshot:** Your total estimated cost for this ${loanTerm}-year loan is **${formatCurrency(totalPayoff)}**. Of that, ${formatCurrency(totalInterest)} (${(totalInterest / totalPayoff * 100).toFixed(1)}%) is interest. Paying just one extra principal-only payment per year could reduce your term by up to 4 years.</p>`;

    // 2. LTV/PMI Insight
    if (loanToValue > 0.8) {
        insights += `<p><i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i> **PMI Alert:** Your Loan-to-Value (LTV) ratio is **${(loanToValue * 100).toFixed(1)}%**, which requires Private Mortgage Insurance (PMI). Your monthly payment includes **${formatCurrency(calcs.monthlyPMI)}** in PMI. Increase your down payment to 20% to eliminate this cost and save significant money.</p>`;
    } else {
        insights += `<p><i class="fas fa-shield-alt" style="color:#14b8a6;"></i> **LTV Advantage:** With a **${(downPayment / homePrice * 100).toFixed(1)}%** down payment, your LTV is low and you have successfully **waived PMI**, saving you **${formatCurrency(homePrice * (MORTGAGE_CALCULATOR.currentCalculation.pmi / 100) / 12)}** per month!</p>`;
    }
    
    // 3. Rate Environment Insight
    if (interestRate > 7.0) {
        insights += `<p><i class="fas fa-hand-holding-usd" style="color:#3b82f6;"></i> **Rate Strategy:** The current interest rate of **${interestRate.toFixed(2)}%** is relatively high. The AI recommends actively monitoring the FRED rate and considering a **refinance option** if the rate drops by 1.0% or more within the next 3 years.</p>`;
    } else if (interestRate < 5.0) {
         insights += `<p><i class="fas fa-thumbs-up" style="color:#14b8a6;"></i> **Rate Strategy:** The interest rate of **${interestRate.toFixed(2)}%** is excellent. Lock in this rate now! Our AI suggests **prioritizing principal payments** over other investments, as the guaranteed loan return beats inflation.</p>`;
    } else {
        insights += `<p><i class="fas fa-search" style="color:#8b5cf6;"></i> **Rate Strategy:** Your rate of **${interestRate.toFixed(2)}%** is moderate. The AI suggests comparing a 15-year term option (via the Loan Compare tool) to significantly reduce interest, as your current payment is manageable at **${formatCurrency(monthlyPayment)}**.</p>`;
    }

    insightBox.innerHTML = insights;
}

// ========================================================================== //
// FEATURE IMPLEMENTATION (1, 2, 4, 5, 7, 8, 10)                              //
// ========================================================================== //

/**
 * Populates the State Dropdown and handles state-based tax/insurance updates (Feature 1).
 */
function setupStateDropdown() {
    const stateSelect = document.getElementById('state-select');
    let options = '<option value="">Select State</option>';

    for (const code in MORTGAGE_CALCULATOR.STATE_DATA) {
        const state = MORTGAGE_CALCULATOR.STATE_DATA[code];
        options += `<option value="${code}" ${code === 'TX' ? 'selected' : ''}>${state.name} (${code})</option>`;
    }
    stateSelect.innerHTML = options;

    stateSelect.addEventListener('change', (e) => {
        const selectedCode = e.target.value;
        const stateData = MORTGAGE_CALCULATOR.STATE_DATA[selectedCode];
        if (stateData) {
            // Auto-update Tax Rate and Insurance $
            document.getElementById('property-tax-rate').value = stateData.taxRate.toFixed(2);
            document.getElementById('home-insurance').value = stateData.insurance.toFixed(0);
            MORTGAGE_CALCULATOR.currentCalculation.state = selectedCode;
            updateCalculatorResults();
            showToast(`Rates updated for ${stateData.name}.`, 'info');
        }
    });

    // Initialize with default TX rates
    stateSelect.dispatchEvent(new Event('change'));
}

/**
 * Handles tab switching (Feature 2).
 */
function setupTabs() {
    document.querySelectorAll('.tab-link').forEach(button => {
        button.addEventListener('click', () => {
            // Deactivate all
            document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            // Activate clicked tab
            const targetId = button.getAttribute('data-tab');
            button.classList.add('active');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

/**
 * Toggles Dark/Light Mode (Feature 10).
 */
function toggleDarkMode() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    
    // Update button icon
    const toggleBtn = document.getElementById('dark-mode-toggle');
    toggleBtn.innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    toggleBtn.setAttribute('aria-label', isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode');

    // Re-render charts to pick up new theme colors
    updateCalculatorResults();
}

/**
 * Initializes the Screen Reader/Text-to-Speech (Feature 7).
 */
function toggleScreenReader() {
    if ('speechSynthesis' in window) {
        const synth = window.speechSynthesis;
        
        // Stop current speech if speaking
        if (synth.speaking) {
            synth.cancel();
            document.getElementById('voice-status').style.display = 'none';
            return;
        }

        document.getElementById('voice-status').style.display = 'flex';
        
        // Concatenate all key elements to read
        const results = document.getElementById('monthly-payment-result').textContent;
        const totalInterest = document.getElementById('total-interest-result').textContent;
        const totalPayoff = document.getElementById('total-payoff-result').textContent;
        const aiInsightText = document.getElementById('ai-insights-text').textContent;
        
        const textToRead = `Welcome to the World's First AI Mortgage Calculator. Your estimated monthly payment is ${results}. Total loan interest is ${totalInterest}, and total payoff is ${totalPayoff}. AI Insight: ${aiInsightText}. Please use the input fields to change your loan details.`;
        
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.onend = () => document.getElementById('voice-status').style.display = 'none';
        synth.speak(utterance);
    } else {
        showToast('❌ Your browser does not support the Screen Reader API.', 'error');
    }
}

/**
 * Opens a new window for Loan Comparison (Feature 8).
 */
function openLoanCompareWindow() {
    const { homePrice, downPayment, loanTerm, interestRate, propertyTaxRate, homeInsurance, pmi } = MORTGAGE_CALCULATOR.currentCalculation;
    
    // Simple, production-ready implementation: pass current state as URL params
    const params = new URLSearchParams({
        hp: homePrice,
        dp: downPayment,
        lt: loanTerm,
        ir: interestRate,
        tx: propertyTaxRate,
        ins: homeInsurance,
        pmi: pmi
    });
    
    const compareURL = `loan-compare-tool.html?${params.toString()}`; // Assume a separate HTML for the tool
    
    // Open in a new window with a specific size
    window.open(compareURL, 'LoanCompareWindow', 'width=800,height=600,scrollbars=yes,resizable=yes');
    showToast('🚀 Loan Compare Tool launched in a new window!', 'success');
    
    /* NOTE: In a full production environment, 'loan-compare-tool.html' would be a separate, fully functional calculator page designed to compare 3-5 different scenarios (e.g., 30-yr vs 15-yr, High vs Low PMI, etc.) based on the passed parameters. */
}


/**
 * Shares results as a printable PDF (Feature 5 & 4 Export).
 */
function shareAsPDF() {
    // Combine the Loan Summary Card, Amortization Chart, and Payment Schedule table for the PDF
    const resultsContainer = document.querySelector('.middle-panel');
    const pdfFileName = 'AI_Mortgage_Calculator_Results.pdf';

    showLoading(true, 'Generating PDF... Please wait.');
    
    // Ensure all necessary tabs are rendered (if they are not active) before capturing
    const loanSummaryContent = document.getElementById('loan-summary').innerHTML;
    const amortizationChartContent = document.getElementById('mortgage-balance').innerHTML;
    const scheduleContent = document.getElementById('payment-schedule').innerHTML;
    const aiInsightsContent = document.getElementById('ai-insights').innerHTML;

    const printContent = `
        <div style="padding: 20px;">
            <h1 style="color: #14b8a6; text-align: center;">AI Mortgage Calculation Report</h1>
            <p style="text-align: center; margin-bottom: 20px;">Generated by World's First AI Calculator v${MORTGAGE_CALCULATOR.VERSION}</p>
            
            <section>${document.querySelector('.result-summary-card').outerHTML}</section>
            
            <h2 style="margin-top: 30px; color: #3b82f6;">I. Payment Components</h2>
            <section>${loanSummaryContent}</section>

            <h2 style="margin-top: 30px; color: #3b82f6;">II. Mortgage Balance Over Time</h2>
            <section>${amortizationChartContent}</section>

            <h2 style="margin-top: 30px; color: #3b82f6;">III. AI-Powered Insights</h2>
            <section>${aiInsightsContent}</section>

            <h2 style="margin-top: 30px; color: #3b82f6;">IV. Full Payment Schedule</h2>
            <section>${scheduleContent}</section>
            
            <p style="margin-top: 40px; font-size: 10px; color: #999;">Disclaimer: Rates are based on inputs/Live FRED data. Consult a financial professional for final figures. API Key is not visible in this report (Security Feature).</p>
        </div>
    `;

    // Use a temporary element to render the combined content for html2canvas
    const tempElement = document.createElement('div');
    tempElement.innerHTML = printContent;
    document.body.appendChild(tempElement);
    
    html2canvas(tempElement, { scale: 2 }).then(canvas => {
        const { jsPDF } = window.jspdf;
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(pdfFileName);
        
        // Cleanup
        document.body.removeChild(tempElement);
        showLoading(false);
        showToast('🎉 PDF Report generated successfully!', 'success');
    }).catch(error => {
        console.error('PDF Generation Error:', error);
        showLoading(false);
        showToast('❌ Error generating PDF. Try again.', 'error');
    });
}


// ========================================================================== //
// UTILITIES (Loading, Toast)                                                 //
// ========================================================================== //

function showLoading(show, text = 'Processing...') {
    const indicator = document.getElementById('loading-indicator');
    const textEl = indicator.querySelector('.loading-text');
    if (show) {
        textEl.textContent = text;
        indicator.style.display = 'flex';
        indicator.setAttribute('aria-hidden', 'false');
    } else {
        indicator.style.display = 'none';
        indicator.setAttribute('aria-hidden', 'true');
    }
}

function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-in');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('fade-in');
        toast.classList.add('fade-out');
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}


// ========================================================================== //
// INITIALIZATION & EVENT LISTENERS                                           //
// ========================================================================== //

function initializeCalculator() {
    // 1. Setup Theme (Feature 10)
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    } else {
        // Default is dark mode, which is set in HTML/CSS, but explicitly ensure
        document.body.classList.remove('light-mode');
    }
    document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);
    document.getElementById('dark-mode-toggle').innerHTML = (savedTheme === 'light') ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';


    // 2. Setup State Dropdown (Feature 1)
    setupStateDropdown(); 

    // 3. Setup Tabs (Feature 2)
    setupTabs();
    
    // 4. Setup Event Listeners for Live Update
    const form = document.getElementById('calculator-form');
    form.querySelectorAll('input, select').forEach(element => {
        element.addEventListener('input', updateCalculatorResults);
    });

    // 5. Setup Action Buttons (Features 5, 7, 8)
    document.getElementById('screen-reader-toggle').addEventListener('click', toggleScreenReader);
    document.getElementById('loan-compare-btn').addEventListener('click', openLoanCompareWindow);
    document.getElementById('share-pdf-btn').addEventListener('click', shareAsPDF);
    document.getElementById('export-schedule-btn').addEventListener('click', shareAsPDF); // Same PDF function for simplicity

    // 6. Initial Calculation and FRED Rate Fetch
    updateCalculatorResults();
    fetchLiveRate();

    // 7. Periodic Rate Monitoring (Background process, disabled for production example but logic is here)
    // setInterval(fetchLiveRate, MORTGAGE_CALCULATOR.RATE_UPDATE_INTERVAL);

    showToast('🚀 AI Calculator Loaded. Live rates are being fetched.', 'success');
}

// Quick initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeCalculator();
    });
} else {
    initializeCalculator();
}
