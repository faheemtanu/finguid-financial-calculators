/**
 * ========================================================================
 * HOME LOAN PRO - WORLD'S BEST AI-POWERED MORTGAGE CALCULATOR
 * ========================================================================
 * Version: 6.4 - PRODUCTION READY (AI Insights Bug Fix)
 * Built with: SOLID Principles, WCAG 2.1 AA, PWA Compatible
 *
 * IMPROVEMENTS:
 * --- FIX: The main calculator now correctly calculates 'firstYearInterest' 
 * and 'baselineTotalInterest' and adds them to the results.
 * --- FIX: The AI Insight Engine now correctly receives and uses this data, 
 * unlocking all AI insights and improving 15-vs-30-year accuracy.
 * --- FIX: Added a guard clause for 0 payment scenarios to prevent errors.
 * --- PRESERVED: Automated FRED rate, all FAQs, layout, monetization, etc.
 * ========================================================================
 */

// ===== APP STATE & CONSTANTS (KEEP THIS ID CONFIDENCAL) =====
const FRED_API_KEY = '9c6c421f077f2091e8bae4f143ada59a';
const FRED_URL = 'https://api.stlouisfed.org/fred/series/observations';
const FRED_SERIES = 'MORTGAGE30US'; // 30-Year Fixed Rate Mortgage

const STATE_TAX_RATES = {
    AL: 0.41, AK: 1.19, AZ: 0.62, AR: 0.61, CA: 0.76, CO: 0.51, CT: 2.14,
    DE: 0.57, FL: 0.91, GA: 0.92, HI: 0.28, ID: 0.69, IL: 2.27, IN: 0.85,
    IA: 1.57, KS: 1.41, KY: 0.86, LA: 0.55, ME: 1.36, MD: 1.09, MA: 1.23,
    MI: 1.54, MN: 1.12, MS: 0.79, MO: 0.97, MT: 0.84, NE: 1.73, NV: 0.60,
    NH: 2.18, NJ: 2.49, NM: 0.80, NY: 1.72, NC: 0.84, ND: 0.98, OH: 1.56,
    OK: 0.90, OR: 0.97, PA: 1.58, RI: 1.63, SC: 0.57, SD: 1.31, TN: 0.71,
    TX: 1.80, UT: 0.58, VT: 1.90, VA: 0.82, WA: 0.94, WV: 0.58, WI: 1.85, WY: 0.61
};

const ZIP_TO_STATE = {
    "90001": "CA", "90210": "CA", "10001": "NY", "10002": "NY", "10003": "NY",
    "60601": "IL", "60602": "IL", "77001": "TX", "77002": "TX", "75001": "TX",
    "33101": "FL", "33102": "FL", "85001": "AZ", "85002": "AZ", "98101": "WA"
};

// ===== NEW: EXPANDED FAQs for SEO / Ranking (Preserved) =====
const FAQs = [
    {
        q: "What is a mortgage calculator and how does it work?",
        a: "A mortgage calculator is an AI-powered tool that estimates your monthly home loan payment. It uses the loan amount (home price minus down payment), interest rate, and loan term to calculate the principal and interest (P&I). It then adds estimated property taxes, homeowners insurance, and PMI (if applicable) to show your full PITI payment."
    },
    {
        q: "What is PITI in a mortgage payment?",
        a: "PITI stands for **Principal, Interest, Taxes, and Insurance**. These are the four main components of your monthly mortgage payment. Principal reduces your loan balance, Interest is the cost of borrowing, and Taxes & Insurance are typically held in an escrow account by your lender and paid on your behalf."
    },
    {
        q: "How much house can I afford in 2025?",
        a: "A common rule of thumb is the **28/36 rule**. Lenders prefer your total housing payment (PITI + HOA) to be at or below **28%** of your gross monthly income. Your total debt payments (including mortgage, car loans, credit cards) should be at or below **36%** of your gross monthly income. Use this AI calculator to find your PITI, then compare it to your income."
    },
    {
        q: "What is a good mortgage rate today?",
        a: "Mortgage rates change daily. This calculator provides the latest available 30-year fixed rate from the FRED API, which updates daily. A 'good' rate depends on your credit score, down payment, loan type, and the current market. Rates below the national average are generally considered very good. Contact our partners to see what rate you qualify for."
    },
    {
        q: "How does my down payment affect my mortgage?",
        a: "A larger down payment reduces your loan amount, which lowers your monthly P&I payment. If you pay **20% or more**, you also avoid **PMI (Private Mortgage Insurance)**, which further reduces your monthly cost. This calculator's AI insights will show you the exact impact of your down payment."
    },
    {
        q: "What is PMI (Private Mortgage Insurance)?",
        a: "PMI is insurance that protects the lender in case you default on your loan. It is typically required on conventional loans if your down payment is less than 20%. Our calculator automatically estimates PMI if your LTV (Loan-to-Value) ratio is above 80%."
    },
    {
        q: "Should I choose a 15-year or 30-year mortgage?",
        a: "A **30-year** mortgage offers a lower monthly payment, making it more affordable. A **15-year** mortgage has a higher monthly payment but typically a lower interest rate. You will pay off the loan in half the time and save a significant amount in total interest. Our AI insights will show you the exact interest savings."
    },
    {
        q: "What is an amortization schedule?",
        a: "An amortization schedule (or table) is a complete breakdown of every payment over the life of your loan. It shows how much of each payment goes toward principal and how much goes toward interest. Use the 'Amortization' tab to see your full schedule, either monthly or yearly."
    },
    {
        q: "How do extra payments help pay off a mortgage early?",
        a: "When you make an extra payment, 100% of that money goes directly to your **principal balance** (not interest). This reduces the loan balance, meaning you pay less interest on the next payment, and every payment after. This 'accelerates' your payoff and can save you thousands. See your 'Interest Saved' in the Loan Summary."
    },
    {
        q: "What are FHA, VA, and USDA loans?",
        a: "These are government-backed loans. **FHA loans** are popular with first-time buyers due to low down payment requirements (as low as 3.5%) but require mortgage insurance. **VA loans** are for eligible veterans and service members, often requiring no down payment and no PMI. **USDA loans** are for rural and suburban homebuyers and also offer 0% down options."
    },
    {
        q: "What are closing costs?",
        a: "Closing costs are fees paid at the end of the home-buying process. They typically range from 2% to 5% of the home's purchase price and include appraisal fees, title insurance, attorney fees, and more. This calculator focuses on your ongoing PITI payment; be sure to budget separately for closing costs."
    },
    {
        q: "What is the difference between a fixed-rate and adjustable-rate mortgage (ARM)?",
        a: "A **fixed-rate** mortgage has the same interest rate for the entire loan term (e.g., 30 years). Your P&I payment never changes. An **ARM** has a lower 'introductory' rate for a set period (e.g., 5 or 7 years), after which the rate adjusts based on the market. ARMs can be risky if rates rise."
    },
    {
        q: "How do I get pre-approved for a mortgage?",
        a: "To get pre-approved, you'll provide a lender with your financial information (income, assets, debts) and they will check your credit. If you qualify, they'll give you a pre-approval letter stating how much you can borrow. This shows sellers you are a serious buyer. You can start the process by 'Viewing Partners' on our site."
    },
    // --- IMPROVEMENT: 15+ new FAQs added below (Preserved) ---
    {
        q: "What is a PITI calculator?",
        a: "A PITI calculator is another name for a mortgage calculator that includes all four components of a typical payment: **P**rincipal, **I**nterest, **T**axes, and **I**nsurance. This tool is a PITI calculator, and it also includes HOA fees for a complete estimate."
    },
    {
        q: "How is mortgage interest calculated?",
        a: "Mortgage interest is typically calculated monthly based on your outstanding loan balance. At the beginning of your loan, most of your payment goes to interest. As you pay down the principal, the interest portion decreases. You can see this in the 'Amortization' tab."
    },
    {
        q: "What is a good down payment for a house in 2025?",
        a: "Putting down 20% of the home's purchase price is ideal as it allows you to avoid PMI. However, many programs, like FHA loans, allow for down payments as low as 3.5%. The 'best' down payment depends on your savings and financial goals."
    },
    {
        q: "Does this mortgage payment calculator include property taxes?",
        a: "Yes. You can enter your annual property tax, or use our 'Lookup' feature to estimate property taxes based on your ZIP code and home price. This is a critical part of your total PITI payment."
    },
    {
        q: "How does this home loan calculator handle HOA fees?",
        a: "This calculator includes a specific field for monthly **HOA (Homeowners Association) fees**. These fees are added to your total monthly payment, as they are a required housing expense, but they do not affect your loan balance."
    },
    {
        q: "Can I use this as a refinance calculator?",
        a: "Yes. To use this as a refinance calculator, enter your current loan balance as the 'Home Purchase Price' and '0' for the 'Down Payment'. Then, enter your new (or potential) interest rate and term to see your new estimated P&I payment."
    },
    {
        q: "What is the mortgage 'principal'?",
        a: "The principal is the amount of money you borrowed from the lender to buy your home (Loan Amount). Each month, a portion of your payment goes towards reducing this principal balance."
    },
    {
        q: "What is Loan-to-Value (LTV) ratio?",
        a: "LTV is the ratio of your loan amount to the home's appraised value. For example, if your home is worth $100,000 and you borrow $80,000, your LTV is 80%. Lenders use LTV to assess risk. An LTV over 80% typically requires PMI."
    },
    {
        q: "How can I pay off my mortgage early?",
        a: "You can pay off your mortgage early by making extra payments. This calculator allows you to add an 'Extra Monthly Payment' or an 'Extra One-Time Payment'. Both methods apply directly to your principal, saving you interest and shortening your loan term."
    },
    {
        q: "What is mortgage amortization?",
        a: "Amortization is the process of paying off a loan over time with regular, scheduled payments. An amortization schedule, like the one in this calculator, shows how each payment is split between principal and interest."
    },
    {
        q: "What is a conventional loan?",
        a: "A conventional loan is a mortgage not insured or guaranteed by the federal government (like FHA, VA, or USDA loans). They often require a higher credit score and a down payment of 3% to 20%."
    },
    {
        q: "What are 'points' on a mortgage?",
        a: "Mortgage points (or 'discount points') are fees you pay to the lender at closing in exchange for a lower interest rate. One point typically costs 1% of your loan amount and might lower your rate by 0.25%."
    },
    {
        q: "What is a jumbo loan?",
        a: "A jumbo loan is a mortgage that exceeds the 'conforming loan limits' set by the Federal Housing Finance Agency (FHFA). These limits vary by county. Jumbo loans are used for high-value properties and often have different underwriting requirements."
    },
    {
        q: "Does this calculator work for bi-weekly mortgage payments?",
        a: "This calculator is designed for monthly payments. However, you can simulate a bi-weekly payment's effect by taking your monthly P&I payment, dividing it by 12, and adding that amount to the 'Extra Monthly Payment' field. (A true bi-weekly plan results in 13 full payments per year)."
    },
    {
        q: "What is an escrow account?",
        a: "An escrow account is set up by your mortgage lender to pay for property taxes and homeowners insurance on your behalf. A portion of your total monthly payment (the 'T' and 'I' in PITI) is deposited into this account."
    },
    {
        q: "Is a fixed-rate or adjustable-rate mortgage (ARM) better?",
        a: "A **fixed-rate** mortgage is stable and predictable; your P&I payment never changes. An **ARM** offers a lower introductory rate but can increase (or decrease) after a set period. A fixed-rate is generally safer for long-term homeowners, while an ARM might be suitable if you plan to sell the home before the fixed period ends."
    }
];

// ===== CALCULATOR ENGINE (SOLID Principles) =====
class MortgageCalculator {
    constructor(inputs) {
        this.inputs = inputs;
        this.results = {};
        this.amortizationSchedule = [];
    }

    // --- IMPROVEMENT: Add a shadow calculation method for AI insights
    static calculatePayment(principal, rate, numPayments) {
        let payment = 0;
        if (principal > 0 && rate > 0) {
            payment = principal * (rate * Math.pow(1 + rate, numPayments)) / 
                      (Math.pow(1 + rate, numPayments) - 1);
        } else if (principal > 0 && numPayments > 0) {
            payment = principal / numPayments;
        }
        return payment;
    }

    calculate() {
        try {
            this.calculateMonthlyPayment();
            this.calculatePMI();
            this.generateAmortizationSchedule(); 
            this.calculateTotals(); 
            return this.results;
        } catch (error) {
            console.error('Calculation error:', error);
            return null;
        }
    }

    calculateMonthlyPayment() {
        const homePrice = parseFloat(this.inputs.homePrice) || 0;
        // Simplified down payment logic: The controller now provides the final amount.
        const downPaymentVal = parseFloat(this.inputs.downPayment) || 0;

        const principal = homePrice - downPaymentVal;
        const rate = (parseFloat(this.inputs.interestRate) || 0) / 100 / 12;
        const numPayments = this.getTotalPayments();

        // --- IMPROVEMENT: Use static method
        let payment = MortgageCalculator.calculatePayment(principal, rate, numPayments);

        const monthlyTax = (parseFloat(this.inputs.propertyTax) || 0) / 12;
        const monthlyInsurance = (parseFloat(this.inputs.homeInsurance) || 0) / 12;
        const hoaFees = parseFloat(this.inputs.hoaFees) || 0;

        this.results.loanAmount = principal;
        this.results.monthlyPI = payment;
        this.results.monthlyTax = monthlyTax;
        this.results.monthlyInsurance = monthlyInsurance;
        this.results.monthlyHOA = hoaFees;
        this.results.monthlyPayment = payment + monthlyTax + monthlyInsurance + hoaFees;
        this.results.downPaymentAmount = downPaymentVal;
        this.results.homePrice = homePrice;
    }

    calculatePMI() {
        // Handle $0 home price to avoid NaN
        const ltv = (this.results.homePrice > 0) ? (this.results.loanAmount / this.results.homePrice) * 100 : 0;
        this.results.ltv = ltv;

        if (ltv > 80 && this.results.loanAmount > 0) {
            // More accurate PMI: 0.22% to 2.25%. We use 0.5% as a moderate estimate.
            const pmiRate = 0.005; // 0.5% annual
            const monthlyPMI = (this.results.loanAmount * pmiRate) / 12;
            this.results.monthlyPMI = monthlyPMI;
            this.results.monthlyPayment += monthlyPMI;
            this.results.pmiRequired = true;
        } else {
            this.results.monthlyPMI = 0;
            this.results.pmiRequired = false;
        }
    }

    generateAmortizationSchedule(baseline = false) {
        const numPayments = this.getTotalPayments();
        const rate = (parseFloat(this.inputs.interestRate) || 0) / 100 / 12;
        let balance = this.results.loanAmount;
        
        const extraMonthly = baseline ? 0 : (parseFloat(this.inputs.extraMonthly) || 0);
        const extraOneTime = baseline ? 0 : (parseFloat(this.inputs.extraOneTime) || 0);
        
        const basePayment = this.results.monthlyPI;

        const schedule = [];
        let totalInterest = 0;
        let totalPrincipal = 0;
        let totalExtra = 0;

        for (let i = 1; i <= numPayments; i++) {
            if (balance <= 0.01) break; 

            const interestPayment = balance * rate;
            let principalPayment = basePayment - interestPayment;
            
            let extraPay = extraMonthly;

            // Apply one-time payment on month 1
            if (i === 1 && extraOneTime > 0) {
                 extraPay += extraOneTime;
            }

            let totalPrincipalPaid = principalPayment + extraPay;
            
            if ((balance - totalPrincipalPaid) < 0) {
                totalPrincipalPaid = balance;
                principalPayment = totalPrincipalPaid - extraPay;
                if (principalPayment < 0) {
                     extraPay = totalPrincipalPaid;
                     principalPayment = 0;
                }
            }
            
            if(balance < (basePayment + extraPay)) {
                // This is the final payment
                principalPayment = balance;
                extraPay = 0; // No extra payment on final month if it overpays
                totalPrincipalPaid = principalPayment;
                balance = 0;
            } else {
                balance -= totalPrincipalPaid;
            }

            totalInterest += interestPayment;
            totalPrincipal += principalPayment;
            totalExtra += extraPay;

            schedule.push({
                payment: i,
                principal: principalPayment,
                interest: interestPayment,
                extra: extraPay,
                balance: balance
            });

            if (balance <= 0.01) break;
        }

        if (!baseline) {
            this.amortizationSchedule = schedule;
            this.results.totalInterest = totalInterest;
            this.results.totalPrincipal = totalPrincipal;
            this.results.totalExtra = totalExtra;
            this.results.actualPayments = schedule.length;
        }
        
        return {
            totalInterest: totalInterest,
            actualPayments: schedule.length,
            totalPrincipal: totalPrincipal
            // Note: We don't return the full schedule here to save memory
        };
    }

    calculateTotals() {
        const actualTotalInterest = this.results.totalInterest;
        const actualPayments = this.results.actualPayments;

        const baselineResults = this.generateAmortizationSchedule(true);
        const baselineTotalInterest = baselineResults.totalInterest;
        const baselinePayments = baselineResults.actualPayments;
        
        this.results.interestSaved = baselineTotalInterest - actualTotalInterest;
        this.results.payoffAccel = baselinePayments - actualPayments; // in months
        // --- FIX 1: Save baselineTotalInterest for the AI engine to use ---
        this.results.baselineTotalInterest = baselineTotalInterest;

        const totalTax = (this.results.monthlyTax * actualPayments);
        const totalIns = (this.results.monthlyInsurance * actualPayments);
        const totalPMI = (this.results.monthlyPMI * actualPayments); // This is an estimate, as PMI would fall off.
        const totalHOA = (this.results.monthlyHOA * actualPayments);
        
        this.results.totalPayments = this.results.loanAmount + actualTotalInterest + totalTax + totalIns + totalPMI + totalHOA;
    
        // --- FIX 2: Add missing First Year Interest calculation ---
        // This uses `this.amortizationSchedule` which was set by `generateAmortizationSchedule()`
        let firstYearInterest = 0;
        let firstYearPrincipal = 0;
        const yearSlice = this.amortizationSchedule.slice(0, 12);
        yearSlice.forEach(row => {
            firstYearInterest += row.interest;
            firstYearPrincipal += row.principal + row.extra;
        });
        this.results.firstYearInterest = firstYearInterest;
        this.results.firstYearPrincipal = firstYearPrincipal;
    }

    getTotalPayments() {
        const customTerm = parseFloat(document.getElementById('customTerm').value);
        const loanTerm = customTerm > 0 ? customTerm : parseFloat(document.getElementById('loanTerm').value) || 30;
        return loanTerm * 12;
    }
}

// ===== NEW: EXPANDED AI INSIGHTS ENGINE =====
class AIInsightEngine {
    constructor(results, inputs) {
        this.results = results;
        this.inputs = inputs;
    }
    
    generateInsights() {
        const insights = [];
        // --- FIX 3: Destructure new baselineTotalInterest value ---
        const { monthlyPayment, pmiRequired, monthlyPMI, interestSaved, payoffAccel, ltv, loanAmount, homePrice, monthlyPI, monthlyTax, monthlyInsurance, firstYearInterest, firstYearPrincipal, baselineTotalInterest } = this.results;
        const { extraMonthly, extraOneTime, interestRate, hoaFees, loanTerm } = this.inputs;
        const fmtd = UIManager.formatCurrency; // Helper

        if (!monthlyPayment || monthlyPayment <= 0) {
             insights.push({
                title: "🤖 AI Advisor",
                text: `Enter your loan details to generate personalized insights and see your affordability.`,
                type: 'info'
            });
            return insights;
        }

        // Insight 1: Affordability (General)
        insights.push({
            title: "💰 Monthly Payment Affordability",
            text: `Your estimated PITI + HOA payment is ${fmtd(monthlyPayment, 2)}. As a guideline, lenders often want this to be under 28% of your gross monthly income.`,
            type: monthlyPayment > 3000 ? 'warning' : 'success'
        });

        // --- IMPROVEMENT: Insight 2 (PMI) - Now smarter (Preserved) ---
        if (pmiRequired) {
             let pmiText = `Your LTV is ${ltv.toFixed(1)}% (over 80%), so you'll pay an estimated ${fmtd(monthlyPMI, 2)}/mo for PMI.`;
             const neededFor20 = (homePrice * 0.2) - this.results.downPaymentAmount;
             if (ltv < 85 && neededFor20 > 0) { // If they are close
                pmiText += ` **AI Tip:** You only need ${fmtd(neededFor20, 0)} more on your down payment to reach 20% LTV and eliminate this PMI cost entirely.`;
             } else {
                pmiText += ` AI suggests increasing your down payment to 20% (${fmtd(homePrice * 0.2, 0)}) to eliminate this cost.`;
             }
             insights.push({ title: "🏠 PMI Required", text: pmiText, type: 'warning' });
        } else if (ltv <= 80 && ltv > 0) {
             insights.push({
                title: "✅ No PMI Required",
                text: `Great job! Your LTV is ${ltv.toFixed(1)}%, so you avoid paying for Private Mortgage Insurance (PMI). This saves you money every month.`,
                type: 'success'
            });
        }
        
        // --- NEW AI INSIGHT: LTV Rating ---
        if (ltv > 0) {
            let ltvText = `Your ${ltv.toFixed(1)}% LTV (Loan-to-Value) ratio is considered`;
            if (ltv <= 80) {
                ltvText += ` **Excellent**. This gives you access to the best rates and avoids PMI.`;
                insights.push({ title: "📊 LTV Rating: Excellent", text: ltvText, type: 'success' });
            } else if (ltv <= 90) {
                ltvText += ` **Good**. This is common for many buyers. You can request to remove PMI once your LTV drops to 80%.`;
                insights.push({ title: "📊 LTV Rating: Good", text: ltvText, type: 'info' });
            } else {
                ltvText += ` **High**. This may lead to higher interest rates and PMI. AI suggests increasing your down payment if possible.`;
                insights.push({ title: "📊 LTV Rating: High", text: ltvText, type: 'warning' });
            }
        }

        // Insight 3: Extra Payment Impact
        if (interestSaved > 0) {
            insights.push({
                title: "💵 Extra Payment Impact",
                text: `Your extra payments will save ${fmtd(interestSaved, 0)} in interest and you'll pay off your loan ${payoffAccel} months earlier. This is a powerful wealth-building strategy.`,
                type: 'success'
            });
        }
        
        // --- IMPROVEMENT: Insight 4 (Round Up Tip) (Preserved) ---
        if (extraMonthly <= 0 && extraOneTime <= 0 && monthlyPI > 0) {
            const roundedPayment = Math.ceil(monthlyPI / 50) * 50;
            const extra = roundedPayment - monthlyPI;
            if (extra > 5) { // Only show if it's a reasonable jump
                const shadowInputs = {...this.inputs, extraMonthly: extra};
                const shadowCalc = new MortgageCalculator(shadowInputs);
                const shadowResults = shadowCalc.calculate();
                if(shadowResults && shadowResults.interestSaved > 0) {
                    insights.push({
                        title: "💡 AI Payoff Tip: 'Round Up'",
                        text: `Consider "rounding up" your P&I payment from ${fmtd(monthlyPI, 2)} to ${fmtd(roundedPayment, 2)}. That extra ${fmtd(extra, 2)}/mo would save you ${fmtd(shadowResults.interestSaved, 0)} in interest and pay off your loan ${shadowResults.payoffAccel} months earlier!`,
                        type: 'info'
                    });
                }
            }
        }

        // --- NEW AI INSIGHT: First Year Interest (This will now work) ---
        if (firstYearInterest > 0 && firstYearPrincipal > 0) {
            const interestPercent = (firstYearInterest / (firstYearInterest + firstYearPrincipal)) * 100;
            insights.push({
                title: "💸 First-Year Interest",
                text: `In your first 12 months, you will pay ${fmtd(firstYearInterest, 2)} in interest and only ${fmtd(firstYearPrincipal, 2)} in principal. That means **${interestPercent.toFixed(0)}%** of your payments go to the bank, not your equity. This is normal, but extra payments can change this!`,
                type: 'info'
            });
        }


        // Insight 5: High Interest Rate
        if (interestRate >= 7.5) {
             insights.push({
                title: "📈 High Interest Rate",
                text: `Your interest rate of ${interestRate}% is high. This significantly increases your total interest paid. AI suggests checking your credit score and comparing quotes from our partners to find a more competitive rate.`,
                type: 'warning'
            });
        }
        
        // --- IMPROVEMENT: Insight 6 (Refinance Potential) (Preserved) ---
        if (interestRate >= 6.0) {
            const newRate = (Math.floor(interestRate - 1));
            const newRateMonthly = (parseFloat(interestRate) - 1) / 100 / 12;
            const numPayments = (parseFloat(loanTerm) || 30) * 12;
            const newPI = MortgageCalculator.calculatePayment(loanAmount, newRateMonthly, numPayments);
            const savings = monthlyPI - newPI;
            if (savings > 50) {
                 insights.push({
                    title: "🔮 AI Refinance Potential",
                    text: `If market rates drop in the future, keep an eye on refinancing. For example, if you could get a rate of ${newRate.toFixed(1)}%, you could potentially lower your P&I payment by ${fmtd(savings, 0)}/mo.`,
                    type: 'info'
                });
            }
        }

        // --- IMPROVEMENT: Insight 7 (15-year vs 30-year) (Preserved) ---
        const currentTerm = parseFloat(loanTerm) || 30;
        const rate = (parseFloat(interestRate) || 0) / 100 / 12;
        
        if (currentTerm === 30) {
            // Calculate 15-year
            const term15 = 15 * 12;
            const rate15 = (parseFloat(interestRate) - 0.5) / 100 / 12; // 15-yr is usually lower
            const payment15 = MortgageCalculator.calculatePayment(loanAmount, rate15, term15);
            // --- FIX 4: Use baselineTotalInterest for a true comparison ---
            const totalInterest30 = baselineTotalInterest; 
            const totalInterest15 = (payment15 * term15) - loanAmount;
            const interestSaved = totalInterest30 - totalInterest15;
            
             insights.push({
                title: "⚖️ 30-Year vs. 15-Year",
                text: `Your 30-year P&I is ${fmtd(monthlyPI, 2)}. A 15-year loan at a ~${(rate15*12*100).toFixed(2)}% rate would have a higher payment of ${fmtd(payment15, 2)}, but it would save you an incredible ${fmtd(interestSaved, 0)} in total interest.`,
                type: 'info'
            });
        } else if (currentTerm === 15) {
            // Calculate 30-year
            const term30 = 30 * 12;
            const rate30 = (parseFloat(interestRate) + 0.5) / 100 / 12; // 30-yr is usually higher
            const payment30 = MortgageCalculator.calculatePayment(loanAmount, rate30, term30);
            
             insights.push({
                title: "🚀 15-Year Loan",
                text: `You've selected a 15-year term. Your payment is ${fmtd(monthlyPI, 2)}, putting you on the fast track to building equity. A 30-year loan would be lower at ${fmtd(payment30, 2)}, but you're saving thousands in interest.`,
                type: 'success'
            });
        }
        
        // --- IMPROVEMENT: Insight 8 (Escrow Ratio) ---
        const escrow = monthlyTax + monthlyInsurance;
        // --- FIX 5: Add guard clause `monthlyPayment > 0` to prevent NaN/Infinity ---
        const escrowPercent = (monthlyPayment > 0) ? (escrow / monthlyPayment) * 100 : 0;
        if (escrowPercent > 33) {
             insights.push({
                title: "📊 High Escrow Costs",
                text: `Your monthly taxes and insurance (${fmtd(escrow, 2)}) make up ${escrowPercent.toFixed(0)}% of your total payment. While property taxes are fixed, remember to shop around for homeowners insurance annually to save money.`,
                type: 'info'
            });
        }
        
        // Insight 9: HOA Fee
        if (hoaFees > 0) {
             insights.push({
                title: "🏢 HOA Fee",
                text: `Your ${fmtd(parseFloat(hoaFees), 2)}/mo HOA fee adds to your total housing cost. Remember this payment does not build equity and can increase over time. Factor this in when comparing properties.`,
                type: 'info'
            });
        }

        return insights;
    }
}

// ===== ZIP CODE MANAGER (Preserved) =====
class ZipCodeManager {
    static getStateFromZip(zip) {
        const prefix = zip.substring(0, 3);
        const stateMap = { "900": "CA", "902": "CA", "100": "NY", "606": "IL", "770": "TX", "750": "TX", "331": "FL", "850": "AZ", "981": "WA" };
        for (const key in stateMap) {
            if (zip.startsWith(key)) return stateMap[key];
        }
        return ZIP_TO_STATE[zip] || null;
    }
    static getTaxRateByState(state) {
        return STATE_TAX_RATES[state] || 0.85; // Default national average
    }
    static estimateTaxAndInsurance(homePrice, zip) {
        const state = this.getStateFromZip(zip);
        if (!state) return null;
        const taxRate = this.getTaxRateByState(state);
        const annualTax = (homePrice * taxRate) / 100;
        const annualInsurance = homePrice * 0.0035; // ~0.35% of home value
        return { annualTax, annualInsurance, state };
    }
}

// ===== NEW: IMPROVED FRED API MANAGER =====
class FREDManager {
    static async getRate() {
        try {
            // Use local storage to cache the rate daily
            const cache = localStorage.getItem('fredRateCache');
            const now = new Date();
            
            if (cache) {
                const { date, rate, lastFetch } = JSON.parse(cache);
                const lastFetchDate = new Date(lastFetch);
                if (lastFetchDate.toDateString() === now.toDateString()) {
                    console.log('Using cached FRED rate');
                    return { rate, date }; // Use cache if fetched today
                }
            }
            
            console.log('Fetching new FRED rate');
            const url = `${FRED_URL}?series_id=${FRED_SERIES}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`FRED API request failed: ${response.status}`);
            const data = await response.json();
            
            if (data.observations && data.observations.length > 0) {
                const rate = parseFloat(data.observations[0].value);
                const date = data.observations[0].date;
                if(isNaN(rate)) return { rate: 6.50, date: null }; // Fallback
                
                // Save to cache
                const newCache = { rate, date, lastFetch: now.toISOString() };
                localStorage.setItem('fredRateCache', JSON.stringify(newCache));
                
                return { rate, date };
            }
        } catch (error) { 
            console.error('FRED API error:', error); 
        }
        return { rate: 6.50, date: null }; // Fallback rate
    }
}

// ===== UI MANAGER (WCAG 2.1 AA Compliant) =====
class UIManager {
    static formatCurrency(value, decimals = 0) {
        if (typeof value !== 'number' || isNaN(value)) value = 0;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    }
    static formatPercent(value) { return (value).toFixed(1) + '%'; } // Use 1 decimal for LTV

    static updateResults(results) {
         document.getElementById('monthly-payment').textContent = this.formatCurrency(results.monthlyPayment, 2);
         const breakdownStr = `P&I: ${this.formatCurrency(results.monthlyPI, 2)} | Tax: ${this.formatCurrency(results.monthlyTax, 2)} | Ins: ${this.formatCurrency(results.monthlyInsurance, 2)} | PMI: ${this.formatCurrency(results.monthlyPMI, 2)} | HOA: ${this.formatCurrency(results.monthlyHOA, 2)}`;
         document.getElementById('payment-breakdown').textContent = breakdownStr;
         document.getElementById('loanAmount').textContent = this.formatCurrency(results.loanAmount);
         document.getElementById('totalInterest').textContent = this.formatCurrency(results.totalInterest);
         document.getElementById('totalPayments').textContent = this.formatCurrency(results.totalPayments);
         document.getElementById('ltv').textContent = this.formatPercent(results.ltv);
         document.getElementById('monthlyPI').textContent = this.formatCurrency(results.monthlyPI, 2);
         document.getElementById('monthlyHOA').textContent = this.formatCurrency(results.monthlyHOA, 2);
         document.getElementById('pmiStatus').textContent = results.pmiRequired ? 'Required' : 'Not Required';
         document.getElementById('interestSaved').textContent = this.formatCurrency(results.interestSaved);
         document.getElementById('payoffAccel').textContent = `${results.payoffAccel} months`;
         
         // IMPROVED: Show/Hide result cards based on value
         document.getElementById('pmiStatusBox').className = results.pmiRequired ? 'result-box accent' : 'result-box';
         document.getElementById('interestSavedBox').style.display = results.interestSaved > 0 ? 'block' : 'none';
         document.getElementById('payoffAccelBox').style.display = results.payoffAccel > 0 ? 'block' : 'none';
    }

    static updateAmortizationTable(schedule, view = 'monthly') {
        const thead = document.getElementById('amortizationThead');
        const tbody = document.getElementById('amortizationTable');
        tbody.innerHTML = '';
        thead.innerHTML = '';

        if (!schedule || schedule.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding: 12px; text-align: center; color: var(--text-light);">No schedule to display.</td></tr>';
            return;
        }

        if (view === 'monthly') {
            thead.innerHTML = `
                <tr>
                    <th>Month</th>
                    <th>Total Payment</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Extra Payment</th>
                    <th>Balance</th>
                </tr>
            `;
            // Show first 120 payments (10 years) + last payment
            const rowsToShow = schedule.length > 120 ? 120 : schedule.length;
            for (let i = 0; i < rowsToShow; i++) {
                tbody.appendChild(this.createAmortRow(schedule[i]));
            }
            if (schedule.length > 120) {
                 tbody.innerHTML += `<tr><td colspan="6" style="text-align: center; padding: 10px; background: var(--bg-secondary); font-weight: bold;">...</td></tr>`;
                 tbody.appendChild(this.createAmortRow(schedule[schedule.length - 1]));
            }
        } else { // Yearly view
            thead.innerHTML = `
                <tr>
                    <th>Year</th>
                    <th>Total Paid</th>
                    <th>Principal Paid</th>
                    <th>Interest Paid</th>
                    <th>Extra Paid</th>
                    <th>Ending Balance</th>
                </tr>
            `;
            let yearlyData = [];
            for (let y = 0; y < schedule.length / 12; y++) {
                const yearSlice = schedule.slice(y * 12, (y + 1) * 12);
                if (yearSlice.length === 0) continue;

                const yearSummary = yearSlice.reduce((acc, row) => {
                    acc.principal += row.principal;
                    acc.interest += row.interest;
                    acc.extra += row.extra;
                    return acc;
                }, { payment: y + 1, principal: 0, interest: 0, extra: 0, balance: yearSlice[yearSlice.length - 1].balance });
                
                tbody.appendChild(this.createAmortRow(yearSummary, 'yearly'));
            }
        }
    }
    
    static createAmortRow(row, view = 'monthly') {
        const tr = document.createElement('tr');
        const totalPayment = row.principal + row.interest + row.extra;
        if (view === 'monthly') {
            tr.innerHTML = `
                <td>${row.payment}</td>
                <td>${this.formatCurrency(totalPayment, 2)}</td>
                <td>${this.formatCurrency(row.principal, 2)}</td>
                <td>${this.formatCurrency(row.interest, 2)}</td>
                <td>${this.formatCurrency(row.extra, 2)}</td>
                <td>${this.formatCurrency(row.balance, 2)}</td>
            `;
        } else { // Yearly
             tr.innerHTML = `
                <td>${row.payment}</td>
                <td>${this.formatCurrency(totalPayment, 2)}</td>
                <td>${this.formatCurrency(row.principal, 2)}</td>
                <td>${this.formatCurrency(row.interest, 2)}</td>
                <td>${this.formatCurrency(row.extra, 2)}</td>
                <td>${this.formatCurrency(row.balance, 2)}</td>
            `;
        }
        return tr;
    }

    static updateInsights(insights) {
        const container = document.getElementById('insightsContainer');
        container.innerHTML = '';
        if(!insights || insights.length === 0) {
             container.innerHTML = '<div class="insight-box"><strong>🤖 AI Advisor:</strong> Enter valid loan details to generate personalized insights...</div>';
             return;
        }
        insights.forEach(insight => {
            const box = document.createElement('div');
            box.className = `insight-box ${insight.type}`;
            box.innerHTML = `<strong>${insight.title}:</strong> ${insight.text}`;
            container.appendChild(box);
        });
    }
}

// ===== CHART MANAGER =====
class ChartManager {
    static charts = {};

    // --- IMPROVEMENT: Register the datalabels plugin
    static registerPlugins() {
        if (Chart.registerables) { // Check if using Chart.js v3+
            // Register datalabels plugin if it's loaded
            if (typeof ChartDataLabels !== 'undefined') {
                Chart.register(ChartDataLabels);
            }
        }
    }

    // NEW: Doughnut chart for 'Analysis' tab
    // --- VERIFIED: This function correctly shows value + % in tooltips
    // and % on the chart itself, fulfilling the user's request.
    static renderPaymentBreakdownChart(results) {
        const ctx = document.getElementById('paymentBreakdownChart').getContext('2d');
        if (!ctx) return;
        if (this.charts.paymentBreakdown) this.charts.paymentBreakdown.destroy();
        
        const data = [
            results.monthlyPI,
            results.monthlyTax,
            results.monthlyInsurance,
            results.monthlyPMI,
            results.monthlyHOA
        ];
        const total = data.reduce((a, b) => a + b, 0);
        const allZero = total === 0;

        this.charts.paymentBreakdown = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['P&I', 'Tax', 'Insurance', 'PMI', 'HOA'],
                datasets: [{
                    data: allZero ? [1] : data, 
                    backgroundColor: allZero ? ['#E2E8F0'] : ['#24ACB9', '#FFC107', '#10B981', '#EF4444', '#3B82F6'], // Brand colors
                    borderColor: 'var(--card)',
                    borderWidth: 3, // Thicker border
                    hoverOffset: 10 // Pops out on hover
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'bottom', 
                        labels: { 
                            color: 'var(--text-light)', 
                            font: { size: 13 } // Clearer labels
                        } 
                    },
                    // --- IMPROVEMENT: Show percentage on chart
                    datalabels: {
                        display: (context) => {
                            const value = context.dataset.data[context.dataIndex];
                            return !allZero && (value / total) > 0.05; // Only show for slices > 5%
                        },
                        color: '#fff',
                        font: { weight: 'bold', size: 12 },
                        formatter: (value) => {
                            return ((value / total) * 100).toFixed(0) + '%';
                        }
                    },
                    // --- IMPROVEMENT: Show value and percentage in tooltip
                    tooltip: {
                         callbacks: {
                            label: function(context) {
                                if(allZero) return ' No data';
                                let label = context.label || '';
                                let value = context.raw;
                                let percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${UIManager.formatCurrency(value, 2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // NEW: 'Mortgage Over Time' chart for 'Charts' tab (matches chart.jpg)
    static renderMortgageOverTimeChart(schedule) {
        const ctx = document.getElementById('mortgageOverTimeChart').getContext('2d');
        if (!ctx) return;
        if (this.charts.mortgageOverTime) this.charts.mortgageOverTime.destroy();
        if(!schedule || schedule.length === 0) return;

        const years = Math.ceil(schedule.length / 12);
        const yearlyLabels = [];
        const yearlyData = []; // Store full data for summary
        
        for (let y = 0; y < years; y++) {
            const yearSlice = schedule.slice(y * 12, (y + 1) * 12);
            if(yearSlice.length === 0) continue;
            
            const yearInterest = yearSlice.reduce((acc, row) => acc + row.interest, 0);
            const yearPrincipal = yearSlice.reduce((acc, row) => acc + row.principal + row.extra, 0);
            const yearBalance = yearSlice[yearSlice.length - 1].balance;

            yearlyLabels.push(`Year ${y + 1}`);
            yearlyData.push({
                label: `Year ${y + 1}`,
                interest: yearInterest,
                principal: yearPrincipal,
                balance: yearBalance
            });
        }
        
        // Pass data to app controller for summary
        app.lastYearlyData = yearlyData;

        this.charts.mortgageOverTime = new Chart(ctx, {
            type: 'line',
            data: {
                labels: yearlyLabels,
                datasets: [
                    {
                        label: 'Yearly Interest Paid',
                        data: yearlyData.map(d => d.interest),
                        backgroundColor: 'rgba(36, 172, 185, 0.2)', // Brand Primary (Teal)
                        borderColor: 'rgba(36, 172, 185, 1)',
                        fill: 'start',
                        type: 'bar', // Use bar for area-like fill
                        order: 2
                    },
                    {
                        label: 'Yearly Principal Paid',
                        data: yearlyData.map(d => d.principal),
                        backgroundColor: 'rgba(25, 52, 59, 0.2)', // Brand Dark
                        borderColor: 'rgba(25, 52, 59, 1)',
                        fill: 'start',
                        type: 'bar', // Use bar for area-like fill
                        order: 3
                    },
                     {
                        label: 'Loan Balance',
                        data: yearlyData.map(d => d.balance),
                        borderColor: 'rgba(230, 149, 0, 1)', // Accent Dark
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        borderDash: [5, 5],
                        pointBackgroundColor: 'rgba(230, 149, 0, 1)',
                        fill: false,
                        type: 'line',
                        order: 1,
                        yAxisID: 'y1' // Assign to secondary axis
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { 
                        stacked: true, 
                        ticks: { color: 'var(--text-light)' }, 
                        grid: { display: false } 
                    },
                    y: { // Primary axis (P&I)
                        stacked: true, 
                        beginAtZero: true, 
                        ticks: { color: 'var(--text-light)', callback: (val) => `$${val/1000}k` }, 
                        grid: { color: 'var(--border)' },
                        position: 'left',
                        title: { display: true, text: 'Yearly P&I Paid ($)', color: 'var(--text-light)' }
                    },
                    y1: { // Secondary axis (Balance)
                        beginAtZero: false,
                        position: 'right',
                        ticks: { color: 'var(--text-light)', callback: (val) => `$${val/1000}k` },
                        grid: { display: false }, // Hide grid for this axis
                        title: { display: true, text: 'Remaining Loan Balance ($)', color: 'var(--text-light)' }
                    }
                },
                plugins: {
                    legend: { position: 'top', labels: { color: 'var(--text-light)' } },
                     tooltip: {
                         mode: 'index',
                         intersect: false,
                         callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                let value = context.raw;
                                return `${label}: ${UIManager.formatCurrency(value, 0)}`;
                            }
                        }
                    }
                }
            }
        });
        
        // NEW: Update slider and summary
        const slider = document.getElementById('year-slider');
        slider.max = yearlyLabels.length || 1;
        slider.value = 1;
        app.updateChartSummary(1);
    }
}

// ===== MAIN APP (Controller) =====
const app = {
    calculateDebounce: null,
    lastResults: null,
    lastSchedule: null,
    lastYearlyData: [], // NEW: Store yearly data for summary
    state: {
        amortizationView: 'monthly' // 'monthly' or 'yearly'
    },

    async init() {
        this.setupEventListeners();
        this.setupDarkMode();
        this.setupPWA();
        this.setupVoiceControls();
        this.setupFAQ();
        this.initTooltips(); // Initialize tooltips
        ChartManager.registerPlugins(); // --- IMPROVEMENT: Register chart plugins
        await this.loadInitialRate(); // --- IMPROVEMENT: This now runs automatically
        this.calculate(); // Run initial calculation
    },

    setupEventListeners() {
        // Standard inputs
        ['homePrice', 'interestRate', 'loanTerm', 'customTerm', 
         'propertyTax', 'homeInsurance', 'hoaFees', 'extraMonthly', 'extraOneTime', 
         'extraPaymentDate'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.debouncedCalculate());
                el.addEventListener('change', () => this.debouncedCalculate());
            }
        });
        
        // --- NEW: Synced Down Payment Listeners ---
        document.getElementById('downPaymentAmount').addEventListener('input', (e) => this.syncDownPayment('amount', e.target.value));
        document.getElementById('downPaymentPercent').addEventListener('input', (e) => this.syncDownPayment('percent', e.target.value));
        document.getElementById('homePrice').addEventListener('input', () => this.syncDownPayment('amount', document.getElementById('downPaymentAmount').value));


        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.getAttribute('data-tab');
                this.activateTab(tab);
            });
        });
        
        // --- NEW: Amortization Controls ---
        document.getElementById('amortToggle').addEventListener('click', () => this.toggleAmortizationView());
        document.getElementById('exportCsv').addEventListener('click', () => this.exportAmortizationToCsv());
        
        // --- NEW: Chart Summary Slider ---
        document.getElementById('year-slider').addEventListener('input', (e) => this.updateChartSummary(e.target.value));
    },

    activateTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(tab).classList.add('active');

        // Re-render charts on tab click to ensure correct sizing
        if (tab === 'analysis' && this.lastResults) {
            setTimeout(() => ChartManager.renderPaymentBreakdownChart(this.lastResults), 50);
        }
        if (tab === 'charts' && this.lastSchedule) {
            setTimeout(() => ChartManager.renderMortgageOverTimeChart(this.lastSchedule), 50);
        }
    },
    
    // --- NEW: Down Payment Sync Logic ---
    syncDownPayment(source, value) {
        const price = parseFloat(document.getElementById('homePrice').value) || 0;
        const amountEl = document.getElementById('downPaymentAmount');
        const percentEl = document.getElementById('downPaymentPercent');

        if (price > 0) {
            if (source === 'amount') {
                const amount = parseFloat(value) || 0;
                percentEl.value = ((amount / price) * 100).toFixed(2);
            } else { // source === 'percent'
                const percent = parseFloat(value) || 0;
                amountEl.value = (price * (percent / 100)).toFixed(0);
            }
        }
        this.debouncedCalculate();
    },

    debouncedCalculate() {
        clearTimeout(this.calculateDebounce);
        this.calculateDebounce = setTimeout(() => this.calculate(), 250);
    },

    async calculate() {
        const inputs = {
            homePrice: document.getElementById('homePrice').value,
            // Use the synced amount field as the single source of truth
            downPayment: document.getElementById('downPaymentAmount').value, 
            interestRate: document.getElementById('interestRate').value,
            loanTerm: document.getElementById('loanTerm').value,
            customTerm: document.getElementById('customTerm').value, // Need this for AI
            propertyTax: document.getElementById('propertyTax').value,
            homeInsurance: document.getElementById('homeInsurance').value,
            hoaFees: document.getElementById('hoaFees').value,
            extraMonthly: document.getElementById('extraMonthly').value,
            extraOneTime: document.getElementById('extraOneTime').value,
            extraPaymentDate: document.getElementById('extraPaymentDate').value
        };

        const calculator = new MortgageCalculator(inputs);
        const results = calculator.calculate();

        if (results) {
            this.lastResults = results;
            this.lastSchedule = calculator.amortizationSchedule;

            UIManager.updateResults(results);
            // Update amortization table with current view
            UIManager.updateAmortizationTable(this.lastSchedule, this.state.amortizationView);

            const aiEngine = new AIInsightEngine(results, inputs);
            const insights = aiEngine.generateInsights();
            UIManager.updateInsights(insights);

            // Update charts
            this.activateTab(document.querySelector('.tab-btn.active').getAttribute('data-tab'));
        }
    },
    
    // --- NEW: Chart Summary Update Logic ---
    updateChartSummary(year) {
        const yearIndex = parseInt(year) - 1;
        if (!this.lastYearlyData || !this.lastYearlyData[yearIndex]) return;

        const data = this.lastYearlyData[yearIndex];

        document.getElementById('slider-year-label').textContent = year;
        document.getElementById('summary-principal-paid').textContent = UIManager.formatCurrency(data.principal, 2);
        document.getElementById('summary-interest-paid').textContent = UIManager.formatCurrency(data.interest, 2);
        document.getElementById('summary-remaining-balance').textContent = UIManager.formatCurrency(data.balance, 2);
    },

    // --- NEW: Tooltip Logic ---
    initTooltips() {
        let tooltipBox = null;
        document.querySelectorAll('.tooltip').forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                const text = e.currentTarget.getAttribute('data-tooltip');
                if (!text) return;
                
                tooltipBox = document.createElement('div');
                tooltipBox.className = 'tooltip-box';
                tooltipBox.textContent = text;
                document.body.appendChild(tooltipBox);

                const rect = e.currentTarget.getBoundingClientRect();
                
                // Position above the icon
                let top = rect.top - tooltipBox.offsetHeight - 5;
                let left = rect.left + rect.width / 2 - tooltipBox.offsetWidth / 2;

                // Adjust if off-screen
                if (top < 0) { top = rect.bottom + 5; }
                if (left < 0) { left = 5; }
                if (left + tooltipBox.offsetWidth > window.innerWidth) {
                    left = window.innerWidth - tooltipBox.offsetWidth - 5;
                }

                tooltipBox.style.left = `${left}px`;
                tooltipBox.style.top = `${top}px`;
                tooltipBox.style.display = 'block';
                setTimeout(() => { tooltipBox.style.opacity = '1'; }, 10);
            });
            el.addEventListener('mouseleave', () => {
                if (tooltipBox) {
                    tooltipBox.style.opacity = '0';
                    setTimeout(() => {
                        if (tooltipBox) {
                            tooltipBox.remove();
                            tooltipBox = null;
                        }
                    }, 200);
                }
            });
        });
    },

    // --- NEW: Amortization View Toggle ---
    toggleAmortizationView() {
        const btn = document.getElementById('amortToggle');
        if (this.state.amortizationView === 'monthly') {
            this.state.amortizationView = 'yearly';
            btn.textContent = 'Show Monthly';
        } else {
            this.state.amortizationView = 'monthly';
            btn.textContent = 'Show Yearly';
        }
        UIManager.updateAmortizationTable(this.lastSchedule, this.state.amortizationView);
    },

    // --- NEW: CSV Export Logic ---
    exportAmortizationToCsv() {
        if (!this.lastSchedule || this.lastSchedule.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        let rows = [];
        const view = this.state.amortizationView;

        if (view === 'monthly') {
            rows.push(["Month", "Total Payment", "Principal", "Interest", "Extra Payment", "Balance"]);
            this.lastSchedule.forEach(row => {
                rows.push([
                    row.payment,
                    (row.principal + row.interest + row.extra).toFixed(2),
                    row.principal.toFixed(2),
                    row.interest.toFixed(2),
                    row.extra.toFixed(2),
                    row.balance.toFixed(2)
                ]);
            });
        } else { // Yearly
            rows.push(["Year", "Total Paid", "Principal Paid", "Interest Paid", "Extra Paid", "Ending Balance"]);
            for (let y = 0; y < this.lastSchedule.length / 12; y++) {
                const yearSlice = this.lastSchedule.slice(y * 12, (y + 1) * 12);
                if (yearSlice.length === 0) continue;
                
                const yearSummary = yearSlice.reduce((acc, row) => {
                    acc.principal += row.principal;
                    acc.interest += row.interest;
                    acc.extra += row.extra;
                    return acc;
                }, { principal: 0, interest: 0, extra: 0 });
                
                const totalPaid = yearSummary.principal + yearSummary.interest + yearSummary.extra;
                rows.push([
                    y + 1,
                    totalPaid.toFixed(2),
                    yearSummary.principal.toFixed(2),
                    yearSummary.interest.toFixed(2),
                    yearSummary.extra.toFixed(2),
                    yearSlice[yearSlice.length - 1].balance.toFixed(2)
                ]);
            }
        }
        
        rows.forEach(rowArray => {
            let row = rowArray.join(",");
            csvContent += row + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `amortization_schedule_${view}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // --- IMPROVED: FRED Rate Function (Now automated) ---
    async loadInitialRate() {
        const updatedEl = document.getElementById('fred-last-updated');
        const rateEl = document.getElementById('interestRate');

        try {
            const { rate, date } = await FREDManager.getRate();
            
            if (rate && rateEl.value === "6.50") { // Only overwrite default
                 rateEl.value = rate.toFixed(2);
            }
            
            // --- IMPROVEMENT: Update last updated text as requested
            if (date) {
                updatedEl.textContent = `Live Rate as of: ${date} (Updates daily at 4:45 PM ET)`;
                updatedEl.style.color = "var(--text-light)";
            } else {
                updatedEl.textContent = 'Using fallback rate';
                updatedEl.style.color = "var(--accent-dark)";
            }
        } catch (error) {
            console.error("Error loading initial rate:", error);
            updatedEl.textContent = 'Error loading rate. Using fallback.';
            updatedEl.style.color = "var(--error)";
        }
        
        // We must re-calculate after the rate is loaded
        this.debouncedCalculate();
    },

    lookupZipCode() {
        const zip = document.getElementById('zipCode').value;
        const homePrice = parseFloat(document.getElementById('homePrice').value) || 0;
        if (zip.length === 5 && homePrice > 0) {
            const estimate = ZipCodeManager.estimateTaxAndInsurance(homePrice, zip);
            if (estimate) {
                document.getElementById('propertyTax').value = Math.round(estimate.annualTax);
                document.getElementById('homeInsurance').value = Math.round(estimate.annualInsurance);
                alert(`✅ Tax & insurance estimated for ${estimate.state}\n\nAnnual Tax: $${estimate.annualTax.toFixed(0)}\nAnnual Insurance: $${estimate.annualInsurance.toFixed(0)}`);
                this.debouncedCalculate();
            } else {
                alert('❌ ZIP code not found in our database. Please enter manually.');
            }
        } else if (homePrice <= 0) {
            alert('Please enter a Home Purchase Price first.');
        } else {
            alert('Please enter a valid 5-digit ZIP code.');
        }
    },

    setupDarkMode() {
        const toggle = document.getElementById('darkModeToggle');
        const scheme = localStorage.getItem('colorScheme') || 'light';
        document.documentElement.setAttribute('data-color-scheme', scheme);
        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-color-scheme');
            const next = current === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-color-scheme', next);
            localStorage.setItem('colorScheme', next);
            // Re-render charts for dark mode
            this.activateTab(document.querySelector('.tab-btn.active').getAttribute('data-tab'));
        });
    },

    setupPWA() {
        const pwaBtn = document.getElementById('pwa-install-btn');
        if (pwaBtn) {
            pwaBtn.addEventListener('click', async () => {
                if (window.deferredPrompt) {
                    window.deferredPrompt.prompt();
                    const { outcome } = await window.deferredPrompt.userChoice;
                    if (outcome === 'accepted') console.log('User accepted the PWA install prompt');
                    window.deferredPrompt = null;
                }
            });
        }
    },

    setupVoiceControls() {
        const voiceBtn = document.getElementById('voiceToggle');
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.onstart = () => { voiceBtn.style.backgroundColor = 'var(--error)'; voiceBtn.textContent = '..'; };
            recognition.onend = () => { voiceBtn.style.backgroundColor = ''; voiceBtn.textContent = '🎤'; };
            recognition.onerror = (event) => { console.error('Voice recognition error', event.error); voiceBtn.style.backgroundColor = ''; voiceBtn.textContent = '🎤'; };
            recognition.onresult = (event) => {
                const command = event.results[0][0].transcript.toLowerCase();
                if (command.includes('calculate')) this.calculate();
                else if (command.includes('read results')) this.speakResults();
                else if (command.includes('read insights')) this.speakInsights();
            };
            voiceBtn.addEventListener('click', () => { try { recognition.start(); } catch(e) { console.error("Voice recognition error", e); } });
        } else {
            voiceBtn.addEventListener('click', () => alert('Voice control is not supported in your browser.'));
        }
        
        const ttsBtn = document.getElementById('ttsToggle');
        ttsBtn.addEventListener('click', () => this.speakResults());
    },

    speakResults() {
        if ('speechSynthesis' in window && this.lastResults) {
            const text = `Your estimated monthly payment is ${UIManager.formatCurrency(this.lastResults.monthlyPayment, 2)}.`;
            const utterance = new SpeechSynthesisUtterance(text);
            speechSynthesis.speak(utterance);
        }
    },
    
    speakInsights() {
         if ('speechSynthesis' in window) {
            const insightsContainer = document.getElementById('insightsContainer');
            const firstInsight = insightsContainer.querySelector('.insight-box');
            if(firstInsight) {
                const text = firstInsight.textContent;
                const utterance = new SpeechSynthesisUtterance(text);
                speechSynthesis.speak(utterance);
            }
        }
    },

    setupFAQ() {
        const container = document.getElementById('faqContainer');
        if(!container) return;
        FAQs.forEach(faq => {
            const item = document.createElement('div');
            item.className = 'faq-item';
            item.innerHTML = `
                <div class="faq-question" role="button" aria-expanded="false">
                    <span>${faq.q}</span>
                    <span class="faq-icon">▼</span>
                </div>
                <div class.faq-answer" role="region" style="display: none;">${faq.a}</div>
            `;
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            question.addEventListener('click', () => {
                const isActive = question.classList.contains('active');
                // Close all others
                document.querySelectorAll('.faq-question').forEach(q => q.classList.remove('active'));
                document.querySelectorAll('.faq-answer').forEach(a => { a.style.display = 'none'; });
                document.querySelectorAll('.faq-icon').forEach(i => { i.style.transform = 'rotate(0deg)'; });

                if (!isActive) {
                    question.classList.add('active');
                    answer.style.display = 'block';
                    question.querySelector('.faq-icon').style.transform = 'rotate(180deg)';
                }
            });
            container.appendChild(item);
        });
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => app.init());

// ===== ERROR HANDLING =====
window.addEventListener('error', (event) => {
    console.error('Global error:', event.message, event.filename, event.lineno);
});
window.addEventListener('unhandledrejection', (event) => {
     console.error('Unhandled promise rejection:', event.reason);
});
