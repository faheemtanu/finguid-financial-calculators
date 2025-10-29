/**
 * INVESTMENT CALCULATOR — AI‑POWERED GROWTH & GOAL PLANNER - PRODUCTION JS v1.1 (Functional Fixes & Enhancements)
 * FinGuid USA Market Domination Build - World's First AI-Powered Investment Calculator
 * * Target: Production Ready, AI Insights, SEO, PWA, Voice, Monetization Ready
 * * Features Implemented:
 * ✅ Compound Interest Calculation (Lump Sum + Contributions)
 * ✅ Goal Planning Modes (Time to Goal, Contribution Needed) - FUNCTIONAL
 * ✅ Live Inflation Adjustment (FRED API: CPIAUCSL) + Attribution
 * ✅ Dynamic Charting (Chart.js: Growth, Contributions, Inflation Impact) - Enhanced Tooltips
 * ✅ Dynamic AI-Powered Insights Engine (Monetization Focused) - FUNCTIONAL
 * ✅ FUNCTIONAL Voice Control & Text-to-Speech
 * ✅ Light/Dark Mode Toggling & User Preferences Storage
 * ✅ PWA Ready Setup
 * ✅ Data Table & CSV Export - FUNCTIONAL
 * * FRED API Key: 9c6c421f077f2091e8bae4f143ada59a
 * * © 2025 FinGuid - World's First AI Calculator Platform for Americans
 */

/* ========================================================================== */
/* I. GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const INVESTMENT_CALCULATOR = {
    VERSION: '1.1', // Updated version
    DEBUG: false,

    // FRED API Configuration (Real Key)
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    FRED_INFLATION_SERIES_ID: 'CPIAUCSL', // Consumer Price Index for All Urban Consumers
    RATE_UPDATE_INTERVAL: 12 * 60 * 60 * 1000, // 12 hours
    FALLBACK_INFLATION_RATE: 3.0, // Fallback inflation rate

    // Core State - Stores inputs and calculated results
    STATE: {
        // Inputs (Defaults)
        calculationMode: 'calc-fv',
        initialInvestment: 10000,
        monthlyContribution: 500,
        yearsToGrow: 20,
        expectedReturnRate: 7.0, // %
        financialGoal: 1000000,
        inflationRate: 3.0, // % - Updated by FRED

        // Results
        futureValue: 0,
        totalPrincipal: 0,
        totalGains: 0,
        inflationAdjustedFV: 0,
        yearsToGoal: null,
        contributionNeeded: null,
        annualData: [],
    },

    charts: {
        investmentGrowthChart: null,
    },
    deferredInstallPrompt: null,
    // Voice/TTS State
    speechRecognition: null,
    speechSynthesis: window.speechSynthesis,
    isListening: false,
    isTTSEnabled: false,
};


/* ========================================================================== */
/* II. UTILITY & FORMATTING MODULE (Reused from FinGuid Platform) */
/* ========================================================================== */

const UTILS = (function() {
    function formatCurrency(amount, withDecimals = false) {
        if (typeof amount !== 'number' || isNaN(amount)) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: withDecimals ? 2 : 0,
            maximumFractionDigits: withDecimals ? 2 : 0,
        }).format(amount);
    }

     function formatNumber(num, decimals = 0) {
        if (typeof num !== 'number' || isNaN(num)) return '0';
        return num.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    }

    function formatPercent(rate) {
         if (typeof rate !== 'number' || isNaN(rate)) return '0.0%';
        return rate.toFixed(1) + '%';
    }

    function parseInput(id) {
        const el = document.getElementById(id);
         if (!el) {
            console.error(`Element with ID ${id} not found.`);
            return 0; // Return 0 if element doesn't exist
        }
        const value = el.value;
        const cleaned = value.replace(/[$,]/g, '').trim();
        const parsed = parseFloat(cleaned);
        // Ensure non-negative values where appropriate
        if (['initial-investment', 'monthly-contribution', 'financial-goal', 'initial-investment-goal', 'monthly-contribution-goal'].includes(id) && parsed < 0) {
            return 0;
        }
         if (['years-to-grow', 'years-to-grow-goal'].includes(id) && parsed < 1) {
             return 1; // Minimum 1 year
         }
         // Allow negative return rate, cap inflation and positive return rate reasonably
         if (id === 'expected-return-rate' || id === 'expected-return-rate-goal') {
             return Math.max(-20, Math.min(parsed || 0, 50)); // Allow -20% to +50%
         }
        if (id === 'inflation-rate') {
            return Math.max(0, Math.min(parsed || 0, 20)); // Allow 0% to +20%
        }

        return parsed || 0;
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
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3500); // Slightly longer duration
    }

    return { formatCurrency, formatNumber, formatPercent, parseInput, debounce, showToast };
})();
// END UTILITY & FORMATTING MODULE

/* ========================================================================== */
/* III. DATA LAYER: FRED API MODULE (Inflation Rate) */
/* ========================================================================== */

const fredAPI = (function() {
    async function fetchLatestInflationRate() {
        if (INVESTMENT_CALCULATOR.DEBUG) {
            console.warn('DEBUG MODE: Using mock Inflation rate.');
             document.getElementById('inflation-rate').value = INVESTMENT_CALCULATOR.FALLBACK_INFLATION_RATE.toFixed(1);
             document.querySelector('#inflation-note').textContent = `Using Fallback Rate (${INVESTMENT_CALCULATOR.FALLBACK_INFLATION_RATE.toFixed(1)}%)`;
            return INVESTMENT_CALCULATOR.FALLBACK_INFLATION_RATE;
        }

        const url = new URL(INVESTMENT_CALCULATOR.FRED_BASE_URL);
        const params = {
            series_id: INVESTMENT_CALCULATOR.FRED_INFLATION_SERIES_ID,
            api_key: INVESTMENT_CALCULATOR.FRED_API_KEY,
            file_type: 'json',
            sort_order: 'desc',
            limit: 13, // Get 13 months to calculate YoY change
            observation_start: new Date(Date.now() - 14 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Approx 14 months ago
        };
        url.search = new URLSearchParams(params).toString();

        try {
            const response = await fetch(url);
            if (!response.ok) {
                 // Check for specific rate limit error
                 if (response.status === 429) {
                    console.warn('FRED API rate limit likely exceeded. Using fallback.');
                     throw new Error(`FRED API Error: ${response.status} (Rate Limit Exceeded)`);
                 }
                throw new Error(`FRED API returned status: ${response.status}`);
            }
            const data = await response.json();

             // Check if observations are present
            if (!data || !data.observations || data.observations.length === 0) {
                 throw new Error('No observations returned from FRED API.');
            }

            const observations = data.observations.filter(obs => obs.value !== '.' && obs.value !== 'N/A').sort((a,b) => new Date(a.date) - new Date(b.date)); // Sort oldest to newest

            if (observations.length >= 13) {
                const latestValue = parseFloat(observations[observations.length - 1].value);
                const priorYearValue = parseFloat(observations[observations.length - 13].value);

                // Ensure values are numbers before calculation
                if (isNaN(latestValue) || isNaN(priorYearValue) || priorYearValue === 0) {
                     throw new Error('Invalid observation values received from FRED.');
                }

                const inflationRate = ((latestValue - priorYearValue) / priorYearValue) * 100;
                const rate = Math.max(0, Math.min(inflationRate, 20)); // Cap inflation between 0% and 20%

                document.getElementById('inflation-rate').value = rate.toFixed(1);
                document.querySelector('#inflation-note').textContent = `Live FRED® Rate (${observations[observations.length - 1].date})`;
                console.log(`📈 FRED Inflation Rate updated: ${rate.toFixed(1)}%`);
                // UTILS.showToast(`Live Inflation Rate: ${rate.toFixed(1)}%`, 'info'); // Reduce toast frequency
                return rate;
            } else {
                 console.warn('FRED API returned fewer than 13 valid observations.');
                throw new Error('Not enough valid observations found in FRED data for YoY calculation.');
            }
        } catch (error) {
            console.error('FRED Inflation API Error, using fallback rate:', error);
            document.getElementById('inflation-rate').value = INVESTMENT_CALCULATOR.FALLBACK_INFLATION_RATE.toFixed(1);
            document.querySelector('#inflation-note').textContent = `Using Fallback Rate (${INVESTMENT_CALCULATOR.FALLBACK_INFLATION_RATE.toFixed(1)}%)`;
            // Only show toast on initial failure, not every interval failure
            if (!INVESTMENT_CALCULATOR.STATE.inflationRateFetchedOnce) {
                 UTILS.showToast('Could not fetch live inflation rate. Using fallback.', 'error');
            }
            return INVESTMENT_CALCULATOR.FALLBACK_INFLATION_RATE;
        } finally {
            INVESTMENT_CALCULATOR.STATE.inflationRateFetchedOnce = true; // Mark that we attempted fetch
        }
    }

    function startAutomaticUpdates() {
        fetchLatestInflationRate().then(rate => {
            INVESTMENT_CALCULATOR.STATE.inflationRate = rate;
            updateCalculations(); // Initial calculation after fetching rate
        });
        // Update less frequently for inflation
        // setInterval(async () => {
        //      const rate = await fetchLatestInflationRate();
        //      // Only update and recalculate if the rate changes meaningfully (e.g., by 0.1%)
        //      if (Math.abs(rate - INVESTMENT_CALCULATOR.STATE.inflationRate) >= 0.1) {
        //           INVESTMENT_CALCULATOR.STATE.inflationRate = rate;
        //           updateCalculations();
        //           UTILS.showToast(`Inflation rate updated to ${rate.toFixed(1)}%`, 'info');
        //      }
        // }, INVESTMENT_CALCULATOR.RATE_UPDATE_INTERVAL);
    }
    return { startAutomaticUpdates };
})();
// END FRED API MODULE


/* ========================================================================== */
/* IV. CORE CALCULATION ENGINE (Compound Interest & Goal Planning) */
/* ========================================================================== */

/**
 * Main calculation function dispatcher based on selected mode.
 */
function updateCalculations() {
    const S = INVESTMENT_CALCULATOR.STATE;

    // Determine calculation mode from active button
    const activeTabButton = document.querySelector('.input-tabs .tab-button.active');
    S.calculationMode = activeTabButton ? activeTabButton.getAttribute('data-tab') : 'calc-fv'; // Default to FV

    // Get common inputs
    S.inflationRate = UTILS.parseInput('inflation-rate');

    // Get mode-specific inputs and run calculation
    if (S.calculationMode === 'calc-fv') {
        S.initialInvestment = UTILS.parseInput('initial-investment');
        S.monthlyContribution = UTILS.parseInput('monthly-contribution');
        S.yearsToGrow = UTILS.parseInput('years-to-grow');
        S.expectedReturnRate = UTILS.parseInput('expected-return-rate');
        // Reset goal inputs visually if needed (optional)
        // document.getElementById('financial-goal').value = '';
        calculateFutureValue();
    } else { // Goal Planning modes
        S.financialGoal = UTILS.parseInput('financial-goal');
        S.initialInvestment = UTILS.parseInput('initial-investment-goal');
        S.expectedReturnRate = UTILS.parseInput('expected-return-rate-goal');

         // Determine which sub-mode based on last button clicked or specific state trigger
         // For simplicity, we'll rely on the specific functions being called by buttons
         if (S.triggeredMode === 'calc-goal-time') {
            S.monthlyContribution = UTILS.parseInput('monthly-contribution-goal');
             if (S.monthlyContribution < 0) S.monthlyContribution = 0; // Ensure non-negative contribution for calc
             // document.getElementById('years-to-grow-goal').value = ''; // Clear the other input
            calculateTimeToGoal();
        } else if (S.triggeredMode === 'calc-goal-contribution') {
            S.yearsToGrow = UTILS.parseInput('years-to-grow-goal');
             if (S.yearsToGrow < 1) S.yearsToGrow = 1; // Ensure min 1 year
             // document.getElementById('monthly-contribution-goal').value = ''; // Clear the other input
            calculateContributionNeeded();
        } else {
             // Default goal view - maybe calculate FV based on goal inputs? Or show placeholder?
             // Let's calculate FV based on the 'Contribution' field as a default view for the goal tab
              S.monthlyContribution = UTILS.parseInput('monthly-contribution-goal');
              S.yearsToGrow = UTILS.parseInput('years-to-grow-goal'); // Need a default time too
              calculateFutureValue(); // Calculate FV based on goal inputs for initial display
              // Clear specific goal results
              S.yearsToGoal = null;
              S.contributionNeeded = null;
        }
    }
     S.triggeredMode = null; // Reset trigger after calculation

    // Update UI elements common to all modes
    updateResultsDisplay();
    generateAIInsights();
    updateChart();
    updateDataTable();
}

/**
 * Calculates future value based on current state inputs.
 * Formula: FV = P(1+r)^n + PMT * [((1+r)^n - 1) / r]
 */
function calculateFutureValue() {
    const S = INVESTMENT_CALCULATOR.STATE;
    // Basic validation
     if (S.yearsToGrow < 1) {
         UTILS.showToast("Years to grow must be at least 1.", "error");
         S.yearsToGrow = 1;
         document.getElementById('years-to-grow').value = 1;
     }
      if (S.expectedReturnRate < -20 || S.expectedReturnRate > 50) {
         UTILS.showToast("Expected return rate seems unrealistic. Please check.", "warning");
     }

    const r = S.expectedReturnRate / 100; // Annual rate as decimal
    const n = S.yearsToGrow;
    const initial = S.initialInvestment;
    const pmt = S.monthlyContribution * 12; // Annual contribution

    let futureValue = initial * Math.pow(1 + r, n); // FV of initial investment
    if (r !== 0) {
        futureValue += pmt * ( (Math.pow(1 + r, n) - 1) / r ); // FV of ordinary annuity (contributions at end of period)
         // For contributions at beginning of period (annuity due):
         // futureValue += pmt * ( (Math.pow(1 + r, n) - 1) / r ) * (1 + r);
    } else {
         futureValue += pmt * n; // Simple sum if rate is 0
    }


    const totalPrincipal = initial + (S.monthlyContribution * 12 * n);
    const totalGains = futureValue - totalPrincipal;

    // Inflation Adjustment FV_real = FV_nominal / (1 + i)^n
    const i = S.inflationRate / 100;
    const inflationAdjustedFV = futureValue / Math.pow(1 + i, n);

    // Update State
    S.futureValue = Math.max(0, futureValue); // Ensure non-negative FV
    S.totalPrincipal = totalPrincipal;
    S.totalGains = Math.max(0, totalGains); // Ensure non-negative gains
    S.inflationAdjustedFV = Math.max(0, inflationAdjustedFV);
    S.yearsToGoal = null; // Clear goal-specific results
    S.contributionNeeded = null;

    // Generate Annual Data for Chart/Table
    generateAnnualData(initial, S.monthlyContribution, r, n, i);
}

/**
 * Calculates the number of years needed to reach a financial goal.
 * Uses iteration.
 */
function calculateTimeToGoal() {
    const S = INVESTMENT_CALCULATOR.STATE;
     // Validation
     if (S.financialGoal <= 0) {
         UTILS.showToast("Please enter a positive financial goal.", "error");
         return;
     }
     if (S.financialGoal <= S.initialInvestment) {
        S.yearsToGoal = 0;
        // Set other values for consistent display
        S.futureValue = S.initialInvestment; S.totalPrincipal = S.initialInvestment; S.totalGains = 0; S.inflationAdjustedFV = S.initialInvestment; S.contributionNeeded = null; S.annualData = [];
        UTILS.showToast("Goal already reached with initial investment!", "info");
        return;
     }
      const r = S.expectedReturnRate / 100;
      // Check if goal is reachable: If return is negative/zero AND contributions are zero/negative
      if (r <= 0 && S.monthlyContribution <= 0 && S.financialGoal > S.initialInvestment) {
        S.yearsToGoal = Infinity;
        // Set other values for consistent display
        S.futureValue = S.initialInvestment; S.totalPrincipal = S.initialInvestment; S.totalGains = 0; S.inflationAdjustedFV = S.initialInvestment; S.contributionNeeded = null; S.annualData = [];
        UTILS.showToast("Goal is unreachable with zero/negative returns and no contributions.", "error");
        return;
     }


    const initial = S.initialInvestment;
    const pmt = S.monthlyContribution; // Monthly contribution
    const goal = S.financialGoal;
    const i = S.inflationRate / 100;
    const monthlyRate = r / 12;

    let months = 0;
    let currentFV = initial;
    const maxMonths = 100 * 12; // Max 100 years

    S.annualData = [];
    let currentYear = 0;
    let yearStartBalance = initial;

     // Calculate month by month for accuracy
    while (currentFV < goal && months < maxMonths) {
        months++;
        // FV = P(1+r)^t + PMT * [((1+r)^t - 1) / r]
        // This calculates FV at the END of the month
        if (monthlyRate !== 0) {
             currentFV = initial * Math.pow(1 + monthlyRate, months) + pmt * ( (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate );
        } else {
             currentFV = initial + pmt * months;
        }


         // Generate annual data points as we iterate
         if (months % 12 === 0) {
            currentYear = months / 12;
            const yearEndBalance = currentFV;
            const interestEarned = yearEndBalance - yearStartBalance - (pmt * 12);
            const inflationAdjusted = yearEndBalance / Math.pow(1 + i, currentYear);
            S.annualData.push({
                year: currentYear,
                startBalance: yearStartBalance,
                contributions: pmt * 12,
                interestEarned: interestEarned,
                endBalance: yearEndBalance,
                inflationAdjustedBalance: inflationAdjusted
            });
            yearStartBalance = yearEndBalance; // Update start balance for next year
         }
    }


    if (months >= maxMonths) {
         S.yearsToGoal = Infinity;
         UTILS.showToast("Goal may take over 100 years to reach.", "warning");
         // Keep the calculated data up to max years
         S.yearsToGrow = maxMonths / 12;
         calculateFutureValue(); // Update FV etc. based on max years
    } else {
        S.yearsToGoal = months / 12;
        S.yearsToGrow = Math.ceil(months / 12); // Use ceiling for annual data consistency

         // Add final (potentially partial) year data point if not exactly on year end
         if (months % 12 !== 0) {
              currentYear = Math.ceil(months/12);
              const yearEndBalance = currentFV; // Goal amount reached
              const contributionsThisYear = pmt * (months % 12);
              const interestEarned = yearEndBalance - yearStartBalance - contributionsThisYear; // Approx for partial year
               const inflationAdjusted = yearEndBalance / Math.pow(1 + i, months / 12); // Use fractional year for inflation
                S.annualData.push({
                    year: currentYear, // Or use S.yearsToGoal for fractional year display? Let's use ceiling.
                    startBalance: yearStartBalance,
                    contributions: contributionsThisYear,
                    interestEarned: interestEarned,
                    endBalance: yearEndBalance,
                    inflationAdjustedBalance: inflationAdjusted
                });
         }

        // Recalculate final values precisely for the determined number of years (use fractional years)
         const exactYears = months / 12;
         const finalR = S.expectedReturnRate / 100;
         const finalN = exactYears;
         const finalInitial = S.initialInvestment;
         const finalPmtAnnual = S.monthlyContribution * 12;
         let finalFVCalc = finalInitial * Math.pow(1 + finalR, finalN);
         if (finalR !== 0) {
             // FV of annuity requires careful handling for fractional periods, using monthly calc is better
             finalFVCalc = currentFV; // Use the value from monthly iteration
         } else {
             finalFVCalc += finalPmtAnnual * finalN;
         }
         S.futureValue = finalFVCalc;
         S.totalPrincipal = finalInitial + (S.monthlyContribution * months);
         S.totalGains = S.futureValue - S.totalPrincipal;
         S.inflationAdjustedFV = S.futureValue / Math.pow(1 + (S.inflationRate / 100), exactYears);

    }
     S.contributionNeeded = null; // Clear other goal result
}


/**
 * Calculates the monthly contribution needed to reach a goal in a set time.
 * Formula: PMT = [FV - P(1+r)^n] / [((1+r)^n - 1) / r]
 */
function calculateContributionNeeded() {
    const S = INVESTMENT_CALCULATOR.STATE;
    // Validation
    if (S.yearsToGrow < 1) {
        UTILS.showToast("Years must be at least 1.", "error");
        S.yearsToGrow = 1;
        document.getElementById('years-to-grow-goal').value = 1;
    }
     if (S.financialGoal <= 0) {
         UTILS.showToast("Please enter a positive financial goal.", "error");
         return;
     }

    const r = S.expectedReturnRate / 100; // Annual rate
    const n = S.yearsToGrow;
    const initial = S.initialInvestment;
    const goal = S.financialGoal;

    const fvInitial = initial * Math.pow(1 + r, n); // FV of initial investment

    let pmtAnnual = 0; // Annual contribution needed
     if (fvInitial >= goal) {
        pmtAnnual = 0; // Initial amount already meets the goal
        UTILS.showToast("Initial investment is enough to reach the goal.", "info");
     } else if (r !== 0) {
        const fvAnnuityFactor = (Math.pow(1 + r, n) - 1) / r;
        if (fvAnnuityFactor === 0) { // Avoid division by zero if factor is somehow 0
            S.contributionNeeded = Infinity; // Unreachable if factor is 0
            UTILS.showToast("Cannot calculate contribution, result may be infinite.", "error");
            return;
        }
        pmtAnnual = (goal - fvInitial) / fvAnnuityFactor;
    } else { // Rate is 0
         if (n === 0) { // Avoid division by zero
             S.contributionNeeded = Infinity;
             UTILS.showToast("Cannot calculate contribution for 0 years.", "error");
             return;
         }
         pmtAnnual = (goal - initial) / n;
    }

    S.contributionNeeded = Math.max(0, pmtAnnual / 12); // Ensure non-negative monthly contribution

    // Update state for consistency and generate annual data
    S.monthlyContribution = S.contributionNeeded;
    calculateFutureValue(); // Calculate FV, gains, etc. based on the needed contribution
    S.yearsToGoal = null; // Clear other goal result
}


/**
 * Generates year-by-year data for the chart and table. Uses Monthly Contribution.
 */
function generateAnnualData(initial, monthlyPmt, rAnnual, nYears, iAnnual) {
    const S = INVESTMENT_CALCULATOR.STATE;
    S.annualData = [];
    let balance = initial;
    const pmtAnnual = monthlyPmt * 12; // Use monthly payment for accuracy
    const i = iAnnual; // Annual inflation rate

    for (let year = 1; year <= nYears; year++) {
        const startBalance = balance;
        const interestEarned = balance * rAnnual; // Interest earned on start balance
        // FV of annuity factor for the annual contributions made during the year
        let contributionGrowth = 0;
        if (rAnnual !== 0) {
             contributionGrowth = pmtAnnual * ((Math.pow(1 + rAnnual, 1) - 1) / rAnnual); // Growth of 1 year's contributions
             // This is an approximation. A month-by-month calc inside this loop would be more precise.
             // Let's stick to annual for simplicity here, assuming end-of-year contributions for FV factor.
             balance = (balance * (1 + rAnnual)) + pmtAnnual; // More direct annual calc
        } else {
             balance += pmtAnnual; // Simple addition if rate is 0
             contributionGrowth = pmtAnnual;
        }

         const endBalance = balance;
         // Recalculate interest earned based on end balance for simplicity
         const yearInterest = endBalance - startBalance - pmtAnnual;

        const inflationAdjusted = endBalance / Math.pow(1 + i, year);

        S.annualData.push({
            year: year,
            startBalance: startBalance,
            contributions: pmtAnnual,
            interestEarned: yearInterest, // Total interest earned in the year
            endBalance: endBalance,
            inflationAdjustedBalance: inflationAdjusted
        });
    }
}


/* ========================================================================== */
/* V. AI INSIGHTS ENGINE (Monetization Focused) */
/* ========================================================================== */

function generateAIInsights() {
    const S = INVESTMENT_CALCULATOR.STATE;
    const output = document.getElementById('ai-insights-output');
    output.innerHTML = ''; // Clear previous insights
    let html = `<h4><i class="fas fa-robot"></i> FinGuid AI Investment Advisor:</h4>`;

     // Ensure calculations have run and results are valid numbers
     const calculationRan = (S.futureValue > 0 || S.initialInvestment > 0 || S.yearsToGoal !== null || S.contributionNeeded !== null);
     if (!calculationRan || isNaN(S.futureValue) || isNaN(S.inflationRate)) {
        output.innerHTML = '<p class="placeholder-text">Enter valid investment parameters to generate AI analysis...</p>';
        return;
    }


    const goalMet = S.calculationMode !== 'calc-fv' && S.futureValue >= S.financialGoal;
    const timeHorizon = S.yearsToGrow;
    const finalFV = S.futureValue;
    const finalAdjustedFV = S.inflationAdjustedFV;
     // Handle potential division by zero if finalFV is 0
    const gainsRatio = finalFV > 0 ? (S.totalGains / finalFV) : 0;


    // --- Core Verdict based on Goal (if applicable) ---
    if (S.calculationMode === 'calc-goal-time' || S.calculationMode === 'calc-goal-contribution') {
        if (S.yearsToGoal === Infinity || S.contributionNeeded === Infinity || (S.contributionNeeded !== null && S.contributionNeeded > ( (S.annualSalary || 75000)/12 * 0.75)) ) { // Check for Infinity or very high needed contribution
            html += `<p class="negative-insight">**Goal Alert: Current plan seems unrealistic.** Reaching ${UTILS.formatCurrency(S.financialGoal)} may take too long (${S.yearsToGoal === Infinity ? '>100 years' : ''}) or require extremely high contributions (${S.contributionNeeded !== null ? UTILS.formatCurrency(S.contributionNeeded, true) + '/mo' : ''}). Consider adjusting your goal amount, increasing your return rate assumption (cautiously), extending your timeframe, or significantly increasing initial/monthly investments.</p>`;
        } else if ((S.yearsToGoal !== null && S.yearsToGoal >= 0) || (S.contributionNeeded !== null && S.contributionNeeded >= 0)) {
             // Goal is reachable or already reached
              const timeResult = S.yearsToGoal !== null ? ` in ~${UTILS.formatNumber(S.yearsToGoal, 1)} years` : '';
              const contribResult = S.contributionNeeded !== null ? ` with ~${UTILS.formatCurrency(S.contributionNeeded, true)}/month contribution` : '';
              const alreadyMet = S.yearsToGoal === 0 ? ' (Goal already met/exceeded by initial investment!)' : '';

             html += `<p class="positive-insight">**Goal Status: On Track!** Your plan projects you can reach your goal of ${UTILS.formatCurrency(S.financialGoal)}${timeResult}${contribResult}${alreadyMet}.</p>`;
        }
    } else { // General FV projection comment
         html += `<p>Your projection shows a future value of **${UTILS.formatCurrency(finalFV)}**. After adjusting for the expected ${UTILS.formatPercent(S.inflationRate)} inflation, the estimated value in today's dollars is **${UTILS.formatCurrency(finalAdjustedFV)}**.</p>`;
    }


    // --- Actionable/Monetization Insights ---
    html += `<h4>Strategic Analysis & Recommendations:</h4>`;
    let insightsAdded = 0;

    // 1. Impact of Inflation
    const inflationErosionPercent = finalFV > 0 ? (finalFV - finalAdjustedFV) / finalFV * 100 : 0;
    if (inflationErosionPercent > 30 && timeHorizon > 10) {
        insightsAdded++;
        html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-arrow-trend-down"></i> **Inflation Impact Warning**
            </div>
            <p>Inflation is projected to erode over **${UTILS.formatPercent(inflationErosionPercent)}** of your future value's purchasing power over ${UTILS.formatNumber(timeHorizon)} years. To combat this, aim for investments with returns significantly higher than the ${UTILS.formatPercent(S.inflationRate)} inflation rate.</p>
            <p><strong><i class="fas fa-handshake"></i> Affiliate Recommendation:</strong> Explore growth-oriented investments like diversified stock market ETFs. <a href="#" target="_blank" rel="noopener sponsored">Compare top US brokerage accounts offering low-cost ETFs.</a></p>
        `;
    }

    // 2. Power of Compounding
    if (gainsRatio > 0.5 && timeHorizon >= 10) { // Reduced time horizon check
        insightsAdded++;
        html += `
            <div class="recommendation-alert low-priority">
                <i class="fas fa-seedling"></i> **Power of Compounding is Working!**
            </div>
            <p>Over **${UTILS.formatPercent(gainsRatio * 100)}** of your projected future value comes from compound gains, not just your contributions (${UTILS.formatCurrency(S.totalPrincipal)})! The longer you invest (**${UTILS.formatNumber(timeHorizon)} years**), the more powerful this effect becomes.</p>
             <p><strong><i class="fas fa-handshake"></i> Sponsor Recommendation:</strong> Maximize compounding by contributing consistently. Consider automating your investments. <a href="#" target="_blank" rel="noopener sponsored">Learn about automated investing with our partner Robo-Advisors.</a></p>
       `;
    } else if (gainsRatio < 0.2 && timeHorizon >= 5) { // Low gains ratio
         insightsAdded++;
          html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-chart-line"></i> **Compounding Opportunity**
            </div>
            <p>Currently, only **${UTILS.formatPercent(gainsRatio * 100)}** of your future value is projected from gains. To accelerate growth, consider increasing contributions or exploring investments with potentially higher (though riskier) returns.</p>
             <p><strong><i class="fas fa-handshake"></i> Affiliate Recommendation:</strong> Understand your risk tolerance. <a href="#" target="_blank" rel="noopener affiliate">Take a free risk assessment with our partner platform.</a></p>
        `;
    }


    // 3. Contribution Level Analysis
    const contributionPercentOfGoal = (S.monthlyContribution * 12 * timeHorizon) / S.financialGoal * 100;
    if (S.calculationMode !== 'calc-fv' && contributionPercentOfGoal < 25 && timeHorizon > 5) {
         insightsAdded++;
          html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-coins"></i> **Goal Heavily Reliant on Returns**
            </div>
            <p>Your contributions make up less than 25% of your target goal amount. Reaching this goal heavily depends on achieving the assumed **${UTILS.formatPercent(S.expectedReturnRate)}** return consistently. Consider increasing contributions to reduce reliance on market performance.</p>
             <p><strong><i class="fas fa-handshake"></i> Sponsor Recommendation:</strong> Need help finding extra cash? <a href="#" target="_blank" rel="noopener sponsored">Explore high-yield savings options with our banking partners.</a></p>
       `;

    } else if (S.monthlyContribution < 100 && S.initialInvestment < 5000 && timeHorizon > 5) {
        insightsAdded++;
         html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-triangle-exclamation"></i> **Opportunity: Increase Contributions**
            </div>
            <p>Your current monthly contribution of **${UTILS.formatCurrency(S.monthlyContribution)}** is modest. Even small increases (e.g., $50-$100/month) can significantly boost your future value due to compounding over **${UTILS.formatNumber(timeHorizon)} years**.</p>
            <p><strong><i class="fas fa-handshake"></i> Affiliate Recommendation:</strong> Find ways to save more. <a href="#" target="_blank" rel="noopener affiliate">Explore top budgeting apps to optimize your spending.</a></p>
        `;
    }

    // 4. Rate of Return Reality Check
     if (S.expectedReturnRate > 12.0) {
        insightsAdded++;
         html += `
            <div class="recommendation-alert high-priority">
                <i class="fas fa-magnifying-glass-chart"></i> **Expectation Check: High Return Rate**
            </div>
            <p>An expected annual return of **${UTILS.formatPercent(S.expectedReturnRate)}** is very optimistic and historically difficult to sustain consistently, especially over **${UTILS.formatNumber(timeHorizon)} years**. Using a more conservative rate (e.g., 7-10% based on long-term S&P 500 averages) provides a more realistic projection.</p>
             <p><strong><i class="fas fa-handshake"></i> Sponsor Recommendation:</strong> Understand investment risk and historical returns. <a href="#" target="_blank" rel="noopener sponsored">Connect with a certified financial advisor to build a portfolio aligned with realistic expectations.</a></p>
       `;
    } else if (S.expectedReturnRate < S.inflationRate + 1 && S.inflationRate > 0) {
         insightsAdded++;
         html += `
             <div class="recommendation-alert medium-priority">
                 <i class="fas fa-arrow-down"></i> **Growth Alert: Low Real Return**
             </div>
             <p>Your expected return (**${UTILS.formatPercent(S.expectedReturnRate)}**) is barely outpacing expected inflation (**${UTILS.formatPercent(S.inflationRate)}**). Your investment's *real* purchasing power may not grow significantly. Explore options to potentially enhance returns based on your risk tolerance (e.g., adding stock market exposure).</p>
             <p><strong><i class="fas fa-handshake"></i> Affiliate Recommendation:</strong> Diversification is crucial. <a href="#" target="_blank" rel="noopener affiliate">Explore low-cost, diversified investment options (like ETFs) with our partner brokers.</a></p>
         `;
     }


    // 5. Short Time Horizon Issue (for large goals or significant growth expectation)
    const growthMultiple = S.calculationMode === 'calc-fv' ? finalFV / (S.initialInvestment || 1) : S.financialGoal / (S.initialInvestment || 1);
    if (timeHorizon < 5 && growthMultiple > 1.5 && S.monthlyContribution * 12 * timeHorizon < (S.financialGoal || finalFV) * 0.5) { // Needs >50% growth in < 5yrs mostly from returns
        insightsAdded++;
         html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-clock"></i> **Timeline Alert: Aggressive Short-Term Growth**
            </div>
            <p>Expecting significant investment growth (${UTILS.formatCurrency(S.totalGains)} gains on ${UTILS.formatCurrency(S.totalPrincipal)} principal) in under 5 years often involves higher-risk investments. Ensure your portfolio allocation matches this short timeline and your risk tolerance.</p>
             <p><strong><i class="fas fa-handshake"></i> Sponsor Recommendation:</strong> Short-term volatility can impact goals. <a href="#" target="_blank" rel="noopener sponsored">Consider safer options like high-yield savings or CDs for very short-term goals.</a></p>
       `;
    }

    // Fallback / General Advice
     if (insightsAdded === 0 && calculationRan) {
        html += `
            <div class="recommendation-alert low-priority">
                <i class="fas fa-check-circle"></i> **Solid Foundation**
            </div>
            <p>Your investment plan parameters appear reasonable for a **${UTILS.formatNumber(timeHorizon)} year** horizon. Consistency in contributions and patience are key to leveraging compound growth effectively.</p>
            <p><strong><i class="fas fa-handshake"></i> Next Step:</strong> Maximize your long-term growth potential by utilizing tax-advantaged accounts like IRAs or 401(k)s. <a href="#" target="_blank" rel="noopener affiliate">Learn more about retirement accounts and contribution limits with our partner resources.</a></p>
        `;
    }

    output.innerHTML = html;
     // Speak insights if TTS is enabled
     if (INVESTMENT_CALCULATOR.isTTSEnabled) {
        const insightsText = output.textContent; // Get text content of insights
        SPEECH.speak(insightsText);
    }
}


/* ========================================================================== */
/* VI. CHARTING MODULE (Investment Growth) */
/* ========================================================================== */

function updateChart() {
    const S = INVESTMENT_CALCULATOR.STATE;
    const ctx = document.getElementById('investmentGrowthChart');
     if (!ctx) return; // Exit if canvas not found
     const context = ctx.getContext('2d');


    // Clear previous chart and handle cases with no data
    if (INVESTMENT_CALCULATOR.charts.investmentGrowthChart) {
        INVESTMENT_CALCULATOR.charts.investmentGrowthChart.destroy();
        INVESTMENT_CALCULATOR.charts.investmentGrowthChart = null;
    }
    if (!S.annualData || S.annualData.length === 0) {
        // Optionally display placeholder
         context.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
         context.textAlign = 'center';
         context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-text-light');
         context.fillText('Enter data to generate chart.', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    const labels = S.annualData.map(d => `${d.year}`); // Just year number for cleaner axis
    const totalValueData = S.annualData.map(d => d.endBalance);
    const principalData = S.annualData.map((d, i) => S.initialInvestment + (S.monthlyContribution * 12 * (i + 1)) ); // Correct cumulative principal
    const inflationAdjustedData = S.annualData.map(d => d.inflationAdjustedBalance);


    const isDarkMode = document.documentElement.getAttribute('data-color-scheme') === 'dark';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDarkMode ? 'white' : 'black';

    INVESTMENT_CALCULATOR.charts.investmentGrowthChart = new Chart(context, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Value (Nominal)',
                    data: totalValueData,
                    borderColor: 'var(--color-chart-total)',
                    backgroundColor: 'rgba(19, 52, 59, 0.1)',
                    fill: false, // Changed fill for clarity
                    tension: 0.1,
                    yAxisID: 'y-value',
                     pointRadius: S.annualData.length <= 10 ? 3 : 0, // Show points for shorter periods
                     pointHoverRadius: 5
                },
                {
                    label: 'Total Principal Invested',
                    data: principalData,
                    borderColor: 'var(--color-chart-principal)',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.1,
                    yAxisID: 'y-value',
                     pointRadius: 0,
                     pointHoverRadius: 0
                },
                 {
                    label: 'Value (Inflation-Adjusted)',
                    data: inflationAdjustedData,
                    borderColor: 'var(--color-chart-inflation)',
                    fill: false,
                    tension: 0.1,
                    yAxisID: 'y-value',
                    hidden: S.inflationRate <= 0, // Hide if inflation is zero
                     pointRadius: 0,
                     pointHoverRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false }, // Show tooltips for all lines on hover
            plugins: {
                legend: { position: 'bottom', labels: { color: textColor, usePointStyle: true } },
                tooltip: {
                    mode: 'index', // Ensure tooltip shows data for all datasets at that index
                    intersect: false,
                    callbacks: {
                         title: (tooltipItems) => `Year ${tooltipItems[0].label}`, // Show Year in title
                        label: (context) => {
                             const label = context.dataset.label || '';
                             const value = context.parsed.y;
                             // Find the corresponding annual data entry
                             const yearData = S.annualData[context.dataIndex];
                             let detail = '';
                             if (label === 'Total Value (Nominal)' && yearData) {
                                 detail = ` (Gains: ${UTILS.formatCurrency(value - principalData[context.dataIndex])})`;
                             }
                             return `${label}: ${UTILS.formatCurrency(value)}${detail}`;
                        }
                    }
                }
            },
            scales: {
                y: { // y-value axis
                    title: { display: true, text: 'Value ($)', color: textColor },
                    ticks: { color: textColor, callback: (value) => value >= 1000 ? UTILS.formatCurrency(value / 1000) + 'K' : UTILS.formatCurrency(value) },
                    grid: { color: gridColor },
                    beginAtZero: true
                },
                x: {
                    title: { display: true, text: 'Time (Years)', color: textColor },
                    ticks: { color: textColor, maxTicksLimit: S.annualData.length > 20 ? 10 : S.annualData.length }, // Limit ticks for long periods
                    grid: { color: gridColor }
                }
            }
        }
    });
}

/* ========================================================================== */
/* VII. DATA TABLE & EXPORT */
/* ========================================================================== */

function updateDataTable() {
    const S = INVESTMENT_CALCULATOR.STATE;
    const tableBody = document.querySelector('#annual-data-table tbody');
    if (!tableBody) return; // Exit if table not found
    tableBody.innerHTML = ''; // Clear previous data

    if (!S.annualData || S.annualData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No data to display. Enter parameters and calculate.</td></tr>';
        return;
    }

    const fragment = document.createDocumentFragment();
    S.annualData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.year}</td>
            <td>${UTILS.formatCurrency(item.startBalance)}</td>
            <td>${UTILS.formatCurrency(item.contributions)}</td>
            <td>${UTILS.formatCurrency(item.interestEarned)}</td>
            <td>${UTILS.formatCurrency(item.endBalance)}</td>
            <td>${UTILS.formatCurrency(item.inflationAdjustedBalance)}</td>
        `;
        fragment.appendChild(row);
    });
    tableBody.appendChild(fragment);
}

function exportDataToCSV() {
    const S = INVESTMENT_CALCULATOR.STATE;
    if (!S.annualData || S.annualData.length === 0) {
        UTILS.showToast('No data available to export.', 'error');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    const header = ['Year', 'Start Balance ($)', 'Contributions ($)', 'Interest Earned ($)', 'End Balance ($)', 'Inflation Adjusted Balance ($)'];
    csvContent += header.join(',') + '\n';

    S.annualData.forEach(item => {
        // Format numbers without currency symbols or commas for CSV
        const formatForCSV = (num) => (typeof num === 'number' ? num.toFixed(2) : '0.00');
        const row = [
            item.year,
            formatForCSV(item.startBalance),
            formatForCSV(item.contributions),
            formatForCSV(item.interestEarned),
            formatForCSV(item.endBalance),
            formatForCSV(item.inflationAdjustedBalance),
        ];
        csvContent += row.join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filename = S.calculationMode === 'calc-fv'
        ? `investment_projection_${S.yearsToGrow}yrs.csv`
        : `investment_goal_plan_${S.financialGoal}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    UTILS.showToast('Annual data exported to CSV!', 'success');
}


/* ========================================================================== */
/* VIII. UI UPDATER & DISPLAY */
/* ========================================================================== */

function updateResultsDisplay() {
    const S = INVESTMENT_CALCULATOR.STATE;
    const fvSummaryContainer = document.getElementById('fv-results-summary');
    const fvSummaryValue = document.getElementById('future-value-total');
    const fvSummaryDetails = document.getElementById('investment-summary-details');
    const inflationAdjSummary = document.getElementById('inflation-adjusted-value');

    const goalSummaryContainer = document.getElementById('goal-results-summary');
    const goalFigure = document.getElementById('goal-result-figure');
    const goalUnit = document.getElementById('goal-result-unit');
    const goalDetails = document.getElementById('goal-details-summary');

    // Hide both summaries initially
    fvSummaryContainer.classList.add('hidden');
    goalSummaryContainer.classList.add('hidden');

    // Display based on mode
    if (S.calculationMode === 'calc-fv') {
        fvSummaryContainer.classList.remove('hidden');
        fvSummaryValue.textContent = UTILS.formatCurrency(S.futureValue);
        fvSummaryDetails.innerHTML = `Total Principal: ${UTILS.formatCurrency(S.totalPrincipal)} | Total Gains: ${UTILS.formatCurrency(S.totalGains)}`;
        inflationAdjSummary.innerHTML = `Inflation-Adjusted: ${UTILS.formatCurrency(S.inflationAdjustedFV)} <span class="input-note">(in today's dollars, assuming ${UTILS.formatPercent(S.inflationRate)} inflation)</span>`;
    } else { // Goal modes
         goalSummaryContainer.classList.remove('hidden');
         if (S.yearsToGoal !== null) { // Time to Goal results
             if(S.yearsToGoal === Infinity) {
                 goalFigure.textContent = 'Never';
                 goalUnit.textContent = '';
                 goalDetails.textContent = 'Goal may be unreachable with current inputs.';
             } else if (S.yearsToGoal === 0) {
                  goalFigure.textContent = 'Met';
                 goalUnit.textContent = '';
                 goalDetails.textContent = `Goal of ${UTILS.formatCurrency(S.financialGoal)} already reached/exceeded.`;
             } else {
                 goalFigure.textContent = UTILS.formatNumber(S.yearsToGoal, 1);
                 goalUnit.textContent = S.yearsToGoal <= 1 ? 'Year' : 'Years';
                 goalDetails.textContent = `Needed to reach ${UTILS.formatCurrency(S.financialGoal)} with ${UTILS.formatCurrency(S.monthlyContribution)}/mo.`;
             }
         } else if (S.contributionNeeded !== null) { // Contribution Needed results
             if(S.contributionNeeded === Infinity) {
                 goalFigure.textContent = 'N/A';
                 goalUnit.textContent = '';
                 goalDetails.textContent = 'Cannot calculate contribution needed.';
             } else {
                 goalFigure.textContent = UTILS.formatCurrency(S.contributionNeeded, true);
                 goalUnit.textContent = '/ month';
                 goalDetails.textContent = `Contribution needed for ${UTILS.formatNumber(S.yearsToGrow)} years to reach ${UTILS.formatCurrency(S.financialGoal)}.`;
             }
         } else { // Default state for goal tab before calculation
             goalFigure.textContent = '--';
             goalUnit.textContent = '';
             goalDetails.textContent = 'Calculate time or contribution needed.';
         }
    }
}


/* ========================================================================== */
/* IX. THEME MANAGER, PWA, VOICE (Functional Implementation) */
/* ========================================================================== */

const THEME_MANAGER = (function() {
    const COLOR_SCHEME_KEY = 'finguid-color-scheme';
    function loadUserPreferences() {
        const savedScheme = localStorage.getItem(COLOR_SCHEME_KEY) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-color-scheme', savedScheme);
        updateToggleButton(savedScheme);
    }
    function updateToggleButton(scheme) {
        const icon = document.querySelector('#toggle-color-scheme i');
        if (icon) icon.className = scheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
    function toggleColorScheme() {
        const currentScheme = document.documentElement.getAttribute('data-color-scheme');
        const newScheme = currentScheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-color-scheme', newScheme);
        localStorage.setItem(COLOR_SCHEME_KEY, newScheme);
        updateToggleButton(newScheme);
        // Chart redraw needs to happen *after* styles update
        setTimeout(() => {
            if (INVESTMENT_CALCULATOR.charts.investmentGrowthChart) updateChart();
        }, 50);
         UTILS.showToast(`Switched to ${newScheme} mode`, 'info');
    }
    return { loadUserPreferences, toggleColorScheme };
})();


const SPEECH = (function() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;
    const synthesis = INVESTMENT_CALCULATOR.speechSynthesis;

    function initialize() {
        const voiceButton = document.getElementById('toggle-voice-command');
        const ttsButton = document.getElementById('toggle-text-to-speech');
        const statusText = document.getElementById('voice-status-text');

        if (!recognition) {
            voiceButton.disabled = true;
            statusText.textContent = 'Not Supported';
            console.error('Speech Recognition not supported.');
            // Disable TTS button if synthesis is also not supported
            if (!synthesis) ttsButton.disabled = true;
            return;
        }

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            INVESTMENT_CALCULATOR.isListening = true;
            voiceButton.classList.replace('voice-inactive', 'voice-active');
            statusText.textContent = 'Listening...';
        };
        recognition.onend = () => {
            INVESTMENT_CALCULATOR.isListening = false;
            voiceButton.classList.replace('voice-active', 'voice-inactive');
            statusText.textContent = 'Voice OFF';
        };
        recognition.onerror = (event) => {
            if (event.error !== 'no-speech' && event.error !== 'audio-capture' && event.error !== 'aborted') { // Avoid common non-errors
                 UTILS.showToast(`Voice Error: ${event.error}`, 'error');
                 console.error('Speech recognition error:', event.error);
            }
             INVESTMENT_CALCULATOR.isListening = false; // Ensure state resets
             voiceButton.classList.replace('voice-active', 'voice-inactive');
             statusText.textContent = 'Voice OFF';
        };
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase().trim();
            console.log("Voice Command Received:", transcript);
            processVoiceCommand(transcript);
        };

        voiceButton.addEventListener('click', toggleVoiceCommand);
        ttsButton.addEventListener('click', toggleTTS);

         // Initial TTS state
         INVESTMENT_CALCULATOR.isTTSEnabled = ttsButton.classList.contains('tts-active');

    }

     function toggleVoiceCommand() {
        if (!recognition) return;
        if (INVESTMENT_CALCULATOR.isListening) {
             recognition.stop();
        } else {
             if (synthesis && synthesis.speaking) {
                synthesis.cancel(); // Stop TTS if starting voice recognition
             }
             try {
                recognition.start();
             } catch(e) { console.error("Error starting recognition:", e); }
        }
    }

     function toggleTTS() {
        INVESTMENT_CALCULATOR.isTTSEnabled = !INVESTMENT_CALCULATOR.isTTSEnabled;
        const button = document.getElementById('toggle-text-to-speech');
        button.classList.toggle('tts-active', INVESTMENT_CALCULATOR.isTTSEnabled);
        button.classList.toggle('tts-inactive', !INVESTMENT_CALCULATOR.isTTSEnabled);
        UTILS.showToast(INVESTMENT_CALCULATOR.isTTSEnabled ? 'Text-to-Speech Enabled' : 'Text-to-Speech Disabled', 'info');
         if (!INVESTMENT_CALCULATOR.isTTSEnabled && synthesis && synthesis.speaking) {
            synthesis.cancel(); // Stop speaking if TTS is turned off
        }
    }

    function speak(text) {
        if (!synthesis || !INVESTMENT_CALCULATOR.isTTSEnabled || !text) return;

        // Clean text for better speech synthesis
        const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\$\d{1,3}(?:,\d{3})*(?:\.\d+)?K?/g, match => {
            return match.replace(/[$,K]/g, '').replace(/(\d+)/, '$1 dollars'); // Read currency better
        }).replace(/%/g, ' percent').replace(/~ /g, 'approximately ').replace(/\s+/g, ' ').trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        // Optional: Cancel previous speech
        if (synthesis.speaking) {
            synthesis.cancel();
        }
         // Small delay before speaking
         setTimeout(() => synthesis.speak(utterance), 100);

    }

    function processVoiceCommand(command) {
        let responseText = "Sorry, I didn't catch that. Try 'Set initial investment to 5000' or 'Calculate time to goal'.";
        let shouldSpeak = true;
        let recalculate = false;

        try {
            // Check for calculation triggers first
            if (command.includes('calculate future value')) {
                 switchToTab('calc-fv'); // Switch to FV tab
                 updateCalculations();
                 responseText = `Calculating future value based on current inputs.`;
                 recalculate = false; // Already done by updateCalculations
            } else if (command.includes('calculate time')) {
                 switchToTab('calc-goal');
                 INVESTMENT_CALCULATOR.STATE.triggeredMode = 'calc-goal-time';
                 updateCalculations();
                 responseText = `Calculating the time needed to reach your goal.`;
                 recalculate = false;
            } else if (command.includes('calculate contribution')) {
                 switchToTab('calc-goal');
                 INVESTMENT_CALCULATOR.STATE.triggeredMode = 'calc-goal-contribution';
                 updateCalculations();
                 responseText = `Calculating the monthly contribution needed.`;
                  recalculate = false;
            }
             // Input setting commands
             else if (command.startsWith('set initial investment to')) {
                const value = command.match(/(\d{1,3}(?:,\d{3})*|\d+)/);
                if (value) {
                    const amount = UTILS.parseInput(value[0].replace(/,/g, ''));
                    document.getElementById('initial-investment').value = amount;
                    document.getElementById('initial-investment-goal').value = amount;
                    responseText = `Initial investment set to ${UTILS.formatCurrency(amount)}.`;
                    recalculate = true;
                }
            } else if (command.startsWith('set monthly contribution to')) {
                 const value = command.match(/(\d{1,3}(?:,\d{3})*|\d+)/);
                 if (value) {
                     const amount = UTILS.parseInput(value[0].replace(/,/g, ''));
                     document.getElementById('monthly-contribution').value = amount;
                     document.getElementById('monthly-contribution-goal').value = amount;
                     responseText = `Monthly contribution set to ${UTILS.formatCurrency(amount)}.`;
                     recalculate = true;
                 }
            } else if (command.startsWith('set years to grow to') || command.startsWith('set time to')) {
                 const value = command.match(/(\d+)/);
                 if (value) {
                     const years = UTILS.parseInput(value[0]);
                     document.getElementById('years-to-grow').value = years;
                     document.getElementById('years-to-grow-goal').value = years;
                     responseText = `Years set to ${years}.`;
                     recalculate = true;
                 }
            } else if (command.startsWith('set return rate to')) {
                 const value = command.match(/(\d+(\.\d+)?)/);
                 if (value) {
                     const rate = UTILS.parseInput(value[0]);
                     document.getElementById('expected-return-rate').value = rate;
                     document.getElementById('expected-return-rate-goal').value = rate;
                     responseText = `Expected return rate set to ${UTILS.formatPercent(rate)}.`;
                     recalculate = true;
                 }
            } else if (command.startsWith('set financial goal to') || command.startsWith('set goal to')) {
                 const value = command.match(/(\d{1,3}(?:,\d{3})*|\d+)/);
                 if (value) {
                     const amount = UTILS.parseInput(value[0].replace(/,/g, ''));
                     document.getElementById('financial-goal').value = amount;
                     responseText = `Financial goal set to ${UTILS.formatCurrency(amount)}.`;
                     recalculate = true;
                      // Switch to goal tab if setting
