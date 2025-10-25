/**
 * RENT VS BUY AI ANALYZER — World's First AI-Powered Rent vs Buy Calculator - PRODUCTION JS v1.1
 * FinGuid USA Market Domination Build 
 * * Target: Production Ready, AI Insights, SEO, PWA, Voice, Monetization Ready
 * * FRED API: 9c6c421f077f2091e8bae4f143ada59a (Used for real-time rates)
 * * Google Analytics: G-NYBL2CDNQJ (in HTML)
 * * © 2025 FinGuid - World's First AI Calculator Platform for Americans
 */

/* ========================================================================== */
/* I. GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const RENT_VS_BUY_CALCULATOR = {
    VERSION: '1.1',
    DEBUG: false, // Set to false for production to hide console logs and toasts
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a', 
    LIVE_RATE: 6.75, // Default/Fallback Rate

    // Core State - Stores inputs and calculated results
    STATE: {
        // Inputs (Initial values are used as defaults)
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
        netAdvantage: 0, 
        breakEvenYear: -1, 
        amortization: [] 
    }
};

/* ========================================================================== */
/* II. UTILITY MODULES (UTILS, THEME, SPEECH - Re-implemented for Functionality) */
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
        if (RENT_VS_BUY_CALCULATOR.DEBUG || type === 'error' || type === 'success') {
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

// --- THEME_MANAGER Module (Full Implementation) ---
const THEME_MANAGER = { 
    toggleTheme: () => {
        const html = document.documentElement;
        const currentScheme = html.getAttribute('data-color-scheme');
        const newScheme = currentScheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-color-scheme', newScheme);
        localStorage.setItem('color-scheme', newScheme);
        THEME_MANAGER.updateToggleButton(newScheme);
        // Important: Update chart colors on theme change
        updateRentVsBuyChart(); 
        UTILS.showToast(`Theme switched to ${newScheme} mode.`, 'info');
    }, 
    loadUserPreferences: () => {
        const savedScheme = localStorage.getItem('color-scheme') || 'light';
        document.documentElement.setAttribute('data-color-scheme', savedScheme);
        THEME_MANAGER.updateToggleButton(savedScheme);
    }, 
    updateToggleButton: (scheme) => {
        const button = document.getElementById('theme-toggle-button');
        if (!button) return;
        const sun = button.querySelector('[data-mode="light"]');
        const moon = button.querySelector('[data-mode="dark"]');
        if (scheme === 'dark') {
            sun.style.display = 'none';
            moon.style.display = 'inline-block';
        } else {
            sun.style.display = 'inline-block';
            moon.style.display = 'none';
        }
    }
};

// --- SPEECH Module (Full Implementation for TTS/Voice) ---
const SPEECH = { 
    ttsEnabled: false, 
    synth: window.speechSynthesis, 
    voice: null, 
    recognition: null, // For Voice Command
    
    initialize: () => {
        // Set US English Voice
        SPEECH.synth.onvoiceschanged = () => {
            SPEECH.voice = SPEECH.synth.getVoices().find(voice => 
                voice.lang.startsWith('en-US') && voice.name.includes('Google')
            ) || SPEECH.synth.getVoices().find(voice => voice.lang.startsWith('en-US'));
        };
        // Setup Event Listeners
        document.getElementById('tts-toggle-button').addEventListener('click', SPEECH.toggleTTS);
        document.getElementById('voice-command-button').addEventListener('click', SPEECH.toggleVoiceCommand);
        
        // Initialize Web Speech Recognition API
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                SPEECH.recognition = new SpeechRecognition();
                SPEECH.recognition.continuous = false;
                SPEECH.recognition.lang = 'en-US';
                SPEECH.recognition.interimResults = false;
                SPEECH.recognition.maxAlternatives = 1;
                
                SPEECH.recognition.onresult = SPEECH.handleVoiceResult;
                SPEECH.recognition.onerror = (event) => {
                    UTILS.showToast(`Voice Error: ${event.error}`, 'error');
                    document.getElementById('voice-command-button').setAttribute('aria-pressed', 'false');
                };
                SPEECH.recognition.onend = () => {
                    document.getElementById('voice-command-button').setAttribute('aria-pressed', 'false');
                };
            } else {
                console.warn("Web Speech API not supported. Voice commands disabled.");
                document.getElementById('voice-command-button').style.display = 'none';
            }
        } catch (e) {
            console.error("Voice recognition initialization failed:", e);
            document.getElementById('voice-command-button').style.display = 'none';
        }
    }, 
    
    toggleTTS: () => {
        SPEECH.ttsEnabled = !SPEECH.ttsEnabled;
        const button = document.getElementById('tts-toggle-button');
        button.setAttribute('aria-pressed', SPEECH.ttsEnabled);
        if (SPEECH.ttsEnabled) {
            UTILS.showToast('Text-to-Speech enabled. Results will be read aloud.', 'success');
        } else {
            SPEECH.synth.cancel();
            UTILS.showToast('Text-to-Speech disabled.', 'info');
        }
    },
    
    toggleVoiceCommand: () => {
        const button = document.getElementById('voice-command-button');
        if (!SPEECH.recognition) return;

        if (button.getAttribute('aria-pressed') === 'true') {
            SPEECH.recognition.stop();
            button.setAttribute('aria-pressed', 'false');
            UTILS.showToast('Voice Command stopped.', 'info');
        } else {
            button.setAttribute('aria-pressed', 'true');
            SPEECH.recognition.start();
            UTILS.showToast('Listening for commands (e.g., "Change home price to 500,000" or "Calculate").', 'success');
        }
    },
    
    handleVoiceResult: (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        console.log('Voice Command Received:', transcript);
        UTILS.showToast(`Command: "${transcript}"`, 'info');

        // Simple Command Parsing (Enhance as needed for full AI experience)
        if (transcript.includes('calculate') || transcript.includes('run')) {
            calculateRentVsBuy();
        } else if (transcript.includes('home price to')) {
            const match = transcript.match(/home price to\s*(\d+)/);
            if (match) {
                document.getElementById('home-price').value = parseInt(match[1].replace(/\s/g, ''));
                calculateRentVsBuy();
            }
        } else if (transcript.includes('rent to')) {
            const match = transcript.match(/rent to\s*(\d+)/);
            if (match) {
                document.getElementById('monthly-rent').value = parseInt(match[1].replace(/\s/g, ''));
                calculateRentVsBuy();
            }
        } else {
            UTILS.showToast('Unrecognized command. Try "Calculate" or "Change home price to 500,000".', 'error');
        }
    },

    speak: (text) => { 
        if (!SPEECH.ttsEnabled || !SPEECH.synth.speaking) {
            SPEECH.synth.cancel(); // Stop current speech
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = SPEECH.voice;
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            SPEECH.synth.speak(utterance);
        }
    } 
};

// --- FRED_API Module --- 
const fredAPI = {
    fetchLiveRate: async () => {
        // Corrected URL structure for safety
        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=${RENT_VS_BUY_CALCULATOR.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`FRED API HTTP status: ${response.status}`);
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
            } else {
                 throw new Error("Invalid rate data received from FRED.");
            }
        } catch (error) {
            console.error('FRED API Error:', error);
            // This is the source of the user's error message, keep it clear
            UTILS.showToast(`Warning: FRED API failed. Using default rate: ${RENT_VS_BUY_CALCULATOR.LIVE_RATE}%`, 'error');
            calculateRentVsBuy(); // Calculate with default rate
        }
    },
    startAutomaticUpdates: () => fredAPI.fetchLiveRate()
};


/* ========================================================================== */
/* III. CORE CALCULATION LOGIC: Rent vs Buy Analysis (Unchanged) */
/* ========================================================================== */

function calculateMonthlyPI(principal, annualRate, termYears) { /* ... (Unchanged) ... */
    if (principal <= 0 || termYears <= 0) return 0;
    const rateMonthly = (annualRate / 100) / 12;
    const termMonths = termYears * 12;
    if (rateMonthly === 0) return principal / termMonths;
    const powerFactor = Math.pow(1 + rateMonthly, termMonths);
    return principal * (rateMonthly * powerFactor) / (powerFactor - 1);
}

function generateYearlyAmortizationSummary(principal, annualRate, termYears) { /* ... (Unchanged) ... */
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
        if (balance < principalPaid) principalPaid = balance; 
        balance -= principalPaid;
        if (balance < 0) balance = 0;

        currentYearInterest += interest;
        currentYearPrincipal += principalPaid;

        if (month % 12 === 0 || month === termMonths) {
            yearlySummary.push({
                year: Math.ceil(month / 12),
                interestPaid: currentYearInterest,
                principalPaid: currentYearPrincipal,
                endingBalance: balance
            });
            currentYearInterest = 0; 
            currentYearPrincipal = 0;
        }
        if (balance === 0) break;
    }
    return yearlySummary;
}


function calculateRentVsBuy() {
    // 1. Get All Inputs (Unchanged)
    const s = RENT_VS_BUY_CALCULATOR.STATE; 
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

    // Basic Input Validation (Unchanged)
    if (s.homePrice <= 0 || s.monthlyRent <= 0 || s.yearsToStay <= 0) {
        updateUI('clear');
        updateAIInsights('Please enter valid Home Price, Monthly Rent, and Years to Stay.');
        return;
    }
    
    // --- 2. Calculate Buying Costs Over Time (Unchanged logic) ---
    const loanAmount = s.homePrice - s.downPayment;
    if (loanAmount <= 0) { 
        s.amortization = [];
    } else {
        s.amortization = generateYearlyAmortizationSummary(loanAmount, s.interestRate, s.loanTermYears);
    }

    const buyingCostsYearly = [];
    let cumulativeBuyingCost = s.closingCostsBuy; 
    let currentHomeValue = s.homePrice;
    let totalTaxSavings = 0;
    let equityBuilt = s.downPayment; 

    for (let year = 1; year <= s.yearsToStay; year++) {
        // Annual Costs
        const yearIndex = year - 1;
        const mortgageInterestPaid = s.amortization[yearIndex]?.interestPaid || 0;
        const mortgagePrincipalPaid = s.amortization[yearIndex]?.principalPaid || 0;
        const propertyTaxes = currentHomeValue * (s.propertyTaxRate / 100);
        const insurance = s.homeInsurance * Math.pow(1.02, yearIndex); 
        const hoa = (s.hoaFees * 12) * Math.pow(1.02, yearIndex);
        const maintenance = currentHomeValue * (s.maintenanceRate / 100);

        // Tax Savings (Simplified)
        const deductibleExpenses = mortgageInterestPaid + propertyTaxes;
        const potentialTaxSavings = deductibleExpenses * (s.taxRate / 100);
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
    const netCostOfBuying = cumulativeBuyingCost - netProceedsFromSale; 

    s.buyingCosts = { yearly: buyingCostsYearly, total: cumulativeBuyingCost, netCost: netCostOfBuying };

    // --- 3. Calculate Renting Costs Over Time (Unchanged logic) ---
    const rentingCostsYearly = [];
    let cumulativeRentingCost = 0;
    let currentMonthlyRent = s.monthlyRent;

    for (let year = 1; year <= s.yearsToStay; year++) {
        const annualRent = currentMonthlyRent * 12;
        const annualRentersInsurance = s.rentersInsurance * Math.pow(1.02, year - 1);
        const annualCost = annualRent + annualRentersInsurance;
        cumulativeRentingCost += annualCost;

        rentingCostsYearly.push({
            year: year,
            cost: annualCost,
            cumulativeCost: cumulativeRentingCost
        });
        
        currentMonthlyRent *= (1 + s.rentIncreaseRate / 100);
    }
    s.rentingCosts = { yearly: rentingCostsYearly, total: cumulativeRentingCost };

    // --- 4. Calculate Opportunity Cost of Down Payment (Unchanged logic) ---
    const initialInvestment = s.downPayment + s.closingCostsBuy;
    const investmentReturnDecimal = s.investmentReturnRate / 100;
    const futureValueOfInvestment = initialInvestment * Math.pow(1 + investmentReturnDecimal, s.yearsToStay);
    s.opportunityCost = futureValueOfInvestment - initialInvestment;

    // --- 5. Calculate Net Advantage & Break-Even (Unchanged logic) ---
    s.netAdvantage = (s.rentingCosts.total + s.opportunityCost) - s.buyingCosts.netCost;
    
    s.breakEvenYear = -1;
    for (let year = 1; year <= s.yearsToStay; year++) {
        const initialInvestmentYear = s.downPayment + s.closingCostsBuy;
        const investmentReturnDecimalYear = s.investmentReturnRate / 100;

        const yrData = s.buyingCosts.yearly[year-1];
        const sellingCostYear = yrData.homeValue * (s.sellingCostsRate / 100);
        const netProceedsYear = yrData.homeValue - (s.amortization[year-1]?.endingBalance || 0) - sellingCostYear;
        const buyingNetCostYear = yrData.cumulativeCost - netProceedsYear;
        
        const opportunityCostYear = initialInvestmentYear * Math.pow(1 + investmentReturnDecimalYear, year) - initialInvestmentYear;
        const rentingTotalCostYear = s.rentingCosts.yearly[year-1].cumulativeCost + opportunityCostYear;
        
        if (buyingNetCostYear < rentingTotalCostYear) {
            s.breakEvenYear = year;
            break;
        }
    }

    // --- 6. Update UI ---
    updateUI();
}


/* ========================================================================== */
/* IV. UI RENDERING & EVENT LISTENERS (Updated with Speech Logic) */
/* ========================================================================== */

let rentVsBuyChart = null; 

function updateUI(mode = 'results') {
    const s = RENT_VS_BUY_CALCULATOR.STATE;

    // Update Summary Years Display (Unchanged)
    document.getElementById('summary-years').textContent = s.yearsToStay;
    document.querySelectorAll('.summary-years-detail').forEach(el => el.textContent = s.yearsToStay);

    if (mode === 'clear') {
        // Clear all (Unchanged)
        document.getElementById('total-renting-cost').textContent = '--.--';
        document.getElementById('net-buying-cost').textContent = '--.--';
        document.getElementById('net-advantage').textContent = '--.--';
        if (rentVsBuyChart) rentVsBuyChart.destroy();
        rentVsBuyChart = null;
        updateAIInsights('Please enter valid Home Price, Monthly Rent, and Years to Stay to run the AI analysis.'); 
        return;
    }
    
    // 1. Update Summary Card (Unchanged)
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

    // 2. Update Detailed Breakdown Tables (Unchanged)
    const buyingBody = document.getElementById('buying-breakdown-body');
    const buyingTotals = s.buyingCosts.yearly[s.yearsToStay - 1]; 
    const totalTaxSavings = s.buyingCosts.yearly.reduce((sum, yr, i) => sum + (s.amortization[i]?.interestPaid + (s.buyingCosts.yearly[i]?.homeValue || s.homePrice) * (s.propertyTaxRate / 100) > 15000 ? (s.amortization[i]?.interestPaid + (s.buyingCosts.yearly[i]?.homeValue || s.homePrice) * (s.propertyTaxRate / 100)) * (s.taxRate / 100) : 0), 0);

    buyingBody.innerHTML = `
        <tr><td>Mortgage Payments (P&I)</td><td>${UTILS.formatCurrency(s.amortization.reduce((sum, yr) => sum + yr.interestPaid + yr.principalPaid, 0))}</td></tr>
        <tr><td>Property Taxes</td><td>${UTILS.formatCurrency(s.buyingCosts.yearly.reduce((sum, yr, i) => sum + (s.buyingCosts.yearly[i]?.homeValue || s.homePrice) * (s.propertyTaxRate / 100), 0))}</td></tr>
        <tr><td>Home Insurance</td><td>${UTILS.formatCurrency(s.buyingCosts.yearly.reduce((sum, yr, i) => sum + s.homeInsurance * Math.pow(1.02, i), 0))}</td></tr>
        <tr><td>HOA Fees</td><td>${UTILS.formatCurrency(s.buyingCosts.yearly.reduce((sum, yr, i) => sum + (s.hoaFees * 12) * Math.pow(1.02, i), 0))}</td></tr>
        <tr><td>Maintenance</td><td>${UTILS.formatCurrency(s.buyingCosts.yearly.reduce((sum, yr, i) => sum + (s.buyingCosts.yearly[i]?.homeValue || s.homePrice) * (s.maintenanceRate / 100), 0))}</td></tr>
        <tr><td>Closing Costs (Initial)</td><td>${UTILS.formatCurrency(s.closingCostsBuy)}</td></tr>
        <tr class="subtotal-row"><td>Gross Buying Costs</td><td>${UTILS.formatCurrency(s.buyingCosts.total)}</td></tr>
        <tr><td>(-) Tax Savings</td><td class="text-positive">${UTILS.formatCurrency(totalTaxSavings)}</td></tr>
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
    const ctx = document.getElementById('rent-vs-buy-chart')?.getContext('2d');
    if (!ctx) return; 
    
    const years = Array.from({ length: s.yearsToStay }, (_, i) => `Year ${i + 1}`);
    
    // Calculate cumulative net buying cost and renting cost year by year (Unchanged logic)
    const cumulativeNetBuying = s.buyingCosts.yearly.map((yrData, i) => {
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

    // Color logic fixed to respect theme for Chart.js
    const isDarkMode = document.documentElement.getAttribute('data-color-scheme') === 'dark';
    const rentColor = isDarkMode ? '#F5B041' : '#ffc107'; 
    const buyColor = isDarkMode ? '#87CBD7' : '#24ACC5'; 

    const data = {
        labels: years,
        datasets: [
            {
                label: `Net Cost of Buying (After ${s.yearsToStay} Yrs)`,
                data: cumulativeNetBuying,
                borderColor: buyColor,
                backgroundColor: buyColor + '80', 
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
            title: { 
                display: true, 
                text: 'Cumulative Costs Over Time',
                color: isDarkMode ? 'white' : 'black' // Fix chart title color
            },
            tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${UTILS.formatCurrency(context.raw)}` } }
        },
        scales: {
            y: { ticks: { callback: (value) => UTILS.formatCurrency(value, false), color: isDarkMode ? 'white' : 'black' } }, // Fix axis label color
            x: { ticks: { color: isDarkMode ? 'white' : 'black' } } // Fix axis label color
        }
    };

    // Chart.js 3+ update logic
    if (rentVsBuyChart) {
        rentVsBuyChart.data = data;
        rentVsBuyChart.options = options;
        rentVsBuyChart.update();
    } else {
        rentVsBuyChart = new Chart(ctx, { type: 'line', data: data, options: options });
    }
}

/**
 * Updates the AI Insights section and uses SPEECH.speak.
 */
function updateAIInsights(errorMessage = null) {
    const outputEl = document.getElementById('ai-insights-output');
    if (!outputEl) return; 

    if (errorMessage) {
        outputEl.innerHTML = `<p class="text-negative"><i class="fas fa-exclamation-triangle"></i> ${errorMessage}</p>`;
        SPEECH.speak(errorMessage.substring(0, 200));
        return;
    }
    
    const s = RENT_VS_BUY_CALCULATOR.STATE;
    let html = '';
    
    // --- Insight Generation Logic (Unchanged) ---
    // Insight 1: Overall Recommendation
    if (s.netAdvantage > 0) {
         html += `<p><i class="fas fa-check-circle text-positive"></i> <strong>AI Recommendation: Buying Appears Favorable.</strong> Over ${s.yearsToStay} years, buying is estimated to be **${UTILS.formatCurrency(s.netAdvantage)} cheaper** than renting, considering all costs, equity, appreciation, and opportunity cost.</p>`;
    } else {
         html += `<p><i class="fas fa-times-circle text-negative"></i> <strong>AI Recommendation: Renting Appears Favorable.</strong> Over ${s.yearsToStay} years, renting is estimated to be **${UTILS.formatCurrency(Math.abs(s.netAdvantage))} cheaper** than buying, considering all factors.</p>`;
    }
    
    // Insight 2: Break-Even Point
    if (s.breakEvenYear > 0 && s.breakEvenYear <= s.yearsToStay) {
        html += `<p><strong>Key Factor:</strong> Buying becomes the more financially advantageous option after **Year ${s.breakEvenYear}**. Since you plan to stay for ${s.yearsToStay} years, buying aligns well with your long-term goal.</p>`;
    } else if (s.breakEvenYear > s.yearsToStay) {
         html += `<p><strong>Key Factor:</strong> The financial break-even point where buying becomes cheaper is estimated to be **after Year ${s.breakEvenYear}**. Since you plan to stay only ${s.yearsToStay} years, renting may be the better short-term financial choice.</p>`;
    } else if (s.netAdvantage <=0 && s.breakEvenYear === -1){
         html += `<p><strong>Key Factor:</strong> Based on current assumptions, renting remains the cheaper option for the entire ${s.yearsToStay}-year period. Buying does not reach a financial break-even point.</p>`;
    }

    // Insight 3: Sensitivity
    if (s.homeAppreciationRate > s.investmentReturnRate) {
        html += `<p><strong>Market Insight:</strong> Your expected home appreciation (${s.homeAppreciationRate}%) is higher than investment returns (${s.investmentReturnRate}%). This significantly favors buying as your home equity grows faster than alternative investments.</p>`;
    } else if (s.investmentReturnRate > s.homeAppreciationRate + 2) { 
         html += `<p><strong>Investment Insight:</strong> Your expected investment return (${s.investmentReturnRate}%) significantly outperforms home appreciation (${s.homeAppreciationRate}%). Renting and investing the down payment difference yields a strong financial advantage (Opportunity Cost: ${UTILS.formatCurrency(s.opportunityCost)}).</p>`;
    } else if (Math.abs(s.homeAppreciationRate - s.investmentReturnRate) <= 1) {
         html += `<p><strong>Investment Insight:</strong> Your home appreciation (${s.homeAppreciationRate}%) and investment return (${s.investmentReturnRate}%) rates are similar. This suggests the decision is highly sensitive to non-financial factors like housing costs and tax benefits.</p>`;
    }
    
    // Insight 4: Tax Impact
    const totalTaxSavings = s.buyingCosts.yearly.reduce((sum, yr, i) => sum + (s.amortization[i]?.interestPaid + (s.buyingCosts.yearly[i]?.homeValue || s.homePrice) * (s.propertyTaxRate / 100) > 15000 ? (s.amortization[i]?.interestPaid + (s.buyingCosts.yearly[i]?.homeValue || s.homePrice) * (s.propertyTaxRate / 100)) * (s.taxRate / 100) : 0), 0);
    if (totalTaxSavings > 1000) { 
        html += `<p><strong>Tax Consideration:</strong> Estimated tax savings from mortgage interest and property tax deductions contribute roughly **${UTILS.formatCurrency(totalTaxSavings)}** to the benefit of buying over ${s.yearsToStay} years.</p>`;
    }

    // Monetization/Action CTA (Unchanged)
    if (s.netAdvantage > 0) { 
        html += `
            <div class="ad-slot-mini ad-slot-result">
                <p class="ad-label">AI-Powered Next Step (Sponsor/Affiliate)</p>
                <a href="#affiliate-link-mortgage-prequal" class="ad-link-button">Get Pre-Qualified for a Mortgage Today <i class="fas fa-arrow-right"></i></a>
            </div>`;
    } else { 
         html += `
            <div class="ad-slot-mini ad-slot-result">
                 <p class="ad-label">AI-Powered Next Step (Sponsor/Affiliate)</p>
                <a href="#affiliate-link-renters-insurance" class="ad-link-button">Compare Renters Insurance & Investment Platforms <i class="fas fa-shield-alt"></i></a>
            </div>`;
    }

    outputEl.innerHTML = html;
    
    // Speak first part of insight only if the AI tab is currently active
    const aiTabButton = document.querySelector('[data-tab="ai-analysis"]');
    if (aiTabButton && aiTabButton.classList.contains('active')) {
        SPEECH.speak(outputEl.textContent.substring(0, 300)); // Increased limit for better context
    }
}


/* ========================================================================== */
/* V. EVENT LISTENERS & INITIALIZATION */
/* ========================================================================== */

function setupEventListeners() {
    // --- Theme & Accessibility Controls ---
    document.getElementById('theme-toggle-button').addEventListener('click', THEME_MANAGER.toggleTheme);
    // TTS/Voice listeners are now set up inside SPEECH.initialize()

    // --- Input Change for Auto-Update ---
    const form = document.getElementById('rent-vs-buy-form');
    form.addEventListener('input', calculateRentVsBuy); 
    form.addEventListener('change', calculateRentVsBuy); 

    // --- Tab Switching ---
    document.querySelectorAll('.tabs-nav .tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.target.getAttribute('data-tab');
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            e.target.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            if (tabId === 'comparison-chart' && rentVsBuyChart) {
                setTimeout(() => rentVsBuyChart.resize(), 10); 
            }
            if (tabId === 'ai-analysis') {
                 // Re-speak content if the AI tab is selected
                 const aiContent = document.getElementById('ai-insights-output').textContent;
                 if (aiContent && aiContent.length > 50) { 
                    SPEECH.speak(aiContent.substring(0, 300));
                 }
            }
        });
    });
}

// === Initialize ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('🇺🇸 FinGuid Rent vs Buy AI Analyzer v1.1 Initializing...');
    THEME_MANAGER.loadUserPreferences();
    SPEECH.initialize();
    setupEventListeners();
    fredAPI.startAutomaticUpdates(); // Fetch live rate and trigger initial calculation
    // Perform initial calculation in case FRED is slow/fails
    setTimeout(calculateRentVsBuy, 750); 
    console.log('✅ Rent vs Buy Calculator initialized!');
});
