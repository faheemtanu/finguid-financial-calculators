// ===== EXTENDED FUNCTIONALITY AND AI INSIGHTS =====
// USA Financial Calculators - AI and Email Services
// Continuation of calculators.js

// ===== AI INSIGHTS CLASS =====
class AIInsights {
    constructor() {
        this.insightTemplates = this.initializeInsightTemplates();
    }

    initializeInsightTemplates() {
        return {
            mortgage: {
                highDownPayment: "💡 Excellent! With a {downPaymentPercent}% down payment, you avoid PMI and reduce your monthly payment by approximately ${pmiSavings}/month.",
                lowDownPayment: "⚠️ Consider saving for a larger down payment. Reaching 20% would eliminate ${monthlyPMI}/month in PMI payments.",
                highInterestRate: "📈 Your {interestRate}% rate is above current averages. Consider shopping around or improving your credit score for better rates.",
                goodInterestRate: "✅ Your {interestRate}% rate is competitive with current market conditions.",
                longTerm: "🏠 A 30-year mortgage offers lower monthly payments but costs ${extraInterest} more in total interest than a 15-year loan.",
                refinanceOpportunity: "🔄 If rates drop below {refinanceThreshold}%, consider refinancing to reduce your monthly payment.",
                affordabilityRatio: "The 28% rule suggests your housing payment shouldn't exceed ${recommendedMax}/month. Your payment of ${monthlyPayment} is {ratio}.",
                taxBenefits: "💰 You may deduct approximately ${annualDeduction} in mortgage interest on your taxes (consult a tax professional)."
            },
            auto: {
                longTerm: "⏰ While a {loanTerm}-month loan has lower payments, you'll pay ${extraInterest} more in interest than a shorter term.",
                highRate: "📊 Your {interestRate}% rate seems high for auto loans. Consider credit unions or getting pre-approved elsewhere.",
                goodRate: "✅ Your {interestRate}% rate is competitive for current auto loan market.",
                tradeInValue: "🚗 Your ${tradeInValue} trade-in reduces your loan amount significantly. Consider if selling privately might get you more.",
                depreciationWarning: "📉 New cars depreciate quickly. You might owe more than the car's worth initially (underwater loan).",
                gapInsurance: "🛡️ Consider gap insurance to cover the difference between loan amount and car value if totaled.",
                totalCost: "💲 Total cost including interest will be ${totalCost} - that's ${percentOverPrice}% more than the vehicle price."
            },
            investment: {
                compoundingPower: "✨ The power of compound interest! Your ${monthlyContribution}/month grows to ${futureValue} over {years} years.",
                startEarly: "⏰ Starting 5 years earlier could add approximately ${earlyStartBonus} to your final balance.",
                consistentContributions: "📈 Consistent monthly investments take advantage of dollar-cost averaging, reducing market timing risk.",
                inflationImpact: "💰 After inflation, your ${futureValue} has purchasing power of ${realValue} in today's dollars.",
                taxConsiderations: "📋 Consider tax-advantaged accounts (401k, IRA, Roth) to minimize the ${taxesOwed} in taxes on gains.",
                emergencyFirst: "🚨 Ensure you have 3-6 months of expenses in emergency savings before investing significantly.",
                diversification: "🎯 Diversify across asset classes to reduce risk while maintaining growth potential.",
                riskTolerance: "⚖️ With a {years}-year timeline, you can typically handle more market volatility for higher potential returns."
            },
            creditCard: {
                minimumTrap: "⚠️ Paying only minimums means ${minimumYears} years to payoff and ${minimumInterest} in total interest!",
                payoffStrategy: "🎯 Paying ${extraPayment} extra per month saves ${interestSavings} and {timeSavings} months.",
                highAPR: "📈 Your {apr}% APR is high. Consider a balance transfer to a lower rate card or personal loan.",
                avalancheMethod: "❄️ Pay minimums on all cards, put extra toward highest rate card first (debt avalanche method).",
                snowballMethod: "⛄ Alternative: Pay smallest balances first (debt snowball) for psychological wins.",
                stopCharging: "🛑 Most important: Stop using the card for new purchases until it's paid off.",
                creditScore: "📊 Paying down this balance will improve your credit utilization ratio and credit score.",
                emotionalCost: "💭 Beyond financial cost, carrying debt creates stress. Prioritize eliminating high-interest debt."
            },
            retirement: {
                employerMatch: "🎁 You're getting ${matchAmount}/year in free employer matching - that's a 100% return!",
                startEarly: "⏰ Time is your biggest advantage. Starting at {currentAge} vs {laterAge} means ${timeAdvantage} more at retirement.",
                increaseContributions: "📈 Increase contributions by 1% annually or with each raise - you'll barely notice but it adds up.",
                catchUpContributions: "🚀 At 50+, you can contribute an extra ${catchUpAmount} annually in catch-up contributions.",
                ruleOf72: "🧮 At {returnRate}% return, your money doubles every {doublingYears} years due to compound growth.",
                replacementRatio: "🎯 Your projected {replacementRatio}% income replacement {ratioMessage} the recommended 70-90%.",
                socialSecurity: "🏛️ Don't forget Social Security benefits - they'll provide additional retirement income.",
                healthcareCosts: "🏥 Plan for healthcare costs - Medicare doesn't cover everything and costs rise with age.",
                inflationProtection: "💰 Consider investments that protect against inflation during your long retirement years."
            },
            refinance: {
                breakEven: "⚖️ You'll break even on closing costs in {breakEvenMonths} months. If staying longer, refinancing makes sense.",
                rateDifference: "📊 The {rateDifference}% rate reduction saves ${monthlySavings}/month and ${totalSavings} over the life of the loan.",
                closingCosts: "💰 ${closingCosts} in closing costs affects your savings calculation - shop around for better deals.",
                shorterTerm: "⏰ Consider a shorter term to pay off your mortgage faster and save even more on interest.",
                cashOut: "🏠 Cash-out refinancing can access equity but increases your loan balance and payment.",
                creditScore: "📈 Improve your credit score before applying to qualify for the best rates.",
                marketTiming: "📈 Rates change daily. Consider locking in your rate once you find a good deal.",
                appraisal: "🏡 Your home's current value affects refinancing options - home appreciation helps your loan-to-value ratio."
            }
        };
    }

    async generateInsights(calculatorType, formData, results) {
        const insights = [];
        const templates = this.insightTemplates[calculatorType.replace('-calculator', '')];
        
        if (!templates) return insights;

        try {
            switch (calculatorType) {
                case 'mortgage-calculator':
                    insights.push(...this.generateMortgageInsights(formData, results, templates));
                    break;
                case 'auto-loan-calculator':
                    insights.push(...this.generateAutoLoanInsights(formData, results, templates));
                    break;
                case 'investment-calculator':
                    insights.push(...this.generateInvestmentInsights(formData, results, templates));
                    break;
                case 'credit-card-calculator':
                    insights.push(...this.generateCreditCardInsights(formData, results, templates));
                    break;
                case 'retirement-calculator':
                    insights.push(...this.generateRetirementInsights(formData, results, templates));
                    break;
                case 'refinance-calculator':
                    insights.push(...this.generateRefinanceInsights(formData, results, templates));
                    break;
            }
        } catch (error) {
            console.error('Error generating insights:', error);
        }

        return insights.slice(0, 4); // Limit to 4 insights
    }

    generateMortgageInsights(formData, results, templates) {
        const insights = [];
        const downPaymentPercent = results.downPaymentPercent;
        const interestRate = parseFloat(formData.interestRate);
        const monthlyPMI = results.monthlyPayment.pmi;

        // Down payment insights
        if (downPaymentPercent >= 20) {
            const pmiSavings = Math.round(results.loanAmount * 0.006 / 12);
            insights.push({
                type: 'success',
                text: this.formatTemplate(templates.highDownPayment, {
                    downPaymentPercent: downPaymentPercent.toFixed(1),
                    pmiSavings: pmiSavings
                })
            });
        } else {
            insights.push({
                type: 'warning',
                text: this.formatTemplate(templates.lowDownPayment, {
                    monthlyPMI: Math.round(monthlyPMI)
                })
            });
        }

        // Interest rate insights
        if (interestRate > 7.5) {
            insights.push({
                type: 'warning',
                text: this.formatTemplate(templates.highInterestRate, {
                    interestRate: interestRate.toFixed(2)
                })
            });
        } else if (interestRate <= 6.5) {
            insights.push({
                type: 'success',
                text: this.formatTemplate(templates.goodInterestRate, {
                    interestRate: interestRate.toFixed(2)
                })
            });
        }

        // Loan term insights
        if (parseInt(formData.loanTerm) === 30) {
            const monthlyPI = results.monthlyPayment.principalInterest;
            const loanAmount = results.loanAmount;
            const monthlyRate = interestRate / 100 / 12;
            const monthlyPayment15 = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, 180)) / (Math.pow(1 + monthlyRate, 180) - 1);
            const totalInterest15 = (monthlyPayment15 * 180) - loanAmount;
            const extraInterest = results.loanSummary.totalInterest - totalInterest15;
            
            insights.push({
                type: 'info',
                text: this.formatTemplate(templates.longTerm, {
                    extraInterest: Math.round(extraInterest)
                })
            });
        }

        // Affordability ratio
        const monthlyIncome = this.estimateMonthlyIncome(results.loanAmount + results.downPayment);
        if (monthlyIncome > 0) {
            const recommendedMax = monthlyIncome * 0.28;
            const ratio = results.monthlyPayment.total <= recommendedMax ? "within recommended limits" : "above recommended 28%";
            
            insights.push({
                type: ratio.includes('above') ? 'warning' : 'success',
                text: this.formatTemplate(templates.affordabilityRatio, {
                    recommendedMax: Math.round(recommendedMax),
                    monthlyPayment: Math.round(results.monthlyPayment.total),
                    ratio: ratio
                })
            });
        }

        return insights;
    }

    generateAutoLoanInsights(formData, results, templates) {
        const insights = [];
        const loanTerm = parseInt(formData.loanTerm);
        const interestRate = parseFloat(formData.interestRate);

        // Loan term insights
        if (loanTerm > 60) {
            const shorterTermPayment = this.calculateAutoPayment(results.loanAmount, interestRate, 60);
            const extraInterest = results.totalInterest - ((shorterTermPayment * 60) - results.loanAmount);
            
            insights.push({
                type: 'warning',
                text: this.formatTemplate(templates.longTerm, {
                    loanTerm: loanTerm,
                    extraInterest: Math.round(extraInterest)
                })
            });
        }

        // Interest rate insights
        if (interestRate > 8) {
            insights.push({
                type: 'warning',
                text: this.formatTemplate(templates.highRate, {
                    interestRate: interestRate.toFixed(2)
                })
            });
        } else if (interestRate <= 5) {
            insights.push({
                type: 'success',
                text: this.formatTemplate(templates.goodRate, {
                    interestRate: interestRate.toFixed(2)
                })
            });
        }

        // Trade-in insights
        if (results.tradeInValue > 0) {
            insights.push({
                type: 'info',
                text: this.formatTemplate(templates.tradeInValue, {
                    tradeInValue: Math.round(results.tradeInValue)
                })
            });
        }

        // Total cost insight
        const percentOverPrice = ((results.totalOfPayments / results.vehiclePrice) - 1) * 100;
        insights.push({
            type: 'info',
            text: this.formatTemplate(templates.totalCost, {
                totalCost: Math.round(results.totalOfPayments),
                percentOverPrice: percentOverPrice.toFixed(1)
            })
        });

        return insights;
    }

    generateInvestmentInsights(formData, results, templates) {
        const insights = [];
        const years = parseFloat(formData.investmentPeriod);
        const monthlyContribution = parseFloat(formData.monthlyContribution) || 0;

        // Compound interest insight
        insights.push({
            type: 'success',
            text: this.formatTemplate(templates.compoundingPower, {
                monthlyContribution: Math.round(monthlyContribution),
                futureValue: Math.round(results.futureValue),
                years: years
            })
        });

        // Early start advantage
        if (years >= 20) {
            const earlyStartBonus = this.calculateEarlyStartAdvantage(
                results.initialAmount, 
                monthlyContribution, 
                parseFloat(formData.annualReturn) / 100, 
                years
            );
            
            insights.push({
                type: 'info',
                text: this.formatTemplate(templates.startEarly, {
                    earlyStartBonus: Math.round(earlyStartBonus)
                })
            });
        }

        // Inflation impact
        insights.push({
            type: 'warning',
            text: this.formatTemplate(templates.inflationImpact, {
                futureValue: Math.round(results.futureValue),
                realValue: Math.round(results.realValue)
            })
        });

        // Tax considerations
        if (results.taxesOwed > 1000) {
            insights.push({
                type: 'info',
                text: this.formatTemplate(templates.taxConsiderations, {
                    taxesOwed: Math.round(results.taxesOwed)
                })
            });
        }

        return insights;
    }

    generateCreditCardInsights(formData, results, templates) {
        const insights = [];
        const apr = parseFloat(formData.interestRate);
        const balance = parseFloat(formData.balance);

        // Minimum payment trap
        if (formData.paymentStrategy === 'minimum') {
            insights.push({
                type: 'warning',
                text: this.formatTemplate(templates.minimumTrap, {
                    minimumYears: Math.round(results.monthsToPayoff / 12),
                    minimumInterest: Math.round(results.totalInterest)
                })
            });
        }

        // High APR warning
        if (apr > 20) {
            insights.push({
                type: 'warning',
                text: this.formatTemplate(templates.highAPR, {
                    apr: apr.toFixed(1)
                })
            });
        }

        // Payment strategy insight
        if (results.comparison && results.comparison.interestSavings > 0) {
            const extraPayment = results.monthlyPayment - (balance * 0.025);
            insights.push({
                type: 'success',
                text: this.formatTemplate(templates.payoffStrategy, {
                    extraPayment: Math.round(extraPayment),
                    interestSavings: Math.round(results.comparison.interestSavings),
                    timeSavings: results.comparison.timeSavings
                })
            });
        }

        // Stop charging insight
        insights.push({
            type: 'warning',
            text: templates.stopCharging
        });

        return insights;
    }

    generateRetirementInsights(formData, results, templates) {
        const insights = [];
        const currentAge = parseInt(formData.currentAge);
        const employerMatch = parseFloat(formData.employerMatch) || 0;

        // Employer match insight
        if (employerMatch > 0) {
            insights.push({
                type: 'success',
                text: this.formatTemplate(templates.employerMatch, {
                    matchAmount: Math.round(results.totalEmployerMatch)
                })
            });
        }

        // Starting early advantage
        if (currentAge < 35) {
            const laterAge = currentAge + 10;
            const timeAdvantage = this.calculateRetirementTimeAdvantage(
                results.currentBalance,
                results.totalContributions / results.yearsToRetirement,
                parseFloat(formData.expectedReturn) / 100,
                results.yearsToRetirement,
                results.yearsToRetirement - 10
            );

            insights.push({
                type: 'success',
                text: this.formatTemplate(templates.startEarly, {
                    currentAge: currentAge,
                    laterAge: laterAge,
                    timeAdvantage: Math.round(timeAdvantage)
                })
            });
        }

        // Replacement ratio insight
        const ratioMessage = results.replacementRatio >= 70 
            ? "meets or exceeds" 
            : results.replacementRatio >= 50 
                ? "is below" 
                : "is significantly below";

        insights.push({
            type: results.replacementRatio >= 70 ? 'success' : 'warning',
            text: this.formatTemplate(templates.replacementRatio, {
                replacementRatio: results.replacementRatio.toFixed(1),
                ratioMessage: ratioMessage
            })
        });

        // Rule of 72 insight
        const returnRate = parseFloat(formData.expectedReturn);
        const doublingYears = Math.round(72 / returnRate);
        insights.push({
            type: 'info',
            text: this.formatTemplate(templates.ruleOf72, {
                returnRate: returnRate.toFixed(1),
                doublingYears: doublingYears
            })
        });

        return insights;
    }

    generateRefinanceInsights(formData, results, templates) {
        const insights = [];
        const currentRate = parseFloat(formData.currentRate);
        const newRate = parseFloat(formData.newRate);
        const rateDifference = currentRate - newRate;

        // Break-even insight
        insights.push({
            type: results.savings.breakEvenMonths <= 24 ? 'success' : 'warning',
            text: this.formatTemplate(templates.breakEven, {
                breakEvenMonths: results.savings.breakEvenMonths
            })
        });

        // Rate difference insight
        if (rateDifference > 0) {
            insights.push({
                type: 'success',
                text: this.formatTemplate(templates.rateDifference, {
                    rateDifference: rateDifference.toFixed(2),
                    monthlySavings: Math.round(results.savings.monthlyPayment),
                    totalSavings: Math.round(results.savings.totalCost)
                })
            });
        }

        // Closing costs insight
        const closingCosts = parseFloat(formData.closingCosts) || 0;
        if (closingCosts > 5000) {
            insights.push({
                type: 'warning',
                text: this.formatTemplate(templates.closingCosts, {
                    closingCosts: Math.round(closingCosts)
                })
            });
        }

        // Recommendation insight
        if (results.recommendation) {
            insights.push({
                type: 'success',
                text: "✅ Based on your numbers, refinancing appears to be a good financial decision."
            });
        } else {
            insights.push({
                type: 'warning',
                text: "⚠️ Consider whether the savings justify the time and costs involved in refinancing."
            });
        }

        return insights;
    }

    // Helper functions for calculations
    calculateAutoPayment(principal, rate, months) {
        const monthlyRate = rate / 100 / 12;
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    }

    calculateEarlyStartAdvantage(initial, monthly, rate, years) {
        const futureValueCurrent = this.calculateFutureValue(initial, monthly, rate, years);
        const futureValueEarly = this.calculateFutureValue(initial, monthly, rate, years + 5);
        return futureValueEarly - futureValueCurrent;
    }

    calculateFutureValue(initial, monthly, rate, years) {
        const monthlyRate = rate / 12;
        const months = years * 12;
        return initial * Math.pow(1 + rate, years) + 
               monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    }

    calculateRetirementTimeAdvantage(currentBalance, annualContribution, rate, yearsLong, yearsShort) {
        const futureLong = currentBalance * Math.pow(1 + rate, yearsLong) + 
                          annualContribution * ((Math.pow(1 + rate, yearsLong) - 1) / rate);
        const futureShort = currentBalance * Math.pow(1 + rate, yearsShort) + 
                           annualContribution * ((Math.pow(1 + rate, yearsShort) - 1) / rate);
        return futureLong - futureShort;
    }

    estimateMonthlyIncome(homePrice) {
        // Rough estimate: home price should be 3-4x annual income
        const estimatedAnnualIncome = homePrice / 3.5;
        return estimatedAnnualIncome / 12;
    }

    formatTemplate(template, variables) {
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            if (variables.hasOwnProperty(key)) {
                if (typeof variables[key] === 'number') {
                    return variables[key].toLocaleString();
                }
                return variables[key];
            }
            return match;
        });
    }
}

// ===== EMAIL SERVICE CLASS =====
class EmailService {
    constructor() {
        this.apiEndpoint = 'https://api.finguid.com/send-email'; // Your backend endpoint
        this.fallbackEndpoint = 'https://formspree.io/f/your-form-id'; // Backup service
    }

    async sendCalculationResults(email, name, calculatorType, results, formData, message) {
        const emailData = {
            to: email,
            from: 'noreply@finguid.com',
            subject: `Your ${this.getCalculatorDisplayName(calculatorType)} Results`,
            html: this.generateEmailHTML(calculatorType, results, formData, name, message),
            attachments: [
                {
                    filename: `${calculatorType}-results.pdf`,
                    content: await this.generatePDFReport(calculatorType, results, formData)
                }
            ]
        };

        try {
            // Try primary service first
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData)
            });

            if (!response.ok) {
                throw new Error('Primary email service failed');
            }

            return { success: true, message: 'Email sent successfully!' };
        } catch (error) {
            console.error('Primary email service failed:', error);
            
            // Try fallback service
            try {
                const fallbackResponse = await fetch(this.fallbackEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        name: name,
                        calculator: calculatorType,
                        message: message,
                        results: JSON.stringify(results, null, 2)
                    })
                });

                if (!fallbackResponse.ok) {
                    throw new Error('Fallback email service failed');
                }

                return { success: true, message: 'Email sent successfully via backup service!' };
            } catch (fallbackError) {
                console.error('Fallback email service failed:', fallbackError);
                return { 
                    success: false, 
                    message: 'Failed to send email. Please try again later or contact support.' 
                };
            }
        }
    }

    generateEmailHTML(calculatorType, results, formData, name, message) {
        const calculatorName = this.getCalculatorDisplayName(calculatorType);
        const logoUrl = 'https://www.finguid.com/images/logo.png';
        
        let resultsHTML = '';
        
        switch (results.calculationType) {
            case 'mortgage':
                resultsHTML = this.generateMortgageEmailHTML(results);
                break;
            case 'auto':
                resultsHTML = this.generateAutoLoanEmailHTML(results);
                break;
            case 'investment':
                resultsHTML = this.generateInvestmentEmailHTML(results);
                break;
            case 'creditCard':
                resultsHTML = this.generateCreditCardEmailHTML(results);
                break;
            case 'retirement':
                resultsHTML = this.generateRetirementEmailHTML(results);
                break;
            case 'refinance':
                resultsHTML = this.generateRefinanceEmailHTML(results);
                break;
        }

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your ${calculatorName} Results</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
                .header { background: linear-gradient(135deg, #2196f3, #1976d2); color: white; padding: 30px 20px; text-align: center; }
                .logo { max-width: 150px; height: auto; margin-bottom: 15px; }
                .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
                .content { padding: 30px 20px; }
                .greeting { font-size: 18px; margin-bottom: 20px; color: #333; }
                .results-section { background: #f8f9fa; border-radius: 8px; padding: 25px; margin: 25px 0; }
                .result-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e9ecef; }
                .result-item:last-child { border-bottom: none; }
                .result-label { font-weight: 500; color: #495057; }
                .result-value { font-weight: 600; color: #2196f3; }
                .primary-result { background: linear-gradient(135deg, #2196f3, #1976d2); color: white; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                .primary-result .value { font-size: 36px; font-weight: bold; margin: 0; }
                .primary-result .label { font-size: 14px; margin: 5px 0 0 0; opacity: 0.9; }
                .message-section { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 20px 0; }
                .footer { background: #212529; color: white; padding: 30px 20px; text-align: center; }
                .footer p { margin: 0; opacity: 0.8; }
                .disclaimer { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 14px; color: #856404; }
                @media (max-width: 600px) {
                    .result-item { flex-direction: column; gap: 5px; }
                    .primary-result .value { font-size: 28px; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="${logoUrl}" alt="Finguid Logo" class="logo" />
                    <h1>Your ${calculatorName} Results</h1>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Hello ${name || 'there'}! 👋
                    </div>
                    
                    <p>Thank you for using Finguid's AI-enhanced financial calculators. Below are your personalized calculation results:</p>
                    
                    ${resultsHTML}
                    
                    ${message ? `
                    <div class="message-section">
                        <h3>Your Message:</h3>
                        <p>${message}</p>
                    </div>
                    ` : ''}
                    
                    <div class="disclaimer">
                        <strong>Important Disclaimer:</strong> These calculations are estimates for educational purposes only. 
                        Please consult with a qualified financial professional before making major financial decisions. 
                        Actual rates, terms, and costs may vary.
                    </div>
                    
                    <p>Need to recalculate or try other financial calculators? Visit us at <a href="https://www.finguid.com">www.finguid.com</a></p>
                </div>
                
                <div class="footer">
                    <p>© 2025 Finguid Financial Calculators | Built with ❤️ for Americans</p>
                    <p style="margin-top: 10px; font-size: 14px;">
                        <a href="https://www.finguid.com/privacy" style="color: #60a5fa;">Privacy Policy</a> | 
                        <a href="https://www.finguid.com/terms" style="color: #60a5fa;">Terms of Service</a> | 
                        <a href="https://www.finguid.com/contact" style="color: #60a5fa;">Contact Us</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    generateMortgageEmailHTML(results) {
        return `
        <div class="primary-result">
            <div class="value">$${this.formatNumber(results.monthlyPayment.total)}</div>
            <div class="label">Total Monthly Payment</div>
        </div>
        
        <div class="results-section">
            <h3>Payment Breakdown:</h3>
            <div class="result-item">
                <span class="result-label">Principal & Interest</span>
                <span class="result-value">$${this.formatNumber(results.monthlyPayment.principalInterest)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Property Taxes</span>
                <span class="result-value">$${this.formatNumber(results.monthlyPayment.propertyTax)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Home Insurance</span>
                <span class="result-value">$${this.formatNumber(results.monthlyPayment.insurance)}</span>
            </div>
            ${results.monthlyPayment.pmi > 0 ? `
            <div class="result-item">
                <span class="result-label">PMI</span>
                <span class="result-value">$${this.formatNumber(results.monthlyPayment.pmi)}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="results-section">
            <h3>Loan Summary:</h3>
            <div class="result-item">
                <span class="result-label">Loan Amount</span>
                <span class="result-value">$${this.formatNumber(results.loanAmount)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Down Payment (${results.downPaymentPercent}%)</span>
                <span class="result-value">$${this.formatNumber(results.downPayment)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Total Interest Paid</span>
                <span class="result-value">$${this.formatNumber(results.loanSummary.totalInterest)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Total Cost of Home</span>
                <span class="result-value">$${this.formatNumber(results.loanSummary.totalCost)}</span>
            </div>
        </div>
        `;
    }

    generateAutoLoanEmailHTML(results) {
        return `
        <div class="primary-result">
            <div class="value">$${this.formatNumber(results.monthlyPayment)}</div>
            <div class="label">Monthly Payment</div>
        </div>
        
        <div class="results-section">
            <h3>Loan Details:</h3>
            <div class="result-item">
                <span class="result-label">Vehicle Price</span>
                <span class="result-value">$${this.formatNumber(results.vehiclePrice)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Down Payment</span>
                <span class="result-value">$${this.formatNumber(results.downPayment)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Loan Amount</span>
                <span class="result-value">$${this.formatNumber(results.loanAmount)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Interest Rate</span>
                <span class="result-value">${results.interestRate.toFixed(2)}%</span>
            </div>
            <div class="result-item">
                <span class="result-label">Loan Term</span>
                <span class="result-value">${results.loanTermMonths} months</span>
            </div>
            <div class="result-item">
                <span class="result-label">Total Interest</span>
                <span class="result-value">$${this.formatNumber(results.totalInterest)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Total Cost</span>
                <span class="result-value">$${this.formatNumber(results.totalOfPayments)}</span>
            </div>
        </div>
        `;
    }

    generateInvestmentEmailHTML(results) {
        return `
        <div class="primary-result">
            <div class="value">$${this.formatNumber(results.futureValue)}</div>
            <div class="label">Future Value</div>
        </div>
        
        <div class="results-section">
            <h3>Investment Summary:</h3>
            <div class="result-item">
                <span class="result-label">Total Contributions</span>
                <span class="result-value">$${this.formatNumber(results.totalContributions)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Investment Gains</span>
                <span class="result-value">$${this.formatNumber(results.totalGains)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">After-Tax Value</span>
                <span class="result-value">$${this.formatNumber(results.afterTaxValue)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Real Value (Inflation-Adjusted)</span>
                <span class="result-value">$${this.formatNumber(results.realValue)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Effective Annual Return</span>
                <span class="result-value">${results.effectiveReturn.toFixed(2)}%</span>
            </div>
        </div>
        `;
    }

    generateCreditCardEmailHTML(results) {
        return `
        <div class="primary-result">
            <div class="value">$${this.formatNumber(results.monthlyPayment)}</div>
            <div class="label">${results.paymentType}</div>
        </div>
        
        <div class="results-section">
            <h3>Payoff Summary:</h3>
            <div class="result-item">
                <span class="result-label">Time to Pay Off</span>
                <span class="result-value">${typeof results.monthsToPayoff === 'number' ? `${results.monthsToPayoff} months` : results.monthsToPayoff}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Total Interest Paid</span>
                <span class="result-value">$${this.formatNumber(results.totalInterest)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Total Amount Paid</span>
                <span class="result-value">$${this.formatNumber(results.totalPaid)}</span>
            </div>
        </div>
        `;
    }

    generateRetirementEmailHTML(results) {
        return `
        <div class="primary-result">
            <div class="value">$${this.formatNumber(results.projectedBalance)}</div>
            <div class="label">Projected 401k Balance at Retirement</div>
        </div>
        
        <div class="results-section">
            <h3>Retirement Planning Summary:</h3>
            <div class="result-item">
                <span class="result-label">Your Contributions</span>
                <span class="result-value">$${this.formatNumber(results.totalContributions)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Employer Match</span>
                <span class="result-value">$${this.formatNumber(results.totalEmployerMatch)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Investment Growth</span>
                <span class="result-value">$${this.formatNumber(results.totalGrowth)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Monthly Retirement Income</span>
                <span class="result-value">$${this.formatNumber(results.sustainableMonthlyIncome)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Income Replacement Ratio</span>
                <span class="result-value">${results.replacementRatio.toFixed(1)}%</span>
            </div>
        </div>
        `;
    }

    generateRefinanceEmailHTML(results) {
        return `
        <div class="primary-result">
            <div class="value">$${this.formatNumber(Math.abs(results.savings.monthlyPayment))}</div>
            <div class="label">${results.savings.monthlyPayment > 0 ? 'Monthly Savings' : 'Monthly Increase'}</div>
        </div>
        
        <div class="results-section">
            <h3>Refinance Analysis:</h3>
            <div class="result-item">
                <span class="result-label">Total Cost Savings</span>
                <span class="result-value">$${this.formatNumber(results.savings.totalCost)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Break-even Time</span>
                <span class="result-value">${results.savings.breakEvenMonths} months</span>
            </div>
            <div class="result-item">
                <span class="result-label">Current Monthly Payment</span>
                <span class="result-value">$${this.formatNumber(results.currentLoan.monthlyPayment)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">New Monthly Payment</span>
                <span class="result-value">$${this.formatNumber(results.newLoan.monthlyPayment)}</span>
            </div>
        </div>
        `;
    }

    async generatePDFReport(calculatorType, results, formData) {
        // This would integrate with a PDF generation service like jsPDF or Puppeteer
        // For now, return null (the email will be sent without PDF attachment)
        return null;
    }

    getCalculatorDisplayName(calculatorType) {
        const names = {
            'mortgage-calculator': 'Mortgage Calculator',
            'auto-loan-calculator': 'Auto Loan Calculator',
            'investment-calculator': 'Investment Calculator',
            'credit-card-calculator': 'Credit Card Calculator',
            'retirement-calculator': '401k Retirement Calculator',
            'refinance-calculator': 'Refinance Calculator'
        };
        return names[calculatorType] || 'Financial Calculator';
    }

    formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) return '0';
        return Math.round(num).toLocaleString();
    }
}

// ===== CONTINUATION OF FINANCIAL CALCULATORS CLASS =====
// Adding the missing methods to the main FinancialCalculators class

// Continue the FinancialCalculators class from calculators.js
FinancialCalculators.prototype.displayAIInsights = function(calculatorId, insights) {
    const insightsContainer = document.getElementById(`${calculatorId}-insights`);
    if (!insightsContainer || insights.length === 0) return;

    const html = `
        <h5><i class="fas fa-robot"></i> AI Insights & Recommendations</h5>
        ${insights.map(insight => `
            <div class="insight-item">
                <div class="insight-icon">
                    <i class="fas fa-${this.getInsightIcon(insight.type)}"></i>
                </div>
                <div class="insight-content">
                    <p class="insight-text">${insight.text}</p>
                </div>
            </div>
        `).join('')}
    `;

    insightsContainer.innerHTML = html;
};

FinancialCalculators.prototype.getInsightIcon = function(type) {
    const icons = {
        'success': 'check-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle',
        'error': 'times-circle'
    };
    return icons[type] || 'lightbulb';
};

FinancialCalculators.prototype.showEmailButton = function(calculatorId) {
    const emailBtn = document.querySelector(`[data-calculator="${calculatorId}"].btn-email`);
    if (emailBtn) {
        emailBtn.classList.remove('hidden');
    }
};

FinancialCalculators.prototype.showEmailModal = function(calculatorId) {
    const modal = document.getElementById('emailModal');
    const form = document.getElementById('emailForm');
    
    if (!modal || !form) return;

    // Reset form
    form.reset();
    
    // Clear any previous status messages
    const statusDiv = document.getElementById('email-status');
    statusDiv.className = 'form-status';
    statusDiv.textContent = '';

    // Show modal
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    
    // Focus on first input
    const firstInput = form.querySelector('input[type="email"]');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }

    // Store calculator ID for form submission
    form.dataset.calculatorId = calculatorId;
};

FinancialCalculators.prototype.hideEmailModal = function() {
    const modal = document.getElementById('emailModal');
    if (modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    }
};

FinancialCalculators.prototype.handleEmailForm = async function(form) {
    const calculatorId = form.dataset.calculatorId;
    const email = form.email.value.trim();
    const name = form.name.value.trim();
    const message = form.message.value.trim();
    
    if (!this.currentCalculation || this.currentCalculation.calculatorId !== calculatorId) {
        this.showEmailStatus('error', 'No calculation results found. Please calculate first.');
        return;
    }

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    try {
        const result = await this.emailService.sendCalculationResults(
            email,
            name,
            calculatorId,
            this.currentCalculation.results,
            this.getFormData(calculatorId),
            message
        );

        if (result.success) {
            this.showEmailStatus('success', result.message);
            form.reset();
            
            // Auto-close modal after success
            setTimeout(() => {
                this.hideEmailModal();
            }, 2000);
        } else {
            this.showEmailStatus('error', result.message);
        }
    } catch (error) {
        console.error('Email sending error:', error);
        this.showEmailStatus('error', 'An unexpected error occurred. Please try again.');
    } finally {
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
};

FinancialCalculators.prototype.showEmailStatus = function(type, message) {
    const statusDiv = document.getElementById('email-status');
    if (!statusDiv) return;

    statusDiv.className = `form-status ${type}`;
    statusDiv.textContent = message;
};

FinancialCalculators.prototype.resetCalculator = function(calculatorId) {
    // Reset form
    const form = document.getElementById(`${calculatorId}-form`);
    if (form) {
        form.reset();
        
        // Clear validation states
        const inputs = form.querySelectorAll('.form-input, .form-select');
        inputs.forEach(input => {
            input.classList.remove('error', 'success');
        });
        
        // Clear error messages
        const errors = form.querySelectorAll('.form-error');
        errors.forEach(error => error.remove());
    }

    // Hide results
    const resultsContainer = document.getElementById(`${calculatorId}-results`);
    if (resultsContainer) {
        resultsContainer.classList.add('hidden');
    }

    // Hide email button
    const emailBtn = document.querySelector(`[data-calculator="${calculatorId}"].btn-email`);
    if (emailBtn) {
        emailBtn.classList.add('hidden');
    }

    // Clear saved calculation
    if (this.currentCalculation && this.currentCalculation.calculatorId === calculatorId) {
        this.currentCalculation = null;
    }

    // Update conditional fields visibility
    this.updateConditionalFields(form);
};

FinancialCalculators.prototype.handleConditionalFields = function(radioInput) {
    const form = radioInput.closest('form');
    if (!form) return;

    this.updateConditionalFields(form);
};

FinancialCalculators.prototype.updateConditionalFields = function(form) {
    if (!form) return;

    const conditionalGroups = form.querySelectorAll('.form-group.conditional');
    
    conditionalGroups.forEach(group => {
        const condition = group.dataset.condition;
        if (!condition) return;

        const [fieldName, expectedValue] = condition.split(':');
        const radioInput = form.querySelector(`input[name="${fieldName}"]:checked`);
        const isVisible = radioInput && radioInput.value === expectedValue;

        if (isVisible) {
            group.style.display = '';
            // Make required if it was originally required
            const input = group.querySelector('.form-input, .form-select');
            if (input && input.dataset.originalRequired) {
                input.required = true;
            }
        } else {
            group.style.display = 'none';
            // Remove validation and clear value
            const input = group.querySelector('.form-input, .form-select');
            if (input) {
                if (input.required) {
                    input.dataset.originalRequired = 'true';
                    input.required = false;
                }
                input.value = '';
                input.classList.remove('error', 'success');
            }
        }
    });
};

FinancialCalculators.prototype.updateStateDependentFields = function(stateInput) {
    const form = stateInput.closest('form');
    const state = stateInput.value;
    
    if (!form || !state) return;

    // Update property tax field if empty
    const propertyTaxInput = form.querySelector('#propertyTax');
    if (propertyTaxInput && !propertyTaxInput.value) {
        const homePrice = parseFloat(form.querySelector('#homePrice')?.value) || 0;
        if (homePrice > 0) {
            const taxRate = this.stateData.propertyTaxRates[state] || 0.01;
            const annualTax = homePrice * taxRate;
            propertyTaxInput.placeholder = Math.round(annualTax).toLocaleString();
        }
    }

    // Update home insurance field if empty
    const insuranceInput = form.querySelector('#homeInsurance');
    if (insuranceInput && !insuranceInput.value) {
        const avgInsurance = this.stateData.avgInsuranceRates.homeowners[state] || 1200;
        insuranceInput.placeholder = Math.round(avgInsurance).toLocaleString();
    }

    // Update sales tax for auto loans
    const salesTaxInput = form.querySelector('#salesTax');
    if (salesTaxInput && !salesTaxInput.value) {
        const salesTaxRate = this.stateData.salesTaxRates[state] || 0.06;
        salesTaxInput.placeholder = (salesTaxRate * 100).toFixed(2);
    }
};

FinancialCalculators.prototype.validateField = function(field) {
    const form = field.closest('form');
    if (!form) return;

    // Clear existing error state
    field.classList.remove('error', 'success');
    
    // Remove existing error message
    const existingError = form.querySelector(`#${field.id}-error`);
    if (existingError) {
        existingError.remove();
    }

    let isValid = true;
    let errorMessage = '';

    // Required field validation
    if (field.required && (!field.value || field.value.trim() === '')) {
        isValid = false;
        errorMessage = 'This field is required';
    }
    
    // Type-specific validation
    if (field.value && field.type === 'number') {
        const value = parseFloat(field.value);
        if (isNaN(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid number';
        } else if (value < 0) {
            isValid = false;
            errorMessage = 'Value cannot be negative';
        } else if (field.max && value > parseFloat(field.max)) {
            isValid = false;
            errorMessage = `Value cannot exceed ${field.max}`;
        } else if (field.min && value < parseFloat(field.min)) {
            isValid = false;
            errorMessage = `Value must be at least ${field.min}`;
        }
    }

    if (field.type === 'email' && field.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    }

    // Show validation state
    if (isValid) {
        field.classList.add('success');
    } else {
        field.classList.add('error');
        this.showFieldError(field, errorMessage);
    }

    return isValid;
};

FinancialCalculators.prototype.showFieldError = function(field, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.id = `${field.id}-error`;
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    field.parentNode.appendChild(errorDiv);
};

FinancialCalculators.prototype.showValidationErrors = function(calculatorId, errors) {
    const form = document.getElementById(`${calculatorId}-form`);
    if (!form) return;

    // Show error message
    this.showError(calculatorId, errors.join(', '));

    // Highlight first invalid field
    const firstErrorField = form.querySelector('.form-input.error, .form-select.error');
    if (firstErrorField) {
        firstErrorField.focus();
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
};

FinancialCalculators.prototype.showError = function(calculatorId, message) {
    const resultsContainer = document.getElementById(`${calculatorId}-results`);
    if (!resultsContainer) return;

    const errorHTML = `
        <div class="error-message" role="alert">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
                <strong>Error:</strong> ${message}
            </div>
        </div>
    `;

    resultsContainer.innerHTML = errorHTML;
    resultsContainer.classList.remove('hidden');
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

FinancialCalculators.prototype.setLoadingState = function(button, loading) {
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
        const icon = button.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-spinner fa-spin';
        }
    } else {
        button.classList.remove('loading');
        button.disabled = false;
        const icon = button.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-calculator';
        }
    }
};

FinancialCalculators.prototype.formatNumber = function(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return Math.round(num).toLocaleString();
};

FinancialCalculators.prototype.saveCalculation = function(calculatorId, formData, results) {
    try {
        const calculation = {
            id: calculatorId,
            timestamp: new Date().toISOString(),
            formData: formData,
            results: results
        };

        // Save to localStorage for offline access
        const history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
        history.unshift(calculation);
        
        // Keep only last 10 calculations
        history.splice(10);
        
        localStorage.setItem('calculationHistory', JSON.stringify(history));
        localStorage.setItem('lastCalculation', JSON.stringify(calculation));
    } catch (error) {
        console.error('Error saving calculation:', error);
    }
};

FinancialCalculators.prototype.loadSavedData = function() {
    try {
        // Load the most recent calculation
        const lastCalculation = localStorage.getItem('lastCalculation');
        if (lastCalculation) {
            this.currentCalculation = JSON.parse(lastCalculation);
        }
    } catch (error) {
        console.error('Error loading saved data:', error);
    }
};

FinancialCalculators.prototype.trackCalculation = function(calculatorId, results) {
    // Google Analytics tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', 'calculation_completed', {
            'event_category': 'Calculator',
            'event_label': calculatorId,
            'custom_map': { 'calculator_type': calculatorId }
        });
    }

    // Custom analytics tracking
    if (window.analytics && typeof window.analytics.track === 'function') {
        window.analytics.track('Calculator Used', {
            calculator: calculatorId,
            timestamp: new Date().toISOString()
        });
    }
};

FinancialCalculators.prototype.setupOfflineSupport = function() {
    // Check for offline functionality
    if ('serviceWorker' in navigator) {
        // Service worker registration is handled in index.html
    }

    // Handle online/offline status
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
};

FinancialCalculators.prototype.handleOnline = function() {
    const statusDiv = document.getElementById('connection-status');
    if (statusDiv) {
        statusDiv.className = 'connection-status online';
        statusDiv.textContent = '✅ Back online - all features available';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 3000);
    }
};

FinancialCalculators.prototype.handleOffline = function() {
    const statusDiv = document.getElementById('connection-status');
    if (statusDiv) {
        statusDiv.className = 'connection-status offline';
        statusDiv.textContent = '⚠️ You\'re offline - calculations still work, but email features are unavailable';
    }
};

FinancialCalculators.prototype.showTooltip = function(icon) {
    const tooltip = icon.getAttribute('data-tooltip');
    if (!tooltip) return;

    const tooltipDiv = document.createElement('div');
    tooltipDiv.className = 'tooltip-popup';
    tooltipDiv.textContent = tooltip;
    tooltipDiv.style.position = 'absolute';
    tooltipDiv.style.zIndex = '1000';
    tooltipDiv.style.background = '#333';
    tooltipDiv.style.color = 'white';
    tooltipDiv.style.padding = '8px 12px';
    tooltipDiv.style.borderRadius = '4px';
    tooltipDiv.style.fontSize = '12px';
    tooltipDiv.style.maxWidth = '200px';
    tooltipDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';

    document.body.appendChild(tooltipDiv);

    const rect = icon.getBoundingClientRect();
    tooltipDiv.style.left = (rect.left + window.scrollX - 100) + 'px';
    tooltipDiv.style.top = (rect.bottom + window.scrollY + 5) + 'px';

    icon._tooltip = tooltipDiv;
};

FinancialCalculators.prototype.hideTooltip = function(icon) {
    if (icon._tooltip) {
        document.body.removeChild(icon._tooltip);
        delete icon._tooltip;
    }
};

// ===== ADDITIONAL EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the calculator system
    const calculators = new FinancialCalculators();

    // Email modal event listeners
    const emailModal = document.getElementById('emailModal');
    const emailForm = document.getElementById('emailForm');
    const emailModalClose = document.getElementById('emailModalClose');
    const emailCancel = document.getElementById('emailCancel');

    if (emailForm) {
        emailForm.addEventListener('submit', function(e) {
            e.preventDefault();
            calculators.handleEmailForm(this);
        });
    }

    if (emailModalClose) {
        emailModalClose.addEventListener('click', function() {
            calculators.hideEmailModal();
        });
    }

    if (emailCancel) {
        emailCancel.addEventListener('click', function() {
            calculators.hideEmailModal();
        });
    }

    // Close modal when clicking outside
    if (emailModal) {
        emailModal.addEventListener('click', function(e) {
            if (e.target === emailModal) {
                calculators.hideEmailModal();
            }
        });
    }

    // Escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && emailModal && emailModal.classList.contains('show')) {
            calculators.hideEmailModal();
        }
    });

    // Newsletter form handling
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Handle newsletter subscription
            console.log('Newsletter subscription:', this.email.value);
        });
    }

    // Mobile navigation
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navMenu = document.getElementById('navMenu');

    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('active');
        });
    }

    // PWA install prompt
    let deferredPrompt;
    const installPrompt = document.getElementById('install-prompt');
    const installBtn = document.getElementById('install-btn');
    const installClose = document.getElementById('install-close');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        if (installPrompt) {
            installPrompt.classList.remove('hidden');
        }
    });

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const choiceResult = await deferredPrompt.userChoice;
                
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                
                deferredPrompt = null;
                installPrompt.classList.add('hidden');
            }
        });
    }

    if (installClose) {
        installClose.addEventListener('click', () => {
            installPrompt.classList.add('hidden');
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Live region announcer for screen readers
    window.announceToScreenReader = function(message) {
        const liveRegion = document.getElementById('live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    };
});