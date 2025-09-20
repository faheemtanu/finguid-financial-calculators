/**
 * mortgage-calculator.js
 * Production-Ready AI-Enhanced Mortgage Calculator
 * Features: Debounced inputs, dark/light theme support, amortization charts, AI insights, PDF export
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
  const Calculator = {
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
      const baseMonthly = biWeekly
        ? (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -years * 12))
        : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -nPayments));
      const payAmt = biWeekly ? baseMonthly / 2 : baseMonthly;

      for (let i = 1; i <= nPayments && bal > 0.01; i++) {
        const rate = biWeekly ? annualRate / 100 / 26 : monthlyRate;
        const interest = bal * rate;
        let principalPaid = payAmt - interest + (biWeekly ? 0 : extraM) + (i === 12 ? extraOne : 0);
        if (principalPaid > bal) principalPaid = bal;
        bal -= principalPaid;
        // Determine payment date relative to today
        const date = new Date();
        date.setDate(date.getDate() + (biWeekly ? i * 14 : i * 30));
        schedule.push({ i, date, payment: payAmt + (biWeekly ? 0 : extraM) + (i === 12 ? extraOne : 0), principal: principalPaid, interest, balance: bal });
      }
      return schedule;
    },

    calculate(params) {
      const { homePrice, down, rate, term, tax, ins, extraM, extraOne, biWeekly } = params;
      const principal = homePrice - down;
      if (principal <= 0 || !rate || !term) return null;
      const dpPct = (down / homePrice) * 100;
      const pmi = Calculator.calcPMI(principal, dpPct);
      const baseSched = Calculator.amortSchedule(principal, rate, term, 0, 0, false);
      const sched = Calculator.amortSchedule(principal, rate, term, extraM, extraOne, biWeekly);
      if (!sched.length) return null;
      const totalInterest = sched.reduce((s, p) => s + p.interest, 0);
      const baseInterest = baseSched.reduce((s, p) => s + p.interest, 0);
      const principalInterest = baseSched[0].payment;
      return {
        params, principal, pmi,
        monthlyPayment: principalInterest + tax / 12 + ins / 12 + pmi,
        principalInterest, monthlyTax: tax / 12, monthlyIns: ins / 12,
        totalInterest, totalCost: principal + totalInterest,
        payoff: sched[sched.length - 1].date,
        amort: sched,
        saveInterest: baseInterest - totalInterest,
        saveTime: (baseSched.length - sched.length) / 12,
        dpPct
      };
    }
  };

  // ======= CHART =======
  const ChartMgr = {
    render(calc) {
      const ctx = Utils.$('#mortgage-timeline-chart').getContext('2d');
      if (STATE.chart) STATE.chart.destroy();
      STATE.yearlyData = ChartMgr._aggregate(calc.amort);
      STATE.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: STATE.yearlyData.map(d => d.year),
          datasets: [
            { label: 'Balance', data: STATE.yearlyData.map(d => d.balance), borderColor: '#f97316', fill: true, backgroundColor: 'rgba(249,115,22,0.1)' },
            { label: 'Principal Paid', data: STATE.yearlyData.map(d => d.principal), borderColor: '#10b981' },
            { label: 'Interest Paid', data: STATE.yearlyData.map(d => d.interest), borderColor: '#3b82f6' }
          ]
        },
        options: CONFIG.getChartOptions(STATE.theme)
      });
      Utils.$('#year-range').max = STATE.yearlyData.length;
      ChartMgr.update(+STATE.yearlyData.length);
    },
    _aggregate(arr) {
      const years = [], byYear = {};
      arr.forEach(p => {
        const year = Math.ceil(p.i / (arr.length > 360 ? 26 : 12));
        if (!byYear[year]) byYear[year] = { year, balance: 0, principal: 0, interest: 0 };
        byYear[year].balance = p.balance;
        byYear[year].principal += p.principal;
        byYear[year].interest += p.interest;
      });
      return Object.values(byYear);
    },
    update(year) {
      const d = STATE.yearlyData[year - 1] || STATE.yearlyData.slice(-1)[0];
      Utils.$('#remaining-balance').textContent = Utils.formatCurrency(d.balance);
      Utils.$('#principal-paid').textContent = Utils.formatCurrency(d.principal);
      Utils.$('#interest-paid').textContent = Utils.formatCurrency(d.interest);
      STATE.chart.options.plugins.annotation.annotations = {
        line1: { type: 'line', xMin: year - 1, xMax: year - 1, borderColor: '#14B8A6', borderWidth: 2, borderDash: [6, 6] }
      };
      STATE.chart.update();
    }
  };

  // ======= AI INSIGHTS =======
  const AI = {
    render(calc) {
      const container = Utils.$('#ai-insights-content');
      const insights = [];
      if (calc.dpPct < 20) {
        insights.push(`⚠️ PMI Alert: ${calc.dpPct.toFixed(1)}% down pays PMI ${Utils.formatCurrency(calc.pmi)}/mo.`);
      } else {
        insights.push(`✅ No PMI: ${calc.dpPct.toFixed(1)}% down avoids PMI.`);
      }
      if (calc.saveInterest > 0) {
        insights.push(`💡 Extra payments save ${Utils.formatCurrency(calc.saveInterest)} and ${calc.saveTime.toFixed(1)} years.`);
      }
      container.innerHTML = insights.map(txt => `<div class="insight-item">${txt}</div>`).join('');
    }
  };

  // ======= APP =======
  const App = {
    init() {
      STATE.theme = Utils.load('theme', 'light');
      document.body.dataset.theme = STATE.theme;
      Utils.$('#theme-toggle').addEventListener('click', () => {
        STATE.theme = STATE.theme === 'light' ? 'dark' : 'light';
        document.body.dataset.theme = STATE.theme;
        Utils.save('theme', STATE.theme);
        if (STATE.currentCalc) ChartMgr.render(STATE.currentCalc);
      });

      Utils.$('#mortgage-form').addEventListener('input', Utils.debounce(() => App.update(), CONFIG.debounceDelay));
      Utils.$('#calculate-btn').addEventListener('click', () => App.update());
      Utils.$('#year-range').addEventListener('input', e => ChartMgr.update(+e.target.value));

      // Initial run
      App.update();
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
        const params = App.getForm();
        const calc = Calculator.calculate(params);
        if (calc) {
          STATE.currentCalc = calc;
          App.display(calc);
          ChartMgr.render(calc);
          AI.render(calc);
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
    }
  };

  document.addEventListener('DOMContentLoaded', () => App.init());
})();
