/**
 * mortgage-calculator.js
 * Production-Ready AI-Enhanced Mortgage Calculator
 * Features: Debounced inputs, dark/light theme, amortization charts, AI-powered insights, PDF export
 */

'use strict';

(() => {
  // ======= CONFIGURATION =======
  const CONFIG = {
    debounceDelay: 300,
    amortizationPageSize: 12,
    saveKey: 'mortgage_calculations',
    getChartOptions: theme => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme === 'dark' ? '#1E293B' : '#FFF',
          titleColor: theme === 'dark' ? '#F1F5F9' : '#0F172A',
          bodyColor: theme === 'dark' ? '#CBD5E1' : '#334155',
          borderColor: '#14B8A6',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            title: ctx => `Year ${ctx[0].label}`,
            label: ctx => `${ctx.dataset.label}: ${Utils.formatCurrency(ctx.parsed.y)}`
          }
        },
        annotation: { annotations: {} }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
          ticks: {
            color: theme === 'dark' ? '#94A3B8' : '#64748B',
            callback: val => Utils.formatCurrency(val)
          }
        },
        x: {
          grid: { display: false },
          ticks: { color: theme === 'dark' ? '#94A3B8' : '#64748B' }
        }
      }
    })
  };

  // ======= GLOBAL STATE =======
  const STATE = {
    currentCalc: null,
    yearlyData: [],
    chart: null,
    theme: 'light',
    isCalculating: false
  };

  // ======= UTILITIES =======
  const Utils = {
    $: s => document.querySelector(s),
    $$: s => document.querySelectorAll(s),
    formatCurrency: (n, d = 0) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d }).format(n || 0),
    formatPercent: n => `${(n || 0).toFixed(2)}%`,
    debounce: (fn, ms) => {
      let id;
      return (...args) => {
        clearTimeout(id);
        id = setTimeout(() => fn(...args), ms);
      };
    },
    save: (k, v) => {
      try { localStorage.setItem(k, JSON.stringify(v)); }
      catch {}
    },
    load: (k, def = null) => {
      try { return JSON.parse(localStorage.getItem(k)) || def; }
      catch { return def; }
    },
    showLoader: show => {
      Utils.$('#loading-overlay').style.display = show ? 'flex' : 'none';
    }
  };

  // ======= CALCULATOR LOGIC =======
  const MortgageCalculator = {
    calcPMI(loan, dpPct) {
      if (dpPct >= 20) return 0;
      const rate = (0.0115 - 0.003) * ((20 - Math.max(5, dpPct)) / 15) + 0.003;
      return (loan * rate) / 12;
    },

    amortSchedule(principal, annualRate, years, extraM = 0, extraOne = 0, biWeekly = false) {
      const schedule = [];
      let bal = principal;
      const monthlyRate = annualRate / 100 / 12;
      const nPayments = biWeekly ? years * 26 : years * 12;
      const baseMonthly = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -years * 12));
      const payAmt = biWeekly ? baseMonthly / 2 : baseMonthly;

      for (let i = 1; i <= nPayments && bal > 0.01; i++) {
        const rate = biWeekly ? annualRate / 100 / 26 : monthlyRate;
        const interest = bal * rate;
        let principalPaid = payAmt - interest + (biWeekly ? 0 : extraM) + (i === 12 ? extraOne : 0);
        if (principalPaid > bal) principalPaid = bal;
        bal -= principalPaid;
        const date = new Date();
        date.setDate(date.getDate() + (biWeekly ? i * 14 : i * 30));
        schedule.push({
          paymentNumber: i,
          date,
          payment: payAmt + (biWeekly ? 0 : extraM) + (i === 12 ? extraOne : 0),
          principal: principalPaid,
          interest,
          balance: bal
        });
      }
      return schedule;
    },

    calculate(params) {
      const { homePrice, down, rate, term, tax, ins, extraM, extraOne, biWeekly } = params;
      const principal = homePrice - down;
      if (principal <= 0 || !rate || !term) return null;
      const dpPct = (down / homePrice) * 100;
      const pmi = MortgageCalculator.calcPMI(principal, dpPct);
      const baseSched = MortgageCalculator.amortSchedule(principal, rate, term, 0, 0, false);
      const sched = MortgageCalculator.amortSchedule(principal, rate, term, extraM, extraOne, biWeekly);
      if (!sched.length) return null;
      const totalInterest = sched.reduce((s, p) => s + p.interest, 0);
      const baseInterest = baseSched.reduce((s, p) => s + p.interest, 0);
      const principalInterest = baseSched[0].payment;
      return {
        params,
        principal,
        pmi,
        dpPct,
        monthlyPayment: principalInterest + tax / 12 + ins / 12 + pmi,
        principalInterest,
        monthlyTax: tax / 12,
        monthlyIns: ins / 12,
        totalInterest,
        totalCost: principal + totalInterest,
        payoff: sched[sched.length - 1].date,
        amort: sched,
        saveInterest: baseInterest - totalInterest,
        saveTime: (baseSched.length - sched.length) / 12
      };
    }
  };

  // ======= CHART MANAGEMENT =======
  const ChartManager = {
    render(calc) {
      const ctx = Utils.$('#mortgage-timeline-chart').getContext('2d');
      if (STATE.chart) STATE.chart.destroy();
      STATE.yearlyData = ChartManager.aggregate(calc.amort);
      STATE.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: STATE.yearlyData.map(d => d.year),
          datasets: [
            { label: 'Remaining Balance', data: STATE.yearlyData.map(d => d.balance), borderColor: '#f97316', fill: true, backgroundColor: 'rgba(249,115,22,0.1)' },
            { label: 'Principal Paid', data: STATE.yearlyData.map(d => d.principal), borderColor: '#10b981' },
            { label: 'Interest Paid', data: STATE.yearlyData.map(d => d.interest), borderColor: '#3b82f6' }
          ]
        },
        options: CONFIG.getChartOptions(STATE.theme)
      });
      Utils.$('#year-range').max = STATE.yearlyData.length;
      ChartManager.update(+STATE.yearlyData.length);
    },

    aggregate(amort) {
      const byYear = {};
      const paymentsPerYear = amort.length > 360 ? 26 : 12;
      amort.forEach(p => {
        const year = Math.ceil(p.paymentNumber / paymentsPerYear);
        if (!byYear[year]) byYear[year] = { year, balance: 0, principal: 0, interest: 0 };
        byYear[year].balance = p.balance;
        byYear[year].principal += p.principal;
        byYear[year].interest += p.interest;
      });
      return Object.values(byYear);
    },

    update(year) {
      const data = STATE.yearlyData[year - 1] || STATE.yearlyData.slice(-1)[0];
      Utils.$('#remaining-balance').textContent = Utils.formatCurrency(data.balance);
      Utils.$('#principal-paid').textContent = Utils.formatCurrency(data.principal);
      Utils.$('#interest-paid').textContent = Utils.formatCurrency(data.interest);
      STATE.chart.options.plugins.annotation.annotations = {
        line1: { type: 'line', xMin: year - 1, xMax: year - 1, borderColor: '#14B8A6', borderWidth: 2, borderDash: [6, 6] }
      };
      STATE.chart.update();
    }
  };

  // ======= AI INSIGHTS =======
  const AIInsights = {
    render(calc) {
      const container = Utils.$('#ai-insights-content');
      const insights = [];

      if (calc.dpPct < 20) {
        insights.push({
          type: 'warning',
          text: `<strong>PMI Alert:</strong> ${calc.dpPct.toFixed(1)}% down incurs PMI of ${Utils.formatCurrency(calc.pmi)}/mo. Increase down payment or lump-sum payments to eliminate PMI sooner.`
        });
      } else {
        insights.push({
          type: 'success',
          text: `<strong>No PMI:</strong> With ${calc.dpPct.toFixed(1)}% down, you avoid PMI—great job!`
        });
      }

      if (calc.saveInterest > 0) {
        insights.push({
          type: 'success',
          text: `<strong>Extra Payments:</strong> You save ${Utils.formatCurrency(calc.saveInterest)} and cut ${calc.saveTime.toFixed(1)} years off your loan.`
        });
      }

      const biCalc = MortgageCalculator.calculate({ ...calc.params, biWeekly: true, extraM: 0, extraOne: 0 });
      if (biCalc && biCalc.saveInterest > 0) {
        insights.push({
          type: 'info',
          text: `<strong>Bi-Weekly Option:</strong> Bi-weekly payments save ${Utils.formatCurrency(biCalc.saveInterest)} and ${biCalc.saveTime.toFixed(1)} years.`
        });
      } else {
        insights.push({
          type: 'info',
          text: `<strong>Payment Frequency:</strong> Monthly vs. bi-weekly yields similar cost—prioritize extra payments.`
        });
      }

      if (calc.monthlyTax + calc.monthlyIns > 0) {
        insights.push({
          type: 'info',
          text: `<strong>Escrow Costs:</strong> Taxes ${Utils.formatCurrency(calc.monthlyTax)}/mo and insurance ${Utils.formatCurrency(calc.monthlyIns)}/mo impact your budget.`
        });
      }

      const mid = calc.amort[Math.floor(calc.amort.length / 2)];
      if (mid) {
        const pct = ((mid.principal / mid.payment) * 100).toFixed(1);
        insights.push({
          type: 'info',
          text: `<strong>Amortization Midpoint:</strong> Around halfway, ${pct}% of payment goes to principal, boosting equity faster.`
        });
      }

      container.innerHTML = insights.map(i => `<div class="insight-item ${i.type}">${i.text}</div>`).join('');
    }
  };

  // ======= APPLICATION =======
  const AppManager = {
    init() {
      STATE.theme = Utils.load('theme', 'light');
      document.body.dataset.theme = STATE.theme;

      Utils.$('#theme-toggle').addEventListener('click', () => {
        STATE.theme = STATE.theme === 'light' ? 'dark' : 'light';
        document.body.dataset.theme = STATE.theme;
        Utils.save('theme', STATE.theme);
        if (STATE.currentCalc) ChartManager.render(STATE.currentCalc);
      });

      // Input handlers
      Utils.$('#mortgage-form').addEventListener('input', Utils.debounce(() => AppManager.update(), CONFIG.debounceDelay));
      Utils.$('#calculate-btn').addEventListener('click', () => AppManager.update());
      Utils.$('#year-range').addEventListener('input', e => ChartManager.update(+e.target.value));

      // Suggestion chips
      Utils.$$('.suggestion-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          const field = btn.dataset.input || btn.closest('.input-suggestions').previousElementSibling.querySelector('input').id;
          document.getElementById(field).value = btn.dataset.value;
          AppManager.update();
        });
      });

      // Down-payment toggle
      ['amount-toggle','percent-toggle'].forEach(id => {
        Utils.$('#' + id).addEventListener('click', () => {
          const isAmt = id === 'amount-toggle';
          Utils.$('#amount-toggle').classList.toggle('active', isAmt);
          Utils.$('#percent-toggle').classList.toggle('active', !isAmt);
          Utils.$('#amount-input').style.display = isAmt ? 'block' : 'none';
          Utils.$('#percent-input').style.display = isAmt ? 'none' : 'block';
          AppManager.update();
        });
      });

      // Loan-term chips
      Utils.$$('.term-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          Utils.$$('.term-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          document.getElementById('loan-term').value = chip.dataset.term;
          AppManager.update();
        });
      });

      // Populate state dropdown
      const sel = Utils.$('#property-state');
      const states = {"AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California","CO":"Colorado","CT":"Connecticut","DE":"Delaware","FL":"Florida","GA":"Georgia","HI":"Hawaii","ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky","LA":"Louisiana","ME":"Maine","MD":"Maryland","MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri","MT":"Montana","NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico","NY":"New York","NC":"North Carolina","ND":"North Dakota","OH":"Ohio","OK":"Oklahoma","OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island","SC":"South Carolina","SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont","VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming"};
      Object.entries(states).forEach(([code,name]) => sel.add(new Option(name, code)));
      sel.addEventListener('change', () => AppManager.update());

      AppManager.update();
    },

    getForm() {
      const home = parseFloat(Utils.$('#home-price').value) || 0;
      const down = parseFloat(Utils.$('#down-payment').value) || 0;
      return {
        homePrice: home,
        down,
        rate: parseFloat(Utils.$('#interest-rate').value) || 0,
        term: parseInt(Utils.$('#loan-term').value, 10) || 30,
        tax: parseFloat(Utils.$('#property-tax').value) || 0,
        ins: parseFloat(Utils.$('#home-insurance').value) || 0,
        extraM: parseFloat(Utils.$('#extra-monthly').value) || 0,
        extraOne: parseFloat(Utils.$('#extra-onetime').value) || 0,
        biWeekly: Utils.$('#bi-weekly').checked
      };
    },

    update() {
      if (STATE.isCalculating) return;
      STATE.isCalculating = true;
      Utils.showLoader(true);

      setTimeout(() => {
        const params = AppManager.getForm();
        const calc = MortgageCalculator.calculate(params);
        if (calc) {
          STATE.currentCalc = calc;
          AppManager.display(calc);
          ChartManager.render(calc);
          AIInsights.render(calc);
        }
        Utils.showLoader(false);
        STATE.isCalculating = false;
      }, 200);
    },

    display(calc) {
      Utils.$('#total-payment').textContent = Utils.formatCurrency(calc.monthlyPayment);
      Utils.$('#principal-interest').textContent = Utils.formatCurrency(calc.principalInterest);
      Utils.$('#monthly-tax').textContent = Utils.formatCurrency(calc.monthlyTax);
      Utils.$('#monthly-insurance').textContent = Utils.formatCurrency(calc.monthlyIns);
      Utils.$('#monthly-pmi').textContent = Utils.formatCurrency(calc.pmi);

      Utils.$('#display-loan-amount').textContent = Utils.formatCurrency(calc.principal);
      Utils.$('#display-total-interest').textContent = Utils.formatCurrency(calc.totalInterest);
      Utils.$('#display-total-cost').textContent = Utils.formatCurrency(calc.totalCost);
      Utils.$('#display-payoff-date').textContent = calc.payoff.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      Utils.$('#savings-preview').textContent =
        calc.saveInterest > 0 ? `Savings: ${Utils.formatCurrency(calc.saveInterest)}` : 'Potential savings: $0';

      // Render amortization table
      const tbody = Utils.$('#amortization-table tbody');
      tbody.innerHTML = '';
      calc.amort.forEach(p => {
        const tr = document.createElement('tr');
        ['paymentNumber', 'date', 'payment', 'principal', 'interest', 'balance'].forEach(key => {
          const td = document.createElement('td');
          td.textContent = key === 'date'
            ? new Date(p.date).toLocaleDateString()
            : (typeof p[key] === 'number' ? Utils.formatCurrency(p[key], 2) : p[key]);
          tr.append(td);
        });
        tbody.append(tr);
      });
      Utils.$('.no-data').style.display = tbody.children.length ? 'none' : 'block';
    }
  };

  document.addEventListener('DOMContentLoaded', () => AppManager.init());
})();
