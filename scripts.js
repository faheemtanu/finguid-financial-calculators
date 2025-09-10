// USA Financial Calculators - JavaScript Functions
// Week 1 Implementation - Complete functionality

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatCurrencyDecimal(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatPercentage(rate) {
    return (rate * 100).toFixed(2) + '%';
}

function showResult(elementId) {
    const element = document.getElementById(elementId);
    element.classList.add('show');
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideResult(elementId) {
    const element = document.getElementById(elementId);
    element.classList.remove('show');
}

// Mortgage Calculator Function
function calculateMortgage() {
    // Get input values
    const loanAmount = parseFloat(document.getElementById('loanAmount').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value) / 100 / 12;
    const loanTermMonths = parseFloat(document.getElementById('loanTerm').value) * 12;
    const downPayment = parseFloat(document.getElementById('downPayment').value) || 0;
    const propertyTax = parseFloat(document.getElementById('propertyTax').value) || 0;
    const insurance = parseFloat(document.getElementById('insurance').value) || 0;

    // Validation
    if (!loanAmount || !document.getElementById('interestRate').value || !document.getElementById('loanTerm').value) {
        alert('Please fill in all required fields (Loan Amount, Interest Rate, and Loan Term)');
        return;
    }

    if (loanAmount <= 0 || interestRate < 0 || loanTermMonths <= 0) {
        alert('Please enter valid positive numbers');
        return;
    }

    // Calculate principal amount (loan amount minus down payment)
    const principalAmount = loanAmount - downPayment;

    if (principalAmount <= 0) {
        alert('Down payment cannot be greater than or equal to loan amount');
        return;
    }

    // Calculate monthly principal & interest payment
    let monthlyPI = 0;
    if (interestRate > 0) {
        monthlyPI = principalAmount * (interestRate * Math.pow(1 + interestRate, loanTermMonths)) / 
                   (Math.pow(1 + interestRate, loanTermMonths) - 1);
    } else {
        monthlyPI = principalAmount / loanTermMonths;
    }

    // Calculate monthly taxes and insurance
    const monthlyTax = propertyTax / 12;
    const monthlyInsurance = insurance / 12;

    // Calculate PMI (Private Mortgage Insurance)
    const downPaymentPercent = downPayment / loanAmount;
    let monthlyPMI = 0;
    if (downPaymentPercent < 0.20) {
        monthlyPMI = principalAmount * 0.005 / 12; // 0.5% annually
    }

    // Calculate total monthly payment
    const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI;

    // Calculate total interest paid
    const totalInterest = (monthlyPI * loanTermMonths) - principalAmount;

    // Calculate total cost of loan
    const totalCost = principalAmount + totalInterest + (propertyTax + insurance) * (loanTermMonths / 12);

    // Generate AI insights
    let aiTip = '';
    if (downPaymentPercent < 0.20) {
        const additionalDown = loanAmount * 0.20 - downPayment;
        aiTip = `💡 <strong>AI Tip:</strong> With ${formatPercentage(downPaymentPercent)} down, you're paying PMI of ${formatCurrencyDecimal(monthlyPMI)}/month. Consider saving an additional ${formatCurrency(additionalDown)} for 20% down to eliminate PMI and save ${formatCurrency(monthlyPMI * 12)}/year.`;
    } else if (totalInterest > principalAmount * 0.5) {
        const extraPayment = monthlyPI * 0.1;
        aiTip = `💡 <strong>AI Tip:</strong> You'll pay ${formatCurrency(totalInterest)} in interest. Consider paying an extra ${formatCurrency(extraPayment)}/month toward principal to save thousands in interest.`;
    } else {
        aiTip = `💡 <strong>AI Tip:</strong> Great! Your ${formatPercentage(downPaymentPercent)} down payment eliminates PMI. Consider investing any extra funds in the stock market for potentially higher returns.`;
    }

    // Display results
    document.getElementById('mortgageOutput').innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <div style="font-size: 32px; font-weight: bold; color: #1e40af; text-align: center; margin-bottom: 10px;">
                ${formatCurrency(totalMonthly)}
            </div>
            <div style="color: #6b7280; text-align: center; margin-bottom: 20px;">Total Monthly Payment</div>

            <div style="margin-top: 20px;">
                <div class="result-item">
                    <span>Principal & Interest</span>
                    <span><strong>${formatCurrencyDecimal(monthlyPI)}</strong></span>
                </div>
                <div class="result-item">
                    <span>Property Tax</span>
                    <span>${formatCurrencyDecimal(monthlyTax)}</span>
                </div>
                <div class="result-item">
                    <span>Insurance</span>
                    <span>${formatCurrencyDecimal(monthlyInsurance)}</span>
                </div>
                ${monthlyPMI > 0 ? `
                <div class="result-item">
                    <span>PMI</span>
                    <span>${formatCurrencyDecimal(monthlyPMI)}</span>
                </div>` : ''}
                <hr style="margin: 15px 0; border: 1px solid #e2e8f0;">
                <div class="result-item total">
                    <span>Total Monthly Payment</span>
                    <span><strong>${formatCurrency(totalMonthly)}</strong></span>
                </div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: #1e40af;">${formatCurrency(totalInterest)}</div>
                <div style="color: #6b7280; font-size: 14px;">Total Interest</div>
            </div>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: #1e40af;">${formatCurrency(totalCost)}</div>
                <div style="color: #6b7280; font-size: 14px;">Total Cost</div>
            </div>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: #1e40af;">${formatPercentage(downPaymentPercent)}</div>
                <div style="color: #6b7280; font-size: 14px;">Down Payment %</div>
            </div>
        </div>

        <div class="ai-tip">
            ${aiTip}
        </div>
    `;

    showResult('mortgageResult');

    // Track calculation for analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'calculator_use', {
            'event_category': 'Calculator',
            'event_label': 'Mortgage',
            'value': Math.round(totalMonthly)
        });
    }
}

// Auto Loan Calculator Function
function calculateAuto() {
    // Get input values
    const carPrice = parseFloat(document.getElementById('carPrice').value);
    const downPayment = parseFloat(document.getElementById('carDownPayment').value) || 0;
    const tradeValue = parseFloat(document.getElementById('tradeValue').value) || 0;
    const interestRate = parseFloat(document.getElementById('autoRate').value) / 100 / 12;
    const loanTermMonths = parseFloat(document.getElementById('autoTerm').value);

    // Validation
    if (!carPrice || !document.getElementById('autoRate').value || !loanTermMonths) {
        alert('Please fill in all required fields (Car Price, Interest Rate, and Loan Term)');
        return;
    }

    if (carPrice <= 0 || interestRate < 0 || loanTermMonths <= 0) {
        alert('Please enter valid positive numbers');
        return;
    }

    // Calculate loan amount
    const loanAmount = carPrice - downPayment - tradeValue;

    if (loanAmount <= 0) {
        alert('Down payment and trade-in value cannot exceed car price');
        return;
    }

    // Calculate monthly payment
    let monthlyPayment = 0;
    if (interestRate > 0) {
        monthlyPayment = loanAmount * (interestRate * Math.pow(1 + interestRate, loanTermMonths)) / 
                        (Math.pow(1 + interestRate, loanTermMonths) - 1);
    } else {
        monthlyPayment = loanAmount / loanTermMonths;
    }

    // Calculate totals
    const totalPayment = monthlyPayment * loanTermMonths;
    const totalInterest = totalPayment - loanAmount;
    const totalCost = carPrice + totalInterest;

    // Calculate depreciation estimate (cars lose ~20% first year, then ~15% each year after)
    const yearsOwned = loanTermMonths / 12;
    let estimatedValue = carPrice;
    estimatedValue *= 0.8; // First year depreciation
    for (let i = 1; i < yearsOwned; i++) {
        estimatedValue *= 0.85; // Subsequent years
    }

    // Generate AI insights
    let aiTip = '';
    const downPaymentPercent = (downPayment + tradeValue) / carPrice;
    if (downPaymentPercent < 0.20) {
        aiTip = `💡 <strong>AI Tip:</strong> With ${formatPercentage(downPaymentPercent)} down, consider increasing your down payment to 20% to reduce monthly payments and interest costs.`;
    } else if (totalInterest > loanAmount * 0.3) {
        aiTip = `💡 <strong>AI Tip:</strong> Your loan term might be too long. Consider a shorter term to save ${formatCurrency(totalInterest * 0.3)} in interest.`;
    } else {
        aiTip = `💡 <strong>AI Tip:</strong> Great financing terms! After ${Math.round(yearsOwned)} years, your car will be worth approximately ${formatCurrency(estimatedValue)}.`;
    }

    // Display results
    document.getElementById('autoOutput').innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <div style="font-size: 32px; font-weight: bold; color: #1e40af; text-align: center; margin-bottom: 10px;">
                ${formatCurrency(monthlyPayment)}
            </div>
            <div style="color: #6b7280; text-align: center; margin-bottom: 20px;">Monthly Payment</div>

            <div style="margin-top: 20px;">
                <div class="result-item">
                    <span>Car Price</span>
                    <span>${formatCurrency(carPrice)}</span>
                </div>
                <div class="result-item">
                    <span>Down Payment</span>
                    <span>${formatCurrency(downPayment)}</span>
                </div>
                ${tradeValue > 0 ? `
                <div class="result-item">
                    <span>Trade-in Value</span>
                    <span>${formatCurrency(tradeValue)}</span>
                </div>` : ''}
                <div class="result-item">
                    <span>Loan Amount</span>
                    <span><strong>${formatCurrency(loanAmount)}</strong></span>
                </div>
                <hr style="margin: 15px 0; border: 1px solid #e2e8f0;">
                <div class="result-item total">
                    <span>Monthly Payment</span>
                    <span><strong>${formatCurrency(monthlyPayment)}</strong></span>
                </div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin: 20px 0;">
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: #1e40af;">${formatCurrency(totalInterest)}</div>
                <div style="color: #6b7280; font-size: 14px;">Total Interest</div>
            </div>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: #1e40af;">${formatCurrency(totalCost)}</div>
                <div style="color: #6b7280; font-size: 14px;">Total Cost</div>
            </div>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: #1e40af;">${formatCurrency(estimatedValue)}</div>
                <div style="color: #6b7280; font-size: 14px;">Est. Value After ${Math.round(yearsOwned)}yr</div>
            </div>
        </div>

        <div class="ai-tip">
            ${aiTip}
        </div>
    `;

    showResult('autoResult');

    // Track calculation for analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'calculator_use', {
            'event_category': 'Calculator',
            'event_label': 'Auto Loan',
            'value': Math.round(monthlyPayment)
        });
    }
}

// Investment Calculator Function
function calculateInvestment() {
    // Get input values
    const initialInvestment = parseFloat(document.getElementById('initialInvestment').value) || 0;
    const monthlyContribution = parseFloat(document.getElementById('monthlyContribution').value) || 0;
    const annualRate = parseFloat(document.getElementById('investmentRate').value) / 100;
    const years = parseFloat(document.getElementById('investmentYears').value);

    // Validation
    if (!document.getElementById('investmentRate').value || !years) {
        alert('Please fill in Expected Return Rate and Investment Period');
        return;
    }

    if (initialInvestment < 0 || monthlyContribution < 0 || annualRate < 0 || years <= 0) {
        alert('Please enter valid positive numbers');
        return;
    }

    if (initialInvestment === 0 && monthlyContribution === 0) {
        alert('Please enter either an initial investment or monthly contribution');
        return;
    }

    const monthlyRate = annualRate / 12;
    const totalMonths = years * 12;

    // Calculate future value of initial investment
    const futureValueInitial = initialInvestment * Math.pow(1 + annualRate, years);

    // Calculate future value of monthly contributions (annuity)
    let futureValueMonthly = 0;
    if (monthlyContribution > 0 && monthlyRate > 0) {
        futureValueMonthly = monthlyContribution * (Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate;
    } else if (monthlyContribution > 0) {
        futureValueMonthly = monthlyContribution * totalMonths;
    }

    // Calculate totals
    const totalFutureValue = futureValueInitial + futureValueMonthly;
    const totalContributions = initialInvestment + (monthlyContribution * totalMonths);
    const totalGains = totalFutureValue - totalContributions;
    const roi = totalContributions > 0 ? (totalGains / totalContributions) : 0;

    // Calculate what happens with different scenarios
    const extraFiveYears = years + 5;
    const futureValueInitialExtra = initialInvestment * Math.pow(1 + annualRate, extraFiveYears);
    let futureValueMonthlyExtra = 0;
    if (monthlyContribution > 0 && monthlyRate > 0) {
        futureValueMonthlyExtra = monthlyContribution * (Math.pow(1 + monthlyRate, extraFiveYears * 12) - 1) / monthlyRate;
    } else if (monthlyContribution > 0) {
        futureValueMonthlyExtra = monthlyContribution * extraFiveYears * 12;
    }
    const totalFutureValueExtra = futureValueInitialExtra + futureValueMonthlyExtra;
    const bonusFromExtraYears = totalFutureValueExtra - totalFutureValue;

    // Generate AI insights
    let aiTip = '';
    if (years < 10) {
        aiTip = `💡 <strong>AI Tip:</strong> Time is your greatest asset! Investing for just 5 more years could add ${formatCurrency(bonusFromExtraYears)} to your final value due to compound interest.`;
    } else if (monthlyContribution === 0 && initialInvestment > 0) {
        const suggestedMonthly = initialInvestment * 0.1;
        aiTip = `💡 <strong>AI Tip:</strong> Consider adding regular contributions! Just ${formatCurrency(suggestedMonthly)}/month could significantly boost your returns through dollar-cost averaging.`;
    } else if (annualRate > 0.12) {
        aiTip = `💡 <strong>AI Tip:</strong> Your ${formatPercentage(annualRate)} expected return is quite optimistic. Consider diversifying with some lower-risk investments for better stability.`;
    } else {
        aiTip = `💡 <strong>AI Tip:</strong> Excellent strategy! Your ${formatPercentage(roi)} total return over ${years} years shows the power of consistent investing and compound growth.`;
    }

    // Display results
    document.getElementById('investmentOutput').innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <div style="font-size: 32px; font-weight: bold; color: #059669; text-align: center; margin-bottom: 10px;">
                ${formatCurrency(totalFutureValue)}
            </div>
            <div style="color: #6b7280; text-align: center; margin-bottom: 20px;">Total Value After ${years} Years</div>

            <div style="margin-top: 20px;">
                ${initialInvestment > 0 ? `
                <div class="result-item">
                    <span>Initial Investment</span>
                    <span>${formatCurrency(initialInvestment)}</span>
                </div>` : ''}
                ${monthlyContribution > 0 ? `
                <div class="result-item">
                    <span>Monthly Contributions</span>
                    <span>${formatCurrency(monthlyContribution)} × ${totalMonths} months</span>
                </div>` : ''}
                <div class="result-item">
                    <span>Total Contributions</span>
                    <span>${formatCurrency(totalContributions)}</span>
                </div>
                <div class="result-item">
                    <span>Investment Gains</span>
                    <span style="color: #059669;"><strong>${formatCurrency(totalGains)}</strong></span>
                </div>
                <hr style="margin: 15px 0; border: 1px solid #e2e8f0;">
                <div class="result-item total">
                    <span>Final Value</span>
                    <span style="color: #059669;"><strong>${formatCurrency(totalFutureValue)}</strong></span>
                </div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin: 20px 0;">
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: #059669;">${formatPercentage(roi)}</div>
                <div style="color: #6b7280; font-size: 14px;">Total Return</div>
            </div>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: #059669;">${formatCurrency(totalGains / years)}</div>
                <div style="color: #6b7280; font-size: 14px;">Avg. Annual Gain</div>
            </div>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: #059669;">${formatCurrency(totalFutureValue / totalMonths)}</div>
                <div style="color: #6b7280; font-size: 14px;">Value per Month</div>
            </div>
        </div>

        <div class="ai-tip">
            ${aiTip}
        </div>
    `;

    showResult('investmentResult');

    // Track calculation for analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'calculator_use', {
            'event_category': 'Calculator',
            'event_label': 'Investment',
            'value': Math.round(totalFutureValue)
        });
    }
}

// Newsletter Subscription Function
function subscribeNewsletter() {
    const email = document.getElementById('emailSignup').value.trim();

    if (!email) {
        alert('Please enter your email address');
        return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }

    // For now, just show success message
    // In production, this would integrate with email service like MailChimp
    document.getElementById('emailSignup').value = '';

    // Show success message
    alert('Thanks for subscribing! You\'ll receive our weekly financial tips and calculator updates.');

    // Track subscription for analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'newsletter_signup', {
            'event_category': 'Engagement',
            'event_label': 'Newsletter',
            'value': 1
        });
    }
}

// Event Listeners and Initialization
document.addEventListener('DOMContentLoaded', function() {
    // Add enter key support for calculator inputs
    const calculatorInputs = document.querySelectorAll('.calculator-card input');
    calculatorInputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const card = this.closest('.calculator-card');
                const button = card.querySelector('.calculate-btn');
                if (button) {
                    button.click();
                }
            }
        });
    });

    // Add enter key support for newsletter
    const emailInput = document.getElementById('emailSignup');
    if (emailInput) {
        emailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                subscribeNewsletter();
            }
        });
    }

    // Auto-format number inputs
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value && !isNaN(this.value)) {
                // Add comma formatting for large numbers
                if (parseFloat(this.value) >= 1000 && this.id !== 'interestRate' && this.id !== 'autoRate' && this.id !== 'investmentRate') {
                    this.setAttribute('data-value', this.value);
                    this.value = parseFloat(this.value).toLocaleString('en-US');
                }
            }
        });

        input.addEventListener('focus', function() {
            // Remove formatting on focus
            if (this.hasAttribute('data-value')) {
                this.value = this.getAttribute('data-value');
            }
        });
    });

    // Track page view for analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            'page_title': 'USA Financial Calculators - Home',
            'page_location': window.location.href
        });
    }

    // Add smooth scrolling for internal links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    console.log('USA Financial Calculators - Week 1 Implementation Loaded Successfully! 🚀');
});

// Additional utility functions for future enhancements
function shareCalculation(calculatorType, result) {
    // Function to share calculation results on social media
    const text = `I just calculated my ${calculatorType} using this free AI-enhanced calculator!`;
    const url = window.location.href;

    if (navigator.share) {
        navigator.share({
            title: `USA Financial Calculators - ${calculatorType}`,
            text: text,
            url: url
        });
    } else {
        // Fallback for browsers without native sharing
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
    }
}

function exportToPDF(calculatorType, resultData) {
    // Function to export calculation results to PDF
    // This would be implemented in future versions
    alert('PDF export feature coming soon! For now, you can screenshot your results.');
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);

    // Track errors for analytics (but don't annoy users)
    if (typeof gtag !== 'undefined') {
        gtag('event', 'exception', {
            'description': e.error.message,
            'fatal': false
        });
    }
});