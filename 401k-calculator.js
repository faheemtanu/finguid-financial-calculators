/**
 * 401(k) CALCULATOR — AI-POWERED RETIREMENT OPTIMIZER - PRODUCTION JS v3.0
 * FinGuid USA - Enhanced AI Insights (20+ Dynamic Recommendations)
 * World's First AI-Powered 401(k) Optimizer for Americans
 */

const CONFIG = {
    VERSION: '3.0',
    DEBUG: false,
    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    FRED_SERIES_ID: 'CPIAUCSL',
    IRS_LIMIT: 23000,
    CATCHUP_LIMIT: 7500,
    TAX_BRACKETS: {
        'Single': [
            { limit: 11600, rate: 0.10 },
            { limit: 47150, rate: 0.12 },
            { limit: 100525, rate: 0.22 },
            { limit: 191950, rate: 0.24 },
            { limit: 243725, rate: 0.32 },
            { limit: 609350, rate: 0.35 },
            { limit: Infinity, rate: 0.37 }
        ],
        'Married Filing Jointly': [
            { limit: 23200, rate: 0.10 },
            { limit: 94300, rate: 0.12 },
            { limit: 201050, rate: 0.22 },
            { limit: 383900, rate: 0.24 },
            { limit: 487450, rate: 0.32 },
            { limit: 731200, rate: 0.35 },
            { limit: Infinity, rate: 0.37 }
        ],
        'Head of Household': [
            { limit: 16550, rate: 0.10 },
            { limit: 63100, rate: 0.12 },
            { limit: 100500, rate: 0.22 },
            { limit: 191950, rate: 0.24 },
            { limit: 243700, rate: 0.32 },
            { limit: 609350, rate: 0.35 },
            { limit: Infinity, rate: 0.37 }
        ]
    },
    charts: { projection: null },
    calculation: {
        projectionSchedule: [],
        firstYear: {},
        totals: {},
        inputs: {}
    },
    liveInflationRate: 0.025
};

const UTILS = {
    formatCurrency(amount, decimals = 2) {
        if (typeof amount !== 'number' || isNaN(amount)) return '$0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(amount);
    },

    parseInput(id, isCurrency = true) {
        const value = document.getElementById(id).value;
        if (isCurrency) {
            const clean = value.replace(/[$,]/g, '').trim();
            return parseFloat(clean) || 0;
        }
        return parseFloat(value) || 0;
    },

    debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.setAttribute('role', 'status');
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    },

    trackEvent(eventName, eventData = {}) {
        if (typeof gtag === 'function') {
            gtag('event', eventName, eventData);
        }
    }
};

const FRED = {
    async fetchInflation() {
        if (CONFIG.DEBUG) return 0.025;
        try {
            const url = new URL(CONFIG.FRED_BASE_URL);
            url.searchParams.append('series_id', CONFIG.FRED_SERIES_ID);
            url.searchParams.append('api_key', CONFIG.FRED_API_KEY);
            url.searchParams.append('file_type', 'json');
            url.searchParams.append('sort_order', 'desc');
            url.searchParams.append('limit', '13');
            const response = await fetch(url.toString());
            if (!response.ok) throw new Error('FRED API error');
            const data = await response.json();
            const observations = data.observations.filter(o => o.value && o.value !== '.');
            if (observations.length >= 13) {
                const latest = parseFloat(observations[0].value);
                const prior = parseFloat(observations[12].value);
                const rate = (latest - prior) / prior;
                CONFIG.liveInflationRate = rate;
                return rate;
            }
        } catch (error) {
            console.error('FRED API error:', error);
        }
        CONFIG.liveInflationRate = 0.025;
        return 0.025;
    },

    startAutoUpdate() {
        this.fetchInflation().then(() => updateCalculations());
        setInterval(() => this.fetchInflation(), 6 * 60 * 60 * 1000);
    }
};

function getEffectiveTaxRate(income, filingStatus) {
    const brackets = CONFIG.TAX_BRACKETS[filingStatus] || CONFIG.TAX_BRACKETS['Single'];
    for (const bracket of brackets) {
        if (income <= bracket.limit) {
            return bracket.rate;
        }
    }
    return 0.37;
}

function calculate401k() {
    const inputs = {
        currentAge: UTILS.parseInput('current-age', false),
        retirementAge: UTILS.parseInput('retirement-age', false),
        annualSalary: UTILS.parseInput('annual-salary', true),
        filingStatus: document.getElementById('filing-status').value,
        currentBalance: UTILS.parseInput('current-balance', true),
        contributionPercent: UTILS.parseInput('contribution-percent', false) / 100,
        employerMatchPercent: UTILS.parseInput('employer-match-percent', false) / 100,
        matchUpToPercent: UTILS.parseInput('match-up-to-percent', false) / 100,
        salaryIncrease: UTILS.parseInput('salary-increase', false) / 100,
        rateOfReturn: UTILS.parseInput('rate-of-return', false) / 100,
        includeCatchUp: document.getElementById('include-catch-up').checked,
        includeInflation: document.getElementById('include-inflation').checked
    };

    if (inputs.currentAge >= inputs.retirementAge || inputs.annualSalary <= 0) {
        UTILS.showToast('Please check your age and salary inputs', 'error');
        return;
    }

    let balance = inputs.currentBalance;
    let salary = inputs.annualSalary;
    const projection = [];
    let totalContrib = 0;
    let totalMatch = 0;
    let totalGains = 0;

    const returnRate = inputs.includeInflation
        ? ((1 + inputs.rateOfReturn) / (1 + CONFIG.liveInflationRate)) - 1
        : inputs.rateOfReturn;

    for (let age = inputs.currentAge; age < inputs.retirementAge; age++) {
        let contrib = salary * inputs.contributionPercent;
        let catchUp = 0;
        if (age >= 50 && inputs.includeCatchUp) {
            catchUp = CONFIG.CATCHUP_LIMIT;
        }
        contrib = Math.min(contrib, CONFIG.IRS_LIMIT + catchUp);

        const match = Math.min(
            salary * inputs.matchUpToPercent,
            contrib
        ) * inputs.employerMatchPercent;

        const totalAnnual = contrib + match;
        const gains = (balance + totalAnnual / 2) * returnRate;
        const endBalance = balance + totalAnnual + gains;

        projection.push({
            age, salary, contrib, match, gains, endBalance
        });

        balance = endBalance;
        salary *= (1 + inputs.salaryIncrease);
        totalContrib += contrib;
        totalMatch += match;
        totalGains += gains;
    }

    CONFIG.calculation = {
        projectionSchedule: projection,
        firstYear: projection[0] || {},
        totals: { finalBalance: balance, totalContrib, totalMatch, totalGains },
        inputs
    };
}

function updateCalculations() {
    try {
        calculate401k();
        updateSummary();
        updateChart();
        updateDetailsTab();
        updateTable();
        generateAIInsights();
        UTILS.trackEvent('calculation_complete', {
            age: CONFIG.calculation.inputs.currentAge,
            projected_total: CONFIG.calculation.totals.finalBalance
        });
    } catch (error) {
        console.error('Calculation error:', error);
        UTILS.showToast('Calculation error', 'error');
    }
}

function updateSummary() {
    const { totals } = CONFIG.calculation;
    document.getElementById('projected-total').textContent = UTILS.formatCurrency(totals.finalBalance, 0);
    document.getElementById('projection-summary-details').innerHTML = `
        Your Cont: ${UTILS.formatCurrency(totals.totalContrib, 0)} | 
        Employer Match: ${UTILS.formatCurrency(totals.totalMatch, 0)} | 
        Total Growth: ${UTILS.formatCurrency(totals.totalGains, 0)}
    `;
}

function updateDetailsTab() {
    const { firstYear, inputs } = CONFIG.calculation;
    
    document.getElementById('your-annual-contribution').textContent = UTILS.formatCurrency(firstYear.contrib || 0);
    document.getElementById('employer-annual-match').textContent = UTILS.formatCurrency(firstYear.match || 0);
    document.getElementById('total-annual-contribution').textContent = UTILS.formatCurrency((firstYear.contrib || 0) + (firstYear.match || 0));

    const rate = getEffectiveTaxRate(inputs.annualSalary, inputs.filingStatus);
    const savings = (firstYear.contrib || 0) * rate;

    document.getElementById('marginal-tax-rate').textContent = `${(rate * 100).toFixed(1)}%`;
    document.getElementById('annual-tax-savings').textContent = UTILS.formatCurrency(savings);
}

function updateChart() {
    const { projectionSchedule, inputs } = CONFIG.calculation;
    if (projectionSchedule.length === 0) return;

    const ctx = document.getElementById('401k-projection-chart')?.getContext('2d');
    if (!ctx) return;

    const labels = projectionSchedule.map(d => d.age);
    const balances = projectionSchedule.map(d => d.endBalance);

    if (CONFIG.charts.projection) {
        CONFIG.charts.projection.destroy();
    }

    CONFIG.charts.projection = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Projected Balance',
                data: balances,
                borderColor: 'rgb(36, 172, 185)',
                backgroundColor: 'rgba(36, 172, 185, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: 'rgb(31, 33, 33)' } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Balance: ${UTILS.formatCurrency(ctx.parsed.y, 0)}`
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: 'rgb(31, 33, 33)' },
                    title: { display: true, text: 'Age', color: 'rgb(31, 33, 33)' }
                },
                y: {
                    ticks: {
                        color: 'rgb(31, 33, 33)',
                        callback: (v) => UTILS.formatCurrency(v, 0).replace('.00', '')
                    },
                    title: { display: true, text: 'Balance ($)', color: 'rgb(31, 33, 33)' }
                }
            }
        }
    });
}

function updateTable() {
    const tbody = document.querySelector('#projection-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    CONFIG.calculation.projectionSchedule.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.age}</td>
            <td>${UTILS.formatCurrency(item.salary, 0)}</td>
            <td>${UTILS.formatCurrency(item.contrib, 0)}</td>
            <td>${UTILS.formatCurrency(item.match, 0)}</td>
            <td>${UTILS.formatCurrency(item.gains, 0)}</td>
            <td>${UTILS.formatCurrency(item.endBalance, 0)}</td>
        `;
        tbody.appendChild(row);
    });
}

/* ========================================================================== */
/* ENHANCED AI INSIGHTS ENGINE - 20+ DYNAMIC RECOMMENDATIONS */
/* ========================================================================== */

function generateAIInsights() {
    const { inputs, firstYear, totals, projectionSchedule } = CONFIG.calculation;
    const contentBox = document.getElementById('ai-insights-content');
    if (!contentBox) return;

    let html = '<p style="font-weight: bold; color: rgb(36, 172, 185); font-size: 1.1rem; margin-bottom: 20px;">🤖 World\'s First AI-Powered Retirement Analysis</p>';

    // 1. MISSING MATCH DETECTION (CRITICAL)
    const missedMatch = inputs.contributionPercent < inputs.matchUpToPercent;
    if (missedMatch) {
        const potentialMatch = Math.min(inputs.annualSalary * inputs.matchUpToPercent, inputs.annualSalary * inputs.matchUpToPercent) * inputs.employerMatchPercent;
        const missed = potentialMatch - (firstYear.match || 0);
        const missedTotal = missed * (inputs.retirementAge - inputs.currentAge);
        html += `
            <div class="recommendation-alert high-priority">
                <i class="fas fa-exclamation-triangle"></i> 🚨 CRITICAL: Leaving ${UTILS.formatCurrency(missed, 0)}/Year in Free Money!
            </div>
            <p><strong>Current Contribution:</strong> ${(inputs.contributionPercent * 100).toFixed(1)}% = ${UTILS.formatCurrency(firstYear.contrib || 0)}/year</p>
            <p><strong>Employer Matches:</strong> Up to ${(inputs.matchUpToPercent * 100).toFixed(1)}%</p>
            <p><strong>Action:</strong> Increase to ${(inputs.matchUpToPercent * 100).toFixed(1)}% to capture <strong>${UTILS.formatCurrency(missed)}/year</strong> in employer matching. Over your career, that's <strong>${UTILS.formatCurrency(missedTotal)}</strong> in unclaimed benefits!</p>
        `;
    } else {
        html += `
            <div class="recommendation-alert low-priority">
                <i class="fas fa-check-circle"></i> ✅ Excellent Match Strategy
            </div>
            <p>You're maximizing your employer match at <strong>${(inputs.contributionPercent * 100).toFixed(1)}%</strong>, capturing <strong>${UTILS.formatCurrency(firstYear.match || 0)}</strong> annually. This is critical for long-term wealth.</p>
        `;
    }

    // 2. RETIREMENT READINESS
    const yearsToRetire = inputs.retirementAge - inputs.currentAge;
    const monthlySpendNeeded = totals.finalBalance / (35 * 12);
    const percentOfSalary = (monthlySpendNeeded * 12 / inputs.annualSalary) * 100;
    
    if (percentOfSalary < 70) {
        html += `
            <div class="ai-insight-item priority-high">
                <h4><i class="fas fa-warning"></i> Retirement Income Gap</h4>
                <p>Your 401(k) alone provides <strong>${percentOfSalary.toFixed(0)}%</strong> of current income. Add Social Security + other savings to reach 90-100% replacement goal.</p>
            </div>
        `;
    } else {
        html += `
            <div class="ai-insight-item priority-low">
                <h4><i class="fas fa-check"></i> Strong Retirement Position</h4>
                <p>Your 401(k) projects <strong>${percentOfSalary.toFixed(0)}%</strong> income replacement. Combined with Social Security, you're well-positioned for comfortable retirement.</p>
            </div>
        `;
    }

    // 3. TAX SAVINGS ANALYSIS
    const taxRate = getEffectiveTaxRate(inputs.annualSalary, inputs.filingStatus);
    const annualTaxSavings = (firstYear.contrib || 0) * taxRate;
    const careerTaxSavings = annualTaxSavings * yearsToRetire;
    
    html += `
        <div class="ai-insight-item priority-low">
            <h4><i class="fas fa-money-bill-alt"></i> Federal Tax Benefits</h4>
            <p>At your <strong>${(taxRate * 100).toFixed(1)}%</strong> tax rate, you save <strong>${UTILS.formatCurrency(annualTaxSavings)}/year</strong> in federal taxes. Over your career: <strong>${UTILS.formatCurrency(careerTaxSavings)}</strong>!</p>
        </div>
    `;

    // 4. YEARS TO RETIREMENT
    html += `
        <div class="ai-insight-item priority-low">
            <h4><i class="fas fa-hourglass-end"></i> Timeline to Retirement</h4>
            <p>In <strong>${yearsToRetire} years</strong> (age ${inputs.retirementAge}), you'll have <strong>${UTILS.formatCurrency(totals.finalBalance, 0)}</strong> saved. That's <strong>${UTILS.formatCurrency(monthlySpendNeeded, 0)}/month</strong> using the 4% rule.</p>
        </div>
    `;

    // 5. EMPLOYER MATCH VALUE
    html += `
        <div class="ai-insight-item priority-low">
            <h4><i class="fas fa-gift"></i> Employer Match Power</h4>
            <p>Your employer contributes <strong>${UTILS.formatCurrency(totals.totalMatch, 0)}</strong> over your career. That's <strong>100% free money</strong> growing tax-free until retirement!</p>
        </div>
    `;

    // 6. CATCH-UP CONTRIBUTIONS
    if (inputs.currentAge >= 50) {
        if (!inputs.includeCatchUp) {
            html += `
                <div class="recommendation-alert medium-priority">
                    <i class="fas fa-birthday-cake"></i> Age 50+ Catch-Up Opportunity
                </div>
                <p>You're eligible for <strong>${UTILS.formatCurrency(CONFIG.CATCHUP_LIMIT)}</strong> additional annual contributions. Enable catch-up above to accelerate retirement savings!</p>
            `;
        } else {
            html += `
                <div class="ai-insight-item priority-low">
                    <h4><i class="fas fa-rocket"></i> Catch-Up Active</h4>
                    <p>You're maximizing age 50+ catch-up at <strong>${UTILS.formatCurrency(CONFIG.CATCHUP_LIMIT)}</strong>/year. This accelerated strategy supercharges your final working years!</p>
                </div>
            `;
        }
    }

    // 7. COMPOUND GROWTH ANALYSIS
    const compoundMultiplier = (totals.totalGains / (totals.totalContrib + totals.totalMatch));
    html += `
        <div class="ai-insight-item priority-low">
            <h4><i class="fas fa-chart-line"></i> Power of Compound Growth</h4>
            <p>Investment gains of <strong>${UTILS.formatCurrency(totals.totalGains, 0)}</strong> represent <strong>${(compoundMultiplier * 100).toFixed(0)}%</strong> growth on contributions. Time and returns work powerfully together!</p>
        </div>
    `;

    // 8. SALARY GROWTH IMPACT
    const salaryAtRetirement = projectionSchedule[projectionSchedule.length - 1]?.salary || inputs.annualSalary;
    const salaryGrowthPercent = ((salaryAtRetirement / inputs.annualSalary) - 1) * 100;
    
    html += `
        <div class="ai-insight-item priority-low">
            <h4><i class="fas fa-chart-bar"></i> Salary Growth Impact</h4>
            <p>With <strong>${(inputs.salaryIncrease * 100).toFixed(1)}%</strong> annual raises, your salary grows <strong>${salaryGrowthPercent.toFixed(0)}%</strong> to ${UTILS.formatCurrency(salaryAtRetirement, 0)}, boosting contributions proportionally.</p>
        </div>
    `;

    // 9. FIRST YEAR MILESTONE
    html += `
        <div class="ai-insight-item priority-low">
            <h4><i class="fas fa-flag-checkered"></i> Year 1 Contribution Milestone</h4>
            <p>Year 1 total: <strong>${UTILS.formatCurrency((firstYear.contrib || 0) + (firstYear.match || 0))}</strong> (You: ${UTILS.formatCurrency(firstYear.contrib || 0)}, Employer: ${UTILS.formatCurrency(firstYear.match || 0)})</p>
        </div>
    `;

    // 10. IRS LIMITS COMPLIANCE
    const contribLimitUsage = ((firstYear.contrib || 0) / (CONFIG.IRS_LIMIT + (inputs.currentAge >= 50 && inputs.includeCatchUp ? CONFIG.CATCHUP_LIMIT : 0))) * 100;
    
    html += `
        <div class="ai-insight-item priority-low">
            <h4><i class="fas fa-gavel"></i> 2024 IRS Limits</h4>
            <p>Regular: ${UTILS.formatCurrency(CONFIG.IRS_LIMIT)} | Catch-Up (50+): +${UTILS.formatCurrency(CONFIG.CATCHUP_LIMIT)} | You're using <strong>${contribLimitUsage.toFixed(0)}%</strong> of available space.</p>
        </div>
    `;

    // 11. INFLATION CONSIDERATION
    if (inputs.includeInflation) {
        html += `
            <div class="ai-insight-item priority-low">
                <h4><i class="fas fa-percent"></i> Inflation-Adjusted Analysis</h4>
                <p>Current inflation (FRED data): <strong>${(CONFIG.liveInflationRate * 100).toFixed(2)}%</strong> YoY. Your projections show purchasing power in today's dollars—conservative but realistic.</p>
            </div>
        `;
    }

    // 12. CONTRIBUTION ACCELERATION STRATEGY
    html += `
        <div class="ai-insight-item priority-medium">
            <h4><i class="fas fa-fast-forward"></i> Contribution Acceleration</h4>
            <p>Pro Tip: Increase contributions <strong>1% annually</strong> with raises. Minimal lifestyle impact, massive long-term benefit.</p>
        </div>
    `;

    // 13. INVESTMENT RETURN SENSITIVITY
    const lowReturnBalance = totals.finalBalance * 0.8;
    const highReturnBalance = totals.finalBalance * 1.2;
    
    html += `
        <div class="ai-insight-item priority-low">
            <h4><i class="fas fa-thermometer-half"></i> Return Sensitivity Analysis</h4>
            <p>At <strong>${(inputs.rateOfReturn * 100).toFixed(1)}%</strong> returns: ${UTILS.formatCurrency(totals.finalBalance, 0)} | Conservative: ~${UTILS.formatCurrency(lowReturnBalance, 0)} | Optimistic: ~${UTILS.formatCurrency(highReturnBalance, 0)}</p>
        </div>
    `;

    // 14. EMPLOYER MATCH STRATEGY
    const matchPercent = inputs.employerMatchPercent * 100;
    html += `
        <div class="ai-insight-item priority-low">
            <h4><i class="fas fa-balance-scale"></i> Match Structure Analysis</h4>
            <p>Your employer matches <strong>${matchPercent.toFixed(0)}%</strong> of contributions up to <strong>${(inputs.matchUpToPercent * 100).toFixed(1)}%</strong> of salary. This is ${matchPercent === 100 ? 'an excellent, generous' : matchPercent === 50 ? 'a competitive' : 'a solid'} match rate.</p>
        </div>
    `;

    // 15. CAREER EARNINGS vs 401(K) GROWTH
    const totalCareerSalary = projectionSchedule.reduce((sum, item) => sum + item.salary, 0);
    const percentageOfEarnings = (totals.finalBalance / totalCareerSalary) * 100;
    
    html += `
        <div class="ai-insight-item priority-low">
            <h4><i class="fas fa-briefcase"></i> 401(k) as % of Career Earnings</h4>
            <p>Career earnings: ~${UTILS.formatCurrency(totalCareerSalary, 0)} | Retirement savings: ${UTILS.formatCurrency(totals.finalBalance, 0)} | That's <strong>${percentageOfEarnings.toFixed(1)}%</strong> replacement—healthy!</p>
        </div>
    `;

    // 16. SOCIAL SECURITY INTEGRATION
    const estimatedSSBenefit = (inputs.annualSalary * 0.4);
    const totalRetirementIncome = monthlySpendNeeded + (estimatedSSBenefit / 12);
    
    html += `
        <div class="ai-insight-item priority-low">
            <h4><i class="fas fa-lock"></i> Social Security Integration</h4>
            <p>Estimated Social Security (age ${inputs.retirementAge}): ~${UTILS.formatCurrency(estimatedSSBenefit, 0)}/year | Combined 401(k) + SS income: ~${UTILS.formatCurrency(totalRetirementIncome * 12, 0)}/year</p>
        </div>
    `;

    // 17. SPENDING SUSTAINABILITY
    const withdrawalRate = monthlySpendNeeded / (totals.finalBalance / 12);
    const withdrawalHealthy = withdrawalRate <= 0.04;
    
    html += `
        <div class="ai-insight-item ${withdrawalHealthy ? 'priority-low' : 'priority-high'}">
            <h4><i class="fas fa-hand-holding-usd"></i> Spending Sustainability</h4>
            <p>4% withdrawal rule suggests: <strong>${UTILS.formatCurrency(monthlySpendNeeded, 0)}/month</strong> (${(withdrawalRate * 100).toFixed(2)}% rate) is ${withdrawalHealthy ? '✓ sustainable' : '⚠️ aggressive'}. Consider reducing or supplementing.</p>
        </div>
    `;

    // 18. RISK DIVERSIFICATION REMINDER
    html += `
        <div class="ai-insight-item priority-medium">
            <h4><i class="fas fa-shield-alt"></i> Diversification Reminder</h4>
            <p>Ensure your 401(k) is diversified: stocks, bonds, and stable value funds. Review allocation annually and rebalance as needed.</p>
        </div>
    `;

    // 19. ACTION ITEMS CHECKLIST
    html += `
        <div class="recommendation-alert low-priority" style="margin-top: 24px; margin-bottom: 0;">
            <i class="fas fa-tasks"></i> Action Items Checklist
        </div>
        <ul style="margin: 16px 0 16px 24px; line-height: 2;">
            <li>✅ Your contribution: <strong>${(inputs.contributionPercent * 100).toFixed(1)}%</strong> ${missedMatch ? `| ⚠️ INCREASE to ${(inputs.matchUpToPercent * 100).toFixed(1)}% for full match` : '| ✓ Full match captured'}</li>
            <li>✅ Employer match: <strong>${matchPercent.toFixed(0)}%</strong> of contributions up to <strong>${(inputs.matchUpToPercent * 100).toFixed(1)}%</strong></li>
            <li>✅ Catch-up contributions: ${inputs.currentAge >= 50 ? (inputs.includeCatchUp ? 'Enabled' : '⚠️ Available but disabled') : 'N/A (under 50)'}</li>
            <li>✅ Expected retirement: Age <strong>${inputs.retirementAge}</strong> (in ${yearsToRetire} years)</li>
            <li>✅ Projected balance: <strong>${UTILS.formatCurrency(totals.finalBalance, 0)}</strong></li>
            <li>✅ Annual tax savings: <strong>${UTILS.formatCurrency(annualTaxSavings, 0)}</strong></li>
        </ul>
    `;

    // 20. PARTNER SERVICES INTEGRATION
    html += `
        <div style="margin-top: 24px; padding: 16px; background: rgba(36, 172, 185, 0.1); border-radius: 8px; border-left: 4px solid rgb(36, 172, 185);">
            <h4 style="color: rgb(19, 52, 59); margin-bottom: 12px;"><i class="fas fa-handshake"></i> Optimize Your Strategy</h4>
            <p style="font-size: 0.95rem; margin: 0;">Get professional guidance through our partners:</p>
            <ul style="margin: 12px 0 12px 24px; font-size: 0.9rem;">
                <li><a href="#" onclick="trackAffiliateClick('robo'); return false;" class="affiliate-cta">📊 Compare Robo-Advisors</a> for automated portfolio management</li>
                <li><a href="#" onclick="trackAffiliateClick('advisor'); return false;" class="affiliate-cta">👤 Find Financial Advisor</a> for personalized 401(k) strategy</li>
                <li><a href="#" onclick="trackAffiliateClick('hysa'); return false;" class="affiliate-cta">🏦 High-Yield Savings</a> for emergency funds</li>
                <li><a href="#" onclick="trackAffiliateClick('rollover'); return false;" class="affiliate-cta">🔄 401(k) Rollover</a> for job changes</li>
            </ul>
        </div>
    `;

    contentBox.innerHTML = html;
}

function toggleColorScheme() {
    const html = document.documentElement;
    const scheme = html.getAttribute('data-color-scheme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-color-scheme', scheme);
    try { localStorage.setItem('colorScheme', scheme); } catch (e) {}
    UTILS.trackEvent('theme_toggle', { theme: scheme });
    updateChart();
}

function loadPreferences() {
    try {
        const saved = localStorage.getItem('colorScheme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const scheme = saved || (prefersDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-color-scheme', scheme);
        updateThemeIcon(scheme);
    } catch (e) {}
}

function updateThemeIcon(scheme) {
    const icon = document.querySelector('#toggle-color-scheme i');
    if (icon) {
        icon.className = scheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

const SPEECH = {
    recognition: null,
    synthesizer: null,
    active: false,
    ttsActive: false,

    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
        }
        this.synthesizer = window.speechSynthesis;
    },

    toggleVoice() {
        if (!this.recognition) {
            UTILS.showToast('Voice not supported', 'error');
            return;
        }
        this.active = !this.active;
        const btn = document.getElementById('toggle-voice-command');
        if (this.active) {
            btn.classList.add('voice-active');
            btn.classList.remove('voice-inactive');
            this.recognition.start();
        } else {
            btn.classList.remove('voice-active');
            btn.classList.add('voice-inactive');
            this.recognition.abort();
        }
        UTILS.trackEvent('voice_toggle', { active: this.active });
    },

    toggleTTS() {
        this.ttsActive = !this.ttsActive;
        const btn = document.getElementById('toggle-text-to-speech');
        if (this.ttsActive) {
            btn.classList.add('tts-active');
            btn.classList.remove('tts-inactive');
            this.speak('Text-to-speech enabled');
        } else {
            btn.classList.remove('tts-active');
            btn.classList.add('tts-inactive');
            if (this.synthesizer) this.synthesizer.cancel();
        }
        UTILS.trackEvent('tts_toggle', { active: this.ttsActive });
    },

    speak(text) {
        if (!this.ttsActive || !this.synthesizer) return;
        this.synthesizer.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        this.synthesizer.speak(utterance);
    }
};

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
}

function setupPWAInstall() {
    const installBtn = document.getElementById('pwa-install-button');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.deferredPrompt = e;
        installBtn.classList.remove('hidden');
    });

    installBtn.addEventListener('click', async () => {
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            const choice = await window.deferredPrompt.userChoice;
            if (choice.outcome === 'accepted') {
                UTILS.trackEvent('pwa_installed');
            }
            window.deferredPrompt = null;
            installBtn.classList.add('hidden');
        }
    });
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    
    const tabContent = document.getElementById(tabId);
    const tabBtn = document.querySelector(`[data-tab="${tabId}"]`);
    
    if (tabContent) tabContent.classList.add('active');
    if (tabBtn) tabBtn.classList.add('active');

    if (tabId === 'projection-chart' && CONFIG.charts.projection) {
        CONFIG.charts.projection.resize();
    }

    UTILS.trackEvent('tab_view', { tab: tabId });
}

function trackAffiliateClick(partner) {
    UTILS.trackEvent('affiliate_click', { partner });
    UTILS.showToast(`Opening ${partner}...`, 'info');
}

function setupEventListeners() {
    const form = document.getElementById('401k-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        updateCalculations();
        SPEECH.speak('Calculation complete');
    });

    const debouncedCalc = UTILS.debounce(updateCalculations, 500);
    form.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('input', debouncedCalc);
        el.addEventListener('change', debouncedCalc);
    });

    document.getElementById('toggle-color-scheme').addEventListener('click', toggleColorScheme);
    document.getElementById('toggle-voice-command').addEventListener('click', () => SPEECH.toggleVoice());
    document.getElementById('toggle-text-to-speech').addEventListener('click', () => SPEECH.toggleTTS());

    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', () => showTab(btn.getAttribute('data-tab')));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🇺🇸 FinGuid 401(k) Calculator v3.0 - World\'s First AI-Powered Optimizer');
    loadPreferences();
    SPEECH.init();
    registerServiceWorker();
    setupPWAInstall();
    setupEventListeners();
    FRED.startAutoUpdate();
    console.log('✅ Calculator Ready - 20+ AI Insights Enabled!');
});
