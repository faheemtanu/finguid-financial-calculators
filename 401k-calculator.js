/**
 * 401(k) CALCULATOR — AI-POWERED RETIREMENT OPTIMIZER - PRODUCTION JS v2.0
 * FinGuid USA - Enhanced AI Insights Edition
 */

const CONFIG = {
    VERSION: '2.0',
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
/* ENHANCED AI INSIGHTS ENGINE - 15+ RECOMMENDATIONS */
/* ========================================================================== */

function generateAIInsights() {
    const { inputs, firstYear, totals, projectionSchedule } = CONFIG.calculation;
    const contentBox = document.getElementById('ai-insights-content');
    if (!contentBox) return;

    let html = '';
    const insights = [];

    // 1. Missing Match Detection (HIGH PRIORITY)
    const missedMatch = inputs.contributionPercent < inputs.matchUpToPercent;
    if (missedMatch) {
        const potentialMatch = Math.min(inputs.annualSalary * inputs.matchUpToPercent, inputs.annualSalary * inputs.matchUpToPercent) * inputs.employerMatchPercent;
        const missed = potentialMatch - (firstYear.match || 0);
        html += `
            <div class="recommendation-alert high-priority">
                <i class="fas fa-exclamation-triangle"></i> CRITICAL: You're Leaving Free Money on the Table!
            </div>
            <p><strong>Your Current Contribution:</strong> ${(inputs.contributionPercent * 100).toFixed(1)}% of salary (${UTILS.formatCurrency(firstYear.contrib || 0)}/year)</p>
            <p><strong>Employer Matches Up To:</strong> ${(inputs.matchUpToPercent * 100).toFixed(1)}% of salary</p>
            <p>By increasing your contribution to <strong>${(inputs.matchUpToPercent * 100).toFixed(1)}%</strong>, you would receive an additional <strong>${UTILS.formatCurrency(missed)}</strong> per year in employer matching funds. That's <strong>${UTILS.formatCurrency(missed * (inputs.retirementAge - inputs.currentAge))}</strong> in total free money over your career!</p>
        `;
    } else {
        html += `
            <div class="recommendation-alert low-priority">
                <i class="fas fa-check-circle"></i> Excellent: Full Employer Match Captured!
            </div>
            <p>You're maximizing your employer match at <strong>${(inputs.contributionPercent * 100).toFixed(1)}%</strong>, receiving <strong>${UTILS.formatCurrency(firstYear.match || 0)}</strong> per year. This is a critical component of a solid retirement strategy.</p>
        `;
    }

    // 2. Retirement Readiness
    const yearsToRetire = inputs.retirementAge - inputs.currentAge;
    const monthlySpendNeeded = totals.finalBalance / (35 * 12); // Assuming 35-year retirement, 4% rule
    html += `
        <div class="ai-insight-item priority-low">
            <h4><i class="fas fa-chart-pie"></i> Retirement Readiness</h4>
            <p>In <strong>${yearsToRetire} years</strong>, you'll have <strong>${UTILS.formatCurrency(totals.finalBalance, 0)}</strong> saved for retirement. Using the 4% rule, this could support approximately <strong>${UTILS.formatCurrency(monthlySpendNeeded, 0)}/month</strong> in retirement withdrawals.</p>
        </div>
    `;

    // 3. Annual Tax Savings
    const rate = getEffectiveTaxRate(inputs.annualSalary, inputs.filingStatus);
    const savings = (firstYear.contrib || 0) * rate;
    html += `
        <div class="ai-insight-item priority-low">
            <h4><i class="fas fa-receipt"></i> Federal Tax Benefits</h4>
            <p>Your 401(k) contributions reduce your taxable income. At your <strong>${(rate * 100).toFixed(1)}% tax rate</strong>, you'll save approximately <strong>${UTILS.formatCurrency(savings, 0)}</strong> in federal taxes annually.</p>
        </div>
    `;

    // 4. Catch-Up Strategy (for 50+)
    if (inputs.currentAge >= 50) {
        if (!inputs.includeCatchUp) {
            html += `
                <div class="recommendation-alert medium-priority">
                    <i class="fas fa-birthday-cake"></i> Catch-Up Opportunity (Age 50+)
                </div>
                <p>You're age <strong>${inputs.currentAge}</strong> and eligible to make catch-up contributions of up to <strong>${UTILS.formatCurrency(CONFIG.CATCHUP_LIMIT)}</strong> annually. This is a tax-advantaged way to accelerate your retirement savings in your final working years. <strong>Enable this option above to boost your projection!</strong></p>
            `;
        } else {
            html += `
                <div class="ai-insight-item priority-low">
                    <h4><i class="fas fa-rocket"></i> Catch-Up Strategy Active</h4>
                    <p>You're maximizing catch-up contributions with an additional <strong>${UTILS.formatCurrency(CONFIG.CATCHUP_LIMIT)}</strong> annually. This accelerated savings rate will significantly boost your retirement balance.</p>
                </div>
            `;
        }
    }

    // 5. Salary Growth Impact
    const salaryAtRetirement = projectionSchedule[projectionSchedule.length - 1]?.salary || inputs.annualSalary;
    const projectedSalaryGrowth = ((salaryAtRetirement / inputs.annualSalary) - 1) * 100;
    html += `
        <div class="ai-insight-item priority-low">
            <h4><i class="fas fa-arrow-trend-up"></i> Salary Growth Impact</h4>
            <p>With an assumed <strong>${(inputs.salaryIncrease * 100).toFixed(1)}%</strong> annual salary increase, your salary is projected to grow to <strong>${UTILS.formatCurrency(salaryAtRetirement, 0)}</strong> by retirement, an increase of <strong>${projectedSalaryGrowth.toFixed(1)}%</strong>. This compounds your 401(k) contributions significantly.</p>
        </div>
    `;

    // 6. Employer Match Value
    const totalMatchEarned = totals.totalMatch;
    html += `
        <div class="ai-insight-item priority-low">
            <h4><i class="fas fa-gift"></i> Employer Match Value</h4>
            <p>Over your career, your employer will contribute <strong>${UTILS.formatCurrency(totalMatchEarned, 0)}</strong> in matching funds. This is <strong>100% free money</strong> that grows tax-deferred until retirement!</p>
        </div>
    `;

    // 7. Investment Returns Power
    html += `
        <div class="ai-insight-item priority-low">
            <h4><i class="fas fa-chart-line"></i> Power of Compound Growth</h4>
            <p>Your projected investment gains are <strong>${UTILS.formatCurrency(totals.totalGains, 0)}</strong>, representing <strong>${((totals.totalGains / (totals.totalContrib + totals.totalMatch)) * 100).toFixed(1)}%</strong> growth on your contributions. This demonstrates the power of long-term investing with a <strong>${(inputs.rateOfReturn * 100).toFixed(1)}%</strong> annual return assumption.</p>
        </div>
    `;

    // 8. Inflation Consideration
    if (inputs.includeInflation) {
        html += `
            <div class="ai-insight-item priority-low">
                <h4><i class="fas fa-percent"></i> Inflation-Adjusted Returns</h4>
                <p>You've enabled inflation adjustment using live FRED data (current: ${(CONFIG.liveInflationRate * 100).toFixed(2)}% YoY). Your projected balance in <strong>today's dollars</strong> is more conservative but realistic for retirement planning.</p>
            </div>
        `;
    }

    // 9. Contribution Acceleration
    html += `
        <div class="ai-insight-item priority-medium">
            <h4><i class="fas fa-fast-forward"></i> Contribution Acceleration Strategy</h4>
            <p>Consider increasing your contribution percentage by <strong>1-2%</strong> annually. Each increase compounds your gains while you may not feel the paycheck reduction.</p>
        </div>
    `;

    // 10. First-Year Milestone
    html += `
        <div class="ai-insight-item priority-low">
            <h4><i class="fas fa-milestone"></i> First-Year Milestone</h4>
            <p><strong>Year 1 Contribution Total:</strong> ${UTILS.formatCurrency((firstYear.contrib || 0) + (firstYear.match || 0), 0)} (Your: ${UTILS.formatCurrency(firstYear.contrib || 0)}, Employer: ${UTILS.formatCurrency(firstYear.match || 0)})</p>
        </div>
    `;

    // 11. IRS Limits
    html += `
        <div class="ai-insight-item priority-low">
            <h4><i class="fas fa-info-circle"></i> 2024 IRS Contribution Limits</h4>
            <p><strong>Regular Limit:</strong> ${UTILS.formatCurrency(CONFIG.IRS_LIMIT)} | <strong>Catch-Up (50+):</strong> +${UTILS.formatCurrency(CONFIG.CATCHUP_LIMIT)}</p>
        </div>
    `;

    // 12. Retirement Income Goal
    const percentOfCurrentSalary = (monthlySpendNeeded * 12 / inputs.annualSalary) * 100;
    if (percentOfCurrentSalary < 70) {
        html += `
            <div class="recommendation-alert medium-priority">
                <i class="fas fa-warning"></i> Retirement Income Gap
            </div>
            <p>Your 401(k) alone may provide only <strong>${percentOfCurrentSalary.toFixed(0)}%</strong> of your current income. Consider: Social Security, pensions, other investments, or part-time work to reach your retirement goal.</p>
        `;
    } else {
        html += `
            <div class="ai-insight-item priority-low">
                <h4><i class="fas fa-check"></i> Strong Retirement Position</h4>
                <p>Your 401(k) is projected to provide <strong>${percentOfCurrentSalary.toFixed(0)}%</strong> of your current income, plus Social Security benefits will supplement your retirement lifestyle.</p>
            </div>
        `;
    }

    // 13. Action Items Summary
    html += `
        <div class="recommendation-alert low-priority" style="margin-top: 24px;">
            <i class="fas fa-tasks"></i> Action Items Summary
        </div>
        <ul style="margin: 16px 0 16px 24px; line-height: 2;">
            <li>✅ Your contribution: <strong>${(inputs.contributionPercent * 100).toFixed(1)}%</strong> | ${missedMatch ? `⚠️ Increase to <strong>${(inputs.matchUpToPercent * 100).toFixed(1)}%</strong> to capture full match` : '✓ Full match captured'}</li>
            <li>✅ Employer match: <strong>${(inputs.employerMatchPercent * 100).toFixed(0)}%</strong> up to <strong>${(inputs.matchUpToPercent * 100).toFixed(1)}%</strong> of salary</li>
            <li>${inputs.currentAge >= 50 && !inputs.includeCatchUp ? `⚠️ Consider enabling catch-up contributions` : `✓ Catch-up: ${inputs.includeCatchUp ? 'Enabled' : 'N/A (under 50)'}`}</li>
            <li>✅ Expected retirement age: <strong>${inputs.retirementAge}</strong> (in ${yearsToRetire} years)</li>
            <li>✅ Annual tax savings: <strong>${UTILS.formatCurrency(savings, 0)}</strong></li>
            <li>✅ Projected balance: <strong>${UTILS.formatCurrency(totals.finalBalance, 0)}</strong></li>
        </ul>
    `;

    // 14. Smart Tips
    html += `
        <div class="ai-insight-item priority-low">
            <h4><i class="fas fa-lightbulb"></i> Smart Retirement Tips</h4>
            <p>• Increase contributions by 1% each year with raises<br>
            • Review your investment allocation annually<br>
            • Diversify across stocks, bonds, and stable value funds<br>
            • Don't cash out or loan from your 401(k) early<br>
            • Roll over old 401(k)s when changing jobs<br>
            • Consider meeting with a financial advisor</p>
        </div>
    `;

    // 15. Partner Services
    html += `
        <div style="margin-top: 24px; padding: 16px; background: rgba(36, 172, 185, 0.1); border-radius: 8px; border-left: 4px solid rgb(36, 172, 185);">
            <h4 style="color: rgb(19, 52, 59); margin-bottom: 12px;"><i class="fas fa-handshake"></i> Get Professional Help</h4>
            <p style="font-size: 0.95rem; margin: 0;">Our partner services can help you optimize your retirement strategy:</p>
            <ul style="margin: 12px 0 12px 24px; font-size: 0.9rem;">
                <li><a href="#" onclick="trackAffiliateClick('robo'); return false;" class="affiliate-cta">Compare Robo-Advisors</a> for automated portfolio management</li>
                <li><a href="#" onclick="trackAffiliateClick('advisor'); return false;" class="affiliate-cta">Find a Financial Advisor</a> for personalized planning</li>
                <li><a href="#" onclick="trackAffiliateClick('hysa'); return false;" class="affiliate-cta">High-Yield Savings</a> for emergency funds</li>
                <li><a href="#" onclick="trackAffiliateClick('rollover'); return false;" class="affiliate-cta">401(k) Rollover Service</a> for job changes</li>
            </ul>
        </div>
    `;

    contentBox.innerHTML = html;
}

function toggleColorScheme() {
    const html = document.documentElement;
    const scheme = html.getAttribute('data-color-scheme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-color-scheme', scheme);
    try {
        localStorage.setItem('colorScheme', scheme);
    } catch (e) {}
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
            UTILS.showToast('Voice not supported in your browser', 'error');
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
            this.speak('Text to speech enabled');
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
    if (tabBtn) {
        tabBtn.classList.add('active');
        tabBtn.setAttribute('aria-selected', 'true');
    }

    if (tabId === 'projection-chart' && CONFIG.charts.projection) {
        CONFIG.charts.projection.resize();
    }

    UTILS.trackEvent('tab_view', { tab: tabId });
}

function trackAffiliateClick(partner) {
    UTILS.trackEvent('affiliate_click', { partner });
    UTILS.showToast(`Opening ${partner} partner...`, 'info');
}

function setupEventListeners() {
    const form = document.getElementById('401k-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        updateCalculations();
        SPEECH.speak('Calculation complete. Check your results on the right.');
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
    console.log('🇺🇸 FinGuid 401(k) Calculator v2.0 initializing...');
    loadPreferences();
    SPEECH.init();
    registerServiceWorker();
    setupPWAInstall();
    setupEventListeners();
    FRED.startAutoUpdate();
    console.log('✅ Calculator ready!');
});
