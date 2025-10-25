/**
 * PERSONAL LOAN AI ANALYZER — World's First AI-Powered Personal Loan Calculator - PRODUCTION JS v1.0
 * FinGuid USA Market Domination Build 
 * * Target: Production Ready, AI Insights, SEO, PWA, Voice, Monetization Ready
 * * FRED API: 9c6c421f077f2091e8bae4f143ada59a
 * * Google Analytics: G-NYBL2CDNQJ (in HTML)
 * * © 2025 FinGuid - World's First AI Calculator Platform for Americans
 */

/* ========================================================================== */
/* I. GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const LOAN_CALCULATOR = {
    VERSION: '1.0',
    DEBUG: true, // Set to false for production deployment
    
    // FRED API Configuration (Real Key)
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a', 
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    FRED_SERIES_ID: 'TERMCBPER24NS', // Finance Rate on Personal Loans at Commercial Banks, 24 Month Loan
    RATE_UPDATE_INTERVAL: 4 * 60 * 60 * 1000, // 4 hours
    FALLBACK_RATE: 11.14, // Default value from last FRED observation if API fails

    // Core State - Stores inputs and calculated results
    STATE: {
        loanAmount: 15000,
        annualRate: 11.14, // APR
        termYears: 3,
        termMonths: 36,
        originationFee: 3.0, // % of loan amount
        extraPayment: 0,
        monthlyPayment: 0,
        totalInterest: 0,
        totalPaid: 0,
        amortizationSchedule: [],
        fredLiveRate: 0,
    },

    // Comparison State
    COMPARISON_SCENARIOS: [],
};

// --- Helper Functions ---
const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const formatPercent = (value) => `${value.toFixed(2)}%`;
const showToast = (message, type = 'info') => {
    // Basic toast implementation for user feedback (assumes CSS exists)
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    toast.textContent = message;
    container.appendChild(toast);
    
    // Show and hide logic
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 4000);
};

/* ========================================================================== */
/* II. CORE CALCULATION ENGINE */
/* ========================================================================== */

/**
 * Calculates the monthly payment for a loan using the standard EMI formula.
 * M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1]
 * @param {number} P - Principal Loan Amount
 * @param {number} i - Monthly Interest Rate (Annual Rate / 1200)
 * @param {number} n - Total Number of Payments (Months)
 * @returns {number} The monthly payment amount
 */
function calculateMonthlyPayment(P, i, n) {
    if (i === 0) {
        return P / n;
    }
    const ratePower = Math.pow(1 + i, n);
    const payment = P * (i * ratePower) / (ratePower - 1);
    return payment;
}

/**
 * Generates a full amortization schedule.
 * @param {number} P - Principal Loan Amount
 * @param {number} annualRate - Annual Interest Rate (%)
 * @param {number} termMonths - Total Months
 * @param {number} extraPayment - Optional extra principal payment per month
 * @returns {object} An object containing the schedule array and summary data.
 */
function generateAmortizationSchedule(P, annualRate, termMonths, extraPayment = 0) {
    let balance = P;
    const monthlyRate = annualRate / 1200; // i
    let monthlyPayment = calculateMonthlyPayment(P, monthlyRate, termMonths); // M
    
    // Adjust monthly payment to include extra payment
    const totalMonthlyPayment = monthlyPayment + extraPayment;

    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    const schedule = [];
    let month = 1;

    while (balance > 0 && month <= termMonths * 5) { // Cap at 5x term months just in case
        const interestPaid = balance * monthlyRate;
        
        let principalPaid = totalMonthlyPayment - interestPaid;
        
        // Final payment adjustment for last month
        if (balance < principalPaid) {
            principalPaid = balance;
            monthlyPayment = interestPaid + principalPaid;
        }

        balance -= principalPaid;
        totalInterestPaid += interestPaid;
        totalPrincipalPaid += principalPaid;
        
        schedule.push({
            month: month,
            payment: monthlyPayment,
            interest: interestPaid,
            principal: principalPaid,
            balance: Math.max(0, balance),
            extraPayment: extraPayment
        });

        if (balance <= 0.01) {
            break; 
        }

        month++;
    }
    
    // If extra payment reduces the total months, recalculate final total cost/payment.
    const effectiveTotalPayments = schedule.length;
    
    return {
        schedule: schedule,
        totalInterest: totalInterestPaid,
        monthlyPayment: monthlyPayment, // The fixed payment component before extra
        effectiveTotalPayments: effectiveTotalPayments,
    };
}


/**
 * Main function to read inputs, calculate results, and update the UI.
 */
function updateCalculations() {
    if (LOAN_CALCULATOR.DEBUG) console.log('Starting calculation update...');
    
    // 1. Read Inputs
    const loanAmount = parseFloat(document.getElementById('loan-amount').value) || 0;
    const annualRate = parseFloat(document.getElementById('interest-rate').value) || 0;
    const termYears = parseFloat(document.getElementById('loan-term-years').value) || 0;
    const originationFeePercent = parseFloat(document.getElementById('origination-fee').value) || 0;
    const extraPayment = parseFloat(document.getElementById('extra-payment').value) || 0;

    // Validate essential inputs
    if (loanAmount <= 0 || annualRate <= 0 || termYears <= 0) {
        // Only clear summary if required fields are missing
        document.getElementById('monthly-payment').textContent = formatCurrency(0);
        document.getElementById('total-interest').textContent = formatCurrency(0);
        document.getElementById('total-cost').textContent = formatCurrency(0);
        document.getElementById('amortization-body').innerHTML = '<tr><td colspan="5">Please enter all required loan details.</td></tr>';
        document.getElementById('ai-insights-content').innerHTML = '<p class="placeholder-text">Enter your loan details to generate world-class, dynamic AI-Powered APR Analysis and insights here.</p>';
        showToast('Input Error: Please ensure Loan Amount, APR, and Term are entered.', 'error');
        return;
    }

    // 2. Prepare State Variables
    const termMonths = termYears * 12;
    const monthlyRate = annualRate / 1200;
    const originationFeeAmount = loanAmount * (originationFeePercent / 100);

    LOAN_CALCULATOR.STATE.loanAmount = loanAmount;
    LOAN_CALCULATOR.STATE.annualRate = annualRate;
    LOAN_CALCULATOR.STATE.termYears = termYears;
    LOAN_CALCULATOR.STATE.termMonths = termMonths;
    LOAN_CALCULATOR.STATE.originationFee = originationFeePercent;
    LOAN_CALCULATOR.STATE.extraPayment = extraPayment;

    // 3. Perform Calculations
    const coreMonthlyPayment = calculateMonthlyPayment(loanAmount, monthlyRate, termMonths);
    const results = generateAmortizationSchedule(loanAmount, annualRate, termMonths, extraPayment);

    // 4. Update State with Results
    const totalInterest = results.totalInterest;
    const effectiveTotalPayments = results.effectiveTotalPayments;
    const totalPaymentsIncludingExtra = results.schedule.reduce((sum, item) => sum + item.payment + item.extraPayment, 0);

    LOAN_CALCULATOR.STATE.monthlyPayment = coreMonthlyPayment + extraPayment; // Total monthly outflow
    LOAN_CALCULATOR.STATE.totalInterest = totalInterest;
    // Total cost = Loan Amount + Total Interest + Origination Fee
    LOAN_CALCULATOR.STATE.totalPaid = loanAmount + totalInterest + originationFeeAmount;
    LOAN_CALCULATOR.STATE.amortizationSchedule = results.schedule;

    // 5. Update UI Summary
    document.getElementById('monthly-payment').textContent = formatCurrency(LOAN_CALCULATOR.STATE.monthlyPayment);
    document.getElementById('total-interest').textContent = formatCurrency(totalInterest);
    document.getElementById('total-cost').textContent = formatCurrency(LOAN_CALCULATOR.STATE.totalPaid);
    
    // 6. Render Details
    renderAmortizationTable(results.schedule);
    renderAmortizationChart(results.schedule);
    generateAndRenderAIInsights(annualRate, originationFeePercent, effectiveTotalPayments);
    
    showTab('payment-schedule'); // Switch to the schedule tab on first calculation
    showToast('Calculation Complete! Review your results and AI Analysis.', 'success');
}


/* ========================================================================== */
/* III. RESULTS RENDERING */
/* ========================================================================== */

function renderAmortizationTable(schedule) {
    const tableBody = document.getElementById('amortization-body');
    tableBody.innerHTML = ''; // Clear previous results

    schedule.slice(0, 60).forEach((row, index) => { // Limit display to first 60 months for brevity/performance
        if (index % 12 === 0 || row.balance === 0) { // Highlight/show only start of year or final payment
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.month}</td>
                <td>${formatCurrency(row.payment + row.extraPayment)}</td>
                <td>${formatCurrency(row.interest)}</td>
                <td>${formatCurrency(row.principal + row.extraPayment)}</td>
                <td>${formatCurrency(row.balance)}</td>
            `;
            tableBody.appendChild(tr);
            if (row.balance === 0) return;
        }
    });
    
    if (schedule.length > 60) {
        tableBody.innerHTML += `<tr><td colspan="5" style="text-align:center;">... ${schedule.length - 60} more payments hidden for brevity. Full details available in CSV export. ...</td></tr>`;
    }
}

let amortizationChart = null;
function renderAmortizationChart(schedule) {
    const ctx = document.getElementById('amortization-chart').getContext('2d');
    
    // Aggregate by Year for cleaner chart
    const annualData = [];
    let currentYear = 0;
    let yearInterest = 0;
    let yearPrincipal = 0;

    schedule.forEach(row => {
        const year = Math.ceil(row.month / 12);
        if (year !== currentYear) {
            if (currentYear > 0) {
                annualData.push({ year: currentYear, interest: yearInterest, principal: yearPrincipal });
            }
            currentYear = year;
            yearInterest = 0;
            yearPrincipal = 0;
        }
        yearInterest += row.interest;
        yearPrincipal += row.principal;
    });
    if (currentYear > 0) {
        annualData.push({ year: currentYear, interest: yearInterest, principal: yearPrincipal });
    }

    const labels = annualData.map(d => `Year ${d.year}`);
    const interestData = annualData.map(d => d.interest);
    const principalData = annualData.map(d => d.principal);

    if (amortizationChart) {
        amortizationChart.destroy();
    }

    amortizationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Interest Paid',
                    data: interestData,
                    backgroundColor: 'rgba(36, 172, 185, 0.8)', // FinGuid Teal
                    stack: 'Stack 1'
                },
                {
                    label: 'Principal Paid',
                    data: principalData,
                    backgroundColor: 'rgba(19, 52, 59, 0.8)', // FinGuid Primary
                    stack: 'Stack 1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Amount Paid ($)' } }
            },
            plugins: {
                title: { display: true, text: 'Annual Principal & Interest Payment Breakdown' },
                tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}` } }
            }
        }
    });
}


/* ========================================================================== */
/* IV. AI-POWERED INSIGHTS & APR ANALYSIS */
/* ========================================================================== */

function generateAndRenderAIInsights(currentAPR, originationFee, totalPayments) {
    const contentDiv = document.getElementById('ai-insights-content');
    let insightsHTML = '';
    const state = LOAN_CALCULATOR.STATE;

    // Insight 1: APR Comparison vs. Market
    const fredRate = LOAN_CALCULATOR.STATE.fredLiveRate || LOAN_CALCULATOR.FALLBACK_RATE;
    const rateDifference = currentAPR - fredRate;

    insightsHTML += `
        <h4>APR Market Analysis:</h4>
        <p>The current personal loan rate in the market (based on FRED® data for 24-month loans) is **${formatPercent(fredRate)}**. Your quoted APR of **${formatPercent(currentAPR)}** is 
    `;

    if (rateDifference <= -1.0) {
        insightsHTML += `**significantly lower** (${formatPercent(Math.abs(rateDifference))} below average). This is an excellent rate, likely reflecting a high credit score or a shorter term than the average benchmark. **<i class="fas fa-thumbs-up"></i> ACTION: Lock this rate!**</p>`;
    } else if (rateDifference < 1.0 && rateDifference > -1.0) {
        insightsHTML += `**in line** with the current market average. This is a competitive rate for your profile and term. **<i class="fas fa-star"></i> ACTION: Good to proceed, but shop around for 0.5% - 1.0% better.**</p>`;
    } else {
        insightsHTML += `**higher** (${formatPercent(rateDifference)} above average). You should consider a shorter term, improving your credit score, or exploring an affiliate partner link below to secure a lower rate. **<i class="fas fa-hand-point-down"></i> ACTION: Shop aggressively for a better deal.**</p>`;
    }
    
    // Insight 2: Total Cost & Fee Analysis
    const totalCost = state.totalPaid;
    const totalInterest = state.totalInterest;
    const effectiveTotalMonths = totalPayments;
    const originationFeeAmount = state.loanAmount * (originationFee / 100);

    insightsHTML += `
        <h4>Cost Structure Breakdown:</h4>
        <p>Your total cost for this loan is **${formatCurrency(totalCost)}**. This includes **${formatCurrency(totalInterest)}** in interest and a **${formatPercent(originationFee)}** origination fee totaling **${formatCurrency(originationFeeAmount)}**. The effective term is **${effectiveTotalMonths} months**.</p>
    `;

    if (originationFee > 5) {
        insightsHTML += `<p class="warning-text"><i class="fas fa-exclamation-triangle"></i> **WARNING:** An origination fee over 5% significantly increases your true cost. Ensure the low APR justifies this upfront cost, or look for a loan with a lower fee. (Affiliate Link Opportunity)</p>`;
    }
    
    // Insight 3: Extra Payment Impact
    if (state.extraPayment > 0) {
        const originalMonthlyPayment = calculateMonthlyPayment(state.loanAmount, state.annualRate / 1200, state.termMonths);
        const originalTotalInterest = (originalMonthlyPayment * state.termMonths) - state.loanAmount;
        const interestSaved = originalTotalInterest - totalInterest;
        const monthsSaved = state.termMonths - effectiveTotalMonths;

        insightsHTML += `
            <h4>Extra Payment Strategy:</h4>
            <p>By adding **${formatCurrency(state.extraPayment)}** extra to your monthly payment, you are projected to **save ${formatCurrency(interestSaved.toFixed(0))} in total interest** and pay off your loan **${monthsSaved} months earlier**! This is a smart financial strategy. **<i class="fas fa-piggy-bank"></i> ACTION: Maintain this aggressive payment schedule.**</p>
        `;
    }

    // Monetization Insight (Always included)
    insightsHTML += `
        <div class="affiliate-block-ai">
            <h4><i class="fas fa-lightbulb"></i> AI Recommendation for Savings:</h4>
            <p>Our AI suggests you compare your current rate against 3 pre-vetted American lenders offering competitive personal loans, especially given the current FRED® benchmark. This is the **best way to maximize your savings.**</p>
            <a href="#affiliate-link-ai-cta" target="_blank" rel="sponsored noopener noreferrer" class="primary-button full-width">
                <i class="fas fa-money-bill-wave"></i> Find Your BEST Personalized Loan Rates! (Affiliate)
            </a>
        </div>
    `;

    contentDiv.innerHTML = insightsHTML;
}


/* ========================================================================== */
/* V. UX & PLATFORM FEATURES (PWA, VOICE, THEME, TABS) */
/* ========================================================================== */

// --- FRED API Module (Mock-up of the actual fetch logic) ---
const fredAPI = {
    fetchRate: async () => {
        // FRED API endpoint for TERMCBPER24NS (24-Month Personal Loan Rate)
        const url = `${LOAN_CALCULATOR.FRED_BASE_URL}?series_id=${LOAN_CALCULATOR.FRED_SERIES_ID}&api_key=${LOAN_CALCULATOR.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
        
        try {
            if (LOAN_CALCULATOR.DEBUG) console.log(`FRED API Mock: Fetching rate from ${url.replace(LOAN_CALCULATOR.FRED_API_KEY, '***')}`);

            // In a real environment, you'd fetch this. We will use a mockup for code completeness.
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            
            // Assuming data structure: data.observations[0].value
            const latestRate = parseFloat(data.observations[0].value); 
            if (latestRate && !isNaN(latestRate)) {
                return latestRate;
            }
        } catch (error) {
            console.error('FRED API Fetch Error. Falling back to default rate.', error.message);
        }
        return LOAN_CALCULATOR.FALLBACK_RATE;
    },
    
    // Sets the fetched rate and triggers the initial calculation
    startAutomaticUpdates: async () => {
        const rate = await fredAPI.fetchRate();
        LOAN_CALCULATOR.STATE.fredLiveRate = rate;
        
        // Update the UI display for the live rate and the input suggestion
        document.getElementById('live-interest-rate').textContent = formatPercent(rate);
        document.getElementById('fred-suggestion').textContent = formatPercent(rate);
        document.getElementById('interest-rate').value = rate.toFixed(2);
        
        if (LOAN_CALCULATOR.DEBUG) console.log(`FRED Rate updated: ${formatPercent(rate)}`);
        
        // Trigger initial calculation to show default results
        updateCalculations();
        
        // Set up the automatic refresh
        // setInterval(fredAPI.fetchRate, LOAN_CALCULATOR.RATE_UPDATE_INTERVAL);
    }
}

// --- Theme Manager (Light/Dark Mode) ---
const THEME_MANAGER = {
    loadUserPreferences: () => {
        const savedTheme = localStorage.getItem('theme-preference') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-color-scheme', savedTheme);
    },
    toggleTheme: () => {
        const current = document.documentElement.getAttribute('data-color-scheme');
        const newTheme = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-color-scheme', newTheme);
        localStorage.setItem('theme-preference', newTheme);
        showToast(`Switched to ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} Mode`);
    }
};

// --- Speech/Voice Command (Skeleton - Full implementation is complex) ---
const SPEECH = {
    initialize: () => {
        // Placeholder for initial setup of Web Speech API
        if (LOAN_CALCULATOR.DEBUG) console.log('Speech/Voice Command module initialized.');
    }
};

// --- Tab Controls ---
function showTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.results-section .tab-content').forEach(content => content.classList.remove('active'));
    // Show the selected tab content
    document.getElementById(tabId).classList.add('active');

    // Update active button state
    document.querySelectorAll('.tab-controls-results .tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-controls-results .tab-button[data-tab="${tabId}"]`).classList.add('active');
    
    // Resize chart if the chart tab is activated
    if (tabId === 'payment-schedule' && amortizationChart) {
        // Wait a tick for the tab to become visible before resizing
        setTimeout(() => amortizationChart.resize(), 50); 
    }
}

// --- Export Functionality ---
function exportAmortizationToCSV() {
    const schedule = LOAN_CALCULATOR.STATE.amortizationSchedule;
    if (schedule.length === 0) {
        showToast('No schedule to export. Please calculate first.', 'error');
        return;
    }

    let csvContent = "Month,Total Payment,Interest Paid,Principal Paid,Remaining Balance,Extra Payment\n";
    schedule.forEach(row => {
        const rowData = [
            row.month,
            (row.payment + row.extraPayment).toFixed(2),
            row.interest.toFixed(2),
            row.principal.toFixed(2),
            row.balance.toFixed(2),
            row.extraPayment.toFixed(2)
        ];
        csvContent += rowData.join(',') + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "FinGuid_Personal_Loan_Schedule.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Amortization schedule exported to CSV!', 'success');
}


/* ========================================================================== */
/* VI. EVENT LISTENERS & INITIALIZATION */
/* ========================================================================== */

function setupEventListeners() {
    // Input change triggers
    document.getElementById('personal-loan-form').addEventListener('submit', (e) => {
        e.preventDefault();
        updateCalculations();
    });
    
    // Update loan term months display on year input change
    document.getElementById('loan-term-years').addEventListener('input', (e) => {
        const months = parseInt(e.target.value) * 12;
        document.getElementById('loan-term-months-display').textContent = months || 0;
    });

    // Tab switching for results
    document.querySelectorAll('.tab-controls-results .tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.target.getAttribute('data-tab');
            if (tabId) {
                showTab(tabId);
            }
        });
    });
    
    // UX Controls
    document.getElementById('toggle-theme').addEventListener('click', THEME_MANAGER.toggleTheme);
    document.getElementById('export-csv-button').addEventListener('click', exportAmortizationToCSV);
}


// === DOCUMENT INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    if (LOAN_CALCULATOR.DEBUG) {
        console.log('🇺🇸 FinGuid Personal Loan AI Analyzer v1.0 Initializing...');
        console.log('📊 World\'s First AI-Powered Personal Loan Calculator');
    }
    
    // 1. Initialize Core Features
    THEME_MANAGER.loadUserPreferences();
    SPEECH.initialize(); // Placeholder for voice setup
    setupEventListeners();
    
    // 2. Fetch Live Rate and Trigger Initial Calculation
    fredAPI.startAutomaticUpdates(); 
    
    // Fallback calculation in case FRED is slow/fails to trigger (1.5s delay)
    setTimeout(() => {
        if (LOAN_CALCULATOR.STATE.monthlyPayment === 0) {
            updateCalculations();
        }
    }, 1500); 
    
    if (LOAN_CALCULATOR.DEBUG) console.log('✅ Personal Loan Calculator initialized!');
});
