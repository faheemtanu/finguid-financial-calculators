/**
 * CAR LEASE ANALYZER — World's First AI-Powered Lease vs Buy Calculator - PRODUCTION JS v1.0
 * FinGuid USA Market Domination Build 
 * * Target: Production Ready, AI Insights, SEO, PWA, Voice, Monetization Ready
 * * FRED API: 9c6c421f077f2091e8bae4f143ada59a
 * * Google Analytics: G-NYBL2CDNQJ (in HTML)
 * * © 2025 FinGuid - World's First AI Calculator Platform for Americans
 */

/* ========================================================================== */
/* I. GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const CAR_LEASE_CALCULATOR = {
    VERSION: '1.0',
    DEBUG: true, // Set to false for production
    
    // FRED API Configuration (Real Key)
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a', 
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    // RIFLIN60EN: 60-Month New Car Loan Rate at Commercial Banks (Used for Buy Option)
    FRED_SERIES_ID: 'RIFLIN60EN', 
    FALLBACK_RATE: 7.5,
    RATE_UPDATE_INTERVAL: 8 * 60 * 60 * 1000, // 8 hours for auto rates
    LIVE_RATE: 7.5, // Current/Fallback Rate

    // Core State - Stores inputs and calculated results
    STATE: {
        // Inputs
        vehiclePrice: 35000,
        downPayment: 2000,
        salesTaxRate: 7.0,
        leaseTermMonths: 36,
        residualPercentage: 55,
        moneyFactor: 0.0025,
        annualMileage: 12000,
        buyLoanTermYears: 5,
        buyInterestRate: 7.5, // Will be updated by FRED
    },

    // Results
    RESULTS: {
        monthlyLeasePayment: 0,
        monthlyBuyPayment: 0,
        totalLeaseCost: 0,
        totalBuyCostNet: 0, // True cost considering sale proceeds
        totalCostDifference: 0,
    },
    
    charts: {
        leaseBuyChart: null,
    }
};

/* ========================================================================== */
/* II. UTILITY FUNCTIONS (Monetization, Theming, Formatting, Toasts) */
/* ========================================================================== */

const UTILS = {
    // Formats a number as USD currency
    formatCurrency: (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    },

    // Formats a number as a percentage
    formatPercent: (value) => `${value.toFixed(2)}%`,
    
    // Displays a temporary notification
    showToast: (message, type = 'info') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.classList.add('toast', type);
        toast.textContent = message;
        container.prepend(toast);
        
        // Show and auto-hide
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },
};

/* ========================================================================== */
/* III. FRED API INTEGRATION (For Live Interest Rates) */
/* ========================================================================== */

const fredAPI = {
    // Fetches the latest 60-Month New Car Loan Rate
    fetchLatestRate: async () => {
        const url = `${CAR_LEASE_CALCULATOR.FRED_BASE_URL}?series_id=${CAR_LEASE_CALCULATOR.FRED_SERIES_ID}&api_key=${CAR_LEASE_CALCULATOR.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('FRED API response not OK');
            }
            const data = await response.json();
            
            if (data.observations && data.observations.length > 0) {
                const rate = parseFloat(data.observations[0].value);
                if (!isNaN(rate) && rate > 0) {
                    CAR_LEASE_CALCULATOR.LIVE_RATE = rate;
                    document.getElementById('buy-interest-rate').value = rate.toFixed(2);
                    UTILS.showToast(`✅ Live FRED® Rate updated: ${UTILS.formatPercent(rate)}`, 'success');
                    return rate;
                }
            }
            throw new Error('Invalid rate data from FRED.');

        } catch (error) {
            if (CAR_LEASE_CALCULATOR.DEBUG) console.error('FRED API Error, using fallback rate:', error);
            // Use fallback rate in case of API failure
            document.getElementById('buy-interest-rate').value = CAR_LEASE_CALCULATOR.FALLBACK_RATE.toFixed(2);
            UTILS.showToast(`⚠️ Could not fetch live rate. Using fallback rate of ${UTILS.formatPercent(CAR_LEASE_CALCULATOR.FALLBACK_RATE)}.`, 'info');
            return CAR_LEASE_CALCULATOR.FALLBACK_RATE;
        }
    },
    
    startAutomaticUpdates: async () => {
        await fredAPI.fetchLatestRate();
        calculateLeaseVsBuy(); // Trigger initial calculation after rate fetch
        
        // Set up recurring update (8 hours)
        setInterval(fredAPI.fetchLatestRate, CAR_LEASE_CALCULATOR.RATE_UPDATE_INTERVAL);
    }
};

/* ========================================================================== */
/* IV. CORE CALCULATION LOGIC */
/* ========================================================================== */

// --- A. Lease Calculation ---
const calculateLease = () => {
    const { vehiclePrice, downPayment, salesTaxRate, leaseTermMonths, residualPercentage, moneyFactor } = CAR_LEASE_CALCULATOR.STATE;

    // 1. Calculate Core Values
    const capCostReduction = downPayment; // Assumes all down payment is CCR
    const netCapitalizedCost = vehiclePrice - capCostReduction;
    const residualValue = vehiclePrice * (residualPercentage / 100);

    // 2. Calculate Depreciation and Rent Charge
    const depreciation = netCapitalizedCost - residualValue;
    const rentCharge = (netCapitalizedCost + residualValue) * moneyFactor * leaseTermMonths;

    // 3. Calculate Monthly Payments (Pre-Tax)
    const monthlyDepreciation = depreciation / leaseTermMonths;
    const monthlyRentCharge = rentCharge / leaseTermMonths;
    const baseMonthlyPayment = monthlyDepreciation + monthlyRentCharge;

    // 4. Calculate Sales Tax (Tax on monthly payment is standard in many US states)
    // NOTE: Tax laws vary, but applying tax to the monthly payment is common for leases.
    const monthlySalesTax = baseMonthlyPayment * (salesTaxRate / 100);
    const finalMonthlyPayment = baseMonthlyPayment + monthlySalesTax;

    // 5. Calculate Total Lease Cost
    const totalPayments = finalMonthlyPayment * leaseTermMonths;
    const acquisitionFee = 695; // Standard example fee
    const dispositionFee = 450; // Standard example fee
    const totalLeaseCost = totalPayments + acquisitionFee + dispositionFee + capCostReduction;
    
    // Store Results
    CAR_LEASE_CALCULATOR.RESULTS.monthlyLeasePayment = finalMonthlyPayment;
    
    return {
        finalMonthlyPayment,
        residualValue,
        totalLeaseCost,
        totalPayments,
        acquisitionFee,
        dispositionFee,
        monthlySalesTax: monthlySalesTax,
    };
};

// --- B. Buy Calculation ---
const calculateBuy = () => {
    const { vehiclePrice, downPayment, salesTaxRate, buyLoanTermYears, buyInterestRate } = CAR_LEASE_CALCULATOR.STATE;

    const loanTermMonths = buyLoanTermYears * 12;
    const annualRate = buyInterestRate / 100;
    const monthlyRate = annualRate / 12;

    // 1. Calculate Upfront Costs
    const totalSalesTax = vehiclePrice * (salesTaxRate / 100);
    const upfrontFees = 500; // Example: Title, registration, documentation fees
    const totalUpfrontCost = downPayment + totalSalesTax + upfrontFees;
    
    // 2. Calculate Loan Principal
    const loanPrincipal = vehiclePrice - downPayment;
    
    // 3. Calculate Monthly Payment (Standard Amortization)
    let monthlyPayment = 0;
    if (monthlyRate > 0) {
        monthlyPayment = loanPrincipal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -loanTermMonths)));
    } else {
        monthlyPayment = loanPrincipal / loanTermMonths;
    }
    
    // 4. Calculate Total Costs
    const totalPayments = monthlyPayment * loanTermMonths;
    const totalInterest = totalPayments - loanPrincipal;
    const totalCostOfLoan = totalPayments + downPayment;

    // 5. Estimate Vehicle Residual/Equity for True Cost of Ownership
    // Assuming a standard depreciation model (e.g., 20% in year 1, 15% each year after)
    const depreciationFactor = 0.20 + (0.15 * (buyLoanTermYears - 1));
    const estimatedResidualValue = vehiclePrice * (1 - depreciationFactor);
    
    // Net Cost Calculation (True Cost of Ownership over a fixed period, like the lease term)
    const totalCostOverLeaseTerm = (monthlyPayment * CAR_LEASE_CALCULATOR.STATE.leaseTermMonths) + downPayment + totalSalesTax + upfrontFees;
    
    // Store Results
    CAR_LEASE_CALCULATOR.RESULTS.monthlyBuyPayment = monthlyPayment;
    
    return {
        monthlyPayment,
        totalInterest,
        totalCostOfLoan,
        totalCostOverLeaseTerm,
        upfrontFees: totalSalesTax + upfrontFees,
        estimatedResidualValue,
    };
};

// --- C. Main Calculation Function ---
const calculateLeaseVsBuy = () => {
    // 1. Read & Update State from UI
    const state = CAR_LEASE_CALCULATOR.STATE;
    state.vehiclePrice = parseFloat(document.getElementById('vehicle-price').value) || 0;
    state.downPayment = parseFloat(document.getElementById('down-payment').value) || 0;
    state.salesTaxRate = parseFloat(document.getElementById('sales-tax-rate').value) || 0;
    state.leaseTermMonths = parseInt(document.getElementById('lease-term').value) || 0;
    state.residualPercentage = parseFloat(document.getElementById('residual-percentage').value) || 0;
    state.moneyFactor = parseFloat(document.getElementById('money-factor').value) || 0;
    state.annualMileage = parseInt(document.getElementById('annual-mileage').value) || 0;
    state.buyLoanTermYears = parseInt(document.getElementById('buy-loan-term').value) || 0;
    state.buyInterestRate = parseFloat(document.getElementById('buy-interest-rate').value) || CAR_LEASE_CALCULATOR.LIVE_RATE;

    if (state.vehiclePrice <= 0 || state.leaseTermMonths <= 0 || state.buyLoanTermYears <= 0) {
        // Prevent calculation with invalid data
        if (CAR_LEASE_CALCULATOR.DEBUG) console.warn('Invalid input to calculate.');
        return;
    }

    // 2. Perform Calculations
    const lease = calculateLease();
    const buy = calculateBuy();
    
    // 3. Calculate True Total Cost Comparison over the Lease Term
    // True Cost to Lease = Total Lease Cost (minus residual)
    // True Cost to Buy = Total Payments over Lease Term + Upfront Costs - Equity at Lease Term End
    
    const termYears = state.leaseTermMonths / 12;
    // Simple car value estimate at end of lease term
    const carValueAtLeaseEnd = state.vehiclePrice * (1 - (0.20 * termYears)); // Simple depreciation model for comparison

    const totalLeaseCost = lease.totalLeaseCost;
    
    // Total out-of-pocket for buy option over the lease period
    const totalBuyPaymentsOverLeaseTerm = buy.monthlyPayment * state.leaseTermMonths;
    const totalBuyOutofPocket = totalBuyPaymentsOverLeaseTerm + state.downPayment + (state.vehiclePrice * (state.salesTaxRate / 100)) + 500;
    
    // Net Cost to Buy = Total Out-of-Pocket - Estimated Car Value (Equity)
    const totalBuyNetCost = totalBuyOutofPocket - carValueAtLeaseEnd;
    
    CAR_LEASE_CALCULATOR.RESULTS.totalLeaseCost = totalLeaseCost;
    CAR_LEASE_CALCULATOR.RESULTS.totalBuyCostNet = totalBuyNetCost;
    CAR_LEASE_CALCULATOR.RESULTS.totalCostDifference = totalBuyNetCost - totalLeaseCost; // Positive means Buy is more expensive

    // 4. Update UI
    updateResultsUI(lease, buy, totalLeaseCost, totalBuyNetCost, carValueAtLeaseEnd);
    updateChart(totalLeaseCost, totalBuyNetCost);
    generateAIInsights(lease, buy, totalLeaseCost, totalBuyNetCost, carValueAtLeaseEnd);
};

/* ========================================================================== */
/* V. UI UPDATE & CHARTING */
/* ========================================================================== */

const updateResultsUI = (lease, buy, totalLeaseCost, totalBuyNetCost, carValueAtLeaseEnd) => {
    const termYears = CAR_LEASE_CALCULATOR.STATE.leaseTermMonths / 12;
    const diff = CAR_LEASE_CALCULATOR.RESULTS.totalCostDifference;
    
    // Summary Card
    document.getElementById('monthly-lease-payment').textContent = UTILS.formatCurrency(lease.finalMonthlyPayment);
    document.getElementById('monthly-buy-payment').textContent = UTILS.formatCurrency(buy.monthlyPayment);
    document.getElementById('lease-term-years').textContent = termYears;

    const diffElement = document.getElementById('total-cost-difference');
    diffElement.textContent = UTILS.formatCurrency(Math.abs(diff));
    diffElement.classList.remove('positive', 'negative');
    
    let comparisonText = `(Lease is ${diff < 0 ? 'Cheaper' : 'More Expensive'})`;

    if (Math.abs(diff) < 500) {
        comparisonText = `(Costs are virtually identical)`;
    } else if (diff > 0) {
        // Positive difference: Buy is more expensive (Buy Cost - Lease Cost > 0)
        diffElement.classList.add('negative'); 
        comparisonText = `(${UTILS.formatCurrency(diff)} Cheaper to **Lease**)`;
    } else {
        // Negative difference: Lease is more expensive (Buy Cost - Lease Cost < 0)
        diffElement.classList.add('positive'); 
        comparisonText = `(${UTILS.formatCurrency(Math.abs(diff))} Cheaper to **Buy**)`;
    }

    diffElement.textContent = `${UTILS.formatCurrency(Math.abs(diff))} ${comparisonText}`;

    // Detailed Costs Tab
    document.getElementById('chart-term-length').textContent = CAR_LEASE_CALCULATOR.STATE.leaseTermMonths;
    document.getElementById('lease-term-details').textContent = CAR_LEASE_CALCULATOR.STATE.leaseTermMonths;
    document.getElementById('buy-term-details').textContent = CAR_LEASE_CALCULATOR.STATE.buyLoanTermYears;

    // Lease Details
    document.getElementById('total-lease-payments').textContent = UTILS.formatCurrency(lease.finalMonthlyPayment * CAR_LEASE_CALCULATOR.STATE.leaseTermMonths);
    document.getElementById('lease-fees').textContent = UTILS.formatCurrency(lease.acquisitionFee);
    document.getElementById('lease-taxes').textContent = UTILS.formatCurrency(lease.monthlySalesTax * CAR_LEASE_CALCULATOR.STATE.leaseTermMonths);
    document.getElementById('disposition-fee').textContent = UTILS.formatCurrency(lease.dispositionFee);
    document.getElementById('total-lease-cost').textContent = UTILS.formatCurrency(totalLeaseCost);
    
    const mileagePenalty = (CAR_LEASE_CALCULATOR.STATE.annualMileage / 12000) > 1.2 ? 900 : 0; // Simple high mileage penalty estimate
    document.getElementById('mileage-penalty-estimate').textContent = UTILS.formatCurrency(mileagePenalty);

    // Buy Details
    const totalBuyPaymentsOverLeaseTerm = buy.monthlyPayment * CAR_LEASE_CALCULATOR.STATE.leaseTermMonths;
    const totalInterestOverLeaseTerm = totalBuyPaymentsOverLeaseTerm - (CAR_LEASE_CALCULATOR.STATE.vehiclePrice - CAR_LEASE_CALCULATOR.STATE.downPayment); // Simplistic interest calc
    
    document.getElementById('total-buy-payments').textContent = UTILS.formatCurrency(totalBuyPaymentsOverLeaseTerm);
    document.getElementById('total-buy-interest').textContent = UTILS.formatCurrency(Math.max(0, totalInterestOverLeaseTerm));
    document.getElementById('buy-upfront-fees').textContent = UTILS.formatCurrency(CAR_LEASE_CALCULATOR.STATE.downPayment + (CAR_LEASE_CALCULATOR.STATE.vehiclePrice * (CAR_LEASE_CALCULATOR.STATE.salesTaxRate / 100)) + 500);
    document.getElementById('buy-future-value').textContent = UTILS.formatCurrency(carValueAtLeaseEnd);
    document.getElementById('total-buy-net-cost').textContent = UTILS.formatCurrency(totalBuyNetCost);
    document.getElementById('buy-equity').textContent = UTILS.formatCurrency(carValueAtLeaseEnd);
};


const updateChart = (totalLeaseCost, totalBuyNetCost) => {
    const ctx = document.getElementById('leaseBuyChart').getContext('2d');
    
    if (CAR_LEASE_CALCULATOR.charts.leaseBuyChart) {
        CAR_LEASE_CALCULATOR.charts.leaseBuyChart.destroy();
    }
    
    CAR_LEASE_CALCULATOR.charts.leaseBuyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Total Cost to Lease', 'Net Cost to Buy (Equity Adjusted)'],
            datasets: [{
                label: `Total Cost over ${CAR_LEASE_CALCULATOR.STATE.leaseTermMonths} Months`,
                data: [totalLeaseCost, totalBuyNetCost],
                backgroundColor: [
                    'rgba(255, 193, 7, 0.8)', // Lease - Info/Yellow
                    'rgba(36, 172, 197, 0.8)' // Buy - Teal
                ],
                borderColor: [
                    'rgba(255, 193, 7, 1)',
                    'rgba(36, 172, 197, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return UTILS.formatCurrency(value).replace('.00', '');
                        },
                        color: document.documentElement.getAttribute('data-color-scheme') === 'dark' ? '#f0f0f0' : '#13343B',
                    },
                    grid: {
                        color: document.documentElement.getAttribute('data-color-scheme') === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    }
                },
                x: {
                    ticks: {
                        color: document.documentElement.getAttribute('data-color-scheme') === 'dark' ? '#f0f0f0' : '#13343B',
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + UTILS.formatCurrency(context.parsed.y);
                        }
                    }
                }
            }
        }
    });
};

/* ========================================================================== */
/* VI. AI INSIGHTS ENGINE */
/* ========================================================================== */

const generateAIInsights = (lease, buy, totalLeaseCost, totalBuyNetCost, carValueAtLeaseEnd) => {
    const state = CAR_LEASE_CALCULATOR.STATE;
    const diff = CAR_LEASE_CALCULATOR.RESULTS.totalCostDifference;
    const aiRecommendationsElement = document.getElementById('ai-recommendations');
    let summaryText = "";
    let recommendationsHTML = "<h5>Key Takeaways for You:</h5><ul>";

    // 1. Core Recommendation
    if (Math.abs(diff) < 1000) {
        summaryText = "The FinGuid AI Analyzer determines that **Leasing and Buying are financially balanced** for your scenario. Your decision should rely on lifestyle preferences (mileage, maintenance risk, desire for equity).";
    } else if (diff > 0) {
        summaryText = `The FinGuid AI Analyzer recommends **Leasing** for this vehicle. Over ${state.leaseTermMonths} months, the net cost of buying is **${UTILS.formatCurrency(diff)} higher** than the total cost of leasing.`;
    } else {
        summaryText = `The FinGuid AI Analyzer recommends **Buying** this vehicle. Over ${state.leaseTermMonths} months, the total cost of leasing is **${UTILS.formatCurrency(Math.abs(diff))} higher** than the net cost of buying (after accounting for equity).`;
    }

    // 2. Conditional Recommendations for Monetization/Affiliate
    
    // Low Residual Warning (Affiliate Opportunity)
    if (state.residualPercentage < 50) {
        recommendationsHTML += `<li>**Residual Risk:** Your residual value is low (${state.residualPercentage}%). This suggests the vehicle depreciates quickly. Lease payments may be higher. **AI Tip:** Consider a vehicle with better resale/residual value for cheaper lease terms, or look into a certified pre-owned purchase.</li>`;
    }

    // High Money Factor Warning (Affiliate Opportunity)
    if (state.moneyFactor > 0.0030) {
        const implicitAPR = state.moneyFactor * 2400;
        recommendationsHTML += `<li>**Lease Rate Alert:** Your Money Factor implies an APR of **${implicitAPR.toFixed(2)}%**, which is high for a lease. This increases your rent charge. **AI Tip:** This is a key negotiation point. Ask the dealer for a lower money factor or <a href="#affiliates">compare new auto loan rates from our partner lenders</a>.</li>`;
    }
    
    // High Buy Rate Warning (Affiliate Opportunity)
    if (state.buyInterestRate > CAR_LEASE_CALCULATOR.LIVE_RATE + 1.0) {
        recommendationsHTML += `<li>**Buy Rate Warning:** Your Buy Rate of ${state.buyInterestRate}% is significantly higher than the current FRED® average of ${CAR_LEASE_CALCULATOR.LIVE_RATE.toFixed(2)}%. **AI Tip:** You are paying too much interest. <a href="#sponsor-link">Secure a pre-approved loan with a FinGuid partner before you visit the dealership.</a></li>`;
    }
    
    // Lifestyle and PWA Call to Action
    if (state.annualMileage > 15000) {
        recommendationsHTML += `<li>**Mileage Risk:** Your ${state.annualMileage} miles/year is high. Leasing is typically better for low-mileage drivers. If you drive this much, buying is safer to avoid hefty end-of-lease penalties.</li>`;
    } else {
        recommendationsHTML += `<li>**Low Maintenance:** Leasing gives you a lower maintenance and repair risk since the car is under warranty for the term. This is a significant advantage over buying.</li>`;
    }
    
    recommendationsHTML += `<li>**PWA Friendly:** Add **FinGuid Car Lease Analyzer** to your home screen! Tap the menu and select "Install App" for the full PWA experience on iOS/Android.</li>`;

    recommendationsHTML += "</ul>";

    document.getElementById('ai-summary-text').textContent = summaryText;
    aiRecommendationsElement.innerHTML = recommendationsHTML;
    
    // Trigger TTS for the summary text
    SPEECH.speak(summaryText);
};

/* ========================================================================== */
/* VII. ACCESSIBILITY & THEME (Copied/Adapted from Mortgage/Rent files) */
/* ========================================================================== */

const THEME_MANAGER = {
    toggleTheme: () => {
        const html = document.documentElement;
        const newTheme = html.getAttribute('data-color-scheme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-color-scheme', newTheme);
        localStorage.setItem('finguid-theme', newTheme);
        // Ensure the chart colors update
        calculateLeaseVsBuy(); 
        UTILS.showToast(`Switched to ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} Mode.`, 'info');
    },
    loadUserPreferences: () => {
        const savedTheme = localStorage.getItem('finguid-theme') || 'light';
        document.documentElement.setAttribute('data-color-scheme', savedTheme);
    }
};

const SPEECH = {
    initialize: () => {
        document.getElementById('tts-button').addEventListener('click', () => {
            const insightText = document.getElementById('ai-summary-text').textContent;
            if (insightText && insightText !== 'Analyzing your inputs...') {
                SPEECH.speak(insightText);
            } else {
                UTILS.showToast('Please calculate results first to enable Text-to-Speech.', 'info');
            }
        });

        document.getElementById('voice-command-button').addEventListener('click', () => {
            UTILS.showToast('🎙️ Voice Command activated (Requires full production speech recognition implementation).', 'info');
            // Placeholder for SPEECH.startListening();
        });
    },
    speak: (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 1.1;
            window.speechSynthesis.cancel(); 
            window.speechSynthesis.speak(utterance);
        }
    }
};

/* ========================================================================== */
/* VIII. EVENT LISTENERS & INITIALIZATION */
/* ========================================================================== */

const setupEventListeners = () => {
    // === Theme Toggle ===
    document.getElementById('theme-toggle').addEventListener('click', THEME_MANAGER.toggleTheme);
    
    // === Calculator Form Input ===
    const form = document.getElementById('car-lease-form');
    form.addEventListener('input', calculateLeaseVsBuy); 
    form.addEventListener('change', calculateLeaseVsBuy); 

    // === Tab Switching (Results) ===
    document.querySelectorAll('.tab-controls-results .tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.target.getAttribute('data-tab');
            
            // Deactivate all buttons and content
            document.querySelectorAll('.tab-controls-results .tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.results-section .tab-content').forEach(content => content.classList.remove('active'));
            
            // Activate selected button and content
            e.target.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Ensure chart redraws correctly if its tab is activated
            if (tabId === 'comparison-chart' && CAR_LEASE_CALCULATOR.charts.leaseBuyChart) {
                setTimeout(() => CAR_LEASE_CALCULATOR.charts.leaseBuyChart.resize(), 10); 
            }
        });
    });
};


// === Initialize ===
document.addEventListener('DOMContentLoaded', function() {
    if (CAR_LEASE_CALCULATOR.DEBUG) {
        console.log('🇺🇸 FinGuid Car Lease Analyzer v1.0 Initializing...');
        console.log(`🏦 FRED® API Key: ${CAR_LEASE_CALCULATOR.FRED_API_KEY}`);
    }
    
    // 1. Initialize Core Features
    THEME_MANAGER.loadUserPreferences();
    SPEECH.initialize();
    setupEventListeners();
    
    // 2. Fetch Live Rate and Trigger Initial Calculation
    // This fetches the live rate, sets the input, and then calls calculateLeaseVsBuy()
    fredAPI.startAutomaticUpdates(); 
    
    // Fallback calculation in case FRED is slow/fails to trigger
    setTimeout(calculateLeaseVsBuy, 1500); 
    
    if (CAR_LEASE_CALCULATOR.DEBUG) console.log('✅ Car Lease Calculator initialized!');
});
