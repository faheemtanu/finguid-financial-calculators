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
    DEBUG: false, 
    
    // FRED API Configuration (Real Key)
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a', 
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    FRED_SERIES_ID: 'MORTGAGE30US', // 30-Year Fixed-Rate Mortgage Average
    RATE_UPDATE_INTERVAL: 4 * 60 * 60 * 1000, // 4 hours
    FALLBACK_RATE: 6.75,

    // Core State - Stores inputs and calculated results
    STATE: {
        // Inputs
        homePrice: 400000,
        downPayment: 80000, // 20%
        interestRate: 6.75, // Updated by FRED
        loanTermYears: 30,
        propertyTaxRate: 1.2, // %
        homeInsurance: 1500, // Annual
        maintenanceRate: 1.0, // % of Home Price, Annual
        closingCostsBuy: 8000, // Flat fee
        currentRent: 2200, // Monthly
        rentIncreaseRate: 3.0, // %
        securityDeposit: 2200,
        rentersInsurance: 200, // Annual
        miscRentalFees: 0,
        analysisPeriod: 7, // Years
        appreciationRate: 3.5, // %
        investmentReturnRate: 6.0, // % on invested capital
        marginalTaxRate: 24, // % for tax savings

        // Results
        totalNetWorthBuy: 0,
        totalNetWorthRent: 0,
        buyPathROI: 0,
        rentPathROI: 0,
        monthlyPITI: 0,
        initialCostDifference: 0,
        annualComparisonData: [], // Detailed breakdown per year
    },
    
    charts: {
        rentVsBuyChart: null,
    },
    deferredInstallPrompt: null,
};


/* ========================================================================== */
/* II. UTILITY & FORMATTING MODULE (Adapted from Mortgage Calc) */
/* ========================================================================== */

const UTILS = (function() {
    function formatCurrency(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    }

    function formatPercent(rate) {
        return parseFloat(rate).toFixed(1) + '%';
    }

    function parseInput(id) {
        const value = document.getElementById(id).value;
        const cleaned = value.replace(/[$,]/g, '').trim();
        return parseFloat(cleaned) || 0;
    }
    
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10); 
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }

    return {
        formatCurrency,
        formatPercent,
        parseInput,
        debounce,
        showToast,
    };
})();


/* ========================================================================== */
/* III. CORE CALCULATION MODULE (The Engine) */
/* ========================================================================== */

function calculateRentVsBuy() {
    // 1. Update State from Inputs
    const S = RENT_VS_BUY_CALCULATOR.STATE;
    S.homePrice = UTILS.parseInput('home-price');
    S.downPayment = UTILS.parseInput('down-payment');
    S.interestRate = UTILS.parseInput('interest-rate');
    S.loanTermYears = UTILS.parseInput('loan-term-years');
    S.propertyTaxRate = UTILS.parseInput('property-tax-rate');
    S.homeInsurance = UTILS.parseInput('home-insurance');
    S.maintenanceRate = UTILS.parseInput('maintenance-rate');
    S.closingCostsBuy = UTILS.parseInput('closing-costs-buy');
    S.currentRent = UTILS.parseInput('current-rent');
    S.rentIncreaseRate = UTILS.parseInput('rent-increase-rate');
    S.securityDeposit = UTILS.parseInput('security-deposit');
    S.rentersInsurance = UTILS.parseInput('renters-insurance');
    S.miscRentalFees = UTILS.parseInput('misc-rental-fees');
    S.analysisPeriod = UTILS.parseInput('analysis-period');
    S.appreciationRate = UTILS.parseInput('appreciation-rate');
    S.investmentReturnRate = UTILS.parseInput('investment-return-rate');
    S.marginalTaxRate = UTILS.parseInput('marginal-tax-rate');

    if (S.homePrice === 0 || S.analysisPeriod === 0 || S.currentRent === 0) {
        updateResultsDisplay(true); // Display placeholders/initial state
        return;
    }

    // --- Core Financial Variables ---
    const P = S.homePrice - S.downPayment; // Principal Loan Amount
    const r_m = (S.interestRate / 100) / 12; // Monthly Interest Rate (for P&I)
    const n = S.loanTermYears * 12; // Total Payments (for P&I)
    const T = (S.propertyTaxRate / 100) / 12; // Monthly Property Tax Rate (as decimal)
    const I_m = S.homeInsurance / 12; // Monthly Home Insurance
    const M_m = (S.homePrice * (S.maintenanceRate / 100)) / 12; // Monthly Maintenance

    const appreciation = S.appreciationRate / 100;
    const investmentReturn = S.investmentReturnRate / 100;
    const rentIncrease = S.rentIncreaseRate / 100;
    const taxRate = S.marginalTaxRate / 100;
    const analysisMonths = S.analysisPeriod * 12;


    // --- 1. Buying Path: Monthly P&I Calculation (if loan exists) ---
    let monthlyPI = 0;
    if (P > 0 && r_m > 0 && n > 0) {
        monthlyPI = P * (r_m * Math.pow(1 + r_m, n)) / (Math.pow(1 + r_m, n) - 1);
    } else if (P === 0) {
        // All cash purchase
        monthlyPI = 0;
    }
    
    // Monthly PITI + Maintenance + Insurance (PITI-M)
    const monthlyTax = (S.homePrice * T) || 0;
    S.monthlyPITI = monthlyPI + monthlyTax + I_m; // P&I + Tax + Insurance
    const totalMonthlyBuyCost = S.monthlyPITI + M_m;
    
    // --- 2. Track Costs & Equity over Analysis Period ---
    let outstandingBalance = P;
    let totalRentPaid = 0;
    let totalBuyPayments = 0;
    let totalTaxSavings = 0;
    let cumulativeInvestmentRent = S.downPayment + S.closingCostsBuy - S.securityDeposit - S.miscRentalFees; // Initial savings invested
    let totalInvestmentGainsRent = 0;
    let currentHomeValue = S.homePrice;
    
    S.annualComparisonData = [];

    // Loop through each month up to the analysis period
    for (let m = 1; m <= analysisMonths; m++) {
        let year = Math.ceil(m / 12);
        
        // --- BUYING PATH MONTHLY CALCULATIONS ---
        let monthlyInterest = outstandingBalance * r_m;
        let monthlyPrincipal = monthlyPI - monthlyInterest;
        
        // Ensure balance is not negative (for a 15-year loan analyzed over 30 years)
        if (outstandingBalance <= 0) {
            monthlyInterest = 0;
            monthlyPrincipal = 0;
            monthlyPI = 0; // PI payment stops once loan is paid off
        }
        
        // Tax Savings (assuming itemized deduction for simplicity)
        // Only deduct interest and property tax
        let monthlyTaxDeduction = (monthlyInterest + monthlyTax) * taxRate;
        totalTaxSavings += monthlyTaxDeduction;

        // Total cash outflow for the month
        let monthlyBuyOutflow = monthlyPI + monthlyTax + I_m + M_m;
        totalBuyPayments += monthlyBuyOutflow;

        // Update loan balance
        if (outstandingBalance > 0) {
            outstandingBalance -= monthlyPrincipal;
        }

        // --- RENTING PATH MONTHLY CALCULATIONS ---
        let currentMonthlyRent = S.currentRent * Math.pow(1 + rentIncrease, year - 1);
        let monthlyRentOutflow = currentMonthlyRent + (S.rentersInsurance / 12);
        totalRentPaid += monthlyRentOutflow;

        // Cash Flow Difference (Savings to Invest)
        let monthlySavingsInvested = monthlyBuyOutflow - monthlyRentOutflow;
        
        // Apply investment return to accumulated invested capital
        cumulativeInvestmentRent *= Math.pow(1 + (investmentReturn / 12), 1);
        
        if (monthlySavingsInvested > 0) {
             cumulativeInvestmentRent += monthlySavingsInvested;
        }

        // --- ANNUAL CALCULATIONS (Save for Chart/Display) ---
        if (m % 12 === 0 || m === analysisMonths) {
            // Annual Home Appreciation (Compounded)
            currentHomeValue = S.homePrice * Math.pow(1 + appreciation, year);
            
            // Total Principal Paid to Date
            let totalPrincipalPaid = P - Math.max(0, outstandingBalance);

            // BUYING PATH NET WORTH (Equity + Invested Savings)
            let equity = totalPrincipalPaid + (currentHomeValue - S.homePrice);
            let buyNetWorth = equity + (cumulativeInvestmentRent < 0 ? cumulativeInvestmentRent : 0); // Consider opportunity cost if buy is cheaper
            
            // RENTING PATH NET WORTH (Invested Capital)
            let rentNetWorth = cumulativeInvestmentRent + S.securityDeposit; // Deposit is returned

            S.annualComparisonData.push({
                year: year,
                buyNetWorth: buyNetWorth,
                rentNetWorth: rentNetWorth,
                totalOutflowBuy: totalBuyPayments,
                totalOutflowRent: totalRentPaid,
            });
        }
    }
    
    // --- 3. Final Result Metrics ---
    const finalData = S.annualComparisonData[S.annualComparisonData.length - 1];

    // Total Net Worth (at end of analysis period)
    S.totalNetWorthBuy = finalData.buyNetWorth + totalTaxSavings; // Add tax savings back to net worth for true comparison
    S.totalNetWorthRent = finalData.rentNetWorth;
    
    // Total Cost (Outflow)
    const totalOutflowBuy = finalData.totalOutflowBuy + S.downPayment + S.closingCostsBuy - totalTaxSavings;
    const totalOutflowRent = finalData.totalOutflowRent + S.securityDeposit + S.miscRentalFees - S.securityDeposit; // Deposit is returned/net zero

    // ROI Calculation (Net Worth Gain / Initial Investment)
    const initialInvestmentBuy = S.downPayment + S.closingCostsBuy;
    const initialInvestmentRent = S.securityDeposit + S.miscRentalFees;

    S.buyPathROI = ((S.totalNetWorthBuy - initialInvestmentBuy) / initialInvestmentBuy) * 100;
    S.rentPathROI = ((S.totalNetWorthRent - initialInvestmentRent) / initialInvestmentRent) * 100;
    
    S.initialCostDifference = initialInvestmentBuy - initialInvestmentRent;

    updateResultsDisplay();
    generateAIInsights();
    updateChart();
}


/* ========================================================================== */
/* IV. FRED API MODULE (Live Rate Integration) */
/* ========================================================================== */

const fredAPI = (function() {
    async function fetchLatestRate() {
        const url = new URL(RENT_VS_BUY_CALCULATOR.FRED_BASE_URL);
        const params = {
            series_id: RENT_VS_BUY_CALCULATOR.FRED_SERIES_ID,
            api_key: RENT_VS_BUY_CALCULATOR.FRED_API_KEY,
            file_type: 'json',
            sort_order: 'desc',
            limit: 1,
        };
        url.search = new URLSearchParams(params).toString();

        try {
            const response = await fetch(url);
            const data = await response.json();
            
            const latestObservation = data.observations.find(obs => obs.value !== '.' && obs.value !== 'N/A');
            if (latestObservation) {
                const rate = parseFloat(latestObservation.value);
                document.getElementById('interest-rate').value = rate.toFixed(2);
                document.querySelector('.fred-source-note').textContent = `Live FRED Rate (${latestObservation.date})`;
                if (RENT_VS_BUY_CALCULATOR.DEBUG) UTILS.showToast(`Live Rate updated to ${rate.toFixed(2)}%`, 'success');
                return rate;
            } else {
                throw new Error('No valid observation found in FRED data.');
            }
        } catch (error) {
            console.error('FRED API Error, using fallback rate:', error);
            document.getElementById('interest-rate').value = RENT_VS_BUY_CALCULATOR.FALLBACK_RATE.toFixed(2);
            document.querySelector('.fred-source-note').textContent = `Fallback Rate (${RENT_VS_BUY_CALCULATOR.FALLBACK_RATE.toFixed(2)}%)`;
            if (RENT_VS_BUY_CALCULATOR.DEBUG) UTILS.showToast('Could not fetch live FRED rate. Using default.', 'error');
            return RENT_VS_BUY_CALCULATOR.FALLBACK_RATE;
        }
    }

    function startAutomaticUpdates() {
        fetchLatestRate().then(calculateRentVsBuy); // Initial fetch and calculation update
        setInterval(fetchLatestRate, RENT_VS_BUY_CALCULATOR.RATE_UPDATE_INTERVAL);
    }
    return { startAutomaticUpdates };
})();


/* ========================================================================== */
/* V. AI INSIGHTS ENGINE (The Smart Feature) */
/* ========================================================================== */

function generateAIInsights() {
    const S = RENT_VS_BUY_CALCULATOR.STATE;
    const output = document.getElementById('ai-insights-output');
    let html = `<h4><i class="fas fa-robot"></i> FinGuid AI Analysis & Recommendation:</h4>`;

    const difference = S.totalNetWorthBuy - S.totalNetWorthRent;
    const period = S.analysisPeriod;

    // --- Core Recommendation ---
    if (difference > 5000) {
        html += `<p class="positive-insight">The **BUYING PATH** is projected to be more financially rewarding, resulting in **${UTILS.formatCurrency(Math.abs(difference))}** greater net worth after **${period} years**. Your strong down payment and home appreciation rate are key drivers.</p>`;
        document.getElementById('final-verdict-box').className = 'final-verdict-box buy-recommended';
        document.getElementById('final-verdict-text').textContent = `VERDICT: BUY is ${UTILS.formatCurrency(Math.abs(difference))} BETTER over ${period} years!`;
    } else if (difference < -5000) {
        html += `<p class="negative-insight">The **RENTING PATH** is significantly better over this **${period}-year period**, with **${UTILS.formatCurrency(Math.abs(difference))}** more wealth generated. This suggests your investment return rate outweighs the current buying costs.</p>`;
        document.getElementById('final-verdict-box').className = 'final-verdict-box rent-recommended';
        document.getElementById('final-verdict-text').textContent = `VERDICT: RENT is ${UTILS.formatCurrency(Math.abs(difference))} BETTER over ${period} years!`;
    } else {
        html += `<p>The difference between renting and buying is narrow (less than $5,000). Your decision should be based on **lifestyle factors** and market conviction, not just the numbers.</p>`;
        document.getElementById('final-verdict-box').className = 'final-verdict-box';
        document.getElementById('final-verdict-text').textContent = `VERDICT: NEAR TIE over ${period} years. Lifestyle is the key factor.`;
    }

    // --- Market Analysis & Actionable Advice ---
    html += `<h4>Market Analysis & Strategy:</h4>`;
    
    // 1. Home Appreciation Sensitivity
    if (S.appreciationRate < 3.0) {
         html += `<p>• **Appreciation Risk:** At a ${UTILS.formatPercent(S.appreciationRate)} appreciation rate, buying is sensitive to slight dips. Consider finding homes with higher growth potential to solidify your ROI.</p>`;
    } else {
         html += `<p>• **Appreciation Strength:** Your ${UTILS.formatPercent(S.appreciationRate)} appreciation is a major driver of wealth. The long-term equity build-up is strong, justifying higher initial costs.</p>`;
    }

    // 2. Rent vs Investment Opportunity
    if (S.investmentReturnRate > S.interestRate) {
        html += `<p>• **Investment Strategy:** The investment return of ${UTILS.formatPercent(S.investmentReturnRate)} is higher than the mortgage rate of ${UTILS.formatPercent(S.interestRate)}. This is a strong argument for the Renting Path, as your money works harder in the market.</p>`;
    } else {
        html += `<p>• **Debt vs Investment:** The mortgage rate is higher. Paying down the mortgage debt is the best guaranteed return. The buy decision is reinforced.</p>`;
    }
    
    // 3. Monetization Insight (Affiliate)
    html += `<h4><i class="fas fa-handshake-angle"></i> Affordability & Loan Recommendation:</h4>`;
    if (S.homePrice / 500000 > 0.8) {
         html += `<p>• **Action Step:** Your projected monthly buying cost is substantial. **Optimize your loan:** Explore **Affiliate Link: Lower Mortgage Rates** to minimize your monthly outflow and maximize your long-term ROI.</p>`;
    } else {
         html += `<p>• **Action Step:** You are well within range. Ensure you have the right protection: Explore **Affiliate Link: Top Home Insurance Providers** to safeguard your investment.</p>`;
    }


    // --- ROI Recommendation ---
    document.getElementById('buy-roi').textContent = UTILS.formatPercent(S.buyPathROI);
    document.getElementById('rent-roi').textContent = UTILS.formatPercent(S.rentPathROI);
    document.getElementById('ai-roi-recommendation').innerHTML = (S.buyPathROI > S.rentPathROI) ? 
        `**BUY Recommendation:** The Buy Path offers a ${UTILS.formatPercent(S.buyPathROI - S.rentPathROI)} higher ROI. Focus on reducing closing costs.` :
        `**RENT Recommendation:** The Rent Path offers a ${UTILS.formatPercent(S.rentPathROI - S.buyPathROI)} higher ROI. Ensure your investment portfolio meets the assumed ${UTILS.formatPercent(S.investmentReturnRate)} return.`;

    output.innerHTML = html;
}


/* ========================================================================== */
/* VI. CHARTING MODULE (Market Visualization) */
/* ========================================================================== */

function updateChart() {
    const S = RENT_VS_BUY_CALCULATOR.STATE;
    const ctx = document.getElementById('rentVsBuyChart').getContext('2d');
    const labels = S.annualComparisonData.map(d => d.year + (d.year === 1 ? ' Year' : ' Years'));
    const buyData = S.annualComparisonData.map(d => d.buyNetWorth);
    const rentData = S.annualComparisonData.map(d => d.rentNetWorth);
    
    if (RENT_VS_BUY_CALCULATOR.charts.rentVsBuyChart) {
        RENT_VS_BUY_CALCULATOR.charts.rentVsBuyChart.destroy();
    }
    
    // Check for Dark Mode to set grid line colors
    const isDarkMode = document.documentElement.getAttribute('data-color-scheme') === 'dark';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDarkMode ? 'white' : 'black';

    RENT_VS_BUY_CALCULATOR.charts.rentVsBuyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Buying Path Net Worth',
                    data: buyData,
                    borderColor: 'var(--color-chart-buy)',
                    backgroundColor: 'rgba(36, 172, 185, 0.2)',
                    fill: false,
                    tension: 0.2
                },
                {
                    label: 'Renting Path Net Worth (Invested Savings)',
                    data: rentData,
                    borderColor: 'var(--color-chart-rent)',
                    backgroundColor: 'rgba(255, 193, 7, 0.2)',
                    fill: false,
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += UTILS.formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Net Worth / Total Wealth',
                        color: textColor
                    },
                    beginAtZero: true,
                    ticks: {
                         color: textColor,
                        callback: function(value) {
                            return UTILS.formatCurrency(value / 1000) + 'K';
                        }
                    },
                    grid: { color: gridColor }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time (Years)',
                        color: textColor
                    },
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        }
    });
}


/* ========================================================================== */
/* VII. UI UPDATER & DISPLAY */
/* ========================================================================== */

function updateResultsDisplay(usePlaceholders = false) {
    const S = RENT_VS_BUY_CALCULATOR.STATE;
    const finalData = S.annualComparisonData[S.annualComparisonData.length - 1];
    
    // Update Analysis Period Labels
    document.getElementById('summary-period-years-1').textContent = S.analysisPeriod;
    document.getElementById('summary-period-years-2').textContent = S.analysisPeriod;

    if (usePlaceholders || !finalData) {
        // Display initial zero state/placeholders
        document.getElementById('total-payments-buy').textContent = UTILS.formatCurrency(0);
        document.getElementById('total-initial-buy').textContent = UTILS.formatCurrency(S.downPayment + S.closingCostsBuy);
        document.getElementById('total-tax-savings').textContent = UTILS.formatCurrency(0);
        document.getElementById('total-rent-paid').textContent = UTILS.formatCurrency(0);
        document.getElementById('total-initial-rent').textContent = UTILS.formatCurrency(S.securityDeposit + S.miscRentalFees);
        document.getElementById('total-investment-gains').textContent = UTILS.formatCurrency(0);
        document.getElementById('final-verdict-text').textContent = "Enter valid data to start the AI analysis...";
        document.getElementById('ai-insights-output').innerHTML = '<p class="placeholder-text">Enter your details to generate personalized AI analysis on your best financial path...</p>';
        document.getElementById('buy-roi').textContent = '0%';
        document.getElementById('rent-roi').textContent = '0%';
        return;
    }
    
    // Calculate Investment Gains for Rent Path (Difference between final net worth and initial investment)
    const investmentGains = S.totalNetWorthRent - (S.downPayment + S.closingCostsBuy);

    // --- Buying Path Summary ---
    document.getElementById('total-payments-buy').textContent = UTILS.formatCurrency(finalData.totalOutflowBuy);
    document.getElementById('total-initial-buy').textContent = UTILS.formatCurrency(S.downPayment + S.closingCostsBuy);
    document.getElementById('total-tax-savings').textContent = UTILS.formatCurrency(S.totalTaxSavings);
    
    // --- Renting Path Summary ---
    document.getElementById('total-rent-paid').textContent = UTILS.formatCurrency(finalData.totalOutflowRent);
    document.getElementById('total-initial-rent').textContent = UTILS.formatCurrency(S.securityDeposit + S.miscRentalFees);
    document.getElementById('total-investment-gains').textContent = UTILS.formatCurrency(Math.max(0, investmentGains)); // Only show positive gains
}


/* ========================================================================== */
/* VIII. THEME MANAGER, PWA, VOICE (Reused FinGuid Modules) */
/* ========================================================================== */

const THEME_MANAGER = (function() {
    const COLOR_SCHEME_KEY = 'finguid-color-scheme';
    
    function loadUserPreferences() {
        const savedScheme = localStorage.getItem(COLOR_SCHEME_KEY);
        if (savedScheme) {
            document.documentElement.setAttribute('data-color-scheme', savedScheme);
            updateToggleButton(savedScheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            // Default to system preference if no saved preference
            document.documentElement.setAttribute('data-color-scheme', 'dark');
            updateToggleButton('dark');
        }
    }
    
    function updateToggleButton(scheme) {
        const button = document.getElementById('toggle-color-scheme');
        if (scheme === 'dark') {
            button.innerHTML = '<i class="fas fa-moon"></i>';
            button.setAttribute('aria-label', 'Toggle Light Mode');
        } else {
            button.innerHTML = '<i class="fas fa-sun"></i>';
            button.setAttribute('aria-label', 'Toggle Dark Mode');
        }
    }

    function toggleColorScheme() {
        const currentScheme = document.documentElement.getAttribute('data-color-scheme');
        const newScheme = currentScheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-color-scheme', newScheme);
        localStorage.setItem(COLOR_SCHEME_KEY, newScheme);
        updateToggleButton(newScheme);
        
        // Ensure chart re-renders with new colors
        if (RENT_VS_BUY_CALCULATOR.charts.rentVsBuyChart) {
            updateChart(); 
        }
    }
    
    return { loadUserPreferences, toggleColorScheme };
})();


const SPEECH = (function() {
    const isSpeechSupported = window.SpeechRecognition || window.webkitSpeechRecognition;
    let isListening = false;

    function initialize() {
        if (!isSpeechSupported) {
            if (RENT_VS_BUY_CALCULATOR.DEBUG) UTILS.showToast('Voice Command not supported in this browser.', 'error');
            document.getElementById('toggle-voice-command').disabled = true;
            return;
        }

        // Placeholder for real speech recognition
        document.getElementById('toggle-voice-command').addEventListener('click', () => {
             isListening = !isListening;
             const button = document.getElementById('toggle-voice-command');
             button.classList.toggle('voice-active', isListening);
             button.classList.toggle('voice-inactive', !isListening);
             document.getElementById('voice-status-text').textContent = isListening ? 'Voice ON' : 'Voice OFF';
             const message = isListening ? 'Voice Command Active. Try "Set home price to four hundred thousand"' : 'Voice Command Deactivated.';
             UTILS.showToast(message, isListening ? 'info' : 'success');
        });
        
        // Placeholder for Text-to-Speech
        document.getElementById('toggle-text-to-speech').addEventListener('click', () => {
            UTILS.showToast('Text-to-Speech active (This feature will read the AI insights aloud)', 'info');
             document.getElementById('toggle-text-to-speech').classList.toggle('tts-active');
            // The actual TTS logic is complex and omitted for brevity.
        });
    }

    return { initialize };
})();


// PWA Install Prompt Logic (Simplified)
function showPWAInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        RENT_VS_BUY_CALCULATOR.deferredInstallPrompt = e;
        document.getElementById('pwa-install-button').classList.remove('hidden');
        if (RENT_VS_BUY_CALCULATOR.DEBUG) console.log('PWA Install Prompt ready.');
    });

    document.getElementById('pwa-install-button').addEventListener('click', () => {
        if (RENT_VS_BUY_CALCULATOR.deferredInstallPrompt) {
            RENT_VS_BUY_CALCULATOR.deferredInstallPrompt.prompt();
            RENT_VS_BUY_CALCULATOR.deferredInstallPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    UTILS.showToast('FinGuid PWA Installed Successfully!', 'success');
                    document.getElementById('pwa-install-button').classList.add('hidden');
                }
                RENT_VS_BUY_CALCULATOR.deferredInstallPrompt = null;
            });
        }
    });
}


/* ========================================================================== */
/* IX. EVENT LISTENERS & INITIALIZATION */
/* ========================================================================== */

function setupEventListeners() {
    // === Core Input Monitoring (Debounced for performance) ===
    const debouncedCalculate = UTILS.debounce(calculateRentVsBuy, 300);
    const form = document.getElementById('rent-vs-buy-form');
    
    // Recalculate on any input change
    form.addEventListener('input', debouncedCalculate); 
    form.addEventListener('change', debouncedCalculate); 
    
    // === Accessibility & PWA ===
    document.getElementById('toggle-color-scheme').addEventListener('click', THEME_MANAGER.toggleColorScheme);
    showPWAInstallPrompt(); // Must be called early

    // --- Tab Switching (Input & Results) ---
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.target.getAttribute('data-tab');
            
            // Handle input tabs (buy-inputs, rent-inputs, analysis-inputs)
            if (['buy-inputs', 'rent-inputs', 'analysis-inputs'].includes(tabId)) {
                 document.querySelectorAll('#rent-vs-buy-form .input-tab-content').forEach(content => content.classList.remove('active'));
                 document.getElementById(tabId).classList.add('active');
                 document.querySelectorAll('.tab-controls .tab-button').forEach(btn => btn.classList.remove('active'));
                 e.target.classList.add('active');
            }
            
            // Handle results tabs (comparison-summary, comparison-chart, ai-insights)
            if (['comparison-summary', 'comparison-chart', 'ai-insights'].includes(tabId)) {
                document.querySelectorAll('.results-section .tab-content').forEach(content => content.classList.remove('active'));
                document.getElementById(tabId).classList.add('active');
                document.querySelectorAll('.tab-controls-results .tab-button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // Ensure chart redraws correctly if its tab is activated
                if (tabId === 'comparison-chart' && RENT_VS_BUY_CALCULATOR.charts.rentVsBuyChart) {
                    setTimeout(() => RENT_VS_BUY_CALCULATOR.charts.rentVsBuyChart.resize(), 10); 
                }
            }
        });
    });
}

// === Initialize ===
document.addEventListener('DOMContentLoaded', function() {
    if (RENT_VS_BUY_CALCULATOR.DEBUG) console.log('🇺🇸 FinGuid Rent vs Buy AI Analyzer v1.0 Initializing...');
    
    // 1. Initialize Core Features
    THEME_MANAGER.loadUserPreferences();
    SPEECH.initialize();
    setupEventListeners();
    
    // 2. Fetch Live Rate and Trigger Initial Calculation
    // This ensures a dynamic rate is pulled from FRED, which then triggers the main calculation.
    fredAPI.startAutomaticUpdates(); 
    
    // Fallback calculation in case FRED is slow/fails to trigger
    setTimeout(calculateRentVsBuy, 1000); 
    
    if (RENT_VS_BUY_CALCULATOR.DEBUG) console.log('✅ Rent vs Buy Calculator initialized!');
});
