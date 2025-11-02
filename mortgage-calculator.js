// =====================================
// SOLID PRINCIPLE-BASED ARCHITECTURE
// =====================================

// Configuration Constants
const CONFIG = {
  FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
  FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
  FRED_30Y_SERIES: 'MORTGAGE30US',
  FRED_15Y_SERIES: 'MORTGAGE15US',
  FALLBACK_RATE: 6.5,
  UPDATE_TIME: '12:00',
  GA_ID: 'G-NYBL2CDNQJ',
  CHART_COLORS: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B']
};

// =====================================
// Single Responsibility: DataFormatter
// =====================================
class DataFormatter {
  static formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  static formatCurrencyDetailed(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  static formatPercent(value) {
    return `${value.toFixed(2)}%`;
  }

  static formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  }
}

// =====================================
// Single Responsibility: CalculationEngine
// =====================================
class CalculationEngine {
  calculateMonthlyPayment(principal, annualRate, years) {
    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;
    
    if (monthlyRate === 0) return principal / numPayments;
    
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  }

  calculatePITI(inputs) {
    const loanAmount = inputs.homePrice - inputs.downPayment;
    const monthlyPI = this.calculateMonthlyPayment(loanAmount, inputs.interestRate, inputs.loanTerm);
    const monthlyTax = inputs.propertyTax / 12;
    const monthlyInsurance = inputs.homeInsurance / 12;
    
    // PMI only if down payment < 20%
    const downPaymentPercent = (inputs.downPayment / inputs.homePrice) * 100;
    const monthlyPMI = downPaymentPercent < 20 ? (loanAmount * (inputs.pmiRate / 100)) / 12 : 0;
    
    const monthlyHOA = inputs.hoaFee;
    
    return {
      principalInterest: monthlyPI,
      propertyTax: monthlyTax,
      insurance: monthlyInsurance,
      pmi: monthlyPMI,
      hoa: monthlyHOA,
      total: monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA,
      loanAmount: loanAmount,
      downPaymentPercent: downPaymentPercent
    };
  }

  generateAmortizationSchedule(principal, annualRate, years) {
    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;
    const monthlyPayment = this.calculateMonthlyPayment(principal, annualRate, years);
    
    const schedule = [];
    let balance = principal;
    
    for (let month = 1; month <= numPayments; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;
      
      schedule.push({
        month: month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance)
      });
    }
    
    return schedule;
  }

  calculateYearlyBreakdown(schedule) {
    const yearlyData = [];
    const monthsPerYear = 12;
    const totalYears = Math.ceil(schedule.length / monthsPerYear);
    
    for (let year = 1; year <= totalYears; year++) {
      const startMonth = (year - 1) * monthsPerYear;
      const endMonth = Math.min(year * monthsPerYear, schedule.length);
      const yearMonths = schedule.slice(startMonth, endMonth);
      
      const principalPaid = yearMonths.reduce((sum, m) => sum + m.principal, 0);
      const interestPaid = yearMonths.reduce((sum, m) => sum + m.interest, 0);
      const endingBalance = yearMonths[yearMonths.length - 1].balance;
      
      yearlyData.push({
        year: year,
        principalPaid: principalPaid,
        interestPaid: interestPaid,
        totalPaid: principalPaid + interestPaid,
        endingBalance: endingBalance
      });
    }
    
    return yearlyData;
  }
}

// =====================================
// Single Responsibility: FREDAPIManager
// =====================================
class FREDAPIManager {
  constructor() {
    this.lastFetchTime = null;
    this.cachedRates = null;
  }

  async fetchMortgageRates() {
    try {
      // Check cache (24-hour cache)
      if (this.cachedRates && this.lastFetchTime) {
        const hoursSinceLastFetch = (Date.now() - this.lastFetchTime) / (1000 * 60 * 60);
        if (hoursSinceLastFetch < 24) {
          return this.cachedRates;
        }
      }

      const [rate30y, rate15y] = await Promise.all([
        this.fetchSingleRate(CONFIG.FRED_30Y_SERIES),
        this.fetchSingleRate(CONFIG.FRED_15Y_SERIES)
      ]);

      this.cachedRates = {
        rate30y: rate30y || CONFIG.FALLBACK_RATE,
        rate15y: rate15y || CONFIG.FALLBACK_RATE,
        timestamp: new Date()
      };
      this.lastFetchTime = Date.now();

      return this.cachedRates;
    } catch (error) {
      console.error('FRED API Error:', error);
      return {
        rate30y: CONFIG.FALLBACK_RATE,
        rate15y: CONFIG.FALLBACK_RATE,
        timestamp: new Date(),
        error: true
      };
    }
  }

  async fetchSingleRate(series) {
    const url = `${CONFIG.FRED_BASE_URL}?series_id=${series}&api_key=${CONFIG.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    if (data.observations && data.observations.length > 0) {
      return parseFloat(data.observations[0].value);
    }
    throw new Error('No data available');
  }
}

// =====================================
// Single Responsibility: StorageManager
// =====================================
class StorageManager {
  setItem(key, value) {
    try {
      // Note: localStorage might be restricted in sandboxed environment
      // Using in-memory fallback
      if (!this.memoryStorage) this.memoryStorage = {};
      this.memoryStorage[key] = JSON.stringify(value);
    } catch (e) {
      console.warn('Storage not available, using memory storage');
      if (!this.memoryStorage) this.memoryStorage = {};
      this.memoryStorage[key] = JSON.stringify(value);
    }
  }

  getItem(key) {
    try {
      if (this.memoryStorage && this.memoryStorage[key]) {
        return JSON.parse(this.memoryStorage[key]);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}

// =====================================
// Single Responsibility: ToastNotifier
// =====================================
class ToastNotifier {
  show(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// =====================================
// Single Responsibility: ChartManager
// =====================================
class ChartManager {
  constructor() {
    this.charts = {};
  }

  createPaymentBreakdownChart(data) {
    const ctx = document.getElementById('paymentChart');
    if (!ctx) return;

    if (this.charts.payment) {
      this.charts.payment.destroy();
    }

    this.charts.payment = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Principal & Interest', 'Property Tax', 'Insurance', 'PMI', 'HOA'],
        datasets: [{
          data: [
            data.principalInterest,
            data.propertyTax,
            data.insurance,
            data.pmi,
            data.hoa
          ],
          backgroundColor: CONFIG.CHART_COLORS.slice(0, 5)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.label + ': ' + DataFormatter.formatCurrency(context.parsed);
              }
            }
          }
        }
      }
    });
  }

  createAmortizationChart(schedule) {
    const ctx = document.getElementById('amortizationChart');
    if (!ctx) return;

    if (this.charts.amortization) {
      this.charts.amortization.destroy();
    }

    // Sample data points (every 12 months)
    const sampledData = schedule.filter((_, index) => index % 12 === 0 || index === schedule.length - 1);

    this.charts.amortization = new Chart(ctx, {
      type: 'line',
      data: {
        labels: sampledData.map(s => `Month ${s.month}`),
        datasets: [
          {
            label: 'Principal',
            data: sampledData.map(s => s.principal),
            borderColor: CONFIG.CHART_COLORS[0],
            backgroundColor: CONFIG.CHART_COLORS[0] + '40',
            tension: 0.4
          },
          {
            label: 'Interest',
            data: sampledData.map(s => s.interest),
            borderColor: CONFIG.CHART_COLORS[1],
            backgroundColor: CONFIG.CHART_COLORS[1] + '40',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + DataFormatter.formatCurrency(context.parsed.y);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return DataFormatter.formatCurrency(value);
              }
            }
          }
        }
      }
    });
  }
}

// =====================================
// Single Responsibility: AIInsightsEngine
// =====================================
class AIInsightsEngine {
  generateInsights(inputs, results, schedule) {
    const insights = [];

    // Down Payment Analysis
    if (results.downPaymentPercent < 10) {
      insights.push({
        type: 'negative',
        icon: '⚠️',
        text: `Your down payment is only ${results.downPaymentPercent.toFixed(1)}%. Consider saving for a larger down payment (20%+) to avoid PMI and reduce monthly payments.`
      });
    } else if (results.downPaymentPercent >= 20) {
      insights.push({
        type: 'positive',
        icon: '✅',
        text: `Excellent! Your ${results.downPaymentPercent.toFixed(1)}% down payment means no PMI, saving you ${DataFormatter.formatCurrency(results.pmi * 12)} annually.`
      });
    } else {
      insights.push({
        type: 'warning',
        icon: '💡',
        text: `You're ${(20 - results.downPaymentPercent).toFixed(1)}% away from avoiding PMI. Increasing your down payment to 20% would save ${DataFormatter.formatCurrency(results.pmi * 12)}/year.`
      });
    }

    // Interest Rate Analysis
    if (inputs.interestRate > 7) {
      insights.push({
        type: 'negative',
        icon: '📈',
        text: `Your interest rate of ${inputs.interestRate}% is above average. Shop around with multiple lenders to potentially save thousands over the loan term.`
      });
    } else if (inputs.interestRate < 5) {
      insights.push({
        type: 'positive',
        icon: '🎯',
        text: `Great rate! Your ${inputs.interestRate}% interest rate is excellent. Consider locking it in soon if you haven't already.`
      });
    }

    // Total Interest Analysis
    const totalInterest = schedule.reduce((sum, m) => sum + m.interest, 0);
    const interestToLoanRatio = (totalInterest / results.loanAmount) * 100;
    
    if (interestToLoanRatio > 80) {
      insights.push({
        type: 'warning',
        icon: '💰',
        text: `Over the life of the loan, you'll pay ${DataFormatter.formatCurrency(totalInterest)} in interest (${interestToLoanRatio.toFixed(0)}% of the loan amount). Consider making extra principal payments to reduce this.`
      });
    }

    // Loan Term Recommendation
    if (inputs.loanTerm === 30) {
      const calc = new CalculationEngine();
      const payment15y = calc.calculateMonthlyPayment(results.loanAmount, inputs.interestRate, 15);
      const difference = payment15y - results.principalInterest;
      
      insights.push({
        type: 'info',
        icon: '📊',
        text: `With a 15-year mortgage, your monthly payment would be ${DataFormatter.formatCurrency(payment15y)} (${DataFormatter.formatCurrency(difference)} more), but you'd save significantly on interest over time.`
      });
    }

    // Property Tax Analysis
    const taxPercent = (inputs.propertyTax / inputs.homePrice) * 100;
    if (taxPercent > 1.5) {
      insights.push({
        type: 'warning',
        icon: '🏛️',
        text: `Property taxes are ${taxPercent.toFixed(2)}% of home value, which is above the national average of 1.1%. Budget accordingly for potential tax increases.`
      });
    }

    // Early Payoff Strategy
    const extraPayment = 100;
    const extraMonthly = results.principalInterest + extraPayment;
    let extraBalance = results.loanAmount;
    let extraMonths = 0;
    const monthlyRate = inputs.interestRate / 100 / 12;
    
    while (extraBalance > 0 && extraMonths < inputs.loanTerm * 12) {
      const interest = extraBalance * monthlyRate;
      const principal = extraMonthly - interest;
      extraBalance -= principal;
      extraMonths++;
    }
    
    const monthsSaved = (inputs.loanTerm * 12) - extraMonths;
    const interestSaved = totalInterest - (extraMonthly * extraMonths - results.loanAmount);
    
    if (monthsSaved > 12) {
      insights.push({
        type: 'positive',
        icon: '🚀',
        text: `Pay just ${DataFormatter.formatCurrency(extraPayment)} extra per month, and you'll pay off your mortgage ${Math.floor(monthsSaved / 12)} years ${monthsSaved % 12} months earlier, saving ${DataFormatter.formatCurrency(interestSaved)} in interest!`
      });
    }

    // PMI Elimination Timeline
    if (results.pmi > 0) {
      const monthsToEliminate = Math.ceil((0.2 * inputs.homePrice - inputs.downPayment) / results.principalInterest * 0.6);
      insights.push({
        type: 'info',
        icon: '📅',
        text: `Based on your payment schedule, you should be able to eliminate PMI in approximately ${Math.floor(monthsToEliminate / 12)} years ${monthsToEliminate % 12} months when you reach 20% equity.`
      });
    }

    // Affordability Check (28/36 rule)
    const monthlyIncome = results.total / 0.28; // Assuming they can afford it
    insights.push({
      type: 'info',
      icon: '📋',
      text: `According to the 28/36 rule, your housing payment should not exceed 28% of gross monthly income. For this mortgage, you'd need at least ${DataFormatter.formatCurrency(monthlyIncome)} monthly income.`
    });

    // First Payment Breakdown
    insights.push({
      type: 'info',
      icon: '📆',
      text: `In your first payment, ${DataFormatter.formatCurrency(schedule[0].interest)} goes to interest and only ${DataFormatter.formatCurrency(schedule[0].principal)} to principal. This ratio improves over time.`
    });

    // Total Cost Insight
    const totalCost = inputs.homePrice + totalInterest + (results.pmi * 12 * inputs.loanTerm);
    insights.push({
      type: 'warning',
      icon: '💵',
      text: `Total cost of homeownership over ${inputs.loanTerm} years: ${DataFormatter.formatCurrency(totalCost)} (home price + interest + PMI). This doesn't include maintenance, repairs, or HOA fees.`
      });

    // Refinancing Opportunity
    if (inputs.interestRate > 6) {
      insights.push({
        type: 'positive',
        icon: '🔄',
        text: `If rates drop by 0.75% or more, refinancing could save you hundreds per month. Monitor rate trends and consider refinancing when beneficial.`
      });
    }

    // HOA Fee Analysis
    if (inputs.hoaFee > 300) {
      const hoaLifetime = inputs.hoaFee * 12 * inputs.loanTerm;
      insights.push({
        type: 'warning',
        icon: '🏘️',
        text: `Your HOA fees total ${DataFormatter.formatCurrency(hoaLifetime)} over ${inputs.loanTerm} years. Make sure the amenities justify this cost.`
      });
    }

    // Equity Building
    const year5 = schedule.filter(m => m.month <= 60);
    const equityIn5Years = year5.reduce((sum, m) => sum + m.principal, 0);
    insights.push({
      type: 'positive',
      icon: '🏠',
      text: `After 5 years, you'll have built ${DataFormatter.formatCurrency(equityIn5Years + inputs.downPayment)} in home equity (down payment + principal paid).`
    });

    // Tax Deduction Benefit
    const firstYearInterest = schedule.slice(0, 12).reduce((sum, m) => sum + m.interest, 0);
    const estimatedDeduction = firstYearInterest * 0.22; // Assuming 22% tax bracket
    insights.push({
      type: 'positive',
      icon: '📝',
      text: `You may be able to deduct mortgage interest. In year 1, that's ${DataFormatter.formatCurrency(firstYearInterest)}, potentially saving ${DataFormatter.formatCurrency(estimatedDeduction)} in taxes (consult a tax professional).`
    });

    // Emergency Fund Recommendation
    const emergencyFund = results.total * 6;
    insights.push({
      type: 'info',
      icon: '⚡',
      text: `Build an emergency fund of ${DataFormatter.formatCurrency(emergencyFund)} (6 months of housing expenses) to protect against unexpected job loss or major repairs.`
    });

    // Price to Income Ratio
    const recommendedIncome = inputs.homePrice / 3;
    insights.push({
      type: 'info',
      icon: '💼',
      text: `Financial experts recommend a home price no more than 3x your annual income. For this ${DataFormatter.formatCurrency(inputs.homePrice)} home, that means ${DataFormatter.formatCurrency(recommendedIncome)}+ annual income.`
    });

    return insights;
  }
}

// =====================================
// Single Responsibility: UIRenderer
// =====================================
class UIRenderer {
  updatePaymentSummary(results) {
    document.getElementById('totalPayment').textContent = DataFormatter.formatCurrency(results.total);
    document.getElementById('piAmount').textContent = DataFormatter.formatCurrency(results.principalInterest);
    document.getElementById('taxAmount').textContent = DataFormatter.formatCurrency(results.propertyTax);
    document.getElementById('insuranceAmount').textContent = DataFormatter.formatCurrency(results.insurance);
    document.getElementById('pmiAmount').textContent = DataFormatter.formatCurrency(results.pmi);
    document.getElementById('hoaAmount').textContent = DataFormatter.formatCurrency(results.total);
    document.getElementById('totalMonthly').textContent = DataFormatter.formatCurrency(results.total);
  }

  updateLoanSummary(results, totalInterest, totalPayments) {
    document.getElementById('loanAmount').textContent = DataFormatter.formatCurrency(results.loanAmount);
    document.getElementById('totalInterest').textContent = DataFormatter.formatCurrency(totalInterest);
    document.getElementById('totalPayments').textContent = DataFormatter.formatCurrency(totalPayments);
    document.getElementById('totalCost').textContent = DataFormatter.formatCurrency(results.loanAmount + totalInterest);
  }

  renderAmortizationTable(schedule, selectedYear = 'all') {
    const tbody = document.getElementById('amortizationBody');
    tbody.innerHTML = '';

    let filteredSchedule = schedule;
    if (selectedYear !== 'all') {
      const year = parseInt(selectedYear);
      const startMonth = (year - 1) * 12 + 1;
      const endMonth = year * 12;
      filteredSchedule = schedule.filter(s => s.month >= startMonth && s.month <= endMonth);
    }

    filteredSchedule.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>Month ${item.month}</td>
        <td>${DataFormatter.formatCurrencyDetailed(item.payment)}</td>
        <td>${DataFormatter.formatCurrencyDetailed(item.principal)}</td>
        <td>${DataFormatter.formatCurrencyDetailed(item.interest)}</td>
        <td>${DataFormatter.formatCurrency(item.balance)}</td>
      `;
      tbody.appendChild(row);
    });
  }

  populateYearSelector(loanTerm) {
    const selector = document.getElementById('yearSelector');
    selector.innerHTML = '<option value="all">All Years</option>';
    
    for (let year = 1; year <= loanTerm; year++) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = `Year ${year}`;
      selector.appendChild(option);
    }
  }

  renderYearlyBreakdown(yearlyData) {
    const container = document.getElementById('yearlyBreakdown');
    container.innerHTML = '';

    yearlyData.forEach(year => {
      const card = document.createElement('div');
      card.className = 'yearly-card';
      card.innerHTML = `
        <h4>Year ${year.year}</h4>
        <div class="yearly-stats">
          <div class="yearly-stat">
            <span class="yearly-stat-label">Principal Paid</span>
            <span class="yearly-stat-value">${DataFormatter.formatCurrency(year.principalPaid)}</span>
          </div>
          <div class="yearly-stat">
            <span class="yearly-stat-label">Interest Paid</span>
            <span class="yearly-stat-value">${DataFormatter.formatCurrency(year.interestPaid)}</span>
          </div>
          <div class="yearly-stat">
            <span class="yearly-stat-label">Total Paid</span>
            <span class="yearly-stat-value">${DataFormatter.formatCurrency(year.totalPaid)}</span>
          </div>
          <div class="yearly-stat">
            <span class="yearly-stat-label">Ending Balance</span>
            <span class="yearly-stat-value">${DataFormatter.formatCurrency(year.endingBalance)}</span>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  renderInsights(insights) {
    const container = document.getElementById('insightsGrid');
    container.innerHTML = '';

    insights.forEach(insight => {
      const card = document.createElement('div');
      card.className = `insight-card ${insight.type}`;
      card.innerHTML = `
        <div class="insight-icon">${insight.icon}</div>
        <p class="insight-text">${insight.text}</p>
      `;
      container.appendChild(card);
    });
  }

  updateFREDStatus(data) {
    const statusEl = document.getElementById('fredStatus');
    const statusText = document.getElementById('fredStatusText');
    const updateTime = document.getElementById('lastUpdateTime');

    if (data.error) {
      statusEl.className = 'fred-status error';
      statusText.textContent = 'Using fallback rates';
    } else {
      statusEl.className = 'fred-status success';
      statusText.textContent = `30Y: ${data.rate30y}% | 15Y: ${data.rate15y}%`;
    }

    updateTime.textContent = DataFormatter.formatDate(data.timestamp);
  }
}

// =====================================
// FAQ Data with Schema Markup
// =====================================
const FAQ_DATA = [
  {
    question: "What is a mortgage calculator and how does it work?",
    answer: "A mortgage calculator is a financial tool that helps you estimate your monthly mortgage payment. It takes into account the home price, down payment, interest rate, loan term, property taxes, insurance, PMI, and HOA fees to calculate your total PITI (Principal, Interest, Taxes, Insurance) payment."
  },
  {
    question: "What does PITI stand for in mortgage terms?",
    answer: "PITI stands for Principal, Interest, Taxes, and Insurance. These are the four main components of a typical monthly mortgage payment: Principal (loan amount), Interest (cost of borrowing), Property Taxes, and Homeowners Insurance."
  },
  {
    question: "How much house can I afford?",
    answer: "Financial experts recommend that your housing payment not exceed 28% of your gross monthly income, and your total debt (including mortgage) should be no more than 36% of income. Your home price should typically be no more than 3-5 times your annual income."
  },
  {
    question: "What is PMI and when is it required?",
    answer: "PMI (Private Mortgage Insurance) is insurance that protects the lender if you default on your loan. It's typically required when your down payment is less than 20% of the home's purchase price. PMI can be removed once you reach 20% equity in your home."
  },
  {
    question: "How much should I put down on a house?",
    answer: "While 20% down is ideal to avoid PMI, many loans allow as little as 3-5% down. FHA loans require 3.5%, conventional loans can be as low as 3%, and VA/USDA loans may offer 0% down for qualified buyers. A larger down payment reduces your monthly payment and total interest paid."
  },
  {
    question: "What credit score do I need to buy a house?",
    answer: "The minimum credit score varies by loan type: FHA loans accept scores as low as 580 (or 500 with 10% down), conventional loans typically require 620+, and the best rates usually require 740+. Higher scores qualify for better interest rates."
  },
  {
    question: "Should I get a 15-year or 30-year mortgage?",
    answer: "A 30-year mortgage has lower monthly payments but higher total interest. A 15-year mortgage has higher monthly payments but you'll pay much less interest overall and own your home sooner. Choose based on your budget and financial goals."
  },
  {
    question: "How do I get the best mortgage rate?",
    answer: "To get the best rate: improve your credit score (740+), save for a larger down payment (20%+), compare rates from multiple lenders, consider paying points, reduce your debt-to-income ratio, and lock your rate when favorable."
  },
  {
    question: "What is included in closing costs?",
    answer: "Closing costs typically include: loan origination fees, appraisal fees, title insurance, attorney fees, credit report fees, recording fees, and prepaid items like property taxes and homeowners insurance. Expect 2-5% of the home's purchase price."
  },
  {
    question: "Can I pay off my mortgage early?",
    answer: "Yes, most mortgages allow early payoff without penalty. Making extra principal payments can significantly reduce the total interest paid and shorten your loan term. Even small extra payments can save thousands over time."
  },
  {
    question: "What is an adjustable-rate mortgage (ARM)?",
    answer: "An ARM has an interest rate that can change periodically based on market conditions. It typically starts with a lower rate than fixed-rate mortgages for an initial period (e.g., 5/1 ARM means fixed for 5 years, then adjusts annually)."
  },
  {
    question: "When should I refinance my mortgage?",
    answer: "Consider refinancing when: rates drop 0.75-1% below your current rate, you want to switch from ARM to fixed-rate, you want to shorten your loan term, you need to access home equity, or you want to eliminate PMI."
  },
  {
    question: "What are property taxes and how are they calculated?",
    answer: "Property taxes are annual taxes based on your home's assessed value, set by local government. Rates vary by location (typically 0.5-2.5% of home value). They fund local services like schools, roads, and emergency services."
  },
  {
    question: "Is mortgage interest tax deductible?",
    answer: "Yes, mortgage interest is tax-deductible for most homeowners on loans up to $750,000 ($375,000 if married filing separately). You must itemize deductions to claim this benefit. Consult a tax professional for your specific situation."
  },
  {
    question: "What is a good debt-to-income ratio for a mortgage?",
    answer: "Lenders typically want a debt-to-income (DTI) ratio below 43%, though some allow up to 50%. Front-end ratio (housing costs only) should be under 28%. Lower ratios improve approval chances and qualify for better rates."
  },
  {
    question: "What is loan-to-value (LTV) ratio?",
    answer: "LTV is the loan amount divided by the home's value, expressed as a percentage. For example, borrowing $200,000 on a $250,000 home is an 80% LTV. Lower LTV ratios typically qualify for better rates and avoid PMI."
  },
  {
    question: "What documents do I need for a mortgage application?",
    answer: "Typically required: 2 years of W-2s and tax returns, recent pay stubs, 2 months of bank statements, employment verification, ID, credit authorization, and documentation of other assets/income. Self-employed may need additional documents."
  },
  {
    question: "What is pre-approval vs pre-qualification?",
    answer: "Pre-qualification is an informal estimate of how much you might borrow. Pre-approval is a formal process where the lender verifies your finances and commits to a specific loan amount, making you a stronger buyer."
  },
  {
    question: "How does HOA fee affect my mortgage?",
    answer: "HOA fees don't affect your mortgage directly but are included in your total monthly housing cost. Lenders consider HOA fees when calculating your debt-to-income ratio and ability to afford the home."
  },
  {
    question: "What is escrow and how does it work?",
    answer: "An escrow account holds money for property taxes and insurance. Your lender collects monthly payments as part of your mortgage, then pays these bills when due. This ensures taxes and insurance are always paid on time."
  },
  {
    question: "Can I buy a house with bad credit?",
    answer: "Yes, but options are limited and rates higher. FHA loans accept scores as low as 500-580. Consider: improving credit first, larger down payment, co-signer, or specialty 'bad credit' lenders (though rates will be significantly higher)."
  },
  {
    question: "What is the difference between fixed and adjustable rates?",
    answer: "Fixed-rate mortgages have the same interest rate for the entire loan term, providing predictable payments. Adjustable-rate mortgages (ARMs) have rates that change periodically based on market conditions, starting lower but potentially increasing."
  },
  {
    question: "How much are typical homeowners insurance costs?",
    answer: "Homeowners insurance typically costs $800-$2,000 annually (0.35% to 1% of home value), varying by location, home value, coverage level, and risk factors. Coastal areas and high-risk zones cost more."
  },
  {
    question: "What is amortization?",
    answer: "Amortization is the process of paying off your loan over time through regular payments. Early payments are mostly interest; later payments are mostly principal. An amortization schedule shows the breakdown of each payment over the loan term."
  },
  {
    question: "Should I pay points to lower my interest rate?",
    answer: "Paying points (1 point = 1% of loan amount) can lower your rate by typically 0.25%. It makes sense if you'll stay in the home long enough to recoup the upfront cost through lower payments (usually 5-7 years)."
  },
  {
    question: "What is a jumbo loan?",
    answer: "A jumbo loan exceeds conforming loan limits set by Fannie Mae/Freddie Mac ($726,200 in most areas for 2023). Jumbo loans typically require higher credit scores (700+), larger down payments (10-20%), and have stricter qualification requirements."
  },
  {
    question: "Can I use gift money for down payment?",
    answer: "Yes, most loan types allow gift funds for down payment from family members. You'll need a gift letter stating the money is a gift (not a loan) and documentation of the transfer. Some loans have limits on gift fund usage."
  },
  {
    question: "What happens if I miss a mortgage payment?",
    answer: "Missing one payment incurs late fees and may affect your credit score. Multiple missed payments can lead to default and foreclosure. If struggling, contact your lender immediately about forbearance, modification, or other assistance options."
  },
  {
    question: "What is mortgage insurance vs homeowners insurance?",
    answer: "Mortgage insurance (PMI/MIP) protects the lender if you default. Homeowners insurance protects you and the lender against property damage/loss. Both may be required, but serve different purposes."
  },
  {
    question: "How long does the mortgage approval process take?",
    answer: "From application to closing typically takes 30-45 days, though it can be faster or slower. Pre-approval takes 1-3 days. Having documents ready, responding quickly to requests, and avoiding financial changes can speed the process."
  },
  {
    question: "What is the 28/36 rule for mortgages?",
    answer: "The 28/36 rule suggests your housing costs (PITI) shouldn't exceed 28% of gross monthly income, and total debt shouldn't exceed 36%. This helps ensure you can comfortably afford your mortgage and other obligations."
  },
  {
    question: "Should I use a mortgage broker or go directly to a lender?",
    answer: "Brokers can shop multiple lenders for you, potentially finding better rates and terms. Direct lenders may offer streamlined processes and relationship benefits. Compare both options and their fees to find the best deal."
  },
  {
    question: "What is a rate lock and when should I use it?",
    answer: "A rate lock guarantees your interest rate for a specific period (typically 30-60 days) during the loan process. Lock when rates are favorable and you're confident in closing within the lock period."
  },
  {
    question: "Can I rent out part of my home to help pay the mortgage?",
    answer: "Yes, rental income from a portion of your home can help qualify for a larger loan (lenders may count 75% of rental income). Ensure you understand landlord laws, insurance requirements, and tax implications."
  },
  {
    question: "What is the difference between APR and interest rate?",
    answer: "Interest rate is the cost of borrowing the principal. APR (Annual Percentage Rate) includes the interest rate plus fees and other costs, giving a more complete picture of the loan's true cost. Always compare APRs when shopping."
  },
  {
    question: "How does a co-signer help with a mortgage?",
    answer: "A co-signer with good credit and income can help you qualify for a loan you wouldn't get alone. They're equally responsible for the debt. Consider implications for both parties' finances and relationships."
  },
  {
    question: "What is a conventional loan?",
    answer: "A conventional loan is not insured by the federal government (unlike FHA, VA, USDA loans). They typically require higher credit scores (620+) and larger down payments but may offer better terms for qualified borrowers."
  },
  {
    question: "What are FHA loans and who qualifies?",
    answer: "FHA loans are government-insured mortgages requiring as little as 3.5% down with credit scores of 580+. They're ideal for first-time buyers or those with limited savings/lower credit. MIP (mortgage insurance) is required."
  },
  {
    question: "What are VA loans and who is eligible?",
    answer: "VA loans are available to veterans, active military, and eligible spouses. Benefits include: 0% down, no PMI, competitive rates, and easier qualification. You must meet service requirements and pay a VA funding fee."
  },
  {
    question: "What are USDA loans?",
    answer: "USDA loans offer 0% down for low-to-moderate income buyers in eligible rural areas. They have income limits and geographic restrictions but offer competitive rates and easier qualification than conventional loans."
  },
  {
    question: "How do I compare mortgage offers from different lenders?",
    answer: "Compare: APR (not just interest rate), closing costs, points, loan terms, monthly payment, total interest paid, lender reputation, and customer service. Get Loan Estimates from multiple lenders to compare identical scenarios."
  },
  {
    question: "What is a home appraisal and why is it required?",
    answer: "An appraisal is an independent assessment of your home's market value. Lenders require it to ensure the property is worth the loan amount. If appraised value is lower than purchase price, you may need to renegotiate or bring more cash."
  },
  {
    question: "Can I get a mortgage while self-employed?",
    answer: "Yes, but you'll need: 2 years of tax returns, profit/loss statements, bank statements, and proof of business continuity. Self-employed borrowers often need higher credit scores and larger down payments."
  },
  {
    question: "What is a biweekly mortgage payment and should I do it?",
    answer: "Biweekly payments mean paying half your monthly payment every two weeks (26 payments/year = 13 monthly payments). This extra payment per year can shorten your loan term by years and save thousands in interest."
  },
  {
    question: "How does divorce affect my mortgage?",
    answer: "Options include: one spouse refinances to remove the other, sell the home and split proceeds, or one keeps the home and buys out the other's equity. You'll need a separation agreement and possibly court approval."
  },
  {
    question: "What is a cash-out refinance?",
    answer: "Cash-out refinancing replaces your current mortgage with a larger loan, giving you the difference in cash. It's used to access home equity for renovations, debt consolidation, or other expenses. You'll pay closing costs and typically need 20% equity remaining."
  },
  {
    question: "What happens to my mortgage when I sell my house?",
    answer: "Your mortgage is paid off from the sale proceeds at closing. If you sell for more than you owe, you keep the difference. If underwater (owe more than it's worth), you may need a short sale or bring cash to closing."
  },
  {
    question: "Can I assume someone else's mortgage?",
    answer: "Some mortgages (particularly FHA, VA, and USDA) are assumable, meaning a buyer can take over your loan. This can be attractive if your rate is lower than current market rates. Lender approval is required."
  },
  {
    question: "What is a reverse mortgage?",
    answer: "A reverse mortgage allows homeowners 62+ to convert home equity into cash without selling. The lender pays you, and the loan is repaid when you sell, move, or pass away. Consider carefully as fees are high and equity decreases over time."
  },
  {
    question: "How do I remove PMI from my mortgage?",
    answer: "PMI can be removed when you reach 20% equity through payments or appreciation. Contact your lender to request cancellation (may require appraisal). It automatically terminates at 78% LTV. Refinancing can also eliminate PMI."
  }
];

// =====================================
// Main Application Controller
// =====================================
class MortgageCalculatorApp {
  constructor() {
    this.calculator = new CalculationEngine();
    this.fredManager = new FREDAPIManager();
    this.storage = new StorageManager();
    this.toast = new ToastNotifier();
    this.chartManager = new ChartManager();
    this.aiEngine = new AIInsightsEngine();
    this.renderer = new UIRenderer();
    
    this.currentSchedule = null;
    this.currentInputs = null;
    this.currentResults = null;
  }

  init() {
    this.setupEventListeners();
    this.loadDefaultValues();
    this.initializeFAQs();
    this.initializeCookieConsent();
    this.initializeDarkMode();
    this.fetchFREDRates();
    this.registerServiceWorker();
    this.initializeAnalytics();
  }

  setupEventListeners() {
    // Calculate button
    document.getElementById('calculateBtn').addEventListener('click', () => this.calculate());
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', () => this.reset());
    
    // FRED rates button
    document.getElementById('fetchFredRates').addEventListener('click', () => this.fetchFREDRates());
    
    // Dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('click', () => this.toggleDarkMode());
    
    // Voice control (if supported)
    document.getElementById('voiceControlBtn').addEventListener('click', () => this.startVoiceControl());
    
    // Speak result
    document.getElementById('speakResultBtn').addEventListener('click', () => this.speakResult());
    
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });
    
    // Year selector
    document.getElementById('yearSelector').addEventListener('change', (e) => {
      this.renderer.renderAmortizationTable(this.currentSchedule, e.target.value);
    });
    
    // Down payment percentage calculator
    document.getElementById('homePrice').addEventListener('input', () => this.updateDownPaymentPercent());
    document.getElementById('downPayment').addEventListener('input', () => this.updateDownPaymentPercent());
    
    // Share buttons
    document.getElementById('exportPdfBtn')?.addEventListener('click', () => this.exportPDF());
    document.getElementById('emailShareBtn')?.addEventListener('click', () => this.shareEmail());
    document.getElementById('twitterShareBtn')?.addEventListener('click', () => this.shareTwitter());
    
    // Cookie consent
    document.getElementById('acceptCookies')?.addEventListener('click', () => this.acceptCookies());
    document.getElementById('declineCookies')?.addEventListener('click', () => this.declineCookies());
    
    // FAQ search
    document.getElementById('faqSearch')?.addEventListener('input', (e) => this.searchFAQs(e.target.value));
  }

  loadDefaultValues() {
    // Values already set in HTML
    this.updateDownPaymentPercent();
  }

  updateDownPaymentPercent() {
    const homePrice = parseFloat(document.getElementById('homePrice').value) || 0;
    const downPayment = parseFloat(document.getElementById('downPayment').value) || 0;
    const percent = homePrice > 0 ? (downPayment / homePrice) * 100 : 0;
    document.getElementById('downPaymentPercent').textContent = percent.toFixed(1);
  }

  getInputs() {
    return {
      homePrice: parseFloat(document.getElementById('homePrice').value) || 0,
      downPayment: parseFloat(document.getElementById('downPayment').value) || 0,
      interestRate: parseFloat(document.getElementById('interestRate').value) || 0,
      loanTerm: parseInt(document.getElementById('loanTerm').value) || 30,
      propertyTax: parseFloat(document.getElementById('propertyTax').value) || 0,
      homeInsurance: parseFloat(document.getElementById('homeInsurance').value) || 0,
      pmiRate: parseFloat(document.getElementById('pmiRate').value) || 0,
      hoaFee: parseFloat(document.getElementById('hoaFee').value) || 0
    };
  }

  calculate() {
    try {
      const inputs = this.getInputs();
      this.currentInputs = inputs;
      
      // Validation
      if (inputs.homePrice <= 0) {
        this.toast.show('Please enter a valid home price', 'error');
        return;
      }
      if (inputs.downPayment >= inputs.homePrice) {
        this.toast.show('Down payment must be less than home price', 'error');
        return;
      }
      
      // Calculate PITI
      const results = this.calculator.calculatePITI(inputs);
      this.currentResults = results;
      
      // Generate amortization schedule
      const schedule = this.calculator.generateAmortizationSchedule(
        results.loanAmount,
        inputs.interestRate,
        inputs.loanTerm
      );
      this.currentSchedule = schedule;
      
      // Calculate totals
      const totalInterest = schedule.reduce((sum, m) => sum + m.interest, 0);
      const totalPayments = results.loanAmount + totalInterest;
      
      // Update UI
      this.renderer.updatePaymentSummary(results);
      this.renderer.updateLoanSummary(results, totalInterest, totalPayments);
      this.renderer.populateYearSelector(inputs.loanTerm);
      this.renderer.renderAmortizationTable(schedule);
      
      // Generate yearly breakdown
      const yearlyData = this.calculator.calculateYearlyBreakdown(schedule);
      this.renderer.renderYearlyBreakdown(yearlyData);
      
      // Generate AI insights
      const insights = this.aiEngine.generateInsights(inputs, results, schedule);
      this.renderer.renderInsights(insights);
      
      // Create charts
      this.chartManager.createPaymentBreakdownChart(results);
      this.chartManager.createAmortizationChart(schedule);
      
      // Analytics
      this.trackCalculation(inputs, results);
      
      this.toast.show('Calculation complete! Explore the tabs for detailed insights.', 'success');
      
    } catch (error) {
      console.error('Calculation error:', error);
      this.toast.show('Error calculating mortgage. Please check your inputs.', 'error');
    }
  }

  reset() {
    document.getElementById('homePrice').value = 350000;
    document.getElementById('downPayment').value = 70000;
    document.getElementById('interestRate').value = 6.5;
    document.getElementById('loanTerm').value = 30;
    document.getElementById('propertyTax').value = 4000;
    document.getElementById('homeInsurance').value = 1200;
    document.getElementById('pmiRate').value = 0.6;
    document.getElementById('hoaFee').value = 300;
    document.getElementById('zipCode').value = '';
    
    this.updateDownPaymentPercent();
    this.toast.show('Reset to default values', 'info');
  }

  async fetchFREDRates() {
    try {
      this.toast.show('Fetching latest FRED rates...', 'info');
      const data = await this.fredManager.fetchMortgageRates();
      
      this.renderer.updateFREDStatus(data);
      
      // Get current loan term to set appropriate rate
      const loanTerm = parseInt(document.getElementById('loanTerm').value);
      const rate = loanTerm === 15 ? data.rate15y : data.rate30y;
      document.getElementById('interestRate').value = rate;
      
      if (data.error) {
        this.toast.show('Using fallback rates. FRED API may be temporarily unavailable.', 'warning');
      } else {
        this.toast.show(`Rates updated! 30Y: ${data.rate30y}%, 15Y: ${data.rate15y}%`, 'success');
      }
    } catch (error) {
      console.error('FRED fetch error:', error);
      this.toast.show('Could not fetch FRED rates. Using fallback rate.', 'error');
    }
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).setAttribute('aria-selected', 'true');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-panel`).classList.add('active');
  }

  initializeDarkMode() {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = this.storage.getItem('theme');
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.setAttribute('data-color-scheme', 'dark');
    }
  }

  toggleDarkMode() {
    const current = document.documentElement.getAttribute('data-color-scheme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-color-scheme', newTheme);
    this.storage.setItem('theme', newTheme);
    this.toast.show(`Switched to ${newTheme} mode`, 'info');
  }

  startVoiceControl() {
    if (!('webkitSpeechRecognition' in window)) {
      this.toast.show('Voice control not supported in this browser', 'error');
      return;
    }
    
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      this.toast.show('Listening... Try: "Set home price to 400000"', 'info');
    };
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      this.processVoiceCommand(transcript);
    };
    
    recognition.onerror = () => {
      this.toast.show('Voice recognition error', 'error');
    };
    
    recognition.start();
  }

  processVoiceCommand(command) {
    // Simple command parsing
    if (command.includes('home price') || command.includes('house price')) {
      const match = command.match(/\d+/);
      if (match) {
        document.getElementById('homePrice').value = match[0];
        this.toast.show(`Set home price to ${match[0]}`, 'success');
      }
    } else if (command.includes('down payment')) {
      const match = command.match(/\d+/);
      if (match) {
        document.getElementById('downPayment').value = match[0];
        this.updateDownPaymentPercent();
        this.toast.show(`Set down payment to ${match[0]}`, 'success');
      }
    } else if (command.includes('calculate')) {
      this.calculate();
    } else {
      this.toast.show('Command not recognized', 'warning');
    }
  }

  speakResult() {
    if (!this.currentResults) {
      this.toast.show('Please calculate first', 'warning');
      return;
    }
    
    if (!('speechSynthesis' in window)) {
      this.toast.show('Text-to-speech not supported', 'error');
      return;
    }
    
    const text = `Your monthly mortgage payment is ${DataFormatter.formatCurrency(this.currentResults.total)}. ` +
                 `This includes ${DataFormatter.formatCurrency(this.currentResults.principalInterest)} for principal and interest, ` +
                 `${DataFormatter.formatCurrency(this.currentResults.propertyTax)} for property tax, ` +
                 `${DataFormatter.formatCurrency(this.currentResults.insurance)} for insurance, ` +
                 `${DataFormatter.formatCurrency(this.currentResults.pmi)} for PMI, ` +
                 `and ${DataFormatter.formatCurrency(this.currentResults.hoa)} for HOA fees.`;
    
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  }

  initializeFAQs() {
    const container = document.getElementById('faqContainer');
    
    FAQ_DATA.forEach((faq, index) => {
      const item = document.createElement('div');
      item.className = 'faq-item';
      item.innerHTML = `
        <button class="faq-question" aria-expanded="false">
          <span>${faq.question}</span>
          <span class="faq-icon">▼</span>
        </button>
        <div class="faq-answer">
          <p>${faq.answer}</p>
        </div>
      `;
      
      const button = item.querySelector('.faq-question');
      button.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        item.classList.toggle('open');
        button.setAttribute('aria-expanded', !isOpen);
      });
      
      container.appendChild(item);
    });
  }

  searchFAQs(query) {
    const items = document.querySelectorAll('.faq-item');
    const searchTerm = query.toLowerCase();
    
    items.forEach(item => {
      const question = item.querySelector('.faq-question span').textContent.toLowerCase();
      const answer = item.querySelector('.faq-answer p').textContent.toLowerCase();
      
      if (question.includes(searchTerm) || answer.includes(searchTerm)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  }

  initializeCookieConsent() {
    const consent = this.storage.getItem('cookieConsent');
    if (!consent) {
      document.getElementById('cookieConsent').classList.add('show');
    }
  }

  acceptCookies() {
    this.storage.setItem('cookieConsent', 'accepted');
    document.getElementById('cookieConsent').classList.remove('show');
    this.toast.show('Cookie preferences saved', 'success');
  }

  declineCookies() {
    this.storage.setItem('cookieConsent', 'declined');
    document.getElementById('cookieConsent').classList.remove('show');
    this.toast.show('Cookie preferences saved', 'info');
  }

  exportPDF() {
    this.toast.show('PDF export feature coming soon!', 'info');
    // In production, integrate with jsPDF or similar library
  }

  shareEmail() {
    if (!this.currentResults) {
      this.toast.show('Please calculate first', 'warning');
      return;
    }
    
    const subject = 'My Mortgage Calculation Results';
    const body = `Check out my mortgage calculation:\n\nMonthly Payment: ${DataFormatter.formatCurrency(this.currentResults.total)}\nLoan Amount: ${DataFormatter.formatCurrency(this.currentResults.loanAmount)}\n\nCalculate yours at: ${window.location.href}`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  shareTwitter() {
    if (!this.currentResults) {
      this.toast.show('Please calculate first', 'warning');
      return;
    }
    
    const text = `I just calculated my mortgage payment: ${DataFormatter.formatCurrency(this.currentResults.total)}/month! Check out the World's Best Mortgage Calculator 🏠💰`;
    const url = window.location.href;
    
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  }

  registerServiceWorker() {
    // Service worker registration for PWA capability
    if ('serviceWorker' in navigator) {
      // In production, uncomment and provide service-worker.js
      // navigator.serviceWorker.register('/service-worker.js')
      //   .then(() => console.log('Service Worker registered'))
      //   .catch(err => console.log('Service Worker registration failed', err));
    }
  }

  initializeAnalytics() {
    // Google Analytics initialization
    // In production, uncomment this section
    /*
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', CONFIG.GA_ID);
    */
  }

  trackCalculation(inputs, results) {
    // Track calculation event
    // In production, uncomment this
    /*
    if (typeof gtag !== 'undefined') {
      gtag('event', 'calculate_mortgage', {
        home_price: inputs.homePrice,
        down_payment: inputs.downPayment,
        loan_term: inputs.loanTerm,
        monthly_payment: results.total
      });
    }
    */
    console.log('Calculation tracked:', { inputs, results });
  }
}

// =====================================
// Initialize Application
// =====================================
const app = new MortgageCalculatorApp();

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}
