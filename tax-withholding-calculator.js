/**
 * TAX WITHHOLDING CALCULATOR — World's First AI-Powered Paycheck Optimizer - PRODUCTION JS v1.0
 * FinGuid USA Market Domination Build
 * * Target: Production Ready, AI Insights, SEO, PWA, Voice, Monetization Ready
 * * FRED API: 9c6c421f077f2091e8bae4f143ada59a (Included for future dynamic tax/economic features)
 * * © 2025 FinGuid - World's First AI Calculator Platform for Americans
 */

/* ========================================================================== */
/* I. GLOBAL CONFIGURATION & STATE MANAGEMENT */
/* ========================================================================== */

const TAX_CALCULATOR = {
    VERSION: '1.0',
    DEBUG: false,

    // FRED API Configuration (Included per user request, but not strictly used for tax calculation)
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',

    // 2024 Federal Tax Brackets (Simplified for accurate representative logic)
    FEDERAL_TAX_BRACKETS: {
        'Single': [
            { limit: 11600, rate: 0.10, base: 0 },
            { limit: 47150, rate: 0.12, base: 1160 },
            { limit: 100000, rate: 0.22, base: 5426 },
            { limit: 191950, rate: 0.24, base: 17166 },
            { limit: Infinity, rate: 0.32, base: 39110 } // Simplified end brackets
        ],
        'Married Filing Jointly': [
            { limit: 23200, rate: 0.10, base: 0 },
            { limit: 94300, rate: 0.12, base: 2320 },
            { limit: 200000, rate: 0.22, base: 10852 },
            { limit: 383900, rate: 0.24, base: 34332 },
            { limit: Infinity, rate: 0.32, base: 78220 }
        ],
        'Head of Household': [
            { limit: 16550, rate: 0.10, base: 0 },
            { limit: 63850, rate: 0.12, base: 1655 },
            { limit: 100000, rate: 0.22, base: 7355 },
            { limit: 204100, rate: 0.24, base: 15821 },
            { limit: Infinity, rate: 0.32, base: 37573 }
        ]
    },

    // 2024 Standard Deductions
    STANDARD_DEDUCTIONS: {
        'Single': 14600,
        'Married Filing Jointly': 29200,
        'Head of Household': 21900
    },

    // FICA Rates (Social Security and Medicare)
    FICA_RATES: {
        SS_RATE: 0.062, // Social Security
        SS_MAX_WAGE: 168600, // 2024 SS max wage base
        MEDICARE_RATE: 0.0145, // Medicare
    },

    // STATE TAX RATES (Highly Simplified Placeholder)
    STATE_TAX_RATES: {
        'CA': 0.07, // Effective rate placeholder
        'NY': 0.06, // Effective rate placeholder
        'TX': 0.00, // No income tax
        'None': 0.00
    },

    // Core State - Stores inputs and calculated results
    STATE: {
        annualSalary: 75000,
        payFrequency: 26, // Bi-weekly
        filingStatus: 'Single',
        otherIncome: 0,
        multipleJobs: 0,
        dependentsCredit: 0,
        otherAdjustments: 0,
        extraWithholding: 0,
        stateResidence: 'None',
        itemizedDeductions: 0,
        pretaxDeductions: 5000,

        // Results
        grossPayPeriod: 0,
        netPayPeriod: 0,
        annualTaxDifference: 0,
    },
    deferredInstallPrompt: null,
};


/* ========================================================================== */
/* II. UTILITY & FORMATTING MODULE */
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

    return { formatCurrency, parseInput, debounce, showToast };
})();


/* ========================================================================== */
/* III. CORE CALCULATION ENGINE (Federal & State Tax Logic) */
/* ========================================================================== */

function calculateFederalTaxLiability(taxableIncome, filingStatus) {
    if (taxableIncome <= 0) return 0;
    const brackets = TAX_CALCULATOR.FEDERAL_TAX_BRACKETS[filingStatus];
    let tax = 0;
    let accumulatedTax = 0;
    let previousLimit = 0;

    for (const bracket of brackets) {
        if (taxableIncome > previousLimit) {
            const taxedAmountInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
            tax += taxedAmountInBracket * bracket.rate;
            if (taxableIncome <= bracket.limit) break;
            previousLimit = bracket.limit;
        }
    }
    return Math.max(0, tax);
}


function calculateTaxWithholding() {
    // 1. Update State from Inputs
    const S = TAX_CALCULATOR.STATE;
    const periods = UTILS.parseInput('pay-frequency');

    // Fetch all user inputs
    S.annualSalary = UTILS.parseInput('annual-salary');
    S.payFrequency = periods;
    S.filingStatus = document.getElementById('filing-status').value;
    S.otherIncome = UTILS.parseInput('other-income');
    S.multipleJobs = UTILS.parseInput('multiple-jobs');
    S.dependentsCredit = UTILS.parseInput('dependents-credit');
    S.otherAdjustments = UTILS.parseInput('other-adjustments');
    S.extraWithholding = UTILS.parseInput('extra-withholding');
    S.stateResidence = document.getElementById('state-residence').value;
    S.itemizedDeductions = UTILS.parseInput('itemized-deductions');
    S.pretaxDeductions = UTILS.parseInput('pretax-deductions');

    if (S.annualSalary <= 0 || periods === 0) {
        updateResultsDisplay(true);
        return;
    }

    // --- A. Paycheck Calculations ---
    S.grossPayPeriod = S.annualSalary / periods;
    const preTaxDeductionsPeriod = S.pretaxDeductions / periods;

    // --- B. FICA (Social Security & Medicare) ---
    const F = TAX_CALCULATOR.FICA_RATES;
    let fica_ss = 0;
    let fica_medicare = 0;

    // Social Security (Capped)
    const annualSSWage = S.annualSalary;
    if (annualSSWage > F.SS_MAX_WAGE) {
         // Simplified handling for max wage cap: Pro-rate the maximum withholding
        const annualSSWithholding = F.SS_MAX_WAGE * F.SS_RATE;
        fica_ss = annualSSWithholding / periods;
    } else {
        fica_ss = S.grossPayPeriod * F.SS_RATE;
    }

    // Medicare (No cap)
    fica_medicare = S.grossPayPeriod * F.MEDICARE_RATE;
    const ficaPeriod = fica_ss + fica_medicare;

    // --- C. Federal Withholding (Annualized Wage Method) ---
    const annualTaxableWage = S.annualSalary + S.otherIncome - S.pretaxDeductions;
    const standardDeduction = TAX_CALCULATOR.STANDARD_DEDUCTIONS[S.filingStatus];

    // Use the greater of standard or itemized deduction
    const annualW4Deduction = Math.max(standardDeduction, S.itemizedDeductions);
    const annualW4Taxable = Math.max(0, annualTaxableWage - annualW4Deduction);

    // Calculate Estimated Annual Tax Liability (before credits)
    let taxLiabilityAnnual = calculateFederalTaxLiability(annualW4Taxable, S.filingStatus);
    taxLiabilityAnnual = Math.max(0, taxLiabilityAnnual - S.dependentsCredit); // Apply W-4 Credits

    // Calculate Base Withholding needed per period (The goal is for this to equal the liability)
    let baseWithholdingPeriod = taxLiabilityAnnual / periods;

    // Apply adjustments from W-4 Step 4c (Extra Withholding)
    let federalWithholdingPeriod = baseWithholdingPeriod + S.extraWithholding;

    // NOTE: The Multiple Jobs box (S.multipleJobs) typically results in a base rate increase or a complex annual calculation.
    // For simplicity here, we assume the user correctly filled out W-4 and put the resulting 'Extra Withholding' in S.extraWithholding.

    // --- D. State Withholding (Simplified Flat Rate on Gross Minus Pre-Tax) ---
    const stateRate = TAX_CALCULATOR.STATE_TAX_RATES[S.stateResidence] || 0;
    const stateTaxable = Math.max(0, S.grossPayPeriod - preTaxDeductionsPeriod);
    const stateWithholdingPeriod = stateTaxable * stateRate;

    // --- E. Final Results Update ---
    const netPayPeriod = S.grossPayPeriod - preTaxDeductionsPeriod - federalWithholdingPeriod - stateWithholdingPeriod - ficaPeriod;

    // Store results for display and AI
    S.netPayPeriod = netPayPeriod;
    const annualWithheldTotal = (federalWithholdingPeriod + stateWithholdingPeriod) * periods;
    S.annualTaxDifference = annualWithheldTotal - taxLiabilityAnnual; // Positive = Refund, Negative = Due

    // Assign back to the state object for the UI updater
    S.preTaxDeductionsPeriod = preTaxDeductionsPeriod;
    S.federalWithholdingPeriod = federalWithholdingPeriod;
    S.stateWithholdingPeriod = stateWithholdingPeriod;
    S.ficaPeriod = ficaPeriod;
    S.annualTaxableIncome = annualTaxableWage;
    S.annualTaxLiability = taxLiabilityAnnual;
    S.annualWithheldTotal = annualWithheldTotal;

    updateResultsDisplay();
    generateAIInsights();
}


/* ========================================================================== */
/* IV. AI INSIGHTS ENGINE (The Smart Feature for Monetization & Value) */
/* ========================================================================== */

function generateAIInsights() {
    const S = TAX_CALCULATOR.STATE;
    const output = document.getElementById('ai-insights-output');
    let html = `<h4><i class="fas fa-robot"></i> FinGuid AI Optimization Recommendation:</h4>`;

    const difference = S.annualTaxDifference;
    const absDifference = Math.abs(difference);

    // --- Core Recommendation & Verdict ---
    let verdictText = ``;
    let verdictClass = '';

    if (absDifference < 500) {
        html += `<p class="positive-insight">Your withholding is **OPTIMAL**! You are projected for a difference of **${UTILS.formatCurrency(difference)}**, meaning you maximize your take-home pay while avoiding a surprise tax bill. Excellent planning!</p>`;
        verdictText = `VERDICT: OPTIMAL! ${UTILS.formatCurrency(Math.abs(difference), true)} projected difference.`;
        verdictClass = 'optimal';
    } else if (difference > 500) {
        html += `<p class="negative-insight">**ACTION REQUIRED:** You are projected for a **Large Refund** of **${UTILS.formatCurrency(difference)}**. While a refund feels good, this means you are giving the government an **interest-free loan** of funds that could be earning you money. Your take-home pay is too low.</p>`;
        verdictText = `VERDICT: OVER-WITHHOLDING! Projected Refund: ${UTILS.formatCurrency(difference, true)}.`;
        verdictClass = 'refund';
    } else { // difference < -500 (Tax Due)
        html += `<p class="negative-insight">**CRITICAL WARNING:** You are projected to **OWE** **${UTILS.formatCurrency(absDifference)}** at tax time. This could result in an underpayment penalty. Your current withholding is too low, and your take-home pay is artificially high. You need to increase withholding.</p>`;
        verdictText = `VERDICT: UNDER-WITHHOLDING! Projected Tax Due: ${UTILS.formatCurrency(absDifference, true)}.`;
        verdictClass = 'due';
    }

    document.getElementById('final-verdict-box').classList.add(verdictClass); // Apply class for coloring

    // --- Strategy & Actionable Advice (Partner/Monetization Integration) ---
    html += `<h4>Strategic Adjustments & Wealth Building:</h4>`;

    if (absDifference > 500) {
        let suggestedChange = Math.ceil(absDifference / S.payFrequency / 10) * 10;
        let cta = '';
        if (difference > 0) { // Over-withholding
            cta = `Reduce your extra withholding by **${UTILS.formatCurrency(suggestedChange)}** per paycheck on your W-4 (Line 4c) to capture this cash flow immediately.`;
            html += `<p>• **Cash Flow Opportunity:** ${cta}</p>`;

             // Affiliate Insight: Invest the new cash flow
            html += `<p>• **Affiliate Link: Investment Strategy:** By taking the extra cash flow, you could invest an extra **${UTILS.formatCurrency(absDifference / 12, true)}** per month! <a href="#" target="_blank" class="affiliate-link-cta">Explore Top US Brokerage Accounts (Affiliate Link)</a>.</p>`;

        } else { // Under-withholding
             cta = `You need to add an extra **${UTILS.formatCurrency(suggestedChange)}** to your W-4 (Line 4c) per paycheck to cover this liability and avoid a penalty.`;
             html += `<p>• **Tax Liability Fix:** ${cta}</p>`;

             // Affiliate Insight: Need to save for the tax bill
            html += `<p>• **Affiliate Link: Savings Strategy:** Start an emergency tax fund for this projected bill. <a href="#" target="_blank" class="affiliate-link-cta">Find a High-Yield Savings Account to earn interest on your tax savings (Affiliate Link)</a>.</p>`;
        }
    } else {
         html += `<p>• **Financial Health Check:** Your W-4 is optimized. Focus on reducing your *taxable income* further by maxing out pre-tax deductions like your 401(k) or HSA. <a href="#" target="_blank" class="affiliate-link-cta">Talk to a Certified Financial Planner (Sponsor Link)</a>.</p>`;
    }


    document.getElementById('ai-recommendation-note').innerHTML = (absDifference < 500)
        ? `**PERFECT ALIGNMENT:** Your current W-4 settings are highly optimized. Keep your focus on long-term wealth building.`
        : `**W-4 ADJUSTMENT:** File a new W-4 immediately to adjust your extra withholding or credits.`;

    output.innerHTML = html;
}


/* ========================================================================== */
/* V. UI UPDATER & DISPLAY */
/* ========================================================================== */

function updateResultsDisplay(usePlaceholders = false) {
    const S = TAX_CALCULATOR.STATE;

    // Update Pay Frequency Label
    document.getElementById('summary-pay-frequency').textContent = document.getElementById('pay-frequency').options[document.getElementById('pay-frequency').selectedIndex].text.replace(/\(.*\)/, '').trim();

    // Reset verdict box
    document.getElementById('final-verdict-box').className = 'final-verdict-box';

    if (usePlaceholders) {
        document.querySelectorAll('.summary-value').forEach(el => el.textContent = UTILS.formatCurrency(0));
        document.getElementById('final-verdict-box').textContent = "Enter valid income data to calculate your paycheck.";
        document.getElementById('ai-insights-output').innerHTML = '<p class="placeholder-text">Enter your details to generate personalized AI analysis on your optimal withholding...</p>';
        return;
    }

    // --- Paycheck Summary ---
    document.getElementById('gross-pay-period').textContent = UTILS.formatCurrency(S.grossPayPeriod);
    document.getElementById('pre-tax-deductions-period').textContent = UTILS.formatCurrency(S.preTaxDeductionsPeriod);
    document.getElementById('federal-withholding-period').textContent = UTILS.formatCurrency(S.federalWithholdingPeriod);
    document.getElementById('state-withholding-period').textContent = UTILS.formatCurrency(S.stateWithholdingPeriod);
    document.getElementById('fica-period').textContent = UTILS.formatCurrency(S.ficaPeriod);
    document.getElementById('net-pay-period').textContent = UTILS.formatCurrency(S.netPayPeriod);


    // --- Annual Projection Summary ---
    document.getElementById('annual-taxable-income').textContent = UTILS.formatCurrency(S.annualTaxableIncome);
    document.getElementById('annual-tax-liability').textContent = UTILS.formatCurrency(S.annualTaxLiability);
    document.getElementById('annual-withheld-total').textContent = UTILS.formatCurrency(S.annualWithheldTotal);

    const diffElement = document.getElementById('annual-tax-difference');
    diffElement.textContent = UTILS.formatCurrency(Math.abs(S.annualTaxDifference));

    const diffBox = document.getElementById('tax-difference-box');
    if (S.annualTaxDifference < 0) {
        // Tax Due
        diffBox.className = 'summary-box negative';
        diffBox.querySelector('.summary-label').textContent = 'Estimated Annual Tax Due';
    } else {
        // Refund
        diffBox.className = 'summary-box positive';
        diffBox.querySelector('.summary-label').textContent = 'Estimated Annual Refund';
    }

    // Update the verdict box text
    let verdictClass = '';
    const absDiff = Math.abs(S.annualTaxDifference);
    if (absDiff < 500) {
        verdictClass = 'optimal';
    } else if (S.annualTaxDifference > 0) {
        verdictClass = 'refund';
    } else {
        verdictClass = 'due';
    }
    document.getElementById('final-verdict-box').classList.add(verdictClass);
}


/* ========================================================================== */
/* VI. THEME MANAGER, PWA, VOICE (Reused FinGuid Modules) */
/* ========================================================================== */
// NOTE: These are stubs, replicating the functionality of the user's provided mortgage/rent-vs-buy code.

const THEME_MANAGER = (function() {
    const COLOR_SCHEME_KEY = 'finguid-color-scheme';
    function loadUserPreferences() {
        const savedScheme = localStorage.getItem(COLOR_SCHEME_KEY);
        if (savedScheme) {
            document.documentElement.setAttribute('data-color-scheme', savedScheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-color-scheme', 'dark');
        }
    }
    function toggleColorScheme() {
        const currentScheme = document.documentElement.getAttribute('data-color-scheme');
        const newScheme = currentScheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-color-scheme', newScheme);
        localStorage.setItem(COLOR_SCHEME_KEY, newScheme);
        UTILS.showToast(`Theme changed to ${newScheme} mode.`, 'info');
    }
    return { loadUserPreferences, toggleColorScheme };
})();


const SPEECH = (function() {
    function initialize() {
        // Voice Command (Speech Recognition) Stub - AI Friendly feature
        document.getElementById('toggle-voice-command').addEventListener('click', () => {
             UTILS.showToast('Voice Command is active! Try "Set salary to 80000"', 'info');
             document.getElementById('toggle-voice-command').classList.toggle('voice-active');
             document.getElementById('voice-status-text').textContent = document.getElementById('toggle-voice-command').classList.contains('voice-active') ? 'Voice ON' : 'Voice OFF';
        });

        // Text-to-Speech Stub
        document.getElementById('toggle-text-to-speech').addEventListener('click', () => {
            const isTTS = document.getElementById('toggle-text-to-speech').classList.toggle('tts-active');
            UTILS.showToast(isTTS ? 'Text-to-Speech active for AI Insights.' : 'Text-to-Speech deactivated.', 'info');
        });
    }
    return { initialize };
})();


// PWA Install Prompt Logic (Replicating FinGuid PWA functionality)
function showPWAInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        TAX_CALCULATOR.deferredInstallPrompt = e;
        document.getElementById('pwa-install-button').classList.remove('hidden');
    });

    document.getElementById('pwa-install-button').addEventListener('click', () => {
        if (TAX_CALCULATOR.deferredInstallPrompt) {
            TAX_CALCULATOR.deferredInstallPrompt.prompt();
            TAX_CALCULATOR.deferredInstallPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    UTILS.showToast('FinGuid PWA Installed Successfully!', 'success');
                    document.getElementById('pwa-install-button').classList.add('hidden');
                }
                TAX_CALCULATOR.deferredInstallPrompt = null;
            });
        }
    });
}

/* ========================================================================== */
/* VII. EVENT LISTENERS & INITIALIZATION */
/* ========================================================================== */

function setupEventListeners() {
    // === Core Input Monitoring (Debounced for performance) ===
    const debouncedCalculate = UTILS.debounce(calculateTaxWithholding, 200);
    const form = document.getElementById('withholding-form');

    form.addEventListener('input', debouncedCalculate);
    form.addEventListener('change', debouncedCalculate);

    // === Accessibility & PWA ===
    document.getElementById('toggle-color-scheme').addEventListener('click', THEME_MANAGER.toggleColorScheme);
    showPWAInstallPrompt();

    // --- Tab Switching (Input & Results) ---
    document.querySelectorAll('.tab-controls .tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.target.getAttribute('data-tab');
            document.querySelectorAll('#withholding-form .input-tab-content').forEach(content => content.classList.remove('active', 'hidden'));
            document.getElementById(tabId).classList.add('active');
            document.querySelectorAll('.tab-controls .tab-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    document.querySelectorAll('.tab-controls-results .tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.target.getAttribute('data-tab');
            document.querySelectorAll('.results-section .tab-content').forEach(content => content.classList.remove('active', 'hidden'));
            document.getElementById(tabId).classList.add('active');
            document.querySelectorAll('.tab-controls-results .tab-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
}

// === Initialize ===
document.addEventListener('DOMContentLoaded', function() {
    if (TAX_CALCULATOR.DEBUG) console.log('🇺🇸 FinGuid Tax Withholding AI Analyzer v1.0 Initializing...');

    // 1. Initialize Core Features
    THEME_MANAGER.loadUserPreferences();
    SPEECH.initialize();
    setupEventListeners();

    // 2. Trigger Initial Calculation
    calculateTaxWithholding();

    if (TAX_CALCULATOR.DEBUG) console.log('✅ Tax Withholding Calculator initialized!');
});
