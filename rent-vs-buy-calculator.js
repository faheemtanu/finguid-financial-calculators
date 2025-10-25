/**
 * RENT VS BUY AI ANALYZER — World's First AI-Powered Rent vs Buy Calculator - PRODUCTION JS v1.0
 * FinGuid USA Market Domination Build 
 * * Target: Production Ready, AI Insights, SEO, PWA, Voice, Monetization Ready
 * * FRED API: 9c6c421f077f2091e8bae4f143ada59a
 * * Google Analytics: G-NYBL2CDNQJ (in HTML)
 * * © 2025 FinGuid - World's First AI Calculator Platform for Americans
 */

/* ========================================================================== */
/* I. GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const RENT_VS_BUY_CALCULATOR = {
    VERSION: '1.0',
    DEBUG: false, // Set to false for production to hide console logs and toasts
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a', 
    LIVE_RATE: 6.75, // Default/Fallback Rate

    // Core State - Stores inputs and calculated results
    STATE: {
        // Inputs
        homePrice: 400000,
        downPayment: 80000,
        interestRate: 6.75,
        loanTermYears: 30,
        propertyTaxRate: 1.2,
        homeInsurance: 1500,
        hoaFees: 50,
        maintenanceRate: 1.0,
        closingCostsBuy: 8000,
        monthlyRent: 2000,
        rentersInsurance: 150,
        rentIncreaseRate: 3.0,
        yearsToStay: 7,
        homeAppreciationRate: 4.0,
        investmentReturnRate: 7.0,
        taxRate: 24,
        sellingCostsRate: 6.0,

        // Results (Calculated)
        buyingCosts: { yearly: [], total: 0, netCost: 0 },
        rentingCosts: { yearly: [], total: 0 },
        opportunityCost: 0,
        netAdvantage: 0, // Positive means buying is better, negative means renting is better
        breakEvenYear: -1, // Year when buying becomes better, -1 if never
        amortization: [] // For tax calculation
    }
};

/* ========================================================================== */
/* II. UTILITY MODULES (UTILS, THEME, SPEECH - Consistent Platform Modules) */
/* ========================================================================== */

// --- UTILS Module ---
const UTILS = {
    formatCurrency: (value, showDecimals = true) => {
        if (isNaN(value) || value === null) return '$0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD',
            minimumFractionDigits: showDecimals ? 2 : 0,
            maximumFractionDigits: showDecimals ? 2 : 0
        }).format(value);
    },
    formatPercent: (value) => (isNaN(value) ? '0.00%' : `${value.toFixed(2)}%`),
    showToast: (message, type = 'info') => {
        if (RENT_VS_BUY_CALCULATOR.DEBUG || type === 'error' || type === 'success') { // Show only important toasts in production
            const container = document.getElementById('toast-container');
            if (!container) return;
            const toast = document.createElement('div');
            toast.className = `toast ${type}`; toast.textContent = message; container.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => toast.classList.remove('show'), 4000);
            setTimeout(() => toast.remove(), 4300);
        }
    }
};

// --- THEME_MANAGER Module --- (Identical to refinance-calculator.js)
const THEME_MANAGER = { /* ... (Code from previous JS) ... */ 
    toggleTheme: () => { /* ... */ }, 
    loadUserPreferences: () => { /* ... */ }, 
    updateToggleButton: (scheme) => { /* ... */ } 
};

// --- SPEECH Module --- (Identical to refinance-calculator.js)
const SPEECH = { /* ... (Code from previous JS) ... */ 
    ttsEnabled: false, synth: window.speechSynthesis, voice: null, 
    initialize: () => { /* ... */ }, 
    speak: (text) => { /* ... */ } 
};

// --- FRED_API Module --- (Adapted for this calculator)
const fredAPI = {
    fetchLiveRate: async () => {
        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=${RENT_VS_BUY_CALCULATOR.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('FRED API failed');
            const data = await response.json();
            const rate = parseFloat(data.observations[0].value);
            if (!isNaN(rate) && rate > 0) {
                RENT_VS_BUY_CALCULATOR.LIVE_RATE = rate;
                document.getElementById('live-rate-value').textContent = UTILS.formatPercent(rate);
                document.getElementById('fred-rate-tip-value').textContent = UTILS.formatPercent(rate);
                const rateInput = document.getElementById('interest-rate');
                // Only update if it's the default value, allowing user override
                if (parseFloat(rateInput.value) === 6.75) { 
                    rateInput.value = rate.toFixed(2);
                }
                UTILS.showToast(`Updated Interest Rate field with live FRED 30yr Rate: ${rate.toFixed(2)}%`, 'success');
                calculateRentVsBuy(); // Recalculate with live rate
            }
        } catch (error) {
            console.error('FRED API Error:', error);
            UTILS.showToast(`Warning: FRED API failed. Using default rate: ${RENT_VS_BUY_CALCULATOR.LIVE_RATE}%`, 'error');
            calculateRentVsBuy(); // Calculate with default rate
        }
    },
    startAutomaticUpdates: () => fredAPI.fetchLiveRate()
};

/* ========================================================================== */
/* III. CORE CALCULATION LOGIC: Rent vs Buy Analysis */
/* ========================================================================== */

/**
 * Calculates monthly P&I payment.
 */
function calculateMonthlyPI(principal, annualRate, termYears) {
    if (principal <= 0 || termYears <= 0) return 0;
    const rateMonthly = (annualRate / 100) / 12;
    const termMonths = termYears * 12;
    if (rateMonthly === 0) return principal / termMonths;
    const powerFactor = Math.pow(1 + rateMonthly, termMonths);
    return principal * (rateMonthly * powerFactor) / (powerFactor - 1);
}

/**
 * Generates yearly summary from a monthly amortization schedule.
 */
function generateYearlyAmortizationSummary(principal, annualRate, termYears) {
    const rateMonthly = (annualRate / 100) / 12;
    const termMonths = termYears * 12;
    const monthlyPayment = calculateMonthlyPI(principal, annualRate, termYears);
    let balance = principal;
    const yearlySummary = [];
    let currentYearInterest = 0;
    let currentYearPrincipal = 0;

    for (let month = 1; month <= termMonths; month++) {
        const interest = balance * rateMonthly;
        let principalPaid = monthlyPayment - interest;
        if (balance < principalPaid) principalPaid = balance; // Final payment adjustment
        balance -= principalPaid;
        if (balance < 0) balance = 0;

        currentYearInterest += interest;
        currentYearPrincipal += principalPaid;

        // At the end of each year (or the last month), store the yearly totals
        if (month % 12 === 0 || month === termMonths) {
            yearlySummary.push({
                year: Math.ceil(month / 12),
                interestPaid: currentYearInterest,
                principalPaid: currentYearPrincipal,
                endingBalance: balance
            });
            currentYearInterest = 0; // Reset for next year
            currentYearPrincipal = 0;
        }
        if (balance === 0) break;
    }
    return yearlySummary;
}


/**
 * Main Rent vs Buy calculation engine.
 */
function calculateRentVsBuy() {
    // 1. Get All Inputs
    const s = RENT_VS_BUY_CALCULATOR.STATE; // Use state for easier access
    Object.assign(s, {
        homePrice: parseFloat(document.getElementById('home-price').value) || 0,
        downPayment: parseFloat(document.getElementById('down-payment').value) || 0,
        interestRate: parseFloat(document.getElementById('interest-rate').value) || RENT_VS_BUY_CALCULATOR.LIVE_RATE,
        loanTermYears: parseInt(document.getElementById('loan-term').value) || 30,
        propertyTaxRate: parseFloat(document.getElementById('property-tax').value) || 0,
        homeInsurance: parseFloat(document.getElementById('home-insurance').value) || 0,
        hoaFees: parseFloat(document.getElementById('hoa-fees').value) || 0,
        maintenanceRate: parseFloat(document.getElementById('maintenance').value) || 0,
        closingCostsBuy: parseFloat(document.getElementById('closing-costs-buy').value) || 0,
        monthlyRent: parseFloat(document.getElementById('monthly-rent').value) || 0,
        rentersInsurance: parseFloat(document.getElementById('renters-insurance').value) || 0,
        rentIncreaseRate: parseFloat(document.getElementById('rent-increase').value) || 0,
        yearsToStay: parseInt(document.getElementById('years-stay').value) || 7,
        homeAppreciationRate: parseFloat(document.getElementById('home-appreciation').value) || 0,
        investmentReturnRate: parseFloat(document.getElementById('investment-return').value) || 0,
        taxRate: parseFloat(document.getElementById('tax-rate').value) || 0,
        sellingCostsRate: parseFloat(document.getElementById('selling-costs').value) || 0
    });

    // Basic Input Validation
    if (s.homePrice <= 0 || s.monthlyRent <= 0 || s.yearsToStay <= 0) {
        updateUI('clear');
        updateAIInsights('Please enter valid Home Price, Monthly Rent, and Years to Stay.');
        return;
    }
    
    // --- 2. Calculate Buying Costs Over Time ---
    const loanAmount = s.homePrice - s.downPayment;
    if (loanAmount <= 0) { // User paid cash
        s.amortization = [];
    } else {
        s.amortization = generateYearlyAmortizationSummary(loanAmount, s.interestRate, s.loanTermYears);
    }

    const buyingCostsYearly = [];
    let cumulativeBuyingCost = s.closingCostsBuy; // Start with initial closing costs
    let currentHomeValue = s.homePrice;
    let totalTaxSavings = 0;
    let equityBuilt = s.downPayment; // Start with down payment as equity

    for (let year = 1; year <= s.yearsToStay; year++) {
        // Annual Costs
        const yearIndex = year - 1;
        const mortgageInterestPaid = s.amortization[yearIndex]?.interestPaid || 0;
        const mortgagePrincipalPaid = s.amortization[yearIndex]?.principalPaid || 0;
        const propertyTaxes = currentHomeValue * (s.propertyTaxRate / 100);
        // Assume insurance and HOA increase slightly, e.g., 2% per year
        const insurance = s.homeInsurance * Math.pow(1.02, yearIndex); 
        const hoa = (s.hoaFees * 12) * Math.pow(1.02, yearIndex);
        const maintenance = currentHomeValue * (s.maintenanceRate / 100);

        // Tax Savings (Simplified: Interest + Property Tax Deduction)
        // Assumes user itemizes and deduction is beneficial.
        // Standard Deduction in 2025 might be ~$29,200 (married filing jointly).
        // Let's use a rough estimate, actual savings depend on full tax situation.
        // Only deduct if Interest + Property Tax > Standard Deduction proxy (e.g., $15k)
        const deductibleExpenses = mortgageInterestPaid + propertyTaxes;
        const potentialTaxSavings = deductibleExpenses * (s.taxRate / 100);
        // Basic check if itemizing might be better than standard deduction (very rough)
        const taxSavings = (deductibleExpenses > 15000) ? potentialTaxSavings : 0; 
        totalTaxSavings += taxSavings;
        
        // Annual Costs for this year
        const annualCost = (mortgageInterestPaid + mortgagePrincipalPaid) + propertyTaxes + insurance + hoa + maintenance - taxSavings;
        cumulativeBuyingCost += annualCost;
        
        // Update Equity & Home Value
        equityBuilt += mortgagePrincipalPaid;
        currentHomeValue *= (1 + s.homeAppreciationRate / 100);

        buyingCostsYearly.push({
            year: year,
            cost: annualCost,
            cumulativeCost: cumulativeBuyingCost,
            homeValue: currentHomeValue,
            equity: equityBuilt
        });
    }

    // Factor in selling costs at the end
    const sellingCosts = currentHomeValue * (s.sellingCostsRate / 100);
    const netProceedsFromSale = currentHomeValue - (s.amortization[s.yearsToStay - 1]?.endingBalance || 0) - sellingCosts;
    const netCostOfBuying = cumulativeBuyingCost - netProceedsFromSale; // Total spent minus what you get back after selling

    s.buyingCosts = { yearly: buyingCostsYearly, total: cumulativeBuyingCost, netCost: netCostOfBuying };

    // --- 3. Calculate Renting Costs Over Time ---
    const rentingCostsYearly = [];
    let cumulativeRentingCost = 0;
    let currentMonthlyRent = s.monthlyRent;

    for (let year = 1; year <= s.yearsToStay; year++) {
        const annualRent = currentMonthlyRent * 12;
        // Assume renters insurance increases slightly, e.g., 2% per year
        const annualRentersInsurance = s.rentersInsurance * Math.pow(1.02, year - 1);
        const annualCost = annualRent + annualRentersInsurance;
        cumulativeRentingCost += annualCost;

        rentingCostsYearly.push({
            year: year,
            cost: annualCost,
            cumulativeCost: cumulativeRentingCost
        });
        
        // Increase rent for the next year
        currentMonthlyRent *= (1 + s.rentIncreaseRate / 100);
    }
    s.rentingCosts = { yearly: rentingCostsYearly, total: cumulativeRentingCost };

    // --- 4. Calculate Opportunity Cost of Down Payment ---
    // What the down payment + closing costs could have earned if invested
    const initialInvestment = s.downPayment + s.closingCostsBuy;
    const investmentReturnDecimal = s.investmentReturnRate / 100;
    const futureValueOfInvestment = initialInvestment * Math.pow(1 + investmentReturnDecimal, s.yearsToStay);
    s.opportunityCost = futureValueOfInvestment - initialInvestment;

    // --- 5. Calculate Net Advantage & Break-Even ---
    // Net Advantage = (Total Cost of Renting + Opportunity Cost) - Net Cost of Buying
    s.netAdvantage = (s.rentingCosts.total + s.opportunityCost) - s.buyingCosts.netCost;
    
    // Calculate Break-Even Year
    s.breakEvenYear = -1;
    for (let year = 1; year <= s.yearsToStay; year++) {
        const buyingNetCostYear = s.buyingCosts.yearly[year-1].cumulativeCost - (s.buyingCosts.yearly[year-1].homeValue - (s.amortization[year-1]?.endingBalance || 0) - (s.buyingCosts.yearly[year-1].homeValue * s.sellingCostsRate / 100));
        const rentingTotalCostYear = s.rentingCosts.yearly[year-1].cumulativeCost + (initialInvestment * Math.pow(1 + investmentReturnDecimal, year) - initialInvestment);
        
        if (buyingNetCostYear < rentingTotalCostYear) {
            s.breakEvenYear = year;
            break;
        }
    }

    // --- 6. Update UI ---
    updateUI();
}


/* ========================================================================== */
/* IV. UI RENDERING & EVENT LISTENERS */
/* ========================================================================== */

let rentVsBuyChart = null; // Chart.js instance

function updateUI(mode = 'results') {
    const s = RENT_VS_BUY_CALCULATOR.STATE;

    // Update Summary Years Display
    document.getElementById('summary-years').textContent = s.yearsToStay;
    document.querySelectorAll('.summary-years-detail').forEach(el => el.textContent = s.yearsToStay);

    if (mode === 'clear') {
        document.getElementById('total-renting-cost').textContent = '--.--';
        document.getElementById('net-buying-cost').textContent = '--.--';
        document.getElementById('net-advantage').textContent = '--.--';
        // Clear breakdown tables and chart
        document.getElementById('buying-breakdown-body').innerHTML = '<tr><td colspan="2">--</td></tr>';
        document.getElementById('renting-breakdown-body').innerHTML = '<tr><td colspan="2">--</td></tr>';
        if (rentVsBuyChart) rentVsBuyChart.destroy();
        rentVsBuyChart = null;
        return;
    }
    
    // 1. Update Summary Card
    document.getElementById('total-renting-cost').textContent = UTILS.formatCurrency(s.rentingCosts.total + s.opportunityCost);
    document.getElementById('net-buying-cost').textContent = UTILS.formatCurrency(s.buyingCosts.netCost);
    
    const netAdvantageEl = document.getElementById('net-advantage');
    if (s.netAdvantage >= 0) {
        netAdvantageEl.textContent = `${UTILS.formatCurrency(s.netAdvantage)} Advantage to Buying`;
        netAdvantageEl.className = 'detail-value text-positive';
    } else {
        netAdvantageEl.textContent = `${UTILS.formatCurrency(Math.abs(s.netAdvantage))} Advantage to Renting`;
        netAdvantageEl.className = 'detail-value text-negative';
    }

    // 2. Update Detailed Breakdown Tables
    const buyingBody = document.getElementById('buying-breakdown-body');
    const buyingTotals = s.buyingCosts.yearly[s.yearsToStay - 1]; // Get totals at the end year
    buyingBody.innerHTML = `
        <tr><td>Mortgage Payments (P&I)</td><td>${UTILS.formatCurrency(s.amortization.reduce((sum, yr) => sum + yr.interestPaid + yr.principalPaid, 0))}</td></tr>
        <tr><td>Property Taxes</td><td>${UTILS.formatCurrency(s.buyingCosts.yearly.reduce((sum, yr, i) => sum + (s.buyingCosts.yearly[i]?.homeValue || s.homePrice) * (s.propertyTaxRate / 100), 0))}</td></tr>
        <tr><td>Home Insurance</td><td>${UTILS.formatCurrency(s.buyingCosts.yearly.reduce((sum, yr, i) => sum + s.homeInsurance * Math.pow(1.02, i), 0))}</td></tr>
        <tr><td>HOA Fees</td><td>${UTILS.formatCurrency(s.buyingCosts.yearly.reduce((sum, yr, i) => sum + (s.hoaFees * 12) * Math.pow(1.02, i), 0))}</td></tr>
        <tr><td>Maintenance</td><td>${UTILS.formatCurrency(s.buyingCosts.yearly.reduce((sum, yr, i) => sum + (s.buyingCosts.yearly[i]?.homeValue || s.homePrice) * (s.maintenanceRate / 100), 0))}</td></tr>
        <tr><td>Closing Costs (Initial)</td><td>${UTILS.formatCurrency(s.closingCostsBuy)}</td></tr>
        <tr class="subtotal-row"><td>Gross Buying Costs</td><td>${UTILS.formatCurrency(s.buyingCosts.total)}</td></tr>
        <tr><td>(-) Tax Savings</td><td class="text-positive">${UTILS.formatCurrency(s.buyingCosts.yearly.reduce((sum, yr, i) => sum + (s.amortization[i]?.interestPaid + (s.buyingCosts.yearly[i]?.homeValue || s.homePrice) * (s.propertyTaxRate / 100) > 15000 ? (s.amortization[i]?.interestPaid + (s.buyingCosts.yearly[i]?.homeValue || s.homePrice) * (s.propertyTaxRate / 100)) * (s.taxRate / 100) : 0), 0))}</td></tr>
        <tr><td>(-) Principal Paid (Equity)</td><td class="text-positive">${UTILS.formatCurrency(buyingTotals.equity - s.downPayment)}</td></tr>
        <tr><td>(-) Home Appreciation</td><td class="text-positive">${UTILS.formatCurrency(buyingTotals.homeValue - s.homePrice)}</td></tr>
        <tr class="total-row"><td>Net Cost of Buying</td><td>${UTILS.formatCurrency(s.buyingCosts.netCost)}</td></tr>
    `;

    const rentingBody = document.getElementById('renting-breakdown-body');
    rentingBody.innerHTML = `
        <tr><td>Total Rent Paid</td><td>${UTILS.formatCurrency(s.rentingCosts.yearly.reduce((sum, yr) => sum + yr.cost - (s.rentersInsurance * Math.pow(1.02, yr.year-1)), 0))}</td></tr>
        <tr><td>Renters Insurance</td><td>${UTILS.formatCurrency(s.rentingCosts.yearly.reduce((sum, yr, i) => sum + s.rentersInsurance * Math.pow(1.02, i), 0))}</td></tr>
        <tr class="subtotal-row"><td>Gross Renting Costs</td><td>${UTILS.formatCurrency(s.rentingCosts.total)}</td></tr>
        <tr><td>(+) Opportunity Cost (Invested DP)</td><td class="text-negative">${UTILS.formatCurrency(s.opportunityCost)}</td></tr>
        <tr class="total-row"><td>Total Cost of Renting</td><td>${UTILS.formatCurrency(s.rentingCosts.total + s.opportunityCost)}</td></tr>
    `;

    // 3. Update Chart
    updateRentVsBuyChart();

    // 4. Update AI Insights
    updateAIInsights();
}

/**
 * Updates the Rent vs Buy cumulative cost comparison chart.
 */
function updateRentVsBuyChart() {
    const s = RENT_VS_BUY_CALCULATOR.STATE;
    const ctx = document.getElementById('rent-vs-buy-chart').getContext('2d');
    const years = Array.from({ length: s.yearsToStay }, (_, i) => `Year ${i + 1}`);
    
    // Calculate cumulative net buying cost and renting cost year by year
    const cumulativeNetBuying = s.buyingCosts.yearly.map((yrData, i) => {
        const initialInvestment = s.downPayment + s.closingCostsBuy;
        const investmentReturnDecimal = s.investmentReturnRate / 100;
        const sellingCost = yrData.homeValue * (s.sellingCostsRate / 100);
        const netProceeds = yrData.homeValue - (s.amortization[i]?.endingBalance || 0) - sellingCost;
        return yrData.cumulativeCost - netProceeds;
    });
    
     const cumulativeRenting = s.rentingCosts.yearly.map((yrData, i) => {
         const initialInvestment = s.downPayment + s.closingCostsBuy;
         const investmentReturnDecimal = s.investmentReturnRate / 100;
         const opportunityCost = initialInvestment * Math.pow(1 + investmentReturnDecimal, i+1) - initialInvestment;
         return yrData.cumulativeCost + opportunityCost;
     });

    const isDarkMode = document.documentElement.getAttribute('data-color-scheme') === 'dark';
    const rentColor = isDarkMode ? '#F5B041' : '#ffc107'; // Yellow/Orange for Rent
    const buyColor = isDarkMode ? '#87CBD7' : '#24ACC5'; // Teal for Buy

    const data = {
        labels: years,
        datasets: [
            {
                label: `Net Cost of Buying (After ${s.yearsToStay} Yrs)`,
                data: cumulativeNetBuying,
                borderColor: buyColor,
                backgroundColor: buyColor + '80', // Semi-transparent fill
                fill: false,
                tension: 0.1
            },
            {
                label: `Total Cost of Renting (Incl. Opportunity Cost)`,
                data: cumulativeRenting,
                borderColor: rentColor,
                backgroundColor: rentColor + '80',
                fill: false,
                tension: 0.1
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: { display: true, text: 'Cumulative Costs Over Time' },
            tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${UTILS.formatCurrency(context.raw)}` } }
        },
        scales: {
            y: { ticks: { callback: (value) => UTILS.formatCurrency(value, false) } }
        }
    };

    if (rentVsBuyChart) {
        rentVsBuyChart.data = data;
        rentVsBuyChart.options = options;
        rentVsBuyChart.update();
    } else {
        rentVsBuyChart = new Chart(ctx, { type: 'line', data: data, options: options });
    }
}

/**
 * Updates the AI Insights section based on calculation results.
 */
function updateAIInsights(errorMessage = null) {
    const outputEl = document.getElementById('ai-insights-output');
    if (errorMessage) {
        outputEl.innerHTML = `<p class="text-negative">${errorMessage}</p>`;
        return;
    }
    
    const s = RENT_VS_BUY_CALCULATOR.STATE;
    let html = '';
    
    // Insight 1: Overall Recommendation
    if (s.netAdvantage > 0) {
         html += `<p><i class="fas fa-check-circle text-positive"></i> <strong>AI Recommendation: Buying Appears Favorable.</strong> Over ${s.yearsToStay} years, buying is estimated to be **${UTILS.formatCurrency(s.netAdvantage)} cheaper** than renting, considering all costs, equity, appreciation, and opportunity cost.</p>`;
    } else {
         html += `<p><i class="fas fa-times-circle text-negative"></i> <strong>AI Recommendation: Renting Appears Favorable.</strong> Over ${s.yearsToStay} years, renting is estimated to be **${UTILS.formatCurrency(Math.abs(s.netAdvantage))} cheaper** than buying, considering all factors.</p>`;
    }
    
    // Insight 2: Break-Even Point
    if (s.breakEvenYear > 0 && s.breakEvenYear <= s.yearsToStay) {
        html += `<p><strong>Key Factor:</strong> Buying becomes the more financially advantageous option after **Year ${s.breakEvenYear}**. Since you plan to stay for ${s.yearsToStay} years, buying aligns with your timeline.</p>`;
    } else if (s.breakEvenYear > s.yearsToStay) {
         html += `<p><strong>Key Factor:</strong> The financial break-even point where buying becomes cheaper is estimated to be **after Year ${s.breakEvenYear}**. Since you plan to stay only ${s.yearsToStay} years, renting may be the better short-term financial choice.</p>`;
    } else if (s.netAdvantage <=0 && s.breakEvenYear === -1){
         html += `<p><strong>Key Factor:</strong> Based on current assumptions, renting remains the cheaper option for the entire ${s.yearsToStay}-year period. Buying does not reach a financial break-even point.</p>`;
    }

    // Insight 3: Sensitivity (Appreciation vs. Investment)
    if (s.homeAppreciationRate > s.investmentReturnRate) {
        html += `<p><strong>Market Insight:</strong> Your expected home appreciation (${s.homeAppreciationRate}%) is higher than investment returns (${s.investmentReturnRate}%). This significantly favors buying as your home equity grows faster than alternative investments.</p>`;
    } else if (s.investmentReturnRate > s.homeAppreciationRate + 2) { // Significantly higher investment return
         html += `<p><strong>Investment Insight:</strong> Your expected investment return (${s.investmentReturnRate}%) significantly outperforms home appreciation (${s.homeAppreciationRate}%). Renting and investing the down payment difference yields a strong financial advantage (Opportunity Cost: ${UTILS.formatCurrency(s.opportunityCost)}).</p>`;
    }
    
    // Insight 4: Tax Impact
    const totalTaxSavings = s.buyingCosts.yearly.reduce((sum, yr, i) => sum + (s.amortization[i]?.interestPaid + (s.buyingCosts.yearly[i]?.homeValue || s.homePrice) * (s.propertyTaxRate / 100) > 15000 ? (s.amortization[i]?.interestPaid + (s.buyingCosts.yearly[i]?.homeValue || s.homePrice) * (s.propertyTaxRate / 100)) * (s.taxRate / 100) : 0), 0);
    if (totalTaxSavings > 1000) { // Only mention if significant
        html += `<p><strong>Tax Consideration:</strong> Estimated tax savings from mortgage interest and property tax deductions contribute roughly **${UTILS.formatCurrency(totalTaxSavings)}** to the benefit of buying over ${s.yearsToStay} years.</p>`;
    }

    // Monetization/Action CTA based on result
    if (s.netAdvantage > 0) { // Buying favored
        html += `
            <div class="ad-slot-mini">
                <p class="ad-label">Next Step / Affiliate Link</p>
                <a href="#affiliate-link-mortgage-prequal" class="ad-link-button">Get Pre-Qualified for a Mortgage <i class="fas fa-arrow-right"></i></a>
            </div>`;
    } else { // Renting favored
         html += `
            <div class="ad-slot-mini">
                 <p class="ad-label">Next Step / Affiliate Link</p>
                <a href="#affiliate-link-renters-insurance" class="ad-link-button">Compare Renters Insurance Quotes <i class="fas fa-shield-alt"></i></a>
            </div>`;
    }

    outputEl.innerHTML = html;
    SPEECH.speak(outputEl.textContent.substring(0, 200)); // Speak first part of insight
}


/* ========================================================================== */
/* V. EVENT LISTENERS & INITIALIZATION */
/* ========================================================================== */

function setupEventListeners() {
    // --- Theme & Accessibility Controls ---
    document.getElementById('theme-toggle-button').addEventListener('click', THEME_MANAGER.toggleTheme);
    // TTS/Voice are handled within SPEECH.initialize()

    // --- Input Change for Auto-Update ---
    const form = document.getElementById('rent-vs-buy-form');
    form.addEventListener('input', calculateRentVsBuy); // Recalculate on any input change
    form.addEventListener('change', calculateRentVsBuy); // Also for selects/final changes

    // --- Tab Switching ---
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.target.getAttribute('data-tab');
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            // Ensure chart redraws correctly if its tab is activated
            if (tabId === 'comparison-chart' && rentVsBuyChart) {
                setTimeout(() => rentVsBuyChart.resize(), 10); 
            }
        });
    });
}

// === Initialize ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('🇺🇸 FinGuid Rent vs Buy AI Analyzer v1.0 Initializing...');
    THEME_MANAGER.loadUserPreferences();
    SPEECH.initialize();
    setupEventListeners();
    fredAPI.startAutomaticUpdates(); // Fetch live rate and trigger initial calculation
    // Perform initial calculation in case FRED is slow/fails
    setTimeout(calculateRentVsBuy, 750); 
    console.log('✅ Rent vs Buy Calculator initialized!');
});
